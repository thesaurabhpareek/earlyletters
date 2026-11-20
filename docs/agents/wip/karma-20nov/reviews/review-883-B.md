## Review B at 3391395da11fc3e7bfde030f0e1247793d0b31ee: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. Delta reviewed: feat/mobile-bl-952-2-view...feat/mobile-bl-952-3-index (lifecycle.ts, find-fixture.ts, find-index.test.ts).

Third pass at 3391395d: a merge of #881's snippet fix only. This PR's own delta is byte-identical to the one I reviewed at 3bac2d41 (the diff of the two deltas is empty), so the findings below stand.

Second pass at 3bac2d41: the only new commit is the merge of #882's fix (the view leaves out 'unreviewed' words). This PR's own delta is byte-identical to the one I reviewed at 6a743994 (diff of the two deltas is empty), so the findings below stand. Note 1's wording problem now also appears in #895's README line; note 3 still waits for BL-961 (#879 open).

Must fix: none.

### What I checked
- Card R5, R16a, R16b, R16d, R18, R24, R30, R44, R49, sections 11 and 13; ADR 0028 D4 (lifecycle table, physical removal, never leaves the phone) and D5 (erase order); privacy.md on develop lines 28, 94 and 183; PR #873 head da5496ca (DATA_CLASSIFICATION 4.5 Find rows, data-policy 4.4 rows for the index and the recovery ZIP).
- What the index holds (R5): two columns, `body` and `extra`, filled only from the view (`lifecycle.ts:104`, `:165-168`); the map holds `entry_id` and `row_id` only. Test `find-index.test.ts:39-45` puts a distinct `raw_transcript` beside the words and finds only the kept words in the table.
- Removal (R16a, R16d): `reindexOne` deletes the FTS row and the map row when the letter leaves the view, and marks `find.dirtyAt` (`:106-112`); a changed letter also marks it (`:115-121`), so a word a Review edit removed is merged out too. Purge leaves no row (test `:78-87`).
- Secure delete (R30): the FTS5 `secure-delete` option is set when the table is made and recorded in `find.secureDelete` (`:171-178`, `:208-211`). I checked it persists: in node:sqlite (SQLite 3.53.4) the option is stored in `letter_search_config` and survives a close and reopen. `PRAGMA secure_delete = ON` is already set at open on develop (`lib/db/expo-adapter.ts:31`). expo-sqlite 57.0.3 in node_modules bundles SQLite 3.49.1; FTS5 `secure-delete` arrived in 3.43 (engineering memory; sqlite.org was not reachable from this session, so UNVERIFIED here, and S1-205 (f) should record the setting's value on a phone).
- Erase (R18, lib side): `dropSearchIndex` drops the table (so its shadow tables) and the map and deletes both `find.*` settings (`:230-235`); test `:104-115` checks no `letter_search%` object remains and a new ensure is empty. The ordering before `removeEverything` is slice 7.
- Account seam (R24, BL-961): `listIndexableBooks` (`:33`) is read by every index write (`:101`) and by the catch-up (`:150`). A book that leaves the list is removed by the next catch-up through the `gone` query, and that removal marks the index for the merge. Test `:118-135` proves leave, no re-entry on a new write, and return.
- R44: a failed index write sets `degraded`, never rethrows (`:96-100`); nothing is logged.
- Cites: 23 sampled (PR body line refs, card rows, ADR D4/D5 lines, privacy.md 28/94/183, #873 rows, develop `expo-adapter.ts:31`); 21 hold. The two misses are PR body line numbers: `reindexLetter` is at `lifecycle.ts:94`, not `:98`, and `reconcileSearch` at `:134`, not `:138`.

### Findings, most serious first
1. Note (the comment says something untrue). `lifecycle.ts:3-4` says the index is "never synced, exported or backed up by the app (R31)". The launch recovery screen's ZIP copies `scribe.db` and its WAL as they sit (`lib/resilience/recovery-export.logic.ts:1-4, 33` on develop), so it carries the index. privacy.md records this (line 94, Conflict P-4) and #873's data-policy row says "in the device backup and in the recovery export ZIP". Reword to: never synced, not in the book export or the owner backup; inside `scribe.db`, so in the device backup and the recovery export ZIP.
2. Note (class). `lifecycle.ts:17` labels `find.secureDelete` L1. The card says L1; `privacy` ruled L2 (privacy.md line 183, Conflict P-7) and #873 carries L2. Use whatever #873 merges with; until then cite both.
3. Note (R24 is not met by the seam alone). The seam governs what enters the index; the scan and the index query read the view, which has no account clause. Between an account change and the next catch-up, and on the scan path at any time, a book of another account is still searchable if it is the active book. The PR body places the guard in slice 7 (`bookVisibleNow()` in `ensureFindIndex` and `findLetters`). Also, nothing here runs a catch-up when the account changes; slice 7 should call `reconcileSearch` (and then the merge) on sign-in and sign-out, so the other account's words leave the file, not only the results.
4. Note. `degraded` lives in memory only. After a kill the next launch trusts the index again, and the catch-up repairs it; queries still join the view, so nothing hidden is found meanwhile. This matches the card's Errors line; recorded so slice 7 does not assume a persisted mark.

### Not verified
- The repo hooks and the erase order (slice 7).
- FTS5 `secure-delete` on the shipped SQLite (device, S1-205).

CI at 3391395d (head 22 minutes old), read at 12:48 UTC: tests and content rules, typecheck, database rules and required green; compliance-fence green beside any cancelled duplicate run; only the store-profile Release launch was still queued or running.

Reviewer: independent of the author (CR-44).
