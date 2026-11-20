# Agent briefs: keeping and trust, data and sync (RD-H2, `data-architect`, 20 Nov 2026)

One brief per assignment left in these lanes, in the 16-field template of PR #916 (`BRIEF-TEMPLATE.md`). Docs only: no build, no migration, nothing applied. Every brief opens with "re-open every file:line before relying on it" and a `Blocked until:` line. Words a parent reads are PROPOSED only. Founder and counsel questions are listed here with a default; none is answered.

State read on 20 Nov 18:46 UTC: develop `16e61549`; plan branch `docs/engineering-project-plan-20nov` at `458fae46`; locked pack `450bcb4a` (#846, still open); designs `docs/tdd/new-scope/data-and-sync.md` and `08-keeping.md` on develop. Sources cited by PR (all open, none merged): #916, #917 (packs), #924 to #927 (test catalogue A to D), #914, #915 (security), #928 to #930 (budgets), #919, #920 (libraries), #931 to #933 (delta).

## The briefs, in the order to start them

Size is the brief's own estimate [E]. Lens A and B are from the plan's reviewer columns (the dispatcher may substitute by path). `Wave` is the plan's.

| # | Brief | Agent | Lane | Wave | Size | Lens A / B | Depends on | Blocked on |
|---|---|---|---|---|---|---|---|---|
| 1 | `BRIEF-T1-synced-column-drift-guard.md` | sync | data and sync | 1 | S | principal-architect / data-steward | none | nobody: start now |
| 2 | `BRIEF-T3-phone-class-label-check.md` | qa | data and sync | 1 | S | data-steward / principal-architect | none | nobody: start now |
| 3 | `BRIEF-BL-959-adr-0028-amendment-and-keeping-server-tests.md` | data-architect | data and sync | 1 | S x3 | data-steward / security-architect | #797, #865 (merged) | nobody: start now |
| 4 | `BRIEF-BL-870-s1-photo-bucket-write-deny.md` | data-architect | data and sync | 2 | S (280 lines) | red-team / security-architect | none | founder: `approve-migration`, Q8 count; product: a row for NS-01-R61 (CP6) |
| 5 | `BRIEF-P-7-f4-migration-checklist-and-record.md` | ops | data and sync | 1 | S x2 | data-steward / security-architect | PR 1 none; PR 2 the founder's apply | founder (F4 is open); product numbers P-7 |
| 6 | `BRIEF-BL-926-review-says-when-a-recording-is-not-gone.md` | mobile | keeping | 1 | S | principal-architect / design-systems | BL-925 (#866) | founder: words |
| 7 | `BRIEF-P-4-stuck-recording-and-let-go-tests.md` | mobile | keeping | 1 | M (2 PRs) | principal-architect / data-steward | BL-925; BL-926 first | founder: words; product: where R6's row lives (K3, E28) |
| 8 | `BRIEF-BL-922a-held-screen-for-consent-outstanding.md` | mobile | trust | 1 | M | principal-architect / security-architect | #871, #879 merged | founder: words (#870) |
| 9 | `BRIEF-BL-978-new-phone-consent-and-book-line.md` | mobile | trust | 1 | M (2 PRs) | principal-architect / security-architect, design-systems | BL-922a; 978b: BL-937 | founder: words; `sync` answer OQ-6 |
| 10 | `BRIEF-HO-908-910-911-second-account-follow-ups.md` | mobile | trust | 1 | S x3 | principal-architect / security-architect | #871, #879 merged | #879 merge; product's pick for #910 part 2 |
| 11 | `BRIEF-BL-976-backup-off-readiness-rows.md` | content, mobile, sync (3 runs) | keeping | 1 | S x3 | compliance-engineer / qa, design-systems | #874, #875 (merged); P-6c: BL-965 | founder: words, counsel OQ-4, founder OQ-1, OQ-3 |
| 12 | `BRIEF-BL-868-export-spec-stored-copy.md` | data-architect | export | 2 | S | compliance-engineer / data-steward | #797 (merged) | founder merges `docs/legal` (D-125) |
| 13 | `BRIEF-P-5-pictures-follow-delete-restore-purge.md` | mobile | data and sync | 2 | S | data-steward / compliance-engineer | #835 merged | founder: size exceptions on #835; product numbers P-5 |
| 14 | `BRIEF-G1-sync-pull-consent-gate.md` | data-architect | data and sync | 2 | S to M | red-team / security-architect | #909 answered; H1b decision | `security-architect` (#909), founder (MUST rule, grace window) |
| 15 | `BRIEF-H1-sync-hooks-refactor.md` | data-architect | data and sync | 3 | 3 PRs, SQL-heavy | red-team / principal-architect | T1 | Karma (OQ-K1), founder (size exception OQ-F5, `approve-migration`) |
| 16 | `BRIEF-BL-933-export-1-7-0-pictures.md` | mobile | export | 2 | M (2 PRs) | data-steward / compliance-engineer | BL-868, BL-931 | founder: BL-868 merge, size exceptions |
| 17 | `BRIEF-BL-942-save-a-copy-slip.md` | mobile | export (Save a copy) | 3 | S x2 | principal-architect / compliance-engineer | BL-931, BL-952, BL-963 | founder: words; the three hard dependencies |
| 18 | `BRIEF-NS-47-days-store-outside-scribe-db.md` | data-architect | data and sync | 3 | S to M | security-architect / privacy | NS-47 locks | product (card unlocked, R6 vs R7, Q-E5), counsel |
| 19 | `BRIEF-BL-968-data-firsts-l12-s2-e2.md` | data-architect | data and sync | 4 | M | red-team / security-architect | H1, BL-939, BL-981 | founder: size exception, `approve-migration`; product: OQ-P5 (320 or 200) |
| 20 | `BRIEF-BL-969-seal-l13-s4-c4-c5-e3.md` | data-architect | data and sync | 5 | L (4 PRs) | red-team / security-architect | BL-968, BL-959, H1 | counsel (open at 18, Q50), founder, `approve-migration` |
| 21 | `BRIEF-L14-L15-S3-from-name-and-withheld-words-columns.md` | data-architect | data and sync | 5 | S + L | red-team / ai-eng-lead | T1, T3, H1; BL-980 | counsel Q45 to Q54; Karma OQ-K2; founder; a native reviewer |
| 22 | `BRIEF-BL-979-earlier-versions-s5-rpc.md` | data-architect | keeping | 5 | L | red-team / security-architect | counsel, BL-937, T1 | counsel Q51, Q32, Q48; founder AX-10; Karma OQ-K2 |

22 briefs written. Three start now with no block (1, 2, 3). Two have a first part that starts now (5, PR 1; 11, PR 1, the claim patterns). The other 17 are blocked on the founder, counsel, product or another brief, as the last two columns say.

## Not briefed, and why (verified against GitHub and develop)

- BL-961 2 of 3 (#871, `4879ff5c`) and 3 of 3 (#879, `e27d104e`): built, A and B PASS WITH NOTES at the head, waiting on the founder. Their follow-ups are brief 10. `bookVisibleNow` is not on develop yet (no match under `apps/mobile/src`).
- Done or merged today: BL-923, BL-924, BL-967, P-9 (#905), #903 (NS-10-R7), #874 and #875 (BL-976 R5, R6), #869, #868, #876, #865, #797.
- Other lanes: BL-925 (#866), BL-965 (#870), BL-960 (#873), #854, #799, BL-930 (#880), BL-949 (#872) are content, privacy, legal or qa words and packets; BL-966, BL-943, BL-982 (reminders), BL-937, BL-938, BL-939 (Pack 7), BL-980 phone side, BL-983.
- L11 (phone migration 11): the CHECK ceilings are 2240 and 960 code points at #835's head `39cf30d3` (`migrations.ts:462-463`), so eval A R1 is closed. The stronger upgrade test is carried in brief 13 (P-5). BL-957 is mobile's ("data-architect pairs"); no brief.
- "Share a copy": I read it as NS-11 Save a copy (brief 17) and the share-sheet path of the export. NS-05 Level 1 (BL-939, a picture sent to another person, E23, an X2 path) is Pack 7 and not in my lanes; if Karma meant it, it needs its own brief.
- BL-973 (printed pages) and NS-19, NS-20, NS-26 to NS-31 stay parked (data-and-sync section 5).

## Founder questions (default in brackets; none answered here)

1. `approve-migration` on each of S1, H1, G1, S2, S3, S4, S5 [not merged without it].
2. One size exception for H1 (OQ-F5) [one for H1, so later column PRs stay small].
3. F4: fix both database secrets and run the first CI apply [blocks every servers-on build]. Note `docs/ops/DEPLOY.md:36` still says `scribe-prod` "does not exist yet": the founder creates the project first. If a hosted history holds any version other than the two expected, stop (OQ-F2) [no repair].
4. How many legacy `entries.photo_path` values are non-null in production (Q8, expected zero), before S1 is tagged.
5. OQ-F4: does the owner backup carry pictures [no].
6. OQ-5 (D1): a second account on a phone that holds the first account's book [hide it and offer sign-out].
7. G1: whether a newer Terms version blocks others' rows at once or after a grace window [grace, as POLICY_VERSIONING says].
8. Counsel through the founder: "open at 18" and Q50 (seals), Q45, Q46, Q48, Q54 (NS-16), Q51, Q32 (versions), CUL-Q5, Q6, Q7, Q11 (NS-47), Q43 (the iCloud line) [flags off].

## Conflicts to send to product

- CP6: BL-870 says "no migration here"; NS-01-R61 needs S1. A new row, owner data-architect, is owed (brief 4).
- NS-47 (card 21, unlocked, tip `40c6eb4a`): R6 against R7 (restore asks again vs `culture.asked` survives sign-out); Q-E5, two stores for one Days page (BL-982 `settings` keys vs the file outside `scribe.db`); the card names `docs/privacy/`, which does not exist (use `docs/legal/DATA_CLASSIFICATION.md` 4.6).
- NS-09-R6 (K3): the card says Storage, `storage.tsx:24-28` says letters and recordings never appear there; erratum E28 amends the rule on the unlocked branch. Confirm before brief 7 builds.
- OQ-P2: `entry_media.kind`, `ext`, `bytes` are L1 in #835's comments and L2 in the design default. `privacy` rules; T3 only checks a label exists.
- Catalogue A (#925) names `data-architect` as lane for NS-09-R7, R8, R11, R12 and NS-10-R7, R10, R11; the plan names `mobile` (brief 7, 9). I kept mobile, with the server half in brief 3.
- BL-976's status line still says "blocked (PR #622 merged)" (08-keeping K4). BL-944, BL-945 still treated as new synced fields in #847 (CK1): the card adds none.

## Findings worth the founder's minute

1. The three SQL functions every synced column restates are about 354 and 358 lines; without H1, Firsts and the seal each ask a size exception (brief 15, 19, 20).
2. Seal publication (option b) loses an opening if the pull window uses `statement_timestamp()` while the view reads `now()` (CK10). Brief 20 makes that boundary a named test.
3. `sync_pull` serves other members' letters on `require_user()` alone (`20261016000000_sync_v1_server.sql:1306`); only the phone's `canSync` gates consent today (G1, brief 14).
4. S1 turns red three existing cells that insert into `entry-photos` as the author (`access_matrix.test.mjs:56, 395`, `data_governance.test.mjs:114, 121`); brief 4 lists them.
5. Several design cites had already moved by the afternoon (see below); the briefs say "re-open every file:line" for that reason.

## Cites checked

61 file:line cites were opened at develop `16e61549`; 51 held, 10 had moved or were absent: `merge.ts:567` and `:584` (now `:407`, `:555`, `:569`, `:591`), `gate.logic.ts:123` and `:183` (now `:129`, `:194`), `consent.ts:117` (now `:88`, `:97`), `where-letters-live.tsx:64`, `strings.en.ts:302` (the key is `packages/content/src/strings.en.ts:303`), `use-account-deletion.ts:53` and `open-request.ts:144-157` (on #879's branch, not on develop), `sync.ts:554` `seal_since` (no seal code yet). The briefs carry the corrected lines or mark the cite [U]. Not read in full: the e2e design files (area C and D), PR #930, the function addenda beyond the pack-delta tables, `docs/ops/DEPLOY.md` beyond lines 36 to 56.

## Order

Start 1, 2, 3 and P-7's card now; they need no one. 6 to 11 wait for the founder's words and for #871 and #879. 12 is the founder's merge. 14 and 15 wait for Karma's and the founder's calls. 19 to 22 are gated by counsel and by H1 and stay as paper until then.
