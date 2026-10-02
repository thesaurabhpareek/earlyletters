import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { getActiveChild } from '@/lib/store';
import { READING_SIZES } from '@/components/book/reading-size-sheet';
import { getAppearance, getReadingSize, setAppearance, setReadingSize, type Appearance } from '@/components/child/child-store';
import { Choices, Section } from '@/components/settings/settings-ui';

const THEMES: Appearance[] = ['system', 'light', 'dark'];

/** Appearance and reading size (PRD B F10, PRD C C-REQ-016). Theme is applied by app/_layout.tsx. */
export default function AppearanceSettings() {
  const [theme, setTheme] = useState(getAppearance);
  const [size, setSize] = useState(getReadingSize);
  const m = copy.settingsMore;
  const child = getActiveChild()?.name ?? '';
  const scale = tokens.readingScale[size];

  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Section title={m.themeLabel}>
        <Choices
          options={THEMES.map((t) => ({ value: t, label: m.themes[t] }))}
          value={theme}
          onChange={(v) => {
            setTheme(v);
            setAppearance(v);
          }}
        />
      </Section>

      <Section title={copy.reader.readingSizeTitle}>
        <Choices
          options={READING_SIZES.map((s) => ({ value: s, label: copy.reader.sizes[s] }))}
          value={size}
          onChange={(v) => {
            setSize(v);
            setReadingSize(v);
          }}
        />
      </Section>

      <View className="rounded-[14px] border border-border bg-card p-5" accessible accessibilityLabel={fill(copy.reader.preview, { child })}>
        <Text maxFontSizeMultiplier={2} className="font-serif text-foreground" style={{ fontSize: 20 * scale, lineHeight: 32 * scale }}>
          {fill(copy.reader.preview, { child })}
        </Text>
      </View>
    </ScrollView>
  );
}
