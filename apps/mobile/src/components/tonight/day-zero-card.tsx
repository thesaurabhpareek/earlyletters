/**
 * Tonight's day-zero card (NX-36 S13, BL-790, decision 5): until the book holds its first letter, the book itself
 * sits where "From the book" will go: the small cover, the book's title, "Ready for its first letter." One flat card
 * that opens the Book. It states what exists; no count, no gap, no progress. It is gone the moment a letter exists.
 */
import { View } from 'react-native';
import { BookCover } from '@/components/book/book-cover';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import type { DayZeroCard as DayZeroModel } from './from-the-book.logic';

export function DayZeroCard({ card, childName, signsAs, onPress }: { card: DayZeroModel; childName: string; signsAs: string; onPress: () => void }) {
  return (
    <Card variant="flat" radius="md" padding={4} onPress={onPress} accessibilityLabel={card.a11yLabel} accessibilityHint={copy.tonight.fromTheBook.emptyA11yHint} className="flex-row items-center gap-4">
      <BookCover name={childName} signsAs={signsAs} size="sm" animate={false} />
      <View className="flex-1 gap-1">
        <Text variant="title2">{card.title}</Text>
        <Text variant="footnote">{card.line}</Text>
      </View>
    </Card>
  );
}
