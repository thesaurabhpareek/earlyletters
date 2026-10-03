/// <reference types="node" />
/**
 * Expo app config (TDD 01 3.10; BL-031, BL-M10). Replaces the scaffold
 * app.json (lumira-letters, Expo-blue splash, default microphone string).
 *
 * Identity comes from packages/brand only: name, scheme, bundle id, colours.
 * No public name is typed in this file (CLAUDE.md). The microphone purpose
 * string comes from src/lib/permission-copy.ts (part of pendingCopy; text
 * from docs/legal/app-store-privacy-labels.md 4, counsel review pending).
 *
 * Build profile (eas.json `env.EXPO_PUBLIC_APP_ENV`, POPS-02): development
 * and preview get a suffixed bundle id, so the real id is never used before
 * `brand.publisher.domain` is final (TDD 01 3.10 item 2, R-10). An unset
 * value means development (src/lib/build-env.ts); production must be named
 * explicitly, and only the eas.json `production` profile does that. An
 * unknown value fails the config. Do not run an App Store Connect upload of
 * the production profile until the domain is final.
 *
 * Environment variables (POPS-08). Non-secret, per EAS environment
 * (development, preview, production; eas.json `environment`):
 *   EXPO_PUBLIC_APP_ENV  development | preview | production. Set in eas.json
 *                        per profile and in .env.development for local runs.
 * Anything secret (future Supabase anon key, Sentry DSN, PostHog key) goes in
 * EAS environment variables with "sensitive" or "secret" visibility, created
 * by the founder in the EAS dashboard, never in this file, eas.json or a
 * committed .env file. Nothing secret exists yet: C0 builds have no backend.
 *
 * Data at rest (PSEC-05, LEGAL-REQ-022(b)): the default data-protection class
 * is set explicitly to "complete until first user authentication", so the
 * local database, recordings and models are encrypted until the phone is
 * first unlocked after a restart. Stricter classes ("complete") would break
 * background database writes while the phone is locked.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as fs from 'node:fs';
import * as path from 'node:path';

type BrandModule = typeof import('../../packages/brand/index');
type PermissionCopyModule = typeof import('./src/lib/permission-copy');

const ROOT = typeof __dirname === 'string' ? __dirname : process.cwd();

/**
 * Loads a dependency-free TypeScript file at config time. Expo transpiles
 * only this file; nested .ts imports would need Node type stripping, which
 * EAS build images do not promise.
 */
function loadTs<T>(relative: string): T {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ts = require('typescript') as typeof import('typescript');
  const file = path.join(ROOT, relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} as Record<string, unknown> };
  new Function('module', 'exports', 'require', outputText)(mod, mod.exports, require);
  return mod.exports as T;
}

const { brand, bundleId } = loadTs<BrandModule>('../../packages/brand/index.ts');
const { permissionCopy } = loadTs<PermissionCopyModule>('./src/lib/permission-copy.ts');

type BuildEnvModule = typeof import('./src/lib/build-env');
type AppEnv = import('./src/lib/build-env').AppEnv;
const { resolveAppEnv } = loadTs<BuildEnvModule>('./src/lib/build-env.ts');

/** Reads EXPO_PUBLIC_APP_ENV at evaluation time. Unset means development; an unknown value is refused. */
function appEnvFromProcess(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  const env = resolveAppEnv(raw);
  if (env === null) {
    throw new Error(
      `EXPO_PUBLIC_APP_ENV must be development, preview or production (got ${JSON.stringify(raw)}).`,
    );
  }
  return env;
}

const ID_SUFFIX: Record<AppEnv, string> = { development: '.dev', preview: '.preview', production: '' };

/**
 * iOS default data-protection class (PSEC-05). Apple's key and value; EAS
 * capability sync turns on Data Protection for the App ID from this entitlement.
 */
export const DATA_PROTECTION_ENTITLEMENT = 'com.apple.developer.default-data-protection';
export const DATA_PROTECTION_CLASS = 'NSFileProtectionCompleteUntilFirstUserAuthentication';

/**
 * Required-reason APIs (LEGAL-REQ-043; docs/legal/app-store-privacy-labels.md 3).
 * Only categories tied to a dependency this app actually links. Evidence was
 * read from node_modules on 2026-10-03 (expo SDK 57, react-native 0.86):
 * each pod's PrivacyInfo.xcprivacy, or source and symbols where a pod ships
 * no manifest. Expo merges these into the app's PrivacyInfo.xcprivacy at
 * prebuild. Re-check after every native dependency change, and treat Apple's
 * upload warning email as the final check.
 */
const PRIVACY_MANIFESTS: NonNullable<NonNullable<ExpoConfig['ios']>['privacyManifests']> = {
  // No tracking and no tracking domains (PRD: no ads, no data brokers).
  NSPrivacyTracking: false,
  NSPrivacyTrackingDomains: [],
  NSPrivacyAccessedAPITypes: [
    {
      // VERIFIED. react-native (React/Resources/PrivacyInfo.xcprivacy;
      // RCTBundleURLProvider), expo-constants (EXConstantsInstallationIdProvider)
      // and expo-system-ui each declare CA92.1 in their own manifests. App code
      // does not use UserDefaults directly (expo-sqlite/kv-store is not used).
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
      NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
    },
    {
      // VERIFIED. react-native core, boost, glog and RCT-Folly declare C617.1.
      // expo-file-system declares only 0A2A.1 (wrapper) and 3B52.1, so the app
      // owns the reason for its own calls: src/lib/capture/sweep.ts reads
      // creationTime/modificationTime of recordings in the app's Documents
      // directory. expo-sqlite ships no manifest and its vendored sqlite3.c
      // calls stat/fstat/lstat on the database files in the app container.
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
      NSPrivacyAccessedAPITypeReasons: ['C617.1'],
    },
    {
      // VERIFIED. react-native (ReactCommon/react/timing) and boost declare
      // 35F9.1: elapsed time between in-app events. whisper.rn links only
      // clock_gettime, which is not on Apple's list.
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
      NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
    },
    {
      // UNVERIFIED. expo-sqlite ships no manifest; its vendored sqlite3.c
      // calls fstatfs() on every database open on Apple platforms
      // (unixOpen, `defined(__APPLE__)`), only to read the filesystem type
      // name, never free space. fstatfs is on Apple's disk-space list. E174.1
      // is the closest approved reason and the one already planned for the
      // model downloader, but whether Apple's scan flags this symbol, and
      // whether E174.1 is the right reason for it, is unconfirmed. Confirm on
      // the first TestFlight upload; drop it if the warning email is silent
      // without it. App code does not query free space today.
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
      NSPrivacyAccessedAPITypeReasons: ['E174.1'],
    },
  ],
  // Nothing is collected off the device yet: C0 builds have no backend, no
  // analytics and no crash reporting. Before any build that syncs or sends
  // analytics, fill this from docs/legal/data-map.yaml (LEGAL-REQ-041) and
  // docs/legal/app-store-privacy-labels.md 3.3.
  NSPrivacyCollectedDataTypes: [],
};

const microphone = permissionCopy.microphone.replace('{app}', brand.name);

export default ({ config }: ConfigContext): ExpoConfig => {
  const APP_ENV = appEnvFromProcess();
  const appId = `${bundleId()}${ID_SUFFIX[APP_ENV]}`;
  return {
    ...config,
    name: brand.name,
    slug: brand.codename,
    version: '1.0.0',
    orientation: 'portrait',
    // TODO(design, A-REQ-001): the envelope mark does not exist yet; these are the scaffold icons.
    icon: './assets/images/icon.png',
    scheme: brand.scheme,
    userInterfaceStyle: 'automatic',
    backgroundColor: brand.colors.paper,
    ios: {
      bundleIdentifier: appId,
      // TODO(design): scaffold Icon Composer file; replace with the brand icon.
      icon: './assets/expo.icon',
      supportsTablet: false,
      infoPlist: {
        CADisableMinimumFrameDurationOnPhone: true,
      },
      entitlements: {
        [DATA_PROTECTION_ENTITLEMENT]: DATA_PROTECTION_CLASS,
      },
      privacyManifests: PRIVACY_MANIFESTS,
    },
    android: {
      package: appId,
      adaptiveIcon: {
        backgroundColor: brand.colors.paper,
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          // Paper, no image until the envelope mark exists (A-REQ-001). Never the Expo logo.
          backgroundColor: brand.colors.paper,
          dark: { backgroundColor: brand.colors.paperDark },
        },
      ],
      'expo-sqlite',
      '@react-native-community/datetimepicker',
      [
        'expo-audio',
        {
          microphonePermission: microphone,
          // LEGAL-REQ-011: never record in the background. The plugin turns
          // background playback on by default, which adds UIBackgroundModes
          // `audio` (and Android foreground services); both stay off.
          enableBackgroundPlayback: false,
          enableBackgroundRecording: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appEnv: APP_ENV,
    },
  };
};
