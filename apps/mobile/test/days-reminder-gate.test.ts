/// <reference types="node" />
/**
 * The day-only gate and the first-tick door on the phone (BL-1007; NS-46-R31, NS-46-R5). Real store (node:sqlite) and
 * the real scheduler; only the native notification module is a stand-in that keeps what iOS holds and how often it
 * asked, as in test/reminders-typed-days.test.ts. The library-day feed is BL-1012, so the phone-side cases use a typed
 * day; the planner cases for a ticked day are in test/days-planner-order.test.ts. Fixtures: the fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { title?: string; body?: string; data?: unknown } };
type Perm = 'granted' | 'undetermined' | 'denied';
const os = vi.hoisted(() => ({
  permission: 'granted' as 'granted' | 'undetermined' | 'denied',
  /** What the person taps on the iOS alert. */
  answer: 'granted' as 'granted' | 'denied',
  scheduled: new Map<string, { identifier: string; content: { title?: string; body?: string; data?: unknown } }>(),
  asked: 0,
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
  const status = { granted: 2, undetermined: 0, denied: 1 } as const;
  const perm = () => ({
    granted: os.permission === 'granted',
    status: os.permission,
    canAskAgain: os.permission === 'undetermined',
    ios: { status: status[os.permission], alertStyle: 1 },
  });
  return {
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
    SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
    AndroidImportance: { DEFAULT: 3 },
    getPermissionsAsync: async () => perm(),
    requestPermissionsAsync: async () => {
      os.asked += 1;
      if (os.permission === 'undetermined') os.permission = os.answer; // iOS shows the alert once, then keeps the answer
      return perm();
    },
    getAllScheduledNotificationsAsync: async () => [...os.scheduled.values()],
    cancelScheduledNotificationAsync: async (id: string) => void os.scheduled.delete(id),
    scheduleNotificationAsync: async (r: Req) => {
      os.scheduled.set(r.identifier, { identifier: r.identifier, content: r.content });
      return r.identifier;
    },
    getPresentedNotificationsAsync: async () => [],
    dismissNotificationAsync: async () => {},
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const { readPrefs } = await import('../src/lib/reminders/prefs');
const typed = await import('../src/lib/reminders/typed-days');
const { addDays, isoDate, parseIsoDate, zonedParts } = await import('../src/lib/reminders/tz');

describe('[NS-46-R31] day reminders do not need evening reminders on (phone)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const NOW = Date.parse('2026-11-25T18:00:00.000Z');
  const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = () => {
    const p = zonedParts(Date.now(), zone());
    return isoDate({ y: p.y, m: p.m, d: p.d });
  };
  const plus = (iso: string, n: number) => isoDate(addDays(parseIsoDate(iso)!, n));
  const ours = () => [...os.scheduled.values()].filter((s) => (s.content.data as { source?: string } | undefined)?.source === 'scribe.reminders');
  const ids = () => ours().map((s) => s.identifier).sort();
  const set = (p: Perm, answer: 'granted' | 'denied' = 'granted') => {
    os.permission = p;
    os.answer = answer;
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    typed.setTypedDaysBuildForTest(true);
    set('granted');
    os.asked = 0;
    os.scheduled.clear();
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

  it('Reminders switched off with notifications allowed: the day still comes, and no evening, month or birthday note does', async () => {
    await reminders.turnOnReminders({ cadence: 'everyEvening' });
    expect(ours().some((s) => (s.content.data as { kind: string }).kind === 'evening')).toBe(true);
    const day = plus(today(), 3);
    typed.saveTypedDay(day, 'Nursery starts', today());
    await reminders.disableReminders();
    expect(readPrefs().enabled).toBe(false);
    expect(ids()).toEqual([`el.typed.${day}`]);
  });

  it('permission not yet asked: the first tick asks iOS once, never turns evening reminders on, and the day is planned', async () => {
    set('undetermined', 'granted');
    const day = plus(today(), 3);
    typed.saveTypedDay(day, 'Nursery starts', today());
    await reminders.rescheduleReminders();
    expect(ids()).toEqual([]); // nothing until the door asks
    const r = await reminders.askForDayReminders();
    expect(r).toEqual({ permission: 'granted', asked: true, scheduled: { ok: true } });
    expect(os.asked).toBe(1);
    expect(readPrefs().enabled).toBe(false);
    expect(ids()).toEqual([`el.typed.${day}`]);
    // A second tick is not a second ask.
    const again = await reminders.askForDayReminders();
    expect(again.asked).toBe(false);
    expect(os.asked).toBe(1);
  });

  it('permission not yet asked and the parent taps Don\'t Allow: the refusal is final, nothing is planned, no second ask', async () => {
    set('undetermined', 'denied');
    typed.saveTypedDay(plus(today(), 3), 'Nursery starts', today());
    const r = await reminders.askForDayReminders();
    expect(r.permission).toBe('denied');
    expect(r.asked).toBe(true);
    expect(ids()).toEqual([]);
    expect((await reminders.askForDayReminders()).asked).toBe(false);
    expect(os.asked).toBe(1);
  });

  it('permission already denied: the door never asks', async () => {
    set('denied');
    const r = await reminders.askForDayReminders();
    expect(r).toEqual({ permission: 'denied', asked: false, scheduled: { ok: true } });
    expect(os.asked).toBe(0);
  });

  it('the door leaves the chosen cadence and time alone', async () => {
    reminders.writePrefs({ cadence: 'weekly', time: { hour: 19, minute: 15 } });
    set('undetermined');
    await reminders.askForDayReminders();
    expect(readPrefs()).toEqual(expect.objectContaining({ enabled: false, cadence: 'weekly', time: { hour: 19, minute: 15 } }));
  });
});

describe('[NS-46-R5] a typed day does not recur (phone)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const NOW = Date.parse('2026-11-25T18:00:00.000Z');
  const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = () => {
    const p = zonedParts(Date.now(), zone());
    return isoDate({ y: p.y, m: p.m, d: p.d });
  };
  const plus = (iso: string, n: number) => isoDate(addDays(parseIsoDate(iso)!, n));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    typed.setTypedDaysBuildForTest(true);
    os.permission = 'granted';
    os.scheduled.clear();
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

  it('delivered, then gone the day after, and a year on nothing is planned for it', async () => {
    const day = plus(today(), 1);
    typed.saveTypedDay(day, 'Nursery starts', today());
    await reminders.rescheduleReminders();
    expect([...os.scheduled.keys()]).toEqual([`el.typed.${day}`]);
    vi.setSystemTime(NOW + 2 * 86_400_000);
    await reminders.rescheduleReminders();
    expect(typed.readTypedDays()).toEqual([]);
    expect([...os.scheduled.keys()]).toEqual([]);
    vi.setSystemTime(NOW + 366 * 86_400_000);
    await reminders.rescheduleReminders();
    expect([...os.scheduled.keys()]).toEqual([]);
  });
});
