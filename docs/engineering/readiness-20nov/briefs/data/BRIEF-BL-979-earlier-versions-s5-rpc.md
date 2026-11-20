BRIEF BL-979: Earlier versions of my own words, data side: S5, the read RPC, remove, restore as an ordinary edit (NS-12-R1 to R8)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 5 (keeping) data half, Pack 9   Build: gated (no wave)   Wave: 5   Size: L: S5 migration about 300 lines; contract about 150 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: counsel Q51, Q32, Q48 answered through the BL-949 packet the founder sends (#872 open, needs:founder); Karma's reading of D8 (OQ-K2); AX-10 (the founder decides whether the author's export carries versions; until then not exported); AX-4; NS-21 built. The legal-hold rule (OQ-DS4) and the in_book toggle rule (OQ-DS3) have defaults; Product confirms. Plan row BL-979 is `data-architect` owner, `mobile` builds the phone part.

1. GOAL: When an author opens one of their letters, then they can see their earlier versions through a read function that returns nothing for anyone else, restore one as an ordinary edit that adds a version and never re-runs the engine, and remove one so it is gone from the server.

2. CARD ROWS and TEST TITLES
   Rows: NS-12-R1 to R8; D8 (card 08 lines 828-835).
   Tests (exact; PR #927 catalogue D, lane data-architect): [NS-12-R2] restore adds a version (mutant: overwrite the old version); [NS-12-R3] restore never re-runs the engine (raw_transcript unchanged, engine port spy never called; mutant: re-run the pipeline); [NS-12-R6] removing a version deletes it (CI; mutant: soft hide only); [NS-12-R8] never another author's versions (mutant: fetch then hide). Also [NS-12-R1], [NS-12-R7] by card title.
   Cells: entry_versions_list and entry_version_remove: allow for the author of a live letter, deny for the other parent, a former member, anon; refuse under a legal hold; second remove returns { missing: true }.
   Red on develop: no reader exists and authenticated has no grant on entry_versions (20261023060000_explicit_grants.sql:49-51).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_entry_versions_read.sql (entry_versions gains edit_level, author_edits, locked_spans; replace entries_record_version(); two definer RPCs with grants in the same file), supabase/tests/entry_versions_read.test.mjs (new), supabase/tests/grants.mjs (see below), packages/api/src/server/sync.ts (C7 types, endpoint class read_rpc) with `sync`, docs/agents/checkins/data-architect-bl-979.md
   Never:  raw_transcript (immutable by trigger; no cascade across authors), the engine and verifyEdits, applied migrations, export code (no version export until AX-10), charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: grants.mjs has no list for functions granted to `authenticated` (eval A R9); `qa` adds AUTHENTICATED_FUNCTIONS first, otherwise the access matrix carries the allow and deny cells and the PR says so.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 5; data-and-sync.md sections 2.3 (S5), 5 (NS-12), 10 (CP5); 08-keeping.md section 6 and OQ-DS1 to DS5 (develop); eval A s1.4 S5.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20260930000000_scribe_core.sql:155-162   entry_versions and its index; :221 trigger; :271 author select policy; :232 RLS on
   supabase/migrations/20261002020000_data_governance.sql:172-186   machine_edits, superseded_by; entries_record_version() (fires on in_book-only changes too)
   supabase/migrations/20261023060000_explicit_grants.sql:49-51   no authenticated grant on the table
   supabase/migrations/20261016000000_sync_v1_server.sql:1878-1881   public.is_held used for the legal-hold refusal [U: re-open]
   packages/api/src/server/sync.ts:99, :107   the words group and compare-and-set (restore sends entry.upsert changed ['text'])

6. DATA AND SECURITY
   Data classes: edit_level L2, author_edits L4, locked_spans L4 (as on entries); versions hold the parent's own earlier words (L4); read only by the author, never in the pull, never exported (until AX-10), never in logs. entry_version_remove writes an ids-only audit row. Definer functions carry set search_path = pg_catalog, public, pg_temp and a comment saying why definer.
   Boundary: author-only read. Owner of the read: security-architect; red-team.

7. LIBRARIES ALLOWED
none.

8. BUDGETS
List reads at most 20 versions, keyset by (created_at, id), served by entry_versions_entry_idx (entry_id, created_at): index-only plan checked with EXPLAIN in the PR (DB-R21, DB-R22). Letter open must not wait on it (read on open, in memory only).

9. ACCEPTANCE
   Experience: area B letter page versions row and screen; words PROPOSED. Test cases: PR #927 catalogue D NS-12. Security: PR #914 and #915 on author-only reads.
   Done also means: each cell red on the old schema and its mutant; grants test green.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: S5 migration, RPCs, grants, tests | about 300 lines, 5 files | base develop
   PR 2: contract C7 types + drift test (with `sync`) | about 150 lines

11. REVIEW LENSES
Lens A: red-team (D-041); data-steward. Lens B: security-architect; compliance-engineer for the retention line.

12. ORDER AND DEPENDENCIES
After: counsel answers, NS-21 (BL-937), T1. Before: the phone part of BL-979. Blocked by: counsel and founder.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
Phone: open a letter with two versions, restore the older, see the replaced words listed; remove one; second phone no longer lists it.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - counsel asks for a retention limit (a purge job needs its own design); - removing a version under a legal hold (default: refused).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-979 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-979.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-bl-979-s5-entry-versions-read in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
