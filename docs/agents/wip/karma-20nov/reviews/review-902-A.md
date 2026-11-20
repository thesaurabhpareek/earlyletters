## Review A at f21c364cf03c92fb886a44f7e8f194535d7bd6eb: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape.

Must fix: none.

### What I checked
- Size and concern (CODE-R01, R02): 147 added, 17 removed, 4 files. One concern: the quiet guard on the built "A month ago" card.
- The new test on develop: I copied `apps/mobile/test/month-ago-quiet.test.ts` into a worktree of `origin/develop` (6813ab2f or later; develop moved during the review). All 3 tests fail there. At the head all 3 pass, and `test/draft-card.test.ts` passes (63).
- Full apps/mobile suite at the head: 8 files and 73 tests fail, the sandbox baseline (the same 8 files as on #901). Nothing else fails. `tsc --noEmit`: the 5 known errors only.
- Cites in the body: 10 sampled, 10 hold. Examples: develop `draft-card.logic.ts:190-206` (`resurfaced` with no quiet input) and `index.tsx:200` (entries only); head `draft-card.logic.ts:196-198`, `index.tsx:103, 109, 210`; 9 `resurfaced(` calls in develop's `draft-card.test.ts`, all now passing `AWAKE` with unchanged assertions; `store.ts:320-329` (`getActiveChildId` picks from `listChildren`, visible books only) and `store.ts:693-696` (`listEntries` reads the same active id).
- The rule against the cards (450bcb4a). NS-23-R8 (10-reading-and-family): given a quieted or hidden book, no letter from it is chosen. J-N19: no past letter for a quieted book; unquiet brings it back. The guard returns null for a quiet book before any pick, and Home reads quiet from the same active id as the entries, so the two cannot disagree. Hidden holds by construction: a hidden book is never the active one, and the store test pins it. Matches both rows.
- The required `{ quiet }` argument. There is one non-test caller (`index.tsx:210`). Required is the right shape: the type checker stops any new caller that leaves the guard out. `useMemo` lists `room?.quiet` in its deps, so quiet and unquiet show on the next room read (`subscribe(load)`).
- Merge checks (`git merge-tree`): clean against develop and #901.
- All five together: I merged #901, #902, #903 (388dbf01), #904 (24c0f28d) and #905 onto `origin/develop` in a scratch worktree. They merge with no conflict (git auto-merged `session-provider.tsx` and `prefs.ts`); the reminder tests, `month-ago-quiet`, `draft-card` and `consent-retry-one-key` pass (10 files, 167 tests), and `tsc` shows the 5 known errors only. All five also merge cleanly with develop at 627ac311.

### Findings, most serious first
1. Note (the conflict with draft #721, head 75a0667e). #721 already conflicts with develop in the same three files (`index.tsx`, `draft-card.logic.ts`, `draft-card.test.ts`), so this PR adds no new conflicting file, only more overlapping hunks. #721's `pickFromTheBook` (`from-the-book.logic.ts:72`) has no quiet input. Whichever lands second must carry the guard. This PR protects itself: `month-ago-quiet.test.ts` imports `resurfaced` and pins its call in `index.tsx`. If #721 deletes `resurfaced`, those tests fail and the author must move the `[NS-23-R8]` test onto the new picker instead of dropping it. Suggest a comment on #721 that names this.
2. Note (test shape). The Home source pin matches one exact string (`resurfaced(room?.entries ?? [], today, cards.length, { quiet: !!room?.quiet })`). It will break on a harmless reformat. A looser regex on `resurfaced(` plus `quiet` would hold the same rule.
3. Note. The design asks for `[NS-23-R8]` to run "with the flag off and on". `EXPO_PUBLIC_PAST_LETTER` does not exist yet, so the guard is outside any flag, as the design's decision line asks. NS-23 PR 3 should add the flag-on half of the test.
4. Note (cost). `readRoom` now reads the active child twice (`getFamily` and `getActiveChild`). Each is one synchronous SQLite read; fine, and the body names the device check (BL-929).

### Not verified
- First-frame time on an iPhone SE 3 (B-NFR-008).
- Nothing calls `setChildQuiet` yet (NS-22).

### CI
All required checks passed: install, typecheck, tests and content rules, database rules, edge functions and ops scripts, applied migrations unchanged, B-8 seam check, native files changed, compliance-fence and required. The iOS simulator build was skipped (no native change). "store-profile Release launch" was still queued at 12:57 UTC. One compliance-fence run was cancelled and its rerun passed. The head is older than 10 minutes.

Reviewer: independent of the author (CR-44).
