/**
 * The Find index and its lifecycle (ADR 0028 D4, D5; NS-02-R16a to R16d, R18, R19, R30, R44). An FTS5 table
 * `letter_search(body, extra)` in `scribe.db` and a map `letter_search_rows(entry_id, row_id)`; derived data, never
 * synced, exported or backed up by the app (R31). `reindexLetter` reads one letter from the view (sources.ts) and makes
 * the index agree, inside the letter's own transaction; `reconcileSearch` does it for every letter. With no table every
 * function here does nothing. A removal marks the index dirty for the idle FTS5 `optimize` (R30); "not found" is
 * immediate anyway, because every query joins the view. Erase everything drops the tables before the rows go: deleting
 * FTS shadow rows by hand corrupts them (ADR 0028 D5). The idle merge and the rebuild in batches: rebuild.ts.
 */
import type { SqlDb } from '../db/sql';
import { ensureSearchView, SEARCH_VIEW } from './sources';

export const SEARCH_TABLE = 'letter_search';
export const SEARCH_ROWS_TABLE = 'letter_search_rows';
/** Settings: when the first removal since the last optimize happened (ISO, L2). */
export const FIND_DIRTY_SETTING = 'find.dirtyAt';
/** Settings: whether the FTS5 secure-delete option was accepted at creation ('1' or '0', L1). */
export const FIND_SECURE_SETTING = 'find.secureDelete';

/**
 * The books whose letters may enter the index on this phone, or null for every book the view holds. The seam for the
 * account layer (BL-961, NS-10-R3, CR-67 AX-12): BL-961 wires its `bookVisibleTo` in through `setIndexableBooks`, so a
 * book of another account is never indexed. Every index write and the catch-up read it; a book that stops being
 * indexable leaves the index at the next write or catch-up.
 */
export type IndexableBooks = (db: SqlDb) => readonly string[] | null;
let indexableBooks: IndexableBooks = () => null;

export function setIndexableBooks(list: IndexableBooks | null): void {
  indexableBooks = list ?? (() => null);
}

export function listIndexableBooks(db: SqlDb): readonly string[] | null {
  return indexableBooks(db);
}

type Where = { sql: string; args: string[] };
/** The indexable books as a condition over `v` (the view). */
function indexableWhere(db: SqlDb): Where {
  const books = listIndexableBooks(db);
  if (books === null) return { sql: '1', args: [] };
  if (books.length === 0) return { sql: '0', args: [] };
  return { sql: `v.child_id IN (${books.map(() => '?').join(', ')})`, args: [...books] };
}

interface State {
  fts5: boolean | null;
  ready: boolean | null;
  /** A write to the index failed in this process: queries use the scan until the next catch-up rebuilds it. */
  degraded: boolean;
  /** A rebuild is under way (rebuild.ts, R35): queries use the scan until it finishes. */
  building: boolean;
}
const states = new WeakMap<SqlDb, State>();
const stateOf = (db: SqlDb): State => {
  let s = states.get(db);
  if (!s) states.set(db, (s = { fts5: null, ready: null, degraded: false, building: false }));
  return s;
};

/** Forget what was cached for this connection (tests, and after the file is replaced). */
export function forgetSearchState(db: SqlDb): void {
  states.delete(db);
}

/** Whether this SQLite was built with FTS5. Probed once with a temporary table that leaves nothing behind. */
export function fts5Available(db: SqlDb): boolean {
  const s = stateOf(db);
  if (s.fts5 !== null) return s.fts5;
  try {
    db.exec('CREATE VIRTUAL TABLE temp.find_fts5_probe USING fts5(x)');
    db.exec('DROP TABLE temp.find_fts5_probe');
    s.fts5 = true;
  } catch {
    s.fts5 = false;
  }
  return s.fts5;
}

/** Whether the index table is on this phone and trusted (a failed write in this process makes it untrusted). */
export function searchIndexExists(db: SqlDb): boolean {
  const s = stateOf(db);
  if (s.degraded || s.building) return false;
  if (s.ready === null) s.ready = tableExists(db);
  return s.ready;
}

const tableExists = (db: SqlDb): boolean => db.get<{ n: number }>(`SELECT 1 AS n FROM sqlite_master WHERE name = '${SEARCH_TABLE}'`) !== null;

function markDirty(db: SqlDb): void {
  db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', FIND_DIRTY_SETTING, new Date().toISOString());
}

/**
 * Makes the index agree with one letter, now, inside the transaction that wrote the letter. Does nothing when there is
 * no index. A failure never loses or refuses the letter (R44): the index is untrusted until the next catch-up.
 */
export function reindexLetter(db: SqlDb, entryId: string): void {
  if (!searchIndexExists(db)) return;
  try {
    reindexOne(db, entryId, indexableWhere(db));
  } catch {
    stateOf(db).degraded = true;
  }
}

function reindexOne(db: SqlDb, entryId: string, w: Where): void {
  const want = db.get<{ body: string; extra: string }>(`SELECT v.body, v.extra FROM ${SEARCH_VIEW} v WHERE v.id = ? AND ${w.sql}`, entryId, ...w.args);
  const have = db.get<{ row_id: number }>(`SELECT row_id FROM ${SEARCH_ROWS_TABLE} WHERE entry_id = ?`, entryId);
  if (!want) {
    if (have) {
      db.run(`DELETE FROM ${SEARCH_TABLE} WHERE rowid = ?`, have.row_id);
      db.run(`DELETE FROM ${SEARCH_ROWS_TABLE} WHERE entry_id = ?`, entryId);
      markDirty(db);
    }
    return;
  }
  if (have) {
    const cur = db.get<{ body: string; extra: string }>(`SELECT body, extra FROM ${SEARCH_TABLE} WHERE rowid = ?`, have.row_id);
    if (cur && cur.body === want.body && cur.extra === want.extra) return;
    if (cur) {
      // The old words leave the index: a removal as far as the file is concerned.
      db.run(`DELETE FROM ${SEARCH_TABLE} WHERE rowid = ?`, have.row_id);
      markDirty(db);
    }
    db.run(`DELETE FROM ${SEARCH_ROWS_TABLE} WHERE entry_id = ?`, entryId);
  }
  db.run(`INSERT INTO ${SEARCH_TABLE} (body, extra) VALUES (?, ?)`, want.body, want.extra);
  const rowId = db.get<{ id: number }>('SELECT last_insert_rowid() AS id')?.id;
  if (rowId === undefined || rowId === null) throw new Error('find_index_rowid');
  db.run(`INSERT INTO ${SEARCH_ROWS_TABLE} (entry_id, row_id) VALUES (?, ?)`, entryId, rowId);
}

/**
 * Brings every letter in line with the view in one pass (removes, adds, updates, and drops index rows no letter owns),
 * inside the caller's transaction. Returns how many moved. Cheap when nothing changed (one join).
 */
export function reconcileSearch(db: SqlDb): number {
  if (!searchIndexExists(db)) return 0;
  try {
    return reconcileStrict(db);
  } catch {
    stateOf(db).degraded = true;
    return 0;
  }
}

/** At most `limit` letters (all with -1) brought in line; each pass re-reads what differs, so it can run in batches. */
function reconcileStrict(db: SqlDb, limit = -1): number {
  const w = indexableWhere(db);
  let left = limit;
  const take = <T>(sql: string, ...args: string[]): T[] => {
    if (left === 0) return [];
    const rows = db.all<T>(`${sql} LIMIT ?`, ...args, left);
    if (left > 0) left -= rows.length;
    return rows;
  };
  const gone = take<{ id: string }>(
    `SELECT m.entry_id AS id FROM ${SEARCH_ROWS_TABLE} m LEFT JOIN ${SEARCH_VIEW} v ON v.id = m.entry_id AND ${w.sql} WHERE v.id IS NULL`,
    ...w.args,
  );
  const todo = take<{ id: string }>(
    `SELECT v.id AS id FROM ${SEARCH_VIEW} v
       LEFT JOIN ${SEARCH_ROWS_TABLE} m ON m.entry_id = v.id
       LEFT JOIN ${SEARCH_TABLE} f ON f.rowid = m.row_id
      WHERE ${w.sql} AND (m.row_id IS NULL OR f.rowid IS NULL OR f.body IS NOT v.body OR f.extra IS NOT v.extra)`,
    ...w.args,
  );
  for (const r of gone) reindexOne(db, r.id, w);
  for (const r of todo) reindexOne(db, r.id, w);
  // Index rows that no map row points at (a kill part way through an older build): remove them.
  const orphans = take<{ rowid: number }>(`SELECT rowid FROM ${SEARCH_TABLE} WHERE rowid NOT IN (SELECT row_id FROM ${SEARCH_ROWS_TABLE})`);
  for (const o of orphans) db.run(`DELETE FROM ${SEARCH_TABLE} WHERE rowid = ?`, o.rowid);
  if (orphans.length > 0) markDirty(db);
  return gone.length + todo.length + orphans.length;
}

function create(db: SqlDb): void {
  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ${SEARCH_TABLE} USING fts5(body, extra, tokenize = 'unicode61 remove_diacritics 2')`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${SEARCH_ROWS_TABLE} (entry_id TEXT PRIMARY KEY NOT NULL, row_id INTEGER NOT NULL UNIQUE)`);
}

/** The FTS5 secure-delete option, where this SQLite has it. Returns whether it was accepted. */
function enableSecureDelete(db: SqlDb): boolean {
  try {
    db.exec(`INSERT INTO ${SEARCH_TABLE} (${SEARCH_TABLE}, rank) VALUES ('secure-delete', 1)`);
    return true;
  } catch {
    return false;
  }
}

function integrityOk(db: SqlDb): boolean {
  try {
    db.exec(`INSERT INTO ${SEARCH_TABLE} (${SEARCH_TABLE}, rank) VALUES ('integrity-check', 0)`);
    return true;
  } catch {
    return false;
  }
}

export type EnsureResult = 'ready' | 'unavailable';

/**
 * Rebuild, step 1: makes the index when it is missing, failed its check or is untrusted, and marks it unusable for
 * queries until `finishRebuild`, so the scan answers meanwhile (R19). False where FTS5 is missing or the index cannot be
 * made. Never throws. Not a migration: it is recreated empty after Erase everything and may be absent with Find off.
 */
export function startRebuild(db: SqlDb): boolean {
  const s = stateOf(db);
  if (!fts5Available(db)) return false;
  try {
    ensureSearchView(db);
    const trusted = !s.degraded;
    s.degraded = false;
    s.building = true;
    if (!tableExists(db) || !trusted || !integrityOk(db)) {
      db.exec(`DROP TABLE IF EXISTS ${SEARCH_TABLE}`);
      db.exec(`DROP TABLE IF EXISTS ${SEARCH_ROWS_TABLE}`);
      db.transaction(() => {
        create(db);
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', FIND_SECURE_SETTING, enableSecureDelete(db) ? '1' : '0');
      });
    }
    return true;
  } catch {
    abandonRebuild(db);
    return false;
  }
}

/** Rebuild, step 2: brings at most `limit` letters in line in one transaction (-1: all). Returns how many moved; 0 is done. */
export function rebuildStep(db: SqlDb, limit: number): number {
  let moved = 0;
  db.transaction(() => {
    moved = reconcileStrict(db, limit);
  });
  return moved;
}

/** Rebuild, step 3: queries may use the index again. */
export function finishRebuild(db: SqlDb): void {
  const s = stateOf(db);
  s.building = false;
  s.ready = true;
}

/** A rebuild that failed: the scan keeps answering and the next catch-up tries again. Nothing here may stop the app. */
export function abandonRebuild(db: SqlDb): void {
  const s = stateOf(db);
  s.building = false;
  s.ready = null;
  s.degraded = true;
}

/** The whole rebuild in one transaction: tests and small books. The app uses rebuildSearchIndex (rebuild.ts, R35). */
export function ensureSearchIndex(db: SqlDb): EnsureResult {
  if (!startRebuild(db)) return 'unavailable';
  try {
    rebuildStep(db, -1);
    finishRebuild(db);
    return 'ready';
  } catch {
    abandonRebuild(db);
    return 'unavailable';
  }
}

/**
 * Drops the index and its map (Erase everything, ADR 0028 D5 step 3; a build with Find off; a failed check). Safe to
 * repeat. The view stays: it holds no data.
 */
export function dropSearchIndex(db: SqlDb): void {
  db.exec(`DROP TABLE IF EXISTS ${SEARCH_TABLE}`);
  db.exec(`DROP TABLE IF EXISTS ${SEARCH_ROWS_TABLE}`);
  db.run('DELETE FROM settings WHERE key IN (?, ?)', FIND_DIRTY_SETTING, FIND_SECURE_SETTING);
  stateOf(db).ready = false;
}
