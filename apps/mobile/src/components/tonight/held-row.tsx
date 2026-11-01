// web: same (React Native Web) | android: same
/**
 * HeldRow (F14-REQ-041, SR-C-08): two or more letters held at the Keep step, as one row on Tonight. Tapping it opens
 * the list of their own cards in place, newest first (a disclosure, like a SwiftUI DisclosureGroup); tapping it again
 * closes it. One held letter never comes here: it keeps its own card (tonight-plus.logic tonightRows).
 *
 * Letter-shaped like DraftCard (Card "raised", radius md, the 3 pt accent rule), so the row reads as letters, not as a
 * setting. The whole row is one button: VoiceOver reads "2 letters waiting to be kept." and its action, with its
 * expanded state. The title wraps at every text size; nothing is cut.
 * Motion: the list appears with the screen's own `enter` fade when it opens; Reduce Motion is handled by useMotion.
 */
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { useMotion } from '@/lib/motion';
import { DraftCard, LETTER_RULE_PT } from './draft-card';
import type { DraftCard as DraftCardModel } from './draft-card.logic';
import { heldRowAction, type HeldRow as HeldRowModel } from './tonight-plus.logic';

export function HeldRow({ row, open, onToggle, onOpenCard }: { row: HeldRowModel; open: boolean; onToggle: () => void; onOpenCard: (card: DraftCardModel) => void }) {
  const { c } = useTheme();
  const motion = useMotion();
  const action = heldRowAction(open);
  return (
    <View className="gap-3">
      <Card
        radius="md"
        padding={4}
        onPress={onToggle}
        accessibilityLabel={`${row.title} ${action}.`}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        testID="tonight.heldRow"
        className="gap-2"
        style={{ borderLeftWidth: LETTER_RULE_PT, borderLeftColor: c.accent }}>
        <Text variant="body">{row.title}</Text>
        <Text variant="labelSmall" tone="accent" className="pt-1">
          {action}
        </Text>
      </Card>
      {open
        ? row.cards.map((card, i) => (
            <Animated.View key={card.id} entering={motion.enter(i)}>
              <DraftCard card={card} onPress={() => onOpenCard(card)} />
            </Animated.View>
          ))
        : null}
    </View>
  );
}
