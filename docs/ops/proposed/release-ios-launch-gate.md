# Proposal: refuse a release candidate tag unless develop launches green (BL-1480, CR-74)

Status: applied on 22 Nov 2026 in PR #1641 (Karma, CR-73). The patch `docs/ops/proposed/workflows/release-ios-launch-gate.patch` was removed on 27 Nov 2026: it is applied, so it no longer applies; it is at `ba634177` in git history (`docs/ops/proposed/workflows-retired.md`). The section "Require the open line" at the end is a new, unapplied proposal. The text below is the original proposal. Door: two-way (delete the job and the `needs` line).

## Why

An `ios-v*-rc.<n>` tag never moves (ADR 0022), and it starts an EAS production build. CR-74 let app code merge without waiting for the macOS launch check, and made the post-merge launch check a manual run of `iOS compile` on `develop`. Nothing stops an RC tag when that run is red or has never happened. Evidence (22 Nov 2026, `gh api repos/<repo>/actions/workflows/ios-compile.yml/runs?branch=develop`): `ios-compile.yml` has no push trigger, so the only runs on `develop` are `workflow_dispatch` runs; the last three were on 22 Nov, and before them the last was 9 Nov (a failure). A tag cut between dispatches would see no run, or a stale one.

## What changes

`docs/ops/proposed/workflows/release-ios-launch-gate.patch` (one file, `release-ios.yml`):

- New first job `launch-gate` ("launch gate (develop launches green)"), only on a push of a tag containing `-rc.`. Permissions `actions: read` and `contents: read` on the job; no secret, no write. Checkout with full history, then `node scripts/release/launch-gate.mjs --repo "$REPO" --sha "$GITHUB_SHA"`.
- The API call (inside the script): `GET repos/<repo>/actions/workflows/ios-compile.yml/runs?branch=develop&per_page=30`. Pull request runs are ignored. The newest run (by `created_at`) is the one that counts.
- `classify` gets `needs: launch-gate` and runs unless the gate failed. A failed gate skips `classify`, so `checks` and `build` (which need `classify`) never start. Final `ios-v<x.y.z>` tags skip the gate: they already require an RC tag on the same commit.
- The script `scripts/release/launch-gate.mjs` (tested in `scripts/release/launch-gate.test.mjs`) passes only when the newest run has status `completed`, conclusion `success`, and a head commit that is the merge base of the tagged commit and `develop` or a descendant of it (`git merge-base --is-ancestor`). Anything else, and any read error, fails closed.

Failure message (the first line also appears as a `::error::` annotation):

`Release candidate tag refused: <reason>. Run the "iOS compile" workflow on develop (workflow_dispatch), wait for it to finish green, then push a new rc tag number (tags never move).`

Reasons: `no iOS compile run on develop at or after the merge base <sha9>`, `run <id> on <sha9> is <status>, not finished`, `run <id> on <sha9> concluded <conclusion>`, and read failures.

## Decisions for the founder (smallest reversible version chosen)

1. What counts as the gate. Chosen: the whole `iOS compile` run concluding `success` (its `launch` job runs on every dispatch; `compile` is also part of the run). Alternative: read only the `store-profile Release launch` job. Stricter is the safe default for a one-way door.
2. Does an unfinished run block. Chosen: yes (a queued macOS run can take hours, per ci-speed.md section 6, so dispatch early).
3. Manual override. None is built in. The override is the founder's: the existing "by hand only as an exception, approved in writing" path in `docs/ops/RELEASE.md` 3.4, or deleting the job. An input or variable bypass would be a hole in a one-way-door check, so it is not proposed.
4. "At or after the merge base of the tagged commit" is read as: the run's commit is the merge base of the tag and `develop`, or later on `develop`. `release/<x.y>` is cut from `main` and takes cherry-picks, so the tagged commit itself is never on `develop`; the merge base is the nearest shared point.

## Side effect of the `NATIVE_PATHS` change (same PR, BL-1480 scope 1)

The five new build paths now hold a PR on both macOS checks in `merge-queue.mjs`. The `changes` job in `ios-compile.yml` runs the `compile` job only for `modules/`, `app.config.ts`, `apps/mobile/package.json`, `ios/`, `package-lock.json` and the workflow file (and `eas.json` once `ios-compile-eas-json.patch` is applied). For a PR that touches only `metro.config.js`, `store.config.json`, `version.json`, `privacy-manifest.ts` or `permission-copy.ts`, `compile` is skipped and its conclusion is `skipped`; `verdictFor` in the merge table then returns WATCH-RED for that PR, not READY. Two ways out, for Karma: (1) add those paths to the `changes` pattern (same shape as `ios-compile-eas-json.patch`, costs a Debug compile on those PRs); (2) have the table accept `skipped` for the compile check only when the launch check is green. Recommendation: option 2. These paths cannot change the native project, the launch check is the one that reads them, and option 1 spends macOS minutes for no new evidence. Not done here: neither is in the row's scope.

Limits: the gate proves the tip of `develop`, not the tagged commit; and a writer who can push a tag on a branch carrying an edited gate can bypass it, so the `ios-v*` tag ruleset and the `app-store` approval stay the real controls.

## Edges of the wired gate and their tests (BL-1480, BL-1574)

The `launch-gate` job runs `main()`, which reads through `gate()` and decides with `decideLaunchGate`. These rows name the edges that a mutant of the script survived before a test pinned them.

| Failure mode | Result | Test in `scripts/release/launch-gate.test.mjs` |
|---|---|---|
| `runs` is not a list (an object, a string, a number) | refused as no runs, does not throw | `[BL-1480] runs that are not a list` |
| The ancestry answer is not exactly `true` (a truthy string, `undefined` for a run with no `head_sha`, `1`, an object) | refused, "no iOS compile run on develop at or after the merge base" | `[BL-1574] an ancestry answer that is not exactly true refuses` |
| `git merge-base --is-ancestor` fails with an exit code other than 0 or 1 (git uses 128 for a bad object or missing history) | exit 1, "a read failed", not a refusal for the run's order | `[BL-1574] main(): an --is-ancestor read error (git exit 128)` |
| The script path has a space or another character that needs URL escaping, or is reached through a symlink | `main()` still runs, so a refused gate exits 1 (the old entry check skipped `main()` and the job exited 0) | `[BL-1574] main() runs when the script path has a space or is reached through a symlink` |
| `process.argv[1]` is missing, empty or another file | not the entry, `main()` does not run and nothing throws | `[BL-1574] isEntry(): a missing argv[1] or another file is not the entry` |

## Tag equals checked commit (BL-1594, proposal, not wired)

Status: PROPOSED. The pure function exists and is tested; no workflow calls it. Karma applies workflow edits.

Why: the gate above proves the tip of `develop` (a green run at or after the merge base). It does not prove the tagged commit. A fix cherry-picked onto `release/<x.y>` makes a new sha that no `iOS compile` run has seen, and that sha can be tagged.

The check: `decideTagCheckedRun({ tagSha, runs })` in `scripts/release/launch-gate.mjs` passes only when the newest `workflow_dispatch` run whose `path` is exactly `.github/workflows/ios-compile.yml` and whose `head_sha` equals the tagged sha has status `completed` and conclusion `success`. A `pull_request` run does not count: it builds the merge ref, not its `head_sha`, and its `compile` job can be skipped by the paths filter while the run is green. On refusal the message says to dispatch `iOS compile` on the release branch at the commit to be tagged, not on `develop`. Read by the workflow, `runs` would come from `GET repos/<repo>/actions/workflows/ios-compile.yml/runs?head_sha=<tag sha>`, which needs a dispatch of `iOS compile` on the release branch before the tag is pushed.

| Failure mode | Result | Test in `scripts/release/launch-gate.test.mjs` |
|---|---|---|
| Cherry-pick onto the release branch: only the parent was checked | refused, "no iOS compile run checked the tagged commit" | `[BL-1594] a cherry-pick onto the release branch` |
| A moved or re-made tag: runs exist for the old sha only | refused | `[BL-1594] a moved or re-made tag` |
| A run for another workflow on the tagged sha, or a run with no `path` | refused (the run's `path` must be exactly `.github/workflows/ios-compile.yml`) | `[BL-1594] a run of another workflow` |
| A run whose `path` only ends in `ios-compile.yml`, such as `.github/workflows/evil-ios-compile.yml` or `x/ios-compile.yml` | refused, the path must match exactly | `[BL-1594] the path must be exactly .github/workflows/ios-compile.yml` |
| A `pull_request`, `push` or other non-dispatch run on the tagged sha | refused, only `workflow_dispatch` counts | `[BL-1594] only a workflow_dispatch run counts` |
| A run on the tagged sha with no `created_at` | refused, fails closed whatever the list order | `[BL-1594] a run on the tagged sha with no start time` |
| A run on the tagged sha with an empty `created_at` | refused, fails closed whatever the list order | `[BL-1594] a run on the tagged sha with an empty start time` |
| A run still queued or in progress | refused, "is <status>, not finished" | `[BL-1594] a run still queued or in progress` |
| Two runs on one sha, one failed | the newest by `created_at` decides, whatever the list order | `[BL-1594] two runs on one sha: the newest decides` |
| Two runs on one sha with the same `created_at` | the higher run id decides, whatever the list order | `[BL-1594] two runs on one sha at the same created_at` |
| A run whose `head_sha` matches the tag in its first 39 characters but not the last | refused, the sha must match in full | `[BL-1594] a sha that matches the tag in its first 39 characters` |
| `runs` is not a list (an object, a string, a number) | refused as no runs, does not throw | `[BL-1594] runs that are not a list` |
| Red, cancelled, skipped or empty conclusion; missing or malformed tag sha (also when a run carries that same malformed sha) | refused, fails closed | `[BL-1594] a red, cancelled, skipped ...` |
| A green run on exactly the tagged sha | open | `[BL-1594] a green run on exactly the tagged sha opens` |

Cost if wired: one more macOS run per RC (on the release branch), against the EAS and Actions budgets in `docs/ops/RELEASE.md` 3.4. Way back: remove the call; the function stays pure and unused.

## Require the open line (BL-1574 review follow-up, proposal, not applied)

Status: PROPOSED, 27 Nov 2026. Patch: `docs/ops/proposed/workflows/release-ios-launch-gate-output.patch` (one step in `release-ios.yml`). Agent sessions cannot push `.github/workflows/`; whoever applies it uses an account that can, deletes the patch in the same commit and marks this section applied.

Why: the `launch-gate` job passes when `node scripts/release/launch-gate.mjs` exits 0. Before #2100 the script's entry check could skip `main()` (a path with a space, or one reached through a symlink), and then it printed nothing and exited 0, so the job passed without deciding. #2100 fixed that path, and its Review B (note 2) asked for defence in depth: the job should pass only on the line the script prints when the gate is open, so any later way of skipping `main()` fails the tag instead of opening it.

The change: the step's `run:` becomes a block under `set -euo pipefail` that pipes the script through `tee` into `$RUNNER_TEMP/launch-gate.txt` (so the log still shows the line), then requires a whole line matching

`^launch gate open: run [0-9]+ on [0-9a-f]{9} concluded success \(merge base [0-9a-f]{9}\)$`

which is the message `decideLaunchGate` returns when it opens (`scripts/release/launch-gate.mjs` line 35). With no such line the step prints `::error::Release candidate tag refused: the launch gate printed no open line, so it did not decide.` and exits 1. `pipefail` keeps the script's own exit 1 or 2 even when the line is there. Nothing else changes: same job, permissions, token and checkout.

| Script output and exit | Step | Test in `scripts/ci/launch-gate-output-step.test.mjs` |
|---|---|---|
| the open line, exit 0 | passes, line in the log | `the step passes on the open line with exit 0` |
| nothing, exit 0 (`main()` skipped) | refused with the `::error::` line | `refuses: no output and exit 0` and the `::error::` case |
| the refusal, exit 1; the usage line, exit 2 | refused | `refuses: the refusal and exit 1`, `the usage line and exit 2` |
| the open line, exit 1 | refused (pipefail) | `refuses: the open line but exit 1` |
| `tagged commit checked: ...` (BL-1594's line), exit 0 | refused: it is not the launch gate's line | `refuses: the tag-check line` |
| the open line indented, with text after it, a short sha, or `concluded failure` | refused | four `refuses:` cases |

The test reads the `run:` block from the patch itself and runs it under `bash -e` (as the runner does) with a stub `node` on `PATH`; the open line it feeds is built by calling `decideLaunchGate`, so a change to the script's wording fails the test before it can fail a release. Mutants tried on the patch (no pipefail, either anchor dropped, the check skipped, a loose sha, exit 0 on a miss, any conclusion): each fails at least one test. The patched `release-ios.yml` lints clean: `node scripts/ci/workflow-lint.mjs` printed `0 finding(s): 0 pin, 0 prt`.

Coupling: the regex and the script's message must change together. The test above fails when only one of them does. Door: two-way (put back the one-line `run:`). Not verified: not run on a GitHub runner; the test uses the local `bash`.

