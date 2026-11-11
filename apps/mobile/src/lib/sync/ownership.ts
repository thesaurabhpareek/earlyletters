/**
 * First sign-in on this phone (A-REQ-015, TDD 01 3.2.5): the letters and books
 * made before an account existed become this account's, in ONE local
 * transaction, and their uploads are queued in order: the first-run books in
 * one batch (create_first_run_children, 1 to 6, all free), any further books,
 * my signature per book, then every letter oldest first. A kill mid-way
 * leaves nothing changed. Server-side the ids are the device's own UUIDv7s, so
 * nothing is renamed and every retry is idempotent.
 */
import type { SqlDb } from '../db/sql';
import {
  SYNC_SETTING,
  appendOp,
  enqueueEntryUpsert,
  enqueueHeldDraft,
  enqueuePrefs,
  prefsFields,
  readSetting,
  writeSetting,
  type EnqueueContext,
  type LocalChildRow,
} from './outbox';
import { ALL_GROUPS } from './types';

/** This phone's letters belong to another account; nothing was changed. */
export class AccountMismatchError extends Error {
  constructor() {
    super('sync_account_mismatch');
    this.name = 'AccountMismatchError';
  }
}

const UUID7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const FIRST_RUN_MAX = 6;

export interface OwnershipResult {
  /** 'claimed' on the first sign-in; 'already' when this account already owns the phone's data. */
  outcome: 'claimed' | 'already';
  books: number;
  letters: number;
  /** Books the server would refuse (not a device UUIDv7, or neither birthday nor due date): kept on the phone only. */
  localOnlyBooks: number;
}

export function takeOwnership(db: SqlDb, userId: string, ctx: EnqueueContext): OwnershipResult {
  let result: OwnershipResult = { outcome: 'already', books: 0, letters: 0, localOnlyBooks: 0 };
  db.transaction(() => {
    const owner = readSetting(db, SYNC_SETTING.owner);
    if (owner && owner !== userId) throw new AccountMismatchError();
    if (owner === userId) return;
    writeSetting(db, SYNC_SETTING.owner, userId);
    db.run('UPDATE entries SET author_id = ? WHERE author_id IS NULL', userId);

    const books = db.all<LocalChildRow>("SELECT * FROM children WHERE server_state = 'local' ORDER BY created_at, id");
    const ok = books.filter((c) => UUID7.test(c.id) && (c.birthday || c.due_date));
    const bad = books.filter((c) => !ok.includes(c));
    const mine = "role = 'parent', created_by_me = 1, created_by = COALESCE(created_by, ?)";
    for (const c of bad) db.run(`UPDATE children SET server_state = 'refused', ${mine} WHERE id = ?`, userId, c.id);
    for (const c of ok) db.run(`UPDATE children SET server_state = 'pending', ${mine} WHERE id = ?`, userId, c.id);

    const batch = ok.slice(0, FIRST_RUN_MAX);
    if (batch.length > 0) {
      const batchId = ctx.newId();
      appendOp(db, {
        type: 'book.first_run',
        id: batchId,
        data: { children: batch.map((c) => ({ id: c.id, name: c.name, date_of_birth: c.birthday, due_date: c.due_date })) },
      }, ctx);
      for (const c of batch) db.run('UPDATE children SET first_run_batch = ? WHERE id = ?', batchId, c.id);
    }
    for (const c of ok.slice(FIRST_RUN_MAX)) {
      appendOp(db, { type: 'book.create', id: c.id, data: { name: c.name, date_of_birth: c.birthday, due_date: c.due_date } }, ctx, { bookId: c.id });
    }
    for (const c of ok) enqueuePrefs(db, c.id, prefsFields(db, c.id), ctx);

    // Letters deleted before they ever left the phone stay local (Recently deleted only).
    const letters = db.all<{ id: string }>(
      "SELECT id FROM entries WHERE author_id = ? AND deleted_at IS NULL AND child_id IS NOT NULL ORDER BY captured_at, id",
      userId,
    );
    for (const l of letters) enqueueEntryUpsert(db, l.id, ALL_GROUPS, ctx); // a waiting letter goes as its held row
    // Letters the author held at the Keep gate before signing in (F14-REQ-039): author-only held rows.
    for (const d of db.all<{ id: string }>('SELECT id FROM drafts WHERE held_kind IS NOT NULL ORDER BY created_at, id')) {
      enqueueHeldDraft(db, d.id, ctx);
    }
    const queued = db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE type = 'entry.upsert'")!.n;
    result = { outcome: 'claimed', books: ok.length, letters: queued, localOnlyBooks: bad.length };
  });
  return result;
}

/**
 * A phone with nothing on it has no owner to protect. `takeOwnership` writes `sync.ownerId` even when the phone holds no
 * book (the first sign-in on an empty phone), and nothing cleared it at sign-out, so a second account that signed in on the
 * same empty phone ("Use another account", "Try another account") met `AccountMismatchError`, and its sync stopped without
 * a word. This clears the owner when, and only when, nothing on the phone could belong to that account:
 *  - `holdsAnyRow(db)` is false: pass `phoneHoldsAnyRow` (lib/auth/account-claim.logic.ts, re-exported by auth-store.ts), the
 *    claim screen's own question. It counts any row in `children` or `entries`, in any state (hidden, refused and deleted ones
 *    too), and any draft held at the Keep gate, and errs towards "not empty". It is passed in, not imported, because that
 *    module is read only by auth code (test/auth-kill-path.test.ts);
 *  - nothing waits in `sync_outbox` (a queued erase can outlive its row, and must not go up under another account).
 * In one transaction. The held-draft cursor goes with the owner: it is the first account's place in its own held drafts, and the
 * next account's pull must not start there. A phone that holds anything keeps its owner (and the cursor), so another account
 * still meets the mismatch and nothing moves between accounts. Deletes nothing else. Returns whether it released.
 */
export function releaseEmptyOwner(db: SqlDb, holdsAnyRow: (db: SqlDb) => boolean): boolean {
  let released = false;
  db.transaction(() => {
    if (readSetting(db, SYNC_SETTING.owner) === null) return;
    if (holdsAnyRow(db)) return;
    const waiting = db.get<{ n: number }>('SELECT EXISTS (SELECT 1 FROM sync_outbox) AS n');
    if (!waiting || Number(waiting.n) !== 0) return; // an unreadable answer is "not empty"
    writeSetting(db, SYNC_SETTING.owner, null);
    writeSetting(db, SYNC_SETTING.heldCursor, null);
    released = true;
  });
  return released;
}

/** Plus bought later (or a fixed book): send a book the server refused again, with its letters. */
export function retryRefusedBook(db: SqlDb, childId: string, ctx: EnqueueContext): void {
  db.transaction(() => {
    const c = db.get<LocalChildRow>("SELECT * FROM children WHERE id = ? AND server_state = 'refused'", childId);
    if (!c) return;
    db.run("UPDATE children SET server_state = 'pending' WHERE id = ?", childId);
    const parked = db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ? AND type = 'book.create'", childId)!.n;
    if (parked === 0) {
      appendOp(db, { type: 'book.create', id: childId, data: { name: c.name, date_of_birth: c.birthday, due_date: c.due_date } }, ctx, { bookId: childId });
    }
    const letters = db.all<{ id: string }>(
      'SELECT e.id FROM entries e WHERE e.child_id = ? AND e.deleted_at IS NULL AND e.server_version IS NULL AND NOT EXISTS (SELECT 1 FROM sync_outbox o WHERE o.entity_id = e.id)',
      childId,
    );
    for (const l of letters) enqueueEntryUpsert(db, l.id, ALL_GROUPS, ctx);
  });
}
