## Review B at ae358257e123c8bba6ce24ecfaa1b33733a5ba0f: PASS WITH NOTES
<!-- agent:data-steward -->
Must fix: none.

Lens B: data lifecycle, migrations, RLS and grants, sync, export, deletion. Checked against `develop` 20553b18, chapters 03 (DB-R) and 04 (DQ-R), `supabase/tests/grants.mjs` and `.github/migrations-applied.txt`. File: `docs/tdd/new-scope/data-and-sync.md` (230 lines). CI at this head: every check completed green (compliance-fence has one cancelled duplicate and one success). Head is from 05:48 UTC, well over 10 minutes old.

### What I checked
- Facts: 34 cites sampled; 34 hold, one with a caveat.
  - `BACKLOG.md:3414` (BL-870 "No migration here"; the same text on the lock branch).
  - `sync_push` 931-1284 (354 lines) and `sync_pull` 1302-1659 (358 lines).
  - `20261023060000:50, 99`; `grants.mjs:5-11` (no `book_entries` grant).
  - `20261015030000:174-184` (no `language` or `words_reviewed_at` in the tuple; `in_book` at `:184`) and `:251-253` (line 253 re-grants `select`).
  - `sync_v1_server.sql:307-308, 506-507, 550-566, 722, 1031-1033, 1091-1135` (no `photo_path`), `1481-1496, 1635`.
  - `scribe_core.sql:125, 294-300`; `20261028000000:88-101`; `data_governance.sql:95`; `20261002010000:4, 11`.
  - `sync.ts:94, 102, 157, 160, 263, 308, 554, 618, 666`; `types.ts:51`; `outbox.ts:161`; valibot 1.5.0 `object` at `index.mjs:5655`.
  - `export/schema.ts:7-10`; `sync_perf.test.mjs:38`; `classification.test.mjs:50-51`; #836 `photos-device.test.ts:179-188` (also true at 3395e5a6); #835 `migrations.ts:460-461`.
  - DEPLOY.md:36, 38, 52-56; APPLY.md:11, 82-88; `free-tier-ops.md:3`; DATA_CLASSIFICATION 4.5 "version 4"; data-policy 1.2.0.
  - 31 files on develop, 2 in `migrations-applied.txt`; #424 `20261031000000` and #677 `20261109010000` are the only open PRs adding newer-numbered files.
  - Runs 42973935354 and 42976572128 failed at "Dry run"; 42983835990 still waits. Caveat: run 44642662637 passed "Rebuild from every migration" on a PR branch (feat/mobile-photo-1-picker-pin), not on develop.
- Migrations against chapter 03:
  - New files after the newest on develop and in open PRs: stricter than DB-R08. The CK5 rename of #424 is right.
  - No `begin`/`commit` (DB-R10); CK6 records file 3 truthfully.
  - Revoke-only view replace (DB-R13); CK3 catches the cards' re-grant at `:253`.
  - Definer `search_path` on S5 (DB-R15). Purged ids stay refused (`entries_not_purged`; nothing here bypasses it). No cross-author cascade added (DB-R20).
  - Founder-only apply (DB-R09, D-041). Never edit an applied file: S1 to S5 and H1 are all new files.
- Chapter 04: L-levels on every new column, phone side included (DQ-R01, T3). Inventory rows in the same PR (BL-960, NS-36-R6). Deletion per field via eval A s4, which I read; it covers Recently deleted, purge, Erase everything, sign-out and server account deletion. Export minors by merge order.
- Boundaries: section 6 lists founder steps and no agent action. No production write; the counts are read-only. Defaults for counsel questions follow the cards. S1 keeps pictures on the phone. S3 and L15 wait on a constitution reading.
- Cards: every departure I found has a Conflict line (CP1 to CP7, CK1 to CK10).
- Buildability, waves 1 and 2: 3.6 gives owner, lenses, size and order per PR. Every P0 row in 3.1 has a named test: S1 cells, T1, T3, C1, J-N9, BL-933 goldens. The gaps are notes 1 and 2.
- Format: ASCII only, 230 lines, TDD 01 tags used, no copied card text.

### Findings (most serious first; all notes)
1. S1 breaks more tests than 3.6 row 6 lists. Dropping the insert and update policies and adding `entries_15_photo_closed` breaks these client-role photo writes, beyond the two setups named (`access_matrix.test.mjs:56, 395`; `data_governance.test.mjs:114, 121`):
   - `access_matrix.test.mjs:55` (update `photo_path`) and `:320` (the `photo_entry_is_purged` cell);
   - `data_governance.test.mjs:42-46, 113, 120`;
   - `rls.test.mjs:84-90`;
   - `pg_temp_search_path.test.mjs:81-136` (it uploads and renames as the author, and `:136` asserts two policies carry `photo_entry_is_purged`);
   - `db_followup_family_cap.test.mjs:186-191`.

   Two path-rule checks (`data_governance.test.mjs:42-43`) would pass for the wrong reason (`SCPHO`). Rewrite them as system-role setup or as deny cells, never just delete them (DB-R12). The "about 280 lines, 5 files" size is likely low.
2. S1 leaves an orphan grant. `public.photo_entry_is_purged(text)` is granted to `authenticated` (`20261028000000:85`), and its only callers are the two policies S1 drops (`:95, 106`). Eval A's "no grant, no `grants.mjs` change" is then wrong. S1 should drop the function, or revoke it from `authenticated`, in the same file, and update the access-matrix cell. That follows the `grants.mjs` header rule: a grant exists only where a code path uses it. I will hold the S1 review on this.
3. The deleted-row guard needs the new columns. `entries_guard_immutable` refuses a client edit of a deleted letter only for `final_text`, `in_book`, `machine_edits` and `photo_path` (`sync_v1_server.sql:213-219`). As designed, S2 and S4 let a client change `first_mark`, `first_label` or a seal on a letter in Recently deleted. Rec: S2 and S4 extend that list (SCTMB, DB-R18), each with a deny cell. H1's `entry_groups_apply` must run after the guard sees the row.
4. H1 details:
   - `public.entries_extra_content(new, old)` is a new function in `public`. Put it in `sync_private`, or revoke it from `public, anon, authenticated` (DB-R14, internal function).
   - The `pg_get_functiondef` comparison for `entries_family_rules` must use `20261015030000` as its base, not `20261016000000`.
5. CR-67 overrides (CR-67 wins until this file's next touch):
   - AX-6: L12 and L13 clear the book cursors, so section 1's byte-identical upgrade test and the L12 and L13 "none" deltas need that exception.
   - AX-5: the S3 reading is the founder's, not Karma's (OQ-K2). Say that L15's local move of `raw_transcript` into `withheld_words` waits on the same reading.
   - AX-4: C6 (`killSwitches.reminders`) is listed as a wave-2 contract change. The card's default is "not added" (`09-capture.md:273` at 450bcb4a). Mark C6 as not planned unless that question is answered yes.
6. Section 0 item 1 says only S1 changes the server in waves 1 to 3. H1 is wave 3 (2.3 table and section 4) and restates three server functions.
7. Row L11 says "ids L3". The card puts `entry_media.id` at L2 (`01-photo-with-a-letter.md:255`), and eval A s1.2 agrees. Write "letter and draft ids L3, media id L2", or T3 or a local classification test will fail a correct level (as #865 notes).
8. S5 adds two `authenticated` RPCs, and CLAUDE.md wants every new function's grant in `grants.mjs`. Make `qa`'s `AUTHENTICATED_FUNCTIONS` (eval A R9) a stated dependency of S5, not a parallel hand-off.
9. "NS-06-A10" and "B10" (CP2, CK3) cite card sections in row-id form. NS-06-A10 is the analytics row. Write "NS-06 section A10".

### Not verified
- Postgres `now()` against `statement_timestamp()` under PostgREST (CK10 is an Assumption; the rule "read the same clock as the clause" is safe either way).
- That `create or replace view` keeps privileges.
- SQLite CHECK on `ADD COLUMN`.
- Which project each deploy secret names.
- The `next-id.mjs` value 33: the script timed out here. APPLY.md row 32 is the newest on develop, so 33 is plausible.
- I ran no test and touched no database.

Reviewer: independent of the author (CR-44).
