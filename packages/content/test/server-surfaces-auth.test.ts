/**
 * Experience pass, October 2026: package P8a, sign-in and Account (docs/design/EXPERIENCE_PASS_2026-10.md,
 * chapter 7, S52 to S56; section 6 "P8 Server surfaces", Tests). Over P8a's copy file,
 * `packages/content/src/features/auth.en.ts` (`authCopy`):
 *
 * - every CHG and NEW of chapter 7, word for word, and every RET key gone (P8 deletes its own RET keys);
 * - registered disclosure text (docs/legal/in-app-disclosures.md 3a; S55's `consent.terms.*`) word for word;
 * - the words around the sign-in sheet's reassurance and the age step.
 * The content rules over this file (no "we" outside the disclosure keys, buttons of 22 characters or fewer, the
 * placeholders it may use, no "photos", "only you", "only your family's keys" or "end-to-end", "stays on this phone"
 * only where it is true, US spelling) run in rules.test.ts, from the row for `authCopy` in
 * test/support/copy-surfaces.ts, together with every other content rule (dashes, quotes, emoji, gendering, streaks).
 */
import { describe, expect, it } from 'vitest';
import { authCopy, en } from '../src';
import { AUTH_WE_ALLOWED, SURFACES } from './support/copy-surfaces';

const at = (path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), authCopy);

/** Chapter 7's CHG and NEW rows in auth.en.ts, as the spec words them (S52 to S56). */
const CHAPTER_7: Record<string, string> = {
  // S52
  'sheet.titles.invite': 'Sign in to join the book',
  'sheet.bodies.first_letter': "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
  'sheet.bodies.settings': "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
  'sheet.bodies.invite': 'You each write from your own phone, in the same book.',
  'sheet.bodies.invite_create': 'You both sign in, each on your own phone.',
  'sheet.notConfigured': 'Signing in is not available right now. Your letters are safe on this phone.',
  'errors.network': 'Your letters are safe on this phone. Sign in once you are back online.',
  'errors.expired': 'That link has expired. Send a new email for a fresh one.',
  // Led with "Your letters are safe." as the S52 table now words them (amended 28 Oct, #360); the earlier words follow.
  'errors.not_available': "Your letters are safe. This way of signing in isn't available right now. Try another way.",
  'errors.code_paused': 'Your letters are safe. You can try a code again in 15 minutes.',
  // SIGN-01 (comms validation, 31 Oct 2026): no length the app cannot know, no provider the build may not offer.
  'errors.rate_limited': 'Your letters are safe. Too many tries for now. Wait a few minutes, then try again.',
  'errors.email_wait': "Your letters are safe. Another email can't be sent just yet. Wait a few minutes, then try again.",
  // LNG-05: the stock "That did not work this time" says what did not finish.
  'errors.provider': 'Your letters are safe. That sign-in did not finish. Try again, or try another way.',
  'errors.session_expired': 'Your letters are safe on this phone. Sign in again to keep sharing them.',
  'errors.consent_unavailable': 'Your letters are safe on this phone. Setting up your account did not finish. Try again.',
  'errors.unknown': 'That did not go through. Your letters are safe on this phone.',
  // S53
  'email.help': 'A link and a code arrive by email. No password to remember.',
  // S54
  'code.sentToEmail': 'A link and a code are on their way to {email}.',
  'code.emailLabel': 'Your email address',
  // S56
  'account.signedOutBody': "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
  'account.syncLabel': 'Sync and sharing',
  'account.sync.waiting': 'Not set up yet',
  'account.signOutBody': 'Your letters stay on this phone. Sign in again any time.',
  'account.signOutWaiting': 'Your newest letters are still on their way. This phone signs out once they are sent.',
};

/** Chapter 7's KEEP rows: the words stay as they were on develop. */
const KEPT: Record<string, string> = {
  'sheet.titles.first_letter': "Keep {child}'s book on any phone",
  'sheet.titles.invite_create': 'Sign in to invite a co-parent',
  'sheet.titles.sign_in': 'Welcome back',
  'sheet.titles.settings': 'Sign in',
  'sheet.bodies.sign_in': 'Sign in the same way as last time to see every letter.',
  // LNG-13: the BRAND.md glossary's button names, the words the emails use.
  'sheet.google': 'Sign in with Google',
  'sheet.email': 'Sign in with email',
  'sheet.passkey': 'Use a passkey',
  'sheet.later': 'Not now',
  'sheet.busy': 'Signing you in',
  'sheet.lastMethod.apple': 'Last time you used Apple.',
  'errors.wrong_code': "That code didn't match. Check the newest email, or send a new one.",
  'errors.invalid_email': "That email doesn't look quite right.",
  'errors.under_18': '{app} is currently for adults 18 and over.',
  'email.title': 'Sign in with email',
  'email.label': 'Email',
  'email.placeholder': 'you@example.com',
  'email.send': 'Send link',
  'code.title': 'Check your email',
  'code.body': 'Tap the link on this phone, or type the code here.',
  'code.label': 'Code',
  'code.verify': 'Continue',
  'code.openMail': 'Open Mail',
  'code.resend': 'Send a new email',
  'code.resendWait': 'You can send another in a minute.',
  'code.resent': 'A new email is on its way.',
  'code.differentEmail': 'Use a different email',
  'verify.title': 'Signing you in',
  'verify.typeCode': 'Type the code instead',
  'verify.newEmail': 'Send a new email',
  'consent.age.body': 'Are you 18 or older?',
  'consent.age.yes': 'Yes',
  'consent.age.no': 'No',
  'consent.settingUp': 'Setting up your account',
  'consent.noBook.title': 'No book here yet',
  'consent.noBook.body': 'Did you use a different way to sign in last time?',
  'consent.noBook.tryAnother': 'Try another way',
  'consent.noBook.startBook': 'Start a book',
  'account.title': 'Account',
  'account.signedOutTitle': 'Not signed in',
  'account.signIn': 'Sign in',
  'account.signedInWith.apple': 'Signed in with Apple',
  'account.signedInWith.google': 'Signed in with Google',
  'account.signedInWith.email': 'Signed in with email',
  'account.syncTitle': 'Sync',
  'account.sync.on': 'On',
  'account.sync.off': 'Off, kept on this phone',
  'account.sync.unknown': 'Waiting for a connection',
  'account.finishSetup': 'Finish setting up',
  'account.devicesTitle': 'Devices',
  'account.signOut': 'Sign out',
  'account.signOutTitle': 'Sign out on this phone?',
  'account.cancel': 'Cancel',
};

/**
 * Added by the P8a critics' pass fixes (docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md S1 and S2, the coordinator's
 * rulings, then the lens fixes A1 and A2; the spec lines are P7-7's to add). `lettersSafe` is errors.network's first
 * sentence, the same words. `pausedOtherWays` replaces S1's `pausedOtherWay`, which said a new email does not help:
 * the new email's link does sign in (verifyEmailLink never reads the pause, F02-U14).
 */
const CRITICS: Record<string, string> = {
  'code.lettersSafe': 'Your letters are safe on this phone.',
  'code.pausedOtherWays': 'The link in the newest email still works, and so do the other ways to sign in.',
};

/** RET in chapter 7: no longer shown, and every reader was a P8 file, so P8a deletes them (section 6). */
const RETIRED = ['code.sentTo', 'consent.age.title', 'consent.age.help'];

/** BL-451 (the sign-out wait's follow-ups, after #359): words for "Stay signed in" and a wait that ended early. */
const BL_451: Record<string, string> = {
  'account.staySignedIn': 'Stay signed in',
  'account.signOutEarly': 'Your newest letters are kept on this phone. They are sent the next time you sign in to this account.',
};

/**
 * BL-488 (P8a critics L6 and L7): the claim step's primary names the account, not the phone ("Keep them here" could be read
 * as this phone, and the choice is this account), and AccountGate's branch for a signed-in phone whose gate could not be
 * read (offline, a server error or the 10 second timeout), which names the connection instead of telling a signed-in person
 * to sign in (`errors.network` ends "Sign in once you are back online") or assuming the phone is offline.
 */
const BL_488: Record<string, string> = {
  'claim.keep': 'Keep in this account',
  'account.gateOffline': "You're signed in. This needs a connection. Try again in a moment.",
};

/**
 * Registered disclosure text, word for word (in-app-disclosures.md 3a, and S55's `consent.terms.*`, KEEP verbatim under
 * LEGAL-REQ-001 and -006). `consent.terms.healthLink` stays until #163 lands (the coordinator's ruling, 28 Oct).
 */
const REGISTERED: Record<string, string> = {
  'sheet.privacy': 'Only you and the people you invite can read your letters. We never sell them or use them for ads.',
  'sheet.emailUse': 'We use your email only to sign you in and to write to you about your account.',
  'sheet.why': 'An account keeps your book safe when you change phones.',
  'consent.terms.title': 'Before your book syncs',
  'consent.terms.body':
    'Your letters stay private to you and the family you invite. We never sell them, use them for ads or use them to train machine learning models.',
  'consent.terms.agreeLine': 'By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.',
  'consent.terms.termsLink': 'Terms of Service',
  'consent.terms.privacyLink': 'Privacy Policy',
  'consent.terms.healthLink': 'Consumer Health Data Privacy Policy',
  'consent.terms.agree': 'Agree and continue',
  'consent.terms.notNow': 'Not now',
};

describe('[EXPERIENCE_PASS_2026-10 P8a] chapter 7 words in authCopy', () => {
  it('has every CHG and NEW row of S52 to S56, word for word', () => {
    for (const [key, words] of Object.entries(CHAPTER_7)) expect(at(key), key).toBe(words);
  });

  it('keeps every KEEP row as it was', () => {
    for (const [key, words] of Object.entries(KEPT)) expect(at(key), key).toBe(words);
  });

  it('has the lines the critics\' fixes added, word for word; the waiting line is errors.network\'s first sentence', () => {
    for (const [key, words] of Object.entries(CRITICS)) expect(at(key), key).toBe(words);
    expect(authCopy.errors.network.startsWith(`${authCopy.code.lettersSafe} `)).toBe(true);
    // The pause line (lens A2): only typing a code waits. The email's link and Apple or Google still sign in, and it
    // neither blames nor counts down (code_paused already says 15 minutes, once, as a fact).
    expect(authCopy.code.pausedOtherWays).toMatch(/link in the newest email still works/);
    // SIGN-01, BL-475 point 3: no provider is named, since a build may offer neither.
    expect(authCopy.code.pausedOtherWays).not.toMatch(/Apple|Google/);
    expect(authCopy.code.pausedOtherWays).not.toMatch(/\d|minute|second|wrong|too many|you /i);
    expect(authCopy.errors.code_paused).toMatch(/try a code again/);
    for (const line of [authCopy.errors.rate_limited, authCopy.errors.email_wait]) {
      expect(line).not.toMatch(/Apple|Google|an hour|\d/);
      expect(line).toMatch(/a few minutes/);
    }
  });

  it('deletes the RET keys it stopped showing (no P7 clean-up left for P8)', () => {
    for (const key of RETIRED) expect(at(key), key).toBeUndefined();
    expect(Object.keys(authCopy.consent.age).sort()).toEqual(['body', 'no', 'yes']);
  });

  it('has the BL-451 lines word for word', () => {
    for (const [key, words] of Object.entries(BL_451)) expect(at(key), key).toBe(words);
  });

  it('has the BL-488 lines word for word: the claim label names the account and fits a button, the gate line for a signed-in phone names the connection', () => {
    for (const [key, words] of Object.entries(BL_488)) expect(at(key), key).toBe(words);
    // A button may have 22 characters (the rule in rules.test.ts, from the AUTH_BUTTONS row of copy-surfaces.ts).
    expect(authCopy.claim.keep.length).toBeLessThanOrEqual(22);
    expect(authCopy.claim.keep).toMatch(/\baccount\b/);
    expect(authCopy.claim.keep).not.toMatch(/\bhere\b/i);
    // The claim step's buttons answer its question about the account: keep them in this one, or this is not mine.
    expect(authCopy.claim.title).toMatch(/in this account\?$/);
    expect(authCopy.claim.notMine).toBe('Not my account');
    // The gate line is for a person who is signed in: it never says to sign in, and it is not the signed-out network line.
    expect(authCopy.account.gateOffline).toMatch(/connection/);
    expect(authCopy.account.gateOffline).not.toMatch(/\bsign in\b/i);
    // The gate is also unread after a server error or the 10 second timeout on a live connection, so the line never
    // says the phone is offline or that it should come back online.
    expect(authCopy.account.gateOffline).not.toMatch(/offline|back online|\bonline\b/i);
    expect(authCopy.account.gateOffline).not.toBe(authCopy.errors.network);
    expect(authCopy.errors.network).toMatch(/Sign in once you are back online\.$/);
  });

  it('leaves registered disclosure text word for word, and the privacy line is trust.signIn.privacy itself', () => {
    for (const [key, words] of Object.entries(REGISTERED)) expect(at(key), key).toBe(words);
    // The only keys rules.test.ts lets say "we" are registered text, and the sign-in row widens no exception by prefix.
    for (const key of AUTH_WE_ALLOWED) expect(key in REGISTERED, key).toBe(true);
    const row = SURFACES.find((s) => s.feature === 'auth')!;
    expect(row.we.allowed).toEqual([...AUTH_WE_ALLOWED]);
    expect(row.we.allowedPrefixes).toBeUndefined();
    for (const b of row.banned) {
      expect(b.allowedPrefixes, b.name).toBeUndefined();
      for (const key of b.allowed ?? []) expect(key in REGISTERED, `${b.name}: ${key}`).toBe(true);
    }
    expect(authCopy.sheet.privacy).toBe(en.trust.signIn.privacy);
    expect(authCopy.sheet.emailUse).toBe(en.trust.signIn.email);
    expect(authCopy.sheet.why).toBe(en.trust.signIn.why);
  });

  it("Account's signed-out body is S52's body, word for word (S56)", () => {
    expect(authCopy.account.signedOutBody).toBe(authCopy.sheet.bodies.first_letter);
    expect(authCopy.sheet.bodies.settings).toBe(authCopy.sheet.bodies.first_letter);
  });

  it('leads with the reassurance after every service- or network-caused failure; input errors keep the table words (S52)', () => {
    // The rule, as the amended S52 table words it (28 Oct, #360): an error the person cannot fix by typing (offline,
    // the provider, a lost session, setup, or a pause the service sets after too many emails or codes) says the
    // letters are safe as its first sentence. An error fixed by typing again (a wrong or expired code, an address)
    // keeps its words. `unknown` says it second. Every error is in exactly one list, so a new key must be placed.
    const SAFE = /^Your letters are safe(?: on this phone)?\./;
    const LEADS = ['network', 'session_expired', 'consent_unavailable', 'provider', 'not_available', 'rate_limited', 'email_wait', 'code_paused'];
    const SECOND = ['unknown'];
    const INPUT = ['wrong_code', 'expired', 'invalid_email'];
    const NOT_A_FAILED_ATTEMPT = ['under_18', 'other_phone', 'other_phone_spent', 'already_signed_in'];
    const errors = authCopy.errors as Record<string, string>;
    expect(Object.keys(errors).sort()).toEqual([...LEADS, ...SECOND, ...INPUT, ...NOT_A_FAILED_ATTEMPT].sort());
    for (const kind of LEADS) expect(errors[kind], kind).toMatch(SAFE);
    for (const kind of SECOND) {
      expect(errors[kind], kind).not.toMatch(SAFE);
      expect(errors[kind], kind).toMatch(/\. Your letters are safe on this phone\.$/);
    }
    for (const kind of [...INPUT, ...NOT_A_FAILED_ATTEMPT]) expect(errors[kind], kind).not.toMatch(/letters are safe/);
    // The four the ruling changed keep their table words after the new first sentence.
    expect(errors.provider).toBe('Your letters are safe. That sign-in did not finish. Try again, or try another way.');
    expect(authCopy.sheet.notConfigured).toContain('Your letters are safe on this phone.');
  });

  it('the age step has only the question and its two answers (S55, LEGAL-REQ-002: nothing explains or hints)', () => {
    expect(authCopy.consent.age).toEqual({ body: 'Are you 18 or older?', yes: 'Yes', no: 'No' });
    expect(authCopy.consent.age.body).toBe(en.ageGate.title);
    expect(authCopy.consent.age.yes).toBe(en.ageGate.yesButton);
    expect(authCopy.consent.age.no).toBe(en.ageGate.noButton);
  });
});
