/**
 * The notification budget registry and chooser (NS-32-R2, R3, R5, R7, R15; CR-69 A1, E13, CL-115).
 * Fixtures: the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
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
