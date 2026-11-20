## Photo with a letter, slice 2: the scribe-photo native module (BL-931)

**Base:** `develop`. **Branch:** `feat/mobile-photo-2-native-module`. Split from #796 (8a026397). For the security-architect.

Slice 1 and its picker package were dropped by Karma's ruling of 20 Nov 2026. This branch merges develop and takes them out again (package.json, the lockfile, licences, the plugin line, the preflight helper and its tests are develop's, byte for byte). The lockfile is what `npm install --package-lock-only` writes: it reports "up to date" with no change.

Round 2 (Karma, on 1356cb8a) added cc519f9a (the baker) and 567de5fb (the module and its scan). Round 3 (on 567de5fb) adds 5454dc25 (the picker's sheet, the re-encode queue and the scan) and 44dd950e (stale header text).

### What and why
- **pickOne(destination).** It shows Apple's PHPickerViewController, made with `PHPickerConfiguration()` and no photo library. The picker runs out of process, so the module makes no photo-library or camera permission request and reads only the one picture chosen.
  - Images only, one picture, the current representation.
  - **A sheet of ours.** The picker is embedded as the only child of a small sheet (PickerHost), presented from ExpoModulesCore's `currentViewController()`, the way scribe-store presents its sheet.
  - **One picker at a time** (scribe-store's StoreSheet). A second call fails at once with `photo_pick_failed` and presents nothing.
  - **Never stuck.**
    - Whatever makes the sheet go away ends with its `viewDidDisappear`, which answers a Cancel if nothing answered yet (StoreSheet's onDisappear). That covers react-native-screens dismissing every modal by code, which no delegate hears (round 3 must-fix), as well as a swipe-down.
    - At the busy check, a session whose sheet was shown and is no longer presented is stale: it is answered as a Cancel first, so a later tap is never refused for good.
    - The sheet is presented with a completion. A 2 s main-actor watchdog fails the call with `photo_pick_failed` and frees the session when UIKit never showed it. A sheet that appears only after that dismisses itself.
    - The sheet holds the session, so the picker's buttons keep working while it is on screen.
  - It loads the still with `loadFileRepresentation(UTType.image)` and copies it to the destination before the handler returns. A failed copy removes the partial original.
  - Cancel or a swipe-down resolves null. A Live Photo gives its still. An iCloud-only picture downloads through the provider.
  - The module contains no `requestAuthorization`, `requestAccess` or AVCapture call; the scan pins this.
- **reencodeUpright(source, destination).** Before any decode it refuses:
  - a format other than JPEG, HEIC, HEIF or PNG (N1);
  - a canvas over 150 MP, using a checked multiply (no overflow trap) (N1);
  - an incomplete source or image.

  It uses the primary image index (N2) and caches nothing. It passes only our three write options, and runs the decode and encode inside an autorelease pool. It runs on a serial queue of its own (`runOnQueue`), so a long decode no longer holds ExpoModulesCore's shared queue, which scribe-keys and scribe-audio use (review B N-B5r).
- **Paths from JavaScript are untrusted (N-B1).**
  - Each path must be a plain file name directly inside a Caches folder that Swift works out itself. The name rule is #841's `PLAIN_NAME`, ending in `\z` (ICU's `$` also matches before a final line break; JavaScript's `$` without the m flag already means the end of the input). The folders:
    - the pick destination: Caches/ImagePicker;
    - the re-encode source: Caches/ImagePicker;
    - the re-encode destination: Caches/ScribePhoto.
  - Dot segments are resolved (`standardizedFileURL`), and links are followed on both sides before comparing. Only those two folders are ever created.
  - A folder is never removed.
    - Something already at a destination is replaced only if it is a regular file. A folder or a link refuses.
    - A partial copy or a failed JPEG is removed only if it is a regular file.
- **Errors.** Every failure leaves as one closed code: `photo_pick_failed` from pickOne, `photo_reencode_failed` from reencodeUpright. They come from a `@unchecked Sendable` exception with an explicit code (N3).
- **Podspec.** It declares CoreGraphics, ImageIO, PhotosUI, UIKit and UniformTypeIdentifiers. Otherwise it is identical to scribe-audio's: no setting that differs by build configuration.
- **baker.ts.**
  - It hands over only a picked original (N4), and bounds the native call to 20 s (N9).
  - It builds the destination inside its `try`, so a refused name returns null.
- **Not here.** `files.ts` is now slice 2b (#841), for size.

### Security-architect files
- `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift`
- `apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec`
- `apps/mobile/modules/scribe-photo/expo-module.config.json`
- `apps/mobile/modules/scribe-photo/index.ts`
- `apps/mobile/src/lib/photos/baker.ts`
- `apps/mobile/src/lib/photos/picker.ts` is in #837 (slice 4a), not here.
- No plist key, no entitlement, no app.config line.

### Rows
NS-01-R2, R17 and R22 (the source scan), NX-39-R50, R53; C7, C8.

### Tests
7 tests in `test/photos-device.test.ts`.

**The Swift scan** is a checker with a positive control of 74 mutants (30 added in round 2, 25 in round 3). Each one goes red against the real file. The scan reports 37 problems on the 1356cb8a module and 16 on 567de5fb.
- **Every file the pod compiles is scanned.** The test fails if a second `.h`, `.m` or `.swift` file appears under ios/. It is checked with a temporary folder holding an extra file. It also pins the podspec's `source_files`.
- **Comments.** Only whole-line comments are stripped, so code after `"file://"` on a line is scanned.
- **Bans.** It bans:
  - the bare identifier `log` (so `log` with `.info` on the next line, and `(log).info`, fail) and every other logging call;
  - the permission, camera, library, location and network APIs, with `photoLibrary` in any spelling;
  - `replaceItemAt` and every POSIX file call (`rename`, `link`, `remove`, `open` and the rest);
  - CoreImage and UIImage writers;
  - any module export other than the two AsyncFunctions, which are counted.
- **Exact counts.** These are counted, so a second copy of any of them fails:
  - one `CopyPropertiesAtIndex`;
  - one `write` dictionary, used once;
  - one `copyItem`, inside `copyPicked`;
  - two `removeItem`s, in `clear` and `removeIfFile`;
  - one `createDirectory`;
  - three path checks.

  A second property read, a copy of the original, or `Data(contentsOf:)` written out therefore fails. `.write(to:` and other file APIs are also banned outright.
- **Error codes.** Each function's catch must throw its own code. The two codes cannot be swapped, either between functions or in their names.
- **Pins.** The scan pins:
  - the cache flag;
  - the allowlist;
  - the 150 MP cap;
  - the 4096 px limit;
  - the checked multiply;
  - the autorelease pool, which must hold the decode and encode;
  - the busy guard;
  - the watchdog: 2 s, the presentation completion, and the release;
  - the sheet: the embedded picker, `viewDidDisappear` answering a Cancel, the stale check before the busy check, and the late sheet dismissing itself;
  - the lifecycle lines review A listed: the slot claim, the picker's delegate, the dismissal after an answer, the single resume, and the copy to the checked destination;
  - the re-encode's own queue;
  - the three path checks, `return file`, and the name rule ending in `\z`;
  - the removal rules;
  - the partial-copy cleanup.

  It also checks the order: paths before work, the busy check before presenting, and the caps before the decode.
- **Review A's earlier mutations stay red:** source properties, Exif, GPS or TIFF, an embedded thumbnail, the gain map, auxiliary data, index 0, a library picker, an authorization or camera call, a log line, and a raw error.

**The baker.** In memory, it covers:
- the destination;
- a picked original only;
- a refused destination name returning null, with no native call (fails on the old baker);
- the time bound;
- no native text logged.

**Pod and config, and packages.** No picker, camera or media-library package is a dependency.

**Checks at 44dd950e:**
- tsc shows the 5 known errors;
- the full mobile suite fails only in the 8 baseline files;
- packages/content passes 395 of 395;
- added lines are ASCII only.

### Flag-off proof
Nothing in `src` calls the module or the baker in this slice. The packages test pins that no picker package can come back.

### Notes (written, not fixed here)
- **The re-encode can run past the 20 s timeout.** It now runs on its own serial queue, so nothing else waits behind it, but after the baker's 20 s timeout the native work still carries on, and the next re-encode queues behind it. The JPEG it writes afterwards is metadata-free. It stays in Caches/ScribePhoto until the launch sweep (#841) removes it.
- **A link standing in place of Caches/ImagePicker** (review B N-B1r residual 1). Both sides of the path check are resolved, so if Caches/ImagePicker itself were replaced by a link to Documents, the picked original would land there, which is backed up and outside the sweep. Nothing in the app can create a link: JavaScript has no API for it, and neither the local modules nor the installed native dependencies call one. The same precondition covers residuals 2 and 3 (the folder changing between the check and the copy, and a re-encode source that is itself a link).
- **The protection class** of the copied original and of the JPEG (review B N-B2, SEC-R15) is a device check. `copyItem` may clone the file, and Apple does not say which class a clone keeps.
- **ProRAW, GIF and WebP (also TIFF) are refused by the allowlist.** With `.current`, the picker can hand these over. The parent then sees the failure that NS-01-R17 describes: nothing is stored and the letter is kept. Which formats arrive is a device-check row. Whether to use `.compatible` is a product call for #837.
- **expo-file-system already references Photos.**
  - Version 57.0.7 compiles its Legacy module into every build, and registers it (`FileSystemLegacyModule` in its `expo-module.config.json`).
  - For `ph://` and `assets-library://` uris, that module calls `PHAssetResourceManager.writeData`, `PHImageManager` and `PHAsset.fetchAssets`, and reads `PHPhotoLibrary.authorizationStatus`.
  - It makes no permission request, and the app never imports `expo-file-system/legacy`.
  - So this PR makes no photo-library or camera permission request (the app does ask for the microphone and Face ID, as on develop), but the binary does reference Photos, as develop does today. Record it beside the ITMS-90683 check on the first upload.
- **Left for slice 4a (#837), and listed in its body:**
  - iCloud progress and Cancel (Review A note 3, NS-01-R17);
  - picker.ts single-flight, and its cancel releasing `done`;
  - the app-lock interplay (Review B N-B7).

### Not verified
- **The native build of round 3.** There is no Swift toolchain here; round 2 compiled in CI (Debug and Release at 567de5fb), and CI at 44dd950e is the proof for round 3. The UIKit calls the sheet uses (`addChild`, `didMove(toParent:)`, `viewDidDisappear`, `init(nibName:bundle:)`, `required init?(coder:)`) and `runOnQueue` are taken from installed sources that already compile (expo-dev-launcher, react-native-screens, expo-modules-core, expo-file-system).
- **The picker embedded in a sheet.** Apple supports an embedded PHPicker from iOS 17 (the app's minimum), but I could not confirm that from the SDK here. On a device: that the sheet looks like the picker presented on its own, with its Cancel button.
- **The sheet going away on a device.** That react-native-screens dismissing every modal (an invite link, or a reminder that opens a modal route, while the picker is open) ends in `viewDidDisappear`, resolves null, and the next tap presents a picker.
- **A full-screen cover.** If something were presented full screen over the sheet, `viewDidDisappear` would answer a Cancel early. The picker would stay usable, but a later pick would be ignored. Nothing in the app does this today.
- **The watchdog's behaviour.** Whether UIKit ever refuses or defers this presentation, that the 2 s path then frees the session, and that a late sheet dismisses itself.
- **Path comparison on a device.** `resolvingSymlinksInPath` should treat `/var` and `/private/var` the same on both sides, and expo-file-system's `Paths.cache` should equal FileManager's caches folder.
- **Device checks:**
  - the picker: Cancel, swipe-down, a second tap while it is open, a dismissal by navigation, a Live Photo, an iCloud-only picture;
  - the re-encode: HEIC, multi-image HEIC, 48 MP, and a 150 MP+ PNG;
  - the formats `.current` hands over;
  - the copy's file protection class;
  - the backup.
- Whether `CGImageSourceGetStatusAtIndex` reports a truncated file as incomplete (Apple's documentation does not say).

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 3a (#835, on 2b), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push. Karma cascades rounds 2 and 3 into #841 and above.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 835 changed lines in 9 files, against the 400-line limit (the lockfile and the generated `licences.json` are not counted).
- **Code: 428 lines.** The Swift module is 309 of them. Round 2 added the path checks, the single picker and the watchdog; round 3 adds the picker's sheet, the stale check and the re-encode queue.
- **Tests: 407 lines.** These are the requirement-row proofs and the source scan with its mutants. Each fails on the old code, and splitting them from the code would leave the code unproven.

Same shape as #828. The founder accepts or refuses this exception; the merge waits for that.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
