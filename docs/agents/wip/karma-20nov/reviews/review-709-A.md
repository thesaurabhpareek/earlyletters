## Review A at 2476302e8c10db1db0a24273dd4dde1af049344f: PASS WITH NOTES

Lens A: factual accuracy, mergeability, tests. PR 709. This replaces my reviews of 45b8ca08 and 94b1c327. Delta since 94b1c327 is one commit (2476302e) that changes one phrase on the banner line. A PASS holds only once required CI is green at this exact head. When I looked, 5 of 7 check runs were still in_progress (typecheck, tests and content rules, edge functions and ops scripts, B-8 seam, database rules); install and applied migrations unchanged were success. mergeable=true, mergeable_state=blocked (pending checks). Re-check CI before merging.

### What I ran
- `gh api pulls/709 --jq .head.sha` returned 2476302e8c10db1db0a24273dd4dde1af049344f (matches). `git diff --numstat 94b1c327 2476302e`: one file, 1 insertion, 1 deletion. The only textual change: "was written for the first build of D-121, on this phone only;" became "was written for the first build of D-121 (on-device only, servers off);". Nothing else on the line moved.
- Against develop the PR is still +2 lines in one file (`--numstat 2 0`). origin/develop is still 6cd2223b and is the merge base; `git merge-tree --write-tree origin/develop $SHA` exit 0 (no conflict). `git diff --check` clean.
- Body after the banner is byte-identical to develop (`diff <(git show origin/develop:<file>) <(git show $SHA:<file> | tail -n +3)` prints nothing).
- Non-ASCII bytes in the whole file: 0. Added lines: no byte at 0x80 or above, no double hyphen. No em or en dash, curly quote, ellipsis character or emoji.
- `packages/content` `npx vitest run` in a worktree at this sha: 15 files, 367 tests pass (includes `no-real-family-data` and the store-listing check in `rules.test.ts`). Worktree removed. I did not rerun the other suites from the first review: the delta is one phrase in a docs line, and nothing reads this file (first review: no code, test, workflow or script opens it).

### Is the new phrase true?
"On-device only, servers off" is the file's own wording and D-121's: the file's status line (line 5) says "the first store build is on-device only, with server features, backup, status report and analytics off", and D-121 item 1 (`docs/DECISIONS.md:888`) says "server features, backup, status report and analytics off". It also fixes my earlier note 1 (the loose "this phone"). The rest of the banner is unchanged from the 94b1c327 review, where I checked every statement (the three "not in the live listing" items against `store.en.ts`, `app-store.md` and `store.config.json`, the `packages/brand` source of name and subtitle, the section pointers, and the section 6 caution against `app-review.en.ts`). develop has not moved since, so those checks still hold.

### Notes (none blocks the merge)
1. The updated PR body no longer has stale line numbers. It now says two retired claims "still appear in the app (the 'Private to your family' story card, a delete line in Settings)". Read at this sha: `packages/content/src/stories.en.ts:56-57` has the headline "Private to your family." with "Only you and the people you invite can read these letters"; `strings.en.ts:973` has "Export your book, stop sharing or delete everything, any time." The Settings line is similar to, not the same as, the retired sentence, so "a delete line" is fair but loose. I did not check whether the story card is shown in the current build.
2. Still open from the first review, unchanged by these commits: no D- id in the banner (adding "(D-139)" to item 3 would make it checkable from the repo); `docs/release/FOUNDER_QUEUE.md:170` (Q3-10 sends section 8 to counsel), `docs/store/app-store.md:111` (points to section 6) and `.claude/skills/early-letters-cmo/SKILL.md:155` ("waiting on counsel") still treat the file as live. The PR body still says "first 100 open PRs"; I checked all 158 open PRs on 45b8ca08 and only 709 touches the file.

### Not verified
- CI result at this head (pending when I looked). Root `npm test`, `npm run test:db` and typecheck locally. That `app-store.md` regenerates byte-identical. The ruling text beyond the council note and CCO-6.

Reviewer: independent of the author (CR-44).
