'use client';
/**
 * Owner: coordinator. Shared scene hooks (first written by ACT3 in scenes/parts/act3; promoted here).
 * - useStage(restAt): the progress a scene animates from. With reduced motion the stage does not pin,
 *   so we hold a still value at the scene's designed resting moment and every transform resolves to it.
 * - useViewport(): viewport size for components that need a number (PhoneFrame width).
 * - useResting(): hydration-safe prefers-reduced-motion.
 */
export { useStage } from '@/scenes/parts/act3/stage';
export { useViewport } from '@/scenes/parts/act3/viewport';
export { useResting } from '@/scenes/parts/act3/resting';

/** Phone width in px for a viewport, shared so handoffs between scenes match exactly. */
export function phoneWidthFor(w: number, h: number): number {
  if (w < 768) return Math.round(Math.max(170, Math.min(300, w * 0.64, (h - 300) / 2.09)));
  return Math.round(Math.max(240, Math.min(320, (h - 200) / 2.09)));
}
