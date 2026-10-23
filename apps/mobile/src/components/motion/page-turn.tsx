// web: same (Reanimated + Gesture Handler on web) | android: same
/**
 * PageTurn (EXPERIENCE_PASS S30, motion catalogue "page turn"): Read together turns pages sideways, the way
 * a book does, with no curl. "Next letter" moves the page tokens.motion.pageTurn.dx (24 pt) left over
 * exitMs, while the next page arrives from 24 pt right on `standard`; "Back one" reverses it. The words
 * hand off rather than pile up: the old page's words are gone early and the new ones start as the old
 * are half gone (transitions.logic HAND_OFF), so two letters never sit on top of each other.
 * A horizontal swipe does the same: the page follows the finger, and the turn can be interrupted (springs
 * start from where the page is). Reduce Motion: a 200 ms cross-fade, and the page does not follow the
 * finger. No haptic (playback has none, MOTION 6).
 *
 *   <PageTurn
 *     pageKey={entry.id}
 *     direction={dir}
 *     renderPage={(id) => <LetterPage entry={byId(id)} />}
 *     onSwipe={(d) => (d === 'next' ? next() : back())}
 *     canNext={i < last}
 *     canBack={i > 0}
 *   />
 *
 * The buttons stay the screen's own (every gesture has a button, DESIGN_LANGUAGE 11.3). The page that is
 * leaving is hidden from VoiceOver, TalkBack and the web's accessibility tree, and takes no touches; the new page
 * is the only one a reader can reach.
 * The rules are pure in lib/transitions.logic.ts (pageTurnPlan, swipeOutcome).
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { STANDARD_EASING, springConfig, useReducedMotion } from '@/lib/motion';
import { pageTurnPlan, swipeOutcome, type PageDirection } from '@/lib/transitions.logic';

export type { PageDirection } from '@/lib/transitions.logic';

type PageTurnProps = {
  /** The page on screen. A new key turns the page. */
  pageKey: string;
  /** Which way the last change went: 'next' leaves left and arrives from the right. */
  direction: PageDirection;
  /** Draws the page for a key (the leaving page is drawn by its own key while it leaves). */
  renderPage: (key: string) => ReactNode;
  /** A swipe asks for the next or the previous page; the screen decides and changes pageKey. */
  onSwipe?: (direction: PageDirection) => void;
  /** At the first or last page the swipe meets a soft edge instead. */
  canNext?: boolean;
  canBack?: boolean;
  style?: StyleProp<ViewStyle>;
};

type Layer = { key: string; role: 'current' | 'leaving'; arrive: boolean; direction: PageDirection };

/** How much of the finger's travel the page follows at an end with nowhere to go. */
const EDGE = 0.25;

export function PageTurn({ pageKey, direction, renderPage, onSwipe, canNext = true, canBack = true, style }: PageTurnProps) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const drag = useSharedValue(0);
  const [layers, setLayers] = useState<Layer[]>([{ key: pageKey, role: 'current', arrive: false, direction }]);

  // A new key: the page on screen leaves, the new one arrives (a key coming back mid-turn simply arrives again).
  useEffect(() => {
    setLayers((prev) => {
      if (prev.some((l) => l.key === pageKey && l.role === 'current')) return prev;
      return [
        ...prev.filter((l) => l.key !== pageKey).map((l) => (l.role === 'current' ? { ...l, role: 'leaving' as const, direction } : l)),
        { key: pageKey, role: 'current' as const, arrive: true, direction },
      ];
    });
  }, [pageKey, direction]);

  const gone = useCallback((key: string) => setLayers((prev) => prev.filter((l) => l.key !== key || l.role === 'current')), []);
  const snap = springConfig('snappy');

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      if (reduced) return;
      const blocked = (e.translationX < 0 && !canNext) || (e.translationX > 0 && !canBack);
      drag.value = e.translationX * (blocked ? EDGE : 1);
    })
    .onEnd((e) => {
      const outcome = swipeOutcome(e.translationX, e.velocityX, width);
      const allowed = outcome === 'next' ? canNext : outcome === 'back' ? canBack : false;
      if (outcome && allowed && onSwipe) {
        runOnJS(onSwipe)(outcome);
        return;
      }
      drag.value = withSpring(0, snap);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
        {layers.map((l) => (
          <Page key={l.key} layer={l} reduced={reduced} drag={drag} onGone={gone}>
            {renderPage(l.key)}
          </Page>
        ))}
      </View>
    </GestureDetector>
  );
}

function Page({ layer, reduced, drag, onGone, children }: { layer: Layer; reduced: boolean; drag: SharedValue<number>; onGone: (key: string) => void; children: ReactNode }) {
  const plan = pageTurnPlan(layer.direction, reduced);
  const x = useSharedValue(layer.arrive ? plan.inDx : 0);
  const o = useSharedValue(layer.arrive ? 0 : 1);
  const leaving = layer.role === 'leaving';

  useEffect(() => {
    if (leaving) {
      // Leave from wherever the finger left the page, toward the side it is going.
      x.value = x.value + drag.value;
      drag.value = 0;
      x.value = withTiming(plan.outDx, { duration: plan.outMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
      o.value = withTiming(0, { duration: plan.fadeOutMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => {
        if (done) runOnJS(onGone)(layer.key);
      });
      return;
    }
    if (layer.arrive) {
      x.value = reduced ? 0 : withDelay(plan.inDelayMs, withSpring(0, springConfig('standard')));
      o.value = withDelay(plan.inDelayMs, withTiming(1, { duration: plan.inMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }));
    }
    // Only the role decides what this page does; the plan is read when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX: x.value + (leaving ? 0 : drag.value) }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents={leaving ? 'none' : 'auto'}
      importantForAccessibility={leaving ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={leaving}
      // The web preview: React Native Web does not turn the two above into aria-hidden, so say it.
      aria-hidden={leaving}>
      {children}
    </Animated.View>
  );
}
