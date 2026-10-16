// web: same (Reanimated on web) | android: same
/**
 * Card to page (MOTION 5f, EXPERIENCE_PASS S26): a letter card grows into its page, and its words never leave.
 *
 * The card's own words (its dateline and opening lines) are the shared element. They are laid out once, at the
 * page's column, and carried from where they sat on the card to where they sit on the page while one paper surface
 * grows from the card's rect to the whole screen on `standard` (its corners from radius.md to 0, its colour from the
 * card's surface to the page's). Only the rest of the words cross-fade in below them, from cardToPage.contentFrom of
 * the way, never past the paper's edge; the rest of the page fades in with them. The list behind dims to
 * tokens.motion.cardToPage.behindDim (no blur). Nothing is scaled, and no frame shows an empty card or page.
 * Back carries the words back into the card while it is still on screen; otherwise the whole page fades (200 ms).
 *
 *   // the Book: the card's dateline and excerpt in CardText
 *   <CardSource id={entry.id}>
 *     <LetterCard onPress={() => router.push(...)}>
 *       <CardText fade={{ lineHeight }}>{dateline}<ExcerptFade lines={2} ... /></CardText>
 *     </LetterCard>
 *   </CardSource>
 *   // the letter route: the same dateline and the whole letter as `opening`, placed by PageOpening
 *   <CardToPage id={id} opening={<Opening entry={entry} />} onClosed={() => router.back()}>
 *     <ScrollView>... <PageOpening /> ...</ScrollView>
 *   </CardToPage>
 *   const close = useCardToPageClose();   // inside the page: Back, swipe down, Android back
 *
 * The contract that keeps the words still: the page's opening block uses the card's text column (the same width,
 * the same type and gaps), so its first lines wrap exactly as the card's did. Without it (or a measured card, or
 * under Reduce Motion) the page cross-fades in whole over 200 ms: paper and words together, never an empty page.
 *
 * Package P5 switches the letter route to this (ROUTES['letter/[id]'] = 'cardToPage') when the page mounts
 * CardToPage; until then the letter keeps the native push. Pure parts: lib/transitions.logic.ts.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING, springConfig, useReducedMotion } from '@/lib/motion';
import { canCarry, cardBackMove, cardToPageFrame, carryFrame, type Rect } from '@/lib/transitions.logic';
import { FadeEdge } from './excerpt-fade';
import { FADE_FRACTION } from './excerpt-fade.logic';

/** The card's last line fades into its surface (ExcerptFade): its height, and whether the line ends on the left. */
export type CardFade = { lineHeight: number; rtl?: boolean };
type Remembered = { card: Rect; text?: Rect; fade?: CardFade };

/** Where each card and its words were when it was last touched, by id. In memory only, never stored. */
const rects = new Map<string, Remembered>();

export const cardRects = {
  get: (id: string) => rects.get(id),
  set: (id: string, r: Remembered) => void rects.set(id, r),
  forget: (id: string) => void rects.delete(id),
};

const measure = (v: View | null) =>
  new Promise<Rect | undefined>((resolve) => {
    if (!v) return resolve(undefined);
    v.measureInWindow((x, y, width, height) => resolve(width > 0 && height > 0 ? { x, y, width, height } : undefined));
  });

type TextSlot = { ref: RefObject<View | null>; fade?: CardFade };
const CardSourceContext = createContext<((slot: TextSlot | null) => void) | null>(null);

/** Wraps a card so its place on screen (and its words' place) is known the moment a finger lands on it. */
export function CardSource({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  const text = useRef<TextSlot | null>(null);
  const remember = useCallback(() => {
    void Promise.all([measure(ref.current), measure(text.current?.ref.current ?? null)]).then(([card, words]) => {
      if (card) cardRects.set(id, { card, text: words, fade: text.current?.fade });
    });
  }, [id]);
  const register = useCallback((slot: TextSlot | null) => void (text.current = slot), []);
  return (
    <CardSourceContext.Provider value={register}>
      <View ref={ref} collapsable={false} onTouchStart={remember} style={style}>
        {children}
      </View>
    </CardSourceContext.Provider>
  );
}

/** The card's words that the page shares: its dateline and its excerpt. `fade` when the excerpt ends in a fade. */
export function CardText({ children, fade, style }: { children: ReactNode; fade?: CardFade; style?: StyleProp<ViewStyle> }) {
  const register = useContext(CardSourceContext);
  const ref = useRef<View>(null);
  useEffect(() => {
    register?.({ ref, fade });
    return () => register?.(null);
  }, [register, fade]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

type PageContext = { close: () => void; opening: ReactNode; hidden: boolean; place: (v: View | null) => void };
const CardPageContext = createContext<PageContext>({ close: () => {}, opening: null, hidden: false, place: () => {} });

/** Inside a CardToPage: closes the page the way it came (the words back into the card, or a fade). */
export function useCardToPageClose(): () => void {
  return useContext(CardPageContext).close;
}

/** Where the page's opening block (the `opening` given to CardToPage) sits in the page's own layout. */
export function PageOpening({ style }: { style?: StyleProp<ViewStyle> }) {
  const { opening, hidden, place } = useContext(CardPageContext);
  const ref = useRef<View>(null);
  return (
    <View ref={ref} collapsable={false} onLayout={() => place(ref.current)} style={[style, hidden && { opacity: 0 }]}>
      {opening}
    </View>
  );
}

type Phase = 'measuring' | 'moving' | 'settled';
/** Frames to wait for the card's and the page's measurements before choosing the plain fade instead. */
const MEASURE_FRAMES = 4;

export function CardToPage({ id, opening, onClosed, children }: { id: string; opening: ReactNode; onClosed: () => void; children: ReactNode }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  const full: Rect = { x: 0, y: 0, width: screen.width, height: screen.height };

  const [phase, setPhase] = useState<Phase>('measuring');
  const [carry, setCarry] = useState(false);
  const remembered = useRef<Remembered | undefined>(cardRects.get(id));
  const pageView = useRef<View | null>(null);
  const pageRect = useRef<Rect | undefined>(undefined);
  const closing = useRef(false);

  const p = useSharedValue(0);
  const fade = useSharedValue(0);
  const carrying = useSharedValue(0);
  const from = useSharedValue<Rect>(full);
  const ct = useSharedValue<Rect>(full);
  const pt = useSharedValue<Rect>(full);

  const place = useCallback((v: View | null) => {
    pageView.current = v;
    void measure(v).then((r) => {
      if (r) pageRect.current = r;
    });
  }, []);

  // The card is measured on touch-down and the page's opening on its first layout, both asynchronously: give them a
  // few frames to land, then carry the words if the card and the page share a column, or cross-fade the whole page.
  useEffect(() => {
    if (phase !== 'measuring') return;
    let frames = 0;
    let raf = 0;
    const decide = () => {
      const r = cardRects.get(id) ?? remembered.current;
      const ready = !!r?.card && !!pageRect.current;
      if (!reduced && !ready && frames++ < MEASURE_FRAMES) {
        raf = requestAnimationFrame(decide);
        return;
      }
      remembered.current = r;
      const ok = !reduced && !!r && canCarry(r.text, pageRect.current);
      if (ok) {
        from.value = r!.card;
        ct.value = r!.text!;
        pt.value = pageRect.current!;
        carrying.value = 1;
      }
      setCarry(ok);
      setPhase('moving');
    };
    raf = requestAnimationFrame(decide);
    return () => cancelAnimationFrame(raf);
  }, [phase, id, reduced, from, ct, pt, carrying]);

  const scrimAlpha = parseInt(c.scrim.slice(7, 9) || 'ff', 16) / 255;
  const behind = useAnimatedStyle(() => ({ opacity: (cardToPageFrame(from.value, screen, p.value).dim / scrimAlpha) * fade.value }));
  const paper = useAnimatedStyle(() => {
    const f = cardToPageFrame(from.value, screen, p.value);
    // The paper is the card's own surface until the rest of the words arrive, then becomes the page's (so the card's
    // fade over its last line, drawn in that surface, always matches the paper under it).
    const backgroundColor = interpolateColor(p.value, [0, tokens.motion.cardToPage.contentFrom, 1], [c.surfaceRaised, c.surfaceRaised, c.bg]);
    return { left: f.x, top: f.y, width: f.width, height: f.height, borderRadius: f.radius, opacity: fade.value, backgroundColor };
  });
  // Carried: the rest of the page arrives with the rest of the words. Faded: the whole page at once, paper and words.
  const content = useAnimatedStyle(() => ({ opacity: carrying.value ? cardToPageFrame(from.value, screen, p.value).contentOpacity : fade.value }));
  const block = useAnimatedStyle(() => {
    const k = carryFrame(from.value, ct.value, pt.value, screen, p.value);
    return { left: k.x, top: k.y, width: pt.value.width };
  });
  const excerptBox = useAnimatedStyle(() => ({ height: ct.value.height }));
  const extraBox = useAnimatedStyle(() => {
    const k = carryFrame(from.value, ct.value, pt.value, screen, p.value);
    return { top: k.excerpt, height: k.extra, opacity: k.extraOpacity };
  });
  const extraInner = useAnimatedStyle(() => ({ top: -ct.value.height }));
  const cardFade = useAnimatedStyle(() => ({ opacity: carryFrame(from.value, ct.value, pt.value, screen, p.value).cardFade }));

  // Started once the choice is made, after the styles above are in place (effects run in order).
  useEffect(() => {
    if (phase !== 'moving' || closing.current) return;
    const settle = (done?: boolean) => {
      if (done) setPhase('settled');
    };
    if (carry) {
      fade.value = 1;
      p.value = withSpring(1, springConfig('standard'), (done) => runOnJS(settle)(done));
    } else {
      p.value = 1;
      fade.value = withTiming(1, { duration: tokens.motion.fadeMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => runOnJS(settle)(done));
    }
  }, [phase, carry, p, fade]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const done = () => onClosed();
    const fadeOut = () => {
      carrying.value = 0;
      setCarry(false);
      fade.value = withTiming(0, { duration: tokens.motion.fadeMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) runOnJS(done)();
      });
    };
    const r = remembered.current;
    if (!carry || reduced || !r || cardBackMove(r.card, screen) !== 'shrink') return fadeOut();
    // The page may have scrolled: find its opening again, and carry the words back only if they share the column.
    void measure(pageView.current).then((now) => {
      if (!now || !canCarry(r.text, now) || now.y + now.height < 0 || now.y > screen.height) return fadeOut();
      pt.value = now;
      setPhase('moving');
      p.value = withSpring(0, springConfig('standard'), (finished) => {
        if (finished) runOnJS(done)();
      });
    });
  }, [carry, reduced, screen, onClosed, p, fade, pt, carrying]);

  const fadeInfo = remembered.current?.fade;
  const showCarry = carry && phase === 'moving';
  const ctx = useMemo<PageContext>(() => ({ close, opening, hidden: phase !== 'settled' && (carry || phase === 'measuring'), place }), [close, opening, phase, carry, place]);

  return (
    <CardPageContext.Provider value={ctx}>
      <View style={StyleSheet.absoluteFill}>
        {/* The list behind dims a little (a 4 percent ink scrim), never blurs. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, behind]} />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, paper]} />
        <Animated.View style={[StyleSheet.absoluteFill, content]}>{children}</Animated.View>
        {showCarry ? (
          <Animated.View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={[{ position: 'absolute' }, block]}>
            {/* The card's own words: always there, carried whole. */}
            <Animated.View style={[{ overflow: 'hidden' }, excerptBox]}>
              {opening}
              {fadeInfo ? (
                <Animated.View style={[fadeEdgeBox(fadeInfo), cardFade]}>
                  <FadeEdge color={c.surfaceRaised} side={fadeInfo.rtl ? 'left' : 'right'} style={StyleSheet.absoluteFill} />
                </Animated.View>
              ) : null}
            </Animated.View>
            {/* The rest of the letter, below them: cross-fades in, and never draws past the paper. */}
            <Animated.View style={[{ position: 'absolute', left: 0, right: 0, overflow: 'hidden' }, extraBox]}>
              <Animated.View style={[{ position: 'absolute', left: 0, right: 0 }, extraInner]}>{opening}</Animated.View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    </CardPageContext.Provider>
  );
}

/** The card's fade over the end of its last line, at the bottom of the carried excerpt. */
function fadeEdgeBox(f: CardFade): ViewStyle {
  return { position: 'absolute', bottom: 0, height: f.lineHeight, width: `${FADE_FRACTION * 100}%`, [f.rtl ? 'left' : 'right']: 0 };
}
