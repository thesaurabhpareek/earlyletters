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
 * | `reminders.weeklyDay` | 0 to 6 | `0` |
 * | `reminders.time` | `HH:MM`, 07:00 to 21:30 in 15-minute steps | `20:30` |
 * | `reminders.monthNotes` | `on` / `off` | `on` |
 * | `notifications.lockScreenNames` | `on` / `off` | `off` (D-025; remote config later, D-035) |
 */
import { currentUserId, getSetting, listChildren, listEntriesForChild, setSetting } from '../store';
import {
  clampReminderTime,
  DEFAULT_DAYS,
  DEFAULT_TIME,
  DEFAULT_WEEKLY_DAY,
  type Cadence,
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
} as const;

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
    namesOnLockScreen: onOff(K.names, LOCK_SCREEN_NAMES_DEFAULT),
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
  return onOff(K.names, LOCK_SCREEN_NAMES_DEFAULT);
}

/** Visible books, with each child's "Include in my reminders" switch. Hidden books are never reminded. */
export function plannerChildren(): PlannerChild[] {
  return listChildren().map((c) => ({ id: c.id, name: c.name, birthday: c.birthday, included: c.remindersOn }));
}

/** Newest save by this phone's user across visible books (smart quiet, F2). Null when nothing is saved yet. */
export function lastOwnSaveAt(): number | null {
  const me = currentUserId();
  let newest: number | null = null;
  for (const child of listChildren()) {
    for (const e of listEntriesForChild(child.id)) {
      if (e.authorId && me && e.authorId !== me) continue;
      const t = Date.parse(e.capturedAt);
      if (Number.isFinite(t) && (newest === null || t > newest)) newest = t;
    }
  }
  return newest;
}
