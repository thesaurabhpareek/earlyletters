/**
 * "Letters to {child}" (BL-444 slice 2, D-113, F11 6.2 D step 4): the way into the letters of a book this phone has left.
 * Pure, so test/left-books.logic.test.ts runs it in Node; app/settings/left-book/[id].tsx draws it.
 *
 * Settings home shows one row per left book under Children, only while there is one (none is not a row). The page lists
 * that book's letters with the Book's own cards and opens each in the letter page, read only. Every word is
 * packages/content's (`leftBook.*`), except the book's own name. The screen reads only `listLeftBooks` and
 * `listLeftBookEntries` (store.ts), so another signed-in account, a book joined again and a book hidden by support all
 * read as empty here, by the store's own rules. A left book is no longer pulled: the page says nothing about freshness.
 */
import { leftBookCopy } from '@scribe/content';
import { isQuietMark } from '@/components/book/quiet-day.logic';
import type { Child, Entry } from '@/lib/db/repos';
import { fill } from '@/lib/copy';

export const LEFT_BOOK_PATH = '/settings/left-book/[id]' as const;

export type LeftBookRow = { id: string; title: string; hint: string };

/** Settings home's rows under Children: one per left book, oldest book first (the store's order). */
export function leftBookRows(books: readonly Pick<Child, 'id' | 'name'>[]): LeftBookRow[] {
  return books.map((b) => ({ id: b.id, title: fill(leftBookCopy.title, { child: b.name }), hint: fill(leftBookCopy.rowHint, { child: b.name }) }));
}

export type LeftBookPage = {
  title: string;
  /** The line above the letters; null when there is nothing to show. */
  lead: string | null;
  /** The calm line when there is nothing to show (book not left, nothing to read); null otherwise. */
  empty: string | null;
  child: Child | null;
  /** Letters only, in the store's order (newest first). A quiet-day mark has no page, so it is not here. */
  entries: Entry[];
};

/**
 * The page for one book. `books` is `listLeftBooks()` and `entriesOf` is `listLeftBookEntries`; the id must be one of
 * the books, or nothing is read at all.
 */
export function leftBookPage(books: readonly Child[], id: string, entriesOf: (childId: string) => Entry[]): LeftBookPage {
  const child = books.find((b) => b.id === id) ?? null;
  const entries = child ? entriesOf(child.id).filter((e) => !isQuietMark(e)) : [];
  if (!child || entries.length === 0) return { title: leftBookCopy.emptyTitle, lead: null, empty: leftBookCopy.empty, child: null, entries: [] };
  return { title: fill(leftBookCopy.title, { child: child.name }), lead: fill(leftBookCopy.lead, { child: child.name }), empty: null, child, entries };
}
