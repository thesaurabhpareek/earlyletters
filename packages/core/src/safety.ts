/**
 * Safety tiering for entries. Deterministic patterns only.
 *
 * Rules (PRD v2 section 18.2):
 *  - The classifier may change the UI. It never refuses, edits, or softens
 *    what the parent said, and never blocks a save.
 *  - Tier and time are logged. The triggering text never is.
 *  - Ambiguity resolves upward. A flag is cheap; a miss is not.
 *
 * STATUS: patterns and copy are PENDING PERINATAL CLINICIAN REVIEW.
 * Do not ship to anyone outside the founding family until reviewed.
 */

export type SafetyTier = 0 | 1 | 2;

const TIER2: RegExp[] = [
  /\b(kill|hurt|harm)(ing)? myself\b/i,
  /\bend (it all|my life)\b/i,
  /\b(want|wanted|wanna) to die\b/i,
  /\bdon'?t want to (be here|live|wake up)\b/i,
  /\bbetter off without me\b/i,
  /\bsuicid/i,
  /\b(going to|gonna|want to|will) (hurt|harm|kill|shake|smother) (her|him|the baby|my baby|them)\b/i,
  /\bnot (really )?my (baby|child)\b/i,
  /\bvoices? (telling|told|tell) me\b/i,
  /\bcan'?t keep (her|him|them|the baby) safe\b/i,
];

// Common, usually ego-dystonic experiences. Normal-ish; never an alarm.
const TIER1: RegExp[] = [
  /\bwhat if i (drop|dropped|hurt|shook)\b/i,
  /\bintrusive thought/i,
  /\b(scary|awful|horrible) thoughts?\b/i,
  /\bdon'?t feel (bonded|connected|anything)\b/i,
  /\b(bad|terrible|awful|worst) (mother|mom|mum|father|dad|parent)\b/i,
  /\bi'?m failing (her|him|them)\b/i,
  /\bso much rage\b|\bi (felt|feel) (so much )?rage\b/i,
  /\bcan'?t (do|cope with) this anymore\b/i,
];

export function classify(text: string): SafetyTier {
  if (TIER2.some((r) => r.test(text))) return 2;
  if (TIER1.some((r) => r.test(text))) return 1;
  return 0;
}

/** The helpline list lives in one place only: packages/content `copy.struggling` (D-087). */

/** Fixed copy. Never generated. PENDING CLINICIAN REVIEW. */
export const SAFETY_COPY = {
  tier1: 'A lot of parents have thoughts like this, and having them does not make you a danger. If you want someone to talk it through with, help is here.',
  tier2Title: 'You deserve support right now',
  tier2Body: 'What you said tonight sounds really heavy. Your words are saved, privately. Please reach out to someone now.',
  tier2Emergency: 'If you or your child are in immediate danger, call 911.',
} as const;
