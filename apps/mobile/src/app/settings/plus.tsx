/**
 * Settings, Plan (PRD C-REQ-016, LEGAL-REQ-048; ADR 0013; EXPERIENCE_PASS_2026-10 S41, package P6). The path the
 * Subscription Terms and `plus.legal.cancel` name: Settings, Plan, Manage subscription. Everything that touches
 * money opens Apple's own sheet; this screen only says what StoreKit reports on this phone, and never types a price.
 *
 * An iOS Settings list (components/settings/plan.logic.ts): section Plus with "See what Plus adds" (or, with Plus
 * on, "Plus", its plan and dates) and the registered promise as its footer, once; then Manage subscription (only
 * with a subscription), Restore purchases with its result inline under it, Redeem a code, and the payment line as
 * the footer. No lamp. Registered words are today's; the held switches after counsel are `HELD` in plan.logic.ts.
 *
 * Route: /settings/plus.
 */
import { Stack } from 'expo-router';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, ScrollView, Share, View } from 'react-native';
import { brand } from '@scribe/brand';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { planScreen, restoreResult } from '@/components/settings/plan.logic';
import { useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import {
  askPlanReminderPermission,
  billingCopy,
  canAskForReminders,
  getPlanReminderPermission,
  manageSubscription,
  noteLines,
  PlanNoteBody,
  presentPlusStore,
  purchaseConfirmation,
  redeemOfferCode,
  requestRefund,
  restorePurchases,
  usePlan,
  usePlanNote,
} from '@/lib/billing';
import { copy, fill } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

const p = billingCopy.plan;

type Busy = null | 'store' | 'redeem' | 'manage' | 'restore' | 'refund';

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Notification permission, re-read when the app comes back (the person may have changed it in iOS Settings). */
function useNotificationsAllowed(): { allowed: boolean | null; askable: boolean; refresh: () => void } {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [askable, setAskable] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    void getPlanReminderPermission().then((perm) => live && setAllowed(perm === 'granted'));
    void canAskForReminders().then((a) => live && setAskable(a));
    const sub = AppState.addEventListener('change', (st) => st === 'active' && setTick((t) => t + 1));
    return () => {
      live = false;
      sub.remove();
    };
  }, [tick]);
  return { allowed, askable, refresh: () => setTick((t) => t + 1) };
}

export default function PlanSettings() {
  const { c } = useTheme();
  const plan = usePlan();
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Restore's answer, shown under its own row (S41); a failure carries the warning mark.
  const [restored, setRestored] = useState<ReturnType<typeof restoreResult>>(null);
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
    setRestored(null);
    try {
      setNotice(await action());
    } finally {
      setBusy(null);
    }
  };

  const ownPurchase = plan.details.ownership === 'purchased' && plan.details.status !== 'none';
  // Plan reminders (G-15, a courtesy): the note open now, and a quiet row when notifications are off.
  const note = usePlanNote(plan);
  const screen = planScreen({
    line: plan.line,
    details: plan.details,
    plusOn: plan.plusOn,
    storeSupport: plan.storeSupport,
    // The note says the date already: the row leaves that sentence out, so nothing is said twice (S41).
    noteLines: note ? noteLines(note, billingCopy.note, { timeZone: timeZone(), formatDay: (ymd) => longDate(ymd) }) : [],
    longDate: (ymd) => longDate(ymd),
  });
  const notifications = useNotificationsAllowed();
  const remindable = plan.plusOn && plan.details.ownership === 'purchased' && plan.details.willAutoRenew !== false && (plan.details.status === 'trial' || plan.details.status === 'active');
  const showNotificationsOff = remindable && notifications.allowed === false;

  const saveCopy = async () => {
    const c = purchaseConfirmation({
      details: plan.details,
      appName: brand.name,
      termsUrl: brand.web.terms,
      timeZone: timeZone(),
      now: Date.now(),
      words: billingCopy.confirmation,
      formatDay: (ymd) => longDate(ymd),
    });
    try {
      await Share.share({ message: c.summary, title: billingCopy.confirmation.title });
    } catch {
      // The share sheet could not open.
    }
    return null;
  };

  const allowNotifications = async () => {
    if (notifications.askable) await askPlanReminderPermission();
    else await Linking.openSettings().catch(() => {});
    notifications.refresh();
    return null;
  };

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: p.title }} />

      <ListSection title={p.statusTitle} footer={screen.promise}>
        {screen.status ? <ListRow title={screen.status.title} subtitle={screen.status.subtitle ?? undefined} value={screen.status.value ?? undefined} testID="plan.status" /> : null}
        {screen.seePlans?.kind === 'open' ? (
          <ListRow
            title={screen.seePlans.title}
            trailing="chevron"
            disabled={busy !== null}
            testID="plan.seePlans"
            onPress={() =>
              run('store', async () => {
                track('plus_offer_viewed', { trigger: 'settings' });
                const outcome = await presentPlusStore();
                if (outcome !== 'busy') track('plus_offer_closed', { trigger: 'settings', outcome });
                return outcome === 'purchased' ? billingCopy.gate.isOn : null;
              })
            }
          />
        ) : screen.seePlans ? (
          <ListRow title={screen.seePlans.title} testID="plan.unavailable" />
        ) : null}
      </ListSection>

      {note && (
        <ListSection title={billingCopy.note.title}>
          <View accessible className="px-4 py-3" testID="plan.note">
            <PlanNoteBody note={note} />
          </View>
        </ListSection>
      )}

      {showNotificationsOff && (
        <ListSection footer={fill(p.notificationsOff, { app: brand.name })}>
          <ListRow title={p.turnOnNotifications} trailing="chevron" disabled={busy !== null} onPress={() => run('manage', allowNotifications)} />
        </ListSection>
      )}

      <View className="gap-2">
        <ListSection footer={p.payment}>
          {screen.manage ? (
            <ListRow
              title={p.manage}
              subtitle={p.manageHelp}
              trailing="chevron"
              disabled={busy !== null}
              testID="plan.manage"
              onPress={() =>
                run('manage', async () => {
                  await manageSubscription();
                  return null;
                })
              }
            />
          ) : null}
          <ListRow
            title={p.restore}
            subtitle={busy === 'restore' ? p.restoring : p.restoreHelp}
            disabled={busy !== null}
            testID="plan.restore"
            onPress={() =>
              run('restore', async () => {
                const r = await restorePurchases();
                track('restore_result', { outcome: r });
                setRestored(restoreResult(r));
                return null;
              })
            }
          />
          {restored ? (
            <View accessible accessibilityLiveRegion="polite" className="flex-row items-start gap-2 px-4 py-3" testID="plan.restoreResult">
              {restored.failed ? <WarningCircleIcon size={18} color={c.caution} weight="bold" style={{ marginTop: 2 }} /> : null}
              <Text variant="subhead" className="flex-1">
                {restored.text}
              </Text>
            </View>
          ) : null}
          {screen.redeem ? (
            <ListRow
              title={p.redeem}
              subtitle={p.redeemHelp}
              trailing="chevron"
              disabled={busy !== null}
              testID="plan.redeem"
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
          ) : null}
          {ownPurchase && plan.plusOn && <ListRow title={p.saveCopy} subtitle={p.saveCopyHelp} disabled={busy !== null} onPress={() => run('manage', saveCopy)} />}
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
      </View>
    </ScrollView>
  );
}
