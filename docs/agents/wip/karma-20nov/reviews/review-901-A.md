## Review A at 368cf106cc2e7a1811ac2874c8352ea5f4963fe6: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape.

Must fix: none.

### What I checked
- Size and concern (CODE-R01, R02): 148 added, 5 removed, 3 files. One concern: the planner reads quiet.
- The new test on develop: I copied `apps/mobile/test/reminders-quiet-books.test.ts` into a worktree of `origin/develop` (6813ab2f or later; develop moved during the review). All 4 tests fail there. At the head all 4 pass.
- Full apps/mobile suite at the head (worktree, own workspace links): 8 files and 73 tests fail, which is the sandbox baseline (app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities). Nothing else fails. `tsc --noEmit`: the 5 known errors only (expo-clipboard, expo-local-authentication).
- Cites in the body: 12 sampled, 12 hold. Examples: develop `prefs.ts:115-117` maps only `remindersOn`; `store.ts:386-392` emits `children` from `setChildQuiet`; `scheduler.ts:247` re-plans on any store change; `children.ts:47` sets `Child.quiet` from `quiet_at`; `migrations.ts:299, 316`; head `planner.ts:79, 303, 347-348`, `prefs.ts:119`.
- The quiet rule against the cards (450bcb4a). NS-32-R14 (11-foundations): a quieted book contributes no budgeted class. NS-13-R12 (09-capture): no note names the book and no month or birthday note for it. J-N19 (14-test-plan): no reminder for a quieted book; unquiet brings it back. The code drops a quiet book before month notes, birthday notes and the evening name pick (`planner.ts:303-304`, `named` reads `included`). The test proves a plan with a quiet book added equals the plan without it, across cadences, names on and off, and month notes off. It also checks unquiet brings back every class. That matches the three rows.
- Merge checks (`git merge-tree`): clean against develop, #902, #904 and #905.
- All five together: I merged #901, #902, #903 (388dbf01), #904 (24c0f28d) and #905 onto `origin/develop` in a scratch worktree. They merge with no conflict (git auto-merged `session-provider.tsx` and `prefs.ts`); the reminder tests, `month-ago-quiet`, `draft-card` and `consent-retry-one-key` pass (10 files, 167 tests), and `tsc` shows the 5 known errors only. All five also merge cleanly with develop at 627ac311.

### Findings, most serious first
1. Note (design departure, correct direction). `09-capture` 1.3 says `included: c.remindersOn && !c.quiet`. The PR adds a separate `quiet` field and stops evening nudges when every listed book is quiet (`planner.ts:347-348`). With the design line alone, a parent whose only book is quiet would still get nudges, which F12-REQ-011 ("no prompts, reminders") and J-N19 do not allow. The PR flags the nudge rule for the founder. I agree with the code; the design line should be updated at its next touch.
2. Note (test title against the row). The card's NS-13-R12 Given is a hidden book or a book with "Include in my reminders" off. The tests titled `[NS-13-R12]` cover quiet only. The design's test row for R12 asks for "remindersOn off, quiet on, hidden book". Include-off is already covered in `test/reminders-planner.test.ts:298, 339`, but nothing pins a hidden book with the R12 title. Suggest one more line in the store test: `hideChild` on Avi, then `plannerChildren()` has no Avi and the plan never names it.
3. Note (code shape). `PlannerChild.quiet` is optional (`planner.ts:79`), while #902 makes `{ quiet }` required "so no caller can leave the guard out". Today `plannerChildren` is the only producer and sets it every time, so this is safe. Making it required would match #902 but touches every `PlannerChild` literal in the planner tests. Fine as is; say so in the field comment if you keep it optional.
4. Note. The commit has no `Agent: mobile` trailer. The body explains why. No action from me.

### Not verified
- That iOS drops already pending notes after quiet on a device (the scheduler path is unchanged; J-N19 device row, BL-948).
- Nothing calls `setChildQuiet` yet (NS-22 adds the button), so a parent cannot reach this today.

### CI
All required checks passed: install, typecheck, tests and content rules, database rules, edge functions and ops scripts, applied migrations unchanged, B-8 seam check, native files changed, compliance-fence and required. The iOS simulator build was skipped (no native change). "store-profile Release launch" passed too. One compliance-fence run was cancelled and its rerun passed. Checked 12:57 UTC; the head is older than 10 minutes.

Reviewer: independent of the author (CR-44).
