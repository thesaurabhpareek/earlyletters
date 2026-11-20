BRIEF L14-L15-S3: Gated columns: drafts.author_signs_as (L14, NS-16) and withheld words (L15, S3, C8, NS-17)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 6 (capture) data half, Pack 9   Build: gated (wave 5)   Wave: 5   Size: L14 about 40 lines; L15 + S3 + C8 about 300 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: NS-16 (BL-980): counsel Q45, Q46, Q48, Q54 answered. NS-17: no backlog row exists (eval A R14; Product numbers it); Karma's constitution reading of S3 (OQ-K2: nothing is rewritten, the words as heard stay on the phone) and AX-5 (a flagged take is not pushed until it has typed words); the founder and a native reviewer. L14 can be written when BL-980 unblocks; L15 and S3 only after the reading.

1. GOAL: When a parent marks a take as another language or signs a letter as someone else, then the phone keeps the words as heard, the server never holds withheld words, and the From name travels once with the first insert and is never rewritten.

2. CARD ROWS and TEST TITLES
   Rows: NS-16-R6, R16 (L14); NS-17-R7, R8 (L15, S3, C8).
   Tests (exact; PR #927 catalogue D):
     [NS-17-R8] withheld words never on the server         CI: a pushed held draft has no words after the next push; mutant: push final_text
     [NS-17-R7] withheld words stay withheld               phone; mutant: index the withheld text
     [NS-16-R16] name purged with the account              CI; mutant: leave the name column
     [NS-16-R6] over thirty refused before upload          phone; the database counts code points (30), the app counts graphemes (eval A s1.5)
   S3 cells: held_drafts_stamp lets raw_transcript go to null only with words_withheld set in the same update (else SCIMM); held_upsert ignores words on a withheld row (a stale phone cannot re-upload them).
   Red on develop: held_drafts does not allow nulling the words (20261016000000:506-507, :722 [U: re-open]).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_held_words_withheld.sql (new), supabase/tests/held_words_withheld.test.mjs (new), classification.test.mjs:24, packages/api/src/server/sync.ts (HeldDraftData, HELD_DRAFT_DATA_KEYS :308), apps/mobile migrations.ts L14 and L15 (drafts.author_signs_as; drafts.words_withheld, entries.words_withheld, table withheld_words), docs/agents/checkins/data-architect-l14-l15.md
   Never:  entries.author_signs_as (exists, insert-only, 30 code points: do not touch), the transcription pipeline (verifyEdits), applied migrations, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: held_upsert and held_drafts_stamp are restated here only; the sync functions go through H1.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 6 and 9; data-and-sync.md sections 2.1 (L14, L15), 2.3 (S3), 5 (NS-16, NS-17), 10 (CP3); eval A s1.4 S3 and R6; docs/engineering/09-ai-assisted-engineering.md for the constitution.
   Stale-fact check: re-open every file:line you cite.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20261016000000_sync_v1_server.sql:497-525 held_drafts_stamp; :680-750 held_upsert; :550-566 a discard writes purge_ledger and a marker other phones read as a let-go (why S3 does not discard)
   supabase/migrations/20261002020000_data_governance.sql:95   entries.author_signs_as (insert-only, 30 code points)
   packages/api/src/server/sync.ts:157, :308   INSERT_ONLY_COLUMNS, HELD_DRAFT_DATA_KEYS
   apps/mobile/src/lib/db/migrations.ts:393-430   newest phone version v10 (v11 is #835)

6. DATA AND SECURITY
   Data classes: drafts.author_signs_as L3 (a name a parent typed), words_withheld L4, withheld_words table L4 (separate table so no reader selects it by accident). Constitution: the machine removes nothing from the parent's words and never rewrites; S3 only stops the server holding words the phone keeps. A pushed take carries no words once flagged.
   Boundary: held draft sync. Owner of the read: security-architect; Karma on the reading (OQ-K2).

7. LIBRARIES ALLOWED
none.

8. BUDGETS
No new index. Held upsert cost unchanged within the push budget (sync_perf.test.mjs:38). Not measured.

9. ACCEPTANCE
   Experience: area A Review language states and From name; re-open docs/e2e-ux-20nov. Test cases: PR #927 catalogue D NS-16, NS-17. Security: PR #915 no content in logs.
   Done also means: each test red on old code and its mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (L14): drafts.author_signs_as, label comment, T3 green | about 40 lines | after BL-980 unblocks
   PR 2 (S3 + C8): migration, tests, HELD_DRAFT_DATA_KEYS | about 300 lines, 5 files | after Karma's reading
   PR 3 (L15): phone columns and withheld_words | about 120 lines

11. REVIEW LENSES
Lens A: red-team (D-041). Lens B: ai-eng-lead (constitution) and security-architect.

12. ORDER AND DEPENDENCIES
After: T1, T3, H1; BL-980 for L14. Before: NS-17 phone work. Blocked by: counsel, Karma, founder, a native reviewer.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
NS-17-R5: a take in another language marks in one tap, words leave view, audio stays (J-N23).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - S3 would let the server change words (it must only drop its copy); - the held discard route is proposed for clearing words (withdrawn: it signals a let-go).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-l14-l15-s3 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-l14-l15-s3.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-ns-17-s3-words-withheld in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
