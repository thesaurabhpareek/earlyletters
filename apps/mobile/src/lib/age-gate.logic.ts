/**
 * 18+ entry gate rules (PRD-REQ-019, LEGAL-REQ-002, TDD 01 3.3, docs/DECISIONS.md
 * D-026). Pure, tested in Node (test/age-gate.test.ts). App glue: lib/age-gate.ts.
 *
 * Stored on the device, nothing else (DATA_CLASSIFICATION 4.6, L2):
 * - Yes: `ageGate.passed = '1'`, a boolean. Never an age, a birthday or a time.
 * - No: nothing until the person confirms it on the confirm step (F01-U01);
 *   then `ageGate.stoppedAt = <ISO>`, the moment of the confirmed No; the stop screen
 *   stays until 24 hours after it (anti-retry). Nothing else.
 * Never in analytics, logs or crash reports.
 *
 * A clock moved backwards never shortens the stop: if now is before
 * stoppedAt, stoppedAt is reset to now (TDD 01 3.3). A damaged value also
 * counts as a fresh stop.
 */
export const BLOCK_MS = 24 * 60 * 60 * 1000;

export type GateDecision = 'ask' | 'stop' | 'pass';

export interface GateState {
  passed: boolean;
  /** ISO time of the No answer; null when never answered No. */
  stoppedAt: string | null;
}

export interface GateResult {
  decision: GateDecision;
  /** When it differs from the stored value, store this (clock repair). */
  stoppedAt: string | null;
}

export function decideGate(s: GateState, now: number): GateResult {
  if (s.passed) return { decision: 'pass', stoppedAt: null };
  if (!s.stoppedAt) return { decision: 'ask', stoppedAt: null };
  const at = Date.parse(s.stoppedAt);
  if (Number.isNaN(at) || now < at) return { decision: 'stop', stoppedAt: new Date(now).toISOString() };
  if (now - at < BLOCK_MS) return { decision: 'stop', stoppedAt: s.stoppedAt };
  return { decision: 'ask', stoppedAt: s.stoppedAt };
}

/**
 * The gate's steps on screen (F01-U01, F01-REQ-002, R3 DX-16). A No never writes at once: Continue after No opens a
 * confirm step, and only "Yes, I am under 18" writes the stop (the same 24 hours as before). Go back returns to the
 * question with nothing selected and nothing written. `write` is what the app must store; null means store nothing.
 */
export type GateView = 'ask' | 'confirm' | 'stop' | 'pass';

export interface GateStep {
  view: GateView;
  /** The answer shown selected on the question; null is nothing selected. */
  adult: boolean | null;
  write: 'yes' | 'no' | null;
}

/** Continue on the question. Yes is written; No only opens the confirm step; nothing chosen does nothing. */
export function continueGate(adult: boolean | null): GateStep {
  if (adult === null) return { view: 'ask', adult: null, write: null };
  if (adult) return { view: 'pass', adult: true, write: 'yes' };
  return { view: 'confirm', adult: false, write: null };
}

/** The confirm step after No: confirm writes the stop; back returns to the question, empty, with nothing written. */
export function confirmGate(choice: 'under18' | 'back'): GateStep {
  return choice === 'under18' ? { view: 'stop', adult: null, write: 'no' } : { view: 'ask', adult: null, write: null };
}

export function answerGate(answer: 'yes' | 'no', now: number): GateState {
  return answer === 'yes' ? { passed: true, stoppedAt: null } : { passed: false, stoppedAt: new Date(now).toISOString() };
}
