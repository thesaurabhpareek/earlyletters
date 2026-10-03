/**
 * One date format everywhere. Day, month and order come from Intl for the
 * device's English locale, so a US phone reads "Tuesday, September 29, 2026"
 * and a UK or Indian phone "Tuesday, 29 September 2026" (TDD 09 L1, A11Y-F20;
 * B-NFR-007). The UI is English only (K-24), so a non-English device locale
 * falls back to the en-GB house style rather than mixing languages.
 * The age sentence still comes from the core dateline helper
 * (packages/core/src/age.ts). Screens never call toLocaleDateString or
 * build dates themselves.
 */
import { ageLabel, ageOn, dateline } from '@scribe/core';
import type { Child } from './store';

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
}

/** The locale used for dates: the device's own when it is English, else en-GB. */
export function dateLocale(locale: string = deviceLocale()): string {
  return /^en(-|$)/i.test(locale) ? locale : 'en-GB';
}

/** Noon UTC on that calendar day, formatted in UTC, so no time zone can shift the date. */
function utcNoon(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(iso: string, weekday: boolean, locale?: string): string {
  const loc = dateLocale(locale);
  const key = `${loc}|${weekday}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(loc, { weekday: weekday ? 'long' : undefined, day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    formatters.set(key, f);
  }
  return f.format(utcNoon(iso));
}

/** "Tuesday, September 29, 2026" (en-US) or "Tuesday, 29 September 2026" (en-GB). */
export function dayDate(iso: string, locale?: string): string {
  return format(iso, true, locale);
}

/** "September 29, 2026" or "29 September 2026", for birthdays and due dates. */
export function longDate(iso: string, locale?: string): string {
  return format(iso, false, locale);
}

/**
 * Full letter dateline: "Tuesday, September 29, 2026. Asha is 7 months old."
 * Uses the due date while expecting ("before Asha was born").
 */
export function letterDateline(child: Pick<Child, 'name' | 'birthday' | 'dueDate'>, iso: string, locale?: string): string {
  const anchor = child.birthday ?? child.dueDate;
  if (!anchor) return `${dayDate(iso, locale)}.`;
  // Core gives "<date>. <Age sentence>."; keep its age sentence, use the locale date.
  const core = dateline(iso, child.name, anchor);
  const cut = core.indexOf('. ');
  return cut < 0 ? `${dayDate(iso, locale)}.` : `${dayDate(iso, locale)}. ${core.slice(cut + 2)}`;
}

/** Short age for capture headers: "7 months and 1 week", or null before birth or without a birthday. */
export function ageText(child: Pick<Child, 'birthday'>, iso: string): string | null {
  if (!child.birthday) return null;
  const age = ageOn(child.birthday, iso);
  return age.days < 0 ? null : ageLabel(age);
}

/** ISO calendar date for a JS Date, local time. */
export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
