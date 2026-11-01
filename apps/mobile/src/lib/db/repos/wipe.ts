/**
 * Delete a book and Erase everything on this phone (BL-387; DATA-REQ-014, DATA-REQ-024, F17-REQ-080; F17 6.2 D, 6.2 F).
 * The rows only: the store (store.ts) removes each recording file first and these rows after, so a file never
 * outlives its row where the launch sweep could bring it back as a draft (capture/sweep.ts re-attaches a file
 * with no row).
 *
 * A deleted book waits 30 days, restorable, like a deleted letter (F17 6.2 D step 5; spec 2.3 "Any parent can cancel
 * within 30 days"). It is marked in `settings`, not in a new column, because local schema numbers are given out by
 * the coordinator (08-delivery section 4) and this needs none:
 *   book.deletedAt.<child id>  L2  when the person deleted the book (this phone's clock)
 *   book.erasing.<child id>    L2  "Erase now" or the 30-day purge began; a relaunch finishes it
 *   erase.everything.pending   L2  Erase everything began; a relaunch finishes it before any screen reads the store
 * Each holds a time or '1' and an id the phone made: no name, no words.
 *
 * Nothing here queues an upload. Both paths are offered only on a phone that never signed in (store.ts checks).
 */
import type { RepoContext } from './context';

export const BOOK_DELETED_PREFIX = 'book.deletedAt.';
export const BOOK_ERASING_PREFIX = 'book.erasing.';
export const ERASE_EVERYTHING_SETTING = 'erase.everything.pending';

/** SQL test for "this book is deleted", for a query that names the book `c` (children.ts LISTED). */
export const BOOK_NOT_DELETED_SQL = `NOT EXISTS (SELECT 1 FROM settings s WHERE s.key = '${BOOK_DELETED_PREFIX}' || c.id)`;

export interface DeletedBook {
  id: string;
  name: string;
  deletedAt: string;
}

export function isDeleted({ db }: RepoContext, id: string): boolean {
  return db.get<{ n: number }>('SELECT 1 AS n FROM settings WHERE key = ?', BOOK_DELETED_PREFIX + id) !== null;
}

/** Marks a book deleted. False when there is no such book or it is already deleted. */
export function markDeleted(ctx: RepoContext, id: string): boolean {
  if (!ctx.db.get<{ id: string }>('SELECT id FROM children WHERE id = ?', id)) return false;
  if (isDeleted(ctx, id)) return false;
  ctx.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', BOOK_DELETED_PREFIX + id, ctx.now());
  return true;
}

/** Restore the book: it comes back exactly as it was. False when it is not deleted, or its erase has begun. */
export function unmarkDeleted(ctx: RepoContext, id: string): boolean {
  if (!isDeleted(ctx, id) || isErasing(ctx, id)) return false;
  ctx.db.run('DELETE FROM settings WHERE key = ?', BOOK_DELETED_PREFIX + id);
  return true;
}

export function isErasing({ db }: RepoContext, id: string): boolean {
  return db.get<{ n: number }>('SELECT 1 AS n FROM settings WHERE key = ?', BOOK_ERASING_PREFIX + id) !== null;
}

/** Records that the erase began, before any file goes, so a kill part way is finished by the next launch. */
export function markErasing(ctx: RepoContext, id: string): void {
  ctx.db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', BOOK_ERASING_PREFIX + id, ctx.now());
}

/** Deleted books, newest deletion first, with the name the shelf shows. A book whose erase began is not listed. */
export function listDeleted({ db }: RepoContext): DeletedBook[] {
  return db
    .all<{ id: string; name: string; deleted_at: string }>(
      `SELECT c.id, c.name, s.value AS deleted_at FROM settings s JOIN children c ON s.key = '${BOOK_DELETED_PREFIX}' || c.id
       WHERE NOT EXISTS (SELECT 1 FROM settings e WHERE e.key = '${BOOK_ERASING_PREFIX}' || c.id)
       ORDER BY s.value DESC, c.id DESC`,
    )
    .map((r) => ({ id: r.id, name: r.name, deletedAt: r.deleted_at }));
}

/** Books whose erase began and did not finish (a kill), oldest first. */
export function erasingIds({ db }: RepoContext): string[] {
  return db
    .all<{ key: string }>(`SELECT key FROM settings WHERE key LIKE '${BOOK_ERASING_PREFIX}%' ORDER BY value, key`)
    .map((r) => r.key.slice(BOOK_ERASING_PREFIX.length));
}

/** Deleted books whose 30 days are over at `cutoffIso`, oldest deletion first. */
export function expiredIds({ db }: RepoContext, cutoffIso: string): string[] {
  return db
    .all<{ key: string }>(`SELECT key FROM settings WHERE key LIKE '${BOOK_DELETED_PREFIX}%' AND value <= ? ORDER BY value, key`, cutoffIso)
    .map((r) => r.key.slice(BOOK_DELETED_PREFIX.length));
}

/** Ids of every deleted book (the letter shelf leaves their letters out: they wait inside the book). */
export function deletedIds({ db }: RepoContext): string[] {
  return db
    .all<{ key: string }>(`SELECT key FROM settings WHERE key LIKE '${BOOK_DELETED_PREFIX}%'`)
    .map((r) => r.key.slice(BOOK_DELETED_PREFIX.length));
}

/** Every letter and draft of one book, with its recording path (null for typed ones). */
export function bookAudioRows({ db }: RepoContext, childId: string): { id: string; audioUri: string | null }[] {
  return [
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM entries WHERE child_id = ? ORDER BY id', childId),
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM drafts WHERE child_id = ? ORDER BY id', childId),
  ].map((r) => ({ id: r.id, audioUri: r.audio_uri }));
}

/**
 * Removes one book and everything of it on this phone, inside the caller's transaction: its letters (deleted ones
 * too) and drafts, anything queued or refused for them, its per-person choices, the server's last listing, every
 * setting that names it, the book row, and last its two marks. The recordings must already be gone (store.ts).
 */
export function removeBook({ db }: RepoContext, childId: string): void {
  const own = 'SELECT id FROM entries WHERE child_id = ? UNION SELECT id FROM drafts WHERE child_id = ?';
  db.run(`DELETE FROM sync_outbox WHERE entity_id IN (${own}) OR entity_id = ?`, childId, childId, childId);
  db.run(`DELETE FROM rejected_writes WHERE entity_id IN (${own}) OR entity_id = ?`, childId, childId, childId);
  db.run('DELETE FROM entries WHERE child_id = ?', childId);
  db.run('DELETE FROM drafts WHERE child_id = ?', childId);
  db.run('DELETE FROM child_member_prefs WHERE child_id = ?', childId);
  db.run('DELETE FROM sync_books WHERE child_id = ?', childId);
  db.run("DELETE FROM settings WHERE key = 'activeChildId' AND value = ?", childId);
  // Settings that name the book by id (the due-date card's hide, and any later per-book choice). Ids are UUIDs.
  db.run('DELETE FROM settings WHERE instr(key, ?) > 0 AND key NOT IN (?, ?)', childId, BOOK_DELETED_PREFIX + childId, BOOK_ERASING_PREFIX + childId);
  db.run('DELETE FROM children WHERE id = ?', childId);
  db.run('DELETE FROM settings WHERE key IN (?, ?)', BOOK_DELETED_PREFIX + childId, BOOK_ERASING_PREFIX + childId);
}

/** Every letter and draft on this phone with its recording path, for Erase everything. */
export function allAudioRows({ db }: RepoContext): { id: string; audioUri: string | null }[] {
  return [
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM entries ORDER BY id'),
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM drafts ORDER BY id'),
  ].map((r) => ({ id: r.id, audioUri: r.audio_uri }));
}

/**
 * Erase everything, the rows (inside the caller's transaction): every row of every table on this phone, read from
 * the schema so a table added later is never missed. Settings go too, all but the pending mark, which the caller
 * removes last, and `keepSettings` (an active 18+ stop, store.ts). The schema version stays, so the next open needs no migration.
 */
export function removeEverything({ db }: RepoContext, keepSettings: readonly string[] = []): void {
  const tables = db
    .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map((r) => r.name);
  for (const t of tables) {
    if (t === 'settings') {
      const keep = [ERASE_EVERYTHING_SETTING, ...keepSettings];
      db.run(`DELETE FROM settings WHERE key NOT IN (${keep.map(() => '?').join(', ')})`, ...keep);
    }
    else db.run(`DELETE FROM "${t.replace(/"/g, '""')}"`);
  }
}
