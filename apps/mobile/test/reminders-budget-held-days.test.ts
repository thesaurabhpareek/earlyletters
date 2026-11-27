/**
 * Held days (BL-2246; NS-32-R1b): a day note chosen for a day holds that day even when the planner drops it for lead
 * time or quiet hours, so no evening nudge fills the day. The rule lives in budget.ts `heldDays`; the planner only
 * calls it. Fixtures: the fictional family "Asha" (with Avi).
 */
import { describe, expect, it } from 'vitest';
import { chooseOnePerDay, heldDays, type NoteSource } from '../src/lib/reminders/budget';
import { DEFAULT_PREFS, planReminders, type PlanInput, type PlannedNotification, type PlannerChild, type ReminderPrefs } from '../src/lib/reminders/planner';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';

function at(iso: string, hh: number, mm: number): number {
  return zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm }, LA);
}

function plan(p: Omit<Partial<PlanInput>, 'prefs'> & { now: number; children: PlannerChild[]; prefs?: Partial<ReminderPrefs> }): PlannedNotification[] {
  return planReminders({
    now: p.now,
    timeZone: LA,
    children: p.children,
    lastSaveAt: null,
    lastForegroundAt: null,
    window: p.window,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', ...p.prefs },
  });
}

const on = (out: PlannedNotification[], date: string) => out.filter((n) => n.date === date).map((n) => n.kind);

describe('[BL-2246] heldDays in budget.ts', () => {
  const note = (source: NoteSource, date: string) => ({ source, date });

  it('names every chosen day, as a zero-padded key', () => {
    const held = heldDays([note('typedDay', '2026-12-01'), note('birthday', '2026-12-8'), note('monthAge', '2026-12-20')]);
    expect([...held].sort()).toEqual(['2026-12-01', '2026-12-08', '2026-12-20']);
  });

  it('counts 2026-12-8 and 2026-12-08 as one day', () => {
    expect([...heldDays([note('birthday', '2026-12-8'), note('monthAge', '2026-12-08')])]).toEqual(['2026-12-08']);
  });

  it('holds nothing when nothing was chosen', () => {
    expect(heldDays([]).size).toBe(0);
  });

  it('holds the day of the note the chooser kept, one key a day', () => {
    const chosen = chooseOnePerDay([note('monthAge', '2026-12-08'), note('birthday', '2026-12-08'), note('typedDay', '2026-12-09')]);
    expect([...heldDays(chosen)]).toEqual(['2026-12-08', '2026-12-09']);
  });
});

describe('[BL-2246] a dropped day note still holds its day in the plan', () => {
  it('a birthday whose 09:00 has passed is dropped, and that day gets no evening nudge', () => {
    const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2025-10-06', included: true };
    const out = plan({ now: at('2026-10-06', 10, 0), children: [asha], prefs: { time: { hour: 19, minute: 0 } } });
    expect(on(out, '2026-10-06')).toEqual([]);
    // Evenings are planned around it, so the empty day is the held day and not an empty plan.
    expect(on(out, '2026-10-07')).toEqual(['evening']);
  });

  it('a birthday that lands in quiet hours is dropped, and that day gets no evening nudge', () => {
    // Window 01:00 to 02:30: the birthday clamps to 02:30, which does not exist on 2027-03-14 in Los Angeles (the
    // spring gap), lands at 03:30 and is quiet. The 01:00 evening that day is before the gap and not quiet.
    const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-14', included: true };
    const out = plan({ now: at('2027-03-10', 12, 0), children: [asha], window: { earliest: 60, latest: 150 }, prefs: { time: { hour: 1, minute: 0 } } });
    expect(on(out, '2027-03-14')).toEqual([]);
    expect(on(out, '2027-03-13')).toEqual(['evening']);
    expect(on(out, '2027-03-15')).toEqual(['evening']);
  });

  it('a month note whose time has passed is dropped, and that day gets no evening nudge', () => {
    // The evening that day would fire at the same passed time, so the held day and the lead time agree here.
    const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2026-05-20', included: true };
    const out = plan({ now: at('2026-10-20', 20, 0), children: [avi], prefs: { time: { hour: 19, minute: 0 } } });
    expect(on(out, '2026-10-20')).toEqual([]);
    expect(on(out, '2026-10-21')).toEqual(['evening']);
  });

  it('a month note that lands in quiet hours is dropped, and that day gets no evening nudge', () => {
    // Window 01:00 to 02:30 with the reminder at 02:30: on 2027-03-14 in Los Angeles that time is in the spring gap,
    // lands at 03:30 and is quiet. A month note and an evening share the reminder time, so the evening would be quiet
    // too: this case and the passed month note guard the plan, while the birthday cases are the ones the held day decides.
    const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2026-02-14', included: true };
    const out = plan({ now: at('2027-03-10', 12, 0), children: [avi], window: { earliest: 60, latest: 150 }, prefs: { time: { hour: 2, minute: 30 } } });
    expect(on(out, '2027-03-14')).toEqual([]);
    expect(on(out, '2027-03-13')).toEqual(['evening']);
  });
});
