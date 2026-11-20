# Platform, CI, release, process and quality: agent briefs (RD-H3)

Author: `ops`, 20 Nov 2026 about 19:00 UTC. Docs only. State read from GitHub and `origin/develop` 16e61549 at 18:50 UTC; PR heads and merges move in hours, so each brief says "re-open every file:line" in its first line. Template and worked examples: `BRIEF-TEMPLATE.md` in #916 (`git show origin/agent/ai-eng-lead/readiness-skills:docs/engineering/readiness-20nov/skills/BRIEF-TEMPLATE.md`). Reading packs: #917 (Pack 10 is this lane). Test catalogue: #924 to #927. Security acceptance: #914, #915. Libraries: #919, #920. Delta: #931 to #933. Performance inputs (mine): #928 to #930. All unmerged; read with `git show origin/<branch>:<path>`.

Tags: [V] verified (file:line, command, gh api), [E] estimate, [U] unverified. "Founder" means only he can do it: spend, `scripts/agents/**`, any `.github/workflows/**` edit (the Claude GitHub App cannot make one; two reviews and the founder), accounts and secrets, EAS, App Store Connect, merging.

## The briefs (23)

Order is the order to start them. "Blocked" names who must act before the agent can finish; the agent can always write the brief's own docs, tests and proposal files.

| # | Brief | Lane | Agent | Depends on | Size | Lens A | Lens B | Wave | Blocked on |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `BRIEF-F4-first-production-db-deploy.md` | release | ops | none | S | security-architect | data-steward | 1 | Founder: fixes the production DB secret, approves the run (F4) |
| 2 | `BRIEF-P-7-record-applied-migrations.md` | release | ops | 1 | S | data-steward | security-architect | 1 | Founder: apply done and confirmed |
| 3 | `BRIEF-830-main-sync-conflict.md` | release | ops | none | M | security-architect | principal-architect | 1 | Founder: merge method, names the PR with its full sha |
| 4 | `BRIEF-BL-976-WIRE-preflight-keepsafe.md` | release | ops | none | S | security-architect | principal-architect | 1 | nothing |
| 5 | `BRIEF-B13-CHECKS-release-ios-checks.md` | release | ops | 4 | S | security-architect | principal-architect | 1 | Founder: pastes the `release-ios.yml` patch |
| 6 | `BRIEF-B13-CUT-release-branch-and-rc-tag.md` | release | ops | 1, 2, 3, 4, 5 | S | security-architect | qa | 1 | Founder: Q1, marketing version, "cut" go, `app-store` approval |
| 7 | `BRIEF-BL-975-label-guard-activation.md` | CI | ops | none | S | compliance-engineer | security-architect | 1 | Founder: copies `label-guard.yml` |
| 8 | `BRIEF-CI-PIN-sha-pin-actions.md` | CI | ops | none | S | security-architect | principal-architect | 1 | Founder: applies the patch to 4 workflows |
| 9 | `BRIEF-CI-SECRET-secret-scan.md` | CI | ops | none | S to M | security-architect | compliance-engineer | 1 | Founder: picks Option A (own script) or B (new tool = new dependency) |
| 10 | `BRIEF-CI-PRSIZE-pr-size-job.md` | CI | ops | none | S | principal-architect | qa | 1 | Founder: how a size exception is proved; pastes the job |
| 11 | `BRIEF-CI-COV-coverage-job.md` | CI | ops | 8 | S | qa | principal-architect | 2 | Founder: pastes the job |
| 12 | `BRIEF-CI-LINT-lint-introduction.md` | CI | ops | 8, 9 | M | principal-architect | security-architect | 2 | Founder: approves new dev dependencies; pastes the job |
| 13 | `BRIEF-CI-SIZEGATE-size-gate.md` | CI | ops | first measured run | M | principal-architect | security-architect | 2 | Founder: first measured run; pastes the step |
| 14 | `BRIEF-CI-Q1-macos-queue-measure.md` | CI | ops | none | S | security-architect | principal-architect | 1 | Founder: one dispatch (or one Mac run); pastes a small patch |
| 15 | `BRIEF-CI-Q2-macos-queue-changes.md` | CI | ops | 14 | M | security-architect | principal-architect | 2 | Founder: picks among Q2, Q3, Q4; pastes each. Q5 is spend and Q6 is dropped after review B (needs a wider token, cuts against green on the head sha); neither briefed |
| 16 | `BRIEF-BL-964-trace-ratchet.md` | process | qa | #846 for PR 2 | M | principal-architect | ai-eng-lead | 1 | #846 merge (founder, product); founder: 07 Q8 (`--check` blocking) |
| 17 | `BRIEF-QA-TITLES-test-title-cite-rules.md` | process | qa | 16 (PR 1) | S | principal-architect | qa peer | 1 | nothing (report only) |
| 18 | `BRIEF-P-8-9-followups.md` | process | qa | 17 | S | qa peer | compliance-engineer | 1 | nothing; product for a card title fix |
| 19 | `BRIEF-BL-929-ASHA-seeded-book-generator.md` | quality | qa | none (PR 1) | M | principal-architect | privacy | 1 to 2 | Photo stack #835 to #840 for pictures; founder for the device run |
| 20 | `BRIEF-BL-929-PERF-perf-profile-and-markers.md` | quality | mobile, ops | 4, 19 | M | security-architect | principal-architect | 2 | Product: a BL row; founder: new EAS profile, builds, distribution choice |
| 21 | `BRIEF-KILL-MEDIA-kill-harness-media-points.md` | quality | qa | 19, #835 to #839 merged | M | security-architect | principal-architect | 2 | Photo stack merge (mobile, founder) |
| 22 | `BRIEF-HG-H3-stack-status-script.md` | harness | ops | none | S | security-architect | ai-eng-lead | 1 | Founder: moves it into `scripts/agents/` (his path) |
| 23 | `BRIEF-HG-MQ-merge-queue-fixes.md` | harness | ops | none | S | security-architect | ai-eng-lead | 1 | Founder: applies the patch to `scripts/agents/merge-queue.mjs`; Karma: quiet-rule policy |

Parallel starts today (nothing blocks the writing): 4, 7 (follow-ups), 8, 9 (Option A), 10, 14, 17, 18, 19 (PR 1), 22, 23. Strict chain: 1, 2, 3 then 4, 5 then 6. 15 follows 14. 16 PR 2 follows #846.

## What is the founder's, in one list

- Spend: EAS builds beyond the plan (15 a month on Free), a larger macOS runner or a self-hosted Mac (Q5, not briefed), any paid tool.
- `scripts/agents/**`: briefs 22 and 23 produce proposals under `docs/ops/proposed/`; an agent never writes there.
- Workflow edits (two reviews and the founder): 5, 7, 8, 9, 10, 11, 12, 13, 14, 15 (paste a patch from `docs/ops/proposed/`). One sitting can paste 7, 8 and 9 together.
- Accounts and secrets: 1 (`SUPABASE_DB_URL_PROD`), 6 (`app-store` environment, EXPO_TOKEN), 9 (GitHub secret scanning and push protection settings). The agent never reads or prints a value.
- Decisions: Q1 (the cut), the marketing version, merge method for 3, size-exception proof (10), lint dependencies (12), Option A or B (9), perf profile distribution (20; default now internal), `--check` blocking (16).

## Checked against GitHub and develop; not briefed because done or not mine

- Done: BL-964 report mode (#878); BL-975 script, cards and notes (#897, #898, #906) (activation only is brief 7); BL-976 NS-08-R5 preflight and NS-08-R6 test (#874, #875) (wiring only is brief 4); P-8 (#888 to #890) and P-9 (#905) (follow-ups only are brief 18); BL-958; #844 and #853 (iOS link fixes); BL-927, BL-962 test, BL-967, NS-10-R7 and the quiet-book fixes (#867, #868, #877, #901 to #904).
- Not mine: BL-929's run sheet and BL-930 (#880): qa and product; H6 hot-path tripwires: each feature's agent; H8, H9 (Limits job, Variant B only); HARNESS-GAPS H1, H2, H6, H7, H8, H9, H10: Karma and ai-eng-lead process, no code. H10 (CI timing report) is folded into brief 14. #912 (dispatcher four-digit ids) is a draft, not on this plan's paths. #843, #846, #847 are product's.
- Still open and named in 3a but not an ops assignment: BL-922, BL-925/926, BL-928, BL-961 (#871, #879), BL-966, P-4, P-1, BL-978; they hold the Build 13 cut under Q1's default (plan 3a).

## Findings worth a second look (all [V] unless marked)

1. `release-ios.yml` never runs `preflight:production` or the keep-safe preflight: `grep -n preflight .github/workflows/release-ios.yml` has no hit (brief 5). `testflight.yml:104` is the only workflow that runs a preflight.
2. `preflight-keepsafe.mjs` is wired nowhere but its own `main` (its header says "ops wires them in"; brief 4).
3. Seventeen `uses:` lines are not pinned by SHA: ci.yml 7, web-e2e.yml 5, web.yml 3, migration-guard.yml 2 (brief 8; same count as security K-2 in #915).
4. A skipped macOS check can read as red in the merge queue: `compile` is skipped when `ios-compile.yml` sees no native change (`:60`), `merge-queue.mjs:193-195` treats `skipped` as red, and its native path list differs from the workflow's (`apps/mobile/package.json` versus `eas.json`). Live proof that `compile` concludes `skipped`: #894, #895, #879. The merge-queue effect is derived from the code, not yet seen on an eas.json-only PR [E] (brief 23).
5. `main` and `develop` conflict in 64 files because `main` took a squash of old develop; with `-X ours` one file still conflicts and 7 files carry main-only lines that need a decision (brief 3).
6. `scripts/guards/*.test.mjs` and `scripts/qa/skip-guard.test.mjs` are in no CI test list: `grep` of the root `package.json` and all workflows finds none. A guard whose test never runs cannot fail.
7. The BL-964 ratchet needs the locked cards on develop: today's trace prints about 30 "NS id defined nowhere" lines for ids that tests already cite correctly, because #846 is unmerged (brief 16).
8. Correction owed in my own #929 (`MEASUREMENT-PLAN.md` section 6): it cites `kill-harness.yml:264` as the DerivedData save; the save is the post step of `actions/cache@` at `kill-harness.yml:208-214`, line 264 saves the kill app. Brief 14 has the right cite.

## Conflicts sent to product

- FR-QAL-02 (trace should read `functions/*.md` and card 19) against the locked pack (cards only): brief 16 reads locked cards only until product rules.
- BL-929 names the run sheet only; the `perf` profile and markers (S19, S20) have no BL row: brief 20 waits for one.
- NS-09-R4b card title says `[NS-09-R4]` (card 08 line 304 at the lock): product's fix (brief 16, 17).

## Cites

About 70 locations opened for these 23 briefs and this file; about 58 held as first written; about 12 were wrong in my notes or in #929 and are fixed here (release-ios.yml job line numbers, J-N13 line, kill-harness cache save, store-flags lines, protocol.mjs lines, ios-compile `workflow_dispatch` line, and the 14-test-plan line base). Not verified: GitHub cache scoping and the 10 GB limit (docs.github.com not fetched), the `compare` API fields used in brief 22, whether agent tokens can dispatch workflows or set labels, anything about production or Apple state, and cards 21 to 27 and the function files.

## After review B (20 Nov, pushed as normal commits)

F4: the `db-production` approval covers the whole deploy job, so a green dry run pushes by itself; the brief now says so and asks for a two-job proposal. The file count is [U] (31 minus 2 is arithmetic). #830: per-hunk review of main's 3 commits (656 files, 4 migrations), not the stat; both branches hold the same 31 migrations. Size gate: hard budgets have no waiver, baselines are compared with the base branch. Trace baseline: same. Perf profile: default internal. Merge queue: skipped is accepted only when the queue itself says not native; removing eas.json is a loosening for Karma. Q6 dropped.

## Tests that no CI list runs, and the one workflow change (review A)

`npm test` runs every workspace (`apps/*`, `packages/*`, `experiments`) plus a fixed `node --test` list (root package.json:11: trace, release setup, compliance). Not run by `npm test` or any workflow [V grep]: `scripts/packs/*.test.ts` (secret-scan), `scripts/size/lib.test.ts`, `scripts/status/page.test.mjs`, `scripts/guards/docs-leak-guard.test.mjs`, `scripts/qa/skip-guard.test.mjs`. No brief wires docs-leak-guard or skip-guard: that is a gap for qa and Karma to give a row. New tests in these briefs go under `apps/mobile/test` (runs in `unit`) or into the root `node --test` list, never only into those folders.

Three briefs compare a file with the base branch's copy (CI-PIN allow list, BL-964 baseline, CI-SIZEGATE baseline). The `unit` job has a default-depth checkout with no base ref, so `git show origin/<base>:...` fails there. One founder step serves all three, before `npm test`, pull_request events only: `git fetch --no-tags --depth=1 origin "+refs/heads/$GITHUB_BASE_REF:refs/remotes/origin/$GITHUB_BASE_REF"`. The tests fail, never skip, when the base copy is missing in CI.

Dispatch note: briefs 6 and 14 need a `workflow_dispatch`; an agent may not be allowed to make one [U]. If refused, the founder dispatches and the brief is done on his run ids.
