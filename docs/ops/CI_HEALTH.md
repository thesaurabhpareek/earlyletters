# CI health report

Owner: `ops`. Written in run `sess-202610031917`; refreshed after the red-team review in run `sess-202610032046`.

- **As of:** 2026-10-03 20:49:25 UTC. Ops re-pulled every run and job for this refresh; the first version used a 19:31:19 UTC snapshot of 104 runs.
- **Window:** every GitHub Actions run in the repository. The first was created at 07:41:11 UTC (the push of commit 3bf45a0 that added CI) and the last at 20:47:15 UTC. That is 162 runs over 13 h 06 min, all on 3 Oct 2026. None was running at the snapshot.
- **Source:** REST only.
  - `gh api 'repos/thesaurabhpareek/earlyletters/actions/runs?per_page=100'` (all pages);
  - `.../actions/runs/<id>/jobs?filter=latest` for every run;
  - `.../actions/workflows`;
  - `.../actions/jobs/<id>/logs` for the failed jobs and both Security jobs;
  - `.../check-runs/<id>/annotations` for warnings;
  - `.../events` for branch pushes (section 3.1);
  - `.../pulls/<n>` for merge state, polled at about 20:55 UTC.
- **Durations:** a run lasts from `run_started_at` to `updated_at`, so queue time is included. Job time is `started_at` to `completed_at`. Queueing is a job's `created_at` to `started_at`.

## Summary

- **develop is green.** All 4 pushes to develop passed CI and the migration guard. The tip is now 7cc43b1 (20:43 UTC), which merged the 3 Oct wave and added a sixth CI job, `functions`.
- **Two checks have failed, both deterministically. No flakes were found.**
  - The secrets scan failed once, on PR #30 at 76c1f26. The 3 findings were not in PR #30: they were fictional test fixtures on another branch, `auto/2026-10-03-wave`, which the scan read because it checked out every branch (section 3.1, verified). PR #30's next run passed.
  - Those fixture commits are now on develop. With PR #30's current scan settings, every PR would report 5 findings once #30 merges. `security` should fix the scan scope and the allowlist before #30 merges.
  - The migration guard on release PR #2 has failed twice, at 3688796 and 7cc43b1, on the same applied migration. PR #30 carries the reviewed exception.
- **Six CI runs were cancelled.** Each was superseded by a newer push to the same PR, so none is a failure.
- **PR #30 has no checks at its head (ea0affb).** It is in conflict with develop, and GitHub does not run `pull_request` workflows on a conflicting PR. After the 20:43 merge, 11 open PRs are in conflict with their base.
- **Speed.** A green CI run takes 1m 36s at the median and 3m 48s at the longest, against the 10-minute budget in `.github/README.md`. The `database rules` job is the critical path, and it grew to 96 to 103 s on runs that include the new develop.
- **Cost.** 182.2 job-minutes were used, which is free on this public repository (cited in section 5). The same work on a private repository would bill 522 minutes.
- **Nothing is enforced yet.** Neither `main` nor `develop` has branch protection, and the repository has no rulesets. Every check is advisory.

## 1. Per workflow

| Workflow | Where the file lives | Runs | Success | Failure | Cancelled | Running | Median | Longest |
|---|---|---|---|---|---|---|---|---|
| CI | `ci.yml` on develop | 73 | 67 | 0 | 6 | 0 | 1m 36s | [3m 48s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37137050922) |
| Migration guard | `migration-guard.yml` on develop | 73 | 71 | 2 | 0 | 0 | 0m 11s | [0m 50s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37148150481) |
| Agents check | `agents-check.yml`, only in PR #4, #39, #42 | 13 | 13 | 0 | 0 | 0 | 0m 10s | [0m 14s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37131011601) |
| DB CLI | `db-cli.yml`, only in PR #36 | 1 | 1 | 0 | 0 | 0 | 3m 04s | [3m 04s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37136106966) |
| Security | `security.yml`, only in PR #30 | 2 | 1 | 1 | 0 | 0 | 0m 18s | [0m 18s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37148365890) |

- The median and longest columns cover completed runs, including cancelled ones.
- Counting only the 67 green CI runs: median 1m 36s, shortest 1m 02s, longest 3m 48s.
- The longest migration guard run (PR #37) spent 38 s of its 50 s waiting for a runner.
- Three workflows exist only on PR branches. In this window each ran only on the PRs that carry it, so they will run on every PR only after they merge.

### CI jobs (successful jobs only)

| Job | Median | Longest | Note |
|---|---|---|---|
| install | 15 s | 44 s | `npm ci` ran in only 10 of 73 install jobs. The rest restored `node_modules` from cache. |
| tests and content rules | 24 s | 48 s | |
| database rules | 66 s | 103 s | Critical path. The test step averages 51 s over the window, but took 81 to 88 s on the three runs that include develop at 7cc43b1, which added four migrations. |
| edge functions and ops scripts (Deno) | 25 s | 27 s | New in develop's `ci.yml` at 7cc43b1. Three runs so far. |
| typecheck | 26 s | 61 s | |
| required | 3 s | 6 s | |

**Queueing.** Runner pickup took 2 s at the median, 3 s at the 90th percentile and 70 s at most, measured over 374 jobs in completed CI runs.
- Six runs superseded a cancelled run. Four of them waited 22 to 102 s for the cancelled run to finish cancelling; the other two waited 1 s and 12 s.
- The longest run (3m 48s) is one of the four. It waited 1m 42s before its first job, then 38 s for a runner for `required`.
- Its critical-path jobs took about 1m 23s: install 12 s, database rules 69 s, required 2 s.

## 2. develop and PR heads

### develop

| Event | Workflow | Runs | Result | Median | Longest |
|---|---|---|---|---|---|
| push | CI | 4 | 4 success | 1m 36s | 2m 23s |
| push | Migration guard | 4 | 4 success | 0m 10s | 0m 12s |
| pull_request, release PR #2 (develop into main) | CI | 2 | 2 success | 2m 05s | 2m 33s |
| pull_request, release PR #2 | Migration guard | 2 | **2 failure** (section 3.2) | 0m 11s | 0m 13s |

- The develop tip is 7cc43b1, pushed at 20:43 UTC. It merged the 3 Oct wave: commits 9be06db and 5452c7a from branch `auto/2026-10-03-wave`, plus a66376a, 549 files in all.
- Its CI run took 2m 23s with six jobs. Develop and PR #2 runs used 17.7 job-minutes in total.

### PR heads (every pull_request run whose head is not develop)

- **Totals:** 150 runs across 27 PRs. 143 succeeded, 1 failed (Security on PR #30 at 76c1f26), and 6 were cancelled after being superseded. They used 164.5 job-minutes.
- **Latest result at each open PR head, at the snapshot:**
  - all workflows green: #1, #3, #4, #25 to #29, #31 to #42, #44 to #47, #49 and #50;
  - #2: CI green, migration guard failed;
  - #30: no run at its head, ea0affb. Its previous head, 69a425e, was green in all three workflows, Security included;
  - #48: no run had been created at its head, 193a095.
- **In conflict with their base after the 20:43 merge** (GitHub `mergeable_state` is `dirty`): #26, #27, #28, #29, #30, #31, #32, #34, #37, #46 and #49.
  - Their green checks were computed against the old develop.
  - GitHub's docs: "Workflows will not run on `pull_request` activity if the pull request has a merge conflict" ([Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). Each needs a rebase or merge before its checks run again.

## 3. Failures and cancellations

### 3.1 Security, `secrets (full history)`, PR #30 at 76c1f26 (fictional fixtures from another branch; now on develop)

- **Run and job:**
  - [run 37133196268](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37133196268), event `pull_request`, created 15:25:35 UTC;
  - [job 111232279648](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37133196268/job/111232279648), step `Scan every commit`, PR #30 head 76c1f26 merged into develop 3688796 (merge ref b0314ed).
- **What the log says:** gitleaks 8.30.1 with `--redact`: "28 commits scanned", "leaks found: 3", exit code 1. The log names no file or rule, because the job prints no report.
- **Cause (verified in the job log):**
  - The checkout (`fetch-depth: 0`) fetched `+refs/heads/*`: 15 branches, listed on log lines 104 to 118. Line 105 is `auto/2026-10-03-wave`.
  - The scan step ran `gitleaks git` with no `--log-opts`, so it read every fetched branch, not only develop and PR #30.
- **Which ref (verified):**
  - The Events API shows `auto/2026-10-03-wave` created at 14:27:48 UTC and its next push at 19:02:04 UTC, from 9be06db to 5452c7a. So at 15:25 its tip was 9be06db, a commit whose parent is develop's 3688796.
  - Ops reran the scan locally: gitleaks 8.30.1 (the tarball's SHA-256 matches the workflow's pin), PR #30's `.github/gitleaks.toml` (unchanged from 76c1f26 to ea0affb), `--redact`, over `3688796..9be06db`. It finds 3, all in 9be06db:
    - `apps/mobile/test/auth-links.test.ts:8` (generic-api-key);
    - `apps/mobile/test/invite-link.test.ts:16` (generic-api-key);
    - `supabase/functions/_shared/log/canary.ts:23` (jwt).
  - The red-team review of this PR found the same three. So the findings never came from PR #30.
- **What they are:** test fixtures and the log scrubber's canary, by their paths. The red-team review reports that they are fictional "Asha" fixtures and that the canary JWT is not a live credential. Ops did not read the values. `security` should confirm.
- **The second run passed:**
  - [run 37148365890](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37148365890), PR #30 at 69a425e, 19:34 UTC.
  - Commit 69a425e sets `SCOPE: HEAD` on `pull_request` and `--all` on push and schedule.
  - That run scanned 15 commits and found no leaks.
- **Now on develop:**
  - Develop's tip 7cc43b1 (20:43 UTC) contains 9be06db and 5452c7a.
  - The same local scan over `origin/develop` finds 5: the 3 above, plus 2 in 5452c7a, both generic-api-key:
    - `supabase/functions/purge-worker/test/handler.test.ts:9`;
    - `supabase/functions/purge-worker/test/helpers.ts:24`.
  - Develop at 3688796 plus PR #30's head scans clean.
- **Impact:**
  - On a pull request, `HEAD` is the merge commit, whose history includes all of develop. So PR #30's own Security job should report these 5 once #30 is updated onto develop. After #30 merges, so would every PR, every push and the weekly scan. This is a prediction from the local scan; no CI run has shown it yet (Unverified).
  - It does not block merging today, because Security is not in `required`.
- **Fix (for `security`, BL-117; the founder applies it, because agents cannot edit `.github/`):**
  - On `pull_request`, scan only the PR's own commits: `--log-opts` with the PR's base and head SHAs (`<base>..<head>`) instead of `HEAD`.
  - Keep the full-history scan on push and schedule, and allowlist the fixture paths or the exact fixture values in `.github/gitleaks.toml`, each with a reason, as the file already does for prompt keys.
  - Confirm that none of the five is a live credential. If one is, the response is in SECRETS.md and INCIDENT.md (in PR #35).

### 3.2 Migration guard, `applied migrations unchanged`, release PR #2 (real, expected, repeats until fixed)

- **Runs:**
  - [run 37109089140](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37109089140), head 3688796, 08:15 UTC;
  - [run 37152567876](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37152567876), head 7cc43b1, 20:43 UTC.
  - Both fail at step `Compare with the base`, with base `origin/main`.
- **What the log says, both times:** "20261001000000_scribe_hardening.sql: edited, but it has been applied. Write a new migration instead."
- **Cause:** commit 3730551 (2 Oct, before the guard existed) changed that file on develop.
  - It added a comment recording the apply.
  - It moved the entries policy merge into a new migration, `20261002010000_entries_select_policy.sql`.
  - `main` still has the earlier version, so every run of PR #2 compares against it and fails. The guard is working as designed.
- **Real or flaky:** deterministic. The develop pushes of the same commits passed, because those runs compare against the previous develop commit, not against `main`.
- **Fix in flight:** PR #30 adds a reviewed exception (`.github/migration-exceptions.txt`) for exactly this file at blob `fab49f91bb93`.
  - That blob still matches develop at 7cc43b1: ops re-ran `git rev-parse origin/develop:supabase/migrations/20261001000000_scribe_hardening.sql`.
  - PR #30 is in conflict with develop and has an open "fix first" red-team verdict. The merge order is in RELEASE_READINESS.md section 5.
- **Also new on develop:** four pending migrations (`20261004*`). Develop has 11 migration files, and 2 are listed in `.github/migrations-applied.txt`.
- **Unverified:** whether develop's version of the file is exactly what is live in the database. Ops never reads remote databases; the file comment and the commit message say it is.

### 3.3 Cancelled runs (not failures)

| Run | PR | Superseded by |
|---|---|---|
| [37137027317](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37137027317) | #38 ab6e240 | b97cc88, 25 s later |
| [37138368995](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138368995) | #41 0356433 | e1c8c2e, 51 s later |
| [37138421941](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138421941) | #41 e1c8c2e | 7051dcc, 56 s later |
| [37138481030](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138481030) | #41 7051dcc | 001c50f, 77 s later |
| [37149377711](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37149377711) | #4 c537d1f | 7eb9289, 86 s later |
| [37150960677](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37150960677) | #4 8b49829 | fe60567, 17 s later |

- The `ci-<PR>` concurrency group cancels in-progress PR runs, as designed.
- In 5 of the 6, `required` ran anyway (`if: always()`) and reported failure. So a superseded commit shows a red mark, but only the PR head counts.
- In run 37149377711, every job, `required` included, had already passed; the run is still marked cancelled.
- Keeping `always()` costs one short job per cancellation and is the safe choice, so ops proposes no change.

### 3.4 Flakiness

- No workflow had both a failure and a success for the same event, branch and commit.
- No run was re-run: every run is attempt 1.
- The sample is one day, so this is a baseline, not a verdict.
- **Watch item:** PR #30's body reports that the `perf.test.mjs` p95 budgets fail intermittently on a loaded local machine. In CI, `database rules` passed in every completed run in the window, including the slower runs after 7cc43b1.

## 4. Warnings on every run (not failures)

Source: the annotations on [run 37152565885](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37152565885), the latest develop CI run (7cc43b1).

- **Node 20 actions.** Each CI job that uses `actions/checkout@v4`, `actions/setup-node@v4` or `actions/cache@v4` warns: "Node.js 20 is deprecated", and the actions are forced onto Node.js 24. That is 5 warnings per CI run now, one more for the `functions` job.
- **Runner image change.** Each of the 6 jobs on `ubuntu-latest` carries this notice: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026."
  - [actions/runner-images#14748](https://github.com/actions/runner-images/issues/14748) says the rollout runs over several weeks from 19 Oct 2026 and should be complete by 19 Nov 2026.
- **Exposure:**
  - Still on `ubuntu-latest` with v4 tags: `ci.yml` and `migration-guard.yml` on develop, including the new `functions` job, and the harness workflows in PR #4 and #39 (`agents.yml`, `agents-check.yml`, `claude.yml`).
  - Pinned in a PR: PR #30 moves CI, the migration guard and Security to `ubuntu-24.04` with SHA-pinned actions, and pins the composite `./.github/actions/setup`. PR #30 predates the `functions` job, so that job needs the same pins when #30 is updated onto develop.
  - PR #36's new workflows already use `ubuntu-24.04`.

## 5. Actions minutes

- **Used in the window:** 182.2 job-minutes over 465 jobs.
  - By workflow: CI 167.4, Migration guard 9.7, DB CLI 3.0, Agents check 1.5, Security 0.6.
- **Cost today: none.**
  - The repository is public: `gh api repos/thesaurabhpareek/earlyletters --jq .visibility` returns `public`.
  - Every job ran on a standard label (`ubuntu-latest` or `ubuntu-24.04`).
  - GitHub's docs: "GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners." Larger runners are charged even on public repositories ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- **If the repository becomes private.** PR #33 records that the agent harness runs only after the repository is private on GitHub Pro. Verified facts:
  - "GitHub rounds the minutes and partial minutes each job uses up to the nearest whole minute." Linux 2-core x64 costs $0.006 a minute ([Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)).
  - GitHub Pro includes 3,000 minutes a month for private repositories. "If your account does not have a valid payment method on file, usage is blocked once you use up your quota." ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- **Arithmetic from this window:**
  - With per-job rounding, this window would bill 522 minutes: CI 429, migration guard 73, agents check 13, DB CLI 3, Security 4. So 3,000 minutes covers about 5.7 days like today.
  - One push to a PR bills about 8 minutes on develop's current `ci.yml`: 7 for CI (six jobs, with `database rules` rounding up to 2), plus 1 for the migration guard.
  - After PR #30, an estimated 14: its CI billed 9 minutes a run at 69a425e (8 jobs), the `functions` job adds 1, and the migration guard, the two Security jobs and the fence add at least 4. The first version of this report said 10, because it left out the Security jobs.
- **The agent harness (PR #4):**
  - The `plan` job runs on cron `17,47 * * * *`, 48 times a day, at least 1 billed minute each. That is at least 1,440 minutes a month on its own.
  - The roster allows 30 agent runs a day with a 50-minute default timeout. Real run lengths are unknown until the harness runs (Unverified).
  - At an assumed 10 minutes a run, that is 9,000 minutes a month.
- **What this means:** on a private Pro repository, the harness alone would use more than the included 3,000 minutes.
  - Without a payment method, Actions stops at the quota. With branch protection requiring `required`, nothing could then merge.
  - Each 1,000 minutes over the allowance costs $6 at the rate above.
  - This is a founder decision (fix 5). Ops does not recommend spending.

## 6. Top fixes, ranked

| # | Fix | Why | Owner | Backlog |
|---|---|---|---|---|
| 1 | Fix the secrets scan before PR #30 merges: on `pull_request`, scan `<base>..<head>` instead of `HEAD`; allowlist the 5 fixture findings now on develop, each with a reason; confirm none is a live credential (section 3.1). | The fixtures are on develop now, so with #30 as it stands every PR, push and weekly scan would fail on them. | `security` (proposal and triage); founder (applies it in `.github/`; rotation, if ever needed) | BL-117 |
| 2 | Update PR #30 onto develop, pin the new `functions` job, and merge it only after a new red-team review says `ship` and the approve-migration review (D-041). | It clears the release PR #2 guard failure with a single reviewed exception, and pins runners and actions ahead of 19 Oct. Today it is in conflict, and its 19:39 UTC review says "fix first". | founder | BL-004, BL-117, BL-122 (by scope; the PR cites WS-13) |
| 3 | Turn on branch protection for `main` and `develop`. Required checks: `required` and `applied migrations unchanged`, plus `fence` after #30. The command is in `.github/README.md`. | Both branches return "Branch not protected" (HTTP 404) and there are no rulesets, so every check above is advisory. | founder | M1 exit criterion (BL-004, BL-122) |
| 4 | Pin the harness workflows (`agents.yml`, `agents-check.yml`, `claude.yml` in PR #4 and #39) to `ubuntu-24.04` and commit SHAs. | The `ubuntu-latest` image changes from 19 Oct, and the Node 20 actions are deprecated. The patch, with every SHA dereferenced to its commit, is in this PR's body, because ops cannot edit `.github/`. | founder | none (PR #30 follow-up) |
| 5 | Decide the Actions budget before making the repository private: a dollar budget with a payment method, keeping CI on a public repository, or another runner option. | Section 5: the harness alone exceeds the Pro allowance, and CI stops at the quota. | founder | none (PR #33) |
| 6 | Update BL-004's status line to say CI is on develop (Node 22, six jobs, a 10-minute budget), and keep the task open until CI is on `main` (F2). | The backlog still says `ready`, Node 20 and 8 minutes. The task's own scope includes `main`. | `product` | BL-004 |
| 7 | Keep watching `database rules` and the `test:db` perf budgets. | No CI failures yet, but the job grew from about 65 s to about 100 s with develop's four new migrations (section 1). | `qa` | none |

## How to refresh this report

Fetch the runs, then each run's jobs, with the REST calls listed under Source at the top. Then compute the following per workflow, and separately for develop and for PR heads:
- conclusion counts;
- run duration (`updated_at` minus `run_started_at`);
- job time;
- job time rounded up per job;
- queueing (`created_at` to `started_at` per job).

Count a run as flaky only when one workflow has both a failure and a success for the same event, branch and commit. Check each open PR's `mergeable_state`: a `dirty` PR has no new runs until it is updated.
