/// <reference types="node" />
/**
 * BL-449: a sign-out wait ends when the queued letters belong to another account.
 * A queues and signs out, B signs in with sync on and signs out: B's sign-out does
 * not wait on A's rows, and A's rows stay queued. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { ALL_GROUPS } from '../src/lib/sync/types';
import { enqueueEntryUpsert, pendingCount, pendingForAccount, writeSetting, SYNC_SETTING } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const NOW = '2026-10-03T09:00:00.000Z';

function phoneWithQueuedLetter(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: NOW, newId: id7 });
  writeSetting(db, SYNC_SETTING.owner, A);
  const child = id7();
  insertBook(db, { id: child, name: 'Asha', birthday: '2025-04-12', at: NOW });
  const entry = id7();
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id) VALUES (?, 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, 'x', '[]', 'x', 1, ?, ?)`,
    entry, NOW, NOW, child,
  );
  enqueueEntryUpsert(db, entry, ALL_GROUPS, { now: NOW, newId: id7 });
  return db;
}

describe('pendingForAccount (the sign-out check)', () => {
  it('does not count rows the phone holds for another account, and leaves them queued', () => {
    const db = phoneWithQueuedLetter();
    expect(pendingCount(db)).toBeGreaterThan(0);
    expect(pendingForAccount(db, B)).toBe(0);
    expect(pendingCount(db)).toBeGreaterThan(0);
  });

  it('still counts the signed-in account\'s own rows', () => {
    const db = phoneWithQueuedLetter();
    expect(pendingForAccount(db, A)).toBe(pendingCount(db));
  });

  it('counts rows on a phone with no owner yet (the engine will claim them)', () => {
    const db = phoneWithQueuedLetter();
    writeSetting(db, SYNC_SETTING.owner, null);
    expect(pendingCount(db)).toBeGreaterThan(0);
    expect(pendingForAccount(db, B)).toBe(pendingCount(db));
  });
});
