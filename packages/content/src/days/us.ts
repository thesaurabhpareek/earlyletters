/**
 * US days with a computed rule (BL-1011, step 3.2). Names are data keys; the words live in packages/content once
 * `content` writes them. Civic days only are `publicTitleOk`, hand-listed, never derived (NS-46-R36).
 * Lunar and lunisolar days are not here: any copied-source row ships as `n/r` until counsel answers Q113.
 * Instants for the four seasons are UTC, from the file named in the oracle (UNVERIFIED read).
 */
import type { DayRow } from '@scribe/core';

const base = { precision: 'exact', preTicked: false, tone: 'bright' } as const;
const fed = (id: string, rule: DayRow['rule']): DayRow => ({ ...base, id, nameKey: `day.${id}`, layer: 'civic', publicTitleOk: true, authority: 'us_5usc6103', rule });
const other = (id: string, layer: DayRow['layer'], authority: string, rule: DayRow['rule'], publicTitleOk = false): DayRow =>
  ({ ...base, id, nameKey: `day.${id}`, layer, publicTitleOk, authority, rule });
const wk = (month: number, weekday: number, n: number | 'last') => ({ kind: 'nthWeekday', month, weekday, n }) as const;
const season = (id: string, instants: Record<number, string>) => other(id, 'seasonal', 'usno_seasons', { kind: 'astronomical', instants }, true);

export const US_DAY_ROWS: readonly DayRow[] = [
  fed('new_years_day', { kind: 'fixed', month: 1, day: 1 }),
  fed('mlk_day', wk(1, 1, 3)),
  other('valentines_day', 'family', 'us_common_date', { kind: 'fixed', month: 2, day: 14 }),
  fed('presidents_day', wk(2, 1, 3)),
  other('ash_wednesday', 'tradition', 'computus_gregorian', { kind: 'easter', offsetDays: -46 }),
  other('easter', 'tradition', 'computus_gregorian', { kind: 'easter', offsetDays: 0 }),
  other('mothers_day', 'family', 'us_observance_law', wk(5, 0, 2), true),
  fed('memorial_day', wk(5, 1, 'last')),
  other('fathers_day', 'family', 'us_observance_law', wk(6, 0, 3), true),
  fed('juneteenth', { kind: 'fixed', month: 6, day: 19 }),
  fed('independence_day', { kind: 'fixed', month: 7, day: 4 }),
  fed('labor_day', wk(9, 1, 1)),
  other('halloween', 'seasonal', 'us_common_date', { kind: 'fixed', month: 10, day: 31 }, true),
  fed('veterans_day', { kind: 'fixed', month: 11, day: 11 }),
  fed('thanksgiving', wk(11, 4, 4)),
  other('new_years_eve', 'seasonal', 'us_common_date', { kind: 'fixed', month: 12, day: 31 }, true),
  season('march_equinox', { 2026: '2026-03-20T14:46:00Z', 2027: '2027-03-20T20:25:00Z', 2028: '2028-03-20T02:17:00Z', 2029: '2029-03-20T08:02:00Z', 2030: '2030-03-20T13:52:00Z' }),
  season('june_solstice', { 2026: '2026-06-21T08:24:00Z', 2027: '2027-06-21T14:11:00Z', 2028: '2028-06-20T20:02:00Z', 2029: '2029-06-21T01:48:00Z', 2030: '2030-06-21T07:31:00Z' }),
  season('september_equinox', { 2026: '2026-09-23T00:05:00Z', 2027: '2027-09-23T06:02:00Z', 2028: '2028-09-22T11:45:00Z', 2029: '2029-09-22T17:38:00Z', 2030: '2030-09-22T23:27:00Z' }),
  season('december_solstice', { 2026: '2026-12-21T20:50:00Z', 2027: '2027-12-22T02:42:00Z', 2028: '2028-12-21T08:19:00Z', 2029: '2029-12-21T14:14:00Z', 2030: '2030-12-21T20:09:00Z' }),
];
