/**
 * The connectivity source for the first-run gate (`online`). expo-network, already a dependency (the backup and
 * speech-pack code read it). It reads the OS's local view of the connection; it makes no request, and the first paint
 * never waits for it: it starts as online and corrects itself a moment later (A-NFR-001).
 */
import * as Network from 'expo-network';
import { useCallback, useEffect, useState } from 'react';
import { isOnline } from './welcome.logic';

export function useOnline(): { online: boolean; recheck: () => void } {
  const [online, setOnline] = useState(true);
  const recheck = useCallback(() => {
    void Network.getNetworkStateAsync()
      .then((s) => setOnline(isOnline(s)))
      .catch(() => setOnline(true));
  }, []);
  useEffect(() => {
    recheck();
    const sub = Network.addNetworkStateListener((s) => setOnline(isOnline(s)));
    return () => sub.remove();
  }, [recheck]);
  return { online, recheck };
}
