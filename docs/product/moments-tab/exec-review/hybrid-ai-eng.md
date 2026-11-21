# Moments hybrid design: Chief AI Officer and principal engineering review (one combined review)

Status: REVIEW, PROPOSED (nothing here is decided). Date: 21 Nov 2026.
Reviewed: `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` at `wip/moments-picker-delta` head a84f448c7f75480b629000b7997d8c4f18652e2b; the spec `docs/product/prd/28-moments-tab.md` at `wip/moments-prd` head 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7 (1682 lines); my earlier reviews `exec-review/caio.md` and `exec-review/engineering.md` (branches `wip/moments-review-caio`, `wip/moments-review-eng`); the role files `docs/agents/exec/COUNCIL.md`, `.claude/skills/early-letters-caio/SKILL.md` and `.claude/skills/expo-native-module/SKILL.md` on `develop` (8d0be681), each read in full. `PICKER-ROUTE-FEASIBILITY.md` was requested "if present": the branch `wip/moments-picker-feasibility` does not exist on origin and no file of that name exists on any branch I searched, so it was not read.

Labels. VERIFIED: I read the primary text in this session (named). UNVERIFIED: I did not read a primary source, or it can only be proved on a device. ASSUMED: an estimate with no measurement. Every Apple API statement below is UNVERIFIED unless marked VERIFIED, because I did not read Apple's PHPicker or PhotosPicker reference pages (the delta did not either; it read a WWDC summary and a forum thread).

Conflict of interest, said first (CAIO skill, opening). I am a session playing two seats, and the spec and the delta were written by sessions of the same model family. This review is not independent. I ask for a challenger who is neither author nor me (a human reader or a different model family) to read EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7 before the founder answers Q1 to Q5. I rule on nothing here; every item is a recommendation.

## Verdict: ACCEPT-WITH-CHANGES

The hybrid is the right shape and it does not touch the part of the design I care most about as CAIO: the recommendation engine stays rule-based, on the phone, with a closed reason list and no machine-written words, and a picked picture never enters it. As engineering it is not buildable as the delta words it, in three places: the picker host cannot live in `scribe-photo` without breaking that module's security pins (and one delta row would add a PhotoKit identifier path those pins forbid); the claim that the picker door can ship even if every library gate fails is contradicted by the PR dependency chain; and the "roughly neutral" effort claim leaves out the cost lines that matter. Separately, the delta did not re-examine suggestion quality, and the grouping rules still reward the wrong kind of day (a dump of saved pictures) while having no answer for near-duplicates or a family that spends weeks away from home.

Conditions:
1. C1 (EXH-ENG-1): the picker lives in a new module `scribe-picker`; `scribe-photo` keeps its pins; NEW-5's library configuration is cut.
2. C2 (EXH-ENG-4, EXH-ENG-5): re-cut 18b into a modal multi-select first and the inline host second, and add the two PRs the dependency chain needs, before anyone says the door survives a failed library gate.
3. C3 (EXH-ENG-6): run the trace script and sweep the five spec places the delta missed before PR 0 merges.
4. C4 (EXH-ENG-7, EXH-ENG-8): write the bars for duplicate, saved-picture and away-from-home cases before G1b, and test them in the local harness of R205.
5. C5: every other finding fixed or answered in the PRD before it is called done.

Counts: 17 findings. BLOCKER 1, MAJOR 7, MINOR 9.

## What I tested, in one table

| Test | Result |
|---|---|
| Is the recommendation engine (grouping, ranking, reasons) honest and explainable, with no machine-written words? | Honest: yes, by the text of 6.4a, R42, R59, R201 and H-10. Explainable: partly (EXH-ENG-9). The hybrid changes it only by removing album and picture-id inputs (EXH-ENG-6 lists what the delta missed). No model is introduced. Code does not exist on any branch, so conformance is UNVERIFIED. |
| Is the quality bar of suggestions met (duplicates, screenshots, bursts, wrong place)? | Screenshots and bursts: handled by metadata flags (spec 7.1, 7.3). Duplicates, saved or forwarded pictures, documents and receipts, and wrong home place: not handled well (EXH-ENG-7, EXH-ENG-8). |
| Is the picker host buildable in Expo SDK 57? | Yes with a local Swift module, no with Expo UI alone, and not inside `scribe-photo` as scoped (EXH-ENG-1, EXH-ENG-2, EXH-ENG-3). |
| Is the 26-PR plan plus 18b ordered correctly, and what can start now? | Not yet: the "ships even if every library gate fails" claim does not hold (EXH-ENG-4, EXH-ENG-5). What can start now is in section "Order and what can start now". |
| Are the G1a additions enough? | Good list, incomplete, and it should be split from the library spike (EXH-ENG-14). |

## Findings

Row format: id, severity, requirement or delta row, evidence, change.

### EXH-ENG-1: the picker host cannot live in `scribe-photo` as scoped, and NEW-5 reopens PhotoKit there

Severity: BLOCKER
Requirements: delta NEW-3, NEW-5, section 1 last paragraph, section 3 R88 row; spec R88, R233
Evidence (VERIFIED, `apps/mobile/test/photos-device.test.ts` on `develop`, lines 868 to 892, and `ScribePhotoModule.swift`, `ScribePhoto.podspec`):
- The test pins the Swift file. It requires the imports to equal exactly ExpoModulesCore, Foundation, ImageIO, PhotosUI, UIKit and UniformTypeIdentifiers (no SwiftUI). It forbids `PHPhotoLibrary`, `PHAsset`, `PHImageManager`, `PHFetch`, `photoLibrary`, `CoreLocation`, `AVFoundation` and `UsageDescription`. It forbids any `View(` or `Function(` export outside the two named functions, `modalPresentationStyle` and `isModalInPresentation`, `contents(`, `UIImage` and any other image source. It requires exactly one `PHPickerConfiguration(` written `PHPickerConfiguration()` with no library, `filter = .images`, `selectionLimit = 1` and `.current`.
- The module's own header says it is "no permission, nothing read but the one picture chosen". Every one of those lines is a security pin from review N8 and the NS-01 rows.
- The delta's NEW-3 asks for multi-select, video, an inline view (a `View(` export, and SwiftUI or a child view controller), and a date read from the picked file. NEW-5 asks that the picker "may use the library configuration" to receive an identifier "that the same attach pipeline resolves". Resolving an identifier is a `PHAsset` fetch, which the pin forbids by name, and the delta itself says the host must not live in the read-only `scribe-library` (R110). So NEW-5 has no legal home.
- The delta's reason for keeping the host in `scribe-photo` is "the one stripper stays one stripper". The stripper is a function (`reencodeUpright`), not a module. A new module can pick and hand files to it.
Change:
1. New local module `apps/mobile/modules/scribe-picker` owns pick, multi-select, the inline view, the date read and temp-file cleanup. `scribe-photo` is not edited by the picker PRs; its pins keep proving "no library, no permission" for the stripper. Layout and scans per the expo-native-module skill sections 2 and 3 (`requireOptionalNativeModule`, logic in `src/lib/photos/*.logic.ts`, Swift thin).
2. Cut NEW-5's library configuration. The item provider path gives the file; the date comes from the file (EXH-ENG-11). With one configuration (no library) the picker never needs `assetIdentifier`, there is no PhotoKit symbol in the module, and the forbidden-symbol scan of R233 applies to it unchanged.
3. Scan scope: add `modules/scribe-picker` to the path scopes of R226 and R233 (today they name `scribe-library`, `src/lib/moments`, `packages/core/src/moments`). `no-system-indexing.test.ts` already walks every module file (skill section 3).
4. If the founder or Karma prefers to keep the host in `scribe-photo`, the PR must rewrite those pins in the same PR with a security-architect review of the pin diff, and the PR body must say so. I advise against it: a feature PR should not loosen a security pin.

### EXH-ENG-2: "Expo UI or a local Swift module" is a false choice; Expo UI has no picker

Severity: MAJOR
Requirements: delta section 1, NEW-3, NEW-4; Q1
Evidence:
- VERIFIED: `apps/mobile/package.json` already depends on `@expo/ui` `~57.0.21` (line 6), `expo` `~57.0.26`, `react-native` 0.86.3, and `react-native-worklets` 0.10.1. I downloaded the published `@expo/ui` 57.0.26 tarball (npm dist-tag `sdk-57`) into a scratch directory and read it: `src/swift-ui` lists no photo component, and a case-insensitive search of every file other than the changelog for "photos" and "PHPicker" returns nothing. Its `ExpoUI.podspec` sets platform iOS 16.4.
- VERIFIED: the published `expo-modules-core` 57.0.26 has a SwiftUI view API (`ios/Core/Views/SwiftUI`: the `ExpoSwiftUIView` protocol, `SwiftUIViewDefinition`, hosting and frame observers). So a local module can define its own SwiftUI view (with Apple's `PhotosPicker` and `.photosPickerStyle(.inline)`) without a new dependency. I did not build one.
- UNVERIFIED: that the UIKit alternative (an `ExpoView` that adds `PHPickerViewController` as a child view controller, iOS 17) is simpler or sturdier than the SwiftUI view. Both need the spike.
- VERIFIED: `scribe-photo`'s podspec says `s.platforms = { :ios => '16.4' }`, while the app's `IOS_DEPLOYMENT_TARGET` is 17.0 (`app.config.ts` line 44). The inline picker APIs are iOS 17 (delta, from the WWDC summary). A new podspec must say 17.0, or the Swift must carry `@available` guards; only `ios-compile.yml` `compile` proves which (VERIFIED it builds every module's Swift in Debug for the simulator).
Change: record the decision as "local module, SwiftUI view through expo-modules-core or UIKit child controller, chosen at the spike", not "Expo UI". No new package, so AIE-R21's dependency approval is not triggered (state that in the PR). Podspec platform 17.0 in the new module.

### EXH-ENG-3: the limits of R90 (6 pictures, 2 videos) may not be enforceable inside the picker

Severity: MAJOR
Requirements: spec R90; delta NEW-3 ("`selectionLimit`", "continuous selection, our own Start control")
Evidence: the delta says the limits are "enforced by picker `selectionLimit` plus our own check". The picker takes one total limit. A mixed limit (at most 6 pictures and 2 videos) cannot be expressed in it (UNVERIFIED, from my knowledge of the API, not read). In continuous selection, to remove an over-limit item our host would have to deselect it, and the deselect call takes asset identifiers (UNVERIFIED), which exist only with the library configuration the delta separately recommends against (NEW-5 default is "never preconfigured when access is None"). So the per-type limit may only be checkable at Start, after the parent has finished choosing.
Change: add to G1a (section "Device spike G1a"). Fallback if it cannot be enforced live: one total cap, the per-type check at Start with one plain line from `content` and the parent deselects inside Apple's UI; or two doors ("Choose pictures", "Choose a video") each with its own cap. Decide before NEW-3's strings are written, because the strings differ. The limit constants live once in `src/lib/photos` and a test imports them in both the check and the Swift scan (the R226 pattern).

### EXH-ENG-4: the picker door cannot "ship even if every library gate fails" with the PR chain as written

Severity: MAJOR
Requirements: delta section 6 (PR 18b row), Q5; spec 19.4
Evidence (VERIFIED, spec 19.4 table): PR 18 `AttachRequest` and copy-for-attach depend on PR 9 (`scribe-library`); PR 19 (capture hand-off from a day) depends on 6, 17 and 18; PR 17 depends on 10 and 16; PR 10 depends on 9. The delta says 18b "needs no library read and no founder decision, so it can start in wave A or B and can ship even if every library gate fails". It can start early. It cannot ship alone, because the hand-off that consumes a picked set is PR 19, which sits behind the library chain, and `AttachRequest` is defined in PR 18. The video strip (R88, R91, R94 route) is also in PR 18, and `scribe-photo` has no video code today (VERIFIED: its TS surface has two image functions).
Change: (a) move the `AttachRequest` type to PR 1 or a small 18a, with the one stripper contract for images and videos, so 18b and 18 both depend on it and not on PR 9; (b) add PR 19b: hand-off from a picked set to capture (no day sheet), depends on 6, 12, 14, 18a and 18b only; (c) restate Q5 as "the door ships under F1 alone only once 19b exists". F2 failing then removes the library cards and leaves a tab with a door, as the delta intends. Without (a) to (c) the fallback story in section 9 of the delta is not true.

### EXH-ENG-5: PR 18b is two PRs, and its size is optimistic

Severity: MAJOR
Requirements: delta section 6 (18b "about 350 to 400"); CODE-R02 (400 lines, 20 files, quoted by spec 19.4)
Evidence: the delta's own estimate sits at the ceiling. Its scope is a multi-select native picker with pictures and videos, an inline host view, a date read before the strip, a closed error set, temp-file lifecycle for up to 8 items including iCloud downloads (NEW-7), the TypeScript surface, the host sheet logic, the new source scans (EXH-ENG-1 item 3) and the scan rewrite, and strings. The size figures are ASSUMED in the delta and in the spec; none is measured.
Change: split. 18b-1: `scribe-picker` presented the way `scribe-photo` presents today (a modal `PHPickerViewController` in a sheet of ours, which is VERIFIED to exist and to have a cancel and timeout design), multi-select, date read, cleanup, scans, JS surface. 18b-2: the inline host view and host sheet, gated on the spike. The first is shippable alone and already removes the album chooser and the all-pictures grid; the second is the styling and flow upgrade, and its risk (EXH-ENG-2, EXH-ENG-3) does not hold the first back.

### EXH-ENG-6: the delta's row sweep missed places where albums, picture ids and the seven verbs still live

Severity: MAJOR
Requirements: delta section 3 ("DROP 2, CHANGE about 14, NEW 8 by hand count; I did not run the trace script"); spec R42, R54, R59, R212
Evidence (VERIFIED, spec at 1c1e05bc): line 263 (6.4a) still lists RSN-ALBUM in the closed reason list and in the precedence order ("... kept, album, place ..."); line 313 (7.4) lists "Use this album" and "Leave out this picture" as verbs; R54 (line 336) says "the closed set is the seven of 7.4"; R59 (line 341) says the `Moment` type has no free-text field "except a parent label, a chosen album title and closed reason keys"; R221 (line 1136) and R255, R257 carry the album and picture members. The delta covers R57, R56, R221, R247, R255 and R257 but not 6.4a, R42's list, R54 or R59, and its verb count ("shrink by two") does not say R54 and R212 must agree on one number.
Change: before PR 0 merges, run `docs/product/prd/tools/trace-gen/check.py` (present on `develop`, UNVERIFIED that it runs on the delta) and replace the hand count. Sweep list: 6.4a and R42 (drop RSN-ALBUM and fix precedence), 7.3, 7.4 and R54 (one verb count), R59 type test, R212, R221, R247, R255, R257. Without this the closed reason list and the `Moment` type, the two things my EX-AI-1 and EX-AI-6 depend on, would carry a dead member that a test could not remove.

### EXH-ENG-7: grouping rewards the wrong days, and duplicates, saved pictures and documents have no rule

Severity: MAJOR
Requirements: spec 7.1, 7.2, 7.3, R38, R40, R41, R44, R59, R60, R205
Evidence (VERIFIED, spec text):
- 7.2 qualifies a day on `BUSY_DAY` (5), or `BUSY_HOURS` (4 within 3 hours), a heart, a video, an occasion or a kept day. `BUSY_HOURS` rewards the densest short window. The pattern that produces the worst cards is a dump in one sitting: a parent saves several forwarded pictures from a message thread, a set of memes, a stack of photographed receipts or documents, or scans of old prints. Those arrive together, within minutes, with no screenshot flag. A real family day spreads across hours. The spec itself says "Documents and receipts cannot be filtered by subtype" (7.4) and answers with "Not this one" after the card has already been shown.
- Excluded before grouping are screenshots, screen recordings, animations, assets with no date, hidden assets, shared-album pictures (7.1). Nothing excludes saved or forwarded pictures. UNVERIFIED how they are flagged by the system; I did not read the PhotoKit subtype and source-type lists.
- A burst is one candidate only when it has a `burstIdentifier` (7.2). Three frames of the same pose a few seconds apart without a burst id are three candidates, and the tile rule (one per session, then the middle of the longest gap) can place two near-identical frames in one collage.
- Tile 1 is a heart, else the even spread. A photographed document can be tile 1 on the card face, which is visible in public (the lock rule R232 covers locking, not this).
- R59's goldens (20 cases) and R60's card sort test the engine against itself and five parents; EX-AI-5 asked for a real-library harness and R205 now specifies it. Its junk bar is "no more than two in ten after one use of Not this one" (R60), which counts the parent's dismissals as the measurement.
Change (all metadata only, no pixel read; bars written before the harness runs, as CAIO step 4 requires):
1. Qualification: test a span rule as an alternative to `BUSY_HOURS`: a busy day counts only when its pictures fall in at least two sessions or span at least `MIN_SPAN` (data in `rules.ts`). Report the share of qualifying days a human marks junk under each rule in the R205 harness and keep the rule with the lower share. This is a hypothesis; I do not know which wins, and a birthday party is dense and good. The harness decides.
2. Near-duplicates: add `NEAR_SECONDS` to `rules.ts`: pictures of one local day within that many seconds of each other form one candidate, the same as a burst, deterministic, metadata only. Add goldens: three frames 4 seconds apart; two pictures with the same timestamp (a restored or re-imported copy).
3. Candidate hygiene with metadata already in or near `READ_SET_V1`: ask G3 whether pixel width and height (a property of the asset, not content) may join the set so that a lone odd-shaped picture or a screen-sized saved image is not tile 1. Do not read file names (R43 forbids it). If G3 says no, say so in the PRD and accept the residual.
4. Prefer a heart for tile 1 only when the day has one; otherwise prefer the tile nearest the day's middle session, not the first picture, so a dump's first frame is less likely to win. Test as a golden.
5. Write the junk bar as the harness's count of days a human marks junk before any Not this one, not after (R60's bar measures the repair, not the engine).

### EXH-ENG-8: the home-place inference fails for a family away for weeks, and "wrong place" is the trust failure

Severity: MAJOR
Requirements: spec 7a.2 steps 2 and 3, R63, R204; EX-AI-4 (mine)
Evidence (VERIFIED, 7a.2): "Home place: the most frequent resolved place across the scanned window", window 90 days (`WINDOW_DAYS`, ASSUMED), never persisted, a day is "away" when its place differs, and a place line shows only when away. A new parent spending most of a 90-day window at a grandparent's home in another city (common after a birth, and in the Asha fixture's own setting of a close extended family) has that city as "home". Every day back in their own city then reads "Pictures from {own city}" with the reason that says it is a place they are away from. The correction ("This is where we live") is reactive and shows after the wrong line is seen. R204's bars are about wrong-country and wrong-city labels, not wrong "away".
Change: (a) add Asha goldens: a 90-day window with 60 days in one place and 30 in another, and the reverse; a family that moved city 40 days ago; (b) show a place line only when the place differs from the home place and is also rare in the window (its share below a threshold in `rules.ts`), so a long stay never turns the real home into an away place; (c) the first time any place line shows, the card menu carries "Where this came from" (R195, already specified) and the primer of the place read says plainly it names a city from where pictures were taken; (d) the G4 five-parent task includes a parent who has been away from home for more than a month. Bars are the owner's to write; mine are proposals. All thresholds are ASSUMED until G1b.

### EXH-ENG-9: reasons are honest but do not say why this day was chosen

Severity: MINOR
Requirements: spec 6.4a, R42, R195, R52
Evidence (VERIFIED): 6.4a gives one reason per card ("Pictures from this day", "A video from this day", "Pictures you hearted"). The reason for the label is a date fact. Only the place line gets a "Where this came from" line (R195). A parent who asks "why did it pick this day, and not yesterday" has no answer; the card hides counts by rule (7.3, R51), which is right.
Change: a closed set of qualifying keys shown only in the card menu, one per rule in 7.2: a heart, a video, a day with many pictures, an occasion, a day you kept close. The wording comes from `content` and must pass R52 and the no-counts rule (so not "5 pictures"; something like "A day with a lot of pictures" is a design and content call, and the word "more" is on R52's forbidden list). Each key's predicate is a pure function in the same table-driven test as R205's reason test. This costs a few strings and one menu line, and makes the engine explainable to the parent in the same words the code uses.

### EXH-ENG-10: Q4 (defer the viewer) hurts the duplicate and blur choice

Severity: MINOR
Requirements: delta Q4, section 6 PR 20 row; spec R149, 7.3
Evidence: the delta recommends dropping PR 20 and says day-sheet tiles are "selection only". With the picker unable to open on one date (UNVERIFIED), the day sheet is where a parent chooses which pictures go in a letter. Near-duplicates (EXH-ENG-7) and a blurry frame are indistinguishable at tile size, and a video has no preview at all.
Change: do not defer the whole viewer. Keep a reduced one: one picture at full width, swipe, a poster and play for video; defer pinch and pan (the cut list already does). About 150 lines per the delta's own figure (ASSUMED). If the founder prefers to defer it, G4 gets a task "choose the better of two almost identical pictures" so the cost is seen before launch. My answer to Q4 below says the same.

### EXH-ENG-11: the date chip needs a rule for several pictures, an API check and a strict scan

Severity: MINOR
Requirements: delta section 1 last paragraph, R95, NEW-3, Q3; H-10
Evidence: the delta says the date comes "from the file's date read inside the native module, offered as a chip, never preselected". For a set of up to 8 files with different dates, what the chip shows is not specified. The file date is read from the picked file's image properties and, for a video, its container metadata; whether the picker's item provider file carries that date in every case (HEIC, JPEG, a saved image with none, a video) is UNVERIFIED. The delta's own forum source calls it "most metadata", not all. A no-date file must give "none".
Change: (a) a pure function in `src/lib/photos` that takes the list of day strings and returns one day or none: one day when all agree, otherwise none (the parent sets the date themselves); never "the earliest"; table-driven test; (b) the native function returns only a `YYYY-MM-DD` string per file computed from the capture-time property and its offset property, never the property bag; (c) the scan for `scribe-picker` fails on any GPS property constant, any property name other than the two date names and the orientation and size names, and any return type wider than a string or null; (d) H-10 holds because the date is a pure function of metadata the phone already shows the parent; say so in the row text, as the delta already proposes.

### EXH-ENG-12: Apple's picker brings Apple's own search, people and badges into our flow

Severity: MINOR
Requirements: delta NEW-6, section 7 "new risks", R43, R193 (claims), R157, R208
Evidence: the delta lists the first-time onboarding words, selection numbers and badges as ours-not-ours (VERIFIED as a delta statement from the WWDC summary). It does not say that the picker's own search and curated sections are Apple's on-device ML that can group by person, place or scene. Our code never sees any of it, so R43 and the constitution (the machine never adds meaning to a person's words) are not touched. But a store line or primer sentence that says "we do not look at who is in your pictures" would stand next to a screen where Apple's search can.
Change: choose the picker's disabled capabilities at the spike and record the choice (hide search at minimum, which the delta says is possible), and have the claims registry (R193) read the picker screen before any "no people" sentence ships. Selection numbers over thumbnails are inside Apple's UI; R208 and R157 are already scoped to our surfaces by the delta, which is right.

### EXH-ENG-13: test seams for an out-of-process view

Severity: MINOR
Requirements: delta NEW-6, R225; expo-native-module skill sections 3 and 5
Evidence: the delta says Maestro cannot assert inside Apple's picker (its inference; consistent with its WWDC source that the app cannot reach into the view). Node tests never compile Swift; source scans prove text (skill section 3).
Change: say what proves what. (1) `src/lib/photos/pick-limits.logic.ts`, the date rule and the host sheet's state machine are pure TypeScript and tested in Node. (2) `scribe-picker/index.ts` exposes a `fixturePicker` (the `fixtureSource` pattern of R220) so Maestro drives our sheet, Start, Cancel, limits and the hand-off with files from the N-layer library. (3) Source scans, one per invariant: no library, permission, location or network symbol; one `PHPickerConfiguration` without a library; the Swift function names equal the names `index.ts` types; limit constants equal the shared constants; temp files only under `Caches/ImagePicker`; no logging; the date function returns only a day string. Remove the guard and see the scan fail, per skill section 5, item 2. (4) `ios-compile.yml` `compile` proves the Swift builds (VERIFIED it runs on native paths); its `launch` job launches the Release JavaScript for 20 seconds and does not open the picker. (5) Device rows, not flows, for the picker itself (delta section 4, G7). The PR names which rows are still owed and asks for `security-architect` by name, because the roster's review paths do not route `apps/mobile/modules/**` to it (skill section 4, VERIFIED text).

### EXH-ENG-14: the G1a additions are good and incomplete, and should be their own spike

Severity: MINOR
Requirements: delta section 4 (G1a (a) to (g)); spec G1a, G1b
Evidence: the delta adds seven picker unknowns to a library spike already marked "S is optimistic, S to M" (delta section 10). Both would sit on one founder phone, the one person-bound resource (my engineering review, EX-ENG-12 there). The picker spike does not depend on PR 9.
Change: split into G1a-L (library unknowns, unchanged, before PR 9) and G1a-P (picker unknowns, before 18b-2). Run G1a-P first on a simulator where it can answer (a), (b), (d) and the host-in-a-sheet questions, then on the phone for (e), (f), (g). Add these to (a) to (g):
- (h) whether a mixed limit can be enforced live (EXH-ENG-3);
- (i) the inline view inside an expo-router modal or sheet: whether the sheet's drag-to-dismiss gesture fights the picker's scroll, and what happens at AX5 with the keyboard and the safe area;
- (j) the date read: which of HEIC, JPEG, a saved image with no capture date and a video give a date, and whether the video file the provider hands back still carries location (the strip decides what we keep, but the spike must say what we are stripping);
- (k) representation mode: `current` against a transcoding mode for video, time and size for one 1-minute clip, and for 8 items at once;
- (l) the item provider for an iCloud-only video: download time on a cellular link and what happens if the app backgrounds mid-download (no `UIBackgroundModes` is allowed, skill section 4);
- (m) backgrounding, App lock and a switcher snapshot while the picker is open: is it blank in the snapshot, and does our sheet answer a Cancel when dismissed by code (the existing `PickerSession` does for the modal);
- (n) run all of it on the lowest iOS the app supports (17.0), not only the newest, because the inline APIs are iOS 17 additions and the floor is 17.0 (VERIFIED `app.config.ts` line 44);
- (o) which of the SwiftUI view and the UIKit child controller is smaller and steadier (EXH-ENG-2), as a recorded choice with the numbers.
Read-outs hold timings and rates only, as G1a already says.

### EXH-ENG-15: two pick paths into one letter

Severity: MINOR
Requirements: delta NEW-2 ("in capture Add"), R85, R88; `scribe-photo` `pickOne`
Evidence (VERIFIED): `pickOne` is single, images only, and its caller is capture's add control (NS-01, BL-931, the expo-native-module skill section 4). The delta adds a door in "capture Add" as well. Whether the NS-01 letter holds more than one picture today is UNVERIFIED by me (I did not read NS-01 or the NS-51/NS-52 rows in this pass).
Change: decide in the PRD that capture Add and the Moments door call the same `scribe-picker` function, and that `pickOne` is then either retired or kept as the strip-only path, with the NS-01 scans (`photos-device.test.ts`, `photos-capture.test.ts`, `photos-surfaces.test.ts`) updated in that PR. Two pickers with two sets of pins is the larger cost and the larger review surface.

### EXH-ENG-16: "roughly neutral" leaves out the cost that moves

Severity: MINOR
Requirements: delta section 6 last paragraphs
Evidence: the delta's arithmetic is internally right (about -600 and about +450 changed lines; I re-added it) and the line figures are ASSUMED. Not counted: the new module's scans, the rewrite or retirement of NS-01's pins (EXH-ENG-15), PR 19b and 18a (EXH-ENG-4), the larger G1a (EXH-ENG-14), new G7 and G4 rows, the host-sheet states in PR 14 and PR 15's access state function (the delta itself says each no-access state gains a door), and the `AttachRequest` having two producers (R88).
Change: say "fewer lines in the library part, more device and review time" instead of "neutral", and keep the benefit the delta already names correctly: a narrower library surface, a stronger no-permission path, a better App Review story. I would still choose the hybrid. I do not have a measured figure for the net change in agent-days and will not invent one.

### EXH-ENG-17: the picker facts rest on a summary and a forum thread; the route feasibility note does not exist

Severity: MINOR
Requirements: delta section 1 and section 12; the task brief
Evidence: the delta says plainly it read a WWDC session through a summary and one developer forum thread, not the PHPicker, PhotosPicker or App Review text. The branch and file the brief expected do not exist (searched `wip/moments-picker-feasibility`, then every remote branch for the file name). I read none of the Apple reference pages either. Every statement about what the picker returns, enforces, hides or does under Limited access is therefore UNVERIFIED.
Change: before 18b-2 starts, `mobile` reads Apple's `PHPickerConfiguration` and `PHPickerViewController` pages and the SwiftUI `PhotosPicker` page and records, with the date, the answers to EXH-ENG-3 and EXH-ENG-11's API questions. The G1a-P read-out then checks them on a device. For 5.1.1(iii) and the other store rules the delta mentions, the CCO and counsel own the read (G2); I do not rely on the delta's wording.

## What the hybrid does well (so it is not lost)

- It keeps the constitution and the engine untouched: grouping, ranking and reasons see only library assets; a picked picture is never grouped, ranked, labelled or given a place (NEW-1). I tested this against R42, R201, R202, R233 and H-10: no new machine-written word enters anywhere.
- Dropping the album chooser and the stored picture identifier removes two identifier classes (EX-CDO-9, EX-PRV-6 in the delta's section 7), and closes my earlier worry that a stored identifier outlives the library access.
- The picker door under F1 alone is the right fallback if G2 or G8 stays open, once EXH-ENG-4 is done.
- No new JavaScript dependency is required (VERIFIED for `@expo/ui` and `expo-modules-core` as above).

## Order and what can start now

Founder questions and the PRD edit are the gate for anything that changes a type. EX-ENG-6 of my earlier review lets rows built "to their stated default" start; the delta's defaults for Q2 and Q3 are the narrowing ones (drop ids, date chip only), which are safe to build first and cheap to widen later because `moments.json` keeps unknown fields (R221).

| Item | Can start | Condition |
|---|---|---|
| PR 0: fold the delta into the PRD, with the sweep of EXH-ENG-6 | Now | Docs only; run the trace script |
| PRs 1 to 4 (pure core types, grouping, tiles, occasions), PR 5 with a synthetic table | Now | PR 1 built to the Q2 default (no album, no picture id, no RSN-ALBUM, five verbs); adds `NEAR_SECONDS` and the span hypothesis as data (EXH-ENG-7) |
| PR 6 tab shell, PR 8 store (about 50 lines smaller), PR 12 content | Now | PR 12 waits one day for the picker door and host strings (Q1) and the limits decision (EXH-ENG-3) |
| G1a-P picker spike, simulator part | Now | Throwaway branch, never merged; no founder decision needed |
| 18a (`AttachRequest` and the stripper contract for images and videos) | Now | New; no dependency on PR 9 |
| 18b-1 (`scribe-picker`, modal multi-select, date read, scans) | After the simulator read-out and a primary-source read of Apple's reference | PR body names the device rows owed and asks `security-architect` |
| PR 14 (host sheet states, picker door row) | Wave B | After PR 12 |
| 19b (hand-off from a picked set) | Wave C | After 6, 12, 14, 18a, 18b-1 |
| 18b-2 (inline host) | After G1a-P device read-out | Decision at the spike (EXH-ENG-2, EXH-ENG-14) |
| PR 9 and its chain (10, 11, 15, 16, 17, 19, 21 to 24) | Unchanged | G1a-L read-out first; G3 to merge PR 9 |
| PR 20 reduced viewer | With PR 17 | Founder's Q4 answer |
| 5b place table | Unchanged | Licence read by licensed counsel |

PR count: the spec's 26 numbered PRs (0 to 25) plus 5b is 27 items. The delta's "26 become 26" counts 18b in and 20 out. With my additions it is: drop 20 as a full viewer and keep a reduced one (still one PR), split 18b into two, add 18a and 19b, so 31 items (0 to 25, 5b, 18a, 18b-1, 18b-2, 19b). That is more PRs and smaller ones, each under CODE-R02, which is the point. The line count is ASSUMED throughout.

## Device spike G1a additions: the short list for the owner

Keep (a) to (g) of the delta; split the spike (EXH-ENG-14); add (h) to (o) of EXH-ENG-14; run on iOS 17.0 and on the iPhone SE 3; the read-out is timings, rates and yes or no per question, nothing else, and no picture, date or place leaves the phone.

## Answers to the founder questions Q1 to Q5 (delta section 11)

My view as CAIO and engineering lead. Each is a recommendation; none is a ruling, and all five are the founder's.

- Q1 (where the inline picker lives): inside a full-height sheet, agree. Add: ship the modal picker first (18b-1) and the inline host second (18b-2) so the sheet's flow is proven before the styling upgrade, and the gesture, snapshot and AX5 unknowns are answered at G1a-P before 18b-2 starts. The picker is not the body of the tab.
- Q2 (drop R56 and R57 now): yes, with the sweep of EXH-ENG-6 so RSN-ALBUM, the sixth and seventh verbs and the type test member go with them in one PR 0. The parent's own tick in the day sheet is the control; a day the parent does not want is "Not this one".
- Q3 (date chip only for a picked picture): yes. Add the several-pictures rule of EXH-ENG-11 (one day when all agree, else none). A place from a picked file is a no, because it reopens the location questions for a path that otherwise needs none, and a picked picture stays out of the engine (NEW-1).
- Q4 (defer the viewer): not the whole of it. Defer pinch and pan and video play controls; keep one reduced full-width view so a parent can choose between near-duplicates and see a video's poster (EXH-ENG-10). If the founder defers all of it, G4 must carry a "choose the better of two almost identical pictures" task so the cost is seen before launch.
- Q5 (the door ships under F1 alone): yes, as an end state. It becomes true only after PR 19b exists and 18a moves `AttachRequest` out of PR 18 (EXH-ENG-4). Until then, F2 failing would leave the door with nothing to hand its pictures to.

## What I did not do

I did not build, compile or run anything, and I did not run the trace script. I did not read Apple's PHPicker, PhotosPicker, PhotoKit subtype or App Review pages, NS-01, NS-51 or NS-52, `NATIVE_MODULE_GATE.md`, or `docs/DECISIONS.md` in this pass. I read the `@expo/ui` and `expo-modules-core` 57.0.26 packages from the public registry into a scratch directory only to answer "does Expo UI contain a picker" and "can a local module define a SwiftUI view"; I did not build against them. The thresholds and bars I propose (span, `NEAR_SECONDS`, place share) are proposals and ASSUMED until the harness runs. Size figures are the delta's and the spec's, ASSUMED. I changed no file other than this one.

Chief AI Officer and principal engineering reviewer (Claude role)
