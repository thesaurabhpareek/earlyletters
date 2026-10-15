/**
 * Plan reminders as local notifications (G-15; Q-003 memo section 5). The
 * policy is the pure planner in plan-reminders.logic.ts; this file only turns
 * its list into expo-notifications, and re-plans whenever the plan changes
 * (StoreKit's Transaction.updates through plan-store), the app comes to the
 * foreground (a new day, a new time zone, auto-renew turned off in Apple's
 * settings, notifications allowed in iOS Settings) and once at start.
 *
 * - Our notifications carry `data.source = 'scribe.plan'` and ids starting
 *   `plan.`. We cancel only those; the evening reminders (lib/reminders,
 *   `el.` ids, source `scribe.reminders`) cancel only theirs, so neither ever
 *   removes the other's.
 * - Date triggers (an exact instant), not calendar triggers: the legal windows
 *   are absolute, so travel must not move a reminder outside its window.
 * - Without notification permission nothing is scheduled; the in-app note
 *   (plan-notice.tsx, Settings, Plan) still shows inside each window.
 * - Never asks for permission on its own: only `askPlanReminderPermission()`,
 *   from the purchase confirmation's "Remind me" button.
 * - Nothing here leaves the phone, and the content holds no child and no price.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { longDate } from '../dates';
import { getReminderPermission, type ReminderPermission } from '../reminders/scheduler';
import { billingCopy } from './copy';
import type { PlanState } from './plan.logic';
import { PLAN_ID_PREFIX, planPlanReminders, planReminderSignature, subjectOf, type PlannedPlanReminder } from './plan-reminders.logic';

/** Marks our notifications in `content.data`. */
export const PLAN_REMINDER_SOURCE = 'scribe.plan';
/** Where a tapped plan reminder opens: Settings, Plan, where the full note sits. */
export const PLAN_ROUTE = '/settings/plus';
const DEBOUNCE_MS = 800;

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function isOurs(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as { source?: unknown }).source === PLAN_REMINDER_SOURCE;
}

/** What should be scheduled for this plan now (pure planner plus this phone's zone and date format). */
export function desiredPlanReminders(plan: PlanState, now = Date.now(), timeZone = deviceTimeZone()): PlannedPlanReminder[] {
  return planPlanReminders({
    now,
    timeZone,
    subject: subjectOf(plan),
    words: billingCopy.reminders,
    formatDay: (ymd) => longDate(ymd),
  });
}

interface Source {
  getPlan: () => PlanState;
  subscribePlan: (listener: () => void) => () => void;
}

let source: Source | null = null;
let lastSignature: string | null = null;
let chain: Promise<void> = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | null = null;

async function apply(): Promise<void> {
  if (!source) return;
  const permission = await getReminderPermission();
  const plan = permission === 'granted' ? desiredPlanReminders(source.getPlan()) : [];
  const signature = planReminderSignature(plan);
  if (signature === lastSignature) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if (isOurs(s.content.data) || s.identifier.startsWith(PLAN_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier).catch(() => {});
    }
  }
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title: p.title,
        body: p.body,
        // Enums only: no price, no date of purchase, nothing about a child or a letter.
        data: { source: PLAN_REMINDER_SOURCE, kind: p.kind },
        sound: false,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.fireAt, ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) },
    });
  }
  lastSignature = signature;
}

/** Re-plan now (serialised). Never throws. */
export function reschedulePlanReminders(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  chain = chain.then(() => apply().catch(() => {}));
  return chain;
}

function soon(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void reschedulePlanReminders();
  }, DEBOUNCE_MS);
}

function openPlan(): void {
  try {
    router.navigate(PLAN_ROUTE);
  } catch {
    // Router not mounted yet: the note is on Settings, Plan and appears on open.
  }
}

/** Called by startPlus() (plan-store.ts) with its own plan source. Returns a stop function. */
export function startPlanReminders(src: Source): () => void {
  source = src;
  lastSignature = null;
  const unsubscribe = src.subscribePlan(soon);
  const appState = AppState.addEventListener('change', (s) => {
    if (s === 'active') void reschedulePlanReminders();
  });
  const responses = Notifications.addNotificationResponseReceivedListener((r) => {
    if (isOurs(r.notification.request.content.data)) openPlan();
  });
  // Cold start from a tapped plan reminder.
  try {
    const r = Notifications.getLastNotificationResponse();
    if (r && isOurs(r.notification.request.content.data)) {
      Notifications.clearLastNotificationResponse();
      setTimeout(openPlan, 0);
    }
  } catch {
    // Not available on this platform: the note still appears in the app.
  }
  void reschedulePlanReminders();
  return () => {
    unsubscribe();
    appState.remove();
    responses.remove();
    if (timer) clearTimeout(timer);
    timer = null;
    source = null;
  };
}

/**
 * The "Remind me" button on the purchase confirmation. Asks iOS once, only
 * when it has never been asked; a "no" is never asked again (the Plan screen
 * offers Open Settings). Re-plans either way.
 */
export async function askPlanReminderPermission(): Promise<ReminderPermission> {
  let status: ReminderPermission = 'undetermined';
  try {
    const p = await Notifications.getPermissionsAsync();
    status = await getReminderPermission();
    if (status === 'undetermined' && p.canAskAgain !== false) {
      await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
      status = await getReminderPermission();
    }
  } catch {
    status = 'denied';
  }
  await reschedulePlanReminders();
  return status;
}

/** Whether the "Remind me" button should show (iOS has never been asked). */
export async function canAskForReminders(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return (await getReminderPermission()) === 'undetermined' && p.canAskAgain !== false;
  } catch {
    return false;
  }
}

export { getReminderPermission as getPlanReminderPermission };
