/**
 * Settings, If you are struggling, Lines in other countries (struggling-page.md section 3): every region we hold
 * lines for (packages/content helplines.ts), each under its country with its emergency number, then the Find A
 * Helpline directory for everywhere else. For travellers and for phones whose region is set to somewhere the person
 * is not. Same cards, same Call and Text with the copy fallback as the page before. No motion; nothing recorded.
 */
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, View } from 'react-native';
import { HELPLINE_DIRECTORY } from '@scribe/content';
import { useHelpLink, usePhoneAbility } from '@/components/settings/help-fallback';
import { rowHint } from '@/components/settings/help-links.logic';
import { HelplineCard } from '@/components/settings/helpline-card';
import { otherCountries } from '@/components/settings/struggling.logic';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

export default function StrugglingElsewhereScreen() {
  const s = copy.struggling;
  const link = useHelpLink();
  const can = usePhoneAbility();
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: s.otherCountries }} />
      <Text variant="body" className="px-1">
        {s.otherCountriesBody}
      </Text>
      {otherCountries().map((r) => (
        <View key={r.region} className="gap-3" testID={`struggling.elsewhere.${r.region}`}>
          <View className="gap-1 px-1">
            <Text variant="title2" asHeading={2}>
              {r.country}
            </Text>
            <Text variant="subhead" tone="muted">
              {s.emergencyIn.replace('{n}', r.emergency.shown)}
            </Text>
          </View>
          {r.lines.map((line) => (
            <HelplineCard key={line.id} line={line} open={link.open} callHint={rowHint(can)} />
          ))}
        </View>
      ))}
      <ListSection>
        <ListRow
          title={s.directory}
          subtitle={s.directoryBody}
          accessibilityRole="link"
          accessibilityHint={copy.helpLinks.webHint}
          trailing="chevron"
          onPress={() => void WebBrowser.openBrowserAsync(HELPLINE_DIRECTORY.url)}
          testID="struggling.elsewhere.directory"
        />
      </ListSection>
      <Text variant="subhead" tone="muted" className="px-1">
        {s.privacy}
      </Text>
      {link.sheet}
    </ScrollView>
  );
}
