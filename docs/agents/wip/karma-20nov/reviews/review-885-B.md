## Review B at 5dba69e2f95586d2e51469b7148b0107630e62cd: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. Delta reviewed: feat/mobile-bl-952-4-search...feat/mobile-bl-952-5-rebuild (lifecycle.ts split into start, step, finish, abandon; rebuild.ts; find-rebuild.test.ts; one check-in line).

Third pass at 5dba69e2: one code change since cc9434f9. `searchIndexExists` is true only after a catch-up has finished in this process (`lifecycle.ts:81-87`), so a table left half-built by a kill is never read; a new test kills a rebuild at 400 of 600 and shows the next process answering from the scan with all 600 (`find-rebuild.test.ts`, the `[NS-02-R35][NS-02-R19]` killed-partway case). Nothing here logs, sends or keeps words. One side effect for my lens, added as finding 5 below.

5. Note (removals wait for the catch-up). Until the launch catch-up finishes, `reindexLetter` returns at once (`lifecycle.ts:99-100` with the new `ready === true` rule), so a letter purged in that window (the day-30 purge and `finishServerErased` both run at launch) keeps its FTS row and map row until the catch-up's `gone` pass removes them and the merge runs. Nothing is found meanwhile (the scan answers, and every query joins the view), and the same launch normally closes it within seconds. But if the catch-up fails (`abandonRebuild`), or Find is on and the catch-up never starts, the words stay in the file until a later launch, and R16d's "its map row is gone" is late. Either let removals through when the table exists but is not yet trusted (delete by `entry_id`, no insert), or state the window in the R16d test and in S1-205.

Second pass at cc9434f9: the only new commits are the merges of #882's fix. This PR's own delta is byte-identical to the one I reviewed at a6d6c7ad (diff of the two deltas is empty), so findings 1 to 3 stand. Finding 4 (erase race) is closed by #895: see the note under it.

Must fix: none.

### What I checked
- Card R16a, R16b, R18, R24, R30, R31, R35, R44, R49, sections 11 and 13; ADR 0028 D4 "Physical removal" and "Never leaves the phone", D5 step 3; privacy.md on develop lines 28 and 94; PR #873 head da5496ca (data-policy rows for the index and the recovery export ZIP).
- Nothing hidden is found during a rebuild: `building` makes `searchIndexExists` false (`lifecycle.ts:83`), so queries use the scan, which reads the view. A letter deleted or hidden mid-rebuild is caught by a later batch, because each step re-reads what differs (`:149-176`), and the loop ends only when a step moves nothing (`rebuild.ts:57-61`). Test `find-rebuild.test.ts:81-99`.
- The account seam still governs the batched path: `reconcileStrict` reads `indexableWhere` first (`lifecycle.ts:150`), so a batch removes a book that left the seam.
- R30: the merge runs at the end of a rebuild when a removal is waiting (`rebuild.ts:67`, `:72-91`) and clears `find.dirtyAt`. Test `:113-150` puts a unique word in a letter, purges it, merges, and finds it in neither file.
- R31: the name scan now walks every depth of `lib/export`, `lib/backup` and `lib/sync` (`:153-160`). On develop none of those enumerates `sqlite_master` or copies `scribe.db` (grep), so the scan is meaningful for them.
- R49: entries and every setting except `find.*` are byte-identical after a rebuild, two searches, a merge and a drop (`:162-174`).
- I ran the five Find test files at this head: 60 of 60 pass.
- Cites: 20 sampled (PR body `rebuild.ts:44`, `:16`, `:72-91`, `lifecycle.ts:209-268`; card rows R30, R31, R35, R44, R49; ADR D4, D5; privacy.md 94; #873 rows; develop `store.ts:958-965`, `recovery-export.logic.ts:1-4, 33`); 20 hold.

### Findings, most serious first
1. Note (the R30 test proves a step the code does not take). The test runs `PRAGMA wal_checkpoint(TRUNCATE)` itself (`find-rebuild.test.ts:142`) before it reads the files, and its title says the word is gone from "the database file or its log". `optimizeSearchIndex` (`rebuild.ts:72-81`) runs no checkpoint. I ran a probe at this head (8 combinations of the FTS5 option, `PRAGMA secure_delete`, purge or Review edit): without the TRUNCATE the removed word is still in `scribe.db-wal` in all 8, and with it in none. The letter's own rows leave the same frames in the WAL, so the index adds no unique exposure, but the test title overstates. Either end `optimizeSearchIndex` with the checkpoint develop already uses after an erase (`compactAfterErase`, `lib/store.ts:958-965`), outside any transaction, or retitle the test to "the database file after a checkpoint".
2. Note (the 24 hour line depends on slice 7). The merge runs only at the end of `rebuildSearchIndex`. iOS can keep the app alive for days, so a launch-only catch-up does not meet "within 24 hours of the app being used" (R30, PROPOSED). Slice 7 should also run `optimizeIfDue` at the other idle reconcile points (opening Find, after a pull, foreground), and S1-205 should record `find.secureDelete` on a phone: with the FTS5 option on, removed terms leave the segments at delete time and the merge matters less.
3. Note (R31 and the recovery ZIP). The name scan cannot see the recovery export, which copies `scribe.db` and its WAL whole (`lib/resilience/recovery-export.logic.ts:1-4, 33` on develop), so the index travels in that ZIP. That is the recorded exposure (privacy.md line 94, Conflict P-4; #873's row), not a defect here. But the PR body's "Satisfies ... R31" should say: holds for the book export, owner backup and sync; the recovery ZIP carries the index with the database, as #873 states. Same fix as my #883 note 1 for the `lifecycle.ts:3-4` comment.
4. Note (erase race, for slice 7). `rebuildSearchIndex` can be waiting (`untilIdle` or `pause`) when Erase everything runs. If it resumes between `dropSearchIndex` and `removeEverything`, `startRebuild` makes the table again and indexes rows that `removeEverything` then deletes from the shadow tables directly, which ADR 0028 D5 step 3 says corrupts the index. Slice 7 should make erase cancel or await the running rebuild (for example an erase-pending check in `startRebuild` and `rebuildStep`), with a test.
   Closed by #895 (at 92e37929): `eraseEverythingLocal` calls `dropSearchIndex` and then `removeEverything` in the same synchronous call (`store.ts:1136-1137`), so no rebuild step can run between them, and `removeEverything` drops the index again first (`wipe.ts:142`). A rebuild that resumes after the erase either fails on the missing table and abandons, or makes an empty index, which is what R18 wants at the next launch.

### Not verified
- R35's frame and time budget and FTS5 on a real build (device, S1-205).
- Whether expo-sqlite's SQLite 3.49.1 accepts the FTS5 `secure-delete` option on iOS (sqlite.org not reachable from this session; device check).

CI at 5dba69e2 (head 21 minutes old), read at 12:48 UTC: tests and content rules, typecheck, database rules and required green; compliance-fence green beside any cancelled duplicate run; only the store-profile Release launch was still queued or running.

Reviewer: independent of the author (CR-44).
