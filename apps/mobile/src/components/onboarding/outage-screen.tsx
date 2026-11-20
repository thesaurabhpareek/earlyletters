/**
 * The outage and offline screen (NX-36 S3; NX-31 R18, R19): sign-in cannot be reached. The existing StateScreen, in its
 * warm error form, never red and with no technical detail. "Try again" is the primary; the local start is the quiet
 * button under it (22 characters or fewer) and shows only where the gate offers it (age Yes, a failure state, the
 * compiled constant on). Its note (`outage.startLocalNote`) follows the body only where the button shows: StateScreen has
 * no note slot yet (design-systems). Try again reads the connection (use-first-run-route.ts) and the Welcome comes back
 * when the connection returns or the read finds it there. No motion of its own, no analytics event.
 * Accessibility: on arrival the heading takes focus and the title is announced (iOS needs `announce()`; StateScreen's live
 * region is Android-only), again if the offline variant becomes the outage one. The focus goes to the block that holds
 * the StateScreen, whose first reachable element is its heading; StateScreen has no ref to the heading itself
 * (design-systems follow-up). Cannot be checked on a device from here.
 */
import { CloudSlashIcon } from 'phosphor-react-native/src/icons/CloudSlash';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { useRef } from 'react';
import { View } from 'react-native';
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';
import { useArrival } from '@/lib/first-run/use-arrival';

export function OutageScreen({ variant, localStartOffered, onTryAgain, onLocalStart }: { variant: 'offline' | 'outage'; localStartOffered: boolean; onTryAgain: () => void; onLocalStart: () => void }) {
  const t = authCopy.outage;
  const offline = variant === 'offline';
  const title = offline ? authCopy.offline.title : t.title;
  const body = offline ? authCopy.offline.body : t.body;
  const block = useRef<View>(null);
  useArrival(block, title, variant);
  return (
    <View ref={block} collapsable={false} style={{ flex: 1 }}>
      <StateScreen
        kind="error"
        glyph={offline ? WifiSlashIcon : CloudSlashIcon}
        title={title}
        body={localStartOffered ? `${body} ${t.startLocalNote}` : body}
        primary={{ label: t.retry, onPress: onTryAgain, testID: 'outage.tryAgain' }}
        quiet={localStartOffered ? [{ label: t.startLocal, onPress: onLocalStart, testID: 'outage.localStart' }] : undefined}
      />
    </View>
  );
}
