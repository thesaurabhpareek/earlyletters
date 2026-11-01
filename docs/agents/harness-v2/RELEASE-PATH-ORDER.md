# Release path order: a draft section for `docs/BACKLOG.md` (HV2-B14)

Owner: product. Written Sun 1 Nov 2026 against `origin/develop` at b79982d0. Satisfies HV2-021 (release-path section first, a Done-when line on every release-path task). Retro refs: PRD-5, PRD-6. The coordinator moves this section to the top of `docs/BACKLOG.md`; this PR does not edit `docs/BACKLOG.md`.

## How to read this

- The release path is the chain that decides the date: build 1 on TestFlight, the device sitting on build 1, the freeze, build 2, the go/no-go. Everything else in the backlog waits behind it. Order below is the order to do things, not the order of ids.
- Dates: freeze Tue 3 Nov 5:00 AM PT (13:00 UTC; the hour is the coordinator's), go/no-go Mon 9 Nov, both D-130 (`docs/release/TESTFLIGHT.md:5`, `docs/release/FOUNDER_QUEUE.md:20`). After the freeze only S0 and S1 fixes land (`docs/BACKLOG.md:538`).
- Status is what a document says, not what anyone checked. As of this draft no session has verified that build 1 exists on TestFlight. `docs/release/TESTFLIGHT.md:225` says no build had been made on 30 Oct; nothing newer in the repo contradicts it, and `docs/qa/ALPHA_GO_NO_GO.md:22` still says "no build made yet". Every status below is `U` (unverified) unless it cites a merged PR.
- Ids: rows are `RP-##` (release path). Where an existing task or founder item already holds the work, the row cites it and does not copy it (`BL-###`, `FQ` = row of `docs/release/FOUNDER_QUEUE.md` section 0, `Q2-##` = its section 2, `B1-##`/`B2-##` = `docs/qa/ALPHA_GO_NO_GO.md`). No new `BL-` id is taken; the coordinator assigns them with `node scripts/agents/next-id.mjs` when this moves. Owner `founder` means a step only the founder can take.
- Mode `human` = founder account, device, vendor or secret. `agent` = none of those.

## A. Before build 1 (the founder gates, smallest wait first)

### RP-01 Cloudflare zone for `earlyletters.app`, DNSSEC checked first
- Status: U (open per `FOUNDER_QUEUE.md` FQ-1, by Fri 30 Oct, passed). Mode: human. Owner: founder. Milestone: release path. Size: S (10 min hands-on, 24 to 48 h wait if DNSSEC is on).
- Satisfies: BL-337, D-097; TESTFLIGHT step 4 item 1; `docs/ops/PACKS_HOSTING.md`.
- Scope: the only multi-day wait on the path. Check Porkbun DNSSEC; if on, turn it off, remove the DS record, wait; then add the zone and switch nameservers. Does not block build 1 (`TESTFLIGHT.md:249 and 253`), blocks words from speech.
- Done when: the Cloudflare zone shows Active and `dig +short DS earlyletters.app` prints nothing; the founder says so in the Project doc; `node scripts/founder/check.mjs` agrees if it checks it.

### RP-02 Expo account and `eas init`, then the project-id PR
- Status: U (FQ-2, planned Sat 31 Oct). Mode: human, then agent for the PR. Owner: founder, then platform. Size: S.
- Satisfies: BL-108, BL-339, FT-17; TESTFLIGHT step 3.1.
- Scope: founder hands over the project id and the Expo account name (neither is a secret); platform adds `extra.eas.projectId` and `owner` in `apps/mobile/app.config.ts` in a small PR.
- Done when: the PR is merged to `develop` and the preflight (`npm run preflight:testflight -w @scribe/mobile`) no longer prints MISSING for `extra.eas.projectId`.

### RP-03 App Store Connect record for `com.earlyletters.scribe.preview`, internal testers, Apple ID PR
- Status: U (FQ-3, planned Sat 31 Oct). Mode: human, then agent for the PR. Owner: founder, then platform. Size: M (45 min plus about 5 per tester).
- Satisfies: BL-103, FT-08; TESTFLIGHT step 2 items 1 to 4.
- Scope: register the identifier, create the app record, add testers, hand over the numeric Apple ID; platform puts it in `eas.json` as `ascAppId`. The Team ID stays out of the repo.
- Done when: the record exists in App Store Connect (founder confirms), and `eas.json` carries `ios.ascAppId` on `develop` so the preflight CHECK line for it clears.

### RP-04 Pack signing keys and the one keys PR
- Status: U (FQ-5a, planned Sat 31 to Sun 1 Nov). Mode: human, then agent for the PR. Owner: founder, then speech engineer. Size: M (about 60 min).
- Satisfies: BL-335, FT-16; TESTFLIGHT step 4 items 3 and 4; `docs/ops/PACKS_HOSTING.md:11-12`.
- Scope: `keygen` twice (secrets stay in the password manager), `publish release`, one PR with the two public key lines in `packages/api/src/keys.ts` and the published versions. Must merge before build 1 and before the freeze commit so both builds carry it.
- Done when: the PR is merged and the preflight reports 0 FAIL for `TRUSTED_SIGNING_KEYS` and `PACK_MANIFEST`.

### RP-05 R2 bucket, custom domain, `upload` and `verify`
- Status: U (FQ-5b; waits on RP-01). Mode: human. Owner: founder. Size: M (about 80 min).
- Satisfies: BL-337; Q2 words-from-speech path; B2-8.
- Scope: bucket `early-letters-packs` at `packs.earlyletters.app`, then `upload` and `verify`. May follow build 1; must precede the device sitting that checks words arriving.
- Done when: `verify` passes against the live host and a phone without the model downloads it over the fetch path (device evidence belongs to RP-09).

### RP-06 GitHub branch protection and rulesets
- Status: U (FQ-7, planned Mon 2 Nov; `FOUNDER_QUEUE.md:6` read none on 28 Oct). Mode: human. Owner: founder. Size: S.
- Satisfies: BL-005, BL-122, FT-20; CR-2 (B2-22 needs the default branch by the day build 2 is cut).
- Scope: `bash scripts/release/apply-branch-settings.sh`, then `--apply`, then `--verify`.
- Done when: `--verify` exits 0 and `node scripts/founder/check.mjs` shows protection on `develop` and `main`.

## B. Build 1

### RP-07 Build 1: build and submit from the founder's computer
- Status: U (FQ-6, planned Sun 1 to Mon 2 Nov, after RP-02, RP-03, RP-04 are merged). Mode: human. Owner: founder. Size: M (30 min plus 10 for `eas credentials` the first time, plus EAS and Apple waits).
- Satisfies: B1-1, B1-2, B1-3; TESTFLIGHT step 5; D-106.
- Scope: create the "Family" internal group with automatic distribution off; `git switch develop && git pull`, `npm ci`, `npx tsx scripts/release/doctor.ts`, preflight (expect 0 FAIL), `eas build --profile testflight`, `eas submit --profile testflight --latest`; add the build to "Family".
- Done when: App Store Connect lists build 1 as Ready to Test in "Family"; the EAS build page shows the `develop` commit and the `testflight` profile (B1-1); the preflight output with 0 FAIL is saved outside the repo or pasted as a count; the founder posts the build number in the Project doc.

### RP-08 Apple's processing email read for ITMS-91053
- Status: U. Mode: human. Owner: founder. Size: XS.
- Satisfies: B1-10, BL-349 (build 1 part).
- Scope: read the email Apple sends after the upload; no privacy-manifest warning means the declared reasons hold. If it names `ExpoFileSystem.framework`, file a task.
- Done when: the founder reports "no warning" or pastes the warning text; either is recorded in `docs/qa/ALPHA_GO_NO_GO.md` B1-10.

## C. The device sitting (build 1 on the SE 3)

### RP-09 Device sitting: build 1 on an iPhone SE 3
- Status: U (all of B1-4 to B1-8 read "open (needs a phone)" at `ALPHA_GO_NO_GO.md:25-29`). Mode: human. Owner: founder with qa engineer. Size: M (a sitting; `RELEASE_TEST_PLAN.md` and `DEVICE_TEST_PLAN.md` give the rows).
- Satisfies: B1-4 to B1-8, AL-01, AL-02 (except AL-02.11), AL-03 subset, BL-030, BL-043, BL-044, BL-135 (10-run subset only).
- Scope: no server path (B1-4); first run and permissions (B1-5); record, words, edits put back, typed text exact, offline with no requests (B1-6); kill during save and while recording, 10-run hand subset (B1-7); export complete offline (B1-8). Evidence in `docs/qa/evidence/<date>-<build 1>-se3.md`.
- Done when: that evidence file is on `develop` with a tally for each of B1-4 to B1-8; zero lost and zero doubled letters in B1-7 and B1-8 passes (both never waived); every failure is a filed task with a severity.

### RP-10 Testers told it is an early test; "What to test" matches build 1
- Status: U. Mode: human. Owner: founder, content. Size: XS.
- Satisfies: B1-9, B1-11; `packages/content/src/release/testflight.en.ts` `whatToTest.build1`; T4 in `FOUNDER_QUEUE.md` section 0a.
- Scope: the TestFlight text says early test, no child names or letter words in feedback or screenshots, and (T4) that the store app is separate so export first.
- Done when: the text in App Store Connect equals the `build1` string in the content package (founder pastes it; `npm test -w @scribe/content` passes on the string).

### RP-11 Borrowed devices for the small-screen rows
- Status: U (T2, by Fri 6 Nov, 15 min plus the sessions). Mode: human. Owner: founder. Size: S.
- Satisfies: RT-WRD-03, RT-LCH-09, the 414 pt and notch rows in `docs/qa/RELEASE_TEST_PLAN.md` section 3.
- Scope: borrow an iPhone XR, a 12 or 13 mini and an iPhone 11, or name who runs them.
- Done when: each device has one recorded session, or the founder names the owner and date for each; any not run is listed as a known gap for the go/no-go.

## D. Before the freeze (Mon 2 Nov to Tue 3 Nov 5:00 AM PT)

### RP-12 Build 2 setup: staging, auth, Apple sign-in, EAS variables, purge worker
- Status: U (FQ-8, Q2-01 to Q2-07; "row 8 moves to Tue 3 and Wed 4 Nov" if Monday overflows, `FOUNDER_QUEUE.md:35`). Mode: human. Owner: founder. Size: L (about 6 h, 7 with the drill).
- Satisfies: B2-1, B2-3, B2-13, B2-16; BL-015, BL-107, BL-053; TESTFLIGHT steps 6 to 9 and 12.
- Scope: steps 6, then 12, then 7, 8, 9 in that order. Includes the sole-parent drill by Mon 2 Nov noon PT (D-129) that decides whether `EXPO_PUBLIC_ACCOUNT_DELETION` is `on` in the `preview` env.
- Done when: `eas env:list --environment preview` shows the build 2 variables; each staging function health path answers 200; `node scripts/founder/check.mjs` shows `migrations-applied` complete; the drill result is recorded and the Delete account switch is set on or off explicitly, with the founder naming which.

### RP-13 Freeze commit chosen and the freeze announced
- Status: U. Mode: agent (coordinator and merge by founder). Owner: platform. Size: XS.
- Satisfies: D-130; B2-1; `docs/BACKLOG.md:538`.
- Scope: pick the `develop` commit at Tue 3 Nov 13:00 UTC; confirm RP-04 is in it; confirm CI is green on it; tasks marked "1.0" in M13 (BL-530, BL-532, BL-535, BL-549) are merged or moved to 1.0.1 by then (BL-530 and BL-532 are done: #483, #484).
- Done when: the commit sha is written in `docs/release/1.0.0.md` (BL-438) and in the Project doc; `npm test`, `npm run typecheck` and `npm run test:db` are green on that sha (B1-3 for build 2).

## E. Build 2 and the week of testing (Tue 3 to Sun 8 Nov)

### RP-14 Build 2 from the freeze commit
- Status: U (FQ-9, Q2-10). Mode: human. Owner: founder. Size: S (20 min).
- Satisfies: B2-1, B2-17; TESTFLIGHT step 11; D-106.
- Scope: `preflight:alpha`, build with the `preview` profile, submit, add to "Family" only (not "Friends").
- Done when: App Store Connect lists build 2 as Ready to Test in "Family"; its build page shows the freeze sha from RP-13; the `build2` What to test string equals `testflightCopy.whatToTest.build2` (B2-17).

### RP-15 Build 2 on two iPhones: sync, sign-in, invite, deletion, words
- Status: U (B2-2 to B2-5, B2-8, B2-13 read open). Mode: human. Owner: founder with qa engineer. Size: L.
- Satisfies: B2-2 to B2-5, B2-8, B2-11 (SE 3 part), B2-13, B2-21; AL-04, AL-05, AL-07; Q2-11.
- Scope: the rows named, on the SE 3 and a current phone. Evidence under `docs/qa/evidence/`.
- Done when: each named row has an evidence file on `develop` with pass or fail; failures are filed with severity; S0 and S1 are the only fixes allowed after the freeze.

### RP-16 No-data-loss run: 500 random kills and 50 at each crash point
- Status: U (B2-11 open). Mode: agent plus founder device if the Simulator cannot do it. Owner: qa engineer. Size: M.
- Satisfies: B2-11, BL-135, DL-01, DL-02 (never waived).
- Scope: Simulator from the freeze commit; the two harness reports.
- Done when: `docs/qa/evidence/<date>-<build>-sim-kill.md` shows 500 of 500 and 50 of 50 at each of four points, with both `report.md` files linked.

### RP-17 R-17 sign-off
- Status: U (Q2-14). Mode: human. Owner: founder. Size: S (30 min).
- Satisfies: B2-12, D-100; `docs/security/REVIEW_R17_CHECKLIST.md`; F21.
- Scope: read the checklist and the staging `test:db` evidence for one set of commits; sign section 9.
- Done when: a D-id "R-17 passed" exists in `docs/DECISIONS.md` and the checklist section 9 is signed. No friend signs in before this.

### RP-18 Rehearsals 2 to 7 (kill paths and restore)
- Status: U (B2-23 to B2-28 open). Mode: human. Owner: founder. Size: L.
- Satisfies: B2-14, B2-23 to B2-28; AUTOMATION 2.10.
- Scope: staging stop, pack switch, restore drill, TestFlight expiry, function redeploy, promotion undo. Founder only (secrets).
- Done when: each has `docs/qa/evidence/<date>-rehearsal-<name>.md` on `develop` with the measured result; any not run by Fri 6 Nov is listed for the go/no-go as "not done" with the reason.

## F. Go/no-go (Mon 9 Nov)

### RP-19 Go/no-go evidence pack
- Status: U. Mode: agent. Owner: qa engineer. Size: S.
- Satisfies: `docs/qa/ALPHA_GO_NO_GO.md` section 3 (decision rule), B1-12, B2-18, B2-22.
- Scope: by Sun 8 Nov, fill the evidence index (section 4 of that file) with a link or "not done" for every row; list open S0 and S1; list T1 to T6 decisions still open.
- Done when: every B1 and B2 row reads pass, waived with an id, or not done with a reason; the pack is on `develop`; no row is left saying only "open".

### RP-20 Go/no-go decision
- Status: U. Mode: human. Owner: founder, with the coordinator. Size: S (30 min; T1 20 min).
- Satisfies: D-130; T1 and T6 in `FOUNDER_QUEUE.md` section 0a; Q2-16.
- Scope: decide which P0 gaps gate the 1 Dec submission (T1), rule on RT-SUB-13 (T6), then go or no-go; if go, build 2 to "Friends" (Q2-15).
- Done when: a D-id in `docs/DECISIONS.md` records go or no-go and the T1 gate list; if go, the Beta App Review submission for "Friends" is made.

## G. After go (not on the critical path until RP-20 is a go)

Order after RP-20, each waiting on it: BL-556, BL-557, BL-551, BL-554 (post-go cleanups, `docs/BACKLOG.md:2506-2515`); BL-548 (blocked on BL-547, `docs/BACKLOG.md:635`); the StoreKit sandbox D-1 to D-12 on a `production` profile build (BL-222, Q2-11); T3 one real purchase and one offer code; BL-445 typed invite codes before the App Store release. Each keeps the Done-when line it already carries.

## Founder decisions this section needs

1. Confirm the RP-12 split: Monday for steps 6 and 12 and the drill, Tuesday and Wednesday for steps 7 to 9, so the freeze does not wait on all of it (`FOUNDER_QUEUE.md:35`).
2. T2 (borrow three iPhones) and T1 (which P0 gaps gate submission) are still open for you.

## Not done and conflicts of interest

- I did not read the Project docs listed in the session context; this draft rests on the repo files cited. I did not run `node scripts/founder/check.mjs` (needs a signed-in `gh` as the owner), so no founder item here is verified.
- I am the product agent and own the backlog this feeds; I gain scope from process items. Ranking build 1 proof ahead of my own items is deliberate.
