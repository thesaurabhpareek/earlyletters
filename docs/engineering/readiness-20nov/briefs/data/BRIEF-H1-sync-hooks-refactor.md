BRIEF H1: H1: restate sync_push, sync_pull and entries_family_rules once, with three no-op hooks      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 9 (data and sync), with `sync`   Build: n/a (server); before the first new field group   Wave: 3   Size: 3 PRs, each a function restatement (about 354, 358 and about 120 lines of SQL)
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: Karma's ruling on OQ-K1 (default H1) and the founder's size exception (OQ-F5, default one exception for H1; CODE-R02 caps a PR at 400 lines and the founder grants exceptions, an agent never does), plus `approve-migration` on each PR. No new row id yet: Product numbers H1 (plan 2.6). Without H1, each of Firsts S2 and the seal S4 restates about 700 lines of sync SQL under its own size exception (eval A s5).

1. GOAL: When H1 is merged, then sync_push, sync_pull and entries_family_rules() call three empty hooks, every existing sync test passes unchanged, and a function-body comparison against 20261016000000 shows only the hook lines differ.

2. CARD ROWS and TEST TITLES
   Rows: NS-36-R11 (F12), NS-06-A10, A11, B21 (the later users). H1 itself has no card row; its proof is the unchanged suite.
   Tests (new titles, PROPOSED; no card gives them):
     [H1] sync functions equal 20261016000000 apart from the hook lines   (pg_get_functiondef compared; mutant: change one clause outside the hooks)
     [H1] every sync_v1 cell passes unchanged                              (the existing suite, no edits; mutant: make a hook return a column)
   Hooks (data-and-sync 2.3): sync_private.entry_groups_apply(p_id, d, p_changed) security invoker, one guarded update that writes only when a value differs; sync_private.entry_own_extra(public.entries) appended to both own-row builders; public.entries_extra_content(new, old) OR-ed into the consent tuple.
   Red on develop: no hook exists; a column PR restates the whole function.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_sync_hooks_push.sql, _sync_hooks_pull.sql, _sync_hooks_family_rules.sql (three new files, one per PR), supabase/tests/sync_hooks.test.mjs (new), supabase/tests/grants.mjs (SERVICE_ROLE_FUNCTIONS only if a hook is callable; they should not be), supabase/APPLY.md, docs/agents/checkins/data-architect-h1.md
   Never:  any applied migration, packages/api (the contract is unchanged), the app, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: BL-870 (S1) adds a trigger on entries, not these functions; any other PR that restates sync_push or sync_pull is a conflict: ask Karma.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 9; data-and-sync.md sections 2.3 (H1), 4, 8 risk 3, 9 (OQ-K1, OQ-F5), 10 (CK9) (develop); ADR 0025 sync protocol; docs/engineering/03-database-and-schema.md.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20261016000000_sync_v1_server.sql:931   sync_push (354 lines to :1285); :1302 sync_pull (358 lines to :1660)
   supabase/migrations/20261016000000_sync_v1_server.sql:1031-1033   unknown group raises 22023 for good
   supabase/migrations/20261016000000_sync_v1_server.sql:1481-1496  own-row builder; :1498 book_entries read; :1635 to_jsonb(h) held row
   supabase/migrations/20261015030000_v1_wire_contract_columns.sql:145   latest entries_family_rules (search the latest, E29)
   supabase/tests/sync_v1_server.test.mjs, v1_wire_contract.test.mjs, sync_perf.test.mjs:38   suites that must stay green and fast

6. DATA AND SECURITY
   Data classes: none new (no column). Security invoker hooks run under the caller's RLS; a hook never widens a read. No content in logs.
   Boundary: sync read and write paths and the consent tuple. Owner of the read: security-architect; red-team (D-041).

7. LIBRARIES ALLOWED
none.

8. BUDGETS
No slower: push_50_inserts stays under 120 ms and the pull budget in sync_perf.test.mjs:38 and perf.test.mjs. Checked by: `npm run test:db` perf tests; hosted p95 not measured.

9. ACCEPTANCE
   Experience: none. Test cases: the existing sync suite (PR #925 catalogue A NS-36-R11 is T1's, BRIEF-T1). Security: PR #914 data section; PR #915 abuse cases on sync.
   Done also means: the comparison script is committed under supabase/tests and fails on the mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (H1a): sync_push restated with hooks | about 400 lines SQL + test | base develop | one founder size exception covers H1a to H1c
   PR 2 (H1b): sync_pull restated | about 400 lines | after PR 1
   PR 3 (H1c): entries_family_rules restated | about 150 lines | after PR 2
   Way back: the existing suite plus the function-body comparison; a bad hook is replaced by a later restatement.

11. REVIEW LENSES
Lens A: red-team (D-041). Lens B: principal-architect. `sync` points test/contract-drift.test.ts at the hooks.

12. ORDER AND DEPENDENCIES
After: BRIEF-T1 (T1 first so the guard exists). Before: BRIEF-BL-968-L12-S2, BRIEF-BL-969-L13-S4. Blocked by: OQ-K1, OQ-F5, approve-migration.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
none beyond CI; after the founder applies it to staging, one two-phone sync run (BL-929 row) shows letters still round-trip.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a restatement differs from 20261016000000 outside the hook lines; - the size exception is not granted: do not split a restatement across PRs.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-h1 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-h1.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-h1-sync-hooks-push in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
