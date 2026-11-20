## Review B at 24b606cf7fe8caece41cd1c408f85574b76b2797: CHANGES

Delta review of the second push (one commit on 1f60320b). Head confirmed with gh api and `git rev-parse origin/pr-678`. `git diff 1f60320b 24b606cf`: RULINGS.md (CR-60 rewritten, 15 added lines) and RELEASE.md (+1 line); DEVICE_TEST_PLAN.md is untouched since my first review (0 diff lines), so my device-plan findings stand. Worktree at the head; I re-read CR-60 whole and checked each citation.

Result: all six of my earlier must-fix items are fixed in substance. The founder's two answers are quoted, the hold is Karma's recommendation with a default and a one-line release, counsel is dropped as a condition (D-138 item 1 and BL-565 "Decided: publish", Q31 open), the cost is stated, the sequence is now deploy then checks then rows, the door is two-way only until the first deploy, the Debate line and unconsulted seats are there, the id jump is explained, and the RELEASE.md checklist carries the hold. Three small defects remain in text I could check, all in CR-60, none needing redesign.

### Checked and correct
- D-138 item 1 and item 3 text (DECISIONS.md:1079, 1081); #616 at 77941fd3 and #652 at 1189fdff (merge commits from gh api); sha pins and test file names (verified at the first head, files unchanged).
- "Nothing is live": `git ls-tree -r origin/main` has 0 files under apps/web/content/legal; Vercel production branch is main (CR-33, read from the dashboard); the live curl was not possible from here (proxy returned 000), so this rests on git, not on the site.
- AUTH_SETUP.md:34 (no `terms` or `sensitive-data` row, every new account stops); #616 "insert only after step 6 passes"; ALPHA_GO_NO_GO.md:51 is row B2-9 (and :74 says a B2-9 failure means friends get build 1 while the family keeps build 2, worth quoting to him); POLICY_VERSIONING.md:69 (number never reused), :99 (never edited or removed), :105 (in-app links open versioned URLs), :190 (rows immutable), :7 (counsel approver).
- DEVELOPMENT.md:10 and :16 do allow a "Website hotfix" PR into main with a same-day merge-back. It is workable: `git diff origin/main origin/develop -- apps/web` is exactly #652's files plus two main-only changes (package.json bump, copy-rules.test.ts), and apps/web reads nothing from docs/legal at runtime. Precedent: #573 and #600 went to main that way.
- LEGAL_CONTENT_DIR at documents.ts:49. The RELEASE.md line sits inside the section 12 per-release checklist block (RELEASE.md:330).
- Added lines (15): no byte at or above 0x80, no dash, ellipsis, emoji, no real family detail.

### Must fix (each is one clause)
1. "promise that he will do several routes by hand (including closing an under-18 account), for which no runbook exists" is not true as written. `docs/ops/runbooks/underage-account.md` exists for under-18 closure, and `stuck-deletion.md` covers a deletion that did not finish. What is missing is the tool that starts a deletion from an email (BL-551 `ops_open_account_deletion`, in no migration; BACKLOG.md:2508) and a written route for withdraw sync and see/export/correct. Say that.
2. "I accept that for now because the only deploy path is a PR into main, which the founder approves (DEVELOPMENT.md)" overstates the control. CR-20 (RULINGS.md:275) says there is no human approval gate on main (approvals 0, the same account merges); CR-33 adds a required PR with two checks, nothing more. DEVELOPMENT.md's "Founder" column is a written rule. Vercel also deploys by promote or redeploy from its dashboard, not only by a PR. Reword to "a PR into main is required (CR-33) and DEVELOPMENT.md names the founder as who merges it; both are rules, not a gate".
3. "a change is a new version, 0.9.1, before anything is published" contradicts the same entry's "Door: two-way until the first deploy" and #616's own step: before publishing, edits keep 0.9.0, re-run sha256sum and update the pins in legal-beta.test.ts, legal-served.test.ts and #652's copies. The 0.9.1 rule starts at the first deploy (POLICY_VERSIONING:99). Fix the clause.

### Notes (not blocking)
- The founder quote reads "Merge #616 and #652, deploy the website" with "(Recommended)" on the first; I was given 'merge #616 and #652 and deploy the website'. I cannot see the session, so confirm the quote is verbatim before it goes in a log.
- The two answers are quoted in this log and the PR bodies only; no D- entry in DECISIONS.md (principle 2; #652's body called a recorded decision missing). Karma may merge such an entry under D-132.
- "open PRs already use CR-43 to CR-52": CR-46 and CR-47 are on develop and I found no CR-45 anywhere. Say "CR-43 to CR-52 are on develop or in open PRs".
- B2-9's check line still lists /health-privacy, /subprocessors and /delete-account, which the site dropped (#169, POLICY_VERSIONING:102), so "cannot pass" is true but not only because of the hold.
- Hotfix PR: #652 also changes `.gitattributes` (`-text` for the legal md, so line endings never change the hash); "only the apps/web change of #652" should add it. Also remove the RELEASE.md line once the pages are on main.
- RELEASE.md line "or this release PR does not carry" the pages: a develop-to-main merge cannot leave files out except by a revert commit, which a later main-to-develop merge-back would carry into develop. The hotfix route in CR-60 is the real mechanism; the checklist line could say "or the pages reached main by the CR-60 route". Not tried in practice.
- Rewritten in Karma's first person ("I am not carrying that out", "I numbered this CR-60 because" and its reasons): fine if the Karma role signs off on this text, since the first push said it was Karma's file verbatim.

### CI at 24b606cf7fe8caece41cd1c408f85574b76b2797
After a short wait, 10 of 10 check runs success (required, database rules, Deno, tests and content rules, typecheck, B-8, compliance-fence, applied migrations unchanged, agent team consistent, install); Vercel status success; mergeable_state clean; `git merge-tree --write-tree origin/develop` (1189fdff) clean. I ran packages/content vitest (13 files, 309 passed) and apps/mobile qa-release-catalog plus billing-plan (2 files, 50 passed) at this head. A PASS would hold only with required CI green at this exact head, which it is.

### Not verified
The founder's words in the session; the live site (curl blocked); Project docs `infra/cto-rulings-*` for CR-53 to CR-59; apps/web vitest and e2e (no web node_modules in the worktree); that the hotfix PR would pass web CI on main.

Reviewer: independent of the author (CR-44).
