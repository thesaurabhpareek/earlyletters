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
 * - Then, when this phone's letters belong to no account yet: the claim screen
 *   (BL-347, F02 6.2 step 6, F02-REQ-019). "Your letters on this phone will be
 *   kept in the account a***@example.com", "Keep them here" and "Not my
 *   account". Nothing is claimed or uploaded before "Keep them here"; "Not my
 *   account" ends the session and leaves the phone as it was.
 *
 * Also the "Finish setting up" target from Family and Account, including for
 * a session whose claim was never answered (the app closed on that screen).
 *
 * Visual (EXPERIENCE_PASS S55): one sheet whose steps replace each other in place, cross-fading over
 * `fadeMs`. Every registered sentence is shown word for word (consent.terms.*, sensitiveConsent.*).
 * Terms: title, body, each document as a row with a chevron (in-app browser), then at the foot the
 * agree line right above "Agree and continue", and "Not now". Age: the gate's own question (S01)
 * without the mark and the lamp: the question as the title, Yes and No as the same two pills with
 * nothing selected, and Continue; nothing else. Sensitive data: the title and its paragraphs, then
 * "Agree and sync" filled and "Keep on this phone" bordered at the same size and width (a no as easy
 * as a yes, LEGAL-REQ-006), stacked, since side by side the decline's words would wrap at the
 * default size on every phone.
 * Haptics: `tap` on an answer (the Terms and sensitive-data buttons, the age pills); Continue is silent.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useChildren } from '@/components/child/use-children';
import { AgeAnswers } from '@/components/gate/age-gate-screen';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { accountHasBooks } from '@/lib/auth/consent';
import { authCopy } from '@/lib/auth/copy';
import type { ConsentStep } from '@/lib/auth/machine.logic';
import { getSignInTrigger } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

const open = (url: string) => void WebBrowser.openBrowserAsync(url);

/** One step replacing another inside the sheet: opacity only, which is also the Reduce Motion form. */
const STEP_IN = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);
const STEP_OUT = FadeOut.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);

function StepFade({ step, children }: { step: string; children: ReactNode }) {
  return (
    <View style={styles.fill}>
      <Animated.View key={step} entering={STEP_IN} exiting={STEP_OUT} style={StyleSheet.absoluteFill}>
        {children}
      </Animated.View>
    </View>
  );
}

type Answer = (step: ConsentStep, accepted: boolean) => Promise<void>;

export default function ConsentSteps() {
  const auth = useAuth();
  const close = useCloseSheet();
  const { children, active } = useChildren();
  const [busy, setBusy] = useState<{ step: ConsentStep; accepted: boolean } | null>(null);
  const [noBook, setNoBook] = useState(false);
  const switching = useRef(false);
  const s = auth.state;
  const k = authCopy.consent;
  const child = active?.name ?? k.childFallback;
  const claiming = s.status === 'ready' && s.sync === 'on' && auth.claimPending;

  // Done: close, unless a returning person found no book (PRD A F4 "No book here yet"),
  // or the claim screen still waits for an answer.
  useEffect(() => {
    if (s.status === 'signedOut') {
      if (!switching.current) close();
      return;
    }
    if (s.status !== 'ready' || claiming) return;
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
  }, [s.status, claiming]);

  const answer: Answer = async (step, accepted) => {
    setBusy({ step, accepted });
    await auth.recordConsent(step, accepted);
    setBusy(null);
  };

  if (noBook) {
    const n = k.noBook;
    return (
      <StepFade step="noBook">
        <SheetFrame
          footer={
            <>
              <Button
                size="lg"
                fullWidth
                variant="outline"
                label={n.tryAnother}
                onPress={() => {
                  switching.current = true;
                  void auth.signOut().then(() => router.replace({ pathname: '/sign-in', params: { trigger: 'sign_in' } }));
                }}
              />
              <Button size="lg" fullWidth label={n.startBook} onPress={close} />
            </>
          }>
          <SheetTitle>{n.title}</SheetTitle>
          <SheetBody muted>{n.body}</SheetBody>
        </SheetFrame>
      </StepFade>
    );
  }

  if (claiming) {
    const c = authCopy.claim;
    const masked = auth.account.maskedEmail;
    return (
      <StepFade step="claim">
        <SheetFrame
          footer={
            <>
              <Button
                size="lg"
                fullWidth
                label={c.keep}
                onPress={() => {
                  haptic('tap');
                  auth.keepLettersHere();
                }}
              />
              <QuietButton
                label={c.notMine}
                onPress={() => {
                  switching.current = false;
                  void auth.notMyAccount();
                }}
              />
            </>
          }>
          <SheetTitle>{c.title}</SheetTitle>
          <SheetBody>{masked ? fill(c.body, { email: masked }) : c.noEmail}</SheetBody>
          <SheetBody muted>{c.help}</SheetBody>
        </SheetFrame>
      </StepFade>
    );
  }

  if (s.status !== 'needsConsent') {
    return (
      <StepFade step="settingUp">
        <SheetFrame>
          <SheetTitle>{k.settingUp}</SheetTitle>
          <Busy label={k.settingUp} />
        </SheetFrame>
      </StepFade>
    );
  }

  const step = s.steps[0];
  const error = authErrorMessage(s.error);
  return (
    <StepFade step={step}>
      {step === 'terms' ? (
        <TermsStep busy={busy !== null} error={error} answer={answer} onNotNow={close} />
      ) : step === 'age' ? (
        <AgeStep busy={busy !== null} error={error} answer={answer} />
      ) : (
        <SensitiveStep child={child} busy={busy} error={error} answer={answer} />
      )}
    </StepFade>
  );
}

function TermsStep({ busy, error, answer, onNotNow }: { busy: boolean; error: string | null; answer: Answer; onNotNow: () => void }) {
  const t = authCopy.consent.terms;
  return (
    <SheetFrame
      footer={
        <>
          {/* The acceptance line sits right above the button it describes (registered, word for word). */}
          <Text variant="subhead" tone="muted">
            {t.agreeLine}
          </Text>
          <Button
            size="lg"
            fullWidth
            loading={busy}
            label={busy ? authCopy.consent.settingUp : t.agree}
            onPress={() => {
              haptic('tap');
              void answer('terms', true);
            }}
          />
          <QuietButton label={t.notNow} onPress={onNotNow} disabled={busy} />
        </>
      }>
      <SheetTitle>{t.title}</SheetTitle>
      <SheetBody>{t.body}</SheetBody>
      <ListSection>
        <ListRow accessibilityRole="link" title={t.termsLink} trailing="chevron" onPress={() => open(brand.web.terms)} />
        <ListRow accessibilityRole="link" title={t.privacyLink} trailing="chevron" onPress={() => open(brand.web.privacy)} />
        <ListRow accessibilityRole="link" title={t.healthLink} trailing="chevron" onPress={() => open(brand.web.healthPrivacy)} />
      </ListSection>
      <ErrorLine message={error} />
    </SheetFrame>
  );
}

/** The gate's question (S01, LEGAL-REQ-002, PRD-REQ-019): only the question, Yes, No and Continue; nothing preselected. */
function AgeStep({ busy, error, answer }: { busy: boolean; error: string | null; answer: Answer }) {
  const a = authCopy.consent.age;
  const [adult, setAdult] = useState<boolean | null>(null);
  return (
    <SheetFrame
      footer={
        <Button
          size="lg"
          fullWidth
          loading={busy}
          disabled={adult === null}
          label={copy.common.continueButton}
          onPress={() => {
            if (adult !== null) void answer('age', adult);
          }}
        />
      }>
      <SheetTitle>{a.body}</SheetTitle>
      <AgeAnswers adult={adult} onChoose={setAdult} label={a.body} yes={a.yes} no={a.no} />
      <ErrorLine message={error} />
    </SheetFrame>
  );
}

function SensitiveStep({ child, busy, error, answer }: { child: string; busy: { step: ConsentStep; accepted: boolean } | null; error: string | null; answer: Answer }) {
  const sc = copy.sensitiveConsent;
  const pick = (accepted: boolean) => {
    haptic('tap');
    void answer('sensitive', accepted);
  };
  return (
    <SheetFrame
      footer={
        <>
          {/* The answer being recorded keeps its look with a spinner inside; the other waits. */}
          <Button size="lg" fullWidth loading={busy?.accepted === true} disabled={busy?.accepted === false} label={sc.agreeButton} onPress={() => pick(true)} />
          <Button size="lg" fullWidth variant="outline" loading={busy?.accepted === false} disabled={busy?.accepted === true} label={sc.declineButton} onPress={() => pick(false)} />
        </>
      }>
      <SheetTitle>{sc.title}</SheetTitle>
      <SheetBody>{fill(sc.body, { child })}</SheetBody>
      <SheetBody>{sc.use}</SheetBody>
      <SheetBody muted>{sc.declineHelp}</SheetBody>
      <SheetBody muted>{sc.changeLater}</SheetBody>
      <ErrorLine message={error} />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
