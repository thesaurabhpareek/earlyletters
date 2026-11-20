## Review A at 780d3f8f1d824e99cede19a9e9e69b4bc2ccaacd: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape.

Must fix: none.

### What I checked
- Size and concern (CODE-R01, R02): 196 added, 1 file, test only.
- On develop: I copied `apps/mobile/test/reminders-never-list.test.ts` into a worktree of `origin/develop` (6813ab2f or later; develop moved during the review). All 7 pass, as a never-list of rows that hold today should. A never-list cannot fail on old code, so I checked that it bites instead (below).
- Mutations I ran myself (then reverted): "You missed 3 days." in the first neutral evening body fails 2 R5 tests (the pool scan and the plan scan); naming a child with names off (`planner.ts:355`, dropping `prefs.namesOnLockScreen &&`) fails the R6a plan test. Both match the body's claims.
- Full apps/mobile suite at the head: 8 files and 73 tests fail, the sandbox baseline (the same 8 files as on #901). Nothing else fails. `tsc --noEmit`: the 5 known errors only, so the `expectTypeOf` checks hold.
- The rows against the card (09-capture, 450bcb4a):
  - NS-13-R5: no number of days, no count, none of miss, behind, forgot, streak, last chance; a month note may name the age. The test scans `reminderCopy.neutral`, `reminderCopy.together` and `en.notifications` for those words and any digit, the settings and priming lines for those words and a day count, and every planned title and body (born, due date only, twins; every cadence; names on and off; 540 days) allowing only the number in "Month N begins". Matches.
  - NS-13-R6a: names off by default; every title and body from the neutral variants, no `{child}` and no name, over the whole neutral pool and the Asha plan. Partly matched: see finding 1.
  - NS-13-R6b: no scheduled notification carries letter text. The test saves a canary word in a letter and in a draft on the real store and checks every plan at every cadence, names on and off. It adds a type check that `PlanInput` and `PlannerChild` have no text-like field. Matches.
- Test titles carry the card's titles exactly (`[NS-13-R5] no guilt words`, `[NS-13-R6a] the notification pool is name-free`, `[NS-13-R6b] no letter words on the lock screen`).
- With #901: `PlannerChild` gains `quiet`, which is not in the text-like list, so the type check still holds. Merge-tree is clean against develop, #901 and #904.
- All five together: I merged #901, #902, #903 (388dbf01), #904 (24c0f28d) and #905 onto `origin/develop` in a scratch worktree. They merge with no conflict (git auto-merged `session-provider.tsx` and `prefs.ts`); the reminder tests, `month-ago-quiet`, `draft-card` and `consent-retry-one-key` pass (10 files, 167 tests), and `tsc` shows the 5 known errors only. All five also merge cleanly with develop at 627ac311.

### Findings, most serious first
1. Note (R6a covers titles, not bodies). The card asks that every title and body come from the neutral variants. The test checks each title against the pool, but bodies only for no name and no brace. A body from a named variant with the name stripped, or a new non-neutral body, would pass. Add a body set built the same way as the title set (the `neutral` evening, `monthOpen`, `birthday` and `birthdays` bodies, and `together.monthBodyNeutral`) and expect each planned body to be in it.
2. Note (where the type check runs). `expectTypeOf` does nothing at `vitest run`; it is enforced only by `tsc --noEmit`, which includes `test/**` (`apps/mobile/tsconfig.json`), so the CI typecheck job holds it. Say so in a comment, so nobody reads a green `npm test` as proof of R6b's type half.
3. Note (where the test lives). The card names R5 a "content rules test". The design's test row puts it in `apps/mobile/test/reminders-never-list.test.ts` as content and unit, which is what this PR does. Fine, since the planner's output needs the app. No action.
4. Note. The guilt list adds plain inflections (missed, missing, forget, forgotten, streaks) to the card's list. That is stricter than the card, which is the right side to err on.

### Not verified
- Lock-screen rendering on a device (J-N24, BL-948).
- The rows R10, R11, R24 and the R30, R31 retitles from the design's PR 1 are out of scope here (BL-943).

### CI
All required checks passed: install, typecheck, tests and content rules, database rules, edge functions and ops scripts, applied migrations unchanged, B-8 seam check, native files changed, compliance-fence and required. The iOS simulator build was skipped (no native change). "store-profile Release launch" was still queued at 12:57 UTC. One compliance-fence run was cancelled and its rerun passed. The head is older than 10 minutes.

Reviewer: independent of the author (CR-44).
