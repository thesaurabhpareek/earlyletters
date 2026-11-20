/// <reference types="node" />
/**
 * The first-run gate with another account on the phone (BL-961 PR 2; NS-10-R3, `[X4-R1]`; 08-keeping.md K8, OQ-5).
 * The leak: on develop at 20553b18 a phone that holds account A's book opens Tonight for ANY session
 * (gate.logic.ts:123-125), so B reads A's book. The first describe fails there and passes once B is held on
 * `otherAccount`. Pure; fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { beginTheBookAllowed, firstRunGate, gateInputsFromAuth } from '../src/lib/first-run/gate.logic';
import type { OpeningView } from '../src/lib/first-run/new-phone.logic';
import { firstRunScreen } from '../src/lib/first-run/welcome.logic';

const A = '0192f0aa-0000-7000-8000-0000000000a1'; // owns the book on this phone
const B = '0192f0aa-0000-7000-8000-0000000000b2'; // signs in on the same phone

const sessionsOf = (u: string): AuthState[] => [
  { status: 'checkingConsent', userId: u, method: 'email' },
  { status: 'needsConsent', userId: u, method: 'email', steps: ['terms'] },
  { status: 'ready', userId: u, sync: 'on' },
  { status: 'ready', userId: u, sync: 'off' },
  { status: 'ready', userId: u, sync: 'unknown' },
  { status: 'signingOut', userId: u, reason: 'user', waitingForUploads: false, sync: 'on' },
];
const VIEWS: (OpeningView | undefined)[] = [undefined, 'new', 'opening', 'slow', 'offline', 'noBook', 'arrived'];

const gate = (authState: AuthState, over: { hasLocalBook?: boolean; phoneOwner?: string | null; newPhone?: OpeningView; serverFeatures?: boolean } = {}) =>
  firstRunGate(
    gateInputsFromAuth({
      serverFeatures: over.serverFeatures ?? true,
      authState,
      hasLocalBook: over.hasLocalBook ?? true,
      newPhone: over.newPhone,
      phoneOwner: over.phoneOwner === undefined ? A : over.phoneOwner,
    }),
  );

describe('[NS-10-R3] a phone that holds account A\'s book never opens it for account B', () => {
  it('B signed in and ready: held on otherAccount, never Tonight, never a new book', () => {
    const r = gate({ status: 'ready', userId: B, sync: 'on' });
    expect(r.step).toBe('otherAccount');
    expect(r).toMatchObject({ mayBeginBook: false, offerSignIn: false, arrivedFromAccount: false, localStartOffered: false });
  });

  it('at every step of B\'s session, with or without the book listed, whatever the account said', () => {
    for (const s of sessionsOf(B)) {
      for (const hasLocalBook of [true, false]) {
        for (const newPhone of VIEWS) {
          const r = gate(s, { hasLocalBook, newPhone });
          const where = `${s.status} book:${hasLocalBook} view:${String(newPhone)}`;
          expect(r.step, where).toBe('otherAccount');
          expect(r.mayBeginBook, where).toBe(false);
        }
      }
    }
  });

  it('"Begin the book" never shows for B (a book begun here would be written into A\'s store)', () => {
    for (const s of sessionsOf(B)) {
      for (const newPhone of ['new', 'noBook'] as const) {
        const inputs = gateInputsFromAuth({ serverFeatures: true, authState: s, hasLocalBook: false, phoneOwner: A, localStartChosen: true, newPhone });
        expect(beginTheBookAllowed(inputs), `${s.status} ${newPhone}`).toBe(false);
      }
    }
  });

  it('the route draws nothing under the screen cover, even for someone already past the welcome step', () => {
    for (const pastWelcome of [false, true]) {
      for (const restoring of [false, true]) {
        expect(firstRunScreen({ step: 'otherAccount', outage: null, restoring, pastWelcome })).toBe('blank');
      }
    }
  });
});

describe('[X4-R1] everyone else keeps the route they had', () => {
  it('A signed in again: Tonight, at every step that opened it before', () => {
    expect(gate({ status: 'ready', userId: A, sync: 'on' }).step).toBe('openTonight');
    for (const s of sessionsOf(A)) expect(gate(s).step, s.status).not.toBe('otherAccount');
  });

  it('signed out (D1): the book opens for whoever holds the phone, with sign-in offered', () => {
    for (const s of [{ status: 'signedOut' }, { status: 'restoring' }, { status: 'signingIn', method: 'apple' }] as AuthState[]) {
      expect(gate(s), s.status).toMatchObject({ step: 'openTonight', offerSignIn: true });
    }
  });

  it('no owner yet (never claimed, or forgotten by releaseEmptyOwner): B is this phone\'s first account, as before', () => {
    expect(gate({ status: 'ready', userId: B, sync: 'on' }, { phoneOwner: null }).step).toBe('openTonight');
    expect(gate({ status: 'ready', userId: B, sync: 'on' }, { phoneOwner: null, hasLocalBook: false, newPhone: 'new' }).step).toBe('childStep');
  });

  it('[NS-10-R8] server features off: unchanged, never the held step', () => {
    expect(gate({ status: 'ready', userId: B, sync: 'on' }, { serverFeatures: false }).step).toBe('unchanged');
  });
});
