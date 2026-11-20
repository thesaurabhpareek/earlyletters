## Review A at e0a004f73b07f0120bb78ceeed53eb9c0f9403db: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/882 .head.sha`): `bae960a3`, the fix after review B (11:46 UTC) on top of `2fcce620`. I read both.

This round (12:41 UTC): the head moved from `bae960a3` to `e0a004f7`, a merge of #881's R9 fix (`82ac6516`). `git diff bae960a3 e0a004f7` touches only `lib/find/snippet.ts` and `test/find-query.test.ts`, which is exactly #881's fix; this PR's own delta against its base is unchanged, so everything below still holds. Find tests at `e0a004f7`: 33 (find-query 16, find-scan 17), all pass. The base branch moved in the same way, so the PR's diff against its base is the same as before.

### What I checked
- The delta `git diff origin/feat/mobile-bl-952-1-query...origin/feat/mobile-bl-952-2-view`: 4 files, +391/-0 (`sources.ts`, `scan-index.ts`, `test/find-fixture.ts`, `test/find-scan.test.ts`). Inside CODE-R02, but close to the line. 0 non-ASCII bytes added.
- The view (`sources.ts:82-100`) clause by clause against card R4, R5, R16b, R17, R33 and ADR 0028 D4: deleted, kind, waiting and now unreviewed words, empty words, own or shared, book left or deleted, book deleted mark, book hidden for me, registered visibility clauses. `child_member_prefs` has `child_id` as its primary key (`db/migrations.ts:311-318`), so the left join cannot double a letter. `entry_media` has one picture per letter by a unique index (ADR 0028 line 48), so `LIMIT 1` at `:53` is safe today.
- The fix: `'unreviewed'` is M17's "not kept from Review yet" (`db/repos/entries.ts:16-20, 65`); leaving it out keeps Find to kept words (R5, R33). Mutation: the new clause removed, the new R33 test goes red (1 failed, 16 passed); restored.
- The body's cites at this head: `scan-index.ts:21` and `:23` hold; `sources.ts:81` (view), `:49` (photo source) and `:81-99` are now one line lower (`:82`, `:50`, `:82-100`) because the fix added a comment line. 4 of 6 exact, 2 off by one.
- Tests in a worktree at this head: find-query 14 and find-scan 17 pass. `tsc --noEmit`: the 5 known errors only (checked at #881 and #885 heads, which bracket this one). Every test fails on develop (no module there).
- Imports: `../db/sql` (type) and `./query`, `./sources`. No network, log or analytics.
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note. Two facts are copied, not imported (CODE-R13's "one definition" in spirit). `sources.ts:80` copies `book.deletedAt.`, and `repos/wipe.ts:26` already exports the whole clause as `BOOK_NOT_DELETED_SQL`; import it (a `db/repos` import passes the R22 scan). `sources.ts:78` copies `sync.ownerId` from `sync/outbox.ts:31`; the R22 scan forbids importing sync, so keep the copy but pin it: a test that `OWNER_KEY` equals `SYNC_SETTING.owner`. Today the R4 test writes the literal (`find-scan.test.ts:98`), so a rename in outbox.ts would quietly drop the parent's own private letters from Find with every test green. The new `'unreviewed'` literal (`sources.ts:95`) can import `WORDS_UNREVIEWED` the same way.
2. Note (design conflict, not a card conflict). Design 11-foundations section 6, rule 3, says the view's WHERE becomes `visibilitySql('find')` from `packages/core/src/visibility.ts`. That file does not exist on develop, so this slice cannot use it. Say so in the body, so the later PR that adds it knows this view is the one to replace.
3. Note. R33 is held twice now: by the behaviour test (unreviewed words) and by a source scan that the view never names `drafts`. Good.
4. Note. `ensureSearchView` drops and recreates the view on a read path when the source set changes. Cheap and holds no data, but it is DDL during a search; worth a sentence in `search.ts` when #884 is next touched.

Must fix: none.

### Not verified
- The view on the phone's SQLite (same SQL; no FTS5 in this slice).
- The full `apps/mobile` suite at this exact head. It ran at #885's first head `a6d6c7ad`, which holds this slice's own delta (the later view fix touches only Find files, rerun above): 8 failing files and 73 tests, the sandbox baseline, no Find file.

Reviewer: independent of the author (CR-44).
