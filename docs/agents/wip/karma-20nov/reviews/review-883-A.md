## Review A at 3391395da11fc3e7bfde030f0e1247793d0b31ee: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/883 .head.sha`): `3bac2d41`, a merge of #882's fix (11:48 UTC) onto `6a743994`. The merge brings only `sources.ts` and `find-scan.test.ts` from #882; this PR's own delta is unchanged.

This round (12:41 UTC): the head moved from `3bac2d41` to `3391395d`, a merge of #881's R9 fix (`82ac6516`). `git diff 3bac2d41 3391395d` touches only `lib/find/snippet.ts` and `test/find-query.test.ts`, which is exactly #881's fix; this PR's own delta against its base is unchanged, so everything below still holds. Find tests at `3391395d`: 41 (find-query 16, find-scan 17, find-index 8), all pass. The base branch moved in the same way, so the PR's diff against its base is the same as before.

### What I checked
- The delta `git diff origin/feat/mobile-bl-952-2-view...origin/feat/mobile-bl-952-3-index`: 3 files, +379/-2 (`lifecycle.ts`, `test/find-fixture.ts`, `test/find-index.test.ts`). Inside CODE-R02. 0 non-ASCII bytes added.
- `lifecycle.ts` line by line: `reindexOne` (delete old row and map, insert, map the new rowid), `reconcileStrict` (gone, todo, orphans), `create` (`unicode61 remove_diacritics 2`, own content, map with `entry_id` primary key and `row_id` unique, as ADR 0028 D4 says), `enableSecureDelete` and `integrityOk` (the FTS5 command forms), `ensureSearchIndex`, `dropSearchIndex` (tables, shadow tables and both `find.*` settings, R18).
- The BL-961 seam. `listIndexableBooks` (`:33`) is read by `reindexOne` through `reindexLetter` and by all three queries of `reconcileStrict`; null means every book, `[]` none. CR-67 AX-12 (`docs/agents/cto/RULINGS.md:663` on develop) asks for one `bookVisibleTo` check for store reads, the Find catch-up and the reminder planner. On #879's head (`fix/mobile-bl-961-store-reads`), `bookVisibleTo` (`lib/auth/account-scope.logic.ts:34`) and `bookVisibleNow()` (`store.ts:446`) answer for the whole phone, so BL-961 wires `setIndexableBooks(() => (bookVisibleNow() ? null : []))`. The seam fits. Mutations: `reindexLetter` ignoring the seam, the R24 test red (1 failed, 7 passed); restored.
- Body cites at this head: `lifecycle.ts:26-35` and `:20-35` hold; `:98` reindexLetter and `:138` reconcileSearch are `:94` and `:134` here (they are #885's numbers). 2 of 4 exact.
- Tests in a worktree at this head: find-query 14, find-scan 17, find-index 8 pass (39). `tsc --noEmit`: the 5 known errors only (checked at #881 and #885 heads). Every test fails on develop.
- Imports: `../db/sql` (type) and `./sources`. No network, log or analytics. The error thrown inside (`find_index_rowid`, `:126`) carries no user data (CODE-R16).
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note, now fixed upstream. "Untrusted" lived only in memory here, so after a kill the next process trusted any table on disk (`lifecycle.ts:82`). #885 at `5dba69e2` (`cb6330d6`) now trusts the index only after a catch-up has finished in the process. That covers this slice's lost untrusted mark too, once the stack merges together.
2. Note. The `[NS-02-R24]` test proves the index half only. The scan path (`scanSearch`, and CJK, which always scans) does not read the seam, so another account's letters are still found through the scan until #895 adds `bookVisibleNow()` to `findLetters`. The body says "indexer seam"; the test title reads as the whole row. Rename it, for example `[NS-02-R24] the index half: ...`, or say in the body that R24 is met only with slice 7.
3. Note. Design 11-foundations section 6 asks BL-952 for a test titled `[NS-36-R8]` (the index row is deleted, hidden and restored with the letter). No slice carries that title, and the index tests cover delete but not hide or restore through `reindexLetter`. Slice 7, where the repo hooks land, is the natural home.
4. Note. A statement that fails part way through `reindexOne` inside the letter's transaction leaves the index half moved for that letter (a single failed statement does not roll the transaction back). The catch-up repairs it, and every query joins the view, so nothing hidden can be found; only a letter can be missed until then. Fine with finding 1 fixed.

Must fix: none.

### Not verified
- FTS5 on a phone: expo-sqlite 57.0.3 vendors SQLite 3.50.3 (`node_modules/expo-sqlite/vendor/sqlite3/sqlite3.h:149`); these tests run node:sqlite 3.53.4. Whether `secure-delete` is accepted on the phone is recorded at runtime in `find.secureDelete`; S1-205 (f) should read it.
- R36 (under 20 ms per save) on an SE 3.
- The full `apps/mobile` suite at this exact head. It ran at #885's first head `a6d6c7ad`, which holds this slice's own delta (the later view fix touches only Find files, rerun above): 8 failing files and 73 tests, the sandbox baseline, no Find file.

Reviewer: independent of the author (CR-44).
