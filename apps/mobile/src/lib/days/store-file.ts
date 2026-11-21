/**
 * The days store file (ADR 0032 items 1 to 4; NS-47-R6, R28): one versioned JSON file in Application Support, excluded
 * from the backup and read back, never in scribe.db. ONLY lib/days/** imports this file (NS-47-R11).
 * Write order, so nothing sensitive is on disk before the exclusion is proven: create an EMPTY temp, set the exclusion,
 * read it back (false: delete and stop), write the bytes, rename, read back again. Every open reads back first: a file
 * that lost the attribute (a restore, a copy) is deleted and never used. Nothing here logs a path, a day id or contents.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ScribeFiles } from '../../../modules/scribe-files';
import { type DaysFile, parseDays, serializeDays } from './store.logic';

export const DAYS_FOLDER = 'days';
export const DAYS_FILE = 'days.v1.json';
export const DAYS_TMP = 'days.v1.json.tmp';

/** What the store needs from a disk, so the rules run in Node with a stand-in. Names are plain file names. */
export interface DaysPort {
  exists(name: string): boolean;
  createEmpty(name: string): void;
  write(name: string, text: string): void;
  read(name: string): string;
  rename(from: string, to: string): Promise<void>;
  remove(name: string): void; // throws when it cannot; absent is fine
  list(): string[];
  setExcluded(name: string): void;
  isExcluded(name: string): boolean; // false when the native module is absent (Expo Go, web)
}

export type DaysRead =
  | { state: 'empty' }
  | { state: 'ok' | 'newer'; file: DaysFile }
  | { state: 'unreadable' } // corrupt: no day, no crash, NOT deleted (a newer build may read it)
  | { state: 'unavailable' }; // exclusion reads false: the file was deleted and the store will not write

/** Deletes temp files a kill left (run once per launch). Never throws. */
export function sweepDaysTemp(port: DaysPort): void {
  try {
    for (const n of port.list()) if (n.endsWith('.tmp')) port.remove(n);
  } catch {
    // the next launch tries again
  }
}

function excludedAfterSet(port: DaysPort, name: string): boolean {
  try {
    port.setExcluded(name);
    return port.isExcluded(name) === true;
  } catch {
    return false;
  }
}

/** `owner` is the current owner key; a file of another owner reads as empty (fail closed). */
export function readDays(port: DaysPort, owner: string): DaysRead {
  try {
    if (!port.exists(DAYS_FILE)) return { state: 'empty' };
    if (!port.isExcluded(DAYS_FILE)) {
      port.remove(DAYS_FILE);
      return { state: 'unavailable' };
    }
    const parsed = parseDays(port.read(DAYS_FILE));
    if (parsed.kind === 'corrupt') return { state: 'unreadable' };
    return parsed.file.owner === owner ? { state: parsed.kind, file: parsed.file } : { state: 'empty' };
  } catch {
    return { state: 'unreadable' };
  }
}

/** 'unavailable' means 0 bytes were written, or the final was emptied and deleted. */
export async function writeDays(port: DaysPort, file: DaysFile): Promise<'ok' | 'unavailable'> {
  try {
    port.createEmpty(DAYS_TMP);
    if (!excludedAfterSet(port, DAYS_TMP)) {
      port.remove(DAYS_TMP);
      return 'unavailable';
    }
    port.write(DAYS_TMP, serializeDays(file));
    await port.rename(DAYS_TMP, DAYS_FILE);
    if (port.isExcluded(DAYS_FILE)) return 'ok';
    port.write(DAYS_FILE, '');
    port.remove(DAYS_FILE);
  } catch {
    try {
      port.remove(DAYS_TMP);
    } catch {
      // swept at launch
    }
  }
  return 'unavailable';
}

/** Deletes the file and any temp, synchronously. True when none is left. */
export function removeDays(port: DaysPort): boolean {
  let names = [DAYS_FILE, DAYS_TMP];
  try {
    names = [...new Set([...names, ...port.list().filter((n) => n.endsWith('.tmp'))])];
  } catch {
    // the two known names are still tried
  }
  let left = false;
  for (const n of names) {
    try {
      port.remove(n);
      left ||= port.exists(n);
    } catch {
      left = true;
    }
  }
  return !left;
}

/** iOS `<container>/Library/Application Support/days`, Android `<files>/days`; any other layout is null (fail closed). */
function daysDirectory(): Directory | null {
  const doc = Paths.document.uri;
  if (/\/Documents\/?$/.test(doc)) return new Directory(doc.replace(/Documents\/?$/, ''), 'Library', 'Application Support', DAYS_FOLDER);
  return /\/files\/?$/.test(doc) ? new Directory(Paths.document, DAYS_FOLDER) : null;
}

/** The real disk; creates the folder. Null on an unknown layout. */
export function expoDaysPort(): DaysPort | null {
  const dir = daysDirectory();
  if (!dir) return null;
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // an existing folder is fine; a real failure surfaces on the first write
  }
  const f = (n: string) => new File(dir, n);
  return {
    exists: (n) => f(n).exists,
    createEmpty: (n) => f(n).create({ overwrite: true }),
    write: (n, t) => f(n).write(t),
    read: (n) => f(n).textSync(),
    rename: (a, b) => f(a).move(f(b), { overwrite: true }),
    remove: (n) => f(n).exists && f(n).delete(),
    list: () => dir.list().filter((i): i is File => i instanceof File).map((i) => i.name),
    setExcluded: (n) => ScribeFiles?.setExcludedFromBackup(f(n).uri, true),
    isExcluded: (n) => ScribeFiles?.isExcludedFromBackup(f(n).uri) === true,
  };
}
