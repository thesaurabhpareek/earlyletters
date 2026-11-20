# Instrumentation: classification, retention, consent and deletion (data-steward)

Status: PROPOSED (not merged, not reviewed) | 20 Nov 2026 | Owner: `data-steward` (Claude role, not a lawyer; every legal reading says "counsel must confirm") | Partner PM: PM3 keeping and trust (`docs/product/instrumentation/03-*.md`, not yet on develop when written) | Read beside: `docs/analytics/instrumentation/analytics.md` (schema, allowlist), `.../ops.md` (crash, logs), `.../data-architect.md` (where data lives), `.../decision-science.md` (metric tree). I read none of those four before writing this; where I depend on them I say so.

Base: develop at `3e16f6a`. Docs only. Nothing here changes a locked statement, a legal text, a migration or `packages/analytics`. Changes to locked text are in "Proposed change" boxes naming erratum E83 (next free, CL-158).

## 0. Ground truth and what I did not check

Read this session: `docs/analytics/TRACKING_PLAN.md` (450 lines, Draft 2), `packages/analytics/src/{schema,consent,validate,posthog}.ts` and the head of `catalog.ts` (`SCHEMA_VERSION = 8`, line 212), `supabase/functions/analytics-forget/handler.ts`, `docs/legal/DATA_CLASSIFICATION.md` 4.7 and 4.8, `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-033 and 062, `docs/legal/app-store-privacy-labels.md` rows for Usage Data and Diagnostics, `docs/legal/privacy-policy.md` lines 24 and 45, `docs/engineering/07-privacy-engineering.md` PRIV-R01 to R21, `docs/product/prd/functions/data-and-measurement.md` (FR-DAT-01 to 44), `privacy.md` and `cultural-background-data.md` analytics rows, `messaging-and-entry-points.md` Q-MSG-8, `readiness-20nov/performance/OBSERVABILITY-WITHOUT-CONTENT.md`, `libraries/ADOPTION-RULES.md`.

Not read or not run: `COORDINATION.md` section 10 (I use the Shown, Records, Never, Decline shape of FR-DAT-04 and PRIV-R21 instead); `docs/design/IA-FINAL-20nov.md` (not on develop; control and screen id lists are therefore rules here, not lists); no test was run (disk); I did not check production. Test names below are read from files or marked `not yet`.

Facts about `docs/legal/data-map.yaml`: it does not exist on develop (no such file; `DATA_CLASSIFICATION.md` item 7 of its open issues says the same). PRIV-R01 and TRACKING_PLAN 6.1 still point at it. So "data map entries" in section 9 are proposed rows in the shape the file would take.

Outside facts (read 20 Nov 2026): PostHog data deletion page https://posthog.com/docs/privacy/data-deletion ; PostHog LICENSE on GitHub; PostHog self-host page https://posthog.com/docs/self-host ; Sentry LICENSE.md and GlitchTip LICENSE on their repos. PostHog retention settings page returned nothing on retention, so PostHog retention behaviour is UNVERIFIED.

## 1. The programme is dark, and the founder's free-only rule changes the store question

Locked: no event, counter or measurement payload is sent, queued or written for us in any 1.0.x build (FR-DAT-01, D-095, D-124 item 3); label says no usage or diagnostics data; Privacy Policy line 24 says "There are none in any build". Everything below is for the release after 1.0 and is inert until the founder, counsel and a label change say otherwise.

Founder rule (20 Nov, binding): only completely free, open-source tools that fit Expo/React Native, Supabase and Vercel; no paid product or tier.

What this does to the "where do events live" question (a decision for `analytics` and `data-architect`; I give the data consequences):

| Option | Licence and cost (source) | Fits the rule? | Data consequence |
|---|---|---|---|
| PostHog Cloud | Free for 1M events a month (self-host page, 20 Nov) but it is a paid product's free tier | No, by the founder's wording | Processor outside our stack; subprocessor row and DPA needed |
| PostHog self-hosted | Core MIT; `ee/` directory has its own licence whose text I did not read (LICENSE, 20 Nov). Docker Compose deploy is free; "officially unsupported"; minimum "4 vCPU, 16GB RAM, and more than 30GB storage"; "All paid-plan features are Cloud-only" (self-host page) | Software yes. Hosting is not free and neither Supabase nor Vercel runs Docker Compose, so it does not fit the stack | We become the processor of the events; no third-party DPA, but we own retention, deletion, backups and breach duty. A VM is a cost the founder must name |
| Own table in our Supabase Postgres (thin, closed allowlist, SQL reports) | Postgres is open source; Supabase is already our processor | Fits the stack, no new vendor | See below: the "not linked" story changes, and `server_seq`-style ids must not appear |
| Nothing but Apple's own App Store Connect numbers and TestFlight | Free, Apple's collection | Yes | No new processing, label unchanged; this is today's 1.0 posture |

My data-steward default: keep Apple's numbers as the free baseline, and, if the founder wants in-app measurement, prefer the own-table option over a self-hosted VM, because it adds no new processor and no host to secure. Honest cost of that default: a table keyed by a random per-consent id sits next to accounts in the same database. TRACKING_PLAN section 0 promise 4 ("Nothing on any server of ours stores or joins the id") would no longer hold. So the id must never be sent with an auth header, the table lives in its own schema with no foreign key, no grant to `authenticated`, and the label answer returns to counsel (Q7, "Linked or not"). If counsel will not accept that, the fallback is the self-hosted VM, and the cost is the founder's. This is decision FD-1 in section 13.

Crash reports: Sentry's server is under the Functional Source License (FSL-1.1-Apache-2.0), which converts to Apache 2.0 two years after each release (Sentry LICENSE.md, 20 Nov), so it is not an OSI open-source licence today. GlitchTip backend is MIT (its LICENSE, 20 Nov) and speaks the Sentry protocol; it also needs a host. Default free source of crash data: Apple's Organizer and App Store Connect, opt-in by the user's Apple setting (data-and-measurement.md FR-DAT-16). `ops` owns the choice.

## 2. Classification rules for anything an instrument records

1. Every instrument value is L2 (DATA_CLASSIFICATION 1.1 rule 9 and 4.7; `schema.ts` makes L3 and L4 unrepresentable: `type Level = 'L1' | 'L2'`). L2 is necessary, not sufficient.
2. Three shapes only: closed enum, boolean, bounded integer (`schema.ts`). No free string, no list, no object.
3. An id of a person, book, letter, picture, video, moment, day, tradition, prompt, search or reminder is never a value. A screen or control id is a fixed name chosen by us at build time, never read from screen text.
4. A timestamp is data. No event may fire at a time set by a birthday, due date, seal, moment or day (TRACKING_PLAN 6.4; FR-DAT-27, FR-DAT-38). Proposal: the phone sends no clock value and reports use day or week grain (section 3.4).
5. Counts of a person's things (letters, pictures, goals, moments, days ticked) are buckets or absent, never shown to a parent and never next to a name, a language or a date (FR-DAT-03, 36, 38; FR-CUL-09).
6. The only identifier is the random per-consent-period id (consent.ts). It is L2 by our rule and may still be personal data in law (TRACKING_PLAN 10 point 1; counsel must confirm).

## 3. Classification of every instrument

### 3.1 The 68 existing events (catalogue v8)

All 68 events and every property in TRACKING_PLAN 3.1 are L2, purpose product analytics, one random id, no other id. I classified them by group; none changes level. The existing generated table is the property-level source (a test keeps it equal to `catalog.ts`: TRACKING_PLAN header line 4).

| Group (events) | Level | Retention clock | Sensitive-adjacent properties and ruling |
|---|---|---|---|
| app, consent, entry, capture, book, reminders, settings, errors (about 40 events) | L2 | Section 5 | `analytics_opted_in` carries a one-time first-run summary; counsel Q still open (TRACKING_PLAN 8 item 1). Keep gated |
| children (6) | L2 | Section 5 | `child_ordinal` and `child_count_bucket` only; `has_date` is a boolean (PRIV-R04). `goals_set` count only |
| family (6) | L2 | Section 5 | `member_removed`, `member_left`, `family_letter_reviewed` describe a relationship decision. Keep as role and decision enums only. Flag to counsel with section 12 item 6 |
| languages (2) | L2, counsel pending | Section 5 | `lang` allowed on exactly `language_set` and `pack_download` (6.2; Q6 deferred to v1.1). Stays the only exception; not extended (FR-CUL-09) |
| plus (9) | L2 | Section 5 | `plan_changed` and `keep_gate_shown` are plan-state facts; label row Purchases for opt-in plan events (DATA_CLASSIFICATION open issue 9). Counts `letters_kept`, `allowance` are bounded ints; FR-DAT-03 bans showing them, not sending them |
| celebrate (3) | L2 | Section 5 | `moment_shown.type` has stale values (FR-DAT-26); remove before turning on |

Stale entries to remove before any profile turns analytics on are already listed in FR-DAT-26; I add one: the `screen_view.route` enum (29 values, TRACKING_PLAN 3.1) lists `tonight`, `family`, `listen`, which FR-DAT-26 says are gone with the three tabs. The new closed screen list (section 3.2) replaces it.

### 3.2 The basics the founder asked for: screens, taps, impressions, funnels, performance

Standard autocapture-style shapes, through the closed allowlist. Autocapture itself stays off (`REQUIRED_POSTHOG_AUTOCAPTURE` and `posthog.ts:190` set `errorTracking.autocapture: false`; touches "carry labels", posthog.ts comment). We send our own typed events only.

| Class | Proposed event and closed properties | Level | What it must never carry | Source of the closed list |
|---|---|---|---|---|
| Screen view | `screen_view{screen}`; `screen` is one id of the closed IA list | L2 | Route params, letter or book id, title text, query, child name | `docs/design/IA-FINAL-20nov.md` (PR #1033), generated into `catalog.ts`; UNVERIFIED: I did not read it |
| Tap | `control_tap{screen, control}`; `control` is one id from a per-screen closed list | L2 | Label text on the control, the value chosen in a text field, which person or letter was tapped, the tapped row index | Same list; a test fails on a control with no row |
| Impression | `surface_shown{surface, kind}` and `surface_acted{surface, kind, action}`; `surface` from the closed list of slips, cards, sheets, banners, empty states; `action` in (opened, accepted, dismissed, snoozed) | L2 | Which prompt (use `prompt_kind` only: OBSERVABILITY-WITHOUT-CONTENT section 2 item 1 lists "a prompt shown to a person"), which day or tradition, which picture, which moment (FR-DAT-38), the reason a surface was chosen if it derives from L4 | Closed list owned by the PM files |
| Funnel step | No new event: a funnel is a sequence of the events above plus existing ones (`capture_started`, `letter_saved`, `invite_created`, `invite_accepted`, `plus_started_from_gate`). Step order is computed in reports | L2 | A funnel keyed on a person; any cohort of fewer than 10 ids published | `decision-science.md` (not read) |
| Performance | `perf{marker, bucket}`; `marker` from `MEASUREMENT-PLAN.md` section 4 names; `bucket` a duration bucket, never raw milliseconds | L2 | Raw ms joined to an id and a timestamp (a precise duration plus a time can single out a file); media duration, size or count (NS-52-R43 as cited in OBSERVABILITY section 2 item 3) | `MEASUREMENT-PLAN.md` section 4 (not re-read); existing `app_cold_start.ttfi_bucket` is the pattern |
| Error class | Existing `error_shown{code}` and `sync_failed{reason}`; new codes only from closed unions | L2 | `Error.message`, stack text, SQL text, any path (OBSERVABILITY section 3 row "Crash reports from Apple": three throws put a date into their message; open finding, not mine to fix) | Closed unions per module |

Surfaces that get no impression, tap or view event at all, in any version (extends FR-DAT-27, FR-DAT-38, FR-CUL-09): days and tradition cards and the days picker; Photo moments surfaces; sealed-letter surfaces and anything at a seal's opening time; the Find box and results (a query or its length); the child name and date screens beyond a bare screen view; the sensitive-data switch values (religion, ethnicity, region, family background); the safety-tier screens (PRIV-R15); the 18+ gate answers; the lock-screen names setting value; anything that shows or hides a notification body.

Email impressions: "emails sent and opened where allowed". Not allowed. The founder-answered default Q-MSG-8 keeps fonts and the logo off "to preserve 'no request tells us it was opened'" (`messaging-and-entry-points.md` line 258, CL-062), and E75 forbids marketing email. An open pixel would also be a request that tells us. Emails sent is a server count (Resend send logs, L2 counts only); opened is never measured. Reminder impressions (local notification delivered) cannot be observed by a phone that is closed; `reminder_sent` is logged on next foreground (TRACKING_PLAN 3.1) and `notification_opened` only for evening reminders; E79 (no remote push in 1.0) and NS-32 (60 notifications) bind.

### 3.3 Server-side, store-side and support-side measures

| Side | Examples | Level | Rule |
|---|---|---|---|
| Server aggregates (`insights.*`, k = 10) | `weekly_keeping_families` and the rest (TRACKING_PLAN 4) | L2 counts | No cell between 1 and 9; complement rule; not read in 1.0 unless the founder rules (FR-DAT-28, FQ-01) |
| Server logs | `_shared/log` closed events | L2 | `canary.test.ts` (read via OBSERVABILITY section 3); not analytics |
| App Store Connect | Installs, trials, conversions, crashes (opt-in) | Apple's collection | Free; no join to our data |
| Support tally | Four categories (FR-DAT-17) | L2 counts | Counts only, no quotes |

### 3.4 Timestamps and ordering (proposal)

The phone sends no timestamp property. The receiver stamps arrival; reports use day or week grain. Reason: a phone clock value next to a rare event is a quasi-identifier, and the batch queue (flush at most every 60 s, TRACKING_PLAN 5.3) already blurs seconds. If the SDK adds `timestamp` on its own, that is a PostHog-side property to be checked in the staging drill (IN-DS-06). UNVERIFIED for the installed SDK; I read the allowlist (`posthogBeforeSend`, TRACKING_PLAN 3.2), not the SDK source.

## 4. What the identity and its neighbours are

| Thing | Where | Level | Note |
|---|---|---|---|
| Consent state `scribe.analytics.consent` | Phone key-value store | L2 | unknown, granted, denied (consent.ts) |
| Analytics id `scribe.analytics.id` | Phone; sent only to the event store (and to `analytics-forget` at deletion) | L2 by our rule | Fresh random UUID per period; never email, user id, device id or `appAccountToken` |
| Retired ids `scribe.analytics.retired_ids` | Phone only | L2 | At most 20 (`MAX_RETIRED_IDS`); kept only so deletion can reach old events |
| Consent act record | `policy_acceptances`, written by `record_policy_act` | L2 with L3 `profile_id` | PRIV-R06 and R21; context keys `crash`, `usage`, `product` exist already (PRIV-R21 table). It is the one place that links a signed-in person to "said yes to usage". It never holds the analytics id |
| Event store records | Store chosen in FD-1 | L2 each; the set is behaviour under a pseudonym | Counsel must confirm it is personal data; treat it as such for deletion and DSR |
| SDK state | In memory only (`persistence: 'memory'`) | L2 | Nothing on disk |

## 5. Retention (proposed, none is a legal opinion)

| Data | Proposed retention | Basis | Enforced by |
|---|---|---|---|
| Raw events | 12 months, then deleted | data-policy.md 156 and 201 say "12 months (proposed; set in project settings)"; DATA-REQ-062 says set and recorded in the runbook; COUNSEL_PACKET Q51 owns retention | `not yet: IN-DS-04` (a scheduled delete or store setting plus a runbook screenshot) |
| Reports and read-outs (counts, k = 10) | Kept; they hold no id | FR-DAT-08, FR-DAT-35 | review |
| Retired ids on the phone | Until account deletion or Erase everything, at most 20 | consent.ts, DATA_CLASSIFICATION 726 to 731 | `packages/analytics/test/analytics.test.ts` (named in TRACKING_PLAN; I did not run it) |
| Consent act records | Life of the account, then pseudonymised and kept 3 years (counsel confirms Q41 e) | PRIV-R21 | existing, outside this file |
| Event-store backups | Whatever the store keeps; PostHog says deleted data "stays in existing backups until those backups expire" (about two weeks for events; about 12 months for app data; deletion page, 20 Nov) | PostHog page | The deletion promise must say "within about 2 months", see section 7 |
| PostHog retention clean-up | Runs monthly, so expired events can persist up to about two months past the period (same page) | PostHog page | Same |

Rule DS-R01 (MUST): the retention number published in the Privacy Policy is the number in the runbook and in the store setting; a release gate compares them (IN-DS-04). Enforcement today: none; `not yet: IN-DS-04`.

## 6. Consent states, the ask, and what withdrawal does

States (consent.ts `ConsentStatus`): `unknown`, `granted`, `denied`. Locked behaviour I do not change: before a choice, `track()` returns `dropped_no_consent`, no queue, no disk, SDK not loaded (TRACKING_PLAN 7); the sheet appears only after the first saved letter, never the same session, at most two offers (`MAX_ANALYTICS_CONSENT_OFFERS = 2`, consent-timing.ts); never during recording, review or export; declining changes nothing about features (Consent cost guardrail, TRACKING_PLAN 1.3).

The consent record, in the shape PRIV-R21 and FR-DAT-04 use (wording is the founder's and counsel's; this is the data side only):

- **Shown:** the consent sheet text in fixed words with its version and `rendered_sha256`, naming what is counted (taps, screens, how long things take, crashes) and what is not (words, voice, names, pictures, dates). Exact words: the founder's.
- **Records:** on the phone, `scribe.analytics.consent` and the random id. On the server, one `policy_acceptances` row through `record_policy_act` with document `analytics`, version, action, method, surface, `rendered_sha256`, and `context.usage` (and `context.crash` if crash is separate) (PRIV-R06, R21). Nothing links that row to the analytics id.
- **Never:** the analytics id in the consent row; an IP address, user agent or device model; a hash of text with a child's name; any join to `auth.sessions`; collecting before the yes (PRIV-R21 "Never" list; PRIV-R05).
- **Decline and withdraw:** Decline stores `denied`, nothing is sent, every feature works, and the sheet is not asked more than twice. Withdraw in Settings, Privacy stops sending within the session, clears the queue and the SDK's, retires the id, and a later yes gets a different id so the periods cannot be joined (TRACKING_PLAN 7). Withdraw never gates export, deletion or any feature (PRIV-R09).

Per-switch granularity: one switch covers usage and crash today ("Crash reports follow the same switch", TRACKING_PLAN 7; PRIV-R05). Default kept. See FD-3.

Withdrawal gap (contradicts the spirit of "withdraw", not a locked statement): withdrawing stops new events, but events already sent stay until the retention period ends, and a person with no account has no route to delete them (section 7, finding F-1). Proposed change below.

> **Proposed change (E83, privacy + data-architect):** add to the locked analytics promise "Turn it off and we also delete what we already hold under your number." Requires: `analytics-forget` to accept a new reason `withdrawal` and to run for a signed-out or anonymous caller with a tighter rate limit (today it needs a real, non-anonymous session and only the reasons `account_deletion` and `device_after_deletion`, handler.ts lines 37 and 141). This changes legal text; the founder's and counsel's.

## 7. Deletion: analytics-forget, and where it is thinner than the promise

What exists (read): the phone sends up to 21 ids (`MAX_IDS = 21`; 20 retired plus the current one) to `analytics-forget`; the function checks a signed-in non-anonymous user, spends a per-person daily quota of 5 (`DAILY_CALLS`, table `ops.forget_quota`, counts only), then calls PostHog `persons/bulk_delete` with `delete_events: true` and returns 202. It stores and logs no id (handler.ts header and lines 160 to 172). The deletion spec says the ids are sent at request time and are not restored on cancel (DELETION spec lines 209 and 288; receipt `posthog: at_request`).

Findings (each a gap to file; none edits a locked rule):

- **F-1 No deletion route without an account.** Section 6. Default: add `withdrawal` reason; IN-DS-02.
- **F-2 Person profile may not exist.** PostHog says events without a person profile cannot be removed by person deletion; you must first send a `$set` event to create a profile (deletion page, 20 Nov). Our options are `personProfiles: 'identified_only'` with the id bootstrapped as `isIdentifiedId: true` and no `$identify` (posthog.ts lines 180 and 264, TRACKING_PLAN 7). Whether PostHog then creates a person is UNVERIFIED. Until a staging drill proves a deleted id leaves no events, the deletion promise has no proof. IN-DS-06 is the drill (QA, with a throwaway project, Asha data only).
- **F-3 Bulk delete fails quietly.** PostHog answers 202 and failures appear in `deletion_errors` while the status is not an error (deletion page, 20 Nov). handler.ts treats 200, 202 and 204 as success and discards the body (lines 165 and 170). A silent miss would still show `posthog: at_request` on the receipt. Default: read `persons_queued_for_deletion` and `deletion_errors`, log a count only, and retry (IN-DS-03). A rule that does not match the code is a bug: DATA-REQ-033 should say "accepted", not "deleted".
- **F-4 Latency.** Events delete asynchronously off-peak with a cutoff two days before the batch (deletion page). The user-facing sentence must say "within about a month" not "now" (copy is the founder's; the `delete-account-page.md` says 14 days for processors, DELETION spec line 89, which this contradicts for this processor; counsel to reconcile).
- **F-5 Retired-id cap.** `MAX_RETIRED_IDS = 20` silently drops the oldest id; a person who toggles 21 times leaves one period undeletable. Low risk; default: when the cap would drop an id, call forget for it first (IN-DS-03).
- **F-6 Own-table option.** If FD-1 picks our Postgres table, deletion is `DELETE ... WHERE analytics_id = ANY(...)` in a definer function with a pinned `search_path` and no logging of the ids; the spec gains a `store: at_request, verified` receipt because we can check it (DB-R15 style). That is stronger than PostHog's 202.

DSR (access, correction, deletion, portability): we cannot look a person up. The store holds only a random id and the phone holds the id. So: deletion is served by the phone (Settings, Privacy, "Delete what we hold about how you use the app", proposed; or section 6 withdrawal) and by account deletion; access and portability are served by returning the person's own events by id only if the phone proves possession of the id, which is more machinery than the value. Default: state in the policy that usage data under a random number cannot be matched to a person by us, offer deletion from the phone, and have counsel confirm that suffices (ccpa/gdpr readings are counsel's). Support never asks a person for their id.

## 8. What the no-content proof is

A claim without a passing proof is rewritten before release (PRIV-R17). Layers, with what exists today (read, not run) and what does not:

| # | Proof | Exists today | Id |
|---|---|---|---|
| 1 | Types: `track()` is typed from the catalogue; no free string type exists | `schema.ts` | enforced |
| 2 | Runtime validator fails closed: unknown event dropped, unknown property stripped, string over 40 chars, PII-like or non-snake-case drops the event, reports never include values | `validate.ts` (read); `catalog.test.ts`, `allowlist-pins.test.ts` named in TRACKING_PLAN 6.3 and PRIV-R11 | enforced (I did not run) |
| 3 | SDK payload re-check: `posthogBeforeSend` allowlist, `$set` stripped, required options pinned | `posthog.ts`; `posthog.test.ts` | enforced |
| 4 | Catalogue and plan equal | TRACKING_PLAN header | enforced |
| 5 | Off in every 1.0.x profile | `eas.json` has `EXPO_PUBLIC_ANALYTICS: "off"` in all profiles (5 hits, 20 Nov); FR-DAT-01 asks for a test | `not yet: test`; FR-PRV-31 names `preflight-production.mjs` |
| 6 | Deny-list of property and event names for forbidden classes (media, moment, find, seal, day, tradition, language next to a letter) | named as needed in FR-DAT-36, FR-CUL-09 | `not yet: IN-DS-05` |
| 7 | Control and screen ids exist in the generated closed list, and no id is built from a string at run time (lint: argument of `track` must be a literal or const of the union) | not built | `not yet: IN-DS-05` |
| 8 | Canary through the real path: seed an Asha canary into every free-text input, drive `track()` and the screen and tap hooks, assert none reaches the payload, the queue, the fault log or the network call | OBSERVABILITY R4 proposes `apps/mobile/test/canary.test.ts`; server half exists (`canary.test.ts` for `_shared/log`) | `not yet: OBS-R10 device half` |
| 9 | Egress: with consent denied or flag off, a fetch spy sees zero calls to any analytics host; with a yes, only the one host | not built | `not yet: IN-DS-05` |
| 10 | Store-side invariant query: the event store holds no property outside the catalogue and no string over 40 chars (a nightly check on the store) | not built | `not yet: IN-DS-07` (owner `ops`) |
| 11 | Import boundary: moment, picker, days and Find modules cannot import the analytics client | FR-DAT-37 asks, A5 item 2 | `not yet: IN-DS-05` |

DS-R02 (MUST NOT): ship an event, a screen id, a control id or a surface id without its row in the generated catalogue, its data-map row and its requirement id in the same PR (PRIV-R01, TRACKING_PLAN 6.5). Enforced by: layer 4 for the catalogue half; the data-map half is `not yet` because `data-map.yaml` does not exist (IN-DS-01).

## 9. Data map entries (proposed rows; the file does not exist)

Shape follows the fields PRIV-R01 requires (level, purpose, retention, deletion path) and the TRACKING_PLAN 6.1 wording (disclosure "Usage Data, Diagnostics; not tracking").

| Entry | Store | Level | Purpose | Retention | Deletion path | Disclosure |
|---|---|---|---|---|---|---|
| `analytics.consent` | phone | L2 | remember the choice | until Erase | Erase everything | none leaves phone |
| `analytics.id`, `analytics.retired_ids` | phone | L2 | pseudonymous period id; deletion | period; retired kept at most 20 | forget call then local clear | sent to event store only |
| `analytics.event.*` (68 plus section 3.2 classes) | event store (FD-1: PostHog Cloud free, founder 20 Nov) | L2 per property | product analytics | 12 months (proposed) | forget by id; retention job; limits F-1 to F-5 of section 7 apply | Usage Data; Diagnostics for error and perf classes |
| `analytics.event.sdk_fields` | event store | L2 | which app build and phone software made an event | same | same | Five SDK fields kept at source, by name: `$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type`. Together with a long-lived random id they are a fingerprinting surface; accepted, and listed so the label and policy name them |
| `analytics.screen`, `.control`, `.surface`, `.marker` | event store | L2 enum | usage and speed | same | same | same |
| `policy_acceptances` (analytics act) | Supabase | L2 plus L3 `profile_id` | consent record | account life plus 3 years pseudonymised | account deletion pseudonymises | already inventoried |
| `ops.forget_quota` | Supabase | L3 (per person) | rate limit | per day | account deletion | already inventoried |
| Event-store processor or host | (FD-1) | n/a | processing | n/a | n/a | `subprocessors.md` row (PRIV-R12); none today |

## 10. Privacy label and legal text impact (founder merges legal files)

Today (read): label rows Usage Data and Diagnostics are "No (changed in 1.4.0)" with the reason "No analytics SDK in any current build (D-095, D-124)"; label checklist line 123 says to re-run section 3 if an SDK is constructed; line 85 says a v1.1 build with opt-in analytics adds Usage Data and Diagnostics for Analytics and the Linked question returns (Q7). Privacy Policy line 24 "There are none in any build" and line 45 "In no current build does the app send us usage analytics or crash reports". `subprocessors.md` has no PostHog or Sentry row (listing read: Supabase, Cloudflare R2, Resend, Vercel).

When this goes live, in the same PR (PRIV-R12, R18): label rows Usage Data (Product Interaction, Other Usage Data) and Diagnostics (Performance Data, Crash Data if crash is on) change to collected for Analytics; Linked or Not linked is counsel's (TRACKING_PLAN 10: Apple treats personal data under privacy laws as linked, so a persistent pseudonym may need "Linked"); "Data Used to Track You" stays empty (no ads, no ATT, no data broker; PRIV-R13); `PrivacyInfo.xcprivacy` is re-run (PRIV-R18); the Privacy Policy lines 24 and 45, the deletion page and `app-store-privacy-labels.md` change; a subprocessor row is added if FD-1 uses an outside host; `scripts/release/label-effect.mjs` guard (`TRACKING_SDK` list, ADOPTION-RULES 2 item 5) is the CI check and must be taught the chosen SDK deliberately. The 30-day notice rule (subprocessors.md section 5 step 4) applies to content-handling vendors only; this one handles no content.

Self-hosted or own-table store changes none of these obligations; it removes a third-party processor row and adds our own duties.

## 11. Pre-conditions before anything turns on

Counsel and privacy (counsel must confirm each; I do not decide a level or a legal answer):
1. Q6 (language code in analytics) and Q7 (Linked or not), deferred to v1.1 by D-095.
2. Whether the random per-consent id with behaviour is personal data and what de-identification statement we make.
3. The `analytics_opted_in` first-run summary (TRACKING_PLAN 8 item 1).
4. Retention number (Q51) and the deletion timing sentence (F-4).
5. Whether screen and tap events about the family and sensitive-data screens (`settings_privacy`, family settings) are acceptable at all; my default is bare screen view only for those.
6. Whether relationship events (`member_removed`, `member_left`) stay.
7. Whether withdrawal-deletion (E83 box) is promised.

Engineering gates: IN-DS-01 to 07 below; FR-DAT-26 clean-up of stale values; FR-DAT-01 test in place; the staging deletion drill passes.

## 12. Contradictions and drift I found

1. Founder's "emails opened" versus Q-MSG-8 and E75: opens are not measured (section 3.2).
2. Founder's "autocapture-style" versus `posthog.ts` autocapture off and TRACKING_PLAN 3.1 ("never by SDK autocapture"): we send typed events of the same shape, not SDK autocapture. No conflict if read that way.
3. TRACKING_PLAN section 0 promise 4 ("nothing on any server of ours stores or joins the id") fails under the own-table option (section 1).
4. DELETION spec line 89 "complete within 14 days" versus PostHog's asynchronous deletion with a two-day cutoff and about two-week event backups (section 7 F-4).
5. DATA-REQ-033 and the receipt `posthog: at_request` describe acceptance as deletion (F-3).
6. TRACKING_PLAN `screen_view.route` enum lists tabs that the locked IA removed (section 3.1).
7. TRACKING_PLAN names a no-longer-built `data-map.yaml`; BL-016 appears in a "Superseded or deferred" list at `docs/BACKLOG.md:51` while also existing as its own row at line 193. My reading of which wins is UNVERIFIED.
8. Nothing here contradicts a locked statement; the E83 box in section 6 is a proposal to add to one.

## 13. Founder and counsel decisions (each with a default)

| Id | Decision | Default |
|---|---|---|
| FD-1 | Where in-app events live under the free-only rule: own Supabase table, self-hosted PostHog on a VM the founder pays for, or nothing beyond Apple's numbers | DECIDED 20 Nov 2026 by the founder: PostHog Cloud free tier, for product analytics and crash reporting (settings and rules: `posthog-standard.md`). Open: counsel on "Linked", subprocessor row, label |
| FD-2 | Retention for raw events | 12 months |
| FD-3 | One consent switch for usage and crash, or two | One |
| FD-4 | Withdrawal also deletes (E83 box) | Yes, if counsel agrees |
| FD-5 | Do the family, sensitive-data and privacy screens get anything beyond a bare screen view | No |
| FD-6 | Email open tracking | Never (Q-MSG-8) |
| FD-7 | Who may read raw events (not just reports) | Founder only, through a named runbook with an audit row (FR-DAT-28, FR-DAT-35) |
| CC-1 | Counsel items in section 11 | As listed |

## 14. Risks

1. Deletion has no proof yet (F-2, F-3); the promise could be false while every test passes. Mitigation: IN-DS-06 before launch.
2. Own-table option puts a pseudonymous behaviour log in the same database as accounts; a bad grant or a join would link them. Mitigation: own schema, no foreign key, grants test (CLAUDE.md "grants.mjs"), `data-architect` owns.
3. Closed id lists drift from the design (a screen added with no id). Mitigation: generated list and test (IN-DS-05).
4. Small tester base: a rare event next to a bucket may identify one family. Mitigation: publish no cell under 10; no raw read access (FD-7).
5. Self-host would need patching and backups by a one-person team; PostHog warns it is unsupported (self-host page).
6. I could not read the four partner files; their choices may change section 3.2 names.

## 15. Proposed implementation backlog (working ids; product assigns real BL ids)

All dark: compiled, tested, inert; no profile turns it on.

| Id | Wave | Row | Owner role | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-DS-01 | 1 | Create `docs/legal/data-map.yaml` with the section 9 rows and a test that every catalogue property has a row (closes `not yet` in PRIV-R01) | privacy + data-steward | M | none | no |
| IN-DS-05 | 1 | Closed screen, control, surface and marker lists generated into `catalog.ts`; deny-list test; literal-argument lint; egress spy test; import-boundary test (layers 6, 7, 9, 11) | analytics | L | analytics.md; IA-FINAL on develop | no |
| IN-DS-06 | 1 | Staging deletion drill on a throwaway project: send events under a bootstrapped id, call forget, prove zero events remain (F-2); repeat for own table | qa | S | FD-1 | no |
| IN-DS-03 | 2 | `analytics-forget`: read `persons_queued_for_deletion` and `deletion_errors`, log counts only, retry; forget the oldest id before dropping it (F-3, F-5) | sync or data-architect | S | IN-DS-06 | no |
| IN-DS-02 | 2 | `withdrawal` reason and signed-out path with a tight rate limit; Settings line "Delete what we hold about how you use the app" | mobile + data-architect | M | FD-4, E83, counsel | yes (legal text) |
| IN-DS-04 | 2 | Retention job or store setting plus runbook; release gate comparing the published number to the setting | ops | S | FD-1, FD-2 | yes (policy number) |
| IN-DS-07 | 3 | Nightly store-side invariant: no property outside the catalogue, no string over 40 chars, no id shaped value | ops | S | FD-1 | no |
| IN-DS-08 | 3 | FR-DAT-01 build test (any 1.0.x profile with analytics on fails) and label-effect guard taught the chosen store | platform | S | none | no |
| IN-DS-09 | 3 | Label, Privacy Policy, deletion page, subprocessors row and `PrivacyInfo.xcprivacy` update ready as a draft PR for the founder to merge on the go-live day | privacy | M | counsel items | yes |

## For the CPO: decisions and risks

1. Decide FD-1 (where events live) with the free-only rule in view: only the own-table path is both free and in our stack, and it costs us the "never stored on our servers" sentence. Default: Apple's numbers now, own table later after counsel's Q7 answer.
2. Decide whether withdrawal should also delete (FD-4). Default yes; it needs a legal text change and a function change.
3. Risk: today's deletion cannot be shown to work (F-2, F-3). Nothing turns on until the drill passes.
4. Risk: no marketing or open-tracking by email, as locked (Q-MSG-8, E75); the founder's "emails opened" wish is declined by default.
5. Decide FD-5: bare screen views only for the family, sensitive-data and privacy screens. Default yes.

Signed: data-steward
