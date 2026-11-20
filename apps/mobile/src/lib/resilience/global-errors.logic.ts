/**
 * BL-568 (APP-03): the app-wide catch for errors that never reach a React error boundary: a throw in a
 * press handler, a timer or a native callback, and promises nobody caught. Pure and testable in Node; the
 * native wiring (the real ErrorUtils and Hermes globals) is global-errors.ts.
 *
 * What it records is ids and error codes only (PRIV-R10): the kind of fault, a code from a fixed list
 * (the built-in error class name, never the message, never the stack, never a custom class name, which an
 * app module could build from content), the Hermes rejection id and the time. An error object can quote
 * a letter, a transcript or a child's name, so the error itself is read for its class and dropped.
 *
 * A fatal throw shows the recovery screen (the same calm screen as the root error boundary) instead of the
 * hard crash a Release build gives by default. That is for the production profile only (founder, 10 Nov 2026):
 * the testflight and preview profiles (both EXPO_PUBLIC_APP_ENV=preview) and development keep the native
 * crash, so testers' crashes still reach Apple's crash reports and the console, and a bug cannot hide behind
 * a calm screen. See `shouldInstallGlobalHandlers`. A rejected promise is recorded and nothing is shown: the
 * screen the person is on still works, and every caller that matters already handles its own failure.
 */

import type { AppEnv } from '../build-env';

/**
 * Only the production build (App Store) installs the handlers. A preview build (the testflight and preview EAS
 * profiles) and a development build leave React Native's own handler alone, so a fatal throw crashes natively.
 */
export function shouldInstallGlobalHandlers(appEnv: AppEnv): boolean {
  return appEnv === 'production';
}

/** Built-in error classes we can name without reading the error's words. Anything else is `error` or `non_error`. */
export const ERROR_CODES = [
  'type_error',
  'range_error',
  'reference_error',
  'syntax_error',
  'eval_error',
  'uri_error',
  'aggregate_error',
  'error',
  'non_error',
] as const;
export type GlobalErrorCode = (typeof ERROR_CODES)[number];

export type FaultKind = 'fatal' | 'non_fatal' | 'rejection';

/** One recorded fault. Only these four fields exist; nothing from the error itself but its class code. */
export interface FaultRecord {
  kind: FaultKind;
  code: GlobalErrorCode;
  /** Hermes rejection id for `rejection`, a running count for the others. Never derived from the error. */
  id: number;
  at: number;
}

/** The slice of React Native's global `ErrorUtils` this module uses. */
export interface ErrorUtilsLike {
  getGlobalHandler: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
}

/** Hermes' promise rejection tracker (`HermesInternal.enablePromiseRejectionTracker`). */
export interface RejectionTrackerLike {
  enablePromiseRejectionTracker?: (options: {
    allRejections: boolean;
    onUnhandled: (id: number, rejection: unknown) => void;
    onHandled: (id: number) => void;
  }) => void;
}

export interface GlobalErrorDeps {
  errorUtils?: ErrorUtilsLike | null;
  hermes?: RejectionTrackerLike | null;
  /** `__DEV__`. In development the previous handler still runs, as non-fatal, so LogBox keeps working under the recovery screen. */
  dev: boolean;
  /** Called once per fatal fault, after it is recorded: shows the recovery screen. */
  onFatal: (record: FaultRecord) => void;
  /** Where records go (a small in-memory list today; a consented crash reporter later reads the same shape). */
  record: (record: FaultRecord) => void;
  /** Development only: one line with the code and id, never the error. */
  warn?: (line: string) => void;
  now?: () => number;
}

const BUILT_IN: ReadonlyArray<[new (...args: never[]) => unknown, GlobalErrorCode]> = [
  [TypeError, 'type_error'],
  [RangeError, 'range_error'],
  [ReferenceError, 'reference_error'],
  [SyntaxError, 'syntax_error'],
  [EvalError, 'eval_error'],
  [URIError, 'uri_error'],
  ...(typeof AggregateError === 'function' ? [[AggregateError, 'aggregate_error'] as [new (...args: never[]) => unknown, GlobalErrorCode]] : []),
];

/** The code for an error: its built-in class by identity, never by reading `name` or `message` (both can be set to anything). */
export function errorCode(error: unknown): GlobalErrorCode {
  try {
    for (const [ctor, code] of BUILT_IN) if (error instanceof ctor) return code;
    return error instanceof Error ? 'error' : 'non_error';
  } catch {
    return 'non_error';
  }
}

/**
 * Installs the handlers. Returns false when neither global is there (Node, the web preview without
 * ErrorUtils), so the caller knows nothing was installed. Safe to call twice: the second call is a no-op.
 */
export function installGlobalErrorHandlers(deps: GlobalErrorDeps): boolean {
  const now = deps.now ?? Date.now;
  let count = 0;
  let installed = false;
  const keep = (kind: FaultKind, error: unknown, id?: number): FaultRecord => {
    const rec: FaultRecord = { kind, code: errorCode(error), id: id ?? ++count, at: now() };
    try {
      deps.record(rec);
    } catch {
      // Recording must never become the next fault.
    }
    if (deps.dev && deps.warn) {
      try {
        deps.warn(`[global-errors] ${rec.kind} ${rec.code} #${rec.id}`);
      } catch {
        // As above.
      }
    }
    return rec;
  };

  const eu = deps.errorUtils;
  if (eu && typeof eu.setGlobalHandler === 'function') {
    const marker = eu.getGlobalHandler?.() as { __scribeGlobalErrors?: true } | undefined;
    if (marker?.__scribeGlobalErrors) return true;
    const previous = eu.getGlobalHandler?.();
    let inside = false;
    const handler = (error: unknown, isFatal?: boolean) => {
      // A throw from inside our own handling would loop; the second one is dropped.
      if (inside) return;
      inside = true;
      try {
        const rec = keep(isFatal ? 'fatal' : 'non_fatal', error);
        if (isFatal) {
          try {
            deps.onFatal(rec);
          } catch {
            // The recovery screen failed to show; nothing more to do safely.
          }
        }
        // Release: never pass the error on. The default handler hands fatals to native code, which ends
        // the app and attaches the message to the crash report (PRIV-R10). Development: pass it on as
        // non-fatal so LogBox still shows it to the developer, and the recovery screen stays.
        if (deps.dev && previous) {
          try {
            previous(error, false);
          } catch {
            // LogBox failing is not the person's problem.
          }
        }
      } finally {
        inside = false;
      }
    };
    (handler as { __scribeGlobalErrors?: true }).__scribeGlobalErrors = true;
    eu.setGlobalHandler(handler);
    installed = true;
  }

  // Release only: React Native turns on its own tracker in development (polyfillPromise.js, LogBox
  // warnings for the developer) and none in Release, where rejected promises vanished before BL-568.
  const tracker = deps.dev ? undefined : deps.hermes?.enablePromiseRejectionTracker;
  if (typeof tracker === 'function') {
    try {
      tracker.call(deps.hermes, {
        allRejections: true,
        onUnhandled: (id, rejection) => {
          keep('rejection', rejection, id);
        },
        onHandled: () => undefined,
      });
      installed = true;
    } catch {
      // No tracker on this engine: the error handler above still covers throws.
    }
  }
  return installed;
}

/** The fault the recovery screen is showing, as a tiny external store for useSyncExternalStore. */
export function createFaultStore() {
  let current: FaultRecord | null = null;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of [...listeners]) l();
  };
  return {
    get: (): FaultRecord | null => current,
    set: (rec: FaultRecord) => {
      current = rec;
      emit();
    },
    clear: () => {
      if (current === null) return;
      current = null;
      emit();
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/** The last few records, newest last, for diagnostics. Bounded so a fault loop cannot grow memory. */
export function createFaultLog(limit = 20) {
  const items: FaultRecord[] = [];
  return {
    push: (rec: FaultRecord) => {
      items.push(rec);
      if (items.length > limit) items.splice(0, items.length - limit);
    },
    list: (): readonly FaultRecord[] => items.slice(),
  };
}
