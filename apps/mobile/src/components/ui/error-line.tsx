/**
 * ErrorLine (COMPONENTS, DESIGN-SYSTEM-DELTA 2.3 Notice, error kind): a warning glyph and the words on a calm chip,
 * announced politely when it appears (WCAG 4.1.3). Same look and behaviour as the sign-in ErrorLine, with none of that
 * file's imports (it loads expo-apple-authentication into every screen that touches it), so any screen can use it.
 * The glyph is never the only signal: the words say what happened. Words never truncate (no numberOfLines), so at AX5
 * the line grows. It fades in over tokens.motion.swapMs, opacity only, and the same fade is the Reduce Motion form.
 * Rules and VoiceOver contract: error-line.logic.ts.
 */
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect } from 'react';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { ERROR_LINE_GLYPH_PT, errorLineA11y, errorLineAnnouncement, errorLineWords } from '@/components/ui/error-line.logic';
import { announce, useTheme } from '@/lib/a11y';
import { tokens } from '@scribe/design-tokens';

const LINE_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export function ErrorLine({ message }: { message: string | null }) {
  const { c } = useTheme();
  const say = errorLineAnnouncement(message);
  useEffect(() => {
    if (say) announce(say);
  }, [say]);
  const words = errorLineWords(message);
  if (!words) return null;
  return (
    <Animated.View key={words} entering={LINE_IN} {...errorLineA11y(words)} className="flex-row items-start gap-2 rounded-2xl bg-secondary px-4 py-3">
      <WarningCircleIcon size={ERROR_LINE_GLYPH_PT} color={c.caution} style={{ marginTop: 1 }} />
      <Text variant="subhead" className="flex-1">
        {words}
      </Text>
    </Animated.View>
  );
}
