BRIEF BL-959: ADR 0028 amendment (seal pull clause, export minors, revoke-only view) and the keeping server tests (T2, NS-10-R4a, R10)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 9 (data and sync)   Build: n/a (docs and tests)   Wave: 1   Size: S: 3 PRs of about 120, 80 and 120 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: nothing for PR 1 and PR 2. PR 3's `[NS-10-R10]` cell needs the lapsed-plan fixture name (re-open supabase/tests/subscription_status.test.mjs). Karma's ruling AX-2 and AX-3 (CR-67, develop RULINGS.md lines 653-654) is the authority for PR 1; no founder word needed.

1. GOAL: When this lands, then ADR 0028 records the seal publication rule as option (b) with the transaction now() watermark, the next-free-minor export rule and the revoke-only view replace; and the server tests prove a held let-go purges its words, deletion works with Terms outstanding, and a lapsed plan still pulls.

2. CARD ROWS and TEST TITLES
   Rows: NS-36-R4 (done for ids, #865), NS-06-B8b (design only), NS-09-R14, NS-10-R4a (server half), NS-10-R10.
   Tests (exact; PR #925 catalogue A):
     [NS-09-R14] a let-go held draft is purged on the server     supabase/tests/sync_v1_server.test.mjs; mutant: keep the row and only blank its text. The two named exceptions (words changed after the base, legal hold) get their own cells titled with R14 once Karma rules K2 (08-keeping OQ-7, default as built).
     [NS-10-R4a] deletion works without agreeing                 server cell: request_account_deletion succeeds for a caller with a stale or no terms acceptance (PRIV-R09); mutant: require acceptance first
     [NS-10-R10] a lapsed plan still brings the book             lapsed-plan caller pulls 5 Asha letters; mutant: gate sync_pull rows on plan state
   Red on develop: the R14 purge is covered (held.discard cells at sync_v1_server.test.mjs:336-391) but under no NS title, so the trace skips it; R4a and R10 have no server cell.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  docs/adr/0028-photo-seal-find-on-device-data.md (amendment section only; no decision text rewritten), supabase/tests/sync_v1_server.test.mjs, supabase/tests/access_matrix.test.mjs or a new supabase/tests/keeping_server.test.mjs, docs/agents/checkins/data-architect-bl-959.md
   Never:  supabase/migrations/** (no migration here), docs/legal/**, the app, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: sync_v1_server.test.mjs is also edited by `sync` (T1 neighbours) and BL-870; add cells at the end of a section.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 9; data-and-sync.md sections 2.3 (S4, CK10), 3.2, 5, 10 (CK3, CK10); docs/agents/cto/RULINGS.md CR-67 AX-2, AX-3, AX-14 (lines 653-665); ADR 0028 D2, D3, D3a (line 100-101).
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   docs/adr/0028-photo-seal-find-on-device-data.md:100-101   seal columns and the book_entries visibility rule (to amend)
   supabase/migrations/20261016000000_sync_v1_server.sql:771-788   held_discard: keeps the row on a later edit or a legal hold
   supabase/migrations/20261016000000_sync_v1_server.sql:1306      sync_pull checks require_user() only (G1)
   supabase/migrations/20261015030000_v1_wire_contract_columns.sql book_entries view and entries_family_rules (:145); latest definitions, search before citing (E29)
   supabase/tests/sync_v1_server.test.mjs:336-391                  held.discard cells to retitle and extend
   supabase/tests/access_matrix.test.mjs:272                       request_account_deletion cell

6. DATA AND SECURITY
   Data classes: none new; test data is Asha. No production data read. The amendment adds no column; it records the rule that a revoke-only block follows any view replace (grants are gone since 20261023060000).
   Boundary: sync and seal. Owner of the read: security-architect.

7. LIBRARIES ALLOWED
none.

8. BUDGETS
Tests run inside the PGlite suite; no new timing budget. perf stays at sync_perf.test.mjs:38.

9. ACCEPTANCE
   Experience: none. Test cases: PR #925 catalogue A NS-09-R14, NS-10-R4a, R10, R11. Security: PR #914 section 3.3 (G1) is a neighbour, not this PR.
   Done also means: each new cell red on a schema that has the mutant; the amendment names CK10 (now(), not statement_timestamp()) and SCSEL (AX-14).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: ADR 0028 amendment | about 120 lines, 1 file | base develop
   PR 2: [NS-09-R14] retitle and extend | about 80 lines, 1 file | base develop
   PR 3: [NS-10-R4a] and [NS-10-R10] server cells | about 120 lines, 2 files | base develop

11. REVIEW LENSES
Lens A: data-steward. Lens B: security-architect (PR 1, PR 3), compliance-engineer (PR 2).

12. ORDER AND DEPENDENCIES
After: #797 and #865 (merged). Before: BL-969 (seal build), BL-979. Blocked by: nothing.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
none (database tests). Production runs held sync only if app.held_sync is on (U3, OQ-11 for `sync`): say the R14 proof is the stand-in until `sync` answers.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - K2's exceptions need a ruling before their cells are written; - a cell would read a hosted project.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-959 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-959.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: docs/adr-0028-amend-seal-pull-clause in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
