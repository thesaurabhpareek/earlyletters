/**
 * The sign-in-first gate for the account-first Build 12 (NX-31 revision 3: R17, R18, R19, R22; NX-36 S2 and S3).
 * Pure, no React Native, tested in Node (test/first-run-gate.test.ts). The route asks; this decides. It reads nothing,
 * sends nothing and records nothing: no analytics event, no storage, no network.
 *
 * Only a build with server features on asks it at all (`serverFeatures` false returns `unchanged`, a no-op, so a build
 * with the switch off behaves exactly as Build 11 did: the same Welcome, the same local book, no gate).
 *
 * The order, first match wins:
 *  1. server features off                -> `unchanged`
 *  2. the phone holds a book             -> `openTonight` (R22: an ended session never locks a person out of reading,
 *     recording or export; sign-in is offered, not required). Only the under-18 stop beats it, and that stop is the
 *     root age gate's, which sits above every route and is not changed here.
 *  3. age not answered / answered No     -> `ageGate` / `stop` (NX-03; the root gate owns the screens)
 *  4. a session exists                   -> `childStep` (a signed-in parent is never sent back to sign-in, R4)
 *  5. the local start was chosen         -> `childStep`, only if it was allowed (age Yes + constant on)
 *  6. offline, or sign-in failed or timed out -> `outage` (variant `offline` or `outage`); the local start is offered
 *     only if the constant is on (R18, R19)
 *  7. otherwise                          -> `signIn` (screen 2, healthy)
 *
 * The local start is a COMPILED constant. There is no environment variable, no remote config and no stored setting
 * behind it (NX-31 6.2; D-066, D-068: a remote setting may not change what the app shows or collects). If a remote
 * switch is ever added, the CISO's condition is that it is disable-only: a remote value may turn the local start off,
 * never on, signed through ADR 0016.
 */
import type { AuthErrorKind, AuthState } from '@/lib/auth/machine.logic';

/**
 * "Start the book on this phone for now" (NX-31 R18). ON in the Build 12 store build: the founder chose option B on
 * 9 Nov 2026 as an outage-only fallback, and the Notes for Review name it (gate G6, guideline 2.5.19). To ship without
 * it, change this line and rebuild. A fallback that is on by default is the safer failure for a first public launch:
 * a person in an outage can still start their book.
 */
export const LOCAL_START_FALLBACK = true;

/** The screen-2 wait before the outage screen shows: the session gate's own timeout (session-provider.tsx GATE_TIMEOUT_MS). */
export const SIGN_IN_OUTAGE_MS = 10_000;

/**
 * How long the first screen may stay blank while the session is read from the Keychain. After this the Welcome shows
 * (a read that never settles must not leave the first screen empty; the session, if it comes, still replaces it).
 */
export const RESTORE_WAIT_MS = SIGN_IN_OUTAGE_MS;

export function restoreBlocksScreen(status: AuthState['status'], waitedMs: number): boolean {
  return status === 'restoring' && waitedMs < RESTORE_WAIT_MS;
}

export type AgeAnswer = 'yes' | 'no' | 'notAsked';

export interface FirstRunGateInput {
  /** `serverFeaturesEnabled()`: the one build switch. Off: the gate does nothing. */
  serverFeatures: boolean;
  /** The screen-1 answer. */
  ageAnswered: AgeAnswer;
  /** A session exists on this phone. */
  hasSession: boolean;
  /** The phone lists a book (any child). */
  hasLocalBook: boolean;
  /** The phone has a connection. Unknown counts as online (the app has no connectivity source yet). */
  online: boolean;
  /** Sign-in failed or timed out at 10 seconds. */
  signInFailed: boolean;
  /** The compiled constant. Tests pass it; the route passes LOCAL_START_FALLBACK. */
  localStartFallback?: boolean;
  /** The person tapped the local start. Honoured only if it was allowed. */
  localStartChosen?: boolean;
}

export type FirstRunStep = 'unchanged' | 'ageGate' | 'stop' | 'signIn' | 'outage' | 'childStep' | 'openTonight';

export interface FirstRunGateResult {
  step: FirstRunStep;
  /** Which words the outage screen uses (NX-36 S3); null on any other step. */
  outage: 'offline' | 'outage' | null;
  /** The quiet "Start the book on this phone for now" button shows (R18). */
  localStartOffered: boolean;
  /** The screen retries by itself with back-off, and again when the connection returns (R18, R19). */
  retryOnReconnect: boolean;
  /** A book may be started from here (child step, or an existing book). */
  mayBeginBook: boolean;
  /** A phone with a book and no session: offer sign-in, never block (R22, R26). */
  offerSignIn: boolean;
}

const NOTHING: FirstRunGateResult = { step: 'unchanged', outage: null, localStartOffered: false, retryOnReconnect: false, mayBeginBook: true, offerSignIn: false };

const result = (step: FirstRunStep, over: Partial<FirstRunGateResult> = {}): FirstRunGateResult => ({
  step, outage: null, localStartOffered: false, retryOnReconnect: false, mayBeginBook: false, offerSignIn: false, ...over,
});

/** The local start may show: answer Yes, a failure state, the constant on (R18). All three, never fewer. */
function localStartAllowed(ageAnswered: AgeAnswer, constant: boolean): boolean {
  return ageAnswered === 'yes' && constant;
}

export function firstRunGate(input: FirstRunGateInput): FirstRunGateResult {
  if (!input.serverFeatures) return NOTHING;
  const constant = input.localStartFallback ?? LOCAL_START_FALLBACK;

  if (input.hasLocalBook) {
    if (input.ageAnswered === 'no') return result('stop');
    return result('openTonight', { mayBeginBook: true, offerSignIn: !input.hasSession });
  }
  if (input.ageAnswered === 'notAsked') return result('ageGate');
  if (input.ageAnswered === 'no') return result('stop');
  if (input.hasSession) return result('childStep', { mayBeginBook: true });
  if (input.localStartChosen && localStartAllowed(input.ageAnswered, constant)) return result('childStep', { mayBeginBook: true });

  if (!input.online || input.signInFailed) {
    return result('outage', {
      outage: input.online ? 'outage' : 'offline',
      localStartOffered: localStartAllowed(input.ageAnswered, constant),
      retryOnReconnect: true,
    });
  }
  return result('signIn');
}

/** QA's four screen-2 states (docs/qa/BUILD12-CUT-DEVICE-AND-TRACE section 9), as inputs. A timeout is a failure. */
export type ScreenTwoState = 'healthy' | 'failed' | 'timedOut' | 'offline';

export function screenTwoInputs(state: ScreenTwoState): { online: boolean; signInFailed: boolean } {
  switch (state) {
    case 'healthy': return { online: true, signInFailed: false };
    case 'failed':
    case 'timedOut': return { online: true, signInFailed: true };
    case 'offline': return { online: false, signInFailed: false };
  }
}

/**
 * Errors that mean "sign-in cannot be reached" rather than "that sign-in did not finish": a 429 is an outage and not a
 * wrong code (QA section 9). A cancel, a wrong code or an invalid address stay inline errors on screen 2.
 */
const OUTAGE_ERRORS: ReadonlySet<AuthErrorKind> = new Set<AuthErrorKind>(['network', 'rate_limited', 'email_wait', 'not_available', 'unknown']);

export function gateInputsFromAuth(args: {
  serverFeatures: boolean;
  authState: AuthState;
  hasLocalBook: boolean;
  localStartChosen?: boolean;
  /** From the connectivity source (use-online.ts). Omitted means unknown, which counts as online. */
  online?: boolean;
}): FirstRunGateInput {
  const s = args.authState;
  const hasSession = s.status === 'checkingConsent' || s.status === 'needsConsent' || s.status === 'ready' || s.status === 'signingOut';
  return {
    serverFeatures: args.serverFeatures,
    // The root age gate renders no route until the answer is Yes, so a route that runs has the Yes.
    ageAnswered: 'yes',
    hasSession,
    hasLocalBook: args.hasLocalBook,
    // Unknown counts as online (A-NFR-001: no launch waits on the network). The route passes expo-network's view.
    online: args.online ?? true,
    signInFailed: s.status === 'signedOut' && s.error !== undefined && OUTAGE_ERRORS.has(s.error),
    localStartFallback: LOCAL_START_FALLBACK,
    localStartChosen: args.localStartChosen,
  };
}

/**
 * May "Begin the book" show on the Welcome? Slice 1 has no sign-in-first screens, so the existing Welcome stands in:
 * with no session and no book it hides "Begin the book" (R17) except where the local start is offered, where that same
 * button is the local start. With server features off it is always true.
 */
export function beginTheBookAllowed(input: FirstRunGateInput): boolean {
  const r = firstRunGate(input);
  return r.step === 'unchanged' || r.mayBeginBook || (r.step === 'outage' && r.localStartOffered);
}
