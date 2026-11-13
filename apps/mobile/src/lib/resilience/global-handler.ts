/**
 * The last net under the app (BL-370): an error thrown outside rendering (a timer, a promise, a native callback)
 * never reaches the error boundary. This installs one handler on React Native's `ErrorUtils` that:
 *  - never reads, logs, keeps or sends the error, its message or its stack (an error can quote a person's words);
 *  - lets a non-fatal error pass quietly in a release build, so one stray failure does not end a letter being typed;
 *  - hands a fatal error to the handler that was there before, so the app ends as it always did and the next launch
 *    meets the launch recovery screen (use-launch.ts) with every letter still on the phone;
 *  - in development, hands everything on, so the developer still sees it.
 * Installing twice does nothing the second time.
 */

export type ErrorUtilsLike = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

const INSTALLED = Symbol.for('scribe.globalErrorHandler');

export function installGlobalErrorHandler(utils: ErrorUtilsLike | undefined, options: { dev: boolean }): boolean {
  if (!utils || typeof utils.setGlobalHandler !== 'function') return false;
  const marked = utils as ErrorUtilsLike & { [INSTALLED]?: boolean };
  if (marked[INSTALLED]) return false;
  marked[INSTALLED] = true;
  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    if (options.dev || isFatal) {
      try {
        previous?.(error, isFatal);
      } catch {
        // The previous handler failing must not become a second failure.
      }
    }
    // Otherwise: nothing. No log, no copy of the error.
  });
  return true;
}
