# 02. Customers

Status: Draft V2, 3 Oct 2026; revised 13 Oct 2026 for the membership (M1 to M3), M14, and after critique round 1 for M16, M17 (R1 PL-07, PL-10, PL-14, PL-26; R3 DX-19, DX-28, DX-29, DX-30, DX-34, DX-39). Desk evidence only; no primary interviews yet (section 7 has the plan, with dates as milestone ids from `08-delivery.md` section 2.1). Labels and source ids per `_AUTHORING.md` section 6.

## 1. Three roles, often different people

| Role | Who | What they need from us |
|---|---|---|
| **Author** | A parent, the co-parent, and from v1.1 grandparents and close family | Capture in the minutes they have; their words kept exactly; their voice kept; control over who reads |
| **Buyer** | Usually the primary author (P1). Later, grandparents buying a gift [A] UR section 4.4 | Clear price and no surprise charges; told that new letters need Plus before they record, not after (F14-REQ-040); every letter they made stays readable, playable and exportable with or without Plus (M1) |
| **Reader** | The authors now; the child years later (P6) | A book that makes sense by age, in the family's languages, with the voice one tap away, readable and exportable forever |

The product is for adults. Under-18 users are blocked (D-026, PRD-REQ-019). The child is the subject and the future reader, never a user, and store metadata is parent-facing (LEGAL-REQ-044, App Review 5.1.4 per R4 section 0 item 8).

## 2. Who could use it (US, launch market)

| Measure | Value | Source |
|---|---|---|
| Births in 2025 | 3,606,400 (provisional, down 1%) | [F] R3 section 0 |
| Share that are first births | about 39.6% | [A] R3 section 0 |
| Children under 5 | about 18.5 million | [A from F] R3 section 0 |
| Reachable new families a year at an assumed 55% iPhone share | about 2.0 million | [A] R3 section 5.1; iPhone share among parents is **Unverified** |
| Births to mothers born outside the 50 states and DC | 24.5% of 2024 births | [F] R3 section 2.3 |
| Parents of a child under 3 who are foreign-born | 22.8% | [F] R3 section 2.3 |
| US grandparents | about 65 million; 76% say digital tools are a primary way they stay in touch | [F] R3 section 0, UR S15 |

## 3. Personas

Handles are fixed and used across every spec. Each persona lists the moment, what they are holding and short of, what they fear, what delights them, and what V2 does for them. Evidence lines carry labels.

### P1 Evening parent (primary author and buyer)
- **Moment.** The few minutes after the baby is down, or during a feed with one hand free. 3.2 hours of leisure a day; much of the rest is spent near a child [F] R2-S25, R2-S26. Employed mothers do 2.8 hours of primary childcare a day against 1.7 for fathers, so P1 is often the mother [F] R2-S26.
- **Holding.** A phone, often one-handed, often in the dark, often with a sleeping baby nearby [A] (validate U1).
- **Short of.** Time, sleep, a free hand, patience for set-up screens.
- **Fears.** Losing what they made (9 lost-work stories in R2's sample) [S] R2 section 5; surprise or new charges [S] R2 section 0 item 3; the app shutting down with years inside it [S] R2 section 5; being made to feel behind [S] UR S24.
- **Delights.** Short entries and a no-pressure tone [S] R2-S13; prompts that surface something they would have forgotten [S] R2-S19; a finished book [S] R2 section 5.
- **What V2 does.** Speak or type in under a minute and never lose it (F04); transcript cleaned only mechanically and shown (F05, F06); a book that fills itself by month (F09); reminders that never count gaps (F13); their first 2 letters free, counted only once the words exist and they have seen them, then Plus at Keep, and every letter they made stays readable, playable and exportable with or without Plus (M1, M17; F14, F15).

### P2 Co-parent
- **Moment.** Writes less often, on their own cadence; fathers in the research write letters or record videos to the future child [S] UR S25, S30. 95.3% of fathers of children under 6 are in the labor force [F] R2-S30.
- **Short of.** Evidence: only 1 of 287 coded reviews mentions a partner contributing [S] R2-S13. We know little about P2.
- **Fears.** Privacy failures in shared albums [S] R2-S17. Being pushed into a role they did not choose [A].
- **A real case to design for.** In mixed-language couples P2 may not read P4's letters [A]. The nearest fact measures what parents speak, not what partners read: among US Latino parents, 92% with a Latino partner speak Spanish to their children against 55% with a non-Latino partner (2015 survey) [F] R2-S31. Study 3 tests the reading case (U6).
- **A second case.** v1.0 is iPhone only and the web page is v1.1, so a co-parent with an Android phone cannot join [A]. The share of mixed-platform couples is unknown; Study 3 recruiting measures it (U8). The `/j` page says plainly the app is iPhone only for now and offers the PDF export (F11 owner).
- **What V2 does.** Joins free by link or code (F11); their own letters, their own voice, their own signature; sees the other parent's letters in the language they were written, with no machine translation (F10, F11). The other parent's letters never count against their 2 free letters (M17); inside one Apple Family the payer's Plus covers them (D-080). At v1.0 the other parent's audio does not reach their phone: family listening is v1.1. Each author's own recordings are backed up, encrypted, with a recovery key we hold under strict, logged access, for that author's restore only (D-073, M14, M16); see `09-decisions-and-risks.md` DR-07.

### P3 Expecting parent
- **Moment.** Pregnancy, often the third trimester; parents advise looking at the baby book during pregnancy [S] UR S27.
- **Fears.** Notifications about an unborn child that feel wrong [S] R2-S14. Due-date countdowns (B-REQ-015 forbids them).
- **Needs.** Due-date mode, a "Before You" chapter, dates that work for a preterm birth [S] R2-S2, R2-S14.
- **What V2 does.** Child created with a due date (F03); letters before birth file into Before You (F09); no due-date push or countdown (F13).

### P4 Multilingual family
- **Moment.** One or both parents, or the grandparents, speak another language with the child. 72% of Indian Americans aged 5 and older speak a language other than English at home [F] UR S13; 85% of US Latinos say it is at least somewhat important that future generations speak Spanish [F] R2-S32.
- **Fears.** Names spelled wrong [A]; their words mangled in a mixed-language sentence [A] (validate in Study 1); being shamed for imperfect language (54% of Latinos who do not speak Spanish report it) [F] R2-S32.
- **Needs.** The letter kept in the language and script it was spoken; the audio as the safety net; names spelled their way.
- **Reality check.** Speech models drop or mishear words at language switches [F] UR S12. Per-language transcription quality varies widely: Spanish, French, Portuguese and Mandarin look realistic on device; Hindi needs a Hindi-tuned model; Arabic dialect speech does not reach keepsake quality with today's open models [S, F] R5 section 0 items 1 to 3. Code-switching (Hindi-English) is v1.1 (B4).
- **What V2 does.** Languages chosen per author at first run (F03), transcription per language with a quality gate per language (F05), language packs for script, punctuation and names (F05, F07), never translated.

### P5 Close family (v1.1 contributor)
- **Moment.** Grandparents near or far; aunts and uncles. Family sharing is the second most praised theme in photo-album apps after privacy [S] R2 section 0 item 7. Elders in their 80s to 100 record on their own in Remento reviews [S] R2-S22, R2-S23.
- **Fears.** Confusing sites, too many reminders across channels [S] R2-S20, R2-S23.
- **At v1.0.** Not a user (B1). They see letters only when a parent shows them or shares the PDF export. Parents arriving from Tinybeans or 23snaps may expect grandparents on day one [A] R2 section 0 item 7; this is risk R-05.
- **What V2 does.** v1.1 contributor role in the app, then the web contribution page (F30).

### P6 Future reader (the child, years later)
- **Moments.** Shared reading from about age 2 to 5 (the AAP recommends shared reading from birth) [F] R2-S29; handover at 18 [S] UR S30.
- **Needs.** A book that makes sense without the app: by age, signed by each author, in open formats, with the voice.
- **Caution.** No study we opened tests a recorded parent's voice; the live-voice study (61 girls aged 7 to 12) does not transfer [F] R2-S24. Copy never claims calming or developmental effects.
- **What V2 does.** Month chapters and signatures (F09), Read together (F10), export in open formats that is never gated, with or without Plus (M1), and a 90-day shutdown pledge (F15, PRD-REQ-009).

### Not for (anti-personas)
- Parents who want the app to write for them. We say no to "make it nicer" (CLAUDE.md constitution). [S] Some buyers want polish (R2 section 0 item 5); we accept losing them.
- Anyone under 18 (D-026).
- People looking for a public or social feed. The book is private by default (B-REQ-011).
- Photo-first families who want an album. Photos are optional and secondary (B-REQ-024 is P1).

## 4. Jobs to be done, ranked by importance and evidence

From R2 section 7. **Importance** is our judgement of how much the promise in 03 section 1 depends on the job [A]. **Evidence**: High = a fact source plus signals from 3 or more products; Medium = signals from 2 or more products or one strong fact; Low = one source or assumption. Rank is importance first, then evidence; `05-feature-map.md` uses this order as its third ranking test (R1 PL-26).

| Rank | Job, in the parent's words | Importance [A] | Evidence | Features |
|---|---|---|---|---|
| 1 | Never lose what I made. | High | High | F04, F08, F15, F16 |
| 2 | Let me capture it in the few minutes I have. | High | High | F04, F05 |
| 3 | Leave my words and voice for my child's future. | High | Medium | F06, F08, F09, F10 |
| 4 | Keep my child's memories private and off social media. | High as a design floor | Medium [S]: 29 of 80 positive reviews, Apple-selected, coded from short paraphrases (R2 sections 1.1, 1.2); no source for why people leave | F17, F11, F21 |
| 5 | Tell me what to write about, without nagging. | Medium | High | F13, F19 |
| 6 | Let family see the baby grow. | Medium | High for photo apps, Medium for letters | F11, F30 |
| 7 | Give me a finished book I can hold. | Medium | Medium | F15, F30 (print) |
| 8 | Keep our languages in the family. | Medium | Medium for motivation, Low for app use | F03, F05, F07, F10 |
| 9 | Let me give it as a gift. | Low at v1.0 | Medium, later | F30 |

Review counts in this file are directional (R2 section 1). Privacy stays a design rule whatever its measured demand.

## 5. Moments across the first five years

| Stage | Child age | What happens | What the product does |
|---|---|---|---|
| Pregnancy | before birth | Intention is high, time is still there | Due-date mode, Before You chapter (F03, F09) |
| Newborn | 0 to 2 months | First burst, then the first drop-off [A] UR section 1.2 | First letter in under 90 s, no tutorial (F01, F04) |
| Return to work | about 3 to 4 months for many US parents [A]; return-to-work timing source not opened (R2 section 8.3) | Second drop-off [A] | Gentle month-age notes, a few evenings a week (F13) |
| Trial end | month 1 (monthly) or month 2 (annual) after a Plus trial starts | Pay or not | Notices, nothing held back (F14) |
| Toddler | 1 to 3 years | Language bursts; grandparents more involved | Names dictionary, co-parent, v1.1 family (F07, F11, F30) |
| Read-together age | about 2 to 5 years [A] | Shared reading, which the AAP encourages from birth through kindergarten [F] R2-S29; bedtime as the moment is [A] | Read together (F10) |
| Handover | 18 years | The letters change hands | Export in open formats; shutdown pledge (F15) |

## 6. What each persona must never experience
1. A lost letter or recording (P1, P2).
2. A word they did not say in their letter, or a word they said changed into a different meaning (all authors; constitution).
3. A charge they did not expect, a past memory locked behind payment, or a paywall before they have seen what the app does with their words (P1; M17).
4. A count of what they missed, a streak, or a guilt prompt (P1, P2).
5. Their child's name or letter text on a lock screen or in a notification without their choice (P1; C-REQ-009 default off).
6. A notification about an unborn child's due date (P3; B-REQ-015).
7. Their language translated, transliterated or "corrected" into another script without asking (P4).

## 7. What we do not know (and how we will find out)

| # | Unknown | Why it is risky | Study |
|---|---|---|---|
| U1 | Will P1 speak letters aloud, when and where, including whispering near a sleeping baby? | The product is built on speaking; night use may push people to type | Study 1 |
| U2 | Do parents value the untouched original over a polished version? | If many want polish, our promise narrows the market | Study 2 |
| U3 | Is co-parent-only at v1.0 enough? | Grandparents seeing the baby is top praise in photo apps | Study 3 |
| U4 | Is transcription good enough on names and accents in each language? | A misheard name is the fastest way to lose trust | Study 1 plus per-language experiments (R5 section 8) |
| U5 | Will parents use Read together, at what child age? | Free with no session limit (M2); low use changes what the listing leads with [A] | Study 3, v1.0 analytics |
| U6 | How does a co-parent who does not read the letter's language experience the book? | Mixed couples are common in P4; DR-15 rests on it | Study 3 |
| U7 | When do capture habits fade? | Reminder design and trial timing depend on it | Study 1, v1.0 cohort data |
| U8 | How many couples have one Android phone, or share one iPhone? | v1.0 is iPhone only; the reach number assumes 55% iPhone share (Unverified) | Study 3 recruiting |
| U9 | Does two free letters then a gate feel fair, and do parents believe the waiting letter is safe? | The gate is the only paid moment and carries promise 4 (R3 study 2) | Study 2 |

**Plan, moved earlier (R1 PL-14, R3 DX-30).** Costs are [A] from R2 section 8.2 and R3's study designs; dates are milestone ids in `08-delivery.md` section 2.1.

| Study | When | Design | Cost [A] | v1.0 decisions it can still change, and by when |
|---|---|---|---|---|
| **Study 2: gate fairness and faithful against polished** | Fielded at T08, read at T15. Needs no build | Unmoderated test with about 150 to 200 parents plus 8 moderated follow-ups. Clickable variants of the third letter: today's gate after Review; a standing line before capture plus the gate; the M17 count. Listen for "hostage", "trick", "fine"; measure stated trial intent and belief that the waiting letter is safe. The same panel compares faithful and polished versions (U2) | about $2,000 (R2); the gate variants may add about $1,700 (R3) | Keep sheet and Tonight line copy (F14-REQ-040), the held-letter copy, principle wording; before the wave 2 Keep sheet work |
| **Study 1: night capture diary** | Inside C1 from T22, two weeks; read at T26 | 14 to 16 parents of babies 0 to 9 months, including 2 Hindi, 2 Spanish and 2 Mandarin or Arabic speakers; nightly two-question form and a 30-minute end interview. Each records three scripted sentences at bedtime volume with their white-noise machine on, which becomes the F05 whisper and noise corpus | about $3,200 (R2) | Tonight speak or type default, the `stillHere` threshold, DR-12, the 90 s first-letter target; before the freeze (T29) |
| **Study 3: paired co-parent sessions and pricing** | Inside C1 from T24 to T28; read by T34 | 8 couples on the TestFlight build: 4 mixed-language, 2 co-parenting apart, 2 with one Android partner; each joins a seeded book, reads and plays a chapter in Read together, edits a book setting. Two pricing questions (R1 PL-28) | about $4,000 (R2) or $2,400 (R3's smaller design) | DR-15 (v1.1), co-parent gate copy (F14-U21), book-settings rules (F12), the two-voices target, the T40 price review inputs |

Total about $9,200 [A]. Not a study but needed before C1: one review of the loss, NICU and "Quiet this book" copy with a perinatal loss and NICU family organisation (R3; F12, F13). Bereaved parents are not recruited as test participants for a v1.0 flow.
