## Review A at 44dd950ea831c99f39e11c79cc46d678a4a645ae: PASS WITH NOTES

Lens A: the native module and its JS contract, lifecycle and concurrency, and tests that fail on the old code. Round 4. I checked the head through the REST API at the start and again before writing: 44dd950e, base develop 5dc025d3. develop's tip is still 5dc025d3, which is also the merge base, so the CI merge tree is the head tree.

The round-3 must-fix is fixed. The picker now sits as the only child of a small sheet of ours (PickerHost), and the sheet's `viewDidDisappear` answers a Cancel. That covers every way the sheet can go away, including react-native-screens dismissing a modal it does not own, which no delegate hears. A stale check before the busy check is the second line of defence. Each path settles the promise once and frees the slot, so a later pickOne works. All six lifecycle lines Review A listed are pinned, and each has a red mutant. reencodeUpright runs on its own serial queue, and the name rule ends in `\z`. I found no defect that breaks the feature or loses data. My notes: one early-Cancel path that no app code reaches today, a presentation that never completes, and scan gaps (my probes found 13 green edits).

### What I read
- CLAUDE.md and the PR body at 44dd950e.
- Round-3 comments on #834: "Review A at 567de5fb" (CHANGES) and "Review B at 567de5fb" (PASS WITH NOTES).
- `git diff 567de5fb..44dd950e`, in full: 3 files, +138/-36 (commits 5454dc25 and 44dd950e).
- At the head, in full:
  - `modules/scribe-photo/ios/ScribePhotoModule.swift` (309 lines), `ScribePhoto.podspec`, `expo-module.config.json` and `index.ts`;
  - `src/lib/photos/baker.ts`;
  - `test/photos-device.test.ts`.
- scribe-store, `PlusStoreSheet.swift`:
  - `:80-148`: StoreSheet's busy check, watchdog and tearDown;
  - `:168-170`: onDisappear on the root of an `.overFullScreen` host.
- react-native-screens 4.26.2, `ios/RNSScreenStack.mm`:
  - `:374-567`, `setModalViewControllers`;
  - `:508-545`: a foreign `firstModalToBeDismissed` is dismissed before anything new is presented;
  - `:552-566`: the topmost fallback;
  - `:480-491`: the presentation in `finish`.
- `ios/RNSFullWindowOverlay.mm:142-161`: the overlay view is added to the key window, and no view controller is presented.
- expo-modules-core 57.0.20:
  - `ios/Utilities/Utilities.swift:141-150`, `currentViewController`;
  - `ios/Core/Functions/AsyncFunctionDefinition.swift:20, 138, 207-210`: `runOnQueue` sets `queue` (`:208`), and the call uses `queue ?? defaultQueue` (`:138`);
  - `ios/Api/Factories/AsyncFunctionFactories.swift:36-46` and `ConcurrentFunctionFactories.swift:21-31`. `ConcurrentFunctionDefinition` has no `runOnQueue`, so `.runOnQueue` binds the synchronous `AsyncFunctionDefinition` overload.
  - `.runOnQueue(` is also used by expo-file-system, expo-haptics and expo-constants.
- The app's presenters:
  - `src/lib/transitions.logic.ts:46-57`: `listen`, `review` and `read-together` are fullScreenModal; `write`, `(auth)`, `invite` and `plus/confirmed` are modal;
  - `src/components/app-lock/app-lock-layer.tsx:84` (FullWindowOverlay);
  - `src/components/language/language-picker.tsx:91` (an RN Modal, pageSheet);
  - `src/components/ui/sheet.tsx` (@gorhom BottomSheetModal, a JS overlay);
  - `review.tsx:408` and `listen.tsx:412` (Alert.alert);
  - `app.config.ts:44` (`IOS_DEPLOYMENT_TARGET = '17.0'`).
- Apple:
  - WWDC23 session 10107, "Embed the Photos Picker in your app" (developer.apple.com/videos/play/wwdc2023/10107, transcript), fetched 20 Nov 2026;
  - the documentation JSON for `PHPickerViewController` and `PHPickerConfiguration.mode` (introducedAt iOS 17.0).

### What I ran
I made a scratch worktree at the head with `git worktree add --detach` under the scratchpad. node_modules was hard-linked with `cp -al` for the root, apps/mobile and packages/content (the only package with node_modules). I removed it at the end.
- `vitest run test/photos-device.test.ts`: 7 of 7 pass.
- **The 74 mutants.** I ran them through a copy of the test that printed `swiftProblems` for each one. TOTAL 74, and every one reports 1 to 5 problems. Examples:
  - "not exactly once: the sheet going away answers a Cancel";
  - "forbidden: a POSIX file call";
  - "not exactly once: the re-encode on that queue".
- **Fails on old code.**
  - `swiftProblems` on the 567de5fb Swift reports 16 problems, the body's number. Among them are the stale check, the sheet, the embed, viewDidDisappear, both queue lines, the `\z` rule, and the order of the stale check before the busy check.
  - The head test file with the 567de5fb Swift swapped in: 2 of 7 fail, the scan and the positive control. The file was restored afterwards.
- **ICU 74 on this host**, through ctypes, with the module's name pattern:
  - ending in `$`, it accepts `abc.jpg` followed by `\n`, `\r\n`, U+2028 or U+0085;
  - ending in `\z`, it refuses all four;
  - with either ending, it accepts `abc.jpg` and refuses `a/b.jpg` and `..`.
- **My probe**, 13 throwaway mutants (Notes 3 and 4). All 13 pass the scan with zero problems. The probe files lived only in the worktree and are deleted.
- **The full apps/mobile suite:** 274 files; 8 failed (73 tests) and 266 passed (5007 tests).
  - The 8 are the known baseline: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest and store-sign-in-capabilities.
  - Every one fails on the missing expo-local-authentication or expo-clipboard ("Failed to resolve plugin for module expo-local-authentication"; "only in the lockfile walk: expo-clipboard@57.0.2, expo-local-authentication@57.0.3").
  - This is the same count as round 3.
- `npx tsc --noEmit -p apps/mobile`: the 5 known errors (help-fallback.tsx 1, app-lock/controller.ts 4). None is in this diff.
- **Diff checks against 5dc025d3:**
  - added lines with a non-ASCII character: 0 (also 0 since 567de5fb);
  - size: 835 added and 0 deleted, in 9 files;
  - code is 428 (Swift 309, baker 54, index 24, podspec 22, types 12, config 6, BOARD 1);
  - tests are 407 (359 + 48);
  - this matches the body.

### Round-3 status (Review A at 567de5fb)
- **Must fix 1, a picker dismissed by code left the session stuck: fixed** (Check 1).
- **Note 1, a late picker with dead buttons: fixed.**
  - The completion dismisses a sheet shown after an answer (`:150`).
  - The sheet holds the session strongly (`:283`), so the picker's weak delegate stays alive while the sheet is up.
  - Pinned at test `:115`; the mutant at `:309` is red.
- **Note 2, scan bypasses B1 and B2: fixed.**
  - `replaceItem` is banned without `\b` (test `:172`), and POSIX `rename` and `link` are banned (`:173`).
  - CoreImage and UIImage writers are banned (`:174`).
  - The mutants at `:321-324` are red.
  - Review B's seven N-B3b mutants are red too (`:317, 322, 323, 325-329`).
  - New gaps: Note 3.
- **Note 3, unpinned lifecycle lines: fixed** (Check 3).
- **Note 4, a re-encode source that is a link: open.** It is a body note (N-B1r residual 3), and nothing in the app creates links.
- **Note 5, a failure before `clear` removes a regular file already at `out`: open.** It is harmless with fresh names.
- **Note 6, stale text: fixed.** The test header is at `:2-3` and `index.ts` at `:1-9`.
- **Note 7, a second tap rejects: still a #837 UX choice.** `index.ts:17` now documents it.

### Check 1: every way the picker goes away (ScribePhotoModule.swift)
The slot is claimed in `PickerSession.init` (`:252`). The busy check, the claim and the presentation run on the main actor, with no suspension between them (`:126-151`, inside `MainActor.assumeIsolated`). `finish` (`:270-275`) is guarded by the continuation, clears it, releases `current` only if it is itself, and resumes once. Every caller is main-actor, since PickerSession is `@MainActor` and PickerHost is a UIViewController.

| Path | What runs | Settles | Slot freed |
|---|---|---|---|
| Pick | `picker(_:didFinishPicking:)` `:255-258`: `host?.dismiss`, then `finish(provider)`. The later `viewDidDisappear` `:305-308` calls `cancel()`, which does nothing. | once, with the provider | `:273` |
| Cancel button | the same delegate call, with no results | once, null | yes |
| Swipe-down | the sheet's own dismissal, then `viewDidDisappear` `:307`, then `cancel()`. A swipe the parent abandons calls viewWillDisappear and then viewDidAppear, never viewDidDisappear, so it does not answer. | once, null | yes |
| Code dismisses the sheet | RNS `:508-537`: a foreign `changeRootController.presentedViewController` (our sheet) is dismissed with `dismissViewControllerAnimated:` before a new modal is presented. The sheet is the topmost, so it animates out and gets `viewDidDisappear`. | once, null | yes |
| Code dismisses a controller below | UIKit dismisses everything above it, and the sheet, as the topmost, is the one animated out (for example, RNS `:508` when review or listen is popped). | once, null | yes |
| The watchdog | UIKit refuses: the completion never runs and the closure is dropped, so the sheet is freed (`session.host` is weak, `:245`). After 2 s, `:156` sees `current === session`, `!shown` and `host` nil, so it calls `refuse()` (`:157`). | once, `photo_pick_failed` | yes |
| A late appearance | the completion `:148-150`: `shown = true`, `answered` is true, so `host.dismiss` runs. `viewDidDisappear` then calls `cancel()`, which does nothing. | already settled | already freed |
| Stale at the next call | `:126`: shown, and the sheet freed or no longer presented, so `cancel()` runs, before the busy check `:128` (order pinned at test `:195`). | once, null | yes |

A later pickOne works after every path:
- `current` is nil;
- `currentViewController` (`Utilities.swift:146`) skips a controller being dismissed;
- `:131` refuses a presenter that is itself being dismissed, so a tap within the dismissal animation fails once, with the closed code.

There is no retain cycle:
- the sheet holds the session and the picker;
- the session holds the sheet weakly;
- the watchdog holds both weakly;
- the completion holds both strongly, only until UIKit runs it or drops it.

**What can answer Cancel early and then drop a real pick.**
- If a `.fullScreen` (view-removing) presentation covers the sheet, `viewDidDisappear` runs and answers null. The sheet keeps its session, so the picker stays usable after the cover goes, but a pick then lands in `finish` with no continuation and is dropped.
- No app code does this today:
  - react-native-screens dismisses a foreign modal before it presents (`RNSScreenStack.mm:508-545`). It never presents over ours, except through the topmost fallback (`:552-566`), which needs the stack's `presentedViewController` (which includes ancestors) to be nil while our sheet is up.
  - The three fullScreenModal routes (`transitions.logic.ts:46, 48, 50`) are RNS modals, so they follow the same path.
  - The app lock is a FullWindowOverlay: a view added to the key window (`RNSFullWindowOverlay.mm:161`, `app-lock-layer.tsx:84`). No controller is presented, so there are no appearance callbacks.
  - Alert.alert (`review.tsx:408`, `listen.tsx:412`) does not remove the presenter's view.
  - The RN Modal in `language-picker.tsx:91` is a pageSheet, presented from a controller that would already be presenting our sheet.
  - @gorhom's sheet is a JS overlay.
  - StoreSheet is `.overFullScreen` (`PlusStoreSheet.swift:100`).
- One candidate I cannot rule out: Apple's first-run onboarding for an embedded picker. See Check 2 and Note 1.

### Check 2: PHPicker embedded as a child, on iOS 17+
- **Supported.** WWDC23 session 10107, the iOS 17 release, says: "Unlike the SwiftUI API where you can use the '.photosPickerStyle(.inline)' modifier to embed the picker, you will need to add it as a child view controller to your container controller. You can set the frame of the picker manually or use Auto Layout constraints ... After adding the subview, you just need to notify the picker that it has been added."
  - `:296-303` does exactly that: `addChild`, set the frame with autoresizing, `addSubview`, then `didMove(toParent:)`.
  - The session's embedded-picker API, `PHPickerConfiguration.mode`, is documented as introduced in iOS 17.0.
  - The app's minimum is 17.0 (`app.config.ts:44`).
  - The transcript itself does not state the OS version; the version comes from the WWDC23 release and the `mode` availability.
- The pod says `:ios => '16.4'` (`ScribePhoto.podspec:9`). That is harmless, because the app cannot install below 17.
- Apple's PHPickerViewController page says that in iOS 17 and later the picker ignores touches "while its opacity is anything other than fully opaque". The sheet never changes alpha.
- **Not verified on a device.** The same session says "The first time an embedded picker is displayed, an onboarding UI will automatically appear". Whether a full-size picker hosted as a child counts as embedded, and how that UI is shown, is Note 1.

### Check 3: lifecycle pins and the new scan bans
The six lines Review A listed are each pinned exactly once, and each mutant is red:

| Line | Swift | Pin | Mutant |
|---|---|---|---|
| The slot claim, `PickerSession.current = self` | `:252` | `:110` | `:310` |
| The picker's delegate | `:145` | `:113` | `:311` |
| The swipe and code-dismissal answer (was the presentation-controller delegate), now `viewDidDisappear` calling `session.cancel()` | `:305-308` | `:122` | `:306` |
| The dismissal after an answer, `host?.dismiss` | `:256` | `:118` | `:314` |
| The single resume, `self.continuation = nil` | `:272` | `:112` | `:315` |
| The copy to the checked `out` | `:69` | `:96` | `:316` |

- Also pinned with red mutants:
  - the stale check (`:107`; mutants `:307-308`);
  - the late-sheet dismissal (`:115`, `:309`);
  - the embed (`:121`, `:313`);
  - `session.host = host` (`:113`, `:312`);
  - `return file` (`:94`, `:317`).
- The counts are at `:147-153`: two AsyncFunctions, one `present(`, two `.dismiss(`, one picker, one sheet, one `runOnQueue`, and `reencodeQueue` twice.
- The new bans are at `:168` (`\bphotoLibrary\b`), `:170` (`\blog\b`), `:172-175` (replaceItem, POSIX calls, image writers, other exports) and `:179` (a spaced `PHPickerConfiguration (`).
- The function-body slicer (`:231-232`) still finds reencodeUpright's catch with the `}.runOnQueue(...)` suffix. The "raw error" mutant reports "reencodeUpright: a failure can leave without its own closed code".
- **My bypasses: 13 probes pass with zero problems** (Notes 3 and 4). The two I would act on:
  1. **The POSIX `*at` family.** These all pass:
     - `renameatx_np(AT_FDCWD, url.path, AT_FDCWD, out.path, 0)`, which moves the original, location and all, over the JPEG name;
     - `clonefileat(...)`;
     - `openat` with `pread` and `pwrite`;
     - `unlinkat`.
     The ban at `:173` matches only the exact names, followed by `\s*\(`.
  2. **`UserDefaults.standard.set(FileManager.default.contents(atPath: url.path), forKey: "p")`.** This puts the whole original into the app's preferences plist, which is backed up. `contents(atPath:` does not match `contentsOf`. The same read into `UIPasteboard.general.setData` also passes.

### Check 4: the re-encode queue and the name rule
- `private static let reencodeQueue = DispatchQueue(label: "scribe.photo.reencode", qos: .userInitiated)` (`:59`). A DispatchQueue made with only a label and a qos is serial.
- `}.runOnQueue(ScribePhotoModule.reencodeQueue)` (`:84`) is on the synchronous `throws -> String` closure.
  - It is an `AsyncFunctionDefinition`, because `.runOnQueue` exists only there and not on `ConcurrentFunctionDefinition`.
  - So the body is dispatched to that queue (`AsyncFunctionDefinition.swift:138`), not to `expo.modules.AsyncFunctionQueue` (`:20`).
  - Both lines are pinned (test `:124-125`), and the mutants for the shared queue and the main queue (`:319-320`) are red.
- The name rule at `:99` ends in `\\z` in the Swift literal, which ICU reads as `\z`. Pinned at test `:92`; the mutant at `:318` is red. ICU 74 behaves as expected (What I ran).

### Check 5: CI at the head
Read through the REST API: 14 of 14 check runs completed with success.
- Required and other checks: required (02:49:48Z), compliance-fence (twice), typecheck, Deno, the B-8 seam check, tests and content rules, database rules, install, native files changed, applied migrations unchanged, agent team consistent.
- **"iOS simulator build (no signing)"**, Debug (job 136046076314): success at 03:03:37Z.
  - It checked out "74481fe Merge 44dd950e... into 5dc025d3..." (log line 119), with Xcode 26.6 (line 190).
  - Notices: "1923 warnings in total" (line 1104) and "scribe-photo (ScribePhoto): built" (line 1108).
  - The warning list is capped, so I cannot see whether ScribePhotoModule.swift drew a warning.
- **"store-profile Release launch (testflight env, no seam, 20 s)"** (job 136045970074): success at 03:08:31Z.
  - Same merge commit (line 119), `-configuration Release` (line 613), "** BUILD SUCCEEDED **" (line 640).
  - Notice: "the store-profile app is up 20 s after launch, no fatal exception" (line 742).
- So PickerHost, its `init?(coder:)` that returns nil, the `@MainActor` session and `.runOnQueue` all compile in Swift 5.9 mode. Neither build calls the module.

### Must fix
None.

### Notes (none holds the merge)
1. **An early Cancel then a dropped pick** (`:305-308`, `:255-257`).
   - This is the author's full-screen-cover case. No app code covers the sheet today (Check 1).
   - The one candidate: Apple's first-run onboarding for an embedded picker (WWDC23 10107). If the in-process picker presents that onboarding full screen, the very first pick in a fresh install answers null and drops the pick.
   - Cheap belt: answer in `viewDidDisappear` only when the sheet is really leaving (`isBeingDismissed || presentingViewController == nil`), and let the stale check at `:126` catch the rest. Pin that with a mutant.
   - Device check: the first open after install, then pick at once.
2. **A presentation UIKit accepts but never completes leaves the slot taken** (`:156`, `:126`).
   - The watchdog returns when `presentingViewController` is set, and the stale check needs `shown`. So a sheet that UIKit holds as presented but that never appears keeps `current` until relaunch.
   - This is the same as StoreSheet (`PlusStoreSheet.swift:116`), and very unlikely.
   - It could be closed by treating `!shown` after the timeout as stale, or by re-arming the watchdog while `!shown`.
3. **Scan gaps that put the original or its location outside the clean JPEG.** None is in the code. The scan is a guard; the stewards' read is the control.
   - The POSIX `*at` family (`renameatx_np`, `clonefileat`, `openat` with `pread`/`pwrite`, `unlinkat`) passes test `:173`. So the body's "every POSIX file call (... and the rest)" is too broad.
   - `FileManager.default.contents(atPath:)` into `UserDefaults` or `UIPasteboard` passes.
   - Fix:
     - ban `\b\w*(rename|link|clone|copyfile|open|read|write|unlink|remove)\w*\s*\(` with an exception for the counted `write`, or allowlist the called identifiers;
     - ban `contents\(atPath|UserDefaults|UIPasteboard|NSKeyedArchiver`.
   - Compiling these probes is unverified, since there is no toolchain here. `renameatx_np` and `clonefileat` are Darwin C APIs.
4. **Lifecycle edits that still pass the scan.**
   - Answering Cancel in `viewWillDisappear`: an abandoned swipe would then drop the pick that follows.
   - Swapping the bodies of `cancel()` and `refuse()` (`:261-268`): a swipe-down then fails, and a refused sheet returns null.
   - `answered` hard-wired to false (`:247`): a late sheet stays up.
   - A strong `host` (`:245`): a retain cycle that leaks the sheet and the picker.
   - Also green: `isModalInPresentation = true`, a `.fullScreen` sheet, and `shown = true` before presenting.
   - Fix: pin `  func cancel() {\n    finish(.success(nil))\n  }` and refuse's body as blocks, pin `:245` and `:247`, and ban `viewWillDisappear|isModalInPresentation|modalPresentationStyle` (none of them appears in the module).
5. **Carried, documented in the body:**
   - the iCloud wait has no progress or Cancel, and a `loadFileRepresentation` that never calls back leaves that one call unsettled (`:164-179`). It goes to #837, and the slot is already free.
   - The re-encode keeps running after the baker's 20 s timeout. A second bake now queues behind it on the serial queue, so its own 20 s can run out while it waits.
   - The single picker covers the presentation, not the copy (`index.ts:8-9`).

### Not verified
- Every UIKit behaviour above comes from source, Apple's text and CI logs, not from a run. There is no Swift toolchain or device here.
- **On a device:**
  - that the hosted picker looks like the presented one and its Cancel calls the delegate;
  - the first-run embedded onboarding (Note 1);
  - that an RNS route change (an invite link, a reminder tap, or leaving review or listen) answers null, and that the next tap presents a picker;
  - that a swipe the parent abandons does not answer;
  - that a picker sheet hidden under another presented controller gets `viewDidDisappear` when a lower controller is dismissed. If it does not, the stale check covers the next call, but the first call waits until then.
- Whether UIKit ever defers this presentation past 2 s, or accepts it and never completes it (Note 2).
- That my probe mutants compile.
- The PR's device list (formats, sizes, iCloud, protection class, backup), unchanged from round 3.

Reviewer: independent of the author (CR-44).
