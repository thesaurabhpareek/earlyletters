# Instrumentation, decision science: metric tree, funnels, experiments and read-out (PROPOSED)

Status: PROPOSED, not reviewed, 20 Nov 2026 | Owner: `decision-science` (Claude role; not a statistician of record, lawyer or regulator) | Pair: PM2 (book, reading, Find, photos), file `docs/product/instrumentation/` PM2 file, not on develop or on any branch when I looked (UNVERIFIED; I read nothing of it) | Data siblings: `analytics`, `data-steward`, `data-architect`, `ops` (same folder; none read, all unlanded when I looked) | Docs only. Changes no locked statement. Where a lock would need to move there is a "Proposed change" box naming E83 (next free, CL-158).

Nothing here is observed data. There are no users and analytics is off for the whole 1.0 line (D-095, D-124 item 3, FR-DAT-01). Every number is read from a named source, computed with the arithmetic shown (Python stdlib, binomial and normal approximation, run this session), or marked PROPOSED.

## 0. What I read, and what I did not

Read this session, on develop at `052b42c8b` (newer than the `e68541dd3` floor): `docs/product/prd/functions/data-and-measurement.md` in full (FR-DAT-01 to 44, my own earlier file); `docs/analytics/TRACKING_PLAN.md` lines 1 to 220 (promises, metrics, gaps, catalogue areas app to errors); `docs/prd/v2/03-goals-and-principles.md` sections 1 to 5; `docs/engineering/readiness-20nov/performance/MEASUREMENT-PLAN.md` in full; `docs/product/prd/14-test-plan.md` line 104 (gates) and a grep for KPIs; `docs/product/prd/18-errata-after-lock.md` rows E70 to E82 by grep; `docs/design/IA-FINAL-20nov.md` (branch `docs/design-ia-final-20nov`, PR #1033) sections 0 to 4.1.

Not read, so every claim that leans on them is UNVERIFIED: `TRACKING_PLAN.md` lines 221 to 450 (errors, global properties, server aggregates section 4, section 6); `INSIGHTS_LOOP.md`; `packages/analytics/src/*` (I rely on the catalogue as printed in TRACKING_PLAN, `SCHEMA_VERSION = 8`, 68 events); `NFR-BUDGETS.md`, `OBSERVABILITY-WITHOUT-CONTENT.md`; the libraries folder (so the library adoption rules were not applied line by line); IA-FINAL from section 4.2 on (Book, Me, sheets, notifications), so the screen-id list is not mine to close; 14-test-plan beyond line 104 (I found no KPI table by grep: it lists gates G0 to G6, not rates).

Outside sources read this session (20 Nov 2026):
- PostHog repository page, https://github.com/PostHog/posthog : "available under the MIT expat license, except for the `ee` directory"; hobby self-host "in one line on Linux with Docker", 4 GB memory advised, "should scale to approximately 100k events per month", no support or guarantees for open source deployments. Funnels and retention features are not described on that page.
- PostHog Experiments docs, https://posthog.com/docs/experiments : statistics "Bayesian or frequentist"; each experiment is backed by a feature flag that randomises and records exposure; funnel, mean or ratio metrics from existing events. The page says nothing on minimum sample, holdouts or minimum detectable effect. A second page (sample size and running time) failed to load. So PostHog's own sample-size guidance is UNVERIFIED and my tables below are computed by me, not taken from PostHog.
- GrowthBook README, https://github.com/growthbook/growthbook : "Open Core", "bulk of the code is under the permissive MIT license", some directories under a commercial Enterprise licence; self-host with Docker; stats engines list CUPED, sequential, Bayesian, post-stratification, bandits, SRM checks.
- Price of PostHog cloud, GlitchTip, Metabase, Evidently: not read, UNVERIFIED. The tools for those belong to `analytics`, `data-architect` and `ops`; I only state what the read-out needs.

## 0.1 Tooling rule (founder, 20 Nov, binding)

Only completely free, open-source tools that fit Expo and React Native, Supabase and Vercel. For experiments and analysis: PostHog experiments and funnels, self-hosted, MIT outside its `ee` directory (we use nothing from `ee`; whether PostHog's free cloud tier is acceptable is the founder's, its terms UNVERIFIED); intervals and sample sizes by a small pure-TypeScript helper in our own repo (IN-DS4, no dependency, so no package.json change); weekly read-outs by plain SQL on the reporting views `data-architect` proposes and by the markdown template in section 8. Rejected: GrowthBook (open core, commercial directories), any paid experimentation or BI product, Evidently (not read, UNVERIFIED, not needed for a small base). Nothing in this file needs a paid tool.

## 1. The three measurement phases (so no number is promised before it can exist)

| Phase | When | What produces numbers | Who is measured | Consent state |
|---|---|---|---|---|
| P0, the 1.0 line | now to v1.0.x | Hand-sent tester rounds (D5, FR-DAT-04 to 08), run sheets (FR-DAT-15), support tally (FR-DAT-17), App Store Connect (FR-DAT-19). Instrumentation exists only as dark compiled code (this programme) | 15 to 25 friendly families (D-045) | No event of any kind (FR-DAT-01) |
| P1, first release with analytics on (v1.1 or later; founder and counsel decide) | after label, consent sheet and counsel | Opt-in device events through the closed allowlist, plus ASC | Opted-in devices only; about 40 percent assumed (TRACKING_PLAN 1.2, PRD 7.8), unverified | Opt-in (D-003 intent; D-095 and D-124 supersede for 1.0 only) |
| P2, scale | founder decides; not before several hundred opted-in families | Server aggregates read under a runbook (FQ-01), first real experiments | As P1 plus signed-in families on the server | As P1 |

Rule for this file: every metric below says which phase can read it. A metric whose source does not exist in its phase is marked "not measurable in P0" (FR-DAT-32).

## 2. The metric tree

Promise (VISION, D-139): letters to your child, in your own words and voice, kept for years. Source: FR-DAT section 3.1.

```
Promise
|
+-- NORTH STAR  Weekly making families (WMF), reported by plan state          03-goals 4.1 item 2; FR-DAT-21
|     beside it: Weekly keeping families (WKF), internal, paid-health        03-goals 4.1; TRACKING_PLAN 1.1
|
+-- BUSINESS, beside and never above   paying families over first-time downloads, by install week (ASC)
|
+-- INPUTS (one decision each; FR-DAT-22)
|     I1 Start      first launch to first saved letter; first-letter share
|     I2 Make       capture starts to saves; spoken or typed; discard and failure rates
|     I3 Keep       account by day 7; Keep gate shown to held to Plus
|     I4 Come back  active makers at week 4 and month 6 (maker retention)
|     I5 Go back    book opened, letter opened, playback, Read together, Find, photos (reader retention)
|     I6 Together   invites sent to accepted; second author by day 30
|     I7 Remind     reminders delivered to opened to saved
|
+-- GUARDRAILS (section 7): zero-target harms and rate guardrails; they stop a rollout
+-- HEALTH (performance, errors, crash-free): ops file; read-out shows it, does not own it
```

### 2.1 North Star, defined once

WMF, P1 device definition: the count of distinct analytics ids (one per consent period, TRACKING_PLAN promise 4) with at least one `letter_saved` in the trailing 7 days, any `destination`, divided by nothing (a count, never shown to a parent). Locked text (FR-DAT-21, 03-goals 4.1) says "family" and "made in any state: kept, held at the Keep gate, or waiting for words". Three honest limits, each stated at the top of every read-out:
1. The unit is a device in a consent period, not a family. There is no person or family id by design (TRACKING_PLAN promise 4), so two parents in one family count twice and a reinstall counts as a new id. P1 device WMF is therefore "weekly making devices (opted in)". Only P2 server aggregates count families, and only signed-in ones.
2. `letter_saved` is described as "saved (to the book or kept private)" (TRACKING_PLAN 3.1). Whether it fires for a letter held at the Keep gate or one waiting for words is UNVERIFIED. If it does not, WMF "made" is undercounted exactly where the free allowance bites. Request to `analytics`: confirm, and if not, fire it for every state with `destination` extended or a closed `state` property (held, waiting, kept).
3. WKF in P1 comes from the server only (TRACKING_PLAN 1.1) and is invisible for phone-only letters.

Proposed change box (PROPOSED, E83): TRACKING_PLAN section 1.1 still names WKF as North Star; locked FR-DAT-21 and 03-goals 4.1 name WMF with WKF beside it. Request: the next TRACKING_PLAN edit (analytics) says WMF. No lock moves; the doc catches up.

### 2.2 Inputs: exact events and properties

Catalogue events are as printed in TRACKING_PLAN 3.1 (68 events, v8). "REQ" means not in the catalogue; I request it from `analytics` (hand-off in section 11), the name is theirs to set.

| Input | Metric and definition | Events and properties | Phase | Decision it serves |
|---|---|---|---|---|
| I1 | First saved letter within 1, 7, 30 days of first launch | ASC first-time downloads (denominator, no consent); numerator P2 server `first_letter_conversion`; P1 device only from `analytics_opted_in.days_since_install`, `letters_bucket`, `time_to_first_letter` (a one-time summary, TRACKING_PLAN section 2, counsel Open) | P0: stopwatch study only (FR-DAT-33). P1: opted-in summary. P2: server | Fix first run (NS-39 to NS-44) |
| I2 | Capture to save rate | `capture_started{mode, source}` to `letter_saved{mode, destination}` same id, same day; `capture_discarded{stage}`; `transcription_completed{outcome}` | P1 | Capture friction |
| I3 | Keep funnel | `keep_gate_shown{letters_kept, allowance, lapsed}` to `letter_held` or `plus_started_from_gate`; diagnostic only (03-goals 4.2) | P1, biased | Never a business number |
| I4 | Maker retention: share of a cohort making a letter in week n | `letter_saved` by cohort week; cohort = first `letter_saved` seen after opt-in (left-censored, section 4) | P1 biased; P2 server `retention_cohorts` | Habit |
| I5 | Reader reach: of active devices in a week, share that open the Book, open a letter, play a recording | `book_opened{letters_bucket}`, `letter_opened{has_audio}`, `playback_started{surface, version}`, `read_together_started`, `read_together_ended{reason}`; Find REQ `book_search_used{results_bucket}` (FR-DAT section 6.2); photos REQ `media_added{source, kind}` | P1 | Is the book read back |
| I6 | Invite to accepted within 7 days | `invite_created{channel, shared}`, `invite_opened{via}`, `invite_accepted{role}`, `invite_failed{stage, reason}`; server aggregates count every acceptance | P1, P2 | Second voice |
| I7 | Reminder usefulness | `reminder_sent{type}` (logged next foreground), `notification_opened{type}`, `letter_saved{from_notification_2h}` | P1; "not measurable in P0" (FR-DAT-32) | Back-off schedule, bound by NS-32 budget of 60 |

Not measured, with why: letter text, length in words beyond `words_bucket`, language beside a letter event (FR-DAT-27), anything timed at a birthday or due date, photo library facts, search text (FR-DAT-27, FR-DAT-38). Child age is never a segment (L4); only `child_ordinal`.

## 3. Basics first: screens, controls, impressions, funnels (the founder's 20 Nov clarification)

The founder asked for page views, button clicks, impression versus click, funnel and performance. This is how the read-out will consume them. `analytics` owns the closed id lists and event shapes; `screen_view.route` today is a closed enum that still lists `tonight`, `family`, `listen` against three tabs (FR-DAT-26 already says stale entries go before any profile turns analytics on).

### 3.1 Screens, controls and impressions (read-out rules)

| Basic | What I need from the event | Definition I will report | Rule | Request |
|---|---|---|---|---|
| Screen view | `screen_view{screen_id}`, ids from the closed IA-FINAL list, never a route string with an id in it | Reach: devices with at least 1 view of a screen in the week over active devices (any `app_opened` that week) | Report reach, never raw view counts alone (a refresh inflates them) | analytics: closed `screen_id` list from IA-FINAL (PR #1033), tabs Home, Book, Me, sheets included |
| Control tap | REQ `control_tap{screen_id, control_id}` | Tap rate = devices tapping the control / devices that viewed the screen, per week | Control ids from a fixed list; never button text | analytics: closed `control_id` list per screen |
| Impression | REQ `surface_impression{surface_id, slot}`; surfaces: Home slip slot (IA-FINAL 4.1 slip registry ranks), prompt, "Another thought", sheets, banners, empty states, reminders delivered | Impression rate = devices shown / devices eligible; Click-through = devices that acted / devices shown, same week | One impression counted per surface per device per session (no counting scroll-backs); an impression with no action within the session is a "no click"; denominators stated | analytics: impression trigger rule (visible for how long is theirs to set) |
| Impression to action | REQ `surface_action{surface_id, action}` with `action` from a closed list (open, dismiss, act) | As above | A dismiss is information, never a failure; no surface is judged on one week at n under 20 | analytics |
| Emails or push | E75 no marketing email, E79 no remote push in 1.0: nothing in P0. Transactional email sent and opened: not measured by us (opens need a tracking pixel; not proposed) | none | Never propose open tracking pixels | none |

Impression and action events are the biggest new surface of this programme. Each must pass the same closed-allowlist test as every other event (FR-DAT-36 style deny list). I do not design that test; `analytics` and `data-steward` do.

### 3.2 Funnels (definitions; the PM files bind each to its screens)

A funnel step is "a device did the event within the window after the prior step", same analytics id, same consent period. Windows are PROPOSED and reset by the first real cohort. Every funnel is reported as x of n at each step (FR-DAT-08), with step-to-step and overall conversion, and the biggest drop named, not ranked as a failure.

| Funnel | Steps (events) | Window | Source and phase | Blind spot |
|---|---|---|---|---|
| F1 Install to first letter | ASC downloads, then opt-in summary (`analytics_opted_in.time_to_first_letter`), then P2 server first letter | 30 days | ASC, P2 server; device first-run steps can never be sent (TRACKING_PLAN section 2) | Opt-in comes after the first letter, so a device funnel cannot start at install |
| F2 Capture to save | `screen_view{listen or write}` or `capture_started`, `transcription_completed{outcome=ok}`, `review_action` (optional), `letter_saved` | same session | P1 | Machine edits are never in the funnel as words |
| F3 Save to read back | `letter_saved`, then `book_opened`, `letter_opened`, `playback_started` | 14 days | P1 | Reading by the other parent is another id |
| F4 Find (PM2) | `book_opened`, REQ search opened (a control tap), `book_search_used{results_bucket}`, `letter_opened` | same session | P1, dark until NS-02 flag | `results_bucket` 0 shown as zero results rate; search text and length never (FR-DAT-27) |
| F5 Photo with a letter (PM2) | REQ control tap "Start from a photo", REQ `media_added{source, kind}`, `letter_saved` | same session | P1, dark until `EXPO_PUBLIC_PHOTOS` | No count of items, bytes or permission state (FR-DAT-36, FR-DAT-38) |
| F6 Invite to joined | `invite_created`, `invite_opened`, `invite_accepted` | 7 days | P1 plus P2 server (every acceptance) | Two ids across two phones: the funnel crosses devices, so a device funnel cannot join steps 1 and 2; read server counts for the join |
| F7 Gate to Plus | `keep_gate_shown`, `plus_offer_viewed`, `plus_offer_closed{outcome}`, `plus_started_from_gate` | session | P1 diagnostic; ASC for money (FR-DAT-19) | Restores and offer codes inflate it (03-goals 4.2) |
| F8 Reminder | `reminder_sent`, `notification_opened`, `letter_saved{from_notification_2h}` | 2 hours | P1 | Local reminders are logged on next foreground; sent is undercounted |
| F9 Export | `export_started`, `export_completed`, `export_shared` | same session | P1 | `export_failed.reason` shows share of failures, not cause |

### 3.3 Performance (what the read-out shows; ops owns it)

Launch to first interactive, save commit, Book first render, Find first row, sync, crash-free sessions and error classes follow MEASUREMENT-PLAN. In P0 these are device run-sheet numbers with p50 and p95 and run counts (FR-DAT-15, MEASUREMENT-PLAN section 4: "never uploaded; never in analytics; `packages/analytics` has no perf event"). So in P0 the read-out only quotes the run sheet; P1 bucketed `app_cold_start.ttfi_bucket` is the one field latency event. Crash-free: ASC and Xcode Organizer opt-in numbers only (FR-DAT-16). The read-out always prints the budget beside the measured number and "met or missed", and never averages in a failed run.

## 4. Retention definitions

- Active maker in week n: at least one `letter_saved` (any destination) in that calendar week, week boundaries Monday 00:00 UTC (bucketed on the device, no local time sent; timezone effects named in section 9).
- Cohort: devices whose first `letter_saved` after opt-in falls in week 0. In P1 this is not the family's first letter, because opt-in comes after the first letter (K-01, TRACKING_PLAN section 2). It is a "cohort of opted-in makers", left-censored. Never call it install retention.
- Maker retention at week 4 = active makers in week 4 / cohort size; month 6 = week 26. Targets are the locked [A] numbers (35 percent and 20 percent, 03-goals 4.2) and are NOT promised; first read sets a baseline, and a target without a source in the build that ships is not a target (frame section 3).
- Reader retention (I5): active in week n = at least one of `book_opened`, `letter_opened`, `playback_started`. Reported beside maker retention, because a book is also kept to be read; a family that only reads is not a failure.
- Withdrawal: a withdrawn id leaves the cohort and cannot be counted (retired id, TRACKING_PLAN promise 1). Retention among those who stay is survivor-biased upward; the read-out says so.
- No streak, run length or "weeks in a row" is computed, displayed or stored (CLAUDE.md content rules; FR-DAT-03). Retention is a cohort share, never a per-person count.

## 5. Experiment and holdout rules for a small tester base

### 5.1 What the numbers allow (computed 20 Nov 2026; two-sided alpha 0.05, power 0.8; families or devices per arm)

| Baseline to target | Per arm | Fits C1 (15 to 25 families)? |
|---|---|---|
| 50 percent to 70 | 93 | No |
| 30 to 45 | 163 | No |
| 20 to 30 | 294 | No |
| 30 to 40 | 356 | No |
| 50 to 60 | 388 | No |
| 10 to 15 | 686 | No |
| 4 to 6 (business line) | 1,863 | No |
| 5 to 7.5 | 1,471 | No |
| 4 to 5 | 6,745 | No |

Smallest absolute lift detectable with 80 percent power, per arm (computed): at 10 per arm, over 59 points from a 20 percent base; at 25 per arm, about 38 points (20 percent base) or 36 (50 percent); at 50, about 26 to 27; at 100, 18 to 19; at 150, 14 to 16; at 500, 8 to 9; at 1,000, 5 to 6. Zero-event reading: 0 events in 25 is consistent with up to 13.7 percent, in 50 with 7.1, in 100 with 3.6, in 300 with 1.2, in 1,000 with 0.4 (Clopper-Pearson 95 percent). To see at least one event with 95 percent chance, an incidence of 5 percent needs 59 observations, 2 percent 149, 1 percent 299, 0.5 percent 598. Interval widths for a 50 percent rate: n 25 gives 27.8 to 68.7; n 100 gives 39.8 to 60.2; n 1000 gives 46.9 to 53.1.

### 5.2 Rules (PROPOSED, to be fixed before any experiment starts; FR-DAT-10)

1. No statistical claim below n. Below 20 answered per arm or cell: x of n only, no percentage, no interval (FR-DAT-08). From 20 to 99: counts and the exact interval, labelled "descriptive, not a test". A two-arm comparison is permitted only when both arms meet the per-arm n for a pre-registered lift from the table above, and the lift is one the founder says would change a decision. Until then there is no A/B test.
2. P1 realistic sizes: if a few hundred users are on Free (frame section 8) and about 40 percent opt in (assumption), P1 has roughly 100 to 200 opted-in devices. That supports only large-effect questions (about 20 to 25 points or more per arm of 100 to 150). So P1 runs before-and-after reads and usability checks, not randomised tests of small effects. A two-arm test is conceivable only for a non-gated, non-copy surface (see 5.3) with a feature flag, and only after an A/A check shows an equal split.
3. Fixed horizon, written down before day 0: question, decision, primary metric, one guardrail set, arm sizes, start and stop date, the line that triggers the decision. No peeking: no decision on an interim read, no early stop for a good result. An interim read is allowed only for a guardrail stop (zero-target, FR-DAT-09). PostHog can run Bayesian or frequentist; I pick frequentist fixed-horizon and say so in the plan, because I cannot verify PostHog's Bayesian stopping guidance (its sample-size page did not load). GrowthBook (sequential, CUPED) is rejected: it is open core with directories under a commercial Enterprise licence (README read this session), which breaks the founder's rule of completely free open-source tools only, and it would be a second service with no sample to justify it.
4. One primary metric, at most three secondary, counted before the run. Many surfaces and 68 or more events invite finding something: any other comparison is exploratory and labelled so. Multiple looks across surfaces need a pre-set correction (default: Bonferroni on the secondary set).
5. Holdout: a standing holdout (a group never exposed to a feature) is not proposed until at least 2,000 opted-in devices exist (a 10 percent holdout then has 200 devices, enough for a 20 point lift at 50 percent baseline). Below that, the cost of withholding a feature from a small tester base exceeds what the holdout can show.
6. Arm assignment is local and carries no person id: the arm key is a closed enum in the allowlist, assigned by a random draw on the device (or by a PostHog flag whose exposure event is itself passed through the allowlist). The SDK's default `$feature_flag_called` event carries flag key and value; I have not read the SDK, so whether it passes the validator is UNVERIFIED and `analytics` must prove it (request R5 below). Arm is never stored on a server of ours (no join, TRACKING_PLAN section 2).
7. Privacy limits: no experiment collects content, adds a survey, asks a question inside the app, or varies what words the app writes (it never writes any). No experiment on a family's data rights.
8. Exposure counts: only devices that actually saw the surface (an impression) are in the denominator, not devices assigned. Report both (intention to treat and exposed) and the sample ratio mismatch (a split that departs from the design by more than chance is a bug, not a result).

### 5.3 What may and may not be tested

Never tested (FR-DAT-20, principle 6, T2, my Never line): anything that gates, hides, delays or degrades export, deletion, backup, restore, reading, playing, Read together, Find, Share, or any capability free in 1.0.x; allowance arms; price arms; copy that guilts, counts a gap or pushes a streak; reminder volume above the NS-32 budget of 60; reminders at a birthday-related time (L4 leak, FR-DAT-25). Allowed in principle, each needing its own plan and the founder's word: order of non-gating Home slips (IA-FINAL slip registry, one slot), wording of a non-gating prompt line that passes the content rules, reminder hour (inside budget, not count). Everything else is a before-and-after read.

## 6. Pricing experiment design (duty 3; reconciled with F14 6.9, D-125 item 3, FR-DAT-19 and FR-DAT-20)

There is no randomised pricing test. Reasons on record: no join from an arm to a purchase exists (TRACKING_PLAN section 2: purchases are Apple's alone; `plus_offer_viewed.arm` removed), and 4 versus 6 percent needs 1,863 per arm (section 5.1). The design is the founder's pre-committed rule, with its uncertainty printed:

| Read | When | Rule (on record) | What I add |
|---|---|---|---|
| Allowance, first | Week 8 (T39), install weeks 1 to 4 | Under 4 percent starts over first-time downloads, with the FQ-02 minimum met: raise allowance 2 to 5 for everyone; log a D-### with inputs and interval (F14 6.9, D-125 item 3; FR-DAT-19) | Print the 95 percent interval: at 500 downloads, one standard error is 0.88 points, interval about 2.3 to 5.7 around a true 4 (FR-DAT section 3.2). A reading near the line is close to a coin toss and the founder sees that before acting. Rule fires on noise about one time in four at the line |
| Allowance, second | Week 16, install weeks 9 to 12 | Still under 4 percent: raise to 10, open a model review | Keep cohorts separate across the change; never pool before and after |
| Price | T40 (200th annual trial ended) | Annual trial to paid under 30 percent: for new subscribers only, test 39.99 a year or a 1-month annual trial, as a before-and-after read | At 100 trials the 30 percent line reads 21 to 39 percent; at 200, 24 to 36 (FR-DAT section 3.2) |
| Not enough downloads | T39 | No rule fires; read at the next point | |

Allowed variation: only an Apple Product Page Optimization test of icon, screenshots and preview videos (Apple page read 20 Nov per FR-DAT intro: up to three treatments, 90 days or until stopped, no price), each variant passing the claims inventory. Offer codes may be tracked by the founder by hand and subtracted from starts (FQ-03, UNVERIFIED whether ASC separates them). In-app: the allowance may only move up, for everyone, through remote config (F14-REQ-018); existing subscribers keep their price (F14-REQ-021).

Inconsistencies in the pack that make this ambiguous (not mine to edit; Proposed change boxes):
- The business line is "4 percent starts over first-time downloads" (F14 6.9, FR-DAT-19) in one place and "5 percent paying over first-time downloads at week 8" (03-goals 4.1) in another; those are different numerators (starts versus paying) and different targets. Proposed (E83, next free): the pack states one. Default: the F14 6.9 4 percent line, because it is the one a rule hangs on.
- Minimum downloads: 500 (D-125) versus 1,000 (F14 6.9). Default: 500 with the interval printed (FQ-02, C-11).
- FR-DAT-16 says the 99.8 percent crash-free target belongs to "G5", but `14-test-plan.md` line 104 defines G5 as the privacy label and claims match. The crash-free number is a post-release read from ASC (opt-in only); the gate letter should be corrected in the next FR-DAT edit.

## 7. Guardrails

A guardrail stops a rollout when breached (03-goals 4.3). Zero-target harms trip on one report from any source (FR-DAT-09, FR-DAT-40). Telemetry cannot prove zero; it can only fail to see one, so the read-out writes "not seen in n" (FR-DAT-09).

| Guardrail | Signal in P0 | Signal in P1 (exact events) | Line | Notes |
|---|---|---|---|---|
| Lost or silently changed letter or recording | Tester, support tally, manifest `audio_missing` (FR-DAT-14) | None can see a loss directly; proxies: `capture_discarded`, `transcription_completed{outcome=failed}`, `error_shown{code}` | Zero reports | Telemetry is a lead, not the proof |
| A word not said (constitution) | Q-FID-1 yes (FR-DAT-32, FR-DAT-40b) | `machine_edit_reverted`, `machine_edit_rejected{reason}` | One yes is an incident; revert rate under 5 percent overall, any edit type over 10 percent reviewed [A] | Not measurable in P0 as a rate (FR-DAT-32) |
| Paywall outside its triggers, Keep sheet without words on screen | Test | `plus_offer_viewed{trigger}`, `keep_gate_shown` | Zero | `trigger` values `chapter_complete`, `backup` are stale (backup is free, D-111; FR-DAT-26) |
| Reminder fatigue | Tester "too much" (NS-13) | `reminder_schedule_set{cadence=off or paused}` over `reminder_prime_result=yes` | 10 percent or less monthly [A] | A mute is also a healthy choice; read with usefulness |
| Notification budget | NS-32 test | `notification_opened`, `reminder_suppressed{reason}` | Zero over 60 | Counted on the device, no remote push (E79) |
| Screens that show a count, streak or gap | Design review (FR-DAT-03) | n/a (no event can detect it) | Zero | Test, not telemetry |
| Crashes and errors | ASC opt-in, zero unresolved signatures over 500 sessions in C1 (FR-DAT-16) | `error_shown{code}` per 100 sessions, `sync_failed{reason}` | 99.8 percent crash-free after release [A] | ASC counts opted-in users only |
| Pack health | None | `pack_download{stage, failure}` | Under 2 percent failures [A] | |
| Consent cost | QA | Compare feature behaviour by consent through server aggregates only | Zero difference | |
| Experiment guardrails | n/a | The same set above plus any experiment-specific zero | Pre-registered per plan | A rate guardrail never overrides a zero-target |

Rate guardrails use the interval rules of section 5.1: a breach is "the interval's lower end exceeds the line", not "the point estimate crosses it".

## 8. The weekly read-out (format; first copy when a data source exists)

One page, same shape every week, in `docs/analytics/decision-science/readouts/YYYY-Www.md` (my folder; counts only, no names, no quotes, no group under 5 that the founder could name, FR-DAT-08). Never published as a percentage under n of 20.

1. Header: week, build, phase (P0, P1, P2), sources used, sources missing.
2. Biases, before any number (FR-DAT-29): who is measured, how many opted in, how chosen, known blind spots (one parent answering, opt-in skew, signed-in only, reinstall counts).
3. Guardrail panel first: each guardrail, "not seen in n" or "reported: count and BL row", with any trip bold and dated.
4. North Star: WMF (device count and, in P2, families), by plan state, with the unit stated and a line "letters kept only on a phone are invisible to the server".
5. Funnels F1 to F9 present in that phase: x of n per step, biggest drop, nothing ranked.
6. Retention: cohort tables with sizes; cells under 5 pooled.
7. Basics: screen reach, control tap rates, impression to action per surface (section 3.1), each with n.
8. Experiments in flight: plan id, n per arm, planned stop date, no interim result.
9. What changed in the instrumentation since last week (catalogue version).
10. Decisions needed (at most three), each with the owner, the line from FR-DAT section 3.4, and what number would change it.
11. What we cannot say (copy from section 9, adapted).
Distribution: founder, product, CPO. Decisions become BL rows through `product`, never by me.

Reconciliation with FR-DAT-08: n asked and n answered first; "x of n answered"; never a percentage under 20; a skipped question is not a no unless pre-registered; no group smaller than 5 that can be named. All kept. This file adds: intervals are shown from n of 20, not before; a rate is always shown with its denominator definition.

## 9. Causal traps (what the read-out must never assert)

| Trap | How it shows here | Rule |
|---|---|---|
| Selection by consent | Opt-in devices are likelier engaged (TRACKING_PLAN 1.4); device funnels look better than reality | Label every device number "opted-in only"; never divide a device count by a server total; size the bias only through the server's consent split without ids (TRACKING_PLAN 1.4) |
| Survivorship | Withdrawn ids leave; a device that deletes the app disappears from week-4 retention | Say so; report cohort size at start |
| Left censoring | Opt-in comes after the first letter | Never call it activation or install retention |
| Device is not a family | No person id; co-parents are separate devices; reinstall is a new id | Say "devices"; families only from signed-in server aggregates at k = 10 |
| Reminder confound | Families who open reminders are already engaged; letters within 2 hours is not caused by the reminder | Report as correlation; a reminder effect needs a randomised hold-off (not proposed; budget NS-32 binds) |
| Newborn clock | Behaviour changes with a child's age, and age is L4 | Segment by `child_ordinal` and `letters_bucket` only; do not infer age; seasonality is unknowable |
| Novelty and decay | A new surface shows a spike then fades | Read an impression-to-action rate only after at least 2 full weeks |
| Peeking and many comparisons | 68+ events, many surfaces | Section 5.2 rules 3 and 4 |
| Impression inflation | Re-renders and scroll-backs | One impression per surface per session (3.1) |
| Free allowance as a hidden arm | Plan state (free, Plus, lapsed) changes what a device can do | Always report by plan state |
| Simpson by ordinal | Second-child families differ | Report by `child_ordinal` before pooling |
| Time and zone | Week boundaries and "within 2 hours" cross midnight | Weeks defined in UTC buckets; zone not sent |
| Small cells | Twins family, one VoiceOver tester can be named | FR-DAT-08: pool under 5 |
| Percent of nothing | A rate on n under 20 | Forbidden |
| ASC opt-in | ASC crash and session totals come from users who opted in (Apple page, FR-DAT-16) | Quote with that caveat |

Blind spot that remains in every phase: friendly families first, then opted-in devices; neither says how strangers will behave.

## 10. Reconciliation table (what I keep, what I propose to change)

| Source | Kept as is | Proposed addition or catch-up (no lock moves) |
|---|---|---|
| FR-DAT-01 | Everything here is dark, compiled, tested, inert | none |
| FR-DAT-08 | n first, no percent under 20, group under 5 pooled | Intervals from n of 20; denominator text per rate |
| FR-DAT-19 and 20 | Pricing: before-and-after only, allowance up only, nothing free-forever gated | Print interval beside every point; cohorts kept separate |
| FR-DAT-21 | WMF from Q-NS-1 in P0 | P1 device WMF defined as "devices"; state of `letter_saved` to verify |
| FR-DAT-22 | A measure with no decision row is not asked | Section 2.2 last column serves it; new surface events need their row first |
| FR-DAT-26, 36, 38 | Stale entries removed; no free-text; never-event list | Impression and tap events carry the same deny list |
| FR-DAT-32 | Not measurable in P0 list | Same list read as P1 with an opt-in bias label |
| 03-goals 4.2, 4.3 | Targets stay [A] | Baseline first, targets reset only by first cohorts |
| TRACKING_PLAN 1.1 | WKF text | Proposed E83: WMF as North Star with WKF beside it |
| 14-test-plan | Gates G0 to G6, not KPIs | Fix G5 reference in FR-DAT-16 (section 6) |
| MEASUREMENT-PLAN | Performance markers stay off analytics in P0 | Read-out quotes run sheet, not telemetry |

## 11. Hand-offs, proposed backlog and decisions

To `analytics` (requests, not done by me): R1 closed `screen_id` and `control_id` lists from IA-FINAL; R2 impression and action events with closed ids and the one-impression-per-session rule; R3 confirm `letter_saved` coverage for held and waiting letters or add a closed `state`; R4 `media_added` and `book_search_used` from FR-DAT section 6.2; R5 prove that flag exposure events (`$feature_flag_called` or equivalent) pass the allowlist, or disable them and send our own closed `experiment_exposure{experiment_id, arm}` with ids from a fixed list; R6 remove stale `screen_view.route` and `moment_shown` values (FR-DAT-26).
To `product` (backlog proposals, ids IN-nn working):

| IN | Row | Owner role | Size | Depends on | Founder hands | Wave |
|---|---|---|---|---|---|---|
| IN-DS1 | Metric dictionary doc: each metric, formula, events, phase, blind spot (from section 2) | decision-science | S | none | no | 1 |
| IN-DS2 | Read-out template and a script that renders counts, intervals and suppression from fixture data (Asha, labelled stand-in; never invented) | decision-science with analytics | M | IN-DS1, catalogue | no | 1 |
| IN-DS3 | Experiment plan template and A/A check rule | decision-science | S | IN-DS1 | no | 2 |
| IN-DS4 | Interval and sample-size helper in repo (pure TS, tested; no new dependency) | analytics | S | none | no (if dependency, yes: list only) | 2 |
| IN-DS5 | Reconcile TRACKING_PLAN 1.1 and FR-DAT-16 text (Proposed E83) | analytics, product | S | founder reading | no | 1 |
| IN-DS6 | First real read-out once P1 data exists | decision-science | S | founder turns analytics on | yes | 3 |

## For the CPO: decisions and risks

Founder and counsel decisions (real ones only; each with a default):
1. Is P1 device WMF reported as "devices", with families only from signed-in server aggregates? Default: yes (no person id by design).
2. Business line: 4 percent starts (F14 6.9) or 5 percent paying (03-goals 4.1) over first-time downloads? Default: 4 percent, the one a rule hangs on; one E83 to state it.
3. Minimum downloads before the allowance rule fires: 500 or 1,000 (FQ-02)? Default: 500 with the interval printed.
4. Minimum opted-in devices before any randomised test or holdout: default 2,000 for a holdout; two-arm tests only when the table in 5.1 is met and the founder says the lift would change a decision.
5. May flag exposure events be sent? Default: only through the closed allowlist (R5), or our own exposure event.
6. Are offer codes subtracted from business starts by hand (FQ-03)? Default: yes until ASC fields are verified.
Counsel: whether impression and tap events (screen ids) on a small cohort need a fresh read of the consent text and label; default: same L2 level as the existing `screen_view` and counsel confirms. Opt-in text and label are the founder's and counsel's (D-095).

Risks:
1. Small base: most questions will have wide intervals; the read-out will often say "cannot tell". That is the honest result.
2. Device is not a family: WMF may overstate or understate households.
3. Opt-in bias flatters every device rate.
4. Impression and tap events enlarge the surface that must be proved content-free.
5. `letter_saved` may miss held letters, undercounting the habit exactly at the gate.
6. Pack inconsistencies (4 vs 5 percent, 500 vs 1,000, G5 reference) could move a pricing decision if not resolved.
7. Sources unread (TRACKING_PLAN 221 to 450, packages/analytics, INSIGHTS_LOOP, libraries rules): UNVERIFIED claims named in section 0.
8. PostHog sample-size guidance not read; my tables are my own arithmetic.

Decision Scientist (`decision-science`, Claude role)
