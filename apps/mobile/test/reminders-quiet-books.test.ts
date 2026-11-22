/// <reference types="node" />
/**
 * Quiet this book stops every reminder for that book, for this person (F12-REQ-011; NS-13-R12, NS-32-R14, J-N19).
 * The planner rule is pure and runs here; the store's quiet switch runs on a real database (node:sqlite), and the
 * plan is made from what the store hands the scheduler. Fixtures: the fictional family Asha and Avi.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { plannerChildren } = await import('../src/lib/reminders/prefs');
const { DEFAULT_PREFS, planReminders } = await import('../src/lib/reminders/planner');
const { parseIsoDate, zonedToEpoch } = await import('../src/lib/reminders/tz');
type PlannerChild = import('../src/lib/reminders/planner').PlannerChild;
type PlannedNotification = import('../src/lib/reminders/planner').PlannedNotification;
type ReminderPrefs = import('../src/lib/reminders/planner').ReminderPrefs;

const LA = 'America/Los_Angeles';
const NOW = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, LA);

// Asha's month-day is the 8th. Avi turns one on 20 October, inside the horizon, so a birthday note would be planned.
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2025-10-20', included: true };
const quietAvi: PlannerChild = { ...avi, quiet: true };

function plan(children: PlannerChild[], prefs: Partial<ReminderPrefs> = {}): PlannedNotification[] {
  return planReminders({
    now: NOW,
    timeZone: LA,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', namesOnLockScreen: true, ...prefs },
    children,
    lastSaveAt: null,
    lastForegroundAt: null,
    monthHorizonDays: 120,
    maxNotifications: 200,
  });
}

const words = (n: PlannedNotification) => `${n.title} ${n.body}`;
const notes = (p: PlannedNotification[]) => p.filter((n) => n.kind !== 'evening');

describe('[NS-13-R12] a quiet book gets no reminder', () => {
  it('a quieted book gets no month or birthday note and is never named; the other book keeps its own', () => {
    // Without quiet, Avi's book plans a birthday and month notes on the 20th (the control).
    const awake = plan([asha, avi]);
    expect(awake.some((n) => n.kind === 'birthday' && n.date === '2026-10-20')).toBe(true);
    expect(awake.some((n) => n.kind !== 'evening' && n.date.endsWith('-20'))).toBe(true);
    expect(awake.some((n) => words(n).includes('Avi'))).toBe(true);

    const p = plan([asha, quietAvi]);
    expect(p.some((n) => n.kind === 'birthday')).toBe(false);
    expect(notes(p).map((n) => n.date)).toEqual(['2026-10-08', '2026-11-08', '2026-12-08', '2027-01-08']);
    for (const n of p) expect(words(n), n.id).not.toContain('Avi');
    // Evening nudges still come for Asha's book.
    expect(p.some((n) => n.kind === 'evening')).toBe(true);
  });

  it('a parent whose every book is quiet gets nothing at all, evening nudges included; unquiet brings them back', () => {
    expect(plan([quietAvi])).toEqual([]);
    expect(plan([{ ...asha, quiet: true }, quietAvi])).toEqual([]);
    expect(plan([{ ...quietAvi, included: false }])).toEqual([]);
    // J-N19: turning quiet off brings every class back.
    const back = plan([{ ...quietAvi, quiet: false }]);
    expect(new Set(back.map((n) => n.kind))).toEqual(new Set(['evening', 'monthAge', 'birthday']));
  });
});

describe('[NS-32-R14] quiet book adds nothing', () => {
  it('adding a quieted book leaves the plan exactly as it was, whatever the settings', () => {
    const settings: Partial<ReminderPrefs>[] = [
      {},
      { namesOnLockScreen: false },
      { cadence: 'fewTimes' },
      { cadence: 'weekly' },
      { cadence: 'off' },
      { monthNotes: false },
    ];
    for (const prefs of settings) {
      const label = JSON.stringify(prefs);
      expect(plan([asha, quietAvi], prefs), label).toEqual(plan([asha], prefs));
      expect(plan([quietAvi, asha], prefs), label).toEqual(plan([asha], prefs));
      expect(plan([asha, { ...quietAvi, included: false }], prefs), label).toEqual(plan([asha], prefs));
    }
  });
});

describe('[NS-13-R12] Quiet this book on the real store reaches the planner', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-05T19:00:00.000Z', newId }).ok).toBe(true);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('quiet reaches plannerChildren, tells the store listeners (the scheduler re-plans on any change), and unquiet undoes it', () => {
    store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    const book = store.addChild({ name: 'Avi', birthday: '2025-10-20', dueDate: null, signsAs: 'Mama' });
    const planned = () => plan(plannerChildren());
    expect(planned().some((n) => n.kind === 'birthday')).toBe(true);

    const heard = vi.fn();
    const stop = store.subscribe(heard);
    store.setChildQuiet(book.id, true);
    expect(heard).toHaveBeenCalled();
    expect(plannerChildren().find((c) => c.id === book.id)).toMatchObject({ included: true, quiet: true });
    expect(planned().some((n) => n.kind === 'birthday')).toBe(false);
    for (const n of planned()) expect(words(n), n.id).not.toContain('Avi');
    // The book stays listed: quiet is not hide.
    expect(store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Avi']);

    heard.mockClear();
    store.setChildQuiet(book.id, false);
    expect(heard).toHaveBeenCalled();
    expect(plannerChildren().find((c) => c.id === book.id)?.quiet).toBe(false);
    expect(planned().some((n) => n.kind === 'birthday' && n.date === '2026-10-20')).toBe(true);
    stop();
  });
});
