/**
 * Settings, If you are struggling (D-034; EXPERIENCE_PASS_2026-10 S40; struggling-page.md section 3): its own page,
 * one tap from Settings home, never behind a flag. The emergency line comes first, then the lines for the phone's
 * own region (packages/content helplines.ts, each with its source and the day it was read), each a card with Call
 * and Text. A phone set to a region we hold no lines for gets the general emergency words and the Find A Helpline
 * directory. "Lines in other countries" lists every region we hold, for travellers and phones set elsewhere.
 *
 * A tap opens Phone or Messages and never dials by itself; where it cannot open, the same tap shows the number to
 * copy (F20-REQ-005, components/settings/help-fallback.tsx), and the VoiceOver hint says so. The region is read on
 * the phone and never stored or sent. No drawing, no lamp, no motion; nothing is counted, logged or sent.
 */
import { router, Stack, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, View } from 'react-native';
import { HELPLINE_DIRECTORY } from '@scribe/content';
import { useHelpLink, usePhoneAbility } from '@/components/settings/help-fallback';
import { rowHint } from '@/components/settings/help-links.logic';
import { HelplineCard } from '@/components/settings/helpline-card';
import { usePhoneRegion } from '@/components/settings/phone-region';
import { emergencyLine, localLines } from '@/components/settings/struggling.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

const ELSEWHERE_ROUTE = '/settings/struggling-elsewhere';

export default function StrugglingScreen() {
  const s = copy.struggling;
  const link = useHelpLink();
  // The hint promises a call only where this device reports it can make one (Review B on #519).
  const can = usePhoneAbility();
  const local = localLines(usePhoneRegion());
  const emergency = emergencyLine(local);
  return (
    <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: s.title }} />
      <Text variant="body" className="px-1">
        {s.body}
      </Text>
      <Card variant="tinted" padding={4} testID="struggling.emergency">
        <Text variant="headline" asHeading={2}>
          {s.emergencyTitle}
        </Text>
        {emergency.target ? (
          <Button size="lg" label={emergency.label} accessibilityHint={rowHint(can)} onPress={() => link.open(emergency.target!)} testID="struggling.emergency.call" />
        ) : (
          <Text variant="body">{emergency.label}</Text>
        )}
      </Card>
      {local ? (
        <View className="gap-3">
          {local.lines.map((line) => (
            <HelplineCard key={line.id} line={line} open={link.open} callHint={rowHint(can)} />
          ))}
        </View>
      ) : null}
      <ListSection>
        {local ? null : (
          <ListRow
            title={s.directory}
            subtitle={s.directoryBody}
            accessibilityRole="link"
            accessibilityHint={copy.helpLinks.webHint}
            trailing="chevron"
            onPress={() => void WebBrowser.openBrowserAsync(HELPLINE_DIRECTORY.url)}
            testID="struggling.directory"
          />
        )}
        <ListRow title={s.otherCountries} trailing="chevron" onPress={() => router.push(ELSEWHERE_ROUTE as Href)} testID="struggling.elsewhere" />
      </ListSection>
      <Text variant="subhead" tone="muted" className="px-1">
        {s.privacy}
      </Text>
      {link.sheet}
    </ScrollView>
  );
}
