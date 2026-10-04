/**
 * Tonight (DESIGN_LANGUAGE 12): write tonight's letter in under ten seconds.
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Things 3 "This Evening": time-of-day framing in the greeting.
 * - Apple Journal: one gentle prompt in a card instead of a blank page.
 * - Airbnb sticky CTA: Speak and Type as equal twins in the thumb zone.
 * Motion: dateline, greeting and prompt enter once (280 ms, 30 ms stagger); Speak and
 * Type never animate in (MOTION principle 2). A new prompt cross-fades in place.
 * Haptics: Speak / Type `press` (a capture starts), Another thought `tap`,
 * Not much today `soft`. Nothing else.
 */
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { ageOn, ENGINE_VERSION, renderTemplate, selectPrompt } from '@scribe/core';
import { PROMPT_LIBRARY_VERSION, PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { Button, ButtonRow } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { announce, useTheme } from '@/lib/a11y';
import { childIndexOf, promptKindOf, trackCaptureStarted } from '@/lib/analytics/track';
import { copy, fill, greetingKey, pendingCopy } from '@/lib/copy';
import { ageText, dayDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { armListenStart } from '@/lib/resilience/start-intent';
import { getActiveChildId, getFamily, listDrafts, listEntries, saveEntry, subscribe, todayISO, uuidv7, type Draft, type Family } from '@/lib/store';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Tonight() {
  const { c } = useTheme();
  const motion = useMotion();
  const t = copy.tonight;
  const [family, setFamily] = useState<Family | null | undefined>(undefined);
  const [recent, setRecent] = useState<string[]>([]);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(0);
  const [keptLine, setKeptLine] = useState(false);
  const [waiting, setWaiting] = useState<Draft | null>(null);

  const load = useCallback(() => {
    setFamily(getFamily());
    const childId = getActiveChildId();
    setWaiting(childId ? (listDrafts(childId)[0] ?? null) : null);
  }, []);

  // Child switcher (Mobile B) and saves elsewhere update Tonight live.
  useEffect(() => subscribe(load), [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      const entries = listEntries();
      setRecent(entries.map((e) => e.promptKey).filter((k): k is string => !!k));
      setDaysSince(entries[0] ? Math.floor((Date.parse(todayISO()) - Date.parse(entries[0].occurredOn)) / 864e5) : null);
      setKeptLine(false);
    }, [load]),
  );

  const today = todayISO();
  const age = family?.childBirthday ? ageOn(family.childBirthday, today) : null;

  const prompt = useMemo(
    () =>
      selectPrompt(
        {
          ageMonths: age && age.days >= 0 ? age.months : 0,
          daysSinceLastEntry: daysSince,
          hardStretch: false,
          role: 'parent',
          together: false,
          recentKeys: recent,
          seed: `${today}:${shuffle}`,
        },
        PROMPTS,
      ),
    [age?.months, daysSince, recent, today, shuffle],
  );

  if (family === undefined) return null;
  if (family === null) return <Redirect href="/onboarding" />;

  const child = family.childName;
  const ageNow = ageText({ birthday: family.childBirthday }, today);
  const dateline = ageNow ? `${child} · ${ageNow}` : dayDate(today);

  const keepNotMuch = () => {
    const weekday = WEEKDAYS[new Date().getDay()];
    const text = renderTemplate(copy.notMuch.template, { weekday, child });
    saveEntry({
      id: uuidv7(),
      kind: 'not_much',
      occurredOn: today,
      capturedAt: new Date().toISOString(),
      captureMode: 'typed',
      editLevel: 'verbatim',
      promptKey: null,
      engineVersion: ENGINE_VERSION,
      rawTranscript: text,
      machineEdits: [],
      finalText: text,
      inBook: false,
      soundsLikeMe: null,
    });
    haptic('soft');
    announce(copy.notMuch.savedToast);
    setKeptLine(true);
  };

  const start = (mode: 'spoken' | 'typed') => {
    const params = { promptKey: prompt.key, promptLibraryVersion: String(PROMPT_LIBRARY_VERSION) };
    const active = getActiveChildId();
    trackCaptureStarted({ mode, source: 'tonight', promptKind: promptKindOf(prompt.key), childIndex: childIndexOf(active), role: 'parent' });
    if (mode === 'spoken') armListenStart(); // the tap that lets Listen start the microphone
    router.push({ pathname: mode === 'typed' ? '/write' : '/listen', params });
  };

  const swap = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow px-5 pb-6 pt-5">
        <View className="gap-3">
          <Animated.View entering={motion.enter(0)}>
            <Text variant="letterDateline" caps>
              {dateline}
            </Text>
          </Animated.View>
          <Animated.View entering={motion.enter(1)} className="gap-2">
            <Text variant="display" asHeading={1}>
              {fill(t.greeting[greetingKey()], { name: family.signsAs })}
            </Text>
            <Text variant="body" tone="muted">
              {fill(t.subtitle, { child })}
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={motion.enter(2)} className="mt-8">
          <Card padding={6} radius="lg" className="gap-4">
            <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
              {t.promptLabel}
            </Text>
            <Animated.View key={prompt.key} entering={shuffle === 0 ? undefined : swap}>
              <Text variant="prompt">{renderTemplate(prompt.text, { child })}</Text>
            </Animated.View>
            <Button
              variant="quiet"
              size="sm"
              icon={ArrowsClockwiseIcon}
              label={t.newPromptButton}
              className="-ml-4 self-start"
              onPress={() => {
                haptic('tap');
                setShuffle((s) => s + 1);
              }}
            />
          </Card>
        </Animated.View>

        {waiting && (
          <Animated.View entering={motion.enter(3)} className="mt-4">
            <Card
              variant="tinted"
              padding={4}
              radius="lg"
              className="flex-row items-center gap-3"
              onPress={() => router.push({ pathname: waiting.audioUri ? '/review' : '/write', params: { draftId: waiting.id } })}
              accessibilityLabel={`${pendingCopy.tonight.waitingTitle} ${copy.review.title}`}>
              <View className="flex-1 gap-0.5">
                <Text variant="callout">{pendingCopy.tonight.waitingTitle}</Text>
                <Text variant="labelSmall" tone="accent">
                  {copy.review.title}
                </Text>
              </View>
              <CaretRightIcon size={18} color={c.accent} weight="bold" />
            </Card>
          </Animated.View>
        )}

        <View className="min-h-8 flex-1" />

        {/* Controls are opaque and hittable from the first frame (MOTION principle 2). */}
        <View className="gap-2 pt-6">
          <ButtonRow>
            <Button size="capture" icon={MicrophoneIcon} label={t.speakButton} haptic="press" onPress={() => start('spoken')} />
            <Button size="capture" icon={PencilSimpleIcon} label={t.typeButton} haptic="press" onPress={() => start('typed')} />
          </ButtonRow>
          {keptLine ? (
            <Animated.View entering={swap} className="min-h-12 flex-row items-center justify-center gap-2" accessibilityLiveRegion="polite">
              <CheckCircleIcon size={20} color={c.success} weight="fill" />
              <Text variant="callout" tone="success">
                {copy.notMuch.savedToast}
              </Text>
            </Animated.View>
          ) : (
            <Button variant="quiet" label={t.notMuchButton} className="self-center" onPress={keepNotMuch} accessibilityHint={copy.notMuch.confirmBody} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
