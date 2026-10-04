// android: same
/**
 * After sign-in: the sheets my_sync_gate() says are missing, one at a time
 * (PRD A F3.4, PRD-REQ-002, LEGAL-REQ-001, -002, -006), each recorded with
 * record_policy_act. Nothing syncs until the last one (canSync).
 *
 * - Terms: the privacy promise, links to the documents, and "By continuing,
 *   you confirm you are 18 or older and agree to the Terms of Service and
 *   Privacy Policy." Records `terms` with `age_attested: true`.
 * - Age: only when Terms are current without the attestation. No ends the
 *   session and closes the 18+ gate (the provider does both).
 * - Sensitive data: the counsel-approved screen from packages/content.
 *   "Keep on this phone" records a decline; the person stays signed in and
 *   can turn sync on later in Settings, Privacy.
 *
 * Also the "Finish setting up" target from Family and Account.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useChildren } from '@/components/child/use-children';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { accountHasBooks } from '@/lib/auth/consent';
import { authCopy } from '@/lib/auth/copy';
import type { ConsentStep } from '@/lib/auth/machine.logic';
import { getSignInTrigger } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, LinkText, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

const open = (url: string) => void WebBrowser.openBrowserAsync(url);

export default function ConsentSteps() {
  const auth = useAuth();
  const close = useCloseSheet();
  const { children, active } = useChildren();
  const [busy, setBusy] = useState(false);
  const [noBook, setNoBook] = useState(false);
  const switching = useRef(false);
  const s = auth.state;
  const k = authCopy.consent;
  const child = active?.name ?? k.childFallback;

  // Done: close, unless a returning person found no book (PRD A F4 "No book here yet").
  useEffect(() => {
    if (s.status === 'signedOut') {
      if (!switching.current) close();
      return;
    }
    if (s.status !== 'ready') return;
    if (getSignInTrigger() !== 'sign_in' || children.length > 0 || !auth.client || s.sync !== 'on') {
      close();
      return;
    }
    let alive = true;
    void accountHasBooks(auth.client, s.userId)
      .then((has) => {
        if (!alive) return;
        if (has) close();
        else setNoBook(true);
      })
      .catch(() => alive && close());
    return () => {
      alive = false;
    };
    // Runs when the state settles; close and children are stable enough for this one-shot decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.status]);

  const answer = async (step: ConsentStep, accepted: boolean) => {
    haptic('tap');
    setBusy(true);
    await auth.recordConsent(step, accepted);
    setBusy(false);
  };

  if (noBook) {
    const n = k.noBook;
    return (
      <SheetFrame>
        <SheetTitle>{n.title}</SheetTitle>
        <SheetBody muted>{n.body}</SheetBody>
        <View className="gap-3 pt-2">
          <Button
            size="lg"
            variant="outline"
            onPress={() => {
              switching.current = true;
              void auth.signOut().then(() => router.replace({ pathname: '/sign-in', params: { trigger: 'sign_in' } }));
            }}>
            <Text>{n.tryAnother}</Text>
          </Button>
          <Button size="lg" onPress={close}>
            <Text>{n.startBook}</Text>
          </Button>
        </View>
      </SheetFrame>
    );
  }

  if (s.status !== 'needsConsent') {
    return (
      <SheetFrame>
        <SheetTitle>{k.settingUp}</SheetTitle>
        <Busy label={k.settingUp} />
      </SheetFrame>
    );
  }

  const step = s.steps[0];
  const error = authErrorMessage(s.error);

  if (step === 'terms') {
    const t = k.terms;
    return (
      <SheetFrame
        footer={
          <>
            <Button size="lg" onPress={() => void answer('terms', true)} disabled={busy}>
              <Text>{t.agree}</Text>
            </Button>
            <QuietButton label={t.notNow} onPress={close} disabled={busy} />
          </>
        }>
        <SheetTitle>{t.title}</SheetTitle>
        <SheetBody>{t.body}</SheetBody>
        <Text className="text-base leading-6 text-muted-foreground">{t.agreeLine}</Text>
        <View className="gap-3">
          <LinkText label={t.termsLink} onPress={() => open(brand.web.terms)} />
          <LinkText label={t.privacyLink} onPress={() => open(brand.web.privacy)} />
          <LinkText label={t.healthLink} onPress={() => open(brand.web.healthPrivacy)} />
        </View>
        {busy ? <Busy label={k.settingUp} /> : <ErrorLine message={error} />}
      </SheetFrame>
    );
  }

  if (step === 'age') {
    const a = k.age;
    return (
      <SheetFrame
        footer={
          <View className="flex-row gap-3">
            <Button size="lg" variant="outline" className="flex-1" onPress={() => void answer('age', false)} disabled={busy}>
              <Text>{a.no}</Text>
            </Button>
            <Button size="lg" className="flex-1" onPress={() => void answer('age', true)} disabled={busy}>
              <Text>{a.yes}</Text>
            </Button>
          </View>
        }>
        <SheetTitle>{a.title}</SheetTitle>
        <SheetBody>{a.body}</SheetBody>
        <SheetBody muted>{a.help}</SheetBody>
        {busy ? <Busy label={k.settingUp} /> : <ErrorLine message={error} />}
      </SheetFrame>
    );
  }

  const sc = copy.sensitiveConsent;
  return (
    <SheetFrame
      footer={
        <>
          <Button size="lg" onPress={() => void answer('sensitive', true)} disabled={busy}>
            <Text>{sc.agreeButton}</Text>
          </Button>
          <QuietButton label={sc.declineButton} onPress={() => void answer('sensitive', false)} disabled={busy} />
        </>
      }>
      <SheetTitle>{sc.title}</SheetTitle>
      <SheetBody>{fill(sc.body, { child })}</SheetBody>
      <SheetBody>{sc.use}</SheetBody>
      <Text className="text-base leading-6 text-muted-foreground">{sc.declineHelp}</Text>
      <Text className="text-base leading-6 text-muted-foreground">{sc.changeLater}</Text>
      {busy ? <Busy label={k.settingUp} /> : <ErrorLine message={error} />}
    </SheetFrame>
  );
}
