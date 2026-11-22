/**
 * Occasions: the dates we know (NS-53 6.2 S1 to S3, 7a.3). A pure function of a local calendar day, the date of birth,
 * the parent's own marks and a holiday region. Nothing here reads a clock, a library, a place or a picture, and no
 * result holds a word: a `ref` is a local id the screen looks up, so a typed day shows the parent's own words and
 * nothing else. Month and birthday dates follow the reminder planner's rule (clamp to the month's last day, 29 Feb
 * keeps 28 Feb in a common year), so the tab and the reminder agree on the day.
 */
import { ageOn, parseIsoDate } from '../age';
import { reasonRank, type Reason } from './reasons';
import { holidaysOn, type HolidayKey, type HolidayRegion } from './holidays';

/** The occasion reasons this file can give, all members of the shared closed list (reasons.ts, 6.4a). */
export type OccasionReason = Extract<Reason, 'RSN-MARKED' | 'RSN-FIRST' | 'RSN-BIRTHDAY' | 'RSN-MONTHDAY' | 'RSN-HOLIDAY'>;
/** S1 typed day, S2 ticked day, S3 birth dates, H the shipped holiday table (no S number in the spec yet). */
export type OccasionSource = 'S1' | 'S2' | 'S3' | 'H';

export interface MarkedDay {
  /** typed: the parent typed a day (S1). ticked: a chosen Day (S2). first: a first the parent marked (RSN-FIRST). */
  kind: 'typed' | 'ticked' | 'first';
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** Local id of the note, Day or first. Never a word. */
  ref: string;
  /** The parent chose "every year" (default off). A typed day never recurs (NS-53-R19). */
  everyYear?: boolean;
}

export interface OccasionHit {
  reason: OccasionReason;
  source: OccasionSource;
  ref?: string;
  months?: number;
  years?: number;
  holiday?: HolidayKey;
}

export interface OccasionContext {
  /** Date of birth, or null for a book with none. */
  birth: string | null;
  marked: readonly MarkedDay[];
  holidayRegion: HolidayRegion | null;
  /** Holidays the parent switched off one by one. */
  holidaysOff?: readonly HolidayKey[];
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The same calendar day of a later year, 29 Feb falling on 28 Feb in a common year. */
function sameDay(date: string, y: number, m: number, d: number): boolean {
  const t = parseIsoDate(date);
  return t.m === m && Math.min(t.d, daysInMonth(y, t.m)) === d;
}

function markedHits(day: string, marked: readonly MarkedDay[], y: number, m: number, d: number): OccasionHit[] {
  return marked
    .filter((k) => {
      const t = parseIsoDate(k.date);
      if (k.date === day) return true;
      return k.kind !== 'typed' && k.everyYear === true && t.y < y && sameDay(k.date, y, m, d);
    })
    .map((k) => ({ reason: k.kind === 'first' ? ('RSN-FIRST' as const) : ('RSN-MARKED' as const), source: k.kind === 'typed' ? ('S1' as const) : ('S2' as const), ref: k.ref }));
}

/**
 * Every occasion on one local day, in Today-slot order (6.3): typed day, birthday, ticked day or first, month day,
 * holiday. Strongest first. Same-kind marks keep a fixed order (by ref), so two phones with the same book agree.
 */
export function occasionsOn(day: string, ctx: OccasionContext): OccasionHit[] {
  const { y, m, d } = parseIsoDate(day);
  const marks = markedHits(day, [...ctx.marked].sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0)), y, m, d);
  const typed = marks.filter((h) => h.source === 'S1');
  const chosen = marks.filter((h) => h.source === 'S2');

  const birth: OccasionHit[] = [];
  if (ctx.birth) {
    const b = parseIsoDate(ctx.birth);
    const age = ageOn(ctx.birth, day);
    if (age.days > 0 && Math.min(b.d, daysInMonth(y, m)) === d) {
      if (age.months % 12 === 0) birth.push({ reason: 'RSN-BIRTHDAY', source: 'S3', years: age.months / 12 });
      else if (age.months > 0) birth.push({ reason: 'RSN-MONTHDAY', source: 'S3', months: age.months });
    }
  }
  const birthday = birth.filter((h) => h.reason === 'RSN-BIRTHDAY');
  const monthDay = birth.filter((h) => h.reason === 'RSN-MONTHDAY');
  const off = new Set(ctx.holidaysOff ?? []);
  const holidays: OccasionHit[] = holidaysOn(day, ctx.holidayRegion)
    .filter((k) => !off.has(k))
    .map((k) => ({ reason: 'RSN-HOLIDAY', source: 'H', holiday: k }));
  return [...typed, ...birthday, ...chosen, ...monthDay, ...holidays];
}

/** The one reason a card shows, by the shared precedence of reasons.ts (6.4a); the others are not shown and nothing says "and more". */
export function reasonFor(reasons: readonly OccasionReason[]): OccasionReason | null {
  let best: OccasionReason | null = null;
  for (const r of reasons) if (best === null || (reasonRank(r) ?? Infinity) < (reasonRank(best) ?? Infinity)) best = r;
  return best;
}

/** Reasons that read as bright; a hard stretch or a quiet book shows none of them (NS-53-R24). */
export const BRIGHT_REASONS: readonly OccasionReason[] = ['RSN-BIRTHDAY', 'RSN-MONTHDAY', 'RSN-HOLIDAY'];
