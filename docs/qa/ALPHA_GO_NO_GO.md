# Alpha go/no-go: build 1 (servers off) and build 2 (servers on)

Owner: S19 (QA). Version 0.1, Thu 15 Oct 2026. For the founder and the coordinator at each build, and at the go/no-go on **Thu 29 Oct 2026** (D-106; `docs/release/ALPHA_PLAN.md` section 6 on PR #152). This file is the QA side of that decision: each line names its evidence, and S19 keeps the evidence index in section 6.

Checked against origin on Thu 15 Oct 2026 at about 18:10 UTC (`develop` 56ec5b5) and again on Fri 16 Oct 2026 (`develop` c7e08d1, after #108, #122 and #128 put D-089 to D-108 on `develop`); pull request states read from the GitHub API. Status words: **pass** (evidence linked), **open** (not merged or not run), **fail**, **n/a** (with the reason).

The sources this file links instead of restating:
- **R-17 rows and evidence**: `docs/security/REVIEW_R17_CHECKLIST.md` on S02's PR [#140](https://github.com/thesaurabhpareek/earlyletters/pull/140) ([the file on its branch](https://github.com/thesaurabhpareek/earlyletters/blob/feat/db-v1-gate/docs/security/REVIEW_R17_CHECKLIST.md)). S01's auth items are in `docs/security/REVIEW_R17_AUTH.md` on [#139](https://github.com/thesaurabhpareek/earlyletters/pull/139).
- **The two alpha build profiles, the preflight, the flip and the kill path**: S20's [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) (`apps/mobile/eas.json`, `apps/mobile/scripts/preflight-testflight.mjs`, `docs/release/TESTFLIGHT.md`, `docs/ops/ENVIRONMENTS.md`).
- **Sign-in links on the website** (`/auth/confirm` and the AASA file for the `.preview` app): S20's [#144](https://github.com/thesaurabhpareek/earlyletters/pull/144), into `main`.
- **Dates, founder steps F01 to F27 and the decision rule**: `docs/release/ALPHA_PLAN.md` on [#152](https://github.com/thesaurabhpareek/earlyletters/pull/152).

## 0. The short answer on 16 Oct

- **Build 1 (servers off)** can go to Family and Friends once the build check in section 2 passes on a real phone. The R-17 gate does not apply to it: it has no sign-in, no sync and no Supabase client. Nothing has run on a phone yet, because no build exists (Apple enrolment F01 and the Expo project F02 are not done).
- **Build 2 (servers on)** is **no-go today**. All six R-17 items are open: none is merged to `develop` (section 1; the rows are in #140's checklist). The shared security review is not signed, staging does not exist, S20's alpha profiles (#145) and website auth wiring (#144) are not merged, and none of the build 2 drills has run. Under D-100 nobody outside the founding family signs in until R-17 passes; the family may use build 2 before that (the alpha plan's rehearsals and build 2 go to the founder's own phones and the family only).

## 1. The R-17 security gate (D-100, PRD V2 09 R-17, F02-REQ-024)

Nobody outside the founding family signs in before all six items are merged to `develop` and the shared review passes. **The rows, the evidence each needs and the sign-off live in `docs/security/REVIEW_R17_CHECKLIST.md` on #140**; that file is the gate. This table only says where each item stands, so the go/no-go can read it at a glance.

| Item | On `develop` (c7e08d1) | Pull request | Status on 16 Oct |
|---|---|---|---|
| **BL-347** (review H1) | Not built | [#139](https://github.com/thesaurabhpareek/earlyletters/pull/139), draft | **OPEN** |
| **BL-330** (review H3) | Not built | [#139](https://github.com/thesaurabhpareek/earlyletters/pull/139), draft; deploy needs founder step F17 | **OPEN** |
| **BL-331 with BL-332** | Part only (`20261005000000`); checklist section 4 also records a Critical on `develop` that only #140 fixes (DB-01, `book_entries` writes) | [#140](https://github.com/thesaurabhpareek/earlyletters/pull/140), draft | **OPEN** |
| **`peek_invite` with BL-334** | Not built (no `peek_invite`; the pepper still falls back to empty) | [#140](https://github.com/thesaurabhpareek/earlyletters/pull/140), draft | **OPEN** |
| **BL-322** | Not built | [#148](https://github.com/thesaurabhpareek/earlyletters/pull/148), open. It was written against closed #142's `peek_invite`; check it against #140's before the batch | **OPEN** |
| **BL-349** | Part only: required-reason APIs declared (#27), but `NSPrivacyCollectedDataTypes` is `[]` in `apps/mobile/app.config.ts` on `develop` and on #145, and build 2 syncs | **None** | **OPEN** for build 2; build 1 owes only Apple's upload email (B1-10) |

**Plainly: the R-17 gate has not passed. All six items are open, none is merged, #139 and #140 are drafts, and BL-349 has no pull request.** The gate-wide rows (staging, `test:db` against staging, the reviews and the founder's label) are open too: see checklist sections 1 and 9. The alpha plan books the batch to merge on Wed 21 Oct and the sign-off on Mon 26 Oct (F21).

## 2. Build 1 checklist (servers off)

Build 1 is the `testflight` profile (PR #145): `EXPO_PUBLIC_SERVER_FEATURES=off`, backup, status report and analytics off, bundle id `com.earlyletters.scribe.preview`. Due Tue 20 Oct (F12).

| # | Check | Evidence | Status 15 Oct | Signs |
|---|---|---|---|---|
| B1-1 | Built from a known `develop` commit with the `testflight` profile; every server, backup, status-report and analytics flag off | EAS build page (commit, profile); the profile as defined on [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) | open: #145 not merged; F01 and F02 not done | S20 |
| B1-2 | The TestFlight preflight clean except founder items | Its output, with the checks as [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) defines them (`apps/mobile/scripts/preflight-testflight.mjs`) | open | S20 |
| B1-3 | `npm test`, `npm run typecheck` and `npm run test:db` green on that commit; this includes the English R-01 and verifier suites (zero accepted meaning changes, never waived) | CI run on the commit | open (green on this branch at its head, section 7) | Coordinator |
| B1-4 | No server path in the build (AL-08 part A) | AL-08.1 to AL-08.3 | open (needs a phone) | S19 |
| B1-5 | First run and permissions: the 18+ gate first, nothing preselected, no OS prompt before Speak, download asks first (AL-01) | AL-01.1 to AL-01.12 on SE 3 | open (needs a phone) | S19 |
| B1-6 | Record, words, edits put back, typed text exact, offline with no requests (AL-02) | AL-02.1 to AL-02.10, AL-02.12 | open (needs a phone) | S19 |
| B1-7 | Kill during save and while recording, 10-run hand subset: 0 lost, 0 doubled (never waived; the 500 and 50 runs gate build 2) | AL-03.1 to AL-03.3 tallies | open (needs a phone) | S19 |
| B1-8 | Export complete and free, offline (never waived) | AL-03.4; AL-02.9 | open (needs a phone) | S19 |
| B1-9 | Nothing in build 1 says more than it does: no sign-in, sync or sharing promised; the "early version" note in About; "What to test" text as on #145 | S16's claim list for build 1 | open | S16, founder |
| B1-10 | Apple's processing email after upload has no privacy-manifest warning (ITMS-91053), so the declared reasons hold (BL-349, build 1 part) | The email, read by the founder (not committed) | open | Founder |
| B1-11 | Testers are told it is an early test and never to put a child's name or a letter's words into TestFlight feedback or screenshots (07 section 4.2) | The invitation text | open | Founder |
| B1-12 | Record only, not a gate for the alpha: download size from App Store Connect (TF-01, the 40 MB gate is G3) | TF-01 row | open | S20 |

Build 1 goes to Family and Friends when B1-1 to B1-9 and B1-11 pass. B1-10 and B1-12 are recorded the day Apple's numbers arrive.

## 3. Build 2 checklist (servers on, staging)

Build 2 is the `preview` profile from the freeze commit (Tue 27 Oct 12:00 UTC), servers on against staging, backup on only if AL-06 passes. The rows are the alpha plan's ten items (section 1.1) and go/no-go checks (section 6.1), each with the drill that proves it.

| # | Check | Evidence | Status 15 Oct | Signs |
|---|---|---|---|---|
| B2-1 | Built from the freeze commit with the `preview` profile as [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) defines it, and its preflight clean (#145's build 2 rows, including the invite-link fragment check that stays a FAIL until `fix/invite-link-fragment` lands); installed from TestFlight on two iPhones; it is the build friends will get (6.1 check 1) | EAS build page; TestFlight build number; preflight output | open | S20 |
| B2-2 | Everything in section 2 rows B1-2, B1-3, B1-5, B1-6 and B1-8 also passes on build 2 | AL-01, AL-02 (with AL-02.11) on build 2 | open | S19 |
| B2-3 | Item 1, sign-in: Apple and email by link and by code; letters join an account only after the claim screen (BL-347) | AL-04.1 to AL-04.13 | open: needs #139 merged, staging (F04, F10, F11, F16, F17), and the `/auth/confirm` page and AASA from [#144](https://github.com/thesaurabhpareek/earlyletters/pull/144) live on `main` (F15) | S19, S01 |
| B2-4 | Item 2, two-phone sync: letters, edits, deletes and restores reach the other phone; offline letters queue and sync once | AL-05.8 to AL-05.13; `apps/mobile/test/sync-two-phone.test.ts` green (#146) | open: needs #146 and the S02 sync server (WP-F16-14) | S19, S03 |
| B2-5 | Item 3, invite and join with the two-parent cap: asks first, nothing preselected, a third parent refused on create and on accept, leave works | AL-05.1 to AL-05.7, AL-05.15 | open: needs #140 and #148 | S19, S04 |
| B2-6 | Item 4, backup and the restore drill: zero plaintext, resume after a kill, restore with equal hashes, the recovery request and its email | AL-06.1 to AL-06.6 (with S05's B6 rows) | open: needs #150, #151, F18, F20 | S19, S05 |
| B2-7 | Item 5, Plus in the sandbox: buy, restore, manage; only own letters with words count | AL-09.1 to AL-09.12 | open: needs F14 and S06's Keep gate | S19, S06 |
| B2-8 | Item 6, words arriving: a signed manifest served from `packs.earlyletters.app`; an English letter gets its words on the SE 3 and the current iPhone | AL-02.2 on both phones, with the time to words | open: needs F09, F13 and the keys PR | S19, S08 |
| B2-9 | Item 7, legal pages live in holding or final form, matching the policy versions published on staging | `curl` of `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/delete-account` | open (F22) | S20, founder |
| B2-10 | Item 8, the experience pass for J1 to J8 is in and seen on build 2 | Spec checklist at 100% for P0 lines; critics' sign-off | open | Experience critics |
| B2-11 | Item 9, no data loss: 500 of 500 kills during save and 500 of 500 kills while recording on the Simulator from the freeze commit, and 50 of 50 each on the SE 3 with build 2 (never waived) | The harness report; AL-03.1 to AL-03.3 (50-run set) | open: **the 500-run harness is not built** (AL-03, last section) | S19, S10 |
| B2-12 | Item 10, R-17 passed before anyone outside the family signs in | Every row of `docs/security/REVIEW_R17_CHECKLIST.md` (#140) pass for one set of commits, its section 9 signed, and a decision entry "R-17 passed" (F21) | **OPEN: all six items open** | Founder |
| B2-13 | Account deletion works on staging end to end, and verification finds no residue (never waived; `docs/ops/README.md` step 7 makes it a gate before anyone outside the family) | AL-07.1 to AL-07.9 | open: needs #139 (apple-token), F17 | S19, S14 |
| B2-14 | The kill path in `docs/release/TESTFLIGHT.md` on [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) works as written: the switch-off build of the same commit keeps every letter; you know where "Allow new users to sign up" is on staging; build 1 stays in TestFlight as the fallback (6.1 check 4) | AL-08 parts B and C | open | Founder, S19 |
| B2-15 | Nothing sent before consent: no analytics host; letters reach staging only after Terms, the sensitive-data consent and the claim tap; the server refuses content before consent (`SCCON`, F02-REQ-010) | AL-01.12, AL-04.2, AL-04.3; the `SCCON` test in `npm run test:db` | open | S19 |
| B2-16 | Server-side access checks and the leak suite green against staging (never waived) | `npm run test:db` against staging (R-17 checklist 1.4) | open: staging does not exist | S02 |
| B2-17 | Accurate claims: no "stays only on this phone" in build 2; the backup sheet shows exactly the four D-102 claims; "What to test" as on #145 (6.1 check 6) | S16's claim list; AL-06.1 | open | S16, founder |
| B2-18 | No open S0 or S1 issue; no crash seen on build 2 in the two-phone smoke (6.1 check 3) | Issue list with labels | open | Coordinator |
| B2-19 | Staging run as production, as `docs/ops/ENVIRONMENTS.md` on [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) sets it: only the founder has dashboard access, spend cap on, backups present, statement logging off, no fixture resets (6.1 check 5) | Founder's check, screenshot kept outside the repo | open | Founder |
| B2-20 | Friends told it is an early test, that letters sync to a test server, and never to paste a child's name or a letter's words into feedback (6.1 check 7) | The invitation text | open | Founder |
| B2-21 | No synthetic speech recorded into a letter (F04-REQ-040, never waived): VO-REC once on the SE 3 before any tester who uses VoiceOver gets the build (07 section 2.11 V1c) | VO-REC row | open (needs a phone; ask whether any alpha tester uses VoiceOver) | S19 |
| B2-22 | G2's "green nightly in the last 24 h": `nightly.yml` exists on `develop`, but the default branch is `main`, which has no `nightly.yml`, and GitHub runs scheduled workflows only from the default branch, so **no nightly runs today** | A green scheduled run within 24 h of the build | open: request to S20 (and the release automation plan) | S20 |

## 4. The decision rule on Thu 29 Oct

From `docs/release/ALPHA_PLAN.md` section 6.2, unchanged:
- **All pass:** go. Friends get build 2.
- **R-17 (B2-12) or the legal pages (B2-9) fail:** friends get build 1 (servers off); the family keeps build 2. No exception (D-100).
- **Any other row fails:** the family keeps build 2; friends get build 1 or wait, as the founder chooses; the coordinator gives the failed row a new date.
- **Counsel has not commented:** friends stay on build 1 until counsel comments, or the founder decides in writing to go with holding pages (a decision entry).

QA adds one rule: a never-waived row (B1-3, B1-7, B1-8, B2-11, B2-13, B2-15, B2-16, B2-21, and the 18+ gate in AL-01) is never moved by a founder exception (07 section 5.3). If one fails, the build that failed it does not go to anyone new.

## 5. What needs the founder or a physical device

- **Every drill row (AL-01 to AL-09)** needs a real iPhone and a TestFlight build; nothing has run on a phone. The SE 3 is Phone A throughout. AL-05 needs a family member's iPhone on a second Apple Account. AL-06 needs both of the founder's phones on one Apple Account.
- **Founder-only steps the drills wait on:** F01 Apple enrolment and F02 Expo (both builds); F04, F10, F11, F16, F17 staging, Auth, Apple key, migrations and function secrets (AL-04, AL-05, AL-07); F14 Paid Apps, products and sandbox testers (AL-09); F15 website links and AASA (AL-04, AL-05); F18 and F20 escrow project and drill key (AL-06); F21 R-17 sign-off; F22 legal pages; the staging-only SQL in AL-07.7; the App Privacy Report reads and App Store Connect emails (B1-10).
- **The 500-run kill gate (B2-11)** needs a Mac with Xcode and an e2e simulator build (TESTID_REQUESTS.md request B-1), or a GitHub macOS runner (alpha plan risk 9), and S19's harness, which is not built.
- **The Maestro flows** run only on a Mac simulator, and every flow stops at its first selector until the screens set their testIDs (`node apps/mobile/e2e/bin/lint-flows.mjs --app` on 15 Oct: 125 of the 134 ids the flows use are not found in `apps/mobile/src`, and one of the 9 it finds, `player.original`, is only a settings key name, not a testID; the requests by screen owner are in the pull request body and `apps/mobile/e2e/TESTID_REQUESTS.md`).

## 6. Evidence index (S19 fills this as files land)

| Row | Evidence file | Result | Date |
|---|---|---|---|
| B1-4 to B1-8 | `docs/qa/evidence/2026-10-20-<build 1>-se3.md` | | |
| B2-3, B2-5, B2-14, B2-13 (first half) | `docs/qa/evidence/2026-10-23-<R1>-se3.md` | | |
| B2-6 | `docs/qa/evidence/2026-10-27-<R2>-se3.md` | | |
| B2-2, B2-4, B2-7, B2-8, B2-11 (SE 3 part) | `docs/qa/evidence/2026-10-28-<build 2>-se3.md` | | |
| B2-11 (Simulator part) | the harness report (path set when the harness lands) | | |
| B2-12 | `docs/security/REVIEW_R17_CHECKLIST.md` signed; the decision entry | | |

## 7. Checks a pipeline can call

All run from the repo root with Node 22 after `npm install`, and print a one-line result. The release automation plan (`docs/release/AUTOMATION.md`, being drafted on branch `docs/release-automation-plan`) decides which job runs which; S19's recommendation is in the pull request that added this file.

| Check | Command | Runs where | Fails on |
|---|---|---|---|
| Trace, report | `node scripts/trace.mjs --no-write` | In `npm test` today (never fails) | nothing (report only) |
| Trace, gate | `node scripts/trace.mjs --check --no-write` (add `--json` for a machine-readable line) | Any Linux job | a requirement ID defined in two specs, or a cited ID defined nowhere. Whether it blocks merges is the founder's call (07 Q8) |
| Trace document | `node scripts/trace.mjs` (writes `docs/TRACE.md`) | By hand after a PRD change | nothing |
| Maestro flow lint | `node apps/mobile/e2e/bin/lint-flows.mjs` | In `npm test` through `apps/mobile/test/qa-e2e-flows.test.ts` | bad YAML, a missing subflow, an id not requested, a P0 nightly flow without its tag |
| P0 nightly | `apps/mobile/e2e/bin/run-p0-nightly.sh --udid-a <id> --udid-b <id> --app <App.app> --junit` | macOS with two simulators and the e2e backend | a failed flow (exit 1); exit 3 when a P0 flow was skipped |
| Export inspector | `apps/mobile/e2e/bin/inspect-export.sh [--originals]` | Called by the suite after E2E-10, E2E-17a, E2E-17b | a broken ZIP, a changed original, a listening copy in the ZIP |
