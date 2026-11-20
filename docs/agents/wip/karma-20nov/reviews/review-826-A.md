## Review A at 8614b564018bf22cdd974b2279f026cdc3ef9b69: PASS WITH NOTES
Head verified (gh: 8614b564, base develop, merge-base be8e11fc). PR body and CLAUDE.md read. One commit, one file:
apps/mobile/test/reminders-inline.test.ts (+21/-7); `git diff origin/develop 8614b564 --stat` shows no product code.
Read: planner.ts (slotOrdinal 212-220, eveningCopy 243-247, evening loop 346-355, DEFAULT_DAYS [2,6], DEFAULT_TIME 20:30,
BIRTHDAY_TIME 9:00), scheduler.ts (nextReminder(now = Date.now()) 129-131, deviceTimeZone 52), reminders.logic.ts
(previewOf, weekdayOfIso), content reminders.en.ts:21, core prompts.ts renderTemplate.
Diagnosis confirmed. slotOrdinal replicated in node: on Tue/Sat the ordinal mod 8 is 7 ("A page for {weekday}") on
20 Oct, 17 Nov and 15 Dec 2026, a 4-week cycle. Develop's file on today's real clock (Tue 17 Nov 15:05 UTC): 1 failed,
9 passed, "expected [...] to include 'A page for Tuesday'", the CI message. Run 43729885717 (#764, 15 Nov, 2 attempts)
exists and failed. The store was pinned to 18 Oct 2026 while the planner read the live clock; the fix hands both NOW.
Runs (vitest 3.2.7, worktree at head, Date faked via a setupFile with vi.useFakeTimers({toFake:['Date']})):
fixed file on the real clock 10/10; faked Sun 15 Nov, Tue 17 Nov, Sat 21 Nov, Tue 15 Dec 2026 (12:00 UTC) 10/10 each.
Develop's file faked Sun 15 Nov: 1 failed (same message); faked Sat 21 Nov: 10/10 (outside the window, as claimed).
Mutations (planner.ts, reminders.logic.ts; each restored, git status clean): title left unfilled: fixed test FAILS on the
new /\{\w+\}/ assertion, while develop's file with the same mutation at Sun 15 Nov PASSES (the raw template was a
candidate), so the change strengthens the test. previewOf fixed to 'Tonight': FAILS (toContain). previewOf fixed to a
real neutral title: passes on fixed and develop alike (pre-existing, Note 1). Body unfilled: passes; neutral bodies
carry no placeholder, so no signal there.
Planner probe (direct planReminders, child Asha 2026-03-01, NOW 18 Oct 12:05 UTC): default cadence gives 2026-10-20
20:30 variant 7 "A page for Tuesday"; everyEvening 19:00 gives 2026-10-18 19:00 variant 0, so moved.hour 19 is the
planner's answer, also in Pacific/Kiritimati, Pacific/Pago_Pago and Asia/Kolkata (next.date stays 2026-10-20). The old
ternary (next.kind === 'birthday' ? 9 : 19) only tolerated the live clock landing on 1 March (birthday note at 9:00);
it read next.kind, not moved.kind, so it was a live-clock guard, never a planner rule.
Full apps/mobile suite: 267 files, 8 failed / 259 passed; 4950 tests, 73 failed / 4877 passed; the 8 failing files are
exactly the sandbox baseline. tsc --noEmit: 5 errors (help-fallback.tsx 1, app-lock/controller.ts 4). Added lines:
0 non-ASCII bytes; whole file 0. Fixtures: Asha only. `@scribe/core` is already a mobile dependency (32 other mobile
tests import it). merge-tree origin/develop..8614b564: clean (eb2e3ec3). CI at head (15:13 UTC): required and every
other check success; "store-profile Release launch" still in progress.
Must fix: none.
Notes
1. test:185-190 pins the preview to the 9 candidate titles, not to the variant the pinned date selects. With next.date
   asserted as 2026-10-20, asserting preview.title === 'A page for Tuesday' and the body would make the comment at
   177-179 enforced rather than descriptive, and catch a planner that stops rotating or a VARIANTS or DEFAULT_DAYS
   change that leaves that comment stale. Optional; the candidate-list shape is pre-existing.
2. #764 carries the same change cherry-picked; it no-ops once develop has this.
Not verified: the test under a non-UTC process TZ (planner probed directly in 3 zones instead); window edges
(Sat 20:31 to Tue 20:29) sampled at 12:00 UTC only. PASS holds only once required CI is green at this exact head.
Reviewer: independent of the author (CR-44).
