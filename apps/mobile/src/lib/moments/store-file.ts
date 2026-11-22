/**
 * The moments file (ADR 0032 and its amendment; NS-53-R221, R250; CDO-23): one versioned JSON file in Application
 * Support/moments, excluded from the backup and read back, never in scribe.db, never exported (route A, CPrivO-16).
 * Same disk pattern as the days store (the repo's no-backup mechanism is ScribeFiles.setExcludedFromBackup).
 * Write order: create an EMPTY temp, set the exclusion, read it back (false: delete and stop), write, rename, read back
 * again; every open reads back first. A corrupt file is deleted with no message (R221). Nothing here logs a path or contents.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ScribeFiles } from '../../../modules/scribe-files';
import { readBackFlag } from '../backup/readback';
import { type MomentsFile, parseMoments, serializeMoments } from './store.logic';

export const MOMENTS_FOLDER = 'moments';
export const MOMENTS_FILE = 'moments.v1.json';
export const MOMENTS_TMP = 'moments.v1.json.tmp';

export interface MomentsPort {
  exists(name: string): boolean;
  createEmpty(name: string): void;
  write(name: string, text: string): void;
  read(name: string): string;
  rename(from: string, to: string): Promise<void>;
  remove(name: string): void; // throws when it cannot; absent is fine
  list(): string[];
  setExcluded(name: string): void;
  isExcluded(name: string): boolean; // false when the native module is absent
}

export type MomentsRead =
  | { state: 'empty' } // no file, or a corrupt one that was deleted
  | { state: 'foreign'; owner: string } // another owner's file: never read or overwritten
  | { state: 'ok'; file: MomentsFile }
  | { state: 'newer' } // a higher v: reads as empty, writes nothing, is not deleted by this build
  | { state: 'unreadable' } // the disk failed: nothing is written
  | { state: 'unavailable' }; // exclusion reads false: the file was deleted

export function sweepMomentsTemp(port: MomentsPort): void {
  try {
    for (const n of port.list()) if (n.endsWith('.tmp')) port.remove(n);
  } catch {
    // the next launch tries again
  }
}

export function readMoments(port: MomentsPort, owner: string, moment: 'open' | 'restore' = 'open'): MomentsRead {
  try {
    if (!port.exists(MOMENTS_FILE)) return { state: 'empty' };
    const flag = readBackFlag(port, MOMENTS_FILE, moment);
    if ('cannotRead' in flag) return { state: 'unreadable' }; // kept: a read that threw is not a wrong flag
    if (!flag.ok) return { state: 'unavailable' };
    const parsed = parseMoments(port.read(MOMENTS_FILE));
    if (parsed.kind === 'corrupt') {
      port.remove(MOMENTS_FILE); // the tab starts clean, no message (R221)
      return { state: 'empty' };
    }
    if (parsed.file.owner !== owner) return { state: 'foreign', owner: parsed.file.owner };
    return parsed.kind === 'newer' ? { state: 'newer' } : { state: 'ok', file: parsed.file };
  } catch {
    return { state: 'unreadable' };
  }
}

/** After a restore (R42, R43): the flag is read back first; a file that lost it came with the restore, is removed and never read. */
export function readMomentsAfterRestore(port: MomentsPort, owner: string): MomentsRead {
  return readMoments(port, owner, 'restore');
}

/** 'unavailable' means 0 sensitive bytes were left: after the rename a failure deletes the final file too. */
export async function writeMoments(port: MomentsPort, file: MomentsFile): Promise<'ok' | 'unavailable'> {
  let renamed = false;
  try {
    port.createEmpty(MOMENTS_TMP);
    port.setExcluded(MOMENTS_TMP);
    if (port.isExcluded(MOMENTS_TMP) !== true) {
      port.remove(MOMENTS_TMP);
      return 'unavailable';
    }
    port.write(MOMENTS_TMP, serializeMoments(file));
    await port.rename(MOMENTS_TMP, MOMENTS_FILE);
    renamed = true;
    if (readBackFlag(port, MOMENTS_FILE, 'replace').ok) return 'ok';
    port.write(MOMENTS_FILE, '');
  } catch {
    // fall through: nothing sensitive may stay
  }
  for (const n of renamed ? [MOMENTS_FILE, MOMENTS_TMP] : [MOMENTS_TMP]) {
    try {
      port.remove(n);
    } catch {
      // swept or removed at the next launch, sign-out or Erase
    }
  }
  return 'unavailable';
}

/** Deletes the file and any temp, synchronously. True when none is left. */
export function removeMoments(port: MomentsPort): boolean {
  let names = [MOMENTS_FILE, MOMENTS_TMP];
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

function momentsDirectory(): Directory | null {
  const doc = Paths.document.uri;
  if (/\/Documents\/?$/.test(doc)) return new Directory(doc.replace(/Documents\/?$/, ''), 'Library', 'Application Support', MOMENTS_FOLDER);
  return /\/files\/?$/.test(doc) ? new Directory(Paths.document, MOMENTS_FOLDER) : null;
}

/** The real disk; creates the folder. Null on an unknown layout (fail closed). */
export function expoMomentsPort(): MomentsPort | null {
  const dir = momentsDirectory();
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
