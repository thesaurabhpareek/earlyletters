# Analytics: open-source stack, event schema and allowlist for instrumentation

Status: PROPOSED, 20 Nov 2026. Author: `analytics` (data partner of PM1: capture and first run; PM1 file `docs/product/instrumentation/01-*.md`, not read yet, UNVERIFIED). Docs only. Read first: `00-event-standard.md` (the standard this file applies). Tags: [V] read this session, [U] unverified, [E] estimate with basis, Rec = my recommendation.

Binding rules, updated 20 Nov: founder direction ("we are going to build for production now so analytics is needed") proposes to reverse the beta rule that analytics is off through 1.0.x (D-095, D-124 item 3, FR-DAT-01 [V]); those three stand until the erratum in section 1a is ruled. This file now designs analytics to SHIP in the production release behind the consent gate: opt-in, off until the parent says yes, closed allowlist, no content, no names, no child data. What flips, and who decides each part, is in section 1a. Founder rule 20 Nov: only completely free, open-source tools that fit Expo/React Native, Supabase and Vercel; no paid products or tiers; self-host or a documented free tier, limits sourced or marked [U]. Founder decision 20 Nov: PostHog Cloud free tier, for product analytics and crash reporting (one vendor); it is the documented free tier the rule allows, not an exception to it. Settings, naming and crash rules: `posthog-standard.md`. Adoption rules: `docs/engineering/readiness-20nov/libraries/ADOPTION-RULES.md` [V]. Any new dependency is the founder's (package.json is founder-only): listed in section 9, none added.

## 1. Decision in one paragraph

Keep what is built: the typed allowlist, consent gate, validators and the PostHog adapter in `packages/analytics` (68 events, `posthog-react-native` already wired and verified against 4.78.4 [V `posthog.ts`, README]). Host: PostHog Cloud free tier, chosen by the founder on 20 Nov 2026 (section 11). The software is MIT apart from `ee`; the hosting is a third-party service, so the consent wording, the App Store label, the subprocessor and data-map rows and counsel's view stay open (section 1a). Build nothing else: no own dashboard, no own pipeline, no own crash tool. Add the basics (screen, tap, impression, perf) as registry rows generated from one id list, so the team gets the founder's five basics by adding rows and three helpers, not a new system.

## 1a. What flips from the beta rules

The beta rules held because nothing was sent (FR-DAT-01: no event, counter or payload sent, queued or written; no PostHog or Sentry client constructed; store label says no usage or diagnostics data). For production, these change. Each is a founder or counsel item; I list defaults and decide none.

| What flips | From (beta) | To (production default) | Decided by | Default |
|---|---|---|---|---|
| Build flag | `EXPO_PUBLIC_ANALYTICS` off in every profile | on in the `production` profile only; off in `development`, `e2e`, `testflight` and `preview` unless the founder says otherwise; the SDK is still constructed only after a yes | founder | as stated |
| Consent sheet wording and timing | none shown | the sheet (`analyticsConsentDue`: after the first saved letter, never the same session, at most two offers) with the PRIV-R21 lines Shown, Records, Never, Decline | founder and counsel; `privacy` reviews | existing timing, new wording drafted by `content` |
| App Store privacy label | "no usage or diagnostics data" | usage data (and diagnostics if a crash tool ships); whether it is linked to the parent: not linked, because the id is random and never joined to an account (TRACKING_PLAN 10 [V], to be reconfirmed by counsel); not used for tracking | founder and counsel (label is theirs) | usage data, not linked, no tracking |
| Subprocessors and data map | none | `docs/legal/subprocessors.md` row for the host; data-map row (LEGAL-REQ-027); data-policy section 4 and the privacy policy text; a further row for every crash tool host (Sentry cloud or GlitchTip) if `ops` proceeds | counsel | rows drafted by `data-steward` |
| Errata | D-095, D-124 item 3, FR-DAT-01 stand | one erratum supersedes D-095, D-124 item 3 and FR-DAT-01 for the production release, and rewrites FR-DAT-01 as "analytics only behind consent" (placeholder E-INSTR-1; real numbers from E84 are assigned when ruled; E83 is taken by #1051) | founder; CPO | as stated |
| Build tests | a test fails if any 1.0.x profile sets `EXPO_PUBLIC_ANALYTICS` on | a test fails if any profile other than `production` sets it on, if the PostHog client is constructed before consent, or if anything is queued or written before consent (V15) | `analytics`, `qa` | as stated |
| Release gate | OG-1 to OG-10 in #1044: "no analytics SDK in a store bundle" | rewritten to "analytics only behind consent": the SDK may be in the bundle; the gate checks the consent test, the allowlist and canary tests (V1 to V16), the label and subprocessor files match the build, and no `ee`, replay or autocapture option is on | founder (CPO informed); `ops` and `analytics` draft it | as stated |
| Label guard | `TRACKING_SDK` list in `scripts/release/label-effect.mjs` blocks an analytics SDK in a PR | a founder-approved exception for `posthog-react-native`, with the label change in the same PR (ADOPTION-RULES section 3, label step) | founder | as stated |

Unchanged: opt-in only, off until the parent says yes, closed allowlist, no content or names, no child data, no person id, session replay off, nothing from the sensitive list in the standard section 6.

What withdrawal and deletion do, said honestly (data-steward findings F-1 to F-5 in #1037, `data-steward.md` section 7; this replaces the earlier "withdrawal clears everything"). Withdrawal stops new events and clears the queue on the phone; events already sent are removed only through account deletion (F-1), and a person with no account has no deletion route. PostHog may not delete events that have no person profile (F-2), so until the staging drill IN-DS-06 passes the deletion promise has no proof. A 202 reply means accepted, not deleted (F-3). Deletion is asynchronous, about a month, never "now" (F-4). `MAX_RETIRED_IDS = 20` drops the oldest id silently, so a 21st toggle leaves one period undeletable (F-5). The label row above ("not linked") depends on this outcome and on counsel's view of an id the phone keeps; it stays marked "to be reconfirmed by counsel". IN-DS-06 is a dependency of IN-08.

## 2. Open-source and free options checked

Data column: what the tool would hold. All sources read this session unless marked.

| Need | Option | Licence | Self-host | Cost | Would hold | Verdict |
|---|---|---|---|---|---|---|
| Events, funnels, retention, cohorts, dashboards | PostHog (cloud, free tier) | MIT except the `ee` directory, which has its own licence [V github.com/PostHog/posthog] | not needed | free tier: 1M product-analytics events a month, no credit card, "not a trial" [V posthog.com/pricing]; retention on the free tier [U] | allowlisted events under a random id (section 6) | CHOSEN (founder, 20 Nov 2026); consent wording, label, subprocessor and data-map rows, and counsel remain open |
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

Honest limits: the free PostHog tier is a third-party processor and a hosted free tier of a commercial product (chosen by the founder on 20 Nov). It needs a subprocessor row (`docs/legal/subprocessors.md`), a data-map row, data-policy section 4, the privacy policy text and the label change (section 1a; ADOPTION-RULES section 2 item 5); a crash tool adds its own processor rows. What happens if volume passes 1M a month with no card on file, and which regions the free tier offers, I did not verify [U]. Rec: never add a card, so overage cannot bill (inference from "only add a card if you exceed", pricing page).

### 2a. Other free hosted options found (for the founder to compare)

None of these is chosen. All are options if the founder prefers a different host; each needs the same subprocessor, data-map, policy and label work as PostHog. Facts from each vendor's pricing page, read 20 Nov [V] unless marked.

| Option | Free allowance | Open source | Notes |
|---|---|---|---|
| PostHog cloud | 1M events a month, no card, not a trial [V posthog.com/pricing] | Yes, MIT except `ee` [V github] | Largest free allowance among the open-source options compared here; funnels, retention, dashboards; already in the code |
| Amplitude Free | 2M events a month "forever", no card, no time limit [V amplitude.com/pricing] | No (closed source) | Bigger allowance, but outside the founder's open-source rule; SDK adapter would be new code and a new dependency |
| Mixpanel Free | up to 1M events a month, no card [V mixpanel.com/pricing] | No (closed source) | Same objection; same size as PostHog |
| Aptabase | 20,000 events a month free, then from $10 a month [V aptabase.com/pricing] | "100% open source" [V page]; server licence AGPL as reported to me, not shown on the page [U] | Page does not mention funnels [V]; 20K is too small for us (section 8 volume) |
| Rybbit | The pricing page I read shows a 7-day trial and no free cloud plan, so the "3K free cloud" figure I was given is not confirmed [V rybbit.com/pricing] | "open source" per the page, licence not named [V] | Web-analytics style; no mobile SDK mentioned [V]; self-host only on Enterprise per the page |

## 3. What we build, what we adopt

| Layer | Use (PostHog, default host) | Build (thin, ours) |
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

- Wire names follow PostHog's own convention, `category:object_action` (Karma ruling, 20 Nov; `posthog-standard.md` section 2). PostHog says events starting with `$` are its defaults [V posthog.com/docs/data/events]; its docs state no character rules, so colons are used by PostHog's own handbook but not confirmed for funnels [UNVERIFIED, test in a throwaway project]. The dotted names in this file's examples are the PM files' working names; `posthog-standard.md` section 2.8 maps each to its wire name.
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
2. For each PM row the analytics agent checks: name passes V1 to V3, ids exist (V4), properties are the three shapes (V6), nothing on the V7 pattern list, funnel steps exist (V9). A PM file that needs something outside this gets a Proposed change box with an erratum (placeholder E-INSTR-n; real numbers from E84).
3. Existing catalogue events keep their meaning but are renamed once, under the standard, in a single PR (wire grammar: `posthog-standard.md` section 2). Working rule used in the PM files: `<area>.<object>.<action>`; examples (full table is backlog row IN-03): `letter_saved` to `capture.letter.saved`; `capture_started` to `capture.take.started`; `invite_created` to `family.invite.sent`; `plus_offer_viewed` to `plus.offer.shown`; `export_completed` to `keeping.export.completed`; `error_shown` to `system.error.shown`; `screen_view` (route enum) to the 29 generated `screen.<id>.viewed` events. A rename is a new event with the old one `deprecated` (standard section 8); nothing was ever sent in the betas (FR-DAT-01), so there is no history to protect and old rows can be deleted at once (Rec; `privacy` to confirm).

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
| M6 | Rewrite the FR-DAT-01 build test: `EXPO_PUBLIC_ANALYTICS` on only in `production`; no client before consent (section 1a) | existing tests, `eas.json` change is the founder's | none |
| M7 | `system.experiment.exposed` and the closed experiment and arm lists; keep PostHog flags off | `catalog.ts`, `ids.ts` | none |

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
| IN-08 | 3 | Turn on in the production profile behind the consent gate (section 1a: erratum, label, subprocessor, policy, sheet wording, release-gate rewrite) | founder, counsel, ops | S | IN-04, IN-05, IN-09, IN-DS-06 (deletion drill, `data-steward.md`), erratum E-INSTR-1 | yes |
| IN-09 | 1 | Make the three date-bearing error messages static (`age.ts:15`, `child.ts:28` and `child.ts:33`, from OBSERVABILITY-WITHOUT-CONTENT section 3, not re-read by me) before any crash tool ships; one message with no interpolated value per throw, a typed error class carries the closed code | owner of `packages/core` (role UNVERIFIED), `privacy` reviews | S | none | no |

## 11. Founder and counsel decisions

| Decision | Default |
|---|---|
| Use PostHog cloud free tier as the third-party processor for production | Chosen by the founder, 20 Nov 2026; no card ever on file; counsel confirms the processor; EU or US region still open [U which are free] |
| Ids in event names (standard section 12 Proposed change, erratum placeholder E-INSTR-2; real numbers from E84) | Follow the founder's baseline |
| All of section 1a: flag on in production, sheet wording, label (usage data), subprocessor, data map, policy, erratum E-INSTR-1 superseding D-095, D-124 item 3, FR-DAT-01, release-gate rewrite | Defaults in the table; none decided by me |
| Which hosted free tier (PostHog, or one from section 2a) | Decided: PostHog cloud free tier (founder, 20 Nov 2026). Section 2a stays as the record of what was compared |
| Weekly unlinked summary id (PM3 proposal) | Not allowed: one consent-time id (standard section 11) |
| Self-host PostHog or a BI tool | No (no free host, AGPL for Metabase) unless the founder supplies a machine |
| AGPL tools (Metabase) | Not adopted without counsel |
| Crash tool | Decided: PostHog Error Tracking, no second vendor (founder, 20 Nov 2026; `posthog-standard.md` section 4). Native crash capture needs `@posthog/react-native-plugin`, a new dependency, so it waits for the founder |

## 12. Risks

1. Free-tier terms can change; limits above come from pricing pages read on 20 Nov [V] and are not guaranteed.
2. Event-name cardinality (about 150 basics names) clutters PostHog; cap V16 and the alternative single-event shape cover it.
3. Impression thresholds (half visible for 1 second) are my proposal with no baseline; tune on the founder's phone first.
4. Per-event `v` changes the wire format; harmless while nothing is sent.
5. A content leak through a crash tool is outside this file, but it is now a production risk: OBSERVABILITY-WITHOUT-CONTENT section 3 has an open finding (three error messages carry a date, `age.ts:15`, `child.ts:28, 33`). Routed to `privacy` and `security-architect` (see #1044). With crash reporting now on PostHog Error Tracking this is a content-class leak (L3) and must be fixed before IN-08: backlog row IN-09. `privacy` also tracks it.
6. Contradiction with the locked pack: this file now conflicts with D-095, D-124 item 3 and FR-DAT-01 on purpose, per the founder's 20 Nov direction; it needs erratum E-INSTR-1 before any of it ships. D-003 (PostHog and Sentry, opt-in) is consistent with the new direction.
7. Review notes carried: renaming the catalogue deletes old rows at once (nothing was ever sent in the betas, so no history; `privacy` confirmed in review B, 20 Nov; this holds only while no build with the analytics flag on has shipped). PM files quote different catalogue schema versions; check the source at step M2. PM names for verbs and perf metrics are mapped in the standard sections 2 and 4.

Unread, so [U]: IA-FINAL control lists beyond the tree (I read sections 1 to 4.3), PM1 and partner files, `ids` coverage of NS cards, OpenTelemetry and Grafana pages, PostHog dot-in-name handling.
