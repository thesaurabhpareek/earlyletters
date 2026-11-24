import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { leftBookPage } from '@/components/settings/left-books.logic';
import { BookRow, LetterCard } from '@/components/book/letter-card';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { UIProvider } from '@/components/ui/provider';
import { useReducedMotion } from '@/lib/motion';
import { listLeftBookEntries, listLeftBooks, subscribeTo, type Entry } from '@/lib/store';

/**
 * Letters to {child} (BL-444 slice 2, D-113, F11 6.2 D step 4): the letters this person wrote in a book this phone has
 * left, to read. Opened from Settings, under Children. The list is the Book's own LetterCard, newest first, and each
 * opens the letter page, which draws no edit control for a left book's letter (app/letter/[id].tsx).
 *
 * It reads only `listLeftBooks` and `listLeftBookEntries`, so a book that was joined again, one another signed-in
 * account would see, and one with no letter left to show all read as the one calm empty line. Nothing is written here.
 * Export and Delete for these letters are later slices; this page says nothing about either, and nothing about
 * freshness (a left book is no longer pulled).
 *
 * Accessibility: the card is one VoiceOver element carrying every word of the letter (LetterCard), the lead line is
 * plain text that scales with Dynamic Type, and the rows enter without motion under Reduce Motion (`useReducedMotion`).
 */
export default function LeftBookScreen() {
  return (
    <UIProvider>
      <LeftBook />
    </UIProvider>
  );
}

function LeftBook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reduced = useReducedMotion();
  const read = useCallback(() => leftBookPage(listLeftBooks(), id, listLeftBookEntries), [id]);
  const [page, setPage] = useState(read);
  useEffect(() => subscribeTo(['entries', 'children', 'settings'], () => setPage(read())), [read]);
  // Back from a letter, or from a sign-in change, the page reads again.
  useFocusEffect(useCallback(() => setPage(read()), [read]));

  if (!page.child) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: page.title }} />
        <StateScreen kind="empty" art="page" title={page.empty ?? ''} />
      </View>
    );
  }
  const child = page.child;
  const open = (entryId: string) => router.push({ pathname: '/letter/[id]', params: { id: entryId } });
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: page.title }} />
      <FlatList<Entry>
        data={page.entries}
        keyExtractor={(e) => e.id}
        contentContainerClassName="gap-4 px-5 pb-12 pt-4"
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <Text variant="subhead" tone="muted" className="pb-2" testID="leftBook.lead">
            {page.lead}
          </Text>
        }
        renderItem={({ item }) => (
          <BookRow reduced={reduced}>
            <LetterCard entry={item} child={child} onPress={open} />
          </BookRow>
        )}
      />
    </View>
  );
}
