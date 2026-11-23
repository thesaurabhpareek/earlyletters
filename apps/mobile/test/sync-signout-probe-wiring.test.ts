/// <reference types="node" />
/**
 * BL-1426: the sign-out probe that sync/index.ts registers counts only the signed-in account's queued rows (BL-449, PR #1273).
 * test/sync-signout-wait-owner.test.ts pins `pendingForAccount` as a function; this pins the wiring: startSync() registers
 * the probe, and `pendingUploads()` (the auth store's reader, a typed result since BL-1425) reads it.
 *
 * Mutation this test was written to catch (it failed this file, and only the first test, when made):
 *  M1 sync/index.ts registering plain `pendingCount(localSqlDb())` instead of the account-scoped read.
 * The other two tests hold on both the real code and M1: they keep the probe from being "always 0" and keep the
 * signed-out branch (no account to scope to) counting every row.
 * Real modules over node:sqlite; only natives and the network are stubbed (the harness of sync-release-empty-owner.test.ts).
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-10T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

const spies = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} }, rpc: vi.fn() })),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  rpc: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => ({ ...(spies.createClient as (...a: unknown[]) => object)(...args), rpc: spies.rpc }) }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: spies.addEventListener }, Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-crypto', async () => {
  const { randomBytes } = await import('node:crypto');
  return { getRandomBytes: (k: number) => new Uint8Array(randomBytes(k)) };
});
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
sync.setSyncKillSourceForTests({ killed: () => false, subscribe: () => () => {} });

let raw: SqlDb;
let closeDb: () => void = () => {};
let stop: () => void = () => {};
const settle = () => new Promise((r) => setTimeout(r, 20));

/** A phone owned by account A with one op waiting to go up (as in sync-signout-wait-owner.test.ts). */
function queueForA(db: SqlDb): void {
  writeSetting(db, SYNC_SETTING.owner, A);
  db.run("INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?)", id7(), id7(), NOW);
}

describe('[BL-1426] the sign-out probe registered by startSync() is account-scoped', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    vi.clearAllMocks();
    spies.rpc.mockImplementation(() => new Promise(() => {})); // the network never answers: A's op stays queued
    store.closeStore();
    const h = nodeDb();
    raw = h.db;
    closeDb = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: id7 }).ok).toBe(true);
    caps.setServerFeaturesForTests(true);
    auth.publishAuth({ status: 'signedOut' });
    auth.setClaimReaders({ owner: () => store.currentUserId(), hasLocalData: () => phoneHoldsAnyRow(store.localSqlDb()) });
    stop = sync.startSync();
  });
  afterEach(() => {
    stop();
    auth.publishAuth({ status: 'signedOut' });
    auth.setClaimReaders(null);
    caps.setServerFeaturesForTests(null);
    store.closeStore();
    closeDb();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("another account's queued rows are not counted: signed in as B on A's phone, pendingUploads() is 0 and the rows stay", async () => {
    queueForA(raw);
    auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });
    await settle();
    expect(await auth.pendingUploads()).toEqual({ kind: 'count', n: 0 });
    expect(raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n).toBe(1);
  });

  it("the owner's own queued rows are counted, so the probe is not always 0", async () => {
    queueForA(raw);
    auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
    await settle();
    expect(await auth.pendingUploads()).toEqual({ kind: 'count', n: 1 });
  });

  it('with no account signed in the probe counts every queued row', async () => {
    queueForA(raw);
    expect(await auth.pendingUploads()).toEqual({ kind: 'count', n: 1 });
  });
});
