---
name: stacked-prs
description: "Split an Early Letters change that is over the CODE-R02 limit into stacked PRs, keep the stack reviewable, and rebuild a branch onto a moved base with no force push. Use when a diff is too big or its base moved."
---

# Stacked PRs and the rebuild recipe (Early Letters)

Load this when a change will not fit CODE-R02 (400 changed lines and 20 files, not counting the lockfile, generated files and test data), when you put one PR on top of another, or when the branch under yours merged or moved.

## 1. Rules you are meeting (cite them, do not restate them)

- CODE-R01, CODE-R02 and the PR checklist in `docs/engineering/01-code-and-change.md` ("split by layer: types, then logic plus tests, then wiring"). Over the limit means split, or `Size exception: <reason>` in the PR body for the founder to accept (CODE-R02); an agent never grants itself an exception (chapter 09, "Exceptions").
- AIE-R13: work that will not fit is split in the backlog row first.
- `docs/DEVELOPMENT.md` line 15: a stacked PR names its base in the description and retargets to `develop` when the base merges.
- `docs/agents/OPERATING_MODEL.md` sections 2 and 4: never rebase, never force-push, resolve a conflict by a merge commit.
- A counted review holds only at the head it names (`review-gate` skill), so every new head needs new reviews.

## 2. Plan the stack

1. One slice per concern, each with a test that fails on the code below it.
2. Order the slices so each one builds and passes on its own base, for example native module, then storage and migration, then screens, then the reading view (BL-931 in `docs/BACKLOG.md` gives the photo stack's actual order).
3. Every slice sits behind the card's switch, default off (`apps/mobile/src/lib/capabilities.ts`), so a merged lower slice changes nothing a parent sees. State a flag-off proof in each PR body.
4. Branch per slice: `feat/<area>-<card>-<n><letter>-<what>`, for example `feat/mobile-photo-3b-stored-copy`. Put the BL id in the PR title or the branch (`OPERATING_MODEL.md` section 4): the dispatcher's taken check reads it from either (`takenIds`, `scripts/agents/lib.mjs:137-145`).
5. A slice that grows past the limit splits again (`2`, `2b`, `2c`), and the stack list in every body is updated.

## 3. Each PR body

`Base:` and `Branch:` lines first. Then what and why, the rows it satisfies, the tests (and which go red on the base), the flag-off proof, `Not verified:`, and a "Stack and merge" list naming every slice, its PR and its base. Each PR targets the slice below it, so its diff is only its own.

## 4. When the slice below changes or merges

- The slice below gets new commits: merge that branch into yours (a merge commit), run the tests, push. Reviews on your old head are stale.
- A slice is never merged into the slice below it. Slices merge only into `develop`, from the bottom of the stack up, by Karma (D-132).
- The slice below merges into `develop`: retarget your PR to `develop`, merge `origin/develop` into your branch, run the tests, push. `gh pr edit --base` needs GraphQL, which is blocked here; the REST update of the pull request takes a `base` field (not verified from GitHub's docs in this skill's session: read `.base.ref` in the response).

## 5. The rebuild recipe (a squash-merged base, or a branch far behind its base)

After a squash merge, `git merge origin/develop` conflicts with the base's own commits, which `develop` holds as one squashed commit. Replay only your own delta onto the new base instead, as one commit with two parents: the new base first, your old head second. The push is then a fast-forward. The PR keeps its history and its review comments, but every review is stale at the new head.

- The new base (`BASE` below) is `origin/develop` when your PR targets `develop`, and `origin/<base branch>` when your PR is stacked on a base that has not merged.
- `<branch>` is your own PR branch: never `develop`, `main` or `release/*`.

```bash
BASE=origin/develop                                   # or origin/<base branch> for a PR stacked on an unmerged base
git fetch origin develop <branch>                     # and <base branch> when stacked
OLD=$(git rev-parse origin/<branch>)
FROM=<the commit your delta starts from: the old base head, or git merge-base output>
git diff "$FROM" "$OLD" > <scratchpad>/own.patch      # drop files the new base already carries
git worktree add --detach <scratchpad>/rebuild "$BASE"   # never inside the repo checkout
cd <scratchpad>/rebuild && git apply --3way <scratchpad>/own.patch   # resolve each conflict by hand
```

Before anything is pushed:
1. Run the focused tests, then the workspace, then `tsc`, in the worktree; its files are now the rebuilt tree (`OPERATING_MODEL.md` section 4; AIE-R14). Stop here if anything is red.
2. Make the commit: `git add -A && TREE=$(git write-tree) && NEW=$(git commit-tree "$TREE" -p "$BASE" -p "$OLD" -F <scratchpad>/msg.txt)`. The message says what moved, that the old head is kept as a parent, each conflict and how it was resolved, and "no content change against the reviewed head" only if that is true.
3. Check: `git diff "$BASE" "$NEW" --stat` is your delta and nothing else; `git diff "$OLD" "$NEW"` is the base's changes plus the conflicts you resolved.

Then push, `git push origin "$NEW":refs/heads/<branch>` (a fast-forward, because `OLD` is a parent; never `--force` or a `+` refspec), remove the worktree, and ask for reviews at the new head, pointing reviewers at `git diff "$OLD" "$NEW"`.

## 6. Evidence this is repeated know-how

- Rebuild commits with the new base as first parent and the old head as second. 8494c6b2 (#764: be1c1142, a `develop` commit, and d22dcb20) and 68294bc6 (#798: 09a104da on `develop`, and 6ff39d75) rebuilt onto `develop`. 8a026397 (#796: a80648d4 and 39efe1ac) rebuilt onto an unmerged base: a80648d4 is #828's head, `develop` 09a104da plus #828, which was not yet merged.
- The photo stack: #796 (64 files, 3,747 added lines) split into slices #834, #841, #842 and #835 to #840, each targeting the slice below (BL-931; #835 body, "Stack and merge").
- `docs/product/prd/13-engineering-plan.md` section 3 E lists "Split the oversized photo change into five" as engineering work.
