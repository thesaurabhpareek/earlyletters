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
  opens: [] as string[],
  excludeSticks: true,
  excluded: new Set<string>(),
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: {} }));
vi.mock('../modules/scribe-files', () => ({
  ScribeFiles: {
    setExcludedFromBackup: (uri: string) => {
      if (h.excludeSticks) h.excluded.add(uri);
    },
    isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
  },
}));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents}SQLite`;
  },
  openDatabaseSync: (name: string) => {
    h.opens.push(name);
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
  h.opens = [];
  h.excluded.clear();
  h.excludeSticks = true;
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

describe('[B5-9] the signed-in account\'s old token rows move to the Keychain once, after the settled sweep', () => {
  async function run() {
    vi.resetModules();
    h.opens = [];
    const kc = keychain();
    // launch-migrate uses the app's Keychain wrapper: stand it in with this map
    vi.doMock('../src/lib/supabase/secure-storage', () => ({ secureStorage: kc }));
    const m = await import('../src/lib/backup/launch-migrate');
    const files = await import('../src/lib/backup/files');
    return { m, kc, files };
  }
  const marker = (name: string, key: string) => h.dbs.get(name)!.get('SELECT value FROM backup_meta WHERE key = ?', key);
  const AVI_FILE = `backup-${AVI}.db`;

  it('moves the token, nulls the column, writes the marker; the second run moves nothing and writes nothing', async () => {
    oldFileWithToken(FILE, 'asha-token');
    const { m, kc } = await run();
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 1, failed: 0 });
    expect(column(FILE)).toBeNull();
    expect(JSON.parse(kc.map.get(BACKUP_TOKENS_KEY)!)).toEqual({ [`${ASHA}:${ENTRY}`]: 'asha-token' });
    expect(marker(FILE, m.TOKENS_IN_KEYCHAIN)).not.toBeNull();
    kc.map.clear();
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 0, failed: 0 });
    expect(kc.map.size).toBe(0); // the marker stopped it: nothing was written back
  });

  it('a Keychain that refuses: the column keeps the token, no marker, and the next run moves it', async () => {
    oldFileWithToken(FILE, 'asha-token');
    const { m, kc } = await run();
    kc.failSet = true;
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 0, failed: 1 });
    expect(column(FILE)).toBe('asha-token');
    expect(marker(FILE, m.TOKENS_IN_KEYCHAIN)).toBeNull();
    kc.failSet = false;
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 1, failed: 0 });
    expect(column(FILE)).toBeNull();
  });

  it('only the kept account: another account\'s file is never opened and its Keychain tokens are pruned; signed out prunes all and opens nothing', async () => {
    oldFileWithToken(FILE, 'asha-token');
    oldFileWithToken(AVI_FILE, 'avi-token');
    const { m, kc } = await run();
    await putTokens(AVI, [{ entryId: ENTRY, token: 'avi-old' }], kc);
    await putTokens('c0ffee00-0000-4000-8000-000000000001', [{ entryId: ENTRY, token: 'orphan-old' }], kc);
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 1, failed: 0 });
    expect(h.opens).toEqual([FILE]);
    expect(h.dbs.get(AVI_FILE)!.get<{ upload_token: string }>('SELECT upload_token FROM backup_jobs')!.upload_token).toBe('avi-token');
    expect(Object.keys(JSON.parse(kc.map.get(BACKUP_TOKENS_KEY)!))).toEqual([`${ASHA}:${ENTRY}`]);
    h.opens = [];
    expect(await m.settleBackupTokens(null)).toEqual({ moved: 0, failed: 0 });
    expect(h.opens).toEqual([]);
    expect(kc.map.has(BACKUP_TOKENS_KEY)).toBe(false);
  });

  it('never creates a file: with none on the disk, nothing is opened; an account that signed out since (the tombstone) is skipped', async () => {
    const { m, files } = await run();
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 0, failed: 0 });
    expect(h.opens).toEqual([]);
    oldFileWithToken(FILE, 'asha-token');
    files.endBackupFileFor(ASHA); // signed out: tombstone set, file deleted
    put(h.disk, `${h.disk.documents}SQLite/${FILE}`, 64); // a stale file is back
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 0, failed: 0 });
    expect(h.opens).toEqual([]);
  });

  it('a file that cannot be excluded is deleted and not opened (the store\'s own check)', async () => {
    oldFileWithToken(FILE, 'asha-token');
    h.excludeSticks = false;
    const { m } = await run();
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 0, failed: 1 });
    expect(h.opens).toEqual([]);
    expect(h.disk.files.has(`${h.disk.documents}SQLite/${FILE}`)).toBe(false);
  });

  it('nulls only the rows it moved: a token written meanwhile stays', async () => {
    const db = oldFileWithToken(FILE, 'asha-token');
    const { m, kc } = await run();
    const setItem = kc.setItem;
    kc.setItem = async (k, v) => {
      await setItem(k, v);
      db.run(`INSERT INTO backup_jobs (entry_id, child_id, source, audio_uri, audio_sha256, audio_bytes, captured_at, state, upload_token, updated_at)
        VALUES ('01928c3e-5a2b-7c3d-8e4f-000000000002', 'c1', 'letter', 'file:///b.m4a', 'y', 1, '2026-10-29T19:00:00.000Z', 'begun', 'asha-token-new', 'now')`);
    };
    expect(await m.settleBackupTokens(ASHA)).toEqual({ moved: 1, failed: 0 });
    expect(column(FILE)).toBeNull();
    expect(db.get<{ upload_token: string }>(`SELECT upload_token FROM backup_jobs WHERE entry_id = '01928c3e-5a2b-7c3d-8e4f-000000000002'`)!.upload_token).toBe('asha-token-new');
  });

  it('canary: no token appears in a result, an error or the console, whether the move works or fails', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((k) => vi.spyOn(console, k).mockImplementation(() => undefined));
    oldFileWithToken(FILE, 'CANARY-TOKEN-asha');
    const { m, kc } = await run();
    kc.failSet = true;
    const bad = await m.settleBackupTokens(ASHA);
    kc.failSet = false;
    const good = await m.settleBackupTokens(ASHA);
    const failing = createTokenStore(ASHA, { ...keychain(), getItem: async () => { throw new Error('locked'); } });
    const err = await failing.set(ENTRY, 'CANARY-TOKEN-asha').catch((e: Error) => e);
    const seen = JSON.stringify([bad, good, String((err as Error).message), spies.flatMap((s) => s.mock.calls)]);
    expect(seen).not.toContain('CANARY');
    for (const s of spies) s.mockRestore();
  });

  it('sign-out, as the provider runs it: the account\'s file closes and goes, its Keychain tokens go, another account\'s stay; a switch is pruned by the settled sweep', async () => {
    oldFileWithToken(FILE, null);
    oldFileWithToken(AVI_FILE, null);
    const { m, kc, files } = await run();
    const tv = await import('../src/lib/backup/token-vault');
    await tv.createTokenStore(ASHA, kc).set(ENTRY, 'asha-token');
    await tv.createTokenStore(AVI, kc).set(ENTRY, 'avi-token');
    const closed: (string | null)[] = [];
    files.registerBackupHandleCloser((id) => void closed.push(id));
    // the effect's two calls when `before` (Asha) is no longer the signed-in user
    files.endBackupFileFor(ASHA);
    await tv.removeBackupTokensFor(ASHA);
    expect(closed).toEqual([ASHA]);
    expect(h.disk.files.has(`${h.disk.documents}SQLite/${FILE}`)).toBe(false);
    expect(h.disk.files.has(`${h.disk.documents}SQLite/${AVI_FILE}`)).toBe(true);
    expect([await tv.createTokenStore(ASHA, kc).get(ENTRY), await tv.createTokenStore(AVI, kc).get(ENTRY)]).toEqual([null, 'avi-token']);
    // a kill before the removal above: the next settled sweep, for Avi, prunes Asha's lingering token
    await tv.createTokenStore(ASHA, kc).set(ENTRY, 'asha-token-again');
    files.deleteBackupFilesExcept(AVI);
    await m.settleBackupTokens(AVI);
    expect(await tv.createTokenStore(ASHA, kc).get(ENTRY)).toBeNull();
    expect(await tv.createTokenStore(AVI, kc).get(ENTRY)).toBe('avi-token');
  });

  it('prune and move run from the settled sweep, after the file sweep; the gate no longer starts the move', () => {
    const provider = readFileSync(join(__dirname, '../src/lib/auth/session-provider.tsx'), 'utf8');
    expect(provider).toMatch(/deleteBackupFilesExcept\(sweep\.keep\);[^]*?void settleBackupTokens\(sweep\.keep\);/);
    const gate = readFileSync(join(__dirname, '../src/lib/backup/gate.ts'), 'utf8');
    expect(gate).not.toMatch(/launch-migrate|moveBackupTokens/);
  });
});

describe('[B5-6] the seams', () => {
  it('sign-out removes the account\'s tokens beside its file', () => {
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
