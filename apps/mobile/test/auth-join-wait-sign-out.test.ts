/// <reference types="node" />
/**
 * BL-1424: sign-out clears the join wait, so the next account's welcome cannot show the previous child's name.
 * The wait (components/family/join-wait.logic.ts) is a module-level store that only the mounted welcome hook cleared.
 * Here no welcome is mounted: account A starts a wait with a name, signs out for each reason, account B signs in,
 * and the wait is null. Run against the real auth store (publishAuth is the one place every sign-out passes).
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type SignOutReason } from '../src/lib/auth/machine.logic';
import { joinWait } from '../src/components/family/join-wait.logic';

const run = (from: AuthState, events: AuthEvent[]): AuthState =>
  events.reduce((s, e) => {
    const n = authReducer(s, e);
    publishAuth(n);
    return n;
  }, from);

const signedInAs = (userId: string): AuthEvent[] => [
  { type: 'SIGNED_IN', userId, method: 'email' },
  { type: 'GATE_LOADED', gate: { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true }, sensitiveDeclined: false },
];

beforeEach(() => {
  resetAuthStoreForTests();
  joinWait.clear();
});
afterEach(() => {
  joinWait.clear();
  resetAuthStoreForTests();
});

describe('[BL-1424] sign-out ends the join wait', () => {
  const reasons: SignOutReason[] = ['user', 'apple_revoked', 'force_reauth', 'switch_account'];
  for (const reason of reasons) {
    it(`reason ${reason}: account B does not inherit account A's wait`, () => {
      let s = run(initialAuthState, signedInAs('user-a'));
      expect(s.status).toBe('ready');
      joinWait.start('book-asha', 'Asha');
      expect(joinWait.get()?.name).toBe('Asha');

      s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: 0 }, { type: 'SIGNED_OUT' }]);
      expect(s.status).toBe('signedOut');
      s = run(s, signedInAs('user-b'));
      expect(joinWait.get()).toBeNull();
    });
  }

  it('a wait started after the sign-out, for the next account, is kept', () => {
    let s = run(initialAuthState, signedInAs('user-a'));
    s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 }, { type: 'SIGNED_OUT' }, ...signedInAs('user-b')]);
    joinWait.start('book-asha', 'Asha');
    publishAuth(s);
    expect(joinWait.get()?.childId).toBe('book-asha');
  });

  it('the same account staying signed in keeps its wait', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    joinWait.start('book-asha', 'Asha');
    publishAuth(s);
    expect(joinWait.get()?.name).toBe('Asha');
  });
});
