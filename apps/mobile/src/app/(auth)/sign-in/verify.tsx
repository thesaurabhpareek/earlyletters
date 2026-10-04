// android: same
/**
 * The email link opened the app (PRD A F5): +native-intent kept the token
 * hash in memory and routed here. Verify it once, then consent. An expired or
 * used link offers the code from the same email, or a new email (A-REQ-024).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { authCopy } from '@/lib/auth/copy';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { takePendingAuthLink } from '@/lib/auth/pending';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetFrame, SheetTitle } from '@/lib/auth/ui';

export default function VerifyLink() {
  const auth = useAuth();
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
          <QuietButton label={v.typeCode} onPress={() => router.replace('/sign-in/code')} />
          <QuietButton label={v.newEmail} onPress={() => router.replace('/sign-in/email')} />
        </View>
      ) : (
        <Busy label={v.title} />
      )}
    </SheetFrame>
  );
}
