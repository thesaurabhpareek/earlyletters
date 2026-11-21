/// <reference types="node" />
/**
 * CISO-2 / audit F6: a pending invite token that a signed-in account already read must not reach the next account.
 * The Keychain item carries a "had read it" mark, written only when a session exists at read time, and the item is
 * dropped at sign-out and at a user change (next to joinWait.clear() in auth-store). Keychain faked with a Map.
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const kc = vi.hoisted(() => ({
  items: new Map<string, string>(),
  failRemove: false,
  sets: 0,
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => kc.items.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      kc.sets += 1;
      kc.items.set(k, v);
    },
    removeItem: async (k: string) => {
      if (kc.failRemove) throw new Error('keychain locked');
      kc.items.delete(k);
    },
  },
}));

import { publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { authReducer, initialAuthState, type AuthEvent, type AuthState } from '../src/lib/auth/machine.logic';
import { clearReadPendingInvite, readPendingInvite, savePendingInvite } from '../src/lib/family/pending-invite';

const T1 = 'a'.repeat(43);
const T2 = 'b'.repeat(43);
const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const flush = () => new Promise((r) => setTimeout(r, 20));

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
const signOut: AuthEvent[] = [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 }, { type: 'SIGNED_OUT' }];

beforeEach(() => {
  kc.items.clear();
  kc.failRemove = false;
  kc.sets = 0;
  resetAuthStoreForTests();
});
afterEach(() => resetAuthStoreForTests());

describe('[CISO-2] a pending invite read by a signed-in account does not reach the next account', () => {
  it('read while signed in, sign out, another account reads: no token', async () => {
    await savePendingInvite(T1, NOW);
    let s = run(initialAuthState, signedInAs('user-a'));
    expect((await readPendingInvite(NOW, true))?.token).toBe(T1);
    s = run(s, signOut);
    await flush();
    s = run(s, signedInAs('user-b'));
    expect(await readPendingInvite(NOW, true)).toBeNull();
    expect(kc.items.size).toBe(0);
  });

  it('read while signed out keeps the token for sign-in, and writes nothing', async () => {
    await savePendingInvite(T1, NOW);
    const writes = kc.sets;
    expect((await readPendingInvite(NOW, false))?.token).toBe(T1);
    expect(kc.sets).toBe(writes);
    run(initialAuthState, signedInAs('user-a'));
    await flush();
    expect((await readPendingInvite(NOW, true))?.token).toBe(T1);
  });

  it('kill and relaunch between read and sign-out: the persisted mark still drops the token at sign-out', async () => {
    await savePendingInvite(T1, NOW);
    let s = run(initialAuthState, signedInAs('user-a'));
    await readPendingInvite(NOW, true);
    // Relaunch: only the persisted item is left; the same account may still use its token.
    expect((await readPendingInvite(NOW + 1000, true))?.token).toBe(T1);
    s = run(s, signOut);
    await flush();
    expect(await readPendingInvite(NOW + 2000, true)).toBeNull();
  });

  it('user change with no signed-out step drops a token the first account read', async () => {
    await savePendingInvite(T1, NOW);
    run(initialAuthState, signedInAs('user-a'));
    await readPendingInvite(NOW, true);
    publishAuth({ ...authReducer(authReducer(initialAuthState, signedInAs('user-b')[0]!), signedInAs('user-b')[1]!) });
    await flush();
    expect(await readPendingInvite(NOW, true)).toBeNull();
  });

  it('an item no signed-in account read survives a sign-out', async () => {
    await savePendingInvite(T1, NOW);
    const s = run(initialAuthState, signedInAs('user-a'));
    run(s, signOut);
    await flush();
    expect((await readPendingInvite(NOW, false))?.token).toBe(T1);
  });

  it('the same account staying signed in keeps its token', async () => {
    await savePendingInvite(T1, NOW);
    const s = run(initialAuthState, signedInAs('user-a'));
    await readPendingInvite(NOW, true);
    publishAuth(s);
    await flush();
    expect((await readPendingInvite(NOW, true))?.token).toBe(T1);
  });

  it('an old-format item (no mark) still decodes, and is marked when read signed in', async () => {
    kc.items.set('scribe.family.pendingInvite', JSON.stringify({ t: T1, at: NOW }));
    expect((await readPendingInvite(NOW, false))?.token).toBe(T1);
    expect((await readPendingInvite(NOW, true))?.token).toBe(T1);
    const s = run(initialAuthState, signedInAs('user-a'));
    run(s, signOut);
    await flush();
    expect(kc.items.size).toBe(0);
  });

  it('a newer link overwrites the item and drops the mark', async () => {
    await savePendingInvite(T1, NOW);
    const s = run(initialAuthState, signedInAs('user-a'));
    await readPendingInvite(NOW, true);
    await savePendingInvite(T2, NOW + 5);
    run(s, signOut);
    await flush();
    expect((await readPendingInvite(NOW + 10, false))?.token).toBe(T2);
  });

  it('a failed Keychain clear is swallowed (fail-open) and sign-out completes', async () => {
    await savePendingInvite(T1, NOW);
    const s = run(initialAuthState, signedInAs('user-a'));
    await readPendingInvite(NOW, true);
    kc.failRemove = true;
    expect(() => run(s, signOut)).not.toThrow();
    await expect(clearReadPendingInvite()).resolves.toBeUndefined();
    await flush();
    expect(kc.items.size).toBe(1);
  });

  it('the 14-day cap is unchanged for a marked item', async () => {
    await savePendingInvite(T1, NOW);
    await readPendingInvite(NOW, true);
    expect(await readPendingInvite(NOW + 14 * DAY + 1, true)).toBeNull();
  });
});
