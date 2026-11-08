import { router, Stack, useFocusEffect, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { brand } from '@scribe/brand';
import { consentCopy } from '@/components/consent/copy';
import { privacyPage } from '@/components/settings/privacy.logic';
import { Text } from '@/components/ui/text';
import { capabilities } from '@/lib/capabilities';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { useAuth } from '@/lib/auth/session-provider';
import { copy, fill } from '@/lib/copy';
import { getActiveChild } from '@/lib/store';
import { grantAnalytics, withdrawAnalytics } from '@/lib/analytics';
import { useAnalyticsConsent } from '@/lib/analytics/use-analytics-consent';
import { sensitiveStatusWords, useSensitiveDataStatus } from '@/lib/analytics/privacy-sources';
import { lockScreenNamesOn } from '@/lib/reminders';

/**
 * Settings > Privacy (PRD.md K-01, K-17; C-REQ-016; LEGAL-REQ-003, -006), as ruled 1 Nov 2026 (CPrivO-5;
 * proposals/privacy-settings.md 3 and 4; docs/design/screens/SETTINGS_AND_ACCOUNT.md 11). Facts first, then what a
 * parent can do, then the documents:
 *
 * - Top: `trust.promise`, word for word, plain text, no icon (D-061; VOICE.md: no locks, no shields). It replaces
 *   the "What we never do" list, whose third line named photos, a feature v1.0 does not have (M13 rule 4).
 * - Where your book is kept: P2 (sync off) or P2b (sync on), the sync row when the build has sync (D-128), P3, and
 *   P4 or the usage switch (capabilities.analytics; P4 only where the build cannot collect, D-095).
 * - Who can see it: the plain fact while there is no app lock (`whoLockOff`); Names in notifications, which opens
 *   Reminders; P8 as the footer. APP_LOCK_ROW: feat/mobile-app-lock adds its row and the `whoLockOn` lines here.
 * - What you can do: Export your book, Recently deleted, Delete account (build 2, D-129), and P9 in a build with no
 *   account. ERASE_ROW: "Erase everything on this phone" joins here when #520 lands (design.md 2.11).
 * - Our promises in full: the Privacy Policy and the Terms, the two pages the website serves
 *   (test/privacy-documents.test.ts). Then `trust.short`, the "Private by default" line, moved here from Settings home.
 *
 * Each consent stays visible and changeable here, within two taps of Settings. Which lines show is decided by
 * privacyPage() (components/settings/privacy.logic.ts), so test/privacy-page.test.ts runs every build's variant.
 */
export default function PrivacySettings() {
  const p = copy.settings.privacy;
  const analytics = useAnalyticsConsent();
  const sensitive = useSensitiveDataStatus();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [names, setNames] = useState(lockScreenNamesOn);
  // Names in notifications changes on the Reminders page: re-read it when Privacy comes back.
  useFocusEffect(useCallback(() => setNames(lockScreenNamesOn()), []));
  const child = getActiveChild()?.name ?? consentCopy.childFallback;
  const page = privacyPage({
    sync: capabilities.sync,
    syncOn: sensitive.status === 'on',
    analytics: capabilities.analytics,
    accountDeletion: capabilities.accountDeletion && auth.signedIn,
    signIn: capabilities.signIn,
  });

  const setAnalytics = async (on: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (on) await grantAnalytics('settings');
      else await withdrawAnalytics();
    } finally {
      setBusy(false);
    }
  };

  const open = (url: string) => () => void WebBrowser.openBrowserAsync(url);
  const go = (route: string) => () => router.push(route as Href);

  return (
    <>
      <Stack.Screen options={{ title: p.title }} />
      <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        {/* The promise, word for word, at the top (D-061, CPrivO-5). No icon. */}
        <Text variant="body" className="px-4" testID="privacy.promise">
          {copy.trust.promise}
        </Text>

        <ListSection title={p.whereTitle}>
          {page.facts.map((key) => (
            <ListRow key={key} title={p[key]} testID={`privacy.fact.${key}`} />
          ))}
        </ListSection>

        {/* Sync and family sharing (build 2, D-128): read-only, no withdrawal yet (BL-485). */}
        {page.syncRow ? (
          <ListSection footer={fill(p.sensitiveHelp, { child })}>
            <ListRow
              title={p.sensitiveLabel}
              value={sensitiveStatusWords(sensitive.status)}
              trailing={sensitive.open ? 'chevron' : 'none'}
              onPress={sensitive.open}
              disabled={!sensitive.open && sensitive.status === 'signed_out'}
            />
          </ListSection>
        ) : null}

        {capabilities.analytics ? (
          <ListSection title={consentCopy.analyticsSection} footer={p.analyticsOffNote}>
            <ToggleRow title={p.analyticsLabel} description={p.analyticsHelp} value={analytics === 'granted'} onValueChange={setAnalytics} disabled={busy} />
          </ListSection>
        ) : null}

        <ListSection title={p.whoTitle} footer={p.notificationsLine}>
          <ListRow title={p.whoLockOff} testID="privacy.who" />
          {/* APP_LOCK_ROW: feat/mobile-app-lock adds "App lock, On or Off" here and swaps whoLockOff for whoLockOn. */}
          <ListRow
            title={p.lockScreenLabel}
            value={names ? copy.settings.privacy.sensitiveOn : copy.settings.reminders.offLabel}
            trailing="chevron"
            onPress={go('/settings/reminders')}
            testID="privacy.names"
          />
        </ListSection>

        <ListSection title={p.canDoTitle} footer={page.noAccountLine ? p.noAccount : undefined}>
          <ListRow title={copy.settingsHome.exportLabel} trailing="chevron" onPress={go('/settings/export')} />
          <ListRow title={copy.settings.delete.recentlyDeleted} trailing="chevron" onPress={go('/settings/recently-deleted')} />
          {/* ERASE_ROW: "Erase everything on this phone" (#520) joins here once it is merged. */}
          {page.deleteAccountRow ? <ListRow title={copy.settingsHome.deleteAccountLabel} variant="destructive" trailing="chevron" onPress={go('/settings/delete-account')} /> : null}
        </ListSection>

        {/* Only documents the website serves (P6b critics' M1): it took /health-privacy and /subprocessors down (#169), and
            their content sits inside /privacy. Their content keys wait for S14 and #163. */}
        <ListSection title={p.documentsTitle} footer={copy.trust.short}>
          <ListRow accessibilityRole="link" title={p.privacyPolicyLink} trailing="chevron" onPress={open(brand.web.privacy)} />
          <ListRow accessibilityRole="link" title={p.termsLink} trailing="chevron" onPress={open(brand.web.terms)} />
        </ListSection>
      </ScrollView>
    </>
  );
}
