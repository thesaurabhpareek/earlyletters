/**
 * Owner: ACT2. Small, pure timing helpers for the paper act (S04 to S06).
 * Everything here maps scroll progress to numbers; nothing touches the DOM.
 */
import { cubicBezier, easeInOut } from 'motion/react';

/** MOTION.md section 3, `--ease-standard`: cubic-bezier(0.2, 0, 0, 1). For things arriving. */
export const standard = cubicBezier(0.2, 0, 0, 1);
/** For scrubbed transformations the visitor drives in both directions (a card forming, a stack moving). */
export const inOut = easeInOut;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0..1 position of `p` inside [a, b]. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** The letter card's resting scale (S05 end, S06 start). Keep in sync with `--k` in Letter.module.css. */
export const CARD_SCALE = 0.6;

/**
 * Where the letter rests while a headline sits above it (S04 end, S05 start).
 * Returns the downward shift in px from the centred position.
 * Aim: the letter's bottom at 80% of the frame, so the headline gets clear space above.
 * Guard: the headline block (head, including its gap) must clear the site header (`safeTop`).
 * S04 and S05 call this with their own head height; at normal sizes the aim decides, so the
 * shared frame between them matches exactly.
 */
export function settleShift(frameH: number, letterH: number, headH: number, safeTop = 76): number {
  if (!frameH || !letterH) return 0;
  const centreTop = (frameH - letterH) / 2;
  const aimTop = frameH * 0.8 - letterH;
  const minTop = safeTop + headH;
  const maxTop = frameH - letterH - 16;
  const top = Math.min(Math.max(aimTop, minTop), Math.max(maxTop, centreTop));
  return Math.max(0, top - centreTop);
}
