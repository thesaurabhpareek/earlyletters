/**
 * The connectivity source for the first-run gate (`online`). expo-network, already a dependency (the backup and
 * speech-pack code read it). It reads the OS's local view of the connection; it makes no request, and the first paint
 * never waits for it: it starts as online and corrects itself a moment later (A-NFR-001).
 */
import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isOnline } from './welcome.logic';

/**
 * `enabled` is false in a build with server features off: nothing is read and no listener is registered.
 * `recheck` reads the connection again and says what it now is (it never rejects: a read that fails counts as online).
 * The newest word wins: a read that finishes after a newer event, or after a newer read, is not applied.
 */
export function useOnline(enabled: boolean): { online: boolean; recheck: () => Promise<boolean> } {
  const [online, setOnline] = useState(true);
  const known = useRef(true);
  const newest = useRef(0);
  const apply = useCallback((v: boolean) => {
    known.current = v;
    setOnline(v);
  }, []);
  const recheck = useCallback(async (): Promise<boolean> => {
    if (!enabled) return true;
    const mine = ++newest.current;
    let now = true;
    try {
      now = isOnline(await Network.getNetworkStateAsync());
    } catch {
      now = true;
    }
    if (mine === newest.current) apply(now);
    return known.current;
  }, [enabled, apply]);
  useEffect(() => {
    if (!enabled) return;
    void recheck();
    const sub = Network.addNetworkStateListener((s) => {
      newest.current += 1;
      apply(isOnline(s));
    });
    return () => sub.remove();
  }, [enabled, recheck, apply]);
  return { online, recheck };
}
