// web: CSS animation (later) | android: same
/**
 * Breathe (MOTION 5j): one decorative element breathes opacity 0.85 to 1 over 8 s,
 * Calm's slowest pace. Only while visible and the app is active; off under Reduce
 * Motion. Never wraps text or controls (they stay static).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useReducedMotion } from '@/lib/motion';

export function Breathe({ children, paused = false, style }: { children: ReactNode; paused?: boolean; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const o = useSharedValue(1);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const run = active && !paused && !reduced;
  useEffect(() => {
    if (!run) {
      cancelAnimation(o);
      o.value = 1;
      return;
    }
    const half = tokens.motion.emptyBreathMs / 2;
    o.value = withRepeat(withTiming(0.85, { duration: half, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }), -1, true);
    return () => cancelAnimation(o);
  }, [run, o]);

  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
