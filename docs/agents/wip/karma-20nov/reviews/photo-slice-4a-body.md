## Photo with a letter, slice 4a: the system picker adapter and the pending picture (BL-931)

**Base:** `feat/mobile-photo-3b-stored-copy`. **Branch:** `feat/mobile-photo-4a-pending`. Split from #796 (8a026397).

### What and why
- **The picker port.** `picker.ts` is the one file that calls scribe-photo's `pickOne`: Apple's PHPickerViewController with no photo library, so no permission is asked (slice 2).
  - It builds the destination (`pickerDestination`, a new plain name in Caches/ImagePicker).
  - It keeps the uri only when the native side answers with that destination.
  - Cancel is `cancelled`, and any failure is `failed` with no native text.
  - No picker package is used anywhere.
- **The pending picture.** `pending.ts` holds the picture chosen before a letter exists, in memory only. It removes the picker's original whatever happens.
- **Adopting it.** `adopt.ts` stores it for a draft or a letter and never un-keeps a letter. `failures.ts` marks a picture that did not come along, for this run only.
- **The switch and the pause.** `flag.ts` reads `EXPO_PUBLIC_PHOTOS`: only "on" turns it on. `pause.ts` reads the remote pause, which can hide the surfaces and never turn them on.
- **Registration.** `device.ts` registers the picker and the pending picture only with the switch on and the native picker present.

### Rows
NS-01-R2, R17, R19, R22; NX-39-R2, R37, R50, R53; C5 to C8.

Round 4 adds three tests to `photos-device` (C6): one pick at a time with Cancel ending the wait and the late copy removed; the lock case, with a pin on `device.ts`'s wiring; and the late copy after a cancel. Each fails on the old `picker.ts`.

### Tests
21 new:
- `photos-device` (18): the source scan finds no picker, camera or media-library package or call anywhere and `pickOne` in one file, with a positive control; the port (its destination, Cancel, another file's uri, native text); temporary originals; the not-saved mark; the pause; data rights that never read the switch.
- `photos-phone` (2): nothing registers with the switch off, and nothing registers without the native picker.
- `photos-surfaces` (1): the switch and the pause.

### Flag-off proof
`[NS-01-R19] with EXPO_PUBLIC_PHOTOS unset nothing registers: no picker and no pending picture, so no photo start can draw`.

### Not verified
- Apple's picker on a device: no prompt, Cancel, the iCloud-only wait and a Live Photo's still.
- A Cancel during an iCloud download: the wait ends at once, and the copy that lands later is removed.
- The lock coming up over an open picker: a pick made then is not taken, and the parent can pick again after unlocking.

### The items #834's reviews deferred here (3ed28174)
- **One pick at a time.** A second `open()` while a pick runs answers `cancelled` at once and calls nothing native, so a second tap never shows a failure (#834 Review A round-3 note 7).
- **Cancel ends the wait** (#834 Review A note 3). `cancel()` now settles `done` with `cancelled` at once. Before, it only set a flag, and `done` waited for `pickOne`, so an iCloud download could hold the photo start until it finished.
- **A late copy is removed** (#834 Review B N-P2 d). A copy that lands after the app stopped waiting is removed through the picker folder's remover, not left for the launch sweep.
- **The app lock** (#834 Review B N-B7).
  - The lock cover is a window overlay, not a presentation (`app-lock-layer.tsx`, `RNSFullWindowOverlay.mm:161`), so the picker may stay usable while the lock is up.
  - A pick that lands while the lock is up (`getAppLockState().locked`) is not taken: the run answers `cancelled`, and the copy is removed. So nothing chosen above the lock reaches the book; the parent picks again once it is open.
  - A lock state that cannot be read counts as up. `device.ts` reads the lock only when a pick lands, so it loads no lock code before then.
- **Navigation.** Since #834 round 3, scribe-photo answers null when the app dismisses the picker by code (react-native-screens on a route change), and this port maps that to `cancelled`.
- **Permissions.** This PR asks for no permission. The app as a whole asks for the microphone, Face ID and notifications, as on develop. The picker needs no photo-library permission.
- **Pick destination names.** #834 refuses any pick destination that is not a plain name directly inside Caches/ImagePicker, and `pickerDestination` builds exactly that.

### Still open: iCloud download progress, and a native Cancel (NS-01-R17)
- NS-01-R17 asks that an iCloud-only picture download "with progress and Cancel".
- This PR ends the app's wait on Cancel, but two things need scribe-photo:
  - **Progress.** pickOne still discards the item provider's `Progress`, so `onProgress` is never called.
  - **Stopping the download.** The native download carries on after Cancel; only its copy is removed afterwards.
- Both need two APIs I could not confirm from the SDK or node_modules sources: `Progress.fractionCompleted` observed with KVO, and `Progress.cancel()` on an item-provider load. Neither appears in any installed Swift or Objective-C source, so I did not write them.
- They also need a new scribe-photo event and export, which the #834 and 2c scan would have to allow. That belongs in a scribe-photo change, with a device check of what `.current` does for an iCloud-only picture.

### Reviewer note
- #796's `PendingPhoto` keeps an Undo for a pick replaced before Keep, and no screen calls it. Design spec 01 section 4 says a change before Keep needs no Undo.
- It is left as #796 has it, for you to keep or drop.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 699 changed lines in 15 files against the 400-line, 20-file limit, not counting the lockfile and the generated `licences.json`. 363 lines are code and 336 are tests (round 4 added about 50 of each). The tests are the requirement-row proofs and the flag-off proof, each of which fails on the old code; splitting them from the code would leave the code unproven. Same shape as #828. The founder accepts or refuses this exception; the merge waits for that.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
