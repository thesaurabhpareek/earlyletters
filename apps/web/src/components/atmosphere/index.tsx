'use client';
/**
 * Owner: AT (atmosphere). Light and texture layers that make the film feel shot, not drawn.
 * CONTRACT (scenes use these now; keep names and props):
 * - <LampLight intensity={MotionValue|number} x="30%" y="78%" size="90vmax" warmth="lamp|recording|dusk" />
 *     a soft radial pool of warm light, transform/opacity only.
 * - <Grain opacity={0.06} />: a static, pre-rendered film-grain overlay (pointer-events none).
 * - <PaperTexture />: subtle paper fibre texture for paper-tone scenes.
 * - <Vignette strength={MotionValue|number} />: darkened edges for night scenes.
 */
import type { MotionValue } from 'motion/react';
import { motion } from 'motion/react';

type Num = number | MotionValue<number>;

export function LampLight({ intensity = 1, x = '50%', y = '70%', size = '90vmax', warmth = 'lamp' }: { intensity?: Num; x?: string; y?: string; size?: string; warmth?: 'lamp' | 'recording' | 'dusk' }) {
  const color = warmth === 'recording' ? 'var(--night-recording)' : warmth === 'dusk' ? '#e8a96a' : 'var(--lamp)';
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        translateX: '-50%',
        translateY: '-50%',
        borderRadius: '50%',
        background: `radial-gradient(closest-side, color-mix(in srgb, ${color} 55%, transparent), transparent)`,
        opacity: intensity,
        pointerEvents: 'none',
      }}
    />
  );
}

export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  void opacity;
  return null;
}

export function PaperTexture() {
  return null;
}

export function Vignette({ strength = 1 }: { strength?: Num }) {
  return (
    <motion.div
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: strength, background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55))' }}
    />
  );
}
