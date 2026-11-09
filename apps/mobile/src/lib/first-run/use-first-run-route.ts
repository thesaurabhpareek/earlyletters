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
import { firstRunGate, gateInputsFromAuth, type FirstRunGateResult } from './gate.logic';
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
}

export function useFirstRunRoute(): FirstRunRoute {
  const auth = useAuth();
  const { online, recheck } = useOnline();
  const [localStartChosen, setLocalStartChosen] = useState(false);
  const [setAside, setSetAside] = useState<AuthState | null>(null);
  const [, tick] = useState(0);
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
  const inputs = gateInputsFromAuth({
    serverFeatures: serverFeaturesEnabled() && auth.configured,
    authState: auth.state,
    hasLocalBook: listChildren().length > 0,
    localStartChosen,
    online,
  });
  const result = firstRunGate({ ...inputs, signInFailed: inputs.signInFailed && failureStillCounts(auth.state, setAside) });
  return { ...result, localStartChosen, online, restoring: auth.state.status === 'restoring', chooseLocalStart, tryAgain };
}
