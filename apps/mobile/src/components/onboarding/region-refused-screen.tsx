/**
 * E-S04.refused-region (NS-40-R9, R14; FP-6; docs/design/e2e/E-foundations-and-system-states/DESIGN.md 6c and the screen
 * list): the sign-up hook refused this place, and the person has just typed their code. The existing StateScreen, warm
 * and never an outage or a generic sign-in error: no Try again, no drawing of a map or flag, one line and a quiet reason,
 * with Terms and Get in touch as the two quiet actions (design says Contact us; the content rule forbids "us" in authCopy, so PROPOSED: FP6-3). Nothing is stored and nothing is asked about where the person is.
 * The words are PROPOSED (`authCopy.region`, system.region.*; counsel reads them). Cannot be checked on a device here.
 */
import { brand } from '@scribe/brand';
import * as WebBrowser from 'expo-web-browser';
import { Linking, View } from 'react-native';
import { useRef } from 'react';
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';
import { fill } from '@/lib/copy';
import { useArrival } from '@/lib/first-run/use-arrival';
import { mailTarget, openHelpTarget } from '@/components/settings/help-links.logic';

export function RegionRefusedScreen() {
  const t = authCopy.region;
  const title = fill(t.title, { app: brand.name });
  const block = useRef<View>(null);
  useArrival(block, title, 'regionRefused');
  return (
    <View ref={block} collapsable={false} style={{ flex: 1 }}>
      <StateScreen
        kind="error"
        title={title}
        body={t.body}
        quiet={[
          { label: t.terms, // A page that will not open changes nothing on this screen (the same rule as the Welcome's links): deliberate, not silent.
          onPress: () => void WebBrowser.openBrowserAsync(brand.web.terms).catch(() => undefined), testID: 'region.terms' },
          { label: t.contact, onPress: () => void openHelpTarget(mailTarget(), Linking), testID: 'region.contact' },
        ]}
      />
    </View>
  );
}
