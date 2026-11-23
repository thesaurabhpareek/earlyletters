/// <reference types="node" />
/**
 * The scheduler stamps the anchor's second half, `reminders.onSince` (BL-943; NS-13 section 3a, R27), and nothing else
 * does. Pinned on the real store and scheduler (only the native module is a stand-in), because a wrong stamp is either
 * reminders that never end (re-stamped every plan) or an upgraded phone cut off at once (never stamped). Fictional family Asha.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { data?: unknown } };
const os = vi.hoisted(() => ({
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
const auth = await import('../src/lib/auth/auth-store');
const reminders = await import('../src/lib/reminders');
const { readOnSince, writeOnSince, lastOwnSaveAt, anchorAt } = await import('../src/lib/reminders/prefs');
const { SYNC_SETTING, writeSetting } = await import('../src/lib/sync/outbox');

const DAY = 86_400_000;
const T0 = Date.parse('2026-10-17T19:05:00.000Z');

describe('[NS-13-R27] who stamps onSince', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  let childId = '';
  const draftAt = (ms: number) =>
    store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha laughed.', createdAt: new Date(ms).toISOString() });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    os.scheduled.clear();
    os.presented.clear();
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => new Date(Date.now()).toISOString(), newId }).ok).toBe(true);
    childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  });
  afterEach(() => {
    vi.useRealTimers();
    auth.resetAuthStoreForTests();
    store.closeStore();
    close();
  });

  it('turning reminders on stamps now; turning them off and on again, or resuming from a pause, moves it to now (deliberate)', async () => {
    expect(readOnSince()).toBeNull();
    await reminders.turnOnReminders();
    expect(readOnSince()).toBe(T0);
    // Off keeps the stamp; on again is a new start.
    reminders.writePrefs({ enabled: false });
    expect(readOnSince()).toBe(T0);
    vi.setSystemTime(T0 + 10 * DAY);
    await reminders.turnOnReminders();
    expect(readOnSince()).toBe(T0 + 10 * DAY);
    // A pause from before the Reminders switch reads as off; resuming is turning on.
    reminders.writePrefs({ paused: true });
    vi.setSystemTime(T0 + 20 * DAY);
    await reminders.turnOnReminders();
    expect(readOnSince()).toBe(T0 + 20 * DAY);
    // Already on and not paused: asking again (the card after the first letter) does not move it.
    vi.setSystemTime(T0 + 25 * DAY);
    await reminders.turnOnReminders();
    expect(readOnSince()).toBe(T0 + 20 * DAY);
  });

  it('an upgraded phone (on, no stamp) with a letter older than 35 days is stamped once at the next plan, and is not cut off', async () => {
    draftAt(T0 - 40 * DAY);
    reminders.writePrefs({ enabled: true, cadence: 'everyEvening' });
    expect(readOnSince()).toBeNull();
    expect(anchorAt()).toBe(T0 - 40 * DAY); // without the stamp the anchor is 40 days old and the plan is empty
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(readOnSince()).toBe(T0);
    expect(anchorAt()).toBe(T0);
    expect(os.scheduled.size).toBeGreaterThan(0);
    // Exactly once: a later plan on a later day does not stamp again.
    vi.setSystemTime(T0 + 3 * DAY);
    await reminders.rescheduleReminders();
    expect(readOnSince()).toBe(T0);
  });

  it('a plan never re-stamps once onSince is set, so the count runs out (a stamp on every plan would never end)', async () => {
    reminders.writePrefs({ enabled: true, cadence: 'everyEvening' });
    writeOnSince(T0 - 30 * DAY);
    await reminders.rescheduleReminders();
    vi.setSystemTime(T0 + 6 * DAY);
    await reminders.rescheduleReminders();
    expect(readOnSince()).toBe(T0 - 30 * DAY);
    // Day 36 after the stamp: the plan holds nothing of ours.
    writeOnSince(T0 - 36 * DAY);
    await reminders.rescheduleReminders();
    expect(readOnSince()).toBe(T0 - 36 * DAY);
    expect(os.scheduled.size).toBe(0);
  });

  it('reminders off stamps nothing at a plan', async () => {
    await reminders.rescheduleReminders();
    expect(readOnSince()).toBeNull();
  });

  it('signing out clears onSince with the other reminder settings', async () => {
    await reminders.turnOnReminders();
    expect(readOnSince()).toBe(T0);
    await reminders.endReminderSession();
    expect(store.getSetting('reminders.onSince')).toBeNull();
    expect(readOnSince()).toBeNull();
    expect(reminders.readPrefs().enabled).toBe(false);
  });
});

describe('[NS-13-R13] a draft left on the phone never counts for the next account', () => {
  const A = '0192f0aa-0000-7000-8000-0000000000a1';
  const B = '0192f0aa-0000-7000-8000-0000000000b2';
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-17T19:05:00.000Z', newId }).ok).toBe(true);
  });
  afterEach(() => {
    auth.resetAuthStoreForTests();
    store.closeStore();
    close();
  });

  it('sign-out deletes no draft, but with B signed in over A\'s phone the books are hidden, so lastOwnSaveAt and the anchor ignore it', () => {
    const book = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    const d = store.createDraft({ childId: book.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha laughed.' });
    writeSetting(store.localSqlDb(), SYNC_SETTING.owner, A);
    auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-17T19:05:00.000Z')); // control: A sees it
    auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });
    expect(store.getDraft(d.id)).not.toBeNull(); // the draft is still on the phone: nothing is deleted
    expect(store.listDrafts(book.id)).toEqual([]); // but no list shows it to B
    expect(lastOwnSaveAt()).toBeNull();
    expect(anchorAt()).toBeNull(); // only B's own onSince can anchor B
  });
});
