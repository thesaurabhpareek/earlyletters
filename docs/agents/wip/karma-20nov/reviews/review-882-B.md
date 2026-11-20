## Review B at e0a004f73b07f0120bb78ceeed53eb9c0f9403db: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. Delta reviewed: feat/mobile-bl-952-1-query...feat/mobile-bl-952-2-view (sources.ts, scan-index.ts, find-fixture.ts, find-scan.test.ts). Second pass: my first review (CHANGES at 2fcce620) had one must-fix; this head is bae960a3.

Third pass at e0a004f7: a merge of #881's snippet fix only. This PR's own delta is byte-identical to the one I reviewed at bae960a3 (the diff of the two deltas is empty), so the findings below stand.

Must fix: none.

### The earlier must-fix, re-checked
- Fixed. The view now leaves out `transcript_status = 'unreviewed'` as well as `'waiting'` (`sources.ts:95`), and the header comment names the rule (`:13-15`). On develop `setWordsOnce` writes 'unreviewed' with the comment "the author has not kept them from Review yet" (`repos/entries.ts:232-235`), so card R33, R5 and the claims line in section 19 ("the index holds the kept words only") now hold.
- The new test drives the real repo path, not a raw UPDATE: `setWordsOnce` gives 0 hits, `markWordsReviewed` gives 1 (`find-scan.test.ts:165-172`). The R17 test no longer asserts the opposite (`:155-163`). The index side of the same moment is wired in #895 (`markWordsReviewed` calls `reindexLetter`).
- The delta between 2fcce620 and bae960a3 is only these two files (5 and 16 lines); nothing else moved.

### What I checked (first pass, still true at this head)
- R5: `body` is `e.final_text`; `extra` is the registered sources only. The photo source reads `entry_media.photo_text` and `.place` (`sources.ts:50-54`). The photo stack's migration 11 (#836 head 7b21c256, `migrations.ts:452-469`) allows one picture per letter and has no derived-place column. The view never names `raw_transcript`, audio, a hash, `c.name` or `author_signs_as` (test `:54-58`).
- R4 private letters: `in_book = 1 OR author_id IS NULL OR author_id = sync.ownerId` (`sources.ts:97`), the same "own" rule as sync (`lib/sync/outbox.ts:214` on develop); another author's private letter is not found (test `:96-104`).
- Hidden, left, deleted books (`:98-100`). `child_member_prefs` is keyed by `child_id` alone on develop (`migrations.ts:311-318`), so the LEFT JOIN cannot add rows. A quiet day is excluded by kind; a quiet book (F12-REQ-011, "letters untouched") is not a Find rule.
- Cites: 24 sampled (PR body line refs, card R4, R5, R16b, R17, R33, section 19, ADR D4, develop schema and repo lines); 24 hold. My first pass called the claims line "section 15"; it is section 19.

### Findings, most serious first
1. Note. The view has no account clause. R24 waits for BL-961 (#879, still open) and the store guard in slice 7. See my #883, #884 and #895 notes.
2. Note. No "hide this letter for me" exists on develop yet. When it lands it must register a `visibleSql` clause here, with a test.

### Not verified
- Device SQLite behaviour of the view (same engine as node:sqlite; not run on a phone).

CI at e0a004f7 (head 22 minutes old), read at 12:48 UTC: tests and content rules, typecheck, database rules and required green; compliance-fence green beside any cancelled duplicate run; only the store-profile Release launch was still queued or running.

Reviewer: independent of the author (CR-44).
