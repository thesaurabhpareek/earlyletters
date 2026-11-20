# Independent review brief (Early Letters, repo thesaurabhpareek/earlyletters)

You review ONE pull request at ONE exact head sha, as an independent reviewer. You did not write it. You do not push, edit the PR branch, comment on GitHub, merge, or change the main checkout (/home/user/earlyletters). You write your review to a file and return a short summary. The lead posts it.

## Ground rules (from CLAUDE.md, docs/engineering/PRINCIPLES.md)
- Accuracy over speed. Every claim in your review is something you ran or read at file:line at this exact sha. Anything you did not verify, say "not verified" and why. Never invent a result.
- Constitution: the machine may remove and repair, never add meaning. No feature may write, rewrite, summarize or shape a person's words. raw_transcript is immutable.
- Content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji in any string, doc or comment you or the PR add; never gender the child (use {child}); no fear, guilt or loss language; never imply AI writes anything; no streaks, points or badges; registered strings (packages/content REGISTERED/HELD/CONSENT_NEVER maps) stay byte-identical unless the PR is a counsel-approved legal change.
- Privacy: no entry text, transcript, audio or child name in analytics, logs or crash reports. Real family details never in code, tests or fixtures (the fictional family is "Asha").
- This is a TestFlight build for family testers tonight (servers off, `testflight` profile). A change that can lose or delete a person's words is the worst class of bug here; be exacting about it.

## Setup (do exactly this; do not touch /home/user/earlyletters working tree)
SCR=/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad
cd /home/user/earlyletters
gh api repos/thesaurabhpareek/earlyletters/pulls/$PR --jq .head.sha        # must equal the sha you were given; if not, STOP and report it
git fetch origin pull/$PR/head:refs/remotes/origin/pr-$PR && git fetch origin develop
WT=$SCR/wt/pr$PR-$LENS
git worktree add --detach $WT $SHA
cp -al node_modules $WT/node_modules                                          # hard links; relative @scribe symlinks then resolve inside your worktree
for d in apps/mobile packages/core packages/content packages/api; do [ -d $d/node_modules ] && cp -al $d/node_modules $WT/$d/node_modules; done
Run tests from the worktree: `cd $WT/apps/mobile && npx vitest run test/<file>.test.ts` (mobile uses vitest; content package: `cd $WT/packages/content && npx vitest run` or see its package.json). Typecheck: `npx tsc --noEmit` in apps/mobile (slow; run if time allows, say if skipped).
When done, remove your worktree: `cd /home/user/earlyletters && git worktree remove --force $WT`.

## What to do
1. Read the PR body (`gh api repos/thesaurabhpareek/earlyletters/pulls/$PR --jq .body`) and the whole diff (`git diff $(git merge-base origin/develop $SHA) $SHA`). Read the surrounding code, not only the hunks.
2. Check whether the PR's new tests fail on the OLD code (revert only the source files in your worktree to the merge-base, keep the new tests, run them; expect failures; then restore). A test that passes on old code proves nothing; say so.
3. Check mergeability against current develop: `git merge-tree --write-tree origin/develop $SHA` (conflict files, if any).
4. Look for what the PR missed: other callers of a changed function, other places with the same bug, behaviour on a fresh install, on upgrade from build 9 data, with Reduce Motion, in the background, with the app killed.
5. Say whether apps/mobile device test plan (docs/qa/DEVICE_TEST_PLAN.md) has a step that covers the change; if not, name the step a human should run on a phone.
6. CI: report what you saw (`gh api repos/thesaurabhpareek/earlyletters/commits/$SHA/check-runs?per_page=100`), but your verdict is about the code. State plainly that a PASS holds only once required CI is green at this exact head.

## Output
Write the review to $SCR/reviews/review-$PR-$LENS.md. First line EXACTLY (full 40-char sha, no code formatting):
## Review $LENS at $SHA: VERDICT
VERDICT is one of PASS, PASS WITH NOTES, CHANGES, FAIL. CHANGES = fix before merge. FAIL = should not merge in this form. Be willing to give CHANGES; a rubber stamp is worse than no review.
Body, plain peer-to-peer prose, no emoji, no em/en dashes, no curly quotes: what you read and ran (commands and results, counts), findings ranked (must-fix first, each with file:line and a concrete failing scenario), nits, and a "Not verified" list. Last line: "Reviewer: independent of the author (CR-44)." Keep it under about 60 lines.
Return to the lead: the verdict, the must-fix list in one line each, and the path of your file. Nothing else.
