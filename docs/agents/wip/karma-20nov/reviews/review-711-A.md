## Review A at d8b7ace185f6627fd25e5512a85a40c707567df7: PASS WITH NOTES

Lens A. Delta review of PR 711 fifth commit (d8b7ace1) on 606531af. Head sha matched the API. `git diff --name-only 606531af d8b7ace1` lists one file, the runbook (5 lines added, 5 removed, 277 lines total, same as before). No must-fix. This replaces my review of 606531af; everything else in that review stands unchanged (it is not repeated here).

**The five edits, checked**
1. Line 46: row 1 now says the kind is `other` or the kind of the route its request goes on through. Both are values in the log's kind list (line 61). Closes my note.
2. Line 49: lawyer, court or police row now says "No action, no disclosure, and no reply until counsel says so". It is the row that overrides the heading's default (line 42: "Unless a row says otherwise, send the first reply"), so it reads consistently. The executor and custody rows still take the generic first reply, which is harmless (it says nothing about an account); I do not ask for more.
3. Line 50: the Terms 4.4 quotation now starts "If someone's safety is at risk, contact us; after checking, we may limit a person's access to a book". I matched it byte for byte against `docs/legal/beta/terms-0.9.0.md` line 68 (grep finds it once in each file).
4. Line 169 (step 4): fill the tags first, "do this before anything else in the block", paste the id, address and name last, never run a find-and-replace after pasting, and a tag is never a word such as tag1.
5. Line 189 (step 7): a refused attempt writes no `ops.audit_log` row and is recorded in the log file only. True: in my probe all 10 id/email mismatch cases and the 61-character case leave the audit count unchanged.

**Order-of-work probe, re-run at this head** (`reviews/probe-711-e.mjs`, embedded PGlite, all migrations, fictional ids, nothing hosted; it reads the SQL block from the runbook file). 52 checks, 0 failures, same as before. Right order (tags filled first, id, address and name pasted last): the attack name `x$<tag3>$; n int; begin delete from auth.users where id=...; end $<tag1>$; do $<tag1>$ ...` is inert, B still exists. Wrong order (name pasted, then a find-and-replace of the tag placeholders): still breaks out, B deleted, block returns ok. So the new sentence is exactly the control that separates the two outcomes, and it is stated before the founder touches the block, in the one place that matters; an instruction cannot do more. The remaining exposure needs two slips together (wrong order, and a missed `$` in step 1, which refuses this name because it holds dollar signs). Route 2 probe: 15 of 15.

**Other delta checks.** 0 non-ASCII bytes in the runbook. `git merge-tree --write-tree origin/develop d8b7ace1` exits 0 (develop still 6cd2223b). `docs-leak-guard` clean; `packages/content` vitest 15 files, 367 tests passed. CI at this head: 9 of 9 check runs success, `required` included (it finished while I watched; typecheck, database rules and tests and content rules had been in progress).

**Nit (no action needed to pass)**: line 169 says "A tag is always the hex from the echo line". The tag is the whole word the line prints (a letter plus 8 hex digits, `q`, `e`, `n`). A founder who drops the letter and keeps bare hex may start a tag with a digit; that fails closed (42601, probe 4). Saying "the whole word the echo line prints" would be exact.

**Not verified**: unchanged from my last review (hosted behaviour of any SQL and of the SQL Editor, the `auth.users.email` join on a hosted project, how the founder sends mail as hello@, Apple's screens, relay registration, hosted migration state). A PASS holds only while required CI is green at this exact head; it is.

Reviewer: independent of the author (CR-44).
