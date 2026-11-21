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

/** Every backup state file now in the database folder (names only; no file is opened). */
export function listBackupFiles(): File[] {
  const dir = databaseDirectory();
  if (!dir) return [];
  try {
    return dir.list().filter((i): i is File => i instanceof File && isBackupFileName(i.name));
  } catch {
    return [];
  }
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

function deleteQuietly(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // Left for the next launch's check, which fails the same way and tries again.
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

function secureFamilies(files: File[]): { kept: number; deleted: number } {
  let kept = 0;
  let deleted = 0;
  for (const members of families(files).values()) {
    if (members.every(excludeAndReadBack)) {
      kept += members.length;
    } else {
      for (const m of members) deleteQuietly(m);
      deleted += members.length;
    }
  }
  return { kept, deleted };
}

/**
 * Launch step (after the first frame, never awaited: a folder listing and a call per file). Every backup file that
 * exists is excluded and read back, on every install, new and old; one that reads false is deleted. Never throws.
 */
export function secureBackupFilesAtLaunch(): { kept: number; deleted: number } {
  try {
    return secureFamilies(listBackupFiles());
  } catch {
    return { kept: 0, deleted: 0 };
  }
}

/**
 * Before the store opens a file (and again after it opens, which is when a new file first exists): true only if
 * that file, if present, is excluded and reads back so. False means it was deleted and must not be opened.
 */
export function backupFileIsSecure(name: string): boolean {
  if (!isBackupFileName(name)) return false;
  const family = name.replace(SIDECAR, '').toLowerCase();
  const mine = listBackupFiles().filter((f) => f.name.replace(SIDECAR, '').toLowerCase() === family);
  return secureFamilies(mine).deleted === 0;
}
