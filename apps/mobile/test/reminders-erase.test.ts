/// <reference types="node" />
/**
 * Erase everything and reminders (PR #520, Reviews A and B at 6887bd63). The real forgetReminders against #624's real
 * scheduler and the real store, with no mock of lib/reminders: only the native notification module is a stateful
 * stand-in (what iOS holds, scheduled and delivered). An erase removes every reminder of ours, scheduled or delivered,
 * leaves anyone else's alone, and resets the last result to OK, so a "Could not set reminders" from before the erase
 * does not show on the fresh first run. Fixtures: the fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { data?: unknown } };
const os = vi.hoisted(() => ({
  failSchedule: false,
  scheduled: new Map<string, { identifier: string; content: { data?: unknown } }>(),
  presented: new Map<string, { identifier: string; content: { data?: unknown } }>(),
}));

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
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const { REMINDER_SOURCE } = await import('../src/lib/reminders/scheduler');

describe('[DATA-REQ-024] Erase everything forgets our reminders and any failure from before (real scheduler, #624)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    os.failSchedule = false;
    os.scheduled.clear();
    os.presented.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-17T19:05:00.000Z', newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('removes every scheduled and delivered reminder of ours, keeps anyone else\'s, and leaves the last result at OK', async () => {
    reminders.writePrefs({ enabled: true, paused: false, cadence: 'everyEvening', time: { hour: 19, minute: 0 } });
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    const ours = [...os.scheduled.values()];
    expect(ours.length).toBeGreaterThan(0);
    // Someone else's notification, and one of ours already delivered to Notification Center.
    os.scheduled.set('other.app', { identifier: 'other.app', content: { data: { source: 'someone.else' } } });
    os.presented.set(ours[0].identifier, ours[0]);
    os.presented.set('other.delivered', { identifier: 'other.delivered', content: { data: {} } });

    // A failure before the erase: Settings would show "Could not set reminders just now."
    os.failSchedule = true;
    reminders.writePrefs({ time: { hour: 20, minute: 15 } });
    expect(await reminders.rescheduleReminders()).toEqual({ ok: false });
    expect(reminders.lastScheduleResult()).toEqual({ ok: false });
    os.failSchedule = false;
    // Whatever the failed re-plan left, iOS still holds reminders of ours when the erase starts.
    for (const r of ours) os.scheduled.set(r.identifier, r);
    expect(os.scheduled.size).toBe(ours.length + 1);

    const seen: boolean[] = [];
    const stop = reminders.subscribeScheduleResult((r) => seen.push(r.ok));
    await expect(reminders.forgetReminders()).resolves.toBeUndefined();
    stop();

    expect([...os.scheduled.keys()]).toEqual(['other.app']);
    expect([...os.presented.keys()]).toEqual(['other.delivered']);
    expect([...os.scheduled.values()].some((s) => (s.content.data as { source?: string } | undefined)?.source === REMINDER_SOURCE)).toBe(false);
    expect(reminders.lastScheduleResult()).toEqual({ ok: true });
    expect(seen).toEqual([true]);
  });

  it('with no failure before, the erase tells nobody anything and the result stays OK', async () => {
    const seen: boolean[] = [];
    const stop = reminders.subscribeScheduleResult((r) => seen.push(r.ok));
    await reminders.forgetReminders();
    stop();
    expect(reminders.lastScheduleResult()).toEqual({ ok: true });
    expect(seen).toEqual([]);
  });
});
