## Review B at f55be7b891632ba3e199a22cf6ba68fc36ee1dc9: PASS WITH NOTES

Lens B (privacy engineer): data rights (deletion, erase, export), what stays on the phone, flag-off behaviour.
PR #835, photo slice 3a (BL-931, NS-01). Head f55be7b8 confirmed from the API. Base feat/mobile-photo-2c-module-hardening at 96c226ac.
Diff reviewed: `git diff origin/feat/mobile-photo-2c-module-hardening...origin/feat/mobile-photo-3-store` (14 files, +672 -8).

### What I read
- The PR body, including Karma's ruling that migration 11 ships unconditionally.
- The whole diff: migrations.ts (migration 11), photos/{device,entry-media,housekeeping,types,files}.ts, capture/{erase,sweep}.ts, erase-everything.ts, store.ts (the Keep move), and both test files plus photos-helpers.ts.
- CLAUDE.md privacy rules. docs/product/prd/01-photo-with-a-letter.md rows NS-01-R15, R16 and R19. ADR 0028 at 1bee878b on #797's branch (docs/adr-photo-seal-find-data-11nov): D1, D5, the tests list, Consequences, and Q4. docs/agents/cto/RULINGS.md CR-62, open items 1 to 7 (backup lines items 4 and 7, export gate BL-868 item 3).
- docs/legal/DELETION_AND_EXPORT_SPEC.md: DATA-REQ-001 (:51), the letter lifecycle (:96-113), DATA-REQ-023 (:254-256), DATA-REQ-024 (:258-259). docs/legal/data-policy.md section 4.4 (:132-145).
- Every way a row leaves the phone at this head. Store paths: store.ts eraseEntry :830, finishServerErased :878, purgeExpired :922, eraseBook :1020, eraseEverythingLocal :1066, finishDiscard :1294 and deleteDraft :1306. Supporting code: wipe.ts bookAudioRows :95-100, allAudioRows :123-128 and removeEverything :135-146; let-it-go.logic.ts :29-39; the callers listen.tsx:435, review.tsx:415, write.tsx:246 and sweep.ts:128; sync/merge.ts :530, :773, :846 and :937. Sign-out (account-deletion/confirm-sign-out.ts:4, "not destructive").
- The sync outbox snapshot (sync/outbox.ts:207 reads `entries` only), the owner backup (backup/local-store.ts: entries and drafts audio columns only), and the recovery export (resilience/recovery-export.logic.ts:33-41: recordings and scribe.db only).
- The later slices, for forward pointers only: the #840 head b5eb5b8a (review-photo.tsx:16, review.tsx:417, listen.tsx:438, photos/hooks.ts:94, photos/attach.ts:46-51).

### What I ran
All runs were in a scratch worktree at f55be7b8 under the scratchpad. node_modules were hard-linked (`cp -al`) from /home/user/earlyletters for the root, apps/mobile and packages/content. The worktree was removed at the end.
- The changed tests, plus every test that drives the real erasers: photos-device, photos-phone, erase-all, sweep.disk, transcribe-adts.disk and qa-kill-harness. 6 files, 184 tests, all pass.
- The full apps/mobile suite: 5046 pass, 73 fail in 8 files (config, privacy-manifest, store-sign-in-capabilities, capabilities, app-lock-wiring, hosting-ios17, preflight-production, licences). Every failure comes from my environment: the main checkout's node_modules lack expo-local-authentication and expo-clipboard, which this head's lockfile has ("Failed to resolve plugin for module expo-local-authentication"; licences: "only in the lockfile walk: expo-clipboard, expo-local-authentication"). The PR touches none of those files or dependencies, and CI "tests and content rules" is green at the head.
- A review probe, not committed: zz-review-835b.test.ts, 10 tests on the erase-all.test.ts harness (real store, real erasers, real launch sweep, expo-file-system stand-in, fetch stubbed to throw). Copy kept at /tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/mut835b/zz-review-835b.test.ts. Each test plants a picture file in photos/ and an entry_media row, then:
  - P1 Erase now on one letter: file and row gone, the other letter's picture kept.
  - P2 the 30-day letter purge at launch (two launches, QE-05): gone.
  - P3 finishErasedLetters on a letter with `sync_state = 'erased'`: gone, nothing fetched.
  - P4 Erase now on a deleted book: the pictures of its live, deleted and typed letters and of its draft are gone; the other book's picture is kept.
  - P5 the day-30 book purge at launch: gone.
  - P6 Erase everything: the photos folder (a stray file too), the Caches/ImagePicker and Caches/ScribePhoto files and every row are gone, nothing fetched.
  - P6b Erase everything with the per-row eraser stubbed: the folder delete alone takes every picture.
  - P7 Let it go on a draft: the file and row STAY until the next launch; the launch sweep then removes both.
  - P8 flag off (EXPO_PUBLIC_PHOTOS unset): launch, capture sweep and photo sweep leave the same files and folders, no photos/ folder, no row, user_version 11, no fetch.
  - P9 a phone with a sync owner keeps a draft that has a picture with photo text and place: one entry.upsert is queued. Its payload holds no media id, photo text, place, `.jpg`, `photos/` or `entry_media`, and no photo_path key at all.
  All 10 pass at the head.
- Mutations, each applied alone and then restored, run against the PR's tests (photos-device, photos-phone, erase-all, sweep.disk; 124 tests) and the probe:

| # | Mutation | PR tests | Probe |
|---|---|---|---|
| M1 | eraseAudioFile drops `erasePictureOf(entryId);` (Erase now, 30-day purge, server-erased, book erase) | RED, source scan only (photos-phone.test.ts:127-132) | RED P1-P5 |
| M1b | the same call commented out | GREEN (survives: the scan regex matches the comment) | RED P1-P5 |
| M2 | erasePictureOf drops the file delete (device.ts:66) | RED (behavioural) | RED P1-P5 |
| M3 | erasePictureOf drops the row delete (device.ts:67) | RED (behavioural) | RED P1-P5 |
| M4 | Erase everything keeps `photosDirectory()` but drops `pictures.delete()` (erase-everything.ts:67) | GREEN (survives) | RED P6, P6b |
| M5 | Erase everything drops 'ImagePicker', 'ScribePhoto' (erase-everything.ts:51) | RED, source scan (photos-device.test.ts:278-283) | RED P6 |
| M6 | the launch sweep drops the purged-owner file removal (housekeeping.ts:43-47) | RED (behavioural) | RED P7 |
| M7 | the launch sweep drops `picked.sweep()` (housekeeping.ts:22) | RED (behavioural) | GREEN (the probe does not cover it) |
| M8 | the capture sweep no longer starts the photo sweep (sweep.ts:69) | RED, source scan | RED P7 |
| M9 | Keep no longer moves the draft's row (store.ts:512) | RED, source scan | RED P9 |

- Check-runs at the head, read from the API (item 6 below).

### Findings

Must fix: none. No path at this head leaves a stored picture or its row behind after an erase, and no picture data is queued or sent. Every erase path removes the picture file, then its row, through the one eraser: eraseAudioFile at capture/erase.ts:38 calls erasePictureOf (device.ts:61-69), and store.ts hands that eraser to:
- eraseEntry (:853), which serves Erase now on a letter (P1);
- finishServerErased (:886), for a letter erased on another phone (P3);
- purgeExpired, through eraseEntry and eraseBook (:926, :932, :936), for the 30-day purge of a letter (P2) and of a book (P5);
- eraseBook (:1026), which serves Erase now on a deleted book (P4);
- eraseEverythingLocal (:1073), for Erase everything (P6).
Erase everything also deletes the whole photos folder (erase-everything.ts:63-70) and both picker caches (:51), and removeEverything clears entry_media as one more table (wipe.ts:135-146). None of these reads the photos switch.

Notes:

1. Let it go does not remove a draft's picture when the person lets the draft go. Only the next launch's sweep removes it (housekeeping.ts:40-50).
   - letItGo (let-it-go.logic.ts:29-39) and store.finishDiscard (store.ts:1294-1298) never call erasePictureOf. Neither does deleteDraft (store.ts:1306; callers write.tsx:246 and sweep.ts:128).
   - P7 shows the file and its row stay until the next cold launch. ADR 0028 D5 says "Let it go on a draft does the same for draft_id rows" (file first, then row, at the time).
   - Not reachable at this head: nothing in apps/mobile/src writes a picture. photoDeps, store.put and files.write have no caller, so no draft can own a stored picture, and I hold this as a Note.
   - Forward, and must-fix in the slice that first lets a draft own a stored picture. At the #840 head b5eb5b8a, Review stores the picture against the draft before Keep (components/photos/review-photo.tsx:16, `adoptPendingPhoto(draftId, ...)`). But Review's Let it go (app/review.tsx:417) still has no `dropDraftPicture`; only Listen's has one (listen.tsx:438). From that slice on, a picture the parent let go stays on the phone, and in the iPhone backup, until the next cold launch.
   - Suggested fix (here or in #839): one call in the Let it go steps, after the audio and before finishDiscard, through erasePictureOf. It is synchronous, removes the file first and throws to keep the row, which matches the BL-924 contract. Do the same in deleteDraft.
   - The test title at photos-phone.test.ts:99 ("a let-go draft the same") calls erasePictureOf directly, so it does not show that Let it go reaches it.

2. The tests do not prove that the erase paths reach the picture. Two mutants survive the PR's own tests:
   - M1b: comment out the eraser call. The scan at photos-phone.test.ts:130 matches the commented text.
   - M4: drop the folder delete but keep the `photosDirectory()` call. The scan at photos-device.test.ts:280 only looks for the name.
   - M1, M5, M8 and M9 also turn red only through source scans.
   - Erase now, the 30-day purge, server-erased, book erase and Erase everything with a picture present are the NS-01-R16 and DATA-REQ-024 promises. ADR 0028 asks for "a letter erased on another phone of this author loses its picture here (finishServerErased ...): file gone, row gone, nothing sent" (D5), and "Delete, restore, purge, Let it go and Erase everything ... against the real adapter" (Tests required).
   - Ask: add behavioural tests on the erase-all.test.ts harness. The probe above is a ready model: P1 to P6b fail on M1, M1b, M2, M3, M4 and M5.

3. A replaced or taken-off picture keeps its file until a later step. entryMediaStore.put deletes the owner's old row and inserts the new one (entry-media.ts:49-57), and remove deletes the row only (:60-63). The old file stays until the caller removes it or the next launch sweep counts it as an orphan. At this head nothing calls them. Forward: at #840, removePhotoFromLetter (photos/attach.ts:46-51) removes the row and keeps the file for Undo. Reviewers of 4c should confirm the file goes when the Undo window closes, not only at the next launch.

4. Words from the picture rows can stay in the WAL. Rows the launch sweep deletes (housekeeping.ts:48, :52) hold photo_text and place (L4), and no `compactAfterErase` runs after the sweep, so those page images can stay in scribe.db-wal until the next checkpoint. The normal erase paths delete the picture row before their own checkpoint (store.ts eraseEntry, purgeExpired, eraseBook, eraseEverythingLocal), so this only touches the sweep's leftovers. Harmless today (no text is written). Forward: the slice that first writes photo_text should add a picture case to "erased words leave the database file itself" (erase-all.test.ts:628).

5. Comment accuracy (no behaviour change):
   - migrations.ts:434 says "the push mapper sends photo_path null". P9 shows the payload carries no photo_path key at all (outbox.ts:207 snapshots `entries`; the server field is nullish, packages/api/src/server/sync.ts:618). NS-01-R15 holds, since the server column stays null. Suggest "the push mapper never sends photo_path".
   - sweep.ts:67-68 says the device module is "Loaded on demand so the sweep's own tests and the kill harness do not need the photo device code". But sweep.ts:33 imports ./erase, which imports ../photos/device statically (erase.ts:26), so the module (and expo-crypto) loads with the sweep anyway.

6. Inventory (DATA-REQ-001, ADR 0028 D1 "Inventory row"). entry_media lives inside the local database, which data-policy.md:136 already lists. The pictures folder is a new device store with no row in section 4.4, and :144 (device backup) does not name pictures. No file is written at this head, so the row belongs in the first PR that writes one (3b, #836), as D1's proposed text. As owner of the section 4 classification, I confirm migration 11's levels (migrations.ts:437-446): ids, sizes, dimensions and added_at L2; kind and ext L1; sha256, photo_text and place L4; the picture file C/L4.

7. Copy before the switch turns on: a founder and content item, not code. This PR adds and implies no user-facing claim; the only non-code change is the BOARD.md line. With pictures on, the erase copy under-describes what the code now erases, and the "kept on phone" lines omit pictures:
   - packages/content/src/strings.en.ts:911 (Erase everything body: "This removes every book, letter and recording from this iPhone, and your settings. We hold no copy.");
   - :879 bookBodyThisPhone and :890 bookEraseNowBody ("Every letter and recording ...");
   - :1027 noAccount ("Deleting the app removes its letters and recordings from this phone.");
   - plus the lines ADR 0028 D1 and CR-62 item 4 already name: privacy-policy.md:37, the whereLive and settings.recordings and settings.privacy keys, and pages.en.ts:240.
   Each needs `content` words for pictures, and counsel reads them, before EXPO_PUBLIC_PHOTOS is on in any build. CR-62 items 6 and 7 stay open for the founder: whether the owner backup and the iPhone backup carry pictures. This PR builds the D1 default: no exclusion call under lib/photos, so pictures are in the iPhone backup and the owner backup does not take them (backup/local-store.ts reads audio columns only).

8. Proposed PRD wording, not an edit (requirement docs are not edited here). NS-01-R16 says "Given a letter is deleted, Then its picture file is deleted in the same step", then requires restore with the picture. The code and ADR D5 keep the file while the letter is in Recently deleted and erase it with the letter. Suggest "erased in the same step as the letter (Erase now or the purge)".

### Checks, item by item
1. Erase paths.
   - Erase now on a letter, the 30-day purge, erase on another phone via sync, delete-book Erase now, the day-30 book purge and Erase everything all remove the file, then the row, with the switch on or off (P1-P6; nothing in device.ts, housekeeping.ts or erase-everything.ts reads the switch).
   - Let it go and deleteDraft leave it to the next launch (Note 1).
   - The sync merge deletes other authors' letters (merge.ts:773, :846, :937). Their pictures cannot exist, and the sweep is the backstop.
   - No sign-out path erases anything in this build (confirm-sign-out.ts:4). The device wipe of DATA-REQ-023 is not built; when it is, it should call eraseDeviceFiles so the photos folder goes too.
   - Caches/ImagePicker and Caches/ScribePhoto are emptied at every launch (housekeeping.ts:22, files.ts:119-134) and by Erase everything (erase-everything.ts:51). No erase leaves a kept picture there (they hold only a pick in flight).
2. Flag off: the only on-disk change is the empty table, its three indexes and user_version 11.
   - migrate() writes only `PRAGMA user_version` besides the migration (migrations.ts:505).
   - The PR's test at photos-phone.test.ts:52 and probe P8 show no file, folder or row.
   - No console, analytics, log or crash-report call is added anywhere in the diff, and there is no crash reporter in the app. Errors carry no path in their messages ('photos_folder_unknown', 'photo_path_refused').
   - Every throw is swallowed by its caller: sweepPhotosAtLaunch (device.ts:49-55), and in store.ts eraseEntry, finishServerErased, eraseBook and eraseEverythingLocal (returns 'incomplete').
   - The sweep's counts are discarded (device.ts:51-53).
3. Nothing about pictures is queued or sent (NS-01-R15).
   - No file under src/lib/sync or src/lib/backup reads entry_media.
   - The outbox snapshot reads `entries` only (outbox.ts:207), and probe P9 shows a real Keep payload with no picture data.
   - The owner backup reads audio columns only.
   - The recovery export ZIP copies scribe.db as it sits, so a future photo_text or place travels inside the person's own share-sheet export, as letter words do. No picture file goes into it, and the app sends nothing.
   - The export (BL-933, #829) is untouched, so the BL-868 gate in CR-62 item 3 is unaffected.
4. User-facing claims: none made or implied by this PR. The copy work for pictures is listed in Note 7.
5. Tests run and mutations: above. The changed tests pass. The probe proves every erase path behaviourally. Two mutants survive the PR's own tests (Note 2).
6. Check-runs at f55be7b8 (develop's required contexts: "applied migrations unchanged", "required", "compliance-fence").
   - Required: "required" success; "applied migrations unchanged" success; "compliance-fence" success twice (a third run was cancelled, superseded).
   - Also success: "tests and content rules", "typecheck", "database rules", "edge functions and ops scripts (Deno)", "e2e simulator app", "no e2e seam in store bundles", and "store-profile Release launch" (success in run 44669732401; one other entry skipped).
   - Not required, failed: "iOS simulator build (no signing)", at the link step of EarlyLetters.debug.dylib (xcodebuild exit 65; scribe-photo itself built; no compiler error in any file). The diff changes no native file. The base 2c head's run of the same job is still queued, and #834's passed, so the cause is not known from here. The xcodebuild log artifact host was refused by this session's proxy.
   - Queued: dl01 and dl02.

### Not verified
- Anything on a device: a v10 to v11 upgrade on a phone, the Application Support path on a real container, whether Metro bundles the `import('../photos/device')` at sweep.ts:69 so it runs in a store build (the store-profile Release launch passing is indirect evidence only), and a kill during the photo sweep.
- The cause of the iOS simulator Debug link failure (log artifact unreachable here).
- The full mobile suite in a matching node_modules. 8 files failed here for the missing modules named above, all outside the diff.
- Later slices (#836 to #840) are cited only for forward pointers (Notes 1, 3, 4). They were not reviewed.

Reviewer: independent of the author (CR-44).
