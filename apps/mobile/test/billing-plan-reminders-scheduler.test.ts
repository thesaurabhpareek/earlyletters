/**
 * Plan reminders as local notifications (G-15; Q-003 memo section 5): the
 * scheduler in lib/billing/plan-reminders.ts, which turns the pure planner's
 * list (tested in billing-plan-reminders.test.ts) into expo-notifications.
 * expo-notifications, expo-router and react-native are replaced by small
 * fakes, so these tests check only this file's own promises:
 *
 * - every planned reminder is an exact date trigger with our source and id;
 * - it cancels only its own notifications, never the evening reminders or
 *   anyone else's;
 * - a re-plan that changes nothing touches nothing;
 * - nothing is scheduled without permission, and pending ones are cleared;
 * - iOS is asked only from the "Remind me" tap, and only once;
 * - a tapped reminder opens Settings, Plan, and nothing else does;
 * - a failing notification API never throws into the app.
 * Delivery itself is checked on a device (DEVICE_TEST_PLAN S2-17).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { billingCopy } from '@scribe/content';
import type { NativeEntitlementSnapshot } from '../modules/scribe-store/types';
import { longDate } from '../src/lib/dates';
import { planFromSnapshot, sanitizeSnapshot, type PlanState } from '../src/lib/billing/plan.logic';
import { PLAN_ID_PREFIX } from '../src/lib/billing/plan-reminders.logic';

type Pending = { identifier: string; content: { title?: string; body?: string; data?: unknown; sound?: unknown }; trigger: unknown };
type Permissions = { status: 'granted' | 'denied' | 'undetermined'; granted: boolean; canAskAgain: boolean };

/** The fake phone: pending notifications, the permission, listeners. Hoisted so the mocks below can see it. */
const phone = vi.hoisted(() => {
  const state = {
    pending: [] as Pending[],
    permissions: { status: 'granted', granted: true, canAskAgain: true } as Permissions,
    responseListeners: new Set<(r: unknown) => void>(),
    appStateListeners: new Set<(s: string) => void>(),
    lastResponse: null as unknown,
    failGetAll: false,
  };
  const api = {
    getPermissionsAsync: vi.fn(async () => state.permissions),
    requestPermissionsAsync: vi.fn(async (_request?: unknown) => {
      state.permissions = { status: 'granted', granted: true, canAskAgain: true };
      return state.permissions;
    }),
    getAllScheduledNotificationsAsync: vi.fn(async () => {
      if (state.failGetAll) throw new Error('notifications unavailable');
      return state.pending.map((p) => ({ ...p }));
    }),
    cancelScheduledNotificationAsync: vi.fn(async (id: string) => {
      state.pending = state.pending.filter((p) => p.identifier !== id);
    }),
    scheduleNotificationAsync: vi.fn(async (req: { identifier: string; content: Pending['content']; trigger: unknown }) => {
      state.pending.push({ identifier: req.identifier, content: req.content, trigger: req.trigger });
      return req.identifier;
    }),
    addNotificationResponseReceivedListener: vi.fn((fn: (r: unknown) => void) => {
      state.responseListeners.add(fn);
      return { remove: () => state.responseListeners.delete(fn) };
    }),
    getLastNotificationResponse: vi.fn(() => state.lastResponse),
    clearLastNotificationResponse: vi.fn(() => {
      state.lastResponse = null;
    }),
  };
  const router = { navigate: vi.fn(), push: vi.fn(), replace: vi.fn() };
  return { state, api, router };
});

vi.mock('expo-notifications', () => ({
  ...phone.api,
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar', TIME_INTERVAL: 'timeInterval' },
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
}));
vi.mock('expo-router', () => ({ router: phone.router }));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: (_type: string, fn: (s: string) => void) => {
      phone.state.appStateListeners.add(fn);
      return { remove: () => phone.state.appStateListeners.delete(fn) };
    },
  },
}));
// The evening reminders' permission reader: the same answer the fake phone gives.
vi.mock('../src/lib/reminders/scheduler', () => ({
  getReminderPermission: async () => {
    const p = phone.state.permissions;
    return p.granted ? 'granted' : p.status === 'undetermined' ? 'undetermined' : 'denied';
  },
}));

import {
  askPlanReminderPermission,
  canAskForReminders,
  desiredPlanReminders,
  PLAN_REMINDER_SOURCE,
  PLAN_ROUTE,
  reschedulePlanReminders,
  startPlanReminders,
} from '../src/lib/billing/plan-reminders';

const NOW = Date.parse('2026-12-01T12:00:00.000Z');
const END = '2027-03-01T00:00:00.000Z';

/** A real StoreKit snapshot, sanitised and mapped like the app does it. */
function planOf(over: { ownership?: 'purchased' | 'familyShared'; willAutoRenew?: boolean } = {}): PlanState {
  const ownership = over.ownership ?? 'purchased';
  const raw: NativeEntitlementSnapshot = {
    entitlements: [{ productId: 'plus.annual', expiresAt: END, purchasedAt: '2026-03-01T00:00:00.000Z', originalPurchasedAt: '2025-03-01T00:00:00.000Z', ownership, environment: 'production', isTrial: false, isUpgraded: false }],
    statuses: [{ productId: 'plus.annual', expiresAt: END, purchasedAt: '2026-03-01T00:00:00.000Z', ownership, environment: 'production', isTrial: false, isUpgraded: false, state: 'subscribed', willAutoRenew: over.willAutoRenew ?? true }],
    checkedAt: new Date(NOW).toISOString(),
  };
  return planFromSnapshot(sanitizeSnapshot(raw));
}

/** Something the evening reminders scheduled, and something another library scheduled. */
const EVENING: Pending = { identifier: 'el.evening.2026-12-02', content: { title: 'x', data: { source: 'scribe.reminders' } }, trigger: { type: 'calendar' } };
const FOREIGN: Pending = { identifier: 'some-other-library', content: { title: 'y' }, trigger: { type: 'date', date: NOW + 1 } };
/** Left over from an earlier plan: ours by id, and ours by source with an unexpected id. */
const STALE_BY_ID: Pending = { identifier: `${PLAN_ID_PREFIX}annualLong.2026-06-01`, content: { title: 'z' }, trigger: { type: 'date', date: NOW + 2 } };
const STALE_BY_SOURCE: Pending = { identifier: 'renamed', content: { title: 'z', data: { source: PLAN_REMINDER_SOURCE, kind: 'yearly' } }, trigger: { type: 'date', date: NOW + 3 } };

let plan: PlanState;
const planListeners = new Set<() => void>();
const source = { getPlan: () => plan, subscribePlan: (l: () => void) => (planListeners.add(l), () => planListeners.delete(l)) };
let stop: (() => void) | null = null;

const ids = () => phone.state.pending.map((p) => p.identifier).sort();
const ours = () => phone.state.pending.filter((p) => p.identifier.startsWith(PLAN_ID_PREFIX));

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  phone.state.pending = [];
  phone.state.permissions = { status: 'granted', granted: true, canAskAgain: true };
  phone.state.lastResponse = null;
  phone.state.failGetAll = false;
  plan = planOf();
  for (const fn of Object.values(phone.api)) fn.mockClear();
  for (const fn of Object.values(phone.router)) fn.mockClear();
});

afterEach(async () => {
  stop?.();
  stop = null;
  await reschedulePlanReminders();
  vi.useRealTimers();
});

describe('[G-15] scheduling', () => {
  it('schedules every planned reminder as an exact date trigger with our id, our source, and no price or child', async () => {
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    const wanted = desiredPlanReminders(plan, NOW);
    expect(wanted.length).toBeGreaterThan(0);
    expect(ids()).toEqual(wanted.map((w) => w.id).sort());
    for (const w of wanted) {
      const p = phone.state.pending.find((x) => x.identifier === w.id)!;
      expect(p.trigger).toEqual({ type: 'date', date: w.fireAt });
      expect(p.content.title).toBe(billingCopy.reminders.title);
      expect(p.content.body).toBe(w.body);
      expect(p.content.data).toEqual({ source: PLAN_REMINDER_SOURCE, kind: w.kind });
      expect(p.content.sound).toBe(false);
      expect(p.content.body).not.toMatch(/\$|\{price\}|\{child\}|\{date\}/);
    }
  });

  it('writes the date the way the rest of the app does (longDate)', () => {
    const wanted = desiredPlanReminders(plan, NOW, 'UTC');
    const renews = wanted.find((w) => w.kind === 'annualLong')!;
    expect(renews.body).toBe(billingCopy.reminders.renews.replace('{date}', longDate('2027-03-01')));
    expect(renews.body).not.toMatch(/2027-03-01/);
  });

  it('cancels only its own pending notifications, by id or by source', async () => {
    phone.state.pending = [EVENING, FOREIGN, STALE_BY_ID, STALE_BY_SOURCE];
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(ids()).toContain(EVENING.identifier);
    expect(ids()).toContain(FOREIGN.identifier);
    expect(ids()).not.toContain(STALE_BY_ID.identifier);
    expect(ids()).not.toContain(STALE_BY_SOURCE.identifier);
    const cancelled = phone.api.cancelScheduledNotificationAsync.mock.calls.map((c) => c[0]).sort();
    expect(cancelled).toEqual([STALE_BY_ID.identifier, STALE_BY_SOURCE.identifier].sort());
  });

  it('a re-plan that changes nothing touches nothing', async () => {
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    phone.api.cancelScheduledNotificationAsync.mockClear();
    phone.api.scheduleNotificationAsync.mockClear();
    phone.api.getAllScheduledNotificationsAsync.mockClear();
    await reschedulePlanReminders();
    await reschedulePlanReminders();
    expect(phone.api.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(phone.api.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(phone.api.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing without permission and clears what was pending, leaving the evening reminders alone', async () => {
    phone.state.permissions = { status: 'denied', granted: false, canAskAgain: false };
    phone.state.pending = [EVENING, STALE_BY_ID];
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(ids()).toEqual([EVENING.identifier]);
    expect(phone.api.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('a plan change (auto-renew turned off) cancels every pending plan reminder, after a short debounce', async () => {
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(ours().length).toBeGreaterThan(0);
    plan = planOf({ willAutoRenew: false });
    const before = phone.api.getAllScheduledNotificationsAsync.mock.calls.length;
    // Only the listener re-plans here: the test never calls reschedulePlanReminders() itself.
    for (const l of planListeners) l();
    await vi.advanceTimersByTimeAsync(100);
    expect(phone.api.getAllScheduledNotificationsAsync).toHaveBeenCalledTimes(before); // not yet: debounced
    expect(ours().length).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.waitFor(() => expect(ours()).toEqual([]));
    expect(phone.api.getAllScheduledNotificationsAsync).toHaveBeenCalledTimes(before + 1);
  });

  it('coming to the foreground re-plans (a new day, a zone change, a change made in iOS Settings)', async () => {
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    plan = planOf({ ownership: 'familyShared' });
    const before = phone.api.getAllScheduledNotificationsAsync.mock.calls.length;
    // Only the AppState listener re-plans here: the test never calls reschedulePlanReminders() itself.
    for (const l of phone.state.appStateListeners) l('background');
    await vi.advanceTimersByTimeAsync(1000);
    expect(phone.api.getAllScheduledNotificationsAsync).toHaveBeenCalledTimes(before); // going away is not a reason
    expect(ours().length).toBeGreaterThan(0);
    for (const l of phone.state.appStateListeners) l('active');
    await vi.waitFor(() => expect(ours()).toEqual([]));
    expect(phone.api.getAllScheduledNotificationsAsync).toHaveBeenCalledTimes(before + 1);
  });

  it('never throws into the app when the notification API fails', async () => {
    phone.state.failGetAll = true;
    stop = startPlanReminders(source);
    await expect(reschedulePlanReminders()).resolves.toBeUndefined();
    // The next attempt after the API recovers still runs (the failure did not record a signature).
    phone.state.failGetAll = false;
    await reschedulePlanReminders();
    expect(ours().length).toBeGreaterThan(0);
  });

  it('stop() removes every listener', async () => {
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(planListeners.size).toBe(1);
    expect(phone.state.appStateListeners.size).toBe(1);
    expect(phone.state.responseListeners.size).toBe(1);
    stop();
    stop = null;
    expect(planListeners.size).toBe(0);
    expect(phone.state.appStateListeners.size).toBe(0);
    expect(phone.state.responseListeners.size).toBe(0);
  });
});

describe('[G-15] a tapped reminder opens Settings, Plan', () => {
  const response = (data: unknown) => ({ notification: { request: { content: { data } } } });

  it('ours navigates to the Plan screen; another notification does nothing', () => {
    stop = startPlanReminders(source);
    for (const l of phone.state.responseListeners) l(response({ source: 'scribe.reminders' }));
    expect(phone.router.navigate).not.toHaveBeenCalled();
    for (const l of phone.state.responseListeners) l(response({ source: PLAN_REMINDER_SOURCE, kind: 'annualShort' }));
    expect(phone.router.navigate).toHaveBeenCalledWith(PLAN_ROUTE);
  });

  it('a cold start from a tapped plan reminder opens the Plan screen once and clears the response', async () => {
    phone.state.lastResponse = response({ source: PLAN_REMINDER_SOURCE, kind: 'yearly' });
    stop = startPlanReminders(source);
    expect(phone.api.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(phone.router.navigate).toHaveBeenCalledWith(PLAN_ROUTE);
    expect(phone.router.navigate).toHaveBeenCalledTimes(1);
  });

  it('a cold start from someone else\'s notification is left alone', async () => {
    phone.state.lastResponse = response({ source: 'scribe.reminders' });
    stop = startPlanReminders(source);
    await vi.advanceTimersByTimeAsync(0);
    expect(phone.api.clearLastNotificationResponse).not.toHaveBeenCalled();
    expect(phone.router.navigate).not.toHaveBeenCalled();
  });
});

describe('[G-15] permission is asked only from the "Remind me" tap', () => {
  it('starting and re-planning never ask', async () => {
    phone.state.permissions = { status: 'undetermined', granted: false, canAskAgain: true };
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(phone.api.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(ours()).toEqual([]);
  });

  it('asks iOS once when it has never been asked, then schedules', async () => {
    phone.state.permissions = { status: 'undetermined', granted: false, canAskAgain: true };
    stop = startPlanReminders(source);
    await reschedulePlanReminders();
    expect(await canAskForReminders()).toBe(true);
    expect(await askPlanReminderPermission()).toBe('granted');
    expect(phone.api.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(phone.api.requestPermissionsAsync.mock.calls[0][0]).toEqual({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
    expect(ours().length).toBeGreaterThan(0);
    // Asked once: a second tap re-plans but never prompts again.
    expect(await canAskForReminders()).toBe(false);
    expect(await askPlanReminderPermission()).toBe('granted');
    expect(phone.api.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('never prompts after a no, or when iOS says it cannot ask again', async () => {
    phone.state.permissions = { status: 'denied', granted: false, canAskAgain: false };
    expect(await canAskForReminders()).toBe(false);
    expect(await askPlanReminderPermission()).toBe('denied');
    phone.state.permissions = { status: 'undetermined', granted: false, canAskAgain: false };
    expect(await canAskForReminders()).toBe(false);
    expect(await askPlanReminderPermission()).toBe('undetermined');
    expect(phone.api.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('answers denied, and still re-plans, when the permission API throws', async () => {
    phone.api.getPermissionsAsync.mockRejectedValueOnce(new Error('no notifications here'));
    expect(await askPlanReminderPermission()).toBe('denied');
    phone.api.getPermissionsAsync.mockRejectedValueOnce(new Error('no notifications here'));
    expect(await canAskForReminders()).toBe(false);
  });
});
