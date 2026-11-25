/// <reference types="node" />
/**
 * What a phone does with its letters after the day-30 account purge (BL-494 point 4; claims row E9; C-REQ-019; the line
 * `accountDeletionCopy.what.onThisPhone`). End to end on the real SQL, as test/account-deletion-two-phone.test.ts does:
 * each phone is the real store over its own node:sqlite database, the sync engine talks to PGlite with every file in
 * supabase/migrations (helpers/sync-server.ts), and the request, the purge and the Auth delete are the real
 * request_account_deletion, prepare_account_purge, the cascade from auth.users and finalize_account_deletion, in the
 * purge worker's order (supabase/functions/purge-worker/account.ts). supabase/tests/account_purge_sync_pull.test.mjs
 * records the same answers on the database side.
 *
 * One account, two phones. The person is the only parent of one book (it goes with the account) and a parent of a second
 * book with a co-parent (it stays). What is read off is what the screens read: the listed books and Recently deleted.
 *  - After the request both phones move the person's letters to Recently deleted (the line holds).
 *  - Day 30: a phone that syncs in the seconds between the worker's prepare and its auth_user step hears that the shared
 *    book's letter is gone and erases it; the closed book's letter it never hears about (its book left the pull at day 0).
 *  - Every pull after the Auth user is deleted fails (23503 with a token that has not expired, then no session at all),
 *    so a phone that was not in that window keeps both letters in Recently deleted; its own 30-day sweep leaves them too,
 *    because in a sync build it erases only letters the server never held. Nothing on the phone ever erases them.
 * Not seen on a phone or on staging: real Supabase Auth, PostgREST, the token lifetime and the refresh are not run here.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import type { RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { startSyncServer, type SyncServer } from './helpers/sync-server';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const MAMA = '11111111-1111-1111-1111-111111111111'; // the parent who deletes the account
const PAPA = '22222222-2222-2222-2222-222222222222'; // the co-parent of the shared book
const DAY = 24 * 60 * 60 * 1000;

const clock = { t: Date.now() };
const iso = () => new Date(clock.t).toISOString();
const tick = (ms = 60_000) => {
  clock.t += ms;
};

function uuid7(ms = clock.t): string {
  const b = randomBytes(16);
  let t = BigInt(ms);
  for (let i = 5; i >= 0; i--) {
    b[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type Store = typeof import('../src/lib/store');

interface Phone {
  store: Store;
  db: SqlDb;
  /** Every sync_pull answer this phone got: 'page' or the error's SQLSTATE. */
  pulls: string[];
  sync: () => Promise<unknown>;
  signIn: () => Promise<void>;
  /** The launch sweep (purgeThenRecordLaunch) at a phone time; returns how many letters it erased. */
  launch: (atMs: number) => number;
}

let server: SyncServer;

async function phone(uid: string): Promise<Phone> {
  vi.resetModules();
  const store = (await import('../src/lib/store')) as Store;
  const caps = await import('../src/lib/capabilities');
  caps.setServerFeaturesForTests(true);
  const { createSyncEngine } = await import('../src/lib/sync/engine');
  const handle = nodeDb();
  expect(store.openStore({ open: () => ({ db: handle.db, close: () => {} }), now: iso, newId: (at?: number) => uuid7(at ?? clock.t) }).ok).toBe(true);
  const pulls: string[] = [];
  // The account's server, recording what each sync_pull answered.
  const recording = (): SupabaseLike => {
    const inner = server.serverFor(uid);
    return {
      rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResult> {
        return Promise.resolve(inner.rpc(fn, args)).then((r) => {
          if (fn === 'sync_pull') pulls.push(r.error ? String(r.error.code) : 'page');
          return r;
        });
      },
    };
  };
  const engine = () =>
    createSyncEngine({
      db: store.localSqlDb(), supabase: recording(), userId: uid, newId: () => uuid7(), now: () => clock.t, random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
      afterPull: () => store.finishServerErased(() => {}),
    });
  return {
    store,
    db: handle.db,
    pulls,
    sync: () => engine().sync(),
    signIn: async () => {
      const e = engine();
      expect(e.start()).not.toBeNull();
      await e.sync();
    },
    launch: (atMs: number) => store.purgeThenRecordLaunch(atMs, () => {}),
  };
}

function writeLetter(p: Phone, childId: string, text: string): string {
  tick(5_000);
  const d = p.store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  const child = p.store.getChild(childId)!;
  p.store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true,
    soundsLikeMe: null, childId, authorSignsAs: child.signsAs, audioUri: null,
  });
  return d.id;
}

const deletedIds = (p: Phone) => p.store.listDeleted().map((e) => e.id).sort();
const localRow = (p: Phone, id: string) => p.db.get<{ sync_state: string; server_version: string | null; deleted_at: string | null }>(
  'SELECT sync_state, server_version, deleted_at FROM entries WHERE id = ?', id);

describe('After the day-30 account purge: what the phone hears, and what it does with the letters', () => {
  let first: Phone; // the person's phone that is not open during the worker's run
  let second: Phone; // the same account's other phone, which syncs between prepare and auth_user
  let papa: Phone;
  let SOLE = '';
  let SHARED = '';
  let requestId = '';
  const ids: Record<string, string> = {};

  beforeEach(async () => {
    if (server) await server.sys('delete from sync_rate_windows');
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA, PAPA], protocol: 'v1' });
    await server.consent(MAMA, PAPA);
    // The deletion path refuses to run without the consent pepper (supabase/APPLY.md step 6); a fixed test value.
    await server.sys(`select set_config('app.consent_pepper', 'test-pepper-0123456789abcdef0123456789abcdef', false)`);
    first = await phone(MAMA);
    papa = await phone(PAPA);

    SOLE = first.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    ids.sole = writeLetter(first, SOLE, 'You laughed at the rain today.');
    await first.signIn();

    SHARED = papa.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Papa' }).id;
    ids.papa = writeLetter(papa, SHARED, 'Bath time, and you splashed us both.');
    await papa.signIn();
    const token = (await server.userSql(PAPA, `select public.create_child_invite($1, 'parent') t`, [SHARED])).rows[0].t;
    await server.userSql(MAMA, 'select public.accept_child_invite($1)', [token]);
    await first.sync();
    ids.shared = writeLetter(first, SHARED, 'You waved at the bus.');
    await first.sync();

    second = await phone(MAMA);
    await second.signIn();
  }, 180_000);

  it('before the request both phones list both books and hold both of the person\'s letters, saved to the account', () => {
    for (const p of [first, second]) {
      expect(p.store.listChildren().map((b) => b.id).sort()).toEqual([SOLE, SHARED].sort());
      expect(p.store.listDeleted()).toEqual([]);
      expect(localRow(p, ids.sole)?.server_version).not.toBeNull();
      expect(localRow(p, ids.shared)?.server_version).not.toBeNull();
    }
  });

  it('[what.onThisPhone] after the request the next pull moves both letters to Recently deleted on both phones; the closed book leaves the list', async () => {
    requestId = (await server.userSql(MAMA, `select * from public.request_account_deletion('ios', false)`)).rows[0].request_id as string;
    await first.sync();
    await second.sync();
    for (const p of [first, second]) {
      expect(deletedIds(p)).toEqual([ids.sole, ids.shared].sort());
      expect(p.store.listChildren().map((b) => b.id)).toEqual([SHARED]);
      expect(p.db.get('SELECT server_state FROM children WHERE id = ?', SOLE)).toEqual({ server_state: 'deleted' });
      // The closed book is no longer asked about: closeBook dropped its sync row.
      expect(p.db.get('SELECT 1 AS x FROM sync_books WHERE child_id = ?', SOLE)).toBeNull();
    }
  }, 60_000);

  it('[BL-494 4] day 30, between the worker\'s prepare and its auth_user step: a phone that syncs then erases the shared book\'s letter (markGone), and never hears about the closed book\'s', async () => {
    await server.sys(`update deletion_requests set status = 'executing', executing_at = now() where id = $1`, [requestId]);
    const prep = (await server.sys('select public.prepare_account_purge($1) r', [requestId])).rows[0].r as { entries: number; books: number };
    expect(prep).toMatchObject({ entries: 2, books: 1 });
    await second.sync();
    expect(second.pulls.slice(-2)).toEqual(['page', 'page']); // the digest differs, then the id list
    expect(localRow(second, ids.shared)).toBeNull(); // erased on this phone, as the server's is
    expect(deletedIds(second)).toEqual([ids.sole]); // the closed book's letter waits on
  }, 60_000);

  it('[BL-494 4] after the Auth user is deleted, every pull fails (23503 while the token lasts): nothing is merged, both letters stay in Recently deleted', async () => {
    await server.sys('delete from auth.users where id = $1', [MAMA]);
    await server.sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [requestId]);
    const before = first.pulls.length;
    await first.sync();
    expect(first.pulls.slice(before)).toEqual(['23503']);
    expect(deletedIds(first)).toEqual([ids.sole, ids.shared].sort());
    for (const id of [ids.sole, ids.shared]) {
      expect(localRow(first, id)).toMatchObject({ sync_state: 'synced' });
      expect(localRow(first, id)?.server_version).not.toBeNull(); // the phone still believes the server holds it
    }
    // The co-parent's phone is not touched by any of this.
    await papa.sync();
    expect(papa.store.listChildren().map((b) => b.id)).toEqual([SHARED]);
    expect(papa.store.getEntry(ids.papa)).toMatchObject({ finalText: 'Bath time, and you splashed us both.' });
  }, 60_000);

  it('[BL-494 4] the phone\'s own 30-day sweep never erases them either: in a sync build it erases only letters the server never held', () => {
    const start = clock.t;
    first.launch(start);
    second.launch(start);
    // Well past the date each card shows ("Kept here until {date}", 30 days after the delete).
    expect(first.launch(start + 45 * DAY)).toBe(0);
    expect(first.launch(start + 90 * DAY)).toBe(0);
    expect(second.launch(start + 90 * DAY)).toBe(0);
    expect(deletedIds(first)).toEqual([ids.sole, ids.shared].sort());
    expect(deletedIds(second)).toEqual([ids.sole]);
  });
});
