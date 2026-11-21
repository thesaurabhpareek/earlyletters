/// <reference types="node" />
/**
 * [B5-3] the store's open of the backup file, through runtime.ts `dbFor` (Review A on B5 PR 1), and [B5-5] sign-out
 * closes the handle before it deletes the file (CR-71 B5). The native pieces are stand-ins: the database open creates
 * the main file and the -wal and -shm sidecars on the fake disk, the OS exclusion call can be made to read false.
 * Swapping `openSecureBackupFile` for a direct `openNativeDb` in dbFor turns the first test red. Fictional Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, layOutApp, put, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  stick: true,
  opens: 0,
  closes: 0,
  events: [] as string[],
  inert: () => new Proxy({}, { get: (_t, k) => (k === '__esModule' ? false : k === 'then' ? undefined : () => undefined) }) as Record<string, unknown>,
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents}SQLite`;
  },
}));
vi.mock('../modules/scribe-files', () => ({
  ScribeFiles: {
    setExcludedFromBackup: (uri: string) => {
      if (h.stick) h.excluded.add(uri);
    },
    isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
  },
}));
vi.mock('../src/lib/db/repos/open-native', async () => {
  const { nodeDb: node } = await import('./helpers/node-db');
  const { put: putFile } = await import('./helpers/expo-fs-standin');
  return {
    openNativeDb: (name: string) => {
      h.opens += 1;
      for (const s of ['', '-wal', '-shm']) putFile(h.disk, `${h.disk.documents}SQLite/${name}${s}`, 64);
      const n = node();
      return {
        db: n.db,
        close: () => {
          h.closes += 1;
          h.events.push(`close:${[...h.disk.files.keys()].some((u) => u.endsWith(name))}`);
          n.close();
        },
      };
    },
  };
});
// Everything else runtime.ts imports is native or app wiring that opening a file never reaches.
vi.mock('expo-crypto', () => h.inert());
vi.mock('expo-network', () => h.inert());
vi.mock('expo-constants', () => h.inert());
vi.mock('react-native', () => h.inert());
vi.mock('../modules/scribe-audio', () => ({ ScribeAudio: null }));
vi.mock('../modules/scribe-keys', () => ({ ScribeKeys: null, scribeKeysErrorCode: () => null }));
vi.mock('../src/lib/audio-mode', () => h.inert());
vi.mock('../src/lib/capture/recorder', () => h.inert());
vi.mock('../src/lib/remote', () => h.inert());
vi.mock('../src/lib/store', () => h.inert());
vi.mock('../src/lib/supabase', () => h.inert());
vi.mock('../src/lib/supabase/env', () => h.inert());
vi.mock('../src/lib/build-env', () => ({ APP_ENV: 'test' }));
vi.mock('../src/lib/auth/auth-store', () => h.inert());
vi.mock('../src/lib/capabilities', () => h.inert());

const ASHA = '3f2b8c1e-5d4a-4e7b-9c60-1a2b3c4d5e6f';
const FILE = `backup-${ASHA}.db`;
const at = (n: string) => `${h.disk.documents}SQLite/${n}`;
const gone = () => ['', '-wal', '-shm'].every((s) => !h.disk.files.has(at(FILE + s)));

beforeEach(() => {
  h.disk = createDisk(iosContainer('ASHA-PHONE'));
  layOutApp(h.disk);
  h.excluded.clear();
  h.stick = true;
  h.opens = 0;
  h.closes = 0;
  h.events = [];
  vi.resetModules();
});

describe('[B5-3] dbFor opens the backup file only through the exclusion check', () => {
  it('the OS will not hold the exclusion: the handle is closed, the error is thrown, the file and its sidecars are gone', async () => {
    h.stick = false;
    const rt = await import('../src/lib/backup/runtime');
    expect(() => rt.openBackupDbForTests(ASHA)).toThrow('backup_file_not_excluded');
    expect(h.opens).toBe(1);
    expect(h.closes).toBe(1);
    expect(gone()).toBe(true);
    expect(h.disk.files.has(at('scribe.db'))).toBe(true);
  });

  it('the exclusion holds: the file opens, stays, and its -wal and -shm are excluded too', async () => {
    const rt = await import('../src/lib/backup/runtime');
    expect(() => rt.openBackupDbForTests(ASHA)).not.toThrow();
    expect(h.closes).toBe(0);
    for (const s of ['', '-wal', '-shm']) expect(h.excluded.has(at(FILE + s)), s).toBe(true);
  });
});

describe('[B5-5] sign-out closes the backup handle, then deletes the file; the book stays', () => {
  it('the handle closes while the file still exists, then the file family goes; scribe.db and the other account stay', async () => {
    const rt = await import('../src/lib/backup/runtime');
    rt.openBackupDbForTests(ASHA);
    const { endBackupFileFor } = await import('../src/lib/backup/files'); // the instance the runtime registered with
    const other = 'backup-7a1c9d2e-0b3f-4a5d-8e6c-2f1a0b9c8d7e.db';
    put(h.disk, at(other), 64);
    endBackupFileFor(ASHA);
    expect(h.events).toEqual(['close:true']);
    expect(gone()).toBe(true);
    expect(h.disk.files.has(at(other))).toBe(true);
    expect(h.disk.files.has(at('scribe.db'))).toBe(true);
  });

  it('mid-pass: after sign-out, dbFor for that account throws and re-creates nothing; its next service build (a sign-in) opens again', async () => {
    const rt = await import('../src/lib/backup/runtime');
    const files = await import('../src/lib/backup/files');
    rt.openBackupDbForTests(ASHA);
    files.endBackupFileFor(ASHA);
    expect(gone()).toBe(true);
    const opensBefore = h.opens;
    expect(() => rt.openBackupDbForTests(ASHA)).toThrow('backup_account_ended');
    expect(h.opens).toBe(opensBefore);
    expect(gone()).toBe(true);
    files.backupAccountStarted(ASHA); // what building the account's next service does
    expect(() => rt.openBackupDbForTests(ASHA)).not.toThrow();
    expect(h.disk.files.has(at(FILE))).toBe(true);
  });

  it('the runtime clears the mark only when it builds an account\'s service', () => {
    const src = readFileSync(join(__dirname, '../src/lib/backup/runtime.ts'), 'utf8');
    expect(src).toMatch(/createAccountHost<BackupService>\(\(uid\) => \{\s*backupAccountStarted\(uid\);/);
    expect(src.match(/backupAccountStarted\(/g)).toHaveLength(1);
  });

  it('a second sign-out, or one for an account that never had a file, changes nothing and does not throw', async () => {
    await import('../src/lib/backup/runtime');
    const { endBackupFileFor } = await import('../src/lib/backup/files');
    expect(() => endBackupFileFor(ASHA)).not.toThrow();
    expect(() => endBackupFileFor('not-a-uuid')).not.toThrow();
    expect(h.disk.files.has(at('scribe.db'))).toBe(true);
  });

  it('with the flag off (no runtime loaded) the file is still deleted', async () => {
    const { endBackupFileFor } = await import('../src/lib/backup/files');
    put(h.disk, at(FILE), 64);
    put(h.disk, at(`${FILE}-wal`), 64);
    endBackupFileFor(ASHA);
    expect(gone()).toBe(true);
  });
});

describe('[B5-5] the sign-out seam', () => {
  it('session-provider ends the file of the account that went or was replaced, beside the reminders', () => {
    const src = readFileSync(join(__dirname, '../src/lib/auth/session-provider.tsx'), 'utf8');
    expect(src).toMatch(/void settleReminderSession\(before, sessionUser\);\s*\/\/[^\n]*\n\s*if \(before && before !== sessionUser\) endBackupFileFor\(before\);/);
  });
});
