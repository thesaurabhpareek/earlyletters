/**
 * The notification budget registry and chooser (NS-32-R2, R3, R5, R7, R15; CR-69 A1, E13, CL-115).
 * Fixtures: the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
import { reminderCopy } from '../src/lib/reminders/copy';
import { DEFAULT_PREFS, planReminders, type PlanInput, type PlannerChild, type ReminderPrefs } from '../src/lib/reminders/planner';
import { zonedParts, zonedToEpoch } from '../src/lib/reminders/tz';
import { MAX_PLAN_NOTIFICATIONS } from '../src/lib/billing/plan-reminders.logic';
import {
  addNotificationClass,
  budgetedSlots,
  chooseOnePerDay,
  CLASS_IDS,
  classOfSource,
  IOS_PENDING_LIMIT,
  NOTIFICATION_CLASSES,
  pendingCeiling,
  PLAN_MAX,
  SOURCE_RANK,
  TOTAL_MAX,
  type NoteSource,
  type NotificationClass,
} from '../src/lib/reminders/budget';

const note = (source: NoteSource, date: string, id = `${source}.${date}`) => ({ source, date, id });

describe('[NS-32-R2] unregistered class fails', () => {
  it('has a registry row for every class id, and no id without a class', () => {
    expect(NOTIFICATION_CLASSES.map((c) => c.id).sort()).toEqual([...CLASS_IDS].sort());
  });
  it('refuses a note whose class is not in the registry', () => {
    const withoutBirthday = NOTIFICATION_CLASSES.filter((c) => c.id !== 'birthday');
    expect(() => chooseOnePerDay([note('birthday', '2026-12-01')], withoutBirthday)).toThrow(/not in the registry/);
    expect(() => chooseOnePerDay([note('birthday', '2026-12-01')])).not.toThrow();
  });
});

describe('[NS-32-R3] priority decides', () => {
  it('keeps one note a day: typed day, birthday, libraryDay, month, evening, in that order', () => {
    const order: NoteSource[] = ['typedDay', 'birthday', 'libraryDay', 'monthAge', 'evening'];
    for (let i = 0; i < order.length; i++) {
      const rest = order.slice(i);
      // Offer them in reverse so the input order cannot be what wins.
      const got = chooseOnePerDay([...rest].reverse().map((s) => note(s, '2026-12-08')));
      expect(got.map((g) => g.source)).toEqual([order[i]]);
    }
  });
  it('keeps one a day across days, ordered by date, and the same rank ties by input order', () => {
    const got = chooseOnePerDay([
      note('evening', '2026-12-09'),
      note('monthAge', '2026-12-08', 'a'),
      note('monthAge', '2026-12-08', 'b'),
      note('evening', '2026-12-08'),
    ]);
    expect(got.map((g) => g.id)).toEqual(['a', 'evening.2026-12-09']);
  });
  it('ranks libraryDay inside the typedDay class, not as a class of its own', () => {
    expect(SOURCE_RANK).toEqual({ typedDay: 1, birthday: 2, libraryDay: 3, monthAge: 4, evening: 5 });
    expect(classOfSource('libraryDay')).toBe('typedDay');
  });
});

describe('[NS-32-R5] registry rows', () => {
  it('lists plan, typedDay, birthday, monthAge and evening, each with a group, a priority and an owner', () => {
    expect(NOTIFICATION_CLASSES.map((c) => c.id)).toEqual(['plan', 'typedDay', 'birthday', 'monthAge', 'evening']);
    for (const c of NOTIFICATION_CLASSES) {
      expect(['plan', 'budgeted']).toContain(c.group);
      expect(Number.isInteger(c.priority)).toBe(true);
      expect(['payments', 'mobile']).toContain(c.owner);
    }
    expect(NOTIFICATION_CLASSES.find((c) => c.id === 'plan')).toMatchObject({ group: 'plan', owner: 'payments' });
  });
  it('has no occasion class and no libraryDay class', () => {
    const ids: string[] = NOTIFICATION_CLASSES.map((c) => c.id);
    expect(ids).not.toContain('occasion');
    expect(ids).not.toContain('libraryDay');
  });
  it('keeps row priorities in step with the source ranks', () => {
    for (const c of NOTIFICATION_CLASSES.filter((x) => x.group === 'budgeted')) expect(c.priority).toBe(SOURCE_RANK[c.id as keyof typeof SOURCE_RANK]);
  });
});

describe('[NS-32-R7] pending ceilings', () => {
  it('is 60 in total with plan notices inside it, at most 4', () => {
    expect(TOTAL_MAX).toBe(60);
    expect(IOS_PENDING_LIMIT).toBe(64);
    expect(PLAN_MAX).toBe(4);
    expect(PLAN_MAX).toBe(MAX_PLAN_NOTIFICATIONS);
    expect(pendingCeiling()).toBe(60);
  });
  it('keeps plan notices first: plan plus budgeted never passes 60', () => {
    for (let plan = 0; plan <= 9; plan++) {
      const kept = Math.min(plan, PLAN_MAX);
      expect(budgetedSlots(plan)).toBe(60 - kept);
      expect(kept + budgetedSlots(plan)).toBeLessThanOrEqual(60);
    }
    expect(budgetedSlots(4)).toBe(56);
    expect(budgetedSlots(0)).toBe(60);
    expect(budgetedSlots(-1)).toBe(60);
    expect(budgetedSlots(Number.NaN)).toBe(60);
  });
});

describe('[NS-32-R15] a class cannot raise the total', () => {
  const extra: NotificationClass = { id: 'evening', group: 'budgeted', priority: 6, owner: 'mobile' };
  it('shares its group, so the total stays at 60', () => {
    const base = NOTIFICATION_CLASSES.filter((c) => c.id !== 'evening');
    const grown = addNotificationClass(base, extra);
    expect(grown).toHaveLength(base.length + 1);
    expect(pendingCeiling(grown)).toBe(pendingCeiling(base));
    expect(pendingCeiling(grown)).toBe(TOTAL_MAX);
  });
  it('refuses a repeated id and a group nobody owns', () => {
    expect(() => addNotificationClass(NOTIFICATION_CLASSES, extra)).toThrow(/already registered/);
    const own = { ...extra, id: 'monthAge', group: 'own' } as unknown as NotificationClass;
    expect(() => addNotificationClass(NOTIFICATION_CLASSES.filter((c) => c.id !== 'monthAge'), own)).toThrow(/cannot raise the total/);
  });
});

// ---- BL-966b: the planner keeps one a day and 60 in total --------------------------------------------------------

const LA = 'America/Los_Angeles';
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
// Dev's 18th month-day is Asha's first birthday: one date, a birthday and a month note.
const dev: PlannerChild = { id: 'child-dev', name: 'Dev', birthday: '2025-09-08', included: true };
const at = (y: number, m: number, d: number, hh: number, mm = 0, tz = LA) => zonedToEpoch({ y, m, d, hh, mm }, tz);

function plan(p: Partial<Omit<PlanInput, 'prefs'>> & { prefs?: Partial<ReminderPrefs> } = {}) {
  return planReminders({
    now: p.now ?? at(2027, 3, 1, 12),
    timeZone: p.timeZone ?? LA,
    children: p.children ?? [asha, dev],
    horizonDays: p.horizonDays,
    monthHorizonDays: p.monthHorizonDays ?? 92,
    planPending: p.planPending,
    maxNotifications: p.maxNotifications,
    prefs: { ...DEFAULT_PREFS, enabled: true, ...p.prefs },
  });
}

describe('[NS-32-R1] one budgeted notification a day', () => {
  it('never plans two notes on one local date, over 92 days, any cadence, many books', () => {
    const kids: PlannerChild[] = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: `Child${i}`, birthday: `2026-0${(i % 6) + 1}-0${i + 1}`, included: true }));
    for (const cadence of ['weekly', 'fewTimes', 'everyEvening'] as const) {
      const p = plan({ children: [asha, dev, ...kids], prefs: { cadence }, horizonDays: 92, now: at(2026, 12, 1, 12) });
      const dates = p.map((n) => n.date);
      expect(new Set(dates).size, cadence).toBe(dates.length);
      expect(p.length, cadence).toBeLessThanOrEqual(56);
    }
  });
});

describe('[NS-32-R1b] birthday and month-day on one date', () => {
  it('is one notification, the birthday, at 09:00', () => {
    const p = plan({ prefs: { cadence: 'off' } }).filter((n) => n.date === '2027-03-08');
    expect(p.map((n) => n.kind)).toEqual(['birthday']);
    expect(p[0]).toMatchObject({ hour: 9, minute: 0 });
  });
});

describe('[NS-13-R19] two books, one notification a day', () => {
  it('two books on the same month-day are one month note', () => {
    const twin: PlannerChild = { ...dev, id: 'child-twin', name: 'Nina', birthday: '2026-09-08' };
    const p = plan({ children: [dev, twin], prefs: { cadence: 'off' } }).filter((n) => n.date === '2027-03-08');
    expect(p).toHaveLength(1);
  });
});

describe('[NS-13-R28] birthday and month merge', () => {
  it('the birthday words win over the month words', () => {
    const [n] = plan({ prefs: { cadence: 'off' } }).filter((x) => x.date === '2027-03-08');
    expect(n.title).toBe(reminderCopy.neutral.birthday.title);
    expect(n.month).toBe(1);
  });
});

describe('[NS-32-R3] priority decides, in the plan', () => {
  it('an evening nudge gives way to a month note on the same date', () => {
    const p = plan({ children: [dev], prefs: { cadence: 'everyEvening' }, horizonDays: 21 }).filter((n) => n.date === '2027-03-08');
    expect(p.map((n) => n.kind)).toEqual(['monthAge']);
  });
});

describe('[NS-32-R4] plan notice on time', () => {
  it('leaves the plan notices their slots first: budgeted plus plan never passes 60', () => {
    const many: PlannerChild[] = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: `Child${i}`, birthday: `2026-0${(i % 6) + 1}-1${i}`, included: true }));
    const base = { children: many, prefs: { cadence: 'everyEvening' as const }, horizonDays: 60, monthHorizonDays: 365 };
    for (const planPending of [0, 1, 4, 9]) {
      const p = plan({ ...base, planPending });
      expect(p.length + Math.min(planPending, 4)).toBeLessThanOrEqual(60);
    }
    expect(plan({ ...base, planPending: 0 }).length).toBe(60);
    expect(plan({ ...base, planPending: 4 }).length).toBe(56);
    // Not told, the planner assumes the most plan notices there can be.
    expect(plan(base).length).toBe(56);
  });
  it('maxNotifications can lower the budget and never raise the total', () => {
    expect(plan({ prefs: { cadence: 'everyEvening' }, horizonDays: 40, maxNotifications: 5 })).toHaveLength(5);
    expect(plan({ prefs: { cadence: 'everyEvening' }, horizonDays: 90, monthHorizonDays: 400, maxNotifications: 500, planPending: 0 }).length).toBeLessThanOrEqual(60);
  });
});

describe('[NS-32-R6] time zone change', () => {
  it('plans on the local date, not the UTC date', () => {
    // 20:30 on 8 March in Los Angeles is 04:30 UTC on the 9th (before the 8 March 2026 change it is PST, UTC-8).
    const p = plan({ children: [dev], prefs: { cadence: 'off' }, now: at(2027, 3, 1, 12) }).find((n) => n.kind === 'monthAge');
    expect(p?.date).toBe('2027-03-08');
    const parts = zonedParts(p!.fireAt, LA);
    expect([parts.y, parts.m, parts.d, parts.hh, parts.mm]).toEqual([2027, 3, 8, 20, 30]);
    expect(new Date(p!.fireAt).getUTCDate()).toBe(9);
    // The same book planned from Tokyo lands on Tokyo's own 8th.
    const jp = plan({ children: [dev], prefs: { cadence: 'off' }, timeZone: 'Asia/Tokyo', now: at(2027, 3, 1, 12, 0, 'Asia/Tokyo') }).find((n) => n.kind === 'monthAge');
    expect(jp?.date).toBe('2027-03-08');
    expect(jp!.fireAt).not.toBe(p!.fireAt);
  });
});

describe('[NS-32-R8] back-off pre-scheduled', () => {
  it('plans evening nudges only within the 21 day horizon, so no far-off nudge outlives a quiet month', () => {
    const p = plan({ children: [dev], prefs: { cadence: 'everyEvening', monthNotes: false } });
    expect(p.length).toBeGreaterThan(0);
    expect(p.length).toBeLessThanOrEqual(21);
    expect(p.every((n) => n.fireAt < at(2027, 3, 1, 12) + 22 * 86_400_000)).toBe(true);
  });
});
