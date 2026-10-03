# 02. Customers

Status: Draft V2, 3 Oct 2026. Desk evidence only; no primary interviews yet (section 7 has the plan). Labels and source ids per `_AUTHORING.md` section 6.

## 1. Three roles, often different people

| Role | Who | What they need from us |
|---|---|---|
| **Author** | A parent, the co-parent, and from v1.1 grandparents and close family | Capture in the minutes they have; their words kept exactly; their voice kept; control over who reads |
| **Buyer** | Usually the primary author (P1). Later, grandparents buying a gift [A] UR section 4.4 | Clear price, no surprise charges, memories never held back for payment |
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
- **What V2 does.** Speak or type in under a minute and never lose it (F04); transcript cleaned only mechanically and shown (F05, F06); a book that fills itself by month (F09); reminders that never count gaps (F13); free forever to read, play and export (F14, F15).

### P2 Co-parent
- **Moment.** Writes less often, on their own cadence; fathers in the research write letters or record videos to the future child [S] UR S25, S30. 95.3% of fathers of children under 6 are in the labor force [F] R2-S30.
- **Short of.** Evidence: only 1 of 287 coded reviews mentions a partner contributing [S] R2-S13. We know little about P2.
- **Fears.** Privacy failures in shared albums [S] R2-S17. Being pushed into a role they did not choose [A].
- **A real case to design for.** In mixed-language couples P2 may not read P4's letters (55% against 92% transmission among Latino parents) [F] R2-S31.
- **What V2 does.** Joins free by link or code (F11); their own letters, their own voice, their own signature; sees the other parent's letters in the language they were written, with no machine translation (F10, F11). At v1.0 the other parent's audio stays on the author's phone (B7); see `09-decisions-and-risks.md` DR-07.

### P3 Expecting parent
- **Moment.** Pregnancy, often the third trimester; parents advise looking at the baby book during pregnancy [S] UR S27.
- **Fears.** Notifications about an unborn child that feel wrong [S] R2-S14. Due-date countdowns (B-REQ-015 forbids them).
- **Needs.** Due-date mode, a "Before You" chapter, dates that work for a preterm birth [S] R2-S2, R2-S14.
- **What V2 does.** Child created with a due date (F03); letters before birth file into Before You (F09); no due-date push or countdown (F13).

### P4 Multilingual family
- **Moment.** One or both parents, or the grandparents, speak another language with the child. 72% of Indian Americans aged 5 and older speak a language other than English at home [F] UR S13; 85% of US Latinos say it is at least somewhat important that future generations speak Spanish [F] R2-S32.
- **Fears.** Words dropped or misheard at language switches [F] UR S12; names spelled wrong; being shamed for imperfect language (54% of Latinos who do not speak Spanish report it) [F] R2-S32.
- **Needs.** The letter kept in the language and script it was spoken; the audio as the safety net; names spelled their way.
- **Reality check.** Per-language transcription quality varies widely: Spanish, French, Portuguese and Mandarin look realistic on device; Hindi needs a Hindi-tuned model; Arabic dialect speech does not reach keepsake quality with today's open models [S, F] R5 section 0 items 1 to 3. Code-switching (Hindi-English) is v1.1 (B4).
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
- **What V2 does.** Month chapters and signatures (F09), Read together (F10), export in open formats free forever, and a 90-day shutdown pledge (F15, PRD-REQ-009).

### Not for (anti-personas)
- Parents who want the app to write for them. We say no to "make it nicer" (CLAUDE.md constitution). [S] Some buyers want polish (R2 section 0 item 5); we accept losing them.
- Anyone under 18 (D-026).
- People looking for a public or social feed. The book is private by default (B-REQ-011).
- Photo-first families who want an album. Photos are optional and secondary (B-REQ-024 is P1).

## 4. Jobs to be done, ranked by evidence strength

From R2 section 7. Strength: High = a fact source plus signals from 3 or more products; Medium = signals from 2 or more products or one strong fact; Low = one source or assumption.

| Rank | Job, in the parent's words | Strength | Features |
|---|---|---|---|
| 1 | Keep my child's memories private and off social media. | High | F17, F11, F21 |
| 2 | Never lose what I made. | High | F04, F08, F15, F16 |
| 3 | Let me capture it in the few minutes I have. | High | F04, F05 |
| 4 | Tell me what to write about, without nagging. | High | F13, F19 |
| 5 | Let family see the baby grow. | High for photo apps, Medium for letters | F11, F30 |
| 6 | Leave my words and voice for my child's future. | Medium | F06, F08, F09, F10 |
| 7 | Give me a finished book I can hold. | Medium | F15, F30 (print) |
| 8 | Keep our languages in the family. | Medium for motivation, Low for app use | F03, F05, F07, F10 |
| 9 | Let me give it as a gift. | Medium, later | F30 |

Jobs 1 to 3 outrank the emotional job (6) on evidence. That is the order V2 builds in: privacy and durability are the floor the keepsake stands on.

## 5. Moments across the first five years

| Stage | Child age | What happens | What the product does |
|---|---|---|---|
| Pregnancy | before birth | Intention is high, time is still there | Due-date mode, Before You chapter (F03, F09) |
| Newborn | 0 to 2 months | First burst, then the first drop-off [A] UR section 1.2 | First letter in under 90 s, no tutorial (F01, F04) |
| Return to work | about 3 to 4 months for many US parents [A]; return-to-work timing source not opened (R2 section 8.3) | Second drop-off [A] | Gentle month-age notes, a few evenings a week (F13) |
| Trial end | month 1 (monthly) or month 2 (annual) after a Plus trial starts | Pay or not | Notices, nothing held back (F14) |
| Toddler | 1 to 3 years | Language bursts; grandparents more involved | Names dictionary, co-parent, v1.1 family (F07, F11, F30) |
| Read-together age | about 2 to 5 years | Shared reading at bedtime [F] R2-S29 | Read together (F10) |
| Handover | 18 years | The letters change hands | Export in open formats; shutdown pledge (F15) |

## 6. What each persona must never experience
1. A lost letter or recording (P1, P2).
2. A word they did not say in their letter, or a word they said changed into a different meaning (all authors; constitution).
3. A charge they did not expect, or a past memory locked behind payment (P1).
4. A count of what they missed, a streak, or a guilt prompt (P1, P2).
5. Their child's name or letter text on a lock screen or in a notification without their choice (P1; C-REQ-009 default off).
6. A notification about an unborn child's due date (P3; B-REQ-015).
7. Their language translated, transliterated or "corrected" into another script without asking (P4).

## 7. What we do not know (and how we will find out)

| # | Unknown | Why it is risky | Study |
|---|---|---|---|
| U1 | Will P1 speak letters aloud, when and where? | The product is built on speaking; night use near a sleeping baby may push people to type | Study 1 |
| U2 | Do parents value the untouched original over a polished version? | If many want polish, our promise narrows the market | Study 2 |
| U3 | Is co-parent-only at v1.0 enough? | Grandparents seeing the baby is top praise in photo apps | Study 3 |
| U4 | Is transcription good enough on names and accents in each language? | A misheard name is the fastest way to lose trust | Study 1 plus per-language experiments (R5 section 8) |
| U5 | Will parents use Read together, at what child age? | It defines part of the Plus boundary | Study 3, v1.0 analytics |
| U6 | How does a co-parent who does not read the letter's language experience the book? | Mixed couples are common in P4 | Study 3 |
| U7 | When do capture habits fade? | Reminder design and trial timing depend on it | Study 1, v1.0 cohort data |

Plan (R2 section 8.2, costs are [A]): Study 1, a two-week voice capture diary with 16 parents during TestFlight (about $3,200). Study 2, a faithful versus polished preference test with 200 parents plus 8 follow-ups (about $2,000). Study 3, paired family and pricing concept interviews with 10 couples and 6 grandparents (about $4,000). Total about $9,200. Study 1 and 2 can start in TestFlight; Study 3 needs the first beta build with co-parent sharing.
