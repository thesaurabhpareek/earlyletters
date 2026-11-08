/**
 * Settings, If you are struggling (D-034; EXPERIENCE_PASS_2026-10 S40, package P6): its own page, one tap from Settings
 * home, never behind a flag. The words are `struggling.*` exactly as packages/content holds them (FT-36 owns any
 * change): the line, the three free and confidential lines with how to reach each, and the 911 line. Each line is a
 * row that starts a call. Where the device reports it cannot call, the same tap shows the number to copy instead
 * (F20-REQ-005, components/settings/help-fallback.tsx), and the VoiceOver hint says so. No drawing, no lamp, no motion;
 * nothing is counted, logged or sent.
 */
import { Stack } from 'expo-router';
import { ScrollView } from 'react-native';
import { useHelpLink, usePhoneAbility } from '@/components/settings/help-fallback';
import { callTarget, rowHint } from '@/components/settings/help-links.logic';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

export default function StrugglingScreen() {
  const s = copy.struggling;
  const link = useHelpLink();
  // The hint promises a call only where this device reports it can make one (Review B on #519).
  const can = usePhoneAbility();
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: s.title }} />
      <Text variant="body" className="px-1">
        {s.body}
      </Text>
      <ListSection>
        {s.resources.map((r) => (
          <ListRow key={r.tel} title={r.name} subtitle={r.how} accessibilityRole="link" accessibilityHint={rowHint(can)} trailing="chevron" onPress={() => link.open(callTarget(r))} testID={`struggling.${r.tel}`} />
        ))}
      </ListSection>
      <Text variant="body" className="px-1">
        {s.emergency}
      </Text>
      {link.sheet}
    </ScrollView>
  );
}
