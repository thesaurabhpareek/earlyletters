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
