Status: PROPOSED review input (nothing here is decided; every acceptance of a residual risk is the founder's)
Date: 21 Nov 2026
Reviewers: CISO and CDO, one combined review (Claude roles: not an auditor, not a penetration tester, not a lawyer or a privacy regulator)
Reviewed: `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` on `wip/moments-picker-delta` at a84f448c7f75480b629000b7997d8c4f18652e2b (read in full, 235 lines); `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7 (read in the parts named per finding, not line by line)
Earlier reviews re-read: `exec-review/ciso.md` (wip/moments-review-ciso, 5ed6b9e3) and `exec-review/cdo.md` (wip/moments-review-cdo, 19081b4b)
Not found: `PICKER-ROUTE-FEASIBILITY.md` on `wip/moments-picker-feasibility`. No such branch exists on the remote, and `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` on another branch is a different document I did not use. Nothing below leans on a feasibility file.
Repo facts read from `develop` at 8d0be681 (the code as it stands today). Fictional family Asha only.

# Hybrid design: CISO and CDO review

## Disclosures first

- Both roles are one Claude session. The same kind of session wrote the delta, the PRD and my two earlier reviews. That is not independent. This is a self-assessed review, not an audit and not a penetration test. For a hostile read of the native module before outsiders store letters, the CISO skill (section 6) still says an independent tester.
- I ran nothing. No device, no simulator, no Swift compile, no test. Everything about picker behaviour on a phone is UNVERIFIED unless it is a quoted line from Apple's pages or from this repo.
- Source labels used below. READ-REPO: I opened the file at the path named on `develop` or on the named branch. READ-APPLE: Apple's own documentation page, fetched in this session as raw Markdown. READ-EXPO: the Expo documentation page, but I received only a small model's summary of it, so treat it as a pointer, not a quote. DELTA: the delta says so and I did not re-read the primary source. UNVERIFIED: not read from a primary source.
- I did not re-read the WWDC23 session (10107). Every claim that rests only on the delta's summary of it is DELTA.

## Verdict: ACCEPT-WITH-CHANGES

The hybrid is a good trade for security and for data. The picker is the one door where Apple holds the browsing, the albums, the search and the selection, and we receive only the files the parent chose. Nothing in the delta adds a server table, an analytics property, a stored identifier or a permission. I can sign the hybrid on these conditions:

1. **C1.** The date read from a picked file is a native function with an allow-list of property keys, runs on the original before the strip, and returns a local calendar day or nothing (EXH-SEC-3, EXH-DAT-1).
2. **C2.** The picker host is custom Swift inside `scribe-photo`. No new package, and no library-configured picker (EXH-SEC-1, EXH-SEC-2).
3. **C3.** The picker door gets its own security gate, anchored on F1 and not on F2, before it ships (EXH-SEC-7).
4. **C4.** PR 18b is split, and video is not in its first PR (EXH-SEC-4, EXH-SEC-8).
5. **C5.** The picker's temporary originals get a classification row and a retention rule before 18b merges (EXH-DAT-3).

Counts: 15 findings. BLOCKER 1, MAJOR 9, MINOR 5.

Top three: EXH-SEC-3 (the date read must never touch the location keys and must return a day only), EXH-SEC-7 (the door under F1 alone moves where G11 has to be anchored), EXH-SEC-2 (the library-configured picker in NEW-5 would put `PHPhotoLibrary` and an asset identifier into the build that is supposed to need neither).

## Answers to the delta's questions Q1 to Q5 (section 11 of the delta)

**Q1. Where does the inline picker live, in the tab body or in a sheet?** In a sheet, as the delta recommends. Security reasons added: (a) a sheet can be dismissed by us when App lock engages or the scene goes inactive, a tab body cannot be torn down so cleanly; (b) Apple's page says the picker ignores touches while its view is anything other than fully opaque in iOS 17 and later, so an inline picker under a fading or transformed tab container would fail in ways we cannot test (READ-APPLE, `PHPickerViewController`); (c) nothing is created until the parent taps, so no picker is preloaded and none runs in the background. Residual: the sheet's own presentation animation must not change the picker view's opacity (EXH-SEC-6).

**Q2. Drop the album chooser (R57) and "Leave out this picture" (R56) now?** Yes, drop both. Data view: the PRD head already stores neither. R247 says "no picture identifier and no album identifier is stored" and 17.1 lists both under "Not in the file", with R56 and R57 default-off behind two constants (READ-REPO, PRD lines 1162 and 835 to 850). So dropping them removes two dead constants and two review rows, and it removes the founder's option to reverse. It does not remove a stored class that today exists. The delta says it "dissolves" EX-CDO-9 and EX-PRV-6; at the PRD head those were already met by default, so the honest claim is "makes permanent". See EXH-DAT-4.

**Q3. For a picked picture, show only an optional date chip, or also a place label?** Date chip only. A place from a picked file means reading the GPS keys of the original into our process, which is exactly the exposure EX-SEC-4 closed for the library path (coordinates never enter JavaScript). It would also open counsel questions Q3, Q4 and Q10 for a path that needs none. Refuse the place label for picked pictures, and write that refusal into the row, not only into the answer.

**Q4. Defer the viewer (PR 20) for 1.0?** Yes, defer. Security view: the viewer for a picked or library video would need a video playback package, and `expo-video` is exactly the dependency that EX-SEC-1 of my earlier review held as a blocker. Dropping PR 20 also drops a decoder-facing surface. Limit: letters keep the viewing rules they already have (R101).

**Q5. The picker door ships under F1 alone, so a failed library gate never removes it.** Yes, with one change: it needs its own security gate (EXH-SEC-7), because every gate in the PRD that protects the device is written around F2 and `scribe-library`. The door has no permission and no purpose string, so the risk level is lower than the library read, but "lower" is not "unguarded".

## What stays Apple-process only (the part of the design I rely on most)

READ-APPLE: `PHPickerViewController` is "a view controller that the system renders on top of your app"; it cannot be subclassed and "its view hierarchy belongs to the system and therefore, the framework provides no access". DELTA: the picker runs out of process, our app cannot screenshot it, and needs no library permission.

| Stays inside Apple's process (our code never sees it) | What crosses to us |
|---|---|
| Every thumbnail, the Albums tab, search, scroll position, what the parent looked at and did not pick | One item provider per item the parent selected |
| Selection numbers, badges, durations, the first-time onboarding words, motion, VoiceOver of the picker | Nothing of the above |
| The Options menu that can strip location (absent for apps with full library access, DELTA) | The file, with whatever metadata it still carries |
| iCloud download progress UI of the system | The file, once downloaded |

Rule to write down: we never infer anything from what the parent browsed, and we never count, time or log a picker session. Presence of an event for "picker opened" would be the one way to turn Apple's private browsing into our data.

## Findings

### EXH-SEC-3 BLOCKER (for the merge of PR 18b, not for the hybrid): the date read has no contract that keeps the location keys out of our process

- **Requirements:** delta NEW-3 ("reads only the date from the file inside native; no coordinate leaves native"), R95, NS-01-R17, R89, R93, EX-SEC-4 of my earlier review.
- **Finding:** The delta's rule is "no coordinate leaves native". That is weaker than what the library path already guarantees. The original in `Caches/ImagePicker` carries GPS (READ-REPO: `MEDIA_THREAT_MODEL.md` rows M2 and P2). `CGImageSourceCopyPropertiesAtIndex` returns the whole property dictionary, GPS dictionary included, so a date read that fetches the dictionary and picks one key has already put the coordinates in the process, even if it returns only a day. Today the file reads width and height and nothing else, with the comment "Read from the source only to size the decode: its width and height, nothing else" (READ-REPO, `ScribePhotoModule.swift`, `reencode`). The date read must keep that discipline, and the order matters: after the strip nothing is left to read.
- **Change (a row to add as NEW-3b, test layer L0, L1, L5):**
  1. One native function, in `scribe-photo`, reads the picked original in `Caches/ImagePicker` before `reencodeUpright` and returns a local calendar day string `YYYY-MM-DD` or null. No time, no zone, no `Date`, no raw tag.
  2. The only property keys read are a named allow-list in the Swift source: the Exif original-date key, the Exif offset-time key, the TIFF date key, and for video the container's creation date. No GPS key, no location key, no `CLLocation`, no maker note, no caption, no file name.
  3. A source-scan test (the pattern of `native-guards.test.ts`, READ-REPO) fails on any `kCGImagePropertyGPS` constant, any `CLLocation`, and on a call that copies a whole property dictionary into anything returned or logged.
  4. A fixture test with a synthetic Asha picture that has a canary GPS value and a known date: the function returns the date and a string search of every returned value and every log finds no part of the canary.
  5. No fallback to a file timestamp, the item provider's suggested name or the copy time (see EXH-DAT-1).
  6. The order is stated in the row: read, then strip, in one native step or two steps that share one temp file, never after the strip and never in JavaScript.
- **Evidence:** READ-REPO: `ScribePhotoModule.swift` (re-encode passes no source property; `kCGImageMetadataShouldExcludeGPS`), `MEDIA_THREAT_MODEL.md` rows M2, P2, P4. READ-APPLE: Apple lists `PHPickerMetadataOptions.removeLocation` ("Remove location metadata") as iOS 27.0 and later, which our floor of iOS 17.0 (DELTA, `app.config.ts` line 44, not re-read) cannot rely on (see EXH-SEC-9). UNVERIFIED: that every picked file carries GPS under every access state; the delta says the same.
- **Residual risk after the change:** the original with GPS sits in `Caches/ImagePicker` for as long as the strip takes, as it does today. Native memory holds one date string.

### EXH-SEC-7 MAJOR: the door under F1 alone is outside every gate the PRD wrote for the device

- **Requirements:** R169, R170, R171, R222, G11 (a), delta section 4 (G11 CHANGE) and section 6 ("can ship even if every library gate fails"), Q5.
- **Finding:** Q5 asks whether the door under F1 alone changes G11. Yes, in where it is anchored, not in how much risk it carries. G11 (a) as it stands is "lockfile and prebuild diff, binary and plist scan (usage string only in allow-listed profiles; no `CLGeocoder`, `performChanges` and the rest of the list), source read of `scribe-library`", and R222 makes the guard script fail the production profile "when F2 is on and `docs/release/<x.y.z>.md` lacks a dated line" for each gate (READ-REPO, PRD lines 1007, 1137, 912). All of that is triggered by F2. The door ships with F1 and a failed F2 gate is, by design, the case where the tab ships with the door and no library. So in the scenario the delta values most, the new native code in `scribe-photo` (multi-select, video, an inline host) ships under a gate that never ran. Today `scribe-photo` is also not under `NATIVE_MODULE_GATE.md`, which applies to packages, and local modules follow the `expo-native-module` skill instead (READ-REPO). That skill asks for source-scan tests, the iOS compile job and a `security-architect` read requested in the PR body; it does not require a dated read-out.
- **Change:**
  1. Split G11 (a) into G11a-lib (F2, as written) and G11a-photo (F1, before the door's first store build): source read of the `scribe-photo` change, the scan list of EXH-SEC-2 for that module, plist, entitlements and privacy manifest diffs (expected: no change, no usage string, no background mode, no location entitlement), and device rows for EXH-SEC-6.
  2. R222's guard script also fails the production profile when the door is on and the G11a-photo line is missing. Same pattern, a different flag.
  3. The repo-side guard from the CISO skill applies to both: one PR may not edit a flag allow-list or its test together with the file they guard, unless it carries the founder's recorded decision id.
  4. R170 (kill switches): K2 `photoMoments` hides the library read and not the door (DELTA). The existing photos switch (R106) then governs the door. Add to R106's description that turning it off also empties `Caches/ImagePicker`, so a kill for a picker bug leaves no located originals behind.
- **Evidence:** READ-REPO: PRD G11 row, R222, R171; `.claude/skills/expo-native-module/SKILL.md` sections 3 to 5; delta sections 4 and 6.
- **Residual risk after the change:** the door still has no security read of the inside of Apple's view. That is Apple's.

### EXH-SEC-2 MAJOR: NEW-5 would put the photo library and an asset identifier into the build that needs neither

- **Requirements:** NEW-5, R70, R93, R169, G11 (a) scan ("no `PHPhotoLibrary`" family), my earlier EX-SEC-7.
- **Finding:** NEW-5 lets the picker "use the library configuration only to receive an identifier that the same attach pipeline resolves" when access exists. READ-APPLE: `PHPickerConfiguration` has an `init(photoLibrary: PHPhotoLibrary)`, and `preselectedAssetIdentifiers` "works only when initializing a `PHPickerConfiguration` object with a photo library. Otherwise, the system returns an error". So the library-configured path is the one that brings a `PHPhotoLibrary` object and an asset identifier into `scribe-photo`. Today the module's header says no photo library, no permission, and uses `PHPickerConfiguration()` (READ-REPO). Three costs: the binary scan for the F1-only build can no longer say "no `PHPhotoLibrary`"; R70's "presenting the picker never calls the authorization request" loses its easy source scan; and an identifier now exists for a moment on the picker path, which R93 and R247 say the product avoids. The benefit is small: a pick outside the Limited set still works with the plain configuration (forum thread, DELTA; UNVERIFIED by me).
- **Change:** one configuration only, `PHPickerConfiguration()`. Delete the library branch from NEW-5. Never read `assetIdentifier`. Source scan on `scribe-photo` fails on `PHPhotoLibrary`, `photoLibrary:`, `assetIdentifier`, `preselectedAssetIdentifiers`, `requestAuthorization` and `authorizationStatus`. The attach pipeline for a picked item then has one input, a file in `Caches/ImagePicker`; the library module (`scribe-library`) keeps its own path for library assets, and R88's "one `AttachRequest`" holds with two producers, not three.
- **Evidence:** READ-APPLE: `PHPickerConfiguration` page and the `preselectedAssetIdentifiers` page. READ-REPO: `ScribePhotoModule.swift` `presentPicker`. DELTA: NEW-5 text.
- **Residual risk after the change:** none for the door.

### EXH-SEC-1 MAJOR: the host must be custom Swift in `scribe-photo`; no package, including `@expo/ui`

- **Requirements:** R88 ("no third-party picker, decoder, editor or media package"), NEW-3, NEW-4, my EX-SEC-1, `expo-native-module` skill section 4.
- **Finding:** The question was native module, `@expo/ui` or custom Swift.
  - `@expo/ui` is already a dependency at `~57.0.21` (a range, MIT), used only for `Host` and `Toggle` in `toggle.ios.tsx` (READ-REPO: `package.json`, `licences.json`, `toggle.ios.tsx`). It is not a row in the `NATIVE_MODULE_GATE.md` ledger, which holds `expo-audio` and `whisper.rn` (READ-REPO). READ-EXPO (summary only): the SwiftUI component list lists `ColorPicker`, `DatePicker` and `Picker`, and no photo picker. I did not check whether SDK 57's version of the library differs, and that page documents a newer SDK, so I cannot say what 57.0.21 ships. UNVERIFIED for the installed version; the check is `grep -ril photospicker node_modules/@expo/ui` on the branch.
  - A package wrapper such as `expo-image-picker` is ruled out already: the `expo-native-module` skill says one photo "comes from `PHPickerViewController` presented by `scribe-photo`, never from `expo-image-picker`" and records that #833's reviews found its permission calls (READ-REPO). R88 says the same for any third-party picker.
  - The module already embeds the picker the way the delta needs: `PickerHost` adds `PHPickerViewController` as its only child and answers a cancel on `viewDidDisappear` (READ-REPO). The inline host is an extension of that class, so the new attack surface is a change in configuration (`selectionLimit`, `selection`, `filter`, `disabledCapabilities`) and a result list instead of one provider, not a new dependency.
- **Change:** build the host as custom Swift inside `scribe-photo`, extending `PickerHost`. State in NEW-3 that no package is added and that `@expo/ui` is not used for the picker. If the paper chrome of the host sheet wants an `@expo/ui` sheet, that is a separate change with a ledger row first (exact pin, a plugin-output line, a source read for permission calls); the swap note in `sheet.tsx` (READ-REPO) is where that idea lives today. Extend the scan list: the function names declared in Swift equal the ones typed in `index.ts` (skill section 3).
- **Evidence:** READ-REPO: `apps/mobile/package.json` lines 6 and following, `modules/scribe-photo/index.ts`, `.claude/skills/expo-native-module/SKILL.md`, `docs/security/NATIVE_MODULE_GATE.md` ledger. READ-EXPO as above.
- **Residual risk after the change:** one module of ours, written to the skill, is the surface. Its bugs are ours.

### EXH-SEC-4 MAJOR: video is a new untrusted-parser path and today there is no video code at all

- **Requirements:** R89, R90 (6 pictures, 2 videos), R91 (60 seconds), R88, NEW-3 ("pictures and videos"), `MEDIA_THREAT_MODEL.md` P4.
- **Finding:** READ-REPO: `ScribePhotoModule.swift` on `develop` has no video handling (a search for "video" finds nothing). Its decoder defence for pictures is a type allow-list (JPEG, HEIC, HEIF, PNG), a 150 million pixel cap read before decode, and a serial queue. Video has none of that written. R89 refers to "the NS-52 video pipeline"; I did not find it on `develop` and did not search further, so its state is UNVERIFIED. The delta sizes PR 18b at 350 to 400 lines including a video path. A first video path in an agent-written native module is the largest new parser exposure in the hybrid: a crafted container, a long or huge file, an iCloud download of a large original, and QuickTime location atoms that must be stripped (R89 names them).
- **Change:** make the first 18b picture-only multi-select (the shape the module already has, times N). Put video in its own PR after G1a answers the iCloud and size unknowns, with: a type allow-list of container types, the 60-second and byte caps read from metadata before any copy, no re-encode editor of our own (system export only, R88), and a fixture check that a synthetic Asha video with a canary location atom comes out with none. How the system export drops location atoms is UNVERIFIED; it is a G1a row (add to the delta's list (a) to (g) as (h)). Until then the door's limit line says pictures and the PR count in the delta goes from 27 to 28. If the founder wants video on day one, that is a product choice; I would not call it free.
- **Evidence:** READ-REPO as above; PRD R89, R90, R91 (lines 495 to 497). UNVERIFIED: the state of NS-52, how the export strips atoms.
- **Residual risk after the change:** the picture-only door adds no parser the module does not already run.

### EXH-SEC-5 MAJOR: multi-select needs a written native contract, not a loop around `pickOne`

- **Requirements:** NEW-3, R86, R90, NEW-7, NS-01-R17a and R17b.
- **Finding:** Today `pickOne` takes one destination name from JavaScript, validates it against a plain-name regex inside `Caches/ImagePicker`, and copies one provider's file before its handler returns (READ-REPO). The header says "the copy that follows a pick is not covered, so two copies can run at once, each to its own name" (READ-REPO, `index.ts`). With up to eight items that becomes up to eight concurrent copies, any of which can be a large iCloud download. The READINESS table lists "scribe-photo progress event and native Cancel (NS-01-R17b)" as "not written" (READ-REPO, `READINESS-20nov.md` row P-1). Nothing in the delta says how the module answers a partial success.
- **Change (a short row, test layer L0, L1, L5):**
  1. JavaScript supplies N plain names, one per allowed slot; the native side validates each with the same `fileIn` rule and refuses a count above the limit even if the picker's `selectionLimit` was set (the limit is enforced twice).
  2. Concurrency bounded (a small fixed number of copies at once, value set by G1b).
  3. Each item succeeds or fails alone, with the existing closed codes plus new closed codes (for example `photo_limit`). Never a path, a file name, `suggestedName`, a type identifier or a system message crosses the bridge.
  4. A cancel, a back-out, a sheet that goes away or a lock event removes every partial copy in the folder (extends R86 and NEW-7), and the launch sweep stays as the backstop.
  5. iCloud progress and a native Cancel (R17b) become a precondition for multi-select, not an extra.
- **Evidence:** READ-REPO: `ScribePhotoModule.swift`, `index.ts`, `READINESS-20nov.md` row P-1. UNVERIFIED: how the system behaves when eight providers download at once.
- **Residual risk after the change:** a slow download costs the parent time, not data.

### EXH-SEC-6 MAJOR: the host sheet has rules the delta does not state (opacity, lock, inactive, links, snapshot)

- **Requirements:** NEW-4 ("the sheet cannot be open under App lock or inactive"), R102, R139, R183, G7 picker rows, my EX-SEC-6.
- **Finding:** NEW-4 names the lock rule and no mechanism. Four things need a row:
  1. READ-APPLE: in iOS 17 and later the picker "ignores touch events while its opacity is anything other than fully opaque". A host sheet that fades in, or any ancestor with an alpha animation, can leave a picker that looks ready and does nothing. This is also a test trap: no scripted flow reaches inside Apple's view (DELTA, my inference).
  2. App lock engaging, the scene going inactive or to the background, or Face ID failing while the sheet is open must dismiss the sheet and delete partial copies. The existing `PickerHost` answers a cancel when the sheet disappears (READ-REPO), so the mechanism exists; the row must say which events call it and a device row proves it.
  3. Whether Apple's out-of-process picker content appears in the app switcher snapshot is UNVERIFIED. R102 covers our own views with opaque boxes; it cannot cover Apple's. G7 gets a row: open the picker, go to the switcher, read what the snapshot shows.
  4. The door opens only from a parent's tap in the app. A link (`scribe://moments`, R139) lands on the tab and never opens the sheet, because a link can be sent by another app.
- **Change:** add NEW-4b with the four rules, each with its test layer (L2 for the sheet, a device row for 2 and 3, an L1 scan that no route parameter or notification payload can present the host).
- **Evidence:** READ-APPLE: `PHPickerViewController` page; READ-REPO: `PickerHost`, PRD R139 and R102 as quoted in my earlier review.
- **Residual risk after the change:** whatever Apple's view shows to someone holding an unlocked phone, which is what the Photos app shows too.

### EXH-SEC-8 MINOR: the PR 18b design is too big for one PR, and two statements in the delta disagree

- **Requirements:** delta section 6 (18b, about 350 to 400 lines, "needs no library read and no founder decision, so it can start in wave A or B"), NEW-8 ("G1a answers the picker unknowns before NEW-3 merges"), CODE-R02, `stacked-prs` skill, `expo-native-module` skill.
- **Finding:** CODE-R02 is at most 400 lines and 20 files, not counting fixtures (READ-REPO, `docs/engineering/01-code-and-change.md` line 31). The delta's 350 to 400 is its own estimate, labelled ASSUMED, and it counts the native host, the multi-select, the date read and the video together; with the scan tests and a Swift file it will pass 400. Second, the delta says 18b can start in wave A or B and also says NEW-8 holds the merge of NEW-3 until G1a answers. Both can be true only if 18b is more than one PR.
- **Change:** split along the findings above and say which part waits for G1a.

| Part | Content | Waits for G1a? | Size (ASSUMED, mine) |
|---|---|---|---|
| 18b-1 | Multi-select of pictures, native contract of EXH-SEC-5, sweep, scans of EXH-SEC-2 | No | about 250 |
| 18b-2 | Date read, EXH-SEC-3 | No (fixture only) | about 120 |
| 18b-3 | Inline host sheet, EXH-SEC-6 | Yes, items (a) and (e) to (g) | about 150 |
| 18c | Video, EXH-SEC-4 | Yes | its own estimate |

  Native Swift written by agent sessions is T2 with two lens reviews by the CISO skill's own rule, the `expo-native-module` skill, a source scan that fails when the guard is removed, a green `ios-compile` job at the head, and a `security-architect` read requested in the PR body (READ-REPO, skill section 5). Every part names the device rows still owed.
- **Residual risk:** none; this is sequencing.

### EXH-SEC-9 MINOR: Apple's `removeLocation` option is a defence in depth, available only on iOS 27 and later

- **Requirements:** R89, NS-01-R17, P2.
- **Finding:** READ-APPLE: `PHPickerConfiguration.metadataOptions` and `PHPickerMetadataOptions.removeLocation` ("Remove location metadata") are listed for iOS 27.0 and later. Our floor is iOS 17.0 (DELTA). On a phone that has it, setting `removeLocation` would make the picked original arrive without GPS, which shrinks the P2 exposure (the located original in `Caches`) without touching our strip. I did not read what else the option affects, or whether it touches the capture date; UNVERIFIED.
- **Change:** optional, behind an availability check in the module, and never a replacement for the strip or for the allow-list of EXH-SEC-3. Add to G1a as item (i): with the option on, does the date still arrive? If yes, ship it; if no, leave it out.
- **Residual risk:** none added.

### EXH-SEC-10 MINOR: the media threat model is stale on one row and has no rows for the picker path

- **Requirements:** SEC-R01 (a row per new surface), `MEDIA_THREAT_MODEL.md` P2, P4, P15, my EX-SEC-12.
- **Finding:** READ-REPO: P2 says the launch call to `sweep()` is "not on develop". It is: `sweep.ts` line 69 calls `sweepPhotosAtLaunch`, which calls `sweepPhotos` and then the picked-file sweep (READ-REPO, `capture/sweep.ts`, `photos/device.ts`, `photos/housekeeping.ts`). The row should say so. P2 also grows: up to eight located originals can sit in `Caches/ImagePicker` at once, and videos are large.
- **Change:** update P2; add rows for the multi-select picker (A3, A8), the host sheet (A3, App lock), the date read (A3, A4), each with its control type (test, setting read back, prose) as the skill asks. G11a-photo runs them.
- **Residual risk:** none.

### EXH-DAT-1 MAJOR: the picked date needs a stated meaning, a source rule and a failure rule

- **Requirements:** R95, R93, NEW-3, Q3, `DATA_CLASSIFICATION.md` (L4 content, L2 plus timestamp can become L4).
- **Decision the data serves:** the parent sees a date they may apply to the letter. No decision, no data; the decision is the parent's, and only on a tap.
- **Finding:** Three ways a wrong or leaky date can happen.
  1. A picked file copied by the item provider has a fresh file date: the day of the copy. If any code falls back to the file's own timestamp, the chip will say today for any picture without a capture date (a screenshot, a picture saved from a message). A false date offered as a fact beside a child's picture is worse than none. (Also, a file timestamp API is a required-reason API in the privacy manifest; UNVERIFIED, I did not read the manifest rules.)
  2. The capture date in a picture is a local time without a zone unless an offset tag exists. The library path gives a creation date plus a UTC offset in seconds (PRD R220, DELTA). The two paths can disagree on the day for a picture taken near midnight or abroad. The row should say the picked path's day is the day on the clock of the place where it was taken as recorded in the file, and that it can differ from the library path by a day.
  3. R93 says the kept letter holds no "original creation time" unless the parent chose it. Applying the chip makes the parent's choice the letter date. Nothing may store that the date came from a picture (no `date_source`, no flag).
- **Change:** NEW-3b states: the value is a day, never a time; no fallback to any filesystem or provider date; a missing or unparseable date returns null and shows no chip; the chip is not preselected (R95 stands); applying it writes the existing letter date field and no provenance; a test with a picture that has no date proves the chip is absent. Level: the day is L4 while it is in the entry (a date of a child's life), L4 in memory, never in a log or analytics (R167).
- **Evidence:** READ-REPO: PRD R93, R95, R220 as quoted; `ScribePhotoModule.swift` (copy via `loadFileRepresentation`). READ-APPLE: none (the Exif tag names are Apple ImageIO's and I did not fetch them; UNVERIFIED).
- **Blind spot that remains:** we will not know how often the chip is right.

### EXH-DAT-2 MAJOR: no new event is needed, and three small rules keep it that way

- **Requirements:** R167, R251, D-163, EX-CDO-1, EX-CDO-2, EX-CDO-4, PRD line 873 (`system.error.raised`, `code: picker_unavailable`).
- **Finding:** I looked for a new event, identifier or stored field in the delta. There is none: no event for a picker open, cancel or pick (delta section 8 and R167 KEEP), no server column, no sync field, no moment record for a picked picture (R87 KEEP). I accept that. Under D-163 page views and clicks are collected for every user, so three places need a rule, or an event will appear by default when someone adds the host sheet:
  1. The host sheet and the door are new screens and elements. If they get registry ids, the same id and the same properties must fire in every access state. A sheet-viewed event that fires only in ACC-0 to ACC-3 reveals access state by presence, which is the omission leak of EX-CDO-4. Better: register no screen event for the host sheet at all; accept the blind spot that door use cannot be measured.
  2. No attach or photo event may carry a `source` that tells a picked picture from a library picture. R251 already bars `source` on attach events (PRD, as quoted in my earlier cdo review); say in the picker row that the picker path is included.
  3. New failure codes for multi-select (EXH-SEC-5) are local closed codes, like `library_unreadable` and `fallback_used` already are (PRD line 873). The one analytics code, `picker_unavailable`, stays the only picker code on the wire and carries no count, no type and no state.
- **Change:** add one line to R167: "the picker door, the host sheet and a pick produce no analytics event; the existing failure code is the only one".
- **Evidence:** READ-REPO: PRD lines 873, 879, 1166; `cdo.md` EX-CDO-1, 2, 4.
- **Blind spot that remains:** we cannot measure whether the door is used. That is the price of keeping Apple's private browsing private.

### EXH-DAT-3 MAJOR: the picker's temporary originals are the one new store, and they have no classification row or retention rule

- **Requirements:** NEW-7, R86, R115, G11 (c), `DATA_CLASSIFICATION.md` 4.6, DQ rule "a retention period written in a doc with no code that enforces it" (CDO skill, anti-patterns).
- **Finding:** The delta says the data inventory "loses the album and picture id rows" (G11c). The inventory also gains something. A multi-select puts up to eight original files, with GPS, device and capture metadata, in `Caches/ImagePicker` until the re-encode removes them or the launch sweep does (READ-REPO: `MEDIA_THREAT_MODEL.md` M2, P2). That is a picture of a child with a location: L4. Today it is one file for seconds; the hybrid makes it a batch for as long as a parent takes in Review. NEW-7 adds removal on back-out and Erase, which is the right clock, and no row names the level, the maximum lifetime or the test.
- **Change:** a `DATA_CLASSIFICATION.md` 4.6 row in the same PR as 18b-1: field "picked original (temporary)", level L4, store `Caches/ImagePicker` outside `scribe.db`, not in iPhone backup (READ-REPO threat model sources this to Apple's File System Basics; I did not re-read it, UNVERIFIED), retention "until the stored copy is written or the parent backs out, and never past the next launch", deletion paths (Keep, back-out, lock event, Erase, launch sweep), deletion test per path (the NEW-7 tests). The data map row, once the data map lands (it does not exist on `develop` per my earlier cdo review; not re-checked today).
- **Residual risk:** a killed app leaves originals until the next launch. Stated, not hidden.

### EXH-DAT-4 MINOR: the delta overstates what Q2 dissolves, and the picker must not feed the engine

- **Requirements:** delta section 7 (EX-CDO-9, EX-PRV-6, EX-ENG-6 "dissolved or narrowed"), R247, 17.1, NEW-1, R87.
- **Finding:** (a) At the PRD head, R247 already stores no picture and no album identifier and 17.1 already says "Not in the file: a picture identifier, an album identifier, a coordinate, a count, a score, a thumbnail" (READ-REPO). So `moments.json` does not change with the hybrid, and the delta's "the decisions store loses the album id and picture id members" (section 3, R162 to R166 and R221 rows; PR 8 about 50 lines smaller) describes a draft that the PRD had already moved past. The fair statement is that the hybrid makes the default permanent and removes two constants. The PR 8 line saving is real only against the pre-review draft. (b) NEW-1 says a picked picture is never grouped, ranked or labelled. Add the converse: nothing about a pick feeds the engine either. A day the parent picked from must not set "Not now", mark the day kept, suppress a For you card, or write a day key, because any of those makes a pick a signal about the library.
- **Change:** correct the delta's wording in section 7 and the PR 8 estimate; add the converse to NEW-1.
- **Residual risk:** none.

### EXH-DAT-5 MINOR: the data-minimisation scoreboard, so the hybrid's gain is stated plainly

| Item | Library read (F2) | Picker door (F1) |
|---|---|---|
| Permission and purpose string | Yes (usage string) | None |
| What we read | Window of dates, places, types, thumbnails | Only the items the parent selected |
| Identifier at rest | None stored (R247) | None, and none in memory if EXH-SEC-2 is taken |
| Coordinates | Natively resolved to a place id (EX-SEC-4) | Never read (EXH-SEC-3) |
| Date | Day keys | One optional day per picked item, a chip |
| Album, search, browse history | Not read | Not visible to us |
| New server data, event or stored field | None | None |
| New temporary data | Thumbnails in memory | Located originals in Caches until the strip (EXH-DAT-3) |

The door is the smaller data footprint of the two on every row except the last, which is why it should ship even if the library does not.

## What I did not check

- No Apple documentation beyond the `PHPickerViewController`, `PHPickerConfiguration`, `preselectedAssetIdentifiers`, `metadataOptions`, `PHPickerMetadataOptions`, `containerIdentifier` and `photosPickerStyle` pages was read. I could not fetch the `PHPickerResult` page. The WWDC23 session, the App Review Guidelines and the Developer Program License Agreement were not read.
- `containerIdentifier` on `PHPickerConfiguration` is listed by Apple as iOS 27.3 and later and means "the collection of items that can be shown" (READ-APPLE). The delta says it found no way to limit the picker to an album and marks that UNVERIFIED. This page suggests a way on newest systems only. It does not change a finding here, and it is not usable at our floor. Product may want to know; it bears on the delta's G1a item (d).
- No code was written or run. `scribe-library` does not exist on either branch; every statement about it is about the PRD.
- I did not verify `@expo/ui` 57.0.21's contents (EXH-SEC-1), the state of NS-52, how the system video export treats location atoms, or whether Apple's picker appears in an app switcher snapshot.
- The App Review text (5.1.1(iii) and the rest) is outside this review; the delta's R80 argument is for the CCO and counsel.
- The R-17 shared security review: not re-read; the CISO skill says it had not passed when last read (31 Oct). UNVERIFIED for today.

## New items for G1a (to add to the delta's list (a) to (g))

(h) How the system video export treats QuickTime location atoms. (i) With `removeLocation` on iOS 27 and later, does the capture date still arrive, and on which phones does the option exist? (j) Does Apple's out-of-process picker content appear in the app switcher snapshot? (k) Eight concurrent iCloud downloads: memory, time, cancel.

Signed: CISO (Claude role, not an auditor) and Chief Data Officer (Claude role)
