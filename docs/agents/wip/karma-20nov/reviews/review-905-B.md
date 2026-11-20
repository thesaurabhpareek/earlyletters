## Review B at 780d3f8f1d824e99cede19a9e9e69b4bc2ccaacd: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. PR #905, the reminder never-list (NS-13-R5, R6a, R6b). Test only.

Must fix: none.

## What I checked

- The diff: one new file, `apps/mobile/test/reminders-never-list.test.ts` (196 lines). No product code changes.
- The cards on `docs/prd-lock-v1-20nov` at `450bcb4a`: NS-13-R5, R6a and R6b (`09-capture.md:142-144`, all P0), the threat rows at `09-capture.md:238`, and NS-32-R12 (`11-foundations.md:106`).
- The design: `docs/tdd/new-scope/09-capture.md:82, 98` (NS-13 PR 1) on `docs/tdd-new-scope-09-capture`.
- Cites and claims: 20 sampled, 20 hold.
  - The 3 test titles match the card word for word.
  - The guilt list holds the card's five terms plus their plain forms.
  - The neutral pool, the together lines and the settings and priming lines exist as the test reads them (`packages/content/src/features/reminders.en.ts:11-44`), and `en.notifications` is read through `@scribe/content`.
  - `DEFAULT_PREFS.namesOnLockScreen` is false (D-025).
  - The R6b type check covers `PlanInput` and `PlannerChild`, and survives #901's optional `quiet`.
  - The canary goes into both a saved letter and a draft (`typedText`), on the real store.
  - Every cadence is run, with names on and off.
  - The design lists R5, R6a and R6b for PR 1, with R10, R11 and R24 left for BL-943, as the body says.
- The privacy reading:
  - R6a pins that with names off no plan for the Asha family carries the name or any token, and every title comes from the neutral pool.
  - R6b pins that no letter or draft words reach a planned title or body, whatever the settings.
  - Together these are the planner half of NS-32-R12.
  - The fixtures are fictional: Asha, "Asha Twin", Mama, and the canary "Quokkalantern".
  - The test sends nothing and logs nothing.
- The body shows the tests bite. Two mutations, a guilt word in a neutral body and a name with names off, failed R5 and R6a and were then reverted.

## Findings, most serious first

1. Note. NS-32-R12 covers any notification, and this never-list covers only the reminder planner. The billing plan notices (`apps/mobile/src/lib/billing/plan-reminders.ts`, words from `billingCopy.reminders`) are the app's other local notifications. Their header says they never carry a child or a price, but no `[NS-32-R12]` test pins that. NS-32-R12 also has no test on develop at all (grep for the tag found none). I suggest BL-943, or the NS-32 owner, add `[NS-32-R12] lock screen stays plain` over both planners, with the same canary. This is not a gap in this PR, which claims only NS-13 rows.
2. Note. The card names R5's test "(content rules test)". Here it lives in `apps/mobile/test`, because it also checks planned plans, which content cannot import. That is reasonable. A one-line copy check in `packages/content/test/rules.test.ts` (no guilt word and no digit in `reminderCopy.neutral` and `together`) would make the copy fail at its own source, which is what CLAUDE.md's "fix the copy, not the test" expects.
3. Note. The R6b canary check is a planner test. It cannot see a letter word that some future caller passes in through a new field, but the type check in the same describe block covers that. Keep both when R10, R11 and R24 are added.

## Not verified

- I did not run the file. I relied on the body (7 of 7 pass on `ea31f09d`, mutations bite) and on CI.
- The lock-screen rendering on a device (J-N24, BL-948).

CI at this head: `required` passed, and so did tests and content rules, typecheck, database rules and the Deno functions. `store-profile Release launch` is still queued, as it is on every PR in this batch. One duplicate `compliance-fence` run was cancelled, and its twin passed. The head commit is from 12:12 UTC (the second commit fixed a type error) and was more than 10 minutes old when I finalised.

Reviewer: independent of the author (CR-44).
