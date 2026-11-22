/// <reference types="node" />
/**
 * BL-330 (security review H3), the phone's half: after Sign in with Apple the
 * one-time authorization code goes to `apple-token`, in the background, once
 * (plus one retry when the request never reached the function). Sign-in never
 * waits for it. The function's half is supabase/functions/apple-token
 * (Deno, npm run test:functions). F02-REQ-004, F02-REQ-022.
 * Fictional family "Asha" only; codes and ids are fixtures.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appleCaptureBody, APPLE_TOKEN_FUNCTION, captureVerdict, CAPTURE_ATTEMPTS } from '../src/lib/auth/apple-token.logic';
import { setServerFeaturesForTests } from '../src/lib/capabilities';

const CODE = 'c1a2b3c4d5e6f7a8b9c0.0.asha.authorization-code-fixture';
const BUNDLE = 'com.earlyletters.scribe';
const U = '0192f0aa-0000-7000-8000-000000000001';

const { constants, signInAsync, store } = vi.hoisted(() => ({
  constants: { expoConfig: { version: '1.0.0', ios: { bundleIdentifier: 'com.earlyletters.scribe' as string | undefined } } },
  signInAsync: vi.fn(),
  store: new Map<string, string>(),
}));
vi.mock('expo-constants', () => ({ default: constants }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  digestStringAsync: async () => 'hashed-nonce-fixture',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
vi.mock('expo-apple-authentication', () => ({
  signInAsync,
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: async () => true,
  getCredentialStateAsync: async () => 1,
  AppleAuthenticationCredentialState: { REVOKED: 0 },
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));

const httpError = () => Object.assign(new Error('Edge Function returned a non-2xx status code'), { name: 'FunctionsHttpError' });
const fetchError = () => Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError' });

describe('[F02-REQ-022] what the phone sends, and when it tries again', () => {
  it('sends the code and the bundle id the code was issued to, nothing else; refuses junk before any call', () => {
    expect(appleCaptureBody(CODE, BUNDLE)).toEqual({ code: CODE, clientId: BUNDLE });
    for (const [code, client] of [[null, BUNDLE], ['short', BUNDLE], [`${CODE} <x>`, BUNDLE], [CODE, null], [CODE, 'has spaces in it']] as const) {
      expect(appleCaptureBody(code, client), `${code} ${client}`).toBeNull();
    }
    expect(APPLE_TOKEN_FUNCTION).toBe('apple-token/v1');
  });

  it('an answer from the function is final (a code works once); only a request that never arrived is retried', () => {
    expect(captureVerdict(null)).toBe('stored');
    expect(captureVerdict(httpError())).toBe('failed');
    expect(captureVerdict(fetchError())).toBe('retry');
    expect(captureVerdict({ name: 'FunctionsRelayError' })).toBe('retry');
    expect(captureVerdict(new TypeError('Network request failed'))).toBe('retry');
    expect(captureVerdict(new Error('something else'))).toBe('failed');
  });
});

describe('[F02-REQ-004] captureAppleToken', () => {
  beforeEach(() => {
    setServerFeaturesForTests(true);
    constants.expoConfig.ios.bundleIdentifier = BUNDLE;
  });
  afterEach(() => setServerFeaturesForTests(null));

  const fakeSb = (...results: unknown[]) => {
    const invoke = vi.fn(async () => {
      const next = results.shift();
      if (next instanceof Error && next.name === 'TypeError') throw next;
      return { data: null, error: next ?? null };
    });
    return { sb: { functions: { invoke } } as never, invoke };
  };
  const noWait = vi.fn(async () => {});

  it('posts once to apple-token/v1 with { code, clientId } and reports stored on 204', async () => {
    const { captureAppleToken } = await import('../src/lib/auth/apple');
    const f = fakeSb(null);
    expect(await captureAppleToken(f.sb, CODE, noWait)).toBe('stored');
    expect(f.invoke).toHaveBeenCalledTimes(1);
    expect(f.invoke).toHaveBeenCalledWith('apple-token/v1', { method: 'POST', body: { code: CODE, clientId: BUNDLE } });
  });

  it('a refusal from the function (410 used code, 403, 503) is not retried', async () => {
    const { captureAppleToken } = await import('../src/lib/auth/apple');
    const f = fakeSb(httpError(), null);
    expect(await captureAppleToken(f.sb, CODE, noWait)).toBe('failed');
    expect(f.invoke).toHaveBeenCalledTimes(1);
  });

  it(`a lost connection is tried ${CAPTURE_ATTEMPTS} times in all, then given up quietly`, async () => {
    const { captureAppleToken } = await import('../src/lib/auth/apple');
    const once = fakeSb(fetchError(), null);
    expect(await captureAppleToken(once.sb, CODE, noWait)).toBe('stored');
    expect(once.invoke).toHaveBeenCalledTimes(2);
    const twice = fakeSb(fetchError(), new TypeError('Network request failed'));
    expect(await captureAppleToken(twice.sb, CODE, noWait)).toBe('failed');
    expect(twice.invoke).toHaveBeenCalledTimes(CAPTURE_ATTEMPTS);
  });

  it('a build with no bundle id sends nothing', async () => {
    const { captureAppleToken } = await import('../src/lib/auth/apple');
    constants.expoConfig.ios.bundleIdentifier = undefined;
    const f = fakeSb(null);
    expect(await captureAppleToken(f.sb, CODE, noWait)).toBe('failed');
    expect(f.invoke).not.toHaveBeenCalled();
  });

  it('[A-REQ-016] sign-in resolves without waiting for the capture, and the code is never kept on the phone', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    signInAsync.mockResolvedValueOnce({ identityToken: 'id.token.fixture', authorizationCode: CODE, user: '001234.asha0fixture0apple0user.0567', fullName: null });
    let release: () => void = () => {};
    const hanging = new Promise<{ data: null; error: null }>((r) => (release = () => r({ data: null, error: null })));
    const invoke = vi.fn(() => hanging);
    const sb = {
      auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: { id: U } }, error: null })) },
      functions: { invoke },
    } as never;
    await expect(signInWithApple(sb)).resolves.toBe(U);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect([...store.values()].some((v) => v.includes(CODE))).toBe(false);
    release();
  });

  it('a failing capture never fails sign-in', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    signInAsync.mockResolvedValueOnce({ identityToken: 'id.token.fixture', authorizationCode: CODE, user: '001234.asha0fixture0apple0user.0567', fullName: null });
    const sb = {
      auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: { id: U } }, error: null })) },
      functions: { invoke: vi.fn(async () => { throw new Error('boom'); }) },
    } as never;
    await expect(signInWithApple(sb)).resolves.toBe(U);
  });
});
