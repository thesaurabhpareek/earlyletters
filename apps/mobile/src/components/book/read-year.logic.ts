/**
 * Read the year back (NS-24, BL-947): pure logic for the year rows in Go to a month and for what Read together plays
 * when one is chosen. A year runs from a birthday to the day before the next (R5); Before You is its own year (R5);
 * a due-date-only book has Before You only (R6); the year is decided by `occurredOn`, never `capturedAt` (R7); a year
 * with no letters is not offered (R4). Letters are only what `readableInBook` lets through (private, waiting and
 * quiet-day marks are out; R3). Words are existing keys only: y1 to y5, yN, noName, `beforeYouChapter`.
 */
import { copy, fill } from '@/lib/copy';
import type { Child, Entry } from '@/lib/store';
import { monthDay } from './shelf.logic';
import { readableInBook } from './quiet-day.logic';

export const BEFORE_YEAR = 'before';

/** `EXPO_PUBLIC_READ_THE_YEAR` (proposed flag): off unless it is "1". */
export const readTheYearOn = (env: string | undefined): boolean => env === '1';

type Dated = Pick<Entry, 'kind' | 'inBook' | 'transcriptStatus' | 'occurredOn'>;
type Born = Pick<Child, 'birthday'>;

/** The year key an about-day falls in: 'before' or 'y<n>' (n from 1). */
export function yearKeyOf(child: Born, occurredOn: string): string {
  const b = child.birthday;
  if (!b || occurredOn < b) return BEFORE_YEAR;
  let n = 1;
  while (occurredOn >= monthStart(b, 12 * n)) n += 1;
  return `y${n}`;
}

export interface YearRow {
  key: string;
  /** "Asha's first year", "Before You". */
  label: string;
  /** "September 13 to September 12" (book.monthRange); null for Before You. */
  line: string | null;
  a11yLabel: string;
}

/** "Asha's first year" for years 1 to 5, "Asha's year 6" after, "Year 3" when the book has no name. */
export function yearLabel(key: string, childName: string | null | undefined): string {
  if (key === BEFORE_YEAR) return copy.book.beforeYouChapter;
  const n = Number(key.slice(1));
  const y = copy.book.years;
  const name = (childName ?? '').trim();
  if (!name) return fill(y.noName, { n });
  const keyed = [null, y.y1, y.y2, y.y3, y.y4, y.y5][n];
  return keyed ? fill(keyed, { child: name }) : fill(y.yN, { child: name, n });
}

/**
 * The rows for the Months sheet, newest first like the Book. Only years that have letters (R4). Without a birthday
 * (a due-date-only book) only Before You can exist (R6). A year in progress ends on today (its real end day).
 */
export function yearRows(entries: readonly Dated[], child: Born & Pick<Child, 'name'>, todayISO: string, locale?: string): YearRow[] {
  const keys = new Set(readableInBook(entries).map((e) => yearKeyOf(child, e.occurredOn)));
  const rows = [...keys].sort((a, b) => yearNo(b) - yearNo(a)).map((key): YearRow => {
    const label = yearLabel(key, child.name);
    let line: string | null = null;
    if (key !== BEFORE_YEAR && child.birthday) {
      const n = yearNo(key);
      const start = monthStart(child.birthday, 12 * (n - 1));
      const nextStart = monthStart(child.birthday, 12 * n);
      const end = nextStart > todayISO ? todayISO : dayBefore(nextStart);
      line = fill(copy.book.monthRange, { a: monthDay(start, locale), b: monthDay(end, locale) });
    }
    return { key, label, line, a11yLabel: line ? `${label}. ${line}` : label };
  });
  return rows;
}

/** The letters of one year, oldest first, as Read together plays them. Same filter as the whole book. */
export function lettersInYear<T extends Dated>(entries: readonly T[], child: Born, key: string): T[] {
  return readableInBook(entries).filter((e) => yearKeyOf(child, e.occurredOn) === key);
}

/** The line on the last page of a year: its own for Before You, else the year's filled name. */
export function endOfYearLine(key: string, childName: string | null | undefined): string {
  return key === BEFORE_YEAR ? copy.readTogether.endOfBefore : fill(copy.readTogether.endOfYear, { label: yearLabel(key, childName) });
}

/** The Go to a month hint: the years wording only when year rows exist. */
export const monthsHintFor = (hasYearRows: boolean, plain: string): string => (hasYearRows ? copy.book.monthsHintWithYears : plain);

/** The day year `n` (from 1) begins: the birthday's day `n - 1` years on, clamped for 29 February (as ageOn counts). */
function monthStart(birthISO: string, months: number): string {
  const [by, bm, bd] = birthISO.split('-').map(Number);
  const idx = bm - 1 + months;
  const y = by + Math.floor(idx / 12);
  const m = (((idx % 12) + 12) % 12) + 1;
  const d = Math.min(bd, new Date(Date.UTC(y, m, 0)).getUTCDate());
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const yearNo = (key: string): number => (key === BEFORE_YEAR ? 0 : Number(key.slice(1)));
function dayBefore(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 864e5).toISOString().slice(0, 10);
}
