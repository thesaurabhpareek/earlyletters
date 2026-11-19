/// <reference types="node" />
/**
 * A stopped engine writes nothing (review B on PR #737, round 3, account isolation). `stop()` is called when a session ends
 * (sync/index.ts ensureEngine), and `releaseEmptyOwner` clears an empty phone's owner right after. A pull already out when
 * the session ended used to land afterwards: account A's books and letters on a phone with no owner, which account B's
 * `takeOwnership` then claimed as its own. The engine now looks at `stopped` once each answer is back, before it writes
 * or records anything.
 *
 * Real engine over the real phone database (node:sqlite with the app's migrations); the server is a fake whose answers the
 * test holds back and releases by hand. Fictional family "Asha" only.
 *
 * Mutations these tests were written to catch (each one failed a test here when it was made):
 *  M1 the guard after `sync_pull` removed;   M2 the guard after `sync_push` removed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine, type SyncEngine } from '../src/lib/sync/engine';
import { SYNC_SETTING, pendingCount, readSetting } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import type { PullResponse, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { PULLED_BOOK as BOOK, PULLED_LETTER as LETTER, PULLED_LETTER_2 as LETTER_2, pulledPage } from './helpers/pulled-page';
import { insertBook } from './helpers/store-fixture';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const NOW = '2026-11-10T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: NOW, newId: id7 };

interface Held {
  args: Record<string, unknown>;
  answer: (r: RpcResult) => void;
}
/** A server that answers nothing until the test says so. */
function holdingServer() {
  const pulls: Held[] = [];
  const pushes: Held[] = [];
  const supabase: SupabaseLike = {
    rpc(fn, args = {}) {
      return new Promise<RpcResult>((answer) => (fn === 'sync_pull' ? pulls : pushes).push({ args, answer }));
    },
  };
  return { supabase, pulls, pushes };
}

const pageOf = (letters: string[], more = false) => pulledPage(A, letters, more);
const ok = (data: unknown): RpcResult => ({ data, error: null, status: 200 });
const reset = (): PullResponse => ({ reset: true, reason: 'epoch', epoch: 2, epoch_started_at: NOW } as PullResponse);

const count = (db: SqlDb, table: string) => db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)!.n;
/** Everything a pull or a push could write. */
const snapshot = (db: SqlDb) => ({
  children: db.all('SELECT * FROM children ORDER BY id'),
  entries: db.all('SELECT * FROM entries ORDER BY id'),
  syncBooks: db.all('SELECT * FROM sync_books ORDER BY child_id'),
  settings: db.all('SELECT key, value FROM settings ORDER BY key'),
  outbox: db.all('SELECT * FROM sync_outbox ORDER BY seq'),
});

let db: SqlDb;
let close: () => void;
let engine: SyncEngine;

function start(supabase: SupabaseLike, userId = A): SyncEngine {
  engine = createSyncEngine({
    db, supabase, userId, newId: id7, now: () => Date.parse(NOW), random: () => 1,
    setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
  });
  return engine;
}

beforeEach(() => {
  const h = nodeDb();
  db = h.db;
  close = h.close;
  migrate(db, { now: NOW, newId: id7 });
});
afterEach(() => close());

describe('[NX-31-R12] a pull that was out when the engine stopped is not written', () => {
  it('control: the same page, with the engine still running, is applied (the tests below are not vacuous)', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    server.pulls[0].answer(ok(pageOf([LETTER])));
    await vi.waitFor(() => expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).not.toBeNull()); // the pull finished
    expect(count(db, 'children')).toBe(1);
    expect(count(db, 'entries')).toBe(1);
    expect(count(db, 'sync_books')).toBe(1);
    expect(readSetting(db, SYNC_SETTING.epoch)).toBe('1');
  });

  it('stop() while the pull is out: the page that arrives afterwards writes no book, no letter, no cursor, no setting', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    const before = snapshot(db);
    engine.stop();
    server.pulls[0].answer(ok(pageOf([LETTER])));
    await engine.sync(); // behind the in-flight cycle: returns once it has finished
    expect(count(db, 'children')).toBe(0);
    expect(count(db, 'entries')).toBe(0);
    expect(count(db, 'sync_books')).toBe(0); // no pull cursor
    expect(readSetting(db, SYNC_SETTING.epoch)).toBeNull();
    expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).toBeNull();
    expect(snapshot(db)).toEqual(before);
    expect(server.pulls).toHaveLength(1); // and no further page was asked for
  });

  it('stop() while the pull is out: a failed answer afterwards records no failure either', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    engine.stop();
    server.pulls[0].answer({ data: null, error: { code: '', message: 'FetchError: offline' }, status: 0 });
    await engine.sync();
    expect(engine.status().phase).toBe('idle'); // not 'offline'
  });

  it('stop() while the pull is out and the server says "start again" (restore): nothing of the restore is written', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    const before = snapshot(db);
    engine.stop();
    server.pulls[0].answer(ok(reset()));
    await engine.sync();
    expect(readSetting(db, SYNC_SETTING.epoch)).toBeNull();
    expect(snapshot(db)).toEqual(before);
    expect(server.pulls).toHaveLength(1);
    expect(server.pushes).toHaveLength(0);
  });

  it('control: the same restore answer with the engine running does write, and goes on to ask again', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    server.pulls[0].answer(ok(reset()));
    await vi.waitFor(() => expect(server.pulls).toHaveLength(2));
    expect(readSetting(db, SYNC_SETTING.epoch)).toBe('2');
    server.pulls[1].answer(ok(pageOf([])));
    await vi.waitFor(() => expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).not.toBeNull());
  });

  it('stop() between two pages: the first page stays (it was applied before the stop), the second is not written', async () => {
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    server.pulls[0].answer(ok(pageOf([LETTER], true)));
    await vi.waitFor(() => expect(server.pulls).toHaveLength(2));
    expect(count(db, 'entries')).toBe(1);
    engine.stop();
    server.pulls[1].answer(ok(pageOf([LETTER, LETTER_2])));
    await engine.sync();
    expect(count(db, 'entries')).toBe(1); // the second letter never landed
    expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).toBeNull(); // and the pull is not recorded as finished
  });
});

describe('[NX-31-R12] a push that was out when the engine stopped is not applied', () => {
  function phoneWithABook(): void {
    insertBook(db, { id: BOOK, name: 'Asha', birthday: '2026-03-01', at: NOW });
    takeOwnership(db, A, ctx);
  }
  const allOk = (held: Held) => ok({ results: (held.args.p_ops as { op: string }[]).map((o) => ({ op: o.op, ok: true })), paused: false, stopped: false });

  it('control: with the engine running, the answer is applied (the queue empties) and the pull follows', async () => {
    phoneWithABook();
    const queued = pendingCount(db);
    expect(queued).toBeGreaterThan(0);
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pushes).toHaveLength(1));
    server.pushes[0].answer(allOk(server.pushes[0]));
    await vi.waitFor(() => expect(server.pulls).toHaveLength(1));
    expect(pendingCount(db)).toBe(0);
    server.pulls[0].answer(ok(pageOf([])));
    await vi.waitFor(() => expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).not.toBeNull());
  });

  it('stop() while the push is out: the answer is not applied, the ops stay queued (sent, to go again under the same ids) and no pull starts', async () => {
    phoneWithABook();
    const queued = pendingCount(db);
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pushes).toHaveLength(1));
    const ids = db.all<{ op_id: string }>('SELECT op_id FROM sync_outbox ORDER BY seq').map((r) => r.op_id);
    engine.stop();
    server.pushes[0].answer(allOk(server.pushes[0]));
    await engine.sync();
    expect(pendingCount(db)).toBe(queued);
    expect(db.all<{ op_id: string }>('SELECT op_id FROM sync_outbox ORDER BY seq').map((r) => r.op_id)).toEqual(ids); // same ids
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE sent_at IS NULL')!.n).toBe(0); // marked sent before it left
    expect(server.pulls).toHaveLength(0);
  });

  it('stop() while the push is out and the answer is a failure: no backoff, no failure is recorded', async () => {
    phoneWithABook();
    const server = holdingServer();
    start(server.supabase).start();
    await vi.waitFor(() => expect(server.pushes).toHaveLength(1));
    engine.stop();
    server.pushes[0].answer({ data: null, error: { code: '', message: 'FetchError: offline' }, status: 0 });
    await engine.sync();
    expect(engine.status().phase).toBe('idle');
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE attempts > 0 OR next_attempt_at IS NOT NULL')!.n).toBe(0);
  });
});
