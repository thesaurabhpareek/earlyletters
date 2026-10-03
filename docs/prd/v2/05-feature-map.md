# 05. Feature map and stack rank

Status: Draft V2, 3 Oct 2026. Calendar weeks follow `docs/ROADMAP.md` (week 1 starts Mon 5 Oct 2026; target App Store submission Mon 11 Jan 2027, week 15). `08-delivery.md` turns this into work streams.

## 1. How features are ranked

Rank is the order we would protect if we could ship only the top n. Four tests, in order:
1. **Does the core loop work without it?** Speak, keep, read. If not, it ranks first.
2. **Does it protect a promise?** Exactly as said, kept, private, free forever (03 section 1).
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
| 12 | F11 | Co-parent sharing | P0 | Free family authorship is a clear gap competitors charge for (04 section 4); two voices raise retention [A] | Promise | F02, F16 | Weeks 6 to 10 |
| 13 | F15 | Export and the PDF book | P0 | Free forever and the shutdown pledge depend on it (PRD-REQ-009, LEGAL-REQ-034) | Promise, legal | F09, F08 | Weeks 6 to 10 |
| 14 | F13 | Prompts, reminders and notifications | P0 | Prompts are the top praised feature of prompted journals; repetition the top complaint (R2 section 0 item 4) | Habit | F03, F19 | Weeks 5 to 9 |
| 15 | F10 | Read together | P0 | The emotional payoff (Job 6) and part of the Plus boundary; word highlight in v1.1 (B7) | Value, Plus | F08, F09 | Weeks 6 to 9 |
| 16 | F14 | Plus: subscription, paywall, lapse | P0 | Founder decided Plus at launch (D-001, B2); notices unresolved (DR-02) | Revenue, legal | F02, F12, F10, DR-02, DR-03 | Weeks 3 (spike), 6 to 12 |
| 17 | F12 | Multiple children | P0 | Twins and siblings in first run stay free; second book is Plus (PRD-REQ-015) | Core, Plus | F03, F14 | Weeks 5 to 9 |
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

## 4. Build order (dependency layers)

```
Week 1-2   L0  Guardrails: CI, branch protection, security migration pack (ROADMAP M1), packages/api
                contracts, design tokens and components spike, app identity from packages/brand
Week 2-5   L1  F04 capture durability | F01 gate | F03 first run (local) | F19 config client and pack
                manifest service | F05 device spike and model download | F06 engine i18n fix (R-01)
Week 3-9   L2  F05 pipeline and language waves | F06 review UI | F07 dictionary | F08 recordings and
                listening copy | F09 book | F13 local reminders | F17 settings shell
Week 4-10  L3  F02 account | F16 sync | F11 co-parent | F12 children
Week 6-12  L4  F14 Plus | F10 Read together | F15 export and PDF | F18 analytics | F17 deletion | F20 help
Week 10-15 L5  F21 listing, website and legal pages | beta C1 | performance and accessibility gates
```

## 5. If the date slips: cut order

Apply at the week 6 checkpoint (Fri 13 Nov) in this order. Each cut is reversible in v1.1.

| Order | Red signal | Cut | Saves [A] |
|---|---|---|---|
| 1 | Any language not passing its gate by week 8 | That language ships as record plus type (DR-01); no delay to the release | per language |
| 2 | F14 behind, or DR-02 unanswered by 6 Nov | Annual plan only, no free trial (removes the trial notice arm) | 1 to 1.5 weeks |
| 3 | F05 device spike fails on SE 3 | Small model on the SE 3, turbo on 6 GB phones (TDD 10 fallback) | 1 to 2 weeks |
| 4 | F10 behind | Read together ships as plain sequenced playback with no paywall counter; Plus is extra children only | 1 week |
| 5 | Accessibility polish behind | Increase Contrast variants to v1.1; AX5 on P0 screens stays a gate | 1 week |

Never cut for v1.0: the verifier and its non-English fix; the immutable raw transcript; crash-safe capture; export; in-app account deletion; the 18+ gate; consent before any analytics; server-side access checks; accurate claims; auto-renewal notices in whatever form counsel accepts if any trial or renewal is sold.
