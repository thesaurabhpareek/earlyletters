/// <reference types="node" />
/**
 * [BL-410] The fourth e2e-web build is the only place the web presentation seam (#1467, B-8, B-9) is switched on.
 * Production-safety relevant: a seam in a preview or production bundle is a release blocker. The B-8 export check is
 * in .github/scripts/seam-guard.test.mjs; this guards the builds the web journey run makes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_ENV, BUILDS, buildEnv } from '../e2e-web/support/builds';
import { e2eRefusal } from '../src/lib/build-env';

const SETUP = readFileSync(join(__dirname, '../e2e-web/support/global-setup.ts'), 'utf8');

describe('[BL-410] e2e-web builds: the seam is on in exactly one', () => {
  it('exactly one build sets EXPO_PUBLIC_E2E, the one named seam', () => {
    const on = BUILDS.filter((b) => buildEnv(b.env).EXPO_PUBLIC_E2E === '1').map((b) => b.name);
    expect(on).toEqual(['seam']);
  });

  it('the seam build uses the development app env, so app.config.ts (B-9) accepts it; no other build could', () => {
    for (const b of BUILDS) {
      const env = buildEnv(b.env);
      const refusal = e2eRefusal({ e2e: env.EXPO_PUBLIC_E2E, appEnv: env.EXPO_PUBLIC_APP_ENV as 'development' });
      expect(refusal, b.name).toBeNull();
      if (b.name === 'seam') expect(env.EXPO_PUBLIC_APP_ENV).toBe('development');
      else expect(env.EXPO_PUBLIC_E2E, b.name).toBeUndefined();
    }
  });

  it('the shared base env never turns the seam on and keeps the preview app env', () => {
    expect(BASE_ENV).not.toHaveProperty('EXPO_PUBLIC_E2E');
    expect(BASE_ENV.EXPO_PUBLIC_APP_ENV).toBe('preview');
  });

  it('the seam build never carries server features or a store profile marker', () => {
    const env = buildEnv(BUILDS.find((b) => b.name === 'seam')!.env);
    expect(env.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
    expect(env.EAS_BUILD_PROFILE).toBeUndefined();
  });

  it('[BL-1991] exactly one build is the store app (production app env), and it has no seam, no server features, no store profile marker', () => {
    const store = BUILDS.filter((b) => buildEnv(b.env).EXPO_PUBLIC_APP_ENV === 'production');
    expect(store.map((b) => b.name)).toEqual(['store']);
    const env = buildEnv(store[0]!.env);
    expect(env.EXPO_PUBLIC_E2E).toBeUndefined();
    expect(env.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
    expect(env.EAS_BUILD_PROFILE).toBeUndefined();
  });

  it('global-setup takes every build env from builds.ts and writes no EXPO_PUBLIC_E2E itself', () => {
    expect(SETUP).not.toMatch(/EXPO_PUBLIC_E2E|EXPO_PUBLIC_APP_ENV/);
    expect(SETUP).toContain('BUILDS');
  });
});
