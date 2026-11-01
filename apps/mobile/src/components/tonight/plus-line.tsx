// web: same (React Native Web) | android: same
/**
 * PlusLine (F14-REQ-040, SR-C-08): the one standing line above Speak and Type once the free letters are used and Plus
 * is off, with "See Plus". A state on the paper, not a card, a banner or a sheet: footnote in textMuted, never a count,
 * never a price. It wraps at every text size and nothing is cut. Whether it shows is tonight-plus.logic plusLineShows.
 * No entrance: it is part of the pinned actions, which never animate in (MOTION principle 2).
 */
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { plusLine } from './tonight-plus.logic';

export function PlusLine({ onSeePlus }: { onSeePlus: () => void }) {
  const line = plusLine();
  return (
    <View className="items-center gap-1" testID="tonight.plusLine">
      <Text variant="footnote" tone="muted" className="text-center">
        {line.text}
      </Text>
      <Button variant="quiet" size="sm" label={line.action} onPress={onSeePlus} testID="tonight.seePlus" />
    </View>
  );
}
