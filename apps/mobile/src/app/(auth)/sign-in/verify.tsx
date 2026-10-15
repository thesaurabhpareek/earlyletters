// android: same
/**
 * The email link opened the app (PRD A F5): +native-intent kept the link in
 * memory and routed here. Use it once, then consent. An expired or used link
 * offers the code from the same email, or a new email (A-REQ-024).
 *
 * BL-347: the link is used only while this phone holds the request that sent
 * it, and never while an account is signed in here (email.ts). A refused link
 * changes nothing and says why: "Type the code from the email on this phone
 * instead." (F02-U11) or "You're signed in as another account..." (F02-U27).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { authCopy } from '@/lib/auth/copy';
import type { LinkRefusal } from '@/lib/auth/link-guard.logic';
import { linkCopy } from '@/lib/auth/link-copy';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { takePendingAuthLink } from '@/lib/auth/pending';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle } from '@/lib/auth/ui';

export default function VerifyLink() {
  const auth = useAuth();
  const v = authCopy.verify;
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const [refused, setRefused] = useState<LinkRefusal | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const link = takePendingAuthLink();
    if (!link) {
      router.replace('/sign-in/code');
      return;
    }
    void auth.verifyEmailLink(link).then((r) => {
      if (r.ok) router.replace('/sign-in/consent');
      else if ('refused' in r) setRefused(r.refused);
      else setError(r.error === 'cancelled' ? 'unknown' : r.error);
    });
    // auth changes identity on every state change; this runs once per opened link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (refused === 'signed_in') {
    return (
      <SheetFrame>
        <SheetTitle>{linkCopy.link.title}</SheetTitle>
        <SheetBody>{linkCopy.link.signedInOther}</SheetBody>
        <QuietButton label={authCopy.account.cancel} onPress={() => router.replace('/')} />
      </SheetFrame>
    );
  }

  if (refused) {
    return (
      <SheetFrame>
        <SheetTitle>{linkCopy.link.title}</SheetTitle>
        <SheetBody>{linkCopy.link.otherDevice}</SheetBody>
        <View className="gap-3">
          <QuietButton label={v.typeCode} onPress={() => router.replace('/sign-in/code')} />
          <QuietButton label={v.newEmail} onPress={() => router.replace('/sign-in/email')} />
        </View>
      </SheetFrame>
    );
  }

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
