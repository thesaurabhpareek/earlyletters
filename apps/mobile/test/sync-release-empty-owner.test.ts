/// <reference types="node" />
/**
 * An empty phone has no owner (review of PR #737, lens A, finding 2). `takeOwnership` wrote `sync.ownerId` on the first
 * sign-in even when the phone held no book, and nothing cleared it at sign-out, so "Use another account" (the child step)
 * and "Try another way" (No book here yet) left the second account to meet `AccountMismatchError`: its sync stopped
 * without a word and its book was authored under the first account. `releaseEmptyOwner` clears the owner when, and only
 * when, the phone holds nothing; sync/index.ts calls it when a signed-in session ends.
 *
 * Mutations these tests were written to catch (each one failed a test here when it was made):
 *  M1 `releaseEmptyOwner` clearing the owner whatever the phone holds;   M3 the outbox check left out;
 *  M2 the `phoneHoldsAnyRow` check left out;                             M4 sync/index.ts never calling it at sign-out;
 *  M5 sync/index.ts releasing at the start of the sign-out, not when it has finished;   M7 sync/index.ts passing a predicate that is always "empty";
 *  M6 sync/index.ts releasing before the engine is stopped;   M8 the held-draft cursor left behind on a release;
 *  M9 the recorded mismatch left standing after a release;
 *  M10 the engine writing a pull page that was out when the session ended (engine.ts, the guard after `sync_pull`; also
 *      test/sync-stopped-engine.test.ts).
 * Real modules over node:sqlite; only natives and the network are stubbed. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { SYNC_SETTING, readSetting, writeSetting } from '../src/lib/sync/outbox';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { AccountMismatchError, releaseEmptyOwner as release, takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';
import { pulledPage } from './helpers/pulled-page';
import { insertBook } from './helpers/store-fixture';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-10T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: NOW, newId: id7 };

function emptyPhone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: NOW, newId: id7 });
  return db;
}
/** As sync/index.ts calls it: with the claim screen's own question. */
const releaseEmptyOwner = (db: SqlDb) => release(db, phoneHoldsAnyRow);
const owner = (db: SqlDb) => readSetting(db, SYNC_SETTING.owner);
const count = (db: SqlDb, table: string) => db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)!.n;
const entry = (db: SqlDb, child: string | null, deletedAt: string | null = null) =>
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, deleted_at) VALUES (?, 'letter', '2026-11-09', ?, 'typed', 'verbatim', 2, 'Asha laughed.', '[]', 'Asha laughed.', 1, ?, ?, NULL, ?)`,
    id7(), NOW, NOW, child, deletedAt,
  );

describe('[NX-31-R12] releaseEmptyOwner on a real phone database', () => {
  it('an empty phone claimed by the first account is claimed afresh by the second, with no mismatch', () => {
    const db = emptyPhone();
    expect(takeOwnership(db, A, ctx)).toMatchObject({ outcome: 'claimed', books: 0, letters: 0 });
    expect(owner(db)).toBe(A);
    expect(releaseEmptyOwner(db)).toBe(true);
    expect(owner(db)).toBeNull();
    expect(takeOwnership(db, B, ctx)).toMatchObject({ outcome: 'claimed', books: 0 });
    expect(owner(db)).toBe(B);
  });

  it('without the release the second account meets the mismatch (the defect the release is for)', () => {
    const db = emptyPhone();
    takeOwnership(db, A, ctx);
    expect(() => takeOwnership(db, B, ctx)).toThrow(AccountMismatchError);
    expect(owner(db)).toBe(A);
  });

  it('a book on the phone keeps the owner: nothing is released and the second account still meets the mismatch', () => {
    const db = emptyPhone();
    const book = insertBook(db, { id: id7(), name: 'Asha', birthday: '2026-03-01', at: NOW });
    takeOwnership(db, A, ctx);
    expect(releaseEmptyOwner(db)).toBe(false);
    expect(owner(db)).toBe(A);
    expect(() => takeOwnership(db, B, ctx)).toThrow(AccountMismatchError);
    expect(db.get('SELECT id FROM children WHERE id = ?', book)).not.toBeNull(); // and nothing was deleted
  });

  it('a book and its letters keep the owner, and every row is still there', () => {
    const db = emptyPhone();
    const book = insertBook(db, { id: id7(), birthday: '2026-03-01', at: NOW });
    entry(db, book);
    takeOwnership(db, A, ctx);
    const before = [count(db, 'children'), count(db, 'entries'), count(db, 'sync_outbox')];
    expect(releaseEmptyOwner(db)).toBe(false);
    expect([count(db, 'children'), count(db, 'entries'), count(db, 'sync_outbox')]).toEqual(before);
    expect(owner(db)).toBe(A);
  });

  it('a hidden book still counts: the phone is not empty, so the owner stays', () => {
    const db = emptyPhone();
    takeOwnership(db, A, ctx);
    db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at, hidden_at) VALUES (?, 'Asha', '2025-04-12', 'Mama', ?, ?, ?)", id7(), NOW, NOW, NOW);
    expect(releaseEmptyOwner(db)).toBe(false);
    expect(owner(db)).toBe(A);
  });

  it('a deleted letter still counts, so the owner stays', () => {
    const db = emptyPhone();
    takeOwnership(db, A, ctx);
    entry(db, null, NOW);
    expect(releaseEmptyOwner(db)).toBe(false);
    expect(owner(db)).toBe(A);
  });

  it('a draft held at the Keep gate counts, so the owner stays; a draft that was never held does not', () => {
    const plain = emptyPhone();
    takeOwnership(plain, A, ctx);
    plain.run("INSERT INTO drafts (id, child_id, capture_mode, created_at, typed_text, state, held_kind) VALUES (?, ?, 'typed', ?, 'Asha found the big puddle.', 'ready', NULL)", id7(), id7(), NOW);
    expect(releaseEmptyOwner(plain)).toBe(true);

    const held = emptyPhone();
    takeOwnership(held, A, ctx);
    held.run("INSERT INTO drafts (id, child_id, capture_mode, created_at, typed_text, state, held_kind) VALUES (?, ?, 'typed', ?, 'Asha found the big puddle.', 'ready', 'held_letter')", id7(), id7(), NOW);
    expect(releaseEmptyOwner(held)).toBe(false);
    expect(owner(held)).toBe(A);
  });

  it('something still waiting to upload keeps the owner, so a queued op never goes up under another account', () => {
    const db = emptyPhone();
    takeOwnership(db, A, ctx);
    db.run("INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?)", id7(), id7(), NOW);
    expect(releaseEmptyOwner(db)).toBe(false);
    expect(owner(db)).toBe(A);
    expect(() => takeOwnership(db, B, ctx)).toThrow(AccountMismatchError);
  });

  it('the held-draft cursor goes with the owner on a release, and stays with it when the owner stays [M8]', () => {
    const empty = emptyPhone();
    takeOwnership(empty, A, ctx);
    writeSetting(empty, SYNC_SETTING.heldCursor, 'cursor-of-the-first-account');
    expect(releaseEmptyOwner(empty)).toBe(true);
    expect(readSetting(empty, SYNC_SETTING.heldCursor)).toBeNull();

    const withBook = emptyPhone();
    insertBook(withBook, { id: id7(), birthday: '2026-03-01', at: NOW });
    takeOwnership(withBook, A, ctx);
    writeSetting(withBook, SYNC_SETTING.heldCursor, 'cursor-of-the-first-account');
    expect(releaseEmptyOwner(withBook)).toBe(false);
    expect(readSetting(withBook, SYNC_SETTING.heldCursor)).toBe('cursor-of-the-first-account');
  });

  it('a phone with no owner has nothing to release, and a second call after a release does nothing', () => {
    const db = emptyPhone();
    expect(releaseEmptyOwner(db)).toBe(false);
    takeOwnership(db, A, ctx);
    expect(releaseEmptyOwner(db)).toBe(true);
    expect(releaseEmptyOwner(db)).toBe(false);
  });

  it('the same account signing back in on the emptied phone claims it again', () => {
    const db = emptyPhone();
    takeOwnership(db, A, ctx);
    releaseEmptyOwner(db);
    expect(takeOwnership(db, A, ctx).outcome).toBe('claimed');
    expect(owner(db)).toBe(A);
  });
});

// The wiring: sync/index.ts, real store and real auth store (the harness of sync-switch-off.test.ts).
const spies = vi.hoisted(() => ({
  /** What happened, in order: 'engine stop' and 'release'. */
  events: [] as string[],
  createClient: vi.fn(() => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} }, rpc: vi.fn() })),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  createSyncEngine: vi.fn(),
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
vi.mock('../src/lib/sync/engine', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/sync/engine')>();
  spies.createSyncEngine.mockImplementation(((...args: Parameters<typeof real.createSyncEngine>) => {
    const e = real.createSyncEngine(...args);
    const stopReal = e.stop;
    e.stop = () => {
      spies.events.push('engine stop');
      stopReal();
    };
    return e;
  }) as typeof real.createSyncEngine);
  return { ...real, createSyncEngine: spies.createSyncEngine };
});
vi.mock('../src/lib/sync/ownership', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/sync/ownership')>();
  return {
    ...real,
    releaseEmptyOwner: (...args: Parameters<typeof real.releaseEmptyOwner>) => {
      spies.events.push('release');
      return real.releaseEmptyOwner(...args);
    },
  };
});

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
sync.setSyncKillSourceForTests({ killed: () => false, subscribe: () => () => {} });

let raw: SqlDb;
let closeDb: () => void = () => {};
let stop: () => void = () => {};
const settle = () => new Promise((r) => setTimeout(r, 20));
const okRpc = (fn: string, args: Record<string, unknown> = {}) =>
  Promise.resolve(fn === 'sync_push'
    ? { data: { results: (args.p_ops as { op: string }[]).map((o) => ({ op: o.op, ok: true })), paused: false, stopped: false }, error: null, status: 200 }
    : { data: { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false }, error: null, status: 200 });
const ready = (userId: string) => auth.publishAuth({ status: 'ready', userId, sync: 'on' });
const signingOut = (userId: string, waitingForUploads = false) => auth.publishAuth({ status: 'signingOut', userId, reason: 'user', waitingForUploads, sync: 'on' });
const enginesFor = () => spies.createSyncEngine.mock.calls.map((c) => (c[0] as { userId: string }).userId);

describe('[NX-31-R12] sync/index.ts releases an empty phone when a session ends', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    vi.clearAllMocks();
    spies.events.length = 0;
    spies.rpc.mockImplementation(okRpc);
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

  it('"Use another account" on an empty phone: the first account signs out, the second signs in, and the second syncs', async () => {
    ready(A);
    await settle();
    expect(owner(raw)).toBe(A); // the first sign-in claimed an empty phone
    expect(enginesFor()).toEqual([A]);

    signingOut(A);
    expect(owner(raw)).toBe(A); // the sign-out is only requested: nothing is released yet [M5]
    auth.publishAuth({ status: 'signedOut' });
    expect(owner(raw)).toBeNull(); // finished: an empty phone has no owner [M4]

    ready(B);
    await settle();
    expect(owner(raw)).toBe(B);
    expect(sync.getSyncStatus().phase).not.toBe('account_mismatch');
    expect(enginesFor()).toEqual([A, B]);
  });

  it('a phone with a book keeps its owner through the sign-out, and the second account is stopped as before', async () => {
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    ready(A);
    auth.confirmAccountClaim(A); // the claim screen: this phone holds a book
    await settle();
    expect(owner(raw)).toBe(A);

    signingOut(A);
    auth.publishAuth({ status: 'signedOut' });
    expect(owner(raw)).toBe(A);

    ready(B);
    auth.confirmAccountClaim(B);
    await settle();
    expect(owner(raw)).toBe(A);
    expect(sync.getSyncStatus().phase).toBe('account_mismatch');
    expect(count(raw, 'children')).toBe(1);
  });

  it('a session lost while the engine runs: the engine stops first, then the empty phone is released, so nothing can claim it again in between [M6]', async () => {
    ready(A);
    await settle();
    expect(owner(raw)).toBe(A);
    spies.events.length = 0;
    auth.publishAuth({ status: 'signedOut', error: 'session_expired' }); // signed in straight to signed out: the engine is still running
    expect(spies.events).toEqual(['engine stop', 'release']);
    expect(owner(raw)).toBeNull();
  });

  it('a phone already stuck in account_mismatch on an empty phone recovers at the next sign-out, and shows no mismatch once signed out [M9]', async () => {
    raw.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', SYNC_SETTING.owner, A); // left by an earlier build, nothing else on the phone
    ready(B);
    await settle();
    expect(sync.getSyncStatus().phase).toBe('account_mismatch');
    signingOut(B);
    auth.publishAuth({ status: 'signedOut' });
    expect(owner(raw)).toBeNull();
    expect(sync.getSyncStatus().phase).toBe('idle'); // signed out on an empty phone: no mismatch is left showing
    ready(B);
    await settle();
    expect(owner(raw)).toBe(B);
    expect(sync.getSyncStatus().phase).not.toBe('account_mismatch');
    expect(enginesFor().at(-1)).toBe(B);
  });

  describe('a pull that was out when the session ended (review B on #737, round 3: account isolation)', () => {
    /** The first pull of the first account is held until the test answers it; every later request is answered at once. */
    function holdFirstPull(): { answer: (page: unknown) => void; held: () => boolean } {
      let answer: (r: unknown) => void = () => {};
      let held = false;
      spies.rpc.mockImplementation((fn: string, args: Record<string, unknown> = {}) => {
        if (fn !== 'sync_pull' || held) return okRpc(fn, args);
        held = true;
        return new Promise((resolve) => {
          answer = resolve;
        });
      });
      return { answer: (page) => answer({ data: page, error: null, status: 200 }), held: () => held };
    }
    const tables = () => ({ children: count(raw, 'children'), entries: count(raw, 'entries'), syncBooks: count(raw, 'sync_books') });

    it('control: with the session still on, the page is applied (so the test below is not vacuous)', async () => {
      const pull = holdFirstPull();
      ready(A);
      await vi.waitFor(() => expect(pull.held()).toBe(true));
      pull.answer(pulledPage(A, ['0199a000-0000-7000-8000-0000000000e1']));
      await vi.waitFor(() => expect(count(raw, 'children')).toBe(1));
      expect(tables()).toEqual({ children: 1, entries: 1, syncBooks: 1 });
      expect(owner(raw)).toBe(A);
    });

    it('the session ends while the first pull is out: the page lands nowhere, the owner stays forgotten, and the next account claims an empty phone [M10]', async () => {
      const pull = holdFirstPull();
      ready(A);
      await vi.waitFor(() => expect(pull.held()).toBe(true));
      expect(owner(raw)).toBe(A);
      auth.publishAuth({ status: 'signedOut', error: 'session_expired' }); // signed in to signed out: the engine stops, the empty phone is released
      expect(owner(raw)).toBeNull();

      pull.answer(pulledPage(A, ['0199a000-0000-7000-8000-0000000000e1'])); // the page arrives after the session ended
      await settle();
      expect(tables()).toEqual({ children: 0, entries: 0, syncBooks: 0 });
      expect(owner(raw)).toBeNull(); // not claimed by anything

      expect(takeOwnership(raw, B, ctx)).toMatchObject({ outcome: 'claimed', books: 0, letters: 0 }); // the second account claims an empty phone
      expect(owner(raw)).toBe(B);
      expect(tables()).toEqual({ children: 0, entries: 0, syncBooks: 0 }); // and sees nothing of the first account
    });

    it('the second account signs in through the real wiring after that: it syncs on an empty phone, with no mismatch and none of the first account\'s book', async () => {
      const pull = holdFirstPull();
      ready(A);
      await vi.waitFor(() => expect(pull.held()).toBe(true));
      auth.publishAuth({ status: 'signedOut', error: 'session_expired' });
      pull.answer(pulledPage(A, ['0199a000-0000-7000-8000-0000000000e1']));
      await settle();

      ready(B);
      await settle();
      expect(owner(raw)).toBe(B);
      expect(sync.getSyncStatus().phase).not.toBe('account_mismatch');
      expect(enginesFor()).toEqual([A, B]);
      expect(tables()).toEqual({ children: 0, entries: 0, syncBooks: 0 });
    });
  });

  it('a session that was never signed in ending (the launch read) releases nothing and reads nothing', () => {
    raw.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", SYNC_SETTING.owner, A); // an owner left by an earlier build on an empty phone
    auth.publishAuth({ status: 'restoring' });
    auth.publishAuth({ status: 'signedOut' });
    expect(owner(raw)).toBe(A);
  });
});
