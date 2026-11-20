## Photo with a letter, slice 2b: the photo file layer (BL-931)

**Base:** `feat/mobile-photo-2-native-module`. **Branch:** `feat/mobile-photo-2b-files` (new). Split from #796 (8a026397). Split from slice 2 for size: with this file, slice 2 is 485 code lines.

### What and why
`lib/photos/files.ts` is where picture files live.
- **Where.** The stored copy is `Library/Application Support/photos/<media_id>.jpg` on iOS (ADR 0028 D1, CR-62) and `<files>/photos` on Android. Any other container layout fails closed, so nothing ever goes to Documents (N10).
- **The name rule (M1).** `write` and `remove` accept only the stored shape: letters, digits and dashes, then `.jpg`.
  - `.` would name the folder itself.
  - expo-file-system 57's `create({ overwrite: true })` removes whatever is at the path.
  - So one bad name could have deleted every picture.
- **The temporary files.**
  - The picker's originals go in `Caches/ImagePicker`, the re-encode output in `Caches/ScribePhoto`.
  - They are read and removed only as plain names, judged after decoding, so `%2E%2E` and encoded separators never reach the parent (N5).
  - The re-encode's destination is a new name built here.
- **The stand-in.** `test/helpers/expo-fs-standin.ts` now joins as Paths.join does: dot segments resolve, `%2E` included. `create({ overwrite: true })` on a folder's path removes the folder. So the M1 test fails on the old name rule (shown).

### Rows
ADR 0028 D1; NX-39-R53; C7, C9.

### Tests
9 new in `test/photos-device.test.ts`:
- the picker cache sweep and remove guards, with decoded-name cases;
- the stored name shape, including `.`;
- the iOS and Android paths, and the fail-closed layout;
- `expoBakedFiles` on the phone's folders;
- the ScribePhoto sweep.

### Flag-off proof
`[C9] on a phone with no picture, listing, removing and sweeping make no file and no folder`. Nothing in `src` calls this file yet.

### Not verified
The folder's protection class and its backup flag on a device.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### After the first reviews (Karma, 20 Nov)
Review A and Review B at 29e35220 both found that no test failed if `remove()`'s name guard was deleted. Review B also found the same gap for the launch sweep emptying `photos/`. Commit 52516968 adds the two tests:
- `remove()` refuses names that climb to the database or a recording, a stray `x.png`, `.`, `..` and `""`; everything survives. Deleting the guard turns it red.
- the sweep empties both caches and leaves a stored picture listed. Adding `photos/` to the sweep turns it red.
Slice 2's rounds 2 to 4 (44dd950e) are merged in, so this diff stays slice 2b's own.

### Size (CODE-R02)
5 files, 350 changed lines (171 code, 179 tests), not counting the lockfile and the generated `licences.json`. Within the limit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
