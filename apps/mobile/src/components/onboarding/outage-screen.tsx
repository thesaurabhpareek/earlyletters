/**
 * The outage and offline screen (NX-36 S3; NX-31 R18, R19): sign-in cannot be reached. The existing StateScreen, in its
 * warm error form, never red, and with no technical detail. "Try again" is the primary; the local start is the
 * quiet button under it (22 characters; its long sentence is the note in the body) and shows only where the gate offers
 * it (age Yes, a failure state, the compiled constant on). The screen tries again by itself when the connection returns
 * (use-first-run-route.ts). No motion of its own, no analytics event.
 */
import { CloudSlashIcon } from 'phosphor-react-native/src/icons/CloudSlash';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';
import { copy } from '@/lib/copy';

export function OutageScreen({ variant, localStartOffered, onTryAgain, onLocalStart }: { variant: 'offline' | 'outage'; localStartOffered: boolean; onTryAgain: () => void; onLocalStart: () => void }) {
  const t = authCopy.outage;
  const offline = variant === 'offline';
  const body = offline ? t.offlineBody : t.outageBody;
  return (
    <StateScreen
      kind="error"
      glyph={offline ? WifiSlashIcon : CloudSlashIcon}
      title={offline ? t.offlineTitle : t.outageTitle}
      body={localStartOffered ? `${body} ${t.localStartNote}` : body}
      primary={{ label: copy.common.tryAgainButton, onPress: onTryAgain, testID: 'outage.tryAgain' }}
      quiet={localStartOffered ? [{ label: t.localStart, onPress: onLocalStart, testID: 'outage.localStart' }] : undefined}
    />
  );
}
