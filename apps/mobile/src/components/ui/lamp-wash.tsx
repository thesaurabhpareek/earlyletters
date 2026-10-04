// android: same (react-native-svg renders identically)
/**
 * LampWash: the website's lamp light, brought into the app as one soft,
 * static radial glow behind a screen's content.
 *
 * - One SVG RadialGradient, drawn once. No per-frame animation, no blur.
 * - Fades in once on mount via useMotion().fade. Under Reduce Motion it just
 *   renders at its final opacity (static).
 * - Decorative: pointer-events none, hidden from VoiceOver and TalkBack.
 * - Light mode is a whisper (peak 0.08) so every text pair stays at 4.5:1
 *   (verified in test/lamp-wash.test.ts). Dark mode is the website's amber.
 *
 * Place it as the first child of a screen's root View, behind content:
 *   <LampWash anchor="top" intensity={0.8} />
 *
 * Colours: pass `colors` from tokens (lamp, lampRose, lampDusk) once they
 * exist; the defaults in lamp-wash.logic.ts are the only literals.
 */
import { useEffect, useId } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useMotion } from '@/lib/motion';
import { ANCHORS, LAMP_DEFAULTS, STOPS, washOpacity, type LampAnchor, type LampTone } from './lamp-wash.logic';

interface Props {
  /** 0 to 1. Scales the whole wash. Default 1. */
  intensity?: number;
  /** Where the light sits. Default 'top'. */
  anchor?: LampAnchor;
  /** Default 'amber'. */
  tone?: LampTone;
  /** Override tone colours (hex), e.g. from tokens. */
  colors?: Partial<Record<LampTone, string>>;
}

export function LampWash({ intensity = 1, anchor = 'top', tone = 'amber', colors }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { reduced, fade } = useMotion();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const target = washOpacity(scheme, intensity);
  const color = colors?.[tone] ?? LAMP_DEFAULTS[tone];
  const a = ANCHORS[anchor];

  const o = useSharedValue(reduced ? target : 0);
  useEffect(() => {
    o.value = reduced ? target : fade(target);
    // fade is recreated each render but is a pure helper over `reduced`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx={a.cx} cy={a.cy} r={a.r} fx={a.cx} fy={a.cy}>
            {STOPS.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
