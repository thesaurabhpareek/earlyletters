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
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Row, Section } from '@/components/settings/settings-ui';
import { Text } from '@/components/ui/text';
import { billingCopy, manageSubscription, presentPlusStore, requestRefund, restorePurchases, usePlan, type PlanLine } from '@/lib/billing';
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

type Busy = null | 'store' | 'manage' | 'restore' | 'refund';

export default function PlanSettings() {
  const plan = usePlan();
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

      <Section title={p.statusTitle} footer={copy.plus.promise}>
        <View accessible className="gap-1 px-4 py-3">
          <View className="flex-row items-start gap-3">
            <Text className="flex-1 text-base leading-6 text-foreground">{statusText(plan.line)}</Text>
            {period && <Text className="text-base text-muted-foreground">{period}</Text>}
          </View>
          {shared && <Text className="text-sm leading-5 text-muted-foreground">{p.shared}</Text>}
        </View>
      </Section>

      <View className="gap-2">
        <Section footer={p.payment}>
          {!plan.plusOn && plan.storeSupport === 'available' && (
            <Row
              first
              title={p.seePlans}
              disabled={busy !== null}
              onPress={() => run('store', async () => ((await presentPlusStore()) === 'purchased' ? billingCopy.gate.isOn : null))}
            />
          )}
          <Row
            first={plan.plusOn || plan.storeSupport !== 'available'}
            title={p.manage}
            subtitle={p.manageHelp}
            disabled={busy !== null}
            onPress={() =>
              run('manage', async () => {
                await manageSubscription();
                return null;
              })
            }
          />
          <Row
            title={busy === 'restore' ? p.restoring : p.restore}
            subtitle={p.restoreHelp}
            disabled={busy !== null}
            onPress={() =>
              run('restore', async () => {
                const r = await restorePurchases();
                return r === 'restored' ? p.restored : r === 'nothing' ? p.restoreNothing : r === 'cancelled' ? null : p.restoreFailed;
              })
            }
          />
          {ownPurchase && (
            <Row
              title={p.refund}
              subtitle={p.refundHelp}
              disabled={busy !== null}
              onPress={() => run('refund', async () => ((await requestRefund()) === 'success' ? p.refundSent : null))}
            />
          )}
        </Section>
        {notice && (
          <Text accessibilityLiveRegion="polite" className="px-1 text-sm leading-5 text-foreground">
            {notice}
          </Text>
        )}
        {storeNote && <Text className="px-1 text-sm leading-5 text-muted-foreground">{storeNote}</Text>}
      </View>
    </ScrollView>
  );
}
