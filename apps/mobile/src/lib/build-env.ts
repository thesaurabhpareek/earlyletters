/**
 * Which build this is (TDD 01 3.10). `EXPO_PUBLIC_APP_ENV` is set per EAS
 * profile in eas.json (development, preview, production) and inlined at
 * bundle time. A missing value counts as production, so a build made without
 * a profile is treated as release.
 *
 * Release safety (TDD 01 R-01): dogfood families run `preview` builds. A dev
 * shortcut must check `devShortcutsAllowed`, never `__DEV__` alone: a
 * development-client build used outside the founder's desk has `__DEV__`
 * true, and a preview or production build must never offer a bypass.
 */
export type AppEnv = 'development' | 'preview' | 'production';

function readEnv(): AppEnv {
  const v = process.env.EXPO_PUBLIC_APP_ENV;
  return v === 'development' || v === 'preview' ? v : 'production';
}

export const APP_ENV: AppEnv = readEnv();

/** Development profile and a development bundle, both. False in every preview and store build. */
export const devShortcutsAllowed: boolean = __DEV__ && APP_ENV === 'development';
