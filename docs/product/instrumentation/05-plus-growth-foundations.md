# Instrumentation requirements 5: Plus, growth and foundations (PROPOSED)

Status: PROPOSED, 20 Nov 2026. Author: `product` (PM5). Partner: `ops` (file `docs/analytics/instrumentation/ops.md`; not on develop or any branch when this was written, so I match its inputs: `NFR-BUDGETS.md`, `MEASUREMENT-PLAN.md`, `OBSERVABILITY-WITHOUT-CONTENT.md`). Event standard: `docs/analytics/instrumentation/00-event-standard.md` from `analytics` had no PR yet; I follow the founder's baseline in `event-standard-brief.md` (name `<area>.<object>.<action>`, basics `screen.<id>.viewed`, `ui.<id>.tapped`, `ui.<id>.impressed`, `perf.<metric>.measured`, funnels `f_<area>_<goal>`, one registry row per event). If the final standard differs, the standard wins and this file is edited.
Docs only. Nothing here changes a locked statement. Every event is built DARK: compiled, tested, inert (D-095, D-124 item 3, FR-DAT-01 in `docs/product/prd/functions/data-and-measurement.md:138`). Turning it on, the consent sheet, the label change and counsel are the founder's.

## 0. Binding rules and sources

- Free and open source only (founder rule, 20 Nov): no paid product, tier or seat in anything below. "Free" here means no licence fee and no new bill. Anything that needs a new server is marked FOUNDER (section 7).
- Locked rules that bind this area: no price, trial length or count on any parent screen (FR-FIN-09, FR-DAT-03); no paywall before a parent has seen their words (frame guardrail, `00-product-frame.md:39`); no Plus promotion slip, notice class or rating ask (FR-MKT-20, 22, 24); the website carries no tracker, pixel or tracked link (FR-MKT-34); no event for typed-day delivery, search text, language next to a letter (FR-DAT-27); assistive-technology answers are pooled (FR-DAT-24); first run is not measured in the field in 1.0 (FR-DAT-33); no randomised price arms in 1.0 (FR-DAT-20).
- Screen ids are the e2e ids of `docs/design/IA-FINAL-20nov.md` (branch `docs/design-ia-final-20nov`, not yet on develop), written lower case with underscores: E-S10 is `e_s10`. Control and element ids below marked (id PROPOSED) are not in IA-FINAL; `design-systems` must publish the closed control list before IN-03.
- Classification label: L2 = closed counts, enums and bounded numbers, no id of a person (as in `packages/analytics/src/catalog.ts`). No event here is L3.
- Consent gate column: C = needs the v1.1 analytics consent (D-003, D-095); P = phone only, never leaves the device (perf markers, `MEASUREMENT-PLAN.md` section 4); S = server aggregate read by runbook only (FR-DAT-28, FR-DAT-35); A = Apple's own console, no code of ours.

## 1. Screens, controls and impressions

| Surface | screen event | Controls (ui.<id>.tapped) | Impression (ui.<id>.impressed) | Question it answers |
|---|---|---|---|---|
| Keep gate E-S10, "Keep adding to {child}'s book" | `screen.e_s10.viewed` | `e_s10_start_plus`, `e_s10_hold`, `e_s10_restore` (id PROPOSED) | none (the screen is the impression) | Of parents who reach the gate, how many start Plus, hold, or restore? |
| Plan E-S11 (Me, Plan; `/settings/plus`) | `screen.e_s11.viewed` | `e_s11_start_plus`, `e_s11_restore`, `e_s11_redeem_code`, `e_s11_manage` (id PROPOSED) | `ui.e_s11_state.impressed`, state enum below | Do parents find Plan by themselves? |
| Plus confirmed E-S12 | `screen.e_s12.viewed` | `e_s12_done` (id PROPOSED) | none | Did the purchase finish into a calm end? |
| Home Plus line E-S26 (not a slip) | none (it is a row on Home) | `ui.e_s26.tapped` | `ui.e_s26.impressed` | Impression to tap rate of the one line that mentions Plus |
| Plan reminder inside the app E-S25, D-S24 | `screen.d_s24.viewed` | none | `ui.e_s25.impressed` | Is the plan notice seen? |
| Plan notice (local notification, class `plan`) | none | `ui.d_s11_plan.tapped` (landing, id PROPOSED) | not measured: delivery is not observable (see section 4) | Opened rate only |
| Help row on Me (opens Mail) | none (Me is E/C-S01) | `ui.c_s01_help.tapped` (id PROPOSED) | none | How many parents reach for help from Me? |
| App update line E-S16 | none | `ui.e_s16.tapped` | `ui.e_s16.impressed` | Are parents behind on versions, and do they act? |
| Error boundary E-S13, "This page did not open" | `screen.e_s13.viewed` | none | none | How often does a parent see a broken page, by app version? |
| Accessibility and languages (NS-33, NS-17) | none | none | none | NOT measured in the app, see section 6 |

State enum for `ui.e_s11_state.impressed`: `free`, `plus`, `plus_shared`, `grace`, `retry`, `lapsed`. It is the state Apple reports on this phone, nothing about the family.

Never a control event for: a price, a trial, "most popular", anything about a letter's content. Nothing in this table adds a count to any parent screen (FR-DAT-03).

## 2. Funnels

| Funnel id | Ordered events | Drop-off read | Where counted today (analytics off) |
|---|---|---|---|
| `f_onboarding_store_to_open` (outside the app, NS-38) | store impression > product page view > first-time download > first open | impression to page, page to download, download to first open | App Store Connect App Analytics (A). Facts about what ASC reports: UNVERIFIED, not read this session. |
| `f_onboarding_open_to_first_letter` (PM1 owns steps; listed for the whole route) | `screen.e_s01.viewed` > `screen.e_s02.viewed` > PM1 first-run steps > `capture.take.saved` | step drop-off | Stopwatch study only (FR-DAT-33) |
| `f_plus_gate_to_plan` | `plus.allowance.reached` > `screen.e_s10.viewed` > `ui.e_s10_start_plus.tapped` > `plus.offer.closed` (outcome purchased) > `screen.e_s12.viewed` | gate to tap, tap to purchase, purchase to confirmed | Paid or trial starts over first-time downloads by install week, US, 95% interval (FR-DAT-19; A) |
| `f_plus_gate_to_hold` | `screen.e_s10.viewed` > `ui.e_s10_hold.tapped` > `plus.letter.held` | share who hold; does a held letter later become a purchase | none |
| `f_plus_plan_page_to_manage` | `screen.e_s11.viewed` > `ui.e_s11_manage.tapped` | do parents find how to cancel (Terms name Settings, Plan as the cancel path) | support tally "billing" |
| `f_plus_lapse_to_return` | `plus.plan.changed` (to expired or refunded or revoked) > `screen.e_s10.viewed` | do kept letters stay kept (guardrail in section 5) | none |
| `f_plus_notice_to_plan` | `ui.e_s25.impressed` > `ui.d_s11_plan.tapped` > `screen.e_s11.viewed` | notice to Plan | none |
| `f_system_crash_free` | `system.app.opened` > `system.session.ended` (clean or not) | crash-free sessions by version | Apple Organizer and ASC, opted-in users only (FR-DAT-16; A) |

A funnel is only a report over events already in the registry; no funnel adds an event.

## 3. Plus and plan: the journey, step by step

Journey: second letter kept > free allowance reached > the next Keep asks (E-S10) > start Plus, hold, or restore > Apple's sheet > Plus confirmed (E-S12) > Plan (E-S11) shows the state > a plan reminder, if any > renewal, billing retry, lapse or refund > letters stay kept.

| Step | Question the team needs answered | Event (name only) | Properties (closed) | Not measured, and why | Side |
|---|---|---|---|---|---|
| Allowance reached | When does a family meet the gate? | `plus.allowance.reached` | `allowance_band` enum `2`, `3_to_5`, `6_plus` | Letter text, which letter, days since install tied to a child | phone |
| Gate shown | Is the gate ever shown before a parent kept a first letter and read their words? | `screen.e_s10.viewed` | `kept_band` enum `0`, `1`, `2`, `3_to_9`, `10_plus`; `lapsed` bool | The held letter's content, the child, the price | phone |
| Choice | Start, hold or restore? | `ui.e_s10_start_plus.tapped`, `ui.e_s10_hold.tapped`, `ui.e_s10_restore.tapped`; `plus.letter.held` | `kept_band` | Reason for holding (no free text, no survey: FR-DAT-02) | phone |
| Apple's sheet | Did the sheet open and how did it close? | `plus.offer.closed` | `trigger` enum `gate`, `plan_page`, `home_line`, `offer_code`; `outcome` enum `purchased`, `dismissed`, `unavailable` | Price shown, product chosen at a level that identifies a person | phone |
| Started | Where did Plus start? | `plus.plan.started` | `source` enum `gate`, `plan_page`, `restore`, `offer_code`, `ask_to_buy`; `period` enum `month`, `year`, `unknown` | Amount, currency, receipt, transaction id | phone |
| Restore and code | Do restores and codes work? | `plus.restore.completed`, `plus.code.redeemed` | `outcome` enum `plus_on`, `nothing_found`, `error` | Which Apple ID | phone |
| Plan state | How does the plan move? | `plus.plan.changed` | `from_state`, `to_state` enum `none`, `trial`, `active`, `grace`, `billing_retry`, `expired`, `refunded`, `revoked`; `period`; `ownership` enum `purchased`, `family_shared`, `unknown` | Dates, renewal counts | phone |
| Notice | Is the plan notice opened? | `notifications.plan_notice.opened` | none | Delivered (not observable on device; adding a fake "delivered" would be a guess) | phone |
| Lapse | After a lapse, do kept letters stay readable? | invariant, not an event (section 5) | | | phone test, support |

Registry rows (one definition each; `status` proposed; `owner` product; `schema_version` 1; reqs are the rows this file serves). Classification L2 and consent C for all.

| Event | Trigger | Requirement |
|---|---|---|
| `plus.allowance.reached` | The last free letter was kept (once per phone). Replaces `free_allowance_reached` | FR-DAT-19, NS-44, E59 |
| `screen.e_s10.viewed` | Keep sheet drawn. Replaces `keep_gate_shown` | NS-44, FR-MKT-22 |
| `plus.letter.held` | Parent chose to keep on the phone. Replaces `letter_held` | NS-44 |
| `plus.offer.closed` | Apple's store view closed. Merges `plus_offer_viewed` and `plus_offer_closed`: a view with no close is not an outcome we read | FR-FIN-09 |
| `plus.plan.started` | Plus on after a gate, plan page, restore, code or Ask to Buy. Replaces `plus_started_from_gate` | FR-DAT-19, FR-FIN-11 |
| `plus.plan.changed` | StoreKit state changed on this phone, production transactions only. Replaces `plan_changed` | FR-FIN-11, FR-FIN-12 |
| `plus.restore.completed`, `plus.code.redeemed` | Apple restore or offer code sheet closed. Replace `restore_result`, `offer_code_redeemed` | FR-FIN-11 |
| `notifications.plan_notice.opened` | A parent opened a plan notice | NS-32, B-03 |

Existing catalogue entries in `packages/analytics/src/catalog.ts:823-880` carry raw integers (`letters_kept` 0 to 1000, `allowance`). The standard says counts are bucketed, so the migration (analytics' call) turns them into the bands above. A rename is a new event and the old name is deprecated with a date, never edited in place.

Success measures (all targets PROPOSED; none is set until a baseline exists, FR-DAT-32):
- Business number: paid or trial starts over first-time downloads by install week, US storefront, with the 95% interval, excluding tester offer codes and sandbox (FR-DAT-19). Source today: ASC (A), UNVERIFIED that ASC separates offer-code starts.
- Gate to Plus rate and gate to hold rate: read only when the opted-in count n is 20 or more; below that "x of n" (FR-DAT-08). Target: none. Take a baseline in the first v1.1 month.
- Plan page found: share of `screen.e_s11.viewed` that come from `ui.e_s10_*` or the Me row. Target: none.

Guardrails (zero-target; one report trips each, FR-DAT-09):
- G-P1 Gate before words: any `screen.e_s10.viewed` with `kept_band` below the allowance, or before a parent has seen a first letter, is a defect. Zero. Proved by a unit test on the phone and a weekly query when events exist.
- G-P2 Charge outside a trigger: any charge a parent did not start. Not observable by the app. Source: support tally "billing" plus ASC. Zero.
- G-P3 Lapse safety: after `plus.plan.changed` to expired, refunded or revoked, every letter kept while Plus was active stays kept, readable, playable and exportable (FR-FIN-11). Proved by the StoreKit refund test (proposed in `finance.md:226`), not by an event.
- G-P4 Price words: no string a parent reads or any notification carries a price, trial length or count (FR-FIN-09). Proved by the content scan, not an event.

Observability: error classes `plus_store_unavailable`, `plus_entitlement_check_failed`, `plus_restore_failed` as closed codes (`{ ok: false, code }`, `OBSERVABILITY-WITHOUT-CONTENT.md` section 1), carried by `system.error.raised` (section 5). Alert (proposed, ops): restore or entitlement failure share in a week above the baseline band. Reader: founder, weekly read-out.

Consent and release gate: C (v1.1 consent). The dark build must show: no Plus event in a 1.0.x bundle (FR-DAT-01 test), plus the existing label statement unchanged.

Test that proves no content: a validator test over the `plus.*` rows asserting every property is an enum or a band from the allowlist, no field named amount, price, currency, receipt, transaction, product_id or any id; a canary pass with the Asha fixtures through the Keep path, searching every emitted payload for the Asha strings and any digit string longer than 3.

## 4. Store page, install to first open, website

| Question | Answer from | Event | Note |
|---|---|---|---|
| Does the page turn views into downloads? | ASC App Analytics (A), no code of ours | none | NS-38. Source terms UNVERIFIED. |
| Do installs open the app? | ASC first-time downloads against sessions (A) | `system.app.opened` (C, from v1.1; never on first install before consent, as in the catalogue note at `catalog.ts:235`) | first open is not an event in 1.0 (FR-DAT-33) |
| Which build are people on? | `system.app.opened` property `app_version` (closed list from the release table, never a free string) plus ASC version adoption (A) | | adoption read weekly |
| Does the website lead to the page? | nothing in 1.0 | none | FR-MKT-34: no tracker, pixel or tracked link through launch. |
| After 1.0, a site count? | Umami: MIT, PostgreSQL only, "no cookies" is the project's own claim (read on github.com/umami-software/umami this session). Hosting needs a Node server: FOUNDER decision. | `ui.<site_id>.tapped` on a closed list of page ids (site ids PROPOSED) | Rejected for 1.0. Vercel Web Analytics rejected: a paid product. |

Not measured: referrer, campaign, IP or country of a person, any link decoration. Server refusals by country code stay as the weekly aggregates of FR-DAT-35 (S).

## 5. Foundations: performance, reliability (NS-32 to NS-37)

Performance. Metric ids come from `NFR-BUDGETS.md`; each is `perf.<metric>.measured` with `budget_band` enum `within`, `near`, `over` (near = between the budget and 1.5 times it, a proposed cut) and `device_tier` enum `small`, `standard`, `unknown`. Raw milliseconds stay in the on-device marker ring (P), shared by hand on the run sheet (FR-DAT-15), never sent in 1.0.

| Event | Budget row | Budget |
|---|---|---|
| `perf.launch_cold.measured` | L-01 | p50 1.2 s, p90 2.0 s |
| `perf.launch_warm.measured` | L-05 | p50 400 ms |
| `perf.speak_to_mic.measured` | C-01 | p95 500 ms |
| `perf.save_commit.measured` | C-02 | p95 200 ms |
| `perf.book_first_render.measured` | S-03 | p95 500 ms |
| `perf.find_first_row.measured` | S-07 | p95 300 ms |
| `perf.switch_child.measured` | L-08 | p95 300 ms |
| `perf.sync_apply.measured` | Q-05 | 200 rows under 300 ms |
| `perf.migration.measured` | Q-02 | 500 ms or less |

Frame hitches (S-01) come from Instruments, not markers (`MEASUREMENT-PLAN.md` section 4); they stay a hand row. Success measure: every row met on the SE 3 run sheet before a candidate (FR-DAT-15); field targets PROPOSED after a baseline.

Reliability. Events: `system.app.opened`, `system.session.ended` (property `ended` enum `clean`, `fatal`, `killed`), `system.error.raised` (properties `area` enum from the closed areas, `code` enum from the module unions such as `space_low`, `decode_failed`, `budget_full`, `schedule_failed`), `system.diagnostic.received` (MetricKit class enum `crash`, `hang`, `cpu`, `disk_write`; the payload is never read or stored, only the class). Crash-free rate: quoted only after release, 99.8% from ASC opted-in users (FR-DAT-16); the C1 gate is zero unresolved signatures in at least 500 sessions. Guardrails: zero lost letters, zero lost recordings (kill harness C-06, C-07 plus support "lost"). The known open finding stands: a fatal JS error message can reach an Apple crash report we cannot scrub (`OBSERVABILITY-WITHOUT-CONTENT.md` section 3); I add nothing that depends on it.

Notifications (NS-32): the 60-pending ceiling and plan-notices-first order are a unit test (B-03), not telemetry. No `delivered` event, no event at a birthday or typed-day time (FR-DAT-27).

Accessibility (NS-33) and languages (NS-17): NOT instrumented. VoiceOver, Dynamic Type and Reduce Motion states and the spoken language are sensitive-adjacent and language-tied answers are L4 (FR-DAT-23, 24); counsel has not cleared them. They are read by the XCUITest audit (A-05) and the pooled tester question only.

## 6. Tools (open source first, all must be free)

| Need | Option checked | Licence | Self-host | Data it holds | Verdict |
|---|---|---|---|---|---|
| Product events, funnels | PostHog | MIT core, `ee` directory under its own licence not read (github.com/PostHog/posthog, read this session) | Docker, 4 GB memory advised, about 100k events a month before it advises Cloud | the closed events above | Reject PostHog Cloud (paid product). Self-host needs a server: FOUNDER. Default: store events in a Supabase Postgres table with an Edge Function, report in SQL (data-architect decides). |
| Crash and release health | Apple Organizer, ASC, MetricKit | Apple platform, no fee | no | Apple's opted-in counts | Adopt. |
| | Sentry | not OSI open source, licence UNVERIFIED | | | Reject: not read, and its hosted tiers are paid. |
| | GlitchTip | UNVERIFIED (page would not load) | needs server and Postgres | | Hold; decide with ops. |
| Website | Umami | MIT (read) | Node plus Postgres | page counts | Hold past 1.0 (FR-MKT-34). |
| Reporting | SQL views plus a local tool on the founder's Mac against a read-only role | Metabase, Grafana, Superset licences UNVERIFIED | local, no server | aggregates, k at least 10 | Default: plain SQL files. |
| Server traces | OpenTelemetry | UNVERIFIED | | | ops' file decides. |

Build ourselves only: the closed registry, the validator and the content-free tests. Any new dependency is listed, not added; `package.json` is the founder's.

## 7. Support, feedback and the weekly read-out

- Support: no in-app feedback form, survey or share-diagnostics control in 1.0 (FR-DAT-02). "Help" opens Mail (IA-FINAL, Me). The tally is by hand: lost, confused, billing, other, with sub-categories, counts only (FR-DAT-17); store ratings by the same categories (FR-DAT-18). The only event that touches it is `ui.c_s01_help.tapped` (C, v1.1).
- Weekly read-out (owner: `product`; reader: founder; format from `decision-science`): store numbers from ASC, tester answers as "x of n" (never a percentage under n of 20), support tally, release health (version adoption and crash-free), run-sheet rows met or missed, guardrails G-P1 to G-P4 and the lost-letter line. Opens with its biases (FR-DAT-29). While analytics is off, only the A and tester columns are filled and the read-out says so.

## 8. Proposed backlog rows (working ids IN-nn; real BL ids from product)

| Id | Wave | Row | Owner role | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-01 | 1 | Registry rows for section 3, 4, 5 events (docs and `catalog` entries, dark), bands instead of raw counts | analytics | M | 00-event-standard | no |
| IN-02 | 1 | Content-free validator test for `plus.*` and `perf.*`, canary with Asha, 1.0.x profile check | analytics, qa | S | IN-01 | no |
| IN-03 | 1 | Closed control-id list for E-S10, E-S11, E-S12, Me Help | design-systems | S | IA-FINAL merged | no |
| IN-04 | 2 | Perf marker harness and `perf` profile (H1 in MEASUREMENT-PLAN; BL-929 only covers the run sheet) | mobile, ops | M | none | EAS build count |
| IN-05 | 2 | Gate-before-words unit test (G-P1) and refund test (G-P3) | mobile | S | NS-44 built | no |
| IN-06 | 2 | Asha seeded book generator H2 | qa | M | none | no |
| IN-07 | 2 | Weekly read-out template and support tally sheet | product | S | decision-science file | no |
| IN-08 | 3 | `system.*` events dark, MetricKit class-only reader | mobile | M | IN-01 | no |
| IN-09 | 3 | Server aggregate view for Plus and release health, k at least 10 | data-architect | M | IN-01 | migration is founder-only |
| IN-10 | 4 | Website page counter | web | S | CPO ruling on FR-MKT-34 | host choice |

## 9. For the CPO: decisions and risks

1. FR-MKT-34 forbids any website tracker through launch. Default: none; revisit after 1.0 with Umami. A Proposed change would need erratum E83.
2. Does "free and open source only" cover Supabase free plan and Vercel Hobby, which are free tiers of paid products and already our stack? Default: yes, they stay (they exist today); no new paid tier or hosted analytics.
3. Self-hosting PostHog, GlitchTip or Umami needs a server we do not have. Default: no new server; events go to Supabase Postgres, reporting is SQL.
4. Accessibility and language states stay unmeasured until counsel clears them. Default: unmeasured.
5. The existing catalogue stores raw `letters_kept`; the standard needs bands. Default: bands, old names deprecated.
6. Risk: Plus conversion cannot be read in 1.0 beyond ASC; with a 15 to 25 family beta no effect can be claimed (FR-DAT-42 reasoning). The read-out must say "x of n".
7. Risk: a fatal JS error message can reach Apple crash reports (open finding, ops). No Sentry mitigation is available under the free rule.
8. Risk: ASC's coverage (opted-in users only; offer-code separation) is UNVERIFIED; the founder should read it once.
