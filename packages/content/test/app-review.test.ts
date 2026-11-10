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

const notes = appReviewCopy.notesServersOn;
const { inviteLink, inviteExpiry } = appReviewCopy.placeholders;

describe('Notes for App Review, servers-on build', () => {
  it('has no em dashes, en dashes, curly quotes, ellipsis characters, emoji or exclamation marks', () => {
    expect(notes).not.toMatch(/[—–‘’“”…]/);
    expect(notes).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(notes).not.toMatch(/!/);
  });

  it('fits the Notes field with room for the filled link and date (App Store Connect: 4,000 bytes)', () => {
    // A filled link is the brand origin, /j#t= and a token of up to 128 characters; a date is under 40 characters.
    const filled = notes.replace(inviteLink, `${brand.web.origin}/j#t=${'A'.repeat(128)}`).replace(inviteExpiry, 'Wednesday, November 18, 2026');
    expect(Buffer.byteLength(filled, 'utf8')).toBeLessThanOrEqual(4000);
  });

  it('carries the two placeholders once each, and no other', () => {
    expect(inviteLink).toBe('{inviteLink}');
    expect(inviteExpiry).toBe('{inviteExpiry}');
    expect(notes.split(inviteLink).length - 1).toBe(1);
    expect(notes.split(inviteExpiry).length - 1).toBe(1);
    const all = [...notes.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    expect(all.sort()).toEqual(['inviteExpiry', 'inviteLink']);
  });

  it('holds no invite secret: no link with a token, no token, no 8-character code (SEC-R04, IAM-R23)', () => {
    expect(notes).not.toMatch(/\/j#t=/);
    expect(notes).not.toMatch(/\b[A-Za-z0-9_-]{32,}\b/);
    expect(notes).not.toMatch(/\b[0-9A-HJKMNP-TV-Z]{4}-?[0-9A-HJKMNP-TV-Z]{4}\b/);
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

  it('says sign-in is optional, passwordless and Sign in with Apple, and asks for no demo account', () => {
    expect(notes).toMatch(/works fully on this iPhone without an account/);
    expect(notes).toMatch(/There are no passwords/);
    expect(notes).toContain('Sign in with Apple');
    // The glossary's words: Apple Account, sign-in link, 6-digit code.
    expect(notes).not.toMatch(/\bApple ID\b|\bmagic link\b|\bOTP\b|\bone-time password\b|\blog ?in\b/i);
  });

  it('names the join steps with the words the build shows', () => {
    for (const label of [en.onboarding.welcome.joinButton, en.settingsHome.deleteAccountLabel, en.settingsHome.planLabel, en.sensitiveConsent.agreeButton]) {
      expect(notes, label).toContain(label);
    }
  });

  it('names only the fictional family, never genders anyone, and claims no recording upload or family listening', () => {
    expect(notes).toContain('Asha');
    expect(notes).not.toMatch(/\b(she|he|her|him|his|hers|sons?|daughters?|boy|girl)\b/i);
    expect(notes).toMatch(/Recordings stay on the phone that made them in this version/);
    expect(notes).not.toMatch(/\bbacked up\b|\bencrypted backup\b|\brecording backup\b|\bicloud\b|hear each other|highlight/i);
  });

  it('never implies the app writes for anyone, and never says beta', () => {
    expect(notes).toMatch(/never rewrites what a person says/);
    expect(notes).not.toMatch(/\b(AI|artificial intelligence|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|enhanc(e|ed|es|ing)|improv\w*|tid(y|ied|ies|ying))\b/i);
    expect(notes).not.toMatch(/\b(beta|alpha|preview|early access)\b/i);
  });
});
