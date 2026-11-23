// web: CSS animation (later) | android: same
/**
 * Breathe (MOTION 5j): one decorative element breathes opacity 0.85 to 1 over 8 s,
 * Calm's slowest pace. Only while visible and the app is active, and for at most
 * tokens.motion.loopCapMs (30 s), then it rests at full opacity; off under Reduce Motion. Never wraps text or controls (they stay static).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { loopReps } from '@/lib/loop.logic';
import { curve, useReducedMotion } from '@/lib/motion';

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
    // Ends by itself at full opacity after tokens.motion.loopCapMs (an even count of one-way runs); a new run
    // (focus, active again, Reduce Motion off) starts a new cap.
    o.value = withRepeat(withTiming(0.85, { duration: half, easing: curve('breath'), reduceMotion: ReduceMotion.Never }), loopReps(tokens.motion.emptyBreathMs), true);
    return () => cancelAnimation(o);
  }, [run, o]);

  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
