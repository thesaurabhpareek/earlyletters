# Proposal: CI speed, measured from the Actions and pulls REST APIs

Status: proposal by `ops`. This pull request changes nothing under `.github/` (OPERATING_MODEL line 95): the founder applies the patches in `docs/ops/proposed/workflows/`. Marks: [U] means unverified, an estimate or an assumption, with the reason. Everything else was computed from API data pulled for this document.

## 0. Method and limits

- Window: runs created in the 24 hours before the pull. The API returns at most 1000 results per query, so `CI` and `Compliance fence` were fetched in time slices and merged by run id: CI 1389 runs, Compliance fence 2253, iOS compile 400, Agents check 409, Migration guard 999 and Claude 1000 (both at the 1000 cap [U], the 24 hour count may be higher), Web 241, Web e2e 216, Deploy database 349, deploy scripts 236, Deploy functions 35. `agents.yml` returned 0 runs through the workflow endpoint [U, not investigated].
- Duration is `updated_at` minus `run_started_at` of the run, so it includes time waiting for a runner. A run that was re-run counts once.
- Cancel cause is inferred, the API has no field for it. A cancelled run is "superseded" when a later run (higher id, same event family, same head branch) was created before this one ended (plus 20 s). A job cancelled at 303 to 317 s with the `unit` timeout of 5 minutes is "timeout" (confirmed from the job list for every one of them). The rest is "no successor": a manual cancel, or a closed PR [U, cannot tell which].
- File lists for the "what would a path filter skip" numbers are the final head of each PR, not every intermediate head [U for earlier heads].
- Merge latency uses 349 PRs merged into `develop` in the window, with the check runs of each PR's final head. Time zero is the first check run start on that head, so time spent in review before the last push is not in it.

## 1. Headline findings

1. The CTO hypothesis that labels, edits and ready-for-review cancel `CI` runs is not supported. `ci.yml` has `on: pull_request` with no `types:`, which defaults to `opened`, `synchronize`, `reopened`. Of 1389 CI runs, 1386 are distinct head shas; only 3 runs repeat a head. The 548 superseded CI cancellations are new pushes (restacks, fixes). The same holds for iOS compile (1 repeat head in 400). Only `Compliance fence` listens to `labeled`, `unlabeled`, `edited`, `ready_for_review`.
2. The macOS lane is the slow one, and it is capacity, not duplicates. The plan gives exactly 5 concurrent macOS jobs (observed maximum: 5, held for most hours; `ios-compile.yml` says the same in a comment). A successful launch job waits a median 51.7 min (p90 154.8, max 277.7) for a runner and then builds in a median 21.6 min (p90 27.0). Up to 41 jobs waited at once.
3. That macOS wait does not gate a merge, by rule: the launch check is a watch item (COORDINATION.md; CR-73), and branch protection requires only `applied migrations unchanged`, `required`, `compliance-fence` (read from the API: strict is false). Of 90 merged PRs with a launch check on their head, 31 had a successful result before merge, 38 merged while it was still queued or running, 20 only had cancelled runs, 0 had a failure. It costs queue time for the PRs where it does gate (native paths: 4 of 400 runs), and it keeps the 5 macOS lanes full.
4. The Linux pool is saturated at peaks, and the 10 second compliance-fence job pays for it. In 180 sampled fence runs the job itself ran a median 10 s (p90 14 s) but waited a median 29 s and p90 1660 s (27.7 min), max 2924 s (48.7 min) for a runner. The slow hours were around 00:00 to 01:00 UTC and 08:00 UTC (medians 26 to 39 min in those hours).
5. 63 percent of merged PRs (221 of 349) change only docs, agents or markdown files, and each still runs 7 Linux jobs (about 8.9 runner minutes at the medians below). A conservative subset of those, 101 of 349 (29 percent), touches only paths no test reads and can skip the heavy jobs (change 1).
6. `unit` timeouts: 17 CI runs in the window ended with `tests and content rules` cancelled at 305 to 317 s (14 on pull requests, 3 on push runs to `develop`); each one turned `required` red with no test failing. The change to 10 minutes is merged (#1302, on `develop`), so the 5 minute timeouts should stop. The latest one in the window was at 15:52 UTC, a push run; whether it was before #1302 took effect I did not check [U].

## 2. Per workflow, last 24 hours

Durations in minutes. "ok+fail" is runs that ended `success` or `failure`; "all done" adds cancelled ones (not skipped).

| Workflow | Runs | Success | Failure | Cancelled | Median ok+fail | p90 ok+fail | Median all done | p90 all done |
|---|---|---|---|---|---|---|---|---|
| CI | 1389 | 794 | 22 | 568 | 7.2 | 28.4 | 5.5 | 24.8 |
| Compliance fence | 2253 | 987 | 110 | 1156 | 0.6 | 26.6 | 0.3 | 16.5 |
| iOS compile | 400 | 148 | 0 | 250 | 76.6 | 175.3 | 31.8 | 137.4 |
| Agents check | 409 | 390 | 19 | 0 | 1.0 | 7.2 | 1.0 | 7.2 |
| Migration guard (capped) | 999 | 996 | 3 | 0 | 1.5 | 9.1 | 1.5 | 9.1 |
| Web | 241 | 195 | 0 | 46 | 3.0 | 10.3 | 2.5 | 9.8 |
| Web e2e | 216 | 160 | 2 | 53 | 6.0 | 12.8 | 5.0 | 12.1 |
| Deploy database | 349 | 343 | 0 | 5 | 0.5 | 8.4 | 0.5 | 9.1 |
| deploy scripts | 236 | 236 | 0 | 0 | 3.0 | 9.8 | 3.0 | 9.8 |
| Deploy functions | 35 | 25 | 0 | 8 | 1.1 | 8.9 | 2.7 | 37.3 |
| Claude (capped) | 1000 | 0 | 0 | 0 | n/a | n/a | n/a | n/a |

Still running or pending at the pull: CI 5, iOS compile 2, Deploy database 1, Deploy functions 2. Claude: all 1000 runs `skipped` (994 issue_comment, 6 issues); a skipped job needs no runner.

CI and iOS compile percentages differ from the CTO sample (500 runs, since 00:00): the sample was a different window.

## 3. Cancellations, by cause

| Workflow | Cancelled | Superseded by a newer run | `unit` timeout | No successor (manual or closed PR) [U] |
|---|---|---|---|---|
| CI | 568 | 548 | 17 | 3 |
| Compliance fence | 1156 | 1119 | 0 | 37 |
| iOS compile | 250 | 217 | 0 | 33 |

Notes.
- CI: 1042 of the 1389 runs are pull_request runs, for 401 distinct branches: median 2 runs per PR, p90 5, max 17. A superseded CI run had run a median 1.9 min when cancelled; the 568 cancelled runs burned 3123 minutes of wall clock in total (runner minutes are lower, jobs overlap). This is the push rate, not a trigger problem.
- iOS compile: the 33 no-successor cancels ran 14 to 310 min (including queue), I could not confirm any of them as the 120 minute job timeout [U]. All launch jobs of the 24 ran-then-cancelled group had run a median 9.5 min (p90 23.6) before the cancel: 272 runner minutes, 7.7 percent of the 3555 macOS runner minutes used. 223 launch jobs were cancelled before ever getting a runner (median 14.3 min queued, p90 94.5): nothing ran, so no runner minutes lost.
- Queued runs for superseded heads: 0 at each of 4 snapshots (01:00, 03:00, 05:00, 08:00 UTC; 24 to 38 jobs waiting each time). The concurrency group `ios-compile-<pr>` with `cancel-in-progress: true` already cancels a queued run the moment a newer head arrives. Change 4 of the brief is therefore already in place, there is nothing to patch.
- The Debug `iOS simulator build (no signing)` job did not run once (329 skipped by the `changes` job, 69 cancelled with their run). The launch job is the only macOS consumer.

## 4. Which events start duplicate runs

| Workflow | `on:` | Concurrency group | cancel-in-progress | Effect |
|---|---|---|---|---|
| `ci.yml` (name `CI`) | `pull_request` (defaults: opened, synchronize, reopened), `push` to develop and main | `ci-<pr number or ref>` | true on pull_request only | New head cancels the old run. Labels, edits, ready_for_review do not start it. |
| `compliance-fence.yml` | `pull_request_target` types opened, synchronize, reopened, edited, labeled, unlabeled, ready_for_review | `compliance-fence-<pr number>` | true | Every event cancels the previous run. |
| `ios-compile.yml` (name `iOS compile`) | `pull_request` with `paths:` (apps/mobile/**, packages/**, package-lock.json, the workflow, sim-crash-report.sh), `workflow_dispatch` | `ios-compile-<pr or ref>` | true | New head cancels; queued run cancelled too. |
| `agents.yml` | `schedule` (17 and 47 past each hour), `workflow_dispatch` | none | n/a | No PR trigger, nothing to deduplicate. |
| `agents-check.yml` | `pull_request` and `push` with `paths:` | none | n/a | 409 runs, none cancelled, 19 failed. |

Compliance fence in detail. 808 of 2253 runs (36 percent) are an extra run on a head that already had one. Runs per head: 951 heads one run, 256 two, 173 three, 54 four, 11 five. 585 of the 808 start within 10 s of the previous run on that head: a PR opened and then given its labels (`agent:<handle>`, `from:agent`), one event per label. The 1156 cancelled runs ran a median 8 s (p90 298 s, 488 of them 5 s or less; 234 lasted 60 s or more, that is, waited for a runner and were then cancelled). The 110 failures (110 distinct heads, none later green on the same head) were checked on a sample of 40: all 40 say `no cco approval for head SHA`. That is the fence working (a protected-path PR waits for the CCO approval), not a defect. Fence run time when it succeeds is not the problem, the queue wait for a runner is (finding 4). The label events cannot be dropped without risk (see change 5).

## 5. iOS compile: queue wait against build time (launch job, `macos-26`)

| Measure | Value |
|---|---|
| Launch jobs | 398 (2 still running) |
| Got a runner | 175: 149 success, 24 cancelled mid-run, 2 running |
| Cancelled while queued | 223 |
| Success: wait for a runner (job created to first step) | median 51.7 min, p90 154.8, max 277.7 |
| Success: build and launch (first step to done) | median 21.6 min, p90 27.0 |
| Success: created to done | median 76.6 min, p90 179.4 |
| Maximum macOS jobs running at once | 5 |
| Maximum macOS jobs waiting at once | 41 |
| macOS runner minutes used | 3555 (3272.5 in successful runs) |
| Successful runs per distinct PR branch | 149 runs served 110 of the 130 branches that had a run; 399 distinct heads, so 37 percent of heads got a result |

All 5 runners were in use at the same time in every hour from 23:00 to 11:59 UTC, and in every hour from 00:00 to 10:59 UTC at least 18 jobs waited at some moment (peak 41). Capacity at 21.6 min a run on 5 runners is about 13.9 runs an hour; 149 successful runs came out of 399 heads.

What a path filter removes (final-head file lists, [U] for earlier heads). Of 130 PRs with a run, 42 (32 percent) changed no file that can reach the launched bundle (docs, tests, e2e, `packages/emails`), 13 changed only `packages/content` (that ships in the bundle, so it stays), 1 touched native paths (`apps/mobile/ios`, `modules`, `app.config`, `eas.json`, lockfile). Those 42 PRs account for 83 of the 400 runs (21 percent; 43 successful, 40 cancelled) and 1079 of the 3555 macOS runner minutes (30 percent).

## 6. Share of merge latency, by required check

349 PRs merged into develop. From the first check run start on the final head to merge: median 23.2 min, p75 53.1, p90 259.6.

| Required check | Median first green after first start | p90 | Last of the three to go green |
|---|---|---|---|
| `applied migrations unchanged` | 0.3 min | 3.9 | 0 PRs |
| `required` (CI) | 5.9 min | 26.4 | 297 PRs (85 percent) |
| `compliance-fence` | 0.4 min | 26.6 | 52 PRs (15 percent) |
| All three green | 6.0 min | 30.5 (p75 17.1) | n/a |

After all three were green, the wait to merge (reviews, queue, the merge itself) was a median 10.8 min, p75 37.3, p90 253.9. Per PR the checks are a median 39 percent of start-to-merge time; the rest is review and the merge queue. `required` is the check that gates in 85 percent of cases, and 124 of 349 (36 percent) were more than 10 minutes to first green on it, 58 more than 20 minutes. The fence reached green late for 152 PRs that carry more than one fence run on the head (relabeling), and with the long runner waits of finding 4. The launch check is no required check, so its share of merge latency is 0 by construction; for native-path PRs it is the full queue wait above.

Where CI time goes (200 completed pull_request CI runs sampled, every third): install 19 s median run, p90 queue 436 s; `tests and content rules` 216 s run (p90 263), queue median 90 s, p90 607 s; `database rules` 168 s; typecheck 55 s; edge functions 29 s; seam guard 42 s (p90 225 s). The last job to finish: `tests and content rules` in 134 of 200 runs (67 percent), database rules 26, seam guard 25, typecheck 10, functions 5. In one inspected successful run the engine step was 192 s: content rules 7 s, `apps/mobile` vitest 142 s (352 files), the other workspaces and `node --test` scripts about 45 s.

## 7. Ranked changes

Ranked by measured effect, then risk. Patches: `docs/ops/proposed/workflows/`. Each was linted: `node scripts/ci/workflow-lint.mjs <scratch copy>` printed `0 finding(s): 0 pin, 0 prt` and exit 0 for `ci-docs-lane` (ci.yml), `ios-compile-paths` and `ios-compile-batch` (ios-compile.yml, the second stacked on the first). The lint checks only sha pins and `pull_request_target`; it does not validate the logic.

### Change 1: docs lane in CI (`ci-docs-lane.patch`)

- What: the `install` job gets a `scope` step that lists the PR's files through the API and sets `heavy=false` only if every file is on an inert list (docs that no test or script reads: `docs/engineering/readiness-20nov/`, `docs/agents/checkins/`, `docs/product/instrumentation/`, `docs/product/P0-*`, `READINESS-*`, `PERMISSIONS-*` markdown, `docs/content/lifecycle-playbook/`, `docs/qa/test-plan-b13/`, `docs/design/DESIGN-*.md`). The jobs `unit`, `db`, `functions`, `typecheck`, `seam-guard` get `if: needs.install.outputs.heavy == 'true'`. A new job `content` always runs `npm test -w @scribe/content`, which holds the content rules and `no-real-family-data.test.ts` (that test reads every tracked file, so the privacy guard still runs on every PR). `required` still runs (`if: always()`), accepts `skipped` only when `heavy` is `false`, and fails on `failure` or `cancelled` as before.
- Branch protection does not hang: no job is removed and no workflow is path-filtered. The required context `required` is always reported by the same workflow. (This is the reason `seam-guard` already sits inside `ci.yml`; see its comment.)
- Fail-safe: a push event, an API error, an empty list, 3000 or more files, or one file off the list gives `heavy=true`.
- Measured: 101 of 349 merged PRs (29 percent) match the list. Heavy jobs removed per matching run: 5 of 7, about 8.5 of 8.9 runner minutes at the medians in section 6.
- Estimated [U]: if the same 29 percent applies to the 1042 pull_request CI runs, about 300 runs a day skip the heavy jobs (about 2500 Linux runner minutes a day), and `required` goes green in about 1 to 2 minutes for them instead of a median 5.9. The relief to the shared Linux pool (finding 4) is the larger prize but cannot be measured before it is tried.
- Wider list [U, needs a per-folder check first]: `docs/product/prd` (208 file touches) is read by `scripts/trace.mjs` and `docs/BACKLOG.md`, `docs/agents/**`, `docs/analytics/instrumentation` and `docs/tdd/new-scope` are named in code or tests; each needs the reader checked before it is added.
- Risk: a test or guard that reads a listed document. Checked by grep for each listed folder (mentions found only in comments, plus `docs/agents/checkins/S20.md` as test data in `seam-guard.test.mjs`); `no-real-family-data` is kept by the `content` job. The `scope` step makes one API call; `pull-requests: read` is added at job level for it.
- Test on a branch: one draft PR that edits only a file under `docs/engineering/readiness-20nov/` (expect jobs skipped, `required` success); one that adds a file under `docs/BACKLOG.md` or `packages/` (expect all jobs); one that edits `ci.yml` itself (expect all jobs and the seam guard). The patch was dry-run applied with `git apply --check`, and the `scope` script was run with a stub `gh` on six cases: two inert files gave `heavy=false`; inert plus `docs/BACKLOG.md` gave `true`; a `P0-` file gave `false`; an empty list gave `true`; a push event gave `true`; inert plus `.github/workflows/ci.yml` gave `true`.
- Way back: `git apply -R docs/ops/proposed/workflows/ci-docs-lane.patch`.

### Change 2: path filter for iOS compile (`ios-compile-paths.patch`)

- What: the `pull_request` `paths:` list gets negated patterns: `**/*.md`, `apps/mobile/e2e/**`, `e2e-web/**`, `web-preview/**`, `apps/mobile/test/**`, `apps/mobile/vitest*.ts`, `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`, `packages/*/test/**`, `packages/emails/**`. A PR touching only those starts no iOS compile run. Grep found no import of `test`, `e2e`, `e2e-web`, `web-preview` or `@scribe/emails` from `apps/mobile/src` or `app.config.ts`.
- Branch protection does not hang: neither `iOS simulator build (no signing)` nor `store-profile Release launch` is a required status check (branch protection: `applied migrations unchanged`, `required`, `compliance-fence`), and `merge-queue.mjs` applies the macOS rule only to native paths, which stay in the list. A run that never starts is the same as the 329 Debug jobs that are skipped today.
- Measured: 42 of 130 PRs, 83 of 400 runs (21 percent), 1079 of 3555 macOS runner minutes (30 percent) belong to PRs that touch no runtime path (final-head lists). About 83 fewer runs a day on a lane that has a queue about 11 hours of the day.
- Effect on the queue wait: not computable from the data (the wait depends on arrivals during busy hours) [U]. Removing 21 percent of runs and 30 percent of runner minutes from a saturated 5-lane queue shortens the wait; I will not put a number on it.
- Risk: low. A `.md` or test-only PR no longer gets the launch result it did not need. A mislabeled runtime file (for example a `.test.ts` that is imported by the app) would skip; none found.
- Test: a draft PR that edits only `apps/mobile/README.md` (expect no iOS compile run), one that edits a file in `apps/mobile/src` (expect a run).
- Way back: `git apply -R docs/ops/proposed/workflows/ios-compile-paths.patch`.

### Change 3: one launch run per batch of merges (`ios-compile-batch.patch`, applies on top of change 2)

- What: a pull request starts the macOS workflow only on native paths (the `NATIVE_PATHS` of `scripts/agents/merge-queue.mjs` plus the workflow and the simulator script). Every other mobile or package change is launched on `push` to `develop` with the path list of change 2. The concurrency group is the same, with `cancel-in-progress` true only for pull_request: on `develop` one run runs, one is pending, and a newer pending run replaces the older, so a burst of merges is covered by one run on the newest head. The `changes` job computes `native` from `before...sha` on a push, so the Debug compile also stays native-only there.
- Why it is credible: of 90 merged PRs that had a launch check, 31 had a result before merge and 38 merged while it was queued or running, so for most PRs the per-PR launch is already not what decides the merge. The launch is a watch item by rule (COORDINATION.md; CR-73).
- Measured: only 4 of the 400 runs in the window were for a native-path PR. The macOS runs from pull requests drop to about that share. The develop lane is serial, at most about 65 runs a day at 22 minutes a run (derived from 24 h divided by build plus checkout, a ceiling [U]), against 3555 macOS runner minutes used today, so at most about 1400.
- Gives: the native-path PRs, where the launch does gate, stop queueing behind 40 jobs (their wait should fall toward the build time, 21.6 min median [U]).
- Risk: medium. A crash at launch from app code is found after merge on `develop`, not before. Mitigations: `kill-harness.yml` runs the release-launch check too; the batch run is a red or green on `develop` that `ops` reads every run. A founder or CTO call, because it moves where a check reports. It does not change a required check.
- Test: apply on a branch of a fork or a throwaway branch name, run `workflow_dispatch`, then a merge to a test base [U: `push` on `develop` can only be exercised on `develop`; rehearse with a temporary `branches:` entry for the branch].
- Way back: `git apply -R` the batch patch, then (optionally) the paths patch.

### Change 4: cancel queued iOS runs for superseded heads: already in place

- `ios-compile-<pr>` with `cancel-in-progress: true` cancelled 217 runs (87 percent of the cancels) and the 4 snapshots found 0 queued jobs with a newer head behind them. No patch. The 223 jobs cancelled in the queue ran no minutes. The only thing left to cancel is the 24 jobs cancelled after they started (272 runner minutes), which a path filter reduces.

### Change 5: compliance-fence duplicates: do not patch the triggers

- 1156 of 2253 runs were cancelled and 808 are extra runs on a seen head, but the median cancelled run ran 8 s, and the first green is a median 0.4 min. The wait that matters (p90 27.7 min) is queue time for a runner, which changes 1 to 3 address.
- Trap, not patched: a job-level `if:` that skips the fence for unrelated labels reports a `skipped` check on that head, and a skipped check run satisfies a required status. A label event after a failed run (no CCO approval) would turn the head green without the fence running. A step-level early exit saves nothing, the runner is already taken.
- Cheaper: have the harness create PRs with the `agent:<handle>` and `from:agent` labels in the creating call where the API allows [U: each label still emits one `labeled` event]. Not measured; low value.

### Change 6: a larger or additional macOS runner (spend: founder decision)

- Facts: the repository is public and owned by a User account; standard GitHub-hosted runners are free; the macOS limit is 5 concurrent jobs (observed 5). Larger hosted runners need an organization on a paid plan, and the macOS concurrency limit and prices of larger runners are not something I could verify from here (docs.github.com is not reachable from this session) [U]. I have no price to give and will not invent one.
- Numbers that bound it: demand was 3555 macOS runner minutes in 24 h on 5 lanes (up to 7200 available), queued about 11 hours (00:00 to 10:59 UTC); builds take a median 21.6 min. A runner that builds twice as fast [U] would halve the build part but not the 51.7 min wait unless lanes rise too. A self-hosted Mac would lift the cap but a self-hosted runner on a public repository needs care with who can trigger it.
- Recommendation: decide after changes 2 and 3 are measured; they remove 30 percent and then most of the PR demand without spend.

### Change 7: split the slow `unit` engine step (no patch)

- The 10 minute timeout (#1302) is on `develop` and not duplicated here. `unit` is the last job in 67 percent of runs; its engine step is about 192 s, `apps/mobile` vitest 142 s of it (one run's log). Splitting `apps/mobile` vitest into two shards (`vitest run --shard=1/2` and `2/2`) in two jobs would take about 142 s toward 70 to 80 s [U, not run]; the gain on the critical path is capped by the next job, `database rules`, 168 s median, so about 48 s a run, and each shard adds job slots to a saturated pool and about 20 s of setup. Ranked last, no patch: measure first on a branch with `ci-timing.mjs`.

## 8. Order I would apply them

1. Change 2 (smallest, lowest risk, measured).
2. Change 1 (largest Linux relief; try on the draft PRs listed).
3. Change 3 after the CTO agrees where the launch check reports.
4. Re-pull the same numbers (this document's method) and only then bring change 6 to the founder.

## 9. Not changed

Agents check, Migration guard, Web, Web e2e and the deploy workflows: no defect found in the window beyond Web and Web e2e being cancelled by supersession (46 and 53 runs, all superseded; Web e2e also had 2 failures, not looked at). Fence 110 failures are by design (finding in section 4).
