/**
 * Tonight's "From the book" / "A month ago" card (EXPERIENCE_PASS_2026-10 S09; NX-36 S13, BL-790; DESIGN_LANGUAGE 12;
 * Day One "On This Day", BENCHMARK S6): one kept letter set on raised paper in the book's own type. The caption
 * kicker, the letter's opening in letterBody (3 whole lines at default sizes, 2 at accessibility sizes) ending in a
 * fade (ExcerptFade), and a footer with the child's age and the day at that letter and the signature. The words are
 * the parent's own, verbatim. Tapping opens the letter. Never a count, never a gap, never a private letter
 * (from-the-book.logic.ts). No audio, no play control, no new motion: Tonight's own entrance stagger carries it.
 *
 * The card opens its page. Tonight wraps it in CardSource and spreads useHiddenBehindCardPage() on its root, so when
 * the letter route moves to CardToPage (P5, then P1's ROUTES switch) VoiceOver lands on the page and Tonight cannot be
 * reached under it. The card names no CardText: Tonight's card does not share the page's text column, so the page
 * fades in whole (CardToPage's fallback) instead of carrying words that would reflow.
 *
 * Status colours: none (D-110).
 */
import { View } from 'react-native';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { LETTER_RULE_PT } from './draft-card';
import { FROM_THE_BOOK_LINES, FROM_THE_BOOK_LINES_LARGE, type FromTheBookCard } from './from-the-book.logic';

export function ResurfacedCard({ card, onPress }: { card: FromTheBookCard; onPress: () => void }) {
  const { c } = useTheme();
  const large = useIsAccessibilitySize();
  return (
    <Card
      radius="md"
      padding={4}
      onPress={onPress}
      accessibilityLabel={card.a11yLabel}
      accessibilityHint={copy.reader.openHint}
      className="gap-2"
      style={{ borderLeftWidth: LETTER_RULE_PT, borderLeftColor: c.accent }}>
      <Text variant="caption" caps>
        {card.kicker}
      </Text>
      <ExcerptFade text={card.excerpt} lines={large ? FROM_THE_BOOK_LINES_LARGE : FROM_THE_BOOK_LINES} variant="letterBody" surface={c.surfaceRaised} />
      <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-0.5">
        <Text variant="letterDateline" caps>
          {card.dateline}
        </Text>
        <Text variant="signature">{card.signature}</Text>
      </View>
    </Card>
  );
}
