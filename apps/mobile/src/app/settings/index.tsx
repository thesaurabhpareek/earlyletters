import Constants from 'expo-constants';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { brand, supportMailto } from '@scribe/brand';
import { ListRow, ListSection, Text } from '@/components/ui';
import { getAppearance } from '@/components/child/child-store';
import { hiddenBooksRow } from '@/components/settings/hidden-books.logic';
import { headerCard } from '@/components/settings/settings-home.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { backupInBuild, loadBackup } from '@/lib/backup/gate';
import { PLUS_ALPHA, plusLineFor } from '@/lib/billing/alpha';
import { usePlan } from '@/lib/billing/use-plan';
import { capabilities } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { remindersSummary } from '@/lib/reminders';
import { getActiveChild, listChildren, listHiddenChildren, subscribe, type Child } from '@/lib/store';
import { backupCopy } from '@scribe/content';

/**
 * Settings home (PRD C, C-REQ-016; PRD B section 9; EXPERIENCE_PASS_2026-10 S40, package P6). Every destination is
 * one tap from here, and every row pushes its own page, like iOS Settings: no accordion opens inside the list.
 *
 * Regrouped 8 Nov 2026 (proposals/account-security/settings-ia.md 3 and design.md 2.6; docs/design/screens/
 * SETTINGS_AND_ACCOUNT.md 6; rulings CDesO-1, CCO-9): a header card, then five groups and About.
 * - Header card (settings-home.logic.ts headerCard): the name the person signs as, if any; "On this phone" (or the
 *   sign-in line); the plan status. Without sign-in it opens Plan, so Plan stays one tap from home (CCO-9, the
 *   "Settings, Plan" path the Plus legal text names). With sign-in it opens Account and a Plan row sits under it.
 * - Children; Writing; Your letters; Privacy and security; Help and legal (Help, If you are struggling, Legal).
 * - About: version, then the early-version note (registered text, D-060, K-13), word for word, unstyled.
 *
 * Said once each: the short privacy line (`trust.short`) is the footer of Privacy and security. Help writes to the
 * support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). "If you are struggling" is always here,
 * never behind a flag (D-034).
 *
 * Seams for P8 (option B), each behind its capability: the Back up my recordings row (Your letters) and Delete
 * account (its own section above Help, until Account takes it in build 2, design.md 3.4).
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
  legal: '/settings/legal',
} as const;

const go = (route: string) => () => router.push(route as Href);

/** On or Off for the backup row, from the last state backup reported. Empty until it has one. */
function backupRowValue(): string | undefined {
  const s = loadBackup()?.backupView()?.status.kind;
  if (!s || s === 'unavailable') return undefined;
  // Consent withdrawn reads Off: backup is not running, and the screen offers turning it on.
  return s === 'off' || s === 'needs_consent' ? backupCopy.rowOff : backupCopy.rowOn;
}

export default function Settings() {
  const read = () => ({ children: listChildren(), hidden: hiddenBooksRow(listHiddenChildren()), appearance: getAppearance(), reminders: remindersSummary() });
  const [s, setS] = useState(read);
  useEffect(() => subscribe(() => setS(read())), []);
  // Reminders and appearance change on their own screens: re-read when Settings comes back.
  useFocusEffect(useCallback(() => setS(read()), []));

  const h = copy.settingsHome;
  // The header card names the way the person signs in, once there is sign-in (S40, #310; headerCard).
  const auth = useAuth();
  const plan = usePlan();
  const card = headerCard({
    signIn: capabilities.signIn,
    status: auth.state.status,
    provider: auth.account.provider,
    signsAs: getActiveChild()?.signsAs,
    alpha: PLUS_ALPHA,
    plusOn: plan.plusOn,
  });
  const version = Constants.expoConfig?.version ?? '';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '';
  const versionValue = build ? fill(h.versionValue, { version, build }) : version;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {/* Header card (CCO-9): opens Plan without sign-in, Account with it; with sign-in a Plan row sits right under it. */}
      <ListSection footer={card.footer ?? undefined}>
        <ListRow
          title={card.title}
          subtitle={card.subtitle}
          value={card.value ?? undefined}
          trailing="chevron"
          accessibilityHint={card.hint}
          onPress={go(card.route === 'account' ? ROUTES.account : ROUTES.plan)}
          testID="settings.headerCard"
        />
        {card.planRow ? <ListRow title={h.planLabel} subtitle={plusLineFor(PLUS_ALPHA, h.planHelp)} trailing="chevron" onPress={go(ROUTES.plan)} testID="settings.plan" /> : null}
      </ListSection>

      <ListSection title={h.sections.children}>
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

      <ListSection title={h.sections.letters}>
        <ListRow title={h.recordingsLabel} trailing="chevron" onPress={go(ROUTES.recordings)} />
        <ListRow title={h.exportLabel} subtitle={h.exportHelp} trailing="chevron" onPress={go(ROUTES.export)} />
        <ListRow title={copy.settings.delete.recentlyDeleted} subtitle={copy.settings.delete.shelfHelp} trailing="chevron" onPress={go(ROUTES.recentlyDeleted)} />
        {/* Encrypted backup (WP-F08-B5c): only in a build with capabilities.backup on; gate.ts loads nothing otherwise. */}
        {backupInBuild() ? <ListRow title={backupCopy.title} value={backupRowValue()} trailing="chevron" onPress={go(ROUTES.backup)} /> : null}
        <ListRow title={h.storageLabel} subtitle={h.storageHelp} trailing="chevron" onPress={go(ROUTES.storage)} />
      </ListSection>

      <ListSection title={h.sections.privacy} footer={copy.trust.short}>
        {/* APP_LOCK_ROW slot: the App lock row (design.md 2.5, CDesO-1) goes here, first in this group, from
            feat/mobile-app-lock. No placeholder row is drawn until that lane ships the page it opens. */}
        <ListRow title={h.privacyLabel} trailing="chevron" onPress={go(ROUTES.privacy)} />
      </ListSection>

      {/* Delete account only while signed in: signed out there is no account here to delete (#358 review). And only in a build
          with EXPO_PUBLIC_ACCOUNT_DELETION=on (founder, 30 Oct 2026; it implies server features): without it the row is absent. */}
      {capabilities.accountDeletion && auth.signedIn ? (
        <ListSection>
          <ListRow title={h.deleteAccountLabel} variant="destructive" trailing="chevron" onPress={go(ROUTES.deleteAccount)} />
        </ListSection>
      ) : null}

      <ListSection title={h.sections.help}>
        <ListRow title={h.helpLabel} trailing={h.helpValue} accessibilityHint={brand.support.email} onPress={() => void Linking.openURL(supportMailto(h.helpSubject))} />
        <ListRow title={copy.struggling.title} trailing="chevron" accessibilityHint={h.strugglingA11yHint} onPress={go(ROUTES.struggling)} testID="settings.struggling" />
        <ListRow title={h.legalLabel} trailing="chevron" onPress={go(ROUTES.legal)} testID="settings.legal" />
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
