/**
 * One undo window (BL-954, NS-01-R38a to R38c, NS-06-A2b, NS-33-R15, ruling T4). Pure: the clock and the moment the
 * screen reader finished speaking the undo line are passed in, so it runs in Node. No react-native import.
 *
 * Open for `seconds` from `openedAt`, or until the undo line has been spoken plus `seconds`, whichever is later. With
 * Switch Control on (`holdOpen`) it never expires; the parent moving on ends it. The toast closes at `closeDelayMs`
 * and the action checks `windowOpen`, so the button and the action expire together. Times are epoch milliseconds.
 */

/** When the window ends (epoch ms). */
export function windowEndsAt(openedAt: number, seconds: number, speechDoneAt?: number): number {
  const base = openedAt + seconds * 1000;
  return speechDoneAt === undefined ? base : Math.max(base, speechDoneAt + seconds * 1000);
}

/** Is Undo still allowed at `now`? The last millisecond counts as open. */
export function windowOpen(now: number, openedAt: number, seconds: number, speechDoneAt?: number, holdOpen = false): boolean {
  return holdOpen || now <= windowEndsAt(openedAt, seconds, speechDoneAt);
}

/** Milliseconds until the toast must close, 0 when it already should have, null when it never closes by timer. */
export function closeDelayMs(now: number, openedAt: number, seconds: number, speechDoneAt?: number, holdOpen = false): number | null {
  if (holdOpen) return null;
  return Math.max(0, windowEndsAt(openedAt, seconds, speechDoneAt) - now);
}

export interface UndoTimerPorts {
  now: () => number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
}

/**
 * The close timer of ONE offered undo. Each offer owns its own handle, so an older toast's dismissal (the toast store
 * calls it synchronously when a new toast replaces it) can only stop its own timer, never the newer one's.
 */
export function createUndoTimer(
  ports: UndoTimerPorts,
  w: { openedAt: number; speechDoneAt?: number; holdOpen?: boolean },
  seconds: number,
  onExpire: () => void,
) {
  let handle: unknown = null;
  let stopped = false;
  const stop = () => {
    stopped = true;
    if (handle !== null) ports.clearTimer(handle);
    handle = null;
  };
  const arm = () => {
    if (handle !== null) ports.clearTimer(handle);
    handle = null;
    if (stopped) return;
    const wait = closeDelayMs(ports.now(), w.openedAt, seconds, w.speechDoneAt, w.holdOpen);
    if (wait === null) return;
    handle = ports.setTimer(() => {
      handle = null;
      stopped = true;
      onExpire();
    }, wait);
  };
  /** The undo line finished being spoken at `at`: the window now runs from there. */
  const speechDone = (at: number) => {
    w.speechDoneAt = at;
    arm();
  };
  return { arm, stop, speechDone };
}
