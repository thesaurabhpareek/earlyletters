/**
 * How many one-way runs a looping animation makes before it ends on its own (BL-1988, CDESO-4).
 *
 * `withRepeat(anim, reps, true)` counts each one-way run (there and back are two). `cycleMs` is one full
 * there-and-back. The count is `ceil(loopCapMs / cycleMs) * 2`: always even, so a reversing loop ends on the
 * value it started from (Breathe at full opacity, the waiting bar at the start of its track). No timer, no `-1`.
 */
import { tokens } from '@scribe/design-tokens';

export function loopReps(cycleMs: number, capMs: number = tokens.motion.loopCapMs): number {
  if (!(cycleMs > 0)) throw new Error('loopReps: cycleMs must be above 0');
  return Math.ceil(capMs / cycleMs) * 2;
}
