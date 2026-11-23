/**
 * A typed day survives the back-off (NS-32-R9, P1; NS-13-R29). The planner makes no typed-day note yet (typed days are
 * BL-982), so this holds the two rules a typed day depends on: the back-off rule only ever filters evening nudges, and
 * the one-a-day chooser keeps a typed day over whatever the plan holds, inside the back-off and after day 35.
 * Fixtures: the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
import { chooseOnePerDay, type BudgetCandidate } from '../src/lib/reminders/budget';
import { BACKOFF_LAST_DAY, DEFAULT_PREFS, planReminders, type PlannerChild } from '../src/lib/reminders/planner';
import { addDays, isoDate, parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: null, included: true };
const ANCHOR = '2026-10-05';
const at = (iso: string, hh: number) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm: 0 }, LA);
const dayAfter = (n: number) => isoDate(addDays(parseIsoDate(ANCHOR)!, n));

describe('[NS-32-R9] typed day survives back-off', () => {
  const evenings = planReminders({
    now: at(ANCHOR, 12),
    timeZone: LA,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'weekly', days: [1] },
    children: [asha],
    anchorAt: at(ANCHOR, 9),
    lastSaveAt: null,
    lastForegroundAt: null,
  });
  const asCandidate = (n: { date: string; kind: string }): BudgetCandidate & { id: string } => ({ source: 'evening', date: n.date, id: `evening.${n.date}` });

  it('the back-off leaves no evening after day 35 and thins days 8 to 35, so there are days to test', () => {
    const offsets = evenings.map((n) => Math.round((Date.parse(n.date) - Date.parse(ANCHOR)) / 86_400_000));
    expect(offsets.length).toBeGreaterThan(0);
    expect(Math.max(...offsets)).toBeLessThanOrEqual(BACKOFF_LAST_DAY);
    expect(offsets.filter((o) => o > 7).length).toBeLessThanOrEqual(4);
  });

  it('a typed day on any day 1 to 45 after the anchor is kept, in the back-off and past day 35', () => {
    for (let day = 1; day <= 45; day++) {
      const date = dayAfter(day);
      const typed = { source: 'typedDay' as const, date, id: `typed.${date}` };
      const kept = chooseOnePerDay([...evenings.map(asCandidate), typed]).filter((c) => c.date === date);
      expect(kept.map((c) => c.id), `day ${day}`).toEqual([typed.id]);
    }
  });

  it('typed days on every day are all kept: none is dropped for being late in the back-off', () => {
    const all = Array.from({ length: 45 }, (_, i) => ({ source: 'typedDay' as const, date: dayAfter(i + 1), id: `typed.${i + 1}` }));
    const kept = chooseOnePerDay([...evenings.map(asCandidate), ...all]);
    expect(kept.map((c) => c.id)).toEqual(all.map((c) => c.id));
  });
});
