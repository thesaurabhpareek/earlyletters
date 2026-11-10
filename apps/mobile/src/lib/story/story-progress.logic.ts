/**
 * Story progress segments (motion spec section 4). A linear clock, not a transition: fill = elapsed over dwell.
 * The view animates the current segment with a linear timing for `remainingMs` and restarts it after a pause, rather
 * than pausing a running animation. Under Reduce Motion the segments are static.
 */
export interface SegmentInput {
  index: number;
  count: number;
  elapsedMs: number;
  dwellMs: number;
  reduced?: boolean;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** One 0..1 fill per segment: seen are 1, upcoming are 0, the current is elapsed over dwell. */
export function segmentFills(p: SegmentInput): number[] {
  const n = Number.isFinite(p.count) && p.count > 0 ? Math.floor(p.count) : 0;
  return Array.from({ length: n }, (_, i) => {
    if (i < p.index) return 1;
    if (i > p.index) return 0;
    return p.reduced ? 1 : p.dwellMs > 0 ? clamp01(p.elapsedMs / p.dwellMs) : 0;
  });
}

/** How long a restarted fill animation should run. */
export function remainingMs(p: { elapsedMs: number; dwellMs: number }): number {
  return Math.max(0, p.dwellMs - (Number.isFinite(p.elapsedMs) ? Math.max(0, p.elapsedMs) : 0));
}

/** The one accessibility value for the whole bar: where you are, never what is left. */
export function progressA11y(index: number, count: number): { now: number; max: number } {
  const max = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return { now: max === 0 ? 0 : Math.min(max, Math.max(0, Math.floor(index)) + 1), max };
}
