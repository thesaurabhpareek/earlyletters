/**
 * A letter, as a page (DESIGN_LANGUAGE 12, EXPERIENCE_PASS S27, S28, S35 to S37; 5.8 row 7): a page, not a card.
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Apple Books: reader-owned "Aa" Reading Size in a small sheet, the page changing live
 *   behind it; text never animates its size, it cross-fades (MOTION 5i).
 * - Day One: the recording and its words in one entry; the voice comes first after the text.
 * - Apple Settings inset list for the few actions (Add to book, Make private, Delete).
 * - Delete asks first (D-085, "Keep it" is the default), then returns to the Book at once, where the card leaves
 *   its row and "Letter deleted." waits with Undo (S36; TDD 09 A11Y-F03: the person's tap, never a timer).
 *
 * Card to page (P1's contract, MOTION 5f): the page opens in the card's text column (36 pt from each edge, the
 * card's type and gaps), and its opening (the card's dateline and the whole letter) is drawn by CardToPage and
 * placed here with PageOpening, so the card's words travel into the page without a reflow. Screen readers land on
 * the dateline when the page has arrived, and cannot reach the Book behind it. The page draws its own Back and "Aa"
 * then, and Back, a swipe down on the top bar or Android's back puts the words back into their card. While the root
 * stack still pushes this route (lib/transitions.logic ROUTES, P1's table), the page is the plain pushed page with
 * the native header: nothing grows inside a push.
 *
 * No lamp and no loop: a voice plays here (useUnlitRoom fades the Book's light while the page is up). Haptics: `tap`
 * for private / book, `warning` for Delete. Nothing on open or scroll.
 */
import { Redirect, router, Stack, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PencilSimpleLineIcon } from 'phosphor-react-native/src/icons/PencilSimpleLine';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { CardToPage, PageOpening, cardRects, useCardToPageClose, type Opening } from '@/components/motion/card-transition';
import { lineHeightFor } from '@/components/motion/excerpt-fade.logic';
import { AudioPlayer } from '@/components/player/audio-player';
import { Button, LARGE_CONTENT } from '@/components/ui/button';
import { useUnlitRoom } from '@/components/ui/lamp';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { UIProvider } from '@/components/ui/provider';
import { BackButton, ModalHeader } from '@/components/ui/screen-header';
import { Sheet } from '@/components/ui/sheet';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useFontScale, useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { letterDateline } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { planFor } from '@/lib/models/speech-packs';
import { clearReadItBack, isReadItBack } from '@/lib/read-it-back';
import {
  deleteEntry,
  getActiveChild,
  getChild,
  getEntry,
  listDeleted,
  setEntryInBook,
  setTypedWordsForWaitingEntry,
  subscribeTo,
  undeleteEntry,
  type Child,
  type Entry,
} from '@/lib/store';
import { useReducedMotion } from '@/lib/motion';
import { ROUTES, canCarry, type Move } from '@/lib/transitions.logic';
import { languageFor, retryWords, startSpeechDownload, waitingForLanguageNote } from '@/lib/transcription-queue';
import { wordsCopy } from '@/lib/transcription-queue/copy';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { AppNote } from '@/components/book/app-note';
import { belowIsBook, bookHandoff, pageRestPlan, type NavState } from '@/components/book/book.logic';
import { provenanceOf, shortDateline } from '@/components/book/chapters';
import { ConfirmSheet } from '@/components/book/confirm-sheet';
import { CARD_TEXT_GAP, CARD_TEXT_INSET, PrivateChip, excerptOf } from '@/components/book/letter-card';
import { letterWords } from '@/components/book/letter-words.logic';
import { isQuietMark, showsSignature } from '@/components/book/quiet-day.logic';
import { ReadingSizeSheet } from '@/components/book/reading-size-sheet';
import { authorOf, getReadingSize, isOwnEntry, setReadingSize, type ReadingSize } from '@/components/child/child-store';

/**
 * How the root stack brings this page on (P1's table, EXPERIENCE_PASS 5.8 row 7). Card to page once P1 switches the
 * row; a push until then.
 */
const CARD_MODE = (ROUTES['letter/[id]'].move as Move) === 'cardToPage';
/** CardToPage waits up to 4 frames for the card's and the page's measures before it moves (card-transition.tsx). */
const MEASURE_MS = 4 * 16;
/** The rest of the page shows once the carried words are this close to home: under the gap below them. */
const REST_WITHIN_PT = 4;
/** On Back the rest of the page leaves this fast (six frames), before the words go back: a quick, legible answer. */
const REST_OUT_MS = 96;

/** UIProvider is a no-op once the root layout mounts it (Sheet and Toast need it). */
export default function LetterScreen() {
  return (
    <UIProvider>
      <Letter />
    </UIProvider>
  );
}

/** Leaves the page: the way it came (card to page), or the platform's back (a push). Never strands a deep link. */
function useLeave(): () => void {
  const cardClose = useCardToPageClose();
  return CARD_MODE ? cardClose : goBack;
}
function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/book');
}

function Letter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null | undefined>(() => getEntry(id));
  const [size, setSize] = useState<ReadingSize>(getReadingSize);
  const [showOriginal, setShowOriginal] = useState(false);
  const fontScale = useFontScale();
  useUnlitRoom();

  // The page follows the store: words that arrive while it is open appear without leaving and reopening (J10-01).
  useEffect(
    () =>
      subscribeTo('entries', () => {
        setEntry((prev) => (prev === null ? prev : (getEntry(id) ?? prev)));
      }),
    [id],
  );

  // letter_opened once per open (who wrote it, relative to you, and whether it has a recording; never which letter).
  useEffect(() => {
    const e = getEntry(id);
    if (e && !isQuietMark(e)) track('letter_opened', { author_relation: isOwnEntry(e) ? 'self' : 'other_parent', has_audio: !!e.audioUri });
  }, [id]);

  const child = entry ? ((entry.childId ? getChild(entry.childId) : null) ?? getActiveChild()) : null;

  // A quiet-day mark is not a letter: there is no page for it (D-084). Back to the Book.
  if (entry && isQuietMark(entry)) return <Redirect href="/book" />;

  if (!entry || !child) return <NotFound id={id} />;

  const scale = tokens.readingScale[size];
  const { note, text: excerpt } = excerptOf(entry);
  const words = letterWords(entry);
  const text = showOriginal ? entry.rawTranscript : note ? excerpt : entry.finalText;
  const shownNote = note && !showOriginal;
  const dateline = shortDateline(child, entry.occurredOn);
  const spokenDateline = letterDateline(child, entry.occurredOn);
  const openingFor: Opening = (focus) => (
    <OpeningBlock focusRef={focus} dateline={dateline} spokenDateline={spokenDateline} text={text} note={shownNote} scale={scale} swapKey={`${size}:${showOriginal}`} />
  );

  const page = (
      <Page
        entry={entry}
        child={child}
        size={size}
        onSize={(v) => {
          setSize(v);
          setReadingSize(v);
          track('settings_changed', { key: 'reading_size' });
        }}
        showOriginal={showOriginal}
        onToggleOriginal={() => setShowOriginal((v) => !v)}
        opening={openingFor}
        openingLineHeight={lineHeightFor(shownNote ? 'footnote' : 'letterBody', fontScale, scale)}
        words={words}
        onEntry={setEntry}
      />
  );
  if (!CARD_MODE) return page;
  // The page grows from its card: the card's dateline and the whole letter are the opening, focus on the dateline.
  return (
    <CardToPage id={entry.id} opening={(focus) => openingFor(focus)} onClosed={goBack}>
      {page}
    </CardToPage>
  );
}

/**
 * The page's opening: the card's dateline (the same line, in the same type) and the whole letter, in the card's
 * gap. CardToPage draws it from the card's place to here; the focus ref is the dateline, whose spoken label carries
 * the child's age ("Tuesday, September 29, 2026. Asha is 7 months old.").
 */
function OpeningBlock({
  focusRef,
  dateline,
  spokenDateline,
  text,
  note,
  scale,
  swapKey,
}: {
  focusRef: RefObject<any> | null;
  dateline: string;
  spokenDateline: string;
  text: string;
  note: boolean;
  scale: number;
  swapKey: string;
}) {
  return (
    <View style={{ gap: CARD_TEXT_GAP }}>
      <Text ref={focusRef ?? undefined} variant="letterDateline" caps accessibilityLabel={spokenDateline} testID={focusRef ? 'letter.dateline' : undefined}>
        {dateline}
      </Text>
      {/* "Exactly as said" and Reading Size cross-fade the words over 150 ms; the size itself never animates. */}
      <Animated.View key={swapKey} entering={focusRef ? FadeIn.duration(150).reduceMotion(ReduceMotion.Never) : undefined}>
        {note ? (
          <AppNote scale={scale}>{text}</AppNote>
        ) : (
          <Text variant="letterBody" scale={scale} selectable={!!focusRef}>
            {text}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

type PageProps = {
  entry: Entry;
  child: Child;
  size: ReadingSize;
  onSize: (v: ReadingSize) => void;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  opening: Opening;
  openingLineHeight: number;
  words: ReturnType<typeof letterWords>;
  onEntry: (e: Entry) => void;
};

function Page({ entry, child, size, onSize, showOriginal, onToggleOriginal, opening, openingLineHeight, words, onEntry }: PageProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const navigation = useNavigation();
  const leave = useLeave();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  // In a push the page draws its own opening (no carried copy stands in), so it is the page's: selectable, with an id.
  const ownOpening = useRef(null);

  // While the card's words travel into the page, the rest of the page (the signature, the player, the actions) waits
  // until they are home, so no line of it ever sits under words still on their way; then it fades in. Back fades it
  // out first, as the words go back into their card. Without a carry, the rest is part of the page CardToPage fades.
  const [rest] = useState(() => {
    const r = CARD_MODE ? cardRects.get(entry.id) : undefined;
    const pageY = insets.top + 60;
    const column = { x: CARD_TEXT_INSET, y: pageY, width: screen.width - 2 * CARD_TEXT_INSET, height: Number.MAX_SAFE_INTEGER, lineHeight: openingLineHeight };
    return pageRestPlan({
      carried: !!r && !reduced && canCarry(r.text, column),
      holdMs: tokens.motion.cardToPage.holdMs,
      measureMs: MEASURE_MS,
      spring: tokens.motion.standard,
      travelPt: r?.text ? Math.hypot(r.text.x - column.x, r.text.y - pageY) : 0,
      withinPt: REST_WITHIN_PT,
      fadeMs: tokens.motion.fadeMs,
    });
  });
  const restOpacity = useSharedValue(rest.showAtMs ? 0 : 1);
  useEffect(() => {
    if (!rest.showAtMs) return;
    restOpacity.value = withDelay(rest.showAtMs, withTiming(1, { duration: rest.fadeMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
  }, [rest, restOpacity]);
  const restSignature = useAnimatedStyle(() => ({ opacity: restOpacity.value }));
  const restBody = useAnimatedStyle(() => ({ opacity: restOpacity.value }));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Back: the rest goes first (REST_OUT_MS), then the words go back into their card, so nothing of the page is left
  // under words on their way home.
  const back = useCallback(() => {
    if (!rest.showAtMs) return leave();
    if (restOpacity.value === 0) {
      restOpacity.value = 0; // a Back before the rest showed: it never comes in
      return leave();
    }
    restOpacity.value = withTiming(0, { duration: REST_OUT_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
    leaveTimer.current = setTimeout(leave, REST_OUT_MS);
  }, [rest, restOpacity, leave]);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // Android's back puts the words back into their card, as Back does.
  useFocusEffect(
    useCallback(() => {
      if (!CARD_MODE || Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        back();
        return true;
      });
      return () => sub.remove();
    }, [back]),
  );
  const [sizeOpen, setSizeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Words that arrived after the letter was saved and have not been read back yet (D-086).
  const [unread, setUnread] = useState(() => isReadItBack(entry.id));
  useEffect(() => subscribeTo('entries', () => setUnread(isReadItBack(entry.id))), [entry.id]);

  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const spoken = entry.captureMode !== 'typed';
  const typedWords = provenanceOf(entry) === 'typed'; // typed, or typed for a recording that had no words
  const own = isOwnEntry(entry);
  const canShowOriginal = own && spoken && words === 'words' && entry.rawTranscript !== entry.finalText;
  // One provenance line (S27): "Spoken, with small fixes. Recording kept on this phone." The other parent's
  // recording is on their phone, which the player's place says (D-073), so the line names only how it was made.
  const provenance = copy.book.provenance[provenanceOf(entry)];
  const provenanceLine = spoken && own ? `${provenance}. ${copy.book.recordingOnPhone}.` : provenance;

  const aa = (
    <Pressable
      onPress={() => setSizeOpen(true)}
      role="button"
      accessibilityLabel={copy.reader.readingSizeA11y}
      {...LARGE_CONTENT(copy.reader.readingSizeA11y)}
      hitSlop={6}
      testID="letter.readingSize"
      className="mr-1 h-11 min-w-11 items-center justify-center rounded-full px-2 active:bg-secondary">
      <Text variant="title2" tone="accent" maxFontSizeMultiplier={1.3}>
        {copy.reader.readingSizeButton}
      </Text>
    </Pressable>
  );

  const toggleInBook = () => {
    const next = !entry.inBook;
    setEntryInBook(entry.id, next);
    haptic('tap');
    onEntry({ ...entry, inBook: next });
    toast.show({ message: next ? fill(copy.review.destination.addedToast, { child: child.name }) : copy.review.destination.privateToast });
  };

  // Delete (S35, S36): committed at once (the tombstone; with sync on, the outbox op), then back to the Book, where
  // the card goes back into its row, leaves it, and "Letter deleted." waits with Undo. Opened from elsewhere (Tonight's
  // "A month ago"), the same toast shows over that screen instead.
  const remove = () => {
    setConfirmOpen(false);
    const gone = entry;
    deleteEntry(gone.id); // tombstone; waits 30 days on the Recently deleted shelf
    haptic('warning');
    track('letter_deleted', { action: 'deleted', destination: gone.inBook ? 'book' : 'private' });
    if (belowIsBook(navigation.getState() as NavState)) bookHandoff.deleted(gone);
    else
      toast.show({
        message: copy.settings.delete.entryToast,
        action: {
          label: copy.common.undoButton,
          onPress: () => {
            track('letter_deleted', { action: 'restored', destination: gone.inBook ? 'book' : 'private' });
            undeleteEntry(gone.id);
          },
        },
      });
    back();
  };

  const topBar = CARD_MODE ? <TopBar onBack={back} trailing={aa} inset={insets.top} /> : null;

  return (
    <View className="flex-1 bg-background">
      {CARD_MODE ? <Stack.Screen options={{ headerShown: false }} /> : <Stack.Screen options={{ headerRight: () => aa }} />}
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 48, paddingHorizontal: CARD_TEXT_INSET, gap: 28 }}
        testID="letter.page">
        <View className="gap-6">
          {showOriginal ? (
            <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
              {copy.review.originalLabel}
            </Text>
          ) : null}
          {CARD_MODE ? <PageOpening lineHeight={openingLineHeight} /> : opening(ownOpening)}
          {showsSignature(words) || showOriginal ? (
            <Animated.View style={restSignature} className="self-end">
              <Text variant="signature" scale={tokens.readingScale[size]}>
                {signature}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View style={[{ gap: 28 }, restBody]}>
        {spoken && <AudioPlayer entryId={entry.id} />}

        {own && words === 'waiting' && <WaitingCard entry={entry} />}
        {own && words === 'words' && unread && (
          <ReadItBackCard
            onRead={() => {
              haptic('tap');
              clearReadItBack(entry.id);
              setUnread(false);
            }}
          />
        )}

        {words === 'words' && (
          <View className="gap-2 border-t border-border pt-5">
            <View className="flex-row items-start gap-2">
              <View className="pt-0.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {typedWords ? <PencilSimpleLineIcon size={16} color={c.textMuted} /> : <MicrophoneIcon size={16} color={c.textMuted} />}
              </View>
              <Text variant="footnote" className="flex-1" testID="letter.provenance">
                {provenanceLine}
              </Text>
            </View>
            {!entry.inBook && (
              <View className="flex-row pt-1">
                <PrivateChip color={c.text} />
              </View>
            )}
            {canShowOriginal && (
              <Button
                variant="quiet"
                size="sm"
                className="-ml-4 self-start"
                label={showOriginal ? copy.review.view.fixes : copy.review.view.exact}
                onPress={onToggleOriginal}
                testID="letter.view"
              />
            )}
          </View>
        )}

        {own && (
          <View style={{ marginHorizontal: 20 - CARD_TEXT_INSET }}>
            <ListSection>
              <ListRow
                title={entry.inBook ? copy.book.entryMenu.makePrivate : copy.book.entryMenu.moveToBook}
                leading={entry.inBook ? <LockSimpleIcon size={20} color={c.text} /> : <BookOpenIcon size={20} color={c.text} />}
                onPress={toggleInBook}
              />
              <ListRow
                title={copy.book.entryMenu.deleteButton}
                variant="destructive"
                leading={<TrashIcon size={20} color={c.destructive} />}
                onPress={() => setConfirmOpen(true)}
                accessibilityHint={copy.settings.delete.entryConfirm}
              />
            </ListSection>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {topBar}

      <ConfirmSheet
        open={confirmOpen}
        title={copy.settings.delete.entryTitle}
        body={copy.settings.delete.entryBody}
        confirmLabel={copy.settings.delete.entryConfirm}
        keepLabel={copy.settings.delete.keepButton}
        onKeep={() => setConfirmOpen(false)}
        onConfirm={remove}
      />

      <ReadingSizeSheet visible={sizeOpen} value={size} onChange={onSize} onClose={() => setSizeOpen(false)} />
    </View>
  );
}

/** Card to page only: the page's own Back and "Aa" (the native header is hidden). A swipe down on it goes back too. */
function TopBar({ onBack, trailing, inset }: { onBack: () => void; trailing: ReactNode; inset: number }) {
  const { c } = useTheme();
  const swipe = Gesture.Pan()
    .activeOffsetY(16)
    .failOffsetX([-16, 16])
    .onEnd((e) => {
      if (e.translationY > 64 || e.velocityY > 800) runOnJS(onBack)();
    });
  return (
    <GestureDetector gesture={swipe}>
      <View
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5"
        style={{ paddingTop: inset, height: inset + 52, backgroundColor: c.bg }}>
        <BackButton onPress={onBack} className="self-center" />
        {trailing}
      </View>
    </GestureDetector>
  );
}

/** Not on this phone (S37): if it is on the shelf, say so and open it; never the id or the route. */
function NotFound({ id }: { id: string }) {
  const onShelf = listDeleted().some((e) => e.id === id);
  const body = (
    <NotFoundBody onShelf={onShelf} />
  );
  if (!CARD_MODE) return body;
  return (
    <CardToPage id={id} opening={() => null} onClosed={goBack}>
      {body}
    </CardToPage>
  );
}

function NotFoundBody({ onShelf }: { onShelf: boolean }) {
  const leave = useLeave();
  const toBook = { label: copy.reader.notFoundCta, onPress: leave, testID: 'letter.toBook' };
  const toShelf = { label: copy.reader.openShelfButton, onPress: () => router.replace('/settings/recently-deleted'), testID: 'letter.openShelf' };
  // On the shelf: say so, and open it (primary) or go back to the book (quiet). Otherwise no body, one way back.
  const state = onShelf ? { body: copy.reader.notFoundDeleted, primary: toShelf, quiet: [toBook] } : { primary: toBook };
  return (
    <View className="flex-1 bg-background">
      {CARD_MODE ? <Stack.Screen options={{ headerShown: false }} /> : null}
      <StateScreen kind="notFound" title={copy.reader.notFoundTitle} {...state} header={CARD_MODE ? <ModalHeader onClose={leave} /> : undefined} />
    </View>
  );
}

/**
 * A saved letter still waiting for its words (D-086): the reason, then one primary action. The reason lines reuse
 * the words copy ("Getting ready, 40%", Wi-Fi, space); the actions are Try again or Get words ready when that is what
 * would help, and Write the words, which opens the words sheet (S28). The recording itself is never touched.
 */
function WaitingCard({ entry }: { entry: Entry }) {
  const language = languageFor(entry.id);
  const job = useWordsJob(entry.id);
  const download = useSpeechDownload(job?.phase === 'waiting_for_pack' ? language : null);
  const [writing, setWriting] = useState(false);
  const w = wordsCopy.waiting;

  const failed = job?.phase === 'failed';
  const retryable = failed && job.failure !== 'file_missing' && job.failure !== 'unsupported';
  const packWait = job?.phase === 'waiting_for_pack';
  // D-111 item 4: a language this build does not hear yet; the letter waits for its language (from the job, no read).
  const languageWait = waitingForLanguageNote(job);
  const p = download.progress;
  const reason = failed
    ? copy.errors.transcriptionFailed.body
    : languageWait
      ? languageWait
      : packWait
        ? download.hold === 'waiting_for_wifi'
          ? wordsCopy.pack.waitingForWifi
          : download.hold === 'no_space'
            ? wordsCopy.pack.noSpace
            : p !== null
              ? fill(wordsCopy.pack.progress, { n: Math.floor(p * 100) })
              : fill(wordsCopy.pack.sizeLine, { size: Math.round(planFor([language]).bytes / 1e6) })
        : null;

  const primary = retryable ? (
    <Button size="md" label={w.retryButton} onPress={() => retryWords(entry.id)} testID="letter.retry" />
  ) : packWait && p === null ? (
    <Button size="md" label={w.readyButton} onPress={() => void startSpeechDownload(language)} testID="letter.getReady" />
  ) : null;

  return (
    <View className="gap-3" accessibilityLiveRegion="polite" testID="letter.waiting">
      {reason && <Text variant="footnote">{reason}</Text>}
      {primary}
      <Button size="md" variant={primary ? 'secondary' : 'primary'} label={w.writeButton} onPress={() => setWriting(true)} testID="letter.write" />
      <WordsSheet entryId={entry.id} open={writing} onClose={() => setWriting(false)} />
    </View>
  );
}

/** "Words for this recording": type the words for a recording that has none yet (S28). Typed, never machine words. */
function WordsSheet({ entryId, open, onClose }: { entryId: string; open: boolean; onClose: () => void }) {
  const w = wordsCopy.waiting;
  const [text, setText] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title={w.writeLabel} testID="letter.writeWords">
      <View className="gap-3 pb-2">
        <TextField variant="letter" label={w.writeLabel} labelHidden value={text} onChangeText={setText} multiline autoFocus accessibilityHint={w.writeTitle} />
        <Button
          size="lg"
          label={w.saveButton}
          disabled={!text.trim()}
          onPress={() => {
            haptic('tap');
            if (setTypedWordsForWaitingEntry(entryId, text)) onClose();
          }}
          testID="letter.writeWords.save"
        />
        <Button variant="quiet" size="sm" label={w.cancelButton} onPress={onClose} />
      </View>
    </Sheet>
  );
}

/**
 * "Words are ready. Read it back." The words arrived after the letter was saved, so they are exactly as said and
 * nothing was fixed unread (D-086). Reading them back is the parent's step; the card then goes away.
 */
function ReadItBackCard({ onRead }: { onRead: () => void }) {
  const w = wordsCopy.waiting;
  return (
    <View className="gap-3" accessibilityLiveRegion="polite" testID="letter.readItBack">
      <Text variant="headline">{w.readyBody}</Text>
      <Text variant="footnote">{w.arrivedNote}</Text>
      <Button size="md" label={w.readItBackButton} onPress={onRead} testID="letter.readItBack.done" />
    </View>
  );
}
