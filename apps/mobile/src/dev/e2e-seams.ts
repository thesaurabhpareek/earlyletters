/**
 * E2E seams (`apps/mobile/e2e/TESTID_REQUESTS.md` section 3). The root layout calls `useE2eSeams()` once,
 * as the first line of `Root` in `app/_layout.tsx`, before the 18+ gate reads its setting (wiring line:
 * request to S20, RA-20-18). Today it carries the kill drill (`kill-drill.ts`, RA-19-04).
 *
 * Hard rule: the seams are compiled in only when `EXPO_PUBLIC_E2E` is `1` and `EXPO_PUBLIC_APP_ENV` is not
 * `production`. Both are inlined at bundle time, so in every other build the condition below is a constant
 * false: the release bundle's constant folding drops the `require`, and no seam code ships (release check B-8
 * in TESTID_REQUESTS.md section 4 greps the bundle for `e2eKillDrill`). The hook is chosen once per build, so
 * the same hooks run on every render.
 */
type UseSeams = () => void;

function useNoSeams(): void {}

export const useE2eSeams: UseSeams =
  process.env.EXPO_PUBLIC_E2E === '1' && process.env.EXPO_PUBLIC_APP_ENV !== 'production'
    ? (require('./kill-drill') as typeof import('./kill-drill')).useKillDrill
    : useNoSeams;
