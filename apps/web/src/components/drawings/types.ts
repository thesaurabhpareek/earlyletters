import type { MotionValue } from 'motion/react';

/** CONTRACT for line drawings (CREATIVE.md 3): single weight, round caps, stroke currentColor,
 * fill none, no faces. `draw` 0..1 draws the line on via pathLength; absent = complete.
 * Decorative (aria-hidden) unless `title` is given. */
export type DrawingProps = { draw?: MotionValue<number>; className?: string; title?: string; strokeWidth?: number };
