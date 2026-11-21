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
import { backupFileIsSecure, isBackupFileName, listBackupFiles, secureBackupFilesAtLaunch } from '../src/lib/backup/files';
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
    expect(secureBackupFilesAtLaunch()).toEqual({ kept: 1, deleted: 0 });
    expect(h.excluded.has(at(FILE))).toBe(true);
    expect(present(FILE)).toBe(true);
  });

  it('a phone with no backup file does nothing and sets nothing', () => {
    expect(secureBackupFilesAtLaunch()).toEqual({ kept: 0, deleted: 0 });
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
      expect(secureBackupFilesAtLaunch()).toEqual({ kept: 0, deleted: 2 });
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

  it('runtime.ts checks before it opens and again after', () => {
    const src = readFileSync(join(__dirname, '../src/lib/backup/runtime.ts'), 'utf8');
    const body = src.slice(src.indexOf('function dbFor'));
    const first = body.indexOf('backupFileIsSecure(file)');
    const open = body.indexOf('openNativeDb(file)');
    const second = body.indexOf('backupFileIsSecure(file)', open);
    expect(first).toBeGreaterThan(-1);
    expect(open).toBeGreaterThan(first);
    expect(second).toBeGreaterThan(open);
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
