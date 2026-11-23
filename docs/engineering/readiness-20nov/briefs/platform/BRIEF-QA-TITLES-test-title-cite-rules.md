# BRIEF QA-TITLES: the test-title cite rules C-01 and C-02, as a check that reports

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: nothing for a report-only check. Making it fail a PR needs BRIEF BL-964's ratchet (same file) and the founder's G0 decision. The C-01 rule ("one cite means the whole row") is a human review rule; only its form (C-02) can be machine checked.**

```
BRIEF QA-TITLES                                   Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: qa   Lane: Pack 10 (+ qa)   Build: 13   Wave: 1

1. GOAL: When a test title cites a row in parentheses, in a comma list inside one bracket, or without the bracket, or a set of tests proves a row without the set comment, `node scripts/qa/title-cites.mjs` prints file:line and the rule id and, in report mode, exits 0.

2. CARD ROWS and TEST TITLES: C-01, C-02, C-10 (CHECKS-AND-BALANCES.md lines 29-62, #924); P-8 ruling T1.
   Tests (scripts/qa/title-cites.test.mjs, new; add to root `node --test` list, package.json:11):
     [C-02] a parenthesised cite is reported             [C-02] a comma list in one bracket is reported
     [C-02] two bracketed ids in a row are accepted      [C-01] a row cited by two tests needs the set comment on exactly one
     [C-10] a stand-in test without `[stand-in]` is reported (needs a list of stand-in files: Rec, `*e2e*`, `*pglite*`; [U] decide with qa)
   Red on develop: today 2 titles cite in parentheses [V grep: account-scope.test.ts:47 `(NS-10-R3)` and one more]; `[stand-in]` appears 0 times in apps/mobile/test [V], although `trace.mjs:523` counts it.

3. FILES
   Touch: scripts/qa/title-cites.mjs and .test.mjs (new), package.json (root `test` list), docs/engineering/readiness-20nov/quality/ is NOT edited (qa's folder, merged separately), docs/agents/checkins/qa-titles.md
   Never: test files themselves (BRIEF P-8-9), trace.mjs (BRIEF BL-964; import its `nsBracketed`, do not copy the regex).
   Shared file: scripts/trace.mjs exports `nsBracketed` (:533) and NS_SOURCE (:524); if they must change, that is BL-964's PR.

4. READING PACK: CHECKS-AND-BALANCES.md sections 1 to 3 and 8 (fifteen rejection reasons); scripts/trace.mjs:520-540; the set-comment example at apps/mobile/test/sweep.disk.test.ts:416; docs/agents/checkins/qa-p8.md.

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/test/account-scope.test.ts:36   `describe('[X4-R1] bookVisibleTo: the whole table'` (bracketed, good)
   apps/mobile/test/account-scope.test.ts:47   `it('different owner: hidden (NS-10-R3)'` (parenthesised: trace cannot see it)
   apps/mobile/test/sweep.disk.test.ts:416     the set comment, exact merged form: "NS-09-R3 is proven by this set together, each citing it: <file>:<line> (...) and ..."
   scripts/qa/skip-guard.mjs                   the neighbour pattern (a Node script with its own test; not in root `test` either: grep package.json and workflows 0 hits [V])

6. DATA AND SECURITY: none. Prints paths and ids only. Boundary: none.

7. LIBRARIES: none.
8. BUDGETS: under 3 seconds (reads test files as text, no TypeScript parse: a regex pre-filter like `rules.test.ts`).

9. ACCEPTANCE: output `file:line rule id message`; exit 0 in report mode, 1 with `--check`; every rule has a positive control fixture inside the test and a mutant (relax the parenthesis regex, the parenthesis test goes red).

10. PR BREAKDOWN: PR 1 | ~140 lines, 3 files | base develop | report only, not run by CI until wired (flag-off proof: `npm test` output unchanged except one new test file).

11. LENSES: A principal-architect, B qa peer (a second qa session) [E].

12. ORDER: after BRIEF BL-964 PR 1 (shares the regex). Before BRIEF P-8-9 (it lists what to retitle). Blocked by nothing.

13. DONE: [ ] `node --test scripts/qa/title-cites.test.mjs`; [ ] `npm test` baseline; [ ] ASCII; [ ] PR body per HARNESS-RUN; [ ] journal #7; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing.

15. STOP AND ASK: a rule would reject a title the card itself writes (NS-09-R4b: card says `[NS-09-R4]`); whether stand-in detection by file name is acceptable.

16. HARNESS: journal #7; marker `<!-- journal run:sess-20261120-qa-titles agent:qa -->`; branch qa/title-cite-rules; labels agent:qa, from:agent.
```
