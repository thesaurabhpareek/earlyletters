# 05. Feature map and stack rank

Status: Draft V2, 3 Oct 2026. Revised 13 Oct 2026: dates follow `docs/ROADMAP.md` 2.1 (week 1 starts Mon 5 Oct 2026; feature freeze Mon 26 Oct; submit to App Review in the week of Mon 2 Nov 2026; release planned Mon 16 Nov, with 9 to 20 Nov as the buffer for one rejection), and the F10, F12 and F14 rows follow the membership (M1, M2). The "Build window" column in section 2 still shows the superseded 15-week plan for features this revision did not touch; ROADMAP 2.1 governs. Much of v1.0 exists in code and is green in CI but has not run on a real iPhone (M13). `08-delivery.md` turns this into work streams.

## 1. How features are ranked

Rank is the order we would protect if we could ship only the top n. Four tests, in order:
1. **Does the core loop work without it?** Speak, keep, read. If not, it ranks first.
2. **Does it protect a promise?** Exactly as said, kept, private, yours always: what you made stays readable, playable and exportable (03 section 1).
3. **Evidence strength** from the job ranking (02 section 4).
4. **Is it a store or legal gate?** These are not optional, but they are usually small, so they rank by size of risk, not by value.

Build order is different from rank: some low-ranked features (account, sync, config) are dependencies of higher-ranked ones and start early. Section 4 gives the build order.

## 2. v1.0 features, stack-ranked

| Rank | ID | Feature | P | Why here | Gate type | Depends on | Build window |
|---|---|---|---|---|---|---|---|
| 1 | F04 | Capture: speak or type a note or letter | P0 | The product. Job 2 and 3 (High). Lost recordings are the category's most repeated complaint (R1, R2) | Core loop, durability | F19 (config), design system | Weeks 2 to 5, hardening to 10 |
| 2 | F06 | Faithful edit and review | P0 | The constitution and the one claim nobody else can make (04 section 4). The engine has a known meaning-change defect outside English (R-01) | Core loop, promise | F05 | Weeks 2 to 7 |
| 3 | F05 | On-device transcription and language packs | P0 | Speak-first needs text; seven languages decided (B4) with per-language gates (DR-01) | Core loop | F04, F19 pack delivery | Weeks 2 to 9 (spike first, languages in waves) |
| 4 | F08 | Recordings: original, listening copy, playback, durability | P0 | Voice is the keepsake (Job 6); the original must never be altered (B6) | Promise | F04 | Weeks 3 to 7 |
| 5 | F09 | The book: month chapters, Before You, cards | P0 | Where the value accumulates; ordering by the moment is a complaint everywhere else (R2 section 0 item 6) | Core loop | F03, F04 | Weeks 4 to 8 |
| 6 | F17 | Settings, privacy controls, consents and deletion | P0 | Job 1 (High). In-app deletion is mandatory (App Review 5.1.1(v)); consent records are legal duties | Promise, legal, store | F02 | Weeks 4 to 11 |
| 7 | F07 | Names and words dictionary | P0 | A misheard name is the fastest way to lose trust (U4); only one competitor claims name handling, and Apple's long-form transcriber may not take custom words (one forum report, R1 F07) | Promise | F03, F05 | Weeks 4 to 7 |
| 8 | F01 | Entry, 18+ gate and welcome | P0 | Small, legal, first screen anyone sees; Texas SB 2420 in force (R4) | Legal, store | none | Weeks 2 to 3 |
| 9 | F03 | First run: child, signature, languages, names | P0 | Feeds F05 (languages), F07 (names), F09 (age math); only name and date required (B-REQ-001) | Core loop | F01 | Weeks 2 to 4 |
| 10 | F02 | Account and sign-in | P0 | Keeps the book beyond one phone; Apple, Google, email link (B3) | Durability | F01, domain (M0) | Weeks 4 to 8 |
| 11 | F16 | Sync, devices and restore | P0 | Text reaches the co-parent and a new phone; no silent overwrites (R2 section 0 item 1) | Durability | F02, D-023 | Weeks 4 to 9 |
| 12 | F11 | Co-parent sharing | P0 | Family authors add letters under one membership, a gap competitors charge for (M4; 04 section 4). Off in v1.0 builds today (`apps/mobile/src/lib/capabilities.ts`; DR-17); two voices raise retention [A] | Promise | F02, F16 | Weeks 6 to 10 |
| 13 | F15 | Export and the PDF book | P0 | "Yours, always" (every letter already made stays exportable, M1) and the shutdown pledge depend on it (PRD-REQ-009, LEGAL-REQ-034) | Promise, legal | F09, F08 | Weeks 6 to 10 |
| 14 | F13 | Prompts, reminders and notifications | P0 | Prompts are the top praised feature of prompted journals; repetition the top complaint (R2 section 0 item 4) | Habit | F03, F19 | Weeks 5 to 9 |
| 15 | F10 | Read together | P0 | The emotional payoff (Job 6). Free with no session limit (M2), so it is no longer part of the Plus boundary; word highlight in v1.1 (B7) | Value | F08, F09 | Built in code with no limit (71070c4); device checks in weeks 2 and 3 (12 to 23 Oct) |
| 16 | F14 | Plus: the membership | P0 | Plus is the membership: 2 free kept letters, then Plus at Keep (M1); it carries the business at $4.99 and $49.99 (M3). Ranked below the core loop and export because the gate only ever holds a letter, never loses one. The gate, ledger and Apple sheets are built; plan reminders (BL-342) and the status report (D-080) are not (DR-17) | Revenue, legal | F06 (Keep), F04 (drafts), F13, F17; DR-16, DR-17 | BL-342 by feature freeze Mon 26 Oct; StoreKit sandbox green by Fri 23 Oct or the ROADMAP cut applies (section 5) |
| 17 | F12 | Multiple children | P0 | Every book is free to start; letters, not books, are counted (M2, PRD-REQ-015 Rev). No longer part of the Plus boundary | Core | F03 | Built in code (no gate in `add-child-form.tsx`); server change in a pending migration |
| 18 | F19 | Server-driven content, remote config, kill switches, pack delivery | P0 | Kill switches within 5 minutes are a legal duty (LEGAL-REQ-040); packs need delivery (B13); prompts are server-delivered (B14) | Platform | `packages/api` | Weeks 1 to 6 |
| 19 | F18 | Analytics and the learning loop | P0 | Founder decision (D-003, B10); must never cost a feature (LEGAL-REQ-003) | Learning | F17 consent | Weeks 7 to 10 |
| 20 | F20 | Help, support and safety resources | P0 | Static "If you are struggling" row replaces the classifier (B7); support path for beta | Trust | F17 | Weeks 8 to 10 |
| 21 | F21 | App Store listing, website and legal pages | P0 | Required to ship; listing positioning matters against "voice memory book" entrants (04 section 5) | Store, legal | all | Weeks 10 to 15 |

## 3. v1.1 and later, stack-ranked

Specs in `features/F30-later.md`. Order is the recommended v1.1 build order.

| Rank | ID | Feature | Release | Why here |
|---|---|---|---|---|
| 1 | F31 | Shared voice and encrypted audio backup (Plus) | v1.1 | Closes DR-07 (co-parent cannot hear the other's voice) and gives Plus lasting value (DR-08); TDD 10 risk 9 scheme |
| 2 | F32 | Close family contributors in the app | v1.1 | Grandparents seeing the baby is the second most praised theme in the category (R2 section 0 item 7); From, Mama already has it |
| 3 | F33 | Hindi and Arabic transcription where v1.0 missed the gate; Hindi-English code-switching | v1.1 | B4 intent; R5 section 9 |
| 4 | F34 | Read together word highlighting | v1.1 | B7; ADR 0009 alignment |
| 5 | F35 | Server transcription fallback with consent (AI gateway) | v1.1 | Helps languages that fail on device; requires the consent flow (LEGAL-REQ-004, -005) |
| 6 | F36 | Android | v1.1 | B7; one Expo codebase; Google Play deletion page (LEGAL-REQ-030 full flow) |
| 7 | F37 | Web contribution page | v1.1 | B1; grandparents without the app; a second product (TDD 10 risk 10) |
| 8 | F38 | Author's own second-language version of a letter | v1.1 candidate | DR-15; mixed-language couples (R2-S31) |
| 9 | F39 | Safety classifier, clinician-gated | v1.1 | B7, D-034 |
| 10 | F40 | Story intro (4 stories) | v1.1 | D-043 |
| 11 | F41 | Sealed letters | later | UR R21; Dearest has it (CR) |
| 12 | F42 | Printed books (Year One) with QR to audio | later | Print is the category's profit engine (CR section 3); K-32 |
| 13 | F43 | Lifetime and gifts | later | UR R18, R19; Tiny Treasures sells $99 lifetime (R1) |
| 14 | F44 | App interface localisation (Spanish first) | later | 44.9M US Spanish speakers (R3 section 2.1) |
| 15 | F45 | Next spoken languages: Tagalog, Vietnamese, Korean (and Urdu, Cantonese) | later | Each larger than Hindi in the US (R3 section 2.2) |
| 16 | F46 | Themes, author and child photos | later | B-REQ-019, B-REQ-024 |
| 17 | F47 | On this day, Year One celebration | later | C-REQ-013, C-REQ-014 |
| 18 | F48 | Vault mode and end-to-end keys | later | ADR 0006; only if asked for |
| 19 | F49 | Apple-hosted asset packs (iOS 26 and later) | later | DR-14 |

## 4. Build order (dependency layers), on the ROADMAP 2.1 calendar

The layers stay; the calendar is ROADMAP 2.1's five weeks. Most of L0 to L4 exists in code (ROADMAP 2.1 section 0), so each week is about device runs, fixes and the remaining gaps.

```
Week 1   Mon 5 to Fri 9 Oct     L0  Guardrails and security fixes (BL-330, BL-347, BL-322); privacy manifest
                                     (BL-349); first build on a real iPhone (FT-17)
Week 2   Mon 12 to Fri 16 Oct   L1-L4 Device spikes: speech per language on SE 3, StoreKit sandbox, sync,
                                     deletion, size (FT-22); F14 plan reminders (BL-342); iOS 17 target
                                     (BL-336); pack host (BL-337); C0 Wed 14; Beta App Review Thu 15
Week 3   Mon 19 to Fri 23 Oct   L5  C1 beta from Mon 19; store screenshots (BL-340); review notes (BL-341);
                                     counsel comments and language go or no-go Fri 23
Week 4   Mon 26 to Fri 30 Oct   L5  Feature freeze Mon 26 (BL-342 in); fixes only; C1 exit Thu 29; counsel
                                     sign-off Thu 29; tag ios-v1.0.0
Submit   Mon 2 to Fri 6 Nov          Submit with manual release; answer App Review within a day
Buffer   Mon 9 to Fri 20 Nov         One rejection cycle; release planned Mon 16 Nov
```

## 5. If the date slips: cut order

From ROADMAP 2.1 section 6, in this order. Each cut is reversible in a later release.

| Order | Red signal | Cut | Note |
|---|---|---|---|
| 1 | A language's model is too slow or hot on the SE 3 (week 2) | Ship that language on the small model, or hold it back to a pack update; the listing names only shipping languages | DR-01 |
| 2 | Google sign-in setup or brand verification stalls | Apple and email link only | F02 |
| 3 | StoreKit sandbox not green by Fri 23 Oct | Ship v1.0 free and add Plus in 1.0.1; the Subscription Terms wait too | With the membership, "free" also means the Keep gate must allow every letter in that build. Remote config can raise the allowance only to 100 (`MAX_FREE_LETTERS`), so the cut needs a build-time switch [R] (F14) |
| 4 | Counsel has not cleared the analytics consent copy by Fri 23 Oct | Build without the PostHog key | F18 |
| 5 | Reminders or month notes misbehave in C1 | Reminders off by default, month notes later | F13 |
| 6 | Size over 40 MB | Subset fonts further, drop unused native modules (`docs/ops/APP_SIZE.md`) | B13 |

The old cut "Read together without a paywall counter" no longer applies: Read together has no counter (M2).

Never cut for v1.0 (ROADMAP 2.1 section 6): the verifier and its non-English fix; the immutable raw transcript; crash-safe capture; export; in-app account deletion with Apple token revocation (BL-330) where sign-in ships; the 18+ gate; consent before any analytics; server-side access checks; accurate claims, including the on-device plan reminders the Subscription Terms promise (BL-342) unless the Terms change instead; "If you are struggling". If any trial or renewal is sold, the auto-renewal reminders ship in whatever form counsel accepts.
