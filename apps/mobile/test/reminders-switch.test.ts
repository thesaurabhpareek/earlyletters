/// <reference types="node" />
/**
 * Reminders' one switch (EXPERIENCE_PASS_2026-10 S34, package P6), through the public API of lib/reminders and the real
 * store: the switch off keeps every choice, on clears a pause left from before, and Settings home reads a left-over
 * pause as Off, as the Reminders screen does. Native modules are stubbed; nothing here reads their source.
 * Fixtures: the fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reminderCopy } from '@scribe/content';
import { nodeDb } from './helpers/node-db';

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
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2 } }),
  requestPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2 } }),
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => {},
  scheduleNotificationAsync: async () => 'id',
  setNotificationChannelAsync: async () => {},
  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
}));
vi.mock('../src/lib/reminders/priming-sheet', () => ({ ReminderPrimingSheet: () => null }));

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');

describe('[S34] the one switch keeps every choice, and a pause from before reads as Off', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
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

  it('off writes only the switch: the cadence, evenings and time are kept for when it comes back on', async () => {
    reminders.writePrefs({ enabled: true, paused: false, cadence: 'weekly', weeklyDay: 3, time: { hour: 20, minute: 30 } });
    const before = reminders.readPrefs();
    await reminders.disableReminders();
    const after = reminders.readPrefs();
    expect(after.enabled).toBe(false);
    expect({ ...after, enabled: true }).toEqual(before);
    expect(reminders.remindersSummary(after)).toBe(reminderCopy.settings.offSummary);
  });

  it('on clears a pause left from before the one switch, and keeps the cadence chosen', async () => {
    reminders.writePrefs({ enabled: true, paused: true, cadence: 'weekly', weeklyDay: 3 });
    await reminders.enableReminders();
    const p = reminders.readPrefs();
    expect(p).toMatchObject({ enabled: true, paused: false, cadence: 'weekly', weeklyDay: 3 });
    expect(reminders.remindersSummary(p)).not.toBe(reminderCopy.settings.offSummary);
  });

  it('Settings home reads a left-over pause as Off, never "Paused" (lens A f3, lens B f1 on #313)', () => {
    reminders.writePrefs({ enabled: true, paused: true, cadence: 'fewTimes' });
    expect(reminders.remindersSummary()).toBe('Off');
    expect(reminders.remindersSummary()).not.toBe(reminderCopy.settings.pausedSummary);
    reminders.writePrefs({ paused: false });
    expect(reminders.remindersSummary()).toMatch(/^A few times a week, /);
    reminders.writePrefs({ enabled: false });
    expect(reminders.remindersSummary()).toBe('Off');
  });
});
