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
- Recorded in Project doc `infra/cto-rulings-2026-10-31-karma.md` (English-only production profile #413, the D-126 correction, no staging or escrow projects this week). They land in this file through that session. CR-21 (naming: product terms and internal terms, one direction) is in the same doc.
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
  - The founder merges the fence PR itself by hand.
- Door: two-way.
- Way back: delete the workflow and `compliance/fence/`, then remove the check from the required list.
- Revisit when: the CR-20 automation identity exists, which would let GitHub enforce identity, or a fenced change is ever merged without both approvals.
- Sequence (Karma, under the founder's 31 Oct delegation of merges to the CTO): merge this PR into `develop`; bring the workflow file to `main` in a small PR; then make `compliance-fence` required on `develop` (a settings write the proxy refuses, so it is done in the founder's browser). Karma
