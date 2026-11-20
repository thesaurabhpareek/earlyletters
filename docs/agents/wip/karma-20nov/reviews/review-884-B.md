## Review B at ca3b0595454b26987633b209d514b901206dcba4: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. Delta reviewed: feat/mobile-bl-952-3-index...feat/mobile-bl-952-4-search (debounce.ts, fts-index.ts, search.ts, find-search.test.ts).

Third pass at ca3b0595: a merge of #881's snippet fix only. This PR's own delta is byte-identical to the one I reviewed at a6f06f75 (the diff of the two deltas is empty), so the findings below stand.

Second pass at a6f06f75: the only new commits are the merges of #882's fix. This PR's own delta is byte-identical to the one I reviewed at b1f15601 (diff of the two deltas is empty), so the findings below stand. Note 1: #895 places the R24 guard in the store's `findLetters` after #879 merges; that meets the card, and the note stays a suggestion.

Must fix: none.

### What I checked
- Card R14, R15, R16b, R22, R24, R25, R45, R49, sections 11 to 13; ADR 0028 D4 ("every query joins the view", "the query is never stored"); privacy.md on develop line 197 (canary fields include the Find query and snippets).
- Hidden letters stay hidden on the index path (R16b): `ftsSearch` joins the map and `searchable_letters` (`fts-index.ts:13-23`), so a row the index still holds for a deleted, hidden, private or sealed letter is filtered out. No rank is selected (R10).
- The query is not kept (R14): `createQueryDebounce` holds only the latest text in a closure, and `dispose` clears it (`debounce.ts:51-55`). Test `find-search.test.ts:119-128` searches a canary and finds it in no table and no setting.
- Nothing reaches a sink (R15, R22): `searchLetters` catches the index error and does not rethrow or log it (`search.ts:44-49`). This matters: an FTS5 error message can quote part of the MATCH string. The scan path's errors carry no query text, because the query is never put into SQL there (`scan-index.ts:23-27` binds only the book id). Tests: console spy over a canary, a hit and a forced failure (`:130-142`); fetch and XMLHttpRequest stubbed, 0 calls (`:144-169`).
- R45 through the real engine: the agreement test runs six operator queries on both paths (`:48-57`).
- R49: dropping a damaged index (`search.ts:47`) touches only the index and the two `find.*` settings, which R49 allows.
- Cites: 20 sampled (PR body `search.ts:39`, `:29`, `fts-index.ts:13`, `debounce.ts:26`, `:9`; card rows R10, R14, R15, R16b, R19, R22, R24, R45, R49, O-1; ADR D4; privacy.md 197); 20 hold.

### Findings, most serious first
1. Note (R24 at the service). `searchLetters` (`search.ts:39`) and both paths do not read `listIndexableBooks`, so a book outside the seam is still searchable here, through the scan always and through the index until the next catch-up. Slice 7 adds `bookVisibleNow()` in the store. Better to also make the service return `{ status: 'done', hits: [] }` when the book is not indexable, with a test, so R24 holds at the lowest layer and any second caller (a test harness, a later screen) cannot skip it.
2. Note (slice 8). `searchLetters` can still throw from the scan (`search.ts:50`). Its message holds no query, but the screen that catches it for the failed view (R37) must not log or report the error object either; the R15 canary in slice 8 should force this path.
3. Note (wording). The header says "Read only: it writes nothing" (`search.ts:2`) while a failing index query drops the index (`:47`) and `ensureSearchView` may replace the view. Within R49, but say "writes nothing to a letter; may drop the index" so a later reviewer does not lean on "read only".
4. Note. The R15 runtime test spies on `console` only. Crash payloads, breadcrumbs, URLs and navigation state (card section 8 log canary; R25) need the screen; carry them to slices 7 and 8 and name them in the stack table.

### Not verified
- The 150 ms delay inside R2 on a phone (device row).
- The screen holding the query in component state (R14, R25; slice 8).

CI at ca3b0595 (head 22 minutes old), read at 12:48 UTC: tests and content rules, typecheck, database rules and required green; compliance-fence green beside any cancelled duplicate run; only the store-profile Release launch was still queued or running.

Reviewer: independent of the author (CR-44).
