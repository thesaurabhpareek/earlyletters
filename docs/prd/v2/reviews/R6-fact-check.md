# R6. Independent fact-check of PRD V2

Reviewer: independent fact-checker. Date: 13 Oct 2026. Branch `docs/prd-v2` at d921356. Scope: every `.md` under `docs/prd/v2/` except `reviews/` for the citation scan; `01` to `04`, `F04`, `F05`, `F06`, `F14`, `F21` for claims; the specs' build-status columns for code claims. No other file was changed. Nothing was committed.

## Summary

| Check | Items checked | Pass | Fail or partial | Could not check |
|---|---|---|---|---|
| 1. Citation integrity (mechanical) | 8,224 citations, 1,274 unique ids, 11 id kinds | 8,212 citations resolve | 12 citations point at 5 ids that do not exist where they should (3 real problems, 1 pending entry, 1 false alarm) | none |
| 2. Claim spot-check against research files | 40 claims | 28 Supported | 11 Partly supported, 1 Not supported | none |
| 2b. Same claims against the original URL | 23 claims (19 distinct URLs tried) | 12 Supported | 6 Partly supported, 1 Not supported | 4 Source unreachable (bls.gov x2, pewresearch.org short-read, law.justia.com: HTTP 403) |
| 3. Code claims against the current branch | 20 claims | 18 Supported | 1 Partly supported, 1 Not supported | none |

The worst five, in order:

1. **Qeepsake deal price (04 section 3, R3 section 4.1).** The PRD says Qeepsake "sold for $2.7M in stock" and R3 says "no earn-out is mentioned". Tinybeans' FY26 annual report, which R3 cites as R3-S26, says the consideration was $1.2M in shares plus up to $1.5M in performance rights that vest only if Qeepsake hits EBITDA, subscriber (40,000 at 30 Sep 2026) and revenue ($3.75M) milestones, recorded at $2.075M. The $54 per subscriber and 0.66 times revenue figures rest on the headline number.
2. **Tinybeans "turned positive" (01 section 5, 04 section 3).** The same report says FY26 adjusted EBITDA of $426,949 included a one-off $591,564 R&D tax refund, which the report says came from that refund and not from the underlying business. Without it the year was a loss.
3. **Haitian is not larger than Hindi (04 section 7 item 4, R3 section 0).** R3's own table and its source give Haitian 1,041,231 and Hindi 1,059,933.
4. **"Cards and letters ... after photos" (01 section 2.3).** In the YouGov poll (UR S8) cards and letters (55%) come after photos (95%), art (74%), awards (70%), report cards (57%) and videos (57%). The line overstates how often letters are kept.
5. **Dangling ids that agents will follow.** `F21-REQ-030` (F21 section 3) does not exist; `BL-064` (R5 lines 253, 436) is in the never-used BL-055 to BL-099 range and was renumbered BL-120; `D-089` is cited six times as if logged but is not in `docs/DECISIONS.md` on any branch.

## Method

- **Check 1.** Script `cite_check.py` (kept in the session scratchpad, not in the repo) scans each line for R1-S## to R5-S##, "UR S##", "CR S##" (including lists such as "UR S24, S26, S27"), D-###, DR-##, BL-###, ADR ####, F##-REQ-###, LEGAL-REQ-###, DATA-REQ-### and PRD-REQ-###, and expands shorthand such as "LEGAL-REQ-047, -049". An id counts as existing when it has a defining entry: a Sources line or row in its research file; a heading or first-column row in `docs/DECISIONS.md` or `docs/BACKLOG.md` on HEAD, `origin/develop` or `origin/main`; a file in `docs/adr/` on any of the three; a first-column row (including "Rev" rows) or heading in a V2 spec for F##-REQ; a heading in `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ); a bold or table entry in `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ); a first-column row in `docs/prd/PRD.md` (PRD-REQ); a row in `09-decisions-and-risks.md` (DR). D-051 to D-053 mean different things on main and develop; every citation of them was read by hand.
- **Check 2.** Claims were chosen for being numbers, prices, competitor facts, Apple rules, model error rates or laws. Each was compared with the research entry it cites. For 19 of them the cited URL was fetched (curl through the session proxy; WebFetch permission was not granted) and the page text searched.
- **Check 3.** Each "Built", "Partly built" or "Not built" claim was checked with `ls`, `grep` and reading the named file on `docs/prd-v2`.

## Check 1. Citation integrity

Counts by kind (citations scanned / unique ids / ids missing):

| Kind | Citations | Unique | Missing |
|---|---|---|---|
| R1-S to R5-S | 2,338 | 321 | 2 (false alarm, see row 5) |
| UR S | 83 | 17 | 0 |
| CR S | 31 | 12 | 0 |
| D-### | 1,163 | 71 | 1 (D-089) |
| DR-## | 319 | 17 | 0 |
| BL-### | 1,048 | 213 | 1 (BL-064) |
| ADR #### | 281 | 18 | 0 |
| F##-REQ-### | 1,587 | 480 | 1 (F21-REQ-030) |
| LEGAL-REQ | 644 | 54 | 0 |
| DATA-REQ | 419 | 44 | 0 |
| PRD-REQ | 311 | 27 | 0 |

Every dangling citation:

| # | Id | File and line | Problem | Exact fix |
|---|---|---|---|---|
| 1 | F21-REQ-030 | `features/F21-store-web.md` line 43 | No F21-REQ-030 row exists. The claims requirement is F21-REQ-028 ("A v1.0 claims list with counsel approval exists before submission", line 208). | Change "Claims check per release (F21-REQ-030)" to "Claims check per release (F21-REQ-028)". |
| 2 | BL-064 | `research/R5-speech-audio-languages.md` line 253 | BL-055 to BL-099 are never used (`docs/BACKLOG.md` numbering note). The BACKLOG appendix maps TDD 03 BL-064 to BL-120. | Change "BL-064" to "BL-120 (was TDD 03 BL-064)". |
| 3 | BL-064 | `research/R5-speech-audio-languages.md` line 436 | Same as row 2. | Change "BL-064 hardening" to "BL-120 hardening". |
| 4 | BL-064 | `features/F06-faithful-edit.md` line 8 | Cited as "BL-120 (was TDD 03 BL-064 ...)". This is a correct historical alias. | No fix needed. |
| 5 | D-089 | `08-delivery.md` lines 28, 71, 109, 326, 502; `README.md` line 98 | Not in `docs/DECISIONS.md` on HEAD, develop or main (develop ends at D-088). README line 98 and 08 line 326 say it is to be drafted; lines 28, 71, 109 and 502 read as if it exists. | Either log D-089 (M14) in `docs/DECISIONS.md` on develop, or until then write "D-089 (proposed, not yet logged)" at 08 lines 28, 71, 109 and 502. |
| 6 | R5-S41, R5-S92 | `research/R5-speech-audio-languages.md` line 478 | Not in the Sources list, but the line itself says both ids are deliberately unused. | No fix needed (false alarm). |

Not flagged by the script but checked by hand: all 26 citations of D-051 to D-053 that carry "(main)" and the unqualified ones in F08, F10, F12, F14, `09`, `10` resolve to the right branch's meaning (F10 line 250, F12 line 252 and F14 line 491 point explicitly at `git show origin/main:docs/DECISIONS.md`). UR "R##" recommendation ids (R1 to R21) all exist.

## Check 2. Claim spot-check

Verdicts: **Supported**, **Partly supported** (true in part, or overstated, or missing a material qualifier), **Not supported**, **Source unreachable**. "Research" is the cited research file entry; "Web" is the original URL, where fetched.

| # | File:line | Claim (short) | Cited | Research | Web | Verdict | Exact fix |
|---|---|---|---|---|---|---|---|
| 1 | 01:7 | Adults whose youngest child is under 6 have 3.2 h leisure a day, 2.4 h less than adults without children | R2-S25 | R2 4.2: 3.20 h vs 5.6 h | bls.gov 403 | Supported (web unreachable) | none |
| 2 | 01:18, F04:16 | Secondary childcare 4.2 h weekdays, 7.7 h weekend days | R2-S26 | R2 4.3 matches | not fetched | Supported | none |
| 3 | 01:19 | 68.0% of mothers of children under 6 are in the labor force | R2-S30 | R2 4.4 matches | bls.gov 403 | Supported (web unreachable) | none |
| 4 | 01:19 | "27% of US workers have paid family leave" | R2-S33 | R2 4.5: 27% of civilian workers **had access to** paid family leave, March 2023 | not fetched (bls.gov blocks) | Partly supported | "27% of US civilian workers had access to paid family leave (March 2023)". |
| 5 | 01:15 | 35% of parents of adult children wish they had saved more; 50% of divorced parents | UR S8 | UR line 27 matches | YouGov: 35%; divorced 50% vs married 30% | Supported | none |
| 6 | 01:25 | Cards and letters are among the mementos most often saved (55%), after photos (95%) | UR S8 | UR line 35: videos 57% | YouGov: art 74%, awards 70%, report cards 57%, videos 57%, cards and letters 55% | Partly supported | "Most parents of adult children kept cards and letters from them (55%); photos (95%), art (74%) and videos (57%) are kept more often." |
| 7 | 01:34 | 63% of parents of children 0 to 4 worry about identifying location; 62% about content that could embarrass later | UR S9 | UR line 56 matches | Mott PDF: sample is parents of children 0-4; 63% and 62% | Supported | none |
| 8 | 01:28 | 41 of 104 negative reviews (39%) on bugs, sync or loss; 21 (20%) price; 9 lost work | R2 0.1 | matches | n/a (own coding) | Supported | none |
| 9 | 01:30 | New paywall drew a negative review 10 of 10 times across 6 products | R2 0.3 | matches | n/a | Supported | none |
| 10 | 01:33 | 29 of 80 positive reviews (36%) name privacy | R2 0.2 | matches | n/a | Supported | none |
| 11 | 01:49 | 74.1M speak another language at home; six launch languages 53.5M; Spanish 44.9M | R3 2.1 | 74,050,833; 53,523,232; 44,867,699 | not fetched | Supported | none |
| 12 | 01:48 | 24.5% of 2024 births to mothers born outside the 50 states and DC; 22.8% of parents of a child under 3 foreign-born | R3 2.3 | matches (R3 notes the 24.5% includes territories) | not fetched | Supported | none |
| 13 | 01:50, 02:43 | Latino parents: 92% with a Latino partner speak Spanish to children vs 55% with a non-Latino partner | R2-S31 | R2 4.9 matches (2015 survey) | pewresearch.org 403 | Supported (web unreachable) | Optional: add "(2015 survey)". |
| 14 | 01:66 | Open models score 3.6 to 6% WER on en, es, fr, pt and about 8% CER on Mandarin | R5 0.1 (R5-S9) | turbo 5.49, 3.62, 5.97, 5.44, 7.97 | Whisper Notes table matches every number | Supported | Label only: the line opens "[F]" but R5-S9 is a vendor blog R5 labels [S]. Change the leading "[F]" to "[S]". |
| 15 | F05:16 | Turbo 29.64 WER Hindi, 15.72 read MSA | R5-S9 | R5 1.1 matches | Whisper Notes: Hindi 29.64, Arabic 15.72 | Supported | none |
| 16 | 01:73, 04:33 | Tinybeans plus Qeepsake $6.49M FY26 revenue, 93,300 paid; adjusted EBITDA turned positive at $0.43M | R3 4.1 (R3-S26) | matches | Annual report: revenue $6.49M; 93.3K paid; adjusted EBITDA $426,949; the report says the figure included a one-off US$591,564 R&D Tax Incentive Refund and did not come from underlying operations | Partly supported | 04:33: "adjusted EBITDA was $0.43M, but only because of a one-off $0.59M R&D tax refund; without it the year was a loss [F] R3-S26". 01:73: replace "only just reached positive adjusted EBITDA" with "reached positive adjusted EBITDA only with a one-off tax refund". Same fix in R3 section 0 and 4.1. |
| 17 | 04:34 | Qeepsake sold for $2.7M in stock, about $54 per subscriber, 0.66 times implied revenue; paid base fell 12.6% in eight months | R3 4.1 (R3-S25) | matches R3 (R3 line 177: "No earn-out is mentioned") | MarketScreener 403. R3-S26 note 4: consideration $1.2M in shares plus $1.5M in performance rights vesting on EBITDA, 40,000 Qeepsake subscribers at 30 Sep 2026 and $3.75M revenue; recorded at $2.075M | Partly supported | "Qeepsake sold for a headline $2.7M: $1.2M in shares plus up to $1.5M in performance rights tied to EBITDA, subscriber and revenue targets (recorded at $2.075M) [F] R3-S26. That is $24 to $54 per subscriber." Fix R3 lines 174 and 177 the same way. |
| 18 | 04:35 | Tinybeans' price rise raised ARPU 40% while retention stayed at 93% | R3 4.1 | R3 fact: ARPU $75, up 40% since FY23; retention 93%. The link to the price rise is R3's inference 2 | not fetched | Partly supported | "Tinybeans' ARPU rose 40% since FY23, a period that includes its 2024 price rise, and retention was 93% [F]; that the price rise caused it is [A]." |
| 19 | 04:36 | "Ad revenue in the category fell 35% and then 32%" | R3 4.1 | R3: Tinybeans' advertising revenue only | not fetched | Partly supported | "Tinybeans' ad revenue fell 35% and then 32% in two years". |
| 20 | 04:69 | Tagalog, Vietnamese, Korean and Haitian (1.0M) are each larger than Hindi (1.06M) | R3 2.2 | R3 table: Haitian 1,041,231, Hindi 1,059,933 (Haitian ranks 10th, Hindi 9th) | Voronoi (R3-S16): Haitian 1,041,231 | **Not supported** | "Tagalog (1.9M), Vietnamese (1.6M) and Korean (1.2M) are each larger than Hindi (1.06M) in the US; Haitian (1.04M) and Russian (1.02M) are just smaller." Same fix in R3 line 11. |
| 21 | 04:20 | Tiny Treasures $29.99 a year, $4.99 a month, $99 lifetime | R1 0.1 | matches | App Store: "The whole family" $29.99, $4.99; "forever" $99.00 | Supported | none |
| 22 | 04:21 | FirstChapter monthly "Unverified in this file" | R1 0.7 | R1 lines 32, 252 and F14:96 give $6.99 a month | App Store: Premium Monthly $6.99, Annual $39.99 | Partly supported | Replace "Unverified in this file" with "$6.99 [F] R1-S4". |
| 23 | 04:23 | Dearest Plus $49.99 a year, $4.99 a month | R1 0.7 | R1 line 256 matches | not fetched | Supported | none |
| 24 | 04:24 | From, Mama $5.99 / $49.99 | R1 0.1 | matches | not fetched | Supported | none |
| 25 | 04:13 | Day One shared journals up to 30 members | R1 0.8 | matches | not fetched | Supported | none |
| 26 | 04:53 | Generic "voice memory book" is in two competitors' subtitles | R1 0.1 | R1 0.1 says so, but R1's own table (line 398) gives Tiny Treasures' subtitle as "Baby memory book you can hear" | App Store: FirstChapter "Voice Memory Book for Newborns"; Tiny Treasures "Baby memory book you can hear" | Partly supported | "The store subtitle must not be generic: FirstChapter uses 'Voice Memory Book' and Tiny Treasures 'Baby memory book you can hear' (R1-S4, R1-S67)." Fix R1 line 15 the same way. |
| 27 | 04:59 | "Apple's speech stack excludes Hindi and Arabic" | R1 0.3 | R1: Apple Intelligence excludes both; SpeechAnalyzer list from a secondary source; Arabic listed but assets failed in a beta | not fetched for SpeechAnalyzer | Partly supported | "Apple Intelligence excludes Hindi and Arabic in iOS 27, and SpeechAnalyzer support for them is unconfirmed [F, S] R1 section 0 item 3". |
| 28 | F05:87 | Apple Intelligence covers neither Hindi nor Arabic in iOS 27 | R1-S26 | matches | apple.com feature availability: none of the 47 Apple Intelligence feature language lists includes Hindi or Arabic | Supported | none |
| 29 | 04:30, F14:22 | Monthly 1-month trial in the 17 to 32 day bucket: 43.7% trial-to-paid, 77.5% first renewal; trials over 32 days excluded | R3-S33 | matches | RevenueCat: 43.7%, 77.5%, "Trials longer than 32 days are excluded"; 77.5% is "among paying subscribers"; the page does not say "median" | Supported | Precision only (F14:22): "43.7% trial-to-paid and 77.5% first renewal among paying subscribers"; drop "median". |
| 30 | F14:23 | Hard paywalls convert 10.7% of installs by day 35 vs 2.1% freemium; 12-month retention 27% vs 28% | R3-S32 | R3 matches | RevenueCat SOSA 2026 page: "median Day-35 trial-to-paid conversion rate of 10.7%, compared to just 2.1%"; retention 27% vs 28% of yearly subscribers | Partly supported | "Hard paywalls show a median day-35 conversion of 10.7% against 2.1% for freemium (RevenueCat's wording: trial-to-paid)". |
| 31 | F14:96 | FirstChapter $6.99 / $39.99; free tier of 3 AI voice entries a month | R1-S4 | matches | App Store: "3 AI voice memories per month"; $6.99 / $39.99 | Supported | none |
| 32 | F14:98 | Calm $14.99 / $69.99 | R1-S48 | R1 line 266 matches | not fetched | Supported | none |
| 33 | F14:304 | Billing Grace Period 16 days for all renewals is an available setting | R4-S11 | R4 line 45 matches | Apple: "a period of 3, 16, or 28 days"; "All Renewals" option exists | Supported | none |
| 34 | F14:311 (via R4 0.5) | Trial reminders at E-21d to E-16d and E-5d to E-4d sit inside California's 3 to 21 day notice for trials over 31 days | R4-S26, R4-S27 | R4 line 101 (17602(b)(1)) matches | law.justia.com 403 | Supported (web unreachable) | none |
| 35 | F04:91 | Day One: audio up to 3 hours, transcription limited to 10 minutes, up to 30 recordings per entry | R1-S60 | matches | Day One guide: all three confirmed | Supported | none |
| 36 | F04:92 to 94 | Remento records up to 30 minutes; StoryCorps stops at 45 minutes; Then has a 60-second limit | R1-S13, R1-S30, R1-S68 | R1 lines 100 to 102 match | not fetched | Supported | none |
| 37 | F05:19 | A Tinybeans user reported 9 GB of mobile data overnight | R2-S14 | R2 T30: "9 GB overnight twice" | not fetched | Supported | none |
| 38 | F06:16 | 76% of US adults say telling AI-made from human-made content apart is extremely or very important | R2-S27 | R2 4.6 matches | Pew: "most Americans (76%) say it's extremely or very important" | Supported | none |
| 39 | F21:20, F21:79 | FirstChapter subtitle "Voice Memory Book for Newborns"; Tiny Treasures "Baby memory book you can hear" | R1-S4, R1-S67 | matches | App Store pages confirm both | Supported | none |
| 40 | 03:77 | Base case at new prices: $52.96 per payer, about 990 payers, about $52.5k gross, $44.7k net after 15% | R3 5.1 inputs | 19,835 x 5% = 991.75; 0.7 x 49.99 + 0.3 x 59.88 = 52.96; x 991.75 = $52,520; x 0.85 = $44,642 | n/a (arithmetic) | Partly supported | Change "$44.7k net" to "$44.6k net". |

Count (research verdict, worst of research and web): **28 Supported** (rows 1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 21, 23, 24, 25, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39), **11 Partly supported** (rows 4, 6, 16, 17, 18, 19, 22, 26, 27, 30, 40), **1 Not supported** (row 20).

Web checks (23 claims, 19 distinct URLs): **12 Supported** (rows 5, 7, 14, 15, 21, 28, 29, 31, 33, 35, 38, 39); **6 Partly supported** (rows 6, 16, 17, 22, 26, 30); **1 Not supported** (row 20); **4 Source unreachable** (rows 1, 3, 13, 34). Row 17's MarketScreener page (R3-S25) also returned 403; the finding comes from R3-S26, which R3 cites for the same section. Apple's Family Sharing page (R4-S17) was also fetched and confirms "once you turn on Family Sharing ... you can't turn it off", as F11 line 182 says.

## Check 3. Code claims

| # | Spec and line | Claim | What the code shows | Verdict | Exact fix |
|---|---|---|---|---|---|
| 1 | F04:363 | `lib/resilience/keep-awake.ts` (`useKeepAwakeWhile`) over `expo-keep-awake`, used by `listen.tsx` and `read-together.tsx` | File exists, imports `expo-keep-awake`; both screens call `useKeepAwakeWhile` | Supported | none |
| 2 | F04:376 | `expo-keep-awake` is "New [A]", not yet installed | `apps/mobile/package.json` line 34: `"expo-keep-awake": "~57.0.2"`; the keep-awake file says "expo-keep-awake is already a dependency" | **Not supported** | Move `expo-keep-awake` ~57.0.2 into the installed list and delete "New: `expo-keep-awake` [A]". |
| 3 | F04:364 | `lib/capture/probe.ts` exists; a take that does not load is kept, marked `unrecoverable`, listed in Settings > Recordings | `probePlayable` in `probe.ts`; `sweep.ts` lines 82 to 88 set state `unrecoverable`; `settings/recordings.tsx` reads it | Supported | Optional: name `sweep.ts` as where the mark is set. |
| 4 | F04:365 | `components/book/quiet-day.logic.ts`, `quiet-day-row.tsx` built | Both files exist, with `quiet-day.logic.test.ts` | Supported | none |
| 5 | F04:455 | `packages/core/src/capture.ts` not built; `listen.tsx` `Phase` is ready, asking, denied, recording, paused, finishing | No `capture.ts`; `listen.tsx` line 41 matches exactly | Supported | none |
| 6 | F04:465 | No widget package in `apps/mobile/package.json` | No `expo-widgets` entry | Supported | none |
| 7 | F04:466 | `capture_ended`, `capture_recovered`, `mic_permission_result` not in the analytics catalogue | None of the three in `packages/analytics/src/catalog.ts` (it has `capture_started`, `capture_discarded`, `mic_denied`) | Supported | none |
| 8 | F05:445 | `ScribeAudioModule.swift` exposes `probe`, `decodePcm16`, `sha256File`, `enhance` | Four `AsyncFunction`s at lines 55, 65, 69, 88 | Supported | none |
| 9 | F05:451 | `ENGINE_VERSION = 5` | `packages/core/src/pipeline.ts` line 24 | Supported | none |
| 10 | F05:450 | `transcription-queue/` has `machine.ts`, `index.ts`, `clean.ts`, `use-words.ts`, `copy.ts` | Exactly those five files | Supported | none |
| 11 | F05:447 | `models/catalog.ts` exports `SPEECH_MODELS`, `LANGUAGE_MODELS`, `speechPlan`; `tiers.ts`, `speech-packs.ts` exist | Lines 106, 212, 249; both files present | Supported | none |
| 12 | F05:448, F05:453 | Packs install nothing until `packages/api/src/keys.ts` has a key; `scripts/packs/` has keygen and publish, never run | `TRUSTED_SIGNING_KEYS` is an empty array; `keygen.ts`, `publish.ts` present | Supported | none (note: the comment in `keys.ts` names `keygen.mjs`, the file is `keygen.ts`; a code comment, not a PRD error) |
| 13 | F06:369 | `verify.ts` returns `not_vetted_for_language`; `changes_invisible` does not exist | `verify.ts` line 386 and `types.ts` line 99; no `changes_invisible` anywhere in `packages/core/src` | Supported | none |
| 14 | F06:381 | `packages/core/src/review-state.ts` not built | File absent | Supported | none |
| 15 | F06:376 | `packages/core/src/author-edits.ts` not built | File absent | Supported | none |
| 16 | F14:337 | `freeLettersFrom` in `plan.ts`; `effectiveFreeLetters` in `packages/api/src/remote-config.ts`; wired in `_layout.tsx` | `plan.ts` line 134; `remote-config.ts` line 129; `_layout.tsx` lines 9 and 74 | Supported | none |
| 17 | F14:321 | `modules/scribe-store/ios/ScribeStoreModule.swift`; `plan-store.ts` `startPlus` | File present; `startPlus` at `plan-store.ts` line 105 | Supported | none |
| 18 | F14:331 | `20261004000000_plus_on_device_only.sql` pending; `.github/migrations-applied.txt` lists two files | Migration present; applied list has only `20260930000000_scribe_core.sql` and `20261001000000_scribe_hardening.sql` | Supported | none |
| 19 | F21:14, 04:44 | Every build profile sets `EXPO_PUBLIC_SERVER_FEATURES` to `off`; the switch is `lib/capabilities.ts` | `eas.json` lines 14, 23, 32 all `"off"`; `capabilities.ts` reads the variable | Supported | none (note: `capabilities.ts` line 35 comment still says "v1.1 onwards", stale since M14; a code comment) |
| 20 | 03:34 | "Plus gates one thing ... Reading, playing, exporting, deleting and restoring a letter are never gated (`FreeForever` in `plan.ts`)" | `FreeForever` = read, play_recording, export, family_authors, invite, download_backed_up_audio, restore_backup, delete. `GatedFeature` = keep_letter, backup_upload, theme_extra; only `decideKeepLetter` has a caller (`gates.ts` line 92). "Restoring" in the type means restoring a backup, not Recently deleted | Partly supported | "At v1.0 Plus gates one thing ... (`backup_upload` and `theme_extra` stay in `GatedFeature` with no caller, F14-REQ-022). Reading, playing, exporting, deleting and restoring a backup are in `FreeForever`; restoring from Recently deleted is never gated (F09, D-085)." |

Count: 18 Supported, 1 Partly supported (row 20), 1 Not supported (row 2).

## What was not checked

- Claims citing `docs/research/competitors/us.md` (04 section 2 price-floor and median figures, F14 Qeepsake and Dearest rows) were outside the requested research set.
- Many bls.gov, pewresearch.org, marketscreener.com and law.justia.com pages return 403 to automated fetches; those rows rest on the research file alone.
- The script confirms that an id exists, not that it is the right id for the sentence. Beyond D-051 to D-053, semantic fit was checked only for the 40 claims above.
