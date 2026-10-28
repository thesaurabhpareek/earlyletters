import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { consentCopy } from './copy';

/**
 * "What we never do" (founder decision 11; EXPERIENCE_PASS_2026-10 S44, package P6): stated once, plainly, where
 * people look for it. A plain list on paper, each line with a 20 pt Phosphor glyph in textMuted, not white grouped
 * rows: rows look tappable, and these are not. The words are registered claims (in-app-disclosures.md; P0 rule 3),
 * read from consentCopy as they are. The real controls sit above it; the policy links below stay rows.
 */
export function NeverList() {
  const { c } = useTheme();
  return (
    <View className="gap-3" testID="privacy.never">
      <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
        {consentCopy.neverTitle}
      </Text>
      <View className="gap-3 px-4">
        {consentCopy.never.map((line) => (
          <View key={line} accessible className="flex-row items-start gap-3">
            <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={{ paddingTop: 3 }}>
              <ProhibitIcon size={20} color={c.textMuted} />
            </View>
            <Text variant="body" className="flex-1">
              {line}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
