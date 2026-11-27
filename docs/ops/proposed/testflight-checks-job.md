# Proposal: run the TestFlight checks in their own job, away from EXPO_TOKEN

Status: proposal, 27 Nov 2026, ruled by Karma in CR-233. This pull request changes nothing under `.github/`; whoever applies workflow changes applies the patch. The fence (`compliance/FENCE.json`) does not list `testflight.yml`, so no CCO approval is needed.

## Problem

In `.github/workflows/testflight.yml` one job, `build`, runs `npm ci`, the typecheck, `npm test`, the preflight and the B-8 seam guard, and then the step "Build on EAS", which holds `EXPO_TOKEN`. The token is only in that last step's environment, but the steps share one runner, one user and one workspace:

- A process that an earlier step starts keeps running until the job ends. The runner only kills leftovers at the end of the job (job logs here end with "Cleaning up orphan processes", for example job 140499012469). A process running as the same user can read a later step's environment from `/proc`, and on GitHub-hosted runners that user also has sudo.
- Anything an earlier step writes into the workspace (a source file, a file under `node_modules`, a config file) is what EAS then uploads and builds.

The earlier steps run far more than our own code. `npm test` runs the test suite and every dependency it loads. The preflight (`apps/mobile/scripts/preflight-testflight.mjs`) starts vitest on the real-family-data guard and runs `expo config` and `expo prebuild`, which load the Expo config plugins. The seam guard (`.github/scripts/seam-guard.mjs`) runs `npx expo export`, which runs Metro and Babel. So a bad test or a bad dependency merged into develop could read the token or change the build. The same job also restores the npm download cache and runs install scripts.

## The exact change

`docs/ops/proposed/workflows/testflight-checks-job.patch`, applied with `git apply docs/ops/proposed/workflows/testflight-checks-job.patch`:

1. A new job `checks` ("testflight checks") with no environment and no secret holds every check, unchanged: checkout, setup-node with the npm cache, `npm ci`, typecheck, tests, preflight and the B-8 seam guard. It has the same `if` as `build`.
2. `build` gets `needs: checks`, so nothing is built unless every check passed, as today.
3. `build` keeps its own clean checkout, sets `package-manager-cache: false` on setup-node (so no cache comes back even if `package.json` ever names npm in `packageManager` or `devEngines.packageManager`), installs with `npm ci --ignore-scripts --no-audit --no-fund`, and runs the EAS step unchanged.
4. Two header comments say "the jobs' if" instead of "the job's if".

No action pin, permission, trigger, environment or secret name changes.

## Evidence

- `release-ios.yml` already splits `checks (G2)` from its `build` job and says: "Jobs that hold secrets install with a fresh `npm ci` and setup-node pinned by SHA, never a restored cache." It does not turn install scripts off; that part is new here.
- The lockfile has two packages with install scripts, `esbuild` and `fsevents` (macOS only), and no workspace package has an install or prepare script. After `npm ci --ignore-scripts` on develop on 27 Nov 2026, the preflight printed "0 fail" and the seam guard exited 0, so the install is enough for anything that reads `node_modules`.
- The pinned setup-node (v7.0.0) documents `package-manager-cache`, default true, which turns caching on when `packageManager` or `devEngines.packageManager` names npm.
- `scripts/ci/proposed-patch-applies.test.mjs` now guards this patch, so CI fails if a line the patch changes or uses as context changes in `testflight.yml`. A change elsewhere in the file still passes; those steps move into `checks` unchanged.

## Risk

- Each run pays for a second `npm ci`, a few minutes on a workflow that only runs when someone dispatches a build.
- A dispatch on an `ios-v` tag now runs `checks` (no secret) before the environment refuses `build`. Nothing more is exposed.
- The `testflight` environment's reviewer is now asked only once `checks` has passed, not at the start of the run.
- UNVERIFIED: that eas-cli needs nothing an install script would have produced. It builds on EAS's servers, so this is unlikely; the first dispatched run is the check.
- What this does not fix:
  - `npx eas-cli@<pinned>` runs in the job that holds the token. The pin fixes eas-cli itself, but eas-cli ships no shrinkwrap, so npx resolves its dependencies fresh at run time, with their install scripts.
  - eas-cli starts the project's own Expo CLI (`expo config --json`, and `--type introspect` for a managed iOS build, which runs the config plugins' mods) and passes it its whole environment, the token included. So `@expo/cli` from the lockfile, `app.config.ts` and the config plugins run beside the token.
  - eas-cli also loads `@expo/fingerprint` from the lockfile into its own process to fingerprint the build. That package runs the config loader again (so `app.config.ts` and the plugins) and the project's `expo-modules-autolinking` CLI, both with the token in their environment. The project has no expo-updates and the workflow does not set `EAS_SKIP_AUTO_FINGERPRINT`, so this runs on every build.
  - `npm ci` still unpacks every dependency into that job, though with install scripts off nothing in them runs at install.
  - The split relies on GitHub-hosted runners giving each job a fresh machine. A self-hosted or reused runner would undo it.
  - `checks` still saves the npm cache, as the single job did before.

## Way back

Revert the patch: put the checks back in `build`, remove `checks` and `needs: checks`, and restore `cache: npm` and plain `npm ci`. If only the install is the problem, drop `--ignore-scripts` from `build` and keep the split.
