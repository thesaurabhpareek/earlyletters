# End-to-end test plan completeness audit (8 Nov 2026)

Owner: `qa`. Written Sun 8 Nov 2026 against `develop` at 29dcd7d8 plus this PR (the catalog rows in sections 21 to 27 and DEVICE_TEST_PLAN S1-50 to S1-74). The founder asked for it on 8 Nov ("Also do end to end test plan completeness"; `/home/claude/proposals/tonight-BRIEF.md`). It answers one question: does every requirement, decision and flagged bug have at least one case somewhere? It does not say any case has passed. **No device row in this repo has been run on a phone** (`docs/qa/evidence` holds only the README and template), so "mapped to a device row" means a case is written, not that anything is proven.

## 1. How it was counted

Every requirement id (`*-REQ-nnn`, `*-NFR-nnn`) defined in PRD V2 (`docs/prd/v2/features/F*.md` section 7, read by `scripts/trace.mjs` `collect()`), plus the ids the trace reads as outside sources (`docs/legal/ENGINEERING_REQUIREMENTS.md`, `DELETION_AND_EXPORT_SPEC.md` and the PRD 1.3 appendices: LEGAL-REQ, DATA-REQ, C-NFR, PRD-REQ, A, B and C ids), retired ids left out. Each id was checked against five layers:

| Layer | Counts as mapped when |
|---|---|
| Unit or integration test | A test title cites the id (`trace.mjs`'s rule) |
| Maestro flow | The flow's `tags:` list names it |
| Web journey | `docs/release/journey/INDEX.md` or a file in `apps/mobile/e2e-web` names it |
| Device | `DEVICE_TEST_PLAN.md`, `ALPHA_GO_NO_GO.md` or a run sheet names it |
| Catalog | A catalog row that is not `gap` or `decision` cites it |

An id is a **gap** when no layer names it. One limit: the web journeys and most catalog rows name areas, not requirement ids, so a requirement a journey does exercise but never names is counted as a gap here. The fix for that is to tag the journeys (below), not to read the gap count as untested behaviour.

## 2. Requirements by family

P0 gaps are P0 ids with no case in any layer. Severity is `qa`'s, on the TDD 07 scale, for the first store build: S1 where the family ships in build 1 and a P0 promise has no case; S2 where it ships but the gaps are mostly secondary; S3 where the family is servers-on or switched off in build 1 (sign-in, sync, co-parent, analytics), so the gap waits for build 2.

| Family | Defined | P0 | Mapped | P0 gaps | Owner | Severity |
|---|---|---|---|---|---|---|
| F01-REQ | 10 | 9 | 3 | 5 | mobile, legal | S2 |
| F02-REQ | 25 | 23 | 8 | 15 | security | S3 |
| F03-REQ | 11 | 11 | 1 | 10 | mobile | S2 |
| F04-REQ | 48 | 43 | 15 | 27 | mobile | S1 |
| F05-REQ | 50 | 49 | 10 | 38 | speech | S1 |
| F06-REQ | 44 | 43 | 21 | 22 | ai-eng-lead | S1 |
| F07-REQ | 21 | 20 | 2 | 17 | speech | S2 |
| F08-REQ | 48 | 46 | 26 | 20 | mobile, security | S2 |
| F09-REQ | 33 | 31 | 6 | 25 | design-systems, mobile | S1 |
| F10-REQ | 23 | 17 | 1 | 16 | mobile | S2 |
| F11-REQ | 38 | 34 | 22 | 12 | sync | S3 |
| F12-REQ | 13 | 11 | 3 | 7 | mobile | S2 |
| F13-REQ | 24 | 22 | 6 | 16 | content, mobile | S2 |
| F14-REQ | 48 | 41 | 18 | 24 | payments | S1 |
| F15-REQ | 19 | 19 | 3 | 16 | mobile | S1 |
| F16-REQ | 41 | 41 | 15 | 26 | sync | S3 |
| F17-REQ | 34 | 30 | 10 | 23 | privacy, mobile | S1 |
| F18-REQ | 28 | 26 | 1 | 25 | analytics | S3 |
| F19-REQ | 26 | 25 | 5 | 20 | content | S2 |
| F20-REQ | 20 | 19 | 6 | 12 | support, content | S1 |
| F21-REQ | 34 | 30 | 0 | 30 | marketing | S2 |
| A-NFR | 3 | 3 | 1 | 2 | product | S3 |
| A-REQ | 26 | 23 | 20 | 4 | product | S3 |
| B-NFR | 7 | 7 | 5 | 2 | product | S2 |
| B-REQ | 17 | 14 | 12 | 2 | product | S2 |
| C-NFR | 9 | 4 | 2 | 2 | principal-architect | S2 |
| C-REQ | 28 | 27 | 19 | 8 | product | S2 |
| DATA-REQ | 44 | 41 | 20 | 22 | data-architect | S1 |
| LEGAL-REQ | 58 | 50 | 30 | 19 | compliance-engineer | S1 |
| PRD-REQ | 23 | 22 | 11 | 11 | product | S2 |
| **All** | **853** | **781** | **302** | **478** | | |

The P0 gap column counts only ids with nothing anywhere. A further 9 P0 ids are cited only by `gap` catalog rows (a case is asked for but not written); they are marked `*` in the appendix.

What stands out:

- **F01 to F21: 638 ids, 182 mapped, 406 P0 gaps.** The largest build 1 gaps are F05 transcription (38), F04 capture (27), F09 Book (25), F14 Plus (24), F06 faithful edit (22) and F17 settings and privacy (23). Much of F04, F05 and F06 is probably exercised by the core and capture tests, whose titles cite older ids or none (not checked id by id), so the first fix is tagging, not writing.
- **F21 store and web (30) and F18 analytics (25) have no mapped id at all.** F18 is off in build 1 (D-124), so S3. F21 is the listing and website: RT-REL-03, RT-REL-10 and RT-LST-01 cover parts by area without naming ids.
- **LEGAL-REQ: 58 read, 30 mapped, 19 P0 with nothing.** S1, because a LEGAL-REQ P0 is a promise or a store duty (the list is in the appendix).
- **Web journeys name 12 ids in total.** Tagging each journey step with the ids it proves (as the Maestro flows do) is the cheapest way to shrink this table.

## 3. The 1 Nov decisions

| Decision | What it needs proved | Cases | Gap |
|---|---|---|---|
| F1 store build on-device plus protections | Lock, Before you begin, Where your letters live, Your words, Erase, Settings | RT-LOCK-01 to 13, RT-BYB, RT-WLL, RT-YWD, RT-ERS, RT-SIA; S1-50 to S1-60 | None mapped-wise. If counsel has not approved the Face ID string by 20 Nov, S1-50 to S1-55 move to 1.0.x |
| F2 neutral Yes/No plus an unticked box | Box, No path, record | RT-BYB-01 to 08; S1-56 | RT-AGE-01 and E2E-01b go stale when it ships |
| F3 optional name at sign-in (1.1) | Field optional, prefilled, absent in build 1 | none | Gap, S3 (1.1). Owner: security, mobile (BL-689) |
| F4 confirm D-033 | Recordings in the iPhone backup; restore drill | DL-03, S1-25, RT-PRV-04, RT-WLL-02 | DL-03 never run; CCO-8 blocks the backup line until it is |
| F5 Plus told early; held letters exportable | Lines, header, Tonight line, PL-2 | RT-PLN-01 to 07, RT-HELD-01 to 06; S1-64, S1-65 | None mapped-wise; PL-2 is P0 and unbuilt |
| F6 one question plus one card; memory card Not today and switch | Card rules | RT-MEM-01 to 10, RT-SLB-01 to 06; S1-66, S1-69, S1-70 | None mapped-wise |
| F7 no facts before a clinician review | No fact on Tonight in 1 Dec and 1.0.1 | RT-SLB-01 (no fact kind) | A content test that fails on any fact string before 1.2 is not written: gap, S2, content |
| F8 your dates in the profile (1.1) | Month-day only, device-only, removable, in Export | none | Gap, S3 (1.1). Owner: mobile, data-architect (BL-699, BL-700) |
| F9 illustrator commission | Procurement; style rules for any new drawing | RT-DRW-01 | Not testable beyond the style rules |
| F10 one welcome email (1.1) | No child name, not to co-parents, classification | none | Gap, S3 (1.1). Owner: content, emails (BL-694) |
| F11 the release map | Every 1 Dec and 1.0.1 row | Sections 21 to 27 of the catalog; S1-50 to S1-74 | Covered by this PR |
| PL-1 no letter limit in alpha | Alpha build keeps every letter; production unchanged | S1-37; `apps/mobile/test/billing-alpha.test.ts` (#552) | No catalog row names PL-1 by itself; S1-37 not run |
| PL-2 held letters readable, playable, exportable | Hash-equal export of held letters | RT-HELD-01 to 06; S1-64 | Unbuilt (BL-643, BL-644) |
| PL-3 to PL-8 | Header, Plan, lines, waiting letters, Family Sharing, dead copy | RT-PLN-01 to 07, RT-WTL-01 and 02 | PL-7 (Family Sharing line, 1.1): no case, S3, payments |

## 4. BACKLOG M14 (PR #599, BL-621 to BL-726)

From the `docs/backlog-account-experience` branch as of 1 Nov.

- **BL-621 to BL-678 (1 Dec and 1.0.1): 58 items, 54 with a case.** Each maps to the catalog rows and device items in section 3 and in RELEASE_TEST_PLAN sections 21 to 27 (BL-621 to BL-625 to RT-LOCK; BL-626 to BL-628 to RT-BYB; BL-629 RT-WLL; BL-630 DL-03; BL-631 RT-YWD; BL-632 RT-SIA-04; BL-633 RT-SIA-01; BL-634 RT-PRP; BL-635 RT-RMD; BL-636 and BL-637 the content and registry rows; BL-639 RT-LST-01; BL-640 RT-ERS; BL-641 the matrix in S1-50 to S1-63; BL-642 RT-REL-10; BL-643 to BL-648 RT-HELD and RT-PLN; BL-649 RT-TON-03 (#508 open); BL-650 RT-MEM; BL-651 to BL-658 RT-MOT; BL-660 RT-BKP-02; BL-661 RT-CNT-01; BL-662 RT-WAIT-01; BL-663 RT-DRW-01; BL-665 to BL-677 the 1.0.1 rows). The 4 without a case are not testable as cases: BL-638 (counsel packet), BL-659 (a decision), BL-664 (design docs) and BL-678 (a spike). BL-630's drill is itself a case (DL-03).
- **BL-679 to BL-714 (1.1 and later): 36 items, 9 with a case** (BL-680 S1-07 and RT-AUTH-11; BL-683 S1-06 to S1-08; BL-687 S2-14; BL-691 S1-27; BL-693 records only, S1-52 (c); BL-714 RT-ANT-02; BL-706 to BL-708 by area in RT-MEM rows). The other 27 wait for their release; `qa` writes them with the 1.1 scope. Severity S3.
- **BL-715 to BL-726 (build 1 follow-ups and doc drift): 12 items.** BL-715 S1-36 (j); BL-719 S1-15a; BL-718 S1-30 (licence names read twice is not a step: gap, S2, mobile); BL-720 S1-37 (the two Manage subscription buttons are not a step: gap, S2, payments); BL-716 and BL-717 (Review keyboard offset; clearing typed words on a recording draft): no case, S2, mobile. BL-721 to BL-726 are docs and ops: not test cases.

## 5. Bugs the founder flagged on TestFlight build 1 (1 Nov)

| Bug | Fix | Automated | Device | State |
|---|---|---|---|---|
| Download stuck at 0% | #541 merged | `speech-download-status.test.ts` | S1-15a | Device NOT RUN |
| Review progress empty ("Part 1 of 3") | #542 merged | `decode-progress.test.ts` | S1-17a | Device NOT RUN |
| No back button in Settings | #546 merged | `settings-back.test.ts` | S1-23 V-10 | Device NOT RUN |
| Write typing (caret, keyboard) | #545 merged | `write-session.test.ts` | S1-36 | Device NOT RUN |
| Alpha capped at two letters | #552 merged | `billing-alpha.test.ts` | S1-37 | Device NOT RUN |
| Licences list | #550 merged | `licences.test.ts` | S1-30 | Device NOT RUN |
| Web legal pages in dark mode | #543 merged (website) | apps/web tests | none (website) | Live on the site; no phone row needed |
| Date picker | #540 open | `date-field.test.ts` (in the PR) | S1-23 V-02 (in the PR) | Not merged |
| "18" numeral merging | #544 open | `text-trim.test.ts` (in the PR) | S1-38 (in the PR) | Not merged |
| Listen re-render | #532 open | `listen.test.ts` (in the PR) | S1-67 (c) | Not merged |
| Letter opens with slide plus grow | not coded (BL-651) | RT-MOT-01 (transitions.test.ts pins the push today) | S1-67 (a) | Gap until coded |
| Two start haptics, pause tick | not coded (BL-652) | RT-MOT-02 | S1-53 (d), S1-67 (b) | Gap until coded |
| Listen metering 20 times a second; cue flat | not coded (BL-653) | RT-MOT-03 | S1-67 (c) | Gap until coded |
| Storage rows both "All languages, Speech model" | not coded (BL-632) | RT-SIA-04 | S1-60 (f) | Gap until coded |
| "Word for word" unclear | not coded (BL-631) | RT-YWD-01, RT-YWD-02 | S1-58 | Gap until coded |
| "early" said three times; build number | not coded (BL-633) | RT-SIA-03 | S1-60 (d) | Gap until coded |
| Family coming-soon copy (rewrite B) | not coded | RT-FAM-01 (J17 asserts today's copy) | none | J17 goes stale when the copy changes; add a step. Gap, S2, content |
| Progress track invisible; moon breathing while queued | not coded (BL-655) | RT-MOT-05 | S1-15a, S1-67 (e) | Gap until coded |

Every flagged bug has at least one case. None has run on a phone.

## 6. Rows marked automated

14 rows are `automated`, all in the web lane: RT-AGE-03, RT-FR-01, RT-FR-03, RT-FR-04, RT-TON-01, RT-TON-05, RT-REV-01, RT-REV-03, RT-REV-06, RT-BK-01, RT-BK-15, RT-SET-03, RT-SET-06, RT-FAM-01. Each cites a journey whose flow file exists in `apps/mobile/e2e-web`, so none is without a runnable test. But:

- **No pipeline runs them.** `.github/workflows/web-e2e.yml` runs the website's tests (`apps/web`), not these journeys. The workflow to run them is open in #534. Until it merges, "automated" means a person ran them by hand: the last run was 1 Nov (89 of 90 passed; J05e fails, #480, and no automated row cites J05e).
- **RT-AGE-03 claims more than J02 checks.** Its steps say the clock moves 23 h and then 25 h. J02 restarts and then moves the clock 25 h; it never checks that the stop holds at 23 h. The 24 h boundary is proved by `apps/mobile/test/age-gate.test.ts` instead. The row should cite that test or J02 should add the 23 h step. Owner: qa. S3.
- **Three rows go stale when 1 Dec work lands.** RT-SET-06 (J14, the Recordings page that settings-ia moves into Where your letters live and Your words), RT-FAM-01 (J17, the coming-soon copy rewrite) and RT-AGE-01 (E2E-01b, Continue disabled). Each journey changes in the same PR as the screen.

## 7. Other drift found

- **RT-BK-05 said "not built"** although #513 (change a letter's date) merged with `book-date-change.test.ts`. This PR moves it to partial and cites both.
- **TF-04, the smoke list for every TestFlight build, does not fit an alpha.** Item 4 signs in and syncs (servers are off in the `testflight` profile) and item 6 expects a Privacy switch (none since D-124). The checklist for tonight's build replaces it for alphas (`docs/qa/run-sheets/2026-11-08-testflight-alpha-checklist.md`, separate PR). TF-04 itself is left as it is until build 2.

## 8. What to do first (owner, severity)

1. Tag the web journeys and the core, capture and transcription test titles with the ids they already prove (qa, S2). That is cheap, and it shows which of the 406 F01 to F21 gaps are real.
2. Write the LEGAL-REQ P0 cases (compliance-engineer with qa, S1): the 19 ids in the appendix.
3. Merge #534 so the 14 automated rows run on every PR (ops, founder for the workflow, S2).
4. Run the device rows on a phone. Today nothing is proven there (founder with qa, S1 for the build 1 P0 rows).
5. Write F3, F8, F10 and PL-7 cases with the 1.1 scope (qa, S3).

## Appendix: P0 ids with no case (`*` = cited only by a gap row)

- **A-NFR** (2): 002, 012
- **A-REQ** (4): 005, 035, 017, 026
- **B-NFR** (2): 008, 003
- **B-REQ** (2): 012, 015
- **C-NFR** (3): 001, 002*, 005
- **C-REQ** (8): 018, 010, 007, 012, 021, 024, 026, 034
- **DATA-REQ** (22): 041, 042, 052, 005, 032, 001, 004, 011, 013, 019, 020, 021, 023, 024, 025, 026, 027, 033, 036, 064, 066, 062
- **F01-REQ** (6): 001, 003*, 004, 006, 008, 010
- **F02-REQ** (15): 001, 002, 003, 005, 006, 008, 009, 011, 012, 014, 015, 017, 023, 024, 025
- **F03-REQ** (10): 001, 002, 003, 004, 005, 006, 008, 009, 010, 011
- **F04-REQ** (28): 002, 003, 005, 006, 007, 008, 010, 011*, 013, 017, 018, 019, 021, 023, 025, 026, 027, 028, 029, 030, 031, 033, 035, 037, 038, 039, 041, 047
- **F05-REQ** (39): 001, 007, 010, 011, 012, 013, 014*, 015, 016, 017, 019, 020, 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 037, 039, 041, 042, 043, 044, 046, 047, 048, 049, 050, 051
- **F06-REQ** (22): 011, 013, 020, 022, 023, 025, 026, 027, 029, 030, 031, 032, 034, 035, 036, 038, 039, 040, 041, 042, 043, 044
- **F07-REQ** (18): 001, 002, 003, 004, 005*, 006, 007, 009, 010, 011, 013, 014, 015, 016, 017, 018, 019, 020
- **F08-REQ** (20): 001, 002, 004, 005, 006, 007, 008, 009, 010, 011, 013, 017, 036, 037, 038, 044, 080, 081, 082, 083
- **F09-REQ** (25): 001, 002, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 017, 018, 019, 020, 021, 023, 025, 026, 027, 029, 030, 031, 033
- **F10-REQ** (16): 001, 003, 005, 006, 007, 008, 009, 010, 011, 012, 013, 016, 017, 018, 019, 080
- **F11-REQ** (12): 005, 013, 015, 016, 020, 025, 029, 081, 083, 086, 087, 088
- **F12-REQ** (8): 002, 003, 005, 007, 009, 010, 011*, 012
- **F13-REQ** (16): 001, 002, 003, 005, 006, 007, 009, 010, 011, 012, 014, 015, 017, 019, 021, 022
- **F14-REQ** (24): 001, 002, 003, 004, 005, 008, 009, 010, 012, 013, 015, 016, 017, 020, 022, 024, 025, 027, 028, 031, 034, 045, 046, 080
- **F15-REQ** (16): 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 017, 018, 019
- **F16-REQ** (26): 001, 003, 004, 005, 006, 008, 012, 013, 014, 015, 017, 020, 021, 022, 026, 027, 030, 031, 032, 033, 034, 080, 081, 083, 084, 086
- **F17-REQ** (24): 001, 003, 004, 005, 006, 013, 014, 016, 017, 018, 020, 021, 022, 023, 024, 025, 026, 028*, 029, 030, 080, 081, 082, 083
- **F18-REQ** (25): 001, 002, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 022, 024, 025, 026, 027, 028
- **F19-REQ** (20): 001, 003, 004, 005, 006, 007, 010, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 026
- **F20-REQ** (13): 004*, 006, 007, 008, 010, 011, 012, 013, 014, 015, 016, 017, 018
- **F21-REQ** (30): 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 024, 025, 027, 028, 030, 031, 032, 034
- **LEGAL-REQ** (20): 026, 023, 048, 053, 021, 022, 025, 032, 033, 041, 012, 015, 016, 042, 058*, 028, 037, 055, 061, 063
- **PRD-REQ** (11): 020, 011, 013, 003, 024, 025, 026, 027, 010, 017, 023
