# CTO rulings log

Every ruling the delegated CTO makes on a question that would otherwise go to the founder (skill `early-letters-cto`, section 6). The founder can overrule any entry in one line; that is recorded as a new entry that supersedes the old one. Newest last. Founder decisions stay in `docs/DECISIONS.md`. The coordinator session wrote these in the role of the CTO skill (Karma), in the third person; each entry names its tier and door.

### CR-1 `.github/**` changes need two independent reviews, and #403 had one (30 Oct 2026, coordinator session)
- Tier: T2 (`.github/**`).
- Question: may a `.github/**` pull request merge on one independent review plus the coordinator's own check of the facts?
- Ruling: no. Every `.github/**` change needs two independent reviews. #403 (pinned the agents workflow's four actions by commit SHA, merged as 0513a3f) merged on one independent review plus the coordinator's own re-resolution of all four SHAs with `git ls-remote`; a second independent review of that merged diff was reported on 30 Oct as passing (no Must, no Should; no revert), but its text was not posted on GitHub, so that is the coordinator's report and not a checkable record. #404 (the testflight.yml registration trigger) merged as 9a82c8b after two independent reviews of heads e9fe5a5 and d69099b (both PASS WITH NOTES, recorded in a PR comment) and green CI on b6cc987; #398 (the pinned agents.yml to main) is held and would need two on its reduced head.
- Why: skill section 2 ("after two independent reviews when you touch `.github/**`"); #403 is four lines and its SHAs were re-checked three times (author, reviewer, coordinator), so the exposure is small, but the rule is the rule.
- Door: two-way.
- Way back: revert 0513a3f on `develop` (restores the floating `v1`, `v3`, `v4` tags).
- Revisit when: a later review of #403 or a bump of a pinned action reports anything.

### CR-2 The default branch stays `main`; AF-05 waits for a verified Vercel setting (30 Oct 2026, coordinator session)
- Tier: T2 (repository settings; the date is stated to the founder).
- Question: set `develop` as the repository's default branch now (AF-05), so dispatch, schedules and the nightly work?
- Ruling: not yet. The interim route is #404 (a `pull_request` run registers `testflight.yml`: registration was seen on 30 Oct, a dispatch is untested; `kill-harness.yml` is dispatched on `develop` the same way today) and, only if a harness is ever turned on (CR-5), #398 (only the pinned `agents.yml` on `main`, for its schedule, held). The nightly cannot fire until the default branch is `develop` (D-114 item 3, `DECISIONS.md`), and go/no-go row B2-22 (`docs/qa/ALPHA_GO_NO_GO.md`) needs a green scheduled nightly within 24 hours of build 2: so AF-05 is due by Mon 2 Nov (so a first nightly runs before build 2 and a second after it), or the founder waives B2-22 at the go/no-go. This is stated to the founder, not decided here. Precondition for AF-05: the Vercel project `earlyletters` has its Production Branch explicitly set to `main` (read in the Vercel dashboard; the API read on 30 Oct does not show it), and branch protection (AF-03) is in place, with the repository ruleset that today follows the default branch (`FOUNDER_QUEUE.md` W0-09) retargeted to `main` by name, so that it does not move off `main` (that ruleset is the Copilot review one: after the script it applies to `main` only and no longer to pull requests into `develop`). The script that does all of it, in that order and asking for the Vercel check first, is `scripts/release/apply-branch-settings.sh` (#407).
- Why: `docs/release/AUTOMATION.md` 0.1 items 3 to 5 and AF-05; principle 7 (Vercel production deploys from `main`; an independent review on 30 Oct reported that `main` and `develop` have diverged, 233 commits only on `develop` and 52 only on `main` (more on `develop` since), unverified here); the switch also makes `claude.yml`'s comment and issue triggers live.
- Door: two-way (a setting).
- Way back: set the default branch back to `main`.
- Revisit when: the Vercel setting is verified, or on Mon 2 Nov (B2-22).

### CR-3 Code that is not a release blocker waits for the freeze (30 Oct 2026, coordinator session)
- Tier: T1.
- Question: start BL-478 (sign-out wait), BL-476 (pause end, a way to Apple and Google) and BL-489 points 1 and 3 now?
- Ruling: no. Between now and the freeze (Tue 3 Nov, confirmed by the founder on 30 Oct; the hour, 5:00 AM PT, is the coordinator's) only S0 and S1 fixes, pull requests already in review, the release-path pull requests of `FOUNDER_QUEUE.md` section 0 (the project-id PR, the `ascAppId` PR, the pack keys PR) and the two changes the founder decided on 30 Oct (BL-485 option (b), the build switch for the Delete account row) land. The release-path ones must land before the freeze, because the freeze rule (`AUTOMATION.md` 0.2 item 17) forbids workflow, `eas.json` and `app.config.ts` changes between the freeze and the go/no-go, except for an S0 or S1 fix. #404 (a workflow change on `develop`) has landed. #398 changes only `main` and is held with the harness (CR-5).
- Why: principle 4 (protect the release path: least review load and least shared usage before a freeze). None is S0 or S1: BL-478 is Low (and none of its points removes a letter, its own text), BL-476 is Medium, BL-489 is Low with point 1 (a screen-reader gap) Medium for a VoiceOver parent. The deferral is a timing call, not a judgement that BL-476 does not matter.
- Door: two-way.
- Way back: start them after the go/no-go, or sooner if the founder asks (what is in a release is the founder's call; this only orders the work).
- Revisit when: the build 2 go/no-go (Mon 9 Nov, confirmed by the founder on 30 Oct) has passed, or an S1 appears in one of them.

### CR-4 The T11 day is counted with the evening check, and the overrun carries (30 Oct 2026, coordinator session)
- Tier: T1 (the hours are the founder's; this is the coordinator's default until they say otherwise).
- Question: does the 40-minute check the night before count against the 8-hour W2 budget (`docs/prd/v2/08-delivery.md` 10.2 is silent)?
- Ruling: yes. With it the T11 day is 8 h 30 min against 8 h, 30 min over. The sheet stays as merged in b56c8fe: block 8 has a stop line at 16:55 and anything unfinished carries to the W3 session. No row is cut.
- Why: principle 3 (fail closed); the device hours are the founder's, so the plan names the overrun instead of hiding it. The T11 day needs a build with the server switch on and no build exists yet, so the sheet's 30 Oct date is a plan date that moves to the day build 2 is on the phones, except block 8's sole-parent drill, which D-129 needs by Mon 2 Nov noon PT on a development client or a build with the switch on against staging (D-130), so it does not wait for build 2.
- Door: two-way.
- Way back: cut S2-13 (c) and (d) at the large text sizes from block 8 and carry them.
- Revisit when: the founder says the check does not count, or `08-delivery.md` 10.2 is amended.

### CR-5 The GitHub-hosted harness stays off; no paid inference (30 Oct 2026, coordinator session; the money decision is the founder's)
- Tier: T3 (spend), recorded as the founder's decision; this entry is the CTO's reading.
- Question: set the repository variable `AGENTS_ENABLED` to `true` now (the founder had earlier that day asked for the harness to be started)?
- Founder's answer, 30 Oct: "Use an open source version. Why pay for things that good open source versions exist." This is a founder decision on spend (skill section 3), recorded in `docs/DECISIONS.md` as D-127 (PR #406, merging with this one); this entry records the CTO's reading of it. The earlier request to start the harness is the coordinator's account of the chat.
- Ruling: the harness stays off and nothing is bought. The harness already is open source software on open-weight models (OpenCode, MIT; DeepSeek and GLM, MIT, `docs/agents/HARNESS.md` section 3); what costs money is the model API (OpenRouter), which HARNESS.md puts at about $70 to $510 a month at the full cap (the author's assumptions, unverified). No zero-cost route is proven: I expect GitHub's standard runners (no GPU) to be too small to run a useful model, which is untested; running one on the founder's own Mac is a different and weaker lane; and the free hosted tiers could not be checked (openrouter.ai was not reachable from the coordinator session on 30 Oct). So the agent work continues from the coordinator session (how that session is billed is not recorded in the repo: unverified) and nothing is switched on. A free route is tested only after the go/no-go and only if it needs no card. Whatever is ever enabled needs branch protection first: `main` has only a repository ruleset (deletion, non-fast-forward, Copilot review; no pull request requirement, no required checks) and `develop` has none, so an agent token can push (`AUTOMATION.md` 0.1 item 2, a 16 Oct quote, and `FOUNDER_QUEUE.md`'s 28 Oct reads).
- Why: principle 3 (fail closed) and 4 (protect the release path); the founder's decision.
- Door: two-way.
- Way back: nothing was enabled. If a harness is turned on later, delete the variable `AGENTS_ENABLED` to stop it (`AGENTS_PAUSED=true` does not stop the board writes). The settings script (`scripts/release/apply-branch-settings.sh`) also disables the `agents.yml` workflow, so turning a harness on later needs that workflow re-enabled in the Actions tab as well.
- Revisit when: after the go/no-go (Mon 9 Nov), or when the founder wants a harness again.

### CR-6 Merge settings: squash for normal PRs, merge commits for lineage, rebase off (30 Oct 2026, Karma via retro session)
- Question: Should we go squash only, and delete branches on merge?
- Tier and type: T1; clear.
- Options considered:
  - (a) Leave all three merge methods on.
  - (b) Squash only.
  - (c) Squash for normal PRs, merge commits only for lineage PRs, rebase off.
- Ruling: (c).
  - Squash stays the way every feature, fix and docs PR lands. The squash subject becomes the PR title, and the body keeps the commit messages, so trailers survive.
  - Merge commits stay allowed only for lineage PRs: `develop` into `main`, and `main` back into `develop` after a site hotfix. Squashing those splits the histories again.
  - Rebase merge goes off.
  - Head branches are deleted on merge.
  - Auto-merge stays off. With no required approval, auto-merge would merge anything green with nobody looking.
- Why:
  - All 161 first-parent commits on `develop` and `main` since 20 Oct are squashes.
  - The hotfix rule in `docs/DEVELOPMENT.md` needs a merge commit.
  - 295 of 410 branches are leftovers.
  - Risk 1x2. Return: fewer leftovers and a clean history.
- Door: two-way.
- Way back: `bash scripts/release/apply-branch-settings.sh --undo`.
- Revisit when: the one-lineage merge is done. Squash-only may then fit.

### CR-7 Protect `develop` and `main` with checks and no approval (30 Oct 2026, Karma via retro session)
- Question: What protection can `develop` and `main` have while every session and Saurabh are one GitHub account?
- Tier and type: T2; clear.
- Options considered:
  - (a) Nothing until agents have their own GitHub identity (H1).
  - (b) The spec in `scripts/release/github-settings.ts`, with 1 approval on `main` and admins enforced.
  - (c) PR required, two required checks, 0 approvals, admins enforced, no force push or deletion.
  - (d) Same as (c), without admin enforcement.
- Ruling: (c) on both branches.
  - (b) would lock everyone out of `main`: nobody can approve their own PR, and every session is the same person to GitHub.
  - (d) lets a red check be skipped without anyone noticing.
  - Required checks are `required` and `applied migrations unchanged`, bound to GitHub Actions (app 15368). Both report on every PR into both bases.
  - The path-filtered web and launch checks are not required, because a PR that never triggers them would wait forever.
  - "Must be up to date" is off.
- Why:
  - The 28 Oct architecture review rated "no protection" as Critical (G3).
  - Nobody pushes straight to either branch, so nothing breaks.
  - An independent read of the request body on 30 Oct found it valid. It confirmed the check app ids on #393 and #397, and that all four open PRs into `main` already pass both checks.
  - Risk 2x3, with a one-call way back. Return: the first machine rule that stops a red merge or a force push.
- Pre-mortem:
  1. A job is renamed and PRs wait forever. Fix: update the check list.
  2. A release PR into `main` goes red on migrations because the lineages diverged, and someone drops the check. The fix is the lineage merge, not the check.
  3. An urgent hotfix lands while CI is down. Lift admin enforcement for minutes and put it back.
- Door: two-way.
- Way back: `--undo`. In an emergency, `gh api -X DELETE repos/thesaurabhpareek/earlyletters/branches/<b>/protection/enforce_admins`, then POST it back.
- Revisit when:
  - every PR author is an identity other than Saurabh's account (CR-20). Until then approvals stay at 0, because GitHub never lets an author approve their own PR and every Claude session opens PRs as his account. H1 alone does not get there: it covers only the harness, which is off (CR-5).

### CR-8 Don't run `github-settings.ts` yet; it can't run (30 Oct 2026, Karma via retro session)
- Question: Run the settings script as is, change its constants, or call the API directly?
- Tier and type: T1; complicated.
- Ruling: direct calls, packaged in `scripts/release/apply-branch-settings.sh`. `github-settings.ts` stays the target state.
  - The script exits unless the approver is a second, accepted collaborator. That premise is wrong as a plan: a second free personal account for Saurabh breaks GitHub's Terms (CR-19). The approver is Saurabh; the separate identity belongs to the agents.
  - Its environments put Saurabh as reviewer with prevent-self-review on, which would block every deploy, because every run's actor is his account.
  - After the go/no-go (Mon 9 Nov, D-130), one PR updates it:
    - `testflight` also allows `ios-v*` tags (`testflight.yml:67`);
    - protection uses `checks` with app ids;
    - the rulesets below are added;
    - a mode creates the environments without reviewers;
    - the approver becomes Saurabh, once PR authors are not his account (CR-20).
- Why: `github-settings.ts` main() and `environmentBody`, read on 30 Oct. Risk low. Return: the script matches reality again.
- Door: two-way.
- Way back: revert the PR.
- Revisit when: PR authors are not Saurabh's account (CR-20).

### CR-9 Default branch to `develop`, once protection is on and Vercel is confirmed (30 Oct 2026, Karma via retro session)
- Question: Switch the default branch now, and in what order?
- Tier and type: T2; complicated.
- Ruling: switch, in the order `apply-branch-settings.sh` runs it. It meets both conditions CR-2 set.
  1. Saurabh confirms in Vercel that the Production Branch is `main`. The script asks before it does anything.
  2. Protection (CR-7) is applied first.
  3. The Copilot ruleset is pinned to `main` by name, keeping its three rules, so it does not follow the default branch to `develop`.
  4. The default branch switches.
  5. `agents.yml` is disabled once GitHub registers it (CR-5 keeps the hosted harness off).

  This gives the build thread the `testflight.yml` and `deploy-db.yml` Run buttons and the nightly, and new PRs default to `develop`.
- Why:
  - ADR 0026 decision 3 preconditions: `claude.yml` is hardened, OWNER only.
  - The latest production deploy (`dpl_GzAbxo9o87LCZo8eEzG3Z2FMBDYy`) is from `main`.
  - Vercel's docs describe the Production Branch as a stored project setting. The project API does not show it, hence the founder's look.
  - Risk 2x4 before the Vercel check, 1x4 after.
- Pre-mortem:
  1. A production deploy comes from a branch other than `main`. Vercel's Production Branch is a stored project setting (vercel.com/docs/git), not GitHub's default branch, so this should not happen, and `--undo` would not fix it. Detect: production deploys listed through the Vercel API all name `main` (11 of 11 on 31 Oct). Fix: Instant Rollback in Vercel, then set the Production Branch to `main`, then Undo Rollback once a good deploy is ready, because after a rollback new pushes stop going live until then (vercel.com/docs/instant-rollback; on Hobby, only to the deploy just before). Corrected 31 Oct; the first version said `--undo`. Note: `develop` has not built on Vercel since 15 Oct (every `develop` deploy is ERROR), so watching for a `develop` Preview proves nothing.
  2. The nightly opens a red issue daily. The coordinator triages it like any red build.
- Door: two-way.
- Way back: `--undo` restores the default branch and the Copilot ruleset. Vercel is fixed in Vercel (pre-mortem 1).
- Revisit when: any production deploy on Vercel comes from a branch other than `main`.

### CR-10 Environments wait (30 Oct 2026, Karma via retro session)
- Question: Apply the deployment environments now?
- Tier and type: T1.
- Ruling: not from here.
  - The proxy refuses the environments API from Claude sessions.
  - With Saurabh as reviewer and prevent-self-review on, every deploy would block.
  - The environments come with `github-settings.ts` once runs are started by an identity other than his, so he can approve them. Correction after the 31 Oct challenge: there is a middle option I missed, environments with him as reviewer and prevent-self-review off. That is a manual pause on `db-production`, not identity separation, and whether a session could approve a pending deployment through the proxy is unverified. It waits with the rest, after the go/no-go.
- Door: two-way.
- Revisit when: PR authors are not Saurabh's account (CR-20).

### CR-11 Rulesets: release tags can't move, release branches keep history, archive tags stay (30 Oct 2026, Karma via retro session)
- Question: Create the tag and release-branch rulesets now?
- Tier and type: T1; clear.
- Ruling: yes, three, with no bypass list:
  - `refs/tags/ios-v*` and `refs/tags/db-v*` can't be updated or deleted;
  - `refs/heads/release/*` can't be deleted or force-pushed;
  - `refs/tags/archive/**/*` can't be updated or deleted.

  The archive pattern needs `**/*`: ruleset patterns don't let `*` cross a `/`, and every archived branch name has one. This was found by the independent read on 30 Oct.
- Why:
  - ADR 0022 decision 4 says tags never move.
  - There are no tags today, so nothing is caught by surprise.
- Door: two-way.
- Way back: `gh api -X DELETE repos/thesaurabhpareek/earlyletters/rulesets/<id>`. To fix one bad tag, disable the ruleset, fix the tag, and enable it again.
- Revisit when: Android adds `android-v*`.

### CR-12 Branch names (30 Oct 2026, Karma via retro session)
- Question: Which prefixes are allowed, and do we enforce them?
- Tier and type: T1 now. The CI step later is T2.
- Ruling:
  - **Allowed:** `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `qa/`, `exp/`, `ci/`, and `release/<major>.<minor>` (coordinator only).
  - **Also allowed, because tools make them:** `claude/`, `agent/<handle>/`, `dependabot/`, `vercel/`.
  - **Kept:** `wip/<topic>`, because CLAUDE.md's "Saving work" rule tells every session to push there (the 31 Oct challenge caught that the first version retired it).
  - **Retired for new branches:** `port/`, `review/`, `integration/`, `copy/`, `refactor/` (use `chore/`), `auto/`, `archive/` (archives are tags now) and bare names. Existing branches stay.
  - **Enforcement:** a step inside the `required` job after the go/no-go (Mon 9 Nov), not a ruleset. It must allow `wip/`.
  - **CLAUDE.md:** gets the extra prefixes when no open PR is editing it.
- Why: the branch count on 30 Oct (105 docs, 71 feat, 51 fix, 38 chore, 12 ci and others). Risk 1x1.
- Door: two-way.
- Way back: edit the pattern.
- Revisit when: the harness decision (W0-12e) is made.

### CR-13 Tag names, and no tag today (30 Oct 2026, Karma via retro session)
- Ruling: ADR 0022's names stand:
  - `ios-v<X.Y.Z>-rc.<N>` on a `release/*` commit;
  - `ios-v<X.Y.Z>` on the RC commit Apple approved;
  - `db-v<YYYY>.<M>.<D>.<N>` on `main` through `db-production`;
  - `archive/<branch>` for archived branches.

  Only the coordinator pushes `ios-v*` and `db-v*`. Nothing is tagged today: there is no release branch or RC yet, and a `db-v*` push would start the production database job.
- Door: two-way.
- Revisit when: the freeze cuts `release/1.0`.

### CR-14 Clean up stale branches in two passes (30 Oct 2026, Karma via retro session)
- Question: Which of the 410 branches go, and how?
- Tier and type: T2 (two-way with cost); complicated.
- Ruling: archive-tag, then delete, with `scripts/release/cleanup-branches.sh`, after CR-11's archive ruleset is on. Saurabh runs it from his computer: the proxy refuses tag pushes from sessions (30 Oct).
  - **Pass 1:** 254 branches.
    - 251 have a merged PR and a tip still equal to that PR's head.
    - 3 are `auto/` branches with nothing outside `develop` or `main`.
  - **Pass 2:** 41 closed-unmerged PR branches, on Fri 6 Nov or later. That gives anyone a week to reopen one.
  - **Kept:** about 115:
    - `main` and `develop`. `release/ios-v1.0` is archived and deleted separately by Saurabh before the settings run (his answer of 30 Oct, Q3), because the `release/*` ruleset would then block the delete. The commands are in `docs/release/FOUNDER_QUEUE.md` row 7; `cleanup-branches.sh` can't do it, as it skips `release/*`;
    - every open-PR head and base;
    - 52 branches that never had a PR;
    - 3 merged-PR branches whose tip moved after the merge.
  - **How the script stays safe:**
    - it skips a branch whose tip moved, and anything that is an open PR's head or base, read live and again just before deleting;
    - it deletes only after the remote archive tag peels to the branch tip;
    - it deletes with a lease;
    - it can be re-run.
- Why:
  - Every branch was classified against all 366 PRs on 30 Oct.
  - An independent spot check of 10 rows confirmed merged, same head and same tip.
  - No tag push triggers a workflow except `db-v*`.
  - Risk 2x2, fully restorable.
- Door: two-way with cost.
- Way back: `git fetch origin tag archive/<b> && git push origin "$(git rev-parse 'archive/<b>^{commit}')":refs/heads/<b>`.
- Revisit when: pass 2's date.

### CR-15 Labels and PR titles (30 Oct 2026, Karma via retro session)
- Ruling:
  - PR titles stay `type(scope): summary`, with the types `feat`, `fix`, `chore`, `docs`, `test`, `qa`, `exp`, `ci` and `revert`. With CR-6 the title becomes the commit subject.
  - Labels are not touched now. Deleting a label strips it from every issue. The `agent:`, `from:` and `to:` families wait for the harness decision.
- Door: two-way.
- Revisit when: W0-12e is decided.

Proxy note for every session (30 Oct): the agent proxy refuses repository settings writes from Claude sessions (`Repository settings writes are not permitted through this proxy`, HTTP 403 on `PATCH /repos/...`), and the environments and variables APIs. Settings rulings are therefore run by Saurabh with `scripts/release/apply-branch-settings.sh` from his own computer. The proxy also refuses tag pushes (HTTP 403 on `refs/tags/...`, seen 30 Oct), so CR-14's archive tags, and therefore the cleanup, also run from Saurabh's computer.

### CR-16 to CR-18 (31 Oct 2026, Karma via readiness session)
- Recorded in Project doc `infra/cto-rulings-2026-10-31-karma.md` (English-only production profile #413, the D-126 correction, no staging or escrow projects this week). They land in this file through that session. CR-25 (naming: product terms and internal terms, one direction) is in the same doc.
### CR-19 Post-mortem: how a recommendation that breaks GitHub's Terms reached Saurabh (31 Oct 2026, Karma via retro session)
- Question: Why did I recommend, on 30 Oct, that Saurabh create a second GitHub account to approve PRs, when GitHub's Terms allow one free account per person plus one machine account used only for automation?
- Tier and type: T1 (my own process); complicated.
- What happened: Saurabh asked "why" about Q1. Only then did I read the Terms. The recommendation was wrong, and the fix is the other way round: the agents get the separate identity (a GitHub App, H1 #349, or the one machine account) and Saurabh's own account stays the human approver. No harm landed, because he asked before acting. That was luck, not a control.
- Root causes, in order of weight:
  1. I inherited a premise and treated it as checked. `scripts/release/github-settings.ts` was already built around "a second, accepted collaborator as approver". I took the file as a vetted design and only asked how to satisfy it. Something written in the repo is a claim, not evidence.
  2. I solved the wrong problem. I framed it as "how do we get a second approver" when the real problem is "agents and the human share one identity". Stated that way, the standard answer is obvious: automation gets a bot identity, humans approve as themselves. That answer was already in our own backlog as H1 (#349), an open PR I didn't read. My own read order (open PRs touching the area) would have caught it.
  3. My evidence rule existed only as prose. Principle 5 says never rule on a guess about a third party. Nothing made me show a source for a vendor claim before a question left. By my own principle 1, a rule nothing enforces is a wish.
  4. The founder path got less scrutiny than the technical path. The settings script had two lens reviews and an independent read. The three founder questions had no review at all. That is backwards: a founder question costs his attention and can touch his accounts, money or legal standing. It should get the most scrutiny, not the least.
  5. I used escalation as a substitute for diligence. Because "external accounts" are his call, I wrote a recommendation and let him decide, as if his decision would catch my mistakes. He decides; I'm still accountable for the quality of what I put in front of him.
  6. Volume. I produced ten rulings and three questions in one sitting with no stop before sending. One option in Q1 differed only in timing, which breaks my own "three real options, including doing nothing" rule.
- What changes (in the skill, section 10a "The founder gate", and section 15 "Karma's misses"):
  - Every FOUNDER question is debated before it is sent. An independent challenger gets the question and the source material, not my reasoning, and attacks it. I answer every objection in writing. A question that loses goes back to RULED, NEEDS EVIDENCE or is dropped. The founder sees a one-line debate record under each question.
  - Every claim about a third party in a FOUNDER question (terms, pricing, plan limits, API behaviour, App Store rules, law) carries a source I read this session. If the recommendation rests on an unsourced claim, the question doesn't go.
  - Standard practice comes first: each recommendation says how a well-run team does this, and why we differ if we do.
  - Inherited premises are listed and checked like any other claim.
  - A hard stop on question smells: asking him to create an account, pay, sign up or accept terms; a workaround to a platform limit (a common way to breach terms); a single real option; contradicting an open PR or a ruling.
  - I keep a misses log and read it on every run.
- What the first independent challenge found (31 Oct, a separate agent that had not seen my reasoning). It proves the point, because my corrected answer was still wrong in places:
  - My corrected Q1 said that once agents had their own identity (H1), approvals could go up. They can't. Every Claude session opens PRs as Saurabh's account through the Claude GitHub App, and GitHub says "Pull request authors cannot approve their own pull requests" (docs.github.com, approving a pull request with required reviews). H1 covers only the harness, which is off. CR-20 has the real position.
  - CR-9's way back for Vercel (`--undo`) wouldn't fix a wrong production deploy: Vercel's Production Branch is a Vercel setting.
  - CR-12 retired `wip/`, which CLAUDE.md tells every session to use.
  - CR-14 and the script header said a session runs the cleanup; the proxy refuses tag pushes, so Saurabh does.
  - The second-account plan was written into many more docs. Where a founder would act on it, it is now marked withdrawn or "do not run": ADR 0026 decisions 1 and 2, ADR 0022, AUTOMATION (a banner, AF-02), SECRETS_REVIEW (a banner), FOUNDER_QUEUE W0-08 and row 7, FOUNDER_TASKS FT-20, TESTFLIGHT step 6, DEPLOY, RELEASE and 1.0.0. The rest (BOARD history, and the "Proposed 17 Oct, not decided" entry in `docs/DECISIONS.md`, which is the founder's file) is left as history; the banners cover it.
  - `cleanup-branches.sh` has no `git fetch` and can trip on macOS's bash 3.2 with an empty list; fixed in a separate PR.
- Numbering: the readiness session recorded CR-16 to CR-18 on 31 Oct in Project doc `infra/cto-rulings-2026-10-31-karma.md`, so this is CR-19. Two sessions picking numbers by hand is the same collision class as the D-ids (#331); the skill now says to check that doc set too until `next-id.mjs` knows CR.
- Door: two-way (my process).
- Way back: none needed. The founder can loosen the gate in one line if it slows him down.
- Revisit when: the next founder question I send is overturned by him or by later evidence. Each one goes in the misses log.

### CR-20 Approvals and identity: what actually works while every session is Saurabh's account (31 Oct 2026, Karma via retro session)
- Question: How do we get a real human approval gate on GitHub, now that the second-account route is out (CR-19)?
- Tier and type: T2; complicated. One part is a founder decision (an external account), held below.
- The facts, with sources read on 31 Oct:
  - GitHub's Terms, section B: "One person or legal entity may maintain no more than one free Account", and "You may maintain no more than one free machine account in addition to your free Personal Account". A machine account "is used exclusively for performing automated tasks", and "Multiple users may direct the actions of a machine account, but the owner of the Account is ultimately responsible for the machine's actions" (docs.github.com/en/site-policy/github-terms/github-terms-of-service).
  - "Pull request authors cannot approve their own pull requests" (docs.github.com, approving a pull request with required reviews).
  - Every session comment and PR on this repo is user `thesaurabhpareek`, through the Claude GitHub App (15 of 15 recent comments read by the challenger).
  - So no number of approvals above 0 can be met on any PR a session opens, whatever H1 does.
- Options considered:
  - (a) Do nothing: PR plus two required checks, 0 approvals (CR-7).
  - (b) (a), plus make the two counted lens reviews a machine-checked required check: a CI job that passes only when the PR has `## Review A at <head>: PASS` and `## Review B at <head>: PASS`, using the strict parser already in `scripts/status/page.mjs`. That is independence of method, not of identity, and it is honest about that.
  - (c) The industry-standard route: automation acts as a non-owner identity, and the human approves as himself. Here that means the one machine account GitHub allows, added with Write, with Claude sessions connected to GitHub through it. Saurabh then approves on `main` from his own account.
  - (d) Move the repo into a free organisation (AF-27). That alone changes nothing about who authors PRs.
- Ruling:
  - Now, through the go/no-go (Mon 9 Nov): (a). Approvals stay at 0, and I say so plainly: there is no human approval gate today, on `develop` or on `main`. Once Saurabh runs the settings script (`docs/release/FOUNDER_QUEUE.md` row 7), the only thing GitHub enforces is the two required checks. Until then even that isn't true: on 31 Oct `develop` had no protection and `main` only the Copilot review ruleset (no deletion, no force push, no required PR or check; `GET /repos/thesaurabhpareek/earlyletters/rules/branches/main`, and classic protection returns 404). Corrected 31 Oct after a fact-check; the first version read as if protection were already on. D-107/D-117's two counted reviews are a written rule, not a control: the same account that merges posts them, and nothing stops a merge without them until (b) exists.
  - The live site: the coordinator may merge into `main` under D-107/D-117, as now. I'm not making Saurabh the only `main` merger, because it spends his hours on every site PR during the freeze. Be clear about what that costs: Vercel's Instant Rollback can put back an earlier production deploy (vercel.com/docs/instant-rollback, read 31 Oct; on the Hobby plan only the immediately previous one, and I haven't confirmed which plan the project is on), which fixes a broken site, but it does not unpublish what people already saw, and D-118's accepted risks say the repository is public and site content is "effectively permanent once deployed". Nothing independent of the merging session tells him a `main` merge happened; the session's own report to him is not an independent signal. Whether Vercel or GitHub can notify him of every production deploy is unverified; I'll check it before 9 Nov and add it to his queue only if it works with no setup risk.
  - After the go/no-go: build (b), as a T2 `.github/**` PR with two independent reviews. It turns D-107/D-117 from prose into a check, and needs nothing from Saurabh.
  - (c) is his decision and is held, not asked, until after the go/no-go (see below).
- Founder question, held until Tue 10 Nov, not sent now. The challenge left two facts unverified, and moving every session's GitHub identity during the freeze would risk the build thread:
  - Whether claude.ai's GitHub connection can be bound to the machine account instead of his own. The probe: one session connected that way opens one docs PR.
  - Whether Vercel's Hobby plan blocks deploys of commits authored by a non-member. Community threads report "commit author does not have contributing access on Hobby plan" errors (community.vercel.com threads 36192, 36161, 36579); I have not found Vercel's own documentation for a public repo. The probe: one site commit by the machine account on a preview branch.
  - Whether the machine account's use counts as "exclusively for performing automated tasks" when it is Claude sessions he directs. My reading is yes ("multiple users may direct the actions of a machine account"), but it is a reading of a contract, and I'll say so when I ask.
- Why: principle 5 (evidence first) and the 31 Oct challenge. Risk of (a) until 9 Nov: a bad merge to `develop` is caught by checks or reverted (likelihood 2, impact 2); a bad site merge is rolled back in a minute (2x2). Return of moving now: a real gate, at the cost of touching every session's identity during the freeze. Not worth it this week.
- Door: two-way. Nothing is applied by this ruling.
- Way back: none needed.
- Revisit when: Tue 10 Nov, with the two probes run, or sooner if a bad merge reaches `main`.

### CR-25 Naming: two vocabularies, one door, one direction (31 Oct 2026, Karma via naming session)

- Tier: T1, two-way. (I first filed this as CR-21 and then CR-22; both numbers were taken by the harness freeze ruling, which is CR-22 here.)
- Decision: product names are what a parent already says (letter, note, recording, the red circle, Tonight, Keep, Read together, Word for word, small fix, Plus). Internal names say what the system guarantees (`raw_transcript`, `EditType`, `verifyEdits`, take, draft, pack, ADTS) and stay blunt on purpose. The glossary in `packages/content/BRAND.md` is the only door between them, and traffic goes one way: internal terms stay in code, schema, test names and spec section 12; a parent reads only the right-hand column.
- Why: renaming `raw_transcript` to a soft word invites the next agent to treat it as editable. The constitution lives in those names. Meanwhile "take" and "language packs" were showing to parents, against the glossary.
- Applied in the same PR: the three "take" strings and the two "pack" strings in `packages/content`, an internal-terms table in BRAND.md, a banned-term test in `rules.test.ts`, and one line in CLAUDE.md. Promise words ("Word for word", "Exactly as you said it") stay under D-125 and are untouched. The codename `scribe` stays in repo, packages, Supabase projects and the bundle id.
- Not changed, on purpose: legal pages (may say "transcript"; the founder merges legal text), the export file `data/entries.json` (format contract, D-096), store keywords, and PRD specs outside section 12 (a lint of the 21 specs is a follow-up, not a freeze task).
- Door: two-way. Way back: revert the PR.
- Revisit when: a banned-term test blocks a legitimate string twice.

### CR-22 The harness freeze runs to the go/no-go; a research team works inside it (31 Oct 2026, Karma via retro session)
- Question: The founder adopted the freeze "until the 5 Nov go/no-go" (28 Oct), D-130 moved the go/no-go to Mon 9 Nov, and on 31 Oct he asked for "3 agent engineering expert team to work on harness part". Does the freeze end on 5 Nov, and can the team work during it?
- Tier and type: T1 for the timing, but it is my reading of a founder decision ("until the 5 Nov go/no-go"), so he can overrule it in one line. The team's research spends shared usage that the build thread also needs; it stays capped at three agents and no PRs.
- Options considered: (a) end the freeze on 5 Nov as written; (b) tie it to the go/no-go, so 9 Nov; (c) (b), with the team doing research and prototypes only, no PRs and no review load.
- Ruling: (c). The freeze existed to protect the go/no-go and the build thread's share of usage, so it follows the go/no-go. The team's work sits on branch `wip/harness-free-route` (reports, lane design, eval, and my summary in `docs/agents/harness-team/SUMMARY.md`). It gets a PR and two lens reviews after 9 Nov. Nothing runs, and nothing is bought (D-127).
- Why: the freeze's own reasons (`infra/harness-architecture-review-2026-10-28.md`, risks 1 and 2); D-130. What the team found: GitHub Models was retired on 30 Jul 2026 (github.blog changelog, read 31 Oct). OpenRouter's free models give 50 requests a day with nothing bought (openrouter.ai/docs/api-reference/limits, read 31 Oct), which is enough for one narrow lane, not for the 24-agent design. Two risks go with that route, and both are founder-only: whether OpenRouter signup asks for a card is unverified (D-127 rules out a card), and the strongest free models come from providers whose terms say they train on prompts. Opening the account and accepting those terms are his, asked once after the go/no-go with the terms quoted.
- Door: two-way.
- Way back: the founder can end the freeze or stop the team in one line.
- Revisit when: Mon 9 Nov.

### CR-23 The live site drops three Plus lines the founder's decisions contradict (31 Oct 2026, Karma via retro session)
- Question: The site on `main` listed backup, Read together after the free sessions, and the whole family adding letters as Plus features. Does fixing that need the founder, since what the site promises is his call?
- Tier and type: T1; clear.
- Ruling: NOT A QUESTION. His decisions already settled the facts (D-111 item 6 and D-104 item 2: backup is free; D-083: Read together is free; D-055 and D-099: two parents only), and `docs/reviews/2026-10-claims-inventory.md` rows M6 to M8 mark the lines false. Removing them adds no promise. Merged as #417 after two counted reviews and green CI; production deploy `dpl_5T3b4aW7rU8PUAxzeqRdemJbRzNn` is READY. Anything new to say about Plus, and the claim "exactly as you said it", stay his and counsel's (D-125, CR-21).
- Found and left with their owners (the claims inventory and its keeper; the live wording has changed since the inventory was taken, so not every line has its own row):
  - "only the people you invite" and "You and Mama add to the same book", against the v1.0 sharing scope;
  - "Your letters stay on your phone" (`apps/web/src/content/site.ts:73`, inventory row M1): false for `preview`, because letter text syncs once signed in (D-100);
  - `plan.ts` gates `backup_upload` on Plus, against D-111 (app code; not touched during the freeze).
- Door: two-way.
- Way back: revert #417.
- Revisit when: the founder or counsel changes what Plus contains.

### CR-24 The machine-account route stays held: Vercel Hobby might not deploy a non-owner's commits (31 Oct 2026, Karma via retro session)
- Question: The founder approved the CR-20 plan on 31 Oct ("Yes approve all", then "I approve but work with CTO for all implementation"). Do we move Claude sessions onto the one machine account now?
- Tier and type: T3 for the account itself (his); T1 for the timing.
- Ruling: not yet. Vercel's own guide says that on Hobby "only the account owner can trigger deployments, and contributors who aren't the owner cannot deploy" (vercel.com/kb/guide/commits-not-triggering-deployments, read 31 Oct). The guide states the commit-author check for private repositories; ours is public, and whether the same applies is unverified. If it does, site deploys from machine-account commits would stop, and the fix Vercel offers is a paid Pro team (D-127). After the go/no-go I run one probe, and it can't be a preview branch: Vercel previews are off for this project (D-111), so a preview commit would deploy nothing either way. The probe is a throwaway public repository and a throwaway Hobby Vercel project, both his, with one commit by the machine account. That touches nothing live. The alternative, a machine-authored merge to `main` with a rollback ready, risks the live site, so I won't use it. This replaces the preview-branch probe named in CR-20. The founder gets one question only if the route works for free, or if Pro is the only route and worth paying for.
- Also checked (CR-20 follow-up): Vercel notifications are on all plans, web and email are on by default, and there are "Deployment Promotions" notifications for the deployment owner (vercel.com/docs/notifications, read 31 Oct). Whether a git-push production deploy counts as a promotion is unverified. GitHub doesn't notify a user of their own actions, and session merges are his actions, so GitHub is no independent signal.
- The founder's 31 Oct instruction stands for all of this: Karma leads implementation, and the other executives advise through it (`docs/agents/exec/COUNCIL.md` once merged).
- Door: two-way.
- Way back: none needed; nothing changed.
- Revisit when: Tue 10 Nov, after the probe.

### CR-26 Compliance, infosec and user-research "employees", and the account-creation checks (31 Oct 2026, Karma via compliance session)
- Question: Saurabh asked for regulatory-compliance, infosec and user-research experts as agents with deep skills, checks at account creation for people under 18 and people on a sanctions list, open-source data sources, and audit and reporting tables. How much of that is new work, and what is his to decide?
- Tier and type: T1 for the agents and skills; T2 for the backend (migration, auth hook); T3 for which places we block. Complicated.
- What already existed (read on `develop`, 31 Oct): six agents in this space (`legal`, `compliance-engineer`, `privacy`, `security`, `security-architect`, `red-team`); the 18+ gate (D-006, D-026, LEGAL-REQ-002, `age-gate-screen.tsx`); Terms 2.4 (embargo and restricted-party attestation); `audit_events`, `ops.audit_log`, `policy_acceptances`, the deletion SLA report; CI scanning in open PR #30 (gitleaks, Dependabot, audit gate), held for D-041. No user-research agent, no regulatory watch, no sanctions control in code, no underage runbook.
- Options considered:
  - (a) Three new agents exactly as asked.
  - (b) Skills for the existing agents, plus only the missing roles (user research; a regulatory-affairs owner for the door checks and the watch).
  - (c) Do nothing until the server-feature releases are planned.
  - (d) A commercial screening vendor (OpenSanctions or similar) for name screening.
- Ruling: (b).
  - Reconciled with the executive council (#421, merged the same day): the council's Chief Compliance Officer (`early-letters-cco`) is the CCO; `regulatory-affairs` is its working-level lead, `user-research` works for the CPO, and the `infosec` skill serves the CISO's agents.
  - New: `regulatory-affairs` and `user-research` agents; three skills (`regulatory-compliance`, `infosec`, `user-research`); the existing compliance and security agents read them. Both new agents have `daily_runs: 0`, so they cost nothing on the (frozen, CR-22) lane and are consulted in interactive sessions; raise it after 9 Nov if wanted.
  - Infosec gets no new agent: `security` and `security-architect` own it, and the real gap is that #30 is unmerged. Landing #30 after its D-041 review beats writing a second scanner PR.
  - Backend: one draft PR for the server-feature releases (sign-in is in v1.0 per D-100, staged by D-121; alpha build 2 already signs people in, D-128), not merged before the 9 Nov go/no-go. It adds `ops.restricted_jurisdictions`, IP-to-country ranges from DB-IP Lite (CC BY 4.0), content-free daily check counts, a regulatory-watch log, a `before user created` auth hook (a Postgres function) and a report function. No name screening (d): it would make us collect legal names we never otherwise need, and OFAC asks for a risk-based program (ofac.treasury.gov/faqs/445, read 31 Oct). OpenSanctions is CC BY-NC, so it would cost money anyway.
- Why: principle 2 (one source of truth) and Little's Law (about 50 PRs already open). Return of (a) over (b): none. Two more charters overlapping six existing ones splits ownership. Risk of (b): low, since it's docs and charters.
- Debate: an independent challenger reviewed the first draft, and a second independent reviewer reviewed both branches (fixes: lock_timeout so the hook fails open during a geo load, IPv4-mapped addresses, stale decision ids, docs that contradicted code). It found three things, all accepted:
  - Sign-up never touches Vercel, so the block must sit in a Supabase auth hook, not a Vercel header.
  - Iran General License D-2, and possibly a Cuban equivalent, may authorize free internet communications, so blocking Iran and Cuba could shut out overseas grandparents once the web contribution page ships (D-055, which superseded D-002). That is a founder and counsel question.
  - The regulatory watch must cover state law, not only the Federal Register. Partly met: the script is federal only, and state law is a monthly manual check (skill `references/checked-facts.md`) until a tracker is wired.
- Door: two-way. Agents and skills revert with one PR. The migration is unapplied until Saurabh applies it.
- Way back: revert the PR; remove the two roster entries.
- Revisit when: the 9 Nov go/no-go is done (the backend PR can move to review), counsel answers the D-131 or name-screening questions, or the staging of server features (D-121) changes.
- Founder decisions:
  - Blocked countries: decided by the founder on 31 Oct as D-131 (all sanctioned countries, plus others that expose him to risk). The CCO's list: KP, IR, CU, SY, RU, BY and the four Ukrainian regions.
  - Name screening: Karma and the CCO recommend none, because it would mean collecting legal names. Accepting that residual risk is his with counsel; the default holds until then.
- Correction (Review B, 31 Oct): an earlier draft said accounts ship in v1.1. They don't: sign-in is v1.0 (D-100), staged in 1.0.x releases (D-121). The premise came from a stale note, not from DECISIONS.md. Karma

### CR-27 Compliance code is fenced, and the Chief Compliance Officer co-signs (31 Oct 2026, Karma via compliance session)
- Question: Saurabh asked that compliance code live in its own folder, that nobody else can touch or break it, that only assigned engineer agents work on it through the harness with my approval, and that decisions be aligned with a chief compliance officer.
- Tier and type: T2 (`.github/**`, a new required-check candidate); complicated.
- Options considered:
  - (a) A folder plus a line in CODEOWNERS. It enforces nothing while every session is his account (CR-20).
  - (b) Rules in prompts and charters only. A wish, not a control (principle 1).
  - (c) A CI check that reads its rules from the base commit and fails a PR touching compliance paths unless the right label and head-bound approvals are on it.
  - (d) A guard inside the harness dispatcher. It covers agent runs only, not interactive sessions, and the harness is frozen until 9 Nov (CR-22).
- Ruling: (c), plus the prose rule in OPERATING_MODEL section 8 and CODEOWNERS for the human owner.
  - `compliance/` holds the fence (`FENCE.json`, `fence/`) and, after #424, the scripts.
  - Code that tools need elsewhere (migrations, DB tests, skills, the workflow) is protected by name and, for `supabase/`, by what its diff mentions.
  - Two tiers. Protected: assigned agents (`regulatory-affairs`, `compliance-engineer`, `security-architect`, `data-architect`) plus CCO (citing `CCO-<n>`) and Karma (citing `CR-<n>`) approvals on the head, from the owner's login only. The `infosec` skill is the CISO's and stays outside this fence (COUNCIL section 2.4). CCO review: the age gate and consent SQL, any owning agent, CCO approval on the head.
  - The CCO is the executive council's Chief Compliance Officer (`early-letters-cco`, #421), with `regulatory-affairs` (CR-26) doing the working-level review. It is a Claude role, not counsel, and legal judgments still go to counsel.
- Why: a check that reads its rules from the base cannot be loosened by the PR it judges. Approvals bound to the head SHA go stale on every push. The CCO tier came from the CCO's own review, so `mobile` keeps ownership of the age gate.
- Debate (CCO alignment review, 31 Oct): concurred with changes, all accepted.
  - The bootstrap path now runs only on a 404, and any other API error fails.
  - `scripts/compliance/` and `docs/compliance/` are protected.
  - Migrations are caught by content markers, and a migration with no diff from GitHub fails closed.
  - The workflow header was fixed.
  - The CCO-review tier was added, and two checklist items: a test for each door path, and DB-IP attribution.
  - The CCO declined to fence `docs/legal/**`, which `legal` owns.
- Second review round (lenses A and B), all accepted: GitHub takes `pull_request_target` workflows from the default branch since 8 Dec 2025 (github.blog changelog 2025-11-07), so the workflow must also reach `main` before it runs or can be required; `edited` re-runs on a base change; markers ignore case; bots cannot approve; CCO approvals cite `CCO-<n>`; the infosec skill left the fence.
- Limits, said plainly:
  - Runs only once the workflow is on `main`, and advisory until `compliance-fence` is a required check. `develop` has no protection today.
  - The label and approvals prove the procedure ran, not who ran it (CR-20).
  - The first merge cannot be checked by the fence itself; Karma merges it under D-132 after two counted reviews.
- Door: two-way.
- Way back: delete the workflow and `compliance/fence/`, then remove the check from the required list.
- Revisit when: the CR-20 automation identity exists, which would let GitHub enforce identity, or a fenced change is ever merged without both approvals.
- Sequence (Karma, under D-132, the founder's 31 Oct delegation of merges to the CTO): merge this PR into `develop`. The workflow reaches `main` with the next release PR from `develop` (docs/DEVELOPMENT.md: `main` changes only by a release PR or a website hotfix, and this is neither a hotfix nor worth an exception). Until then the fence does not run; the prose rule and reviews cover the gap. Once it is on `main`, make `compliance-fence` required on `develop` (a settings write the proxy refuses, so it is done in the founder's browser). Karma

### CR-32 The compliance fence is required on `develop`, not on `main` (31 Oct 2026, Karma via compliance session)
- Question: Saurabh asked me to make `compliance-fence` a required check myself ("do 2 yourself"). It was blocked on a browser, and CR-27 said the check would only run once the workflow reached `main`.
- Tier and type: T2 (a settings write and `.github/**`); clear once the live state was read.
- What changed under us: the founder's settings run (CR-6 to CR-11) made `develop` the default branch and protected both branches. So the fence started running from `develop` on every PR. It ran on #437 (base `main`) and #438 (base `develop`), and both reported on the PR head (API, 31 Oct).
- Options considered:
  - (a) Require it on both branches.
  - (b) Require it on `develop` only.
  - (c) Leave it advisory.
- Ruling: (b), applied in the founder's browser on 31 Oct (Settings, Branches, the `develop` rule). The API shows `develop` requiring `required`, `applied migrations unchanged` and `compliance-fence`; `main` is unchanged.
- Why not `main`: `main` has no `FENCE.json`, so the bootstrap path fails any PR into `main` that carries compliance paths. The release PR from `develop` will carry them, so requiring it there would block every release until the release itself landed.
- Also in this PR:
  - `apply-branch-settings.sh` and `github-settings.ts` now carry the per-branch check, so a re-run neither removes it nor reports drift.
  - CR-27's text that the fence "runs only from `main`" is superseded by this ruling; the README and the workflow header are corrected.
- Door: two-way.
- Way back: remove the check from the `develop` rule in Settings, and revert this PR.
- Revisit when: `main` has a `FENCE.json` (after the lineage and release merges planned for after the 9 Nov go/no-go; Project doc `infra/cto-rulings-2026-10-31-karma-deploy.md`); then require it on `main` too. Karma

### CR-33 Settings applied through the founder's browser, and how the branch cleanup is restored (31 Oct 2026, Karma via retro session)
- Question: The founder said "take browser control and do what you need" for the pending settings run. How do I apply it, given that the proxy refuses settings writes, tag pushes and branch deletions?
- Tier and type: T2 (repository settings); clear.
- What I found first: another actor had already set part of it at about 08:09 UTC. I don't know which session, or whether it was the founder. Merge settings were changed, and two rulesets were added: "Protect long-lived branches" (`main`, `develop`, `release/*`) and "Protect release tags" (`ios-v*`). The default branch later moved to `develop`, `compliance-fence` became a required check on `develop` (CR-32), and an "archive tags are kept" ruleset appeared. I didn't redo or undo any of that; I filled the gaps. One consequence of the default-branch move: workflows that run from the default branch (`pull_request_target`, `schedule`, `issue_comment`) now run from `develop`. So `compliance-fence` already runs on PRs, although it isn't on `main` yet. That supersedes CR-32's "the fence does not run yet" and the workflow's own header comment, which still says it needs `main`.
- Ruling, and what was applied through GitHub's settings pages in the founder's signed-in built-in browser, each read back through the API:
  - CR-7: classic protection on `develop` and `main`. A PR is required with 0 approvals; the required checks are `required` and `applied migrations unchanged` (app 15368); the up-to-date requirement is off; admins are enforced; force pushes and deletion are blocked.
  - CR-9: the Copilot review ruleset (26012645) now targets `refs/heads/main` by name.
  - CR-6: "Always suggest updating pull request branches" is on.
  - CR-11: `db-v*` added to "Protect release tags".
  - CR-5: `agents.yml` disabled (disabled_manually); it had registered once `develop` became the default branch.
  - Founder's Q3: `release/ios-v1.0` deleted. Its tip, 1494d35, is in `main`. To delete it, I excluded that one branch from "Protect long-lived branches", then removed the exclusion; the ruleset is back to its original targets.
- Checked first: the Vercel Production Branch is `main` (Vercel dashboard, Environments, Production, Branch Tracking); no `AGENTS_ENABLED` variable exists. A snapshot of the settings before any change is in the Project doc `infra/settings-snapshot-2026-10-31.md`.
- This was a one-off, at the founder's explicit instruction. Using the browser to get round the proxy is not the standing route for settings. The standing route is still the founder running `apply-branch-settings.sh`, or doing it himself.
- Branch cleanup (amends CR-14): archive tags aren't needed. Every one of the 251 merged branches in pass 1 has a tip equal to its PR's head ref (`refs/pull/N/head`), which GitHub keeps. The three `auto/` branches are contained in `develop`. A live dry run on 31 Oct found all 254 still candidates. The proxy refused a branch deletion, and the session's permission check refused a bulk delete through the browser as a destructive git action. So the cleanup waits for the founder: `cleanup-branches.sh --apply` from his Mac, or his explicit go-ahead for the browser.
- Way back: restore any deleted branch with `git fetch origin refs/pull/<N>/head && git push origin FETCH_HEAD:refs/heads/<branch>`, or with "Restore branch" on the closed PR's page. For the settings: classic protection can be deleted per branch, a ruleset can be edited back, and the workflow re-enabled from the Actions tab.
- Revisit when: the cleanup has run.

### CR-34 The council's first findings, after the founder gate: no new questions (31 Oct 2026, Karma via retro session)
- Question: The council's first pass (Project doc `infra/exec-council-2026-10-31.md`) raised nine findings. Which, if any, go to the founder?
- Tier and type: T1 for the routing; the items themselves vary.
- Debate: an independent challenger tried to break each verdict. Its strongest points were accepted, and they are folded in below.
- Rulings:
  - **"Exactly as you said it":** NOT A QUESTION. The founder decided it on 31 Oct (D-133, #439), and #437 fixes the site and the welcome email.
  - **The site's language section (s08, `apps/web/src/content/site.ts` on `main`):** NOT A QUESTION. It names seven languages, but the first store build is English only (D-121), and each further language appears only after its own gate passes: a native reviewer's sign-off and a recorded per-language test (D-125 item 2). The rule that public surfaces say only what is true settles it (D-133). The fix has to cover the label, the headline, the support line and the seven sample lines, not just one sentence. The text must name nothing beyond English, for example "Speak in English. Each new language comes only after a native speaker has checked it." The follow-up PR to `main` comes after #437 merges, to avoid conflicts.
  - **Welcome email postal address:** a founder task, not a question. D-004 point 1 already decided on a PO box or a mail service, never the family home, and FOUNDER_TASKS FT-19 is that step (overdue since 9 Oct). The email is live: Vercel production has `RESEND_API_KEY` and `RESEND_SEGMENT_ID` set (read 31 Oct, names only). The challenger's reading is that a waitlist welcome email for an app not yet out is probably commercial under 16 CFR 316.3; that is its reading, and counsel must confirm. A USPS PO box or a private mailbox at a commercial mail receiving agency is a valid address (16 CFR 316.2(p)). Once FT-19 is done, the address goes into the email footer. `docs/emails/COMPLIANCE.md` should also cover this website email. That fix is the CMO's, and it waits for #437.
  - **Apple Small Business Program:** a founder task, not a question (FT-29, after FT-06, the Paid Apps agreement). Individuals qualify, and the year-one saving at $49.99 is 15 points. There is no downside to enrolling before revenue. One thing to check: Apple asks for every associated developer account he owns or controls.
  - **Privacy Policy describes the 3 Oct product:** NOT A QUESTION (ruling D5 in the Project doc `infra/cto-rulings-2026-10-28.md`: parked until counsel is engaged, W0-13). Build 1 needs only the no-account notice.
  - **Age signal (Apple's API needs iOS 26; our floor is iOS 17):** already with the CCO in the compliance work (#424, Project doc `infra/compliance-2026-10-31.md`).
  - **`plan.ts` gates backup on Plus, against D-111:** app code, after the freeze. It goes on the backlog for the build thread. Backup is off in every profile today, so no user sees it.
  - **The habit metric can't be measured with analytics off:** noted for the go/no-go. D-095 stands.
  - **Two-factor authentication on GitHub becomes mandatory after 17 Nov:** a founder task.
- Door: two-way.
- Revisit when: #437 merges (s08 PR), or FT-19 is done (email footer).

### CR-35 Recently deleted letters in the export belong to BL-388, not BL-323 (31 Oct 2026, Karma via session_01JQRV3b, PR #161)
- Question: Should "Export everything" include letters on the Recently deleted shelf, and does PR #161 (BL-323) have to settle it before it merges?
- Tier and type: T1; clear.
- Options considered: (a) ask the founder now; (b) build it in #161, either always or behind a tick box; (c) take it out of BL-323 and leave it with BL-388, which already scopes it; (d) leave the conflict sitting in three backlog items.
- Ruling: (c). BL-323 drops "include Recently deleted letters"; #161 ships without it, as `develop` does today. BL-388 ("Export is complete and safe", ready, High) already scopes tombstoned letters, drafts and orphan recordings in a "not in the book" folder. Before anyone builds BL-388, its owner settles one difference with the Chief Privacy Officer: spec 4.1 says Recently deleted goes in only when "Include recently deleted" is ticked, and BL-388 says always. The answer goes to the founder, through the gate and with a recommendation, if it changes `docs/legal/DELETION_AND_EXPORT_SPEC.md`, or if it conflicts with Privacy Policy section 14 ("every letter you wrote") or the export screen's "Every letter". BL-446, which covers only the letters an account-deletion request tombstoned, keeps its own scope; its Overlap note now points here instead of saying the general question is the founder's, because no founder decision is needed until BL-388 has a design.
- Why: one concern per PR, and BL-388 is the item that already owns this (`docs/BACKLOG.md`, BL-388 scope line). The old `build.logic.ts` header said deleted letters were left out "by design (D-085)". D-085 sets up the 30-day shelf and mentions export (the "Last export" nudge), but it does not say whether an export includes the shelf. The debate behind it (PR #87, open) proposed a test that the export excludes the shelf; that is a proposal, not a decision. #161 corrects the comment to point at BL-388. Nobody is building BL-388 now, and the build 2 freeze starts Tue 3 Nov, so a founder question today would be unripe and would spend his time on a design that does not exist yet. Return: #161 is unblocked at no cost. Risk: low; nothing a user sees changes.
- Council: no CPO or CPrivO view was taken, because this ruling moves a backlog line and decides nothing on the substance; the substance goes to the CPrivO before BL-388 starts (COUNCIL section 2, rule 4).
- Door: two-way.
- Way back: put the line back into BL-323's scope and BL-446's Overlap note.
- Revisit when: BL-388 is picked up, or a data-access request asks for a deleted letter. Karma

### CR-37 One release test plan on top of what exists; pipelines switch on in order, after the 9 Nov go/no-go unless a step closes a store-path item (1 Nov 2026, Karma via session_01G82fpt)
- Question: The founder asked to validate how many test cases we have and extend them for pre-release and production on iOS (phones, iOS versions, screen sizes, happy and unhappy paths, accessibility, dark mode, large text, every screen, Plus, offer codes, payments, sign-in), using what already exists, documented, with the pipelines tested too. Where does that live, and what switches on when?
- Tier and type: T1 for the docs and the catalog test; each pipeline step it names is T2 (`.github/**`). Complicated.
- Options considered: (a) a new standalone test plan that restates every case; (b) edit DEVICE_TEST_PLAN, the e2e README and the journey index in place to add the missing rows; (c) one umbrella plan plus a catalog that cites the existing ids and adds only the gaps, with a test that fails on a dead cite; (d) do nothing until the go/no-go.
- Ruling: (c). `docs/qa/RELEASE_TEST_PLAN.md` holds the inventory, the phone and iOS matrix, the display and accessibility matrix, pre-release against production, and pipeline status. `docs/qa/release-test-catalog.csv` (240 rows after four independent reviews on 1 Nov, written from `scripts/qa/release-catalog.rows.mjs`) cites existing cases and adds 92 gap rows. `apps/mobile/test/qa-release-catalog.test.ts` keeps it honest: every cited id, journey step and path must resolve, and a covered row must cite a test or workflow. The founder-only parts (which gaps gate submission, device hours, the real-money purchase and production code, tester wording, the WCAG 1.3.4 claim) are recommendations in `docs/release/FOUNDER_QUEUE.md` section 0a, not rulings. Pipelines switch on in this order, each its own PR with two reviews: web journeys in CI; E2E-06 and E2E-07 rewritten to D-082; the 108 missing testIDs; Maestro on the simulator reusing the e2e app `kill-harness.yml` already builds; the preview-profile launch check; then `testflight.yml`'s first run after the founder's Expo steps. None merges before the 9 Nov go/no-go unless it closes a store-path item (SR-B-08); web journeys in CI and the E2E-06 and E2E-07 rewrites do, so they may land before the 3 Nov freeze.
- Why: (a) creates a second source of truth (principle 2). (b) spreads one concern across four owners' files during a freeze. (d) leaves the go/no-go without a device list. Checked on 1 Nov: 5,811 unit tests pass on 0f99975; `lint-flows.mjs --app` reports 108 of 136 flow ids missing from the app; `docs/qa/evidence` holds no evidence; `testflight.yml` has never run; ci, ios-compile, kill-harness and nightly are green. Return: the founder gets one list for the go/no-go and nobody re-writes existing cases; risk: a docs PR plus one test, no product code.
- Door: two-way.
- Way back: revert the PR; the existing plans are untouched.
- Revisit when: the web journeys run in CI, or the first device evidence file lands. Karma

### CR-38 The export's real-stack check merges before the freeze, keeps its SQL fixture, and the hosted test waits on staging (1 Nov 2026, Karma via session_01JQRV3b, PR #476)
- Question: (1) May #476, which adds a blocking step to `.github/workflows/db-cli.yml`, merge before the build 2 freeze (Tue 3 Nov 13:00 UTC, D-130)? (2) Should its co-parent fixture use the real invite flow instead of an owner-run insert into `child_members`? (3) The founder asked for a test "with live server": is the local stack in CI enough for BL-323 and BL-529, and what goes to him?
- Tier and type: T2 (a `.github/**` change); clear.
- Options considered: (1) merge once green and reviewed before the freeze; hold to after the go/no-go (Mon 9 Nov); drop the CI step and run the script by hand. (2) keep the owner-run insert; switch to `create_child_invite` and `accept_child_invite` over the API with idempotency headers; do both. (3) call the local stack enough and say nothing; ask the founder to create staging now; point at the staging step already in his queue and run this check there once it exists.
- Ruling: (1) merge before the freeze, only with CI green on the head (including this step's first full pass) and two counted reviews on that head; if either misses Tue 3 Nov 13:00 UTC, hold to after Mon 9 Nov. (2) keep the owner-run insert. (3) the local stack is enough to merge BL-323 and BL-529; there is no new founder question, because creating `scribe-staging` is already FOUNDER_QUEUE row 8 (TESTFLIGHT step 6, Mon 2 Nov). Once staging exists, the same check runs against it, as follow-up work.
- Why: (1) the step runs only against the throwaway local stack that `db-cli.yml` already starts; it holds no secret and deploys nothing; it touches no alpha profile, `eas.json` or `production` (the freeze rules in D-124 item 1, and `docs/release/AUTOMATION.md` row 17, which bars workflow changes between the freeze and the go/no-go; D-130 sets the dates). D-123 item 4 says "no new blocking check before the go/no-go". I read that as covering the requirement-rule checks D-123 adopts (RR-1 to RR-13), not every CI step, and that reading is the reason this step is allowed. It is not in branch protection (DB CLI is outside the `required` aggregator, `ci.yml` job `required`), but it does block in practice, because the merge gate needs green CI on the head (D-117, D-132). It runs on PRs touching `supabase/**`, the export lib, `ids.ts`, `apps/mobile/package.json` (so every mobile dependency bump), `apps/mobile/test/live/**` or `db-cli.yml`, and in the nightly from the first night after it merges, since the default branch is already `develop` (`nightly.yml` calls `db-cli.yml`; its header still says `main`). That first nightly falls inside the freeze window, which is fine: it changes nothing, it only reports. A lockfile-only supabase-js bump is caught by that nightly, not on its PR. If a later ruling or the founder reads D-123 item 4 more widely, the way back below applies. A pre-mortem gives three ways it goes wrong: the step is flaky and blocks unrelated database PRs; the env parsing breaks on a CLI bump; it passes vacuously. Each is covered: the script exits 1 on any failed check and never skips, the CLI is pinned to 2.119.0 (DEPLOY.md), and a red step on someone else's PR is reverted in one commit. (2) the check is about the export's reads, not about joining a book; the invite flow has its own PGlite tests (`supabase/tests/harness.mjs` `join`), and adding two more RPCs with idempotency claims widens what can fail without testing anything this check owns. (3) the first run on `ee1a68f` already showed real GoTrue sign-in and `record_policy_act` working against every migration in the repo. Staging runs the same migrations from `develop`, so what a hosted run adds is the hosted network and keys, not the SQL. Return: export reads proven over HTTP before the freeze, at no founder time. Risk: low.
- Door: two-way.
- Way back: revert the `db-cli.yml` step (one commit); the script and `postgrestReader` can stay, since `device.ts` uses `postgrestReader` with no behaviour change.
- Revisit when: `scribe-staging` exists (point the check at it, with the fixture SQL sent over a pooler URL instead of `docker exec`); or the step fails on a PR that does not touch the export (a mobile dependency bump included). Karma
### CR-39 Fence approval lines may start with up to three spaces (1 Nov 2026, 05:19 UTC, Karma via the compliance session)
- Question: on #443 the founder's approval comments failed the fence because each line began with three spaces copied from my indented instructions. Do we loosen the match or keep it?
- Tier and type: T2 (the fence is fenced, CR-27); clear
- Options considered: keep the match and only fix how lines are handed over; accept any leading whitespace; accept up to three spaces, the most a Markdown heading may carry.
- Ruling: accept up to three leading spaces (`^ {0,3}## ...`) in both approval patterns in `compliance/FENCE.json`, with tests in `compliance/fence/fence.test.mjs`. Four spaces or a tab is a code block in Markdown and stays refused. It ships in one fenced PR with the `regulatory-compliance` skill refresh (stale rows found on 1 Nov), so the founder posts approvals once. Hand-overs also stop indenting the lines (D-135 email carries them flush left).
- Why: the lines still count only from the owner's login and only on the head SHA. One new exposure, found in review: every session posts as the owner (CR-20), so an indented approval line inside an instruction comment on a PR would now count, as a flush-left one already did. So sessions never post approval lines, or instructions containing them, as PR comments; they go by email (D-135) and the founder posts them himself. A rule a person must remember failed once already; the machine should accept what GitHub renders as the same heading. Return: no repeat of a failed check. Risk: 1x2.
- Door: two-way
- Way back: revert the two patterns in `FENCE.json`.
- Revisit when: an approval is ever counted that the owner did not mean to post. Karma

### CR-40 No new audit value for under-18 closures; the support deletion function stays after 9 Nov (1 Nov 2026, 05:19 UTC, Karma via the compliance session, with the CDO's data-model view)
- Question: the underage runbook (#451) listed two gaps for `data-architect`: a service-role `ops_open_account_deletion`, and an `under_18` value in `ops.audit_log`. Build both now?
- Tier and type: T2; clear
- Options considered: build both now as a draft; add only the enum value; drop the enum and keep the function after 9 Nov.
- Ruling: no `under_18` value. `ops.audit_log.runbook` already has `under_13` (`20261004200000_ops_deletion_worker.sql:38`), and a 13 to 17 closure is a `deletion` row with reason code `under_18_closure`, which the reason check already accepts. The runbook is corrected. `ops_open_account_deletion` stays after the 9 Nov go/no-go and before any sign-in outside the family (D-121), as BL-551, owner `data-architect`.
- Why: an enum value that duplicates what the reason code says is a migration with no new information. The function has no cost of delay until someone outside the family can sign in, and building it now adds review load before the go/no-go (principle 4).
- Door: two-way
- Way back: add the value in a new migration if a report needs it.
- Revisit when: BL-551 starts, or the first non-family sign-in is scheduled. Karma

### CR-41 How a basic hand-off is emailed (1 Nov 2026, 05:19 UTC, Karma via the compliance session)
- Question: D-135 says save-and-forward steps go by email to earlyletters@gmail.com with a timestamp. What exactly does a session do?
- Tier and type: T1; clear
- Options considered: email only; email plus a repo PR per send; email plus one line in a Project log.
- Ruling: an interactive session sends one email through the Gmail connector to earlyletters@gmail.com, subject `[Early Letters] <what> <UTC timestamp>`, body in plain text: what it is, why, the exact text to save or paste (flush left), links to the PRs or docs, and what happens by default if nothing is done. It then appends one line to the Project doc `infra/founder-handoffs.md` (UTC time, subject, PRs). Founder tasks with a row in `docs/release/FOUNDER_QUEUE.md` get the timestamp at the next docs PR that touches the queue; no PR per email. Unattended runs never send: they write the line with "to send" and the next interactive session sends it.
- Why: one record people already read (the Project docs), no new register in the repo, and nothing an unattended run could misuse.
- Door: two-way
- Way back: stop sending; the Project log stays as the record.
- Revisit when: the founder asks for a different inbox or channel. Karma

### CR-42 What is still missing after the compliance decisions (1 Nov 2026, 06:10 UTC, Karma via the compliance session)
- Question: the founder asked to document the decisions and find what is missing or an opportunity. What is missing, and in what order?
- Tier and type: T1; complicated
- Options considered: do the gaps now; record them with owners and order, and do only the docs now; leave them to the after-9-Nov list.
- Ruling: record with owners now; do the docs now; build after the freeze. Found:
  1. The app does not handle a refused sign-up: #424 refuses on the server, and the app would show a generic sign-in error with no DB-IP attribution. BL-553, before the hook is switched on.
  2. The regulatory watch has no schedule, and the monthly state-tracker check is a manual habit. BL-554; until then the CCO checks before each submission.
  3. Legal paperwork for the hook (data classification row, register CR-121, claims rows). BL-555, founder merge.
  4. #424 uses APPLY.md File 27, which `develop` already has (`node scripts/agents/id-collisions.mjs`); it must become File 28 before it merges.
  5. Founder queue W0-13 said #163 was open; it merged 1 Nov 05:54 UTC. Updated.
  6. Opportunity, founder-only: a monthly cloud scheduled task that runs the watch and writes a Project doc. It is the first switch-on of an unattended lane, so it is his (section 2); offered, not done.
  7. Known limit, unchanged: every fenced PR needs the founder to paste approvals, because sessions post as his account (CR-20). The machine-account question stays held until Tue 10 Nov.
- Why: each gap blocks switching the hook on, and none blocks the go/no-go. Building now would add review load before the freeze (principle 4).
- Door: two-way
- Way back: delete the backlog lines.
- Revisit when: #424 is picked up after 9 Nov. Karma

### CR-46 Offline renewal grace is 7 days, from C-NFR-004 (1 Nov 2026, Karma via the coordinator, PR #517)
- Question: how long does a payer keep Plus on this phone after the last verified expiry when StoreKit cannot confirm the renewal (offline: travel, poor signal)? Code kept it 1 day (`plan.logic.ts` `STILL_LISTED_MS`); PRD C-NFR-004 (`docs/prd/C-habits-pricing-settings.md`) says "The last known entitlement is cached for 7 days"; PRD v2 carries C-NFR-004 as "Rev" with no number (RT-SUB-13, FOUNDER_QUEUE T6).
- Tier and type: T2 (app behaviour under a PRD requirement); clear.
- Options considered: 1 day (code as it was); 7 days (the C-NFR-004 line); 16 days, to match Apple's Billing Grace Period (D-048).
- Ruling: 7 days past the last verified expiry. After that, Plus is off for extras: a Keep beyond the free letters holds the letter, never loses it. A fresh StoreKit read that no longer lists the subscription turns Plus off at once; the 7 days never outlive Apple's answer.
- Why: failing open for a payer is the promise (C-NFR-004, TDD 08 stale-cache rule). One day takes Plus from a paying parent on a weekend trip. Abuse is bounded: purchases stay Apple-only and verified on the device (ADR 0013), so the window only extends a subscription Apple listed at the last read, and only until the next read. 16 days copies a different mechanism: Apple's Billing Grace Period is a payment retry Apple reports with its own end date, which the code already honours (`gracePeriodExpiresAt`); it is not an offline cache.
- Door: two-way.
- Way back: change `STILL_LISTED_MS` (one constant) and its pin in `apps/mobile/test/billing-plan.test.ts`.
- Revisit when: PRD v2 states its own number for C-NFR-004 Rev; or a device check (D-9, AL-09) shows StoreKit dropping a renewed subscription from `currentEntitlements` while offline, in which case the cache rule, not the window, needs work. Karma
