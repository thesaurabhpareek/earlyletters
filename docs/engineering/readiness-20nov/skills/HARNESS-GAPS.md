# Harness gaps: where the process slowed us on 20 Nov, and the fix (RD-G, 5 of 5)

Author: `ai-eng-lead`, 20 Nov 2026, 18:30 UTC. Docs only; no workflow, script, roster or charter is edited here. Every fix is a proposal. "Owner" is who writes it; "Founder" says whether only the founder can unblock it (a workflow edit, a secret, spend, a charter or roster change, or branch protection). Tags [V] checked now, [E] estimate with basis, [U] not verified. Chapter 09 rule ids: AIE-R##.

## 0. Summary

| Id | Gap | Cost seen today | Fix in one line | Owner | Founder |
|---|---|---|---|---|---|
| H1 | An agent cannot post its journal | Run leaves no trace | Fall back to a `JOURNAL-PENDING` block in the check-in file; Karma posts it | Karma | No |
| H2 | An agent cannot add labels | PR is invisible to the cap and the digest | `Labels wanted:` as the first body line; Karma applies | Karma | No (token scope: yes) |
| H3 | Stacked PRs: retarget and add/add conflicts | A rebuild per slice, about 6 slices | One runbook, bottom-up, rebuild recipe; one script proposal | Karma, ops | Script under `scripts/agents/**`: yes |
| H4 | Heads move under reviewers | Reviews at old heads (#836, #798) | Review hold with sha; cascade once; delta line | Karma, ai-eng-lead | No |
| H5 | macOS CI queue and cancelled runs | Runs waited 66 and 155 minutes to start | Push the cascade once; path filter on tests; founder decides runners | ops, founder | Yes (workflow, spend) |
| H6 | Usage-limit stops and the 3:01 restart | Runs end with a stub only | A `RESUME:` line; stagger the restart | Karma | No |
| H7 | Review comments read as founder instructions | Latent until a lane runs | Machine marker on line 2; do not switch the lane on first | ai-eng-lead, founder | Yes (lane) |
| H8 | Designs go stale in hours | 7 cites wrong by afternoon | "Re-verify at claim" step; sha on every cite | Karma | No |
| H9 | Tests that cannot fail | Brief's complaint | Red on old code and on one mutant, in every brief | Karma, qa | CI check: yes |
| H10 | Chapter 09 evidence is out of date | Reviewers cite a false fact | Refresh AIE-R18 and AIE-G10 evidence | ai-eng-lead | MUST text: yes |

## H1. Journal posting refused

- Seen: some agents could not post a journal (the brief for this task; I cannot see their errors) [U]. Here, `gh api -X POST repos/thesaurabhpareek/earlyletters/issues/234/comments -F body=@<file>` succeeded (comment `7047365458`) [V]. So the refusal is per session, not per repo. Likely causes [U]: a token or sandbox without `issues: write`; an allow-list that blocks the `-F body=@file` form.
- Rule it breaks: OPERATING_MODEL section 5 (journal stub first, finish last).
- Fix: the brief's section 16 says "do not retry". Add what to do instead: append to the check-in file a block that starts `JOURNAL-PENDING <issue number> <marker>` followed by the full entry; Karma posts it from a session that can. The file is in the PR, so it survives a stop.
- Also: Karma's first act in each session is one test call, `gh api repos/thesaurabhpareek/earlyletters/issues/<journal n> --jq .state`, then a stub post. If either fails, the session starts in file-only mode and says so in its first check-in line.
- Owner: Karma. Founder: no, unless the cause is the token scope (then yes).

## H2. Label permission refused

- Rule: PRs carry `agent:<handle>` and `from:agent` (OPERATING_MODEL section 4; HARNESS-RUN "Branch, commits, PR").
- Why it matters: the dispatcher counts open PRs with an `agent:` label against `max_open_agent_prs` 10 (`scripts/agents/dispatch.mjs:235`, per #847 section 4.4). 66 carry the label (45 drafts) and the photo slices carry none, so the cap is wrong both ways [V from #847; not re-counted]. The merge-queue reads author lens from review comments, not labels, so labels do not gate a merge (`merge-queue.mjs:184-200` reads reviews and checks only) [V].
- Seen here: `gh api -X POST repos/.../issues/<n>/labels -f 'labels[]=agent:ai-eng-lead' -f 'labels[]=from:agent'` succeeded for #916, #917 and #918 [V]. So label refusal is also per session [U cause].
- Fix: the PR body's first line is `Labels wanted: agent:<handle>, from:agent[, needs:founder]` when the label call fails. Karma applies them in one pass (`gh api -X POST repos/.../issues/<n>/labels -f 'labels[]=...'`). Add the same try-then-fallback line to the brief (done in `BRIEF-TEMPLATE.md` field 16).
- Owner: Karma. Founder: no.

## H3. Stacked PRs: retarget and add/add conflicts

Evidence [V `gh api pulls`, 20 Nov 18:20 UTC]: the photo stack is #835 (base `develop`), #836 on #835's branch, #837 on #836's, #838 on #837's, #839 on #838's, #840 on #839's. BL-952's stack #894 (base `develop`), #895 on #894's branch. BL-961's #879 on #871's branch. The skill `stacked-prs` section 5 records why a plain merge of `develop` into a slice conflicts after the base squash-merged: `develop` holds the base's work as one commit, the slice holds the base's commits (add/add).

Runbook (bottom-up; one slice at a time; each step has a stop):
1. Merge order is bottom first, only by Karma, only on two counted reviews at the head and green CI (D-132).
2. Slice N merged. For slice N+1: `gh api repos/.../pulls/<N+1> --jq '{base:.base.ref,head:.head.sha}'`.
3. Retarget with REST: `gh api -X PATCH repos/thesaurabhpareek/earlyletters/pulls/<N+1> -f base=develop`. `gh pr edit --base` needs GraphQL, which is blocked here (the error text from `gh pr list` in this session: "GitHub GraphQL is not available") [V]. That the `base` field is accepted is stated in `stacked-prs` section 4 as "not verified from GitHub's docs"; I could not fetch docs.github.com from this session (host not allowed) [U]. See the result of my own test in section H3.1 below.
4. Rebuild, do not merge: the recipe in `stacked-prs` section 5 (one commit, parents new base then old head; fast-forward push; never `--force`).
5. Run focused tests, then the workspace, then `tsc`, in the rebuilt tree before the push.
6. Post on the PR: `Delta since <old head>: git diff <old> <new> --stat` and the verdict that needs redoing. Reviews at the old head are stale (`review-gate` section 5).
7. After the last slice merges: delete the stack branches (founder or Karma; agents never delete another's branch).

Proposed script (exact design, not written): `scripts/agents/stack-status.mjs`, read-only: for each open PR whose base is not `develop`, print base PR number and state, whether the base merged, `mergeable_state`, and the `git merge-base` distance. It would have listed all of today's stack states in one table. Owner: ops proposes, founder reviews (path `scripts/agents/**` is `security-architect` review territory and the founder's).

Pitfall: a lower slice that changes after a higher slice is reviewed forces a merge of the lower branch into every slice above, so six slices become six new heads and six pairs of reviews. Hold the lower slice's edits until the stack is reviewed, or batch them (H4).

Owner: Karma (runbook), ops (script). Founder: for the script only.

### H3.1 Test of the REST `base` field [V]
On #918 I ran `gh api -X PATCH repos/thesaurabhpareek/earlyletters/pulls/918 -f base=develop`. It returned 200 with `base.ref` `develop`. So the field is accepted by the API from this session. That it retargets to a different branch is not shown (I did not move a PR to another base); the `stacked-prs` skill's runbook step stays the way to do it, and the first real retarget should record the result here.

## H4. Reviews that moved heads under a reviewer, and the 10-minute rule

- Evidence [V #847 section 2.1]: #836 has A and B PASS WITH NOTES at `4596b3c1`, head `3395e5a6`; #798's A and B were at `e7d399b3`, head `7f36031a`. Rounds to merge: median 3, mean 3.4; #834 took 4 rounds and 8 passes (#847 section 4.1). `merge-queue.mjs:189` returns STALE-REVIEW for this case [V]. Quiet rule: default `--quiet-minutes` 10 (`merge-queue.mjs:10, 219`) [V].
- Why the 10 minutes fail on a stack: CI takes about 20 minutes on a head (H5), so "CI settled and 10 quiet" can be 30 minutes of nothing, and a cascade push restarts it.
- Fixes:
  1. Review hold: a reviewer's first comment on a head is `<!-- agent:<handle> --> Review hold at <40-char sha>: the author does not push to this PR until the review posts`. The author agent obeys; the hold ends at the verdict or after 60 minutes. Today this is only a courtesy (the lessons file proposed it: `docs/agents/harness-v2/LESSONS-2026-11-08.md` section 1, "An author session does not push to a PR that holds a review claim") [V]. Make it a brief line (field 15 stop condition) and a line in `review-gate`.
  2. Cascade once: lower-slice edits are batched into one push per stack per review window; then every slice above is rebuilt once.
  3. Delta line: every push after a review carries `Delta since <reviewed sha>: <file list>`; the reviewer re-reads only that (`git diff old new`).
  4. A reviewer records the head at the start and at the end of the review; if it moved, the verdict names the earlier head and says "delta needed" instead of `PASS`.
- Owner: Karma (brief), `ai-eng-lead` (`review-gate` wording is a skill under `.claude/skills`, founder-approved path: propose). Founder: the skill edit is a repo `.claude` path (`security-architect` territory), so ask.

## H5. CI: the macOS queue, and cancelled or stale runs

Evidence [V `gh run list` and `gh api actions/runs/<id>/jobs`, 20 Nov 18:25 UTC; 25 newest "iOS compile" runs]:
- 11 of 25 runs were `cancelled`, 14 `success`.
- Run 44751811671 (`feat/mobile-photo-4a-pending`): the job "store-profile Release launch" was created 14:18:24 and started 15:24:26, 66 minutes of waiting, then ran 19 minutes. Run 44738026865: created 12:42:29, started 15:17:55, 155 minutes queued, ran 21 minutes. Run 44781265789 (17:13): started 2 seconds after creation, ran 21 minutes.
- Both workflows already cancel the older run on a new push: `ci.yml:13-15` (`cancel-in-progress` for pull requests) and `ios-compile.yml:46-48` [V]. So stale runs do cancel. The cost is the queue: six slices pushed together make six macOS jobs, and `runs-on: macos-26` is the scarce resource. Which runner limit applies is not visible from the repo [U].
- `ios-compile.yml` fires on every change under `apps/mobile/**` and `packages/**` (lines 35 to 40 of the workflow), tests and docs-in-package included [V]. For non-native PRs the merge-queue does not require the macOS checks (`merge-queue.mjs:193-198` is inside `if (row.native)`) and the branch protection requires only three contexts (`applied migrations unchanged`, `required`, `compliance-fence`) [V `gh api branches/develop/protection`]. So a docs or test change waits for nothing but still occupies a macOS runner for about 20 minutes.
- Fixes:
  1. Process, no founder: the cascade is pushed once, bottom-up (H3, H4). Karma batches pushes and does not push to a stack while its macOS job is queued.
  2. Workflow proposal (founder applies, under `docs/ops/proposed/`): add negative path filters so a change only under `apps/mobile/test/**` or `**/*.md` does not start `launch`. GitHub's `paths` accepts `!` patterns [U: not fetched; confirm with the Actions docs before applying]. Check that a test-only PR cannot change the bundle (a test file is not in the Release bundle) [E].
  3. Workflow proposal: `workflow_dispatch` already exists; document a one-job re-run command for the native PR only.
  4. Founder decision: whether to buy larger or more macOS runners, or accept the wait (spend; #847 Q6 family).
- A native PR (modules, `eas.json`, `app.config`, lockfile) is held by `WATCH-RED` or `WAIT-CI` until both macOS checks are green (`merge-queue.mjs:193-197`) [V]. Plan the native PR first in the day so it is not last in the queue.
- Owner: ops (proposal), Karma (process). Founder: yes for 2 to 4.

## H6. Usage-limit stops and the 3:01 restart

- Rule: Karma resumes every agent of the run at 3:01 AM PT (HARNESS-RUN, "If you stop"). On 20 Nov 2026 Pacific time is UTC-8 (daylight time ended 1 Nov), so that is 11:01 UTC [E from the calendar, not read from the scheduler].
- What works: the stub-first journal (OPERATING_MODEL section 5) and the check-in file survive a stop. A pushed branch survives; unpushed work does not (CLAUDE.md "Saving work").
- Gaps:
  1. A stub says only "started". A resumed session must re-derive state from the branch and check-in. The check-in line has `next:`, but it is written every 30 minutes, so up to 30 minutes of intent is lost.
  2. All sessions restart at once: the same macOS queue (H5) and the same review capacity (two lens sessions, #847 section 4.4) apply to every PR in the same minute.
  3. A stack mid-cascade restarts in the wrong order.
- Fixes:
  1. Add one line to every commit message body or check-in: `RESUME: branch=<name> pushed=<short sha> next=<one command or file>`. The resumed agent reads it first (a line in the brief, field 16).
  2. Stagger the restart: stacks bottom first (photo #835, BL-952 #894, BL-961 #871), then the rest; lens reviewers after at least two PRs have a settled head.
  3. The brief's field 15 keeps "the head of a PR you build on moves under you" as a stop condition, because a restart can do exactly that.
- Owner: Karma. Founder: no.

## H7. Review comments are read as founder instructions (latent)

- `isFounderComment` (`scripts/agents/lib.mjs:250`) trusts the account, and every session posts as the founder's account. A lens review starts with the header, not a machine marker, so it reads as a founder instruction and the dispatcher would hand its text to the author agent (`review-gate` section 2) [V]. No lane runs today (HARNESS.md:11), so there is no live effect.
- Fix: put `<!-- agent:<handle> -->` on line 2 of each review (the skill already says so); before the lane is switched on, `isFounderComment` must learn the review header. AIE-R22 and AIE-R30 own this.
- Owner: ai-eng-lead proposes; the code is the founder's. Founder: yes (lane switch is Q6 of #847).

## H8. Designs and the plan go stale within hours

- Seven cites in `docs/tdd/new-scope/*` were already wrong or fixed by the afternoon (`KNOWLEDGE-PACKS.md` section P-0.4) [V]. Three of them describe a bug that is fixed (consent key, sign-out reminders, quiet books): an agent that builds from the Fact would redo fixed work.
- Fix: (a) the brief's field 4 says "re-open every `file:line`"; (b) a `Checked at <sha>` on every brief's entry points; (c) Karma re-runs `git log origin/develop --since=<design time>` for the lane's paths before filling a brief. No tooling needed.
- Owner: Karma. Founder: no.

## H9. Tests that cannot fail

- The brief's field 2 and field 9 require: each new test fails on `develop` (name the assertion) and on one named mutant. #879's body shows the practice (it names the failing assertion on `develop` 20553b18) [V]. `photos-device.test.ts:405` and `:517` show the strong form for source scans: the scanner must flag every named mutant [V].
- The CI check for removed or skipped tests (AIE-G5) is not built [V chapter 09 gap table, AIE-G5 row]. Without it, only the reviewer sees `.skip`.
- Fix: the Definition of Done line in the template (done); `qa` writes the AIE-G5 patch as `docs/ops/proposed/`.
- Owner: Karma (brief), qa (patch). Founder: yes for the workflow.

## H10. Chapter 09 evidence is out of date (mine to fix)

- AIE-R18 and AIE-G10 say `develop` is unprotected (`protected: false`, 28 Oct). On 20 Nov `gh api repos/.../branches/develop/protection` returns required contexts `applied migrations unchanged`, `required`, `compliance-fence`, `required_approving_review_count` 0, `enforce_admins` true [V]. So CI is enforced at merge, reviews are not.
- Fix: refresh the evidence in the next standing run; the MUST text changes only with the founder's approval. Outside this task's folder, so not done here.
- Owner: ai-eng-lead. Founder: for any MUST text.

## Cites, all five files

- A script resolved every `path:line` in the five files: 90 distinct locations, all exist and are in range (file found in `git ls-files`, line number at most the file length).
- I read the line itself for 63 of them. 60 held as written. 3 were wrong and are corrected: `merge-queue.mjs` STALE-REVIEW is line 189 (not 187-188); the `ios-compile.yml` `paths` block is lines 35 to 40; `package.json:40` named the wrong package file (it is `apps/mobile/package.json:40`).
- Also checked by command: `gh api` branch protection and runs and jobs for 3 run ids, `gh api pulls` bases and sizes, roster and charter greps.
- Not verified: why journal and label calls were refused for other agents (I did not see the errors); the GitHub `paths` negation syntax and the `base` field of the pull-request update (docs.github.com is not reachable from this session); macOS runner limits; the design files under `docs/design/e2e` and `docs/design/system` beyond the index; cards 21 to 27.
