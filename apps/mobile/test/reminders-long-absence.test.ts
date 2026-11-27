/**
 * BL-428: the long-absence case for the pure planner. A family that has not opened the app for 60 or 400 days, and
 * then comes back. What the planner does today (planner.ts, NS-13 section 3a back-off):
 * - with a known anchor (the newest made letter, or the moment reminders were last turned on), evening, month and
 *   birthday notes stop after day 35 from it, and an app open alone does not move the anchor, so a plan made on return
 *   holds only the days the parent asked for themselves (typed days and ticked library days);
 * - nothing missed is caught up: no note is ever planned in the past, and there is at most one note a local day;
 * - the budget cap (60 in total, plan notices first) holds whatever the gap;
 * - a new letter restarts the count from day 0, with the cadence on days 1 to 7 and one a week after.
 * The planner is read only here. Gaps against the BL-428 row are the it.todo entries at the end.
 * Fixtures: the fictional family Asha, with Avi.
 */
import { describe, expect, it } from 'vitest';
import { budgetedSlots, PLAN_MAX, TOTAL_MAX } from '../src/lib/reminders/budget';
import { BACKOFF_LAST_DAY, DEFAULT_PREFS, planReminders, type PlanInput, type PlannedNotification, type PlannerChild, type ReminderPrefs } from '../src/lib/reminders/planner';
import { addDays, dayNumber, isoDate, parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const TODAY = '2026-11-27';
const HOUR = 3_600_000;

const day = (iso: string, n: number) => isoDate(addDays(parseIsoDate(iso)!, n));
const at = (iso: string, hh = 12, mm = 0) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm }, LA);
const NOW = at(TODAY);

// Asha turns one three days after the return (30 Nov); Avi's month-day is the 15th.
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2025-11-30', included: true };
const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2026-06-15', included: true };

function plan(input: Partial<Omit<PlanInput, 'prefs'>> & { prefs?: Partial<ReminderPrefs> } = {}): PlannedNotification[] {
  const { prefs, ...rest } = input;
  return planReminders({
    now: NOW,
    timeZone: LA,
    children: [asha, avi],
    lastSaveAt: null,
    lastForegroundAt: null,
    ...rest,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', monthNotes: true, ...prefs },
  });
}

/** The properties every plan keeps after a long absence: nothing past, one a local day, inside the budget. */
function expectSane(p: PlannedNotification[], planPending = PLAN_MAX) {
  expect(p.length).toBeLessThanOrEqual(budgetedSlots(planPending));
  expect(p.length).toBeLessThanOrEqual(TOTAL_MAX);
  for (const n of p) expect(n.fireAt, n.id).toBeGreaterThan(NOW);
  for (const n of p) expect(dayNumber(parseIsoDate(n.date)!), n.id).toBeGreaterThanOrEqual(dayNumber(parseIsoDate(TODAY)!));
  expect(new Set(p.map((n) => n.date)).size).toBe(p.length);
  expect(new Set(p.map((n) => n.id)).size).toBe(p.length);
  expect([...p].sort((a, b) => a.fireAt - b.fireAt)).toEqual(p);
}

describe('[BL-428] a long absence: the plan made on return', () => {
  for (const gap of [60, 400]) {
    const lastLetterDay = day(TODAY, -gap);

    it(`${gap} days since the last letter: no evening, month or birthday note, so no burst on return`, () => {
      const p = plan({ anchorAt: at(lastLetterDay, 19), lastSaveAt: at(lastLetterDay, 19) });
      expect(p).toEqual([]);
      // Asha's first birthday, three days after the return, is past day 35 from the anchor too (NS-13-R4, R18).
      expect(p.some((n) => n.kind === 'birthday')).toBe(false);
    });

    it(`${gap} days away: opening the app alone changes nothing (the anchor is a letter or turning on, not an open)`, () => {
      const p = plan({ anchorAt: at(lastLetterDay, 19), lastSaveAt: at(lastLetterDay, 19), lastForegroundAt: NOW });
      expect(p).toEqual([]);
    });

    it(`${gap} days away: typed and ticked days still come, none from the absence, nearest first and one a day`, () => {
      const p = plan({
        anchorAt: at(lastLetterDay, 19),
        lastSaveAt: at(lastLetterDay, 19),
        typedDays: [
          { date: day(TODAY, -10), words: 'Nani visits' },
          { date: day(TODAY, -1), words: 'First steps' },
          { date: day(TODAY, 2), words: 'Zoya comes over' },
          { date: day(TODAY, 9), words: 'Kiran turns three' },
        ],
        libraryDays: [{ date: day(TODAY, -5) }, { date: day(TODAY, 2) }, { date: day(TODAY, 4) }],
      });
      expectSane(p);
      expect(p.map((n) => `${n.kind}:${n.date}`)).toEqual([`typedDay:${day(TODAY, 2)}`, `libraryDay:${day(TODAY, 4)}`, `typedDay:${day(TODAY, 9)}`]);
    });

    it(`${gap} days away: the budget cap holds with more typed days than slots`, () => {
      const typedDays = Array.from({ length: 90 }, (_, i) => ({ date: day(TODAY, i + 1), words: 'A day for the book' }));
      const anchored = { anchorAt: at(lastLetterDay, 19), lastSaveAt: at(lastLetterDay, 19), typedDays };
      const p = plan(anchored);
      expectSane(p);
      expect(p).toHaveLength(budgetedSlots(PLAN_MAX));
      // Nearest first: the kept days are the first ones, the rest wait for a later plan.
      expect(p.at(-1)!.date).toBe(day(TODAY, budgetedSlots(PLAN_MAX)));
      // With no plan notices pending, the whole 60.
      const none = plan({ ...anchored, planPending: 0 });
      expectSane(none, 0);
      expect(none).toHaveLength(TOTAL_MAX);
    });

    it(`${gap} days away, then a letter today: the count restarts at day 0, with no catch-up`, () => {
      const madeAt = NOW - HOUR;
      const p = plan({ anchorAt: madeAt, lastSaveAt: madeAt, lastLetter: { at: madeAt, kind: null } });
      expectSane(p);
      const evenings = p.filter((n) => n.kind === 'evening').map((n) => n.date);
      // Day 0 has no nudge and the 20 hours after the save stay quiet; days 1 to 7 at most one an evening.
      expect(evenings).not.toContain(TODAY);
      expect(evenings[0]).toBe(day(TODAY, 1));
      expect(evenings.filter((d) => d <= day(TODAY, 7)).length).toBeLessThanOrEqual(7);
      // After day 7, one in each 7-day block: at most four more, so eleven at most for every evening.
      expect(evenings.filter((d) => d > day(TODAY, 7)).length).toBeLessThanOrEqual(4);
      expect(evenings.length).toBeLessThanOrEqual(11);
      // The birthday three days on is back inside the window, at 09:00, and takes that day instead of the evening.
      expect(p.find((n) => n.date === '2026-11-30')).toMatchObject({ kind: 'birthday', hour: 9, minute: 0 });
      for (const n of p) expect(dayNumber(parseIsoDate(n.date)!) - dayNumber(parseIsoDate(TODAY)!), n.id).toBeLessThanOrEqual(BACKOFF_LAST_DAY);
    });

    it(`${gap} days away, then reminders turned on again: the same restart, from the moment they were turned on`, () => {
      const p = plan({ anchorAt: NOW, lastSaveAt: at(lastLetterDay, 19) });
      expectSane(p);
      expect(p.filter((n) => n.kind === 'evening').length).toBeGreaterThan(0);
      expect(p.some((n) => n.kind === 'evening' && n.date === TODAY)).toBe(false);
    });

    it(`${gap} days away with no anchor known: the old horizons, 3 weeks of evenings, nothing in the past`, () => {
      const p = plan({ anchorAt: null, lastSaveAt: at(lastLetterDay, 19), lastForegroundAt: at(lastLetterDay, 19) });
      expectSane(p);
      const evenings = p.filter((n) => n.kind === 'evening');
      expect(evenings.length).toBeGreaterThan(0);
      // Evening nudges reach 21 days ahead (today to day 20), never further.
      for (const n of evenings) expect(n.date <= day(TODAY, 20), n.id).toBe(true);
      // Every evening means one a day, so this is the upper bound for the horizon, never a pile on one day.
      expect(evenings.length).toBeLessThanOrEqual(21);
    });
  }

  // Gaps against the BL-428 row, left for its owner: planner.ts is owned by another stream and is not changed here.
  it.todo('BL-428: the row says reminders are planned about 3 weeks ahead; with a known anchor the planner plans to day 35 from it, not 3 weeks from now');
  it.todo('BL-428: the row says reminders refresh when the app opens; after day 35 an app open alone plans nothing until a letter is made or reminders are turned on again');
  it.todo('BL-428: the row asks for the absence behaviour to be stated; planner.ts says no screen says so');
});
