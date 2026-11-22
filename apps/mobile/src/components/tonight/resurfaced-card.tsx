// web: same (React Native Web) | android: same
/**
 * "A month ago" (EXPERIENCE_PASS_2026-10 S09; DESIGN_LANGUAGE 12; Day One "On This Day", BENCHMARK S6): when no
 * draft is waiting, the newest letter in the book dated 28 to 35 days ago comes back as one card in the draft cards'
 * shape, with the caption kicker and the letter's opening in letterBody (two whole lines that end in a fade). Tapping
 * it opens the letter. Never a count, never a gap, never a private letter (draft-card.logic.ts `resurfaced`).
 *
 * The card opens its page. Tonight wraps it in CardSource and spreads useHiddenBehindCardPage() on its root, so when
 * the letter route moves to CardToPage (P5, then P1's ROUTES switch) VoiceOver lands on the page and Tonight cannot be
 * reached under it. The card names no CardText: Tonight's card does not share the page's text column, so the page
 * fades in whole (CardToPage's fallback) instead of carrying words that would reflow. Until then the letter keeps
 * the platform push, which moves focus to the page by itself.
 *
 * Status colours: none (D-110).
 */
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { LETTER_RULE_PT } from './draft-card';
import { EXCERPT, type ResurfacedCard as ResurfacedCardModel } from './draft-card.logic';

export function ResurfacedCard({ card, onPress }: { card: ResurfacedCardModel; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Card
      radius="md"
      padding={4}
      onPress={onPress}
      accessibilityLabel={card.a11yLabel}
      className="gap-2"
      style={{ borderLeftWidth: LETTER_RULE_PT, borderLeftColor: c.accent }}>
      <Text variant="caption" caps>
        {card.kicker}
      </Text>
      <ExcerptFade text={card.words} lines={EXCERPT.lines} variant={EXCERPT.variant} surface={c.surfaceRaised} />
    </Card>
  );
}
