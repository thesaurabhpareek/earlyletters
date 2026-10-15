/// <reference types="node" />
/**
 * Protocol v1 on the phone (docs/adr/0023-sync-protocol-v1.md; WP-F16-15): the
 * words conflict copy, the rebase of queued ops (F16-REQ-025), one op per letter
 * per batch, the per-group pull merge, the language mapping (G-26) and the remote
 * kill switch, against a scripted server. The real SQL runs in
 * sync-two-phone.test.ts. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import { entries as entriesRepo, type RepoContext } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine } from '../src/lib/sync/engine';
import { applyPullPage, applyPushResponse } from '../src/lib/sync/merge';
import {
  CONFLICT_CODE,
  conflictCount,
  enqueueEntryDelete,
  enqueueEntryRestore,
  enqueueEntryUpsert,
  entrySnapshot,
  getEntryRow,
  listConflictCopies,
  markSent,
  rejectedUnseenCount,
  takeBatch,
  wireLanguage,
  type OutboxRow,
} from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { ALL_GROUPS, type PullResponse, type PushOp, type PushResponse, type RpcResult, type SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const NOW = Date.parse('2026-10-20T19:00:00.000Z');
const ctx = { now: new Date(NOW).toISOString(), newId: id7 };

function phone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  return db;
}
function book(db: SqlDb): string {
  const id = id7();
  insertBook(db, { id, birthday: '2025-04-12', serverState: 'synced', at: ctx.now });
  return id;
}
/** A letter of mine the server already holds at version `v`. */
function synced(db: SqlDb, child: string, text: string, v = '100'): string {
  const id = id7();
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, server_version, server_updated_at, server_epoch, sync_state)
     VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, ?, '[]', ?, 1, ?, ?, ?, ?, ?, 1, 'synced')`,
    id, ctx.now, text, text, ctx.now, child, ME, v, ctx.now,
  );
  return id;
}
function claimed(): { db: SqlDb; child: string } {
  const db = phone();
  takeOwnership(db, ME, ctx);
  db.run("INSERT INTO settings (key, value) VALUES ('sync.epoch', '1')");
  return { db, child: book(db) };
}
function edit(db: SqlDb, id: string, text: string, groups = ['text'] as const): void {
  db.transaction(() => {
    db.run('UPDATE entries SET final_text = ? WHERE id = ?', text, id);
    enqueueEntryUpsert(db, id, [...groups], ctx);
  });
}
function setInBook(db: SqlDb, id: string, inBook: boolean): void {
  db.transaction(() => {
    db.run('UPDATE entries SET in_book = ? WHERE id = ?', inBook ? 1 : 0, id);
    enqueueEntryUpsert(db, id, ['in_book'], ctx);
  });
}
const queue = (db: SqlDb) => db.all<OutboxRow>('SELECT * FROM sync_outbox ORDER BY lane, seq');
const ops = (db: SqlDb) => queue(db).map((r) => JSON.parse(r.payload) as PushOp);
const words = (text: string) => ({ final_text: text, machine_edits: [], edit_level: 'verbatim' });
const state = (id: string, v: string) => ({ id, v, updated_at: ctx.now, deleted_at: null, in_book: true, approval: 'not_needed' });
/** Sends the head batch and applies the scripted answer for it. */
function answer(db: SqlDb, results: (op: PushOp) => Record<string, unknown>): ReturnType<typeof applyPushResponse> {
  const batch = takeBatch(db, { now: ctx.now });
  db.transaction(() => markSent(db, batch.rows, ctx.now));
  const res = { results: batch.ops.map((o) => ({ op: o.op, ok: true, ...results(o) })), paused: false, stopped: false } as PushResponse;
  let out!: ReturnType<typeof applyPushResponse>;
  db.transaction(() => {
    out = applyPushResponse(db, batch.rows, res, ctx);
  });
  return out;
}

describe('[F16-REQ-010] a words conflict on this phone', () => {
  it('keeps this phone\'s latest words as a conflict copy, follows the server, and never re-sends them by itself', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'You clapped.');
    edit(db, id, 'You clapped at the music.');
    const out = answer(db, (o) => ({ applied: true, conflict: true, conflict_groups: ['text'], current: { ...words('You clapped, then danced.'), v: '120' }, entry: state(o.id, '120') }));
    expect(out.conflicts).toBe(1);
    expect(getEntryRow(db, id)).toMatchObject({ final_text: 'You clapped, then danced.', raw_transcript: 'You clapped.', server_version: '120', sync_state: 'synced' });
    const copies = listConflictCopies(db, id);
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({ entryId: id, serverV: '120', seenAt: null });
    expect(copies[0].words.final_text).toBe('You clapped at the music.');
    expect(queue(db)).toEqual([]);
    expect(conflictCount(db)).toBe(1);
    expect(rejectedUnseenCount(db)).toBe(0); // a conflict copy is not a refused write
  });

  it('folds later queued edits into the copy: their words stop travelling, their other groups still go, rebased', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Nap.');
    edit(db, id, 'Long nap.');
    db.run("UPDATE sync_outbox SET sent_at = ?", ctx.now); // that op left; the next edits are new ops
    edit(db, id, 'Long nap, then milk.');
    setInBook(db, id, false); // coalesced into the same op: text and in_book
    expect(ops(db)).toHaveLength(2);
    expect(ops(db)[1]).toMatchObject({ changed: ['text', 'in_book'], base: '100' }); // inherits the queued op's base
    const out = answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('Short nap.'), v: '130' }, entry: state(o.id, '131') }));
    expect(out.conflicts).toBe(1);
    expect(listConflictCopies(db, id).map((c) => c.words.final_text)).toEqual(['Long nap, then milk.']); // the newest of this phone's words
    const [left] = ops(db);
    expect(left).toMatchObject({ changed: ['in_book'], base: '131' });
    expect((left.data as { final_text: string }).final_text).toBe('Short nap.'); // no stale words ride along
    expect(getEntryRow(db, id)).toMatchObject({ final_text: 'Short nap.', in_book: 0, sync_state: 'pending' });
  });

  it('drops a later op that only carried words, and makes no copy when both phones wrote the same words', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Tooth.');
    edit(db, id, 'First tooth.');
    answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('First tooth.'), v: '140' }, entry: state(o.id, '140') }));
    expect(listConflictCopies(db)).toEqual([]);
    expect(getEntryRow(db, id)?.final_text).toBe('First tooth.');

    edit(db, id, 'First tooth, top left.');
    db.run('UPDATE sync_outbox SET sent_at = ?', ctx.now);
    edit(db, id, 'First tooth, top left, at last.');
    // The first op meets a conflict: the second only carried words, so it goes.
    answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('First tooth, bottom.'), v: '150' }, entry: state(o.id, '150') }));
    expect(ops(db)).toEqual([]);
    expect(listConflictCopies(db, id).map((c) => c.words.final_text)).toEqual(['First tooth, top left, at last.']);
  });

  it('a second conflict on the same letter keeps both of this phone\'s versions; the same words twice are kept once', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Rain.');
    edit(db, id, 'Rain on the window.');
    answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('Rain all day.'), v: '160' }, entry: state(o.id, '160') }));
    edit(db, id, 'Rain all day, and puddles.');
    answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('Rain all day, and wellies.'), v: '170' }, entry: state(o.id, '170') }));
    expect(listConflictCopies(db, id).map((c) => c.words.final_text).sort()).toEqual(['Rain all day, and puddles.', 'Rain on the window.']);
    expect(conflictCount(db)).toBe(1); // one letter
  });

  it('erasing the letter erases its conflict copies too', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Swing.');
    edit(db, id, 'The big swing.');
    answer(db, (o) => ({ applied: true, conflict_groups: ['text'], current: { ...words('The red swing.'), v: '180' }, entry: state(o.id, '180') }));
    const repo: RepoContext = { db, now: () => ctx.now, newId: id7 };
    db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', ctx.now, id);
    expect(entriesRepo.eraseRow(repo, id)).toBe(true);
    expect(db.all('SELECT * FROM rejected_writes WHERE code = ?', CONFLICT_CODE)).toEqual([]);
  });
});

describe('[F16-REQ-025] queued ops of one letter descend from what this phone wrote', () => {
  it('a batch carries one op per letter, so the next one leaves only after the answer rebased it', () => {
    const { db, child } = claimed();
    const a = synced(db, child, 'A.');
    const b = synced(db, child, 'B.');
    edit(db, a, 'A one.');
    db.run('UPDATE sync_outbox SET sent_at = ?', ctx.now);
    edit(db, a, 'A two.');
    edit(db, b, 'B one.');
    const first = takeBatch(db, { now: ctx.now });
    expect(first.ops.map((o) => o.id)).toEqual([a]); // stops before the second op of A, keeping queue order
    answer(db, (o) => ({ applied: true, entry: state(o.id, '200') }));
    expect(ops(db).map((o) => [o.id, o.base])).toEqual([[a, '200'], [b, '100']]);
  });

  it('a duplicate rebases on the version it first wrote (applied_v), never on the current one', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Walk.');
    edit(db, id, 'Walk to the park.');
    db.run('UPDATE sync_outbox SET sent_at = ?', ctx.now);
    edit(db, id, 'Walk to the park and back.');
    answer(db, (o) => ({ dup: true, applied_v: '210', entry: state(o.id, '250') })); // 250 holds another phone's later write
    expect(ops(db)[0].base).toBe('210');
  });

  it('a duplicate records the version its own op wrote, so the next edit cannot overwrite words this phone never saw', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Leaves.');
    edit(db, id, 'Leaves, crunching.');
    answer(db, (o) => ({ dup: true, applied_v: '220', entry: state(o.id, '290') })); // 290: another phone wrote since
    expect(getEntryRow(db, id)?.server_version).toBe('220');
    edit(db, id, 'Leaves, crunching underfoot.');
    expect(ops(db)[0].base).toBe('220'); // the server will compare against the other phone's words
  });

  it('a duplicate from a server without applied_v leaves the base alone (a note at worst, never a silent overwrite)', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Sand.');
    edit(db, id, 'Sand in the shoes.');
    db.run('UPDATE sync_outbox SET sent_at = ?', ctx.now);
    edit(db, id, 'Sand in the shoes again.');
    answer(db, (o) => ({ dup: true, entry: state(o.id, '260') }));
    expect(ops(db)[0].base).toBe('100');
  });

  it('a restore is not a words write: the upsert after it keeps the base its words came from', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Snow.');
    db.transaction(() => {
      db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', ctx.now, id);
      enqueueEntryDelete(db, id, ctx);
    });
    answer(db, (o) => ({ entry: { ...state(o.id, '270'), deleted_at: ctx.now } }));
    db.transaction(() => db.run('UPDATE entries SET deleted_at = NULL WHERE id = ?', id));
    db.transaction(() => enqueueEntryRestore(db, id, ctx));
    expect(ops(db).map((o) => o.type)).toEqual(['entry.restore', 'entry.upsert']);
    answer(db, (o) => ({ entry: state(o.id, '280') }));
    expect(ops(db)[0]).toMatchObject({ type: 'entry.upsert', base: '270' });
  });
});

describe('newer words from elsewhere, with no words of mine queued', () => {
  it('an op without words that learns of newer words takes them, so the next edit is based on them', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Ball.');
    setInBook(db, id, false);
    const out = answer(db, (o) => ({ applied: true, current: { ...words('Red ball.'), v: '300' }, entry: state(o.id, '301') }));
    expect(out.conflicts).toBe(0);
    expect(listConflictCopies(db)).toEqual([]);
    expect(getEntryRow(db, id)).toMatchObject({ final_text: 'Red ball.', server_version: '301' });
    edit(db, id, 'Red ball, kicked.');
    expect(ops(db)[0].base).toBe('301');
  });

  it('an op without words, with my words queued behind it: those words become a conflict copy now', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Bubbles.');
    setInBook(db, id, false);
    db.run('UPDATE sync_outbox SET sent_at = ?', ctx.now);
    edit(db, id, 'Bubbles in the bath.');
    answer(db, (o) => ({ applied: true, current: { ...words('Bubbles everywhere.'), v: '310' }, entry: state(o.id, '311') }));
    expect(listConflictCopies(db, id).map((c) => c.words.final_text)).toEqual(['Bubbles in the bath.']);
    expect(getEntryRow(db, id)?.final_text).toBe('Bubbles everywhere.');
    expect(ops(db)).toEqual([]);
  });
});

describe('pull merge per group', () => {
  const page = (rows: Record<string, unknown>[], child: string): PullResponse => ({
    reset: false, epoch: 1, epoch_started_at: ctx.now, more: false, gone: [],
    books: [{ id: child, access: 'parent', repull: false, meta_hash: 'h', rows: rows as never, cursor: '999:00000000-0000-0000-0000-000000000000', more: false }],
  });
  const own = (id: string, child: string, over: Record<string, unknown>) => ({
    id, child_id: child, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-01', captured_at: ctx.now,
    capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'X', machine_edits: [],
    final_text: 'X', in_book: true, sounds_like_me: null, approval: 'not_needed', audio_kept_on_device: false, created_at: ctx.now,
    updated_at: ctx.now, deleted_at: null, own: true, v: '400', ...over,
  });

  it('with only a book change of mine queued, the server\'s newer words land and the queued op is rebased', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Hat.');
    setInBook(db, id, false);
    db.transaction(() => applyPullPage(db, page([own(id, child, { final_text: 'Yellow hat.', raw_transcript: 'Hat.', in_book: true })], child), ctx.now));
    expect(getEntryRow(db, id)).toMatchObject({ final_text: 'Yellow hat.', in_book: 0 }); // my queued in_book still wins
    expect(ops(db)[0].base).toBe('400');
  });

  it('with my own words queued, the pull leaves them for the server to judge', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Kite.');
    edit(db, id, 'Blue kite.');
    db.transaction(() => applyPullPage(db, page([own(id, child, { final_text: 'Green kite.', raw_transcript: 'Kite.' })], child), ctx.now));
    expect(getEntryRow(db, id)?.final_text).toBe('Blue kite.');
    expect(ops(db)[0].base).toBe('100');
  });

  it('[G-26] keeps the phone\'s finer language tag while it names the server\'s language; takes another phone\'s choice', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Hola.');
    db.run("UPDATE entries SET language = 'es-MX' WHERE id = ?", id);
    db.transaction(() => applyPullPage(db, page([own(id, child, { final_text: 'Hola.', raw_transcript: 'Hola.', language: 'es' })], child), ctx.now));
    expect(getEntryRow(db, id)?.language).toBe('es-MX');
    db.transaction(() => applyPullPage(db, page([own(id, child, { final_text: 'Hola.', raw_transcript: 'Hola.', language: 'pt', v: '401' })], child), ctx.now));
    expect(getEntryRow(db, id)?.language).toBe('pt');
    db.transaction(() => applyPullPage(db, page([own(id, child, { final_text: 'Hola.', raw_transcript: 'Hola.', language: null, v: '402' })], child), ctx.now));
    expect(getEntryRow(db, id)?.language).toBe('pt'); // a server without a value never clears the phone's
  });

  it('another parent\'s row never brings a language or working material to this phone', () => {
    const { db, child } = claimed();
    const id = id7();
    db.transaction(() => applyPullPage(db, page([{ ...own(id, child, {}), author_id: PAPA, own: false, raw_transcript: undefined, machine_edits: undefined, language: 'hi' }], child), ctx.now));
    expect(getEntryRow(db, id)).toMatchObject({ author_id: PAPA, raw_transcript: '', machine_edits: '[]', language: null });
  });
});

describe('[G-26] the letter language on the wire', () => {
  it('maps a BCP-47 tag to the server\'s seven codes, and sends nothing it would refuse', () => {
    expect(wireLanguage('en-GB')).toBe('en');
    expect(wireLanguage('zh-Hant')).toBe('zh');
    expect(wireLanguage('AR')).toBe('ar');
    expect(wireLanguage('de')).toBeNull();
    expect(wireLanguage('')).toBeNull();
    expect(wireLanguage(null)).toBeNull();
    expect(ALL_GROUPS).toContain('language');
  });

  it('a snapshot carries the language only when the server can hold it, never as null', () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Guten Tag.');
    db.run("UPDATE entries SET language = 'de' WHERE id = ?", id);
    expect(entrySnapshot(getEntryRow(db, id)!)).not.toHaveProperty('language');
    db.run("UPDATE entries SET language = 'hi-IN', occurred_precision = 'month', base_direction = 'ltr' WHERE id = ?", id);
    expect(entrySnapshot(getEntryRow(db, id)!)).toMatchObject({ language: 'hi', occurred_precision: 'month', base_direction: 'ltr' });
  });
});

describe('[F16-REQ-018] the remote kill switch', () => {
  it('while killSwitches.sync is on, no cycle reaches the server; the queue keeps; it resumes when off', async () => {
    const { db, child } = claimed();
    const id = synced(db, child, 'Moon.');
    edit(db, id, 'The moon came out.');
    const calls: string[] = [];
    const s: SupabaseLike = {
      rpc: (fn, args = {}) => {
        calls.push(fn);
        const res: RpcResult = fn === 'sync_push'
          ? { data: { results: (args.p_ops as PushOp[]).map((o) => ({ op: o.op, ok: true, entry: state(o.id, '500') })), paused: false, stopped: false }, error: null, status: 200 }
          : { data: { reset: false, epoch: 1, epoch_started_at: ctx.now, books: [], gone: [], more: false }, error: null, status: 200 };
        return Promise.resolve(res);
      },
    };
    let killed = true;
    const e = createSyncEngine({ db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false, paused: () => killed });
    const r = await e.sync();
    expect(r.phase).toBe('paused_server');
    expect(calls).toEqual([]);
    expect(e.status()).toMatchObject({ phase: 'paused_server', pending: 1 });
    killed = false;
    const r2 = await e.sync();
    expect(r2).toMatchObject({ pushed: 1, phase: 'idle' });
    expect(calls).toEqual(['sync_push', 'sync_pull']);
  });

  it('a kill-switch reader that throws pauses sync (fail closed); nothing is sent and the queue keeps', async () => {
    const { db, child } = claimed();
    edit(db, synced(db, child, 'Stars.'), 'Stars over the garden.');
    const calls: string[] = [];
    const s: SupabaseLike = { rpc: (fn) => { calls.push(fn); return Promise.resolve({ data: null, error: { code: '' }, status: 0 }); } };
    const e = createSyncEngine({ db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
      paused: () => {
        throw new Error('config not loaded');
      } });
    expect((await e.sync()).phase).toBe('paused_server');
    expect(calls).toEqual([]);
    expect(e.status().pending).toBe(1);
  });

  it('a switch turned on during a cycle stops it at the next push round or pull page', async () => {
    const { db, child } = claimed();
    edit(db, synced(db, child, 'One.'), 'One more.');
    let killed = false;
    const calls: string[] = [];
    const s: SupabaseLike = {
      rpc: (fn, args = {}) => {
        calls.push(fn);
        killed = true; // the config flips while the first request is in flight
        return Promise.resolve(fn === 'sync_push'
          ? { data: { results: (args.p_ops as PushOp[]).map((o) => ({ op: o.op, ok: true, entry: state(o.id, '600') })), paused: false, stopped: false }, error: null, status: 200 }
          : { data: { reset: false, epoch: 1, epoch_started_at: ctx.now, books: [], gone: [], more: false }, error: null, status: 200 });
      },
    };
    const e = createSyncEngine({ db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false, paused: () => killed });
    await e.sync();
    expect(calls).toEqual(['sync_push']); // no pull after the switch went on
    expect(e.status().phase).toBe('paused_server');
  });
});
