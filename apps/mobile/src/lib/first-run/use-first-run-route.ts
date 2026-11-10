/**
 * Where first run starts, for a build with server features on (NX-31 R17, R18, R19; NX-36 S2, S3). Reads the auth
 * state, the connection and the local book, and asks `firstRunGate`. With the switch off the answer is `unchanged`, and
 * the route renders exactly what Build 11 did. Records and sends nothing.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthState } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { subscribe, listChildren } from '@/lib/store';
import { RESTORE_WAIT_MS, firstRunGate, gateInputsFromAuth, restoreBlocksScreen, type FirstRunGateResult } from './gate.logic';
import { useNewPhone } from './use-new-phone';
import { useOnline } from './use-online';
import { failureStillCounts } from './welcome.logic';

export interface FirstRunRoute extends FirstRunGateResult {
  localStartChosen: boolean;
  online: boolean;
  /** The session is still being read from the Keychain: show nothing yet rather than flash the Welcome. */
  restoring: boolean;
  chooseLocalStart: () => void;
  /** Set the failure aside and read the connection again. */
  tryAgain: () => void;
  /** NX-36-S17: Try again on the slow screen, and "Start a book" on No book here yet. */
  retryOpening: () => void;
  startBook: () => void;
}

export function useFirstRunRoute(): FirstRunRoute {
  const auth = useAuth();
  const { online, recheck } = useOnline(serverFeaturesEnabled() && auth.configured);
  const [localStartChosen, setLocalStartChosen] = useState(false);
  const [setAside, setSetAside] = useState<AuthState | null>(null);
  const [, tick] = useState(0);
  // The Keychain read has no timeout of its own: after RESTORE_WAIT_MS the screen stops waiting and shows the Welcome.
  const [restoreWaitedOut, setRestoreWaitedOut] = useState(false);
  useEffect(() => {
    if (auth.state.status !== 'restoring') return;
    const t = setTimeout(() => setRestoreWaitedOut(true), RESTORE_WAIT_MS);
    return () => clearTimeout(t);
  }, [auth.state.status]);
  const stateRef = useRef(auth.state);
  stateRef.current = auth.state;
  const wasOnline = useRef(online);

  // The list of books changes under this route (sign-in brings one back).
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);

  // retryOnReconnect (R18, R19): the connection returns, the failure is set aside, and the Welcome is back.
  useEffect(() => {
    if (online && !wasOnline.current) setSetAside(stateRef.current);
    wasOnline.current = online;
  }, [online]);

  const tryAgain = useCallback(() => {
    setSetAside(stateRef.current);
    recheck();
  }, [recheck]);
  const chooseLocalStart = useCallback(() => setLocalStartChosen(true), []);

  // A build with no sign-in settings has no sign-in to wait for: the gate stands aside (the app is fully local).
  const hasLocalBook = listChildren().length > 0;
  // A ready session with sync on and no book asks its account first (NX-36-S17). A session that has not agreed to sync
  // cannot be sent a book, so it keeps the earlier route (`new`).
  const asks = serverFeaturesEnabled() && auth.configured && auth.state.status === 'ready' && auth.state.sync === 'on';
  const np = useNewPhone({ enabled: asks, client: auth.client, hasLocalBook, online });
  const inputs = gateInputsFromAuth({
    serverFeatures: serverFeaturesEnabled() && auth.configured,
    authState: auth.state,
    hasLocalBook,
    localStartChosen,
    online,
    newPhone: np.view ?? 'new',
  });
  const result = firstRunGate({ ...inputs, signInFailed: inputs.signInFailed && failureStillCounts(auth.state, setAside) });
  return { ...result, localStartChosen, online, restoring: restoreBlocksScreen(auth.state.status, restoreWaitedOut ? RESTORE_WAIT_MS : 0), chooseLocalStart, tryAgain, retryOpening: np.retry, startBook: np.startBook };
}
