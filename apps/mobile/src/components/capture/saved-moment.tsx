// web: same (Reanimated on web) | android: same
/**
 * The saved moment (EXPERIENCE_PASS_2026-10 S21, MOTION 5e, 5.8 rows 5 and 5a; package P4b): the letter files into
 * its month. The save has already committed and the success haptic has played (MOTION principle 3); only then does
 * anything move, so a kill mid-way loses nothing.
 *
 *   0 ms     the sheet scales from 1 to 0.9 and its radius goes from xl to md, on `gentle`
 *   250 ms   the chip fades in under it ("Kept in Month 7", or the lock and "Kept just for you."): accentSoft fill,
 *            subhead (P1's trust-copy floor; S21 says caption), the website's lit edge (a 1 pt lamp-amber border at 40 percent; a 1 pt line under Increase
 *            Contrast or Reduce Transparency)
 *   550 ms   the card moves down 24 pt and fades (350 ms, so the words are never at part strength for longer)
 *   900 ms   `onDone`: Review lands on the Book, on the new letter
 *
 * Every number is lib/transitions.logic `fileIntoMonthPlan` (P1), from tokens.motion.file. A tap anywhere skips to
 * the end. Reduce Motion: the chip and the line arrive with one 200 ms fade, nothing travels, then `onDone`.
 * The person's words are at full strength or leaving, never ghosted: the confirmation line is in `text` with a
 * success check, not green text. Before the commit (`committed` false: a typed letter keeping from Write) the sheet
 * holds still at full strength, so the moment starts from exactly what the person sees.
 */
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Text } from '@/components/ui/text';
import { announce, useIsAccessibilitySize, useScreenReader, useTheme } from '@/lib/a11y';
import { useReducedMotion } from '@/lib/motion';
import { fileIntoMonthPlan } from '@/lib/transitions.logic';
import { LetterHeaderRow, useSheetSurface, type LetterHeader } from './letter-sheet';
import { momentAnnouncement, savedMomentLeaveInMs } from './review-view.logic';

/**
 * Lines of the letter shown on the card while it files away: whole lines, then a fade (S21, the excerpt rule). Fewer at
 * accessibility text sizes, so the chip and the line stay on screen at AX5.
 */
export const SAVED_CARD_LINES = 6;
export const SAVED_CARD_LINES_LARGE = 2;

const M = tokens.motion;
const STANDARD = Easing.bezier(...M.easing);
/** The website's lit edge on the chip: the lamp's amber at 40 percent (EXPERIENCE_PASS 5.6). */
const LIT_EDGE = `${tokens.atmosphere.tone.amber}66`;

export function SavedMoment({
  header,
  words,
  chip,
  lock,
  line,
  committed,
  onDone,
}: {
  header: LetterHeader;
  /** The letter's words, or the line that stands in for them (a recording waiting for its words). */
  words: string;
  chip: string;
  lock: boolean;
  line: string | null;
  committed: boolean;
  onDone: () => void;
}) {
  const { c, highContrast, reduceTransparency } = useTheme();
  const reduced = useReducedMotion();
  const surface = useSheetSurface();
  const screenReader = useScreenReader();
  const large = useIsAccessibilitySize();
  const plan = fileIntoMonthPlan(reduced);
  const said = momentAnnouncement(chip, line);
  const done = useRef(false);
  // When the save committed: the moment's clock, so a screen-reader answer that arrives later still counts from here.
  const committedAt = useRef<number | null>(null);
  const finish = () => {
    if (!committed || done.current) return;
    done.current = true;
    onDone();
  };

  const scale = useSharedValue(1);
  const radius = useSharedValue<number>(tokens.radius.xl);
  const lift = useSharedValue(0);
  const fade = useSharedValue(1);
  const chipIn = useSharedValue(0);

  useEffect(() => {
    if (!committed) return;
    committedAt.current = Date.now();
    // Said once, as it appears (the card itself is hidden from VoiceOver while it files away).
    announce(said);
    const g = M.gentle;
    const spring = { stiffness: g.stiffness, damping: g.damping, mass: g.mass, reduceMotion: ReduceMotion.Never };
    if (plan.scaleTo !== 1) {
      scale.value = withSpring(plan.scaleTo, spring);
      radius.value = withSpring(tokens.radius.md, spring);
    }
    chipIn.value = withDelay(plan.chipAtMs, withTiming(1, { duration: plan.chipFadeMs, easing: STANDARD, reduceMotion: ReduceMotion.Never }));
    if (plan.moveAtMs !== null) {
      const leave = plan.dismissAtMs - plan.moveAtMs;
      lift.value = withDelay(plan.moveAtMs, withTiming(plan.dy, { duration: leave, easing: STANDARD, reduceMotion: ReduceMotion.Never }));
      fade.value = withDelay(plan.moveAtMs, withTiming(0, { duration: leave, easing: STANDARD, reduceMotion: ReduceMotion.Never }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed]);

  // Then the Book. With a screen reader on, the moment holds until its announcement can be heard (about 3 s from the
  // commit). Timed again when the screen-reader state arrives: on Review's path the moment mounts at the commit, while
  // that state is still unknown (it reads off for a moment), so timing it once would leave after 900 ms with VoiceOver on.
  useEffect(() => {
    if (!committed || committedAt.current === null) return;
    const wait = savedMomentLeaveInMs({ dismissAtMs: plan.dismissAtMs, screenReader, elapsedMs: Date.now() - committedAt.current });
    const t = setTimeout(finish, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed, screenReader]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: lift.value }, { scale: scale.value }],
    borderTopLeftRadius: radius.value,
    borderTopRightRadius: radius.value,
  }));
  const chipStyle = useAnimatedStyle(() => ({ opacity: chipIn.value }));

  return (
    <Pressable
      onPress={finish}
      className="flex-1 justify-center px-4"
      accessible={committed}
      accessibilityRole="button"
      accessibilityLabel={said}
      testID="review.saved">
      <Animated.View style={[surface, cardStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LetterHeaderRow header={header} />
        <ExcerptFade text={words} lines={large ? SAVED_CARD_LINES_LARGE : SAVED_CARD_LINES} variant="letterBody" surface={c.surfaceRaised} />
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center', gap: tokens.space[3], marginTop: tokens.space[6] }, chipStyle]} accessibilityLiveRegion="polite">
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5"
          style={{
            borderRadius: tokens.radius.pill,
            backgroundColor: c.accentSoft,
            borderWidth: tokens.stroke.control,
            borderColor: highContrast || reduceTransparency ? c.line : LIT_EDGE,
          }}
          testID="review.saved.chip">
          {lock && <LockSimpleIcon size={14} color={c.textMuted} />}
          {/* subhead, not caption: P1's rule keeps trust copy ("Kept just for you.") at 16 pt or more (S21 says caption). */}
          <Text variant="subhead" tone="default">
            {chip}
          </Text>
        </View>
        {line && (
          <View className="flex-row items-center gap-1.5" testID="review.saved.line">
            <CheckCircleIcon size={18} color={c.success} weight="fill" />
            <Text variant="callout">{line}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
