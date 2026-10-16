// web: same (Reanimated on web) | android: same
/**
 * Card to page (MOTION 5f, EXPERIENCE_PASS S26): a letter card grows into its page. The tapped card's rect
 * is measured into a small store; the page route is presented over the list (routeMotion 'cardToPage':
 * transparentModal, no native animation) and draws the growth itself: one paper surface goes from the card's
 * rect to the whole screen on `standard`, its corners from radius.md to 0, while the list behind dims to
 * tokens.motion.cardToPage.behindDim (no blur). The page's own content is never scaled: it fades in, full
 * size, from cardToPage.contentFrom of the way. Back reverses it while the card is still on screen, and
 * otherwise fades (200 ms), then calls onClosed (router.back()).
 * Reduce Motion, or no measured card (a deep link, a cold start): a 200 ms cross-fade.
 *
 *   // the Book
 *   <CardSource id={entry.id}><LetterCard ... onPress={() => router.push(...)} /></CardSource>
 *   // the letter route
 *   <CardToPage id={id} onClosed={() => router.back()}>{page}</CardToPage>
 *   const close = useCardToPageClose();   // inside the page: Back, swipe down, Android back
 *
 * Package P5 switches the letter route to this (ROUTE_MOVE['letter/[id]'] = 'cardToPage') when the page
 * mounts CardToPage; until then the letter keeps the native push. Pure parts: lib/transitions.logic.ts.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING, springConfig, useReducedMotion } from '@/lib/motion';
import { cardBackMove, cardToPageFrame, type Rect } from '@/lib/transitions.logic';

/** Where each card was when it was last touched, by id. In memory only, never stored. */
const rects = new Map<string, Rect>();

export const cardRects = {
  get: (id: string) => rects.get(id),
  set: (id: string, r: Rect) => void rects.set(id, r),
  forget: (id: string) => void rects.delete(id),
};

/** Wraps a card so its place on screen is known the moment a finger lands on it (before the press opens the page). */
export function CardSource({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  const remember = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) cardRects.set(id, { x, y, width, height });
    });
  }, [id]);
  return (
    <View ref={ref} collapsable={false} onTouchStart={remember} style={style}>
      {children}
    </View>
  );
}

const CloseContext = createContext<() => void>(() => {});

/** Inside a CardToPage: closes the page the way it came (shrink into the card, or fade). */
export function useCardToPageClose(): () => void {
  return useContext(CloseContext);
}

export function CardToPage({ id, onClosed, children }: { id: string; onClosed: () => void; children: ReactNode }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  // The card is measured on touch-down, asynchronously: give the measurement one frame to land before choosing
  // between growing from it and the plain fade.
  const [card, setCard] = useState(() => cardRects.get(id));
  const [decided, setDecided] = useState(() => !!card || reduced);
  const grows = !!card && !reduced;
  const p = useSharedValue(0);
  const fade = useSharedValue(0);
  // The rect the paper grows from lives in a shared value, not in the styles' closures, so the first frame of
  // the growth can never be drawn from a stale (full-screen) rect.
  const from = useSharedValue<Rect>(card ?? { x: 0, y: 0, width: screen.width, height: screen.height });
  const closing = useRef(false);

  useEffect(() => {
    if (decided) return;
    const frame = requestAnimationFrame(() => {
      const measured = cardRects.get(id);
      if (measured) from.value = measured;
      setCard(measured);
      setDecided(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [decided, id, from]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const done = () => onClosed();
    if (grows && cardBackMove(card, screen) === 'shrink') {
      p.value = withSpring(0, springConfig('standard'), (finished) => {
        if (finished) runOnJS(done)();
      });
    } else {
      fade.value = withTiming(0, { duration: tokens.motion.fadeMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) runOnJS(done)();
      });
    }
  }, [grows, card, screen, p, fade, onClosed]);

  const scrimAlpha = parseInt(c.scrim.slice(7, 9) || 'ff', 16) / 255;
  const behind = useAnimatedStyle(() => ({ opacity: (cardToPageFrame(from.value, screen, p.value).dim / scrimAlpha) * fade.value }));
  const paper = useAnimatedStyle(() => {
    const f = cardToPageFrame(from.value, screen, p.value);
    // The paper starts as the card's own surface and becomes the page's.
    const backgroundColor = interpolateColor(p.value, [0, 1], [c.surfaceRaised, c.bg]);
    return { left: f.x, top: f.y, width: f.width, height: f.height, borderRadius: f.radius, opacity: fade.value, backgroundColor };
  });
  // In the plain fade the paper covers the list first and the words come after, so two pages of words never overlap.
  const content = useAnimatedStyle(() => ({ opacity: cardToPageFrame(from.value, screen, p.value).contentOpacity * Math.max(0, fade.value * 2 - 1) }));

  // Started after the styles above are in place (effects run in order).
  useEffect(() => {
    if (!decided) return;
    if (grows) {
      fade.value = 1;
      p.value = withSpring(1, springConfig('standard'));
    } else {
      p.value = 1;
      fade.value = withTiming(1, { duration: tokens.motion.fadeMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
    }
  }, [decided, grows, p, fade]);

  return (
    <CloseContext.Provider value={close}>
      <View style={StyleSheet.absoluteFill}>
        {/* The list behind dims a little (a 4 percent ink scrim), never blurs. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, behind]} />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, paper]} />
        <Animated.View style={[StyleSheet.absoluteFill, content]}>{children}</Animated.View>
      </View>
    </CloseContext.Provider>
  );
}
