/**
 * The consumer for `forceReauthEpoch` (remote config; LEGAL-REQ-040; F02-REQ-023; BL-597).
 *
 * The founder raises the number in the signed remote config. Each phone that is signed in
 * ends its session once for that number, after its queued letters are up (the same wait an
 * ordinary sign-out has, A-REQ-033). The letters on the phone stay: nothing here deletes
 * a row, a recording or a setting other than the one note below.
 *
 * The one note: `REAUTH_EPOCH_KEY`, the last number this phone has acted on. It is written
 * only while the phone is signed out, or at the moment a person finishes signing in by hand
 * (never while a session is being restored, or an old session would be skipped), so a person who
 * signs in after the bump is not asked again, and a fresh install on epoch 5 does not sign its
 * first session out, even when the person signs in before the config has been read.
 *
 * Pure TypeScript, no React Native import.
 */

/** Settings key for the last epoch acted on (a whole number, kept in the local settings table, not in analytics or logs). */
export const REAUTH_EPOCH_KEY = 'auth.reauth_epoch_seen';

/**
 * What the phone is doing, reduced to the cases that matter here. `justSignedIn` is the step right after
 * a person signed in by hand (from signingIn or awaitingCode), never after a session was restored.
 */
export type ReauthPhase = 'signedIn' | 'signedOut' | 'justSignedIn' | 'other';

export type ReauthDecision = 'sign_out' | 'record' | 'none';

export interface ReauthInput {
  remoteEpoch: number;
  /** The stored number, or null when this phone never stored one (treated as 0). */
  seenEpoch: number | null;
  phase: ReauthPhase;
}

/** Reads the stored note: anything that is not a whole number of 0 or more counts as 0. */
export function parseSeenEpoch(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function decideReauth({ remoteEpoch, seenEpoch, phase }: ReauthInput): ReauthDecision {
  const seen = seenEpoch ?? 0;
  if (!Number.isInteger(remoteEpoch) || remoteEpoch <= seen) return 'none'; // a lowered number never signs anyone out
  if (phase === 'signedIn') return 'sign_out';
  if (phase === 'signedOut' || phase === 'justSignedIn') return 'record';
  return 'none';
}

/** What the provider does for one look at the epoch: the number to write (or null) and whether to ask for a sign-out. */
export interface ReauthStep {
  record: number | null;
  signOut: boolean;
}

/**
 * The provider effect, without React. The number is written only for a 'record' decision, never at the
 * moment a sign-out is asked for: if it were, a phone whose sign-out never finished (app closed while
 * letters are still queued) would skip the sign-out on the next launch.
 */
export function reauthStep(input: { remoteEpoch: number; storedRaw: string | null | undefined; phase: ReauthPhase }): ReauthStep {
  const decision = decideReauth({ remoteEpoch: input.remoteEpoch, seenEpoch: parseSeenEpoch(input.storedRaw), phase: input.phase });
  return { record: decision === 'record' ? input.remoteEpoch : null, signOut: decision === 'sign_out' };
}

/** Maps the auth state to a phase. `previousStatus` is the status on the look before this one. */
export function reauthPhaseOf(status: string, signedIn: boolean, previousStatus: string | null): ReauthPhase {
  if (signedIn) return previousStatus === 'signingIn' || previousStatus === 'awaitingCode' ? 'justSignedIn' : 'signedIn';
  return status === 'signedOut' ? 'signedOut' : 'other';
}
