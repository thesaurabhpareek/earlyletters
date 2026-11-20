Agent: mobile
Mode: task quiet books and consent key (Karma, 20 Nov), ahead of BL-943 and BL-966
Satisfies: NS-32-R14, NS-13-R12 (quiet part), J-N19 (reminder part)
Data classes touched: none new. Reads `child_member_prefs.quiet_at` (already L2, phone only) through `Child.quiet`. Nothing is written, sent or logged.

## What and why

Quiet this book did not stop reminders. `plannerChildren` (`apps/mobile/src/lib/reminders/prefs.ts:115-117` on develop) mapped only "Include in my reminders" (`remindersOn`). Nothing in `lib/reminders` read the quiet state, although `setChildQuiet` says "The planner reads `Child.quiet`" (`apps/mobile/src/lib/store.ts:386-389`). A quieted book still got month and birthday notes, and with names on it could be named in an evening nudge. That fails NS-32-R14 (P0), NS-13-R12 and the reminder part of J-N19 (P0) on the locked pack (`docs/prd-lock-v1-20nov` at `450bcb4a`).

The quiet field, confirmed on develop: the column is `child_member_prefs.quiet_at` (`src/lib/db/migrations.ts:299, 316`), read into the domain field `Child.quiet` (`src/lib/db/repos/children.ts:47`). There is no `children.quiet` column.

This PR:
- `PlannerChild` gains an optional `quiet` (`planner.ts:79`). The planner drops a quiet book before anything else (`planner.ts:303`): it plans no month or birthday note for that book and never names it.
- While every listed book is quiet, no evening nudge is planned either (`planner.ts:347-348`). A nudge then could only be for a book this person quieted. With at least one book not quiet, nudges go on for that book, as before. With no book at all, nothing changes.
- `plannerChildren` passes `Child.quiet` through (`prefs.ts:119`). `included` still means "Include in my reminders" only, so the Settings month row note (`monthRowNote`) reads as before.
- Re-planning was already wired: `setChildQuiet` emits `children` on the store bus (`store.ts:390-392`), and the scheduler re-plans on any store change (`scheduler.ts:247`). The new test pins that a store listener hears both quiet and unquiet.

Design: this follows `09-capture` section 1, "Quiet books (NS-13-R12, NS-32-R14)", the quiet half of its PR 2. The session half is BL-967, a separate PR. There is one difference from the design line `included: c.remindersOn && !c.quiet`. That line alone would still nudge a parent whose only book is quiet, which the card does not allow (NS-32-R14: a quiet book contributes no class; F12-REQ-011). Here quiet is its own field, so the nudge stops too, and the include switch keeps its meaning (its help line says it governs month and birthday messages).

No new words. With every book quiet, the reminders screen shows no Next line and no preview. That is the existing empty-plan state (`components/settings/reminders.logic.ts` `nextLine`, `previewOf`).

## How it was checked

`apps/mobile/test/reminders-quiet-books.test.ts` (fictional family Asha and Avi):
- `[NS-13-R12] a quiet book gets no reminder`: with Avi's book quiet, there is no birthday note, month notes fall only on Asha's day, and nothing names Avi. Every book quiet gives an empty plan, nudges included. Unquiet brings back evening, month and birthday notes (J-N19).
- `[NS-32-R14] quiet book adds nothing`: the plan with a quiet book added equals the plan without it, across cadences, names on and off, and month notes off.
- On the real store (node:sqlite): `setChildQuiet` reaches `plannerChildren` and tells the store listeners. The book stays listed (quiet is not hide), and unquiet undoes it.

On develop (`8343d119`) all 4 fail. On this branch all 4 pass. The apps/mobile suite matches the sandbox baseline: 8 files and 73 tests fail on the missing `expo-local-authentication` and `expo-clipboard`, and nothing else. `tsc --noEmit` shows the 5 known errors only, and `npm test -w packages/content` passes (395).

## What only a phone can prove

- That iOS drops notes already pending after quiet. The scheduler cancels ours and schedules the new plan (`scheduler.ts`), and that path is unchanged, but it was not run on a device. The J-N19 device row belongs to NS-13 PR 6 (`qa`, BL-948).
- Nothing calls `setChildQuiet` yet (Quiet this book gets its button in NS-22), so a parent cannot reach this until then.

## Way back

Revert this commit. The planner goes back to ignoring quiet. No data, schema, sync or settings change is involved.

## Globs touched

`apps/mobile/src/lib/reminders/{planner,prefs}.ts`, `apps/mobile/test/reminders-quiet-books.test.ts`. Overlaps: draft #758 already conflicts with develop in `planner.ts`, and this PR adds no new conflict (checked with `git merge-tree`).

## Founder, look first at

The evening-nudge rule: with every book quiet, no nudge at all. With one book quiet and another not, nudges go on, unnamed or naming only the other book.

Note: this branch's one commit predates the run's `Agent: mobile` trailer rule (it was pushed before that rule reached me). It was not force-pushed to add it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
