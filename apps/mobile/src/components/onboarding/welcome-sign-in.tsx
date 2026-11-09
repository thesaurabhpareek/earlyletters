/**
 * The account-first Welcome (NX-36 S2; NX-31 R2, R17): the first screen of a build with server features on, after the
 * age question. One screen, two doors of equal weight: Apple's own "Sign in with Apple" and "Sign in with email", the
 * same 56 pt height. A returning parent is folded into them: she or he signs in with the same two
 * buttons. No password, name or phone field. The registered agreement line sits directly above the buttons. Errors
 * that are about this attempt stay inline under the buttons; a connection or service failure goes to the outage
 * screen instead (lib/first-run/gate.logic.ts).
 *
 * Calls the existing sign-in functions (useAuth: signInWithApple; the email door opens the existing /sign-in/email),
 * then the existing consent sheet. Nothing is logged: no credential, no address. No analytics event.
 * Look: the as-built lamp (scene "welcome", persistKey "firstRun") and the stacked lockup, as the Welcome has them.
 * Motion: none added. The lockup fades in as it always did; the error line fades with the sheet's own LINE_IN.
 * Accessibility: reading order is the lockup (image), the promise line, the agreement line, Apple, email, then any
 * error (live region). Targets are 56 pt. The content scrolls, so nothing clips at AX5 (cannot be device-checked here).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { WelcomeLockup } from '@/components/onboarding/welcome-lockup';
import { WELCOME_LOCKUP } from '@/components/onboarding/welcome-lockup.logic';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { appleSignInAvailable } from '@/lib/auth/apple';
import { authCopy } from '@/lib/auth/copy';
import type { AuthMethod } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { setSignInTrigger } from '@/lib/auth/pending';
import { useAuth, type Outcome } from '@/lib/auth/session-provider';
import { AppleButton, Busy, ErrorLine, ProviderButton, SHEET } from '@/lib/auth/ui';
import { copy } from '@/lib/copy';
import { inlineErrorKind } from '@/lib/first-run/welcome.logic';

export function WelcomeSignIn() {
  const auth = useAuth();
  const o = copy.onboarding.welcome;
  const w = authCopy.welcome;
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  // Set before the first await: a second tap in the same frame starts no second sign-in.
  const inFlight = useRef(false);

  // The existing consent sheet reads this to know how sign-in began; this door is the returning-or-new one.
  useEffect(() => setSignInTrigger('sign_in'), []);
  useEffect(() => {
    void appleSignInAvailable().then(setApple);
  }, []);

  const run = async (method: AuthMethod, go: () => Promise<Outcome>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(method);
    let r: Outcome;
    try {
      r = await go();
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
    // Account setup (terms, age, sensitive data) is the existing consent sheet, then it closes over the next step.
    if (r.ok) router.push('/sign-in/consent');
  };

  const kind = inlineErrorKind(auth.state);
  const message = authErrorMessage(kind);
  const blocked = busy !== null || auth.state.status === 'signingOut';

  return (
    <SafeAreaView className="flex-1 bg-background" testID="welcome.signIn">
      <Lamp scene="welcome" persistKey="firstRun" />
      <ScrollView contentContainerClassName="flex-grow px-6 pb-6" showsVerticalScrollIndicator={false}>
        <View className="flex-1 items-center">
          <WelcomeLockup label={o.title} style={{ marginTop: WELCOME_LOCKUP.top }} />
          <View style={{ marginTop: 32 }}>
            <Text variant="hero" asHeading={1} className="text-center">
              {o.subtitle}
            </Text>
          </View>
        </View>
        <View style={{ gap: SHEET.providerGap, marginTop: tokens.space[6] }}>
          {/* The registered agreement line, word for word, directly above the two buttons. */}
          <Text variant="subhead" tone="muted" className="text-center" testID="welcome.agreement">
            {authCopy.consent.terms.agreeLine}
          </Text>
          {apple ? <AppleButton signIn disabled={blocked} onPress={() => void run('apple', auth.signInWithApple)} /> : null}
          <ProviderButton kind="email" label={w.email} disabled={blocked} onPress={() => router.push('/sign-in/email')} />
          {busy === 'apple' ? <Busy label={authCopy.sheet.busy} /> : null}
          <ErrorLine message={message} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
