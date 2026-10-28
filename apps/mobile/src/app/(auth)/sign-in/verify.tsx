// android: same
/**
 * The email link opened the app (PRD A F5; EXPERIENCE_PASS S54, "opening the link"): +native-intent
 * kept the token hash in memory and routed here. Open it once, then consent and the claim screen.
 * "Signing you in" with a small spinner while it opens; an expired or used link offers the code from
 * the same email, or a new email (A-REQ-024), as the one filled button the error line points to.
 *
 * BL-347 (security review H1): a link opens only when this phone asked for
 * the email, and then only through PKCE; never while someone is signed in.
 * Otherwise the screen says so calmly under its own heading: the code from
 * the same email (F02-U11), or, when someone is already signed in here, sign
 * out and type the code (F02-U27; sign-out drops this phone's pending request,
 * so the same link never works after it).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { authCopy } from '@/lib/auth/copy';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { takePendingAuthLink } from '@/lib/auth/pending';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, QuietButton, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';

export default function VerifyLink() {
  const auth = useAuth();
  const close = useCloseSheet();
  const c = useColors();
  const v = authCopy.verify;
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const started = useRef(false);
  const refused = error === 'other_phone' || error === 'already_signed_in';

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const link = takePendingAuthLink();
    if (!link) {
      router.replace('/sign-in/code');
      return;
    }
    void auth.verifyEmailLink(link.tokenHash, link.type).then((r) => {
      if (r.ok) router.replace('/sign-in/consent');
      else setError(r.error === 'cancelled' ? 'unknown' : r.error);
    });
    // auth changes identity on every state change; this runs once per opened link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The way forward the error line names comes first, filled: a new email for an expired link, else the code.
  const typeCode = () => router.replace('/sign-in/code');
  const newEmail = () => router.replace('/sign-in/email');
  const footer = !error ? undefined : error === 'already_signed_in' ? (
    <QuietButton label={v.close} onPress={close} />
  ) : error === 'expired' ? (
    <>
      <Button size="lg" fullWidth label={v.newEmail} onPress={newEmail} />
      <QuietButton label={v.typeCode} onPress={typeCode} />
    </>
  ) : (
    <>
      <Button size="lg" fullWidth label={v.typeCode} onPress={typeCode} />
      <QuietButton label={v.newEmail} onPress={newEmail} />
    </>
  );

  return (
    <SheetFrame footer={footer}>
      <SheetTitle>{refused ? v.refusedTitle : v.title}</SheetTitle>
      {error ? (
        <ErrorLine message={authErrorMessage(error)} />
      ) : (
        // The title says it; the spinner is the small busy mark beside nothing else to read.
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="items-start py-2">
          <ActivityIndicator color={c.accent} />
        </View>
      )}
    </SheetFrame>
  );
}
