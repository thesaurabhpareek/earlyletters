/**
 * AppNote (COMPONENTS 2.5b, D-084): the app's own small words, never mixed with a person's.
 * Small, muted, sans (the `footnote` style), a small icon, no signature and never the letter's
 * serif or italic. Used where the app must say something true about a file instead of showing
 * words: a recording that is waiting for its words, or one with no words in it.
 * It is plain text to a screen reader; the icon is hidden.
 */
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';

interface Props {
  children: string;
  /** Reading Size scale on the letter page and Read together. */
  scale?: number;
  numberOfLines?: number;
}

export function AppNote({ children, scale, numberOfLines }: Props) {
  const { c } = useTheme();
  return (
    <View className="flex-row items-start gap-2">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="pt-0.5">
        <InfoIcon size={16} color={c.textMuted} weight="regular" />
      </View>
      <Text variant="footnote" tone="muted" scale={scale} numberOfLines={numberOfLines} className="flex-1">
        {children}
      </Text>
    </View>
  );
}
