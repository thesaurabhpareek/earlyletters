/**
 * Pure rules behind the account-first Welcome (S2) and the outage screen (S3), slice 2 of NX-31 revision 3.
 * No React Native, tested in Node (test/first-run-welcome.test.ts). Reads nothing, sends nothing, records nothing.
 */
import { authCopy } from '@scribe/content';
import type { AuthErrorKind, AuthState } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { visibleCoParentDoors } from '@/lib/family/entry.logic';
import type { FirstRunStep } from './gate.logic';

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
 * "I was invited" on the first-run Welcome. ONE rule decides it, the one the old Welcome and S1-178 already use:
 * `visibleCoParentDoors(...).joinButton` (family/entry.logic.ts, CTO ruling B12-5, 9 Nov 2026). It needs the server switch
 * AND an alpha build: shown in a servers-on alpha (TestFlight, preview), hidden in a servers-on store build, hidden with
 * servers off. The caller passes the raw switch (`capabilities.coParent`), never an answer this rule already gave: passing
 * `joinButton` back in as `coParent` applied the rule twice and made any flag behind it inert.
 *
 * There is no second flag here and no second `familySurfacesShown`: that name exists once, in entry.logic.ts, and means the
 * Family tab and the Settings row (D-126), which a servers-on store build shows. The join door is not that decision.
 */
export function invitedDoorShown(input: { alpha: boolean; coParent: boolean }): boolean {
  return visibleCoParentDoors(input.coParent, input.alpha).joinButton;
}

/**
 * The words under the buttons on the Welcome. A brand-new install has no letters, so the one failure NX-36 S2 names that
 * stays on this screen ("That sign-in did not finish") uses the first-run variant without "Your letters are safe"; every
 * other kind keeps its existing words. A 429, "not available" and a lost connection never get here: the gate sends them to
 * the outage screen (gate.logic.ts OUTAGE_ERRORS), so this file holds no first-run words for them.
 */
export function welcomeErrorMessage(kind: AuthErrorKind | null): string | null {
  if (!kind || kind === 'cancelled') return null;
  if (kind === 'provider') return authCopy.firstRun.errors.provider;
  return authErrorMessage(kind);
}

/**
 * The words for an error on the email, code and consent screens (NX-36 S4, S5, S6). A phone that holds a book keeps
 * the existing lines ("Your letters are safe..."). A brand-new install has no letters, so it reads the first-run
 * variants without that sentence. Kinds with no variant keep their existing words either way.
 */
export function signInErrorMessage(kind: AuthErrorKind | null | undefined, phoneHoldsBook: boolean): string | null {
  if (!kind || kind === 'cancelled') return null;
  if (phoneHoldsBook) return authErrorMessage(kind);
  const e = authCopy.firstRun.errors;
  switch (kind) {
    case 'network': return e.network;
    case 'code_paused': return e.codePaused;
    case 'consent_unavailable': return e.consentUnavailable;
    case 'unknown': return e.unknown;
    default: return welcomeErrorMessage(kind);
  }
}

export type FirstRunScreen = 'blank' | 'welcome' | 'outage' | 'steps';

/**
 * Which screen the first-run route draws. The gate answers where a person with no session starts (`signIn`, `outage`);
 * this keeps a person who is already INSIDE first run where they are. Once past the welcome step of the steps (a name or a
 * date may be typed), a lost session, a failed attempt or a dropped connection must not swap the steps for the Welcome or
 * the outage screen, which would throw away what they typed (route.logic.ts: "must keep Continue when the auth state moves
 * under them"). The book stays on the phone either way; signing in again is in Settings. And neither screen shows while the
 * session is still being read: a returning person who is offline at launch is not told sign-in needs a connection.
 */
export function firstRunScreen(input: { step: FirstRunStep; outage: 'offline' | 'outage' | null; restoring: boolean; pastWelcome: boolean }): FirstRunScreen {
  if (input.pastWelcome) return 'steps';
  const outage = input.step === 'outage' && input.outage !== null;
  if (input.step !== 'signIn' && !outage) return 'steps';
  // While the session is still being read (a signed-in person offline at launch) neither screen is right yet: show nothing.
  if (input.restoring) return 'blank';
  return outage ? 'outage' : 'welcome';
}
