/**
 * NS-32-R4b (errata E13, CL-115, CR-69 A1; NFR-BUDGETS B-03): at most 60
 * notifications are pending in all. The 60 counts the evening, month and
 * birthday notes AND the plan notices together; plan notices are kept first.
 *
 * Today two caps stack. The reminders planner keeps up to 60
 * (`reminders/planner.ts`, `maxNotifications ?? 60`) and the plan-notice
 * planner adds up to `MAX_PLAN_NOTIFICATIONS` (4, `billing/plan-reminders.logic.ts`)
 * on top, so the total can reach 64 (iOS keeps 64 in all).
 *
 * How to use this file (BL-966a owner): the `it.fails` cases below are red on
 * today's code on purpose, so CI stays green. When budget.ts makes the total 60,
 * these bodies pass, vitest reports "expected to fail" and the build goes red:
 * remove `.fails` from the two marked cases in the same PR. Keep the helper
 * `pendingAll` in step with whatever call site then joins the two planners.
 *
 * Reach: the shipped call sites plan evenings 21 days ahead (scheduler.ts, no
 * `horizonDays`), so a phone only nears 60 when the horizon or the number of
 * included books grows. The wide-horizon cases are the property over the 92
 * days of B-03; the shipped-horizon case is a green guard.
 */
import { billingCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  MAX_PLAN_NOTIFICATIONS,
  planPlanReminders,
  type PlanReminderSubject,
} from '../src/lib/billing/plan-reminders.logic';
import { DEFAULT_PREFS, planReminders, type PlannerChild, type ReminderPrefs } from '../src/lib/reminders/planner';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const TZ = 'America/Los_Angeles';
const TOTAL_MAX = 60;
const WIDE_DAYS = 92;

const kids: PlannerChild[] = [
  { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true },
  { id: 'child-dev', name: 'Dev', birthday: '2024-05-31', included: true },
  { id: 'child-ila', name: 'Ila', birthday: '2025-12-15', included: true },
];
const prefs: ReminderPrefs = { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' };

function start(day: number): number {
  const base = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, TZ);
  return base + day * DAY_MS;
}

/** A purchaser in a one-month trial that ends a week out: the real planner gives its most notices here (3). */
function trialEndingInAWeek(now: number): PlanReminderSubject {
  const end = now + 7 * DAY_MS;
  return {
    productId: 'plus.monthly',
    period: 'month',
    ownership: 'purchased',
    status: 'trial',
    willAutoRenew: true,
    periodEnd: new Date(end).toISOString(),
    purchasedAt: new Date(end - 30 * DAY_MS).toISOString(),
    originalPurchasedAt: new Date(end - 365 * DAY_MS - 5 * DAY_MS).toISOString(),
  };
}

function planNotices(now: number) {
  return planPlanReminders({ now, timeZone: TZ, subject: trialEndingInAWeek(now), words: billingCopy.reminders });
}

/** Everything that would be pending on the phone: our notes plus the plan notices, each at its own default cap. */
function pendingAll(now: number, horizonDays?: number) {
  const notes = planReminders({ now, timeZone: TZ, prefs, children: kids, horizonDays, monthHorizonDays: WIDE_DAYS });
  const plan = planNotices(now);
  return { notes, plan, total: notes.length + plan.length };
}

describe('[NS-32-R4b] at most 60 pending notifications in all', () => {
  it('[NS-32-R4b] the fixture really has plan notices due, and a full set of notes', () => {
    const { notes, plan } = pendingAll(start(0), WIDE_DAYS);
    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(MAX_PLAN_NOTIFICATIONS);
    expect(notes.length).toBeGreaterThanOrEqual(56);
  });

  // RED on today's code (60 + 3 plan notices = 63; 64 with a fourth). BL-966a: remove `.fails`.
  it.fails('[NS-32-R4b] total pending never exceeds 60 and plan notices are kept, on every day of 92', () => {
    for (let day = 0; day < WIDE_DAYS; day++) {
      const now = start(day);
      const { plan, total } = pendingAll(now, WIDE_DAYS);
      const due = planNotices(now);
      expect(total, `day ${day}`).toBeLessThanOrEqual(TOTAL_MAX);
      expect(plan.map((p) => p.id), `day ${day} plan notices kept`).toEqual(due.map((p) => p.id));
    }
  });

  // RED on today's code (60 + 4 = 64). BL-966a: remove `.fails`. Catches a raised ceiling even when no fixture reaches it.
  it.fails('[NS-32-R4b] the notes ceiling plus the plan-notice ceiling is at most 60', () => {
    const farAhead = planReminders({ now: start(0), timeZone: TZ, prefs, children: kids, horizonDays: 400, monthHorizonDays: 400 });
    expect(farAhead.length + MAX_PLAN_NOTIFICATIONS).toBeLessThanOrEqual(TOTAL_MAX);
  });

  it('[NS-32-R4b] a cap of 60 in total passes: notes get what the plan notices leave', () => {
    for (let day = 0; day < WIDE_DAYS; day++) {
      const now = start(day);
      const plan = planNotices(now);
      const notes = planReminders({ now, timeZone: TZ, prefs, children: kids, horizonDays: WIDE_DAYS, monthHorizonDays: WIDE_DAYS, maxNotifications: TOTAL_MAX - plan.length });
      expect(notes.length + plan.length, `day ${day}`).toBeLessThanOrEqual(TOTAL_MAX);
      expect(plan.length, `day ${day}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('[NS-32-R4b] at the shipped 21-day evening horizon the total stays at or under 60', () => {
    for (let day = 0; day < WIDE_DAYS; day++) {
      expect(pendingAll(start(day)).total, `day ${day}`).toBeLessThanOrEqual(TOTAL_MAX);
    }
  });
});
