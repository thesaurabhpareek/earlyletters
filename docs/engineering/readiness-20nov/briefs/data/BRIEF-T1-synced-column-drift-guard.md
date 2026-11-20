BRIEF T1: T1: a synced column must reach the consent tuple and the book view (NS-36-R11), plus the C1 contract tests      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: sync   Lane: Pack 9 (data and sync)   Build: n/a (test)   Wave: 1   Size: S: about 150 lines, 2 files
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: nothing. OQ-P3 (privacy: should `language` and `words_reviewed_at` pass the content-consent gate) only decides whether two exemptions stay; their default is yes, folded into the next restatement.

1. GOAL: When a column is added to the sync contract, then a test fails unless the latest entries_family_rules() tuple holds it and, unless author-only, the latest book_entries view lists it, except three named exemptions with a reason each.

2. CARD ROWS and TEST TITLES
   Rows: NS-36-R11, NS-01-R15, NS-01-R26 (C1).
   Tests (exact; PR #925 catalogue A and #926 catalogue B):
     [NS-36-R11] trigger tuple and view          packages/api/test/contract-drift.test.ts; mutant: add a column to FIELD_GROUP_COLUMNS only
     [NS-01-R15] sync carries no picture key     ENTRY_DATA_KEYS and the outbox payload never hold photo_path, photo_text, place or photo; mutant: add `photo_text` to ENTRY_DATA_KEYS
   Exemptions (named list, reason each): in_book (own clause, 20261015030000:184), language and words_reviewed_at (until OQ-P3).
   Positive control on the parser (required): feed the migration parser a synthetic migration text whose entries_family_rules tuple lacks a column and assert the check reports it; and one whose view lists it and assert it passes. Without this the parser could return an empty list and every column would pass.
   Red on develop: no test reads the tuple at all (eval A found no generic guard).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  packages/api/test/contract-drift.test.ts (new describe), packages/api/test/ (a helper that finds the LATEST definition by scanning supabase/migrations in sort order, never a line number: E29), apps/mobile/test/sync-no-picture-keys.test.ts (C1), docs/agents/checkins/sync-t1.md
   Never:  packages/api/src (no contract change here), supabase/**, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: contract-drift.test.ts is also edited by BL-870 (SCPHO) and later by seal and Firsts PRs; add a new describe block, do not reorder.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 9 (the SQLSTATE drift test pattern); data-and-sync.md section 2.4 (T1, C1) (develop); docs/engineering/02-api-and-contracts.md by rule id.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   packages/api/src/server/sync.ts:98, :136, :157, :160   FIELD_GROUP_COLUMNS, SHARED_GROUP_COLUMNS, INSERT_ONLY_COLUMNS, AUTHOR_ONLY_COLUMNS
   packages/api/src/server/sync.ts:263                    ENTRY_DATA_KEYS; :618 PulledRowSchema.photo_path stays nullish (do not narrow)
   packages/api/test/contract-drift.test.ts:85-97         existing drift test to imitate
   supabase/migrations/20261015030000_v1_wire_contract_columns.sql:145   latest entries_family_rules (search, do not trust the number)

6. DATA AND SECURITY
   Data classes: none (test only). It reads migration text and contract constants. Nothing stored, sent or logged.
   Boundary: sync contract; the failure it prevents is a column that bypasses the consent gate or never reaches the other parent (F12).

7. LIBRARIES ALLOWED
none (vitest, node:fs).

8. BUDGETS
Reads about 30 migration files once; under 1 s in `npm test -w packages/api`. Not measured.

9. ACCEPTANCE
   Experience: none. Test cases: PR #925 catalogue A NS-36-R11; PR #926 catalogue B NS-01-R15, R26. Security: PR #914 data section.
   Done also means: each test red on its named mutant (apply the mutant, see it fail, revert).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: T1 and C1 tests | about 150 lines, 2 files | base develop | no flag

11. REVIEW LENSES
Lens A: principal-architect. Lens B: data-steward.

12. ORDER AND DEPENDENCIES
After: nothing. Before: H1, Firsts (S2), seals (S4). Blocked by: nothing.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:sync, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
none.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a current column fails T1 (then name an exemption with its reason and ask privacy, never silence the test).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #13 first; marker `<!-- journal run:sess-20261120-sync-t1 agent:sync -->`.
   Check-in: docs/agents/checkins/sync-t1.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: test/sync-ns-36-r11-column-drift in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:sync -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
