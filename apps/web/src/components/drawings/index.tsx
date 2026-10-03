'use client';
/**
 * Owner: E5 (illustration and draw-on). Single-weight line drawings (DESIGN_LANGUAGE 9,
 * CREATIVE 3): one continuous line, round caps, currentColor stroke, no faces, no mascot.
 *
 * CONTRACT: each drawing takes an optional `draw` MotionValue<number> (0..1 stroke
 * draw-on via pathLength). Without it the drawing is complete. Decorative by default
 * (aria-hidden); pass `title` to make it meaningful.
 */
import type { MotionValue } from 'motion/react';

export type DrawingProps = { draw?: MotionValue<number>; className?: string; title?: string; strokeWidth?: number };

const Stub = ({ className }: DrawingProps) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="10" y="20" width="80" height="60" rx="4" />
  </svg>
);

export const Window = Stub;
export const Lamp = Stub;
export const Moon = Stub;
export const Envelope = Stub;
export const Page = Stub;
