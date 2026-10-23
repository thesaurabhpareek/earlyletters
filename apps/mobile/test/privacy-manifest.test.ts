/// <reference types="node" />
/**
 * The iOS privacy manifest, PrivacyInfo.xcprivacy (BL-349, LEGAL-REQ-043, security review L7).
 *
 * Fails when:
 *  - the manifest loses a required reason, or declares one it should not;
 *  - a linked pod's own manifest declares a category the app manifest does not (Apple does not read every
 *    static pod's manifest, so the app must cover each category in its own binary);
 *  - a build with server features off declares any collected data (alpha build 1, the kill path);
 *  - a server-on build's collected types drift from S17's App Privacy worksheet for its build flags;
 *  - the native folder could be reused across profiles (Expo merges into an existing file).
 *
 * Every build is evaluated through Expo's own loader, the way `expo config`, prebuild and EAS read it.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getConfig } from 'expo/config';
import type { ExpoConfig } from 'expo/config';
import { IOSConfig } from 'expo/config-plugins';
import { REQUIRED_REASON_APIS, collectedDataTypes, privacyManifest, type CollectedDataType } from '../src/lib/privacy-manifest';

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..');

/**
 * Every variable that can change the manifest, plus the two B-9 reads that make app.config.ts refuse a build
 * (EXPO_PUBLIC_E2E, EAS_BUILD_PROFILE; src/lib/build-env.ts). Cleared before each evaluation and restored
 * after it, so neither the shell nor the e2e profile's EXPO_PUBLIC_E2E=1 leaks into the next profile.
 */
const VARIABLES = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_SERVER_FEATURES',
  'EXPO_PUBLIC_BACKUP',
  'EXPO_PUBLIC_STATUS_REPORT',
  'EXPO_PUBLIC_ANALYTICS',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_E2E',
  'EAS_BUILD_PROFILE',
] as const;

function configWith(env: Record<string, string>): ExpoConfig {
  const saved = Object.fromEntries(VARIABLES.map((k) => [k, process.env[k]]));
  try {
    for (const k of VARIABLES) delete process.env[k];
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    return getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

type Profile = { env?: Record<string, string> };
const eas = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8')) as { build: Record<string, Profile> };
const profileEnv = (name: string): Record<string, string> => ({ ...(eas.build[name]?.env ?? {}) });
const manifestFor = (env: Record<string, string>) => {
  const pm = configWith(env).ios?.privacyManifests;
  expect(pm, 'ios.privacyManifests is set').toBeDefined();
  return pm!;
};

/** The reasons the app declares (src/lib/privacy-manifest.ts has the evidence for each). */
const DECLARED: Record<string, string[]> = {
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1'],
  NSPrivacyAccessedAPICategoryFileTimestamp: ['C617.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1'],
  NSPrivacyAccessedAPICategoryDiskSpace: ['E174.1'],
};

/** Reasons Apple says "may only be declared by third-party SDKs" (NSPrivacyAccessedAPIType, read 16 Oct 2026). */
const SDK_ONLY_REASONS = ['0A2A.1', 'C56D.1'];

/** Apple's NSPrivacyCollectedDataType values (read 16 Oct 2026). */
const APPLE_DATA_TYPES = [
  'Name', 'EmailAddress', 'PhoneNumber', 'PhysicalAddress', 'OtherUserContactInfo', 'Health', 'Fitness',
  'PaymentInfo', 'CreditInfo', 'OtherFinancialInfo', 'PreciseLocation', 'CoarseLocation', 'SensitiveInfo',
  'Contacts', 'EmailsOrTextMessages', 'PhotosorVideos', 'AudioData', 'GameplayContent', 'CustomerSupport',
  'OtherUserContent', 'BrowsingHistory', 'SearchHistory', 'UserID', 'DeviceID', 'PurchaseHistory',
  'ProductInteraction', 'AdvertisingData', 'OtherUsageData', 'CrashData', 'PerformanceData',
  'OtherDiagnosticData', 'EnvironmentScanning', 'Hands', 'Head', 'OtherDataTypes',
].map((t) => `NSPrivacyCollectedDataType${t}`);

const t = (name: string) => `NSPrivacyCollectedDataType${name}`;
/** S17 worksheet 1.4.0 section 3.2: a server-on build without backup or the status report. */
const SERVER_ON = [t('Name'), t('EmailAddress'), t('SensitiveInfo'), t('OtherUserContent'), t('UserID')];
/** Section 3.4: backup adds Audio Data and Device ID; the status report adds Purchase History. */
const WITH_BACKUP = [...SERVER_ON, t('AudioData'), t('DeviceID')];
const WITH_STATUS_REPORT = [...SERVER_ON, t('PurchaseHistory')];
const EVERYTHING = [...SERVER_ON, t('AudioData'), t('DeviceID'), t('PurchaseHistory')];

const reasonsOf = (types: readonly { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] }[] | undefined) =>
  Object.fromEntries((types ?? []).map((x) => [x.NSPrivacyAccessedAPIType, [...x.NSPrivacyAccessedAPITypeReasons].sort()]));
const typesOf = (c: readonly CollectedDataType[] | undefined) => (c ?? []).map((x) => x.NSPrivacyCollectedDataType).sort();

/** Every switch combination a build can have, server switch first. */
const COMBINATIONS = (['off', 'on'] as const).flatMap((server) =>
  (['off', 'on'] as const).flatMap((backup) =>
    (['off', 'on'] as const).map((status) => ({
      EXPO_PUBLIC_APP_ENV: 'preview',
      EXPO_PUBLIC_SERVER_FEATURES: server,
      EXPO_PUBLIC_BACKUP: backup,
      EXPO_PUBLIC_STATUS_REPORT: status,
    })),
  ),
);

describe('LEGAL-REQ-043 required-reason APIs: the same in every build', () => {
  it('the module declares exactly the expected categories and reasons', () => {
    expect(reasonsOf(REQUIRED_REASON_APIS)).toEqual(DECLARED);
  });

  for (const name of Object.keys(eas.build)) {
    it(`profile "${name}" declares every reason, and only those`, () => {
      expect(reasonsOf(manifestFor(profileEnv(name)).NSPrivacyAccessedAPITypes)).toEqual(DECLARED);
    });
  }

  it('no switch combination changes the reasons (the native binary is the same)', () => {
    for (const env of COMBINATIONS) expect(reasonsOf(manifestFor(env).NSPrivacyAccessedAPITypes), JSON.stringify(env)).toEqual(DECLARED);
  });

  it('never declares a reason Apple reserves for third-party SDKs', () => {
    for (const r of Object.values(DECLARED).flat()) expect(SDK_ONLY_REASONS).not.toContain(r);
  });

  it('declares no tracking and no tracking domains in any build', () => {
    for (const env of COMBINATIONS) {
      const pm = manifestFor(env);
      expect(pm.NSPrivacyTracking).toBe(false);
      expect(pm.NSPrivacyTrackingDomains).toEqual([]);
    }
  });
});

/** Every PrivacyInfo.xcprivacy a package in the repo's node_modules ships (not nested node_modules or examples). */
function podManifests(): { file: string; categories: string[] }[] {
  const out: { file: string; categories: string[] }[] = [];
  const skip = new Set(['node_modules', 'example', 'examples', 'android', 'web', '__tests__', 'docs']);
  const walk = (dir: string, depth: number) => {
    if (depth > 6) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && !skip.has(e.name)) walk(p, depth + 1);
      else if (e.isFile() && e.name === 'PrivacyInfo.xcprivacy') {
        const xml = fs.readFileSync(p, 'utf8');
        const categories = [...xml.matchAll(/<key>NSPrivacyAccessedAPIType<\/key>\s*<string>([^<]+)<\/string>/g)].map((m) => m[1]);
        out.push({ file: path.relative(REPO, p), categories });
      }
    }
  };
  for (const base of [path.join(REPO, 'node_modules'), path.join(ROOT, 'node_modules')]) {
    if (!fs.existsSync(base)) continue;
    for (const pkg of fs.readdirSync(base)) {
      if (pkg.startsWith('.')) continue;
      const dir = path.join(base, pkg);
      if (pkg.startsWith('@')) for (const sub of fs.readdirSync(dir)) walk(path.join(dir, sub), 1);
      else walk(dir, 1);
    }
  }
  return out;
}

/**
 * Pods that come from CocoaPods trunk, not node_modules (GoogleSignIn ~> 9.0 through
 * @react-native-google-signin/google-signin, and its dependencies). Categories as read from each SDK's
 * PrivacyInfo.xcprivacy in its own repository on 16 Oct 2026. AppAuth 2.0.0, GTMAppAuth 5.0.0 and
 * PromisesObjC 2.4.0 declare none.
 */
const TRUNK_POD_CATEGORIES: Record<string, string[]> = {
  'GoogleSignIn 9.0.0': ['NSPrivacyAccessedAPICategoryUserDefaults'],
  'GTMSessionFetcher 3.5.0': ['NSPrivacyAccessedAPICategoryUserDefaults'],
  'GoogleUtilities 8.1.0': ['NSPrivacyAccessedAPICategoryFileTimestamp', 'NSPrivacyAccessedAPICategoryUserDefaults'],
};

describe('every category a linked SDK declares is in the app manifest', () => {
  const found = podManifests();

  it('finds the pod manifests (so this check cannot pass on an empty tree)', () => {
    expect(found.map((f) => f.file)).toContain('node_modules/react-native/React/Resources/PrivacyInfo.xcprivacy');
    expect(found.map((f) => f.file)).toContain('node_modules/expo-file-system/ios/PrivacyInfo.xcprivacy');
  });

  it('node_modules pods: each declared category is declared by the app too', () => {
    const declared = Object.keys(DECLARED);
    for (const f of found) {
      for (const c of f.categories) {
        expect(declared, `${f.file} declares ${c}; add it to src/lib/privacy-manifest.ts with the reason that fits this app's use`).toContain(c);
      }
    }
  });

  it('CocoaPods-trunk pods (GoogleSignIn and its dependencies): each category is declared by the app too', () => {
    const declared = Object.keys(DECLARED);
    for (const [pod, cats] of Object.entries(TRUNK_POD_CATEGORIES)) {
      for (const c of cats) expect(declared, `${pod} declares ${c}`).toContain(c);
    }
  });

  it('the GoogleSignIn pin these categories were read for is still the one the library asks for', () => {
    const rel = 'node_modules/@react-native-google-signin/google-signin/package.json';
    const file = [path.join(ROOT, rel), path.join(REPO, rel)].find((f) => fs.existsSync(f));
    expect(file, 'the Google sign-in library is installed').toBeDefined();
    const pkg = JSON.parse(fs.readFileSync(file!, 'utf8')) as { GoogleSignInPodVersion?: string };
    expect(pkg.GoogleSignInPodVersion, 'GoogleSignIn moved: re-read its PrivacyInfo.xcprivacy and its dependencies, then update TRUNK_POD_CATEGORIES').toBe('~> 9.0');
  });
});

describe('LEGAL-REQ-043 collected data types: exactly true for each build', () => {
  it('alpha build 1 (testflight, servers off) declares nothing collected', () => {
    const env = profileEnv('testflight');
    if (env.EXPO_PUBLIC_SERVER_FEATURES === 'on') return; // after the R-17 flip it is build 2; the flip test covers it
    expect(manifestFor(env).NSPrivacyCollectedDataTypes).toEqual([]);
  });

  it('development and production (servers off) declare nothing collected', () => {
    for (const name of ['development', 'production']) {
      expect(eas.build[name]?.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('off');
      expect(manifestFor(profileEnv(name)).NSPrivacyCollectedDataTypes, name).toEqual([]);
    }
  });

  it('a servers-off build declares nothing even with every build flag set in the shell', () => {
    for (const env of COMBINATIONS.filter((e) => e.EXPO_PUBLIC_SERVER_FEATURES === 'off')) {
      expect(manifestFor(env).NSPrivacyCollectedDataTypes, JSON.stringify(env)).toEqual([]);
    }
    expect(manifestFor({}).NSPrivacyCollectedDataTypes, 'nothing set (a local run)').toEqual([]);
  });

  it('alpha build 2 (preview, servers on, backup and status report off) declares the server-on set', () => {
    const env = profileEnv('preview');
    expect(env.EXPO_PUBLIC_SERVER_FEATURES).toBe('on');
    expect(typesOf(manifestFor(env).NSPrivacyCollectedDataTypes)).toEqual([...SERVER_ON].sort());
  });

  it('build 2 with recording backup adds Audio Data and Device ID', () => {
    expect(typesOf(manifestFor({ ...profileEnv('preview'), EXPO_PUBLIC_BACKUP: 'on' }).NSPrivacyCollectedDataTypes)).toEqual([...WITH_BACKUP].sort());
  });

  it('build 2 with the status report adds Purchase History', () => {
    expect(typesOf(manifestFor({ ...profileEnv('preview'), EXPO_PUBLIC_STATUS_REPORT: 'on' }).NSPrivacyCollectedDataTypes)).toEqual([...WITH_STATUS_REPORT].sort());
  });

  it('build 2 with both flags declares the full set', () => {
    expect(typesOf(manifestFor({ ...profileEnv('preview'), EXPO_PUBLIC_BACKUP: 'on', EXPO_PUBLIC_STATUS_REPORT: 'on' }).NSPrivacyCollectedDataTypes)).toEqual([...EVERYTHING].sort());
  });

  it('the R-17 flip (testflight with servers on) gives the same manifest as build 2', () => {
    const flipped = manifestFor({ ...profileEnv('testflight'), EXPO_PUBLIC_SERVER_FEATURES: 'on' });
    expect(flipped).toEqual(manifestFor(profileEnv('preview')));
  });

  it('every collected type is linked, never tracking, App Functionality only, one of Apple\'s values, and listed once', () => {
    for (const env of COMBINATIONS) {
      const collected = manifestFor(env).NSPrivacyCollectedDataTypes ?? [];
      expect(new Set(typesOf(collected)).size).toBe(collected.length);
      for (const c of collected) {
        expect(APPLE_DATA_TYPES).toContain(c.NSPrivacyCollectedDataType);
        expect(c.NSPrivacyCollectedDataTypeLinked, c.NSPrivacyCollectedDataType).toBe(true);
        expect(c.NSPrivacyCollectedDataTypeTracking, c.NSPrivacyCollectedDataType).toBe(false);
        expect(c.NSPrivacyCollectedDataTypePurposes, c.NSPrivacyCollectedDataType).toEqual(['NSPrivacyCollectedDataTypePurposeAppFunctionality']);
      }
    }
  });

  it('no analytics or crash SDK ships, which is why no type has an Analytics purpose', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const sdk of ['posthog-react-native', '@sentry/react-native', 'sentry-expo']) {
      expect(deps, `${sdk} is back: S17 re-runs the App Privacy worksheet (Usage Data, Diagnostics) before this manifest changes`).not.toContain(sdk);
    }
    // The analytics switch alone sends nothing (no SDK), so it must not change the manifest either.
    expect(manifestFor({ ...profileEnv('preview'), EXPO_PUBLIC_ANALYTICS: 'on' })).toEqual(manifestFor(profileEnv('preview')));
  });

  it('follows exactly the switches app.config.ts records in extra, in every combination', () => {
    for (const env of COMBINATIONS) {
      const exp = configWith(env);
      const s = { serverFeatures: exp.extra?.serverFeatures === true, backup: exp.extra?.backup === true, statusReport: exp.extra?.statusReport === true };
      expect(exp.ios?.privacyManifests, JSON.stringify(env)).toEqual(privacyManifest(s));
    }
  });

  it('collectedDataTypes() ignores build flags without the server switch', () => {
    expect(collectedDataTypes({ serverFeatures: false, backup: true, statusReport: true })).toEqual([]);
    expect(privacyManifest({ serverFeatures: false, backup: true, statusReport: true }).NSPrivacyCollectedDataTypes).toEqual([]);
  });
});

describe("matches S17's App Privacy worksheet (docs/legal/app-store-privacy-labels.md)", () => {
  const file = path.join(REPO, 'docs/legal/app-store-privacy-labels.md');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const version = /^version:\s*(\d+)\.(\d+)\./m.exec(text);
  // Version 1.4.0 (PR #163) is the first that answers for a server-on build; 1.3.0 on develop still describes
  // opt-in analytics. Until #163 lands this block is skipped; from then on it guards the two against drift.
  const answersServerOn = !!version && (Number(version[1]) > 1 || (Number(version[1]) === 1 && Number(version[2]) >= 4));

  it.skipIf(!answersServerOn)('section 4 (the full set, backup and status report on) equals the manifest with both flags on', () => {
    const section = text.slice(text.indexOf('## 4.'));
    const block = /```json\s*([\s\S]*?)```/.exec(section)?.[1];
    expect(block, 'section 4 has a JSON block').toBeDefined();
    const sheet = JSON.parse(block!) as { NSPrivacyTracking: boolean; NSPrivacyCollectedDataTypes: CollectedDataType[] };
    expect(sheet.NSPrivacyTracking).toBe(false);
    const ours = privacyManifest({ serverFeatures: true, backup: true, statusReport: true }).NSPrivacyCollectedDataTypes;
    const key = (c: CollectedDataType) => JSON.stringify([c.NSPrivacyCollectedDataType, c.NSPrivacyCollectedDataTypeLinked, c.NSPrivacyCollectedDataTypeTracking, [...c.NSPrivacyCollectedDataTypePurposes].sort()]);
    expect(sheet.NSPrivacyCollectedDataTypes.map(key).sort()).toEqual(ours.map(key).sort());
  });
});

describe('the generated PrivacyInfo.xcprivacy', () => {
  const { mergePrivacyInfo } = IOSConfig.PrivacyInfo;

  it("Expo's PrivacyInfo mod writes this build's manifest unchanged into a fresh native folder", () => {
    for (const env of COMBINATIONS) {
      const pm = manifestFor(env);
      const written = mergePrivacyInfo({}, pm);
      expect(typesOf(written.NSPrivacyCollectedDataTypes)).toEqual(typesOf(pm.NSPrivacyCollectedDataTypes));
      expect(reasonsOf(written.NSPrivacyAccessedAPITypes)).toEqual(DECLARED);
      expect(written.NSPrivacyTracking).toBe(false);
    }
  });

  it('...but merges into an existing file and never removes a type, so the native folder must never be reused', () => {
    const build2 = mergePrivacyInfo({}, manifestFor(profileEnv('preview')));
    const build1OverBuild2 = mergePrivacyInfo(build2, manifestFor({ ...profileEnv('preview'), EXPO_PUBLIC_SERVER_FEATURES: 'off' }));
    // This is the hazard, written down: a servers-off prebuild over a servers-on ios/ folder keeps build 2's types.
    expect(typesOf(build1OverBuild2.NSPrivacyCollectedDataTypes)).toEqual([...SERVER_ON].sort());
    // So ios/ is never committed (every EAS build prebuilds from a clean checkout)...
    const gitignore = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
    expect(gitignore).toContain('**/ios/');
    // ...and the preflight prebuilds with --clean in a fresh temporary copy.
    const preflight = fs.readFileSync(path.join(ROOT, 'scripts', 'preflight-testflight.mjs'), 'utf8');
    expect(preflight).toMatch(/'prebuild', '--platform', 'ios', '--no-install', '--clean'/);
  });
});
