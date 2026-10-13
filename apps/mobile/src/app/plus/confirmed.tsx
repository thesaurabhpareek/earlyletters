/**
 * Purchase confirmation (G-15; in-app-disclosures 1.4.0 section 3; Subscription
 * Terms 1.4.0 "Receipts and reminders"; Q-003 memo point 3). Opened by
 * presentPlusStore() right after Apple's sheet closes with a new purchase of
 * the person's own.
 *
 * Shows what they agreed to, from StoreKit on this phone: the plan, the price
 * after (Apple's own display string), the trial end or renewal date, the
 * cancel-by date, automatic renewal, how to cancel, Apple's role and Family
 * Sharing. "Save a copy" opens the share sheet with the same terms as plain
 * text (Mail to yourself, Notes, Files): the person keeps it, we never see it.
 * One plain ask, "Remind me before ...", appears only while iOS has never been
 * asked about notifications; the system prompt follows only on that tap.
 *
 * Route: /plus/confirmed (a pushed screen; Done goes back).
 */
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { brand } from '@scribe/brand';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import {
  askPlanReminderPermission,
  billingCopy,
  canAskForReminders,
  getDisplayPrices,
  getPlanReminderPermission,
  purchaseConfirmation,
  refreshDisplayPrices,
  trialDaysOf,
  usePlan,
} from '@/lib/billing';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

const c = billingCopy.confirmation;

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export default function PlusConfirmed() {
  const plan = usePlan();
  const [prices, setPrices] = useState(getDisplayPrices());
  const [askable, setAskable] = useState(false);
  const [reminders, setReminders] = useState<'on' | 'off' | null>(null);

  useEffect(() => {
    let live = true;
    void refreshDisplayPrices().then((p) => live && setPrices({ ...p }));
    void canAskForReminders().then((can) => {
      if (!live) return;
      setAskable(can);
      if (!can) void getPlanReminderPermission().then((p) => live && setReminders(p === 'granted' ? 'on' : 'off'));
    });
    return () => {
      live = false;
    };
  }, []);

  const d = plan.details;
  const confirmation = useMemo(
    () =>
      purchaseConfirmation({
        details: d,
        displayPrice: d.productId ? (prices[d.productId] ?? null) : null,
        appName: brand.name,
        termsUrl: brand.web.terms,
        timeZone: timeZone(),
        now: Date.now(),
        words: { ...c, price: billingCopy.price },
        formatDay: (ymd) => longDate(ymd),
      }),
    [d, prices],
  );

  const trial = d.status === 'trial';
  const remindLabel = trial ? (trialDaysOf(plan) > 31 ? c.remindTrialMonths : c.remindTrialOneMonth) : c.remindRenewal;

  const save = async () => {
    haptic('tap');
    try {
      await Share.share({ message: confirmation.summary, title: c.title });
    } catch {
      // The share sheet could not open; Settings, Plan offers the same copy.
    }
  };

  const remind = async () => {
    haptic('tap');
    const p = await askPlanReminderPermission();
    setAskable(false);
    setReminders(p === 'granted' ? 'on' : 'off');
  };

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-8">
        <Text role="heading" variant="title1">
          {c.title}
        </Text>
        <Text variant="headline">{confirmation.planName}</Text>
        <View className="gap-3">
          {confirmation.lines.map((line, i) => (
            <Text key={i} variant={i < 2 ? 'body' : 'footnote'}>
              {line}
            </Text>
          ))}
        </View>

        <View className="gap-3 pt-2">
          <Button variant="secondary" label={c.saveCopy} onPress={save} accessibilityHint={c.saveCopyHelp} />
          <Text variant="footnote">{c.saveCopyHelp}</Text>
          {askable && plan.details.ownership === 'purchased' && <Button variant="outline" label={remindLabel} onPress={remind} />}
          {reminders && (
            <Text variant="footnote" accessibilityLiveRegion="polite">
              {reminders === 'on' ? c.remindOn : c.remindOff}
            </Text>
          )}
          <Button label={c.done} onPress={done} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
