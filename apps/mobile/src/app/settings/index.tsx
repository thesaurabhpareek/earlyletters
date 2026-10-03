import Constants from 'expo-constants';
import { router, useFocusEffect, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { brand, supportMailto } from '@scribe/brand';
import { ListRow, ListSection, Text } from '@/components/ui';
import { getAppearance } from '@/components/child/child-store';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { remindersSummary } from '@/lib/reminders';
import { listChildren, subscribe, type Child } from '@/lib/store';
import { licences } from '@scribe/content';

/**
 * Settings home (PRD C, C-REQ-016; PRD B section 9). Every destination is one tap from here.
 * Rows (coordinator, 3 Oct 2026): Account, Plan, Spoken language, Reminders, Export your book,
 * Privacy, Storage, Recordings, Appearance, Delete account, Terms, Privacy Policy, Help,
 * Licences, version. "Settings, Plan" is the path the Plus legal text names.
 *
 * Help writes to the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014).
 * "If you are struggling" is always here, never behind a flag (D-034). Licences and the
 * support lines open in place, so nothing here needs its own screen.
 */
const ROUTES = {
  account: '/settings/account',
  plan: '/settings/plus',
  language: '/settings/language',
  reminders: '/settings/reminders',
  export: '/settings/export',
  privacy: '/settings/privacy',
  storage: '/settings/storage',
  recordings: '/settings/recordings',
  appearance: '/settings/appearance',
  deleteAccount: '/settings/delete-account',
} as const;

const go = (route: string) => () => router.push(route as Href);
const openWeb = (url: string) => () => void WebBrowser.openBrowserAsync(url);

/** A row that opens more detail in place (VoiceOver: "button, collapsed"). */
function Disclosure({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        role="button"
        accessibilityLabel={title}
        accessibilityHint={hint}
        accessibilityState={{ expanded: open }}
        className={`min-h-11 flex-row items-center gap-3 px-4 py-3 active:bg-secondary${Platform.OS === 'web' ? ' outline-none focus-visible:bg-secondary' : ''}`}>
        <Text variant="body" className="flex-1">
          {title}
        </Text>
        {open ? <CaretUpIcon size={16} color={c.textMuted} weight="bold" /> : <CaretDownIcon size={16} color={c.textMuted} weight="bold" />}
      </Pressable>
      {open ? <View className="gap-3 px-4 pb-4">{children}</View> : null}
    </View>
  );
}

export default function Settings() {
  const read = () => ({ children: listChildren(), appearance: getAppearance(), reminders: remindersSummary() });
  const [s, setS] = useState(read);
  useEffect(() => subscribe(() => setS(read())), []);
  // Reminders and appearance change on their own screens: re-read when Settings comes back.
  useFocusEffect(useCallback(() => setS(read()), []));

  const h = copy.settingsHome;
  const version = Constants.expoConfig?.version ?? '';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '';
  const versionValue = build ? fill(h.versionValue, { version, build }) : version;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {/* "Early version, can make mistakes" stays in the app until the founder ends the beta (D-060). */}
      <View accessible className="gap-1 rounded-lg bg-secondary p-4">
        <Text variant="caption" tone="accent" caps>
          {copy.settings.about.beta.label}
        </Text>
        <Text variant="subhead">{copy.settings.about.beta.body}</Text>
      </View>

      <ListSection title={h.sections.account}>
        <ListRow title={h.accountLabel} subtitle={h.accountHelp} trailing="chevron" onPress={go(ROUTES.account)} />
        <ListRow title={h.planLabel} subtitle={h.planHelp} trailing="chevron" onPress={go(ROUTES.plan)} />
      </ListSection>

      <ListSection title={copy.children.settings.sectionTitle}>
        {s.children.map((ch: Child) => (
          <ListRow
            key={ch.id}
            title={ch.name}
            trailing={ch.birthday || ch.dueDate ? 'chevron' : copy.childrenExtra.notSet}
            onPress={() => router.push({ pathname: '/settings/children/[id]', params: { id: ch.id } })}
          />
        ))}
        <ListRow title={copy.children.switcher.addButton} trailing="chevron" onPress={() => router.push('/settings/children/new')} />
      </ListSection>

      <ListSection title={h.sections.writing}>
        <ListRow title={h.languageLabel} subtitle={h.languageHelp} trailing="chevron" onPress={go(ROUTES.language)} />
        <ListRow title={h.remindersLabel} trailing={s.reminders} onPress={go(ROUTES.reminders)} />
        <ListRow title={h.appearanceLabel} trailing={copy.settingsMore.themes[s.appearance]} onPress={go(ROUTES.appearance)} />
      </ListSection>

      <ListSection title={h.sections.data} footer={copy.trust.short}>
        <ListRow title={h.privacyLabel} trailing="chevron" onPress={go(ROUTES.privacy)} />
        <ListRow title={h.exportLabel} subtitle={h.exportHelp} trailing="chevron" onPress={go(ROUTES.export)} />
        <ListRow title={h.recordingsLabel} trailing="chevron" onPress={go(ROUTES.recordings)} />
        <ListRow title={h.storageLabel} subtitle={h.storageHelp} trailing="chevron" onPress={go(ROUTES.storage)} />
      </ListSection>

      <ListSection>
        <ListRow title={h.deleteAccountLabel} variant="destructive" trailing="chevron" onPress={go(ROUTES.deleteAccount)} />
      </ListSection>

      <ListSection title={h.sections.help}>
        <ListRow title={h.helpLabel} trailing={h.helpValue} accessibilityHint={brand.support.email} onPress={() => void Linking.openURL(supportMailto(h.helpSubject))} />
        <Disclosure title={copy.struggling.title} hint={h.strugglingA11yHint}>
          <Text variant="subhead">{copy.struggling.body}</Text>
          {copy.struggling.resources.map((r) => (
            <Pressable key={r.tel} role="link" accessibilityLabel={`${r.name}. ${r.how}`} onPress={() => void Linking.openURL(`tel:${r.tel}`)} className="gap-0.5 py-1">
              <Text variant="body" tone="accent">
                {r.name}
              </Text>
              <Text variant="footnote">{r.how}</Text>
            </Pressable>
          ))}
          <Text variant="footnote">{copy.struggling.emergency}</Text>
        </Disclosure>
        <ListRow title={h.termsLabel} trailing="chevron" onPress={openWeb(brand.web.terms)} />
        <ListRow title={h.privacyPolicyLabel} trailing="chevron" onPress={openWeb(brand.web.privacy)} />
        <Disclosure title={h.licencesLabel}>
          <Text variant="subhead">{licences.intro}</Text>
          {licences.sections.map((sec) => (
            <View key={sec.title} className="gap-1">
              <Text variant="footnote" caps asHeading>
                {sec.title}
              </Text>
              {sec.items.map((it) => (
                <View key={it.name} accessible className="gap-0.5">
                  <Text variant="subhead">{it.name}</Text>
                  <Text variant="footnote">{it.by === it.name ? it.licence : `${it.by}, ${it.licence}`}</Text>
                </View>
              ))}
            </View>
          ))}
          <View className="gap-1">
            <Text variant="footnote" caps asHeading>
              {licences.packsTitle}
            </Text>
            {licences.packs.map((line) => (
              <Text key={line} variant="subhead" selectable>
                {line}
              </Text>
            ))}
          </View>
          <View className="gap-1">
            <Text variant="footnote" caps asHeading>
              {licences.librariesTitle}
            </Text>
            <Text variant="subhead">{licences.libraries}</Text>
          </View>
        </Disclosure>
      </ListSection>

      <ListSection title={copy.settings.about.title} footer={`${copy.settings.neverRewrite} ${copy.trust.short}`}>
        <ListRow title={h.versionLabel} trailing={versionValue} />
      </ListSection>
    </ScrollView>
  );
}
