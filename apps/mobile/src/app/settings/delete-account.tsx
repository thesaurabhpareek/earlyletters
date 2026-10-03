// web: apps/web /delete-account (Google Play web link, LEGAL-REQ-030; later) | android: same screen
/**
 * Settings > Delete account (PRD C-REQ-019, LEGAL-REQ-029, Apple 5.1.1(v),
 * DELETION_AND_EXPORT_SPEC 2.6.1).
 *
 * Two steps, then a 30-day window:
 *  1. What happens: per book, in plain words (a book shared with a co-parent
 *     stays with them; a sole parent's book goes), what copies stay with
 *     family, Export everything as the first action, and the Apple billing
 *     notice with Manage subscription when Plus will renew.
 *  2. Confirm: the deletion date and a typed "delete".
 * Scheduled: the date, Cancel deletion, and sign out of this phone.
 * Completes in-app, without email or support (Apple 5.1.1(v)).
 */
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Row, Section } from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { accountDeletionCopy as c, confirmationMatches, expectedDeletionDate, localDay, stepFor, useAccountDeletion } from '@/lib/account-deletion';
import { manageSubscription } from '@/lib/billing';
import { fill } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

export default function DeleteAccount() {
  const colors = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const d = useAccountDeletion();
  const [wanted, setWanted] = useState<'review' | 'confirm'>('review');
  const [typed, setTyped] = useState('');
  const step = stepFor(d.status, wanted);

  useEffect(() => {
    if (d.signedIn) d.trackStage('started');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.signedIn]);

  const header = <Stack.Screen options={{ title: c.title }} />;
  const errorLine = d.error ? (
    <Text accessibilityRole="alert" className="px-1 text-sm leading-5 text-destructive">
      {d.error === 'offline' ? c.errors.offline : c.errors.failed}
    </Text>
  ) : null;

  if (!d.configured || !d.signedIn) {
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text className="text-base leading-6 text-foreground">{d.configured ? c.signedOut.body : c.notConfigured}</Text>
        {d.configured && <Button onPress={() => router.push('/settings/account')}><Text>{c.signedOut.button}</Text></Button>}
      </ScrollView>
    );
  }

  if (step === 'loading') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-5">
        {header}
        {d.error ? errorLine : <ActivityIndicator color={colors.accent} />}
      </View>
    );
  }

  if (step === 'executing') {
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text className="text-base leading-6 text-foreground">{c.executing}</Text>
      </ScrollView>
    );
  }

  if (step === 'scheduled' && d.status && d.status.state !== 'none' && d.status.state !== 'executing') {
    const date = longDate(localDay(d.status.scheduledFor));
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        {header}
        <View className="gap-2">
          <Text role="heading" className="text-2xl font-semibold text-foreground">{c.scheduled.heading}</Text>
          <Text className="text-base leading-6 text-foreground">{fill(c.scheduled.body, { date })}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">{c.scheduled.emailNote}</Text>
        </View>
        <Section footer={c.scheduled.exportNote}>
          <Row first title={c.exportFirst.button} onPress={() => router.push('/settings/export')} />
        </Section>
        {errorLine}
        <Button
          variant="outline"
          disabled={d.busy}
          onPress={async () => {
            haptic('press');
            if (await d.cancel()) haptic('success');
          }}>
          <Text>{c.scheduled.cancelButton}</Text>
        </Button>
        <Button variant="ghost" onPress={() => void d.signOut()}>
          <Text>{c.scheduled.doneButton}</Text>
        </Button>
      </ScrollView>
    );
  }

  if (step === 'confirm') {
    const date = longDate(localDay(expectedDeletionDate(new Date())));
    const ready = confirmationMatches(typed) && !d.busy;
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        {header}
        <View className="gap-2">
          <Text role="heading" className="text-2xl font-semibold text-foreground">{c.confirm.heading}</Text>
          <Text className="text-base leading-6 text-foreground">{fill(c.confirm.body, { date })}</Text>
        </View>
        <View className="gap-2">
          <Text nativeID="confirm-label" className="text-base font-medium text-muted-foreground">{c.confirm.typeLabel}</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            editable={!d.busy}
            accessibilityLabel={c.confirm.typeLabel}
            accessibilityLabelledBy="confirm-label"
          />
        </View>
        {errorLine}
        <Button
          variant="destructive"
          disabled={!ready}
          accessibilityState={{ disabled: !ready, busy: d.busy }}
          onPress={async () => {
            haptic('warning');
            if (await d.request()) {
              setTyped('');
              setWanted('review');
            }
          }}>
          <Text>{c.confirm.button}</Text>
        </Button>
        <Button variant="ghost" disabled={d.busy} onPress={() => (setWanted('review'), setTyped(''))}>
          <Text>{c.confirm.back}</Text>
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {header}
      {d.cancelled && (
        <Text accessibilityRole="alert" className="text-base leading-6 text-foreground">{c.scheduled.cancelled}</Text>
      )}
      <View className="gap-3">
        <Text role="heading" className="text-2xl font-semibold text-foreground">{c.what.heading}</Text>
        <Text className="text-base leading-6 text-foreground">{c.what.intro}</Text>
        {(d.lines ?? []).map((line) => (
          <Text key={line} className="text-base leading-6 text-foreground">{line}</Text>
        ))}
      </View>
      <Section title={c.exportFirst.heading} footer={c.exportFirst.body}>
        <Row first title={c.exportFirst.button} onPress={() => (d.trackStage('export_offered'), router.push('/settings/export'))} />
      </Section>
      {d.subscriptionNotice && (
        <Section title={c.subscription.heading} footer={c.subscription.body}>
          <Row first title={c.subscription.button} onPress={() => void manageSubscription()} />
        </Section>
      )}
      {errorLine}
      <Button variant="outline" onPress={() => (haptic('tap'), setWanted('confirm'))}>
        <Text>{c.continueButton}</Text>
      </Button>
    </ScrollView>
  );
}
