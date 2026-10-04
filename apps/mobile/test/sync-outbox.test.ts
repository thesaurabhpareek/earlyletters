/// <reference types="node" />
/**
 * Sync engine paths that need a scripted server: call-level failures, a
 * poison op, a refused book, timers and the restore bookkeeping. The real SQL
 * is exercised end to end in sync-e2e.test.ts. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine } from '../src/lib/sync/engine';
import { classifyCallError } from '../src/lib/sync/errors';
import { HELD_AFTER_RESTORE_MS, digestOf, dropStaleHeld, enterRestoreMode } from '../src/lib/sync/merge';
import { enqueueEntryDelete, enqueueEntryRestore, enqueueEntryUpsert, pendingCount, takeBatch, writeSetting } from '../src/lib/sync/outbox';
import { retryRefusedBook, takeOwnership } from '../src/lib/sync/ownership';
import { ALL_GROUPS, type PushOp, type RpcResult, type SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';

const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const NOW = Date.parse('2026-10-03T09:00:00.000Z');
const ctx = { now: new Date(NOW).toISOString(), newId: id7 };

function phone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  return db;
}
function book(db: SqlDb, name = 'Asha'): string {
  const id = id7();
  db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at) VALUES (?, ?, '2025-04-12', 'Mama', ?, ?)", id, name, ctx.now, ctx.now);
  return id;
}
function letter(db: SqlDb, child: string, text = 'She walked to me.', author: string | null = null): string {
  const id = id7();
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id) VALUES (?, 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 1, ?, ?, ?)`,
    id, ctx.now, text, text, ctx.now, child, author,
  );
  return id;
}
type Handler = (fn: string, args: Record<string, unknown>) => RpcResult;
function scripted(handler: Handler): SupabaseLike & { calls: { fn: string; args: Record<string, unknown> }[] } {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  return { calls, rpc: (fn, args = {}) => { calls.push({ fn, args }); return Promise.resolve(handler(fn, args)); } };
}
/** Accepts every op; pulls return nothing new. */
const okServer = (override?: (op: PushOp) => Record<string, unknown> | null): Handler => (fn, args) => {
  if (fn === 'sync_push') {
    const ops = args.p_ops as PushOp[];
    return { data: { paused: false, stopped: false, results: ops.map((o) => override?.(o) ?? { op: o.op, ok: true }) }, error: null, status: 200 };
  }
  return { data: { reset: false, epoch: 1, epoch_started_at: ctx.now, books: [], gone: [], more: false }, error: null, status: 200 };
};
const engine = (db: SqlDb, s: SupabaseLike, extra: Partial<Parameters<typeof createSyncEngine>[0]> = {}) =>
  createSyncEngine({ db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false, ...extra });
const types = (db: SqlDb) => db.all<{ type: string }>('SELECT type FROM sync_outbox ORDER BY lane, seq').map((r) => r.type);

describe('sync: call-level errors', () => {
  it('classifies what supabase-js returns', () => {
    expect(classifyCallError({ code: '', message: 'FetchError' }, 0)).toBe('network');
    expect(classifyCallError(null, undefined)).toBe('network');
    expect(classifyCallError({ code: 'PGRST303' }, 401)).toBe('auth');
    expect(classifyCallError({ code: '28000' }, 400)).toBe('auth');
    expect(classifyCallError({ code: 'SCRAT' }, 400)).toBe('rate_limited');
    expect(classifyCallError({ code: '22023' }, 400)).toBe('bad_request');
    expect(classifyCallError({ code: 'PGRST202' }, 404)).toBe('server'); // the RPC is not deployed yet: wait, never drop
    expect(classifyCallError({ code: '57014' }, 500)).toBe('server');
  });

  it('[DATA-REQ-043] a batch the server cannot read is split; only the one bad op is refused and the queue goes on', async () => {
    const db = phone();
    const c = book(db);
    const good = letter(db, c, 'Good.');
    const bad = letter(db, c, 'Bad.');
    const good2 = letter(db, c, 'Also good.');
    takeOwnership(db, ME, ctx);
    const s = scripted((fn, args) => {
      if (fn === 'sync_push' && (args.p_ops as PushOp[]).some((o) => o.id === bad)) return { data: null, error: { code: '22023' }, status: 400 };
      return okServer()(fn, args);
    });
    const r = await engine(db, s).sync();
    expect(r.rejected).toBe(1);
    expect(db.all<{ entity_id: string; code: string }>('SELECT entity_id, code FROM rejected_writes')).toEqual([{ entity_id: bad, code: '22023' }]);
    expect(db.get<{ sync_state: string }>('SELECT sync_state FROM entries WHERE id = ?', good2)?.sync_state).not.toBe('rejected');
    expect(pendingCount(db)).toBe(0);
    expect(db.get<{ sync_state: string }>('SELECT sync_state FROM entries WHERE id = ?', good)?.sync_state).toBe('local'); // no entry state in the fake answer
  });

  it('an expired session stops the cycle without counting a retry', async () => {
    const db = phone();
    letter(db, book(db));
    takeOwnership(db, ME, ctx);
    const e = engine(db, scripted(() => ({ data: null, error: { code: 'PGRST303', message: 'JWT expired' }, status: 401 })));
    const r = await e.sync();
    expect(r.phase).toBe('auth');
    expect(db.get<{ n: number }>('SELECT MAX(attempts) AS n FROM sync_outbox')!.n).toBe(0);
  });
});

describe('sync: per-op answers', () => {
  it('[DATA-REQ-043] a refused op moves to rejected_writes with its SQLSTATE; a purged letter becomes gone and stays in Recently deleted', async () => {
    const db = phone();
    const c = book(db);
    const imm = letter(db, c, 'Raw changed by a bug.');
    const purged = letter(db, c, 'Deleted on another phone long ago.');
    takeOwnership(db, ME, ctx);
    const s = scripted(okServer((o) => (o.id === imm ? { op: o.op, ok: false, code: 'SCIMM' } : o.id === purged ? { op: o.op, ok: false, code: 'SCDEL', gone: true } : null)));
    await engine(db, s).sync();
    expect(db.all<{ entity_id: string; code: string }>('SELECT entity_id, code FROM rejected_writes ORDER BY code').map((r) => r.code)).toEqual(['SCDEL', 'SCIMM']);
    expect(db.get<{ sync_state: string }>('SELECT sync_state FROM entries WHERE id = ?', imm)?.sync_state).toBe('rejected');
    const g = db.get<{ sync_state: string; deleted_at: string | null }>('SELECT sync_state, deleted_at FROM entries WHERE id = ?', purged)!;
    expect(g.sync_state).toBe('gone');
    expect(g.deleted_at).not.toBeNull();
    // The words are still on the phone (export, "Restore and apply my edit").
    expect(db.get<{ final_text: string }>('SELECT final_text FROM entries WHERE id = ?', imm)?.final_text).toBe('Raw changed by a bug.');
    expect(JSON.parse(db.get<{ payload: string }>("SELECT payload FROM rejected_writes WHERE code = 'SCIMM'")!.payload).data.final_text).toBe('Raw changed by a bug.');
  });

  it('a book the server refuses (older servers: SCPLS) keeps its letters parked on the phone until it is sent again', async () => {
    const db = phone();
    const first = book(db, 'Asha');
    takeOwnership(db, ME, ctx);
    await engine(db, scripted(okServer())).sync();
    const later = id7();
    db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at) VALUES (?, 'Leo', '2026-09-01', 'Mama', ?, ?)", later, ctx.now, ctx.now);
    db.transaction(() => {
      // As store.addChild does after sign-in.
      db.run("UPDATE children SET server_state = 'pending', role = 'parent', created_by_me = 1 WHERE id = ?", later);
    });
    const { enqueueBookCreate } = await import('../src/lib/sync/outbox');
    db.transaction(() => enqueueBookCreate(db, later, ctx));
    const l = letter(db, later, 'For Leo.', ME);
    db.transaction(() => enqueueEntryUpsert(db, l, ALL_GROUPS, ctx));
    // As the server answers: the book is refused, so its settings and letter fail too (no such book).
    await engine(db, scripted(okServer((o) => (o.type === 'book.create' ? { op: o.op, ok: false, code: 'SCPLS' }
      : o.id === later || (o.data as { child_id?: string }).child_id === later ? { op: o.op, ok: false, code: '42501' } : null)))).sync();
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes')!.n).toBe(0); // parked, not rejected
    expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', later)?.server_state).toBe('refused');
    expect(pendingCount(db)).toBe(0); // parked ops never hold up sign-out
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n).toBeGreaterThan(0);
    retryRefusedBook(db, later, ctx);
    const s = scripted(okServer());
    await engine(db, s).sync();
    expect((s.calls[0].args.p_ops as PushOp[]).map((o) => o.type)).toEqual(['book.create', 'prefs.upsert', 'entry.upsert']);
    expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', later)?.server_state).toBe('synced');
    expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', first)?.server_state).toBe('synced');
  });

  it('a transient server error inside a batch stops at that op and retries from it, in order', async () => {
    const db = phone();
    const c = book(db);
    const a = letter(db, c, 'One.');
    const b = letter(db, c, 'Two.');
    takeOwnership(db, ME, ctx);
    let first = true;
    const s = scripted((fn, args) => {
      if (fn !== 'sync_push') return okServer()(fn, args);
      const ops = args.p_ops as PushOp[];
      if (first) {
        first = false;
        const i = ops.findIndex((o) => o.id === b);
        return { data: { paused: false, stopped: true, code: '40P01', results: ops.slice(0, i).map((o) => ({ op: o.op, ok: true })) }, error: null, status: 200 };
      }
      return okServer()(fn, args);
    });
    const e = engine(db, s);
    const r = await e.sync();
    expect(r.phase).toBe('offline');
    expect(db.all<{ entity_id: string; attempts: number }>('SELECT entity_id, attempts FROM sync_outbox')).toEqual([{ entity_id: b, attempts: 1 }]);
    expect(a).not.toBe(b);
  });
});

describe('sync: the local queue', () => {
  it('[DATA-REQ-040] upgrading an existing install keeps every letter word for word, local only, with nothing queued', () => {
    const { db } = nodeDb();
    migrate(db, { now: ctx.now, newId: id7 }, MIGRATIONS.slice(0, 3)); // an install from before sync
    const c = book(db);
    const l = letter(db, c, 'Written before sync existed.');
    expect(migrate(db, { now: ctx.now, newId: id7 })).toMatchObject({ from: 3, to: 4 });
    expect(db.get<{ final_text: string; sync_state: string }>('SELECT final_text, sync_state FROM entries WHERE id = ?', l))
      .toEqual({ final_text: 'Written before sync existed.', sync_state: 'local' });
    expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', c)?.server_state).toBe('local');
    expect(pendingCount(db)).toBe(0);
  });

  it('nothing queues before the first sign-in, and other people\'s letters never queue', () => {
    const db = phone();
    const c = book(db);
    const mine = letter(db, c);
    db.transaction(() => enqueueEntryUpsert(db, mine, ALL_GROUPS, ctx));
    expect(types(db)).toEqual([]);
    takeOwnership(db, ME, ctx);
    const theirs = letter(db, c, 'From Papa.', PAPA);
    db.transaction(() => enqueueEntryUpsert(db, theirs, ALL_GROUPS, ctx));
    expect(types(db)).toEqual(['book.first_run', 'prefs.upsert', 'entry.upsert']);
  });

  it('a letter deleted before it left the phone leaves no trace on the server; restoring it queues it again', () => {
    const db = phone();
    const c = book(db);
    takeOwnership(db, ME, ctx);
    const l = letter(db, c, 'Changed my mind.', ME);
    db.transaction(() => enqueueEntryUpsert(db, l, ALL_GROUPS, ctx));
    db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', ctx.now, l);
    db.transaction(() => enqueueEntryDelete(db, l, ctx));
    expect(types(db)).toEqual(['book.first_run', 'prefs.upsert']);
    db.run('UPDATE entries SET deleted_at = NULL WHERE id = ?', l);
    db.transaction(() => enqueueEntryRestore(db, l, ctx));
    expect(types(db)).toEqual(['book.first_run', 'prefs.upsert', 'entry.upsert']);
  });

  it('a delete that never left the phone is simply cancelled by a restore', () => {
    const db = phone();
    const c = book(db);
    takeOwnership(db, ME, ctx);
    const l = letter(db, c, 'On the server.', ME);
    db.run("UPDATE entries SET server_version = '42', server_updated_at = ?, server_epoch = 1, sync_state = 'synced' WHERE id = ?", ctx.now, l);
    db.transaction(() => enqueueEntryDelete(db, l, ctx));
    db.transaction(() => enqueueEntryRestore(db, l, ctx));
    expect(types(db).filter((t) => t.startsWith('entry.'))).toEqual([]);
    expect(db.get<{ sync_state: string }>('SELECT sync_state FROM entries WHERE id = ?', l)?.sync_state).toBe('synced');
  });

  it('ops go out in queue order with restore re-uploads first, within the 50-op and size limits', () => {
    const db = phone();
    const c = book(db);
    takeOwnership(db, ME, ctx);
    db.run("UPDATE children SET server_state = 'synced' WHERE id = ?", c);
    for (let i = 0; i < 60; i++) {
      const l = letter(db, c, `Letter ${i}.`, ME);
      db.transaction(() => enqueueEntryUpsert(db, l, ALL_GROUPS, ctx));
    }
    const first = takeBatch(db, { now: ctx.now });
    expect(first.ops).toHaveLength(50);
    expect(first.ops[0].type).toBe('book.first_run');
    const small = takeBatch(db, { now: ctx.now, maxBytes: 1 });
    expect(small.ops).toHaveLength(1); // always at least one op
    const synced = letter(db, c, 'Known to the server.', ME);
    db.run("UPDATE entries SET server_version = '7', server_updated_at = ?, server_epoch = 1, sync_state = 'synced' WHERE id = ?", ctx.now, synced);
    writeSetting(db, 'sync.epoch', '1');
    db.transaction(() => enterRestoreMode(db, { reset: true, epoch: 2, epoch_started_at: ctx.now }, ctx));
    const after = takeBatch(db, { now: ctx.now });
    expect(after.ops.slice(0, 2).map((o) => o.type)).toEqual(['book.create', 'entry.reupload']);
    expect(after.ops[1]).toMatchObject({ id: synced, known_at: ctx.now });
  });

  it('a cursor ahead of the server (restored without a new epoch) still re-uploads every letter', () => {
    const db = phone();
    const c = book(db);
    takeOwnership(db, ME, ctx);
    const l = letter(db, c, 'Known to the server.', ME);
    db.run("UPDATE entries SET server_version = '7', server_updated_at = ?, server_epoch = 1, sync_state = 'synced' WHERE id = ?", ctx.now, l);
    writeSetting(db, 'sync.epoch', '1');
    db.transaction(() => enterRestoreMode(db, { reset: true, reason: 'cursor_ahead', epoch: 1, epoch_started_at: ctx.now }, ctx));
    expect(types(db)).toContain('entry.reupload');
  });

  it('[TDD 06 P-1] after a restore, letters by others are held, never deleted, and only let go 30 days later', () => {
    const db = phone();
    const c = book(db);
    takeOwnership(db, ME, ctx);
    const theirs = letter(db, c, 'From Papa.', PAPA);
    db.run("UPDATE entries SET server_version = '9', server_updated_at = ?, server_epoch = 1, sync_state = 'synced' WHERE id = ?", ctx.now, theirs);
    db.transaction(() => enterRestoreMode(db, { reset: true, epoch: 2, epoch_started_at: ctx.now }, ctx));
    expect(db.get<{ sync_state: string }>('SELECT sync_state FROM entries WHERE id = ?', theirs)?.sync_state).toBe('held');
    expect(dropStaleHeld(db, NOW + HELD_AFTER_RESTORE_MS - 1)).toBe(0);
    expect(dropStaleHeld(db, NOW + HELD_AFTER_RESTORE_MS + 1)).toBe(1);
  });

  it('the digest matches the server formula (count and 48-bit sum of the last 12 hex digits)', () => {
    const ids = ['0199a000-0000-7000-8000-ffffffffffff', '0199a000-0000-7000-8000-000000000001'];
    expect(digestOf(ids)).toEqual({ n: 2, sum: 0 }); // (2^48 - 1 + 1) mod 2^48
    expect(digestOf([])).toEqual({ n: 0, sum: 0 });
  });
});

describe('sync: triggers', () => {
  it('a request during a cycle becomes one follow-up cycle; saves are debounced; retries wait for the foreground', async () => {
    const db = phone();
    letter(db, book(db));
    takeOwnership(db, ME, ctx);
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    let calls = 0;
    const s: SupabaseLike = {
      rpc: async (fn, args = {}) => {
        calls++;
        if (calls === 1) await gate;
        return okServer()(fn, args);
      },
    };
    const timers: { fn: () => void; ms: number }[] = [];
    const e = engine(db, s, { setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, saveDebounceMs: 1500 });
    const p1 = e.sync();
    expect(e.sync()).toBe(p1); // asked before the cycle started: the same cycle
    await new Promise((r) => setTimeout(r, 0)); // the cycle is now waiting on the server
    expect(e.status().phase).toBe('syncing');
    const p2 = e.sync();
    const p3 = e.sync({ verify: true });
    expect(p2).toBe(p3);
    expect(p2).not.toBe(p1);
    release();
    await Promise.all([p1, p2]);
    expect(calls).toBe(3); // push + pull, then one follow-up cycle (nothing left to push: pull only)
    e.requestSync('save');
    e.requestSync('save');
    expect(timers.filter((t) => t.ms === 1500)).toHaveLength(2); // the first was replaced (clearTimer), one fires
    expect(e.status().phase).toBe('idle');
  });
});
