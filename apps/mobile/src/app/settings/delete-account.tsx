// web: apps/web /delete-account (Google Play web link, LEGAL-REQ-030; later) | android: same screen
/**
 * Settings > Delete account (EXPERIENCE_PASS_2026-10 S64, package P8c; PRD C-REQ-019, LEGAL-REQ-029, Apple 5.1.1(v),
 * DELETION_AND_EXPORT_SPEC 2.6.1). The logic is S14's (lib/account-deletion/**: the two steps, the 30-day window,
 * cancel, the per-book lines); this file is the page, and components/settings/delete-account.logic.ts what it decides.
 *
 * A pushed Settings page on paper: no lamp, no drawing (5.2).
 *  Step 1, What happens: the intro (held for counsel, C8), then a plain list, one line per book with BookOpen 20 pt
 *    (a family note sits under its book), then the copies line; "Keep a copy first" as a card with FileText and
 *    "Export everything" bordered; the Plus card with CreditCard only when Plus will renew; Continue at the bottom,
 *    enabled once every book's outcome is on the page.
 *  Step 2, Confirm: the heading in title2, the body with the date, the typed field, "Delete account" filled in the
 *    destructive colour and enabled only when "delete" is typed (it plays `warning` once), "Keep my account" quiet
 *    and the default (VoiceOver's escape gesture takes it).
 *  Scheduled: the date in title2, Cancel deletion bordered, Sign out of this phone; a cancel says so in a toast.
 *  Executing explains; signed out offers Sign in; the kill path says only its line.
 * A failure is one line with WarningCircle (lib/auth/ui ErrorLine) that says nothing has changed, next to the button
 * that can try again; a page that could not load offers Try again.
 * The steps swap in place, as S14 built them (one deletion state for the page); see the P8c PR for the native push.
 * Completes in-app, without email or support (Apple 5.1.1(v)).
 */
import { Redirect, Stack, router } from 'expo-router';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { canDelete, failureLine, HELD, whatHappens } from '@/components/settings/delete-account.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { accountDeletionCopy as c, expectedDeletionDate, localDay, stepFor, useAccountDeletion } from '@/lib/account-deletion';
import { ErrorLine } from '@/lib/auth/ui';
import { manageSubscription } from '@/lib/billing';
import { capabilities } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

/** v1.0 has no account (lib/capabilities.ts): Settings offers no row, and a stale route goes back to Settings. */
export default function DeleteAccountRoute() {
  return capabilities.signIn ? <DeleteAccount /> : <Redirect href="/settings" />;
}

/** Try again opens the page afresh (S14's state reloads with it); the first open is the one counted as started. */
function DeleteAccount() {
  const [attempt, setAttempt] = useState(0);
  return <DeleteAccountPage key={attempt} first={attempt === 0} onRetry={() => setAttempt((n) => n + 1)} />;
}

const PAGE = 'gap-7 px-5 pb-12 pt-4';

function DeleteAccountPage({ first, onRetry }: { first: boolean; onRetry: () => void }) {
  const colors = useTheme().c;
  const toast = useToast();
  const d = useAccountDeletion();
  const [wanted, setWanted] = useState<'review' | 'confirm'>('review');
  const [typed, setTyped] = useState('');
  const step = stepFor(d.status, wanted);

  useEffect(() => {
    if (d.signedIn && first) d.trackStage('started');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.signedIn]);

  const header = <Stack.Screen options={{ title: c.title }} />;
  const failure = <ErrorLine message={failureLine(d.error)} />;
  const tryAgain = <Button variant="outline" size="lg" className="self-start" label={copy.common.tryAgainButton} onPress={onRetry} />;

  if (!d.configured || !d.signedIn) {
    return (
      <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text variant="body">{d.configured ? c.signedOut.body : c.notConfigured}</Text>
        {d.configured ? <Button size="lg" className="self-start" label={c.signedOut.button} onPress={() => router.push('/settings/account')} /> : null}
      </ScrollView>
    );
  }

  if (step === 'loading') {
    return (
      <ScrollView contentContainerClassName={cn(PAGE, 'flex-grow justify-center')} contentInsetAdjustmentBehavior="automatic">
        {header}
        {d.error ? (
          <>
            {failure}
            {tryAgain}
          </>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </ScrollView>
    );
  }

  if (step === 'executing') {
    return (
      <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text variant="body">{c.executing}</Text>
      </ScrollView>
    );
  }

  if (step === 'scheduled' && d.status && d.status.state !== 'none' && d.status.state !== 'executing') {
    const date = longDate(localDay(d.status.scheduledFor));
    return (
      <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
        {header}
        <View className="gap-2">
          <View accessible accessibilityRole="header" className="gap-1">
            <Text variant="subhead" tone="muted">
              {c.scheduled.heading}
            </Text>
            <Text variant="title2">{date}</Text>
          </View>
          <Text variant="body">{fill(c.scheduled.body, { date })}</Text>
          <Text variant="footnote">{c.scheduled.emailNote}</Text>
        </View>
        {failure}
        <View className="gap-2">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            loading={d.busy}
            label={c.scheduled.cancelButton}
            onPress={async () => {
              if (await d.cancel()) {
                haptic('success');
                toast.show({ message: c.scheduled.cancelled });
              }
            }}
          />
          <Button variant="quiet" fullWidth disabled={d.busy} label={c.scheduled.doneButton} onPress={() => void d.signOut()} />
        </View>
        <View className="gap-2">
          <Text variant="subhead" tone="muted">
            {c.scheduled.exportNote}
          </Text>
          <Button variant="quiet" className="self-start" label={c.exportFirst.button} onPress={() => router.push('/settings/export')} />
        </View>
      </ScrollView>
    );
  }

  if (step === 'confirm') {
    const date = longDate(localDay(expectedDeletionDate(new Date())));
    const ready = canDelete(typed, d.busy);
    const keep = () => (setWanted('review'), setTyped(''));
    return (
      <ScrollView
        contentContainerClassName={PAGE}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        onAccessibilityEscape={() => (d.busy ? undefined : keep())}>
        {header}
        <View className="gap-2">
          <Text variant="title2" asHeading>
            {c.confirm.heading}
          </Text>
          <Text variant="body">{fill(c.confirm.body, { date })}</Text>
        </View>
        <TextField
          label={c.confirm.typeLabel}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType="done"
          editable={!d.busy}
        />
        {failure}
        <View className="gap-2">
          {/* Filled in the destructive colour only when it will act; until then, and while the request is on its way, the
              outline of a filled button that waits, with the spinner inside it. */}
          <Button
            variant="destructive"
            size="lg"
            fullWidth
            disabled={!ready}
            loading={d.busy}
            accessibilityLabel={c.confirm.button}
            className={ready ? 'bg-destructive' : 'border border-input'}
            onPress={async () => {
              haptic('warning');
              if (await d.request()) keep();
            }}>
            <Text tone={ready ? 'onDestructive' : 'muted'}>{c.confirm.button}</Text>
          </Button>
          <Button variant="quiet" fullWidth disabled={d.busy} label={c.confirm.back} onPress={keep} />
        </View>
      </ScrollView>
    );
  }

  const list = whatHappens(d.lines);
  return (
    <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
      {header}
      <View className="gap-4">
        <Text variant="title2" asHeading>
          {c.what.heading}
        </Text>
        <Text variant="body">{HELD.intro}</Text>
        {list.books.map((b, i) => (
          <View key={`${i}:${b.line}`} accessible accessibilityLabel={b.note ? `${b.line} ${b.note}` : b.line} className="flex-row items-start gap-3">
            <BookOpenIcon size={20} color={colors.textMuted} style={{ marginTop: 2 }} />
            <View className="flex-1 gap-1">
              <Text variant="body">{b.line}</Text>
              {b.note ? (
                <Text variant="subhead" tone="muted">
                  {b.note}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
        {list.empty ? <Text variant="body">{list.empty}</Text> : null}
        {list.copies ? (
          <Text variant="subhead" tone="muted">
            {list.copies}
          </Text>
        ) : null}
      </View>

      <Card variant="raised" radius="md" padding={4}>
        <View className="flex-row items-center gap-3">
          <FileTextIcon size={24} color={colors.accent} />
          <Text variant="headline" asHeading className="flex-1">
            {c.exportFirst.heading}
          </Text>
        </View>
        <Text variant="body" tone="muted">
          {c.exportFirst.body}
        </Text>
        <Button
          variant="outline"
          size="lg"
          className="self-start"
          label={c.exportFirst.button}
          onPress={() => (d.trackStage('export_offered'), router.push('/settings/export'))}
        />
      </Card>

      {d.subscriptionNotice ? (
        <Card variant="raised" radius="md" padding={4}>
          <View className="flex-row items-center gap-3">
            <CreditCardIcon size={24} color={colors.accent} />
            <Text variant="headline" asHeading className="flex-1">
              {c.subscription.heading}
            </Text>
          </View>
          <Text variant="body" tone="muted">
            {c.subscription.body}
          </Text>
          <Button variant="outline" size="lg" className="self-start" label={c.subscription.button} onPress={() => void manageSubscription()} />
        </Card>
      ) : null}

      {list.known ? null : (
        <>
          <ErrorLine message={c.errors.failed} />
          {tryAgain}
        </>
      )}
      <Button variant="outline" size="lg" fullWidth disabled={!list.known} label={c.continueButton} onPress={() => setWanted('confirm')} />
    </ScrollView>
  );
}
