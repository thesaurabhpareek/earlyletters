/// <reference types="node" />
/**
 * BL-1008: the library days build switch and pause (NS-46-R28, R33, R42). The real scheduler and store; only the native
 * notification module is a stateful stand-in, and the planner stands in two notes (a library day and a typed day) because
 * it makes no library notes yet. Fixtures: the fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRemoteConfig } from '@scribe/api';
import { nodeDb } from './helpers/node-db';
import { libraryDaysAllowed, libraryDaysPaused, libraryDaysPausedNow, parseDaysFlag, setDaysBuildForTest, watchLibraryDaysPause, withoutLibraryNotes, type RemoteConfigReader } from '../src/lib/reminders/library-days';

type Req = { identifier: string; content: { data?: unknown } };
const os = vi.hoisted(() => ({
  failSchedule: false,
  scheduled: new Map<string, { identifier: string; content: { data?: unknown } }>(),
  presented: new Map<string, { identifier: string; content: { data?: unknown } }>(),
}));

vi.mock('../src/lib/days', () => ({ endDaysSession: () => true })); // reminders/session clears the days store (NS-47-R15): test/days-store.test.ts
vi.mock('../src/lib/moments', () => ({ endMomentsSession: () => true })); // reminders/session clears the moments file too: test/moments-hooks.test.ts
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('../src/lib/reminders/planner', async (orig) => {
  // The planner makes no library notes yet (BL-966): stand two in beside the real plan, one library and one typed day.
  const real = await orig<typeof import('../src/lib/reminders/planner')>();
  const note = (id: string, kind: string, hour: number) => ({ id: `${real.ID_PREFIX}${id}`, kind, date: '2026-10-20', hour, minute: 0, fireAt: Date.parse('2026-10-20T00:00:00Z') + hour * 3600e3, title: 't', body: 'b' });
  return { ...real, planReminders: (i: Parameters<typeof real.planReminders>[0]) => [...real.planReminders(i), note('lib', 'libraryDay', 11), note('typed', 'typedDay', 12)] };
});
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
    getAllScheduledNotificationsAsync: async () => [...os.scheduled.values()],
    cancelScheduledNotificationAsync: async (id: string) => void os.scheduled.delete(id),
    scheduleNotificationAsync: async (r: Req) => {
      if (os.failSchedule) throw new Error('iOS said no');
      os.scheduled.set(r.identifier, { identifier: r.identifier, content: r.content });
      return r.identifier;
    },
    getPresentedNotificationsAsync: async () => [...os.presented.values()].map((request) => ({ request })),
    dismissNotificationAsync: async (id: string) => void os.presented.delete(id),
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    setNotificationCategoryAsync: async () => {},
    getLastNotificationResponse: () => null,
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const scheduler = await import('../src/lib/reminders/scheduler');

const base = { schemaVersion: 1, version: 5, generatedAt: '2026-10-03T12:00:00.000Z' };
const parse = (killSwitches: unknown) => {
  const r = parseRemoteConfig({ ...base, killSwitches });
  if (!r.ok) throw new Error('config did not parse');
  return r.value;
};

/** A reader over a value we can swap, like lib/remote's signed config. */
function fakeReader(initial: unknown) {
  let value = initial as never;
  const listeners = new Set<() => void>();
  const reader: RemoteConfigReader = { get: () => value, subscribe: (fn) => (listeners.add(fn), () => void listeners.delete(fn)) };
  return { reader, set: (v: unknown) => ((value = v as never), listeners.forEach((l) => l())), listeners };
}

describe('[NS-46-R28] config parse: the pause is read as !== true', () => {
  it('[NS-46-R28] a signed config with libraryDays true pauses; false and an older config without the key do not', () => {
    expect(libraryDaysPaused(parse({ libraryDays: true }))).toBe(true);
    expect(libraryDaysPaused(parse({ libraryDays: false }))).toBe(false);
    expect(libraryDaysPaused(parse({ sync: true }))).toBe(false); // older config: key absent reads off
  });
  it('[NS-46-R28] an unknown key beside it changes nothing, and only the boolean true pauses', () => {
    expect(libraryDaysPaused(parse({ libraryDays: false, libraryDaysV2: true }))).toBe(false);
    for (const v of ['true', 1, 'on', null]) expect(libraryDaysPaused({ killSwitches: { libraryDays: v } })).toBe(false);
  });
  it('[NS-46-R28] no config, or a reader that throws, is not paused', () => {
    expect(libraryDaysPaused(null)).toBe(false);
    expect(libraryDaysPaused(undefined)).toBe(false);
    expect(libraryDaysPausedNow(null)).toBe(false);
    expect(libraryDaysPausedNow({ get: () => { throw new Error('x'); }, subscribe: () => () => {} })).toBe(false);
  });
});

describe('[NS-46-R33] the build switch', () => {
  it('only the word on turns it on, and a pause never turns it on', () => {
    for (const raw of [undefined, null, '', 'off', 'true', '1']) expect(parseDaysFlag(raw), String(raw)).toBe(false);
    expect(parseDaysFlag(' ON ')).toBe(true);
    const free = fakeReader(parse({}));
    expect(libraryDaysAllowed(free.reader, false)).toBe(false);
    expect(libraryDaysAllowed(free.reader, true)).toBe(true);
    expect(libraryDaysAllowed(fakeReader(parse({ libraryDays: true })).reader, true)).toBe(false);
  });
  it('withoutLibraryNotes drops only library notes', () => {
    const plan = [{ kind: 'libraryDay' }, { kind: 'typedDay' }, { kind: 'birthday' }];
    expect(withoutLibraryNotes(plan, true)).toEqual(plan);
    expect(withoutLibraryNotes(plan, false)).toEqual([{ kind: 'typedDay' }, { kind: 'birthday' }]);
  });
  it('watchLibraryDaysPause tells only when the pause flips', () => {
    const f = fakeReader(parse({}));
    const seen: number[] = [];
    const stop = watchLibraryDaysPause(f.reader, () => seen.push(1));
    f.set(parse({ sync: true })); // another key: no flip
    expect(seen).toEqual([]);
    f.set(parse({ libraryDays: true }));
    f.set(parse({ libraryDays: true, sync: true })); // still paused
    f.set(parse({}));
    expect(seen).toEqual([1, 1]);
    stop();
    expect(f.listeners.size).toBe(0);
  });
});

describe('[NS-46-R42] a pause arriving mid-session cancels pending library notes within the debounce; typed days stay', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const kinds = () => [...os.scheduled.values()].map((s) => (s.content.data as { kind?: string }).kind);
  let stop: () => void = () => {};

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    os.scheduled.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-17T19:05:00.000Z', newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    reminders.writePrefs({ enabled: true, paused: false, cadence: 'everyEvening', time: { hour: 19, minute: 0 } });
    setDaysBuildForTest(true);
  });
  afterEach(() => {
    stop();
    scheduler.setLibraryDaysReaderForTest(undefined);
    setDaysBuildForTest(null);
    vi.useRealTimers();
    store.closeStore();
    close();
  });

  it('[NS-46-R42] build on, not paused: library and typed notes are both scheduled; the pause cancels the library one only', async () => {
    const f = fakeReader(parse({}));
    scheduler.setLibraryDaysReaderForTest(f.reader);
    stop = reminders.startReminders();
    await vi.advanceTimersByTimeAsync(10);
    expect(kinds()).toContain('libraryDay');
    expect(kinds()).toContain('typedDay');

    f.set(parse({ libraryDays: true }));
    await vi.advanceTimersByTimeAsync(1199); // inside the debounce: nothing yet
    expect(kinds()).toContain('libraryDay');
    await vi.advanceTimersByTimeAsync(10); // past it
    expect(kinds()).not.toContain('libraryDay');
    expect(kinds()).toContain('typedDay');
    expect(kinds()).toContain('evening');
  });

  it('[NS-46-R42] when the pause ends, library notes come back at the next re-plan', async () => {
    const f = fakeReader(parse({ libraryDays: true }));
    scheduler.setLibraryDaysReaderForTest(f.reader);
    stop = reminders.startReminders();
    await vi.advanceTimersByTimeAsync(10);
    expect(kinds()).not.toContain('libraryDay');
    f.set(parse({}));
    await vi.advanceTimersByTimeAsync(1300);
    expect(kinds()).toContain('libraryDay');
  });

  it('[NS-46-R33] build off: no library notes whatever the config says, and typed days stay', async () => {
    setDaysBuildForTest(false);
    scheduler.setLibraryDaysReaderForTest(fakeReader(parse({})).reader);
    stop = reminders.startReminders();
    await vi.advanceTimersByTimeAsync(10);
    expect(kinds()).not.toContain('libraryDay');
    expect(kinds()).toContain('typedDay');
  });
});
