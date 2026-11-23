/**
 * [NS-54-R7] no Google token stored by us, and [NS-54-R9] deletion holds no Google data (BL-1892).
 * What we request and store of a Google sign-in: no access token, no refresh token, no server auth code, no picture.
 * The ID token goes once to signInWithIdToken (Supabase Auth keeps what it keeps: see the finding, F1) and is read,
 * written or sent nowhere else; Google's own session on the phone is asked to close. Fictional family "Asha".
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
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('[NS-54-R7] no Google token stored by us', () => {
  it('sends the ID token once to Supabase and nothing else, and never asks Google for tokens or a server code', async () => {
    const { signInWithGoogle } = await load();
    const signInWithIdToken = vi.fn(async () => ({ data: { user: { id: 'asha-user-1' } }, error: null }));
    const sb = { auth: { signInWithIdToken } } as never;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((k) => vi.spyOn(console, k).mockImplementation(() => {}));
    const beacon = vi.fn();
    const g = globalThis as Record<string, unknown>;
    const had = Object.keys(g);
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    const ws = vi.fn();
    const xhr = vi.fn();
    vi.stubGlobal('WebSocket', ws);
    vi.stubGlobal('XMLHttpRequest', xhr);
    expect(await signInWithGoogle(sb)).toBe('asha-user-1');
    expect(signInWithIdToken).toHaveBeenCalledTimes(1);
    expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'id-token-fixture-asha' });
    expect(h.getTokens).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(ws).not.toHaveBeenCalled();
    expect(xhr).not.toHaveBeenCalled();
    for (const l of logs) expect(l).not.toHaveBeenCalled();
    // No global key was added (a stash of the token on globalThis); the three we installed are ours.
    expect(Object.keys(g).filter((k) => !had.includes(k) && !['navigator', 'WebSocket', 'XMLHttpRequest'].includes(k))).toEqual([]);
    for (const l of logs) l.mockRestore();
    // Only the two client ids are configured: no offline access, no extra scopes, so no server auth code or refresh token is requested.
    expect(h.writes).toEqual(['configure:iosClientId,webClientId']);
    fetchSpy.mockRestore();
  });

  it('asks Google to close its session on the phone after sign-in, also when Supabase refuses the token', async () => {
    const { signInWithGoogle } = await load();
    const ok = { auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: { id: 'asha-user-1' } }, error: null })) } } as never;
    await signInWithGoogle(ok);
    expect(h.signOut).toHaveBeenCalledTimes(1);
    h.signOut.mockClear();
    const bad = { auth: { signInWithIdToken: vi.fn(async () => ({ data: { user: null }, error: new Error('refused') })) } } as never;
    await expect(signInWithGoogle(bad)).rejects.toThrow('refused');
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });

  it('google.ts has no token read, store, network or log call, and no auth file anywhere reads Google tokens (source scan)', () => {
    const dir = join(root, 'apps', 'mobile', 'src', 'lib', 'auth');
    const google = read('apps/mobile/src/lib/auth/google.ts');
    const code = google.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const banned of ['getTokens', 'serverAuthCode', 'accessToken', 'refreshToken', 'offlineAccess', 'scopes', 'photo', 'setItem', 'SecureStore', 'secure-storage', 'AsyncStorage', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'console.', 'globalThis', 'global.']) {
      expect(code, `google.ts must not use ${banned}`).not.toContain(banned);
    }
    // Every file under the auth code directory (and the app tree): no Google token surface, and no file that handles
    // an idToken or GoogleSignin also uses the network or the console.
    const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(d, e.name)] : []));
    for (const f of [...files(dir), ...files(join(root, 'apps', 'mobile', 'src', 'app'))]) {
      const s = readFileSync(f, 'utf8');
      expect(s, `${f} must not read Google tokens`).not.toMatch(/GoogleSignin\.(getTokens|addScopes|clearCachedAccessToken)|serverAuthCode/);
      if (/idToken|GoogleSignin/.test(s)) expect(s, `${f} handles an ID token and must not send or log it`).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|console\.(log|info|warn|error|debug)/);
    }
  });

  it('our schema and Edge Functions have no place to keep one: no Google-ish credential column, no Google secret, no Google scope in config', () => {
    const sql = readdirSync(join(root, 'supabase', 'migrations')).map((n) => read('supabase/migrations', n)).join('\n');
    expect(sql).not.toMatch(/(google|idp|oauth|provider|social)[a-z_ ]{0,12}(access|refresh|token|cred|secret|auth_?code)/i);
    expect(sql).not.toMatch(/(access|refresh|token|cred|secret)[a-z_ ]{0,12}(google|idp|oauth|social)/i);
    const fnFiles = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fnFiles(join(d, e.name)) : [join(d, e.name)]));
    for (const f of fnFiles(join(root, 'supabase', 'functions')).filter((p) => /\.(ts|tsx|json|toml)$/.test(p) && !/\.test\.|\/test\//.test(p))) {
      expect(readFileSync(f, 'utf8'), `${f} must not mention Google (secrets, calls, steps)`).not.toMatch(/google/i);
    }
    const cfg = read('supabase/config.toml');
    const block = cfg.slice(cfg.indexOf('[auth.external.google]')).split('\n').slice(0, 5).join('\n');
    expect(block).not.toMatch(/additional_scopes|scopes/);
  });
});

describe('[NS-54-R9] deletion holds no Google data', () => {
  it('the purge worker removes the auth user (the identity cascade is not proven here) and has no Google file or call and no Google table', () => {
    const account = read('supabase/functions/purge-worker/account.ts');
    expect(account).toContain('ctx.c.auth.deleteUser(uid)');
    expect(account).toMatch(/STEP_ORDER = \[[^\]]*'auth_user',?\s*\]/);
    // Any non-test file in the purge worker that mentions Google would be a Google step or call.
    const dir = join(root, 'supabase', 'functions', 'purge-worker');
    const all = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? all(join(d, e.name)) : [join(d, e.name)]));
    for (const f of all(dir).filter((p) => !/\.test\.|\/test\//.test(p))) {
      expect(f.toLowerCase(), 'no google file').not.toContain('google');
      expect(readFileSync(f, 'utf8'), `${f} must not mention Google`).not.toMatch(/google/i);
    }
    const own = readdirSync(join(root, 'supabase', 'migrations')).map((n) => read('supabase/migrations', n)).join('\n');
    expect(own).not.toMatch(/create table[^;]*google/i);
  });
});
