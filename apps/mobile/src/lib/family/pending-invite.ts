/**
 * The invite token that opened the app, kept in the Keychain before any
 * screen shows (A-REQ-028), so it survives sign-in, consent and an app kill.
 * Deleted after acceptance, after a final error, or after 14 days
 * (A-NFR-008). Never in route params, logs or analytics.
 */
import { secureStorage } from '../supabase/secure-storage';
import { decodePendingInvite, encodePendingInvite, isInviteToken, isPendingInviteRead, shouldClearPendingInvite, type PendingInvite } from './invite-link.logic';

const KEY = 'scribe.family.pendingInvite';

/** A signed-in read could not be marked (Keychain error): the next clear then drops the item, marked or not. */
let markWriteFailed = false;

export async function savePendingInvite(token: string, now = Date.now()): Promise<void> {
  if (!isInviteToken(token)) return;
  markWriteFailed = false; // a newer link replaces the item, so nothing is left to drop for the old reader
  await secureStorage.setItem(KEY, encodePendingInvite({ token, receivedAt: now }));
}

/**
 * `userId`: the signed-in account reading, or null. A signed-in read marks the item with that id in the same Keychain
 * item (CISO-2). A marked item goes only to its reader: another signed-in account, or a settled signed-out read
 * (the reader is gone: the app died before the clear, or the session ended while it was closed), removes it and
 * returns null. Signed out and unmarked: nothing is written, the token waits for sign-in. `settled` is false while the
 * session is still restoring: then signed out is not yet known, so nothing is written or removed, and a marked item
 * is not handed out.
 */
export async function readPendingInvite(now = Date.now(), userId: string | null = null, settled = true): Promise<PendingInvite | null> {
  let raw: string | null = null;
  try {
    raw = await secureStorage.getItem(KEY);
  } catch {
    return null; // Keychain locked (before first unlock): try again later
  }
  const p = decodePendingInvite(raw, now);
  if (raw && !p) await clearPendingInvite();
  if (!p) return null;
  if (p.readBy) {
    if (p.readBy === userId) return p;
    if (!userId && !settled) return null; // session still restoring: leave it
    await secureStorage.removeItem(KEY).catch(() => {}); // fail-open
    return null;
  }
  if (userId) {
    try {
      // Only if no newer link landed since the read; a failed write leaves the item as it was.
      if ((await secureStorage.getItem(KEY)) === raw) await secureStorage.setItem(KEY, encodePendingInvite({ ...p, readBy: userId }));
    } catch {
      // Keep the token for this account, but remember it is unmarked so the next clear drops it.
      markWriteFailed = true;
    }
  }
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

/**
 * Sign-out and user change (auth-store): drops the item only when a signed-in account had read it. A token
 * that arrived while signed out stays for the next sign-in. Fail-open: a Keychain error is swallowed.
 */
export async function clearReadPendingInvite(): Promise<void> {
  try {
    if (markWriteFailed || isPendingInviteRead(await secureStorage.getItem(KEY))) {
      await secureStorage.removeItem(KEY);
      markWriteFailed = false;
    }
  } catch {
    /* fail-open: the 14-day cap still applies */
  }
}
