# Master test plan: Build 13 and the locked pack (rev 2)

Status: PROPOSED | Date: 20 Nov 2026 | Base: develop 3e16f6a2 (develop has since moved; re-checked at 55574906c for the notes in 1053 Review B) | Owner: qa with Karma | Load when: you need what is tested, what is not, what blocks a build, and the order to write tests in.

This file is the index and the ranking. The cases are in files 01 to 07 in this folder. It adds to, and does not replace, `docs/product/prd/14-test-plan.md` (journeys, device matrix, gates G0 to G6, the P0 register) and the four catalogues in `docs/engineering/readiness-20nov/quality/` (cards 01 to 37, 438 rows, all DESIGNED).

How the numbers were made: case counts are machine-counted from the tables in files 01 to 07. Row counts are from `node scripts/trace.mjs --no-write --json` and `p0.py`. Every status was read from the repo by the author of each file (grep of test titles for the id). Nothing was executed: the worktree has no node_modules, no test, mutant or device run was made today. How deep a PARTIAL goes is UNVERIFIED (titles and headers were read, assertions mostly were not).

## 1. Where we are (execution status)

| Measure | Value | Source |
|---|---|---|
| P0 rows in the locked pack | 1,062 (NS 537 plus FR 515; the pack docs say 1,050 to 1,052, the script is newer) | p0.py, 20 Nov |
| P0 rows with no row-level backlog row | 729 to 771 (docs disagree; regenerate) | BACKLOG-GAPS.md |
| NS-01 to NS-37 P0 rows the trace reads | 299: 41 tested, 14 device, 244 untested | trace.mjs |
| NS-38 to NS-52 P0 rows the trace reads | 0 of 238 (card 19: 98, card 21: 87, card 27: 53). CARD_FILE matches cards 00 to 12 only | trace.mjs:532 |
| New cases written today (files 01 to 07) | 664 case ids across files 01 to 07 (priority split UNVERIFIED: authors reported P0 555, Review A recounted P0 556; the case tables are the record; file 01 has 116 rows, and its header status line is P0 only) | this folder |
| Their status | BUILT 40 (25 cite an id, 15 test the behaviour with no id), PARTIAL 163, GAP 324, DEVICE 82, DOC 34, UNVERIFIED 20, COUNSEL 1 | this folder |
| New cases with a citing or behaviour-matching test found in the repo | 40 of 664, about 6 percent (not run today) | derived |
| Device rows run | none for Build 13 (S1-204, S1-205, S1-135 and the backup drill were still owed at the last record) | 14-test-plan.md section 8 |
| develop head 3e16f6a2 | typecheck, Deno, B-8, install, migrations green; compliance-fence failed on the push run; tests and database rules were still running when read | GitHub checks, 20 Nov |

Read the 6 percent as a measure of the pack, not of the app. The repo has 295 mobile test files and 44 database test files; the last coverage measure (16 Oct, `docs/qa/COVERAGE.md`) was core 97 percent lines, mobile 56 percent lines. The new scope (cards 19, 21, 27 and the NS ids) has almost no test that names its rows.

## 2. Priorities

P0 means a promise breaks if it fails (card 14, section 1): a letter or recording lost, a word changed, a charge or paywall out of place, something leaves the phone that should not, a count or guilt line, a child's name on a lock screen. P0 blocks any build to anyone outside the founder's family. P1 blocks a store build. P2 is tracked.

Release line (card 21 "Release line and cut", E31, 22 section 4; the earlier pointer that put NS-46, 47 and 50 in Drop A is wrong and is corrected here): Drop A is NS-48 phase 1 only (E31, CL-015; P0 by drop reads A 6, B 55, B+C 2, C 24). Drop B is NS-46 (US only, plain browse-and-tick list), NS-47 store rules only, NS-50 rank 2b, and NS-49 level 1 R1, R3, R4, R25, R26, which E31 moved from A to B because it needs NS-01, which Build 13 keeps dark, and which ships only if the A-S01 re-draw passes its AX5 test (NS-49-R1); all of B ships in 1.0 only if its gates close before the freeze, otherwise 1.1. NS-47 ask slip and the rest of NS-49 are Drop C; Drop C is NS-51, NS-52 after 1.0 (the NS-51 spike runs in Build 13); Drop D is first run NS-38 to NS-45, after wave 1 and Drop A and before any family outside the founder's signs in. Nothing in Drop A is a content change. The Build 13 content list is a separate proposal (NS-09, 10, 32, 13, 33 on; NS-01, 02, 37 and export 1.7.0 dark), not a ruling.

## 3. The twenty risks that matter most (ranked)

Rank by the promise at risk, then by how far the test is from existing. "Red today" means the author of that file found a rule the code breaks now; I re-checked Smart Invert (0 uses), `LockOffer` (mounted) and the missing `photo_bucket_closed` test file, not the rest.

| # | Risk | Rows | Where | State | Owner lane |
|---|---|---|---|---|---|
| 1 | A second account can reach the first account's data: no per-surface proof for Find, reminders, search index, outbox, claims and uploads under B | X4-R1, NS-41-R6, NS-02-R24, NS-10-R5, NS-25-R19, FR-SEC-02 to 04, FR-PRV-14, FR-PRV-44 | 01, 07 | GAP, partial reader tests only | security, mobile |
| 2 | Server does not gate `sync_pull` on consent, and the rule text contradicts security question S-1 | FR-PRV-20, T7-22 to 24 | 07 | owner must rule first | security-architect, sync |
| 3 | Picture data guards untested: server write-deny, tuple and consent drift guard, let-go purge, level per column | NS-01-R61, NS-36-R1d, R10, R11, NS-09-R14 | 03, 06 | GAP; named file `photo_bucket_closed.test.mjs` does not exist | data, sync |
| 4 | Lock-screen leak: child name or letter words on a lock screen, Summary, Watch, CarPlay, Focus; no notification categories or previewPlaceholder exist | NS-13 P0 rows (see 02), NS-48-R26, NS-47-R36, J-N24, J-N37, J-N38 | 02 | GAP plus DEVICE; the cards mark Watch, Center, Focus UNVERIFIED | mobile, qa |
| 5 | No test that every production build has the new flags off (G6) and no photo-library string or journaling entitlement | NS-49-R15, R25, R26, T2-120 to 123 | 02 | GAP; must exist before the first `EXPO_PUBLIC_DAYS` line in eas.json | ops, qa |
| 6 | Kill and durability: kill harness has no media crash points; no 50-run SE 3 run; migration 11 proved on one letter, not 1,000 | NS-01-R35, R36, NS-09, J-N1 | 06, 03 | GAP | mobile, data |
| 7 | Smart Invert red today: `accessibilityIgnoresInvertColors` has 0 uses, pictures invert | NS-33-R11 and four picture rows | 05 | RED TODAY | design-systems, mobile |
| 8 | Notification cap: planner default is 60 (`planner.ts:323`) and `plan-reminders.logic.ts:48` adds 4 plan notices, so the total can reach 64; NS-32-R4b was reworded to 60 in total (E13, CL-115). Reviewer B confirmed the conflict | NS-32-R4b | 06 | RED (confirmed by Review B, not run) | mobile |
| 9 | First run: pending-request note lives 1 h in code (`email-link.logic.ts:36`, a deliberate choice longer than the 900 s link) while NS-41-R11 says 900 s; `LockOffer` still mounted (`apps/mobile/src/app/onboarding.tsx:579`); withdrawing consent has no control | NS-41-R11, NS-43-R10, NS-39-R9, NS-42-R17 | 01 | code and card disagree (card 19 is Drop D); product to rule on R11 | mobile, product |
| 10 | First-run no-leak and no-surprise rows have no test: no network before the age question, no permission prompt, no teaser or price, same screens for known and unknown address, no log canary | NS-39-R1, R2, R12, R14, NS-41-R2, R16, NS-42-R16, NS-44-R1 | 01 | GAP | mobile, security |
| 11 | Analytics: sampling can silently drop P0 events; failed or offline send loses the batch; allowlist guards narrower than the promises (hash, file, size words pass; int to 1000 passes) | TRACKING_PLAN 5.3, FR-DAT-36, NS-47-R34, NS-48-R38 | 04 | GAP | analytics |
| 12 | No canary sweep over every tracker and observer (J-N18 cited nowhere) | J-N18, NS-47-R8, NS-49-R24, NS-51-R28, NS-52-R44 | 04, 02 | GAP | analytics, qa |
| 13 | Deletion and data rights have no row-level test: purged id never returns; no test cites any FR-SEC, FR-PRV, FR-CMP, FR-LEG, FR-SUP, FR-POL id | DSR-R09, FR-PRV, FR-LEG | 07 | GAP | privacy, compliance |
| 14 | Country and age gates: D-131 country hook for blocked countries not found in code or migrations; age gate tested only under older ids | NS-40-R9, R10, R12, NS-40 | 07, 01 | GAP; hook off by default (E47) | regulatory, mobile |
| 15 | Performance promises unmeasured: no perf profile or marker module, no 1,000-letter 300-picture generator, binary never measured against 40 MB, no cold-start, memory, battery or scroll number | NFR-BUDGETS rows, J-N13, NS-37, NS-34-R6 | 06, 05 | GAP plus DEVICE | mobile, ops |
| 16 | Video promises rest on code and fixtures that do not exist (the #835 to #840 stack is not in base): metadata stripping, erase of every file, Variant A uploads nothing | NS-52-R5, R16, R19 | 03 | GAP; Drop C | mobile, sync |
| 17 | Days foundations not built: no days module, `budget.ts`, `chooseSlip` or FRAME-SLIP (`notification-key` landed with #1032, NS-48 phase 1, after this plan's base; its tests cite NS-48-R1, R12, R14, R15, R23, R32, R33) | NS-46-R30, NS-48-R26, NS-47-R12, R13, R38 | 02 | GAP; Drop B | mobile |
| 18 | Motion and Low Power: no frame budget proof; `breathe.tsx` ignores Low Power; rulings 26 to 30 tokens (`mediaFrame`, `glassFallback`, spring 439/38.5) not in code | NS-34, NS-37-R1, rulings 26 to 30 | 05 | GAP | design-systems |
| 19 | Sync late-write and restore edges after #737: no test for an in-flight pull landing after sign-out; no guard after the restore-mode push; no signed-in-user compare | NX-31, NS-10 | 06 | GAP (the #823 tests exist on a closed branch, 2320b9af) | sync |
| 20 | No secret-scan job (gitleaks pending PR #30), no `docs/ops/SECRETS.md`; agent lane fails open to founder on a new first-line format | SEC-R02, SEC-R03, NSC-12 | 07 | GAP | security, ops |

## 4. Order of work

Wave 0, enabling, before any card's tests (each is a small PR, none needs the founder):
1. Widen `scripts/trace.mjs:532` to cards 19, 21, 27, add a fixture for a card above 12 to `trace.test.mjs`, list the new P0 rows in 14-test-plan section 7. Closes the eight "defined nowhere" ids and gates G0.
2. G6 flag-off production build check with a positive control (T2-120 to 123).
3. The Asha 1,000-letter, 300-picture generator and a perf marker module (unblocks J-N13, NS-37, NFR cases).
4. Kill-harness media crash points in `protocol.mjs`.
5. The per-surface second-account enumeration (X4-R1 across surfaces).
6. The three sync tests in risk 19, and the notification cap fix (risk 8) with its test.

Wave 1, Build 13 (Drop A): NS-48 phase 1 floor, content rules drift (NS-48-R28 has a test in `rules-drift.test.ts`, file 02 rates it PARTIAL; not yet traced, not run today), analytics allowlist rows (cited in `allowlist-pins.test.ts`: NS-46-R34, NS-47-R9, NS-47-R34, NS-48-R2, NS-48-R38, NS-49-R36, NS-50-R17; not run today), plus whichever of NS-09, 10, 32, 13, 33 the founder confirms. Device rows J-N37 and J-N38 only gate if NS-46, 47 or 50 flags turn on.

Wave 2, Drop B gates: NS-46, NS-47 store rules, NS-50 rank 2b (days module and budget first), NS-49 level 1 (only if the A-S01 re-draw passes AX5) and the flag-off proof, then the lock-screen device walk.

Wave 3, Drop D: card 19 stack and J-N28 to J-N36, before any outside family signs in.

Wave 4, Drop C: NS-51 spike, NS-52 and media, after 1.0.

## 5. Gates, and what each needs from this plan

| Gate | Needs | Today |
|---|---|---|
| G0 trace sees NS ids and every P0 has a test and a backlog row | Wave 0 item 1; 729 to 771 backlog rows | not met |
| G1 on-device data rules and export schema | ADR 0028 (#797 merged), export 1.7.0 (BL-933) | not met |
| G2 counsel reads | founder sends packets | not met |
| G3 founder approves words | #866, #870 | not met |
| G4 every P0 device row passes on the candidate, incl. iOS 17.0, 17.1, 17.2, 26 | founder's phones; which he owns is not recorded | not met; 82 DEVICE cases planned |
| G5 privacy label and claims match what the build sends | G1; BL-975 guard | not met |
| G6 no production flag with an open P0 | Wave 0 item 2 | check does not exist |

## 6. Rule conflicts that need an owner before the test can be written

Each pair is a contradiction found in the sources, not a guess. A test written today can pass or fail both ways.

| Conflict | Files | Owner |
|---|---|---|
| FR-PRV-20 "no content rows without consent" vs S-1 "serve own rows, omit others'" (T7-22 asserts the gate; T7-23 asserts export and deletion work without current consent. Write T7-23 first, it cannot weaken deletion; write T7-22 only after the ruling) | 07 | security-architect, Karma |
| Missing file: NS-01-R56 deletes the row at the next sweep; NS-52-R40 keeps the row with a plain box (E48 changed only R36) | 03 | product |
| NS-52-R38 forbids third-party media packages; media TDD adopts `expo-video` | 03 | product, principal-architect |
| FR-PHS-69 checks byte caps before copy; E44 and the media TDD say a video's size is known only after | 03 | product |
| FR-PHS-68 keeps a Live Photo's video; NS-52-R12 stores the still only | 03 | product |
| `moment_shown` event with letters_10 to letters_365 vs FR-DAT-38 and FR-DAT-26 | 04 | analytics, product |
| NS-52-R43 forbids media duration and type; `audio_bucket` and `mode` exist | 04 | analytics |
| TRACKING_PLAN 3.2 "schema_version currently 5"; code is 8 | 04 | analytics |
| `docs/tdd/new-scope/16-days-tests.md` "first sign-in adopts local days file" vs E73 | 02 | principal-architect |
| `store.en.ts:79` "You pick the days and the time" vs NS-46-R46 for day reminders | 02 | content |
| FR-NTC-08 is P0 but its carrier NS-48-R8 is P1 (not upgraded) | 02 | product |
| DSR-R03 says "deletion UI not built"; screens and tests exist (compliance-engineer fixes the rule in its own PR; no plan change) | 07 | privacy |
| FR-SEC-24 is an opinion, not a testable row | 07 | security |
| NS-08 "P0 at flip" rows: do they block Build 13? | 07 | product, Karma |
| Card 19 line 16 says trace ignores NS ids; `trace.mjs:529` matches them (card range is the gap) | 01, 04 | qa |
| The ADRs A1 to E (Proposed) and `docs/design/system/MOTION.md`, `COMPONENTS.md`, `tokens.v2.json` named by docs are not in this tree | 06, 05 | principal-architect, design-systems |
| `releaseOwnerIfEmpty` in earlier notes is `releaseEmptyOwner` in code on develop; `stale()` named in #823 is not in develop (a stopped-engine check is) | 06 | sync |

## 7. Not verified

- No test, mutant, coverage run or device run happened today. Every BUILT is "a test whose title cites the id was found"; whether it would fail on a broken implementation is the author's first run (C-05).
- File 06 did not read in full: `13`, `17`, `17b`, `18-errata`, TDD files 08 to 16, `docs/ARCHITECTURE.md`. File 07 did not read `18-errata`. File 02 did not open the four quality catalogues, so its row format may differ slightly.
- Which phones the founder owns (14-test-plan section 5). Without 17.0 or 17.1 phones the NS-49 rows stay "not run" and G4 does not pass.
- Full `npm test`, `npm run test:db`, `test:functions` on current develop.
- Follow-ups, not done in this PR (each needs a new case id and so a recount of 664): (a) microphone denied at start, microphone revoked mid-take (take kept), notification permission revoked after reminders were planned (no planned notes left, no error); photos denied or limited is already N-04, N-14, T2-079. (b) The ARCH-P-01 to 05 constitution cases (`verifyEdits`, `raw_transcript`, `EditType`) are PROPOSED and live only in file 06 C01 to C05; the twenty-risk table has no constitution row yet. (c) The ARCH-P proposed ids are not repo ids; mark each GAP in the case tables. (d) T7-25 stays P0 and is not passing on a row-state test alone, since consent withdrawal has no control in code (risk 9). (e) Files 03 and 04 use a column layout different from 01 and 02 (no Drop column in 03); align before any single parser reads them. (f) Re-read the plan against current develop (base line is stale; Review B at 43318ef used c4ee026f).
- Whether develop's compliance-fence failure on the push run is a push-only artifact (unread).

## 8. Files in this folder

| File | Scope | Cases |
|---|---|---|
| 01 | First run and account life, NS-38 to NS-45, J-N28 to J-N36 | 116 |
| 02 | Days, culture, notifications, picture-first, NS-46 to NS-50, J-N37 to J-N39 | 122 |
| 03 | Photos and media library, NS-01, NS-51, NS-52, FR-PHS | 81 |
| 04 | Analytics and insights | 59 |
| 05 | Design and accessibility | 71 |
| 06 | Architecture, data, sync, performance | 82 |
| 07 | Security, privacy, compliance | 133 |
