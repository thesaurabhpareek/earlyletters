/**
 * What Find reads, and from where (ADR 0028 D4; NS-02-R5, R17).
 *
 * `searchable_letters` is a view over `entries` that holds exactly the letters that may be found right now, with the
 * words as kept (`body`) and the parent-typed extras (`extra`). It is the one definition of "findable": the index is
 * filled from it, the scan reads it, and every query joins it, so a letter that is deleted, hidden, sealed or private to
 * someone else is not found at once, whatever state the index file is in.
 *
 * In (R5): `final_text`; and, from the registered extra sources, the parent-typed Firsts label, the parent-typed words
 * about a photo and the place the parent typed for it. Out, by construction (the view never names them):
 * `raw_transcript`, audio and anything read from audio, a date or place read from a picture, the child's name, any
 * machine tag.
 * Not findable (R17): a quiet-day mark, a spoken letter still waiting for its words, a letter with no words, a letter
 * of a deleted, left or hidden book, a letter another person made private, a deleted letter.
 *
 * Extra sources plug in here. A source whose tables are not on this phone yet (photos arrive with migration 11 of
 * another change) reports `available() === false` and contributes nothing, so Find does not depend on them. When the
 * table appears, the next `ensureSearchIndex` rebuilds the view and the catch-up indexes the extra words.
 */
import type { SqlDb } from '../db/sql';

export interface FindExtraSource {
  id: string;
  /** True when the tables this source reads exist on this phone. */
  available(db: SqlDb): boolean;
  /**
   * A scalar SQL expression over `e` (the `entries` row) giving the parent-typed words, or NULL. Typed words only:
   * never text read from a file or a recording.
   */
  textSql: string;
  /** Optional predicate over `e` that must hold for the letter to be findable (for example, not sealed). */
  visibleSql?: string;
}

function hasColumns(db: SqlDb, table: string, columns: string[]): boolean {
  try {
    const have = new Set(db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((r) => r.name));
    return columns.every((c) => have.has(c));
  } catch {
    return false;
  }
}

/**
 * The words a parent typed for a picture and the place they typed (NS-01-R21, design 02 section 4). Reads
 * `entry_media.photo_text` and `.place` (ADR 0028 D1). Both are typed by the parent; a place read from the file never
 * reaches this table. The row is hidden with its letter because the view requires a live entry.
 */
export const photoTextSource: FindExtraSource = {
  id: 'photo',
  available: (db) => hasColumns(db, 'entry_media', ['entry_id', 'photo_text', 'place']),
  textSql: `(SELECT trim(COALESCE(m.photo_text, '') || ' ' || COALESCE(m.place, '')) FROM entry_media m WHERE m.entry_id = e.id LIMIT 1)`,
};

const registry: FindExtraSource[] = [photoTextSource];

/** Plugs another source in (the Firsts label of NS-06 Part A; the sealed-letter rule of NS-06 Part B). Idempotent by id. */
export function registerFindExtraSource(source: FindExtraSource): void {
  const at = registry.findIndex((s) => s.id === source.id);
  if (at >= 0) registry[at] = source;
  else registry.push(source);
}

/** Tests only: put the registry back to what ships. */
export function resetFindExtraSources(): void {
  registry.length = 0;
  registry.push(photoTextSource);
}

export function activeSources(db: SqlDb): FindExtraSource[] {
  return registry.filter((s) => s.available(db));
}

export const SEARCH_VIEW = 'searchable_letters';

/** The owner of this phone's letters, as the free-letter ledger reads it (sync/outbox.ts SYNC_SETTING.owner). */
const OWNER_KEY = 'sync.ownerId';
/** Per-book delete mark (repos/wipe.ts BOOK_DELETED_PREFIX). */
const BOOK_DELETED_PREFIX = 'book.deletedAt.';

export function searchableViewSql(sources: FindExtraSource[]): string {
  const extra = sources.length
    ? `trim(${sources.map((s) => `COALESCE(${s.textSql}, '')`).join(` || ' ' || `)})`
    : `''`;
  const visible = sources.filter((s) => s.visibleSql).map((s) => `\n    AND (${s.visibleSql})`).join('');
  return `CREATE VIEW ${SEARCH_VIEW} AS
  SELECT e.id AS id, e.child_id AS child_id, e.occurred_on AS occurred_on, e.captured_at AS captured_at,
    e.final_text AS body, ${extra} AS extra
  FROM entries e
  JOIN children c ON c.id = e.child_id
  LEFT JOIN child_member_prefs p ON p.child_id = c.id
  WHERE e.deleted_at IS NULL
    AND e.kind IN ('letter', 'note')
    AND e.transcript_status IS NOT 'waiting'
    AND trim(e.final_text) <> ''
    AND (e.in_book = 1 OR e.author_id IS NULL OR e.author_id = COALESCE((SELECT value FROM settings WHERE key = '${OWNER_KEY}'), ''))
    AND c.server_state NOT IN ('left', 'deleted')
    AND NOT EXISTS (SELECT 1 FROM settings s WHERE s.key = '${BOOK_DELETED_PREFIX}' || c.id)
    AND p.hidden_at IS NULL AND c.hidden_at IS NULL${visible}`;
}

const viewState = new WeakMap<SqlDb, string>();

/**
 * Makes sure the view exists and reflects the sources this phone has now. A view holds no data, so rebuilding it is
 * cheap and is done once per launch (and again if the set of sources changed). Not run inside a transaction by the
 * search path; the writers only call it through `ensureSearchIndex`.
 */
export function ensureSearchView(db: SqlDb): void {
  const sources = activeSources(db);
  const sig = sources.map((s) => s.id).join('|');
  if (viewState.get(db) === sig) return;
  db.exec(`DROP VIEW IF EXISTS ${SEARCH_VIEW}`);
  db.exec(searchableViewSql(sources));
  viewState.set(db, sig);
}

/** Forget what was cached for this connection (after the file is replaced, and in tests). */
export function forgetSearchView(db: SqlDb): void {
  viewState.delete(db);
}
