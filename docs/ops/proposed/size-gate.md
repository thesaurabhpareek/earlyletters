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

A relative growth passes only with all three: a `Size-change: <reason, owner>` line in the PR body, the baseline file updated in the same PR, and the repository owner's label `size:baseline-accepted` (read by the job from the issue events, who applied it last). Native size is not claimed here: CI cannot see the native binary; App Store Connect or the thinning report decides (Z-01, Z-04; the release step is in `docs/ops/APP_SIZE.md` section 2). `--write-baseline` writes the file (bytes and package names only).

## The paste

`docs/ops/proposed/workflows/size-gate-step.yml` is one job, `size-gate`, pasted whole (its comment lines included) into `.github/workflows/ci.yml` immediately before the line `  required:`. At develop `3a56ec0b` that is line 194: the `seam-guard` job ends at line 192, line 193 is blank, and one blank line goes between the pasted block and `  required:`. Its `needs: install` is the first job of `ci.yml` (line 26), and its `if:` reads `needs.install.outputs.heavy` (line 40) like the other heavy jobs. The `needs:` list of `required` (line 197) is not touched, so the job is advisory.

Checked in this PR: the paste, written out as a diff of `ci.yml`, passes `git apply --check`; the pasted file parses as YAML with the jobs in the order `seam-guard`, `size-gate`, `required` and every other job unchanged; `node scripts/ci/workflow-lint.mjs` on it reports 0 findings. `scripts/size/lib.test.ts` (the `[BL-2130]` tests, run by `npm test` through `packages/api/vitest.consumers.config.ts`) repeats the paste in memory on every run, so a moved paste point or a renamed `install` job goes red.

What changed in the text since 21 Nov: the job skips on the inert-docs lane (`heavy`) like its neighbours; checkout no longer keeps the token (`persist-credentials: false`, as in `seam-guard`); the owner-label step keeps only the last label event across every page (with `--paginate`, `--jq` runs once per page, so the old `last` could read an earlier page and miss a later unlabel); and on a push to develop the job measures and uploads the baseline instead of skipping, which is what the baseline steps below need.

## Baseline (the first run, then a follow-up PR)

The baseline is a measurement, never typed. This sandbox cannot export the iOS bundle, so CI makes it:

1. Karma pastes the job (above) in its own PR, which also deletes `docs/ops/proposed/workflows/size-gate-step.yml` and marks this doc applied in the same commit (`docs/ops/proposed/workflows-retired.md`; the `[BL-2130]` test then checks `ci.yml` instead). On that PR the job runs with no base baseline, so it checks only the hard budgets and prints `no base baseline to compare`.
2. That PR merges. The push to develop runs the job: `measure.ts --write-baseline` writes `docs/ops/size-baseline.json` inside the runner, and the step `Keep the measurement` uploads it with `dist/size/report.md` and `report.json` as the artifact `size-baseline-<sha>` (kept 30 days). The artifact is uploaded even when the measure step fails on a budget.
3. Read the artifact first. If the run shows the bytecode over 12 MB or the JS assets over 3 MB, stop: do not commit a baseline that is already over a hard budget; it goes to Karma as a size decision (brief section 15). If the numbers differ from a Mac export of the same commit by more than 2 percent, compare like with like only (CI with CI).
4. A follow-up PR (`chore(ops): first size baseline from CI run <run id>`) commits `docs/ops/size-baseline.json` byte for byte from the artifact, with its `commit` field equal to the develop sha the run measured, and updates the JS table in `docs/ops/APP_SIZE.md` section 3 from `report.md` (the figures there are from 3 Oct). The PR body names the run id and the artifact. On that PR the job compares the head's measurement with no base baseline (develop has none yet), so only the hard budgets apply; the baseline is reviewed like a snapshot.
5. From the next PR on, every PR compares with develop's committed baseline. A PR that grows the bundle past a relative limit updates the file in the same PR with a `Size-change:` line, and passes only once the owner applies `size:baseline-accepted` (re-run the job after the label, since labelling starts no run).
6. Making the job required (adding `size-gate` to the `needs:` of `required`) is a separate decision for Karma, after a few green runs.

## How to verify

- `npx vitest run --config vitest.consumers.config.ts scripts/size` in `packages/api` (the hard-budget and paste-point cases), and `npx vitest run test/size-gate.test.ts` in `apps/mobile` (7 gate tests). Mutant: change `>` to `>=` at the bytecode limit and the exact-limit tests go red.
- After the paste: a scratch PR that imports a 200 KB module fails the job (only a person can prove this on GitHub).

## Not verified

The job (never run), whether `tsx` resolves in CI the same as locally (it is hoisted to the root `node_modules` from workspace dev dependencies, not a root dependency), the upload step's inputs against `actions/upload-artifact` v7.0.2 (copied from the same pinned use in `ios-compile.yml`), and the first real baseline numbers. If the first run already shows the bundle over a sub-budget, stop and tell Karma (brief section 15).

## The way back

Delete the job. The checker and the tests do nothing on their own. A committed baseline is one JSON file; deleting it puts the gate back to hard budgets only.
