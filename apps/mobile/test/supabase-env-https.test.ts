/**
 * BL-600 (SEC-07, SEC-R16): a preview (TestFlight) or production (App Store) build never talks to the
 * server over plain http. `parseSupabaseEnv` refuses any http URL there, local network or not, so the app
 * stays offline-only instead of sending a session token in the clear. A development build may still use a
 * local stack over http. The Info.plist App Transport Security check is a separate CI item (qa).
 */
import { describe, expect, it } from 'vitest';
import { parseSupabaseEnv } from '../src/lib/supabase/env';
import { MOCK_SUPABASE_URL } from '../e2e-web/support/mock-server';
import fs from 'node:fs';
import path from 'node:path';

const KEY = 'sb_publishable_asha';
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
  it('[BL-600] global-setup builds server-on as preview and hands it that URL', () => {
    const src = fs.readFileSync(path.join(__dirname, '../e2e-web/support/global-setup.ts'), 'utf8');
    expect(src).toContain("EXPO_PUBLIC_APP_ENV: 'preview'");
    expect(src).toContain('EXPO_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL');
  });
});
