## What and why

Quiet this book did not stop reminders. `plannerChildren` (`apps/mobile/src/lib/reminders/prefs.ts:115-117` on develop) mapped only "Include in my reminders" (`remindersOn`), and nothing in `lib/reminders` read the quiet state, although `setChildQuiet` says "The planner reads `Child.quiet`" (`apps/mobile/src/lib/store.ts:386-389`). A quieted book still got month and birthday notes, and with names on it could be named in an evening nudge. That fails NS-32-R14 (P0), NS-13-R12 and the reminder part of J-N19 (P0) on the locked pack (`docs/prd-lock-v1-20nov`).

The quiet field, confirmed on develop: the column is `child_member_prefs.quiet_at` (`src/lib/db/migrations.ts:299, 316`), read into the domain field `Child.quiet` (`src/lib/db/repos/children.ts:47`; `src/lib/db/repos/types.ts`). There is no `children.quiet` column.

This PR:
- `PlannerChild` gains an optional `quiet` (`planner.ts:79`). The planner drops a quiet book before anything else (`planner.ts:303`): it plans no month or birthday note for it and never names it.
- While every listed book is quiet, no evening nudge is planned either (`planner.ts:347-348`). A nudge then could only be for a book this person quieted. With at least one book not quiet, nudges go on for that book, as before. With no book at all, nothing changes.
- `plannerChildren` passes `Child.quiet` through (`prefs.ts:119`). `included` still means "Include in my reminders" only, so the Settings month row note (`monthRowNote`) reads as before.
- Re-planning was already wired: `setChildQuiet` emits `children` on the store bus (`store.ts:390-392`), and the scheduler re-plans on any store change (`scheduler.ts:247`). The new test pins that a store listener hears both quiet and unquiet.

Design: this follows `09-capture` section 1, "Quiet books (NS-13-R12, NS-32-R14)", and PR 2 "quiet books get none". It ships only the quiet part. The session-end part of that PR (`session.ts`, R13 to R15) stays for its own PR. There is one difference from the design line `included: c.remindersOn && !c.quiet`: that line alone would still nudge a parent whose only book is quiet. Here quiet is its own field, so the nudge stops too (F12-REQ-011: "no prompts, reminders or notes"). The include switch keeps its meaning (its help line says it governs month and birthday messages).

No new words. With every book quiet, the reminders screen shows no Next line and no preview. That is the existing empty-plan state (`components/settings/reminders.logic.ts` `nextLine`, `previewOf`).

## The test that proves it

`apps/mobile/test/reminders-quiet-books.test.ts` (fictional family Asha and Avi):
- `[NS-13-R12] a quiet book gets no reminder`: with Avi's book quiet, no birthday note, month notes only on Asha's day, and nothing names Avi. Every book quiet gives an empty plan, nudges included. Unquiet brings back evening, month and birthday notes (J-N19).
- `[NS-32-R14] quiet book adds nothing`: the plan with a quiet book added equals the plan without it, across cadences, names on and off, and month notes off.
- On the real store (node:sqlite): `setChildQuiet` reaches `plannerChildren`, tells the store listeners, keeps the book listed (quiet is not hide), and unquiet undoes it.

On develop (`8343d119`) all 4 fail. On this branch all 4 pass. The apps/mobile suite matches the sandbox baseline (8 files, 73 tests failing on the missing `expo-local-authentication` and `expo-clipboard`, nothing else). `tsc --noEmit` shows the 5 known errors only, and `npm test -w packages/content` passes (395).

## Not verified on a phone

- That iOS drops already-pending notes after quiet. The scheduler cancels ours and schedules the new plan (`scheduler.ts`), and that path is unchanged, but it was not run on a device. The J-N19 device row belongs in BL-948 / NS-13 PR 6 (`qa`).
- No caller of `setChildQuiet` exists yet (Quiet this book has no button until NS-22). Until then this is reachable only by future UI or a test seed.

## Way back

Revert this one commit. The planner goes back to ignoring quiet. No data, schema, sync or settings change is involved.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
