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

/** The day the sheet opens on, worked out fresh on every open: the stored day or the start, inside the range. */
export function sheetStart(value: string | null, startISO: string, min?: string, max?: string): string {
  return clampISO(value ?? startISO, min, max);
}

/**
 * Bounds for the compact picker once a day is stored. It shows the stored day as it is, even when it has left
 * the range (a due date that has gone by): the range widens to include it, because UIDatePicker would otherwise
 * draw the nearest allowed day instead. The save check in packages/core still decides.
 */
export function compactBounds(value: string, min?: string, max?: string): { min?: string; max?: string } {
  return { min: min && value < min ? value : min, max: max && value > max ? value : max };
}

/**
 * Tallest the sheet's scrolling part may be, so Done and Cancel can always be reached at the largest text
 * sizes: the window less the safe areas, the sheet's own top gap (24) and padding (48), and up to two lines of
 * the title2 heading (28 pt a line at 100%) at the current text size.
 */
export function sheetBodyMaxHeight(windowHeight: number, insetTop: number, insetBottom: number, fontScale: number): number {
  const title = 2 * 28 * Math.max(1, fontScale);
  return Math.max(200, Math.floor(windowHeight - insetTop - insetBottom - 24 - 48 - title));
}
