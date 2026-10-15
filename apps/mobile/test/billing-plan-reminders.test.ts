/**
 * Plan reminders (G-15; Q-003 memo section 5; LEGAL-REQ-047; decision of 15
 * Oct 2026: they ship in v1.0, as a courtesy): the pure planner, the in-app
 * note and the purchase confirmation. Ported from auto/2026-10-05-fixes
 * (d1cbddb); the price lines are gone (D-083: no price in app copy). Clock and time zone
 * are inputs, so DST, time zones, trial lengths, monthly vs annual, the
 * Family Sharing exclusion and edge days are checked here; delivery itself is
 * checked on a device (report).
 */
import { billingCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import type { NativeEntitlementSnapshot } from '../modules/scribe-store/types';
import { planFromSnapshot, sanitizeSnapshot } from '../src/lib/billing/plan.logic';
import {
  activePlanNote,
  CANCEL_LEAD_MS,
  DAY_MS,
  LONG_TRIAL_DAYS,
  MAX_PLAN_NOTIFICATIONS,
  noteLines,
  offsetKinds,
  pickSlot,
  PLAN_ID_PREFIX,
  PLAN_REMINDER_RULES,
  planPlanReminders,
  planReminderSignature,
  purchaseConfirmation,
  remindersApply,
  reminderWindows,
  subjectOf,
  trialDays,
  type PlannedPlanReminder,
  type PlanReminderSubject,
} from '../src/lib/billing/plan-reminders.logic';
import { DEFAULT_WINDOW, isQuietTime } from '../src/lib/reminders/planner';
import { zonedParts } from '../src/lib/reminders/tz';

const HOUR = 3_600_000;
const ZONES = ['UTC', 'America/Los_Angeles', 'America/New_York', 'Asia/Kolkata', 'Pacific/Auckland', 'America/St_Johns', 'Pacific/Kiritimati', 'Europe/London', 'Australia/Lord_Howe'];
const words = billingCopy.reminders;
const iso = (t: number) => new Date(t).toISOString();

function subject(over: Partial<PlanReminderSubject> = {}): PlanReminderSubject {
  return {
    productId: 'plus.annual',
    period: 'year',
    ownership: 'purchased',
    status: 'active',
    willAutoRenew: true,
    periodEnd: '2027-03-01T00:00:00.000Z',
    purchasedAt: '2026-03-01T00:00:00.000Z',
    originalPurchasedAt: '2026-03-01T00:00:00.000Z',
    ...over,
  };
}

/** A trial that started `days` days before E. */
function trial(days: number, end: string, period: 'month' | 'year', over: Partial<PlanReminderSubject> = {}): PlanReminderSubject {
  const e = Date.parse(end);
  const start = iso(e - days * DAY_MS);
  return subject({ status: 'trial', period, productId: period === 'year' ? 'plus.annual' : 'plus.monthly', periodEnd: end, purchasedAt: start, originalPurchasedAt: start, ...over });
}

function plan(s: PlanReminderSubject, now: number, timeZone = 'UTC'): PlannedPlanReminder[] {
  return planPlanReminders({ now, timeZone, subject: s, words });
}

/** Every planned reminder obeys the rules, whatever the inputs. */
function expectInvariants(list: PlannedPlanReminder[], s: PlanReminderSubject, now: number, timeZone: string): void {
  const end = Date.parse(s.periodEnd!);
  expect(list.length).toBeLessThanOrEqual(MAX_PLAN_NOTIFICATIONS);
  expect(new Set(list.map((p) => p.id)).size).toBe(list.length);
  const days = new Set<string>();
  for (const p of list) {
    expect(p.id.startsWith(PLAN_ID_PREFIX)).toBe(true);
    expect(p.fireAt, p.id).toBeGreaterThanOrEqual(p.windowStart);
    expect(p.fireAt, p.id).toBeLessThanOrEqual(p.windowEnd);
    expect(p.fireAt, p.id).toBeGreaterThan(now);
    expect(p.fireAt, p.id).toBeLessThan(end);
    const local = zonedParts(p.fireAt, timeZone);
    expect(isQuietTime(local.hh, local.mm, DEFAULT_WINDOW), `${p.id} ${timeZone} ${local.hh}:${local.mm}`).toBe(false);
    if (p.kind !== 'yearly') {
      const r = PLAN_REMINDER_RULES[p.kind];
      expect(p.windowStart).toBe(end - r.windowStartBeforeMs);
      expect(p.windowEnd).toBe(end - r.windowEndBeforeMs);
    }
    const day = `${local.y}-${local.m}-${local.d}`;
    if (p.kind === 'yearly') expect(days.has(day), 'yearly gives way on a shared day').toBe(false);
    days.add(day);
    // Lock screen: no price, no child.
    expect(p.body).not.toMatch(/\$|\{price\}|\{child\}/);
    expect(p.title).toBe(words.title);
  }
}

describe('who gets plan reminders', () => {
  const now = Date.parse('2026-12-01T12:00:00Z');

  it('the purchaser, while it will renew', () => {
    expect(remindersApply(subject(), now)).toBe(true);
    expect(plan(subject(), now).length).toBeGreaterThan(0);
  });

  it('never a family member through Family Sharing (not billed, cannot cancel)', () => {
    const s = subject({ ownership: 'familyShared' });
    expect(remindersApply(s, now)).toBe(false);
    expect(plan(s, now)).toEqual([]);
    expect(plan(trial(61, '2027-01-15T00:00:00Z', 'year', { ownership: 'familyShared' }), now)).toEqual([]);
    expect(activePlanNote(s, Date.parse('2027-01-29T12:00:00Z'), 'UTC')).toBeNull();
  });

  it('nobody once auto-renew is off (the scheduler then cancels every pending one)', () => {
    expect(plan(subject({ willAutoRenew: false }), now)).toEqual([]);
    expect(plan(trial(30, '2027-01-01T00:00:00Z', 'month', { willAutoRenew: false }), now)).toEqual([]);
  });

  it('still plans when StoreKit gave no renewal status (unknown is not "off")', () => {
    expect(plan(subject({ willAutoRenew: null }), now).length).toBeGreaterThan(0);
  });

  it('nothing in grace, billing retry, expired, revoked or with no plan', () => {
    for (const status of ['grace', 'billing_retry', 'expired', 'revoked', 'none'] as const) {
      expect(plan(subject({ status }), now), status).toEqual([]);
    }
    expect(plan(subject({ ownership: null, status: 'none', periodEnd: null }), now)).toEqual([]);
  });

  it('nothing once E has passed, or with an unreadable E', () => {
    expect(plan(subject({ periodEnd: '2026-11-01T00:00:00Z' }), now)).toEqual([]);
    expect(plan(subject({ periodEnd: 'not a date' }), now)).toEqual([]);
  });

  it('works from a real StoreKit snapshot (sanitized, mapped), and drops a family-shared one', () => {
    const raw: NativeEntitlementSnapshot = {
      entitlements: [{ productId: 'plus.annual', expiresAt: '2027-03-01T00:00:00.000Z', purchasedAt: '2026-03-01T00:00:00.000Z', originalPurchasedAt: '2025-03-01T00:00:00.000Z', ownership: 'purchased', environment: 'production', isTrial: false, isUpgraded: false }],
      statuses: [{ productId: 'plus.annual', expiresAt: '2027-03-01T00:00:00.000Z', purchasedAt: '2026-03-01T00:00:00.000Z', ownership: 'purchased', environment: 'production', isTrial: false, isUpgraded: false, state: 'subscribed', willAutoRenew: true }],
      checkedAt: '2026-12-01T12:00:00.000Z',
    };
    const p = planFromSnapshot(sanitizeSnapshot(raw));
    expect(p.details).toMatchObject({ originalPurchasedAt: '2025-03-01T00:00:00.000Z', purchasedAt: '2026-03-01T00:00:00.000Z' });
    // The anniversary (1 March) is E's own day, but E is at 00:00 UTC: no live moment left that day, so no yearly note.
    expect(plan(subjectOf(p), now).map((x) => x.kind)).toEqual(['annualLong', 'annualShort']);
    const shared = planFromSnapshot(sanitizeSnapshot({ ...raw, entitlements: [{ ...raw.entitlements[0], ownership: 'familyShared' }], statuses: [{ ...raw.statuses[0], ownership: 'familyShared' }] }));
    expect(plan(subjectOf(shared), now)).toEqual([]);
  });

  it('sanitize drops an original purchase date that is not a date', () => {
    const s = sanitizeSnapshot({ entitlements: [{ productId: 'plus.annual', ownership: 'purchased', originalPurchasedAt: 'soon' }], statuses: [], checkedAt: '2026-12-01T12:00:00.000Z' });
    expect(s?.entitlements[0].originalPurchasedAt).toBeUndefined();
  });
});

describe('which reminders, by plan and trial length', () => {
  it('trials of 28 to 31 days (monthly): trial week and trial final, no annual ones', () => {
    for (const days of [28, 29, 30, 31]) {
      const s = trial(days, '2027-02-01T00:00:00Z', 'month');
      expect(trialDays(s)).toBe(days);
      expect(offsetKinds(s), String(days)).toEqual(['trialWeek', 'trialFinal']);
    }
  });

  it('trials of 59 to 62 days (annual): long trial and trial final', () => {
    for (const days of [59, 60, 61, 62]) {
      const s = trial(days, '2027-02-01T00:00:00Z', 'year');
      expect(trialDays(s)).toBe(days);
      expect(offsetKinds(s), String(days)).toEqual(['trialLong', 'trialFinal']);
    }
  });

  it('the long-trial threshold is "over 31 days"', () => {
    expect(LONG_TRIAL_DAYS).toBe(31);
    expect(offsetKinds(trial(32, '2027-02-01T00:00:00Z', 'month'))[0]).toBe('trialLong');
  });

  it('without a start date the trial length falls back to the plan\'s offer', () => {
    expect(offsetKinds(trial(61, '2027-02-01T00:00:00Z', 'year', { purchasedAt: null }))[0]).toBe('trialLong');
    expect(offsetKinds(trial(30, '2027-02-01T00:00:00Z', 'month', { purchasedAt: null }))[0]).toBe('trialWeek');
  });

  it('annual, not in a trial: annual long and annual short', () => {
    expect(offsetKinds(subject())).toEqual(['annualLong', 'annualShort']);
  });

  it('monthly, not in a trial: only the yearly reminder, on the anniversary', () => {
    const s = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2027-03-10T15:00:00Z', purchasedAt: '2027-02-10T15:00:00Z', originalPurchasedAt: '2026-03-05T15:00:00Z' });
    expect(offsetKinds(s)).toEqual([]);
    const list = plan(s, Date.parse('2027-02-20T12:00:00Z'));
    expect(list.map((p) => p.id)).toEqual(['plan.yearly.2027-03-05']);
    expect(list[0].body).toBe(words.yearly);
    // Anniversary after E is not known to be live yet: not planned until a later read.
    expect(plan(subject({ ...s, originalPurchasedAt: '2026-03-20T15:00:00Z' }), Date.parse('2027-02-20T12:00:00Z'))).toEqual([]);
  });

  it('the first purchase day itself is not an anniversary', () => {
    const s = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2027-02-10T15:00:00Z', purchasedAt: '2027-01-10T15:00:00Z', originalPurchasedAt: '2027-01-10T15:00:00Z' });
    expect(plan(s, Date.parse('2027-01-10T16:00:00Z'))).toEqual([]);
  });
});

describe('LEGAL-REQ-047 worked examples', () => {
  it('annual renewing 1 March 00:00 UTC: long inside 29 to 30 January UTC, short inside 21 to 23 February, in every zone', () => {
    const s = subject();
    for (const tz of ZONES) {
      const list = plan(s, Date.parse('2027-01-10T00:00:00Z'), tz);
      const long = list.find((p) => p.kind === 'annualLong')!;
      const short = list.find((p) => p.kind === 'annualShort')!;
      expect(long.fireAt, tz).toBeGreaterThanOrEqual(Date.parse('2027-01-29T00:00:00Z'));
      expect(long.fireAt, tz).toBeLessThanOrEqual(Date.parse('2027-01-30T00:00:00Z'));
      expect(short.fireAt, tz).toBeGreaterThanOrEqual(Date.parse('2027-02-21T00:00:00Z'));
      expect(short.fireAt, tz).toBeLessThanOrEqual(Date.parse('2027-02-23T00:00:00Z'));
      expectInvariants(list, s, Date.parse('2027-01-10T00:00:00Z'), tz);
    }
  });

  it('2-month trial ending at E: inside [E-21d, E-16d] and [E-5d, E-4d]', () => {
    const end = '2027-01-15T08:00:00Z';
    const s = trial(61, end, 'year');
    const E = Date.parse(end);
    const list = plan(s, Date.parse('2026-11-20T00:00:00Z'), 'America/Los_Angeles');
    expect(list.map((p) => p.kind)).toEqual(['trialLong', 'trialFinal']);
    expect(list[0].fireAt).toBeGreaterThanOrEqual(E - 21 * DAY_MS);
    expect(list[0].fireAt).toBeLessThanOrEqual(E - 16 * DAY_MS);
    expect(list[1].fireAt).toBeGreaterThanOrEqual(E - 5 * DAY_MS);
    expect(list[1].fireAt).toBeLessThanOrEqual(E - 4 * DAY_MS);
    expect(list[0].body).toBe(words.trialMonths.replace('{date}', '2027-01-15'));
  });

  it('1-month trial: the date is E in the phone\'s zone', () => {
    const s = trial(30, '2027-01-01T03:00:00Z', 'month');
    const list = plan(s, Date.parse('2026-12-02T03:00:00Z'), 'America/Los_Angeles');
    // 03:00 UTC on 1 January is 31 December in Los Angeles.
    expect(list[0].body).toBe(words.trialOneMonth.replace('{date}', '2026-12-31'));
  });

  it('prefers 10:00 local when the window has it', () => {
    const list = plan(subject(), Date.parse('2027-01-10T00:00:00Z'), 'America/New_York');
    for (const p of list) {
      const l = zonedParts(p.fireAt, 'America/New_York');
      expect([l.hh, l.mm], p.id).toEqual([10, 0]);
    }
  });
});

describe('missed windows are skipped, never sent late', () => {
  const s = subject();
  const E = Date.parse(s.periodEnd!);

  it('after the window: not planned', () => {
    const list = plan(s, E - 29 * DAY_MS, 'UTC');
    expect(list.some((p) => p.kind === 'annualLong')).toBe(false);
    expect(list.some((p) => p.kind === 'annualShort')).toBe(true);
  });

  it('inside the window after its 10:00: the next allowed slot still inside the window', () => {
    const now = E - 31 * DAY_MS + 11 * HOUR; // 11:00 UTC on the window's first day
    const long = plan(s, now, 'UTC').find((p) => p.kind === 'annualLong')!;
    expect(long.fireAt).toBeGreaterThan(now);
    expect(long.fireAt).toBeLessThanOrEqual(E - 30 * DAY_MS);
  });

  it('inside the window but past the last allowed slot: skipped', () => {
    const now = E - 30 * DAY_MS - 30 * 60_000; // 23:30 UTC, the window ends at 00:00
    expect(plan(s, now, 'UTC').some((p) => p.kind === 'annualLong')).toBe(false);
  });

  it('a slot less than a minute away is not used', () => {
    const slotAt10 = E - 31 * DAY_MS + 10 * HOUR;
    const long = plan(s, slotAt10 - 30_000, 'UTC').find((p) => p.kind === 'annualLong')!;
    expect(long.fireAt).not.toBe(slotAt10);
  });

  it('pickSlot returns null for a window entirely in quiet hours', () => {
    const start = Date.parse('2027-01-10T22:00:00Z');
    expect(pickSlot({ start, end: start + 8 * HOUR, target: start }, start - DAY_MS, 'UTC')).toBeNull();
  });
});

describe('daylight saving', () => {
  const LA = 'America/Los_Angeles';
  // US clocks: back on 1 Nov 2026 and 7 Nov 2027, forward on 14 Mar 2027.
  const cases = [
    { name: 'window across fall back', end: '2026-12-01T17:30:00Z' }, // annualLong window 31 Oct 17:30 to 1 Nov 17:30 UTC
    { name: 'window across spring forward', end: '2027-04-13T09:30:00Z' },
    { name: '25-hour local day with no 10:00 in the window', end: '2026-12-01T18:30:00Z' },
    { name: 'renewal on the fall-back night', end: '2027-11-07T09:30:00Z' },
    { name: 'renewal on the spring-forward night', end: '2027-03-14T10:30:00Z' },
  ];
  for (const c of cases) {
    it(c.name, () => {
      const s = subject({ periodEnd: c.end, purchasedAt: iso(Date.parse(c.end) - 365 * DAY_MS), originalPurchasedAt: iso(Date.parse(c.end) - 365 * DAY_MS) });
      const now = Date.parse(c.end) - 60 * DAY_MS;
      for (const tz of [LA, 'America/New_York', 'Europe/London', 'Pacific/Auckland', 'Australia/Lord_Howe']) {
        const list = plan(s, now, tz);
        expect(list.filter((p) => p.kind !== 'yearly').map((p) => p.kind), `${c.name} ${tz}`).toEqual(['annualLong', 'annualShort']);
        expectInvariants(list, s, now, tz);
      }
    });
  }

  it('2-month trial reminders across the autumn change in Los Angeles', () => {
    const s = trial(61, '2026-11-20T06:00:00Z', 'year');
    const now = Date.parse('2026-10-01T12:00:00Z');
    const list = plan(s, now, LA);
    expect(list.map((p) => p.kind)).toEqual(['trialLong', 'trialFinal']);
    expectInvariants(list, s, now, LA);
  });
});

describe('a synthetic year: every E, every zone, every plan', () => {
  it('holds every invariant and always finds the legally required slot when planned early', { timeout: 120_000 }, () => {
    let checked = 0;
    for (let day = 0; day < 366; day += 5) {
      for (const hour of [0, 13, 23]) {
        const E = Date.parse('2027-01-01T00:00:00Z') + day * DAY_MS + hour * HOUR + 17 * 60_000;
        const subjects: PlanReminderSubject[] = [
          subject({ periodEnd: iso(E), purchasedAt: iso(E - 365 * DAY_MS), originalPurchasedAt: iso(E - 365 * DAY_MS) }),
          trial(30 + (day % 2), iso(E), 'month'),
          trial(59 + (day % 4), iso(E), 'year'),
          subject({ productId: 'plus.monthly', period: 'month', periodEnd: iso(E), purchasedAt: iso(E - 30 * DAY_MS), originalPurchasedAt: iso(E - (365 + (day % 20)) * DAY_MS) }),
        ];
        for (const tz of ['America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Kiritimati', 'America/St_Johns']) {
          for (const s of subjects) {
            const now = E - 70 * DAY_MS;
            const list = plan(s, now, tz);
            expectInvariants(list, s, now, tz);
            // Planned well ahead, every offset reminder is found (no window is ever all quiet hours).
            expect(list.filter((p) => p.kind !== 'yearly').map((p) => p.kind), `${iso(E)} ${tz}`).toEqual(offsetKinds(s));
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(3500);
  });

  it('re-planning before the windows changes nothing (stable ids and signature)', () => {
    const s = subject();
    const a = plan(s, Date.parse('2026-12-01T00:00:00Z'), 'Asia/Kolkata');
    const b = plan(s, Date.parse('2026-12-20T09:13:00Z'), 'Asia/Kolkata');
    expect(planReminderSignature(a)).toBe(planReminderSignature(b));
  });

  it('a new time zone moves the local slot but keeps it inside the absolute window', () => {
    const s = subject();
    const now = Date.parse('2026-12-01T00:00:00Z');
    const la = plan(s, now, 'America/Los_Angeles').find((p) => p.kind === 'annualLong')!;
    const nz = plan(s, now, 'Pacific/Auckland').find((p) => p.kind === 'annualLong')!;
    expect(la.fireAt).not.toBe(nz.fireAt);
    for (const p of [la, nz]) {
      expect(p.fireAt).toBeGreaterThanOrEqual(p.windowStart);
      expect(p.fireAt).toBeLessThanOrEqual(p.windowEnd);
    }
  });
});

describe('the yearly reminder (California 17602(h), monthly plans too)', () => {
  it('leap day: a 29 February purchase is remembered on 28 February', () => {
    const s = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2029-03-10T12:00:00Z', purchasedAt: '2029-02-10T12:00:00Z', originalPurchasedAt: '2028-02-29T12:00:00Z' });
    expect(plan(s, Date.parse('2029-02-15T00:00:00Z')).map((p) => p.id)).toEqual(['plan.yearly.2029-02-28']);
  });

  it('gives way to another plan reminder on the same local day', () => {
    // Annual plan bought on 29 Jan 2026 (no trial), renewing 1 Mar 2027 after a crossgrade: the anniversary is the long reminder's day.
    const s = subject({ originalPurchasedAt: '2026-01-29T15:00:00Z' });
    const list = plan(s, Date.parse('2027-01-10T00:00:00Z'), 'UTC');
    expect(list.map((p) => p.kind)).toEqual(['annualLong', 'annualShort']);
  });

  it('on the anniversary day itself, later in the day, still in allowed hours', () => {
    const s = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2027-03-20T12:00:00Z', purchasedAt: '2027-02-20T12:00:00Z', originalPurchasedAt: '2026-03-05T12:00:00Z' });
    const now = Date.parse('2027-03-05T15:00:00Z');
    const list = plan(s, now, 'UTC');
    expect(list).toHaveLength(1);
    expect(list[0].fireAt).toBeGreaterThan(now);
    expectInvariants(list, s, now, 'UTC');
  });

  it('the anniversary follows the local date in the phone\'s zone', () => {
    // 2026-03-05 23:30 UTC is already 6 March in Kolkata.
    const s = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2027-03-20T12:00:00Z', purchasedAt: '2027-02-20T12:00:00Z', originalPurchasedAt: '2026-03-05T23:30:00Z' });
    expect(plan(s, Date.parse('2027-02-25T00:00:00Z'), 'Asia/Kolkata').map((p) => p.id)).toEqual(['plan.yearly.2027-03-06']);
  });
});

describe('the in-app note (notifications on or off)', () => {
  const s = subject();
  const E = Date.parse(s.periodEnd!);

  it('none before the first window opens', () => {
    expect(activePlanNote(s, E - 40 * DAY_MS, 'UTC')).toBeNull();
  });

  it('opens with the long reminder and stays until E', () => {
    const n = activePlanNote(s, E - 30 * DAY_MS - HOUR, 'UTC')!;
    expect(n).toMatchObject({ kind: 'annualLong', id: 'plan.annualLong.2027-03-01', trial: false });
    expect(activePlanNote(s, E - 20 * DAY_MS, 'UTC')?.kind).toBe('annualLong');
    expect(activePlanNote(s, E - 7 * DAY_MS, 'UTC')?.kind).toBe('annualShort');
    expect(activePlanNote(s, E - 1000, 'UTC')?.kind).toBe('annualShort');
    expect(activePlanNote(s, E + 1000, 'UTC')).toBeNull();
  });

  it('cancel-by is E minus 24 hours', () => {
    const n = activePlanNote(s, E - 7 * DAY_MS, 'UTC')!;
    expect(Date.parse(n.cancelBy)).toBe(E - CANCEL_LEAD_MS);
    expect(n.endsAt).toBe(s.periodEnd);
  });

  it('trial notes know the trial length', () => {
    const t = trial(30, '2027-01-01T12:00:00Z', 'month');
    const n = activePlanNote(t, Date.parse('2026-12-26T12:00:00Z'), 'UTC')!;
    expect(n).toMatchObject({ kind: 'trialWeek', trial: true, oneMonthTrial: true });
  });

  it('none for a family member, or once auto-renew is off', () => {
    expect(activePlanNote(subject({ ownership: 'familyShared' }), E - 7 * DAY_MS, 'UTC')).toBeNull();
    expect(activePlanNote(subject({ willAutoRenew: false }), E - 7 * DAY_MS, 'UTC')).toBeNull();
  });

  it('the yearly note lasts its day only', () => {
    const m = subject({ productId: 'plus.monthly', period: 'month', periodEnd: '2027-03-20T12:00:00Z', purchasedAt: '2027-02-20T12:00:00Z', originalPurchasedAt: '2026-03-05T12:00:00Z' });
    expect(activePlanNote(m, Date.parse('2027-03-05T08:00:00Z'), 'UTC')?.kind).toBe('yearly');
    expect(activePlanNote(m, Date.parse('2027-03-06T08:00:00Z'), 'UTC')).toBeNull();
  });

  it('says the date and the cancel-by date, and no price (D-083)', () => {
    const n = activePlanNote(s, E - 7 * DAY_MS, 'UTC')!;
    const lines = noteLines(n, billingCopy.note, { timeZone: 'UTC' });
    expect(lines).toEqual([
      billingCopy.note.renews.replace('{date}', '2027-03-01'),
      billingCopy.note.cancelByRenewal.replace('{cancelBy}', '2027-02-28'),
    ]);
    expect(lines.join(' ')).not.toMatch(/\$|price/i);
  });
});

describe('purchase confirmation and Save a copy', () => {
  const now = Date.parse('2026-11-16T18:00:00Z');
  const base = {
    appName: 'Early Letters',
    termsUrl: 'https://earlyletters.com/terms',
    timeZone: 'America/Los_Angeles',
    now,
    words: billingCopy.confirmation,
  };

  it('annual trial: plan, trial end, cancel-by, renewal, how to cancel, Apple, Family Sharing, courtesy reminders', () => {
    const c = purchaseConfirmation({
      ...base,
      details: { productId: 'plus.annual', period: 'year', status: 'trial', periodEnd: '2027-01-16T18:00:00Z', cancelBy: '2027-01-15T18:00:00Z', willAutoRenew: true },
    });
    expect(c.planName).toBe('Plus Annual');
    expect(c.lines[0]).toBe('Free until 2027-01-16. Then Plus renews until you cancel.');
    expect(c.lines[1]).toBe('Cancel by 2027-01-15 and you pay nothing.');
    expect(c.lines).toContain(billingCopy.confirmation.reminders);
    expect(c.summary).toContain('Plan: Plus Annual.');
    expect(c.summary).toContain('Free until: 2027-01-16.');
    expect(c.summary).toContain('Cancel by: 2027-01-15.');
    expect(c.summary).toContain('Early Letters Plus: what you agreed to');
    expect(c.summary).toContain('https://earlyletters.com/terms');
    expect(c.summary).toContain('Saved on 2026-11-16.');
    expect(c.summary).not.toMatch(/\{\w+\}/);
  });

  it('monthly paid: renewal date, and cancel-by derived as E minus 24 hours', () => {
    const c = purchaseConfirmation({
      ...base,
      details: { productId: 'plus.monthly', period: 'month', status: 'active', periodEnd: '2026-12-16T18:00:00Z', cancelBy: null, willAutoRenew: true },
    });
    expect(c.planName).toBe('Plus Monthly');
    expect(c.lines[0]).toBe('Plus renews on 2026-12-16, until you cancel.');
    expect(c.lines[1]).toBe('To avoid the next charge, cancel by 2026-12-15.');
    expect(c.summary).toContain('Renews on: 2026-12-16.');
  });

  it('auto-renew already off: no cancel-by line', () => {
    const c = purchaseConfirmation({ ...base, details: { productId: 'plus.annual', period: 'year', status: 'active', periodEnd: '2027-11-16T18:00:00Z', cancelBy: null, willAutoRenew: false } });
    expect(c.lines.join(' ')).not.toMatch(/cancel by/i);
  });

  it('[D-083] never shows or saves a price, "free trial", "free months" or an email promise', () => {
    for (const status of ['trial', 'active'] as const) {
      for (const period of ['month', 'year'] as const) {
        const c = purchaseConfirmation({ ...base, details: { productId: `plus.${period === 'year' ? 'annual' : 'monthly'}`, period, status, periodEnd: '2027-01-16T18:00:00Z', cancelBy: null, willAutoRenew: true } });
        const text = [...c.lines, c.summary].join('\n');
        expect(text, `${status} ${period}`).not.toMatch(/\$\d|\bprice\b|free trial|free months?|we will email|we'll email/i);
      }
    }
  });

  it('says how to cancel, who charges, and that reminders are a courtesy, not a promise', () => {
    const c = purchaseConfirmation({ ...base, details: { productId: 'plus.annual', period: 'year', status: 'trial', periodEnd: '2027-01-16T18:00:00Z', cancelBy: null, willAutoRenew: true } });
    expect(c.summary).toContain('Settings, tap your name, Subscriptions, Early Letters, Cancel Subscription');
    expect(c.summary).toContain('Settings, Plan, Manage subscription');
    expect(c.summary).toContain('Deleting the app does not cancel your plan.');
    expect(c.summary).toMatch(/at least 24 hours before a free or paid period ends/);
    expect(c.summary).toMatch(/handles every payment, renewal, cancellation and refund/);
    expect(c.summary).toMatch(/As a courtesy[^.]*tries to remind you/);
    expect(c.summary).toMatch(/A reminder can come late or not at all/);
    expect(c.summary).not.toMatch(/we keep a record|refund you|will remind you/i);
  });

  it('lock-screen reminder text names no price and no child, and fits a lock screen', () => {
    for (const [k, v] of Object.entries(billingCopy.reminders)) {
      expect(v, k).not.toMatch(/\{price\}|\{child\}|\$/);
      expect(v.length, k).toBeLessThanOrEqual(k === 'title' ? 40 : 120);
    }
  });
});

describe('the reminders do not collide with evening reminders', () => {
  it('ids never start with the evening prefix', () => {
    const list = plan(subject(), Date.parse('2026-12-01T00:00:00Z'));
    for (const p of list) expect(p.id.startsWith('el.')).toBe(false);
  });

  it('every window is reachable from reminderWindows', () => {
    const w = reminderWindows(subject({ periodEnd: '2027-03-01T20:00:00Z' }), Date.parse('2026-12-01T00:00:00Z'), 'UTC');
    expect(w.map((x) => x.kind)).toEqual(['annualLong', 'annualShort', 'yearly']);
    // The yearly window ends before E even on E's own day.
    expect(w[2].end).toBe(Date.parse('2027-03-01T20:00:00Z') - 1);
  });
});
