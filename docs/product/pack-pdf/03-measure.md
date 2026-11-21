# Part IV. Quality, outcomes and cost

## 13. Non-functional requirements that apply to everything

From `docs/prd/v2/06-nfr.md` (the baseline every card inherits) and the locked cards. All on an iPhone SE (3rd generation) under the 06-nfr device protocol (release build, unplugged, 50% brightness, nominal thermal state) unless stated.

### Speed

| Measure | Budget |
|---|---|
| Cold start to first interactive frame | p50 1.2 s, p90 2.0 s |
| Warm start | p50 400 ms |
| Screen transition | starts within 100 ms of the tap, completes within 350 ms, no frame over 16.7 ms |
| Tap Speak to microphone live | p95 500 ms over 200 taps, cold and warm |
| Local save of a 2-minute take | p95 200 ms |
| Clean and mark a 300-word transcript | p95 300 ms |
| Local playback start | p95 300 ms |
| A Book chapter of 60 letters, first paint | p95 500 ms |
| Book first render with 1,200 letters | p95 500 ms |
| Named hand-offs (Home to Listen, Listen to Review, Review to Book after Keep, Book card to letter page) | within 900 ms |
| Save hand-off (Keep to the letter safe on disk and in the Book) | within 2,000 ms |
| A picture added: thumbnail after the picker closes | p95 1,000 ms (proposed) |
| Find results as you type | per NS-02 |
| 1-year export, originals only, offline | under 2 minutes (gate) |

### Durability (the promise "kept")

| Check | Pass bar |
|---|---|
| Kill during save | 0 losses in 500 simulator iterations plus 50 on the SE 3 |
| Kill while recording | 50 of 50 takes keep a row; 0 files deleted |
| Original recording never altered | hash unchanged after listening copy, plays, export and an app update |
| Raw transcript immutable | an update fails at the database and the local store refuses it |
| Engine update never changes a saved letter | saved words unchanged across engine versions |
| Two phones editing one letter offline | neither version lost |
| Let it go | the recording is gone from this phone and the parent's other phones; a failed delete is retried and shown, never hidden |

### Accessibility
Dynamic Type to the largest accessibility size on every screen, text never truncated; every P0 flow completes with VoiceOver; touch targets 44 pt minimum, 56 pt primary, 64 pt capture; contrast 4.5:1 body, 3:1 large text and controls, in light, dark and Increase Contrast; Reduce Motion honoured everywhere; no time limit without a control; every visible label works with Voice Control; zero critical violations in the automated audit.

### Stability
Crash-free sessions 99.8% or more and crash-free users over 7 days 99.5% or more after release (App Store Connect, users who share diagnostics); zero unresolved crash signatures on the release candidate; zero memory-limit exits during transcription in 30 SE 3 runs per language.

### Privacy
No letter text, transcript, audio, picture or child name in analytics, logs or crash reports (a canary string is pushed through every new path and must never appear in a log, URL, notification or crash report). Safety tiers stay on the device.

## 14. Outcomes, KPIs and how we will know

**The North Star: weekly making families.** Families where any author made a letter (saved in any state, kept or waiting at Keep) in the last 7 days (`03-goals-and-principles.md` section 4.1). "Made" and not "kept", because a free family cannot keep a third letter: kept letters measure Plus as much as habit.

**The business number beside it, never above it:** paying families over first-time downloads, by install week, from App Store Connect. Target on record: 5% at week 8 (an assumption).

**Guardrails: breaching one stops a rollout.**

| Guardrail | Threshold |
|---|---|
| Letters or recordings lost or silently changed | Zero |
| Crash-free sessions | 99.8% or more |
| Machine edit revert rate | Under 5% overall; any edit type over 10% is reviewed |
| Reminders muted or turned off per month | 10% or less (assumption) |
| Paywall shown outside its allowed triggers | Zero |
| Letters lost or discarded at the Keep gate | Zero |
| Support tickets about lost content | Zero; each is a severity 1 incident |
| A child's name or letter words on a lock screen by default | Zero |
| A count of gaps, a streak or a guilt line anywhere | Zero |

**Input measures (from `03-goals-and-principles.md` section 4.2, targets marked as assumptions on record):**

| Stage | Measure | Target |
|---|---|---|
| Activation | Median time from first launch to first saved letter | 90 s or less |
| Keep the book | Share of first-letter users with an account by day 7 | 50% or more |
| Habit | Authors who make letters on 2 or more days within 14 days of the first | set after cohorts |
| Letters | Made and kept per family per week, by plan state | set after cohorts |
| Two voices | Share of books with a second author by day 30 | set after the first cohort |
| Retention | Active makers at week 4; at month 6 | 35% or more; 20% or more |
| Reminders | Letters made within 2 hours of a delivered reminder | 12% or more |
| Plus | Trial to paid, monthly | 40% |
| Plus | Annual share of new paid plans; refunds | 60%; under 3% |

**The honest caveat.** Analytics is off for the whole 1.0 line (D-124). Until the founder decides otherwise, the measures above come from App Store Connect (installs, sales, crashes for users who share diagnostics), App Store ratings and reviews, a content-free support tally, and testers who send numbers by hand (never words; reported as "x of n" when fewer than 20; deleted 90 days after the round). Each requirement card names its own hand-sent question. A target with no source in the build that ships is not a target.

**Per-feature measures** (all by hand while analytics is off):

| Feature | Question to testers |
|---|---|
| Photo with a letter | Did you start a letter from a picture this week? Pictures and letters from the export manifest counts |
| Find | Did you look for a letter by a word this week? |
| Share one letter | Did you send one letter to someone? |
| Reminders | Are reminders still on after two weeks? Did any feel like too much? |
| Save a copy | Did you save a copy, and where did it go? |
| Family pilot | Did you send a recording to someone, and who answered? |
| Speed | The run sheet numbers on the SE 3 |

## 15. Keeping the cost of building and running low

**Cost of building.** The constraint is review, not code. Every change has one purpose and fits the review limit (400 added lines, 20 files) or states an exception the founder accepted; every feature ships dark behind a flag; existing components come before new ones; on-device logic lives in pure modules that test without a phone; device time is batched into one run sheet per build. Each change needs two counted reviews and green checks.

**Cost of running.** Most of the product costs nothing per family, by design:

| Choice | Why it is cheap | When it would cost |
|---|---|---|
| Speech on the phone | No transcription bill | Never per use |
| Supabase on the Free plan (D-159) | No monthly bill at a few hundred users | At 500 MB database, 1 GB storage, 5 GB egress, 50k monthly users (runbook, read 8 Nov) |
| No recording backup yet | Audio is the largest data | At about 19 MB per active family per month (ADR 0005 assumption), Free storage holds about 52 family-months; a backup flip on the Free plan is not an option |
| Pictures and the Find index on the phone only | Nothing on our side | Never; the parent pays in phone space |
| Local notifications only | No push service | If a co-parent push is ever built |
| Export through the system share sheet | We store and send nothing | Never |
| No analytics, crash or advertising SDK | No vendor bill, no data to protect | If the founder turns analytics on |
| EAS builds | Free up to 15 iOS builds a month (D-092) | Past 15: a paid tier |

Every price and free-tier limit above was read on the date shown and must be read again before a decision rests on it. Spend of any kind is the founder's decision.
