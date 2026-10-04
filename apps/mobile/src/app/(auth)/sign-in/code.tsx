// android: same (no "Open Mail" there)
/**
 * "Check your email" (PRD A F4, A-REQ-018, -025, -027): the address, a code
 * field (one-time-code autofill, paste, auto-submit at full length), Open
 * Mail, "Send a new email" after a minute, "Use a different email".
 *
 * Also the custom-scheme fallback target: the website's "Open the app"
 * button lands here without any secret, and the person types the code from
 * the same email. When the app restarted in between, it asks for the address.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authCopy } from '@/lib/auth/copy';
import { EMAIL_CODE_LENGTH, RESEND_WAIT_MS } from '@/lib/auth/email';
import { looksLikeEmail, normaliseCode } from '@/lib/auth/errors.logic';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { getPendingEmail, setPendingEmail } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useColors } from '@/lib/auth/ui';

export default function CodeStep() {
  const auth = useAuth();
  const c = useColors();
  const k = authCopy.code;
  const known = getPendingEmail();
  const [email, setEmail] = useState(known ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const sentAt = auth.state.status === 'awaitingCode' ? auth.state.sentAt : null;
  const [now, setNow] = useState(Date.now());
  const submitted = useRef('');

  // Re-render once the minute has passed so "Send a new email" turns on (no ticking numbers).
  useEffect(() => {
    if (sentAt === null) return;
    const left = sentAt + RESEND_WAIT_MS - Date.now();
    if (left <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), left + 50);
    return () => clearTimeout(t);
  }, [sentAt]);

  const canResend = sentAt === null || now >= sentAt + RESEND_WAIT_MS;
  const address = email.trim();

  const verify = async (value: string) => {
    if (busy || value.length !== EMAIL_CODE_LENGTH || !looksLikeEmail(address)) return;
    submitted.current = value;
    setBusy(true);
    setError(null);
    setNote(null);
    const r = await auth.verifyEmailCode(address, value);
    setBusy(false);
    if (r.ok) {
      setPendingEmail(null);
      router.replace('/sign-in/consent');
    } else if (r.error !== 'cancelled') {
      setError(r.error);
      setCode('');
    }
  };

  const onCode = (v: string) => {
    const digits = normaliseCode(v).slice(0, EMAIL_CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === EMAIL_CODE_LENGTH && digits !== submitted.current) void verify(digits);
  };

  const resend = async () => {
    if (!looksLikeEmail(address)) {
      setError('invalid_email');
      return;
    }
    setBusy(true);
    setError(null);
    const r = await auth.sendEmailLink(address);
    setBusy(false);
    if (r.ok) {
      setPendingEmail(address);
      setNow(Date.now());
      setNote(k.resent);
      submitted.current = '';
    } else if (r.error !== 'cancelled') {
      setError(r.error);
    }
  };

  const message = authErrorMessage(error);

  return (
    <SheetFrame
      footer={
        <QuietButton
          label={k.differentEmail}
          disabled={busy}
          onPress={() => {
            setPendingEmail(null);
            if (router.canGoBack()) router.back();
            else router.replace('/sign-in/email');
          }}
        />
      }>
      <SheetTitle>{k.title}</SheetTitle>
      {known ? (
        <View className="gap-1">
          <SheetBody muted>{k.sentTo}</SheetBody>
          <Text selectable className="text-lg font-semibold text-foreground">
            {known}
          </Text>
          <SheetBody muted>{k.body}</SheetBody>
        </View>
      ) : (
        <View className="gap-2">
          <SheetBody muted>{k.body}</SheetBody>
          <Text className="text-base font-medium text-muted-foreground">{k.emailLabel}</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
            value={email}
            onChangeText={setEmail}
            placeholder={authCopy.email.placeholder}
            placeholderTextColor={c.textMuted}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={k.emailLabel}
          />
        </View>
      )}

      <View className="gap-2">
        <Text className="text-base font-medium text-muted-foreground">{k.label}</Text>
        <TextInput
          className="min-h-16 rounded-2xl border border-border bg-card px-4 text-center text-3xl tracking-[8px] text-foreground"
          value={code}
          onChangeText={onCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={EMAIL_CODE_LENGTH + 4}
          editable={!busy && error !== 'code_paused'}
          accessibilityLabel={k.label}
          autoFocus={!!known}
        />
      </View>

      <ErrorLine message={message} />
      {note && !message ? <Text className="text-base text-muted-foreground">{note}</Text> : null}
      {busy ? <Busy label={authCopy.sheet.busy} /> : null}

      {!busy && code.length === EMAIL_CODE_LENGTH && error ? (
        <Button size="lg" onPress={() => void verify(code)}>
          <Text>{k.verify}</Text>
        </Button>
      ) : null}

      <View className="gap-1">
        {Platform.OS === 'ios' && <QuietButton label={k.openMail} onPress={() => void Linking.openURL('message:').catch(() => {})} />}
        <QuietButton label={k.resend} onPress={() => void resend()} disabled={busy || !canResend} />
        {!canResend && <Text className="text-center text-sm text-muted-foreground">{k.resendWait}</Text>}
      </View>
    </SheetFrame>
  );
}
