/// <reference types="node" />
/**
 * The server-features switch and the build flags on top of it (lib/capabilities.ts).
 * Server features are on in v1.0 (D-100) and on in exactly one eas.json profile today,
 * `preview`, the alpha against staging (D-106); every other profile is off until the
 * R-17 gate passes. Remote config cannot turn anything on; with the switch off no
 * Supabase client is ever made and sync never starts (the kill path). The build flags
 * `backup` and `statusReport` (F19-REQ-025) need the switch and their own variable, are
 * off in every profile, and a remote kill switch can only pause them. The sign-in and
 * sync wrappers are exercised here with the switch on as well, through the test-only
 * override. The English-only switch (D-111 item 4) is its own flag: on in the two alpha
 * profiles, off in development and e2e.
 */
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRemoteConfig, TRUSTED_SIGNING_KEYS } from '@scribe/api';
import {
  buildFlagEnabled,
  capabilities,
  englishOnlyEnabled,
  KILL_SWITCH_FLAG,
  mayRun,
  parseServerFeatures,
  serverFeaturesEnabled,
  setBuildFlagForTests,
  setEnglishOnlyForTests,
  setServerFeaturesForTests,
  type BuildFlag,
  type PausableFeature,
} from '../src/lib/capabilities';
import { docsBaseFor } from '../src/lib/remote/base.logic';
import { PACK_MANIFEST } from '../../../supabase/functions/config/published';

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
    expect(capabilities).toEqual({ signIn: false, sync: false, coParent: false, backup: false, statusReport: false, analytics: false, englishOnly: false });
  });

  it('is on only where flipped: the preview alpha (D-106), and testflight after the R-17 flip; production and development are off (eas.json)', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    const profiles = Object.keys(eas.build);
    expect(profiles).toEqual(expect.arrayContaining(['development', 'preview', 'production', 'testflight']));
    // The R-17 flip is the testflight line alone (docs/release/TESTFLIGHT.md); this test passes either side of it.
    const flipped = eas.build.testflight.env?.EXPO_PUBLIC_SERVER_FEATURES === 'on';
    const expected = flipped ? ['preview', 'testflight'] : ['preview'];
    const on = profiles.filter((name) => parseServerFeatures(eas.build[name].env?.EXPO_PUBLIC_SERVER_FEATURES));
    expect(on).toEqual(expected);
    for (const name of profiles) {
      // Written out as on or off in every profile, never left to a default.
      expect(eas.build[name].env?.EXPO_PUBLIC_SERVER_FEATURES, name).toBe(expected.includes(name) ? 'on' : 'off');
    }
    expect(eas.build.production.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
    expect(eas.build.development.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
  });

  it('is off for local development (.env.development)', () => {
    const line = readFileSync(join(APP, '.env.development'), 'utf8')
      .split('\n')
      .find((l) => l.startsWith('EXPO_PUBLIC_SERVER_FEATURES='));
    expect(line).toBe('EXPO_PUBLIC_SERVER_FEATURES=off');
  });

  it('app.config.ts records the same rules in extra (off unless "on"; a build flag needs the switch)', () => {
    const src = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    expect(src).toMatch(/const isOn = \(raw: string \| undefined\) => \(raw \?\? ''\)\.trim\(\)\.toLowerCase\(\) === 'on';/);
    expect(src).toMatch(/const serverFeatures = isOn\(process\.env\.EXPO_PUBLIC_SERVER_FEATURES\);/);
    expect(src).toMatch(/backup: serverFeatures && isOn\(process\.env\.EXPO_PUBLIC_BACKUP\)/);
    expect(src).toMatch(/statusReport: serverFeatures && isOn\(process\.env\.EXPO_PUBLIC_STATUS_REPORT\)/);
    expect(src).toMatch(/extra: \{[^}]*\.\.\.capabilityFlags\(\),/);
  });

  it('the override is for tests only, and goes back to the build value', () => {
    setServerFeaturesForTests(true);
    // Analytics, English only and the two build flags have their own switches: server features on does not turn them on.
    expect(capabilities).toEqual({ signIn: true, sync: true, coParent: true, backup: false, statusReport: false, analytics: false, englishOnly: false });
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

describe('[F19-REQ-025] build flags backup and statusReport: off unless the build says on, and only with the server switch', () => {
  const FLAGS: BuildFlag[] = ['backup', 'statusReport'];
  const VARIABLE: Record<BuildFlag, string> = { backup: 'EXPO_PUBLIC_BACKUP', statusReport: 'EXPO_PUBLIC_STATUS_REPORT' };
  afterEach(() => {
    setServerFeaturesForTests(null);
    for (const f of FLAGS) setBuildFlagForTests(f, null);
  });

  it('are off in this process (neither variable is set)', () => {
    for (const f of FLAGS) {
      expect(process.env[VARIABLE[f]] ?? '', f).not.toBe('on');
      expect(buildFlagEnabled(f), f).toBe(false);
      expect(capabilities[f], f).toBe(false);
    }
  });

  it('are written out as off in every EAS profile, the preview alpha included (on only where flipped: nowhere yet)', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, p] of Object.entries(eas.build)) {
      for (const f of FLAGS) expect(p.env?.[VARIABLE[f]], `${name} ${VARIABLE[f]}`).toBe('off');
    }
  });

  it('a flag alone never brings the server back: with the switch off the flag is ignored', () => {
    setServerFeaturesForTests(false);
    for (const f of FLAGS) {
      setBuildFlagForTests(f, true);
      expect(capabilities[f], f).toBe(false);
      expect(capabilities.signIn).toBe(false);
    }
  });

  it('each flag is on only with the switch on and its own variable on, and one flag never turns on the other', () => {
    setServerFeaturesForTests(true);
    expect(capabilities.backup).toBe(false);
    expect(capabilities.statusReport).toBe(false);
    setBuildFlagForTests('backup', true);
    expect(capabilities.backup).toBe(true);
    expect(capabilities.statusReport).toBe(false);
    setBuildFlagForTests('backup', null);
    setBuildFlagForTests('statusReport', true);
    expect(capabilities.backup).toBe(false);
    expect(capabilities.statusReport).toBe(true);
    // Sign-in, sync and co-parent work with either flag off (F19-REQ-025).
    expect(capabilities.signIn && capabilities.sync && capabilities.coParent).toBe(true);
  });

  it('the flag override is for tests only', () => {
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setBuildFlagForTests('backup', true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(buildFlagEnabled('backup')).toBe(false);
  });
});

describe('[D-111 item 4] English only: on in the two alpha profiles, off in development and e2e', () => {
  type Eas = { build: Record<string, { env?: Record<string, string> }> };
  const eas = () => JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as Eas;
  afterEach(() => {
    setEnglishOnlyForTests(null);
    setServerFeaturesForTests(null);
  });

  it('is off in this process (no EXPO_PUBLIC_ENGLISH_ONLY), so the tests see the picker as before', () => {
    expect(process.env.EXPO_PUBLIC_ENGLISH_ONLY ?? '').not.toBe('on');
    expect(englishOnlyEnabled()).toBe(false);
    expect(capabilities.englishOnly).toBe(false);
  });

  it('is written out as "on" in both alpha profiles, testflight (build 1) and preview (build 2)', () => {
    const { build } = eas();
    expect(build.testflight.env?.EXPO_PUBLIC_ENGLISH_ONLY).toBe('on');
    expect(build.preview.env?.EXPO_PUBLIC_ENGLISH_ONLY).toBe('on');
    expect(parseServerFeatures(build.testflight.env?.EXPO_PUBLIC_ENGLISH_ONLY)).toBe(true);
    expect(parseServerFeatures(build.preview.env?.EXPO_PUBLIC_ENGLISH_ONLY)).toBe(true);
  });

  it('is off in development and e2e: not set there, and unset reads as off', () => {
    const { build } = eas();
    for (const name of ['development', 'e2e']) {
      expect(build[name], name).toBeDefined();
      expect(build[name].env?.EXPO_PUBLIC_ENGLISH_ONLY, name).toBeUndefined();
      expect(parseServerFeatures(build[name].env?.EXPO_PUBLIC_ENGLISH_ONLY), name).toBe(false);
    }
    // Nor in the local .env files a development build reads.
    for (const f of readdirSync(APP).filter((n) => n.startsWith('.env'))) {
      expect(readFileSync(join(APP, f), 'utf8'), f).not.toMatch(/EXPO_PUBLIC_ENGLISH_ONLY/);
    }
  });

  it('is on only in the two alpha profiles; every other profile is as before', () => {
    const { build } = eas();
    const on = Object.keys(build).filter((name) => parseServerFeatures(build[name].env?.EXPO_PUBLIC_ENGLISH_ONLY));
    expect(on.sort()).toEqual(['preview', 'testflight']);
  });

  it('does not follow the server switch: on with servers off (testflight) and with servers on (preview)', () => {
    for (const server of [false, true]) {
      setServerFeaturesForTests(server);
      setEnglishOnlyForTests(true);
      expect(capabilities.englishOnly, String(server)).toBe(true);
      setEnglishOnlyForTests(false);
      expect(capabilities.englishOnly, String(server)).toBe(false);
    }
    // And turning it on changes no other capability.
    setServerFeaturesForTests(null);
    setEnglishOnlyForTests(true);
    expect(capabilities).toEqual({ signIn: false, sync: false, coParent: false, backup: false, statusReport: false, analytics: false, englishOnly: true });
  });

  it('the override is for tests only, and goes back to the build value', () => {
    setEnglishOnlyForTests(true);
    setEnglishOnlyForTests(null);
    expect(englishOnlyEnabled()).toBe(false);
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setEnglishOnlyForTests(true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(englishOnlyEnabled()).toBe(false);
  });

  it('capabilities.ts reads process.env.EXPO_PUBLIC_ENGLISH_ONLY written out in full, once, so Expo inlines it (a misspelt or dynamic read fails here)', () => {
    const code = readFileSync(join(APP, 'src/lib/capabilities.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    // Every build variable is a literal member read; none is computed, so none can escape inlining.
    expect(code).not.toMatch(/process\.env\s*\[/);
    expect(code).not.toMatch(/\{[^}]*\}\s*=\s*process\.env\b/);
    const reads = [...code.matchAll(/process\.env\.([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    expect(reads.sort()).toEqual(['EXPO_PUBLIC_ANALYTICS', 'EXPO_PUBLIC_BACKUP', 'EXPO_PUBLIC_ENGLISH_ONLY', 'EXPO_PUBLIC_SERVER_FEATURES', 'EXPO_PUBLIC_STATUS_REPORT']);
    expect(code).toMatch(/const ENGLISH_ONLY_BUILD_VALUE: boolean = parseServerFeatures\(process\.env\.EXPO_PUBLIC_ENGLISH_ONLY\);/);
    expect(code).toMatch(/return englishOnlyTestOverride \?\? ENGLISH_ONLY_BUILD_VALUE;/);
    expect(code).toMatch(/get englishOnly\(\): boolean \{\s*return englishOnlyEnabled\(\);/);
    // No other spelling of the name anywhere in the file, comments included.
    const spellings = readFileSync(join(APP, 'src/lib/capabilities.ts'), 'utf8').match(/EXPO_PUBLIC_\w*ENGLISH\w*/gi) ?? [];
    expect([...new Set(spellings)]).toEqual(['EXPO_PUBLIC_ENGLISH_ONLY']);
  });

  it('eas.json writes EXPO_PUBLIC_ENGLISH_ONLY as "on" in testflight and preview and names it nowhere else, in no other spelling', () => {
    const text = readFileSync(join(APP, 'eas.json'), 'utf8');
    expect(text.match(/"EXPO_PUBLIC_ENGLISH_ONLY": "on"/g)?.length).toBe(2);
    expect([...new Set(text.match(/\w*ENGLISH\w*/gi) ?? [])]).toEqual(['EXPO_PUBLIC_ENGLISH_ONLY']);
    const { build } = eas();
    const naming = Object.entries(build).filter(([, p]) => p.env && 'EXPO_PUBLIC_ENGLISH_ONLY' in p.env);
    expect(naming.map(([n]) => n).sort()).toEqual(['preview', 'testflight']);
    for (const [n, p] of naming) expect(p.env?.EXPO_PUBLIC_ENGLISH_ONLY, n).toBe('on');
  });

  it('the preflight FAILs either alpha build whose profile does not say EXPO_PUBLIC_ENGLISH_ONLY=on', () => {
    const preflight = readFileSync(join(APP, 'scripts/preflight-testflight.mjs'), 'utf8');
    // Inside the per-profile block, so it runs for testflight (build 1) and preview (build 2) alike.
    const block = preflight.slice(preflight.indexOf('if (prof) {'), preflight.indexOf("check(prof.autoIncrement === true"));
    expect(block).toMatch(/check\(\s*profEnv\.EXPO_PUBLIC_ENGLISH_ONLY === 'on',/);
    expect(block).toMatch(/D-111 item 4/);
  });
});

describe('[F19-REQ-011] remote kill switches can pause a build flag, never start one', () => {
  const FEATURES = Object.keys(KILL_SWITCH_FLAG) as PausableFeature[];
  afterEach(() => {
    setServerFeaturesForTests(null);
    setBuildFlagForTests('backup', null);
    setBuildFlagForTests('statusReport', null);
  });

  it('names the three switches of F19 6.5 and the flag each one pauses', () => {
    expect(KILL_SWITCH_FLAG).toEqual({ backupUploads: 'backup', escrow: 'backup', statusReport: 'statusReport' });
  });

  it('with the build flag off, no config of any shape makes a feature run', () => {
    const configs = [
      null,
      undefined,
      {},
      { killSwitches: null },
      { killSwitches: {} },
      { killSwitches: { backupUploads: false, escrow: false, statusReport: false } },
      { killSwitches: { backupUploads: 'off', escrow: 0, statusReport: 'false' } },
      { killSwitches: { backup: true, statusReport: true }, flags: { backup: true, statusReport: true } },
    ];
    for (const server of [false, true]) {
      setServerFeaturesForTests(server);
      for (const f of FEATURES) for (const c of configs) expect(mayRun(f, c), `${server} ${f} ${JSON.stringify(c)}`).toBe(false);
    }
  });

  it('with the build flag on, the feature runs unless its own switch is exactly true', () => {
    setServerFeaturesForTests(true);
    setBuildFlagForTests('backup', true);
    setBuildFlagForTests('statusReport', true);
    for (const f of FEATURES) {
      expect(mayRun(f, null), f).toBe(true);
      expect(mayRun(f, { killSwitches: {} }), f).toBe(true);
      expect(mayRun(f, { killSwitches: { [f]: false } }), f).toBe(true);
      expect(mayRun(f, { killSwitches: { [f]: true } }), f).toBe(false);
    }
    // One switch pauses only its own feature.
    expect(mayRun('backupUploads', { killSwitches: { statusReport: true } })).toBe(true);
    expect(mayRun('statusReport', { killSwitches: { backupUploads: true, escrow: true } })).toBe(true);
    expect(mayRun('escrow', { killSwitches: { backupUploads: true } })).toBe(true);
  });

  it('pausing never changes the build flag itself', () => {
    setServerFeaturesForTests(true);
    setBuildFlagForTests('backup', true);
    expect(mayRun('backupUploads', { killSwitches: { backupUploads: true } })).toBe(false);
    expect(capabilities.backup).toBe(true);
  });

  it('a served config cannot add a backup or status report capability (no such key in the schema)', () => {
    const r = parseRemoteConfig({
      schemaVersion: 1,
      version: 10,
      generatedAt: '2026-10-15T12:00:00.000Z',
      backup: true,
      statusReport: true,
      flags: { backup: true, statusReport: true },
      killSwitches: { backupUploads: false, escrow: false, statusReport: false },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.value.flags)).not.toContain('backup');
    expect(Object.keys(r.value.flags)).not.toContain('statusReport');
    for (const f of FEATURES) expect(mayRun(f, r.value), f).toBe(false);
    expect(capabilities.backup).toBe(false);
    expect(capabilities.statusReport).toBe(false);
  });

  it('[F19-REQ-011] a served config with an M14 switch set pauses that feature through mayRun; an older config without the keys pauses nothing', () => {
    setServerFeaturesForTests(true);
    setBuildFlagForTests('backup', true);
    setBuildFlagForTests('statusReport', true);
    const base = { schemaVersion: 1, version: 11, generatedAt: '2026-10-15T12:00:00.000Z' };
    for (const f of FEATURES) {
      const r = parseRemoteConfig({ ...base, killSwitches: { [f]: true } });
      expect(r.ok, f).toBe(true);
      if (!r.ok) return;
      expect(r.value.killSwitches[f], f).toBe(true);
      expect(mayRun(f, r.value), f).toBe(false);
    }
    const older = parseRemoteConfig({ ...base, killSwitches: { sync: false, invites: false, photos: false, packDownloads: false, serverContent: false } });
    expect(older.ok).toBe(true);
    if (!older.ok) return;
    for (const f of FEATURES) expect(mayRun(f, older.value), f).toBe(true);
  });
});

describe('remote config cannot turn server features on (BRIEF decision 16)', () => {
  it('capabilities.ts imports nothing: the value comes from the bundle only', () => {
    const src = readFileSync(join(APP, 'src/lib/capabilities.ts'), 'utf8');
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/require\(/);
  });

  it('no app code calls a test override', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const f = join(dir, n);
        if (statSync(f).isDirectory()) walk(f);
        else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) files.push(f);
      }
    };
    walk(join(APP, 'src'));
    const callers = files.filter(
      (f) => !f.endsWith('capabilities.ts') && /set(ServerFeatures|BuildFlag|Analytics|EnglishOnly)ForTests/.test(readFileSync(f, 'utf8')),
    );
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

describe('[D-115] the preflight fails either alpha build without the signed English pack release', () => {
  // The app loads its speech model only from the signed manifest, so a build without a trusted key and a published
  // manifest cannot transcribe (DECISIONS.md D-115; TESTFLIGHT.md step 4). The verdict follows the tree as it is.
  const preflight = (profile: string) =>
    new Promise<{ code: number; out: string }>((resolve) => {
      // Nothing from this shell or this vitest run that the preflight would read: build switches, B-9, nested vitest.
      const env = { ...process.env };
      for (const k of Object.keys(env)) if (/^(EXPO_PUBLIC_|VITEST)/.test(k) || k === 'EAS_BUILD_PROFILE') delete env[k];
      const args = [join(APP, 'scripts/preflight-testflight.mjs'), '--profile', profile, '--skip-prebuild'];
      execFile(process.execPath, args, { cwd: APP, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({ code: err ? Number(err.code ?? 1) : 0, out: `${stdout}${stderr}` });
      });
    });

  it('FAILs testflight and preview, citing D-115, for each of the key and the manifest that is missing, and PASSes once both are in', async () => {
    const missing = (TRUSTED_SIGNING_KEYS.length === 0 ? 1 : 0) + (PACK_MANIFEST === null ? 1 : 0);
    // A repeated key id FAILs on its own (F19-REQ-002), and then the D-115 PASS is withheld too.
    const repeatedId = new Set(TRUSTED_SIGNING_KEYS.map((k) => k.keyId)).size !== TRUSTED_SIGNING_KEYS.length;
    for (const r of await Promise.all([preflight('testflight'), preflight('preview')])) {
      const lines = r.out.split('\n');
      expect(lines.filter((l) => l.startsWith('FAIL') && /D-115/.test(l)), r.out).toHaveLength(missing);
      expect(lines.filter((l) => /^PASS\s+D-115:/.test(l)), r.out).toHaveLength(missing || repeatedId ? 0 : 1);
      expect(r.out).not.toMatch(/Step 4 is optional/);
      if (missing) {
        expect(r.code).toBe(1);
        expect(r.out).toMatch(/Step 4 is required for both alpha builds \(D-115\)/);
      }
    }
  }, 180_000);

  it('gives the D-115 PASS only when the key check passed: a repeated key id withholds it', () => {
    const source = readFileSync(join(APP, 'scripts/preflight-testflight.mjs'), 'utf8');
    expect(source).toMatch(/keysUsable = repeated\.length === 0;\n\s*if \(repeated\.length\) fail\(/);
    expect(source).toMatch(/if \(keysUsable && manifestPublished\) pass\('D-115:/);
    expect(source.match(/pass\('D-115:/g)).toHaveLength(1);
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
