'use client';
/**
 * Owner: coordinator (first written by ACT3). The progress a scene animates from.
 * Normally the scene's scroll progress. With reduced motion the stage does not pin (Scene.module.css),
 * so scroll progress is meaningless: the value holds still at the scene's designed resting moment and
 * every transform in the scene resolves to that one composed frame.
 *
 * The returned MotionValue is stable for the life of the scene (transforms built on it never need to
 * re-subscribe); it follows the scroll or holds still as the visitor's preference changes.
 */
import { useEffect } from 'react';
import { useMotionValue, useMotionValueEvent, type MotionValue } from 'motion/react';
import { useScene } from '@/film/Scene';
import { useResting } from './resting';

export function useStage(restAt: number): { p: MotionValue<number>; resting: boolean } {
  const { progress } = useScene();
  const resting = useResting();
  const p = useMotionValue(progress.get());
  useMotionValueEvent(progress, 'change', (v) => {
    if (!resting) p.set(v);
  });
  useEffect(() => {
    p.set(resting ? restAt : progress.get());
  }, [resting, restAt, p, progress]);
  return { p, resting };
}
