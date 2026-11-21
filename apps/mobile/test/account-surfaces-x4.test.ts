/// <reference types="node" />
/**
 * [X4-R1] per surface: account B signs in on a phone that holds account A's letters and sees none of A's data
 * through the Find index, the reminder planner input, the outbox, the claim and the uploads (NS-10-R5; test plan b13
 * section 3, risk 1). Uses the account-scope reader (lib/auth/account-scope.logic.ts) and the real auth store.
 *
 * `it.fails` marks a surface that leaks on develop today: the test states the rule, runs red against the code, and
 * the suite stays green. When the surface is fixed vitest reports the test as unexpectedly passing, and the
 * `.fails` is removed in the fixing PR. Fictional family "Asha" only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { findFixture } from './find-fixture';
import { bookVisibleTo } from '../src/lib/auth/account-scope.logic';
import { needsAccountClaim } from '../src/lib/auth/account-claim.logic';
import { authUserId } from '../src/lib/auth/machine.logic';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine } from '../src/lib/sync/engine';
import { reconcileSearch, setIndexableBooks } from '../src/lib/find/lifecycle';
import { searchLetters } from '../src/lib/find/search';
import { SYNC_SETTING, pendingCount, readSetting, writeSetting } from '../src/lib/sync/outbox';
import { AccountMismatchError, takeOwnership } from '../src/lib/sync/ownership';
import type { RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { insertBook } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const auth = await import('../src/lib/auth/auth-store');
const { plannerChildren } = await import('../src/lib/reminders/prefs');

const A = '0192f0aa-0000-7000-8000-0000000000a1'; // owns the letters on this phone
const B = '0192f0aa-0000-7000-8000-0000000000b2'; // signs in on the same phone
const BOOK = '0199a5b0-0000-7000-8000-00000000b001';
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: NOW, newId: id7 };
const asB = () => auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });

afterEach(() => {
  setIndexableBooks(null);
  auth.resetAuthStoreForTests();
});

describe('[X4-R1] Find: B never finds A\'s words', () => {
  it('the seam, scoped by the account reader: with A the owner and B the session, the index holds and returns none of A\'s letters', () => {
    const f = findFixture();
    f.add({ text: 'Asha, you laughed at the rain today.' });
    expect(searchLetters(f.db, 'rain', 'child-asha')).toMatchObject({ status: 'done', hits: [expect.anything()] }); // control: A finds it
    writeSetting(f.db, SYNC_SETTING.owner, A);
    setIndexableBooks((db) =>
      db.all<{ id: string }>('SELECT id FROM children').filter(() => bookVisibleTo({ owner: readSetting(db, SYNC_SETTING.owner), sessionUser: B })).map((c) => c.id),
    );
    reconcileSearch(f.db); // the catch-up re-reads the seam: a book that stopped being indexable leaves the index
    const found = searchLetters(f.db, 'rain', 'child-asha');
    expect(found).toMatchObject({ status: 'done' });
    expect(found.status === 'done' ? found.hits : null).toEqual([]);
  });

  it.fails('production: B signed in over A\'s phone, a search of A\'s book returns nothing (setIndexableBooks is never registered outside tests)', () => {
    const f = findFixture();
    f.add({ text: 'Asha, you laughed at the rain today.' });
    writeSetting(f.db, SYNC_SETTING.owner, A);
    asB();
    const r = searchLetters(f.db, 'rain', 'child-asha');
    expect(r.status === 'done' ? r.hits : null).toEqual([]);
  });

  it.fails('the seam is wired: some file outside lib/find registers setIndexableBooks', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
    const root = join(__dirname, '../src');
    const callers = walk(root).filter((p) => !p.includes('/lib/find/') && /setIndexableBooks\(/.test(readFileSync(p, 'utf8')));
    expect(callers).not.toEqual([]);
  });
});

describe('[X4-R1] the reminder planner input: B\'s planner is not handed A\'s books', () => {
  let close: () => void = () => {};
  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: id7 }).ok).toBe(true);
    insertBook(store.localSqlDb(), { id: BOOK, name: 'Asha', birthday: '2026-03-01', at: NOW });
    writeSetting(store.localSqlDb(), SYNC_SETTING.owner, A);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('control: with A signed in, the planner input holds A\'s book', () => {
    auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
    expect(plannerChildren().map((c) => c.id)).toEqual([BOOK]);
  });

  it.fails('B signed in on A\'s phone: plannerChildren() is empty (it names Asha today, nothing filters by session)', () => {
    asB();
    expect(bookVisibleTo({ owner: store.currentUserId(), sessionUser: authUserId(auth.getAuthSnapshot()) })).toBe(false);
    expect(plannerChildren()).toEqual([]);
  });
});

describe('[X4-R1][NS-10-R5] outbox, claim and uploads: B never claims or sends A\'s letters', () => {
  let db: SqlDb;
  let close: () => void;
  beforeEach(() => {
    const h = nodeDb();
    db = h.db;
    close = h.close;
    migrate(db, ctx);
    // A's phone: a book and a letter made before sign-in, claimed by A (queued uploads), then A signs out unsynced.
    insertBook(db, { id: BOOK, name: 'Asha', birthday: '2026-03-01', at: NOW });
    takeOwnership(db, A, ctx);
  });
  afterEach(() => close());

  const calls: { fn: string }[] = [];
  const server = (): SupabaseLike => ({
    rpc(fn): Promise<RpcResult> {
      calls.push({ fn });
      return Promise.resolve({ data: null, error: { code: '', message: 'offline' }, status: 0 });
    },
  });
  beforeEach(() => {
    calls.length = 0;
  });

  it('claim: B is refused at takeOwnership, nothing on the phone changes, and no claim screen is asked for', () => {
    const queued = pendingCount(db);
    expect(queued).toBeGreaterThan(0);
    const before = db.all('SELECT id, created_by, server_state FROM children');
    expect(() => takeOwnership(db, B, ctx)).toThrow(AccountMismatchError);
    expect(readSetting(db, SYNC_SETTING.owner)).toBe(A);
    expect(db.all('SELECT id, created_by, server_state FROM children')).toEqual(before);
    expect(pendingCount(db)).toBe(queued);
    expect(needsAccountClaim({ userId: B, owner: A, hasLocalData: true, confirmed: new Set() })).toBe(false);
  });

  it('outbox and uploads: B\'s engine on A\'s phone starts into a mismatch, sends nothing, pulls nothing, and A\'s queue is untouched', async () => {
    const queued = pendingCount(db);
    const ops = db.all<{ op_id: string; sent_at: string | null }>('SELECT op_id, sent_at FROM sync_outbox ORDER BY seq');
    const engine = createSyncEngine({
      db, supabase: server(), userId: B, newId: id7, now: () => Date.parse(NOW), random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => true,
    });
    expect(engine.start()).toBeNull();
    expect(engine.status().phase).toBe('account_mismatch');
    await engine.sync();
    engine.requestSync('foreground');
    expect(calls).toEqual([]); // no sync_push, no sync_pull under B
    expect(pendingCount(db)).toBe(queued);
    expect(db.all('SELECT op_id, sent_at FROM sync_outbox ORDER BY seq')).toEqual(ops);
    expect(readSetting(db, SYNC_SETTING.owner)).toBe(A);
  });

  it('uploads: A\'s own engine on the same phone still sends the queue (the control for the test above)', async () => {
    const engine = createSyncEngine({
      db, supabase: server(), userId: A, newId: id7, now: () => Date.parse(NOW), random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => true,
    });
    expect(engine.start()).not.toBeNull();
    await engine.sync();
    expect(calls.some((c) => c.fn === 'sync_push')).toBe(true);
  });
});
