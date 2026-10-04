/**
 * Reminders (PRD C F1, F2, C-REQ-001 to -011): local notifications only.
 *
 * For the coordinator: call `startReminders()` once at boot (root layout,
 * after the store is ready). For the priming card after the first letter
 * (C-REQ-001), on "Yes, evenings": if `await needsPriming()`, show
 * `<ReminderPrimingSheet>` and call `enableReminders()` from its one button;
 * otherwise call `enableReminders()` straight away. For the Settings home
 * row: `remindersSummary()`.
 */
import { copy } from '../copy';
import { reminderCopy } from './copy';
import type { ReminderPrefs, ReminderTime } from './planner';
import { readPrefs } from './prefs';

export { reminderCopy } from './copy';
export {
  clampReminderTime,
  DEFAULT_PREFS,
  DEFAULT_WINDOW,
  isQuietTime,
  planReminders,
  type Cadence,
  type PlannedNotification,
  type ReminderPrefs,
  type ReminderTime,
  type ReminderWindow,
} from './planner';
export { LOCK_SCREEN_NAMES_DEFAULT, lockScreenNamesOn, readPrefs, writePrefs } from './prefs';
export { ReminderPrimingSheet } from './priming-sheet';
export {
  currentPlan,
  disableReminders,
  enableReminders,
  getReminderPermission,
  needsPriming,
  rescheduleReminders,
  startReminders,
  type ReminderPermission,
} from './scheduler';

/** "8:30 PM" (en-US) or "20:30" (en-GB), in the device's English locale. */
export function formatReminderTime(t: ReminderTime, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1, t.hour, t.minute)));
  } catch {
    return `${t.hour}:${String(t.minute).padStart(2, '0')}`;
  }
}

/** Value for the Settings home row: "Off", "Paused" or "A few times a week, 8:30 PM". */
export function remindersSummary(prefs: ReminderPrefs = readPrefs()): string {
  const r = copy.settings.reminders;
  if (!prefs.enabled) return reminderCopy.settings.offSummary;
  if (prefs.paused) return reminderCopy.settings.pausedSummary;
  const cadence =
    prefs.cadence === 'weekly' ? r.weeklyLabel : prefs.cadence === 'everyEvening' ? r.everyEveningLabel : prefs.cadence === 'off' ? r.offLabel : r.fewTimesLabel;
  return `${cadence}, ${formatReminderTime(prefs.time)}`;
}
