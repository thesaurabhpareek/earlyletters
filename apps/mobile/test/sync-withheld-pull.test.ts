/// <reference types="node" />
/**
 * BL-1918 (follow-up to #1676, FR-PRV-20): a pull the server withheld for consent is not "nothing changed".
 *  W1 it stamps neither lastSyncedAt nor lastVerifyAt (a screen and the verify clock read those as "the phone is up to date").
 *  W2 it never lets a held letter lapse: a restore plus a long consent pause must not delete letters by others that the
 *     server could not hand back.
 *  W3 the 30 days then count from the first pull the server answered, not from the restore.
 * Real engine over the real phone database; the server is a fake. Fictional family "Asha" only.
 *
 * Mutations these tests were written to catch (each failed a test here when it was made):
 *  M1 the `withheld` early exit removed (the page is treated as a normal one);
 *  M2 `dropStaleHeld` run on a withheld cycle;
 *  M3 the restore clock not restarted on a withheld cycle (W3);
 *  M4 the stamp written on a withheld cycle.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine } from '../src/lib/sync/engine';
import { HELD_AFTER_RESTORE_MS } from '../src/lib/sync/merge';
import { SYNC_SETTING, readSetting, writeSetting } from '../src/lib/sync/outbox';
import type { PullResponse, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const PAPA = '0192f0aa-0000-7000-8000-0000000000b2';
const RESTORED = Date.parse('2026-10-01T09:00:00.000Z');
const DAY = 24 * 3600_000;
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ok = (data: unknown): RpcResult => ({ data, error: null, status: 200 });
const empty = (): PullResponse => ({ reset: false, epoch: 1, epoch_started_at: '2026-10-01T09:00:00.000Z', books: [], gone: [], more: false } as unknown as PullResponse);
const withheld = (): PullResponse => ({ ...empty(), withheld: 'consent' });

let db: SqlDb;
let close: () => void;
let clock: number;
let answer: () => PullResponse;

const held = () => db.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE sync_state = 'held'")!.n;

beforeEach(() => {
  const h = nodeDb();
  db = h.db;
  close = h.close;
  migrate(db, { now: new Date(RESTORED).toISOString(), newId: id7 });
  const child = id7();
  insertBook(db, { id: child, name: 'Asha', birthday: '2025-04-12', at: new Date(RESTORED).toISOString() });
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, sync_state, server_version)
     VALUES (?, 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, 'From Papa.', '[]', 'From Papa.', 1, ?, ?, ?, 'held', '9')`,
    id7(), new Date(RESTORED).toISOString(), new Date(RESTORED).toISOString(), child, PAPA,
  );
  writeSetting(db, SYNC_SETTING.restoreAt, new Date(RESTORED).toISOString());
  clock = RESTORED + HELD_AFTER_RESTORE_MS + DAY; // past the 30 days
});
afterEach(() => close());

async function cycle(verify = false) {
  const supabase: SupabaseLike = { rpc: async (fn) => (fn === 'sync_pull' ? ok(answer()) : ok({})) };
  const engine = createSyncEngine({
    db, supabase, userId: A, newId: id7, now: () => clock, random: () => 1,
    setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
  });
  await engine.sync({ verify });
}

describe('[BL-1918] a pull withheld for consent', () => {
  it('control: a normal empty page 31 days after the restore stamps the pull and lets the held letter go', async () => {
    answer = empty;
    await cycle(true);
    expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).not.toBeNull();
    expect(readSetting(db, SYNC_SETTING.lastVerifyAt)).not.toBeNull();
    expect(held()).toBe(0);
  });

  it('W1 stamps neither lastSyncedAt nor lastVerifyAt', async () => {
    answer = withheld;
    await cycle(true);
    expect(readSetting(db, SYNC_SETTING.lastSyncedAt)).toBeNull();
    expect(readSetting(db, SYNC_SETTING.lastVerifyAt)).toBeNull();
  });

  it('W2 keeps the held letter however long the pause has lasted', async () => {
    answer = withheld;
    await cycle();
    expect(held()).toBe(1);
  });

  it('W3 counts the 30 days from the first pull the server answered, not from the restore', async () => {
    answer = withheld;
    await cycle();
    answer = empty;
    clock += 29 * DAY;
    await cycle();
    expect(held()).toBe(1); // resumed 29 days ago: still waiting for its author's phone
    clock += 2 * DAY;
    await cycle();
    expect(held()).toBe(0); // 31 days after the pause ended
  });
});
