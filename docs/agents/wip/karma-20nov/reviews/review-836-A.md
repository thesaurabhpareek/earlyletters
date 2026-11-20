## Review A at 4596b3c11db1d910eee527d6e65313590337ad2a: PASS WITH NOTES

Lens A (data-steward): the local data lifecycle, the stored copy, and the behavioural tests (chapters 03 and 04). PR #836, photo slice 3b (BL-931, NS-01). Head 4596b3c1 confirmed from the REST API at 05:07 UTC. Base feat/mobile-photo-3-store at f55be7b8 (#835).
Diff reviewed: `git diff origin/feat/mobile-photo-3-store...origin/feat/mobile-photo-3b-stored-copy` (17 files, +830 -31).

### What I read
- The PR body. #835's "Review A at f55be7b8" and "Review B at f55be7b8", to match each item this PR says it closes.
- docs/engineering/PRINCIPLES.md; chapter 03 (DB-R03, R19, R25) and chapter 04 (DQ-R02, R03, R05, R07, R11, R13).
- ADR 0028 on develop: D1 (table, location, backup, inventory row, kill-safety order), D2 (export), D5 (erase paths) and "Tests required". RULINGS.md CR-62. PRD 01 rows NS-01-R2, R4, R5, R6, R8, R15, R16, R17, R21. NX-39 rows R8, R12 to R14, R31, R53 and F9.
- The whole diff. Also the code it plugs into at the head: photos/{files,housekeeping,device,entry-media,types}.ts, capture/{erase,sweep}.ts, erase-everything.ts, store.ts (saveLetterFromDraft, eraseEverythingLocal), db/repos/letters.ts saveFromDraft, migration 11 (migrations.ts:428-468), backup/local-store.ts, resilience/recovery-export*.ts, and export/pack.ts:239.
- For forward pointers only, not reviewed: #837 head f730a75e and #840 head cc94d0d3 (photos/attach.ts, photos/files.ts:79, capture/erase.ts:32, store.ts:1299).

### What I ran
I ran everything in a scratch worktree at 4596b3c1 under the scratchpad. node_modules were hard-linked with `cp -al` from /home/user/earlyletters for the root, apps/mobile and packages/content. Node 22.23.4. The worktree is removed at the end.
- Changed tests: erase-all, photos-capture, photos-c8, photos-device, photos-phone and photos-surfaces. 6 files, 114 tests, all pass.
- Full apps/mobile suite: 278 files, 270 pass and 8 fail; 5059 tests pass and 73 fail. The 8 files are the known baseline: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest and store-sign-in-capabilities. All 8 fail on "Failed to resolve plugin for module expo-local-authentication" or the expo-clipboard licence walk. No photo, erase, sweep, store or migration test fails.
- The kill harness (qa-kill-harness.test.ts) ran 3 more times alone: 50/50 each time. I did not see the H3 flake.
- tsc --noEmit (apps/mobile): the 5 known errors only (help-fallback.tsx expo-clipboard, and 4 in app-lock/controller.ts). None is in this diff.
- ASCII: 0 non-ASCII added lines.
- Size: 861 changed lines in 17 files.
  - Code: 346 lines in src (342 added, 4 deleted).
  - Inventory docs: 18 lines (DATA_CLASSIFICATION 15, data-policy 2 and 1).
  - BOARD.md: 1 line.
  - Tests: 496 lines.
  - That gives the body's "365 code (with 17 lines of inventory docs), 496 tests". The body's figures are accurate, and the exception is the founder's call.
- Mutations, each applied alone and then restored, against the six changed test files (114 tests):

| # | Mutation | Result |
|---|---|---|
| M1 | capture/erase.ts:38 `erasePictureOf(entryId);` commented out | RED: erase-all.test.ts:1130 |
| M1d | the same line deleted | RED: :1130 |
| M2 | erase-everything.ts:67 keeps `photosDirectory()` but drops `pictures.delete()` | RED: :1155 |
| M2b | erase-everything.ts:51 drops PICKER_CACHE_FOLDER and BAKED_CACHE_FOLDER | RED: :1155 |
| M3a | store.ts:512 Keep's move placed before letters.saveFromDraft | RED: :1167 |
| M3b | the same move placed after the transaction | RED: :1167 |
| M3c | the move dropped | RED: :1167 |
| M4 | entry-media.ts:63 owner check dropped | RED: photos-device.test.ts (put refuses an owner ...) |
| M5 | housekeeping.ts:22 `picked.sweep()` dropped | RED: erase-all :1130 and the photos-device sweep test |
| M8 | capture/sweep.ts:69 no longer starts the photo sweep | RED: erase-all :1130 |

  The three mutants named in the PR and in both #835 reviews (M14, M15 and M16 there) now go red. So do the move-before variant, the cache-list variant and the dropped launch call.
- Review probes, not committed. Copies are in /tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/probe836a/. Each ran at the head, and the results are cited below:
  - Q1 to Q5: commitPhoto over the real entryMediaStore on node SQLite.
  - P1 and P2: on erase-all.test.ts's harness.
  - A scan-data probe for carriesMetadata.
  - A cap probe with Intl.Segmenter removed.

### Findings

Must fix: none. No path in this diff loses or corrupts a stored picture or row, breaks an upgrade, or leaves personal data behind past the next launch.
- Every commitPhoto failure I could force left 0 new files and kept the earlier picture's row and file (Q1 to Q5).
- Every erase path removes the file first, then the row (M1 to M3 above, plus P1).
- No migration is touched.

Notes (most serious first):

N1. The 140 and 60 caps and migration 11's CHECKs count different things, and which one the cap counts depends on the JS engine (DQ-R05: the CHECK is the last line, so the app's cap must sit inside it).
- text.ts:4-5 counts graphemes when Intl.Segmenter exists and code points (Array.from) when it does not. Migration 11's CHECKs `length(photo_text) <= 140` and `length(place) <= 60` (migrations.ts:460-461) count code points.
- In Node, which has Segmenter, a text the cap accepts is refused by the real store. commitPhoto returns `failed` with 0 files and 0 rows (Q1) for:
  - 140 x U+0915 U+093F (280 code points);
  - 100 x "e" plus U+0301;
  - 30 family emoji (150 code points);
  - a 40-syllable Devanagari place (80 code points).
- On the phone, Hermes has no Intl.Segmenter (ADR 0014:12; docs/research/LANGUAGES.md:11; I did not re-verify on a device). The cap therefore counts code points and can split a grapheme at the cut:
  - "a" plus 80 x U+0915 U+093F ends in a bare U+0915, losing the last vowel sign;
  - 137 x "x" plus a family emoji ends in U+1F468 U+200D U+1F469.
- The test at photos-capture.test.ts:96 ("counted in characters a person sees") uses U+1F600, which is one code point and one grapheme. It passes on either path, so it cannot tell the two apart.
- Every commitPhoto test uses memoryStore (photos-helpers.ts:72-90), which has neither the CHECK nor the owner check. That is how this went unseen.
- Not reachable today, because commitPhoto has no caller in src. But #839/#840's editPhotoWords calls put with the same cap and no catch.
- Suggested fix:
  - Keep whole graphemes while the code-point total stays within the cap, so the CHECK always holds and no grapheme is split.
  - Without Segmenter, never cut a base character from its marks: \p{M}, ZWJ, VS16 and regional-indicator pairs.
- Suggested tests:
  - One commitPhoto test over entryMediaStore on node SQLite with a multi-code-point caption.
  - The cap test run again with Intl.Segmenter removed.
- Fix this here or before 4a (#837) gives commitPhoto a caller.

N2. The belt-and-braces check can refuse a clean picture. carriesMetadata searches the whole file for its signatures (strip.ts:134-135), and that includes the compressed picture data.
- '8BIM' and 'MPF\0' are 4 bytes with no 0xFF. In near-random scan data they occur by chance about once per 2^31 bytes across the two, which is roughly 0.2% of 4 MB pictures.
- Such a picture is refused as `failed` every time, because a retry has the same bytes. The probe shows a clean JPEG with either signature inside its scan data: stripJpeg ok, carriesMetadata true, commitPhoto `failed`, 0 files.
- This is not data loss: the letter is kept and nothing is written. But a parent can never attach that picture.
- Suggested fix: run the byte search over the header segments before the first SOS only. The strip already drops everything after EOI, and the segment walk at :136-144 already covers the headers. Alternatively, keep only the signatures of 6 or more bytes for the whole-file pass.
- For `mobile`, with `security` if they want a say on the guard.
- Not measured: the cost on Hermes (no JIT) of two full byte passes over a 4 MB picture on the JS thread.

N3. Let it go still leaves a draft's picture until the next launch (#835 Review A N1 and Review B note 1). This PR adds the API that lets a draft own a stored picture: commitPhoto with requireWords false (session.ts:87-88).
- Probe P2: after store.deleteDraft, the file and the row stay. The next launch's sweep removes both.
- Not reachable at this head (no caller). The PR body does not carry the item forward.
- Two rows now state it as done at the time of the let-go:
  - data-policy.md:138 says "Until ... the draft is let go".
  - DATA_CLASSIFICATION.md:743 says "erased with ... a let-go draft".
- At #840's head, capture/erase.ts:32 `setDraftPictureEraser(erasePictureOf)` and store.ts:1299 suggest a later slice wires it. The reviewers of the first slice that calls commitPhoto for a draft (4a, #837) should confirm that Let it go removes the file and then the row at the time. Until then, the two rows should say "at the next launch after the draft is let go".

N4. A replace leaves the old file in place until a later step, and nothing says so.
- commitPhoto on an owner that already has a picture (session.ts:126-136) writes the new file, and put replaces the row. The earlier picture's file is not removed.
- Probe Q2: two files and one row; the launch sweep then removes the old one.
- This is sound:
  - it is what makes the rollback at :133 safe;
  - #840's attach.ts keeps the file for Undo, then settlePhotoChange removes it;
  - the sweep is the backstop.
- Ask: one sentence in commitPhoto's doc comment, and in the data-policy retention cell: "a replaced picture's file stays for Undo, and goes at the latest at the next launch".

N5. commitPhoto can reject instead of returning `failed`. The PR body says "commitPhoto already turns that into failed". The cause is the restore at session.ts:133, which runs put again, with its owner check and INSERT.
- Probe Q4: a let-go draft whose row still waits for the sweep. commitPhoto for that id rejects with PhotoOwnerUnknown.
- Probe Q5: the database refuses every insert (a trigger standing in for SQLITE_FULL), with an earlier picture present. commitPhoto rejects with "database or disk is full".
- In both cases the new file is gone, and the earlier row and file stay, so there is no data harm. Only the result contract breaks.
- put is one transaction, so the restore is needed only when onChange throws after the commit. Suggested: put the restore in its own try. Or restore only when `store.get(entryId)?.mediaId === photo.mediaId`.

N6. Inventory (DATA-REQ-001; DQ-R02 and DQ-R03 are "not yet", WS-19, and data-map.yaml does not exist on develop).
- Checked against the code, and accurate:
  - the path and location (files.ts:28-33);
  - in the iPhone backup: no exclusion call under lib/photos; the only callers are packs/app-support.ts:38 and model-files.ts:43;
  - never synced: entry_media is read nowhere under lib/sync;
  - not in the owner backup: backup/local-store.ts reads audio columns only;
  - the recovery export holds scribe.db and recordings only (recovery-export.logic.ts:33-54);
  - both caches are emptied at launch (housekeeping.ts:22) and by Erase everything (erase-everything.ts:51).
- The two level questions are stated for `privacy` and not decided (DATA_CLASSIFICATION.md:663 and :665).
  - No handoff issue exists: I searched issues for entry_media and open `to:privacy` issues. Please open one (AGENT-COMMS).
  - Settle it before #835 reaches develop, so that migration 11's comment and section 4.5 agree without anyone editing a shipped migration.
  - The Level column shows L2 for both. That is Review B's level with the flag beside it, which is acceptable.
- DATA_CLASSIFICATION.md:742, an older row: "Photos, cached book audio of other members | Deleted on purge sync or removal". It now sits directly above the new picture rows and reads as a second rule for pictures, but no picture ever comes from the server (NS-01-R15). For `privacy` to reword.
- The data-policy row is silent on the book export. The export writes `photos: 0` today (export/pack.ts:239), while ADR D1's proposed text said "the export carries it". Suggest "the book export carries no picture yet (BL-933)".
- The retention cells: see N3 and N4.
- DATA_CLASSIFICATION.md:744 names picker files `<id>.img`. No JS at this head names a picker file; pickerDestination arrives in 4a (files.ts:79 on #837). The row is accurate for the stack, so nothing needs to change.

N7. Tests.
- photos-surfaces.test.ts:31-32 calls commitPhoto, then snapshots a row built by hand (`entrySnapshot(row)`). The commit cannot affect what is asserted. Review B's P9 on #835 drove a real Keep through the outbox, which is the stronger shape.
- erase-all.test.ts:1150 waits a fixed 50 ms for the photo sweep, which launch does not await. It passed every run here; vi.waitFor would be steadier on a slow runner.
- The 30-day letter purge and the day-30 book purge are not in the new tests. They reach the picture through the same eraser. Probe P1 shows that both take the pictures at this head and that the other book's picture stays.
- photos-capture.test.ts:1 says the file covers "capture, store, replace, lens", but it has no replace or lens test.
- The body says "22 new" tests. The diff adds 26: 15, 4 and 2 in the new files, 2 in photos-device and 3 in erase-all. It removes the 3 source scans.

N8. #835 Review A N5 is still open (optional). The sweep is safe against a commit that runs during it only because two things hold together. files.write has a synchronous body, and put runs one microtask later (session.ts:129-130). The sweep reads the folder and then the rows in the next tick (housekeeping.ts:26-35). No comment records this.

### Checks, item by item
1. The stored copy.
   - Order: the file is written whole, then the row (session.ts:129-130).
   - A kill between the two leaves a stored-shape file with no row, and the launch sweep removes it (housekeeping.ts:56-63). The same holds for a half-written file.
   - The name is photoPath (types.ts:50). The adapter writes and removes only isStoredName names (files.ts:59, :81 and :89), the same guard that storedPhotoFile uses (files.ts:66-69) and that the eraser and the sweep use.
   - Free space: below twice the stripped size returns `no_space` with 0 files (session.ts:103).
   - A failed or partial write removes its file (:132).
   - Replace: N4. Take-off is not in this diff (it comes in #839, for Undo). Failure contract: N5.
2. Behavioural tests. All three go red under their mutants (M1, M2 and M3a/b above), and so do the move-before, cache-list and launch-call variants. The Keep test injects a failure on the letter insert and on the move itself, and checks that the file never moves.
3. put() and an unknown owner.
   - It throws PhotoOwnerUnknown (code `photo_owner_unknown`, no id or path in the message) inside its transaction and writes nothing (entry-media.ts:15-21, :63). M4 shows the new test catches its removal.
   - It is also the phone-side guard of ADR D5's last line: a purged letter's id is neither a letter nor a draft, so it cannot gain a picture row.
   - Its only caller in src is commitPhoto, which turns it into `failed` except in N5's case.
4. Inventory: N6. The two level questions are stated for `privacy` and not decided.
5. Ran: see above. The baseline is unchanged, tsc shows the 5 known errors, all added lines are ASCII, and the size figures are accurate.
6. Check-runs at 4596b3c1. The required contexts on develop are "applied migrations unchanged", "required" and "compliance-fence".
   - Required: "applied migrations unchanged" success; "required" success; "compliance-fence" success on both runs.
   - Also success: tests and content rules, typecheck, database rules, edge functions and ops scripts (Deno), no e2e seam in store bundles, web (typecheck, test, build), web e2e (Chromium), agent team consistent, install, native files changed?, and sizes for this run.
   - Skipped: iOS simulator build (no native file changed), and one of the two store-profile Release launch runs.
   - Still in progress at 05:07 UTC: the other store-profile Release launch run, and e2e simulator app.

### Not verified
- Anything on a device. That includes:
  - the ten fixtures through the real ImageIO step;
  - Hermes lacking Intl.Segmenter (cited from ADR 0014 and LANGUAGES.md, not re-run);
  - the cost of stripJpeg plus carriesMetadata on a 4 MB picture under Hermes;
  - whether expo-file-system's File.write is atomic. The design does not depend on it: the row follows the file, and the sweep removes a partial one.
- The outcome of the two check-runs still in progress (store-profile Release launch and e2e simulator app).
- Later slices (#837 to #840) are cited only for forward pointers in N1, N3, N4 and N6. I did not review them.

Reviewer: independent of the author (CR-44).
