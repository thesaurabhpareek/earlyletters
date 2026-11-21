/**
 * The recording-backup state file on this phone (`backup-<profile id>.db` and its -wal, -shm and -journal
 * sidecars): its name, its exclusion from the phone's backup, and (PR 2) its removal. CR-71 B5; BRIEF B5.
 *
 * A data right, like the photo sweep: it works with `capabilities.backup` off, because an install that once ran a
 * build with the flag on may hold the file. So it imports only expo-file-system, expo-sqlite (the folder) and the
 * ScribeFiles module, and nothing from the backup runtime (test/backup-gate.test.ts holds that line).
 *
 * The exclusion is per FILE and never `scribe.db`: that stays in the backup, and the folder is never excluded.
 * Fail closed: a file whose exclusion cannot be set, or reads back false, is deleted (with its sidecars, which are
 * useless alone) and the store does not open it.
 */
import { Directory, File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { ScribeFiles } from '../../../modules/scribe-files';

/** backup-<uuid>.db and its sidecars. Never matches scribe.db* (the recovery export's DB_FILE, X-2). */
const BACKUP_FILE = /^backup-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.db(-wal|-shm|-journal)?$/i;
const SIDECAR = /-(wal|shm|journal)$/i;

export function isBackupFileName(name: string): boolean {
  return BACKUP_FILE.test(name);
}

function databaseDirectory(): Directory | null {
  try {
    const dir = new Directory(SQLite.defaultDatabaseDirectory);
    return dir.exists ? dir : null;
  } catch {
    return null;
  }
}

/**
 * Every backup state file now in the database folder (names only; no file is opened). A folder that exists but
 * cannot be listed THROWS: an empty answer there would read as "nothing to secure" (fail open).
 */
export function listBackupFiles(): File[] {
  const dir = databaseDirectory();
  if (!dir) return [];
  return dir.list().filter((i): i is File => i instanceof File && isBackupFileName(i.name));
}

/** Set the exclusion on one file and read it back. False on any doubt (module absent, call threw, read false). */
function excludeAndReadBack(file: File): boolean {
  try {
    if (!ScribeFiles) return false;
    ScribeFiles.setExcludedFromBackup(file.uri, true);
    return ScribeFiles.isExcludedFromBackup(file.uri) === true;
  } catch {
    return false;
  }
}

/** True when the file is gone afterwards. A failure is counted by the caller (no name or path is kept or logged). */
function deleteFile(file: File): boolean {
  try {
    if (file.exists) file.delete();
    return !file.exists;
  } catch {
    return false; // left for the next launch's check, which fails the same way and tries again
  }
}

/** The file and its sidecars that exist, grouped by the database they belong to. */
function families(files: File[]): Map<string, File[]> {
  const out = new Map<string, File[]>();
  for (const f of files) {
    const base = f.name.replace(SIDECAR, '').toLowerCase();
    out.set(base, [...(out.get(base) ?? []), f]);
  }
  return out;
}

export interface SecureResult {
  kept: number;
  deleted: number;
  /** Files that failed the check and could not be deleted (a count only). */
  failed: number;
  /** The folder exists but could not be listed, so nothing was checked. */
  listFailed: boolean;
}

function secureFamilies(files: File[]): { kept: number; deleted: number; failed: number } {
  let kept = 0;
  let deleted = 0;
  let failed = 0;
  for (const members of families(files).values()) {
    if (members.every(excludeAndReadBack)) {
      kept += members.length;
    } else {
      for (const m of members) {
        if (deleteFile(m)) deleted += 1;
        else failed += 1;
      }
    }
  }
  return { kept, deleted, failed };
}

/**
 * Launch step (after the first frame, never awaited: a folder listing and a call per file). Every backup file that
 * exists is excluded and read back, on every install, new and old; one that reads false is deleted. Never throws;
 * `failed` and `listFailed` are content-free signals the caller may surface.
 */
export function secureBackupFilesAtLaunch(): SecureResult {
  try {
    return { ...secureFamilies(listBackupFiles()), listFailed: false };
  } catch {
    return { kept: 0, deleted: 0, failed: 0, listFailed: true };
  }
}

/** The named database file and its sidecars, built from exact names (no folder listing), those that exist. */
function filesNamed(name: string): { files: File[]; main: File } | null {
  const dir = databaseDirectory();
  if (!dir) return null;
  const base = name.replace(SIDECAR, '');
  const main = new File(dir, base);
  const all = [main, ...['-wal', '-shm', '-journal'].map((s) => new File(dir, base + s))];
  return { files: all.filter((f) => f.exists), main };
}

/**
 * Before the store opens a file (and again after it opens, which is when a new file first exists): true only if
 * that file, if present, is excluded and reads back so. False means it was deleted and must not be opened.
 * Fail closed: the files are found by exact name, so a folder that cannot be listed changes nothing; any throw is
 * false; after the open (`opened`) the main file must exist.
 */
export function backupFileIsSecure(name: string, opened = false): boolean {
  if (!isBackupFileName(name)) return false;
  let found: ReturnType<typeof filesNamed>;
  try {
    found = filesNamed(name);
  } catch {
    return false;
  }
  if (!found) return !opened; // no database folder yet: nothing to exclude before the open, impossible after it
  if (opened && !found.main.exists) return false;
  const r = secureFamilies(found.files);
  return r.deleted === 0 && r.failed === 0;
}

/** The store was refused a backup file because its exclusion could not be set or read back (the file was deleted). */
export class BackupFileNotExcluded extends Error {
  constructor() {
    super('backup_file_not_excluded');
  }
}

/**
 * The one way the store opens the file (B5-3): check before, open, run the first statements (`firstUse`: the schema,
 * which is what makes SQLite create the -wal and -shm files in WAL mode), then check again. A failed check refuses
 * with `BackupFileNotExcluded`, closing the handle. The second check MUST follow `firstUse`: those sidecars hold
 * the table rows and are created by the first statement, not by the open. Files SQLite creates later in the session
 * are marked at the next launch.
 */
export function openSecureBackupFile<T extends { close: () => void }, R>(
  name: string,
  open: (name: string) => T,
  firstUse: (opened: T) => R,
): R {
  if (!backupFileIsSecure(name)) throw new BackupFileNotExcluded();
  const opened = open(name);
  try {
    const result = firstUse(opened);
    if (!backupFileIsSecure(name, true)) throw new BackupFileNotExcluded();
    return result;
  } catch (e) {
    opened.close();
    throw e;
  }
}
