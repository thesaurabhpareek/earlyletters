/**
 * RA-16-01 (docs/release/AUTOMATION.md section 5, S16): the TestFlight tester texts, aligned with S17's tester notice
 * (RA-17-04, docs/legal/TESTFLIGHT_TESTERS.md on #195). The content rules apply to them as to every word the product
 * says (VOICE.md, BRAND.md), each text fits Apple's field, and each one says only what its build and group allow.
 * Rule checks, not word pins, so the copy can still be improved. If a test fails, fix the copy.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { en, testflightCopy } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const { whatToTest, invitation, groupLines, feedbackEmailPlaceholder, deleteAccountLine } = testflightCopy;
const ALL = leaves(testflightCopy, 'testflight').filter((l) => l.path !== 'testflight.feedbackEmailPlaceholder');
const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

const WHAT_TO_TEST: Leaf[] = [
  { path: 'whatToTest.build1', text: whatToTest.build1 },
  { path: 'whatToTest.build2', text: whatToTest.build2 },
  // Build 2 for a build with the Delete account row on (D-129). It gets every check the other texts get.
  { path: 'whatToTest.build2WithDeleteRow', text: whatToTest.build2WithDeleteRow },
];
/** Texts a tester reads before sending feedback: each must carry the ask (B1-11, B2-20). */
const ASKED: Leaf[] = [...WHAT_TO_TEST, ...leaves(invitation, 'invitation')];
/** Texts a friend can read. Build 1 goes to Friends; build 2 may, after the R-17 sign-off. */
const FRIENDS_READ: Leaf[] = [
  ...WHAT_TO_TEST,
  { path: 'invitation.friends', text: invitation.friends },
  { path: 'invitation.friendsServersOn', text: invitation.friendsServersOn },
  { path: 'betaAppDescription', text: testflightCopy.betaAppDescription },
];

describe('[RA-16-01] TestFlight texts: content rules', () => {
  it('finds every text it checks', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(10);
  });

  it('has no em dashes, en dashes, curly quotes, ellipsis characters or emoji', () => {
    expect(offenders(ALL, /[—–‘’“”…]/)).toEqual([]);
    expect(offenders(ALL, /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('uses no exclamation marks, and no placeholder but the feedback mailbox', () => {
    expect(feedbackEmailPlaceholder).toBe('{feedbackEmail}');
    expect(offenders(ALL, /!/)).toEqual([]);
    const other = ALL.flatMap((l) => [...l.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1])).filter((p) => p !== 'feedbackEmail');
    expect(other).toEqual([]);
    expect(offenders(ALL, /\$\{/)).toEqual([]);
  });

  it('has no fear, guilt or loss language', () => {
    expect(
      offenders(ALL, /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|lose|regrets?|never get back|die|dies|died|dying|death|dead|passed away)\b/i),
    ).toEqual([]);
  });

  it('never implies the app writes for you, and names no machine', () => {
    // "model" alone is allowed: the feedback line names the phone's model. A machine model is not.
    expect(offenders(ALL, /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing)|machine|(?:language|speech) models?|transcri\w*)\b/)).toEqual([]);
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
    // D-139: the descriptor changed with the founder's positioning decision.
    expect(testflightCopy.betaAppDescription.startsWith(`${brand.name}: letters to your child, in your own words and voice.`)).toBe(true);
    expect(offenders(ALL, /\b(?:the|a) memory book you fill by talking\b/i)).toEqual([]);
    expect(offenders(ALL, /(?<!")Not much today(?!")/)).toEqual([]);
    expect(offenders(ALL, /\b(magic link|log ?in|login|log out|co-?parent|partner|spouse|journal|diary|entry|entries|voice note)\b/i)).toEqual([]);
  });

  it('types the public name only through packages/brand, and no email address at all (AF-11)', () => {
    expect(ALL.some((l) => l.text.includes(brand.name))).toBe(true);
    expect(offenders(ALL, /@|\bhello\b|mailto:/i)).toEqual([]);
  });
});

describe('[RA-16-01] TestFlight texts: the tester notice (TESTFLIGHT_TESTERS on #195)', () => {
  it('caps each text at 4,000 characters (Apple field limit not stated in the API reference, so the plan sets it)', () => {
    for (const l of ALL) expect(l.text.length, l.path).toBeLessThanOrEqual(4000);
  });

  it("asks testers never to put a child's name or a letter's words into feedback, in every text they read (B1-11, B2-20)", () => {
    for (const l of ASKED) expect(l.text, l.path).toMatch(/never put your child's name or your letters' words in/);
  });

  it('says what TestFlight sends, that a screenshot shows the screen, and how to stop, in every What to Test (5.1)', () => {
    for (const l of WHAT_TO_TEST) {
      expect(l.text, l.path).toContain(testflightCopy.feedbackLine);
      expect(l.text, l.path).toMatch(/Feedback you send leaves the phone, and so can a crash report/);
    }
    expect(testflightCopy.feedbackLine).toMatch(/your name, your email address and details about your phone/);
    expect(testflightCopy.feedbackLine).toMatch(/A screenshot shows whatever is on your screen/);
    expect(testflightCopy.feedbackLine).toMatch(/stop testing at any time in TestFlight, and ask us to delete your feedback/);
  });

  it('says who can see feedback with one line per group, never the old single line (5.3)', () => {
    expect(offenders(ALL, /other testers on the team/i)).toEqual([]);
    for (const l of WHAT_TO_TEST) {
      expect(l.text, l.path).toContain(groupLines.family);
      expect(l.text, l.path).toContain(groupLines.friends);
    }
    expect(invitation.family).toContain(groupLines.family);
    expect(invitation.friends).toContain(groupLines.friends);
    expect(invitation.friendsServersOn).toContain(groupLines.friends);
    expect(groupLines.family).toMatch(/name and email address of every tester/);
    expect(groupLines.friends).toMatch(/off for this group/);
    expect(groupLines.friends).toMatch(/Only the founder reads it/);
  });

  it('never offers Friends in-app screenshot feedback, only the feedback mailbox (4.2)', () => {
    const OFFER = /take a screenshot|share it as feedback|from inside the app(?! is off)/i;
    expect(offenders(FRIENDS_READ, OFFER)).toEqual([]);
    for (const l of [...WHAT_TO_TEST, { path: 'invitation.friends', text: invitation.friends }]) {
      expect(l.text, l.path).toContain(feedbackEmailPlaceholder);
    }
  });

  it('says early test, 18 or older, and that purchases cost nothing, where the notice asks (5.1)', () => {
    for (const t of [testflightCopy.betaAppDescription, invitation.family, invitation.friends, invitation.friendsServersOn]) {
      expect(t).toMatch(/early test/);
      expect(t).toMatch(/18 or older/);
    }
    expect(testflightCopy.betaAppDescription).toMatch(/Purchases in this test cost nothing/);
    for (const l of WHAT_TO_TEST) expect(l.text, l.path).toMatch(/Purchases in this test cost nothing/);
  });

  it('never says everything stays on the phone: feedback and crash reports leave it (5.2)', () => {
    expect(offenders(ALL, /everything (?:stays )?on (?:this|your) phone|keeps everything/i)).toEqual([]);
  });

  it('build 1 (servers off) says there is no account, and promises no sign-in, sync, sharing or backup', () => {
    for (const t of [whatToTest.build1, invitation.friends]) {
      expect(t).toMatch(/no account/);
      expect(t).not.toMatch(/\bsync|\binvite\b|Family tab|signing in|sign in|backup|backed up/i);
    }
  });

  it('build 2 (servers on) says what reaches the test server, that the policies apply, and claims no on-device-only letters', () => {
    // Both forms of build 2 (D-129): the default, and the one for a build with the Delete account row on.
    for (const build2 of [whatToTest.build2, whatToTest.build2WithDeleteRow]) {
      expect(build2).toMatch(/stored on our test server/);
      expect(build2).toMatch(/Privacy Policy and Terms you agree to in the app apply to this test/);
      // Backup is not in build 2 (EXPO_PUBLIC_BACKUP off in eas.json), so no text may offer to turn it on.
      expect(build2).toMatch(/Recordings are not uploaded in this test/);
      expect(build2).not.toMatch(/\bbackup\b|turn it on/i);
      expect(build2).toMatch(/Export your book/);
    }
    for (const t of [whatToTest.build2, whatToTest.build2WithDeleteRow, invitation.friendsServersOn]) {
      expect(t).not.toMatch(/stays? (?:only )?on (?:this|your) phone|only on (?:this|your) phone|backed up|encrypt/i);
    }
    // Never that letters carry over to the App Store version (5.2).
    expect(offenders(ALL, /carr(?:y|ies) over|move to the App Store version/i)).toEqual([]);
  });

  it('the beta app description holds for both builds: no sign-in, sync, sharing or on-device-only claim', () => {
    expect(testflightCopy.betaAppDescription).not.toMatch(/\bsync|sign-in|sign in|invite|share|sharing|everything on your phone|only on|stay on/i);
  });
});

describe('[D-129] build 2 and the Delete account row: the sentence is in the text only for a build where the row is on', () => {
  const { build2, build2WithDeleteRow } = whatToTest;

  it('the sentence names the row as Settings has it', () => {
    expect(deleteAccountLine).toMatch(/\buse Settings, /);
    expect(deleteAccountLine.endsWith(`Settings, ${en.settingsHome.deleteAccountLabel}.`)).toBe(true);
  });

  it('the default build 2 text does not say it, and promises no other way to delete an account', () => {
    expect(build2).not.toContain(deleteAccountLine);
    expect(build2).not.toMatch(/Delete account|delete your account|its letters, use/i);
  });

  it('the text for a build with the row on has the sentence exactly once, ending the paragraph about the App Store version', () => {
    expect(build2WithDeleteRow.split(deleteAccountLine)).toHaveLength(2);
    expect(build2WithDeleteRow).toContain(`Export your book, now and then. ${deleteAccountLine}\n\n`);
  });

  it('the two forms differ by that sentence and nothing else', () => {
    expect(build2WithDeleteRow).not.toBe(build2);
    expect(build2WithDeleteRow.replace(` ${deleteAccountLine}`, '')).toBe(build2);
  });

  it('nothing else the file says mentions the row: build 1 has no account, and the invitations and the description say nothing about deleting one', () => {
    const others = ALL.filter((l) => !['testflight.deleteAccountLine', 'testflight.whatToTest.build2WithDeleteRow'].includes(l.path));
    expect(others.length).toBeGreaterThanOrEqual(8);
    expect(offenders(others, /Delete account|delete your account/i)).toEqual([]);
  });
});
