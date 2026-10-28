/**
 * Book: chapters by month of age, newest first, read like a printed book (DESIGN_LANGUAGE 12, EXPERIENCE_PASS S24 to
 * S26, S36; 5.8 rows 5 and 7).
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Apple large title: "Asha's book" scrolls under a material bar that fades in with an
 *   inline title (Apple Books Library, Journal). Reduce Motion: the bar switches, no fade.
 * - A printed book's chapter openers: a kicker, a large numeral and the dates, a hairline between chapters; the
 *   current month lit like the page under a lamp (MonthOpener). No explainer box, no counts of gaps.
 * - Airbnb cards: letter cards with generous radius, metadata muted below; excerpts end in a fade.
 * Motion: the first view per session settles the header (MOTION 5a) and the first 6 cards enter (5f); after that
 * nothing re-enters (5.8 rule 2). A kept letter arrives in place with the 1.6 s wash (5e, row 5). A card grows into
 * its page (CardToPage, row 7) and the page goes back into it. A deleted card collapses out of its row, and Undo
 * puts it back with the wash (S36). Lamp: the still `book` scene, sharing the tabs' light.
 */
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BookOpenTextIcon } from 'phosphor-react-native/src/icons/BookOpenText';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SectionList, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  ReduceMotion,
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
import { EmptyState } from '@/components/ui/empty-state';
import { Lamp } from '@/components/ui/lamp';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { childIndexOf, track, trackBookOpened } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { speechSettingsCopy } from '@/lib/models/copy';
import { planFor } from '@/lib/models/speech-packs';
import { springConfig, useMotion } from '@/lib/motion';
import { isReadItBack } from '@/lib/read-it-back';
import { deleteEntry, getSetting, listEntriesForChild, setSetting, subscribe, todayISO, undeleteEntry, type Entry } from '@/lib/store';
import { languageFor } from '@/lib/transcription-queue';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { arrivalOf, arrivalToastDelayMs, bookHandoff, firstBookViewThisSession, firstSeen, parseSeen, secondFreeOnArrival, withLeaving } from '@/components/book/book.logic';
import { bookChapters, openerOf, type Chapter } from '@/components/book/chapters';
import { BookRow, LetterCard } from '@/components/book/letter-card';
import { letterWords } from '@/components/book/letter-words.logic';
import { MonthOpener } from '@/components/book/month-opener';
import { QuietDayRow } from '@/components/book/quiet-day-row';
import { isQuietMark } from '@/components/book/quiet-day.logic';
import { isOwnEntry } from '@/components/child/child-store';
import { joinedArrival } from '@/components/family/family-notice';
import { ChildSwitcher } from '@/components/child/child-switcher';
import { useChildren } from '@/components/child/use-children';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Entry, Chapter>);
/** Scroll distance over which the large title hands over to the inline bar. */
const TITLE_FADE = { start: 56, end: 96 };
/** The other parent's letters this phone has shown (ids only, never words), so each washes once. */
const SEEN_KEY = 'book.seenFromOthers';

export default function Book() {
  const insets = useSafeAreaInsets();
  const { enter, reduced } = useMotion();
  const { children, active } = useChildren();
  const params = useLocalSearchParams<{ arrived?: string; secondFree?: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const leaving = useSyncExternalStore(bookHandoff.subscribe, bookHandoff.get, bookHandoff.get);
  const [washes, setWashes] = useState<Record<string, number>>({});
  const behind = useHiddenBehindCardPage();
  const y = useSharedValue(0);
  const toast = useToast();
  const deleteToastUp = useRef(false);
  const listRef = useRef<SectionList<Entry, Chapter> | null>(null);
  // The first view this session settles the header and staggers the first cards; returns move nothing (5.8 rule 2).
  const [firstView] = useState(firstBookViewThisSession);
  const [stagger, setStagger] = useState(firstView && !params.arrived);
  useEffect(() => setStagger(false), []);
  // The second parent's first Book (S59, 5.8 row 12; the join sheet's "Open the book" leaves the mark): its light rises from unlit over arriveMs, once.
  const [joinedAt, setJoinedAt] = useState(() => (joinedArrival.waiting() ? Date.now() : 0));
  useFocusEffect(
    useCallback(() => {
      if (joinedArrival.take()) setJoinedAt((t) => t || Date.now());
    }, []),
  );

  useEffect(() => {
    if (!active) return;
    const read = () => setEntries(listEntriesForChild(active.id));
    read();
    return subscribe(read);
  }, [active?.id]);

  const today = todayISO();
  const shown = useMemo(() => (active ? withLeaving(entries, leaving, active.id) : []), [entries, leaving, active]);
  const chapters = useMemo(() => (active ? bookChapters(shown, active, today) : []), [shown, active, today]);
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

  // A kept letter arrives (5.8 row 5, P4 sets `arrived`): position the list on it under its opener, wash it once,
  // and clear the param so Back and tab taps never replay it.
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
  const arrival = arrivalOf(params.arrived, chapters);
  const secondFreeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (secondFreeTimer.current) clearTimeout(secondFreeTimer.current);
  }, []);
  useEffect(() => {
    if (!params.arrived) return;
    if (arrival) {
      wash([arrival.id]);
      pendingScroll.current = { sectionIndex: arrival.sectionIndex, itemIndex: arrival.itemIndex };
      scrollToArrival();
    }
    // The second kept letter (S21, D-082): one calm line once the landing is done, no action, no count of what is left.
    if (secondFreeOnArrival(params.secondFree)) {
      secondFreeTimer.current = setTimeout(() => toast.show({ message: billingCopy.keepGate.secondFreeNote }), arrivalToastDelayMs(reduced));
    }
    router.setParams({ arrived: undefined, secondFree: undefined });
    // Only a new param is an arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.arrived]);

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

  const header = (
    <Settle run={firstView && !params.arrived} reduced={reduced}>
      <View className="gap-3 px-5 pb-2" style={{ paddingTop: insets.top + 4 }}>
        <View className="min-h-11 flex-row items-center justify-between">
          {/* One book: "Asha's book" already says the name (S24). */}
          {children.length > 1 ? <ChildSwitcher /> : <View />}
          <IconButton icon={GearSixIcon} label={copy.settings.title} onPress={() => router.push('/settings')} className="-mr-2" />
        </View>
        <Text variant="display" asHeading={1}>
          {title}
        </Text>
        {entries.some((e) => e.inBook && !isQuietMark(e)) && (
          <Button
            variant="secondary"
            size="sm"
            icon={BookOpenTextIcon}
            label={copy.readTogether.title}
            className="self-start"
            onPress={() => router.push({ pathname: '/read-together', params: { childId: active.id } })}
            accessibilityHint={fill(copy.readTogether.subtitle, { child })}
          />
        )}
        {/* P8c (S62): <RestoreLine /> from components/backup/restore-line.tsx sits here, above the first opener, while
            recordings come back to a new phone. It lands with P8c's file. */}
      </View>
    </Settle>
  );

  const topBar = (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, barStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BlurSurface edge="bottom" style={{ paddingTop: insets.top, height: insets.top + 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headline" numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
      </BlurSurface>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background" {...behind}>
      {joinedAt ? <Lamp key={joinedAt} scene="book" arrive /> : <Lamp scene="book" persistKey="tabs" />}
      <Animated.View key={active.id} className="flex-1" entering={switched ? FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never) : undefined}>
        {chapters.length === 0 ? (
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
            <AnimatedSectionList
              ref={listRef as never}
              sections={chapters}
              keyExtractor={(e: Entry) => e.id}
              ListHeaderComponent={header}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={scrollToArrival}
              onScrollToIndexFailed={(info: { averageItemLength: number; index: number }) => {
                // Not measured yet: go near it, then the next layout finishes the job.
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
            {topBar}
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
      ? fill(s.downloading, { n: Math.floor(download.progress * 100) })
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
