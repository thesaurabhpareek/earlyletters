# Founder queue: every step only you can do, in one order

Status at Wed 28 Oct 2026, 06:30 UTC (11:30 PM PT Tue 27 Oct). Written for retro package R1-01. Read against `origin/develop` at 6bfb94a9 and GitHub REST.

- **Wave 0: 10 of 15 open, 3 partly done, 2 done** (counts of 30 Oct; W0-14 moved from open to partly done). Done: items 2 and 3 (the agent lane and the daily PRD update are off). Partly done: item 4 (#309 closed; the Vercel setting is still on), item 6 (secret scanning and push protection are on; Dependabot alerts could not be read) and item 14 (build 1 prerequisites: a, Apple enrolment, is done on 29 Oct; b to f are open).
- **What the repo can see today** (`node scripts/founder/check.mjs`, 28 Oct): default branch `main`; no branch protection on `develop` or `main` (`main` has only a ruleset: deletion, non-fast-forward, Copilot review); `nightly.yml`, `testflight.yml` and `agents.yml` not registered; `TRUSTED_SIGNING_KEYS` empty; 2 of 26 migration files recorded as applied.
- **Update, Fri 30 Oct 2026:** W0-14a (Apple Developer Program enrolment) is done: Active as of 29 Oct, from the founder's own confirmation emails. Nothing else in this file was re-read on 30 Oct; every other status above and below stands as written on 28 Oct. The shortest path to build 1 from here is the last section of [`docs/release/TESTFLIGHT.md`](TESTFLIGHT.md).
- **1 of 57 boxes** in `docs/FOUNDER_TASKS.md` is ticked (FT-01, Apple enrolment, 30 Oct). Steps done outside the repo (Apple, Expo, Supabase) are marked "unverified": tell the coordinator and the line changes.

How to use it: work top to bottom. Each item gives the steps (or the exact section that holds them), your hands-on time, what it unblocks, and how its status can be checked. "Same as" lists the ids in older lists that this item replaces; the index at the end maps every old id. Older lists stay as they are: `docs/FOUNDER_TASKS.md` (FT), `docs/release/AUTOMATION.md` section 4 (AF), [`docs/release/TESTFLIGHT.md`](TESTFLIGHT.md) (steps 1 to 12), the 15 Oct alpha plan on commit 1ae1ace6 (F01 to F27, see `docs/release/ALPHA_PLAN.md`), and `docs/agents/BOARD.md` line 85. Where they disagree on dates, the dates in this file are not authoritative either: dates come from the dates file the coordinator names.

**The checker.** From your computer, signed in to `gh`: `node scripts/founder/check.mjs` (add `--json` for a machine copy). It only reads, through GitHub REST GET calls. Exit 0: all checked items done; 1: something open; 2: nothing open but something unreadable. Your own `gh` login reads branch protection; an agent token may not.

Never paste a secret into a chat, an issue, the repo or an email (`docs/FOUNDER_TASKS.md:9`).

---

## 0. Dated steps from the CTO run (Fri 30 Oct 2026)

The coordinator's proposed order for the weekend, from `docs/release/TESTFLIGHT.md` ("Where build 1 stands"). Dates are proposals; the freeze is Tue 3 Nov 5:00 AM PT and the go/no-go Thu 5 Nov (both proposed, `docs/release/AUTOMATION.md` section 6). Minutes are your hands-on time as the named steps give them; the waits are not yours. Never paste a secret into a chat. This section repeats steps that W0-08, W0-09, W0-14 and Q2-01 to Q2-10 hold, in the order for the weekend; those ids stay the record.

| # | By | Step | Minutes | Unblocks |
|---|---|---|---|---|
| 1 | Fri 30 Oct | Check whether Porkbun DNSSEC is on for `earlyletters.app`; if it is, turn it off, remove its DS record and start the 24 to 48 hour wait. Then open the Cloudflare account (TESTFLIGHT step 4 item 1). Also confirm that the repository variable `AGENTS_ENABLED` is not already `true` (Settings, Secrets and variables, Actions, Variables) | counted in row 5's 150, plus 1 | Everything in step 4, which holds the only multi-day wait; the held PR #398 |
| 2 | Sat 31 Oct | Expo account and `eas init`; send the project id and the account name (step 3.1) | 20 | Every `eas build`; the one-line project-id PR |
| 3 | Sat 31 Oct | App Store Connect: the `.preview` App ID, the app record, internal testers; send the app record's numeric Apple ID (step 2 items 1 to 4) | 45, plus about 5 for each internal tester | Build 1 upload; builds from GitHub |
| 4 | Sat 31 Oct | Forward the counsel relay document (a Claude document, not in the repo; its link is in chat; items 26 to 28 are new) to counsel | 5 | The Delete account lines, before the Delete account row is shown to testers |
| 5 | Sun 1 Nov (only if DNSSEC was off; with it on, Mon 2 Nov or later) | Step 4 items 2 to 4 once the Cloudflare zone is Active: R2 bucket and custom domain, `keygen` twice, `publish release`, `upload`, the one PR with the keys | about 140 (the rest of step 4's 150) | Words from speech; clears the two preflight FAILs |
| 6 | Sun 1 to Mon 2 Nov | Build 1: create the "Family" group with automatic distribution off (unverified before the first upload, step 5), then `doctor`, `preflight` (expect 0 FAIL), `eas build`, `eas submit`, add to "Family" (step 5) | 30 | Testers on build 1 |
| 7 | Mon 2 Nov | GitHub settings by `scripts/release/github-settings.ts` (FT-20): the second approver account (AF-02), branch protection on `main` and `develop` (AF-03) and the Environments `testflight` and `staging` (AF-07). For builds from GitHub also the Expo robot-user token as the `testflight` environment secret (step 3.2) and the App Store Connect API key with role App Manager (step 2.6, 15) | about 30 with the script, 50 by hand | Builds from GitHub; any agent harness; `AGENTS_ENABLED` |
| 8 | Mon 2 Nov | Build 2 setup: steps 6 to 9 and 12 of TESTFLIGHT.md (staging, auth, Apple sign-in, EAS variables, purge worker). Step 10, the website links, is optional (15) | 325 (90 + 120 + 45 + 10 + 60) | Build 2; the Delete account row |
| 9 | Tue 3 Nov, after the freeze commit | Build 2: step 11, preflight, build, submit, add to "Family" only | 20 | Family on build 2 |

Rows 7 and 8 both fall on Mon 2 Nov: about 6 hours, before build 1's spill-over, with the freeze the next morning. If that is too much, row 8 moves to Tue 3 Nov and Wed 4 Nov and the go/no-go moves with it; that is a date for you to set.

The default branch stays `main` for now (W0-09 waits; `docs/agents/cto/RULINGS.md` CR-2). The questions only you can answer (spend, the Privacy row, the Delete account row in build 2, the dates) were put to you in chat on 30 Oct with the CTO's recommendation and a default; the rulings behind them are in `docs/agents/cto/RULINGS.md`.

## 1. Wave 0: this week, smallest first

Source: retro synthesis section 4, Wave 0 (28 Oct). Agents can prepare text for these; only you can do them.

**W0-01 Detach connectors from the three Early Letters scheduled tasks.** Open. About 5 minutes.
- Steps: claude.ai, Scheduled tasks. Open "Early Letters: agent lane (every 4 hours)", "Early Letters daily PRD update" and "Early Letters daily docs run". Remove every connector **except Claude_Code_Remote**: the tasks get `add_repo`, and so GitHub, from that connector. Remove Supabase, Vercel, Gmail, PayPal, Square, Figma, Google_Drive, Google_Calendar, Claude_Docs, and on the PRD update and the docs run also Google_Sheets, Google_Docs, Notion, Resend and Wispr_Flow. Read on 28 Oct (list_triggers, read only): the agent lane carries 10 connectors, the PRD update and the docs run 15 each, Claude_Code_Remote on all three.
- Correction: the retro synthesis (Wave 0 item 1) said to remove every connector including Claude_Code_Remote. That would take away `add_repo`. Keeping it leaves one known risk: Claude_Code_Remote also lets an unattended run change scheduled tasks, so the prompts' "never change this schedule" line stays the only guard (R1-04).
- Unblocks: any safe re-enable of W0-02 or W0-03.
- Verify: the task's connector list is empty in claude.ai. The checker cannot see it.

**W0-02 Disable the agent lane.** Done 28 Oct 06:05 UTC (11:05 PM PT Tue 27 Oct) by the retro session: `enabled: false`, `updated_at` 06:05:39 UTC (list_triggers, read 28 Oct). Its connectors are still attached (W0-01).
- Re-enable only after a supervised run leaves a journal entry and a board tick, with the procedure-only prompt from retro package R1-04. The live prompt still cites issue #127 as "Decisions in force".

**W0-03 Pause the daily PRD update until after 5 Nov, then weekly.** Done 28 Oct 06:05 UTC by the retro session: `enabled: false`, `updated_at` 06:05:57 UTC. The **daily docs run** was disabled 28 Oct 05:30 UTC (`updated_at` 05:30:48 UTC); leave it off. Connectors still attached on both (W0-01).

**W0-04 Close #309 and turn off automatic Vercel Agent pull requests for the website project.** Partly done: #309 (author `vercel[bot]`, into `main`) was closed unmerged on 28 Oct at 06:16 UTC (REST). Still open: turn off automatic Vercel Agent pull requests so another one does not arrive. About 3 minutes. The Vercel setting's exact name is unverified.
- Why: #309 adds Vercel Web Analytics and flips the guard test in `legal.test.ts` from "must not mention" to "must mention" (retro synthesis section 1, row 21).
- Verify: `gh api repos/thesaurabhpareek/earlyletters/pulls/309 --jq .state` prints `closed`.

**W0-05 Decide #316.** Open: #316 is open (REST, 28 Oct). 1 minute. Recommendation in the synthesis: close it. Making it spend the credit needs W0-09, an `ANTHROPIC_API_KEY` secret and `AGENTS_ENABLED=true` (`.github/workflows/agents.yml:42`), which starts an unattended lane in freeze week. Decision brief: R1-09.
- Verify: #316 state.

**W0-06 Secret scanning, push protection and Dependabot alerts.** Partly done. 2 minutes.
- Read 28 Oct (REST `security_and_analysis`): secret scanning **enabled**, push protection **enabled**, Dependabot security updates disabled. Dependabot alerts: unreadable with an agent token (HTTP 403).
- Steps left: GitHub, Settings, Code security: turn on "Dependabot alerts" if it is off. CodeQL default setup and Dependabot updates are AF-24, after the alpha.
- Verify: checker `secret-scanning` and `dependabot-alerts`.
- Same as: AF-24 (part).

**W0-07 Reissue `EXPO_TOKEN` from an Expo robot user.** Unverified (secrets cannot be read). 10 minutes.
- Steps: `docs/security/SECRETS_REVIEW.md` section 1. A robot user with the Developer role, never a personal token. Put it in the GitHub Environment `testflight` once W0-08 creates it; keep any repository `EXPO_TOKEN` until one `testflight.yml` run with the environment secret is green (AUTOMATION AF-07, AF-22).
- Unblocks: every build from GitHub Actions.
- Same as: TESTFLIGHT step 3.2, AF-07 (token part).

**W0-08 Branch protection on `develop` and `main`, the approver account and the environments.** Open. About 30 minutes.
- Before: make the approver account (AF-02): a second GitHub account, passkey only, never connected to claude.ai, a connector, a CLI or an agent machine; invite it with Write and accept from that account. The branch `release/ios-v1.0` still exists (REST, 28 Oct); #76, which targeted it, is closed. Delete the branch first, or expect `--verify` to flag it (`docs/FOUNDER_TASKS.md` FT-20, "Your call").
- Steps: on your computer, signed in to `gh` as owner, at `develop`'s head: `npm ci`, then `npx tsx scripts/release/github-settings.ts --approver <approver login>` (dry run; read it), then the same with `--apply`, then `--verify`, which must print "Settings match the spec". Required checks it sets: `required` and `applied migrations unchanged` (`scripts/release/github-settings.ts:46`). Then confirm in Settings that the Release launch check from `.github/workflows/ios-compile.yml` is required too if you want it to block merges (the script does not list it). Then add environment secrets, in the order of `SECRETS_REVIEW.md` section 9.
- Unblocks: no direct pushes to `develop` or `main`; environments `staging` and `testflight` with a reviewer; every secret after it.
- Verify: checker `protection-develop` and `protection-main`.
- Same as: FT-20, AF-02, AF-03, AF-07 (environments), AF-23 (rulesets the script also sets), TESTFLIGHT step 6.2.

**W0-09 Default branch to `develop`.** Open: default branch is `main` (REST, 28 Oct). 10 minutes.
- Before: (1) in Vercel, confirm the website's Production Branch is `main`; (2) the ruleset "Copilot review for default branch" targets `~DEFAULT_BRANCH`, so add `main` to it by name first, or `main` loses its deletion and force-push rules (retro synthesis section 1, row 4).
- Steps: GitHub, Settings, General, Default branch: `develop`.
- After: `nightly.yml` and `testflight.yml` register; `agents.yml` registers but stays idle while `AGENTS_ENABLED` is unset; the "Kill harness nightly-size dispatch" scheduled task disables itself on its next run (its step 1).
- Unblocks: the Run workflow button for `testflight.yml` and `deploy-db.yml` (TESTFLIGHT steps 5 and 6.3), the scheduled nightly (B2-22).
- Verify: checker `default-branch` and `workflows-registered`.
- Same as: AF-05; BOARD line 85 ("AF-05").

**W0-10 Decide #302** (the child's first name on the live website, D-118). Open: #302 is open into `main` (REST, 28 Oct). 15 minutes to decide. Keep it knowing it is permanent in a public repo and site, after a privacy view; or use the fictional family. Separately, decide with counsel whether to check public git history for details from before #52. Decision brief: R1-09.

**W0-11 Confirm or amend D-117's operating rule in one line.** Open. 5 minutes. The question: may the coordinator keep merging `supabase/**`, auth, payments and `.github/**` after two review passes (`docs/DECISIONS.md:810`)? Synthesis recommendation: yes, plus a weekly skim of a list of those merges (R1-03 prints it).

**W0-12 Five one-line scope decisions.** Open. 30 minutes. (a) analytics in v1.0, off or on with consent (D-095 says off, `docs/DECISIONS.md:590`); (b) the sync conflict note: build it, or descope and tell testers; (c) the `plan.ts` backup gate against D-111 item 6, fixed by the build thread; (d) task #53 recorded as a D-id; (e) the harness: provision or retire `agents.yml` and trim the roster, by 5 Nov. Briefs: R1-09.

**W0-13 Engage counsel and send one packet built from #163.** Open: #163 and #136 are open (REST, 28 Oct). Hours. Ask which texts apply to the alpha and the "Friends" group.
- Unblocks: legal pages in final form, Friends signing in, submission.
- Same as: FT-03, FT-18, F07; feeds F22, FT-31, FT-33, FT-41, FT-46, FT-47.

**W0-14 Build 1 prerequisites.** Partly done: a is done (29 Oct); b to f are open. Hours to days. The letters below keep their names, but do the rest in the order of the last section of [`docs/release/TESTFLIGHT.md`](TESTFLIGHT.md): step 4 item 1 first (c, the DNS wait is the only multi-day one), then 3.1 (d), then step 2 (b), then the rest of step 4 (c), then step 5 (e). f is step 6, which TESTFLIGHT "What each build needs" lists for build 2 only.
- **a. Apple Developer Program enrolment** as an individual, then accept the agreements. **Done 29 Oct 2026**: Active, from the founder's own confirmation emails (an agent cannot see Apple, so the checker cannot confirm it; whether the latest agreements are accepted is not in the emails). Was 45 minutes plus Apple's check. It unblocked every Apple step. Steps: TESTFLIGHT step 1. Same as FT-01, F01, AF-01.
- **b. App Store Connect: `.preview` App ID, app record, testers, groups** "Founder" and "Family" internal and "Friends" external, automatic distribution off on each; the App Store Connect API key with role App Manager (step 2.6; needed only for builds from GitHub, not for build 1 from your computer). 45 minutes plus 5 per tester. Steps: TESTFLIGHT step 2. Status unverified. Same as FT-07 (2.1, 2.2), FT-08, F08, AF-09.
- **c. Pack signing keys, pack host and the signed English release** (D-115: required for build 1). About 2.5 hours plus DNS. Steps: TESTFLIGHT step 4 and `docs/ops/PACKS_HOSTING.md`. Status: open, `TRUSTED_SIGNING_KEYS` is empty (`packages/api/src/keys.ts:19`). Verify: checker `trusted-signing-keys` (needs 2: primary and backup). Same as FT-16, F09, F13, AF-08, AF-12.
- **d. Expo account and project id.** 20 minutes, then a one-line PR by S20. Steps: TESTFLIGHT step 3.1. Status unverified. Same as FT-17 (account part), F02, AF-04. The token is W0-07.
- **e. Build 1:** on `develop` (`git switch develop && git pull`, then `npm ci`), `npx tsx scripts/release/doctor.ts` (it reads the working tree, so it FAILs on a stale branch), then the preflight, build, submit, add to "Family". 30 minutes plus the queue. Steps: TESTFLIGHT step 5 (choose App Manager if `eas submit` asks for a key role). Same as F12, AF-10, FT-25 (first build).
- **f. `scribe-staging`** in a Supabase organization the agents' connector is not authorized for; a named publishable key; legacy keys off. 1.5 hours. Steps: TESTFLIGHT step 6.1, `docs/release/ENVIRONMENTS.md`, AUTOMATION AF-06. Status unverified. Same as F04, AF-06, FT-10 (create part).

**W0-15 Decide /support and its mailbox, and start a content-free data-request log** before anyone outside the founding family installs. Open. 20 minutes.

---

## 2. Next: build 2 and the alpha

Order follows TESTFLIGHT "What each build needs". Status for each is unverified unless stated.

| Id | Step (exact steps in) | Time | Unblocks | Status and how to verify | Same as |
|---|---|---|---|---|---|
| Q2-01 | Staging schema through CI: one catch-up run of `deploy-db.yml` on `develop`, approve, then a PR recording the files; then APPLY steps 6 (pepper), 7 (purge cron), 8 (beta policy versions `terms` and `sensitive-data`), 15 (settings, statement logging off), spend cap on (TESTFLIGHT step 6.3 and 6.4) | 1 h | every server feature in build 2 | Checker `migrations-applied`: 2 of 26 files recorded in `.github/migrations-applied.txt` on 28 Oct | FT-10, F16, AF-13 (seeding) |
| Q2-02 | Supabase Auth on staging with Resend SMTP; click and open tracking off (TESTFLIGHT step 7; `docs/ops/AUTH_SETUP.md` 1, 4, 5.1, 6) | 2 h | email sign-in in build 2 | unverified | FT-12, FT-13, F05, F10 |
| Q2-03 | Email code length: 6 or 8; the dashboard and `EXPO_PUBLIC_EMAIL_OTP_LENGTH` must match (TESTFLIGHT step 7, "Your call") | 5 min | sign-in for anyone outside the family | open | FT-04 item 8 |
| Q2-04 | Sign in with Apple: key, Team ID, email relay, Supabase Apple provider with the `.preview` id (TESTFLIGHT step 8) | 45 min | Apple sign-in in build 2 | unverified | FT-07 (2.4, 2.5), FT-12 (2.6), F11 |
| Q2-05 | EAS `preview` environment variables (TESTFLIGHT step 9) | 10 min | build 2 reaching staging | unverified; `eas env:list --environment preview` | F06, FT-17 (variables) |
| Q2-06 | Website links: Vercel `APPLE_TEAM_ID`, `IOS_BUNDLE_ID`, then the two `curl` checks (TESTFLIGHT step 10) | 15 min | sign-in and invite links opening the app | #144 merged into `main` (TESTFLIGHT step 10); the Vercel values and the checks unverified | F15, FT-31 (well-known part) |
| Q2-07 | Staging function secrets and deploys (`apple-token`, `purge-worker`, `config`, `content`), purge schedule (TESTFLIGHT step 12; `docs/ops/SECURITY.md` 1.1) | 1 h | Delete account in build 2 | unverified; each function's health path answers 200 (AUTOMATION 0.2 row 12) | FT-11, F17, AF-13 (functions) |
| Q2-08 | Escrow parts 1 and 2 (`docs/ops/BACKUP_RUNBOOK.md` B2 to B7) | 2.5 h | restore through escrow | unverified; whether build 2 still needs it: ask the build thread | F18, F20 |
| Q2-09 | Plus in the sandbox, optional: Paid Apps agreement, tax and bank; `plus.monthly`, `plus.annual` on the `.preview` record (TESTFLIGHT step 2.5) | 1 h 45 min | Plus checks | unverified | FT-06, FT-09, F14 |
| Q2-10 | Build 2: `preflight:alpha`, build `preview`, submit, add to "Family" only (TESTFLIGHT step 11) | 20 min | the alpha with servers | open | F24 |
| Q2-11 | Drills on real phones: AUTH_SETUP section 11 and two-phone sync (F19); backup drill (F23); build 2 checks StoreKit D-1 to D-12 and the SE 3 kill subset (F25) | 7 h | go/no-go evidence | unverified | F19, F23, F25, FT-22, FT-39 |
| Q2-12 | Mac kit run for ADR 0027 V3 and V4: `npm run adts-parity -w @scribe/experiments` (`experiments/README.md` section 8) | unverified | ADR 0027 | open (BOARD line 85, by Fri 30 Oct) | BOARD line 85 |
| Q2-13 | Delete the scratch branch `exp/plant-launch-throw` by hand (#285 closed) | 1 min | tidy branches | open: the branch exists (REST, 28 Oct) | BOARD line 85 |
| Q2-14 | R-17 sign-off: read `docs/security/REVIEW_R17_CHECKLIST.md` and the staging `test:db` evidence; record "R-17 passed" | 30 min | Friends may sign in (D-100) | open; a D-id records it | F21 |
| Q2-15 | Friends: build 1 to Beta App Review for "Friends", invite by email (AF-11 replaces F26's route of adding friends as App Store Connect users, AUTOMATION section 4 intro) | 30 min plus review | friends on build 1 | unverified | AF-11, F26 |
| Q2-16 | Answer the proposed dates (freeze Tue 3 Nov 13:00 UTC, go/no-go Thu 5 Nov), overdue since Sat 24 Oct (BOARD line 85); then the go/no-go with the coordinator (`docs/qa/ALPHA_GO_NO_GO.md` section 3) and, if go, build 2 to "Friends" | 30 min | the alpha | open | F27, BOARD line 85 |
| Q2-17 | Upgrade Vercel to Pro (Hobby is non-commercial; AUTOMATION 0.1 item 10) | 10 min | commercial use of the site | unverified; price unverified | AF-15 |

---

## 3. After the alpha

| Id | Step (exact steps in) | Time | Status | Same as |
|---|---|---|---|---|
| Q3-01 | Actions settings: read-only default permissions, no PR creation by Actions, `pull_request_target` for `fence.yml` only, SHA pinning required (AUTOMATION AF-20) | 20 min | open | AF-20 |
| Q3-02 | CODEOWNERS for the approver, then "Require review from Code Owners" (AF-21) | 10 min | open | AF-21 |
| Q3-03 | Remaining environments; delete the repository `EXPO_TOKEN` after one green environment run (AF-22) | 30 min | open | AF-22 |
| Q3-04 | CodeQL default setup and Dependabot updates (AF-24; alerts are W0-06) | 10 min | open | AF-24 |
| Q3-05 | App Store Connect API team keys; private feedback repository; machine user or organization decision; `R17_PASSED` (AF-25 to AF-28) | 1.5 h | open | AF-25, AF-26, AF-27, AF-28 |
| Q3-06 | Production: the `com.earlyletters.scribe` record, App Privacy answers by hand, production Supabase in the separate organization, external test information (AUTOMATION "Production") | unverified | open | AF-40 to AF-43, FT-23, FT-43 (privacy answers) |
| Q3-07 | v1.0 submission path; its 3 Oct dates have moved (`docs/release/ALPHA_PLAN.md:3`): FT-19 mailing address, FT-21 recordings, FT-26 C1 families, FT-27 reviewers, FT-28 and FT-35 trademark, FT-29 Small Business Program, FT-30 DPAs, FT-32 C1, FT-33 and FT-41 counsel, FT-34 languages, FT-36 support resources, FT-37 insurance, FT-38 screenshots, FT-40 C1 exit, FT-42 Hindi script (D-031 is Open, due 30 Oct, `docs/DECISIONS.md:215`), FT-43 listing, FT-44 release PR, FT-45 submit, FT-46 to FT-51 | per FT item | open | the FT ids named |
| Q3-08 | Account hygiene: password manager and two-factor on every console (FT-02), Porkbun lock and DNSSEC (FT-05), DNS records (FT-14) | 3 h | unverified | FT-02, FT-05, FT-14 |

---

## 4. Index: every old id, once

| Source | Where each id went |
|---|---|
| FT (`docs/FOUNDER_TASKS.md`) | FT-01 W0-14a. FT-02 Q3-08. FT-03 W0-13. FT-04: item 1 answered by D-097, item 2 by D-098, item 3 by D-099, item 4 D-045 still "Recommended" (`DECISIONS.md:303`), item 5 unverified, item 6 W0-14f and Q3-06, item 7 answered 15 Oct (`FOUNDER_TASKS.md:95`), item 8 Q2-03. FT-05 Q3-08. FT-06 Q2-09. FT-07 W0-14b and Q2-04. FT-08 W0-14b. FT-09 Q2-09. FT-10 W0-14f and Q2-01. FT-11 Q2-07. FT-12 Q2-02 and Q2-04. FT-13 Q2-02. FT-14 Q3-08. FT-15 cut for the alpha (neither alpha build offers Google sign-in, `docs/release/TESTFLIGHT.md:199`). FT-16 W0-14c. FT-17 W0-14d and Q2-05. FT-18 W0-13. FT-19 Q3-07. FT-20 W0-08. FT-21 Q3-07. FT-22 Q2-11. FT-23 Q3-06. FT-24 overtaken by D-095 (no analytics SDK in v1.0) unless W0-12a changes it. FT-25 W0-14e. FT-26 to FT-30 Q3-07. FT-31 Q2-06 and W0-13. FT-32 to FT-38 Q3-07. FT-39 Q2-11 and Q3-07. FT-40 to FT-51 Q3-07. FT-52 answered by D-084. FT-53 answered by D-082 and D-083. FT-54 answered by D-074 and D-086. FT-55 answered by D-073 and D-085, then D-100. FT-56 see D-087 (whether it covers the birthday: unverified). FT-57 unverified. |
| AF (`docs/release/AUTOMATION.md` section 4) | AF-01 W0-14a. AF-02 and AF-03 W0-08. AF-04 W0-14d. AF-05 W0-09. AF-06 W0-14f. AF-07 W0-08 and W0-07. AF-08 W0-14c. AF-09 W0-14b. AF-10 W0-14e. AF-11 Q2-15. AF-12 W0-14c. AF-13 Q2-01 and Q2-07. AF-14 overtaken: the harness runs on the macOS runner (AUTOMATION 0.2 row 13, measured 24 Oct). AF-15 Q2-17. AF-20 Q3-01. AF-21 Q3-02. AF-22 Q3-03. AF-23 W0-08. AF-24 W0-06 and Q3-04. AF-25 to AF-28 Q3-05. AF-40 to AF-43 Q3-06. |
| TESTFLIGHT steps | 1 W0-14a. 2 W0-14b (2.5 is Q2-09). 3 W0-14d and W0-07. 4 W0-14c. 5 W0-14e. 6 W0-14f, W0-08 and Q2-01. 7 Q2-02 and Q2-03. 8 Q2-04. 9 Q2-05. 10 Q2-06. 11 Q2-10. 12 Q2-07. |
| F (alpha plan, 1ae1ace6 section 4) | F01 W0-14a. F02 W0-14d. F03 overtaken by D-111 (alpha calls resolved 17 Oct; item by item unverified). F04 W0-14f. F05 Q2-02. F06 Q2-05. F07 W0-13. F08 W0-14b. F09 W0-14c. F10 Q2-02. F11 Q2-04. F12 W0-14e. F13 W0-14c. F14 Q2-09. F15 Q2-06. F16 Q2-01. F17 Q2-07. F18 Q2-08. F19 Q2-11. F20 Q2-08. F21 Q2-14. F22 W0-13. F23 Q2-11. F24 Q2-10. F25 Q2-11. F26 Q2-15. F27 Q2-16. W (daily merge window) overtaken by D-117. |
| BOARD line 85 | TESTFLIGHT steps 1 to 5: W0-14a to e. Mac kit run: Q2-12. Scratch branch: Q2-13. AF-05: W0-09. Proposed dates: Q2-16. |
| Retro Wave 0 | Items 1 to 15 are W0-01 to W0-15. |
