---
chapter: 09a
title: Review and merge practice, rules from 21 Nov
owner: ai-eng-lead
reviewers: [principal-architect, security-architect]
status: adopted under CR-73
last_reviewed: 2026-11-21
applies_to: docs/agents/**, scripts/agents/**, docs/engineering/**
---
# 09a. Review and merge practice, rules from 21 Nov

Companion to chapter 09 (owner `ai-eng-lead`), kept apart so chapter 09 stays inside 220 lines. Rules AIE-R40 to R43 follow AIE-R32 to R39 in chapter 09. In force on merge under CR-73. What enforces each rule, and what does not yet, is in `ENFORCEMENT.md`.

**AIE-R40 (MUST)** A PR is not merged on required checks that ran on a base behind `develop` by commits touching a workspace the PR also touches: update the branch, wait for `required` again, and get fresh counted reviews (the update is a new commit). *Why:* a green run on an old base says nothing about the merged result. *Evidence:* #1128 had green `required` from 05:26 UTC (and `tests and content rules` from 05:23) on a base about 14 hours old, and merged at 18:42 UTC; it met #839 (merged about 16:46 UTC) and develop was red until #1353. Branch protection has `strict: false` (read 21 Nov); strict would force this but makes every merge re-run CI behind a queue that held 86 to 150 queued runs on 20 and 21 Nov (counted by REST then, not re-checkable now). *Enforced by:* `merge-queue.mjs` NEEDS-UPDATE verdict, pending #1356 (AIE-G16); until it merges, review only.

**AIE-R41 (MUST)** When `develop` is red, one session owns the fix: before starting, search open and just-merged PRs for the failing test names, and post one comment on the PR that broke `develop` naming the fix PR. *Why:* two sessions fixed the same break. *Evidence:* #1353 (merged 19:19 UTC, two counted reviews) and #1354 (closed as a duplicate after two review rounds) fixed the same three failures from #1128 and #839. *Enforced by:* review only (AIE-G17).

**AIE-R42 (MUST)** Reviewers who mutate files work in their own scratch worktree, never in the shared checkout and never two at once in the same one. *Why:* a mutation left in a shared tree reads as a defect in the PR. *Evidence:* on #1354 two reviewers edited `erase-picture.ts` in one checkout at the same time and one reported lines it had not added (the reviewer's hand-back in the session record; it is not in the PR comments); the pushed head was clean. *Enforced by:* the reviewer brief; review only.

**AIE-R43 (MUST)** A merge message states the real basis of approval: CR-70 and CR-73 for a PR Karma approved, or a quoted founder chat line for one that needs him. *Why:* a fixed template line said "founder approved" on merges he did not approve. *Evidence:* 7 merges after CR-73 (ae0c4e578, b0e422443, ace71fa05, 1e19e6439, 7ada1b30d, ee782b8f2, 9018cdf2a) carry the founder line; history is not rewritten and the record is `infra/develop-checks-and-corrections-2026-11-21.md` in the Project. *Enforced by:* not yet (AIE-G18).

## Gaps

| Gap id | What closes it |
|---|---|
| AIE-G16 | `merge-queue.mjs` gives NEEDS-UPDATE when the base is behind `develop` over a shared workspace (AIE-R40); pending #1356 |
| AIE-G17 | The dispatcher or `check.mjs` flags two open PRs that fix the same failing test (AIE-R41) |
| AIE-G18 | The merge helper builds the message from the PR's actual approval basis (AIE-R43) |
