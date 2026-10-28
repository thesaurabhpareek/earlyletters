/**
 * Experience pass, October 2026: package P8a, sign-in and Account (docs/design/EXPERIENCE_PASS_2026-10.md,
 * chapter 7, S52 to S56; section 6 "P8 Server surfaces", Tests). Over P8a's copy file,
 * `packages/content/src/features/auth.en.ts` (`authCopy`):
 *
 * - every CHG and NEW of chapter 7, word for word, and every RET key gone (P8 deletes its own RET keys);
 * - registered disclosure text (docs/legal/in-app-disclosures.md 3a; S55's `consent.terms.*`) word for word;
 * - no "we" or "our" outside the disclosure keys chapter 7 keeps verbatim;
 * - buttons of 22 characters or fewer, as written and with the Asha fixtures;
 * - only the placeholders this file may use;
 * - no "photos", no "only you" (outside the registered privacy line), "only your family's keys" or
 *   "end-to-end";
 * - "stay on this phone" or "stays on this phone" only where it is true (`account.signOutBody`);
 * - US spelling.
 * rules.test.ts already runs every content rule (dashes, quotes, emoji, gendering, streaks) over this file.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { authCopy, en } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const ALL: Leaf[] = leaves(authCopy);
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
  'errors.rate_limited': 'Your letters are safe. Sign-in emails are paused for an hour. Use Apple or Google, or try again later.',
  'errors.provider': 'Your letters are safe. That did not work this time. Try again, or try another way.',
  'errors.session_expired': 'Your letters are safe on this phone. Sign in again to keep sharing them.',
  'errors.consent_unavailable': 'Your letters are safe on this phone. Setting up your account did not finish. Try again.',
  'errors.unknown': 'That did not work this time. Your letters are safe on this phone.',
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
  'sheet.google': 'Continue with Google',
  'sheet.email': 'Continue with email',
  'sheet.passkey': 'Use a passkey',
  'sheet.later': 'Not now',
  'sheet.busy': 'Signing you in',
  'sheet.lastMethod.apple': 'Last time you used Apple.',
  'errors.wrong_code': "That code didn't match. Check the newest email, or send a new one.",
  'errors.invalid_email': "That email doesn't look quite right.",
  'errors.under_18': '{app} is currently for adults 18 and over.',
  'email.title': 'Continue with email',
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

/** BL-451 (the sign-out wait's follow-ups, after #359): words for "Stay signed in" and a wait that ended early. */
const BL_451: Record<string, string> = {
  'account.staySignedIn': 'Stay signed in',
  'account.signOutEarly': 'Your newest letters are kept on this phone. They are sent the next time you sign in to this account.',
};

/** RET in chapter 7: no longer shown, and every reader was a P8 file, so P8a deletes them (section 6). */
const RETIRED = ['code.sentTo', 'consent.age.title', 'consent.age.help'];

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

/** The disclosure keys chapter 7 keeps verbatim, the only ones that may say "we" (S52 `sheet.privacy`, S55 `consent.terms.*`). */
const WE_ALLOWED = new Set(['sheet.privacy', 'sheet.emailUse', 'consent.terms.body']);

/** Every string these screens put on a button (the file names its keys by meaning, not by a Button suffix). */
const BUTTONS = [
  'sheet.google',
  'sheet.email',
  'sheet.passkey',
  'sheet.later',
  'email.send',
  'code.verify',
  'code.openMail',
  'code.resend',
  'code.differentEmail',
  'verify.typeCode',
  'verify.newEmail',
  'verify.close',
  'claim.keep',
  'claim.notMine',
  'consent.terms.agree',
  'consent.terms.notNow',
  'consent.age.yes',
  'consent.age.no',
  'consent.noBook.tryAnother',
  'consent.noBook.startBook',
  'account.signIn',
  'account.signOut',
  'account.staySignedIn',
  'account.cancel',
  'account.removePasskey',
  // Shown inside a busy button.
  'sheet.busy',
];

/** The Asha fixtures (CLAUDE.md: tests use the fictional family "Asha"). */
const ASHA: Record<string, string> = { app: brand.name, child: 'Asha', email: 'mama@example.invalid' };
const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => ASHA[k] ?? m);

describe('[EXPERIENCE_PASS_2026-10 P8a] chapter 7 words in authCopy', () => {
  it('has every CHG and NEW row of S52 to S56, word for word', () => {
    for (const [key, words] of Object.entries(CHAPTER_7)) expect(at(key), key).toBe(words);
  });

  it('keeps every KEEP row as it was', () => {
    for (const [key, words] of Object.entries(KEPT)) expect(at(key), key).toBe(words);
  });

  it('has the BL-451 lines word for word', () => {
    for (const [key, words] of Object.entries(BL_451)) expect(at(key), key).toBe(words);
  });

  it('deletes the RET keys it stopped showing (no P7 clean-up left for P8)', () => {
    for (const key of RETIRED) expect(at(key), key).toBeUndefined();
    expect(Object.keys(authCopy.consent.age).sort()).toEqual(['body', 'no', 'yes']);
  });

  it('leaves registered disclosure text word for word, and the privacy line is trust.signIn.privacy itself', () => {
    for (const [key, words] of Object.entries(REGISTERED)) expect(at(key), key).toBe(words);
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
    const LEADS = ['network', 'session_expired', 'consent_unavailable', 'provider', 'not_available', 'rate_limited', 'code_paused'];
    const SECOND = ['unknown'];
    const INPUT = ['wrong_code', 'expired', 'invalid_email'];
    const NOT_A_FAILED_ATTEMPT = ['under_18', 'other_phone', 'already_signed_in'];
    const errors = authCopy.errors as Record<string, string>;
    expect(Object.keys(errors).sort()).toEqual([...LEADS, ...SECOND, ...INPUT, ...NOT_A_FAILED_ATTEMPT].sort());
    for (const kind of LEADS) expect(errors[kind], kind).toMatch(SAFE);
    for (const kind of SECOND) {
      expect(errors[kind], kind).not.toMatch(SAFE);
      expect(errors[kind], kind).toMatch(/\. Your letters are safe on this phone\.$/);
    }
    for (const kind of [...INPUT, ...NOT_A_FAILED_ATTEMPT]) expect(errors[kind], kind).not.toMatch(/letters are safe/);
    // The four the ruling changed keep their table words after the new first sentence.
    expect(errors.provider).toBe('Your letters are safe. That did not work this time. Try again, or try another way.');
    expect(authCopy.sheet.notConfigured).toContain('Your letters are safe on this phone.');
  });

  it('the age step has only the question and its two answers (S55, LEGAL-REQ-002: nothing explains or hints)', () => {
    expect(authCopy.consent.age).toEqual({ body: 'Are you 18 or older?', yes: 'Yes', no: 'No' });
    expect(authCopy.consent.age.body).toBe(en.ageGate.title);
    expect(authCopy.consent.age.yes).toBe(en.ageGate.yesButton);
    expect(authCopy.consent.age.no).toBe(en.ageGate.noButton);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P8a] rules on every string in authCopy', () => {
  it('says "we" or "our" only in the disclosure keys chapter 7 keeps verbatim', () => {
    const bad = ALL.filter((l) => !WE_ALLOWED.has(l.path) && /\b(?:we|our|us)\b/i.test(l.text));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    for (const key of WE_ALLOWED) expect(key in REGISTERED, key).toBe(true);
  });

  it('keeps every button label to 22 characters, as written and with the Asha fixtures', () => {
    for (const key of BUTTONS) {
      const text = at(key);
      expect(typeof text, key).toBe('string');
      expect((text as string).length, key).toBeLessThanOrEqual(22);
      expect(fill(text as string).length, key).toBeLessThanOrEqual(22);
    }
  });

  it('uses only {child}, {app} and {email}', () => {
    const used = ALL.flatMap((l) => [...l.text.matchAll(/\{(\w+)\}/g)].map((m) => `${l.path}: ${m[1]}`));
    expect(used.filter((u) => !/: (?:child|app|email)$/.test(u))).toEqual([]);
    // {email} only where an address is shown: the code screen and the claim screen (a masked address).
    expect(ALL.filter((l) => l.text.includes('{email}')).map((l) => l.path).sort()).toEqual(['claim.body', 'code.sentToEmail']);
  });

  it('never says photos, end-to-end, "only your family\'s keys", or "only you" outside the registered privacy line', () => {
    const bad = ALL.filter((l) => /\bphotos?\b|end-to-end|only your family'?s keys/i.test(l.text) || (l.path !== 'sheet.privacy' && /\bonly you\b/i.test(l.text)));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('says letters stay on this phone only where it is true (signing out leaves them in place)', () => {
    const STAY = /\bstays? on (?:this|your|the) phone\b/i;
    expect(ALL.filter((l) => STAY.test(l.text)).map((l) => l.path)).toEqual(['account.signOutBody']);
  });

  it('never says "in this build", and no error sounds like a chat bot', () => {
    expect(ALL.filter((l) => /in this build|let's|that's a lot|something went wrong|please\b/i.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('spells for the US storefront', () => {
    const UK =
      /\b(?:colour|favour|behaviour|honour|organis|recognis|realis|apologis|authoris|centre|licence|cancelled|travelling|programme|catalogue|whilst|amongst|learnt|spelt|enrol|mobile data|straight away|full stops?)/i;
    expect(ALL.filter((l) => UK.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});
