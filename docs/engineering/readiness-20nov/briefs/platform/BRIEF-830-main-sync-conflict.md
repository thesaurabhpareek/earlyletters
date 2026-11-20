# BRIEF 830: bring develop to main (the #830 conflict), so the release branch can be cut

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549 and `origin/main` 6863f996, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder says how main takes develop (merge commit or squash) and later names the PR with its full 40-character sha. The agent prepares the resolution branch and a report; it does not merge, push to `main` or `develop`, or approve.** Founder-only: the choice, the sha, the merge. Two counted reviews first (plan 2.7 row #830).

```
BRIEF 830                                         Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: 13 path   Wave: 1

1. GOAL: When the release PR is opened, a branch that is develop plus main merges into `main` with no conflict, and
   `git diff origin/develop <branch>` is empty except for named, reviewed lines from main.

2. CARD ROWS and TEST TITLES: none (release plumbing). Proof, run in a scratch worktree and pasted in the PR:
   (a) `git merge-tree --write-tree origin/main <branch>` prints no CONFLICT; (b) `git diff --stat origin/develop <branch>`
   lists only the files in section 5; (c) `npm test` and `cd apps/mobile && npx tsc --noEmit` on <branch> show only the
   baseline failures. Red today: `git merge-tree --write-tree origin/main origin/develop` prints 64 CONFLICT lines
   (17 add/add, 46 content, 1 modify/delete) [V, 20 Nov].

3. FILES
   Touch: a new branch `chore/release-main-sync-20nov` only (a merge commit; no file edited by hand except conflict
          resolutions listed in the PR), docs/agents/checkins/ops-rd-h3-830.md
   Never: `develop` and `main` themselves; #830's head (it is `develop`, a branch the agent cannot push to); any
          resolution that deletes develop's work; .github/workflows/** by hand (take develop's side).

4. READING PACK: Pack 10 item 1; docs/ops/RELEASE.md sections 0 and 1.1 (cut from main; the release PR); the body of #830;
   docs/DEVELOPMENT.md line 15 (branches).

5. CODE ENTRY POINTS (facts, verified 18:50 UTC)
   merge base `ced6f7b4`; develop is 224 commits ahead, main 3 ahead (#786 squash of an old develop, #600, #573) [V].
   Why 64 conflicts: #786 landed as a squash, so main holds the content of older develop commits as one new commit.
   Main's rules: linear history OFF, merge commits allowed, required checks `required` and `applied migrations unchanged` [V gh api].
   Rehearsal [V, scratch worktree, discarded]: `git merge --no-commit --no-ff -X ours origin/main` on develop leaves ONE conflict
   (modify/delete: apps/mobile/src/components/family/coparent-soon.tsx, develop deleted it in #720; take the deletion) and
   adds 41 lines in 7 more files from main that develop lacks: `(tabs)/_layout.tsx`, `settings/children/[id].tsx`,
   `test/draft-card.test.ts`, `test/preflight-production.test.ts`, `apps/web/test/copy-rules.test.ts`,
   `docs/store/compliance/privacy-labels-apple.md`, `scripts/release/with-review-contact.ts`. Each of these must be read and
   either kept (it is a real main-only fix) or reverted to develop's (a stale squash leftover). Do not accept them blind. And this list is NOT enough: `-X ours` also drops main-only hunks inside conflicting regions silently, and `git diff --stat origin/develop <branch>` shows only non-conflicting lines. Main's 3 commits touch 656 files (4 of them migrations; also preflight scripts and functions) [V `git diff --name-only <merge-base> origin/main`]. The PR must carry a per-hunk review of main's three commits (`git show <commit>` hunk by hunk, each marked kept or already in develop), not only the stat.
   .github differs between main and develop in 4 workflows (ios-compile, kill-harness, release-ios, testflight): take develop's.

6. DATA AND SECURITY: no data class. Risk: `-X ours` silently drops a main-only fix. Mitigation: a per-hunk review of main's 3 commits (not the stat of section 2(b), which is incomplete), each hunk justified in the PR. Read: security-architect (.github), data-steward (supabase). Main and develop hold the same 31 migration files [V ls-tree], so this merge adds no migration; main applies none anyway (DEPLOY.md: only a `db-v*` tag does).

7. LIBRARIES: none.
8. BUDGETS: none.

9. ACCEPTANCE: PR body has the five items: the command log, the 7 file decisions, the empty-conflict proof, the test baseline,
   and the sentence "the founder names this PR with its full sha". Also states the next-time rule: use a merge commit for the
   release PR (not a squash), or the divergence repeats [E].

10. PR BREAKDOWN: PR 1 | a merge commit (diff shown against develop is ~41 lines) | base `main` (release PR) | no flag.
    The body states the size; a size exception is the founder's to accept, never the agent's.

11. LENSES: A security-architect, B principal-architect (the 7 files).

12. ORDER: after F4 and P-7 may be in parallel; before B13-CUT. After: #843 or #846 decides the BACKLOG overlap (BACKLOG.md conflicts).
    Blocked by: the founder's merge-method choice and sha. Rolling back: revert the merge on `main`; website only reads `main` [V #830 body].

13. DONE: [ ] section 2 proofs pasted; [ ] ASCII in added lines; [ ] no force-push, no rebase of anyone's branch; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing. The website `/support` page returns 200 after the merge and Vercel build (founder checks; 404 today per plan).

15. STOP AND ASK: a conflict outside section 5's list; a main-only line that looks like a security or privacy fix; `main` moved;
    the founder prefers squash (then the PR must be rebuilt from develop alone and the 7 files dropped or ported).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-830 agent:ops -->`; check-in docs/agents/checkins/ops-rd-h3-830.md;
    labels agent:ops, from:agent, needs:founder. Do not edit #830.
```
