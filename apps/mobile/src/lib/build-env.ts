/**
 * Which build this is (TDD 01 3.10). `EXPO_PUBLIC_APP_ENV` is set per EAS
 * profile in eas.json (development, preview, production) and inlined at
 * bundle time. Locally, `expo start` reads it from `.env.development`.
 *
 * POPS-02: a missing value counts as development, never production. A
 * production build must say so explicitly (eas.json `production` profile), so
 * a build made without a profile gets the `.dev` bundle id and cannot be
 * uploaded as the store app by accident. An unknown value is refused by
 * app.config.ts at config time; at runtime it also falls back to development.
 *
 * Release safety (TDD 01 R-01): dogfood families run `preview` builds. A dev
 * shortcut must check `devShortcutsAllowed`, never `__DEV__` alone: a
 * development-client build used outside the founder's desk has `__DEV__`
 * true, and a preview or production build must never offer a bypass. A
 * release build with no profile resolves to development here but has
 * `__DEV__` false, so it still offers no shortcut.
 *
 * This file is also loaded by app.config.ts in Node (no React Native), so it
 * stays dependency-free and must not assume `__DEV__` exists.
 */
export type AppEnv = 'development' | 'preview' | 'production';

export const APP_ENVS: readonly AppEnv[] = Object.freeze(['development', 'preview', 'production'] as const);

/** The environment used when `EXPO_PUBLIC_APP_ENV` is unset or empty (POPS-02). */
export const DEFAULT_APP_ENV: AppEnv = 'development';

/**
 * Maps a raw `EXPO_PUBLIC_APP_ENV` value to an environment. Unset or empty
 * means development. Returns null for an unknown value so the caller decides:
 * app.config.ts throws, the running app falls back to development.
 */
export function resolveAppEnv(raw: string | undefined | null): AppEnv | null {
  if (raw === undefined || raw === null || raw.trim() === '') return DEFAULT_APP_ENV;
  const v = raw.trim();
  return (APP_ENVS as readonly string[]).includes(v) ? (v as AppEnv) : null;
}

// Literal `process.env.EXPO_PUBLIC_APP_ENV` so Metro inlines it at bundle time.
export const APP_ENV: AppEnv = resolveAppEnv(process.env.EXPO_PUBLIC_APP_ENV) ?? DEFAULT_APP_ENV;

const isDevBundle: boolean = typeof __DEV__ !== 'undefined' && __DEV__ === true;

/** Development profile and a development bundle, both. False in every preview and store build. */
export const devShortcutsAllowed: boolean = isDevBundle && APP_ENV === 'development';
