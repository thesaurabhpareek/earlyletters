Agent: mobile
Mode: task BL-931
Satisfies: NS-01-R15, R16, R21; ADR 0028 D1, D5; BL-957 (the database ceiling half)
Data classes touched: C (entry_media rows and picture files, phone only), L2 and L3 ids

## Photo with a letter, slice 3a: local migration 11, the entry_media store and the photo sweep (BL-931)

**Base:** `develop` (retargeted after #842 merged; this branch merged develop with #842 squashed as ea31f09d). **Branch:** `feat/mobile-photo-3-store`. Split from #796 (8a026397). After ADR 0028 (CR-62).

**Both reviews must be redone at the final head.** This round changes migration 11's SQL (3b1df635) and merges 2c and develop (af7397df, 447611c2), so the PASS WITH NOTES at f55be7b8 no longer counts.

### This round: the word checks are ceilings, not the limit (BL-957, 3b1df635)
- Migration 11's CHECKs are now `length(photo_text) <= 1120` and `length(place) <= 480` (`migrations.ts:462-463`).
- The app's limit is 140 and 60 characters a person sees (grapheme clusters), counted in #836. The database counts code points, as a safety net against unbounded rows: 8 per character, so it admits every value the app keeps. A Devanagari conjunct or an emoji family is several code points, which the old 140 and 60 refused.
- Migration 11 has not shipped to any phone (no TestFlight build carries version 11), so it may still change.
- Test: `photos-device.test.ts` asserts the ceilings (1120 and 480 pass, one code point more fails). It fails on the old SQL.

### What and why
- **Migration 11.** It adds the phone-only `entry_media` table and its three indexes, as ADR 0028 D1 specifies. No row changes, nothing is queued for sync, and the comment now reads `Library/Application Support/photos/<id>.jpg`.
- **The store.** `entry-media.ts` is the store over the table. `deletedAt` is derived from the letter by join and never written.
- **The phone wiring.** `device.ts` holds:
  - the phone deps: the store, the files, uuidv7, SHA-256 and slice 2's re-encode;
  - `erasePictureOf`, called inside the one audio eraser, so Erase now, the 30 day purge and a letter erased on another phone remove the file, then the row;
  - the launch sweep (`housekeeping.ts`): it empties both caches, hands a draft's picture to its letter after a kill, and removes strays.
- **Keep.** `store.saveLetterFromDraft` moves a draft's row to the letter in the letter's own transaction.
- **One guard for every stored picture** (c3eaabca, #841 Review B round-1 N3).
  - files.ts exports `storedPhotoFile(mediaId)`: the picture's file, built with the same name rule as `write` and `remove`, or null when the id cannot make a stored name.
  - `erasePictureOf` deletes through it. 4c's `photoUri` uses it too, so every delete and every drawn picture passes one guard.
  - The rule `<media_id>.jpg` now lives once, as `isStoredName` in types.ts.
  - Test: a row whose id climbs to Documents loses its row, and the .jpg it names survives. It fails on the old eraser.
- **The sweep counts only what it can remove** (#841 Review A round-1 note 8). A file whose name is not the stored shape is neither removed (`remove` refuses it) nor counted. The sweep test now leaves `half.jpg.part` and counts one orphan; it fails on the old sweep.
- **Erase everything.** It deletes the photos folder and both caches. If the folder detection fails closed (an unknown container layout, slice 2b), no picture was ever written, so that step is skipped; any other error still stops the erase.

### Karma's ruling: migration 11 ships unconditionally
I'm keeping migration 11 outside the switch, as written here. The reasons:
- Migration 11 is not behind `EXPO_PUBLIC_PHOTOS`. With the switch off, a phone gains one empty table and `user_version` 11, and nothing else.
- Gating the migration list would stop a phone at launch, with a newer-file error, when it moves from a switched-on TestFlight build to a switched-off store build.
- Gating only the CREATE would leave such a phone without the table forever, unless a second, lazy create and guards were added on every eraser and on Keep.
- ADR D1 and CR-62 say migration 11 ships with photos, and NS-01-R19 says the data rights work with the switch off.
- The way back is a later migration that drops the empty table; no phone data depends on it while the switch is off. Karma

### Rows
ADR 0028 D1 and D5, NS-01-R16, NS-01-R19 (data rights), C7, C9.

### Tests
16 new:
- `test/photos-device.test.ts` (10): the migration and its checks, the store, the sweep, the draft hand-over, the erase-everything folder.
- `test/photos-phone.test.ts` (6): the phone deps, the eraser and its stored-name guard, and the flag-off proof, over SQLite and the file stand-in. These replace #796's tests of `lifecycle.ts`, which nothing in the app called.

### Notes after the reviews at f55be7b8 (written, not code)
The reviews' code notes on this slice are fixed in the slices above, so this head stands:
- **in 3b (#836):** the behavioural erase tests, `put()` refusing an unknown owner, the cache folder names, the sweep comment and the inventory rows;
- **in 4c (#839):** Let it go and `deleteDraft` taking a draft's picture.

Three stay as notes:
- **The sweep drops a row on a listing alone** (review A N5).
  - On iOS a failed listing throws and a missing folder lists as empty, which is right.
  - On Android, expo-file-system lists an unreadable folder as empty, so every row would be dropped, with the parent's words and place.
  - Before Android: check that a file is really missing before dropping its row, or skip that pass when the listing is empty but rows exist.
  - The sweep is also safe against a pick in progress only because writers put the row in the same tick as the file (3b's `commitPhoto`).
- **Old builds leave files after an erase** (review A N6). A phone that ran a photos-on build and then a v10 build:
  - that build's Erase now and Erase everything remove the rows (`removeEverything` reads the schema) but leave the files in Application Support/photos, which are also in the iPhone backup;
  - they stay until a v11+ build's sweep.
  - This is inherent; a line in the TestFlight notes would help.
- **The way back needs a folder delete** (review A N6). "A later migration drops the empty table" is SQL only. On any phone that ever ran with the switch on, it would leave pictures in photos/ with nothing left to sweep them, so the drop needs a folder removal at launch with it.

### Flag-off proof
`[D1] with nothing picked (EXPO_PUBLIC_PHOTOS unset), a phone on 10 gains only the empty table: the launch sweep and the eraser make no file, folder or row`.

### Not verified
A device upgrade from a v10 database, and a kill during the sweep on a phone.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 684 changed lines in 14 files against develop (measured from the merge base, ea31f09d), not counting the lockfile and the generated `licences.json`. 331 lines are code and 353 are tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
