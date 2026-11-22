import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { appearanceSample } from '@/components/settings/appearance.logic';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import { copy } from '@/lib/copy';
import { getActiveChild, listEntriesForChild } from '@/lib/store';
import { READING_SIZES } from '@/components/book/reading-size-sheet';
import { getAppearance, getReadingSize, isOwnEntry, setAppearance, setReadingSize, type Appearance } from '@/components/child/child-store';

const THEMES: Appearance[] = ['system', 'light', 'dark'];

/** The first line of the person's newest letter in the book, or null (components/settings/appearance.logic.ts). */
function readSample(): string | null {
  try {
    const child = getActiveChild();
    return child ? appearanceSample(listEntriesForChild(child.id), isOwnEntry) : null;
  } catch {
    return null;
  }
}

/**
 * Appearance and reading size (PRD B F10, PRD C C-REQ-016; EXPERIENCE_PASS_2026-10 S45, package P6). Theme is applied
 * by app/_layout.tsx. The Reading size labels are set in Literata at their own size (as S29). The sample in the letter
 * face is the person's own first line from their newest letter in the book, never a sentence the app wrote; with no
 * letter yet, the specimen "Aa" at the chosen size.
 */
export default function AppearanceSettings() {
  const { c } = useTheme();
  const [theme, setTheme] = useState(getAppearance);
  const [size, setSize] = useState(getReadingSize);
  const [sample] = useState(readSample);
  const m = copy.settingsMore;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection title={m.themeLabel}>
        <ChoiceGroup
          label={m.themeLabel}
          layout="list"
          options={THEMES.map((t) => ({ value: t, label: m.themes[t] }))}
          value={theme}
          onChange={(v) => {
            setTheme(v);
            setAppearance(v);
            track('settings_changed', { key: 'theme' });
          }}
        />
      </ListSection>

      <ListSection title={copy.reader.readingSizeTitle}>
        <ChoiceGroup
          label={copy.reader.readingSizeTitle}
          layout="list"
          options={READING_SIZES.map((s) => ({
            value: s,
            label: copy.reader.sizes[s],
            render: () => (
              <Text variant="letterBody" scale={tokens.readingScale[s]}>
                {copy.reader.sizes[s]}
              </Text>
            ),
          }))}
          value={size}
          onChange={(v) => {
            setSize(v);
            setReadingSize(v);
            track('settings_changed', { key: 'reading_size' });
          }}
        />
      </ListSection>

      {/* The person's own words at the chosen size; three lines that end in a fade, never an ellipsis. */}
      <View className="rounded-lg bg-card p-5 dark:border dark:border-border" testID="appearance.sample">
        {sample ? (
          <ExcerptFade text={sample} lines={3} variant="letterBody" scale={tokens.readingScale[size]} surface={c.surfaceRaised} />
        ) : (
          <Text variant="letterBody" scale={tokens.readingScale[size]}>
            {copy.reader.previewEmpty}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
