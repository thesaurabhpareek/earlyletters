'use client';
/**
 * Owner: ACT3. The progress an ACT3 scene animates from.
 * Normally the scene's scroll progress. With reduced motion the stage does not pin (Scene.module.css),
 * so scroll progress is meaningless: we hold a still MotionValue at the scene's designed resting
 * moment instead, and every transform in the scene resolves to that one composed frame.
 */
import { useMotionValue, type MotionValue } from 'motion/react';
import { useScene } from '@/film/Scene';
import { useResting } from './resting';

export function useStage(restAt: number): { p: MotionValue<number>; resting: boolean } {
  const { progress } = useScene();
  const resting = useResting();
  const still = useMotionValue(restAt);
  return { p: resting ? still : progress, resting };
}
