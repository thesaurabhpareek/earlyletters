/// <reference types="node" />
/**
 * Erase now in a sync build, on the phone (WP-F16-13 client; F16-REQ-024, D-085):
 * the erase op waits in its own lane and never holds up the queue, still goes in a
 * consent pause, waits for a server that cannot erase yet, and a pull never brings
 * an erased letter back. A letter the server erased while it waited in Recently
 * deleted here is erased here too (file first, then row); one still live here goes
 * to Recently deleted. The server half runs in sync-two-phone.test.ts.
 * Fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { applyPullPage, applyPushResponse } from '../src/lib/sync/merge';
import {
  ERASE_LANE,
  SYNC_SETTING,
  enqueueEntryErase,
  enqueueEntryUpsert,
  getEntryRow,
  markSent,
  takeBatch,
  writeSetting,
} from '../src/lib/sync/outbox';
import type { PullResponse, PushResponse } from '../src/lib/sync/types';
import { fixture, insertBook } from './helpers/store-fixture';

const ME = '11111111-1111-1111-1111-111111111111';
const NOW = '2026-10-03T09:00:00.000Z';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };

function phone(): SqlDb {
  const f = fixture();
  insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama', serverState: 'synced' });
  writeSetting(f.db, SYNC_SETTING.owner, ME);
  writeSetting(f.db, SYNC_SETTING.epoch, '1');
  return f.db;
}
function letter(db: SqlDb, id: string, opts: { deleted?: boolean; v?: string } = {}): void {
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
       in_book, updated_at, child_id, author_id, server_version, server_updated_at, server_epoch, sync_state, deleted_at)
     VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, 'Hi.', '[]', 'Hi.', 1, ?, 'c1', ?, ?, ?, 1, 'synced', ?)`,
    id, NOW, NOW, ME, opts.v ?? '100', NOW, opts.deleted ? NOW : null,
  );
}
const queue = (db: SqlDb) => db.all<{ type: string; lane: number; next_attempt_at: string | null }>('SELECT type, lane, next_attempt_at FROM sync_outbox ORDER BY lane, seq');

describe('[F16-REQ-024] the erase op', () => {
  it('waits in its own lane after every other op; goes during a consent pause; carries the id only', () => {
    const db = phone();
    letter(db, 'e1', { deleted: true });
    letter(db, 'e2');
    db.run("DELETE FROM entries WHERE id = 'e1'");
    enqueueEntryErase(db, 'e1', 'c1', ctx);
    enqueueEntryErase(db, 'e1', 'c1', ctx); // once
    db.run("UPDATE entries SET final_text = 'Hi there.' WHERE id = 'e2'");
    enqueueEntryUpsert(db, 'e2', ['text'], ctx);
    expect(queue(db).map((o) => [o.type, o.lane])).toEqual([['entry.upsert', 1], ['entry.erase', ERASE_LANE]]);
    const all = takeBatch(db, { now: NOW });
    expect(all.ops.map((o) => o.type)).toEqual(['entry.upsert', 'entry.erase']);
    expect(Object.keys(all.ops[1]).sort()).toEqual(['data', 'id', 'op', 'type']); // the id only, never words
    expect(all.ops[1].data).toEqual({});
    expect(all.ops[1].id).toBe('e1');
    expect(takeBatch(db, { now: NOW, onlyDeletes: true }).ops.map((o) => o.type)).toEqual(['entry.erase']);
  });

  it('a server that cannot erase yet (unknown op type): the erase waits, is not a refused write, and holds nothing up', () => {
    const db = phone();
    enqueueEntryErase(db, 'e1', 'c1', ctx);
    const b = takeBatch(db, { now: NOW });
    db.transaction(() => markSent(db, b.rows, NOW));
    const res = { results: [{ op: b.ops[0].op, ok: false, code: '22023' }], paused: false, stopped: false } as unknown as PushResponse;
    let out!: ReturnType<typeof applyPushResponse>;
    db.transaction(() => {
      out = applyPushResponse(db, b.rows, res, ctx);
    });
    expect(out.rejected).toBe(0);
    expect(queue(db)).toEqual([{ type: 'entry.erase', lane: ERASE_LANE, next_attempt_at: expect.any(String) }]);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes')!.n).toBe(0);
    letter(db, 'e2');
    db.run("UPDATE entries SET final_text = 'Later words.' WHERE id = 'e2'");
    enqueueEntryUpsert(db, 'e2', ['text'], ctx);
    expect(takeBatch(db, { now: NOW }).ops.map((o) => o.type)).toEqual(['entry.upsert']); // the waiting erase is skipped
  });

  it('a pull never brings back a letter whose erase is still on its way', () => {
    const db = phone();
    enqueueEntryErase(db, 'e1', 'c1', ctx);
    const page: PullResponse = {
      reset: false, epoch: 1, epoch_started_at: NOW, gone: [], more: false,
      books: [{
        id: 'c1', access: 'parent', repull: false, meta_hash: 'x', cursor: '900:00000000-0000-0000-0000-000000000000', more: false,
        rows: [{
          id: 'e1', child_id: 'c1', author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW,
          capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'Hi.', machine_edits: [],
          final_text: 'Hi.', in_book: true, sounds_like_me: null, approval: null, created_at: NOW, updated_at: NOW, deleted_at: NOW, own: true, v: '120',
        }],
      }] as unknown as PullResponse['books'],
    };
    db.transaction(() => applyPullPage(db, page, NOW));
    expect(getEntryRow(db, 'e1')).toBeNull();
  });

  it('the server no longer holds a letter: deleted here, it is to be erased here; live here, it goes to Recently deleted', () => {
    const db = phone();
    letter(db, 'e1', { deleted: true });
    letter(db, 'e2');
    const page: PullResponse = {
      reset: false, epoch: 1, epoch_started_at: NOW, gone: [], more: false,
      books: [{ id: 'c1', access: 'parent', repull: false, meta_hash: 'x', cursor: '900:00000000-0000-0000-0000-000000000000', more: false, rows: [], ids: [] }] as unknown as PullResponse['books'],
    };
    db.transaction(() => applyPullPage(db, page, NOW));
    expect(getEntryRow(db, 'e1')).toMatchObject({ sync_state: 'erased' });
    expect(getEntryRow(db, 'e2')).toMatchObject({ sync_state: 'gone', deleted_at: NOW });
  });
});
