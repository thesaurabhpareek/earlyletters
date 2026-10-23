// android: same
/**
 * The email link opened the app (PRD A F5): +native-intent kept the token
 * hash in memory and routed here. Open it once, then consent and the claim
 * screen. An expired or used link offers the code from the same email, or a
 * new email (A-REQ-024).
 *
 * BL-347 (security review H1): a link opens only when this phone asked for
 * the email, and then only through PKCE; never while someone is signed in.
 * Otherwise the screen says so calmly: the code from the same email
 * (F02-U11), or sign out first (F02-U27).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { authCopy } from '@/lib/auth/copy';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { takePendingAuthLink } from '@/lib/auth/pending';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';

export default function VerifyLink() {
  const auth = useAuth();
  const close = useCloseSheet();
  const v = authCopy.verify;
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const started = useRef(false);

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

  return (
    <SheetFrame>
      <SheetTitle>{v.title}</SheetTitle>
      {error ? (
        <View className="gap-3">
          <ErrorLine message={authErrorMessage(error)} />
          {error === 'already_signed_in' ? (
            <QuietButton label={v.close} onPress={close} />
          ) : (
            <>
              <QuietButton label={v.typeCode} onPress={() => router.replace('/sign-in/code')} />
              <QuietButton label={v.newEmail} onPress={() => router.replace('/sign-in/email')} />
            </>
          )}
        </View>
      ) : (
        <Busy label={v.title} />
      )}
    </SheetFrame>
  );
}
