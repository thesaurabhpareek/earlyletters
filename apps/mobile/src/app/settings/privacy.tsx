import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { brand } from '@scribe/brand';
import { NeverList } from '@/components/consent/never-list';
import { consentCopy } from '@/components/consent/copy';
import { capabilities } from '@/lib/capabilities';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { copy, fill } from '@/lib/copy';
import { getActiveChild } from '@/lib/store';
import { grantAnalytics, withdrawAnalytics } from '@/lib/analytics';
import { useAnalyticsConsent } from '@/lib/analytics/use-analytics-consent';
import { useSensitiveDataStatus } from '@/lib/analytics/privacy-sources';

/**
 * Settings > Privacy (PRD.md K-01, K-17; C-REQ-016; LEGAL-REQ-003, -006).
 * Each consent is visible and changeable here, within two taps of Settings.
 *
 * - Usage and crash reports: the same switch as the consent sheet. Off stops
 *   sending within the session (PRD-REQ-018); on starts a new random id.
 * - Sync and family sharing (sensitive-data consent): shown here; its owner
 *   registers the status and the change flow (lib/analytics/privacy-sources).
 * - What we never do, then the full documents.
 * v1.0: no sync and no account (lib/capabilities.ts), so the sync consent row is not shown.
 */
export default function PrivacySettings() {
  const p = copy.settings.privacy;
  const analytics = useAnalyticsConsent();
  const sensitive = useSensitiveDataStatus();
  const [busy, setBusy] = useState(false);
  const child = getActiveChild()?.name ?? consentCopy.childFallback;

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

  const sensitiveValue = sensitive.status === 'on' ? p.sensitiveOn : sensitive.status === 'off' ? p.sensitiveOff : p.sensitiveSignedOut;
  const open = (url: string) => () => void WebBrowser.openBrowserAsync(url);


  return (
    <>
      <Stack.Screen options={{ title: p.title }} />
      <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        <ListSection title={consentCopy.analyticsSection} footer={p.analyticsOffNote}>
          <ToggleRow title={p.analyticsLabel} description={p.analyticsHelp} value={analytics === 'granted'} onValueChange={setAnalytics} disabled={busy} />
        </ListSection>

        {capabilities.sync ? (
          <ListSection title={consentCopy.sensitiveSection} footer={fill(p.sensitiveHelp, { child })}>
            <ListRow
              title={p.sensitiveLabel}
              value={sensitiveValue}
              trailing={sensitive.open ? 'chevron' : 'none'}
              onPress={sensitive.open}
              disabled={!sensitive.open && sensitive.status === 'signed_out'}
            />
          </ListSection>
        ) : null}

        <NeverList />

        <ListSection title={p.documentsTitle}>
          <ListRow accessibilityRole="link" title={p.privacyPolicyLink} trailing="chevron" onPress={open(brand.web.privacy)} />
          <ListRow accessibilityRole="link" title={p.healthPrivacyLink} trailing="chevron" onPress={open(brand.web.healthPrivacy)} />
          <ListRow accessibilityRole="link" title={p.subprocessorsLink} trailing="chevron" onPress={open(brand.web.subprocessors)} />
          <ListRow accessibilityRole="link" title={p.termsLink} trailing="chevron" onPress={open(brand.web.terms)} />
        </ListSection>
      </ScrollView>
    </>
  );
}
