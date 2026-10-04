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

describe('eas.json (POPS-02, POPS-08)', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8')) as {
    build: Record<string, { env?: Record<string, string>; channel?: string; environment?: string }>;
  };

  it('has exactly the three known build profiles', () => {
    expect(Object.keys(eas.build).sort()).toEqual([...APP_ENVS].sort());
  });

  for (const env of APP_ENVS) {
    it(`profile "${env}" sets EXPO_PUBLIC_APP_ENV, channel and EAS environment to ${env}`, () => {
      const p = eas.build[env];
      expect(p.env?.[KEY]).toBe(env);
      expect(p.channel).toBe(env);
      expect(p.environment).toBe(env);
    });
  }

  it('only the production profile names production', () => {
    const naming = Object.entries(eas.build).filter(([, p]) => p.env?.[KEY] === 'production').map(([n]) => n);
    expect(naming).toEqual(['production']);
  });

  it('holds no secret-looking values', () => {
    const text = fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8');
    expect(text).not.toMatch(/(KEY|SECRET|TOKEN|PASSWORD|DSN)"\s*:/i);
  });
});

describe('.env.development', () => {
  it('sets development and nothing else (the server-features switch may only be off)', () => {
    const lines = fs
      .readFileSync(path.join(ROOT, '.env.development'), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      // Co-parent coming soon (v1.0 on-device only) adds this one line, and only ever as off.
      .filter((l) => l !== 'EXPO_PUBLIC_SERVER_FEATURES=off');
    expect(lines).toEqual([`${KEY}=development`]);
  });
});
