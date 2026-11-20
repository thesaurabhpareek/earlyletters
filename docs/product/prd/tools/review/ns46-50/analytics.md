# Review of NS-46 to NS-50: opt-in analytics allowlist and data map

Lens: `analytics` (Analytics Engineer, a Claude role). Function files used: `functions/data-and-measurement.md` (DAT), `functions/research-validation.md` (RSH). Card file: `docs/product/prd/21-days-cultural-photos-home.md` (cited as "21:line"). Written 20 Nov 2026 on `docs/locked-pack-inputs-20nov`. Docs only; nothing changed in `packages/analytics`.

I am a Claude role, not a statistician of record, a lawyer or a privacy regulator. Legal readings say "counsel must confirm". Every number is read from a named file, computed with the arithmetic shown, or marked PROPOSED. There is no observed data: analytics is off for the whole 1.0 line (D-095, D-124 item 3; `apps/mobile/eas.json` sets `EXPO_PUBLIC_ANALYTICS` "off" in every profile I saw, lines 18, 36, 50, 64, 80). No outside source was read this session; Apple facts in the cards stay UNVERIFIED as the cards mark them.

## 1. What I read

- `BRIEF.md` for this review; `CLAUDE.md`; `21-days-cultural-photos-home.md` in full except NS-46 sections 1 to 6 and NS-47 sections 1 to 6 (read headings and rows 7 onward); `20-founder-direction-20nov.md` (grep for analytics, variants, measures only); `GAP-LOG.md` rulings K10, N-1, N-6, CB-1, CB-2, DL-5 (grep); `18-errata-after-lock.md` in full; `functions/data-and-measurement.md` and `functions/research-validation.md` in full; grep of `notification-catalogue.md`, `photos-and-suggestions.md`, `days-library.md`, `cultural-background-data.md` for analytics lines.
- Code: `packages/analytics/src/{catalog,schema,validate,consent-timing,observe}.ts`, `test/catalog.test.ts` (lines 19, 40 to 85), `docs/analytics/TRACKING_PLAN.md` (sections 1, 6, 7, 9), `INSIGHTS_LOOP.md` banner, `apps/mobile/src/lib/analytics/observers.ts` (lines 105 to 140).
- Not read: `planner.ts`, `scheduler.ts`, `prefs.ts` (so where the one-a-day budget lives stays UNVERIFIED, as the cards say); PostHog behaviour beyond the repo's own notes; NS-46/47 sections 4 to 6.

## 2. The short answer to "what may be measured"

Today the five cards measure nothing in the field. Each says "tester sheet, no telemetry" and that is correct for 1.0. The useful work for `analytics` is to fix three things before any of these ships, so a later opt-in turn-on cannot leak them:

1. The allowlist is built so that most of what these cards create cannot be sent (no free text, only enums, bools, bounded ints: `schema.ts:1-8`, `validate.ts`). Good. But five existing properties and one existing guard have holes against the new cards (section 4).
2. A ticked day is a faith or origin signal (CB-1: L4). Its timing is data: a note on 14 Feb or 21 Mar each year points at the day. The repo already learned this for birthdays (`TRACKING_PLAN.md` 6.4, `catalog.ts:16`). Library days and parent-typed days need the same rule, written as tests, not only as a card sentence.
3. The catalogue's variant and recency design cannot be tested statistically with the number of families this product will have (section 5). The cards should say so and stop implying a measured gain.

Measurable later, without text, child name, religion or country, and only if a decision row exists (FR-DAT-22):

| Thing | Allowed shape (all L2) | Not allowed |
|---|---|---|
| Evening note delivered and opened | existing `reminder_sent`, `notification_opened`, `type` and `variant_id` for the grid layer only; PROPOSED `recency` enum (section 5) | any event for a library day, typed day, birthday or month note; any day id, layer name for a day, or season name |
| Letter saved from a note | existing `letter_saved.from_notification_2h` (evening reminders only; `observers.ts:129`) | from a library-day or typed-day note |
| Picture start | PROPOSED `capture_started.source` gains `photo` and `suggestion` (v1.1 candidate) | suggestion title, date, place, workout, id, number of photos in a suggestion, empty or cancelled outcome |
| Home slip | none | a slip event of any kind (section 6) |
| Days page or ask | none | any screen route, tap, count of ticks, "Not now" versus "Choose days" tally |

## 3. Findings

Severity: P0 blocks build; P1 fix before build; P2 note. Row ids are the card's; new rows continue each card's numbering and are PROPOSED.

### NS-46 Days we mark

**A-46-1 (P1). Section 21 puts a tester's tradition into the founder's sheet and the pass line cannot detect the harm it names.** 21:298 asks "one question about wrong dates per tradition" and "did the parent tick a day". A per-tradition answer ties a tester to a tradition in the sheet; DAT already rules the same for language (FR-DAT-23: L4, pooled unless 5 or more in one group) and assistive technology (FR-DAT-24). The pass line "0 of 5 felt guessed at" is also weak: if 20% of parents would feel guessed at, 0 of 5 still happens 33% of the time (DAT 3.2 table; computed: 0.8^5 = 0.328). It is a stop line, not a pass line (FR-DAT-09 pattern).
Change section 21 to: "Fixed questions, numbers only: Q-46-1 'Did you tick any day? (yes / no)' with no day named; Q-46-2 'Did any note arrive on a date that looked wrong? (yes / no)', the tester then tells the founder privately which row, and the sheet records only the row id, never the tester's tradition or country. Wrong-date findings are pooled across traditions unless 5 or more testers answered. Pass: 4 of 5 ticked a day without help. Stop (one report trips it, FR-DAT-09): any tester who felt guessed at about faith or origin, or any note on a wrong date. 'First year's rows read with 0 wrong dates' moves out of the tester sheet into the NS-46-R23 and R24 review record."

**A-46-2 (P1). No row stops a library-day note from reaching the existing notification observers.** The code is safe today by construction: `notificationOpenedEvent` returns null unless `kind === 'evening'` (`observe.ts:236`), and `reminder_sent` only fires for evening notes (`catalog.ts:709`). But the guard is a one-line allowlist with no test for the two new kinds. `observe.test.ts:154-158` tests `monthAge` and `birthday` only. NS-46-R4 adds a `libraryDay` kind, and BL-982's `typedDay` is a day the parent chose (equally revealing). If someone later writes "any kind except birthday", the timing leaks.
Add row NS-46-R29 (P0 (a): content-free promise): "Given a delivered or opened note of kind `libraryDay` or `typedDay`, When the analytics observers run with consent granted, Then `notificationOpenedEvent` returns null, `noteReminderOpened` is not called, `reminder_sent`, `reminder_suppressed`, `app_opened.source = notification`, `capture_started.source = notification` and `letter_saved.from_notification_2h = true` are never produced from it, and the test list in `observe.test.ts` names `libraryDay`, `typedDay`, `birthday`, `monthAge` as the four never-reported kinds. Test: `[NS-46-R29] day notes are never observed`." Owner `analytics`, lands with the planner kind.

**A-46-3 (P2). Absence also leaks.** One budgeted note per local date (NS-32-R1). On a ticked date the library day takes the slot and the evening reminder is not sent. A per-id event stream then shows a hole in `reminder_sent` on the same calendar date every year. It points at "some budgeted note that day", weaker than a birthday, but it repeats yearly. Controls: never emit `reminder_suppressed` for a note that yielded to the budget when the winner is a day note (see A-48-3); insights reads weekly aggregates only (k = 10, `TRACKING_PLAN.md` section 4), and no analysis filters one id by calendar date. Write that last line into the data-map doc when analytics returns.

**A-46-4 (P1). The decision rule for the wrong-date risk is missing from the measures.** The card makes a wrong date "the failure mode with the highest cost to trust" (21:230) and adds a remote pause, but nothing says what trips it. Add to NS-46 section 21 and to the DAT support tally (FR-DAT-17, category "confused"): "a day note arrived on a wrong date". One report trips `killSwitches.libraryDays` review the same day (FR-DAT-09). New row NS-46-R30 (P1): "Given one support or tester report of a day note on a wrong date, Then the founder hears the same day, the row is read against its authority, and the pause is decided before the next build goes to a wider cohort."

**A-46-5 (P2). Hemisphere and moved dates are L4 location and tradition proxies; section 12 Never omits them.** 21:242 classes hemisphere L4 inside the store (correct). 21:252 (Never) lists tradition, day id, country, count, but not hemisphere, a moved date or a "browse filter pick". Add them. Hemisphere is coarse location and the repo already drops `$timezone` and `$locale` for that reason (`TRACKING_PLAN.md:236`).

### NS-47 Cultural background

**A-47-1 (P1). R9 is a good row but its test has no home and its forbidden list is too narrow to catch what will actually be added.** R9 (21:386) says the typed catalogue test rejects those names. The current test (`test/catalog.test.ts:19`) forbids `text|transcript|name|note|email|...|locale|timezone|...` as property keys. It does not forbid `tradition`, `religion`, `faith`, `country`, `region`, `origin`, `culture`, `holiday`, `hemisphere`, `place`, `location`, `workout`, `suggestion`. It tests keys only, not enum values, event names or route names. A new enum value (for example `source: 'diwali'`) or event name (`days_ticked`) passes today. Section 5 of this file gives the exact test additions; make them R9's acceptance, and require the test lives in `packages/analytics/test/` (it runs in `npm test` today, with analytics off). New row NS-47-R28 (P0 (a)) below.

**A-47-2 (P1). The Days ask and the analytics consent sheet are two asks in the same window, and only one knows about the other.** NS-47-R19 gates the Days ask to "after the reminder ask is answered or capped, not in the sitting where the Keep gate or the reminder ask showed" (21:396). `analyticsConsentDue` (`consent-timing.ts:37-58`) is third in line behind Keep the book and the reminder prime, allows one ask per session via `askShownThisSession`, and has no input for the Days ask. When analytics returns (v1.1), a parent could be asked about faith or origin and, in the next breath, about usage data. That is the worst order for trust, and it invites the reading "they are asking about my faith to sell it". Also the Days ask is a Home slip, not a sheet, so unless the slip sets `askShownThisSession`, the rule "one ask per session" does not cover it.
Add NS-47-R29 (P1): "Given the ask sequencer (`nextAsk`, BL-023), Then the Days ask is a member of the sequence, sets `askShownThisSession` when shown, and `analyticsConsentDue` returns `ask_already_this_session` in that sitting; the order is reminder prime, Days ask, analytics consent, each in a later sitting than the one before. The analytics sheet never mentions days, faith or origin, and the Days ask never mentions usage data. Test: `[NS-47-R29] asks do not stack`." Default is in the questions (Q-AN-3).

**A-47-3 (P2). The `culture.asked` flag is the one persistent trace of "was asked", and "answered" must not be derivable from it.** 21:444 stores `culture.asked = done` (L2, per account), set after "Not now" as well as after "Choose days". Good: one value for both answers. Add one line to R2: the flag must be written with the same value on both answers, so it cannot become "the parent chose days". Analytics must never read it (R11 already limits readers to the days module; the import-boundary test should list `culture.asked`).

**A-47-4 (P2). No server view and no insights column may be named for these.** The insights loop (server aggregates, k = 10) has no tradition or day column and should not get one. R9 already says so for aggregates; add a data-architect check to the NS-47 migration lint (21:429, FR-CUL-04) that `insights.*` views and the `insights_aggregates()` return type contain no column matching the section 5 forbidden stems.

### NS-48 Notification catalogue and rotation

**A-48-1 (P1). `variant_id` (int 0 to 99) cannot carry 128 to 264 variants and, if widened naively, leaks age.** `catalog.ts:712` and `:726` bound `variant_id` to 0..99; the launch floor is about 128 and the full set about 264 (21:627, 21:593). Variant keys for the last-letter layer carry the child's age band (`ntc.kind.<kind>.<ageBand>.<nn>`, 21:667; bands newborn 0 to 2 months, baby 3 to 11, toddler, child: R7). A `variant_id` that maps one to one to those keys tells us the child's age band, and `TRACKING_PLAN.md` 6.2 lists "ages in days or months" as never. A grid key (`ntc.grid.<tone>.<band>.<nn>`, band = recency r1 to r4) carries no age, but I could not confirm from the card how `<tone>` is chosen (weekday), so I assume weekday only: UNVERIFIED.
Change NS-48-R17 and add NS-48-R28 (P0 (a)): "Given analytics is on, Then `variant_id` is reported only for grid-layer and migrated-floor variants, as the index within a fixed sorted list that never reorders (append only), range 0 to 399 (the catalogue test caps ints at 1000: `catalog.test.ts:66`); the last-letter layer reports `layer = kind` and no id; no age band, no `{child}` rendering flag (named or neutral) and no kind-of-last-letter-with-age is ever a property. A schema bump (v9) records it. Test: `[NS-48-R28] no id or property carries an age band`."

**A-48-2 (P1). The retirement measure in R17 and section 21 cannot work at the size of the tester group.** R17 retires "a variant that testers turn reminders off within a day of seeing". Arithmetic: assume 20 C1 families (DAT 3.2, D-045) and 3 evening notes a week each (PROPOSED; the `few_times` cadence). That is 60 notes a week over about 128 floor variants, so each variant is delivered about 0.47 times a week in the whole group (60 / 128). A reminders-off event is one per family, once. Over a 4-week C1 that is at most 20 events attached to a "last note seen" that the tester must remember among 128 lines. The frame's 5-question cap (DAT FR-DAT-07) also leaves no room to ask. The measure will read "0 of n" for nearly every variant, which DAT FR-DAT-09 already says proves nothing.
Change R17 and section 21: retire on one report, not a rate. "Given any one tester says a note felt like a judgement or about absence (qualitative, FR-DAT-09 pattern), Then that variant, found by the founder from the device, is removed from content in the next drop. The 'turned reminders off within a day' question stays as Q-48-1, asked once per round with a fixed answer (yes / no), and it is read at the level of the whole catalogue, never per variant." Delete "(retire the variant)" from the per-variant clause of 21:682.

**A-48-3 (P1). The R2 volume guarantee and the planned `reminder_suppressed.reason = daily_budget` (DAT 6.2) pull in opposite directions.** DAT 6.2 proposes `daily_budget` when a lower-ranked note yields. If a library day or birthday wins the slot, an event "evening reminder suppressed, daily_budget" on that date is the leak of A-46-3, with a timestamp. Rule for the later catalogue PR: `reminder_suppressed` is emitted only for evening reminders and only with reasons that do not name the winner; when the winner is a day note, birthday or month note, no event is sent. Add to NS-48-R2's test list: "the catalogue and the budget emit no analytics event on the date of a day note."

**A-48-4 (P2). The tap payload may carry `key` (21:627, `scheduler.ts:159`).** The observer reads only `kind` and numeric `variant` (`observe.ts:236-239`) so a string key is ignored today. But a key for the occasion layer (`ntc.occ.family.nn`) in a payload names the layer, and NS-47-R8 already bans day keys in `userInfo`. Change: "the payload may carry `key` only for grid and floor variants; occasion and season layers carry no key, only `kind: 'libraryDay'`."

### NS-49 Picture-first start and Journaling Suggestions

**A-49-1 (P1). Section 21 has no allowlist row for how a letter started, and R2 says the source is "in memory only".** R2 (21:762) keeps the start source out of the stored letter, which protects NS-01 export parity (R13). Analytics is a separate path. Today `capture_started.source` has `tonight, book, notification, make_it_yours, resurface` (`catalog.ts:451`): no picture start. If analytics returns, the cheapest honest measure is two enum values, not a new event: `capture_started.source` gains `photo` and `suggestion` (v1.1 candidate; DAT 6.2 proposed a separate `media_added`, which I do not recommend because `capture_started` already counts starts and `letter_saved` counts keeps). The same PR removes the stale values `tonight`, `make_it_yours`, `resurface` (DAT FR-DAT-26).
Add NS-49-R28 (P1): "Given analytics is on, Then the picture start adds at most the `source` values `photo` and `suggestion` to `capture_started`; no event or property carries a suggestion title, date, place, workout, contact, id, the number of photos in a suggestion, whether the list was empty, or whether the picker was cancelled; `source` is sent at the start and dropped, never joined to a kept letter's row on the server (R2, R13). Test: `[NS-49-R28] only the two source values`." Whether Apple's picker even lets the app tell cancel from empty is UNVERIFIED; the rule bans both anyway, because "Journaling Suggestions is off on this phone" is a device-configuration fact.

**A-49-2 (P2). The planned study question risks a leading read.** 21:880 asks "Did you start a letter from the recent-days list this week? (yes or no)". Fine as a fixed number. But "0 of 5 say it felt like the app reading their photos" is again a stop line, and the pass line "3 of 5 try it without help" has a 50% chance of passing when the true rate is 50% (DAT 3.2 table: "3 of 5" at 50% = 50%). Say "usability check, not a rate" (FR-DAT-11) and mark `4 of 5` for the past-behaviour question as already in DAT's shape.

**A-49-3 (P2). Apple's iOS 26 suggestion notification opens the app (R20 to R22, spike only).** If it ever ships, the open arrives as `app_opened.source = link` and the route template is already generic (`routes.ts`; `ROUTE` enum has no day or picture routes). State in R21 that the suggestion id is never an analytics property and never in a route parameter; `validate.ts` already drops UUID-like strings (`PII_PATTERNS`), but an opaque non-UUID token would pass the shape check only if it were an enum value, which it cannot be. That is a real protection; note it as a reason to keep the enum-only design.

### NS-50 Home today

**A-50-1 (P1). "No added time" in section 21 and R11 has no number.** 21:1040: "Pass: no added time and no parent says 'waiting'", measured on 5 parents. With 5 parents, a median in seconds cannot show "no added time"; it can only show a large effect. Define it: "PROPOSED: the median seconds from Home first frame to tapping Speak or Type, slip shown versus slip not shown, same 5 parents in both conditions in a random order (a paired read), differs by less than 1 second, and no single parent is slower by 3 seconds or more with the slip. Reported as five paired numbers, never a percentage." The 1 and 3 second figures are my proposal, not read from a source; the founder or `design-systems` should set them before day 0 (FR-DAT-10). Also ask the "waiting" question open ("what, if anything, on this screen wanted something from you?") and count the answers, because "did anything feel like it was waiting" is a leading question.

**A-50-2 (P1). Do not add a Home slip event, ever.** A `home_slip_shown{kind}` event would tell us when rank 2b (a day we mark today) showed, which is the day-tick leak again with a calendar date. Rank 2c shown tells us nothing about faith, but "Choose days" versus "Not now" tallies are a count of parents who ticked any, which R9 forbids. The slip order is covered by tests (R1, R5), not telemetry. Add to NS-50 section 14 Never: "never an analytics event for a slip, its rank, its dismissal, or the Days ask answer." No catalogue change.

**A-50-3 (P2). Conflict 5 in the card (slip against the typed-day line) changes what T3 compares.** If a notification tap shows the line and a plain open shows the slip, the T3 test must run both entry paths or the time comparison mixes them. Add one line to section 21: "T3 is run once per entry path (tap a note, open the app)."

## 4. Allowlist changes needed in `packages/analytics` (none needed to ship 1.0; all before analytics returns)

All are tests or catalogue PRs by `analytics`; none adds an SDK (my Never).

| # | Change | Where | Priority | Acceptance |
|---|---|---|---|---|
| AL-1 | Extend `FORBIDDEN_KEY` with the stems in section 5 | `test/catalog.test.ts:19` | P1 | Test fails if any property key matches. Existing keys such as `days_since_last_open` and `DAYS_BUCKET` do not match (the stems use whole words, not "day") |
| AL-2 | New test: no enum value matches the same stems; no event name matches `day`, `holiday`, `tradition`, `suggestion`, `slip` except the existing `resurface_*` and `moment_shown` | `test/catalog.test.ts` | P1 | Run against `EVENTS`; today green |
| AL-3 | New test: `ROUTE` contains no Days, Browse, day detail, ask or suggestion route | `test/catalog.test.ts` or `src/routes.ts` test | P1 | C-S24, C-S25, C-S26 get no `screen_view`; today `routes.ts` maps unknown routes to null (UNVERIFIED, read only the enum) |
| AL-4 | Observer tests for `libraryDay`, `typedDay` | `test/observe.test.ts:154-158` | P1 | NS-46-R29 |
| AL-5 | `settings_changed.key` must not gain a day-names switch; `child_setting_changed.key` must not gain a days key | `test/catalog.test.ts` | P1 | The enum equals today's list plus only what a later PR justifies |
| AL-6 | `consent-timing.ts`: add `daysAskShownThisSession` or fold into `askShownThisSession` | `src/consent-timing.ts:26-34`, `nextAsk` in `packages/core` | P1 | NS-47-R29 |
| AL-7 | When analytics returns: `variant_id` rule (A-48-1) and the `RECENCY_BAND` enum (section 5); `SCHEMA_VERSION` 9 with a new fingerprint (`catalog.ts:212-226`; `schema-version.test.ts`) | `src/catalog.ts` | P2 (v1.1) | Schema test records the hash |
| AL-8 | When analytics returns: `capture_started.source` gains `photo`, `suggestion`; stale values removed (FR-DAT-26) | `src/catalog.ts:451` | P2 (v1.1) | NS-49-R28 |
| AL-9 | `TRACKING_PLAN.md`: tracking plan and code stay one list. The plan lists `variant_id` int 0 to 99 (line 181, 183); update with AL-7 in the same PR, as `npm run plan` generates section 3.1 | `docs/analytics/TRACKING_PLAN.md` | P2 | plan-doc test passes |

Stems for AL-1 and AL-2 (PROPOSED; these are concept words, no real tradition names, so the list cannot itself be a stereotype or a real-family detail): `tradition`, `religio`, `faith`, `countr`, `region`, `origin`, `cultur`, `holiday`, `hemisphere`, `library_day`, `typed_day`, `day_id`, `day_name`, `ticked`, `suggestion_`, `place`, `location`, `workout`, `reflection`, `contact_`. A value-side scan on enum values uses the same stems. Names of real traditions or days are not put in a repo test; the canary in NS-47-R8 uses synthetic keys (`zz-test-tradition`), which is the right design.

## 5. Experiment design for the catalogue (variant and recency axis)

### 5.1 What the founder asked for, and what the numbers allow

Direction 4.2 and Q-NTC-5 ask whether more variants reduce turn-off. The honest answer: that cannot be shown in the 1.x line.

Sample size, computed (two-sided alpha 0.05, power 0.8; normal approximation; ignores clustering, so real needs are larger):
- Outcome "family turns reminders off within 4 weeks", 10% in the floor arm against 5% in the full-set arm: pooled p = 0.075; n per arm = (1.96 x sqrt(2 x 0.075 x 0.925) + 0.84 x sqrt(0.10 x 0.90 + 0.05 x 0.95))^2 / 0.05^2 = (1.96 x 0.3725 + 0.84 x 0.3708)^2 / 0.0025 = (0.730 + 0.311)^2 / 0.0025 = 434 families per arm, 868 in total.
- At the assumed 40% consent (`TRACKING_PLAN.md` 1.2, PRD 7.8) that is about 2,170 families in the app. The founder expects a few hundred on the Free plan (DAT 3.2), and DAT already says "no A/B tests in the 1.0 line".
- Outcome "opened within the day" per note, 12% against 15%: about 2,030 notes per arm (same method: (1.96 x 0.4833 + 0.84 x 0.4828)^2 / 0.03^2 = 1.830 / 0.0009). Notes from one family are not independent, so the real need is larger by an unknown design effect (UNVERIFIED).
- Per variant: about 0.47 deliveries a week across 20 C1 families (A-48-2). Variant-level comparison is never possible in 1.x.

So: the full set ships on judgement and on the founder's content review, never on a claimed gain. Change NS-48 section 2 or Q-NTC-5 to: "Whether variety reduces turn-off is a hypothesis that cannot be tested before about 2,000 consenting-plus-non-consenting families; until then no sentence in the product, store, website or read-out says that variety improves habit." (Claims already forbid "fewer or more notes", 21:676; add "keeps parents writing".)

### 5.2 What to do instead in 1.x

| Question | Source | Reading |
|---|---|---|
| Did a note feel like a judgement or about absence? | Tester sheet, one yes or no per round, plus device check NTC-T24 (21:655) | One report retires the line (A-48-2). Reported "x of n answered" |
| Does Sunday read slower than Friday? | Same sheet, 21:682 | Reading test, fixed answer |
| Is volume unchanged? | Test NS-48-R2 (CI), not research | The set (id, date, time, class) is identical with the catalogue on and off |
| Does a note tone suit the gap? | RSH study S6 reading test (RSH 4), 5 parents, mock notifications | Comprehension and reaction only |

### 5.3 The design, if analytics and numbers ever allow (v1.1 or later; do not build now)

- Unit: the family (the random analytics id). One arm for a fixed 4 weeks. Never per notification, so one parent never sees a mix.
- Assignment: deterministic from the analytics id by remote config (`TRACKING_PLAN`: flags come from our own config, `posthog.ts:183`, not PostHog). The arm name is sent once as `experiment_exposed{experiment, arm}`, both enums (PROPOSED: `catalogue_size` with `floor` or `full`), so no property rides on every event. Analysis joins by the id. Pricing arms stay forbidden (FR-DAT-20).
- Arms: only content size (floor against full), never "tone", "name shown", day notes or Plus wording. Names-on or names-off is a parent setting, not an arm (R11, N-7).
- Recency axis: not randomised, observational. PROPOSED enum `RECENCY_BAND = oneOf('d1','d2_6','d7_14','d15_35')` matching NS-48-R3 (the existing `DAYS_BUCKET` is `d0, d1, d2_7, d8_30...` and does not align). Properties on `reminder_sent` and `notification_opened`: `recency`, `layer` (`grid` or `kind`), `shape` (5 values). No age band, no kind of last letter beyond what `CAPTURE_MODE` already carries. These are derived at plan time (N-6), so no clock is read at delivery.
- Primary outcome: share of families still on reminders after 4 weeks, with a pre-registered minimum of 434 per arm. Guardrails: reminders off per month at 10% or less (TRACKING_PLAN 1.3, an unverified target here), and any one report of a judgement (stop, FR-DAT-09). Stop early only on the guardrail, never on a favourable interim (no peeking).
- Opt-in bias: consenting families are likely more engaged (FR-DAT-29), so the result describes them, not all families. The read-out says so first.
- What stays out: day notes, birthday and month notes, quiet or hidden books (R21, R25), and any note in a language pack not vetted (FR-DAT-26 stays P2).

## 6. The insights loop and the metric tree

Server side: none of these cards writes a server row, column or view (NS-46 section 10, NS-47-R4, NS-48 section 10, NS-49 section 10, NS-50 section 10). So the server aggregates (`insights.*`, k = 10) see nothing of them. That is correct. The insights loop (INSIGHTS_LOOP is "Superseded for v1.0"; founder decision 12 makes it the long-run design) has nothing to read here and nothing to learn about days, background or pictures except through opt-in device events, and for days there is deliberately none.

Metric tree fit (DAT 3.1):
- North Star (weekly making families, tester Q-NS-1): these features are meant to raise it (a chosen-day note, a picture start). The 1.0 line can only observe the North Star from testers by hand. The cards correctly do not add a North Star claim. Add to NS-48 and NS-49 section 21 one line: "These cards do not move a number we can read in 1.0; they are read by the reaction questions above."
- "I have two minutes" branch (NS-13, NS-35, NS-34): NS-48 and NS-50 belong here; NS-50 maps to the NS-35 rule "start sources are a closed list" (R4). Time to Speak is already a run-sheet number (FR-DAT-15), so T3 should use that sheet's columns, not a new one.
- "I want to go back" and "Something to hold": NS-46 and NS-49 touch neither. NS-46 belongs to no branch today; it is a notification content feature. Proposal: file it under Foundations as a guardrail leaf, "wrong date" (A-46-4), and under "I have two minutes" for adoption (Q-46-1). Without that, FR-DAT-22 says it is dropped from the round.
- Guardrails: add the wrong-date report (zero target) and "a note felt like a judgement" (zero target) to FR-DAT-09's list. Both are one-report trips.
- Business and trust: no card gates anything (T2). `plus_offer_viewed` and friends are untouched; R27 of NS-46 forbids sales language on a day note.

## 7. Good enough to leave alone

- NS-46-R2, R16, R17, R22: no pre-tick, quiet days quiet, voice rules, no look-back. Nothing for measurement to change.
- NS-47-R1 to R4, R8, R11: L4 for the whole store, picks held in memory only, a network fake sees zero requests, one canary with synthetic keys, one reader. Strongest privacy design in the five cards.
- NS-47-R5: a day note leaves no trace in the synced `entries.prompt_key` row, tested against a control. This is exactly the server-side leak path that matters.
- NS-47-R9: right intent, wrong detail only (A-47-1).
- NS-48-R1, R2, R3, R24: pure function, volume identical by test, every input known at plan time, no new class. The best protection against "variety raises volume".
- NS-48-R9, R11: lock screen rules honoured by the catalogue.
- NS-49-R6, R10, R13, R24, R25: no permission, only photos read, an export identical to a level 1 letter, canary with a suggestion title, place and workout, level 3 closed. R10's source scan is a good enforcement of "only Photo and LivePhoto".
- NS-50-R2, R8, R11: only today, never a list or count; quiet books get none; Home is not a feed.
- All five "Measures with analytics off" sections: no telemetry is the right 1.0 call.
- Sections 11 on all five: classes read correctly; the L4 store rule wins by highest class (NS-47-R1).
- Existing observers fail closed on unknown kinds (`observe.ts:236`).

## 8. Backlog needs (no ids invented; none above BL-999)

- New row, `analytics`, S: AL-1 to AL-6 tests and the NS-46-R29, NS-47-R28, NS-48-R28, NS-49-R28 acceptance rows. Docs and tests only. Blocked by nothing. Because these add no event, no `SCHEMA_VERSION` bump (the bump happens at AL-7 and AL-8, v1.1).
- New row, `analytics`, S, needs-decision (FOUNDER, because it changes what could be collected): the v1.1 catalogue PR for AL-7 to AL-9. Not before.
- Change to the planner rows (NR-DAY-06, BL-982): the kind field distinguishes `libraryDay` and `typedDay` from `evening` so the observer's one-line gate holds.
- Change to `nextAsk` (BL-023, `packages/core`): the Days ask is a member of the sequence (NS-47-R29).
- Change to the NS-47 migration lint: no `insights.*` column or `insights_aggregates()` field matches the stems (A-47-4).
- Research row (RSH): S-tests for NS-46 to NS-50 join the question bank `docs/research/QUESTION-BANK.md` (FR-DAT-06): Q-46-1, Q-46-2, Q-48-1, the NS-49 recent-days question, the NS-50 open "waiting" question.

## 9. Verdicts

| Card | Verdict | Changes |
|---|---|---|
| NS-46 Days we mark | CHANGES | A-46-1 (tester sheet: no tradition per tester, stop line not pass line), A-46-2 (NS-46-R29, observer exclusion tests), A-46-4 (NS-46-R30 wrong-date trip), A-46-5 (Never gains hemisphere and moved dates); A-46-3 as a note |
| NS-47 Cultural background | CHANGES | A-47-1 (R9 becomes R28 with a home and the forbidden stems), A-47-2 (NS-47-R29 asks do not stack with the analytics sheet), A-47-3, A-47-4 as P2 |
| NS-48 Notification catalogue | CHANGES | A-48-1 (NS-48-R28 `variant_id` and age band), A-48-2 (R17 retire on one report; no per-variant rate), A-48-3 (no event on a day-note date), A-48-4; add the "no claim of fewer turn-offs" sentence from section 5.1 |
| NS-49 Picture-first start | CHANGES | A-49-1 (NS-49-R28 two source values only), A-49-2 and A-49-3 as P2. The card is otherwise strong |
| NS-50 Home today | CHANGES | A-50-1 (a number for "no added time"), A-50-2 (Never gains "no slip event"), A-50-3 |

No card is BLOCK. Nothing here conflicts with a GAP-LOG ruling. One conflict to flag: `TRACKING_PLAN.md` 6.4 says "no event may fire at a time determined by a child's birthday or due date", and the tests enforce only birthday and due-date names. The same logic now covers a parent's chosen days; that is an extension of 6.4, not a ruling reopened, and needs Karma's nod to land in `TRACKING_PLAN.md`.

## 10. Questions for the founder (each with a default)

| # | Question | Default |
|---|---|---|
| Q-AN-1 | May the tester sheet record, per tester, which tradition's day looked wrong? | No. Record the row id only, pooled (A-46-1) |
| Q-AN-2 | Should the catalogue's size ever be tested as a randomised arm? | Not in 1.x. Revisit only if consenting families reach about 870 (434 per arm), which at 40% consent means about 2,170 families (section 5.1) |
| Q-AN-3 | Order of asks when analytics returns | Reminder prime, then the Days ask, then analytics consent, each in a later sitting (A-47-2) |
| Q-AN-4 | Add a `suggestion` and `photo` value to `capture_started.source` in v1.1? | Yes, two values and no new event; revisit after NS-01 has been in TestFlight |
| Q-AN-5 | Does an extension of `TRACKING_PLAN.md` 6.4 to cover a parent's chosen days (typed or ticked) need counsel? | Karma decides; default: write it, as it only narrows what is sent |
| Q-AN-6 | Seconds thresholds for "no added time" on Home (A-50-1) | Less than 1 second median difference, no parent 3 seconds or more slower. Founder or `design-systems` fixes before day 0 |

Memory note for the main session: nothing new to save. I used no stored fact about the user in this file.

Analytics Engineer (`analytics`, Claude role, not a lawyer or statistician of record)
