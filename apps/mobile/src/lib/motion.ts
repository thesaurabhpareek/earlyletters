/**
 * useMotion(): the one place screens learn about Reduce Motion (MOTION.md 4).
 * Every duration, spring and distance comes from tokens.motion; nothing is typed here.
 *
 * Reduce Motion rule: movement is replaced by a paired 200 ms fade (ReduceMotion.Never on
 * the fade), never a jump on content that carries meaning. Pure decoration simply does
 * not run. Reanimated's useReducedMotion() reads the value once at start, so we also
 * subscribe to AccessibilityInfo changes (MOTION 4, M15, M16).
 */
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  ReduceMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tokens, type MotionToken } from '@scribe/design-tokens';

const M = tokens.motion;

export const FADE_MS = M.fadeMs;
export const EXIT_MS = M.exitMs;
export const STANDARD_EASING = Easing.bezier(...M.easing);

let current = false;
const listeners = new Set<(v: boolean) => void>();
let subscribed = false;

function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => set(v))
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', set);
}
function set(v: boolean) {
  if (v === current) return;
  current = v;
  listeners.forEach((l) => l(v));
}

/** Live Reduce Motion value (one shared subscription for the whole app). */
export function useReducedMotion(): boolean {
  ensureSubscribed();
  const [reduced, setReduced] = useState(current);
  useEffect(() => {
    listeners.add(setReduced);
    setReduced(current);
    return () => {
      listeners.delete(setReduced);
    };
  }, []);
  return reduced;
}

/** Synchronous read for non-React code (haptics, imperative toasts). */
export function isReducedMotion(): boolean {
  ensureSubscribed();
  return current;
}

export function springConfig(token: MotionToken) {
  const s = M[token];
  return { stiffness: s.stiffness, damping: s.damping, mass: s.mass, reduceMotion: ReduceMotion.System };
}

/** Layout transition on a spring token (cards reflowing, an inline card opening). */
export function layoutSpring(token: MotionToken = 'standard') {
  const s = M[token];
  return LinearTransition.springify().stiffness(s.stiffness).damping(s.damping).mass(s.mass);
}

export function useMotion() {
  const reduced = useReducedMotion();
  return useMemo(
    () => ({
      reduced,
      /** Spring to a value on a motion token; under Reduce Motion, a 200 ms timing instead. Worklet-safe. */
      spring: (to: number, token: MotionToken = 'standard') => {
        'worklet';
        const s = M[token];
        return reduced
          ? withTiming(to, { duration: M.fadeMs, reduceMotion: ReduceMotion.Never })
          : withSpring(to, { stiffness: s.stiffness, damping: s.damping, mass: s.mass, reduceMotion: ReduceMotion.System });
      },
      /** Opacity timing that always runs (it is the Reduce Motion fallback itself). */
      fade: (to: number, duration: number = M.fadeMs) => {
        'worklet';
        return withTiming(to, { duration, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
      },
      /**
       * Entering animation for content, never for controls (MOTION principle 2):
       * opacity 0 to 1, y 8 to 0, 280 ms, staggered 30 ms for the first 6 items.
       * Items beyond the stagger window get no entrance at all.
       */
      enter: (index = 0) => {
        if (index >= M.staggerMax) return undefined;
        if (reduced) return FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never);
        const base = FadeInDown.duration(M.enter.durationMs).delay(index * M.staggerMs).easing(STANDARD_EASING);
        // Web (preview): Reanimated 4.5.1 pins elements with custom initial values to
        // position:absolute after the animation (layoutReanimation/web componentUtils
        // setElementAnimation -> setElementPosition), so web keeps the stock preset.
        return Platform.OS === 'web' ? base : base.withInitialValues({ opacity: 0, transform: [{ translateY: M.enter.dy }] });
      },
      /** Exit for transient UI (toast, inline card): quicker than the entry. */
      exit: () =>
        reduced
          ? FadeOut.duration(M.fadeMs).reduceMotion(ReduceMotion.Never)
          : FadeOutDown.duration(M.exitMs).easing(STANDARD_EASING),
      /** Layout reflow; undefined under Reduce Motion (an instant reflow beats a fake fade). */
      layout: (token: MotionToken = 'standard') => (reduced ? undefined : layoutSpring(token)),
    }),
    [reduced],
  );
}

export type Motion = ReturnType<typeof useMotion>;
