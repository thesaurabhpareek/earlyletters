/**
 * BL-2247 follow-up: a store write re-plans after a 1.2 s quiet time, and the app can leave the foreground inside it. On
 * 'background' a re-plan still waiting runs at once (the timer is dropped), serialised behind any re-plan already
 * running, and nothing runs when nothing waits. 'active' re-plans as before. The real scheduler runs against a fake
 * phone; the planner is wrapped so the plan's words follow a value the test changes (a stand-in for a setting).
 * Fictional family: Asha. No content is logged.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Pending = { identifier: string; content: { title?: string; data?: unknown } };
const h = vi.hoisted(() => ({
  pending: new Map<string, Pending>(),
  reads: 0,
  title: 'Asha, a line for today?',
  gate: null as null | Promise<void>,
  appState: null as null | ((s: string) => void),
  storeListener: null as null | (() => void),
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, fn: (s: string) => void) => {
      h.appState = fn;
      return { remove: () => {} };
    },
  },
  Platform: { OS: 'ios' },
}));
vi.mock('expo-router', () => ({ router: { navigate: () => {} } }));
vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2, alertStyle: 1 } }),
  // One read per apply that reaches iOS: the count of applies. A test can hold the read to keep an apply running.
  getAllScheduledNotificationsAsync: async () => {
    h.reads += 1;
    if (h.gate) await h.gate;
    return [...h.pending.values()].map((p) => ({ ...p }));
  },
  getPresentedNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async (id: string) => void h.pending.delete(id),
  scheduleNotificationAsync: async (r: Pending) => {
    h.pending.set(r.identifier, { identifier: r.identifier, content: r.content });
    return r.identifier;
  },
  setNotificationChannelAsync: async () => {},
  setNotificationCategoryAsync: async () => {},
  setNotificationHandler: () => {},
  getLastNotificationResponse: () => null,
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
}));
vi.mock('../src/lib/store', () => ({
  subscribe: (fn: () => void) => {
    h.storeListener = fn;
    return () => {};
  },
  getSetting: () => null,
  setSetting: () => {},
  deleteSetting: () => {},
}));
vi.mock('../src/lib/app-lock/prefs', () => ({ appLockOn: () => false }));
vi.mock('../src/lib/reminders/prefs', async () => {
  const { DEFAULT_PREFS } = await import('../src/lib/reminders/planner');
  return {
    // Names on and day names on: the words may show, so no apply reads Notification Center.
    readPrefs: () => ({ ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', namesOnLockScreen: true }),
    plannerChildren: () => [{ id: 'c0', name: 'Asha', birthday: '2026-03-14', included: true }],
    lastOwnSaveAt: () => null,
    lastMadeLetter: () => null,
    anchorAt: () => null,
    dayNamesOn: () => true,
    readOnSince: () => 0,
    writeOnSince: () => {},
    writePrefs: () => {},
  };
});
vi.mock('../src/lib/reminders/planner', async (orig) => {
  const real = await orig<typeof import('../src/lib/reminders/planner')>();
  return {
    ...real,
    planReminders: () => [
      { id: `${real.ID_PREFIX}evening.2026-12-01`, kind: 'evening', date: '2026-12-01', hour: 20, minute: 30, fireAt: 0, title: h.title, body: 'One line is enough.' },
    ],
  };
});

const { startReminders, setLibraryDaysReaderForTest } = await import('../src/lib/reminders/scheduler');
const NOW = Date.parse('2026-12-01T12:00:00.000Z');
const DEBOUNCE = 1200;
const scheduledTitle = () => [...h.pending.values()][0]?.content.title;

/** Lets every queued promise and zero-delay timer run (fake timers keep the debounce timer waiting). */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await vi.advanceTimersByTimeAsync(0);
}

/** A store write that changes what the plan says, as a settings change would. */
function changeSetting(title: string): void {
  h.title = title;
  h.storeListener?.();
}

let stop: () => void = () => {};
beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  setLibraryDaysReaderForTest(null);
  Object.assign(h, { reads: 0, title: 'Asha, a line for today?', gate: null });
  h.pending.clear();
  stop = startReminders();
  await settle(); // the boot re-plan, and the after-update one if it runs
  h.reads = 0;
});
afterEach(() => {
  stop();
  vi.useRealTimers();
});

describe('[BL-2247-BG1] a re-plan waiting on the debounce runs when the app goes to the background', () => {
  it('flushes at once, without waiting for the timer, and the timer does not fire a second one', async () => {
    changeSetting('A line for today?');
    await settle();
    expect(h.reads).toBe(0); // still inside the quiet time
    h.appState?.('background');
    await settle();
    expect(h.reads).toBe(1);
    expect(scheduledTitle()).toBe('A line for today?');
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    await settle();
    expect(h.reads).toBe(1);
  });
});

describe('[BL-2247-BG2] nothing waiting: going to the background runs nothing', () => {
  it('no apply on background with no pending write', async () => {
    h.appState?.('background');
    await settle();
    expect(h.reads).toBe(0);
  });
  it('no apply on background after the debounce already fired', async () => {
    changeSetting('A line for today?');
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    await settle();
    expect(h.reads).toBe(1);
    h.appState?.('background');
    await settle();
    expect(h.reads).toBe(1);
  });
  it("'inactive' alone flushes nothing; the timer still re-plans as before", async () => {
    changeSetting('A line for today?');
    h.appState?.('inactive');
    await settle();
    expect(h.reads).toBe(0);
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    await settle();
    expect(h.reads).toBe(1);
  });
});

describe('[BL-2247-BG3] background while an apply is running never runs a second one at the same time', () => {
  it('nothing waiting: no extra apply, before or after the running one ends', async () => {
    let open!: () => void;
    h.gate = new Promise<void>((r) => (open = r));
    h.appState?.('active'); // an apply starts and is held at its read
    await settle();
    expect(h.reads).toBe(1);
    h.appState?.('background');
    await settle();
    expect(h.reads).toBe(1);
    h.gate = null;
    open();
    await settle();
    expect(h.reads).toBe(1);
  });
  it('a write waiting: one apply queues behind the running one, never beside it, and only one', async () => {
    let open!: () => void;
    h.gate = new Promise<void>((r) => (open = r));
    h.appState?.('active');
    await settle();
    expect(h.reads).toBe(1);
    changeSetting('A line for today?');
    h.appState?.('background');
    h.appState?.('background'); // a second background with nothing left waiting adds nothing
    await settle();
    expect(h.reads).toBe(1); // queued, not started: the running apply still holds its read
    h.gate = null;
    open();
    await settle();
    expect(h.reads).toBe(2);
    expect(scheduledTitle()).toBe('A line for today?');
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    await settle();
    expect(h.reads).toBe(2);
  });
});

describe("[BL-2247-BG4] 'active' re-plans as before", () => {
  it('re-plans on every foreground, with or without a write waiting', async () => {
    h.appState?.('active');
    await settle();
    expect(h.reads).toBe(1);
    changeSetting('A line for today?');
    h.appState?.('active');
    await settle();
    expect(h.reads).toBe(2);
    expect(scheduledTitle()).toBe('A line for today?');
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    await settle();
    expect(h.reads).toBe(2); // the foreground re-plan took the waiting write, as before
  });
});
