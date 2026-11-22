import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { authCopy } from './copy';
import type { AuthState } from './machine.logic';
import { useRevocationWaitLine } from './use-revocation-wait-line';

/**
 * BL-1461: why the app has not moved on during the Apple revocation wait. Muted small UI sans, a status for VoiceOver,
 * nothing at all outside the wait or before the delay. Used by the launch screen (OpeningBookScreen) and AccountGate.
 */
export function RevocationWaitLine({ state }: { state: AuthState }) {
  const line = useRevocationWaitLine(state, authCopy.account.signOutRevokedWaiting);
  if (line === null) return null;
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={line} accessibilityLiveRegion="polite" style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 }}>
      <Text variant="footnote" tone="muted" style={{ textAlign: 'center' }}>
        {line}
      </Text>
    </View>
  );
}
