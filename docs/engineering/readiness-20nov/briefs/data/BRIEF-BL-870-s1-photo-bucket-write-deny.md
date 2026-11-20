BRIEF BL-870: S1: the server refuses a picture (NS-01-R61, NS-36-R1d)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 9 (data and sync)   Build: 13 or 14 (reaches production with the first tag after F4); not a Build 13 cut holder   Wave: 2   Size: about 280 lines for the migration and new test, plus the rewrites of at least 9 cells in at least 7 files, so the PR may exceed 400 lines: split the cell rewrites into a first PR (PR 0, test-only, green on the old schema) (one migration, one new test, two setup changes, APPLY entry)
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: the founder's `approve-migration` label at merge and, for the apply, F4 (BRIEF-P-7). Product owes a new backlog row: BL-870 says 'no migration here' while NS-01-R61 needs one (data-and-sync CP6). BL-870's own rule lets this proceed: the test fails, so the finding is filed and the migration is its own task. Founder count: how many legacy rows hold a non-null entries.photo_path in production (expected zero, data-and-sync Q8); the agent cannot read production, so the founder checks it before the tag.

1. GOAL: When any role tries to write an object to the entry-photos bucket or to send a non-null photo_path on an entry, then the server refuses it, while reads and deletes of existing objects and an unchanged legacy path keep working.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R61, NS-36-R1d, NX-39-R54 (BL-870).
   Tests (exact; PR #926 catalogue B and PR #925 catalogue A):
     [NS-01-R61] the server refuses a picture (test:db)    supabase/tests/photo_bucket_closed.test.mjs; mutant: drop the bucket policy change
     [NS-36-R1d] no picture on the server                  entry-photos write denied for any role; 0 objects after a letter with a picture syncs; mutant: relax the bucket write policy
   Cells: author insert and update on storage.objects entry-photos refused for owner, parent, co-parent, former member, anon; select and delete still allowed; entries insert with photo_path set raises SCPHO; update that changes a null path to non-null raises SCPHO; update that leaves an existing path unchanged passes (CK8); trigger order asserted.
   Cells that go red when S1 lands (Review A on #940; the earlier list was short; re-run `grep -rn "entry-photos" supabase/tests` yourself, since an insert as an `authenticated` session goes red and a `sys` insert stays green): access_matrix.test.mjs:55 and :56, the matrix row at :233, :395; data_governance.test.mjs:44, :113, :114, :120, :121; rls.test.mjs:84 and :86; security_family.test.mjs:155-156; pg_temp_search_path.test.mjs:91; sync_v1_server.test.mjs:206; db_followup_family_cap.test.mjs:186 [U]. At least 9 cells in at least 7 files. So 'the other cells stay green' is NOT promised: each is rewritten to insert the object through `sys` (service) or to expect the refusal.
   Red on develop: entry_photos_author_insert and _update exist (20261003000000_security_and_family.sql:227 and :234, last restated 20261028000000_pg_temp_last_and_purged_photos.sql:88-101), so an author insert succeeds.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_photo_bucket_closed.sql (new), supabase/tests/photo_bucket_closed.test.mjs (new), supabase/tests/every supabase/tests file that inserts an entry-photos object as an authenticated author (the list in field 2; at least 7 files), supabase/APPLY.md (the next file number, 33 on 20 Nov), packages/api/src/envelope.ts:194 SQLSTATE_RULES (the rule for SCPHO) and the docs/engineering/02-api-and-contracts.md registry row (API-R09), docs/agents/checkins/data-architect-bl-870.md
   Never:  any file in .github/migrations-applied.txt, ops_set_child_photo_path (the child avatar is another path; leave it), grants.mjs unless a new function is added, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: the SQLSTATE drift test (packages/api/test/contract-drift.test.ts:93-95) fails if an SC code raised in SQL has no rule in SQLSTATE_RULES (envelope.ts:194): change both in this PR.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 9; data-and-sync.md sections 1, 2.3 (S1, CK8), 3.1 and 3.6 PR 6 (develop); docs/engineering/03-database-and-schema.md by rule id; supabase/APPLY.md; docs/adr/0028 D6.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20260930000000_scribe_core.sql:294-303        the four entry_photos policies (insert, update, delete, read)
   supabase/migrations/20261003000000_security_and_family.sql:227,234  insert and update policies restated
   supabase/migrations/20261028000000_pg_temp_last_and_purged_photos.sql:88-101   latest restatement; photo_entry_is_purged
   supabase/migrations/20261016000000_sync_v1_server.sql:1091-1135   sync_push insert and update lists never name photo_path [U: re-open; the design cites it]
   supabase/tests/access_matrix.test.mjs:56, :395; data_governance.test.mjs:114, :121   setups to change
   supabase/tests/sync_perf.test.mjs:38                              push_50_inserts 120 ms budget
   `grep -n "create trigger entries_" supabase/migrations/*.sql`   existing trigger names. Triggers of one timing fire in NAME order and a digit sorts before every letter (DB-R04), so entries_15_photo_closed fires FIRST of the before-triggers on entries. That is intended (refuse a picture before any other rule runs); say so in the migration comment and pin the order in a test, as DB-R04 requires.

6. DATA AND SECURITY
   Data classes: no new column; a new trigger function entries_photo_closed() (no data). Grants: a revoke only (revoke execute ... from public, anon, authenticated, service_role, DB-R14); there is no GRANT and so no grants.mjs line; explicit_grants.test.mjs must stay green. Server never holds a picture: the X2 promise made true on the server.
   Boundary: storage. Owner of the read: red-team and security-architect. A crafted client uploading to entry-photos is the threat; S1 is the control; photo_bucket_closed.test.mjs is the test.

7. LIBRARIES ALLOWED
none (SQL and PGlite harness already in the repo).

8. BUDGETS
One column compare per entries write, inside push_50_inserts 120 ms. Note sync_perf.test.mjs:38 is a wall-clock assertion, so it can flake: run it three times before and after on the same machine and report both. Hosted p95 not measured.

9. ACCEPTANCE
   Experience: none. Test cases: PR #926 catalogue B NS-01-R61; PR #925 catalogue A NS-36-R1d. Security: PR #914 photo bucket, PR #915 abuse cases on a crafted upload.
   Done also means: both tests red on the old schema and on the named mutant; the two setup changes keep the other cells green.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: migration + photo_bucket_closed.test.mjs + the two setup changes + SCPHO registry row + APPLY | about 280 lines, 5 to 7 files | base develop | no flag; reaches production before the photo flag is on outside the founder's family (server before flag)
   Way back: forward-fix only; a policy can be recreated in a later migration.

11. REVIEW LENSES
Lens A: red-team (D-041 review). Lens B: security-architect. The founder adds `approve-migration`; the agent never does.

12. ORDER AND DEPENDENCIES
After: nothing. Before: any build with EXPO_PUBLIC_PHOTOS on outside the founder's family. The founder applies it through CI on a tag (BRIEF-P-7 is the card); no agent applies it. Blocked by: the founder's label and the Q8 count.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
After the founder applies it to staging: one picture add on a phone proves the server still receives a letter whose photo_path is null (BL-929 row). CI proves the refusals.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the Q8 count is not zero; - the old photo_path on a legacy row would make a later update refuse; - a role other than owner needs the bucket.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-870 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-870.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-bl-870-s1-photo-write-deny in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
