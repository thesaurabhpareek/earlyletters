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
 * Project values (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * the staging project's URL and anon key for the `preview` alpha; later a Sentry
 * DSN or PostHog key) go in EAS environment variables, created by the founder in
 * the EAS dashboard ("sensitive" visibility), never in this file, eas.json or a
 * committed .env file (docs/release/TESTFLIGHT.md step 9). The URL and anon key
 * are public by design (RLS is the authority); no service key ever ships.
 *
 * Data at rest (PSEC-05, LEGAL-REQ-022(b)): the default data-protection class
 * is set explicitly to "complete until first user authentication", so the
 * local database, recordings and models are encrypted until the phone is
 * first unlocked after a restart. Stricter classes ("complete") would break
 * background database writes while the phone is locked.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';
import * as fs from 'node:fs';
import * as path from 'node:path';

type BrandModule = typeof import('../../packages/brand/index');

/** Lowest supported iOS (D-098). The billing copy keeps its "needs iOS 17" fallback for safety. */
export const IOS_DEPLOYMENT_TARGET = '17.0';
type PermissionCopyModule = typeof import('./src/lib/permission-copy');

const ROOT = typeof __dirname === 'string' ? __dirname : process.cwd();

/**
 * Loads a dependency-free TypeScript file at config time. Expo transpiles
 * only this file; nested .ts imports would need Node type stripping, which
 * EAS build images do not promise.
 */
function loadTs<T>(relative: string, req: (id: string) => unknown = require): T {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ts = require('typescript') as typeof import('typescript');
  const file = path.join(ROOT, relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} as Record<string, unknown> };
  new Function('module', 'exports', 'require', outputText)(mod, mod.exports, req);
  return mod.exports as T;
}

const { brand, bundleId } = loadTs<BrandModule>('../../packages/brand/index.ts');
const { permissionCopy } = loadTs<PermissionCopyModule>('./src/lib/permission-copy.ts');

type BuildEnvModule = typeof import('./src/lib/build-env');
type AppEnv = import('./src/lib/build-env').AppEnv;
const { resolveAppEnv, e2eRefusal } = loadTs<BuildEnvModule>('./src/lib/build-env.ts');

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
 * No remote push: reminders (F13) and plan reminders are local notifications, and nothing in the app asks for a
 * push token. expo-notifications' own plugin, which prebuild applies because the package is installed, still
 * writes aps-environment; this removes it, so no build carries a push capability it does not use
 * (docs/ops/RELEASE.md section 4). Prebuild applies that plugin after this config, and a mod registered
 * earlier runs later, so the key is gone from the written entitlements file. When co-parent push is built
 * (F11 WP-F11-09c, which registers a token), remove this and request the entitlement on purpose.
 */
const PUSH_ENTITLEMENT = 'aps-environment';
const withoutRemotePush: ConfigPlugin = (c) =>
  withEntitlementsPlist(c, (m) => {
    delete m.modResults[PUSH_ENTITLEMENT];
    return m;
  });

/**
 * The iOS privacy manifest (BL-349, LEGAL-REQ-043): required-reason APIs, no
 * tracking, and the collected data types for this build's switches, from
 * src/lib/privacy-manifest.ts (evidence and Apple's sources are there). A build
 * with server features off declares no collected data; a server-on build
 * declares what S17's App Privacy worksheet lists for its build flags
 * (docs/legal/app-store-privacy-labels.md 1.4.0, sections 3.2 and 3.4).
 * Expo writes it into ios/<app>/PrivacyInfo.xcprivacy at prebuild and merges
 * into a file that is already there, so the native folder must be generated
 * fresh for each profile (it is never committed; EAS and the preflight prebuild
 * clean). Pod install then adds the pods' own reasons to the file.
 */
type PrivacyManifestModule = typeof import('./src/lib/privacy-manifest');
const { privacyManifest } = loadTs<PrivacyManifestModule>('./src/lib/privacy-manifest.ts');

const microphone = permissionCopy.microphone.replace('{app}', brand.name);

/**
 * The marketing version (CFBundleShortVersionString, versionName) lives only in version.json, shared by
 * iOS and Android (ADR 0022, D-089). Build numbers are never set here: EAS remote versioning owns them
 * (eas.json `appVersionSource: "remote"`, `autoIncrement`).
 */
function readVersion(): string {
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8')) as { version?: unknown };
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`apps/mobile/version.json: "version" must be MAJOR.MINOR.PATCH, got ${JSON.stringify(version)}`);
  }
  return version;
}

/** "123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc" (Google's iOS URL scheme). */
function reversedGoogleClientId(clientId: string | undefined): string | null {
  const m = /^([A-Za-z0-9-]+)\.apps\.googleusercontent\.com$/.exec((clientId ?? '').trim());
  return m ? `com.googleusercontent.apps.${m[1]}` : null;
}
const googleIosUrlScheme = reversedGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

/**
 * Server features (sign-in, sync, co-parent sharing) and the build flags on top of
 * them (recording backup, the status report, the Delete account row): the same rules as
 * src/lib/capabilities.ts, `on` only, and a build flag needs the server switch too.
 * In eas.json only `preview` is on (D-100, D-106); `testflight` stays off until the
 * R-17 gate passes, `production` until submission. The Delete account row
 * (`EXPO_PUBLIC_ACCOUNT_DELETION`, founder, 30 Oct 2026) is not written in the two alpha
 * profiles: it comes from the EAS `preview` environment, so a build without it hides the row.
 * Recorded in `extra` so a build's config shows
 * which it is. Read per evaluation, so one process can evaluate several profiles.
 */
const isOn = (raw: string | undefined) => (raw ?? '').trim().toLowerCase() === 'on';
function capabilityFlags() {
  const serverFeatures = isOn(process.env.EXPO_PUBLIC_SERVER_FEATURES);
  return {
    serverFeatures,
    backup: serverFeatures && isOn(process.env.EXPO_PUBLIC_BACKUP),
    statusReport: serverFeatures && isOn(process.env.EXPO_PUBLIC_STATUS_REPORT),
    accountDeletion: serverFeatures && isOn(process.env.EXPO_PUBLIC_ACCOUNT_DELETION),
  };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const APP_ENV = appEnvFromProcess();
  // B-9: EXPO_PUBLIC_E2E=1 only in a development build, and on EAS only in the e2e profile (build-env.ts).
  const e2eStop = e2eRefusal({ e2e: process.env.EXPO_PUBLIC_E2E, appEnv: APP_ENV, easBuildProfile: process.env.EAS_BUILD_PROFILE });
  if (e2eStop !== null) throw new Error(e2eStop);
  const appId = `${bundleId()}${ID_SUFFIX[APP_ENV]}`;
  return withoutRemotePush({
  ...config,
  name: brand.name,
  slug: brand.codename,
  // Expo organization that owns the EAS project `scribe`. Public identifier, written inline so scripts/release/doctor.ts can read it.
  owner: 'earlyletters-team',
  version: readVersion(),
  orientation: 'portrait',
  // The approved mark (docs/brand/BRAND_SYSTEM.md 6). icon*.png are byte copies of the 1024 masters the
  // registry names for contexts app.icon and appstore.icon (packages/brand/assets/logo/primary/app-icon-*.png);
  // Expo reads only paths under this directory, so they are copied here rather than referenced.
  icon: './assets/brand/icon.png',
  scheme: brand.scheme,
  userInterfaceStyle: 'automatic',
  backgroundColor: brand.colors.paper,
  ios: {
    bundleIdentifier: appId,
    // iOS 18+ appearances, all opaque RGB 1024 with no alpha (BRAND_SYSTEM.md 6): paper mark on the sepia
    // tile (the App Store master), accentDark mark on warm near-black, white mark on black for the system tint.
    icon: {
      light: './assets/brand/icon.png',
      dark: './assets/brand/icon-dark.png',
      tinted: './assets/brand/icon-tinted.png',
    },
    supportsTablet: false,
    config: {
      // Export compliance: answers the encryption question once, in the build, instead of at every upload.
      // True for this build: only the operating system's standard encryption. UNVERIFIED against Apple's
      // current wording; re-assess with counsel before the app adds its own encryption (for example audio upload).
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      CADisableMinimumFrameDurationOnPhone: true,
      // Declared so Linking.canOpenURL answers for them (Apple requires declared schemes; that tel and mailto need it
      // is to be confirmed by the S1-23 V-10 device check). The crisis lines (tel) and Write to us (mailto) ask it
      // first, then show the number or address to copy when the device reports it cannot (F20-REQ-005, F20-REQ-007).
      LSApplicationQueriesSchemes: ['tel', 'mailto'],
    },
    // Sign in with Apple entitlement (PRD A-REQ-016; expo-apple-authentication plugin below).
    usesAppleSignIn: true,
    // Universal links for email sign-in and invites (/auth/callback, /j); the website serves the AASA
    // file (docs/ops/AUTH_SETUP.md section 5). Domain from packages/brand, never typed here.
    associatedDomains: [`applinks:${brand.publisher.domain}`],
    entitlements: {
      [DATA_PROTECTION_ENTITLEMENT]: DATA_PROTECTION_CLASS,
    },
    // The same switches as `extra` below, read in the same evaluation.
    privacyManifests: privacyManifest(capabilityFlags()),
  },
  android: {
    package: appId,
    // Android ships later (D-059); the layers are ready. Background is a colour, not an image.
    adaptiveIcon: {
      backgroundColor: brand.colors.accent,
      foregroundImage: './assets/brand/android-foreground.png',
      monochromeImage: './assets/brand/android-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    // Web preview only (e2e-web). Still the earlier mark; rebuild from registry context web.favicon.
    favicon: './assets/brand/favicon.png',
  },
  plugins: [
    'expo-router',
    // D-098 (15 Oct 2026, delegated by founder; DEBATES Q-002): iOS 17 or later, because Apple's
    // subscription store view (the Plus sheet) needs it (ADR 0013). Expo SDK 57's own minimum is 16.4.
    ['expo-build-properties', { ios: { deploymentTarget: IOS_DEPLOYMENT_TARGET } }],
    [
      'expo-splash-screen',
      {
        // Registry context app.splash (A-REQ-001): the symbol alone (logo.symbol.ink on paper,
        // logo.symbol.reversed on paperDark), 96 pt tall and centred, so 80 percent of this 120 pt square.
        image: './assets/brand/splash.png',
        imageWidth: 120,
        resizeMode: 'contain',
        backgroundColor: brand.colors.paper,
        dark: { image: './assets/brand/splash-dark.png', backgroundColor: brand.colors.paperDark },
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
    'expo-apple-authentication',
    // Brand fonts embedded at build time (no runtime load on launch). The list is
    // @scribe/design-tokens/fonts `fontFiles` (repo-root paths); its .ttf requires are
    // Metro assets, so they are stubbed here.
    [
      'expo-font',
      {
        fonts: loadTs<typeof import('../../packages/design-tokens/fonts/index')>('../../packages/design-tokens/fonts/index.ts', () => 0).fontFiles.map(
          (f) => path.join(ROOT, '../..', f),
        ),
      },
    ],
    // Google sign-in (PRD A-REQ-017): only when this build has the iOS client id, because the
    // plugin needs its reversed form as a URL scheme (docs/ops/AUTH_SETUP.md section 3).
    ...(googleIosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]] : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv: APP_ENV,
    ...capabilityFlags(),
    // EAS project `scribe` in the organization earlyletters-team (created 1 Nov 2026, docs/release/TESTFLIGHT.md step 3). Not a secret.
    eas: { projectId: '0bc517fb-a526-4f0f-892a-5ab676a86e6b' },
  },
  });
};
