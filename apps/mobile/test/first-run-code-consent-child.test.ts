/**
 * Account-first slice 3: the code screen with its recovery set (NX-36 S5), the sensitive-data consent sheet (S6), the
 * child step with an optional name (S7), the hand-off from the Welcome into them and the merge-back wiring (NX-36 4.2).
 * Pure rules in Node plus source patterns for the wiring; nothing here runs on a phone. Titles that NX-36 section 12 or
 * NX-31 section 14 list are used word for word ([NX-36-S7], [NX-31-R11]); the rest carry the same ids as working
 * labels (NX-36 lists no S5 or S6 title). Fictional Asha family only; no address or code is written to a log.
 */
import { authCopy, en } from '@scribe/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { firstRunBookNames, firstRunChildBlock } from '../src/components/onboarding/child-step.logic';
import { coverName } from '../src/components/book/book-cover.logic';
import { fill } from '../src/lib/copy';
import { backShown, childNameFieldWords, consentHandoff, firstRunStartStep, recoverySet, shouldAnnounceRecovery } from '../src/lib/first-run/handoff.logic';
import { signInErrorMessage } from '../src/lib/first-run/welcome.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const code = src('app', '(auth)', 'sign-in', 'code.tsx');
const consent = src('app', '(auth)', 'sign-in', 'consent.tsx');
const email = src('app', '(auth)', 'sign-in', 'email.tsx');
const onboarding = src('app', 'onboarding.tsx');
const welcome = src('components', 'onboarding', 'welcome-sign-in.tsx');
const uncomment = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const WAIT = 60_000;
const today = '2026-10-04';
const born = { expecting: false, birthday: '2026-03-01', dueDate: null, today };

describe('[NX-31-R11] the code screen recovery set', () => {
  it('[NX-31-R11] after 60 seconds three recoveries are shown', () => {
    const r = recoverySet({ sentAt: 1_000, now: 1_000 + WAIT, waitMs: WAIT, appleAvailable: true });
    expect(r).toEqual({ open: true, options: ['resend', 'differentEmail', 'apple'], waitLineShown: false });
  });
  it('[NX-36-S5] before 60 seconds there is only the wait line, no ticking number', () => {
    const r = recoverySet({ sentAt: 1_000, now: 1_000 + WAIT - 1, waitMs: WAIT, appleAvailable: true });
    expect(r).toEqual({ open: false, options: [], waitLineShown: true });
    expect(authCopy.code.resendWait).not.toMatch(/\d/);
  });
  it('[NX-36-S5] with Apple not available the other two still show, so there is no dead end', () => {
    expect(recoverySet({ sentAt: 0, now: WAIT, waitMs: WAIT, appleAvailable: false }).options).toEqual(['resend', 'differentEmail']);
  });
  it('[NX-36-S5] a restart with no known send time shows the set at once (the address is asked again)', () => {
    expect(recoverySet({ sentAt: null, now: 5, waitMs: WAIT, appleAvailable: true }).open).toBe(true);
  });
  it('[NX-36-S5] the arrival is announced once, as a change, never on a screen that was already open', () => {
    expect(shouldAnnounceRecovery(false, true)).toBe(true);
    expect(shouldAnnounceRecovery(true, true)).toBe(false);
    expect(shouldAnnounceRecovery(false, false)).toBe(false);
    expect(authCopy.code.announceResend).toBe('You can send another email.');
  });
  it('[NX-36-S5] the screen draws the set from recoverySet, Apple is the native button, the help line comes before the trouble link', () => {
    const c = uncomment(code);
    expect(c).toMatch(/recoverySet\(\{/);
    expect(c).toMatch(/<AppleButton signIn\b/);
    expect(c).toMatch(/announce\(k\.announceResend\)/);
    expect(c.indexOf('k.noMailHelp')).toBeGreaterThan(c.indexOf('<AppleButton'));
    expect(c.indexOf('k.noMailHelp')).toBeLessThan(c.indexOf('copy.auth.troubleButton'));
    expect(c).toMatch(/appleSignInAvailable\(\)/);
    expect(c).toMatch(/signInErrorMessage\(/);
  });
  it('[NX-36-S5] no credential, address or code is logged', () => {
    expect(uncomment(code)).not.toMatch(/console\.|\blog\(/);
  });
});

describe('[NX-36-S5] first-run words carry no "Your letters are safe" (a new install has no letters)', () => {
  it('[NX-36-S5] a phone with no book reads the first-run variants; a phone with a book keeps the existing words (#735 removed the claim there too)', () => {
    for (const kind of ['network', 'code_paused', 'consent_unavailable', 'unknown', 'provider', 'rate_limited', 'email_wait', 'not_available'] as const) {
      expect(signInErrorMessage(kind, false), kind).not.toMatch(/letters are safe/i);
      // #735 took "Your letters are safe" out of the existing lines too; a phone with a book keeps those lines, whatever they now say.
      expect(signInErrorMessage(kind, true), kind).toBe(authCopy.errors[kind]);
    }
    expect(signInErrorMessage('wrong_code', false)).toBe(authCopy.errors.wrong_code);
    expect(signInErrorMessage('cancelled', false)).toBeNull();
    expect(signInErrorMessage(null, true)).toBeNull();
  });
  it('[NX-36-S5] the email, code and consent screens choose the words by whether the phone holds a book', () => {
    expect(uncomment(email)).toMatch(/signInErrorMessage\(error, /);
    expect(uncomment(consent)).toMatch(/signInErrorMessage\(s\.error, children\.length > 0\)/);
  });
  it('[NX-36-S5] the new strings say nothing about recordings being kept, backed up or safe', () => {
    const fresh = [authCopy.code.noMailHelp, authCopy.code.announceResend, ...Object.values(authCopy.firstRun.errors), en.onboarding.child.nameOptionalLabel, en.onboarding.child.nameOptionalHelp];
    for (const t of fresh) {
      expect(t).not.toMatch(/\b(safe|backup|backed up|recording|AI)\b/i);
      expect(t).not.toMatch(/[–—‘’“”…]/);
    }
  });
});

describe('[NX-36-S6] the sensitive-data consent sheet', () => {
  it('[NX-36-S6] Agree with letters on this phone goes to the claim screen; a decline keeps the book and stays signed in; nothing else is asked', () => {
    expect(consentHandoff({ status: 'ready', sync: 'on', claimPending: true })).toBe('askClaim');
    expect(consentHandoff({ status: 'ready', sync: 'off', claimPending: false })).toBe('keepOnPhone');
    expect(consentHandoff({ status: 'ready', sync: 'on', claimPending: false })).toBe('continue');
    expect(consentHandoff({ status: 'needsConsent', sync: null, claimPending: false })).toBe('continue');
  });
  it('[NX-36-S6] the sheet asks consentHandoff for the claim step, and uploads nothing itself', () => {
    const c = uncomment(consent);
    expect(c).toMatch(/consentHandoff\(\{/);
    expect(c).toMatch(/const claiming = handoff === 'askClaim'/);
    expect(c).not.toMatch(/lib\/sync|startSync|syncAllowed/);
    // consentHandoff states its own two-line rule; it does not borrow merge-back.logic (that file's cases 4 and 5 are not shipped).
    expect(src('lib', 'first-run', 'handoff.logic.ts')).not.toMatch(/merge-back\.logic|mergeBack\(/);
  });
  it('[NX-36-S6] consentHandoff over every input: the claim screen only for agreed + ready + letters on this phone, keep only for a decline', () => {
    for (const status of ['restoring', 'signedOut', 'signingIn', 'checkingConsent', 'needsConsent', 'ready', 'signingOut'] as const)
      for (const sync of ['on', 'off', 'unknown', null] as const)
        for (const claimPending of [true, false]) {
          const want = status !== 'ready' ? 'continue' : sync === 'off' ? 'keepOnPhone' : sync === 'on' && claimPending ? 'askClaim' : 'continue';
          expect(consentHandoff({ status, sync, claimPending }), `${status}/${sync}/${claimPending}`).toBe(want);
        }
  });
  it('[NX-36-S6] Agree and Keep on this phone stay the same size, stacked, not pre-selected, with the registered words', () => {
    expect(consent).toMatch(/label=\{sc\.agreeButton\}/);
    expect(consent).toMatch(/label=\{sc\.declineButton\}/);
    expect(en.sensitiveConsent.declineButton.length).toBeLessThanOrEqual(22);
    expect(en.sensitiveConsent.agreeButton.length).toBeLessThanOrEqual(22);
  });
  it('[NX-36-S6] a nameless child reads "your child" in the registered body', () => {
    expect(fill(en.sensitiveConsent.body, { child: '' })).toContain('your child');
    expect(fill(en.sensitiveConsent.body, { child: '' })).not.toMatch(/\{child\}|undefined/);
  });
});

describe('[NX-36-S7] the child step', () => {
  it('[NX-36-S7] an empty name with a date makes the book; the cover and reason line read the fallback', () => {
    expect(firstRunChildBlock({ names: [''], ...born })).toBeNull();
    expect(firstRunBookNames([''])).toEqual(['']);
    // the reason line while the date is missing says "your child", never an empty quote
    const waiting = firstRunChildBlock({ names: [''], expecting: false, birthday: null, dueDate: null, today });
    expect(waiting).toContain('your child');
    expect(waiting).not.toMatch(/undefined|''|"\s*"/);
    // the cover is handed the empty name and sets no line for it (no "undefined", no fallback typed onto the cover)
    expect(coverName('', 'sm', 'closed').lines.join('')).toBe('');
    expect(onboarding).toMatch(/<BookCover name=\{coverName\} size="sm"/);
  });
  it('[NX-36-S7] the account-first name field says "Name, if you like" with its help; other builds keep "Name"', () => {
    const w = { nameLabel: en.onboarding.child.nameLabel, nameOptionalLabel: en.onboarding.child.nameOptionalLabel, nameOptionalHelp: en.onboarding.child.nameOptionalHelp };
    expect(childNameFieldWords({ accountFirst: true, index: 0, nearLimit: false, multiple: false }, w)).toEqual({ label: 'Name, if you like', help: 'You can add a name later.' });
    expect(childNameFieldWords({ accountFirst: false, index: 0, nearLimit: false, multiple: false }, w)).toEqual({ label: 'Name', help: null });
    // the limit line and the twins line win the help slot; a second child's name is not "optional"
    expect(childNameFieldWords({ accountFirst: true, index: 0, nearLimit: true, multiple: false }, w).help).toBeNull();
    expect(childNameFieldWords({ accountFirst: true, index: 1, nearLimit: false, multiple: true }, w).label).toBe(w.nameLabel);
  });
  it('[NX-36-S7] the date stays required and twins still need each name', () => {
    expect(firstRunChildBlock({ names: ['Asha'], expecting: false, birthday: null, dueDate: null, today })).toContain('Asha');
    expect(firstRunChildBlock({ names: ['Asha', ''], ...born })).toBe(en.onboarding.child.needNameMany);
  });
});

describe('[NX-31-R4] the hand-off from the Welcome', () => {
  it('[NX-31-R4] signed in opens on the promise step, the local start on the child step, a plain phone on the Welcome', () => {
    expect(firstRunStartStep({ serverFeatures: true, hasSession: true, localStartChosen: false })).toBe('promise');
    expect(firstRunStartStep({ serverFeatures: true, hasSession: false, localStartChosen: true })).toBe('child');
    expect(firstRunStartStep({ serverFeatures: true, hasSession: false, localStartChosen: false })).toBe('welcome');
  });
  it('[NX-31-R4] with the switch off the first step is the Welcome in every state, so the build is unchanged', () => {
    for (const hasSession of [true, false]) for (const localStartChosen of [true, false]) {
      expect(firstRunStartStep({ serverFeatures: false, hasSession, localStartChosen })).toBe('welcome');
    }
    for (const step of ['promise', 'child', 'signsAs', 'finish'] as const) expect(backShown({ accountFirst: false, step })).toBe(true);
    expect(childNameFieldWords({ accountFirst: false, index: 0, nearLimit: false, multiple: false }, { nameLabel: 'Name', nameOptionalLabel: 'x', nameOptionalHelp: 'y' }).label).toBe('Name');
  });
  it('[NX-31-R4] a signed-in parent is never sent back to the signed-out Welcome by Back', () => {
    expect(backShown({ accountFirst: true, step: 'promise' })).toBe(false);
    expect(backShown({ accountFirst: true, step: 'child' })).toBe(true);
    expect(backShown({ accountFirst: true, step: 'welcome' })).toBe(false);
  });
  it('[NX-31-R4] the route opens FirstRunSteps with the start step and keeps the JSX the servers-off test pins', () => {
    expect(onboarding).toMatch(/return <FirstRunSteps localStartChosen=\{route\.localStartChosen\} onPastWelcome=\{route\.markPastWelcome\} \/>;/);
    expect(onboarding).toMatch(/useState<Step>\(\(\) =>\s*firstRunStartStep\(/);
    expect(onboarding).toMatch(/const ORDER: Step\[\] = \['welcome', 'promise', 'child', 'signsAs', 'finish'\];/);
  });
  it('[NX-36-S2] the Welcome still hands both doors to the existing sheet (email to /sign-in/email, Apple to the consent step)', () => {
    expect(welcome).toMatch(/router\.push\('\/sign-in\/email'\)/);
    expect(welcome).toMatch(/router\.push\('\/sign-in\/consent'\)/);
  });
});
