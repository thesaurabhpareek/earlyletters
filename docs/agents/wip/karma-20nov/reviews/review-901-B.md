## Review B at 368cf106cc2e7a1811ac2874c8352ea5f4963fe6: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. PR #901, reminders skip a quieted book (NS-32-R14, NS-13-R12, J-N19).

Must fix: none.

## What I checked

- The diff: `apps/mobile/src/lib/reminders/planner.ts` (+10 -3), `prefs.ts` (+5 -2), and the new test `apps/mobile/test/reminders-quiet-books.test.ts`.
- The cards on `docs/prd-lock-v1-20nov` at `450bcb4a`: NS-32-R14 (`11-foundations.md:108`), NS-32-R12 (`11-foundations.md:106`), NS-13-R12 (`09-capture.md:150`), J-N19 (`14-test-plan.md:68`).
- The design: `docs/tdd/new-scope/09-capture.md:53` on `docs/tdd-new-scope-09-capture`.
- Cites: 20 sampled, 20 hold. Develop `8343d119` `prefs.ts:114-117` (plannerChildren mapped `remindersOn` only), `store.ts:386-389` and `:390-392` (setChildQuiet comment and bus emit), `repos/children.ts:47` (`quiet_at` read into `Child.quiet`), `migrations.ts:299, 316`, `store.ts:311-313` (listChildren is listVisible). Branch `planner.ts:79, 303, 347-348`, `prefs.ts:119`, `scheduler.ts:247`, `reminders.logic.ts:68, 85` (nextLine, previewOf). The 4 card rows and the 2 test titles match the card text. The design line `included: c.remindersOn && !c.quiet` is at `09-capture.md:53`, and the Conflict is stated in the body.
- NS-32-R12 (no child name on a lock screen): the evening name comes from `included`, which is now built from books that are not quiet (`planner.ts:303-304`). A month or birthday note groups only `included` books. So a quieted book is never named, with names on or off. The test checks this with names on, which is the stronger case.
- Hidden books stay out: `plannerChildren` reads `listChildren`, which is `listVisible`.
- Logs and analytics: the diff adds no log, analytics, crash or network call (grep of the added lines). `Child.quiet` is a phone-only L2 field and is read, not written.
- Fixtures: Asha and Avi, Mama. Avi already appears as a fixture on develop (`hidden-books.test.ts`, `erase-all.test.ts`).
- No new words reach a parent. With every book quiet the reminders screen shows the existing empty-plan state.

## Findings, most serious first

1. Note. `PlannerChild.quiet` is optional (`planner.ts:79`). PR #902 makes its quiet input required "so no caller can leave the guard out". Here a new caller that builds `PlannerChild` and leaves out `quiet` would plan reminders for a quieted book, and type-check cleanly. Today the only caller is `plannerChildren`. Making it `quiet: boolean` costs one line in each test fixture and closes the gap for good.
2. Note. Quieting a book cancels the pending notes when the plan is made again, but a note already delivered stays in Notification Center. If names were on, that note can still show the quieted child's name. The card asks for no new class, and a delivered note is from before the quiet, so this is not a breach of the row. On a hard day it may still matter. Consider dismissing our delivered notes on re-plan when a book goes quiet, or record it as a known gap with the J-N19 device row (BL-948).
3. Note, for the founder (already flagged in the body). With every book quiet, no evening nudge at all. With one book quiet and another not, nudges go on. This reads NS-32-R14 more strictly than the design line, and I agree with the stricter reading for privacy. It is still a product call.
4. Note. Another account's books: the planner plans for every listed book. Whether a second account on the same phone sees the first account's books is BL-961 (#879, still open), with the follow-up named in #904. This PR does not change that, and the gap belongs to #904's follow-up.

## Not verified

- I did not run the suite. I relied on the PR's red-on-develop, green-on-branch claim and on CI.
- iOS behaviour for pending notes after quiet. That is a device row (BL-948).

CI at this head: `required` passed, and so did tests and content rules, typecheck, database rules and the Deno functions. `store-profile Release launch` is still queued, as it is on every PR in this batch. One duplicate `compliance-fence` run was cancelled, and its twin passed. The head commit is from 05:43 UTC, so it is more than 10 minutes old.

Reviewer: independent of the author (CR-44).
