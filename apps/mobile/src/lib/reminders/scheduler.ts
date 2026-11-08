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
 * Permission is asked only from `turnOnReminders()`, which runs when the
 * user turns reminders on (the Settings switch, or the card after the first
 * letter, C-REQ-001). Nothing here ever prompts on its own. There is no sheet
 * in front of the iOS alert (CDesO-3): the switch, with its footer lines on
 * screen first, is the context (CCO-10, LEGAL-REQ-007).
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

/** Whether the last re-plan reached iOS. A failure is kept and shown (Settings, Reminders), never swallowed. */
export type ScheduleResult = { ok: true } | { ok: false };
const OK: ScheduleResult = { ok: true };
const FAILED: ScheduleResult = { ok: false };

let started = false;
let lastSignature: string | null = null;
let lastForegroundAt: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<ScheduleResult> = Promise.resolve(OK);
let lastResult: ScheduleResult = OK;
const resultListeners = new Set<(r: ScheduleResult) => void>();

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
  return (await getReminderPermissionDetail()).permission;
}

/**
 * The permission plus whether iOS delivers quietly to Notification Center only: Provisional (or Ephemeral), which
 * iOS always delivers that way, or Deliver Quietly chosen in iOS Settings (lock screen, banners and sound off, Notification
 * Center on). Both count as allowed (`permissionOf`); Settings adds a note.
 */
export async function getReminderPermissionDetail(): Promise<{ permission: ReminderPermission; quiet: boolean }> {
  try {
    const p = await Notifications.getPermissionsAsync();
    const permission = permissionOf(p);
    const ios = p.ios;
    const provisional = ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
    // Deliver Quietly: no lock screen, no banner (alertStyle NONE) and no sound, while Notification Center still shows
    // them. Anything else (Notification Center off too, or sound on) gets no note, because the note would not be true.
    // Unverified on a device (DEVICE_TEST_PLAN S1-47 e).
    const deliverQuietly =
      !!ios &&
      ios.allowsDisplayOnLockScreen === false &&
      ios.alertStyle === Notifications.IosAlertStyle.NONE &&
      ios.allowsDisplayInNotificationCenter !== false &&
      ios.allowsSound !== true;
    return { permission, quiet: permission === 'granted' && (provisional || deliverQuietly) };
  } catch {
    return { permission: 'undetermined', quiet: false };
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

/** What the prefs plan on this phone now, whatever iOS allows (the Settings preview and Next line). Pure read. */
export function intendedPlan(now = Date.now()): PlannedNotification[] {
  return planReminders({
    now,
    timeZone: deviceTimeZone(),
    prefs: readPrefs(),
    children: plannerChildren(),
    lastSaveAt: lastOwnSaveAt(),
    lastForegroundAt,
  });
}

/** The first planned notification (reminders-settings.md 2: preview and "Next: ..."), or null. */
export function nextReminder(now = Date.now()): PlannedNotification | null {
  return intendedPlan(now)[0] ?? null;
}

/** The current plan for this phone, or [] when reminders are off, paused or not allowed. */
export async function currentPlan(now = Date.now()): Promise<PlannedNotification[]> {
  const prefs = readPrefs();
  if (!prefs.enabled || prefs.paused) return [];
  if ((await getReminderPermission()) !== 'granted') return [];
  return intendedPlan(now);
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

/**
 * Re-plan now (serialised; concurrent calls queue behind each other). Never throws: it resolves with whether iOS
 * took the plan. A failure is no longer swallowed (reminders-settings.md 2): it is kept as `lastScheduleResult()`
 * and told to `subscribeScheduleResult` listeners, so Settings shows "Could not set reminders just now." with Try
 * again. The signature is not recorded on failure, so the next re-plan tries in full again.
 */
export function rescheduleReminders(): Promise<ScheduleResult> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  chain = chain.then(() =>
    apply().then(
      () => OK,
      () => {
        lastSignature = null;
        return FAILED;
      },
    ),
  ).then((r) => {
    if (r.ok !== lastResult.ok) {
      lastResult = r;
      for (const fn of resultListeners) fn(r);
    }
    return r;
  });
  return chain;
}

/** The result of the newest re-plan. */
export function lastScheduleResult(): ScheduleResult {
  return lastResult;
}

/** Told when the re-plan result changes (ok to failed, or back). Returns the unsubscribe. */
export function subscribeScheduleResult(fn: (r: ScheduleResult) => void): () => void {
  resultListeners.add(fn);
  return () => {
    resultListeners.delete(fn);
  };
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

/** What turning reminders on came to: the OS answer, whether the alert showed, and whether iOS took the plan. */
export interface TurnOnResult {
  permission: ReminderPermission;
  /** The iOS alert showed just now (the first time only; a "no" is never asked again, F1). */
  asked: boolean;
  scheduled: ScheduleResult;
}

/**
 * The user turned reminders on: the Settings switch, or "Yes, evenings" and "Set reminder" on the card after the
 * first letter. One function for both doors (reminders-settings.md 3).
 *
 * `enabled` is written first, so the switch stays on while iOS asks (the old sheet left it off behind itself). Then
 * the OS is asked once if it never has been, straight away: no sheet in front of the alert (CDesO-3). The choice is
 * kept either way; if iOS says no, Settings shows Open Settings and reminders start by themselves once allowed.
 * Callers record the ask (`noteAskShown`, `os_permission_result`) when `asked` is true; this module stays free of
 * analytics so boot (startReminders) loads nothing more.
 */
export async function turnOnReminders(opts: { cadence?: Exclude<Cadence, 'off'> } = {}): Promise<TurnOnResult> {
  const prefs = readPrefs();
  writePrefs({ enabled: true, paused: false, cadence: opts.cadence ?? (prefs.cadence === 'off' ? 'fewTimes' : prefs.cadence) });
  let permission: ReminderPermission = 'undetermined';
  let asked = false;
  try {
    let p = await Notifications.getPermissionsAsync();
    if (permissionOf(p) === 'undetermined' && p.canAskAgain !== false) {
      asked = true;
      p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
    }
    permission = permissionOf(p);
  } catch {
    permission = 'denied';
  }
  const scheduled = await rescheduleReminders();
  return { permission, asked, scheduled };
}

/** Kept for callers that need only the OS answer. Same as `turnOnReminders()`. */
export async function enableReminders(cadence?: Exclude<Cadence, 'off'>): Promise<ReminderPermission> {
  return (await turnOnReminders({ cadence })).permission;
}

/** The user turned reminders off: every scheduled nudge and note is removed. */
export async function disableReminders(): Promise<ScheduleResult> {
  writePrefs({ enabled: false });
  return rescheduleReminders();
}
