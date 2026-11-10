import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ScrollView, View } from 'react-native';
import { brand } from '@scribe/brand';
import { ListRow, ListSection, Text } from '@/components/ui';
import { getAppearance } from '@/components/child/child-store';
import { useHelpLink } from '@/components/settings/help-fallback';
import { mailTarget } from '@/components/settings/help-links.logic';
import { hiddenBooksRow } from '@/components/settings/hidden-books.logic';
import { headerCard, planRowFor } from '@/components/settings/settings-home.logic';
import { appLockCopy } from '@/lib/app-lock/copy';
import { useAppLock } from '@/lib/app-lock/controller';
import { useAuth } from '@/lib/auth/session-provider';
import { backupInBuild, loadBackup } from '@/lib/backup/gate';
import { getPlan, subscribePlan } from '@/lib/billing';
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { capabilities } from '@/lib/capabilities';
import { childLabel, copy, fill } from '@/lib/copy';
import { remindersSummary } from '@/lib/reminders';
import { getActiveChild, listChildren, listHiddenChildren, localDeletionAllowed, subscribe, type Child } from '@/lib/store';
import { backupCopy } from '@scribe/content';

/**
 * Settings home (PRD C, C-REQ-016; PRD B section 9; EXPERIENCE_PASS_2026-10 S40, package P6). Every destination is
 * one tap from here, and every row pushes its own page, like iOS Settings: no accordion opens inside the list.
 *
 * Regrouped (proposals/account-security/settings-ia.md 3 and design.md 2.6; docs/design/screens/SETTINGS_AND_ACCOUNT.md
 * 6; rulings CDesO-1, CCO-9; founder: build 12): a header card, then five groups and About.
 * - Header card (settings-home.logic.ts headerCard): the name the person signs as, if any; "On this phone" (or the
 *   sign-in line). With sign-in it opens Account; without, it opens nothing.
 * - The Plan row directly under the card in every build (planRowFor: Free, Plus or Plus, shared, with its line; the
 *   alpha note in alpha). It is the "Settings, Plan" path the Terms, the Subscription Terms and the plan reminder
 *   name for cancelling and refunds (CCO-9; settings-ia.md 3 [F]; CTO ruling 8 Nov 2026).
 * - Children; Writing (Spoken language, Your words, Reminders, Appearance); Your letters (Where your letters live,
 *   Export your book, Recently deleted, Back up when in the build, Storage); Privacy and security (App lock, Privacy);
 *   Help and legal (Help, If you are struggling, Legal: one page for the Terms, the Privacy Policy and Licenses).
 * - About: version, the early-version note (registered text, D-060, K-13), word for word, unstyled, with no heading
 *   of its own, so About says "early" once (CLO-5); then the sign-off, text only (CDesO-2).
 *
 * Said once each: the short privacy line (`trust.short`) is the last line of Settings, Privacy (CPrivO-5, design.md
 * 2.11). Help writes to the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). "If you are
 * struggling" is always here, never behind a flag (D-034).
 *
 * Seams for P8 (option B), each behind its capability: the Back up my recordings row (Your letters, after Recently
 * deleted) and Delete account (its own section above Help, until Account takes it in build 2, design.md 3.4). This
 * file is the only screen that names the Delete account route (D-129, test/account-deletion-switch.test.ts).
 */
const ROUTES = {
  account: '/settings/account',
  plan: '/settings/plus',
  language: '/settings/language',
  reminders: '/settings/reminders',
  export: '/settings/export',
  recentlyDeleted: '/settings/recently-deleted',
  privacy: '/settings/privacy',
  appLock: '/settings/app-lock',
  storage: '/settings/storage',
  whereLive: '/settings/where-letters-live',
  yourWords: '/settings/your-words',
  backup: '/settings/backup',
  appearance: '/settings/appearance',
  deleteAccount: '/settings/delete-account',
  erase: '/settings/erase',
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
  const lockOn = useAppLock().enabled;
  const version = Constants.expoConfig?.version ?? '';
  // The build number from the installed binary (EAS sets it remotely, so the config never has it). null on web.
  const build = Application.nativeBuildVersion ?? '';
  const versionValue = build ? fill(h.versionValue, { version, build }) : version;
  // Help writes to us; with no Mail account the address shows to copy (F20-REQ-007).
  const help = useHelpLink();
  // F5, PL-3: Free, Plus or Plus, shared (store build); the alpha note only in an alpha build (#552). The cached plan
  // startPlus() keeps current: this row reads it and never asks StoreKit itself.
  const plan = useSyncExternalStore(subscribePlan, getPlan, getPlan);
  const planRowView = planRowFor(plan, new Date().toISOString(), PLUS_ALPHA);
  const card = headerCard({
    signIn: capabilities.signIn,
    status: auth.state.status,
    provider: auth.account.provider,
    signsAs: getActiveChild()?.signsAs,
  });

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {/* Header card, then the Plan row in every build (CCO-9, settings-ia.md 3 [F]; CTO ruling 8 Nov 2026): the Terms
          and Subscription Terms send people to "Settings, Plan", so a row labelled Plan is always here, one tap from home. */}
      <ListSection>
        <ListRow
          title={card.title}
          subtitle={card.subtitle}
          trailing={card.route ? 'chevron' : 'none'}
          accessibilityHint={card.hint}
          onPress={card.route ? go(ROUTES.account) : undefined}
          testID="settings.headerCard"
        />
        <ListRow title={h.planLabel} subtitle={planRowView.subtitle} value={planRowView.value} trailing="chevron" onPress={go(ROUTES.plan)} testID="settings.plan" />
      </ListSection>

      <ListSection title={copy.children.settings.sectionTitle}>
        {s.children.map((ch: Child) => (
          <ListRow
            key={ch.id}
            title={childLabel(ch.name)}
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
        <ListRow title={h.yourWords} trailing="chevron" onPress={go(ROUTES.yourWords)} testID="settings.yourWords" />
        <ListRow title={h.remindersLabel} value={s.reminders} trailing="chevron" onPress={go(ROUTES.reminders)} />
        <ListRow title={h.appearanceLabel} value={copy.settingsMore.themes[s.appearance]} trailing="chevron" onPress={go(ROUTES.appearance)} />
      </ListSection>

      <ListSection title={h.sections.letters}>
        <ListRow title={h.whereLive} trailing="chevron" onPress={go(ROUTES.whereLive)} testID="settings.whereLive" />
        <ListRow title={h.exportLabel} subtitle={h.exportHelp} trailing="chevron" onPress={go(ROUTES.export)} />
        <ListRow title={copy.settings.delete.recentlyDeleted} subtitle={copy.settings.delete.shelfHelp} trailing="chevron" onPress={go(ROUTES.recentlyDeleted)} />
        {/* Encrypted backup (WP-F08-B5c): only in a build with capabilities.backup on; gate.ts loads nothing otherwise. */}
        {backupInBuild() ? <ListRow title={backupCopy.title} value={backupRowValue()} trailing="chevron" onPress={go(ROUTES.backup)} /> : null}
        <ListRow title={h.storageLabel} subtitle={h.storageHelp} trailing="chevron" onPress={go(ROUTES.storage)} />
        {/* Erase everything on this phone (BL-387, F17 6.2 F): last in Your letters, only on a phone that never signed in
            (signed in, F17-REQ-026 offers account deletion first; not built here). */}
        {localDeletionAllowed() ? (
          <ListRow title={copy.settings.erase.rowLabel} variant="destructive" trailing="chevron" onPress={go(ROUTES.erase)} testID="settings.erase" />
        ) : null}
      </ListSection>

      <ListSection title={h.sections.privacy}>
        {/* App lock (F1; design.md 2.5, CDesO-1): its own row, first in Privacy and security; its value says On or Off. */}
        <ListRow
          title={appLockCopy.settingsHome.appLock}
          value={lockOn ? appLockCopy.settingsHome.appLockOn : appLockCopy.settingsHome.appLockOff}
          trailing="chevron"
          onPress={go(ROUTES.appLock)}
          testID="settings.appLock"
        />
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
        <ListRow title={h.helpLabel} trailing={h.helpValue} accessibilityHint={brand.support.email} onPress={() => help.open(mailTarget(h.helpSubject))} testID="settings.help" />
        <ListRow title={copy.struggling.title} trailing="chevron" accessibilityHint={h.strugglingA11yHint} onPress={go(ROUTES.struggling)} testID="settings.struggling" />
        {/* Legal (settings-ia.md 3): one page for the Terms of Service, the Privacy Policy and Licenses (legal.tsx). */}
        <ListRow title={h.legalLabel} trailing="chevron" onPress={go(ROUTES.legal)} testID="settings.legal" />
      </ListSection>

      <View className="gap-2">
        <ListSection title={copy.settings.about.title}>
          <ListRow title={h.versionLabel} trailing={versionValue} />
        </ListSection>
        {/* The early-version note: registered text (in-app-disclosures.md section 1), word for word, About's footer.
            No "Early version" heading above it: the note says "early" once (founder, 8 Nov 2026). */}
        <View accessible className="gap-0.5 px-4" testID="settings.about.beta">
          <Text variant="footnote">{copy.settings.about.beta.body}</Text>
        </View>
        <Text variant="footnote" tone="muted" className="mt-4 px-4 text-center" testID="settings.signOff">
          {h.signOff}
        </Text>
      </View>
      {help.sheet}
    </ScrollView>
  );
}
