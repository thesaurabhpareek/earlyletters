/**
 * Opens the local database once at launch and reports whether the app can run (launch.logic.ts).
 * `retry` opens again (openStore() tries afresh after a failure). Nothing is ever deleted, reset or
 * rebuilt here: a failed open leaves the file exactly as it was.
 */
import { useCallback, useEffect, useState } from 'react';
import { openStore } from '../store';
import { attemptOpen, type LaunchStatus } from './launch.logic';
import { launchFaultForPreview } from './launch-fault';

export function useLaunch(storeReady: boolean): { status: LaunchStatus | 'pending'; retry: () => void } {
  const [status, setStatus] = useState<LaunchStatus | 'pending'>('pending');
  const open = useCallback(() => {
    setStatus(
      attemptOpen(() => {
        if (launchFaultForPreview()) throw new Error('preview_fault');
        return openStore();
      }),
    );
  }, []);
  useEffect(() => {
    if (storeReady) open();
  }, [storeReady, open]);
  return { status, retry: open };
}
