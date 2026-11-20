# Library decisions A: motion, lists, pictures, video (LD-01 to LD-15)

Part of RD-F (mobile, 20 Nov 2026). Index and summary: `LIBRARY-DECISIONS.md`. What we already have: `ALREADY-HAVE.md`. How to propose a new package: `ADOPTION-RULES.md`. Paper evaluation: nothing was installed and no `package.json` changed.

Tags: [V] checked this session (command, file:line or sha), [E] estimate with its basis, [U] not checked. Registry facts come from `npm view <pkg> version license time` run on 20 Nov 2026 through the sandbox proxy. Weekly downloads could not be read (the downloads API did not answer from the sandbox), so every "downloads" signal is [U] and the maintenance signal used is release cadence. "mod" is the registry's `time.modified`, which can be later than the release.
Expo note [V]: the registry `latest` of every `expo-*` package below is SDK 58 (58.0.x). Our app is on SDK 57 (`expo ~57.0.26`, `apps/mobile/package.json`). The SDK 57 pin is the newest `57.x` (named per record); install only with `flock /tmp/scribe-npm.lock npx expo install <pkg>`, which picks it. An SDK 58 move is not part of this paper (founder and Karma, section F4 of the index).
Decisions: USE (already present), ADOPT (new), OWN CODE, AVOID. Owner: K = Karma, T1 reversible technical; K-T2 = Karma ruling needed first (a native dependency in every build, CR-65 logic); F/C = founder or counsel.

## LD-01 Motion and animation: USE
- **Packages [V].** `react-native-reanimated 4.5.1` and `react-native-worklets 0.10.1` and `react-native-gesture-handler ~2.32.0` (all in `apps/mobile/package.json`). Registry: reanimated latest 4.8.0, MIT, mod 2026-11-19; the SDK pin decides, not latest.
- **Fit.** New Architecture only (Reanimated 4 is). Already linked, so no new binary, no new plist key, no network, no telemetry.
- **Covers.** Layout transitions (`entering`, `exiting`, `layout` props), shared values, gesture-driven motion (`Gesture.Pan` plus `useAnimatedStyle`), reduced motion (`ReducedMotion` config; `useReducedMotion` wrapper at `apps/mobile/src/lib/motion.ts:62`). In-house motion pieces already built on it: `apps/mobile/src/components/motion/` (breathe, card-transition, draw-on, excerpt-fade, page-turn, press) [V].
- **Replaces / saved.** A custom animation engine and gesture layer. [E] weeks, not days: page-turn and card-transition alone are several hundred lines on top of the library.
- **Size.** Reanimated is 0.76 MB of minified JS, 7% (`docs/ops/APP_SIZE.md` section 3, 3 Oct snapshot) [V].
- **Risk.** Worklets and Reanimated versions must move together; do not bump by hand.
- **Decision and way back.** USE. Motion specs are `design-systems` and `docs/design/MOTION.md`; mobile writes no animation helper that the library provides. Way back: none needed. Owner: K.

## LD-02 Sheets: USE
- `@gorhom/bottom-sheet ^5.2.14` [V], MIT, mod 2026-05-09 (registry), runs on Reanimated and Gesture Handler. ADR 0101 item 4 first said Expo Router `formSheet`, then was amended 3 Oct to gorhom behind `ui/sheet.tsx` (`docs/adr/0101-ui-component-library.md:36-40` [V]).
- Size 0.16 MB JS (`APP_SIZE.md` section 3) [V]. No privacy surface.
- Saved: a hand-rolled sheet with snap points, keyboard handling and gesture interplay [E] 1 to 2 weeks.
- Risk: last registry change is six months old [V]; still inside the 12-month rule (`docs/engineering/06-security-engineering.md:105`). Re-check at each SDK bump.
- Decision: USE; never import it outside `components/ui/sheet.tsx` (design-systems owns that folder). Owner: K.

## LD-03 Skia, Lottie, Rive: AVOID
- `@shopify/react-native-skia 2.14.0` (MIT), `lottie-react-native 7.5.1` (Apache-2.0), registry [V]. ADR 0101 item 5: "No SF Symbols, Lottie or Rive in v1" (`docs/adr/0101-ui-component-library.md:40` [V]).
- Why: each adds a large native engine for effects Reanimated plus `react-native-svg 15.15.4` (installed) already draw (`line-art.tsx`, `draw-on.tsx`). Binary size [U] (needs an EAS build to measure); the 40 MB download budget is founder decision 15 (`APP_SIZE.md:3` [V]).
- Way back: propose under `ADOPTION-RULES.md` with a measured need. Owner: K.

## LD-04 Long lists (1,000 letters, 300 pictures): USE SectionList and FlatList; defer FlashList
- **Today [V].** The Book is `SectionList` wrapped with `Animated.createAnimatedComponent` (`apps/mobile/src/app/(tabs)/book.tsx:23,78`). The mobile design's rule: keep `SectionList` until a 60-letter chapter misses p95 500 ms, then FlashList (`docs/tdd/01-mobile-client.md:355` [V]). The foundations design keeps `SectionList` for month openers as section headers (Conflict E3, `docs/tdd/new-scope/11-foundations.md:238` [V]).
- **Candidate.** `@shopify/flash-list 2.3.3`, MIT, released 2026-10-01 (mod 2026-11-18), peers `react`, `react-native`, `@babel/runtime` only [V]. v2 targets the New Architecture [E: from its docs, not read here]. About 0.85 MB unpacked on npm [V]; JS bundle share [U].
- **Gap in our docs.** ADR 0101:40 lists FlashList as a "companion", but it is not a dependency and the TDD says wait for a miss [V]. Two documents disagree; the TDD wins because it has a trigger (Conflict for `design-systems` and Karma, not for product).
- **Plan for the 300-picture grid.** `FlatList` with `numColumns`, fixed `getItemLayout`, `windowSize` tuned, `removeClippedSubviews` on iOS, and the 40-row window of 512 px copies the foundations design assumes is about 32 MB decoded (`11-foundations.md:244` text "Assumption: a 40-row window of 512 px copies is about 32 MB decoded" [V]). Measure on iPhone SE 3 (device check, `human`).
- **Trigger to adopt FlashList.** A measured miss: 1,000-letter Book scroll drops under the frame budget in the RD-E harness, or the 300-picture grid shows blank cells on SE 3. Then a PR under `ADOPTION-RULES.md` with the trace.
- Way back: FlashList keeps the FlatList prop names for most props, so reverting is a one-file change per list [E]. Owner: K.

## LD-05 Drag to reorder pictures and videos (NS-52-R14): OWN CODE first, adopt only after a spike
- Card rule: reorder by drag and by "Move earlier / Move later" controls (NS-52-R14, `docs/product/prd/27-photo-moments-and-media.md` row at line 354 on branch `docs/locked-pack-inputs-20nov` [V]). At most 6 pictures and 2 videos per letter (NS-52-R1, same file line 341 [V]), so the list has 8 items at most.
- **Own code.** The two buttons are plain and carry the accessibility floor; do them first. Drag on 8 tiles is a `Gesture.Pan` plus a Reanimated layout transition [E] 150 lines.
- **Candidates [V registry].** `react-native-reorderable-list 0.18.3` (MIT, 2026-11-01, peers Reanimated >=3.12 and Gesture Handler >=2.12, no dependencies); `react-native-sortables 1.10.1` (MIT, 2026-09-26, same peers, no dependencies); `react-native-draggable-flatlist 4.0.3` (MIT, last release 2025-05-06, older than 12 months: fails the 06:105 rule).
- Decision: OWN CODE for the buttons now; ADOPT-LATER candidate `react-native-sortables` or `react-native-reorderable-list` only if the own drag fails the VoiceOver and Reduce Motion checks. AVOID `react-native-draggable-flatlist`. Owner: K.

## LD-06 Image decode, cache, thumbnails: OWN CODE (in-house derivatives) with RN `Image`; expo-image is the named fallback
- **What exists [V].** The foundations design makes the 88 pt and 512 px copies natively inside `scribe-photo` (`11-foundations.md:246-250`: "native `makeCopy` and `derivatives.logic.ts`"; Risk line 250: "If decode still misses R7, `expo-image` is the fallback, as a new dependency with its own review"). `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift` already re-encodes upright JPEG with no metadata (`reencodeUpright`, line 77 [V]).
- **expo-image [V].** Not installed (62 dependencies, none named `expo-image`). SDK pin `57.0.5`, released 2026-09-11, MIT, one dependency (`sf-symbols-typescript`, types), peers `expo`, `react`, `react-native`, `react-native-web`; registry unpacked size 138 MB (includes prebuilt binaries; shipped binary delta [U]). Wraps SDWebImage and libwebp [E: from its README, not read here]. It can fetch network URLs, which our rule never needs: every picture is a local file URI. Privacy-manifest keys it adds [U].
- **Why own.** Copies are L4, carry no metadata, are excluded from backup and never leave the phone (`11-foundations.md:242`). A cache we do not own is a second place a picture can sit. ImageIO `CGImageSourceCreateThumbnailAtIndex` is a platform call (ALREADY-HAVE) that decodes at target size, so the cost is a few dozen Swift lines [E].
- **Saved by adopting expo-image instead.** Memory and disk cache, blurhash, transitions: [E] 3 to 5 days, none of which we need for local files.
- Decision: OWN CODE. Trigger for ADOPT: the J-N13 SE 3 check misses its decode target (R7). Way back: the adapter is `lib/photos/*`, so swapping the loader is one file. Owner: K-T2 if adopted (native dependency).

## LD-07 Picking one photo: OWN CODE (done); AVOID expo-image-picker
- Ruled: CR-65 (`docs/agents/cto/RULINGS.md:621-629` [V]): `PHPickerViewController` from `scribe-photo`, no photo library, images only, one item; picker packages stay out of the lockfile, enforced by `photos-device.test.ts` (scan test referenced at RULINGS.md:629 [V]).
- Evidence: the package calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` and links into every build (CR-65 Why [V]).
- Decision: AVOID `expo-image-picker` (SDK 57 pin 57.0.20 per CR-65). Way back is the founder decision CR-65 names. Owner: K (ruled).

## LD-08 Picking several pictures and videos (NS-52-R2): OWN CODE, extend scribe-photo
- Card rule: system picker, multi-select, photos and videos, "no third-party picker package" (NS-52-R2, `27-photo-moments-and-media.md:342` [V]); no camera control.
- How: `PHPickerConfiguration` with `selectionLimit` and `filter: .any(of: [.images, .videos])`. Today's module sets one item and images only (`ScribePhotoModule.swift:135-139` [V]). The card marks "UNVERIFIED that the picker supports a limit per type" (NS-52-R1). Engineering reading [E]: `selectionLimit` is one number for the whole pick, so the per-type limit (6 and 2) is checked after the pick against the one constants file; the sheet cannot stop a third video. Tell `product`: the "one calm line" copy is needed for an over-limit pick, not a blocked tap.
- Saved: nothing to adopt; the library alternatives all need photo permission (LD-07). Owner: K.

## LD-09 Photo moments from the library (NS-51): OWN CODE (PhotoKit, dates only); AVOID expo-media-library
- Card rule: read only each picture's creation date and a system identifier, never location, file name, album name, face, scene (NS-51-R5, `27-photo-moments-and-media.md:138` [V]); no photo-library usage string unless the flag is on (NS-51-R2, line 135 [V]); limited and full access both work and are never re-asked (NS-51-R3, line 136 [V]).
- `expo-media-library 57.0.6` (released 2026-11-05, MIT, peers `expo`, `react-native` [V]). It exposes asset location and EXIF on its read calls and ships its permission calls in every build; the earlier ADR draft proposed it only inside `src/lib/memory-library/` (`docs/adr/DRAFT-memory-library-architecture-10nov.md:185` [V]), which CR-65 supersedes for the picker.
- Why own: `PHAsset.creationDate` and `PHPhotoLibrary.authorizationStatus(for: .readWrite)` are a short Swift file in `scribe-photo`, the label and the usage string can then be gated by one flag (`NS-51-R2`) and the label guard sees one place (G11-3, `scripts/release/label-effect.mjs:10,130` [V]).
- Saved by the library: [E] 2 days of Swift; not worth the surface.
- Needs counsel: the usage string, Apple's limited-library prompt key (card says key name UNVERIFIED, NS-51-R4) and the label line (Q54).
- Decision: OWN CODE, behind flag, after counsel reads. AVOID the package. Owner: K for code; F/C for string and label.

## LD-10 Video playback (NS-52-R13): ADOPT expo-video
- **Package.** `expo-video 57.0.5`, released 2026-09-24, MIT, peers `expo`, `react`, `react-native`, no dependencies [V registry]. Registry `latest` 58.0.14 (2026-11-11). Plays through AVPlayer [E: Expo docs, not read here].
- **Card rule.** Poster frame with 44 pt play control; plays only on tap; never autoplay or loop; sound only after the tap; honours the silent switch; pause on inactive and on App lock; release keep-awake at once (NS-52-R13, `27-photo-moments-and-media.md:353` [V]).
- **Replaces / saved.** A native view with transport controls, VoiceOver actions, AirPlay and Picture-in-Picture decisions. [E] 5 to 8 days of Swift plus accessibility work, plus ongoing OS-update risk.
- **Privacy.** No permission by itself. It can open a remote URL; we pass `file://` only, enforced by one adapter and a scan test. Background playback and Picture-in-Picture are plugin options and must stay off: they add `UIBackgroundModes`, which the label guard reads as an entitlement-class change (G11-3). Privacy-manifest keys the pod declares [U]; re-run the privacy-manifest audit in `apps/mobile/src/lib/privacy-manifest.ts` header (BL-349) after install.
- **Size.** Registry unpacked 12.5 MB (mostly native sources); binary delta [U] needs an EAS build.
- **Risk.** A new native dependency in every build; CR-65 treated that as T2. It touches no data we collect.
- **Decision.** ADOPT, gated: only after NS-52 is scheduled and after the first TestFlight processing email (CR-65 revisit line). Wrapper `components/media/video-poster.tsx` is the only importer. Way back: remove the wrapper's import; the file stays on disk and a poster plus "Open in Files" share (`expo-sharing`, installed) is the fallback. Owner: K-T2.

## LD-11 Video ingest (copy, validate, cap, strip metadata, poster frame): OWN CODE, AVFoundation
- Card rules: bytes-checked type (mp4, mov), bounded duration and size read, no third-party decoder, re-encode to at most 1080p with every metadata atom removed, 0 of 10 fixtures carry a location or device tag, 60 s and 100 MB caps, no trim (NS-52-R5, R7, R8; Q-PM-11; `27-photo-moments-and-media.md:345,347,348` [V], Q-PM-2 and Q-PM-11 lines 52 and 61 [V]).
- Platform pieces: `AVURLAsset` (duration), `AVAssetExportSession` with a preset and `metadata = []` (the card marks the stripping API UNVERIFIED), `AVAssetImageGenerator` (poster). No npm package does the stripping and "no third-party decoder" forbids one. Check on a Mac, with fixture videos from the fictional family only [U].
- Saved by a library: none exists that meets R5 and R8.
- Decision: OWN CODE in `scribe-photo` (or a sibling `scribe-media` module, `design` question for Karma). AVOID `expo-video-thumbnails` and trim libraries. Needs a `human` device-check task (a video from a phone with location on, inspected with `exiftool` or `ffprobe`). Owner: K.

## LD-12 Camera, in-app recording, trimming: AVOID
- NS-52-R2 and NS-01-R22: no camera control; Q-PM-11: no trim in v1 (`27-photo-moments-and-media.md:61,342` [V]). `expo-camera 57.0.6` (SDK pin, registry) would add camera and microphone usage strings; the guard flags a new usage string (G11-3, `label-effect.mjs:140` [V]).
- Decision: AVOID. Way back: the founder decision in CR-65. Owner: F if ever wanted.

## LD-13 Image manipulation: AVOID expo-image-manipulator
- `reencodeUpright` already writes an upright, metadata-free JPEG natively (`ScribePhotoModule.swift:77,184` [V]). `expo-image-manipulator 57.0.22` (SDK pin) would duplicate it and add 32.5 MB unpacked of native sources [V registry].
- Decision: AVOID. Owner: K.

## LD-14 Haptics, icons, date picker, small UI: USE what is installed
- Haptics: `expo-haptics ~57.0.3`, wrapped by five named intents in `apps/mobile/src/lib/haptics.ts:6-16` [V]. Do not call it elsewhere.
- Icons: `phosphor-react-native ^3.0.6`, MIT, mod 2026-04-23. The 3 Oct size note said the index import pulled 3,024 icons (5.6 MB, 54% of JS, `APP_SIZE.md` section 3 and cut 1 [V]). Today: 0 imports from the package index (outside type imports) and 90 deep imports (`phosphor-react-native/src/icons/X`) [V by grep]. The 54% figure is stale; re-run `npx tsx scripts/size/measure.ts` before quoting it.
- Date picker: `@react-native-community/datetimepicker 9.1.0` (native iOS picker) [V in package.json].
- Decision: USE all. Owner: K (design-systems for ui).

## LD-15 State and forms: USE the module store; AVOID new state and form libraries
- The app keeps `lib/store.ts` over `scribe.db` with a `bus` that emits table names and screens re-read (eval B, `docs/engineering/eval-20nov/B-mobile-client.md:89` on branch `docs/eng-eval-20nov` [V]).
- Candidates: `zustand 5.1.0` (MIT, 2026-11-06), `react-hook-form 7.92.0` (MIT, 2026-11-11), `react-native-mmkv 4.3.2` (MIT, 2026-06-22), `react-native-keyboard-controller 1.23.1` (MIT, 2026-11-16) [V registry]. None answers an observed gap: there are few forms (a name, a date, a note), and `expo-sqlite` plus `expo-secure-store` already persist.
- Decision: AVOID until a PR shows a defect the current store cannot fix. Keyboard avoidance: if a defect appears in the capture review editor, `react-native-keyboard-controller` is the first candidate (it needs Reanimated, which we have). Owner: K.
