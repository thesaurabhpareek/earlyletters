# Proposal: raise the `unit` job timeout from 5 to 10 minutes

Status: proposal, 21 Nov 2026. This pull request changes nothing under `.github/` (OPERATING_MODEL: agents never edit `.github/workflows/`; the founder applies it). The fence (`compliance/FENCE.json`) does not list the workflow, so no CCO approval is needed.

## Problem

Job `unit` ("tests and content rules", `.github/workflows/ci.yml`, `timeout-minutes: 5`) is cut off by its own timeout on loaded runners. Its step "Engine, verifier fuzz, entitlements, analytics, tokens, experiments" takes about 3m25s to 3m30s on a quiet runner (runs 44884829234 and 44886687247). On loaded runners it was cancelled at about 5m06s with the step still running (PR #1242 head 7138edcd, run 44882037339 attempts 2 and 3; job 136815070987 ends mid-run). A timeout shows as `cancelled`, so the aggregate `required` check fails and the merge supervisor is blocked while no test failed.

## Evidence (Actions API, 21 Nov 2026, last 40 runs of ci.yml on develop and PRs)

31 `unit` job executions (job duration = completed_at minus started_at):

- 13 ended `cancelled` at 303 to 317 s (about 5m03s to 5m17s): the timeout signature.
- 2 ended `cancelled` early (48 s, 79 s): superseded by a newer push (concurrency), not timeouts.
- 16 `success`, 182 to 284 s. The slowest success was 284 s, 16 s under the limit.
- Of the 13 timeout-signature runs, 4 are push runs on develop (44894142294, 44891106560, 44889801483, 44888819550), the rest on PRs.

[U] Some of the 13 may be superseded runs that happened to be cancelled after 5 minutes; the API does not say whether a cancel came from the timeout or from concurrency. A cancel landing in a 14 s window just over 300 s for 13 of 13 is strongly the timeout.

## The exact change

One line, in `docs/ops/proposed/workflows/ci-unit-timeout.patch`: `timeout-minutes: 5` becomes `timeout-minutes: 10` on `unit`, with a comment citing the evidence. No action pin or permission changes. Apply with `git apply docs/ops/proposed/workflows/ci-unit-timeout.patch`.

## Risk

- A hung step now burns up to 10 minutes of runner time instead of 5.
- The failure mode stays `cancelled`, so this fix adds nothing to detection of a hang. It only stops healthy but slow runs being killed.
- Real fix for later: split `npm test` so the engine step fits well under 5 minutes on its own (backlog row if wanted).

## Way back

Revert the one line to `timeout-minutes: 5`.
