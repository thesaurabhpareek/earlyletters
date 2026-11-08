/**
 * App lock settings, kept as device settings (src/lib/store.ts getSetting / setSetting). No names, no text.
 *
 * | Key | Values | Default |
 * |---|---|---|
 * | `appLock.enabled` | `on` / `off` | `off` (CPO-2: offered at the end of first run, never on by default) |
 * | `appLock.grace` | `immediately`, `oneMinute`, `fiveMinutes` | `oneMinute` (F17 J step 2) |
 *
 * Imports only the store, so reminders (lib/reminders/prefs.ts) can ask `appLockOn()` without loading React Native
 * or the authentication module.
 */
import { getSetting, setSetting } from '../store';
import { parseGrace, type GraceChoice } from './machine';

export const APP_LOCK_KEYS = { enabled: 'appLock.enabled', grace: 'appLock.grace' } as const;

/** Whether the parent turned the lock on. A store that cannot be read counts as off (nothing to lock yet). */
export function appLockOn(): boolean {
  try {
    return getSetting(APP_LOCK_KEYS.enabled) === 'on';
  } catch {
    return false;
  }
}

export function appLockGrace(): GraceChoice {
  try {
    return parseGrace(getSetting(APP_LOCK_KEYS.grace));
  } catch {
    return parseGrace(null);
  }
}

export function writeAppLock(patch: { enabled?: boolean; grace?: GraceChoice }): void {
  if (patch.grace !== undefined) setSetting(APP_LOCK_KEYS.grace, patch.grace);
  if (patch.enabled !== undefined) setSetting(APP_LOCK_KEYS.enabled, patch.enabled ? 'on' : 'off');
}
