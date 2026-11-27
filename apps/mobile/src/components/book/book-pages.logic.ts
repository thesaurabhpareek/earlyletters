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
 * - A row first read by paging down (an older page) is never news: the first-seen wash is for letters that arrive,
 *   on focus or by a store change, not for a page the reader scrolled to (`olderPage`).
 */
import { arrivalOf } from './book.logic';
import { chapterKey, monthFor } from './chapters';
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
 * without reading past the floor; `more` adds the next page as the reader scrolls to it; `reach` holds down to one
 * day (an arrived letter dated back); `all` holds the whole book for what needs it (the Months sheet and its jump, the
 * Photos lens).
 *
 * The object holds the floor between renders; the screen reads `done` and `holds` while rendering, so every call that
 * moves the floor is made outside a state updater and is followed by the setRead that carries its rows.
 */
export function createBookPages(read: RangeRead, size: number = BOOK_PAGE) {
  let childId: string | null = null;
  let floor: string | null = null;
  let older = new Set<string>();
  /** Rows below `above` were not held before this read: they are an older page. */
  const markOlder = (rows: readonly Entry[], above: string) => {
    for (const e of rows) if (e.occurredOn < above) older.add(e.id);
  };
  const first = (id: string): Entry[] => {
    const page = readPage(read, id, null, size);
    childId = id;
    floor = page.floor;
    older = new Set();
    return page.entries;
  };
  return {
    first,
    reread: (id: string): Entry[] => (id === childId ? read(id, { from: floor }) : first(id)),
    /**
     * Reads the next page and returns how to add it to the rows held, or null when there is nothing more to read for
     * this book. The join is a pure function of what is held when React applies it: rows below the old floor are
     * dropped before the page goes on, so a reread applied in between (which already read from the new floor) never
     * doubles a row, and a store change queued in the same tick is not lost.
     */
    more(id: string): ((held: readonly Entry[]) => Entry[]) | null {
      if (id !== childId || floor === null) return null;
      const above = floor;
      const page = readPage(read, id, above, size);
      floor = page.floor;
      markOlder(page.entries, above);
      return (held) => [...held.filter((e) => e.occurredOn >= above), ...page.entries];
    },
    /** Holds every day from `day` up (whole days), or null when that day is already held. */
    reach(id: string, day: string): Entry[] | null {
      if (id !== childId || floor === null || floor <= day) return null;
      const above = floor;
      const rows = read(id, { from: day });
      floor = day;
      markOlder(rows, above);
      return rows;
    },
    all(id: string): Entry[] {
      const rows = read(id, {});
      if (id === childId && floor !== null) markOlder(rows, floor);
      childId = id;
      floor = null;
      return rows;
    },
    /** Whether the whole of this book is held (the end of the book may show). */
    done: (id: string | null): boolean => id !== null && id === childId && floor === null,
    /** Whether this book's rows from `day` up are held. */
    holds: (id: string, day: string): boolean => id === childId && (floor === null || floor <= day),
    /** Whether this row was first read by paging down, not on focus or by a store change. */
    olderPage: (entryId: string): boolean => older.has(entryId),
  };
}

export type BookPages = ReturnType<typeof createBookPages>;

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

/**
 * The day the Book has to hold down to before it can find an arrived letter (5.8 row 5): the letter's own day, when
 * the letter is this book's, is not in the sections shown, and its day is not held yet (a letter dated back). Null
 * when nothing more needs reading: no param, the card is shown, the letter is another book's or gone, or its day is
 * held already (a quiet-day mark hidden by a letter that day), so the arrival gate can run and clear the param.
 */
export function arrivalReach(o: {
  param: string | string[] | undefined;
  sections: Parameters<typeof arrivalOf>[1];
  childId: string;
  lookup: (id: string) => Pick<Entry, 'childId' | 'occurredOn'> | null;
  holds: (day: string) => boolean;
}): string | null {
  const id = Array.isArray(o.param) ? o.param[0] : o.param;
  if (!id || arrivalOf(id, o.sections) !== null) return null;
  const letter = o.lookup(id);
  if (!letter || letter.childId !== o.childId || o.holds(letter.occurredOn)) return null;
  return letter.occurredOn;
}
