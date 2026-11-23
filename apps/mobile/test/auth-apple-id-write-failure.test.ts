/**
 * [BL-1505] A failed Keychain write of the Apple user id must not leave the previous person's id to be
 * checked as the new person's. Fail quiet: the stale id is cleared, or when it cannot be, the revocation
 * watch skips (false) instead of reading Apple's state for the wrong person. Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  state: vi.fn(),
  signInAsync: vi.fn(),
  store: new Map<string, string>(),
  setFails: false,
  removeFails: false,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  digestStringAsync: async () => 'hashed-nonce-fixture',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
vi.mock('expo-apple-authentication', () => ({
  signInAsync: h.signInAsync,
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: async () => true,
  getCredentialStateAsync: h.state,
  addRevokeListener: () => ({ remove: () => {} }),
  AppleAuthenticationCredentialState: { REVOKED: 0, AUTHORIZED: 1, NOT_FOUND: 2, TRANSFERRED: 3 },
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.store.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      if (h.setFails) throw new Error('keychain write failed');
      h.store.set(k, v);
    },
    removeItem: async (k: string) => {
      if (h.removeFails && k === 'scribe.auth.appleUser') throw new Error('keychain remove failed');
      h.store.delete(k);
    },
  },
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { APPLE_USER_KEY, appleCredentialRevoked, forgetAppleUser, signInWithApple } from '../src/lib/auth/apple';

const sb = { auth: { signInWithIdToken: async () => ({ data: { user: { id: 'user-b' } }, error: null }) } } as never;

beforeEach(async () => {
  h.setFails = false;
  h.removeFails = false;
  h.store.clear();
  h.state.mockReset();
  h.state.mockResolvedValue(0); // REVOKED: what Apple says about A's id
  h.signInAsync.mockReset();
  h.signInAsync.mockResolvedValue({ identityToken: 'tok', user: 'apple-user-b', authorizationCode: null });
  setServerFeaturesForTests(false);
  await forgetAppleUser(); // also resets the in-memory mark between tests
});

describe('[BL-1505] a failed write of the Apple id fails closed', () => {
  it('clears the id left by the previous person and does not sign B out for it', async () => {
    h.store.set(APPLE_USER_KEY, 'apple-user-a');
    h.setFails = true;
    await expect(signInWithApple(sb)).resolves.toBe('user-b');
    expect(h.store.has(APPLE_USER_KEY)).toBe(false);
    expect(await appleCredentialRevoked()).toBe(false);
    expect(h.state).not.toHaveBeenCalled();
  });

  it('when the stale id cannot be cleared either, the watch skips and never asks Apple about it', async () => {
    h.store.set(APPLE_USER_KEY, 'apple-user-a');
    h.setFails = true;
    h.removeFails = true;
    await expect(signInWithApple(sb)).resolves.toBe('user-b');
    expect(await appleCredentialRevoked()).toBe(false);
    expect(h.state).not.toHaveBeenCalled();
  });

  it('a later good write is checked again, and a good write never marks unknown', async () => {
    h.store.set(APPLE_USER_KEY, 'apple-user-a');
    h.setFails = true;
    h.removeFails = true;
    await signInWithApple(sb);
    h.setFails = false;
    h.removeFails = false;
    await signInWithApple(sb);
    expect(h.store.get(APPLE_USER_KEY)).toBe('apple-user-b');
    expect(await appleCredentialRevoked()).toBe(true);
    expect(h.state).toHaveBeenCalledWith('apple-user-b');
  });

  it('forgetAppleUser clears the unknown mark, so the watch asks Apple again', async () => {
    h.store.set(APPLE_USER_KEY, 'apple-user-a');
    h.setFails = true;
    h.removeFails = true;
    await signInWithApple(sb);
    h.removeFails = false;
    await forgetAppleUser();
    h.store.set(APPLE_USER_KEY, 'apple-user-b');
    expect(await appleCredentialRevoked()).toBe(true);
    expect(h.state).toHaveBeenCalledWith('apple-user-b');
  });

  it('never logs the id', async () => {
    const spies = (['log', 'warn', 'error', 'info'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    h.store.set(APPLE_USER_KEY, 'apple-user-a');
    h.setFails = true;
    h.removeFails = true;
    await signInWithApple(sb);
    for (const s of spies) expect(JSON.stringify(s.mock.calls)).not.toMatch(/apple-user/);
    spies.forEach((s) => s.mockRestore());
  });
});
