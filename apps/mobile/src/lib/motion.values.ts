/**
 * Pure motion values read from design tokens (no React Native import, so they
 * are unit-testable). motion.ts turns these into Reanimated configs.
 */
import { tokens, type MotionToken } from '@scribe/design-tokens';

const m = tokens.motion;

export const FADE_MS = m.reduceMotion.durationMs;
export const EASING_POINTS = m.easing;
export const ENTER = m.enter;

/** Spring params for a token (stiffness/damping/mass only). */
export function springParams(token: MotionToken) {
  const s = m[token];
  return { stiffness: s.stiffness, damping: s.damping, mass: s.mass };
}

/** Delay for the nth item of a staggered entrance; capped at staggerMax steps. */
export function enterDelayMs(index: number): number {
  return Math.min(Math.max(index, 0), ENTER.staggerMax) * ENTER.staggerMs;
}
