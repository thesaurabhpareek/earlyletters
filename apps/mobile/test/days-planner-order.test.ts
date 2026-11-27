/**
 * Ticked library days in the planner (BL-1319; NS-46-R4, R5, R7, R8, R30) and the day-only gate (BL-1007; NS-46-R31).
 * The planner is pure, so these tests give it dates: the days module resolves ticks to dates (BL-1012), and the
 * planner never sees a day id, a name or a content key. Day ids are synthetic (`zz-test-day-a`, `zz-test-day-b`),
 * never a real tradition beside a book with Asha (NS-46-R8). Fixtures: the fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reminderCopy } from '@scribe/content';
import { chooseOnePerDay, CLASS_IDS, NOTIFICATION_CLASSES, SOURCE_RANK, TOTAL_MAX } from '../src/lib/reminders/budget';
import { reminderContent, routeForReminder } from '../src/lib/reminders/payload';
import { DEFAULT_PREFS, planReminders, type LibraryDayNote, type PlanInput, type PlannedNotification, type PlannerChild } from '../src/lib/reminders/planner';
import { addDays, isoDate, parseIsoDate, zonedParts, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const at = (iso: string, hh: number, zone = LA) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm: 0 }, zone);
const plus = (iso: string, n: number) => isoDate(addDays(parseIsoDate(iso)!, n));
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2025-12-10', included: true };
/** Synthetic day ids: the days module would resolve these; the planner must never see them. */
const DAY_A = 'zz-test-day-a';
const DAY_B = 'zz-test-day-b';
const day = (date: string): LibraryDayNote => ({ date });
const NEUTRAL = reminderCopy.neutral.libraryDay;

const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  now: at('2026-11-01', 12),
  timeZone: LA,
  prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' },
  children: [asha],
  lastSaveAt: null,
  lastForegroundAt: null,
  ...over,
});
const onDate = (plan: PlannedNotification[], date: string) => plan.filter((n) => n.date === date);
const kinds = (plan: PlannedNotification[], date: string) => onDate(plan, date).map((n) => n.kind);

describe('[NS-46-R4] a ticked day adds no class', () => {
  it('the registry has no library class: libraryDay is a ranked source that rides on the typedDay class', () => {
    expect(CLASS_IDS).not.toContain('libraryDay');
    expect(NOTIFICATION_CLASSES.map((c) => c.id)).not.toContain('libraryDay');
    expect(SOURCE_RANK.libraryDay).toBeGreaterThan(SOURCE_RANK.birthday);
    expect(SOURCE_RANK.libraryDay).toBeLessThan(SOURCE_RANK.monthAge);
  });

  it('the planner emits one libraryDay note on the date, id el.day.<isoDate>, with the neutral title and body', () => {
    const date = '2026-11-20';
    const out = planReminders(base({ libraryDays: [day(date)] }));
    expect(onDate(out, date)).toEqual([
      expect.objectContaining({ id: `el.day.${date}`, kind: 'libraryDay', title: NEUTRAL.title, body: NEUTRAL.body }),
    ]);
  });

  it('the neutral words are the D-S10 keys and name no child, day or count', () => {
    expect(NEUTRAL).toEqual({ title: 'Something for the book today', body: 'Whenever you have a minute.' });
    expect(`${NEUTRAL.title} ${NEUTRAL.body}`).not.toMatch(/Asha|\{child\}|\d/);
  });

  it('the identifier and payload carry no day id, content key or layer, and the tap opens Home', () => {
    const date = '2026-11-20';
    const n = onDate(planReminders(base({ libraryDays: [day(date)] })), date)[0]!;
    const content = reminderContent(n);
    const all = JSON.stringify({ id: n.id, content });
    for (const banned of [DAY_A, DAY_B, 'days.', 'seasonal', 'family', 'civic', 'tradition', 'cultureLed', 'national']) {
      expect(all).not.toContain(banned);
    }
    expect(content.data).toEqual({ source: 'scribe.reminders', kind: 'libraryDay' });
    expect(routeForReminder(content.data)).toBe('/');
  });

  it('a ticked day shares the 60 in total: more ticked dates than slots keep the nearest and never pass the budget', () => {
    const many = Array.from({ length: 80 }, (_, i) => day(plus('2026-11-02', i)));
    const out = planReminders(base({ libraryDays: many, prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'off' }, planPending: 0 }));
    expect(out.length).toBeLessThanOrEqual(TOTAL_MAX);
    const library = out.filter((n) => n.kind === 'libraryDay');
    expect(library.length).toBeGreaterThan(0);
    expect(library[0]!.date).toBe('2026-11-02');
  });
});

describe('[NS-46-R5] a typed day does not recur', () => {
  const typedDate = '2026-11-20';
  const yearOn = plus(typedDate, 365);

  it('planned once on its date; on the same date a year later nothing comes from it', () => {
    const now = base().now;
    const thisYear = planReminders(base({ typedDays: [{ date: typedDate, words: 'Nursery starts' }], prefs: { ...DEFAULT_PREFS, enabled: false } }));
    expect(thisYear.map((n) => n.id)).toEqual([`el.typed.${typedDate}`]);
    // A year later the same typed entry (had it not been swept) is in the past, so it plans nothing at all.
    const later = planReminders(base({ now: at(yearOn, 8), typedDays: [{ date: typedDate, words: 'Nursery starts' }], prefs: { ...DEFAULT_PREFS, enabled: false } }));
    expect(later).toEqual([]);
    expect(now).toBeLessThan(at(yearOn, 8));
  });

  it('the planner never moves a typed day to another year: no typed note is planned on any date but its own', () => {
    const out = planReminders(base({ typedDays: [{ date: typedDate, words: 'Nursery starts' }], horizonDays: 400, monthHorizonDays: 400 }));
    expect(out.filter((n) => n.kind === 'typedDay').map((n) => n.date)).toEqual([typedDate]);
  });

  it('no source file schedules a typed day with a repeating trigger', () => {
    const src = readFileSync(join(__dirname, '../src/lib/reminders/scheduler.ts'), 'utf8');
    expect(src).toMatch(/repeats: false/);
    expect(src).not.toMatch(/repeats: true/);
  });
});

describe('[NS-46-R7] birthday beats a library day', () => {
  it('a first birthday on a ticked day: the birthday is sent and the library day is not', () => {
    const birthday = '2026-12-10'; // Asha's first birthday
    const out = planReminders(base({ libraryDays: [day(birthday)] }));
    expect(kinds(out, birthday)).toEqual(['birthday']);
  });

  it('the order on one date: a typed day, birthday, library day, month, evening', () => {
    const month = '2026-11-10'; // a month-day for Asha
    expect(kinds(planReminders(base({ libraryDays: [day(month)] })), month)).toEqual(['libraryDay']);
    expect(kinds(planReminders(base({ libraryDays: [day(month)], typedDays: [{ date: month, words: 'Nursery starts' }] })), month)).toEqual(['typedDay']);
    const plain = '2026-11-12'; // an evening only
    expect(kinds(planReminders(base()), plain)).toEqual(['evening']);
    expect(kinds(planReminders(base({ libraryDays: [day(plain)] })), plain)).toEqual(['libraryDay']);
  });

  it('the chooser keeps that order whatever order the candidates come in', () => {
    const sources = ['evening', 'monthAge', 'libraryDay', 'birthday', 'typedDay'] as const;
    for (let i = 0; i < sources.length; i++) {
      const rotated = [...sources.slice(i), ...sources.slice(0, i)].map((source) => ({ source, date: '2026-11-10' }));
      expect(chooseOnePerDay(rotated).map((c) => c.source)).toEqual(['typedDay']);
      expect(chooseOnePerDay(rotated.filter((c) => c.source !== 'typedDay')).map((c) => c.source)).toEqual(['birthday']);
      expect(chooseOnePerDay(rotated.filter((c) => c.source !== 'typedDay' && c.source !== 'birthday')).map((c) => c.source)).toEqual(['libraryDay']);
    }
  });
});

describe('[NS-46-R8] two days one date one note', () => {
  it(`two ticked days (${DAY_A} and ${DAY_B}) on one date: exactly 1 note, neutral, on that date, and no day is moved`, () => {
    const date = '2026-11-20';
    // The days module resolves both ids to the same date; the planner gets that date twice.
    const resolved: Record<string, string> = { [DAY_A]: date, [DAY_B]: date };
    const out = planReminders(base({ libraryDays: Object.values(resolved).map(day) }));
    expect(onDate(out, date)).toEqual([expect.objectContaining({ id: `el.day.${date}`, kind: 'libraryDay', title: NEUTRAL.title, body: NEUTRAL.body })]);
    expect(out.filter((n) => n.kind === 'libraryDay').map((n) => n.date)).toEqual([date]);
    expect(onDate(out, plus(date, -1)).map((n) => n.kind)).toEqual(['evening']);
    expect(onDate(out, plus(date, 1)).map((n) => n.kind)).toEqual(['evening']);
  });

  it('the same with Reminders off', () => {
    const date = '2026-11-20';
    const out = planReminders(base({ libraryDays: [day(date), day(date)], prefs: { ...DEFAULT_PREFS, enabled: false } }));
    expect(out.map((n) => n.id)).toEqual([`el.day.${date}`]);
  });

  it('a date that is not a real date, or is past, makes no note', () => {
    const out = planReminders(base({ libraryDays: [day('2026-02-30'), day('2026-11-1'), day('2026-10-31')], prefs: { ...DEFAULT_PREFS, enabled: false } }));
    expect(out).toEqual([]);
  });
});

describe('[NS-46-R31] day reminders do not need evening reminders on', () => {
  const ticked = '2026-11-20';
  const typed = '2026-11-21';
  const month = '2026-11-10';

  it('Reminders off with notifications allowed: library and typed days plan, and evening, month and birthday do not', () => {
    for (const prefs of [{ ...DEFAULT_PREFS, enabled: false }, { ...DEFAULT_PREFS, enabled: true, paused: true }]) {
      const out = planReminders(base({ prefs: { ...prefs, cadence: 'everyEvening' }, libraryDays: [day(ticked), day('2026-12-10')], typedDays: [{ date: typed, words: 'Nursery starts' }] }));
      expect(out.map((n) => n.kind).sort()).toEqual(['libraryDay', 'libraryDay', 'typedDay']);
      expect(out.map((n) => n.id)).toEqual([`el.day.${ticked}`, `el.typed.${typed}`, 'el.day.2026-12-10']);
      expect(kinds(out, month)).toEqual([]);
    }
  });

  it('with Reminders off a typed day still beats a ticked day on one date', () => {
    const out = planReminders(base({ prefs: { ...DEFAULT_PREFS, enabled: false }, libraryDays: [day(typed)], typedDays: [{ date: typed, words: 'Nursery starts' }] }));
    expect(out.map((n) => n.kind)).toEqual(['typedDay']);
  });

  it('with Reminders off a ticked day keeps the reminder time and the quiet hours', () => {
    const out = planReminders(base({ prefs: { ...DEFAULT_PREFS, enabled: false, time: { hour: 19, minute: 15 } }, libraryDays: [day(ticked)] }));
    expect(out).toEqual([expect.objectContaining({ hour: 19, minute: 15 })]);
    const passed = planReminders(base({ now: at(ticked, 20), prefs: { ...DEFAULT_PREFS, enabled: false, time: { hour: 19, minute: 15 } }, libraryDays: [day(ticked)] }));
    expect(passed).toEqual([]);
  });

  it('with Reminders on the same ticked day plans too, so the switch is not the gate for it', () => {
    const on = planReminders(base({ libraryDays: [day(ticked)] }));
    const off = planReminders(base({ prefs: { ...DEFAULT_PREFS, enabled: false, cadence: 'everyEvening' }, libraryDays: [day(ticked)] }));
    expect(onDate(on, ticked)).toEqual(onDate(off, ticked));
  });
});

describe('[BL-1319] the planner property test: no local date holds two budgeted notes', () => {
  // A seeded generator, so a failure names a case that can be run again.
  function rng(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  }

  it('over 300 random plans with typed days, ticked days, birthdays and month notes for two books', () => {
    const cadences = ['everyEvening', 'fewTimes', 'weekly', 'off'] as const;
    for (let seed = 1; seed <= 300; seed++) {
      const r = rng(seed);
      const start = plus('2026-01-01', Math.floor(r() * 700));
      const pick = (n: number) => Array.from({ length: n }, () => plus(start, Math.floor(r() * 120)));
      const born = (k: number) => plus(start, -Math.floor(r() * 900) - 1 - k);
      const children: PlannerChild[] = [
        { id: 'child-asha', name: 'Asha', birthday: born(0), included: true },
        { id: 'child-avi', name: 'Avi', birthday: born(1), included: r() > 0.3 },
      ];
      const input = base({
        now: at(start, Math.floor(r() * 23)),
        children,
        prefs: { ...DEFAULT_PREFS, enabled: r() > 0.25, paused: r() > 0.85, cadence: cadences[Math.floor(r() * cadences.length)]!, time: { hour: 7 + Math.floor(r() * 14), minute: 0 } },
        typedDays: pick(Math.floor(r() * 6)).map((date) => ({ date, words: 'Nursery starts' })),
        libraryDays: pick(Math.floor(r() * 10)).map(day),
        horizonDays: 60,
        monthHorizonDays: 120,
        planPending: Math.floor(r() * 5),
      });
      const out = planReminders(input);
      const byDate = new Map<string, number>();
      for (const n of out) byDate.set(n.date, (byDate.get(n.date) ?? 0) + 1);
      const doubled = [...byDate.entries()].filter(([, c]) => c > 1);
      expect({ seed, doubled }).toEqual({ seed, doubled: [] });
      expect(out.length).toBeLessThanOrEqual(TOTAL_MAX - (input.planPending ?? 0));
      // Every note's date is its own local date in the plan's zone.
      for (const n of out) {
        const p = zonedParts(n.fireAt, LA);
        expect(isoDate({ y: p.y, m: p.m, d: p.d })).toBe(n.date);
      }
    }
  });
});
