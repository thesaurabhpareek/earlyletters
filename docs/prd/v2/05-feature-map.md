# 05. Feature map and stack rank

Status: Draft V2.1, 13 Oct 2026. Revised after critique round 1 (R1 PL-01, PL-22, PL-25, PL-30, PL-32) and the founder's M15 to M17 (`_AUTHORING.md` section 3b). **Section 2 is the one source for what ships in v1.0.** Dates live only in `08-delivery.md` section 2.1; this file names milestone ids (T01 to T40) from there. `08-delivery.md` section 6.3 turns this rank into a work-package list that fits the merge budget.

## 1. How features are ranked

Rank is the order we would protect if we could ship only the top n. Four tests, in order:
1. **Does the core loop work without it?** Speak, keep, read. If not, it ranks first.
2. **Does it protect a promise?** Exactly as said, kept, private, yours always (03 section 1).
3. **How important is the job it serves, times how strong the evidence is** (02 section 4 gives both).
4. **Is it a store or legal duty?** These are not optional, but they are usually small, so they rank by size of risk, not by value.

**P0** means v1.0 does not ship without it: the core loop, a promise, a legal or store duty, or scope the founder fixed for v1.0 (M14: sign-in, sync, co-parent, owner backup, status report; M15: keep all of it and move the date). **P1** means it ships in v1.0 only if it is already built or fits a slot; it is cut first, before the date moves (M15). Inside a P0 feature, the P1 extras are named in the last column and are out of v1.0 now (`08-delivery.md` section 6.4).

Build order is different from rank: some low-ranked features (account, sync, config) are dependencies of higher-ranked ones and start early (section 4).

## 2. v1.0 features, stack-ranked

| Rank | ID | Feature | P | Why here | Gate type | Depends on | P1 extras cut from v1.0 now |
|---|---|---|---|---|---|---|---|
| 1 | F04 | Capture: speak or type a note or letter | P0 | The product. Jobs 2 and 3. Lost recordings are the category's most repeated complaint (R1, R2) | Core loop, durability | F19 (config), design system | WP-F04-12 widget |
| 2 | F06 | Faithful edit and review | P0 | The constitution. What we can claim and others do not: the app shows every change the machine made and lets you undo it (04 section 4). The engine still has open English defects (R-01) | Core loop, promise | F05 | Lock a phrase, unsure marks and the engine audit (WP-F06-10, -11, -12); WP-F06-13 offered fillers. The author-layer core (WP-F06-06, -07) stays: DATA-REQ-041 needs hand edits to replay |
| 3 | F05 | On-device transcription and language packs | P0 | Speak-first needs text. Seven languages built; each ships only when it passes its gate (DR-01 default A, decided at T18). Positioning leads with the languages that pass (04 section 5) | Core loop | F04, F19 pack delivery | none |
| 4 | F08 | Recordings: original, listening copy, playback, owner backup | P0 | Voice is the keepsake (job 6); the original is never altered (B6); the owner's encrypted backup is v1.0 with a recovery key we hold under logged access (D-073, M14, M15, M16) | Promise | F04, F02, F16 | none |
| 5 | F09 | The book: month chapters, Before You, cards | P0 | Where the value accumulates; ordering by the moment is a complaint elsewhere (R2 section 0 item 6) | Core loop | F03, F04 | WP-F09-11 search |
| 6 | F17 | Settings, privacy controls, consents and deletion | P0 | Job 1. In-app deletion is mandatory (App Review 5.1.1(v)); consent records are legal duties | Promise, legal, store | F02 | WP-F17-08 app lock; WP-F17-15 delete everything on this phone |
| 7 | F07 | Names and words dictionary | P0 | A misheard name loses trust fast (U4); only one competitor claims name handling (R1 F07) | Promise | F03, F05 | WP-F07-07 say the name three times |
| 8 | F01 | Entry, 18+ gate and welcome | P0 | Small, legal, first screen anyone sees; Texas SB 2420 in force (R4); California AB 1043 in force before launch (T32) | Legal, store | none | none |
| 9 | F03 | First run: child, signature, languages, names | P0 | Feeds F05 (languages), F07 (names), F09 (age math); only name and date required (B-REQ-001) | Core loop | F01 | none |
| 10 | F02 | Account and sign-in | P0 | Keeps the book beyond one phone; gate to every M14 server feature; Apple, Google, email link (B3) | Durability, M14 | F01, domain | none (Google is P0 per B3; ROADMAP 2.1 cut 2 stays a founder option, not the default) |
| 11 | F16 | Sync, devices and restore | P0 | Text reaches the co-parent and a new phone; no silent overwrites (R2 section 0 item 1; R2 AR-02) | Durability, M14 | F02, D-023 | `book_access` (WP-F16-02, v1.2 per D-055); full load test (08 Q8) |
| 12 | F11 | Co-parent sharing | P0 | Both parents write to one book (M14). Inside one Apple Family the payer's Plus covers both; outside it, the co-parent has their own 2 free letters, then Plus (M17, D-080). Evidence for co-parent demand is thin (1 of 287 reviews, 02 P2), so Study 3 runs in C1 | Promise, M14 | F02, F16 | WP-F11-13 QR invite |
| 13 | F15 | Export and the PDF book | P0 | "Yours, always": every letter already made stays exportable (M1); the shutdown pledge depends on it (PRD-REQ-009, LEGAL-REQ-034) | Promise, legal | F09, F08 | none |
| 14 | F14 | Plus: the membership | P0 | Carries the business: 2 free letters, counted once their words exist and you have seen them (M1, M17), then Plus at Keep; $4.99 and $49.99 (M3). Plan reminders on the phone and by email are legal duties (M6, M14) | Revenue, legal | F06, F04, F13, F17 | none |
| 15 | F13 | Prompts, reminders and notifications | P0 | Prompts are the top praised feature of prompted journals; repetition the top complaint (R2 section 0 item 4). Due-date silence and the quiet window protect P3 | Habit | F03, F19 | Picking which evenings; Apple's rating request (WP-F13-13); prompts from the content block (WP-F13-09) unless a slot frees |
| 16 | F12 | Multiple children | P0 | Twins and siblings at first run; every book free to start (M2). "Quiet this book" for the worst days (R3 DX-05) | Core | F03 | none (B-REQ-020 and the multi-book invite picker are already later) |
| 17 | F19 | Server-driven content, remote config, kill switches, pack delivery | P0 | Kill switches are a legal duty (LEGAL-REQ-040); packs need delivery (B13); prompts are server-delivered (B14) | Platform | `packages/api` | none |
| 18 | F20 | Help, support and safety resources | P0 | Static "If you are struggling" row replaces the classifier (B7); support path for beta and for loss | Trust | F17 | none |
| 19 | F21 | App Store listing, website and legal pages | P0 | Required to ship; the listing must not be generic against "voice memory book" entrants (04 section 5) | Store, legal | all | none |
| 20 | F18 | Analytics and the learning loop | P0 for consent, the guard and the letters-made and letters-kept events; P1 for the rest | Founder decision (D-003, B10); must never cost a feature (LEGAL-REQ-003). The business number comes from App Store Connect, not from opt-in events (03 section 4) | Learning | F17 consent | WP-F18-02, -06, -09, -10, -14, -15 (the automated loop starts on 1.0.x data) |
| 21 | F10 | Read together | **P1** | Built with no session limit (M2). Launch users are mostly expecting or newborn parents, while Read together suits ages 2 to 5 (R1 PL-30); it ships because it is built and needs only device checks plus the skip and night-surface work (WP-F10-10), and it stays out of the first three screenshots unless C1 shows use | Value | F08, F09 | Word highlight (F34, v1.1) |

## 3. v1.1 and later, stack-ranked

Specs in `features/F30-later.md`. Order is the recommended v1.1 build order. The P1 extras cut from v1.0 (column 8 above, `08-delivery.md` section 6.4) come first in v1.0.x, in the order the founder picks after C1.

| Rank | ID | Feature | Release | Why here |
|---|---|---|---|---|
| 1 | F31 | Shared voice: family members hear each other's recordings | v1.1 | Family listening is v1.1 (DR-07): until then a co-parent cannot hear the other's voice. The owner's own backup is v1.0 (D-073, M14). If Study 3 shows mixed-language couples are a real share, this moves up for P4 books (R3 DX-10) |
| 2 | F32 | Close family contributors in the app | v1.1 | Grandparents seeing the baby is the second most praised theme in the category (R2 section 0 item 7); From, Mama already has it |
| 3 | F33 | Hindi and Arabic transcription where v1.0 missed the gate; Hindi-English code-switching | v1.1 | B4 intent; R5 section 9 |
| 4 | F34 | Read together word highlighting | v1.1 | B7; ADR 0009 alignment |
| 5 | F35 | Server transcription fallback with consent (AI gateway) | v1.1 | Helps languages that fail on device; requires the consent flow (LEGAL-REQ-004, -005) |
| 6 | F36 | Android | v1.1 | B7; one Expo codebase; also reaches a co-parent on Android (R1 PL-10) |
| 7 | F37 | Web contribution page | v1.1 | B1; grandparents without the app; a second product (TDD 10 risk 10) |
| 8 | F38 | Author's own second-language version of a letter | v1.1 candidate | DR-15; mixed-language couples (R2-S31) |
| 9 | F39 | Safety classifier, clinician-gated | v1.1 | B7, D-034 |
| 10 | F40 | Story intro (4 stories) | v1.1 | D-043 |
| 11 | F41 | Sealed letters | later | UR R21; Dearest has it (CR) |
| 12 | F42 | Printed books (Year One) with QR to audio | later | Print is the category's profit engine (CR section 3); K-32 |
| 13 | F43 | Lifetime and gifts | later | UR R18, R19; Tiny Treasures sells $99 lifetime (R1) |
| 14 | F44 | App interface localisation (Spanish first) | later | 44.9M US Spanish speakers (R3 section 2.1) |
| 15 | F45 | Next spoken languages: Tagalog, Vietnamese, Korean (and Urdu, Cantonese) | later | Tagalog, Vietnamese and Korean are each larger than Hindi in the US (R3 section 2.2) |
| 16 | F46 | Themes, author and child photos | later | B-REQ-019, B-REQ-024 |
| 17 | F47 | On this day, Year One celebration | later | C-REQ-013, C-REQ-014 |
| 18 | F48 | Vault mode and end-to-end keys | later | ADR 0006; only if asked for. Until then backup uses a recovery key we hold (M16) |
| 19 | F49 | Apple-hosted asset packs (iOS 26 and later) | later | DR-14 |

## 4. Build order (dependency layers), on the 08 waves

The layers stay; the calendar is `08-delivery.md` section 5. Most of L0 to L4 exists in code, so each wave is about device runs, fixes and the remaining gaps.

```
Wave 0 (T01 to T03)   Set up: decisions logged, PR triage, claims, numbering rules
Wave 1 (T03 to T16)   L0 guardrails: R-17 security gate, CI fence, staging from develop, harnesses;
                       the five ADRs (sync, backup, status report, deletion, kill switches);
                       BL-342 plan reminders; M17 ledger; counsel delta; first build and spikes (T04, T11)
Wave 2 (W4 to W6)     L1 to L4 server features in a build: sign-in on, sync fixes, co-parent, push,
                       status report, backup client behind a flag (T23); C1 from T22
Wave 3 (W7 to T28)    Backup to C1 families (T27); Google; reminder emails; last features; C1 fixes
Wave 4 (T29 to T36)   Freeze, counsel sign-off (T30), candidate run (T33), C1 exit (T34), submit (T36)
```

## 5. If the date slips: what is cut, and what never is

M15 sets the rule: keep every P0 feature and move the date. Before the date moves, only P1 extras are cut, in this order (`08-delivery.md` section 6.4):

| Order | Cut | Note |
|---|---|---|
| 1 | The P1 extras in section 2 column 8 | Already out of v1.0 |
| 2 | F18 events beyond the letters-made and letters-kept events | The ASC business number does not depend on them |
| 3 | M-JR majors that no gate names | Each goes to 1.0.x with its BL id |
| 4 | Then the date moves | M15 |

Not cuts, and not the default: a language that fails its gate on the SE 3 is held back by DR-01 (a gate, decided at T18), and ROADMAP 2.1 cut 2 (no Google sign-in) and cut 4 (build without the PostHog key) stay founder options. The old cut "StoreKit not green: ship v1.0 free and add Plus in 1.0.1" is removed (R1 PL-22): it would give launch users unlimited letters and then a gate, the take-back 03 principle 6 forbids. If StoreKit is not green, submission slips.

**Never cut for v1.0:** the verifier and its non-English fix; the immutable raw transcript; crash-safe capture; export; in-app account deletion with Apple token revocation (BL-330); the 18+ gate and the AB 1043 age signal; consent before any analytics; server-side access checks and the R-17 gate; accurate claims, including the plan reminders the Subscription Terms promise (BL-342) unless the Terms change instead; "If you are struggling"; and, under M15, sign-in, sync, co-parent sharing, the owner's encrypted backup and the status report with reminder emails. If any trial or renewal is sold, the auto-renewal reminders ship in whatever form counsel accepts.
