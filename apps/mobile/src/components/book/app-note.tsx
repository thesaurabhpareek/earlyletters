/**
 * AppNote (COMPONENTS 2.5b, D-084): the app's own small words, never mixed with a person's.
 * Small, muted, sans (the `footnote` style), a small icon, no signature and never the letter's
 * serif or italic. Used where the app must say something true about a file instead of showing
 * words: a recording that is waiting for its words, or one with no words in it.
 * The icon is the 16 pt Microphone (EXPERIENCE_PASS S26): both notes are about a recording, and the info icon read
 * as a warning. The note is never cut: it is short, it is the app's, and an ellipsis glyph never shows.
 * It is plain text to a screen reader; the icon is hidden.
 */
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';

interface Props {
  children: string;
  /** Reading Size scale on the letter page and Read together. */
  scale?: number;
}

export function AppNote({ children, scale }: Props) {
  const { c } = useTheme();
  return (
    <View className="flex-row items-start gap-2">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="pt-0.5">
        <MicrophoneIcon size={16} color={c.textMuted} weight="regular" />
      </View>
      <Text variant="footnote" tone="muted" scale={scale} className="flex-1">
        {children}
      </Text>
    </View>
  );
}
