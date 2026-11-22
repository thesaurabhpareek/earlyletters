# Disposition of critique round 2: delivery, traceability and dates (R7 and R9)

Date: Thu 15 Oct 2026. Lane: delivery lead. Files this pass could edit: `08-delivery.md`, `05-feature-map.md`, `07-quality-bar.md`, `09-decisions-and-risks.md`, `README.md`, `10-changes-from-1.3.md`, and sections 7 and 12 of any spec for ID and mapping fixes only. A finding whose fix sits outside those files is marked **Passed** with the owner; it is not handled here. Another lane (R8, architecture and privacy) was editing F04, F06-adjacent rows, F08, F11, F16, F17 and `06-nfr.md` at the same time; where its edits touch a finding below, the row says so.

The founder said "continue" without answering T02. Three spec defaults are recorded as **defaults awaiting confirmation** (`08-delivery.md` section 1.1; 09 DR-18, DR-19, DR-20): (a) the coordinator merges docs, evidence and test-only PRs that two independent review agents passed, and server, auth, payments and migrations stay with the founder; (b) recording backup is free for everyone; (c) a voice-only letter saved before its model arrives is kept and counts toward the free letters only once its words exist and the author keeps it from Review (M17).

## Results in one place

| Measure (script over sections 7 and 12) | Before (15 Oct, start) | After |
|---|---|---|
| Requirement IDs defined | 750 unique in 775 rows | 817 in 817 rows |
| IDs defined in two or more rows | 22 (R9's first-ID script: 19) | 0 |
| P0 IDs with no work package | 191 | 0 |
| P0 IDs with no named test | 102 | 0 |
| IDs cited but defined nowhere | 66 | 0 (35 given home rows, 31 listed as not v1.0 in `10` section 3) |
| Unbuilt or partly built WPs carrying a P0 requirement | 80 off the list by R9's count; 230 by this lane's count, which also treats specs with no status column as not built | 246: 229 with a slot, 14 human or device (the WP-F08-B6 drill also has an evidence slot), 3 P1 extras cut with a stated condition |
| Slots to the last feature merge | 128 | 281 |
| Submission week | Mon 11 Jan 2027, about 50% | Mon 3 May 2027, about 40%; about 75% by Fri 4 Jun 2027 |

The counts after the fixes include work packages and IDs the R8 lane added on 15 Oct (for example WP-F04-18, WP-F16-17 to -19, F11-REQ-029, F16-REQ-029).

## R9 (delivery readiness, traceability, date math, facts)

| ID | Sev | Decision | What was done, or why not |
|---|---|---|---|
| R2D-01 | P0 | Handled | New milestone T41: the PRD V2 docs PR merges to `develop` on Mon 19 Oct; until then the section 9 header says to work from `origin/docs/prd-v2`. The header no longer says "stop at a local commit": it follows COORDINATION section 6 as written (agents never commit), and the coordinator commits each stream's diff and opens the PR until the founder answers Q3. T02 and T03 are recorded as slipped in a new 08 section 1.1 and re-dated (Mon 19 Oct, Tue 20 Oct). Editing COORDINATION and logging D-089 stay the coordinator's wave 0 items (08 5.1), due T41 |
| R2D-02 | P0 | Handled | Section 6.3 now holds every unbuilt or partly built WP with a P0 requirement: 147 added work packages (153 slots, since five span streams) plus the WP-F11-09a spike, in two tables (before C1, and wave 4). 17 more are covered by a 13 Oct item under another name, listed by name. Never-cut items R9 named are in: WP-F06-04, WP-F16-04, WP-F17-03, WP-F15-02 to -04, WP-F01-04, -05, WP-F03-06, WP-F09-05. WP-F17-07 was already built (switch off) per its spec row; its additions ride WP-F17-10 and WP-F16-13 in wave 2. New 08 section 13 gives all 301 WPs a disposition. The date was recomputed from the new count (section 6.1) |
| R2D-03 | P0 | Handled | 08 6.1 now counts delegable PRs: 11 of the 115 old items and 9 of the round 2 slots, 20 of 281. Delegation saves about one week, not four. 09 DR-20 says the same. Widening the class (for example UI-only PRs with a green component test) is listed as founder option D in 08 2.5 |
| R2D-04 | P1 | Handled | 22 duplicates (R9's script saw 19; it reads only the first ID in a cell). The home spec keeps each ID; the other rows became `F##-REQ-080` and up, with "slice of X (home Fyy), renamed in round 2" in their Source column, and the bracketed tests in that spec's section 12 were renamed to match. Renames: F16 (A-REQ-015, A-REQ-033, the second DATA-REQ-043 row, DATA-REQ-046, LEGAL-REQ-032, PRD-REQ-004, LEGAL-REQ-006), F11 (B-REQ-016, C-REQ-007, DATA-REQ-015, LEGAL-REQ-032, LEGAL-REQ-054, PRD-REQ-004), F17 (B-REQ-016, LEGAL-REQ-003, PRD-REQ-013, PRD-REQ-018), F10 (C-REQ-010), F08 (DATA-REQ-010 and -011, LEGAL-REQ-014, LEGAL-REQ-022, DATA-REQ-050 and -051), F14 (PRD-REQ-017). The 080 range was used so the renames cannot collide with IDs the R8 lane was adding the same day |
| R2D-05 | P1 | Handled | WP-F17-15 is back in v1.0 (wave 4, S14); 6.4 and 05 no longer cut it. No counsel relaxation is assumed |
| R2D-06 | P1 | Handled | 35 cited IDs got home rows under "Inherited requirements whose home is this spec" in F01, F02, F05, F08, F11, F14, F15, F16, F17, F18, F19, F20 and F21, with wording taken from `ENGINEERING_REQUIREMENTS.md`, `DELETION_AND_EXPORT_SPEC.md` or PRD 1.3 appendices on `develop`; every P0 among them has a WP and a test. The other 31 are listed in `10-changes-from-1.3.md` section 3 and 3.1 with their standing (v1.1, later, done, superseded). DATA-REQ-054 and -055 now have rows (P1, as their source says) |
| R2D-07 | P1 | Handled | F06 WP-F06-07 now says local migration v10 and "from v0 to head"; the S03 wave 2 row puts WP-F12-02 (v7) first |
| R2D-08 | P1 | Handled | BL-406's `write.tsx` half is a request to S10; BL-380 left the S10 brief (it is Read together keep-awake in S13's file); WP-F04-15's `lib/a11y.ts` change is a request to S15. Owners added: S01 `lib/secure.ts`, `app/keep-the-book.tsx`, `app/sign-in-email.tsx` and the WP-F02-11 and -13 function folders; S14 `app/consent/sensitive.tsx`; S12 `test/age-range.test.ts` |
| R2D-09 | P1 | Handled | The header lists the pairs that count as one slot (S02 two pairs, S11, S16 copy delta, S18). The S12 brief is WP-F01-01 only; BL-383 and BL-426 take M-JR reserve slots. The S20 brief no longer lists BL-117 (it is WP-F14-18, wave 4) |
| R2D-10 | P2 | Handled | W2 founder merges set to 10 in 08 6.1 and used in the date |
| R2D-11 | P1 | Handled | The candidate run is booked from the 07 2.7 table: 24 operator hours with 5 languages, 28 with 7, over four days (T33, Mon 26 to Thu 29 Apr); the `[manual]` suite starts on the freeze build in W26; the holiday regression row is 3 hours a week, stated once |
| R2D-12 | P1 | Handled | T12 now includes the Q-002 decision; 08 10.1 gives the fallback (borrow a never-updated phone, or the founder signs the floor as untested in G4) |
| R2D-13 | P1 | Handled | 07 4.4 item 1 says the 14 days count on the switch-on build; T19 (Mon 23 Nov) is 14 days before T22 (Mon 7 Dec) |
| R2D-14 | P1 | Handled | The G3 work packages are named in the "before C1" table (25 slots: Settings shell, consents and withdrawal, book delete screens, export format, leak and visibility suites, deletion verification on staging, and others); T21 waits for them |
| R2D-15 | P1 | Handled | 07 1.2 item 5 says timestamps are given at merge; the 07 load-test line says "per 08 Q8" until T15 |
| R2D-16 | P1 | Handled | WP-F01-02 is in the "before C1" table, ahead of WP-F01-07 (wave 2, S12) |
| R2D-17 | P1 | Handled | WP-F11-09a (delegable spike) is in the "before C1" table, ahead of WP-F11-09f; 10.4 APNs key row re-pointed |
| R2D-18 | P2 | Handled | 08 5.4 says six M-JR slots |
| R2D-19 | P2 | Handled | One slack number in 2.2 row 3, 2.4 and 2.5: about 8 weeks for C1 or backup, provided backup gets 4 weeks of C1 use before T33 |
| R2D-20 | P2 | Handled | README spec table re-run and dated 15 Oct; a traceability counts table added |
| R2D-21 | P2 | Passed | `01-problem.md` section 4 is outside this lane's files; PM lane |
| R2D-22 | P2 | Passed | `01-problem.md` section 2.4; PM lane |
| R2D-23 | P2 | Partly handled | Bracketed tests added to WP-F11-04 (`[F11-REQ-026]`), WP-F09-10 (`[C-REQ-015]`), WP-F08-B6 (`[F08-REQ-031]`), and to every WP that received a mapped requirement. Not done: WP-F00-01 still has no spec row (it is cross-cutting and lives in 07 2.1 L2 and 08 S15; adding a WP to a spec is more than a mapping fix); the two spikes (WP-F08-B1, WP-F11-09a) prove findings in evidence files, not requirement tests |
| R2D-24 | P2 | Handled | The S02 brief says to amend the unapplied `20261005000000_family_cap_language_idempotency.sql` for BL-331 and BL-332 (no hosted project has it) and put anything else in new files [R] |
| R2D-25 | P2 | Handled | S11's wave 1 row carries the `review.tsx` gate call for WP-F14-20 on S06's request |

## R7 (product and design)

| ID | Sev | Decision | What was done, or why not |
|---|---|---|---|
| R2P-01 | P0 | Handled | Same work as R9 R2D-02: one row per section 12 WP in 08 section 13; the slot count and confidence re-run. No P0 requirement's WP was put in 1.0.x, so no spec downgrade was needed |
| R2P-02 | P0 | Handled in 08 and 05; one label passed | 6.4 now states the rule that a cut never removes P0 work and checks each row. WP-F06-10, -11, -12, WP-F17-15, WP-F18-02, -06 and -09 are back in v1.0 (the F18 three were also cuts that P0 lines needed). WP-F06-11 is named as save paths in 08 and 05. WP-F17-08, WP-F18-10 and WP-F18-14 stay cut because their P0 lines bind only if the extra ships, and LEGAL-REQ-007 was mapped to WP-F17-09. Passed: the WP-F06-11 label in F06 section 11 item 4 (section 11 is outside this lane's files; F06 owner). Downgrading any of these to P1 is the PM lane's and founder's call |
| R2P-03 | P1 | Passed | F02 6.1, the ask table, A-REQ-013 wording and PRD-REQ-001 Rev are product text, not ID fixes; PM lane and F02 owner. 08 is unaffected (WP-F13-05 priming card is in wave 4) |
| R2P-04 | P1 | Handled | 08 now uses F08's names everywhere: B5b restore (wave 2, T23), B5c Settings row and consent act (wave 3, before T27); S05 Takes, 5.3, 5.4, 5.6 and T23 re-checked. The R8 lane raised the same finding (R2A-10) and edits F08; F08 section 12 still reads B5b restore and B5c Settings row on 15 Oct |
| R2P-05 | P1 | Passed | The held-language behaviour is a product decision in F03 and F05 text; PM lane. Both WP-F05-05 (gate status) and WP-F19-08 (manifest `gate` field) are in the v1.0 list either way |
| R2P-06 | P1 | Handled | 08 section 1.1: which T ids passed with no answer, the defaults used, the re-dated T ids, and the COORDINATION position. README status line updated |
| R2P-07 | P1 | Passed | The promise line is in 03, 04 and F21; PM lane, with counsel at T30 |
| R2P-08 | P1 | Passed | A moderated Review test is a study for the PM lane (02 section 7). The new calendar leaves room: T19 is Mon 23 Nov and most Review work (WP-F06-08a, -09) merges later |
| R2P-09 | P1 | Partly handled | WP-F08-06 (keep-safe card and re-offer) is now scheduled (wave 4, S13). The metric and the re-offer rule are in F08, which the R8 lane edited on 15 Oct ("Owners with backup on (R7 R2P-09)"); not this lane's text |
| R2P-10 | P1 | Partly handled | WP-F13-03 (expecting prompts and new prompt writing) has a slot before C1 (S16), which matches F13 Q1's "before T22" default. The quality check and the repeat-after-6-months fallback are product text in F13; PM lane |
| R2P-11 | P2 | Passed | 03, F01, F11, F18 metric citations; PM lane |
| R2P-12 | P2 | Passed | 03 section 4.4 business frame; PM lane |
| R2P-13 | P2 | Passed | F21 age rating; PM lane with counsel at T17. 08 T35 still says 18+ as written today |
| R2P-14 | P2 | Partly handled | 08 no longer restates the C1 recruit numbers; it cites the recruit table in 02 section 7, which the PM lane makes the one source. The Android cell in Study 3 is 02 text; PM lane |
| R2P-15 | P2 | Passed | F11 section 1 wording and a 09 note; PM lane |
| R2P-16 | P2 | Passed | A decision rule for first-session words; PM lane (03, F05) |
| R2P-17 | P2 | Partly handled | 05 rank 4 now says job 3. Passed: F09 section 5 row, A-REQ-014 "free tries" wording (an acceptance-criteria text change, not an ID fix) and the F30 hook; PM lane. The suggested trace check for "free tries" and `book_access` is noted for S19's BL-002 |
| R2P-18 | P2 | Passed | Spec section 13 deadlines are outside this lane's files. 08 itself now dates every slipped milestone |
| R2P-19 | P2 | Handled for this lane's edits; rest passed | The round 2 lines added to 05 cite this disposition, not review ids. Thinning review ids elsewhere in 01 to 05 is the PM lane's |
