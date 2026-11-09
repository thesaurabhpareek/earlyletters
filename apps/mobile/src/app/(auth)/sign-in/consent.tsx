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
 *   can turn sync on later with "Agree and sync" in Settings, Account.
 * - Then, when this phone's letters belong to no account yet: the claim screen
 *   (BL-347, F02 6.2 step 6, F02-REQ-019). "Your letters on this phone will be
 *   kept in the account a***@example.com", "Keep in this account" and "Not my
 *   account". Nothing is claimed or uploaded before "Keep in this account"; "Not my
 *   account" ends the session and leaves the phone as it was.
 *
 * Also the "Finish setting up" target from Family and Account, including for
 * a session whose claim was never answered (the app closed on that screen).
 * And `/sign-in/consent?step=sensitive`, the target of "Agree and sync" on Account and
 * the invite sheets for a person who chose "Keep on this phone": the same sensitive-data
 * step with all its words (LEGAL-REQ-006); Agree records the accept (turnOnSync), and
 * "Keep on this phone" closes with the earlier decline standing. Never a one-tap consent.
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
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { useChildren } from '@/components/child/use-children';
import { useFontScale } from '@/lib/a11y';
import { AgeAnswers } from '@/components/gate/age-gate-screen';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { authCopy } from '@/lib/auth/copy';
import type { ConsentStep } from '@/lib/auth/machine.logic';
import { getSignInTrigger } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { afterConsent, claimWords, keepEnabled, signedInLine, type AccountKind } from '@/lib/first-run/account-books.logic';
import { readAccountBooks } from '@/lib/first-run/account-books';
import { consentHandoff } from '@/lib/first-run/handoff.logic';
import { signInErrorMessage } from '@/lib/first-run/welcome.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

const open = (url: string) => void WebBrowser.openBrowserAsync(url);

/** One step replacing another inside the sheet: opacity only, which is also the Reduce Motion form. */
const STEP_IN = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);
const STEP_OUT = FadeOut.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);

/**
 * The first step arrives with the route's own fade (the (auth) stack's STEP options), so only a step that replaces
 * another fades here: one fade per change, never two at once.
 */
function StepFade({ step, children }: { step: string; children: ReactNode }) {
  const first = useRef(step);
  const changed = first.current !== step;
  return (
    <View style={styles.fill}>
      <Animated.View key={step} entering={changed ? STEP_IN : undefined} exiting={STEP_OUT} style={StyleSheet.absoluteFill}>
        {children}
      </Animated.View>
    </View>
  );
}

type Answer = (step: ConsentStep, accepted: boolean) => Promise<void>;

export default function ConsentSteps() {
  const auth = useAuth();
  const close = useCloseSheet();
  const params = useLocalSearchParams<{ step?: string }>();
  const { children, active } = useChildren();
  const [busy, setBusy] = useState<{ step: ConsentStep; accepted: boolean } | null>(null);
  const [turnOnError, setTurnOnError] = useState<string | null>(null);
  // Set before the first await, so a second tap in the same frame (Agree, then Keep) records nothing more.
  const inFlight = useRef(false);
  const [noBook, setNoBook] = useState(false);
  // What `sync_books` says about the account while the claim screen is up; null until it answers or times out.
  const [claimKind, setClaimKind] = useState<AccountKind | null>(null);
  const switching = useRef(false);
  const s = auth.state;
  const k = authCopy.consent;
  const child = active?.name || k.childFallback;
  // What comes after the answer is the merge-back rule's (lib/first-run/merge-back.logic.ts, NX-36 4.2): agreed with
  // letters on this phone, the claim screen first and nothing uploaded before it; declined, the book still opens.
  const handoff = consentHandoff({ status: s.status, sync: s.status === 'ready' ? s.sync : null, claimPending: auth.claimPending });
  const claiming = handoff === 'askClaim';
  // "Agree and sync" after an earlier "Keep on this phone": the sensitive-data step, whatever the gate's step list says.
  const turningOn = params.step === 'sensitive' && s.status === 'ready' && s.sync === 'off';
  const fromAgreeAndSync = params.step === 'sensitive';
  const syncMode = s.status === 'ready' ? s.sync : null;

  // Done: close, unless a returning person found no book (PRD A F4 "No book here yet"),
  // or the claim screen still waits for an answer.
  useEffect(() => {
    if (s.status === 'signedOut') {
      if (!switching.current) close();
      return;
    }
    if (s.status !== 'ready' || claiming) return;
    // The sensitive-data step from "Agree and sync" stays until it is answered; once sync is on, it is done.
    if (turningOn) return;
    if (fromAgreeAndSync) {
      close();
      return;
    }
    if (getSignInTrigger() !== 'sign_in' || children.length > 0 || !auth.client || s.sync !== 'on') {
      close();
      return;
    }
    // New account (first_run_open, no book): on to the promise step and the child step. Returning with no book, or any
    // failure or a wait past ACCOUNT_BOOKS_WAIT_MS: "No book here yet" (account-books.logic.ts; the fail-safe direction).
    let alive = true;
    void readAccountBooks(auth.client).then((kind) => {
      if (!alive) return;
      if (afterConsent(kind) === 'close') close();
      else setNoBook(true);
    });
    return () => {
      alive = false;
    };
    // Runs when the state settles; close and children are stable enough for this one-shot decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.status, claiming, syncMode]);

  // The claim screen says so when the account already has a book. Bounded; an unreadable answer keeps today's words.
  useEffect(() => {
    if (!claiming || !auth.client) return;
    let alive = true;
    setClaimKind(null);
    void readAccountBooks(auth.client).then((kind) => alive && setClaimKind(kind));
    return () => {
      alive = false;
    };
    // One look per time the claim screen appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claiming]);

  const answer: Answer = async (step, accepted) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy({ step, accepted });
    try {
      await auth.recordConsent(step, accepted);
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  };

  // Agree records the accept and re-reads the gate; Keep on this phone leaves the earlier decline as it is.
  const answerTurnOn: Answer = async (_step, accepted) => {
    if (inFlight.current) return;
    if (!accepted) {
      // Keep closes the sheet with the decline standing. The guard stays set while it closes, so an Agree
      // tapped in the same frame records nothing.
      inFlight.current = true;
      close();
      return;
    }
    inFlight.current = true;
    setBusy({ step: 'sensitive', accepted: true });
    setTurnOnError(null);
    try {
      const r = await auth.turnOnSync();
      if (!r.ok) setTurnOnError(authErrorMessage(r.error));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
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
    const hasBook = claimWords(claimKind) === 'accountHasBook';
    const signedIn = signedInLine({ maskedEmail: masked, provider: auth.account.provider }, { signedInAs: copy.onboarding.child.signedInAs, signedInAsLabel: copy.onboarding.child.signedInAsLabel, apple: authCopy.account.signedInWith.apple });
    return (
      <StepFade step="claim">
        <SheetFrame
          footer={
            <>
              <Button
                size="lg"
                fullWidth
                label={c.keep}
                loading={!keepEnabled(claimKind) && !!auth.client}
                accessibilityHint={claimWords(claimKind) === 'accountHasBook' ? c.keepHint : undefined}
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
          {hasBook ? (
            <>
              <SheetBody>{c.bodyHasBook}</SheetBody>
              {signedIn ? (
                <Text variant="footnote" tone="muted" accessibilityLabel={signedIn.label}>
                  {signedIn.text}
                </Text>
              ) : null}
              <SheetBody muted>{c.recordingsNote}</SheetBody>
            </>
          ) : (
            <SheetBody>{masked ? fill(c.body, { email: masked }) : c.noEmail}</SheetBody>
          )}
          <SheetBody muted>{c.help}</SheetBody>
        </SheetFrame>
      </StepFade>
    );
  }

  if (turningOn) {
    return (
      <StepFade step="sensitive">
        <SensitiveStep child={child} busy={busy} error={turnOnError} answer={answerTurnOn} />
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
  // A brand-new install has no letters, so its error reads without "Your letters are safe" (NX-36 2.6, S6).
  const error = signInErrorMessage(s.error, children.length > 0);
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
            label={t.agree}
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

function SensitiveStep(props: { child: string; busy: { step: ConsentStep; accepted: boolean } | null; error: string | null; answer: Answer }) {
  // A new text size measures both answers afresh (a remount), so the pair never keeps an old height.
  const scale = useFontScale();
  return <SensitiveAnswers key={scale} {...props} />;
}

function SensitiveAnswers({ child, busy, error, answer }: { child: string; busy: { step: ConsentStep; accepted: boolean } | null; error: string | null; answer: Answer }) {
  const sc = copy.sensitiveConsent;
  // The two answers are the same height at every text size: if one wraps (AX sizes), the other grows to match.
  const [tallest, setTallest] = useState<number>(tokens.target.primary);
  const measure = (h: number) => setTallest((t) => (h > t + 0.5 ? h : t));
  const pair = { minHeight: tallest };
  const pick = (accepted: boolean) => {
    haptic('tap');
    void answer('sensitive', accepted);
  };
  return (
    <SheetFrame
      footer={
        <>
          {/* The answer being recorded keeps its look with a spinner inside; the other waits. */}
          <Button
            size="lg"
            fullWidth
            style={pair}
            onLayout={(e) => measure(e.nativeEvent.layout.height)}
            loading={busy?.accepted === true}
            disabled={busy?.accepted === false}
            label={sc.agreeButton}
            onPress={() => pick(true)}
          />
          <Button
            size="lg"
            fullWidth
            variant="outline"
            style={pair}
            onLayout={(e) => measure(e.nativeEvent.layout.height)}
            loading={busy?.accepted === false}
            disabled={busy?.accepted === true}
            label={sc.declineButton}
            onPress={() => pick(false)}
          />
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
