## Review A at 5dba69e2f95586d2e51469b7148b0107630e62cd: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/885 .head.sha`): `5dba69e2` (12:26 UTC). Since my last round at `cc9434f9` (CHANGES, one must-fix) two commits landed: `cb6330d6`, the fix, and `5dba69e2`, a merge of #881's R9 fix. `git diff cb6330d6 5dba69e2` touches only `snippet.ts` and `find-query.test.ts`, which is exactly #881's fix.

### What I checked this round
- The fix `git show cb6330d6`: `lifecycle.ts` +4/-3 and `find-rebuild.test.ts` +14/-1. `searchIndexExists` now returns `s.ready === true` (`lifecycle.ts:86`), and only `finishRebuild` sets that. A new process therefore trusts no table on disk until a catch-up has finished in it. Writes (`reindexLetter`, `reconcileSearch`) skip the index until then, and the catch-up brings it level: every batch re-reads what differs, so those writes are not lost. `optimizeIfDue` runs after `finishRebuild`, so the merge still runs.
- My scenario through the real code at this head: 600 letters, a rebuild stopped after two batches, then `forgetSearchState` (a new process on the same file). The search now takes the `scan` path with 600 hits (it was the index path with 400). Once the stopped rebuild was released and finished, it took the `index` path with 600 hits. The PR's new test holds the same case. With the old line put back, that test is red (1 failed, 9 passed); I restored it and the worktree was clean.
- This also closes review-883-A note 1 (the untrusted mark lost on a kill) and the card's edge row "App updated mid-flow ... until then the scan answers".
- Tests at this head: all six Find files, 64 pass. The full `apps/mobile` suite ran at #895's head, which contains this one (review-895-A). `tsc` is as before.
- The rest of my earlier reading holds and is unchanged by these commits: the batching, the yield, the recording wait, the shared run, the R30 merge and the R31 scan.
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note. With the trust fix, a first build cannot be served half-made even without the `building` flag, because `ready` becomes true only in `finishRebuild`. `building` still matters for a catch-up of an index that is already trusted, and the untrusted-index test pins that case. My earlier note about the 1,000-letter test no longer applies.
2. Note, carried (R35 frame budget, for S1-205). Three steps each run over the whole index in a single task: `integrityOk` in `startRebuild`, the full diff query in every batch, and the final `optimize` with no yield before it. S1-205 should time each of them.
3. Note, carried. R49's test compares `entries` and the settings but not `drafts` or `entry_media`, and it skips every `find.%` key rather than only the two the card allows.
4. Note, carried. The body does not name the SQLite the app ships: expo-sqlite 57.0.3 vendors 3.50.3, while the tests run node:sqlite 3.53.4.

Must fix: none.

### Not verified
- R35's frame budget and its 3 s at 1,000 letters on an SE 3, R30's bytes and FTS5 in a real build (S1-205).

Reviewer: independent of the author (CR-44).
