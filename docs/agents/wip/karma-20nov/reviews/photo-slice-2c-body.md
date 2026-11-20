## Photo with a letter, slice 2c: scribe-photo module hardening from #834 round 4 (BL-931)

**Base:** `feat/mobile-photo-2b-files` (#841). **Branch:** `feat/mobile-photo-2c-module-hardening`. Split from #796 (8a026397). For the security-architect.

#834 passed both round-4 reviews at 44dd950e, and #841 passed both reviews at 0307ae4e. Their notes are fixed here, so neither needs another round. Commits:
- bcfcaef3: #834's notes;
- e087c129: the board claim;
- 96c226ac: #841's test and comment notes.

### What it closes
- **An early Cancel that drops the next pick** (Review A note 1).
  - PickerHost's `viewDidDisappear` now answers a Cancel only when the sheet is really leaving: `isBeingDismissed || presentingViewController == nil`. react-native-screens' own screens use the same check in their `viewDidDisappear` to tell a dismissed modal (`RNSScreen.mm:1520`, with `isBeingDismissed` at `:1492`).
  - A cover over the sheet, such as Apple's first-run onboarding for an embedded picker, no longer answers null and then drops the pick.
  - The stale check at the next call catches anything else.
- **A presentation UIKit accepts and then drops** (Review A note 2, Review B N-P2 a). The stale check now also counts a freed sheet (`host == nil`) as stale, so the slot cannot stay held.
- **Dismissing before answering** (Review B N-P2 b). A pick now answers first, then dismisses the sheet, so the sheet going away can never answer before the pick.
- **Scan gaps** (Review A notes 3 and 4, Review B N-B3c). Each item below has a red mutant.
  - **POSIX file calls**, banned by name or as a function value:
    - the `*at` family: `renameatx_np`, `clonefileat`, `openat` with `pread` and `pwrite`, `unlinkat`, `symlinkat`, `mkdirat`;
    - `AT_FDCWD`;
    - `Darwin.` and `Glibc.` lookups;
    - `rename` held in a closure.
  - **Other ways out for the original:**
    - `FileManager.contents(atPath:)`;
    - writes to `UserDefaults`, `UIPasteboard` and the keychain;
    - any change to file protection (`setAttributes`, `protectionKey`).
  - **How the sheet leaves:** `viewWillDisappear`, `isModalInPresentation` and `modalPresentationStyle`.
  - **New pins:**
    - `let home`, so both folders stay in Caches;
    - both folder names, counted;
    - the bodies of `cancel()` and `refuse()`, so they cannot be swapped;
    - `answered`, and the weak `host`.

- **#841's notes** (Karma's summary of both reviews at 0307ae4e):
  - The remove-guard test adds `../../Caches/ScribePhoto/b.jpg` and `../../../Documents/x.jpg`, each with a real file on the disk. A guard weakened to "ends in .jpg" now goes red (checked).
  - A one-line test requires the Swift `fileIn` pattern to equal files.ts `PLAIN_NAME`, with `\z` in place of `$`, so the two cannot drift.
  - The picker traversal case now asserts that the file outside the folder survives.
  - The test header says the file holds the file-layer tests, and `PickedFiles.sweep`'s comment (types.ts) says it empties Caches/ScribePhoto too.

### Rows
NS-01-R2, R17, R22; NX-39-R50; C7, C8, C9.

### Tests
`test/photos-device.test.ts`: the Swift scan now has 98 mutants, 24 of them new, and each goes red. The scan reports 5 problems on #834's head (44dd950e), and each new mutant fails on the check meant for it.

**Checks at 96c226ac:**
- tsc shows the 5 known errors;
- the full mobile suite fails only in the 8 baseline files (73 tests);
- packages/content passes 395 of 395;
- added lines are ASCII only.

### Flag-off proof
Unchanged from #834: nothing in `src` calls the module in this slice.

### Not verified
- **The Swift build.** There is no Swift toolchain here, so CI on this branch is the proof. `isBeingDismissed` and `presentingViewController` are UIViewController properties, and react-native-screens reads both in the same callbacks.
- **On a device:**
  - that `isBeingDismissed || presentingViewController == nil` holds when react-native-screens dismisses the sheet by code, and when a controller below it is dismissed;
  - the first-run embedded-picker onboarding, then a pick at once;
  - a swipe-down, and a swipe the parent abandons.
- Carried from #834: the device list, the protection class (a device check), and the link-in-place-of-Caches residual.

### Stack and merge
- 2 (#834), 2b (#841), **2c (this PR, on 2b)**, then 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- 3a merged this branch, and each slice above merged the one below: merge commits, no force push.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
88 changed lines in 4 files against 2b: 18 code lines (the Swift, one types.ts comment and the board line) and 70 test lines. Within the 400-line, 20-file limit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
