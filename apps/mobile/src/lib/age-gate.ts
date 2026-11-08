/**
 * App glue for the 18+ entry gate and Before you begin (rules in age-gate.logic.ts and agreements.logic.ts). The
 * root layout calls useAgeGate() and renders no route at all until it says 'pass', so first run, Tonight, invites
 * and deep links all sit behind it. An install that passed the old gate but holds no Terms agreement (build 1) gets
 * 'agree': the agreement once, without the age question.
 */
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { AGE_GATE_PASSED_KEY as PASSED, AGE_GATE_STOPPED_KEY as STOPPED_AT, answerGate, decideGate } from './age-gate.logic';
import { agreementRows, decideEntry, type AgreementSurface, type EntryDecision } from './agreements.logic';
import { clearPendingInvite } from './family/pending-invite';
import { deleteSetting, getSetting, hasAgreement, recordAgreement, setSetting, uuidv7 } from './store';

function readDecision(now = Date.now()): EntryDecision {
  const stoppedAt = getSetting(STOPPED_AT);
  const r = decideGate({ passed: getSetting(PASSED) === '1', stoppedAt }, now);
  if (r.stoppedAt && r.stoppedAt !== stoppedAt) setSetting(STOPPED_AT, r.stoppedAt);
  return decideEntry(r.decision, r.decision === 'pass' ? hasAgreement('terms') : false);
}

/**
 * Records the answer: a boolean for Yes, the time of a No. Nothing else is written.
 * A No also drops an invite link that opened the app (it is never used by someone under 18).
 */
export function answerAgeGate(answer: 'yes' | 'no'): void {
  const s = answerGate(answer, Date.now());
  if (s.passed) {
    setSetting(PASSED, '1');
    deleteSetting(STOPPED_AT);
  } else {
    deleteSetting(PASSED);
    setSetting(STOPPED_AT, s.stoppedAt!);
    void clearPendingInvite();
  }
}

/**
 * Yes plus a ticked box (or the tick alone on an install that already passed the age question): the Terms and
 * Privacy rows, and with `passAge` the age boolean, in one transaction. `sentence` is the agreement text exactly as
 * rendered; only its hash is kept. Nothing here is logged.
 */
export function acceptBeforeYouBegin(sentence: string, surface: AgreementSurface, passAge: boolean): void {
  const rows = agreementRows({
    sentence,
    surface,
    now: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    newId: () => uuidv7(),
  });
  recordAgreement(rows, passAge);
}

/** The 24 hours have passed and the parent asked to answer again. */
export function reopenAgeGate(): void {
  deleteSetting(STOPPED_AT);
}

export function useAgeGate(): { decision: EntryDecision; refresh: () => void } {
  const [decision, setDecision] = useState<EntryDecision>(() => readDecision());
  const refresh = useCallback(() => setDecision(readDecision()), []);
  useEffect(() => {
    // Re-check when the app returns to the foreground and once a minute while stopped,
    // so a stop screen left open past its 24 hours can offer the question again.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const timer = decision === 'stop' ? setInterval(refresh, 60_000) : null;
    return () => {
      sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [decision, refresh]);
  return { decision, refresh };
}

// android: same
