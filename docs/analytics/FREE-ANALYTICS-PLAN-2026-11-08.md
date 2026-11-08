# Free analytics plan (8 Nov 2026)

Status: DRAFT for the founder. Nothing here turns analytics on. D-124 item 3 keeps `EXPO_PUBLIC_ANALYTICS` off for the whole 1.0 line; only the founder's own words in a decision entry change that (draft text in section 12).
Author: Analytics Engineer (Claude role). Judged as Chief Data Officer, Chief Privacy Officer and Chief Information Security Officer (Claude roles).
Request: the founder, in chat, 8 Nov 2026: "let's implement the best free version of analytics that works with our stack."

## 1. Recommendation in one paragraph

Primary: **a first-party event table in our own Supabase, written by one small Edge Function, read through k-anonymised SQL views** (option a). It costs nothing beyond the Supabase plan we already need, adds no SDK and no native module (so it does not force a new native build and adds no vendor to the privacy label), adds no new subprocessor, keeps every event inside the allowlist we already wrote, and can be deleted row by row. Use **App Store Connect App Analytics and TestFlight (option b) alongside it from day one**, because it needs nothing, counts every user, and is the only honest source for money and crash rates. Add **later**: Apple's crash reports first (free, no SDK); a crash SDK only if Apple's reports prove too thin; PostHog only if we outgrow SQL views and the founder accepts a vendor on the label. Do not take TelemetryDeck, Aptabase or Sentry now.

## 2. Evidence: what the repo says today

| Source | Finding |
|---|---|
| CLAUDE.md privacy rules | No entry text, transcript, audio or child name in analytics, logs or crash reports. |
| D-003 (3 Oct) | Opt-in PostHog and opt-in Sentry at launch. Superseded for 1.0 by D-095. |
| D-095 (15 Oct) | Build switch `EXPO_PUBLIC_ANALYTICS`, off in every 1.0 profile: no consent sheet, no Settings switch, no client, `startAnalytics()` does nothing. Label stays "Data Not Collected". |
| D-124 item 3 (28 Oct) | D-095 stands for the whole 1.0 line, staged 1.0.x included. "Analytics returns with consent in v1.1 or later." Website analytics: none. "The founder may reverse any item." |
| ADR 0008 | PostHog plus Sentry, both swappable behind `packages/analytics`; Aptabase, TelemetryDeck, GlitchTip named as alternatives, "not researched". This plan researches them. |
| `docs/legal/subprocessors.md` 2.1.0 | Supabase, Cloudflare R2, Resend, Vercel, Apple, Hugging Face. "The app has no analytics or crash reporting service." |
| `docs/legal/app-store-privacy-labels.md` 2.1.0 | Usage Data and Diagnostics: No. A build with opt-in analytics (v1.1) "adds Usage Data and Diagnostics for Analytics, and Analytics on the identifier rows; the Linked or Not linked question (Q7) returns". |
| DATA_CLASSIFICATION 4.7, 4.9, rule 9 | Every analytics property is L2: enums, booleans, bounded integers. Internal ids are never analytics properties; the only identifier is the random analytics id. Sentry would be L2 after scrubbing, same consent switch. |
| `packages/analytics` | Typed catalogue (about 70 events), `sanitizeEvent` fail-closed validator, consent store with random per-period id, `AnalyticsProvider` sink interface (PostHog is one implementation), in-memory queue (1 MB), sampling, `analytics-forget` for deletion. 138 tests before this plan. |
| `apps/mobile/src/lib/analytics` | Consent sheet and Settings, Privacy switch exist behind the build switch. Provider is a no-op unless a key and a client factory exist; `posthog-react-native` is not a dependency. |
| `supabase/migrations` | No events table. `insights` schema holds six k-anonymised views over product tables (k = 10). `analytics-forget` deletes PostHog persons statelessly. |
| ROI file (`docs/roadmap/next/06-roi.md` on `docs/next-roi-8nov`) | M1 to M9. Section 6: ASC "needs no consent and counts every user"; D events see only opted-in families and "probably the more engaged". Item 8: analytics value is not in the model; the founder should weigh it directly. |

Consequence: the code, catalogue, consent flow and Settings switch already exist. What is missing is a sink that is not a new vendor.

## 3. The options, from the vendors' own pages

Pages read 8 Nov 2026 with the fetch tool. UNVERIFIED means the page could not be read this session.

| | (a) First-party Supabase | (b) App Store Connect + TestFlight | (c) PostHog free | (d) TelemetryDeck | (e) Aptabase | (f) Sentry free (crash only) |
|---|---|---|---|---|---|---|
| Free limit | Free plan: 500 MB database, 500,000 Edge Function invocations a month, 5 GB egress; free projects pause after 1 week of inactivity; no automatic backups (supabase.com/pricing, 8 Nov). Pro from $25 a month. | Free with the developer account. | 1M events a month, 5K replays, 100K exceptions; 1 year event retention; no overage on free, extra events are dropped (posthog.com/pricing, 8 Nov). | New accounts from 1 Jul 2026: 50,000 events a month; older accounts keep 100,000; namespace stops accepting at the limit (telemetrydeck.com/blog/pricing-update-2026, 8 Nov). Pricing page itself unreadable: prices UNVERIFIED. | 20,000 events a month, unlimited apps; paid from $10 for 200,000; analytics pause at the limit (aptabase.com/pricing, 8 Nov). Retention UNVERIFIED. | Developer plan: 5k errors, 1 user, 30-day lookback; Team $26 a month annual (sentry.io/pricing, 8 Nov). Period for 5k not stated. |
| Data location | Our Supabase project (United States, as in subprocessors.md). | Apple. | US (Virginia) or EU (Frankfurt) cloud, choice at signup. | EU per vendor marketing; page UNVERIFIED. | EU (Germany) or US (Virginia). | "Data residency available", regions not named on the page. |
| Native module | None. Uses `fetch`. | None. | Plain package needs Expo file-system and application modules; optional plugin adds native iOS code (docs, 8 Nov). Whether the SDK needs a new native build in our project is a check for `mobile`: treat as yes until proven. | UNVERIFIED (docs page unreadable). | Page lists no native setup beyond Android INTERNET permission; Expo peer modules UNVERIFIED. | Native SDK for crash capture: yes. |
| Identifiers it sets | Our random per-consent-period id only. No device id, no IP stored by our code. | Apple's own, on Apple's side. | Anonymous id and device-side persistence by default; we override with our id and block `$` properties via `before_send`. | Hashes a user id it is given; other details UNVERIFIED. | Vendor says no device identifiers, no cookies, no long-term user identification; sessions anonymous. Vendor statement, not checked. | Installation and device context by default; scrubbing needed. |
| Subprocessor and label impact | None new. Label: Usage Data (Product Interaction) and Diagnostics become "collected, for Analytics". Question of Linked vs Not linked (Q7) returns. | None. Not our collection. | New subprocessor. Label as left. | New subprocessor. | New subprocessor. | New subprocessor, Diagnostics. |
| Children's data and COPPA fit | Strongest: we choose the schema, nothing but L2 enters, deletion is one SQL delete. The app is for adults; the 18+ gate exists (PRD-REQ-019). | Strong. Usage numbers are Apple's, only from people who share with developers. | Acceptable only with our allowlist as the control; a vendor holds the data. | Likely acceptable; not verified. | Likely acceptable; not verified. | Needs scrubbing of messages and breadcrumbs; ADR 0008 rules apply. |
| Offline queueing | Ours: in-memory client queue plus an outbox with 14-day limit (this PR). | n/a | SDK queues on device and flushes when online (docs, 8 Nov). | UNVERIFIED. | Page does not say. | SDK buffers. |
| Cost cliff | Free plan pauses an idle project and has no backups; Pro $25 a month. Our events are tiny; 500,000 invocations covers about 100 opted-in families at 50 batches a month each, many times over. | None. | Free stops at 1M events; paid per-unit rates not read. | Stops at 50,000 events: a few dozen families at 1,000 events a month. | Stops at 20,000 events. | 5k errors. |
| Respects our opt-in and allowlist | By construction: same `AnalyticsProvider`; server re-checks the allowlist. | Independent of our consent (Apple's setting); we cannot change what it counts. | Yes through the same provider, with `before_send`. | Would need an adapter. | Would need an adapter. | Needs a second consent-gated init and scrubbing. |
| Lock-in | None. Rows are ours. | None, but we cannot export event-level data. | Moderate (export exists, dashboards do not move). | Moderate. | Low (open source per page). | Low. |

Not verified at all this session: TelemetryDeck prices, data location and SDK details; Aptabase retention, offline behaviour and peer modules; Sentry free period and regions; Apple's exact App Analytics help pages (the help URL tried returned "not found"; the product page was read). Do not rely on those cells.

## 4. What each role would say

- **Chief Data Officer (Claude role).** The ROI questions we need are mostly counts and ratios on a few dozen families for months. A table plus views answers M1, M2, M4 (opt-in side), M5 and M6 and keeps the data ours. A vendor funnel tool is not needed at this size and would not fix the real limit, which is that only consenting families are seen. Keep sampling off. Read M7 and cost from Apple and Supabase usage, not from events.
- **Chief Privacy Officer (Claude role).** The best vendor is no new vendor. Option (a) leaves the subprocessor list unchanged, keeps the identifier random and unlinked from the account (the ingest function never reads the sign-in token), and makes deletion real. It still moves the label from "Data Not Collected" to collecting Usage Data and Diagnostics for Analytics; that is a founder and counsel decision, not an engineering one. The consent sheet must carry the Shown, Records, Never and Decline lines (section 6).
- **Chief Information Security Officer (Claude role).** An open ingest route is abusable. Controls built: no auth header read, 32 KB body cap, 50 events a batch, server-side allowlist, table constraints as a second wall, 5,000 events a day per id, service-role-only functions, no read grant to anyone but `service_role` and the k-anonymised views. Residual risk: an attacker can still create many ids; the daily cap is per id. Add an IP-based limit at the edge (Cloudflare or Supabase network rule) before any large rollout. Platform request logs may hold IP addresses; list that in the privacy answer.

## 5. Events: the exact list from the ROI measurements

No new events are needed. Every name below exists in `packages/analytics/src/catalog.ts` and TRACKING_PLAN section 3.1; `packages/analytics/test/roi-events.test.ts` fails if any is removed or gains a free-text property. All properties are enums, booleans or bounded integers (L2). No child name, no entry text, no date of a child. Children appear only as `child_ordinal` and `child_count_bucket`.

| Measure | Events (property names only) |
|---|---|
| M1 time to first saved letter, where first-run people stop | `analytics_opted_in` (`time_to_first_letter`), `capture_started`, `capture_discarded` (`stage`), `letter_saved` |
| M2 reliability | `error_shown` (`code`), `sync_failed` (`reason`), `pack_download` (`stage`, `failure`, `network`) |
| M3 reaching the free allowance | `free_allowance_reached` (`allowance`), `keep_gate_shown` (`letters_kept`, `allowance`, `lapsed`), `letter_held` |
| M4 habit | `app_opened` (`days_since_last_open`), `letter_saved` |
| M5 reminders | `reminder_sent` (`type`), `notification_opened` (`type`), `letter_saved` (`from_notification_2h`), `reminder_suppressed` (`reason`), `settings_changed` (`key`) |
| M6 family demand | `coparent_soon_opened` (`surface`), `coparent_soon_notify`, `invite_created` (`channel`), `invite_accepted` (`role`) |
| M7 Plus funnel (diagnostic only; money comes from App Store Connect) | `plus_offer_viewed` (`trigger`), `plus_started_from_gate`, `plan_changed` (`from_state`, `to_state`, `period`, `ownership`), `offer_code_redeemed`, `restore_result` |
| M8 cost to serve | Not events. Supabase usage page and function counts. |
| M9 founder cost per PR and session | Not events. `gh api` and the founder's log. |

Allowlist entries: unchanged. Global properties on every event: `schema_version`, `child_count_bucket`, `sample_pct` (when sampled). The sink adds one transport field, `ago_s` (whole seconds between the event and sending), so the server can date an event without the phone's clock being trusted. It is not stored as a property.

## 6. Consent flow

Unchanged from the existing flow (PRD-REQ-001, -016, -018; D-003), now with a working sink:
1. Build switch on and endpoint set: the third ask shows the sheet; with the switch off nothing appears, as today.
2. Nothing is queued, stored or sent before a yes. A no is remembered and behaves like never having been asked.
3. Yes: a random id is created (never the account id), `analytics_opted_in` is sent, events batch every 60 seconds and on background.
4. Settings, Privacy has the switch. Off stops sending within the session, empties the in-memory queue and the outbox, retires the id.
5. Under-18 answer at sign-in stops collection quietly (existing).

Lines the sheet must carry (PRIV-R21; wording is for `content`, counsel to approve `analyticsConsent.*`):
- **Shown:** the plain list of what is counted (taps and counts such as "a letter was saved", never what was said).
- **Records:** which event names and the content-free properties, a random code that is not your account, and the time.
- **Never:** your words, recordings, {child}'s name or birthday, your contacts, your location, or anything used for advertising.
- **Decline:** the app works the same; choosing no sends nothing, and you can change your mind in Settings, Privacy.

## 7. Design

```
phone  --(consent yes)-->  client.track  -- sanitizeEvent -->  memory queue (1 MB)
                                                    |  flush every 60 s / on background
                                                    v
                                         first-party provider: sanitizeEvent again, outbox
                                                    |  POST {id, events[<=50]}, header apikey only
                                                    v
                           Edge Function analytics-ingest: sanitizeEvent again, 32 KB cap, no auth read
                                                    |  service role RPC
                                                    v
                    public.ingest_app_events  ->  insights_events.app_events (RLS on, checks, 5000/day/id)
                                                    |
                               k-anonymised views (k = 10) for insights_reader; table for service_role only
```

Three walls: client validator, server validator, table constraints. The sink is `packages/analytics/src/first-party.ts`; the function is `supabase/functions/analytics-ingest`; the tables and views are in migration `20261108000000_analytics_first_party_events.sql`. Views: `app_event_daily`, `app_event_breakdown`, `app_active_weekly`.

Known limits of this first cut, all deliberate:
- The durable outbox is built and tested in the package, but the mobile wiring passes no storage (memory only) so no new device key is added without a DATA_CLASSIFICATION 4.5 row. Offline events are lost if the app is closed before the next flush. Decide whether to add `scribe.analytics.outbox` (L2) before launch.
- `analytics-forget` still targets PostHog only. The SQL function `forget_app_events(uuid[])` exists; pointing `analytics-forget` at it (and dropping the PostHog call when PostHog is not used) is a follow-up PR.
- The 365-day retention purge function exists; a scheduled caller (the purge worker) is a follow-up.
- Views show nothing below 10 installs. In a family-sized alpha every cell is null by design. Until there are 10 opted-in installs, the founder reads the table directly in the Supabase SQL editor as `service_role`; agents get no table grant.

## 8. Retention, access, deletion

- Retention: 365 days from receipt (TRACKING_PLAN 6: 12 months or less). Purge function `purge_app_events`.
- Who can read: the founder, through the SQL editor (service role). `insights_reader` reads only the k-anonymised views. Agents never read the table. There is no free text anywhere in it to read, by construction and by constraint.
- Deletion: a person's ids (current and retired, kept on the phone for exactly this) go to `forget_app_events`; account deletion calls it through `analytics-forget` (follow-up).
- No IP, user agent or account id is stored. Supabase's platform logs may hold IP addresses for their log retention; say so in the privacy answer.

## 9. Privacy label and App Store impact

- No new native module, so no change to the privacy manifest from this sink and no extra reason to cut a native build for it. The build that turns it on still needs `EXPO_PUBLIC_ANALYTICS=on` and `EXPO_PUBLIC_ANALYTICS_ENDPOINT` in an EAS profile, which is an `eas.json` change this PR does not make and D-124 item 1 forbids before the go/no-go (Mon 9 Nov).
- Label: Usage Data (Product Interaction) and Diagnostics (Other Diagnostic Data, for the error events) move from No to collected, purpose Analytics. Whether the random id makes it Linked or Not linked is the old Q7: our reading is Not linked (random id, no account join, no tracking), because the ingest function never reads the account token and the id is retired on opt-out. Counsel decides. "Data Not Collected" cannot be claimed once this ships.
- No tracking, no ATT prompt, no IDFA or IDFV (unchanged).
- Subprocessors: unchanged (Supabase already listed). The sentence "The app has no analytics or crash reporting service" must be reworded by counsel and `content` when this ships. This PR changes no privacy copy.
- Privacy policy and in-app disclosures need the Shown, Records, Never and Decline lines. Counsel approves.

## 10. What this cannot tell us

- Anything about families who said no, or never saw the ask. Opt-in is probably the more engaged group, so drop-off is understated (ROI M1).
- Anything inside a letter: what was said, whether it was good, how people feel. Only counts and enum states.
- Money. Trials, conversions, refunds, proceeds come from App Store Connect; sandbox purchases in TestFlight are not real (ROI M7).
- Crash rates for everyone. Apple's crash data covers people who share diagnostics; our `error_shown` covers only our own opted-in families.
- Letters kept only on the phone before sync are invisible to server aggregates; device events see them only for opted-in families.
- Individual journeys. There is no user id, deliberately, so no "what did this family do".
- Reasons. Events show what happened, not why; the think-aloud studies in the ROI file cover why.
- Anything for fewer than 10 installs in the views.

## 11. Rollout

1. Now: this PR is a draft, off everywhere. Merging it changes no behaviour: the endpoint is empty and `EXPO_PUBLIC_ANALYTICS` is off in every profile (a test checks no profile sets the endpoint).
2. Founder decides (section 12). Counsel answers the label and consent wording question (section 13).
3. Apply the migration (needs the founder's `approve-migration`, D-041) to staging, deploy `analytics-ingest` with `--no-verify-jwt`, set no new secret (the service role key is injected).
4. Smoke on staging with a test id: send a batch, read the row, call `forget_app_events`, confirm it is gone.
5. First build allowed to carry it: the TestFlight family-group build after the founder's reversal, not the first store build. Build numbers come only from EAS; the ROI file speaks of "after build 12", so build 13 at the earliest (UNVERIFIED which number EAS issues). Off by default: the build switch is on, but every person starts with no ask answered, so nothing is sent until each taps yes.
6. After two weeks: read M1, M2, M4, M5, M6 from the table; set the 10-install threshold for views.
7. Later: Apple crash reports now (nothing to build); a crash SDK only if those are too thin (a `pair` task with the founder, own consent and scrubbing); PostHog only if SQL stops being enough.

## 12. Draft decision entry (for the founder; not written to DECISIONS.md)

```
### D-NNN First-party opt-in analytics on our own Supabase (founder, <date>)
- Status: Decided (founder). Reverses D-124 item 3 and the 1.0-line part of D-095 for the builds named below; D-095's build switch stays the control.
- Decision: <founder's own words here>. Opt-in usage counts are collected from families who say yes, into our own Supabase (schema insights_events), through the existing allowlist. No SDK and no vendor. Apple's App Store Connect numbers are read alongside it. The switch stays off in the store build until counsel approves the label and consent wording.
- Effects: migration 20261108000000 applied to staging then production on approve-migration; function analytics-ingest deployed; EXPO_PUBLIC_ANALYTICS=on and EXPO_PUBLIC_ANALYTICS_ENDPOINT set in <named profiles> only; app-store-privacy-labels and subprocessors wording changed by counsel before any store build with the switch on.
- Owner: analytics engineer; founder for reversal.
```
The founder's own words are required; an agent cannot supply them.

## 13. Counsel question

One question, for Q7 and the label: "Is a random per-consent-period analytics id, stored on our server with Usage Data events, never joined to the account (the endpoint ignores the sign-in token, no IP is stored by our code) and deletable on request, Not linked to the user for the App Store Privacy label? If not, what must change? Please also approve the Shown, Records, Never and Decline wording for the consent sheet and the reworded subprocessor sentence."

## 14. Tests

| Test | Where |
|---|---|
| Allowlist: unknown event, unknown property, free text and PII-shaped strings never leave the provider or the function | `packages/analytics/test/first-party.test.ts`, `supabase/functions/analytics-ingest/handler.test.ts` |
| No content leak: canaries "Asha", an email, a sentence appear in no request, outbox or log line | same two files |
| Opt-out honoured: nothing before a yes; opt-out empties queue and outbox; in-flight send leaves nothing | `first-party.test.ts` |
| Offline: failure keeps the batch (5xx, 429, network), a 4xx drops it, restart sends it with its age, 14-day limit, size cap | `first-party.test.ts` |
| Server never reads the Authorization header, forwards no IP, logs only counts | `handler.test.ts` |
| Build switch: no endpoint while off, https only, no profile sets one | `apps/mobile/test/analytics-off-v1.test.ts` |
| ROI events all exist with enum, bool or int properties only | `packages/analytics/test/roi-events.test.ts` |
| Grants: new service-only functions listed | `supabase/tests/grants.mjs` (explicit_grants, access_matrix) |
| Table checks (nested value, long string, bad name), access (anon, signed-in, insights_reader), k-anonymity of the views, daily cap, forget, 365-day purge | `supabase/tests/analytics_first_party_events.test.mjs` |
