/**
 * Building blocks for the sign-in, consent and invite sheets: one calm frame,
 * provider buttons that follow Apple's and Google's button rules, and an error
 * line that VoiceOver announces (A-NFR-007). Shared by src/app/(auth),
 * src/app/invite and Settings, Account only. Presentational: the logic is
 * session-provider.tsx and the rest of lib/auth (S01).
 *
 * The chapter's one sheet frame (EXPERIENCE_PASS_2026-10 chapter 7, package P8a;
 * P8b and P8c use it unchanged): `bg` paper, 24 pt top padding, 20 pt gutters, the
 * title in `title2` (where VoiceOver focus lands), the body in `body` `textMuted`,
 * one filled primary at the foot (56 pt), quiet buttons as `accent` text (44 pt).
 * At accessibility sizes the foot scrolls with the content instead of being pinned,
 * so nothing is clipped (as Review's footer, lib/review-layout.logic.ts).
 * The privacy line and every error line are trust copy, so they sit at `subhead`,
 * never below it (P1's floor, the P4 critics' A10). An error is a line with
 * WarningCircle in `caution` on its own chip: words and an icon, never red text
 * alone, never a shake; it fades in over `swapMs` and is announced politely.
 * No lamp in a sheet (5.2). The content adds no entrance (MOTION 5i).
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useNavigation } from 'expo-router';
import { AppleLogoIcon } from 'phosphor-react-native/src/icons/AppleLogo';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { FingerprintIcon } from 'phosphor-react-native/src/icons/Fingerprint';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View, type Text as RNText } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { familyCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { BackButton, ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { announce, useFocusOnMount, useIsAccessibilitySize, useScheme, useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { authCopy } from './copy';
import { useAuth } from './session-provider';

const tryAgainLabel = copy.common.tryAgainButton;

/** The frame's measures (EXPERIENCE_PASS chapter 7, "One sheet frame"). */
export const SHEET = {
  top: tokens.space[6],
  gutter: tokens.space[5],
  gap: tokens.space[5],
  providerGap: tokens.space[3],
  button: tokens.target.primary,
} as const;

/** An error or a step fades in, opacity only (also the Reduce Motion form: nothing travels). */
const LINE_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export const useColors = () => useTheme().c;

/** Closes the whole sheet (the modal group), not just the current step. */
export function useCloseSheet(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [navigation]);
}

/**
 * The frame of a sign-in or invite sheet. `closeLabel` adds the modal idiom's Close, top right
 * (lib/navigation.logic.ts), above the scroll and the keyboard: the code step puts its "Not now" there so it
 * stays in reach with the number pad up (P8a lens A3). The first step, whose "Not now" is one of its
 * decisions, leaves it out.
 * `onBack` adds Back, top left, for a step pushed inside the sheet (Continue with email).
 */
export function SheetFrame({
  children,
  footer,
  closeLabel,
  closeDisabled,
  onBack,
}: {
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  closeDisabled?: boolean;
  onBack?: () => void;
}) {
  const close = useCloseSheet();
  // At accessibility sizes a pinned foot of 56 + 44 pt buttons would cover the words above it.
  const inlineFooter = useIsAccessibilitySize();
  const foot = footer ? (
    <View style={{ gap: tokens.space[2], paddingHorizontal: inlineFooter ? 0 : SHEET.gutter, paddingTop: tokens.space[2], paddingBottom: tokens.space[4] }}>{footer}</View>
  ) : null;
  const header = closeLabel || onBack;
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {closeLabel ? (
        <ModalHeader onClose={close} closeLabel={closeLabel} closeDisabled={closeDisabled} leading={onBack ? <BackButton onPress={onBack} /> : undefined} className="pt-3" />
      ) : onBack ? (
        <View className="min-h-12 flex-row items-center px-5 pt-3">
          <BackButton onPress={onBack} />
        </View>
      ) : null}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerStyle={{ gap: SHEET.gap, paddingHorizontal: SHEET.gutter, paddingTop: header ? tokens.space[4] : SHEET.top, paddingBottom: tokens.space[6] }}
          keyboardShouldPersistTaps="handled">
          {children}
          {inlineFooter ? foot : null}
        </ScrollView>
        {inlineFooter ? null : foot}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** The sheet's title: `title2`, a heading, and where VoiceOver focus lands when the step appears (V-06). */
export function SheetTitle({ children }: { children: string }) {
  const ref = useRef<RNText>(null);
  useFocusOnMount(ref, true, children);
  return (
    <Text ref={ref} variant="title2" asHeading>
      {children}
    </Text>
  );
}

export function SheetBody({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <Text variant="body" tone={muted ? 'muted' : 'default'}>
      {children}
    </Text>
  );
}

/**
 * Icon and words, never colour alone (DESIGN_LANGUAGE 2); announced politely when it appears; no shake, no haptic.
 * The warning mark sits on its own `secondary` chip with the words, so it never touches lit paper (D-110: the Family
 * tab is a lit room and shows this line too; test/lamp.test.ts holds the rule).
 */
export function ErrorLine({ message }: { message: string | null }) {
  const c = useColors();
  useEffect(() => {
    if (message) announce(message);
  }, [message]);
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={LINE_IN}
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      className="flex-row items-start gap-2 rounded-2xl bg-secondary px-4 py-3">
      <WarningCircleIcon size={20} color={c.caution} style={{ marginTop: 1 }} />
      <Text variant="subhead" className="flex-1">
        {message}
      </Text>
    </Animated.View>
  );
}

/** A small spinner and its line, for a step with no button of its own to hold the busy state. */
export function Busy({ label }: { label: string }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel={label} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }} className="flex-row items-center gap-3 py-2">
      <ActivityIndicator color={c.accent} />
      <Text variant="subhead" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/** The registered privacy line (in-app-disclosures.md 3a), word for word, with LockSimple 16 pt. */
export function PrivacyLine({ text }: { text: string }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel={text} className="flex-row items-start gap-2">
      <LockSimpleIcon size={16} color={c.textMuted} style={{ marginTop: 3 }} />
      <Text variant="subhead" tone="muted" className="shrink">
        {text}
      </Text>
    </View>
  );
}

/** Apple's own button (ASAuthorizationAppleIDButton): approved artwork, localized, accessible (HIG). */
export function AppleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const dark = useScheme() === 'dark';
  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.5 : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={SHEET.button / 2}
        style={{ height: SHEET.button, width: '100%' }}
        onPress={() => {
          haptic('tap');
          onPress();
        }}
      />
    </View>
  );
}

/** Google's standard "G" mark, as its branding guidelines require for a custom button. */
function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

/**
 * The mark of the way someone signed in, for Account's header (S56): Apple's logo, Google's G, or
 * EnvelopeSimple. Decorative (the words beside it say the same), so it is hidden from VoiceOver.
 */
export function ProviderMark({ provider, size = 28 }: { provider: 'apple' | 'google' | 'email' | 'other'; size?: number }) {
  const c = useColors();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {provider === 'google' ? (
        <GoogleMark size={size} />
      ) : provider === 'apple' ? (
        <AppleLogoIcon size={size} color={c.text} weight="fill" />
      ) : (
        <EnvelopeSimpleIcon size={size} color={c.text} />
      )}
    </View>
  );
}

type ProviderKind = 'google' | 'email' | 'passkey';

/**
 * Same height and shape as the Apple button, so no option looks smaller (A-REQ-016): 56 pt, bordered.
 * Busy: the tapped button keeps its size and shows a small spinner with the busy line inside it. Button's own
 * `loading` draws the spinner and says busy to VoiceOver (accessibilityState.busy); the busy one is not "dimmed".
 */
export function ProviderButton({ kind, label, onPress, disabled, busy, busyLabel }: { kind: ProviderKind; label: string; onPress: () => void; disabled?: boolean; busy?: boolean; busyLabel?: string }) {
  const c = useColors();
  const icon = busy ? null : kind === 'google' ? (
    <GoogleMark />
  ) : kind === 'email' ? (
    <EnvelopeSimpleIcon size={20} color={c.text} />
  ) : (
    <FingerprintIcon size={20} color={c.text} />
  );
  const shown = busy && busyLabel ? busyLabel : label;
  return (
    <Button
      variant="outline"
      size="lg"
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      disabled={busy ? false : disabled}
      loading={busy}
      accessibilityLabel={shown}
      className="bg-card"
      style={{ minHeight: SHEET.button }}>
      {icon}
      {/* Waiting while another way runs: the outline's own disabled words (textMuted, AA). The busy one keeps ink. */}
      <Text variant="label" className={busy ? 'text-foreground' : undefined}>
        {shown}
      </Text>
    </Button>
  );
}

/** A quiet text button for secondary paths ("Not now", "Use a different email"): `accent` words, 44 pt. */
export function QuietButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Button variant="quiet" size="sm" label={label} onPress={onPress} disabled={disabled} />;
}

/** An inline link inside running text; opens the in-app browser. */
export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text onPress={onPress} accessibilityRole="link" variant="body" tone="accent" className="underline">
      {label}
    </Text>
  );
}

/**
 * Shows `children` only when the account can use server features (signed in,
 * consent complete, sync on). Otherwise the one next step: sign in, finish
 * the consent sheets, turn sync back on, or retry when offline.
 *
 * The gate says why in the sheet's own words, as a sentence about what the person was doing (P8a critics S4):
 * "Finish setting up your account to invite someone." in the invite sheet, "Finish setting up your account
 * first." when joining or leaving. Account's row value ("Not set up yet") stays on Account. After a decline the
 * gate shows nothing above "Agree and sync": counsel's decline line would read as a question about a choice
 * already made, and the step it opens shows every registered line.
 */
export function AccountGate({
  children,
  trigger,
  signInBody,
}: {
  children: ReactNode;
  trigger: 'invite' | 'invite_create';
  signInBody: string;
}) {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const s = auth.state;
  const g = authCopy.account;

  if (auth.canSync) return <>{children}</>;
  if (!auth.configured) return <ErrorLine message={authCopy.sheet.notConfigured} />;

  if (s.status === 'signedOut' || s.status === 'signingIn' || s.status === 'awaitingCode' || s.status === 'restoring') {
    return (
      <View className="gap-4">
        <SheetBody muted>{signInBody}</SheetBody>
        <Button size="lg" fullWidth label={g.signIn} onPress={() => router.push({ pathname: '/sign-in', params: { trigger } })} />
      </View>
    );
  }

  if (s.status === 'checkingConsent' || s.status === 'signingOut') return <Busy label={authCopy.consent.settingUp} />;

  // Consent still missing, or (BL-347) the claim screen was never answered: one way back to it.
  const claiming = s.status === 'ready' && s.sync === 'on' && auth.claimPending;
  if (s.status === 'needsConsent' || claiming) {
    const reason = claiming ? authCopy.claim.waiting : trigger === 'invite_create' ? familyCopy.card.finishSetup : familyCopy.errors.consent_needed;
    return (
      <View className="gap-4">
        <SheetBody muted>{reason}</SheetBody>
        <Button size="lg" fullWidth label={g.finishSetup} onPress={() => router.push('/sign-in/consent')} />
      </View>
    );
  }

  // ready, with sync off (declined) or unknown (offline at launch)
  const offline = s.sync === 'unknown';
  const sc = copy.sensitiveConsent;
  if (!offline) {
    // Declined earlier ("Keep on this phone"): "Agree and sync" opens the sensitive-data step with its words
    // (S55, LEGAL-REQ-006), where the answer is recorded; consent is never given here in one tap. Nothing above it.
    return (
      <View className="gap-4">
        <Button size="lg" fullWidth label={sc.agreeButton} onPress={() => router.push({ pathname: '/sign-in/consent', params: { step: 'sensitive' } })} />
      </View>
    );
  }
  // Signed in, and the gate could not be read because the phone launched without a connection: say that. Not
  // errors.network, which ends "Sign in once you are back online" and so tells a signed-in person to sign in (BL-488).
  return (
    <View className="gap-4">
      <SheetBody muted>{g.gateOffline}</SheetBody>
      <Button
        size="lg"
        fullWidth
        loading={busy}
        label={tryAgainLabel}
        onPress={async () => {
          setBusy(true);
          await auth.refreshGate();
          setBusy(false);
        }}
      />
    </View>
  );
}
