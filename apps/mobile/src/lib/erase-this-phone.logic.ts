/**
 * Erase everything on a signed-in phone: "Erase this phone only" (F17 6.2 F step 2; F17-REQ-026, F17-U38; BL-559 part 3).
 * The other choice on that screen, "Delete your account", is the existing account-deletion flow (6.2 E,
 * lib/account-deletion, `request_account_deletion`); this module is the phone-only choice. Pure: every step is passed
 * in, so the order is tested with the real store and a real sync server (test/erase-this-phone.test.ts).
 *
 * Order, and why:
 *  1. Not signed in: nothing here; the signed-out Erase everything (DATA-REQ-024) is the flow.
 *  2. Anything that only this phone holds and that the drain will not send (a book the server refused, a draft never
 *     held, a conflict copy; store.ts eraseThisPhoneBlockers): stop before signing out, nothing changed. The screen
 *     says "your letters are still in your account", so a wipe must never lose a letter the account does not have.
 *  3. Sign out through the F02 sign-out guard (session-provider `signOut`): it waits for the outbox to drain, so every
 *     queued op reaches the server first ("Sending your last letters first." while it waits), then removes the session.
 *     "Stay signed in" during the wait ends it here with nothing changed.
 *  4. Only once the session is gone, the local wipe (lib/erase-everything.ts eraseThisPhone), which checks again that
 *     nothing is queued or unacknowledged and otherwise begins nothing. Karma's call: sign-out before the wipe, not
 *     after as 6.2 F step 2 lists it, because a session left on a wiped phone (a kill between the two) would claim the
 *     empty phone and pull the letters back at the next launch with no word to the person. The server is never asked
 *     to change anything; the free-letter count heals from the account's letters at the next sign-in (F14-REQ-023).
 */
import type { AuthState } from './auth/machine.logic';

export type EraseThisPhoneResult =
  /** The phone is empty and signed out; the server holds the account as it was. */
  | 'erased'
  /** No session: the signed-out Erase everything is the flow. Nothing changed. */
  | 'not_signed_in'
  /** Something only this phone holds would be lost. Nothing changed, still signed in. */
  | 'only_here'
  /** The person chose Stay signed in while the outbox drained. Nothing erased, still signed in. */
  | 'stayed'
  /** Signed out, but something was still queued or unacknowledged, so nothing was erased (the letters stay here). */
  | 'not_drained'
  /** The wipe began and a file would not go: the mark stays and the next try or launch finishes it. */
  | 'incomplete';

export interface EraseThisPhoneDeps {
  signedIn(): boolean;
  /** store.ts eraseThisPhoneBlockers: 0 when the drain leaves nothing that only this phone has. */
  blockers(): number;
  /** The F02 sign-out guard: 'waiting' while queued letters upload, 'done' when nothing waits. */
  signOut(): Promise<'done' | 'waiting'>;
  /** Called once when the guard waits, so the screen can say that the last letters are being sent. */
  onWaiting?(): void;
  /**
   * Resolves when the session is gone ('signed_out') or the wait was cancelled ('stayed'). Called before `signOut`, so
   * an answer that comes at once is not missed (authOutcome below, over lib/auth/auth-store.ts).
   */
  whenSignedOut(): Promise<'signed_out' | 'stayed'>;
  /** lib/erase-everything.ts eraseThisPhone. */
  erase(): Promise<'erased' | 'incomplete' | 'not_drained'>;
}

export async function eraseThisPhoneOnly(d: EraseThisPhoneDeps): Promise<EraseThisPhoneResult> {
  if (!d.signedIn()) return 'not_signed_in';
  if (d.blockers() > 0) return 'only_here';
  const ended = d.whenSignedOut();
  if ((await d.signOut()) === 'waiting') d.onWaiting?.();
  if ((await ended) === 'stayed') return 'stayed';
  return d.erase();
}

/**
 * `whenSignedOut` over the auth store: 'signed_out' at the first signed-out state, 'stayed' when a sign-out that had
 * begun goes back to signed in. A state that has not yet left signed in (before the request lands) decides nothing.
 */
export function authOutcome(
  subscribe: (listener: (s: AuthState) => void) => () => void,
  snapshot: () => AuthState,
): Promise<'signed_out' | 'stayed'> {
  return new Promise((resolve) => {
    let began = false;
    let off: (() => void) | null = null;
    let done = false;
    const read = (s: AuthState): void => {
      if (done) return;
      let r: 'signed_out' | 'stayed' | null = null;
      if (s.status === 'signedOut') r = 'signed_out';
      else if (s.status === 'signingOut') began = true;
      else if (began && s.status === 'ready') r = 'stayed';
      if (r === null) return;
      done = true;
      off?.();
      resolve(r);
    };
    off = subscribe(read);
    if (done) off();
    else read(snapshot());
  });
}
