// android: same
/**
 * The quiet identity line under the child step's date field, and its one quiet button (account-first slice 4a; exec
 * council decision, 9 Nov 2026, A). It exists so a person who picked the wrong sign-in method (a different
 * Apple Account or email is a different user, which the server reads as new) can notice and start again. Plain footnote
 * text with the masked address, read aloud as "a, hidden, at example.com"; the button signs out and returns to the Welcome.
 * Nothing is deleted: no book exists yet. It sits after the fields, off the heading and the first focus stop.
 */
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { signedInLine } from '@/lib/first-run/account-books.logic';
import { authCopy } from '@/lib/auth/copy';
import { copy } from '@/lib/copy';

export function SignedInNote({ maskedEmail, provider, onUseAnother, busy = false }: { maskedEmail: string | null; provider: string | null; onUseAnother: () => void; busy?: boolean }) {
  const c = copy.onboarding.child;
  const line = signedInLine({ maskedEmail, provider }, { signedInAs: c.signedInAs, signedInAsLabel: c.signedInAsLabel, spokenAddress: c.spokenAddress, spokenAddressNoFirst: c.spokenAddressNoFirst, apple: authCopy.account.signedInWith.apple });
  return (
    <View className="gap-1" testID="onboarding.signedIn">
      {line ? (
        <Text variant="footnote" tone="muted" accessibilityLabel={line.label}>
          {line.text}
        </Text>
      ) : null}
      <Button variant="quiet" size="sm" label={c.useAnother} accessibilityHint={c.useAnotherHint} className="-ml-4 self-start" loading={busy} onPress={onUseAnother} testID="onboarding.useAnother" />
    </View>
  );
}
