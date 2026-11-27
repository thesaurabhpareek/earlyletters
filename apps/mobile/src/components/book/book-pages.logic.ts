/**
 * The Book reads one chapter of rows at a time (BL-2225; PRD 7.1: a chapter of 60 letters renders within p95 500 ms).
 * Pure and tested (test/book-chapter-paging.test.ts); the store read is passed in.
 *
 * Invariants:
 * - A page holds whole days. The keyset is `occurred_on` alone, and a page that fills up gives back its oldest day
 *   to the next page, so a day's letters and its quiet-day mark are always held together (visibleInBook hides a mark
 *   on a day with words; a split day would show a mark that is not shown once the whole day is held).
 * - `floor` is the oldest day held while older letters may follow, and null once the end of the book is held. A
 *   reread after a store change reads everything from the floor up, so a letter kept, edited, deleted or synced in
 *   that range shows at once and nothing below it is read; with the whole book held it rereads the whole book.
 * - Paging changes what is read, never what a letter shows: the rows are `listForBook`'s rows in its order.
 */
import { chapterKey, monthFor } from './chapters';
import { arrivalOf } from './book.logic';
import type { Child, Entry } from '@/lib/store';

/** Rows in one chapter of the Book's read (PRD 7.1, BL-408, BL-1402's CHAPTER_SIZE). */
export const BOOK_PAGE = 60;

/** The store's ranged read (store.listBookRange): newest first, `before` exclusive, `from` inclusive. */
export type RangeRead = (childId: string, range: { from?: string | null; before?: string | null; limit?: number | null }) => Entry[];

/** One page below `before` (null: from the newest), cut back to whole days. At most `size` rows unless one day holds more. */
export function readPage(read: RangeRead, childId: string, before: string | null, size: number = BOOK_PAGE): { entries: Entry[]; floor: string | null } {
  const rows = read(childId, { before, limit: size });
  if (rows.length < size) return { entries: rows, floor: null };
  const lastDay = rows[rows.length - 1].occurredOn;
  const whole = rows.filter((e) => e.occurredOn !== lastDay);
  if (whole.length > 0) return { entries: whole, floor: whole[whole.length - 1].occurredOn };
  // One day fills the page on its own: that day is read whole, so it is never split.
  return { entries: read(childId, { from: lastDay, before }), floor: lastDay };
}

/**
 * The Book's pages for the book on screen. `first` is the read on focus (one page); `reread` follows a store change
 * without reading past the floor; `more` adds the next page as the reader scrolls to it; `all` holds the whole book
 * for what needs it (the Months sheet and its jump, an arrived letter older than the pages held).
 */
export function createBookPages(read: RangeRead, size: number = BOOK_PAGE) {
  let childId: string | null = null;
  let floor: string | null = null;
  const first = (id: string): Entry[] => {
    const page = readPage(read, id, null, size);
    childId = id;
    floor = page.floor;
    return page.entries;
  };
  return {
    first,
    reread: (id: string): Entry[] => (id === childId ? read(id, { from: floor }) : first(id)),
    /** The held rows with the next page after them, or null when there is nothing more to read for this book. */
    more(id: string, held: readonly Entry[]): Entry[] | null {
      if (id !== childId || floor === null) return null;
      const page = readPage(read, id, floor, size);
      floor = page.floor;
      return [...held, ...page.entries];
    },
    all(id: string): Entry[] {
      childId = id;
      floor = null;
      return read(id, {});
    },
    /** Whether the whole of this book is held (the end of the book may show). */
    done: (id: string | null): boolean => id !== null && id === childId && floor === null,
  };
}

/** What the Book knows of the rows it has not read (store.bookOutline): dates and a flag, never words. */
export type Outline = { firstLetterOn: string | null; lastLetterOn: string | null; readable: boolean };

/**
 * Whether the book has letters in two months or more, from the outline alone: months of age only grow with the date,
 * so the oldest and the newest letter fall in different chapters exactly when two chapters have letters. This is what
 * `showsMonthsButton(monthRows(...))` says of the whole book, without reading it.
 */
export function monthsFromOutline(outline: Outline, child: Pick<Child, 'birthday'>): boolean {
  if (!outline.firstLetterOn || !outline.lastLetterOn) return false;
  return chapterKey(monthFor(child, outline.firstLetterOn)) !== chapterKey(monthFor(child, outline.lastLetterOn));
}

/** A kept letter arrived that is not in the pages held, and more of the book is still to read: hold the rest first. */
export function arrivalNeedsRest(param: string | string[] | undefined, sections: Parameters<typeof arrivalOf>[1], done: boolean): boolean {
  return !done && !!(Array.isArray(param) ? param[0] : param) && arrivalOf(param, sections) === null;
}
