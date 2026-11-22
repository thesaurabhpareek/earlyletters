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
