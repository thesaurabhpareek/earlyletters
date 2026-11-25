/**
 * Read together (DESIGN_LANGUAGE 12, COMPONENTS 2.22, EXPERIENCE_PASS S30 to S32; 5.8 row 8).
 * Chrome-free, Large print by default, one letter at a time, oldest first, turned like the pages of a book: "Next
 * letter" moves the page 24 pt left and fades it while the next arrives from the right (PageTurn); a swipe does the
 * same and follows the finger. No curl, no counter: a 2 pt hairline under the top bar shows how far along, and
 * VoiceOver hears "Letter 1 of 5". The dateline reads "Month 4 · From Mama" and is heard "Month 4, from Mama".
 * At night the room has one still dusk pool low behind the controls (the `readTogether` scene arrives once per
 * opening, never moves, never behind the words); the Book's own light leaves while this room is up.
 * The end of the book: the moon draws on once, the pool dims to half, then nothing moves.
 *
 * v1.0 is plain playback (founder decision 3 Oct 2026): your own recordings on this phone play in the voice that
 * said them; no word highlight (D-059). Anyone else's letter, or a recording not on this phone, is read aloud.
 * No haptics (playback has none, MOTION 6).
 *
 * No limit (D-082, D-083, 4 Oct 2026): Read together is free for every letter that exists. Membership gates adding
 * letters (the Keep step), never reading or playing them.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { AudioPlayer } from '@/components/player/audio-player';
import { authorOf } from '@/components/child/child-store';
import { monthFor, readingDateline } from '@/components/book/chapters';
import { PageTurn, type PageDirection } from '@/components/motion/page-turn';
import { Button } from '@/components/ui/button';
import { Lamp, useUnlitRoom } from '@/components/ui/lamp';
import { LineArt } from '@/components/ui/line-art';
import { PinnedActionLayout } from '@/components/ui/pinned-action';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { announce, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { childIndexOf, trackReadTogetherEnded, trackReadTogetherStarted } from '@/lib/analytics/track';
import { hasPlus } from '@/lib/billing';
import { useReducedMotion } from '@/lib/motion';
import { readTogetherOrder, type ReadTogetherPart } from '@/lib/play-placement.logic';
import { READ_TOGETHER_HEADER_SWIPE, swipeLeaves } from '@/lib/reader-words.logic';
import { AppNote } from '@/components/book/app-note';
import { bookCopy } from '@/components/book/copy';
import { letterWords } from '@/components/book/letter-words.logic';
import { readableInBook, showsSignature } from '@/components/book/quiet-day.logic';
import { endOfYearLine, readTheYearOn } from '@/components/book/read-year.logic';
import { readTogetherPlan } from '@/components/book/read-from-here.logic';
import { buttonPlacement, pageButtonsClass, turnControls, type TurnButton } from '@/components/book/turn-controls.logic';
import { getActiveChild, getChild, getSetting, listEntriesForChild, setSetting, type Child, type Entry } from '@/lib/store';

/** "Keep playing" is remembered across sessions (S30). A setting on this phone, never synced. */
const KEEP_PLAYING = 'readTogether.keepPlaying';
/** The page key of the end of the book. */
const END = 'end';

export default function ReadTogether() {
  const rt = copy.readTogether;
  const { childId, year, from } = useLocalSearchParams<{ childId?: string; year?: string; from?: string }>();
  const child = (childId ? getChild(childId) : null) ?? getActiveChild();
  const counted = useRef(false);
  // Only what readableInBook lets through (D-084); the whole book oldest first, or one year. `from` opens it at a letter
  // (Read from here, BL-1792); a year wins over it, and a stale `from` opens at the first letter (read-from-here.logic.ts).
  const plan = useMemo(() => (child ? readTogetherPlan(readableInBook(listEntriesForChild(child.id)), child, { yearsOn: readTheYearOn(process.env.EXPO_PUBLIC_READ_THE_YEAR), year, from }) : { letters: [], start: 0 }), [child?.id, year, from]); // eslint-disable-line react-hooks/exhaustive-deps
  const letters = plan.letters;
  const [index, setIndex] = useState(plan.start);
  const [direction, setDirection] = useState<PageDirection>('next');
  // "Keep playing": after a recording ends, turn the page and start the next voice.
  const [autoNext, setAutoNext] = useState(() => getSetting(KEEP_PLAYING) === '1');
  const [startNext, setStartNext] = useState(false);
  // At accessibility text sizes the two page buttons stack, full width, "Next letter" first (S4).
  const accessibilitySize = useIsAccessibilitySize();
  const turn = turnControls(accessibilitySize);
  // From AX1 up the buttons are the end of the letter's scroll, not pinned (BL-1791).
  const placement = buttonPlacement(accessibilitySize);
  useUnlitRoom();

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

  // VoiceOver hears where it is after a turn ("Letter 2 of 5"); the screen shows only the hairline.
  const turned = useRef(false);
  useEffect(() => {
    if (!turned.current) {
      turned.current = true;
      return;
    }
    if (index < letters.length) announce(fill(rt.positionA11y, { n: index + 1, count: letters.length }));
  }, [index, letters.length, rt.positionA11y]);

  const close = () => router.back();

  if (!child || letters.length === 0) {
    // The one state pattern; a modal, so Close is the header's, top right. A stale link still has a way forward.
    const write = { label: copy.book.empty.bookCta, onPress: () => router.dismissTo('/'), testID: 'readTogether.write' };
    return <StateScreen kind="empty" art="moon" title={rt.title} body={pendingCopy.readTogether.emptyBody} header={<ModalHeader onClose={close} />} primary={write} />;
  }

  const done = index >= letters.length;
  const pageKey = done ? END : letters[index].id;
  const go = (to: number, auto = false) => {
    const next = Math.max(0, Math.min(letters.length, to));
    if (next === index) return;
    setDirection(next > index ? 'next' : 'back');
    setStartNext(auto);
    setIndex(next);
  };
  const keepPlaying = (on: boolean) => {
    setAutoNext(on);
    setSetting(KEEP_PLAYING, on ? '1' : '0');
  };
  const position = fill(rt.positionA11y, { n: Math.min(index + 1, letters.length), count: letters.length });

  return (
    <View className="flex-1 bg-background">
      {/* Night only (the scene resolves to nothing by day): one still dusk pool, low behind the controls. */}
      <Lamp scene="readTogether" arrive intensity={done ? 0.5 : 1} />
      <SafeAreaView className="flex-1">
        <SwipeDownToLeave onLeave={close}>
          <View>
            <ModalHeader onClose={close} />
          </View>
        </SwipeDownToLeave>
        <Progress fraction={done ? 1 : (index + 1) / letters.length} label={position} />
        <PageTurn
          pageKey={pageKey}
          direction={direction}
          canNext={!done}
          canBack={index > 0}
          onSwipe={(d) => go(d === 'next' ? index + 1 : index - 1)}
          renderPage={(key) => {
            if (key === END) return <EndOfBook onClose={close} onAgain={() => go(0)} line={year && readTheYearOn(process.env.EXPO_PUBLIC_READ_THE_YEAR) ? endOfYearLine(year, child.name) : undefined} />;
            const i = letters.findIndex((e) => e.id === key);
            const entry = letters[i];
            if (!entry) return null;
            return (
              <LetterPage
                entry={entry}
                child={child}
                current={key === pageKey}
                autoPlay={autoNext && startNext && key === pageKey}
                onFinish={() => {
                  if (autoNext) go(i + 1, true);
                }}
                playFirst={accessibilitySize}
                keepPlaying={autoNext}
                onKeepPlaying={keepPlaying}
                buttons={placement === 'inline' ? <PageButtons turn={turn} placement={placement} index={index} go={go} /> : null}
              />
            );
          }}
        />

        {!done && placement === 'pinned' ? <PageButtons turn={turn} placement={placement} index={index} go={go} /> : null}
      </SafeAreaView>
    </View>
  );
}

/** A swipe down on the top bar leaves Read together when READ_TOGETHER_HEADER_SWIPE is on (off until a device check); Close stays the button for it (BL-1823). */
function SwipeDownToLeave({ onLeave, children }: { onLeave: () => void; children: ReactNode }) {
  // One path out: the first leave wins, so the gesture can never pop twice.
  const left = useRef(false);
  const leaveOnce = () => {
    if (left.current) return;
    left.current = true;
    onLeave();
  };
  const swipe = Gesture.Pan()
    .enabled(READ_TOGETHER_HEADER_SWIPE)
    .activeOffsetY(16)
    .failOffsetX([-16, 16])
    .onEnd((e) => {
      if (swipeLeaves(e.translationY, e.velocityY)) runOnJS(leaveOnce)();
    });
  return <GestureDetector gesture={swipe}>{children}</GestureDetector>;
}

/** "Back one" and "Next letter": pinned under the letter at the usual sizes, the end of the scroll from AX1 up (BL-1791). */
function PageButtons({ turn, placement, index, go }: { turn: ReturnType<typeof turnControls>; placement: 'pinned' | 'inline'; index: number; go: (to: number) => void }) {
  const rt = copy.readTogether;
  return (
    <View className={pageButtonsClass(turn.stacked, placement)}>
      {turn.order.map((which: TurnButton) =>
        which === 'back' ? (
          <Button
            key="back"
            variant="secondary"
            size="lg"
            className={turn.stacked ? 'px-4' : 'flex-1 px-4'}
            fullWidth={turn.stacked}
            disabled={index === 0}
            onPress={() => go(index - 1)}
            label={rt.previousButton}
            testID="readTogether.back"
          />
        ) : (
          <Button key="next" size="lg" className={turn.stacked ? 'px-4' : 'flex-1 px-4'} fullWidth={turn.stacked} onPress={() => go(index + 1)} label={rt.nextButton} testID="readTogether.next" />
        ),
      )}
    </View>
  );
}

/** How far along: a 2 pt hairline under the top bar, accent at 40 percent. Never "1 / 5"; VoiceOver hears "Letter 1 of 5". */
function Progress({ fraction, label }: { fraction: number; label: string }) {
  const { c } = useTheme();
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={label} testID="readTogether.progress" style={{ height: 2 }}>
      <View style={{ height: 2, width: `${Math.round(fraction * 1000) / 10}%`, backgroundColor: c.accent, opacity: 0.4 }} />
    </View>
  );
}

function LetterPage({
  entry,
  child,
  current,
  autoPlay,
  onFinish,
  playFirst,
  keepPlaying,
  onKeepPlaying,
  buttons,
}: {
  entry: Entry;
  child: Child;
  current: boolean;
  autoPlay: boolean;
  onFinish: () => void;
  /** From AX1 up Play and the Keep playing chip sit directly under the dateline (BL-1789). */
  playFirst: boolean;
  keepPlaying: boolean;
  onKeepPlaying: (on: boolean) => void;
  /** The page buttons, at the end of this scroll (AX1 and up); only on the page that is showing. */
  buttons?: ReactNode;
}) {
  const rt = copy.readTogether;
  const signsAs = authorOf(entry, child);
  const dateline = readingDateline(monthFor(child, entry.occurredOn), signsAs);
  const spoken = entry.captureMode !== 'typed';
  const scale = tokens.readingScale.largePrint;
  const words = letterWords(entry);
  const player = spoken ? (
    <AudioPlayer entryId={entry.id} context="readTogether" autoPlay={autoPlay} onFinish={onFinish} />
  ) : (
    <Text variant="body" tone="muted">
      {rt.noRecording}
    </Text>
  );
  // The order is one pure table (play-placement.logic.ts): Play, then its chip, directly under the dateline from AX1 up.
  const parts: Record<ReadTogetherPart, ReactNode> = {
    dateline: (
      <Text variant="letterDateline" accessibilityLabel={dateline.spoken} testID={current ? 'readTogether.dateline' : undefined}>
        {dateline.text}
      </Text>
    ),
    words:
      words === 'nobodySpoke' ? (
        <AppNote scale={scale}>{bookCopy.nobodySpoke}</AppNote>
      ) : (
        <Text variant="letterBody" scale={scale} selectable>
          {entry.finalText}
        </Text>
      ),
    signature: (
      <Text variant="signature" scale={scale} className="self-end">
        {fill(copy.book.signature, { signsAs })}
      </Text>
    ),
    play: player,
    noRecording: player,
    keepPlaying: <KeepPlayingChip on={keepPlaying} onChange={onKeepPlaying} />,
    pageButtons: current ? buttons : null,
  };
  const order = readTogetherOrder({ playFirst, spoken, signature: showsSignature(words) });
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-8 pt-6">
      {order.map((part) => (
        <Fragment key={part}>{parts[part]}</Fragment>
      ))}
    </ScrollView>
  );
}

/** "Keep playing" as a quiet chip under the player (not a settings row): a switch to VoiceOver, remembered. */
function KeepPlayingChip({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const { c } = useTheme();
  const label = copy.readTogether.autoplayLabel;
  return (
    <Pressable
      role="switch"
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      aria-checked={on}
      onPress={() => onChange(!on)}
      hitSlop={6}
      testID="readTogether.keepPlaying"
      className="min-h-11 flex-row items-center gap-1.5 self-start rounded-full px-4"
      style={{ borderWidth: on ? 1.5 : 1, borderColor: on ? c.accent : c.controlBorder, backgroundColor: on ? c.accentSoft : 'transparent' }}>
      {on ? <CheckIcon size={16} color={c.accent} weight="bold" /> : null}
      <Text variant="labelSmall" tone={on ? 'accent' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The end of the book (S31): the moon draws on once above the line, then nothing moves. Buttons from the first frame. */
function EndOfBook({ onClose, onAgain, line }: { onClose: () => void; onAgain: () => void; line?: string }) {
  // A year ends on its own line (BL-947): the same heading, other words.
  const rt = line ? { ...copy.readTogether, endOfBook: line } : copy.readTogether;
  const reduced = useReducedMotion();
  return (
    <PinnedActionLayout
      center
      insetBottom={false}
      contentContainerClassName="gap-8 px-5"
      action={
        <View className="gap-3">
          <Button size="lg" fullWidth onPress={onClose} label={rt.finishButton} />
          <Button variant="secondary" size="lg" fullWidth onPress={onAgain} label={rt.againButton} />
        </View>
      }
      testID="readTogether.end">
      {/* The live region is the moon and the line, which is what changes. The buttons stay outside it: hearing their
          labels read out again on every change is noise (BL-1519). */}
      <View accessibilityLiveRegion="polite" className="gap-8" testID="readTogether.end.live">
        <LineArt name="moon" width={140} animate={!reduced} style={{ alignSelf: 'center' }} />
        <Text variant="title1" asHeading>
          {rt.endOfBook}
        </Text>
      </View>
    </PinnedActionLayout>
  );
}
