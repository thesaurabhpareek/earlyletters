## Review A at 4a79091d8fcc538ec9f93ca86f40b2c6995136eb: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Test only: `apps/mobile/test/ns08-sign-out-keeps-recordings.test.ts` (266 lines, new) and a check-in file. Within CODE-R02. This re-review follows Review A at 06a341bd (CHANGES).

Must fix: none.

### The earlier must-fix
- The engine pin now covers `releaseEmptyPhone`. Its body is sliced to its own closing brace, has no DELETE or `.delete(`, and its calls are exactly `releaseEmptyOwner`, `localSqlDb` and `notifyStoreChanged`. The pin also covers `ensureEngine`'s ended-session branch (stop only, then return) and `stopEngine`'s calls (stop, drop listeners, publish the idle status), each with no delete.
- I re-ran my mutation in a worktree of the head: `localSqlDb().run('DELETE FROM drafts')` as the first line of `releaseEmptyPhone`. The engine pin now fails (1 of 6). Before this fix all 6 passed.
- A second mutation, an extra call `wipeLocalRows()` as the first line of `stopEngine`, also fails the engine pin.
- Unmutated head: 6 passed. The `it.fails` case reports as passing, as intended.

### What I checked
- Head 4a79091d, committed 12:11 UTC on 20 Nov, more than 10 minutes old at review. Its only change since 06a341bd is the 17 test lines above.
- CI at the head: every check completed with success, including `required`, `tests and content rules`, `typecheck` and `store-profile Release launch`. The iOS simulator build was skipped.
- From Review A at 06a341bd, which this head contains unchanged:
  - The three mutations the PR body names reproduce: a DELETE in `releaseEmptyOwner`, an extra call in the finishing effect, and the sheet line.
  - The cites hold, 6 of 6: `session-provider.tsx:293-308`, `sync/index.ts:253-258`, `ownership.ts:106-118`, `app/settings/account.tsx:192`, `auth.en.ts:297`, `plan.edges.test.ts:184`.
  - The test title is the card's (NS-08-R6, card 08 at `450bcb4a`, line 119).
  - The row had no test on develop. The behaviour already holds, so mutation, not a red run on develop, is the evidence that the test bites.

### Findings (notes, most serious first)
1. The import scan starts from `lib/auth/**`. Other `subscribeAuth` listeners outside that graph also run on a sign-out: `lib/billing/status-report.app.ts:121`, `lib/analytics/observers.ts:70`, `lib/backup/runtime.ts:532` (not loaded while backup is off) and `session-provider.tsx:187`. None deletes a file today; I read each one. List them as the scan lists its two file modules, so a later delete there is seen.
2. The behaviour test replays the sign-out by hand and relies on the effect pin for what the provider runs. Say so in the header, so the pin is not removed as redundant.
3. The `ownership.ts` slice still ends at the next function's name (`retryRefusedBook`). The new slices end at each function's own closing brace. Use the same for `releaseEmptyOwner`, so a reorder does not silently widen or narrow it.
4. R6 is half met until the D1 sheet line is wired (the `it.fails` case). Under #847 Q1's default, the cut checklist needs it as an open line.

### Not verified
- J-N21 on a real phone.

Reviewer: independent of the author (CR-44).
