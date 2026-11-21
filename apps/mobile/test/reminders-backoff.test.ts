/// <reference types="node" />
/**
 * The pre-scheduled back-off and the anchor (BL-943; NS-13 section 3a; NS-13-R3, R4, R8, R18, R27).
 * Days are counted from the anchor's local date. Fixtures: the fictional family Asha. Each P0 row has a mutant, run by
 * hand and listed in the PR (not here).
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
const { anchorAt, lastOwnSaveAt, writeOnSince, REMINDER_SETTING_KEYS } = await import('../src/lib/reminders/prefs');
const { BACKOFF_LAST_DAY, DEFAULT_PREFS, planReminders } = await import('../src/lib/reminders/planner');
const { dayNumber, parseIsoDate, zonedToEpoch } = await import('../src/lib/reminders/tz');
type PlannerChild = import('../src/lib/reminders/planner').PlannerChild;
type ReminderPrefs = import('../src/lib/reminders/planner').ReminderPrefs;

const LA = 'America/Los_Angeles';
const at = (iso: string, hh = 12) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm: 0 }, LA);
const offset = (anchor: string, date: string) => dayNumber(parseIsoDate(date)!) - dayNumber(parseIsoDate(anchor)!);

// Asha has no birth date here, so only evening nudges are planned; Avi (asha-family fixture) has notes.
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: null, included: true };
const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2025-10-20', included: true };

function plan(anchor: string | null, nowIso: string, prefs: Partial<ReminderPrefs> = {}, children: PlannerChild[] = [asha]) {
  return planReminders({
    now: at(nowIso),
    timeZone: LA,
    prefs: { ...DEFAULT_PREFS, enabled: true, ...prefs },
    children,
    anchorAt: anchor === null ? null : at(anchor, 9),
    lastSaveAt: null,
    lastForegroundAt: null,
  });
}
const evenings = (p: ReturnType<typeof plan>) => p.filter((n) => n.kind === 'evening').map((n) => n.date);

describe('[NS-13-R3] unanswered reminders back off', () => {
  it('every evening: seven in days 1 to 7, then one in each 7-day block (days 8, 15, 22, 29)', () => {
    const dates = evenings(plan('2026-10-05', '2026-10-05', { cadence: 'everyEvening' }));
    expect(dates).toEqual([
      '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12',
      '2026-10-13', '2026-10-20', '2026-10-27', '2026-11-03',
    ]);
    expect(dates.map((d) => offset('2026-10-05', d)).slice(7)).toEqual([8, 15, 22, 29]);
  });
  it('a few times a week (Tuesday, Saturday): the first chosen weekday of each block, not the second', () => {
    // Anchor Wednesday 7 Oct. Days 1 to 7 hold Saturday 10 Oct and Tuesday 13 Oct; blocks start on Wednesdays.
    const dates = evenings(plan('2026-10-07', '2026-10-07', { cadence: 'fewTimes', days: [2, 6] }));
    expect(dates).toEqual(['2026-10-10', '2026-10-13', '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07']);
    expect(dates.slice(2).map((d) => offset('2026-10-07', d))).toEqual([10, 17, 24, 31]);
  });
  it('weekly goes straight to the four-week rule: its one weekday, once a block', () => {
    const dates = evenings(plan('2026-10-05', '2026-10-05', { cadence: 'weekly', weeklyDay: 6 }));
    expect(dates).toEqual(['2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07']);
  });
  it('the anchor day itself gets no nudge, and a later anchor moves every window', () => {
    expect(evenings(plan('2026-10-05', '2026-10-05', { cadence: 'everyEvening' }))).not.toContain('2026-10-05');
    const later = evenings(plan('2026-10-20', '2026-10-20', { cadence: 'everyEvening' }));
    expect(later[0]).toBe('2026-10-21');
    expect(later).toHaveLength(11);
  });
});

describe('[NS-13-R4] reminders stop on their own', () => {
  it('nothing of any class after day 35, month and birthday notes included', () => {
    const p = plan('2026-10-05', '2026-10-05', { cadence: 'everyEvening' }, [asha, avi]);
    expect(p.some((n) => n.kind === 'birthday' && n.date === '2026-10-20')).toBe(true);
    for (const n of p) expect(offset('2026-10-05', n.date), n.id).toBeLessThanOrEqual(BACKOFF_LAST_DAY);
    // A birthday on day 36 and a month note on day 40 are not planned.
    const late = plan('2026-09-14', '2026-09-14', { cadence: 'everyEvening' }, [avi]); // 20 Oct is day 36
    expect(late.some((n) => n.date === '2026-10-20')).toBe(false);
    expect(late.some((n) => n.kind !== 'evening' && offset('2026-09-14', n.date) > BACKOFF_LAST_DAY)).toBe(false);
  });
  it('month and birthday notes are held to days 0 to 35 from the anchor, and begin at day 0', () => {
    const p = planReminders({ now: at('2026-10-20', 7), timeZone: LA, prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'off' }, children: [avi], anchorAt: at('2026-10-20', 6) });
    expect(p.map((n) => `${n.kind}:${n.date}`)).toContain('birthday:2026-10-20'); // day 0 is allowed for notes
  });
});

describe('[NS-13-R18] nothing after day 35 when untouched', () => {
  it('a plan made on day 0 holds nothing after day 35, whatever the cadence or books', () => {
    for (const cadence of ['everyEvening', 'fewTimes', 'weekly'] as const) {
      const p = plan('2026-10-05', '2026-10-05', { cadence }, [asha, avi]);
      expect(p.length, cadence).toBeGreaterThan(0);
      for (const n of p) expect(offset('2026-10-05', n.date), n.id).toBeLessThanOrEqual(35);
    }
  });
  it('with the app never opened, a clock on day 36 or later plans nothing at all', () => {
    for (const now of ['2026-11-10', '2026-11-11', '2027-03-01']) {
      expect(plan('2026-10-05', now, { cadence: 'everyEvening' }, [asha, avi]), now).toEqual([]);
    }
    expect(plan('2026-10-05', '2026-11-03', { cadence: 'everyEvening' }).length).toBeGreaterThan(0); // day 29, the last block, still plans
  });
  it('turning reminders on again, or a new letter, restarts the count', () => {
    expect(plan('2026-11-10', '2026-11-10', { cadence: 'everyEvening' })).not.toEqual([]);
  });
  it('without a known anchor the old horizon holds (no sudden stop for a phone that has no anchor yet)', () => {
    expect(plan(null, '2026-12-20', { cadence: 'everyEvening' }).length).toBeGreaterThan(0);
  });
});

describe('[NS-13-R8] no reminder after a made letter', () => {
  it('a letter made today moves day 0 to today: no nudge today, and the next day is day 1', () => {
    const p = planReminders({
      now: at('2026-10-05', 12),
      timeZone: LA,
      prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' },
      children: [asha],
      anchorAt: at('2026-10-05', 11),
      lastSaveAt: at('2026-10-05', 11),
    });
    expect(evenings(p)[0]).toBe('2026-10-06');
    expect(evenings(p)).not.toContain('2026-10-05');
  });
});

describe('[NS-13-R27] the anchor counts a made draft', () => {
  let close: () => void = () => {};
  let seq = 0;
  let nowIso = '2026-10-05T19:00:00.000Z';
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const draft = (childId: string) => store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha laughed.' });

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    nowIso = '2026-10-05T19:00:00.000Z';
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => nowIso, newId }).ok).toBe(true);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('is null with no letter and no onSince; a draft waiting at Keep becomes the anchor', () => {
    const book = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    expect(anchorAt()).toBeNull();
    draft(book.id);
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-05T19:00:00.000Z'));
    expect(anchorAt()).toBe(Date.parse('2026-10-05T19:00:00.000Z'));
  });
  it('a draft being let go (discarding) never counts', () => {
    const book = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    const d = draft(book.id);
    expect(store.beginDiscard(d.id)).toBe(true);
    expect(lastOwnSaveAt()).toBeNull();
    expect(anchorAt()).toBeNull();
  });
  it('the anchor is the later of the newest letter and onSince, either way round', () => {
    const book = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    draft(book.id);
    writeOnSince(Date.parse('2026-10-09T00:00:00.000Z'));
    expect(anchorAt()).toBe(Date.parse('2026-10-09T00:00:00.000Z'));
    writeOnSince(Date.parse('2026-10-01T00:00:00.000Z'));
    expect(anchorAt()).toBe(Date.parse('2026-10-05T19:00:00.000Z'));
  });
  it('onSince is a reminder setting, so sign-out clears it with the rest (NS-13-R14)', () => {
    expect(REMINDER_SETTING_KEYS).toContain('reminders.onSince');
  });
});
