// web: same | android: same
/**
 * First run's welcome while a joined book is on its way (critics' pass S2; components/family/join-wait.logic.ts).
 * The welcome (P2's app/onboarding.tsx) calls this hook and draws what it returns: one line, "Begin the book" shown
 * or hidden, and Try again. It follows the wait the join sheet left, this phone's books (the book arriving ends it),
 * the account (sign-out ends it; sync not allowed reads as stalled), sync's phase, and the clock (after JOIN_WAIT_MS
 * the welcome offers Try again and "Begin the book" again). The wait also ends once the welcome is no longer the
 * step showing, and when first run leaves.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getAuthSnapshot, subscribeAuth, syncAllowed } from '@/lib/auth/auth-store';
import { authUserId } from '@/lib/auth/machine.logic';
import { getChild, subscribe } from '@/lib/store';
import { getSyncStatus, subscribeSyncStatus, syncNow } from '@/lib/sync';
import type { SyncPhase } from '@/lib/sync/types';
import { JOIN_WAIT_MS, joinWait, joinWaitEnds, retryRestartsWait, welcomeJoinView, type WelcomeJoinView } from './join-wait.logic';

export function useWelcomeJoinWait(where: {
  /** First run's welcome is the step showing (under a sheet or not). */
  onWelcome: boolean;
  /** The welcome itself is in front (no sheet over it): only then is its line spoken. */
  inFront: boolean;
}): WelcomeJoinView & { onRetry: () => void } {
  const { onWelcome, inFront } = where;
  const wait = useSyncExternalStore(joinWait.subscribe, joinWait.get, joinWait.get);
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const signedIn = authUserId(auth) !== null;
  const syncOn = wait ? syncAllowed() : false;
  // Read with the wait it belongs to, never a value left from an earlier one.
  const readBookHere = () => (wait ? getChild(wait.childId) !== null : false);
  const bookHere = useSyncExternalStore(subscribe, readBookHere, readBookHere);
  const [phase, setPhase] = useState<SyncPhase | null>(() => getSyncStatus().phase);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => subscribeSyncStatus((s) => setPhase(s.phase)), []);
  // The book is here, the welcome is no longer the step showing, or the account signed out: the wait is over.
  const ends = joinWaitEnds({ onWelcome, signedIn, bookHere });
  useEffect(() => {
    if (wait && ends) joinWait.clear();
  }, [wait, ends]);
  // First run leaving (its last step, or the hand-over to the Book) ends it too.
  useEffect(() => () => joinWait.clear(), []);
  // Wake once when the quiet wait runs out, so Try again and "Begin the book" come back.
  useEffect(() => {
    if (!wait) return;
    setNow(Date.now());
    const left = wait.since + JOIN_WAIT_MS - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), left + 50);
    return () => clearTimeout(id);
  }, [wait]);

  // A sync that ran starts the quiet wait over; with no sync running (it resolves null) nothing changes.
  const onRetry = useCallback(() => {
    void syncNow()
      .then((report) => {
        if (retryRestartsWait(report)) joinWait.restart();
      })
      .catch(() => undefined);
  }, []);

  const view = welcomeJoinView({ wait, onWelcome, bookHere, syncOn, phase, now });
  void inFront;

  return { ...view, onRetry };
}
