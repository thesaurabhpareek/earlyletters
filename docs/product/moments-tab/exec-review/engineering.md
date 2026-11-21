# Moments tab: executive review, engineering lead (section 25.12)

Status: REVIEW, PROPOSED (nothing here is decided). Date: 21 Nov 2026.
Reviewed: `docs/product/prd/28-moments-tab.md` at `wip/moments-prd` head 5bebd892 (1187 lines, NS-53-R1 to R191, read in full), plus `CLAUDE.md`, `docs/engineering/PRINCIPLES.md` and the repo files cited per finding. Founder rulings of 21 Nov taken as given: library read in the first release (Route B, own PhotoKit read, flagged), places and occasions in, faces out.
Labels: VERIFIED means I read it in the repo on this branch. UNVERIFIED means I did not or could not check it. ASSUMED means an estimate with no measurement behind it.

## Verdict: ACCEPT-WITH-CHANGES

The module split is right: one pure engine in `packages/core/src/moments`, one optional native module, screens that call `apps/mobile/src/lib` only. Most rows are testable at the stated layer, and the L0 golden approach matches how `packages/core/test` already works (VERIFIED: `packages/core/test/golden`, `plan.test.ts`). The release-gate framing is sound for privacy and legal gates.

It is not buildable as written in four places, and the first release is too big to hold in one train without an explicit PR plan, which the PRD refers to (25.12) but does not contain.

Conditions (all four BLOCKERs must be closed in the PRD, not in code):
1. C1: replace the "five closed functions" native contract (R110, 10.1) with the real list needed by attach, viewer and video (EX-ENG-1), and say how thumbnails reach the screen (EX-ENG-2).
2. C2: specify the on-device `moments.json` schema, keys, versioning, account keying and corruption behaviour (EX-ENG-3).
3. C3: replace the "binary scan finds PhotoKit symbols only in allow-listed profiles" test in R169 with a test that can pass, and add a CI compile with the release profile's flags (EX-ENG-4).
4. C4: adopt the PR split below as the PRD's stacked-PR plan, and state that every OPEN row that changes a type is built to its stated default (EX-ENG-5, EX-ENG-6).

Counts: 21 findings. BLOCKER 4, MAJOR 10, MINOR 7.

## What blocks starting code now

Nothing blocks PR 1 to PR 4 (core types, grouping, tiles, occasions, all pure TypeScript) if the defaults in section 23 are adopted as binding for the build (EX-ENG-6). Native work (PR 9 onward) is blocked by EX-ENG-1 and EX-ENG-4 being settled in the PRD, and by a device spike that should run first, not last (EX-ENG-7). Merging the native read set is blocked by G3 (READ_SET_V1 sign-off, O-15, deadline Mon 24 Nov). Merging the place data is blocked by a dataset licence read (EX-ENG-8). Nothing needs the founder before code starts except O-15 before the PR 9 merge and the D-### entry (G10) before F1 or F2 flip.

## Findings

### BLOCKER

**EX-ENG-1. BLOCKER. R110, R85, R89, R91, R149, R88, NS-51-R29, 10.1 steps 6 and 9.**
Finding: the native contract is "five closed functions" (steps 0 to 6: access status, request access, fetch, thumbnail and similar). That cannot deliver the first-release path the PRD itself requires. Step 9 says "the system supplies each item (the pick of the NS-01 and NS-52 pipelines)", but those pipelines start from Apple's picker, not from an asset id chosen in our own day sheet. Today `scribe-photo` is `PHPickerViewController` with "no photo library" (VERIFIED: `apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec` line 5, `ScribePhotoModule.swift` lines 30 and 135). Route B needs a new native path that takes a local identifier, exports the original (image data, or an export session for video), strips metadata and hands a file to the existing pipeline. The viewer (R149) needs a full-size image request and a video player item, also not in the five. The iCloud-only case at attach (U4, R91) needs a network-allowed request with progress, while R118 says the library is never fetched from the network.
Proposed change: list the real functions (at least access status, request access, fetch window, thumbnail, full image, player item or poster, copy-for-attach image, copy-for-attach video, cancel). Say which module owns each: read-only reads in `scribe-library`, the copy-and-strip path in `scribe-photo` (so the one stripper stays one stripper). Add that attach may let the system download an iCloud original (Apple to device, nothing to us) and carve that out of R118. Re-state NS-51-R29 as "closed list, each function named", not "five".
Evidence: files above (read); R110 text (read); R85 and R149 (read).

**EX-ENG-3. BLOCKER. R29, R54, R55, R56, R65, R113, R115, U12, 17.**
Finding: `moments.json` holds the only data that cannot be rebuilt (day keys, parent labels, hidden places, left-out picture ids, album id). The PRD gives no schema, no version field, no migration rule, no atomic write rule, no corruption behaviour and no definition of the "day key". A day key must say which zone it was made in, or a zone change (U16) moves a hidden day. The file is "keyed by account owner and fails closed" (U12) but the key and the fail-closed behaviour are not specified. It also depends on ADR 0032, which is Proposed, not Accepted (VERIFIED: `docs/adr/0032-on-device-sensitive-store.md` line 3). A reusable file store exists (VERIFIED: `apps/mobile/src/lib/days/store-file.ts`, `store.logic.ts`) but the PRD does not say to reuse it.
Proposed change: add a 17.1 "moments.json contract": `{v, owner, dayKeys[], labels{}, hiddenPlaces[], ...}`; day key is a local ISO date string, zone-free, and "Not this one" applies to the date as the parent saw it; unknown fields preserved; a higher `v` than the app knows reads as empty and writes nothing; write is temp file plus rename; a corrupt file is deleted and the tab starts clean with no message; the owner key is the account owner id, never the user id in logs (OBS-R03); the file is excluded from backup via `scribe-files` `isExcludedFromBackup` (VERIFIED: `modules/scribe-files/index.ts` line 10). Tests at L0 with a fake file system. Ask `principal-architect` for the ADR 0032 status before PR 8.
Evidence: PRD 17 and R115 (read); files above (read).

**EX-ENG-4. BLOCKER. R169, R72, RV-04, 19.2, G7 build step.**
Finding: R169 requires a binary scan that "finds the usage string and PhotoKit symbols only in" the allow-listed profiles. Native modules are linked for every profile: the only autolinking control in the repo is a static list in `package.json` (VERIFIED: `apps/mobile/package.json` line 96, `"autolinking": { "exclude": ["scribe-keys"] }`), and `scribe-photo` already links PhotosUI in every build. So a symbol scan cannot pass unless the module is excluded per profile, and I found no per-profile exclusion mechanism (UNVERIFIED that none exists in the installed Expo autolinking source). Second, CI compiles Swift only with the `testflight` profile's env (VERIFIED: `.github/workflows/ios-compile.yml` lines 5 to 6). With F2 on only in release, preview and development, the flagged Swift path is never compiled in CI before an EAS build. The header says "no Swift in this repository has ever been compiled" until that job runs (VERIFIED line 3).
Proposed change: link `scribe-library` in every build and make it dead code when F2 is off. The profile control is then (a) the `NSPhotoLibraryUsageString` set by a config plugin in `app.config.ts` only for allow-listed profiles (plugin list at line 281, VERIFIED), and (b) an L1 source test that no call site of `scribe-library` is reachable unless the F2 constant is true. Replace "PhotoKit symbols" with "plist key present only in allow-listed profiles" plus the call-site test. Handoff to the founder (agents cannot edit `.github/workflows/`): add a matrix leg to `ios-compile.yml` that prebuilds with the release profile's env. Privacy confirms Apple's reading of a linked-but-unused framework is fine (UNVERIFIED, counsel's G2 question).
Evidence: files above (read).

**EX-ENG-5. BLOCKER. 25.12, 19.3, R171, R1 to R191 as a whole.**
Finding: the PRD has no PR plan and no sizes. 191 rows plus a new Swift module plus a fourth tab is far above CODE-R02 (400 lines, 20 files) as one change (VERIFIED: `docs/engineering/01-code-and-change.md` line 31), and the size check is written but not running (CODE-G1 gap, same line). Reviewers cannot answer 25.12 without it. The one-concern rule needs the order and the owners.
Proposed change: adopt the split below into the PRD as section 19.4. Each PR carries its row ids so the traceability table stays honest.
Evidence: R169 to R171 (read); CODE-R02 (read).

### MAJOR

**EX-ENG-2. MAJOR. R112, R88, 10.1 step 6, R146.**
Finding: step 6 says thumbnail "an image handed to the view" with nothing persisted, but an async native function cannot hand pixels to a React Native `Image` without either encoding bytes over the bridge (slow for 4 tiles by up to 90 days of cards), writing a file (breaks "never written to disk"), or rendering in a native view. Step 6 also allows "a third-party image library if its disk cache is off" while R88 says no third-party media package appears in the lockfile. No image component library is in `apps/mobile/package.json` today (VERIFIED by grep: no `expo-image`).
Proposed change: decide a native view (`ScribeLibraryThumbnail`, an Expo module view taking `localId` and `px`, doing request, cancel on unmount and its own LRU). State that it replaces the third-party allowance. It also makes R112 testable: cancellation on unmount is a view lifecycle fact, checked in a simulator flow (EX-ENG-12). Cost: a Swift view, accessibility traits (decorative, the card carries the label), and a fixture view for tests.
Evidence: PRD rows (read); package.json (read).

**EX-ENG-6. MAJOR. 23 (O-09, O-11, O-12, O-13, O-14, O-16, O-34, O-35), R40, R50, R55, R56, R57, R59, R66.**
Finding: eight OPEN rows change the `Moment` type, the decisions file or the golden `asha-lib-v1` (20 cases). Deadlines are Mon 24 and Fri 28 Nov, before the build can plausibly finish. A reversal after PR 1 to 3 rewrites types and goldens.
Proposed change: the PRD states "build to the default; each is data or one switch". For each, the engine takes it as a `RULES` field or a feature constant (for example `RECENT_TIERS`, `LEAVE_OUT_ENABLED`, `ALBUMS_ENABLED`, `PLACE_ON_EVERY_CARD`), so a reversal is a one-file change plus golden regeneration. Golden cases that depend on an OPEN row are tagged and live in their own file.
Evidence: section 23 (read).

**EX-ENG-7. MAJOR. G1, 10.3, R109, R111, R125, RK-6.**
Finding: the device spike is a release gate, but its output sets the native contract: `fetchLimit`, the window, whether the subtype predicate works or is filtered in Swift, whether `location` is readable under Limited, the delivery options, and the LRU size. The PRD lists all of these as UNVERIFIED (7a.1, 10.1, 27). Building PR 9 and PR 10 on guesses and then spiking at the end puts the largest rework at the worst time.
Proposed change: split G1. G1a runs first, in the first week, on the founder's phone or a simulator with a script-made library, and is limited to the unknowns above; its read-out is the input to PR 9. G1b is the full SE 3 performance run before submission. `qa` writes the library generator once for both (EX-ENG-12).
Evidence: PRD 10.1 UNVERIFIED notes (read).

**EX-ENG-8. MAJOR. R61, R63, R64, 7a.1, 7a.2, G1, RK-5.**
Finding: the place pipeline is specified as arithmetic over a bundled table, with no complexity or placement. A naive nearest-city scan is pictures times table rows (for 3,000 pictures in a 90-day window and a 30,000 row city table, about 90 million distance computations, ASSUMED) on the Hermes JS thread. The dataset, its licence, its size and its home are not chosen (UNVERIFIED in the PRD). `core/moments/place.ts` "with the bundled table" would put megabytes of data in `packages/core`, a package that today is code only (VERIFIED: `packages/core/src` has no data blobs beyond `lang`).
Proposed change: (1) `core/moments/place.ts` takes the table as an argument (pure, tested with a 10 row synthetic table); (2) the table lives in its own data package or an app asset, loaded lazily, with a grid index built at generation time so lookup is O(1) per picture; (3) resolve at most the pictures needed for the day's majority (sample up to a fixed number per day, a stated rule so the golden is deterministic); (4) licence and attribution read by `legal` before the dataset is committed; (5) the build script and the table are generated data, excluded from CODE-R02 counts.
Evidence: 7a.1 and 7a.2 text (read); `packages/core/src` listing (read).

**EX-ENG-9. MAJOR. R39, R128, U16, U18, R37, CODE-R10.**
Finding: R39 says the engine gets the day through an `offsetAt(ms)` parameter with "no Intl in core". Two problems. Core already uses `Intl.DateTimeFormat` with a `timeZone` (VERIFIED: `packages/core/src/invite.ts` line 153), so the claim is false as a repo fact. And whatever supplies `offsetAt` on Hermes must get DST right; Hermes Intl support is limited (ADR 0014 notes no `Intl.Segmenter`, VERIFIED in `packages/core/src/lang/types.ts` line 74), and I did not verify `timeZone` offset behaviour (UNVERIFIED).
Proposed change: have the native fetch return the UTC offset in seconds for each asset, from the system calendar for that asset's date (so "the card date equals the Photos app's date" holds by construction). The engine keeps `offsetAt` as a parameter, tested at L0 with fixed tables across a clock-change day. Remove "no Intl in core" or scope it to `moments/`.
Evidence: files above (read).

**EX-ENG-10. MAJOR. R111, R112, R113, R125, R190, U7, U21, 10.3, `docs/tdd/06-performance-reliability.md` budgets.**
Finding: no memory budget exists for this tab. Arithmetic, ASSUMED: a tile at 96 pt on a 3x screen is 288 by 288 pixels, about 330 KB decoded; a 60 entry LRU is about 20 MB; Recent over a 90 day window is up to 360 tiles if every day qualifies; a day sheet of 300 pictures can request 300 more. The existing idle target is "under 150 MB resident after first run" (VERIFIED: TDD 06 line 444). The PRD names no LRU size (left to the spike) and no ceiling for the day sheet. Columnar arrays over the bridge for a large window carry string identifiers (about 40 bytes each, ASSUMED), fine at thousands, not at 20,000, so the fetch limit must be a hard cap.
Proposed change: add a budget row set to TDD 06: tab idle memory delta, LRU ceiling in bytes (not entries), day sheet page size (for example 60 tiles, then page), `fetchLimit` hard cap, and a memory-warning handler test (U21) at L2 with a simulated warning. Numbers are decided by G1a; the rows exist now so tests can read them from `rules.ts`.
Evidence: TDD 06 (read); arithmetic is mine, ASSUMED.

**EX-ENG-11. MAJOR. R83, R87, R167, R172, 18, 9.1.**
Finding: adding `source: 'moment'` touches four places the PRD names only in part. `CAPTURE_SOURCES` is built from `HOME_CAPTURE_SOURCES` and `CAPTURE_DOORWAYS` (VERIFIED: `apps/mobile/src/lib/capture/start-capture.logic.ts` lines 18 to 24), and its header requires "a `design-systems` approval line" for a new source. The tab manifest header says "Only Home starts a letter" (VERIFIED: `lib/nav/tab-jobs.ts` lines 1 to 5) and `test/navigation-one-entry.test.ts` pins N1 to N6. `trackCaptureStarted` passes `source: 'tonight'` for every start (VERIFIED: `start-capture.ts` line 30), so R167's "existing closed value, now including `moment`" needs a catalog change that R87 simultaneously says must send nothing about the origin. The two rows disagree.
Proposed change: one PR, owned by `design-systems` with `analytics`, that adds the third list (`MOMENT_SOURCES = ['moment']`), updates `tab-jobs.ts` and N1 to N6, and settles analytics: either `source` stays `tonight` for moment starts (R87 wins, simplest, nothing new in the catalog) or a new enum value is added behind consent. Recommend the first; drop `moment` from R167's property list.
Evidence: files above (read).

**EX-ENG-12. MAJOR. Layers L0 to L5, R70, R112, R122, R125, R149, R189, 20 (E2), G1, G5, G7.**
Finding: the native module has no automated layer. The stated layers are unit (L0), scans (L1), simulator e2e (L2), visual (L3), audit (L4) and device (L5). Everything about the real read (Limited, iCloud-only, cancellation, recycled rows, zone change, 20,000 items) falls to L5 on one founder phone, which is slow, single-owner and not repeatable in CI. The e2e layer is Maestro (VERIFIED: `apps/mobile/e2e/config.yaml` and `flows/`), and L3 is Maestro screenshots with `xcrun simctl ui` (VERIFIED: TDD 09 line 453). I did not verify that the simulator can seed a Limited selection or an iCloud-only asset (UNVERIFIED). `xcrun simctl addmedia` can seed a library of generated images with dates and location (UNVERIFIED for 20,000 items and for EXIF location).
Proposed change: add an "N" layer: a generated Asha library script (synthetic pictures, no real data, R107) loaded by `simctl addmedia` into a simulator, driven by Maestro flows through `fixtureSource` for UI and through the real module for read tests. Keep L5 only for what a simulator cannot do (Limited picker, iCloud-only, thermal, 120 Hz, real notification timing). `qa` owns the script and the flows.
Evidence: files above (read).

**EX-ENG-13. MAJOR. R37, R43, R68, R16, R61, R164, R169.**
Finding: the scans are the enforcement of the constitution for this tab and need a written design. R43 forbids symbols such as `CoreML`, `MapKit`, `Vision` in "the Moments code and library module". Unscoped they would hit existing code: `whisper-runtime.ts` contains `useCoreMLIos` (VERIFIED: `apps/mobile/src/lib/models/whisper-runtime.ts` line 93). R37 wants a scan that fails on any `PHAsset` property outside the closed set, which needs a Swift-aware allow list. R16 wants "imports nothing that reads location, content, people or the network", an import-graph rule I did not find in the repo (UNVERIFIED).
Proposed change: one scan script with a path scope (`modules/scribe-library`, `src/lib/moments`, `packages/core/src/moments`), an allow list of `PHAsset` members read from a single constant that the Swift file and the TS type both import by name in a test, and an import-graph test for `core/moments` (no `react-native`, no `expo-*`, no `fs`; CODE-R10). `privacy` owns the allow list text, `qa` the script. Each scan has a negative test (a fixture file that must fail).
Evidence: files above (read).

**EX-ENG-14. MAJOR. R171, R169, G1 to G10, R170.**
Finding: gates need a check, not only a document. R171 is rated layer "P" (process). "The build fails the store check if a gate has no read-out" (19.2) has no named check. R170 refers to a "signed config" for K1, K2 and K4; I found no existing signed-config reader for kill switches under that name (UNVERIFIED; `capabilities.ts` and `billing/status-report.ts` mention kill switches, not read in depth).
Proposed change: a small guard script in `scripts/guards` (same pattern as `pr-size.mjs`, VERIFIED present): given the profile, if F2 is on it reads `docs/release/<x.y.z>.md` and fails unless G1 to G7 and G10 each have a dated line. Founder pastes the workflow step. For R170, `mobile` confirms the kill-switch source before PR 11, or the rows say "remote config, to be built" and become a separate PR.
Evidence: `scripts/guards/` listing (read).

### MINOR

**EX-ENG-15. MINOR. R111, R53, R109.** "Home's first frame is delayed by 0 ms" cannot be proven; a measurement has noise. Replace with "no `scribe-library` call before first Moments focus (L1, already R109) and a startup marker delta within the existing budget (`lib/perf/markers.ts`, VERIFIED present)".

**EX-ENG-16. MINOR. R39, R77, R122, R125.** Timing rows ("under 1 s", "one calm move") at L2 on a shared simulator are flaky. State them at L5 or as a Maestro assertion with a wide margin, and keep the logic (state function, redraw trigger) at L0.

**EX-ENG-17. MINOR. R62, R94, R132 to R135, R140 to R142, R184, R188, R67, R82.** Phase 2 and 3 rows sit in the same table, same priority labels, as phase 1. Add a "Not in first release" column or split the table so a reader counting rows for the first release gets the right number (by my count R62, R67, R82, R94, R132 to R135, R140 to R143, R184, R188 are not phase 1: 17 rows).

**EX-ENG-18. MINOR. R59, 6.1.** The golden `asha-lib-v1` has 20 cases F01 to F20 but the fixture is "committed as data and script, no photo bytes". Say where it lives (`packages/core/test/golden/` follows the existing pattern, VERIFIED) and that regenerating it needs a founder-visible diff, as for the engine goldens.

**EX-ENG-19. MINOR. R109, R125, R152.** R152 and R189 need frame budgets and screenshots "per state, eleven states, SE 3 at AX5". Eleven states times themes times sizes is a large L3 matrix; prune to the states that differ (value view, ask card, limited, denied, Recent, day sheet) and run the rest nightly.

**EX-ENG-20. MINOR. R118, U4, R91.** R118 ("the library is never fetched from the network") and U4 (iCloud-only item waits at attach) read as contradictory. Fold into EX-ENG-1's carve-out and say it in the privacy line: the system may download an original to this phone at the parent's tap; nothing goes to us.

**EX-ENG-21. MINOR. R66, 7a.3 (public holidays, O-33).** A US civic holiday table by date needs no dependency: a pure function with fixed rules (nth weekday, observed-day rule). Do not add a holiday library. Put it in `core/moments/occasions.ts` with a golden for 3 years.

## Module boundaries (checked)

| Piece | Where | Verdict |
|---|---|---|
| Engine (types, exclude, group, rules, occasions, collage, rank, plan) | `packages/core/src/moments` | Right. Pure TS, no RN (CODE-R10). `Moment`, reason keys and enums defined once (CODE-R13). |
| Place resolver | `core/moments/place.ts`, table injected | Change: table out of core (EX-ENG-8). |
| `momentsFor` registry, surfaces as data | core | Right; this is the R36 and R130 test target. |
| State function, `use-moments`, hand-off, clear | `apps/mobile/src/lib/moments` | Right; screens import only this (CODE-R11). |
| Reads | `modules/scribe-library` | Change: contract list (EX-ENG-1), thumbnail view (EX-ENG-2). |
| Copy and strip | `modules/scribe-photo` | Keep as the only stripper (EX-ENG-1). |
| Components | `apps/mobile/src/components/moments` | Five named in R13; `design-systems` approves. |

## Dependencies to add

| Item | Needed | Note |
|---|---|---|
| `scribe-library` Swift module | Yes | Local Expo module, same pattern as `scribe-photo`. |
| Native thumbnail view | Yes | Part of the module (EX-ENG-2). |
| Place table data | Yes | Data package or asset, licence read first (EX-ENG-8). |
| Holiday table | No | Pure function (EX-ENG-21). |
| Image, media, holiday or date libraries | No | R88 stands; do not add. |
| `expo-media-library` or similar | No | Would break the closed read set. |
| iOS 17 floor | None | Route B uses APIs older than iOS 17 (UNVERIFIED for each; the floor is `IOS_DEPLOYMENT_TARGET = '17.0'`, VERIFIED in `app.config.ts` line 44). O-36 matters only for Route A. |

## Performance and memory (summary)

Date-window scans, no whole-library enumeration, no launch work, no change observer (10.3) is the right design. Risks to measure in G1a: per-asset `location` and metadata cost across a window (UNVERIFIED), bridge cost of identifier strings, decode memory of thumbnails (EX-ENG-10), place lookup cost (EX-ENG-8), list recycling (a recycled row must cancel its request: an unmount effect in the native view). Low Power Mode skip and critical-storage skip (10.3) are cheap to add and need L2 tests with injected flags.

## Test plan

L0 (core, vitest): exclusion, day grouping across clock changes, qualification tiers, tile order (property test: any input order gives one output; one heart changes only the heart slots), occasions and holidays, `momentsFor` registry surfaces, the 20 case golden, reasons precedence, forbidden-word content test. L0 (mobile `*.logic.ts`): state function ACC-0 to ACC-5, decisions store, handoff, `clear`. L1: READ_SET scan, forbidden-signal scan, import graph, call-site reachability, plist-by-profile, no coordinate field on `Moment` (type test), canary through logs. L2 (Maestro, simulator, `fixtureSource` plus generated library): ask flow, Not now, denied and restricted lines, day sheet to capture, back-out leaves 0 files, tab order. L3: pruned state set (EX-ENG-19). L4: VoiceOver walk and audit on the pruned set. L5: Limited, revoke in Settings, iCloud-only, notification timing, switcher snapshot, frame times. G1 to G10 map: G1a and G1b `mobile` and `qa`; G2, G3, G8, G9 counsel and `privacy`; G4 `user-research`; G5 `qa` and `design-systems`; G6 `content`; G7 `qa`; G10 founder.

## Proposed PR split (sizes ASSUMED, in changed lines excluding generated data and lockfile)

Owners use roster handles. There is no `core` handle (VERIFIED: `agents/roster.json`), so engine PRs go to `mobile` with `principal-architect` reviewing under CODE-R13.

| # | PR (one concern) | Owner | Size | Depends on |
|---|---|---|---|---|
| 0 | Decide D-### defaults and EX-ENG-1, 3, 4 text in the PRD (docs) | `product` | docs | founder G10 for flip only |
| 1 | `moments/types`, `reasons`, `rules.ts` constants, enums in `domain.ts` | `mobile` | 300 | 0 (defaults) |
| 2 | `exclude`, `group` with `offsetAt`, qualification, `asha-lib-v1` generator and 20 goldens | `mobile` | 380 | 1 |
| 3 | `rank`, `collage`, tile order, seeded rotation, property tests | `mobile` | 350 | 2 |
| 4 | `occasions` (birthday, month day, holidays, firsts), `momentsFor` registry, Today and Look back and Question slots | `mobile` | 380 | 1 |
| 5 | `place.ts` with injected table, grid lookup, goldens on a synthetic table | `mobile` | 300 | 1 |
| 5b | Place table package and generator, licence note | `mobile`, `privacy` approve | generated | licence read by `legal` |
| 6 | Tab shell: fourth tab, `tab-jobs`, `MOMENT_SOURCES`, navigation tests, F1 flag, `moments/pick` route row | `design-systems` | 250 | 1 |
| 7 | Analytics decision for `source` and catalog rows (or the no-change note) | `analytics` | 150 | 6 |
| 8 | `moments.json` store, clear, `eraseDeviceFiles`, schema tests | `mobile` | 300 | 0 (EX-ENG-3) |
| 9 | `scribe-library` access and fetch (columnar), `nullSource`, `fixtureSource`, TS surface | `mobile` | 400 | G1a read-out, G3 to merge |
| 10 | Native thumbnail view, bounded LRU, cancellation | `mobile` | 350 | 9 |
| 11 | Config plugin usage string by profile, guard scripts (READ_SET, forbidden signals, import graph, call-site, gate read-out) | `privacy` text, `qa` scripts | 350 | 9 |
| 12 | Content: tab, reasons, ask, primer with Shown, Records, Never, Decline, states | `content` | 380 | none |
| 13 | Components: `MomentCard`, `DayCollage`, `ExampleCard` | `design-systems` | 400 | 6, 12 |
| 14 | Components: `PermissionAsk`, `SegmentedSwitch`, state lines | `design-systems` | 300 | 12 |
| 15 | `use-moments`, ACC state function, foreground re-read, kill switches | `mobile` | 350 | 4, 8, 9 |
| 16 | For you screen with no library, value view, examples | `mobile` | 300 | 13, 14, 15 |
| 17 | Primer, ask flow, Recent, day sheet | `mobile` | 400 | 10, 16 |
| 18 | Copy-for-attach paths (image and video) in `scribe-photo`, `AttachRequest`, handoff | `mobile` | 400 | 9 |
| 19 | Capture hand-off from a day, back-out, draft prompt | `mobile` | 300 | 6, 17, 18 |
| 20 | Viewer (full image, video poster and play) | `mobile` | 300 | 18 |
| 21 | Teaching verbs, Me list, Turn off, Start again | `mobile` | 350 | 8, 17 |
| 22 | Places on cards, Not this place, Hide this place | `mobile` | 300 | 5, 5b, 17, 21 |
| 23 | Home pointer, existing-class nudges from phone-held facts | `mobile` | 250 | 4, 6 |
| 24 | Simulator library generator, Maestro flows, L3 and L4 set | `qa` | 400 | 9, 17 |
| 25 | Release read-out guard step and `docs/release/<x.y.z>.md` entries | `qa`, founder pastes workflow | 150 | 11 |

Order in waves: wave A (parallel): 1, 4 after 1, 6, 8, 12 and the G1a spike. Wave B: 2, 3, 5, 9, 13, 14, 7. Wave C: 10, 11, 15, 18, 16. Wave D: 17, 19, 20, 21, 22, 23, 24. Wave E: 25 and the gate read-outs, then the F2 flip. Total about 7,600 lines across 26 PRs, ASSUMED. At the reconciliation pack's 28 to 34 agent-days for Route B (quoted by the PRD, not re-estimated by me) I would add the founder-phone time for G1a, G5 and G7 as the critical path, because only one person can do it.

Phase 2 (library-timed reminder, email, geocoder) and phase 3 (Route A, K-SUG) are not in this split.

## Release gates G1 to G10 (engineering view)

G1 split into G1a and G1b (EX-ENG-7). G3 blocks the PR 9 merge, not its start. G5 and G7 need a physical iPhone SE 3 and one person (EX-ENG-12). G8 and G9 do not apply to the first release as scoped. G10 is a document, but the flip needs a check (EX-ENG-14).

## What I did not do

I did not build or run anything, read the lead documents behind the PRD (only the PRD and the repo files cited), or verify Apple behaviour (Limited and `location`, `simctl addmedia`, autolinking per profile, Hermes time zones): all UNVERIFIED above. I changed no file outside this one.
