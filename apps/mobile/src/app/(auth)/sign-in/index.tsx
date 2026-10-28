// android: Google first, then Apple (OAuth), then email (PRD A F4); not built for v1.0
/**
 * The sign-in sheet (PRD A F3, F4; BRIEF decision 4; EXPERIENCE_PASS S52). Calm, three ways in:
 * Apple first (App Review 4.8 and Apple's guidelines), then Google, then
 * "Continue with email"; a passkey link only when this build enables passkeys.
 * One title, one body sentence, the providers, the registered privacy line and
 * "Not now", which always closes and changes nothing on this phone (the app is local-first).
 *
 * Opened with `/sign-in?trigger=first_letter|invite|invite_create|sign_in|settings`.
 * Terms, the age step and sensitive-data consent come after sign-in, on
 * /sign-in/consent (my_sync_gate decides which).
 *
 * Visual (S52): a sheet, no illustration, no lamp. With a book on this phone (first_letter, settings,
 * invite_create) the small closed cover sits at the right of the title row: the sheet is about that
 * book. It is decorative (the title and body say the same), so it is hidden from VoiceOver, and it
 * steps aside at accessibility sizes so the words keep the width.
 * Motion: no entrance. A provider tap puts that button in its busy state and disables the others;
 * success cross-fades to account setup in place, which closes the sheet when nothing is missing.
 * No haptic for an account (MOTION 6): only the provider buttons' own `tap`.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BookCover } from '@/components/book/book-cover';
import { useChildren } from '@/components/child/use-children';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { noteAskShown } from '@/lib/analytics/ask';
import { track } from '@/lib/analytics/track';
import { appleSignInAvailable } from '@/lib/auth/apple';
import { authCopy } from '@/lib/auth/copy';
import { googleSignInAvailable } from '@/lib/auth/google';
import type { AuthErrorKind, AuthMethod } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { passkeysAvailable } from '@/lib/auth/passkey';
import { asSignInTrigger, setSignInTrigger, type SignInTrigger } from '@/lib/auth/pending';
import { useAuth, type Outcome } from '@/lib/auth/session-provider';
import { AppleButton, Busy, ErrorLine, PrivacyLine, ProviderButton, QuietButton, SHEET, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';

/** The sheet is about the book already on this phone for these entry points (S52 Visual). */
const ABOUT_THIS_BOOK: readonly SignInTrigger[] = ['first_letter', 'settings', 'invite_create'];

export default function SignInSheet() {
  const auth = useAuth();
  const close = useCloseSheet();
  const params = useLocalSearchParams<{ trigger?: string }>();
  const trigger = asSignInTrigger(params.trigger);
  const { active } = useChildren();
  const ax = useIsAccessibilitySize();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const s = authCopy.sheet;
  const child = active?.name ?? authCopy.consent.childFallback;
  const cover = active && ABOUT_THIS_BOOK.includes(trigger) && !ax ? active.name : null;

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
  useEffect(() => {
    if (signedInAtOpen) return;
    track('auth_sheet_shown', { trigger });
    // Keep the book after the first letter is this session's one ask (PRD-REQ-001).
    if (trigger === 'first_letter') noteAskShown();
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <PrivacyLine text={s.privacy} />
          <QuietButton
            label={s.later}
            onPress={() => {
              track('auth_deferred', { trigger });
              close();
            }}
            disabled={busy !== null}
          />
        </>
      }>
      <View className="flex-row items-start" style={{ gap: SHEET.gap }}>
        <View className="flex-1" style={{ gap: SHEET.providerGap }}>
          <SheetTitle>{fill(s.titles[trigger], { child })}</SheetTitle>
          <SheetBody muted>{fill(s.bodies[trigger], { child })}</SheetBody>
        </View>
        {cover ? <BookCover name={cover} size="sm" animate={false} /> : null}
      </View>

      {!auth.configured ? (
        // The kill path: no buttons, only the line; "Not now" still closes.
        <ErrorLine message={s.notConfigured} />
      ) : (
        <View style={{ gap: SHEET.providerGap }}>
          {apple && <AppleButton disabled={blocked} onPress={() => void run('apple', auth.signInWithApple)} />}
          {google && (
            <ProviderButton kind="google" label={s.google} busy={busy === 'google'} busyLabel={s.busy} disabled={blocked} onPress={() => void run('google', auth.signInWithGoogle)} />
          )}
          <ProviderButton kind="email" label={s.email} disabled={blocked} onPress={() => router.push('/sign-in/email')} />
          {passkey && <QuietButton label={s.passkey} disabled={blocked} onPress={() => void run('passkey', auth.signInWithPasskey)} />}
          {/* Apple's own button and a passkey cannot hold a spinner: the busy line sits under the ways in. */}
          {busy === 'apple' || busy === 'passkey' ? <Busy label={s.busy} /> : null}
          {auth.lastMethod && !busy ? (
            <Text variant="footnote" tone="muted" className="text-center">
              {s.lastMethod[auth.lastMethod]}
            </Text>
          ) : null}
          <ErrorLine message={message} />
        </View>
      )}
    </SheetFrame>
  );
}
