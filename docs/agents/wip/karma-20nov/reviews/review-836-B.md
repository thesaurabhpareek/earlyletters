## Review B at 4596b3c11db1d910eee527d6e65313590337ad2a: PASS WITH NOTES

Lens B (privacy engineer): data rights, what is stored and where, metadata, the data inventory, and flag-off behaviour. Diff: `origin/feat/mobile-photo-3-store...origin/feat/mobile-photo-3b-stored-copy` (base f55be7b8, head 4596b3c1), 17 files.

### What I read
- The PR body. The whole diff:
  - code: photos/{session,strip,text,types,entry-media}.ts, capture/sweep.ts (one comment), erase-everything.ts (the cache folder names);
  - tests: photos-{capture,c8,surfaces,device,phone}.test.ts, erase-all.test.ts (the new picture block), photos-helpers.ts;
  - docs: data-policy.md 4.4, DATA_CLASSIFICATION.md 4.5 and 4.6, the BOARD.md line.
- The code the diff leans on, at the head:
  - photos/{device,housekeeping,baker,files}.ts;
  - capture/erase.ts;
  - store.ts: eraseEntry :830, finishServerErased :878, purgeExpired :922, eraseBook :1020, eraseEverythingLocal :1066, finishDiscard :1294, deleteDraft :1306, and the Keep move :512;
  - let-it-go.logic.ts, sync/outbox.ts entrySnapshot :161-185, backup/local-store.ts :63 and :69, resilience/recovery-export.logic.ts :33-40, migrations.ts migration 11 :428-469;
  - modules/scribe-photo/ios/ScribePhotoModule.swift :28-41 and :182-229 (the re-encode).
- CLAUDE.md privacy rules.
- ADR 0028 on `develop`: D1, D2, D5 and Q4.
- RULINGS.md CR-62, with open items 3, 4, 6 and 7.
- PRD 01: NS-01-R4, R6, R7, R14, R15, R16, R17, R19 and R21, section 6 ("a discarded draft deletes its picture file") and section 7.
- NX-39 founder decision F9 (NX-39-memory-library.md:298).
- DATA_CLASSIFICATION sections 1, 1.1 and 2.
- DECISIONS.md D-132 (:655, :1021-1028) and :1070.
- My own Review B on #835 at f55be7b8.

### What I ran
- A scratch worktree at the head (node_modules hard-linked), now removed.
- The PR's changed tests: erase-all, photos-c8, photos-capture, photos-device, photos-phone and photos-surfaces. 6 files, 114 tests, all pass. The picture erase tests and both probes pass again with `EXPO_PUBLIC_PHOTOS=1`. The only failures in that run are the two probe checks that assert the switch is unset.
- A probe, not committed. It is my #835 probe (P1 to P9) plus six new cases (Q1 to Q6), on the erase-all.test.ts harness: real store, real erasers, real launch sweep, the expo-file-system stand-in, and fetch stubbed to throw. Copy: /tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/mut836/zz-review-836b.test.ts. All 16 pass at the head:
  - Q1: the 30-day purge, settled.
  - Q2: a picture file that will not delete keeps its row and its letter, and a retry finishes.
  - Q3: a replace through commitPhoto leaves 2 files and 1 row.
  - Q4: text in a JPGn (0xF0) segment survives the strip and the guard.
  - Q5: an Exif signature in a kept segment makes commit fail and store nothing.
  - Q6: switch unset, a launch, the sweep and every erase write no photos or cache folder and no row, and fetch nothing.
- Mutations, each applied alone and then restored. "PR tests" means the 6 changed files.

| # | Erase path or guard | Mutation | PR tests | Probe |
|---|---|---|---|---|
| M1 | Erase now, letter | eraseDeletedLetter uses an eraser without erasePictureOf | RED erase-all:1130 | RED |
| M2 | erased on another phone | finishErasedLetters, same | RED :1130 | RED |
| M3 | 30-day purge, letter and book | purgeShelfAtLaunch, same | GREEN (survives) | RED P2, P5; Q1 green (see Note 5) |
| M4 | Erase now, book | eraseDeletedBook, same | RED :1130 | RED |
| M5a | Erase everything | drop the photos folder delete (erase-everything.ts:67) | RED :1155 | RED |
| M5b | Erase everything | drop both cache names (:51) | RED :1155 | RED |
| M6 | launch sweep | drop `picked.sweep()` (housekeeping.ts:22) | RED :1130, photos-device | n/a |
| M7 | let-go draft (at the next launch) | the sweep never sees a draft as gone (housekeeping.ts:40) | RED photos-device | n/a |
| M8 | Keep | move the entry_media update out of the letter's transaction (store.ts:512) | RED :1167 | n/a |
| M9 | eraser order | erasePictureOf deletes the row before the file (device.ts:66-67) | GREEN (survives) | RED Q2 |
| M10 | DQ-R07 | put() no longer throws PhotoOwnerUnknown (entry-media.ts:63) | RED photos-device | n/a |
| M11 | metadata guard | drop the carriesMetadata guard (session.ts:101) | GREEN (survives) | RED Q5 |
| M12 | strip | keep APP1 (Exif, XMP) (strip.ts:98) | RED, 5 tests | n/a |
| M13 | failed write | keep the half-written file (session.ts:132) | RED photos-capture | n/a |
| M14 | strip | copy the bytes after the end marker (strip.ts:64) | RED, 3 tests | n/a |
| M15 | eraser | erasePictureOf drops the file delete (device.ts:66) | RED, 2 tests | RED |

- Check-runs at the head, read from the API (item 6 below).

### Findings

Must fix: none.
- No reachable path at this head leaves a stored picture or its row behind after an erase.
- No picture data is queued, sent, logged or counted.
- The inventory rows are true to the code at this head. Two of them come close to stating an open CR-62 item as settled. Note 1 gives the words; they should change before the founder merges the legal files (Note 3).

#### Classification ruling (I own section 4)
1. `entry_media.entry_id` and `draft_id` are L3, not L2.
   - Rule 1.1.5 (DATA_CLASSIFICATION.md:57): "Book and letter ids are L3 ... they key a child's book and its letters". It names `entries.id` and "every `child_id`", so a letter-id column is L3 by the same rule.
   - Rule 1.1.1 (:53): a column takes the level of what it can contain. Both columns hold the same values as `entries.id` and `drafts.id` (L3, :605 and :639).
   - The same section has no letter id below L3: `sync_outbox.entity_id` is L3 (:678); `orphan_audio.file_name` (:654) and `audio_uri` (:613) are L3 because they contain one.
   - This corrects my own #835 confirmation ("ids ... L2"). That holds for `entry_media.id`, the media id (L2, like version ids under rule 5). The design already matches L3: the file name carries only the media id, never the letter id (ADR D1), so no L3 value goes into a path.
2. `entry_media.bytes` is L2, not L1.
   - L1 means "meant for anyone; publishing it harms no one" (:46). The size of a family's private file is operational data, as `entries.audio_bytes` (:616), `drafts.audio_bytes` (:647) and `orphan_audio.bytes` (:655) are.
   - Rule 1.1.2 lets a size sit below the L4 picture: a byte count cannot be reversed into the picture.
3. Consequences:
   - In this PR, set DATA_CLASSIFICATION.md:663 to L3 and :665 to L2, and drop the "Flagged for `privacy`" text there and the "two flagged rows wait" sentence at :658.
   - Correct migration 11's comment to match (migrations.ts:438-439 entry_id and draft_id L3; :441 bytes L2). It is a comment only, the SQL does not change, and migration 11 is on no shipped build (`develop` has no version 11).
   - ADR 0028 D1's table need not be edited: DATA_CLASSIFICATION is the authoritative level list (:28). `data-architect` may add a pointer at its next amendment.
   - Nothing changes in handling. The table never leaves the phone, and the file is handled as L4 (:599).
4. Same pass, not asked: `kind` and `ext` are better at L2 than L1. Section 1 lists enums as L2, with `entries.kind` as its example (:47), and a later build widens the CHECK. Not blocking; I would change it in the same edit. `width`, `height` and `added_at` stay L2: dimensions can hint at a device model, but they stay on the phone and rule 1.1.9 already keeps them out of analytics.

#### Notes

1. The inventory and CR-62's open items: two lines come close to settled.
   - Owner backup (CR-62 item 6, ADR Q4: the founder with `privacy`, default "no in Build 13", due at the Build 13 freeze).
     - data-policy.md:138 says "not in the owner backup", and DATA_CLASSIFICATION.md:658 says the same.
     - Both are true of the code (backup/local-store.ts:63, :69 read audio columns only), but they read as a standing rule.
     - Suggest: "not in the owner backup in Build 13 (ADR 0028 Q4 default; open for the founder, CR-62 item 6)".
   - iPhone backup (CR-62 item 7; NX-39 F9 is a founder decision not yet taken, "Default if silent: As recommended", NX-39-memory-library.md:298).
     - data-policy.md:145 puts "Pictures kept with letters are included too (NX-39 F9, ADR 0028 D1)" inside a cell that opens "Decided (D-033)". That reads as decided.
     - Suggest a separate clause: "Pictures kept with letters are included too, as built (NX-39 F9 default; the founder's to change, CR-62 item 7; no parent-facing line says so yet, CR-62 item 4)".
     - data-policy.md:138 ("in the device backup (NX-39 F9)") and DATA_CLASSIFICATION.md:743 should say "F9 default" in the same way.
   - Export (CR-62 item 3, the BL-868 gate): handled well. The row drops ADR D1's proposed "the export carries it" and promises no family-export picture. It mentions only the recovery export, which is true: recovery-export.logic.ts:33-40 takes recordings and scribe.db only, so the rows go and no picture file does.
     - Optional, for completeness: "The family export (1.6.0) carries no picture file; NS-01-R14 adds it only after the founder merges BL-868 (CR-62 item 3)."
   - "Never uploaded (NS-01-R15)" is true of the app: no upload code, and lib/photos imports no sync or network module. The server refusal (ADR D6, BL-870, Q7) is not built, so the promise rests on the app alone, as ADR 0028 Context fact 1 says. No change needed.

2. The inventory and the code: lines that describe later slices, not this head.
   - "the draft is let go" (data-policy.md:138) and "a let-go draft" (DATA_CLASSIFICATION.md:743):
     - At this head, Let it go and deleteDraft never call the picture eraser (let-it-go.logic.ts:29-39, store.ts:1294 and :1306). Only the next launch's sweep removes a gone draft's picture (housekeeping.ts:40-50; probe P7).
     - Not reachable today, because nothing in src writes a picture.
     - This is my #835 Note 1, which becomes a must-fix in the slice that first lets a draft own a picture (4a). ADR D5 and PRD section 6 want the file gone at Let it go.
     - If 4a does not wire it, these lines must say "at the next launch after the draft is let go".
   - The picker original, "it is read once and removed" (DATA_CLASSIFICATION.md:744; data-policy.md:138 "a pick in flight only"):
     - No code at this head reads a picked original and then removes it. PickedFiles.read and remove have no caller in src.
     - The baker removes only its own ScribePhoto output (baker.ts:50), never the source.
     - Today only the launch sweep (housekeeping.ts:22) and Erase everything (erase-everything.ts:51, :71-78) empty Caches/ImagePicker. Nothing at this head puts an original there either, since pickOne has no caller.
     - The `<id>.img` name is the future caller's: the Swift module takes the name JavaScript gives (ScribePhotoModule.swift:34-35).
     - Forward to 4a: remove the original in a `finally` around commitPhoto, whatever the result, with a test.
   - A replaced picture (probe Q3):
     - commitPhoto replaces the row through put(), which deletes the old row (entry-media.ts:64). The old file `<prior media id>.jpg` stays on disk with no row until the next launch sweep counts it as an orphan.
     - NS-01-R7 wants it kept for the 10 s Undo, so this is a 4b/4c item. The file should go when the Undo window closes, not at the next launch (my #835 Note 3). Neither row mentions it.
   - Retention wording (data-policy.md:138): "Until the letter is erased (Erase now or the 30 day purge)" leaves out two erase paths the code serves: the book's Erase now and day-30 purge, and an erase on another phone of the author.
     - Suggest "(Erase now on the letter or its book, the 30 day purge, or an erase on another phone of the author)".
   - Remove the tails "`privacy` confirms the class and the words" (data-policy.md:138) and "Levels as `privacy` confirmed ... wait for `privacy`" (DATA_CLASSIFICATION.md:658).
     - I confirm class C, and L4 for the picture file and both caches.
     - I confirm the words with this note's changes and Note 1's.
   - Context lines this PR does not change:
     - DATA_CLASSIFICATION.md:597 still says "migrations.ts version 4"; it is 11 with this table.
     - The older row ":742 Photos, cached book audio of other members ... Deleted on purge sync or removal" is about synced family photos, not NS-01 pictures. A one-word qualifier ("Synced photos (planned)") keeps a reader from taking it for the new row.

3. Merge route: `docs/legal/**` is the founder's merge, not Karma's.
   - The PR body says "then Karma merges under D-132". D-132 lists `docs/legal/**` as not delegated (DECISIONS.md:655, :1025; also :1070).
   - This PR changes docs/legal/data-policy.md and docs/legal/DATA_CLASSIFICATION.md.
   - Either say the founder merges, or move the two legal files into a small founder PR and keep this one code-only. Either way, the CR-62 items in Note 1 then reach him with the right words.

4. Metadata: what the stored copy is.
   - The brief's premise ("the re-encoded JPEG from scribe-photo, not the original") holds only for a turned JPEG, a HEIC or a PNG. Those go through ImageIO, which receives no source property (ScribePhotoModule.swift:219-228), and then through the JS strip and the guard (session.ts:91-101).
   - An upright JPEG is not re-encoded. It is the original's image data with these removed by strip.ts:
     - every APP1, APP3 to APP13 and APP15 segment, every APP2 that is not ICC, and every non-JFIF APP0 (:96-98, :113);
     - comments (:96);
     - the JFIF thumbnail (:101-111);
     - everything after the first end marker (:62-66).
   - That meets NS-01-R6 (Exif, XMP and IPTC). The tests prove it on 10 plus 10 fixtures, and M12 and M14 go red.
   - What is kept: the ICC profile (APP2) and Adobe (APP14) as they are, and every non-APP marker segment, because `keep` defaults to true (:90).
     - Probe Q4: plain text planted in a JPGn (0xF0) segment ("GPS 37.7749 ... iPhone 15 Pro 2026:11:01") is stored. carriesMetadata (strip.ts:133-146) looks only for five signatures.
     - Phones do not write these markers, but a parent can pick any saved file.
     - An ICC profile can, rarely, name a device in its header or its dmnd and dmdd tags. Apple's Display P3 profile does not.
   - Hardening, not blocking: switch the segment loop to an allowlist. Keep SOI, SOFn, DHT, DQT, DRI, DAC, SOS, RSTn, EOI, JFIF APP0 without the thumbnail, ICC APP2 and Adobe APP14, and drop the rest. Optionally zero the ICC header's date, device-make and device-model fields.
   - No PR test pins the guard: M11 survives. Q5 is a ready test (an Exif signature in a kept segment makes commit fail and store nothing).
   - Positives:
     - The Live Photo video is dropped on pick (session.ts:15-17, :65).
     - The place is only what the parent typed, and the file's GPS is never read: the only Exif read is the orientation tag, 0x0112 (strip.ts:26-45).

5. Test gaps behind the new behavioural tests. Each is real but has a backstop.
   - M3: no PR test plants a picture and runs the 30-day purge (letter or book).
     - My P2 and P5 catch it.
     - With the mutant, the photo launch sweep still removes the picture later in the same launch (Q1, settled, passes), so the end state holds and only the order is unproven.
     - Suggest adopting P2 and P5.
   - M9: two test titles say "the file first and then its row" (erase-all.test.ts:1120; photos-phone.test.ts:96), but nothing pins the order.
     - Q2 pins it with `disk.undeletable`.
     - With the order reversed, an undeletable file loses its row and becomes an orphan that only the next launch sweep removes.
   - The NS-01-R15 test (photos-surfaces.test.ts:29-36) pins the mapper only. Its commitPhoto call writes to an in-memory store that the hand-built row never sees, so the call is decoration.
     - The useful part is that entrySnapshot (sync/outbox.ts:161-185) has no photo key.
     - My #835 P9 (a signed-in phone keeps a draft that has a picture with words and a place; the queued payload has no media id, words, place or photo_path) is the end-to-end proof, and it passes at this head. Suggest it as the R15 test.

6. Forward from #835, not this PR's to fix:
   - Note 4 there: rows that the launch sweep deletes can leave photo_text and place page images in scribe.db-wal until the next checkpoint. commitPhoto now writes photo_text, still with no caller. The slice that wires it should add a picture case to "erased words leave the database file itself" (erase-all.test.ts:628).

7. Outside lens B, for Review A (no privacy effect, both fail closed):
   - carriesMetadata scans the whole file for 4-byte signatures ('8BIM', 'MPF\0'), which can occur by chance in image data. By my estimate about 1 picture in 700 at 3 MB would return `failed` and attach nothing.
   - text.ts caps at 140 graphemes, while the column CHECK counts characters (migrations.ts:460). 140 joined emoji can exceed it, so put() throws and commit returns `failed`.

### Checks, item by item
1. No source metadata in the stored copy (Note 4).
   - The stored copy has none of the metadata NS-01-R6 names.
   - The picker original is removed by the launch sweep and Erase everything, and at this head by nothing else, because nothing creates one (Note 2).
   - Nothing about pictures reaches sync, analytics, logs or crash reports:
     - lib/photos has no console, analytics or network call, and imports no sync or network module (photos-surfaces.test.ts:37-42; grep).
     - Every thrown message is a fixed code with no path, id or name (entry-media.ts:15-21, files.ts:32, :74, :81, :107, :144, baker.ts:30), and the baker drops native error text (baker.ts:47-48).
     - entrySnapshot has no photo key.
     - The owner backup reads audio columns only.
     - No analytics event is added.
2. Inventory rows (Notes 1 and 2).
   - Location: true. Application Support, photosDirectory (files.ts:28-33).
   - Backup inclusion: true. There is no exclusion call under lib/photos, and Caches is outside the backup.
   - Export exclusion: true, and no undecided export is promised.
   - Retention and erase: true for letters, books, Erase everything and the launch sweep. For a let-go draft and a replaced picture the code is one launch behind the words.
   - Two lines come close to settling CR-62 items 6 and 7 (Note 1).
   - Level questions: ruled above. L3 and L2.
3. Erase paths, file first and then row, switch on or off.
   - All of them pass through erasePictureOf: Erase now on a letter (M1), erased on another phone (M2), the 30-day purge of a letter and a book (M3, P2, P5), and Erase now on a book (M4).
   - Erase everything also deletes the folder and both caches (M5a, M5b).
   - The order holds (Q2).
   - Each new PR test goes red for its mutant, as the body says (M1, M5a, M8).
   - Nothing on these paths reads the switch, and the tests pass with it set or unset.
   - Let it go and deleteDraft leave it to the next launch: not reachable here (Note 2).
4. Switch unset.
   - `EXPO_PUBLIC_PHOTOS` appears nowhere in apps/mobile/src.
   - session.ts, strip.ts and text.ts have no importer in src, and put() has no caller.
   - The erase-everything change keeps the same two folder names, and sweep.ts changes one comment.
   - Runtime behaviour therefore equals the base. With the switch unset, nothing new is written: probes P8 and Q6, and photos-phone.test.ts:49.
5. Tests and mutations: above. 114 PR tests and 16 probe tests pass. 15 mutants were applied; 12 went red on the PR tests and 3 survived (M3, M9 and M11), each red on a probe (Note 5). A sixteenth (Erase everything without the per-row eraser) is equivalent by design, since erase-all.test.ts:1161 already passes a no-op row eraser.
6. Check-runs at 4596b3c1. The required contexts on `develop` are "applied migrations unchanged", "required" and "compliance-fence".
   - Required: "applied migrations unchanged" success, "required" success, "compliance-fence" success (two runs).
   - Also green: tests and content rules, typecheck, database rules, edge functions, web, web e2e, no e2e seam, install, agent team consistent.
   - Still running when read: "store-profile Release launch (testflight env, no seam, 20 s)", which the PR body names as a merge gate, and the e2e simulator app. One store-profile run and the iOS simulator build were skipped (no native change).

### Not verified
- Anything on a device:
  - ImageIO on the ten fixtures (the PR says the same);
  - the Application Support path and its data-protection class on a real container;
  - whether Metro bundles the deferred `import('../photos/device')` (sweep.ts:69) in a store build;
  - a kill during commitPhoto.
- The ICC device-tag point, for anything other than Apple's Display P3.
- Later slices (#837 to #840) are named only for forward items. I did not review them.
- The full apps/mobile suite. I ran only the changed files and my probe; CI "tests and content rules" is green.

Reviewer: independent of the author (CR-44).
