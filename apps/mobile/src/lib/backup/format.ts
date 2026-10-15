/**
 * Backup object format, version 1 (F08 6.5 "Object format", R2 AR-08,
 * AR-33, AR-34; ADR 0023 section 3). The only definition of the bytes; the
 * escrow function never reads objects, so nothing else parses them.
 *
 *   object = header (112 bytes, in clear) || meta segment || data segments
 *
 *   header = stream header (48) || key block (64)
 *     stream header: magic "SCRB" (4) | format version 1 (1) | segment size u32 (4)
 *                    | entry id (16) | author id (16) | nonce prefix (7)
 *     key block:     book key version u32 (4) | wrapped file key (60:
 *                    AES-256-GCM nonce 12, ciphertext 32, tag 16)
 *
 *   segment i      = AES-256-GCM(file key, nonce_i, plaintext_i, aad = stream header)
 *   nonce_i        = nonce prefix (7) || i as u32 BE (4) || last flag (1: 0x01 on the final segment)
 *   segment 0      = meta: SHA-256 of the original (32) || original length u64 BE (8); never last
 *   segments 1..n  = the original in pieces of `segment size` bytes; n >= 1; the last may be short or empty
 *
 *   wrap aad       = "scribe/backup/v1/file-key" || entry id || author id || key version u32
 *
 * Why this shape:
 * - Streaming: a 64 KiB segment is sealed, written and forgotten, so a long take
 *   never sits in memory, and a resumed upload can re-create the same bytes.
 * - Truncation and reordering fail: the counter is in every nonce and only the
 *   final segment carries the last flag (the STREAM construction of Hoang,
 *   Reyhanitabar, Rogaway and Vizar, as used by Tink and age).
 * - The original's hash is inside segment 0, never in clear (R2 AR-34). The
 *   server keeps only the ciphertext's hash for transfer checks.
 * - The child id is in no AAD, and the key block is outside the segments' AAD,
 *   so moving a letter to another book rewraps one 32-byte key and keeps every
 *   segment (F08 6.5 E; `replaceKeyBlock`).
 * - Deterministic given (key block, nonce prefix, original): after a kill the
 *   queue rebuilds byte-identical ciphertext from what it persisted, so a resumed
 *   upload never mixes two encryptions (queue.ts).
 */
import { concat, equalBytes, readU32be, readU64be, u32be, u64be, utf8ToBytes, uuidToBytes, bytesToUuid } from './bytes';
import type { Aead, ByteSink, ByteSource } from './ports';

export const MAGIC = new Uint8Array([0x53, 0x43, 0x52, 0x42]); // "SCRB": the codename, never the public name
export const FORMAT_VERSION = 1;
export const SEGMENT_SIZE = 64 * 1024;
export const NONCE_PREFIX_LEN = 7;
export const TAG_LEN = 16;
export const KEY_LEN = 32;
export const WRAP_LEN = 12 + KEY_LEN + TAG_LEN; // 60
export const STREAM_HEADER_LEN = 4 + 1 + 4 + 16 + 16 + NONCE_PREFIX_LEN; // 48
export const KEY_BLOCK_LEN = 4 + WRAP_LEN; // 64
export const HEADER_LEN = STREAM_HEADER_LEN + KEY_BLOCK_LEN; // 112
export const META_PLAIN_LEN = 32 + 8;
export const META_SEALED_LEN = META_PLAIN_LEN + TAG_LEN;

const WRAP_LABEL = utf8ToBytes('scribe/backup/v1/file-key');

/** Why an object was refused. Codes only: never bytes, ids or paths (LEGAL-REQ-014). */
export class BackupFormatError extends Error {
  constructor(readonly code: 'bad_magic' | 'bad_version' | 'bad_header' | 'bad_segment' | 'truncated' | 'trailing' | 'length') {
    super(`backup_format_${code}`);
  }
}

export interface StreamHeader {
  entryId: string;
  authorId: string;
  noncePrefix: Uint8Array;
  segmentSize: number;
}

export interface KeyBlock {
  keyVersion: number;
  /** The file key wrapped under the book key (60 bytes). Also stored in `audio_blobs.wrapped_file_key`. */
  wrapped: Uint8Array;
}

export interface ObjectHeader extends StreamHeader, KeyBlock {
  /** The 48 bytes every segment authenticates. */
  streamBytes: Uint8Array;
}

/** AAD for wrapping a recording's file key under the author's book key. */
export function wrapAad(entryId: string, authorId: string, keyVersion: number): Uint8Array {
  return concat(WRAP_LABEL, uuidToBytes(entryId), uuidToBytes(authorId), u32be(keyVersion));
}

export function encodeStreamHeader(h: StreamHeader): Uint8Array {
  if (h.noncePrefix.length !== NONCE_PREFIX_LEN) throw new BackupFormatError('bad_header');
  return concat(MAGIC, new Uint8Array([FORMAT_VERSION]), u32be(h.segmentSize), uuidToBytes(h.entryId), uuidToBytes(h.authorId), h.noncePrefix);
}

export function encodeKeyBlock(k: KeyBlock): Uint8Array {
  if (k.wrapped.length !== WRAP_LEN) throw new BackupFormatError('bad_header');
  return concat(u32be(k.keyVersion), k.wrapped);
}

export function parseHeader(bytes: Uint8Array): ObjectHeader {
  if (bytes.length < HEADER_LEN) throw new BackupFormatError('truncated');
  if (!equalBytes(bytes.subarray(0, 4), MAGIC)) throw new BackupFormatError('bad_magic');
  if (bytes[4] !== FORMAT_VERSION) throw new BackupFormatError('bad_version');
  const segmentSize = readU32be(bytes, 5);
  if (segmentSize !== SEGMENT_SIZE) throw new BackupFormatError('bad_header');
  const keyVersion = readU32be(bytes, STREAM_HEADER_LEN);
  if (keyVersion < 1) throw new BackupFormatError('bad_header');
  return {
    entryId: bytesToUuid(bytes.slice(9, 25)),
    authorId: bytesToUuid(bytes.slice(25, 41)),
    noncePrefix: bytes.slice(41, 48),
    segmentSize,
    keyVersion,
    wrapped: bytes.slice(STREAM_HEADER_LEN + 4, HEADER_LEN),
    streamBytes: bytes.slice(0, STREAM_HEADER_LEN),
  };
}

/** The new header for a letter moved to another book: same stream header, new key block (F08 6.5 E). */
export function replaceKeyBlock(header: Uint8Array, k: KeyBlock): Uint8Array {
  parseHeader(header);
  return concat(header.subarray(0, STREAM_HEADER_LEN), encodeKeyBlock(k));
}

export function segmentNonce(prefix: Uint8Array, index: number, last: boolean): Uint8Array {
  return concat(prefix, u32be(index), new Uint8Array([last ? 1 : 0]));
}

/** Number of data segments for an original of `length` bytes (at least one, so the last flag always exists). */
export function dataSegments(length: number, segmentSize = SEGMENT_SIZE): number {
  return Math.max(1, Math.ceil(length / segmentSize));
}

/** Exact object size for an original of `length` bytes; `backup_begin` reports it for the quota. */
export function objectLength(length: number, segmentSize = SEGMENT_SIZE): number {
  return HEADER_LEN + META_SEALED_LEN + length + dataSegments(length, segmentSize) * TAG_LEN;
}

export interface EncryptInput {
  stream: StreamHeader;
  keyBlock: KeyBlock;
  fileKey: Uint8Array;
  /** SHA-256 of the original, 32 bytes: goes inside segment 0. */
  plainSha256: Uint8Array;
  plainLength: number;
  source: ByteSource;
  sink: ByteSink;
  aead: Aead;
  /** Checked between segments; return false to stop (a recording started). Throws `BackupStopped`. */
  keepGoing?: () => boolean;
}

export class BackupStopped extends Error {
  constructor() {
    super('backup_stopped');
  }
}

/** Writes the whole object to `sink`. Returns its length. Reads the original exactly once, front to back. */
export async function encryptObject(x: EncryptInput): Promise<number> {
  if (x.fileKey.length !== KEY_LEN || x.plainSha256.length !== 32) throw new BackupFormatError('bad_header');
  const streamBytes = encodeStreamHeader(x.stream);
  const size = x.stream.segmentSize;
  let written = 0;
  const put = (b: Uint8Array) => {
    x.sink.write(b);
    written += b.length;
  };
  put(streamBytes);
  put(encodeKeyBlock(x.keyBlock));
  const meta = concat(x.plainSha256, u64be(x.plainLength));
  put(await x.aead.seal(x.fileKey, segmentNonce(x.stream.noncePrefix, 0, false), meta, streamBytes));
  const n = dataSegments(x.plainLength, size);
  let seen = 0;
  for (let i = 1; i <= n; i++) {
    if (x.keepGoing && !x.keepGoing()) throw new BackupStopped();
    const want = i < n ? size : x.plainLength - seen;
    const chunk = x.source.read(want);
    if (chunk.length !== want) throw new BackupFormatError('length'); // the original changed under us
    seen += chunk.length;
    put(await x.aead.seal(x.fileKey, segmentNonce(x.stream.noncePrefix, i, i === n), chunk, streamBytes));
  }
  if (x.source.read(1).length !== 0) throw new BackupFormatError('length');
  return written;
}

export interface DecryptResult {
  plainSha256: Uint8Array;
  plainLength: number;
}

/**
 * Reads the segments after a parsed header, writes the original to `sink`.
 * Fails on any tampering, truncation, reordering or trailing bytes. The
 * caller must still check the written file's SHA-256 against `plainSha256`
 * (restore.ts does, and against the letter's own hash).
 */
export async function decryptBody(
  header: ObjectHeader,
  fileKey: Uint8Array,
  source: ByteSource,
  sink: ByteSink,
  aead: Aead,
): Promise<DecryptResult> {
  const open = async (sealed: Uint8Array, index: number, last: boolean) => {
    try {
      return await aead.open(fileKey, segmentNonce(header.noncePrefix, index, last), sealed, header.streamBytes);
    } catch {
      throw new BackupFormatError('bad_segment');
    }
  };
  const metaSealed = source.read(META_SEALED_LEN);
  if (metaSealed.length !== META_SEALED_LEN) throw new BackupFormatError('truncated');
  const meta = await open(metaSealed, 0, false);
  const plainSha256 = meta.slice(0, 32);
  const plainLength = readU64be(meta, 32);
  const n = dataSegments(plainLength, header.segmentSize);
  let seen = 0;
  for (let i = 1; i <= n; i++) {
    const want = (i < n ? header.segmentSize : plainLength - seen) + TAG_LEN;
    const sealed = source.read(want);
    if (sealed.length !== want) throw new BackupFormatError('truncated');
    const plain = await open(sealed, i, i === n);
    seen += plain.length;
    sink.write(plain);
  }
  if (seen !== plainLength) throw new BackupFormatError('length');
  if (source.read(1).length !== 0) throw new BackupFormatError('trailing');
  return { plainSha256, plainLength };
}
