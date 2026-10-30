/**
 * Settings, Licenses (EXPERIENCE_PASS_2026-10 S40, package P6; release requirement): its own page, pushed from a row
 * on Settings home like every other, instead of an accordion inside the list.
 *
 * What it shows (lib/licences.ts says what a page must): the hand-kept credits from packages/content less anything the
 * generated list carries, the language pack attributions word for word, then every bundled library, font and vendored
 * file, grouped by licence (largest group first), each with its name and version. A row opens its notice, word for
 * word, one at a time; an entry published without a licence file shows its name and licence only. Several hundred
 * entries and about 460 KB of notice text, so the list is virtualised and lib/licences (which parses the JSON) is
 * required here, when the page opens, never at cold start.
 *
 * Words: every heading and line is packages/content's, except each licence's own name and each package's name and
 * version, which are the authors' (lib/licences.ts). No drawing, no lamp, no motion.
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
  | { kind: 'credit'; key: string; name: string; detail: string }
  | { kind: 'line'; key: string; text: string }
  | { kind: 'notice'; key: string; name: string; version?: string; licence: string; text: string | null };
type Section = { key: string; title: string | null; intro?: string; data: Row[] };

/** The generated groups' id for "no licence stated" (scripts/licences/lib.mjs UNKNOWN): its heading is not the data's. */
const UNKNOWN = 'UNKNOWN';

function sectionsFrom(lib: typeof Licences): Section[] {
  const hand: Section[] = lib.handKeptSections.map((s) => ({
    key: `hand:${s.title}`,
    title: s.title,
    data: s.items.map((it) => ({ kind: 'credit' as const, key: `${s.title}:${it.name}`, name: it.name, detail: it.by === it.name ? it.licence : `${it.by}, ${it.licence}` })),
  }));
  const packs: Section = { key: 'packs', title: licences.packsTitle, data: licences.packs.map((text, i) => ({ kind: 'line' as const, key: `pack:${i}`, text })) };
  const groups: Section[] = lib.notices.licences.map((g, i) => ({
    key: `group:${g.id}`,
    title: g.id === UNKNOWN ? null : g.name,
    // The libraries' own heading and line sit above the first group.
    intro: i === 0 ? licences.libraries : undefined,
    data: g.entries.map((e) => ({ kind: 'notice' as const, key: lib.noticeKey(e), name: e.name, version: e.version, licence: g.name, text: lib.noticeText(e) })),
  }));
  return [...hand, packs, ...groups];
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
          <Text variant="body" className="pb-6">
            {licences.intro}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <View className="gap-2 pb-2 pt-6">
            {section.intro ? (
              <>
                <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
                  {licences.librariesTitle}
                </Text>
                <Text variant="subhead" className="px-4 pb-4">
                  {section.intro}
                </Text>
              </>
            ) : null}
            {section.title ? (
              <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
                {section.title}
              </Text>
            ) : null}
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
  if (row.kind === 'credit') {
    return (
      <View accessible className="min-h-11 gap-0.5 px-4 py-3">
        <Text variant="body">{row.name}</Text>
        <Text variant="footnote">{row.detail}</Text>
      </View>
    );
  }
  const title = row.version ? `${row.name} ${row.version}` : row.name;
  // Published without a licence file: its name and licence only, nothing to open.
  if (row.text === null) {
    return (
      <View accessible className="min-h-11 gap-0.5 px-4 py-3">
        <Text variant="body">{title}</Text>
        <Text variant="footnote">{row.licence}</Text>
      </View>
    );
  }
  return (
    <View>
      <Pressable
        onPress={onToggle}
        role="button"
        accessibilityLabel={`${title}, ${row.licence}`}
        accessibilityState={{ expanded: open }}
        className={`min-h-11 flex-row items-center gap-3 px-4 py-3 active:bg-secondary${Platform.OS === 'web' ? ' outline-none focus-visible:bg-secondary' : ''}`}>
        <View className="flex-1 gap-0.5">
          <Text variant="body">{title}</Text>
          <Text variant="footnote">{row.licence}</Text>
        </View>
        {open ? <CaretDownIcon size={16} color={c.textMuted} weight="bold" /> : <CaretRightIcon size={16} color={c.textMuted} weight="bold" />}
      </Pressable>
      {open ? (
        <View className="px-4 pb-4">
          <Text variant="footnote" tone="default" selectable>
            {row.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
