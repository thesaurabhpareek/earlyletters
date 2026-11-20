---
name: review-gate
description: Write or check a counted review on an Early Letters PR: the first line the merge queue counts, what a lens reads and runs, and when a review stops counting. Use for any review that gates a merge.
---

# Review gate (Early Letters)

Load this before you review a pull request whose merge needs two counted reviews, or before you ask Karma to merge one. The rules live in the files below; this skill says how to meet them. Cite them by id; do not restate them in a PR.

## 1. Sources of truth

| What | Where |
|---|---|
| Who merges, and the gate | `docs/DECISIONS.md` D-132 (Karma merges after two independent counted reviews on the current head and green CI); `docs/agents/COORDINATION.md` section 6 |
| The counted format | `.claude/skills/early-letters-cto/SKILL.md` section 4 ("strict counted format"); `scripts/agents/merge-queue.mjs` lines 19 to 24 and 72 |
| What a reviewer checks, in order | `docs/agents/OPERATING_MODEL.md` section 6; your charter; chapters by rule id (`docs/engineering/PRINCIPLES.md`) |
| Size | CODE-R02 in `docs/engineering/01-code-and-change.md` (400 lines, 20 files, or a `Size exception:` line) |
| Merge readiness, live | `node scripts/agents/merge-queue.mjs` (read-only; REST through `gh api`) |

## 2. The first line is the vote

`## Review A at <40-character head sha>: PASS` (or `Review B`).

- `merge-queue.mjs` reads only line 1 of a PR comment. It needs the full 40-character lowercase sha of the current head, and counts only comments whose author association is OWNER, MEMBER or COLLABORATOR.
- Only the exact word `PASS` meets a lens. `PASS WITH NOTES`, `CHANGES`, `BLOCKED` or any other word at the head blocks that lens until a later `PASS` (`merge-queue.mjs:47-51`, `:72`).
- No must-fix: write `PASS` and put the notes in the body. Any must-fix: write `CHANGES`.
- Get the head from the API (`gh api repos/<repo>/pulls/<n> --jq .head.sha`), never from a local branch. Start only when CI is settled and the head has been quiet 10 minutes; the review binds to the full 40-character sha (CR-44 as recorded in `docs/agents/harness-v2/LESSONS-2026-11-08.md` line 10; `merge-queue.mjs` WAIT-QUIET).
- A marker line such as `<!-- steward:<handle>:<sha> -->` or `<!-- agent:<handle> -->` on line 1 makes the comment uncounted. That conflicts with `OPERATING_MODEL.md` section 4 and AIE-R30, and the founder has not resolved it. Until he does, a review you post as Lens A or B starts with the header, and names you on its last line (`Reviewer: <handle>, independent of the author.`). A review in your charter's marker format is advisory: it is read, not counted.

## 3. The body

Keep this order; reviewers who skip a part leave the merger to redo it.

1. `Read:` the files and line ranges you read, the PR body, the rows it claims (`docs/BACKLOG.md` by id, the card in `docs/product/prd/`).
2. `Ran:` what you ran in a worktree at the head: focused tests, then the workspace; `tsc`; the content rules if strings changed. For each new test, run it over `develop`'s source and say how many go red: a test that passes on the old code proves nothing (AIE-R14). Name the mutations you tried and their result.
3. The merge check: `git merge-tree` (or a scratch merge with `--no-commit`) against `origin/develop`, and the required CI contexts at the head.
4. Numbered findings, most serious first, each with file and line and the rule id (constitution first, then privacy, access, tests, content, scope; `OPERATING_MODEL.md` section 6).
5. `Must fix:` the list, or `none`. `Notes`: the rest.
6. `Not verified:` device, simulator or anything you did not run.
7. The last lines: `This <verdict> holds at this exact head. Re-read if the head moves.` and the reviewer line.

## 4. When a review stops counting

- The head moves (a new commit, a merge of `develop`, a rebuild): every earlier review is stale. Re-review the delta with `git diff <old head> <new head>` and post a new header at the new head.
- The two lenses must be independent of the author and use different lenses (D-132; CTO skill section 4): a session that wrote the code does not review it.
- A review by an account outside OWNER, MEMBER or COLLABORATOR never counts on this public repo.
- Every session posts as the founder's account, so independence is of method, not of identity (CTO skill section 4). Say so when it matters.

## 5. Evidence this is repeated know-how

- #828, #829, #831 and #832 (merged into `develop` on 19 and 20 Nov) each carry Review A and Review B comments in this header at the merged head.
- All four merged at heads where both lenses wrote `PASS WITH NOTES`, which `merge-queue.mjs` reports as BLOCKED-REVIEW. Writing `PASS` with notes in the body satisfies both the tool and the CTO skill. Which word counts is Karma's ruling to make.
- The red-team and five steward charters still describe the marker format (`<!-- red-team:<sha> -->`, `<!-- steward:<handle>:<sha> -->`), used by the dispatcher, which has not run (`docs/agents/HARNESS.md` line 11).
