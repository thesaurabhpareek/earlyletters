/**
 * Notes for App Review, servers-on build (src/release/app-review.en.ts; proposals/app-review-demo-signin.md option 3).
 * They go to Apple, not to families, but the content rules apply as to every word the product says (VOICE.md,
 * BRAND.md). They also have to get past the release workflow's refusal for a servers-on build, fit Apple's field, keep
 * the only secret as a placeholder, and name only the fictional family. Rule checks, not a word pin. If a test fails,
 * fix the copy.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { appReviewCopy, en } from '../src';
import { authCopy } from '../src/features/auth.en';

const notes = appReviewCopy.notesServersOn;
const { demoEmail, demoPassword } = appReviewCopy.placeholders;

describe('Notes for App Review, servers-on build', () => {
  it('has no em dashes, en dashes, curly quotes, ellipsis characters, emoji or exclamation marks', () => {
    expect(notes).not.toMatch(/[—–‘’“”…]/);
    expect(notes).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(notes).not.toMatch(/!/);
  });

  it('fits the Notes field with room for a filled email and password (App Store Connect: 4,000 bytes)', () => {
    const filled = notes.replace(demoEmail, `${'a'.repeat(64)}@${'b'.repeat(120)}.org`).replace(demoPassword, 'p'.repeat(128));
    expect(Buffer.byteLength(filled, 'utf8')).toBeLessThanOrEqual(4000);
  });

  it('carries the two placeholders once each, and no other', () => {
    expect(demoEmail).toBe('{demoEmail}');
    expect(demoPassword).toBe('{demoPassword}');
    expect(notes.split(demoEmail).length - 1).toBe(1);
    expect(notes.split(demoPassword).length - 1).toBe(1);
    const all = [...notes.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    expect(all.sort()).toEqual(['demoEmail', 'demoPassword']);
  });

  it('holds no credential: no address, no link with a token, no long token', () => {
    expect(notes.replace(brand.support.email, '')).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
    expect(notes).not.toMatch(/\/j#t=/);
    expect(notes).not.toMatch(/\b[A-Za-z0-9_-]{32,}\b/);
  });

  it('passes the release workflow refusal for a servers-on build (with-review-contact.ts NO_SIGN_IN)', () => {
    const source = readFileSync(fileURLToPath(new URL('../../../scripts/release/with-review-contact.ts', import.meta.url)), 'utf8');
    const literal = /const NO_SIGN_IN = \/(.+)\/(\w*);/.exec(source);
    expect(literal, 'NO_SIGN_IN in with-review-contact.ts').not.toBeNull();
    expect(new RegExp(literal![1], literal![2]).test(notes)).toBe(false);
  });

  it('names the product only through brand, and keeps the D-004 positioning', () => {
    expect(notes.startsWith(`${brand.name} is a memory book`)).toBe(true);
    expect(notes).toContain('This is not a health or medical service and gives no health advice.');
    expect(notes).toContain(brand.support.email);
  });

  it('says sign-in is required, names the demo account, and does not send the reviewer through "I was invited"', () => {
    expect(notes).toMatch(/SIGN-IN IS REQUIRED/);
    expect(notes).not.toMatch(/optional|without an account/i);
    expect(notes).not.toContain(en.onboarding.welcome.joinButton);
    expect(notes).not.toMatch(/invite/i);
    expect(notes).toContain('Sign in with Apple');
    expect(notes).toMatch(/There are no passwords in the app/);
    expect(notes).toMatch(/Password: \{demoPassword\}/);
    expect(notes).toMatch(/It is not typed into the app/);
    // The glossary's words: Apple Account, link, 6-digit code.
    expect(notes).not.toMatch(/\bApple ID\b|\bmagic link\b|\bOTP\b|\bone-time password\b|\blog ?in\b/i);
  });

  it('names the steps with the words the build shows', () => {
    for (const label of [authCopy.sheet.email, authCopy.email.label, authCopy.email.send, authCopy.code.label, authCopy.code.verify, authCopy.consent.age.body, authCopy.consent.age.yes, en.settingsHome.deleteAccountLabel, en.settingsHome.planLabel]) {
      expect(notes, label).toContain(label);
    }
  });

  it('names only the fictional family, never genders anyone, and claims no recording upload or family listening', () => {
    expect(notes).toContain('Asha');
    expect(notes).not.toMatch(/\b(she|he|her|him|his|hers|sons?|daughters?|boy|girl)\b/i);
    expect(notes).toMatch(/Recordings stay on the phone that made them/);
    expect(notes).not.toMatch(/\bbacked up\b|\bencrypted backup\b|\brecording backup\b|\bicloud\b|hear each other|highlight/i);
  });

  it('never implies the app writes for anyone, and never says beta', () => {
    expect(notes).toMatch(/never rewrites what a person says/);
    expect(notes).not.toMatch(/\b(AI|artificial intelligence|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|enhanc(e|ed|es|ing)|improv\w*|tid(y|ied|ies|ying))\b/i);
    expect(notes).not.toMatch(/\b(beta|alpha|preview|early access)\b/i);
  });
});

/** NS-38-R5: what the Notes for Review must say, and never say. Returns what is missing or wrong. */
function r5Gaps(text: string): string[] {
  const gaps: string[] = [];
  if (!/An account keeps the words of a parent's letters with them on a new phone/.test(text)) gaps.push('reason for the account');
  if (!/DEMO ACCOUNT/.test(text) || !text.includes(demoEmail)) gaps.push('demo sign-in path');
  if (!text.includes(`answer "${authCopy.consent.age.body}" with ${authCopy.consent.age.yes}`)) gaps.push('18+ answer');
  if (!/first two letters are free/.test(text) || !/asked for at Keep/.test(text)) gaps.push('two free letters then Plus at Keep');
  if (!/Nothing else is behind Plus/.test(text)) gaps.push('nothing else gated');
  if (!text.includes(`"${authCopy.outage.startLocal}"`) || !/outage/.test(text)) gaps.push('local start named as outage-only');
  if (/\bno (sign-in|sign in|account)\b|\bno account is needed\b/i.test(text)) gaps.push('says no account');
  return gaps;
}

describe('[NS-38-R5] review notes match the build', () => {
  it('names the reason, the demo path, the 18+ answer, two free letters then Plus at Keep, nothing else gated, and the outage-only start', () => {
    expect(r5Gaps(notes)).toEqual([]);
  });

  const mutants: Array<[string, (t: string) => string, string]> = [
    ['drop the reason', (t) => t.replace('An account keeps the words', 'Letters keep the words'), 'reason for the account'],
    ['drop the demo account', (t) => t.replace('DEMO ACCOUNT', 'EXAMPLE'), 'demo sign-in path'],
    ['drop the Yes answer', (t) => t.replace(`with ${authCopy.consent.age.yes}`, 'with anything'), '18+ answer'],
    ['drop "asked for at Keep"', (t) => t.replace('asked for at Keep', 'asked for later'), 'two free letters then Plus at Keep'],
    ['drop "nothing else is behind Plus"', (t) => t.replace('Nothing else is behind Plus', 'Other things may follow'), 'nothing else gated'],
    ['drop the local start', (t) => t.replace(`"${authCopy.outage.startLocal}"`, 'a button'), 'local start named as outage-only'],
    ['say no account is needed', (t) => `${t}\nNo account is needed.`, 'says no account'],
  ];
  for (const [label, mutate, gap] of mutants) {
    it(`[mutant] ${label}`, () => {
      expect(r5Gaps(mutate(notes))).toContain(gap);
    });
  }
});
