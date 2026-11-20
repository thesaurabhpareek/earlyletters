## Review A at 82ac65166090ef727c0a376b575e5eb2fb3c2e71: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/881 .head.sha`): `82ac6516` (12:22 UTC), one fix commit on `3f05c7fb`, which I reviewed before (CHANGES, one must-fix on R9).

### What I checked this round
- The fix `git show 82ac6516`: `snippet.ts` +25/-5, `find-query.test.ts` +35/-6. The PR is now 4 files, +399/-0 against develop, one line under the CODE-R02 limit of 400. 0 non-ASCII bytes added.
- The bound. The no-break fallback is now `b = Math.min(e, a + max)` (`snippet.ts:89`). Both ends move inward only, until `cleanCut` holds (`:91-92`): not inside a surrogate pair, not before a mark, joiner, variation selector, skin tone or tag, not after a joiner, not between two flag letters. Since `a` only moves forward and `b` only back, the slice is never longer than `max`. `a` starts at most 60 units before the match, and `b` starts 180 after `a`, so the match start stays inside except in a degenerate run of unclean cut points.
- My three fixtures from last round, through `excerpt` at this code: 184, 239 and 191 are now 180, 180 and 180. The tests allow exactly `EXCERPT_MAX` (`find-query.test.ts:107`, `:121`). A new generator of 200 mixed-script sentences over 400 units always reaches the cut path, and a new case holds three similar long cuts.
- Red on the old code: with `snippet.ts` from `3f05c7fb` and the new tests, 2 failed and 14 passed. Restored, and the worktree was clean.
- Tests at this head: find-query 16 pass. `tsc --noEmit` shows the 5 known errors only (checked at #895's head, which contains this one). Full suite: see review-895-A.
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note. When the match is a single word longer than about 120 units (as in my first two fixtures), the cut keeps the start of the word but not its end. `marks` then comes back empty, because a mark is kept only when the whole match is inside the slice (`snippet.ts:100`), so the row would underline nothing (R40). This is rare in a parent's words. A mark clipped to the slice would fix it.
2. Note, carried. A term made only of combining marks still makes the two paths disagree: `harbour` followed by `\u0301`, or a lone `\u093e` after a space, gives scan 0 and index 1. Dropping tokens with no `\p{L}` or `\p{N}` in `prepareQuery` fixes it (R19, R29).
3. Note, carried. R3 counts punctuation (`a!!` runs a query). Product's call.

Must fix: none.

### Not verified
- Anything on a phone (none needed for this slice).

Reviewer: independent of the author (CR-44).
