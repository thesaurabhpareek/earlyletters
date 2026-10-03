'use client';
/**
 * Owner: ACT1. A bedside lamp on a small table: drum shade, jar base, pull cord.
 * One hand for every drawing: single weight at any size (non-scaling stroke), round
 * caps, currentColor, gentle human irregularity. `draw` 0..1 draws it on.
 *
 * Extra optional prop (ACT1, reported): `glow` 0..1 switches the lamp on: the
 * shade fills with warm light (--lamp) and a soft cone falls onto the table.
 * Opacity only. Pair it with <LampLight> for the light in the room.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { useId } from 'react';
import type { DrawingProps } from './types';

/** viewBox 160 x 240. Shade centre is at (80, 78); table top at y 195. */
const STROKES: ReadonlyArray<readonly [string, number, number]> = [
  // shade: left side, front bottom rim, right side, front top rim, back top rim
  ['M 56.2 46.4 C 49.4 66 43 86 35.6 106.6 C 50 115.4 110 115.4 124.6 106.4 C 117.4 86 110.8 66 104 46.2 C 97.6 50.8 62.6 50.8 56.4 46.6 C 62.4 41.6 97.6 41.4 104.4 46', 0, 0.42],
  // stem
  ['M 80 114.6 C 80.3 120 79.8 126 80.1 131.4', 0.38, 0.48],
  // jar, closed by its rim
  ['M 72.4 131.6 C 72.2 138.2 58.6 142.4 57.4 160 C 56.2 180.4 66.4 194.2 80.2 194.2 C 94 194.2 104.2 180 103 160 C 101.8 142.4 88 138.2 88 131.4 C 82.6 130.8 77.6 131 72.8 131.4', 0.45, 0.78],
  // table top and its front edge
  ['M 154.6 195 C 104 194.4 52 196.2 4.4 195.4 C 3.2 197.6 3.6 200.4 5.8 202.2 C 54 202.6 104 201.4 153.8 202.4', 0.55, 0.88],
  // legs
  ['M 16.2 202.6 C 16.6 216 15.8 228 16.6 240', 0.78, 0.94],
  ['M 143.6 202.4 C 143.2 216 144 228 143.4 240', 0.8, 0.96],
  // pull cord and bead
  ['M 111.6 112.4 C 112 120 111.4 128 111.8 135.6', 0.86, 0.97],
  ['M 111.8 136 C 114.6 136 115 140.6 111.9 140.8 C 108.8 141 108.8 136.2 111.6 136.1', 0.93, 1],
];
const SHADE_FILL = 'M 56.2 46.4 C 49.4 66 43 86 35.6 106.6 C 50 115.4 110 115.4 124.6 106.4 C 117.4 86 110.8 66 104 46.2 C 97.6 50.8 62.6 50.8 56.4 46.6 Z';
const CONE = 'M 37 108 C 52 116 108 116 123 108 L 156 195 L 4 195 Z';

function Line({ d, draw, from, to }: { d: string; draw: MotionValue<number>; from: number; to: number }) {
  const pathLength = useTransform(draw, [from, to], [0, 1]);
  const opacity = useTransform(pathLength, (v) => (v > 0.002 ? 1 : 0));
  return <motion.path d={d} vectorEffect="non-scaling-stroke" style={{ pathLength, opacity }} />;
}

export function Lamp({ draw, className, title, strokeWidth = 1.5, glow }: DrawingProps & { glow?: MotionValue<number> | number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 160 240"
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
      {glow !== undefined ? (
        <>
          <defs>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--lamp)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--lamp)" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--lamp)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--lamp)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.g stroke="none" style={{ opacity: glow }}>
            <path d={CONE} fill={`url(#${id}-cone)`} />
            <path d={SHADE_FILL} fill={`url(#${id}-shade)`} />
          </motion.g>
        </>
      ) : null}
      {STROKES.map(([d, from, to]) =>
        draw ? <Line key={d} d={d} draw={draw} from={from} to={to} /> : <path key={d} d={d} vectorEffect="non-scaling-stroke" />,
      )}
    </svg>
  );
}
