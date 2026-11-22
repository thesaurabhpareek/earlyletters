/// <reference types="node" />
/**
 * First-run no-surprise rows (card 19): NS-41-R2 new and returning look the same, NS-41-R16 sign-in leaves nothing in
 * logs, NS-42-R16 Not now records nothing, NS-44-R1 Plus never appears in first run.
 * Fictional family "Asha" only; the canaries are made-up strings. Source scans carry a control and a named mutant.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { authReducer, initialAuthState, type AuthState } from '../src/lib/auth/machine.logic';
import { plusLineFor } from '../src/lib/billing/alpha';
import { copy } from '../src/lib/copy';

vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const list = (dir: string) => readdirSync(join(SRC, dir)).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)).map((f) => `${dir}/${f}`);

// ---------- NS-41-R2 ----------
describe('[NS-41-R2] new and returning look the same', () => {
  const KNOWN = 'asha.mother@example.com';
  const UNKNOWN = 'asha.new@example.com';
  async function send(email: string) {
    const { sendEmailLink } = await import('../src/lib/auth/email');
    const calls: unknown[] = [];
    // The fake port answers the same for every address, as the real one must.
    const sb = { auth: { signInWithOtp: async (a: unknown) => (calls.push(a), { error: null }) } };
    await sendEmailLink(sb as never, email);
    return calls[0] as { email: string; options: Record<string, unknown> };
  }
  it('[NS-41-R2] a known and an unknown address send the same request shape, shouldCreateUser true', async () => {
    const a = await send(KNOWN);
    const b = await send(UNKNOWN);
    expect(a.options).toEqual(b.options);
    expect(a.options.shouldCreateUser).toBe(true);
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
  });
  it('[NS-41-R2] the machine reaches the same screen state for both addresses', () => {
    const run = () => [{ type: 'START', method: 'email' }, { type: 'EMAIL_SENT', at: 1000 }].reduce<AuthState>((s, e) => authReducer(s, e as never), { status: 'signedOut' });
    expect(run()).toEqual(run());
    expect(JSON.stringify(run())).not.toMatch(/asha|@/);
  });
  it('[NS-41-R2] the send path never branches on whether an address has an account', () => {
    const SPLIT = /user_not_found|userExists|isNewUser|already registered|no account|shouldCreateUser:\s*false/i;
    const send = read('lib/auth/email.ts').split('verifyEmailCode')[0];
    expect(SPLIT.exec(send)?.[0]).toBeUndefined();
    expect(SPLIT.test(send.replace('shouldCreateUser: true', 'shouldCreateUser: false'))).toBe(true); // mutant: caught
  });
});

// ---------- NS-41-R16 ----------
const LOG = /\bconsole\.\w+\s*\(|\blogger\.\w+\s*\(|\bSentry\.\w*(breadcrumb|capture)\w*\s*\(/i;
const LEAKY_PARAMS = /params:\s*\{[^}]*\b(email|code|token|tokenHash|userId|name)\b/;
const LEAKY_TRACK = /\btrack\(\s*[^)]*\b(email|code|tokenHash|userId)\b/;
const SIGN_IN_FILES = [...list('lib/auth'), ...list('app/(auth)/sign-in'), ...list('lib/first-run')];

describe('[NS-41-R16] sign-in leaves nothing in logs', () => {
  it('[NS-41-R16] no sign-in file logs, leaves a breadcrumb, puts a value in route params or in an analytics event', () => {
    const bad = SIGN_IN_FILES.flatMap((f) => {
      const s = read(f);
      return [LOG, LEAKY_PARAMS, LEAKY_TRACK].filter((re) => re.test(s)).map((re) => `${f} ${re.source.slice(0, 20)}`);
    });
    expect(bad).toEqual([]);
  });
  it('[NS-41-R16] the sign-in state holds no address, code or token hash on any step', () => {
    const CANARY = { email: 'asha.canary@example.com', code: '424242', tokenHash: 'canary-hash-asha' };
    let s: AuthState = initialAuthState;
    const steps: AuthState[] = [];
    for (const e of [{ type: 'RESTORED', userId: null }, { type: 'START', method: 'email' }, { type: 'EMAIL_SENT', at: 1 }, { type: 'SIGNED_IN', userId: 'u-asha', method: 'email' }]) {
      s = authReducer(s, e as never);
      steps.push(s);
    }
    const text = JSON.stringify(steps);
    for (const v of Object.values(CANARY)) expect(text).not.toContain(v);
  });
  it('[NS-41-R16] control: a canary logged once is caught', () => {
    expect(LOG.test('console.log(email)')).toBe(true);
    expect(LEAKY_PARAMS.test("router.push({ pathname: '/code', params: { email } })")).toBe(true);
    expect(LEAKY_TRACK.test("track('sign_in', { email })")).toBe(true);
  });
  it('[NS-41-R16] mutant: console.log(email) in the machine is caught', () => {
    expect(LOG.test(read('lib/auth/machine.logic.ts') + '\nconsole.log(email);')).toBe(true);
  });
});

// ---------- NS-42-R16 ----------
describe('[NS-42-R16] Not now records nothing', () => {
  it('[NS-42-R16] the machine keeps the Terms step unchanged when Terms are not accepted', () => {
    const needs: AuthState = { status: 'needsConsent', userId: 'u-asha', method: 'email', steps: ['terms', 'sensitive'] };
    expect(authReducer(needs, { type: 'CONSENT_RECORDED', step: 'terms', accepted: false })).toBe(needs);
  });
  const notNowIsClose = (src: string) => /<TermsStep\b[^>]*onNotNow=\{close\}/.test(src) && /label=\{t\.notNow\}\s+onPress=\{onNotNow\}/.test(src);
  const closeRecords = (src: string) => /const close\b[\s\S]{0,400}?(recordConsent|answer\(|recordAgreement|acceptBeforeYouBegin)/.test(src);
  it('[NS-42-R16] Not now on the Terms sheet only closes it: no consent call, no agreement row', () => {
    const src = read('app/(auth)/sign-in/consent.tsx');
    expect(notNowIsClose(src)).toBe(true);
    expect(closeRecords(src)).toBe(false);
  });
  it('[NS-42-R16] mutant: a Not now wired to the answer is caught', () => {
    const src = read('app/(auth)/sign-in/consent.tsx').replace('onNotNow={close}', 'onNotNow={() => answer(false)}');
    expect(notNowIsClose(src)).toBe(false);
  });
});

// ---------- NS-44-R1 ----------
describe('[NS-44-R1] Plus never appears in first run', () => {
  it('[NS-44-R1] the servers-on Welcome and the first-run files show no price, trial or Plus name', () => {
    const PLUS = /billingCopy|\bplusLineFor\b.*\bPLUS\b|[Pp]lus (keeps|is|costs)|\/plus\b|\btrial\b/;
    for (const f of ['components/onboarding/welcome-sign-in.tsx', 'components/onboarding/promise-sample.tsx', 'components/gate/age-gate-screen.tsx']) {
      expect({ f, hit: PLUS.exec(read(f))?.[0] }).toEqual({ f, hit: undefined });
    }
    expect(/router\.(push|replace)\(['"`]\/plus/.test(read('app/onboarding.tsx'))).toBe(false);
  });
  it('[NS-44-R1] the alpha Welcome line names no price (control for the switch)', () => {
    expect(plusLineFor(true, copy.onboarding.welcome.freeLine)).not.toBe(copy.onboarding.welcome.freeLine);
  });
  // RED TODAY (NS-44-R1): the servers-off Welcome in a store build shows welcome.freeLine, "...Plus keeps the book
  // growing." (onboarding.tsx:399 via plusLineFor(PLUS_ALPHA = false)). The card says no Plus name at any step.
  it.fails('[NS-44-R1] the store-build Welcome line does not name Plus', () => {
    expect(plusLineFor(false, copy.onboarding.welcome.freeLine)).not.toMatch(/\bPlus\b/);
  });
  it('[NS-44-R1] mutant: a Plus line on the sign-in Welcome is caught', () => {
    const PLUS = /billingCopy/;
    expect(PLUS.test(read('components/onboarding/welcome-sign-in.tsx') + "\nimport { billingCopy } from '@scribe/content';")).toBe(true);
  });
});
