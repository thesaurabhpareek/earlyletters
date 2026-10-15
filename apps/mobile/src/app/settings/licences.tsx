import { Stack } from 'expo-router';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { useCallback, useState } from 'react';
import { Platform, Pressable, SectionList, View } from 'react-native';
import { licences as t } from '@scribe/content';
import { ListRow, ListSection, Text } from '@/components/ui';
import { ListDivider } from '@/components/ui/list-row';
import { useTheme } from '@/lib/a11y';
import { noticeKey, notices, type NoticeEntry } from '@/lib/licences';

/**
 * Settings > Licences (BL-404: its own screen, from the Licences row). Open work the app ships
 * or downloads: the hand-kept sections from packages/content (speech models, language data),
 * then every bundled library, font and native module from src/generated/licences.json, grouped
 * by licence. A row opens its notice as the authors wrote it (MIT, BSD, Apache and ISC ask for
 * the notice to travel with the code); a package published without a notice file shows its name
 * and licence only. Several hundred rows, so the list is virtualised, with one notice open at a
 * time. Nothing here is product copy except the headings: the notices are shown word for word.
 */
type Section = { title: string; data: NoticeEntry[] };

const SECTIONS: Section[] = notices.licences.map((g) => ({ title: g.name, data: g.entries }));

export default function Licences() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = useCallback((key: string) => setOpen((current) => (current === key ? null : key)), []);

  return (
    <>
      <Stack.Screen options={{ title: t.title }} />
      <SectionList
        sections={SECTIONS}
        keyExtractor={noticeKey}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="px-5 pb-12 pt-4"
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={24}
        ListHeaderComponent={Header}
        renderSectionHeader={({ section }) => (
          <Text variant="footnote" caps asHeading className="px-4 pb-2 pt-6" style={{ letterSpacing: 0.6 }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <NoticeRow entry={item} open={open === noticeKey(item)} onToggle={() => toggle(noticeKey(item))} />}
        ItemSeparatorComponent={ListDivider}
      />
    </>
  );
}

/** The intro and the hand-kept sections, above the generated list. */
function Header() {
  return (
    <View className="gap-7">
      <Text variant="subhead">{t.intro}</Text>
      {t.sections.map((sec) => (
        <ListSection key={sec.title} title={sec.title}>
          {sec.items.map((it) => (
            <ListRow key={it.name} title={it.name} subtitle={it.by === it.name ? it.licence : `${it.by}, ${it.licence}`} />
          ))}
        </ListSection>
      ))}
      <ListSection title={t.packsTitle}>
        {t.packs.map((line) => (
          <View key={line} accessible className="px-4 py-3">
            <Text variant="subhead" selectable>
              {line}
            </Text>
          </View>
        ))}
      </ListSection>
      <View className="gap-2">
        <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
          {t.librariesTitle}
        </Text>
        <Text variant="subhead" className="px-4">
          {t.librariesIntro}
        </Text>
      </View>
    </View>
  );
}

/** One library, font or native module: name and version; its notice opens in place (VoiceOver: "button, collapsed"). */
function NoticeRow({ entry, open, onToggle }: { entry: NoticeEntry; open: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  const label = [entry.name, entry.version].filter(Boolean).join(', ');
  const rowClass = 'min-h-11 flex-row items-center gap-3 px-4 py-3';
  const title = (
    <View className="flex-1 flex-row items-center gap-3">
      <Text variant="body" className="flex-1">
        {entry.name}
      </Text>
      {entry.version ? (
        <Text variant="body" tone="muted">
          {entry.version}
        </Text>
      ) : null}
    </View>
  );
  if (entry.text === null) {
    return (
      <View accessible accessibilityLabel={label} className={rowClass}>
        {title}
      </View>
    );
  }
  return (
    <View>
      <Pressable
        onPress={onToggle}
        role="button"
        accessibilityLabel={label}
        accessibilityHint={t.noticeHint}
        accessibilityState={{ expanded: open }}
        className={`${rowClass} active:bg-secondary${Platform.OS === 'web' ? ' outline-none focus-visible:bg-secondary' : ''}`}>
        {title}
        {open ? <CaretUpIcon size={16} color={c.textMuted} weight="bold" /> : <CaretDownIcon size={16} color={c.textMuted} weight="bold" />}
      </Pressable>
      {open ? (
        <Text variant="footnote" selectable className="px-4 pb-4">
          {notices.texts[entry.text]}
        </Text>
      ) : null}
    </View>
  );
}
