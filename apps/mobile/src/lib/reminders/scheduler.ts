/**
 * Local reminders on the phone (expo-notifications). Founder decision 3 Oct
 * 2026: reminders are local only; nothing goes through a server, so they
 * work offline and carry nothing anywhere (C-NFR-001).
 *
 * `startReminders()` is called once at boot by the root layout. It re-plans
 * (planner.ts) and replaces our scheduled notifications whenever anything
 * that matters changes: any store write (a save, a child, a setting), the
 * app coming to the foreground (also catches a new time zone or a day
 * change), and the permission changing in iOS Settings. A re-plan that
 * produces the same list touches nothing.
 *
 * iOS: each note is a one-off calendar trigger with no time zone, so it fires
 * at that wall-clock time wherever the phone is (travel from Los Angeles to
 * New York keeps 8:30 PM, C-REQ-003). Android (later): exact dates, re-planned
 * on every foreground.
 *
 * Permission is asked only from `enableReminders()`, which runs when the
 * user turns reminders on (Settings, Reminders; or the priming card after the
 * first letter, C-REQ-001). Nothing here ever prompts on its own.
 */
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { subscribe } from '../store';
import { reminderCopy } from './copy';
import { ID_PREFIX, planReminders, planSignature, type Cadence, type PlannedNotification } from './planner';
import { lastOwnSaveAt, plannerChildren, readPrefs, writePrefs } from './prefs';

/** Marks our notifications in `content.data`, so we never cancel anyone else's. */
export const REMINDER_SOURCE = 'scribe.reminders';
const ANDROID_CHANNEL = 'reminders';
const STORE_DEBOUNCE_MS = 1200;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

let started = false;
let lastSignature: string | null = null;
let lastForegroundAt: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function permissionOf(p: Notifications.NotificationPermissionsStatus): ReminderPermission {
  const ios = p.ios?.status;
  if (p.granted || ios === Notifications.IosAuthorizationStatus.PROVISIONAL || ios === Notifications.IosAuthorizationStatus.EPHEMERAL) return 'granted';
  return p.status === 'undetermined' ? 'undetermined' : 'denied';
}

/** Current OS permission, without asking. */
export async function getReminderPermission(): Promise<ReminderPermission> {
  try {
    return permissionOf(await Notifications.getPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

function isOurs(data: unknown): data is { source: string; kind?: string } {
  return !!data && typeof data === 'object' && (data as { source?: unknown }).source === REMINDER_SOURCE;
}

function triggerFor(p: PlannedNotification): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') {
    const [y, m, d] = p.date.split('-').map(Number);
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: y,
      month: m,
      day: d,
      hour: p.hour,
      minute: p.minute,
      repeats: false,
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.fireAt, channelId: ANDROID_CHANNEL };
}

/** The current plan for this phone, or [] when reminders are off, paused or not allowed. */
export async function currentPlan(now = Date.now()): Promise<PlannedNotification[]> {
  const prefs = readPrefs();
  if (!prefs.enabled || prefs.paused) return [];
  if ((await getReminderPermission()) !== 'granted') return [];
  return planReminders({
    now,
    timeZone: deviceTimeZone(),
    prefs,
    children: plannerChildren(),
    lastSaveAt: lastOwnSaveAt(),
    lastForegroundAt,
  });
}

async function apply(): Promise<void> {
  const plan = await currentPlan();
  const signature = planSignature(plan);
  if (signature === lastSignature) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if (isOurs(s.content.data) || s.identifier.startsWith(ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier).catch(() => {});
    }
  }
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title: p.title,
        body: p.body,
        // Enums only. No names, no text, nothing about a letter.
        data: { source: REMINDER_SOURCE, kind: p.kind },
        // Silent: the evening nudge often lands near a sleeping baby.
        sound: false,
      },
      trigger: triggerFor(p),
    });
  }
  lastSignature = signature;
}

/** Re-plan now (serialised; concurrent calls queue behind each other). Never throws. */
export function rescheduleReminders(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  chain = chain.then(() => apply().catch(() => {}));
  return chain;
}

function rescheduleSoon(delay = STORE_DEBOUNCE_MS): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void rescheduleReminders();
  }, delay);
}

/**
 * Wire reminders for this app run. Call once from the root layout after the
 * store is ready. Returns a stop function (tests, fast refresh).
 */
export function startReminders(): () => void {
  if (started) return () => {};
  started = true;
  lastForegroundAt = Date.now();

  // Our nudges never show while the app is open: the person is already here.
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const ours = isOurs(n.request.content.data);
      return { shouldShowBanner: !ours, shouldShowList: !ours, shouldPlaySound: false, shouldSetBadge: false };
    },
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: reminderCopy.settings.channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
      showBadge: false,
    }).catch(() => {});
  }

  const unsubscribeStore = subscribe(() => rescheduleSoon());
  const appState = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    lastForegroundAt = Date.now();
    void rescheduleReminders(); // also picks up a new time zone, a new day, or permission changed in Settings
  });
  const responses = Notifications.addNotificationResponseReceivedListener((r) => {
    const data = r.notification.request.content.data;
    if (!isOurs(data)) return;
    try {
      router.navigate(data.kind === 'evening' ? '/' : '/book');
    } catch {
      // Router not mounted yet (cold start): the app opens on Tonight anyway.
    }
  });

  void rescheduleReminders();

  return () => {
    unsubscribeStore();
    appState.remove();
    responses.remove();
    if (timer) clearTimeout(timer);
    timer = null;
    started = false;
  };
}

/**
 * Whether turning reminders on will show the iOS permission alert, so the
 * priming sheet (priming-sheet.tsx) should come first. False once the person
 * has answered the alert either way: a "no" is never asked again (F1); the
 * screen offers Open Settings instead.
 */
export async function needsPriming(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return permissionOf(p) === 'undetermined' && p.canAskAgain !== false;
  } catch {
    return false;
  }
}

/**
 * The user turned reminders on. Asks the OS once if it has never been asked;
 * the choice is saved either way, so if the OS says no, Settings shows
 * "Open Settings" and reminders start by themselves once allowed (F1: never
 * re-prompt).
 */
export async function enableReminders(cadence?: Exclude<Cadence, 'off'>): Promise<ReminderPermission> {
  let status: ReminderPermission = 'undetermined';
  try {
    let p = await Notifications.getPermissionsAsync();
    if (permissionOf(p) === 'undetermined' && p.canAskAgain !== false) {
      p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
    }
    status = permissionOf(p);
  } catch {
    status = 'denied';
  }
  const prefs = readPrefs();
  writePrefs({ enabled: true, paused: false, cadence: cadence ?? (prefs.cadence === 'off' ? 'fewTimes' : prefs.cadence) });
  await rescheduleReminders();
  return status;
}

/** The user turned reminders off: every scheduled nudge and note is removed. */
export async function disableReminders(): Promise<void> {
  writePrefs({ enabled: false });
  await rescheduleReminders();
}
