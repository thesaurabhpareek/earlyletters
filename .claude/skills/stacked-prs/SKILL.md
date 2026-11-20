---
name: stacked-prs
description: Split an Early Letters change that is over the CODE-R02 limit into stacked PRs, keep the stack reviewable, and rebuild a branch onto a moved develop with no force push. Use when a diff is too big or its base moved.
---

# Stacked PRs and the rebuild recipe (Early Letters)

Load this when a change will not fit CODE-R02 (400 changed lines and 20 files, not counting the lockfile, generated files and test data), when you put one PR on top of another, or when the branch under yours merged or moved.

## 1. Rules you are meeting (cite them, do not restate them)

- CODE-R01, CODE-R02 and the PR checklist in `docs/engineering/01-code-and-change.md` ("split by layer: types, then logic plus tests, then wiring"). Over the limit means split, or `Size exception: <reason>` in the PR body.
- AIE-R13: work that will not fit is split in the backlog row first.
- `docs/DEVELOPMENT.md` line 15: a stacked PR names its base in the description and retargets to `develop` when the base merges.
- `docs/agents/OPERATING_MODEL.md` sections 2 and 4: never rebase, never force-push, resolve a conflict by a merge commit.
- A counted review holds only at the head it names (`review-gate` skill), so every new head needs new reviews.

## 2. Plan the stack

1. One slice per concern, each with a test that fails on the code below it.
2. Order the slices so each one builds and passes on its own base: native module, then storage and migration, then logic, then screens, then the reading view (the order of BL-931 in `docs/BACKLOG.md`).
3. Every slice sits behind the card's switch, default off (`apps/mobile/src/lib/capabilities.ts`), so a merged lower slice changes nothing a parent sees. State a flag-off proof in each PR body.
4. Branch per slice: `feat/<area>-<card>-<n><letter>-<what>`, for example `feat/mobile-photo-3b-stored-copy`.
5. A slice that grows past the limit splits again (`2`, `2b`, `2c`), and the stack list in every body is updated.

## 3. Each PR body

`Base:` and `Branch:` lines first. Then what and why, the rows it satisfies, the tests (and which go red on the base), the flag-off proof, `Not verified:`, and a "Stack and merge" list naming every slice, its PR and its base. Each PR targets the slice below it, so its diff is only its own.

## 4. When the slice below changes or merges

- The slice below gets new commits: merge that branch into yours (a merge commit), run the tests, push. Reviews on your old head are stale.
- The slice below merges into `develop`: retarget your PR to `develop`, merge `origin/develop` into your branch, push. `gh pr edit --base` needs GraphQL, which is blocked here; the REST update of the pull request takes a `base` field (not verified from GitHub's docs in this skill's session: read `.base.ref` in the response).

## 5. The rebuild recipe (a squash-merged base, or a branch far behind `develop`)

After a squash merge, `git merge origin/develop` conflicts with the base's own commits, which `develop` holds as one squashed commit. Replay only your own delta onto `develop` instead, as one commit with two parents: `develop` first, your old head second. The push is then a fast-forward and the PR keeps its history and reviews.

```bash
git fetch origin develop <branch>
OLD=$(git rev-parse origin/<branch>)
FROM=<the commit your delta starts from: the old base head, or git merge-base output>
git diff "$FROM" "$OLD" > <scratchpad>/own.patch     # drop files develop already carries
git worktree add <scratchpad>/rebuild origin/develop  # never inside the repo checkout
cd <scratchpad>/rebuild && git apply --3way <scratchpad>/own.patch   # resolve each conflict by hand
git add -A && TREE=$(git write-tree)
NEW=$(git commit-tree "$TREE" -p origin/develop -p "$OLD" -F <scratchpad>/msg.txt)
git push origin "$NEW":refs/heads/<branch>           # a fast-forward, because OLD is a parent
```

Then:
1. Check: `git diff origin/develop "$NEW" --stat` is your delta and nothing else; `git diff "$OLD" "$NEW"` is `develop`'s changes plus the conflicts you resolved.
2. The commit message says what moved, that the old head is kept as a parent, each conflict and how it was resolved, and "no content change against the reviewed head" only if that is true.
3. Run the focused tests, then the workspace, then `tsc`, in the worktree. Remove the worktree after.
4. Ask for reviews at the new head; point reviewers at `git diff "$OLD" "$NEW"`.

## 6. Evidence this is repeated know-how

- Rebuild commits with `develop` as first parent and the old head as second: 8494c6b2 (#764, parents be1c1142 and d22dcb20), 8a026397 (#796, a80648d4 and 39efe1ac), 68294bc6 (#798, 09a104da and 6ff39d75).
- The photo stack: #796 (64 files, 3,747 added lines) split into slices #834, #841, #842 and #835 to #840, each targeting the slice below (BL-931; #835 body, "Stack and merge").
- `docs/product/prd/13-engineering-plan.md` section 3 E lists "Split the oversized photo change into five" as engineering work.
