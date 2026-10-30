/**
 * Opens the local database once at launch and reports whether the app can run (launch.logic.ts).
 * `retry` opens again (openStore() tries afresh after a failure) and returns what it found, because a failed open
 * leaves `status` as it was and React draws nothing new for an equal state: the recovery screen needs the answer
 * itself to show that a tap was heard (S51). This hook deletes, resets and rebuilds nothing itself. Each update step
 * runs in its own transaction, so a step that fails leaves the file as it was before that step; steps that finished
 * earlier in the same open stay applied (db/migrations.ts `migrate`).
 */
import { useCallback, useEffect, useState } from 'react';
import { openStore } from '../store';
import { openForLaunch, type LaunchStatus } from './launch.logic';
import { launchFaultForPreview } from './launch-fault';

export function useLaunch(storeReady: boolean): { status: LaunchStatus | 'pending'; retry: () => LaunchStatus } {
  const [status, setStatus] = useState<LaunchStatus | 'pending'>('pending');
  const open = useCallback(
    (): LaunchStatus =>
      openForLaunch(() => {
        if (launchFaultForPreview()) throw new Error('preview_fault');
        return openStore();
      }, setStatus),
    [],
  );
  useEffect(() => {
    if (storeReady) open();
  }, [storeReady, open]);
  return { status, retry: open };
}
