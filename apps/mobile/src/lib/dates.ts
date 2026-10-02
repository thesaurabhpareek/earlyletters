/**
 * One date format everywhere, from the core dateline helper
 * (packages/core/src/age.ts): "Tuesday, 29 September 2026". Screens never
 * call toLocaleDateString or build dates themselves.
 */
import { ageLabel, ageOn, dateline } from '@scribe/core';
import type { Child } from './store';

/** "Tuesday, 29 September 2026" (the date half of the core dateline). */
export function dayDate(iso: string): string {
  return dateline(iso, '', iso).split('. ')[0];
}

/** "29 September 2026", for birthdays and due dates. */
export function longDate(iso: string): string {
  return dayDate(iso).replace(/^[A-Za-z]+, /, '');
}

/**
 * Full letter dateline: "Tuesday, 29 September 2026. Asha is 7 months old."
 * Uses the due date while expecting ("before Asha was born").
 */
export function letterDateline(child: Pick<Child, 'name' | 'birthday' | 'dueDate'>, iso: string): string {
  const anchor = child.birthday ?? child.dueDate;
  return anchor ? dateline(iso, child.name, anchor) : `${dayDate(iso)}.`;
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
