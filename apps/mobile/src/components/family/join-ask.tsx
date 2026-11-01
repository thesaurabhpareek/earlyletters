// web: same | android: same
/**
 * The join sheet's ask and its arrival (EXPERIENCE_PASS_2026-10 S59).
 *
 * JoinAsk: "Join this book as a parent?", then who sent it set as a letter's signature ("Invited by Mama" in the
 * signature face), then the safety line in `footnote`. Still no child name: the peek returns only the inviter's
 * sign-off (BL-322, D-111 item 8, D-113 item 3).
 *
 * JoinStep: each view fades in over the last (200 ms), as one act in one sheet.
 *
 * JoinedCover: the book cover (132 x 176) appears for the first time with the child's name and opens to the
 * flyleaf: it fades in (200 ms), holds 300 ms, then the front cross-fades to the flyleaf with an 8 pt shift on
 * `standard`, as on S08 (BookCover's own opening). The flyleaf's foot line carries the inviter's sign-off; the
 * two-signature flyleaf ("From Mama" above "From Papa") is a request to P1's BookCover. Reduce Motion: shown open
 * at once, one 200 ms fade.
 *
 * WaitingBar: while the book is still coming down, a thin bar with no count under "{child}'s book is on its way
 * to this phone.". Indeterminate (sync reports no pull progress yet, a request to S03); still under Reduce Motion.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { BookCover } from '@/components/book/book-cover';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { useReducedMotion } from '@/lib/motion';
import { SheetTitle } from '@/lib/auth/ui';
import { familyCopy } from '@/lib/family/copy';
import { invitedByLine } from './join-sheet.logic';

export function JoinAsk({ inviter }: { inviter: string | null }) {
  const by = invitedByLine(inviter);
  return (
    <View testID="invite.ask" className="gap-4">
      <SheetTitle>{familyCopy.accept.askTitle}</SheetTitle>
      <Text variant={by.signature ? 'signature' : 'body'}>{by.text}</Text>
      <Text variant="footnote">{familyCopy.accept.askBody}</Text>
    </View>
  );
}

const COVER_IN = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);

/**
 * One step of the join sheet. Steps inside one sheet are one act, so a new step fades in over the last (fadeMs,
 * 200 ms), never a push; the first step the sheet opens on adds no entrance (5.8 row 10). The caller keys it by
 * its view, so each new view mounts and fades in.
 */
export function JoinStep({ fade, children }: { fade: boolean; children: ReactNode }) {
  return <Animated.View entering={fade ? COVER_IN : undefined}>{children}</Animated.View>;
}

export function JoinedCover({ child, inviter }: { child: string; inviter: string | null }) {
  // BookCover holds the front, then opens it (tokens.motion.cover); under Reduce Motion it is open at once.
  return (
    <Animated.View entering={COVER_IN} testID="invite.joined.cover" className="items-center pb-2">
      <BookCover name={child} signsAs={inviter?.trim() || undefined} size="md" state="open" openOnMount />
    </Animated.View>
  );
}

/** One slow sweep of a short accent segment across a hairline track: no number, no percent. */
const SWEEP_MS = 1400;

export function WaitingBar() {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduced || width === 0) {
      cancelAnimation(x);
      x.value = 0;
      return;
    }
    x.value = 0;
    x.value = withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never }), -1, true);
    return () => cancelAnimation(x);
  }, [reduced, width, x]);
  const segment = Math.round(width / 3);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (width - segment) }] }));
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 3, borderRadius: 2, backgroundColor: c.line, overflow: 'hidden' }}>
      {/* Reduce Motion: the segment rests at the start, still. */}
      <Animated.View style={[{ width: segment, height: 3, borderRadius: 2, backgroundColor: c.accent }, style]} />
    </View>
  );
}
