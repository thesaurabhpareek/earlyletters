/**
 * What Settings > Account shows for an account state (EXPERIENCE_PASS S56, package P8a). Pure: no React Native, so
 * test/account-view.test.ts runs it in Node against the real state machine. Presentational only: the states and their
 * transitions are S01's (lib/auth/machine.logic.ts), the outbox drain is S03's; this decides which row says what.
 *
 * - `sync`: the value beside "Sync and sharing". `waiting` ("Not set up yet") while consent is missing or the claim
 *   screen (BL-347) was never answered; during a sign-out, the sign-out's own sync state (BL-451: a wait can start with
 *   sync not yet known, and a gate answer can turn it off), never a hard "on".
 * - `finishSetup`: the "Finish setting up" row, back to account setup.
 * - `offerSync`: the "Agree and sync" row for a person who chose "Keep on this phone". It opens the sensitive-data
 *   step with its words (LEGAL-REQ-006), never records consent in one tap.
 * - `signOut`: `waiting` while the outbox drains (the row says so with a spinner, F16, A-REQ-033), `closing` while
 *   the sign-out finishes (the row waits), else `ready`.
 * - `staySignedIn`: the "Stay signed in" button (BL-451), only while a sign-out the person asked for waits
 *   (`reason === 'user'`; an Apple revocation still signs out once the letters are up). Never while closing:
 *   `cancelSignOutWait()` gives no outcome and does nothing once the wait has ended.
 *
 * `waitEndedEarly(prev, next)`: a wait that ended before the queued letters were sent (a gate answer turned sync off,
 * or the session was lost), so the signed-out page can say they are kept on this phone (BL-451). A drained outbox is
 * the wait ending as it should, not early.
 *
 * `nextEndedEarly(prev, next, shown)`: the signed-out page's early-end line, one state change at a time (account.tsx
 * calls it on each change). It turns on when the wait ends early, stays through the end of the sign-out and while
 * signed out, goes once the person is signed in again, and is announced once, when it first shows signed out.
 */
import { isSignedIn, type AuthState } from '@/lib/auth/machine.logic';

export type AccountSyncValue = 'on' | 'off' | 'unknown' | 'waiting';

export interface AccountView {
  sync: AccountSyncValue;
  finishSetup: boolean;
  offerSync: boolean;
  signOut: 'ready' | 'waiting' | 'closing';
  staySignedIn: boolean;
}

export function accountView(s: AuthState, claimPending: boolean): AccountView {
  const claiming = s.status === 'ready' && s.sync === 'on' && claimPending;
  const missing = s.status === 'needsConsent' || claiming;
  const sync: AccountSyncValue = missing
    ? 'waiting'
    : s.status === 'ready'
      ? s.sync
      : s.status === 'signingOut'
        ? s.sync
        : 'unknown';
  return {
    sync,
    finishSetup: missing,
    offerSync: s.status === 'ready' && s.sync === 'off',
    signOut: s.status === 'signingOut' ? (s.waitingForUploads ? 'waiting' : 'closing') : 'ready',
    staySignedIn: s.status === 'signingOut' && s.waitingForUploads && s.reason === 'user',
  };
}

export function waitEndedEarly(prev: AuthState, next: AuthState): boolean {
  if (prev.status !== 'signingOut' || !prev.waitingForUploads) return false;
  if (next.status === 'signedOut') return true;
  return next.status === 'signingOut' && !next.waitingForUploads && next.sync !== 'on';
}

export function nextEndedEarly(prev: AuthState, next: AuthState, shown: boolean): { shown: boolean; announce: boolean } {
  const signedIn = isSignedIn(next);
  const now = signedIn && next.status !== 'signingOut' ? false : shown || waitEndedEarly(prev, next);
  // Already on the signed-out page before this change: said then, not again.
  const seen = shown && !isSignedIn(prev);
  return { shown: now, announce: now && !signedIn && !seen };
}
