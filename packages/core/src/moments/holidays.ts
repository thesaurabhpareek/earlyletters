/**
 * Civic holidays by date (NS-53 7a.3, RSN-HOLIDAY). A shipped table keyed by region; no network, no inference.
 * The list is PROPOSED (O-33: which list ships, for which regions; US only at launch). Civic days only: religious and
 * cultural days stay parent-ticked (NS-46), and Christmas Day and Columbus or Indigenous Peoples' Day are left out
 * until the founder rules. The names a parent reads live in packages/content; this file holds closed keys only.
 * A date fact, never a claim that it is the parent's holiday. Observed (shifted) dates are not applied.
 */
import { parseIsoDate } from '../age';

export const HOLIDAY_KEYS = Object.freeze([
  'new_years_day',
  'mlk_day',
  'presidents_day',
  'memorial_day',
  'juneteenth',
  'independence_day',
  'labor_day',
  'veterans_day',
  'thanksgiving',
] as const);
export type HolidayKey = (typeof HOLIDAY_KEYS)[number];
export type HolidayRegion = 'US';

type Rule = { key: HolidayKey; m: number; d: number } | { key: HolidayKey; m: number; weekday: number; nth: number | 'last' };

const US: readonly Rule[] = [
  { key: 'new_years_day', m: 1, d: 1 },
  { key: 'mlk_day', m: 1, weekday: 1, nth: 3 },
  { key: 'presidents_day', m: 2, weekday: 1, nth: 3 },
  { key: 'memorial_day', m: 5, weekday: 1, nth: 'last' },
  { key: 'juneteenth', m: 6, d: 19 },
  { key: 'independence_day', m: 7, d: 4 },
  { key: 'labor_day', m: 9, weekday: 1, nth: 1 },
  { key: 'veterans_day', m: 11, d: 11 },
  { key: 'thanksgiving', m: 11, weekday: 4, nth: 4 },
];

const TABLES: Record<HolidayRegion, readonly Rule[]> = { US };

/** Day of month of the nth (or last) given weekday (0 = Sunday) of a month. */
function weekdayDate(y: number, m: number, weekday: number, nth: number | 'last'): number {
  if (nth === 'last') {
    const last = new Date(Date.UTC(y, m, 0));
    return last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7);
  }
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
}

/** The holidays on one local calendar day (YYYY-MM-DD) for a region. No region, no holiday. */
export function holidaysOn(day: string, region: HolidayRegion | null): HolidayKey[] {
  const { y, m, d } = parseIsoDate(day);
  const table = region && Object.hasOwn(TABLES, region) ? TABLES[region] : null;
  if (!table) return [];
  return table
    .filter((r) => r.m === m && ('d' in r ? r.d === d : weekdayDate(y, m, r.weekday, r.nth) === d))
    .map((r) => r.key);
}
