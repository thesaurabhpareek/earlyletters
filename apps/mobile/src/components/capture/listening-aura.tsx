// web: later (CSS radial gradient + AnalyserNode) | android: same
/**
 * ListeningAura (COMPONENTS.md 2.17, MOTION.md 5b): a soft glow behind the
 * mic disc that breathes with the voice. Motion only from a real signal;
 * after 600 ms of quiet an idle breath ramps in so a pause never looks broken.
 *
 * The gradient is drawn once (static SVG); only transform and opacity animate,
 * on the UI thread, in useFrameCallback using dt so 60 and 120 Hz match.
 * Reduce Motion: a static 2pt ring whose opacity steps 0.2/0.3/0.4, at most
 * one change per 400 ms, with 200 ms fades. Decorative for VoiceOver.
 */
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { FADE_MS } from '@/lib/motion';

export type AuraState = 'idle' | 'listening' | 'paused' | 'processing';

interface Props {
  state: AuraState;
  /** Recorder metering in dBFS (about -160 silent to 0 loud). */
  db: SharedValue<number>;
  reduced: boolean;
  size?: number;
}

/** Listening glow constants: one source, tokens.motion.breath (MOTION 5b). */
const B = tokens.motion.breath;
const BREATH_MS = tokens.motion.breathIdleMs;

export function ListeningAura({ state, db, reduced, size = 240 }: Props) {
  const { c } = useTheme();
  const disc = size / 2;

  const s = useSharedValue(0); // smoothed level 0..1
  const quietMs = useSharedValue(0);
  const idleW = useSharedValue(0); // idle-breath weight 0..1
  const t = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue<number>(B.opacityMin);
  const listening = useSharedValue(state === 'listening');
  const paused = useSharedValue(state === 'paused');
  const reducedSV = useSharedValue(reduced);
  useEffect(() => {
    listening.value = state === 'listening';
    paused.value = state === 'paused';
    reducedSV.value = reduced;
  }, [state, reduced, listening, paused, reducedSV]);

  useFrameCallback((f) => {
    'worklet';
    if (reducedSV.value) return;
    const dt = Math.min(f.timeSincePreviousFrame ?? 16, 64);
    t.value += dt;
    if (!listening.value) {
      // paused, idle, processing: settle to rest, no decorative loop.
      s.value += (0 - s.value) * (1 - Math.exp(-dt / B.releaseMs));
      scale.value = 1;
      opacity.value = paused.value ? 0.12 : B.opacityMin;
      return;
    }
    const a = Math.pow(Math.min(1, Math.max(0, (db.value - B.dbFloor) / (B.dbCeil - B.dbFloor))), B.gamma);
    const tau = a > s.value ? B.attackMs : B.releaseMs;
    s.value += (a - s.value) * (1 - Math.exp(-dt / tau));
    quietMs.value = s.value < 0.05 ? quietMs.value + dt : 0;
    const wTarget = quietMs.value > B.idleAfterMs ? 1 : 0;
    idleW.value += (wTarget - idleW.value) * Math.min(1, dt / 600);
    const breath = 0.5 - 0.5 * Math.cos((2 * Math.PI * t.value) / BREATH_MS);
    scale.value = Math.max(1 + B.scaleMax * s.value, 1 + B.idleScale * idleW.value * breath);
    opacity.value = B.opacityMin + (B.opacityMax - B.opacityMin) * Math.max(s.value, 0.4 * idleW.value * breath);
  });

  // Reduce Motion: stepped ring opacity, at most one change per 400 ms.
  const ringOpacity = useSharedValue(0.2);
  const lastStep = useSharedValue(0);
  useAnimatedReaction(
    () => (reduced && state === 'listening' ? db.value : null),
    (v) => {
      if (v === null) return;
      const a = Math.min(1, Math.max(0, (v - B.dbFloor) / (B.dbCeil - B.dbFloor)));
      const step = a > 0.5 ? 0.4 : a > 0.15 ? 0.3 : 0.2;
      const now = Date.now();
      if (step !== ringOpacity.value && now - lastStep.value > 400) {
        lastStep.value = now;
        ringOpacity.value = withTiming(step, { duration: FADE_MS, reduceMotion: ReduceMotion.Never });
      }
    },
  );

  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size * 1.2, height: size * 1.2, alignItems: 'center', justifyContent: 'center' }}>
      {reduced ? (
        <Animated.View
          style={[{ position: 'absolute', width: disc + 24, height: disc + 24, borderRadius: size, borderWidth: 2, borderColor: c.recording }, ringStyle]}
        />
      ) : (
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, glowStyle]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={c.recording} stopOpacity={1} />
                <Stop offset="0.5" stopColor={c.recording} stopOpacity={0.55} />
                <Stop offset="1" stopColor={c.recording} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#aura)" />
          </Svg>
        </Animated.View>
      )}
      <View
        style={{
          width: disc,
          height: disc,
          borderRadius: disc,
          backgroundColor: state === 'paused' ? c.surfaceRaised : c.recording,
          borderWidth: state === 'paused' ? 2 : 0,
          borderColor: c.recording,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MicrophoneIcon color={state === 'paused' ? c.recording : c.onAccent} size={44} weight={state === 'paused' ? 'regular' : 'fill'} />
      </View>
    </View>
  );
}
