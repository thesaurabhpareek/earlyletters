/**
 * Settings, Plan (PRD C-REQ-016, LEGAL-REQ-048; ADR 0013). The path the
 * Subscription Terms and `plus.legal.cancel` name: Settings, Plan, Manage
 * subscription. Everything that touches money opens Apple's own sheet; this
 * screen only says what StoreKit reports on this phone.
 *
 * Route: /settings/plus. The Settings home row that opens it is wired by the
 * screen's owner.
 */
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { billingCopy, manageSubscription, presentPlusStore, redeemOfferCode, requestRefund, restorePurchases, usePlan, type PlanLine } from '@/lib/billing';
import { copy, fill } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

const p = billingCopy.plan;

function statusText(line: PlanLine): string {
  switch (line.kind) {
    case 'trial':
      return [fill(p.trial, { date: longDate(line.until) }), line.cancelBy ? fill(p.trialCancelBy, { cancelBy: longDate(line.cancelBy) }) : '']
        .filter(Boolean)
        .join(' ');
    case 'renews':
      return fill(p.renews, { date: longDate(line.on) });
    case 'ends':
      return fill(p.ends, { date: longDate(line.on) });
    case 'grace':
      return p.grace;
    case 'retry':
      return p.retry;
    case 'on':
      return p.on;
    default:
      return p.off;
  }
}

type Busy = null | 'store' | 'redeem' | 'manage' | 'restore' | 'refund';

export default function PlanSettings() {
  const plan = usePlan();
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Set when Apple's offer code sheet was shown: a redeemed code arrives as an entitlement update,
  // so Plus turning on afterwards is the redemption (D-081). A number-free event, no code is ever read.
  const awaitingCode = useRef(false);

  useEffect(() => {
    if (plan.plusOn && awaitingCode.current) {
      awaitingCode.current = false;
      track('offer_code_redeemed', {});
    }
  }, [plan.plusOn]);

  const run = async (what: Exclude<Busy, null>, action: () => Promise<string | null>) => {
    if (busy) return;
    haptic('tap');
    setBusy(what);
    setNotice(null);
    try {
      setNotice(await action());
    } finally {
      setBusy(null);
    }
  };

  const shared = plan.plusOn && plan.details.ownership === 'familyShared';
  const ownPurchase = plan.details.ownership === 'purchased' && plan.details.status !== 'none';
  const period = plan.plusOn ? (plan.details.period === 'month' ? p.monthly : plan.details.period === 'year' ? p.yearly : null) : null;
  const storeNote = plan.storeSupport === 'needs_ios_17' ? p.needsNewerIos : plan.storeSupport === 'unsupported' ? p.unavailable : null;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: p.title }} />

      <ListSection title={p.statusTitle} footer={copy.plus.promise}>
        <View accessible className="gap-1 px-4 py-3">
          <View className="flex-row items-start gap-3">
            <Text variant="body" className="flex-1">
              {statusText(plan.line)}
            </Text>
            {period && (
              <Text variant="body" tone="muted">
                {period}
              </Text>
            )}
          </View>
          {shared && <Text variant="footnote">{p.shared}</Text>}
        </View>
      </ListSection>

      <View className="gap-2">
        <ListSection footer={p.payment}>
          {!plan.plusOn && plan.storeSupport === 'available' && (
            <ListRow
              title={p.seePlans}
              trailing="chevron"
              disabled={busy !== null}
              onPress={() =>
                run('store', async () => {
                  track('plus_offer_viewed', { trigger: 'settings' });
                  const outcome = await presentPlusStore();
                  if (outcome !== 'busy') track('plus_offer_closed', { trigger: 'settings', outcome });
                  return outcome === 'purchased' ? billingCopy.gate.isOn : null;
                })
              }
            />
          )}
          {!plan.plusOn && plan.storeSupport === 'available' && (
            <ListRow
              title={p.redeem}
              subtitle={p.redeemHelp}
              trailing="chevron"
              disabled={busy !== null}
              onPress={() =>
                run('redeem', async () => {
                  awaitingCode.current = true;
                  const outcome = await redeemOfferCode();
                  if (outcome === 'presented') return null;
                  awaitingCode.current = false;
                  return outcome === 'unavailable' ? p.redeemUnavailable : copy.errors.generic.body;
                })
              }
            />
          )}
          <ListRow
            title={p.manage}
            subtitle={p.manageHelp}
            trailing="chevron"
            disabled={busy !== null}
            onPress={() =>
              run('manage', async () => {
                await manageSubscription();
                return null;
              })
            }
          />
          <ListRow
            title={busy === 'restore' ? p.restoring : p.restore}
            subtitle={p.restoreHelp}
            disabled={busy !== null}
            onPress={() =>
              run('restore', async () => {
                const r = await restorePurchases();
                track('restore_result', { outcome: r });
                return r === 'restored' ? p.restored : r === 'nothing' ? p.restoreNothing : r === 'cancelled' ? null : p.restoreFailed;
              })
            }
          />
          {ownPurchase && (
            <ListRow
              title={p.refund}
              subtitle={p.refundHelp}
              trailing="chevron"
              disabled={busy !== null}
              onPress={() => run('refund', async () => ((await requestRefund()) === 'success' ? p.refundSent : null))}
            />
          )}
        </ListSection>
        {notice && (
          <Text variant="footnote" tone="default" accessibilityLiveRegion="polite" className="px-4">
            {notice}
          </Text>
        )}
        {storeNote && (
          <Text variant="footnote" className="px-4">
            {storeNote}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
