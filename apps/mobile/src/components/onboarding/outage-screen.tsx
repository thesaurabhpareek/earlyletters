/**
 * The outage and offline screen (NX-36 S3; NX-31 R18, R19): sign-in cannot be reached. The existing StateScreen, in its
 * warm error form, never red and with no technical detail. "Try again" is the primary; the local start is the quiet
 * button under it (22 characters or fewer) and shows only where the gate offers it (age Yes, a failure state, the
 * compiled constant on). Its note (`outage.startLocalNote`) is appended to the body: StateScreen has no note slot yet
 * (design-systems). The screen tries again by itself when the connection returns (use-first-run-route.ts) and the
 * Welcome announces "Sign in is back." No motion of its own, no analytics event.
 */
import { CloudSlashIcon } from 'phosphor-react-native/src/icons/CloudSlash';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';

export function OutageScreen({ variant, localStartOffered, onTryAgain, onLocalStart }: { variant: 'offline' | 'outage'; localStartOffered: boolean; onTryAgain: () => void; onLocalStart: () => void }) {
  const t = authCopy.outage;
  const offline = variant === 'offline';
  const body = offline ? authCopy.offline.body : t.body;
  return (
    <StateScreen
      kind="error"
      glyph={offline ? WifiSlashIcon : CloudSlashIcon}
      title={offline ? authCopy.offline.title : t.title}
      body={localStartOffered ? `${body} ${t.startLocalNote}` : body}
      primary={{ label: t.retry, onPress: onTryAgain, testID: 'outage.tryAgain' }}
      quiet={localStartOffered ? [{ label: t.startLocal, onPress: onLocalStart, testID: 'outage.localStart' }] : undefined}
    />
  );
}
