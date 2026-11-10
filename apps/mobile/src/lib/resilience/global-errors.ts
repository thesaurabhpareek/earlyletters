/**
 * BL-568: the native wiring for global-errors.logic.ts. `startGlobalErrorHandlers()` runs at module load of
 * the root layout, before the first render. A fatal throw outside React sets the fault store, and the root
 * layout shows the recovery screen in place of the app (useGlobalFault). Production profile only: in the
 * testflight, preview and development builds nothing is installed and a fatal throw crashes natively
 * (shouldInstallGlobalHandlers). Records hold ids and error codes
 * only (PRIV-R10); the analytics count is the existing `error_shown` with code `generic`, dropped unless the
 * person said yes.
 */
import { useSyncExternalStore } from 'react';
import { APP_ENV } from '@/lib/build-env';
import { track } from '@/lib/analytics/track';
import {
  createFaultLog,
  createFaultStore,
  installGlobalErrorHandlers,
  shouldInstallGlobalHandlers,
  type ErrorUtilsLike,
  type FaultRecord,
  type RejectionTrackerLike,
} from './global-errors.logic';

const faults = createFaultStore();
const log = createFaultLog();

/** The last 20 records (kind, code, id, time), newest last. Nothing else is kept. */
export const recentFaults = log.list;

let started = false;

export function startGlobalErrorHandlers(): void {
  if (started || !shouldInstallGlobalHandlers(APP_ENV)) return;
  started = true;
  const g = globalThis as { ErrorUtils?: ErrorUtilsLike; HermesInternal?: RejectionTrackerLike };
  installGlobalErrorHandlers({
    errorUtils: g.ErrorUtils ?? null,
    hermes: g.HermesInternal ?? null,
    dev: typeof __DEV__ !== 'undefined' && __DEV__,
    record: log.push,
    onFatal: (rec) => {
      faults.set(rec);
      try {
        track('error_shown', { code: 'generic' });
      } catch {
        // Analytics never becomes the next fault.
      }
    },
    // eslint-disable-next-line no-console
    warn: (line) => console.warn(line),
  });
}

/** The fault the recovery screen is for, and how to leave it (Try again remounts the app). */
export function useGlobalFault(): { fault: FaultRecord | null; clear: () => void } {
  const fault = useSyncExternalStore(faults.subscribe, faults.get, faults.get);
  return { fault, clear: faults.clear };
}
