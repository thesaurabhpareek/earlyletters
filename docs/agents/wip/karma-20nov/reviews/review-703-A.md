## Review A at c3bcf161d1f6c5f8ef481a5be606f91048682a2c: PASS WITH NOTES

Lens A, fourth round. Head verified with gh api: c3bcf161, ready for review, base develop (tip d1641686). One commit on 74412b4d. I read `git diff origin/develop...c3bcf161` (7 files, +337/-11) and `git diff 74412b4d..c3bcf161`, then ran the head in a scratch worktree. `git merge-tree` against develop is clean. The branch is now the reduced PR the earlier rounds asked for: the fill() opening capital, one title string, tests and device steps.

### My two must-fix items
1. Dead hello-later prompt: gone. prompts.ts is no longer in the diff (keys, text and PROMPT_LIBRARY_VERSION 4 are develop's), and S1-191 (e) no longer says to press until it comes up. The related claim still holds, and I re-measured it across every age from 0 to 90 months, three name states and six gap values (62,244 draws on Tonight and Write): only "opening" (43,638) and "gap" (18,606) prompts are ever drawn, so no hard, family or together prompt can reach a screen.
2. "Named or not" on the prompt rows: gone with the rows. The one that remains, the birthday title, is correctly "named or not" (planner.ts:259 fills it with "your child" for a blank name, only with Names in notifications on, default off).

### Strings: what changes for a person
- notifications.birthday.title: "Happy birthday, {child}" to "Happy birthday to {child}". Lock screen, Names on, named and nameless, every build. This is the only changed word and the only one for named families; the body says so. It is true of the build and reads right for twins ("Happy birthday to Asha and Dev").
- fill() capital (copy.ts:42-50): with a blank name, a template that opens with {child} now starts "Your child's ...". Sixteen sentences, listed correctly in the body. Named input returns before the new branch, so "Asha's book" is byte-identical. No registered, held or consent text is touched (grep of the test maps and docs/legal).
- Device plan text (S1-191 (e), (h), (i)). No other visible string.

### The rewritten content test: sound, with limits
- Real-fill rendering: it calls the app's fill() by dynamic import (claims-capabilities.test.ts:68 does the same) and capitalises nothing itself. Passes alone in packages/content (5 tests) and `tsc --noEmit` passes.
- Exclusions are derived, not hard-coded: DRAWABLE_KINDS comes from core's kindFor with the screens' three flags; name-themed prompts from core's isNameThemed; the named evening lines by path. I removed each exclusion in turn: each one turns the content test red (evening[2] "Dear your child,"; opening.before.name "name your child"; together.37-60.older-self "the your child"), so none is slack. Their behaviour pins reproduce: planner drawing the named line for a blank name fails first-run-child-name.test.ts (1 test); tonightPromptInput set to `together: true` fails 3 nameless-surfaces tests; a second file calling selectPrompt fails the call-site test (1 test).
- Brittle but fail-closed: SCREEN_ASKS is duplicated in the content test and pinned from the mobile side, with a comment each way; if someone edits only the mobile pin the content test keeps excluding a kind a screen now draws. The call-site test counts `selectPrompt(` as text in every .ts/.tsx under apps/mobile/src, so a harmless refactor (an input variable first) or a future unit test under src would fail it; the failure names the file. Acceptable.
- NOT_SHOWN_YET is still needed: with the list emptied, the test fails on exactly nameCheck.title ("Say your child's name three times") and familySharingHelp ("... your child's other parent ..."), the two strings nothing reads. The only other ways to pass are rewording unread strings (which the earlier rounds declined) or loosening the rules. The guard works both ways: a file mentioning nameCheck fails with "is now mentioned in apps/mobile/src ... make it read well, then remove it"; a reworded string fails with "remove it from NOT_SHOWN_YET". It watches apps/mobile/src only. nameCheck.doneBody ("Your child will be spelled your way in every letter.") reads oddly and is unflagged and unskipped; unread, and the body says so.

### Body, claim by claim
Verified true: the table; the 16 sentences; evening[2], the two prompts, the three unread strings and PROMPT_LIBRARY_VERSION all back to develop's words (strings.en.ts changes one line); evening[5] is develop's; no counsel text; the test descriptions; the mutations (fill without the capital: content 2 fail, mobile first-run 3 fail; I reproduced all four I tried); content 17 files / 388; whole apps/mobile 4546 pass, 72 fail in the same 8 sandbox files that fail on plain develop (4537 pass there, 72 fail, I ran it earlier); core 34 / 1237; tsc only the sandbox errors; no byte at or above 0x80 in added lines (I checked).
Gaps (notes below): the body never mentions apps/mobile/test/sync-nameless-book.test.ts (+50 lines, in the diff); the "16 sentences ... on its screens" includes lines no screen shows today.

### S1-191 edits
(e) and (h) name the right keys and quote the right texts (opening.0-3.name: "Tell your child how the name was chosen."; opening.before.name: "Where did the name your child come from? Who said it out loud first?"), and both can still fail on a broken build (name prompt on 82 of 90 days on Tonight, 90 of 90 on Write; with the flag 0). (i) matches the code (book.tsx:321, the child page title, delete-book toast, recently-deleted card and toast) and its pointer is right: the "Delete this book, the only book" step is S1-153 (a), line 805, and it says the same about a cold start (no screen offers Recently deleted on first run; BL-776 is not built). The id S1-191 is unchanged and unique.

### Notes (none blocking)
1. Mention sync-nameless-book.test.ts in the body, or drop it (one concern: the nameless wording).
2. gentleReturn.title, the family coming-soon lines and the co-parent lines are among the 16 but no screen shows them today (gentleReturn is not wired; planner would pass an already-filled label, so no capital, if it ever were). The capital is right for fill() callers; the body's "on its screens" overstates.
3. S1-191 (i) states S1-153's cold-start behaviour as fact; S1-153 says "read from the code, not seen". Say "expected".
4. S1-191 Needs still says "a build of this branch" though #716 is merged ("a build of develop at d1641686 or later").

### Runs at the head
Content, related mobile, full apps/mobile, core, tsc and the ASCII check as above. CI at c3bcf161: 14 success, 1 skipped, the launch check still running. A PASS holds only once required CI is green at this exact head. Not verified: device (the capital on a phone, the lock-screen birthday note), founder word approval of the birthday title.

Reviewer: independent of the author (CR-44).
