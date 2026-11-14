/**
 * The moment engine (NX-39 v2 R15, BL-859).
 *
 * A pure function from plain {day, cityKey} metadata to "moments": a stretch of
 * days that a parent might want to look back on. Rules-based date-gap
 * clustering and nothing else: no machine learning, no faces, no scenes, no
 * ranking, no weights. Deterministic and explainable: every moment carries
 * reason codes from a closed enum that say which rule made it.
 *
 * Input is metadata only (never file bytes). This file imports nothing and
 * reads no clock, locale, randomness, network or storage; a test checks that.
 * It is not wired to any screen. The index store that persists moments is
 * BL-877; parent decisions (hide, Not now) are applied after this function and
 * never change the rule (R15), see decisions.ts.
 *
 * The rule (RULE_VERSION 1, proposed, tune only on fixtures):
 *  - A day is active if it has at least one item.
 *  - Two neighbouring active days join if they are at most 2 calendar days
 *    apart (a gap of at most 1 empty day) AND they share a city key, or either
 *    has no city key.
 *  - A moment is a maximal chain of joined days. It is kept if it has at least
 *    2 active days or at least 3 items.
 *  - The 50 km rule is dropped; there is no "home" and no "away".
 */

/** Bump when the rule changes. Persisted rows record the version they were built with. */
export const RULE_VERSION = 1;

/** Closed enum. Order here is the order reasons are listed in. */
export const MOMENT_REASONS = Object.freeze(['DAY_RUN', 'SAME_CITY', 'NO_PLACE_JOINED', 'MIN_ITEMS_MET'] as const);
export type MomentReason = (typeof MOMENT_REASONS)[number];

/** One piece of metadata. `day` is `YYYY-MM-DD` in the phone's zone (see dayKeyAt). */
export interface MomentItem {
  readonly day: string;
  readonly cityKey?: string | null;
}

/**
 * What the engine returns, and all it returns: a day range, a city key or
 * null, reasons, the rule version. No count, no id, no time of day (R40).
 *  - DAY_RUN: the moment spans at least 2 active days.
 *  - SAME_CITY: at least one join was made because two days share a city key.
 *  - NO_PLACE_JOINED: at least one join was made because a day had no city key.
 *  - MIN_ITEMS_MET: the moment holds at least 3 items.
 * `cityKey` is set only when exactly one city key appears in the moment.
 */
export interface Moment {
  readonly startDay: string;
  readonly endDay: string;
  readonly cityKey: string | null;
  readonly reasons: readonly MomentReason[];
  readonly ruleVersion: number;
}

const MAX_EMPTY_DAYS_BETWEEN = 1;
const MIN_ACTIVE_DAYS = 2;
const MIN_ITEMS = 3;

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** Days since 1970-01-01 for a proleptic Gregorian date (Hinnant). */
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

function civilFromDays(z0: number): { y: number; m: number; d: number } {
  const z = z0 + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1_460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

const pad = (n: number, w: number) => String(n).padStart(w, '0');
/** The `YYYY-MM-DD` for a day number. */
export function dayFromNumber(n: number): string {
  const { y, m, d } = civilFromDays(n);
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/** A day number (days since 1970-01-01) for a valid `YYYY-MM-DD`, else null. One parser, shared by decisions.ts. */
export function dayNumberOf(day: string): number | null {
  const match = DAY_RE.exec(day);
  if (!match) return null;
  const n = daysFromCivil(Number(match[1]), Number(match[2]), Number(match[3]));
  return dayFromNumber(n) === day ? n : null;
}

/**
 * The one day rule (R5): which calendar day an instant falls on in the phone's
 * zone. The caller passes the zone's UTC offset in minutes in force AT THAT
 * INSTANT (so a DST change or a flight is the caller's offset, not a guess
 * here). A photo near midnight may land on the neighbouring day: an accepted
 * limit, because a card shows a range.
 */
export function dayKeyAt(epochMs: number, utcOffsetMinutes: number): string {
  if (!Number.isFinite(epochMs)) throw new RangeError('dayKeyAt: instant must be a finite number of milliseconds');
  if (!Number.isFinite(utcOffsetMinutes)) throw new RangeError('dayKeyAt: offset must be a finite number of minutes');
  return dayFromNumber(Math.floor((epochMs + utcOffsetMinutes * MS_PER_MINUTE) / MS_PER_DAY));
}

interface DayBucket {
  readonly dayNumber: number;
  items: number;
  readonly cities: Set<string>;
}

function bucketByDay(items: readonly MomentItem[]): DayBucket[] {
  const byDay = new Map<number, DayBucket>();
  for (const it of items) {
    const n = dayNumberOf(it.day);
    if (n === null) continue; // not a day: skipped, never guessed
    let b = byDay.get(n);
    if (!b) {
      b = { dayNumber: n, items: 0, cities: new Set() };
      byDay.set(n, b);
    }
    b.items += 1;
    if (typeof it.cityKey === 'string' && it.cityKey !== '') b.cities.add(it.cityKey);
  }
  return [...byDay.values()].sort((a, b) => a.dayNumber - b.dayNumber);
}

type Join = 'SHARED_CITY' | 'NO_PLACE' | null;

function joinKind(a: DayBucket, b: DayBucket): Join {
  if (b.dayNumber - a.dayNumber > MAX_EMPTY_DAYS_BETWEEN + 1) return null;
  if (a.cities.size === 0 || b.cities.size === 0) return 'NO_PLACE';
  for (const c of a.cities) if (b.cities.has(c)) return 'SHARED_CITY';
  return null;
}

/**
 * Cluster metadata into moments. Same list, same moments, in any order.
 * Throws on a rule version it does not implement, so a stale caller cannot
 * silently get different rules.
 */
export function buildMoments(items: readonly MomentItem[], ruleVersion: number = RULE_VERSION): Moment[] {
  if (ruleVersion !== RULE_VERSION) throw new RangeError(`buildMoments: unsupported rule version ${String(ruleVersion)}`);
  const days = bucketByDay(items);
  const out: Moment[] = [];
  let i = 0;
  while (i < days.length) {
    let j = i;
    let sharedCity = false;
    let noPlace = false;
    while (j + 1 < days.length) {
      const kind = joinKind(days[j]!, days[j + 1]!);
      if (kind === null) break;
      if (kind === 'SHARED_CITY') sharedCity = true;
      else noPlace = true;
      j += 1;
    }
    const run = days.slice(i, j + 1);
    i = j + 1;

    const itemCount = run.reduce((n, d) => n + d.items, 0);
    const spansDays = run.length >= MIN_ACTIVE_DAYS;
    const enoughItems = itemCount >= MIN_ITEMS;
    if (!spansDays && !enoughItems) continue;

    const cities = new Set<string>();
    for (const d of run) for (const c of d.cities) cities.add(c);

    const reasons: MomentReason[] = [];
    if (spansDays) reasons.push('DAY_RUN');
    if (sharedCity) reasons.push('SAME_CITY');
    if (noPlace) reasons.push('NO_PLACE_JOINED');
    if (enoughItems) reasons.push('MIN_ITEMS_MET');

    out.push({
      startDay: dayFromNumber(run[0]!.dayNumber),
      endDay: dayFromNumber(run[run.length - 1]!.dayNumber),
      cityKey: cities.size === 1 ? [...cities][0]! : null,
      reasons,
      ruleVersion,
    });
  }
  return out;
}
