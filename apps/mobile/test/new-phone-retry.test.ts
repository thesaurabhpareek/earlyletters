/// <reference types="node" />
/**
 * BL-978a, a returning account on a new phone: NS-10-R8, R10, R11, R12 (docs/tdd/new-scope/08-keeping.md 3.2). R7 is #903;
 * R9 waits on `sync`. Pure plus the hook on the small stand-in (test/helpers/mini-react.ts). Each row has a mutant: a copy
 * of the real function or source with the one wrong line, which the same check must catch. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authCopy } from '@scribe/content';
import { firstRunGate, gateInputsFromAuth, type FirstRunGateInput } from '../src/lib/first-run/gate.logic';
import { OPENING_WAIT_MS, methodLine } from '../src/lib/first-run/new-phone.logic';
import type { AuthState } from '../src/lib/auth/machine.logic';

const h = vi.hoisted(() => ({
  asked: [] as Array<(k: 'new' | 'hasBook' | 'returningNoBook' | 'unknown') => void>,
  status: { phase: 'idle', lastSyncedAt: null as string | null },
}));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('../src/lib/first-run/account-books', () => ({ readAccountBooks: () => new Promise((r) => void h.asked.push(r as never)) }));
vi.mock('@/lib/sync', () => ({ getSyncStatus: () => h.status, subscribeSyncStatus: () => () => undefined, syncNow: () => Promise.resolve(null) }));
const { renderHook } = await import('./helpers/mini-react');
const { useNewPhone } = await import('../src/lib/first-run/use-new-phone');

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (rel: string) => code(readFileSync(join(SRC, rel), 'utf8'));

const base = { enabled: true, client: {} as SupabaseClient, hasLocalBook: false, online: true };
const flush = () => vi.advanceTimersByTimeAsync(0);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-21T09:00:00.000Z'));
  h.asked.length = 0;
  h.status = { phase: 'idle', lastSyncedAt: null };
});
afterEach(() => vi.useRealTimers());

describe('[NS-10-R8] kill switch at sign-in shows the local book', () => {
  const asha: AuthState = { status: 'needsConsent', userId: 'asha-mama', method: null, steps: ['terms'] };
  it('[NS-10-R8] with the server switch off the gate stands aside whatever the account says, so the local book shows', () => {
    for (const newPhone of ['consent', 'opening', 'noBook'] as const) {
      for (const hasLocalBook of [true, false]) {
        const r = firstRunGate(gateInputsFromAuth({ serverFeatures: false, authState: asha, hasLocalBook, newPhone }));
        expect(r.step, `${newPhone} ${hasLocalBook}`).toBe('unchanged');
        expect(r.mayBeginBook).toBe(true);
      }
    }
  });
  it('[NS-10-R8] mutant: checking the switch after the held-screen decision shows the held screen with the switch off', () => {
    const mutant = (i: FirstRunGateInput) => (i.hasSession && i.newPhone === 'consent' && !i.hasLocalBook ? 'finishSetup' : firstRunGate(i).step);
    const input = gateInputsFromAuth({ serverFeatures: false, authState: asha, hasLocalBook: false, newPhone: 'consent' });
    expect(mutant(input)).toBe('finishSetup');
    expect(firstRunGate(input).step).not.toBe('finishSetup');
  });
});

describe('[NS-10-R10] a lapsed plan still brings the book', () => {
  /** The pull and merge code consults no plan or entitlement: Plus is decided on the phone and never gates what comes down. */
  const consultsPlan = (t: string) => /from '@\/lib\/(plus|plan|payments|billing|entitlement)[^']*'|\bplan\.decide\b|\bdecide\(|\bisPlus\b|\bentitle/i.test(t);
  it('[NS-10-R10] the sync engine, the merge and the outbox read no plan state before applying pulled rows', () => {
    for (const f of ['engine.ts', 'merge.ts', 'outbox.ts', 'ownership.ts']) expect(consultsPlan(src(`lib/sync/${f}`)), f).toBe(false);
  });
  it('[NS-10-R10] mutant: a pull that asks the plan first is caught', () => {
    const mutant = src('lib/sync/merge.ts') + "\nif (!isPlus()) return;";
    expect(consultsPlan(mutant)).toBe(true);
  });
});

describe('[NS-10-R11] retry after a lost books answer', () => {
  it('[NS-10-R11] a lost answer is re-asked once inside the same 10 seconds, and reads as opening meanwhile', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('unknown');
    await flush();
    expect(h.asked).toHaveLength(2);
    expect(run.result.current.view).toBe('opening');
    h.asked[1]('unknown');
    await flush();
    expect(h.asked).toHaveLength(2); // one automatic re-ask, never a loop
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 100);
    expect(run.result.current.view).toBe('noBook'); // only after the window
    run.unmount();
  });
  it('[NS-10-R11] Try again keeps the clock: a retry at 6 s still ends at 10 s, not at 16 s', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('hasBook');
    await vi.advanceTimersByTimeAsync(6000);
    run.result.current.retry();
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(4100);
    expect(run.result.current.view).toBe('slow'); // mutant (clock restarted on retry) is still "opening" here
    run.unmount();
  });
  it('[NS-10-R11] the clock is not carried over to a new wait: after the hook goes inactive and active again it starts over', async () => {
    let enabled = true;
    const run = renderHook(() => useNewPhone({ ...base, enabled }));
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 100);
    enabled = false;
    run.rerender();
    enabled = true;
    run.rerender();
    expect(run.result.current.view).toBe('opening');
    run.unmount();
  });
  it('[NS-10-R11] mutant guard: the hook keeps `began` and does not set it from Date.now() on every attempt', () => {
    expect(src('lib/first-run/use-new-phone.ts')).toMatch(/began\.current \?\?= Date\.now\(\)/);
    expect(src('lib/first-run/use-new-phone.ts')).not.toMatch(/setWait\(\{ began: Date\.now\(\)/);
  });
});

describe('[NS-10-R12] wrong account names the method', () => {
  it('[NS-10-R12] the line names the sign-in method with existing words, and nothing when it is not known', () => {
    expect(methodLine('apple')).toBe(authCopy.account.signedInWith.apple);
    expect(methodLine('google')).toBe(authCopy.account.signedInWith.google);
    expect(methodLine('email')).toBe(authCopy.account.signedInWith.email);
    expect(methodLine('passkey')).toBe(authCopy.account.signedInWith.other);
    expect(methodLine(null)).toBeNull();
  });
  it('[NS-10-R12] never the address: the line takes a method only, and the screen file reads no email', () => {
    expect(methodLine('email')).not.toMatch(/@|\*/);
    const screens = src('components/onboarding/new-phone-screens.tsx');
    expect(/email|maskedEmail|account\.email/i.test(screens.replace(/signedInWith/g, ''))).toBe(false);
  });
  it('[NS-10-R12] mutant: a line that interpolates the full email is caught', () => {
    const mutant = (m: string, email: string) => `${methodLine(m as never)} ${email}`;
    expect(mutant('email', 'asha.mama@example.com')).toMatch(/@/);
    expect(methodLine('email') ?? '').not.toMatch(/@/);
  });
  it('[NS-10-R12] the line is its own Text above the screen (header slot, read first), on No book here yet only, and never joined into a body', () => {
    const screens = src('components/onboarding/new-phone-screens.tsx');
    const noBook = screens.slice(screens.indexOf('export function NoBookHereScreen'), screens.indexOf('export function HeldScreen'));
    expect(noBook).toContain('header={<MethodLead method={method} />}');
    expect(screens).toMatch(/function MethodLead[\s\S]*?<Text [^>]*testID="newPhone\.method"/);
    expect(screens.match(/<MethodLead /g)?.length).toBe(1);
    // Not in the slow or held screens, and never appended to a body (the old shape, F-05).
    expect(screens).not.toMatch(/\$\{method\}|body=\{[^}]*method/);
    const o = src('app/onboarding.tsx');
    expect(o).toContain('methodLine(lastMethod)');
    expect(o).toMatch(/<NoBookHereScreen[^>]* method=\{method\}/);
    expect(o).not.toMatch(/<SlowBookScreen[^>]*method=|<HeldScreen[^>]*method=/);
  });
  it('[NS-10-R12] mutant: the method appended to a body, or passed to the slow screen, is caught', () => {
    const oldShape = (t: string) => /\$\{method\}|body=\{[^}]*method/.test(t);
    expect(oldShape('body={withMethod(t.slowBody, method)}')).toBe(true);
    expect(oldShape('return method ? `${body} ${method}.` : body;')).toBe(true);
    expect(oldShape(src('components/onboarding/new-phone-screens.tsx'))).toBe(false);
  });
});
