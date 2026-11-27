# Proposal: a size gate with a committed baseline (Z-02, Z-05, Z-06; founder decision 15; BRIEF CI-SIZEGATE)

Status: proposal, 21 Nov 2026; step text re-read against `ci.yml` and the baseline steps written 27 Nov 2026 (BL-2130). The checker and its tests are on develop. No workflow is changed and no baseline is written: the baseline has to come from a CI run (this sandbox cannot export the bundle), so it is a follow-up PR (see "Baseline" below).

## What the check does

`npx tsx scripts/size/measure.ts --check` compares the measurement with the BASE branch's `docs/ops/size-baseline.json` (never only the PR's own copy, which its author controls). It fails, with numbers and package names only, when:

| Rule | Limit |
|---|---|
| Hermes bytecode grows | more than 100 KB or 1 percent against the base baseline |
| A top-20 package grows (or a new one appears) | more than 50 KB |
| An app dependency is added | any |
| Bytecode over 12 MB, or JS assets over 3 MB | always; `Size-change:` cannot waive these |

A relative growth passes only with all three: a `Size-change: <reason, owner>` line in the PR body, the baseline file updated in the same PR, and the label `size:baseline-accepted` applied last by the repository owner's account (read by the job from the issue events; see "Who applies the label"). Native size is not claimed here: CI cannot see the native binary; App Store Connect or the thinning report decides (Z-01, Z-04; the release step is in `docs/ops/APP_SIZE.md` section 2). `--write-baseline` writes the file (bytes and package names only).

### Who applies the label

Karma decides whether a growth is accepted and applies `size:baseline-accepted` (CR-176). No step asks the founder to label, paste or approve anything. The job checks only which account applied the label last: `.actor.login` must equal `github.repository_owner` (`thesaurabhpareek`). Agent sessions act as that same login, so any session can apply the label, including the session that wrote the PR. The check therefore proves that the label came from the owner account. It does not prove that a second person reviewed the growth; that rests on Karma applying it and on the two counted reviews. A stronger check (for example a label applied after the last push by a login other than the PR author) is a later design choice for Karma and is not part of this proposal.

### What is measured, and when

`measure.ts` runs `expo export` with the runner's environment, and the job sets no `EXPO_PUBLIC_APP_ENV`. `apps/mobile/app.config.ts` reads an unset value as development, so the gate and the baseline measure the development-config bundle, not a store profile (seam-guard sets each store profile's env for its own exports). This is the same bundle on both sides of every comparison, so the relative limits hold; read the hard-budget figures as close to, not equal to, the store bundle. The job runs on pull requests (any base) and on pushes to develop. It does not run on a push to main or to a `release/*` branch, so there is no run on the release commit itself: the evidence for a release is the pull request run at the release head.

## The paste

`docs/ops/proposed/workflows/size-gate-step.yml` is one job, `size-gate`, pasted whole (its comment lines included) into `.github/workflows/ci.yml` immediately before the line `  required:`. At develop `3a56ec0b` that is line 194: the `seam-guard` job ends at line 192, line 193 is blank, and one blank line goes between the pasted block and `  required:`. Its `needs: install` is the first job of `ci.yml` (line 26), and its `if:` reads `needs.install.outputs.heavy` (line 40) like the other heavy jobs. The `needs:` list of `required` (line 197) is not touched, so the job is advisory.

Checked in this PR: the paste, written out as a diff of `ci.yml`, passes `git apply --check`; the pasted file parses as YAML with the jobs in the order `seam-guard`, `size-gate`, `required` and every other job unchanged; `node scripts/ci/workflow-lint.mjs` on it reports 0 findings. `scripts/size/lib.test.ts` (the `[BL-2130]` tests, run by `npm test` through `packages/api/vitest.consumers.config.ts`) repeats the paste in memory on every run, so a moved paste point or a renamed `install` job goes red.

What changed in the text since 21 Nov: the job skips on the inert-docs lane (`heavy`) like its neighbours; checkout no longer keeps the token (`persist-credentials: false`, as in `seam-guard`); the owner-label step keeps only the last label event across every page (with `--paginate`, `--jq` runs once per page, so the old `last` could read an earlier page and miss a later unlabel); and on a push to develop the job measures and uploads the baseline instead of skipping, which is what the baseline steps below need. After review (PR #2177): the owner-label and measure scripts start with `set -euo pipefail`, because the runner's default `bash -e` has no pipefail and a failed later page of `gh api --paginate` would otherwise leave an earlier page's "labeled" line in `last`; the job also has `pull-requests: read`; and the artifact name carries the run attempt.

## Baseline (the first run, then a follow-up PR)

The baseline is a measurement, never typed. This sandbox cannot export the iOS bundle, so CI makes it:

1. Karma pastes the job (above) in its own PR, which also deletes `docs/ops/proposed/workflows/size-gate-step.yml` and marks this doc applied in the same commit (`docs/ops/proposed/workflows-retired.md`; the `[BL-2130]` tests then check the same properties on `ci.yml` instead). The paste PR also creates the label `size:baseline-accepted` in the repository (it does not exist yet; `gh label create size:baseline-accepted --description "Karma accepted a size growth (size-gate.md)"`), so step 5 has a label to apply. On that PR the job runs with no base baseline, so it checks only the hard budgets and prints `no base baseline to compare`.
2. That PR merges. The push to develop runs the job: `measure.ts --write-baseline` writes `docs/ops/size-baseline.json` inside the runner, and the step `Keep the measurement` uploads it with `dist/size/report.md` and `report.json` as the artifact `size-baseline-<sha>-<attempt>` (kept 30 days; the attempt number keeps a re-run's upload from clashing with the first). The artifact is uploaded even when the measure step fails on a budget.
3. Read the artifact first. If the run shows the bytecode over 12 MB or the JS assets over 3 MB, stop: do not commit a baseline that is already over a hard budget; it goes to Karma as a size decision (brief section 15). If the numbers differ from a Mac export of the same commit by more than 2 percent, compare like with like only (CI with CI).
4. A follow-up PR (`chore(ops): first size baseline from CI run <run id>`) commits `docs/ops/size-baseline.json` byte for byte from the artifact, with its `commit` field equal to the develop sha the run measured, and updates the JS table in `docs/ops/APP_SIZE.md` section 3 from `report.md` (the figures there are from 3 Oct). The PR body names the run id and the artifact. On that PR the job compares the head's measurement with no base baseline (develop has none yet), so only the hard budgets apply; the baseline is reviewed like a snapshot.
5. From the next PR on, every PR compares with develop's committed baseline. A PR that grows the bundle past a relative limit updates the file in the same PR and carries a `Size-change: <reason, owner>` line in its body. The line must be in the body before the last push: editing the body starts no run, and a re-run reads the body as it was when the run started, so a line added later needs one more push. Karma then decides the growth and, if it accepts it, applies `size:baseline-accepted`; the author session does not apply it to its own PR. Re-run the job after the label, since labelling starts no run (the label is read live from the issue events, so a re-run sees it). Known gap: the updated file must match CI's measurement exactly (`hbcBytes`, `dependencyCount` and the top-20 owners), and a PR run uploads nothing and prints only part of the report, so this proposal gives no way yet to get that exact file for a growth PR. Closing that gap is a follow-up, not part of BL-2130.
6. Making the job required (adding `size-gate` to the `needs:` of `required`) is a separate decision for Karma, after a few green runs. That PR also changes the `[BL-2130]` test that asserts the job is not in `required`.

## How to verify

- `npx vitest run --config vitest.consumers.config.ts scripts/size` in `packages/api` (the hard-budget and paste-point cases), and `npx vitest run test/size-gate.test.ts` in `apps/mobile` (7 gate tests). Mutant: change `>` to `>=` at the bytecode limit and the exact-limit tests go red.
- The `[BL-2130]` tests in `scripts/size/lib.test.ts` assert, on the proposal before the paste and on `ci.yml` after it: `needs: install` and the job exists, the `heavy` and develop-push condition, size-gate not in the `needs:` of `required`, every action pinned to a 40-character sha, `persist-credentials: false`, no `${{` inside a `run:`, and the owner-label script run under `bash -e` with a fake `gh` that prints a "labeled" line then exits 1 gives approved=0.
- After the paste: a scratch PR that imports a 200 KB module fails the job (only a person can prove this on GitHub).

## Not verified

The job (never run), whether the job token can read the issue events of a PR (both `issues: read` and `pull-requests: read` are granted; if the read fails, approved stays 0), whether `tsx` resolves in CI the same as locally (it is hoisted to the root `node_modules` from workspace dev dependencies, not a root dependency), whether `expo export` with Hermes bytecode works on the ubuntu runner (seam-guard exports with `--no-bytecode`; `hermes-compiler` ships a linux64 binary), the upload step's inputs against `actions/upload-artifact` v7.0.2 (copied from the same pinned use in `ios-compile.yml`), and the first real baseline numbers. If the first run already shows the bundle over a sub-budget, stop and tell Karma (brief section 15).

## The way back

Delete the job. The checker and the tests do nothing on their own. A committed baseline is one JSON file; deleting it puts the gate back to hard budgets only.
