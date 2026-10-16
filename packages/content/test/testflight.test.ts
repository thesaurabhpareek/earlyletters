/**
 * RA-16-01 (docs/release/AUTOMATION.md section 5, S16): the TestFlight tester texts. The content rules apply to them
 * as to every word the product says (VOICE.md, BRAND.md), each text fits Apple's field, and each one says only what
 * its build does. Rule checks, not word pins, so the copy can still be improved. If a test fails, fix the copy.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { testflightCopy } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const ALL = leaves(testflightCopy, 'testflight');
const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

const { whatToTest, invitation } = testflightCopy;
/** Texts a tester reads before sending feedback: each must carry the ask (B1-11, B2-20). */
const ASKED = [
  { path: 'whatToTest.build1', text: whatToTest.build1 },
  { path: 'whatToTest.build2', text: whatToTest.build2 },
  ...leaves(invitation, 'invitation'),
];

describe('[RA-16-01] TestFlight texts: content rules', () => {
  it('finds every text it checks', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(9);
  });

  it('has no em dashes, en dashes, curly quotes, ellipsis characters or emoji', () => {
    expect(offenders(ALL, /[—–‘’“”…]/)).toEqual([]);
    expect(offenders(ALL, /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('uses no exclamation marks and leaves no placeholder unfilled', () => {
    expect(offenders(ALL, /!/)).toEqual([]);
    expect(offenders(ALL, /\{\w+\}|\$\{/)).toEqual([]);
  });

  it('has no fear, guilt or loss language', () => {
    expect(
      offenders(ALL, /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|lose|regrets?|never get back|die|dies|died|dying|death|dead|passed away)\b/i),
    ).toEqual([]);
  });

  it('never implies the app writes for you, and names no machine', () => {
    expect(offenders(ALL, /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing)|machine|model|transcri\w*)\b/)).toEqual([]);
    expect(offenders(ALL, /\btid(y|ied|ies|ying|ier)\b|\bclean(s|ed|ing)?\b|\bcorrect(s|ed|ing|ion)?\b|\bimprov\w*/i)).toEqual([]);
  });

  it('never genders anyone and never promises a daily rhythm', () => {
    expect(offenders(ALL, /\b(she|he|her|him|his|hers|herself|himself|sons?|daughters?)\b/i)).toEqual([]);
    expect(offenders(ALL, /\b(daily|nightly|every (?:single )?(?:day|night)|each (?:day|night))\b/i)).toEqual([]);
  });

  it('calls it an early test, never beta, alpha or preview (BRAND.md: TestFlight is the only beta)', () => {
    expect(offenders(ALL, /\b(beta|alpha|preview)\b/i)).toEqual([]);
  });

  it('uses the glossary: one descriptor, "Not much today" in quotes, sign-in link, the other parent in prose', () => {
    expect(testflightCopy.betaAppDescription.startsWith(`${brand.name}, the baby memory book you fill by talking.`)).toBe(true);
    expect(offenders(ALL, /\bthe memory book you fill by talking\b/i)).toEqual([]);
    expect(offenders(ALL, /(?<!")Not much today(?!")/)).toEqual([]);
    expect(offenders(ALL, /\b(magic link|log ?in|login|log out|co-?parent|partner|spouse|journal|diary|entry|entries|voice note)\b/i)).toEqual([]);
  });

  it('types the public name only through packages/brand', () => {
    // The texts carry brand.name from template literals (rules.test.ts checks the source has no typed name).
    expect(ALL.some((l) => l.text.includes(brand.name))).toBe(true);
  });
});

describe('[RA-16-01] TestFlight texts: fit and truth per build', () => {
  it('caps each text at 4,000 characters (Apple field limit not stated in the API reference, so the plan sets it)', () => {
    for (const l of ALL) expect(l.text.length, l.path).toBeLessThanOrEqual(4000);
  });

  it('asks testers never to put a child\'s name or a letter\'s words into feedback, in every text they read (B1-11, B2-20)', () => {
    for (const l of ASKED) {
      expect(l.text, l.path).toMatch(/never include your child's name or the words of a letter/);
    }
    expect(testflightCopy.feedbackLine).toMatch(/never include your child's name or the words of a letter/);
    expect(testflightCopy.feedbackLine).toMatch(/describe it in words instead of sending a screenshot/);
  });

  it('says other testers can see TestFlight feedback, in every text a tester reads before sending it (AUTOMATION 2.7)', () => {
    for (const l of ASKED) expect(l.text, l.path).toContain(testflightCopy.visibilityLine);
  });

  it('types no email address: TestFlight feedback goes to the address the founder sets (AF-11)', () => {
    expect(offenders(ALL, /@|\bhello\b|mailto:/i)).toEqual([]);
  });

  it('build 1 (servers off) promises no sign-in, sync or sharing', () => {
    const b1 = [whatToTest.build1, invitation.friends];
    for (const t of b1) {
      expect(t).toMatch(/no sign-in/);
      expect(t).not.toMatch(/\bsync|\binvite\b|Family tab|signing in|sign in with/i);
    }
  });

  it('build 2 (servers on) says letters sync, claims nothing on-device-only for letters, and no backup (D-100; backup is off)', () => {
    const b2 = [whatToTest.build2, invitation.friendsServersOn];
    for (const t of b2) {
      expect(t).toMatch(/sync/);
      expect(t).not.toMatch(/everything on your phone|stays? (?:only )?on (?:this|your) phone|only on (?:this|your) phone/i);
      expect(t).not.toMatch(/back(?:ed)? ?up|backup|encrypt/i);
    }
    // Build 2 says what happens to recordings, which are not uploaded in that build.
    expect(whatToTest.build2).toMatch(/Recordings are not uploaded in this build/);
  });

  it('the beta app description holds for both builds: no sign-in, sync, sharing or on-device-only claim', () => {
    expect(testflightCopy.betaAppDescription).not.toMatch(/\bsync|sign-in|sign in|invite|share|sharing|everything on your phone|only on/i);
  });
});
