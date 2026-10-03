# CI health report

Owner: `ops`. Run `sess-202610031917`.

- **As of:** 2026-10-03 19:31:19 UTC.
- **Window:** every GitHub Actions run in the repository. The first was created at 07:41:11 UTC (the push of commit 3bf45a0 that added CI) and the last at 19:30:39 UTC. That is 104 runs over 11 h 50 min, all on 3 Oct 2026. Two runs on PR #37 were still running at the snapshot.
- **Source:** REST only.
  - `gh api 'repos/thesaurabhpareek/earlyletters/actions/runs?per_page=100'` (all pages);
  - `.../actions/runs/<id>/jobs?filter=latest` for every run;
  - `.../actions/workflows`;
  - `.../actions/jobs/<id>/logs` for the failed jobs;
  - `.../check-runs/<id>/annotations` for warnings.
- **Durations:** a run lasts from `run_started_at` to `updated_at`, so queue time is included. Job time is `started_at` to `completed_at`.

## Summary

- **develop is green.** All 3 pushes to develop passed CI and the migration guard.
- **Two failed runs, both deterministic. No flakes were found.**
  - The secrets scan on PR #30 reports 3 findings. They are redacted, and `security` must triage them.
  - The migration guard on release PR #2 flags an applied migration that was edited before the guard existed. PR #30 carries the fix.
- **Four CI runs were cancelled.** Each was superseded by a newer push to the same PR, so none is a failure.
- **Speed.** A green CI run takes 1m 35s at the median and 3m 48s at the longest, against the 10-minute budget in `.github/README.md`. The `database rules` job is the critical path.
- **Cost.** 113.5 job-minutes were used, which is free on this public repository (cited in section 5). The same work on a private repository would bill 328 minutes.
- **Nothing is enforced yet.** Neither `main` nor `develop` has branch protection, and the repository has no rulesets. Every check is advisory.

## 1. Per workflow

| Workflow | Where the file lives | Runs | Success | Failure | Cancelled | Running | Median | Longest |
|---|---|---|---|---|---|---|---|---|
| CI | `ci.yml` on develop | 47 | 42 | 0 | 4 | 1 | 1m 36s | [3m 48s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37137050922) |
| Migration guard | `migration-guard.yml` on develop | 47 | 45 | 1 | 0 | 1 | 0m 11s | [0m 17s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138676435) |
| Agents check | `agents-check.yml`, only in PR #4, #39, #42 | 8 | 8 | 0 | 0 | 0 | 0m 10s | [0m 14s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37131011601) |
| DB CLI | `db-cli.yml`, only in PR #36 | 1 | 1 | 0 | 0 | 0 | 3m 04s | [3m 04s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37136106966) |
| Security | `security.yml`, only in PR #30 | 1 | 0 | 1 | 0 | 0 | 0m 17s | [0m 17s](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37133196268) |

- The median and longest columns cover completed runs, including cancelled ones.
- Counting only the 42 green CI runs: median 1m 35s, shortest 1m 02s, longest 3m 48s.
- Three workflows exist only on PR branches. In this window each ran only on the PR that adds it, so they will run on every PR only after they merge.

### CI jobs (successful jobs only)

| Job | Median | Longest | Note |
|---|---|---|---|
| install | 14 s | 39 s | `npm ci` ran in only 5 of 47 install jobs. The rest restored `node_modules` from cache. |
| tests and content rules | 24 s | 31 s | |
| database rules | 65 s | 83 s | Critical path. The test step alone averages 48 s. |
| typecheck | 26 s | 61 s | |
| required | 3 s | 5 s | |

**Queueing.** Runner pickup took 2 s at the median, 3 s at the 90th percentile and 70 s at most, measured over 233 jobs in completed CI runs. Four runs waited 22 to 102 s for the run they superseded to finish cancelling.
- The longest run (3m 48s) is one of these. It waited 1m 42s before its first job, then 38 s for a runner for `required`.
- Its critical-path jobs took about 1m 23s: install 12 s, database rules 69 s, required 2 s.

## 2. develop and PR heads

### develop

| Event | Workflow | Runs | Result | Median | Longest |
|---|---|---|---|---|---|
| push | CI | 3 | 3 success | 1m 33s | 1m 38s |
| push | Migration guard | 3 | 3 success | 0m 10s | 0m 12s |
| pull_request, release PR #2 (develop into main) | CI | 1 | success | 1m 36s | 1m 36s |
| pull_request, release PR #2 | Migration guard | 1 | **failure** (section 3.2) | 0m 08s | 0m 08s |

The develop tip is 3688796, pushed at 08:11 UTC. It used 9.5 job-minutes in total.

### PR heads (every pull_request run whose head is not develop)

- **Totals:** 96 runs across 21 PRs. 89 succeeded, 1 failed (Security on PR #30), 4 were cancelled after being superseded, and 2 were running. They used 104.0 job-minutes.
- **Latest result at each open PR head, at the snapshot:**
  - all workflows green: #1, #3, #4, #25 to #29, #31 to #36, #38 to #42;
  - #30: CI and migration guard green, Security failed;
  - #2: CI green, migration guard failed;
  - #37: a new commit (0d59dc8) was still running.

## 3. Failures and cancellations

### 3.1 Security, `secrets (full history)`, PR #30 (real until triaged)

- **Run and job:**
  - [run 37133196268](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37133196268)
  - [job](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37133196268/job/111232279648), step `Scan every commit`, commit 76c1f26.
- **What the log says:** gitleaks 8.30.1 with `--redact`: "28 commits scanned", "leaks found: 3", exit code 1. The log names no file or rule, because the job prints no report.
- **Real or flaky:** deterministic. The same commits give the same result, and the run was never re-run.
  - Whether the 3 findings are real secrets or false positives is not known. Ops did not run the scanner; triage belongs to `security`.
- **A discrepancy for `security`:** PR #30's body says that with the new `.github/gitleaks.toml`, the history scan is clean locally.
  - Develop has 14 commits and PR #30 adds 1, yet CI scanned 28.
  - Unverified hypothesis: the CI checkout (`fetch-depth: 0`) includes commits from other branches that the local scan did not see.
- **Impact today:** none on merging, because Security is not in `required`.
  - Once #30 merges, the workflow runs on every PR and weekly, so these 3 findings would show on every PR until triaged.
  - If a finding is a real credential, the response belongs in SECRETS.md and INCIDENT.md (in PR #35).

### 3.2 Migration guard, `applied migrations unchanged`, release PR #2 (real, expected, one-off)

- **Run:** [run 37109089140](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37109089140), step `Compare with the base`. Head 3688796, base `origin/main`.
- **What the log says:** "20261001000000_scribe_hardening.sql: edited, but it has been applied. Write a new migration instead."
- **Cause:** commit 3730551 (2 Oct, before the guard existed) changed that file on develop.
  - It added a comment recording the apply.
  - It moved the entries policy merge into a new migration, `20261002010000_entries_select_policy.sql`.
  - `main` still has the earlier version, so every run of PR #2 compares against it and fails. The guard is working as designed.
- **Real or flaky:** deterministic. The develop push of the same commit passed, because that run compares against the previous develop commit, not against `main`.
- **Fix in flight:** PR #30 adds a reviewed exception (`.github/migration-exceptions.txt`) for exactly this file at blob `fab49f91bb93`.
  - That blob matches develop today: ops verified it with `git rev-parse origin/develop:supabase/migrations/20261001000000_scribe_hardening.sql`.
  - PR #30's author reports a local pass for the release PR shape. PR #2 turns green after #30 merges into develop.
- **Unverified:** whether develop's version of the file is exactly what is live in the database. Ops never reads remote databases; the file comment and the commit message say it is.

### 3.3 Cancelled runs (not failures)

| Run | PR | Superseded by |
|---|---|---|
| [37137027317](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37137027317) | #38 ab6e240 | b97cc88, 25 s later |
| [37138368995](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138368995) | #41 0356433 | e1c8c2e, 51 s later |
| [37138421941](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138421941) | #41 e1c8c2e | 7051dcc, 56 s later |
| [37138481030](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37138481030) | #41 7051dcc | 001c50f, 77 s later |

- The `ci-<PR>` concurrency group cancels in-progress PR runs, as designed.
- In each cancelled run, `required` runs anyway (`if: always()`) and reports failure. So a superseded commit shows a red mark, but only the PR head counts.
- Keeping `always()` costs one short job per cancellation and is the safe choice, so ops proposes no change.

### 3.4 Flakiness

- No workflow had both a failure and a success for the same event, branch and commit.
- No run was re-run: every run is attempt 1.
- The sample is one day, so this is a baseline, not a verdict.
- **Watch item:** PR #30's body reports that the `perf.test.mjs` p95 budgets fail intermittently on a loaded local machine. In CI, `database rules` passed in every completed run in the window.

## 4. Warnings on every run (not failures)

Source: the annotations on [run 37108853619](https://github.com/thesaurabhpareek/earlyletters/actions/runs/37108853619), the latest develop CI run.

- **Node 20 actions.** Each CI job that uses `actions/checkout@v4`, `actions/setup-node@v4` or `actions/cache@v4` warns: "Node.js 20 is deprecated", and the actions are forced onto Node.js 24. That is 4 warnings per CI run.
- **Runner image change.** Every job on `ubuntu-latest` carries this notice: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026."
  - [actions/runner-images#14748](https://github.com/actions/runner-images/issues/14748), fetched today, says the rollout runs over several weeks from 19 Oct 2026 and should be complete by 19 Nov 2026.
- **Exposure:**
  - Still on `ubuntu-latest` with v4 tags: `ci.yml` and `migration-guard.yml` on develop, and the harness workflows in PR #4 and #39 (`agents.yml`, `agents-check.yml`, `claude.yml`).
  - Already pinned: PR #30 moves CI, the migration guard and Security to `ubuntu-24.04` with SHA-pinned actions, and PR #36's new workflows already use `ubuntu-24.04`.

## 5. Actions minutes

- **Used in the window:** 113.5 job-minutes over 293 jobs.
  - By workflow: CI 103.5, Migration guard 5.9, DB CLI 3.0, Agents check 0.9, Security 0.3.
- **Cost today: none.**
  - The repository is public: `gh api repos/thesaurabhpareek/earlyletters --jq .visibility` returns `public`.
  - Every job ran on a standard label (`ubuntu-latest` or `ubuntu-24.04`).
  - GitHub's docs: "GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners." Larger runners are charged even on public repositories ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- **If the repository becomes private.** PR #33 records that the agent harness runs only after the repository is private on GitHub Pro. Verified facts:
  - "GitHub rounds the minutes and partial minutes each job uses up to the nearest whole minute." Linux 2-core x64 costs $0.006 a minute ([Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)).
  - GitHub Pro includes 3,000 minutes a month for private repositories. "If your account does not have a valid payment method on file, usage is blocked once you use up your quota." ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- **Arithmetic from this window:**
  - With per-job rounding, this window would bill 328 minutes: CI 269, migration guard 46, agents check 8, DB CLI 3, Security 2. So 3,000 minutes covers about nine days like today.
  - One push to a PR bills about 7 minutes today: CI averages 5.7 rounded minutes, plus 1 for the migration guard.
  - After PR #30, an estimated 10: CI grows to 8 jobs, plus the guard and the fence, each at least 1 minute.
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
| 1 | Triage the 3 secrets-scan findings on PR #30 before it merges. Reproduce with the same checkout as CI (`fetch-depth: 0`), then make the local and CI scans agree. | A real credential in public history needs rotation, not just a commit. After #30 merges, the scan runs on every PR. | `security` (triage); founder (rotation, if needed) | BL-117 |
| 2 | Merge PR #30 after its approve-migration review (D-041). | It clears the release PR #2 guard failure with a single reviewed exception, and pins runners and actions ahead of 19 Oct. | founder | BL-004, BL-117, BL-122 (by scope; the PR cites WS-13) |
| 3 | Turn on branch protection for `main` and `develop`. Required checks: `required` and `applied migrations unchanged`, plus `fence` after #30. The command is in `.github/README.md`. | Both branches return "Branch not protected" (HTTP 404) and there are no rulesets, so every check above is advisory. | founder | M1 exit criterion (BL-004, BL-122) |
| 4 | Pin the harness workflows (`agents.yml`, `agents-check.yml`, `claude.yml` in PR #4 and #39) to `ubuntu-24.04` and the action SHAs PR #30 uses. | The `ubuntu-latest` image changes from 19 Oct, and the Node 20 actions are deprecated. The patch is in this PR's body, because ops cannot edit `.github/`. | founder | none (PR #30 follow-up) |
| 5 | Decide the Actions budget before making the repository private: a dollar budget with a payment method, keeping CI on a public repository, or another runner option. | Section 5: the harness alone exceeds the Pro allowance, and CI stops at the quota. | founder | none (PR #33) |
| 6 | Update BL-004's status line: CI is on develop, on Node 22, under a 10-minute budget. | The backlog still says `ready`, Node 20 and 8 minutes. | `product` | BL-004 |
| 7 | Keep watching the `test:db` perf budgets for load sensitivity. | No CI failures yet; local runs on shared machines vary (section 3.4). | `qa` | none |

## How to refresh this report

Fetch the runs, then each run's jobs, with the REST calls listed under Source at the top. Then compute the following per workflow, and separately for develop and for PR heads:
- conclusion counts;
- run duration (`updated_at` minus `run_started_at`);
- job time;
- job time rounded up per job.

Count a run as flaky only when one workflow has both a failure and a success for the same event, branch and commit.
