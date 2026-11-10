import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView } from 'react-native';
import { brand } from '@scribe/brand';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { copy } from '@/lib/copy';

/**
 * Settings > Legal (settings-ia.md 3, design.md 2.6; regroup of 8 Nov 2026): one page for the Terms of Service, the
 * Privacy Policy and Licenses, which sat as three rows under Help on Settings home. The two documents open in the
 * in-app browser (the pages the website serves, test/privacy-documents.test.ts); Licenses pushes its own page.
 */
export default function Legal() {
  const h = copy.settingsHome;
  const open = (url: string) => () => void WebBrowser.openBrowserAsync(url);
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection>
        <ListRow accessibilityRole="link" title={h.termsLabel} trailing="chevron" onPress={open(brand.web.terms)} />
        <ListRow accessibilityRole="link" title={h.privacyPolicyLabel} trailing="chevron" onPress={open(brand.web.privacy)} />
        <ListRow title={h.licencesLabel} trailing="chevron" onPress={() => router.push('/settings/licenses' as Href)} testID="settings.licenses" />
      </ListSection>
    </ScrollView>
  );
}
