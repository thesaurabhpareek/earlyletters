'use client';
/**
 * Owner: ACT1. A crescent moon in the film's one hand: a single continuous line,
 * single weight at any size (non-scaling stroke), round caps, stroke currentColor.
 * `draw` 0..1 draws it on; absent = complete. Same crescent as the one in <Window>,
 * so a scene can hand the moon from one to the other.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { DrawingProps } from './types';

const CRESCENT = 'M 28.9 10 A 20 20 0 1 1 14.7 42.9 A 17.9 17.9 0 0 0 29.2 9.8';

function Line({ d, draw }: { d: string; draw: MotionValue<number> }) {
  const opacity = useTransform(draw, (v) => (v > 0.002 ? 1 : 0));
  return <motion.path d={d} vectorEffect="non-scaling-stroke" style={{ pathLength: draw, opacity }} />;
}

export function Moon({ draw, className, title, strokeWidth = 1.5 }: DrawingProps) {
  return (
    <svg
      viewBox="0 0 60 60"
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
      {draw ? <Line d={CRESCENT} draw={draw} /> : <path d={CRESCENT} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
