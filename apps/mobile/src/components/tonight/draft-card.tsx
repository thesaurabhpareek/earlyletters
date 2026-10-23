// web: same (React Native Web) | android: same
/**
 * DraftCard (EXPERIENCE_PASS_2026-10 S09, package P3): one unfinished letter on Tonight.
 *
 * Letter-shaped: surfaceRaised, radius md, elevation 1 (Card "raised"), a 3 pt accent rule on its left edge and
 * 16 pt padding. It shows the dateline (and a recording's length), then the person's own first words in letterBody,
 * two whole lines that end in a fade (ExcerptFade: no numberOfLines, so no ellipsis glyph at any text size, and the
 * whole text stays in the element), or the state line in footnote textMuted, then the action as a text button.
 * What each card says and does comes from draft-card.logic.ts.
 *
 * The whole card is one button (Card's contract): VoiceOver reads its label (date, words or state, action) once,
 * with no separator glyphs, and a tap anywhere on it does the action. The action is drawn as a quiet button's label
 * inside the card, not as a second control, so the card never nests two buttons.
 *
 * Status colours: none (D-110: the card sits on its own surface, and Tonight's lit paper keeps the reading colours).
 * Motion: the parent passes `entering` on a cold launch only; a card that appears later is already in place.
 */
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { View } from 'react-native';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { EXCERPT, type DraftCard as DraftCardModel } from './draft-card.logic';

/** The 3 pt accent rule on a letter-shaped card's left edge (S09). */
export const LETTER_RULE_PT = 3;

export function DraftCard({ card, onPress }: { card: DraftCardModel; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Card
      radius="md"
      padding={4}
      onPress={onPress}
      accessibilityLabel={card.a11yLabel}
      className="gap-2"
      style={{ borderLeftWidth: LETTER_RULE_PT, borderLeftColor: c.accent }}>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="letterDateline" caps className="shrink">
          {card.dateline}
        </Text>
        {card.clock ? (
          <View className="flex-row items-center gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
            <MicrophoneIcon size={14} color={c.textMuted} weight="regular" />
            <Text variant="letterDateline" style={{ fontVariant: ['tabular-nums'] }}>
              {card.clock}
            </Text>
          </View>
        ) : null}
      </View>

      {card.words ? <ExcerptFade text={card.words} lines={EXCERPT.lines} variant={EXCERPT.variant} surface={c.surfaceRaised} /> : null}

      {card.line ? <Text variant="footnote">{card.line}</Text> : null}

      <Text variant="labelSmall" tone="accent" className="pt-1">
        {card.action}
      </Text>
    </Card>
  );
}
