## Review A at be1f3bab7fc88bfb43a4a56077e94de5c8b05856: PASS WITH NOTES

Third review (lens A: accuracy against code and repo records, mergeability), delta only against my review at ea62e848. Head matched the PR. The branch is `docs/BACKLOG.md` alone; its merge base is the current develop tip e5cc7ecd.

**Did the merge bring in anything that touches BACKLOG.md?** No. Develop since 95df5c41 is two commits, #719 (docs/design/screens/*, COMPONENTS.md, DEVICE_TEST_PLAN.md, release-test-catalog.csv) and #725 (Write autosave, mobile code); `git diff --name-only 95df5c41 origin/develop` lists no BACKLOG.md. The PR against develop is still one file, 42 insertions and 23 deletions, and `git merge-tree --write-tree origin/develop origin/pr-715` exits 0. The new commit be1f3bab changes 7 lines of BACKLOG.md and nothing else.

**What I ran at this head.** `scripts/agents/check.mjs`: agent team consistent, 396 tasks. `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 136 pass. packages/content vitest: 15 files, 367 pass (includes `claims-capabilities.test.ts`). `eligibility()` over BL-405, 775 to 783: only BL-775 and BL-781 are dispatchable; BL-776 is ready with Mode pair, so it is not; BL-405 is needs-decision. Added lines against develop (42): 0 non-ASCII bytes, no three-dot runs. `trace.mjs --no-write`: 5 new undefined ids over develop (F05-REQ-052, F05-REQ-053, F09-REQ-034, F09-REQ-038, F20-REQ-022), exactly the five the body now names; report mode, CI does not use `--check`. CI at this head: 7 of 9 runs success; "tests and content rules" and "database rules" were still running when I looked and "required" had not reported, so a PASS holds only once required CI is green at this exact head.

### My must-fix: answered, with two lines left
- BACKLOG.md:2880 no longer says "written in the same change". It lists the Proposed ids and the F17 rename as held in PR #726 until the CPO confirms, says they are not on develop, and says trace lists them as cited but undefined. Checked.
- Marked as in #726: BL-405 (line 1329), the BL-659 Satisfies (2882), the #614 note (2884), the #661, #662 and #675 note (2885). Checked in the file.
- The body's trace sentence (line 40) now names the five ids, and line 14 says the forward references exist. True.
- BL-776 Satisfies now says 6.2 C step 8 "still says its sole-parent shelf is not built, which #520 made stale: Restore the book exists". True (`strings.en.ts:861`, `recently-deleted.tsx:59`). Its third Acceptance bullet is labelled "the row author's inference from CPO-10's 'while a deleted book waits', not the CPO's words". True to CPO-10 (RULINGS.md:136).
- BL-775 stays ready and agent. I read that as your call, not an error: the row says the founder approves new failed-line words before merge (D-144) and cites the council answer as outside the repo. CCO-6 does list it as a follow-up (RULINGS.md:119 onward).

### Should fix (one line each; neither blocks)
1. BACKLOG.md:2988, BL-783 "Also cited: F17 6.2 A (updated 9 Nov 2026)". That update is the #726 rename and is not on develop; mark it "(updated in PR #726)". The body's line 14 does not list BL-783 among the rows that point forward.
2. BACKLOG.md:2882, BL-659 bullet, "(F09 Q8)" twice. Q8 exists only in #726 and the section preface at 2880 lists the Proposed ids but not Q8. Say "F09 Q8 in PR #726".

### Nits
- #719 is now on develop, so `docs/design/screens/BOOK_PAGE.md`, `DELETE_THIS_BOOK.md`, `STRUGGLING.md` and `WRITE.md` exist. The BL-659 bullet's "The design, `book-page.md`, is a Project document and is not in the repo" is still true of the proposal file but a reader can now open BOOK_PAGE.md; say so. BL-776 can cite `DELETE_THIS_BOOK.md` (section "The sole-book problem (ruled: BL-776, option (a); placement OPEN)", which agrees with this row: the CDesO places it) and device step S1-153 (a), which walks the sole-book outcome before and after the BL-776 row; its Acceptance says "a device step ... walks it".
- The section preface still says "from `develop` at d4b8f5f1"; the cited lines still hold at e5cc7ecd.
- The #614 bullet says "which I did not check"; write "unchecked".
- BL-780 is M9 and BL-781, the same lines, is M-JR (carried from the last review).

### Not verified
Anything run on a phone. The council answers and Project documents, which are not in the repo. Typecheck, `test:db` and the full `npm test` (no code changed; CI covers them once it finishes).

Reviewer: independent of the author (CR-44).
