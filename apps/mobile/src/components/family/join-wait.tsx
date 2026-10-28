// web: same | android: same
/**
 * First run's welcome while a joined book is on its way (critics' pass S2; components/family/join-wait.logic.ts).
 * The welcome (P2's app/onboarding.tsx) calls this hook and draws what it returns: one line, "Begin the book" shown
 * or hidden, and Try again. It follows the wait the join sheet left, this phone's books (the book arriving ends it),
 * sync's phase, and the clock (after JOIN_WAIT_MS the welcome offers Try again and "Begin the book" again).
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getChild, subscribe } from '@/lib/store';
import { getSyncStatus, subscribeSyncStatus, syncNow } from '@/lib/sync';
import type { SyncPhase } from '@/lib/sync/types';
import { JOIN_WAIT_MS, joinWait, welcomeJoinView, type WelcomeJoinView } from './join-wait.logic';

export function useWelcomeJoinWait(): WelcomeJoinView & { onRetry: () => void } {
  const wait = useSyncExternalStore(joinWait.subscribe, joinWait.get, joinWait.get);
  const [phase, setPhase] = useState<SyncPhase | null>(() => getSyncStatus().phase);
  const [bookHere, setBookHere] = useState(() => (wait ? getChild(wait.childId) !== null : false));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => subscribeSyncStatus((s) => setPhase(s.phase)), []);
  useEffect(() => {
    if (!wait) return;
    const read = () => setBookHere(getChild(wait.childId) !== null);
    read();
    return subscribe(read);
  }, [wait]);
  // The book is here: the wait is over (the welcome hands over to the Book).
  useEffect(() => {
    if (wait && bookHere) joinWait.clear();
  }, [wait, bookHere]);
  // Wake once when the quiet wait runs out, so Try again and "Begin the book" come back.
  useEffect(() => {
    if (!wait) return;
    setNow(Date.now());
    const left = wait.since + JOIN_WAIT_MS - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), left + 50);
    return () => clearTimeout(id);
  }, [wait]);

  const onRetry = useCallback(() => {
    joinWait.restart();
    void syncNow();
  }, []);

  return { ...welcomeJoinView({ wait, bookHere, phase, now }), onRetry };
}
