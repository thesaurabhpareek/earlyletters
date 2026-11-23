/**
 * NS-54 R1 to R3: Sign in with Apple on the phone (card 29). R4 is a device check (relay mail arrives) and R5 is the
 * purge worker's (supabase/functions/purge-worker/test/ns54.test.ts). Fictional family "Asha" only; all values are fixtures.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ signInAsync: vi.fn(), store: new Map<string, string>() }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  digestStringAsync: async (_alg: string, raw: string) => `sha256(${raw})`,
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
vi.mock('expo-apple-authentication', () => ({
  signInAsync: h.signInAsync,
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: async () => true,
  getCredentialStateAsync: async () => 1,
  AppleAuthenticationCredentialState: { REVOKED: 0 },
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.store.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.store.set(k, v),
    removeItem: async (k: string) => void h.store.delete(k),
  },
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';

const CODE = 'c1a2b3c4d5e6f7a8b9c0.0.asha.authorization-code-fixture';
const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const welcome = src('components', 'onboarding', 'welcome-sign-in.tsx');
const ui = src('lib', 'auth', 'ui.tsx');

function world() {
  const signInWithIdToken = vi.fn(async () => ({ data: { user: { id: 'asha-user-1' } }, error: null }));
  const invoke = vi.fn(async () => ({ data: null, error: null }));
  const sb = { auth: { signInWithIdToken }, functions: { invoke } } as never;
  h.signInAsync.mockResolvedValue({ identityToken: 'id.token.fixture', authorizationCode: CODE, user: '001234.asha0fixture.0567', fullName: null });
  return { sb, signInWithIdToken, invoke };
}

beforeEach(() => {
  h.store.clear();
  h.signInAsync.mockReset();
  setServerFeaturesForTests(true);
});
afterEach(() => {
  setServerFeaturesForTests(null);
  vi.restoreAllMocks();
});

describe('[NS-54-R1] Apple is first and never smaller', () => {
  it('[NS-54-R1] Apple is the first sign-in control on the Welcome footer, above every other provider', () => {
    const iApple = welcome.indexOf('<AppleButton');
    const iEmail = welcome.indexOf('<Button size="lg" fullWidth label={authCopy.sheet.email}');
    expect(iApple).toBeGreaterThan(0);
    expect(iEmail).toBeGreaterThan(iApple);
    expect(welcome).not.toMatch(/<ProviderButton/);
    // Only the footer's own order counts: nothing that signs in sits between the agreement line and Apple.
    const between = welcome.slice(welcome.indexOf('<AgreeLine />'), iApple);
    expect(between).not.toMatch(/<(Button|ProviderButton)\b/);
  });
  it('[NS-54-R1] Apple uses the 56 pt button and any provider button is no larger than it', () => {
    expect(ui).toMatch(/button: tokens\.target\.primary/);
    // Apple: full width at the sheet's button height.
    expect(ui).toMatch(/AppleAuthenticationButton[\s\S]*?style=\{\{ height: SHEET\.button, width: '100%' \}\}/);
    // Any other provider button (Google, when R6 offers it) is the same measure, never a taller minimum.
    const provider = ui.slice(ui.indexOf('export function ProviderButton'), ui.indexOf('export function QuietButton'));
    expect(provider).toMatch(/size="lg"/);
    expect(provider).toMatch(/style=\{\{ minHeight: SHEET\.button \}\}/);
    expect(provider).not.toMatch(/minHeight: (?!SHEET\.button)/);
  });
});

describe('[NS-54-R2] Apple asks for email only', () => {
  it('[NS-54-R2] the request is email scope only, the nonce is hashed for Apple and raw for Supabase', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    const w = world();
    await signInWithApple(w.sb);
    const req = h.signInAsync.mock.calls[0][0] as { requestedScopes: number[]; nonce: string };
    expect(req.requestedScopes).toEqual([1]);
    const [args] = w.signInWithIdToken.mock.calls[0] as unknown as [{ provider: string; token: string; nonce: string }];
    expect(args.provider).toBe('apple');
    expect(args.nonce).not.toBe(req.nonce);
    expect(req.nonce).toBe(`sha256(${args.nonce})`);
    expect(args.nonce).toMatch(/^(07){32}$/);
  });
});

describe('[NS-54-R3] Apple token captured for revocation', () => {
  it('[NS-54-R3] the authorization code goes once to apple-token, is never stored on the phone and never logged', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error'), vi.spyOn(console, 'info'), vi.spyOn(console, 'debug')];
    const w = world();
    await signInWithApple(w.sb);
    await vi.waitFor(() => expect(w.invoke).toHaveBeenCalledTimes(1));
    expect(w.invoke).toHaveBeenCalledWith('apple-token/v1', { method: 'POST', body: { code: CODE, clientId: 'com.earlyletters.scribe' } });
    expect([...h.store.values()].some((v) => v.includes(CODE))).toBe(false);
    for (const spy of logs) expect(JSON.stringify(spy.mock.calls)).not.toContain(CODE);
    // The code is sent nowhere else: Supabase's sign-in call carries the identity token and nonce only.
    expect(JSON.stringify(w.signInWithIdToken.mock.calls)).not.toContain(CODE);
  });
  it('[NS-54-R3] a failed capture never fails the sign-in (the receipt shows apple: no_token instead)', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    const w = world();
    w.invoke.mockResolvedValue({ data: null, error: Object.assign(new Error('x'), { name: 'FunctionsHttpError' }) } as never);
    await expect(signInWithApple(w.sb)).resolves.toBe('asha-user-1');
    await vi.waitFor(() => expect(w.invoke).toHaveBeenCalledTimes(1));
  });
});
