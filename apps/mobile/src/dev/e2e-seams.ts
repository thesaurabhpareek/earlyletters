/**
 * E2E seams (`apps/mobile/e2e/TESTID_REQUESTS.md` section 3). The root layout calls `useE2eSeams()` once,
 * as the first line of `Root` in `app/_layout.tsx`, before the 18+ gate reads its setting (wiring line:
 * request to S20, RA-20-18). Today it carries the kill drill (`kill-drill.ts`, RA-19-04).
 *
 * Which builds carry the seam: only a build with `EXPO_PUBLIC_E2E=1` whose `EXPO_PUBLIC_APP_ENV` is neither
 * `preview` nor `production`, so in practice the development app env. Every store profile in `eas.json`
 * (`preview`, `testflight`, `production`) sets `preview` or `production`, so none of them can carry it, even
 * with `EXPO_PUBLIC_E2E=1` set by mistake. Both values are inlined at bundle time; in a build that does not
 * meet both, the condition below is a constant false, the bundler's constant folding drops the `require`
 * before it collects dependencies, and no seam code ships. That holds only while every store profile keeps its
 * app env: a store profile switched to `development` would carry the seam, which is why B-8 checks bundles. Proven with `expo export` on #203; release check B-8 greps the
 * `testflight` and `production` bundles for `e2eKillDrill` (request to S20, with RA-20-18).
 *
 * A dedicated e2e marker that no store profile can carry (an `e2e` app env, or a refusal in app.config.ts when
 * `EXPO_PUBLIC_E2E` meets a store profile) is a request to S20 and the founder; until it exists this file gates
 * on what exists. The drill also refuses at run time off a simulator, outside the development bundle, or on an
 * install it did not make (`decideDrillGuard`). The hook is chosen once per build, so every render runs the
 * same hooks.
 */
type UseSeams = () => void;

function useNoSeams(): void {}

export const useE2eSeams: UseSeams =
  process.env.EXPO_PUBLIC_E2E === '1' && process.env.EXPO_PUBLIC_APP_ENV !== 'preview' && process.env.EXPO_PUBLIC_APP_ENV !== 'production'
    ? (require('./kill-drill') as typeof import('./kill-drill')).useKillDrill
    : useNoSeams;
