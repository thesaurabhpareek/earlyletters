/**
 * The session ends, reminders end (BL-967; NS-13-R14, R13, R15). When the person signed in on this phone signs out,
 * on any path (Sign out, account deletion, the under-18 answer, a sign-out Supabase makes itself), or another account
 * signs in, their reminders end: the reminder settings are cleared, so the next person starts with reminders off and
 * names off, and every scheduled or delivered notification of ours is removed (`forgetReminders`). One hook in
 * lib/auth/session-provider.tsx runs `settleReminderSession` on the signed-in user id. A phone that never signed in is
 * untouched, and so are the open book and the ask counts (`activeChildId`, `asks.*`: kept per phone).
 *
 * Durable: the clear runs after the session is gone from the Keychain, so an app killed in between would hand A's
 * reminders to the next account. While a session is signed in, the phone keeps a mark (`reminders.session`, a flag with
 * no id). A launch that settles with no session and finds the mark ends the reminders then (NS-13-R13; review B on #904).
 */
import { endDaysSession } from '../days';
import { endMomentsSession } from '../moments';
import { deleteSetting, getSetting, setSetting } from '../store';
import { REMINDER_SESSION_KEY, REMINDER_SETTING_KEYS } from './prefs';
import { forgetReminders } from './scheduler';

/** True when the person signed in here is gone: signed out (no user id now), or another account signed in. */
export function sessionEnded(previousUserId: string | null, userId: string | null): boolean {
  return previousUserId !== null && userId !== previousUserId;
}

/**
 * Runs on every settled change of the signed-in user id, and once at launch when the Keychain has answered. Ends the
 * reminders when a session ended (here, or before a kill: no session now and the mark still set), and marks a session's
 * reminders. Never throws.
 */
export async function settleReminderSession(previousUserId: string | null, userId: string | null): Promise<void> {
  // The days file goes FIRST and synchronously, before any await (NS-47-R15, ADR 0032 item 3).
  if (sessionEnded(previousUserId, userId)) (endDaysSession(), endMomentsSession());
  let marked = false;
  try {
    marked = getSetting(REMINDER_SESSION_KEY) === 'on';
  } catch {
    return; // no store open: nothing to settle
  }
  const end = sessionEnded(previousUserId, userId) || (userId === null && marked);
  if (end) (endDaysSession(), endMomentsSession()); // a kill between sign-out and here: the mark brings us back, so the file goes now
  // endReminderSession clears the settings (the mark too) before its first await, so the new mark below stays.
  const ending = end ? endReminderSession() : null;
  if (userId !== null && (end || !marked)) {
    try {
      setSetting(REMINDER_SESSION_KEY, 'on');
    } catch {
      // store closed: the next settle marks it
    }
  }
  await ending;
}

/**
 * Clears the reminder settings first, so a re-plan already queued by the store plans nothing, then removes every
 * reminder of ours, scheduled or delivered. Local only. Never throws.
 */
export async function endReminderSession(): Promise<void> {
  try {
    for (const key of REMINDER_SETTING_KEYS) deleteSetting(key);
  } catch {
    // The store is closed (an erase is under way, and it forgets reminders itself).
  }
  await forgetReminders();
}
