BRIEF NS-47: Days store outside scribe.db: the data rules, the inventory rows and the migration lint (NS-47, NR-141, NR-160 to NR-162)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 4 (reminders, days) data half, Pack 8   Build: gated (wave 3 once locked)   Wave: 3   Size: S to M: an ADR (docs) about 150 lines, one lint test about 100 lines, inventory rows for `privacy`
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: NS-47 is UNLOCKED (card 21, branch docs/locked-pack-inputs-20nov, tip 40c6eb4a at read; the pack lists it as 'NO DESIGN YET, ADR B'). Do not build until the card locks, the card-internal conflict R6 vs R7 is ruled (a restored phone asks again vs culture.asked surviving sign-out; to Product) and Product answers Q-E5 (one store or two for BL-982's typed days: our 09-capture design keeps typed days in `settings`, NS-47 keeps ticked days outside scribe.db and out of backup). Counsel: CUL-Q5, Q6, Q7, Q11.

1. GOAL: When NS-47 locks, then ticked days, the asked flag and any tradition or country value live in one versioned file in Application Support, excluded from backup and read back, never in scribe.db, a server table, an export or a log, and a lint fails any migration, view, RPC argument or setting key named like tradition, religion, faith, country, origin or culture.

2. CARD ROWS and TEST TITLES
   Rows: NS-47-R1, R4, R6, R7, R10, R11, R15, R16, R17, R28 (card 21 lines 483-510 on the inputs branch).
   Tests (exact titles from the card): [NS-47-R1] the whole store is L4 and registered; [NS-47-R4] no request carries a day key (includes the migration lint, which is mine); [NS-47-R6] the store is out of the backup and fails closed; [NS-47-R7] claim and new phone move nothing; [NS-47-R10] the export holds none of it; [NS-47-R11] one reader; [NS-47-R15] sign-out clears and B sees nothing; [NS-47-R16] erase scan finds nothing; [NS-47-R17] delete account line and clear; [NS-47-R28] the store file is protected, versioned and fails closed.
   Mine to write: the NR-162 lint as supabase/tests/no-tradition-names.test.mjs (mutant: add a column named `tradition` in a scratch migration); the ADR; the registry and erase-scan rows. Mobile writes the store and the other tests.
   Red on develop: no store, no lint (checked: no such file).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  docs/adr/<next-id from next-id.mjs>-days-store.md (new ADR; ids from `node scripts/agents/next-id.mjs`, ADR 0029 on 20 Nov), supabase/tests/no-tradition-names.test.mjs (new), the rows for docs/legal/DATA_CLASSIFICATION.md 4.6 are PROPOSED in the PR body for `privacy` (the founder merges docs/legal), docs/agents/checkins/data-architect-ns-47.md
   Never:  docs/legal/** directly, the store code (mobile), scribe.db migrations (the store is not a table), the planner (BL-966 lane), charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: erase list in data-and-sync.md section 2.5 and the Erase scan (apps/mobile/test/erase-all.test.ts) gain one store each: mobile edits those.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 4; PR #931/#932 pack delta (PACK-DELTA-2, NS-47 table; PACK-DELTA-5 constraints); card 21 NS-47 on branch docs/locked-pack-inputs-20nov; PR #915 abuse cases AB-03, AB-07, AB-23, AB-42, FL-02, FL-04; PR #914 section 5 (the six controls every new store must meet) and its registry rows (lines 31-34).
   Stale-fact check: re-open every file:line you cite.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/test/erase-all.test.ts                      the Erase scan to extend (one store per row)
   apps/mobile/src/lib/export/schema.ts:271                export reads phone settings for its consent block (R10: no day key may leak into it) [U: re-open]
   apps/mobile/src/lib/db/migrations.ts:63                 settings table: where typed days would live today (09-capture.md:165)
   supabase/tests/classification.test.mjs:3-25             the lint's neighbour
   docs/legal/DATA_CLASSIFICATION.md section 4.6           where the L4 row goes (the card says docs/privacy/, which does not exist: E-9)

6. DATA AND SECURITY
   Data classes: the whole store L4 (a ticked Mother's Day beside a faith day is L4: the highest class wins). Phone only: no server column, no sync field, no export key, no backup, no analytics, no log, no notification title that names a day (neutral strings only). A finder with an unlocked phone can read it: the Days page says so in one line (AB-14).
   Boundary: new L4 store. Owner of the read: security-architect and privacy; counsel on the ask.

7. LIBRARIES ALLOWED
none. File and Application Support exclusion use installed expo-file-system; any new library goes through PR #920's adoption rules.

8. BUDGETS
Atomic write (temp file then rename); a read on launch must not delay first frame (L-03, PR #928). Not measured.

9. ACCEPTANCE
   Experience: areas D and E Days page and ask (docs/e2e-ux-20nov; re-open). Test cases: PR #915 FL-02 (kill during write), FL-04 (kill during Erase). Security: PR #914.
   Done also means: the lint is red on its mutant; the ADR names every erase, sign-out and delete hook.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: ADR (design only) | about 150 lines, 1 file | base develop
   PR 2: the lint test | about 100 lines, 1 file
   Mobile's PRs (store, one reader, hooks) follow the ADR and are a separate brief once the card locks.

11. REVIEW LENSES
Lens A: security-architect. Lens B: privacy (registry) and principal-architect.

12. ORDER AND DEPENDENCIES
After: the card locks; Q-E5; R6 vs R7 ruled. Before: the planner `libraryDay` kind (NS-46) and every NS-47 build row. Blocked by: product, counsel.

13. DEFINITION OF DONE
   [ ] every claim in the doc is tagged [V] (file:line or sha), [E] (basis) or [U]; at least 10 cites re-opened and the count stated in the PR body
   [ ] ASCII only; no real family detail; no word a parent reads is final (PROPOSED only)
   [ ] PR body per HARNESS-RUN.md; labels agent:data-architect, from:agent (+ needs:founder when only the founder can merge)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
AB-07 restore on a new phone finds no store; AB-23 lost phone: nothing on the server; kill during Erase resumes (device).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - two stores for one Days page would result (Q-E5 unanswered); - the card still says docs/privacy/.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-ns-47 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-ns-47.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: docs/adr-days-store-outside-scribe-db in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
