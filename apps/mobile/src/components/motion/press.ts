// web: CSS transform on :active (later) | android: same
/**
 * Press feedback for every pressable surface (COMPONENTS 0.3): scale to 0.97 (controls)
 * or 0.98 (cards) on the `snappy` spring, starting from the current value so a quick
 * tap-release-tap never jumps (MOTION principle 4). Feedback lands on press-in, within
 * one frame. Reduce Motion: no scale; a 10% opacity dip instead, so the press is still seen.
 */
import { Pressable } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useReducedMotion } from '@/lib/motion';

const P = tokens.motion.press;
const S = tokens.motion.snappy;

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function usePressScale(kind: 'control' | 'card' = 'control', enabled: boolean = true) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const target = kind === 'card' ? P.cardScale : P.scale;

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return { opacity: 1 - (1 - P.opacity) * p.value, transform: [{ scale: 1 }] };
    return { opacity: 1, transform: [{ scale: 1 - (1 - target) * p.value }] };
  }, [reduced, target]);

  const go = (to: number) => {
    if (!enabled) return;
    p.value = reduced
      ? withTiming(to, { duration: 90, reduceMotion: ReduceMotion.Never })
      : withSpring(to, { stiffness: S.stiffness, damping: S.damping, mass: S.mass, reduceMotion: ReduceMotion.Never });
  };

  return { animatedStyle, onPressIn: () => go(1), onPressOut: () => go(0) };
}
