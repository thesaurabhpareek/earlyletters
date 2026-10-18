/**
 * Tonight (EXPERIENCE_PASS_2026-10 S09 and S33, package P3; DESIGN_LANGUAGE 12): one question, every unfinished
 * letter, and Speak and Type, in the lamp's light.
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Things 3 "This Evening": time-of-day framing in the greeting.
 * - The website hero on main: one serif line on the lamp light, the greeting's two-tone "Asha is / asleep." move.
 * - Day One "On This Day": a month-old letter of the person's own, never a count.
 * - Airbnb sticky CTA: Speak and Type as equal twins, pinned in the thumb zone.
 *
 * Layout: the dateline ("Asha · 7 months", read aloud as "Asha, 7 months"); the greeting in title2, two tones; the
 * prompt as the one literary line (promptHero), on the paper with no card, its caps label now only its accessibility
 * hint; "Another thought"; then one card per draft from listDrafts, newest first, no totals (or, when none is waiting,
 * "A month ago"); Speak and Type pinned below, so several drafts scroll above them.
 *
 * Light: the `tonight` lamp scene, its tones from the greeting's own daypart (gold in the morning, amber in the
 * evening, a rose tail at night, a dusk tail late at night), breathing; persistKey "tabs", so a tab switch settles the
 * light instead of cutting it (5.8 row 6). Under Listen or a letter it leaves and returns (useUnlitRoom in those
 * rooms, rows 1 and 2); under Write's sheet it holds and pauses its breath (row 3a). Once today is kept as a quiet day,
 * the evening light goes down to 70 percent (S33). Increase Contrast and Reduce Transparency: plain paper.
 *
 * Motion: the dateline, greeting, prompt and cards enter once per cold launch (280 ms, 30 ms stagger, MOTION 5a); a
 * warm resume, a tab switch and a return from Listen, Review, Write or a letter move nothing (5.8 rule 2). Speak and
 * Type never animate in (MOTION principle 2). "Another thought": the old prompt leaves (exitMs) and the new one rises
 * in from when it is half gone. Reduce Motion: one 200 ms fade on a prompt change.
 * Haptics: Speak / Type `press` (a capture starts), Another thought `tap`, Not much today `soft`. Nothing else.
 * Not much today saves a mark with no words (D-084); the kept line carries an inline Undo. Nothing on Tonight counts:
 * no totals, no days-since, no streak.
 * Time: the day, the greeting's daypart, the lamp's tone and each card's dateline come from the moment the room was
 * read (roomClock), and the room is read again on focus, on a change in the store and when the app comes back to the
 * front, so none of them is left from before the app went to the background.
 */
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { ageOn, renderTemplate, selectPrompt } from '@scribe/core';
import { PROMPT_LIBRARY_VERSION, PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { markOn, newQuietMark } from '@/components/book/quiet-day.logic';
import { CardSource, useHiddenBehindCardPage } from '@/components/motion/card-transition';
import { DraftCard } from '@/components/tonight/draft-card';
import {
  draftCards,
  greetingParts,
  resumed,
  resurfaced,
  roomClock,
  tonightArrival,
  tonightDateline,
  tonightLampIntensity,
} from '@/components/tonight/draft-card.logic';
import { QuietDayInline } from '@/components/tonight/quiet-day-inline';
import { ResurfacedCard } from '@/components/tonight/resurfaced-card';
import { Button, ButtonRow } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { announce } from '@/lib/a11y';
import { childIndexOf, promptKindOf, trackCaptureStarted } from '@/lib/analytics/track';
import { copy } from '@/lib/copy';
import { ageText, dayDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { STANDARD_EASING, useMotion } from '@/lib/motion';
import { armListenStart } from '@/lib/resilience/start-intent';
import {
  deleteEntry,
  getActiveChildId,
  getFamily,
  listDrafts,
  listEntries,
  saveEntry,
  subscribe,
  todayISO,
  uuidv7,
  type Draft,
  type Entry,
  type Family,
} from '@/lib/store';

const M = tokens.motion;

/**
 * What Tonight shows: the book, every waiting draft (listDrafts, all of them), the book's entries, and the moment they
 * were read. The day, the greeting's daypart, the lamp's tone and each card's dateline all come from `at`, so a room read
 * again (on focus, on a change in the store, on coming back from the background) is never stale.
 */
type Room = { family: Family | null; drafts: Draft[]; entries: Entry[]; at: Date };

function readRoom(): Room {
  const childId = getActiveChildId();
  return { family: getFamily(), drafts: childId ? listDrafts(childId) : [], entries: listEntries(), at: new Date() };
}

export default function Tonight() {
  const motion = useMotion();
  const t = copy.tonight;
  const [room, setRoom] = useState<Room | undefined>(undefined);
  // Prompt inputs are read on focus and on coming back to the front only, so a save or a quiet-day mark never swaps
  // the prompt under the person.
  const [recent, setRecent] = useState<string[]>([]);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(0);
  // The mark kept for today while its line is showing (so Undo knows what to remove).
  const [keptMark, setKeptMark] = useState<string | null>(null);
  // Tonight's lines enter once per cold launch, on the first render that shows them; a later mount, and a card that
  // appears later (a typed draft when Write closes), is already in place.
  const [arriving, setArriving] = useState(() => tonightArrival.pending());
  // While a card's page is up (CardToPage), Tonight is hidden from screen readers under it.
  const behind = useHiddenBehindCardPage();

  const load = useCallback(() => setRoom(readRoom()), []);
  const focused = useRef(false);

  // Child switcher, saves, drafts and marks elsewhere update Tonight live.
  useEffect(() => subscribe(load), [load]);

  // The room and the prompt's inputs, read again: on focus, and when the app comes back to the front.
  const refresh = useCallback(() => {
    load();
    const entries = listEntries();
    setRecent(entries.map((e) => e.promptKey).filter((k): k is string => !!k));
    setDaysSince(entries[0] ? Math.floor((Date.parse(todayISO()) - Date.parse(entries[0].occurredOn)) / 864e5) : null);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      refresh();
      return () => {
        focused.current = false;
        // The kept line stays until Undo or until the person leaves Tonight (S33).
        setKeptMark(null);
      };
    }, [refresh]),
  );

  // Back from the background (after midnight, or into another part of the day): the day, the greeting, the lamp's
  // tone, the cards' datelines and the drafts are read again. A tab behind another one waits for its own focus.
  useEffect(() => {
    let last = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (resumed(last, next) && focused.current) refresh();
      last = next;
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (!room?.family || !arriving) return;
    tonightArrival.done();
    setArriving(false);
  }, [room?.family, arriving]);

  const clock = roomClock(room?.at ?? new Date());
  const today = clock.today;
  const family = room?.family;
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

  const cards = useMemo(() => draftCards(room?.drafts ?? [], room?.at), [room?.drafts, room?.at]);
  const monthAgo = useMemo(() => resurfaced(room?.entries ?? [], today, cards.length), [room?.entries, today, cards.length]);

  if (room === undefined) return null;
  if (room.family === null) return <Redirect href="/onboarding" />;
  const book = room.family;

  const child = book.childName;
  const daypart = clock.daypart;
  const greeting = greetingParts(t.greeting[daypart], book.signsAs);
  const dateline = tonightDateline(child, ageText({ birthday: book.childBirthday }, today), dayDate(today));
  // S33: lights down for the evening once today is kept as a quiet day; Undo brings the light back.
  const lampLevel = tonightLampIntensity(daypart, !!markOn(room.entries, today));
  const enter = (i: number) => (arriving ? motion.enter(i) : undefined);

  // "Another thought": the old prompt leaves (exit), the new one rises in from when it is half gone. Reduce Motion: one fade.
  const promptIn = motion.reduced
    ? FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never)
    : FadeInDown.duration(M.enter.durationMs).delay(Math.round(M.exitMs / 2)).easing(STANDARD_EASING);
  const promptOut = motion.reduced ? undefined : motion.leave();
  // "Not much today": the link fades out over exitMs; the kept line fades in over fadeMs from when it is half gone.
  const linkOut = FadeOut.duration(M.exitMs).reduceMotion(ReduceMotion.Never);
  const lineIn = FadeIn.duration(M.fadeMs).delay(Math.round(M.exitMs / 2)).reduceMotion(ReduceMotion.Never);

  const keepNotMuch = () => {
    // One mark a day: a second tap adds nothing. The words are never written by the app (D-084).
    // Today by the clock at the tap, not the room's last read.
    const day = todayISO();
    const existing = markOn(listEntries(), day);
    const mark = existing ?? newQuietMark({ id: uuidv7(), occurredOn: day, capturedAt: new Date().toISOString() });
    if (!existing) saveEntry(mark);
    haptic('soft');
    announce(copy.notMuch.savedToast);
    setKeptMark(mark.id);
  };

  const undoNotMuch = () => {
    if (keptMark) deleteEntry(keptMark);
    setKeptMark(null);
  };

  const start = (mode: 'spoken' | 'typed') => {
    const params = { promptKey: prompt.key, promptLibraryVersion: String(PROMPT_LIBRARY_VERSION) };
    const active = getActiveChildId();
    trackCaptureStarted({ mode, source: 'tonight', promptKind: promptKindOf(prompt.key), childIndex: childIndexOf(active), role: 'parent' });
    if (mode === 'spoken') armListenStart(); // the tap that lets Listen start the microphone
    router.push({ pathname: mode === 'typed' ? '/write' : '/listen', params });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background" {...behind}>
      <Lamp scene="tonight" daypart={daypart} persistKey="tabs" intensity={lampLevel} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 pt-5">
        <Animated.View entering={enter(0)}>
          <Text variant="letterDateline" caps accessibilityLabel={dateline.a11y}>
            {dateline.text}
          </Text>
        </Animated.View>

        <Animated.View entering={enter(1)} className="mt-3">
          <Text variant="title2" asHeading={1}>
            {greeting.lead}
            <Text variant="title2" tone="muted">
              {greeting.rest}
            </Text>
          </Text>
        </Animated.View>

        {/* The one question on screen: the prompt, on the paper. Its old caps label is now only its hint. */}
        <Animated.View entering={enter(2)} className="mt-6">
          <Animated.View key={prompt.key} entering={shuffle === 0 ? undefined : promptIn} exiting={promptOut}>
            <Text variant="promptHero" accessibilityHint={t.promptLabel}>
              {renderTemplate(prompt.text, { child })}
            </Text>
          </Animated.View>
          <Button
            variant="quiet"
            size="sm"
            icon={ArrowsClockwiseIcon}
            label={t.newPromptButton}
            className="-ml-4 mt-3 self-start"
            onPress={() => {
              haptic('tap');
              setShuffle((s) => s + 1);
            }}
          />
        </Animated.View>

        {cards.length > 0 ? (
          <View className="mt-8 gap-3">
            {cards.map((card, i) => (
              <Animated.View key={card.id} entering={enter(3 + i)}>
                <DraftCard card={card} onPress={() => router.push(card.route)} />
              </Animated.View>
            ))}
          </View>
        ) : monthAgo ? (
          <Animated.View entering={enter(3)} className="mt-8">
            <CardSource id={monthAgo.id}>
              <ResurfacedCard card={monthAgo} onPress={() => router.push({ pathname: '/letter/[id]', params: { id: monthAgo.id } })} />
            </CardSource>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Pinned: Speak and Type are opaque and hittable from the first frame (MOTION principle 2). */}
      <View className="gap-2 px-5 pb-3 pt-3">
        <ButtonRow>
          <Button size="capture" icon={MicrophoneIcon} label={t.speakButton} haptic="press" onPress={() => start('spoken')} />
          <Button size="capture" icon={PencilSimpleIcon} label={t.typeButton} haptic="press" onPress={() => start('typed')} />
        </ButtonRow>
        {keptMark ? (
          <QuietDayInline onUndo={undoNotMuch} entering={lineIn} />
        ) : (
          <Animated.View exiting={linkOut} className="self-center">
            <Button variant="quiet" label={t.notMuchButton} onPress={keepNotMuch} accessibilityHint={copy.notMuch.confirmBody} />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
