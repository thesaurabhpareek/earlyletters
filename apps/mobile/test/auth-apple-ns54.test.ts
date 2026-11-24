/**
 * NS-54 R1 to R3: Sign in with Apple on the phone (card 29). R4 is a device check (relay mail arrives) and R5 is the
 * purge worker's (supabase/functions/purge-worker/test/ns54.test.ts). Fictional family "Asha" only; all values are fixtures.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ signInAsync: vi.fn(), store: new Map<string, string>() }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  // A real SHA-256 (lowercase hex, as expo-crypto returns it), so the nonce test compares against a true digest.
  digestStringAsync: async (_alg: string, raw: string) => createHash('sha256').update(raw).digest('hex'),
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
// The worker's own revoke code, loaded by path: it is Deno-side (.ts import suffixes), so the phone's tsc must not follow it.
type Revoke = (f: (u: string, i?: RequestInit) => Promise<Response>, a: { clientId: string; clientSecret: string; token: string }) => Promise<string>;
const workerFile = (...p: string[]) => join(__dirname, '..', '..', '..', 'supabase', 'functions', 'purge-worker', ...p);
const revokeAppleToken: Revoke = async (f, a) => {
  const mod = (await import(/* @vite-ignore */ workerFile('lib', 'apple.ts'))) as { revokeAppleToken: Revoke };
  return mod.revokeAppleToken(f, a);
};
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

describe('[NS-54-R1] [stand-in] Apple is first and never smaller (source patterns, not a render)', () => {
  it('[NS-54-R1] [stand-in] source order: Apple is the first sign-in control on the Welcome footer, above every other provider', () => {
    const iApple = welcome.indexOf('<AppleButton');
    const iEmail = welcome.indexOf('<Button size="lg" fullWidth label={authCopy.sheet.email}');
    expect(iApple).toBeGreaterThan(0);
    expect(iEmail).toBeGreaterThan(iApple);
    expect(welcome).not.toMatch(/<ProviderButton/);
    // Only the footer's own order counts: nothing that signs in sits between the agreement line and Apple.
    const between = welcome.slice(welcome.indexOf('<AgreeLine />'), iApple);
    expect(between).not.toMatch(/<(Button|ProviderButton)\b/);
  });
  it('[NS-54-R1] [stand-in] source pattern: Apple uses the 56 pt button and the provider button is set to the same measure', () => {
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
    // A real SHA-256 of the raw nonce, computed here and not by the code under test: Apple gets the digest, Supabase the raw value.
    expect(req.nonce).toBe(createHash('sha256').update(args.nonce).digest('hex'));
    expect(req.nonce).toMatch(/^[0-9a-f]{64}$/);
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
  it('[NS-54-R3] on the error path of signInWithIdToken the code is not stored, logged, sent to apple-token or kept', async () => {
    const { signInWithApple } = await import('../src/lib/auth/apple');
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error'), vi.spyOn(console, 'info'), vi.spyOn(console, 'debug')];
    const w = world();
    const failure = Object.assign(new Error('asha-fixture-rejected'), { code: 'invalid_credentials' });
    w.signInWithIdToken.mockResolvedValue({ data: { user: null }, error: failure } as never);
    await expect(signInWithApple(w.sb)).rejects.toBe(failure);
    await new Promise((r) => setTimeout(r, 20));
    // Sign-in failed, so the one-time code is dropped: no capture call, nothing in storage (nor the Apple user id), nothing logged.
    expect(w.invoke).not.toHaveBeenCalled();
    expect(h.store.size).toBe(0);
    for (const spy of logs) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(CODE);
      expect(JSON.stringify(spy.mock.calls)).not.toContain('id.token.fixture');
    }
    // The error that reaches the caller carries neither the code nor the identity token.
    expect(JSON.stringify(failure, Object.getOwnPropertyNames(failure))).not.toContain(CODE);
  });
  it('[NS-54-R3] the sign-in module has no path to AsyncStorage, MMKV, a logger, analytics or the console', () => {
    for (const f of ['apple.ts', 'apple-token.logic.ts', 'nonce.ts']) {
      const code = src('lib', 'auth', f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const imports = code.match(/^import .*$/gm)?.join('\n') ?? '';
      expect(imports, f).not.toMatch(/async-storage|mmkv|logger|analytics|sentry|crash|posthog/i);
      expect(code, f).not.toMatch(/AsyncStorage|MMKV|\bconsole\s*\.|\blogger\b|\banalytics\b|\btrack\(/);
    }
    // The only store apple.ts writes to is the Keychain wrapper, and only the Apple user id goes in it.
    const apple = src('lib', 'auth', 'apple.ts');
    expect([...apple.matchAll(/secureStorage\.setItem\(([^)]*)\)/g)].map((m) => m[1])).toEqual(['APPLE_USER_KEY, user']);
  });
  it('[NS-54-R3] a failed capture never fails the sign-in and is reported as failed (the deletion receipt side is the purge worker)', async () => {
    const { signInWithApple, captureAppleToken } = await import('../src/lib/auth/apple');
    const w = world();
    w.invoke.mockResolvedValue({ data: null, error: Object.assign(new Error('x'), { name: 'FunctionsHttpError' }) } as never);
    await expect(signInWithApple(w.sb)).resolves.toBe('asha-user-1');
    await vi.waitFor(() => expect(w.invoke).toHaveBeenCalledTimes(1));
    // A missed capture is what later shows as `apple: no_token`: the phone reports 'failed', the worker writes the receipt value.
    await expect(captureAppleToken(w.sb as never, CODE, async () => {})).resolves.toBe('failed');
    expect(readFileSync(workerFile('account.ts'), 'utf8')).toMatch(/receipt: \{ apple: 'no_token' \}/);
  });
});

describe('[NS-54-R5] the revoke call to Apple (the purge worker half, read from the phone suite)', () => {
  const reply = (status: number, body?: unknown) => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = async (url: string, init?: RequestInit) => {
      calls.push({ url, init: init as RequestInit });
      return new Response(body === undefined ? null : JSON.stringify(body), { status });
    };
    return { calls, fetchFn };
  };
  const args = { clientId: 'com.earlyletters.scribe', clientSecret: 'secret.jwt.fixture', token: 'asha-refresh-fixture' };
  it('[NS-54-R5] the revoke posts client_id, client_secret, token and token_type_hint as a form to Apple', async () => {
    const r = reply(200);
    await expect(revokeAppleToken(r.fetchFn, args)).resolves.toBe('revoked');
    expect(r.calls).toHaveLength(1);
    expect(r.calls[0].url).toBe('https://appleid.apple.com/auth/revoke');
    expect(r.calls[0].init.method).toBe('POST');
    expect((r.calls[0].init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded');
    const form = new URLSearchParams(String(r.calls[0].init.body));
    expect(form.get('client_id')).toBe(args.clientId);
    expect(form.get('client_secret')).toBe(args.clientSecret);
    expect(form.get('token')).toBe(args.token);
    expect(form.get('token_type_hint')).toBe('refresh_token');
    expect([...form.keys()].sort()).toEqual(['client_id', 'client_secret', 'token', 'token_type_hint']);
  });
  it('[NS-54-R5] invalid_grant is handled as already revoked; any other Apple error throws so the row is kept', async () => {
    await expect(revokeAppleToken(reply(400, { error: 'invalid_grant' }).fetchFn, args)).resolves.toBe('already_invalid');
    await expect(revokeAppleToken(reply(400, { error: 'invalid_client' }).fetchFn, args)).rejects.toMatchObject({ code: 'invalid_client' });
    await expect(revokeAppleToken(reply(400, { error: 'invalid_request' }).fetchFn, args)).rejects.toMatchObject({ code: 'apple_error' });
    await expect(revokeAppleToken(reply(500).fetchFn, args)).rejects.toMatchObject({ status: 500 });
  });
  it('[NS-54-R5] an Apple error keeps the stored token row (the worker deletes it only after a revoke)', () => {
    const account = readFileSync(workerFile('account.ts'), 'utf8');
    const start = account.indexOf('async function revokeApple(');
    const fn = account.slice(start, account.indexOf('\n}\n', start));
    const revoke = fn.indexOf('await revokeAppleToken(');
    const del = fn.indexOf('await ctx.d.appleTokenDelete(uid)');
    expect(revoke).toBeGreaterThan(0);
    expect(del).toBeGreaterThan(revoke);
    // The only catch between the revoke and the delete rethrows, so an Apple error leaves the row for the retry.
    expect(fn.slice(revoke, del)).toMatch(/catch \(e\) \{[\s\S]*?throw e;\s*\}/);
    expect(fn.match(/appleTokenDelete\(/g)).toHaveLength(1);
  });
});
