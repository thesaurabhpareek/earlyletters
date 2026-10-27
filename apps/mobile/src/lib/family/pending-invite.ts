/**
 * The invite token that opened the app, kept in the Keychain before any
 * screen shows (A-REQ-028), so it survives sign-in, consent and an app kill.
 * Deleted after acceptance, after a final error, or after 14 days
 * (A-NFR-008). Never in route params, logs or analytics.
 */
import { secureStorage } from '../supabase/secure-storage';
import { decodePendingInvite, encodePendingInvite, isInviteToken, shouldClearPendingInvite, type PendingInvite } from './invite-link.logic';

const KEY = 'scribe.family.pendingInvite';

export async function savePendingInvite(token: string, now = Date.now()): Promise<void> {
  if (!isInviteToken(token)) return;
  await secureStorage.setItem(KEY, encodePendingInvite({ token, receivedAt: now }));
}

export async function readPendingInvite(now = Date.now()): Promise<PendingInvite | null> {
  let raw: string | null = null;
  try {
    raw = await secureStorage.getItem(KEY);
  } catch {
    return null; // Keychain locked (before first unlock): try again later
  }
  const p = decodePendingInvite(raw, now);
  if (raw && !p) await clearPendingInvite();
  return p;
}

/**
 * Deletes the stored invite. With `token`, only if it is still that one: a newer link that arrived
 * while the join sheet was open (+native-intent overwrites the item) is kept for the next launch.
 */
export async function clearPendingInvite(token?: string): Promise<void> {
  if (token !== undefined) {
    let raw: string | null = null;
    try {
      raw = await secureStorage.getItem(KEY);
    } catch {
      return; // Keychain locked: leave it; it expires on its own
    }
    if (shouldClearPendingInvite(raw, token)) await secureStorage.removeItem(KEY).catch(() => {});
    return;
  }
  await secureStorage.removeItem(KEY).catch(() => {});
}
