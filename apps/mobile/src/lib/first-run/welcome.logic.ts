/**
 * Pure rules behind the account-first Welcome (S2) and the outage screen (S3), slice 2 of NX-31 revision 3.
 * No React Native, tested in Node (test/first-run-welcome.test.ts). Reads nothing, sends nothing, records nothing.
 */
import { authCopy } from '@scribe/content';
import type { AuthErrorKind, AuthState } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';

/** The connection facts expo-network gives (`NetworkState`), as far as this app reads them. */
export interface ConnectionFacts {
  isConnected?: boolean;
  isInternetReachable?: boolean;
}

/**
 * Unknown counts as online (A-NFR-001: nothing waits on the network at launch). Only a clear "no connection" or "the
 * internet is not reachable" is offline. The OS reports these from local state; this asks the network for nothing.
 */
export function isOnline(facts: ConnectionFacts | null | undefined): boolean {
  if (!facts) return true;
  return facts.isConnected !== false && facts.isInternetReachable !== false;
}

/**
 * Errors that stay inline on the Welcome (NX-36 S2): they say what went wrong under the buttons and change nothing else.
 * A cancel has no words (A-REQ-031: it shows nothing). The rest (network, rate limits, unavailable, unknown) send the
 * person to the outage screen through the gate (gate.logic.ts OUTAGE_ERRORS).
 */
const INLINE: ReadonlySet<AuthErrorKind> = new Set<AuthErrorKind>(['wrong_code', 'invalid_email', 'provider', 'expired', 'under_18', 'session_expired', 'consent_unavailable']);

/** The error to show under the buttons, or null. Derived from the auth state, so a new attempt clears it. */
export function inlineErrorKind(state: AuthState): AuthErrorKind | null {
  if (state.status !== 'signedOut' || !state.error) return null;
  return INLINE.has(state.error) ? state.error : null;
}

/**
 * "Try again", and a connection that returns, both put the person back on the Welcome: the failure that sent them to
 * the outage screen is set aside (by the identity of the failed state, so a NEW failure is a new failure).
 */
export function failureStillCounts(state: AuthState, setAside: AuthState | null): boolean {
  return state !== setAside;
}

/**
 * Hide "I was invited" on the first-run Welcome in a servers-on STORE build. Mirrors `familySurfacesShown` and
 * `CO_PARENT_IN_STORE_BUILD` of #720 (BL-776), which is not merged: when it is, this file's constant and function are
 * replaced by that import. Alpha builds (TestFlight, preview) keep the door. With server features off the door was
 * already hidden (`visibleCoParentDoors`), so a servers-off build is unchanged.
 */
export const INVITED_DOOR_IN_STORE_BUILD = false;

export function invitedDoorShown(input: { alpha: boolean; coParent: boolean }): boolean {
  return input.coParent && (input.alpha || INVITED_DOOR_IN_STORE_BUILD);
}

/**
 * The words under the buttons on the Welcome. A brand-new install has no letters, so the three failures NX-36 S2 names
 * use the first-run variants without "Your letters are safe"; every other kind keeps its existing words.
 */
export function welcomeErrorMessage(kind: AuthErrorKind | null): string | null {
  if (!kind || kind === 'cancelled') return null;
  const e = authCopy.firstRun.errors;
  if (kind === 'provider') return e.provider;
  if (kind === 'rate_limited' || kind === 'email_wait') return e.rateLimited;
  if (kind === 'not_available') return e.notAvailable;
  return authErrorMessage(kind);
}
