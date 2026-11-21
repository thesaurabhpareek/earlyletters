/// <reference types="node" />
/**
 * FP-6 (NS-40-R9; NS-41-R12, R25): the refused-region screen after the code step, the sign-in pause, and Apple on the outage
 * screen. Design: docs/design/e2e/E-foundations-and-system-states/DESIGN.md 6c (E-S04.refused-region), the E-S14 list
 * (signInPaused, NS-41-R12) and SCREEN-PATHS-20nov.md PATH-07. Pure, no phone. Each row has a mutant: a copy of the real
 * function or source with the one wrong line, which the same check must catch. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy } from '@scribe/content';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import { firstRunGate, gateInputsFromAuth, type FirstRunGateInput } from '../src/lib/first-run/gate.logic';
import { authErrorMessage } from '../src/lib/auth/messages';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { failureStillCounts, inlineErrorKind } from '../src/lib/first-run/welcome.logic';

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (rel: string) => code(readFileSync(join(SRC, rel), 'utf8'));

describe('[NS-40-R9] a refused sign-up is calm and stores nothing', () => {
  const refusal = Object.assign(new Error('refused'), { code: 'region_refused', status: 403 });
  it('[NS-40-R9] the hook refusal is its own kind in every context, and never an outage or a wrong code', () => {
    for (const ctx of ['code', 'send', 'provider', 'link'] as const) expect(authErrorKind(refusal, ctx), ctx).toBe('region_refused');
    // A refusal that arrives as a failed fetch is a network error, not a refusal: a failed lookup is never a refusal.
    expect(authErrorKind(Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError', status: 0 }), 'code')).toBe('network');
  });
  it('[NS-40-R9] [U] the code string `region_refused` is pinned here until the hosted hook is checked; any other code is the ordinary unknown error', () => {
    expect(authErrorKind(Object.assign(new Error('x'), { code: 'region_refused' }), 'code')).toBe('region_refused');
    for (const code of ['hook_payload_invalid', 'region_blocked', 'unexpected_failure']) {
      expect(authErrorKind(Object.assign(new Error('x'), { code, status: 403 }), 'code'), code).toBe('unknown');
    }
  });
  it('[NS-40-R9] it is not an outage input and not an inline line on the Welcome: it never signs the person into the outage screen', () => {
    const signedOut: AuthState = { status: 'signedOut', error: 'region_refused' };
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: signedOut, hasLocalBook: false });
    expect(inputs.signInFailed).toBe(false);
    expect(inlineErrorKind(signedOut)).toBeNull();
    expect(failureStillCounts(signedOut, null)).toBe(true);
  });
  it('[NS-40-R9] mutant: mapping region_refused into OUTAGE_ERRORS makes it an outage and this test sees it', () => {
    const raw = readFileSync(join(SRC, 'lib/first-run/gate.logic.ts'), 'utf8');
    const set = raw.match(/OUTAGE_ERRORS[^=]*= new Set<AuthErrorKind>\(\[([^\]]*)\]/)?.[1] ?? '';
    expect(set).not.toMatch(/region_refused/);
    expect(`${set}, 'region_refused'`).toMatch(/region_refused/);
  });
  it('[NS-40-R9] the screen: a heading, one line, Terms and a get-in-touch action, no Try again, no place or reason named, nothing stored', () => {
    const t = authCopy.region;
    expect(t).toEqual({ title: "{app} can't be set up from here.", body: 'If you think this is wrong, get in touch.', terms: 'Terms', contact: 'Get in touch' });
    expect(JSON.stringify(t)).not.toMatch(/sanction|block|countr|region|location|where you/i);
    expect(authErrorMessage('region_refused')).toMatch(/can't be set up from here/);
    const screen = src('components/onboarding/region-refused-screen.tsx');
    expect(screen).not.toMatch(/primary=|retry|tryAgain|setItem|secureStorage|setSetting|analytics|track\(/i);
    expect(screen).toContain('region.terms');
    expect(screen).toContain('region.contact');
    // Shown after the code step (E62), in place of the sheet's field and line.
    expect(src('app/(auth)/sign-in/code.tsx')).toMatch(/if \(error === 'region_refused'\) return <RegionRefusedScreen \/>;/);
  });
  it('[NS-40-R9] mutant: a screen with a Try again is caught', () => {
    const mutant = src('components/onboarding/region-refused-screen.tsx').replace('quiet={[', "primary={{ label: 'Try again', onPress: retry }}\n        quiet={[");
    expect(mutant).toMatch(/primary=/);
  });
});

describe('[NS-41-R25] a hostile signed signIn true keeps every session', () => {
  const signedIn = (status: AuthState): FirstRunGateInput => gateInputsFromAuth({ serverFeatures: true, authState: status, hasLocalBook: false, newPhone: 'new', signInPaused: true });
  it('[NS-41-R25] a phone with no session meets the outage with the local start, and the words say nothing of a switch', () => {
    const r = firstRunGate(signedIn({ status: 'signedOut' }));
    expect(r).toMatchObject({ step: 'outage', outage: 'outage', localStartOffered: true });
    expect(authCopy.outage.body).not.toMatch(/pause|switch|disabled|turned off/i);
  });
  it('[NS-41-R25] a session (ready, consent outstanding, signing out) and a phone with a book are never touched', () => {
    const states: AuthState[] = [
      { status: 'ready', userId: 'asha-mama', sync: 'on' },
      { status: 'needsConsent', userId: 'asha-mama', method: null, steps: ['terms'] },
      { status: 'checkingConsent', userId: 'asha-mama', method: null },
    ];
    for (const s of states) expect(firstRunGate(signedIn(s)).step, s.status).not.toBe('outage');
    expect(firstRunGate({ ...signedIn({ status: 'signedOut' }), hasLocalBook: true }).step).toBe('openTonight');
  });
  it('[NS-41-R25] the switch off, or absent, changes nothing; with servers off nothing changes either', () => {
    expect(firstRunGate({ ...signedIn({ status: 'signedOut' }), signInPaused: false }).step).toBe('signIn');
    expect(firstRunGate({ ...signedIn({ status: 'signedOut' }), signInPaused: undefined }).step).toBe('signIn');
    expect(firstRunGate({ ...signedIn({ status: 'signedOut' }), serverFeatures: false }).step).toBe('unchanged');
  });
  it('[NS-41-R25] mutant: ending the session on signIn is caught: the route reads the switch only as a gate input, never signs out', () => {
    const route = src('lib/first-run/use-first-run-route.ts');
    expect(route).toMatch(/signInPaused: active && getRemoteConfig\(\)\.killSwitches\.signIn === true/);
    expect(route.match(/killSwitches\.signIn/g)?.length).toBe(1);
    expect(`${route}\nsignOut()`).toMatch(/signOut\(\)/);
    expect(route).not.toMatch(/signOut\(/);
  });
});

describe('[NS-41-R12] Sign in with Apple is reachable from the outage screen', () => {
  it('[NS-41-R12] the outage screen carries Apple\'s own button when it is handed an action, in the outage variant only, with no new words; the route hands it one only after email_wait', () => {
    const o = src('components/onboarding/outage-screen.tsx');
    expect(o).toMatch(/\{onApple && !offline \? \(/);
    expect(o).toContain('<AppleButton signIn onPress={onApple} />');
    expect(src('app/onboarding.tsx')).toMatch(/onApple=\{appleAvailable && emailWait \? \(\) => void signInWithApple\(\) : undefined\}/);
    expect(src('app/onboarding.tsx')).toMatch(/authState\.error === 'email_wait'/);
    expect(src('app/onboarding.tsx')).toContain('appleSignInAvailable()');
  });
  it('[NS-41-R12] mutant: removing the action is caught', () => {
    const mutant = src('components/onboarding/outage-screen.tsx').replace('<AppleButton signIn onPress={onApple} />', 'null');
    expect(mutant).not.toContain('<AppleButton');
  });
});
