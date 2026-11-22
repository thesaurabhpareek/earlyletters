/**
 * The web builds the e2e-web run makes (global-setup.ts), as data so a test can read them (test/e2e-web-builds.test.ts).
 * BL-410, council ruling E6: the web presentation seam (`?e2eFontScale=`, `?e2eLang=`, src/dev/e2e-web-seam.web.ts) is
 * compiled in only when EXPO_PUBLIC_E2E=1 and the app env is neither preview nor production. The `seam` build is the
 * ONLY one that sets it, with the development app env (B-9 refuses the flag anywhere else). Emulation evidence only.
 */
import { MOCK_SUPABASE_URL } from './mock-server';

export const BASE_ENV: Record<string, string> = { EXPO_PUBLIC_APP_ENV: 'preview', EXPO_PUBLIC_SERVER_FEATURES: 'off', CI: '1' };

export type WebBuild = { name: 'plain' | 'seed' | 'server-on' | 'seam'; dir: string; env: Record<string, string> };

/** `dir` is relative to apps/mobile. */
export const BUILDS: readonly WebBuild[] = [
  { name: 'plain', dir: 'e2e-web/.web-dist', env: {} },
  // `?seed=asha` fills the on-device database with the fictional family (web design preview switch).
  { name: 'seed', dir: 'e2e-web/.web-dist-seed', env: { EXPO_PUBLIC_WEB_PREVIEW: '1' } },
  {
    name: 'server-on',
    dir: 'e2e-web/.results/web-dist-server-on',
    env: {
      EXPO_PUBLIC_WEB_PREVIEW: '1',
      EXPO_PUBLIC_SERVER_FEATURES: 'on',
      EXPO_PUBLIC_ACCOUNT_DELETION: 'on',
      EXPO_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL, // a host nothing listens on (support/mock-server.ts),
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-web-publishable-key',
    },
  },
  // The seam build: seeded family plus the presentation seam. Never served to a store; lives under .results/ (git ignored).
  { name: 'seam', dir: 'e2e-web/.results/web-dist-seam', env: { EXPO_PUBLIC_WEB_PREVIEW: '1', EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_APP_ENV: 'development' } },
];

export const buildEnv = (extra: Record<string, string>): Record<string, string> => ({ ...BASE_ENV, ...extra });

/**
 * BL-1576: the shell env a build inherits. global-setup spreads the parent environment into every build, so a stray
 * `EXPO_PUBLIC_E2E` in the shell would otherwise reach the plain, seed and server-on bundles. Only the seam build
 * may carry the e2e switch, and it gets it from its own env in BUILDS (applied after this, by buildEnv), never from the shell.
 */
export const inheritedEnv = <T extends Record<string, string | undefined>>(parent: T): T => {
  const { EXPO_PUBLIC_E2E: _shell, ...rest } = parent;
  return rest as T;
};
