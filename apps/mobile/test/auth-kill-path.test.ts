/// <reference types="node" />
/**
 * The kill path (lib/capabilities.ts, D-100: "the switch stays as the kill
 * path"; 08-delivery 8.3 item 1). With EXPO_PUBLIC_SERVER_FEATURES off,
 * nothing BL-347 and BL-330 added runs: no Keychain read or write for the
 * pending-request note, no GET /verify, no apple-token call, no crypto global
 * installed, no claim readers consulted, and auth links still open home and
 * keep nothing. Each case is also run with the switch on, so the test proves
 * the switch is what stops it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { authReducer, initialAuthState, type AuthEvent, type AuthState } from '../src/lib/auth/machine.logic';
import { serverFeaturesEnabled, setServerFeaturesForTests } from '../src/lib/capabilities';
import { planIncomingLink } from '../src/lib/family/entry.logic';

const APP = join(__dirname, '..');
const CODE = 'c1a2b3c4d5e6f7a8b9c0.0.asha.authorization-code-fixture';
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const U = '0192f0aa-0000-7000-8000-000000000001';

const { secure, createClient, getRandomValues, expoFetch } = vi.hoisted(() => ({
  secure: { getItem: vi.fn(async () => '{"at":1}'), setItem: vi.fn(async () => {}), removeItem: vi.fn(async () => {}) },
  createClient: vi.fn(() => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} } })),
  getRandomValues: vi.fn(<T>(a: T) => a),
  expoFetch: vi.fn(async () => ({ status: 303, headers: { get: () => 'https://earlyletters.com/auth/callback?code=asha-flow-code-0001' } })),
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: secure }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, AppState: { currentState: 'active', addEventListener: vi.fn(() => ({ remove: vi.fn() })) } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0', ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), getRandomValues, digestStringAsync: async () => 'h', CryptoDigestAlgorithm: { SHA256: 'SHA-256' } }));
vi.mock('expo-apple-authentication', () => ({ signInAsync: vi.fn(), AppleAuthenticationScope: {}, AppleAuthenticationCredentialState: {} }));
vi.mock('expo/fetch', () => ({ fetch: expoFetch }));
vi.mock('../src/lib/store', () => ({ uuidv7: () => '0199a000-0000-7000-8000-000000000001' }));

const touchedKeychain = () => secure.getItem.mock.calls.length + secure.setItem.mock.calls.length + secure.removeItem.mock.calls.length;

describe('kill path: server features off (the development, e2e, testflight and production profiles; preview is on)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://asha-fixture.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_asha_fixture';
  });
  afterEach(() => {
    setServerFeaturesForTests(null);
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('the switch is off in this process', () => {
    expect(serverFeaturesEnabled()).toBe(false);
  });

  it('BL-347: the pending-request note never touches the Keychain (and reads as "no request")', async () => {
    const p = await import('../src/lib/auth/pending');
    await p.notePendingEmailRequest();
    expect(await p.readPendingEmailRequest()).toBeNull();
    await p.clearPendingEmailRequest();
    expect(touchedKeychain()).toBe(0);

    setServerFeaturesForTests(true);
    await p.notePendingEmailRequest(1);
    expect(await p.readPendingEmailRequest(2)).toEqual({ at: 1 });
    await p.clearPendingEmailRequest();
    expect(secure.setItem).toHaveBeenCalledWith(p.PENDING_REQUEST_KEY, '{"at":1}');
    expect(touchedKeychain()).toBe(3);
  });

  it('BL-347: an email link makes no request to Supabase', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const exchangeCodeForSession = vi.fn(async () => ({ data: { user: { id: U } }, error: null }));
    const sb = { auth: { exchangeCodeForSession } } as never;
    await expect(verifyEmailLinkPkce(sb, HASH, 'email')).rejects.toMatchObject({ code: 'provider_disabled' });
    expect(expoFetch).not.toHaveBeenCalled();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();

    setServerFeaturesForTests(true);
    await expect(verifyEmailLinkPkce(sb, HASH, 'email')).resolves.toBe(U);
    expect(expoFetch).toHaveBeenCalledTimes(1);
  });

  it('BL-330: no apple-token call', async () => {
    const { captureAppleToken } = await import('../src/lib/auth/apple');
    const invoke = vi.fn(async () => ({ data: null, error: null }));
    expect(await captureAppleToken({ functions: { invoke } } as never, CODE, async () => {})).toBe('skipped');
    expect(invoke).not.toHaveBeenCalled();

    setServerFeaturesForTests(true);
    expect(await captureAppleToken({ functions: { invoke } } as never, CODE, async () => {})).toBe('stored');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('BL-347: no Supabase client with PKCE, and no crypto global installed, even with Supabase settings in the build', async () => {
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
    try {
      vi.resetModules();
      const client = await import('../src/lib/supabase/client');
      expect(client.getSupabaseOrNull()).toBeNull();
      expect(createClient).not.toHaveBeenCalled();
      expect((globalThis as { crypto?: unknown }).crypto).toBeUndefined();

      const caps = await import('../src/lib/capabilities');
      caps.setServerFeaturesForTests(true);
      expect(client.getSupabaseOrNull()).not.toBeNull();
      expect(createClient).toHaveBeenCalledWith('https://asha-fixture.supabase.co', 'sb_publishable_asha_fixture', expect.objectContaining({ auth: expect.objectContaining({ flowType: 'pkce' }) }));
      const g = globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
      expect(typeof g.crypto?.getRandomValues).toBe('function');
      g.crypto!.getRandomValues!(new Uint8Array(4));
      expect(getRandomValues).toHaveBeenCalledTimes(1);
      caps.setServerFeaturesForTests(null);
    } finally {
      if (saved) Object.defineProperty(globalThis, 'crypto', saved);
    }
  });

  it('BL-347: a signed-out phone (all the provider can be with no client) never consults the claim readers', async () => {
    vi.resetModules();
    const store = await import('../src/lib/auth/auth-store');
    const owner = vi.fn(() => null);
    const hasLocalData = vi.fn(() => true);
    const signedIn = vi.fn();
    store.setClaimReaders({ owner, hasLocalData });
    store.onSignedIn(signedIn);
    let s: AuthState = initialAuthState;
    for (const e of [{ type: 'RESTORED', userId: null }] as AuthEvent[]) {
      s = authReducer(s, e);
      store.publishAuth(s);
    }
    expect(store.accountClaimPending()).toBe(false);
    expect(store.currentAuthUserId()).toBeNull();
    expect(store.syncAllowed()).toBe(false);
    expect(owner).not.toHaveBeenCalled();
    expect(hasLocalData).not.toHaveBeenCalled();
    expect(signedIn).not.toHaveBeenCalled();
  });

  it('auth links still open home and keep nothing (+native-intent plan)', () => {
    const link = classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${HASH}&type=email`, { origin: 'https://earlyletters.com', scheme: 'scribe' });
    expect(planIncomingLink(link, { serverFeatures: false, gateStopped: false, path: 'x' })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });

  it('the screens stay behind the switch, and the provider registers claim readers only with a client', () => {
    expect(readFileSync(join(APP, 'src/app/(auth)/_layout.tsx'), 'utf8')).toMatch(/capabilities\.signIn \? <AuthStack \/> : <Redirect href="\/" \/>/);
    expect(readFileSync(join(APP, 'src/app/settings/account.tsx'), 'utf8')).toMatch(/capabilities\.signIn \? <AccountSettings \/> : <Redirect href="\/settings" \/>/);
    expect(readFileSync(join(APP, 'src/lib/supabase/client.ts'), 'utf8')).toMatch(/if \(!serverFeaturesEnabled\(\)\) return null;\s+if \(client\) return client;\s+const env = readSupabaseEnv\(\);\s+if \(!env\) return null;\s+ensureRandomValues\(\);/);
    expect(readFileSync(join(APP, 'src/lib/auth/session-provider.tsx'), 'utf8')).toMatch(/if \(!sb\) return;\s+setClaimReaders\(/);
  });

  it('the new modules are imported only by auth code, the sign-in screens and Account, all behind the switch', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const f = join(dir, name);
        if (statSync(f).isDirectory()) walk(f);
        else if (/\.(ts|tsx)$/.test(name)) files.push(f);
      }
    };
    walk(join(APP, 'src'));
    const importers = files
      .filter((f) => /from '(\.\/|\.\.\/auth\/|@\/lib\/auth\/)(email-link\.logic|account-claim\.logic|apple-token\.logic)'/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(join(APP, 'src'), f))
      .sort();
    expect(importers.every((f) => f.startsWith('lib/auth/') || f.startsWith('app/(auth)/') || f === 'app/settings/account.tsx')).toBe(true);
    expect(importers.length).toBeGreaterThan(0);
  });
});
