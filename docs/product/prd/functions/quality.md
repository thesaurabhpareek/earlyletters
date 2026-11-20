# Function review: quality and test coverage (QAL)

Owner: `qa` (Quality Engineer), second-wave review. Written 20 Nov 2026 (UTC) under `docs/product/prd/functions/BRIEF.md` and `/home/claude/review/gap-agents-common.md`. Docs only: nothing here is built, no test was written or run, and no decision is recorded. The person writing this is a Claude role, not a licensed professional; where a legal or store reading appears it says "counsel must confirm".

Fictional family Asha only. Words quoted from the product are intent for `content`, never final copy.

Why this file exists. `14-test-plan.md` section 7 is the P0 register (296 rows, cards 01 to 12). It predates card 19 (NS-38 to NS-45, 123 acceptance rows, 96 of them P0) and the nine function reviews (143 P0 function rows). Gate G0 says every P0 row has a test and a backlog row before any NS flag turns on outside the founder's family. A register that stops at 296 cannot be that gate. This file extends it, then adds what sits above the rows: the device matrix, the accessibility plan, unhappy-path lists, test data, who runs what, exploratory charters, gate evidence and a severity scheme.

---

## 1. What I reviewed, and what I did not

### Read this session (branch `docs/locked-pack-inputs-20nov`, head `736a1cf1c`)

| Source | How |
|---|---|
| `functions/BRIEF.md` (all), `functions/support.md` (sections 1 and 2) | read |
| `14-test-plan.md` (all, 141 lines), `18-errata-after-lock.md` (all) | read in full |
| `19-from-download-to-first-letter.md` | NS-38 intro, the path table, the Id index and open items (lines 1 to 75, 1717 to 1764) read; every P0 row's id and priority cell extracted by script; the rows' wording was not read in full |
| Function reviews (compliance, data-and-measurement, finance, legal, marketing, operations, privacy, risk-security, support) | the FR rows with a P0 priority extracted by script (143), their Requirement and Links cells read in truncated form (first 110 and 90 characters); not read in full |
| `11-foundations.md` NS-33 section 7 and 8, NS-34 section 7 (lines 259 to 292, 412 to 426) | read |
| `/home/claude/review/p0.py` | read and run: it reproduces TOTAL 296 on cards 01 to 12 |
| `docs/qa/DEVICE_TEST_PLAN.md` (headings, "Devices" table lines 40 to 54), `docs/qa/evidence/README.md`, `docs/qa/run-sheets/` listing, `docs/qa/COVERAGE.md` (listing only) | read in part |
| `docs/tdd/07-quality-test-strategy.md` lines 520 to 530 (G4, G5, escaped-defect rule) and 597 to 608 (triage and SLAs S0 to S3) | read |
| `.github/README.md` (lines 1 to 60), `.github/workflows/` listing, runner lines of `ci.yml`, `kill-harness.yml`, `ios-compile.yml`, `nightly.yml` (grep) | read in part |
| `apps/mobile/e2e/README.md` (lines 1 to 25) and the flow file list (E2E-01a to E2E-17b, 20 files) | read in part |
| `scripts/trace.mjs` (header, lines 1 to 30), `docs/TRACE.md` (headline) | read |
| `apps/mobile/app.config.ts:44` (`IOS_DEPLOYMENT_TARGET = '17.0'`) | grep |
| Area A to E design (`docs/design/e2e/*/DESIGN.md`, branch `docs/e2e-ux-20nov`): screen inventories (A-S01 to A-S15, B-S01 to B-S23, C-S01 to C-S22, D-S01 to D-S24, E-S01 to E-S29, E-ST01 on), A section 2.2 (A-U01 to A-U62) and 3a (material layer), C journey list, E journeys J-E01 to J-E25 and J-E08, the heads of B and D unhappy lines | read via `git show origin/docs/e2e-ux-20nov:...` |
| `docs/product/prd/GAP-LOG.md` | grep only |

### Not read, not run

- I ran no test, no simulator, no phone and no CI job. Every number about CI (jobs, runners, timeouts) is from the workflow files' grep lines, not from a run. The 10 minute budget is the header comment of `ci.yml`; I did not measure it.
- NS-38 to NS-45 wording below the P0 id level: I classify rows by the card's own priority cell and by the Id index, not by reading each row's Given, When, Then. Where a row's proof kind in Annex A is my reading of its function-review requirement, a different reading is possible. The "How proven" column is a proposal for the engineer who writes the test, not a ruling.
- The cards 01 to 12 beyond what `p0.py` extracts, `15-council-review.md`, `16-council-review-round-2.md` (not opened), `13-engineering-plan.md`.
- B, C and D design unhappy-path sections in full. I read A's list (62 ids) and the headings of the others; section 6 therefore gives A and E as lists and B, C, D as the categories their journeys name, and says so.
- `docs/qa/COVERAGE.md` content, `docs/qa/RELEASE_TEST_PLAN.md`, `release-test-catalog.csv`, the run sheets' contents, `docs/tdd/07` sections other than those listed, `packages/*/test` contents.
- Whether PR #819 (trace rework) has merged. `14-test-plan.md` says it is to be reworked; I did not check GitHub. `docs/TRACE.md` on this branch was generated from `docs/prd/v2` and shows 833 ids and 571 P0 ids with no test title, which is the old PRD and not this pack.
- Apple's rules on the Accessibility Nutrition Labels, Declared Age Range and iOS version support: UNVERIFIED by me this session; I point to `compliance.md` FR-CMP-06 and FR-CMP-15 for those and do not restate them. No outside web source was read for this file.
- The newest iOS number: `DEVICE_TEST_PLAN.md` line 47 says "27 at the time of writing" and marks it (A) assumption. UNVERIFIED.

---

## 2. Coverage

### 2.1 What the repo says about quality today

| Area | What exists (cited) | Gap |
|---|---|---|
| Traceability | `scripts/trace.mjs:1-30` reads `docs/prd/v2` or `docs/prd`; evidence is a test title citing the id or a Maestro tag. `docs/TRACE.md` headline: 571 P0 ids with no test title (old PRD). `14-test-plan.md` intro: trace matches only `X-REQ-nnn` and `X-NFR-nnn`, no NS id traced | No NS, NX, FR or card-19 id is traced. G0 cannot pass |
| Register | `14` section 7: 296 rows by card, reason letters per card only | No card 19 rows, no function rows, no errata rows, no "how proven" kind, no owner |
| Levels | `14` section 2 (unit, integration, source, content, journey, device) | No place for evidence-kind rows (a counsel read, a gate record, an App Store Connect answer) that no test can prove |
| Journeys | `14` section 4: J-N1 to J-N27 (J-N18 listed last), all cards 01 to 37 | Nothing for the card 19 path. Area E drew J-E01 to J-E25 but they are not in the test plan |
| Device matrix | `14` section 5 (five phone lines, "which phones the founder holds is not recorded"); `DEVICE_TEST_PLAN.md:40-54` (se3, ip12, ip15, current, oldest, ipad, mac, win11) | Two lists that differ (14 has no ip12/ip15). No iOS 26 glass versus fallback row, no dark mode or Low Power Mode per screen, no pairing of setting to screen |
| Accessibility | NS-33-R1 to R16 (lines 259-277), `14` J-N12, J-N15, J-N20; `14` section 5 settings list | `14` section 8: "no device walk on record for the letter page, Me or the Book header". No per-screen checklist, no first-run screens, no owner for the XCUITest audit (R16) |
| Unhappy paths | Cards' unhappy tables; area A A-U01 to A-U62; area E J-E03 to J-E25 | Not indexed to tests. No id in a test title proves an unhappy path today |
| Test data | `apps/mobile/test/helpers/asha-export.ts`, `store-fixture.ts` (listing); `no-real-family-data.test.ts` stores hashes | No catalogue of the Asha fixtures the cards need (1,000 letters, 300 pictures, twins, due-date-only, plan lapsed, second account, Devanagari, sealed) |
| CI split | `ci.yml` job timeouts 4, 5, 15, 5, 5, 15, 1 minutes (grep lines 29 to 139); header budget "under 10 minutes"; `kill-harness.yml` and `ios-compile.yml` use `macos-26` | A 15 minute timeout on a job (`ci.yml:68`, `:111`) sits above the 10 minute budget; the header explains the path-filtered case but I did not verify the end-to-end time |
| Severity | `docs/tdd/07` 11.3: S0 to S3 with SLAs; G4 "no open S0 or S1"; accessibility failure on a P0 screen is S2 and blocks G4 | Not tied to the constitution wording; no card 19 examples; S2 for an accessibility failure on the core loop contradicts NS-33-R6 being P0 (see FR-QAL-17 and Annex I) |
| Gates | `14` section 6 (G0 to G6, one paragraph); `compliance.md` FR-CMP-11 (gate record path `docs/legal/evidence/store/<version>-<build>/gates.md`) | `14` names no evidence artifact per gate; Annex H does |

---

### 2.2 Coverage verdict per card, quality view (NS-01 to NS-45)

A card is covered when it names a test title for every P0 row and the proof kind can run where it says. Partly when some rows are device or record rows with no run sheet row. Missing when the card has a quality duty nothing meets. I judged from `14` (sections 4, 7, 8) and the register shape, not from reading each card.

| Cards | Verdict | Why |
|---|---|---|
| NS-01 to NS-25 | Partly | 14 section 7 lists their P0 rows and 14 section 4 journeys cover most. No row is traced (trace sees no NS id). Device rows S1-204, S1-205 and S1-135 "not yet run" (14 section 8) |
| NS-32 | Partly | J-N4, J-N22, J-N24, J-N26, J-N27 cover it; budget and quiet-book (E16) proofs depend on an unbuilt planner change |
| NS-33 | Partly | 13 P0 rows; R4, R5, R6, R7, R9 and R10 are labelled device, R8 is token plus device, R16 is an XCUITest audit. No device walk on record (14 section 8). Annex C turns them into a per-screen plan |
| NS-34 | Partly | R2, R5, R6 P0; no number measured (14 section 8). BL-929 sheet is not run |
| NS-35 | Covered in design, not in proof | a source check; it needs the trace ratchet to count |
| NS-36, NS-37 | Partly | Rows exist; J-N9, J-N10, J-N13, J-N14 are journeys on device |
| NS-38 | Partly | R1, R4, R5 are records (store record, label, Notes for Review). R2 is a scan. No gate-record file exists yet (FR-CMP-11) |
| NS-39 | Missing | No journey in 14 for first launch, the lock offer removal, the outage local start, the speech download ask. J-E01 to J-E04 are area E's, not the test plan's |
| NS-40 | Missing | Age gate, stop, 24 h, region refusal, Declared Age Range: no J-N row. Existing Maestro flows E2E-01a and E2E-01b cover the 18+ gate from the older PRD (flow header lines read) |
| NS-41 | Missing | Sign-in kinds (J-E08 lists 16), code length, rate limits, claim, second account: only E2E-12 (needs a backend, not run: e2e README section 1) |
| NS-42 | Missing | Agreement records at three moments, versioned links: needs unit tests on the record and a device spot check of each sheet |
| NS-43 | Missing | First book, twins, due date only, the promise line: E2E-02 (twins) exists from the older PRD |
| NS-44 | Missing | First letter, third Keep gate, plan lapse: J-N25, J-N22 cover lapse; nothing covers the allowance count rules or "The book is open." |
| NS-45 | Missing | Sign out, delete, session end, app update: J-N21 and J-C08 exist; app update (E-S16) and forced sign-out (J-E21) have none in 14 |

---

## 3. Function requirements: the extended P0 register and the QAL rows

The card is the source of truth; this register is its index (14 section 7). Two new tables follow, then the arithmetic. Reason letters follow RR-4: (a) a promise, (b) a legal or store duty, (c) the core loop. Card-level reasons are taken from the cards' own priority cells, as in the existing register.

### 3a. Card 19 (NS-38 to NS-45): 96 P0 rows of 123

Extracted by script from `19-from-download-to-first-letter.md` (rows whose first cell is `NS-3x-Rn` or `NS-4x-Rn` and whose Priority cell starts `P0`). The Id index (line 1727) gives the same per-card counts (8, 10, 11, 18, 13, 11, 10, 15), so the script and the card agree.

| Card | P0 rows | Reasons |
|---|---|---|
| NS-38 | NS-38-R1, NS-38-R2, NS-38-R3, NS-38-R4, NS-38-R5, NS-38-R7, NS-38-R8, NS-38-R9 | (a) (b) |
| NS-39 | NS-39-R1, NS-39-R2, NS-39-R3, NS-39-R4, NS-39-R5, NS-39-R6, NS-39-R10, NS-39-R11, NS-39-R12, NS-39-R14 | (a) (b) (c) |
| NS-40 | NS-40-R1, NS-40-R2, NS-40-R3, NS-40-R5, NS-40-R6, NS-40-R7, NS-40-R8, NS-40-R9, NS-40-R10, NS-40-R12, NS-40-R13 | (b) |
| NS-41 | NS-41-R1, NS-41-R2, NS-41-R3, NS-41-R4, NS-41-R5, NS-41-R6, NS-41-R7, NS-41-R9, NS-41-R10, NS-41-R11, NS-41-R13, NS-41-R14, NS-41-R16, NS-41-R18, NS-41-R19, NS-41-R20, NS-41-R22, NS-41-R23 | (a) (b) (c) |
| NS-42 | NS-42-R1, NS-42-R2, NS-42-R3, NS-42-R4, NS-42-R5, NS-42-R6, NS-42-R7, NS-42-R9, NS-42-R10, NS-42-R11, NS-42-R13, NS-42-R15, NS-42-R16 | (a) (b) |
| NS-43 | NS-43-R1, NS-43-R2, NS-43-R3, NS-43-R4, NS-43-R6, NS-43-R7, NS-43-R8, NS-43-R10, NS-43-R11, NS-43-R13, NS-43-R14 | (a) (b) (c) |
| NS-44 | NS-44-R1, NS-44-R2, NS-44-R3, NS-44-R4, NS-44-R6, NS-44-R7, NS-44-R8, NS-44-R9, NS-44-R10, NS-44-R12 | (a) (b) (c) |
| NS-45 | NS-45-R1, NS-45-R2, NS-45-R3, NS-45-R5, NS-45-R6, NS-45-R7, NS-45-R8, NS-45-R9, NS-45-R10, NS-45-R11, NS-45-R12, NS-45-R13, NS-45-R15, NS-45-R16, NS-45-R18 | (a) (b) (c) |

Subtotal 96. Test titles start with the id in brackets, for example `[NS-41-R6] a second account never sees the first account's book`. The card says no card claims trace coverage today (card 19 conventions).

### 3b. Errata rows that belong in the register

| Source | New or changed P0 row | Why it is P0 | Backlog |
|---|---|---|---|
| 18 E9 (NS-10) | "NS-10-Rdecline": given an account whose required consent is not current, the phone shows no server-held book and uploads nothing (the server's `sync_pull` still serves rows, `:1305`) | (a)(b): consent. Same behaviour as FR-PRV-20 | new row needed (the errata names one) |
| 18 E7 (NS-17) | NS-17-R8 stays P0; the proof changes to a database test of the new empty-withheld-words call, not an app test | (a): no words added or kept by the machine | new row needed (the errata names one) |
| 18 E16 (NS-13) | NS-13-R12 and J-N19 stay P0; proof must read `Child.quiet`, not `remindersOn` (`prefs.ts:115-116`) | (a): loss case | new row needed (the errata names one; lands with BL-985) |
| 18 E18 (NS-01-R13a, NS-23-R11) | one row, app-switcher snapshot blank with or without App lock | (a) | none yet (#838 built per errata) |

I add one row (NS-10-Rdecline). The other three are existing P0 rows whose evidence changes; the card changes in section 8 say so.

### 3c. Function review rows (143 P0)

All FR rows whose Priority cell starts `P0` in the nine function files, by function. "How proven" is my proposal (key below the table).

| Function | P0 FR rows | Count |
|---|---|---|
| CMP | FR-CMP-01, FR-CMP-03, FR-CMP-04, FR-CMP-05, FR-CMP-06, FR-CMP-07, FR-CMP-11, FR-CMP-12, FR-CMP-13, FR-CMP-14, FR-CMP-15, FR-CMP-16, FR-CMP-17, FR-CMP-18, FR-CMP-19, FR-CMP-20 | 16 |
| DAT | FR-DAT-01, FR-DAT-02, FR-DAT-03, FR-DAT-04, FR-DAT-05, FR-DAT-09, FR-DAT-14, FR-DAT-20, FR-DAT-27, FR-DAT-32, FR-DAT-35 | 11 |
| FIN | FR-FIN-02, FR-FIN-03, FR-FIN-05, FR-FIN-09, FR-FIN-11, FR-FIN-22 | 6 |
| LEG | FR-LEG-01, FR-LEG-02, FR-LEG-03, FR-LEG-04, FR-LEG-06, FR-LEG-07, FR-LEG-08, FR-LEG-09, FR-LEG-10, FR-LEG-11, FR-LEG-12, FR-LEG-13, FR-LEG-15, FR-LEG-18, FR-LEG-20 | 15 |
| MKT | FR-MKT-01, FR-MKT-02, FR-MKT-03, FR-MKT-05, FR-MKT-06, FR-MKT-07, FR-MKT-08, FR-MKT-09, FR-MKT-11, FR-MKT-12, FR-MKT-15, FR-MKT-16, FR-MKT-19, FR-MKT-20, FR-MKT-22, FR-MKT-25, FR-MKT-28, FR-MKT-29, FR-MKT-32, FR-MKT-34 | 20 |
| OPS | FR-OPS-03, FR-OPS-06, FR-OPS-08, FR-OPS-09, FR-OPS-10, FR-OPS-11, FR-OPS-14, FR-OPS-15, FR-OPS-16, FR-OPS-17, FR-OPS-23, FR-OPS-24, FR-OPS-28, FR-OPS-31, FR-OPS-33 | 15 |
| PRV | FR-PRV-01, FR-PRV-02, FR-PRV-06, FR-PRV-10, FR-PRV-11, FR-PRV-13, FR-PRV-14, FR-PRV-15, FR-PRV-16, FR-PRV-17, FR-PRV-18, FR-PRV-19, FR-PRV-20, FR-PRV-24, FR-PRV-25, FR-PRV-26, FR-PRV-27, FR-PRV-28, FR-PRV-30, FR-PRV-31, FR-PRV-33, FR-PRV-34 | 22 |
| SEC | FR-SEC-01, FR-SEC-02, FR-SEC-03, FR-SEC-04, FR-SEC-21, FR-SEC-22, FR-SEC-23, FR-SEC-16, FR-SEC-18, FR-SEC-24, FR-SEC-26 | 11 |
| RSK | FR-RSK-02, FR-RSK-03, FR-RSK-04, FR-RSK-06 | 4 |
| SUP | FR-SUP-01, FR-SUP-03, FR-SUP-04, FR-SUP-05, FR-SUP-07, FR-SUP-09, FR-SUP-10, FR-SUP-11, FR-SUP-12, FR-SUP-14, FR-SUP-15, FR-SUP-16, FR-SUP-17, FR-SUP-21, FR-SUP-23 | 15 |
| POL | FR-POL-02, FR-POL-03, FR-POL-04, FR-POL-05, FR-POL-06, FR-POL-07, FR-POL-12, FR-POL-13 | 8 |

Subtotal 143 (the Count column adds to 143; the support file's 23 split into SUP 15 and POL 8, the risk file's 15 into SEC 11 and RSK 4).

Key to "How proven":

| Key | Meaning | Where it runs | Test or evidence |
|---|---|---|---|
| C | A unit or integration test on Asha fixtures | CI (`npm test`, `npm run test:db`, `npm run test:functions`) | title starts `[FR-xxx-nn]` |
| S | A source or rules scan (a grep-style test over strings, flags, routes, dependencies, store text) | CI | title starts `[FR-xxx-nn]` |
| D | Only a phone shows it | the founder's phones on the run sheet | row in `docs/qa/evidence/` |
| E | A record that must exist and match: a gate record, a release record, an App Store Connect answer, a runbook drill | a script checks the file exists and names a date and build; a human reads it | file path in the gate record |
| P | A process or a counsel or founder act that no test can prove | none | the dated record only; the register row says "process, not a test" |
| + | Both parts are needed | | |

| Key | Count in the 143 |
|---|---|
| S (scan) | 40 |
| E (record) | 34 |
| C (test) | 31 |
| C+D | 13 |
| P (process) | 12 |
| S+E | 3 |
| C+E | 3 |
| D | 3 |
| D+E | 2 |
| S+D | 1 |
| C(db) | 1 |

Reading the table: rows with a CI part (C, S, C+D, S+E, C+E, S+D, C(db)) number 40 + 31 + 13 + 3 + 3 + 1 + 1 = 92. Rows with a device part (D, C+D, D+E, S+D) number 3 + 13 + 2 + 1 = 19. Rows that are a record or a process only (E, P) number 34 + 12 = 46. Some rows are in two groups. A P0 row in the E or P classes cannot go green by a test title; that is why FR-QAL-03 exists. Without it the G0 ratchet either fails forever or is waived without saying so.

The row-by-row table is Annex A.

### 3d. Arithmetic

| | Rows |
|---|---|
| Register in `14` section 7 (cards 01 to 12) | 296 |
| Card 19 (NS-38 to NS-45) | 96 |
| Errata row NS-10-Rdecline | 1 |
| Function review rows (FR) | 143 |
| QAL rows in section 5 that are P0 | see section 3f (16) |
| Total P0 rows named by the pack | 296 + 96 + 1 + 143 + 16 = 552 |

Not 552 distinct tests. Many FR rows restate a card row: FR-SEC-01, FR-PRV-14 and NS-41-R6 are one test (`[X4-R1]`); FR-CMP-17, FR-LEG-02, FR-PRV-18, FR-SUP-14 and NS-45's deletion rows overlap; FR-DAT-01 and FR-PRV-31 overlap. One test may carry several ids in its title: `[NS-41-R6][FR-SEC-01][FR-PRV-14][X4-R1] account B never sees account A's book`. I have not de-duplicated by reading; FR-QAL-04 makes `trace.mjs` do it from titles. I would not quote 552 outside this file as a count of tests.

### 3e. How `p0.py` should change (script work for `qa`; I did not edit it)

`/home/claude/review/p0.py` line 14 keeps only cards 01 to 12 (`int(...) <= 12`) and matches ids `NS-..`, `X..`, `FRAME`. To regenerate the full register: raise the file filter to include `19-*`, add `FR-[A-Z]+-\d+` to `idre`, read `functions/*.md` too, and print three tables (cards, card 19, FR) plus one total. I ran an equivalent extraction in a scratch script this session (outside the repo) to produce the numbers above. Section 7 of `14` is regenerated by the same PR that changes a priority (14 section 7 last paragraph).

---


### 3f. Quality requirements (QAL)

Priority reasons: (a) a promise, (b) a legal or store duty, (c) the core loop. QAL rows are P0 when a missing one lets a P0 row elsewhere pass without proof. Backlog: no BL id is invented; "new row needed" means `product` files it with `next-id.mjs`. Existing rows cited are BL-002 (traceability check), BL-929 (device baseline sheet), BL-985, BL-965. Owner lane is `qa` unless named.

| Id | Requirement (Given, When, Then) | Links (card rows; e2e ids; backlog) | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-QAL-01 | Given the locked pack, When `14-test-plan.md` section 7 is next regenerated, Then it holds three tables (cards 01 to 12, card 19, function rows) plus the errata row, each P0 row has a "How proven" key (C, S, D, E, P) and an owner, and the total is printed | 14 s7; NS-38 to NS-45 Id index; all FR P0 rows; none; new row needed | P0 (a): no promise without an index entry | `qa` | `p0.py` today stops at card 12 (line 14); this file 3a to 3e |
| FR-QAL-02 | Given a PR that changes a P0 row, When CI runs, Then `scripts/trace.mjs` reads `docs/product/prd` (cards, card 19, `functions/*.md`), recognises `NS-nn-Rn`, `NX-`, `FR-xxx-nn`, `X4-R1`, `X6-R1` and `FRAME-SLIP`, and fails if a P0 row that is new in that PR has neither a test title nor an evidence path (a ratchet: old rows are reported, new rows block) | G0; 14 intro; none; BL-002 (and the reworked #819 per 14) | P0 (a) | `qa` | `scripts/trace.mjs:1-30` reads `docs/prd/v2`; `docs/TRACE.md` shows 571 P0 ids with no test title for the old PRD |
| FR-QAL-03 | Given a P0 row whose "How proven" is E or P (a record, a counsel read, a gate record, an App Store Connect answer, a runbook drill), When trace runs, Then it accepts the row only if it names a path that exists and carries a date and a build or version; a P row is listed as "process, not a test" and is never counted as tested | G0, G5, G6; FR-CMP-11 gate record path; E-S27; none; new row needed | P0 (a) | `qa`, `compliance-engineer` | 46 of 143 FR rows are E or P (Annex A); without this rule G0 fails forever or is waived without saying so |
| FR-QAL-04 | Given one test proves several rows, When its title lists them, Then every id is in brackets (`[NS-41-R6][FR-SEC-01][FR-PRV-14][X4-R1]`) and trace counts each id; a test that runs against a stand-in says so in its title and its row stays "partly built" (14 s2) | all; none; new row needed | P1 | `qa` | 14 s2 (stand-in rule); 3d above |
| FR-QAL-05 | Given card 19, When the journeys of `14` section 4 are extended, Then J-N28 to J-N36 exist: J-N28 first launch to first kept letter on a fresh install (E-S01 to A-S13); J-N29 age answer No, 24 h stop, "I answered by mistake" with an injected clock (NS-40); J-N30 sign-in kinds in place, one assertion per `AuthErrorKind` row of J-E08 (NS-41); J-N31 sign-in unreachable and offline, local start, later claim (J-E03, J-E04, E-S24); J-N32 consent outstanding at relaunch (J-E06, NS-10-R0); J-N33 second account on one phone (J-E17, `[X4-R1]`); J-N34 kill at every first-run step, no half-written book (J-E18); J-N35 third Keep gate and plan lapse, past letters unaffected (J-E10, J-E11); J-N36 sign out, delete account, forced sign-out, app update (NS-45, J-E21, J-E15) | NS-38 to NS-45; E-S01 to E-S10, E-S14, E-S24, E-S26; J-E01 to J-E25; new row needed | P0 (c) | `qa` with `mobile` | 14 s4 has no card 19 journey; area E drew J-E01 to J-E25 |
| FR-QAL-06 | Given the canary strings of J-N18, When the new first-run fields are filled (email, code, age answer, child name, date, "what the child calls you", region refusal), Then no canary appears in a log line, crash report, URL, analytics value, notification or the support mailto (extends J-N18 and FR-PRV-10, FR-PRV-27) | NS-39 to NS-43; J-N18; E-S05, E-S06, E-S08; new row needed | P0 (a) | `qa`, `privacy` | 14 J-N18; FR-PRV-10, -26, -27 (pointers, not restated) |
| FR-QAL-07 | Given a store candidate, When G4 is run, Then the device matrix of Annex B is walked in its eight passes, each pass names phone model, iOS version, build and the settings on, and the evidence file is `docs/qa/evidence/<date>-<build>-<phone>.md`; a pass with no suitable phone is "not run", never "pass" | G4; NS-34-R1 to R7, NS-33-R4 to R10; E-S23; BL-929 | P0 (b): store gate | `qa`, founder runs | 14 s5 (five lines, holdings unknown); `DEVICE_TEST_PLAN.md:40-54` Extended by FR-QAL-26 on 20 Nov. |
| FR-QAL-08 | Given a glass surface (design 3a rule: "Reduce Transparency or iOS before 26: each glass surface becomes a solid `surfaceRaised` with a 1 pt `line` hairline"), When the source scan runs, Then every glass use has a solid fallback of the same shape and size, no screen shows more than three glass surfaces, and glass appears only on the navigation and control layer; on a phone, passes 4 and 5 of Annex B compare the glass and fallback states by eye | A-S01 to A-S07, B-S01 to B-S15, C-S01; `docs/design/system/BRIEF.md` s3 (cited by A 3a); new row needed | P1 | `qa`, `mobile` | `A-capture/DESIGN.md:506` (read) |
| FR-QAL-09 | Given the accessibility plan of Annex C, When a store candidate is cut, Then every screen in its screen set passes the per-screen checklist in the passes that apply, with the XCUITest audit (NS-33-R16) run on each screen at AX5, and a failure is a defect under Annex I, never an exception | NS-33-R1 to R16; E-S23; all A to E screens named in Annex C; BL-929 | P0 (b): WCAG 2.2 AA is LEGAL-REQ-051 per `compliance.md` FR-CMP-07 | `qa`, `mobile` | 14 s8: no device walk on record for the letter page, Me or the Book header |
| FR-QAL-10 | Given a macOS runner, When the XCUITest audit is added, Then it runs nightly and on a candidate, not on every PR, so the PR budget of 10 minutes holds; the workflow change is a patch in `docs/ops/proposed/` for the founder | NS-33-R16; none; new row needed | P1 | `qa` | `kill-harness.yml:128` and `ios-compile.yml:60` already use `macos-26` (grep); whether an XCUITest target exists is UNVERIFIED |
| FR-QAL-11 | Given the unhappy-path lists of Annex D, When a P0 row's card names an unhappy case (core loop, loss, wrong person, leak, consent, plan), Then a test title or run-sheet row carries the case id (`[A-U05]`, `[J-E08.wrong_code]`) and trace lists P0-related case ids with no proof; P1 cases are reported, not blocked | A-U01 to A-U62; B, C, D journeys; J-E03 to J-E25; new row needed | P0 (c) for the listed core-loop and loss cases; P1 for the rest | `qa` | Annex D |
| FR-QAL-12 | Given any test, run sheet, screenshot, trace, fixture or defect report, When it is created, Then it uses the Asha catalogue of Annex E only; fixtures are generated, not copied from a person's phone; the `no-real-family-data` test runs on every PR that adds evidence; and no CI log prints a canary or a name outside the Asha set | NS-34-R5, NS-01-R62, NS-02-R48; FR-OPS-31, FR-PRV-10; none | P0 (a) | `qa` | `packages/content/test/no-real-family-data.test.ts` (listing); 14 s5 ruling of 20 Nov |
| FR-QAL-13 | Given a test about time (a seal, a reminder, a trial end, the 24 h age stop, the clock guard), When it runs, Then it uses an injected clock and an explicit time zone, never a sleep and never the runner's zone; two zones and one DST change are in the matrix (Annex E.5) | NS-06-B, NS-13, NS-32, NS-40; J-N5, J-N14, J-N27; none | P1 | `qa` | 14 s3 ("injected clock") |
| FR-QAL-14 | Given a test that fails once in a rerun, When triaged, Then the cause is fixed; the test is never skipped, quarantined or loosened; the weekly rerun uses new fuzz seeds and a failing seed and run count are written in the issue | all; none; none (nightly fuzz exists) | P1 | `qa` | charter "Never"; `.github/README.md` (SCRIBE_FUZZ_SEED replay); `nightly.yml:52` (random seed job) |
| FR-QAL-15 | Given a change to capture, store, save, erase or the first-run steps, When it merges to develop, Then the kill harness runs 50 kills; on a candidate 500 at random points for kill mid-record and kill during save (DL-01, DL-02), plus one kill at each first-run step (J-N34); a lost take or a half-written book is S0 | NS-09, NS-45, NS-39 to NS-43; J-N1, J-N34; J-E18; none | P0 (a): never lose a take | `qa`, `mobile` | 14 s3 (50 runs on merge); `DEVICE_TEST_PLAN.md` DL-01, DL-02 (500 runs, not run) |
| FR-QAL-16 | Given a store candidate, When each of G0 to G6 is claimed, Then the artifact named for that gate in Annex H exists, is dated, names the build, and is listed in the one gate record of FR-CMP-11 | G0 to G6; none; new row needed | P0 (b) | `qa`, `compliance-engineer` | 14 s6; `compliance.md` FR-CMP-11 |
| FR-QAL-17 | Given a defect, When it is triaged, Then it carries the severity of Annex I (S0 to S3) assigned by `qa`, never lowered by the author of the code, with the constitution as the S0 test; a failing P0 row on `develop` blocks the next candidate at the severity of the harm it names | all; none; TDD 07 11.3 | P0 (a) | `qa`, Karma | `docs/tdd/07` 11.3 (lines 597 to 603) |
| FR-QAL-18 | Given a candidate, When exploratory testing runs, Then the charters of Annex G are each run once per candidate by someone other than the author, 45 minutes each, with notes in the evidence file | G4; all; none | P1 | `qa`, founder | 14 s2 levels (none exploratory today) |
| FR-QAL-19 | Given the CI budget of 10 minutes, When new P0 tests are added, Then they go into the existing parallel jobs or a new parallel job, never the longest path; a job that grows is split, its timeout is not raised; the patch is proposed under `docs/ops/proposed/` | all; none; none | P1 | `qa` | `ci.yml:1-4` budget; timeouts at `:29, :53, :68, :79, :90, :111, :139` |
| FR-QAL-20 | Given a store candidate, When G4 runs, Then one pass is App Review's: a clean install of the candidate, the demo sign-in and Notes for Review read as a stranger would, on an iPhone and on an iPad in compatibility mode, and every claim in the Notes is checked against what the build did | NS-38-R5, R9; E-S27; FR-CMP-03, FR-CMP-18, FR-SEC-26; none | P0 (b) | `qa`, founder | `DEVICE_TEST_PLAN.md` (ipad row: App Review often tests on iPad, citing TDD 07 D5) |
| FR-QAL-21 | Given a candidate, When it is tested, Then an upgrade from the last store build with a seeded 1,000-letter Asha book passes with drafts, pictures, a sealed letter and a waiting consent re-version intact, on the previous and new export schema | NS-45 (app update), NS-42 (re-consent), NS-36, NS-37; J-E15; none | P0 (a) | `qa` | 14 s3 ("every store candidate" row) |
| FR-QAL-22 | Given the sign-in rows (E-S05, E-S06, J-E08), When they are tested, Then CI proves every error kind on a stand-in, one separate e2e backend and a test inbox the founder controls prove the real email path (code, link, expiry, other phone), and each is labelled; no sign-in code or address of a person ever enters evidence | NS-41; E-S05, E-S06, E-S14; FR-SEC-24, FR-OPS-10; new row needed | P0 (c): a parent who cannot sign in cannot start | `qa`, `security-architect` | `apps/mobile/e2e/README.md` s1 item 3 (needs a separate Supabase project, not set up); `docs/qa/evidence/README.md` (what never goes in evidence) |
| FR-QAL-23 | Given a P0 device row, When no suitable phone is available, Then the founder may waive it in writing (14 s6) except for a lost letter or recording, a leak off the phone, a name or letter words on a lock screen, a guilt or count line, and, added here: the VoiceOver core loop (NS-33-R6), recording not shown by colour alone (NS-33-R12), the age gate and stop (NS-40) and a second account seeing the first (`[X4-R1]`) | G4; NS-33-R6, R12; NS-40; X4-R1; none | P0 (b) | founder, `qa` | 14 s6 last paragraph; founder question Q2 |
| FR-QAL-24 | Given `14` sections 5 and 8 and `docs/tdd/07`, When CI or the device plan changes, Then they are updated in the same PR (standing duty 3) | none; none; none | P1 | `qa` | charter |

P0 count in section 3f: FR-QAL-01, 02, 03, 05, 06, 07, 09, 11, 12, 15, 16, 17, 20, 21, 22, 23 = 16.

### 3g. Where the supporting plans are

The rest of the quality plan is in annexes at the end, so the seven sections stay as the brief sets them: Annex A (the 143 function rows with a proof key), B (device matrix), C (accessibility plan), D (unhappy-path lists per e2e area), E (test data), F (what runs where, who), G (exploratory charters), H (release-gate evidence G0 to G6), I (defect severity).

---

## 4. Design needs

Keyed to e2e screen ids. Design owns each; areas record "Function needs accounted for: FR-QAL-nn".

| Need | Screen or flow | Why (QAL id) |
|---|---|---|
| Add E-S01 to E-S08, E-S14, E-S24 to NS-33's walk list; draw a reading order, heading level and focus target for each state | E-S01 to E-S08, E-S14, E-S24 (E owns) | NS-33 s3 names Home, Listen, Review, the Book, the letter page, Me and Read together; first run is not named. FR-QAL-09 |
| For each error row of J-E08 (16 kinds), the string VoiceOver announces and where focus lands | E-S04, E-S05, E-S06, E-S07, E-S14 | A test needs an oracle; the table says "focus to field" for one kind only. FR-QAL-09, FR-QAL-11 |
| Selected, error and recording states shown by text or shape as well as colour on the age answer, the agreement tick and the sign-in method buttons | E-S03.default, E-S03.stop, E-S02 | NS-33-R12 is written for the recording state only; the same WCAG 1.4.1 reading applies to the age choice. Counsel must confirm any legal reading. FR-QAL-09 |
| A measured contrast pair list (text token on background token) for Home, Review, the Book, the letter page, and for each glass fallback surface | `docs/design/system/tokens.v2.json`; A 3a fallback | NS-33-R8 is a token test; it needs the pair list as data. FR-QAL-08, FR-QAL-09 |
| Undo window seconds per toast and sheet, in one table | A-S12, B-S11, B-S15, D-S19, C-S17 | NS-33-R15 and T4 tie windows to VoiceOver; a test needs the seconds. FR-QAL-09 |
| The evidence-sheet layout for the eight passes of Annex B | E-S23 | E-S23 is "Accessibility walk and speed sheet"; it needs the pass names. FR-QAL-07 |
| No design change for fixtures; test seams are never visible to a parent | none | keeps the constitution: a test control that writes or shapes words must not ship |

## 5. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| 14 s7 | Add tables 3a, 3b and 3c of this file; add the "How proven" key and an owner column; regenerate by the extended script | the register stops at card 12 |
| 14 s2 | Add two levels: Evidence (a dated record that must exist) and Process (an act no test proves), with the rule of FR-QAL-03 | 54 of 143 FR rows are E, P or include E |
| 14 s4 | Add J-N28 to J-N36 (FR-QAL-05) | card 19 has no journeys in the plan |
| 14 s5 | Replace the device table with Annex B; add Reduce Transparency and Differentiate Without Colour to the settings list; add iOS 26 glass versus fallback | the list omits both settings; design depends on them |
| 14 s6 | Add the evidence column of Annex H; add the non-waivable rows of FR-QAL-23 | `compliance.md` K-3 asks for the same column; avoid two versions |
| NS-33 s3 | Add E-S01 to E-S08, E-S14, E-S24 to the screen set | first run is where a new parent starts |
| NS-33-R6, R12 | Mark non-waivable at G4 | the core loop for a person using VoiceOver |
| NS-33-R16 | Say where the audit runs (a macOS runner nightly and on a candidate) and that "zero critical violations" is a gate | the row names a tool, not a place |
| NS-34-R7 | Propose P0 (b) from P1: "both iOS versions recorded" | iOS 17 is the lowest supported (D-098, `app.config.ts:44`) and no run on it is on record (DEVICE_TEST_PLAN: oldest "Before C1") |
| NS-10 | Add the P0 row NS-10-Rdecline (errata E9, FR-PRV-20) | the errata already says it gains one |
| NS-38 to NS-45 | Add a "How proven" key to each P0 row | lets trace and the register agree |
| `docs/tdd/07` 11.3 | Replace with Annex I, keeping S0 to S3 and the SLAs | ties severity to the constitution |

## 6. Engineering needs (backlog rows to add or change; ids from `next-id.mjs`)

| Need | Backlog | Notes |
|---|---|---|
| Rework `scripts/trace.mjs` to read the pack, FR ids, evidence paths and a ratchet (FR-QAL-02, -03) | BL-002 (change); #819 per 14 | `qa` |
| Register generator: `p0.py` or a Node port that prints 3a, 3b, 3c and the total (3e) | new row needed | `qa` |
| Asha fixture library: one module, generated data, every catalogue entry of Annex E | new row needed | extends `apps/mobile/test/helpers/` (`asha-export.ts`, `store-fixture.ts` exist; contents not read) |
| Source scans for the 40 S-kind FR rows, grouped by surface (store text, strings, routes, dependencies, flags) | new rows needed, one per surface | `packages/content/test/` has `claims-capabilities.test.ts`, `rules.test.ts` (listing); I did not read them |
| Glass fallback scan (FR-QAL-08) | new row needed | `mobile` |
| XCUITest accessibility audit target and nightly job (FR-QAL-10) | new row needed; workflow patch in `docs/ops/proposed/` | CI changes are proposed, not made |
| E2E backend project, test inbox and a first-run Maestro set rewritten to card 19's order | new row needed | existing flows E2E-01 and E2E-02 were written 3 Oct against the earlier first-run order; card 19 supersedes parts of that order. I did not read the flow bodies, so whether they still match is unknown; do not count them as coverage until checked |
| Kill at each first-run step (FR-QAL-15, J-N34) | new row needed | extends the kill harness |
| Evidence-file checker: format, Asha-only, build and iOS recorded, a "not run" status allowed | new row needed | NS-34-R3, R4 |
| Injected clock for the age stop, trial end and seals on a device build | check existing e2e seams | `apps/mobile/e2e/README.md` mentions a clock moved forward 23 h in E2E-01; seam on a device build unknown |

## 7. Founder and counsel questions, each with a default

No legal question is new in this file. Q-numbers from `COUNSEL_PACKET.md` are not cited because I did not read it this session.

| # | Question | Recommended default |
|---|---|---|
| Q1 | Which phones does the founder hold, and will he buy or borrow one on iOS 17 and one on iOS 26 or later? (14 s5: not recorded; spend is his call) | Use the SE 3 and one current phone daily (as DEVICE_TEST_PLAN says), borrow an iOS 17 phone; until a pass has a phone it is "not run" and G4 does not pass |
| Q2 | Which P0 device rows can never be waived? | The four of 14 s6 plus NS-33-R6, NS-33-R12, NS-40 age gate and stop, and `[X4-R1]` (FR-QAL-23) |
| Q3 | Does the trace ratchet block merges? (`trace.mjs` header: 07 Q8, founder) | Report only until FR-QAL-02 lands, then block only new P0 rows without proof |
| Q4 | A separate e2e Supabase project and a test inbox (a possible vendor or cost) | Founder creates one free-tier project and a mailbox he controls; no real person's address; if refused, J-N30 runs on stand-ins and the email rows stay "not run" |
| Q5 | Will the founder ask a person who uses VoiceOver daily to run NS-33-R6 before the first public build, on the Asha install only? | Yes if one can be found; this is a tester arrangement, so it needs a consent text and a number from legal; if not, `qa` and the founder run it eyes-closed with Screen Curtain (EC-10) and the row says who ran it |
| Q6 | Who may overrule a severity? | Founder, in writing, in the issue |
| Q7 | Is a nightly macOS accessibility audit worth its runner cost? | Yes, nightly only; cost UNVERIFIED (not priced here) |
| Q8 | Speech fixtures: a synthetic voice or a consenting non-family reader | A reader who has agreed in writing, or a synthetic voice whose licence allows test use; counsel must confirm either |

---


## Annex A. The 143 function rows, with reason and how proven

Keys as in section 3c. Reason is read from the row's Priority cell; where the cell gives none it reads "(see row)". One row can be proven by a test that also proves a card row.

| FR id | Reason | How proven |
|---|---|---|
| FR-CMP-01 | (b) | E |
| FR-CMP-03 | (b) | S+E |
| FR-CMP-04 | (b) | E |
| FR-CMP-05 | (b) | E |
| FR-CMP-06 | (b) | D+E |
| FR-CMP-07 | (b) | D |
| FR-CMP-11 | (b) | E |
| FR-CMP-12 | (b) | E |
| FR-CMP-13 | (b) | C |
| FR-CMP-14 | (b) | S |
| FR-CMP-15 | (b) | C+D |
| FR-CMP-16 | (a) | C+D |
| FR-CMP-17 | (b) | C |
| FR-CMP-18 | (b) | E |
| FR-CMP-19 | (b) | E |
| FR-CMP-20 | (b) | S |
| FR-DAT-01 | (b) | S |
| FR-DAT-02 | (a) | S |
| FR-DAT-03 | (a) | S |
| FR-DAT-04 | (a) | P |
| FR-DAT-05 | (a) | P |
| FR-DAT-09 | (a) | C+E |
| FR-DAT-14 | (a) | C |
| FR-DAT-20 | (a) | S |
| FR-DAT-27 | (a) | S |
| FR-DAT-32 | (a) | S |
| FR-DAT-35 | (b) | C |
| FR-FIN-02 | (a) | E |
| FR-FIN-03 | (c) | C+E |
| FR-FIN-05 | (a) | P |
| FR-FIN-09 | (b) | S |
| FR-FIN-11 | (a) | C |
| FR-FIN-22 | (b) | P |
| FR-LEG-01 | (b) | S+E |
| FR-LEG-02 | (b) | S |
| FR-LEG-03 | (a) | S |
| FR-LEG-04 | (b) | S |
| FR-LEG-06 | (a) | S |
| FR-LEG-07 | (b) | C |
| FR-LEG-08 | (b) | E |
| FR-LEG-09 | (b) | C |
| FR-LEG-10 | (b) | C |
| FR-LEG-11 | (b) | E |
| FR-LEG-12 | (b) | C |
| FR-LEG-13 | (b) | S |
| FR-LEG-15 | (b) | S |
| FR-LEG-18 | (b) | P |
| FR-LEG-20 | (b) | C |
| FR-MKT-01 | (a) (b) | S+E |
| FR-MKT-02 | (b) | S |
| FR-MKT-03 | (a) (b) | S |
| FR-MKT-05 | (a) | S |
| FR-MKT-06 | (a) (b) | S |
| FR-MKT-07 | (a) | S |
| FR-MKT-08 | (b) | S |
| FR-MKT-09 | (b) | E |
| FR-MKT-11 | (b) | S |
| FR-MKT-12 | (b) | E |
| FR-MKT-15 | (b) | E |
| FR-MKT-16 | (b) | E |
| FR-MKT-19 | (a) | C |
| FR-MKT-20 | (a) | C |
| FR-MKT-22 | (b) | S |
| FR-MKT-25 | (b) | P |
| FR-MKT-28 | (b) | S |
| FR-MKT-29 | (a) (b) | S |
| FR-MKT-32 | (a) | S |
| FR-MKT-34 | (a) | S |
| FR-OPS-03 | (a) | D+E |
| FR-OPS-06 | (b) | E |
| FR-OPS-08 | (a) | C+E |
| FR-OPS-09 | (b) | P |
| FR-OPS-10 | (c) | E |
| FR-OPS-11 | (c) | E |
| FR-OPS-14 | (a) | C+D |
| FR-OPS-15 | (a) | E |
| FR-OPS-16 | (a) | E |
| FR-OPS-17 | (a) | C |
| FR-OPS-23 | (a) | C |
| FR-OPS-24 | (a) | E |
| FR-OPS-28 | (c) | E |
| FR-OPS-31 | (a) | S |
| FR-OPS-33 | (c) | C+D |
| FR-PRV-01 | (b) | C+D |
| FR-PRV-02 | (b) | C |
| FR-PRV-06 | (b) | E |
| FR-PRV-10 | (a) | C |
| FR-PRV-11 | (a) | S |
| FR-PRV-13 | (a) | S |
| FR-PRV-14 | (a) | C+D |
| FR-PRV-15 | (a) | C+D |
| FR-PRV-16 | (a) | C+D |
| FR-PRV-17 | (a) | S+D |
| FR-PRV-18 | (b) | S |
| FR-PRV-19 | (a) | C |
| FR-PRV-20 | (a) | C(db) |
| FR-PRV-24 | (b) | C |
| FR-PRV-25 | (b) | C |
| FR-PRV-26 | (b) | C |
| FR-PRV-27 | (a) | C |
| FR-PRV-28 | (b) | C |
| FR-PRV-30 | (b) | E |
| FR-PRV-31 | (b) | C |
| FR-PRV-33 | (b) | D |
| FR-PRV-34 | (a) | C+D |
| FR-SEC-01 | (a) | C+D |
| FR-SEC-02 | (a) | C |
| FR-SEC-03 | (a) | C |
| FR-SEC-04 | (a) | C |
| FR-SEC-21 | (a) | C+D |
| FR-SEC-22 | (a) | D |
| FR-SEC-23 | (a) | C |
| FR-SEC-16 | (a) | C |
| FR-SEC-18 | (a) | C |
| FR-SEC-24 | (b) | E |
| FR-SEC-26 | (b) | E |
| FR-RSK-02 | (b) | P |
| FR-RSK-03 | (b) | S |
| FR-RSK-04 | (b) | E |
| FR-RSK-06 | (a) | C |
| FR-SUP-01 | (b) | C+D |
| FR-SUP-03 | (a) | C |
| FR-SUP-04 | (b) | E |
| FR-SUP-05 | (a) | S |
| FR-SUP-07 | (b) | E |
| FR-SUP-09 | (a) | S |
| FR-SUP-10 | (a) | E |
| FR-SUP-11 | (a) | S |
| FR-SUP-12 | (a) (b) | S |
| FR-SUP-14 | (b) | S |
| FR-SUP-15 | (b) | E |
| FR-SUP-16 | (a) | E |
| FR-SUP-17 | (a) | C+D |
| FR-SUP-21 | (a) | S |
| FR-SUP-23 | (b) | E |
| FR-POL-02 | (b) | P |
| FR-POL-03 | (b) | P |
| FR-POL-04 | (a) (b) | P |
| FR-POL-05 | (a) | S |
| FR-POL-06 | (b) | P |
| FR-POL-07 | (b) | S |
| FR-POL-12 | (a) | E |
| FR-POL-13 | (b) | E |

## Annex B. Device matrix

Source lists: `14` section 5 and `DEVICE_TEST_PLAN.md:40-54`. They differ; this one replaces both if Karma rules so. Phones the founder holds are not recorded (14 s5); every row says what it needs, not that it exists. Device evidence never touches real family data (14 s5 ruling, D13): a separate install on a test account holding only the Asha book.

### B.1 Phones

| Tag | Phone | Why | Notes |
|---|---|---|---|
| se3 | iPhone SE (3rd generation), newest iOS it takes | smallest screen, slowest chip we support, reference for NS-34 and NS-37 budgets | DEVICE_TEST_PLAN: "Yes, session 1" |
| old17 | any phone on the lowest iOS we ship to (17.x; `IOS_DEPLOYMENT_TARGET = '17.0'`, `app.config.ts:44`) | oldest supported system; an SE 3 on the newest iOS does not cover it | DEVICE_TEST_PLAN: "Before C1". Which phones can run iOS 17: UNVERIFIED, check Apple's list |
| cur26 | a current large iPhone on iOS 26 or later (glass) | largest layout, glass surfaces, newest system behaviour | DEVICE_TEST_PLAN says the newest iOS is 27, marked (A), UNVERIFIED. Glass applies "iOS 26 and later" per area A 3a (the rule says "iOS before 26" falls back) |
| second | a second phone on the same account | sync, new phone, seals across zones, let go on a second phone | |
| ipad | any iPad, iPhone app in compatibility mode (`supportsTablet: false` per DEVICE_TEST_PLAN) | App Review runs it there | |
| sim | simulators on iOS 17 and latest, SE 3 and a large model, on `macos-26` runners | layout, Dynamic Type, Maestro flows, XCUITest audit | which runtimes are installed on the runner: UNVERIFIED. Simulators cannot show haptics, real audio routes, notifications timing, Low Power Mode, share-sheet destinations; those rows stay device rows |

### B.2 The eight passes

A pass is a phone and a set of settings. Each pass walks the screen set below. This is a deliberate subset of every combination; a bug that needs two settings at once is found by charter EC-11 or EC-14, not by the passes.

| Pass | Phone | Settings on | Purpose | Rows it carries |
|---|---|---|---|---|
| P1 baseline | se3 | none, light mode | the budgets and the happy path on the small phone | NS-34, NS-37, J-N13, J-E01 |
| P2 largest text | se3 | largest accessibility text size (AX5) with Bold Text | no control under 44 pt, nothing truncated | NS-33-R4, R7, R14 |
| P3 screen reader | se3 | VoiceOver (then Voice Control, then Switch Control), dark mode | the core loop with no sighted help | NS-33-R1 to R3, R6, R9, R10, R15, J-N12, J-N20 |
| P4 calm system | cur26 | Reduce Motion, Reduce Transparency, Increase Contrast, Differentiate Without Colour, Smart Invert, then dark mode | solid fallback for glass, no moving loop, contrast, colour not alone, pictures not inverted | NS-33-R5, R8, R11, R12, FR-QAL-08, J-N15 |
| P5 oldest system | old17 | default, then Low Power Mode, then AX3 | launch, glass fallback by system version, Control Center control absent (A-U58), purchase sheet | NS-34-R7, FR-QAL-08, J-E22, S1-14 |
| P6 two phones | se3 plus second (and cur26) | two time zones, one across a DST change (Annex E.5) | sync, new phone, seals, reminders across zones | J-N2, J-N5, J-N14, J-N33, J-E17 |
| P7 offline and low | se3 | airplane mode, then low storage, then Low Power Mode, then notifications off | everyday offline, no leak in Find, storage lines, reminders off | J-N10, J-E12, J-E16, J-E24, S1-14 |
| P8 reviewer | ipad and se3, clean install | default | App Review's view (FR-QAL-20) | NS-38-R5, FR-QAL-20 |

Dark mode (E-S21 Appearance), Low Power Mode and small screens are in the passes: dark in P3 and P4, Low Power in P5 and P7, small screen in P1 to P3 and P7. Landscape: not in the passes; whether the app allows it was not read, UNVERIFIED.

### B.3 Screen set walked in every pass

Home (A-S01), Listen (A-S04, A-S05), Review (A-S07), Write (A-S06), the Book (B-S01), the letter page (B-S08), Me (C-S01), Read together (B-S19), plus the first-run screens E-S01 to E-S08, E-S14, E-S10 and E-S26 (added; see section 4). P2 and P3 also walk the sheets that open from these.

## Annex C. Accessibility test plan

Standard: WCAG 2.2 AA per NS-33 section 8 and LEGAL-REQ-051 (via `compliance.md` FR-CMP-07; I did not re-read the law). Nothing here is legal advice; counsel must confirm any claim made to the public from it. Apple's Accessibility Nutrition Labels are covered by FR-CMP-06; the labels may claim a feature only after its row passes here.

### C.1 Row by row

| NS-33 row | What proves it | Where | Who | Automated part |
|---|---|---|---|---|
| R1 letter page heading is level 1 | unit on the component tree, then VoiceOver heading rotor | CI, P3 | `mobile`, `qa` | yes |
| R2 Me heading equals tab label | unit | CI | `mobile` | yes |
| R3 lens is one choice, announced with the selected one | unit on role and state, then VoiceOver | CI, P3 | `mobile`, `qa` | partly |
| R4 AX5 on SE 3: no control under 44 pt, no truncation | device walk | P2 (simulator may pre-check layout) | `qa` | no |
| R5 Reduce Motion: no moving loop | source scan for loops without a Reduce Motion branch, then device | CI, P4 | `qa` | partly |
| R6 VoiceOver core loop, start and stop announced within 1 s | device, timed | P3 | `qa`; Q5 outside tester | no |
| R7 AX5 with Bold Text | device walk | P2 | `qa` | no |
| R8 contrast 4.5:1 under Increase Contrast | token test, then device | CI, P4 | `qa` | yes (tokens) |
| R9 Voice Control: each visible label works as a command | device, one command per label | P3 | `qa` | no |
| R10 Switch Control reaches every control | device, item scanning | P3 | `qa` | no |
| R11 Smart Invert ignores pictures (P1 row) | device | P4 | `qa` | no |
| R12 recording state by text and shape, not colour alone | source scan of the recording state plus device with Differentiate Without Colour | CI, P4 | `qa` | partly |
| R13 Large Content Viewer on tab bar (P1) | device | P2 | `qa` | no |
| R14 Bold Text on Mukta, Literata, Tiro (P1; errata E17 rewrites it as a face per role) | token test plus device | CI, P2 | `qa` | partly |
| R15 undo windows wait for VoiceOver | unit with an injected clock and a stubbed announcement finish; device with Switch Control | CI, P3 | `mobile` | yes |
| R16 `performAccessibilityAudit()` at AX5, zero critical | XCUITest on each screen | macOS runner nightly (FR-QAL-10), P2 | `qa` | yes |

### C.2 Per-screen checklist (run for every screen in Annex B.3)

1. A heading exists and its level is right; reading order matches visual order.
2. Every control has a name, a role and a state; the spoken name equals the visible label (Voice Control).
3. Targets: 44 pt minimum, 56 pt primary, 64 pt capture (NS-33 section 8).
4. At AX5 plus Bold Text: no truncation; a sentence-long action moves into the content (C 3: "At AX3 and above... pinned in the bottom third").
5. Error and state changes are announced, and focus goes to the field (J-E08 names one kind as "focus to field"; the rest need defining, section 4).
6. Undo and timed lines wait for VoiceOver to finish (R15).
7. No state is shown by colour alone.
8. Contrast holds in light, dark and Increase Contrast, and on the glass fallback surface.
9. Reduce Motion: nothing loops; Reduce Transparency: solid surfaces.
10. Letter words carry `accessibilityLanguage` for a non-English take (NS-33 section 8).
11. No label carries a child's name beyond what the screen already shows, and no label is logged (NS-33 section 8, privacy).
12. A recording is never started by any assistive gesture without the parent's tap (Siri phrase opens Ready only: A-U56).

### C.3 What I could not check

Whether the Book or Home has a testID for each control (e2e README s1 says screens set almost none on 15 Oct; I did not recount), and whether any XCUITest target exists. UNVERIFIED.

## Annex D. Unhappy-path test lists, per e2e area

Rule: a case in a "P0" row below needs a test title or a run-sheet row that carries its id. P0 here means the case maps to a P0 card row (core loop, loss, wrong person, leak, consent, plan). Everything else is P1 and reported by trace, not blocked (FR-QAL-11).

### D.1 Area A, capture (A-U01 to A-U62 read in full)

| Case ids | Case | Proof | Priority |
|---|---|---|---|
| A-U05, A-U06, A-U07 | microphone denied; busy; phone full at start (no draft is created) | C + P7 device | P0 |
| A-U08, A-U09, A-U10 | call or alarm mid-take; app to background; app killed: the take is kept | C + FR-QAL-15 + device | P0 |
| A-U11, A-U12 | words not ready states; Keep did not save: "Your words are still here" | C | P0 |
| A-U13, A-U14 | cancel in the picker; Back or Close before speaking: nothing written, temporary copy deleted | C | P0 |
| A-U15, A-U16, A-U17, A-U18 | picture cannot open; iCloud-only offline; phone too full; picture and no words | C + P7 | P0 |
| A-U19, A-U20 | second picture confirm; Let it go with a picture | C | P0 |
| A-U21, A-U22, A-U23 | pick lands under App lock; kill after the pick; interruption on Ready | C | P0 |
| A-U28, A-U31 | switch with a draft waiting keeps its child; second account resets selection | C (`[X4-R1]`) | P0 |
| A-U36 | "last Thursday" in the words changes nothing; a picture's file date is never used | C (constitution: no machine meaning) | P0 |
| A-U39, A-U44, A-U46 | From over 30 code points; language the build lacks waits and is never sent to the recogniser; recording kept without words does not count | C | P0 |
| A-U48, A-U49, A-U50, A-U51 | file will not delete; stuck after 3 launches; offline delete; interrupted after confirm | C + device | P0 |
| A-U52 to A-U57 | doorway: second start refused; locked; first run not done; no book; Siri mishears opens Ready, never records; doorway fails | C + P8 | P0 (A-U56 recording never starts by a phrase) |
| A-U59, A-U60, A-U61, A-U62 | offline and kill switch; plan lapsed; low storage; update with a draft waiting | C + P7 + FR-QAL-21 | P0 |
| the other 28 (A-U01 to A-U04, A-U24, A-U25, A-U26, A-U27, A-U29, A-U30, A-U32 to A-U35, A-U37, A-U38, A-U40 to A-U43, A-U45, A-U47, A-U58) | arrival, mode changes, flag off, one book, hidden book, dates, signature after Keep | C | P1 |

### D.2 Area B, book and reading (journey unhappy lines read in truncated form; `qa` completes from the full file)

| Case | Proof | Priority |
|---|---|---|
| typed letter has no Play and no recording row; other parent's letter is read-only; words still being made (B-S08) | C | P1 |
| day sheet cancel or kill: nothing changes; failed write keeps the old day (B-S09) | C | P0 (a word or date must not change silently) |
| delete: Keep it changes nothing; sealed letter confirm; Recently deleted sealed row shows the day and no words (B-S15, B-S22) | C + device | P0 (loss, seal) |
| failed Quiet write keeps old state; hidden book opens read-only (B-S02, B-S01.hiddenReadOnly) | C | P0 (quiet is a loss case, J-N19) |
| picture add, replace, take off with Undo; picture follows a delete and a restore (J-N9) | C + device | P0 |
| Find: Back keeps the search; hidden letter not found; airplane mode (J-N10) | C + P7 | P0 (leak) |
| Read together: end of year, end of book, plan lapsed still plays (J-N25) | C | P0 |

### D.3 Area C, keeping and trust (journey list read; unhappy lines read in part)

| Case | Proof | Priority |
|---|---|---|
| Save a copy: some recordings elsewhere (no count of the absent ones, U10), phone too full for the printable book (C-S05.error-print_pdf_disk_full), export round trip | C + device | P0 |
| sign out with backup off, the book stays (J-C04, J-N21) | C + device | P0 |
| second account (J-C05) and a new phone (J-C06): consent outstanding, no page claims a recording is here | C + two phones | P0 |
| Erase everything on this phone fails midway (C-S19) | C + FR-QAL-15 | P0 |
| Delete account with a sealed letter (J-C08, D6) | C + db | P0 |
| Recently deleted, Quiet, Hide, Delete this book (J-C10, J-C11, J-C15) | C | P0 for the delete paths, P1 otherwise |
| Earlier versions (J-C09, flag) | C | P1 until the flag is on |

### D.4 Area D, family, sharing, reminders (screen state inventory read; J-D32 heading read)

| Case | Proof | Priority |
|---|---|---|
| Share: absent for another parent's letter, a sealed letter, a quiet book, no words (D-S01.absent); temp write failed (D-S02.error); shared text equals the wrapper byte for byte (J-N11) | C + device | P0 |
| Reminders: permission denied, schedule failed, typed day errors (empty, past, too long), no name on the lock screen, quiet delivery (D-S04 to D-S10, J-N24, J-N26) | C + P7 + device | P0 |
| Invite and join: full, paused, offline, error codes, other device, missing token, signed out, no sign-off, slow arrival, undo errors (D-S13 to D-S19, J-D32) | C + two phones | P0 for any state that shows another person's data; P1 otherwise |
| Pilot artefacts (D-S23): process, not app screens | P | P0 (process) |

### D.5 Area E, foundations and system states (J-E01 to J-E25 and the J-E08 table read)

| Case | Proof | Priority |
|---|---|---|
| 16 sign-in error kinds of J-E08, one assertion each: where it shows and the way forward | C + stand-in; real email on the e2e backend | P0 for `wrong_code`, `rate_limited`, `expired`, `other_phone`, `session_expired`, `under_18`; P1 for `cancelled`, `provider`, `invalid_email` |
| under 18 and 24 h stop (J-E07) | C with injected clock | P0 |
| sign-in unreachable, offline, local start (J-E03, J-E04) | C + P7 | P0 |
| consent outstanding at relaunch (J-E06) | C | P0 |
| kill switch and remote pause at sign-in and in use (J-E09, J-E14, E-ST05 to E-ST22) | C (`.killSwitch` states, FR-RSK-06) | P0 |
| third letter gate, plan lapse, trial and reminder same day (J-E10, J-E11, J-N27) | C | P0 |
| service outage signed in; restricted project looks like an outage not a loss (J-E13, FR-OPS-14) | C + device | P0 |
| app update line; forced sign-out (J-E15, J-E21) | C | P0 for J-E21; P1 for J-E15 |
| low storage (J-E16); interruption and kill (J-E18); something broke (J-E19); a link the app does not have (J-E20) | C + device | P0 for J-E18; P1 for the others |
| appearance, App lock, notifications off (J-E22, J-E23, J-E24) | C + device | P0 for J-E23 (App lock hides content); P1 for J-E22 |

## Annex E. Test data (Asha only)

### E.1 Rules

- The only family is Asha (with Avi, Mama, Papa as in `docs/qa/evidence/README.md`). No real name, letter, picture, voice, address, sign-in code or token appears in code, fixtures, run sheets, screenshots, recordings, logs or defect reports (CLAUDE.md privacy rules, 14 s5).
- Fixtures are generated from a seed and a fixed clock, not exported from anyone's phone.
- `packages/content/test/no-real-family-data.test.ts` stores hashes of the real details; it runs on every PR that adds evidence (14 s5).
- Screenshots and recordings are not committed (`docs/qa/evidence/README.md`); evidence files name them.

### E.2 The catalogue (to be built as one library; FR-QAL-12)

| Fixture | Content | Used by |
|---|---|---|
| asha-one | one book, born on a fixed fictional date, 12 letters over 6 months, 2 with a picture, 1 first, 1 sealed | most journeys |
| asha-twins | two books with names, then two books with no names (A-U27) | E2E-02, J-N6, A-S02 |
| asha-due | a book with a due date only, reminders on (J-N26) | NS-13, NS-18 |
| asha-1000 | 1,000 letters and 300 pictures (14 s3) | J-N13, NS-37, upgrade test |
| asha-big-db | 100,000 entries on a pull request, 400,000 nightly (`ci.yml:68` comment, `nightly.yml`) | database performance |
| asha-lapsed | plan lapsed: past letters open, play, found, in Save a copy, in Read the year back | J-N25 |
| asha-second | a second fictional account, "Mama" and "Papa" books, for `[X4-R1]` | J-N33, J-E17 |
| asha-sealed | sealed letters opening at one instant across two zones | J-N14 |
| asha-words | Devanagari and long grapheme sequences (errata E10 to E12); 140 and 60 grapheme limits; Arabic for right to left | NS-01, NS-16, NS-33 |
| asha-language | a take in a language the build does not offer | J-N16, J-N23 |
| asha-canary | canary strings that must never appear outside the app (J-N18) | FR-QAL-06 |
| asha-demo | the App Review demo account, only the Asha book (FR-SEC-26) | P8 |
| asha-edges | born today; leap-day birth; two children born the same day; a date before birth ("Before You") | age math, A-U32 |

### E.3 Pictures and voices

- Pictures: licensed or illustrated images only, no real child (NS-01-R62, FR-MKT-12).
- Voices: for tests that need speech, a person outside the family who has agreed in writing to be recorded for tests, or a synthetic voice whose licence allows it; counsel must confirm either. For non-speech tests (kill, storage, interruptions) use generated tones and silence.

### E.4 Accounts and mail

- Test accounts use an address on a domain the founder controls, never a real person's address. A catch-all test inbox holds sign-in mail; codes and links never go into evidence (`docs/qa/evidence/README.md`).
- A separate e2e backend (e2e README s1 item 3) is needed for sign-in, invite and deletion flows; none exists yet.

### E.5 Clocks and zones

- Every time test injects a clock (FR-QAL-13). Zone set: one zone behind UTC, one ahead, one with a half-hour offset; DST ends Sunday 1 Nov 2026 and starts Sunday 14 Mar 2027 in the United States (my calendar arithmetic, not a source read; check before use).
- The app is offered in the United States only (NS-38-R1), so zone variety tests behaviour of a traveller, not a second market.

## Annex F. What runs in CI, what needs a device, and who runs it

| Check | Where | Who | When | Notes |
|---|---|---|---|---|
| Unit and integration on Asha fixtures, content rules, source scans, typecheck | CI (`ci.yml`: content rules plus `npm test`, `npm run test:db`, typecheck, in parallel) | the engineer; `qa` reviews | every PR | `test:db` when `supabase/**` changes; `test:functions` when functions change (14 s3) |
| Trace ratchet | CI | `qa` | every PR once FR-QAL-02 lands | new job, patch in `docs/ops/proposed/` |
| Verifier fuzz | CI with fixed seed; nightly with a random seed (`nightly.yml:52`) | `qa` | every PR; nightly | replay with the printed seed and runs |
| Database performance budgets | nightly (400,000) and PR (100,000) | `data-architect` | as stated | policy tests are the data architect's |
| Kill harness | `kill-harness.yml` (macOS and Ubuntu jobs) | `qa` | merge to develop: 50 runs; candidate: 500 | FR-QAL-15 |
| Simulator flows (Maestro) | macOS runner | `qa` | merge to develop | only the flows without `needs-backend` run offline; first-run flows need the rewrite in section 6 |
| XCUITest audit | macOS runner | `qa` | nightly and candidate | FR-QAL-10; target not verified to exist |
| Device P0 rows (Annex B passes) | founder's phones | founder with `qa`'s sheet | every candidate; monthly full plan | evidence files; Asha install only |
| Store-record, label and Notes for Review checks | records | `compliance-engineer`, `qa` reads | every candidate | gate record (FR-CMP-11) |
| Exploratory charters | phones | someone other than the author | every candidate | Annex G |
| Counsel reads, founder word approval | process | founder, counsel | before the flag turns on | G2, G3; no test |

Budget: CI stays under 10 minutes end to end (`ci.yml:1-4`). Split a slow job rather than raise a timeout. Proposed changes are written as patches under `docs/ops/proposed/` and flagged for the founder; the Claude GitHub App cannot edit `.github/workflows/`.

## Annex G. Exploratory test charters

Each is 45 minutes, on the Asha install, run once per candidate by someone other than the author. Oracle for every charter: the constitution (the machine may remove and repair, never add meaning) and the "Never" lines of the card under test. Notes go in the evidence file; findings use Annex I.

| Id | Charter (explore ... with ... to discover ...) | Cards |
|---|---|---|
| EC-01 | the loss of a letter with kills, a full phone, a dropped call, a headphone unplug and a locked screen, to discover any path that loses or doubles a take | NS-09; A-U05 to A-U12 |
| EC-02 | the words with the Review editor, fixes and Undo, another language, a typed day and a picture's words, to discover any word the product added or changed | NS-16, NS-17; constitution |
| EC-03 | account and phone changes with a second account, a new phone, an invite, a share and a lock screen, to discover anyone who sees what they should not | `[X4-R1]`, NS-10, NS-25, NS-32 |
| EC-04 | what leaves the phone with airplane mode, a proxy and the canary strings through Find, share, pictures and sign-in, to discover a leak | J-N18; NS-02 |
| EC-05 | every string over a week of simulated time with reminders on and the phone ignored, to discover a count, a streak, a guilt or a fear line | NS-13, NS-32; J-N4, J-N17 |
| EC-06 | first run as a hostile parent: age No, back, kill at each step, offline at each step, wrong code, expired link, Apple closed, to discover a way to the book without the agreement or a way to get stuck | NS-39 to NS-43; J-E01 to J-E08 |
| EC-07 | the plan with the third Keep, a trial ending, a refund, Family Sharing and Restore purchases in the sandbox, to discover a gate in the wrong place or a plan notice that never arrives | NS-44, NS-32; J-N22, J-N25, J-N27; AL-09 |
| EC-08 | time with a zone change, a DST change and the clock set back, to discover an early seal or a night reminder | NS-06, NS-13; J-N5, J-N14; DL-04 |
| EC-09 | the big book with 1,000 letters, search, export and Erase everything, to discover slowness or an export that omits a letter | NS-37; J-N13 |
| EC-10 | the core loop with VoiceOver and Screen Curtain on, eyes closed, to discover a step a blind parent cannot finish | NS-33-R6; J-N20 |
| EC-11 | each screen at AX5 plus Bold Text plus dark mode plus Reduce Transparency together, to discover truncation or unreadable glass | NS-33; Annex B |
| EC-12 | the recorder with calls, Siri, an alarm, a Bluetooth route change and low storage, to discover a take that stops without being kept | S1-12, S1-14, S1-40 |
| EC-13 | outages with servers off, a paused project, a kill switch per surface and a returning connection, to discover a state that looks like loss | NS-08, NS-10; J-E09, J-E13, J-E14 |
| EC-14 | App Review's path as a stranger with the demo account on an iPhone and an iPad, to discover a sentence in the Notes that the build does not make true | NS-38-R5; FR-QAL-20 |
| EC-15 | delete, erase and undo with sealed letters, pictures and Recently deleted, to discover data left behind or deleted too early | NS-36, NS-45; J-C07, J-C08, J-C11 |
| EC-16 | every new string read aloud against `VOICE.md` and the content rules, to discover copy a rule test cannot catch (tone, a hidden count) | J-N17; `packages/content` rules |

## Annex H. Release-gate evidence, G0 to G6

Gates are defined in `14` section 6. The gate record is `docs/legal/evidence/store/<version>-<build>/gates.md` (FR-CMP-11, which this file does not duplicate). Each line there names the file below. A gate with a missing artifact is not passed.

| Gate | Artifact | Produced by | Pass line | Fails when |
|---|---|---|---|---|
| G0 trace sees NS ids; every P0 has a test and a backlog row | trace report of the pack (generated), list of P0 ids with neither a test title nor an evidence path, list with no backlog row | `qa` | both lists empty, apart from rows the founder has waived in writing (none waivable for the four never-waive classes) | any NS, NX or FR P0 id is unseen by trace; any E or P row lacks a dated file |
| G1 on-device data rules (ADR 0028, #797) and the export schema they need are merged | merge commit ids; export schema version and its one-way test | `data-architect`, `qa` reads | merged; `export/schema.ts` one-way rule green (errata E5) | a flag turns on whose export minor is unallocated |
| G2 counsel reads each card names | dated counsel answers per number, listed in the gate record | `legal` | each card's gating read answered for its flag (FR-CMP-12) | a flag is on whose read is open |
| G3 the founder has approved the words | the founder's approval, by PR or `DECISIONS.md` entry, naming the strings or keys | founder | present per card | a string ships that is not approved |
| G4 every P0 device row passes on the candidate | evidence files for P1 to P8 (Annex B), kill-harness results (50 and 500), accessibility audit result, exploratory notes, waivers in the build record | `qa`, founder | no "fail"; every "not run" is waived in writing, never for the four classes or those of FR-QAL-23; no open S0 or S1 (TDD 07 G4) | a P0 row is fail or silently absent |
| G5 privacy label and claims match what the build sends | label diff against the binary, `preflight-production.mjs` output, Notes for Review check, store text scan (FR-CMP-03, -05, FR-PRV-30) | `privacy`, `compliance-engineer` | zero differences | any difference |
| G6 no `production` flag on while its card has an open P0 | `preflight-production.mjs` output listing flags on and open P0 ids from trace (FR-OPS-23) | `qa`, ops | none on with open P0 | any |

## Annex I. Defect severity scheme

Builds on `docs/tdd/07-quality-test-strategy.md` 11.3 (S0 to S3 and their SLAs, lines 597 to 603), which stays. This adds the constitution as the S0 test and the card 19 examples. `qa` assigns severity; the author of the code cannot lower it; the founder may overrule in writing in the issue (Q6).

| Severity | The test | Examples (Asha only) | Effect |
|---|---|---|---|
| S0 | The constitution or a promise is broken, or something private left or reached the wrong person | the machine added or changed meaning, or an edit skipped `verifyEdits`; `raw_transcript` changed; a letter, recording or picture lost, doubled or silently changed; Erase or delete left data behind, or ran when not asked; L3 or L4 data in analytics, a log, a URL, a crash report or a lock-screen notification; a child's name or letter words on a lock screen; account B sees account A's book (`[X4-R1]`); a sealed letter opened early; consent bypassed or an agreement not recorded; the age gate passed by a No; anything made for a person under 18; the app writes, rewrites or "shapes" words | stop; pull the build or use the kill switch within 24 hours; written review (TDD 07 11.3) |
| S1 | A P0 flow is blocked, or a rule about money or tone is broken, or a claim is untrue | cannot sign in, record, Keep or open the book; a crash loop; the Keep gate in the wrong place (past letters locked); a guilt, count, streak or fear line shown; a wrong plan notice; a store or website sentence the build does not make true; a VoiceOver user cannot finish the core loop (NS-33-R6); export fails | fix in the next build; blocks any store build (G4) |
| S2 | A flow is degraded with a workaround | slow past a budget with the feature still usable; an accessibility failure on a P0 screen that does not stop the core loop (TDD 07 11.3 makes these block G4); a wrong state after an offline round trip that heals on sync | scheduled within 2 weeks |
| S3 | Cosmetic, copy, P1 polish | spacing, an icon, a tooltip | backlog |

Rules.

1. A failing P0 test on `develop` is the severity of the harm its row names, not S3 by default. The register's reason letter guides: (a) usually S0 or S1, (b) S1, (c) S1.
2. A promise broken in public text (store, website, Notes for Review) is S1 until corrected, S0 if it says a recording is here when it is not, or that nothing leaves the phone when something does.
3. Reports hold no letter text, no child's real name, no screenshot of a letter (TDD 07 11.3, line 605); reproductions use Asha fixtures, and a fuzz failure carries its seed and run count.
4. An escaped S0 or S1 gets a short review: which layer should have caught it and the test that now does (TDD 07, line 528).
5. A defect found by a parent, a tester or support is labelled the same way; support may raise but not lower a severity (`support` role: pointer only, FR-SUP rows not restated).

---

## Totals

- P0 rows in the register before this file: 296. Named here: 96 (card 19) + 1 (errata) + 143 (function) + 16 (QAL) = 256; 552 in all.
- QAL requirements: 24 (16 P0, 8 P1).
- Annex A proof kinds: 92 rows with a CI part, 19 with a device part, 46 record or process only (rows can be counted twice).
- Design needs: 7. Card changes: 12. Engineering needs: 10. Questions: 8.

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `26-founder-direction-photos-library-and-media.md`. Cards NS-51 "Photo moments" and NS-52 "Pictures and videos with a letter" are now in `27-photo-moments-and-media.md` (NS-51-R1 to R42; I read it after drafting, so rows are aligned to it where an "Aligned" note says so), so rows are named by class and the exact `NS-51-Rn` and `NS-52-Rn` ids are for `qa` to bind when the cards land. Existing coverage is cited by id and not repeated: NS-01 (R6, R8, R13a, R13b, R16a to c, R17a to c, R27, R29, R36, R45, R46, R51, R56, R62), NS-49 (R5, R6, R10, R13, R19, R25, R28, R31), FR-QAL-02, 03, 07, 12, 13, 15, 19, Annex B, E.3. Nothing was run; no outside source read; Apple behaviour named below is UNVERIFIED. I am a Claude role.

### C.1 P0 register additions (classes; each new P0 row of the two cards needs a "How proven" key per FR-QAL-01)

| Class | Proof key | Notes |
|---|---|---|
| No library read before the parent opts in; no read at first run; no read with the flag off | C + S | Extends NS-49-R25, which today forbids any usage string and any library call in the 1.x line: NS-51-R2 and R32 already say the string exists exactly when the flag is on and a release profile fails if it enables the flag early; the NS-49-R25 wording should point to them |
| Nothing leaves the phone: network fake sees 0 requests for scanning, moments, attach and view; a picture or video leaves only by the parent's own share or sync decision (X2, E23) | C | Pattern NS-49-R33 |
| No machine words about media (strings, keys, logs, VoiceOver) | S | FR-AIS-57 to 61 |
| Words byte-identical after any media change | C | FR-AIS-64; NS-01-R8 extended to video and several items |
| Metadata stripped on every stored copy and every share, video included | C + D | NS-01-R6 covers still images; video container metadata (location, creation time, device) is new and UNVERIFIED how the platform exposes it |
| Erase, delete, Recently deleted and let-go handle every media file, file first then row, no orphan | C | NS-01-R16a to c, R36 extended; add video and "several per letter" |
| Second account never sees the first account's media or moments (X4-R1) | C + D | NS-01-R29 extended |
| App lock and switcher: no picture, no video poster frame, no player visible | D | NS-01-R13a, R13b extended; video player and poster are new surfaces |
| Log canary: a canary filename, album, place and date through the module leave 0 hits in logs, crash payloads, analytics, URLs | C | NS-49-R24 pattern |
| Limited library works exactly as full for every P0 path; a denied or restricted state prompts nothing and nags nothing | C + D | NS-49-R25 pattern (library authorisation states are a device fact) |
| A video or picture that fails to attach, decode, transcode or download leaves the letter whole | C + D | NS-01-R17a pattern |
| Backup: stored media files are not excluded from the iPhone backup, unless the founder rules otherwise (Q9 below) | D | NS-01-R27 |
| Entitlement or plist: permission strings present only where the flag is on; exact text counsel read | S + E | NS-49-R15 pattern |
| Where-it-lives and privacy-label lines true of the build | E | G5; FR-PRV rows |

### C.2 Requirements (continue FR-QAL-25 onward)

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-QAL-25 | Given NS-51 and NS-52 are locked, When `14-test-plan.md` section 7 is regenerated, Then every P0 row of the two cards carries a "How proven" key and an owner, the classes of C.1 each map to at least one row or the card says why not, and the new P0 count is printed (do not publish a stale total, K16) | NS-51; NS-52; FR-QAL-01; none; new row needed | P0 (a) | `qa` | C.1 |
| FR-QAL-26 | Given a store candidate with the moments or media flags on, When G4 runs, Then the device matrix of Annex B gains the passes in C.3, each naming phone, iOS, build and settings, and a pass with no phone is "not run" and G4 does not pass for that feature (its flag stays off) | NS-51; NS-52; FR-QAL-07, 23; NS-49-R28 | P0 (c): launch crash or media loss | `qa`; founder owns phones | C.3 |
| FR-QAL-27 | Given the content and code rules, When CI runs, Then: (a) keys under the moments and media families are in the content-rules scope and the notification scope where they can reach a lock screen (the drift test of ns46-50 qa F-01 covers them); (b) a scan fails on a picture-derived word in any parent-facing string by template: the invitation renders only from allowed slots (day word, date, `{child}` when names are on); (c) code scans fail on Vision, VisionKit, Core ML, OCR, face, scene, speech-recognition on media, audio-track extraction, reads of filename, album title, place and caption fields, and on a module named `suggest`, `classif`, `caption`; (d) each regex has a positive and a negative self-test (rules.test.ts pattern); (e) the red-team cases RT-1 to RT-10 of the AI addendum run as tests | NS-51; NS-52; FR-AIS-57 to 61, 66; NS-48-R28 (proposed) | P0 (a) | `qa`; `content`; `speech` | ai-and-speech A.2 |
| FR-QAL-28 | Given media tests, Then fixtures are generated and shared by one module: an Asha media library (illustrated or generated images, generated videos with a tone, seeded dates), never copied from a phone and never a real or photoreal face (no real child). Catalogue entries (C.4) join Annex E.2. Tests through a stand-in boundary say `(stand-in)` in the title and the row stays "partly built" until a device row passes (NS-49-R31 rule) | NS-51; NS-52; FR-QAL-12; FR-RSH-31 | P0 (a): no real family data | `qa`; `mobile` | Annex E.1 to E.3 |
| FR-QAL-29 | Given the P0 rows that lose or leak media (delete, erase, backup, restore, second account, share leaving the phone, a video or picture seen while locked), Then they are non-waivable at G4 (extends FR-QAL-23) | NS-51; NS-52; FR-QAL-23 | P0 (a) | `qa`; founder | FR-QAL-23 list |
| FR-QAL-30 | Given the 10 minute PR budget (FR-QAL-19), Then video encode, large-file and 1,000-letter media tests run on the candidate job and nightly, not every PR; the pure logic (moments function, validators, scans) runs on every PR | NS-52; FR-QAL-19 | P1 | `qa`; `ops` | FR-QAL-10 pattern |
| FR-QAL-31 | Given exploratory charters (Annex G), Then add: "my pictures are missing" (delete, restore, new phone, backup off, optimised storage), "wrong person" (second account, shared device, a picture on the other parent's phone), "a moment I did not want" (a day I would rather not see), and "a very large video" | NS-51; NS-52; FR-QAL-18; support macros | P1 | `qa`; `support` | Annex G |

### C.3 Device matrix additions (extends Annex B; passes continue P9)

| Pass | Phone and settings | What it proves |
|---|---|---|
| P9 library states | se3 and cur26. Library authorisation: not determined, full, limited, denied, restricted (parental controls or management; UNVERIFIED how to set on a test phone). Change the limited selection in Settings while the app runs and while it is closed | Moments and attach behave the same for limited and full; denied shows no nag; changes picked up |
| P10 oldest system | old17 on iOS 17.0, 17.1, 17.2 and a 26 phone (NS-49-R28 pattern) | Launch and core loop with the media modules present; any iOS-gated API absent, not greyed. 17.0 and 17.1 are separate rows because behaviour may differ (UNVERIFIED) |
| P11 iCloud originals | se3 with Optimise Storage on, originals in iCloud, then offline, then slow network | Attach triggers a download with progress and Cancel (NS-01-R17b pattern); offline ends calmly (R46); a moment's pictures not local do not hang the list |
| P12 large and odd media | se3, Low Power Mode, low storage, thermal: a video at the largest size and length the cap allows; HEVC, HDR, slow motion, cinematic, Live Photo, HEIC, burst, panorama, screenshot, a shared-album item; rotation metadata; no audio track | No jank, no kill, no orphan; storage line, not a crash (NS-01-R45); memory peak recorded; kill harness at each step (FR-QAL-15) |
| P13 interruptions | Call, alarm, app switch, kill mid-attach and mid-encode, update mid-attach | No partial file; draft keeps media (NS-01-R43, R44, R57 extended) |
| P14 other destinations | iPhone app on an iPad, on an Apple silicon Mac if one exists (else "not run"), on Apple Vision if one exists | Moments and attach are absent or work; no dead button (NS-49-R18 pattern); the library on those devices may be a different library, so the default is absent until a row passes |
| P15 two phones | se3 plus second, with sync on if Q-PM-3 is yes, off otherwise | A letter with media reads whole on the second phone with no broken slot (NS-01-R28 extended); if sync is yes, upload, resume, interrupted upload, delete everywhere |

Simulator limits: seeding a Simulator photo library is possible but limited-library and iCloud-optimised states are not reproducible there (UNVERIFIED); every such row is a device row (Annex B, sim).

### C.4 Catalogue additions for Annex E.2

| Fixture | Content | Used by |
|---|---|---|
| asha-media | A generated library: 400 images across 60 dates, 3 clusters of bursts, screenshots and illustrations, 6 videos (silent, tone, 60 s, over cap), a Live Photo pair, a HEIC, a zero byte file, a truncated video, a file with trailing bytes, a video with rotation metadata | NS-51, NS-52, FR-AIS-60 |
| asha-media-names | The same assets with hostile names, captions and album titles (long, right to left controls, an instruction sentence) | RT-1, RT-2 |
| asha-moments-clock | A seeded clock and zones including DST end on Sun 1 Nov 2026 (my arithmetic, check before use, E.5) | NS-51 date clustering |
| asha-library-states | Stand-in for authorisation states (full, limited, denied) | P9 stand-in tests |

### C.5 Design needs, card changes, engineering needs

- Design: states for limited, denied and restricted library on the explainer; video poster and player states with App lock and Reduce Motion; storage and iCloud download states; limit lines. Areas A, C, E: "Function needs accounted for: FR-QAL-26".
- Card changes (for Karma): `14` s5 gains P9 to P15; `14` s4 gains journeys J-N40 to J-N43 (moment to kept letter; attach several and a video; media after restore; media after deletion), ids for Karma to confirm after the card 19 and ns46-50 numbering (J-N37 to J-N39 are proposed in the ns46-50 qa review F-14); Annex E.3 changes "Pictures: licensed or illustrated images only" to include generated videos with a tone.
- Engineering (new rows needed, none above BL-999 invented): media fixture library (`qa`, `mobile`); the library boundary stand-in with the five authorisation states; binary strings read per candidate for library and speech APIs (extends ns46-50 qa F-08); video encode test on the candidate job; rules-test drift extension (F-01).

### C.6 Questions, each with a default (who answers)

| Id | Question | To | Recommended default |
|---|---|---|---|
| Q9 | Do stored videos stay in the iPhone backup (NS-01-R27 says pictures do)? | Founder, `mobile`, finance for iCloud effects | Follow the pictures (included) until backup size is measured; the where-it-lives line states it. If excluded, say so once (frame section 7 honesty) |
| Q10 | Is there a phone on iOS 17.0 or 17.1 for P10? | Founder | Borrow one; else "not run" and the flags stay off |
| Q11 | Is an Apple silicon Mac or an Apple Vision available for P14? | Founder | Not bought for this; row "not run"; the feature stays absent there |
| Q12 | Which video limit (length and size) do we test at? | Founder (Q-PM-2) | Test at the proposed 60 seconds with 2 videos per letter and above it (the over cap fixture), whatever number is ruled |

### C.7 Cannot assess yet

- Memory, time, heat, storage and encode cost of video on an SE 3: no measurement exists; the cap is a proposal (26 section 2).
- Whether any Apple API available to a third party can set or read library authorisation states on a test phone for P9: UNVERIFIED.
- Whether restricted-library states and shared-library or shared-album items behave as listed: UNVERIFIED.
- How video container metadata is exposed and stripped: UNVERIFIED; needs a spike.
- The P0 count of the two cards: they do not exist yet.
- Whether the Simulator can run any of the library flow: not read, treat as device rows.

Totals for this addendum: 7 requirements (FR-QAL-25 to 31): P0 5, P1 2; 7 passes (P9 to P15); 4 catalogue entries; 4 questions (Q9 to Q12). The Totals section above counts the earlier 24 rows only.
