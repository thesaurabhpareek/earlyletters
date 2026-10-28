/**
 * Settings, Hidden books (package P6d; PRD B-REQ-014, F09-REQ-016, WP-F09-09): the way back from "Hide this book".
 * Each book hidden on this phone, with "Show this book again", which puts it back in the switcher, its reminders and
 * its messages (store.unhideChild). Nothing here deletes or changes a letter. components/settings/hidden-books.logic.ts
 * holds the rules; every word is packages/content's, except each book's own name.
 *
 * Accessibility: each book's name is a heading; each button names its book for VoiceOver. When a book comes back,
 * focus moves to the next hidden book, or to "No hidden books." when it was the last.
 */
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { hiddenBooksPage } from '@/components/settings/hidden-books.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ordinalOf, track } from '@/lib/analytics/track';
import { useFocusOnMount } from '@/lib/a11y';
import { haptic } from '@/lib/haptics';
import { listHiddenChildren, subscribe, unhideChild } from '@/lib/store';

export default function HiddenBooks() {
  const [hidden, setHidden] = useState(listHiddenChildren);
  useEffect(() => subscribe(() => setHidden(listHiddenChildren())), []);
  const page = hiddenBooksPage(hidden);

  // After "Show this book again", VoiceOver lands on what is next, not on a button that has gone.
  const [shown, setShown] = useState(0);
  const first = useRef<View>(null);
  useFocusOnMount(first, shown > 0, shown);

  const show = (id: string) => {
    unhideChild(id);
    // Which setting only, never the value (the analytics catalogue's child_setting_changed).
    track('child_setting_changed', { key: 'hidden', child_ordinal: ordinalOf(id) });
    haptic('success');
    setShown((n) => n + 1);
  };

  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: page.title }} />
      {page.empty ? (
        <View ref={first} accessible testID="hiddenBooks.empty">
          <Text variant="body" tone="muted">
            {page.empty}
          </Text>
        </View>
      ) : (
        page.books.map((b, i) => (
          <Card key={b.id} variant="raised" padding={4} radius="md" testID={`hiddenBooks.book.${i}`}>
            <View ref={i === 0 ? first : undefined} accessible>
              <Text variant="headline" asHeading>
                {b.name}
              </Text>
            </View>
            <Button variant="secondary" size="sm" label={b.button} accessibilityLabel={b.buttonLabel} onPress={() => show(b.id)} className="self-start" testID={`hiddenBooks.show.${i}`} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}
