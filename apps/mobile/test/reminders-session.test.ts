/// <reference types="node" />
/**
 * The session ends, reminders end (BL-967; NS-13-R14, with R13 and R15). One hook on the signed-in user id
 * (session-provider.tsx, `sessionEnded` in lib/reminders/session.ts) ends reminders on every path a session ends:
 * Sign out, account deletion (which signs out the same way), the under-18 answer, a sign-out Supabase makes itself,
 * and another account signing in. Each path is driven through the real auth reducer here. Ending runs against the
 * real store (node:sqlite) and the real scheduler, with only the native notification module as a stateful stand-in
 * (what iOS holds, scheduled and delivered), as in test/reminders-erase.test.ts. Fixtures: the fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

type Req = { identifier: string; content: { data?: unknown } };
const os = vi.hoisted(() => ({
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
const { authReducer, authUserId, initialAuthState } = await import('../src/lib/auth/machine.logic');
type AuthState = import('../src/lib/auth/machine.logic').AuthState;
type AuthEvent = import('../src/lib/auth/machine.logic').AuthEvent;

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const PARENT = '0199a5b0-0000-7000-8000-00000000a5a1';
const OTHER = '0199a5b0-0000-7000-8000-00000000a5a2';
const GATE_OK = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };

/** Runs events through the real reducer and counts how often the session hook would end reminders. */
function run(events: AuthEvent[], from: AuthState = initialAuthState): { state: AuthState; ends: number } {
  const { sessionEnded } = reminders;
  let state = from;
  let ends = 0;
  for (const e of events) {
    const before = authUserId(state);
    state = authReducer(state, e);
    if (sessionEnded(before, authUserId(state))) ends++;
  }
  return { state, ends };
}
const signedIn: AuthEvent[] = [
  { type: 'RESTORED', userId: null },
  { type: 'SIGNED_IN', userId: PARENT, method: 'apple' },
  { type: 'GATE_LOADED', gate: GATE_OK, sensitiveDeclined: false },
];

describe('[NS-13-R14] one hook on the user id ends reminders on every path a session ends', () => {
  it('Sign out on this phone (and account deletion, which signs out the same way)', () => {
    const r = run([...signedIn, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 }, { type: 'SIGNED_OUT' }]);
    expect(r.state.status).toBe('signedOut');
    expect(r.ends).toBe(1);
    // Account deletion on the phone ends with the same auth.signOut (lib/account-deletion/use-account-deletion.ts).
    expect(code('lib/account-deletion/use-account-deletion.ts')).toContain('signOut: auth.signOut');
  });

  it('a sign-out that waited for letters to upload ends it once, when the session ends', () => {
    const r = run([...signedIn, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 }, { type: 'UPLOADS_DRAINED' }, { type: 'SIGNED_OUT' }]);
    expect(r.ends).toBe(1);
  });

  it('the under-18 answer', () => {
    const r = run([
      { type: 'RESTORED', userId: null },
      { type: 'SIGNED_IN', userId: PARENT, method: 'email' },
      { type: 'GATE_LOADED', gate: { ...GATE_OK, ageAttested: false }, sensitiveDeclined: false },
      { type: 'CONSENT_RECORDED', step: 'age', accepted: false },
    ]);
    expect(r.state).toEqual({ status: 'signedOut', error: 'under_18' });
    expect(r.ends).toBe(1);
  });

  it('a sign-out Supabase makes itself (revoked elsewhere), and a lost session', () => {
    expect(run([...signedIn, { type: 'SIGNED_OUT' }]).ends).toBe(1);
    expect(run([...signedIn, { type: 'SESSION_LOST' }]).ends).toBe(1);
    // Restored from the Keychain at launch, then signed out by Supabase.
    expect(run([{ type: 'RESTORED', userId: PARENT }, { type: 'SIGNED_OUT' }]).ends).toBe(1);
  });

  it('another account signing in on the same phone (NS-13-R13)', () => {
    expect(run([...signedIn, { type: 'SIGNED_IN', userId: OTHER, method: 'email' }]).ends).toBe(1);
  });

  it('never for a phone that never signed in, a repeated sign-in, or "Stay signed in"', () => {
    expect(run([{ type: 'RESTORED', userId: null }, { type: 'SIGNED_OUT' }]).ends).toBe(0);
    expect(run([...signedIn, { type: 'SIGNED_IN', userId: PARENT, method: null }]).ends).toBe(0);
    expect(run([...signedIn, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 }, { type: 'SIGN_OUT_WAIT_CANCELLED' }]).ends).toBe(0);
  });

  it('the provider runs the hook on the signed-in user id, and nothing else ends reminders there (source)', () => {
    const provider = code('lib/auth/session-provider.tsx');
    expect(provider).toContain("from '../reminders/session'");
    expect(provider).toMatch(/const sessionUser = authUserId\(state\);/);
    expect(provider).toMatch(
      /useEffect\(\(\) => \{\s*const before = lastSessionUser\.current;\s*lastSessionUser\.current = sessionUser;\s*if \(sessionEnded\(before, sessionUser\)\) void endReminderSession\(\);\s*\}, \[sessionUser\]\);/,
    );
    expect(provider.match(/endReminderSession\(/g)).toHaveLength(1);
  });
});

describe('[NS-13-R14] sign out removes reminders (real store and scheduler)', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
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

  it('every scheduled and delivered reminder of ours goes, and the reminder settings are cleared; nothing else is', async () => {
    reminders.writePrefs({
      enabled: true,
      paused: false,
      cadence: 'fewTimes',
      days: [1, 3],
      weeklyDay: 2,
      time: { hour: 19, minute: 0 },
      monthNotes: true,
      namesOnLockScreen: true,
    });
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(os.scheduled.size).toBeGreaterThan(0);
    os.presented.set('el.month.2026-10-01', { identifier: 'el.month.2026-10-01', content: { data: { source: REMINDER_SOURCE, kind: 'monthAge' } } });
    os.scheduled.set('someone-else', { identifier: 'someone-else', content: { data: { source: 'another.app' } } });
    os.presented.set('someone-else-shown', { identifier: 'someone-else-shown', content: { data: {} } });
    const activeBefore = store.getSetting('activeChildId');
    store.setSetting('asks.reminderPrimes', '1');

    await reminders.endReminderSession();

    expect([...os.scheduled.keys()]).toEqual(['someone-else']);
    expect([...os.presented.keys()]).toEqual(['someone-else-shown']);
    for (const key of reminders.REMINDER_SETTING_KEYS) expect(store.getSetting(key), key).toBeNull();
    expect([...reminders.REMINDER_SETTING_KEYS].sort()).toEqual([
      'notifications.lockScreenNames',
      'reminders.cadence',
      'reminders.days',
      'reminders.enabled',
      'reminders.monthNotes',
      'reminders.paused',
      'reminders.time',
      'reminders.weeklyDay',
    ]);
    // Kept per phone: the open book and the ask count (design OQ-13.6 default).
    expect(store.getSetting('activeChildId')).toBe(activeBefore);
    expect(store.getSetting('asks.reminderPrimes')).toBe('1');
  });

  it('[NS-13-R13] a second account starts with none: reminders off, nothing planned, names off', async () => {
    reminders.writePrefs({ enabled: true, cadence: 'everyEvening', namesOnLockScreen: true });
    await reminders.rescheduleReminders();
    expect(os.scheduled.size).toBeGreaterThan(0);

    await reminders.endReminderSession();
    // The next person signs in: a re-plan from the settings plans nothing until they turn reminders on.
    expect(reminders.readPrefs()).toMatchObject({ enabled: false, namesOnLockScreen: false });
    expect(reminders.intendedPlan()).toEqual([]);
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(os.scheduled.size).toBe(0);
  });
});
