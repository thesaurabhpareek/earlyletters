// web: same | android: same
/**
 * Review's day line (NS-15-R1; GAP-LOG A G-01): line 2 of the letter sheet, under "To Asha · Month 7". It shows the day
 * the letter is about, as the Book's card would ("Tuesday, 29 September 2026", or "Sometime in Month 3" for a month),
 * and for the author it is a button that opens DateSheet. The affordance is visible (the calendar mark and the accent
 * tone), never a hidden gesture, so Voice Control and Switch Control find it by its words. VoiceOver hears the spoken
 * dateline, with the child's age, and the hint "Change the date".
 *
 * Without `onPress` (a letter already kept, whose words arrived later; the letter page moves those) it is plain text in
 * the header's quiet tone, with no mark, so nothing looks tappable that is not.
 */
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';

export function ReviewDayLine({ text, spoken, hint, onPress }: { text: string; spoken: string; hint: string; onPress?: () => void }) {
  const { c } = useTheme();
  if (!onPress) {
    return (
      <View className="min-h-11 justify-center" testID="review.sheet.day">
        <Text variant="letterDateline" caps tone="muted" accessibilityLabel={spoken}>
          {text}
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint={hint}
      hitSlop={6}
      className="min-h-11 flex-row items-center gap-2 self-start"
      testID="review.sheet.day">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <CalendarBlankIcon size={16} color={c.accent} />
      </View>
      <Text variant="letterDateline" caps tone="accent" className="flex-shrink">
        {text}
      </Text>
    </Pressable>
  );
}
