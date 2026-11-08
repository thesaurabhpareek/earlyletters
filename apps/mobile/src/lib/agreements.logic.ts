/**
 * Before you begin: the rules for the one screen that asks the neutral 18+ question and holds the unticked agreement
 * box (founder decision F2, 8 Nov 2026; proposals/account-security/legal-consent.md 2 and 3, design.md 2.1; data design
 * PR #597 docs/data/account-experience-schema.md 2.1). Pure, tested in Node (test/agreements.test.ts). App glue:
 * lib/age-gate.ts; the table: lib/db/repos/agreements.ts (local schema v10).
 *
 * What is stored, and nothing else:
 * - The age answer stays the existing boolean `ageGate.passed` (D-026), or the time of a No (`ageGate.stoppedAt`, the
 *   24-hour stop of LEGAL-REQ-002). The agreement row never holds an age, a birth date or an age time.
 * - Yes plus a ticked box: one `terms` row and one `privacy` row (document, version, action, surface, device time,
 *   app version, SHA-256 of the sentence shown), written in the same transaction as `ageGate.passed`.
 * - No: the existing stop path, whatever the box says. Nothing about the box is stored.
 * - Yes without a tick, or no answer: nothing is stored; the screen says why.
 * Never logged, never in analytics (CPrivO-3). Engineering reading, confirm with counsel (Q-A to Q-D).
 */
import { sha256Hex } from './sha256';

/** `version` in docs/legal/terms-of-service.md front matter (test/agreements.test.ts fails when they drift). */
export const TERMS_DOC_VERSION = '4.1.0';
/** `version` in docs/legal/privacy-policy.md front matter. */
export const PRIVACY_DOC_VERSION = '3.0.0';

export type AgreementDocument = 'terms' | 'privacy';
/** The sentence says "I agree to ... Privacy Policy", so both rows record what was shown: an accept (Q-D is open). */
export type AgreementAction = 'accept' | 'acknowledge';
export type AgreementSurface = 'first_run.before_you_begin' | 'update.agreement';

export interface AgreementRow {
  id: string;
  document: AgreementDocument;
  version: string;
  action: AgreementAction;
  surface: AgreementSurface;
  /** Device ISO time of the Continue tap. */
  recordedAt: string;
  appVersion: string;
  /** Hex SHA-256 of the agreement sentence exactly as rendered. */
  renderedSha256: string;
}

/** Where the person is on the screen when they tap Continue. `returning`: a build 1 install that already passed the age question. */
export interface BeforeBeginAnswer {
  adult: boolean | null;
  agreed: boolean;
  returning: boolean;
}

export type BeforeBeginOutcome =
  | { kind: 'reason'; reason: 'chooseAnswer' | 'tickBox' }
  | { kind: 'stop' }
  | { kind: 'accept'; passAge: boolean; surface: AgreementSurface };

/**
 * What Continue does. Continue is never disabled (design 2.1): with nothing to act on it shows the reason.
 * The age answer is read first, so a No goes to the stop screen whatever the box says (LEGAL-REQ-002 unchanged).
 */
export function continueBeforeBegin(a: BeforeBeginAnswer): BeforeBeginOutcome {
  if (a.returning) return a.agreed ? { kind: 'accept', passAge: false, surface: 'update.agreement' } : { kind: 'reason', reason: 'tickBox' };
  if (a.adult === null) return { kind: 'reason', reason: 'chooseAnswer' };
  if (a.adult === false) return { kind: 'stop' };
  if (!a.agreed) return { kind: 'reason', reason: 'tickBox' };
  return { kind: 'accept', passAge: true, surface: 'first_run.before_you_begin' };
}

/** The two rows one accept writes. `sentence` is the agreement text exactly as the screen rendered it. */
export function agreementRows(input: { sentence: string; surface: AgreementSurface; now: string; appVersion: string; newId: () => string }): AgreementRow[] {
  const renderedSha256 = sha256Hex(input.sentence);
  const base = { action: 'accept' as const, surface: input.surface, recordedAt: input.now, appVersion: input.appVersion.slice(0, 32), renderedSha256 };
  return [
    { id: input.newId(), document: 'terms', version: TERMS_DOC_VERSION, ...base },
    { id: input.newId(), document: 'privacy', version: PRIVACY_DOC_VERSION, ...base },
  ];
}

export type EntryDecision = 'ask' | 'stop' | 'agree' | 'pass';

/**
 * The root layout's decision. An install whose age gate already passed but that holds no Terms agreement (every
 * build 1 install) sees the agreement once ('agree'); the age question is not asked again. A record is never made
 * up from use: until the person ticks the box, there is no row.
 */
export function decideEntry(gate: 'ask' | 'stop' | 'pass', hasTermsAgreement: boolean): EntryDecision {
  if (gate !== 'pass') return gate;
  return hasTermsAgreement ? 'pass' : 'agree';
}
