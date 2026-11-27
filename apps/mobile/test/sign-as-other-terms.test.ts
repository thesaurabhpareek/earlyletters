/// <reference types="node" />
/**
 * [FR-LEG-15] (BL-1344): when the sign-a-letter-as-someone-else card is on in a build (NS-16, BL-980, flag
 * EXPO_PUBLIC_SIGN_AS_OTHER), the Terms carry the clause FR-LEG-15 states, in three parts: (1) if you sign a letter as
 * someone else, do it only with their agreement; (2) they are not a user and the letter is yours under these Terms;
 * (3) never record or sign as a child.
 *
 * The clause text is a counsel draft that the legal owner places in docs/legal/terms-of-service.md. It is not there
 * today (Terms 4.1.0, section 5.5 covers recordings of other adults only), so what this file can check is the gate:
 * no store profile in eas.json turns the flag on while the Terms lack the clause. `signAsOtherClauseParts` looks for
 * each of the three parts inside one sentence, by the shape of its phrases, not for any wording: signing (never "sign
 * up", "sign in" or "sign out") a letter as someone else with their agreement; they are not a user, with the letter
 * yours; never recording or signing as a child. When counsel's clause lands and uses other words, change the patterns
 * in the same pull request, never the requirement. Failure mode guarded: a profile edit that ships the From control
 * in a store build whose Terms say nothing about signing as someone else, or whose only near match is account wording
 * ("do not sign up a child", "do not sign in to another person's account without their agreement").
 *
 * Scope: store profiles (production, and every profile store-flags.mjs counts as a store build). Development and e2e
 * builds are internal and not gated here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProfile, storeProfiles } from '../../../scripts/release/store-flags.mjs';

const REPO = join(__dirname, '..', '..', '..');
const FLAG = 'EXPO_PUBLIC_SIGN_AS_OTHER';
/** The Terms the app links and records an agreement to (agreements.logic.ts TERMS_DOC_VERSION pins its version). */
export const TERMS_PATH = 'docs/legal/terms-of-service.md';

type Eas = { build?: Record<string, { env?: Record<string, unknown>; distribution?: string; extends?: string }> };

const readEas = (): Eas => JSON.parse(readFileSync(join(REPO, 'apps', 'mobile', 'eas.json'), 'utf8'));
const readTerms = () => readFileSync(join(REPO, TERMS_PATH), 'utf8');
/** sign-as-other.logic.ts parseSignAsOtherFlag turns the card on only for "on"; absent or "off" is the plain off. */
const isOff = (v: unknown) => v === undefined || String(v).trim().toLowerCase() === 'off';

/** Sentences of the Terms: split at a full stop, question or exclamation mark before a space, and at blank lines. */
const sentences = (terms: string): string[] => terms.split(/(?<=[.!?])\s+|\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim());

/** "sign" as in putting a name to a letter, never "sign up", "sign in", "sign out", "sign on" or "sign off". */
const SIGN = String.raw`\bsign(?:s|ed|ing)?\b(?!\s+(?:up|in|into|out|on|off)\b)`;
const AS_OTHER = String.raw`\bas (?:someone else|another person|another adult|the other person)\b`;

/** FR-LEG-15's three parts, each true when one sentence of the Terms has it. */
export function signAsOtherClauseParts(terms: string): { asOtherWithAgreement: boolean; notAUserLetterYours: boolean; neverAsChild: boolean } {
  const all = sentences(terms);
  const asOther = new RegExp(`${SIGN}[^.;]*?\\bletters?\\b[^.;]*?${AS_OTHER}|\\bletters?\\b[^.;]*?${SIGN}[^.;]*?${AS_OTHER}`, 'i');
  const agreement = /\b(?:agree|agrees|agreed|agreement|consent)\b/i;
  const notAUser = /\b(?:they|that person|the other person|the person)\b[^.]*?\b(?:are|is) not (?:a )?users?\b/i;
  const letterYours = /\bletters?\b[^.]*?\b(?:is|are|stays?|remains?) yours\b/i;
  const neverAsChild = new RegExp(`\\b(?:never|do not|don't|must not|may not|cannot|can't)\\b[^.;]*?\\b(?:record(?:s|ed|ing)?\\b|${SIGN})[^.;]*?\\bas (?:a |the |your )?child\\b`, 'i');
  return {
    asOtherWithAgreement: all.some((x) => asOther.test(x) && agreement.test(x)),
    notAUserLetterYours: all.some((x) => notAUser.test(x) && letterYours.test(x)),
    neverAsChild: all.some((x) => neverAsChild.test(x)),
  };
}

/** True when the Terms carry all three parts of FR-LEG-15's clause. */
export function hasSignAsOtherClause(terms: string): boolean {
  const p = signAsOtherClauseParts(terms);
  return p.asOtherWithAgreement && p.notAUserLetterYours && p.neverAsChild;
}

/** Each store profile (production always among them) that turns the card on while the Terms lack the clause. */
export function signAsOtherTermsProblems(eas: Eas, terms: string): string[] {
  const build = eas.build ?? {};
  const names = new Set<string>(storeProfiles(eas));
  if (build.production) names.add('production');
  const on = [...names].sort().filter((n) => !isOff((resolveProfile(build, n)?.env ?? {})[FLAG]));
  if (on.length === 0 || hasSignAsOtherClause(terms)) return [];
  return on.map((n) => `eas.json store profile "${n}" turns ${FLAG} on, and ${TERMS_PATH} has no sign-as-someone-else clause (FR-LEG-15)`);
}

/** Placeholder sentences for the test, one per part, not Terms text. */
const PART_1 = '9.9 FIXTURE: if you sign a letter as someone else, do it only with their agreement.';
const PART_2 = '9.10 FIXTURE: they are not a user, and the letter is yours under these Terms.';
const PART_3 = '9.11 FIXTURE: never record or sign a letter as a child.';
const withParts = (terms: string, ...parts: string[]) => `${terms}\n\n${parts.join('\n\n')}\n`;
/** Account wording near the clause that is not the clause (Review A and Review B of PR #2156). */
const DECOY_A = 'You can sign a letter as someone else if they agree to it. Do not sign up a child for an account.';
const DECOY_B = ["Do not sign in to another person's account without their agreement.", 'You must not sign up for a child.'];
/** A Terms stand-in with none of the parts (today's 5.5), so these cases hold the same once counsel's clause lands. */
const BASE = '5.5 If a recording includes other adults, save it only with their agreement.';

describe('[FR-LEG-15] the sign-as-someone-else card is on in a store build only when the Terms carry its clause', () => {
  it('[FR-LEG-15] no store profile turns the card on while the Terms lack the clause', () => {
    expect(signAsOtherTermsProblems(readEas(), readTerms())).toEqual([]);
  });

  it('[FR-LEG-15] turning the card on in the production profile with the Terms as they stand fails', () => {
    const eas = readEas();
    eas.build!.production.env = { ...eas.build!.production.env, [FLAG]: 'on' };
    const problems = signAsOtherTermsProblems(eas, readTerms());
    // Today's Terms have no clause, so this fails; once counsel's clause is placed, the second expectation holds.
    if (hasSignAsOtherClause(readTerms())) expect(problems).toEqual([]);
    else expect(problems).toEqual([`eas.json store profile "production" turns ${FLAG} on, and ${TERMS_PATH} has no sign-as-someone-else clause (FR-LEG-15)`]);
  });

  it('[FR-LEG-15] a clause with all three parts lets the card on; leaving out any one part does not', () => {
    const eas = readEas();
    eas.build!.testflight.env = { ...eas.build!.testflight.env, [FLAG]: ' ON ' };
    const terms = BASE;
    expect(signAsOtherClauseParts(withParts(terms, PART_1, PART_2, PART_3))).toEqual({ asOtherWithAgreement: true, notAUserLetterYours: true, neverAsChild: true });
    expect(signAsOtherTermsProblems(eas, withParts(terms, PART_1, PART_2, PART_3))).toEqual([]);
    expect(hasSignAsOtherClause(withParts(terms, PART_2, PART_3))).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, PART_1, PART_3))).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, PART_1, PART_2))).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, '9.9 FIXTURE: sign a letter as someone else.', PART_2, PART_3))).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, PART_1, '9.10 FIXTURE: they are not a user.', PART_3))).toBe(false);
  });

  it('[FR-LEG-15] account wording is not the clause: sign up, sign in and a child account do not count for any part', () => {
    const prod = readEas();
    prod.build!.production.env = { ...prod.build!.production.env, [FLAG]: 'on' };
    const problem = [`eas.json store profile "production" turns ${FLAG} on, and ${TERMS_PATH} has no sign-as-someone-else clause (FR-LEG-15)`];
    const terms = BASE;
    // Review A: one real part, and a sign-up sentence standing in for the child part.
    expect(signAsOtherTermsProblems(prod, withParts(terms, DECOY_A))).toEqual(problem);
    expect(signAsOtherClauseParts(withParts(terms, DECOY_A)).neverAsChild).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, DECOY_A, PART_2))).toBe(false);
    // Review B: an account-sharing sentence and a sign-up sentence, with no clause at all.
    expect(signAsOtherTermsProblems(prod, withParts(terms, ...DECOY_B))).toEqual(problem);
    expect(signAsOtherClauseParts(withParts(terms, ...DECOY_B))).toEqual({ asOtherWithAgreement: false, notAUserLetterYours: false, neverAsChild: false });
    expect(hasSignAsOtherClause(withParts(terms, DECOY_B[0], PART_2, PART_3))).toBe(false);
    expect(hasSignAsOtherClause(withParts(terms, PART_1, PART_2, DECOY_B[1]))).toBe(false);
  });

  it('[FR-LEG-15] Terms 5.5 (recordings of other adults) is not the clause: it says nothing about signing', () => {
    expect(hasSignAsOtherClause('5.5 If a recording includes other adults, save it only with their agreement.')).toBe(false);
  });
});
