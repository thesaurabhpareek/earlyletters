/**
 * useMotion(): the one place screens learn about Reduce Motion (MOTION.md 4).
 * useReducedMotion() only reads the value at start, so we also subscribe to
 * AccessibilityInfo changes. Fallback is a 200 ms fade, never a jump.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing, FadeIn, FadeInDown, ReduceMotion, withSpring, withTiming } from 'react-native-reanimated';
import type { MotionToken } from '@scribe/design-tokens';
import { EASING_POINTS, ENTER, FADE_MS, enterDelayMs, springParams } from './motion.values';

export { FADE_MS };
export const STANDARD_EASING = Easing.bezier(...EASING_POINTS);

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduced(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export function springConfig(token: MotionToken) {
  return { ...springParams(token), reduceMotion: ReduceMotion.System };
}

export function useMotion() {
  const reduced = useReducedMotion();
  return {
    reduced,
    /** Token name of the website's SMOOTH spring, for scrubs and glow follow: spring(v, soft). */
    soft: 'soft' as MotionToken,
    /** Spring to a value on a motion token; under Reduce Motion, a 200 ms fade-like timing. */
    spring: (to: number, token: MotionToken = 'standard') => {
      'worklet';
      return reduced
        ? withTiming(to, { duration: FADE_MS, reduceMotion: ReduceMotion.Never })
        : withSpring(to, springConfig(token));
    },
    fade: (to: number, duration: number = FADE_MS) => {
      'worklet';
      return withTiming(to, { duration, reduceMotion: ReduceMotion.Never });
    },
    /** Entering animation for content (never for controls; MOTION principle 2). */
    enter: (index = 0) =>
      reduced
        ? FadeIn.duration(FADE_MS).reduceMotion(ReduceMotion.Never)
        : FadeInDown.duration(ENTER.durationMs).delay(enterDelayMs(index)).easing(STANDARD_EASING),
  };
}
