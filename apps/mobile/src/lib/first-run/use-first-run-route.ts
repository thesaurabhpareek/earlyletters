/**
 * Where first run starts, for a build with server features on (NX-31 R17, R18, R19; NX-36 S2, S3). Reads the auth
 * state, the connection and the local book, and asks `firstRunGate`. With the switch off the answer is `unchanged`, and
 * the route renders exactly what Build 11 did: nothing here lists the books, listens to the store, reads or watches the
 * network, or starts a timer (route.logic.ts; tested as behaviour in test/use-first-run-route.test.ts). Records and sends
 * nothing.
 *
 * NX-36-S17: a ready, sync-on session with no book asks its account first (use-new-phone.ts) and is held on "Opening your
 * book" until the account has said it has no book, so the child step is never shown while the book may be on its way.
 */
import { authCopy } from '@scribe/content';
import { useCallback, useEffect, useRef, useState } from 'react';
import { announce } from '@/lib/a11y';
import { isSignedIn, type AuthState } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { subscribe, listChildren } from '@/lib/store';
import { RESTORE_WAIT_MS, firstRunGate, gateInputsFromAuth, restoreBlocksScreen, type FirstRunGateResult, type FirstRunStep } from './gate.logic';
import { useNewPhone } from './use-new-phone';
import { useOnline } from './use-online';
import { failureStillCounts, firstRunScreen, type FirstRunScreen } from './welcome.logic';

export interface FirstRunRoute extends FirstRunGateResult {
  /** What to draw. The gate's `step` says where a person with no session starts; this also keeps one who is past the welcome. */
  screen: FirstRunScreen;
  localStartChosen: boolean;
  online: boolean;
  /** The session is still being read from the Keychain: show nothing yet rather than flash the Welcome. */
  restoring: boolean;
  chooseLocalStart: () => void;
  /** Read the connection again, and put the person back on the Welcome if it is there. Ignored while a read is under way. */
  tryAgain: () => void;
  /** The steps report that the person is past their welcome step: nothing typed there is ever swapped out for a sign-in screen. */
  markPastWelcome: () => void;
  /**
   * "Use another account" signed the person out: first run goes back to its start. The route now does this itself when the
   * session ends (a signed-in to signedOut change of the auth status), which also covers a sign-out that waited for queued
   * uploads; this call is kept as belt and braces for the immediate case. The latch is cleared, so with no session the route
   * answers the Welcome, never the child step with Continue live (D-160). A person who chose the local start keeps the steps.
   * Nothing with the switch off.
   */
  restartFromWelcome: () => void;
  /** NX-36-S17: Try again on the slow and offline screens (asks the account again and nudges the pull). */
  retryOpening: () => void;
  /** NX-36-S17: "Start a book" on No book here yet (the person chose to begin one: the child step). */
  startBook: () => void;
}

export function useFirstRunRoute(): FirstRunRoute {
  const auth = useAuth();
  // The one switch, and a build with no sign-in settings has no sign-in to wait for: either way the gate stands aside
  // (the app is fully local) and this hook reads and listens to nothing.
  const active = serverFeaturesEnabled() && auth.configured;
  const { online, recheck } = useOnline(active);
  const [localStartChosen, setLocalStartChosen] = useState(false);
  const [setAside, setSetAside] = useState<AuthState | null>(null);
  const [pastWelcome, setPastWelcome] = useState(false);
  const [, tick] = useState(0);
  // The Keychain read has no timeout of its own: after RESTORE_WAIT_MS the screen stops waiting and shows the Welcome.
  const [restoreWaitedOut, setRestoreWaitedOut] = useState(false);
  useEffect(() => {
    if (!active || auth.state.status !== 'restoring') return;
    const t = setTimeout(() => setRestoreWaitedOut(true), RESTORE_WAIT_MS);
    return () => clearTimeout(t);
  }, [active, auth.state.status]);
  const stateRef = useRef(auth.state);
  stateRef.current = auth.state;
  const wasOnline = useRef(online);
  /** The step of the render before this one: "You are back online." is said only to someone who was on the outage screen. */
  const lastStep = useRef<FirstRunStep>('unchanged');
  const reading = useRef(false);

  // The list of books changes under this route (sign-in brings one back). Not listened to with the switch off.
  useEffect(() => {
    if (!active) return;
    return subscribe(() => tick((n) => n + 1));
  }, [active]);

  // retryOnReconnect (R18, R19): the connection returns, the failure is set aside, and the Welcome is back. Said once, and
  // only here: a tap on Try again that finds the connection unchanged is not a reconnect and says nothing of the kind.
  useEffect(() => {
    if (online && !wasOnline.current) {
      setSetAside(stateRef.current);
      if (lastStep.current === 'outage') announce(authCopy.outage.backOnline);
    }
    wasOnline.current = online;
  }, [online]);

  const tryAgain = useCallback(() => {
    if (reading.current) return;
    reading.current = true;
    const wasOffline = !wasOnline.current;
    void recheck().then((nowOnline) => {
      reading.current = false;
      if (nowOnline) setSetAside(stateRef.current);
      // Still offline and the screen does not change: say so, so nobody taps into silence.
      else if (wasOffline) announce(authCopy.offline.title);
    });
  }, [recheck]);
  const chooseLocalStart = useCallback(() => setLocalStartChosen(true), []);
  // With the switch off there is nothing to hold in place, and the steps are not asked to render again.
  const markPastWelcome = useCallback(() => {
    if (active) setPastWelcome(true);
  }, [active]);

  // The session really ended (signed in, then signedOut): first run goes back to its start whatever ended it: "Use another
  // account" (also after a wait for queued uploads, which resolves later than the tap), a revoked or expired session, a
  // forced sign-in. Otherwise the steps would stay up with no account and Continue would make a local-only book in a build
  // with server features on (D-160). Not on restoring or a cold start (there was no session to lose), not while a wait for
  // uploads is cancelled (that goes back to ready), and not for a person who chose the local start (the gate keeps the steps).
  const wasSignedIn = useRef(isSignedIn(auth.state));
  const status = auth.state.status;
  useEffect(() => {
    const signedIn = isSignedIn(stateRef.current);
    if (active && wasSignedIn.current && status === 'signedOut') setPastWelcome(false);
    wasSignedIn.current = signedIn;
  }, [active, status]);

  const restartFromWelcome = useCallback(() => {
    if (active) setPastWelcome(false);
  }, [active]);

  const hasLocalBook = active && listChildren().length > 0;
  // A ready session with sync on and no book asks its account first (NX-36-S17). A session that has not agreed to sync
  // cannot be sent a book, so it keeps the earlier route (`new`); so does every build with the switch off.
  const asks = active && auth.state.status === 'ready' && auth.state.sync === 'on';
  const np = useNewPhone({ enabled: asks, client: auth.client, hasLocalBook, online });
  const inputs = gateInputsFromAuth({
    serverFeatures: active,
    authState: auth.state,
    hasLocalBook,
    localStartChosen,
    online,
    newPhone: np.view ?? 'new',
  });
  const result = firstRunGate({ ...inputs, signInFailed: inputs.signInFailed && failureStillCounts(auth.state, setAside) });
  const restoring = restoreBlocksScreen(auth.state.status, restoreWaitedOut ? RESTORE_WAIT_MS : 0);
  // After the reconnect effect above (effects run in order), so that effect still sees the previous render's step.
  useEffect(() => {
    lastStep.current = result.step;
  });
  return {
    ...result,
    screen: firstRunScreen({ step: result.step, outage: result.outage, restoring, pastWelcome }),
    localStartChosen,
    online,
    restoring,
    chooseLocalStart,
    tryAgain,
    markPastWelcome,
    restartFromWelcome,
    retryOpening: np.retry,
    startBook: np.startBook,
  };
}
