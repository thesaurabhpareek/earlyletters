# BRIEF BL-975-ACT: turn on the privacy label guard (the workflow is written; the founder applies it)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: the founder copies `docs/ops/proposed/workflows/label-guard.yml` to `.github/workflows/label-guard.yml` (D-124: agents cannot edit workflows). Scripts and tests of BL-975 merged on 20 Nov (#897, #898, #906); only the activation and two follow-ups remain.** Founder-only: the copy, adding the job to branch protection if he wants it required, the label decision itself (counsel Q54 decides the label; the guard never does).

```
BRIEF BL-975-ACT                                  Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: 13 (guard on before photo flags turn on in 14)   Wave: 1

1. GOAL: When a PR adds an SDK, an entitlement, a usage string or a content-carrying network call, the `label guard` job on that PR is red until
   the body names a decision that names the label, and every one of today's open PRs passes or fails for a reason a person can read.

2. CARD ROWS and TEST TITLES: NS-07-G11-1a, -1b, -1c, -3, -4, -5 (card 07 section 5; test file apps/mobile/test/label-effect.test.ts at lines 42, 71, 78, 95, 146 [V]).
   Titles exist and are bracketed (`[NS-07-G11-1a] ...`), but `trace` lists them as "NS id defined nowhere" because develop's cards lack the ids until #846 merges [V, trace run].
   New tests (this brief): a dry run of the proposed job over the 12 newest merged PRs, listing which would have been red (pasted in the PR; expected few);
   `apps/mobile/test/label-guard-workflow.test.ts` titled `[NS-07-G11-5] the proposed job runs the base copy of the guard on pull requests and edits` (reads the
   proposed YAML: trigger types include `edited`, `permissions: contents: read`, script path is the base worktree's). Red today: the file does not exist.

3. FILES
   Touch: docs/ops/proposed/workflows/label-guard.yml (only the follow-ups below), docs/ops/LABEL_GUARD.md, apps/mobile/test/label-guard-workflow.test.ts (new),
          scripts/release/label-effect.mjs (follow-up (b) only; ops owns scripts/release), docs/agents/checkins/ops-rd-h3-975.md
   Never: .github/workflows/**, docs/DECISIONS.md, docs/legal/** (counsel, founder merges), card files.
   Shared file: label-effect.mjs is read by BRIEF CI-SIZEGATE (native-size rule); whichever lands second merges develop.

4. READING PACK: Pack 10 items 1 and 4; docs/ops/LABEL_GUARD.md (all); scripts/release/label-effect.mjs header (lines 1-20); the proposed workflow (all, ~50 lines);
   SECURITY-OPEN-QUESTIONS.md K-7 (#915): "no label-guard.yml in .github/workflows" [V].

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/release/label-effect.mjs:1-20     checks G11-1a, G11-3, G11-2 and the record rule; exit 0 pass, 1 finding, 2 guard could not run
   docs/ops/proposed/workflows/label-guard.yml  triggers `pull_request` to develop with types opened, synchronize, reopened, edited; checkout and setup-node pinned by SHA
   .github/workflows/                        no label-guard.yml [V ls]
   docs/legal/app-store-privacy-labels.md    the label file the record rule requires a change to

6. DATA AND SECURITY: no data class. The PR body reaches the script only through an environment variable (proposed YAML header), never through shell text; the job runs
   the base branch's script so a PR cannot loosen it. Boundary: NSC-02 entitlement allowlist and G11 (SECURITY-PRIVACY-ACCEPTANCE-2-CARDS.md row E, #914). Read: compliance-engineer,
   security-architect. Fail closed: exit 2 fails the job.

7. LIBRARIES: none.
8. BUDGETS: job timeout 3 minutes in the proposal; [E] about 30 seconds.

9. ACCEPTANCE: (a) the founder-facing note in the PR: the exact `cp` and the one branch-protection decision (required or advisory; Rec advisory for two weeks of green, as #806 does);
   (b) follow-up: the rule "a new native dependency or folder under apps/mobile/modules needs `Native-size: <KB before, after, source>` in the PR body" (MEASUREMENT-PLAN 5.1; Rec, not decided);
   (c) the dry run table. Done also means the new test is red on a mutant: change the trigger types in the proposal to drop `edited`.

10. PR BREAKDOWN: PR 1 (follow-up (a) and the workflow test) ~120 lines, 5 files; PR 2 (b) ~80 lines | base develop | no flag.

11. LENSES: A compliance-engineer (label), B security-architect (workflow).

12. ORDER: any time; the copy is the founder's one-minute step. Before BL-858/BL-931 flags turn on in Build 14. Blocked by the founder for the copy only.

13. DONE: [ ] focused test then `npm test -w apps/mobile` (baseline 8 files fail for missing expo modules); [ ] tsc 5 known errors; [ ] ASCII only; [ ] PR body per HARNESS-RUN
    with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE (or the founder) CAN PROVE: the job appears on the next PR after the copy and goes red on a planted SDK in a throwaway PR.

15. STOP AND ASK: the guard flags a merged PR that counsel says was fine (a false positive: do not loosen the guard, report); the proposed YAML needs a permission beyond
    `contents: read`; a decision id format change in DECISIONS.md.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-975 agent:ops -->`; branch chore/ops-bl-975-label-guard-activation; labels agent:ops, from:agent, needs:founder.
```

Note (review A 4): the workflow test reads `docs/ops/proposed/workflows/label-guard.yml`; when the founder copies the file to `.github/workflows/`, the test then reads `.github/workflows/label-guard.yml` (one path constant, changed in the founder's paste).
