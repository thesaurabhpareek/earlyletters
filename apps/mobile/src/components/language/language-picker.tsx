// web: apps/web/components/language/language-picker.tsx (later) | android: same code (Modal pageSheet falls back to full screen)
/**
 * LanguagePicker: choose one of the v1.0 spoken-letter languages.
 *
 * A native iOS page sheet (Modal presentationStyle "pageSheet", like the
 * iOS Settings language list), so the keyboard, swipe-to-dismiss and
 * VoiceOver escape work the system way. Each language is shown in its own
 * name and script first (हिन्दी, 中文, العربية), with its English name under
 * it; search matches either name and other spellings, ignoring accents.
 *
 * RTL-safe: rows use flex rows, logical spacing and natural text alignment,
 * so they mirror if the app UI is ever right to left; each native name sets
 * its own writing direction, so العربية renders right to left inside an
 * English list. VoiceOver reads each native name with that language's voice
 * (accessibilityLanguage) and the English name in English.
 *
 * Speech (EXPERIENCE_PASS S07, D-087): a language whose speech model is not on this phone shows its size under its
 * names ("Not on this phone, 575 MB"), from this phone's plan, never a typed number. Choosing it only stores the
 * choice: nothing downloads from this sheet.
 */
import { speechSettingsCopy } from '@scribe/content';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { searchLanguages, type LanguageCode, type LanguageInfo } from '@scribe/core';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { isSpeechLanguage } from '@/lib/models/catalog';
import { installedPathsFor, planFor } from '@/lib/models/speech-packs';
import { cn } from '@/lib/utils';
import { languageCopy } from './copy';

/**
 * "Not on this phone, 575 MB" for a language whose speech model this phone does not have yet; null when it is here,
 * when the language has no speech model, or when this phone's plan cannot be read.
 */
function speechAbsentLine(code: LanguageCode): string | null {
  if (!isSpeechLanguage(code)) return null;
  try {
    if (installedPathsFor(code) !== null) return null;
  } catch {
    // Where installed files cannot be read (the web design preview), nothing is on the phone, as the speech card says.
  }
  try {
    const bytes = planFor([code]).bytes;
    return bytes > 0 ? fill(speechSettingsCopy.absent, { n: Math.round(bytes / 1e6) }) : null;
  } catch {
    return null;
  }
}

export interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: LanguageCode) => void;
  /** The current choice, shown with a check. */
  selected?: LanguageCode;
  /** Languages already chosen elsewhere (shown, not selectable). */
  unavailable?: readonly LanguageCode[];
  title?: string;
}

export function LanguagePicker({ visible, onClose, onSelect, selected, unavailable = [], title = languageCopy.picker.title }: LanguagePickerProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchLanguages(query), [query]);
  // Read once per opening: what this phone holds does not change while the sheet is up (nothing downloads here).
  const absent = useMemo(() => (visible ? new Map(searchLanguages('').map((l) => [l.code, speechAbsentLine(l.code)])) : new Map<LanguageCode, string | null>()), [visible]);
  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 ps-5 pe-3 pb-2 pt-5">
          <Text variant="headline" asHeading className="flex-1">
            {title}
          </Text>
          <Button variant="quiet" size="sm" label={languageCopy.picker.close} onPress={close} />
        </View>
        <View className="px-5 pb-3">
          <TextField
            label={languageCopy.picker.searchLabel}
            labelHidden
            placeholder={languageCopy.picker.searchPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
            textContentType="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            trailing={<SearchIcon />}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerClassName="px-5 pb-12" contentInsetAdjustmentBehavior="automatic">
          {results.length === 0 ? (
            <Text variant="callout" tone="muted" className="px-1 py-6">
              {languageCopy.picker.none}
            </Text>
          ) : (
            <View accessibilityRole="radiogroup" accessibilityLabel={title} className="overflow-hidden rounded-lg bg-card dark:border dark:border-border">
              {results.map((l, i) => (
                <LanguageRow
                  key={l.code}
                  info={l}
                  first={i === 0}
                  checked={l.code === selected}
                  speech={absent.get(l.code) ?? null}
                  disabled={l.code !== selected && unavailable.includes(l.code)}
                  onPress={() => {
                    haptic('tap');
                    setQuery('');
                    onSelect(l.code);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SearchIcon() {
  const { c } = useTheme();
  return <MagnifyingGlassIcon size={18} color={c.textMuted} />;
}

function LanguageRow({ info, first, checked, speech, disabled, onPress }: { info: LanguageInfo; first: boolean; checked: boolean; speech: string | null; disabled: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const sameName = info.native === info.english;
  const p = languageCopy.picker;
  const name = sameName ? info.english : `${info.english}, ${info.native}`;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={speech ? `${name}. ${speech}` : name}
      accessibilityLanguage="en"
      accessibilityHint={disabled ? p.chosenA11y : p.rowHint}
      className={cn('min-h-14 flex-row items-center gap-3 ps-4 pe-4 py-3 active:bg-secondary', !first && 'border-t border-border')}>
      <View className="flex-1 gap-0.5">
        <Text
          variant="body"
          tone={disabled ? 'muted' : 'default'}
          accessibilityLanguage={info.bcp47}
          style={{ writingDirection: info.script.direction }}>
          {info.native}
        </Text>
        {!sameName && (
          <Text variant="footnote" tone="muted">
            {info.english}
          </Text>
        )}
        {speech ? (
          <Text variant="footnote" tone="muted">
            {speech}
          </Text>
        ) : null}
      </View>
      {checked ? <CheckIcon size={20} color={c.accent} weight="bold" /> : null}
    </Pressable>
  );
}
