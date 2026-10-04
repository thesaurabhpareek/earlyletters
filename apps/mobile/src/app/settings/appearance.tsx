import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { getActiveChild } from '@/lib/store';
import { READING_SIZES } from '@/components/book/reading-size-sheet';
import { getAppearance, getReadingSize, setAppearance, setReadingSize, type Appearance } from '@/components/child/child-store';

const THEMES: Appearance[] = ['system', 'light', 'dark'];

/** Appearance and reading size (PRD B F10, PRD C C-REQ-016). Theme is applied by app/_layout.tsx. */
export default function AppearanceSettings() {
  const [theme, setTheme] = useState(getAppearance);
  const [size, setSize] = useState(getReadingSize);
  const m = copy.settingsMore;
  const child = getActiveChild()?.name ?? '';

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
          options={READING_SIZES.map((s) => ({ value: s, label: copy.reader.sizes[s] }))}
          value={size}
          onChange={(v) => {
            setSize(v);
            setReadingSize(v);
            track('settings_changed', { key: 'reading_size' });
          }}
        />
      </ListSection>

      <View className="rounded-lg bg-card p-5 dark:border dark:border-border" accessible accessibilityLabel={fill(copy.reader.preview, { child })}>
        <Text variant="letterBody" scale={tokens.readingScale[size]}>
          {fill(copy.reader.preview, { child })}
        </Text>
      </View>
    </ScrollView>
  );
}
