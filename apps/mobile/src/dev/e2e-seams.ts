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
 * app env: a store profile switched to `development` would carry the seam. Proven with `expo export` on #203;
 * release check B-8 (S20, #210) searches the store bundles for the seam's names, before or with RA-20-18.
 *
 * TODO(#145): when #145 merges, this paragraph changes. A dedicated e2e marker that no store profile can
 * carry is request B-9; #145 answers it with `e2eRefusal()` in `src/lib/build-env.ts`, which makes
 * `app.config.ts` refuse `EXPO_PUBLIC_E2E=1` with the preview or production app env, or on an EAS build of
 * any profile but `e2e`. Until #145 is on `develop` that refusal does not exist here, so this file gates on
 * what exists. The drill also refuses at run time off a simulator, outside the development bundle, or on an
 * install it did not make (`decideDrillGuard`). The hook is chosen once per build, so every render runs the
 * same hooks.
 */
type UseSeams = () => void;

function useNoSeams(): void {}

export const useE2eSeams: UseSeams =
  process.env.EXPO_PUBLIC_E2E === '1' && process.env.EXPO_PUBLIC_APP_ENV !== 'preview' && process.env.EXPO_PUBLIC_APP_ENV !== 'production'
    ? (require('./kill-drill') as typeof import('./kill-drill')).useKillDrill
    : useNoSeams;
