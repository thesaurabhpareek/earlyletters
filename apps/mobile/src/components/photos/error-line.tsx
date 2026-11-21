/**
 * The photo screens' error line: icon and words, announced politely when it appears (WCAG 4.1.3; NS-33 section 6). The same
 * look as the sign-in ErrorLine, without that file's imports (the sign-in file loads expo-apple-authentication into every screen that
 * touches a picture). Follow-up for design-systems: one ErrorLine in components/ui for both.
 */
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect } from 'react';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { tokens } from '@scribe/design-tokens';
import { announce, useTheme } from '@/lib/a11y';

const LINE_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export function ErrorLine({ message }: { message: string | null }) {
  const { c } = useTheme();
  useEffect(() => {
    if (message) announce(message);
  }, [message]);
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={LINE_IN}
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      className="flex-row items-start gap-2 rounded-2xl bg-secondary px-4 py-3">
      <WarningCircleIcon size={20} color={c.caution} style={{ marginTop: 1 }} />
      <Text variant="subhead" className="flex-1">
        {message}
      </Text>
    </Animated.View>
  );
}
