/**
 * Settings, Reminders (EXPERIENCE_PASS_2026-10 S34, package P6): pure rules app/settings/reminders.tsx draws, so
 * test/settings-p6b.test.ts runs them in Node.
 *
 * One switch per decision (HIG Settings: "Minimize the number of settings you offer"). The master "Reminders" switch
 * already keeps the cadence, the evenings and the time when it is turned off (lib/reminders disableReminders writes
 * only `enabled`), so "Pause all reminders" said the same thing twice and is gone. A phone that was paused before
 * reads as off here, and turning the switch on starts it again (turnOnReminders clears `paused`).
 *
 * Back from iOS Settings with notifications allowed, while reminders are on: the notifications-off card collapses
 * and "Reminders are on." shows once as a toast.
 */
import { reminderCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import type { ReminderPermission, ReminderPrefs, ReminderTime } from '@/lib/reminders';

const fill = (text: string, values: Record<string, string>) => renderTemplate(text, values);

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

// ---------------------------------------------------------------------------
// Inline choices, no sheet (reminders-settings.md as ruled: CDesO-3, CCO-10, LEGAL-REQ-007)
// ---------------------------------------------------------------------------

/** The bits of a planned notification the page needs (lib/reminders PlannedNotification). */
export interface NextPlanned {
  date: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

/** Weekday (0 = Sunday) of a YYYY-MM-DD local calendar date, without any time zone. */
export function weekdayOfIso(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

/**
 * The footer under the switch. Off: the explanation, on screen before the switch is ever turned on, so the iOS alert
 * that follows a tap is never the first word (CCO-10; LEGAL-REQ-007 "after an in-app explanation"). On: "Changes save
 * as you go." (iOS settings save on change; there is no Save button).
 */
export function switchFooter(on: boolean): string {
  const p = reminderCopy.priming;
  return on ? reminderCopy.settings.savesAsYouGo : `${p.quietLine} ${p.privacyLine}`;
}

/**
 * "Next: Tuesday at 8:30 PM." from the planner's first planned notification. Null while the switch is off, or when
 * nothing is planned. While iOS says no, "Not sending yet." (the intent is kept; nothing is scheduled).
 */
export function nextLine(input: { on: boolean; permission: ReminderPermission | null; next: Pick<NextPlanned, 'date' | 'hour' | 'minute'> | null; formatTime: (t: ReminderTime) => string }): string | null {
  if (!input.on) return null;
  if (input.permission === 'denied') return reminderCopy.settings.notSendingYet;
  if (!input.next) return null;
  return fill(reminderCopy.settings.nextLine, { weekday: reminderCopy.weekdays[weekdayOfIso(input.next.date)]!, time: input.formatTime(input.next) });
}

/** What VoiceOver hears 600 ms after the last change: "Saved. Next: Tuesday at 8:30 PM." Never a modal. */
export function savedAnnouncement(line: string | null): string {
  const saved = reminderCopy.settings.saved;
  return line ? `${saved} ${line}` : saved;
}

/** The debounce before the saved announcement (reminders-settings.md 2). */
export const SAVED_ANNOUNCE_MS = 600;

/** The preview card: the real words of the first planned notification; null when nothing is planned. */
export function previewOf(next: NextPlanned | null): { title: string; body: string } | null {
  return next ? { title: next.title, body: next.body } : null;
}

/** The month and birthday row's note: "Starts once a birth date is added." while no included book has one yet. */
export function monthRowNote(children: { birthday: string | null; included: boolean }[]): string {
  const s = reminderCopy.settings;
  return children.some((c) => c.included && !!c.birthday) ? s.monthNotesHelp : s.birthDateNote;
}

/**
 * Names in notifications. With App lock on, names are off and the switch disabled (design 2.10; F17-REQ-015).
 * `appLockOn` is false until the app lock lands; the lock lane passes its state here.
 */
export function namesRow(namesOnLockScreen: boolean, appLockOn: boolean): { value: boolean; disabled: boolean; help: string } {
  const s = reminderCopy.settings;
  if (appLockOn) return { value: false, disabled: true, help: s.lockNames };
  return { value: namesOnLockScreen, disabled: false, help: namesOnLockScreen ? s.namesHelpOn : s.namesHelpOff };
}

/** What follows turning reminders on, from either door: the words to say, and the action to offer. */
export function turnOnOutcome(r: { permission: ReminderPermission; scheduled: { ok: boolean } }, line: string | null): { message: string; action: 'change' | 'openSettings' | 'tryAgain' } {
  const s = reminderCopy.settings;
  if (r.permission !== 'granted') return { message: s.deniedTitle, action: 'openSettings' };
  if (!r.scheduled.ok) return { message: s.scheduleFailed, action: 'tryAgain' };
  return { message: line ? `${s.onToast} ${line}` : s.onToast, action: 'change' };
}
