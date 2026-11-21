/// <reference types="node" />
/**
 * [B5-1] to [B5-3] and [B5-8] (BRIEF B5, CR-71 B5): the recording-backup state file is excluded from the phone's backup
 * on every install and read back; a file that reads false is deleted and not opened; scribe.db is never touched.
 * Runs on a disk laid out as the phone has it (helpers/expo-fs-standin.ts) with a ScribeFiles stand-in. Fictional Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backupDbFileFor } from '../src/lib/backup/account';
import { BackupFileNotExcluded, backupFileIsSecure, openSecureBackupFile, isBackupFileName, listBackupFiles, secureBackupFilesAtLaunch } from '../src/lib/backup/files';
import { folderFor } from '../src/lib/resilience/recovery-export.logic';
import { createDisk, iosContainer, layOutApp, put, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  setCalls: [] as string[],
  /** What the OS does with a set: 'stick' keeps it, 'ignore' leaves it false, 'throw' fails. */
  mode: 'stick' as 'stick' | 'ignore' | 'throw',
  moduleAbsent: false,
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents}SQLite`;
  },
}));
vi.mock('../modules/scribe-files', () => ({
  get ScribeFiles() {
    if (h.moduleAbsent) return null;
    return {
      setExcludedFromBackup: (uri: string, on: boolean) => {
        h.setCalls.push(uri);
        if (h.mode === 'throw') throw new Error('EPERM');
        if (h.mode === 'stick') (on ? h.excluded.add(uri) : h.excluded.delete(uri));
      },
      isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
    };
  },
}));

const ASHA = '3f2b8c1e-5d4a-4e7b-9c60-1a2b3c4d5e6f';
const FILE = backupDbFileFor(ASHA);
const dir = () => `${h.disk.documents}SQLite`;
const at = (name: string) => `${dir()}/${name}`;
const present = (name: string) => h.disk.files.has(at(name));

beforeEach(() => {
  h.disk = createDisk(iosContainer('ASHA-PHONE'));
  layOutApp(h.disk);
  h.excluded.clear();
  h.setCalls.length = 0;
  h.mode = 'stick';
  h.moduleAbsent = false;
});

describe('[B5-1] an existing backup file is excluded from the backup and read back at launch', () => {
  it('an old install with an unexcluded file: after the launch step it is excluded, and the file is kept', () => {
    put(h.disk, at(FILE), 2048);
    expect(h.excluded.has(at(FILE))).toBe(false);
    expect(secureBackupFilesAtLaunch()).toEqual({ kept: 1, deleted: 0, failed: 0, listFailed: false });
    expect(h.excluded.has(at(FILE))).toBe(true);
    expect(present(FILE)).toBe(true);
  });

  it('a phone with no backup file does nothing and sets nothing', () => {
    expect(secureBackupFilesAtLaunch()).toEqual({ kept: 0, deleted: 0, failed: 0, listFailed: false });
    expect(h.setCalls).toEqual([]);
  });
});

describe('[B5-2] the exclusion covers -wal, -shm and -journal and never scribe.db', () => {
  it('sidecars are excluded with the file; scribe.db and its sidecars are never touched', () => {
    for (const s of ['', '-wal', '-shm', '-journal']) put(h.disk, at(FILE + s), 64);
    secureBackupFilesAtLaunch();
    for (const s of ['', '-wal', '-shm', '-journal']) expect(h.excluded.has(at(FILE + s)), s).toBe(true);
    expect(h.setCalls.filter((u) => /scribe\.db/.test(u))).toEqual([]);
    expect([...h.excluded].some((u) => /scribe\.db/.test(u))).toBe(false);
    expect(present('scribe.db') && present('scribe.db-wal')).toBe(true);
  });

  it('the name test takes backup-<uuid>.db and its sidecars only', () => {
    expect(isBackupFileName(FILE)).toBe(true);
    expect(isBackupFileName(`${FILE}-wal`)).toBe(true);
    for (const n of ['scribe.db', 'scribe.db-wal', 'backup.db', 'backup-notauuid.db', `${FILE}.bak`, `x${FILE}`]) expect(isBackupFileName(n), n).toBe(false);
  });

  it('the folder is never the thing excluded', () => {
    put(h.disk, at(FILE), 64);
    secureBackupFilesAtLaunch();
    expect([...h.excluded].every((u) => /backup-[0-9a-f-]{36}\.db$/.test(u))).toBe(true);
  });
});

describe('[B5-3] a file whose exclusion reads false is deleted and the store refuses to open it', () => {
  for (const mode of ['ignore', 'throw'] as const) {
    it(`launch, the OS ${mode}s the set: the file and its sidecars are deleted, scribe.db stays`, () => {
      h.mode = mode;
      put(h.disk, at(FILE), 64);
      put(h.disk, at(`${FILE}-wal`), 64);
      expect(secureBackupFilesAtLaunch()).toEqual({ kept: 0, deleted: 2, failed: 0, listFailed: false });
      expect(present(FILE) || present(`${FILE}-wal`)).toBe(false);
      expect(present('scribe.db')).toBe(true);
    });
  }

  it('the ScribeFiles module absent (Expo Go): fail closed, the file is deleted', () => {
    h.moduleAbsent = true;
    put(h.disk, at(FILE), 64);
    secureBackupFilesAtLaunch();
    expect(present(FILE)).toBe(false);
  });

  it('opening: an unexcluded file is refused (false) and gone; an excluded one and an absent one are fine', () => {
    h.mode = 'ignore';
    put(h.disk, at(FILE), 64);
    expect(backupFileIsSecure(FILE)).toBe(false);
    expect(present(FILE)).toBe(false);
    h.mode = 'stick';
    expect(backupFileIsSecure(FILE)).toBe(true); // absent: nothing to exclude yet
    put(h.disk, at(FILE), 64);
    expect(backupFileIsSecure(FILE)).toBe(true);
    expect(h.excluded.has(at(FILE))).toBe(true);
  });

  it('fail closed: the folder cannot be listed and the file is there and unexcluded: refused and deleted, not opened', () => {
    h.mode = 'ignore';
    put(h.disk, at(FILE), 64);
    put(h.disk, at(`${FILE}-wal`), 64);
    h.disk.unreadable.add(dir());
    expect(backupFileIsSecure(FILE)).toBe(false);
    expect(present(FILE) || present(`${FILE}-wal`)).toBe(false);
  });

  it('fail closed: the folder cannot be listed and the file is excluded: still secure (found by exact name)', () => {
    put(h.disk, at(FILE), 64);
    h.disk.unreadable.add(dir());
    expect(backupFileIsSecure(FILE)).toBe(true);
    expect(h.excluded.has(at(FILE))).toBe(true);
  });

  it('after the open the main file must exist, or the check is false', () => {
    expect(backupFileIsSecure(FILE, true)).toBe(false);
    put(h.disk, at(FILE), 64);
    expect(backupFileIsSecure(FILE, true)).toBe(true);
  });

  it('the launch step with an unlistable folder says so (a flag, no names) and throws nothing', () => {
    h.disk.unreadable.add(dir());
    expect(secureBackupFilesAtLaunch()).toEqual({ kept: 0, deleted: 0, failed: 0, listFailed: true });
  });

  it('a delete that fails is counted, and the file is refused at open', () => {
    h.mode = 'ignore';
    put(h.disk, at(FILE), 64);
    h.disk.undeletable.add(at(FILE));
    expect(backupFileIsSecure(FILE)).toBe(false);
    expect(secureBackupFilesAtLaunch()).toMatchObject({ deleted: 0, failed: 1 });
    expect(present(FILE)).toBe(true);
  });

  it('close and re-open: sidecars SQLite re-creates are re-marked by the check after the open', () => {
    put(h.disk, at(FILE), 64);
    put(h.disk, at(`${FILE}-wal`), 64);
    put(h.disk, at(`${FILE}-shm`), 64);
    expect(backupFileIsSecure(FILE, true)).toBe(true);
    // Clean close: SQLite removes the sidecars; the next open re-creates them with no attribute.
    h.disk.files.delete(at(`${FILE}-wal`));
    h.disk.files.delete(at(`${FILE}-shm`));
    h.excluded.delete(at(`${FILE}-wal`));
    h.excluded.delete(at(`${FILE}-shm`));
    expect(backupFileIsSecure(FILE)).toBe(true);
    put(h.disk, at(`${FILE}-wal`), 64);
    put(h.disk, at(`${FILE}-shm`), 64);
    expect(h.excluded.has(at(`${FILE}-wal`))).toBe(false);
    expect(backupFileIsSecure(FILE, true)).toBe(true);
    for (const x of ['', '-wal', '-shm']) expect(h.excluded.has(at(FILE + x)), x).toBe(true);
  });

  it('the store opens through the check: an unexcluded file is refused, never opened; an excluded one opens; the handle is closed on a refusal after the open', () => {
    const opened: string[] = [];
    let closed = 0;
    const open = (n: string) => {
      opened.push(n);
      put(h.disk, at(n), 64);
      return { close: () => void (closed += 1) };
    };
    h.mode = 'ignore';
    put(h.disk, at(FILE), 64);
    expect(() => openSecureBackupFile(FILE, open)).toThrow(BackupFileNotExcluded);
    expect(opened).toEqual([]);
    expect(present(FILE)).toBe(false);
    // A new file: clean before, the OS refuses the mark once it exists: opened, then closed and refused.
    expect(() => openSecureBackupFile(FILE, open)).toThrow(BackupFileNotExcluded);
    expect(opened).toEqual([FILE]);
    expect(closed).toBe(1);
    h.mode = 'stick';
    expect(() => openSecureBackupFile(FILE, open)).not.toThrow();
    expect(h.excluded.has(at(FILE))).toBe(true);
  });

  it('the launch step is called from startBackup with the flag off (gate.ts)', () => {
    const src = readFileSync(join(__dirname, '../src/lib/backup/gate.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function startBackup'));
    expect(body.indexOf('secureBackupFilesAtLaunch()')).toBeGreaterThan(-1);
    expect(body.indexOf('secureBackupFilesAtLaunch()')).toBeLessThan(body.indexOf('loadBackup()'));
  });
});

describe('[B5-8] the recovery export still copies scribe.db* only (X-2)', () => {
  it('guard: backup-*.db is not a database file to the export', () => {
    const sqlite = (name: string) => folderFor({ name, source: 'sqlite' });
    expect(sqlite('scribe.db-wal')).toBe('database');
    expect(sqlite(FILE)).toBeNull();
    expect(sqlite(`${FILE}-wal`)).toBeNull();
  });
  it('listBackupFiles never lists scribe.db', () => {
    expect(listBackupFiles()).toEqual([]);
  });
});
