# Release test plan: what we test, where, on which phones, and what is still missing

Owner: S19 (qa-e2e). Written 1 Nov 2026 against `develop` at 0f99975, with Karma (CR-37), and revised the same day after four independent reviews. This file does not replace anything. It sits on top of what we already have and says how the pieces add up to a release:

- `apps/mobile/e2e/README.md`: the Maestro simulator flows (E2E-xx).
- `docs/release/journey/INDEX.md`: the web journeys (Jxx), the app exported for web and driven in Chromium at phone size.
- `docs/qa/DEVICE_TEST_PLAN.md`: the hand-run phone items (S1, S2, TF, DL).
- `docs/qa/ALPHA_GO_NO_GO.md` and `docs/qa/run-sheets/AL-*.md`: the gates for build 1 and build 2.
- `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11: the StoreKit checks D-1 to D-12.
- `docs/qa/COVERAGE.md`: unit coverage by workspace.

New here: the device and iOS matrix, the display and accessibility matrix, the split between pre-release and production, the pipeline status, and one catalog of release cases (`docs/qa/release-test-catalog.csv`, written from `scripts/qa/release-catalog.rows.mjs`) that cites the existing cases above instead of copying them. `apps/mobile/test/qa-release-catalog.test.ts` fails if a row cites a case that does not exist.

Labels: **V** checked on 1 Nov 2026 (command or page named); **A** assumption to confirm on the first run.

## 1. What we have, counted and run on 1 Nov

| Layer | Count | Where it runs | Result on 1 Nov |
|---|---|---|---|
| Unit and integration (vitest) | 5,811 tests on 0f99975: mobile 3,471, core 1,234, api 461, content 236, analytics 129, design-tokens 92, experiments 78, emails 60, brand 50 | `ci.yml` "tests and content rules" on every PR and push | V: all pass locally (1 skipped in mobile); CI run 41262756225 green. Mobile grows with each merge, so read this as a snapshot |
| Database rules | 38 test files (`npm run test:db`) | `ci.yml` "database rules"; `nightly.yml` real Supabase stack, perf budgets, legacy grants | V: CI green; first scheduled nightly (41216366599, 31 Oct) green. Not run locally |
| Store-profile launch | The `testflight` profile Release app launches on a simulator and stays up 20 s | `ios-compile.yml` on native changes; `kill-harness.yml` | V: green (41245906829) |
| Kill harness | DL-01 (kill mid-take) and DL-02 (kill during save) on the simulator | `kill-harness.yml`: a 5-run smoke on pull requests that touch capture paths, 50 runs a mode nightly, the 500-run gate on dispatch | V: 31 Oct nightly green; the 500-run gate passed on 27 Oct (run 40596403809: DL-01 four shards of 125, DL-02 500) |
| Web journeys (Playwright) | 90 tests; the committed journey record shows 22 journeys, 203 steps (142 happy, 61 unhappy) | Nowhere. `npm run e2e:web -w @scribe/mobile` by hand | V: 89 of 90 pass (15.3 min, 2 workers). J05e (a 65 s take) fails with `Array buffer allocation failed`, alone too: #480. The run also wrote 4 steps the committed record lacks (J13-05 to 07, J22-22), so the record is behind the flows |
| Maestro flows (iOS simulator) | 20 flow files for 16 ids (E2E-01 to 15 and 17; there is no E2E-16) | Nowhere. `ios-e2e.yml.example` is not enabled | Never run. V: `lint-flows.mjs --app` finds 108 of the 136 ids the flows select missing from `apps/mobile/src`, so every flow stops at its first selector |
| Phone items by hand | 59 sections in DEVICE_TEST_PLAN (S1-01 to 35, S2, TF-01 to 11, DL-01 to 06, B1-01) | A person with a phone | Never run. `docs/qa/evidence` holds only the README and template |
| Alpha run sheets | 106 steps across AL-01 to AL-09, plus AL-10 rehearsals | A person with a phone | Never run |
| StoreKit checks | D-1 to D-12 and D-1b in the subscriptions guide; S2-01 to S2-21 in DEVICE_TEST_PLAN | TestFlight sandbox or the StoreKit file | Never run |

So: the code is well tested below the screen, the screens are tested in a browser by hand, and nothing has been proven on an iPhone. That matches the 31 Oct staged release check.

Things in the existing plans that are out of date, so nobody reads them as evidence:

- E2E-06 expects a Plus gate after 3 Read together sessions (D-082 made Read together free) and E2E-07 expects a gate on Add a child (D-083 made a second child free). Both behaviours are already proven on the web by J11-05 and J03-08. Rows RT-BK-08 to 10.
- E2E-11 and TF-04 item 6 describe a usage switch that the store build does not have (analytics are off, D-124). Row RT-PRV-05.
- TF-06 and S2-12 still describe an iOS 16.4 path. The floor is 17.0.
- Numbering drift: DEVICE_TEST_PLAN maps S2-01 to S2-21 onto an older D numbering of the subscriptions guide, which now runs D-1 to D-12 plus D-1b. The S2 map text describes each check, so the catalog cites S2 ids for the older meanings and D ids for the guide as it stands today. The renumbering request stays with S06.

## 2. The catalog

`docs/qa/release-test-catalog.csv`, 240 rows, written from `scripts/qa/release-catalog.rows.mjs`. Each row is a release case with: area, kind (happy, unhappy, error, edge, accessibility, display, performance, privacy, compliance, upgrade, ops), priority, release (B1 the first store build, B2 sign-in and sync, or both), lane (unit, web, maestro, kill, device, testflight, production), environment, device tags from section 3, the existing cases that cover it, and a status.

Status follows the row's own lane and Expected, not the best case it cites. A row in the device lane that also cites a web journey stays planned until a phone runs it.

| Status | Rows | Meaning |
|---|---|---|
| covered | 6 | An automated test or workflow runs in CI today and proves the Expected |
| automated | 14 | An automated case proves it when run (web journeys); no pipeline runs it yet |
| planned | 94 | A case is written (Maestro, phone item, run sheet, StoreKit check) but has never run |
| partial | 32 | Part of the Expected is proven or written |
| gap | 91 | No case anywhere; this plan adds it |
| stale | 2 | The written case contradicts a decision (E2E-06, E2E-07) |
| decision | 1 | Needs a decision before it can be a test (RT-A11Y-17, portrait lock against WCAG 1.3.4) |

152 rows are P0. The P0 gaps cluster in five places: payments edge cases (failures, unfinished transactions, offline renewals, refunds, crossgrades, storefronts, production products and codes); the store submission itself (size, age rating, privacy label, subscriptions with 1.0, the early-version note); error states (words failures, kills in Review and while typing, recovery lines); accessibility on a phone (focus return, Display Zoom, Voice Control); and requirements that are not built (SR-C-02, 04, 06, 07, 08, 10, 16, Declared Age Range, Quiet this book).

To add a case: add a row to `scripts/qa/release-catalog.rows.mjs`, run `node scripts/qa/release-catalog.mjs`, commit both. Never copy steps from another plan; cite its id in `covered_by`. `apps/mobile/test/qa-release-catalog.test.ts` fails if a cited id, journey step or path does not exist, if a token is free text, if a covered row cites no test or workflow file, or if a row outside the web lane is marked automated. An SR, IMP or MOB id must be listed in section 9; a CR id must be in `docs/agents/cto/RULINGS.md`; a requirement id (F##-REQ, C-NFR, LEGAL-REQ, PRD-REQ) must appear under `docs/`. A `#n` PR or issue number is checked by format only.

## 3. Phones, iOS versions and screen sizes

Facts: the deployment target is iOS 17.0 (`apps/mobile/app.config.ts:44`, V). `supportsTablet` is false and orientation is portrait (`app.config.ts`, V). iOS 27 shipped on 14 Sep 2026 and runs from the iPhone 11 up (V: MacRumors, Tom's Guide, read 1 Nov). Whether the SE (2nd gen) gets iOS 27 is A: the press lists disagree and I have not read Apple's own page. The XR runs iOS 17 and 18 only. The full-tier speech model line is 3.4e9 bytes (`lib/models/tiers.ts`), so the SE 2 and the XR, the only 3 GB phones on iOS 17 or later, take the compact model.

| Tag | Phone | Points | Memory | iOS to test | Why it is in the matrix |
|---|---|---|---|---|---|
| D1 | iPhone SE (2nd gen) | 375 x 667 | 3 GB | 18; 27 if Apple lists it (A) | Smallest screen and compact tier together; Touch ID |
| D2 | iPhone SE (3rd gen) | 375 x 667 | 4 GB | 27 | The reference for every budget (`se3`) |
| D3 | iPhone XR | 414 x 896 | 3 GB | 17 (or the lowest a held phone runs) | Oldest supported iOS, compact tier; capped at iOS 18 |
| D12 | iPhone 11 | 414 x 896 | 4 GB | 27 | Oldest phone on current iOS; the only 414 pt width on iOS 27; LCD and notch |
| D4 | iPhone 12 mini or 13 mini | 375 x 812 | 4 GB | 26 | Narrow and short with a notch |
| D5 | iPhone 12 | 390 x 844 | 4 GB | 26 or 27 | Oldest common full-tier phone (`ip12`) |
| D13 | iPhone 16e or 17e | 390 x 844 | A | 27 | The notch phone Apple still sells |
| D6 | iPhone 15 | 393 x 852 | 6 GB | 27 | Dynamic Island, 60 Hz (`ip15`) |
| D7 | iPhone 16 Pro or 17 Pro | 402 x 874 | 8 GB+ | 27 | The web journeys' viewport; 120 Hz |
| D8 | iPhone 16, 17 or 18 Pro Max | 440 x 956 | 8 GB+ | 27 | Largest screen (V: Apple's iPhone 18 Pro Max specs, 2868 x 1320 at 3x) |
| D9 | iPhone Air | 420 x 912 | A (Apple publishes none) | 27 | Its own width (V: Apple specs, 2736 x 1260 at 3x) |
| D10 | Any iPad | iPhone app in compatibility mode | any | 26 or 27 | App Review may test on iPad; also a device with no phone line |
| D11 | iPhone 18 Pro or Pro Max | A | A | 27.x latest | Newest phone on the newest iOS; built with Xcode 26 |

Point sizes are Apple's pixel specs divided by the scale; the first simulator sweep records them as measured. Shorthand in the catalog: REF is D2 plus a current phone (D6 or D7); ALL is every tag but D11; SIM is the simulator lane; WEB is the web journey lane.

Recommendation, founder decides (device hours): the founder's SE 3 and one current phone are the daily pair (DEVICE_TEST_PLAN). Borrow three more, because each hits a different limit: an XR (iOS floor and memory), a mini (narrow notch) and an iPhone 11 (414 pt on iOS 27). This is in `docs/release/FOUNDER_QUEUE.md` as a dated step.

The simulator sweep cannot run yet. What it needs:

- The testIDs (section 6.2 step 3). 14 of the 16 ids E2E-15 uses are missing.
- `e2e/bin/a11y-sizes.sh` takes only `ax5` and `default`; it needs all twelve content sizes.
- A pixel-diff script with approved baselines, and the XCUITest audit target from TDD 09 section 8.3 (layer L4). Neither exists.
- CI pins Xcode 26.6, which cannot host iOS 27 simulators. The iOS 17 runtime is a download, and an XR device type may not exist on the newer runtimes (A).

When it can run, the sweep covers three widths (SE 375 x 667, 12 mini 375 x 812, Pro Max 440 x 956), at text sizes L, AX3 and AX5, in light and dark, plus one Increase Contrast pass. Status bars are fixed with `simctl status_bar override`. What stays on a real phone: Display Zoom, Bold Text, the memory tier, and iOS 17 if its runtime is not available.

## 4. Display and accessibility settings

Every P0 screen is checked against this matrix: gate, first run, Tonight, Listen, Review, Write, Book, a letter, Read together, Keep sheet, Apple's sheet, Settings, Export. The pass numbers come from the tokens: targets of 44, 56 and 64 pt (`tokens.ts`); contrast of 4.5:1 for text and 3:1 for non-text, and 7:1 and 4.5:1 under Increase Contrast (`tokens.test.ts`).

| Setting | Values | Where | Catalog |
|---|---|---|---|
| Text size | L, AX3, AX5 in the sweep; xS to AX5 by hand on the SE 3 and a Pro Max; changed while the app is open | Simulator sweep, then phone | RT-A11Y-02, 13 |
| Appearance | Light, Dark, switched while open, in-app override | Web journeys, then phone | RT-DSP-01, 02; RT-SET-03 |
| Bold Text, Increase Contrast, Reduce Transparency, Liquid Glass Clear or Tinted (iOS 26.1), the transparency slider (iOS 27) | On, both ends | Phone. The app's tab bar is its own, not the system's floating bar, so only system sheets change | RT-A11Y-03 |
| Reduce Motion | On | Phone | RT-A11Y-04 |
| VoiceOver | V-01 to V-10; focus returns to the control that opened a sheet | Phone | RT-A11Y-01, 10 |
| Voice Control, Switch Control, Full Keyboard Access | On | Phone | RT-A11Y-05, 06 |
| Display Zoom | Larger Text view; the SE becomes 320 pt wide, the native stand-in for WCAG 1.4.10 Reflow | Phone | RT-A11Y-07 |
| Smart Invert, Grayscale and Deuteranopia filters, Differentiate Without Color | On | Phone | RT-A11Y-08 |
| Button Shapes, On/Off Labels | On | Phone | RT-A11Y-11 |
| Large Content Viewer | Long-press tabs at AX1 and above | Phone | RT-A11Y-12 |
| Keyboard in sheets | Sign-in code, Add a child at AX5 | Phone | RT-A11Y-14, RT-WRT-03 |
| Speak Screen, Assistive Access | On | Phone | RT-A11Y-15, 16 |
| Recording indicator | Dynamic Island and notch | Phone | RT-DSP-07 |
| Right-to-left and other scripts in letter text | Arabic, Chinese, Devanagari | Phone | RT-DSP-04, 06 |
| iPad and iPhone Mirroring | Compatibility mode, rotation, hardware keyboard; Mirroring on a Mac | iPad, Mac | RT-DSP-05, 08 |
| System Haptics | On, off | Phone | RT-A11Y-09 |
| Region and time | UK, India, 24-hour, time zone change, daylight saving | Phone | RT-BK-06, 07 |

Open decision (RT-A11Y-17): the app is portrait-only, and WCAG 1.3.4 Orientation fails unless portrait is essential. TDD 09 calls portrait acceptable, but LEGAL-REQ-051 claims 2.2 AA. Either the claim lists it as a known gap or the app supports landscape. That is a promise, so it is the founder's with counsel. WCAG 1.4.12 Text spacing does not apply on iOS, and Reduce Motion maps to 2.3.3, which is AAA.

## 5. Pre-release and production

| | Pre-release | Production |
|---|---|---|
| Builds | `development` (dev client), `e2e` (simulator, seams on), `testflight` (build 1, servers off), `preview` (build 2, servers on, staging) | `production`, `com.earlyletters.scribe` |
| Data | Fictional Asha family, except staging during the alpha (D-106) | Real families |
| Purchases | The StoreKit file in Xcode (development builds only; it cannot run in a TestFlight build), or the sandbox. TestFlight renews daily with the tester's own Apple Account; with a Sandbox Apple Account the sandbox rates apply | Real money (RT-PAY-14, a founder decision) |
| Offer codes | StoreKit file code, or sandbox codes (new subscribers only on the sandbox offer) | Codes made in App Store Connect, redeemable only once the app is Ready for Sale (RT-OFC-08, a founder decision) |
| Storefront | Plus is sold in the US only (LEGAL-REQ-058), so other storefronts show no plans (RT-PAY-13) | Same |
| Crash signal | TestFlight feedback and crashes (TF-07) | App Store Connect and Xcode Organizer only; analytics stay off (D-095, D-124) |
| What can only be proven here | Kill harness, seams, StoreKit edge cases (Ask to Buy, interrupted purchase, unfinished transaction, price consent) | The store binary, production offer codes, production-environment transactions, the live pack host |

Facts to plan around:

- The `.preview` TestFlight app and the App Store app have different bundle ids, so they are separate apps with separate data. A tester's letters do not move from TestFlight to the App Store app. Recommendation, founder decides the wording: tell testers to export first, and say nothing that suggests the letters carry over (RT-LCH-05).
- Products exist only on the App Store Connect record they were created on, and a product id is unique across the whole developer account, so the `.preview` record can never carry the Plus products (App Store Connect refused them on 1 Nov). Sandbox purchases need a TestFlight build of the production profile, which D-124 item 1 holds until after the 9 Nov go/no-go. Until then the rows marked testflight or sandbox are blocked (RT-PAY-21). They cannot quietly switch to the StoreKit file, because that file does not run in a TestFlight build.
- The most useful pre-release check: a TestFlight build of `com.earlyletters.scribe` buys the production record's products in the sandbox. That proves product ids, trials, grace, Family Sharing and sandbox codes before submission, and it is how App Review buys too (RT-PAY-21). The first subscriptions go in with the 1.0 binary (RT-REL-11).
- App Review may use an iPad, and the app is iPhone-only, so it would run in compatibility mode (A). App Review's IPv6 network is the reason for RT-NET-01. Both run on the release candidate.
- Phased release is not available for 1.0.0 (`docs/ops/RELEASE.md` 7.1). 1.0.0 is released by hand, with a 48 hour watch (RT-REL-06). Phased release starts with 1.0.1.

## 6. Pipelines

### 6.1 What runs today

| Workflow | Proves | Status on 1 Nov (V: GitHub Actions API) |
|---|---|---|
| `ci.yml` | Unit, content rules, database rules, typecheck, no e2e seam in store bundles (B-8) | Green on every recent push |
| `ios-compile.yml` | Native build; the store-profile Release app launches on a simulator | Green |
| `kill-harness.yml` | Builds the e2e simulator app with `xcodebuild` (no EAS). Runs DL-01 and DL-02: a smoke on capture-path PRs, 50 runs nightly, the 500-run gate on dispatch | Green; nightly 31 Oct; gate 27 Oct (40596403809) |
| `nightly.yml` | Fuzz with a random seed, real Supabase stack, performance budgets, legacy grants; opens or closes a `nightly` issue | First scheduled run 31 Oct green |
| `release-ios.yml` | Store-lane iOS build from release tags (production `eas build`, seam guard on the production profile), from #474 | Never run: no release tag yet. Its first run is the release candidate (RT-REL rows) |
| `testflight.yml` | Build and upload to TestFlight | Never run: 3 runs, all skipped. Needs the founder's Expo token and the `testflight` environment (TESTFLIGHT.md step 3) |

### 6.2 What does not run, and the order to switch it on

Karma's ruling (CR-37) sets the order below. Each step is its own PR with two reviews, because each touches `.github/**`. None merges before the 9 Nov go/no-go unless it closes a store-path item (SR-B-08). Steps 1 and 2 do, so they may land before the 3 Nov freeze; steps 3 to 6 wait:

1. **Web journeys in CI.** Linux, no secrets; 15 minutes on two workers here. Fix or quarantine J05e first (#480), with an owner and a date, so the job starts green. It turns the automated rows into covered rows and catches screen regressions on every PR. Run it on PRs that touch `apps/mobile/src/**`, and nightly.
2. **Rewrite E2E-06 and E2E-07** to D-082 and D-083, so no stale flow can be read as evidence.
3. **testIDs.** The 108 missing ids in `TESTID_REQUESTS.md` belong to the mobile owner. Nothing in Maestro can run until they land, and enabling the workflow before that only produces a red job.
4. **Maestro on the simulator.** The e2e app already builds in `kill-harness.yml`, so the e2e README's blocker ("an `e2e` EAS build profile") is solved in practice: the Maestro job reuses that app artifact. Start with the offline P0 flows (E2E-01, 03, 04, 08, 10, 17) nightly on `macos-26`. Then the section 3 sweep, once its prerequisites exist.
5. **preview profile launch check** (RT-LCH-03, IMP-53), next to the existing store-profile launch.
6. **testflight.yml first run**, once the founder has done the Expo and App Store Connect steps.

Some things stay manual on purpose: everything on a real phone, and every purchase in the sandbox or production. Maestro 2.11.0 does not drive physical iPhones (V in the e2e README), and StoreKit Testing needs Xcode.

## 7. Order of work

Freeze is Tue 3 Nov and go/no-go is Mon 9 Nov (D-130). Submission is Tue 1 Dec (D-121).

Before the go/no-go, on build 1. This needs a phone and a person (SR-B-06):

- TF-04 smoke on D2 and a current phone (as written, item 6 does not apply to build 1).
- AL-01, AL-02, AL-03 and AL-08 part A.
- DL-06, the S1-23 VoiceOver walk and the S1-24 display settings.
- The device-lane purchase rows, which the StoreKit file runs in a development build: RT-PLS-07 to 09, RT-PAY-06, 17, RT-OFC-07.
- A rehearsal of the sandbox-lane rows with the StoreKit file in a development build: RT-PLS-01, 03, 05, 06, RT-PAY-01, 04, RT-SUB-01, 03, 05, 06, RT-OFC-01, 02. A rehearsal finds bugs early but does not change their status: they count only once a production-profile TestFlight build runs them in the sandbox, after 9 Nov (D-124 item 1, RT-PAY-21).

Evidence files go in `docs/qa/evidence`, as the template says.

Before submission. Recommendation, founder decides which gaps gate submission:

- Karma would gate on every B1 P0 row that protects a promise or a store duty: the RT-REL, RT-PRV, RT-AGE and RT-PAY-21 rows, plus RT-WRD-03, RT-LCH-09, RT-DSP-05 and RT-NET-01.
- The rest of the P0 gaps would ship as known issues with owners.

That changes what is in the release and can move the date, so it is in `docs/release/FOUNDER_QUEUE.md` as a decision.

Day 0 to 7: the production rows, after the founder agrees to the real-money and offer-code steps.

Build 2: the B2 rows, after the build 2 gates in ALPHA_GO_NO_GO.

## 8. What this plan cannot tell you

- Point sizes and memory in section 3 are from Apple's pixel specs and press reports, not measured.
- The catalog says a case exists. Only a CI run or an evidence file says it passed.
- I ran the unit tests and the web journeys on Linux. I did not run `npm run test:db`, any Mac job, or anything on a phone.
- iOS 27 support details came from press coverage, not Apple's own page.
- Four independent reviews (QA, payments, red team, design systems) were folded in on 1 Nov. Their findings that were founder decisions are listed in FOUNDER_QUEUE, not settled here.

## 9. Ids that come from outside the repo

Some rows cite ids from review documents that live in the founder's Project, not the repo. They are listed here so the catalog test can check each one, and so a reader can see what each means. An id not in this table fails the test.

| Id | Source | What it asks for |
|---|---|---|
| SR-B-01 | Staged release requirements, 31 Oct | Every public claim is true of the build |
| SR-B-02 | Staged release requirements, 31 Oct | A privacy policy and terms that cover the app |
| SR-B-03 | Staged release requirements, 31 Oct | The privacy label is right |
| SR-B-04 | Staged release requirements, 31 Oct | The age-range signal exists, or counsel has a written plan |
| SR-B-05 | Staged release requirements, 31 Oct | A store-profile preflight exists |
| SR-B-06 | Staged release requirements, 31 Oct | Device evidence is committed, and someone owns it |
| SR-B-08 | Staged release requirements, 31 Oct | Effort goes to the store path until 9 Nov |
| SR-C-01 | Staged release requirements, 31 Oct | A parent gets words (signed packs) |
| SR-C-02 | Staged release requirements, 31 Oct | VoiceOver never speaks into a recording |
| SR-C-04 | Staged release requirements, 31 Oct | A thumb slip does not lock a parent out for a day (age gate confirm) |
| SR-C-05 | Staged release requirements, 31 Oct | What the app says about recordings is true (microphone primer, purpose string) |
| SR-C-06 | Staged release requirements, 31 Oct | Edits in Review survive a kill |
| SR-C-07 | Staged release requirements, 31 Oct | Delete a book and erase everything, or the copy stops saying so |
| SR-C-08 | Staged release requirements, 31 Oct | A parent knows about Plus before the third letter |
| SR-C-09 | Staged release requirements, 31 Oct | Help always works (no phone line, mail fails) |
| SR-C-10 | Staged release requirements, 31 Oct | A parent can fix a wrong date |
| SR-C-11 | Staged release requirements, 31 Oct | The book as a PDF without an export and unzip |
| SR-C-13 | Staged release requirements, 31 Oct | The first reminder is asked for at the right moment |
| SR-C-14 | Staged release requirements, 31 Oct | A recording cannot silently fill the phone |
| SR-C-15 | Staged release requirements, 31 Oct | A parent can teach the app a name |
| SR-C-16 | Staged release requirements, 31 Oct | A kept note counts toward the free letters (D-133) |
| SR-C-20 | Staged release requirements, 31 Oct | Account deleted elsewhere, and a new-sign-in email (build 2) |
| SR-C-21 | Staged release requirements, 31 Oct | Co-parent push and the Leave path (build 2) |
| IMP-47 | Retrospective, 28 Oct | Sync conflict copies are visible to a parent |
| IMP-53 | Retrospective, 28 Oct | A launch check for the preview profile in CI |
| IMP-55 | Retrospective, 28 Oct | A contract test that every RPC an Edge Function calls exists |
| IMP-67 | Retrospective, 28 Oct | A claims test keyed to the capability flags |
| MOB-09 | Mobile backlog (cited in `apps/mobile/src/lib/resilience/launch.logic.ts`) | The "update the app" screen when the database is newer than the app |
