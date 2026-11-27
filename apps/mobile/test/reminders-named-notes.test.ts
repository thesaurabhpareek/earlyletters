/// <reference types="node" />
/**
 * Named notes cleared when names go off (FU-11b) and the day-names switch under App lock (BL-1009). A re-plan replaces
 * only what is still scheduled, so a month, birthday or evening note delivered while names were on keeps a child's name
 * in Notification Center after names go off. The scheduler dismisses those, once per change, by their text: a delivered
 * note of ours whose title or body is not on the name-free allowlists (payload.ts `publicTitleOk`, `publicBodyOk`).
 * Runs against the real store (node:sqlite) and the real scheduler, with only the native notification module as a
 * stateful stand-in, as in test/reminders-typed-days.test.ts. Fixtures: the fictional family Asha, with Avi.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { title?: string; body?: string; data?: unknown } };
const os = vi.hoisted(() => ({
  scheduled: new Map<string, Req>(),
  presented: new Map<string, Req>(),
  /** How often Notification Center was read (only the dismissals read it). */
  presentedReads: 0,
  dismissed: [] as string[],
  /** Makes the read of what iOS holds throw, so a re-plan fails before it replaces anything. */
  failScheduledRead: false,
}));

vi.mock('../src/lib/days', () => ({ endDaysSession: () => true }));
vi.mock('../src/lib/moments', () => ({ endMomentsSession: () => true }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({ router: { navigate: () => {} } }));
vi.mock('expo-notifications', () => {
  const perm = () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2, alertStyle: 1 } });
  return {
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
    SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
    AndroidImportance: { DEFAULT: 3 },
    getPermissionsAsync: async () => perm(),
    requestPermissionsAsync: async () => perm(),
    getAllScheduledNotificationsAsync: async () => {
      if (os.failScheduledRead) throw new Error('not now');
      return [...os.scheduled.values()];
    },
    cancelScheduledNotificationAsync: async (id: string) => void os.scheduled.delete(id),
    scheduleNotificationAsync: async (r: Req) => {
      os.scheduled.set(r.identifier, { identifier: r.identifier, content: r.content });
      return r.identifier;
    },
    getPresentedNotificationsAsync: async () => {
      os.presentedReads += 1;
      return [...os.presented.values()].map((request) => ({ request }));
    },
    dismissNotificationAsync: async (id: string) => {
      os.dismissed.push(id);
      os.presented.delete(id);
    },
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const { reminderCopy, en } = await import('@scribe/content');
const { dayNamesOn, REMINDER_SETTING_KEYS } = await import('../src/lib/reminders/prefs');
const { publicBodyOk, publicTitleOk } = await import('../src/lib/reminders/payload');
const typed = await import('../src/lib/reminders/typed-days');
const { APP_LOCK_KEYS } = await import('../src/lib/app-lock/prefs');
const { isoDate, zonedParts, addDays, parseIsoDate } = await import('../src/lib/reminders/tz');

const SOURCE = 'scribe.reminders';
const N = reminderCopy.neutral;
const NAMES = 'notifications.lockScreenNames';
const DAY_NAMES = 'notifications.dayNames';
const note = (identifier: string, title: string, body: string, data?: unknown): Req => ({
  identifier,
  content: { title, body, ...(data === undefined ? {} : { data }) },
});
/** Delivered while names were on: each names a child, in the title, the body or both (the built names-on copy). */
const named = () => [
  note('el.month.2026-11-01', en.notifications.monthOpen.title.replace('{month}', '8'), en.notifications.monthOpen.body.replace('{child}', 'Asha'), { source: SOURCE, kind: 'monthAge' }),
  note('el.birthday.2026-03-01', en.notifications.birthday.title.replace('{child}', 'Asha'), en.notifications.birthday.body, { source: SOURCE, kind: 'birthday' }),
  note('el.evening.2026-11-24', en.notifications.evening[0]!.title.replace('{child}', 'Avi'), en.notifications.evening[0]!.body.replace('{child}', 'Avi'), { source: SOURCE, kind: 'evening' }),
  // The title is a name-free one; the body names the child.
  note('el.evening.2026-11-22', en.notifications.evening[3]!.title, en.notifications.evening[3]!.body.replace('{child}', 'Asha'), { source: SOURCE, kind: 'evening' }),
];
/** Ours and name-free (planned with names off): these stay. */
const nameFree = () => [
  note('el.month.2026-10-01', N.monthOpen.title, N.monthOpen.body, { source: SOURCE, kind: 'monthAge' }),
  note('el.evening.2026-11-23', N.evening[7]!.title.replace('{weekday}', 'Monday'), N.evening[7]!.body, { source: SOURCE, kind: 'evening' }),
  note('el.typed.2026-11-25', N.typedDay.title, N.typedDay.body, { source: SOURCE, kind: 'typedDay' }),
  note('el.day.2026-11-26', N.libraryDay.title, N.libraryDay.body, { source: SOURCE, kind: 'libraryDay' }),
];
/** Not ours, whatever they say: these stay. */
const foreign = () => [
  note('someone-else', 'Happy birthday to Asha', 'A note from another app', { source: 'another.app', kind: 'birthday' }),
  note('plan.trial-ends', 'Asha and Avi', 'A plan notice', { source: 'scribe.plan', kind: 'trialEnds' }),
  note('no-data-other-id', 'Avi', 'No data, not our id'),
];
const present = (list: Req[]) => {
  for (const n of list) os.presented.set(n.identifier, n);
};
const ids = (list: Req[]) => list.map((n) => n.identifier);

describe('[FU-11b] named notes cleared when names go off (real store and scheduler)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const NOW = Date.parse('2026-11-25T18:00:00.000Z');
  const namesOn = () => store.setSetting(NAMES, 'on');

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    os.presentedReads = 0;
    os.dismissed = [];
    os.failScheduledRead = false;
    os.scheduled.clear();
    os.presented.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => new Date(NOW).toISOString(), newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    reminders.writePrefs({ enabled: true, cadence: 'everyEvening', monthNotes: true });
  });
  afterEach(async () => {
    await reminders.forgetReminders();
    typed.setTypedDaysBuildForTest(null);
    store.closeStore();
    close();
    vi.useRealTimers();
  });

  it('the fixtures are what they claim: the named ones fail the allowlists, the name-free ones pass', () => {
    for (const n of named()) expect(publicTitleOk(n.content.title!) && publicBodyOk(n.content.body!), n.identifier).toBe(false);
    for (const n of nameFree()) expect(publicTitleOk(n.content.title!) && publicBodyOk(n.content.body!), n.identifier).toBe(true);
  });

  it('names going from on to off dismisses our delivered month, birthday and evening notes that name a child, and nothing else', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    present([...named(), ...nameFree(), ...foreign()]);
    // While names may show, a re-plan leaves Notification Center alone.
    await reminders.rescheduleReminders();
    expect(os.presented.size).toBe(named().length + nameFree().length + foreign().length);
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect(os.dismissed.sort()).toEqual(ids(named()).sort());
    expect([...os.presented.keys()]).toEqual([...ids(nameFree()), ...ids(foreign())]);
  });

  it('App lock turning on counts as names going off: the same notes go, with the stored names choice kept', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    present([...named(), ...nameFree(), ...foreign()]);
    store.setSetting(APP_LOCK_KEYS.enabled, 'on');
    await reminders.rescheduleReminders();
    expect(os.dismissed.sort()).toEqual(ids(named()).sort());
    expect([...os.presented.keys()]).toEqual([...ids(nameFree()), ...ids(foreign())]);
    expect(store.getSetting(NAMES)).toBe('on'); // names come back when the lock goes (prefs.ts, F17-REQ-015)
  });

  it('a delivered note ours by id alone, or by data alone, is dismissed too; our other kinds are not', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    const title = en.notifications.birthday.title.replace('{child}', 'Asha');
    present([
      note('el.birthday.2026-03-01', title, en.notifications.birthday.body), // our id, no data
      note('older-birthday-note', title, en.notifications.birthday.body, { source: SOURCE, kind: 'birthday' }), // our data, not our id
      note('el.day.2026-11-26', title, en.notifications.birthday.body, { source: SOURCE, kind: 'libraryDay' }), // another kind of ours: stays
    ]);
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect([...os.presented.keys()]).toEqual(['el.day.2026-11-26']);
  });

  it('fails closed: a delivered note of ours of a named kind whose title or body reads back empty is dismissed', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    present([
      note('el.month.2026-11-01', '', N.monthOpen.body, { source: SOURCE, kind: 'monthAge' }), // empty title
      note('el.evening.2026-11-24', N.evening[0]!.title, '', { source: SOURCE, kind: 'evening' }), // empty body
      { identifier: 'el.birthday.2026-03-01', content: { data: { source: SOURCE, kind: 'birthday' } } }, // no text returned
      note('el.day.2026-11-26', '', '', { source: SOURCE, kind: 'libraryDay' }), // ours, but never a name: stays
      note('someone-else', '', '', { source: 'another.app', kind: 'birthday' }), // not ours: stays
    ]);
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect(os.dismissed.sort()).toEqual(['el.birthday.2026-03-01', 'el.evening.2026-11-24', 'el.month.2026-11-01']);
    expect([...os.presented.keys()]).toEqual(['el.day.2026-11-26', 'someone-else']);
  });

  it('fires once per change: later re-plans with names still off never read Notification Center or dismiss again', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    const readsWhileOn = os.presentedReads;
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect(os.presentedReads).toBe(readsWhileOn + 1);
    // A named note that shows up now (one iOS held past the change) is left to the next change: no read at every re-plan.
    present(named());
    reminders.writePrefs({ time: { hour: 19, minute: 0 } }); // a change that re-plans in full
    await reminders.rescheduleReminders();
    await reminders.rescheduleReminders(); // and one that changes nothing
    expect(os.presentedReads).toBe(readsWhileOn + 1);
    expect(os.dismissed).toEqual([]);
    expect(os.presented.size).toBe(named().length);
    // Names on and off again is a new change, so it settles again.
    namesOn();
    await reminders.rescheduleReminders();
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect(os.presented.size).toBe(0);
  });

  it('names and the typed-day words going off together read Notification Center once', async () => {
    typed.setTypedDaysBuildForTest(true);
    namesOn();
    store.setSetting(DAY_NAMES, 'on');
    await reminders.rescheduleReminders();
    const reads = os.presentedReads;
    present([...named(), note('el.typed.2026-11-24', N.typedDay.title, 'Asha meets Nani', { source: SOURCE, kind: 'typedDay' })]);
    reminders.writePrefs({ namesOnLockScreen: false });
    await reminders.rescheduleReminders();
    expect(os.presentedReads).toBe(reads + 1);
    expect(os.presented.size).toBe(0);
  });

  it('a re-plan that fails after names go off settles again at the next apply', async () => {
    namesOn();
    await reminders.rescheduleReminders();
    reminders.writePrefs({ namesOnLockScreen: false });
    os.failScheduledRead = true;
    expect(await reminders.rescheduleReminders()).toEqual({ ok: false });
    // The named plan may still be with iOS, so a named note can fire before the next apply.
    present(named());
    os.failScheduledRead = false;
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(os.presented.size).toBe(0);
  });

  it('with names off, every note the scheduler hands iOS has a title and body on the allowlists', async () => {
    store.addChild({ name: 'Avi', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    for (const lock of ['off', 'on']) {
      store.setSetting(APP_LOCK_KEYS.enabled, lock);
      store.setSetting(NAMES, lock === 'on' ? 'on' : 'off'); // App lock on keeps names off even when stored on
      reminders.writePrefs({ time: { hour: lock === 'on' ? 19 : 20, minute: 0 } });
      expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
      const ours = [...os.scheduled.values()];
      expect(ours.length).toBeGreaterThan(0);
      for (const s of ours) {
        expect(publicTitleOk(s.content.title!), `${lock} ${s.identifier}`).toBe(true);
        expect(publicBodyOk(s.content.body!), `${lock} ${s.identifier}`).toBe(true);
        expect(JSON.stringify(s.content)).not.toMatch(/Asha|Avi/);
      }
    }
  });
});

describe('[BL-1009] the day-names switch under App lock (real store and scheduler)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const NOW = Date.parse('2026-11-25T18:00:00.000Z');
  const CANARY = 'Asha meets Nani zq7canary';
  const today = () => {
    const p = zonedParts(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    return isoDate({ y: p.y, m: p.m, d: p.d });
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    typed.setTypedDaysBuildForTest(true);
    os.scheduled.clear();
    os.presented.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => new Date(NOW).toISOString(), newId }).ok).toBe(true);
  });
  afterEach(async () => {
    await reminders.forgetReminders();
    typed.setTypedDaysBuildForTest(null);
    store.closeStore();
    close();
    vi.useRealTimers();
  });

  it('the key the scheduler clears is the day-names key prefs.ts reads and sign-out clears', () => {
    expect(REMINDER_SETTING_KEYS).toContain(DAY_NAMES);
    store.setSetting(DAY_NAMES, 'on');
    expect(dayNamesOn()).toBe(true);
    store.deleteSetting(DAY_NAMES);
    expect(dayNamesOn()).toBe(false);
  });

  it('App lock on: day names are off at once, the stored value is cleared at the next re-plan, and the lock going off does not turn them back on', async () => {
    store.setSetting(NAMES, 'on');
    store.setSetting(DAY_NAMES, 'on');
    const day = isoDate(addDays(parseIsoDate(today())!, 2));
    typed.saveTypedDay(day, CANARY, today());
    await reminders.rescheduleReminders();
    expect(os.scheduled.get(`el.typed.${day}`)!.content.body).toBe(CANARY);
    store.setSetting(APP_LOCK_KEYS.enabled, 'on');
    expect(dayNamesOn()).toBe(false);
    await reminders.rescheduleReminders();
    expect(store.getSetting(DAY_NAMES)).toBeNull();
    expect(JSON.stringify([...os.scheduled.values()])).not.toContain('zq7canary');
    store.setSetting(APP_LOCK_KEYS.enabled, 'off');
    await reminders.rescheduleReminders();
    expect(dayNamesOn()).toBe(false);
    expect(os.scheduled.get(`el.typed.${day}`)!.content.body).toBe(N.typedDay.body);
    expect(store.getSetting(NAMES)).toBe('on'); // only the day-names choice is cleared; names keep theirs
  });

  it('App lock off: a re-plan never touches the stored day-names choice', async () => {
    store.setSetting(DAY_NAMES, 'on');
    await reminders.rescheduleReminders();
    expect(store.getSetting(DAY_NAMES)).toBe('on');
  });
});
