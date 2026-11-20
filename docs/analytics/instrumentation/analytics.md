# Analytics: open-source stack, event schema and allowlist for instrumentation

Status: PROPOSED, 20 Nov 2026. Author: `analytics` (data partner of PM1: capture and first run; PM1 file `docs/product/instrumentation/01-*.md`, not read yet, UNVERIFIED). Docs only. Read first: `00-event-standard.md` (the standard this file applies). Tags: [V] read this session, [U] unverified, [E] estimate with basis, Rec = my recommendation.

Binding rules: analytics is OFF through 1.0.x (D-095, D-124 item 3, FR-DAT-01 [V]); this builds DARK for the release after 1.0. Founder rule 20 Nov: only completely free, open-source tools that fit Expo/React Native, Supabase and Vercel; no paid products or tiers; self-host or a documented free tier, limits sourced or marked [U]. Adoption rules: `docs/engineering/readiness-20nov/libraries/ADOPTION-RULES.md` [V]. Any new dependency is the founder's (package.json is founder-only): listed in section 9, none added.

## 1. Decision in one paragraph

Keep what is built: the typed allowlist, consent gate, validators and the PostHog adapter in `packages/analytics` (68 events, `posthog-react-native` already wired and verified against 4.78.4 [V `posthog.ts`, README]). Adopt PostHog for capture, funnels, retention and dashboards, on its documented free cloud tier. Build nothing else: no own dashboard, no own pipeline, no own crash tool. Add the basics (screen, tap, impression, perf) as registry rows generated from one id list, so the team gets the founder's five basics by adding rows and a thin hook, not a new system.

## 2. Open-source and free options checked

Data column: what the tool would hold. All sources read this session unless marked.

| Need | Option | Licence | Self-host | Cost | Would hold | Verdict |
|---|---|---|---|---|---|---|
| Events, funnels, retention, cohorts, dashboards | PostHog (cloud, free tier) | MIT except the `ee` directory, which has its own licence [V github.com/PostHog/posthog] | not needed | free tier: 1M product-analytics events a month, no credit card, "not a trial" [V posthog.com/pricing]; retention on the free tier [U] | allowlisted events under a random id (section 6) | ADOPT |
| Same | PostHog self-host (hobby Docker) | as above | yes; "approximately 100k events per month" scale, 4 GB memory recommended, no support [V github] | software free, but needs a server we do not have: Vercel and Supabase cannot run it (Rec, from the stack; [U] a free host exists) | same | REJECT for now: not free in practice. Revisit only if the founder has a machine and wants no third-party processor |
| Same | Plausible, Umami, Matomo | [U] not read | [U] | [U] | web-style pageviews; no mobile funnel model assumed | NOT CHECKED, not needed |
| SDK in the app | `posthog-react-native` | licence of the package [U, github page blocked for me]; ADOPTION-RULES gate: MIT, Apache, BSD or ISC (SEC-R07) | n/a | free | nothing until `optIn()` | KEEP (already a dependency; confirm the licence in the adoption record) |
| Reporting on our own tables (server aggregates) | Supabase SQL and its dashboard | Supabase free plan: 500 MB database, 500,000 Edge Function invocations, 5 GB egress, 50,000 MAU, paused after 1 week of inactivity, 2 active projects [V supabase.com/pricing] | n/a | free | `insights` views, k = 10 (TRACKING_PLAN 4) | ADOPT (exists) |
| BI over Postgres | Metabase OSS | AGPL-3.0 [V]; ADOPTION-RULES treats AGPL as non-permissive: founder with counsel | yes, needs a server | software free, host not free [U] | read access to `insights` views | REJECT: licence gate and no free host. `data-architect` owns the reporting decision |
| BI over Postgres | Apache Superset | Apache-2.0 [V] | yes, needs a server; Postgres via SQLAlchemy "should work", page does not confirm [V partial] | host not free [U] | same | REJECT for now, same reason |
| Server traces, metrics | OpenTelemetry | Apache-2.0 [U not read] | n/a | n/a | spans and counters | Not mine. `ops` decides; nothing in this file emits to it |
| Crash reports | Sentry cloud Developer plan | SDK licence [U] | n/a | 5k errors, 1 user, 30-day lookback; card not stated [V sentry.io/pricing] | stack traces: content risk, see OBSERVABILITY-WITHOUT-CONTENT section 3 | `ops` owns. I only require the same consent switch (TRACKING_PLAN 7) |
| Crash reports | Sentry self-hosted | "fair-source", not a standard open-source licence [V partial: repo topic, LICENSE not read] | yes, heavy [U] | host not free | same | REJECT on licence unless founder rules |
| Crash reports | GlitchTip | open source, licence name not shown [V partial] | yes | hosted free plan 1,000 events a month, 30-day retention, Sentry-SDK compatible [V glitchtip.com] | same | `ops` to evaluate |
| Drift | Evidently | [U not read] | n/a | n/a | n/a | Not needed: simple SQL on `insights` views is enough at our volume (Rec) |

Honest limits: the free PostHog tier is a third-party processor (subprocessor row, data-map row, label change: founder and counsel, ADOPTION-RULES section 2 item 5). What happens if volume passes 1M a month with no card on file, and which regions the free tier offers, I did not verify [U]. Rec: never add a card, so overage cannot bill (inference from "only add a card if you exceed", pricing page).

## 3. What we build, what we adopt

| Layer | Adopt (PostHog, free) | Build (thin, ours) |
|---|---|---|
| Capture transport, batching | `posthog-react-native` | none |
| Funnels, retention, cohorts, dashboards | PostHog insights | none (queries are saved in PostHog; section 8 lists the first five) |
| Closed allowlist, registry, id list | none sells this | `catalog.ts`, new `ids.ts` |
| Consent gate, random id | none | `consent.ts` (built) |
| Content-free validators and tests | none | `validate.ts`, V1 to V16 |
| Screen, tap, impression hooks | PostHog autocapture is OFF and stays off (`captureScreens: false`, `captureTouches: false`, `posthog.ts` [V]): its screen names carry params and its touches carry labels | one router hook (exists for `screen_view`), one `useImpression(element_id)` hook and one `tap(control_id)` helper, each taking a registered id and sending a registered name |
| Server aggregates | Supabase views | none new |

How the standard's basics map to PostHog's autocapture shapes: same ideas (screen, touch, impression), but sent through our typed helpers so every id is on the list. This is the whole of "how little we build": three helpers and an id list.

## 4. Event schema convention

Defined in `00-event-standard.md`: three-segment dotted names, closed areas and actions, fixed basics names, `f_<area>_<goal>` funnel ids, closed typed properties, per-event `v`, one registry row per event. This file adds only what is specific to the stack.

- PostHog event names are free strings; dots are allowed; `$` is reserved [U for dots, not verified in the PostHog docs]. The standard bans `$` and relies on dots. If PostHog mishandles dots in a name, the fallback is an underscore join in the adapter only; the registry name stays dotted.
- Property keys are the registry names; the SDK's own `$` fields are cut to five at source and by `before_send` (`posthogBeforeSend`, TRACKING_PLAN 3.2 [V]).

## 5. Typed allowlist design

- `schema.ts` keeps three value shapes: enum, bool, bounded int [V]. No string type exists, so a content-shaped value cannot be typed in.
- `catalog.ts` `EVENTS` is the registry. Add: `v`, `side`, `owner`, `consent_gate`, `status`, `funnels` (section 7 of the standard). Generated doc `registry.md` replaces hand edits (the `plan-doc.ts` pattern [V]).
- `ids.ts` (new, about 150 lines): `SCREEN_IDS`, `CONTROL_IDS`, `ELEMENT_IDS`, `PERF_METRICS`, each row with area and IA-FINAL id. The basics events are generated from it: `screen.<id>.viewed` for every screen id, and so on, so adding a control is one line in one file and one generated doc diff.
- Helpers: `trackScreen(id)`, `tap(id)`, `impress(id, {rank})`, `perf(metric, ms)`; typed so only ids on the lists compile. Domain events keep their typed trackers (`trackers.ts`).
- Fail-closed validation is the existing `sanitizeEvent` plus `sanitizeOutgoing` on the SDK `before_send` (unknown event: drop; unknown property: strip; missing or wrong required property: drop; PII-like or over 40 characters: drop) [V `validate.ts`].

## 6. Buckets, identity, versioning, consent

- Buckets: existing sets in `catalog.ts` and `buckets.ts`; new shared `ms_bucket` and `build_kind` (standard section 6). Raw numbers never leave `buckets.ts`.
- Identity: no person id. Random id at consent, retired on withdrawal, new id after a later yes, so periods cannot be joined; SDK `persistence: 'memory'`, `personProfiles: 'identified_only'`, `disableGeoip: true`, flush on our timer [V `posthog.ts`, `consent.ts`]. Session replay, surveys, remote flags, error autocapture stay off.
- Versioning: per event `v` (standard section 8); today `schema_version` is one catalogue-wide number (currently 5) pinned by a fingerprint test [V TRACKING_PLAN 3.2].
- Consent: nothing before a choice; `track()` returns `dropped_no_consent`; SDK not loaded; sheet only after the first saved letter (`analyticsConsentDue`) [V TRACKING_PLAN 7]. Wording and timing changes go to `privacy` and the founder.
- Sampling: unchanged (TRACKING_PLAN 5.3), now including basics: `ui.*.impressed` and `screen.*.viewed` sampled first.

## 7. How PM events map to the catalogue

1. A PM file names events by name only (standard section 9). PM1's capture and first-run events are rows in the registry.
2. For each PM row the analytics agent checks: name passes V1 to V3, ids exist (V4), properties are the three shapes (V6), nothing on the V7 pattern list, funnel steps exist (V9). A PM file that needs something outside this gets a Proposed change box with erratum E83 (CL-158).
3. Existing catalogue events keep their meaning but are renamed once, under the standard, in a single PR. Rule: `<area>.<object>.<action>`; examples (full table is backlog row IN-03): `letter_saved` to `capture.letter.saved`; `capture_started` to `capture.take.started`; `invite_created` to `family.invite.sent`; `plus_offer_viewed` to `plus.offer.shown`; `export_completed` to `keeping.export.completed`; `error_shown` to `system.error.shown`; `screen_view` (route enum) to the 29 generated `screen.<id>.viewed` events. A rename is a new event with the old one `deprecated` (standard section 8); nothing was ever sent in 1.0.x, so there is no history to protect and old rows can be deleted at once (Rec; confirm no tester data exists, FR-DAT-01 says none).

## 8. First funnels, impression-to-click, performance (the founder's basics)

| Basic | What ships | Report (PostHog, free) |
|---|---|---|
| Screen view | `screen.<id>.viewed`, one per route and sheet | Trends by event, grouped by `from_screen` |
| Tap | `ui.<control_id>.tapped` for every registered control | Trends |
| Impression to click | `ui.<id>.impressed` and `ui.<id>.tapped` on the same id | Funnel of two steps per element; rate = tapped over impressed, same period |
| Funnel | `f_onboarding_first_letter`, `f_capture_letter_saved`, `f_family_invite_joined`, `f_plus_trial_paid`, `f_keeping_copy_saved` | Funnel insights, step drop-off; windows `session, d1, d7, d30` |
| Performance | `perf.<metric>.measured` with `ms_bucket`; crash-free sessions and error classes from the crash tool and Apple (MEASUREMENT-PLAN section 4: markers stay on the founder's Mac in 1.0) | Trends of bucket shares; p95 from buckets only |

Volume [E]: TRACKING_PLAN 5.1 gives about 190 events a month per active consenting parent [V]. Taps (about 60) and impressions (about 50) are my guess, no baseline: total about 300. At 1k families (about 800 consenting) that is about 240k a month, under the 1M free tier; at 100k families it is about 24M, so sampling and the founder's cost decision (PRD section 9 question 8) apply, not a quote from me.

Not measured, by design: any text on screen, any list row identity, time spent per letter, who tapped (no person), recordings, pictures, scroll depth inside a letter.

## 9. Migration plan from `packages/analytics` (all proposed; implementation is a later phase)

| Step | Change | Files | Dependency |
|---|---|---|---|
| M1 | Add registry fields and `ids.ts`; generate `registry.md` | `catalog.ts`, `schema.ts`, `plan-doc.ts` | none |
| M2 | Per-event `v` on the wire; keep the fingerprint test | `client.ts`, `catalog.ts` | none |
| M3 | Rename catalogue under the standard; screen_view to generated screen events | `catalog.ts`, `routes.ts`, `trackers.ts`, `observe.ts`, TRACKING_PLAN | none |
| M4 | Validators V1 to V10 as tests; extend canary V14 to basics | `packages/analytics/test` | none |
| M5 | Hooks `tap`, `impress`, `perf`; wire in `apps/mobile/src/lib/analytics` | mobile | none |
| M6 | Build-profile test: `EXPO_PUBLIC_ANALYTICS` off in every 1.0.x profile (FR-DAT-01) | existing | none |

New dependencies proposed: none. `posthog-react-native` already present. Any crash SDK is `ops` and `pair` mode with the founder, not mine (my charter: never add an SDK).

## 10. Backlog rows (working ids, product assigns BL ids)

| Id | Wave | Row | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-01 | 1 | Event standard review and merge (this file set) | analytics, CPO | S | none | no |
| IN-02 | 1 | `ids.ts` and generated registry doc (M1, M2) | analytics engineer | M | IN-01 | no |
| IN-03 | 1 | Rename catalogue and full rename table (M3) | analytics engineer | M | IN-02 | no |
| IN-04 | 1 | Validators V1 to V16 as tests (M4) | analytics engineer | M | IN-02 | no |
| IN-05 | 2 | Hooks and screen wiring (M5), 29 routes first | mobile | M | IN-03 | no |
| IN-06 | 2 | Controls and elements wiring per area from PM tables | mobile, pairs | L | IN-05 | no |
| IN-07 | 2 | Five funnels saved in PostHog; weekly read-out inputs | analytics, decision-science | S | IN-05 | account creation: yes |
| IN-08 | 3 | Turn on for a consenting cohort (release after 1.0) | founder | S | IN-04, label, counsel | yes |

## 11. Founder and counsel decisions

| Decision | Default |
|---|---|
| Use PostHog cloud free tier, as third-party processor, when analytics returns (subprocessor, data map, label) | Yes, no card ever on file; counsel confirms; EU or US region [U which are free] |
| Ids in event names (standard section 12 Proposed change, E83) | Follow the founder's baseline |
| Self-host PostHog or a BI tool | No (no free host, AGPL for Metabase) unless the founder supplies a machine |
| AGPL tools (Metabase) | Not adopted without counsel |
| Crash tool | `ops` proposes; not decided here |

## 12. Risks

1. Free-tier terms can change; limits above come from pricing pages read on 20 Nov [V] and are not guaranteed.
2. Event-name cardinality (about 150 basics names) clutters PostHog; cap V16 and the alternative single-event shape cover it.
3. Impression thresholds (half visible for 1 second) are my proposal with no baseline; tune on the founder's phone first.
4. Per-event `v` changes the wire format; harmless while nothing is sent.
5. A content leak through a crash tool is outside this file (OBSERVABILITY-WITHOUT-CONTENT section 3, open finding on date-bearing error messages).
6. Contradiction with the locked pack: none found. One tension: D-003 chose PostHog and Sentry opt-in; D-095 and D-124 supersede it for 1.0 only [V charter].

Unread, so [U]: IA-FINAL control lists beyond the tree (I read sections 1 to 4.3), PM1 and partner files, `ids` coverage of NS cards, OpenTelemetry and Grafana pages, PostHog dot-in-name handling.
