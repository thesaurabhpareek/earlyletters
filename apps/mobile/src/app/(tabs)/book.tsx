/**
 * Book: chapters by month of age, newest first, read like a printed book (DESIGN_LANGUAGE 12, EXPERIENCE_PASS S24 to
 * S26, S36; 5.8 rows 5 and 7; proposals/book-page.md, the Book page redesign).
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"; book-page.md 2): Day One and Apple Journal (the entry is the
 * object), Airbnb (card restraint), Calm and Headspace (one warm focal point).
 * - The cover band is the one lit object: "Asha's book", the age in words, Read together full width, the gear on the
 *   title row (CoverBand). It scrolls under a material bar that fades in with the inline title, the Months button,
 *   the gear and the compact month at the top of the list (the sticky header). Reduce Motion: the bar switches, no
 *   fade. Reduce Transparency and Increase Contrast: the bar is solid (BlurSurface).
 * - Months are chapters: a typographic heading, "This month" on the current one only (MonthOpener). No explainer
 *   box, no counts of gaps; the count line lives in the Months sheet, which lists only months with letters.
 *   Choosing one cross-fades the list there over fadeMs, never an animated scroll.
 * - Airbnb cards: letter cards with generous radius, metadata muted below; excerpts end on a whole word.
 * - The end of the book: the quotation-pair mark after the oldest chapter (EndOfBook).
 * Motion: the first view per session settles the header (MOTION 5a) and the first 6 cards enter (5f); after that
 * nothing re-enters (5.8 rule 2). A kept letter arrives in place with the 1.6 s wash (5e, row 5). A card grows into
 * its page (CardToPage, row 7) and the page goes back into it. A deleted card collapses out of its row, and Undo
 * puts it back with the wash (S36). Lamp: the still `book` scene, sharing the tabs' light.
 */
import { Redirect, router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ScrollView, SectionList, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { billingCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { BookCover } from '@/components/book/book-cover';
import { BlurSurface } from '@/components/platform/blur-surface';
import { CardSource, useHiddenBehindCardPage } from '@/components/motion/card-transition';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { Lamp } from '@/components/ui/lamp';
import { useToast } from '@/components/ui/toast';
import { childIndexOf, track, trackBookOpened } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { speechSettingsCopy } from '@/lib/models/copy';
import { downloadingLine } from '@/lib/models/speech-download.logic';
import { planFor } from '@/lib/models/speech-packs';
import { springConfig, useMotion } from '@/lib/motion';
import { isReadItBack } from '@/lib/read-it-back';
import { deleteEntry, getSetting, listEntriesForChild, setSetting, subscribe, todayISO, undeleteEntry, type Entry } from '@/lib/store';
import { languageFor } from '@/lib/transcription-queue';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { bookHandoff, createArrivalGate, firstBookViewThisSession, firstSeen, parseSeen, secondFreeOnArrival, withLeaving } from '@/components/book/book.logic';
import { bookChapters, openerOf, type Chapter } from '@/components/book/chapters';
import { BookRow, LetterCard } from '@/components/book/letter-card';
import { letterWords } from '@/components/book/letter-words.logic';
import { MonthOpener } from '@/components/book/month-opener';
import { compactMonth, coverAge, jumpTarget, monthRows, runJump, showsMonthsButton, topChapterKey, type MonthRow } from '@/components/book/book-page.logic';
import { bookCopy } from '@/components/book/copy';
import { CoverBand } from '@/components/book/cover-band';
import { LensRow, PhotosGrid, type LensMode } from '@/components/photos/photos-lens';
import { longDate } from '@/lib/dates';
import { photoSurfaces, photosBuildEnabled } from '@/lib/photos/flag';
import { photosPausedNow } from '@/lib/photos/pause';
import { usePhotosLens } from '@/lib/photos/hooks';
import { EndOfBook } from '@/components/book/end-of-book';
import { MonthsSheet } from '@/components/book/months-sheet';
import { QuietDayRow } from '@/components/book/quiet-day-row';
import { isQuietMark, readableInBook } from '@/components/book/quiet-day.logic';
import { isOwnEntry } from '@/components/child/child-store';
import { joinedArrival } from '@/components/family/family-notice';
import { startJoinedArrival } from '@/components/family/joined-arrival.logic';
import { ChildSwitcher } from '@/components/child/child-switcher';
import { useChildren } from '@/components/child/use-children';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Entry, Chapter>);
/** Scroll distance over which the large title hands over to the inline bar. */
const TITLE_FADE = { start: 56, end: 96 };
/** The inline bar's title row, under the status bar. */
const BAR_HEIGHT = 44;
/** The other parent's letters this phone has shown (ids only, never words), so each washes once. */
const SEEN_KEY = 'book.seenFromOthers';

export default function Book() {
  const insets = useSafeAreaInsets();
  const { enter, reduced } = useMotion();
  const { children, active } = useChildren();
  const params = useLocalSearchParams<{ arrived?: string; secondFree?: string }>();
  // This book's letters are read in the initialiser, so the first frame is the book and never the empty-book state
  // (a Book that mounts with `arrived` has to find its card on that first look). `read.childId` says whose letters
  // these are, so the arrival waits for the right book.
  const [read, setRead] = useState(() => ({ childId: active?.id ?? null, entries: active ? listEntriesForChild(active.id) : [] }));
  const entries = read.entries;
  const loaded = read.childId === (active?.id ?? null);
  const leaving = useSyncExternalStore(bookHandoff.subscribe, bookHandoff.get, bookHandoff.get);
  const [washes, setWashes] = useState<Record<string, number>>({});
  const behind = useHiddenBehindCardPage();
  const y = useSharedValue(0);
  const toast = useToast();
  const deleteToastUp = useRef(false);
  const listRef = useRef<SectionList<Entry, Chapter> | null>(null);
  // The Months sheet, the chapter at the top of the list (the bar's compact month), whether the bar is up (its
  // buttons take touches and VoiceOver only then), and the list's cross-fade for a jump to a month.
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [topKey, setTopKey] = useState<string | null>(null);
  const [barUp, setBarUp] = useState(false);
  const listFade = useSharedValue(1);
  // The first view this session settles the header and staggers the first cards; returns move nothing (5.8 rule 2).
  const [firstView] = useState(firstBookViewThisSession);
  const [stagger, setStagger] = useState(firstView && !params.arrived);
  useEffect(() => setStagger(false), []);
  // The second parent's first Book (S59, 5.8 row 12; the join sheet's "Open the book" leaves the mark): its light rises from unlit over arriveMs, once.
  const [joinedAt, setJoinedAt] = useState(() => (joinedArrival.waiting() ? startJoinedArrival() : 0));
  useFocusEffect(
    useCallback(() => {
      if (joinedArrival.take()) setJoinedAt((t) => t || startJoinedArrival());
    }, []),
  );

  useEffect(() => {
    if (!active) return;
    const reread = () => setRead({ childId: active.id, entries: listEntriesForChild(active.id) });
    // The initialiser has just read this book: read again only for another book, or on a change (no second read at mount).
    if (read.childId !== active.id) reread();
    return subscribe(reread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const today = todayISO();
  const shown = useMemo(() => (active ? withLeaving(entries, leaving, active.id) : []), [entries, leaving, active]);
  const chapters = useMemo(() => (active ? bookChapters(shown, active, today) : []), [shown, active, today]);
  const rows = useMemo(() => monthRows(chapters), [chapters]);
  const readBack = useMemo(() => new Set(entries.filter((e) => e.captureMode !== 'typed' && isReadItBack(e.id)).map((e) => e.id)), [entries]);

  const wash = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const at = Date.now();
    setWashes((w) => ({ ...w, ...Object.fromEntries(ids.map((id) => [id, at])) }));
  }, []);

  // The other parent's letter, the first time this phone shows it: the same wash as a letter just kept, once.
  useEffect(() => {
    if (!active || entries.length === 0) return;
    const raw = getSetting(SEEN_KEY);
    const next = firstSeen(entries, (e) => isOwnEntry(e as Entry), parseSeen(raw));
    wash(next.wash);
    const value = JSON.stringify(next.seen);
    if (value !== raw) setSetting(SEEN_KEY, value);
  }, [entries, active, wash]);

  // A kept letter arrives (5.8 row 5, P4 sets `arrived`): position the list on it under its opener at once, then, when
  // the Book is uncovered (Review dissolves away over it), wash it once and clear the param, so Back and tab taps
  // never replay it. The param stays until this book's letters are read and the card is found (P5 critics' pass, S1):
  // a Book that mounts with it, which is every first letter, must not lose the wash.
  const pendingScroll = useRef<{ sectionIndex: number; itemIndex: number } | null>(null);
  const scrollToArrival = useCallback(() => {
    const at = pendingScroll.current;
    const list = listRef.current;
    if (!at || !list) return;
    pendingScroll.current = null;
    // Near the top of its month: show the month's opener with it. Further down: the card itself, a third down the screen.
    const target = at.itemIndex < 3 ? { sectionIndex: at.sectionIndex, itemIndex: 0, viewPosition: 0 } : { sectionIndex: at.sectionIndex, itemIndex: at.itemIndex + 1, viewPosition: 0.3 };
    if (at.sectionIndex === 0 && at.itemIndex < 3) return; // already in view at the top of the book
    list.scrollToLocation({ ...target, animated: false });
  }, []);
  const [arrivalGate] = useState(createArrivalGate);
  const arrivalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The param is cleared on this screen's own route (`navigation`), never the focused one: a delayed `router.setParams`
  // would clear whichever screen the person has moved to by then.
  const navigation = useNavigation<{ setParams: (params: Record<string, unknown>) => void }>();
  const clearArrivalParams = useCallback(() => navigation.setParams({ arrived: undefined, secondFree: undefined }), [navigation]);
  // Leaving the Book, or closing it, while the wash waits: no wash or toast over another screen, and the param goes now.
  useFocusEffect(
    useCallback(
      () => () => {
        if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
        arrivalTimer.current = null;
        if (arrivalGate.leave()) clearArrivalParams();
      },
      [arrivalGate, clearArrivalParams],
    ),
  );
  useEffect(() => {
    const step = arrivalGate.step({ param: params.arrived, sections: chapters, loaded, reduced });
    if (step.act !== 'run') return;
    const { arrival } = step;
    // The second kept letter (S21, D-082): one calm line once the landing is done, no action, no count of what is left.
    const secondFree = secondFreeOnArrival(params.secondFree);
    if (arrival) {
      pendingScroll.current = { sectionIndex: arrival.sectionIndex, itemIndex: arrival.itemIndex };
      scrollToArrival();
    }
    if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    arrivalTimer.current = setTimeout(() => {
      arrivalTimer.current = null;
      arrivalGate.finish();
      if (arrival) wash([arrival.id]);
      if (secondFree) toast.show({ message: billingCopy.keepGate.secondFreeNote });
      clearArrivalParams();
    }, step.afterMs);
    // The gate runs each param once; only the param, the letters and the read decide when to ask it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.arrived, chapters, loaded]);

  // Back on the Book after a letter was deleted from its page (S36): the card leaves its row, and one toast with
  // Undo sits above the tab bar until Undo, Close or leaving the Book. No timer: it carries an action.
  useFocusEffect(
    useCallback(() => {
      const gone = bookHandoff.take();
      if (gone) {
        deleteToastUp.current = true;
        toast.show({
          message: copy.settings.delete.entryToast,
          action: {
            label: copy.common.undoButton,
            testID: 'book.undo',
            onPress: () => {
              deleteToastUp.current = false;
              track('letter_deleted', { action: 'restored', destination: gone.inBook ? 'book' : 'private' });
              undeleteEntry(gone.id);
              wash([gone.id]);
            },
          },
          onDismiss: () => {
            deleteToastUp.current = false;
          },
        });
      }
      return () => {
        if (deleteToastUp.current) {
          deleteToastUp.current = false;
          toast.hide();
        }
      };
    }, [toast, wash]),
  );

  // book_opened each time the Book tab comes into view for a book (bucketed letter count only).
  const activeId = active?.id ?? null;
  useFocusEffect(
    useCallback(() => {
      if (!activeId) return;
      const letters = listEntriesForChild(activeId).filter((e) => e.kind !== 'not_much').length;
      trackBookOpened({ childIndex: childIndexOf(activeId), letters, role: 'parent' });
    }, [activeId]),
  );

  // Choosing another book cross-fades the Book's content over 200 ms (S25); the first book shows without a fade.
  const shownChild = useRef<string | null>(null);
  const switched = shownChild.current !== null && shownChild.current !== activeId;
  useEffect(() => {
    shownChild.current = activeId;
  }, [activeId]);

  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const barStyle = useAnimatedStyle(() => {
    const o = reduced ? (y.value > TITLE_FADE.end ? 1 : 0) : interpolate(y.value, [TITLE_FADE.start, TITLE_FADE.end], [0, 1], Extrapolation.CLAMP);
    return { opacity: o };
  }, [reduced]);
  // The bar's buttons are live once it is mostly in, and gone (no touches, not read) while the band is in view.
  useAnimatedReaction(
    () => y.value > (TITLE_FADE.start + TITLE_FADE.end) / 2,
    (up, was) => {
      if (up !== was) runOnJS(setBarUp)(up);
    },
  );
  const listStyle = useAnimatedStyle(() => ({ opacity: listFade.value }));
  // The chapter at the top of the list, for the compact month in the bar: a render only when it changes.
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { section?: { key?: string } | null }[] }) => {
    const key = topChapterKey(viewableItems);
    if (key) setTopKey((k) => (k === key ? k : key));
  }).current;
  // Going to a month (book-page.md 3): no animated scroll. The list fades out, moves at once, and fades back in,
  // over fadeMs in all (a fade either way, so Reduce Motion keeps it). runJump (book-page.logic.ts) always fades the
  // list back in, finds the month again by its key when the fade ends (the list may have changed since the tap), and
  // tries a month the list has not measured yet again after the next layout, a bounded number of times.
  const chaptersNow = useRef(chapters);
  chaptersNow.current = chapters;
  const barHeight = useRef(0);
  const jumpFailed = useRef(false);
  const pendingJump = useRef<(() => void) | null>(null);
  const runPendingJump = useCallback(() => {
    const retry = pendingJump.current;
    pendingJump.current = null;
    retry?.();
  }, []);
  const jumpTo = useCallback(
    (row: MonthRow) => {
      setMonthsOpen(false);
      const half = tokens.motion.fadeMs / 2;
      runJump({
        fadeOut: (next) => {
          listFade.value = withTiming(0, { duration: half, reduceMotion: ReduceMotion.Never }, () => runOnJS(next)());
        },
        locate: () => jumpTarget(chaptersNow.current, row.key),
        scroll: (sectionIndex) => {
          jumpFailed.current = false;
          // The bar's whole height (status bar, title row and the compact month), so the heading lands under it.
          const viewOffset = barHeight.current || insets.top + BAR_HEIGHT;
          listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewPosition: 0, viewOffset, animated: false });
          return !jumpFailed.current;
        },
        afterLayout: (retry) => {
          pendingJump.current = retry;
          // The next content size change runs it; a frame later at the latest, if the size does not change.
          requestAnimationFrame(() => requestAnimationFrame(runPendingJump));
        },
        fadeIn: () => {
          listFade.value = withTiming(1, { duration: half, reduceMotion: ReduceMotion.Never });
        },
      });
    },
    [insets.top, listFade, runPendingJump],
  );

  // The Photos lens (NS-01-R10 to R12): offered only once a kept, open letter has a picture; absent when the switch is off.
  const [lensMode, setLensMode] = useState<LensMode>('months');
  const lens = usePhotosLens(active?.id ?? null, (iso) => longDate(iso));
  const lensOn = photoSurfaces({ build: photosBuildEnabled(), paused: photosPausedNow() }).lens && lens.visible;
  const showPhotos = lensOn && lensMode === 'photos';

  if (children.length === 0 || !active) return <Redirect href="/onboarding" />;

  const child = active.name;
  const title = fill(copy.book.title, { child });
  const open = (id: string) => router.push({ pathname: '/letter/[id]', params: { id } });
  // Remove a quiet-day mark: reversible, with Undo (COMPONENTS 2.14).
  const removeMark = (id: string) => {
    deleteEntry(id);
    toast.show({ message: copy.book.quietDay.removedToast, action: { label: copy.notMuch.undo, onPress: () => undeleteEntry(id) } });
  };

  // Stagger only the first 6 cards on screen, on the first view (MOTION 5f).
  const indexOf = new Map<string, number>();
  let n = 0;
  for (const ch of chapters) for (const e of ch.data) indexOf.set(e.id, n++);
  const entering = (id: string) => (stagger ? enter(indexOf.get(id) ?? 99) : undefined);

  const canRead = readableInBook(entries).length > 0;
  const months = showsMonthsButton(rows) ? { label: bookCopy.monthsButton, hint: bookCopy.monthsHint, onPress: () => setMonthsOpen(true) } : null;
  const openSettings = () => router.push('/settings');
  const header = (
    <Settle run={firstView && !params.arrived} reduced={reduced}>
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 4 }}>
        {/* The cover band (book-page.md 2): the one lit object. One book: "Asha's book" already says the name (S24).
            Read together only for what it can read: kept letters with words, as the screen itself reads them (L4). */}
        <CoverBand
          title={title}
          age={coverAge(active, today)}
          switcher={children.length > 1 ? <ChildSwitcher /> : null}
          readTogether={canRead ? { label: copy.readTogether.title, hint: fill(copy.readTogether.subtitle, { child }), onPress: () => router.push({ pathname: '/read-together', params: { childId: active.id } }) } : null}
          months={chapters.length > 0 ? months : null}
          settings={{ label: copy.settings.title, onPress: openSettings }}
        />
        {lensOn ? (
          <View className="pt-2">
            <LensRow mode={lensMode} onChange={setLensMode} />
          </View>
        ) : null}
        {/* P8c (S62): <RestoreLine /> from components/backup/restore-line.tsx sits here, above the first opener, while
            recordings come back to a new phone. It lands with P8c's file. */}
      </View>
    </Settle>
  );

  // The inline bar after scroll (book-page.md 2): the title, Months and the gear, then the compact month at the top of
  // the list, which wraps and never truncates. It cross-fades in with the scroll; while it is out, nothing in it takes a
  // touch or is read (the band is in view with the same buttons).
  const compact = compactMonth(chapters, topKey ?? chapters[0]?.key ?? null);
  const topBar = (
    <Animated.View
      pointerEvents={barUp ? 'box-none' : 'none'}
      style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, barStyle]}
      onLayout={(e) => {
        barHeight.current = e.nativeEvent.layout.height;
      }}
      accessibilityElementsHidden={!barUp}
      importantForAccessibility={barUp ? 'auto' : 'no-hide-descendants'}>
      <BlurSurface edge="bottom" style={{ paddingTop: insets.top, paddingBottom: tokens.space[2], paddingHorizontal: tokens.space[5] }}>
        <View className="flex-row items-center gap-2" style={{ minHeight: BAR_HEIGHT }}>
          <Text variant="headline" className="flex-1" maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          {months ? <Button variant="quiet" size="sm" label={months.label} accessibilityHint={months.hint} onPress={months.onPress} testID="book.bar.months" /> : null}
          <IconButton icon={GearSixIcon} label={copy.settings.title} onPress={openSettings} className="-mr-2" testID="book.bar.settings" />
        </View>
        {compact ? (
          <View accessible accessibilityRole="header" accessibilityLabel={compact.a11yLabel} className="flex-row flex-wrap items-baseline gap-x-3" testID="book.bar.month">
            <Text variant="subhead">{compact.heading}</Text>
            {compact.range ? <Text variant="footnote">{compact.range}</Text> : null}
          </View>
        ) : null}
      </BlurSurface>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background" {...behind}>
      {joinedAt ? <Lamp key={joinedAt} scene="book" persistKey="tabs" arrive /> : <Lamp scene="book" persistKey="tabs" />}
      <Animated.View key={active.id} className="flex-1" entering={switched ? FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never) : undefined}>
        {showPhotos ? (
          <ScrollView className="flex-1" testID="book.photosPage">
            {header}
            <PhotosGrid lens={lens} onOpen={open} />
          </ScrollView>
        ) : chapters.length === 0 ? (
          <View className="flex-1">
            {header}
            {/* S24: the closed cover the person named and signed in first run, 160 x 214, centred and still (the lamp is
                the only light). Decorative to VoiceOver: the heading above already says "Asha's book", so the reader
                hears the title, the body and the button, never the name twice. No count of what is missing. */}
            <View className="flex-1 items-center justify-center gap-8 px-5">
              <BookCover name={child} signsAs={active.signsAs} size="lg" animate={false} />
              <EmptyState align="center" title={copy.book.empty.bookTitle} body={fill(copy.book.empty.bookBody, { child })} />
            </View>
            <View className="px-5 pb-6">
              <Button size="lg" fullWidth label={copy.book.empty.bookCta} onPress={() => router.navigate('/')} />
            </View>
          </View>
        ) : (
          <>
            <Animated.View className="flex-1" style={listStyle}>
            <AnimatedSectionList
              ref={listRef as never}
              sections={chapters}
              keyExtractor={(e: Entry) => e.id}
              ListHeaderComponent={header}
              ListFooterComponent={EndOfBook}
              onViewableItemsChanged={onViewableItemsChanged}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                scrollToArrival();
                runPendingJump();
              }}
              onScrollToIndexFailed={(info: { averageItemLength: number; index: number }) => {
                // Not measured yet: go near it, then the next layout finishes the job (the arrival's pendingScroll, or
                // the jump's retry).
                jumpFailed.current = true;
                (listRef.current as unknown as { getScrollResponder?: () => { scrollTo?: (o: { y: number; animated: boolean }) => void } } | null)
                  ?.getScrollResponder?.()
                  ?.scrollTo?.({ y: info.averageItemLength * info.index, animated: false });
              }}
              renderSectionHeader={({ section }: { section: Chapter }) => <MonthOpener opener={openerOf(section)} first={section.key === chapters[0].key} />}
              renderItem={({ item }: { item: Entry }) =>
                isQuietMark(item) ? (
                  <QuietDayRow entry={item} child={active} reduced={reduced} entering={entering(item.id)} onRemove={removeMark} />
                ) : (
                  <BookRow entering={entering(item.id)} reduced={reduced}>
                    {/* Measured on touch-down, so the card can grow into its page (CardToPage, P1's contract). */}
                    <CardSource id={item.id}>
                      {letterWords(item) === 'waiting' ? (
                        <WaitingCard entry={item} child={active} onPress={open} wash={washes[item.id]} />
                      ) : (
                        <LetterCard entry={item} child={active} onPress={open} wash={washes[item.id]} reason={readBack.has(item.id) ? copy.book.waitingReady : null} />
                      )}
                    </CardSource>
                  </BookRow>
                )
              }
            />
            </Animated.View>
            {topBar}
            <MonthsSheet open={monthsOpen} rows={rows} onClose={() => setMonthsOpen(false)} onChoose={jumpTo} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

/**
 * The waiting card's live reason beside its length (S26): "Getting ready, 40%" while the speech files download, or
 * "Waits for Wi-Fi, 575 MB". Only waiting cards follow the words queue, so the rest of the Book never re-renders on
 * its tick.
 */
function WaitingCard(props: Omit<Parameters<typeof LetterCard>[0], 'reason'>) {
  const job = useWordsJob(props.entry.id);
  const packWait = job?.phase === 'waiting_for_pack';
  const language = packWait ? languageFor(props.entry.id) : null;
  const download = useSpeechDownload(language);
  const s = speechSettingsCopy;
  const reason = !language
    ? null
    : download.progress !== null
      ? downloadingLine(download.progress, (n) => fill(s.downloading, { n }))
      : download.hold === 'waiting_for_wifi'
        ? fill(s.waitingForWifi, { n: Math.round(planFor([language]).bytes / 1e6) })
        : null;
  return <LetterCard {...props} reason={reason} />;
}

/** The first Book view per session: the header settles, opacity 0.6 to 1 and up 6 pt, on `gentle` (MOTION 5a). */
function Settle({ run, reduced, children }: { run: boolean; reduced: boolean; children: ReactNode }) {
  const o = useSharedValue(run ? 0.6 : 1);
  const dy = useSharedValue(run && !reduced ? 6 : 0);
  useEffect(() => {
    if (!run) return;
    if (reduced) {
      o.value = withTiming(1, { duration: tokens.motion.fadeMs, reduceMotion: ReduceMotion.Never });
      return;
    }
    o.value = withSpring(1, springConfig('gentle'));
    dy.value = withSpring(0, springConfig('gentle'));
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: dy.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
