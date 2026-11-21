/// <reference types="node" />
/**
 * NX-31-R3 and R28, wire contract: a book with no name goes up as the empty string, never null and never left
 * out, together with its date. The server (supabase/migrations/20261109000000_child_name_optional.sql, PR 700)
 * stores '' and refuses only a name over 60 characters or a book with no date. Until that migration is applied,
 * the old 1-to-60 check refuses an empty name, so it must land before this change reaches a build.
 * Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { enqueueBookCreate } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const ME = '11111111-1111-1111-1111-111111111111';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: '2026-10-03T09:00:00.000Z', newId: id7 };

function phone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  return db;
}
const ops = (db: SqlDb) =>
  db.all<{ type: string; payload: string }>('SELECT type, payload FROM sync_outbox ORDER BY lane, seq')
    .map((r) => ({ type: r.type, ...(JSON.parse(r.payload) as { data: Record<string, unknown> }) }));

describe('[NX-31-R28] a nameless book on the wire', () => {
  it('the first-run batch carries name "" as a string, with the date', () => {
    const db = phone();
    const id = insertBook(db, { id: id7(), name: '', birthday: '2026-03-01', at: ctx.now });
    takeOwnership(db, ME, ctx);
    const batch = ops(db).find((o) => o.type === 'book.first_run');
    const kids = (batch?.data as { children: Record<string, unknown>[] }).children;
    expect(kids).toEqual([{ id, name: '', date_of_birth: '2026-03-01', due_date: null }]);
    expect(typeof kids[0].name).toBe('string');
  });

  it('a book added after sign-in carries name "" as a string, with the date', () => {
    const db = phone();
    takeOwnership(db, ME, ctx);
    const id = insertBook(db, { id: id7(), name: '', birthday: null, dueDate: '2027-01-15', at: ctx.now });
    db.transaction(() => enqueueBookCreate(db, id, ctx));
    const create = ops(db).find((o) => o.type === 'book.create');
    expect(create?.data).toEqual({ name: '', date_of_birth: null, due_date: '2027-01-15' });
  });
});
