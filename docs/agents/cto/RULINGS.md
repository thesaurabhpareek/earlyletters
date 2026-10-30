# CTO rulings log

Every ruling the delegated CTO makes on a question that would otherwise go to the founder (skill `early-letters-cto`, section 6). The founder can overrule any entry in one line; that is recorded as a new entry that supersedes the old one. Newest last. Founder decisions stay in `docs/DECISIONS.md`.

### CR-1 `.github/**` changes need two independent reviews, and #403 had one (30 Oct 2026, coordinator session)
- Question: may a `.github/**` pull request merge on one independent review plus the coordinator's own check of the facts?
- Ruling: no. Every `.github/**` change needs two independent reviews. #403 (pinned the agents workflow's four actions by commit SHA, merged as 0513a3f) merged on one independent review plus the coordinator's own re-resolution of all four SHAs with `git ls-remote`; a second independent review of that merged diff is owed and is started on 30 Oct. #404 (testflight.yml registration trigger) and #398 (the pinned agents.yml to main) wait for two.
- Why: skill section 2 ("after two independent reviews when you touch `.github/**`"); #403 is four lines and its SHAs were re-checked three times (author, reviewer, coordinator), so the exposure is small, but the rule is the rule.
- Door: two-way.
- Way back: revert 0513a3f on `develop` (restores the floating `v1`, `v3`, `v4` tags).
- Revisit when: the second review of #403 reports anything.

### CR-2 The default branch stays `main`; AF-05 waits for a verified Vercel setting (30 Oct 2026, coordinator session)
- Question: set `develop` as the repository's default branch now (AF-05), so dispatch, schedules and the nightly work?
- Ruling: not yet. The interim route is #404 (a `pull_request` run registers `testflight.yml`; `kill-harness.yml` is dispatched on `develop` today the same way) and #398 (only the pinned `agents.yml` on `main`, for its schedule, held). The nightly (B2-22) waits for AF-05. Precondition for AF-05: the Vercel project `earlyletters` has its Production Branch explicitly set to `main` (read in the Vercel dashboard; the API read on 30 Oct does not show it), and branch protection (AF-03) is in place.
- Why: `docs/release/AUTOMATION.md` 0.1 items 3 to 5 and AF-05; principle 7 (Vercel production deploys from `main`; an independent review on 30 Oct reported that `main` and `develop` have diverged, 233 commits only on `develop` and 52 only on `main`, unverified here); the switch also makes `claude.yml`'s comment and issue triggers live.
- Door: two-way (a setting).
- Way back: set the default branch back to `main`.
- Revisit when: the Vercel setting is verified, or the nightly is needed before the go/no-go.

### CR-3 Low-priority code waits for the build 2 cut (30 Oct 2026, coordinator session)
- Question: start BL-478 (sign-out wait), BL-476 (pause end, a way to Apple and Google) and BL-489 points 1 and 3 now?
- Ruling: no. Between now and the freeze (Tue 3 Nov, 5:00 AM PT, proposed) only S0 and S1 fixes and pull requests already in review land. Workflow changes (#404, #398) land before the freeze, because the freeze rule (`AUTOMATION.md` 0.2 item 17) forbids workflow, `eas.json` and `app.config.ts` changes between the freeze and the go/no-go.
- Why: principle 4 (protect the release path: least review load and least shared usage before a freeze); all three are Low priority and none removes a letter (BL-478's own text).
- Door: two-way.
- Way back: dispatch them after the freeze.
- Revisit when: the build 2 go/no-go has passed, or an S1 appears in one of them.

### CR-4 The T11 day is counted with the evening check, and the overrun carries (30 Oct 2026, coordinator session)
- Question: does the 40-minute check the night before count against the 8-hour W2 budget (`docs/prd/v2/08-delivery.md` 10.2 is silent)?
- Ruling: yes. With it the T11 day is 8 h 30 min against 8 h, 30 min over. The sheet stays as merged in b56c8fe: block 8 has a stop line at 16:55 and anything unfinished carries to the W3 session. No row is cut.
- Why: principle 3 (fail closed); the device hours are the founder's, so the plan names the overrun instead of hiding it.
- Door: two-way.
- Way back: cut S2-13 (c) and (d) at the large text sizes from block 8 and carry them.
- Revisit when: the founder says the check does not count, or `08-delivery.md` 10.2 is amended.

### CR-5 The GitHub-hosted harness is off until the founder decides the spend, and not before branch protection (30 Oct 2026, coordinator session)
- Question: set the repository variable `AGENTS_ENABLED` to `true` now (the founder asked "Enable for me")?
- Ruling: the CTO default is not before the build 2 go/no-go, and never before branch protection on `main` and `develop` (AF-03) is in place. The variable, the OpenRouter key and the agents GitHub App are the founder's accounts and money; the session cannot set them (the proxy refuses `/actions/variables`). The question is asked of the founder with this default.
- Why: principle 3 and 4; nothing protects `main` or `develop` today and an agent token can push (`AUTOMATION.md` 0.1 item 2); the local agent lane keeps working without it.
- Door: two-way.
- Way back: delete the variable, or set `AGENTS_PAUSED=true` (note: `AGENTS_PAUSED` does not stop the board writes; deleting `AGENTS_ENABLED` does).
- Revisit when: the founder answers, or branch protection is applied.
