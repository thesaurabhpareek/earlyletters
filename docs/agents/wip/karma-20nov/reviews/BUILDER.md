# Builder brief (Early Letters, repo thesaurabhpareek/earlyletters), build 12 fix PRs

You implement ONE small change in a scratch worktree and hand it to the lead, who pushes the branch and opens the PR. You do not push, open PRs, comment on GitHub, merge, or touch the main checkout (/home/user/earlyletters).

## Rules (CLAUDE.md, docs/engineering/PRINCIPLES.md)
- Constitution: nothing writes, rewrites, summarizes or shapes a person's words; raw_transcript is immutable.
- Content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji in any string, doc or comment you add; never gender the child ({child}); no fear, guilt or loss language; never imply AI writes anything; button labels at most 22 characters; a parent never reads internal terms (take, entry, draft, pack, raw_transcript). If a content rule test fails, fix the copy, not the test. Copy lives in packages/content. Prefer existing strings over new ones.
- No entry text, transcript, audio or child name in analytics, logs or crash reports. Tests use the fictional family "Asha" only.
- One concern per PR. Keep the diff minimal. Do not widen scope. Do not touch docs/legal/**, migrations, package.json or lockfiles, .github/**.
- Update docs/qa/DEVICE_TEST_PLAN.md when behaviour a person can see changes (new step with Needs, Steps, Expected, Record, Update; unique id: git grep the id on origin/develop and in open PRs first).

## Setup
SCR=/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad
cd /home/user/earlyletters && git fetch origin +develop:refs/remotes/origin/develop
WT=$SCR/wt/$NAME            # NAME is given in your assignment
git worktree add --detach $WT origin/develop
cp -al node_modules $WT/node_modules
for d in apps/mobile packages/core packages/content packages/api; do [ -d $d/node_modules ] && cp -al $d/node_modules $WT/$d/node_modules; done
cd $WT && git switch -c $BRANCH     # BRANCH is given in your assignment
Run mobile tests with `cd $WT/apps/mobile && npx vitest run <files>`; content with `cd $WT/packages/content && npx vitest run`; typecheck `npx tsc --noEmit` in apps/mobile (known environment errors only: expo-clipboard and expo-local-authentication not installed locally; anything else is yours to fix).

## Prove it
- New or changed tests must FAIL on the old code (revert only your source change, keep the new tests, run, expect failures, restore) and pass on the new. Name the requirement or rule in the test.
- Run the whole related test group, not only your new file (grep for the function names you changed across apps/mobile/src and test/).
- Re-read your own diff adversarially; check no banned characters (grep your added lines for bytes >= 0x80).

## Deliver
Commit in your worktree on your branch (git -c user.name=Karma -c user.email=noreply@anthropic.com commit), message ending with these two lines after a blank line:
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
Write the PR body to $SCR/reviews/pr-$BRANCH_SLASHES_REPLACED_BY_DASHES.md following .github/pull_request_template.md headings (What and why; How it was checked with the boxes ticked only for what you ran; constitution and rules; Screenshots: n/a). End the body with a blank line, then the line 'Generated with [Claude Code](https://claude.com/claude-code)' and a final line with https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF.
Return to the lead (short): branch name, full commit sha, files changed, what the tests proved (counts, mutation result), the PR title (max 70 chars, conventional commit style), anything you did NOT verify or decided, and the worktree path. Leave the worktree in place.
