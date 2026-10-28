import Constants from 'expo-constants';
import { router, useFocusEffect, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { brand, supportMailto } from '@scribe/brand';
import { ListRow, ListSection, Text } from '@/components/ui';
import { getAppearance } from '@/components/child/child-store';
import { hiddenBooksRow } from '@/components/settings/hidden-books.logic';
import { accountSubtitle } from '@/components/settings/settings-home.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { backupInBuild, loadBackup } from '@/lib/backup/gate';
import { capabilities } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { remindersSummary } from '@/lib/reminders';
import { listChildren, listHiddenChildren, subscribe, type Child } from '@/lib/store';
import { backupCopy } from '@scribe/content';

/**
 * Settings home (PRD C, C-REQ-016; PRD B section 9; EXPERIENCE_PASS_2026-10 S40, package P6). Every destination is
 * one tap from here, and every row pushes its own page, like iOS Settings: no accordion opens inside the list.
 * Rows (coordinator, 3 Oct 2026): Account, Plan, Spoken language, Reminders, Export your book, Privacy, Storage,
 * Recordings, Appearance, Delete account, Terms, Privacy Policy, Help, If you are struggling, Licenses, version.
 * "Settings, Plan" is the path the Plus legal text names.
 *
 * Said once each: the short privacy line is the footer of Your data (`trust.short`), and the early-version note
 * (`settings.about.beta.*`, registered text, D-060, K-13) is the footer of About, word for word, unstyled.
 * Help writes to the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). "If you are struggling"
 * is always here, never behind a flag (D-034).
 *
 * Seams for P8 (option B): the Account row (top of the first section, signed in or out, with the way the person signs
 * in as its subtitle, P8a's request on #310), the Back up my recordings row (Your data, after Recordings) and Delete
 * account (its own section above Help) are drawn here, each behind its capability; P8 asks for anything more (S40:
 * Delete account signed in only) and P6 makes it in this file.
 */
const ROUTES = {
  account: '/settings/account',
  plan: '/settings/plus',
  language: '/settings/language',
  reminders: '/settings/reminders',
  export: '/settings/export',
  recentlyDeleted: '/settings/recently-deleted',
  privacy: '/settings/privacy',
  storage: '/settings/storage',
  recordings: '/settings/recordings',
  backup: '/settings/backup',
  appearance: '/settings/appearance',
  deleteAccount: '/settings/delete-account',
  struggling: '/settings/struggling',
  licenses: '/settings/licenses',
} as const;

const go = (route: string) => () => router.push(route as Href);

/** On or Off for the backup row, from the last state backup reported. Empty until it has one. */
function backupRowValue(): string | undefined {
  const s = loadBackup()?.backupView()?.status.kind;
  if (!s || s === 'unavailable') return undefined;
  // Consent withdrawn reads Off: backup is not running, and the screen offers turning it on.
  return s === 'off' || s === 'needs_consent' ? backupCopy.rowOff : backupCopy.rowOn;
}
const openWeb = (url: string) => () => void WebBrowser.openBrowserAsync(url);

export default function Settings() {
  const read = () => ({ children: listChildren(), hidden: hiddenBooksRow(listHiddenChildren()), appearance: getAppearance(), reminders: remindersSummary() });
  const [s, setS] = useState(read);
  useEffect(() => subscribe(() => setS(read())), []);
  // Reminders and appearance change on their own screens: re-read when Settings comes back.
  useFocusEffect(useCallback(() => setS(read()), []));

  const h = copy.settingsHome;
  // Signed in: "Signed in with Apple" (or Google, email) under Account; signed out: what the row is for (S40, #310).
  const auth = useAuth();
  const account = accountSubtitle({ status: auth.state.status, provider: auth.account.provider });
  const version = Constants.expoConfig?.version ?? '';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '';
  const versionValue = build ? fill(h.versionValue, { version, build }) : version;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection title={capabilities.signIn ? h.sections.account : undefined}>
        {capabilities.signIn ? <ListRow title={h.accountLabel} subtitle={account} trailing="chevron" onPress={go(ROUTES.account)} /> : null}
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
        {/* The way back from "Hide this book" (P6d), only while a book is hidden on this phone. */}
        {s.hidden ? <ListRow title={s.hidden.title} trailing="chevron" onPress={() => router.push(s.hidden!.href)} testID="settings.hiddenBooks" /> : null}
      </ListSection>

      <ListSection title={h.sections.writing}>
        <ListRow title={h.languageLabel} subtitle={h.languageHelp} trailing="chevron" onPress={go(ROUTES.language)} />
        <ListRow title={h.remindersLabel} value={s.reminders} trailing="chevron" onPress={go(ROUTES.reminders)} />
        <ListRow title={h.appearanceLabel} value={copy.settingsMore.themes[s.appearance]} trailing="chevron" onPress={go(ROUTES.appearance)} />
      </ListSection>

      <ListSection title={h.sections.data} footer={copy.trust.short}>
        <ListRow title={h.privacyLabel} trailing="chevron" onPress={go(ROUTES.privacy)} />
        <ListRow title={h.exportLabel} subtitle={h.exportHelp} trailing="chevron" onPress={go(ROUTES.export)} />
        <ListRow title={copy.settings.delete.recentlyDeleted} subtitle={copy.settings.delete.shelfHelp} trailing="chevron" onPress={go(ROUTES.recentlyDeleted)} />
        <ListRow title={h.recordingsLabel} trailing="chevron" onPress={go(ROUTES.recordings)} />
        {/* Encrypted backup (WP-F08-B5c): only in a build with capabilities.backup on; gate.ts loads nothing otherwise. */}
        {backupInBuild() ? <ListRow title={backupCopy.title} value={backupRowValue()} trailing="chevron" onPress={go(ROUTES.backup)} /> : null}
        <ListRow title={h.storageLabel} subtitle={h.storageHelp} trailing="chevron" onPress={go(ROUTES.storage)} />
      </ListSection>

      {capabilities.signIn ? (
        <ListSection>
          <ListRow title={h.deleteAccountLabel} variant="destructive" trailing="chevron" onPress={go(ROUTES.deleteAccount)} />
        </ListSection>
      ) : null}

      <ListSection title={h.sections.help}>
        <ListRow title={h.helpLabel} trailing={h.helpValue} accessibilityHint={brand.support.email} onPress={() => void Linking.openURL(supportMailto(h.helpSubject))} />
        <ListRow title={copy.struggling.title} trailing="chevron" accessibilityHint={h.strugglingA11yHint} onPress={go(ROUTES.struggling)} testID="settings.struggling" />
        <ListRow accessibilityRole="link" title={h.termsLabel} trailing="chevron" onPress={openWeb(brand.web.terms)} />
        <ListRow accessibilityRole="link" title={h.privacyPolicyLabel} trailing="chevron" onPress={openWeb(brand.web.privacy)} />
        <ListRow title={h.licencesLabel} trailing="chevron" onPress={go(ROUTES.licenses)} testID="settings.licenses" />
      </ListSection>

      <View className="gap-2">
        <ListSection title={copy.settings.about.title}>
          <ListRow title={h.versionLabel} trailing={versionValue} />
        </ListSection>
        {/* The early-version note: registered text (in-app-disclosures.md section 1), word for word, About's footer. */}
        <View accessible className="gap-0.5 px-4" testID="settings.about.beta">
          <Text variant="footnote">{copy.settings.about.beta.label}</Text>
          <Text variant="footnote">{copy.settings.about.beta.body}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
