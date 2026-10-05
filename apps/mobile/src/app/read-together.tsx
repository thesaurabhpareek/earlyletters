/**
 * Read together (DESIGN_LANGUAGE 12, COMPONENTS 2.22).
 * Chrome-free, Large Print by default, one letter at a time, oldest first.
 * v1.0 is plain playback (founder decision 3 Oct 2026): your own recordings
 * on this phone play in the voice that said them; word highlighting is v1.1.
 * Anyone else's letter, or a recording not on this phone, is read aloud.
 *
 * No limit (D-082, D-083, 4 Oct 2026): Read together is free for every letter
 * that exists. Membership gates adding letters (the Keep step), never reading
 * or playing them.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Toggle } from '@/components/platform/toggle';
import { tokens } from '@scribe/design-tokens';
import { AudioPlayer } from '@/components/player/audio-player';
import { authorOf } from '@/components/child/child-store';
import { chapterTitle, monthFor } from '@/components/book/chapters';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { childIndexOf, trackReadTogetherEnded, trackReadTogetherStarted } from '@/lib/analytics/track';
import { hasPlus } from '@/lib/billing';
import { AppNote } from '@/components/book/app-note';
import { bookCopy } from '@/components/book/copy';
import { letterWords } from '@/components/book/letter-words.logic';
import { readableInBook, showsSignature } from '@/components/book/quiet-day.logic';
import { getActiveChild, getChild, listEntriesForChild } from '@/lib/store';
import { useTheme } from '@/lib/a11y';
import { KEEP_AWAKE_TAGS, useKeepAwakeWhile } from '@/lib/resilience/keep-awake';


export default function ReadTogether() {
  const c = useTheme().c;
  const rt = copy.readTogether;
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const child = (childId ? getChild(childId) : null) ?? getActiveChild();
  const counted = useRef(false);
  const [index, setIndex] = useState(0);
  // "Play the next one on its own": after a recording ends, turn the page and start the next voice.
  const [autoNext, setAutoNext] = useState(false);
  const [startNext, setStartNext] = useState(false);

  const letters = useMemo(() => (child ? readableInBook(listEntriesForChild(child.id)).reverse() : []), [child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // One session per opening, counted once (analytics only; nothing limits sessions).
  const session = useRef<{ startedAt: number; furthest: number } | null>(null);
  useEffect(() => {
    if (!counted.current && letters.length > 0) {
      counted.current = true;
      session.current = { startedAt: Date.now(), furthest: 0 };
      trackReadTogetherStarted({ childIndex: childIndexOf(child?.id), access: hasPlus() ? 'plus' : 'free', letters: letters.length });
    }
  }, [letters.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session.current) session.current.furthest = Math.max(session.current.furthest, index);
  }, [index]);
  // Ended when the screen goes away: finished if the last page was reached, else stopped.
  useEffect(
    () => () => {
      const s = session.current;
      if (!s) return;
      // `furthest` is a page index; past the last page means the end of the book was reached.
      trackReadTogetherEnded({
        reason: s.furthest >= letters.length ? 'finished' : 'stopped',
        durationMs: Date.now() - s.startedAt,
        lettersHeard: Math.min(s.furthest + 1, letters.length),
      });
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Letters are playing or being read aloud: keep the screen on while the reading pages are showing.
  useKeepAwakeWhile(!!child && letters.length > 0, KEEP_AWAKE_TAGS.readTogether);

  const close = () => router.back();

  if (!child || letters.length === 0) {
    // The one state pattern; a modal, so Close is the header's, top right.
    return <StateScreen kind="empty" art="moon" title={rt.title} body={pendingCopy.readTogether.emptyBody} header={<ModalHeader onClose={close} />} />;
  }

  const done = index >= letters.length;
  const entry = letters[Math.min(index, letters.length - 1)];
  const signsAs = authorOf(entry, child);
  const month = monthFor(child, entry.occurredOn);
  const spoken = entry.captureMode !== 'typed';
  const scale = tokens.readingScale.largePrint;
  const go = (to: number, auto = false) => {
    if (!auto) haptic('tap');
    setStartNext(auto);
    setIndex(Math.max(0, Math.min(letters.length, to)));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ModalHeader
        onClose={close}
        leading={<Text variant="subhead" tone="muted">{`${Math.min(index + 1, letters.length)} / ${letters.length}`}</Text>}
      />

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
          <Text variant="letterDateline">
            {month !== null && month > 0 ? fill(rt.nowReading, { signsAs, month }) : `${signsAs}, ${chapterTitle(month)}`}
          </Text>
          {letterWords(entry) === 'nobodySpoke' ? (
            <AppNote scale={scale}>{bookCopy.nobodySpoke}</AppNote>
          ) : (
            <Text variant="letterBody" scale={scale} selectable>
              {entry.finalText}
            </Text>
          )}
          {showsSignature(letterWords(entry)) ? (
            <Text variant="signature" scale={scale} className="self-end">
              {fill(copy.book.signature, { signsAs })}
            </Text>
          ) : null}
          {spoken ? (
            <AudioPlayer
              key={entry.id}
              entryId={entry.id}
              context="readTogether"
              autoPlay={autoNext && startNext}
              onFinish={() => {
                if (autoNext) go(index + 1, true);
              }}
            />
          ) : (
            <Text className="text-base text-muted-foreground">{rt.noRecording}</Text>
          )}
          <View className="min-h-11 flex-row items-center gap-3">
            <Text className="flex-1 text-base text-foreground">{rt.autoplayLabel}</Text>
            <Toggle label={rt.autoplayLabel} value={autoNext} onValueChange={setAutoNext} />
          </View>
        </ScrollView>
      )}

      {!done && (
        <View className="flex-row gap-3 border-t border-border px-5 pb-2 pt-3">
          <Button variant="secondary" size="lg" className="flex-1 px-4" disabled={index === 0} onPress={() => go(index - 1)}>
            <Text>{rt.previousButton}</Text>
          </Button>
          <Button size="lg" className="flex-1 px-4" onPress={() => go(index + 1)}>
            <Text>{rt.nextButton}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
