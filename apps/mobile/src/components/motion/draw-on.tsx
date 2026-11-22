// web: same (react-native-svg web) | android: same
/**
 * Lines that draw themselves once (MOTION 5h), then hold.
 *
 *   DrawOnPath     one path: strokeDashoffset from its length to 0 over tokens.motion.drawMs.
 *   DrawOnStrokes  a stroke table (components/ui/line-art.data.ts): every stroke draws in its own
 *                  window of the same drawMs, in the order a hand would draw it, the website's way.
 *
 * Reduce Motion, or `animate={false}`: drawn complete on the first frame. Lengths are measured offline
 * (getTotalLength) and passed in, so the pen starts on frame one. A stroke that has not started yet is
 * hidden, so its round cap never shows as a dot.
 */
import { useEffect } from 'react';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { Path, type PathProps } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { strokeProgress, type Stroke } from '@/components/ui/line-art.data';
import { useReducedMotion } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** A pen's ease: a slow start and a soft landing. */
const PEN = Easing.bezier(0.45, 0, 0.2, 1);

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
    offset.value = withDelay(delayMs, withTiming(0, { duration: durationMs, easing: PEN, reduceMotion: ReduceMotion.Never }));
  }, [still, length, delayMs, durationMs, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return <AnimatedPath d={d} strokeDasharray={[length, length]} animatedProps={animatedProps} {...rest} />;
}

type StrokesProps = Omit<PathProps, 'd' | 'strokeDasharray' | 'strokeDashoffset'> & {
  strokes: readonly Stroke[];
  animate?: boolean;
  delayMs?: number;
  durationMs?: number;
};

export function DrawOnStrokes({ strokes, animate = true, delayMs = 0, durationMs = tokens.motion.drawMs, ...rest }: StrokesProps) {
  const reduced = useReducedMotion();
  const still = !animate || reduced;
  const t = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(delayMs, withTiming(1, { duration: durationMs, easing: PEN, reduceMotion: ReduceMotion.Never }));
  }, [still, delayMs, durationMs, t]);

  return (
    <>
      {strokes.map((s) => (
        <StrokePath key={s.d} line={s} t={t} {...rest} />
      ))}
    </>
  );
}

function StrokePath({ line, t, ...rest }: { line: Stroke; t: SharedValue<number> } & Omit<PathProps, 'd' | 'strokeDasharray' | 'strokeDashoffset'>) {
  const { d, length } = line;
  const span = { from: line.from, to: line.to };
  const animatedProps = useAnimatedProps(() => {
    const p = strokeProgress(span, t.value);
    return { strokeDashoffset: length * (1 - p), strokeOpacity: p > 0.002 ? 1 : 0 };
  });
  return <AnimatedPath d={d} strokeDasharray={[length, length]} animatedProps={animatedProps} {...rest} />;
}
