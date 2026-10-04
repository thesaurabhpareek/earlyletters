import { Redirect, router, useFocusEffect } from 'expo-router';
import { LampWash } from '@/components/ui/lamp-wash';
import { MicrophoneIcon, PencilSimpleIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useColorScheme } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { ageOn, ENGINE_VERSION, renderTemplate, selectPrompt } from '@scribe/core';
import { PROMPT_LIBRARY_VERSION, PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy, fill, greetingKey, pendingCopy } from '@/lib/copy';
import { ageText, dayDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { getActiveChildId, getFamily, listDrafts, listEntries, saveEntry, subscribe, todayISO, uuidv7, type Draft, type Family } from '@/lib/store';

const STANDARD = tokens.motion.standard;
/** Layout spring on the motion token; skipped under Reduce Motion (the entering fade carries the change). */
const REFLOW = LinearTransition.springify().stiffness(STANDARD.stiffness).damping(STANDARD.damping).mass(STANDARD.mass);

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Tonight() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const t = copy.tonight;
  const motion = useMotion();
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
  const dateline = (ageNow ? `${child} · ${ageNow}` : dayDate(today)).toUpperCase();

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
    setKeptLine(true);
  };

  const start = (mode: 'spoken' | 'typed') => {
    haptic('press');
    const params = { promptKey: prompt.key, promptLibraryVersion: String(PROMPT_LIBRARY_VERSION) };
    router.push({ pathname: mode === 'typed' ? '/write' : '/listen', params });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <LampWash anchor="top" intensity={0.8} />
      <ScrollView contentContainerClassName="flex-grow gap-6 px-5 pb-8 pt-4">
        <Animated.View entering={motion.enter(0)} className="gap-2">
          <Text className="text-xs font-medium tracking-[1.5px] text-muted-foreground">{dateline}</Text>
          <Text className="font-serif text-4xl leading-[44px] text-foreground">
            {fill(t.greeting[greetingKey()], { name: family.signsAs })}
          </Text>
          <Text className="text-lg leading-7 text-muted-foreground">{fill(t.subtitle, { child })}</Text>
        </Animated.View>

        <Animated.View key={prompt.key} entering={motion.enter(1)} layout={motion.reduced ? undefined : REFLOW}>
          <Card className="gap-4 rounded-3xl border-0 bg-card p-6 shadow-sm shadow-foreground/5 dark:border dark:border-border dark:shadow-none">
            <Text className="text-xs font-medium tracking-[1.2px] text-muted-foreground">{t.promptLabel.toUpperCase()}</Text>
            <Text className="font-serif text-2xl leading-9 text-foreground">{renderTemplate(prompt.text, { child })}</Text>
            <Pressable
              onPress={() => {
                haptic('tap');
                setShuffle((s) => s + 1);
              }}
              accessibilityRole="button"
              className="h-11 justify-center self-start">
              <Text className="text-base font-medium text-primary">{t.newPromptButton}</Text>
            </Pressable>
          </Card>
        </Animated.View>

        {waiting && (
          <Pressable
            onPress={() => router.push({ pathname: waiting.audioUri ? '/review' : '/write', params: { draftId: waiting.id } })}
            accessibilityRole="button"
            className="min-h-11 flex-row items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3">
            <Text className="flex-1 text-base text-foreground">{pendingCopy.tonight.waitingTitle}</Text>
            <Text className="text-base font-medium text-primary">{copy.review.title}</Text>
          </Pressable>
        )}

        <View className="flex-1" />

        {/* Controls never animate in (MOTION principle 2): opaque and hittable from frame 1. */}
        <View className="gap-3">
          <View className="flex-row gap-3">
            <Button size="capture" onPress={() => start('spoken')} accessibilityLabel={t.speakButton}>
              <MicrophoneIcon color={c.onAccent} size={24} weight="fill" />
              <Text>{t.speakButton}</Text>
            </Button>
            <Button size="capture" onPress={() => start('typed')} accessibilityLabel={t.typeButton}>
              <PencilSimpleIcon color={c.onAccent} size={24} weight="fill" />
              <Text>{t.typeButton}</Text>
            </Button>
          </View>
          {keptLine ? (
            <Animated.View entering={motion.enter()} className="h-11 items-center justify-center">
              <Text className="text-base text-success">{copy.notMuch.savedToast}</Text>
            </Animated.View>
          ) : (
            <Button variant="ghost" onPress={keepNotMuch}>
              <Text className="text-muted-foreground">{t.notMuchButton}</Text>
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
