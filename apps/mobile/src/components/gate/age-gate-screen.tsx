// android: same
/**
 * 18+ entry gate (PRD-REQ-019, LEGAL-REQ-002, K-07). Rendered by the root
 * layout instead of any route, so nothing (first run, Tonight, an invite or
 * any deep link) is reachable until it passes.
 *
 * Neutral question, nothing preselected. Yes stores a boolean only. No shows
 * a calm stop screen and stores only the time of the No (DECISIONS D-026); no
 * child, letter, recording or request exists afterwards. The stop screen has
 * no way back until those 24 hours have passed; only then does it offer
 * "I answered by mistake".
 *
 * Design (EXPERIENCE_PASS 2.3, S01, S02): the launch screen's room. The lamp's `gate` scene (centred, still,
 * persistKey "firstRun", so the welcome mounts lit and never arrives again), the opening quotation pair, one
 * question in `display`, two equal answers and Continue. No body line, no link, no footer. The stop screen is the
 * same room: the same lamp, the same mark in the same place, one line where the question was, and nothing else
 * until the 24 hours have passed. Answering No never dims or changes the room, so nothing hints that one answer is
 * right.
 * Motion: the mark fades in (fadeMs, QuotePair); the question enters at 60 ms; the answers and Continue are there
 * from the first frame. Yes, Continue: the mark and question go up and out (exitMs), then the gate passes and the
 * welcome takes the light. No, Continue: the question and answers cross-fade into the stop line (fadeMs). Reduce
 * Motion: fades only, and the lamp holds still.
 * Haptics: `tap` (selection) on an answer; none on Continue (MOTION 6).
 */
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, View, type Text as RNText } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { LampView } from '@/components/ui/lamp';
import { QuotePair } from '@/components/ui/quote-pair';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { useFocusOnMount, useIsLargeText, useTheme } from '@/lib/a11y';
import { answerAgeGate, reopenAgeGate } from '@/lib/age-gate';
import type { GateDecision } from '@/lib/age-gate.logic';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { STANDARD_EASING, useMotion } from '@/lib/motion';

interface Props {
  decision: Exclude<GateDecision, 'pass'>;
  refresh: () => void;
}

const M = tokens.motion;
/** The room's layout (EXPERIENCE_PASS 2.3): the mark's top below the safe area, and the gaps under it. */
const ROOM = { markTop: 120, markHeight: 56, questionGap: 24, answersGap: 32, answerHeight: tokens.target.primary, answerGap: 12, gutter: 16, footGap: 24 } as const;
/** A view swap inside the room (ask to stop): one cross-fade, which is also the Reduce Motion form. */
const SWAP_IN = FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never);
const SWAP_OUT = FadeOut.duration(M.fadeMs).reduceMotion(ReduceMotion.Never);

export function AgeGateScreen({ decision, refresh }: Props) {
  const g = copy.ageGate;
  const motion = useMotion();
  const [view, setView] = useState<'ask' | 'stop'>(decision);
  const [adult, setAdult] = useState<boolean | null>(null); // nothing preselected (K-07)
  const question = useRef<RNText>(null);

  // VoiceOver lands on the question when it appears (and again after "I answered by mistake").
  useFocusOnMount(question, view === 'ask', view);

  // Announce the stop line (iOS has no live regions in RN; TDD 09 A11Y-F08).
  useEffect(() => {
    if (view === 'stop') AccessibilityInfo.announceForAccessibility(g.stopTitle);
  }, [view, g.stopTitle]);

  // Yes, Continue: the words go up and out, then the gate passes (the lamp keeps its light through persistKey).
  const leave = useSharedValue(0);
  const leaving = useAnimatedStyle(() => ({ opacity: 1 - leave.value, transform: [{ translateY: motion.reduced ? 0 : -M.enter.dy * leave.value }] }));

  const submit = () => {
    if (adult === null) return;
    answerAgeGate(adult ? 'yes' : 'no');
    if (!adult) {
      setView('stop');
      refresh();
      return;
    }
    leave.value = withTiming(1, { duration: motion.reduced ? M.fadeMs : M.exitMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => {
      if (done) runOnJS(refresh)();
    });
  };

  const answeredByMistake = () => {
    haptic('tap');
    reopenAgeGate();
    setAdult(null);
    setView('ask');
    refresh();
  };

  // The window has passed while this screen was open (or on a relaunch): only then is a way back offered.
  const windowPassed = decision === 'ask';

  return (
    <View className="flex-1 bg-background">
      <LampView scene="gate" persistKey="firstRun" />
      <SafeAreaView className="flex-1" style={{ paddingHorizontal: ROOM.gutter }}>
        {/* The mark never moves and never changes between the question and the stop line. */}
        <Animated.View style={[{ marginTop: ROOM.markTop, alignItems: 'center' }, view === 'ask' ? leaving : null]}>
          <QuotePair height={ROOM.markHeight} aligned={false} style={{ alignSelf: 'center' }} />
        </Animated.View>
        {view === 'ask' ? (
          <Animated.View key="ask" exiting={SWAP_OUT} className="flex-1">
            <Animated.View style={leaving}>
              <Animated.View entering={motion.enter(2)} style={{ marginTop: ROOM.questionGap, alignItems: 'center' }}>
                <Text ref={question} variant="display" asHeading={1} className="text-center" style={{ maxWidth: 320 }}>
                  {g.title}
                </Text>
              </Animated.View>
            </Animated.View>
            {/* Controls are opaque from the first frame (MOTION principle 2). */}
            <AgeAnswers adult={adult} onChoose={setAdult} label={g.title} yes={g.yesButton} no={g.noButton} />
            <View className="flex-1" />
            <View style={{ paddingBottom: ROOM.footGap }}>
              <Button size="lg" fullWidth disabled={adult === null} label={copy.common.continueButton} onPress={submit} testID="gate.continue" />
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="stop" entering={SWAP_IN} className="flex-1 items-center">
            <View accessibilityLiveRegion="polite" style={{ marginTop: ROOM.questionGap }}>
              <Text variant="title1" asHeading={1} className="text-center" style={{ maxWidth: 320 }}>
                {g.stopTitle}
              </Text>
            </View>
            {windowPassed ? (
              <Animated.View entering={SWAP_IN} style={{ marginTop: ROOM.answersGap }}>
                <Button size="lg" variant="secondary" label={g.mistakeButton} onPress={answeredByMistake} />
              </Animated.View>
            ) : null}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

/**
 * Yes and No: two equal pills in one row, nothing selected on arrival, a radio group named by the question. At
 * accessibility text sizes they stack, Yes first, the same width. Selected: accentSoft fill, a 1.5 pt accent edge and
 * a check before the word; unselected: a 1 pt controlBorder edge on clear. Exported so the age step inside account
 * setup (S55, P8a's consent.tsx) can show the same two pills with Continue, unchanged.
 */
export function AgeAnswers({ adult, onChoose, label, yes, no }: { adult: boolean | null; onChoose: (v: boolean) => void; label: string; yes: string; no: string }) {
  const stacked = useIsLargeText();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ marginTop: ROOM.answersGap, flexDirection: stacked ? 'column' : 'row', gap: ROOM.answerGap }}>
      <Answer selected={adult === true} label={yes} onPress={() => onChoose(true)} testID="gate.yes" />
      <Answer selected={adult === false} label={no} onPress={() => onChoose(false)} testID="gate.no" />
    </View>
  );
}

function Answer({ selected, label, onPress, testID }: { selected: boolean; label: string; onPress: () => void; testID: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      accessibilityRole="radio"
      // aria-checked: one prop that VoiceOver (accessibilityState on iOS) and the web build both read.
      aria-checked={selected}
      accessibilityLabel={label}
      testID={testID}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-full px-4"
      style={{
        minHeight: ROOM.answerHeight,
        borderWidth: selected ? tokens.stroke.selected : tokens.stroke.control,
        borderColor: selected ? c.accent : c.controlBorder,
        backgroundColor: selected ? c.accentSoft : 'transparent',
      }}>
      {selected ? <CheckIcon size={18} color={c.accent} weight="bold" /> : null}
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}
