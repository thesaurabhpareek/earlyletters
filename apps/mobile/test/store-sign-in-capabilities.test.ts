/// <reference types="node" />
/**
 * The store build carries no dormant sign-in capability (App Review guideline 2.5.19; build 12 store compliance
 * review, risk 5; app.config.ts signInCapable). Evaluates app.config.ts with each eas.json profile's env through
 * `expo config --type introspect`, which runs the config mods the way prebuild does, so the entitlements and
 * Info.plist here are the ones the build writes. That matters: expo-apple-authentication adds the Sign in with Apple
 * entitlement on its own because the package is installed, so the public config alone would not show it.
 *
 * A fictional Google iOS client id (Asha) is set for every profile, as if the EAS environment held one: the store
 * build must still carry no Google URL scheme, and the alpha builds keep it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expo, parseJsonOut } from '../scripts/preflight-lib.mjs';
import { SIGN_IN_ENTITLEMENTS, signInCapabilities } from '../scripts/preflight-production.mjs';

const APP = join(__dirname, '..');
const EAS = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
const GOOGLE_IOS_ID = '000000000000-asha.apps.googleusercontent.com';
const GOOGLE_SCHEME = 'com.googleusercontent.apps.000000000000-asha';
const APPLE = 'com.apple.developer.applesignin';
const DOMAINS = 'com.apple.developer.associated-domains';

type Cfg = {
  plugins?: unknown[];
  ios?: {
    usesAppleSignIn?: boolean;
    associatedDomains?: string[];
    entitlements?: Record<string, unknown>;
    infoPlist?: { CFBundleURLTypes?: { CFBundleURLSchemes?: string[] }[] };
  };
};

/** Every EXPO_PUBLIC_ variable of this shell blanked, so only the profile (and the fictional Google id) decide. */
function profileEnv(profile: string, extra: Record<string, string> = {}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const k of Object.keys(process.env)) if (k.startsWith('EXPO_PUBLIC_') || k === 'EAS_BUILD_PROFILE') env[k] = '';
  return { ...env, ...(EAS.build[profile]?.env ?? {}), EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS_ID, ...extra };
}

function evaluate(type: 'public' | 'introspect', env: Record<string, string>): Cfg {
  const r = expo(APP, ['config', '--type', type, '--json'], APP, env);
  const cfg = parseJsonOut(r) as Cfg | null;
  if (!cfg) throw new Error(`expo config --type ${type} did not evaluate: ${(r.stderr || r.stdout || '').slice(-400)}`);
  return cfg;
}

const entitlements = (c: Cfg) => Object.keys(c.ios?.entitlements ?? {});
const urlSchemes = (c: Cfg) => (c.ios?.infoPlist?.CFBundleURLTypes ?? []).flatMap((t) => t.CFBundleURLSchemes ?? []);
const pluginNames = (c: Cfg) => (c.plugins ?? []).map((p) => (Array.isArray(p) ? p[0] : p));

describe('sign-in capabilities per build (guideline 2.5.19)', () => {
  it('the entitlement list matches the one app.config.ts strips', () => {
    const source = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    for (const k of SIGN_IN_ENTITLEMENTS) expect(source).toContain(`'${k}'`);
    expect(SIGN_IN_ENTITLEMENTS).toEqual([APPLE, DOMAINS]);
  });

  // The switch is forced here, so this holds whichever way eas.json sets production (servers on is the build 12 plan, #698).
  it('production with servers off (the store build as first shipped): no Sign in with Apple entitlement, no associated domains, no Google URL scheme', () => {
    const env = profileEnv('production', { EXPO_PUBLIC_SERVER_FEATURES: 'off' });
    const pub = evaluate('public', env);
    const intro = evaluate('introspect', env);
    expect(pub.ios?.usesAppleSignIn).toBeFalsy();
    expect(pub.ios?.associatedDomains ?? []).toEqual([]);
    expect(pluginNames(pub)).not.toContain('@react-native-google-signin/google-signin');
    expect(entitlements(intro)).not.toContain(APPLE);
    expect(entitlements(intro)).not.toContain(DOMAINS);
    expect(urlSchemes(intro).filter((u) => u.startsWith('com.googleusercontent.apps.'))).toEqual([]);
    // The rest of the entitlements are untouched: data protection stays (SEC-R15), push stays off.
    expect(entitlements(intro)).toEqual(['com.apple.developer.default-data-protection']);
    expect(signInCapabilities(pub, intro)).toEqual([]);
  }, 120_000);

  it('preview (alpha build 2, servers on): keeps Sign in with Apple, associated domains and the Google URL scheme', () => {
    expect(EAS.build.preview?.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('on');
    const env = profileEnv('preview');
    const pub = evaluate('public', env);
    const intro = evaluate('introspect', env);
    expect(pub.ios?.usesAppleSignIn).toBe(true);
    expect(pub.ios?.associatedDomains?.length).toBe(1);
    expect(pluginNames(pub)).toContain('@react-native-google-signin/google-signin');
    expect(entitlements(intro)).toEqual(expect.arrayContaining([APPLE, DOMAINS]));
    expect(urlSchemes(intro)).toContain(GOOGLE_SCHEME);
  }, 120_000);

  it('testflight (alpha build 1, servers off but not a store build) is unchanged: it keeps them too', () => {
    const intro = evaluate('introspect', profileEnv('testflight'));
    expect(entitlements(intro)).toEqual(expect.arrayContaining([APPLE, DOMAINS]));
    expect(urlSchemes(intro)).toContain(GOOGLE_SCHEME);
  }, 120_000);

  it('a production build with servers on (the sign-in 1.0.x) gets them back without a config change', () => {
    const intro = evaluate('introspect', profileEnv('production', { EXPO_PUBLIC_SERVER_FEATURES: 'on' }));
    expect(entitlements(intro)).toEqual(expect.arrayContaining([APPLE, DOMAINS]));
    expect(urlSchemes(intro)).toContain(GOOGLE_SCHEME);
  }, 120_000);
  // Fail closed: the switch is on only for "on" (isOn in app.config.ts, which trims and lowercases). Anything else in production is a
  // servers-off build, so it carries no sign-in capability. Mutation proof (run: isOn accepting "true" fails the "true" row): change isOn to accept "true", "1" or any
  // truthy string, or trim/lowercase differently, and the "ON" row (still on) or a malformed row here fails; make
  // signInCapable return true for production regardless of the switch and every row fails.
  it.each([
    ['unset', ''],
    ['"true"', 'true'],
    ['"1"', '1'],
    ['"yes"', 'yes'],
    ['"onn" (typo)', 'onn'],
    ['"of" (typo)', 'of'],
    ['"off"', 'off'],
  ])('production with the servers switch %s fails closed: no sign-in capability, serverFeatures false', (_n, v) => {
    const env = profileEnv('production', { EXPO_PUBLIC_SERVER_FEATURES: v });
    const pub = evaluate('public', env) as Cfg & { extra?: { serverFeatures?: boolean } };
    const intro = evaluate('introspect', env);
    expect(pub.extra?.serverFeatures).toBe(false);
    expect(signInCapabilities(pub, intro)).toEqual([]);
  }, 120_000);
});
