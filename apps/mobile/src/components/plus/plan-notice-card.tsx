/**
 * The in-app plan reminder card (BL-342, WP-F14-07; F14-REQ-010): the same words as the notification,
 * shown even when notifications are off. On Tonight it opens Settings, Plan (never the purchase view);
 * in Plan the open button is hidden. "Got it" hides this notice's card.
 */
import { router } from 'expo-router';
import { Button, ButtonRow } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { billingCopy } from '@/lib/billing';
import { usePlanNoticeCard } from '@/lib/billing/use-plan-notice';

export function PlanNoticeCard({ showOpen = true }: { showOpen?: boolean }) {
  const card = usePlanNoticeCard();
  if (!card) return null;
  const c = billingCopy.notices;
  return (
    <Card variant="raised">
      <CardContent>
        <Text variant="footnote" tone="muted">
          {c.cardLabel}
        </Text>
        <CardTitle>{card.text.title}</CardTitle>
        <CardDescription>{card.text.body}</CardDescription>
      </CardContent>
      <ButtonRow>
        {showOpen && <Button variant="secondary" size="sm" label={c.cardOpen} onPress={() => router.push('/settings/plus')} />}
        <Button variant="quiet" size="sm" label={c.cardDismiss} onPress={card.dismiss} />
      </ButtonRow>
    </Card>
  );
}
