/**
 * Building blocks for the sign-in, consent and invite sheets: one calm frame,
 * provider buttons that follow Apple's and Google's button rules, and an error
 * line that VoiceOver announces (A-NFR-007). Shared by src/app/(auth) and
 * src/app/invite only.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useNavigation } from 'expo-router';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { FingerprintIcon } from 'phosphor-react-native/src/icons/Fingerprint';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { authCopy } from './copy';
import { authErrorMessage } from './messages';
import { useAuth } from './session-provider';
import { useTheme, useScheme } from '@/lib/a11y';

const tryAgainLabel = copy.common.tryAgainButton;

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
 * (lib/navigation.logic.ts); steps that have their own decision button ("Not now") leave it out.
 */
export function SheetFrame({ children, footer, closeLabel, closeDisabled }: { children: ReactNode; footer?: ReactNode; closeLabel?: string; closeDisabled?: boolean }) {
  const close = useCloseSheet();
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {closeLabel ? <ModalHeader onClose={close} closeLabel={closeLabel} closeDisabled={closeDisabled} className="pt-3" /> : null}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName={cn('gap-5 px-6 pb-8', closeLabel ? 'pt-4' : 'pt-8')} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View className="gap-3 px-6 pb-4">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SheetTitle({ children }: { children: string }) {
  return (
    <Text role="heading" maxFontSizeMultiplier={1.6} className="font-serif text-3xl leading-10 text-foreground">
      {children}
    </Text>
  );
}

export function SheetBody({ children, muted }: { children: string; muted?: boolean }) {
  return <Text className={cn('text-lg leading-7', muted ? 'text-muted-foreground' : 'text-foreground')}>{children}</Text>;
}

/** Icon and words, never color alone (DESIGN_LANGUAGE 2); announced when it appears. */
export function ErrorLine({ message }: { message: string | null }) {
  const c = useColors();
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  if (!message) return null;
  return (
    <View accessible accessibilityLiveRegion="polite" className="flex-row items-start gap-2 rounded-2xl bg-secondary px-4 py-3">
      <WarningCircleIcon size={20} color={c.caution} />
      <Text className="flex-1 text-base leading-6 text-foreground">{message}</Text>
    </View>
  );
}

export function Busy({ label }: { label: string }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel={label} className="flex-row items-center gap-3 py-2">
      <ActivityIndicator color={c.accent} />
      <Text className="text-base text-muted-foreground">{label}</Text>
    </View>
  );
}

const BUTTON_HEIGHT = 52;

/** Apple's own button (ASAuthorizationAppleIDButton): approved artwork, localized, accessible (HIG). */
export function AppleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const dark = useScheme() === 'dark';
  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.5 : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={BUTTON_HEIGHT / 2}
        style={{ height: BUTTON_HEIGHT, width: '100%' }}
        onPress={() => {
          haptic('tap');
          onPress();
        }}
      />
    </View>
  );
}

/** Google's standard "G" mark, as its branding guidelines require for a custom button. */
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

type ProviderKind = 'google' | 'email' | 'passkey';

/** Same height and shape as the Apple button, so no option looks smaller (A-REQ-016). */
export function ProviderButton({ kind, label, onPress, disabled }: { kind: ProviderKind; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useColors();
  const icon =
    kind === 'google' ? <GoogleMark /> : kind === 'email' ? <EnvelopeSimpleIcon size={20} color={c.text} /> : <FingerprintIcon size={20} color={c.text} />;
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ minHeight: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, opacity: disabled ? 0.5 : 1 }}
      className="flex-row items-center justify-center gap-3 border border-border bg-card px-5 active:bg-secondary">
      {icon}
      <Text maxFontSizeMultiplier={1.6} className="text-[17px] font-semibold text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

/** A quiet text button for secondary paths ("Not now", "Use a different email"). */
export function QuietButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={8}
      className="min-h-11 items-center justify-center px-2">
      <Text className={cn('text-base font-medium', disabled ? 'text-muted-foreground' : 'text-primary')}>{label}</Text>
    </Pressable>
  );
}

/** An inline link inside running text; opens the in-app browser. */
export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text onPress={onPress} accessibilityRole="link" className="text-base font-medium text-primary underline">
      {label}
    </Text>
  );
}

/**
 * Shows `children` only when the account can use server features (signed in,
 * consent complete, sync on). Otherwise the one next step: sign in, finish
 * the consent sheets, turn sync back on, or retry when offline.
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
  const [error, setError] = useState<string | null>(null);
  const s = auth.state;
  const g = authCopy.account;

  if (auth.canSync) return <>{children}</>;
  if (!auth.configured) return <ErrorLine message={authCopy.sheet.notConfigured} />;

  if (s.status === 'signedOut' || s.status === 'signingIn' || s.status === 'awaitingCode' || s.status === 'restoring') {
    return (
      <View className="gap-4">
        <SheetBody muted>{signInBody}</SheetBody>
        <Button size="lg" onPress={() => router.push({ pathname: '/sign-in', params: { trigger } })}>
          <Text>{g.signIn}</Text>
        </Button>
      </View>
    );
  }

  if (s.status === 'checkingConsent' || s.status === 'signingOut') return <Busy label={authCopy.consent.settingUp} />;

  if (s.status === 'needsConsent') {
    return (
      <View className="gap-4">
        <SheetBody muted>{g.sync.waiting}</SheetBody>
        <Button size="lg" onPress={() => router.push('/sign-in/consent')}>
          <Text>{g.finishSetup}</Text>
        </Button>
      </View>
    );
  }

  // ready, with sync off (declined) or unknown (offline at launch)
  const offline = s.sync === 'unknown';
  const sc = copy.sensitiveConsent;
  return (
    <View className="gap-4">
      <SheetBody muted>{offline ? authCopy.errors.network : sc.declineHelp}</SheetBody>
      <ErrorLine message={error} />
      {busy ? (
        <Busy label={authCopy.consent.settingUp} />
      ) : (
        <Button
          size="lg"
          onPress={async () => {
            setBusy(true);
            setError(null);
            if (offline) await auth.refreshGate();
            else {
              const r = await auth.turnOnSync();
              if (!r.ok) setError(authErrorMessage(r.error));
            }
            setBusy(false);
          }}>
          <Text>{offline ? tryAgainLabel : sc.agreeButton}</Text>
        </Button>
      )}
    </View>
  );
}
