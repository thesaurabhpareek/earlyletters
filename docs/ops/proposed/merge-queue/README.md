# Proposal: merge-queue fixes (HARNESS-GAPS H4, H5; BRIEF HG-MQ)

Status: proposal, 21 Nov 2026. `scripts/agents/**` needs the security lens (CR-70, CR-73), so the change is a patch file against `develop` (after #1081): `merge-queue.patch` (both `merge-queue.mjs` and `merge-queue.test.mjs`, 76 lines). Nothing under `scripts/agents/` or `.github/` is edited here. The Karma-queue wording and the security-lens check that landed in #1081 are untouched.

## What the patch does

1. `apps/mobile/package.json` joins `NATIVE_PATHS`, as `ios-compile.yml` already treats it. A PR that changes only that file is now held until both macOS checks are green. `apps/mobile/eas.json` stays in the list (CR-69 A9): removing it would loosen the gate.
2. STALE-REVIEW prints `note: #<n> Review <lens> reviewed <sha12>; delta: git diff <sha12> <head12> --stat` (H4 fix 3).
3. Item "a skipped compile check is not a failure" is NOT built, on purpose. A native PR (by the queue's list) whose `compile` job is skipped is either an `eas.json`-only PR (the workflow does not treat it as native) or a PR whose `native files changed?` job failed. Both must stay held, so there is no case left where accepting `skipped` is safe, and a PR the queue does not treat as native never reads those checks. The test `[HG-MQ] an eas.json-only PR with a skipped compile check is WATCH-RED, and so is a skipped compile with a failed changes job` pins this. Question `CI-4` on the PR.
4. The quiet rule (measure quiet from the later of the head date and the last check completion) is a policy; not built, waits for Karma.

## The matching workflow proposal

`docs/ops/proposed/workflows/ios-compile-eas-json.patch` adds `apps/mobile/eas\.json$` to the `changes` job's native filter (`ios-compile.yml:308`). Paste it and an `eas.json`-only PR runs the macOS checks instead of waiting for ever on a skipped one. (Applied: `ios-compile.yml` line 341 lists it on develop at `ba634177`; the patch was removed, see `docs/ops/proposed/workflows-retired.md`.)

## Verdicts before and after (five sample PRs)

| Sample PR | Before | After |
|---|---|---|
| `apps/mobile/eas.json` only | WATCH-RED iOS simulator build (compile skipped) | same, until the workflow patch above is pasted; then it runs and goes READY on green |
| `apps/mobile/package.json` only | READY once reviewed (not native in the queue) while ios-compile still runs | held (WAIT-CI or WATCH-RED) until both macOS checks are green |
| a native module (`apps/mobile/modules/...`) | held until macOS green | same |
| a docs PR | READY | same |
| a stack slice (base is another PR) | OTHER-BASE with `--all-bases` | same |

Live check, 21 Nov 2026: `node scripts/agents/merge-queue.mjs --json` on the 68 open PRs into `develop`, run on develop's file and then on the patched file back to back: no verdict changed (none touches `apps/mobile/package.json` today). An earlier pair of runs, a few minutes apart, differed on about 45 rows; that was GitHub computing `mergeable_state` lazily between runs (STALE-UNKNOWN to DIRTY or NEEDS-REVIEW), not the patch.

## How to apply and verify

```
git apply --check docs/ops/proposed/merge-queue/merge-queue.patch && git apply docs/ops/proposed/merge-queue/merge-queue.patch
node --test scripts/agents/merge-queue.test.mjs     # 52 tests; the 3 [HG-MQ] tests are red on develop's file
```
Read-only is kept: the existing test that the injected api rejects non-GET still passes.

## The way back

`git revert` the commit that applied the patch.
