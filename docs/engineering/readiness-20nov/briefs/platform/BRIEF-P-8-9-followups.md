# BRIEF P-8-9: follow-ups to the P-8 retitles and the P-9 never-list tests

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: nothing for the audit and the retitles of rows whose cards are on develop. Retitles for ids that only the locked pack defines still print "defined nowhere" until #846 merges; do them anyway (the cites are right) and say so. Product owns any card fix (NS-09-R4b title says R4).** P-8 merged as #888, #889, #890 (12:55 to 13:05 UTC) and P-9 as #905 (14:05 UTC) [V gh api]; this brief is only what was left or can be wrong.

```
BRIEF P-8-9                                       Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: qa   Lane: Pack 10 (+ qa)   Build: 13   Wave: 1   (plan 2.9 rows P-8, P-9)

1. GOAL: When trace is run on develop, every P0 row that a live test proves wholly (or as a stated set) is listed as tested by its NS id, no test cites a row it does not wholly prove, and the P0 rows of the never-list that hold the Build 13 cut have a test that fails when any clause breaks.

2. CARD ROWS and TEST TITLES
   Rows: NS-35-R1 (11-foundations.md:536 at the lock: `[NS-35-R1] only Home starts`), NS-13-R5, R6a, R6b (09-capture.md:143-144), NS-09-R1 to R3, NS-17-R10, NS-25-R2, R4 (retitled in #888 to #890).
   Tests that must carry the exact titles:
     [NS-35-R1] only Home starts      (candidate: navigation-one-entry.test.ts `[IA-N3]` line 209, plus `[IA-N5]` line 221: audit under C-01 whether the two together prove "none starts a new letter or take"; if yes, `[NS-35-R1][IA-N3]` and a set comment)
     [NS-13-R6a] the notification pool is name-free        (exists: reminders-never-list.test.ts:106)
     [NS-13-R6b] no letter words on the lock screen        (exists: :130)
   Each stays green on develop; the audit is whether each could stay green with a clause broken (CHECKS-AND-BALANCES C-01). Red-on-mutant is the proof (section 9).

3. FILES
   Touch: apps/mobile/test/navigation-one-entry.test.ts (titles and one set comment only), apps/mobile/test/reminders-never-list.test.ts (only if the audit finds a clause missing), docs/engineering/readiness-20nov/quality/ is NOT touched,
          docs/agents/checkins/qa-p8-followup.md
   Never: product code; card files; tests owned by an open PR (list with `gh api pulls/<n>/files` before the first edit; #879, #871, #894, #895 touch tests near these).
   Shared file rule: a test file an open PR also edits: do not edit; list it in the PR body for its owner (P-8's own rule, qa-p8.md line 1).

4. READING PACK: Pack 10 item 1; CHECKS-AND-BALANCES.md sections 1 to 3 and 10 (#924); docs/agents/checkins/qa-p8.md (both lines); the card rows above at the lock (`git show origin/docs/prd-lock-v1-20nov:docs/product/prd/09-capture.md`).

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/test/reminders-never-list.test.ts:78 `[NS-13-R5] no guilt words`; :106 `[NS-13-R6a]`; :130 `[NS-13-R6b]` with a real-store canary test at :152
   apps/mobile/test/sweep.disk.test.ts:416  the set comment for NS-09-R3 (the accepted form)
   apps/mobile/test/navigation-one-entry.test.ts:209-221  `[IA-N3]`, `[IA-N5]` (no NS-35 id anywhere in apps or packages: `git grep NS-35` -> 0 hits [V])
   apps/mobile/test/account-scope.test.ts:47  `(NS-10-R3)` in parentheses (a C-02 breach: trace cannot see it; the right test is BL-961's, so only note it)
   Gaps handed on, not done here: NS-32-R12 (no letter words or child name in a notification by default) has no test (BL-966, mobile); NS-13-R3, R4, R10 to R13, R15 (BL-943).

6. DATA AND SECURITY: no new data. The audit reads tests that guard "a name or letter words on a lock screen" (never-list). Boundary: notifications. Read: compliance-engineer. Nothing is logged.

7. LIBRARIES: none.
8. BUDGETS: none (no new test time).

9. ACCEPTANCE: (a) a table in the PR: for each cited row, the clauses of Given, When, Then and the test that ticks each (union rule); (b) rows that fail the union lose the cite and keep their own id (C-01), listed for product; (c) the trace run before and after: untested P0 count, with the locked register
   (`node scripts/trace.mjs --no-write --register <locked 14-test-plan.md>`; today 296 P0: 39 tested, 13 device, 244 untested [V qa]). Done also means each retitled test is red on one mutant per clause (for R6b: pass a letter word into the planner input).

10. PR BREAKDOWN: PR 1 | ~60 lines, 3 files | base develop | no flag (tests and titles only).

11. LENSES: A qa peer, B compliance-engineer (R5, R6a, R6b are lock-screen rules); mobile reads (tests under apps/mobile/** by a qa name).

12. ORDER: after BRIEF QA-TITLES (it lists offenders). Independent of BL-964. Blocked by nothing.

13. DONE: [ ] focused tests; [ ] `npm test -w apps/mobile` baseline (8 files, 73 tests); [ ] ASCII; [ ] PR body per HARNESS-RUN; [ ] journal #7; [ ] check-in.

14. ONLY A PHONE CAN PROVE: J-N24 (a week with reminders on and default settings: no name or letter words on the lock screen) and NS-13-R14 after sign-out (device sheet 6.1 rows); list them, do not claim them.

15. STOP AND ASK: a retitle would need a product-code change; the union rule fails for a never-list row (that holds the cut: tell Karma); two tests disagree on a row.

16. HARNESS: journal #7; marker `<!-- journal run:sess-20261120-qa-p89 agent:qa -->`; branch qa/p-8-9-followups; labels agent:qa, from:agent.
```
