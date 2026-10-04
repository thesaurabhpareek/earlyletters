/// <reference types="node" />
/**
 * The server-features switch (lib/capabilities.ts; founder decision, 3 Oct 2026:
 * v1.0 ships on this phone only). Off by default in every build profile; remote
 * config cannot turn it on; with it off no Supabase client is ever made and sync
 * never starts. The sign-in and sync wrappers are exercised here with the switch
 * on as well, through the test-only override.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRemoteConfig } from '@scribe/api';
import { capabilities, parseServerFeatures, serverFeaturesEnabled, setServerFeaturesForTests } from '../src/lib/capabilities';
import { docsBaseFor } from '../src/lib/remote/base.logic';

const APP = join(__dirname, '..');

describe('server features switch: off unless a build says on', () => {
  afterEach(() => setServerFeaturesForTests(null));

  it('reads only "on" as on', () => {
    expect(parseServerFeatures('on')).toBe(true);
    expect(parseServerFeatures(' ON ')).toBe(true);
    for (const v of [undefined, null, '', 'off', '1', 'true', 'yes', 'enabled', 'onn']) expect(parseServerFeatures(v), String(v)).toBe(false);
  });

  it('is off in this process (no EXPO_PUBLIC_SERVER_FEATURES), and every capability follows it', () => {
    expect(process.env.EXPO_PUBLIC_SERVER_FEATURES ?? '').not.toBe('on');
    expect(serverFeaturesEnabled()).toBe(false);
    expect(capabilities).toEqual({ signIn: false, sync: false, coParent: false });
  });

  it('is off in every EAS build profile (eas.json)', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    const profiles = Object.keys(eas.build);
    expect(profiles).toEqual(expect.arrayContaining(['development', 'preview', 'production']));
    for (const name of profiles) {
      const env = eas.build[name].env ?? {};
      expect(env.EXPO_PUBLIC_SERVER_FEATURES, name).toBe('off');
      expect(parseServerFeatures(env.EXPO_PUBLIC_SERVER_FEATURES), name).toBe(false);
    }
  });

  it('is off for local development (.env.development)', () => {
    const line = readFileSync(join(APP, '.env.development'), 'utf8')
      .split('\n')
      .find((l) => l.startsWith('EXPO_PUBLIC_SERVER_FEATURES='));
    expect(line).toBe('EXPO_PUBLIC_SERVER_FEATURES=off');
  });

  it('app.config.ts records the same rule in extra.serverFeatures (off unless "on")', () => {
    const src = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    expect(src).toMatch(/const serverFeatures = \(process\.env\.EXPO_PUBLIC_SERVER_FEATURES \?\? ''\)\.trim\(\)\.toLowerCase\(\) === 'on';/);
    expect(src).toMatch(/extra: \{[^}]*serverFeatures,/);
  });

  it('the override is for tests only, and goes back to the build value', () => {
    setServerFeaturesForTests(true);
    expect(capabilities).toEqual({ signIn: true, sync: true, coParent: true });
    setServerFeaturesForTests(null);
    expect(serverFeaturesEnabled()).toBe(false);
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setServerFeaturesForTests(true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(serverFeaturesEnabled()).toBe(false);
  });
});

describe('remote config cannot turn server features on (BRIEF decision 16)', () => {
  it('capabilities.ts imports nothing: the value comes from the bundle only', () => {
    const src = readFileSync(join(APP, 'src/lib/capabilities.ts'), 'utf8');
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/require\(/);
  });

  it('no app code calls the test override', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const f = join(dir, n);
        if (statSync(f).isDirectory()) walk(f);
        else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) files.push(f);
      }
    };
    walk(join(APP, 'src'));
    const callers = files.filter((f) => !f.endsWith('capabilities.ts') && readFileSync(f, 'utf8').includes('setServerFeaturesForTests'));
    expect(callers).toEqual([]);
  });

  it('a served config with server keys changes nothing; only the teaser copy can be quieted', () => {
    const r = parseRemoteConfig({
      schemaVersion: 1,
      version: 9,
      generatedAt: '2026-10-03T12:00:00.000Z',
      serverFeatures: true,
      flags: { familyTeaser: 'quiet', signIn: true, sync: true, coParent: true },
      killSwitches: { sync: false, invites: false },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.flags.familyTeaser).toBe('quiet');
    expect(Object.keys(r.value.flags).sort()).toEqual(['familyTeaser', 'introVariant', 'lockScreenNamesDefault']);
    expect(serverFeaturesEnabled()).toBe(false);
  });
});

describe('remote documents never fall back to Supabase with the switch off', () => {
  const SB = 'https://abc.supabase.co';
  it('uses the CDN when set, either way', () => {
    expect(docsBaseFor('https://docs.example.com/', false, null)).toBe('https://docs.example.com');
    expect(docsBaseFor('https://docs.example.com', true, SB)).toBe('https://docs.example.com');
  });
  it('off: no CDN means bundled defaults, never the Supabase URL', () => {
    expect(docsBaseFor(undefined, false, SB)).toBeNull();
    expect(docsBaseFor('http://insecure.example.com', false, SB)).toBeNull();
  });
  it('on: the Supabase URL is the fallback (v1.1)', () => {
    expect(docsBaseFor('', true, SB)).toBe(SB);
  });
});

// ---------------------------------------------------------------------------
// Boot: no Supabase client and no sync when off (the real modules, natives mocked)
// ---------------------------------------------------------------------------

const { createClient, onSignedIn, subscribeAuth, registerUploadQueue } = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} } })),
  onSignedIn: vi.fn(() => () => {}),
  subscribeAuth: vi.fn(() => () => {}),
  registerUploadQueue: vi.fn(() => () => {}),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: vi.fn(() => ({ remove: vi.fn() })) }, Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n) }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));

vi.mock('../src/lib/auth/auth-store', () => ({
  currentAuthUserId: () => null,
  onInviteAccepted: vi.fn(() => () => {}),
  onSignedIn,
  registerUploadQueue,
  subscribeAuth,
  syncAllowed: () => false,
}));
vi.mock('../src/lib/store', () => ({ uuidv7: () => '0190-test', localSqlDb: vi.fn(), notifyStoreChanged: vi.fn() }));
vi.mock('../src/lib/sync/engine', () => ({ createSyncEngine: vi.fn() }));
vi.mock('../src/lib/sync/outbox', () => ({ SYNC_SETTING: {}, pendingCount: () => 0, readSetting: () => null, rejectedUnseenCount: () => 0 }));
vi.mock('../src/lib/sync/ownership', () => ({ AccountMismatchError: class extends Error {}, takeOwnership: vi.fn(), retryRefusedBook: vi.fn() }));
vi.mock('../src/lib/sync/signal', () => ({ onOutboxChange: vi.fn(() => () => {}) }));

describe('boot with server features off', () => {
  beforeEach(() => {
    // A build that has Supabase settings: only the switch keeps the client away.
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    createClient.mockClear();
    onSignedIn.mockClear();
    subscribeAuth.mockClear();
    registerUploadQueue.mockClear();
    vi.resetModules();
  });
  afterEach(() => {
    setServerFeaturesForTests(null);
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('constructs no Supabase client: the session provider sees "not configured"', async () => {
    const client = await import('../src/lib/supabase/client');
    expect(client.getSupabaseOrNull()).toBeNull();
    expect(client.isSupabaseConfigured()).toBe(false);
    expect(client.startAutoRefreshWhileActive()).toBeTypeOf('function');
    expect(() => client.getSupabase()).toThrow('supabase_not_configured');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('starts no sync: no listeners, no upload queue, no client', async () => {
    const sync = await import('../src/lib/sync');
    const stop = sync.startSync();
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(subscribeAuth).not.toHaveBeenCalled();
    expect(registerUploadQueue).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    stop();
  });

  it('with the switch on (v1.1 tests), the same build makes one client and wires sync', async () => {
    const caps = await import('../src/lib/capabilities');
    caps.setServerFeaturesForTests(true);
    const client = await import('../src/lib/supabase/client');
    expect(client.getSupabaseOrNull()).not.toBeNull();
    expect(client.getSupabaseOrNull()).toBe(client.getSupabaseOrNull());
    expect(createClient).toHaveBeenCalledTimes(1);
    const sync = await import('../src/lib/sync');
    const stop = sync.startSync();
    expect(onSignedIn).toHaveBeenCalledTimes(1);
    expect(registerUploadQueue).toHaveBeenCalledTimes(1);
    stop();
    caps.setServerFeaturesForTests(null);
  });
});
