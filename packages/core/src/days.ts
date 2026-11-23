/**
 * The calendar engine for library days (BL-1011, NS-46-R1, R12, R24; DL-4). Pure TypeScript, no React Native.
 * Rule dates are computed here (fixed, nth weekday, Easter by the computus, an astronomical instant read in a zone);
 * nothing is copied from a third-party table. A table row ships a date only with an `authority`, otherwise the
 * literal `n/r` (no date written from memory). Names are data keys only: this file holds no words a parent reads.
 * Today is always injected, never read from a clock.
 */
import { parseIsoDate } from './age';

export type DayLayer = 'seasonal' | 'family' | 'civic' | 'tradition' | 'cultureLed' | 'national';
export type DayTone = 'bright' | 'quiet';
export type DayPrecision = 'exact' | 'about';

export type DayRule =
  | { kind: 'fixed'; month: number; day: number }
  | { kind: 'nthWeekday'; month: number; weekday: number; n: number | 'last' } // weekday 0 = Sunday
  | { kind: 'easter'; offsetDays: number }
  | { kind: 'astronomical'; instants: Readonly<Record<number, string>> } // UTC ISO instant per year
  | { kind: 'table'; rows: readonly { year: number; date: string | 'n/r'; authority?: string }[] };

export interface DayRow {
  id: string;
  nameKey: string;
  layer: DayLayer;
  tone: DayTone;
  precision: DayPrecision;
  publicTitleOk: boolean;
  preTicked: false;
  /** A key into the authorities list: who says this date is the date. Required on every row. */
  authority: string;
  rule: DayRule;
}

const iso = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Western (Gregorian) Easter Sunday by the anonymous Gregorian computus (Meeus/Jones/Butcher). */
export function easterSunday(year: number): { m: number; d: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const mm = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * mm + 114) / 31);
  const day = ((h + l - 7 * mm + 114) % 31) + 1;
  return { m: month, d: day };
}

/** Day of month of the nth (or last) weekday (0 = Sunday) of a month. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number | 'last'): number {
  if (n === 'last') {
    const last = new Date(Date.UTC(year, month, 0));
    return last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7);
  }
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}

/** The local calendar date (YYYY-MM-DD) of an instant in an IANA time zone. An unknown zone throws RangeError. */
export function instantToLocalDate(instant: string | number, timeZone: string): string {
  const ms = typeof instant === 'number' ? instant : Date.parse(instant);
  if (!Number.isFinite(ms)) throw new RangeError('invalid_instant');
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ms);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return iso(get('year'), get('month'), get('day'));
}

/** The date of a day in a year, or null when no source covers that year (never a guess, NS-46-R15). */
export function resolveDay(row: DayRow, year: number, timeZone = 'UTC'): { date: string | null; precision: DayPrecision } {
  const r = row.rule;
  let date: string | null = null;
  if (r.kind === 'fixed') date = iso(year, r.month, r.day);
  else if (r.kind === 'nthWeekday') date = iso(year, r.month, nthWeekdayOfMonth(year, r.month, r.weekday, r.n));
  else if (r.kind === 'easter') {
    const e = easterSunday(year);
    date = new Date(Date.UTC(year, e.m - 1, e.d + r.offsetDays)).toISOString().slice(0, 10);
  } else if (r.kind === 'astronomical') {
    const at = r.instants[year];
    date = at ? instantToLocalDate(at, timeZone) : null;
  } else {
    const cell = r.rows.find((x) => x.year === year);
    date = cell && cell.date !== 'n/r' && cell.authority ? cell.date : null;
  }
  return { date, precision: row.precision };
}

/** Rows with no authority, a bad date, preTicked true, or a table date with no authority. Empty means the data may ship. */
export function dayRowProblems(rows: readonly DayRow[], authorities: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) out.push(`${row.id}: duplicate id`);
    seen.add(row.id);
    if (!authorities.has(row.authority)) out.push(`${row.id}: no authority`);
    if ((row.preTicked as boolean) !== false) out.push(`${row.id}: preTicked`);
    if (row.rule.kind === 'table') {
      for (const c of row.rule.rows) {
        if (c.date === 'n/r') continue;
        if (!c.authority || !authorities.has(c.authority)) out.push(`${row.id} ${c.year}: date without authority`);
        try {
          parseIsoDate(c.date);
        } catch {
          out.push(`${row.id} ${c.year}: bad date`);
        }
      }
    }
  }
  return out;
}

/**
 * The October review (NS-46-R24): which table and astronomical rows have no date for the year being read. From 1 October
 * the review reads next year; before it, this year. `today` is injected (YYYY-MM-DD), never the clock.
 */
export function daysDueOn(rows: readonly DayRow[], today: string): { year: number; ids: string[] } {
  const { y, m } = parseIsoDate(today);
  const year = m >= 10 ? y + 1 : y;
  const ids = rows.filter((r) => (r.rule.kind === 'table' || r.rule.kind === 'astronomical') && resolveDay(r, year).date === null).map((r) => r.id);
  return { year, ids };
}
