/**
 * E100 follow-up (O-8, CR-232): a name from Apple that a build before #1125 left in the Keychain
 * (`scribe.auth.pendingName`) goes at every sign-out, which is also how an account deletion ends on the phone.
 * Before this, only the next Apple sign-in and accepting the Terms removed it. The real apple.ts runs against an
 * in-memory Keychain; the other leftovers are stand-ins. Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ store: new Map<string, string>(), failRemove: new Set<string>(), calls: [] as string[] }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  digestStringAsync: async () => 'hashed-nonce-fixture',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
vi.mock('expo-apple-authentication', () => ({
  signInAsync: vi.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: async () => true,
  getCredentialStateAsync: async () => 1,
  AppleAuthenticationCredentialState: { REVOKED: 0 },
  addRevokeListener: () => ({ remove: () => {} }),
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.store.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.store.set(k, v),
    removeItem: async (k: string) => {
      if (h.failRemove.has(k)) throw new Error('keychain locked');
      h.store.delete(k);
    },
  },
}));
vi.mock('@/lib/capture/sign-as-other', () => ({ forgetFromNames: () => void h.calls.push('fromNames') }));
vi.mock('@/lib/export/consent-copy', () => ({ clearConsentCopy: () => void h.calls.push('consentCopy') }));
vi.mock('@/lib/first-run/draft', () => ({ clearFirstRunDraft: () => void h.calls.push('draft') }));
vi.mock('../src/lib/auth/pending', () => ({ clearPendingEmailRequest: async () => void h.calls.push('pending') }));

import { APPLE_USER_KEY, PENDING_NAME_KEY } from '../src/lib/auth/apple';
import { forgetSignOutLeftovers } from '../src/lib/auth/sign-out-leftovers';

beforeEach(() => {
  h.store.clear();
  h.failRemove.clear();
  h.calls.length = 0;
});

describe('[E100] sign-out removes an Apple name an older build left', () => {
  it('the name and the Apple user id are both gone after the shared step', async () => {
    h.store.set(PENDING_NAME_KEY, 'Asha Mama');
    h.store.set(APPLE_USER_KEY, 'stand-in.apple.user');
    await forgetSignOutLeftovers();
    expect(h.store.has(PENDING_NAME_KEY)).toBe(false); // mutant: drop clearPendingAppleName from the shared step
    expect(h.store.has(APPLE_USER_KEY)).toBe(false);
  });

  it('touches no other Keychain item', async () => {
    h.store.set(PENDING_NAME_KEY, 'Asha Mama');
    h.store.set('scribe.auth', 'session-stand-in');
    await forgetSignOutLeftovers();
    expect([...h.store.keys()]).toEqual(['scribe.auth']);
  });

  it('with no leftover it is a no-op', async () => {
    await expect(forgetSignOutLeftovers()).resolves.toBeUndefined();
    expect(h.calls).toEqual(['draft', 'consentCopy', 'fromNames', 'pending']);
  });

  it('a Keychain that refuses the delete does not stop the pending email request going', async () => {
    h.store.set(PENDING_NAME_KEY, 'Asha Mama');
    h.failRemove.add(PENDING_NAME_KEY);
    await expect(forgetSignOutLeftovers()).resolves.toBeUndefined(); // mutant: let clearPendingAppleName throw
    expect(h.calls).toContain('pending');
  });
});
