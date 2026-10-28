// android: same (no "Open Mail" there)
/**
 * "Check your email" (PRD A F4, A-REQ-018, -025, -027; EXPERIENCE_PASS S54): the address the email
 * went to, a code field (one-time-code AutoFill, paste, submits at full length), Open Mail, "Send a
 * new email" after a minute, "Use a different email", and "Trouble signing in?".
 *
 * Also the custom-scheme fallback target: the website's "Open the app" button lands here without any
 * secret, and the person types the code from the same email. When the app restarted in between, it
 * asks for the address (the address is never stored, PRD A F6.2).
 *
 * Visual (S54): "A link and a code are on their way to {email}." with the address in `text` and the
 * rest in `textMuted`. The code is one field in tabular figures, Mukta SemiBold 28 pt, tracking 6,
 * centred, at title1's size and cap. "Continue" stays at the foot for VoiceOver and Switch Control.
 * "Open Mail" bordered, then the quiet buttons; "Trouble signing in?" opens its help line in place.
 * Motion: a wrong code clears and refocuses the field, and its line fades in (swapMs, ErrorLine);
 * no shake, no red, no haptic.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, TextInput, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { useFontsReady } from '@/components/ui/fonts';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { authCopy } from '@/lib/auth/copy';
import { EMAIL_CODE_LENGTH, RESEND_WAIT_MS } from '@/lib/auth/email';
import { looksLikeEmail, normaliseCode } from '@/lib/auth/errors.logic';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { getPendingEmail, setPendingEmail } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useColors } from '@/lib/auth/ui';
import { copy } from '@/lib/copy';

/** The code is set at title1's size (28 pt), so it takes title1's Dynamic Type cap: six digits stay on one line. */
const CODE_TYPE = { fontSize: tokens.type.title1.fontSize, letterSpacing: 6, maxScale: tokens.type.title1.maxScale } as const;

/** "A link and a code are on their way to {email}.": the address in ink, the rest muted. */
function SentTo({ email }: { email: string }) {
  const [before, after = ''] = authCopy.code.sentToEmail.split('{email}');
  return (
    <Text variant="body" tone="muted">
      {before}
      <Text variant="body" tone="default" selectable>
        {email}
      </Text>
      {after}
    </Text>
  );
}

export default function CodeStep() {
  const auth = useAuth();
  const c = useColors();
  const ready = useFontsReady();
  const k = authCopy.code;
  const known = getPendingEmail();
  const [email, setEmail] = useState(known ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const sentAt = auth.state.status === 'awaitingCode' ? auth.state.sentAt : null;
  const [now, setNow] = useState(Date.now());
  const submitted = useRef('');
  const field = useRef<TextInput>(null);

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
  const paused = error === 'code_paused';

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
      // A wrong code clears and the field takes focus again, ready for the next try.
      setCode('');
      submitted.current = '';
      if (r.error !== 'code_paused') setTimeout(() => field.current?.focus(), 0);
    }
  };

  const onCode = (v: string) => {
    const digits = normaliseCode(v).slice(0, EMAIL_CODE_LENGTH);
    setCode(digits);
    if (error && error !== 'code_paused') setError(null);
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
        <Button
          size="lg"
          fullWidth
          loading={busy}
          label={busy ? authCopy.sheet.busy : k.verify}
          disabled={code.length !== EMAIL_CODE_LENGTH || !looksLikeEmail(address) || paused}
          onPress={() => void verify(code)}
        />
      }>
      <SheetTitle>{k.title}</SheetTitle>
      {known ? (
        <View className="gap-2">
          <SentTo email={known} />
          <SheetBody muted>{k.body}</SheetBody>
        </View>
      ) : (
        <View className="gap-4">
          <SheetBody muted>{k.body}</SheetBody>
          <TextField
            label={k.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={authCopy.email.placeholder}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            inputClassName="min-h-14"
            autoFocus
          />
        </View>
      )}

      <View className="gap-2">
        <Text variant="labelSmall" tone="muted">
          {k.label}
        </Text>
        <TextInput
          ref={field}
          value={code}
          onChangeText={onCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={EMAIL_CODE_LENGTH + 4}
          editable={!busy && !paused}
          accessibilityLabel={k.label}
          autoFocus={!!known}
          maxFontSizeMultiplier={CODE_TYPE.maxScale ?? undefined}
          selectionColor={c.accent}
          cursorColor={c.accent}
          className="bg-card text-center text-foreground"
          style={{
            minHeight: tokens.target.capture,
            borderRadius: tokens.radius.md,
            borderWidth: tokens.stroke.control,
            borderColor: c.controlBorder,
            paddingHorizontal: tokens.space[4],
            fontSize: CODE_TYPE.fontSize,
            letterSpacing: CODE_TYPE.letterSpacing,
            fontVariant: ['tabular-nums'],
            ...(ready ? { fontFamily: tokens.fontFamily.sansSemiBold, fontWeight: 'normal' as const } : { fontWeight: '600' as const }),
          }}
        />
      </View>

      <ErrorLine message={message} />
      {note && !message ? (
        <Text variant="subhead" tone="muted" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}

      <View className="gap-1">
        {Platform.OS === 'ios' && (
          <Button size="lg" fullWidth variant="outline" label={k.openMail} onPress={() => void Linking.openURL('message:').catch(() => {})} />
        )}
        <QuietButton label={k.resend} onPress={() => void resend()} disabled={busy || !canResend} />
        {!canResend && (
          <Text variant="footnote" tone="muted" className="text-center">
            {k.resendWait}
          </Text>
        )}
        <QuietButton
          label={k.differentEmail}
          disabled={busy}
          onPress={() => {
            setPendingEmail(null);
            if (router.canGoBack()) router.back();
            else router.replace('/sign-in/email');
          }}
        />
        <QuietButton label={copy.auth.troubleButton} onPress={() => setHelpOpen((v) => !v)} />
        {helpOpen ? (
          <Text variant="subhead" tone="muted" accessibilityLiveRegion="polite">
            {copy.auth.noEmailHelp}
          </Text>
        ) : null}
      </View>
    </SheetFrame>
  );
}
