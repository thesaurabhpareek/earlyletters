/**
 * The invite token that opened the app, kept in the Keychain before any
 * screen shows (A-REQ-028), so it survives sign-in, consent and an app kill.
 * Deleted after acceptance, after a final error, or after 14 days
 * (A-NFR-008). Never in route params, logs or analytics.
 */
import { secureStorage } from '../supabase/secure-storage';
import { decodePendingInvite, encodePendingInvite, isInviteToken, type PendingInvite } from './invite-link.logic';

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

export async function clearPendingInvite(): Promise<void> {
  await secureStorage.removeItem(KEY).catch(() => {});
}
