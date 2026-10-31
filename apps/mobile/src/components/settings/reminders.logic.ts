/**
 * Settings, Reminders (EXPERIENCE_PASS_2026-10 S34, package P6): pure rules app/settings/reminders.tsx draws, so
 * test/settings-p6b.test.ts runs them in Node.
 *
 * One switch per decision (HIG Settings: "Minimize the number of settings you offer"). The master "Reminders" switch
 * already keeps the cadence, the evenings and the time when it is turned off (lib/reminders disableReminders writes
 * only `enabled`), so "Pause all reminders" said the same thing twice and is gone. A phone that was paused before
 * reads as off here, and turning the switch on starts it again (enableReminders clears `paused`).
 *
 * Back from iOS Settings with notifications allowed, while reminders are on: the notifications-off card collapses
 * and "Reminders are on." shows once as a toast.
 */
import type { ReminderPermission, ReminderPrefs } from '@/lib/reminders';

/** The master switch: on only when reminders are on and not paused (a pause from before this screen reads as off). */
export function remindersSwitchOn(prefs: Pick<ReminderPrefs, 'enabled' | 'paused'>): boolean {
  return prefs.enabled && !prefs.paused;
}

/** The notifications-off card: only while reminders are on and iOS says no. */
export function showNotificationsOff(prefs: Pick<ReminderPrefs, 'enabled' | 'paused'>, permission: ReminderPermission | null): boolean {
  return remindersSwitchOn(prefs) && permission === 'denied';
}

/** "Reminders are on." once: the permission changed from denied to granted while reminders were on. */
export function remindersTurnedOnInSettings(before: ReminderPermission | null, after: ReminderPermission, prefs: Pick<ReminderPrefs, 'enabled' | 'paused'>): boolean {
  return before === 'denied' && after === 'granted' && remindersSwitchOn(prefs);
}
