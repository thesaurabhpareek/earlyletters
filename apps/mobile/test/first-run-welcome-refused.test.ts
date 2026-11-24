/// <reference types="node" />
/**
 * BL-1441 (council batch 6, FP-6; NS-40-R9): a refused Apple or Google sign-up on the first-run Welcome shows the existing
 * refused-region screen, not nothing. Pure, no phone. The real reducer carries each provider's refusal through the same
 * path providerSignIn uses (authErrorKind then FAILED). Fictional family "Asha" only. Each rule has a mutant below.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import { authReducer, type AuthMethod, type AuthState } from '../src/lib/auth/machine.logic';
import { firstRunGate, gateInputsFromAuth } from '../src/lib/first-run/gate.logic';
import { firstRunScreen, inlineErrorKind, regionRefusedShown } from '../src/lib/first-run/welcome.logic';

const SRC = join(__dirname, '..', 'src');
const raw = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const welcome = () => code(raw('components/onboarding/welcome-sign-in.tsx'));

/** What providerSignIn does when the provider call throws: START, then FAILED with the mapped kind. */
function refusedAfter(method: AuthMethod): AuthState {
  const refusal = Object.assign(new Error('refused'), { code: 'region_refused', status: 403 });
  const started = authReducer({ status: 'signedOut' }, { type: 'START', method });
  return authReducer(started, { type: 'FAILED', error: authErrorKind(refusal, 'provider') });
}

describe('[BL-1441][NS-40-R9] a refused sign-up on the Welcome shows the refused-region screen', () => {
  for (const method of ['apple', 'google'] as const) {
    it(`[BL-1441] ${method}: the refusal is shown, and the gate still keeps the person on the Welcome (not the outage screen)`, () => {
      const state = refusedAfter(method);
      expect(state).toEqual({ status: 'signedOut', error: 'region_refused' });
      expect(regionRefusedShown(state)).toBe(true);
      const g = firstRunGate(gateInputsFromAuth({ serverFeatures: true, authState: state, hasLocalBook: false }));
      expect(g.step).toBe('signIn');
      expect(firstRunScreen({ step: g.step, outage: g.outage ?? null, restoring: false, pastWelcome: false })).toBe('welcome');
    });
  }

  it('[BL-1441] it is not an inline line, and no other state or error shows the screen (a cancel, an unknown error, a new attempt)', () => {
    expect(inlineErrorKind(refusedAfter('apple'))).toBeNull();
    expect(regionRefusedShown({ status: 'signedOut' })).toBe(false);
    expect(regionRefusedShown({ status: 'signedOut', error: 'unknown' })).toBe(false);
    expect(regionRefusedShown({ status: 'signedOut', error: 'provider' })).toBe(false);
    expect(regionRefusedShown({ status: 'signingIn', method: 'apple' })).toBe(false);
    // The email code step has its own refused screen (code.tsx); the Welcome does not take it over.
    expect(regionRefusedShown({ status: 'awaitingCode', sentAt: 1, error: 'region_refused' })).toBe(false);
    expect(regionRefusedShown(authReducer(refusedAfter('apple'), { type: 'START', method: 'apple' }))).toBe(false);
  });

  it('[BL-1441] the Welcome draws the existing screen from the auth state, after every hook, and sends no reason anywhere', () => {
    const w = welcome();
    expect(w).toMatch(/import \{ RegionRefusedScreen \} from '@\/components\/onboarding\/region-refused-screen';/);
    expect(w).toMatch(/if \(regionRefusedShown\(auth\.state\)\) return <RegionRefusedScreen \/>;/);
    const at = w.indexOf('if (regionRefusedShown(');
    expect(at).toBeGreaterThan(w.lastIndexOf('useFocusOnMount('));
    expect(at).toBeGreaterThan(w.lastIndexOf('useEffect('));
    expect(w).not.toMatch(/region_refused|analytics|track\(|console\./);
  });

  it('[BL-1441] mutant: dropping the render, or putting it before a hook, is caught by the same checks', () => {
    const real = welcome();
    const renders = (t: string) => /if \(regionRefusedShown\(auth\.state\)\) return <RegionRefusedScreen \/>;/.test(t);
    const afterHooks = (t: string) => t.indexOf('if (regionRefusedShown(') > t.lastIndexOf('useFocusOnMount(');
    expect(renders(real) && afterHooks(real)).toBe(true);
    expect(renders(real.replace('<RegionRefusedScreen />', 'null'))).toBe(false);
    const early = real.replace(/if \(regionRefusedShown[^\n]*\n/, '').replace('useEffect(', "if (regionRefusedShown(auth.state)) return <RegionRefusedScreen />;\n  useEffect(");
    expect(afterHooks(early)).toBe(false);
  });
});
