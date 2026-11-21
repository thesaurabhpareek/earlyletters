/**
 * The days store file on this phone (ADR 0032 items 1 to 4; NS-47-R6, R28; BRIEF NS-47). One versioned JSON file in
 * Application Support, excluded from the backup and read back, never in scribe.db. ONLY lib/days/** imports this
 * file (NS-47-R11; test/days-store.test.ts holds that line).
 *
 * Write order, so nothing sensitive is on disk before the exclusion is proven: create an EMPTY temp file, set the
 * exclusion, read it back (false: delete it and stop), write the bytes, rename over the final, read back again.
 * Every open reads back first: a file that lost the attribute (a restore, a copy) is deleted and never used.
 * Nothing here logs a path, a day id or file contents; a failure is a code only.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ScribeFiles } from '../../../modules/scribe-files';
import { type DaysFile, parseDays, serializeDays } from './store.logic';

export const DAYS_FOLDER = 'days';
export const DAYS_FILE = 'days.v1.json';
export const DAYS_TMP = 'days.v1.json.tmp';

/** The few things the store needs from a disk, so the rules run in Node with a stand-in. Names are plain file names. */
export interface DaysPort {
  exists(name: string): boolean;
  createEmpty(name: string): void;
  write(name: string, text: string): void;
  read(name: string): string;
  rename(from: string, to: string): Promise<void>;
  /** Throws when the file cannot be removed; absent is fine. */
  remove(name: string): void;
  list(): string[];
  setExcluded(name: string): void;
  /** False when the native module is absent (Expo Go, web), so the store refuses to write there. */
  isExcluded(name: string): boolean;
}

export type DaysRead =
  | { state: 'empty' }
  | { state: 'ok' | 'newer'; file: DaysFile }
  /** Corrupt or unreadable: no day, no crash, and the file is NOT deleted (a newer build may read it). */
  | { state: 'unreadable' }
  /** The exclusion reads false (or the module is absent): the file was deleted and the store will not write. */
  | { state: 'unavailable' };

/** Sweeps temp files a kill left (run at launch). Never throws. */
export function sweepDaysTemp(port: DaysPort): void {
  try {
    for (const n of port.list()) if (n.endsWith('.tmp')) port.remove(n);
  } catch {
    // The next launch tries again.
  }
}

/** True when the file is excluded from the backup, with a read-back. Any doubt is false. */
function excludedAfterSet(port: DaysPort, name: string): boolean {
  try {
    port.setExcluded(name);
    return port.isExcluded(name) === true;
  } catch {
    return false;
  }
}

/** Reads the store. `owner` is the current owner key; a file of another owner reads as empty (fail closed). */
export function readDays(port: DaysPort, owner: string): DaysRead {
  try {
    if (!port.exists(DAYS_FILE)) return { state: 'empty' };
    if (!port.isExcluded(DAYS_FILE)) {
      port.remove(DAYS_FILE);
      return { state: 'unavailable' };
    }
    const parsed = parseDays(port.read(DAYS_FILE));
    if (parsed.kind === 'corrupt') return { state: 'unreadable' };
    if (parsed.file.owner !== owner) return { state: 'empty' };
    return { state: parsed.kind, file: parsed.file };
  } catch {
    return { state: 'unreadable' };
  }
}

/** Writes the store atomically. 'unavailable' means 0 bytes were written (or the final was emptied and deleted). */
export async function writeDays(port: DaysPort, file: DaysFile): Promise<'ok' | 'unavailable'> {
  try {
    port.createEmpty(DAYS_TMP);
    if (!excludedAfterSet(port, DAYS_TMP)) {
      port.remove(DAYS_TMP);
      return 'unavailable';
    }
    port.write(DAYS_TMP, serializeDays(file));
    await port.rename(DAYS_TMP, DAYS_FILE);
    if (!port.isExcluded(DAYS_FILE)) {
      port.write(DAYS_FILE, '');
      port.remove(DAYS_FILE);
      return 'unavailable';
    }
    return 'ok';
  } catch {
    try {
      port.remove(DAYS_TMP);
    } catch {
      // swept at launch
    }
    return 'unavailable';
  }
}

/** Deletes the file and any temp. True when none is left. Synchronous: sign-out and Erase run it before any await. */
export function removeDays(port: DaysPort): boolean {
  let left = false;
  let names: string[] = [DAYS_FILE, DAYS_TMP];
  try {
    names = [...new Set([...names, ...port.list().filter((n) => n.endsWith('.tmp'))])];
  } catch {
    // the two known names are still tried
  }
  for (const n of names) {
    try {
      port.remove(n);
      if (port.exists(n)) left = true;
    } catch {
      left = true;
    }
  }
  return !left;
}

/** Application Support on iOS (`<container>/Library/Application Support/days`), `<files>/days` on Android. Else null. */
function daysDirectory(): Directory | null {
  const doc = Paths.document.uri;
  if (/\/Documents\/?$/.test(doc)) return new Directory(doc.replace(/Documents\/?$/, ''), 'Library', 'Application Support', DAYS_FOLDER);
  if (/\/files\/?$/.test(doc)) return new Directory(Paths.document, DAYS_FOLDER);
  return null;
}

/** The real disk. Null on an unknown layout: the store then refuses to read or write. Creates the folder. */
export function expoDaysPort(): DaysPort | null {
  const dir = daysDirectory();
  if (!dir) return null;
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // an existing folder is fine; a real failure surfaces on the first write
  }
  const f = (name: string) => new File(dir, name);
  return {
    exists: (n) => f(n).exists,
    createEmpty: (n) => f(n).create({ overwrite: true }),
    write: (n, t) => f(n).write(t),
    read: (n) => f(n).textSync(),
    rename: (a, b) => f(a).move(f(b), { overwrite: true }),
    remove: (n) => {
      if (f(n).exists) f(n).delete();
    },
    list: () => dir.list().filter((i): i is File => i instanceof File).map((i) => i.name),
    setExcluded: (n) => ScribeFiles?.setExcludedFromBackup(f(n).uri, true),
    isExcluded: (n) => ScribeFiles?.isExcludedFromBackup(f(n).uri) === true,
  };
}
