// web: same (React Native Web) | android: same
/**
 * "A quiet day, kept." in place of the "Not much today" link (EXPERIENCE_PASS_2026-10 S33, package P3; D-084).
 *
 * The Moon glyph (20 pt, textMuted), the line in `text` (not success green: nothing here is a result to celebrate or
 * count), and Undo beside it. It stays until Undo or until the person leaves Tonight. The mark it reports stores no
 * words; Tonight saves it (quiet-day.logic.ts newQuietMark).
 *
 * Motion (Tonight passes it): the link fades out over exitMs and this line fades in over fadeMs from when the link
 * is half gone, with the `soft` haptic on the tap. Under Reduce Motion the same fades. Undo is a control: opaque
 * from the first frame. The line is a polite live region for TalkBack; on iOS Tonight announces it.
 *
 * Status colours: none (D-110).
 */
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';

export function QuietDayInline({ onUndo, entering }: { onUndo: () => void; entering?: ComponentProps<typeof Animated.View>['entering'] }) {
  const { c } = useTheme();
  return (
    <Animated.View entering={entering} className="min-h-12 flex-row flex-wrap items-center justify-center gap-x-2" accessibilityLiveRegion="polite">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <MoonIcon size={20} color={c.textMuted} weight="regular" />
      </View>
      <Text variant="callout">{copy.notMuch.savedToast}</Text>
      <Button variant="quiet" size="sm" label={copy.notMuch.undo} onPress={onUndo} />
    </Animated.View>
  );
}
