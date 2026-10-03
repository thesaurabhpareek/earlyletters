// web: apps/web (no consent surface on the web page at v1.0, TRACKING_PLAN 8.5) | android: same component
import { useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { declineAnalytics, grantAnalytics } from '@/lib/analytics';
import { consentCopy } from './copy';

export type ConsentSheetResult = 'granted' | 'declined' | 'dismissed';

/**
 * The analytics consent ask (LEGAL-REQ-003, PRD-REQ-001, K-01): the third
 * ask, on a later session after the first letter (`analyticsAskDue`).
 *
 * - Two choices of equal weight: same component, variant and size, side by
 *   side (stacked at large text sizes). Nothing is preselected.
 * - Saying no changes nothing else in the app, Plus included.
 * - Closing without choosing is not a no: the choice stays open and the ask
 *   may return once in a later session (MAX_ANALYTICS_CONSENT_OFFERS).
 *
 * `AnalyticsConsentContent` is the body alone, for a router `formSheet`
 * screen (TDD 01 3.1 sheets); `AnalyticsConsentSheet` wraps it in the same
 * bottom sheet the app's other sheets use.
 */
export function AnalyticsConsentContent({ onDone }: { onDone: (result: Exclude<ConsentSheetResult, 'dismissed'>) => void }) {
  const t = copy.analyticsConsent;
  const { fontScale } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const stacked = fontScale >= 1.35;

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
      <Text role="heading" className="text-xl font-semibold text-foreground">
        {t.title}
      </Text>
      <Text className="text-base leading-6 text-foreground">{t.body}</Text>
      <Text className="text-base leading-6 text-muted-foreground">{t.detail}</Text>
      <View className={stacked ? 'gap-3' : 'flex-row gap-3'}>
        <Button variant="outline" className={stacked ? undefined : 'flex-1'} disabled={busy} onPress={() => choose(false)} accessibilityLabel={t.noButton}>
          <Text>{t.noButton}</Text>
        </Button>
        <Button variant="outline" className={stacked ? undefined : 'flex-1'} disabled={busy} onPress={() => choose(true)} accessibilityLabel={t.yesButton}>
          <Text>{t.yesButton}</Text>
        </Button>
      </View>
      <Text className="text-sm leading-5 text-muted-foreground">{t.changeLater}</Text>
    </View>
  );
}

export function AnalyticsConsentSheet({ visible, onClose }: { visible: boolean; onClose: (result: ConsentSheetResult) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose('dismissed')}>
      <Pressable className="flex-1 bg-black/30" onPress={() => onClose('dismissed')} accessibilityRole="button" accessibilityLabel={consentCopy.closeLabel} />
      <View accessibilityViewIsModal className="rounded-t-[28px] bg-card px-5 pt-3" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />
        <AnalyticsConsentContent onDone={onClose} />
      </View>
    </Modal>
  );
}
