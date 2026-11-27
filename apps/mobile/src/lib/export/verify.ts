/**
 * Re-reads a finished export and checks every file against the manifest
 * before the app says "Your export is ready." (DATA-REQ-051).
 *
 * Reads through the ZIP's central directory, never by scanning for headers:
 * entries carry data descriptors, and a recording can contain any byte
 * pattern, so offsets from the directory are the only safe way to find each
 * file. Expects stored entries, which is what pack.ts writes, ZIP64 included
 * (past 4 GiB, BL-388); a ZIP64 record that points nowhere or disagrees with
 * the 32-bit fields is a format problem, never guessed around.
 *
 * Problems are reported as fixed codes and counts only: never a file path (a folder is named after the
 * child), never file contents, never a reader's error text (it can quote a path). PRIV-R21.
 */
import { strFromU8 } from 'fflate';
import type { Manifest } from './schema';

export interface RandomAccess {
  size: number;
  read(offset: number, length: number): Uint8Array | Promise<Uint8Array>;
}

/** Every problem the check can report. A closed list: nothing else is ever placed in a result or an error. */
export const PROBLEM_CODES = [
  'missing',
  'hash',
  'extra',
  'duplicate',
  'cancelled',
  'format:no_end_record',
  'format:bad_zip64',
  'format:bad_directory',
  'format:bad_local_header',
  'format:not_stored',
  'format:unreadable',
] as const;
export type ProblemCode = (typeof PROBLEM_CODES)[number];

export const isProblemCode = (x: unknown): x is ProblemCode => typeof x === 'string' && (PROBLEM_CODES as readonly string[]).includes(x);

export interface VerifyResult {
  ok: boolean;
  /** Each kind of problem found, once, in the order first met. Fixed codes only; never a path. */
  problems: ProblemCode[];
  /** How many files had each problem. */
  problemCounts: Partial<Record<ProblemCode, number>>;
  filesChecked: number;
}

/** A ZIP that cannot be read as expected. The message is the code, nothing else. */
export class ZipFormatError extends Error {
  constructor(readonly code: Extract<ProblemCode, `format:${string}`>) {
    super(code);
    this.name = 'ZipFormatError';
  }
}

export class ExportCheckFailedError extends Error {
  /**
   * Fixed problem codes only (verify.ts PROBLEM_CODES), never a path: a folder in the file is named after the
   * child, and this error can reach a log or a crash report. The message is fixed too. Anything that is not
   * a known code is dropped here, whatever the caller passes.
   */
  readonly problems: ProblemCode[];
  constructor(problems: readonly string[]) {
    super('export_check_failed');
    this.name = 'ExportCheckFailedError';
    this.problems = problems.filter(isProblemCode);
  }
}

/** The fixed code for anything a reader threw: its own text can quote a file path, so it is never passed on. */
const codeOf = (e: unknown): ProblemCode => (e instanceof ZipFormatError ? e.code : 'format:unreadable');

function result(found: ProblemCode[], filesChecked: number): VerifyResult {
  const problemCounts: Partial<Record<ProblemCode, number>> = {};
  for (const c of found) problemCounts[c] = (problemCounts[c] ?? 0) + 1;
  const problems = (Object.keys(problemCounts) as ProblemCode[]).sort((a, b) => found.indexOf(a) - found.indexOf(b));
  return { ok: found.length === 0, problems, problemCounts, filesChecked };
}

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
/** An 8-byte value, refused past 2^53 (an offset there could not be read exactly). */
const u64 = (b: Uint8Array, i: number) => {
  const v = u32(b, i) + u32(b, i + 4) * 0x1_0000_0000;
  if (!Number.isSafeInteger(v) || i + 8 > b.length) throw new ZipFormatError('format:bad_zip64');
  return v;
};
const MAX32 = 0xffffffff;
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

/** The central directory, with ZIP64 values where the 32-bit fields say 0xFFFF or 0xFFFFFFFF (APPNOTE 4.3.14 to 4.5.3). */
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
  if (eocd < 0) throw new ZipFormatError('format:no_end_record');
  let count = u16(tail, eocd + 10);
  let cdSize = u32(tail, eocd + 12);
  let cdOffset = u32(tail, eocd + 16);
  // Where the directory must end: at the end record, or at the ZIP64 end record when there is one.
  let cdEnd = file.size - tailLength + eocd;
  const locator = cdEnd >= 20 ? await file.read(cdEnd - 20, 20) : new Uint8Array(0);
  if (locator.length === 20 && u32(locator, 0) === 0x07064b50) {
    // The locator sits right before the end record and points at the ZIP64 end record, which ends where it starts.
    const at = u64(locator, 8);
    const record = await file.read(at, 56);
    if (u32(locator, 4) !== 0 || u32(locator, 16) !== 1 || record.length < 56 || u32(record, 0) !== 0x06064b50) throw new ZipFormatError('format:bad_zip64');
    const [onDisk, total, size64, offset64] = [24, 32, 40, 48].map((i) => u64(record, i));
    // One disk, and each 32-bit field either says "see ZIP64" or agrees with it.
    const disagree = onDisk !== total || (count !== 0xffff && count !== total) || (cdSize !== MAX32 && cdSize !== size64) || (cdOffset !== MAX32 && cdOffset !== offset64);
    if (disagree || at + 12 + u64(record, 4) !== cdEnd - 20 || u32(record, 16) !== 0 || u32(record, 20) !== 0) throw new ZipFormatError('format:bad_zip64');
    [count, cdSize, cdOffset, cdEnd] = [total, size64, offset64, at];
  } else if (count === 0xffff || cdSize === MAX32 || cdOffset === MAX32) {
    throw new ZipFormatError('format:bad_zip64'); // says ZIP64 and has no ZIP64 end record
  }
  if (cdOffset + cdSize !== cdEnd) throw new ZipFormatError('format:bad_directory');
  const cd = await file.read(cdOffset, cdSize);
  const out: CentralEntry[] = [];
  let p = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > cd.length || u32(cd, p) !== 0x02014b50) throw new ZipFormatError('format:bad_directory');
    const nameLength = u16(cd, p + 28);
    const extraLength = u16(cd, p + 30);
    const commentLength = u16(cd, p + 32);
    const entry: CentralEntry = {
      method: u16(cd, p + 10),
      crc: u32(cd, p + 16),
      compressedSize: u32(cd, p + 20),
      size: u32(cd, p + 24),
      localOffset: u32(cd, p + 42),
      name: utf8(cd.subarray(p + 46, p + 46 + nameLength)),
    };
    const wide = (['size', 'compressedSize', 'localOffset'] as const).filter((k) => entry[k] === MAX32);
    if (wide.length > 0) {
      // The ZIP64 extra (id 1) holds, in this order, only the fields set to 0xFFFFFFFF.
      const extra = cd.subarray(p + 46 + nameLength, p + 46 + nameLength + extraLength);
      let x = 0;
      while (x + 4 <= extra.length && u16(extra, x) !== 1) x += 4 + u16(extra, x + 2);
      if (x + 4 > extra.length || u16(extra, x + 2) < 8 * wide.length) throw new ZipFormatError('format:bad_zip64');
      wide.forEach((k, i) => (entry[k] = u64(extra, x + 4 + 8 * i)));
    }
    out.push(entry);
    p += 46 + nameLength + extraLength + commentLength;
  }
  if (p !== cd.length) throw new ZipFormatError('format:bad_directory'); // more entries than the count says
  return out;
}

/** The stored bytes of one entry. */
export async function readEntry(file: RandomAccess, entry: CentralEntry): Promise<Uint8Array> {
  const local = await file.read(entry.localOffset, 30);
  if (u32(local, 0) !== 0x04034b50) throw new ZipFormatError('format:bad_local_header');
  const start = entry.localOffset + 30 + u16(local, 26) + u16(local, 28);
  if (entry.method !== 0) throw new ZipFormatError('format:not_stored');
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
  const found: ProblemCode[] = [];
  let entries: CentralEntry[];
  try {
    entries = await readCentralDirectory(file);
  } catch (e) {
    return result([codeOf(e)], 0);
  }
  const expected = new Map(manifest.files.map((f) => [f.path, f]));
  const seen = new Set<string>();
  const total = entries.reduce((n, e) => n + e.compressedSize, 0) || 1;
  let done = 0;
  for (const entry of entries) {
    if (signal?.aborted) return result(['cancelled'], seen.size);
    if (seen.has(entry.name)) found.push('duplicate');
    seen.add(entry.name);
    let data: Uint8Array;
    try {
      data = await readEntry(file, entry);
    } catch (e) {
      found.push(codeOf(e));
      continue;
    }
    const hash = await sha256(data);
    if (entry.name === 'manifest.json') {
      if (hash !== manifestSha256) found.push('hash');
    } else if (entry.name === 'manifest.sha256') {
      if (!utf8(data).startsWith(manifestSha256)) found.push('hash');
    } else {
      const want = expected.get(entry.name);
      if (!want) found.push('extra');
      else if (want.sha256 !== hash || want.bytes !== data.length) found.push('hash');
    }
    done += entry.compressedSize;
    onProgress?.(Math.min(1, done / total));
  }
  for (const path of expected.keys()) if (!seen.has(path)) found.push('missing');
  for (const path of ['manifest.json', 'manifest.sha256']) if (!seen.has(path)) found.push('missing');
  return result(found, seen.size);
}
