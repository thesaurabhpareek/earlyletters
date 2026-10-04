/**
 * Re-reads a finished export and checks every file against the manifest
 * before the app says "Your export is ready." (DATA-REQ-051).
 *
 * Reads through the ZIP's central directory, never by scanning for headers:
 * entries carry data descriptors, and a recording can contain any byte
 * pattern, so offsets from the directory are the only safe way to find each
 * file. Expects stored entries without ZIP64, which is what pack.ts writes.
 *
 * Problems are reported as paths and codes, never file contents.
 */
import { strFromU8 } from 'fflate';
import type { Manifest } from './schema';

export interface RandomAccess {
  size: number;
  read(offset: number, length: number): Uint8Array | Promise<Uint8Array>;
}

export interface VerifyResult {
  ok: boolean;
  /** "missing:<path>", "hash:<path>", "extra:<path>", "format:<what>". */
  problems: string[];
  filesChecked: number;
}

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
// fflate's UTF-8 decoder: TextDecoder is not guaranteed in Hermes.
const utf8 = (b: Uint8Array) => strFromU8(b);

export interface CentralEntry {
  name: string;
  method: number;
  crc: number;
  compressedSize: number;
  size: number;
  localOffset: number;
}

/** The central directory of a ZIP without ZIP64. */
export async function readCentralDirectory(file: RandomAccess): Promise<CentralEntry[]> {
  const tailLength = Math.min(file.size, 22 + 0xffff);
  const tail = await file.read(file.size - tailLength, tailLength);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (u32(tail, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('format:no_end_record');
  const count = u16(tail, eocd + 10);
  const cdSize = u32(tail, eocd + 12);
  const cdOffset = u32(tail, eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('format:zip64_not_expected');
  const cd = await file.read(cdOffset, cdSize);
  const out: CentralEntry[] = [];
  let p = 0;
  for (let n = 0; n < count; n++) {
    if (u32(cd, p) !== 0x02014b50) throw new Error('format:bad_directory');
    const nameLength = u16(cd, p + 28);
    const extraLength = u16(cd, p + 30);
    const commentLength = u16(cd, p + 32);
    out.push({
      method: u16(cd, p + 10),
      crc: u32(cd, p + 16),
      compressedSize: u32(cd, p + 20),
      size: u32(cd, p + 24),
      localOffset: u32(cd, p + 42),
      name: utf8(cd.subarray(p + 46, p + 46 + nameLength)),
    });
    p += 46 + nameLength + extraLength + commentLength;
  }
  return out;
}

/** The stored bytes of one entry. */
export async function readEntry(file: RandomAccess, entry: CentralEntry): Promise<Uint8Array> {
  const local = await file.read(entry.localOffset, 30);
  if (u32(local, 0) !== 0x04034b50) throw new Error('format:bad_local_header');
  const start = entry.localOffset + 30 + u16(local, 26) + u16(local, 28);
  if (entry.method !== 0) throw new Error('format:not_stored');
  return file.read(start, entry.compressedSize);
}

export async function verifyExport(
  file: RandomAccess,
  manifest: Manifest,
  manifestSha256: string,
  sha256: (data: Uint8Array) => Promise<string>,
  onProgress?: (fraction: number) => void,
  signal?: { aborted: boolean },
): Promise<VerifyResult> {
  const problems: string[] = [];
  let entries: CentralEntry[];
  try {
    entries = await readCentralDirectory(file);
  } catch (e) {
    return { ok: false, problems: [e instanceof Error ? e.message : 'format:unreadable'], filesChecked: 0 };
  }
  const expected = new Map(manifest.files.map((f) => [f.path, f]));
  const seen = new Set<string>();
  const total = entries.reduce((n, e) => n + e.compressedSize, 0) || 1;
  let done = 0;
  for (const entry of entries) {
    if (signal?.aborted) return { ok: false, problems: ['cancelled'], filesChecked: seen.size };
    if (seen.has(entry.name)) problems.push(`duplicate:${entry.name}`);
    seen.add(entry.name);
    let data: Uint8Array;
    try {
      data = await readEntry(file, entry);
    } catch (e) {
      problems.push(`${e instanceof Error ? e.message : 'format:unreadable'}:${entry.name}`);
      continue;
    }
    const hash = await sha256(data);
    if (entry.name === 'manifest.json') {
      if (hash !== manifestSha256) problems.push('hash:manifest.json');
    } else if (entry.name === 'manifest.sha256') {
      if (!utf8(data).startsWith(manifestSha256)) problems.push('hash:manifest.sha256');
    } else {
      const want = expected.get(entry.name);
      if (!want) problems.push(`extra:${entry.name}`);
      else if (want.sha256 !== hash || want.bytes !== data.length) problems.push(`hash:${entry.name}`);
    }
    done += entry.compressedSize;
    onProgress?.(Math.min(1, done / total));
  }
  for (const path of expected.keys()) if (!seen.has(path)) problems.push(`missing:${path}`);
  for (const path of ['manifest.json', 'manifest.sha256']) if (!seen.has(path)) problems.push(`missing:${path}`);
  return { ok: problems.length === 0, problems, filesChecked: seen.size };
}
