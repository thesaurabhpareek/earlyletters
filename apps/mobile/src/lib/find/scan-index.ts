/**
 * The scan that stands in for the index (NS-02-R19, and the substring path of R3). It reads `searchable_letters` for
 * one book and applies the rule in query.ts to each row. It needs no FTS5, no index file and nothing to rebuild, and it
 * returns the same letters as the index on every fixture (test/find-index.test.ts holds the two against each other).
 * It serves when the index is missing, older than the app, failed its check, or the query has no word breaks (CJK).
 */
import type { SqlDb } from '../db/sql';
import { matches, type PreparedQuery } from './query';
import { SEARCH_VIEW } from './sources';

export interface FindRow {
  id: string;
  child_id: string;
  occurred_on: string;
  captured_at: string;
  body: string;
  extra: string;
}

/** Newest first by the letter's own date, as the Book orders its letters (repos/entries.ts listForChild). */
export const ORDER_NEWEST_FIRST = 'ORDER BY v.occurred_on DESC, v.captured_at DESC, v.id DESC';

export function scanSearch(db: SqlDb, q: PreparedQuery, childId: string): FindRow[] {
  if (q.kind === 'none') return [];
  return db
    .all<FindRow>(`SELECT v.id, v.child_id, v.occurred_on, v.captured_at, v.body, v.extra FROM ${SEARCH_VIEW} v WHERE v.child_id = ? ${ORDER_NEWEST_FIRST}`, childId)
    .filter((r) => matches(q, r));
}
