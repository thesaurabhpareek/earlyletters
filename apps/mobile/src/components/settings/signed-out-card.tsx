import { router } from 'expo-router';
import { View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button, Card, Text } from '@/components/ui';
import { authCopy } from '@/lib/auth/copy';
import { copy } from '@/lib/copy';

/**
 * The You tab's top card when there is no session (YOU-TAB-STATES-9nov, sections 3 and 11; NX-36 S14 States B and C).
 * Built from the library's Card, Text and Button; nothing new is drawn.
 *
 * One button, one target: the card is not a button as a whole. Title (heading), body (muted), then Sign in at 48 pt,
 * full width. At AX5 everything wraps and the button label wraps to two lines; no line is truncated (D-027). C adds
 * a second paragraph. It names no co-parent, family or sharing, and it shows no email, plan status or sync status.
 * Sign in opens the sign-in sheet; consent and the claim screen follow, and nothing moves until the person agrees.
 */
export function SignedOutCard({ localStart }: { localStart: boolean }) {
  const h = copy.settingsHome;
  return (
    <Card variant="outlined" testID="settings.signedOutCard">
      <View style={{ gap: tokens.space[3] }}>
        <Text variant="headline" asHeading>
          {authCopy.account.signedOutTitle}
        </Text>
        <Text variant="body" tone="muted">
          {h.signedOut.body}
        </Text>
        {localStart ? (
          <Text variant="body" tone="muted" testID="settings.localStartLine">
            {h.localStart.body}
          </Text>
        ) : null}
        <Button
          variant="primary"
          size="md"
          fullWidth
          label={authCopy.account.signIn}
          onPress={() => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } })}
          testID="settings.signIn"
        />
      </View>
    </Card>
  );
}
