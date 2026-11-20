## Review B at e192b8a3d54fa0cde3947c7737eb3605278fe07d: PASS WITH NOTES

Final delta review. Head confirmed with gh api and `git rev-parse origin/pr-678`: e192b8a3, two commits on 24b606cf (f27107ac, e192b8a3), RULINGS.md only (`git diff 24b606cf e192b8a3`: 6 lines added, 6 removed, all inside CR-60). Develop has moved to a8bf1576 (#667, #668, which touch the mobile app and DEVICE_TEST_PLAN.md); `git merge-tree --write-tree origin/develop` on this head is clean. I re-read CR-60 whole in a worktree at the head.

My three must-fix clauses from the last round are fixed and the text is now true to what I could check:
1. Runbooks: `docs/ops/runbooks/underage-account.md` and `stuck-deletion.md` exist; BL-551 `ops_open_account_deletion` is in no migration (git grep over supabase/migrations at 24b606cf, unchanged by these commits). The "missing" sentence is now accurate for the tool.
2. Control wording: "a PR into main is required (CR-33)" matches CR-33 (classic protection, PR required, 0 approvals); "CR-20: no human approval gate on main" is RULINGS.md:275, inside CR-20 (lines 261 to 297); DEVELOPMENT.md:10 names the founder; the Vercel dashboard promote or redeploy is added. No longer an overclaim.
3. Version rule: a change before the first deploy keeps 0.9.0 with a re-hash and new pins (matches #616's own step); from the first deploy a change is 0.9.1 (POLICY_VERSIONING:99). Consistent with "Door: two-way until the first deploy".
Also confirmed from your notes: the option-list quote is now a paraphrase marked as such; `sensitive-data` wording is split correctly (only the `terms` row waits on the live pages, AUTH_SETUP.md:34 needs both); "the three .gitattributes lines it adds" is exact (#652's patch adds a blank line, a comment and the `-text` rule, and main's file is identical without them); the CR range is accurate (develop's log ends at CR-47, open PRs reach CR-52, #660 cites CR-54 found nowhere); B2-9's check column does still list /health-privacy, /subprocessors and /delete-account, so "stale" is right.

Added lines (6): no byte at or above 0x80, no dash, ellipsis or emoji, no real family detail. DEVICE_TEST_PLAN.md and RELEASE.md are unchanged in this delta, so my earlier device-plan and RELEASE.md findings stand.

### Notes (not blocking, one clause each)
- "a written route for withdrawing sync and for see/export/correct" is slightly too strong. `docs/engineering/08-data-rights-and-legal-requests.md` (status adopted) has the request matrix and rules DSR-R01 to R14 for withdraw, access and correction. What is missing is an operational runbook under docs/ops/runbooks and the tools (`withdraw_sensitive_data` is in no migration). Suggest "an operational runbook". For the founder when he does these by hand: DSR-R02 says support first confirms control of the account email with a sign-in link or code before any destructive action asked for by email, and DSR-R01 says support never edits rows by hand; the beta texts promise "by hand", so that tension is worth one line to him.
- The "keeps 0.9.0" instruction names pins in `legal-beta.test.ts` and `legal-served.test.ts` and "the copies in #652". The hash is also pinned in `apps/web/e2e/legal-versions.e2e.ts:18-19`; add it or web e2e fails after an edit.
- The Debate line still puts "deploy the website" in quote marks while the answers bullet now says the option was paraphrased. Drop the marks there.
- Carried from before and left as notes: no D- entry in DECISIONS.md for the founder's answers; the RELEASE.md line's "or this release PR does not carry" has no mechanism on a plain develop-to-main merge (the hotfix route in CR-60 is the real one) and should be removed once the pages are on main.

### CI at e192b8a3d54fa0cde3947c7737eb3605278fe07d
After a short wait, 11 check runs, all success (required, tests and content rules, database rules, Deno, typecheck, B-8, applied migrations unchanged, agent team consistent, install, compliance-fence twice); combined status success; mergeable_state clean. I ran packages/content vitest (13 files, 309 passed) and apps/mobile qa-release-catalog plus billing-plan (2 files, 50 passed) at this head. A PASS holds only with required CI green at this exact head, which it is.

### Not verified
The founder's words in the session (the entry now says paraphrase, which is honest); the live site (curl blocked from here; "nothing is live" rests on origin/main having no apps/web/content/legal files); Project docs `infra/cto-rulings-*` for CR-53 to CR-59; apps/web vitest and e2e; whether the hotfix PR would pass web CI on main.

Reviewer: independent of the author (CR-44).
