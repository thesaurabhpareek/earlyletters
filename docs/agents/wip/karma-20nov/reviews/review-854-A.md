## Review A at 47c1467f5010fbc1f53cc866270cbaf6a586283a: PASS WITH NOTES

Lens A: correctness and accuracy. Two files under `docs/legal`, +18 -2: `DATA_CLASSIFICATION.md` (4.5 `entry_media`, 4.6 three rows) and `data-policy.md` (4.4 one new row, one clause on the device backup row). Founder merges (D-125, D-132).

### Read
- PR body. `DATA_CLASSIFICATION.md` at the head: section 1 and rules 1.1.1 to 1.1.9 (:44-65), 4.5 (:597-735), 4.6 (:736-756), the new rows at :658-669 and :742-744. `data-policy.md` 4.4 at :134-147, new row :138, backup row :145.
- `docs/agents/cto/RULINGS.md` CR-62 (open items 3, 4, 6, 7) and CR-64 on develop 20553b18; `docs/adr/0028-photo-seal-find-on-device-data.md` D1, D5, Q4.
- develop: `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:28-47,65-104,185-186` (originals copied as-is into `Caches/ImagePicker`; re-encode into `Caches/ScribePhoto`), `apps/mobile/src/lib/photos/files.ts:1-36,96-148`.
- Migration 11 on #835 (f55be7b8) and #836 (3395e5a6): the table at `migrations.ts:428-469`; 14239a08 corrects the level comments to the ones this PR states.
- The stack top, #840 (f811c9a6): `photos/device.ts:80-101` (`sweepPhotosAtLaunch`, `erasePictureOf`: file, then row), `photos/housekeeping.ts:20-66`, `photos/entry-media.ts:53-79`, `photos/attach.ts:24-64`, `photos/pending.ts:1-124`, `photos/session.ts:83-147`, `photos/baker.ts:35-53`, `photos/strip.ts:5-8,90-115,141-160`, `photos/files.ts:79` (`<id>.img`), `capture/erase.ts:31-72`, `capture/sweep.ts:62-75`, `erase-everything.ts:51-80`, `store.ts:830-866` (eraseEntry), `:878-896` (finishServerErased), `:922-939` (purgeExpired), `:1020-1041` (eraseBook), `:1066-1086` (eraseEverythingLocal), `:1293-1330` (finishDiscard, deleteDraft), `db/repos/wipe.ts:95-148`, `sync/merge.ts:755-779,842-847`, `backup/local-db.ts:60-130`, `resilience/recovery-export.ts` (foundFiles), `export/pack.ts:239`, `packs/app-support.ts:21-42`, `model-files.ts:41-43`, `packages/api/src/server/sync.ts:618`.
- Review B on #836 (comments, for what the rows were asked to say).

### Ran
- In a scratch worktree at f811c9a6 (root `node_modules` linked): `vitest run test/erase-all.test.ts -t picture`: both `[NS-01-R16]` erase-path tests pass (Erase now on a letter, a letter erased on another phone, Erase now on a book, the 30 day letter and book purges, the picker cache sweep). `photos-phone.test.ts` and the `[NX-39-R53][C7]` and `[ADR 0028 D1]` blocks of `photos-device.test.ts` pass. 9 other tests in those files fail here only because the linked `node_modules/@scribe/content` resolves to this checkout's older `packages/content`, not the branch's (string tests); they say nothing about these rows.
- `git merge-tree --write-tree origin/develop <head>`: clean. develop moved to 20553b18 (CR-64, CR-65); neither touches these files.
- Check-runs at the head: all completed, success.

### Levels, against section 1 (each row checked)
- `id` L2: a media id, not a letter id. Rule 1.1.5 does not name it; it follows "version ids" (L2) there, and the file name holds only the media id, never a letter id (`files.ts:3-5,41`). Agrees.
- `entry_id`, `draft_id` L3: rule 1.1.5 (letter ids), and they hold the same values as `entries.id` and `drafts.id` (L3 at :605 and :639). Correct; corrects ADR 0028 D1's L2.
- `kind`, `ext` L2: enums, as `entries.kind` (:47). `bytes` L2: a count, as `audio_bytes`. `width`, `height`, `added_at` L2: an irreversible reduction (rule 1.1.2) and a system timestamp, as `audio_duration_ms` and `captured_at`. Correct.
- `sha256` L4: rule 1.1.2, as `audio_sha256`. `photo_text` L4: free text, rule 1.1.3, CHECK 140 (`migrations.ts`). `place` L4: free text and a place, CHECK 60; only ever the typed value (`session.ts` uses `normalizePhotoPlace(input.place)`; `strip.ts` reads no place). Correct.
- The picture file and both caches L4, class C: content and child images (section 1, rule 1.1.6). Correct.

### Erase paths named in the retention text (each one deletes the file, then the row)
- Erase now on a letter: `eraseEntry` calls the eraser before the row goes (`store.ts:853`); the eraser calls `erasePictureOf` (`erase.ts:41`; `device.ts:93-101`).
- Erase now on its book, and the day-30 book purge: `eraseBook` erases every letter and draft of the book, typed ones included (`wipe.ts:95-100`; `store.ts:1025-1030`).
- The 30 day purge: `purgeExpired` through `eraseEntry` and `eraseBook` (`store.ts:922-939`); with sync, the server's purge arrives as `erased` and goes through `finishServerErased`.
- An erase on another phone of the author: `markGone` sets `erased` (`merge.ts:755-763`), then `finishServerErased` runs the eraser (`store.ts:878-896`).
- A let-go draft: at once from #839 (c12e13ff; `store.ts:1308-1316,1328`); before that, the launch sweep (`housekeeping.ts:40-50`). The PR body says so.
- Erase everything: every row's eraser, the whole `photos` folder and both cache folders (`erase-everything.ts:51,63-70`), then every table from the schema (`wipe.ts:135-148`).
- App deleted: iOS removes the container. Not code; true by the platform.
- Replaced picture: `put` drops the old row (`entry-media.ts:64`); the file goes at settle after the 10 s window (`attach.ts:62-64`) or, at the latest, as a file with no row at the next launch sweep (`housekeeping.ts:56-64`). Accurate.

### Other claims, checked
- Folder names, at f811c9a6: `Caches/ImagePicker` and `Caches/ScribePhoto` (`files.ts:19-21`; Swift `fileIn` under `.cachesDirectory`), `<id>.img` (#837 on, `files.ts:79`), `<id>.jpg` (`files.ts:145`), `Library/Application Support/photos/<media_id>.jpg` (`files.ts:28-33`).
- Backup: no exclusion call for pictures; the only callers are `packs/app-support.ts:38` (packs, remote) and `model-files.ts:43`. Application Support is backed up and Caches is not (Apple's guide, as quoted in ADR 0028 D1). The rows claim backup only for pictures and say nothing about the caches. Correct.
- Never synced or pulled: no `entry_media` in `lib/sync`; the contract's `photo_path` is nullish (`packages/api/src/server/sync.ts:618`); test `photos-surfaces.test.ts:111`.
- Owner backup reads audio columns only (`backup/local-db.ts:66-68,100-102`). Book export writes `photos: 0` (`export/pack.ts:239`). Recovery export takes recordings and the SQLite folder only, so rows go and picture files do not.
- Open founder items are stated as open, not settled: CR-62 item 6 (`DATA_CLASSIFICATION.md:658`, `data-policy.md:138`), item 7 (`:743`, `:145`), item 4 (`:145`), item 3 left open ("no picture yet (BL-933)", `:138`). No parent-facing promise is added: both files are draft-for-counsel, and no `packages/content` file changes.
- ASCII only in the added lines.

### Findings, most serious first
1. Low. The retention text names "a replaced picture" but not a picture taken off a letter ("Take the photo off", `attach.ts:46-51`). It behaves the same way: the file stays for the Undo window and goes at settle or at the latest at the next launch. Suggest "A replaced or removed picture's file stays for Undo, ..." in `data-policy.md:138` and `DATA_CLASSIFICATION.md:743`.
2. Low. "(iOS; the stripped copy, no metadata)" (`DATA_CLASSIFICATION.md:743`) is broader than the code: the stored JPEG keeps the JFIF header, the ICC colour profile and Adobe's colour flag (`strip.ts:5-8,98`). Counsel may read "no metadata" literally. Exact words: "no Exif, XMP, IPTC, GPS, comment or thumbnail".
3. Low. "A pick in flight only" and "it is read once and removed" (`:744`; `data-policy.md:138`). The original stays in `Caches/ImagePicker` for as long as the picture is pending before Keep, which can be a whole recording (`pending.ts:1-5,111-123`). JavaScript reads it once at Keep (`pending.ts:116`), and for a HEIC, a PNG or a turned JPEG the native re-encode reads it a second time (`baker.ts:38-46`; `ScribePhotoModule.swift:185` on develop). Suggest "a picture chosen and not yet kept; used once, at Keep, and removed".
4. Info. The 4.5 heading still says schema "version 4" (`:597`); develop is at 10 and the stack at 11. The body says it is left alone; fine for this PR, worth a later line.
5. Info, merge order. The rows describe the stack at #840. CR-64 (pre-mortem 1) wants them on develop with #835, because migration 11 reaches every phone with the switch off. The founder can merge this before or with #835; an empty table and an inventory row ahead of code harm nothing.

Must fix: none.

### Not verified
- Nothing ran on a phone. Data Protection class of the photos folder (the default "until first user authentication" is assumed, as for recordings).
- That iOS really leaves `Caches/ImagePicker` out of the device backup on the current iOS (Apple's documentation, not a device test).
- The full mobile test suite at the stack top (my worktree resolves `packages/content` to another commit).

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
