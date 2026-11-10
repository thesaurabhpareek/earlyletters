/**
 * The account-first Welcome (NX-36 S2; NX-31 R2, R8, R17): the first screen of a build with server features on, after
 * the age question. One screen, two doors of equal weight: Apple's own "Sign in with Apple" and "Sign in with email"
 * (solid accent), both 56 pt. A returning parent signs in with the same two buttons, so there is no third door. No
 * password, name or phone field. Top to bottom: lockup, descriptor (heading 1), body, one benefit line, then the footer:
 * the agreement line with its two links directly above the buttons, and "I was invited" where the build shows it.
 * At default sizes the footer is pinned; at accessibility sizes it sits in the scroll after the benefit line.
 *
 * Calls the existing sign-in functions (useAuth: signInWithApple; the email door opens the existing /sign-in/email),
 * then the existing consent sheet. Nothing is logged: no credential, no address. No analytics event, no new motion.
 * The as-built lamp (scene "welcome", persistKey "firstRun") and lockup. A connection or service failure goes to the
 * outage screen through the gate (lib/first-run/gate.logic.ts), not here.
 * Accessibility: heading takes focus on mount; order is lockup, heading, body, benefit, agreement and its links, Apple,
 * email, "I was invited"; errors are a live region. Cannot be checked on a device from here.
 */
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, type Text as RNText } from 'react-native';
import { brand } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';
import { WelcomeLockup } from '@/components/onboarding/welcome-lockup';
import { WELCOME_LOCKUP } from '@/components/onboarding/welcome-lockup.logic';
import { Button } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { useFocusOnMount, useIsAccessibilitySize } from '@/lib/a11y';
import { appleSignInAvailable } from '@/lib/auth/apple';
import { authCopy } from '@/lib/auth/copy';
import type { AuthMethod } from '@/lib/auth/machine.logic';
import { setSignInTrigger } from '@/lib/auth/pending';
import { useAuth, type Outcome } from '@/lib/auth/session-provider';
import { AppleButton, Busy, ErrorLine, SHEET } from '@/lib/auth/ui';
import { capabilities } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { inviteHref, visibleCoParentDoors } from '@/lib/family/entry.logic';
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { inlineErrorKind, invitedDoorShown, welcomeErrorMessage } from '@/lib/first-run/welcome.logic';

const open = (url: string) => void WebBrowser.openBrowserAsync(url);

/** "By continuing you agree to the Terms of Service and Privacy Policy." with the two document names as links. */
function AgreeLine() {
  const line = authCopy.sheet.agreeLine;
  const { termsLink, privacyLink } = authCopy.consent.terms;
  const t = line.indexOf(termsLink);
  const p = line.indexOf(privacyLink);
  const link = (label: string, url: string) => (
    <Text key={label} onPress={() => open(url)} accessibilityRole="link" variant="footnote" tone="accent" className="underline">
      {label}
    </Text>
  );
  const parts: ReactNode[] =
    t >= 0 && p > t
      ? [line.slice(0, t), link(termsLink, brand.web.terms), line.slice(t + termsLink.length, p), link(privacyLink, brand.web.privacy), line.slice(p + privacyLink.length)]
      : [line];
  return (
    <Text variant="footnote" tone="muted" className="text-center" testID="welcome.agreement">
      {parts}
    </Text>
  );
}

export function WelcomeSignIn() {
  const auth = useAuth();
  const ax = useIsAccessibilitySize();
  const o = copy.onboarding.welcome;
  const heading = useRef<RNText>(null);
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  // Set before the first await: a second tap in the same frame starts no second sign-in.
  const inFlight = useRef(false);
  const invited = invitedDoorShown({ alpha: PLUS_ALPHA, coParent: visibleCoParentDoors(capabilities.coParent, PLUS_ALPHA).joinButton });

  // The existing consent sheet reads this to know how sign-in began.
  useEffect(() => setSignInTrigger('sign_in'), []);
  useEffect(() => {
    void appleSignInAvailable().then(setApple);
  }, []);
  useFocusOnMount(heading);

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

  const message = welcomeErrorMessage(inlineErrorKind(auth.state));
  const blocked = busy !== null || auth.state.status === 'signingOut';

  const footer = (
    <View style={{ gap: SHEET.providerGap }}>
      <AgreeLine />
      {apple ? <AppleButton signIn disabled={blocked} onPress={() => void run('apple', auth.signInWithApple)} /> : null}
      <Button size="lg" fullWidth label={authCopy.sheet.email} disabled={blocked} onPress={() => router.push('/sign-in/email')} testID="welcome.email" />
      {busy === 'apple' ? <Busy label={authCopy.sheet.busy} /> : null}
      <ErrorLine message={message} />
      {auth.lastMethod && !busy ? (
        <Text variant="footnote" tone="muted" className="text-center">
          {authCopy.sheet.lastMethod[auth.lastMethod]}
        </Text>
      ) : null}
      {invited ? (
        <Button variant="quiet" size="sm" label={o.joinButton} onPress={() => router.push(inviteHref('onboarding_join', capabilities.coParent) as Href)} testID="welcome.invited" />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" testID="welcome.signIn">
      <Lamp scene="welcome" persistKey="firstRun" />
      <ScrollView contentContainerClassName="flex-grow px-5 pb-6" showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <WelcomeLockup label={o.title} style={{ marginTop: WELCOME_LOCKUP.top }} />
          <View style={{ marginTop: 32 }}>
            <Text ref={heading} variant="hero" asHeading={1} className="text-center">
              {o.subtitle}
            </Text>
          </View>
          <View style={{ marginTop: tokens.space[4] }}>
            <Text variant="body" tone="muted" className="text-center">
              {fill(o.body, { child: copy.onboarding.childFallback })}
            </Text>
          </View>
          <View style={{ marginTop: tokens.space[3] }}>
            <Text variant="callout" tone="muted" className="text-center">
              {authCopy.sheet.bodies.sign_in_first}
            </Text>
          </View>
        </View>
        {ax ? <View style={{ marginTop: tokens.space[6] }}>{footer}</View> : null}
      </ScrollView>
      {ax ? null : <View className="px-5 pb-5 pt-2">{footer}</View>}
    </SafeAreaView>
  );
}
