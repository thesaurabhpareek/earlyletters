// android: Google first, then Apple (OAuth), then email (PRD A F4); not built for v1.0
/**
 * The sign-in sheet (PRD A F3, F4; BRIEF decision 4). Calm, three ways in:
 * Apple first (App Review 4.8 and Apple's guidelines), then Google, then
 * "Continue with email"; a passkey link only when this build enables passkeys.
 * One quiet privacy line. "Not now" always works: the app is local-first.
 *
 * Opened with `/sign-in?trigger=first_letter|invite|invite_create|sign_in|settings`.
 * Terms, the age line and sensitive-data consent come after sign-in, on
 * /sign-in/consent (my_sync_gate decides which).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useChildren } from '@/components/child/use-children';
import { Text } from '@/components/ui/text';
import { appleSignInAvailable } from '@/lib/auth/apple';
import { authCopy } from '@/lib/auth/copy';
import { googleSignInAvailable } from '@/lib/auth/google';
import type { AuthErrorKind, AuthMethod } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { passkeysAvailable } from '@/lib/auth/passkey';
import { asSignInTrigger, setSignInTrigger } from '@/lib/auth/pending';
import { useAuth, type Outcome } from '@/lib/auth/session-provider';
import { AppleButton, Busy, ErrorLine, ProviderButton, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';

export default function SignInSheet() {
  const auth = useAuth();
  const close = useCloseSheet();
  const params = useLocalSearchParams<{ trigger?: string }>();
  const trigger = asSignInTrigger(params.trigger);
  const { active } = useChildren();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const s = authCopy.sheet;
  const child = active?.name ?? authCopy.consent.childFallback;

  useEffect(() => setSignInTrigger(trigger), [trigger]);
  useEffect(() => {
    void appleSignInAvailable().then(setApple);
  }, []);

  // Opened while already signed in (a second tap, a stale route): continue to consent, which closes when done.
  // A sign-out in progress ("Try another way") is not "already signed in".
  const signedInAtOpen = useState(['checkingConsent', 'needsConsent', 'ready'].includes(auth.state.status))[0];
  useEffect(() => {
    if (signedInAtOpen) router.replace('/sign-in/consent');
  }, [signedInAtOpen]);

  const run = async (method: AuthMethod, go: () => Promise<Outcome>) => {
    setBusy(method);
    setError(null);
    const r = await go();
    setBusy(null);
    if (r.ok) router.replace('/sign-in/consent');
    else if (r.error !== 'cancelled') setError(r.error);
  };

  const message = authErrorMessage(error);
  // While a previous session is still being closed, wait: a new sign-in must not race the old sign-out.
  const blocked = busy !== null || auth.state.status === 'signingOut';
  const google = googleSignInAvailable();
  const passkey = passkeysAvailable();

  return (
    <SheetFrame
      footer={
        <>
          <Text className="text-center text-sm leading-5 text-muted-foreground">{s.privacy}</Text>
          <QuietButton label={s.later} onPress={close} disabled={busy !== null} />
        </>
      }>
      <SheetTitle>{fill(s.titles[trigger], { child })}</SheetTitle>
      <SheetBody muted>{s.bodies[trigger]}</SheetBody>

      {!auth.configured ? (
        <ErrorLine message={s.notConfigured} />
      ) : (
        <View className="gap-3 pt-2">
          {apple && <AppleButton disabled={blocked} onPress={() => void run('apple', auth.signInWithApple)} />}
          {google && <ProviderButton kind="google" label={s.google} disabled={blocked} onPress={() => void run('google', auth.signInWithGoogle)} />}
          <ProviderButton kind="email" label={s.email} disabled={blocked} onPress={() => router.push('/sign-in/email')} />
          {passkey && <QuietButton label={s.passkey} disabled={blocked} onPress={() => void run('passkey', auth.signInWithPasskey)} />}
          {auth.lastMethod && !busy && <Text className="pt-1 text-center text-sm text-muted-foreground">{s.lastMethod[auth.lastMethod]}</Text>}
          {busy && <Busy label={s.busy} />}
          <ErrorLine message={message} />
        </View>
      )}
    </SheetFrame>
  );
}
