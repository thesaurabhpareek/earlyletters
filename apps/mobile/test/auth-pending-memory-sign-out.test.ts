/// <reference types="node" />
/**
 * Cross-account stores audit F3: the address typed for an email sign-in (`pendingEmail`) and a sign-in link's token hash
 * (`pendingLink`) are memory hand-offs for the sign-in flow. They end with the session that was running and with a
 * change of account, so the next person on a shared phone cannot read them. A sign-in in progress (nobody signed in
 * yet) keeps them, and a saved invite link survives sign-out on purpose (audit F6, A-REQ-028, 14 days).
 * Run against the real auth store (publishAuth is the one place every sign-out passes). Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: vi.fn(async (k: string) => store.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => void store.set(k, v)),
    removeItem: vi.fn(async (k: string) => void store.delete(k)),
  },
}));

import { publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type SignOutReason } from '../src/lib/auth/machine.logic';
import { getPendingEmail, setPendingAuthLink, setPendingEmail, takePendingAuthLink } from '../src/lib/auth/pending';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '../src/lib/family/pending-invite';

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
const LINK = { tokenHash: 'hash-for-asha-test', type: 'magiclink' } as const;
const INVITE = 'a'.repeat(32);

function clean() {
  setPendingEmail(null);
  takePendingAuthLink();
  store.clear();
  resetAuthStoreForTests();
}
beforeEach(clean);
afterEach(clean);

describe('[F3] the sign-in hand-offs end with the session', () => {
  const reasons: SignOutReason[] = ['user', 'apple_revoked', 'force_reauth', 'switch_account'];
  for (const reason of reasons) {
    it(`reason ${reason}: the next account finds no address and no link`, () => {
      let s = run(initialAuthState, signedInAs('user-a'));
      setPendingEmail('asha.parent@example.com');
      setPendingAuthLink(LINK);
      s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: 0 }, { type: 'SIGNED_OUT' }]);
      expect(getPendingEmail()).toBeNull();
      expect(takePendingAuthLink()).toBeNull();
      run(s, signedInAs('user-b'));
    });
  }

  it('a session ended by Supabase itself (SIGNED_OUT with no request) clears them too', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    setPendingEmail('asha.parent@example.com');
    setPendingAuthLink(LINK);
    run(s, [{ type: 'SIGNED_OUT' }]);
    expect(getPendingEmail()).toBeNull();
    expect(takePendingAuthLink()).toBeNull();
  });

  it('a change of account clears them', () => {
    run(initialAuthState, signedInAs('user-a'));
    setPendingEmail('asha.parent@example.com');
    setPendingAuthLink(LINK);
    run(initialAuthState, signedInAs('user-b'));
    expect(getPendingEmail()).toBeNull();
    expect(takePendingAuthLink()).toBeNull();
  });

  it('a sign-in in progress (nobody was signed in) keeps its address and link', () => {
    setPendingEmail('asha.parent@example.com');
    setPendingAuthLink(LINK);
    run(initialAuthState, [{ type: 'RESTORED', userId: null }]);
    run(initialAuthState, signedInAs('user-a'));
    expect(getPendingEmail()).toBe('asha.parent@example.com');
    expect(takePendingAuthLink()).toEqual(LINK);
  });

  it('the same account staying signed in keeps them', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    setPendingEmail('asha.parent@example.com');
    publishAuth(s);
    expect(getPendingEmail()).toBe('asha.parent@example.com');
  });

  it('F6: a saved invite link survives sign-out and a change of account', async () => {
    await savePendingInvite(INVITE);
    let s = run(initialAuthState, signedInAs('user-a'));
    s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 }, { type: 'SIGNED_OUT' }]);
    expect((await readPendingInvite())?.token).toBe(INVITE);
    run(s, signedInAs('user-b'));
    expect((await readPendingInvite())?.token).toBe(INVITE);
    await clearPendingInvite();
  });
});
