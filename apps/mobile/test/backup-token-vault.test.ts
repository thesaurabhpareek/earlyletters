/// <reference types="node" />
/**
 * [B5-6] and [B5-9] (BRIEF B5, CR-71 B5): an upload token lives in the Keychain and the backup state file holds none;
 * Erase everything and sign-out remove it; tokens an older build left in the column move once at launch. The Keychain
 * is a map, the database is a real SQLite engine (node:sqlite), the disk is the app's stand-in. Fictional Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openBackupDb } from '../src/lib/backup/local-db';
import { BACKUP_TOKENS_KEY, createTokenStore, putTokens, removeAllBackupTokens, removeBackupTokensFor } from '../src/lib/backup/token-vault';
import type { KeyValueStorage } from '../src/lib/supabase/secure-storage';
import { createDisk, iosContainer, layOutApp, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  dbs: new Map<string, import('../src/lib/db/sql').SqlDb>(),
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: {} }));
vi.mock('../modules/scribe-files', () => ({ ScribeFiles: null }));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents}SQLite`;
  },
  openDatabaseSync: (name: string) => {
    const db = h.dbs.get(name)!;
    return {
      getFirstSync: (sql: string, p: (string | number)[] = []) => db.get(sql, ...p),
      getAllSync: (sql: string, p: (string | number)[] = []) => db.all(sql, ...p),
      runSync: (sql: string, p: (string | number)[] = []) => db.run(sql, ...p),
      withTransactionSync: (fn: () => void) => db.transaction(fn),
      closeSync: () => undefined,
    };
  },
}));

const ASHA = '3f2b8c1e-5d4a-4e7b-9c60-1a2b3c4d5e6f';
const AVI = '7a1c9d2e-0b3f-4a5d-8e6c-2f1a0b9c8d7e';
const FILE = `backup-${ASHA}.db`;
const ENTRY = '01928c3e-5a2b-7c3d-8e4f-000000000001';

function keychain(): KeyValueStorage & { map: Map<string, string>; failGet: boolean; failSet: boolean } {
  const map = new Map<string, string>();
  const k = {
    map,
    failGet: false,
    failSet: false,
    getItem: async (key: string) => {
      if (k.failGet) throw new Error('locked');
      return map.get(key) ?? null;
    },
    setItem: async (key: string, v: string) => {
      if (k.failSet) throw new Error('locked');
      map.set(key, v);
    },
    removeItem: async (key: string) => void map.delete(key),
  };
  return k;
}

/** A backup state file the way an older build left it: the schema, and a job with its token in the column. */
function oldFileWithToken(name: string, token: string | null) {
  const { db } = nodeDb();
  const b = openBackupDb(db, () => '2026-10-29T19:00:00.000Z');
  b.insertJob({ entryId: ENTRY, childId: 'c1', source: 'letter', audioUri: 'file:///a.m4a', audioSha256: 'x', audioBytes: 1, capturedAt: '2026-10-29T19:00:00.000Z' });
  if (token) db.run('UPDATE backup_jobs SET upload_token = ? WHERE entry_id = ?', token, ENTRY);
  h.dbs.set(name, db);
  put(h.disk, `${h.disk.documents}SQLite/${name}`, 64);
  return db;
}
const column = (name: string) => h.dbs.get(name)!.get<{ upload_token: string | null }>('SELECT upload_token FROM backup_jobs WHERE entry_id = ?', ENTRY)!.upload_token;

beforeEach(() => {
  h.disk = createDisk(iosContainer('ASHA-PHONE'));
  layOutApp(h.disk);
  h.dbs.clear();
});

describe('[B5-6] the token store: one Keychain item, per account', () => {
  it('set and get round-trip; remove drops one; a second account has its own', async () => {
    const kc = keychain();
    const a = createTokenStore(ASHA, kc);
    const v = createTokenStore(AVI, kc);
    await a.set(ENTRY, 'asha-token');
    await v.set(ENTRY, 'avi-token');
    expect([await a.get(ENTRY), await v.get(ENTRY)]).toEqual(['asha-token', 'avi-token']);
    expect(kc.map.size).toBe(1);
    await a.remove(ENTRY);
    expect([await a.get(ENTRY), await v.get(ENTRY)]).toEqual([null, 'avi-token']);
  });

  it('two writes at once lose neither (serialised)', async () => {
    const kc = keychain();
    const a = createTokenStore(ASHA, kc);
    await Promise.all([a.set('e1', 't1'), a.set('e2', 't2'), a.set('e3', 't3')]);
    expect(await Promise.all([a.get('e1'), a.get('e2'), a.get('e3')])).toEqual(['t1', 't2', 't3']);
  });

  it('a Keychain that cannot be read makes a write fail; it never overwrites what it could not read', async () => {
    const kc = keychain();
    await createTokenStore(ASHA, kc).set(ENTRY, 'asha-token');
    kc.failGet = true;
    await expect(createTokenStore(ASHA, kc).set('e2', 'x')).rejects.toThrow();
    kc.failGet = false;
    expect(await createTokenStore(ASHA, kc).get(ENTRY)).toBe('asha-token');
  });

  it('sign-out removes that account\'s tokens only; Erase removes the item; both are safe to repeat', async () => {
    const kc = keychain();
    await createTokenStore(ASHA, kc).set(ENTRY, 'asha-token');
    await createTokenStore(AVI, kc).set(ENTRY, 'avi-token');
    await removeBackupTokensFor(ASHA, kc);
    await removeBackupTokensFor(ASHA, kc);
    expect([await createTokenStore(ASHA, kc).get(ENTRY), await createTokenStore(AVI, kc).get(ENTRY)]).toEqual([null, 'avi-token']);
    await removeAllBackupTokens(kc);
    await removeAllBackupTokens(kc);
    expect(kc.map.has(BACKUP_TOKENS_KEY)).toBe(false);
  });

  it('sign-out never throws when the Keychain refuses', async () => {
    const kc = keychain();
    kc.failGet = true;
    await expect(removeBackupTokensFor(ASHA, kc)).resolves.toBeUndefined();
  });
});

describe('[B5-9] existing token rows move to the Keychain once at launch, the column is nulled, a second run changes nothing', () => {
  async function run() {
    vi.resetModules();
    const kc = keychain();
    // launch-migrate uses the app's Keychain wrapper: stand it in with this map
    vi.doMock('../src/lib/supabase/secure-storage', () => ({ secureStorage: kc }));
    const m = await import('../src/lib/backup/launch-migrate');
    return { m, kc };
  }

  it('moves the token, nulls the column, writes the marker; the second run moves nothing', async () => {
    oldFileWithToken(FILE, 'asha-token');
    const { m, kc } = await run();
    expect(await m.moveBackupTokensToKeychain()).toEqual({ moved: 1, failed: 0 });
    expect(column(FILE)).toBeNull();
    expect(JSON.parse(kc.map.get(BACKUP_TOKENS_KEY)!)).toEqual({ [`${ASHA}:${ENTRY}`]: 'asha-token' });
    expect(h.dbs.get(FILE)!.get('SELECT value FROM backup_meta WHERE key = ?', m.TOKENS_IN_KEYCHAIN)).not.toBeNull();
    kc.map.clear();
    expect(await m.moveBackupTokensToKeychain()).toEqual({ moved: 0, failed: 0 });
    expect(kc.map.size).toBe(0); // the marker stopped it: nothing was written back
  });

  it('a Keychain that refuses: the column keeps the token, no marker, and the next launch moves it', async () => {
    oldFileWithToken(FILE, 'asha-token');
    const { m, kc } = await run();
    kc.failSet = true;
    expect(await m.moveBackupTokensToKeychain()).toEqual({ moved: 0, failed: 1 });
    expect(column(FILE)).toBe('asha-token');
    expect(h.dbs.get(FILE)!.get('SELECT value FROM backup_meta WHERE key = ?', m.TOKENS_IN_KEYCHAIN)).toBeNull();
    kc.failSet = false;
    expect(await m.moveBackupTokensToKeychain()).toEqual({ moved: 1, failed: 0 });
    expect(column(FILE)).toBeNull();
  });

  it('a file with no token, or one never opened by the app (no tables), is left alone; scribe.db is never opened', async () => {
    oldFileWithToken(FILE, null);
    h.dbs.set(`backup-${AVI}.db`, nodeDb().db); // no schema
    put(h.disk, `${h.disk.documents}SQLite/backup-${AVI}.db`, 64);
    const { m, kc } = await run();
    expect(await m.moveBackupTokensToKeychain()).toEqual({ moved: 0, failed: 0 });
    expect(kc.map.size).toBe(0);
  });

  it('runs from startBackup with the flag off (gate.ts), after the exclusion step, and is never awaited', () => {
    const src = readFileSync(join(__dirname, '../src/lib/backup/gate.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function startBackup'));
    expect(body.indexOf('secureBackupFilesAtLaunch()')).toBeLessThan(body.indexOf('void moveBackupTokensToKeychain()'));
    expect(body.indexOf('void moveBackupTokensToKeychain()')).toBeLessThan(body.indexOf('loadBackup()'));
  });
});

describe('[B5-6] the seams', () => {
  it('Erase everything removes the token item in finish(); sign-out removes the account\'s tokens beside its file', () => {
    const erase = readFileSync(join(__dirname, '../src/lib/erase-everything.ts'), 'utf8');
    expect(erase).toMatch(/await removeAllBackupTokens\(\)/);
    const provider = readFileSync(join(__dirname, '../src/lib/auth/session-provider.tsx'), 'utf8');
    expect(provider).toMatch(/endBackupFileFor\(before\);\s*void removeBackupTokensFor\(before\);/);
  });

  it('putTokens merges into what is there', async () => {
    const kc = keychain();
    await createTokenStore(AVI, kc).set(ENTRY, 'avi-token');
    await putTokens(ASHA, [{ entryId: ENTRY, token: 'asha-token' }], kc);
    expect(await createTokenStore(AVI, kc).get(ENTRY)).toBe('avi-token');
    expect(await createTokenStore(ASHA, kc).get(ENTRY)).toBe('asha-token');
  });
});
