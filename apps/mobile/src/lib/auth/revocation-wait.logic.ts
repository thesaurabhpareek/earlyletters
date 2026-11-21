/**
 * BL-1461: the line shown while the Apple revocation wait runs (A-REQ-033). The wait has no time cap (BL-1462), so a
 * quick wait shows nothing and a long one says why the app has not moved on. Pure rules and the delay; the hook is in
 * use-revocation-wait-line.ts.
 */
import type { AuthState } from './machine.logic';

/** A wait shorter than this shows no line. */
export const REVOCATION_WAIT_LINE_DELAY_MS = 3000;

/**
 * True only for the wait after Apple revoked the sign-in, and only while letters are really waiting to be sent
 * (`waitingForUploads`): with sync off nothing is sent and the sign-out ends at once, so "sent first" would be untrue.
 * Never for a sign-out the person asked for.
 */
export function isRevocationWait(s: AuthState): boolean {
  return s.status === 'signingOut' && s.reason === 'apple_revoked' && s.waitingForUploads;
}
