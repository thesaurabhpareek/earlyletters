/**
 * One line a family sheet leaves for the page under it to show as its toast when that page is in front again: the
 * family page (/family), or the book's settings page whose "Write this book together" row opened the sheet (11 Nov
 * 2026, no Family tab). EXPERIENCE_PASS_2026-10 S58: "create.done shows as a toast"; S60: "leave.done". A sheet sits
 * over the page, so a toast it showed itself would be drawn above the sheet and leave with it; the page's own
 * ToastHost (the tabs' sits above the tab bar, 5.8 row 11) draws it. Whichever page takes the line first shows it,
 * once. Words only: never a token, a link or anything a person typed.
 */
let waiting: { message: string; owner: string } | null = null;

/**
 * Who is signed in, bound by lib/auth/auth-store.ts at load (this file stays free of it, so there is no import cycle).
 * Before it is bound (tests of a page alone) every call reads as one person. A line or mark is kept for the account
 * that left it only: set while nobody is signed in (a continuation that resumed after the session ended) it is dropped,
 * and read by another account it is not shown.
 */
let reader: () => string | null = () => 'local';
export function bindNoticeOwner(read: () => string | null): void {
  reader = read;
}

/** Who is signed in right now. A sheet reads it BEFORE its await and passes it to `leave`. */
export function noticeOwner(): string | null {
  return reader();
}

export const familyNotice = {
  /**
   * Called by a sheet just before it closes. A newer line replaces an older one. `owner` is who was signed in when
   * the sheet started its await (noticeOwner()): when someone else is signed in by the time it resumes, or nobody is,
   * the line is dropped, so a late continuation can never stamp A's line with B's account.
   */
  leave(message: string, owner: string | null = reader()): void {
    waiting = owner === null || owner !== reader() ? null : { message, owner };
  },
  /** The line waiting for the tab, once: it is cleared as it is read. */
  take(): string | null {
    const w = waiting;
    waiting = null;
    return w && w.owner === reader() ? w.message : null;
  },
  /** The session that left the line is over (lib/auth/auth-store.ts publishAuth): the next account never reads it. */
  clear(): void {
    waiting = null;
  },
};

/**
 * "Open the book" on the join sheet (S59, 5.8 row 12): the Book that comes forward next raises its light from unlit
 * over arriveMs, once, for the second parent's first evening in the book. A one-shot mark, not a route param, so it
 * reaches the Book whether the tabs were already there under the sheet or come up new, and leaves nothing in the
 * address. Nothing about the book or the person is kept: only that an arrival is waiting.
 */
let arrival: string | null = null;

export const joinedArrival = {
  leave(): void {
    arrival = reader();
  },
  /** Whether an arrival is waiting, without taking it (read while the Book first draws). */
  waiting(): boolean {
    return arrival !== null && arrival === reader();
  },
  /** The arrival, once: it is cleared as it is read. */
  take(): boolean {
    const a = arrival !== null && arrival === reader();
    arrival = null;
    return a;
  },
  /** The session that left the mark is over (lib/auth/auth-store.ts publishAuth). */
  clear(): void {
    arrival = null;
  },
};
