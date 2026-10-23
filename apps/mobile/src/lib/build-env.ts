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

/** The one eas.json profile that may carry `EXPO_PUBLIC_E2E=1`: a simulator build, never uploaded (B-1). */
export const E2E_PROFILE = 'e2e';

/**
 * Release check B-9 (apps/mobile/e2e/TESTID_REQUESTS.md section 4): the e2e
 * seams (`EXPO_PUBLIC_E2E=1`) belong to the development app env and, on EAS,
 * to the `e2e` profile only. Returns why a build must stop, or null.
 * app.config.ts throws on it, so a build with the preview or production app
 * env, or an EAS build of any other profile, fails at config time instead of
 * relying on the bundle gate alone; preflight-testflight.mjs applies the same
 * rule to the profile env and to the shell. Only the exact value `1` turns the
 * seams on, so only `1` is refused.
 */
export function e2eRefusal(input: { e2e?: string | null; appEnv: AppEnv; easBuildProfile?: string | null }): string | null {
  if ((input.e2e ?? '').trim() !== '1') return null;
  if (input.appEnv !== 'development') {
    return `EXPO_PUBLIC_E2E=1 with EXPO_PUBLIC_APP_ENV=${input.appEnv}: e2e seams never reach a ${input.appEnv} build (B-9). Unset EXPO_PUBLIC_E2E, or build the ${E2E_PROFILE} profile.`;
  }
  const profile = (input.easBuildProfile ?? '').trim();
  if (profile !== '' && profile !== E2E_PROFILE) {
    return `EXPO_PUBLIC_E2E=1 in an EAS build of the "${profile}" profile: only the ${E2E_PROFILE} profile carries e2e seams (B-9). Remove EXPO_PUBLIC_E2E from that profile and from its EAS environment.`;
  }
  return null;
}

// Literal `process.env.EXPO_PUBLIC_APP_ENV` so Metro inlines it at bundle time.
export const APP_ENV: AppEnv = resolveAppEnv(process.env.EXPO_PUBLIC_APP_ENV) ?? DEFAULT_APP_ENV;

const isDevBundle: boolean = typeof __DEV__ !== 'undefined' && __DEV__ === true;

/** Development profile and a development bundle, both. False in every preview and store build. */
export const devShortcutsAllowed: boolean = isDevBundle && APP_ENV === 'development';
