/**
 * Settings, Spoken language (founder decisions 6 and 15; ADR 0014).
 *
 * A primary language plus up to two more. Choosing a language starts the
 * download of its text-rules pack (ensurePack; Portuguese fetches the
 * Portuguese pack and nothing else) and shows its size and progress; the
 * primary also becomes the speech language (setAuthorSpeechLanguage), which
 * starts its speech model download. Chinese asks which characters the
 * author writes (Taiwan and Hong Kong write Traditional); Portuguese asks
 * which spelling (Brazil or Portugal). Neither choice respells words.
 *
 * Until a pack arrives, that language runs in punctuation-safe mode, and
 * the footer says so in plain words. A note explains that typing follows the
 * keyboard's own autocorrect, in the keyboard's language.
 */
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { languageInfo, type LanguageCode } from '@scribe/core';
import { languageCopy } from '@/components/language/copy';
import { LanguagePicker } from '@/components/language/language-picker';
import { LanguageRow } from '@/components/language/language-row';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { fill } from '@/lib/copy';
import { ensureTextRules, useTextRulesStatus } from '@/lib/language/packs';
import { MAX_LANGUAGES, type SpokenLanguage } from '@/lib/language/spoken-language.logic';
import { useSpokenLanguage } from '@/lib/language/spoken-language';

type PickerMode = 'primary' | 'add' | null;

export default function LanguageSettings() {
  const spoken = useSpokenLanguage();
  const codes = useMemo(() => spoken.languages.map((l) => l.code), [spoken.languages]);
  const status = useTextRulesStatus(codes);
  const [picker, setPicker] = useState<PickerMode>(null);
  const t = languageCopy;

  // A language chosen elsewhere (onboarding) gets its pack here too; ensurePack is idempotent.
  useEffect(() => {
    for (const code of codes) if (code !== 'en') void ensureTextRules(code);
  }, [codes]);

  const choose = (code: LanguageCode) => {
    if (picker === 'primary') spoken.setPrimary(code);
    else spoken.add(code);
    setPicker(null);
    void ensureTextRules(code);
  };

  const primary = spoken.primary;
  const primaryState = status[primary.code]?.state;
  const waitingForPack = primary.code !== 'en' && primaryState !== 'installed';
  const primaryFooter = waitingForPack
    ? `${t.primaryFooter} ${fill(t.safeModeNote, { name: languageInfo(primary.code).english })}`
    : t.primaryFooter;
  const full = spoken.languages.length >= MAX_LANGUAGES;

  return (
    <>
      <Stack.Screen options={{ title: t.title }} />
      <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        <ListSection title={t.primaryTitle} footer={primaryFooter}>
          <LanguageRow
            first
            code={primary.code}
            status={status[primary.code]}
            onChange={() => setPicker('primary')}
            onRetry={() => void ensureTextRules(primary.code, { allowCellularOnce: true })}
          />
        </ListSection>

        <ListSection title={t.othersTitle} footer={t.othersFooter}>
          {spoken.others.map((l, i) => (
            <LanguageRow
              key={l.code}
              first={i === 0}
              code={l.code}
              status={status[l.code]}
              onRemove={() => spoken.remove(l.code)}
              onRetry={() => void ensureTextRules(l.code, { allowCellularOnce: true })}
            />
          ))}
          <ListRow title={full ? t.addLanguageFull : t.addLanguage} trailing={full ? 'none' : 'chevron'} disabled={full} onPress={full ? undefined : () => setPicker('add')} />
        </ListSection>

        {spoken.languages.map((l) => (
          <PerAuthorChoices key={l.code} language={l} onChange={(patch) => spoken.update(l.code, patch)} />
        ))}

        <View className="gap-2">
          <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
            {t.keyboardTitle}
          </Text>
          <Text variant="footnote" tone="muted" className="px-4">
            {t.keyboardNote}
          </Text>
        </View>
      </ScrollView>

      <LanguagePicker
        visible={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={choose}
        selected={picker === 'primary' ? primary.code : undefined}
        unavailable={picker === 'primary' ? [] : codes}
      />
    </>
  );
}

/** Chinese characters (Simplified or Traditional) and Portuguese spelling (Brazil or Portugal), per author. */
function PerAuthorChoices({ language, onChange }: { language: SpokenLanguage; onChange: (patch: Pick<SpokenLanguage, 'script' | 'region'>) => void }) {
  const info = languageInfo(language.code);
  const t = languageCopy;
  if (info.scriptChoices.length && language.script) {
    return (
      <ListSection title={t.scriptTitle} footer={t.scriptFooter}>
        <ChoiceGroup
          label={`${t.scriptTitle}, ${info.english}`}
          layout="list"
          options={info.scriptChoices.map((c) => ({ value: c.script as 'Hans' | 'Hant', label: c.native, description: c.english }))}
          value={language.script}
          onChange={(script) => onChange({ script })}
        />
      </ListSection>
    );
  }
  if (info.regions.length && language.region) {
    return (
      <ListSection title={t.regionTitle} footer={t.regionFooter}>
        <ChoiceGroup
          label={`${t.regionTitle}, ${info.english}`}
          layout="list"
          options={info.regions.map((r) => ({ value: r.tag, label: r.native, description: r.english }))}
          value={language.region}
          onChange={(region) => onChange({ region })}
        />
      </ListSection>
    );
  }
  return null;
}
