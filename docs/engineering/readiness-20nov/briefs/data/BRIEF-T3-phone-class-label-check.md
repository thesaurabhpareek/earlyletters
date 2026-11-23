BRIEF T3: T3: every phone column carries its class and level in the migration (NS-36-R10)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: qa   Lane: Pack 8 (foundations: data rules)   Build: n/a (test)   Wave: 1   Size: S: about 100 lines, 1 file
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: nothing. The test checks that a label exists, not which one: OQ-P2 (kind, ext and bytes: L1 in #835's comments, L2 in the design default) stays with `privacy`.

1. GOAL: When a local migration adds a column or table without an L1 to L4 label in its comment, then a test fails and names the column.

2. CARD ROWS and TEST TITLES
   Rows: NS-36-R10 (ADR 0028's request to `qa`; not in eval A).
   Test (exact; PR #925 catalogue A): [NS-36-R10] level in the migration    mutant: add a column without the comment
   Red on develop: no phone-side test exists; supabase/tests/classification.test.mjs:51 covers the server only. Run the new test against migrations 5 to 10 first: it must pass (labels exist) or list the gaps for privacy; do not edit old migrations to satisfy it.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/test/migrations-class-labels.test.ts (new), docs/agents/checkins/qa-t3.md
   Never:  apps/mobile/src/lib/db/migrations.ts (append-only; #835 owns v11), supabase/**, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: none.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 8; data-and-sync.md section 2.4 T3 (develop); apps/mobile/test/migrations.v9.test.ts for the harness.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/db/migrations.ts:57    MIGRATIONS array; :393 v10 (newest on develop); :430 LATEST_VERSION
   apps/mobile/src/lib/db/migrations.ts:396-407  the label comment format to parse ('//   column   L2  text')
   supabase/tests/classification.test.mjs:3, :24-25   the server rule to mirror

6. DATA AND SECURITY
Data classes: none (reads source text). Nothing stored, sent or logged. Boundary: classification (DATA-REQ-001, -002).

7. LIBRARIES ALLOWED
none.

8. BUDGETS
Parses one source file; well under 1 s. Not measured.

9. ACCEPTANCE
   Experience: none. Test cases: PR #925 catalogue A NS-36-R10. Security: none.
   Done also means: red on the mutant (a CREATE TABLE added in a scratch copy with no label).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: the test, with a positive control (a fixture string with a missing label fails) | about 100 lines, 1 file | base develop

11. REVIEW LENSES
Lens A: data-steward. Lens B: principal-architect.

12. ORDER AND DEPENDENCIES
After: nothing (it must be on develop before #835 merges so v11 is checked). Before: L12 to L15. Blocked by: nothing.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:qa, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
none.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a shipped migration has no label (list it for privacy; never edit it).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #7 first; marker `<!-- journal run:sess-20261120-qa-t3 agent:qa -->`.
   Check-in: docs/agents/checkins/qa-t3.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: test/qa-ns-36-r10-phone-class-labels in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:qa -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
