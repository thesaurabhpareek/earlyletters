/**
 * Book: chapters by month of age, newest first (DESIGN_LANGUAGE 12, Book).
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Apple large title: "Asha's book" scrolls under a material bar that fades in with an
 *   inline title (Apple Books Library, Journal). Reduce Motion: the bar switches, no fade.
 * - Things 3 headings: each month is a typographic divider, not a boxed section.
 * - Airbnb cards: letter cards with generous radius, metadata muted below.
 * - Headspace / Calm empty state: one breathing drawing, one plain sentence, one action.
 * Motion: the first 6 cards enter (280 ms, 30 ms stagger); nothing else moves on its own.
 */
import { Redirect, router, useFocusEffect } from 'expo-router';
import { BookOpenTextIcon } from 'phosphor-react-native/src/icons/BookOpenText';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurSurface } from '@/components/platform/blur-surface';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Text } from '@/components/ui/text';
import { childIndexOf, trackBookOpened } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { useMotion } from '@/lib/motion';
import { listEntriesForChild, subscribe, todayISO, type Entry } from '@/lib/store';
import { chapterTitle, groupChapters, monthFor, type Chapter } from '@/components/book/chapters';
import { LetterCard } from '@/components/book/letter-card';
import { ChildSwitcher } from '@/components/child/child-switcher';
import { useChildren } from '@/components/child/use-children';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Entry, Chapter>);
/** Scroll distance over which the large title hands over to the inline bar. */
const TITLE_FADE = { start: 56, end: 96 };

export default function Book() {
  const insets = useSafeAreaInsets();
  const { enter, reduced } = useMotion();
  const { children, active } = useChildren();
  const [entries, setEntries] = useState<Entry[]>([]);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    const read = () => setEntries(listEntriesForChild(active.id));
    read();
    return subscribe(read);
  }, [active?.id]);

  const chapters = useMemo(() => (active ? groupChapters(entries, active) : []), [entries, active]);

  // book_opened each time the Book tab comes into view for a book (bucketed letter count only).
  const activeId = active?.id ?? null;
  useFocusEffect(
    useCallback(() => {
      if (!activeId) return;
      const letters = listEntriesForChild(activeId).filter((e) => e.kind !== 'not_much').length;
      trackBookOpened({ childIndex: childIndexOf(activeId), letters, role: 'parent' });
    }, [activeId]),
  );

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
  const currentMonth = monthFor(active, todayISO());
  const currentEmpty = chapters.length > 0 && chapters[0].month !== currentMonth && currentMonth !== null;
  const open = (id: string) => router.push({ pathname: '/letter/[id]', params: { id } });

  // Stagger only the first 6 cards on screen (MOTION 5f).
  const indexOf = new Map<string, number>();
  let n = 0;
  for (const ch of chapters) for (const e of ch.data) indexOf.set(e.id, n++);

  const header = (
    <View className="gap-3 px-5 pb-2" style={{ paddingTop: insets.top + 4 }}>
      <View className="flex-row items-center justify-between">
        <ChildSwitcher />
        <IconButton icon={GearSixIcon} label={copy.settings.title} onPress={() => router.push('/settings')} className="-mr-2" />
      </View>
      <Text variant="display" asHeading={1}>
        {title}
      </Text>
      {entries.some((e) => e.inBook) && (
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
      {currentEmpty && (
        // accentSoft card: label accent 4.74 / 5.99, body textMuted 4.75 / 5.73 (AA).
        <Animated.View entering={enter(0)} className="mt-3">
          <Card variant="tinted" padding={5} className="gap-1.5">
            <Text variant="caption" caps tone="accent" style={{ letterSpacing: 1 }}>
              {copy.book.thisMonthLabel}
            </Text>
            <Text variant="title2">{currentMonth === 0 ? chapterTitle(0) : fill(copy.book.empty.chapterTitle, { month: currentMonth })}</Text>
            <Text variant="callout" tone="muted">
              {copy.book.empty.chapterBody}
            </Text>
          </Card>
        </Animated.View>
      )}
    </View>
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
    <View className="flex-1 bg-background">
      {chapters.length === 0 ? (
        <View className="flex-1">
          {header}
          <View className="flex-1 justify-center px-5 pb-16">
            <EmptyState
              art="page"
              title={copy.book.empty.bookTitle}
              body={fill(copy.book.empty.bookBody, { child })}
              action={{ label: copy.book.empty.bookCta, onPress: () => router.navigate('/') }}
            />
          </View>
        </View>
      ) : (
        <>
          <AnimatedSectionList
            sections={chapters}
            keyExtractor={(e: Entry) => e.id}
            ListHeaderComponent={header}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderSectionHeader={({ section }: { section: Chapter }) => (
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={[section.title, section.countLine, section.fromLine].join('. ')}
                className="gap-1 px-5 pb-3 pt-8">
                <Text variant="title1">{section.title}</Text>
                <Text variant="footnote">
                  {section.countLine} · {section.fromLine}
                </Text>
              </View>
            )}
            renderItem={({ item }: { item: Entry }) => (
              <LetterCard entry={item} child={active} reduced={reduced} entering={enter(indexOf.get(item.id) ?? 99)} onPress={open} />
            )}
          />
          {topBar}
        </>
      )}
    </View>
  );
}
