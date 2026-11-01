/**
 * Settings, Licenses (EXPERIENCE_PASS_2026-10 S40, package P6; release requirement): its own page, pushed from a row
 * on Settings home like every other.
 *
 * What it shows (lib/licences.ts says what a page must): a short intro, then what ships in the iOS app grouped by
 * what it does for the parent (Speech, Recording and audio, Look and feel, App framework, Storage and data, Signing
 * in, Everything else), each group with one line on what it is for, and the language pack attributions word for
 * word after Speech. One row per component: its name and license. A row opens, one at a time, to its version, its
 * copyright lines and the full license text, word for word. The list is generated from the lockfile and
 * scripts/licences/components.mjs, so it carries nothing the app does not ship. About 150 rows and 190 KB of text:
 * the list is virtualised and lib/licences (which parses the JSON) is required here, when the page opens, never at
 * cold start.
 *
 * Words: every heading and line is packages/content's, except each licence's own name and each component's name,
 * version and copyright, which are the authors' (lib/licences.ts). No drawing, no lamp, no motion.
 */
import { Stack } from 'expo-router';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { useMemo, useState } from 'react';
import { Platform, Pressable, SectionList, View } from 'react-native';
import { licences } from '@scribe/content';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import type * as Licences from '@/lib/licences';

type Row =
  | { kind: 'line'; key: string; text: string }
  | { kind: 'notice'; key: string; name: string; version?: string; licence: string; copyright: string | null; text: string | null };
type Section = { key: string; title: string; line: string; data: Row[] };

function sectionsFrom(lib: typeof Licences): Section[] {
  const themes: Section[] = lib.notices.themes.map((g) => ({
    key: `theme:${g.id}`,
    title: licences.themes[g.id].title,
    line: licences.themes[g.id].line,
    data: g.entries.map((e) => ({
      kind: 'notice' as const,
      key: lib.noticeKey(e),
      name: e.name,
      version: e.version,
      licence: e.licence === lib.UNKNOWN ? licences.licenceUnknown : e.licenceName,
      copyright: e.copyright,
      text: lib.noticeText(e),
    })),
  }));
  const packs: Section = {
    key: 'packs',
    title: licences.packsTitle,
    line: licences.packsLine,
    data: licences.packs.map((text, i) => ({ kind: 'line' as const, key: `pack:${i}`, text })),
  };
  // The language data sits with Speech, the part of the app it serves.
  const at = themes.findIndex((s) => s.key === 'theme:speech') + 1;
  return [...themes.slice(0, at), packs, ...themes.slice(at)];
}

export default function LicensesScreen() {
  // Parsed here, when the page opens (lib/licences.ts: keep it off cold start).
  const sections = useMemo(() => sectionsFrom(require('@/lib/licences') as typeof Licences), []);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: licences.title }} />
      <SectionList
        sections={sections}
        keyExtractor={(row) => row.key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 }}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={24}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View className="gap-2 pb-2">
            <Text variant="body">{licences.intro}</Text>
            <Text variant="subhead">{licences.libraries}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View className="gap-1 px-4 pb-2 pt-6">
            <Text variant="footnote" caps asHeading style={{ letterSpacing: 0.6 }}>
              {section.title}
            </Text>
            <Text variant="subhead">{section.line}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View className={`bg-card dark:border-x dark:border-border ${index === 0 ? 'rounded-t-lg dark:border-t' : ''} ${index === section.data.length - 1 ? 'rounded-b-lg dark:border-b' : ''}`}>
            {index > 0 ? <View className="ml-4 h-px bg-border" style={{ height: 0.5 }} /> : null}
            <LicenceRow row={item} open={open === item.key} onToggle={() => setOpen((k) => (k === item.key ? null : item.key))} />
          </View>
        )}
      />
    </>
  );
}

function LicenceRow({ row, open, onToggle }: { row: Row; open: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  if (row.kind === 'line') {
    return (
      <View className="px-4 py-3">
        <Text variant="subhead" selectable>
          {row.text}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Pressable
        onPress={onToggle}
        role="button"
        accessibilityLabel={`${row.name}, ${row.licence}`}
        accessibilityState={{ expanded: open }}
        className={`min-h-11 flex-row items-center gap-3 px-4 py-3 active:bg-secondary${Platform.OS === 'web' ? ' outline-none focus-visible:bg-secondary' : ''}`}>
        <View className="flex-1 gap-0.5">
          <Text variant="body">{row.name}</Text>
          <Text variant="footnote">{row.licence}</Text>
        </View>
        {open ? <CaretDownIcon size={16} color={c.textMuted} weight="bold" /> : <CaretRightIcon size={16} color={c.textMuted} weight="bold" />}
      </Pressable>
      {open ? (
        <View className="gap-2 px-4 pb-4">
          {row.version ? <Text variant="footnote">{licences.version.replace('{version}', row.version)}</Text> : null}
          {row.copyright ? (
            <Text variant="footnote" selectable>
              {row.copyright}
            </Text>
          ) : null}
          <Text variant="footnote" tone="default" selectable>
            {row.text ?? licences.noText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
