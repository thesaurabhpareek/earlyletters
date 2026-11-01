/**
 * Settings, If you are struggling (D-034; EXPERIENCE_PASS_2026-10 S40, package P6): its own page, one tap from Settings
 * home, never behind a flag. The words are `struggling.*` exactly as packages/content holds them (FT-36 owns any
 * change): the line, the three free and confidential lines with how to reach each, and the 911 line. Each line is its
 * own group: its row starts a call, and a line that takes texts has a Text row after it, so the page does what the
 * words say ("call or text", F20-REQ-002). A device that cannot call or text (an iPad, no SIM) shows the number to copy
 * in the same tap (F20-REQ-005, components/settings/help-fallback.tsx). No drawing, no lamp, no motion; nothing is
 * counted, logged or sent.
 */
import { Stack } from 'expo-router';
import { ScrollView } from 'react-native';
import { useHelpLink } from '@/components/settings/help-fallback';
import { crisisRows } from '@/components/settings/help-links.logic';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

export default function StrugglingScreen() {
  const s = copy.struggling;
  const link = useHelpLink();
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: s.title }} />
      <Text variant="body" className="px-1">
        {s.body}
      </Text>
      {crisisRows(s.resources).map(({ line: r, call, text }) => (
        <ListSection key={r.tel}>
          <ListRow title={r.name} subtitle={r.how} accessibilityRole="link" accessibilityHint={s.callHint} trailing="chevron" onPress={() => link.open(call)} testID={`struggling.${r.tel}`} />
          {text ? (
            <ListRow title={s.textRow} subtitle={r.number} accessibilityRole="link" accessibilityHint={s.textHint} trailing="chevron" onPress={() => link.open(text)} testID={`struggling.sms.${r.tel}`} />
          ) : null}
        </ListSection>
      ))}
      <Text variant="body" className="px-1">
        {s.emergency}
      </Text>
      {link.sheet}
    </ScrollView>
  );
}
