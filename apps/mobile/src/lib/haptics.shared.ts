/**
 * Haptic vocabulary shared by haptics.ts (iOS, web no-op) and haptics.android.ts.
 * Five intents only (COMPONENTS 0.2, MOTION 6). A haptic always accompanies a visible
 * change, never stands alone, and never plays during playback, highlight, scroll,
 * tabs, sheets opening, navigation or typing.
 *
 *   tap      selection tick: chip or choice picked, Reading Size step, Undo, Put it back
 *   press    light impact: record start / stop, Speak / Type
 *   soft     soft impact: long-press menu, "Not much today"
 *   success  notification: a letter is saved (the one celebratory moment)
 *   warning  notification: a destructive action is confirmed or undone-able (Delete, Let it go)
 */
export type HapticIntent = 'tap' | 'press' | 'soft' | 'success' | 'warning';

const THROTTLE_MS = 100;
let last = 0;

/**
 * Selection and impact ticks are throttled to one per 100 ms. Notifications (success,
 * warning) are never dropped: they mark outcomes, and they reset the throttle so a tick
 * right after them does not blur into the outcome.
 */
export function shouldPlay(intent: HapticIntent, now: number = Date.now()): boolean {
  if (intent === 'success' || intent === 'warning') {
    last = now;
    return true;
  }
  if (now - last < THROTTLE_MS) return false;
  last = now;
  return true;
}

/** Test seam. */
export function resetHapticThrottle(): void {
  last = 0;
}
