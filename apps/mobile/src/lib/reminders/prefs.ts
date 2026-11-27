/**
 * Reminder preferences, kept as device settings (src/lib/store.ts
 * getSetting / setSetting). Values are plain enums, weekdays and a time; no
 * names or text. Keys:
 *
 * | Key | Values | Default |
 * |---|---|---|
 * | `reminders.enabled` | `on` / `off` | `off` (asked only when the user turns reminders on) |
 * | `reminders.paused` | `on` / `off` | `off` (C-REQ-007) |
 * | `reminders.cadence` | `off`, `weekly`, `fewTimes`, `everyEvening` | `fewTimes` (C-REQ-002) |
 * | `reminders.days` | weekdays, comma separated, 0 = Sunday | `2,6` (Tuesday, Saturday) |
 * | `reminders.weeklyDay` | 0 to 6 | `6` (Saturday) |
 * | `reminders.time` | `HH:MM`, 07:00 to 21:30 in 15-minute steps | `20:30` |
 * | `reminders.monthNotes` | `on` / `off` | `on` |
 * | `notifications.lockScreenNames` | `on` / `off` | `off` (D-025; remote config later, D-035) |
 * | `reminders.onSince` | epoch ms, when reminders were last turned on (the anchor's second half, NS-13 R27) | absent |
 * | `reminders.session` | `on` or absent | absent; `on` while these reminders belong to a signed-in session (session.ts) |
 * | `notifications.dayNames` | `on` / `off` | `off`; the one day-names switch: a typed day's words on the lock screen, only with names on too (NS-18-R3, CL-119, CPrivO-58) |
 *
 * Typed days keep their own keys, `typedDay.<yyyy-mm-dd>` (typed-days.ts), cleared with these at sign-out.
 *
 * While the app lock is on, names are off whatever that key says (F17-REQ-015; CDesO and CCO rule): the stored choice
 * is kept, not overwritten, and comes back if the lock is turned off. Turning the lock on or off writes a setting, so
 * the store listeners reschedule with the new answer (scheduler.ts).
 */
import { lastLetterKind } from '@scribe/core';
import { appLockOn } from '../app-lock/prefs';
import { currentUserId, getSetting, listChildren, newestMadeLetter, newestWaitingDraftAt, setSetting } from '../store';
import {
  clampReminderTime,
  DEFAULT_DAYS,
  DEFAULT_TIME,
  DEFAULT_WEEKLY_DAY,
  type Cadence,
  type LastLetter,
  type PlannerChild,
  type ReminderPrefs,
  type ReminderTime,
} from './planner';

/**
 * D-025: names stay off the lock screen unless the user turns them on. The
 * decision says this default comes from remote config
 * (`lock_screen_names_default`); until the config module exists it is this
 * constant.
 */
export const LOCK_SCREEN_NAMES_DEFAULT = false;

const K = {
  enabled: 'reminders.enabled',
  paused: 'reminders.paused',
  cadence: 'reminders.cadence',
  days: 'reminders.days',
  weeklyDay: 'reminders.weeklyDay',
  time: 'reminders.time',
  monthNotes: 'reminders.monthNotes',
  names: 'notifications.lockScreenNames',
  session: 'reminders.session',
  onSince: 'reminders.onSince',
  dayNames: 'notifications.dayNames',
} as const;

/** Every reminder setting above: cleared when the session ends (session.ts; NS-13-R14). */
export const REMINDER_SETTING_KEYS: readonly string[] = Object.values(K);

/** `on` while the reminders on this phone were set up inside a signed-in session (session.ts). */
export const REMINDER_SESSION_KEY = K.session;

const onOff = (key: string, fallback: boolean): boolean => {
  const v = getSetting(key);
  return v === 'on' ? true : v === 'off' ? false : fallback;
};

export function parseTime(v: string | null): ReminderTime {
  const m = v ? /^(\d{1,2}):(\d{2})$/.exec(v) : null;
  if (!m) return DEFAULT_TIME;
  return clampReminderTime({ hour: Number(m[1]), minute: Number(m[2]) }).time;
}

export function formatTimeSetting(t: ReminderTime): string {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

export function parseDays(v: string | null): number[] {
  if (v == null) return DEFAULT_DAYS;
  const days = v
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : DEFAULT_DAYS;
}

function parseCadence(v: string | null): Cadence {
  return v === 'off' || v === 'weekly' || v === 'everyEvening' ? v : 'fewTimes';
}

export function readPrefs(): ReminderPrefs {
  const storedWeekly = getSetting(K.weeklyDay);
  const weekly = storedWeekly === null ? NaN : Number(storedWeekly);
  return {
    enabled: onOff(K.enabled, false),
    paused: onOff(K.paused, false),
    cadence: parseCadence(getSetting(K.cadence)),
    days: parseDays(getSetting(K.days)),
    weeklyDay: Number.isInteger(weekly) && weekly >= 0 && weekly <= 6 ? weekly : DEFAULT_WEEKLY_DAY,
    time: parseTime(getSetting(K.time)),
    monthNotes: onOff(K.monthNotes, true),
    namesOnLockScreen: lockScreenNamesOn(),
  };
}

/** Writes only the fields given. Every write fires the store listeners, which reschedule (scheduler.ts). */
export function writePrefs(patch: Partial<Omit<ReminderPrefs, 'enabled'>> & { enabled?: boolean }): void {
  if (patch.enabled !== undefined) setSetting(K.enabled, patch.enabled ? 'on' : 'off');
  if (patch.paused !== undefined) setSetting(K.paused, patch.paused ? 'on' : 'off');
  if (patch.cadence !== undefined) setSetting(K.cadence, patch.cadence);
  if (patch.days !== undefined) setSetting(K.days, parseDays(patch.days.join(',')).join(','));
  if (patch.weeklyDay !== undefined) setSetting(K.weeklyDay, String(patch.weeklyDay));
  if (patch.time !== undefined) setSetting(K.time, formatTimeSetting(clampReminderTime(patch.time).time));
  if (patch.monthNotes !== undefined) setSetting(K.monthNotes, patch.monthNotes ? 'on' : 'off');
  if (patch.namesOnLockScreen !== undefined) setSetting(K.names, patch.namesOnLockScreen ? 'on' : 'off');
}

/** Whether notifications may name a child on the lock screen (for any feature that sends local notifications). */
export function lockScreenNamesOn(): boolean {
  if (appLockOn()) return false; // the app lock keeps every name off the lock screen (F17-REQ-015)
  return onOff(K.names, LOCK_SCREEN_NAMES_DEFAULT);
}

/**
 * The one day-names switch, effective value (NS-18-R3, NS-47-R12, E45): stored on AND App lock off. Off by default.
 * App lock wins without overwriting the stored choice, as for names. The switch's screen is another row (C-S24).
 */
export function dayNamesOn(): boolean {
  if (appLockOn()) return false;
  return onOff(K.dayNames, false);
}

/**
 * Visible books, with each child's "Include in my reminders" switch and "Quiet this book" (`child_member_prefs.quiet_at`,
 * read as `Child.quiet`). Hidden books are never reminded; the planner gives a quiet book nothing (planner.ts).
 */
export function plannerChildren(): PlannerChild[] {
  return listChildren().map((c) => ({ id: c.id, name: c.name, birthday: c.birthday, included: c.remindersOn, quiet: c.quiet === true }));
}

/**
 * Newest letter made by this phone's user across visible books: a kept letter's `captured_at` (a quiet-day mark is not
 * a letter), or a draft waiting at Keep or held (never one being recorded or marked `discarding`), by its `createdAt`
 * (NS-13-R8, R27). Smart quiet and the anchor both read it. Two single-row queries, the same as `lastMadeLetter`
 * (BL-1648, NS-48-R27): no book is loaded. Null when nothing is made yet.
 */
export function lastOwnSaveAt(): number | null {
  const books = listChildren().map((c) => c.id);
  const kept = newestMadeLetter(books, currentUserId());
  const waiting = newestWaitingDraftAt(books);
  let newest: number | null = null;
  for (const iso of [kept?.capturedAt, waiting]) {
    const t = iso ? Date.parse(iso) : NaN;
    if (Number.isFinite(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

/**
 * The newest letter this phone's user made, as the planner's layers read it (NS-48-R27): `at` (epoch ms of
 * `captured_at`) and the kind (`spoke` or `typed`; null when it cannot be told). One query, no entry text. Null when
 * nothing is made yet. Only books that are included and not quiet count: a quieted book, or one with "Include in my
 * reminders" off, gives a key nothing, not its letter's date and not its kind (NS-48-R21, NS-32-R14). Smart quiet and
 * the anchor still read every visible book (`lastOwnSaveAt`).
 */
export function lastMadeLetter(): LastLetter | null {
  const books = listChildren()
    .filter((c) => c.remindersOn && c.quiet !== true)
    .map((c) => c.id);
  if (books.length === 0) return null;
  const row = newestMadeLetter(books, currentUserId());
  const at = row ? Date.parse(row.capturedAt) : NaN;
  return row && Number.isFinite(at) ? { at, kind: lastLetterKind(row.captureMode, row.kind) } : null;
}

/** When reminders were last turned on (epoch ms), or null. */
export function readOnSince(): number | null {
  const n = Number(getSetting(K.onSince));
  return getSetting(K.onSince) !== null && Number.isFinite(n) ? n : null;
}

/** Stamps the moment reminders were turned on; the back-off counts from it when no letter is newer (R27). */
export function writeOnSince(at: number): void {
  setSetting(K.onSince, String(Math.round(at)));
}

/** The anchor (NS-13 section 3a): the later of the newest made letter and `reminders.onSince`; null when neither exists. */
export function anchorAt(): number | null {
  const a = lastOwnSaveAt();
  const b = readOnSince();
  return a === null ? b : b === null ? a : Math.max(a, b);
}
