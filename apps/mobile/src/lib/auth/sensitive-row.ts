/**
 * What Settings > Privacy's "Sync and family sharing" row says (BL-485 option (b), the founder's call of 30 Oct 2026:
 * "Show On or Off now; withdrawal before any friend"). The session provider registers this one source; the row reads
 * it. It reads the auth state and subscribes to it, and nothing more:
 *
 *   - NO `open`. There is still no control that withdraws the consent (BL-485 option (a): the sheet, `withdraw` in
 *     `recordConsent`, `withdraw_sensitive_data`; counsel's OQ-L1). So the row is not pressable, shows no chevron and
 *     records nothing. Do not add one here without that work.
 *   - Pure: no React Native, so test/privacy-sensitive-row.test.ts runs it in Node against the real state machine.
 *
 * Which status each auth state shows (the unread-answer cases match Settings > Account's Sync row, components/auth/
 * account-view.logic.ts; Account says "Not set up yet" for `needsConsent` and for an unanswered claim screen, where
 * this row says the consent itself):
 *   - no session (restoring, signed out, signing in, waiting for a code): `signed_out`, "Not signed in";
 *   - consent screens still to answer (`needsConsent`): `off`, nothing syncs and the letters stay on this phone;
 *   - signed in and the gate read: `on` only when `my_sync_gate()` allows content (`sync: 'on'`), else `off`
 *     (sensitive-data declined or withdrawn);
 *   - signed in and the gate NOT read (`checkingConsent`, or `sync: 'unknown'`: offline at launch, a failed read,
 *     the 10 second timeout): `unknown`, "Waiting for a connection" (authCopy.account.sync.unknown, an existing
 *     string). It never shows On (that would claim a consent nobody read) and never Off (that reads as a withdrawal).
 *   - a sign-out in progress keeps the sync state the person had.
 *
 * The status follows the consent, not the "Keep in this account" claim screen: until that tap nothing uploads
 * (auth-store `syncAllowed()`), while Account shows "Not set up yet". Nothing here holds an email, a token or a name.
 */
import { setSensitiveDataSource, type SensitiveDataStatus } from '../analytics/privacy-sources';
import { getAuthSnapshot, subscribeAuth } from './auth-store';
import type { AuthState } from './machine.logic';

export function sensitiveRowStatus(s: AuthState): SensitiveDataStatus {
  switch (s.status) {
    case 'restoring':
    case 'signedOut':
    case 'signingIn':
    case 'awaitingCode':
      return 'signed_out';
    case 'checkingConsent':
      return 'unknown';
    case 'needsConsent':
      return 'off';
    case 'ready':
    case 'signingOut':
      // SyncMode is 'on' | 'off' | 'unknown', all three statuses of the row; a fourth mode fails the typecheck here.
      return s.sync;
  }
}

/** Once, from the session provider. Idempotent: it replaces the source, and the row reads the live auth snapshot. */
export function registerSensitiveDataRow(): void {
  setSensitiveDataSource({
    read: () => sensitiveRowStatus(getAuthSnapshot()),
    subscribe: subscribeAuth,
  });
}
