# Disposition A: critique round 1 findings in the PM lane's files

Status: 13 Oct 2026. Lane A owns `01` to `05`, `08`, `09`, `10`, `README.md`, `features/F10`, `F12`, `F13` and `F14`. This file records what lane A did with every finding from `R1` to `R6` and `STALE-OUTSIDE-PRD.md` that lands in those files, with a reason for each rejection. Findings that land only in other lanes' files are listed as "Other lane" with the part lane A did, if any. Founder decisions applied: M15 (keep full scope, move the date), M16 (recoverable backup, plain copy), M17 (count your own letters once their words exist and you have seen them).

Actions: **Fixed** (done as the critic asked); **Fixed differently** (done, by another route, reason given); **Partly** (the part in lane A's files is done; the rest named); **Raised** (a decision row or question with a spec default, because only the founder or counsel can decide); **Rejected** (not done, reason given); **Other lane** (not lane A's file).

## Headline results

- New submission week: **week of Mon 11 Jan 2027 (T36)**, about 50% confidence [A]; about 80% by the end of the T37 buffer. Set from a merge budget of about 16 a week and a 128-slot v1.0 list (`08-delivery.md` sections 2.2, 6.1, 6.3).
- Every date is in `08-delivery.md` section 2.1 (T01 to T40, W0 to W13); lane A's other files use the ids.
- Rejected outright: R1 PL-11 (move backup to 1.0.x; M15 keeps it), the cut-order parts of R1 PL-01 and R5 section 5 items 6 and 7 that cut backup or the status report (M15), and the lint extensions in PL-03, DX-07 and DX-39 (the lint tool is not lane A's file; requested from the coordinator).

## R1 Product leader

| ID | Sev | Action | File | Note |
|---|---|---|---|---|
| PL-01 | P0 | Fixed differently | 05, 08 | Real P0 and P1 in 05 section 2 with the P1 extras cut now; F10 is P1. A 128-slot v1.0 list in 08 section 6.3 (115 named, 13 reserve). **Rejected part:** adding owner backup and co-parent invites to the cut order. M15 keeps both in v1.0 and moves the date instead |
| PL-02 | P0 | Raised | 03, F14, 09 | 03 principle 6 states what `GatedFeature` holds; F14 section 1 is the one source for Plus contents; "backup as a Plus feature" removed from F14 Later; DR-18 default free [R], founder at T07. F08's default is also free (Disposition B) |
| PL-03 | P0 | Partly | 08, 05, 09, F10, F12, F13, F14 | One date table (08 section 2.1); lane A's files carry milestone ids only. Other specs (F05, F17, F20, F21, 07) are other lanes. **Rejected part:** a lint rule failing on dates outside 08, because `tools/lint.mjs` is not lane A's file; requested from the coordinator |
| PL-04 | P0 | Other lane | F13, README | F02 is another lane's. F13 now states co-parent pushes are v1.0 (M14) |
| PL-05 | P1 | Fixed | F14, 03 | M17: F14-REQ-037, F14-REQ-038; activation metric "first spoken letters with words on screen in the first session" in 03 section 4.2 |
| PL-06 | P1 | Fixed | 03, F14, 09 | Named a hard paywall with a two-letter sample (03 section 4.4, F14 section 1); the 5% is the headline business number (03 section 4.1); pre-committed allowance rule in F14 section 6.9 and F14-REQ-042; DR-21 |
| PL-07 | P1 | Fixed | F14, 02 | Standing Tonight line before recording (F14-REQ-040); 02 Buyer row rewritten |
| PL-08 | P1 | Fixed | F14, 03 | Held letters sync as author-only drafts, back up with owner backup, export under `waiting/`, survive sign-out (F14-REQ-039, WP-F14-22); promise 4 and PS7 rewritten |
| PL-09 | P1 | Fixed | 04, 09, F14 | DR-16 answered by M17 (counting) and D-080 (coverage); 04 row says "one membership" only for one Apple Family. F11 and listing drafts are other lanes |
| PL-10 | P1 | Partly | 02 | Android co-parent case and U8 in 02; the `/j` page wording is F11's |
| PL-11 | P1 | Rejected | 08 | M15 (founder, 13 Oct) keeps backup and co-parent in v1.0. What the finding worried about is handled instead: backup reaches C1 families at T27 with about four weeks of use before the candidate, and the R-17 gate (T16) is a hard precondition for co-parent in C1 |
| PL-12 | P1 | Fixed | 04, 05, 09 | Positioning leads with languages that pass (likely English and Spanish [A]); no "your family's languages" subtitle until three pass. F21 is another lane |
| PL-13 | P1 | Fixed | 03 | Section 4.5: channels, cost, an 8-week target derived from R3, the read at T39. No channel evidence exists; all [A] |
| PL-14 | P1 | Fixed | 02, 08 | Study 2 fielded at T08; Study 1 inside C1 from T22 (read at T26, before the freeze); Study 3 in C1 from T24; decisions each can change |
| PL-15 | P1 | Fixed | 03 | Letters made against letters kept; weekly making families; WKF by plan state |
| PL-16 | P1 | Fixed | 03 | Field activation target dropped; lab and C1 observation; accounts over ASC downloads as a labelled proxy |
| PL-17 | P1 | Fixed | 03, F14 | Paying families over first-time downloads (ASC) is the headline business number; the opt-in gate funnel is diagnostic only |
| PL-18 | P2 | Fixed | 03, F14 | Basis and resetting reading for each [A] target; trial to paid split by plan; two voices set after C1 |
| PL-19 | P1 | Fixed | 09, F13 | DR-12 default is now B. F02's ask table is another lane (Disposition B says F02 notes it) |
| PL-20 | P2 | Partly | F14 | Vocabulary table in F14 section 6.2; renaming F02's account sheet is F02's |
| PL-21 | P1 | Partly | README, F10, F12, F13, F14, 08 | Triage rule in README; every question in lane A's files has a milestone id. Triage of the other 140 rows is each lane's |
| PL-22 | P1 | Fixed | 05, 08, F14 | "Ship free, add Plus later" removed everywhere in lane A's files; StoreKit not green means slip |
| PL-23 | P1 | Fixed | 08 | Q2 and Q2b at T02; delegated merge classes that never touch server, auth, payments or migrations (section 6.2, DR-20); a paid device operator (section 10) |
| PL-24 | P1 | Fixed | 04, 03 | Label row and PS4 rewritten to the expected M14 label [A] until counsel's label 1.4.0 (T30). F21's claims list is another lane |
| PL-25 | P2 | Fixed | 04, 05 | Claim narrowed to "shows every change the machine made and lets you undo it". 07 and the listing are other lanes |
| PL-26 | P2 | Fixed | 01, 02 | Labels corrected in 01 sections 2.6 and 4; 02 jobs ranked by importance then evidence |
| PL-27 | P2 | Fixed | 03 | Run-rate at month 12; one-off launch costs listed from FOUNDER_TASKS |
| PL-28 | P2 | Fixed | F14, 04, 02 | Price rule at T40 in F14 section 6.9; Study 3 carries pricing questions |
| PL-29 | P2 | Fixed | F13, 03 | F13-REQ-020 specified (P1); built first in 1.0.x (08 section 6.4) because no v1.0 slot is free |
| PL-30 | P2 | Fixed | 05, F10, 04 | F10 is P1, rank 21; out of the first three screenshots unless C1 shows use |
| PL-31 | P2 | Fixed | 04, F13 | Language kept out of the lead positioning (the critic's second option); prompts in other languages stay v1.1 |
| PL-32 | P2 | Partly | 05, README | Build window column and the README "M14 carried" column removed. The F15 duplicate row is another lane's |
| PL-33 | P2 | Fixed | 09, 03, 04, 05, 08, F10 | 09 decision cells shortened and code state moved out; stock phrases removed ("the one claim nobody else can make", "the honest read", "the moment is contested", "the floor the keepsake stands on") |

## R2 Architect

| ID | Sev | Action | File | Note |
|---|---|---|---|---|
| AR-01 | P0 | Other lane | 08 | F16 is another lane's. 08 schedules the sync protocol ADR (T13, T15) |
| AR-02 | P0 | Partly | 08 | Slots for compare-and-set (S02, fenced) and the conflict copy (S03) in wave 2; the rule is F16's and the ADR's |
| AR-03 | P0 | Partly | 08 | `book_access` out of v1.0 in S02 and section 6.4; F16 and 06 are other lanes |
| AR-04 | P0 | Fixed | F14, 08 | M17: F14-REQ-036 with the 30-letter join test; WP-F14-20 (the same work as F11's WP-F11-14; one PR, F14 its home) |
| AR-05 to AR-11 | P0, P1 | Other lane | 08, 09 | F08 is another lane's. 08 carries the backup ADR content list, S05 slots and B5 split, the key ceremony (WP-F08-B8); 09 R-19 |
| AR-12 | P1 | Partly | 08 | Build flags and kill-switch keys and consumers have slots (WP-F19-16, WP-F19-12a, b, f, r, s); F19 is another lane |
| AR-13 | P1 | Fixed | F14, 08 | `sub_ref`, `environment` with production-only emails, per (profile, `sub_ref`), signed-out queue, renewal projection: F14 6.6 rule 2b, F14-REQ-043, F14-REQ-046; ADR row in 08 |
| AR-14, AR-15 | P1 | Other lane | 08 | 06 and F16; listed in the ADR rows |
| AR-16 | P1 | Fixed | 08 | S02 owns shared functions; timestamps at merge (section 4, 5.7) |
| AR-17 | P1 | Fixed | 08 | Ownership moves in section 5.7 and the stream rows |
| AR-18 | P1 | Partly | F14, 08 | WP-F14-15a to c split in F14; other specs' splits are their lanes' (F08, F11, F19 have split theirs) |
| AR-19 | P1 | Fixed | 08 | Backup behind `capabilities.backup`, merged by T23, drill T25, on for C1 families at T27 |
| AR-20 | P1 | Fixed | 08 | The ranked list in section 6.3; everything else is built, cut, device work or 1.0.x |
| AR-21 | P1 | Fixed | 08 | Staging from `develop` by `workflow_dispatch` (S20, wave 1) |
| AR-22 | P1 | Partly | 08 | Deletion ADR and slots (S02, S07); F17's matrix is another lane's |
| AR-23 | P1 | Fixed | F14 | F14-REQ-026 is P1 with sync-build semantics; F17's surface is another lane's |
| AR-24 | P1 | Other lane | 08 | S10 has the microphone string in wave 2 |
| AR-25 | P1 | Fixed | README, 08 | Source order item 7 names the ADRs that supersede; the ADR list in 08 section 8.1 |
| AR-26 | P1 | Partly | 03 | Crash-free 99.8% is a post-release guardrail; C1 uses zero unresolved signatures. 07 is another lane |
| AR-27 to AR-35 | P1, P2 | Other lane | 08 | Listed in the ADR rows or S20 requests (entitlements, two signing keys at T04) |
| AR-36 | P2 | Fixed | F14 | Section 11 sequencing is order only. F05, F06, F08 are other lanes |
| AR-37 | P2 | Fixed | F12, F13, 08 | Version numbers in 08 section 4; F12 and F13 test from v0 to head |
| AR-38 | P2 | Other lane | none | F17 |

## R3 Design and research

| ID | Sev | Action | File | Note |
|---|---|---|---|---|
| DX-01 | P0 | Fixed | F14, 03, 08 | F14-REQ-039, WP-F14-22 across S02, S03, S05, S13; release gate; F08 backs up held audio (Disposition B) |
| DX-02 | P0 | Fixed | F14 | M17: words seen; voice-only letters never count until their words are saved (6.2 B2) |
| DX-03 | P0 | Fixed | F14 | Tonight line (F14-REQ-040); Study 2 tests it at T15 |
| DX-04 | P0 | Raised | 03, 09 | DR-18 default free; the principle says what changes if the founder chooses Plus |
| DX-05 | P0 | Fixed | F12, F13, 02 | Quiet this book (F12-REQ-011, F13-REQ-022); copy review with a perinatal loss and NICU organisation before C1. F20's runbook is another lane |
| DX-06 | P0 | Other lane | 08 | F04's; S10 has a wave 1 slot |
| DX-07 | P0 | Partly | F10, F14 | F10-U20 and F14-U20 fixed. Other specs are other lanes. **Rejected part:** banning the strings in `tools/lint.mjs`; not lane A's file, requested |
| DX-08 | P1 | Partly | F14 | Vocabulary table in F14 6.2; F06 adopts it in WP-F06-08a |
| DX-09 | P1 | Other lane | 08 | F06; S11 slot WP-F06-08a in wave 3 |
| DX-10 | P1 | Raised | 09, 05 | DR-15 recommends a language label and one line for readers; needs F11 and F16 (other lanes); F31 may move up after Study 3 |
| DX-11 | P1 | Fixed | F14 | Family Sharing line and Apple's help link before See Plus (6.2 E2, F14-U21) |
| DX-12 | P1 | Fixed | F12 | Per-person hide (B-REQ-014 Rev), note and 72-hour undo, birthday confirm (F12-REQ-012, -013). F11 and F16 point here (Disposition B) |
| DX-13 | P1 | Partly | F10 | Night surface in Read together (F10-REQ-021); Listen is F04's |
| DX-14 | P1 | Partly | 02 | Study 1 records whisper and white-noise clips for the corpus; F04 and F05 are other lanes |
| DX-15, DX-16 | P1 | Other lane | none | F02, F01 |
| DX-17 | P1 | Fixed | F10 | Letter list, per-letter skip, `hard` prompts start unticked (F10-REQ-020), grounded in `entries.prompt_key` |
| DX-18 | P1 | Fixed | F13 | Early-birth question (F13-REQ-021); corrected-age titles recorded as a v1.1 decision for F09 |
| DX-19 | P1 | Partly | 02 | U8 and the P2 case; F11 is another lane |
| DX-20 | P1 | Other lane | none | F06, F09, F16 |
| DX-21 | P1 | Partly | F10 | `accessibilityLanguage` per letter in Read together (F10-REQ-022); 07 is another lane |
| DX-22 | P1 | Fixed | F14 | One held row and the add-waiting offer (F14-REQ-041) |
| DX-23 | P1 | Other lane | none | F05, F02 |
| DX-24 | P1 | Partly | 08, F13, F14 | S15 defines QuietLine, SoftCard, NoticeRow and Toast in wave 3; lane A removed adjective-only uses where it rewrote lines. **Rejected for now:** replacing every "quiet" and "calm" in lane A's specs, because the named components do not exist yet; the replacement follows S15's PR |
| DX-25 | P1 | Partly | F13, F14 | Proposed copy for every new key in F13 12.1 and the Keep sheet in F14 6.2; other specs are other lanes |
| DX-26 | P1 | Fixed differently | F14, 08, 02 | Voice-only letters go into the book uncounted (F14 6.2 B2; DR-19 has the alternative); C1 recruits 4 Hindi and 2 Arabic speakers (08 W1) |
| DX-27 | P1 | Other lane | none | F21; 04 positioning is consistent with it |
| DX-28 | P1 | Fixed | 02, 03, 01 | Job relabelled Medium [S] with the method caveat; "why they leave" removed |
| DX-29 | P1 | Fixed | 02, 01, 09 | The reading claim is [A]; DR-15 decided from Study 3 |
| DX-30 | P1 | Fixed differently | 02, 08 | Study 2 starts now (T08). Study 1 runs inside the first external beta (T22) as the lead instructed, not this week; with the date moved its read-out (T26) still lands before the freeze (T29), so it can change v1.0. 07's dates are another lane's |
| DX-31 | P2 | Other lane | none | F01, F03 |
| DX-32 | P2 | Fixed | F13, 09 | Calm evidence relabelled [S]; DR-12 decider is the C1 cohort test at T34 |
| DX-33 | P2 | Fixed (checked) | F13 | F13's Remento row already says Trustpilot; other specs are other lanes |
| DX-34 | P2 | Fixed | 02 | Moved to P4 Reality check; an [A] fear added for Study 1 |
| DX-35, DX-36, DX-38 | P2 | Other lane | none | F09, F08 |
| DX-37 | P2 | Fixed | F14 | One channel per notice per day above the legal minimum (6.6 rule 6, F14-REQ-047) [R] |
| DX-39 | P2 | Partly | 03, 02, 08, F10 | Principle 9 is a test; "floor" and self-praising "honest" removed from lane A's files. **Rejected part:** new lint patterns; the lint tool is not lane A's file, requested |

## R4 Privacy, trust and safety

| ID | Sev | Action | File | Note |
|---|---|---|---|---|
| PT-01 | P0 | Partly | 03, 02, 08 | Lane A's wording follows M16 (recovery key held under logged access; no "only your family's keys"). Legal texts, content and the microphone string are other lanes; S17's brief and T05 carry them |
| PT-02 | P0 | Partly | 03, 02 | The false "only the author's devices" line in 02 P2 fixed. F08 is another lane |
| PT-03 | P0 | Other lane | 09 | F17; R-19 and the backup ADR require the access log |
| PT-04 | P0 | Fixed | 08 | Website hotfix at T06 by S20 |
| PT-05 | P0 | Fixed | 08 | COUNSEL_PACKET 1.1.0 at T05 with the full document list |
| PT-06 | P0 | Partly | README, 08 | README source order: the legal default is built until counsel answers. The rule that only counsel retires a LEGAL-REQ is a change to `_AUTHORING.md` section 2, which is not lane A's file; requested from the coordinator and founder. ENGINEERING_REQUIREMENTS 1.3.0 is in S17's brief |
| PT-07 | P0 | Other lane | none | 06 |
| PT-08 | P0 | Fixed | F14 | (a) Q-C1 lists counsel's three options; (b) billing-notice record after deletion, F14-REQ-045 [Counsel]; (c) renewal projection, F14-REQ-046 |
| PT-09 | P1 | Raised | F14 | Counsel question on consent record linkage (6.6 rule 2, Q-C3); BL-342 is in wave 1 |
| PT-10 | P1 | Fixed | F14 | Notices key on free period and offer type; `none_outside_app`; no code over 31 days free until counsel (F14-REQ-044, Q-C11) |
| PT-11 | P1 | Fixed | 08, 09 | AB 1043 is in force before submission (T32); WP-F01-07 in builds from T27; R-13 |
| PT-12 | P1 | Fixed | 09 | DR-10 at T17 including whether `age_signal` may be stored |
| PT-13 | P1 | Fixed | 03, F14 | The scoped sentence in promise 4; held note by sign-in state. B-REQ-025 and F21 are other lanes |
| PT-14 to PT-17 | P1 | Other lane | 08 | F11, F20; S04 brief names the no-default leave sheet |
| PT-18 | P1 | Partly | F12 | Hide asks the other parent; due-date deletion offer; billing emails named in F12 6.2 G. F20's S-1 runbook is another lane |
| PT-19, PT-20 | P1 | Partly | 08, 09 | S01 takes `new-device-sign-in`; R-17 lists BL-332 and BL-349. F02 and F08 are other lanes |
| PT-21 | P1 | Raised | 08 | Scoped external security test at T24 if the founder approves (Q10); cost unknown |
| PT-22 to PT-29 | P1 | Other lane | 08 | F17, F08, F21, legal; B5b carries the backup consent act |
| PT-30 | P1 | Fixed | 09 | DR-11 at T15 |
| PT-31 | P1 | Fixed | 08, 09 | No outside family signs in before counsel's comments (T17, T20, R-17) |
| PT-32 | P1 | Other lane | none | `STALE-OUTSIDE-PRD.md` is not in lane A's file list |
| PT-33, PT-34 | P2 | Other lane | none | F20, F08, F17 |
| PT-35 | P2 | Fixed | F14, 08 | Review notes need a demo account for sign-in features (F14 6.8, T35) |

## R5 Engineering and QA

| ID | Sev | Action | File | Note |
|---|---|---|---|---|
| EQ-01 | P0 | Fixed | 08 | Fenced cap 4 a week, 6 in W2 for the R-17 batch with one shared security review; 25 fenced items in section 6.3 against 33 fenced slots |
| EQ-02 | P0 | Fixed | 08 | C1 moved to T22; C0 switch-off from T10 gives more than 14 days; T19 schedules DL-01, deletion in staging, the kill-switch drill and BL-247 before C1. 07's G3 text is another lane's |
| EQ-03 | P0 | Fixed | 08 | Devices and keepers (10.1), hours by week (10.2), the cut-down candidate suite (10.3), a device operator (T12) |
| EQ-04 | P0 | Fixed | 08 | WP-F00-01 harness first in wave 1 (S15, pair); 8.3 item 8 until it lands |
| EQ-05 | P0 | Partly | F10, F12, F13, F14, 08 | One home per legacy ID in lane A's specs (PRD-REQ-001, PRD-REQ-014, PRD-REQ-015, PRD-REQ-020, B-REQ-014, C-REQ-019 moved or cited); S19's trace fails on duplicates. Other specs are other lanes |
| EQ-06 | P1 | Partly | README | PM lane adds one BL line per v1.0 WP (115) before wave 1; `docs/BACKLOG.md` is not lane A's file in this task |
| EQ-07 | P1 | Fixed | 08 | Each orphan assigned in section 3.3 |
| EQ-08 | P1 | Fixed | F10, F12, F13, F14 | Header line in each section 12: 08 section 3.3 governs ownership |
| EQ-09, EQ-10 | P1 | Partly | 08 | S20 adds `migration-guard`, `expo lint` and docs lint to `required`; S19 a nightly Maestro run. 07 is another lane |
| EQ-11 to EQ-15 | P1 | Fixed | 08 | Q3 before dispatch and a conditional header; claims closed; PR close rule; timestamps at merge; staging from `develop` |
| EQ-16 | P1 | Partly | 08 | C1 is 52 days; 07's tables are another lane's |
| EQ-17, EQ-18, EQ-20, EQ-28 | P1, P2 | Other lane | none | 06, 07, F19 |
| EQ-19 | P1 | Fixed | F13 | F13-REQ-023 cites F02 as home of the session definition |
| EQ-21 | P1 | Fixed | F14, 08 | WP-F14-15a to c |
| EQ-22 | P1 | Fixed | 08 | Template headings in S20's first PR; 8.3 item 6 |
| EQ-23 | P1 | Fixed | 08, F12, F13 | v6 to v10 numbered |
| EQ-24 | P1 | Fixed | 08 | 1.5 passes assumed; 12 a week founder-only, 16 with section 6.2 |
| EQ-25 | P2 | Fixed | F10, F12, F13 | Status 13 Oct column, checked against `origin/develop`; F14 keeps status in Mode |
| EQ-26 | P2 | Fixed | F10, F12 | WP-F10-06, WP-F10-03 and WP-F12-03 rows filled as removed with where the test lives |
| EQ-27 | P2 | Fixed | 08 | Section 5.7 and stream rows name the authoring stream per part |
| EQ-29 | P2 | Fixed | F10, F13 | Strings go to `packages/content` feature files |
| EQ-30 | P2 | Rejected for v1.0 | 08 | No slot for a `perf` profile and marker harness; the 06 owner marks device Gate rows that cannot be measured |
| EQ-31 | P2 | Fixed (recommendation) | 08 | Section 10.3; 07 owner adopts |
| EQ-32 | P2 | Fixed | 08 | `review/ready` and `review/security` commit statuses required on fenced paths |
| EQ-33 | P2 | Fixed | 08 | Daily batched request PR for S03, S16, S20 |
| Section 5 list | n/a | Fixed differently | 08 | R5's 60-PR list is the base of section 6.3. **Rejected part:** cuts 2 (co-parent push), 3 (Google), 6 (status report) and 7 (backup), because M15 keeps the full scope; cut 5 (F06 author layer) rejected for the core, since F06 shows DATA-REQ-041 replay breaks without it; its UI extras are cut |

## R6 Fact-check

| Item | Action | File | Note |
|---|---|---|---|
| Row 4 paid family leave | Fixed | 01 | "had access to", March 2023 |
| Row 6 mementos | Fixed | 01 | Full ranking from UR S8 |
| Row 13 Pew year | Fixed | 01, 02 | "(2015 survey)" |
| Row 14 label | Fixed | 01 | [S], vendor table (R5-S9) |
| Row 16 Tinybeans EBITDA | Fixed | 01, 04 | Positive only with a one-off $0.59M tax refund |
| Row 17 Qeepsake price | Fixed | 04 | $1.2M shares plus up to $1.5M performance rights; $24 to $54 per subscriber |
| Rows 18, 19 | Fixed | 04 | ARPU cause is [A]; ad revenue is Tinybeans' |
| Row 20 Haitian | Fixed | 04 | Haitian and Russian just smaller than Hindi |
| Row 22 FirstChapter | Fixed | 04 | $6.99 |
| Row 26 subtitles | Fixed | 04 | Both competitors' subtitles named |
| Row 27 Apple speech stack | Fixed | 04 | Apple Intelligence excludes; SpeechAnalyzer unconfirmed |
| Rows 29, 30 | Fixed | F14 | "median" dropped for 43.7%; RevenueCat's wording for 10.7% |
| Row 40 | Fixed | 03 | $44.6k |
| Check 3 row 2 | Fixed (F10 part) | F10 | `expo-keep-awake` installed; F04 is another lane |
| Check 3 row 20 | Fixed | 03 | Principle 6 names `GatedFeature` and `FreeForever` correctly |
| D-089 | Fixed | 08, README | "proposed, not yet logged" |
| F21-REQ-030, BL-064 | Other lane | none | F21, research |
| Found while editing | Fixed | F12 | The unsynced-only move rule lives in `apps/mobile/src/lib/db/repos/entries.ts`, not `store.ts` |

## STALE-OUTSIDE-PRD.md

Lane A does not own that file or the files it lists. Rows 1 (website) and 14 and 15 (ROADMAP) are scheduled in `08-delivery.md` (T06; ROADMAP 2.2 by the PM lane). Rows 10 to 12 (DECISIONS) are the coordinator's wave 0 task (08 section 5.1).

## Changes other lanes need to pick up

1. Ranks in `05-feature-map.md` section 2 changed for F10 (now 21, P1), F12 (16), F13 (15), F14 (14), F18 (20), F19 (17), F20 (18), F21 (19); the headers of F18 to F21 still show the old ranks.
2. F02's ask table should follow DR-12 B (prime right after the first letter).
3. F04 owns the Tonight line and the held-letters row (F14-REQ-040, -041), and its waiting-letter copy should match F14 6.2 B2.
4. F06 should use the save vocabulary in F14 6.2; WP-F06-08b depends on WP-F06-07, which stays in v1.0.
5. F16 should carry the author-only held-draft op and confirm whether `prompt_key` syncs (F10-U27).
6. F15 should add `waiting/` to "Export everything" (F14-REQ-039).
7. 07 should take the dates in `08-delivery.md` section 2.1, the G3-for-C1 items at T19 and the suite in 08 section 10.3.
8. `tools/lint.mjs`: a date rule (PL-03), banned stale strings (DX-07) and the DX-39 patterns, if the coordinator agrees.
9. `_AUTHORING.md` section 2: only counsel retires or relaxes a LEGAL-REQ or DATA-REQ (R4 PT-06), if the founder agrees.
