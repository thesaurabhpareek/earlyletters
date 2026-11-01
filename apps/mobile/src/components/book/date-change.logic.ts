/**
 * Change the date (F09 6.2 step 6, F09-REQ-003, F09-REQ-004; the rules are F04-REQ-015's backdating rules). Pure and
 * tested (test/book-date-change.test.ts); the sheet (date-sheet.tsx) and the letter page only render what this says.
 *
 * - A day: any day from 3 years before the birthday (or the due date while expecting) to today. Never a future day
 *   (F04-U36).
 * - A month (born child only, F04-U37): Before You, The first weeks, and Month 1 to the month the child is in today.
 *   A month stores the first day of that month of age with precision `month`; Before You stores the day before the
 *   birthday (F09 6.3, spec default while Q5 is open).
 * - A month-precision letter never shows a day: its dateline is "Sometime in Month 3", "Sometime in the first weeks"
 *   or "Before You" (F09-REQ-003), on the card and on the page alike (the card-to-page contract: the same words).
 *
 * Nothing here is gated by a plan (F09-REQ-014), and nothing here reads or writes a letter's words.
 */
import { copy, fill } from '@/lib/copy';
import { monthOnlyDateline } from '@/lib/dates';
import type { Child, Entry, OccurredPrecision } from '@/lib/store';
import { chapterKey, chapterTitle, datelineA11y, monthFor, monthStart, shortDateline } from './chapters';

/** How far back a day can go: 3 years before the birthday or due date (F04-REQ-015). */
export const BACKDATE_YEARS = 3;

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}
const pad = (n: number) => String(n).padStart(2, '0');
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** The same calendar day `years` earlier, clamped (29 February becomes 28 February). */
export function yearsBefore(iso: string, years: number): string {
  const { y, m, d } = parts(iso);
  const yy = y - years;
  return `${yy}-${pad(m)}-${pad(Math.min(d, daysIn(yy, m)))}`;
}

/** The calendar day before `iso`. */
export function dayBefore(iso: string): string {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d) - 864e5).toISOString().slice(0, 10);
}

/** The day picker's range: 3 years before the birthday (or due date) to today. */
export function dayBounds(child: Pick<Child, 'birthday' | 'dueDate'>, todayISO: string): { min: string; max: string } {
  const anchor = child.birthday ?? child.dueDate ?? todayISO;
  return { min: yearsBefore(anchor, BACKDATE_YEARS), max: todayISO };
}

/** A day inside the picker's range, so the picker never opens on a day it cannot offer. */
export function clampDay(iso: string, bounds: { min: string; max: string }): string {
  return iso < bounds.min ? bounds.min : iso > bounds.max ? bounds.max : iso;
}

export interface MonthChoice {
  /** 'before', 'm0', 'm1' ... (the Book's chapter keys). */
  key: string;
  /** Month of age; null = Before You. */
  month: number | null;
  /** "Before You", "The first weeks", "Month 3". */
  label: string;
  /** The day stored for this choice. */
  occurredOn: string;
}

/** The day a month choice stores: the first day of that month of age, or the day before the birthday for Before You. */
export function monthChoiceDay(birthday: string, month: number | null): string {
  return month === null ? dayBefore(birthday) : monthStart(birthday, month);
}

/**
 * The month tab's rows, oldest first: Before You, The first weeks, Month 1 to this month. Empty for a child not born
 * yet (the month tab is hidden then, F04-U37).
 */
export function monthChoices(child: Pick<Child, 'birthday'>, todayISO: string): MonthChoice[] {
  if (!child.birthday) return [];
  const current = Math.max(0, monthFor(child, todayISO) ?? 0);
  const months: (number | null)[] = [null];
  for (let m = 0; m <= current; m++) months.push(m);
  return months.map((month) => ({ key: chapterKey(month), month, label: chapterTitle(month), occurredOn: monthChoiceDay(child.birthday!, month) }));
}

/** Whether the month tab shows (born children only). */
export const hasMonthTab = (child: Pick<Child, 'birthday'>): boolean => !!child.birthday;

/** The date the sheet would save: a day, or a month choice. */
export type DatePick = { precision: 'day'; occurredOn: string } | { precision: 'month'; key: string };

/** What a pick stores, or null when it is not a choice the sheet offers (a future day, a month not offered). */
export function resolvePick(child: Pick<Child, 'birthday' | 'dueDate'>, pick: DatePick, todayISO: string): { occurredOn: string; precision: OccurredPrecision } | null {
  if (pick.precision === 'day') {
    const b = dayBounds(child, todayISO);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pick.occurredOn) || pick.occurredOn < b.min || pick.occurredOn > b.max) return null;
    return { occurredOn: pick.occurredOn, precision: 'day' };
  }
  const choice = monthChoices(child, todayISO).find((c) => c.key === pick.key);
  return choice ? { occurredOn: choice.occurredOn, precision: 'month' } : null;
}

/** The pick the sheet opens on: the letter's own date, as a day or as its month. */
export function initialPick(child: Pick<Child, 'birthday'>, entry: Pick<Entry, 'occurredOn' | 'occurredPrecision'>): DatePick {
  if (entry.occurredPrecision === 'month' && child.birthday) return { precision: 'month', key: chapterKey(monthFor(child, entry.occurredOn)) };
  return { precision: 'day', occurredOn: entry.occurredOn };
}

/** True when saving the pick would change nothing (Save stays off). */
export function isUnchanged(entry: Pick<Entry, 'occurredOn' | 'occurredPrecision'>, next: { occurredOn: string; precision: OccurredPrecision } | null): boolean {
  return !next || (next.occurredOn === entry.occurredOn && next.precision === (entry.occurredPrecision ?? 'day'));
}

/** The month-only dateline (F09-REQ-003): one function for the app, the export and Tonight (lib/dates). */
export { monthOnlyDateline };

/** A letter's dateline as shown on its card and its page: the day, or its month only. */
export function entryDateline(child: Child, entry: Pick<Entry, 'occurredOn' | 'occurredPrecision'>): string {
  return entry.occurredPrecision === 'month' ? monthOnlyDateline(child, entry.occurredOn) : shortDateline(child, entry.occurredOn);
}

/** The card's spoken dateline: the day with the age, or the month only (the same words as shown). */
export function entryDatelineA11y(child: Child, entry: Pick<Entry, 'occurredOn' | 'occurredPrecision'>): string {
  return entry.occurredPrecision === 'month' ? monthOnlyDateline(child, entry.occurredOn) : datelineA11y(child, entry.occurredOn);
}

/** The toast after a move: the chapter the letter is in now ("Moved to Month 2."). */
export function movedToast(child: Pick<Child, 'birthday'>, occurredOn: string): string {
  return fill(copy.book.changeDate.movedToast, { label: chapterTitle(monthFor(child, occurredOn)) });
}
