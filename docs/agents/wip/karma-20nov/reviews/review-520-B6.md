## Review B at 3ae9eab2a6ce6677f8059db5e1583c956ab4a9c6: PASS WITH NOTES

PR #520, delta re-review (lens B) of `git diff 1a195814 3ae9eab2`. Head confirmed: `git ls-remote origin refs/pull/520/head` gives 3ae9eab2 (the gh CLI is blocked in this session). One commit on 1a195814, two files: docs/agents/exec/RULINGS.md (CCO-6) and a comment in packages/content/src/strings.en.ts (+3/-2, lines 880-882). I compared the non-comment lines of strings.en.ts at 1a195814 and 3ae9eab2: identical, so no string changed. Added lines: 0 non-ASCII, 0 double hyphen, 0 "...". `git merge-tree --write-tree origin/develop 3ae9eab2` against develop 1189fdff: clean. packages/content: 12 files, 281 passed. Everything outside these two files is as in my Review B at 366f8564 (PASS on code, strings, tests and the device plan).

### My must-fix A, B and C: closed
- A. The minimisation sentence is now true. Three keys exist to carry out a deletion and go when it ends (book.deletedAt removed on restore or erase; book.erasing removed by removeBook, wipe.ts:119; erase.everything.pending removed by finishEraseEverything). `db.secureDeleteVacuumAt` is described correctly: a time, written on the first open after migrations (store.ts:196-206), removed by Erase everything so the rebuild runs once more.
- B. The Why now has the seat positions I found in the council record: on the absolutes, privacy and compliance ship now, legal holds until counsel reads them, marketing says in the app only; on the free-letters sentence, privacy, legal and product keep it, business, marketing and design cut it (none for compliance or finance, as in the record). It names which seats said the lines are true, and notes the free-letters line is true only in the store build and until an old backup is restored. "Not approved" now bars the four lines from the store listing, website and public copy, labelled as the marketing seat's condition that the founder has not decided. Checked against the tree: none of the four lines is in store.en.ts, pages.en.ts, site.en.ts, the emails or apps/web/src (the one hit in CopyInvite.tsx is a code comment about the clipboard).
- C. D-132 is cited (it amends D-125 item 5: Karma merges DECISIONS.md entries that record the founder's words), and the ruling is called the only record in the repository. doneA11y: `Everything on this phone is erased.` appears in strings.en.ts, erase-all.test.ts and the device plan only, so "in no registered map" is true; "a Project document" is true (proposals/account-security/content.md is not in the tree). The strings.en.ts comment now lists exactly the 4.11 strings and names failed, backups and plusStays as the council's wording; that is accurate.

### Whole of CCO-6 against compliance/README.md, once more
1 checks table: true (age-gate.ts +12/-1, logic files untouched, store.ts:1042-1046, tests named correctly). 2 collection: classes and reason true; the rows are absent and the text says so. 3 facts: sources recorded in the ruling, rows absent, iCloud fact marked unverified; the text says "met for now". 4 promises: founder's two answers recorded; the three strings are byte-identical to the council text; the Family Sharing exclusion is described. 5 door: none. 6 DB-IP: not applicable. The counsel gate is no longer called a "recorded default"; the text says it rests on the founder's answer alone. I found nothing false. Items below are imprecise, not wrong, and none needs a new commit.

### Notes (none needs a new commit; fold into any later push)
- "The seats split on two points": the council record lists four. The other two are the failed-erase code fix (the CPO wanted it with the words) and the sole-book path; both are in the next bullet's Open list, so nothing is hidden.
- "(privacy, legal, compliance and marketing seats said so)": marketing said it of "We hold no copy" only (true of a signed-out phone).
- Way back: "the four settings keys go" is true of the code. Phones that already ran a build with #520 keep their rows, and a book waiting in Recently deleted would show in the list again after a revert. Moot until such a build ships; worth knowing if one does.
- "A DECISIONS.md entry ... follows in a docs PR": that PR does not exist yet. Until it merges, the ruling is the only repository record of the 8 Nov answers; do not let it slip past the compliance line.
- The PR body's "New head" paragraph named 366f8564 as of 22:49Z and said fixes were "in the next commit"; I did not re-read the body at this head. Body edits need no commit. The body also says doneA11y needs "a content ruling" while the ruling names the CPrivO and CDesO; align them.
- Optional: Apple's footer, which the ruling says was not seen: I read it on 8 Nov via WebFetch (summarising): "Last Updated: October 16, 2026".

### What still stands between this head and the founder's compliance line
No code or ruling-text blocker from lens B. Open on this head: a counted Review A at this head, required CI green at this head, the CCO line itself, and counsel's reading of the absolutes and Terms 8.1 (not a gate in the tree; the ruling says so). What the ruling does not cover and counsel must still read are as in my Review B at 366f8564.

### CI at 3ae9eab2 (GitHub MCP, runs from 22:53Z, early)
Success: install, functions-deploy, agent team consistent, applied migrations unchanged, sizes, native files changed. In progress: tests and content rules, database rules, B-8, web, web e2e. Queued: typecheck, edge functions, store-profile Release launch, e2e simulator. Skipped: iOS simulator build, one store-profile run. compliance-fence: failure, expected until the CCO line names this head. No `required` row. A PASS holds only once required CI is green at this exact head.

### Not verified
The founder's session answers and how the options were described (coordinator's word); #654; Apple's behaviour after a later iCloud Backup; anything on a phone; local tsc (the diff touches no code).

Reviewer: independent of the author (CR-44).
