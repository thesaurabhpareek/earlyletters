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
 * - A row first read by paging down (an older page) that was already in the store when this phone last read the book
 *   is never news (`olderPage`): the seen list starts from the first page, so it would wash every letter of theirs on
 *   the page. A row that came into the store after that (the other parent's letter synced in, dated below the floor,
 *   at launch, while another book was on screen or while this one is) is not an older page: its page goes to the
 *   first-seen wash like the whole read did before paging, so it washes once when the reader reaches it, unless it
 *   was seen already. The store's arrivals (`BookArrivals`) say which, from the book's kept mark.
 * - The kept mark only passes a row that came in once that row is held (`keepMark`), so one still unread on a page
 *   below the floor counts as come in at every launch until it is read. With no mark kept (this book's first read),
 *   or one that is 0 or above the newest row, the mark is the newest row now: nothing there washes, and the arrivals
 *   read never starts from 0, which would be the whole table.
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

/** One of a book's rows that came into the store after a mark: its id, its row number and its day. */
export type Arrival = { id: string; row: number; day: string };

/**
 * Which of one book's rows came into the store after a mark (store.bookArrivals). `mark` is the newest row now, read
 * when the first page is; `kept` is the mark this phone kept for the book when it last read it (null for none);
 * `since` lists this book's live rows added after a mark, synced in or kept since.
 */
export type BookArrivals = {
  mark: () => number;
  kept: (childId: string) => number | null;
  since: (childId: string, mark: number) => readonly Arrival[];
};

/**
 * The Book's pages for the book on screen. `first` is the read on focus (one page); `reread` follows a store change
 * without reading past the floor; `more` adds the next page as the reader scrolls to it; `reach` holds down to one
 * day (an arrived letter dated back); `all` holds the whole book for what needs it (the Months sheet and its jump, the
 * Photos lens).
 *
 * The object holds the floor between renders; the screen reads `done` and `holds` while rendering. A call that moves
 * the floor is followed by the setRead that carries its rows, or runs inside a state updater whose result the render
 * reads (watchBook's reread on a child switch calls `first`), so the render that reads `done` sees the floor its rows
 * were read to.
 *
 * Without `arrivals` nothing read below the floor counts as come in since the first page: every such row is an older page.
 */
export function createBookPages(read: RangeRead, size: number = BOOK_PAGE, arrivals?: BookArrivals) {
  let childId: string | null = null;
  let floor: string | null = null;
  let older = new Set<string>();
  /** Rows above this one came in since the book was last read. 0: none are told apart (no arrivals, or an empty store). */
  let mark = 0;
  /** The newest row when the first page was read. */
  let now = 0;
  /** The mark the book may keep now (keepMark), or null when there is none to keep. */
  let keep: number | null = null;
  /** Rows below `above` were not held before this read: an older page, unless they came into the store since the mark. */
  const markOlder = (id: string, rows: readonly Entry[], above: string) => {
    const below = rows.filter((e) => e.occurredOn < above);
    if (below.length === 0) return;
    if (!arrivals || mark <= 0) {
      for (const e of below) older.add(e.id);
      return;
    }
    const came = arrivals.since(id, mark);
    const ids = new Set(came.map((a) => a.id));
    for (const e of below) if (!ids.has(e.id)) older.add(e.id);
    // The mark may pass every row that came in up to `now` and is held, and stops just below the first still unread.
    // A row past `now` (come in during this read) stays above it either way.
    let next = now;
    for (const a of came) if (floor !== null && a.day < floor && a.row <= next) next = a.row - 1;
    keep = next;
  };
  const first = (id: string): Entry[] => {
    // The mark before the read: a row added between the two is held by this page or counts as come in, never lost.
    now = arrivals ? arrivals.mark() : 0;
    const kept = arrivals ? arrivals.kept(id) : null;
    // A kept mark above the newest row is not this store's rows any more (purged, or renumbered by a VACUUM).
    const usable = kept !== null && kept > 0 && kept <= now;
    mark = usable ? kept : now;
    const page = readPage(read, id, null, size);
    childId = id;
    floor = page.floor;
    older = new Set();
    // With the whole book held, or nothing kept to tell apart yet, the book may keep the newest row; otherwise its kept
    // mark stays until a page read shows which rows came in. An empty store keeps nothing: a mark of 0 would make the
    // next read's arrivals the whole table.
    keep = now <= 0 ? null : floor === null || !usable ? now : kept;
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
      markOlder(id, page.entries, above);
      return (held) => [...held.filter((e) => e.occurredOn >= above), ...page.entries];
    },
    /** Holds every day from `day` up (whole days), or null when that day is already held. */
    reach(id: string, day: string): Entry[] | null {
      if (id !== childId || floor === null || floor <= day) return null;
      const above = floor;
      const rows = read(id, { from: day });
      floor = day;
      markOlder(id, rows, above);
      return rows;
    },
    all(id: string): Entry[] {
      const rows = read(id, {});
      if (id === childId && floor !== null) {
        const above = floor;
        floor = null;
        markOlder(id, rows, above);
      } else if (id !== childId) keep = null;
      childId = id;
      floor = null;
      return rows;
    },
    /** Whether the whole of this book is held (the end of the book may show). */
    done: (id: string | null): boolean => id !== null && id === childId && floor === null,
    /** Whether this book's rows from `day` up are held. */
    holds: (id: string, day: string): boolean => id === childId && (floor === null || floor <= day),
    /** Whether this row was first read by paging down and was in the store when the book was last read: never news. */
    olderPage: (entryId: string): boolean => older.has(entryId),
    /**
     * The mark this book may keep now (store.bookArrivals.keep), or null. Kept after the first-seen wash has run on the
     * rows held, so a row it passes has been through the seen list.
     */
    keepMark: (id: string): number | null => (id === childId ? keep : null),
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
