## Review A at 30098973eb7ad44fcbe82c69c62d6eafa5a8dcb8: PASS WITH NOTES
Lens A, delta review. `gh api` confirms the head is 30098973 (one commit on 72901754; parents 72901754 only; 5 docs files, 14 insertions, 14 deletions). origin/develop is still 95df5c41. Docs only. Against develop the PR is still exactly the same 6 docs files, 809 insertions, 18 deletions; no source file differs from develop.

**Both round-four must-fixes are closed**
1. CPO-10 / #723: DELETE_THIS_BOOK.md line 10 now says "CPO-10 (merged 9 Nov 2026, `docs/agents/exec/RULINGS.md`)" and line 117 "merged with PR #723, 9 Nov 2026". True: #723 merged_at 2026-11-09T18:06:45Z and CPO-10 is at RULINGS.md:136 on develop. The new BL-776 sentence ("reads `needs-decision` on develop until PR #715 (the backlog hygiene PR) moves it to ready, Mode pair") is also true: develop's BL-776 is needs-decision, and #715's current head (ea62e848) sets BL-776 to "Status: ready ... Mode: pair".
2. #712, #713, #714, #717 wording: grep of the four specs and COMPONENTS.md for "open PR", "open pull", "not merged", "unmerged", "not yet merged", "in open", "once PR #" finds only "once PR #596 lands" (DELETE lines 14 and 170, WRITE line 10). #596 is still open, so those are correct. Every other mention is now "merged": DELETE lines 172, 198, 200 (#714), STRUGGLING lines 117 and 153 (#713), WRITE lines 13, 72, 169, 175 (#717), COMPONENTS lines 24 and 27. The merge dates "9 Nov 2026" are right for all five PRs (merged_at 18:05Z to 18:40Z).

**The two COMPONENTS.md cells against develop's code**
- SpeechRow: "fixed by PR #712 (merged): the action word was hidden ... Now the word is in the label (`ListRow` `actionWord`) and the node stacks; S1-97b (e) checks it on a phone". speech-row.tsx:109 passes `actionWord={row.trailing ?? undefined}`; list-row.tsx:87-88 builds the label with `rowLabel(... actionWord ...)` and list-row.tsx:106 draws the node under the title when `trailingNodePlacement` says `under` (list-row.logic.ts:66-69: AX gives 'under'). S1-97b (e) exists on develop ("At AX5 the word sits under 'English' ... Saying 'Tap Stop' stops the download"). Correct.
- HelplineCard: "fixed by PR #713 (merged): the buttons were `secondary`, whose fill is 1.08 : 1 (light) and 1.33 : 1 (dark) against the card; they are now `outline`; S1-150 (g) checks it on a phone". helpline-card.tsx:41 is `variant="outline"`; the 1.08 / 1.33 figures are the ones I recomputed in round one; S1-150 (g) exists on develop ("Call and Text are outlined buttons in both modes"). Correct.
- Header sentence added to all four specs ("later merges (#712, #713, #714, #717) moved some, so resolve a citation with `git show 6cd2223b:<path>`") is accurate and answers my note. WRITE.md section 3 now says "At 6cd2223b write.tsx did not import footerPlacement; #717 added it", which is true of both commits.

**Ran at this head:** no conflict markers; 0 non-ASCII bytes added (delta or whole); `git diff --check` clean; no banned words. 18 mobile files that read docs, the plan, the write session and the merged #712 to #714 and #717 tests: 299 passed. Content package 367 passed. release-catalog check passes. merge-tree: clean against origin/develop and #715; against #596 one hunk in COMPONENTS.md 2.20, as the body says (#596 also conflicts with develop in COMPONENTS.md and MOTION.md on its own).

**CI at this head, read at 18:47:** install, edge functions, no e2e seam, applied migrations, compliance-fence (two runs): success. database rules, tests and content rules, typecheck: in progress; `required` has not appeared. A pass holds only once required CI is green at 30098973.

**Must-fix:** none.

**Notes (not blocking)**
- S1-153 rows (d) and (e) now largely duplicate rows that #713 and #712 added to develop (S1-150 (g) and S1-97b (e)). Their "Expected without PR #7xx / With #7xx" sentences are still true, but a tester will do the same check twice. Consider trimming (d) to the rotor's Headings step and (e) to a pointer at S1-97b (e).
- DELETE_THIS_BOOK.md sections 4 and 8 still read in the present tense for what #714 changed ("nothing tells the person what turns it on", "Built: no focus move"). The status line and the new header say these are at 6cd2223b, and section 11 items 1 and 3 say Done, so this is readable; one "(at 6cd2223b)" in those two places would remove the doubt. The hint is also still tagged PROPOSED although #714 built it.
- Older unchanged nits: `delete-account.tsx:206` uses the same `bg-destructive` override 2.1 describes; WRITE.md item 6 owner versus the `mobile` hand-off; "S1-151 has not been run" unattributed in 2.20; the PR body's "New" bullets are stale.

**Not verified:** anything only a phone shows; the full root `npm test`, `test:db` and mobile `tsc` (docs only, CI running).

Reviewer: independent of the author (CR-44).
