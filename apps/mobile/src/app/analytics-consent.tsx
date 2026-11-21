/**
 * The analytics consent sheet as a screen (founder, 20 Nov 2026): a router form sheet that shows the
 * FOUNDER-WORDING copy (`copy.analyticsConsent`, packages/content) and records the choice through
 * `grantAnalytics` / `declineAnalytics` (lib/analytics). Two choices of equal weight; closing without choosing is
 * not a no and not a yes (the ask may return once, MAX_ANALYTICS_CONSENT_OFFERS); saying no changes nothing else.
 *
 * Route: /analytics-consent. The screen exists and shows the same content as the Sheet that `components/consent/
 * consent-ask.tsx` still mounts; switching the ask to `router.push('/analytics-consent')` is a one-line follow-up for
 * `mobile` (not run on a device here). In a build without analytics (every profile but production, `EXPO_PUBLIC_ANALYTICS`)
 * the route goes back at once and shows nothing. Not listed in ROUTE_MAP: it sends no screen event.
 */
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { AnalyticsConsentContent } from '@/components/consent/analytics-consent-sheet';
import { analyticsAskAvailable, analyticsEnabled } from '@/lib/capabilities';

export default function AnalyticsConsentScreen() {
  const off = !analyticsAskAvailable(analyticsEnabled(), process.env.EXPO_PUBLIC_POSTHOG_KEY);
  useEffect(() => {
    if (off && router.canGoBack()) router.back();
  }, [off]);
  if (off) return null;
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', headerShown: false, gestureEnabled: true, sheetGrabberVisible: true }} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-6" contentInsetAdjustmentBehavior="automatic">
        <AnalyticsConsentContent onDone={() => router.canGoBack() && router.back()} />
      </ScrollView>
    </>
  );
}
