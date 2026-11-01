/**
 * Date math for the birthday and due-date control (date-field.tsx), kept out of React so it is testable.
 *
 * - The picker's range comes from the same rules as the save check in packages/core (checkBirthday,
 *   checkDueDate), so the calendar never offers a day the form would then refuse.
 * - A calendar day is built at local noon, not midnight, so a daylight-saving change or a phone that
 *   moves time zone while the sheet is up cannot roll it back into the previous day.
 */
import { EARLIEST_BIRTHDAY, latestDueDate } from '@scribe/core';

export type DateKind = 'born' | 'due';
export type DateRange = { min: string; max: string };

/** The days the picker offers: a birthday from EARLIEST_BIRTHDAY up to today; a due date from today to latestDueDate. */
export function dateRange(kind: DateKind, todayISO: string): DateRange {
  return kind === 'born' ? { min: EARLIEST_BIRTHDAY, max: todayISO } : { min: todayISO, max: latestDueDate(todayISO) };
}

/** An ISO calendar day (YYYY-MM-DD) as a local Date at noon. */
export function dateOf(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/**
 * The day inside [min, max] nearest to `iso`. UIDatePicker snaps an out-of-range value on its own, so
 * the sheet starts from the snapped day and "Done" saves exactly the day the person sees.
 */
export function clampISO(iso: string, min?: string, max?: string): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}
