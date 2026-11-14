# Interactive orchestration: the playbook

Status: in use since 15 Oct 2026 by the build thread; written down 28 Oct 2026 (retro package H8). This is how work actually reached `develop`: a coordinator-led interactive thread, two independent lens reviews on the current head, a fix loop, and one merge at a time. It describes practice. It changes no rule: the roles and the merge rule live in `COORDINATION.md` sections 1 and 6 and in D-107 and D-117 (`docs/DECISIONS.md:630`, `:640`, `:809`). Where this file and those disagree, those win.

Evidence below comes from the GitHub REST API (read 28 Oct 2026) and the retro snapshot (`prs.json`, `pr_threads.json`, taken 28 Oct, newest merge 03:56 UTC). "Unverified" means I could not check it.

## 1. Claim before you build

1. Add a claim line in `docs/agents/BOARD.md` with file globs and a branch name, as `COORDINATION.md` section 2 says. A stream with no pushed branch is "not started", not "working".
2. Work in your own worktree from `origin/develop`. One concern per PR.

Why: on 15 Oct two threads built the same streams at once; #141, #142 and #147 were closed as duplicates of #139, #140 and #146, and #142 and #140 both created migration `20261015000000` (panel 06, close comments on #142). BOARD.md rows S14, S15, S18 and P8 were "reported working" with no branch, PR or check-in on origin (BOARD.md, 27 Oct).

## 2. Build, check in, push

- Check in every ~30 minutes in your own file, `docs/agents/checkins/<agent>.md`, at most 3 lines (`COORDINATION.md:21`). Per-agent files ended the BOARD.md append conflicts that cost three merge cycles on 17 Oct (`COORDINATION.md:23`, #224).
- Commit and push at least every 30 minutes (`CLAUDE.md`, "Saving work"). A usage limit can end a session at any time: the 3 Oct wave commit `9be06dbe` was "interrupted by usage limit", and the program stopped from Sat 24 Oct, 5:10 AM PT to Tue 27 Oct, 1:00 PM PT (`docs/qa/ALPHA_GO_NO_GO.md:5`).
- The PR body lists the globs it touched, what was not verified, and the checks run with exit codes.

## 3. Two lenses on the current head

The coordinator starts two reviewers that did not write the change and do not see each other's verdict:

| Lens | Looks at |
|---|---|
| A | Correctness, tests, mutants: does the diff do what the body says and nothing else; does each test fail when its line is mutated; CI and `git merge-tree` against develop |
| B | Security, privacy, product, docs: the constitution, access rules and secrets, privacy rules, content rules, decisions and requirement ids, founder-facing text |

Generate each brief with `node scripts/agents/lens.mjs brief <pr> --lens a` (and `--lens b`). It is read-only and pins the head sha. Each lens posts one PR comment that starts with:

```
<!-- lens:a:<full head sha> -->
Verdict: pass | pass with notes | fail
## Review A (<scope>), PR #<n> at <sha7>: PASS WITH NOTES
```

The marker is the same family as the red team's `<!-- red-team:<sha> -->` (`scripts/agents/verdicts.mjs`) and the stewards' `<!-- steward:<handle>:<sha> -->` (`scripts/agents/lib.mjs:385`). The heading line is the shape the threads already wrote by hand on #284, #290, #293 and #303; `lens.mjs` reads both, so old comments still count.

Why two lenses work: they caught real defects. #34's lens (a) failed a contract mismatch and a drift test that skipped all 157 checks (merge-train comment on #34, 16 Oct). Lens B failed #293 twice on records that contradicted the evidence, and failed #303 once because the doctor and the preflight disagreed (comments on #293 and #303, 27 to 28 Oct). Of 154 PRs merged into develop or main from 15 Oct 00:00 UTC to the snapshot, 151 had a comment or review before merge (my count from the snapshot; panel 06 gives 154 of 156 with a different cut).

## 4. Fix loop

1. The fixer pushes new commits on top (no rebase, no force-push) and posts a note that lists each item fixed and the new head, for example `<!-- agent:release-engineering -->` on #303.
2. Each lens then posts a delta re-check of `git diff <old>..<new>`, with heading `## Review A delta re-check, PR #<n> at <new> (<old>..<new>): PASS` and marker `<!-- lens:a:<new> base:<old> -->`.
3. Repeat until both lenses pass on the same head. #303 took four heads (b7e8d0f, 081b18b, 2d36097, e44e4f5); #293 took four (f54c0e4, fab871a, 4ea7fe0, 48d49bb).

## 5. The merge rule, checked by a script

D-117's operating rule: two independent passing reviews on the current head and green CI (`COORDINATION.md:57`). Before merging, run:

```
node scripts/agents/lens.mjs check <pr>
```

It reads the PR's comments and reviews (GET only), keeps the newest trusted verdict per lens, and exits 0 only when lens A and lens B both pass on the PR's current head and every check run on that head succeeded. Any push after a verdict makes that verdict stale, including a docs-only or merge commit.

What the record shows today: run on the merged heads, the check passes for #276, #284 and #290, and fails for #293 and #303. #293 merged at 48d49bb with lens A's newest verdict on 4ea7fe0; #303 merged at e44e4f5 with lens B's newest verdict on 2d36097 (fixtures in `scripts/agents/lens.test.mjs`). On #293 three kill-harness runs on the merged head show "cancelled", completed at 22:43 UTC, after the 22:38 merge. Whether the coordinator judged those last commits safe without a second re-check is not recorded (unverified). The fix is cheap: a delta re-check of a docs-only commit is a few lines.

## 6. Merge train

- One PR at a time. Before each merge, merge `develop` into the branch if it moved (no rebase) and confirm `git merge-tree --write-tree <head> origin/develop` is clean, as the lenses did on #290.
- A held or blocked PR gets one `<!-- merge-train -->` comment that says why and what unblocks it (27 such comments in the snapshot, for example #26 and #34).
- Do not batch: 46 PRs merged on Fri 23 Oct, the highest day in the snapshot. Big days make a bad merge hard to find.

## 7. Usage pacing

- One subscription carries every interactive thread and every scheduled task, with no budget between them (panel 06; `scheduled-tasks.md` in the retro shows the docs run and PRD run both failing with USAGE_LIMIT_REACHED on 27 Oct, 13:06 and 13:31 UTC).
- A lens pair costs two reviews per head. Keep PRs small so a delta re-check is short. Push before starting reviewers.
- The build thread's cap of 5 live agents is reported in the retro brief (unverified). A shared budget with a reserved share for interactive work is retro package H3.

## 8. What the record cannot prove

- Independence. Every lens comment is posted from the founder's account, and both lenses are sessions of the same model started by the same coordinator. None of the 22 comments on #276, #284, #290, #293 and #303 (20 lens verdicts, 2 fixer notes) names a reviewer session. Add `Reviewer: <session id>` as the fourth line; `lens.mjs` then flags two lenses that name the same reviewer.
- Verdicts outside GitHub. #307 recorded "lens A PASS ... lens B PASS WITH NOTES" only in its squash commit message (6bfb94a9) and has no PR comments, so no script can check it. Post the verdict on the PR.
- Enforcement. Nothing blocks a merge yet: `develop` has no branch protection (retro synthesis, section 1, row 3). `lens.mjs check` is a check the coordinator runs, not a gate.

## 9. How this fits the rest of the harness

- `scripts/agents/verdicts.mjs` keeps the red team's mix; `lensRows()` returns the same row shape (`[sha12, verdict, at]`) plus the lens letter.
- `scripts/status/page.mjs` (open PR #339) parses lens headings for the founder page; it can import `parseLens` and `lensState` from `lens.mjs` instead of keeping its own copy.
- Trust: `lensRecords()` takes a `lib.mjs` trust context or any predicate, so the agent-identity work (H1) changes who counts without changing this file.
- The dispatcher (`dispatch.mjs`) is not changed. Wiring a merge gate is one call: `mergeCheck({ records, head, ci })`.
