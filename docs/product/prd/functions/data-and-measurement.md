# Function review: data and measurement (DAT)

Owner: `decision-science` (Decision Scientist), for BL-999. Written 20 Nov 2026 to `docs/product/prd/functions/BRIEF.md`. Docs only; changes no card. Karma rules every proposal here through `GAP-LOG.md`.

I am a Claude role, not a statistician of record, a lawyer or a privacy regulator. Every legal reading below is marked "counsel must confirm". Every number in this file is either read from a named source, computed from stated inputs (the arithmetic is shown), or marked PROPOSED. Nothing here is observed data: there are no users yet, and analytics is off for the whole 1.0 line (D-124 item 3, D-095).

## 1. What I reviewed, and what I did not

Reviewed on branch `docs/locked-pack-inputs-20nov` at `7d0446d02`:
- The frame `00-product-frame.md` (sections 2, 3, 7, 8, 9); every card's "Measures with analytics off" section, read in full for NS-01 to NS-25 and NS-32 to NS-37 (files 01 to 11), plus the NS-03 scripts and section 8 rules; `12-parked-and-not-built.md`; `14-test-plan.md` (gates G0 to G6, device evidence rule); `16-council-review-round-2.md` (rulings D1 to D13, T1 to T5); `18-errata-after-lock.md`; `GAP-LOG.md`; `docs/BACKLOG.md` BL-922 to BL-999.
- Measurement sources: `docs/analytics/TRACKING_PLAN.md` (Draft 2), `docs/analytics/INSIGHTS_LOOP.md` (banner "Superseded for v1.0"), `packages/analytics/src/catalog.ts` (`SCHEMA_VERSION = 8`, 68 events), `apps/mobile/src/lib/export/schema.ts` (`EXPORT_SCHEMA_VERSION = '1.6.0'`, `Manifest.counts`) and `pack.ts` lines 224 to 243 (how `counts` is built), `docs/product/pack-pdf/03-measure.md` section 14.
- Decisions and pricing: `docs/DECISIONS.md` D-045, D-095, D-124, D-125 item 3; `docs/prd/v2/03-goals-and-principles.md` section 4; `docs/prd/v2/features/F14-plus.md` sections 2, 3 and 6.9; `docs/prd/v2/09-decisions-and-risks.md` DR-21, R-06; `docs/prd/v2/07-quality-bar.md` C1 row and assumption A1; `docs/legal/COUNSEL_PACKET.md` 1.5.0 (Q44, Q51, Q54, and the line that defers Q6 and Q7 to v1.1).
- The CDO council skill `.claude/skills/early-letters-cdo/SKILL.md`, whose evidence rules I followed (name the decision first, name the blind spot of every number, prefer data already held).
- Design on `origin/docs/e2e-ux-20nov` at `85be46741`: screen inventories in `docs/design/e2e/{A,B,C,D,E}-*/DESIGN.md`, and count rules in each `WORDS.md`.

Outside sources read this session (20 Nov 2026):
- Apple, Product Page Optimization, https://developer.apple.com/app-store/product-page-optimization : a test covers "app icons, screenshots, and app preview videos"; "up to three treatments"; it "runs for 90 days or until you manually stop it". The page does not mention price.
- Apple, App Store Connect app metrics, https://developer.apple.com/help/app-store-connect/reference/app-metrics : "Usage data totals are based on App Store users who opt-in to share their data with you", covering Installations, Sessions, Active Devices, Crashes and Deletions. First-time downloads, Sales and Proceeds carry no opt-in qualifier on that page. Whether subscription reports cover every purchaser stays UNVERIFIED, as the frame says.

- `19-from-download-to-first-letter.md`: not committed on any branch I could see; it appeared as an untracked file in the working tree during this review ("Locked v1.0 candidate", 879 lines). I read its journey table and the Measures sections of NS-38 to NS-41, the only cards written in it so far.

Not reviewed:
- NS-42 to NS-45: no card text yet. They are judged from the card 19 journey table, BL-994's scope and GAP-LOG E K-5 (NS-45 holds app update states). Every DAT row for them is provisional. The rest of card 19 beyond its Measures sections was not read.
- Cards 06 to 11 outside their Measures, Data inventory and Never sections; `13-engineering-plan.md`; `docs/legal/data-policy.md` and `DATA_CLASSIFICATION.md` (privacy's file covers them); the PROTOTYPE and MOTION files.
- Production: I do not know what the hosted database holds or which migrations are applied, and I did not look. No query against production rows was run.

## 2. Coverage verdict per card (for data and measurement)

Covered: the card names a measure, its source in the 1.0 line, and what a reading means. Partly: a measure exists but its source, definition, subgroup size or decision rule is missing or wrong. Missing: no usable measure. n/a: parked or not taken up.

| Card | Verdict | Why |
|---|---|---|
| NS-01 Photo with a letter | Partly | `counts.photos` is always 0 until export 1.7.0 (the card says so). The redesigned C-S04 lists "What is inside" with no numbers, so testers must open `manifest.json` themselves (FR-DAT-13). `media_added` is named as the only event but is not in `catalog.ts` v8 |
| NS-02 Find | Partly | Good questions and study. Testers with 40 or more letters may not exist in C1 (the card allows a marked stand-in). `book_search_used` is not in `catalog.ts` |
| NS-03 Family-hears-it pilot | Covered | Thresholds and outcomes are written before day 0 (section 8). Script B has 6 questions, so the frame's 5-question cap must be read as applying to tester rounds, not to this study (card change C-09) |
| NS-04 Hands-free spike | Covered | The findings file is the measure; the later tester question is fixed |
| NS-05 Share one letter | Partly | `letter_share_started` is not in `catalog.ts`. No decision rule for the comprehension line ("can say that the recording does not go") |
| NS-06 A Firsts | Partly | Concept study is in BL-981. No rule for what a failed study does to BL-968 |
| NS-06 B Sealed letters | Partly | The five-parent study is not in BL-981. "None describe it as a way to hide from the other parent" is a pass line; it should be a stop line (FR-DAT-12) |
| NS-06 C Quick capture | Partly | Question fixed; no decision rule; depends on NS-04 |
| NS-07 C5 Quiet days | Covered | Support tally category; that category is not in the frame's four (FR-DAT-17) |
| NS-07 C28 Printable book | Partly | Question fixed; no decision rule; proof-book read-out needs founder spend |
| NS-07 G11 Label guard | Covered | CI history, counts of runs only |
| NS-08 Backup readiness | Partly | The iCloud Backup question is good. Nothing says what reading would change the flip decision |
| NS-09 Let it go finishes | Covered | Zero-target guardrail from tally and question; needs the one-report rule (FR-DAT-09) |
| NS-10 New phone | Partly | Asked only of testers who changed phones, likely 0 to 2 in C1. The two-phone run sheet row is the real source |
| NS-11 Save a copy | Partly | Three questions use most of a 5-question round. Not stated when they are asked |
| NS-12 Earlier versions | Partly | Question exists for "once built"; no rule |
| NS-13 Reminders | Partly | The card says the 12% target needs analytics. The frame and pack-pdf still list it, and the 10% mute guardrail, as live targets (C-05) |
| NS-14 Whose book | Partly | Two-book testers: D-045 plans 1 twins family. One family cannot carry an x of n |
| NS-15 Another day | Partly | The card says the about-day count comes "from the export manifest by hand". The manifest `counts` block has no such field (C-02) |
| NS-16 Someone else speaks | Partly | Question fixed; gated by counsel Q48 |
| NS-17 Second language | Partly | Per-language tester answers tie a tester to a language, which is L4 (FR-DAT-23) |
| NS-18 Typed days | Covered | Question fixed |
| NS-19 Add more | n/a | Not taken up |
| NS-20 Two books | n/a | Not taken up |
| NS-21 Letter page | Covered | Question fixed |
| NS-22 Book header | Covered | Question fixed |
| NS-23 One past letter | Covered | Guardrail target 0 on "a bad moment"; needs the one-report rule |
| NS-24 Read the year back | Partly | "Asked only in birthday weeks" schedules research by a child's birthday, which puts an L4 date in the founder's sheet (C-01) |
| NS-25 Other parent | Partly | The tester reports another adult's behaviour; fine as a yes or no. No decision rule |
| NS-26 to NS-31 | n/a | Parked |
| NS-32 Notification budget | Covered | Guardrail target 0 |
| NS-33 Accessibility | Partly | Device walk is solid. The tester question links a tester to assistive technology use (FR-DAT-24) |
| NS-34 Speed on SE 3 | Covered | The run sheet defines runs and percentiles (200 taps for p95). Crash-free from ASC is opt-in only (Apple, read 20 Nov) |
| NS-35 One start | Covered | Support tally; category not in the frame's four |
| NS-36 Data follows the letter | Covered | Support tally; categories not in the frame's four |
| NS-37 Book stays fast | Covered | Testers with 20 or more pictures; subgroup may be small; run sheet backs it |
| NS-38 Store page and install | Partly | First-time downloads from ASC are fine. "Product page conversion" may rest on Apple's opt-in usage data; I did not verify which ASC figures are opt-in for that metric (UNVERIFIED) |
| NS-39 First launch | Covered | Two fixed tester questions and the NS-34 run sheet |
| NS-40 Age and region checks | Partly | "The hook's daily counts (refusals by country code)" is a new server count that pairs a refusal with a country. It has no k floor, level, retention or deletion path stated, and must never carry an age answer (FR-DAT-35) |
| NS-41 Sign up and sign in | Partly | Sign-in success per method from Supabase Auth logs: logs hold emails and addresses (L3), so the rate needs an aggregate-only read under a runbook (FR-DAT-35). The 97% weekly target cannot be read at C1 volume (section 3.2) |
| NS-42 to NS-45 | Missing | No card text yet. Provisional rows FR-DAT-33 and FR-DAT-34 |
| Frame North Star | Missing | "Families with a letter in the last 7 days, testers by hand" has no fixed question in any card or in the frame (FR-DAT-21, C-04) |

## 3. Function requirements

Source codes used below: T tester round (hand-sent, D5); M export manifest counts read by a tester; S5 five-parent study (BL-981); P pilot sheet (NS-03); R device run sheet; ST support tally; AR App Store ratings and review text; ASC App Store Connect; CI build history.

### 3.1 The metric tree (what every measure hangs from)

```
Promise (VISION, D-139): letters to your child, in your own words and voice; kept for years
|
+-- North Star: weekly making families (WMF)        source in 1.0: T, Q-NS-1 (FR-DAT-21)
|     beside it: weekly keeping families (WKF)       source in 1.0: none in the field (FR-DAT-21)
+-- Business, beside and never above: paid or trial starts / first-time downloads, by install week   ASC (FR-DAT-19)
+-- Guardrails (hard stops, one report trips them, FR-DAT-09)
|     lost letter or recording: ST, T, M audio_missing (FR-DAT-14) | a word not said: T Q-FID-1 (FR-DAT-32)
|     charge outside triggers: ASC, ST billing | paywall before words: tests | count, streak, guilt line: design review
|     child name on lock screen by default: R | crash signatures: TestFlight and ASC opt-in (FR-DAT-16)
|
+-- "I can't lose this"   NS-08 T iCloud Backup | NS-09 ST+T | NS-10 T+R | NS-11 T | NS-36 ST | NS-12 T
+-- "I have two minutes"  NS-13 T | NS-14 T | NS-15 T | NS-35 ST | NS-34 R | NS-06 C T | NS-04 spike file
+-- "I want to go back"   NS-01 S5+T+M | NS-02 S5+T | NS-21 T | NS-22 T | NS-23 T | NS-24 T | NS-06 A S5+T | NS-06 B S5+T | NS-37 T+R
+-- "Hear it too"         NS-03 P | NS-05 S5+T | NS-25 T | NS-16 T
+-- "Something to hold"   NS-07 C28 T
+-- Foundations           NS-32 T | NS-33 R+T | NS-07 C5 ST | NS-07 G11 CI | NS-17 gate corpus + T
```

A leaf with no decision attached in section 3.4 is dropped from the round (FR-DAT-22).

### 3.2 What the numbers can and cannot tell us (computed 20 Nov 2026; Clopper-Pearson 95% intervals; binomial)

Realistic sizes: C1 is 15 to 25 friendly families (D-045, recommended; 07-quality-bar C1 row); studies are 5 parents; the pilot is 8 to 10; subgroups (two books, VoiceOver, changed phone, 40 letters) are 1 to 4.

| Reading | True rate could be anywhere from |
|---|---|
| 0 of 5 / 4 of 5 / 5 of 5 | 0 to 52% / 28 to 99% / 48 to 100% |
| 0 of 10 / 5 of 10 / 10 of 10 | 0 to 31% / 19 to 81% / 69 to 100% |
| 0 of 20 / 10 of 20 / 20 of 20 | 0 to 17% / 27 to 73% / 83 to 100% |

| If the true share is | Chance a 5-parent study meets "4 of 5" | Meets "3 of 5" |
|---|---|---|
| 50% | 19% | 50% |
| 70% | 53% | 84% |
| 80% | 74% | 94% |
| 90% | 92% | 99% |

| If a problem hits this share of families | Chance 0 of 5 report it | 0 of 10 | 0 of 20 |
|---|---|---|---|
| 5% | 77% | 60% | 36% |
| 10% | 59% | 35% | 12% |
| 20% | 33% | 11% | 1% |

Business rule (F14 6.9 line at 4%): one standard error at 500 first-time downloads is 0.88 points (22% of the line; 95% interval 2.3% to 5.7% around a true 4%); at 1,000 it is 0.62 points (2.8% to 5.2%); at 2,000 it is 0.44 points. Annual trial to paid at the 30% line: 100 trials gives 21% to 39%; 200 gives 24% to 36%.

Randomised two-arm tests (two-sided alpha 0.05, power 0.8), families per arm: 4% vs 5% needs 6,745; 4% vs 6% needs 1,863; 30% vs 45% needs 163; 50% vs 70% needs 93. None fits a beta of 25 families, and the founder expects a few hundred users on the Free plan (frame section 8). So there are no A/B tests in the 1.0 line: only pre-registered before-and-after reads and usability studies.

What this means in plain words: a five-parent study finds usability problems; it does not estimate a rate. "0 of n" never proves a problem is absent. A rule that fires on a point estimate at 500 downloads fires on noise about one time in four when the truth sits at the line.

### 3.3 Requirements

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-DAT-01 | Given any 1.0.x build profile, When the app runs, Then no event, counter, survey answer or measurement payload is sent, queued or written for us; `EXPO_PUBLIC_ANALYTICS` is off; no PostHog or Sentry client is constructed. A test fails if any 1.0.x profile in `eas.json` sets `EXPO_PUBLIC_ANALYTICS` on | D-095, D-124 item 3, G5, NS-07 G11, BL-975 | P0 (b): the label says no usage or diagnostics data | analytics, platform | D-095 text; COUNSEL_PACKET 1.5.0 label row ("no Usage or Diagnostics") |
| FR-DAT-02 | Given any screen in any 1.0.x build, Then no control, sheet or notification asks a parent a research question, asks for a number, or prepares a message that carries counts for us. The app composes nothing and sends nothing for measurement | frame section 3 ("the app composes nothing"); all e2e areas; C-S01, C-S04 | P0 (a): the hand-sent promise | design-systems, content, mobile | Frame section 3 |
| FR-DAT-03 | Given any parent-facing screen, notification, widget or store page, Then it shows no count made for measurement: no letters this week, no made-versus-kept, no ordinal ("10th letter"), no run, no days since, no progress toward an allowance (for example "1 left"). Facts about what exists, where a parent looks for them, stay allowed (GAP-LOG B G-07) | frame guardrails; B G-07; `12` C-42 refused; A-S13, B-S19, B-S20, E-S10, E-S26 | P0 (a): "never count gaps" | design-systems, content | Frame section 3 guardrails; `12-parked-and-not-built.md` C-42 |
| FR-DAT-04 | Tester round agreement (outside the product; door lines). **Shown:** the round message in fixed wording from the question bank (FR-DAT-06), with its version and hash, and one line that numbers only are wanted. **Records:** in the founder's private sheet: tester id (L3), round id, the date the tester agreed, answers as numbers or fixed choices (L2). No PRIV-R21 server row, because nothing touches the product. **Never:** words, letter text, names, the child's name, ages, birthdays, due dates, screenshots, files, the manifest file itself, health or assistive-technology detail, language (except under FR-DAT-23). **Decline and withdraw:** a tester may skip any question or any round and stays a tester; on withdrawal the founder deletes that tester's rows within 7 days (PROPOSED) and writes a dated note; the app, export and deletion are unaffected | D5; frame section 3 inventory row; counsel Q44; BL-981 | P0 (a): the D5 promise to testers | founder, user-research | `16` D5; frame section 3; COUNSEL_PACKET Q44 |
| FR-DAT-05 | Given a tester round ends, When 90 days pass, Then the founder deletes its raw answers and the repo gains one dated line in that round's read-out ("Raw answers deleted on {date}"), with no personal data | D5; frame section 3 | P0 (a) | founder | `16` D5 |
| FR-DAT-06 | One question bank, `docs/research/QUESTION-BANK.md`: every question has an id (Q-NS-n for the frame, Q-<card>-n for cards), exact wording, fixed answer set, the card row it serves, a version and the SHA-256 of the wording. Card wording wins; `pack-pdf/03-measure.md` is corrected to match (its Find and Share questions differ from NS-02 and NS-05). Given a round message, Then every question in it matches a bank row by hash. Words pass the content rules (no guilt, no gap counting) | frame section 3; every card's Measures; `pack-pdf/03-measure.md` section 14 | P1 | user-research, content | Frame: "fixed wording, versioned in `docs/research/`"; no such file exists today |
| FR-DAT-07 | Round plan: at most 5 questions per round (frame). Q-NS-1 and Q-FID-1 are asked every round; at most 3 card questions fill the rest, chosen from cards whose flag is on in the build the tester runs; guardrail questions go before adoption questions; every live card is asked at least once in any 4 weeks. Cadence PROPOSED: one round every 2 weeks during C1 | frame section 3; D-045; FQ-04 | P1 | user-research | Frame cap of 5; about 40 card questions exist |
| FR-DAT-08 | Reporting: every read-out states n asked and n answered, then "x of n answered". Never a percentage when n is under 20. A skipped question is not a "no" unless the study pre-registered it (NS-03 does). No quotes, no names. In the repo, no cell describes a group smaller than 5 that the founder could name (the twins family, the VoiceOver testers); smaller groups are pooled, or a guardrail event is recorded as "reported" with its BL row | frame reporting rule; NS-14, NS-33, NS-10 | P1 | user-research | Frame section 3; section 3.2 above |
| FR-DAT-09 | Zero-target guardrails trip on one report. Given any one report from T, ST, AR or M of: a lost letter or recording, something let go came back (NS-09), something deleted came back or missing from a copy (NS-36), a letter in the wrong book (NS-14), a past letter at a bad moment (NS-23), too many notifications (NS-32), a quiet day shown wrong (NS-07 C5), When it arrives, Then the founder hears the same day and the row in section 3.4 applies. "0 of n" is written as "not seen in n answers", never as "zero" or "none" | frame guardrails; NS-07, 09, 14, 23, 32, 36 | P0 (a): never lose a letter | founder, support, user-research | Section 3.2: 0 of 20 is consistent with up to 17% |
| FR-DAT-10 | Every study and round has its lines and outcomes written before day 0, in the shape of NS-03 section 8, and they do not change after it starts | NS-01, 02, 05, 06 A and B study lines; BL-981 | P1 | user-research, product | NS-03 section 8 |
| FR-DAT-11 | Each five-parent read-out carries the pass-chance table of section 3.2 and says "usability check, not a rate". A pass is never quoted as an adoption or satisfaction rate in the pack, the store or the website | BL-981; NS-01, 02, 05, 06 | P1 | user-research, marketing | Section 3.2 |
| FR-DAT-12 | NS-06 B study: Given any one parent describes sealing as a way to hide a letter from the other parent, Then the study stops and the founder decides before BL-969 starts. BL-981 gains the NS-06 B study | NS-06 B20; BL-969, BL-970, BL-981 | P1 | user-research, founder | NS-06 B20 pass line; BL-981 scope lists only photo, Find, share, Firsts |
| FR-DAT-13 | Reading the copy's numbers: the tester guide (outside the app) says how to open `manifest.json` in Files and send `counts.entries`, `counts.audio`, `counts.audio_missing`, `counts.audio_mismatch`, `counts.photos` and `counts.books` as numbers. Definitions stated in the guide: `entries` is every letter in the exported books, any author, kept only, waiting letters excluded, cumulative; `photos` is 0 before export 1.7.0. No count is added to C-S04 for this purpose | frame section 3; NS-01, NS-11, NS-36; C-S04; export 1.7.0 (NS-36-R5) | P1 | user-research, content | `schema.ts:358`; `pack.ts:225-241` |
| FR-DAT-14 | Given a tester sends `audio_missing` or `audio_mismatch` above 0, When the same tester answers "no" to "Did you change phones since your last copy?", Then it is treated as a lost-recording report under FR-DAT-09. After a phone change, missing recordings are expected while backup is off and are not a report | NS-08, NS-10; frame section 5 state "new phone (words present, recordings absent)" | P0 (a): never lose a recording | founder, sync | `pack.ts:236-238` |
| FR-DAT-15 | Run sheet numbers: every NS-34 and NS-37 row records phone, iOS version, build, configuration, number of runs, p50 and p95 (or the percentile the card names), units, and met or missed against the card's budget; a percentile is not reported from fewer runs than the card sets (for example 200 taps for Speak). Runs use the Asha-only install (D13) | NS-34-R1, R5; NS-37; E-S23; BL-929, BL-948 | P1 | qa | NS-34 section 3 |
| FR-DAT-16 | Crash numbers: beta and post-launch read-outs state that ASC crash and session totals come only from users who opted in to share with developers. The 99.8% crash-free rate is quoted only after release (G5); in C1 the gate is zero unresolved crash signatures over at least 500 sessions | NS-34 Measures; frame section 3 | P1 | qa, release | Apple app metrics page, read 20 Nov 2026; `07-quality-bar.md` line 488 |
| FR-DAT-17 | One support tally list, versioned, counts only, read weekly: the frame's four (lost, confused, billing, other), each with the card categories under it: lost: "something I let go came back", "something I deleted came back", "something was missing from my copy"; confused: "could not find where to start", "a quiet day showed up wrong". Every lost item is a severity 1 incident | frame section 3; NS-07 C5, NS-09, NS-35, NS-36; `pack-pdf/03-measure.md` guardrails | P1 | support | Card Measures sections |
| FR-DAT-18 | App Store ratings and public review text are tallied by the same categories, by week; the repo gets counts only, no reviewer names or quotes | frame section 3 | P2 | support, marketing | Frame section 3 sources |
| FR-DAT-19 | Business number: paid or trial starts over ASC first-time downloads, by install week, US storefront. Read-outs state the 95% interval beside the point and the exclusions: offer-code redemptions the founder gave to testers or friends, and sandbox. Whether ASC reports separate offer-code starts is UNVERIFIED; until verified, the founder subtracts his own codes by hand | frame section 3; F14 section 3, 6.9; D-125 item 3; FQ-02, FQ-03 | P1 | founder, finance | F14 6.9; Apple app metrics page (downloads and sales carry no opt-in qualifier) |
| FR-DAT-20 | Pricing experiment limits in the 1.0 line: no randomised price or allowance arms (no join from arm to purchase exists, TRACKING_PLAN section 2); the free allowance only moves up, for everyone, through remote config (F14-REQ-018); existing subscribers keep their price; a price change applies to new subscribers through Apple only (F14-REQ-021). No experiment of any kind varies or gates export, deletion, backup, reading, playing, Read together, Find, Share, or any capability that ships free in 1.0.x (principle 6, T2). A Product Page Optimization test may vary only the icon, screenshots and previews, and each variant's words pass the claims inventory first | frame section 2 principle 6; `16` T2; F14 6.9; NS-07 G11 | P0 (a): principle 6 and the export promise | founder, finance, marketing | Apple PPO page read 20 Nov 2026 (no price testing listed); TRACKING_PLAN section 2 |
| FR-DAT-21 | North Star in 1.0: WMF is read from Q-NS-1, "Did you make a letter in the app in the last 7 days? (yes / no)", with Q-NS-2, "About how many? (1 / 2 to 4 / 5 or more)", only after a yes. The tester answers for themselves, so the family reading misses the other parent unless both are testers; read-outs say so. WKF and the made-versus-kept gap have no field source in 1.0: the Home Plus line is absent in alpha (E-S26) and C1 purchases are sandbox, so no beta number speaks to the gate or to paying | frame section 3; `03-goals` 4.1; E-S26; `07` C1 row | P1 | user-research, product | Frame section 3 North Star row |
| FR-DAT-22 | A measure with no row in the decision table (section 3.4) is not asked. Adding a question needs its decision row first | all cards; CDO skill section 6 step 1 | P1 | user-research, product | CDO skill section 6 |
| FR-DAT-23 | Language-tied answers (NS-17) are L4 in the founder's sheet. The repo gets the native reviewer's corpus result per language (pass or not) and tester answers pooled across languages, unless 5 or more testers answered in one language | NS-17 Measures; TRACKING_PLAN 6.2; FQ-06 | P1 | user-research, privacy | TRACKING_PLAN 6.2 (a person's languages are L4) |
| FR-DAT-24 | Assistive-technology answers (NS-33): the sheet stores the answer under the round only, with no column naming the technology or the reason; the repo pools them with all testers' answers unless 5 or more answered | NS-33 Measures; FQ-07 | P1 | user-research, privacy | Counsel must confirm whether this is sensitive data |
| FR-DAT-25 | No question is scheduled by a child's birthday or due date. Given a round plan, Then no question is asked only in birthday weeks or due-date weeks; NS-24's question is asked in every round with a "not yet" answer | NS-24 Measures; NS-11; TRACKING_PLAN 6.4 | P1 | user-research | TRACKING_PLAN 6.4 (timing leaks) |
| FR-DAT-26 | Catalogue first, when analytics returns (v1.1 or later): every event in section 6.2 lands in `catalog.ts` and the generated TRACKING_PLAN section 3 in one PR, with a requirement id and an L2 map row, before any call site. Before any profile turns analytics on, stale entries are removed: `moment_shown` types `letters_10` to `letters_365` (C-42 refused), `make_it_yours_card`, the routes `tonight`, `family`, `listen` (three tabs now), and `capture_started.source` values `tonight`, `make_it_yours`, `resurface`; `plus_offer_viewed.trigger` values `chapter_complete` and `backup` are checked against `plan.ts` and D-111 (backup is free) | TRACKING_PLAN 6.5; D-161; `12` C-42; D-111 | P2 | analytics | `catalog.ts` v8; `packages/core/src/domain.ts:73` |
| FR-DAT-27 | Never an event, in any version, for this pack: anything at a seal's opening time; typed-day delivery or open; the birthday-week Save a copy slip; month or birthday notes; search text or its length; picture metadata, place, photo words, Firsts label, From name; a language next to a letter, capture, book or share event; VoiceOver or other assistive state; a share's destination app or recipient | NS-02, NS-05, NS-06 A and B, NS-11, NS-16, NS-17, NS-18, NS-33; TRACKING_PLAN 6.2, 6.4 | P0 (a): content-free promise | analytics, privacy | TRACKING_PLAN section 0 promise 2, 6.2, 6.4 |
| FR-DAT-28 | Server aggregates (`insights.*`, k = 10) are not read in the 1.0 line unless the founder rules otherwise (FQ-01). If ruled in: read only through `insights_aggregates()`, under a runbook that writes an audit row; WMF needs a new view that counts held letters as made (today `weekly_keeping_families` counts `entries` only); every read-out says that letters kept only on a phone are invisible | TRACKING_PLAN section 4; INSIGHTS_LOOP banner; CDO skill section 4 | P1 | founder, data-architect | `20261004300000_insights_aggregates.sql` per TRACKING_PLAN section 4 |
| FR-DAT-29 | Every read-out opens with its biases: friendly families chosen for coverage, who know the founder; self-report and recall; non-response; one parent answering for a family; small subgroups. When analytics returns: opted-in families only, likely more engaged | D-045; TRACKING_PLAN 1.4 | P1 | user-research | TRACKING_PLAN 1.4 |
| FR-DAT-30 | Stand-ins (a fixture book, the Asha install) are labelled "stand-in" (RR-8) and never added to tester counts | NS-02 Measures; D13 | P1 | user-research, qa | NS-02 section 21 |
| FR-DAT-31 | C1 length: Given the last full week of C1, When fewer than 10 C1 families answer yes to Q-NS-1, Then the founder extends C1 (07 assumption A1). Non-answers are reported, not counted as no | `07-quality-bar.md` A1; D-045 | P1 | founder | `07-quality-bar.md` line 629 |
| FR-DAT-32 | Targets with no 1.0 source are marked "not measurable in 1.0" wherever they appear (frame, `03-goals`, pack-pdf): letters within 2 h of a reminder (12%), reminders muted (10%), machine edit revert rate (under 5%), field activation and retention. The fidelity guardrail is replaced in 1.0 by Q-FID-1, "Did the app ever show a word in a letter that you did not say? (yes / no)"; one yes is a constitution incident under FR-DAT-09 | frame section 3 ("a target with no source in the build that ships is not a target"); NS-13 Measures; VISION "a word they did not say" | P0 (a): the constitution | product, user-research | NS-13 section 21; `pack-pdf/03-measure.md` guardrails |
| FR-DAT-33 | First run (NS-39 to NS-44): first run is never measured in the field in 1.0 (no events, before any account, TRACKING_PLAN section 2). Time from first launch to first kept letter (target 90 s, assumption) is read only in a five-parent study with a stopwatch, recording seconds only; the age step's answers are never recorded in any research. NS-39's two tester questions join the question bank | BL-994; NS-39 section 21; `03-goals` 4.2 activation row; TRACKING_PLAN section 2 | P1 | user-research | Provisional for NS-42 to NS-44 until their text exists |
| FR-DAT-34 | Provisional, NS-45 (app update states): measured only by the support tally ("could not reach my account after an update", under confused) | GAP-LOG E K-5; E-S16 | P2 | support | To recheck when NS-45 is written |
| FR-DAT-35 | Server-side counts named by cards (NS-40 refusals by country code, NS-41 sign-in success per method) are read only as weekly aggregates through a named runbook that writes an audit row; no person row, email, address or user id leaves the query. Each count is published as 0 or at least 10, with the complement rule, and a country with fewer than 10 refusals joins "other". The NS-40 count never carries, or is derived from, an age answer (TRACKING_PLAN: "An under-18 answer is never sent"). Each count gets a level, a retention clock and a deletion path in `DATA_CLASSIFICATION.md` in the same PR that builds it | NS-40, NS-41 section 21; E-S03, E-S04 to E-S07; TRACKING_PLAN section 4 (k = 10); CDO skill section 4 (production access) | P0 (b): new processing of personal data needs its inventory row and a privacy read before it exists | privacy, data-architect, security | NS-40 and NS-41 Measures (card 19, uncommitted) |

### 3.4 Decision rules (what number changes what decision)

Each line is PROPOSED unless the source column says it is on record. The founder confirms or changes them before the first round; after that they do not change.

| Measure | Read when | Line | Then | Decides | Source |
|---|---|---|---|---|---|
| Any zero-target guardrail (FR-DAT-09), Q-FID-1 yes, FR-DAT-14 | On arrival | 1 report | Severity 1. Pause the card's flag or remote pause if it has one; the build does not go to the next cohort until the cause is known | Founder | Frame guardrails |
| Q-NS-1 | Last full week of C1 | Under 10 families yes | Extend C1 | Founder | 07 A1, on record |
| NS-01 study | Before NS-01's flag leaves the founder's family | Under 4 of 5 start from a picture unaided, or 1 or more say Photos felt like a second start | Design change to A-S01 or B-S04, then rerun once | Product | NS-01 section 21 |
| NS-02 study | Same | Under 4 of 5 find the letter in 20 s, or 1 or more read the no-match line as a reproach | B-S06 change; rerun once | Product | NS-02 section 21 |
| NS-05 study | Same | Under 4 of 5 can say the recording does not go | D-S02 wording changes before any send speed work; the comprehension line outranks the 60-second line | Product, privacy | NS-05 section 20 |
| NS-06 A study | Before BL-968 | Under 3 of 5 would mark a first unasked, or 2 or more name a suggestion list | Park Firsts (back to `12`) | Founder | NS-06 A20 |
| NS-06 B study | Before BL-969 | Under 4 of 5 would seal one, or any hiding from the other parent | Park seals; the hiding case goes to the founder (FR-DAT-12) | Founder | NS-06 B20 |
| NS-03 pilot | Day 7 | Section 8 outcomes | As written: GO, LIMITED GO, HOLD, NO-GO, STOP | Founder | NS-03 section 8, on record |
| NS-08 iCloud Backup question | Each C1 round | Any reading | No flip decision rests on it alone; it sizes how many C1 families have their voice on one phone only, an input to the founder's seven conditions | Founder | NS-08 section 21 |
| NS-13 "too much" | Each round | 1 or more yes | Review the back-off schedule and evening words; no change to the budget without NS-32 | Product | NS-13 section 21 |
| NS-17 language gate | Per language | Native reviewer corpus fails, or any P4 tester answers "no" | Language stays out of the picker; author types (D-125 item 2) | Founder | D-125 item 2 |
| NS-33 assistive answer | Each candidate | Any "no" | P0 bug on the matching device walk row (G4) | qa | NS-33, `14` G4 |
| NS-34, NS-37 run sheet | Each candidate | Any P0 budget missed | G4 fails for that card's flag | qa, founder | `14` G4 |
| Business: allowance, first read | Week 8 (T39), install weeks 1 to 4 | Under 4% starts over first-time downloads, with the minimum download count of FQ-02 met | Raise the allowance 2 to 5, for everyone; log a D-### entry with the inputs and the interval | Founder | F14 6.9, D-125 item 3, on record |
| Business: allowance, second read | Week 16, install weeks 9 to 12 | Under 4% after the raise | Raise to 10 and open a founder review of the model | Founder | F14 6.9, on record |
| Business: price | T40 (200th annual trial ended) | Annual trial to paid under 30% | For new subscribers only, test $39.99 a year or a 1-month annual trial, as a before-and-after read | Founder | F14 6.9, on record |
| NS-39 questions | Each round after the flag reaches C1 | 1 or more "asked for something you did not expect", or "download started without your tap" | First-run review against E-S28 (permission asks map); the download case is a P0 bug if NS-39 forbids it | Product | NS-39 section 21 |
| NS-41 sign-in | Weekly once outside families sign in | Any method under 97% across at least 100 attempts (PROPOSED minimum) | Investigate that method; below 100 attempts, report x of n only | Product, security | A-NFR-013 via NS-41 |
| Business: minimum not met | T39 | Fewer downloads than FQ-02 | No rule fires; read again at the next point with the cohorts kept separate across any change | Founder | D-125 item 3 |

## 4. Design needs

| Where | Need | For |
|---|---|---|
| Every screen, every area | No research question, survey card, feedback composer with counts, or "send us your numbers" control. Nothing here needs a new screen | FR-DAT-02 |
| C-S04 Save a copy | Keep "What is inside" as words with no numbers, as drawn. Do not add counts back for measurement; testers read `manifest.json` (FR-DAT-13) | FR-DAT-03, FR-DAT-13 |
| A-S13 saved moment; B-S19, B-S20 Read together | No ordinal or total ("your 10th letter", "you read 12 letters"). The existing VoiceOver position line "Letter {n} of {count}" stays (a position, not a total) | FR-DAT-03 |
| E-S10 Keep gate, E-S26 Home Plus line, E-S11 Plan | The allowance may be stated as a fact; never as a meter or countdown ("1 left", "2 of 2 used") | FR-DAT-03 |
| B-S07 year rows, B-S01 month openers | As drawn: year rows carry no subtitle; lens month openers carry no count line | FR-DAT-03 |
| D-S23 pilot artefacts | Read-out template: counts only, x of n, no quotes; Script B stays as written | FR-DAT-08 |
| New artefact, not an app screen: tester round message and tester guide | Fixed wording from the question bank; the "numbers only" line; steps to open `manifest.json` in Files; content rules apply. `content` writes, the founder approves | FR-DAT-04, FR-DAT-06, FR-DAT-13 |
| E-S23 accessibility walk and speed sheet | Columns for phone, iOS, build, runs, p50, p95, unit, budget, met or missed | FR-DAT-15 |
| No screen | No variant UI for experiments: no arm-specific Keep sheet, allowance line or price display | FR-DAT-20 |
| No screen in 1.0 | The analytics consent sheet and its Settings switch are not designed for 1.0 (D-095) | FR-DAT-01 |

## 5. Card changes I propose (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| C-01 | NS-24 section 21 | "Asked only in birthday weeks" becomes "asked every round, with a not-yet answer" | A research schedule set by a birthday puts an L4 date in the sheet (TRACKING_PLAN 6.4 logic) |
| C-02 | NS-15 section 21 | Drop "from the export manifest by hand"; keep only the tester question | `Manifest.counts` has no about-day field (`schema.ts:358`). Adding one changes the family's export for our measurement; I recommend against it |
| C-03 | NS-01 section 21 | Add: testers read `manifest.json` from the copy (C-S04 shows no numbers); `counts.photos` from export 1.7.0 only. Mark `media_added` "proposed for the catalogue; not in it" | FR-DAT-13; `catalog.ts` v8 has no such event |
| C-04 | Frame section 3 table | Add the North Star questions Q-NS-1 and Q-NS-2 and Q-FID-1. Change "Letters made, and letters kept, per family per week" source to "Q-NS-2 bucket for made; manifest `counts.entries` read twice a week apart for kept, which includes the other parent's letters" | No card holds a North Star question; the manifest has no made count (waiting letters are not counted) |
| C-05 | Frame section 3; `03-goals` 4.2 and 4.3; `pack-pdf/03-measure.md` | Mark reminders 12%, mute 10%, revert rate under 5%, retention and field activation "not measurable in 1.0" | Frame's own rule; NS-13 already says so |
| C-06 | NS-02 and NS-05 section 21 | Mark `book_search_used` and `letter_share_started` "proposed for the catalogue; not in it" | `catalog.ts` v8 |
| C-07 | NS-17 section 11 or 21 | Inventory: per-language tester answers are L4 in the founder's sheet; repo pooling per FR-DAT-23 | TRACKING_PLAN 6.2 |
| C-08 | NS-06 B20 | "None describe it as a way to hide from the other parent" becomes a stop line | FR-DAT-12 |
| C-09 | Frame section 3 | "Each tester round asks at most 5 questions" applies to tester rounds; studies with their own consent (NS-03) set their own scripts | NS-03 Script B has 6 questions |
| C-10 | Frame section 3 sources | Add the support tally list of FR-DAT-17 under the four categories | Card categories do not map today |
| C-11 | F14 6.9 vs D-125 item 3 | One minimum: F14 says "at least 1,000 first-time downloads"; D-125 says 500. Default: 500 (the later ruling) with the interval reported (FQ-02) | Two numbers on record |
| C-12 | `pack-pdf/03-measure.md` section 14 | Question wording for Find and Share taken from NS-02 and NS-05 | Fixed wording rule |
| C-13 | NS-40 section 21 | Add: k = 10 with "other" for small countries, never an age answer, level, retention and deletion path (FR-DAT-35) | A refusal next to a country code, in small numbers, can point at one family |
| C-14 | NS-41 section 21 | Add: the rate is read as an aggregate under a runbook with an audit row; in C1 it is reported as "x of n sign-ins", not against 97% | Auth logs hold L3 data; C1 volume cannot test 97% |
| C-15 | NS-38 section 21 | Mark "product page conversion" with whether ASC computes it from opt-in usage data (UNVERIFIED) | Frame rule: name the blind spot of every number |

## 6. Engineering needs (backlog rows to add or change)

- **BL-981 (change):** add the NS-06 B study; correct the section references (study lines are in NS-01 section 21, NS-02 section 21, NS-05 section 20, NS-06 A20, B20); add "lines written before day 0" (FR-DAT-10).
- **New row, user-research, S:** `docs/research/QUESTION-BANK.md`, the round plan, the tester guide, and a read-out template with the section 3.2 tables (FR-DAT-04 to FR-DAT-08, FR-DAT-13). Docs only. Blocked by nothing.
- **New row, analytics, S, needs-decision (FOUNDER, because it changes what could be collected):** when v1.1 planning starts, the catalogue PR of FR-DAT-26 and section 6.2 candidates. Not before.
- **New row, analytics, S:** a test that fails if any 1.0.x profile in `eas.json` sets `EXPO_PUBLIC_ANALYTICS` on, if none exists (FR-DAT-01). I did not check whether one exists.
- **New row, data-architect, M, only if FQ-01 is answered yes:** an `insights` view for weekly making families that counts held letters, with grants in its own migration and in `supabase/tests/grants.mjs`.
- **TRACKING_PLAN.md (change, analytics):** North Star text says WKF; the frame says WMF with WKF beside it. Update at v1.1 planning. The CDO skill says 70 events; the catalogue has 68.
- **qa run sheet template (change):** FR-DAT-15 columns.
- No app code changes for measurement in the 1.0 line.

### 6.2 Events that would exist if analytics were turned on later (candidates only; none is in `catalog.ts`)

All enums, booleans or bounded integers; L2; one requirement each; added to the catalogue first (TRACKING_PLAN 6.5). Adding any is a founder decision while analytics is off.

| Card | Existing event that already serves it | Candidate (name: properties) |
|---|---|---|
| NS-01 | none | `media_added`: `source` (photo_first, review, letter_page), `kind` (photo); as named in NX-39-R34 |
| NS-02 | none | `book_search_used`: `results_bucket` (0, 1_5, 6_plus) |
| NS-05 | none | `letter_share_started`: no properties; `letter_share_closed`: `with_picture` (bool) only |
| NS-06 A | none | `first_marked`: `action` (marked, removed). No label |
| NS-06 B | none | `letter_sealed`: `action` (sealed, opened_early). Never an event at the opening day |
| NS-06 C | `capture_started` | `source` gains `widget`, `control`, `action_button`, `siri` |
| NS-09 | `capture_discarded` | `let_go_sweep`: `outcome` (finished, retrying) |
| NS-11 | `export_*` | none new |
| NS-12 | none | `earlier_version_action`: `action` (opened, restored, removed) |
| NS-13, NS-32 | `reminder_*`, `notification_opened` | `reminder_suppressed.reason` gains `daily_budget` |
| NS-14 | `child_switched` | `surface` values updated to the three tabs |
| NS-15 | `letter_saved` | `about_other_day` (bool) |
| NS-21, NS-22 | `child_setting_changed` | `key` gains `quiet` |
| NS-24 | `read_together_*` | `scope` (book, year). No birthday-slip source |
| NS-25 | `invite_*`, `member_*` | none new |
| NS-34 | `app_cold_start.ttfi_bucket` | none: the device model is dropped on purpose, so the run sheet stays the source |
| NS-07 C5, NS-16, NS-17, NS-18, NS-33 | none | none: no decision needs them, or FR-DAT-27 forbids them |

## 7. Founder and counsel questions

| # | Question | Recommended default |
|---|---|---|
| FQ-01 | May the server `insights` aggregates be read in the 1.0 line? | No. The frame does not list them as a source, INSIGHTS_LOOP is superseded for v1.0, what production holds is unknown to sessions, and at C1 size k = 10 suppresses nearly every cell. Revisit after launch with a runbook and audit row (FR-DAT-28) |
| FQ-02 | Minimum first-time downloads before the allowance rule fires: 500 (D-125) or 1,000 (F14 6.9)? | 500, the later ruling, with the 95% interval printed beside the point. At 500 the interval around 4% runs 2.3% to 5.7%, so a read near the line is close to a coin toss; the founder sees that before acting |
| FQ-03 | Are offer-code starts excluded from the business number? | Yes; the founder subtracts the codes he gave by hand until ASC's report fields are verified (UNVERIFIED) |
| FQ-04 | Round cadence and length during C1 | Every 2 weeks, 5 questions at most, Q-NS-1 and Q-FID-1 always |
| FQ-05 | Withdrawal clock for a tester's rows | Deleted within 7 days of the request, dated note |
| FQ-06 | Counsel: per-language tester answers in the founder's sheet (L4) | Needs a number from legal. Default: FR-DAT-23. Packet Q6 (the analytics language code) is deferred to v1.1 and does not cover this |
| FQ-07 | Counsel: tester answers that reveal assistive-technology use | Needs a number from legal. Default: FR-DAT-24. Counsel must confirm whether this is sensitive data |
| FQ-08 | Counsel: the tester round text and retention | Q44 (real families under draft texts) and Q51 (retention), packet 1.5.0, as the frame already cites. Default: D5 |
| FQ-09 | Founder and counsel: may the NS-40 refusal counts by country and the NS-41 sign-in counts be computed in the 1.0 line? | Needs a number from legal for the country count. Default: yes for NS-41 as an aggregate under a runbook (it serves a reliability target); NS-40 only with the FR-DAT-35 limits and a privacy read first |

Blind spot that remains: every 1.0 number comes from 15 to 25 families who know the founder and chose to help. None of it says how strangers will behave, and none of it is a rate.

Decision Scientist (`decision-science`, Claude role)
