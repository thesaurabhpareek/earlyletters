# Release test plan: what we test, where, on which phones, and what is still missing

Owner: S19 (qa-e2e). Written 1 Nov 2026 against `develop` at 0f99975, with Karma (CR-37). This file does not replace anything. It sits on top of what we already have and says how the pieces add up to a release:

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
| Unit and integration (vitest) | 5,811 tests: mobile 3,471, core 1,234, api 461, content 236, analytics 129, design-tokens 92, experiments 78, emails 60, brand 50 | `ci.yml` "tests and content rules" on every PR and push | V: all pass locally on 0f99975 (1 skipped in mobile); CI run 41262756225 green |
| Database rules | 38 test files (`npm run test:db`) | `ci.yml` "database rules"; `nightly.yml` real Supabase stack, perf budgets, legacy grants | V: CI green; first scheduled nightly (41216366599, 31 Oct) green. Not run locally |
| Store-profile launch | 1 check: the `testflight` profile Release app launches on a simulator and stays up 20 s | `ios-compile.yml` on native changes; `kill-harness.yml` | V: green (41245906829) |
| Kill harness | DL-01 (kill mid-take) and DL-02 (kill during save) on the simulator | `kill-harness.yml`, scheduled and on dispatch | V: 31 Oct scheduled run green, 50 runs each; the 500-run gate is per release candidate |
| Web journeys (Playwright) | 22 journeys, 203 steps (142 happy, 61 unhappy) | Nowhere. `npm run e2e:web -w @scribe/mobile` by hand | See section 6.2 |
| Maestro flows (iOS simulator) | 20 flow files for 16 ids (E2E-01 to 15 and 17; there is no E2E-16) | Nowhere. `ios-e2e.yml.example` is not enabled | Never run. V: `lint-flows.mjs --app` finds 108 of the 136 ids the flows select missing from `apps/mobile/src`, so every flow stops at its first selector |
| Phone items by hand | 59 sections in DEVICE_TEST_PLAN (S1-01 to 35, S2, TF-01 to 11, DL-01 to 06, B1-01) | A person with a phone | Never run. `docs/qa/evidence` holds only the README and template |
| Alpha run sheets | 106 steps across AL-01 to AL-09, plus AL-10 rehearsals | A person with a phone | Never run |
| StoreKit checks | D-1 to D-12 (S2-01 to S2-21) | TestFlight sandbox or the StoreKit file | Never run |

So, honestly: the code is well tested below the screen, the screens are tested in a browser by hand, and nothing has been proven on an iPhone. That matches the 31 Oct staged release check.

Two written flows contradict a decision and must not be used as evidence until rewritten: E2E-06 expects a Plus gate after 3 Read together sessions, and E2E-07 expects a Plus gate on Add a child. D-082 made both free (`docs/DECISIONS.md` D-082; ASC check D-3). Catalog rows RT-BK-09 and RT-BK-10 track them.

## 2. The catalog

`docs/qa/release-test-catalog.csv`, 173 rows. Each row is a release case with: area, kind (happy, unhappy, error, edge, accessibility, display, performance, privacy, compliance, upgrade, ops), priority, release (B1 the first store build, B2 sign-in and sync, or both), lane (unit, web, maestro, kill, device, testflight, production), environment, device tags from section 3, the existing cases that cover it, and a status.

| Status | Rows | Meaning |
|---|---|---|
| covered | 6 | An automated case runs in CI today |
| automated | 11 | An automated case exists and passes when run; no pipeline runs it (web journeys) |
| planned | 80 | A case is written (Maestro, phone item, run sheet, StoreKit check) but has never run |
| partial | 13 | Part of it is written |
| gap | 61 | No case anywhere; this plan adds it |
| stale | 2 | The written case contradicts a decision |

117 rows are P0. 31 P0 rows are gaps; the largest clusters are purchases and offer codes (unhappy paths and production), release and production checks, and the store-path requirements SR-C-02, 04, 06, 07, 08, 10 and 16 that are not built yet.

To add a case: add a row to `scripts/qa/release-catalog.rows.mjs`, run `node scripts/qa/release-catalog.mjs`, commit both. Never copy steps from another plan; cite its id in `covered_by`. A row moves to covered only when CI runs the case.

## 3. Phones, iOS versions and screen sizes

Facts: the deployment target is iOS 17.0 (`apps/mobile/app.config.ts:44`, V), so DEVICE_TEST_PLAN's 16.4 rows (D-12 on iOS 16, TF-06's 16.4 note) no longer apply. `supportsTablet` is false and orientation is portrait (`app.config.ts`, V). iOS 27 shipped on 14 Sep 2026 and runs on every iPhone that runs iOS 26, from the iPhone 11 and the second-generation SE up (V: MacRumors, Tom's Guide, read 1 Nov). Phones from the XS and XR run iOS 17 and 18 but not 26 or 27 (A: from iOS 26's support list as reported at the time). The full-tier speech model line is 3.4e9 bytes of memory (`lib/models/tiers.ts`, F in DEVICE_TEST_PLAN), so 3 GB phones take the compact model.

| Tag | Phone | Screen in points (A) | Memory (A) | iOS to test | Why it is in the matrix |
|---|---|---|---|---|---|
| D1 | iPhone SE (2nd gen) | 375 x 667 | 3 GB | 18 and 27 | Smallest screen and compact tier together; Touch ID |
| D2 | iPhone SE (3rd gen) | 375 x 667 | 4 GB | 27 | The reference for every budget (`se3`) |
| D3 | iPhone XR or XS | 414 x 896 or 375 x 812 | 3 or 4 GB | 17 (or the lowest a held phone runs) | Oldest supported iOS; capped at iOS 18 |
| D4 | iPhone 12 mini or 13 mini | 375 x 812 | 4 GB | 26 | Narrow and short with a notch |
| D5 | iPhone 12 | 390 x 844 | 4 GB | 26 or 27 | Oldest common full-tier phone (`ip12`) |
| D6 | iPhone 15 | 393 x 852 | 6 GB | 27 | Dynamic Island, 60 Hz (`ip15`) |
| D7 | iPhone 16 Pro or 17 Pro | 402 x 874 | 8 GB+ | 27 | The web journeys' viewport; 120 Hz |
| D8 | iPhone 16 Pro Max or 17 Pro Max | 440 x 956 | 8 GB+ | 27 | Largest screen |
| D9 | iPhone Air | 420 x 912 | A | 27 | Newest odd size |
| D10 | Any iPad | iPhone app in compatibility mode | any | 26 or 27 | App Review often tests on iPad; also a device with no phone line |
| D11 | Newest phone on the newest iOS | A | A | 27.x latest | Built with Xcode 26; must run on the newest iOS |

Shorthand in the catalog: REF is D2 plus a current phone (D6 or D7); ALL is D1 to D10; SIM is the simulator lane; WEB is the web journey lane.

How to cover this without owning eleven phones: the founder's SE 3 and one current phone are the daily pair (DEVICE_TEST_PLAN). D1, D3 and D4 are the three worth borrowing because they hit different limits (memory, iOS floor, narrow notch). Everything that is about layout, not hardware, runs as a screenshot sweep on simulators of every size in the table, on the iOS 17, 18, 26 and 27 runtimes the Xcode image offers (A: check `xcrun simctl list runtimes` on `macos-26`). Hardware-only items (microphone, interruptions, StoreKit sandbox, model speed, thermal, backups) stay on real phones.

## 4. Display and accessibility settings

Every P0 screen (gate, first run, Tonight, Listen, Review, Write, Book, a letter, Read together, Keep sheet, Apple's sheet, Settings, Export) is checked against this matrix. The simulator sweep does the layout rows; a phone does the rest.

| Setting | Values | Where | Catalog |
|---|---|---|---|
| Text size | xS, L (default), xxxL, AX1, AX3, AX5 | Simulator sweep (`e2e/bin/a11y-sizes.sh`), then SE 3 and Pro Max by hand | RT-A11Y-02 |
| Appearance | Light, Dark, switched while open, in-app override | Web journeys, then phone | RT-DSP-01, 02; RT-SET-03 |
| Bold Text, Increase Contrast, Reduce Transparency | On | Phone (iOS 26 and 27 draw system sheets on glass) | RT-A11Y-03 |
| Reduce Motion | On | Phone | RT-A11Y-04 |
| VoiceOver | V-01 to V-10 | Phone | RT-A11Y-01 |
| Voice Control, Switch Control, Full Keyboard Access | On | Phone | RT-A11Y-05, 06 |
| Display Zoom | Larger Text view | Phone (changes the screen width the app sees) | RT-A11Y-07 |
| Smart Invert, Differentiate Without Color | On | Phone | RT-A11Y-08 |
| System Haptics | On, off | Phone | RT-A11Y-09 |
| Region and time | UK, India, 24-hour, time zone change, daylight saving | Phone | RT-BK-06, 07 |

## 5. Pre-release and production

| | Pre-release | Production |
|---|---|---|
| Builds | `development` (dev client), `e2e` (simulator, seams on), `testflight` (build 1, servers off), `preview` (build 2, servers on, staging) | `production`, `com.earlyletters.scribe` |
| Data | Fictional Asha family, except staging during the alpha (D-106) | Real families |
| Purchases | StoreKit file (Xcode) or the sandbox (TestFlight renews subscriptions daily, V in DEVICE_TEST_PLAN) | Real money. Test with one real purchase and a refund after release (RT-PAY-14) |
| Offer codes | StoreKit file code or sandbox codes | Codes generated in App Store Connect for the production app (RT-OFC-08) |
| Crash signal | TestFlight feedback and crashes (TF-07) | App Store Connect and Xcode Organizer only; analytics and crash SDKs stay off (D-124) |
| What can only be proven here | Kill harness, seams, StoreKit edge cases (Ask to Buy, interrupted, billing retry, price consent) | The store binary, production offer codes, real receipts, the live pack host, phased release |

Two facts to plan around:

- The `.preview` TestFlight app and the App Store app have different bundle ids, so they are separate apps with separate data. A tester's letters do not move from TestFlight to the App Store app. Testers need to export first, and nothing we say may suggest otherwise (RT-LCH-05).
- Products exist only on the App Store Connect record they were created on (DEVICE_TEST_PLAN S2 note, F). Until Plus products exist on the `.preview` record, every purchase row runs against the StoreKit file and says so.

Production checks happen in two windows: before release, on the build Apple will review (App Review sees an iPad and an IPv6-only network, so RT-DSP-05 and RT-NET-01 run on the release candidate); and on day 0 to 7 after release (RT-REL-04 to 07, RT-PAY-14, RT-OFC-08), with phased release on so a bad build can be paused.

## 6. Pipelines

### 6.1 What runs today

| Workflow | Proves | Status on 1 Nov (V: GitHub Actions API) |
|---|---|---|
| `ci.yml` | Unit, content rules, database rules, typecheck, no e2e seam in store bundles (B-8) | Green on every recent push |
| `ios-compile.yml` | Native build, the store-profile Release app launches on a simulator | Green |
| `kill-harness.yml` | Builds the e2e simulator app with `xcodebuild` (no EAS), runs DL-01 and DL-02 | Green; scheduled run 31 Oct |
| `nightly.yml` | Fuzz with a random seed, real Supabase stack, performance budgets, legacy grants; opens or closes a `nightly` issue | First scheduled run 31 Oct green |
| `testflight.yml` | Build and upload to TestFlight | Never run: 3 runs, all skipped. Needs the founder's Expo token and the `testflight` environment (TESTFLIGHT.md step 3) |

### 6.2 What does not run, and the order to switch it on

Karma's ruling (CR-37) is to switch these on in this order, each as its own PR with two reviews because it touches `.github/**`, and none of them before the freeze unless it closes a store-path item:

1. **Web journeys in CI.** Linux, no secrets, about the cost of the existing jobs. It turns the 11 automated rows into covered rows and catches screen regressions on every PR. Run it on PRs that touch `apps/mobile/src/**`, and nightly.
2. **Rewrite E2E-06 and E2E-07** to D-082 so no stale flow can be read as evidence.
3. **testIDs.** The 108 missing ids in `TESTID_REQUESTS.md` belong to the mobile owner. Nothing in Maestro can run until they land, and enabling the workflow before that only produces a red job.
4. **Maestro on the simulator.** The e2e app already builds in `kill-harness.yml`, so the blocker in the e2e README ("an `e2e` EAS build profile") is solved in practice: the Maestro job reuses that app artifact. Start with the offline P0 flows (E2E-01, 03, 04, 08, 10, 17), nightly on `macos-26`, then the screenshot sweep across the section 3 simulator sizes (RT-DSP-03) and the text-size sweep (RT-A11Y-02).
5. **preview profile launch check** (RT-LCH-03, IMP-53), next to the existing store-profile launch.
6. **testflight.yml first run**, once the founder has done the Expo and App Store Connect steps.

Things that stay manual on purpose: everything on a real phone, and every purchase in the sandbox or production. Maestro 2.11.0 does not drive physical iPhones (V in the e2e README), and StoreKit Testing needs Xcode.

## 7. Order of work

Freeze is Tue 3 Nov, go/no-go Mon 9 Nov, submission Tue 1 Dec (D-130; staged release check).

Before the go/no-go, on build 1 (needs a phone and a person, SR-B-06): TF-04 smoke on D2 and a current phone; AL-01, AL-02, AL-03 and AL-08 part A; DL-06; S1-23 VoiceOver walk; S1-24 display settings; the build 1 purchase rows against the StoreKit file (RT-PLS-01 to 09, RT-PAY-01, 04, 09, 10, RT-SUB-01, 03, 05, 06, RT-OFC-01, 02). Evidence files in `docs/qa/evidence` as the template says.

Before submission: the rest of the B1 P0 rows, the gap rows for purchases and offer codes in the sandbox, RT-WRD-03 on a 3 GB phone, RT-LCH-09 on the oldest and newest iOS, RT-DSP-05 on an iPad, RT-NET-01 on IPv6, the store-profile preflight (RT-REL-02) and the claims test (RT-REL-03).

Day 0 to 7: the production rows.

Build 2: the B2 rows, after the build 2 gates in ALPHA_GO_NO_GO.

## 8. What this plan cannot tell you

- Point sizes and memory in section 3 are from public specs, not measured. The first simulator sweep records them.
- The catalog says a case exists; only a CI run or an evidence file says it passed.
- I ran unit tests and the web journeys on Linux. I did not run `npm run test:db`, any Mac job or anything on a phone.
- iOS 27 support details came from press coverage, not Apple's own page.
