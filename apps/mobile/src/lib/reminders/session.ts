/**
 * The session ends, reminders end (BL-967; NS-13-R14, R13, R15). When the person signed in on this phone signs out,
 * on any path (Sign out, account deletion, the under-18 answer, a sign-out Supabase makes itself), or another account
 * signs in, their reminders end: the reminder settings are cleared, so the next person starts with reminders off and
 * names off, and every scheduled or delivered notification of ours is removed (`forgetReminders`). One hook in
 * lib/auth/session-provider.tsx runs this on the signed-in user id. A phone that never signed in is untouched, and so
 * are the open book and the ask counts (`activeChildId`, `asks.*`: kept per phone).
 */
import { deleteSetting } from '../store';
import { REMINDER_SETTING_KEYS } from './prefs';
import { forgetReminders } from './scheduler';

/** True when the person signed in here is gone: signed out (no user id now), or another account signed in. */
export function sessionEnded(previousUserId: string | null, userId: string | null): boolean {
  return previousUserId !== null && userId !== previousUserId;
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
