# Proposal: run the TestFlight tests in their own job, away from EXPO_TOKEN

Status: proposal, 27 Nov 2026, ruled by Karma in CR-233. This pull request changes nothing under `.github/`; whoever applies workflow changes applies the patch. The fence (`compliance/FENCE.json`) does not list `testflight.yml`, so no CCO approval is needed.

## Problem

In `.github/workflows/testflight.yml` one job, `build`, runs `npm ci`, the typecheck and `npm test`, and then the step "Build on EAS", which holds `EXPO_TOKEN`. The token is only in that last step's environment, but the steps share one runner, one user and one workspace:

- A process that an earlier step starts keeps running until the job ends. The runner only kills leftovers at the end of the job (every job log here ends with "Cleaning up orphan processes", for example job 140499012469). A process running as the same user can read a later step's environment from `/proc`.
- Anything a test writes into the workspace (a source file, a file under `node_modules`, a config file) is what EAS then uploads and builds, and what `npx` resolves.

So a bad test, or a bad dependency that the tests load, merged into develop, could read the token or change the build. The same job also restores the npm download cache and runs install scripts, which `release-ios.yml` already rules out for jobs that hold secrets ("Jobs that hold secrets install with a fresh `npm ci` and setup-node pinned by SHA, never a restored cache").

## The exact change

`docs/ops/proposed/workflows/testflight-checks-job.patch`, applied with `git apply docs/ops/proposed/workflows/testflight-checks-job.patch`:

1. A new job `checks` ("testflight checks") with no environment and no secret: checkout, setup-node with the npm cache, `npm ci`, typecheck, `npm test`. It has the same `if` as `build`.
2. `build` gets `needs: checks`, so nothing is built unless the tree is green, as today.
3. `build` keeps its own clean checkout, drops the npm cache from setup-node, and installs with `npm ci --ignore-scripts --no-audit --no-fund`. It keeps the preflight, the B-8 seam guard and the EAS step unchanged.

No action pin, permission, trigger, environment or secret name changes.

## Evidence

- `release-ios.yml` splits `checks (G2)` from its `build` job in the same way, and installs fresh in the job that holds the token.
- The lockfile has two packages with install scripts, `esbuild` and `fsevents` (macOS only). On 27 Nov 2026, after `npm ci --ignore-scripts` on develop, `npm run preflight:testflight -w @scribe/mobile -- --profile testflight` printed "0 fail" and `node .github/scripts/seam-guard.mjs --profile testflight` exited 0.

## Risk

- Each run pays for a second `npm ci`, a few minutes on a workflow that only runs when someone dispatches a build.
- UNVERIFIED: that EAS itself needs nothing an install script would have produced. EAS installs on its own servers, so this is unlikely, but the first dispatched run after the change is the check.
- What this does not fix: `npm ci` in `build` still unpacks every dependency into the job that holds the token, and the EAS step runs `npx eas-cli@<pinned>`, which installs eas-cli with its own scripts. Both are pinned by the lockfile and `EAS_CLI_VERSION`.

## Way back

Revert the patch: put the typecheck and tests back in `build`, remove `checks` and `needs: checks`, and restore `cache: npm` and plain `npm ci`. If only the install is the problem, drop `--ignore-scripts` from the build job and keep the split.
