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
 * Build profile (eas.json `env.EXPO_PUBLIC_APP_ENV`): development and
 * preview get a suffixed bundle id, so the real id is never used before
 * `brand.company.domain` is final (TDD 01 3.10 item 2, R-10). Do not run an
 * App Store Connect upload of the production profile until then.
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

type AppEnv = 'development' | 'preview' | 'production';
const raw = process.env.EXPO_PUBLIC_APP_ENV;
const APP_ENV: AppEnv = raw === 'development' || raw === 'preview' ? raw : 'production';

const ID_SUFFIX: Record<AppEnv, string> = { development: '.dev', preview: '.preview', production: '' };
const appId = `${bundleId()}${ID_SUFFIX[APP_ENV]}`;
const microphone = permissionCopy.microphone.replace('{app}', brand.name);

export default ({ config }: ConfigContext): ExpoConfig => ({
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
});
