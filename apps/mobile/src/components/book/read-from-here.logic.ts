/**
 * Read from here (spec 13 section 5, BL-1792, PER3-007): pure logic for where Read together opens. A parent can start at
 * the letter in view or at a month, so a later letter is not many "Next letter" taps away. Reading runs over the whole
 * book, oldest first, opened at the chosen letter: "Back one" still goes earlier, and the hairline and "Letter n of m"
 * count the whole book. Nothing here reads a plan: reading is free on every plan, a lapsed one too (D-082, NS-24-R10).
 */
import type { Child, Entry } from '@/lib/store';
import { readableInBook } from './quiet-day.logic';
import { lettersInYear } from './read-year.logic';

type Playable = Pick<Entry, 'id' | 'kind' | 'inBook' | 'transcriptStatus' | 'occurredOn' | 'capturedAt'>;

export interface ReadTogetherPlan<T> {
  /** What plays, oldest first. */
  letters: T[];
  /** The page it opens on (an index into `letters`). */
  start: number;
}

/**
 * What Read together plays and the page it opens on. `entries` are one book's, newest first, as the store lists them.
 * With the flag on (`yearsOn`, EXPO_PUBLIC_READ_THE_YEAR): a year plays that year alone from its first letter and wins
 * over `from` (the interface never sends both); else the whole book opens at `from`. A `from` that is no longer playable
 * (deleted, made private, words waiting) opens at the first letter and says nothing (RYT-09).
 */
export function readTogetherPlan<T extends Playable>(entries: readonly T[], child: Pick<Child, 'birthday'>, opts: { yearsOn: boolean; year?: string; from?: string }): ReadTogetherPlan<T> {
  if (opts.yearsOn && opts.year) return { letters: lettersInYear(entries, child, opts.year).reverse(), start: 0 };
  const letters = readableInBook(entries).reverse();
  if (!opts.yearsOn || !opts.from) return { letters, start: 0 };
  return { letters, start: Math.max(0, letters.findIndex((e) => e.id === opts.from)) };
}

/**
 * Whether a letter page offers "Read from here": only a letter Read together can play (in the book, with words, not
 * waiting; `readableInBook`), so never on a private or waiting letter (RYT-07). Shown on the other parent's letters
 * too: reading is not an editing control. Not on a letter of a book this phone has left (its Read together is not this book).
 */
export function readsFromLetter(entry: Pick<Entry, 'kind' | 'inBook' | 'transcriptStatus'>, opts: { yearsOn: boolean; leftBook: boolean }): boolean {
  return opts.yearsOn && !opts.leftBook && readableInBook([entry]).length === 1;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Where a month's "Read from here" starts: its first playable letter by about-day, then capture time (then id, the
 * store's last tie-break, so it is the letter Read together lists first). Null when the month has none: no control.
 */
export function monthStart(letters: readonly Playable[]): string | null {
  let first: Playable | null = null;
  for (const e of readableInBook(letters)) {
    if (!first || (cmp(e.occurredOn, first.occurredOn) || cmp(e.capturedAt, first.capturedAt) || cmp(e.id, first.id)) < 0) first = e;
  }
  return first?.id ?? null;
}

/** Each month row's start letter by chapter key; a month with no playable letter is absent. */
export function monthStarts(chapters: readonly { key: string; data: readonly Playable[] }[]): Map<string, string> {
  const starts = new Map<string, string>();
  for (const ch of chapters) {
    const id = monthStart(ch.data);
    if (id) starts.set(ch.key, id);
  }
  return starts;
}
