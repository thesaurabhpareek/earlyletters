# Alpha go/no-go: build 1 (servers off) and build 2 (servers on)

Owner: S19 (QA). For the founder and the coordinator at each build and at the go/no-go (founder step F27; D-106). This file is the QA side of the decision in `docs/release/ALPHA_PLAN.md` section 6 (PR #152): each row names its evidence, and S19 keeps the evidence index in section 4. Every drill runs under the drill identity rule in `docs/qa/run-sheets/README.md`.

**Status checked against origin on Fri 16 Oct 2026** (`develop` d1b23ce; pull request states from the GitHub API). Status words: **pass** (evidence linked), **open** (not merged or not run), **fail**, **n/a** (with the reason). Rows B2-11, B2-14 and B2-22 to B2-26 were updated later the same day against `develop` 5a1f5c4, for RA-19-04 and RA-19-05 (`docs/release/AUTOMATION.md` section 5), and B2-11 and B2-23 to B2-28 again against `develop` a81af00 after review.

Linked, not restated: the R-17 rows and evidence in `docs/security/REVIEW_R17_CHECKLIST.md` on S02's [#140](https://github.com/thesaurabhpareek/earlyletters/pull/140) ([on its branch](https://github.com/thesaurabhpareek/earlyletters/blob/feat/db-v1-gate/docs/security/REVIEW_R17_CHECKLIST.md)), with S01's auth items on [#139](https://github.com/thesaurabhpareek/earlyletters/pull/139); the alpha profiles, preflight, flip, kill path and environments on S20's [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145); `/auth/confirm` and the AASA file on S20's [#144](https://github.com/thesaurabhpareek/earlyletters/pull/144); dates, founder steps and the decision rule in the alpha plan.

## 0. The short answer

- **Build 1 (servers off)** can go to Family and Friends once section 1 passes on a real phone. The R-17 gate does not apply to it: it has no sign-in, no sync and no Supabase client. Nothing has run on a phone yet, because no build exists (founder steps F01 and F02 are not done).
- **Build 2 (servers on)** is **no-go**. All six R-17 items are open and none is merged to `develop` (row B2-12). Staging does not exist, #145 and #144 are not merged, and none of the build 2 drills has run. Under D-100 nobody outside the founding family signs in until R-17 passes.

## 1. Build 1 checklist (servers off)

Build 1 is the `testflight` profile on #145: `EXPO_PUBLIC_SERVER_FEATURES=off`, backup, status report and analytics off, bundle id `com.earlyletters.scribe.preview`. Founder step F12.

| # | Check | Evidence | Status | Signs |
|---|---|---|---|---|
| B1-1 | Built from a known `develop` commit with the `testflight` profile; every server, backup, status-report and analytics flag off | EAS build page (commit, profile); the profile as #145 defines it | open: #145 not merged; F01, F02 not done | S20 |
| B1-2 | The TestFlight preflight clean except founder items | Its output (`apps/mobile/scripts/preflight-testflight.mjs` on #145) | open | S20 |
| B1-3 | `npm test`, `npm run typecheck` and `npm run test:db` green on that commit, including the English R-01 and verifier suites (zero accepted meaning changes, never waived) | CI run on the commit | open | Coordinator |
| B1-4 | No server path in the build | AL-08 part A | open (needs a phone) | S19 |
| B1-5 | First run and permissions: the 18+ gate first, nothing preselected, no OS prompt before Speak, the download asks first | AL-01 on SE 3 | open (needs a phone) | S19 |
| B1-6 | Record, words, edits put back, typed text exact, offline with no requests | AL-02 (except AL-02.11) | open (needs a phone) | S19 |
| B1-7 | Kill during save and while recording, 10-run hand subset: 0 lost, 0 doubled (never waived; the 500 and 50 runs gate build 2) | AL-03 subset tallies | open (needs a phone) | S19 |
| B1-8 | Export complete and free, offline (never waived) | AL-03.4; AL-02.9 | open (needs a phone) | S19 |
| B1-9 | Nothing in build 1 says more than it does: no sign-in, sync or sharing promised; the "early version" note in About; "What to test" as on #145 | S16's claim list for build 1 | open | S16, founder |
| B1-10 | Apple's processing email after upload has no privacy-manifest warning (ITMS-91053), so the declared reasons hold (BL-349, build 1 part) | The email, read by the founder (not committed) | open | Founder |
| B1-11 | Testers are told it is an early test and never to put a child's name or a letter's words into TestFlight feedback or screenshots (07 section 4.2) | The invitation text | open | Founder |
| B1-12 | Record only, not an alpha gate: download size from App Store Connect (TF-01; the 40 MB gate is G3) | TF-01 row | open | S20 |

Build 1 goes to Family and Friends when B1-1 to B1-9 and B1-11 pass. B1-10 and B1-12 are recorded the day Apple's numbers arrive.

## 2. Build 2 checklist (servers on, staging)

Build 2 is the `preview` profile on #145, from the freeze commit, servers on against staging, backup on only if AL-06 passes (founder step F24). The rows are the alpha plan's ten items (section 1.1) and go/no-go checks (section 6.1). B2-14 and B2-23 to B2-26 are the five rollback rehearsals RA-19-05 assigns, and B2-27 and B2-28 the other two that `docs/release/AUTOMATION.md` section 2.10 dates (Edge Functions, mistaken promotion); all run from `docs/qa/run-sheets/AL-08-server-kill-switch.md` and `AL-10-rehearsals.md`. The founder's time [E] is in each row: B2-23 to B2-26 (AL-10 parts A to D) about 3 h, B2-27 and B2-28 (parts E and F) 35 min more, so about 3 h 40 min for AL-10, plus about 50 min for B2-14 (AL-08 parts B and C), on top of the alpha plan's hours.

| # | Check | Evidence | Status | Signs |
|---|---|---|---|---|
| B2-1 | Built from the freeze commit with the `preview` profile; its preflight clean, including #145's invite-link fragment check (a FAIL until `fix/invite-link-fragment` lands); installed from TestFlight on two iPhones; the build friends will get (6.1 check 1) | EAS build page; TestFlight build number; preflight output | open | S20 |
| B2-2 | B1-2, B1-3, B1-5, B1-6 and B1-8 also pass on build 2 | AL-01, AL-02 (with AL-02.11) on build 2 | open | S19 |
| B2-3 | Item 1, sign-in: Apple and email by link and by code; letters join an account only after the claim screen (BL-347) | AL-04 | open: needs #139, staging (F04, F10, F11, F16, F17), and #144 live on `main` (F15) | S19, S01 |
| B2-4 | Item 2, two-phone sync: letters, edits, deletes and restores reach the other phone; offline letters queue and sync once | AL-05.8 to AL-05.13; `apps/mobile/test/sync-two-phone.test.ts` green (#146) | open: needs #146 and the S02 sync server (WP-F16-14) | S19, S03 |
| B2-5 | Item 3, invite and join with the two-parent cap: asks first, nothing preselected, a third parent refused on create and on accept, leave works | AL-05.1 to AL-05.7, AL-05.15 | open: needs #140 and #148 | S19, S04 |
| B2-6 | Item 4, backup and the restore drill: zero plaintext, resume after a kill, restore with equal hashes, the recovery request and its email | AL-06 (with S05's B6 rows on #150) | open: needs #150, #151, F18, F20 | S19, S05 |
| B2-7 | Item 5, Plus in the sandbox: buy, restore, manage; only own letters with words count | AL-09 | open: needs F14, S06's Keep gate, and the AL-09 account check | S19, S06 |
| B2-8 | Item 6, words arriving: a signed manifest from `packs.earlyletters.app`; an English letter gets its words on the SE 3 and the current iPhone | AL-02.2 on both phones | open: needs F09, F13 and the keys PR | S19, S08 |
| B2-9 | Item 7, legal pages live in holding or final form, matching the policy versions on staging | `curl` of `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/delete-account` | open (F22) | S20, founder |
| B2-10 | Item 8, the experience pass for J1 to J8 in and seen on build 2 | Spec checklist at 100% for P0 lines; critics' sign-off | open | Experience critics |
| B2-11 | Item 9, no data loss (never waived). On the Simulator from the freeze commit: kill during save (DL-02), 500 of 500 random kills plus 50 of 50 held at each of four crash points inside the save (after the file write, before the row, inside the transaction, after commit); kill while recording (DL-01), 500 of 500 kills 10 to 120 s into the take, in four shards of 125. Every run: `PRAGMA integrity_check` ok, no row points at a missing file, every stored hash matches its file, nothing lost or doubled, and every earlier kept letter judged again after every relaunch; for DL-01 a kept take also plays, 49 in 50 to within 5 s (07). A relaunch that fails after a kill is a fail. On the SE 3 with build 2: 50 of 50 each | The harness reports (`apps/mobile/e2e/kill/run-kill-harness.mjs`, README section 9), one per mode, from the freeze commit, the DL-01 shards merged; AL-03 50-run set. **What clean runs rule out** (rule of three, 95% upper bound on the loss rate per kill): 500 random kills, above 0.6%; 50 at one crash point, above 5.8% at that point (four points, so four bounds); 500 DL-01 kills, above 0.6%; the SE 3's 50, above 5.8% (not pooled with the Simulator). The nightly (50 random kills a mode, DL-02 plus 5 at each point) rules out only above 5.8%, and 45% per point: it finds regressions, only the Tue 27 run gates | open: **the harness is built (#203, open)**. Until S20's wiring line in `_layout.tsx` (RA-20-18) lands, with an e2e build profile (B-9: `EXPO_PUBLIC_E2E=1` and `APP_ENV` development, never a store profile), the app never arms and every run exits 3. Then the workflow (RA-20-10a), nightly from Thu 22, the gate run Tue 27 night. Expect DL-01 and the after-file-write point to fail until S10's sweep fix lands (`fix/sweep-recordings-dir`): expo-audio writes takes to `Documents/ExpoAudio`, the sweep lists only the top of Documents, so a killed take loses its draft (DEVICE_TEST_PLAN DL-01 as #203 amends it; found by reading the code, confirmed by the coordinator) | S19, S10, S20 |
| B2-12 | Item 10, R-17 passed before anyone outside the family signs in: every row of #140's checklist passes for one set of commits, its section 9 is signed, and a decision entry "R-17 passed" exists (F21) | #140's checklist; live status on each PR. On 16 Oct: **BL-347, BL-330** on #139, open and ready for review; **BL-331 with BL-332, `peek_invite` with BL-334** on #140, open, draft (develop has only part of BL-331, and #140's checklist records a Critical on develop that only #140 fixes); **BL-322** on #148, open, written against closed #142's `peek_invite`; **BL-349**, no PR (`NSPrivacyCollectedDataTypes` is `[]` on develop and on #145, and build 2 syncs) | **OPEN: all six items open, none merged** | Founder |
| B2-13 | Account deletion works on staging end to end, and verification finds no residue (never waived; `docs/ops/README.md` step 7 makes it a gate before anyone outside the family) | AL-07 | open: needs #139 (apple-token), F17 | S19, S14 |
| B2-14 | The kill path in `docs/release/TESTFLIGHT.md` on #145 works as written: the switch-off build of the same commit keeps every letter; sign-ups can be turned off on staging; build 1 stays in TestFlight as the fallback (6.1 check 4). Founder about 50 min [E] (AL-08 parts B and C) | AL-08 parts B and C (rehearsal 1 of RA-19-05), on R1 at F19, Fri 23 | open | Founder, S19 |
| B2-15 | Nothing sent before consent: no analytics host; letters reach staging only after Terms, the sensitive-data consent and the claim tap; the server refuses content before consent (`SCCON`, F02-REQ-010) | AL-01.12, AL-04.2, AL-04.3; the `SCCON` test in `npm run test:db` | open | S19 |
| B2-16 | Server-side access checks and the leak suite green against staging (never waived) | `npm run test:db` against staging (#140's checklist 1.4) | open: staging does not exist | S02 |
| B2-17 | Accurate claims: no "stays only on this phone" in build 2; the backup sheet shows exactly the four D-102 claims; "What to test" as on #145 (6.1 check 6) | S16's claim list; AL-06.1 | open | S16, founder |
| B2-18 | No open S0 or S1 issue; no crash seen on build 2 in the two-phone smoke (6.1 check 3) | Issue list with labels | open | Coordinator |
| B2-19 | Staging run as production, as `docs/ops/ENVIRONMENTS.md` on #145 sets it (6.1 check 5); drills used only drill accounts on it | Founder's check, screenshot kept outside the repo; the drill-phone checks in the evidence files | open | Founder |
| B2-20 | Friends told it is an early test, that letters sync to a test server, and never to paste a child's name or a letter's words into feedback (6.1 check 7) | The invitation text | open | Founder |
| B2-21 | No synthetic speech recorded into a letter (F04-REQ-040, never waived): VO-REC once on the SE 3 before any tester who uses VoiceOver gets the build (07 section 2.11 V1c) | VO-REC row | open (needs a phone; ask whether any alpha tester uses VoiceOver) | S19 |
| B2-22 | G2's green nightly in the last 24 h. Scheduled workflows run only from the default branch, which is `main`; `nightly.yml` is on `develop` only, so **no nightly runs** until AF-05 (`develop` as the default branch, after RA-20-02a) by Wed 21 | A green scheduled `nightly.yml` run within 24 h of build 2 (AUTOMATION section 0.2, item 14); RA-20-19 opens a `nightly` issue on a red run | open: AF-05 (founder), RA-20-19 (S20); first scheduled run Thu 22, green by Wed 28 | S20 |
| B2-23 | Rehearsal 2, the staging stop: a Pro project cannot be paused, so sign-ups off, sessions signed out and the named publishable key revoked, with the gateway refusing it (AUTOMATION 2.10). Founder only (secret keys, the staging organization); the scratch project's Pro compute is approved by the founder first. Founder about 45 min [E] | AL-10 part A on a scratch project; `docs/qa/evidence/<date>-rehearsal-staging-stop.md` | open: before Thu 22 (2.10; AUTOMATION 0.2 item 15 says Fri 23, S20 asked to align it); not on staging while the family uses it | Founder, S19 |
| B2-24 | Rehearsal 3, the `packDownloads` kill switch on the live pack host: no new download starts, installed packs keep working; the measured delay replaces "about 5 minutes". The tap waits until the phone has contacted the pack host after the switch, on a language whose only new pack is its text rules. Founder about 40 min [E] | AL-10 part B on the SE 3; `docs/qa/evidence/<date>-rehearsal-pack-switch.md` | open: Fri 23; needs #126 and #162 merged, the signing-keys PR (BL-335, the public key in `packages/api/src/keys.ts`; not opened on 16 Oct) in the build on the SE 3, F09, F13 | Founder, S19, S07 |
| B2-25 | Rehearsal 4, the database restore drill: `scripts/ops/restore-drill.ts` with `OPS_OPERATOR` set, PASS on a throwaway copy with fictional data (DATA-REQ-030, DATA-REQ-031). Founder only (service-role keys); any `pg_dump` file deleted the same day. Founder about 90 min [E], mostly waiting | AL-10 part C; `docs/qa/evidence/<date>-rehearsal-restore.md`; the runbook drill log | open: by Wed 21; never staging while it holds letters | Founder, S07 |
| B2-26 | Rehearsal 5, TestFlight expiry: R1 expired after build 2 lands; what the installed copy does is recorded; build 1 is never expired. Founder about 10 min [E] | AL-10 part D (AL-08.11); `docs/qa/evidence/<date>-rehearsal-testflight-expiry.md` | open: Tue 27 or Wed 28 | Founder |
| B2-27 | Rehearsal 6, an Edge Function back to the previous commit: a no-op change deployed to staging and reverted, the health path 200 after each (AUTOMATION 2.10, "Edge Functions"). Founder only (agents never deploy, 2.11). Founder about 20 min [E] | AL-10 part E; `docs/qa/evidence/<date>-rehearsal-function-redeploy.md` | open: before Thu 22; needs staging and the functions deployed (AF-13, #152 F16 and F17) | Founder, S07, S20 |
| B2-28 | Rehearsal 7, a mistaken promotion undone: a throwaway build added to "Founder", then removed and expired, and no longer offered on Phone B (AUTOMATION 2.10, the R-17 undo). Founder about 15 min [E] | AL-10 part F; `docs/qa/evidence/<date>-rehearsal-promotion-undo.md` | open: Wed 21; needs a superseded build already in App Store Connect | Founder, S20 |

## 3. The decision rule

From `docs/release/ALPHA_PLAN.md` section 6.2: all pass, friends get build 2; R-17 (B2-12) or the legal pages (B2-9) fail, friends get build 1 and the family keeps build 2, with no exception (D-100); any other row fails, the founder chooses build 1 or wait for friends and the coordinator re-dates the row; counsel silent, friends stay on build 1 or the founder decides in writing to go with holding pages.

QA adds one rule: a never-waived row (B1-3, B1-7, B1-8, B2-11, B2-13, B2-15, B2-16, B2-21, and the 18+ gate in AL-01) is never moved by a founder exception (07 section 5.3). If one fails, the build that failed it does not go to anyone new.

## 4. Evidence index (S19 fills this as files land)

| Row | Evidence file | Result | Date |
|---|---|---|---|
| B1-4 to B1-8 | `docs/qa/evidence/<date>-<build 1>-se3.md` | | |
| B2-3, B2-5, B2-13 (first half), B2-14 | `docs/qa/evidence/<date>-<R1>-se3.md` | | |
| B2-6 | `docs/qa/evidence/<date>-<R2>-se3.md` | | |
| B2-2, B2-4, B2-7, B2-8, B2-11 (SE 3 part) | `docs/qa/evidence/<date>-<build 2>-se3.md` | | |
| B2-11 (Simulator part) | `docs/qa/evidence/<date>-<build>-sim-kill.md`, with the two harness reports (`report.md` for DL-02 and DL-01) | | |
| B2-12 | #140's checklist signed; the decision entry | | |
| B2-23 | `docs/qa/evidence/<date>-rehearsal-staging-stop.md` | | |
| B2-24 | `docs/qa/evidence/<date>-rehearsal-pack-switch.md` | | |
| B2-25 | `docs/qa/evidence/<date>-rehearsal-restore.md` | | |
| B2-26 | `docs/qa/evidence/<date>-rehearsal-testflight-expiry.md` | | |
| B2-27 | `docs/qa/evidence/<date>-rehearsal-function-redeploy.md` | | |
| B2-28 | `docs/qa/evidence/<date>-rehearsal-promotion-undo.md` | | |
| B2-22 | the scheduled run link | | |

What needs the founder or a phone is in `docs/qa/run-sheets/README.md`; the checks a pipeline can call are in `apps/mobile/e2e/README.md` ("The P0 nightly set") and the header of `scripts/trace.mjs`.
