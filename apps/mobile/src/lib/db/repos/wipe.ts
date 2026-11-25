/**
 * Delete a book and Erase everything on this phone (BL-387; DATA-REQ-014, DATA-REQ-024, F17-REQ-080; F17 6.2 D, 6.2 F).
 * The rows only: the store (store.ts) removes each recording file first and these rows after, so a file never
 * outlives its row where the launch sweep could bring it back as a draft (capture/sweep.ts re-attaches a file
 * with no row).
 *
 * A deleted book waits 30 days, restorable, like a deleted letter (F17 6.2 D step 5; spec 2.3 "Any parent can cancel
 * within 30 days"). It is marked in `settings`, not in a new column, because local schema numbers are given out by
 * the coordinator (08-delivery section 4) and this needs none:
 *   book.deletedAt.<child id>  L3  when the person deleted the book (this phone's clock)
 *   book.erasing.<child id>    L3  "Erase now" or the 30-day purge began; a relaunch finishes it
 *   erase.everything.pending   L2  Erase everything began; a relaunch finishes it before any screen reads the store
 *   erase.everything.scope     L3  what existed when that erase began (BL-775): each table's row ids and the settings
 *                                  keys, never a value, a name or words; written with the pending mark, removed with it
 * The first two hold an L2 time, but their key holds a book id (L3, DATA_CLASSIFICATION 1.1 rule 5; the highest level
 * wins, rule 1), so each row is handled as L3, as `readTogether.sessions.<book id>` is (4.5). The third is a time under
 * a fixed key. The scope holds ids and keys only (L3, as a key holding a book id is). None holds a name or words, and none
 * is logged or sent.
 *
 * Nothing here queues an upload. Both paths are offered only on a phone that never signed in (store.ts checks).
 */
import type { RepoContext } from './context';
import type { SqlDb, SqlParam } from '../sql';
import { dropSearchIndex, reconcileSearch, SEARCH_TABLE } from '../../find/lifecycle';

export const BOOK_DELETED_PREFIX = 'book.deletedAt.';
export const BOOK_ERASING_PREFIX = 'book.erasing.';
export const ERASE_EVERYTHING_SETTING = 'erase.everything.pending';
export const ERASE_EVERYTHING_SCOPE = 'erase.everything.scope';

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
  reconcileSearch(ctx.db); // a deleted book's letters wait inside the book and are not found
  return true;
}

/** Restore the book: it comes back exactly as it was. False when it is not deleted, or its erase has begun. */
export function unmarkDeleted(ctx: RepoContext, id: string): boolean {
  if (!isDeleted(ctx, id) || isErasing(ctx, id)) return false;
  ctx.db.run('DELETE FROM settings WHERE key = ?', BOOK_DELETED_PREFIX + id);
  reconcileSearch(ctx.db);
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
  db.run("DELETE FROM settings WHERE key IN (SELECT 'discard.failures.' || id FROM drafts WHERE child_id = ?)", childId); // NS-09-R15: the count goes with the draft
  db.run('DELETE FROM drafts WHERE child_id = ?', childId);
  db.run('DELETE FROM child_member_prefs WHERE child_id = ?', childId);
  db.run('DELETE FROM sync_books WHERE child_id = ?', childId);
  db.run("DELETE FROM settings WHERE key = 'activeChildId' AND value = ?", childId);
  // Settings that name the book by id (the due-date card's hide, and any later per-book choice). Ids are UUIDs.
  db.run('DELETE FROM settings WHERE instr(key, ?) > 0 AND key NOT IN (?, ?)', childId, BOOK_DELETED_PREFIX + childId, BOOK_ERASING_PREFIX + childId);
  db.run('DELETE FROM children WHERE id = ?', childId);
  db.run('DELETE FROM settings WHERE key IN (?, ?)', BOOK_DELETED_PREFIX + childId, BOOK_ERASING_PREFIX + childId);
  reconcileSearch(db); // the book's letters are gone, so their words leave the Find index in the same transaction
}

/** Every letter and draft on this phone with its recording path, for Erase everything. */
export function allAudioRows({ db }: RepoContext): { id: string; audioUri: string | null }[] {
  return [
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM entries ORDER BY id'),
    ...db.all<{ id: string; audio_uri: string | null }>('SELECT id, audio_uri FROM drafts ORDER BY id'),
  ].map((r) => ({ id: r.id, audioUri: r.audio_uri }));
}

// ── What one Erase everything may remove (BL-775; DATA-REQ-024) ─────────────
/**
 * Read once, in the transaction that writes the pending mark: the identity of every row then on the phone. A try that
 * ends `incomplete` (a recording that will not go) leaves the person using the app; every later try, and the launch
 * resume, removes only these rows and the files they own, so what is written in between is kept. Null (no scope, or
 * one that cannot be trusted) means every row present goes, as before BL-775.
 *
 * How old is told from new, per table (all of them are read from the schema, so a table added later is covered):
 *  - By the table's one-column primary key: `settings.key`, `entries.id`, `drafts.id`, `children.id`,
 *    `child_member_prefs.child_id`, `sync_books.child_id`, `orphan_audio.file_name`, `rejected_writes.op_id`,
 *    `agreements.id`, `entry_media.id`, `sync_outbox.seq`. None is given to a different row later: ids are UUIDv7 made on
 *    this phone, `seq` is AUTOINCREMENT, a book's own rows are keyed by its id, and a settings key that existed is the
 *    same setting whatever its value is now (so a choice made before the erase goes even if it was changed after).
 *  - `entries` and `drafts` share one id space: a draft keeps its id when it becomes a letter (capture/erase.ts), so a
 *    take that was a draft when the erase began is old even if it is kept as a letter afterwards. Its recording,
 *    picture and words existed before the mark.
 *  - `entry_media`: a picture goes with its letter or draft (NS-01-R16, as erasePictureOf does), so it is old when its
 *    own id is in the scope or its owner's id is.
 *  - `settings` `discard.failures.<draft id>`: goes with an old draft (NS-09-R15), whenever it was written.
 *  - A table with no one-column key (none today; erase-all.test.ts pins that) by rowid. SQLite can give a deleted
 *    newest rowid to a new row, so a new table must get a key before it relies on this.
 *  - A table not in the scope was made after the mark: nothing in it is old. The scope is trusted only under the
 *    schema version it was read at (readEraseScope), so an update that moved old rows into a new table cannot keep them.
 *  - The Find index (`letter_search*`) is not in it: it is dropped whole on every try and made again from the letters
 *    left (ADR 0028 D5).
 * A letter written after the mark is kept even when its book was old and goes: the book row existed before the erase.
 */
export interface EraseScope {
  readonly schema: number;
  readonly tables: Readonly<Record<string, readonly SqlParam[]>>;
}

/** Tables whose rows share one id space (a draft becomes a letter under the same id). */
const SHARED_IDS: Readonly<Record<string, readonly string[]>> = { entries: ['entries', 'drafts'], drafts: ['entries', 'drafts'] };
const DISCARD_FAILURES_PREFIX = 'discard.failures.';
/** SQLite's limit on bound values is 999 on older builds; stay well under it. */
const CHUNK = 400;

const quote = (name: string): string => `"${name.replace(/"/g, '""')}"`;
const schemaVersion = (db: SqlDb): number => db.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
const isSearchIndex = (t: string): boolean => t === SEARCH_TABLE || t.startsWith(`${SEARCH_TABLE}_`);

function userTables(db: SqlDb): string[] {
  return db
    .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map((r) => r.name);
}

/** The column that names a row for good: the one-column primary key, else rowid. */
export function identityColumn(db: SqlDb, table: string): string {
  const pk = db.all<{ name: string; pk: number }>(`PRAGMA table_info(${quote(table)})`).filter((c) => c.pk > 0);
  return pk.length === 1 ? pk[0].name : 'rowid';
}
const column = (col: string): string => (col === 'rowid' ? 'rowid' : quote(col));

/** The scope as stored: written in the caller's transaction, with the pending mark (store.ts). */
export function takeEraseScope({ db }: RepoContext): string {
  const tables: Record<string, SqlParam[]> = {};
  for (const t of userTables(db)) {
    if (isSearchIndex(t)) continue;
    tables[t] = db.all<{ k: SqlParam }>(`SELECT ${column(identityColumn(db, t))} AS k FROM ${quote(t)}`).map((r) => r.k);
  }
  return JSON.stringify({ v: 1, schema: schemaVersion(db), tables });
}

/**
 * The scope written with the pending mark, or null: none was written (a mark left by a build before BL-775), it does not
 * parse, or the schema changed since (an update in between). Null erases every row present, which is what the failed
 * line has always told the person ("that erases anything you add before then").
 */
export function readEraseScope({ db }: RepoContext): EraseScope | null {
  const raw = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', ERASE_EVERYTHING_SCOPE)?.value;
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { v?: unknown; schema?: unknown; tables?: unknown };
    if (o.v !== 1 || typeof o.schema !== 'number' || typeof o.tables !== 'object' || o.tables === null || Array.isArray(o.tables)) return null;
    const tables: Record<string, SqlParam[]> = {};
    for (const [t, ids] of Object.entries(o.tables as Record<string, unknown>)) {
      if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string' || typeof x === 'number')) return null;
      tables[t] = ids as SqlParam[];
    }
    if (o.schema !== schemaVersion(db)) return null;
    return { schema: o.schema, tables };
  } catch {
    return null;
  }
}

/** The old ids of `table` (with its shared id space), or null when the table was not there when the erase began. */
function oldIds(scope: EraseScope, table: string): Set<SqlParam> | null {
  const from = SHARED_IDS[table] ?? [table];
  if (!from.some((t) => t in scope.tables)) return null;
  return new Set(from.flatMap((t) => scope.tables[t] ?? []));
}

/** The entry_media ids that are old: by their own id, or because their letter or draft is old. */
function oldPictures(db: SqlDb, scope: EraseScope): Set<string> {
  const own = oldIds(scope, 'entry_media') ?? new Set<SqlParam>();
  const owners = oldIds(scope, 'entries') ?? new Set<SqlParam>();
  if (!userTables(db).includes('entry_media')) return new Set();
  return new Set(
    db
      .all<{ id: string; owner: string | null }>('SELECT id, COALESCE(entry_id, draft_id) AS owner FROM entry_media')
      .filter((r) => own.has(r.id) || (r.owner !== null && owners.has(r.owner)))
      .map((r) => r.id),
  );
}

/** The letters and drafts whose recordings this try removes: all of them with no scope, else the old ones. */
export function audioRowsToErase(ctx: RepoContext, scope: EraseScope | null): { id: string; audioUri: string | null }[] {
  const rows = allAudioRows(ctx);
  if (!scope) return rows;
  const old = oldIds(scope, 'entries') ?? new Set<SqlParam>();
  return rows.filter((r) => old.has(r.id));
}

/** Files the device sweep of this try must leave: those a kept row owns. Nothing with no scope, or on the first try. */
export interface KeptFiles {
  /** Stored recording paths of the letters and drafts that stay (matched by path or by file name, as the sweep pairs them). */
  readonly recordings: readonly string[];
  /** entry_media ids of the pictures that stay. */
  readonly pictures: readonly string[];
}
export const NOTHING_KEPT: KeptFiles = { recordings: [], pictures: [] };

export function keptFiles(ctx: RepoContext, scope: EraseScope | null): KeptFiles {
  if (!scope) return NOTHING_KEPT;
  const old = oldIds(scope, 'entries') ?? new Set<SqlParam>();
  const recordings = allAudioRows(ctx).flatMap((r) => (r.audioUri && !old.has(r.id) ? [r.audioUri] : []));
  const gone = oldPictures(ctx.db, scope);
  const pictures = userTables(ctx.db).includes('entry_media')
    ? ctx.db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id).filter((id) => !gone.has(id))
    : [];
  return { recordings, pictures };
}

function deleteIn(db: SqlDb, table: string, col: string, ids: readonly SqlParam[]): void {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const part = ids.slice(i, i + CHUNK);
    db.run(`DELETE FROM ${quote(table)} WHERE ${column(col)} IN (${part.map(() => '?').join(', ')})`, ...part);
  }
}

/**
 * Erase everything, the rows (inside the caller's transaction). With no scope: every row of every table on this phone,
 * read from the schema so a table added later is never missed. With a scope (BL-775): only the rows that existed when
 * the erase began, by the rules on EraseScope. Settings go too, all but the pending mark and its scope, which the caller
 * removes last, and `keepSettings` (an active 18+ stop, store.ts). The schema version stays, so the next open needs no
 * migration.
 */
export function removeEverything({ db }: RepoContext, keepSettings: readonly string[] = [], scope: EraseScope | null = null): void {
  // The Find index is dropped, never row-deleted: deleting the rows of an FTS5 table's shadow tables by hand corrupts it
  // (ADR 0028 D5). The caller (store.ts) drops it first; doing it here too keeps every path that reaches this function safe.
  dropSearchIndex(db);
  const keep = new Set([ERASE_EVERYTHING_SETTING, ERASE_EVERYTHING_SCOPE, ...keepSettings]);
  if (!scope) {
    for (const t of userTables(db)) {
      if (t === 'settings') db.run(`DELETE FROM settings WHERE key NOT IN (${[...keep].map(() => '?').join(', ')})`, ...keep);
      else db.run(`DELETE FROM ${quote(t)}`);
    }
    return;
  }
  // Pictures first: whether one is old reads its owner, which goes below.
  if (userTables(db).includes('entry_media')) deleteIn(db, 'entry_media', 'id', [...oldPictures(db, scope)]);
  const oldDrafts = oldIds(scope, 'drafts') ?? new Set<SqlParam>();
  for (const t of userTables(db)) {
    if (t === 'entry_media') continue;
    const old = oldIds(scope, t);
    if (!old) continue; // made after the erase began: nothing in it is old
    if (t === 'settings') {
      const keys = [...old].filter((k) => typeof k === 'string' && !keep.has(k));
      for (const id of oldDrafts) if (!keep.has(`${DISCARD_FAILURES_PREFIX}${id}`)) keys.push(`${DISCARD_FAILURES_PREFIX}${id}`);
      deleteIn(db, t, 'key', keys);
    } else deleteIn(db, t, identityColumn(db, t), [...old]);
  }
}
