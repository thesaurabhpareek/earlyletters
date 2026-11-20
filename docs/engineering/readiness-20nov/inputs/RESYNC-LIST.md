# Re-sync list: what must change, in order, when #846 finally merges

Status: v1, 20 Nov 2026, `principal-architect`, RD-A. Docs only. This lists edits; it makes none. No file named here was edited by me. It decides nothing: where an edit depends on a ruling, the ruling is the first step. [V] verified, [E] estimate, [U] not verified. Sources: `INPUTS.md`, `PACK-DELTA.md` and its six files.

## 0. Trigger and rules

- Trigger: PR #846 (`docs/prd-lock-v1-20nov`, open, head `450bcb4a` [V]) is merged by the founder, or the founder says the newer material (cards 19, 21, 27, function files) is inside the lock. The plan #847 says "re-syncs once more when #846 merges" (`17-engineering-project-plan.md:22`) and gives six steps (`:55-62`): diff the old and new head over `docs/product/prd/`, `docs/roadmap/` and the new-scope sections of `docs/BACKLOG.md`; a reworded row keeps its work row and re-checks the test title; a removed row holds its work row by status; a new row gets a work row or a "no work" line; re-read each open PR head; redo graph and capacity only if a dependency, size or wave changed. Re-sync from develop or #846's head, never from another open branch (`:62`).
- Today three branches carry newer material with no PR (`INPUTS.md` section 3). A merge of #846 alone brings none of cards 19, 21, 27, the function files or GAP-LOG. Step 1 settles which come with it.
- Order rule: records first (what is the source), then plan and backlog (what to build), then designs (how), then ADRs and chapters (the standards), then code comments, then other agents' readiness files. Each step lists what it unblocks.
- "Owner" is who edits. Where it is `product`, `Karma` or the founder, engineering hands off by issue (`docs/agents/AGENT-COMMS.md`) and does not edit. I (principal-architect) edit only my chapters 01, 02 and 10 and my memory; this run edits none.

## 1. Records and rulings (do these first; they decide what the others copy)

| # | Owner | File and section | Exact edit | Unblocks |
|---|---|---|---|---|
| 1 | Karma, founder | Statement of scope: which of cards 19 (NS-38 to NS-45), 21 (NS-46 to NS-50), 27 (NS-51, NS-52), `26`, the 23 function files, GAP-LOG and FUNCTION-TRACE are inside the lock | One line each: in, out, or draft. Today: 19 "Locked v1.0 candidate", 21 "Final holistic draft", 27 "CURRENT", none in #846 (`INPUTS.md` section 2.2) | Every later step |
| 2 | Karma | `docs/agents/cto/RULINGS.md` CR-66 (heading near `:610`, precedence bullet; handoff E-10) | Name cards 19, 21, 26 and 27 in the precedence list; point `docs/tdd/new-scope/` at the engineering files that now exist | Rows below |
| 3 | Karma, founder | `RULINGS.md` new entry, number by `node scripts/agents/next-id.mjs` | Record the reversals RV-18 (library read), RV-19 (video), RV-20 (several pictures) so cards NS-51 and NS-52 can be built to; each source scan "rewritten, not deleted" (`24:112`). Founder decides promises and money (Q-PM-1 to 4, 7, 9, 10) | NS-51, NS-52 designs and rows |
| 4 | product | `docs/product/prd/18-errata-after-lock.md` and the cards | Apply E1 to E30 in one docs PR (the file says so, `18:3`); fix card 21's `docs/privacy/DATA_CLASSIFICATION.md` to `docs/legal/DATA_CLASSIFICATION.md` section 4.6 (E-9); apply the "Changes to locked cards" list of card 27: NS-01-R15, R21a, R22 and never-line, NS-49 section 3 item 3 and R6, R25, R26, NS-32 section 3, R5, R12, NS-35-R5, NS-11, NS-36, NS-33, NS-10, NS-05, `00-product-frame.md` section 7, `12-parked-and-not-built.md` (OPP-16) | Plan rows keyed to the cards |
| 5 | product | `README.md` "Added 20 Nov" tables, `00-product-frame.md` master index, `13-engineering-plan.md`, `14-test-plan.md` section 7 and the P0 register | Add NS-38 to NS-52; today `00`, `13`, `14` contain no NS-38 to NS-50 (`25:14` item 4, grep count 0); regenerate 14 section 7 so every P0 row of NS-51 and NS-52 carries a "How proven" key (FR-QAL-25, `functions/quality.md:745`) | Plan and test layer |
| 6 | product | Card-internal fixes listed in `PACK-DELTA.md` section 4 | NS-51-R6 (database vs backup), NS-47-R6 vs R7, NS-48-R11 vs built titles, FR-AIS-54 vs NS-49 names, flag and key names (one set), migration 11 vs 12 | Designs for NS-46 to NS-52 |

## 2. Plan and backlog

| # | Owner | File and section | Exact edit | Unblocks |
|---|---|---|---|---|
| 7 | Karma (the agent refreshing #847 today) | `docs/product/prd/17-engineering-project-plan.md` header and section 1 table, rows "Requirements source", "Files mapped", "Cards", "Gates and rulings", "Founder record used", "Founder questions" | New head sha; "Cards" becomes NS-01 to NS-52 with row counts (637 at the lock, `17:26`; add the new cards' counts: NS-38 to NS-45 96 P0, NS-46 to NS-50 182 rows and 87 P0, NS-51 and NS-52 42 and 44 row ids); add Q-FD-* and Q-PM-* to the founder questions | Items 8 to 11 |
| 8 | same | `17` section 1.1 (ids renamed or removed) and "Re-sync rule" | Record "re-synced to <sha>; ids changed: ..." per the rule; list ids the errata PR changed | |
| 9 | same | `17` section 2 (work breakdown) | Add tables or rows: first run F38 to F45 (`23:46-58`); days D01 to D05 and the NR rows for days (NR-139 to 144, 160 to 166); NS-51 and NS-52 (BL-045, BL-046 once numbered); P rows for the errata new rows (E7, E9, E16, E28 rows); mark rows whose design file is still "PR breakdown: see design" | Capacity |
| 10 | same | `17` sections 3, 3a, 3b, 3c (dependency graph and critical paths) and 4 (capacity) | Add edges: BL-966 before days; BL-961 before NS-47, NS-51, NS-52; NS-42 builder before any server consent flag; migration 11 decision (`#835`) before NS-52; the new-row counts into weeks per wave [E] | |
| 11 | same | `17` section 5.2, 5.3 (founder inputs and questions), 6 (device batches), 7 (risks), 8 (mismatches) | Add: Supabase Auth production settings (NS-41), App Store Connect fields (NS-38), Apple entitlements (`declared-age-range`, `journal.allow`), phones for iOS 17.0 and 17.1 and an iPad (Q-FD-33); device batches for first run, J-CUL-01, NTC-T24, media; risks: media, Variant B cost, library read; mismatches: handoff C-1 to C-24 | |
| 12 | same | `17` section 10 (engineering design) | The design table lists `08` to `11`, `data-and-sync`, `security-and-privacy`; add the new design files (item 18) and mark the existing ones merged | |
| 13 | Karma, product | `docs/engineering/plans/locked-pack-plan.md` sections 3 to 7 | Card 23 says it replaces them (`23:4`); mark superseded or rewrite; no second plan | |
| 14 | product, Karma | `docs/BACKLOG.md` | (a) number the 38 proposed rows and set `ready` where Karma agrees (BL-045 NS-51, BL-046 NS-52, BL-047 140 function rows are proposals, `BACKLOG.md` blocks); (b) BL-966 title and scope: "60 in total, plan notices first", chooser, `libraryDay` rank, DL-2 order (handoff E-8); (c) BL-963 gains ranks 2b and 3b; (d) BL-982 decide with Q-E5; (e) BL-985 status: planner reads `quiet` since #901 and #902; (f) BL-967 done (#904); (g) BL-958 done (#896); (h) NS-51 and NS-52 rows reflect the card-27 names | Dispatch |
| 15 | founder (path is founder-owned) | `scripts/agents/lib.mjs:52` (`/\bBL-\d{3}\b/`), `.github/CODEOWNERS` | Dispatcher reads four-digit ids (handoff C-9, `BACKLOG-GAPS.md`); until then rows stay in holes | Dispatch of any row above BL-999 |

## 3. Our merged designs (`docs/tdd/new-scope/`), in order of dependence

Edits are listed as "what to add or change"; they carry the Fact, Assumption, Rec, Risk, OQ, Conflict, Unverified tags of `docs/tdd/01-mobile-client.md`. Owner is the steward who wrote the file (`principal-architect` for architecture, `security-architect` for security, `privacy` for privacy, `data-architect` for data-and-sync, `mobile` for 08 to 11) with the reviews the file already names.

| # | File | Section (line at `16e61549`) | Exact edit | Source |
|---|---|---|---|---|
| 16 | `architecture.md` | 1.2 card groups and modules (`:42-62`) | Add rows for NS-38 to NS-52: `lib/first-run/*`, `lib/auth/*`, new `modules/age-range`, `packages/core/src/days.ts`, `packages/content/src/days/`, `apps/mobile/src/lib/days/`, `lib/reminders/budget.ts`, slip registry, `modules/scribe-photo` (suggestions), `modules/scribe-photo-library`, media store paths, `components/platform/` | PD-2, PD-3 |
| 17 | `architecture.md` | 2.3 contract changes (`:98`); AC table (`:112-114`); AX-4 (`:161`) | Add keys `libraryDays`, `photoMoments`, `videos` (or the chosen names), `signIn` (if ruled), and note that phone-only flags read config outside `mayRun`; rewrite AX-4 now that E21 says a switch can hide a feature and never stops export | PD-2 s2, PD-5 s3 |
| 18 | `architecture.md` | 3 patterns (`:121-136`), AB-7 (`:72`), AP-10 (`:132`) | New patterns: on-device sensitive store (ADR B), notification privacy (ADR C), pure notification selection (ADR D); reword AB-7 (the moment index is derived from the library, not from `entries`); AP-10 registry list gains slips 2b and 3b and the new registered kinds | PD-3 s2 |
| 19 | `architecture.md` | 4 sequencing (`:137`), 6 risks (`:176`), 7 for Karma (`:191`) | Add steps and risks from the handoff build sequence (`24:215-258`) re-based on develop; add Q-E1 to Q-E16 answers when ruled | `24` |
| 20 | `security.md` | 3.1 (`:65`), 3.5 X2 (`:151`), 3.11 notifications (`:253`); new 3.12 to 3.14 | 3.1: rewrite the source scans (no PhotoKit authorisation outside one module, no Vision, no Core ML, no speech on media); 3.5: media upload and share are X2 paths, E23; 3.11: categories with `previewPlaceholder`, `publicTitleOk`, day names off under App lock; new 3.12 first run (age and region hook, sign-in, consent, deletion), 3.13 days store and culture, 3.14 library read and media (RSK-27 to RSK-32, FR-SEC-27 to 35) | PD-1, PD-5 s1 |
| 21 | `security.md` | 7 work list (`:305`), 8 questions (`:318`), 9 register (`:334`) | Add the work items and defaults Q-S8 to Q-S10; add threat rows | PD-5 |
| 22 | `privacy.md` | 1 per-card table (`:20`), 2 consent (`:102`), 3 label (`:125`), 4 inventory (`:143`) | Add NS-38 to NS-52 rows; correct the claim "No card adds a new consent" (`:104`) for first run; label rows per variant (FR-PRV-36); inventory: days store, `culture.asked`, `notifications.dayNames`, "Not today" date, moments index, media rows, with the level for each and the target `docs/legal/DATA_CLASSIFICATION.md` section 4.6 (founder merges) | PD-1, PD-3, PD-5 |
| 23 | `data-and-sync.md` | 2.1 phone migrations (`:35`), 2.2 settings keys and files (`:47`), 2.3 server migrations (`:51`), 2.5 export, erase, classes (`:77`) | Media decision (L11 amended or L12); new files and keys for days, culture, moments; File 28 and the first-run migrations `20261108000000`, `20261109000000` as dependencies with apply status; export minor for several items (`:79`); erase list gains `Application Support/media/` | PD-1, PD-3 |
| 24 | `data-and-sync.md` | 3.1 NS-01 photo (`:87`), 6 F4 (`:150`), 9 questions (`:189`), 10 conflicts (`:205`) | Several pictures and video per letter; migration CI status; add OQ for Q-E12, Q-E5; conflicts CP rows | PD-3 |
| 25 | `08-keeping.md` | 3 NS-10 (`:96`), 7 shared files and merge order (`:246`) | Merge order with NS-39 to NS-45 rows touching `lib/first-run/*`; add NS-45 deletion link | PD-1 |
| 26 | `09-capture.md` | 1.3 design (`:38`), 1.4 files, 5 NS-18 (`:165`) | Planner: `select` seam, `libraryDay` and `typedDay` kinds with a group field, day-only gate, horizon 366, tap routing to Home, cold-start tap; NS-18: resolve the typed-day store (Q-E5); add NS-48 catalogue subsection | PD-2 |
| 27 | `10-reading-and-family.md` | 1 NS-21 (`:27`), 3 NS-23 (`:122`, `HOME_SLIPS` at `:131`) | NS-21 row model gains media rows; NS-23 registry order `waiting, sealOpened, daySlip, saveACopy, daysAsk, pastLetter`, absent ranks allowed | PD-2, PD-3 |
| 28 | `11-foundations.md` | 2 NS-32 (`:54`), 3 NS-33 (`:86`), 4 NS-34 (`:131`), 6 NS-36 (`:179`), 7 NS-37 (`:226`), 8 NS-01 (`:254`), 8.3 (`:267`) | `budget.ts` shape (chooser vs registry; Q-E1); Bold Text, tokens v2, glass; budgets for media and index (rows 12, 13 at `:157-158`); per-item media in NS-36 rules; NS-37 copies and posters; NS-01 `kind` video, `order`; export minors | PD-2, PD-3, PD-6 |
| 29 | `README.md`, `engineering-facts-bl-987.md` | file list (`README.md:12`), facts | Add the new design files; update facts the cards wait on (the planner reads `quiet`; `bookVisibleTo` is on develop) | PD-6 s4 |
| 30 | New files (names PROPOSED) | `docs/tdd/new-scope/12-first-run.md`, `13-days-and-notifications.md`, `14-photo-library-and-media.md` | Write; 08 to 11 shape (behaviour, built today, design, data, privacy, tests per P0 row, PR breakdown at most 400 lines and 20 files, dependencies, risks, questions, unverified) | PD-1 to PD-3 |

## 4. ADRs and engineering chapters

| # | Owner | File | Exact edit | Source |
|---|---|---|---|---|
| 31 | principal-architect, data-architect | `docs/adr/0028-photo-seal-find-on-device-data.md` D1 (`:37-38, 48, 56`), D2 (`:68-76`), D5 (`:188-190`) | Record the media decision: `kind`, `ext` CHECKs and the one-photo index for several items and video; `ExportEntry.photo` against several items; erase and sweep include media | PD-3 s3.2 |
| 32 | Karma assigns numbers; owners per handoff | New ADRs A1 to J (`24:165-180`): flags and pause for phone-only features, one notification budget (0032), Home slip registry (0033), on-device sensitive store, notification privacy, pure selection, one age function, suggestions, library read, media storage and sync, days data, export minor (0038) | File as Proposed; cite from the design files instead of "ADR 0029" as a file | PD-2 s3 |
| 33 | principal-architect (my chapter) | `docs/engineering/02-api-and-contracts.md` "Public config and server-driven content" (`:75`) and "Errors" (`:47`, registry under API-R09 `:49`) | Kill-switch vocabulary: a key can hide, never turn on, never stop export; additive keys parse as off. Registry: add the codes the cards propose that reach a server or contract (`region_refused` if it becomes an `AuthErrorKind` mapped from a 403; `days_store_unavailable`, media codes are phone-local and stay out of the SQLSTATE registry); add `SCSEL` to `SQLSTATE_RULES` (GAP-LOG "E WORDS G7") | `GAP-LOG.md:341`, PD-2 |
| 34 | principal-architect | `docs/engineering/01-code-and-change.md` CODE-R13 (`:59`), CODE-R10 (`:51`) | Name `packages/core/src/age.ts` as the one age and month-start owner (IA audit X1, X2, X9); add the lint rule for `expo-glass-effect` outside `components/platform/` (COMPONENTS R5) | PD-6 s2 |
| 35 | principal-architect with analytics | `docs/engineering/10-logging-and-observability.md` OBS-R10 canary (`:51`) and "How to apply it" checklist (`:81`) | Canary fixtures for file names, album names, asset ids, tradition words, suggestion titles (NR-32, FR-PRV-45, FR-CUL-34) | PD-5 |
| 36 | security-architect, privacy | `docs/engineering/06-security-engineering.md`, `07-privacy-engineering.md` | New media and L4 store rules; native intake guard (NR-54); registry of on-phone stores | PD-5 |
| 37 | data-architect | `docs/engineering/03-database-and-schema.md`, `04-data-quality-and-lifecycle.md`, `08-data-rights-and-legal-requests.md` | Variant B schema rules (if ever), retention and deletion of media, export rights for media | PD-5 s6 |
| 38 | ai-eng-lead | `docs/engineering/09-ai-assisted-engineering.md` | Deny-list names for modules (FR-AIS-54, 61) once the naming conflict is ruled | PD-5 s5 |

## 5. Code headers and comments the new material proves wrong (handoff E-1 to E-12; hand off to `mobile`)

| # | File and line | Edit | Source |
|---|---|---|---|
| 39 | `packages/api/src/kill-switches.ts:1-8` | Header says each switch only stops a server-dependent feature; E21 says switches hide phone-only screens too | `18:E21` |
| 40 | `apps/mobile/src/lib/capabilities.ts:1-12` | Header says store profiles keep server features off; `eas.json` `production` sets them on (D-157); only `testflight` is off | `19:333` |
| 41 | `apps/mobile/src/lib/store.ts` near `:388` | Comment said the planner reads `Child.quiet`; that is true now (#901); re-read before editing | `24:287` stale |
| 42 | `apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec:9` | Platform 16.4 to 17.0 and `s.weak_frameworks` in the level 2 PR | `24:204` C-17 |
| 43 | `packages/content/src/release/app-review.en.ts:4` | Cites D-160's "coming soon" half; D-161 supersedes it (words, founder merges) | `19:149` |
| 44 | `docs/ops/` runbooks, `docs/support/` (do not exist), `docs/legal/DATA_CLASSIFICATION.md`, `docs/legal/app-store-privacy-labels.md:54, :117` | Per-variant label rows; Photos "Not used" row; new L4 store rows. `docs/legal/**` is founder-merged | `24:60`, FR-PRV-36 |

## 6. Other readiness files (other agents)

| # | Owner | File | Edit |
|---|---|---|---|
| 45 | each author of `docs/engineering/readiness-20nov/<folder>/` | every file that cites NS-01 to NS-37 only, a card row, or the plan | Re-key to the merged card ids and the plan sha; replace any line cite into the cards with the id (cards move when the errata PR applies); re-read INPUTS rows that moved |
| 46 | Karma | `docs/agents/BOARD.md` (claims), `docs/agents/checkins/` | New claims for NS-38 to NS-52 work; this run's check-in `docs/agents/checkins/principal-architect-rd-a.md` is a record, not an input |

## 7. What can start before #846 merges, and what must not

- Can start on the locked pack alone: everything already in plan #847 (NS-01 to NS-37 rows), the errata rows E7, E9, E16, E28.
- Can start with a ruling only (no card needed): the budget chooser (BL-966 after Q-E1), the phone-only flag pattern (A1 after #894), the content-rules drift test (qa F-01, `24:226`), analytics negative tests (`24:228`), NS-48 phase 1 (words only, `22:61`).
- Must not start: NS-51 and NS-52 code before the reversal is recorded (item 3); any upload of a child's picture or video before X2, counsel and the threat model; NS-47 store before BL-961 is green; NS-40 native module before the label guard knows the entitlement (BL-975); anything for print (NR-128 to 138) without a locked card.
