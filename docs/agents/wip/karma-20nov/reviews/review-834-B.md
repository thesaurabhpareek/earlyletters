## Review B at 44dd950ea831c99f39e11c79cc46d678a4a645ae: PASS WITH NOTES

Lens B: security engineering (chapter 06), on-device data protection and platform permissions. Method: STRIDE, and OWASP MASVS STORAGE, PLATFORM, CODE and PRIVACY. Round 4 of #834 (photo slice 2, BL-931, NS-01). I confirmed the head through the REST API at the start and again at 03:19 UTC, before writing: 44dd950ea831c99f39e11c79cc46d678a4a645ae. Base develop 5dc025d3 is still the develop tip and the merge base, so the CI merge tree (74481fe) equals the head tree.

Nothing must be fixed before merge.
- My seven round-3 scan bypasses and the ICU `$` anchor are closed. Each has a pin or a ban and a committed mutant, and each goes red when I type it in again myself.
- reencodeUpright runs on its own serial queue, so it no longer holds the queue that scribe-keys uses for AES-GCM.
- PickerHost answers a programmatic dismissal as a Cancel. I found no lifecycle path that writes outside Caches/ImagePicker or Caches/ScribePhoto. I found none that puts a picked original anywhere the launch sweep cannot reach, and none that holds the slot for good on any path Apple documents.
- The body's permission and expo-file-system statements check out against node_modules 57.0.7 and apps/mobile. No plist, entitlement, package, lockfile or config file changes.
- CI is green at this head, including the Debug compile and the store-profile Release launch.

The scan is still a list of names, though. Nine new edits pass it with zero problems (N-B3c), including:
- a one-line `clonefileat` that puts the original, location included, where the JPEG should be;
- an unpinned `home` line that moves both folders out of Caches;
- the system pasteboard.

These are notes: the stewards' reading of each Swift diff is the control, and the scan backs it up.

### What I read
- The PR body at 44dd950e. My round-3 comment, issue comment 7028590444. Review A at 567de5fb, issue comment 7028583366.
- `git diff 567de5fb 44dd950e` in full: 3 files, +138/-36, from commits 5454dc25 and 44dd950e.
- At the head, in full:
  - `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift` (309 lines);
  - `ScribePhoto.podspec`, `expo-module.config.json` and `index.ts`;
  - `src/lib/photos/baker.ts`;
  - `test/photos-device.test.ts` (359 lines).
- In #841 at 29e35220, for comparison only: `src/lib/photos/files.ts:39` (`PLAIN_NAME`).
- Unchanged against develop, at the head:
  - `app.config.ts:44, 92-93, 139, 303, 317`;
  - `src/app/listen.tsx:271`;
  - `src/lib/app-lock/controller.ts:106`;
  - `src/lib/reminders/scheduler.ts:302`;
  - `src/lib/billing/plan-reminders.ts:166`;
  - `src/components/app-lock/app-lock-layer.tsx:1-15, 84`;
  - the AsyncFunction lists in `ScribeKeysModule.swift:101-251` and `ScribeAudioModule.swift:66-99`;
  - `.github/workflows/ios-compile.yml:184, 210`.
- Installed libraries (the lockfile is develop's: expo-file-system 57.0.7, expo-modules-core 57.0.20, react-native-screens 4.26.2):
  - expo-modules-core:
    - `ios/Core/Functions/AsyncFunctionDefinition.swift:20` (defaultQueue), `:135-138` (`queue ?? defaultQueue`), `:161` (`queue.async`), `:207-208` (`runOnQueue`);
    - `ios/Api/Factories/AsyncFunctionFactories.swift:36-46`: a synchronous throwing closure becomes an AsyncFunctionDefinition;
    - `ios/Core/Functions/ConcurrentFunctionDefinition.swift:58-91`;
    - `ios/Utilities/Utilities.swift:141-155` (`currentViewController`).
  - expo-file-system:
    - `expo-module.config.json` (registers `FileSystemModule` and `FileSystemLegacyModule`);
    - `ios/ExpoFileSystem.podspec:31` (`source_files = "**/*.{h,m,swift}"`);
    - `ios/Legacy/FileSystemLegacyModule.swift:12`;
    - `ios/Legacy/FileSystemHelpers.swift:89, 98, 119, 134, 137`;
    - `ios/Legacy/EXFileSystemAssetLibraryHandler.m:29, 72, 88, 105, 117`.
  - react-native-screens:
    - `ios/RNSScreenStack.mm:497-545`, the dismissal of a modal it does not own, and `RNSDismissibleModalProtocol`;
    - `ios/RNSFullWindowOverlay.mm:151-162` (`[window addSubview:_container]`).
- Apple documentation JSON from developer.apple.com, fetched 20 Nov 2026:
  - NSRegularExpression: "`\z` Match if the current position is at the end of input." and "`\Z` ... but before the final line terminator, if one exists".
  - `UIViewController.viewDidDisappear(_:)`: "Notifies the view controller that its view was removed from a view hierarchy."
  - `dismiss(animated:completion:)`:
    - "calling this method on a view controller lower in the stack dismisses its immediate child view controller and all view controllers above that child";
    - "only the top-most view is dismissed in an animated fashion; any intermediate view controllers are simply removed from the stack";
    - "The completion handler is called after the viewDidDisappear(_:) method is called on the presented view controller".
  - `presentingViewController`.
  - PHPickerViewController. Its page lists `updatePicker(using:)`, available from iOS 17.0. The page has no text on embedding.

### What I ran
All runs were in a scratch copy of the head made with `git archive`, with node_modules linked from the repo install. The probe files lived only there.
- `vitest run test/photos-device.test.ts`: 7 of 7 pass. The positive control holds 74 mutants (49 + 25 new), and the test fails unless every one goes red.
- Fails on old code: the head's `swiftProblems` reports 16 problems on the 567de5fb module and 54 on the 1356cb8a module.
- **Scan probe 1** (`swiftProblems` on 26 edits of the head Swift).
  - The seven round-3 bypasses, typed again by me, not copied from the PR's list: all red. Details are in the round-3 status.
  - Variants:
    - `Foundation.rename(...)`, `link (...)` with a space, `Function ("tidy")`, a `let F = AsyncFunction` alias, `.init(photoLibrary:)` and `let l = ExpoModulesCore.log`: all red.
    - `let mv = Darwin.rename; _ = mv(url.path, out.path)`: GREEN.
  - New edits: see N-B3c.
- **Scan probe 2** (the `*at` POSIX family): `clonefileat`, `renameatx_np`, `symlinkat`, `openat`, `unlinkat` and `mkdirat`. All GREEN.
- **ICU 74 on this host** (libicui18n, through Python ctypes), with the pattern from Swift:99:
  - The `\z` form accepts `abc.jpg`, `0194-a.img` and a 64-character stem.
  - It refuses `abc.jpg` followed by `\n`, `\r\n`, `\r`, U+2028, U+2029, U+0085, FF or VT, each of which the `$` form accepts.
  - Both forms refuse `..`, `a/b.jpg`, NUL, a 65-character stem, `a.b.jpg`, Arabic-Indic digits, the fullwidth full stop and U+212A.
- **Node**: #841's JavaScript `PLAIN_NAME` refuses the same trailing-terminator forms, so the two rules now agree.
- **Diff checks.**
  - `git diff --quiet origin/develop 44dd950e` is empty for the root package.json and package-lock.json, apps/mobile/package.json, app.config.ts, eas.json and src/generated/licences.json.
  - `git diff origin/develop...44dd950e --name-only` lists 9 files: none is a plist, entitlement, plugin, config, package or workflow file.
  - Added lines since 567de5fb: 0 non-ASCII.
- **Greps.**
  - The raw module file at the head, comments included, has no permission, library, camera, location, network, logging, pasteboard, defaults or protection-attribute name.
  - apps/mobile has no NSPhotoLibrary or NSCamera usage string and no image-picker, media-library or camera package.
  - Nothing in `src` calls the module or the baker, so flag-off holds.
- **Not run.** I did not run tsc or the full mobile suite. In my scratch copy, the `@scribe/*` workspace links resolve to the repo checkout, not to the head, so the result would not be about this PR. CI typecheck and "tests and content rules" are green at the head.

### Round-3 status (Review B at 567de5fb)
- **N-B3b, the seven bypasses: closed.** Each one now fails the scan, and its mutant is committed:

  | # | Bypass | Caught by | Mutant |
  |---|---|---|---|
  | 1 | `rename` | the POSIX ban, test:173 | :322 |
  | 2 | `link` | test:173 | :323 |
  | 3 | `log` on a continuation line | the bare identifier `\blog\b`, test:170 | :325 |
  | 4 | `(log).info` | test:170 | :326 |
  | 5 | `Function("tidy")` with `Darwin.remove` | the export ban, test:175, and the POSIX ban, test:173 | :327 |
  | 5b | `AsyncFunction ("tidy")` | the export count, test:147 | :328 |
  | 6 | the library picker written with spaces | `\bphotoLibrary\b`, test:168, and `PHPickerConfiguration\s*\(`, test:179 | :329 |
  | 7 | `return url` | the pin `    return file\n`, test:94 | :317 |

  Review A's two are also closed: `replaceItemAt` (test:172, mutant :321) and CoreImage (test:174, mutant :324). New bypasses: N-B3c.
- **N-B1r residual 4, the `$` anchor: closed.**
  - Swift:99 now ends in `\z`, which Apple documents as the end of input. The comment at :90-91 says why.
  - Pinned at test:92, with the mutant at :318. My ICU probe confirms it refuses every line-terminator form.
  - Residuals 1 to 3 need a link standing in place of a folder, and nothing in the app can create one. They are unchanged, and the body now records them under Notes (fine).
- **N-B5r, the shared queue: closed** (check 2).
- **N-P1, a session stuck after a dismissal by code: closed** (check 3).
- **N-W1, the body's wording: closed, with one omission** (N-W2).
- **N-B2, the protection class: still a device check.** The body records it.

### The five checks

**1. Bypasses and the anchor.** See the round-3 status: all eight are closed, and each committed mutant goes red. My two new bypasses, and seven more edits that also pass, are in N-B3c.

**2. The re-encode queue.**
- Swift:59 declares `DispatchQueue(label: "scribe.photo.reencode", qos: .userInitiated)`, serial by default. Swift:84 attaches it with `.runOnQueue`.
- reencodeUpright's closure is synchronous and throwing (Swift:77), so it is an AsyncFunctionDefinition (AsyncFunctionFactories.swift:36-46). Its body is dispatched with `queue.async` on `queue ?? defaultQueue` (AsyncFunctionDefinition.swift:138, 161). This module was the only one that could hold `expo.modules.AsyncFunctionQueue` (:20) for a long decode, and it no longer does. scribe-keys' AES-GCM and unwrap calls (ScribeKeysModule.swift:101-251) and scribe-audio's functions (ScribeAudioModule.swift:66-99) still share that queue with each other, as on develop.
- Pinned at test:124-125. Counted at :152-153. Mutants :319 (the shared queue) and :320 (`.main`) are red.
- **Main thread.** The re-encode never hops to main.
- **The picker.** pickOne has an async closure, so it is a ConcurrentFunctionDefinition. Its body awaits off the JS actor (ConcurrentFunctionDefinition.swift:81; `requiresMainActor` is set only for view functions). Only `presentPicker` (Swift:123) is on the main actor, and only the presentation runs there. The copy runs in the item provider's callback (Swift:167-178). There is no queue shared with the re-encode.
- **New contention.** It is memory, not time: a re-encode can now overlap scribe-audio's `enhance` or `decodePcm16` (Note N-Q1).

**3. The PickerHost lifecycle.**

Holders:
- `PickerSession.current` (Swift:242) and the host (Swift:283) hold the session strongly.
- The session holds the host weakly (Swift:245). The picker holds its delegate weakly.
- The watchdog holds both weakly (Swift:154).
- `finish` resumes at most once and frees the slot only if it is still its own (Swift:270-275).

Paths:
- **Dismissal by code.**
  - react-native-screens dismisses a modal it does not own with `dismissViewControllerAnimated:` (RNSScreenStack.mm:508-535). PickerHost does not adopt `RNSDismissibleModalProtocol`, so it is dismissed.
  - The host is the top-most presented controller, because `currentViewController` walks to the top (Utilities.swift:144-148) and Swift:131 refuses a presenter that is already presenting. Apple says the completion runs after `viewDidDisappear` on the presented controller.
  - `viewDidDisappear` (Swift:305-308) answers a Cancel. No provider exists, so nothing is copied.
  - If UIKit ever skipped `viewDidDisappear`, for example on an intermediate controller "simply removed from the stack" (Apple), the host is freed. The next call then finds `shown` with `host == nil` and answers the old call as a Cancel (Swift:126).
  - Pinned at test:107 and :122. Mutants :306-308.
- **Early Cancel from a cover.**
  - A full-screen presentation over the host would fire `viewDidDisappear` and answer null early.
  - The host keeps the session, so the picker's buttons still call the delegate. A later pick then reaches `finish` with no continuation and returns at Swift:271. The provider is dropped, `loadFileRepresentation` is never called, and nothing is written.
  - Nothing in the app presents full screen over the host today. The app lock is a FullWindowOverlay, a window subview (app-lock-layer.tsx:84, RNSFullWindowOverlay.mm:161), not a presentation, so it fires no appearance callback.
  - The body already lists this case.
- **Late appearance.**
  - The watchdog fails the call only when the sheet was not shown and the host has no presenter (Swift:156).
  - If the presentation still completes, the completion sees `answered` and dismisses the host (Swift:150). Pinned at test:115, mutant :309.
  - A pick in that window reaches an answered session, and nothing is copied.
- **App backgrounded, or the device locked, while the picker is open.**
  - Apple ties `viewDidDisappear` to removal from a view hierarchy, and going to the background removes nothing (unverified on a device). So the session correctly stays alive while the picker is still on screen.
  - The app-lock cover is added to the window above the sheet's transition view (RNSFullWindowOverlay.mm:161). Its stacking over an out-of-process picker is a device check (N-B7, deferred to #837).
  - If the process is killed, nothing has been written: there is no provider before a pick.
- **The writes.** PickerHost does no file I/O. The only writes are still:
  - `copyItem` to the checked `out` in Caches/ImagePicker (Swift:67, 69, 170-171);
  - the ImageIO JPEG to the checked `out` in Caches/ScribePhoto (Swift:186, 218-219);
  - `createDirectory` of those two folders only (Swift:96);
  - `removeItem` of a regular file only (Swift:111-112, 118).

  So no lifecycle path writes outside the two folders, and a picked original lands only where #841's launch sweep looks.
- **Path checks from round 3 still hold.** `fileIn`, `clear`, `removeIfFile`, `copyPicked` and `reencode` are byte-identical to 567de5fb, apart from the `\z` (`git diff`, Swift:89-104). The pick destination is still checked before the presentation (test:193).
- **Not fixed here.** A copy that finishes after JavaScript stopped waiting (an iCloud download, #837's cancel) leaves the original in Caches/ImagePicker until the next launch sweep (N-P2 d).

**4. The body's claims.** All verified:
- The module makes no photo-library or camera permission request: the raw grep finds no name, and apps/mobile has no NSPhotoLibrary or NSCamera string.
- The app does request the microphone (app.config.ts:303, listen.tsx:271) and Face ID (app.config.ts:139 and 317, controller.ts:106).
- expo-file-system 57.0.7 registers `FileSystemLegacyModule` (its expo-module.config.json) and compiles all of ios/ (podspec:31). That code:
  - calls `PHAssetResourceManager.writeData` (FileSystemHelpers.swift:119, with the manager at FileSystemLegacyModule.swift:12);
  - calls PHImageManager (EXFileSystemAssetLibraryHandler.m:29, 72, 88);
  - calls `PHAsset.fetchAssets` (FileSystemHelpers.swift:98, .m:105, 117);
  - reads `PHPhotoLibrary.authorizationStatus` (FileSystemHelpers.swift:134, 137).
- There is no `requestAuthorization` or `requestAccess` anywhere in expo-file-system/ios.
- No Info.plist key, entitlement, package, lockfile or app.config change against develop (What I ran).
- One omission: N-W2.

**5. CI at 44dd950e.** Read through the REST API. All 14 check-runs completed with success between 02:46:37Z and 03:08:31Z: required, compliance-fence (twice), typecheck, edge functions, B-8 seam, tests and content rules, database rules, native files changed, install, applied migrations unchanged, agent team consistent, and the two iOS builds below.
- **"iOS simulator build (no signing)"**, Debug (job 136046076314): success at 03:03:37Z.
  - Log line 119: `HEAD is now at 74481fe Merge 44dd950e... into 5dc025d3...`.
  - Xcode 26.6 (line 190) and `-configuration Debug` (line 625).
  - The notice "1923 warnings in total" (line 1104) is printed only when xcodebuild exits 0 (ios-compile.yml:210). Line 1108 reads "scribe-photo (ScribePhoto): built".
  - The on-screen warning list is capped at 400 lines (ios-compile.yml:184; the log has 401 warning lines), so I cannot say whether ScribePhotoModule.swift drew a warning.
- **"store-profile Release launch (testflight env, no seam, 20 s)"** (job 136045970074): success at 03:08:31Z.
  - The same merge 74481fe (line 119), XCODE_VERSION 26.6 and `-configuration Release` (line 613).
  - "** BUILD SUCCEEDED **" (line 640), and "the store-profile app is up 20 s after launch, no fatal exception" (line 742).
- **What this proves.** In Swift 5.9 mode for the Simulator, Debug and Release, all of these type-check and link:
  - PickerHost, with `addChild`, `didMove(toParent:)`, `viewDidDisappear` and `required init?(coder:)`;
  - `answered` on the main actor;
  - `.runOnQueue`.

  The Release app also survives 20 s without calling the module. Nothing exercises the picker or the re-encode.

### Must fix
None.

### Notes

**N-B3c. The scan still lists names.** Nine edits of the head Swift pass `swiftProblems` with zero problems. All are throwaway; none was compiled (there is no toolchain here), and the JavaScript re-check (strip.ts) is still a second line for the JPEG.

My two new bypasses:
1. **The `*at` family.** `if clonefileat(AT_FDCWD, url.path, AT_FDCWD, out.path, 0) == 0 { return }` before `try clear(out)` (Swift:218) puts the picked original, location included, at the JPEG path, and reencodeUpright resolves it as "the JPEG". `renameatx_np`, `symlinkat`, `openat`, `unlinkat` and `mkdirat` are also GREEN. The ban at test:173 matches exact call names, so `clonefile(` is caught but `clonefileat(` is not. The function-value form `let mv = Darwin.rename; _ = mv(...)` is also GREEN.
2. **The folder root is not pinned.** Change Swift:95 to `let home = caches.deletingLastPathComponent().appendingPathComponent(folder, isDirectory: true)` and both folders become Library/ImagePicker and Library/ScribePhoto. Those are backed up and outside the sweep, and the picked original with its location would land there. The scan pins `let caches` (test:90) and the comparison (test:93), but not `let home`. For this edit to work end to end, #841's files.ts would have to change too, which the stewards would see.

Also GREEN:
- `UIPasteboard.general.itemProviders = results.map(\.itemProvider)` in `picker(_:didFinishPicking:)` (Swift:255-258). The original goes on the system pasteboard, and to Universal Clipboard. JavaScript does not have to change.
- `FileManager.default.setAttributes([.protectionKey: FileProtectionType.none], ofItemAtPath: out.path)` after the copy (Swift:171). The picked original becomes readable while the device is locked (SEC-R15).
- `UserDefaults.standard.set(provider.suggestedName, forKey: ...)`, which writes to a backed-up plist.

The fixes cost a line each, and I grepped the head for false hits:
- Pin `    let home = caches.appendingPathComponent(folder, isDirectory: true)\n`.
- Ban `AT_FDCWD`, and give the POSIX names a `\w*` suffix: `\b(rename|link|symlink|unlink|open|creat|truncate|rmdir|mkdir|clonefile|copyfile|fcopyfile|exchangedata)\w*\s*\(`. No hit at the head; `open.cancel(` does not match.
- Ban `UIPasteboard|UserDefaults|NSUbiquitousKeyValueStore|setAttributes|protectionKey|FileProtectionType`. No hit at the head.
- Ban `\b(Darwin|Glibc)\.`. No hit at the head.

Add one mutant for each.

**N-P2. PickerHost robustness.** None of these writes a file or leaks one. See Swift:126, 150 and 255-258.
- (a) **The stale check requires `shown`** (Swift:126). Suppose UIKit accepts the presentation (so `presentingViewController` is set and the watchdog at :156 returns), then aborts it before the completion and before any appearance callback. The slot then stays held until relaunch.
  - This is theoretical, and the path is not documented.
  - A host that is gone cannot answer, so `if let open = PickerSession.current, open.host == nil || (open.shown && open.host?.presentingViewController == nil)` closes the gap at no cost.
- (b) **`picker(_:didFinishPicking:)` dismisses before it answers** (Swift:256-257).
  - If UIKit ever ran `viewDidDisappear` synchronously inside `dismiss(animated: true)`, the Cancel would answer first, and the pick would be lost. That fails closed: there is no copy.
  - Answering first and then dismissing removes the question. The pin at test:118 would change with it.
- (c) **The cover case.** `current` is nil while the first host is still up, so a second call can present a second host from it (Swift:130-131 picks the top-most). Then `host?.dismiss` on the first host would dismiss its child, the second host (Apple's "dismisses its immediate child"). Both answers stay single, and nothing is written. This is UX only, and nothing in the app reaches it today.
- (d) **A late copy.** The copy continues after JavaScript stops waiting. For example, #837 cancels during an iCloud download, and the original lands in Caches/ImagePicker until the next launch sweep (#841). #837 should remove a picked file it no longer wants when a late `pickOne` resolves. Worth one line in #837's body next to the iCloud Cancel item.

**N-Q1. Memory overlap.** Before this change, a re-encode and scribe-audio's `enhance` and `decodePcm16` were serialized on one queue. Now they can run at once.
- A PNG just under the 150 MP cap may need a full decode (about 600 MB at 4 bytes a pixel; unverified for ImageIO's PNG thumbnail path). Overlapping it with an enhance raises the chance of a jetsam kill.
- This is availability only. Add "re-encode a 150 MP PNG while a recording is being enhanced" to the device checks. No change is needed for a flag-off slice.

**N-B1r (carried).** Residuals 1 to 3 (a link standing in place of a folder; time of check against time of use in the copy; the re-encode source being a link) are unchanged, and the body records them. My round-3 fixes still apply when #837 wires the photo door: `.typeDirectory` for the folders, `fileIn` again inside `copyPicked`, and `.typeRegular` for the source.

**N-B2 (carried).** The protection class of the copied original and of the JPEG (SEC-R15) is still a device check. The app default is `NSFileProtectionCompleteUntilFirstUserAuthentication` (app.config.ts:93), and a clone made by `copyItem` probably keeps it (unverified). The two-line explicit `.protectionKey` set from round 3 still applies. It would also make the N-B3c protection-downgrade edit visible as a changed pin.

**N-W2. The body's wording.**
- "The app does ask for the microphone and Face ID" leaves out notification permission, which the app also requests (scheduler.ts:302, plan-reminders.ts:166). The claim this PR adds no permission is accurate.
- "The scan reports 37 problems on the 1356cb8a module" came from the round-3 scan. The head scan reports 54 there; it reports 16 on 567de5fb, as the body says.
- "Every POSIX file call" is wider than the ban (N-B3c item 1).

### Not verified (needs a device, an Xcode run or the first upload)
- Only a device can prove:
  - no Photos prompt, and no entry under Settings > Privacy > Photos;
  - the embedded picker looks and behaves like the presented one (Cancel, swipe-down on the host sheet, one tap picks);
  - a dismissal by navigation (an invite link, a reminder that opens a modal route) resolves null, and the next tap presents a picker;
  - a second tap while the picker is open is refused;
  - a refused presentation answers photo_pick_failed in about 2 s, and a late sheet dismisses itself;
  - backgrounding and locking with the picker open: the session survives, the app-lock cover sits above the out-of-process picker and blocks touches, and the app-switcher snapshot shows the cover;
  - a Live Photo, an iCloud-only picture, and which formats `.current` hands over;
  - expo-file-system's `Paths.cache` URI is accepted by `fileIn` (/var against /private/var, a trailing slash);
  - the protection class of both files, and that neither folder is in a backup;
  - re-encode time and memory for a 48 MP HEIC and a PNG just under 150 MP, alone and while an enhance runs;
  - that scribe-keys calls no longer wait behind a long decode;
  - the output JPEG's segments;
  - leftovers in tmp/ and Caches after a kill during the copy.
- Apple behaviour the documentation I fetched does not settle:
  - That backgrounding or a device lock never calls `viewDidDisappear` on a presented controller.
  - Whether an intermediate controller "simply removed from the stack" gets `viewDidDisappear`. If not, the stale check at Swift:126 covers it on the next call.
  - That `dismiss(animated: true)` never runs `viewDidDisappear` synchronously (N-P2 b).
  - That UIKit never accepts and then aborts a presentation without a completion (N-P2 a).
  - That PHPickerViewController is supported as an embedded child with its full UI (the page lists the iOS 17 `updatePicker(using:)` but has no text on embedding), and that it stays out of process when embedded.
  - That nothing reaches the app's container before `loadFileRepresentation` is called, so a dropped provider writes nothing.
  - That Apple's ICU treats `\z` and `$` the way ICU 74 does here. Apple's NSRegularExpression page documents `\z` as the end of input.
  - Whether `CGImageSourceCreateThumbnailAtIndex` fully decodes a PNG at 4096 px.
  - Whether App Store processing flags expo-file-system's Photos references (ITMS-90683).
- Whether my N-B3c edits compile, for example whether `clonefileat` and `AT_FDCWD` import through Foundation. There is no Swift toolchain here.

Reviewer: independent of the author (CR-44).
