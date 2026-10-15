/**
 * Plan reminders on the phone (BL-342; WP-F14-02; PRD F14 section 6.6, M6).
 * Pure: no clock reads (`now` is an input), no I/O, no StoreKit. The app feeds
 * it what the StoreKit snapshot says and schedules what it returns.
 *
 * The windows are D-022's (the strictest of California, New York, Virginia,
 * Utah and Massachusetts), copied from F14 section 6.6 and docs/emails/CATALOG.md
 * section 7. They are data, so the email scheduler can read the same table.
 * `E` is the end of the free period or of the paid period; the cancel-by
 * moment is `E - 24h`.
 *
 *   Notice                 When                         Target       Hard window
 *   trial_week             free period <= 31 days       E - 7d       [E-8d, E-5d]
 *   trial_long             free period  > 31 days       E - 18d      [E-21d, E-16d]
 *   trial_final            every free period            E - 4d 12h   [E-5d, E-4d]
 *   annual_renewal_long    annual, paid period          E - 30d 12h  [E-31d, E-30d]
 *   annual_renewal_short   annual, paid period          E - 7d       [E-8d, E-6d]
 *   anniversary            monthly, each year           the anniversary day
 *
 * Rules (F14 6.6, "Rules for the phone"):
 *  1. Notices key on the free period and the offer type, never on the product
 *     (R4 PT-10, F14-REQ-044): a 3-month offer code on the monthly product gets
 *     the long windows. The product's period only decides renewal notices.
 *  2. Only the person's own purchase (`purchased`) plans reminders; Family
 *     Sharing never does (F14-REQ-006). Renewal off plans none. A lapse plans
 *     none (F14-REQ-016).
 *  3. A notification fires between 09:00 and 20:00 local, inside its hard
 *     window, never outside it. A window that has passed (or has no such hour
 *     left) shows the in-app card only.
 *  4. "Inside the window" holds under both readings of a day: 24-hour steps and
 *     calendar days in the person's time zone. They differ by an hour across a
 *     daylight-saving change, so the planner uses the overlap of the two.
 *  5. At most MAX_PENDING_PLAN_NOTICES notifications pending (F13-REQ-011).
 *
 * Not decided here: wording (packages/content billingCopy.notices), the price
 * shown, and whether a seen card skips its push (F14-REQ-047, P1, counsel).
 */

/** How the free period was given (StoreKit `Transaction.offerType`). */
export type FreeOfferType = 'introductory' | 'promotional' | 'code';

export type PlanNoticeKind =
  | 'trial_week'
  | 'trial_long'
  | 'trial_final'
  | 'annual_renewal_long'
  | 'annual_renewal_short'
  | 'anniversary';

/** A distance before `E`: whole days plus hours. */
export interface NoticeOffset {
  days: number;
  hours?: number;
}

export interface NoticeWindowSpec {
  /** The window opens this long before E. */
  earliest: NoticeOffset;
  /** The window closes this long before E. */
  latest: NoticeOffset;
  /** The preferred moment, inside the window. */
  target: NoticeOffset;
}

/** The hard windows of F14 6.6 (D-022). Changing a row is a legal change: counsel signs it. */
export const PLAN_NOTICE_WINDOWS: Readonly<Record<Exclude<PlanNoticeKind, 'anniversary'>, NoticeWindowSpec>> = {
  trial_week: { earliest: { days: 8 }, latest: { days: 5 }, target: { days: 7 } },
  trial_long: { earliest: { days: 21 }, latest: { days: 16 }, target: { days: 18 } },
  trial_final: { earliest: { days: 5 }, latest: { days: 4 }, target: { days: 4, hours: 12 } },
  annual_renewal_long: { earliest: { days: 31 }, latest: { days: 30 }, target: { days: 30, hours: 12 } },
  annual_renewal_short: { earliest: { days: 8 }, latest: { days: 6 }, target: { days: 7 } },
};

/** A free period this long or shorter gets the week notice; longer gets the long one (F14 6.6). */
export const TRIAL_WEEK_MAX_FREE_DAYS = 31;

/** Local hours a plan notification may fire: 09:00 to 20:00 (F14 6.6 rule 3). Minutes of the day. */
export const PLAN_NOTICE_HOURS = { earliest: 9 * 60, latest: 20 * 60 } as const;

/** At most this many plan notifications pending at once (F14-REQ-008, F13-REQ-011). */
export const MAX_PENDING_PLAN_NOTICES = 4;

/** Preferred local time on the anniversary day [A]: noon, the middle of the allowed hours. */
export const ANNIVERSARY_TARGET_MINUTES = 12 * 60;

/** How long the anniversary card stays in the app after the day starts [A]. */
export const ANNIVERSARY_CARD_DAYS = 7;

/** Identifier prefix for plan notifications. Never `el.` (the letter reminder scheduler cancels that prefix). */
export const PLAN_NOTICE_ID_PREFIX = 'plan.';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** What the planner needs from the StoreKit snapshot. Dates are ISO instants. */
export interface PlanNoticeSubscription {
  ownership: 'purchased' | 'familyShared';
  /** The engine's state (packages/core plan.ts PlanView['state']). Only trial and active plan notices. */
  state: 'none' | 'trial' | 'active' | 'grace' | 'billing_retry' | 'expired' | 'refunded' | 'revoked';
  /** Billing period of the product: decides renewal notices only. */
  period: 'month' | 'year' | null;
  /** E: when the free period or the current paid period ends. */
  periodEnd: string | null;
  /** false: renewal is off, so nothing is planned. null (unknown) plans as if it renews; the wording holds either way. */
  willAutoRenew: boolean | null;
  /** Set while in a free period. `days` is its length; null when the native module did not say. */
  freePeriod: { offerType: FreeOfferType | null; days: number | null } | null;
  /** When the subscription first started (original purchase), for the anniversary of monthly plans. */
  subscribedSince?: string | null;
}

export interface PlanNoticeInput {
  /** ISO instant. The planner never reads a clock. */
  now: string;
  /** IANA zone of the phone. An unknown zone falls back to UTC. */
  timeZone: string;
  subscription: PlanNoticeSubscription | null;
}

export interface PlannedPlanNotice {
  /** Stable for the same notice and period: `plan.<kind>.<local date of E>`. */
  id: string;
  kind: PlanNoticeKind;
  /** The offer type of the free period, for trial notices. */
  offerType: FreeOfferType | null;
  /** E, the end this notice is about (for the anniversary: the anniversary day start). */
  periodEnd: string;
  /** E - 24h, for trial and renewal notices. */
  cancelBy: string | null;
  /** The hard window, already narrowed to the overlap of both day readings. */
  window: { from: string; to: string };
  /** When the notification fires; null when the window has passed or has no allowed hour left (card only). */
  fireAt: string | null;
  /** The local wall-clock date and time of fireAt (for iOS calendar triggers). */
  fireLocal: { date: string; hour: number; minute: number } | null;
  /** When the in-app card shows: from the window's start until E (anniversary: a week). */
  card: { from: string; until: string };
}

// ── Time zone arithmetic (pure; Intl only) ───────────────────────────────

interface Wall {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function zoneOrUtc(timeZone: string): string {
  if (formatters.has(timeZone)) return timeZone;
  try {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }),
    );
    return timeZone;
  } catch {
    return timeZone === 'UTC' ? 'UTC' : zoneOrUtc('UTC');
  }
}

function wallAt(ms: number, timeZone: string): Wall {
  const parts = formatters.get(zoneOrUtc(timeZone))!.formatToParts(new Date(ms));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hh = n('hour');
  return { y: n('year'), m: n('month'), d: n('day'), hh: hh === 24 ? 0 : hh, mm: n('minute'), ss: n('second') };
}

function offsetMs(ms: number, timeZone: string): number {
  const w = wallAt(ms, timeZone);
  return Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss) - Math.floor(ms / 1000) * 1000;
}

/**
 * The instant a wall-clock time happens in a zone. A skipped time (spring
 * forward) lands just after the gap; a repeated time (autumn) takes the first.
 * 09:00 and 20:00 exist on every day in every zone this app ships in.
 */
function epochOf(w: Omit<Wall, 'ss'> & { ss?: number }, timeZone: string): number {
  const asUtc = Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss ?? 0);
  const first = asUtc - offsetMs(asUtc, timeZone);
  const second = asUtc - offsetMs(first, timeZone);
  return Math.min(first, second);
}

/** Calendar date arithmetic on a wall date (no time zone involved). */
function addDays(w: { y: number; m: number; d: number }, days: number): { y: number; m: number; d: number } {
  const t = new Date(Date.UTC(w.y, w.m - 1, w.d) + days * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function isoDate(w: { y: number; m: number; d: number }): string {
  return `${w.y}-${String(w.m).padStart(2, '0')}-${String(w.d).padStart(2, '0')}`;
}

/** YYYY-MM-DD of an instant in a zone. */
export function localDateIn(iso: string, timeZone: string): string {
  return isoDate(wallAt(Date.parse(iso), timeZone));
}

const offsetMsOf = (o: NoticeOffset) => o.days * DAY_MS + (o.hours ?? 0) * HOUR_MS;

/** E minus an offset read on the local wall clock: calendar days and clock hours. */
function calendarBefore(eMs: number, o: NoticeOffset, timeZone: string): number {
  const w = wallAt(eMs, timeZone);
  const naive = new Date(Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss) - o.days * DAY_MS - (o.hours ?? 0) * HOUR_MS);
  return epochOf(
    { y: naive.getUTCFullYear(), m: naive.getUTCMonth() + 1, d: naive.getUTCDate(), hh: naive.getUTCHours(), mm: naive.getUTCMinutes(), ss: naive.getUTCSeconds() },
    timeZone,
  );
}

/**
 * The hard window of a notice for an end `E`, as instants: the overlap of the
 * 24-hour reading and the calendar-day reading (rule 4). Empty never happens for
 * these specs (each window is at least a day wide); a DST hour narrows it by one hour.
 */
export function noticeWindow(spec: NoticeWindowSpec, periodEnd: string, timeZone: string): { from: number; to: number; target: number } {
  const e = Date.parse(periodEnd);
  const from = Math.max(e - offsetMsOf(spec.earliest), calendarBefore(e, spec.earliest, timeZone));
  const to = Math.min(e - offsetMsOf(spec.latest), calendarBefore(e, spec.latest, timeZone));
  return { from, to, target: e - offsetMsOf(spec.target) };
}

/**
 * The allowed instant nearest the target: inside [from, to], after `now`, and
 * between 09:00 and 20:00 local, on a whole minute. null when there is none.
 */
export function pickFireTime(range: { from: number; to: number; target: number }, nowMs: number, timeZone: string): number | null {
  const lo = Math.max(range.from, nowMs + MINUTE_MS);
  const hi = range.to;
  if (lo > hi) return null;
  let best: number | null = null;
  let day = wallAt(lo, timeZone);
  for (let i = 0; i < 400; i++) {
    const dayStart = epochOf({ y: day.y, m: day.m, d: day.d, hh: Math.floor(PLAN_NOTICE_HOURS.earliest / 60), mm: PLAN_NOTICE_HOURS.earliest % 60 }, timeZone);
    if (dayStart > hi) break;
    const dayEnd = epochOf({ y: day.y, m: day.m, d: day.d, hh: Math.floor(PLAN_NOTICE_HOURS.latest / 60), mm: PLAN_NOTICE_HOURS.latest % 60 }, timeZone);
    const a = Math.ceil(Math.max(lo, dayStart) / MINUTE_MS) * MINUTE_MS;
    const b = Math.floor(Math.min(hi, dayEnd) / MINUTE_MS) * MINUTE_MS;
    if (a <= b) {
      const t = Math.min(Math.max(Math.round(range.target / MINUTE_MS) * MINUTE_MS, a), b);
      if (best === null || Math.abs(t - range.target) < Math.abs(best - range.target)) best = t;
    }
    const next = addDays(day, 1);
    day = { ...day, ...next };
  }
  return best;
}

// ── The plan ─────────────────────────────────────────────────────────────

/** Length of a free period in whole days from its start and end, or null when unknown. */
export function freePeriodDays(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return Math.round((b - a) / DAY_MS);
}

/**
 * Which trial notices a free period gets. Keyed on its length, never the
 * product (rule 1). With no length known, the product's period stands in [A]:
 * a month is short, a year's trial is long. Every free period gets the final one.
 */
export function trialNoticeKinds(free: PlanNoticeSubscription['freePeriod'], period: PlanNoticeSubscription['period']): PlanNoticeKind[] {
  const days = free?.days ?? null;
  const long = days !== null ? days > TRIAL_WEEK_MAX_FREE_DAYS : period === 'year';
  return [long ? 'trial_long' : 'trial_week', 'trial_final'];
}

/** Next anniversary day of `since` on or after today's local date (whole years >= 1). 29 Feb falls on 28 Feb [A]. */
function nextAnniversary(since: string, nowMs: number, timeZone: string): { y: number; m: number; d: number } | null {
  const sMs = Date.parse(since);
  if (!Number.isFinite(sMs)) return null;
  const s = wallAt(sMs, timeZone);
  const today = wallAt(nowMs, timeZone);
  for (let y = Math.max(s.y + 1, today.y); y <= today.y + 1; y++) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const d = s.m === 2 && s.d === 29 && !leap ? 28 : s.d;
    const cand = { y, m: s.m, d };
    if (isoDate(cand) >= isoDate(today)) return cand;
  }
  return null;
}

/**
 * Every plan notice for the current period, with its fire time or null (card
 * only). Sorted by window start. Empty when nothing should remind (rule 2).
 */
export function planNotices(input: PlanNoticeInput): PlannedPlanNotice[] {
  const sub = input.subscription;
  const nowMs = Date.parse(input.now);
  const tz = zoneOrUtc(input.timeZone);
  if (!sub || !Number.isFinite(nowMs)) return [];
  if (sub.ownership !== 'purchased') return [];
  if (sub.state !== 'trial' && sub.state !== 'active') return [];
  if (sub.willAutoRenew === false) return [];

  const out: PlannedPlanNotice[] = [];
  const end = sub.periodEnd && Number.isFinite(Date.parse(sub.periodEnd)) ? sub.periodEnd : null;
  const inFreePeriod = sub.state === 'trial' || sub.freePeriod !== null;

  if (end && Date.parse(end) > nowMs) {
    const eMs = Date.parse(end);
    const kinds: PlanNoticeKind[] = inFreePeriod
      ? trialNoticeKinds(sub.freePeriod, sub.period)
      : sub.period === 'year'
        ? ['annual_renewal_long', 'annual_renewal_short']
        : [];
    for (const kind of kinds) {
      const spec = PLAN_NOTICE_WINDOWS[kind as Exclude<PlanNoticeKind, 'anniversary'>];
      const range = noticeWindow(spec, end, tz);
      if (range.from > range.to) continue;
      const fire = pickFireTime(range, nowMs, tz);
      out.push(noticeOf(kind, inFreePeriod ? (sub.freePeriod?.offerType ?? 'introductory') : null, end, eMs - DAY_MS, range, fire, eMs, tz));
    }
  }

  if (sub.period === 'month' && sub.subscribedSince) {
    const day = nextAnniversary(sub.subscribedSince, nowMs, tz);
    if (day) {
      const from = epochOf({ ...day, hh: 0, mm: 0 }, tz);
      const to = epochOf({ ...addDays(day, 1), hh: 0, mm: 0 }, tz) - MINUTE_MS;
      const target = epochOf({ ...day, hh: Math.floor(ANNIVERSARY_TARGET_MINUTES / 60), mm: ANNIVERSARY_TARGET_MINUTES % 60 }, tz);
      const range = { from, to, target };
      const fire = pickFireTime(range, nowMs, tz);
      const n = noticeOf('anniversary', null, new Date(from).toISOString(), null, range, fire, from + ANNIVERSARY_CARD_DAYS * DAY_MS, tz);
      out.push({ ...n, id: `${PLAN_NOTICE_ID_PREFIX}anniversary.${isoDate(day)}` });
    }
  }

  return out.sort((a, b) => Date.parse(a.window.from) - Date.parse(b.window.from));
}

function noticeOf(
  kind: PlanNoticeKind,
  offerType: FreeOfferType | null,
  periodEnd: string,
  cancelByMs: number | null,
  range: { from: number; to: number },
  fire: number | null,
  cardUntil: number,
  tz: string,
): PlannedPlanNotice {
  const w = fire === null ? null : wallAt(fire, tz);
  return {
    id: `${PLAN_NOTICE_ID_PREFIX}${kind}.${localDateIn(periodEnd, tz)}`,
    kind,
    offerType,
    periodEnd: new Date(Date.parse(periodEnd)).toISOString(),
    cancelBy: cancelByMs === null ? null : new Date(cancelByMs).toISOString(),
    window: { from: new Date(range.from).toISOString(), to: new Date(range.to).toISOString() },
    fireAt: fire === null ? null : new Date(fire).toISOString(),
    fireLocal: w === null ? null : { date: isoDate(w), hour: w.hh, minute: w.mm },
    card: { from: new Date(range.from).toISOString(), until: new Date(cardUntil).toISOString() },
  };
}

/** The notifications to schedule: those with a fire time, soonest first, at most `max` (rule 5). */
export function pendingPlanNotices(plan: readonly PlannedPlanNotice[], max: number = MAX_PENDING_PLAN_NOTICES): PlannedPlanNotice[] {
  return plan
    .filter((n) => n.fireAt !== null)
    .sort((a, b) => Date.parse(a.fireAt!) - Date.parse(b.fireAt!))
    .slice(0, Math.max(0, max));
}

/**
 * The one in-app card to show at `now`, or null: the notice whose card period
 * holds `now` and started last. Shown whether or not notifications are allowed
 * (F14-REQ-010). Cards the person has dismissed (`seen` ids) are skipped.
 */
export function planNoticeCard(plan: readonly PlannedPlanNotice[], now: string, seen: ReadonlySet<string> = new Set()): PlannedPlanNotice | null {
  const t = Date.parse(now);
  let best: PlannedPlanNotice | null = null;
  for (const n of plan) {
    if (seen.has(n.id)) continue;
    if (Date.parse(n.card.from) <= t && t < Date.parse(n.card.until)) {
      if (!best || Date.parse(n.card.from) > Date.parse(best.card.from)) best = n;
    }
  }
  return best;
}

/** Local dates with a pending plan notification, so letter reminders skip those days (F13-REQ-015). */
export function planNoticeDays(plan: readonly PlannedPlanNotice[]): string[] {
  return [...new Set(pendingPlanNotices(plan).map((n) => n.fireLocal!.date))].sort();
}

/** Same plan, same signature: a re-plan that changes nothing touches nothing. */
export function planNoticeSignature(pending: readonly PlannedPlanNotice[]): string {
  return pending.map((n) => `${n.id}@${n.fireAt}`).join('|');
}
