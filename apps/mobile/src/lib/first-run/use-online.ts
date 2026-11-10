/**
 * The connectivity source for the first-run gate (`online`). expo-network, already a dependency (the backup and
 * speech-pack code read it). It reads the OS's local view of the connection; it makes no request, and the first paint
 * never waits for it: it starts as online and corrects itself a moment later (A-NFR-001).
 */
import * as Network from 'expo-network';
import { useCallback, useEffect, useState } from 'react';
import { isOnline } from './welcome.logic';

/** `enabled` is false in a build with server features off: nothing is read and no listener is registered. */
export function useOnline(enabled: boolean): { online: boolean; recheck: () => void } {
  const [online, setOnline] = useState(true);
  const recheck = useCallback(() => {
    if (!enabled) return;
    void Network.getNetworkStateAsync()
      .then((s) => setOnline(isOnline(s)))
      .catch(() => setOnline(true));
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    recheck();
    const sub = Network.addNetworkStateListener((s) => setOnline(isOnline(s)));
    return () => sub.remove();
  }, [enabled, recheck]);
  return { online, recheck };
}
