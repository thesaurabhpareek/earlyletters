/**
 * Plan reminders on the phone (BL-342, WP-F14-02; PRD F14 section 6.6). The windows are
 * D-022's, checked here against an independent reading of the calendar so a bug in the
 * planner's own time zone code cannot hide itself.
 *
 * The synthetic year opens the app once a day at a different hour in Los Angeles and New
 * York, through both daylight-saving changes and 29 Feb 2028, and checks every notification
 * that would fire.
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_PENDING_PLAN_NOTICES,
  PLAN_NOTICE_ID_PREFIX,
  PLAN_NOTICE_WINDOWS,
  TRIAL_WEEK_MAX_FREE_DAYS,
  freePeriodDays,
  localDateIn,
  pendingPlanNotices,
  planNoticeCard,
  planNoticeDays,
  planNoticeSignature,
  planNotices,
  type PlanNoticeInput,
  type PlanNoticeKind,
  type PlanNoticeSubscription,
  type PlannedPlanNotice,
} from '../src/plan-notices';

const LA = 'America/Los_Angeles';
const NY = 'America/New_York';
const DAY = 86_400_000;
const HOUR = 3_600_000;

// ── An independent reading of the local wall clock (test side) ──────────

function wall(ms: number, tz: string) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), naive: Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) };
}

/** Is `fire` inside [E - earliest, E - latest] under BOTH day readings, and between 09:00 and 20:00 local? */
function inside(n: PlannedPlanNotice, tz: string): string | null {
  const fire = Date.parse(n.fireAt!);
  const local = wall(fire, tz);
  if (local.minutes < 9 * 60 || local.minutes > 20 * 60) return `${n.id} fires at ${local.minutes} min local`;
  if (n.kind === 'anniversary') {
    return local.date === localDateIn(n.periodEnd, tz) ? null : `${n.id} fires on ${local.date}`;
  }
  const spec = PLAN_NOTICE_WINDOWS[n.kind];
  const e = Date.parse(n.periodEnd);
  const off = (o: { days: number; hours?: number }) => o.days * DAY + (o.hours ?? 0) * HOUR;
  // 24-hour reading.
  if (fire < e - off(spec.earliest) || fire > e - off(spec.latest)) return `${n.id} outside the 24-hour window`;
  // Calendar reading: naive wall-clock arithmetic in the zone.
  const eNaive = wall(e, tz).naive;
  if (local.naive < eNaive - off(spec.earliest) || local.naive > eNaive - off(spec.latest)) return `${n.id} outside the calendar window`;
  return null;
}

const sub = (over: Partial<PlanNoticeSubscription> = {}): PlanNoticeSubscription => ({
  ownership: 'purchased',
  state: 'active',
  period: 'year',
  periodEnd: '2027-03-01T17:00:00.000Z',
  willAutoRenew: true,
  freePeriod: null,
  subscribedSince: null,
  ...over,
});
const plan = (s: PlanNoticeSubscription | null, now: string, timeZone = LA) => planNotices({ now, timeZone, subscription: s });
const kinds = (ns: PlannedPlanNotice[]) => ns.map((n) => n.kind);

describe('the windows are F14 6.6 (D-022), kept as data', () => {
  it('match the table, and a free period of 31 days is the short one', () => {
    expect(PLAN_NOTICE_WINDOWS).toEqual({
      trial_week: { earliest: { days: 8 }, latest: { days: 5 }, target: { days: 7 } },
      trial_long: { earliest: { days: 21 }, latest: { days: 16 }, target: { days: 18 } },
      trial_final: { earliest: { days: 5 }, latest: { days: 4 }, target: { days: 4, hours: 12 } },
      annual_renewal_long: { earliest: { days: 31 }, latest: { days: 30 }, target: { days: 30, hours: 12 } },
      annual_renewal_short: { earliest: { days: 8 }, latest: { days: 6 }, target: { days: 7 } },
    });
    expect(TRIAL_WEEK_MAX_FREE_DAYS).toBe(31);
    expect(MAX_PENDING_PLAN_NOTICES).toBe(4);
  });

  it('ids never start with el. (the letter reminder scheduler cancels that prefix)', () => {
    expect(PLAN_NOTICE_ID_PREFIX.startsWith('el.')).toBe(false);
    for (const n of plan(sub(), '2027-01-02T18:00:00Z')) expect(n.id.startsWith(PLAN_NOTICE_ID_PREFIX)).toBe(true);
  });
});

describe('trial reminders', () => {
  it('[C-REQ-025] an annual trial ending at E: one notification in [E-21d, E-16d] and one in [E-5d, E-4d], both 09:00 to 20:00 local', () => {
    const start = '2027-04-10T16:30:00.000Z';
    const E = new Date(Date.parse(start) + 61 * DAY).toISOString();
    const s = sub({ state: 'trial', periodEnd: E, freePeriod: { offerType: 'introductory', days: 61 } });
    const pending = pendingPlanNotices(plan(s, start));
    expect(kinds(pending)).toEqual(['trial_long', 'trial_final']);
    for (const n of pending) expect(inside(n, LA)).toBeNull();
    // Renewal turned off: nothing pending after the next foreground.
    expect(pendingPlanNotices(plan({ ...s, willAutoRenew: false }, '2027-04-20T18:00:00Z'))).toEqual([]);
  });

  it('a monthly trial gets the week notice and the final one; cancel-by is E minus 24 hours', () => {
    const E = '2027-05-31T19:00:00.000Z';
    const s = sub({ state: 'trial', period: 'month', periodEnd: E, freePeriod: { offerType: 'introductory', days: 30 } });
    const ns = plan(s, '2027-05-01T19:00:00Z');
    expect(kinds(ns)).toEqual(['trial_week', 'trial_final']);
    for (const n of ns) {
      expect(n.cancelBy).toBe('2027-05-30T19:00:00.000Z');
      expect(inside(n, LA)).toBeNull();
    }
  });

  it('[F14-REQ-044] notices key on the free period, not the product: a 3-month offer code on the monthly product gets the long windows', () => {
    const E = '2027-09-01T17:00:00.000Z';
    const s = sub({ state: 'trial', period: 'month', periodEnd: E, freePeriod: { offerType: 'code', days: 92 } });
    const ns = plan(s, '2027-06-01T17:00:00Z');
    expect(kinds(ns)).toEqual(['trial_long', 'trial_final']);
    expect(ns.every((n) => n.offerType === 'code')).toBe(true);
    // And a 1-week code on the annual product gets the short ones.
    const short = plan(sub({ state: 'trial', period: 'year', periodEnd: '2027-06-08T17:00:00.000Z', freePeriod: { offerType: 'code', days: 7 } }), '2027-06-01T17:00:00Z');
    expect(kinds(short)).toEqual(['trial_week', 'trial_final']);
  });

  it('31 days is short and 32 days is long', () => {
    const at31 = plan(sub({ state: 'trial', periodEnd: '2027-08-01T17:00:00Z', freePeriod: { offerType: 'introductory', days: 31 } }), '2027-07-01T17:00:00Z');
    const at32 = plan(sub({ state: 'trial', periodEnd: '2027-08-02T17:00:00Z', freePeriod: { offerType: 'introductory', days: 32 } }), '2027-07-01T17:00:00Z');
    expect(kinds(at31)[0]).toBe('trial_week');
    expect(kinds(at32)[0]).toBe('trial_long');
  });

  it('a free period too short for its window: the part of the window after purchase still counts; a window wholly passed is card only', () => {
    // 6-day code bought now: [E-8d, E-5d] closes one day after purchase.
    const now = '2027-06-01T17:00:00.000Z';
    const s = sub({ state: 'trial', periodEnd: new Date(Date.parse(now) + 6 * DAY).toISOString(), freePeriod: { offerType: 'code', days: 6 } });
    const [week, final] = plan(s, now);
    expect(week.fireAt).not.toBeNull();
    expect(inside(week, LA)).toBeNull();
    expect(inside(final, LA)).toBeNull();
    // Opened again after the week window closed: card only for it, the final one still fires.
    const later = plan(s, new Date(Date.parse(now) + 1.5 * DAY).toISOString());
    expect(later[0].fireAt).toBeNull();
    expect(later[1].fireAt).not.toBeNull();
  });

  it('with no free period length known, the product period stands in', () => {
    expect(kinds(plan(sub({ state: 'trial', period: 'year', periodEnd: '2027-08-01T17:00:00Z', freePeriod: { offerType: null, days: null } }), '2027-06-01T17:00:00Z'))).toEqual(['trial_long', 'trial_final']);
    expect(freePeriodDays('2027-06-01T17:00:00Z', '2027-08-01T17:00:00Z')).toBe(61);
    expect(freePeriodDays(null, '2027-08-01T17:00:00Z')).toBeNull();
    expect(freePeriodDays('2027-08-01T17:00:00Z', '2027-06-01T17:00:00Z')).toBeNull();
  });
});

describe('renewal reminders', () => {
  it('[C-REQ-026] an annual renewal on 1 March: notifications inside [29 Jan, 30 Jan] and [21 Feb, 23 Feb]', () => {
    const ns = pendingPlanNotices(plan(sub({ periodEnd: '2027-03-01T17:00:00.000Z' }), '2027-01-02T18:00:00Z'));
    expect(kinds(ns)).toEqual(['annual_renewal_long', 'annual_renewal_short']);
    expect(['2027-01-29', '2027-01-30']).toContain(ns[0].fireLocal!.date);
    expect(['2027-02-21', '2027-02-22', '2027-02-23']).toContain(ns[1].fireLocal!.date);
    for (const n of ns) expect(inside(n, LA)).toBeNull();
  });

  it('[C-REQ-026] monthly plans get the anniversary reminder on the anniversary day, and no renewal notices', () => {
    const s = sub({ period: 'month', periodEnd: '2027-07-15T17:00:00Z', subscribedSince: '2026-07-20T17:00:00Z' });
    const ns = plan(s, '2027-07-01T17:00:00Z');
    expect(kinds(ns)).toEqual(['anniversary']);
    expect(ns[0].fireLocal).toEqual({ date: '2027-07-20', hour: 12, minute: 0 });
    // No start date known: no anniversary, rather than a guessed day.
    expect(plan({ ...s, subscribedSince: null }, '2027-07-01T17:00:00Z')).toEqual([]);
  });

  it('a subscription started on 29 Feb has its anniversary on 28 Feb in other years', () => {
    const ns = plan(sub({ period: 'month', periodEnd: '2029-03-10T17:00:00Z', subscribedSince: '2028-02-29T20:00:00Z' }), '2029-02-01T17:00:00Z');
    expect(ns[0].fireLocal!.date).toBe('2029-02-28');
  });
});

describe('who gets reminders', () => {
  it('[F14-REQ-006] Family Sharing: no plan reminders from that phone', () => {
    expect(plan(sub({ ownership: 'familyShared' }), '2027-01-02T18:00:00Z')).toEqual([]);
  });

  it('[F14-REQ-016] a lapse plans no notification and no card', () => {
    for (const state of ['expired', 'refunded', 'revoked', 'none', 'billing_retry', 'grace'] as const) {
      expect(plan(sub({ state }), '2027-01-02T18:00:00Z')).toEqual([]);
    }
    expect(plan(null, '2027-01-02T18:00:00Z')).toEqual([]);
  });

  it('renewal unknown plans as if it renews; the wording holds either way', () => {
    expect(plan(sub({ willAutoRenew: null }), '2027-01-02T18:00:00Z')).toHaveLength(2);
  });
});

describe('cards, pending cap and letter-reminder days', () => {
  it('[F14-REQ-010] the card shows from the window start until E, whether or not notifications are allowed', () => {
    const E = '2027-08-01T17:00:00.000Z';
    const ns = plan(sub({ state: 'trial', periodEnd: E, freePeriod: { offerType: 'introductory', days: 61 } }), '2027-06-01T17:00:00Z');
    const eighteenBefore = new Date(Date.parse(E) - 18 * DAY).toISOString();
    expect(planNoticeCard(ns, eighteenBefore)?.kind).toBe('trial_long');
    expect(planNoticeCard(ns, new Date(Date.parse(E) - 4.5 * DAY).toISOString())?.kind).toBe('trial_final');
    expect(planNoticeCard(ns, new Date(Date.parse(E) - 30 * DAY).toISOString())).toBeNull();
    expect(planNoticeCard(ns, E)).toBeNull();
    // Dismissed: the next one still shows when its window opens.
    expect(planNoticeCard(ns, eighteenBefore, new Set([ns[0].id]))).toBeNull();
  });

  it('[F14-REQ-008] an annual trial purchase: 2 trial reminders pending; [F13-REQ-015] their days are listed for the letter reminders', () => {
    const now = '2027-06-01T17:00:00.000Z';
    const ns = plan(sub({ state: 'trial', periodEnd: new Date(Date.parse(now) + 61 * DAY).toISOString(), freePeriod: { offerType: 'introductory', days: 61 } }), now);
    const pending = pendingPlanNotices(ns);
    expect(pending).toHaveLength(2);
    expect(planNoticeDays(ns)).toEqual(pending.map((n) => n.fireLocal!.date));
    expect(pendingPlanNotices(ns, 1)).toHaveLength(1);
  });

  it('the same input gives the same signature (a re-plan that changes nothing touches nothing)', () => {
    const a = pendingPlanNotices(plan(sub(), '2027-01-02T18:00:00Z'));
    const b = pendingPlanNotices(plan(sub(), '2027-01-02T18:05:00Z'));
    expect(planNoticeSignature(a)).toBe(planNoticeSignature(b));
  });

  it('an unknown time zone falls back to UTC instead of throwing', () => {
    expect(() => plan(sub(), '2027-01-02T18:00:00Z', 'Not/AZone')).not.toThrow();
    expect(plan(sub(), '2027-01-02T18:00:00Z', 'Not/AZone')).toHaveLength(2);
  });

  it('takes no birthday, child or letter input: nothing about a book can move or silence a plan notice', () => {
    const input: PlanNoticeInput = { now: '2027-01-02T18:00:00Z', timeZone: LA, subscription: sub() };
    expect(Object.keys(input).sort()).toEqual(['now', 'subscription', 'timeZone']);
  });
});

// ── The synthetic year ───────────────────────────────────────────────────

interface Scenario {
  name: string;
  period: 'month' | 'year';
  start: string;
  free: { days: number; offerType: 'introductory' | 'code' } | null;
  cancelAt?: string;
  tz: string;
  expect: PlanNoticeKind[];
}

function addMonthsUtc(ms: number, months: number): number {
  const d = new Date(ms);
  const day = d.getUTCDate();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes()));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(day, last));
  return t.getTime();
}

/** What StoreKit would report at `t` for a scenario. */
function snapshotAt(s: Scenario, t: number): PlanNoticeSubscription | null {
  const start = Date.parse(s.start);
  if (t < start) return null;
  const freeEnd = s.free ? start + s.free.days * DAY : start;
  const step = s.period === 'month' ? 1 : 12;
  let end = s.free ? freeEnd : addMonthsUtc(start, step);
  while (end <= t) end = addMonthsUtc(end, step);
  const cancelled = s.cancelAt !== undefined && t >= Date.parse(s.cancelAt);
  if (cancelled) {
    // The period running at cancellation is the last.
    let lastEnd = s.free ? freeEnd : addMonthsUtc(start, step);
    while (lastEnd <= Date.parse(s.cancelAt!)) lastEnd = addMonthsUtc(lastEnd, step);
    if (t >= lastEnd) return { ownership: 'purchased', state: 'expired', period: s.period, periodEnd: new Date(lastEnd).toISOString(), willAutoRenew: false, freePeriod: null, subscribedSince: s.start };
  }
  const inFree = s.free !== null && t < freeEnd;
  return {
    ownership: 'purchased',
    state: inFree ? 'trial' : 'active',
    period: s.period,
    periodEnd: new Date(end).toISOString(),
    willAutoRenew: !cancelled,
    freePeriod: inFree ? { offerType: s.free!.offerType, days: s.free!.days } : null,
    subscribedSince: s.start,
  };
}

const SCENARIOS: Scenario[] = [
  { name: 'monthly with a 1-month trial (31 days), Los Angeles', period: 'month', start: '2027-06-05T03:30:00Z', free: { days: 31, offerType: 'introductory' }, tz: LA, expect: ['trial_week', 'trial_final', 'anniversary'] },
  { name: 'monthly with a 32-day free period, New York', period: 'month', start: '2027-10-20T14:00:00Z', free: { days: 32, offerType: 'introductory' }, tz: NY, expect: ['trial_long', 'trial_final', 'anniversary'] },
  { name: 'annual with a 2-month trial ending across the November DST change', period: 'year', start: '2027-09-08T16:00:00Z', free: { days: 61, offerType: 'introductory' }, tz: LA, expect: ['trial_long', 'trial_final', 'annual_renewal_long', 'annual_renewal_short'] },
  { name: 'annual paid, renewing on 1 March 2028 (leap year, DST in March)', period: 'year', start: '2027-03-01T17:00:00Z', free: null, tz: LA, expect: ['annual_renewal_long', 'annual_renewal_short'] },
  { name: 'annual paid, renewing on 29 Feb 2028', period: 'year', start: '2027-02-28T18:00:00Z', free: null, tz: NY, expect: ['annual_renewal_long', 'annual_renewal_short'] },
  { name: 'monthly paid from 29 Feb 2028 (anniversary on 28 Feb 2029)', period: 'month', start: '2028-02-29T20:00:00Z', free: null, tz: LA, expect: ['anniversary'] },
  { name: '3-month offer code on monthly, ending across the March DST change', period: 'month', start: '2027-12-12T22:00:00Z', free: { days: 91, offerType: 'code' }, tz: LA, expect: ['trial_long', 'trial_final', 'anniversary'] },
  { name: 'annual trial cancelled in week 2: nothing after the cancel', period: 'year', start: '2027-07-01T17:00:00Z', free: { days: 61, offerType: 'introductory' }, cancelAt: '2027-07-12T17:00:00Z', tz: LA, expect: [] },
];

describe('[PRD-REQ-003] a synthetic year: every reminder lands inside its window', () => {
  for (const s of SCENARIOS) {
    it(s.name, () => {
      const from = Date.parse(s.start) - 2 * DAY;
      const until = Date.parse(s.start) + 430 * DAY; // a year past the longest free period
      const fired = new Map<string, PlannedPlanNotice>();
      let previous: PlannedPlanNotice[] = [];
      let i = 0;
      for (let t = from; t < until; t += DAY + 37 * 60_000, i++) {
        // The app is opened at a different hour each day, sometimes in the small hours.
        const now = t + ((i * 5) % 24) * HOUR;
        // Anything pending from the last open whose time has come has fired.
        for (const n of previous) if (Date.parse(n.fireAt!) <= now) fired.set(n.id, n);
        const snap = snapshotAt(s, now);
        const all = planNotices({ now: new Date(now).toISOString(), timeZone: s.tz, subscription: snap });
        const pending = pendingPlanNotices(all);
        expect(pending.length).toBeLessThanOrEqual(MAX_PENDING_PLAN_NOTICES);
        for (const n of pending) {
          expect(Date.parse(n.fireAt!)).toBeGreaterThan(now);
          expect(inside(n, s.tz)).toBeNull();
        }
        if (snap?.willAutoRenew === false) expect(pending).toEqual([]);
        previous = pending;
      }
      for (const n of fired.values()) expect(inside(n, s.tz)).toBeNull();
      expect([...new Set([...fired.values()].map((n) => n.kind))].sort()).toEqual([...s.expect].sort());
    });
  }
});
