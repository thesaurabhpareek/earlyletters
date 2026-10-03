'use client';
/**
 * Owner: ACT1. The edge of a bed: a duvet with its corner turned back, falling over
 * the side rail, one leg. Enters from the left edge of its box (x < 0), so place it
 * against the left of the frame or let it bleed. One hand for every drawing: single
 * weight at any size (non-scaling stroke), round caps, currentColor, gentle
 * irregularity. `draw` 0..1 draws it on. viewBox 360 x 200.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { DrawingProps } from './types';

const STROKES: ReadonlyArray<readonly [string, number, number]> = [
  // duvet: top edge to the rounded corner, down the side, hem back to the left
  ['M -2 70.4 C 84 66.6 178 70.8 268.6 72.4 C 288.6 72.8 300.4 80.6 302.2 97.6 C 304.4 119.6 299.6 139.2 306.4 156.6 C 262 151.4 222 159.6 180 154.6 C 132 149.2 70 158.4 -2 152.4', 0, 0.6],
  // the turned-back corner
  ['M 196.4 71.4 C 212 84.6 234.4 96.2 262.6 100.2 C 278.6 102.4 291.4 99.2 301.6 95.4', 0.45, 0.75],
  // a soft fold on the top
  ['M 120 70.2 C 132 76 150 80.4 168 81.2', 0.6, 0.8],
  // side rail with a rounded end, and a leg
  ['M -2 167.4 C 98 165 200 168.6 294.2 166.6 C 301.4 166.4 305.6 169.6 305.8 176.2 C 254 177.4 120 175.4 -2 177.6', 0.5, 0.9],
  ['M 297.4 177 C 297.8 184 297.2 190 297.8 198', 0.85, 1],
];

function Line({ d, draw, from, to }: { d: string; draw: MotionValue<number>; from: number; to: number }) {
  const pathLength = useTransform(draw, [from, to], [0, 1]);
  const opacity = useTransform(pathLength, (v) => (v > 0.002 ? 1 : 0));
  return <motion.path d={d} vectorEffect="non-scaling-stroke" style={{ pathLength, opacity }} />;
}

export function Bed({ draw, className, title, strokeWidth = 1.5 }: DrawingProps) {
  return (
    <svg
      viewBox="0 0 360 200"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: 'visible' }}
    >
      {title ? <title>{title}</title> : null}
      {STROKES.map(([d, from, to]) =>
        draw ? <Line key={d} d={d} draw={draw} from={from} to={to} /> : <path key={d} d={d} vectorEffect="non-scaling-stroke" />,
      )}
    </svg>
  );
}
