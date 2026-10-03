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
 * Loads a TypeScript file at config time. Expo transpiles only this file, and
 * Node type stripping is not promised on EAS build images, so each .ts file is
 * transpiled here. Relative imports between them (packages/brand/index.ts
 * re-exports ./registry) are resolved the same way; anything else goes to
 * Node's require.
 */
function loadTs<T>(relative: string, from = ROOT): T {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ts = require('typescript') as typeof import('typescript');
  const file = path.resolve(from, relative.endsWith('.ts') ? relative : `${relative}.ts`);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const localRequire = (id: string) => (id.startsWith('.') ? loadTs(id, path.dirname(file)) : require(id));
  const mod = { exports: {} as Record<string, unknown> };
  new Function('module', 'exports', 'require', outputText)(mod, mod.exports, localRequire);
  return mod.exports as T;
}

const { brand, bundleId, assetFor } = loadTs<BrandModule>('../../packages/brand/index.ts');

/**
 * Icon files come from the brand registry (packages/brand/registry.ts), never
 * from typed paths: context `app.icon` = default, dark, tinted 1024 masters.
 * Registry paths are repo-relative; this config resolves from apps/mobile.
 */
const fromRepo = (p: string | undefined) => {
  if (!p) throw new Error('brand registry: icon asset has no path');
  return path.posix.join('..', '..', p);
};
const [iconDefault, iconDark, iconTinted] = assetFor('app.icon').map((a) => fromRepo(a.path));
const webFavicon = fromRepo(assetFor('web.favicon').find((a) => a.format === 'png')?.path);
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
  // Brand registry `app.icon` (approved mark, Oct 3 2026). Android uses this until its adaptive set exists.
  icon: iconDefault,
  scheme: brand.scheme,
  userInterfaceStyle: 'automatic',
  backgroundColor: brand.colors.paper,
  ios: {
    bundleIdentifier: appId,
    // Brand registry `app.icon`: light/dark/tinted 1024 PNGs, each opaque and square (ExpoConfig `IOSIcons`,
    // checked in @expo/config-types for SDK 57; https://docs.expo.dev/develop/user-interface/app-icons/).
    // TODO(design): Expo SDK 54+ also accepts an Icon Composer `.icon` folder here, which gives iOS 26 the real
    // Liquid Glass layers and replaces all three PNGs. Build it on a Mac in Icon Composer from
    // packages/brand/assets/logo/primary/symbol.svg with the tile gradient set in Composer (not baked),
    // register it in the brand registry, then point this at it. The scaffold ./assets/expo.icon is not ours.
    icon: { light: iconDefault, dark: iconDark, tinted: iconTinted },
    supportsTablet: false,
    infoPlist: {
      CADisableMinimumFrameDurationOnPhone: true,
    },
  },
  android: {
    package: appId,
    // TODO(design, Android is v1.1): scaffold adaptive layers; build them from the brand registry (logo.symbol.*) when Android starts.
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
    favicon: webFavicon,
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
