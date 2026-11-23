/**
 * [NS-54-R7] no Google token stored by us, and [NS-54-R9] deletion holds no Google data (BL-1892).
 * What we keep of a Google sign-in: nothing but the Supabase session. The ID token goes once to
 * signInWithIdToken; no Google access token, refresh token, server auth code or picture is read, written
 * or sent anywhere else, and Google's own session on the phone is closed. Fictional family "Asha".
 * Finding: docs/security/GOOGLE_SIGNIN_DELETION.md.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const root = join(__dirname, '..', '..', '..');
const read = (...p: string[]) => readFileSync(join(root, ...p), 'utf8');
const MODULE = '@react-native-google-signin/google-signin';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const h = vi.hoisted(() => ({ writes: [] as string[], getTokens: vi.fn(), signOut: vi.fn(async () => {}), signIn: vi.fn() }));

function fakeGoogle() {
  const SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';
  return {
    GoogleSignin: {
      configure: (o: Record<string, unknown>) => void h.writes.push(`configure:${Object.keys(o).sort().join(',')}`),
      signIn: h.signIn,
      signOut: h.signOut,
      getTokens: h.getTokens,
    },
    statusCodes: { SIGN_IN_CANCELLED, IN_PROGRESS: 'IN_PROGRESS' },
    isErrorWithCode: () => false,
    isCancelledResponse: () => false,
  };
}

async function load() {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'asha-web.apps.googleusercontent.com');
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'asha-ios.apps.googleusercontent.com');
  const req = createRequire(join(root, 'apps', 'mobile', 'src', 'lib', 'auth', 'google.ts'));
  const file = req.resolve(MODULE);
  req.cache[file] = { id: file, filename: file, loaded: true, exports: fakeGoogle(), children: [], paths: [] } as never;
  return import('../src/lib/auth/google');
}

beforeEach(() => {
  h.writes.length = 0;
  h.getTokens.mockReset();
  h.signOut.mockClear();
  h.signIn.mockReset().mockResolvedValue({
    type: 'success',
    data: {
      idToken: 'id-token-fixture-asha',
      serverAuthCode: 'server-auth-code-fixture',
      user: { email: 'asha.parent@example.invalid', name: 'Asha Parent', photo: 'https://example.invalid/asha.jpg' },
    },
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('[NS-54-R7] no Google token stored by us', () => {
  it('sends the ID token once to Supabase and nothing else, and never asks Google for tokens or a server code', async () => {
    const { signInWithGoogle } = await load();
    const signInWithIdToken = vi.fn(async () => ({ data: { user: { id: 'asha-user-1' } }, error: null }));
    const sb = { auth: { signInWithIdToken } } as never;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await signInWithGoogle(sb)).toBe('asha-user-1');
    expect(signInWithIdToken).toHaveBeenCalledTimes(1);
    expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'id-token-fixture-asha' });
    expect(h.getTokens).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    // Only the two client ids are configured: no offline access, no extra scopes, so no server auth code or refresh token is requested.
    expect(h.writes).toEqual(['configure:iosClientId,webClientId']);
    fetchSpy.mockRestore();
  });

  it('closes the Google session on the phone after sign-in, also when Supabase refuses the token', async () => {
    const { signInWithGoogle } = await load();
    const ok = { auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: { id: 'asha-user-1' } }, error: null })) } } as never;
    await signInWithGoogle(ok);
    expect(h.signOut).toHaveBeenCalledTimes(1);
    h.signOut.mockClear();
    const bad = { auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: null }, error: new Error('refused') })) } } as never;
    await expect(signInWithGoogle(bad)).rejects.toThrow('refused');
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps Google material out of every store and network call in the auth code (source scan)', () => {
    const dir = join(root, 'apps', 'mobile', 'src', 'lib', 'auth');
    const google = read('apps/mobile/src/lib/auth/google.ts');
    const code = google.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const banned of ['getTokens', 'serverAuthCode', 'accessToken', 'refreshToken', 'offlineAccess', 'scopes', 'photo', 'setItem', 'SecureStore', 'AsyncStorage', 'fetch(', 'XMLHttpRequest']) {
      expect(code, `google.ts must not use ${banned}`).not.toContain(banned);
    }
    // No other auth file touches Google's token surface either.
    for (const f of readdirSync(dir).filter((n) => /\.(ts|tsx)$/.test(n))) {
      const s = readFileSync(join(dir, f), 'utf8');
      expect(s, `${f} must not read Google tokens`).not.toMatch(/GoogleSignin\.(getTokens|addScopes|clearCachedAccessToken)|serverAuthCode/);
    }
  });

  it('the server has no place to keep one: no Google token column, table or Edge Function secret in our schema', () => {
    const sql = readdirSync(join(root, 'supabase', 'migrations')).map((n) => read('supabase/migrations', n)).join('\n');
    expect(sql).not.toMatch(/google[_ ]?(access|refresh|token)|provider_(refresh_)?token/i);
    const cfg = read('supabase/config.toml');
    const block = cfg.slice(cfg.indexOf('[auth.external.google]'));
    expect(block.split('\n').slice(0, 5).join('\n')).not.toMatch(/additional_scopes|scopes|skip_nonce_check\s*=\s*false/);
  });
});

describe('[NS-54-R9] deletion holds no Google data', () => {
  it('the purge worker removes the auth user, which holds the only Google identity row, and keeps no Google step or table', () => {
    const account = read('supabase/functions/purge-worker/account.ts');
    expect(account).toContain('ctx.c.auth.deleteUser(uid)');
    expect(account).toMatch(/STEP_ORDER = \[[^\]]*'auth_user',?\s*\]/);
    expect(account).not.toMatch(/google/i);
    const own = readdirSync(join(root, 'supabase', 'migrations')).map((n) => read('supabase/migrations', n)).join('\n');
    expect(own).not.toMatch(/create table[^;]*google/i);
  });
});
