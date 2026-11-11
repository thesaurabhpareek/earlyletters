/**
 * Find, the service the screen calls (NS-02). Read only: it writes nothing to a letter, sends nothing anywhere and
 * remembers nothing; the query lives in the caller's state and is gone when the Book is left (R14). No network (R22),
 * no log, no analytics (R15): this file imports none of them.
 *
 * Path: a words query uses the index when it is there and healthy, otherwise the scan; a query with no word breaks
 * (Han, Hiragana, Katakana, Hangul) always uses the scan's substring rule (R3). Both give the same letters in the same
 * order (R19). A failing index query drops the index (it is rebuilt at the next idle catch-up) and answers from the scan.
 */
import type { SqlDb } from '../db/sql';
import { ftsSearch } from './fts-index';
import { dropSearchIndex, searchIndexExists } from './lifecycle';
import { prepareQuery, snippetSource, type PreparedQuery } from './query';
import { scanSearch, type FindRow } from './scan-index';
import { ensureSearchView } from './sources';
import { excerpt, type Excerpt } from './snippet';

export interface FindHit {
  id: string;
  occurredOn: string;
  capturedAt: string;
  /** Where the quoted words come from: the letter, or the typed photo words or place when those hold the match (R5). */
  source: 'body' | 'extra';
  /** A contiguous slice of the parent's own words that holds the match (R9). */
  excerpt: Excerpt;
}

export type FindResult =
  /** Nothing asked yet (fewer than three characters, or only spaces): the screen shows its idle line and changes nothing. */
  | { status: 'idle' }
  | { status: 'done'; hits: FindHit[]; path: 'index' | 'scan' };

function toHit(q: PreparedQuery, r: FindRow): FindHit {
  const source = snippetSource(q, r);
  return { id: r.id, occurredOn: r.occurred_on, capturedAt: r.captured_at, source, excerpt: excerpt(q, source === 'body' ? r.body : r.extra) };
}

/** Looks for the query in one book's findable letters, newest first. Throws only if even the scan cannot read. */
export function searchLetters(db: SqlDb, raw: string, childId: string): FindResult {
  const q = prepareQuery(raw);
  if (q.kind === 'none') return { status: 'idle' };
  ensureSearchView(db);
  if (q.kind === 'words' && searchIndexExists(db)) {
    try {
      return { status: 'done', hits: ftsSearch(db, q, childId).map((r) => toHit(q, r)), path: 'index' };
    } catch {
      dropSearchIndex(db); // the idle catch-up makes it again; this answer comes from the scan
    }
  }
  return { status: 'done', hits: scanSearch(db, q, childId).map((r) => toHit(q, r)), path: 'scan' };
}
