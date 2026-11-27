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
import { appLockOn } from '../app-lock/prefs';
import { deleteSetting, getSetting, setSetting, subscribe } from '../store';
import { reminderCopy } from './copy';
import { ID_PREFIX, planReminders, planSignature, type Cadence, type LibraryDayNote, type PlannedNotification } from './planner';
import { anchorAt, dayNamesOn, lastMadeLetter, lastOwnSaveAt, plannerChildren, readOnSince, readPrefs, writeOnSince, writePrefs } from './prefs';
import { readTypedDays, sweepPastTypedDays, typedDaysBuildEnabled } from './typed-days';
import { lockScreenSafe, publicBodyOk, publicTitleOk, REMINDER_SOURCE, reminderContent, routeForReminder } from './payload';
import { registerReminderCategory } from './categories';
import { LAST_PLANNED_VERSION_KEY, replanAfterUpdate } from './update';
import { PLAN_ID_PREFIX } from '../billing/plan-reminders.logic';
import { isoDate, zonedParts } from './tz';
import { PLAN_MAX } from './budget';
import { daysBuildEnabled, libraryDaysAllowed, remoteConfigReader, watchLibraryDaysPause, withoutLibraryNotes, type RemoteConfigReader } from './library-days';

/** Marks our notifications in `content.data`, so we never cancel anyone else's (defined in payload.ts). */
export { REMINDER_SOURCE };
const ANDROID_CHANNEL = 'reminders';
/**
 * A store write re-plans after this quiet time, so a burst of writes (a save touches several tables) plans once.
 * What a person can see inside the window (BL-2247): for up to 1.2 s after names, day names or App lock turn names or
 * a typed day's words off, plus the time the re-plan takes, iOS still holds the notes planned before, which may name a
 * child or carry the words, and a delivered typed-day note still shows its words in Notification Center. Acceptable
 * while the app stays open: in the foreground our notes show no banner and join no list (`setNotificationHandler` in
 * `startReminders`), and the screen that changed the switch is in front of Notification Center. Not covered: the app
 * leaving the foreground inside the window. Nothing re-plans on the way out (the AppState listener acts on `active`
 * only) and iOS may suspend the app before the timer fires, so the old plan can stand until the next foreground and a
 * note due in between shows what was just turned off. The delay stays at 1.2 s: closing this gap would take a re-plan
 * on the way out, which this module does not do.
 */
const STORE_DEBOUNCE_MS = 1200;
const COLD_START_ROUTE_RETRIES = 5;
const COLD_START_ROUTE_RETRY_MS = 200;

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
/**
 * Whether a typed day's words may show (CPrivO-58: day names on and names on, so App lock off), as the last apply saw
 * it. Null before the first apply of this run, so a launch with the words off checks Notification Center once.
 */
let lastWordsShown: boolean | null = null;
/**
 * Whether names may show (names on the lock screen, so App lock off), as the last apply saw it (FU-11b). Null before the
 * first apply of this run, so a launch with names off checks Notification Center once.
 */
let lastNamesShown: boolean | null = null;
/** The planner's typed-day ids (planner.ts `typedNote`). */
const TYPED_ID_PREFIX = `${ID_PREFIX}typed.`;
/** The kinds whose words can name a child with names on (planner.ts `eveningCopy`, `monthNoteCopy`), and their ids. */
const NAMED_KINDS: ReadonlySet<string> = new Set(['evening', 'monthAge', 'birthday']);
const NAMED_ID_PREFIXES = ['evening.', 'month.', 'birthday.'].map((k) => `${ID_PREFIX}${k}`);
/** The one day-names switch's key (prefs.ts `K.dayNames`; a test pins it to `REMINDER_SETTING_KEYS`). */
const DAY_NAMES_KEY = 'notifications.dayNames';

/**
 * The signed config reader for the library days pause (BL-1008). Built on first use and only when the build switch is
 * on, so a build without `EXPO_PUBLIC_DAYS` loads nothing extra. Tests inject their own.
 */
let configReader: RemoteConfigReader | null | undefined;
function reader(): RemoteConfigReader | null {
  if (configReader === undefined) configReader = daysBuildEnabled() ? remoteConfigReader() : null;
  return configReader;
}

/** Tests only: the reader of the signed config (null: none), or undefined to build the default again. */
export function setLibraryDaysReaderForTest(r: RemoteConfigReader | null | undefined): void {
  configReader = r;
}

/** The running app version. Read late so boot and tests that never need it do not load expo-constants. */
function currentAppVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('expo-constants').default.expoConfig?.version as string | undefined) ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

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

type NoteRequest = { identifier: string; content: { data?: unknown } };

/** A note of ours, scheduled or delivered: our data, or our id. The one test before we cancel or dismiss anything. */
function isOurNote(r: NoteRequest): boolean {
  return isOurs(r.content.data) || r.identifier.startsWith(ID_PREFIX);
}

/** A typed-day note of ours (a subset of `isOurNote`): our typed-day data, or our typed-day id. */
function isOurTypedDayNote(r: NoteRequest): boolean {
  return (isOurs(r.content.data) && r.content.data.kind === 'typedDay') || r.identifier.startsWith(TYPED_ID_PREFIX);
}

/** A month, birthday or evening note of ours (a subset of `isOurNote`): our data with that kind, or that id. */
function isOurNamableNote(r: NoteRequest): boolean {
  return (isOurs(r.content.data) && NAMED_KINDS.has(r.content.data.kind ?? '')) || NAMED_ID_PREFIXES.some((p) => r.identifier.startsWith(p));
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

/** The phone's local date, YYYY-MM-DD, in the zone the plan uses. */
function localToday(now: number): string {
  const p = zonedParts(now, deviceTimeZone());
  return isoDate({ y: p.y, m: p.m, d: p.d });
}

/** Typed days to plan: none while the build switch is off (a pending one is then cancelled at this plan). */
function typedDaysToPlan() {
  return typedDaysBuildEnabled() ? readTypedDays() : [];
}

/**
 * Ticked library days to plan, already resolved to local dates. None yet: the days module's planner feed is BL-1012,
 * and until it lands no library note is planned on any build. The gates below already count it (NS-46-R31).
 */
function libraryDaysToPlan(): LibraryDayNote[] {
  return [];
}

/** A typed day or a ticked day waits: the day-only gate keeps planning for these with Reminders off (NS-46-R31). */
function dayNotesWaiting(): boolean {
  return typedDaysToPlan().length > 0 || libraryDaysToPlan().length > 0;
}

/** What the prefs plan on this phone now, whatever iOS allows (the Settings preview and Next line). Pure read. */
export function intendedPlan(now = Date.now(), planPending: number = PLAN_MAX): PlannedNotification[] {
  return planReminders({
    typedDays: typedDaysToPlan(),
    libraryDays: libraryDaysToPlan(),
    dayNamesOn: dayNamesOn(),
    planPending,
    now,
    timeZone: deviceTimeZone(),
    prefs: readPrefs(),
    children: plannerChildren(),
    lastSaveAt: lastOwnSaveAt(),
    lastForegroundAt,
    anchorAt: anchorAt(),
    lastLetter: lastMadeLetter(),
  });
}

/** The first planned notification (reminders-settings.md 2: preview and "Next: ..."), or null. */
export function nextReminder(now = Date.now()): PlannedNotification | null {
  return intendedPlan(now)[0] ?? null;
}

/**
 * The current plan for this phone, or [] when not allowed, or when reminders are off (or paused) and no typed or ticked
 * day waits. A typed day and a ticked day still come with Reminders off (planner.ts, W-G7, NS-46-R31).
 */
export async function currentPlan(now = Date.now(), planPending: number = PLAN_MAX): Promise<PlannedNotification[]> {
  const prefs = readPrefs();
  if ((!prefs.enabled || prefs.paused) && !dayNotesWaiting()) return [];
  if ((await getReminderPermission()) !== 'granted') return [];
  return intendedPlan(now, planPending);
}

/** How many plan notices (`plan.` ids, lib/billing) are pending now: they keep their slots inside the 60 (CR-69 A1). Ids only, never content. */
function pendingPlanNotices(scheduled: readonly { identifier: string }[]): number {
  return scheduled.filter((s) => s.identifier.startsWith(PLAN_ID_PREFIX)).length;
}

/**
 * A re-plan replaces only what is still scheduled: a note already delivered keeps its words in Notification Center
 * after they are turned off. One read of Notification Center serves both rules:
 * - `words` (CPrivO-58): the typed day's words may no longer show, so every delivered typed-day note of ours whose body
 *   is not the fixed line is dismissed.
 * - `names` (FU-11b): names may no longer show (names off, or App lock on), so every delivered month, birthday or evening
 *   note of ours whose title or body is not on the name-free allowlists (payload.ts `publicTitleOk`, `publicBodyOk`) is
 *   dismissed. A note planned with names off is always on them, so it stays. A title or body that reads back empty
 *   fails closed: the platform may still show text it did not return, so the note goes (it costs only a name-free note).
 * Only our own notes (by our data or our id): anyone else's stay. The text is compared, never logged or kept.
 */
async function dismissDelivered(rules: { words: boolean; names: boolean }): Promise<void> {
  const fixed = reminderCopy.neutral.typedDay.body;
  for (const n of await Notifications.getPresentedNotificationsAsync()) {
    const { identifier, content } = n.request;
    const words = rules.words && isOurTypedDayNote(n.request) && content.body !== fixed;
    const named = rules.names && isOurNamableNote(n.request) && !(onList(content.title, publicTitleOk) && onList(content.body, publicBodyOk));
    if (words || named) await Notifications.dismissNotificationAsync(identifier).catch(() => {});
  }
}

/** A delivered text on the allowlist. A missing or empty one is not: we cannot see what it shows, so it fails closed. */
function onList(text: string | null | undefined, ok: (t: string) => boolean): boolean {
  return text != null && text !== '' && ok(text);
}

/**
 * CPrivO-58 and FU-11b: the words or the names went off (or this is the first apply of the run with them off), so the
 * delivered notes that carry them go, once per change (`lastWordsShown`, `lastNamesShown`), never at every re-plan. A
 * failed read (no module on the web preview) never fails the apply: the next apply tries again.
 * Must not throw: it runs in `apply()`'s finally, where a throw would replace the plan's own error.
 */
async function settleDelivered(wordsShown: boolean, namesShown: boolean): Promise<void> {
  if (wordsShown) lastWordsShown = true;
  if (namesShown) lastNamesShown = true;
  const words = !wordsShown && lastWordsShown !== false;
  const names = !namesShown && lastNamesShown !== false;
  if (!words && !names) return;
  try {
    await dismissDelivered({ words, names });
    if (words) lastWordsShown = false;
    if (names) lastNamesShown = false;
  } catch {
    // nothing to log: the notes may hold a parent's words or a child's name
  }
}

/**
 * BL-1009: under App lock the day-names switch is off (prefs.ts `dayNamesOn`) and its stored value is cleared, so the
 * switch is not turned back on by itself when the lock goes (D-family DESIGN.md J-D65). The delete wakes the store
 * listeners once; the next apply finds nothing to clear. A store that cannot be written never stops the plan.
 */
function clearDayNamesUnderAppLock(): void {
  try {
    if (appLockOn() && getSetting(DAY_NAMES_KEY) !== null) deleteSetting(DAY_NAMES_KEY);
  } catch {
    // the store is closing: the next apply clears it
  }
}

async function apply(): Promise<void> {
  // A phone that turned reminders on before the anchor existed starts its count now (once), never stops at once.
  if (readPrefs().enabled && readOnSince() === null) writeOnSince(Date.now());
  // NS-18-R7: a typed day's words go the day after it, before anything is planned from them. A sweep that cannot run
  // (the store is closing) never stops the plan: the next plan sweeps again.
  try {
    sweepPastTypedDays(localToday(Date.now()));
  } catch {
    // nothing to log: the keys hold a parent's words
  }
  clearDayNamesUnderAppLock();
  // CPrivO-58, FU-11b: delivered notes are settled after the plan, so when the plan succeeds no note with the words or
  // a name is still scheduled to fire after the read (on failure the latches reset and the next apply settles again).
  // In a finally, so the early returns in `applyPlan` settle them too: a delivered note can outlive its plan (a typed
  // day already fired, or swept the day after).
  const namesShown = readPrefs().namesOnLockScreen;
  const wordsShown = dayNamesOn() && namesShown;
  try {
    await applyPlan();
  } finally {
    await settleDelivered(wordsShown, namesShown);
  }
}

/** Replaces our scheduled notes with the current plan; touches nothing when the plan is unchanged. */
async function applyPlan(): Promise<void> {
  // Reminders off and no typed day: nothing to plan and nothing to read. An empty plan already applied (`lastSignature`
  // is '') means none of ours is pending, so no read. The first apply after the switch goes off (or after a launch, or
  // a failure) still reads once, to cancel what was scheduled earlier (BL-1189). A typed or ticked day still comes when off.
  const off = !readPrefs().enabled && !dayNotesWaiting();
  if (off && lastSignature === '') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  // A pause drops library notes from the plan, so the signature changes and the pending ones are cancelled below.
  // Typed days and every other kind stay (NS-46-R33).
  // BL-1009: with names off, nothing outside the name-free allowlists reaches iOS (payload.ts `lockScreenSafe`).
  const namesOn = readPrefs().namesOnLockScreen;
  const plan = off
    ? []
    : withoutLibraryNotes(await currentPlan(Date.now(), pendingPlanNotices(scheduled)), libraryDaysAllowed(reader())).map((p) => lockScreenSafe(p, namesOn));
  const signature = planSignature(plan);
  if (signature === lastSignature) return;
  for (const s of scheduled) {
    if (isOurNote(s)) await Notifications.cancelScheduledNotificationAsync(s.identifier).catch(() => {});
  }
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: reminderContent(p),
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
        // The plan may not have reached iOS, so a note with the words or a name can still fire: the next apply settles again.
        lastWordsShown = null;
        lastNamesShown = null;
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
  // A pause (or its end) arriving mid-session re-plans within the same debounce as a store write (NS-46-R42).
  const unsubscribePause = watchLibraryDaysPause(reader(), () => rescheduleSoon());
  const appState = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    lastForegroundAt = Date.now();
    void rescheduleReminders(); // also picks up a new time zone, a new day, or permission changed in Settings
  });
  // A tap is routed once, by the notification's own data. The same response can reach both the listener and the
  // cold-start read below, so the first one wins.
  let routedKey: string | null = null;
  const routeResponse = (r: Notifications.NotificationResponse, attempt = 0): void => {
    const target = routeForReminder(r.notification.request.content.data);
    if (!target) return;
    const key = `${r.notification.request.identifier}@${r.notification.date}`;
    if (attempt === 0) {
      if (routedKey === key) return;
      routedKey = key;
    }
    try {
      router.navigate(target);
    } catch {
      // Router not mounted yet (cold start): try again after the next frame, a few times, then stay on Tonight.
      if (attempt < COLD_START_ROUTE_RETRIES) setTimeout(() => routeResponse(r, attempt + 1), COLD_START_ROUTE_RETRY_MS);
    }
  };
  const responses = Notifications.addNotificationResponseReceivedListener((r) => routeResponse(r));
  // Cold start: the tap that launched the app arrived before this listener existed, so read it (sync, no network).
  try {
    const launching = Notifications.getLastNotificationResponse();
    if (launching) routeResponse(launching);
  } catch {
    // Nothing to read: the app opens on Tonight.
  }

  void registerReminderCategory(Notifications.setNotificationCategoryAsync);
  // First launch after an update: plan everything again, after the first frame and not awaited (NS-32-R16, L-03).
  setTimeout(() => {
    void replanAfterUpdate({
      current: currentAppVersion(),
      read: () => getSetting(LAST_PLANNED_VERSION_KEY),
      write: (v) => setSetting(LAST_PLANNED_VERSION_KEY, v),
      replan: () => {
        lastSignature = null;
        return rescheduleReminders();
      },
    }).catch(() => {}); // a store read that throws must never surface (nothing to log, no content)
  }, 0);

  void rescheduleReminders();

  return () => {
    unsubscribeStore();
    unsubscribePause();
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
  if (!(prefs.enabled && !prefs.paused) || readOnSince() === null) writeOnSince(Date.now()); // turned on again: the anchor moves (R27)
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

/** What the first-tick door came to: the OS answer, whether the iOS alert showed, and whether iOS took the plan. */
export type DayAskResult = TurnOnResult;

/**
 * The first-tick door (NS-46-R31, BL-1007; D-family DESIGN.md J-D60 step 3, Q-FD-20 CLOSED as CL-026): the parent
 * ticked their first day. iOS is asked once, and only while it has never been asked; a "no" is final and never asked
 * again (iOS keeps the answer, and a denied phone is not asked). Unlike `turnOnReminders`, this never writes
 * `enabled`: ticking a day is not turning on evening reminders, and the day-only gate plans the day either way.
 * The sentence before the alert ("Your iPhone will ask to send reminders", D-S25.firstTickAsk) is the caller's, and
 * its words are PROPOSED behind G2 and G3; this module stays free of words and analytics. Shipped dark: no screen
 * calls it until the Days surface turns on.
 */
export async function askForDayReminders(): Promise<DayAskResult> {
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

/**
 * Erase everything (BL-387, F17 6.2 F): every nudge and note of ours goes, scheduled or already in Notification
 * Center (a note can carry a child's name when the person chose names, F13), and the last plan is forgotten so a
 * new first run plans afresh. Local only. Never throws.
 */
export async function forgetReminders(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const run = async (): Promise<ScheduleResult> => {
    lastSignature = null;
    // A "Could not set reminders" from before the erase belongs to the erased phone, not to the fresh first run.
    if (!lastResult.ok) {
      lastResult = OK;
      for (const fn of resultListeners) fn(OK);
    }
    // Two steps, each in its own guard (BL-1009): a scheduled list that cannot be read never keeps a delivered note,
    // which may name a child, in Notification Center after sign-out or an erase.
    try {
      for (const s of await Notifications.getAllScheduledNotificationsAsync()) {
        if (isOurNote(s)) await Notifications.cancelScheduledNotificationAsync(s.identifier).catch(() => {});
      }
    } catch {
      // Nothing scheduled, or no notification module (web preview).
    }
    try {
      for (const n of await Notifications.getPresentedNotificationsAsync()) {
        if (isOurNote(n.request)) await Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {});
      }
    } catch {
      // Nothing delivered, or no notification module (web preview).
    }
    return OK;
  };
  chain = chain.then(run, run);
  await chain;
}

/** The user turned reminders off: every scheduled nudge and note is removed, except a typed day's note, which still comes (W-G7). */
export async function disableReminders(): Promise<ScheduleResult> {
  writePrefs({ enabled: false });
  return rescheduleReminders();
}
