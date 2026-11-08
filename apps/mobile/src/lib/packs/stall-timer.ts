/**
 * A stall timer for one download request (PR #541 review A). Pure: no Expo, tested in Node
 * (__tests__/stall-timer.test.ts) with fake timers.
 *
 * The request is stopped only when no new bytes arrive for `ms`. Each time the byte count grows, the window starts
 * again, so a slow but steady link (a 16 MiB chunk at 1 Mbps takes about 2 minutes) always finishes, while a
 * connection that has gone quiet is given up on after `ms`. Before this the adapter had a 60 s limit on the whole
 * request, which needed about 2.2 Mbps for a whole chunk and failed every attempt below that.
 */

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export interface StallTimer {
  /** Reports the bytes written so far; only growth restarts the window. */
  progress(bytesWritten: number): void;
  /** Stops watching (the request ended either way). */
  stop(): void;
}

export function startStallTimer(ms: number, onStall: () => void, timers: Timers = realTimers): StallTimer {
  let best = -1;
  let handle: unknown = null;
  let stopped = false;
  const arm = () => {
    if (handle !== null) timers.clear(handle);
    handle = timers.set(() => {
      handle = null;
      if (!stopped) onStall();
    }, ms);
  };
  arm();
  return {
    progress(bytesWritten) {
      if (stopped || !(bytesWritten > best)) return;
      best = bytesWritten;
      arm();
    },
    stop() {
      stopped = true;
      if (handle !== null) timers.clear(handle);
      handle = null;
    },
  };
}
