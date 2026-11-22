// web: CSS transform on :active (later) | android: same
/**
 * Press feedback for every pressable surface (COMPONENTS 0.3): scale to 0.97 (controls)
 * or 0.98 (cards) on the `snappy` spring, starting from the current value so a quick
 * tap-release-tap never jumps (MOTION principle 4). Feedback lands on press-in, within
 * one frame. Reduce Motion: no scale; a 10% opacity dip instead, so the press is still seen.
 *
 * A card inside a CardSource hands its press to the page that opens from it: CardToPage holds
 * the press through its hold (EXPERIENCE_PASS S26) and lets it go as the paper starts to grow,
 * and reads the press as it is, so the paper starts from the card exactly as pressed (MOTION 5f).
 */
import { createContext, useContext, useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useReducedMotion } from '@/lib/motion';

const P = tokens.motion.press;
const S = tokens.motion.snappy;

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A card's press, handed to its CardSource: `pressed` runs 0 (at rest) to 1 (pressed), `scale` is the card's scale at
 * a full press (1 under Reduce Motion, where the press is an opacity dip). `hold` keeps a press that is still showing
 * (a press already gone is not brought back) and makes the card's own release wait; `release` lets it go.
 */
export type PressHold = { pressed: SharedValue<number>; scale: number; hold: () => void; release: () => void };

/** Provided by CardSource (components/motion/card-transition.tsx): a card inside registers its press here. */
export const PressHoldContext = createContext<((hold: PressHold | null) => void) | null>(null);

export function usePressScale(kind: 'control' | 'card' = 'control', enabled: boolean = true) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const target = kind === 'card' ? P.cardScale : P.scale;
  const held = useRef(false);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return { opacity: 1 - (1 - P.opacity) * p.value, transform: [{ scale: 1 }] };
    return { opacity: 1, transform: [{ scale: 1 - (1 - target) * p.value }] };
  }, [reduced, target]);

  const animate = (to: number) => {
    p.value = reduced
      ? withTiming(to, { duration: 90, reduceMotion: ReduceMotion.Never })
      : withSpring(to, { stiffness: S.stiffness, damping: S.damping, mass: S.mass, reduceMotion: ReduceMotion.Never });
  };
  const go = (to: number) => {
    if (!enabled) return;
    // A press held by the page opening from this card is let go by that page, not by the finger.
    if (to === 0 && held.current) return;
    animate(to);
  };

  const register = useContext(PressHoldContext);
  useEffect(() => {
    if (kind !== 'card' || !enabled || !register) return;
    register({
      pressed: p,
      scale: reduced ? 1 : target,
      hold: () => {
        held.current = true;
        if (p.value > 0) animate(1);
      },
      release: () => {
        if (!held.current) return;
        held.current = false;
        animate(0);
      },
    });
    return () => {
      held.current = false;
      register(null);
    };
    // `animate` reads only `reduced` and `p`, both listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, enabled, register, reduced, target, p]);

  return { animatedStyle, onPressIn: () => go(1), onPressOut: () => go(0) };
}
