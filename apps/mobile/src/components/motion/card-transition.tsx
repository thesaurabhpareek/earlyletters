// web: same (Reanimated on web) | android: same
/**
 * Card to page (MOTION 5f, EXPERIENCE_PASS S26): a letter card grows into its page, and its words never leave.
 *
 * The card's own words (its dateline and opening lines) are the shared element. They are laid out once, at the
 * page's column, and carried from where they sat on the card to where they sit on the page while one paper surface
 * grows from the card's rect to the whole screen on `standard` (its corners from radius.md to 0, its colour from the
 * card's surface to the page's). Only the rest of the words cross-fade in below them, from cardToPage.contentFrom of
 * the way, never past the paper's edge; the rest of the page fades in with them. Nothing is scaled, and no frame
 * shows an empty card or page. Back carries the words back into the card while it is still on screen; otherwise the
 * whole page fades (200 ms).
 *
 * The Book leaves the way its lamp leaves a lit room (EXPERIENCE_PASS 5.8 rule 1): a veil of the page's paper, one
 * full-screen layer, comes up over lamp.leaveMs on a straight line while the card holds (cardToPage.holdMs), then the
 * paper grows; by the time its edge can reach another line of the Book the Book is 95 percent gone, so no edge cuts a
 * legible line and nothing blinks. On the way back the veil stays until the paper is within cardToPage.clearPt of the
 * card, then lifts over lamp.returnMs (CARD_TO_PAGE, clearProgress). The paper over the card comes and goes with the
 * veil, so the rest of the card (its signature, Private, its length) leaves with the Book and comes back with it.
 * The card's fade over its last line is gone before the paper turns to the page's colour (paperTone), so it never
 * shows as a patch of the card's surface on the page.
 *
 *   // the Book: the card's dateline and excerpt in CardText; the list hides from screen readers under a page
 *   const behind = useHiddenBehindCardPage();
 *   <FlatList {...behind} ... />
 *   <CardSource id={entry.id}>
 *     <LetterCard onPress={() => router.push(...)}>
 *       <CardText lineHeight={lineHeightFor('letterBody', fontScale)}>{dateline}<ExcerptFade lines={2} ... /></CardText>
 *     </LetterCard>
 *   </CardSource>
 *   // the letter route: the same dateline and the whole letter as `opening`, placed by PageOpening
 *   <CardToPage id={id} opening={(focus) => <Opening entry={entry} focusRef={focus} />} onClosed={() => router.back()}>
 *     <ScrollView>... <PageOpening lineHeight={lineHeightFor('letterBody', fontScale)} /> ...</ScrollView>
 *   </CardToPage>
 *   const close = useCardToPageClose();   // inside the page: Back, swipe down, Android back
 *   const { carried, home } = useCardToPagePhase();   // inside the page: the rest waits until the words are home
 *
 * The contract that keeps the words still: the page's opening block uses the card's text column and type (the same
 * width, line height and gaps), so its first lines wrap exactly as the card's did. Without it (a page at a larger
 * Reading Size than the card, say), without a measured card, or under Reduce Motion, nothing moves: inside one 200 ms
 * fade the Book goes under the same veil and the page fades in whole after it, a hand-off both ways (paper and words
 * together, never an empty page, and never two screens of words on top of each other at strength).
 *
 * Screen readers read the letter once and land on the page: while the page is up it is modal
 * (accessibilityViewIsModal, aria-modal) and the screen behind is hidden (useHiddenBehindCardPage: a transparent
 * modal from react-native-screens does not hide the presenting screen by itself); the carried copies are hidden; the
 * page's own opening is hidden until the move settles, and then VoiceOver and TalkBack focus move to the element
 * the page gave `focus` (its dateline or heading).
 *
 * Package P5 switches the letter route to this (ROUTES['letter/[id]'] = 'cardToPage') when the page mounts
 * CardToPage; until then the letter keeps the native push. Pure parts: lib/transitions.logic.ts.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFocusOnMount, useTheme } from '@/lib/a11y';
import { springConfig, useReducedMotion } from '@/lib/motion';
import {
  CARD_TO_PAGE,
  canCarry,
  cardBackMove,
  cardPages,
  cardToPageFrame,
  cardWasCut,
  carriedHome,
  carryFrame,
  clearProgress,
  hiddenBehind,
  paperTone,
  type CarryText,
  type Rect,
} from '@/lib/transitions.logic';
import { FadeEdge } from './excerpt-fade';
import { FADE_FRACTION } from './excerpt-fade.logic';

type Remembered = { card: Rect; text?: CarryText; rtl?: boolean };

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

type TextSlot = { ref: RefObject<View | null>; lineHeight: number; rtl?: boolean };
const CardSourceContext = createContext<((slot: TextSlot | null) => void) | null>(null);

/** Wraps a card so its place on screen (and its words' place) is known the moment a finger lands on it. */
export function CardSource({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  const text = useRef<TextSlot | null>(null);
  const remember = useCallback(() => {
    const slot = text.current;
    void Promise.all([measure(ref.current), measure(slot?.ref.current ?? null)]).then(([card, words]) => {
      if (card) cardRects.set(id, { card, text: words && slot ? { ...words, lineHeight: slot.lineHeight } : undefined, rtl: slot?.rtl });
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

/**
 * The card's words that the page shares: its dateline and its excerpt (an ExcerptFade). `lineHeight` is the line
 * height its body text renders at (lineHeightFor with the same type, Dynamic Type and Reading Size); `rtl` when the
 * excerpt runs right to left, so its fade sits on the left.
 */
export function CardText({ children, lineHeight, rtl, style }: { children: ReactNode; lineHeight: number; rtl?: boolean; style?: StyleProp<ViewStyle> }) {
  const register = useContext(CardSourceContext);
  const ref = useRef<View>(null);
  useEffect(() => {
    register?.({ ref, lineHeight, rtl });
    return () => register?.(null);
  }, [register, lineHeight, rtl]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

/**
 * The page's opening block, drawn by CardToPage. `focus` is the ref for the element screen readers land on when
 * the page has arrived (its dateline or heading); the carried copies are drawn with `focus` null.
 */
export type Opening = (focus: RefObject<any> | null) => ReactNode;

/**
 * Where a CardToPage is, for the page inside it:
 * - `phase`: 'measuring' (its first frames, choosing a carry or a fade; the page is not on screen yet), 'moving',
 *   'settled' (arrived; screen readers are on the page), or 'closing' (Back has begun);
 * - `carried`: the card's words are carried in. False: the page fades in whole, and the rest of it is part of that;
 * - `home`: the carried words are within CARD_TO_PAGE.homePt of their place, so the rest of the page can come in with
 *   no line of it under words still on their way. True at once when nothing is carried, false while measuring.
 */
export type CardToPagePhase = { phase: 'measuring' | 'moving' | 'settled' | 'closing'; carried: boolean; home: boolean };

type PageContext = {
  close: () => void;
  opening: Opening;
  focus: RefObject<any>;
  hidden: boolean;
  place: (v: View | null, lineHeight: number) => void;
  phase: CardToPagePhase;
};
const CardPageContext = createContext<PageContext>({
  close: () => {},
  opening: () => null,
  focus: { current: null },
  hidden: false,
  place: () => {},
  phase: { phase: 'settled', carried: false, home: true },
});

/** Inside a CardToPage: closes the page the way it came (the words back into the card, or a fade). */
export function useCardToPageClose(): () => void {
  return useContext(CardPageContext).close;
}

/** Inside a CardToPage: where the move is (CardToPagePhase), so the page times the rest of itself by it. */
export function useCardToPagePhase(): CardToPagePhase {
  return useContext(CardPageContext).phase;
}

/** For the screen behind a card's page (the Book): spread on its root, so screen readers cannot reach it under the page. */
export function useHiddenBehindCardPage() {
  return hiddenBehind(useSyncExternalStore(cardPages.subscribe, cardPages.get, cardPages.get));
}

/**
 * Where the page's opening block (the `opening` given to CardToPage) sits in the page's own layout. `lineHeight` is
 * the line height its body text renders at; it must equal the card's for the words to be carried.
 */
export function PageOpening({ lineHeight, style }: { lineHeight: number; style?: StyleProp<ViewStyle> }) {
  const { opening, focus, hidden, place } = useContext(CardPageContext);
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={() => place(ref.current, lineHeight)}
      // Hidden while the carried copy stands in for it (and from screen readers, so nothing invisible is reachable).
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      aria-hidden={hidden}
      style={[style, hidden && { opacity: 0 }]}>
      {opening(focus)}
    </View>
  );
}

type Phase = 'measuring' | 'moving' | 'settled';
/** Frames to wait for the card's and the page's measurements before choosing the plain fade instead. */
const MEASURE_FRAMES = 4;

export function CardToPage({ id, opening, onClosed, children }: { id: string; opening: Opening; onClosed: () => void; children: ReactNode }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  const full: CarryText = { x: 0, y: 0, width: screen.width, height: screen.height, lineHeight: 0 };

  const [phase, setPhase] = useState<Phase>('measuring');
  const [carry, setCarry] = useState(false);
  // The carried words came within homePt of their place (once), and Back has begun: for useCardToPagePhase.
  const [home, setHome] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remembered = useRef<Remembered | undefined>(cardRects.get(id));
  const pageView = useRef<View | null>(null);
  const pageLine = useRef(0);
  const pageRect = useRef<CarryText | undefined>(undefined);
  const closing = useRef(false);
  const mounted = useRef(true);
  const focus = useRef<any>(null);

  const p = useSharedValue(0);
  const fade = useSharedValue(0);
  const carrying = useSharedValue(0);
  const from = useSharedValue<Rect>(full);
  const ct = useSharedValue<Rect>(full);
  const pt = useSharedValue<Rect>(full);
  const veil = useSharedValue(0);
  const lifting = useSharedValue(0);
  const liftFrom = useSharedValue(0);

  // The screen behind hides from screen readers for as long as the page is up.
  useEffect(() => cardPages.hold(), []);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  // When the page has arrived (carried or faded), VoiceOver and TalkBack land on its first element, once.
  useFocusOnMount(focus, phase === 'settled', 'settled');

  const place = useCallback((v: View | null, lineHeight: number) => {
    pageView.current = v;
    pageLine.current = lineHeight;
    void measure(v).then((r) => {
      if (r) pageRect.current = { ...r, lineHeight };
    });
  }, []);

  // The card is measured on touch-down and the page's opening on its first layout, both asynchronously: give them a
  // few frames to land, then carry the words if the card and the page share a column and type, or cross-fade.
  useEffect(() => {
    if (phase !== 'measuring') return;
    let frames = 0;
    let raf = 0;
    const decide = () => {
      if (closing.current) return;
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

  const paper = useAnimatedStyle(() => {
    const f = cardToPageFrame(from.value, screen, p.value);
    // The paper is the card's own surface until the card's fade over its last line has given way, then becomes the
    // page's (paperTone), so that fade, drawn in the card's surface, always matches the paper under it. Carried, it
    // comes and goes with the veil: the rest of the card leaves with the Book and comes back with it, never cut.
    const backgroundColor = interpolateColor(paperTone(p.value), [0, 1], [c.surfaceRaised, c.bg]);
    return { left: f.x, top: f.y, width: f.width, height: f.height, borderRadius: f.radius, opacity: carrying.value ? veil.value : fade.value, backgroundColor };
  });
  // The veil: the page's paper over the whole Book, one layer with no pieces (so no joint can show as a seam).
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
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
  // The card's fade over the end of its last line, only if the card was cut (the page holds more than it showed).
  const cardFade = useAnimatedStyle(() => ({
    opacity: cardWasCut(ct.value, pt.value) ? carryFrame(from.value, ct.value, pt.value, screen, p.value).cardFade : 0,
  }));

  // The carried words are home: the page may bring in the rest of itself (useCardToPagePhase). Once, on the way in.
  useAnimatedReaction(
    () => carrying.value === 1 && carriedHome(ct.value, pt.value, p.value),
    (now, was) => {
      if (now && !was) runOnJS(setHome)(true);
    },
  );

  // The way back finishes when the paper is home and the veil has lifted (both), and only then leaves the route.
  const closeLeft = useRef(0);
  const oneDone = useCallback(() => {
    closeLeft.current -= 1;
    if (closeLeft.current === 0) onClosed();
  }, [onClosed]);
  // On the way back the veil lifts once the paper is within clearPt of the card: no edge can meet a line after that.
  useAnimatedReaction(
    () => lifting.value === 1 && p.value <= liftFrom.value,
    (ready, was) => {
      if (!ready || was) return;
      lifting.value = 0;
      veil.value = withTiming(0, { duration: CARD_TO_PAGE.veilOutMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) runOnJS(oneDone)();
      });
    },
    [oneDone],
  );

  // Started once the choice is made, after the styles above are in place (effects run in order).
  useEffect(() => {
    if (phase !== 'moving' || closing.current) return;
    const settle = (done?: boolean) => {
      if (done) setPhase('settled');
    };
    if (carry) {
      // The Book goes under the veil the way its lamp leaves a lit room; the card holds, then grows.
      fade.value = 1;
      veil.value = withTiming(1, { duration: CARD_TO_PAGE.veilInMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
      p.value = withDelay(CARD_TO_PAGE.holdMs, withSpring(1, springConfig('standard'), (done) => runOnJS(settle)(done)), ReduceMotion.Never);
    } else {
      // Nothing moves: a hand-off inside one fadeMs. The Book goes under the veil, the whole page fades in after it.
      const h = CARD_TO_PAGE.handOff;
      p.value = 1;
      veil.value = withTiming(1, { duration: h.leaveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
      fade.value = withDelay(
        h.arriveFromMs,
        withTiming(1, { duration: h.arriveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (done) => runOnJS(settle)(done)),
        ReduceMotion.Never,
      );
    }
  }, [phase, carry, p, fade, veil]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    const done = () => onClosed();
    // The same hand-off back: the page fades out whole, and the Book comes back after it.
    const fadeOut = () => {
      const h = CARD_TO_PAGE.handOff;
      // A carried paper was at the veil's strength: the fade starts from there, so the paper never jumps up first.
      if (carrying.value) fade.value = Math.min(fade.value, veil.value);
      carrying.value = 0;
      setCarry(false);
      fade.value = withTiming(0, { duration: h.leaveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
      veil.value = withDelay(
        h.arriveFromMs,
        withTiming(0, { duration: h.arriveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
          if (finished) runOnJS(done)();
        }),
        ReduceMotion.Never,
      );
    };
    const r = remembered.current;
    if (!carry || reduced || !r || cardBackMove(r.card, screen) !== 'shrink') return fadeOut();
    // The page may have scrolled: find its opening again, and carry the words back only if they still match.
    void measure(pageView.current).then((at) => {
      if (!mounted.current) return;
      const now = at ? { ...at, lineHeight: pageLine.current } : undefined;
      if (!now || !canCarry(r.text, now) || now.y + now.height < 0 || now.y > screen.height) return fadeOut();
      pt.value = now;
      setPhase('moving');
      closeLeft.current = 2;
      liftFrom.value = clearProgress(r.card, screen);
      lifting.value = 1;
      p.value = withSpring(0, springConfig('standard'), (finished) => {
        if (finished) runOnJS(oneDone)();
      });
    });
  }, [carry, reduced, screen, onClosed, oneDone, p, fade, veil, pt, carrying, lifting, liftFrom]);

  const rtl = !!remembered.current?.rtl;
  const lineHeight = remembered.current?.text?.lineHeight ?? 0;
  const showCarry = carry && phase === 'moving';
  const ctx = useMemo<PageContext>(
    () => ({
      close,
      opening,
      focus,
      hidden: phase !== 'settled' && (carry || phase === 'measuring'),
      place,
      phase: {
        phase: leaving ? 'closing' : phase,
        carried: carry && phase !== 'measuring',
        home: phase !== 'measuring' && (!carry || home),
      },
    }),
    [close, opening, phase, carry, place, leaving, home],
  );

  return (
    <CardPageContext.Provider value={ctx}>
      {/* Modal for screen readers: only the page is reachable while it is up (the Book also hides itself). */}
      <View style={StyleSheet.absoluteFill} accessibilityViewIsModal aria-modal>
        {/* The veil: the page's paper over the whole Book, one layer (the Book's words and light leave, never cut). */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }, veilStyle]} />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, paper]} />
        <Animated.View style={[StyleSheet.absoluteFill, content]}>{children}</Animated.View>
        {showCarry ? (
          <Animated.View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
            style={[{ position: 'absolute' }, block]}>
            {/* The card's own words: always there, carried whole. */}
            <Animated.View style={[{ overflow: 'hidden' }, excerptBox]}>
              {opening(null)}
              <Animated.View style={[fadeEdgeBox(lineHeight, rtl), cardFade]}>
                <FadeEdge color={c.surfaceRaised} side={rtl ? 'left' : 'right'} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </Animated.View>
            {/* The rest of the letter, below them: cross-fades in, and never draws past the paper. */}
            <Animated.View style={[{ position: 'absolute', left: 0, right: 0, overflow: 'hidden' }, extraBox]}>
              <Animated.View style={[{ position: 'absolute', left: 0, right: 0 }, extraInner]}>{opening(null)}</Animated.View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    </CardPageContext.Provider>
  );
}

/** The card's fade over the end of its last line, at the bottom of the carried excerpt. */
function fadeEdgeBox(lineHeight: number, rtl: boolean): ViewStyle {
  return { position: 'absolute', bottom: 0, height: lineHeight, width: `${FADE_FRACTION * 100}%`, [rtl ? 'left' : 'right']: 0 };
}
