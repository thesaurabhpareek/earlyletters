## Review B at 47c1467f5010fbc1f53cc866270cbaf6a586283a: PASS WITH NOTES
<!-- agent:red-team -->

Lens B: privacy and governance. Two files, `docs/legal/DATA_CLASSIFICATION.md` and `docs/legal/data-policy.md`, +18 -2. The founder merges (D-125).

CI at the head (read 05:57Z): all 11 checks completed, success.

Must fix: none.

### What I checked
- The full diff at the head.
  - `data-policy.md:138` is the new pictures row; `data-policy.md:145` is the iOS backup row.
  - `DATA_CLASSIFICATION.md:658-669` is `entry_media`; `DATA_CLASSIFICATION.md:742-744` are the 4.6 file rows.
- Open items, against CR-62 items 3, 4, 6 and 7 and ADR 0028 Q4. Each is stated as open or as the current default. None is settled.
  - Item 6 / Q4: "not in the owner backup in Build 13 (ADR 0028 Q4 default; open for the founder, CR-62 item 6)", at 658 and data-policy 138.
  - Item 7: "the founder's to change, CR-62 item 7", at 743 and data-policy 145.
  - Item 4: "no parent-facing line says so yet", at data-policy 145.
  - Item 3: "The book export carries no picture yet (BL-933)". This drops ADR 0028:57's proposed "the export carries it (NS-01-R14, D2)", so it takes no side on original or stripped bytes. It matches `export/pack.ts:239` (`photos: 0`).
- Levels against `DATA_CLASSIFICATION.md` section 1 and the comparable rows. All 12 columns of migration 11 (`apps/mobile/src/lib/db/migrations.ts`, version 11, at #840 f811c9a6) are listed. Each level matches the migration comment and a comparable row:
  - `entry_id` and `draft_id` are L3, as `entries.id` and `drafts.id` (rule 1.1.5).
  - `sha256` is L4, as `audio_sha256` (rule 1.1.2).
  - `bytes`, `width` and `height` are L2, as `audio_bytes` and `audio_duration_ms`.
  - `photo_text` and `place` are L4 (rule 1.1.3, free text).
  - `id` is L2, as version ids under rule 1.1.5. The file path holds only the media id, no letter or person id, so it does not reach L3 the way `audio_uri` does.
  - Class C in data-policy matches its section 2 ("photos" is a C example) and the audio row.
- "Never uploaded" against the code at #840. It holds for our servers.
  - The photo code imports no sync, supabase, fetch or api module. This is tested in `photos-surfaces.test.ts:119-124`.
  - The push snapshot carries `photo_path` null and no media key or picture words (`photos-surfaces.test.ts:111-117`).
  - Nothing under `apps/mobile/src/lib/sync` reads `entry_media`.
  - `packages/api/src/server/sync.ts:617-618` keeps `photo_path` nullish.
  - The owner backup (`apps/mobile/src/lib/backup/**`) reads no `entry_media`, photo or database file.
  - The recovery export (`resilience/recovery-export.ts:30-43`) copies Documents recordings and the SQLite folder only. So it carries the `entry_media` rows but no picture file, as the row says.
- Location and caches, against `photos/files.ts`, `baker.ts`, `housekeeping.ts`, `pending.ts`, `components/photos/letter-photo.tsx`, `capture/sweep.ts` and `erase-everything.ts`.
  - The original lands in `Caches/ImagePicker/<id>.img` (`files.ts:79`, `pickerDestination`). The re-encode writes `Caches/ScribePhoto/<id>.jpg`, and `baker.ts:38-52` removes it whatever happens.
  - `sweepPhotos` empties both folders first (`housekeeping.ts:22`). It runs in the launch sweep's `finally` (`sweep.ts:65-69`), once per process after the 18+ gate, and does not read the photos switch.
  - Erase everything adds both folders to `CACHE_COPIES` and deletes the whole photos folder (`erase-everything.ts` diff at #840).
  - `place` is typed only. No GPS or location read exists in `lib/photos`, `components/photos` or the native module. The native re-encode drops GPS (`ScribePhotoModule.swift:225`).
- Erase paths. They match the retention text.
  - `eraseAudioFile` calls `erasePictureOf(entryId)` (`capture/erase.ts` diff). That covers Erase now (`store.ts:830-853`), the 30 day purge (`purgeExpired`, 922-940), an erase on another phone (`finishServerErased`, 878-893) and a book erase (`eraseBook`, 1020-1027, over every letter and draft through `wipe.bookAudioRows`).
  - `erasePictureOf` matches letter and draft ids (`photos/device.ts:93-101`).
  - The launch sweep removes files whose owner is gone, and files with no row.
- Device backup.
  - Pictures sit under `Library/Application Support/photos` (`files.ts:28-33`), with no exclusion call. The only exclusions in the app are `packs`, `remote` (`packs/app-support.ts:38`), `models` and `backup-tmp`. So pictures are in the backup.
  - Both caches sit under `Paths.cache` (Library/Caches), which iOS does not back up.
  - The rows match.
- No child name, transcript or family detail in the added lines. The added lines are ASCII.

### Findings, most serious first
1. Medium (governance, merge order; lives on #836, not here). DATA-REQ-001 wants the inventory in the PR that first writes the store. The first writer is #836, which is open and code only at 3395e5a6 (no `docs/legal` file in the stack).
   - #836's body still says "data-policy.md section 4.4 gains the pictures row" (lines 21-24). That is no longer true.
   - If Karma merges #836 before the founder merges this PR, `develop` holds a device store with no inventory row.
   - Fix on #836: correct its body, and state that it does not merge before #854.
2. Low (truth of wording). `DATA_CLASSIFICATION.md:744` says the original "is read once and removed". The code reads it more than once on the phone:
   - the replace path reads it, asks, then reads it again (`letter-photo.tsx:52,58`);
   - the native re-encode reads the source file (`session.ts:97`);
   - the Ready thumbnail draws it (`pending-photo-thumb.tsx:30`).
   - The retention part is true. Suggested words: "it is kept only while the pick is open (until Keep, a change, Let it go or the end of the Undo window) and then removed". And "can carry its location", since not every picture has one.
3. Low (completeness of retention). `data-policy.md:138` and `DATA_CLASSIFICATION.md:743` name a replaced picture's Undo file. They do not name "Take the photo off" (`attach.ts:46-51`), which also ends the picture's retention and keeps the file for Undo in the same way.
   - Suggested: "A replaced or removed picture's file stays for Undo".
   - This under-describes deletion. It promises nothing false.
4. Low (wording next to a decided item). `data-policy.md:145` puts "Pictures kept with letters are included too" in the same cell after "Decided (D-033):". The parenthesis says it is the founder's to change. But "too" ties it to the decided list.
   - Suggested: start it with "Not part of D-033:", so no later reader quotes it as decided.
5. Low (precision). "Never uploaded" (`data-policy.md:138`, `DATA_CLASSIFICATION.md:743`) sits beside "in the device backup", which the user's iCloud Backup uploads to Apple.
   - Suggested: "never sent to our servers (NS-01-R15)", which is what the code proves.
   - Likewise, "no metadata" (743) is a little wide. `strip.ts:5-6` keeps the JFIF header and the ICC colour profile. "No location, date, device or Exif data" is exact.
6. Low (cross-document, for the founder, who merges both). The open requirements lock #846 (450bcb4a) says something different at `docs/product/prd/01-photo-with-a-letter.md:231`: "`kind`, `ext`, `bytes` L1". This PR puts them at L2.
   - Section 1 supports this PR. L1 is "meant for anyone; publishing it harms no one". `entries.kind` is section 1's own L2 example, and `audio_bytes` is L2.
   - The ids agree: `id` L2, and `entry_id`, `draft_id` L3 (finding X10).
   - The PRD row should follow the inventory. It is `product`'s file. Hand it to `product` before #846 locks, so the two are not merged disagreeing.
7. Info. `DATA_CLASSIFICATION.md:742` renames the old row to "Synced photos (planned)".
   - PRD 01 line 105 says pictures follow the non-sync rule even when co-parent sharing is live. So "planned" states a direction no decision records.
   - Neutral words: "Photos from the server (none built; the `entry-photos` bucket exists, 4.4)".
8. Info (for the owner of DATA-REQ-023, not this PR). The wipe after account deletion is "still to be built" (`capture/recordings.ts:19-20`). When it is built, it must remove the photos folder and both caches as Erase everything does. Until then, the launch sweep removes picture files whose rows are gone.
9. Info. Section 2 of `DATA_CLASSIFICATION.md` makes a recorded encryption control a release condition for every L4 store. The new rows do not name the iOS Data Protection class, and neither do the audio rows. Same shape as today; `privacy` may want one line for all device files.

### Not verified
- No device run. I did not see on a phone that pictures appear in an iPhone backup, that Caches are left out, or which Data Protection class the picture files get.
- That `PHPickerViewController` with `preferredAssetRepresentationMode = .current` hands over a file with GPS. The rows assume it can, which is the safe reading.
- #836 to #840 are open and may still change. I read the stack at #840 f811c9a6 (with #835 at f55be7b8). If a later push changes cache names, erase paths or the sweep, these rows must follow.
- I did not run the mobile test suite. The tests cited above were read, not run.

Reviewer: independent of the author (CR-44).
