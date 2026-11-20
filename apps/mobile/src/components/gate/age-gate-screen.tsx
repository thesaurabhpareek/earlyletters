// android: same
/**
 * Before you begin: the 18+ entry gate and the Terms agreement on one screen (PRD-REQ-019, LEGAL-REQ-002, K-07;
 * founder decision F2, 8 Nov 2026; design proposals/account-security/design.md 2.1, PR #596
 * docs/design/screens/SETTINGS_AND_ACCOUNT.md 2). Rendered by the root layout instead of any route, so nothing
 * (first run, Tonight, an invite or any deep link) is reachable until it passes.
 *
 * Two controls, one screen: the neutral question with nothing preselected, and an unticked agreement box
 * (AgreementRow) with the Terms and Privacy links below it as their own targets. Continue is never disabled: with
 * no answer it says "Choose Yes or No."; Yes without a tick says "Check the box to continue." and moves focus to the
 * box, storing nothing. No, then Continue, goes to the stop screen whatever the box says, and nothing about the box is
 * stored. Yes with a tick stores the age boolean and the local agreement record in one transaction
 * (lib/agreements.logic.ts). An install that passed the old gate (build 1) sees the agreement once, without the
 * question (`decision === 'agree'`, counsel Q-C).
 *
 * The stop screen is unchanged: one line, and only after the 24 hours have passed "I answered by mistake" (D-026).
 * BL-561 (a confirm after No, held PR #521) stays with the founder and counsel.
 *
 * Design (EXPERIENCE_PASS 2.3, S01, S02): the launch screen's room. The lamp's `gate` scene (centred, still,
 * persistKey "firstRun", so the welcome mounts lit and never arrives again), the opening quotation pair, one
 * question in `display`, two equal answers, the agreement row, the two links, the reason line when needed, and
 * Continue. The stop screen is the same room: the same lamp, the same mark in the same place, one line where the
 * question was. Answering No never dims or changes the room, so nothing hints that one answer is right. The gate
 * allows no status colour: the reason line is `text` with a WarningCircle in `text`, plus an announcement.
 * Motion: the mark fades in (fadeMs, QuotePair); the question enters at 60 ms; the controls are there from the first
 * frame. Accept: the mark and words go up and out (exitMs), then the gate passes and the welcome takes the light.
 * No, Continue: the question and answers cross-fade into the stop line (fadeMs). The reason line fades in at fadeMs.
 * Reduce Motion: fades only, and the lamp holds still.
 * Haptics: `tap` (selection) on an answer and on the box; none on Continue (MOTION 6).
 */
import { brand } from '@scribe/brand';
import * as WebBrowser from 'expo-web-browser';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View, type Text as RNText } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { AgreementRow } from '@/components/ui/agreement-row';
import { Button } from '@/components/ui/button';
import { LampView } from '@/components/ui/lamp';
import { QuotePair } from '@/components/ui/quote-pair';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { announce, useFocusOnMount, useIsLargeText, useTheme } from '@/lib/a11y';
import { acceptBeforeYouBegin, answerAgeGate, reopenAgeGate } from '@/lib/age-gate';
import { continueBeforeBegin, type EntryDecision } from '@/lib/agreements.logic';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { STANDARD_EASING, useMotion } from '@/lib/motion';

interface Props {
  decision: Exclude<EntryDecision, 'pass'>;
  refresh: () => void;
}

type Reason = 'chooseAnswer' | 'tickBox';

const M = tokens.motion;
/** The room's layout (EXPERIENCE_PASS 2.3): the mark's top below the safe area, and the gaps under it. */
const ROOM = { markTop: 120, markHeight: 56, questionGap: 24, answersGap: 32, answerHeight: tokens.target.primary, answerGap: 12, gutter: 16, footGap: 24, agreeGap: 24 } as const;
/** A view swap inside the room (ask to stop): one cross-fade, which is also the Reduce Motion form. */
const SWAP_IN = FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never);
const SWAP_OUT = FadeOut.duration(M.fadeMs).reduceMotion(ReduceMotion.Never);
/** Terms and Privacy open in the in-app browser; returning keeps every state on the screen. */
const openLink = (url: string) => () => void WebBrowser.openBrowserAsync(url).catch(() => {});

export function AgeGateScreen({ decision, refresh }: Props) {
  const g = copy.ageGate;
  const b = copy.beforeBegin;
  const motion = useMotion();
  const largeText = useIsLargeText();
  const [view, setView] = useState<'ask' | 'stop' | 'agree'>(decision);
  const [adult, setAdult] = useState<boolean | null>(null); // nothing preselected (K-07)
  const [agreed, setAgreed] = useState(false); // unticked on every visit (F2)
  const [reason, setReason] = useState<Reason | null>(null);
  const question = useRef<RNText>(null);

  // VoiceOver lands on the question (or the returning title) when it appears, and again after "I answered by mistake".
  useFocusOnMount(question, view !== 'stop', view);

  // Announce the stop line (iOS has no live regions in RN; TDD 09 A11Y-F08).
  useEffect(() => {
    if (view === 'stop') AccessibilityInfo.announceForAccessibility(g.stopTitle);
  }, [view, g.stopTitle]);

  // Accept: the words go up and out, then the gate passes (the lamp keeps its light through persistKey).
  const leave = useSharedValue(0);
  const leaving = useAnimatedStyle(() => ({ opacity: 1 - leave.value, transform: [{ translateY: motion.reduced ? 0 : -M.enter.dy * leave.value }] }));

  const choose = (v: boolean) => {
    setAdult(v);
    setReason(null);
  };
  const tick = (v: boolean) => {
    setAgreed(v);
    setReason(null);
  };

  const submit = () => {
    const out = continueBeforeBegin({ adult, agreed, returning: view === 'agree' });
    if (out.kind === 'reason') {
      setReason(out.reason);
      announce(b[out.reason]);
      return;
    }
    if (out.kind === 'stop') {
      answerAgeGate('no');
      setView('stop');
      refresh();
      return;
    }
    acceptBeforeYouBegin(b.agree, out.surface, out.passAge);
    leave.value = withTiming(1, { duration: motion.reduced ? M.fadeMs : M.exitMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => {
      if (done) runOnJS(refresh)();
    });
  };

  const answeredByMistake = () => {
    haptic('tap');
    reopenAgeGate();
    setAdult(null);
    setAgreed(false);
    setReason(null);
    setView('ask');
    refresh();
  };

  // The window has passed while this screen was open (or on a relaunch): only then is a way back offered.
  const windowPassed = decision === 'ask';

  return (
    <View className="flex-1 bg-background" testID="gate.screen">
      <LampView scene="gate" persistKey="firstRun" />
      <SafeAreaView className="flex-1">
        {/* Both views scroll (S01, S02 at Dynamic Type): with flexGrow the column fills the screen and nothing moves when it
            fits; at accessibility sizes on a small phone, Continue and "I answered by mistake" scroll into reach, since
            someone who cannot reach Continue cannot pass the gate. One ScrollView for both, so the mark stays put. */}
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: ROOM.gutter }} keyboardShouldPersistTaps="handled" testID="gate.scroll">
          {/* The mark never moves and never changes between the question and the stop line. */}
          <Animated.View style={[{ marginTop: ROOM.markTop, alignItems: 'center' }, view !== 'stop' ? leaving : null]}>
            <QuotePair height={ROOM.markHeight} aligned={false} style={{ alignSelf: 'center' }} />
          </Animated.View>
          {view !== 'stop' ? (
            <Animated.View key={view} exiting={SWAP_OUT} className="flex-1">
              <Animated.View style={leaving}>
                <Animated.View entering={motion.enter(2)} style={{ marginTop: ROOM.questionGap, alignItems: 'center' }}>
                  <Text ref={question} variant="display" asHeading={1} className="text-center" style={{ maxWidth: 320 }}>
                    {view === 'agree' ? b.returningTitle : g.title}
                  </Text>
                </Animated.View>
              </Animated.View>
              {/* Controls are opaque from the first frame (MOTION principle 2). */}
              {view === 'ask' ? <AgeAnswers adult={adult} onChoose={choose} label={g.title} yes={g.yesButton} no={g.noButton} /> : null}
              <View style={{ marginTop: ROOM.agreeGap }}>
                <AgreementRow label={b.agree} checked={agreed} onChange={tick} invalid={reason === 'tickBox'} testID="gate.agree" />
                {/* Each document is its own target: a link inside a checkbox label is unreachable for VoiceOver. */}
                <View style={{ flexDirection: largeText ? 'column' : 'row', flexWrap: 'wrap', alignItems: largeText ? 'flex-start' : 'center' }}>
                  <Button variant="quiet" size="sm" label={b.termsLink} role="link" accessibilityRole="link" accessibilityHint={b.linkA11yHint} onPress={openLink(brand.web.terms)} testID="gate.terms" />
                  <Button variant="quiet" size="sm" label={b.privacyLink} role="link" accessibilityRole="link" accessibilityHint={b.linkA11yHint} onPress={openLink(brand.web.privacy)} testID="gate.privacy" />
                </View>
              </View>
              <View className="flex-1" />
              <View style={{ paddingBottom: ROOM.footGap }}>
                {reason ? <ReasonLine text={b[reason]} /> : null}
                <Button size="lg" fullWidth label={copy.common.continueButton} onPress={submit} testID="gate.continue" />
              </View>
            </Animated.View>
          ) : (
            <Animated.View key="stop" entering={SWAP_IN} className="flex-1 items-center" testID="gate.stop">
              <View accessibilityLiveRegion="polite" style={{ marginTop: ROOM.questionGap }}>
                <Text variant="title1" asHeading={1} className="text-center" style={{ maxWidth: 320 }}>
                  {g.stopTitle}
                </Text>
              </View>
              {windowPassed ? (
                <Animated.View entering={SWAP_IN} style={{ marginTop: ROOM.answersGap, alignSelf: largeText ? 'stretch' : 'center' }}>
                  {/* Full width at accessibility sizes, so the words wrap in a wide pill, not a round one. */}
                  <Button size="lg" variant="secondary" fullWidth={largeText} label={g.mistakeButton} onPress={answeredByMistake} testID="gate.stop.mistake" />
                </Animated.View>
              ) : null}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/**
 * Why Continue did nothing, directly above it. The gate allows no status colour (lamp.test.ts): the words in `text`
 * with a Bold 18 pt WarningCircle in `text`, announced by the caller, and a live region for TalkBack.
 */
function ReasonLine({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <Animated.View key={text} entering={SWAP_IN} accessibilityLiveRegion="polite" className="mb-3 flex-row items-center gap-2" testID="gate.reason">
      <WarningCircleIcon size={18} color={c.text} weight="bold" />
      <Text variant="footnote" tone="default" className="shrink">
        {text}
      </Text>
    </Animated.View>
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
