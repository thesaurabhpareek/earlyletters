## Review B at 8614b564018bf22cdd974b2279f026cdc3ef9b69: PASS WITH NOTES

Head verified 8614b564018bf22cdd974b2279f026cdc3ef9b69 (base develop be8e11fc, one commit, one file, +21/-7). Read: PR body, CLAUDE.md, the test at head (264 lines), planner.ts 212-233 and 243-247 and 340-365, scheduler.ts 52-55 and 130, lib/copy.ts 42-46, reminders.logic.ts 48-51 and 85-87, reminders.en.ts 11-24 and 85, core prompts.ts 164-166, ci.yml 134-147.
Ran, in a detached worktree at the head:
- apps/mobile test/reminders-inline.test.ts: 10/10 pass in UTC (Tue 17 Nov 2026 15:05Z) and under TZ Pacific/Pago_Pago, America/Los_Angeles, Asia/Kolkata, Pacific/Kiritimati.
- develop's copy of the file on the same clock: 1 of 10 fails, "to include 'A page for Tuesday'" (today is inside the cited window), so the diagnosis holds.
- planner mutated to leave the evening title unfilled: head test fails on the placeholder guard (1 failed, 9 passed); reverted. Not weakened.
- packages/content: 18 files, 395/395 pass, no-real-family-data.test.ts 11/11 inside it.
- git diff origin/develop 8614b564 --stat: the test file only. 0 non-ASCII bytes added.
- slotOrdinal with DEFAULT_DAYS [2,6]: 2026-10-20, 2026-11-17, 2026-12-15 give ordinal % 8 = 7, the 8th neutral variant "A page for {weekday}" (reminders.en.ts:21); 2026-10-17 gives 6. The body's "every 4 weeks" holds.
- Cited run 43729885717: failure on both attempts (1 and 2), head 6c5e5f31, Sun 15 Nov 2026 15:26Z.
- CI at the head (15:09Z): required, applied migrations unchanged, compliance-fence all success (the three branch-protection checks); typecheck, tests and content rules, database rules, Deno, no e2e seam, install all success; store-profile launch still running (not required).
Checks (1) to (5): no product code, string or doc touched; candidates come from reminderCopy via @scribe/content and are filled with renderTemplate from @scribe/core, no copied product literal; the fixture clock comment is true (Sun 18 Oct 2026 12:05Z, next Tuesday the 20th, nextReminder(now = Date.now()) at scheduler.ts:130, re-exported at lib/reminders/index.ts:38); the "why 19" claim is true (the store's only child, Asha, has no note on 18 or 19 Oct); fixtures are the fictional family Asha only, no new name, email, phone or birth date; the describe title and the other 9 tests are untouched, the preview title must equal one of the 8 neutral variants or monthOpen from the content, and no unfilled placeholder may remain.

Must fix: none.

Notes
1. PR body, "Merge": "#764 carries the same change (cherry-picked)". At review time #764's head is 6c5e5f31 (11 commits, updated 14:58Z today) and its copy of the file is byte-identical to develop's, so #764 does not yet carry it and stays red on the weekday days until the cherry-pick is pushed or develop has this. Correct the body or push; not blocking this PR.
2. The planner fills through fill() (apps/mobile/src/lib/copy.ts:42), which is renderTemplate plus a child-label fallback for an empty {child}. The neutral titles carry no {child}, so the test's renderTemplate yields the same words; the comment "the way the planner fills them" is accurate for these variants.
3. Pre-existing, optional: preview.body is checked for 'Asha' and placeholders only, not matched to the variant's body from the content as the title is. Not introduced here.
4. The weekday-variant claim at test line 177 rests on default prefs (fewTimes, Tue/Sat, names off), which the fresh store gives; stated for the record.

Not verified: full apps/mobile suite counts (4877 pass, 73 baseline fails) and the tsc "5 known errors" claim (CI typecheck is green at the head instead); the store-profile launch check, still running at 15:09Z and not required.
PASS holds at this exact head: the three required checks are green as of 15:09Z; it lapses if the head moves.
Reviewer: independent of the author (CR-44).
