BRIEF BL-968-data: Firsts, data side: phone L12, server S2, sync group `first`, export 1.8.0 (NS-06-A2a, A8, A13, A16, A17, A19, A23, A25)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 7 (reading, family and share) data half, Pack 9   Build: 15 earliest (wave 4)   Wave: 4   Size: S2 migration about 300 lines SQL plus tests; L12 about 40 lines; contract about 60 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: BL-939 and BL-981 (BL-968's row status), H1 or a founder size exception (OQ-K1, OQ-F5), the `first_label` ceiling 320 vs the card's 200 (OQ-P5, product, default 320), and `approve-migration`. Mobile builds the lens and the toggle (BL-968, owner mobile with `sync`); this brief is the schema, the SQL tests and the contract. Wave placement is the plan's [E].

1. GOAL: When a parent marks a letter as a first with a label, then both the server and the phone keep the pair as the parent typed it, the author's other phones receive it, the other parent sees it only through book_entries on a non-private letter, and nothing is refused except by the length and quiet-day rules.

2. CARD ROWS and TEST TITLES
   Rows: NS-06-A2a, A8, A13, A15, A16, A17, A19, A23, A25; NS-36-R10, R11 (card 06 at 450bcb4a; BL-968 row line 3842).
   Tests (exact titles; PR #927 catalogue D and the card):
     [NS-06-A13] only the author marks             supabase: RLS refuses a first write from a non-author; mutant: relax the author-only update policy
     [NS-06-A17] a private letter's mark never reaches the other parent (SQL test)   mutant: add the column to a broader view
     [NS-06-A8] mark and label travel with the letter; [NS-06-A16] marks reach the author's second phone (held drafts too); [NS-06-A19] a retried mark applies once; [NS-06-A23] the 40 counts graphemes in every script (phone; the database counts code points, ceiling 320)
     [NS-36-R11] trigger tuple and view (T1 must stay green with the two new columns); [NS-36-R10] level in the migration (T3)
   Runtime cell (not a source check): [NS-06-A-consent] a write of first_label by a caller without content consent is refused by the entries content trigger, and the same write with consent passes (BL-968 'fails on old code'); mutant: omit the columns from the tuple.
   Mutants for the phone and sync rows: A8 drop first_label from the sync group (the other phone gets the mark but no label); A16 omit the two columns from the held-draft builder (second phone gets no mark); A19 send the mark as an increment or without the idempotency base (a retry applies twice); A23 count code points instead of graphemes (a 40-grapheme label with combined characters is refused).
   Red on develop: no such column; a non-consented write of first_label has nothing to refuse.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_entries_firsts.sql (new), supabase/tests/firsts.test.mjs (new), supabase/tests/classification.test.mjs:24 (first_label joins mustBeL4), packages/api/src/server/sync.ts (group `first` in FIELD_GROUPS :94, FIELD_GROUP_COLUMNS :98, EntryData, ENTRY_DATA_KEYS :263, PulledRowSchema, PulledHeldSchema), apps/mobile/src/lib/db/migrations.ts (L12, next free number at merge), lib/sync/types.ts ALL_GROUPS and lib/sync/outbox.ts entrySnapshot (contract side, with `sync`), lib/export/schema.ts (E2: next free minor), supabase/APPLY.md, docs/agents/checkins/data-architect-bl-968-data.md
   Never:  the Firsts lens and toggle (mobile), docs/legal/** (BL-960 owns rows; this PR lists them for privacy), applied migrations, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: sync_push, sync_pull and entries_family_rules are H1's; build on H1 or take a size exception per restatement (eval A s5).

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 7 and Pack 9; data-and-sync.md sections 2.1 (L12), 2.3 (S2), 2.4 (C3), 5 (NS-06 A); eval A s1.4 S2 and s2.2 (branch docs/eng-eval-20nov, 6c011919: `git show origin/docs/eng-eval-20nov:docs/engineering/eval-20nov/A-data-and-sync.md`); BACKLOG BL-968.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20261015030000_v1_wire_contract_columns.sql:145-225   latest entries_family_rules (both tuples gain first_mark, first_label); book_entries view in the same file (a replace may only append columns; restate the revoke only)
   supabase/migrations/20261016000000_sync_v1_server.sql:680-750  held_upsert (writes the two columns from the op, outside the words version); :1635 to_jsonb(h) carries them to other phones; :1481-1496 own-row builder
   packages/api/src/server/sync.ts:94, :98, :263        field groups and key lists
   apps/mobile/src/lib/db/migrations.ts:393-430         v10 is newest on develop; v11 is #835; L12 takes the next number at merge
   apps/mobile/src/lib/export/schema.ts:90              EXPORT_SCHEMA_VERSION '1.6.0' today

6. DATA AND SECURITY
   Data classes: first_mark L3, first_label L4 (free text a parent typed); on entries and held_drafts; a first_label never reaches analytics, logs or Find without its own row. No index until NS-06-A24 misses its 500 ms (DB-R22). No new function, so no grant line.
   Deletion per field: tombstone with the letter, back on restore, purged with the row, a held row by held.discard, removed on Erase everything, kept on sign-out, tombstoned at the account-deletion request (eval A s4).
   Boundary: sync read and consent gate (F12). Owner of the read: security-architect; red-team (D-041).

7. LIBRARIES ALLOWED
none.

8. BUDGETS
Index none. The pull adds two keys to a row: stays inside the pull budget (sync_perf.test.mjs:38; Q-05 in PR #928). NS-06-A24 lens opens in 500 ms with 200 firsts (device row). Not measured.

9. ACCEPTANCE
   Experience: area B Firsts lens states (docs/e2e-ux-20nov, 9e78eecd; re-open). Test cases: PR #927 catalogue D NS-06-A. Security: PR #914 data; PR #915 abuse cases on a first_label (no content in logs, canary NR-32).
   Done also means: each SQL cell red on the old schema and on its mutant; the export golden gains a first (1.8.0 or the next minor).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (server, S2): migration + firsts.test.mjs + classification line + APPLY | about 300 lines, 5 files | base develop (after H1) | flag EXPO_PUBLIC_FIRSTS off; server before flag
   PR 2 (contract + L12): sync.ts group, phone migration L12, merge rules | about 200 lines, 6 files | after PR 1
   PR 3 (E2): export minor with firsts in the golden | about 120 lines | after BL-933

11. REVIEW LENSES
Lens A: red-team (D-041); data-steward. Lens B: security-architect.

12. ORDER AND DEPENDENCIES
After: H1, T1, BL-933, BL-939, BL-981, BL-954 (undo). Before: BL-968 lens, BL-969. Blocked by: the items in 'Blocked until'.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
Two phones: mark on A, A's second phone shows it; the other parent sees it on a shared letter and not on a private one.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - first_label ceiling is still 200 on the card (OQ-P5); - a held draft must not carry the mark (eval A R8 is about NS-16, not here: re-check).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-968-data agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-968-data.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-bl-968-s2-firsts-columns in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
