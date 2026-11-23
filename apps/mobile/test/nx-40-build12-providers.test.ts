/// <reference types="node" />
/**
 * [NX-40-R7] and H5: in the Build 12 store profiles the sign-in screen offers only Apple and email. Google needs both
 * client ids and passkeys need EXPO_PUBLIC_PASSKEYS=1, and no store profile in eas.json sets any of them. Each
 * profile's env is read from eas.json and put where Metro would inline it, then the two availability functions are
 * asked, with a positive control (the switches on) so a false answer means something. The sign-in sheet draws a
 * button only behind those functions, and the Welcome has no Google or passkey code at all. Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const APP = join(__dirname, '..');
const EAS = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
const STORE_PROFILES = ['production', 'testflight'];
const GOOGLE_KEYS = ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'];

/** Load google.ts and passkey.ts under this env. The passkey module is faked as present and supported. */
async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const k of [...GOOGLE_KEYS, 'EXPO_PUBLIC_PASSKEYS']) vi.stubEnv(k, '');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const req = createRequire(join(APP, 'src', 'lib', 'auth', 'passkey.ts'));
  const file = req.resolve('react-native-passkey');
  req.cache[file] = { id: file, filename: file, loaded: true, exports: { Passkey: { isSupported: () => true } }, children: [], paths: [] } as never;
  const google = await import('../src/lib/auth/google');
  const passkey = await import('../src/lib/auth/passkey');
  return { google: google.googleSignInAvailable(), passkey: passkey.passkeysAvailable() };
}

afterEach(() => vi.unstubAllEnvs());

describe('[NX-40-R7] Build 12 sign-in providers', () => {
  it('[NX-40-R7] the positive control: with both Google ids and the passkey switch on, both are offered', async () => {
    const on = await load({
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'asha-web.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'asha-ios.apps.googleusercontent.com',
      EXPO_PUBLIC_PASSKEYS: '1',
    });
    expect(on).toEqual({ google: true, passkey: true });
  });

  it('[NX-40-R7] one Google id is not enough, and a passkey switch of "0" is off', async () => {
    expect(await load({ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'asha-web.apps.googleusercontent.com', EXPO_PUBLIC_PASSKEYS: '0' })).toEqual({ google: false, passkey: false });
  });

  for (const profile of STORE_PROFILES) {
    it(`[NX-40-R7] ${profile}: eas.json sets no Google id and no passkey switch`, () => {
      const env = EAS.build[profile]?.env ?? {};
      expect(Object.keys(env).length, `${profile} has an env block`).toBeGreaterThan(0);
      for (const k of [...GOOGLE_KEYS, 'EXPO_PUBLIC_PASSKEYS']) expect(env[k], `${profile} sets ${k}`).toBeUndefined();
    });

    it(`[NX-40-R7] ${profile}: neither Google nor passkey is offered`, async () => {
      expect(await load(EAS.build[profile]?.env ?? {})).toEqual({ google: false, passkey: false });
    });
  }

  it('[NX-40-R7] the sheet draws Google and the passkey link only behind their availability checks, and the Welcome carries neither', () => {
    const sheet = readFileSync(join(APP, 'src', 'app', '(auth)', 'sign-in', 'index.tsx'), 'utf8');
    expect(sheet).toMatch(/const google = googleSignInAvailable\(\);/);
    expect(sheet).toMatch(/const passkey = passkeysAvailable\(\);/);
    expect(sheet).toMatch(/\{google && \(\s*<ProviderButton kind="google"/);
    expect(sheet).toMatch(/\{passkey && <QuietButton/);
    const welcome = readFileSync(join(APP, 'src', 'components', 'onboarding', 'welcome-sign-in.tsx'), 'utf8');
    expect(welcome).not.toMatch(/google|passkey/i);
  });

  it('[NX-40-R7] the Maestro row E2E-20 asserts both are absent', () => {
    const flow = readFileSync(join(APP, 'e2e', 'flows', 'E2E-20-providers-build12.yaml'), 'utf8');
    expect(flow).toMatch(/assertNotVisible:\s*\n\s*id: "signIn\.google"/);
    expect(flow).toMatch(/assertNotVisible:\s*\n\s*id: "signIn\.passkey"/);
  });
});
