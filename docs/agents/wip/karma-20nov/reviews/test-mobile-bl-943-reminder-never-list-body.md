Agent: mobile
Mode: task BL-967 run, the never-list rows asked for with it (part of BL-943)
Satisfies: NS-13-R5, NS-13-R6a, NS-13-R6b (test titles as on the locked card)
Data classes touched: none (test only).

## What and why

These rows hold the Build 13 cut: no guilt or counting in a reminder, no name on the lock screen by default, and never a word of a letter in a notification. They hold today, but nothing pinned them by row id. `09-capture` 1.9 makes them NS-13 PR 1 ("test: the reminder never-list"). This PR adds R5, R6a and R6b, as asked. R10, R11 and R24, and the R30 and R31 retitles from that design PR, are left for BL-943.

`apps/mobile/test/reminders-never-list.test.ts` (fictional family Asha, twins written as "Asha Twin"):
- `[NS-13-R5] no guilt words`:
  - Every string in `reminderCopy.neutral`, `reminderCopy.together` and `en.notifications` has no guilt word (miss, behind, forgot, streak, last chance and their forms) and no number.
  - The settings and priming lines have no guilt word and no count of days.
  - Every planned title and body, for a born child, a due-date-only child and twins, at every cadence, with names on and off, over 540 days, has no guilt word. Its only number is the month in "Month N begins".
- `[NS-13-R6a] the notification pool is name-free`: the neutral pool has no `{child}`. With names off (the default), every plan names no one, leaves no token, and every title comes from the neutral pool.
- `[NS-13-R6b] no letter words on the lock screen`:
  - A type check that neither `PlanInput` nor `PlannerChild` has a field that could carry text. It is written to survive fix/reminders-skip-quiet-books adding `quiet`.
  - On the real store (node:sqlite), a canary word saved in a letter and in a draft never reaches a planned title or body, at any cadence, with names on or off.

## How it was checked

All 7 pass on develop (`ea31f09d`), as a never-list should: the rows hold today. To show the tests bite, two mutations were run and then reverted:
- a guilt word and a count in the first neutral evening body fails 2 R5 tests;
- the planner naming a child with names off fails R6a.

Run note: `tsc --noEmit` shows the 5 known errors only. The first push had one type error in this file (the title set took the copy's literal types); the second commit fixes it. The full apps/mobile suite (3 workers) shows the sandbox baseline plus 3 files that timed out under load on the shared machine (`book-cover`, `qa-kill-harness`, `account-deletion-switch`). They pass alone, and this PR changes no code.

## What only a phone can prove

Nothing new. The lock-screen rendering of the neutral words is J-N24's device row (BL-948).

## Way back

Delete the test file.

## Globs touched

`apps/mobile/test/reminders-never-list.test.ts` only.

## Founder, look first at

Nothing blocking. The guilt list is the card's list plus plain inflections (missed, missing, forget, forgotten, streaks).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
