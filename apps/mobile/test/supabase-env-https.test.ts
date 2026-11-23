/**
 * BL-600 (SEC-07, SEC-R16): a preview (TestFlight) or production (App Store) build never talks to the
 * server over plain http. `parseSupabaseEnv` refuses any http URL there, local network or not, so the app
 * stays offline-only instead of sending a session token in the clear. A development build may still use a
 * local stack over http. The Info.plist App Transport Security check is a separate CI item (qa).
 */
import { describe, expect, it } from 'vitest';
import { parseSupabaseEnv } from '../src/lib/supabase/env';
import { MOCK_SUPABASE_URL } from '../e2e-web/support/mock-server';
import { BUILDS, buildEnv, inheritedEnv } from '../e2e-web/support/builds';
import fs from 'node:fs';
import path from 'node:path';

const KEY = 'sb_publishable_asha';
// Same pattern as settings-help.test.ts: drop block and line comments so a comment cannot satisfy a source check.
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SPREAD = /\.\.\.buildEnv\(b\.env\)/;

const HTTP = ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://192.168.1.20:54321', 'http://10.0.0.5', 'http://asha.supabase.co'];

describe('[BL-600] store builds refuse plain http', () => {
  for (const env of ['preview', 'production'] as const) {
    it(`[BL-600] ${env}: every http URL returns null`, () => {
      for (const url of HTTP) expect(parseSupabaseEnv(url, KEY, env), url).toBeNull();
    });
    it(`[BL-600] ${env}: an https URL is still accepted`, () => {
      expect(parseSupabaseEnv('https://asha.supabase.co/', KEY, env)).toEqual({ url: 'https://asha.supabase.co', key: KEY });
    });
  }

  it('[BL-600] development: a local stack over http is still allowed, a public http host is not', () => {
    expect(parseSupabaseEnv('http://localhost:54321', KEY, 'development')).toEqual({ url: 'http://localhost:54321', key: KEY });
    expect(parseSupabaseEnv('http://192.168.1.20:54321', KEY, 'development')).not.toBeNull();
    expect(parseSupabaseEnv('http://asha.supabase.co', KEY, 'development')).toBeNull();
  });

  it('[BL-600] missing values still return null in every build', () => {
    for (const env of ['development', 'preview', 'production'] as const) {
      expect(parseSupabaseEnv('https://asha.supabase.co', '', env)).toBeNull();
      expect(parseSupabaseEnv(undefined, KEY, env)).toBeNull();
    }
  });
});

describe('[BL-600] the server-on web e2e build keeps its Supabase client', () => {
  it('[BL-600] the mocked server URL parses in a preview build (http would give null and silently drop every server-on flow)', () => {
    expect(parseSupabaseEnv(MOCK_SUPABASE_URL, 'e2e-web-publishable-key', 'preview')).not.toBeNull();
  });
  it('[BL-600] the server-on build is made as preview and handed that URL (builds.ts; global-setup passes the env through)', () => {
    const on = BUILDS.find((x) => x.name === 'server-on')!;
    const env = buildEnv(on.env);
    expect(env.EXPO_PUBLIC_APP_ENV).toBe('preview');
    expect(env.EXPO_PUBLIC_SUPABASE_URL).toBe(MOCK_SUPABASE_URL);
    const src = code(fs.readFileSync(path.join(__dirname, '../e2e-web/support/global-setup.ts'), 'utf8'));
    expect(src).toMatch(SPREAD);
  });
  it('[BL-1591] a spread that appears only in a comment does not satisfy the pass-through check', () => {
    expect(code('// env: { ...process.env, ...buildEnv(b.env) }\nconst x = 1;')).not.toMatch(SPREAD);
    expect(code('/* ...buildEnv(b.env) */ const x = 1;')).not.toMatch(SPREAD);
    expect(code('env: { ...process.env, ...buildEnv(b.env) }, // pass through')).toMatch(SPREAD);
  });
});

describe('[BL-1576] a shell EXPO_PUBLIC_E2E never reaches a non-seam web build', () => {
  // What global-setup hands to `expo export` for a build: the inherited shell env, then the build's own env.
  const exportEnv = (name: string, shell: Record<string, string | undefined>) =>
    ({ ...inheritedEnv(shell), ...buildEnv(BUILDS.find((x) => x.name === name)!.env) }) as Record<string, string | undefined>;
  const SHELL = { EXPO_PUBLIC_E2E: '1', PATH: '/usr/bin', HOME: '/home/asha' };

  for (const name of ['plain', 'seed', 'server-on'])
    it(`[BL-1576] ${name}: a shell EXPO_PUBLIC_E2E=1 is gone`, () => {
      const env = exportEnv(name, SHELL);
      expect(env.EXPO_PUBLIC_E2E).toBeUndefined();
      expect(env.PATH).toBe('/usr/bin'); // the rest of the shell still passes through
    });
  it('[BL-1576] seam: keeps its own switch, and an empty shell does not remove it', () => {
    expect(exportEnv('seam', SHELL).EXPO_PUBLIC_E2E).toBe('1');
    expect(exportEnv('seam', {}).EXPO_PUBLIC_E2E).toBe('1');
  });
  it('[BL-1576] seam: a shell value other than 1 does not leak through either', () => {
    expect(exportEnv('seam', { EXPO_PUBLIC_E2E: '0' }).EXPO_PUBLIC_E2E).toBe('1');
  });
  it('[BL-1576] global-setup passes the shell env only through inheritedEnv', () => {
    const src = code(fs.readFileSync(path.join(__dirname, '../e2e-web/support/global-setup.ts'), 'utf8'));
    expect(src).toMatch(/\.\.\.inheritedEnv\(process\.env\)/);
    expect(src).not.toMatch(/\.\.\.process\.env/);
  });
});
// Web-scan note (BL-1576): B-8 scans an iOS export only. If a web store bundle ever exists, scan it for the e2e seam too.

describe('[BL-1576] no shell EXPO_PUBLIC_* key reaches any web build except what the build sets itself', () => {
  const POLLUTED = {
    EXPO_PUBLIC_E2E: '1',
    EXPO_PUBLIC_WEB_PREVIEW: '1',
    EXPO_PUBLIC_SUPABASE_URL: 'https://shell.example',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'shell-key',
    EXPO_PUBLIC_APP_ENV: 'production',
    EXPO_PUBLIC_ANYTHING_NEW: 'x',
    PATH: '/usr/bin',
  };
  for (const b of BUILDS)
    it(`[BL-1576] ${b.name}: only the build's own EXPO_PUBLIC_* keys and values survive a polluted shell`, () => {
      const env = { ...inheritedEnv(POLLUTED), ...buildEnv(b.env) } as Record<string, string | undefined>;
      const own = buildEnv(b.env);
      for (const [k, v] of Object.entries(env)) if (k.startsWith('EXPO_PUBLIC_')) expect(v, k).toBe(own[k]);
      for (const k of Object.keys(POLLUTED)) if (k.startsWith('EXPO_PUBLIC_') && !(k in own)) expect(env[k], k).toBeUndefined();
      expect(env.PATH).toBe('/usr/bin');
    });
  it('[BL-1576] the supabase https build keeps its own URL and key over a shell value', () => {
    const env = { ...inheritedEnv(POLLUTED), ...buildEnv(BUILDS.find((x) => x.name === 'server-on')!.env) };
    expect(env.EXPO_PUBLIC_SUPABASE_URL).toBe(MOCK_SUPABASE_URL);
    expect(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe('e2e-web-publishable-key');
  });
});
