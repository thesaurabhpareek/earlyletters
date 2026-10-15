/**
 * Plan reminders wired to the phone (BL-342, WP-F14-07): expo-notifications, the plan store and
 * the app's foreground. Started by startPlus() (plan-store.ts), so it runs from boot with the
 * StoreKit listener and needs no other caller.
 *
 * Never asks for notification permission: plan reminders schedule only when the person already
 * allowed notifications. Without permission the in-app card carries every notice (F14-U29).
 * A tap on a plan reminder opens Settings, Plan, never the purchase view (F14 6.1).
 */
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { getSetting, setSetting } from '../store';
import { PLAN_CARDS_SEEN_KEY, parseSeen, serializeSeen } from './plan-notices.logic';
import { isPlanReminder, PLAN_REMINDER_SOURCE, replanReminders, type NotificationPort, type PlanReminderRequest, type ReplanInput } from './plan-reminders';
import { getPlan, subscribePlan } from './plan-store';

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function triggerOf(r: PlanReminderRequest): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') {
    const [y, m, d] = r.at.date.split('-').map(Number);
    return { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, year: y, month: m, day: d, hour: r.at.hour, minute: r.at.minute, repeats: false };
  }
  // Android is later (K-24); an exact date until it has its own channel.
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(r.at.instant) };
}

export const expoNotificationPort: NotificationPort = {
  async allowed() {
    try {
      const p = await Notifications.getPermissionsAsync();
      const ios = p.ios?.status;
      return p.granted || ios === Notifications.IosAuthorizationStatus.PROVISIONAL || ios === Notifications.IosAuthorizationStatus.EPHEMERAL;
    } catch {
      return false;
    }
  },
  async scheduled() {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    return list.map((s) => ({ identifier: s.identifier, data: s.content.data }));
  },
  async cancel(identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  },
  async schedule(r) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.identifier,
      content: { title: r.title, body: r.body, data: r.data, sound: false },
      trigger: triggerOf(r),
    });
  },
};

export function currentReplanInput(): ReplanInput {
  return { plan: getPlan(), now: new Date().toISOString(), timeZone: deviceTimeZone() };
}

let signature: string | null = null;
let chain: Promise<void> = Promise.resolve();

/** Re-plan now (serialised). Never throws. */
export function replanPlanReminders(): Promise<void> {
  chain = chain.then(async () => {
    signature = await replanReminders(expoNotificationPort, currentReplanInput(), signature);
  });
  return chain;
}

// ── Dismissed cards ──────────────────────────────────────────────────────

export function seenPlanCards(): Set<string> {
  try {
    return parseSeen(getSetting(PLAN_CARDS_SEEN_KEY));
  } catch {
    return new Set();
  }
}

export function markPlanCardSeen(id: string): void {
  try {
    const seen = seenPlanCards();
    seen.add(id);
    setSetting(PLAN_CARDS_SEEN_KEY, serializeSeen(seen));
  } catch {
    // The card shows again next time; nothing else changes.
  }
}

let started = false;

/** Starts plan reminders for this app run. Returns a stop function. */
export function startPlanReminders(): () => void {
  if (started) return () => {};
  started = true;
  const unsubscribe = subscribePlan(() => void replanPlanReminders());
  const foreground = AppState.addEventListener('change', (s) => {
    if (s === 'active') void replanPlanReminders();
  });
  const taps = Notifications.addNotificationResponseReceivedListener((r) => {
    if (!isPlanReminder({ identifier: r.notification.request.identifier, data: r.notification.request.content.data })) return;
    try {
      router.navigate('/settings/plus');
    } catch {
      // Router not mounted yet (cold start): Tonight shows the card instead.
    }
  });
  void replanPlanReminders();
  return () => {
    unsubscribe();
    foreground.remove();
    taps.remove();
    started = false;
  };
}

export { PLAN_REMINDER_SOURCE };
