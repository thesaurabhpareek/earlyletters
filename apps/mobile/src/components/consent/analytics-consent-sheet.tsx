// web: apps/web (no consent surface on the web page at v1.0, TRACKING_PLAN 8.5) | android: same component
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useIsLargeText } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { declineAnalytics, grantAnalytics } from '@/lib/analytics';

export type ConsentSheetResult = 'granted' | 'declined' | 'dismissed';

/**
 * The analytics consent ask (LEGAL-REQ-003, PRD-REQ-001, K-01): the third
 * ask, on a later session after the first letter (`analyticsAskDueNow`,
 * shown by `consent-ask.tsx`).
 *
 * - Two choices of equal weight: same component, variant and size, side by
 *   side (stacked at large text sizes). Nothing is preselected.
 * - Saying no changes nothing else in the app, Plus included.
 * - Closing without choosing is not a no: the choice stays open and the ask
 *   may return once in a later session (MAX_ANALYTICS_CONSENT_OFFERS).
 *
 * `AnalyticsConsentContent` is the body alone (with its own title unless
 * `showTitle` is false), for a router `formSheet` screen (TDD 01 3.1 sheets);
 * `AnalyticsConsentSheet` puts it in the app's one `Sheet`, which owns the
 * title, focus, scrim and Close.
 */
export function AnalyticsConsentContent({
  onDone,
  showTitle = true,
}: {
  onDone: (result: Exclude<ConsentSheetResult, 'dismissed'>) => void;
  showTitle?: boolean;
}) {
  const t = copy.analyticsConsent;
  const stacked = useIsLargeText();
  const [busy, setBusy] = useState(false);

  const choose = async (yes: boolean) => {
    if (busy) return;
    setBusy(true);
    haptic('tap');
    try {
      if (yes) await grantAnalytics('consent_sheet');
      else await declineAnalytics();
    } finally {
      setBusy(false);
      onDone(yes ? 'granted' : 'declined');
    }
  };

  return (
    <View className="gap-4">
      {showTitle ? (
        <Text variant="title2" asHeading>
          {t.title}
        </Text>
      ) : null}
      <Text variant="body">{t.body}</Text>
      <Text variant="callout" tone="muted">
        {t.detail}
      </Text>
      <View className={stacked ? 'gap-3' : 'flex-row gap-3'}>
        <Button variant="outline" className={stacked ? undefined : 'flex-1'} disabled={busy} onPress={() => choose(false)} accessibilityLabel={t.noButton}>
          <Text>{t.noButton}</Text>
        </Button>
        <Button variant="outline" className={stacked ? undefined : 'flex-1'} disabled={busy} onPress={() => choose(true)} accessibilityLabel={t.yesButton}>
          <Text>{t.yesButton}</Text>
        </Button>
      </View>
      <Text variant="footnote">{t.changeLater}</Text>
    </View>
  );
}

export function AnalyticsConsentSheet({ visible, onClose }: { visible: boolean; onClose: (result: ConsentSheetResult) => void }) {
  // One report per showing. A choice reports first; the Sheet's own close (scrim, pan, Close,
  // or the dismiss that follows a choice) then reports 'dismissed', which is ignored.
  const reported = useRef(false);
  useEffect(() => {
    if (visible) reported.current = false;
  }, [visible]);
  const report = (result: ConsentSheetResult) => {
    if (reported.current) return;
    reported.current = true;
    onClose(result);
  };
  return (
    <Sheet open={visible} title={copy.analyticsConsent.title} onClose={() => report('dismissed')}>
      <AnalyticsConsentContent showTitle={false} onDone={report} />
    </Sheet>
  );
}
