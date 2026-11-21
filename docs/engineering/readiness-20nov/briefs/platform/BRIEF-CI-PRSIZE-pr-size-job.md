# BRIEF CI-PRSIZE: a PR-size check, 400 lines and 20 files (CODE-R02, CODE-G1)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder says how a size exception is proved. CODE-R02 says only the founder accepts one; a line in a PR body can be written by anyone, so the job needs a proof an agent cannot forge (Rec: a label only the founder sets, or his approving review). Without that choice the job can only report. The job is a workflow edit: founder applies.** Founder-only: the proof rule, the paste, making the job required, every exception.

```
BRIEF CI-PRSIZE                                   Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: any   Wave: 1 (the photo and BL-952 stacks are measured against this daily)

1. GOAL: When a pull request changes more than 400 lines or 20 files (lockfile, generated files, fixtures, golden corpora and doc images excluded), the check prints the two numbers and fails unless the founder's exception proof is present.

2. CARD ROWS and TEST TITLES: CODE-R02 (docs/engineering/01-code-and-change.md:31, a MUST), CODE-G1 (ENFORCEMENT.md:16 is the CODE-R02 row, :66 the CODE-G1 definition [V]), AIE-R13 (:231). No NS row.
   Tests: scripts/guards/pr-size.test.mjs [no root runner lists scripts/guards tests today: grep package.json and workflows, 0 hits V, so wire it into root `test` (package.json:11) in the same PR]:
     [CODE-R02] 401 changed lines fails            [CODE-R02] 21 files fails            [CODE-R02] a lockfile-only change of 3,000 lines passes
     [CODE-R02] an exception line without the founder's proof still fails
   Red on develop: the script does not exist; no workflow has a size step (grep).

3. FILES
   Touch: scripts/guards/pr-size.mjs and .test.mjs (new), package.json (root `test` list, one entry), docs/ops/proposed/workflows/pr-size.yml (new), docs/engineering/ENFORCEMENT.md (CODE-R02 row: steward),
          .github/pull_request_template.md is NOT edited (founder-owned path of the PR template: ask), docs/agents/checkins/ops-rd-h3-prsize.md
   Never: .github/workflows/**; counting docs/** images or `docs/**` text out of the total (docs count; only images are excluded, per eval C 3.6 as read in CODE-QUALITY-GATES.md G8).

4. READING PACK: Pack 10 item 1; 01-code-and-change.md:31; CODE-QUALITY-GATES.md G8 (#930); the `Size exception:` line named in HARNESS-RUN.md of this run and BRIEF-TEMPLATE.md section 1; plan 5.2 rows 14, 14a (existing exceptions: photo slices #835 783, #836 1,015, #837 732, #838 629, #839 603 lines).

5. CODE ENTRY POINTS (verified at 16e61549)
   .github/pull_request_template.md   has no size line [V]
   ci.yml                              no size step [V grep]; concurrency block at :13-15 cancels older runs of the same PR
   scripts/agents/merge-queue.mjs:189  today's merge gate: reviews and CI only, no size [V]
   Measure like this: `git diff --numstat origin/<base>...HEAD`, binary files count 0, renames count the changed lines only (`-M`).

6. DATA AND SECURITY: no data class. The PR body is untrusted input: read it through an environment variable, never in shell text (same rule as the label guard). `pull_request` not `pull_request_target`. Boundary: workflow injection (security-architect).

7. LIBRARIES: none.
8. BUDGETS: under 30 seconds, `fetch-depth: 0` checkout; no install.

9a. REVIEW B FIXES: (i) a label can be set by any collaborator or agent token, so the job must read WHO applied `size:accepted` (`GET repos/<repo>/issues/<n>/events`, the newest `labeled` event's actor) and accept only the repository owner; an agent-applied label is ignored and printed. Test: `[CODE-R02] a size label applied by anyone but the owner does not pass`. (ii) the "fixtures" exclusion can hide real code: exclude only exact paths (`**/__fixtures__/**`, golden corpora dirs listed in a constant, `package-lock.json`, `**/generated/**`), cap the excluded lines at 2,000 and fail above, and print them. Test: `[CODE-R02] 3,000 lines under a fixtures-named folder that is not on the list count`.
9b. NOTES (review B 2 to 4, review A 4 to 6): the job's permissions are `contents: read`, `pull-requests: read`, `issues: read` and nothing wider; a fork PR cannot read these with the default token, so forks are not checked (agent PRs are same-repo). The job checks out with `fetch-depth: 0` (section 8) and so needs no fetch step; section 11's mention of the CI-PIN fetch step is dropped. The lockfile is excluded from the count, so a lint cleanup PR of about 300 lines is not read as over 400. The root `package.json` `test` line is also edited by QA-TITLES (PR #950): whichever lands second merges develop first.
9. ACCEPTANCE: output `lines 312 / 400, files 11 / 20` on every PR; the exclusion list is a constant with a test per entry; the exception rule is whichever the founder picked (Rec: label `size:accepted` plus the body line `Size exception: <reason>`;
   [U whether agent tokens can set labels: HARNESS-GAPS H2 says label calls were refused for some sessions, allowed for others]). Done also means red on a mutant: raise the limit to 401 in the script and the 401-line test goes red.

10. PR BREAKDOWN: PR 1 script + tests ~140 lines, 3 files; PR 2 workflow proposal ~60 lines, 2 files | base develop | advisory until the founder pastes it.

11. LENSES: A principal-architect (`scripts/*.mjs`), B qa. Wiring: scripts/guards tests are in no CI list [V], so the test goes in the root `node --test` list (package.json:11, compliance-engineer reads `package.json`). The base-branch fetch the label check and diff need is the single `unit` step in BRIEF CI-PIN section 10 (the label check in the `unit` job only; the PR-size job itself uses its own `fetch-depth: 0` and needs no such step, as 9b says).

12. ORDER: any time. Before the Build 14 stacks start (they are the PRs it will measure). Blocked by the founder's proof choice.

13. DONE: [ ] `node --test scripts/guards/pr-size.test.mjs`; [ ] `npm test` baseline; [ ] ASCII; [ ] the script run on #835 (783 lines) reports a failure and on #840 (342) a pass; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing.

15. STOP AND ASK: whether docs count; whether tests count (CODE-R02 counts them [U: re-read :31]); whether merge commits and stacked PRs measure against their stack base or `develop`.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-prsize agent:ops -->`; branch chore/ops-pr-size-check; labels agent:ops, from:agent, needs:founder.
```
