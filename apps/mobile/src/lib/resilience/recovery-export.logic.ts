/**
 * "Export what is readable" on the launch recovery screen. When the book cannot be opened, the
 * store is not used at all: this packs the recordings and the database files exactly as they sit
 * on the phone, into one ZIP the person can keep. Read only: nothing is moved, changed or deleted.
 *
 * Pure (no React Native): the planner and the ZIP writer take their file access as functions, so
 * both run in Node (test/recovery-export.test.ts). The phone side is recovery-export.ts.
 */
import { strToU8, Zip, ZipPassThrough } from 'fflate';
import { isAudioFile } from '../capture/sweep.logic';

export type RecoveryFolder = 'recordings' | 'database';

export interface FoundFile {
  /** File name only (no directory). */
  name: string;
  uri: string;
  bytes: number;
  /** Where it was found: the documents folder holds recordings, the SQLite folder holds the database. */
  source: 'documents' | 'sqlite';
}

export interface RecoveryEntry {
  /** Path inside the ZIP. */
  path: string;
  uri: string;
  bytes: number;
}

/** scribe.db, scribe.db-wal, scribe.db-shm and scribe.db-journal. */
const DB_FILE = /^scribe\.db(-wal|-shm|-journal)?$/i;

export const README_PATH = 'README.txt';

export function folderFor(f: Pick<FoundFile, 'name' | 'source'>): RecoveryFolder | null {
  if (f.source === 'documents' && isAudioFile(f.name)) return 'recordings';
  if (f.source === 'sqlite' && DB_FILE.test(f.name)) return 'database';
  return null;
}

/** Safe single path segment: keeps letters, digits, dot, dash, underscore. */
function segment(name: string): string {
  const s = name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/\.{2,}/g, '.').replace(/^\.+/, '');
  return s || 'file';
}

/** What goes in the ZIP: recordings first, then the database files, each name unique. Empty files are kept (they still say something happened). */
export function planRecoveryExport(files: readonly FoundFile[]): RecoveryEntry[] {
  const used = new Set<string>();
  const out: RecoveryEntry[] = [];
  const order: RecoveryFolder[] = ['recordings', 'database'];
  for (const folder of order) {
    for (const f of [...files].filter((x) => folderFor(x) === folder).sort((a, b) => a.name.localeCompare(b.name))) {
      let path = `${folder}/${segment(f.name)}`;
      for (let n = 2; used.has(path.toLowerCase()); n += 1) {
        const dot = segment(f.name).lastIndexOf('.');
        const base = dot > 0 ? segment(f.name).slice(0, dot) : segment(f.name);
        const ext = dot > 0 ? segment(f.name).slice(dot) : '';
        path = `${folder}/${base}-${n}${ext}`;
      }
      used.add(path.toLowerCase());
      out.push({ path, uri: f.uri, bytes: f.bytes });
    }
  }
  return out;
}

export interface RecoveryZipDeps {
  readFile(uri: string): Promise<Uint8Array>;
  write(chunk: Uint8Array): void;
  readme: string;
  mtime?: Date;
  /** Gives the UI a turn between files. */
  yieldToUi?: () => Promise<void>;
  /** Checked between files. */
  signal?: { aborted: boolean };
}

export interface RecoveryZipResult {
  /** Files written, not counting the README. */
  files: number;
  /** Files that could not be read and were left out (counted, never named: names are not logged). */
  skipped: number;
  bytes: number;
}

/**
 * Streams the plan into a stored (uncompressed) ZIP, one file in memory at a time. A file that cannot be
 * read is skipped and counted, so one bad file never stops the rest from being saved.
 */
export async function writeRecoveryZip(entries: readonly RecoveryEntry[], deps: RecoveryZipDeps): Promise<RecoveryZipResult> {
  const mtime = deps.mtime ?? new Date();
  let bytes = 0;
  let zipError: Error | null = null;
  let finished = false;
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      zipError = err;
      return;
    }
    if (chunk.length > 0) {
      deps.write(chunk);
      bytes += chunk.length;
    }
    if (final) finished = true;
  });
  const add = (path: string, data: Uint8Array) => {
    const f = new ZipPassThrough(path);
    f.mtime = mtime;
    zip.add(f);
    f.push(data, true);
  };

  let files = 0;
  let skipped = 0;
  for (const e of entries) {
    if (deps.signal?.aborted) break;
    let data: Uint8Array;
    try {
      data = await deps.readFile(e.uri);
    } catch {
      skipped += 1;
      continue;
    }
    add(e.path, data);
    files += 1;
    await deps.yieldToUi?.();
  }
  add(README_PATH, strToU8(`${deps.readme}\n`));
  zip.end();
  if (zipError) throw zipError;
  if (!finished) throw new Error('recovery_zip_unfinished');
  return { files, skipped, bytes };
}
