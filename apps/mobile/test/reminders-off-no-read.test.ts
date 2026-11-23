/// <reference types="node" />
/**
 * BL-1189: with reminders off the scheduler reads no pending notifications, but the re-plan right after the switch
 * goes off still cancels what we scheduled before. Native modules are stubbed. Fixtures: the fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

const pending: { identifier: string; content: { data: unknown } }[] = [];
const getAll = vi.fn(async () => pending.map((p) => ({ ...p })));
const cancel = vi.fn(async (id: string) => {
  const i = pending.findIndex((p) => p.identifier === id);
  if (i >= 0) pending.splice(i, 1);
});
const schedule = vi.fn(async (r: { identifier: string; content: { data: unknown } }) => {
  pending.push({ identifier: r.identifier, content: r.content });
  return r.identifier;
});

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
vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2 } }),
  requestPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2 } }),
  getAllScheduledNotificationsAsync: () => getAll(),
  cancelScheduledNotificationAsync: (id: string) => cancel(id),
  scheduleNotificationAsync: (r: never) => schedule(r),
  setNotificationChannelAsync: async () => {},
  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
}));

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');

describe('[BL-1189] reminders off reads nothing, and the switch going off still cancels', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    pending.length = 0;
    getAll.mockClear();
    cancel.mockClear();
    schedule.mockClear();
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

  it('switching off cancels what was scheduled; every re-plan after that makes zero pending reads', async () => {
    await reminders.turnOnReminders({ cadence: 'fewTimes' });
    expect(pending.length).toBeGreaterThan(0);
    const ours = pending.length;

    await reminders.disableReminders(); // just switched off: reads once and cancels all of ours
    expect(pending).toHaveLength(0);
    expect(cancel).toHaveBeenCalledTimes(ours);

    getAll.mockClear();
    await reminders.rescheduleReminders();
    await reminders.rescheduleReminders();
    expect(getAll).not.toHaveBeenCalled();
    expect(schedule).toHaveBeenCalledTimes(ours); // nothing new scheduled while off
  });

  it('on again reads and plans as before', async () => {
    await reminders.turnOnReminders({ cadence: 'fewTimes' });
    await reminders.disableReminders();
    getAll.mockClear();
    await reminders.turnOnReminders({ cadence: 'fewTimes' });
    expect(getAll).toHaveBeenCalled();
    expect(pending.length).toBeGreaterThan(0);
  });
});
