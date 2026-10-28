/// <reference types="node" />
/**
 * Backup object format v1 (lib/backup/format.ts; F08 6.5 "Object format";
 * ADR 0024 section 3). The original is random bytes behind a real `ftyp` box
 * (fakeM4a), so the plaintext scan looks for what a proxy capture would.
 */
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { bytesToHex, concat, hexToBytes } from '../src/lib/backup/bytes';
import {
  BackupFormatError,
  HEADER_LEN,
  KEY_BLOCK_LEN,
  META_SEALED_LEN,
  SEGMENT_SIZE,
  STREAM_HEADER_LEN,
  TAG_LEN,
  dataSegments,
  decryptBody,
  encryptObject,
  objectLength,
  parseHeader,
  replaceKeyBlock,
  wrapAad,
} from '../src/lib/backup/format';
import type { ByteSink, ByteSource } from '../src/lib/backup/ports';
import { fakeM4a, nodeAead, nodeVault, sha256Hex } from './helpers/backup-node';

const MAMA = '11111111-1111-4111-8111-111111111111';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const ASHA_NEW_BOOK = 'a5a5a5a5-0000-4000-8000-000000000002';
const LETTER = '01928c3e-5a2b-7c3d-8e4f-000000000001';

function memSource(b: Uint8Array): ByteSource {
  let at = 0;
  return {
    read(n) {
      const out = b.slice(at, at + n);
      at += out.length;
      return out;
    },
    close() {},
  };
}

function memSink(): ByteSink & { bytes: () => Uint8Array } {
  const parts: Uint8Array[] = [];
  return { write: (b) => void parts.push(b.slice()), close() {}, bytes: () => concat(...parts) };
}

async function seal(plain: Uint8Array, opts: { fileKey?: Uint8Array; prefix?: Uint8Array } = {}) {
  const vault = nodeVault({ icloud: null });
  const ref = { profileId: MAMA, childId: ASHA };
  await vault.createBookKey(ref, 1);
  const fileKey = opts.fileKey ?? new Uint8Array(randomBytes(32));
  const wrapped = await vault.wrapFileKey(ref, 1, fileKey, wrapAad(LETTER, MAMA, 1));
  const prefix = opts.prefix ?? new Uint8Array(randomBytes(7));
  const sink = memSink();
  const n = await encryptObject({
    stream: { entryId: LETTER, authorId: MAMA, noncePrefix: prefix, segmentSize: SEGMENT_SIZE },
    keyBlock: { keyVersion: 1, wrapped },
    fileKey,
    plainSha256: hexToBytes(sha256Hex(plain)),
    plainLength: plain.length,
    source: memSource(plain),
    sink,
    aead: nodeAead,
  });
  return { vault, ref, fileKey, wrapped, prefix, bytes: sink.bytes(), n };
}

async function open(object: Uint8Array, fileKey: Uint8Array) {
  const header = parseHeader(object.subarray(0, HEADER_LEN));
  const sink = memSink();
  const r = await decryptBody(header, fileKey, memSource(object.subarray(HEADER_LEN)), sink, nodeAead);
  return { header, plain: sink.bytes(), ...r };
}

async function refusal(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'accepted';
  } catch (e) {
    return e instanceof BackupFormatError ? e.code : 'other';
  }
}

describe('[F08-REQ-020] object format v1: header, 64 KiB AES-256-GCM segments, hash inside', () => {
  it('round-trips at every segment boundary and the size is exact', async () => {
    for (const len of [0, 1, SEGMENT_SIZE - 1, SEGMENT_SIZE, SEGMENT_SIZE + 1, 3 * SEGMENT_SIZE + 5]) {
      const plain = fakeM4a(len);
      const s = await seal(plain);
      expect(s.bytes.length, String(len)).toBe(objectLength(len));
      expect(s.n).toBe(s.bytes.length);
      expect(s.bytes.length).toBe(HEADER_LEN + META_SEALED_LEN + len + dataSegments(len) * TAG_LEN);
      const o = await open(s.bytes, s.fileKey);
      expect(bytesToHex(o.plain)).toBe(bytesToHex(plain));
      expect(bytesToHex(o.plainSha256)).toBe(sha256Hex(plain));
      expect(o.plainLength).toBe(len);
      expect(o.header).toMatchObject({ entryId: LETTER, authorId: MAMA, keyVersion: 1 });
    }
  });

  it('the header is self-describing: 48 bytes of stream header, then the key block', async () => {
    const s = await seal(fakeM4a(1000));
    expect(Buffer.from(s.bytes.subarray(0, 4)).toString('ascii')).toBe('SCRB');
    expect(STREAM_HEADER_LEN + KEY_BLOCK_LEN).toBe(HEADER_LEN);
    const h = parseHeader(s.bytes);
    expect(bytesToHex(h.wrapped)).toBe(bytesToHex(s.wrapped));
    expect(bytesToHex(h.noncePrefix)).toBe(bytesToHex(s.prefix));
  });

  it('contains no ftyp box, no plaintext hash and no file key (what a proxy would see)', async () => {
    const plain = fakeM4a(3 * SEGMENT_SIZE);
    const s = await seal(plain);
    const hay = Buffer.from(s.bytes);
    // The ftyp box is the recording's own first 16 bytes (size, "ftyp", major brand, minor version), not the 4 letters:
    // any 4 bytes of ciphertext equal "ftyp" by chance (1 in 2^32 per byte), 16 bytes cannot (2^-128).
    const start = plain.subarray(0, 16);
    expect(start.subarray(4, 8).toString('latin1'), 'the fixture starts with an ftyp box').toBe('ftyp');
    expect(hay.includes(start), 'the sealed object carries the start of the recording').toBe(false);
    expect(hay.includes(Buffer.from(sha256Hex(plain), 'hex'))).toBe(false);
    expect(hay.includes(Buffer.from(sha256Hex(plain)))).toBe(false);
    expect(hay.includes(Buffer.from(s.fileKey))).toBe(false);
    expect(hay.includes(Buffer.from(plain.subarray(1000, 1064)))).toBe(false);
  });

  it('is deterministic for a saved key block and nonce prefix (a resumed upload sends the same bytes)', async () => {
    const plain = fakeM4a(2 * SEGMENT_SIZE + 9);
    const a = await seal(plain);
    const vault = a.vault;
    const fileKey = await vault.unwrapFileKey(a.ref, 1, a.wrapped, wrapAad(LETTER, MAMA, 1));
    const sink = memSink();
    await encryptObject({
      stream: { entryId: LETTER, authorId: MAMA, noncePrefix: a.prefix, segmentSize: SEGMENT_SIZE },
      keyBlock: { keyVersion: 1, wrapped: a.wrapped },
      fileKey,
      plainSha256: hexToBytes(sha256Hex(plain)),
      plainLength: plain.length,
      source: memSource(plain),
      sink,
      aead: nodeAead,
    });
    expect(sha256Hex(sink.bytes())).toBe(sha256Hex(a.bytes));
  });
});

describe('[F08-REQ-020] a reordered, truncated or changed object fails', () => {
  it('a flipped byte in any segment fails', async () => {
    const s = await seal(fakeM4a(2 * SEGMENT_SIZE + 100));
    for (const at of [HEADER_LEN + 3, HEADER_LEN + META_SEALED_LEN + 10, s.bytes.length - 1]) {
      const bad = s.bytes.slice();
      bad[at] ^= 0x01;
      expect(await refusal(open(bad, s.fileKey)), String(at)).toBe('bad_segment');
    }
  });

  it('swapped segments fail (the counter is in the nonce)', async () => {
    const s = await seal(fakeM4a(3 * SEGMENT_SIZE));
    const seg = SEGMENT_SIZE + TAG_LEN;
    const first = HEADER_LEN + META_SEALED_LEN;
    const a = s.bytes.slice(first, first + seg);
    const b = s.bytes.slice(first + seg, first + 2 * seg);
    const bad = concat(s.bytes.subarray(0, first), b, a, s.bytes.subarray(first + 2 * seg));
    expect(await refusal(open(bad, s.fileKey))).toBe('bad_segment');
  });

  it('a missing final segment fails even on a segment boundary (only the final segment carries the last flag)', async () => {
    const s = await seal(fakeM4a(2 * SEGMENT_SIZE));
    const cut = s.bytes.subarray(0, s.bytes.length - (SEGMENT_SIZE + TAG_LEN));
    expect(await refusal(open(cut, s.fileKey))).toBe('truncated');
    expect(await refusal(open(s.bytes.subarray(0, s.bytes.length - 1), s.fileKey))).toBe('truncated');
  });

  it('trailing bytes fail', async () => {
    const s = await seal(fakeM4a(500));
    expect(await refusal(open(concat(s.bytes, new Uint8Array([0])), s.fileKey))).toBe('trailing');
  });

  it('a header naming another letter or author fails every segment (the stream header is the AAD)', async () => {
    const s = await seal(fakeM4a(500));
    const bad = s.bytes.slice();
    bad[9] ^= 0x01; // first byte of the entry id
    expect(await refusal(open(bad, s.fileKey))).toBe('bad_segment');
    const bad2 = s.bytes.slice();
    bad2[30] ^= 0x01; // inside the author id
    expect(await refusal(open(bad2, s.fileKey))).toBe('bad_segment');
  });

  it('a wrong magic, version or file key is refused', async () => {
    const s = await seal(fakeM4a(500));
    const magic = s.bytes.slice();
    magic[0] = 0x00;
    expect(() => parseHeader(magic)).toThrow(/bad_magic/);
    const version = s.bytes.slice();
    version[4] = 2;
    expect(() => parseHeader(version)).toThrow(/bad_version/);
    expect(await refusal(open(s.bytes, new Uint8Array(randomBytes(32))))).toBe('bad_segment');
  });

  it('the original changing under the encryptor is refused, never sent short', async () => {
    const plain = fakeM4a(1000);
    expect(
      await refusal(
        encryptObject({
          stream: { entryId: LETTER, authorId: MAMA, noncePrefix: new Uint8Array(7), segmentSize: SEGMENT_SIZE },
          keyBlock: { keyVersion: 1, wrapped: new Uint8Array(60) },
          fileKey: new Uint8Array(32),
          plainSha256: new Uint8Array(32),
          plainLength: 2000,
          source: memSource(plain),
          sink: memSink(),
          aead: nodeAead,
        }),
      ),
    ).toBe('length');
  });
});

describe('[F08-REQ-032] key wrapping binds letter, author and version; a move rewraps only the key', () => {
  it('a wrapped file key opens only for its own letter, author and version', async () => {
    const s = await seal(fakeM4a(10));
    await expect(s.vault.unwrapFileKey(s.ref, 1, s.wrapped, wrapAad(LETTER, MAMA, 1))).resolves.toHaveLength(32);
    await expect(s.vault.unwrapFileKey(s.ref, 1, s.wrapped, wrapAad('01928c3e-5a2b-7c3d-8e4f-000000000002', MAMA, 1))).rejects.toThrow();
    await expect(s.vault.unwrapFileKey(s.ref, 1, s.wrapped, wrapAad(LETTER, '22222222-2222-4222-8222-222222222222', 1))).rejects.toThrow();
    await expect(s.vault.unwrapFileKey(s.ref, 1, s.wrapped, wrapAad(LETTER, MAMA, 2))).rejects.toThrow();
  });

  it('moving to another book rewraps 32 bytes and keeps every segment (no child id in any AAD)', async () => {
    const plain = fakeM4a(SEGMENT_SIZE + 77);
    const s = await seal(plain);
    const newRef = { profileId: MAMA, childId: ASHA_NEW_BOOK };
    await s.vault.createBookKey(newRef, 1);
    const fileKey = await s.vault.unwrapFileKey(s.ref, 1, s.wrapped, wrapAad(LETTER, MAMA, 1));
    const rewrapped = await s.vault.wrapFileKey(newRef, 1, fileKey, wrapAad(LETTER, MAMA, 1));
    const moved = concat(replaceKeyBlock(s.bytes.subarray(0, HEADER_LEN), { keyVersion: 1, wrapped: rewrapped }), s.bytes.subarray(HEADER_LEN));
    expect(bytesToHex(moved.subarray(HEADER_LEN))).toBe(bytesToHex(s.bytes.subarray(HEADER_LEN)));
    const h = parseHeader(moved);
    const key = await s.vault.unwrapFileKey(newRef, 1, h.wrapped, wrapAad(LETTER, MAMA, 1));
    const o = await open(moved, key);
    expect(sha256Hex(o.plain)).toBe(sha256Hex(plain));
  });
});
