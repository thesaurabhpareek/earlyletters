// web: same (react-native-svg + Reanimated render on web) | android: same
/**
 * Lamp: the website's lamp light on the app's paper. One soft, warm radial pool behind a
 * screen, so paper feels lit by an evening lamp and dark mode keeps its warmth.
 *
 * Cost (D-065, 60 fps on older iPhones): one SVG RadialGradient drawn once, no blur, no
 * Skia, no new dependency. The only thing that moves is a wrapper's opacity, as a Reanimated
 * CSS animation (native, UI thread, no JS per frame; a real CSS animation on web), so the
 * gradient is never redrawn. Scaling the layer was tried and dropped: it cost frames.
 *
 * Calm, by rule (MOTION 5k):
 * - Arrives once over tokens.motion.lamp.arriveMs, then breathes its opacity by 12 percent over
 *   9 s. No flicker, no colour change, no scaling, nothing that reads as a flash.
 * - Reduce Motion: the final state, still. Increase Contrast: nothing (plain paper).
 * - Paused while the screen is not focused or the app is in the background.
 * - Decorative: ignores touches, hidden from VoiceOver and TalkBack.
 * - Never on a screen that records or plays a voice (MOTION principle 1).
 * - Peak opacity is capped by tokens so every text colour keeps 4.5:1 on the lit paper
 *   (packages/design-tokens/test/atmosphere.test.ts).
 *
 * Put it first in a screen's root, outside any ScrollView:  <Lamp anchor="top" />
 */
import { useIsFocused } from 'expo-router';
import { useEffect, useId, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING, useReducedMotion } from '@/lib/motion';
import { ANCHORS, STOPS, breathKeyframes, lampOpacity, shouldBreathe, type LampAnchor } from './lamp.logic';

const BREATH = breathKeyframes();

export function Lamp({ anchor = 'top', intensity = 1 }: { anchor?: LampAnchor; intensity?: number }) {
  const { scheme, highContrast } = useTheme();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  const peak = lampOpacity(scheme, intensity, highContrast);
  const visible = peak > 0;

  const arrive = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Arrival: a slow fade in, once. Under Reduce Motion the lamp is simply there.
  useEffect(() => {
    if (!visible) return;
    arrive.value = reduced ? 1 : withTiming(1, { duration: tokens.motion.lamp.arriveMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
  }, [visible, reduced, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  if (!visible) return null;
  const a = ANCHORS[anchor];
  // The loop is a native CSS-style animation (opacity only, no JS per frame). Reduce Motion: not set at all.
  const breath = reduced
    ? undefined
    : ({
        animationName: BREATH,
        animationDuration: tokens.motion.lamp.breathMs / 2,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-in-out',
        animationPlayState: shouldBreathe({ reduced, appActive, focused, visible }) ? 'running' : 'paused',
      } as const);
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      aria-hidden
      style={[StyleSheet.absoluteFill, arriveStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, breath]} shouldRasterizeIOS renderToHardwareTextureAndroid>
        <Svg width="100%" height="100%" preserveAspectRatio="none" style={{ opacity: peak }}>
          <Defs>
            <RadialGradient id={id} cx={a.cx} cy={a.cy} r={a.r} fx={a.cx} fy={a.cy}>
              {STOPS.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={tokens.atmosphere.lamp} stopOpacity={s.opacity} />
              ))}
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
