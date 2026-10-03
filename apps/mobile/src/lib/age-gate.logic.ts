/**
 * 18+ entry gate rules (PRD-REQ-019, LEGAL-REQ-002, TDD 01 3.3, docs/DECISIONS.md
 * D-026). Pure, tested in Node (test/age-gate.test.ts). App glue: lib/age-gate.ts.
 *
 * Stored on the device, nothing else (DATA_CLASSIFICATION 4.6, L2):
 * - Yes: `ageGate.passed = '1'`, a boolean. Never an age, a birthday or a time.
 * - No: `ageGate.stoppedAt = <ISO>`, the moment of the No; the stop screen
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

export function answerGate(answer: 'yes' | 'no', now: number): GateState {
  return answer === 'yes' ? { passed: true, stoppedAt: null } : { passed: false, stoppedAt: new Date(now).toISOString() };
}
