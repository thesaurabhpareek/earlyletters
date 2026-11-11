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
import { authReducer, type AuthEvent, type AuthState } from '../src/lib/auth/machine.logic';
import { backShown, childNameFieldWords, consentHandoff, dateBlockShown, firstRunStartStep, hasSessionState, recoverySet, reportsPastWelcome, shouldAnnounceRecovery, welcomeHandoffStep } from '../src/lib/first-run/handoff.logic';

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
    const r = recoverySet({ sentAt: 1_000, now: 1_000 + WAIT, waitMs: WAIT, appleAvailable: true, signedIn: false });
    expect(r).toEqual({ open: true, options: ['resend', 'differentEmail', 'apple'], waitLineShown: false });
  });
  it('[NX-36-S5] before 60 seconds there is only the wait line, no ticking number', () => {
    const r = recoverySet({ sentAt: 1_000, now: 1_000 + WAIT - 1, waitMs: WAIT, appleAvailable: true, signedIn: false });
    expect(r).toEqual({ open: false, options: [], waitLineShown: true });
    expect(authCopy.code.resendWait).not.toMatch(/\d/);
  });
  it('[NX-36-S5] with Apple not available the other two still show, so there is no dead end', () => {
    expect(recoverySet({ sentAt: 0, now: WAIT, waitMs: WAIT, appleAvailable: false, signedIn: false }).options).toEqual(['resend', 'differentEmail']);
  });
  it('[NX-36-S5] a restart with no known send time shows the set at once (the address is asked again)', () => {
    expect(recoverySet({ sentAt: null, now: 5, waitMs: WAIT, appleAvailable: true, signedIn: false }).open).toBe(true);
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
  });
  it('[NX-36-S5] the screen tells recoverySet whether a session exists, from the same hasSessionState the first-run start reads', () => {
    const c = uncomment(code);
    expect(c).toMatch(/const sentAt = auth\.state\.status === 'awaitingCode' \? auth\.state\.sentAt : null;/);
    expect(c).toMatch(/recoverySet\(\{ sentAt, now, waitMs: RESEND_WAIT_MS, appleAvailable: appleReady, signedIn: hasSessionState\(auth\.state\) \}\);/);
    expect(c).toMatch(/import \{ hasSessionState, recoverySet, shouldAnnounceRecovery \} from '@\/lib\/first-run\/handoff\.logic';/);
  });
  it('[NX-36-S5] no credential, address or code is logged', () => {
    expect(uncomment(code)).not.toMatch(/console\.|\blog\(/);
  });
  it('[NX-36-S5] once signed in the set is closed with nothing to offer, whatever the send time was', () => {
    for (const sentAt of [null, 1_000, 0]) {
      expect(recoverySet({ sentAt, now: 1_000 + WAIT * 2, waitMs: WAIT, appleAvailable: true, signedIn: true })).toEqual({ open: false, options: [], waitLineShown: false });
    }
  });
  it('[NX-36-S5] hasSessionState is true from the moment a session exists, and not before', () => {
    const states: AuthState[] = [
      { status: 'restoring' },
      { status: 'signedOut' },
      { status: 'signingIn', method: 'apple' },
      { status: 'awaitingCode', sentAt: 0 },
      { status: 'checkingConsent', userId: 'u', method: 'email' },
      { status: 'needsConsent', userId: 'u', method: 'email', steps: ['terms'] },
      { status: 'ready', userId: 'u', sync: 'on' },
      { status: 'signingOut', userId: 'u', reason: 'user', waitingForUploads: false, sync: 'on' },
    ];
    expect(states.map(hasSessionState)).toEqual([false, false, false, false, true, true, true, true]);
  });
});

/**
 * The code screen's set at each step, computed the way code.tsx does (its sentAt, its signedIn, its wasOpen ref), through
 * the REAL reducer, so what a person hears is what is tested. Fictional Asha family only.
 */
const screenSet = (state: AuthState, now: number) =>
  recoverySet({ sentAt: state.status === 'awaitingCode' ? state.sentAt : null, now, waitMs: WAIT, appleAvailable: true, signedIn: hasSessionState(state) });

function walk(initial: AuthState, mountedAt: number, steps: { now: number; event?: AuthEvent }[]) {
  let state = initial;
  let was = screenSet(state, mountedAt).open; // the ref is set at mount, so arrival is never announced
  return steps.map(({ now, event }) => {
    if (event) state = authReducer(state, event);
    const set = screenSet(state, now);
    const row = { status: state.status, open: set.open, options: set.options, announce: shouldAnnounceRecovery(was, set.open) };
    was = set.open;
    return row;
  });
}
const SENT: AuthState = { status: 'awaitingCode', sentAt: 0 };
const signedInEvent: AuthEvent = { type: 'SIGNED_IN', userId: 'asha-parent', method: 'email' };

describe('[NX-36-S5] the set and its announcement through the real reducer', () => {
  it('[NX-36-S5] a code typed (or the Mail link) inside the first minute: no flip to open, nothing announced, nothing drawn at sign-in', () => {
    const rows = walk(SENT, 1_000, [{ now: 1_000 }, { now: 10_000, event: signedInEvent }, { now: 10_050 }, { now: 11_000 }]);
    expect(rows.map((r) => r.status)).toEqual(['awaitingCode', 'checkingConsent', 'checkingConsent', 'checkingConsent']);
    expect(rows.map((r) => r.open)).toEqual([false, false, false, false]);
    expect(rows.map((r) => r.announce)).toEqual([false, false, false, false]);
    expect(rows[1].options).toEqual([]);
  });
  it('[NX-36-S5] Apple tapped on the screen after the minute: the set stays open while signing in, then closes at success, and says nothing', () => {
    const rows = walk(SENT, 1_000, [
      { now: 61_000 },
      { now: 62_000, event: { type: 'START', method: 'apple' } },
      { now: 63_000, event: { type: 'SIGNED_IN', userId: 'asha-parent', method: 'apple' } },
    ]);
    expect(rows.map((r) => r.status)).toEqual(['awaitingCode', 'signingIn', 'checkingConsent']);
    expect(rows.map((r) => r.open)).toEqual([true, true, false]);
    expect(rows.map((r) => r.announce)).toEqual([true, false, false]);
    expect(rows[2].options).toEqual([]);
  });
  it('[NX-36-S5] waiting: one announcement, at the minute, and not again', () => {
    const rows = walk(SENT, 1_000, [{ now: 1_000 }, { now: 59_999 }, { now: 60_000 }, { now: 61_000 }, { now: 120_000 }]);
    expect(rows.map((r) => r.open)).toEqual([false, false, true, true, true]);
    expect(rows.map((r) => r.announce)).toEqual([false, false, true, false, false]);
    expect(rows[2].options).toEqual(['resend', 'differentEmail', 'apple']);
  });
  it('[NX-36-S5] a new email sent after the minute starts the wait again, and announces again at its own minute', () => {
    const rows = walk(SENT, 1_000, [
      { now: 61_000 },
      { now: 70_000, event: { type: 'START', method: 'email' } },
      { now: 71_000, event: { type: 'EMAIL_SENT', at: 71_000 } },
      { now: 130_999 },
      { now: 131_000 },
    ]);
    expect(rows.map((r) => r.open)).toEqual([true, true, false, false, true]);
    expect(rows.map((r) => r.announce)).toEqual([true, false, false, false, true]);
  });
  it('[NX-36-S5] the restart case (the app restarted, the address is asked again): the set is open from the start and arrival says nothing', () => {
    const rows = walk({ status: 'signedOut' }, 5_000, [{ now: 5_000 }]);
    expect(rows[0]).toMatchObject({ open: true, announce: false });
    expect(rows[0].options).toEqual(['resend', 'differentEmail', 'apple']);
  });
});

describe('[NX-36-S5] the new words on the code screen and the child step', () => {
  it('[NX-36-S5] the code screen, the email screen and the consent sheet keep the error words they had before the recovery set (no first-run variants)', () => {
    expect(uncomment(code)).toMatch(/const message = paused \? `\$\{authErrorMessage\('code_paused'\)\} \$\{k\.pausedOtherWays\}` : authErrorMessage\(error\);/);
    expect(uncomment(email)).toMatch(/authErrorMessage\(error\)/);
    expect(uncomment(consent)).toMatch(/const error = authErrorMessage\(s\.error\);/);
    for (const text of [code, email, consent, src('lib', 'first-run', 'welcome.logic.ts')]) expect(text).not.toMatch(/signInErrorMessage|holdsBook/);
    // Only the Welcome's own failure line is a first-run word; the rest of the lines are the existing ones.
    expect(Object.keys(authCopy.firstRun.errors)).toEqual(['provider']);
  });
  it('[NX-36-S5] the new strings say nothing about recordings being kept, backed up or safe', () => {
    const fresh = [authCopy.code.noMailHelp, authCopy.code.announceResend, en.onboarding.child.nameOptionalLabel, en.onboarding.child.nameOptionalHelp];
    for (const t of fresh) {
      expect(t).not.toMatch(/\b(safe|backup|backed up|recording|AI)\b/i);
      expect(t).not.toMatch(/[\u2013\u2014\u2018\u2019\u201c\u201d\u2026]/);
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
    // the limit line wins the help slot; a second child's name is not "optional"
    expect(childNameFieldWords({ accountFirst: true, index: 0, nearLimit: true, multiple: false }, w).help).toBeNull();
    expect(childNameFieldWords({ accountFirst: true, index: 1, nearLimit: false, multiple: true }, w).label).toBe(w.nameLabel);
  });
  it('[NX-36-S7] once "Add another child" is tapped the first row is "Name" too, because Continue then waits for every name', () => {
    const w = { nameLabel: en.onboarding.child.nameLabel, nameOptionalLabel: en.onboarding.child.nameOptionalLabel, nameOptionalHelp: en.onboarding.child.nameOptionalHelp };
    expect(childNameFieldWords({ accountFirst: true, index: 0, nearLimit: false, multiple: true }, w)).toEqual({ label: 'Name', help: null });
    // the rule the label must agree with: with two rows an empty first name makes Continue wait
    expect(firstRunChildBlock({ names: ['', 'Dev'], ...born })).toBe(en.onboarding.child.needNameMany);
    expect(firstRunChildBlock({ names: [''], ...born })).toBeNull();
    expect(uncomment(onboarding)).toMatch(/multiple: names\.length > 1/);
  });
  it('[NX-36-S7] the date stays required and twins still need each name', () => {
    expect(firstRunChildBlock({ names: ['Asha'], expecting: false, birthday: null, dueDate: null, today })).toContain('Asha');
    expect(firstRunChildBlock({ names: ['Asha', ''], ...born })).toBe(en.onboarding.child.needNameMany);
  });
  it('[NX-31-R3] the birthday control is drawn whenever the name is optional: all four combinations of dateShown and accountFirst', () => {
    const table: { dateShown: boolean; accountFirst: boolean; shown: boolean }[] = [
      { dateShown: false, accountFirst: false, shown: false }, // servers off, nothing typed yet: the old flow, the block waits for the first letter
      { dateShown: true, accountFirst: false, shown: true }, // servers off, a letter is in: as before
      { dateShown: false, accountFirst: true, shown: true }, // account first, name left empty: the block is there from the start
      { dateShown: true, accountFirst: true, shown: true },
    ];
    for (const row of table) expect(dateBlockShown(row), JSON.stringify(row)).toBe(row.shown);
  });
  it('[NX-31-R3] an empty name with no date waits on a birthday, so the control for it must be on screen; with a date nothing waits', () => {
    // The situation the table above answers: one empty name (the person left it alone), no date chosen yet.
    const waiting = firstRunChildBlock({ names: [''], expecting: false, birthday: null, dueDate: null, today });
    expect(waiting).toBe(fill(en.onboarding.child.needBirthday, { child: en.onboarding.childFallback }));
    // Continue waits on the birthday, and account first nothing else could have been typed: dateShown is still false.
    expect(dateBlockShown({ dateShown: false, accountFirst: true })).toBe(true);
    // Expecting is the other branch of the same wait.
    expect(firstRunChildBlock({ names: [''], expecting: true, birthday: null, dueDate: null, today })).toBe(en.onboarding.child.needDueDate);
    // With the date chosen from that control, the whole path completes with no name typed.
    expect(firstRunChildBlock({ names: [''], ...born })).toBeNull();
    expect(firstRunChildBlock({ names: [''], expecting: true, birthday: null, dueDate: '2027-01-15', today })).toBeNull();
  });
  it('[NX-31-R3] the child step draws the date block through dateBlockShown, and an account-first block does not animate in a second time inside the step that already does', () => {
    const o = uncomment(onboarding);
    expect(o).toMatch(/\{dateBlockShown\(\{ dateShown, accountFirst \}\) \? \(\s*<Animated\.View entering=\{accountFirst \? undefined : motion\.enter\(\)\} className="gap-4">\s*<ChoiceGroup/);
    expect(o).not.toMatch(/\{dateShown \? \(/);
    // the old reveal stays for the old flow: the effect that sets dateShown on the first letter is unchanged
    expect(o).toMatch(/useEffect\(\(\) => \{\s*if \(names\[0\]\?\.trim\(\)\) setDateShown\(true\);\s*\}, \[names\]\);/);
    // the name fields come first in the step, then the block: the reading order is the name, then the date
    expect(o.indexOf('{names.map((n, i) => (')).toBeLessThan(o.indexOf('dateBlockShown({ dateShown, accountFirst })'));
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
  it('[NX-31-R4] the Back button is decided by backShown (not by "any step but the welcome"), from the same accountFirst the name field reads', () => {
    const o = uncomment(onboarding);
    expect(o).toMatch(/\{backShown\(\{ accountFirst, step \}\) && <BackButton onPress=\{back\} \/>\}/);
    expect(o).not.toMatch(/step !== 'welcome' && <BackButton/);
    expect(o).toMatch(/const accountFirst = start !== 'welcome';/);
  });
  it('[NX-31-R4] a signed-in person opens on the promise step because the start step is given hasSessionState(authState), not a constant', () => {
    expect(uncomment(onboarding)).toMatch(/firstRunStartStep\(\{ serverFeatures: serverFeaturesEnabled\(\) && configured, hasSession: hasSessionState\(authState\), localStartChosen: chosenOnOutage \}\)/);
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

describe('[NX-31-R4] a signed-in start hands a returning account\'s book over, and reports past the Welcome only when it has moved on', () => {
  const steps = ['welcome', 'promise', 'child', 'signsAs', 'finish'] as const;
  it('[NX-31-R4] the hand-over is asked as the welcome for the signed-in start on the promise step only, never for a later step or another start', () => {
    for (const start of steps) {
      for (const step of steps) {
        const want = start === 'promise' && step === 'promise' ? 'welcome' : step;
        expect(welcomeHandoffStep({ start, step }), `${start}/${step}`).toBe(want);
      }
    }
    // Moved on (child, signature, last): never mapped, so first run makes its own book there.
    for (const step of ['child', 'signsAs', 'finish'] as const) expect(welcomeHandoffStep({ start: 'promise', step })).toBe(step);
  });
  it('[NX-31-R4] onboarding asks the mapped step, and its dependency list reads what the mapping reads', () => {
    const o = uncomment(onboarding);
    expect(o).toMatch(/const handoffStep = welcomeHandoffStep\(\{ start, step \}\);/);
    expect(o).toMatch(/if \(!welcomeMayLeave\(handoffStep, pathname\)\) return;/);
    expect(o).toMatch(/\}, \[handoffStep, pathname\]\);/);
    expect(o).not.toMatch(/welcomeMayLeave\(step, pathname\)/);
  });
  it('[NX-31-R4] the signed-in start reports past the Welcome once it moves off the promise step; the local start at once; the Welcome start as before', () => {
    expect(reportsPastWelcome({ start: 'promise', step: 'promise' })).toBe(false);
    for (const step of ['child', 'signsAs', 'finish'] as const) expect(reportsPastWelcome({ start: 'promise', step })).toBe(true);
    // The local start (no session) opens on the child step: nothing waits for a name to be typed.
    for (const step of ['promise', 'child', 'signsAs', 'finish'] as const) expect(reportsPastWelcome({ start: 'child', step })).toBe(true);
    // The Welcome start, and every servers-off build, is the old rule: past once it leaves the Welcome.
    expect(reportsPastWelcome({ start: 'welcome', step: 'welcome' })).toBe(false);
    for (const step of ['promise', 'child', 'signsAs', 'finish'] as const) expect(reportsPastWelcome({ start: 'welcome', step })).toBe(true);
  });
  it('[NX-31-R4] the steps ask reportsPastWelcome in the one effect that tells the route', () => {
    const o = uncomment(onboarding);
    expect(o).toMatch(/useEffect\(\(\) => \{\s*if \(reportsPastWelcome\(\{ start, step \}\)\) onPastWelcome\?\.\(\);\s*\}, \[start, step, onPastWelcome\]\);/);
    expect(o.match(/onPastWelcome\?\.\(\)/g)).toHaveLength(1);
  });
});
