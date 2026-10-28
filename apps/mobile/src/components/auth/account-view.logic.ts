/**
 * What Settings > Account shows for an account state (EXPERIENCE_PASS S56, package P8a). Pure: no React Native, so
 * test/account-view.test.ts runs it in Node against the real state machine. Presentational only: the states and their
 * transitions are S01's (lib/auth/machine.logic.ts), the outbox drain is S03's; this decides which row says what.
 *
 * - `sync`: the value beside "Sync and sharing". `waiting` ("Not set up yet") while consent is missing or the claim
 *   screen (BL-347) was never answered; while a sign-out waits for queued letters, sync is still running, so `on`.
 * - `finishSetup`: the "Finish setting up" row, back to account setup.
 * - `offerSync`: the "Agree and sync" row for a person who chose "Keep on this phone". It opens the sensitive-data
 *   step with its words (LEGAL-REQ-006), never records consent in one tap.
 * - `signOut`: `waiting` while the outbox drains (the row says so with a spinner, F16, A-REQ-033), `closing` while
 *   the sign-out finishes (the row waits), else `ready`.
 */
import type { AuthState } from '@/lib/auth/machine.logic';

export type AccountSyncValue = 'on' | 'off' | 'unknown' | 'waiting';

export interface AccountView {
  sync: AccountSyncValue;
  finishSetup: boolean;
  offerSync: boolean;
  signOut: 'ready' | 'waiting' | 'closing';
}

export function accountView(s: AuthState, claimPending: boolean): AccountView {
  const claiming = s.status === 'ready' && s.sync === 'on' && claimPending;
  const missing = s.status === 'needsConsent' || claiming;
  const sync: AccountSyncValue = missing
    ? 'waiting'
    : s.status === 'ready'
      ? s.sync
      : s.status === 'signingOut' && s.waitingForUploads
        ? 'on'
        : 'unknown';
  return {
    sync,
    finishSetup: missing,
    offerSync: s.status === 'ready' && s.sync === 'off',
    signOut: s.status === 'signingOut' ? (s.waitingForUploads ? 'waiting' : 'closing') : 'ready',
  };
}
