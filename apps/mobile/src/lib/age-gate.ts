/**
 * App glue for the 18+ entry gate (rules in age-gate.logic.ts). The root
 * layout calls useAgeGate() and renders no route at all until it says
 * 'pass', so first run, Tonight, invites and deep links all sit behind it.
 */
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { answerGate, decideGate, type GateDecision } from './age-gate.logic';
import { clearPendingInvite } from './family/pending-invite';
import { deleteSetting, getSetting, setSetting } from './store';

// Keys from docs/DECISIONS.md D-026 (DATA_CLASSIFICATION 4.6, L2).
const PASSED = 'ageGate.passed';
const STOPPED_AT = 'ageGate.stoppedAt';

function readDecision(now = Date.now()): GateDecision {
  const stoppedAt = getSetting(STOPPED_AT);
  const r = decideGate({ passed: getSetting(PASSED) === '1', stoppedAt }, now);
  if (r.stoppedAt && r.stoppedAt !== stoppedAt) setSetting(STOPPED_AT, r.stoppedAt);
  return r.decision;
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

/** The 24 hours have passed and the parent asked to answer again. */
export function reopenAgeGate(): void {
  deleteSetting(STOPPED_AT);
}

export function useAgeGate(): { decision: GateDecision; refresh: () => void } {
  const [decision, setDecision] = useState<GateDecision>(() => readDecision());
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

