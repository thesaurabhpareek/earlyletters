/// <reference types="node" />
/**
 * Build configuration (POPS-02, POPS-08, PSEC-05, LEGAL-REQ-043). Evaluates
 * app.config.ts through Expo's own loader (`getConfig` from expo/config, the
 * same path `expo config` and EAS use) once per build environment, and checks
 * eas.json against it.
 *
 * Bundle ids are derived from packages/brand, so these tests hold whatever
 * `brand.publisher.domain` says (example.com today, the real domain later).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getConfig } from 'expo/config';
import type { ExpoConfig } from 'expo/config';
import { brand, bundleId } from '../../../packages/brand/index';
import { APP_ENVS, DEFAULT_APP_ENV, resolveAppEnv, type AppEnv } from '../src/lib/build-env';

const ROOT = path.resolve(__dirname, '..');
const KEY = 'EXPO_PUBLIC_APP_ENV';
const original = process.env[KEY];

afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
});

/** Evaluates app.config.ts with EXPO_PUBLIC_APP_ENV set to `value` (undefined = unset). */
function configFor(value: string | undefined): ExpoConfig {
  if (value === undefined) delete process.env[KEY];
  else process.env[KEY] = value;
  return getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
}

const SUFFIX: Record<AppEnv, string> = { development: '.dev', preview: '.preview', production: '' };

const DATA_PROTECTION_KEY = 'com.apple.developer.default-data-protection';
const DATA_PROTECTION_CLASS = 'NSFileProtectionCompleteUntilFirstUserAuthentication';

/** Apple's required-reason categories and approved reasons (docs/legal/app-store-privacy-labels.md 3.1). */
const APPLE_REASONS: Record<string, readonly string[]> = {
  NSPrivacyAccessedAPICategoryFileTimestamp: ['DDA9.1', 'C617.1', '3B52.1', '0A2A.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1', '8FFB.1', '3D61.1'],
  NSPrivacyAccessedAPICategoryDiskSpace: ['85F4.1', 'E174.1', '7D9E.1', 'B728.1'],
  NSPrivacyAccessedAPICategoryActiveKeyboards: ['3EC4.1', '54BD.1'],
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1', '1C8F.1', 'C56D.1', 'AC6B.1'],
};

describe('APP_ENV resolution (POPS-02)', () => {
  it('unset or empty means development, never production', () => {
    expect(DEFAULT_APP_ENV).toBe('development');
    expect(resolveAppEnv(undefined)).toBe('development');
    expect(resolveAppEnv(null)).toBe('development');
    expect(resolveAppEnv('')).toBe('development');
    expect(resolveAppEnv('   ')).toBe('development');
  });

  it('each named environment resolves to itself', () => {
    for (const env of APP_ENVS) expect(resolveAppEnv(env)).toBe(env);
  });

  it('an unknown value is not silently mapped (caller decides)', () => {
    expect(resolveAppEnv('prod')).toBeNull();
    expect(resolveAppEnv('Production')).toBeNull();
    expect(resolveAppEnv('staging')).toBeNull();
  });
});

describe('app.config.ts per environment', () => {
  it('an unset EXPO_PUBLIC_APP_ENV evaluates as development with the .dev bundle id', () => {
    const exp = configFor(undefined);
    expect(exp.extra?.appEnv).toBe('development');
    expect(exp.ios?.bundleIdentifier).toBe(`${bundleId()}.dev`);
    expect(exp.android?.package).toBe(`${bundleId()}.dev`);
  });

  it('an empty EXPO_PUBLIC_APP_ENV also evaluates as development', () => {
    expect(configFor('').extra?.appEnv).toBe('development');
  });

  for (const env of APP_ENVS) {
    describe(env, () => {
      it(`bundle id ends with "${SUFFIX[env]}" and appEnv is ${env}`, () => {
        const exp = configFor(env);
        expect(exp.extra?.appEnv).toBe(env);
        expect(exp.ios?.bundleIdentifier).toBe(`${bundleId()}${SUFFIX[env]}`);
        expect(exp.android?.package).toBe(`${bundleId()}${SUFFIX[env]}`);
      });

      it('sets the iOS data-protection entitlement explicitly (PSEC-05)', () => {
        const exp = configFor(env);
        expect(exp.ios?.entitlements?.[DATA_PROTECTION_KEY]).toBe(DATA_PROTECTION_CLASS);
      });

      it('carries a privacy manifest with known categories and approved reasons (LEGAL-REQ-043)', () => {
        const pm = configFor(env).ios?.privacyManifests;
        expect(pm).toBeDefined();
        expect(pm?.NSPrivacyTracking).toBe(false);
        expect(pm?.NSPrivacyTrackingDomains).toEqual([]);
        const types = pm?.NSPrivacyAccessedAPITypes ?? [];
        expect(types.length).toBeGreaterThan(0);
        const seen = new Set<string>();
        for (const t of types) {
          expect(Object.keys(APPLE_REASONS)).toContain(t.NSPrivacyAccessedAPIType);
          expect(seen.has(t.NSPrivacyAccessedAPIType)).toBe(false);
          seen.add(t.NSPrivacyAccessedAPIType);
          expect(t.NSPrivacyAccessedAPITypeReasons.length).toBeGreaterThan(0);
          for (const r of t.NSPrivacyAccessedAPITypeReasons) {
            expect(APPLE_REASONS[t.NSPrivacyAccessedAPIType]).toContain(r);
          }
        }
        // Not used by the app or any linked SDK (app-store-privacy-labels.md 3.2).
        expect(seen.has('NSPrivacyAccessedAPICategoryActiveKeyboards')).toBe(false);
      });

      it('answers the export-compliance question in the build (standard OS encryption only)', () => {
        expect(configFor(env).ios?.config?.usesNonExemptEncryption).toBe(false);
      });

      it('keeps the deep-link scheme from brand (DOC-17 is a founder decision)', () => {
        expect(configFor(env).scheme).toBe(brand.scheme);
      });
    });
  }

  it('the entitlement does not depend on the environment', () => {
    const all = APP_ENVS.map((e) => configFor(e).ios?.entitlements);
    for (const ent of all) expect(ent).toEqual(all[0]);
  });

  it('refuses an unknown EXPO_PUBLIC_APP_ENV instead of guessing', () => {
    expect(() => configFor('prod')).toThrow(/EXPO_PUBLIC_APP_ENV/);
  });
});

type Profile = {
  distribution?: string;
  autoIncrement?: boolean;
  developmentClient?: boolean;
  channel?: string;
  environment?: string;
  env?: Record<string, string>;
};
const easText = fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8');
const easFile = JSON.parse(easText) as { cli: { appVersionSource?: string }; build: Record<string, Profile>; submit: Record<string, unknown> };

/** Variables a profile may name; anything else in a profile's env is a review question (secrets live in EAS). */
const PROFILE_VARIABLES = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_DOCS_BASE_URL',
  'EXPO_PUBLIC_SERVER_FEATURES',
  'EXPO_PUBLIC_BACKUP',
  'EXPO_PUBLIC_STATUS_REPORT',
  'EXPO_PUBLIC_ANALYTICS',
] as const;

/** Project values that come only from EAS environment variables (docs/release/TESTFLIGHT.md step 7). */
const FROM_EAS_ONLY = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_POSTHOG_KEY',
  'EXPO_PUBLIC_SENTRY_DSN',
];

/** Evaluates app.config.ts with exactly a profile's env, the way EAS builds it (EAS-only values unset). */
function configForProfile(name: string): ExpoConfig {
  const env = easFile.build[name]?.env ?? {};
  const names = [...PROFILE_VARIABLES, ...FROM_EAS_ONLY];
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    return getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

describe('eas.json (POPS-02, POPS-08): the alpha profile story (D-106)', () => {
  const eas = easFile;
  /** True once the founder has made the R-17 flip (TESTFLIGHT.md, "The flip"): the testflight profile's one line. */
  const TESTFLIGHT_FLIPPED = eas.build.testflight?.env?.EXPO_PUBLIC_SERVER_FEATURES === 'on';

  it('has exactly the three environment profiles and the testflight profile', () => {
    expect(Object.keys(eas.build).sort()).toEqual([...APP_ENVS, 'testflight'].sort());
  });

  for (const env of APP_ENVS) {
    it(`profile "${env}" sets EXPO_PUBLIC_APP_ENV, channel and EAS environment to ${env}`, () => {
      const p = eas.build[env];
      expect(p.env?.[KEY]).toBe(env);
      expect(p.channel).toBe(env);
      expect(p.environment).toBe(env);
    });
  }

  describe('every profile', () => {
    for (const name of [...APP_ENVS, 'testflight']) {
      it(`${name}: names only the build switches, writes each one out, and keeps project values in EAS`, () => {
        const env = eas.build[name].env ?? {};
        expect(Object.keys(env).sort(), name).toEqual([...PROFILE_VARIABLES].sort());
        for (const k of FROM_EAS_ONLY) expect(env[k], `${name} ${k}`).toBeUndefined();
        expect(env.EXPO_PUBLIC_DOCS_BASE_URL).toBe('https://packs.earlyletters.app');
        expect(env.EXPO_PUBLIC_ANALYTICS).toBe('off');
        expect(env.EXPO_PUBLIC_BACKUP).toBe('off');
        expect(env.EXPO_PUBLIC_STATUS_REPORT).toBe('off');
        expect(['on', 'off']).toContain(env.EXPO_PUBLIC_SERVER_FEATURES);
      });

      it(`${name}: app.config.ts records the profile's switches in extra`, () => {
        const exp = configForProfile(name);
        const on = eas.build[name].env?.EXPO_PUBLIC_SERVER_FEATURES === 'on';
        expect(exp.extra?.serverFeatures).toBe(on);
        expect(exp.extra?.backup).toBe(false);
        expect(exp.extra?.statusReport).toBe(false);
      });
    }
  });

  it('server features are on in preview, and in testflight only after the R-17 flip; never production or development', () => {
    const on = Object.entries(eas.build).filter(([, p]) => p.env?.EXPO_PUBLIC_SERVER_FEATURES === 'on').map(([n]) => n);
    // The flip (docs/release/TESTFLIGHT.md, "The flip") is the testflight line alone; this test passes either side of it.
    expect(on).toEqual(TESTFLIGHT_FLIPPED ? ['preview', 'testflight'] : ['preview']);
  });

  describe('preview profile (alpha build 2: servers on, staging, TestFlight)', () => {
    const p = eas.build.preview;

    it('is a store build with EAS-owned build numbers and a submit profile, so it can go to TestFlight', () => {
      expect(p.distribution).toBe('store');
      expect(p.autoIncrement).toBe(true);
      expect(p.developmentClient).toBeUndefined();
      expect(eas.cli.appVersionSource).toBe('remote');
      expect(eas.submit.preview).toBeDefined();
    });

    it('evaluates to the .preview ids with server features on and both build flags off', () => {
      const exp = configForProfile('preview');
      expect(exp.ios?.bundleIdentifier).toBe(`${bundleId()}.preview`);
      expect(exp.extra?.appEnv).toBe('preview');
      expect(exp.extra?.serverFeatures).toBe(true);
      expect(exp.extra?.backup).toBe(false);
      expect(exp.extra?.statusReport).toBe(false);
    });

    it('a build flag set on its own in the shell cannot turn on backup in an off profile', () => {
      process.env.EXPO_PUBLIC_BACKUP = 'on';
      try {
        // configForProfile resets the flag to the profile's own value, so evaluate by hand here.
        process.env[KEY] = 'preview';
        process.env.EXPO_PUBLIC_SERVER_FEATURES = 'off';
        const exp = getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
        expect(exp.extra?.backup).toBe(false);
        process.env.EXPO_PUBLIC_SERVER_FEATURES = 'on';
        expect(getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp.extra?.backup).toBe(true);
      } finally {
        delete process.env.EXPO_PUBLIC_BACKUP;
        delete process.env.EXPO_PUBLIC_SERVER_FEATURES;
      }
    });
  });

  describe('testflight profile (alpha build 1: servers off until the R-17 gate passes)', () => {
    const tf = eas.build.testflight;

    it('is a store build that is a preview build in every other respect', () => {
      expect(tf.distribution).toBe('store');
      expect(tf.env?.[KEY]).toBe('preview');
      expect(tf.channel).toBe('preview');
      expect(tf.environment).toBe('preview');
    });

    it('lets EAS number the builds, so a second upload is not rejected as a duplicate', () => {
      expect(tf.autoIncrement).toBe(true);
      expect(eas.cli.appVersionSource).toBe('remote');
    });

    it('evaluates to the .preview ids, so the permanent production id is never spent by a test build', () => {
      const exp = configForProfile('testflight');
      expect(exp.ios?.bundleIdentifier).toBe(`${bundleId()}.preview`);
      expect(exp.ios?.bundleIdentifier).not.toBe(bundleId());
      expect(exp.extra?.serverFeatures).toBe(TESTFLIGHT_FLIPPED);
    });

    it('has a submit profile', () => {
      expect(eas.submit.testflight).toBeDefined();
    });

    it('the R-17 flip is one line: testflight equals preview except EXPO_PUBLIC_SERVER_FEATURES, until the flip makes them equal', () => {
      // Written so the flip PR changes apps/mobile/eas.json by one line and no test: before it the two profiles
      // differ in that line only, after it in nothing. Any other difference fails either way.
      const { env: tfEnv, ...tfRest } = tf;
      const { env: pvEnv, ...pvRest } = eas.build.preview;
      expect(tfRest).toEqual(pvRest);
      const differing = Object.keys({ ...tfEnv, ...pvEnv }).filter((k) => tfEnv?.[k] !== pvEnv?.[k]);
      expect(differing).toEqual(TESTFLIGHT_FLIPPED ? [] : ['EXPO_PUBLIC_SERVER_FEATURES']);
      expect(['on', 'off']).toContain(tfEnv?.EXPO_PUBLIC_SERVER_FEATURES);
      // The flip itself: the one line in apps/mobile/eas.json, inside "testflight".
      const block = easText.slice(easText.indexOf('"testflight": {'), easText.indexOf('"submit"'));
      expect(block.match(/"EXPO_PUBLIC_SERVER_FEATURES": "(on|off)"/g)).toHaveLength(1);
    });

    it('the flip, applied to a copy of eas.json, passes these same rules', () => {
      const flipped = JSON.parse(
        easText.replace(/("testflight": \{[\s\S]*?"EXPO_PUBLIC_SERVER_FEATURES": )"off"/, '$1"on"'),
      ) as typeof eas;
      expect(flipped.build.testflight.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('on');
      expect(flipped.build.production.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
      const { env: a, ...restA } = flipped.build.testflight;
      const { env: b, ...restB } = flipped.build.preview;
      expect(restA).toEqual(restB);
      expect(a).toEqual(b);
    });
  });

  it('builds 1 and 2 may share the "preview" update channel only while the app has no update client', () => {
    // The switches are inlined at bundle time, so an over-the-air update made for build 2 (servers on) would turn
    // servers on in build 1 if both listened on one channel. Today nothing listens: expo-updates is not installed.
    // Adding it means giving testflight and preview their own channels first.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
    const hasUpdates = ['dependencies', 'devDependencies'].some((k) => pkg[k]?.['expo-updates'] !== undefined);
    const shared = eas.build.testflight.channel === eas.build.preview.channel;
    expect(hasUpdates && shared, 'expo-updates is installed: give testflight and preview their own channels').toBe(false);
  });

  it('production stays off (store submission is re-planned after the alpha, D-106)', () => {
    expect(eas.build.production.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
    expect(configForProfile('production').extra?.serverFeatures).toBe(false);
  });

  it('development stays off (a dev client on the founder desk talks to no server unless .env.development.local says so)', () => {
    expect(eas.build.development.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
  });

  it('only the production profile names production', () => {
    const naming = Object.entries(eas.build).filter(([, p]) => p.env?.[KEY] === 'production').map(([n]) => n);
    expect(naming).toEqual(['production']);
  });

  it('holds no secret-looking names or values', () => {
    expect(easText).not.toMatch(/(KEY|SECRET|TOKEN|PASSWORD|DSN)"\s*:/i);
    expect(easText).not.toMatch(/supabase\.co|sb_publishable_|sb_secret_|eyJ[A-Za-z0-9_-]{10,}|re_[A-Za-z0-9]{8,}/);
  });
});

describe('.env.development', () => {
  it('sets development and nothing else (the server-features and analytics switches may only be off)', () => {
    const lines = fs
      .readFileSync(path.join(ROOT, '.env.development'), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      // Co-parent coming soon (v1.0 on-device only) adds this one line, and only ever as off.
      .filter((l) => l !== 'EXPO_PUBLIC_SERVER_FEATURES=off')
      // v1.0 collects no data (D-088, 15 Oct): the analytics switch, and only ever as off.
      .filter((l) => l !== 'EXPO_PUBLIC_ANALYTICS=off');
    expect(lines).toEqual([`${KEY}=development`]);
  });
});
