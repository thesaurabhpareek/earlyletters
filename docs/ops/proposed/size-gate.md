# Proposal: a size gate with a committed baseline (Z-02, Z-05, Z-06; founder decision 15; BRIEF CI-SIZEGATE)

Status: proposal, 21 Nov 2026. This pull request adds the checker and its tests. It changes no workflow and writes no baseline: the baseline has to come from a CI run (this sandbox cannot export the bundle), so it is PR 2.

## What the check does

`npx tsx scripts/size/measure.ts --check` compares the measurement with the BASE branch's `docs/ops/size-baseline.json` (never only the PR's own copy, which its author controls). It fails, with numbers and package names only, when:

| Rule | Limit |
|---|---|
| Hermes bytecode grows | more than 100 KB or 1 percent against the base baseline |
| A top-20 package grows (or a new one appears) | more than 50 KB |
| An app dependency is added | any |
| Bytecode over 12 MB, or JS assets over 3 MB | always; `Size-change:` cannot waive these |

A relative growth passes only with all three: a `Size-change: <reason, owner>` line in the PR body, the baseline file updated in the same PR, and the repository owner's label `size:baseline-accepted` (read by the job from the issue events, who applied it). Native size is not claimed here: CI cannot see the native binary; App Store Connect or the thinning report decides (Z-01, Z-04). `--write-baseline` writes the file (bytes and package names only).

## What the founder or Karma does

1. Merge this PR (the check is inert without the job).
2. Run the measure once on CI to get the first baseline: PR 2 adds `docs/ops/size-baseline.json` from that run, pasted, not typed, and re-measures `docs/ops/APP_SIZE.md` (figures there are from 3 Oct).
3. Paste `docs/ops/proposed/workflows/size-gate-step.yml` into `ci.yml` as a job, advisory first. Make it required only on the owner's decision.

## How to verify

- `npx vitest run test/size-gate.test.ts` in `apps/mobile` (7 tests). Mutant: change `>` to `>=` at the bytecode limit and the exact-limit test goes red.
- After the paste: a scratch PR that imports a 200 KB module fails the job (only a person can prove this on GitHub).

## Not verified

The job (never run), whether `tsx` resolves in CI the same as locally, and the first real baseline numbers. If the first run already shows the bundle over a sub-budget, stop and tell the owner (brief section 15).

## The way back

Delete the job. The checker and the tests do nothing on their own.
