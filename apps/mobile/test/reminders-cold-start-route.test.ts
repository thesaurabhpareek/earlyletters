/**
 * A tap on a reminder opens the screen its kind names, also when the tap launched the app (cold start). The old code
 * only had a live listener, which a cold start misses, and sent every kind but `evening` to the book. Fictional family: Asha.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  navigated: [] as string[],
  launching: null as unknown,
  listener: null as null | ((r: unknown) => void),
  mounted: true,
}));

vi.mock('../src/lib/days', () => ({ endDaysSession: () => true }));
vi.mock('../src/lib/moments', () => ({ endMomentsSession: () => true })); // reminders/session clears the moments file too: test/moments-hooks.test.ts
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({
  router: {
    navigate: (to: string) => {
      if (!h.mounted) throw new Error('not mounted');
      h.navigated.push(to);
    },
  },
}));
vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ granted: false, status: 'undetermined', canAskAgain: true, ios: { status: 0 } }),
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => {},
  scheduleNotificationAsync: async (r: { identifier: string }) => r.identifier,
  setNotificationChannelAsync: async () => {},
  setNotificationCategoryAsync: async () => {},
  setNotificationHandler: () => {},
  getLastNotificationResponse: () => h.launching,
  addNotificationResponseReceivedListener: (fn: (r: unknown) => void) => {
    h.listener = fn;
    return { remove: () => {} };
  },
}));

const { startReminders, REMINDER_SOURCE } = await import('../src/lib/reminders/scheduler');
const { routeForReminder } = await import('../src/lib/reminders/payload');

const response = (data: unknown, id = 'n-1') => ({
  notification: { date: 1, request: { identifier: id, content: { data } } },
});

let stop: () => void = () => {};
beforeEach(() => {
  stop();
  Object.assign(h, { navigated: [], launching: null, listener: null, mounted: true });
  vi.useRealTimers();
});

describe('routeForReminder', () => {
  it('evening goes to Tonight, month and birthday notes go to the book, strangers go nowhere', () => {
    expect(routeForReminder({ source: REMINDER_SOURCE, kind: 'evening' })).toBe('/');
    expect(routeForReminder({ source: REMINDER_SOURCE, kind: 'monthAge' })).toBe('/book');
    expect(routeForReminder({ source: REMINDER_SOURCE, kind: 'birthday' })).toBe('/book');
    expect(routeForReminder({ source: 'someone.else', kind: 'evening' })).toBeNull();
    expect(routeForReminder(undefined)).toBeNull();
  });
});

describe('cold start: the launching notification decides the screen', () => {
  it('a birthday note that launched the app opens the book', () => {
    h.launching = response({ source: REMINDER_SOURCE, kind: 'birthday' });
    stop = startReminders();
    expect(h.navigated).toEqual(['/book']);
  });

  it('an evening nudge that launched the app opens Tonight', () => {
    h.launching = response({ source: REMINDER_SOURCE, kind: 'evening' });
    stop = startReminders();
    expect(h.navigated).toEqual(['/']);
  });

  it('a normal launch and a stranger notification route nowhere', () => {
    stop = startReminders();
    expect(h.navigated).toEqual([]);
    stop();
    h.launching = response({ source: 'someone.else', kind: 'birthday' });
    stop = startReminders();
    expect(h.navigated).toEqual([]);
  });

  it('retries when the router is not mounted yet, then routes once', async () => {
    vi.useFakeTimers();
    h.mounted = false;
    h.launching = response({ source: REMINDER_SOURCE, kind: 'monthAge' });
    stop = startReminders();
    expect(h.navigated).toEqual([]);
    h.mounted = true;
    await vi.advanceTimersByTimeAsync(250);
    expect(h.navigated).toEqual(['/book']);
  });

  it('the same response arriving on the listener too routes once', () => {
    h.launching = response({ source: REMINDER_SOURCE, kind: 'birthday' }, 'n-9');
    stop = startReminders();
    h.listener?.(response({ source: REMINDER_SOURCE, kind: 'birthday' }, 'n-9'));
    expect(h.navigated).toEqual(['/book']);
  });

  it('a live tap still routes by kind', () => {
    stop = startReminders();
    h.listener?.(response({ source: REMINDER_SOURCE, kind: 'evening' }, 'n-2'));
    h.listener?.(response({ source: REMINDER_SOURCE, kind: 'monthAge' }, 'n-3'));
    expect(h.navigated).toEqual(['/', '/book']);
  });
});
