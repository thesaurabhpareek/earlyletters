/**
 * The sign-in-first gate, the outage and offline path, and the local start (NX-31 revision 3, R17, R18, R19, R22; NX-36 S2, S3).
 * Pure, no phone, no network. The 24-case table is QA's (docs/qa/BUILD12-CUT-DEVICE-AND-TRACE-2026-11-09.md section 9):
 * answered Yes on screen 1 (yes, no, not asked) x the screen-2 state (healthy, sign-in failed, timed out at 10 s, offline)
 * x the compiled constant (on, off). The local start shows only for Yes, a failure state and the constant on.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthErrorKind, AuthState } from '../src/lib/auth/machine.logic';
import {
  LOCAL_START_FALLBACK,
  SIGN_IN_OUTAGE_MS,
  beginTheBookAllowed,
  firstRunGate,
  gateInputsFromAuth,
  screenTwoInputs,
  type AgeAnswer,
  type FirstRunGateInput,
  type ScreenTwoState,
} from '../src/lib/first-run/gate.logic';

const base: FirstRunGateInput = {
  serverFeatures: true,
  ageAnswered: 'yes',
  hasSession: false,
  hasLocalBook: false,
  online: true,
  signInFailed: false,
  localStartFallback: true,
};
const gate = (over: Partial<FirstRunGateInput>) => firstRunGate({ ...base, ...over });

const AGES: AgeAnswer[] = ['yes', 'no', 'notAsked'];
const STATES: ScreenTwoState[] = ['healthy', 'failed', 'timedOut', 'offline'];

describe('[NX-31-R18] the local start truth table (3 x 4 x 2 = 24 cases)', () => {
  for (const age of AGES) {
    for (const state of STATES) {
      for (const constant of [true, false]) {
        const shows = age === 'yes' && state !== 'healthy' && constant;
        it(`[NX-31-R18] age ${age}, screen 2 ${state}, constant ${constant ? 'on' : 'off'}: button ${shows ? 'shows' : 'never shows'}`, () => {
          const r = gate({ ageAnswered: age, localStartFallback: constant, ...screenTwoInputs(state) });
          expect(r.localStartOffered).toBe(shows);
        });
      }
    }
  }
  it('[NX-31-R18] the table has 24 cases', () => {
    expect(AGES.length * STATES.length * 2).toBe(24);
  });
  it('[NX-31-R18] an answer No never offers the button, and no book can be made', () => {
    for (const state of STATES) {
      const r = gate({ ageAnswered: 'no', ...screenTwoInputs(state) });
      expect(r.localStartOffered).toBe(false);
      expect(r.step).toBe('stop');
    }
  });
  it('[NX-31-R18] a healthy screen 2 is the sign-in screen, a failure is the outage screen', () => {
    expect(gate(screenTwoInputs('healthy')).step).toBe('signIn');
    expect(gate(screenTwoInputs('failed')).step).toBe('outage');
    expect(gate(screenTwoInputs('timedOut')).step).toBe('outage');
  });
  it('[NX-31-R18] the 10 second timeout is the session gate timeout', () => {
    expect(SIGN_IN_OUTAGE_MS).toBe(10_000);
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'auth', 'session-provider.tsx'), 'utf8');
    expect(src).toMatch(/GATE_TIMEOUT_MS = 10_000/);
  });
  it('[NX-31-R18] the constant is compiled in: no environment variable, no remote config', () => {
    expect(typeof LOCAL_START_FALLBACK).toBe('boolean');
    expect(LOCAL_START_FALLBACK).toBe(true);
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'first-run', 'gate.logic.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/process\.env|remote|fetch\(|getSetting/i);
    expect(code).toMatch(/export const LOCAL_START_FALLBACK = true;/);
  });
  it('[NX-31-R18] the local start, once chosen, goes to the child step without a session, and only when it was allowed', () => {
    expect(gate({ ...screenTwoInputs('offline'), localStartChosen: true }).step).toBe('childStep');
    // chosen, but the constant is off or the answer was not Yes: ignored
    expect(gate({ ...screenTwoInputs('offline'), localStartChosen: true, localStartFallback: false }).step).toBe('outage');
    expect(gate({ ...screenTwoInputs('offline'), localStartChosen: true, ageAnswered: 'no' }).step).toBe('stop');
    expect(gate({ ...screenTwoInputs('offline'), localStartChosen: true, ageAnswered: 'notAsked' }).step).toBe('ageGate');
    // chosen, then the service is healthy again: still on the local path, not bounced back to sign-in
    expect(gate({ ...screenTwoInputs('healthy'), localStartChosen: true }).step).toBe('childStep');
  });
});

describe('[NX-31-R19] offline first launch', () => {
  it('[NX-31-R19] offline after Yes is the offline variant of the outage screen, with the button when allowed', () => {
    const r = gate(screenTwoInputs('offline'));
    expect(r.step).toBe('outage');
    expect(r.outage).toBe('offline');
    expect(r.localStartOffered).toBe(true);
    expect(r.retryOnReconnect).toBe(true);
  });
  it('[NX-31-R19] a failure online is the outage variant, not the offline one', () => {
    expect(gate(screenTwoInputs('failed')).outage).toBe('outage');
    expect(gate(screenTwoInputs('timedOut')).outage).toBe('outage');
  });
  it('[NX-31-R19] offline and a failure together read as offline (the radio is the cause)', () => {
    expect(gate({ online: false, signInFailed: true }).outage).toBe('offline');
  });
  it('[NX-31-R19] no variant carries an error code or a retry limit, and a healthy screen has no outage variant', () => {
    expect(gate(screenTwoInputs('healthy')).outage).toBeNull();
    expect(gate(screenTwoInputs('healthy')).retryOnReconnect).toBe(false);
  });
  it('[NX-31-R19] offline does not stop screen 1: the age question is asked offline', () => {
    expect(gate({ ageAnswered: 'notAsked', online: false }).step).toBe('ageGate');
  });
  it('[NX-31-R19] offline with the constant off is still the offline screen, without the button', () => {
    const r = gate({ online: false, localStartFallback: false });
    expect(r.step).toBe('outage');
    expect(r.localStartOffered).toBe(false);
  });
});

describe('[NX-31-R17] the sign-in-first gate', () => {
  it('[NX-31-R17] a fresh install that passed screen 1 goes to sign-in, not the child step', () => {
    expect(gate({}).step).toBe('signIn');
  });
  it('[NX-31-R17] the question comes first, and an under-18 answer stops', () => {
    expect(gate({ ageAnswered: 'notAsked' }).step).toBe('ageGate');
    expect(gate({ ageAnswered: 'no' }).step).toBe('stop');
  });
  it('[NX-31-R17] no child step without a session: every no-session, no-book combination refuses it', () => {
    for (const age of AGES) for (const online of [true, false]) for (const failed of [true, false]) for (const constant of [true, false]) {
      const r = gate({ ageAnswered: age, online, signInFailed: failed, localStartFallback: constant });
      expect(r.step).not.toBe('childStep');
      expect(r.step).not.toBe('openTonight');
      expect(r.mayBeginBook).toBe(false);
    }
  });
  it('[NX-31-R17] a session and no book, once the account has said it is new, goes to the child step (NX-36-S17: not before), a signed-in parent is never sent back to sign-in', () => {
    for (const online of [true, false]) for (const failed of [true, false]) {
      const r = gate({ hasSession: true, online, signInFailed: failed, newPhone: 'new' });
      expect(r.step).toBe('childStep');
      expect(r.mayBeginBook).toBe(true);
      expect(r.localStartOffered).toBe(false);
    }
  });
  it('[NX-31-R17] the same two buttons serve a new and a returning parent: one step, no separate returning branch', () => {
    // "I already have a book" on a new phone is just sign-in: no session means signIn whatever the person is.
    expect(gate({}).step).toBe('signIn');
  });
  it('[NX-31-R17] with server features off the gate is a no-op', () => {
    for (const age of AGES) for (const session of [true, false]) for (const book of [true, false]) for (const online of [true, false])
      for (const failed of [true, false]) for (const constant of [true, false]) for (const chosen of [true, false]) {
        const r = gate({
          serverFeatures: false, ageAnswered: age, hasSession: session, hasLocalBook: book,
          online, signInFailed: failed, localStartFallback: constant, localStartChosen: chosen,
        });
        expect(r).toEqual({ step: 'unchanged', outage: null, localStartOffered: false, retryOnReconnect: false, mayBeginBook: true, offerSignIn: false, arrivedFromAccount: false });
      }
    // The adapter used by the route also does nothing with the switch off, whatever the auth state says.
    for (const status of ['restoring', 'signedOut'] as const) {
      expect(beginTheBookAllowed(gateInputsFromAuth({ serverFeatures: false, authState: { status }, hasLocalBook: false }))).toBe(true);
    }
  });
  it('[NX-31-R17] the onboarding route asks the gate only through route.logic and composes nothing itself', () => {
    // The behaviour is tested in first-run-route.test.ts. This pins that the route calls it with the pieces it owns.
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
    expect(src).toMatch(/const showContinue = continueMayShow\(\{\s*begin: joining\.begin,\s*onWelcome: step === 'welcome',\s*authState,\s*localStartChosen,\s*hasLocalBook: \(\) => listChildren\(\)\.length > 0,\s*\}\);/);
    expect(src).toMatch(/if \(continueTapIsLocalStart\(\{ onWelcome: step === 'welcome', authState \}\)\) setLocalStartChosen\(true\);/);
    // No second copy of the composition, and the switch is not read in the screen.
    expect(src).not.toMatch(/gateInputsFromAuth|beginTheBookAllowed/);
    // The one other read of the switch is the opening step (handoff.logic firstRunStartStep, #728), never the gate's composition.
    const reads = src.match(/serverFeaturesEnabled\(\)/g) ?? [];
    expect(reads.length).toBe((src.match(/firstRunStartStep\(\{ serverFeatures: serverFeaturesEnabled\(\)/g) ?? []).length);
  });
  it('[NX-31-R17] while the session is being read the book cannot begin (no flash of a child step)', () => {
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'restoring' }, hasLocalBook: false });
    expect(beginTheBookAllowed(inputs)).toBe(false);
  });
  it('[NX-31-R17] a signed-in state, in every signed-in status, allows the book', () => {
    const signedInStates: AuthState[] = [
      { status: 'checkingConsent', userId: 'u', method: null },
      { status: 'needsConsent', userId: 'u', method: null, steps: ['terms'] },
      { status: 'ready', userId: 'u', sync: 'on' },
    ];
    for (const authState of signedInStates) {
      // NX-36-S17: once the account has said it is new. Before that the gate holds the opening screen (test/new-phone-route.test.ts).
      expect(beginTheBookAllowed(gateInputsFromAuth({ serverFeatures: true, authState, hasLocalBook: false, newPhone: 'new' }))).toBe(true);
    }
  });
  it('[NX-31-R17] a failed sign-in in the auth state is the outage input; the local start then allows the book', () => {
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'signedOut', error: 'network' }, hasLocalBook: false });
    expect(inputs.signInFailed).toBe(true);
    expect(beginTheBookAllowed(inputs)).toBe(true);
    expect(beginTheBookAllowed({ ...inputs, localStartFallback: false })).toBe(false);
  });
});

const KINDS_AS_OUTAGE: Record<AuthErrorKind, boolean> = {
  // Sign-in cannot be reached (QA section 9: a 429 is an outage, not a wrong code).
  network: true, rate_limited: true, email_wait: true, not_available: true, unknown: true,
  // The sign-in did not finish, or the person stopped it: inline errors on screen 2, never the outage screen.
  cancelled: false, expired: false, wrong_code: false, code_paused: false, invalid_email: false, provider: false,
  session_expired: false, under_18: false, consent_unavailable: false, other_phone: false, other_phone_spent: false,
  already_signed_in: false,
};
const AUTH_STATES: Record<AuthState['status'], { state: AuthState; session: boolean }> = {
  restoring: { state: { status: 'restoring' }, session: false },
  signedOut: { state: { status: 'signedOut' }, session: false },
  signingIn: { state: { status: 'signingIn', method: 'email' }, session: false },
  awaitingCode: { state: { status: 'awaitingCode', sentAt: 1 }, session: false },
  checkingConsent: { state: { status: 'checkingConsent', userId: 'u', method: null }, session: true },
  needsConsent: { state: { status: 'needsConsent', userId: 'u', method: null, steps: ['terms'] }, session: true },
  ready: { state: { status: 'ready', userId: 'u', sync: 'on' }, session: true },
  signingOut: { state: { status: 'signingOut', userId: 'u', reason: 'user', waitingForUploads: false, sync: 'on' }, session: true },
};
const fromAuth = (authState: AuthState, over: { hasLocalBook?: boolean; localStartChosen?: boolean } = {}) =>
  gateInputsFromAuth({ serverFeatures: true, authState, hasLocalBook: false, ...over });

describe('[NX-31-R18] which sign-in failures are an outage (gateInputsFromAuth)', () => {
  it('[NX-31-R18] network, rate_limited, email_wait and unknown are outages: the local start is offered', () => {
    for (const error of ['network', 'rate_limited', 'email_wait', 'unknown'] as const) {
      const inputs = fromAuth({ status: 'signedOut', error });
      expect(inputs.signInFailed, error).toBe(true);
      expect(firstRunGate(inputs).step, error).toBe('outage');
      expect(beginTheBookAllowed(inputs), error).toBe(true);
    }
  });
  it('[NX-31-R18] wrong_code and cancelled are not outages: the person stays on sign-in, no local start', () => {
    for (const error of ['wrong_code', 'cancelled'] as const) {
      const inputs = fromAuth({ status: 'signedOut', error });
      expect(inputs.signInFailed, error).toBe(false);
      expect(firstRunGate(inputs).step, error).toBe('signIn');
      expect(beginTheBookAllowed(inputs), error).toBe(false);
    }
  });
  it('[NX-31-R18] every error kind is placed on one side (a new kind fails to compile here until it is)', () => {
    for (const [kind, outage] of Object.entries(KINDS_AS_OUTAGE) as [AuthErrorKind, boolean][]) {
      expect(fromAuth({ status: 'signedOut', error: kind }).signInFailed, kind).toBe(outage);
    }
  });
  it('[NX-31-R18] only signedOut is read: a 429 on a code check (awaitingCode) belongs to the code screen, not the gate', () => {
    expect(fromAuth({ status: 'awaitingCode', sentAt: 1, error: 'rate_limited' }).signInFailed).toBe(false);
    expect(fromAuth({ status: 'signedOut' }).signInFailed).toBe(false);
    expect(beginTheBookAllowed(fromAuth({ status: 'awaitingCode', sentAt: 1, error: 'rate_limited' }))).toBe(false);
  });
});

describe('[NX-31-R17] which auth states count as a session (gateInputsFromAuth)', () => {
  it('[NX-31-R17] checkingConsent, needsConsent, ready and signingOut are a session; the rest are not', () => {
    for (const [status, { state, session }] of Object.entries(AUTH_STATES)) {
      expect(fromAuth(state).hasSession, status).toBe(session);
    }
  });
  it('[NX-31-R17] signingOut is a session: a parent in the middle of signing out is not sent back to sign-in', () => {
    const inputs = fromAuth(AUTH_STATES.signingOut.state);
    expect(inputs.hasSession).toBe(true);
    // NX-36-S17: with no book the account is asked first (the opening screen), never sign-in; once it has said "new", the child step.
    expect(['signIn', 'outage']).not.toContain(firstRunGate(inputs).step);
    expect(firstRunGate(inputs).step).toBe('openingBook');
    expect(firstRunGate({ ...inputs, newPhone: 'new' }).step).toBe('childStep');
    expect(beginTheBookAllowed({ ...inputs, newPhone: 'new' })).toBe(true);
  });
  it('[NX-31-R17] a person with no session and no failure is held at sign-in, whichever waiting state it is', () => {
    for (const status of ['restoring', 'signedOut', 'signingIn', 'awaitingCode'] as const) {
      expect(beginTheBookAllowed(fromAuth(AUTH_STATES[status].state)), status).toBe(false);
    }
  });
});

describe('[NX-31-R22] a phone with a book is never locked out', () => {
  it('[NX-31-R22] a book and an ended session opens Tonight, with sign-in offered and not blocking, in every state', () => {
    for (const online of [true, false]) for (const failed of [true, false]) for (const constant of [true, false]) for (const age of ['yes', 'notAsked'] as const) {
      const r = gate({ hasLocalBook: true, hasSession: false, online, signInFailed: failed, localStartFallback: constant, ageAnswered: age });
      expect(r.step).toBe('openTonight');
      expect(r.offerSignIn).toBe(true);
      expect(r.mayBeginBook).toBe(true);
      expect(r.localStartOffered).toBe(false);
    }
  });
  it('[NX-31-R22] a book and a live session opens Tonight with no sign-in offer and no child step', () => {
    const r = gate({ hasLocalBook: true, hasSession: true });
    expect(r.step).toBe('openTonight');
    expect(r.offerSignIn).toBe(false);
  });
  it('[NX-31-R22] an expired session on a phone with a book never routes to sign-in, outage or the stop screen of the gate', () => {
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'signedOut', error: 'network' }, hasLocalBook: true });
    const r = firstRunGate(inputs);
    expect(['signIn', 'outage', 'childStep', 'ageGate', 'stop']).not.toContain(r.step);
    expect(beginTheBookAllowed(inputs)).toBe(true);
  });
  it('[NX-31-R22] the gate reads no input that could remove reading, recording or export: it only returns a step', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'first-run', 'gate.logic.ts'), 'utf8');
    expect(src).not.toMatch(/from '@\/lib\/(store|export|capture)/);
  });
});

describe('[NX-31-R17] gateInputsFromAuth treats a running route as age Yes only because the root gate comes first', () => {
  it('[NX-31-R17] the root layout renders the age gate instead of the session and every route until it passes', () => {
    expect(gateInputsFromAuth({ serverFeatures: true, authState: { status: 'signedOut' }, hasLocalBook: false }).ageAnswered).toBe('yes');
    const layout = readFileSync(join(__dirname, '..', 'src', 'app', '_layout.tsx'), 'utf8');
    const gateAt = layout.indexOf("gate.decision !== 'pass' ? (");
    const sessionAt = layout.indexOf('<SessionProvider');
    const stackAt = layout.indexOf('<Stack ');
    expect(gateAt).toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(sessionAt);
    expect(sessionAt).toBeLessThan(stackAt);
    expect(layout.slice(gateAt, sessionAt)).toContain('<AgeGateScreen');
  });
});
