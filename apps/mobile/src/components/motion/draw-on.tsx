// web: same (react-native-svg web) | android: same
/**
 * A single-weight line that draws itself once (MOTION 5h): strokeDashoffset from the
 * path length to 0 over tokens.motion.drawMs, then holds. Reduce Motion: drawn complete
 * on the first frame. Lengths are measured offline (getTotalLength) and passed in, so
 * the pen starts on frame one.
 */
import { useEffect } from 'react';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Path, type PathProps } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { useReducedMotion } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = Omit<PathProps, 'strokeDasharray' | 'strokeDashoffset'> & {
  d: string;
  length: number;
  /** false: render complete with no animation (repeat views, lists). */
  animate?: boolean;
  delayMs?: number;
  durationMs?: number;
};

export function DrawOnPath({ d, length, animate = true, delayMs = 0, durationMs = tokens.motion.drawMs, ...rest }: Props) {
  const reduced = useReducedMotion();
  const still = !animate || reduced;
  const offset = useSharedValue(still ? 0 : length);

  useEffect(() => {
    if (still) {
      offset.value = 0;
      return;
    }
    offset.value = length;
    offset.value = withDelay(delayMs, withTiming(0, { duration: durationMs, easing: Easing.bezier(0.45, 0, 0.2, 1), reduceMotion: ReduceMotion.Never }));
  }, [still, length, delayMs, durationMs, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return <AnimatedPath d={d} strokeDasharray={[length, length]} animatedProps={animatedProps} {...rest} />;
}
