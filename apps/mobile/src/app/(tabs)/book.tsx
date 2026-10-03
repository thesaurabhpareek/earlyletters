import { Redirect, router } from 'expo-router';
import { BookOpenTextIcon, GearSixIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, View, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { useMotion } from '@/lib/motion';
import { listEntriesForChild, subscribe, todayISO, type Entry } from '@/lib/store';
import { chapterTitle, groupChapters, monthFor, type Chapter } from '@/components/book/chapters';
import { LetterCard } from '@/components/book/letter-card';
import { ChildSwitcher } from '@/components/child/child-switcher';
import { useChildren } from '@/components/child/use-children';

/** Book: chapters by month of age, newest first (DESIGN_LANGUAGE 12, Book). */
export default function Book() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { enter, reduced } = useMotion();
  const { children, active } = useChildren();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!active) return;
    const read = () => setEntries(listEntriesForChild(active.id));
    read();
    return subscribe(read);
  }, [active?.id]);

  const chapters = useMemo(() => (active ? groupChapters(entries, active) : []), [entries, active]);

  if (children.length === 0 || !active) return <Redirect href="/onboarding" />;

  const child = active.name;
  const currentMonth = monthFor(active, todayISO());
  const currentEmpty = chapters.length > 0 && chapters[0].month !== currentMonth && currentMonth !== null;
  const open = (id: string) => router.push({ pathname: '/letter/[id]', params: { id } });

  // Stagger only the first 6 cards on screen (MOTION 5f).
  const indexOf = new Map<string, number>();
  let n = 0;
  for (const ch of chapters) for (const e of ch.data) indexOf.set(e.id, n++);

  const header = (
    <View className="gap-2 px-5 pb-4 pt-2">
      <View className="flex-row items-center justify-between">
        <ChildSwitcher />
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={copy.settings.title}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-secondary">
          <GearSixIcon size={24} color={c.textMuted} />
        </Pressable>
      </View>
      <Text role="heading" maxFontSizeMultiplier={1.5} className="font-serif text-4xl leading-[44px] text-foreground">
        {fill(copy.book.title, { child })}
      </Text>
      {entries.some((e) => e.inBook) && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-1 self-start"
          onPress={() => router.push({ pathname: '/read-together', params: { childId: active.id } })}
          accessibilityHint={fill(copy.readTogether.subtitle, { child })}>
          <BookOpenTextIcon size={18} color={c.accent} />
          <Text>{copy.readTogether.title}</Text>
        </Button>
      )}
      {currentEmpty && (
        // accentSoft card: visible on bg in both modes; label accent 4.74 / 5.99, body textMuted 4.75 / 5.73 (AA).
        <Animated.View entering={enter(0)} className="mt-3 gap-1 rounded-[20px] bg-secondary p-5">
          <Text className="text-xs font-medium tracking-[1.2px] text-primary">{copy.book.thisMonthLabel.toUpperCase()}</Text>
          <Text className="font-serif text-xl text-foreground">
            {currentMonth === 0 ? chapterTitle(0) : fill(copy.book.empty.chapterTitle, { month: currentMonth })}
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">{copy.book.empty.chapterBody}</Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {chapters.length === 0 ? (
        <View className="flex-1">
          {header}
          <Animated.View entering={enter(0)} className="flex-1 justify-center gap-4 px-5 pb-16">
            <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
              {copy.book.empty.bookTitle}
            </Text>
            <Text className="text-lg leading-7 text-muted-foreground">{fill(copy.book.empty.bookBody, { child })}</Text>
            <Button className="mt-2 self-start" onPress={() => router.navigate('/')}>
              <Text>{copy.book.empty.bookCta}</Text>
            </Button>
          </Animated.View>
        </View>
      ) : (
        <SectionList<Entry, Chapter>
          sections={chapters}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={header}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="pb-10"
          renderSectionHeader={({ section }) => (
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={[section.title, section.countLine, section.fromLine].join('. ')}
              className="gap-1 px-5 pb-3 pt-6">
              <Text className="font-serif text-2xl text-foreground">{section.title}</Text>
              <Text maxFontSizeMultiplier={1.5} className="text-sm text-muted-foreground">
                {section.countLine} · {section.fromLine}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <LetterCard entry={item} child={active} reduced={reduced} entering={(indexOf.get(item.id) ?? 99) < 6 ? enter(indexOf.get(item.id)) : undefined} onPress={open} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
