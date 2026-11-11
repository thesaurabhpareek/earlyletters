/**
 * Tier A, the returning user and the order of first run (QA plan LK-14, LK-15, RS-03, LI-08, LI-09; NX-40 R11, R15; journey
 * A2 and A3; red-first file `test/first-run-route.test.ts`). The route decision itself is #764's `firstRunGate`
 * (gate.logic.ts, which this PR does not edit): these rows pin what it must keep doing for a person who has been here before,
 * and add the one thing that was red, that "The book is open." offers no lock. No new `firstRunRoute()` is written here:
 * QA's proposal for a second route function collides with #764's files and the plan itself says to agree one owner first.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { firstRunGate, gateInputsFromAuth } from '../src/lib/first-run/gate.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const ready: AuthState = { status: 'ready', sync: 'on' } as AuthState;
const out: AuthState = { status: 'signedOut' };
const gate = (over: { authState: AuthState; hasLocalBook: boolean; online?: boolean }) =>
  firstRunGate(gateInputsFromAuth({ serverFeatures: true, ...over }));

describe('[NX-40-R11, LK-14] a valid session goes straight to the book', () => {
  it('a session and a book on the phone: Tonight, no sign-in screen, no child step, no sign-in card', () => {
    const r = gate({ authState: ready, hasLocalBook: true });
    expect(r.step).toBe('openTonight');
    expect(r.offerSignIn).toBe(false);
  });
  it('the same offline: the book still opens (A-NFR-001: nothing on the way in waits for the network)', () => {
    const r = gate({ authState: ready, hasLocalBook: true, online: false });
    expect(r.step).toBe('openTonight');
  });
});

describe('[NX-40-R15, LI-08, LI-09] an expired or missing session', () => {
  it('with a book on the phone the book opens and sign-in is offered, never forced (reading, recording and export keep working)', () => {
    const r = gate({ authState: out, hasLocalBook: true });
    expect(r.step).toBe('openTonight');
    expect(r.offerSignIn).toBe(true);
  });
  it('with no book on the phone the sign-in screen shows, with the Welcome and no way past it', () => {
    const r = gate({ authState: out, hasLocalBook: false });
    expect(r.step).toBe('signIn');
    expect(r.mayBeginBook).toBe(false);
  });
  it('a network failure never counts as an ended session: the book opens offline with a session', () => {
    expect(gate({ authState: { status: 'signedOut', error: 'network' }, hasLocalBook: true }).step).toBe('openTonight');
  });
});

describe('[RS-03] the new phone path (S17) is unchanged', () => {
  it('a session and no book holds on "Opening your book", and never shows the child step or the Welcome', () => {
    const r = firstRunGate({ ...gateInputsFromAuth({ serverFeatures: true, authState: ready, hasLocalBook: false }), newPhone: 'opening' });
    expect(r.step).toBe('openingBook');
  });
  it('the account says the book arrived: Tonight, with the arrival line owed once', () => {
    const r = firstRunGate({ ...gateInputsFromAuth({ serverFeatures: true, authState: ready, hasLocalBook: true }), newPhone: 'arrived' });
    expect(r.step).toBe('openTonight');
    expect(r.arrivedFromAccount).toBe(true);
  });
});

describe('[NX-31-R14, journey A3] "The book is open." offers no lock', () => {
  const onboarding = src('app', 'onboarding.tsx');
  it('onboarding neither imports nor mounts the lock offer', () => {
    expect(onboarding).not.toMatch(/LockOffer|lock-offer/);
  });
  it('the finish step still opens the book with the speech card and the one primary', () => {
    expect(onboarding).toMatch(/SpeechConsentCard/);
    expect(onboarding).toMatch(/step === 'finish'/);
  });
});
