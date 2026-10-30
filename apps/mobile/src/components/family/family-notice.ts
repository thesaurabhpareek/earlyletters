/**
 * One line a family sheet leaves for the Family tab to show as its toast when the tab is in front again
 * (EXPERIENCE_PASS_2026-10 S58: "create.done shows as a toast"; S60: "leave.done"). A sheet sits over the tabs,
 * so a toast it showed itself would be drawn above the sheet and leave with it; the tab's own ToastHost sits
 * above the tab bar (5.8 row 11). Words only: never a token, a link or anything a person typed.
 */
let waiting: string | null = null;

export const familyNotice = {
  /** Called by a sheet just before it closes. A newer line replaces an older one. */
  leave(message: string): void {
    waiting = message;
  },
  /** The line waiting for the tab, once: it is cleared as it is read. */
  take(): string | null {
    const m = waiting;
    waiting = null;
    return m;
  },
};

/**
 * "Open the book" on the join sheet (S59, 5.8 row 12): the Book that comes forward next raises its light from unlit
 * over arriveMs, once, for the second parent's first evening in the book. A one-shot mark, not a route param, so it
 * reaches the Book whether the tabs were already there under the sheet or come up new, and leaves nothing in the
 * address. Nothing about the book or the person is kept: only that an arrival is waiting.
 */
let arrival = false;

export const joinedArrival = {
  leave(): void {
    arrival = true;
  },
  /** Whether an arrival is waiting, without taking it (read while the Book first draws). */
  waiting(): boolean {
    return arrival;
  },
  /** The arrival, once: it is cleared as it is read. */
  take(): boolean {
    const a = arrival;
    arrival = false;
    return a;
  },
};
