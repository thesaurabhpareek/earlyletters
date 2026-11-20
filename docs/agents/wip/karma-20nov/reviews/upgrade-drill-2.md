## Upgrade drill 2: TestFlight build 9 (schema v8) -> develop tip 73fcc1eaeb29 (contains 0c7b9175, #520, #614, #674, #679, #675, #668, #667, #661 to #663, #647)

VERDICT: PASS on all five points. No letter, draft or setting is lost, rewritten or locked out. Two behaviours differ from build 9 on purpose and are listed (the 30-day purge is more conservative; the file is rebuilt once). One thing to know: the guard in #647 delays a wrong forward clock by one launch, it does not stop a clock that stays wrong.

Same harness as drills 1 and the re-run (scratchpad/drill/), same seeded build 9 file (sha256 6c7db002, schema v8, 8 letters, 4 drafts, 14 settings), plus a second seeded file (out3/shelf.db.keep, built with build 9's own store API) with four more letters in Recently deleted at known ages before the last launch L = 2026-11-06T18:00Z: A 31 days, B 29 days, C 10 days, D 45 days (D is spoken, with a recording). Fictional Asha only. 18 commits since c9641243.

### 1. Schema bump above v9: none (PASS)
- `apps/mobile/src/lib/db/migrations.ts` has no diff since c9641243; latest is v9 (PR #522). A grep of the added non-test lines of the 18 commits for CREATE, ALTER, DROP, user_version finds nothing but the open pragma line and two `wal_checkpoint` lines. #520 puts its marks in `settings` (wipe.ts says so) and needs no number.
- Migration v8 -> v9 on the seeded file: 8 entries, 4 drafts, all rows byte-identical on all pre-existing columns, 4 new NULL columns on drafts, integrity ok. 12 text rows (raw_transcript, final_text, machine_edits, typed_text, audio uri and sha) byte-identical by an independent read.
- Kill inside the migration (SIGKILL after statement K = 1..5, inside the open transaction, hot WAL present): file reads v8 and identical to pristine; the next real `openStore` ends in the same state as an uninterrupted run (data hash a676d450, schema 3c852019), integrity ok. 5 of 5. A crash-state copy (db + un-checkpointed 680 KB WAL) opens to the same state.

### 2. One-time rebuild `vacuumOnceForSecureDelete` (PASS)
- Order seen on the first open of the seeded file: 4 ALTERs, `user_version = 9`, `VACUUM`, `PRAGMA wal_checkpoint(TRUNCATE)`, then the INSERT of `db.secureDeleteVacuumAt`. The mark comes last. Effective pragmas: secure_delete 1, WAL, synchronous FULL.
- After: pages 26, freelist 0, rows identical, rowids of every table identical (VACUUM did not renumber), settings 14 identical + 1 new row. Words intact.
- Second open: migration from=to=9, 0 VACUUM runs, file sha256 unchanged. Crash copy: 1 VACUUM, same final state.
- Kill around it (self-kill at four points, then a normal open): before VACUUM, after VACUUM, after the checkpoint, all three leave v9 with no mark and rows intact, and the next open runs VACUUM again and ends identical to the uninterrupted run; after the mark is written, the next open runs no VACUUM. 4 of 4.
- Real SIGKILL in the middle of VACUUM on a 146 MB file (100,008 letters): killed 0.1 s, 0.4 s and 0.7 s after it began (hot WAL 8 KB, 111 MB, 152 MB). Each time: integrity ok, 100,008 entries, no mark; the next open reran VACUUM, set the mark, and all entries, children, drafts and the 14 settings are identical to before. VACUUM took about 1 s there (whole open 2.5 s).
- Erase everything (store part plus the real `eraseEverything()` with the native modules stubbed as erase-all.test.ts does): result 'erased'; all 9 tables 0 rows, settings 0 rows, user_version still 9, 0 recording files left, pending mark gone, Keychain map empty. Seven word needles (letter text): six were in scribe.db before; none is in the db file or the -wal after. The next launch runs VACUUM + checkpoint once more and writes the mark again (settings = 1 row); the launch after that runs none. 
- What the rebuild is for, shown: after build 9 purged three shelf letters (A, B, D), their words were still readable in the file bytes; after the tip's first open they are not (C, still on the shelf, correctly stays).

### 3. New settings keys (PASS)
- `db.secureDeleteVacuumAt`: new key, none existed; the 14 existing rows and their rowids are untouched.
- `book.deletedAt.<id>`, `book.erasing.<id>`, `erase.everything.pending` are written only by Delete this book, Erase now, or Erase everything. The only other `book.` key in the app, `book.seenFromOthers`, does not match the exact prefixes `book.deletedAt.` and `book.erasing.` that wipe.ts queries.
- Delete this book on the seeded file: exactly one new key; `activeChildId` removed; the book and its 7 letters leave the lists. Restore: children, entries, shelf, drafts and held drafts read identical to before; no other setting changed. Note: the `activeChildId` row is not written back; the app falls back to the first visible book, so with two books the active choice could differ after a restore. Erase now on the book: recordings 7 -> 2 (the two files no row owns stay), rows gone, marks gone, ledger mirror raised 5 -> 6 first (D-103; the note counts since #510).

### 4. resumeEraseAtLaunch on a normal upgrade (PASS)
- No mark: `eraseEverythingPending()` false; `resumeEraseAtLaunch()` returned null both times, no erase, listening, lock, invite or reminder call was made, database dump identical before and after, in-memory phone disk hash identical. It runs in `Root` after the store opened (`_layout.tsx`).

### 5. Launch purge with letters in Recently deleted from build 9 (PASS: nothing erased early)
`purgeShelfAtLaunch(now)` (the launch call), real eraser, shelf file, L = last launch build 9 recorded.
| launch clock | build 9 | tip |
|---|---|---|
| L + 2 days | erased 3 (A, B, D) | erased 2 (A, D); B waits one launch |
| L + 60 days (clock jumped) | erased 5 (A, B, C, D and the seeded letter deleted at L) | erased 2 (A, D) |
| L - 3 days (clock back) | 0, stamp stays L | 0, stamp follows the clock back |
| stamp missing or unreadable, L + 60 days | erased 5 | erased 0, then stamps |
- Only D's recording was removed in each erase; no other file was touched. After the jump, the tip's next launch (L + 61 days) erases B, C and the Nov 6 letter (3): the guard costs one launch, it is not immunity against a sustained wrong date. A first launch after the upgrade uses build 9's last stamp as the basis, so nothing erased at it was less than 30 days old at that stamp.

### What differs from the earlier drills
- Settings gain `db.secureDeleteVacuumAt` (intended). Purge basis moved from the clock now to the last launch stamp (#647, intended, safer than build 9).
- Book tab: chapter keys, titles, counts and letter ids are identical; the `opener` text fields changed shape (#674: "8 months", no numeral or line). Presentation, not data.
- Export ZIP, ledger, Tonight cards, shelf rows, 32 read results: identical to the c9641243 run apart from the two items above. Versus build 9 also: schema 8 -> 9, ledger.present 5 -> 6 (#510), export 1.6.0 (#627).
- Downgrade: unchanged. Build 9 on the tip's file: newer:true, file sha unchanged, 29 of 32 reads identical (open and schema fields, plus the new settings row). New: build 9 does not know `book.deletedAt`, so a book build 10 put in Recently deleted shows again (1 book, 7 letters) and an interrupted Erase everything is not finished.

### Tests
Targeted 14 files (erase-all, store.purge-guards, store.shelf, age-gate-erase, sync-erase, reminders-erase, migrations x2, launch-newer-file, launch-retry, export-waiting, export-golden, book-chapters, book-shelf): 219 passed. Full apps/mobile: 4208 passed, 61 failed in the same 7 files as before (config, privacy-manifest, capabilities, hosting-ios17, licences, preflight-production, app-lock-wiring), all the sandbox missing expo-local-authentication and expo-clipboard; nothing new. Typecheck not run.

### Only a phone can show (not verified)
- Native SQLite under expo-sqlite: that `execSync('VACUUM')` and the WAL truncate behave as node:sqlite 3.53.4 did; that `PRAGMA secure_delete = ON` applies on the native connection.
- Free space: in WAL mode VACUUM wrote about the file size into the WAL (152 MB for 146 MB), then the checkpoint copies back, so peak is about twice the file; a full disk is swallowed and retried at every open. Time on phone flash and CPU, run synchronously before the first screen, and whether iOS's launch watchdog tolerates it for a large file.
- What iOS backup or an iCloud restore actually holds after the rebuild; file protection if the first launch is in the background with the phone locked.
- The Keychain and StoreKit parts of Erase everything and the real lock reset (stubbed here); the screens (only store, erase and logic modules ran).

Harness: scratchpad/drill/ (zz-drill-open, -purge, -wipe, -book, -seed-shelf, killmatrix3.sh, killvac.sh, killvac-big.sh, purge-matrix.sh; out3/). My worktrees are removed.
