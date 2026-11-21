/// <reference types="node" />
/**
 * [BL-1461] The line shown while the Apple revocation wait runs: only for status signingOut with reason apple_revoked,
 * and not before the delay. Run on the small stand-in for React's hooks. Whether VoiceOver reads it is a device check.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ spoken: [] as string[] }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/a11y', () => ({ announce: (m: string) => void h.spoken.push(m) }));

import { authCopy } from '@scribe/content';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type SignOutReason } from '../src/lib/auth/machine.logic';
import { REVOCATION_WAIT_LINE_DELAY_MS } from '../src/lib/auth/revocation-wait.logic';
import { useRevocationWaitLine } from '../src/lib/auth/use-revocation-wait-line';
import { renderHook } from './helpers/mini-react';

const LINE = authCopy.account.signOutRevokedWaiting;
const gate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const run = (events: AuthEvent[]): AuthState => events.reduce(authReducer, initialAuthState);
const waiting = (reason: SignOutReason): AuthState =>
  run([
    { type: 'SIGNED_IN', userId: 'asha-1', method: 'apple' },
    { type: 'GATE_LOADED', gate, sensitiveDeclined: false },
    { type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: 2 },
  ]);

beforeEach(() => {
  vi.useFakeTimers();
  h.spoken.length = 0;
});
afterEach(() => vi.useRealTimers());

describe('[BL-1461] the revocation wait line', () => {
  it('the words are the council-locked line', () => {
    expect(LINE).toBe("Your newest letters are still on this phone. They're sent first, then this phone signs out.");
  });

  it('the wait is a real signingOut / apple_revoked state', () => {
    const s = waiting('apple_revoked');
    expect(s.status).toBe('signingOut');
  });

  it('shows nothing before the delay, then the line, said once to VoiceOver', () => {
    const state = waiting('apple_revoked');
    const r = renderHook(() => useRevocationWaitLine(state, LINE));
    expect(r.result.current).toBeNull();
    vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS - 1);
    expect(r.result.current).toBeNull();
    expect(h.spoken).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(r.result.current).toBe(LINE);
    expect(h.spoken).toEqual([LINE]);
  });

  for (const reason of ['user', 'force_reauth', 'switch_account'] as SignOutReason[]) {
    it(`never shows for reason ${reason}`, () => {
      const state = waiting(reason);
      const r = renderHook(() => useRevocationWaitLine(state, LINE));
      vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS * 10);
      expect(r.result.current).toBeNull();
      expect(h.spoken).toEqual([]);
    });
  }

  it('never shows for other statuses', () => {
    const ready = run([{ type: 'SIGNED_IN', userId: 'asha-1', method: 'apple' }, { type: 'GATE_LOADED', gate, sensitiveDeclined: false }]);
    for (const state of [initialAuthState, ready]) {
      const r = renderHook(() => useRevocationWaitLine(state, LINE));
      vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS * 10);
      expect(r.result.current).toBeNull();
    }
  });

  it('a wait that ends before the delay shows nothing', () => {
    let state = waiting('apple_revoked');
    const r = renderHook(() => useRevocationWaitLine(state, LINE));
    vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS - 1);
    state = initialAuthState;
    r.rerender();
    vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS * 2);
    expect(r.result.current).toBeNull();
    expect(h.spoken).toEqual([]);
  });
});
