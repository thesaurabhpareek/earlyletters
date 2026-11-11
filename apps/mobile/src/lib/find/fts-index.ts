/**
 * The index query (NS-02-R6, R10). One MATCH over `letter_search`, joined to the map and to `searchable_letters`, so a
 * hit is only ever a letter that is findable right now: a row the index still holds for a letter that has since been
 * deleted, hidden or made private to someone else (a write the index has not seen yet) is filtered by the join.
 * Newest first by the letter's own date; no rank is selected or used, so none can reach the screen (R10).
 */
import type { SqlDb } from '../db/sql';
import { ORDER_NEWEST_FIRST, type FindRow } from './scan-index';
import { ftsMatchString, type PreparedQuery } from './query';
import { SEARCH_ROWS_TABLE, SEARCH_TABLE } from './lifecycle';
import { SEARCH_VIEW } from './sources';

export function ftsSearch(db: SqlDb, q: PreparedQuery & { kind: 'words' }, childId: string): FindRow[] {
  return db.all<FindRow>(
    `SELECT v.id, v.child_id, v.occurred_on, v.captured_at, v.body, v.extra
       FROM ${SEARCH_TABLE} f
       JOIN ${SEARCH_ROWS_TABLE} m ON m.row_id = f.rowid
       JOIN ${SEARCH_VIEW} v ON v.id = m.entry_id
      WHERE ${SEARCH_TABLE} MATCH ? AND v.child_id = ?
      ${ORDER_NEWEST_FIRST}`,
    ftsMatchString(q.terms),
    childId,
  );
}
