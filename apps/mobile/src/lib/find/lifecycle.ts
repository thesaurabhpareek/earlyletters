/**
 * The Find index and its lifecycle (ADR 0028 D4 and D5; NS-02-R16, R18, R19; design FD-R9).
 *
 * Where: an FTS5 table `letter_search` inside `scribe.db` (one file, one lock, iOS Data Protection covers it, and
 * `secure_delete` is already on), with its own copy of the words in two columns, `body` (the letter's words as kept)
 * and `extra` (the parent-typed label, photo words and place), tokenised by `unicode61 remove_diacritics 2`. A
 * one-row-per-letter map `letter_search_rows (entry_id, row_id)` ties the TEXT key of `entries` to the FTS rowid.
 * It is derived data: never synced, never in the export, never in a backup the app makes (backup/format.ts is an
 * allowlist of what it carries; test/find-lifecycle.test.ts asserts no `letter_search*` name appears in either).
 *
 * One function moves a letter in or out: `reindexLetter`. It reads the letter's current state from the view
 * (sources.ts) and makes the index agree: findable means indexed with the current words, anything else means removed.
 * So delete, hide, seal, made-private-to-others and an empty text all purge, and restore, unhide, open and new words all
 * add again, with no per-transition code to forget. The writers call it in the transaction that writes the letter (repos
 * and the sync merge), so the index and the letter commit together or not at all. `reconcileSearch` does the same for
 * every letter in one pass and is the launch catch-up and the safety net after a book-level change.
 *
 * Off or missing: with no `letter_search` table every function here does nothing, so a build with Find off pays nothing.
 * With the table present the maintenance runs whatever the switch says, so turning Find off never leaves findable
 * words of a deleted letter behind (flag.ts).
 *
 * Physical removal: FTS5 deletes leave markers and the old segment bytes stay until a merge. A removal marks the index
 * dirty; `optimizeIfDue` runs the FTS5 `optimize` command at idle, off the first frame, and clears the mark, so the
 * bytes are gone within 24 hours of the app being used (PROPOSED number, ADR 0028 Q5). If this SQLite supports the
 * FTS5 `secure-delete` option it is switched on at creation. "Not found" is immediate in every case, because queries
 * join the view.
 *
 * Erase everything: `dropSearchIndex` runs before the rows go (store.ts), and `removeEverything` drops the table too,
 * because deleting rows from FTS shadow tables by hand corrupts them. The next launch recreates it empty.
 */
import type { SqlDb } from '../db/sql';
import { ensureSearchView, SEARCH_VIEW } from './sources';

export const SEARCH_TABLE = 'letter_search';
export const SEARCH_ROWS_TABLE = 'letter_search_rows';
/** Settings: when the first removal since the last optimize happened (ISO, L2). */
export const FIND_DIRTY_SETTING = 'find.dirtyAt';
/** Settings: whether the FTS5 secure-delete option was accepted at creation ('1' or '0', L1). */
export const FIND_SECURE_SETTING = 'find.secureDelete';

interface State {
  fts5: boolean | null;
  ready: boolean | null;
  /** A write to the index failed in this process: queries use the scan until the next catch-up rebuilds it. */
  degraded: boolean;
}
const states = new WeakMap<SqlDb, State>();
const stateOf = (db: SqlDb): State => {
  let s = states.get(db);
  if (!s) states.set(db, (s = { fts5: null, ready: null, degraded: false }));
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
  if (s.degraded) return false;
  if (s.ready === null) s.ready = db.get<{ n: number }>(`SELECT 1 AS n FROM sqlite_master WHERE name = '${SEARCH_TABLE}'`) !== null;
  return s.ready;
}

function markDirty(db: SqlDb): void {
  db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', FIND_DIRTY_SETTING, new Date().toISOString());
}

interface ViewRow {
  id: string;
  body: string;
  extra: string;
}

/**
 * Makes the index agree with one letter, now. Call it inside the transaction that wrote the letter. Does nothing when
 * there is no index. Never reads `raw_transcript`, audio or a name: it reads the view.
 */
export function reindexLetter(db: SqlDb, entryId: string): void {
  if (!searchIndexExists(db)) return;
  try {
    reindexLetterStrict(db, entryId);
  } catch {
    // A letter is never lost, or refused, because its index could not be written (NS-02-R19). The view keeps queries
    // honest; the index is untrusted until the next catch-up repairs it.
    stateOf(db).degraded = true;
  }
}

/** As reindexLetter, but lets a failure through. For tests and for the catch-up. */
export function reindexLetterStrict(db: SqlDb, entryId: string): void {
  const want = db.get<ViewRow>(`SELECT id, body, extra FROM ${SEARCH_VIEW} WHERE id = ?`, entryId);
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
 * Brings every letter in line with the view in one pass: removes what is no longer findable, adds and updates the rest,
 * and drops index rows that belong to no letter. Run inside the caller's transaction. Returns how many letters moved.
 * Cheap when nothing changed (one join), so the sync steps and book-level changes call it.
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

function reconcileStrict(db: SqlDb): number {
  const gone = db.all<{ id: string }>(
    `SELECT m.entry_id AS id FROM ${SEARCH_ROWS_TABLE} m LEFT JOIN ${SEARCH_VIEW} v ON v.id = m.entry_id WHERE v.id IS NULL`,
  );
  const todo = db.all<{ id: string }>(
    `SELECT v.id AS id FROM ${SEARCH_VIEW} v
       LEFT JOIN ${SEARCH_ROWS_TABLE} m ON m.entry_id = v.id
       LEFT JOIN ${SEARCH_TABLE} f ON f.rowid = m.row_id
      WHERE m.row_id IS NULL OR f.rowid IS NULL OR f.body IS NOT v.body OR f.extra IS NOT v.extra`,
  );
  for (const r of gone) reindexLetterStrict(db, r.id);
  for (const r of todo) reindexLetterStrict(db, r.id);
  // Index rows that no map row points at (a kill part way through an older build): remove them.
  const orphans = db.all<{ rowid: number }>(`SELECT rowid FROM ${SEARCH_TABLE} WHERE rowid NOT IN (SELECT row_id FROM ${SEARCH_ROWS_TABLE})`);
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
 * Creates the index when it is missing, checks it, and catches it up with the letters. Not a migration: it is
 * recreated empty after Erase everything, must never be able to stop the app opening, and may be absent on a build
 * with Find off. Run off the first frame (store.ts schedules it); in its own transaction. Never throws: where FTS5 is
 * missing, or the index cannot be made, it returns 'unavailable' and Find serves from the scan (scan-index.ts).
 */
export function ensureSearchIndex(db: SqlDb): EnsureResult {
  const s = stateOf(db);
  if (!fts5Available(db)) return 'unavailable';
  try {
    ensureSearchView(db);
    const trusted = !s.degraded;
    s.degraded = false;
    if (!searchIndexExists(db) || !trusted || !integrityOk(db)) {
      // A missing, failed or untrusted index is dropped whole and made again; the catch-up below fills it.
      db.exec(`DROP TABLE IF EXISTS ${SEARCH_TABLE}`);
      db.exec(`DROP TABLE IF EXISTS ${SEARCH_ROWS_TABLE}`);
      db.transaction(() => {
        create(db);
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', FIND_SECURE_SETTING, enableSecureDelete(db) ? '1' : '0');
      });
      s.ready = true;
    }
    db.transaction(() => {
      reconcileStrict(db);
    });
    return 'ready';
  } catch {
    // Nothing here may stop the app. The scan still answers, and the next launch tries again.
    s.ready = null;
    s.degraded = true;
    return 'unavailable';
  }
}

/**
 * Drops the index and its map (Erase everything, ADR 0028 D5 step 3; a build with Find off; a failed check). Safe to
 * repeat. The view stays: it holds no data. Run before `removeEverything`, which would otherwise delete the rows of the
 * FTS shadow tables one by one and corrupt them.
 */
export function dropSearchIndex(db: SqlDb): void {
  db.exec(`DROP TABLE IF EXISTS ${SEARCH_TABLE}`);
  db.exec(`DROP TABLE IF EXISTS ${SEARCH_ROWS_TABLE}`);
  db.run('DELETE FROM settings WHERE key IN (?, ?)', FIND_DIRTY_SETTING, FIND_SECURE_SETTING);
  stateOf(db).ready = false;
}

/** Merges the index's segments so the bytes of removed words are gone from the file. Never throws. */
export function optimizeSearchIndex(db: SqlDb): boolean {
  if (!searchIndexExists(db)) return false;
  try {
    db.exec(`INSERT INTO ${SEARCH_TABLE} (${SEARCH_TABLE}) VALUES ('optimize')`);
    db.run('DELETE FROM settings WHERE key = ?', FIND_DIRTY_SETTING);
    return true;
  } catch {
    return false;
  }
}

/** True when a removal is waiting for its merge. */
export function optimizeDue(db: SqlDb): boolean {
  return db.get<{ n: number }>('SELECT 1 AS n FROM settings WHERE key = ?', FIND_DIRTY_SETTING) !== null;
}

/** At idle: merges when a removal is waiting. Returns whether a merge ran. */
export function optimizeIfDue(db: SqlDb): boolean {
  return searchIndexExists(db) && optimizeDue(db) ? optimizeSearchIndex(db) : false;
}
