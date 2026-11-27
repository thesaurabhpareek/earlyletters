/// <reference types="node" />
/**
 * [FR-LEG-15] (BL-1344): when the sign-a-letter-as-someone-else card is on in a build (NS-16, BL-980, flag
 * EXPO_PUBLIC_SIGN_AS_OTHER), the Terms carry the clause FR-LEG-15 states: sign a letter as someone else only with
 * their agreement; they are not a user and the letter is yours under the Terms; never record or sign as a child.
 *
 * The clause text is a counsel draft that the legal owner places in docs/legal/terms-of-service.md. It is not there
 * today (Terms 4.1.0, section 5.5 covers recordings of other adults only), so what this file can check is the gate:
 * no store profile in eas.json turns the flag on while the Terms lack the clause. `hasSignAsOtherClause` looks for the
 * three things the requirement names, not for any wording; when counsel's clause lands and uses other words, change
 * the patterns in the same pull request, never the requirement. Failure mode guarded: a profile edit that ships the
 * From control in a store build whose Terms say nothing about signing as someone else.
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

/**
 * True when one paragraph of the Terms speaks of signing a letter as someone else and their agreement, and the Terms
 * say a letter is never recorded or signed as a child. A paragraph is the text between blank lines.
 */
export function hasSignAsOtherClause(terms: string): boolean {
  const paragraphs = terms.split(/\n\s*\n/);
  const asOther = paragraphs.some((p) => /\bsign\w*\b/i.test(p) && /\b(someone else|another person|other person)\b/i.test(p) && /\bagree\w*\b/i.test(p));
  const notAsChild = paragraphs.some((p) => /\b(never|not|no)\b/i.test(p) && /\bsign\w*\b/i.test(p) && /\bchild\b/i.test(p));
  return asOther && notAsChild;
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

/** A fixture paragraph with the three parts the check looks for. Placeholder words for the test, not Terms text. */
const FIXTURE_CLAUSE = '\n\n9.9 FIXTURE: sign as someone else only with their agreement.\n\n9.10 FIXTURE: never sign as a child.\n';

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

  it('[FR-LEG-15] a clause with all three parts lets the card on; one missing a part does not', () => {
    const eas = readEas();
    eas.build!.testflight.env = { ...eas.build!.testflight.env, [FLAG]: ' ON ' };
    const terms = readTerms();
    expect(signAsOtherTermsProblems(eas, terms + FIXTURE_CLAUSE)).toEqual([]);
    expect(hasSignAsOtherClause(terms + '\n\n9.9 FIXTURE: sign as someone else only with their agreement.\n')).toBe(false);
    expect(hasSignAsOtherClause(terms + '\n\n9.9 FIXTURE: sign as someone else.\n\n9.10 FIXTURE: never sign as a child.\n')).toBe(false);
  });

  it('[FR-LEG-15] Terms 5.5 (recordings of other adults) is not the clause: it says nothing about signing', () => {
    expect(hasSignAsOtherClause('5.5 If a recording includes other adults, save it only with their agreement.')).toBe(false);
  });
});
