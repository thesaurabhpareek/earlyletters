/// <reference types="node" />
/**
 * Typed days (NS-18, BL-982). The planner is pure and tested with its inputs; keeping, sweeping and clearing run
 * against the real store (node:sqlite) and the real scheduler, with only the native notification module as a stateful
 * stand-in (what iOS holds, scheduled and delivered), as in test/reminders-erase.test.ts. Fixtures: the fictional
 * family Asha. The canary words are made up and never a real family's.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { title?: string; body?: string; data?: unknown } };
const os = vi.hoisted(() => ({
  permission: 'granted' as 'granted' | 'undetermined',
  scheduled: new Map<string, Req>(),
  presented: new Map<string, Req>(),
  asked: 0,
}));

vi.mock('../src/lib/days', () => ({ endDaysSession: () => true })); // reminders/session clears the days store (NS-47-R15): test/days-store.test.ts
vi.mock('../src/lib/moments', () => ({ endMomentsSession: () => true })); // and the moments file: test/moments-hooks.test.ts
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({ router: { navigate: () => {} } }));
vi.mock('expo-notifications', () => {
  const perm = () =>
    os.permission === 'granted'
      ? { granted: true, status: 'granted', canAskAgain: true, ios: { status: 2, alertStyle: 1 } }
      : { granted: false, status: 'undetermined', canAskAgain: true, ios: { status: 0, alertStyle: 1 } };
  return {
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
    SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
    AndroidImportance: { DEFAULT: 3 },
    getPermissionsAsync: async () => perm(),
    requestPermissionsAsync: async () => {
      os.asked += 1;
      return perm();
    },
    getAllScheduledNotificationsAsync: async () => [...os.scheduled.values()],
    cancelScheduledNotificationAsync: async (id: string) => void os.scheduled.delete(id),
    scheduleNotificationAsync: async (r: Req) => {
      os.scheduled.set(r.identifier, { identifier: r.identifier, content: r.content });
      return r.identifier;
    },
    getPresentedNotificationsAsync: async () => [...os.presented.values()].map((request) => ({ request })),
    dismissNotificationAsync: async (id: string) => void os.presented.delete(id),
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const { reminderCopy } = await import('@scribe/content');
const { dayNamesOn } = await import('../src/lib/reminders/prefs');
const { DEFAULT_PREFS, MONTH_HORIZON_DAYS, planReminders } = await import('../src/lib/reminders/planner');
const { reminderContent, routeForReminder } = await import('../src/lib/reminders/payload');
const { addDays, isoDate, parseIsoDate, zonedParts, zonedToEpoch } = await import('../src/lib/reminders/tz');
const typed = await import('../src/lib/reminders/typed-days');
const { APP_LOCK_KEYS } = await import('../src/lib/app-lock/prefs');

type PlanInput = import('../src/lib/reminders/planner').PlanInput;
type PlannerChild = import('../src/lib/reminders/planner').PlannerChild;

const LA = 'America/Los_Angeles';
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-07', included: true };
const at = (iso: string, hh: number, zone = LA) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm: 0 }, zone);
const plus = (iso: string, n: number) => isoDate(addDays(parseIsoDate(iso)!, n));
/** Made-up words that hold a name: if they reach anything outside the setting, a test below fails. */
const CANARY = 'Asha meets Nani zq7canary';
const FIXED = reminderCopy.neutral.typedDay;

const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  now: at('2026-11-01', 12),
  timeZone: LA,
  prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' },
  children: [asha],
  anchorAt: at('2026-11-01', 9),
  lastSaveAt: null,
  lastForegroundAt: null,
  ...over,
});
const onDate = <T extends { date: string }>(plan: T[], date: string): T[] => plan.filter((n) => n.date === date);

describe('[NS-18-R1] one notification on the typed day', () => {
  it('exactly one note that day, a typed one at the reminder time, and nothing else on that date', () => {
    const plan = planReminders(base({ typedDays: [{ date: '2026-11-05', words: 'Nursery starts' }] }));
    const day = onDate(plan, '2026-11-05');
    expect(day).toHaveLength(1);
    expect(day[0]).toMatchObject({ kind: 'typedDay', id: 'el.typed.2026-11-05', hour: 20, minute: 30 });
  });

  it('two entries for one date still make one note (the first wins); a past date makes none', () => {
    const plan = planReminders(
      base({ typedDays: [{ date: '2026-11-05', words: 'First' }, { date: '2026-11-05', words: 'Second' }, { date: '2026-10-30', words: 'Gone' }] }),
    );
    expect(onDate(plan, '2026-11-05')).toHaveLength(1);
    expect(onDate(plan, '2026-10-30')).toHaveLength(0);
  });

  it('words that are only spaces make no note, as the keeping step would refuse them', () => {
    const plan = planReminders(base({ typedDays: [{ date: '2026-11-05', words: '   ' }] }));
    expect(onDate(plan, '2026-11-05').filter((n) => n.kind === 'typedDay')).toHaveLength(0);
  });

  it('a tap on a typed day opens Home, where the words are read back unchanged (the store keeps them as typed)', () => {
    expect(routeForReminder({ source: 'scribe.reminders', kind: 'typedDay' })).toBe('/');
    expect(routeForReminder({ source: 'scribe.reminders', kind: 'monthAge' })).toBe('/book');
  });
});

describe('[NS-18-R2] the typed day replaces a reminder', () => {
  it('on a month-day with an evening nudge due, only the typed note is planned', () => {
    // Asha turns 8 months on 7 Nov 2026: a month note and an every-evening nudge would both fall on that date.
    const without = onDate(planReminders(base()), '2026-11-07');
    expect(without.map((n) => n.kind)).toEqual(['monthAge']);
    const plan = planReminders(base({ typedDays: [{ date: '2026-11-07', words: 'Grandad visits' }] }));
    expect(onDate(plan, '2026-11-07').map((n) => n.kind)).toEqual(['typedDay']);
  });

  it('on a birthday, the typed day wins too (rank 1 before birthday 2)', () => {
    const plan = planReminders(base({ now: at('2027-02-20', 12), anchorAt: at('2027-02-20', 9), typedDays: [{ date: '2027-03-07', words: 'Cake' }] }));
    expect(onDate(plan, '2027-03-07').map((n) => n.kind)).toEqual(['typedDay']);
  });

  it('more typed days than slots: the nearest are kept and the total never passes the budget', () => {
    const many = Array.from({ length: 70 }, (_, i) => ({ date: plus('2026-11-02', i), words: `Day ${i}` }));
    const plan = planReminders(base({ typedDays: many, planPending: 4 }));
    expect(plan).toHaveLength(56);
    expect(plan.every((n) => n.kind === 'typedDay')).toBe(true);
    expect(plan[0]!.date).toBe('2026-11-02');
    expect(plan[55]!.date).toBe(plus('2026-11-02', 55));
  });
});

describe('[NS-18-R3] words hidden by default', () => {
  const words = 'Asha and Nani at the park';

  it('by default the title and body are the fixed line, and the words are nowhere in the note', () => {
    const [n] = onDate(planReminders(base({ typedDays: [{ date: '2026-11-05', words }] })), '2026-11-05');
    expect({ title: n!.title, body: n!.body }).toEqual({ title: FIXED.title, body: FIXED.body });
    expect(JSON.stringify(reminderContent(n!))).not.toContain('Nani');
  });

  it('with day names on and names on, the body is the words unchanged and the title stays fixed', () => {
    const odd = '  नमस्ते, Asha!  שלום 你好 ';
    const named = { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' as const, namesOnLockScreen: true };
    const [n] = onDate(planReminders(base({ prefs: named, dayNamesOn: true, typedDays: [{ date: '2026-11-05', words: odd }] })), '2026-11-05');
    expect(n!.title).toBe(FIXED.title);
    expect(n!.body).toBe(odd);
  });

  it('[CPrivO-58] day names on with names off: the fixed line, because the words may name a child', () => {
    const [n] = onDate(planReminders(base({ dayNamesOn: true, typedDays: [{ date: '2026-11-05', words }] })), '2026-11-05');
    expect({ title: n!.title, body: n!.body }).toEqual({ title: FIXED.title, body: FIXED.body });
    expect(JSON.stringify(reminderContent(n!))).not.toContain('Asha');
  });

  it('the payload and the identifier never carry the words, whatever the switch says', () => {
    const named = { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' as const, namesOnLockScreen: true };
    for (const dayNames of [false, true]) {
      const [n] = onDate(planReminders(base({ prefs: named, dayNamesOn: dayNames, typedDays: [{ date: '2026-11-05', words: CANARY }] })), '2026-11-05');
      const c = reminderContent(n!);
      // With both switches on the body is the words, so this pass checks a note that does carry them (CPrivO-58).
      expect(n!.body).toBe(dayNames ? CANARY : FIXED.body);
      expect(c.data).toEqual({ source: 'scribe.reminders', kind: 'typedDay' });
      expect(n!.id).not.toContain('zq7canary');
    }
  });

  it('the fixed words name no child, day or count', () => {
    for (const s of [FIXED.title, FIXED.body]) {
      expect(s).not.toMatch(/\{child\}|Asha|\d/);
      expect(s.length).toBeLessThanOrEqual(110);
    }
    expect(FIXED.title.length).toBeLessThanOrEqual(40);
  });
});

describe('[NS-18-R4] back-off never drops a typed day', () => {
  const t = [{ date: '2026-12-20', words: 'Snow trip' }];
  const has = (plan: { kind: string; date: string }[]) => plan.some((n) => n.kind === 'typedDay' && n.date === '2026-12-20');

  it('past day 35 of the back-off, when no evening, month or birthday note is left', () => {
    const plan = planReminders(base({ now: at('2026-12-15', 12), anchorAt: at('2026-11-01', 9), typedDays: t }));
    expect(plan.filter((n) => n.kind !== 'typedDay')).toEqual([]);
    expect(has(plan)).toBe(true);
  });

  it('with Reminders off, or the old pause on (W-G7): only the typed day', () => {
    for (const prefs of [{ ...DEFAULT_PREFS, enabled: false }, { ...DEFAULT_PREFS, enabled: true, paused: true }]) {
      const plan = planReminders(base({ prefs, typedDays: t }));
      expect(plan.map((n) => n.kind)).toEqual(['typedDay']);
    }
    expect(planReminders(base({ prefs: { ...DEFAULT_PREFS, enabled: false } }))).toEqual([]);
  });

  it('smart quiet, every book quiet, and no book at all leave it in place', () => {
    expect(has(planReminders(base({ now: at('2026-12-20', 12), lastSaveAt: at('2026-12-20', 11), lastForegroundAt: at('2026-12-20', 11), typedDays: t })))).toBe(true);
    expect(has(planReminders(base({ children: [{ ...asha, quiet: true }], typedDays: t })))).toBe(true);
    expect(has(planReminders(base({ children: [], typedDays: t })))).toBe(true);
  });

  it('a typed day today whose time has passed is not planned (it is not sent late)', () => {
    expect(onDate(planReminders(base({ now: at('2026-11-05', 21), typedDays: [{ date: '2026-11-05', words: 'Late' }] })), '2026-11-05')).toEqual([]);
  });
});

describe('[NS-18-R5] typed words length', () => {
  const today = '2026-11-01';
  it('1 to 80 characters are kept; 0, only spaces, or 81 are refused', () => {
    expect(typed.checkTypedDay('2026-11-02', 'a', today)).toEqual({ ok: true });
    expect(typed.checkTypedDay('2026-11-02', 'a'.repeat(80), today)).toEqual({ ok: true });
    expect(typed.checkTypedDay('2026-11-02', 'a'.repeat(81), today)).toEqual({ ok: false, code: 'typed_day_too_long' });
    expect(typed.checkTypedDay('2026-11-02', '', today)).toEqual({ ok: false, code: 'typed_day_empty' });
    expect(typed.checkTypedDay('2026-11-02', '   \n', today)).toEqual({ ok: false, code: 'typed_day_empty' });
  });

  it('any script, counted as a person sees it: Devanagari, Hebrew, Chinese and a family emoji', () => {
    expect(typed.typedWordsLength('नमस्ते')).toBe(3);
    expect(typed.typedWordsLength('שלום')).toBe(4);
    expect(typed.typedWordsLength('你好')).toBe(2);
    expect(typed.typedWordsLength('\u{1F468}‍\u{1F469}‍\u{1F467}')).toBe(1);
    expect(typed.checkTypedDay('2026-11-02', 'नमस्ते'.repeat(26), today)).toEqual({ ok: true }); // 78 graphemes
    expect(typed.checkTypedDay('2026-11-02', '你'.repeat(81), today)).toEqual({ ok: false, code: 'typed_day_too_long' });
  });

  it('a day before today and a date that does not exist are refused; today is accepted', () => {
    expect(typed.checkTypedDay('2026-10-31', 'Late', today)).toEqual({ ok: false, code: 'typed_day_past' });
    expect(typed.checkTypedDay('2026-02-30', 'Never', today)).toEqual({ ok: false, code: 'typed_day_bad_date' });
    expect(typed.checkTypedDay(today, 'Today', today)).toEqual({ ok: true });
  });

  it('[BL-2247] a day past the plan horizon is refused: today and the 91 days after are kept, day 92 is not', () => {
    expect(typed.TYPED_DAY_HORIZON_DAYS).toBe(MONTH_HORIZON_DAYS);
    expect(MONTH_HORIZON_DAYS).toBe(92);
    expect(typed.checkTypedDay(plus(today, 91), 'Nursery starts', today)).toEqual({ ok: true });
    expect(plus(today, 91)).toBe('2027-01-31');
    expect(typed.checkTypedDay('2027-02-01', 'Nursery starts', today)).toEqual({ ok: false, code: 'typed_day_too_far' });
    expect(typed.checkTypedDay('2062-11-01', 'Nursery starts', today)).toEqual({ ok: false, code: 'typed_day_too_far' });
    // Across a leap day: 15 Dec 2027 plus 91 days is 15 Mar 2028.
    expect(typed.checkTypedDay('2028-03-15', 'Nursery starts', '2027-12-15')).toEqual({ ok: true });
    expect(typed.checkTypedDay('2028-03-16', 'Nursery starts', '2027-12-15')).toEqual({ ok: false, code: 'typed_day_too_far' });
    expect(typed.saveTypedDay('2027-02-01', 'Nursery starts', today)).toEqual({ ok: false, code: 'typed_day_too_far' });
  });
});

describe('typed days on the phone (real store and scheduler)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const NOW = Date.parse('2026-11-25T18:00:00.000Z');
  const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = () => {
    const p = zonedParts(Date.now(), zone());
    return isoDate({ y: p.y, m: p.m, d: p.d });
  };
  const ours = () => [...os.scheduled.values()].filter((s) => (s.content.data as { source?: string } | undefined)?.source === 'scribe.reminders');

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    typed.setTypedDaysBuildForTest(true);
    os.permission = 'granted';
    os.asked = 0;
    os.scheduled.clear();
    os.presented.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => new Date(NOW).toISOString(), newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
  });
  afterEach(async () => {
    await reminders.forgetReminders();
    typed.setTypedDaysBuildForTest(null);
    store.closeStore();
    close();
    vi.useRealTimers();
  });

  it('[NS-18-R1] the words are kept exactly as typed and read back for Home; one note is scheduled with Reminders never set (G-D09)', async () => {
    const day = plus(today(), 3);
    const words = '  Nursery starts, Asha!  ';
    expect(typed.saveTypedDay(day, words, today())).toEqual({ ok: true });
    expect(typed.typedDayWords(day)).toBe(words);
    expect(typed.readTypedDays()).toEqual([{ date: day, words }]);
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(ours().map((s) => s.identifier)).toEqual([`el.typed.${day}`]);
  });

  it('[NS-18-R1] no permission yet: nothing is scheduled and nothing asks', async () => {
    os.permission = 'undetermined';
    typed.saveTypedDay(plus(today(), 3), 'Nursery starts', today());
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(ours()).toEqual([]);
    expect(os.asked).toBe(0);
  });

  it('[NS-18-R3] the day-names switch is off by default, and App lock forces it off without changing what was chosen', () => {
    expect(dayNamesOn()).toBe(false);
    store.setSetting('notifications.dayNames', 'on');
    expect(dayNamesOn()).toBe(true);
    store.setSetting(APP_LOCK_KEYS.enabled, 'on');
    expect(dayNamesOn()).toBe(false);
    expect(store.getSetting('notifications.dayNames')).toBe('on');
  });

  it('[NS-18-R3] scheduled with the switch off, the note iOS holds has the fixed line and not one word typed', async () => {
    typed.saveTypedDay(plus(today(), 2), CANARY, today());
    await reminders.rescheduleReminders();
    expect(ours()).toHaveLength(1);
    expect(JSON.stringify([...os.scheduled.values()])).not.toContain('zq7canary');
    expect(ours()[0]!.content).toMatchObject({ title: FIXED.title, body: FIXED.body });
  });

  it('[NS-18-R3] a note scheduled with the words is replaced by the fixed line once App lock turns on', async () => {
    store.setSetting('notifications.dayNames', 'on');
    store.setSetting('notifications.lockScreenNames', 'on');
    typed.saveTypedDay(plus(today(), 2), CANARY, today());
    await reminders.rescheduleReminders();
    expect(ours()[0]!.content).toMatchObject({ title: FIXED.title, body: CANARY });
    store.setSetting(APP_LOCK_KEYS.enabled, 'on');
    await reminders.rescheduleReminders();
    expect(ours()).toHaveLength(1);
    expect(JSON.stringify([...os.scheduled.values()])).not.toContain('zq7canary');
    expect(ours()[0]!.content).toMatchObject({ title: FIXED.title, body: FIXED.body });
  });

  it('[CPrivO-58] a note scheduled with the words is replaced by the fixed line once names go off, with App lock off', async () => {
    store.setSetting('notifications.dayNames', 'on');
    store.setSetting('notifications.lockScreenNames', 'on');
    typed.saveTypedDay(plus(today(), 2), CANARY, today());
    await reminders.rescheduleReminders();
    expect(ours()[0]!.content).toMatchObject({ title: FIXED.title, body: CANARY });
    reminders.writePrefs({ namesOnLockScreen: false });
    expect(store.getSetting(APP_LOCK_KEYS.enabled)).toBeNull();
    expect(dayNamesOn()).toBe(true);
    await reminders.rescheduleReminders();
    expect(ours()).toHaveLength(1);
    expect(JSON.stringify([...os.scheduled.values()])).not.toContain('zq7canary');
    expect(ours()[0]!.content).toMatchObject({ title: FIXED.title, body: FIXED.body });
  });

  it('[CPrivO-58] names, day names or App lock going off dismisses a delivered typed-day note with the words, and nothing else', async () => {
    const shown = (identifier: string, body: string, data: unknown): Req => ({ identifier, content: { title: FIXED.title, body, data } });
    const off: [string, () => void][] = [
      ['names off', () => store.setSetting('notifications.lockScreenNames', 'off')],
      ['day names off', () => store.setSetting('notifications.dayNames', 'off')],
      ['App lock on', () => store.setSetting(APP_LOCK_KEYS.enabled, 'on')],
    ];
    for (const [label, turnOff] of off) {
      store.setSetting('notifications.dayNames', 'on');
      store.setSetting('notifications.lockScreenNames', 'on');
      store.setSetting(APP_LOCK_KEYS.enabled, 'off');
      await reminders.rescheduleReminders();
      os.presented.clear();
      const delivered = [
        shown(`el.typed.${plus(today(), -1)}`, CANARY, { source: 'scribe.reminders', kind: 'typedDay' }),
        shown(`el.typed.${today()}`, FIXED.body, { source: 'scribe.reminders', kind: 'typedDay' }),
        shown('el.month.2026-11-01', 'Asha is 8 months', { source: 'scribe.reminders', kind: 'monthAge' }),
        shown('someone-else', CANARY, { source: 'another.app', kind: 'typedDay' }),
      ];
      for (const d of delivered) os.presented.set(d.identifier, d);
      // While the words may show, a re-plan leaves Notification Center alone.
      await reminders.rescheduleReminders();
      expect(os.presented.size, label).toBe(4);
      turnOff();
      await reminders.rescheduleReminders();
      expect([...os.presented.keys()], label).toEqual([`el.typed.${today()}`, 'el.month.2026-11-01', 'someone-else']);
    }
  });

  it('the build switch off plans no typed day and cancels a pending one; the words stay on the phone', async () => {
    const day = plus(today(), 2);
    typed.saveTypedDay(day, 'Nursery starts', today());
    await reminders.rescheduleReminders();
    expect(ours()).toHaveLength(1);
    typed.setTypedDaysBuildForTest(false);
    reminders.writePrefs({ time: { hour: 19, minute: 0 } }); // any change re-plans
    await reminders.rescheduleReminders();
    expect(ours()).toEqual([]);
    expect(typed.typedDayWords(day)).toBe('Nursery starts');
  });

  it('[NS-18-R6] typed days removed: sign-out clears every typed day, the day-names switch and their notes', async () => {
    store.setSetting('notifications.dayNames', 'on');
    typed.saveTypedDay(plus(today(), 2), CANARY, today());
    typed.saveTypedDay(plus(today(), 9), 'Grandad visits', today());
    await reminders.rescheduleReminders();
    expect(ours()).toHaveLength(2);
    const delivered = ours()[0]!;
    os.presented.set(delivered.identifier, delivered);

    await reminders.settleReminderSession('0199a5b0-0000-7000-8000-00000000a5a1', null);

    expect(store.settingKeysWithPrefix('typedDay.')).toEqual([]);
    expect(store.getSetting('notifications.dayNames')).toBeNull();
    expect(ours()).toEqual([]);
    expect([...os.presented.keys()]).toEqual([]);
  });

  it('[NS-18-R6] typed days removed: another account signing in on the same phone never sees them', async () => {
    typed.saveTypedDay(plus(today(), 2), 'Nursery starts', today());
    await reminders.settleReminderSession('0199a5b0-0000-7000-8000-00000000a5a1', '0199a5b0-0000-7000-8000-00000000a5a2');
    expect(typed.readTypedDays()).toEqual([]);
  });

  it('[NS-18-R6] typed days removed: Erase everything deletes every typed-day key', () => {
    typed.saveTypedDay(plus(today(), 2), 'Nursery starts', today());
    expect(store.eraseEverythingLocal(() => {}, () => {})).toBe('erased');
    expect(store.settingKeysWithPrefix('typedDay.')).toEqual([]);
  });

  it('[NS-18-R6] account deletion ends the session through the same sign-out, so it clears typed days the same way (source)', () => {
    const src = (rel: string) => readFileSync(join(__dirname, '..', 'src', rel), 'utf8');
    expect(src('lib/account-deletion/use-account-deletion.ts')).toContain('signOut: auth.signOut');
    expect(src('lib/reminders/session.ts')).toMatch(/for \(const key of REMINDER_SETTING_KEYS\) deleteSetting\(key\);\s*\} catch \{[^}]*\}\s*try \{\s*clearTypedDays\(\);/);
  });

  it('[NS-18-R7] typed words do not linger: kept on the day, gone the day after, at the next plan', async () => {
    const day = plus(today(), 1);
    typed.saveTypedDay(day, 'Nursery starts', today());
    expect(typed.sweepPastTypedDays(today())).toBe(0);
    expect(typed.sweepPastTypedDays(day)).toBe(0); // on the day itself: Home still shows the words after the tap
    vi.setSystemTime(NOW + 2 * 86_400_000); // the day after
    await reminders.rescheduleReminders();
    expect(typed.typedDayWords(day)).toBeNull();
    expect(store.settingKeysWithPrefix('typedDay.')).toEqual([]);
  });

  it('[NS-18-R7] a key in the family that is not a real date is swept too, and an untouched list writes nothing', () => {
    store.setSetting('typedDay.not-a-date', 'x');
    store.setSetting('typedDay.2026-02-30', 'x');
    expect(typed.sweepPastTypedDays(today())).toBe(2);
    let told = 0;
    const stop = store.subscribe(() => void told++);
    expect(typed.sweepPastTypedDays(today())).toBe(0);
    stop();
    expect(told).toBe(0);
  });

  it('[NS-18-R8] typed words never logged: the canary reaches no console line, error code, identifier or payload', async () => {
    const lines: string[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void lines.push(a.map(String).join(' '))));
    try {
      const day = plus(today(), 2);
      const refused = [typed.saveTypedDay(day, `${CANARY} ${'x'.repeat(80)}`, today()), typed.saveTypedDay(plus(today(), -3), CANARY, today())];
      typed.saveTypedDay(day, CANARY, today());
      store.setSetting('notifications.dayNames', 'on'); // even shown on the lock screen, never in an id or the data
      await reminders.rescheduleReminders();
      const scheduled = ours();
      typed.deleteTypedDay(day);
      await reminders.rescheduleReminders();
      typed.saveTypedDay(plus(today(), 4), CANARY, today());
      await reminders.settleReminderSession('0199a5b0-0000-7000-8000-00000000a5a1', null);

      expect(JSON.stringify(refused)).not.toContain('zq7canary');
      expect(scheduled.map((s) => `${s.identifier} ${JSON.stringify(s.content.data)}`).join('\n')).not.toContain('zq7canary');
      expect(lines.join('\n')).not.toContain('zq7canary');
    } finally {
      spies.forEach((s) => s.mockRestore());
    }
  });

  it('[NS-18-R8] the typed-days module has no log, analytics, crash report or network path at all (source)', () => {
    const code = readFileSync(join(__dirname, '..', 'src', 'lib', 'reminders', 'typed-days.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code).not.toMatch(/console\.|analytics|sentry|crash|fetch\(|Linking|supabase|track\(/i);
    expect([...code.matchAll(/from '([^']+)'/g)].map((m) => m[1]).sort()).toEqual(['../store', './planner', './tz']);
  });
});
