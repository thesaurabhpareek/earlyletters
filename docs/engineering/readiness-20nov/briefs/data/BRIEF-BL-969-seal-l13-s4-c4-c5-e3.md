BRIEF BL-969: Sealed letters, data side: columns, guard trigger, book_entries clause, the pull clause, watermark, SCSEL, export (NS-06-B1 to B26)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 7 data half, Pack 9   Build: Q3 (wave 5; Build 16 or later) [E]   Wave: 5   Size: L: 4 PRs (about 300, 250, 200, 120 lines)
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: BL-968 (Firsts) and BL-959 (the ADR 0028 amendment of the pull clause, BRIEF-BL-959) merged; counsel's new 'open at 18' question and Q50 (founder with counsel; default ordinary dates only); the author's phones running the seal build before the flag is on (eval A R7); H1 or size exceptions; `approve-migration`. The two-phone proof of option (b) is `sync`'s (BL-969 done line).

1. GOAL: When a letter is sealed for a day, then no other member's pull or view returns it before that instant and every other member's phone receives it after, even when its cursor had already passed the row, on the transaction time the view reads.

2. CARD ROWS and TEST TITLES
   Rows: NS-06-B1 to B26 (card 06), ADR 0028 D3 and D3a, CR-67 AX-2 (pull clause) and AX-14 (SCSEL).
   Tests (exact; PR #927 catalogue D, all `data-architect` lane):
     [NS-06-B8] before the instant another member gets 0 rows; after it, a normal letter (SQL test)    mutant: return a placeholder row
     [NS-06-B8b] an opened seal reaches a phone whose cursor had passed it (two-phone sync test with injected time)   mutant: advance the cursor past hidden rows without a repull. Add the boundary case: a seal whose instant falls between now() and statement_timestamp() (CK10)
     [NS-06-B16] a reader's clock cannot open a seal; [NS-06-B20] book_entries hides sealed letters from other readers (SQL test); [NS-06-B21] sealing and Open now pass the content-consent gate (SQL test); [NS-06-B22] entries stays author-only to read (SQL test); [NS-06-B23] seal columns are classed L4; [NS-06-B10] a quiet day cannot be sealed; [NS-06-B18] a sealed letter is never published after its author asks to delete the account; [NS-06-B12], [NS-06-B17], [NS-06-B1], [NS-06-B2], [NS-06-B5], [NS-06-B6], [NS-06-B1b] as in the catalogue.
   CK10 is only an Assumption in the design (data-and-sync.md:226 says 'not re-read'), so it is proved here, not trusted: (1) text check: the pull clause and the watermark in the migration contain `now()` and no `statement_timestamp()`; mutant: put statement_timestamp() in the window. (2) boundary cell: in ONE transaction, run a prior statement so statement_timestamp() is later than now(); set seal_opens_at to the midpoint; assert the view and the pull agree (closed in both), then in the next transaction both open and the row is delivered exactly once.
   Clock injection: harness.mjs has no clock and tests do not sleep. Use the transaction clock: inside one transaction now() is fixed, so name the cells by seal_opens_at = now() - interval '1 second' (open), = now() (open, the clause is <=), = now() + interval '1 second' (closed); watermark values are passed explicitly in the request. [NS-06-B16] sets the caller's own clock claim only and shows it is ignored.
   Red on develop: no seal columns; ADR 0028 D3 is a proposal for these.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/migrations/<next-id>_entries_seal.sql (new; columns seal_opens_at timestamptz, seal_opens_on date, seal_cleared_at timestamptz, CHECK entries_seal_pair per ADR 0028 D3a, trigger entries_12_seal_guard + entries_seal_guard() revoked, tuple, book_entries clause, sync_pull clause, sync_books.seal_watermark, index entries_seal_open_idx), supabase/tests/seal_publish.test.mjs and seal_*.test.mjs (new), classification.test.mjs:24, packages/api/src/envelope.ts:194 SQLSTATE_RULES (rule for SCSEL, AX-14) and docs/engineering/02-api-and-contracts.md registry row, packages/api/src/server/sync.ts (group seal, AUTHOR_ONLY_COLUMNS :160, BookRequest.seal_since, PulledBookSchema.seal_watermark, SCSEL), contract-drift test, apps/mobile L13 + merge rules (with `mobile`), export E3, docs/agents/checkins/data-architect-bl-969.md
   Never:  docs/legal/** (rows by privacy/BL-960; founder merges), pg_cron or pg_net (option (a) is not proven on the Free plan), applied migrations, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: builds on S2 (BRIEF-BL-968-data) and H1; the same three functions; do not restate them a third time without H1.

4. READING PACK
PR #917 KNOWLEDGE-PACKS-2.md Pack 7 and 9; data-and-sync.md sections 2.1 (L13), 2.3 (S4, CK10), 5 (NS-06 B), 8 risk 2, 10 (CP7); eval A s2.3 and s1.4 S4 (branch docs/eng-eval-20nov); ADR 0028 D3, D3a; RULINGS.md AX-2, AX-14.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   docs/adr/0028-photo-seal-find-on-device-data.md:100-101   seal columns and the one visibility predicate (book_entries)
   supabase/migrations/20261015030000_v1_wire_contract_columns.sql   latest book_entries and entries_family_rules (search; E29 says they moved)
   supabase/migrations/20261005000000_family_cap_language_idempotency.sql:435-436   account-deletion request tombstones every own letter (D6 by construction) [U: re-open]
   packages/api/src/server/sync.ts:160, :618   AUTHOR_ONLY_COLUMNS; PulledRowSchema (old builds strip unknown keys: valibot object copies declared keys only)
   supabase/tests/grants.mjs:18   SERVICE_ROLE_FUNCTIONS (no new function under option (b), so no line)

6. DATA AND SECURITY
   Data classes: three seal columns L4; sync_books.seal_watermark L2 (composite '<instant>|<id>'); entries_seal_open_idx has no data. A sealed letter's words never reach a non-author before the instant, a backup restore, a log or analytics. Pull clause uses now() everywhere (CK10), no lower clamp on a supplied seal_since, an absent one on a non-fresh pull means no lower bound, extra rows on the last page only (eval A s2.3).
   Boundary: sync read path and the consent tuple. Owner of the read: security-architect; red-team.

7. LIBRARIES ALLOWED
none.

8. BUDGETS
Pull with the clause stays inside the pull budget (sync_perf.test.mjs:38); seals open only at whole or half-hour instants, so many share an instant: test 10,000 sealed rows opening at one instant (Rec). Not measured on hosted.

9. ACCEPTANCE
   Experience: area B and C seal states; no countdown, no count. Test cases: PR #927 catalogue D NS-06-B. Security: PR #914 and #915 on seals (a restore never reveals a seal, FR-OPS-08).
   Done also means: each cell red on the old schema and its mutant; `[NS-06-B8b]` includes the now() boundary.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: columns, CHECK, guard trigger, tuple, book_entries clause, classification | about 300 lines, 5 files | base develop (after S2)
   PR 2: sync_push group, sync_pull clause + watermark, SCSEL | about 250 lines | after PR 1
   PR 3: contract (sync.ts), L13, merge rules | about 200 lines, 6 files
   PR 4: export E3 (author's ZIP holds sealed letters whole) | about 120 lines

11. REVIEW LENSES
Lens A: red-team (D-041); data-steward. Lens B: security-architect.

12. ORDER AND DEPENDENCIES
After: BL-968, BL-959, H1. Before: BL-970 (phone). Blocked by: 'Blocked until'.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
J-N14: seal on UTC-8, check on UTC+14 at the instant; two-phone opening (device).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - counsel has not answered 'open at 18' or Q50; - an old author build strips the seal keys and would push a letter unsealed (eval A R7).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-bl-969 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-bl-969.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-bl-969-s4-seal-columns in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
