## Review A at 3ae9eab2a6ce6677f8059db5e1583c956ab4a9c6: PASS WITH NOTES

PR #520, delta re-review (lens A) of one commit on 1a195814 (my Review A5 was at 1a195814 and was already written, so this one supersedes it). Head read from gh api: 3ae9eab2, one parent 1a195814. I read it in a detached worktree (removed after). No must-fix.

### The delta is two files, text only
- `git diff --stat 366f8564 3ae9eab2` (my A4 head): exactly `docs/agents/exec/RULINGS.md` (14 lines) and `packages/content/src/strings.en.ts` (3 lines). Since 1a195814: the same two files, 7 added and 6 removed. No code line, string value or test changed; the `strings.en.ts` hunk is a comment (lines 880-882), so every string, and all A4 results on source, tests and the merge of develop, stand.
- Banned characters: the lines added since 366f8564 have 0 non-ASCII characters (no em or en dash, curly quote, ellipsis character or emoji), no `...`, no `--`, no tab or CR; the CCO-6 section as a whole has 0 non-ASCII. (`strings.en.ts` has 6 non-ASCII lines elsewhere in the file; none is in this PR's lines.)

### What changed in CCO-6 and what I checked it against
- Vacuum key sentence (closes my A5 note 1). Now: three keys exist only to carry out a deletion and are removed when it ends; `db.secureDeleteVacuumAt` "only records that the one-time database rebuild has run, holds a time and nothing else, is written on every phone's first open (`store.ts`, `vacuumOnceForSecureDelete`) and is removed by Erase everything so the rebuild runs once more." Matches the code: `store.ts:198-207` runs VACUUM and the WAL truncate when the mark is absent, then writes `c.now()`; `removeEverything` deletes every setting except the pending mark and the kept 18+ stop (`wipe.ts:128-146`), so the mark goes and the rebuild reruns at the next open. The book keys: removed on Restore (`wipe.ts:49`) and with the book (`wipe.ts:119`); the pending mark by `finishEraseEverything`. True.
- D-132 citation (closes A5 note 3). "A DECISIONS.md entry recording his answers follows in a docs PR (D-132 lets Karma merge entries that record the founder's own words)": D-132 amends D-125 item 5 for DECISIONS.md exactly so (`docs/DECISIONS.md:1021`).
- `doneA11y` (closes A5 note 4): now "a string from the account-security proposal (content.md 4.11, a Project document; it is in no registered map)". `strings.en.ts:911` holds it, the comment at :880 points at that proposal, and `doneA11y` / "Everything on this phone is erased" appear in no test or map under `packages/content` (the registered maps are in `features/account-deletion.en.ts` and four content tests; none lists the erase strings).
- New "Not approved": the four lines in the store listing, the website or other public copy (the marketing seat's condition; the founder has not decided it). I grepped `apps/web`, `packages/content/src` and `docs/store` for the four lines: they appear only in `settings.erase` (`strings.en.ts:885-891`). The one other "We hold no copy" (`strings.en.ts:1345`, the export screen footer) predates this PR (git blame: in develop caba0215). So the condition holds today.
- Seat positions in "Why": privacy and compliance said ship the absolutes now, legal said hold until counsel reads them, marketing said in the app only; on the free-letters sentence privacy, legal and product keep, business, marketing and design cut; the line is true only where a limit exists (store build) and until an old backup is restored. I compared this with the council record I hold (outside the repo); it matches line for line. "The founder chose to ship and to keep the sentence" rests on the PR body and the earlier ruling; I cannot check the session.
- The `strings.en.ts` comment: "`failed`, `backups` and `plusStays` are the council's wording of 8 Nov (founder decision), not 4.11's." True: the three differ from the earlier wording by the council commit e5609b78, and the strings listed as 4.11's are still pinned word for word by `erase-all.test.ts`.
- Earlier A5 references still resolve (24-hour stop cases at `erase-all.test.ts:728-790`, `age-gate-erase.test.ts`, `store.ts:1042-1046`, `localDeletionAllowed` at `store.ts:939`). I did not re-read them line by line; no code moved.

### Notes
1. Way back says "the Erase everything row, the Delete this book screens and the four settings keys go". A revert removes the code that reads and writes the keys, not rows already on a phone. After a revert, a book in Recently deleted (`book.deletedAt.<id>`) shows again as a normal book (nothing is lost), and a half-finished erase (`erase.everything.pending`, `book.erasing.<id>`) is no longer resumed. Nit; worth one clause.
2. Still open from A5, unchanged: "the failed line says a late retry also erases what was written in between" (the string is about the next open; a late press does the same, verified in A4). Nit.
3. The number CCO-6: this file holds CCO-1 to CCO-5 (CCO-3 is on #454), but code on develop already cites "CCO-8" (`where-live.logic.ts:6`) with no entry in RULINGS.md, so CCO-6 and CCO-7 may be taken in a document outside the repo. The fence does not check the number. Confirm CCO-6 is free before the approval line cites it. Not verified.

### Ran at this head
- `packages/content`: 12 files, 281 passed. `erase-all` 51, `age-gate-erase` 3, `reminders-erase` 2, `billing-alpha` 16: 72 passed (no source changed since my A4, where the whole `apps/mobile` suite showed only the 61 known failures, reproduced on develop).
- `git merge-tree --write-tree origin/develop 3ae9eab2` (develop still 1189fdff) is clean, tree fd5e43dd.

### CI at this head
Success: install, web (typecheck, test, build), functions-deploy, migrations unchanged, sizes, native files changed, agent team consistent. In progress or queued when I looked: `typecheck`, `tests and content rules`, `database rules`, edge functions, B-8, `web e2e`, `e2e simulator app`, and one `store-profile Release launch` (the other is skipped); no `required` result yet. `compliance-fence`: failure (no approval line yet; expected). A PASS holds only once required CI and the store-profile Release launch are green at this exact head and the fence has its approval line.

### Not verified
Any device or simulator run; the unfinished CI jobs; the session where the founder answered; whether CCO-6 and CCO-7 are used elsewhere; counsel's reading of the absolutes and Terms 8.1.

Reviewer: independent of the author (CR-44).
