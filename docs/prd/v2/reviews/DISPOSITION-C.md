# Disposition C: critique round 1, capture, words, book, export and public-claims files

Reviser: senior PM and design lead (revision lane C). Date: 14 Oct 2026. Branch `docs/prd-v2`, not committed.

Files owned by lane C: `07-quality-bar.md`, `features/F01-entry.md`, `F03-first-run.md`, `F04-capture.md`, `F05-transcription.md`, `F06-faithful-edit.md`, `F07-dictionary.md`, `F09-book.md`, `F15-export.md`, `F18-analytics.md`, `F20-help-safety.md`, `F21-store-web.md`, `F30-later.md`; `research/R1` to `R5` for fact corrections only; `reviews/R6-fact-check.md` lines 17 and 80 for the lint. Every P0 and P1 finding that names one of these files is below, plus the P2 rows that were cheap. Copy keys and code claims were re-checked against `origin/develop` on 14 Oct (`packages/content/src/strings.en.ts`, `features/*.en.ts`, `permissions.en.ts`, `apps/mobile/src/lib/a11y.ts`, `apps/mobile/src/app/listen.tsx`, the test file list). No web page was fetched in this revision. Lint: `node docs/prd/v2/tools/lint.mjs docs/prd/v2`: clean.

Actions: **Fixed**; **Fixed differently** (closed another way, reason given); **Raised** (an open question with an owner); **Rejected** (reason given); **Other lane** (the fix belongs in a file lane C does not own; what C did in its own files is noted).

## Facts found wrong while revising (not in any review)

| File | What the spec said | What `develop` holds | Fix |
|---|---|---|---|
| F04 6.2 H | n/a | `listen.tsx` line 124 announces "Listening." after `beginTake` has started the recorder, and line 85 announces the elapsed time every minute while recording, so VoiceOver speech is in the recording today | F04-REQ-040, WP-F04-15 |
| F04 6.4 | `listen.startButton` (new), `pendingCopy.listen.audience` | `listen.ready.startButton`, `listen.audience`, `listen.toChild` exist in content | Copy table corrected |
| F04, F05, F06 | First-letter waiting card, no-speech and progress keys proposed as new | `wordsCopy.pack.*`, `wordsCopy.noSpeech.*`, `wordsCopy.preparing`, `wordsCopy.listening` and `speechSettingsCopy.*`, `speechConsentCopy.*` exist in `packages/content/src/features/` | Specs use the existing keys; `wordsCopy.listening` ("Part {n} of {count}") retired per DX-23 |
| F05 7.8 | `onboarding.dictionary.languagesBody` promises mid-sentence switching | It now reads "Your words stay in the language you speak. We never translate them." | 7.8 and F05-REQ-031 updated |
| F06 6.4 | `review.showOriginalLink`, `review.undoAllButton` exist; key names still contain `tidy` in `review.tidiedLabel`, `book.provenance.spokenTidied` | Neither button key exists; the built Review uses `review.view.fixes` and `review.view.exact`; the provenance key is `spokenFixed`; only `settings.tidy*` keys keep the word | Copy table corrected; F06 Q9 raised |
| F07 6.1 | `settings.dictionaryHelp` exists | Only `settings.dictionaryLabel` exists | Marked new with proposed text |
| F15 | `export.plaintextNotice`, `export.spaceLow` new; export row disabled by `settingsMore.exportNotYet` | `exportCopy.screen.privacyNotice`, `.lowSpaceBody` exist; `exportNotYet` is retired | Keys corrected |
| F03 6.2 | Speech download queued silently at the Ready screen | A first-run speech card exists (`speechConsentCopy`, `apps/mobile/test/speech-consent.test.ts`) | F03 step 4 and F05-REQ-042 use the card |

## Legacy IDs renamed in lane C files (R5 EQ-05)

Each row below replaced a lane C requirement row that restated a legacy ID owned by another spec. The legacy ID stays in force in its home; the lane C row is now a slice with its own ID. Homes were chosen by PRD 1.3 area (A entry, B first run and family, C habits and settings) and by which spec builds the behaviour. Other lanes: please keep the home row and rename any other restatement.

| Legacy ID | Home | Lane C rows renamed |
|---|---|---|
| A-REQ-002 | F01 | F05-REQ-048 |
| A-REQ-012, A-REQ-014 | F02 | F04-REQ-030, F04-REQ-031 |
| A-REQ-030 | F01 | F04-REQ-032, F05-REQ-049 |
| B-REQ-002, B-REQ-003, B-REQ-005 | F03 | F09-REQ-023, F05-REQ-046, F09-REQ-020 |
| B-REQ-004, PRD-REQ-012 | F12 | F04-REQ-033 |
| B-REQ-006 | F07 | F03-REQ-010, F05-REQ-047 |
| B-REQ-011 | F11 | F09-REQ-022 |
| B-REQ-014, PRD-REQ-015 | F12 | F09-REQ-024, F03-REQ-011 |
| B-REQ-015, C-REQ-011, C-REQ-012, PRD-REQ-005 | F13 | F09-REQ-021, F09-REQ-025, F09-REQ-026, F04-REQ-039 |
| C-REQ-016, K-13, K-14 | F17 | F20-REQ-006, F21-REQ-034, F20-REQ-021 (K-14 in F05 became F05-REQ-051, home F06 for the read card) |
| DATA-REQ-010, DATA-REQ-015, DATA-REQ-053, LEGAL-REQ-007, LEGAL-REQ-014 | F17 | F09-REQ-027, F09-REQ-028, F15-REQ-016, F04-REQ-034, F04-REQ-037, F18-REQ-028 |
| DATA-REQ-044 | F16 | F04-REQ-036 |
| DATA-REQ-046 | F08 | F04-REQ-035 |
| PRD-REQ-001 | F02 | F04-REQ-038, F18-REQ-027 |
| PRD-REQ-004 | F06 | F05-REQ-050, F09-REQ-029, F15-REQ-017 |

Lane C stays the home of: A-REQ-001, -002, -030, -035, PRD-REQ-019 (F01); B-REQ-001, -002, -003, -005, -012, B-NFR-007, -008, -009 (F03); LEGAL-REQ-011, DATA-REQ-048 (F04); PRD-REQ-004, DATA-REQ-040 to -042 Rev (F06); B-REQ-006 (F07); C-REQ-010, C-REQ-015 (F09); C-REQ-017, LEGAL-REQ-034, -050, DATA-REQ-050, -051, -052, -056, PRD-REQ-009 (F15); LEGAL-REQ-003, -012, -015, -016, -017, -043, PRD-REQ-016, -017, -018, C-NFR-005, C-REQ-034, B-NFR-001 (F18); LEGAL-REQ-045 (F21). Still defined twice across lanes after this pass: B-NFR-009 (F11), C-NFR-005, LEGAL-REQ-003, PRD-REQ-018 (F17), C-REQ-010 (F10), DATA-REQ-050, -051 (F08), PRD-REQ-004 (F11, F16), PRD-REQ-017 (F14). Each is lane C's home; the other lane renames.

## R1 Product leader

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| PL-03 | P0 | Fixed | F04, F05, F06, F07, F09, F20, F21, 07 | Milestone dates (freeze, go or no-go, counsel, C0, C1, submission) now name the milestone and point to 08 section 2.1. Question answer-by dates are kept as "needed by" dates; F05 says they move with 08 |
| PL-05 | P1 | Fixed | F03, F04, F05 | First letter before the model is a designed path (F04 6.2 G, F05-U01); download starts from the first-run speech card (F05-REQ-042); words that arrive later stay unreviewed until saved (F05-REQ-043). The count rule is F14's (M17, F14-REQ-037) |
| PL-12 | P1 | Fixed | F21 | Language claim split by gate (F21-REQ-032; 6.5; 6.6 row 9) |
| PL-15 | P1 | Fixed differently | F18 | Letters made versus kept defined in F18 6.5; WKF by plan state is not built because the server holds no plan state outside the D-080 status table, which F18-REQ-016 keeps out of analytics |
| PL-16 | P1 | Fixed | F01, F04, F18 | Activation measured in the lab and C1 only; field proxy labelled |
| PL-17 | P1 | Fixed | F18 | ASC-only paying families per first-time download by install week (section 3, 6.5) |
| PL-20 | P2 | Fixed | F06 | One save vocabulary (F06-REQ-043), matching F14; the F02 sheet name is lane B's |
| PL-25 | P2 | Fixed | 07 | 2.3 narrows the claim to the visible, undoable change list |
| PL-29 | P2 | Fixed | F21 | F21-REQ-033 review request after a good moment |
| PL-32 | P2 | Fixed | F15 | Duplicate export-time row removed |
| PL-33 | P2 | Fixed | 07 | Stock phrase in 2.3 removed |

## R2 Architect

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| AR-24 | P1 | Fixed | F04, F21 | F04-REQ-047 drops the storage sentence from the microphone string; section 8 and the copy row updated; F21 6.6 row 14 |
| AR-26 | P1 | Fixed | 07 | G4 and C1 exit use zero unresolved crash signatures over at least 500 sessions [A]; rates move to G5; C0 uses a 7-day signature rule |
| AR-27 | P1 | Other lane | 07 | 07 2.10 now cites the 06 bar and says why 5 minutes fails; 06 and F19 own the fix |
| AR-15 | P1 | Other lane | 07 | Load scenarios are 06's; 07 2.12 unchanged |
| AR-29 | P2 | Rejected | F05 | The memory entitlement is an S20 pair task under ADR 0015; F05 11.5's device spike measures memory first |
| AR-30 | P2 | Fixed | F05 | Measurement protocol row in section 9 |
| AR-31 | P2 | Fixed | F06 | Server columns land in v1.0 even if the author-layer UI slips (11.3) |
| AR-36 | P2 | Fixed | F04, F05, F06 | Sequencing is order only |
| AR-37 | P2 | Fixed | F03, F04, F05, F06, F07 | No hard-coded local schema versions |
| AR-10 | P1 | Other lane | F06 | F06-REQ-030 now says the row stays local but audio may back up (F08) |

## R3 Design and research

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| DX-01 | P0 | Fixed (export part) | F15, F21 | Letters not saved yet (held, not read back, typed) exported under `waiting/` (F15-REQ-018, U23, WP-F15-11). Sync and backup of held letters are F14-REQ-039 (lane A) and F08 (lane B) |
| DX-02 | P0 | Fixed | F03, F04, F05, F06 | F04 6.2 G with existing copy; download at the languages step; record-and-type letters wait without typing; the count happens only at a Save with words on screen (M17, F14). Starter model raised as F05 Q13, default no |
| DX-03 | P0 | Other lane | F04 | F14-REQ-040 adds the standing line on Tonight and Write; F04-REQ-045 points at it and keeps Listen free of Plus copy |
| DX-05 | P0 | Fixed | F09, F20, F03 | Quiet this book: per person, from the book menu, no reason asked, no loss words, reversible, no analytics event (F09 step 18, F09-REQ-030, WP-F09-12); S-1 leads with it. Raised: notification action (F13, F09 Q7); perinatal organisation review of the copy (F09 Q6) |
| DX-06 | P0 | Fixed | F04, 07 | Mechanism: `announce()` holds every message while the audio mode is `recording`; direct `AccessibilityInfo` calls in `listen.tsx` move to it; a one-element VoiceOver take layout read before the microphone is live; no label changes or live regions during a take; our own notifications held. Test: unit (`listen-voiceover.test.ts`, `a11y.logic.test.ts`) and device run VO-REC (07 V1c): F05 finds no speech in a silent VoiceOver take. Residual (another app's banner) stated with a hint |
| DX-07 | P0 | Fixed (lane C lines) | F03, F20, F21 | "Plus rule applies", "server-off build" and "No account is needed" lines resolved. Banning the strings in `tools/lint.mjs`: Other lane (coordinator owns the tool) |
| DX-08 | P1 | Fixed | F06 | Save to {child}'s book; Save just for me; Leave it waiting (F14); "kept" for durability only (F06-REQ-043) |
| DX-09 | P1 | Fixed | F06 | Default state: preselected primary, dateline sheet, collapsed rows (F06-REQ-042). Note versus letter kept inside the sheet with existing help lines (F06 Q10) |
| DX-10 | P1 | Fixed, depends on lane B | F09 | Language label and ask line (F09 step 5, F09-REQ-032, U26). Needs `entries.language` readable by members: raised in F11 Q11 |
| DX-13 | P1 | Fixed (Listen) | F04 | Dark colour set always; 40% chrome after 30 s (F04-REQ-042). Read together is F10's |
| DX-14 | P1 | Fixed | F04, F05 | Relative `stillHere` (F04-REQ-043); whisper and white-noise clips reported (F05-REQ-003); `wordsCopy.noSpeech.title` revised |
| DX-15 | P1 | Other lane | F02 | F05-REQ-042 notes the speech card counts in F02's ask table; F03-U24 adds no first-run question |
| DX-16 | P1 | Fixed | F01 | Confirm step after No; token kept through it (F01-U01, F01-REQ-002) |
| DX-18 | P1 | Fixed | F09, F03, F30 | One-time reminders question when a birth date is 21 or more days early, default off (F09 step 17, F09-REQ-031). Corrected age: v1.1 candidate [R] (F09 Q2, F30) |
| DX-20 | P1 | Fixed | F04, F06, F09, F15 | Stored `base_direction` per letter, synced to members (F04 11.3, WP-F04-14); fixture "Arabic letter starting with a Latin name" |
| DX-21 | P1 | Fixed | 07, F06, F09, F15 | `accessibilityLanguage` per letter; per-script line-height tokens [A]; VoiceOver script V1b; AX5 with four scripts |
| DX-22 | P1 | Fixed | F04 | Non-held drafts collapse at 3 or more; held letters use F14's single row |
| DX-23 | P1 | Fixed (F05) | F05 | Determinate bar; chunk numbers retired. Restore screen is F02 and F16 |
| DX-24 | P1 | Fixed (lane C) | F01, F03 to F07, F09, F15, F18, F20, F21 | Screen-state tables name COMPONENTS components; vague adjectives replaced. New components in `docs/design/COMPONENTS.md`: Other lane (design systems) |
| DX-25 | P1 | Fixed (lane C) | F01, F04, F09, F15, F20 | Proposed text for every new key in lane C files; Welcome labels proposed |
| DX-26 | P1 | Fixed | F03, F05, 07 | Record-and-type letters wait without typing and use no free letter; C1 recruits 4 Hindi and 2 Arabic speakers |
| DX-27 | P1 | Fixed | F21 | F21-REQ-032 |
| DX-28, DX-29 | P1 | Other lane (02), lane C lines fixed | F03, F06, F09, F18, F30 | Pew line labelled 2015 and about speaking; reading claim [A]; privacy review count marked directional |
| DX-30 | P1 | Fixed (07) | 07 | 07 dates now follow 08; scheduling studies is 02 and 08 |
| DX-31 | P2 | Fixed | F01, F03 | +885% relabelled [S], not used |
| DX-32 | P2 | Fixed (F18) | F18 | Calm row [S], vendor case study; DR-12 is 09's |
| DX-33 | P2 | Fixed | F04, F05, F06, F07 | Trustpilot, web link |
| DX-35 | P2 | Fixed | F09 | No empty-month rows; one end-of-book action; Study 1 compares (Q1) |
| DX-36 | P2 | Fixed | F09 | Years, "Asha turned 1." |
| DX-38 | P2 | Other lane | F06 | Request to F08 in F06 step 5 |
| DX-39 | P2 | Fixed (lane C) | F01, F05, F15, F30 | "Innovate quietly", "honest" self-praise removed; pattern lint is the coordinator's |

## R4 Privacy, trust and safety

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| PT-01 | P0 | Fixed (mic string), Other lane (legal set) | F04, F21 | F04-REQ-047; every legal sentence listed with owner in F21 6.6 rows 11 to 14 |
| PT-03 | P0 | Fixed (F20), Other lane (F17 line) | F20, F21 | F20-REQ-018 no longer supports "each one is logged"; F21 6.6 row 22 |
| PT-04 | P0 | Fixed | F21 | F21-REQ-030 and WP-F21-14: hotfix this week, separate from launch; 6.6 rows 1 to 8 |
| PT-06 | P0 | Fixed (07), Other lane (README, `_AUTHORING.md`) | 07 | 5.3: only counsel relaxes a LEGAL-REQ or DATA-REQ |
| PT-11 | P1 | Fixed | F01, 07 | M15 puts submission after 1 Jan 2027, so AB 1043 is v1.0 scope (F01-REQ-010, WP-F01-07, 07 5.2 item 11) |
| PT-12 | P1 | Fixed | F01 | Residuals written down; Texas below iOS 26.2 asked of counsel (Q3); `age_signal` raised with F02 |
| PT-13 | P1 | Fixed | F21 | Scoped claims; F14 adopted the held-note text |
| PT-15 | P1 | Fixed (F20 part) | F20 | S-8 tells the remaining parent; F11 copy is lane B's |
| PT-16 | P1 | Fixed | F20 | S-8 safety removal, 8 dry runs, backup responder or out of v1.0 |
| PT-17 | P1 | Fixed | F20, F30 | S-9 fiduciary runbook; Terms clause is legal lane; trusted person in F30 candidates |
| PT-18 | P1 | Fixed | F20 | S-1: billing emails continue with Manage and refund links, due date deletion, ask before hiding for both |
| PT-24 | P1 | Other lane, listed | F21 | 6.6 row 19 with owner and milestone |
| PT-25 | P1 | Fixed | F21, F01 | Claims list and 6.6 row 17; Welcome notice proposal |
| PT-26 | P1 | Fixed | F21 | F21-REQ-028 widened with an unregistered-claim test; missing claims added to 6.5 |
| PT-28 | P1 | Fixed (F18 part) | F18 | 90-day retention [R] for counsel; ids kept through the wipe until a 202; receipt is F17's |
| PT-31 | P1 | Fixed (F21 part) | F21 | Final legal pages before the first outside family (6.6 row 10); dates are 08's |
| PT-32 | P1 | Fixed | F01 | M14 pass done |
| PT-33 | P2 | Fixed | F20 | Mailbox provider on the subprocessor page; 12 months [R]; attachments deleted, checked monthly |
| PT-35 | P2 | Fixed | F21 | Notes describe sign-in, backup and recovery key; demo account (F21-REQ-031) |

## R5 Engineering and QA

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| EQ-02 | P0 | Fixed, Raised | 07 | G3 lists every item and a signed, dated deferral rule; 5.3 items never defer. M15 leaves time to run them; the founder still picks |
| EQ-03 | P0 | Fixed | 07 | Device rule (full suite on SE 3 iOS 17, smoke on current iPhone), budget table [A], second SE 3, operator (Q5) |
| EQ-04 | P0 | Fixed (lane C), Other lane (scheduling) | 07, F01, F03 to F07 | WP-F00-01 named in 07 2.1; `BL-Q08` noted as nonexistent; UI WPs use the AX5 device script until it merges. 08 schedules the WP |
| EQ-05 | P0 | Fixed (lane C) | all lane C specs, 07 | 35 rows renamed; homes table above; 07 1.1 item 7 says test maps define nothing |
| EQ-06 | P1 | Fixed differently | all lane C specs | Every P0 in lane C specs names its test file or run in a new test map (exists or new, checked against `develop`). BACKLOG lines are the PM lane's |
| EQ-07 | P1 | Raised | F03, F07, F15 | Stream proposals for WP-F03-04, WP-F07-04, WP-F15-09; 08 assigns |
| EQ-08 | P1 | Fixed | all lane C specs | Section 12 says 08 governs ownership |
| EQ-09 | P1 | Fixed | 07 | G0 lists only what `required` runs |
| EQ-10 | P1 | Fixed | 07 | L5 and G2 say what runs; proxy lines are manual until mitmproxy runs |
| EQ-16 | P1 | Fixed | 07 | Section 4 follows 08; 21-day C1 with a signed exception line if shorter |
| EQ-17 | P1 | Fixed | F04 | Constant 30-minute cap, no remote key |
| EQ-18 | P1 | Fixed (flagged lines) | 07 | F10 try-mode line deleted; F14 line rewritten; F02, F04, F05, F09, F15, F18, F20, F21 lines updated; header corrected. Full regeneration waits for BL-002 |
| EQ-19 | P1 | Fixed (lane C) | F04, F18, 07 | Session and order cited from F02 |
| EQ-21 | P1 | Fixed | F06 | WP-F06-08 split into -08a and -08b |
| EQ-23 | P1 | Fixed (lane C) | F04, F05, F06, F07, F03 | No version numbers; coordinator assigns |
| EQ-25 | P2 | Rejected | F01, F03, F18, F20, F21 | Status for these lives in section 7 status columns (F18, F20, F21) or section 11 "What exists" (F01, F03); a column rewrite is not cheap |
| EQ-26 | P2 | Fixed in part | F20 | WP-F20-08 names F20-REQ-011; spike and evidence WPs stay evidence-only |
| EQ-28 | P2 | Fixed | 07 | Stale counts removed |
| EQ-29 | P2 | Fixed | F04, F06, F07, F15 | `os_permission_result` reused; strings go to `packages/content/src/features/` |
| EQ-31 | P2 | Fixed | 07 | Phone rule scoped to manual and end-to-end lines |

## R6 Fact-check

| Item | Action | File | Notes |
|---|---|---|---|
| Check 1 row 1 (`F21-REQ-030`) | Fixed | F21 | Reference now F21-REQ-028. F21-REQ-030 is reused for the new website hotfix requirement |
| Check 1 rows 2, 3 (`BL-064`) | Fixed | R5 | BL-120 with a dated note |
| Check 2 row 16 (Tinybeans EBITDA) | Fixed | R3 | Sections 0, 4.1 and the inference, dated notes |
| Check 2 row 17 (Qeepsake price) | Fixed | R3 | $1.2M shares plus up to $1.5M performance rights; $24 to $54 per subscriber; dated notes |
| Check 2 row 20 (Haitian) | Fixed | R3, F30 | Haitian and Russian just smaller than Hindi |
| Check 2 row 26 (subtitles) | Fixed | R1 | Line 15, dated note |
| Check 3 row 2 (`expo-keep-awake`) | Fixed | F04 | Moved to installed |
| R6 lines 17 and 80 | Fixed | R6 | two quoted phrases rephrased without the banned word; meaning kept |
| Rows in 01, 03, 04, F14 | Other lane | n/a | Not lane C files |

## Requests to other lanes

- F02: the ask table should list the first-run speech card (F05-REQ-042); drop or classify `age_signal` (R4 PT-12).
- F08: reduced-volume start for Hear it (R3 DX-38); keep restore working through the 90-day pledge (F15 section 8).
- F11 or F16: make `entries.language` and `base_direction` readable by members (F09-REQ-032, -033; F11 Q11).
- F12: a per-person "quiet" flag in `child_member_prefs` (F09-REQ-030).
- F13: our own notifications are not presented during a take (F04 6.2 H step 6); Quiet this book as a notification action (F09 Q7).
- F14: F06-REQ-030 and F14 6.2 B2 have conflicting defaults for voice-only letters (F06 Q3 with F14 Q-F5).
- F17: replace `settings.privacy.staffAccess` (F21 6.6 row 22); mark an unconfirmed PostHog forget in the receipt (F18-REQ-019).
- Coordinator: ban "free tries", "Plus rule applies", "every v1.0 build", "server-off" in `tools/lint.mjs` (R3 DX-07); schedule WP-F00-01 (R5 EQ-04).
