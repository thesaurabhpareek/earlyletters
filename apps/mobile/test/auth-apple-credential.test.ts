/**
 * FP-9 (NS-45-R4, O-18): appleCredentialRevoked reads Apple's state, and
 * signInWithApple never logs the token or email. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  os: 'ios',
  state: vi.fn(),
  signInAsync: vi.fn(),
  store: new Map<string, string>(),
  readFails: false,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return h.os;
    },
  },
}));
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
    getItem: async (k: string) => {
      if (h.readFails) throw new Error('keychain locked');
      return h.store.get(k) ?? null;
    },
    setItem: async (k: string, v: string) => void h.store.set(k, v),
    removeItem: async (k: string) => void h.store.delete(k),
  },
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { APPLE_USER_KEY, appleCredentialRevoked, signInWithApple } from '../src/lib/auth/apple';

beforeEach(() => {
  h.os = 'ios';
  h.readFails = false;
  h.store.clear();
  h.store.set(APPLE_USER_KEY, 'apple-user-asha');
  h.state.mockReset();
  h.signInAsync.mockReset();
  setServerFeaturesForTests(false);
});
afterEach(() => vi.restoreAllMocks());

describe('[NS-45-R4] appleCredentialRevoked reads Apple state', () => {
  it('REVOKED is true, and Apple is asked about the stored user', async () => {
    h.state.mockResolvedValue(0);
    expect(await appleCredentialRevoked()).toBe(true); // mutant: REVOKED treated as valid
    expect(h.state).toHaveBeenCalledWith('apple-user-asha');
  });
  it('AUTHORIZED is false', async () => {
    h.state.mockResolvedValue(1);
    expect(await appleCredentialRevoked()).toBe(false);
  });
  it('TRANSFERRED is false', async () => {
    h.state.mockResolvedValue(3);
    expect(await appleCredentialRevoked()).toBe(false);
  });
  it('NOT_FOUND is false (decision pinned; see Question for cto in PR 1125)', async () => {
    h.state.mockResolvedValue(2);
    expect(await appleCredentialRevoked()).toBe(false);
  });
  it('a thrown error is not a revocation', async () => {
    h.state.mockRejectedValue(new Error('network down'));
    expect(await appleCredentialRevoked()).toBe(false); // mutant: catch returns true
  });
  it('no stored user is false and Apple is not asked', async () => {
    h.store.clear();
    expect(await appleCredentialRevoked()).toBe(false);
    expect(h.state).not.toHaveBeenCalled();
  });
  it('a keychain read error is false and Apple is not asked', async () => {
    h.readFails = true;
    expect(await appleCredentialRevoked()).toBe(false);
    expect(h.state).not.toHaveBeenCalled();
  });
  it('non-iOS is false and Apple is not asked', async () => {
    h.os = 'android';
    h.state.mockResolvedValue(0);
    expect(await appleCredentialRevoked()).toBe(false);
    expect(h.state).not.toHaveBeenCalled();
  });
});

describe('[NS-45-R4] log canary: no Apple token or email in any log', () => {
  it('sign-in and revocation check write nothing containing the token, code, user id or email', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    h.signInAsync.mockResolvedValue({
      identityToken: 'id-token-asha-SECRET',
      authorizationCode: 'auth-code-asha-SECRET',
      user: 'apple-user-asha',
      email: 'asha.family@example.com',
      fullName: { givenName: 'Asha' },
    });
    h.state.mockResolvedValue(0);
    const sb = {
      auth: { signInWithIdToken: async () => ({ data: { user: { id: 'u-asha' } }, error: null }) },
      functions: { invoke: async () => ({ error: null }) },
    } as never;
    await signInWithApple(sb);
    await appleCredentialRevoked();
    h.state.mockRejectedValue(new Error('boom'));
    await appleCredentialRevoked();
    const written = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    for (const secret of ['id-token-asha-SECRET', 'auth-code-asha-SECRET', 'asha.family@example.com', 'apple-user-asha', 'Asha']) {
      expect(written).not.toContain(secret); // mutant: log identityToken and email
    }
  });
});
