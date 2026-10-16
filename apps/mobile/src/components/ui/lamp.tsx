// web: same (react-native-svg + Reanimated render on web) | android: same
/**
 * Lamp: the website's lamp light on the app's paper. One soft, warm radial pool behind a
 * screen, so paper feels lit by an evening lamp and dark mode keeps its warmth.
 *
 *   <Lamp scene="tonight" daypart={greetingKey()} persistKey="tabs" />   Tonight, tinted by the time of day
 *   <Lamp scene="welcome" persistKey="firstRun" />                       first run: one light through every step
 *   <LampView scene="gate" persistKey="firstRun" />                      outside a navigator (the age gate)
 *   useUnlitRoom()                                                        in Listen, Review, Read together, a letter
 *
 * Scenes, tones and peaks are tokens.atmosphere (EXPERIENCE_PASS 5.1, 5.2; MOTION 5k). Without a
 * scene it is #99's warm pool (gold into amber, breathing), so screens that have not moved to
 * scenes yet keep their light.
 *
 * Cost (D-065, 60 fps on older iPhones): each light is one SVG RadialGradient drawn once, no blur,
 * no Skia, no new dependency. Only opacity moves: a layer's opacity carries the intensity (it
 * arrives, rises and dims over tokens.motion.lamp.arriveMs on M3 easing), and one wrapper carries the
 * breath as a Reanimated CSS animation (native, UI thread, no JS per frame; a real CSS animation on
 * web). A change of scene that moves the pool (the gate's centred light to the welcome's top light)
 * cross-fades two layers; the paper is never unlit in between.
 *
 * Calm, by rule (MOTION 5k):
 * - Breathes only where the scene says (welcome, finish, Tonight): opacity down 12 percent and back
 *   over 9 s. No flicker, no colour drift, no scaling, nothing that reads as a flash.
 * - The lamp never cuts between rooms (EXPERIENCE_PASS 5.8). Only the first lit room after a cold launch
 *   arrives slowly (arriveMs); every later lamp comes up as a return (returnMs), unless it asks to
 *   `arrive`. persistKey "firstRun" keeps one light from the gate through onboarding; "tabs" lets the
 *   arriving tab start at the light the last tab left and settle to its own over returnMs. An unlit room
 *   over a lit one (useUnlitRoom: Listen, Review, Read together, the letter page) fades every lamp
 *   underneath over leaveMs and brings it back over returnMs. Under a sheet the room keeps its light and
 *   pauses its breath.
 * - Reduce Motion: no arrival, no rise, no breath: the final state, still.
 * - Increase Contrast and Reduce Transparency: nothing (plain paper).
 * - Paused while the screen is not focused or the app is in the background. (Low Power Mode is not
 *   read: that needs expo-battery, a new dependency; the loop is one native opacity animation.)
 * - Decorative: ignores touches, hidden from VoiceOver and TalkBack.
 * - Never on a screen that records or plays a voice, sells, or reports a problem (EXPERIENCE_PASS 5.2).
 * - Peaks are capped by tokens so every text colour keeps 4.5:1 on the lit paper
 *   (packages/design-tokens/test/atmosphere.test.ts; the whole gradient in apps/mobile/test/lamp.test.ts).
 *
 * Put it first in a screen's root, outside any ScrollView.
 */
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, StyleSheet } from 'react-native';
import Animated, { ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { tokens, type ColorScheme } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { greetingKey } from '@/lib/copy';
import { STANDARD_EASING, useReducedMotion } from '@/lib/motion';
import {
  ANCHORS,
  breathKeyframes,
  coverTarget,
  geometryKey,
  lampAllowed,
  lampMemory,
  lampRooms,
  lampStops,
  planLampMount,
  resolveLamp,
  shouldBreathe,
  type LampInput,
  type LampKey,
  type LampLayerPlan,
} from './lamp.logic';

export type { LampAnchor, LampKey } from './lamp.logic';

const BREATH = breathKeyframes();
const NEEDS_DAYPART = new Set(['tonight', 'readTogether']);

export type LampProps = LampInput & {
  /**
   * Lamps that share a key share one light this session: "firstRun" (the gate and onboarding) and "tabs" (Tonight,
   * the Book and the Family tab, which settle from one tab's light to the next over returnMs).
   */
  persistKey?: LampKey;
  /** Come up slowly (arriveMs) even later in the session: Read together's dusk pool, the second parent's first Book. */
  arrive?: boolean;
};

/** Screen-level lamp: the breath pauses while its screen is not focused. */
export function Lamp(props: LampProps) {
  return <LampView {...props} focused={useIsFocused()} />;
}

/**
 * For a screen with no lamp that covers a lit one (Listen, Review, Read together, the letter page): while it is
 * focused, every lamp underneath eases to 0 over leaveMs, and comes back over returnMs when it leaves
 * (EXPERIENCE_PASS 5.8 rule 1). Sheets and Settings pushes do not call it: their room keeps its light.
 */
export function useUnlitRoom(): void {
  const focused = useIsFocused();
  useEffect(() => (focused ? lampRooms.coverUnlit() : undefined), [focused]);
}

/** For a sheet over a room (ui/sheet.tsx): while it is up, the room keeps its light and pauses its breath. */
export function holdLampBreathForSheet(): () => void {
  return lampRooms.openSheet();
}

function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

type Layer = LampLayerPlan & { id: number };

/** The same light without reading navigation, for a place outside a navigator (the age gate renders before the router). */
export function LampView({ persistKey, arrive, focused = true, ...input }: LampProps & { focused?: boolean }) {
  const { scheme, highContrast, reduceTransparency } = useTheme();
  const reduced = useReducedMotion();
  const appActive = useAppActive();
  const daypart = input.daypart ?? (input.scene && NEEDS_DAYPART.has(input.scene) ? greetingKey() : undefined);
  const light = resolveLamp({ ...input, daypart });
  const key = light ? geometryKey(light) : null;
  const level = light?.intensity ?? 0;

  const nextId = useRef(0);
  const [layers, setLayers] = useState<Layer[]>(() =>
    planLampMount(lampMemory.get(persistKey), light, reduced, { key: persistKey, firstOfSession: lampMemory.firstOfSession(), arrive }).map((p) => ({
      ...p,
      id: nextId.current++,
    })),
  );

  // An unlit room over this one (not the room this lamp is in): the light leaves, and returns when it goes.
  const rooms = useSyncExternalStore(lampRooms.subscribe, lampRooms.get, lampRooms.get);
  const covered = rooms.covered && !focused;
  const cover = useSharedValue(covered ? 0 : 1);
  useEffect(() => {
    const t = coverTarget(covered, reduced);
    cover.value = t.ms === 0 ? t.to : withTiming(t.to, { duration: t.ms, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
  }, [covered, reduced, cover]);
  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));

  // A new scene or level after mount: rise or dim the current light, or cross-fade to a new one.
  const first = useRef(true);
  useEffect(() => {
    lampMemory.set(persistKey, light, lampMemory.get(persistKey));
    if (first.current) {
      first.current = false;
      return;
    }
    // Inside one room every change of light is the slow one (rise, dim, a new scene: arriveMs).
    const ms = tokens.motion.lamp.arriveMs;
    setLayers((prev) => {
      const current = prev[prev.length - 1];
      if (!light) return prev.map((l) => ({ ...l, to: 0, ms }));
      if (current && geometryKey(current.light) === key) return prev.map((l) => (l === current ? { ...l, to: level, ms } : { ...l, to: 0, ms }));
      const settled = prev.map((l) => ({ ...l, to: 0, ms }));
      return [...settled, { light: { anchor: light.anchor, core: light.core, tail: light.tail }, from: 0, to: level, ms, id: nextId.current++ }];
    });
    // `light` is derived from key and level; they are the whole identity of the change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, level, persistKey]);

  // A layer that has faded out is dropped; the last one stays (at 0 it draws nothing and keeps its place for a rise).
  const gone = useCallback((id: number) => setLayers((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev)), []);

  // The breath is attached once a breathing scene has been shown and is then only paused, so a change to a
  // still scene never snaps the light back up. Under Reduce Motion it is never attached.
  const breathes = !!light?.breathe && !reduced;
  const [breathed, setBreathed] = useState(breathes);
  useEffect(() => {
    if (reduced) setBreathed(false);
    else if (breathes) setBreathed(true);
  }, [reduced, breathes]);

  if (!lampAllowed({ highContrast, reduceTransparency }) || layers.length === 0) return null;
  const running = shouldBreathe({ reduced, appActive, focused, visible: !!light, breathe: !!light?.breathe, sheetUp: rooms.sheetUp });
  const breath = breathed && !reduced
    ? ({
        animationName: BREATH,
        animationDuration: tokens.motion.lamp.breathMs / 2,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-in-out',
        animationPlayState: running ? 'running' : 'paused',
      } as const)
    : undefined;

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      aria-hidden
      style={[StyleSheet.absoluteFill, coverStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, breath]} shouldRasterizeIOS renderToHardwareTextureAndroid>
        {layers.map((l) => (
          <LampLayer key={l.id} layer={l} scheme={scheme} reduced={reduced} onGone={gone} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

/** One gradient, drawn once. Its wrapper's opacity is the light's level. */
function LampLayer({ layer, scheme, reduced, onGone }: { layer: Layer; scheme: ColorScheme; reduced: boolean; onGone: (id: number) => void }) {
  const id = `lamp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const o = useSharedValue(reduced ? layer.to : layer.from);
  const { to, ms, id: layerId } = layer;

  useEffect(() => {
    if (reduced || ms === 0) {
      o.value = to;
      if (to === 0) onGone(layerId);
      return;
    }
    o.value = withTiming(to, { duration: ms, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => {
      if (done && to === 0) runOnJS(onGone)(layerId);
    });
  }, [to, ms, reduced, o, layerId, onGone]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  const a = ANCHORS[layer.light.anchor];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx={a.cx} cy={a.cy} r={a.r} fx={a.cx} fy={a.cy}>
            {lampStops(layer.light, scheme).map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
