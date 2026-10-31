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
