'use client';
/**
 * Owner: ACT3. One line of a hand drawing. Without `draw` the line is complete (resting state).
 * With `draw` (0..1) the line draws itself over the [from, to] slice of that value via pathLength.
 * The round-cap dot that pathLength 0 would leave is hidden until the line starts.
 *
 * Suggestion for the coordinator: move this to src/components/drawings/Stroke.tsx so every
 * drawing in the film shares one implementation of the hand.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';

export type StrokeProps = { d: string; draw?: MotionValue<number>; from?: number; to?: number };

export function Stroke({ d, draw, from = 0, to = 1 }: StrokeProps) {
  if (!draw) return <path d={d} />;
  return <DrawnStroke d={d} draw={draw} from={from} to={to} />;
}

function DrawnStroke({ d, draw, from, to }: Required<StrokeProps>) {
  const pathLength = useTransform(draw, [from, to], [0, 1]);
  const opacity = useTransform(pathLength, (v) => (v > 0.002 ? 1 : 0));
  return <motion.path d={d} style={{ pathLength, opacity }} />;
}
