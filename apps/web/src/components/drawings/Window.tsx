'use client';
/**
 * Owner: ACT1. A night window: frame, sill, cross bars, a curtain drawn back on a
 * rod, and a crescent moon in the upper right pane. One hand for every drawing:
 * single weight at any size (non-scaling stroke), round caps, currentColor,
 * gentle human irregularity. `draw` 0..1 draws it on in the order a hand would.
 *
 * Extra optional prop (ACT1, reported): `moon={false}` leaves the moon out so a
 * scene can place its own <Moon> exactly there (centre 68.75% x, 28% y of the
 * box, diameter 14.17% of the width; a <Moon> box of 21.25% of the width).
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { DrawingProps } from './types';

/** [path, draw from, draw to] in the order the hand draws. viewBox 240 x 300. */
const STROKES: ReadonlyArray<readonly [string, number, number]> = [
  // frame: up the left side, across the top, down the right
  ['M 44 252 C 42.5 180.7 43.2 109.3 43.2 38 C 43.1 33.5 45 31.2 49 31.1 C 96.5 31.5 144 30.9 191.5 30.4 C 195.6 30.4 197.6 32.6 197.6 37 C 196.6 108.5 196.8 180.1 197.1 251.6', 0, 0.4],
  // sill with a rounded return
  ['M 28.5 253.8 C 89.2 252.7 149.8 252.7 210.5 252.4 C 213.4 252.4 214.4 254.2 214 256.2 C 213.6 258.2 212.2 259 209.6 259 C 150.7 258.7 91.9 259.3 33 259.9', 0.3, 0.55],
  // mullion and meeting rail
  ['M 120.6 31.8 C 119.7 105.3 119.8 178.9 120.1 252.4', 0.4, 0.6],
  ['M 43.6 143 C 94.9 142.2 146.1 141.7 197.4 141.8', 0.48, 0.68],
  // curtain rod
  ['M 18 17.6 C 86.2 17.6 154.3 17.2 222.5 16.4', 0.55, 0.72],
  // curtain: inner edge gathered to the tie, then falling; outer edge; tie-back
  ['M 76 18.6 C 70 64 50 118 41.5 168.5 C 40.6 174 43 178.2 47.6 182 C 53.4 214 59 252 61 296', 0.62, 0.9],
  ['M 22.6 18.4 C 25.5 72 22 132 29.2 171 C 27.6 210 23.4 256 22 296', 0.66, 0.92],
  ['M 27.4 170.4 C 32.6 176.6 41 177.8 48.4 172.6', 0.85, 0.95],
];
const MOON: readonly [string, number, number] = ['M 163.9 67 A 17 17 0 1 1 152 95 A 15.2 15.2 0 0 0 164.2 66.8', 0.88, 1];

function Line({ d, draw, from, to }: { d: string; draw: MotionValue<number>; from: number; to: number }) {
  const pathLength = useTransform(draw, [from, to], [0, 1]);
  const opacity = useTransform(pathLength, (v) => (v > 0.002 ? 1 : 0));
  return <motion.path d={d} vectorEffect="non-scaling-stroke" style={{ pathLength, opacity }} />;
}

export function Window({ draw, className, title, strokeWidth = 1.5, moon = true }: DrawingProps & { moon?: boolean }) {
  const strokes = moon ? [...STROKES, MOON] : STROKES;
  return (
    <svg
      viewBox="0 0 240 300"
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
      {strokes.map(([d, from, to]) =>
        draw ? <Line key={d} d={d} draw={draw} from={from} to={to} /> : <path key={d} d={d} vectorEffect="non-scaling-stroke" />,
      )}
    </svg>
  );
}
