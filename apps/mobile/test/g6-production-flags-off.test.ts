/// <reference types="node" />
/**
 * Gate G6 (docs/qa/test-plan-b13, T2-120 and T2-121; NS-49-R15, R25, R26): no store build carries a new-scope card flag
 * turned on, a photo-library usage string, a PhotoKit authorisation or library call, or the journaling entitlement.
 *
 * Reads eas.json and the sources as text, the way capabilities.test.ts and the preflight tests do. It never calls
 * `expo config`, which does not evaluate in agent checkouts, so the native side is a source scan of app.config.ts, the
 * dependency list and the local native modules, not a read of a resolved plist. The resolved plist stays the proof of
 * NS-49-R6 (binary strings read, device row T2-089).
 *
 * The scan has to be able to fail: a fixture profile with each flag on, a fixture config with a usage string and the
 * entitlement, and a mutant that writes a flag into a temp copy of the real eas.json each make it go red.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveProfile, storeProfiles } from '../../../scripts/release/store-flags.mjs';

const APP = join(__dirname, '..');

/**
 * Every EXPO_PUBLIC_* card flag of the new scope that may never be on in a store profile before gate G6. PHOTOS and
 * BOOK_SEARCH are also pinned, with their card ids, by store-flags.test.ts (BL-958); the rest have no code behind them
 * yet (a grep of src and app.config.ts finds none), so this list comes from the PRD cards and ADR 0029.
 * Not here, on purpose: EXPO_PUBLIC_SERVER_FEATURES, BACKUP, STATUS_REPORT, ANALYTICS, ACCOUNT_DELETION (alpha and
 * server switches with their own pins in capabilities.test.ts and preflight-production.test.ts).
 */
const CARD_FLAGS = [
  'EXPO_PUBLIC_DAYS', // NS-46, card 21
  'EXPO_PUBLIC_DAYS_ASK', // card 21 flags line (E57 says no new flag; absent or off either way)
  'EXPO_PUBLIC_SUGGESTIONS', // NS-49, card 21
  'EXPO_PUBLIC_PHOTOS', // NS-01
  'EXPO_PUBLIC_BOOK_SEARCH', // NS-02
  'EXPO_PUBLIC_PHOTO_MOMENTS', // NS-51, card 27
  'EXPO_PUBLIC_VIDEO', // NS-52, card 27
  'EXPO_PUBLIC_MEDIA_ATTACH', // ADR 0029
] as const;

type Eas = { build?: Record<string, { env?: Record<string, unknown>; distribution?: string; ios?: { simulator?: boolean }; extends?: string }> };

const readEas = (path = join(APP, 'eas.json')): Eas => JSON.parse(readFileSync(path, 'utf8'));
const isOff = (v: unknown) => v === undefined || String(v).trim().toLowerCase() === 'off';

/** Profile and flag pairs that are on in a store profile (production always among them when it is a store build). */
function flagsOn(eas: Eas): string[] {
  const build = eas.build ?? {};
  const names = new Set<string>(storeProfiles(eas));
  if (build.production) names.add('production');
  const found: string[] = [];
  for (const name of [...names].sort()) {
    const env = (resolveProfile(build, name)?.env ?? {}) as Record<string, unknown>;
    for (const flag of CARD_FLAGS) if (!isOff(env[flag])) found.push(`${name} ${flag}=${JSON.stringify(env[flag])}`);
  }
  return found;
}

/** Library strings, calls, packages and entitlements that no store build may carry (NS-49-R15, R25). */
const FORBIDDEN_NATIVE: ReadonlyArray<[string, RegExp]> = [
  ['a photo-library usage string', /NSPhotoLibrary(Add)?UsageDescription|photosPermission|savePhotosPermission/],
  ['the journaling entitlement', /com\.apple\.developer\.journal\.allow|JournalingSuggestions/],
  ['a PhotoKit authorisation or library call', /PHPhotoLibrary|PHAsset\b|PHFetch|PHImageManager|PHAuthorizationStatus|requestAuthorization/],
  ['a background mode for fetch or processing', /UIBackgroundModes|BGTaskScheduler|BGAppRefreshTask|BGProcessingTask/],
  ['a media-library or camera package', /expo-media-library|expo-camera|expo-image-picker|react-native-vision-camera/],
];

/** What is configured for the store build, as text: config source, dependency list and every local native module. */
function nativeSources(root = APP): Array<{ file: string; text: string }> {
  const out: Array<{ file: string; text: string }> = [];
  const add = (file: string) => out.push({ file, text: readFileSync(join(root, file), 'utf8') });
  add('app.config.ts');
  add('package.json');
  const walk = (dir: string) => {
    for (const name of readdirSync(join(root, dir))) {
      const rel = join(dir, name);
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.(swift|m|mm|h|podspec|plist|entitlements|json)$/.test(name)) add(rel);
    }
  };
  walk('modules');
  return out;
}

/** Comments are prose that may name the thing it forbids; only code and config count. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function nativeProblems(sources: Array<{ file: string; text: string }>): string[] {
  const found: string[] = [];
  for (const { file, text } of sources) {
    const code = file.endsWith('.json') ? text : stripComments(text);
    for (const [what, re] of FORBIDDEN_NATIVE) if (re.test(code)) found.push(`${file}: ${what}`);
  }
  return found;
}

const temps: string[] = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop() as string, { recursive: true, force: true });
});
const tempDir = () => {
  const d = mkdtempSync(join(tmpdir(), 'g6-'));
  temps.push(d);
  return d;
};

describe('G6: store builds ship with the new-scope flags off', () => {
  it('[NS-49-R25] G6 every EAS production profile has the flags off', () => {
    const eas = readEas();
    expect(eas.build?.production, 'eas.json has a production profile').toBeDefined();
    expect(new Set(CARD_FLAGS).size).toBe(CARD_FLAGS.length);
    expect(flagsOn(eas)).toEqual([]);
    // every store profile, not only production (preview and testflight go to real phones too)
    expect(storeProfiles(eas)).toContain('production');
  });

  it('[NS-49-R25] G6 no photo-library usage string, PhotoKit call, background mode or journaling entitlement is configured', () => {
    const sources = nativeSources();
    expect(sources.map((s) => s.file)).toEqual(expect.arrayContaining(['app.config.ts', 'package.json', 'modules/scribe-photo/ios/ScribePhotoModule.swift']));
    expect(nativeProblems(sources)).toEqual([]);
  });

  it('[NS-49-R15] G6 the journaling entitlement is not in the Expo config while the suggestions flag is off everywhere', () => {
    const cfg = stripComments(readFileSync(join(APP, 'app.config.ts'), 'utf8'));
    expect(cfg).not.toMatch(/com\.apple\.developer\.journal\.allow/);
    expect(readEas().build?.production?.env?.EXPO_PUBLIC_SUGGESTIONS).toSatisfy(isOff);
  });

  it('[NS-49-R26] G6 no EAS profile that builds for release enables a library-derived flag', () => {
    // The level 3 spike runs on a development build only. development and e2e are not store profiles.
    const eas = readEas();
    const releaseOn = flagsOn(eas).filter((l) => /PHOTO_MOMENTS|SUGGESTIONS|PHOTOS|MEDIA_ATTACH/.test(l));
    expect(releaseOn).toEqual([]);
    expect(storeProfiles(eas)).not.toContain('development');
    expect(storeProfiles(eas)).not.toContain('e2e');
  });
});

describe('G6 positive control: the check can go red', () => {
  const storeFixture = (env: Record<string, string>): Eas => ({
    build: { development: { distribution: 'internal', env: {} }, production: { env: { EXPO_PUBLIC_APP_ENV: 'production', ...env } } },
  });

  it.each(CARD_FLAGS)('[NS-49-R25] G6 positive control: %s on in production fails the flags check', (flag) => {
    expect(flagsOn(storeFixture({}))).toEqual([]);
    expect(flagsOn(storeFixture({ [flag]: 'off' }))).toEqual([]);
    expect(flagsOn(storeFixture({ [flag]: 'on' }))).toEqual([`production ${flag}="on"`]);
    expect(flagsOn(storeFixture({ [flag]: ' ON ' }))).toHaveLength(1);
    expect(flagsOn(storeFixture({ [flag]: '1' }))).toHaveLength(1);
  });

  it('[NS-49-R25] G6 positive control: a flag on in an internal profile alone is not a store problem', () => {
    const eas: Eas = { build: { development: { distribution: 'internal', env: { EXPO_PUBLIC_DAYS: 'on' } }, production: { env: {} } } };
    expect(flagsOn(eas)).toEqual([]);
  });

  it('[NS-49-R25] G6 positive control: a usage string, entitlement, PhotoKit call, background mode or package each fail the native scan', () => {
    const ok = { file: 'app.config.ts', text: 'export default {}' };
    expect(nativeProblems([ok])).toEqual([]);
    const bad: Array<[string, string, string]> = [
      ['app.config.ts', "infoPlist: { NSPhotoLibraryUsageDescription: 'x' }", 'a photo-library usage string'],
      ['app.config.ts', "{ photosPermission: 'x' }", 'a photo-library usage string'],
      ['app.config.ts', "entitlements: { 'com.apple.developer.journal.allow': ['suggestions'] }", 'the journaling entitlement'],
      ['modules/x/ios/X.swift', 'PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }', 'a PhotoKit authorisation or library call'],
      ['app.config.ts', "infoPlist: { UIBackgroundModes: ['fetch'] }", 'a background mode for fetch or processing'],
      ['package.json', '{ "dependencies": { "expo-media-library": "1.0.0" } }', 'a media-library or camera package'],
    ];
    for (const [file, text, what] of bad) expect(nativeProblems([{ file, text }]), what).toEqual([`${file}: ${what}`]);
    // a comment that names the thing it forbids is prose, not configuration
    expect(nativeProblems([{ file: 'app.config.ts', text: '// never NSPhotoLibraryUsageDescription\n/* PHPhotoLibrary */ export default {}' }])).toEqual([]);
  });
});

describe('G6 mutants: a temp copy of the real files, one change each', () => {
  it('[NS-49-R25] G6 mutant: EXPO_PUBLIC_DAYS=on added to production in a copy of eas.json turns the check red', () => {
    const real = readEas();
    expect(flagsOn(real)).toEqual([]);
    for (const flag of CARD_FLAGS) {
      const copy = JSON.parse(JSON.stringify(real)) as Eas;
      (copy.build as NonNullable<Eas['build']>).production.env = { ...copy.build?.production?.env, [flag]: 'on' };
      const path = join(tempDir(), 'eas.json');
      writeFileSync(path, JSON.stringify(copy, null, 2));
      expect(flagsOn(readEas(path)), flag).toEqual([`production ${flag}="on"`]);
    }
  });

  it('[NS-49-R25] G6 mutant: a flag on in a copy of eas.json that extends a base profile is still caught', () => {
    const copy = JSON.parse(JSON.stringify(readEas())) as Eas;
    (copy.build as NonNullable<Eas['build']>).base = { env: { EXPO_PUBLIC_SUGGESTIONS: 'on' } };
    (copy.build as NonNullable<Eas['build']>).production.extends = 'base';
    expect(flagsOn(copy)).toEqual(expect.arrayContaining(['production EXPO_PUBLIC_SUGGESTIONS="on"']));
  });

  it('[NS-49-R25] G6 mutant: a usage string added to a copy of app.config.ts turns the native scan red', () => {
    const dir = tempDir();
    const real = nativeSources();
    expect(nativeProblems(real)).toEqual([]);
    const cfg = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    const mutated = cfg.replace('infoPlist: {', "infoPlist: {\n      NSPhotoLibraryUsageDescription: 'Asha letters',");
    expect(mutated).not.toBe(cfg);
    writeFileSync(join(dir, 'app.config.ts'), mutated);
    expect(nativeProblems([{ file: 'app.config.ts', text: readFileSync(join(dir, 'app.config.ts'), 'utf8') }])).toEqual(['app.config.ts: a photo-library usage string']);
    const withEntitlement = cfg.replace('entitlements: {', "entitlements: {\n      'com.apple.developer.journal.allow': ['suggestions'],");
    expect(withEntitlement).not.toBe(cfg);
    expect(nativeProblems([{ file: 'app.config.ts', text: withEntitlement }])).toEqual(['app.config.ts: the journaling entitlement']);
  });
});
