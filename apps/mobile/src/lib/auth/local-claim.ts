/**
 * The claim step for the two device-only files, the days file and the moments file (NS-47-R7, E73; CPO-30, CPrivO-17,
 * CDO-24). Files made before any sign-in are owned by 'local'. The owner key of a signed-in person is the first 16 hex
 * of SHA-256 of the user id (never the id itself). A released sign-in sets both stores' owner, which deletes a 'local'
 * file nobody adopted; "Keep in this account" adopts it first, so only an explicit confirm moves it to the account.
 * Sign-out puts both owners back to 'local' (the sign-out clear keeps a 'local' file: "Not my account" leaves the phone
 * as it was). Nothing here logs, counts or reports a key, an id or that anything was adopted.
 */
import { daysStore, setDaysOwner } from '../days';
import { momentsStore } from '../moments';
import { sha256Hex } from '../sha256';
import { currentAuthUserId, onSignedIn, subscribeAuth } from './auth-store';
import { authUserId } from './machine.logic';

export const LOCAL_FILE_OWNER = 'local';

/** First 16 hex chars of SHA-256 of the user id: the `owner` a device-only file carries. */
export function ownerKey(userId: string): string {
  return sha256Hex(userId).slice(0, 16);
}

function setOwners(key: string): void {
  for (const set of [() => setDaysOwner(key), () => momentsStore.setOwner(key)]) {
    try {
      set();
    } catch {
      // a store that cannot be reached is retried at the next sign-in, sign-out, launch or Erase
    }
  }
}

/** Mounted with the session provider. Returns the unbind. */
export function bindDeviceOnlyOwners(): () => void {
  const user = currentAuthUserId();
  if (user) setOwners(ownerKey(user)); // a session already released before this was mounted
  const offIn = onSignedIn((id) => setOwners(ownerKey(id)));
  const offAuth = subscribeAuth((s) => {
    if (!authUserId(s)) setOwners(LOCAL_FILE_OWNER); // sign-out, or launch with no session: a no-op when already local
  });
  return () => {
    offIn();
    offAuth();
  };
}

/**
 * "Keep in this account": both local files become the account's. Resolves true when neither store failed, and false
 * when either did (a write that would not land, a store that threw): the claim is then NOT confirmed and nothing is
 * deleted, so the person stays on the claim prompt and can try again. Never rejects.
 */
export async function adoptDeviceOnlyLocal(userId: string): Promise<boolean> {
  const key = ownerKey(userId);
  const done = await Promise.allSettled([daysStore.adoptLocal(key), momentsStore.adoptLocal(key)]);
  return done.every((d) => d.status === 'fulfilled' && d.value !== 'failed');
}
