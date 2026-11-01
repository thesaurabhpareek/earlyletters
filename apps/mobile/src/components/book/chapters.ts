/**
 * The Book's chapters: one per month of age, newest first, each opened by a month opener (EXPERIENCE_PASS S26).
 * Pure and tested (test/book-chapters.test.ts, test/quiet-day-book.test.ts).
 *
 * An opener reads, top to bottom: the kicker ("MONTH", or "THIS MONTH" for the current one, caps by style), the
 * numeral ("7") or the chapter's name ("The first weeks", "Before You"), the line "2 letters · From Mama", and the
 * month's date range ("September 13 to October 12"). The current month is lit, and stands alone with no sentence
 * when it has no letters yet. Nothing here counts what is missing: a quiet day is never counted (D-084), and an
 * empty month says nothing about being empty.
 *
 * VoiceOver never hears the "·" separator: every opener has a spoken label ("2 letters, from Mama").
 */
import { ageOn, chapterOf } from '@scribe/core';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { ageText, dayDate } from '@/lib/dates';
import { provenanceKey, type Provenance } from '@/lib/provenance';
import type { Child, Entry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';
import { isQuietMark, visibleInBook } from './quiet-day.logic';
import { monthDay } from './shelf.logic';

export { monthDay };

type BookEntry = Entry;

export interface Chapter {
  key: string;
  /** Month of age (0 = the first weeks); null = Before You. */
  month: number | null;
  title: string;
  countLine: string;
  fromLine: string;
  data: BookEntry[];
  /** The month the child is in today: its opener is lit. */
  current?: boolean;
  /** "September 13 to October 12" (book.monthRange), or null for Before You. */
  range?: string | null;
}

/** Month-of-age chapter for a date, or null when it falls before birth (or birth is unknown). */
export function monthFor(child: Pick<Child, 'birthday'>, onISO: string): number | null {
  if (!child.birthday) return null;
  if (ageOn(child.birthday, onISO).days < 0) return null;
  return chapterOf(child.birthday, onISO);
}

export function chapterTitle(month: number | null): string {
  if (month === null) return copy.book.beforeYouChapter;
  if (month === 0) return copy.book.chapterNewborn;
  return fill(copy.book.chapterTitle, { month });
}

/** The chapter key for a month of age ('m7'), or 'before'. */
export const chapterKey = (month: number | null): string => (month === null ? 'before' : `m${month}`);

/**
 * "From Mama", or "From Mama and Papa" when both parents wrote that month (book.fromTwo), in the order of each one's
 * first letter in it. Quiet days say nothing about who wrote: there is nothing written.
 */
export function fromLine(entries: readonly BookEntry[], child: Child): string {
  const oldestFirst = [...entries].filter((e) => !isQuietMark(e)).sort(oldestToNewest);
  const authors = [...new Set(oldestFirst.map((e) => authorOf(e, child)))];
  if (authors.length === 0) return '';
  if (authors.length === 2) return fill(copy.book.fromTwo, { a: authors[0], b: authors[1] });
  return fill(copy.book.signature, { signsAs: authors.join(', ') });
}
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const oldestToNewest = (a: BookEntry, b: BookEntry) => cmp(a.occurredOn, b.occurredOn) || cmp(a.capturedAt, b.capturedAt) || cmp(a.id, b.id);

/**
 * Chapters newest first; entries inside newest first (the store already orders them).
 * A quiet-day mark is listed (as a small row) unless that day has a letter; it never enters a
 * count or the "From" line (D-084).
 */
export function groupChapters(entries: BookEntry[], child: Child): Chapter[] {
  const byKey = new Map<string, Chapter>();
  for (const e of visibleInBook(entries)) {
    const month = monthFor(child, e.occurredOn);
    const key = chapterKey(month);
    let ch = byKey.get(key);
    if (!ch) {
      ch = { key, month, title: chapterTitle(month), countLine: '', fromLine: '', data: [] };
      byKey.set(key, ch);
    }
    ch.data.push(e);
  }
  const chapters = [...byKey.values()].sort((a, b) => (b.month ?? -1) - (a.month ?? -1));
  for (const ch of chapters) {
    ch.countLine = countLine(ch.data);
    ch.fromLine = fromLine(ch.data, child);
  }
  return chapters;
}

/** The chapter the child is in today: their month of age, or Before You while they are not born yet. */
export function currentChapterKey(child: Pick<Child, 'birthday'>, todayISO: string): string {
  return chapterKey(monthFor(child, todayISO));
}

/**
 * The Book's chapters: groupChapters, each with its date range, and the current month marked. When the book has
 * letters but none yet this month, the current month opens the book on its own, with no letters and no sentence.
 */
export function bookChapters(entries: BookEntry[], child: Child, todayISO: string, locale?: string): Chapter[] {
  const chapters = groupChapters(entries, child);
  if (chapters.length === 0) return chapters;
  const current = currentChapterKey(child, todayISO);
  if (!chapters.some((c) => c.key === current)) {
    const month = monthFor(child, todayISO);
    // Only a month after every chapter shown can be missing (letters are never dated in the future).
    if ((month ?? -1) > (chapters[0].month ?? -1)) chapters.unshift({ key: current, month, title: chapterTitle(month), countLine: '', fromLine: '', data: [] });
  }
  for (const c of chapters) {
    c.current = c.key === current;
    c.range = monthRange(child, c.month, locale);
  }
  return chapters;
}

/* ------------------------------------------------------------------ */
/* Month openers                                                       */
/* ------------------------------------------------------------------ */

export interface Opener {
  /** "This month" for the current month, "Month" above a numeral, or null (shown in caps by style). */
  kicker: string | null;
  /** "7" in the numeral face, or null for the first weeks and Before You. */
  numeral: string | null;
  /** "The first weeks" or "Before You" in title1, in place of the numeral. */
  name: string | null;
  /** "2 letters · From Mama" as shown, or '' when the month has no letters. */
  line: string;
  /** The same line spoken, never with the separator: "2 letters, from Mama". */
  lineSpoken: string;
  range: string | null;
  /** The whole opener as one VoiceOver header: "This month, Month 7. 2 letters, from Mama. September 13 to October 12". */
  a11yLabel: string;
  lit: boolean;
}

/** A separator line as VoiceOver should hear it: "Month 4 · From Mama" becomes "Month 4, from Mama". */
export function spokenLine(text: string): string {
  return text.replace(/\s+·\s+(\S)/g, (_m, first: string) => `, ${first.toLowerCase()}`);
}

export function openerOf(ch: Chapter): Opener {
  const named = ch.month === null || ch.month === 0;
  const kicker = ch.current ? copy.book.thisMonthLabel : named ? null : copy.book.monthKicker;
  const line = [ch.countLine, ch.fromLine].filter(Boolean).join(' · ');
  const lineSpoken = spokenLine(line);
  const range = ch.range ?? null;
  const heading = ch.current ? `${copy.book.thisMonthLabel}, ${ch.title}` : ch.title;
  return {
    kicker,
    numeral: named ? null : String(ch.month),
    name: named ? ch.title : null,
    line,
    lineSpoken,
    range,
    a11yLabel: [heading, lineSpoken, range].filter(Boolean).join('. '),
    lit: !!ch.current,
  };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const isoOfUTC = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The day a month of age begins: the birthday's day `months` later, clamped to short months (as ageOn counts). */
export function monthStart(birthISO: string, months: number): string {
  const b = parts(birthISO);
  const idx = b.m - 1 + months;
  const y = b.y + Math.floor(idx / 12);
  const m = (((idx % 12) + 12) % 12) + 1;
  const d = Math.min(b.d, daysIn(y, m));
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** The first and last day of a month of age (ISO), or null for Before You or without a birthday. */
export function monthSpan(child: Pick<Child, 'birthday'>, month: number | null): { start: string; end: string } | null {
  if (month === null || !child.birthday) return null;
  const start = monthStart(child.birthday, month);
  const next = monthStart(child.birthday, month + 1);
  const { y, m, d } = parts(next);
  return { start, end: isoOfUTC(Date.UTC(y, m - 1, d) - 864e5) };
}

/** book.monthRange filled with real dates: "September 13 to October 12". Null for Before You. */
export function monthRange(child: Pick<Child, 'birthday'>, month: number | null, locale?: string): string | null {
  const span = monthSpan(child, month);
  return span ? fill(copy.book.monthRange, { a: monthDay(span.start, locale), b: monthDay(span.end, locale) }) : null;
}

/** "3 letters", "1 note", "2 letters and 1 note": only the kinds that exist. Quiet days are never counted; none left gives ''. */
export function countLine(all: BookEntry[]): string {
  const p = pendingCopy.book;
  const entries = all.filter((e) => !isQuietMark(e));
  if (entries.length === 0) return '';
  const letters = entries.filter((e) => e.kind === 'letter').length;
  const notes = entries.length - letters;
  const l = letters === 1 ? p.letterOne : fill(p.letters, { count: letters });
  const n = notes === 1 ? p.noteOne : fill(p.notes, { count: notes });
  if (letters && notes) return fill(p.lettersAndNotes, { letters: l, notes: n });
  return notes ? n : l;
}

/**
 * Card dateline: "Tuesday, September 29, 2026" (one format everywhere, lib/dates). Shown in
 * caps through the Text `caps` style, never .toUpperCase(), so VoiceOver reads words
 * (TDD 09 A11Y-F13). The chapter already names the month of age. The letter page opens on the same line, so the
 * words carried from the card into the page are the same words (P1's card-to-page contract).
 */
export function shortDateline(_child: Child, onISO: string): string {
  return dayDate(onISO);
}

/** Spoken form for VoiceOver: "Tuesday, 29 September 2026, 7 months and 1 week". */
export function datelineA11y(child: Child, onISO: string): string {
  const age = ageText(child, onISO);
  return age ? `${dayDate(onISO)}, ${age}` : dayDate(onISO);
}

/* ------------------------------------------------------------------ */
/* Read together's dateline (S30)                                      */
/* ------------------------------------------------------------------ */

/** "Month 4 · From Mama", "The first weeks · From Mama" or "Before You · From Mama", with its spoken form. */
export function readingDateline(month: number | null, signsAs: string): { text: string; spoken: string } {
  const rt = copy.readTogether;
  const text = month === null ? fill(rt.nowReadingBefore, { signsAs }) : month === 0 ? fill(rt.nowReadingNewborn, { signsAs }) : fill(rt.nowReading, { month, signsAs });
  return { text, spoken: spokenLine(text) };
}

export type { Provenance } from '@/lib/provenance';

export function provenanceOf(e: Entry): Provenance {
  return provenanceKey(e);
}
