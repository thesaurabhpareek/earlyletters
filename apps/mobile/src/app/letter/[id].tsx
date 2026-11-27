/**
 * A letter, as a page (DESIGN_LANGUAGE 12, EXPERIENCE_PASS S27, S28, S35 to S37; 5.8 row 7): a page, not a card.
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Apple Books: reader-owned "Aa" Reading Size in a small sheet, the page changing live
 *   behind it; text never animates its size, it cross-fades (MOTION 5i).
 * - Day One: the recording and its words in one entry; the voice comes first after the text.
 * - Apple Settings inset list for the few actions (Add to book, Make private, Change the date, Delete).
 * - Change the date (F09 6.2 step 6, F09-REQ-004): own letters only; the date sheet (a day, or a month of age), then the
 *   letter is filed in its new chapter at once. The words are never touched.
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
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PencilSimpleLineIcon } from 'phosphor-react-native/src/icons/PencilSimpleLine';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
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
import { letterStartY, topBarHeight } from '@/lib/letter-top-bar.logic';
import { SIZE_WORD_MAX_SCALE, showsSizeWord } from '@/lib/reader-words.logic';
import { sizeControlMinHeight, sizeWordStacks } from '@/lib/size-control.logic';
import { Sheet } from '@/components/ui/sheet';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useFontScale, useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { letterDateline } from '@/lib/dates';
import { carriesWords, playUnderDateline } from '@/lib/play-placement.logic';
import { haptic } from '@/lib/haptics';
import { downloadingLine } from '@/lib/models/speech-download.logic';
import { planFor } from '@/lib/models/speech-packs';
import { clearReadItBack, isReadItBack } from '@/lib/read-it-back';
import {
  deleteEntry,
  deleteLeftBookLetter,
  getActiveChild,
  getChild,
  getEntry,
  listDeleted,
  listLeftBooks,
  setEntryDate,
  setEntryInBook,
  todayISO,
  canTypeWordsFor,
  canChangeLetterWords,
  setTypedWordsForWaitingEntry,
  subscribeTo,
  undeleteEntry,
  type Child,
  type Entry,
  type OccurredPrecision,
} from '@/lib/store';
import { curve, useMotion, useReducedMotion } from '@/lib/motion';
import { ROUTES, canCarry, type Move } from '@/lib/transitions.logic';
import { languageFor, retryWords, startSpeechDownload, waitingForLanguageNote } from '@/lib/transcription-queue';
import { wordsCopy } from '@/lib/transcription-queue/copy';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { AppNote } from '@/components/book/app-note';
import { LetterPhoto, LetterPicture } from '@/components/photos/letter-photo';
import { useLetterPhoto } from '@/lib/photos/hooks';
import { photoSurfaces, photosBuildEnabled } from '@/lib/photos/flag';
import { photosPausedNow } from '@/lib/photos/pause';
import { belowIsBook, bookHandoff, pageRestPlan, type NavState } from '@/components/book/book.logic';
import { provenanceOf } from '@/components/book/chapters';
import { entryDateline, movedToast } from '@/components/book/date-change.logic';
import { DateSheet } from '@/components/book/date-sheet';
import { exactViewAvailable, provenanceLine as provenanceLineOf } from '@/lib/provenance';
import { ConfirmSheet } from '@/components/book/confirm-sheet';
import { ChangeRows, ChangeWordsSheet } from '@/components/book/change-words';
import { offersChangeWords } from '@/components/book/change-words.logic';
import { leftBookDeleteBody } from '@/components/settings/left-books.logic';
import { CARD_TEXT_GAP, CARD_TEXT_INSET, PrivateChip, excerptOf } from '@/components/book/letter-card';
import { letterWords } from '@/components/book/letter-words.logic';
import { wordsCardKind, wordsCardState, type WordsCardKind } from '@/components/book/words-card.logic';
import { isQuietMark, showsSignature } from '@/components/book/quiet-day.logic';
import { readsFromLetter } from '@/components/book/read-from-here.logic';
import { readTheYearOn } from '@/components/book/read-year.logic';
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
const REST_OUT_MS = tokens.motion.cardToPage.restOutMs;

/** Whether the letter is in a book this phone has left (BL-444): read only. Asked through the store's gated list. */
function isLeftBookLetter(entry: Entry): boolean {
  return listLeftBooks().some((b) => b.id === entry.childId);
}

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
  const screenWidth = useWindowDimensions().width;
  const storedPhoto = useLetterPhoto(entry?.id);
  useUnlitRoom();

  // The page follows the store: words that arrive while it is open appear without leaving and reopening (J10-01).
  useEffect(
    () =>
      subscribeTo('entries', () => {
        setEntry((prev) => (prev === null ? prev : (getEntry(id) ?? prev)));
      }),
    [id],
  );

  // Opening a letter is the `screen_view` of the generated name `book:letter_detail_screen_view` (one id for every letter), not an event of its own (BL-2175).

  const child = entry ? ((entry.childId ? getChild(entry.childId) : null) ?? getActiveChild()) : null;

  // A quiet-day mark is not a letter: there is no page for it (D-084). Back to the Book.
  if (entry && isQuietMark(entry)) return <Redirect href="/book" />;

  if (!entry || !child) return <NotFound id={id} />;

  const scale = tokens.readingScale[size];
  const { note, text: excerpt } = excerptOf(entry);
  const words = letterWords(entry);
  const text = showOriginal ? entry.rawTranscript : note ? excerpt : entry.finalText;
  const shownNote = note && !showOriginal;
  // A letter dated to a month shows the month only, on the card and here alike (F09-REQ-003).
  const monthOnly = entry.occurredPrecision === 'month';
  const dateline = entryDateline(child, entry);
  const spokenDateline = monthOnly ? dateline : letterDateline(child, entry.occurredOn);
  // The picture sits between the dateline and the words (ruling NS-01-C01-order). A letter with a picture hands off with
  // the plain 200 ms fade (the carry moves dateline and words as one rigid block); so does Play under the dateline from AX1 up (carriesWords).
  const hasPicture =
    !!storedPhoto && words !== 'waiting' && photoSurfaces({ build: photosBuildEnabled(), paused: photosPausedNow() }).addActions;
  const picture = hasPicture ? <LetterPicture entryId={entry.id} own={isOwnEntry(entry) && !isLeftBookLetter(entry)} columnWidth={screenWidth - 2 * CARD_TEXT_INSET} /> : null;
  // From AX1 up Play sits directly under the dateline, above the picture (BL-1789, CDESO-1); the opening draws it, on the page's own copy only.
  const playFirst = playUnderDateline(fontScale) && entry.captureMode !== 'typed';
  const play = playFirst ? <AudioPlayer entryId={entry.id} /> : null;
  const openingFor: Opening = (focus) => (
    <OpeningBlock focusRef={focus} dateline={dateline} spokenDateline={spokenDateline} text={text} note={shownNote} scale={scale} swapKey={`${size}:${showOriginal}`} picture={picture} play={focus ? play : null} />
  );

  const page = (
      <Page
        entry={entry}
        child={child}
        size={size}
        onSize={(v) => {
          setSize(v);
          setReadingSize(v);
          track('me:setting_update', { key: 'reading_size' });
        }}
        showOriginal={showOriginal}
        onToggleOriginal={() => setShowOriginal((v) => !v)}
        opening={openingFor}
        openingLineHeight={lineHeightFor(shownNote ? 'footnote' : 'letterBody', fontScale, scale)}
        hasPicture={hasPicture}
        playFirst={playFirst}
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
  picture,
  play,
}: {
  focusRef: RefObject<any> | null;
  dateline: string;
  spokenDateline: string;
  text: string;
  note: boolean;
  scale: number;
  swapKey: string;
  picture?: ReactNode;
  /** Play, from AX1 up: directly under the dateline, above the picture (BL-1789). Only the page's own copy carries it. */
  play?: ReactNode;
}) {
  return (
    <View style={{ gap: CARD_TEXT_GAP }}>
      {/* NS-33-R1: the dateline is the page's level 1 heading, and its first. The carried copies stay hidden from VoiceOver. */}
      <Text ref={focusRef ?? undefined} variant="letterDateline" caps accessibilityLabel={spokenDateline} asHeading={1} testID={focusRef ? 'letter.dateline' : undefined}>
        {dateline}
      </Text>
      {play}
      {/* The picture, when the letter has one: second in order (after Play, from AX1 up), after the one level 1 heading and before the words. */}
      {picture}
      {/* "Exactly as said" and Reading Size cross-fade the words over `swapMs`; the size itself never animates. */}
      <Animated.View key={swapKey} entering={focusRef ? FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never) : undefined}>
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
  hasPicture: boolean;
  /** Play is drawn by the opening (under the dateline), not after the words. */
  playFirst: boolean;
  words: ReturnType<typeof letterWords>;
  onEntry: (e: Entry) => void;
};

function Page({ entry, child, size, onSize, showOriginal, onToggleOriginal, opening, openingLineHeight, hasPicture, playFirst, words, onEntry }: PageProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const navigation = useNavigation();
  const leave = useLeave();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  const fontScale = useFontScale();
  // The letter starts below the top bar, which follows its Back button at large text (BL-1790).
  const pageTop = CARD_MODE ? letterStartY(insets.top, fontScale) : insets.top + 60;
  // In a push the page draws its own opening (no carried copy stands in), so it is the page's: selectable, with an id.
  const ownOpening = useRef(null);

  // While the card's words travel into the page, the rest of the page (the signature, the player, the actions) waits
  // until they are home, so no line of it ever sits under words still on their way; then it fades in. Back fades it
  // out first, as the words go back into their card. Without a carry, the rest is part of the page CardToPage fades.
  const [rest] = useState(() => {
    const r = CARD_MODE ? cardRects.get(entry.id) : undefined;
    const pageY = pageTop;
    const column = { x: CARD_TEXT_INSET, y: pageY, width: screen.width - 2 * CARD_TEXT_INSET, height: Number.MAX_SAFE_INTEGER, lineHeight: openingLineHeight };
    return pageRestPlan({
      carried: carriesWords({ hasPicture, fontScale }) && !!r && !reduced && canCarry(r.text, column),
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
    restOpacity.value = withDelay(rest.showAtMs, withTiming(1, { duration: rest.fadeMs, easing: curve('veil'), reduceMotion: ReduceMotion.Never }));
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
    restOpacity.value = withTiming(0, { duration: REST_OUT_MS, easing: curve('veil'), reduceMotion: ReduceMotion.Never });
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
  const [dateOpen, setDateOpen] = useState(false);
  // "Write the words" sheet: open state lives here, with the sheet, so it outlives the words card (below).
  const [writing, setWriting] = useState(false);
  // "Change words" on a saved letter (BL-413): the person's own words, each change put back on its own.
  const [changing, setChanging] = useState(false);
  // Words that arrived after the letter was saved and have not been read back yet (D-086).
  const [unread, setUnread] = useState(() => isReadItBack(entry.id));
  useEffect(() => subscribeTo('entries', () => setUnread(isReadItBack(entry.id))), [entry.id]);

  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const spoken = entry.captureMode !== 'typed';
  const typedWords = provenanceOf(entry) === 'typed'; // typed, or typed for a recording that had no words
  const own = isOwnEntry(entry);
  // A letter of a book this phone has left (BL-444, D-113) opens to read: no Add to book, Change the date, Delete, words
  // to write, review or picture controls. Every one of those writes would queue an op for a book the server no longer
  // lets this person write to. The one write kept is Delete, through its own door (`deleteLeftBookLetter`, BL-1960, BL-1961).
  const readOnly = isLeftBookLetter(entry);
  const editable = own && !readOnly;
  const canShowOriginal = exactViewAvailable(entry, { own, hasWords: words === 'words' });
  // One provenance line (S27): "Spoken, with small fixes. Recording kept on this phone." The other parent's
  // recording is on their phone, which the player's place says (D-073), so the line names only how it was made, and
  // only that it was spoken: this phone never holds their raw words, so it cannot know whether any fix was made (S8).
  const provenanceLine = provenanceLineOf(entry, { own, audioUri: entry.audioUri, words: copy.book.provenance, recordingOnPhone: copy.book.recordingOnPhone });
  // The words card: a recording waiting for its words, or one with no words that the store can still take words for (S3).
  const wordsCard = readOnly ? null : wordsCardKind({ own, words, canWrite: words === 'nobodySpoke' && canTypeWordsFor(entry.id) });
  const changeWords = offersChangeWords({ editable, hasWords: words === 'words', canChange: editable && canChangeLetterWords(entry.id) });
  // Read from here (BL-1792, spec 13 section 5): the first row of this letter's list, only on a letter Read together can
  // play (never private or waiting; RYT-07), on the other parent's letters too (reading is not editing). Behind the flag.
  const readFromRow = readsFromLetter(entry, { yearsOn: readTheYearOn(process.env.EXPO_PUBLIC_READ_THE_YEAR), leftBook: readOnly }) ? (
    <ListRow
      title={copy.readTogether.fromHere}
      leading={<BookOpenIcon size={20} color={c.text} />}
      minHeight={tokens.target.primary}
      accessibilityHint={copy.readTogether.fromHereLetterA11y}
      onPress={() => router.push({ pathname: '/read-together', params: { childId: child.id, from: entry.id } })}
      testID="letter.readFromHere"
    />
  ) : null;

  const aa = (
    <Pressable
      onPress={() => setSizeOpen(true)}
      role="button"
      accessibilityLabel={copy.reader.readingSizeA11y}
      {...LARGE_CONTENT(copy.reader.readingSizeA11y)}
      hitSlop={6}
      testID="letter.readingSize"
      style={{ minHeight: sizeControlMinHeight(fontScale) }}
      className="mr-1 min-w-11 items-center justify-center rounded-full px-2 active:bg-secondary">
      <View className={sizeWordStacks(fontScale) ? 'items-center' : 'flex-row flex-wrap items-center justify-center gap-1.5'}>
        <Text variant="title2" tone="accent" maxFontSizeMultiplier={1.3}>
          {copy.reader.readingSizeButton}
        </Text>
        {showsSizeWord(fontScale) ? (
          <Text variant="labelSmall" tone="accent" maxFontSizeMultiplier={SIZE_WORD_MAX_SCALE} className="text-center" testID="letter.readingSize.word">
            {copy.reader.readingSizeWord}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const toggleInBook = () => {
    const next = !entry.inBook;
    if (!setEntryInBook(entry.id, next)) return toast.show({ message: copy.errors.generic.title });
    haptic('tap');
    onEntry({ ...entry, inBook: next });
    toast.show({ message: next ? fill(copy.review.destination.addedToast, { child: child.name }) : copy.review.destination.privateToast });
  };

  // Change the date (F09-REQ-004): one local write (and, with sync on, one outbox op); the page follows the store, so
  // its dateline changes in place and the Book behind files the letter in its new chapter.
  const changeDate = (next: { occurredOn: string; precision: OccurredPrecision }) => {
    setDateOpen(false);
    if (!setEntryDate(entry.id, next.occurredOn, next.precision)) return toast.show({ message: copy.errors.generic.title });
    haptic('tap');
    onEntry({ ...entry, occurredOn: next.occurredOn, occurredPrecision: next.precision });
    toast.show({ message: movedToast(child, next.occurredOn) });
  };

  // Delete (S35, S36): committed at once (the tombstone; with sync on, the outbox op), then back to the Book, where
  // the card goes back into its row, leaves it, and "Letter deleted." waits with Undo. Opened from elsewhere (Tonight's
  // "A month ago"), the same toast shows over that screen instead.
  const remove = () => {
    setConfirmOpen(false);
    const gone = entry;
    // A left book's letter has no Undo: the restore is refused (BL-1959), so the toast offers none.
    if (readOnly) {
      if (!deleteLeftBookLetter(gone.id)) return toast.show({ message: copy.errors.generic.title });
      haptic('warning');
      toast.show({ message: copy.settings.delete.entryToast });
      return back();
    }
    if (!deleteEntry(gone.id)) return toast.show({ message: copy.errors.generic.title }); // tombstone; waits 30 days on the Recently deleted shelf; false for a left book (BL-1959)
    haptic('warning');
    if (belowIsBook(navigation.getState() as NavState)) bookHandoff.deleted(gone);
    else
      toast.show({
        message: copy.settings.delete.entryToast,
        action: {
          label: copy.common.undoButton,
          onPress: () => {
            // BL-1959: a left book refuses the restore, and the toast says so. No analytics event (CR-225).
            if (!undeleteEntry(gone.id)) return toast.show({ message: copy.settings.delete.restoreRefusedToast });
          },
        },
      });
    back();
  };

  const topBar = CARD_MODE ? <TopBar onBack={back} trailing={aa} inset={insets.top} fontScale={fontScale} /> : null;

  return (
    <View className="flex-1 bg-background">
      {CARD_MODE ? <Stack.Screen options={{ headerShown: false }} /> : <Stack.Screen options={{ headerRight: () => aa }} />}
      <ScrollView
        contentContainerStyle={{ paddingTop: pageTop, paddingBottom: insets.bottom + 48, paddingHorizontal: CARD_TEXT_INSET, gap: 28 }}
        testID="letter.page">
        <View className="gap-6">
          {showOriginal ? (
            <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
              {copy.review.originalLabel}
            </Text>
          ) : null}
          {CARD_MODE ? <PageOpening lineHeight={openingLineHeight} carry={carriesWords({ hasPicture, fontScale })} /> : opening(ownOpening)}
          {showsSignature(words) || showOriginal ? (
            <Animated.View style={restSignature} className="self-end">
              <Text variant="signature" scale={tokens.readingScale[size]}>
                {signature}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View style={[{ gap: 28 }, restBody]}>
        {spoken && !playFirst && <AudioPlayer entryId={entry.id} />}
        {/* The picture's controls (add, change, words, remove) stay after the words and Play; the picture itself is drawn by the
            opening, between the dateline and the words (CL-116 C-01, ruling NS-01-C01-order): absent when photos are off. */}
        {words !== 'waiting' ? <LetterPhoto entryId={entry.id} finalText={entry.finalText} own={editable} /> : null}

        {wordsCard && <WaitingCard entry={entry} kind={wordsCard} onWrite={() => setWriting(true)} />}
        {editable && words === 'words' && (unread || entry.wordsUnreviewed) && (
          <ReadItBackCard
            typed={typedWords}
            onRead={() => {
              haptic('tap');
              // Words waiting for review count at Review's Keep step, never here, and this page never shows a Plus
              // sheet (M17, F14-REQ-037; F14 6.1 :129, 6.4): Review opens for this letter. Its Keep clears the card.
              if (entry.wordsUnreviewed) return router.push({ pathname: '/review', params: { entryId: entry.id } });
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
            <PrivateChipSlot shown={!entry.inBook} color={c.text} />
            {changeWords && <ChangeRows entryId={entry.id} />}
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

        {editable && (
          <View style={{ marginHorizontal: 20 - CARD_TEXT_INSET }}>
            <ListSection>
              {readFromRow}
              {changeWords && (
                <ListRow
                  title={copy.review.editTextButton}
                  leading={<PencilSimpleLineIcon size={20} color={c.text} />}
                  onPress={() => setChanging(true)}
                  testID="letter.changeWords.open"
                />
              )}
              <ListRow
                title={entry.inBook ? copy.book.entryMenu.makePrivate : copy.book.entryMenu.moveToBook}
                leading={entry.inBook ? <LockSimpleIcon size={20} color={c.text} /> : <BookOpenIcon size={20} color={c.text} />}
                onPress={toggleInBook}
              />
              <ListRow
                title={copy.book.entryMenu.changeDate}
                leading={<CalendarBlankIcon size={20} color={c.text} />}
                onPress={() => setDateOpen(true)}
                testID="letter.changeDate"
              />
              <ListRow
                title={copy.book.entryMenu.deleteButton}
                variant="destructive"
                leading={<TrashIcon size={20} color={c.destructive} />}
                onPress={() => setConfirmOpen(true)}
                accessibilityHint={copy.book.entryMenu.deleteHint}
              />
            </ListSection>
          </View>
        )}
        {!editable && readFromRow && (
          <View style={{ marginHorizontal: 20 - CARD_TEXT_INSET }}>
            <ListSection>{readFromRow}</ListSection>
          </View>
        )}
        {readOnly && own && (
          <View style={{ marginHorizontal: 20 - CARD_TEXT_INSET }}>
            <ListSection>
              <ListRow
                title={copy.book.entryMenu.deleteButton}
                variant="destructive"
                leading={<TrashIcon size={20} color={c.destructive} />}
                onPress={() => setConfirmOpen(true)}
                testID="letter.deleteLeftBook"
              />
            </ListSection>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {topBar}

      {/* The words sheet is the page's, not the card's. The card comes and goes with the store (words arrive, a sync event
          puts the letter on the server), and the person's typing must never go with it: while the sheet is open it stays
          mounted, with its text, whatever the card does (S3, lens notes on #373). */}
      {(wordsCard || writing) && <WordsSheet entryId={entry.id} open={writing} onClose={() => setWriting(false)} />}
      {(changeWords || changing) && <ChangeWordsSheet entry={entry} open={changing} onClose={() => setChanging(false)} />}

      <ConfirmSheet
        open={confirmOpen}
        title={copy.settings.delete.entryTitle}
        body={readOnly ? leftBookDeleteBody(entry) : copy.settings.delete.entryBody}
        confirmLabel={copy.settings.delete.entryConfirm}
        keepLabel={copy.settings.delete.keepButton}
        onKeep={() => setConfirmOpen(false)}
        onConfirm={remove}
      />

      {editable && (
        <DateSheet open={dateOpen} child={child} entry={entry} todayISO={todayISO()} onClose={() => setDateOpen(false)} onSave={changeDate} />
      )}

      <ReadingSizeSheet visible={sizeOpen} value={size} onChange={onSize} onClose={() => setSizeOpen(false)} />
    </View>
  );
}

/**
 * The Private chip's row, always laid out so Make private and Move to the book push nothing (BL-420, about 20 pt). The
 * chip fades on `fade`, which is 200 ms and is also the Reduce Motion form; hidden from VoiceOver while it is not shown.
 */
function PrivateChipSlot({ shown, color }: { shown: boolean; color: string }) {
  const motion = useMotion();
  const opacity = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    opacity.value = motion.fade(shown ? 1 : 0);
  }, [shown, motion, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      className="flex-row pt-1"
      style={style}
      pointerEvents="none"
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}>
      <PrivateChip color={color} />
    </Animated.View>
  );
}

/** Card to page only: the page's own Back and "Aa" (the native header is hidden). A swipe down on it goes back too. */
function TopBar({ onBack, trailing, inset, fontScale }: { onBack: () => void; trailing: ReactNode; inset: number; fontScale: number }) {
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
        style={{ paddingTop: inset, height: topBarHeight(inset, fontScale), backgroundColor: c.bg }}>
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
 * A saved letter still waiting for its words (D-086), or a recording whose words came back empty (S28): the reason,
 * then one primary action. The reason lines reuse the words copy ("Getting ready, 40%", Wi-Fi, space); the actions are
 * Try again or Get words ready when that is what would help (a waiting letter only), and Write the words, which opens
 * the words sheet. A recording with no words has no reason and no other action (words-card.logic). The recording
 * itself is never touched.
 */
function WaitingCard({ entry, kind, onWrite }: { entry: Entry; kind: WordsCardKind; onWrite: () => void }) {
  const language = languageFor(entry.id);
  const job = useWordsJob(entry.id);
  const state = wordsCardState(kind, job);
  const download = useSpeechDownload(state.packWait ? language : null);
  const w = wordsCopy.waiting;

  const { failed, retryable, packWait } = state;
  // D-111 item 4: a language this build does not hear yet; the letter waits for its language (from the job, no read).
  const languageWait = state.languageWait ? waitingForLanguageNote(job) : null;
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
              ? downloadingLine(p, (n) => fill(wordsCopy.pack.progress, { n }))
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
      <Button size="md" variant={primary ? 'secondary' : 'primary'} label={w.writeButton} onPress={onWrite} testID="letter.write" />
    </View>
  );
}

/** "Words for this recording": type the words for a recording that has none yet (S28). Typed, never machine words. */
function WordsSheet({ entryId, open, onClose }: { entryId: string; open: boolean; onClose: () => void }) {
  const w = wordsCopy.waiting;
  const [text, setText] = useState('');
  // The store refused the words (the letter has words now, or is on the server): the typing stays, the sheet stays open,
  // and the person is told their words are still here. Nothing typed is ever dropped.
  const [refused, setRefused] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={w.writeLabel} testID="letter.writeWords">
      <View className="gap-3 pb-2">
        <TextField
          variant="letter"
          label={w.writeLabel}
          labelHidden
          value={text}
          onChangeText={(v) => {
            setText(v);
            setRefused(false);
          }}
          multiline
          autoFocus
          accessibilityHint={w.writeTitle}
        />
        {refused ? (
          <Text variant="footnote" accessibilityLiveRegion="polite" testID="letter.writeWords.refused">
            {copy.review.saveFailed}
          </Text>
        ) : null}
        <Button
          size="lg"
          label={w.saveButton}
          disabled={!text.trim()}
          onPress={() => {
            haptic('tap');
            // The typed words become the letter's at once, so they are never lost, and wait for review: they count at
            // Review's Keep step for this letter, never here (M17, F14-REQ-037; F14 6.1 :129, 6.2 B2 step 4).
            if (!setTypedWordsForWaitingEntry(entryId, text)) return setRefused(true);
            onClose();
            router.push({ pathname: '/review', params: { entryId } });
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
 * nothing was fixed unread (D-086). Reading them back is the parent's step. While they wait for review (Entry
 * .wordsUnreviewed) it opens Review for the letter, whose Keep step keeps them and takes the card away. Words the
 * parent typed are not "as you said them", so that line is left out for them.
 */
function ReadItBackCard({ onRead, typed }: { onRead: () => void; typed: boolean }) {
  const w = wordsCopy.waiting;
  return (
    <View className="gap-3" accessibilityLiveRegion="polite" testID="letter.readItBack">
      <Text variant="headline">{w.readyBody}</Text>
      {!typed && <Text variant="footnote">{w.arrivedNote}</Text>}
      <Button size="md" label={w.readItBackButton} onPress={onRead} testID="letter.readItBack.done" />
    </View>
  );
}
