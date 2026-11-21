/**
 * Re-reads a finished export and checks every file against the manifest
 * before the app says "Your export is ready." (DATA-REQ-051).
 *
 * Reads through the ZIP's central directory, never by scanning for headers:
 * entries carry data descriptors, and a recording can contain any byte
 * pattern, so offsets from the directory are the only safe way to find each
 * file. Expects stored entries without ZIP64, which is what pack.ts writes.
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
  'format:zip64_not_expected',
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
  if (eocd < 0) throw new ZipFormatError('format:no_end_record');
  const count = u16(tail, eocd + 10);
  const cdSize = u32(tail, eocd + 12);
  const cdOffset = u32(tail, eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw new ZipFormatError('format:zip64_not_expected');
  const cd = await file.read(cdOffset, cdSize);
  const out: CentralEntry[] = [];
  let p = 0;
  for (let n = 0; n < count; n++) {
    if (u32(cd, p) !== 0x02014b50) throw new ZipFormatError('format:bad_directory');
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
