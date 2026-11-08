# Next: ROI scoring for the next set of requirements (Lane F)

Status: draft for the "next set of requirements" programme, 8 Nov 2026. Docs only. Role: decision science, working from the lane A to E drafts. This file changes no decision, sets no price and edits no other file. It is a scoring model and a ranked table. It is not a forecast.

## 0. Limits, stated first

1. **There is no usage or revenue data.** The product is in a family-group alpha. Every score below is a judgment on a 0 to 5 or 1 to 5 scale, written by one analyst (a Claude role, not a person with customers). The ranking is an ordering aid for the founder's attention. It is not a measurement and must never be quoted as one.
2. **Cost is the soft spot, and cost dominates the ranking.** The founder review minutes, device-session hours and agent days come from the lane D draft (`04-feasibility.md` sections 1 and 5), which says itself that "no throughput has been measured on this repo". Section 4 shows the ranking barely moves when I change any value weight and moves a lot when I change cost. Fix cost with measurements before trusting the order (section 6, measurement M9).
3. **No invented market sizes, conversion rates or user counts.** Every number is one of: a repo figure with its file, a page I opened with URL and date, or an ASSUMPTION with reasoning and a low, base and high value. The 5% pay rate, the 60% annual share and the run costs per family are the PRD's own assumptions, copied with their labels. I did not re-open the sources behind them.
4. **Counsel cost is not priced in dollars.** No quote exists in the repo. Counsel enters the model as founder coordination hours and calendar weeks (section 1.2). The dollar cost is a founder-only fact.
5. **Consent bias.** Only opted-in families can be measured on the device, and in-app analytics is off for the whole 1.0 line (D-124 item 3, D-095). So today the allowlisted events measure nobody. Section 6 says what is measurable now and what bias each source carries.
6. **The sources are drafts.** I read four of the five phase 1 files from their branches on 8 Nov 2026 (`docs/next-customer-8nov`, `docs/next-benchmark-8nov`, `docs/next-feasibility-8nov`, `docs/next-compliance-8nov`, `docs/build12-gap-map-8nov`). I fetched the benchmark file (`02-benchmark.md`) but did not read it, so no competitor benchmark enters the scores. The compliance file is an engineering reading, not legal advice. The QA bug-hunt note lives in the Claude project and I could not open it.
7. **Apple pages were read through a summarising fetch tool**, not as raw text, and carry no "last updated" date. The founder should read both pages himself before relying on the commission figures (section 5.1).
8. **Not decided here.** Pricing, whether analytics is on, the Small Business Program, counsel engagement and release scope are founder-only. Where I recommend, I mark it **FOUNDER ONLY**.

## 1. Method

The question each score answers: for the next hour of the founder's scarce attention (review, device tests, Apple and Supabase dashboards, counsel threads), which theme returns the most to a parent or relative and to the business, after the risk of doing it?

Unit of cost is the **founder-hour equivalent (FH)**. Agents are plentiful; the founder is not (`04-feasibility.md` section 0 item 3).

### 1.1 Customer ROI (value to a parent or relative, per FH)

Customer value points:

`CV = min(150, 100 x (F x S x B / 125) x T)`

| Term | Meaning | Scale |
|---|---|---|
| F, frequency of need | How often a parent or relative meets the need | 1 once or rarely, 3 about monthly, 5 every new family or every session |
| S, severity | How much it hurts or helps when met or missed | 1 minor annoyance, 3 changes whether they keep going, 5 a lost letter or broken trust |
| B, breadth | Share of families affected | 1 under 10%, 2 10 to 25%, 3 25 to 50%, 4 50 to 75%, 5 over 75%. ASSUMPTION bands: no usage data exists |
| T, trust effect | Multiplier for the product's core promises (nothing lost, nothing held hostage, plain money, privacy) | 0.8 could erode trust, 1.0 neutral, 1.25 builds it, 1.5 protects a core promise |

F, S and B come from the ranked needs in `01-customer-needs.md` section 2 (rank, "how often", "bite", evidence tag). Where that file says HYPOTHESIS or "single signal", I scored low. `Customer ROI = 10 x CV / FH`, read as "points per ten founder-hours".

### 1.2 Cost (founder-hour equivalents)

`FH = review_h + 3 x device_sessions + hands_h + counsel_h + 0.5 x agent_days`

- `review_h`: founder review. From `04-feasibility.md` section 5.2 where the theme appears there (22 minutes per unfenced PR, 45 per fenced PR, [A] from `08-delivery.md` 6.1); mine for the reliability and release rows.
- `device_sessions`: real-phone drills. 3 FH each base. [A] between a 15 to 90 minute drill and an 8-hour scripted session (`04` section 5.1).
- `hands_h`: founder-only dashboard work, from the gap map (about 7 h for the first production bring-up, `docs/release/TESTFLIGHT.md` line 139 as cited there) plus my additions, marked in section 2.
- `counsel_h`: none 0, light 4, heavy 15 FH of coordination (reading drafts, answering questions). [A] No counsel price exists.
- `agent_days`: 04 size bands, taken as S 2, M 7, L 18, XL 30 or more days. Charged 0.5 FH a day for merge conflicts, triage and context handoffs. [A]

Counsel also costs calendar time, which enters the WSJF duration (section 1.5), not FH.

### 1.3 Business ROI (effect on the business, per FH)

Business value points:

`BV = 20 x (wa x act + wr x ret + wp x conv + wf x ref + wc x serve + wrr x risk + wo x opt)`

Each lever is scored 0 to 5 (5 = could move that lever materially for the whole product). `serve` is signed, from -3 (raises cost to serve a lot) to +3 (lowers it). The levers:

| Lever | What it means here | Why this weight (base) |
|---|---|---|
| act, activation | More new families reach a first saved letter | 0.20. Nothing else happens without a first letter (WKF is the north star, `docs/analytics/TRACKING_PLAN.md` 1.1) |
| ret, retention | More families still making letters at week 4 and month 6 | 0.20. The keepsake value builds over months (PRD 4.4) |
| conv, conversion to Plus | More families reach the 2-letter gate and say yes | 0.20. Revenue is the viability test but its evidence is the weakest (PRD 4.4 calls the 5% pay rate "the weakest input") |
| ref, referral | More families bring in another family or a relative | 0.10. No channel has evidence yet (PRD 4.5) |
| serve, cost to serve | Server, support and founder time per family | 0.05. Small at any plausible scale (section 5) |
| risk, risk reduction | Removes a release blocker or a register risk | 0.15. The register's top risks block the public release (`05` section 4) |
| opt, option value | Makes later choices cheaper or better informed | 0.10 |

`Business ROI = 10 x BV / FH`. BV and CV are ordinal scores, not dollars. Section 5 is where dollars live.

### 1.4 Risk adjustment (from the compliance register)

`Risk-adjusted score = (wcust x CustROI + (1 - wcust) x BizROI) x (1 - k x R / 25) x p_ship`

- `R` is the highest score (likelihood x impact, 1 to 25) among the `05-compliance-risk.md` section 4 register rows that the work **adds or is exposed to**. Rows the work reduces count as `risk` in BV, not here. The highest register score is 20 (row 1).
- `k` scales it so the worst case takes 40% off (base 0.5).
- `p_ship` is the chance the gate clears and the theme ships inside a horizon of about six months: `go` 1.0, `go slow` 0.7, `stop` 0.25, from the ratings in `05` section 5. [A]
- `wcust` is the weight on customer against business: 0.5, since the founder asked for both.

### 1.5 WSJF (Reinertsen)

Weighted shortest job first is cost of delay divided by duration. Here:

`CoD = V x TC + 10 x risk + 6 x E` with `V = wcust x CV + (1 - wcust) x BV`

`duration (weeks) = max(agent_days / 5, (review_h + 3 x device_sessions + hands_h) / 10) + counsel_wait`, with a floor of 0.5.

`WSJF = CoD / duration`. TC is a time-criticality multiplier: 1 none, 1.5 a soft date, 2 a hard date or a block on the public release. Dated drivers I found: California AB 1043 from 1 Jan 2027 (`05` risk 4), the public submission target of Mon 4 Jan 2027 (gap map section 3.3), Mother's Day 9 May 2027 (`01` section 3). E (0 to 5) counts how many later themes a theme unblocks, from the sequencing in `04` section 4. Units are relative points per week, useful for order only.

### 1.6 Every parameter, with low, base and high

All are ASSUMPTIONS unless a source is named.

| Parameter | Low | Base | High | Reasoning |
|---|---|---|---|---|
| Weights act, ret, conv, ref, serve, risk, opt | .10, .10, .05, .05, 0, .05, .05 | .20, .20, .20, .10, .05, .15, .10 | .30, .30, .35, .20, .10, .25, .20 | Each swept alone and renormalised to sum 1. Base follows the table in 1.3 |
| wcust (customer against business) | 0.3 | 0.5 | 0.7 | Neutral default; swept both ways |
| Device session cost (FH) | 1.5 | 3 | 6 | Lane D budgets 15 to 90 minutes a drill and 8 hours a full session |
| Agent-day cost (FH) | 0 | 0.5 | 1 | Merge and triage overhead; may be nil if review is the only queue |
| Counsel coordination (light / heavy FH) | 2 / 8 | 4 / 15 | 8 / 30 | No quote exists |
| Counsel wait (light / heavy weeks) | 2 / 4 | 3 / 6 | 6 / 10 | D-121 context assumes 3 weeks to comments and up to 6 more to sign-off (gap map section 3.3) |
| Founder programme hours a week | 6 | 10 | 15 | Lane D's plan of 12 merges a week at 22 and 45 minutes is about 6 hours of review alone |
| Risk cut k | 0.25 | 0.5 | 0.75 | Register scores are engineering opinion, not measurement |
| p_ship, go slow | 0.5 | 0.7 | 0.9 | Gate-clearing odds are unknown |
| p_ship, stop | 0.1 | 0.25 | 0.6 | Stops lift only through a founder decision plus counsel |
| WSJF weights on risk and E | 5 and 3 | 10 and 6 | 20 and 12 | Relative weight of enabling work against raw value |
| CV cap | n/a | 150 | n/a | Stops one theme's multipliers from dominating |
| Score noise in section 4 | n/a | each 0 to 5 score moves by 1 with probability 0.35 | n/a | Stands in for "I could be wrong by a notch" |
| Cost error in section 4 | n/a | log-normal, sigma 0.4 on agent, review, device and hands | n/a | Roughly x0.5 to x2 at two standard deviations |

## 2. The themes and their inputs

37 themes. They merge the opportunity list in `01` section 5, the build 12 gap map ranks (all items from section 4 of that file) and the reliability rows R1 to R13 in `04` section 3. Some `04` items are folded into others or left out: server transcription (`04` item 8), the safety classifier (9), continuity (14), the keepsake extras (17), Vault (26), realtime (27), polish bundle (29), the video half of item 2, and `01` opportunity 25 (the parent in the book, a HYPOTHESIS backed only by a photo-printer survey). They were not scored because each is either blocked by a person (clinician), stop-rated, or has no evidence beyond one signal. Add them with the same method if the founder wants them ranked.

Table 2A: value inputs (F, S, B, T as in 1.1; the seven lever scores as in 1.3). "act" is activation, "ret" retention, "conv" conversion, "ref" referral, "serve" cost to serve, "risk" risk reduction, "opt" option value.

| ID | Theme | Where it comes from | F | S | B | T | act | ret | conv | ref | serve | risk | opt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T01 | Recording and Listen reliability, save proof | 01 #1; gap 15; 04 R1 part | 5 | 5 | 5 | 1.5 | 5 | 5 | 3 | 3 | 1 | 5 | 1 |
| T02 | First-run friction: date picker, consent links, download wait | 01 #2 to #5; alpha reports; 05 risk 5 | 5 | 4 | 5 | 1.25 | 5 | 3 | 3 | 2 | 1 | 2 | 0 |
| T03 | Device evidence and QA rows (R1) | 04 R1; gap 40 | 3 | 4 | 5 | 1.0 | 3 | 3 | 2 | 1 | 2 | 5 | 2 |
| T04 | Open PR triage (R2) | 04 R2 | 2 | 2 | 5 | 1.0 | 1 | 1 | 0 | 0 | 2 | 3 | 3 |
| T05 | Server-security PRs (#602, #657, #632, #633) | gap 1, 2; 04 R3 | 1 | 5 | 5 | 1.5 | 0 | 2 | 1 | 0 | 0 | 5 | 2 |
| T06 | Consent and audit migration chain (#634, #636, #637) | gap 17; 04 R4; 05 risk 20 | 1 | 4 | 5 | 1.25 | 0 | 0 | 0 | 0 | 0 | 4 | 2 |
| T07 | Local database migration flake (R6) | 04 R6 | 2 | 5 | 3 | 1.5 | 1 | 4 | 1 | 1 | 1 | 4 | 2 |
| T08 | Production backend bring-up, hosted smoke, RLS on hosted | gap 3, 9, 19, 20, 34 and sec 5; 04 R12; 05 risk 1 | 4 | 3 | 4 | 1.0 | 1 | 4 | 3 | 2 | -2 | 0 | 5 |
| T09 | Account deletion proven end to end, web delete page | gap 4, 12; 05 risk 20 | 1 | 4 | 5 | 1.5 | 0 | 1 | 1 | 1 | 0 | 5 | 3 |
| T10 | Reviewer demo account, Notes for Review rewrite | gap 5, 6; 05 risk 5 | 1 | 1 | 1 | 1.0 | 0 | 0 | 0 | 0 | 0 | 3 | 5 |
| T11 | Age signal request and sign-up country check | gap 7, 8; 05 risks 4, 11 | 1 | 2 | 2 | 1.0 | 0 | 0 | 0 | 0 | 0 | 5 | 3 |
| T12 | Production backup, kill, rollback, restore drill | gap 10, 11; 04 R7; 05 risk 6 | 1 | 5 | 5 | 1.5 | 0 | 3 | 1 | 2 | -1 | 5 | 2 |
| T13 | Counsel-cleared texts live, support and terms pages, labels | gap 12, 13, 27 to 30; 05 risk 1 | 1 | 3 | 5 | 1.25 | 1 | 1 | 2 | 0 | 0 | 5 | 4 |
| T14 | Billing trust charter and plain Plus page | 01 #23; 04 item 23; 05 risk 7 | 3 | 4 | 5 | 1.5 | 1 | 2 | 4 | 2 | -1 | 3 | 1 |
| T15 | Partner hears my voice (shared voice) | 01 #6; 04 item 10; 05 sec 3.1, risks 2, 6, 9 | 4 | 3 | 3 | 1.25 | 2 | 4 | 4 | 4 | -2 | 1 | 5 |
| T16 | Family contributors in app, roles, safety floor | 04 item 11; 05 risks 3, 9, 10 | 3 | 3 | 3 | 1.0 | 1 | 4 | 3 | 4 | -2 | 0 | 4 |
| T17 | Web contribution page (relative adds without the app) | 01 #7, #9; 04 item 13; 05 sec 3.2, risks 2, 3, 12 | 3 | 4 | 4 | 1.25 | 2 | 4 | 3 | 5 | -3 | 0 | 4 |
| T18 | Web reader (shareable link for relatives) | 01 #8; 04 item 18; 05 sec 3.13 (stop) | 3 | 3 | 4 | 1.0 | 1 | 3 | 2 | 4 | -2 | 0 | 3 |
| T19 | Family notifications and push | 01 #10; 04 item 12; 05 risks 16, 17 | 3 | 2 | 3 | 1.0 | 0 | 3 | 1 | 2 | -1 | 0 | 2 |
| T20 | Quick capture: lock screen, widget, Action button | 01 #14; 04 item 1 | 4 | 3 | 3 | 1.0 | 3 | 4 | 3 | 1 | 0 | 0 | 2 |
| T21 | Photo with a letter | 01 #16; 04 item 2; 05 sec 3.8, risks 1, 10, 20 | 3 | 3 | 4 | 1.0 | 2 | 3 | 2 | 3 | -2 | 0 | 3 |
| T22 | Catch-up: backdate letters, import voice memos | 01 #12, #13; 04 item 3 (import only) | 3 | 3 | 3 | 1.25 | 3 | 3 | 3 | 1 | 0 | 0 | 1 |
| T23 | Hindi and English in one letter | 01 #18; 04 item 4 | 2 | 5 | 2 | 1.25 | 2 | 3 | 3 | 3 | 0 | 0 | 3 |
| T24 | More spoken languages (per pack) | 04 item 5 | 2 | 4 | 2 | 1.0 | 2 | 2 | 2 | 2 | 0 | 0 | 3 |
| T25 | Names that learn, prompts v3 | 01 #17; 04 item 6 | 3 | 3 | 3 | 1.25 | 2 | 3 | 2 | 1 | 0 | 1 | 1 |
| T26 | Reminder tuning from alpha data | 01 #19; F13 already built; 05 risk 16 | 4 | 4 | 4 | 1.0 | 1 | 5 | 3 | 1 | 0 | 1 | 2 |
| T27 | Read together highlight, word timings, month playback | 01 #20; 04 items 7, 15 part | 2 | 2 | 3 | 1.0 | 1 | 2 | 2 | 2 | 0 | 0 | 1 |
| T28 | Sealed letters, birthday letters, On this day | 01 #22; 04 item 15; 05 risk 9 | 2 | 3 | 3 | 1.0 | 1 | 3 | 3 | 2 | 0 | 0 | 2 |
| T29 | Print-ready file export | 01 #21 (file only); 04 item 19 file; 05 sec 3.3 (allowed now) | 2 | 3 | 3 | 1.0 | 0 | 2 | 3 | 3 | 0 | 0 | 4 |
| T30 | Printed book with fulfilment | 01 #21; 04 item 19 fulfilment; 05 sec 3.3 (stop), risk 15 | 2 | 3 | 3 | 1.0 | 0 | 2 | 3 | 3 | -3 | 0 | 3 |
| T31 | Android app | 01 #11; 04 item 24; 05 sec 3.4 (stop) | 4 | 4 | 2 | 1.0 | 4 | 1 | 3 | 3 | -3 | 0 | 4 |
| T32 | Search across the book | 04 item 16; 05 sec 3.7 | 3 | 2 | 3 | 1.0 | 0 | 3 | 1 | 0 | 0 | 0 | 1 |
| T33 | Rating ask, store page and onboarding tests, lifecycle email | 04 item 20 (G-03 to G-08) | 1 | 2 | 5 | 1.0 | 4 | 1 | 1 | 4 | 0 | 0 | 3 |
| T34 | Plus follows the book (co-parent entitlement) | 04 item 21; 05 sec 3.11, risk 7 | 2 | 3 | 3 | 1.0 | 0 | 1 | 3 | 1 | -2 | 1 | 2 |
| T35 | Gifting, offer codes, lifetime plan | 04 item 22; 05 sec 3.10, risk 7 | 1 | 2 | 2 | 1.0 | 2 | 0 | 3 | 4 | -1 | 0 | 2 |
| T36 | Support route and help centre, answer within a day | 01 #24; 04 item 30 part; R7 theme 4 | 3 | 4 | 3 | 1.5 | 1 | 4 | 2 | 2 | -2 | 2 | 1 |
| T37 | Opt-in analytics and insights loop switched on (founder-only) | 04 item 20 note; D-124 item 3; 05 risk 1 | 1 | 2 | 5 | 1.0 | 0 | 0 | 0 | 0 | -1 | 1 | 5 |

Table 2B: cost, risk and timing inputs. Agent days and review hours follow `04` section 5.2 where the theme appears there; for T01 to T14, T20 to T26, T29, T32, T33, T36 and T37 the figures are mine (ASSUMPTION), built from the PR counts and gap map sizes. "Register max score" is the highest `05` risk row the work adds or is exposed to (section 1.4).

| ID | Agent days | Founder review h | Device sessions | Founder hands h | Counsel load | Register max score | Gate | Time crit. | Enables |
|---|---|---|---|---|---|---|---|---|---|
| T01 | 6 | 3 | 2 | 0 | none | none | go | 2 | 5 |
| T02 | 5 | 3 | 2 | 0 | light | 12 | go | 1.5 | 2 |
| T03 | 4 | 3 | 8 | 0 | none | none | go | 2 | 5 |
| T04 | 3 | 6 | 0 | 0 | none | none | go | 1 | 3 |
| T05 | 4 | 4.5 | 1 | 0 | none | none | go | 2 | 5 |
| T06 | 3 | 4.5 | 0 | 1 | light | 12 | go slow | 2 | 4 |
| T07 | 3 | 1.5 | 2 | 0 | none | none | go | 1.5 | 4 |
| T08 | 8 | 4 | 3 | 11 | light | 20 | go slow | 2 | 5 |
| T09 | 5 | 3.5 | 3 | 2 | light | 12 | go | 2 | 5 |
| T10 | 2 | 1.5 | 1 | 1 | none | 12 | go | 2 | 5 |
| T11 | 8 | 2.5 | 2 | 0 | heavy | 16 | go slow | 2 | 5 |
| T12 | 4 | 3 | 2 | 3 | none | 10 | go slow | 2 | 5 |
| T13 | 4 | 2 | 0 | 2 | heavy | 20 | go slow | 2 | 5 |
| T14 | 2 | 0.7 | 1 | 0 | light | 12 | go slow | 1.5 | 3 |
| T15 | 28 | 10 | 3 | 2 | heavy | 15 | go slow | 1 | 4 |
| T16 | 30 | 9.5 | 3 | 0 | heavy | 15 | go slow | 1 | 3 |
| T17 | 32 | 8 | 3 | 2 | heavy | 15 | go slow | 1 | 3 |
| T18 | 18 | 6 | 2 | 0 | heavy | 15 | stop | 1 | 2 |
| T19 | 15 | 6 | 2 | 1 | light | 12 | go slow | 1 | 2 |
| T20 | 18 | 4 | 3 | 0 | none | none | go | 1 | 1 |
| T21 | 18 | 6.5 | 2 | 0 | heavy | 20 | go slow | 1 | 2 |
| T22 | 8 | 2 | 1 | 0 | light | none | go | 1 | 1 |
| T23 | 18 | 4 | 2 | 2 | none | none | go slow | 1 | 2 |
| T24 | 7 | 1 | 1 | 1 | none | none | go slow | 1 | 1 |
| T25 | 7 | 1.5 | 0 | 0 | none | none | go | 1 | 1 |
| T26 | 3 | 1 | 1 | 0 | none | 12 | go | 1 | 1 |
| T27 | 15 | 4 | 2 | 0 | none | none | go | 1 | 1 |
| T28 | 7 | 2.5 | 1 | 0 | light | 12 | go slow | 1 | 1 |
| T29 | 12 | 3.5 | 1 | 0 | none | none | go | 1.5 | 2 |
| T30 | 30 | 4 | 2 | 8 | heavy | 12 | stop | 1 | 1 |
| T31 | 60 | 30 | 10 | 10 | heavy | 12 | stop | 1 | 1 |
| T32 | 7 | 2 | 1 | 0 | none | none | go | 1 | 1 |
| T33 | 5 | 1.5 | 1 | 2 | none | none | go | 1.5 | 1 |
| T34 | 18 | 6.5 | 1 | 0 | heavy | 12 | go slow | 1 | 1 |
| T35 | 7 | 3.5 | 1 | 0 | heavy | 12 | go slow | 1 | 1 |
| T36 | 5 | 2 | 0 | 3 | none | none | go | 1 | 2 |
| T37 | 6 | 2.5 | 1 | 1 | heavy | 20 | go slow | 1.5 | 3 |

Three inputs worth a second look by whoever owns them:

- **T22 (catch-up and import).** `01` says whether backdating is built "was not checked". If it exists, T22 costs less and rises. First step: check the code.
- **T33 (rating ask and store page).** The rating prompt needs `expo-store-review`, a native change not yet installed (`04` item 20). I added one device session for it.
- **T26 (reminder tuning).** It needs data that does not exist. Its cost is small, but the first work is the measurement, not a build.

## 3. Results

Reading the columns: Customer value and Business value are the points in 1.1 and 1.3. Cost is FH. Customer ROI and Business ROI are points per ten FH. Risk cut is `k x R / 25`. The risk-adjusted score is the number the rank follows. Rank range is the 10th to 90th percentile of the rank across 3,000 random draws of the assumptions in 1.6 (section 4): it measures how stable the order is under my own uncertainty, nothing about the world. "Release gate" marks work the gap map or lane D treats as needed before a public App Store release (`BUILD12-GAP-MAP` sections 3 and 4; `04` section 3 priority B).

| Rank | ID | Theme | Cust. value | Biz. value | Cost (FH) | Cust. ROI | Biz. ROI | Risk cut | Gate | Risk-adj. score | Rank range (P10 to P90) | WSJF | WSJF rank | Release gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | T01 | Recording and Listen reliability, save proof | 150 | 76 | 12.0 | 125.0 | 63.3 | 0% | go | 94.2 | 1 to 4 | 255.0 | 1 | yes |
| 2 | T26 | Reminder tuning from alpha data | 51 | 45 | 5.5 | 93.1 | 81.8 | 24% | go | 66.5 | 1 to 7 | 106.8 | 7 |  |
| 3 | T25 | Names that learn, prompts v3 | 27 | 35 | 5.0 | 54.0 | 70.0 | 0% | go | 62.0 | 1 to 7 | 33.6 | 13 |  |
| 4 | T36 | Support route and help centre, answer within a day | 43 | 38 | 7.5 | 57.6 | 50.7 | 0% | go | 54.1 | 1 to 8 | 72.6 | 8 |  |
| 5 | T07 | Local database migration flake (R6) | 36 | 43 | 9.0 | 40.0 | 47.8 | 0% | go | 43.9 | 2 to 12 | 164.3 | 3 |  |
| 6 | T02 | First-run friction: date picker, consent links, download wait | 100 | 55 | 15.5 | 64.5 | 35.5 | 24% | go | 38.0 | 4 to 13 | 37.1 | 12 |  |
| 7 | T14 | Billing trust charter and plain Plus page | 72 | 42 | 8.7 | 82.8 | 48.3 | 24% | go slow | 34.9 | 5 to 14 | 39.3 | 11 |  |
| 8 | T05 | Server-security PRs (#602, #657, #632, #633) | 30 | 31 | 9.5 | 31.6 | 32.6 | 0% | go | 32.1 | 4 to 14 | 176.2 | 2 | yes |
| 9 | T04 | Open PR triage (R2) | 16 | 25 | 7.5 | 21.3 | 33.3 | 0% | go | 27.3 | 4 to 16 | 114.2 | 6 |  |
| 10 | T22 | Catch-up: backdate letters, import voice memos | 27 | 40 | 13.0 | 20.8 | 30.8 | 0% | go | 25.8 | 7 to 16 | 8.6 | 24 |  |
| 11 | T33 | Rating ask, store page and onboarding tests, lifecycle email | 8 | 38 | 9.0 | 8.9 | 42.2 | 0% | go | 25.6 | 5 to 16 | 40.5 | 10 |  |
| 12 | T29 | Print-ready file export | 14 | 34 | 12.5 | 11.5 | 27.2 | 0% | go | 19.4 | 7 to 18 | 20.1 | 18 |  |
| 13 | T24 | More spoken languages (per pack) | 13 | 34 | 8.5 | 15.1 | 40.0 | 0% | go slow | 19.3 | 7 to 19 | 21.0 | 16 |  |
| 14 | T32 | Search across the book | 14 | 18 | 8.5 | 16.9 | 21.2 | 0% | go | 19.1 | 7 to 20 | 15.9 | 20 |  |
| 15 | T03 | Device evidence and QA rows (R1) | 48 | 55 | 29.0 | 16.6 | 19.0 | 0% | go | 17.8 | 9 to 21 | 67.8 | 9 | yes |
| 16 | T20 | Quick capture: lock screen, widget, Action button | 29 | 46 | 22.0 | 13.1 | 20.9 | 0% | go | 17.0 | 9 to 20 | 12.1 | 23 |  |
| 17 | T12 | Production backup, kill, rollback, restore drill | 30 | 38 | 14.0 | 21.4 | 27.1 | 20% | go slow | 13.6 | 11 to 22 | 123.3 | 5 | yes |
| 18 | T10 | Reviewer demo account, Notes for Review rewrite | 1 | 19 | 6.5 | 1.2 | 29.2 | 24% | go | 11.6 | 11 to 23 | 145.1 | 4 | yes |
| 19 | T23 | Hindi and English in one letter | 20 | 44 | 21.0 | 9.5 | 21.0 | 0% | go slow | 10.7 | 13 to 24 | 12.2 | 22 |  |
| 20 | T28 | Sealed letters, birthday letters, On this day | 14 | 36 | 13.0 | 11.1 | 27.7 | 24% | go slow | 10.3 | 16 to 24 | 7.1 | 26 |  |
| 21 | T27 | Read together highlight, word timings, month playback | 10 | 26 | 17.5 | 5.5 | 14.9 | 0% | go | 10.2 | 14 to 25 | 7.9 | 25 |  |
| 22 | T09 | Account deletion proven end to end, web delete page | 24 | 31 | 21.0 | 11.4 | 14.8 | 24% | go | 10.0 | 16 to 24 | 30.3 | 14 | yes |
| 23 | T06 | Consent and audit migration chain (#634, #636, #637) | 20 | 16 | 11.0 | 18.2 | 14.5 | 24% | go slow | 8.7 | 15 to 24 | 27.8 | 15 | yes |
| 24 | T08 | Production backend bring-up, hosted smoke, RLS on hosted | 38 | 44 | 32.0 | 12.0 | 13.8 | 40% | go slow | 5.4 | 21 to 31 | 20.8 | 17 | yes |
| 25 | T13 | Counsel-cleared texts live, support and terms pages, labels | 15 | 39 | 21.0 | 7.1 | 18.6 | 40% | go slow | 5.4 | 22 to 29 | 19.7 | 19 | yes |
| 26 | T17 | Web contribution page (relative adds without the app) | 48 | 51 | 50.0 | 9.6 | 10.2 | 30% | go slow | 4.9 | 23 to 31 | 5.4 | 29 |  |
| 27 | T15 | Partner hears my voice (shared voice) | 36 | 59 | 50.0 | 7.2 | 11.8 | 30% | go slow | 4.7 | 23 to 31 | 7.0 | 27 |  |
| 28 | T19 | Family notifications and push | 14 | 23 | 24.5 | 5.9 | 9.4 | 24% | go slow | 4.1 | 23 to 33 | 5.1 | 30 |  |
| 29 | T21 | Photo with a letter | 29 | 38 | 36.5 | 7.9 | 10.4 | 40% | go slow | 3.8 | 25 to 32 | 4.7 | 31 |  |
| 30 | T35 | Gifting, offer codes, lifetime plan | 3 | 31 | 25.0 | 1.3 | 12.4 | 24% | go slow | 3.6 | 25 to 33 | 3.1 | 35 |  |
| 31 | T16 | Family contributors in app, roles, safety floor | 22 | 46 | 48.5 | 4.5 | 9.5 | 30% | go slow | 3.4 | 26 to 33 | 4.3 | 33 |  |
| 32 | T34 | Plus follows the book (co-parent entitlement) | 14 | 23 | 33.5 | 4.3 | 6.9 | 24% | go slow | 3.0 | 28 to 34 | 3.6 | 34 |  |
| 33 | T11 | Age signal request and sign-up country check | 3 | 21 | 27.5 | 1.2 | 7.6 | 32% | go slow | 2.1 | 31 to 36 | 13.7 | 21 | yes |
| 34 | T37 | Opt-in analytics and insights loop switched on (founder-only) | 8 | 12 | 24.5 | 3.3 | 4.9 | 40% | go slow | 1.7 | 31 to 36 | 6.0 | 28 |  |
| 35 | T18 | Web reader (shareable link for relatives) | 29 | 36 | 36.0 | 8.0 | 10.0 | 30% | stop | 1.6 | 29 to 35 | 4.6 | 32 |  |
| 36 | T30 | Printed book with fulfilment | 14 | 29 | 48.0 | 3.0 | 6.0 | 24% | stop | 0.9 | 34 to 37 | 2.3 | 36 |  |
| 37 | T31 | Android app | 26 | 43 | 115.0 | 2.2 | 3.7 | 24% | stop | 0.6 | 36 to 37 | 2.2 | 37 |  |

### 3.1 The top ten by risk-adjusted score

1. T01 Recording and Listen reliability, with the save proof (94.2)
2. T26 Reminder tuning from alpha data (66.5)
3. T25 Names that learn and prompts v3 (62.0)
4. T36 Support route and help centre (54.1)
5. T07 Local database migration flake (43.9)
6. T02 First-run friction: date picker, consent links, download wait (38.0)
7. T14 Billing trust charter and plain Plus page (34.9)
8. T05 Server-security PRs (32.1)
9. T04 Open PR triage (27.3)
10. T22 Catch-up: backdate letters, import voice memos (25.8)

T33 (rating ask, store page, onboarding tests) is 11th at 25.6. Ten and eleven are a tie inside the model's noise.

### 3.2 WSJF, the top twelve

| WSJF rank | ID | Theme | WSJF | Cost of delay (points/week) | Duration (weeks) |
|---|---|---|---|---|---|
| 1 | T01 | Recording and Listen reliability, save proof | 255.0 | 306 | 1.2 |
| 2 | T05 | Server-security PRs (#602, #657, #632, #633) | 176.2 | 141 | 0.8 |
| 3 | T07 | Local database migration flake (R6) | 164.3 | 123 | 0.8 |
| 4 | T10 | Reviewer demo account, Notes for Review rewrite | 145.1 | 80 | 0.6 |
| 5 | T12 | Production backup, kill, rollback, restore drill | 123.3 | 148 | 1.2 |
| 6 | T04 | Open PR triage (R2) | 114.2 | 68 | 0.6 |
| 7 | T26 | Reminder tuning from alpha data | 106.8 | 64 | 0.6 |
| 8 | T36 | Support route and help centre, answer within a day | 72.6 | 73 | 1.0 |
| 9 | T03 | Device evidence and QA rows (R1) | 67.8 | 183 | 2.7 |
| 10 | T33 | Rating ask, store page and onboarding tests, lifecycle email | 40.5 | 40 | 1.0 |
| 11 | T14 | Billing trust charter and plain Plus page | 39.3 | 134 | 3.4 |
| 12 | T02 | First-run friction: date picker, consent links, download wait | 37.1 | 148 | 4.0 |

WSJF and the risk-adjusted score disagree on purpose. WSJF rewards short jobs that unblock others or meet a date (T05 server security, T10 reviewer sign-in, T12 backup and restore, T07 database flake). The risk-adjusted score rewards return per founder-hour regardless of what it unblocks.

### 3.3 What the table says, in plain words

1. **Small, go-rated trust work wins on ratio.** Recording that never loses a letter, a first run without fiddly steps, plain money copy, a person who answers. This matches the customer file's top two needs (`01` section 2 ranks 1 and 2) and lane D's advice to do reliability first. It is partly an effect of the formula: ratio scoring favours cheap items. It does not say the family features are worth less in total.
2. **Absolute value and ratio tell different stories.** The family themes T15 (partner hears my voice), T17 (relative adds without the app) and T16 (contributors) carry some of the highest absolute business value (59, 51 and 46 points) and the strongest referral scores, but cost 50, 50 and 48.5 FH. They rank 26th, 27th and 31st on ratio and 27th to 33rd on WSJF. They are real bets, not low-value work. They also sit behind T08 (production backend) by the sequencing in `04` section 4, and behind counsel and the safety floor by `05` section 3.1 ("go slow").
3. **The release obligations are constraints, not investments.** T06 and T08 to T13 sit between 16th and 33rd on ratio because they create little value of their own, yet without them there is nothing to sell. Treat them as fixed work that runs beside the ranked list. Together with T05 they are a founder-hours bill of about 20 hours of hands and 25 of review (table 2B), and they are a large part of why founder hours are scarce.
4. **The stop-rated themes (T18, T30, T31) sit at the bottom** for cost as well as for gate. Android costs 115 FH on these inputs (`04` item 24: 30 hours of review plus device and account work). They stay below rank 28 in 90% of the random draws in section 4, including draws where p_ship for stop-rated work is as high as 0.6.
5. **Measurement itself ranks 34th (T37) because the formula cannot see information value.** It creates no letter and no sale. But the second ranking cannot be made without data (section 6), and the allowlisted events fire nowhere today. Treat T37 as a founder decision about whether to learn, not as a ranked build item. FOUNDER ONLY.
6. **T26 and T25 are high on thin evidence.** Reminders and prompts are rank 4 in the customer need list, with reviews split between praise and complaint (`01` rank 4); names are a medium-frequency need with a trust bite (`01` rank 7). Both scores are HYPOTHESIS-grade. T26 cannot start until alpha reminders produce numbers.

## 4. Sensitivity: what flips the rank

Three tests, all on my own inputs:

**One at a time.** I moved each parameter in 1.6 to its low and its high, one by one, renormalising weights. The rank correlation (Spearman) with the base order stays at or above 0.989 in every case. The only top-ten changes are boundary swaps among T04, T22, T14, T33, T03 and T29. No single value weight (activation, retention, conversion, referral, risk, option value) and no setting of customer against business changes the top eight. The one exception in the top eight is the go-slow ship chance: at 0.5 it removes T14. The cost parameters (device-session hours at 1.5, agent-day cost at 0 or 1) cause the other swaps.

**Break-even cost.** How far an item's cost would have to move to cross the top-ten line (RA of the 10th is 25.8, the 11th 25.6):

| Rank | ID | Cost (FH) | Cost at which it crosses the top-10 line | Factor |
|---|---|---|---|---|
| 1 | T01 | 12.0 | 44.2 | x3.68 |
| 2 | T26 | 5.5 | 14.3 | x2.60 |
| 3 | T25 | 5.0 | 12.1 | x2.43 |
| 4 | T36 | 7.5 | 15.9 | x2.12 |
| 5 | T07 | 9.0 | 15.5 | x1.72 |
| 6 | T02 | 15.5 | 23.0 | x1.49 |
| 7 | T14 | 8.7 | 11.9 | x1.36 |
| 8 | T05 | 9.5 | 11.9 | x1.26 |
| 9 | T04 | 7.5 | 8.0 | x1.07 |
| 10 | T22 | 13.0 | 13.1 | x1.01 |
| 11 | T33 | 9.0 | 8.9 | x0.99 |
| 12 | T29 | 12.5 | 9.4 | x0.75 |
| 13 | T24 | 8.5 | 6.4 | x0.75 |
| 14 | T32 | 8.5 | 6.3 | x0.74 |
| 15 | T03 | 29.0 | 20.0 | x0.69 |
| 16 | T20 | 22.0 | 14.5 | x0.66 |

Reading: the top five can cost 1.7 to 3.7 times more and stay in; ranks 6 to 8 can absorb a quarter to a half more. Ranks 9, 10 and 11 (T04, T22, T33) are within 7% of each other on cost, and ranks 12 to 14 need a quarter less to come in. So the **first eight are robust to my cost error; places nine to fourteen are a coin toss**.

**Random draws.** 3,000 draws, seed 7, drawing every parameter in 1.6 between its low and high, perturbing each item's agent days, review hours, device sessions and hands hours by a log-normal factor (sigma 0.4) and each 0 to 5 score by one notch with probability 0.35. Share of draws in which a theme lands in the top ten: T01 100%, T26 98%, T25 97%, T36 96%, T07 83%, T02 76%, T05 71%, T14 66%, T04 63%, T33 56%, T22 45%, T29 34%. T24 and T32 are about 30%; T20 (17%) and T03 (15%) follow; everything else is under 10%. Apart from the print-ready file (T29), no family, web, print, Android, photo or gifting theme enters the top ten in more than 0.5% of the draws.

**What does flip the order, in one line each:**

1. **The cost of each item.** Founder review minutes per PR (22 and 45) and the 3-hour device session are uncalibrated. A fenced item that costs twice as much moves from rank 10 to out.
2. **My 0 to 5 scores on thin evidence.** One notch on T25, T26, T36 or T22 moves them several places. Scores marked HYPOTHESIS in `01` are the least reliable.
3. **The ratio form itself.** If the founder cares about total value rather than value per founder-hour, the order is different (section 3.3 item 2). That is a choice, not an assumption I can test.
4. **The gate ratings.** p_ship matters only for the stop-rated themes and for the go-slow ones near the line (T14).
5. **Not a flip:** the weights on activation, retention, conversion and referral. This is a finding worth stating: the arguments about pricing and growth levers do not change what to do next, because the next things are trust and reliability under any weighting.

## 5. Unit economics sketch for Plus

A sketch of per-family arithmetic, with the repo's prices and Apple's published rates. It is not a forecast and no conversion data exists.

### 5.1 Price and Apple's commission

Prices: **$4.99 a month with a 1 month free trial, or $49.99 a year with a 2 month free trial**, Apple in-app purchase only (D-082; `packages/content/src/pricing.ts`). The Plus pitch is "first 2 letters free, then Plus to keep adding"; reading, playing and export stay free (D-082; backup is never gated, D-111 item 6).

Apple's commission, two pages opened 8 Nov 2026 (neither shows a "last updated" date; the footer reads Copyright 2026 Apple Inc.; the text passed through a summarising fetch, so the founder should read both pages himself):

- https://developer.apple.com/app-store/small-business-program/ : "a reduced commission rate of 15% on paid apps and Apple In-App Purchases". Eligibility: developers with "up to 1 million USD in proceeds in the prior calendar year" or new to the App Store; above $1 million the standard rate applies to future sales. The page also has a sentence about "a further reduced commission of 10%" that reads two ways; I do not use it.
- https://developer.apple.com/app-store/subscriptions/ : "During a subscriber's first year of service, you receive 70% of the subscription price at each billing cycle, minus applicable taxes." After one year of paid service the developer receives 85%. For a Small Business Program member: "85% of the subscription price at each billing cycle (minus applicable taxes), regardless of whether or not the subscription has accumulated one year of paid service."

Status of the program for Early Letters: submitted, Apple approval pending (gap map section 1.8, release:ready S-31 FAIL on 8 Nov). Whether "applicable taxes" are taken out of the price or added on top for a US storefront: **UNVERIFIED**, so the table takes no tax out.

Net per payer, arithmetic on those rates:

| Plan | Price | Net per cycle at 15% (program) | Net per cycle at 30% (standard, first year) |
|---|---|---|---|
| Annual | $49.99 | $42.49 | $34.99 |
| Monthly | $4.99 | $4.24 | $3.49 |

After the first paid year the standard rate also falls to 15%, so the 30% column matters only for first-year cohorts if the program is not granted.

### 5.2 Fixed and variable cost

- Fixed floor: **$99.25 a month**. [A] $91 from R3 section 5.3 (Supabase Pro $25, Sentry Team $26, Resend Pro $20, Vercel Pro $20; prices as of 3 Oct 2026 in R3, not re-read by me; the gap map says the Supabase plan cost is UNVERIFIED) plus the $99 a year Apple Developer fee, $8.25 a month. Founder time is excluded; counsel and one-off study costs are excluded (PRD 4.4 lists them).
- Variable cost to serve: **$0.02 / $0.06 / $0.10 per family per month** (low / base / high). [A] The PRD sets $0.02 to $0.10 as the design limit (`docs/prd/v2/03-goals-and-principles.md` 4.4, citing ARCHITECTURE section 7, which I did not re-open). The base $0.06 is the midpoint.
- Refunds: 3% of revenue. [A] The PRD target is "under 3%" (4.3).

### 5.3 Break-even in paying families

Net revenue per payer-month, blended: `n = (s x $49.99 / 12 + (1 - s) x $4.99) x (1 - c) x (1 - 0.03)`, with annual share `s` and commission `c`. At the PRD's target annual share of 60% [A] and the program's 15%: **$3.71 per payer-month**. At s = 40% it is $3.84 and at 80% it is $3.57. At 30% commission (program refused, first-year cohort) and s = 60% it is $3.05. This assumes a payer keeps paying; no churn data exists.

Break-even families `N` (those with at least one saved letter) solve `q x N x n = fixed + v x N`, so `N = fixed / (q x n - v)`. Here `q` is the share of those families who pay.

| Pay rate q (ASSUMPTION) | v = $0.02 | v = $0.06 | v = $0.10 |
|---|---|---|---|
| 2% | 1,834 families (37 payers) | 7,024 (140) | never |
| 5% | 600 (30) | 792 (40) | 1,163 (58) |
| 10% | 283 (28) | 319 (32) | 367 (37) |

Reasons for the three pay rates: 5% is the PRD's headline target and R3's Base input; 2% matches the freemium anchor and 10% the hard-paywall anchor the PRD quotes from R3-S32 (2.1% and 10.7%; I did not re-open that source). No source measures a two-letter sample, and the PRD calls 5% "the weakest input".

What follows from the arithmetic:

- With zero variable cost, **27 payers** cover the fixed floor ($99.25 / $3.71 = 26.8).
- The pay rate must exceed `v / n` for any break-even to exist: 0.54%, 1.62% or 2.70% at the three run costs. At a 2% pay rate and the top run cost, the app never breaks even on running costs. **Run cost per family matters as much as the price.**
- If the Small Business Program is refused, at 5% and $0.06 the break-even moves from 792 to 1,072 families, and at 2% it moves from 7,024 to 94,624 (practically never).
- Each $10,000 of one-off cost (counsel, studies, devices) needs about **225 payer-years** at the base blend ($10,000 / ($3.71 x 12)).
- Trials delay cash: two months on the annual plan, one on the monthly. The numbers above are run-rate, not cash in the year (the CFO skill's rule: cash is not revenue).
- The PRD's year-one figure ($44.6k net at 990 payers, 4.4) rests on a 5% pay rate nobody has measured. I do not repeat it as a result.

### 5.4 What no data exists for, and what to measure first

No data exists for: trial start rate, trial to paid on either plan, annual share, refund rate, churn after the first year, the share of families who reach the gate, or the share who hold a letter instead of paying (D-082 allows holding). **The family-group alpha cannot answer these.** Plus limits were removed for alpha builds (#552, gap map 1.8), purchases there use the sandbox, and the testers are not strangers. The honest first reads are the ones in section 6 (M3, M7), from App Store Connect, which needs no consent and counts every user, and from the gate comprehension study (`01` G7).

**Price experiments are not recommended now.** The tracking plan itself says arms cannot be measured on the device without a server purchase ledger or linked ids, "premature for v1", and names Apple's offer codes or a Product Page Optimization test in App Store Connect as the only routes if revived (`TRACKING_PLAN.md` section 2, row "Pricing test arms"). Any later price test must not touch what stays free: reading, playing and export of every letter, and the two free letters (D-082). I recommend keeping D-082's prices through launch and reading the funnel first. **FOUNDER ONLY.**

## 6. Measurements to start now so the second ranking uses data

The second ranking needs data on the model's soft spots: cost (section 4), the 0 to 5 value scores, and the Plus funnel. Sources in order of what exists today:

- **ASC**: App Store Connect and TestFlight. Every user, no consent, money included.
- **S**: server aggregates, signed-in families only. Exists once servers are on (build 12 route in the gap map).
- **D**: device events, opt-in only. In-app analytics is **off for the whole 1.0 line** (D-124 item 3; `EXPO_PUBLIC_ANALYTICS` off in every profile). Turning it on is **FOUNDER ONLY** and needs the consent copy and the privacy label cleared (counsel Q54). The events named below exist in `packages/analytics/src/catalog.ts` and fire nowhere until then.
- **Manual**: founder logs, tester notes, the studies in `01` section 4.

| # | Measure | Source and exact events or fields | Calibrates | Available now? | Bias to state |
|---|---|---|---|---|---|
| M1 | Time to first saved letter; where first-run people stop | D: `analytics_opted_in.time_to_first_letter`, `capture_started`, `capture_discarded.stage`, `letter_saved`. S: `first_letter_conversion`. Manual: study `01` G1 (5 to 8 strangers, think-aloud) | F, S for T02, T01 | G1 yes; S after build 12; D no | Alpha group is friendly. D sees only opted-in, probably the more engaged, so it understates drop-off |
| M2 | Reliability: failed saves, mic, transcription, offline, sync, downloads | D: `error_shown.code` (save_failed, mic_denied, transcription_failed, offline, storage_low), `sync_failed.reason`, `pack_download.stage/failure/network`. ASC and TestFlight crash reports. Manual: kill-harness counts, `ALPHA_GO_NO_GO.md` B2-11 | F, S, T for T01, T07; cost for T03 | Crash reports yes; harness yes; D no | Crashes in ASC cover everyone; D covers a self-selected group |
| M3 | Reaching the free allowance | D: `free_allowance_reached.allowance`, `keep_gate_shown.letters_kept/allowance/lapsed`, `letter_held`. S: letters per family | conv for T14; q in section 5 | Not in the alpha (limits off, #552); D no | Only consenting families; held letters invisible if never synced |
| M4 | Habit: weekly keeping families, letters per active family, week-4 retention | S: `insights.weekly_keeping_families`, `letters_per_active_family` (north star, `TRACKING_PLAN` 1.1). D: `app_opened.days_since_last_open` | ret for T26, T20, T22 | S after build 12 | Letters kept only on the phone are invisible to S (blind spot named in the plan) |
| M5 | Reminders that help or hurt | D: `reminder_sent.type`, `notification_opened.type`, `letter_saved.from_notification_2h`, `reminder_suppressed.reason`, `settings_changed.key`. Guardrail: reminders muted | F, S for T26 | D no. Manual: 3 tester questions | Muting is only partly seen if the setting change is not opted in |
| M6 | Demand for family features | D: `coparent_soon_opened.surface`, `coparent_soon_notify`, later `invite_created.channel`, `invite_accepted.role`. S: invite acceptances. Manual: studies G4, G5, G6 (relatives, couples, mixed platform) | B, ref for T15 to T19, T31 | G4 to G6 yes; events no | Parents who see the teaser are not all parents. 1 of 287 reviews mention a partner (`01` rank 8), so expect surprise |
| M7 | The Plus funnel and money | ASC: first-time downloads, trial starts, trial to paid by period, annual share, refunds, proceeds, commission tier. D (diagnostic only): `plus_offer_viewed.trigger`, `plus_started_from_gate`, `plan_changed.from_state/to_state/period/ownership`, `offer_code_redeemed`, `restore_result`. Manual: study `01` G7 | q, s, c in section 5; conv for T14, T34, T35 | ASC yes after release; sandbox in TestFlight is not real | ASC counts restores and codes; D opt-in and biased (PRD 4.2) |
| M8 | Cost to serve | Supabase usage (storage, egress, function calls) divided by signed-in families; `escrow_unwraps` count; support minutes per ticket from the founder log | v in section 5; serve for T36, T15, T17 | After servers on | Few families at first, so the per-family cost is noisy |
| M9 | **Founder cost per PR and per device session** | Manual and `gh api` on merged PRs: merged per week by path class (fenced or not), founder minutes per review (sample 20 PRs), device-session hours logged | The whole cost side. This is the highest-value measurement under section 4 | **Yes, today** | Early PRs may be unrepresentative; log by size |
| M10 | Trust in money and in "kept" | Manual: study `01` G7 (150 to 200 parents plus 8 follow-ups); three questions in tester notes | T on T14, T01 | Yes | Panel participants; no streak or count shown to families |

Two events the catalogue lacks. I request them from `analytics` rather than add them (my fence is `docs/analytics/decision-science/**`):

1. **A playback failure.** The founder-flagged problems include Listen. `playback_started` exists; `error_shown.code` has no playback code. Request: a content-free playback failure code, or a new enum value, if `analytics` agrees. Until then use the manual log.
2. **First-run steps.** The date-of-birth picker and consent-link problems are first-run events, and first-run events "can never be sent" (K-01); the one-time summary carries only `time_to_first_letter`. Request: whether a content-free first-run summary property (for example, the number of times the picker was reopened, bounded 0 to 9) is allowed under K-01. Child dates stay out.

Rules I held to: no event with free text, no child name or date, no per-family tracking that tells a person apart from the allowlist (`CLAUDE.md` privacy rules; `catalog.ts` header). Nothing here gates a free-forever feature or collects content.

## 7. What would change the order

Each item says what to watch for and which rows it moves. These are triggers for a re-run, not forecasts.

1. **Measured founder cost (M9).** If a fenced PR takes more than about twice the 45 minutes, or a device session more than about twice 3 hours, every L and XL row falls further and T22, T29, T24 and T32 rise. If the figures come in lower than assumed, T20 (quick capture, needs about two thirds of its cost) and T03 (device evidence, about 0.7 of its cost) are the next into the top ten (break-even table in section 4).
2. **Counsel answers.** Q44 (real families under draft texts), Q41 (billing notices), Q46 (age signal), Q54 (labels). A "go" lifts `p_ship` from 0.7 to 1 on T14, T08, T13, T15 and T17. A "stop" on Q44 stalls everything signed-in.
3. **Study results.** G1 shows the first run failing for strangers: T02 jumps. G4 shows relatives who will not install anything: T17 rises over T15. G6 finds mixed-platform couples are common: T31 rises and the stop rating becomes a founder question. A G7 result of parents distrusting "first 2 free": T14 rises and conversion weights matter.
4. **The Plus funnel (M7).** If the share reaching the gate is tiny, the Plus themes (T14, T34, T35) drop and activation themes rise. If the pay rate is far under the 0.54% to 2.70% floor in 5.3, the right move is not more features but run cost or price, both **FOUNDER ONLY**.
5. **Apple.** Small Business Program refused: unit economics worsen (5.3) and the order of the revenue-linked rows changes. A rejection under 5.1.1(ix) (individual publisher) moves T10, T13 and the entity decision to the front.
6. **Dates.** AB 1043 on 1 Jan 2027 raises T11 into the top block of work. Mother's Day on 9 May 2027 raises T29 (print-ready file) if keepsake demand shows. The June 2027 print go/no-go keeps T30 stopped.
7. **Founder hours per week.** At 6 hours a week the whole list slows and parallel family themes are not possible; at 15 the duration of the long rows shortens and WSJF favours T15 and T17 more.
8. **Analytics decision.** If analytics is switched on for 1.0.x or 1.1, T37's option value is realised and M1 to M6 begin. The model does not capture this value, so the founder should weigh it directly.
9. **A reversal on D-121.** The founder's route (public store release with the production backend, gap map section 0) reverses D-121 item 1. It raises T08 to T13 from background to critical path.

## 8. Recommendations and what is founder-only

Recommendations, each marked:

1. Start M9 this week: log founder minutes per PR and per device session. Cost is the largest driver of the order. No decision needed.
2. Do T01, T05, T07 first as the lane D draft proposes; they are both high on ratio and on WSJF.
3. Run the first-run usability test (`01` G1) before widening TestFlight. It informs T02 and costs recruiting time. Recruiting and incentives are **FOUNDER ONLY**.
4. Treat T08 to T13 as one release programme with its own dates; do not rank them against features.
5. Keep the prices in D-082 through launch and do not test prices (5.4). **FOUNDER ONLY.**
6. Decide whether analytics is on for the first release after counsel clears the label (Q54). My recommendation is yes, opt-in, allowlisted only, because without it the second ranking has nothing but App Store Connect. **FOUNDER ONLY.**
7. Read both Apple pages in 5.1 himself and confirm the Small Business Program decision. **FOUNDER ONLY.**
8. Ask `analytics` about the two missing events in section 6.
9. Backlog proposals go through `product`; I add none to `docs/BACKLOG.md`.

## 9. What I could not verify

- Any real usage, conversion or revenue figure: none exists. Also unknown: the number of alpha testers, their devices and the details of the four founder-flagged problems (`01` section 0).
- Apple's pages beyond the two in 5.1, whether US sales tax is inside or outside the price, whether the Small Business Program has been granted, and the dates of both pages.
- The $91 monthly vendor floor (R3, 3 Oct 2026), the $0.02 to $0.10 run cost per family (ARCHITECTURE section 7), the 40%, 60% and under 3% figures (PRD), and RevenueCat/R3 anchors (R3-S32, S33). I used them with their labels and did not open the sources.
- The 125-PR backlog state and the lane D size bands. I used lane D's figures as written.
- Counsel's price and availability.
- The `02-benchmark.md` file was fetched but not read, and was not used in scoring.
- The PRD names "weekly making families" (WMF) and the tracking plan "weekly keeping families" (WKF) as the headline habit metric. I used WKF because the tracking plan ties it to named events and a server view. Product should settle one name.
- The QA bug-hunt note and `docs/qa/` evidence for build 11.

## 10. Sources

Repo (read 8 Nov 2026): `CLAUDE.md`; `docs/DECISIONS.md` (D-082, D-083, D-095, D-111, D-121, D-124); `packages/content/src/pricing.ts`; `apps/mobile/src/lib/billing/*` (config only); `docs/prd/v2/03-goals-and-principles.md` sections 3 to 4; `docs/prd/v2/research/R3-market.md` section 5; `docs/analytics/TRACKING_PLAN.md`; `packages/analytics/src/catalog.ts`; `.claude/skills/early-letters-cfo`, `-cbo`, `-cpo`. Phase 1 drafts: `docs/roadmap/next/01-customer-needs.md`, `04-feasibility.md`, `05-compliance-risk.md`, and `docs/release/BUILD12-GAP-MAP-2026-11-08.md` from their branches.

Web (opened 8 Nov 2026): https://developer.apple.com/app-store/small-business-program/ and https://developer.apple.com/app-store/subscriptions/ .

The model (formulas in section 1, inputs in section 2, parameters in 1.6) is complete in this file and can be rebuilt in a spreadsheet. The scripts I used to compute section 3 and 4 are not committed.
