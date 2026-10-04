// android: same
/**
 * "Continue with email" (PRD A F4): one labelled field with the email
 * keyboard and autofill. Sends one email holding a link and a code
 * (A-REQ-018). The address stays in memory only (PRD A F6.2).
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authCopy } from '@/lib/auth/copy';
import { looksLikeEmail } from '@/lib/auth/errors.logic';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { getPendingEmail, setPendingEmail } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useColors } from '@/lib/auth/ui';

export default function EmailStep() {
  const auth = useAuth();
  const c = useColors();
  const e = authCopy.email;
  const [email, setEmail] = useState(getPendingEmail() ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);

  const send = async () => {
    const value = email.trim();
    if (!looksLikeEmail(value)) {
      setError('invalid_email');
      return;
    }
    setBusy(true);
    setError(null);
    const r = await auth.sendEmailLink(value);
    setBusy(false);
    if (r.ok) {
      setPendingEmail(value);
      router.push('/sign-in/code');
    } else if (r.error !== 'cancelled') {
      setError(r.error);
    }
  };

  return (
    <SheetFrame footer={<QuietButton label={authCopy.sheet.later} onPress={() => router.back()} disabled={busy} />}>
      <SheetTitle>{e.title}</SheetTitle>
      <SheetBody muted>{e.help}</SheetBody>
      <View className="gap-2">
        <Text nativeID="email-label" className="text-base font-medium text-muted-foreground">
          {e.label}
        </Text>
        <TextInput
          className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (error) setError(null);
          }}
          placeholder={e.placeholder}
          placeholderTextColor={c.textMuted}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={() => void send()}
          editable={!busy}
          accessibilityLabel={e.label}
          accessibilityLabelledBy="email-label"
          autoFocus
        />
      </View>
      <ErrorLine message={authErrorMessage(error)} />
      {busy ? (
        <Busy label={e.send} />
      ) : (
        <Button size="lg" onPress={() => void send()} disabled={email.trim().length === 0}>
          <Text>{e.send}</Text>
        </Button>
      )}
    </SheetFrame>
  );
}
