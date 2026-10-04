/**
 * Read together (DESIGN_LANGUAGE 12, COMPONENTS 2.22, first slice).
 * Chrome-free, Large Print by default, one letter at a time, oldest first.
 * Voice playback with word highlight arrives with the audio player; until
 * then every letter reads as text and says where its recording is kept.
 *
 * Allowance (founder decision, Oct 2 2026): FREE_READ_TOGETHER_SESSIONS free
 * sessions on this phone, then the Plus gate (lib/read-together.ts).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { BookOpenTextIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { PlusGate } from '@/components/child/plus-gate';
import { authorOf } from '@/components/child/child-store';
import { chapterTitle, monthFor } from '@/components/book/chapters';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { devShortcutsAllowed } from '@/lib/build-env';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { canStartReadTogether, FREE_READ_TOGETHER_SESSIONS, recordReadTogetherSession } from '@/lib/read-together';
import { getActiveChild, getChild, listEntriesForChild } from '@/lib/store';

const BODY = tokens.type.letterBody;
/** Each half of the letter-to-letter cross-fade (out, then in): the standard 200 ms fade, also the Reduce Motion fallback. */
const CROSSFADE_MS = tokens.motion.reduceMotion.durationMs;

export default function ReadTogether() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const rt = copy.readTogether;
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const child = (childId ? getChild(childId) : null) ?? getActiveChild();
  const [allowed, setAllowed] = useState(canStartReadTogether);
  const counted = useRef(false);
  const [index, setIndex] = useState(0);
  const motion = useMotion();
  const fade = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const target = useRef(0); // where the reader is heading; rapid taps build on it
  const swap = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (swap.current && clearTimeout(swap.current)), []);

  const letters = useMemo(() => (child ? listEntriesForChild(child.id).filter((e) => e.inBook && e.transcriptStatus !== 'waiting').reverse() : []), [child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // One session per opening; counted once, only when allowed.
  useEffect(() => {
    if (allowed && !counted.current && letters.length > 0) {
      counted.current = true;
      recordReadTogetherSession();
    }
  }, [allowed, letters.length]);

  const close = () => router.back();

  if (!allowed) {
    const p = pendingCopy.readTogether;
    return (
      <SafeAreaView className="flex-1 bg-background">
        <PlusGate
          title={p.plusTitle}
          body={fill(p.plusBody, { count: FREE_READ_TOGETHER_SESSIONS })}
          keepNote={p.keepNote}
          icon={<BookOpenTextIcon size={28} color={c.accent} />}
          onNotNow={close}
          onContinueDev={devShortcutsAllowed ? () => setAllowed(true) : undefined}
        />
      </SafeAreaView>
    );
  }

  if (!child || letters.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-4 bg-background px-5">
        <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
          {rt.title}
        </Text>
        <Text className="text-lg leading-7 text-muted-foreground">{pendingCopy.readTogether.emptyBody}</Text>
        <Button className="self-start" onPress={close}>
          <Text>{copy.common.closeButton}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const done = index >= letters.length;
  const entry = letters[Math.min(index, letters.length - 1)];
  const signsAs = authorOf(entry, child);
  const month = monthFor(child, entry.occurredOn);
  const spoken = entry.captureMode !== 'typed';
  const scale = tokens.readingScale.largePrint;
  const go = (to: number) => {
    haptic('tap');
    const next = Math.max(0, Math.min(letters.length, to));
    target.current = next;
    // Cross-fade: current letter out, swap while hidden, new letter in. Interruptible.
    fade.value = motion.fade(0);
    if (swap.current) clearTimeout(swap.current);
    swap.current = setTimeout(() => {
      swap.current = null;
      setIndex(target.current);
      fade.value = motion.fade(1);
    }, CROSSFADE_MS);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Button variant="ghost" size="sm" className="-ml-4" onPress={close}>
          <Text className="text-primary">{copy.common.closeButton}</Text>
        </Button>
        <Text className="text-sm text-muted-foreground">{`${Math.min(index + 1, letters.length)} / ${letters.length}`}</Text>
      </View>

      <Animated.View style={fadeStyle} className="flex-1">
      {done ? (
        <View className="flex-1 justify-center gap-6 px-5" accessibilityLiveRegion="polite">
          <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
            {rt.endOfBook}
          </Text>
          <View className="gap-3">
            <Button size="lg" onPress={close}>
              <Text>{rt.finishButton}</Text>
            </Button>
            <Button variant="secondary" onPress={() => go(0)}>
              <Text>{rt.againButton}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <ScrollView key={entry.id} className="flex-1" contentContainerClassName="gap-6 px-5 pb-8 pt-6">
          <Text maxFontSizeMultiplier={2.4} className="text-sm font-medium tracking-[0.6px] text-muted-foreground">
            {month !== null && month > 0 ? fill(rt.nowReading, { signsAs, month }) : `${signsAs}, ${chapterTitle(month)}`}
          </Text>
          <Text
            selectable
            className="font-serif text-foreground"
            style={{ fontSize: BODY.fontSize * scale, lineHeight: BODY.lineHeight * scale }}>
            {entry.finalText}
          </Text>
          <Text
            className="self-end font-serif italic text-foreground"
            style={{ fontSize: BODY.fontSize * scale, lineHeight: BODY.lineHeight * scale }}>
            {fill(copy.book.signature, { signsAs })}
          </Text>
          <Text className="text-base text-muted-foreground">{spoken ? copy.book.recordingOnPhone : rt.noRecording}</Text>
        </ScrollView>
      )}
      </Animated.View>

      {!done && (
        <View className="flex-row gap-3 border-t border-border px-5 pb-2 pt-3">
          <Button variant="secondary" size="lg" className="flex-1 px-4" disabled={index === 0} onPress={() => go(target.current - 1)}>
            <Text>{rt.previousButton}</Text>
          </Button>
          <Button size="lg" className="flex-1 px-4" onPress={() => go(target.current + 1)}>
            <Text>{rt.nextButton}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
