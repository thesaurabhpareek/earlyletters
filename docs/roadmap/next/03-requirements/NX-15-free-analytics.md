# Theme 15: We learn what helps you, without selling or reading your words

Readiness: 25 of 28. Author's score, `qa` to confirm. Remains: the founder's own words reversing D-124 item 3 (C14); counsel's answer on the privacy label (Q7, Q54). The build itself is in draft PR #677; this file is the acceptance for it.

| | |
|---|---|
| Working label | NX-15 (working id, see `_CONVENTIONS.md`); backlog rank 15 in `../08-ranked-backlog.md` |
| Refines | PRD-REQ-001, -016, -018; LEGAL-REQ-014, -017; D-003, D-095, D-124 item 3; ADR 0008; `docs/analytics/TRACKING_PLAN.md` |
| Tag | EVIDENCE for the design (plan on branch `feat/analytics-free-sink`, file `docs/analytics/FREE-ANALYTICS-PLAN-2026-11-08.md`, draft PR #677, read 8 Nov). HYPOTHESIS for how much opt-in counts tell us (only consenting families are seen, and they are probably the more engaged) |
| Size | M (a function, a table, a sink in `packages/analytics`, a migration; PR #677 is the build) |
| Gate | Founder: only his own words in a decision entry turn analytics on (D-124 item 3 keeps them off for the whole 1.0 line). Counsel: the Usage Data and Diagnostics rows of the privacy label and the consent sheet wording. Migration needs the `approve-migration` label |
| Order | 15 (provisional; "order to be set" in 08) |

## What the parent will see and do

Nothing, unless they choose to. If the founder switches analytics on for a build, a parent is asked once, in plain words, whether to share counts such as "a letter was saved". Saying no changes nothing else. Saying yes sends only taps and counts, never what was said, never {child}'s name, never a recording. They can turn it off in Settings, Privacy and it stops within the session.

The founder reads the counts from his own Supabase project; no new company sees them.

## The check

"Old code" means the tree on this branch (develop at `caba0215` plus docs), searched 8 Nov 2026. The plan's own test list is its section 14.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-15-R1 | EVIDENCE | Given analytics build switch off (every 1.0 profile), When the app runs a full session, Then 0 requests go to any analytics endpoint and no profile in `apps/mobile/eas.json` sets an endpoint. | There is no first-party sink at all today; the only provider is a no-op unless a key and client factory exist, and `posthog-react-native` is not a dependency. | Plan section 2; D-095, D-124 |
| NX-15-R2 | EVIDENCE | Given the switch on and the parent has not said yes, Then 0 events are queued, stored or sent; a no is remembered and behaves as never asked; Settings, Privacy off empties the queue and outbox and retires the id within the session. | No sink exists to test against; the consent store exists. | PRD-REQ-001, -016, -018 |
| NX-15-R3 | EVIDENCE | Given an event whose name or property is not in `packages/analytics/src/catalog.ts`, or any string longer than the schema allows, Then it never leaves the provider, and the Edge Function refuses it again, and the table constraint refuses it a third time (3 of 3 walls, for 3 bad samples each). | One wall exists (the client validator); the function and table do not. | Plan section 7 |
| NX-15-R4 | EVIDENCE | Given canary values (the name Asha, an email address, a full sentence) put into 10 events, Then 0 canaries appear in any request body, outbox row, log line or table row. | No server side to check. | CLAUDE.md privacy rules; plan section 14 |
| NX-15-R5 | EVIDENCE | Given a batch sent while offline or refused with 5xx or 429, Then the batch is kept; a 4xx drops it; after a restart it is sent with its age; nothing older than 14 days is sent. | No outbox exists. | Plan section 14 |
| NX-15-R6 | EVIDENCE | Given the ingest function, Then it reads no Authorization header, keeps no IP or user agent, accepts 50 events and 32 KB at most per batch, and stops one id at 5,000 events a day. | The function does not exist. | Plan section 4 (security) |
| NX-15-R7 | EVIDENCE | Given the table, Then only `service_role` can read it; the k-anonymised views (k = 10) show nothing below 10 installs; `anon` and signed-in roles read 0 rows. | No table exists. | Plan section 8 |
| NX-15-R8 | EVIDENCE | Given a person turns analytics off or deletes the account, Then `forget_app_events` removes their ids (current and retired) from the table, and events older than 365 days are purged by a scheduled caller. | The SQL functions are written in #677; neither the call from `analytics-forget` nor the scheduled purge is wired (plan section 7, known limits). | Plan section 8 |
| NX-15-R9 | EVIDENCE | Given the privacy label, subprocessors list and in-app disclosure, Then none of them says "no analytics" in any build that carries the switch on (counsel wording), and the consent sheet carries Shown, Records, Never and Decline lines (below). | `docs/legal/subprocessors.md` and the label worksheet say the app has no analytics or crash service. | Plan section 9 |

**Shown:** the consent sheet: a plain list of what is counted ("a letter was saved"), never what was said. Strings: `analyticsConsent.*` (words by `content`, counsel approves).
**Records:** which event names and content-free properties, a random code that is not the account, and the time.
**Never:** words, recordings, {child}'s name or birthday, contacts, location, anything used for advertising, an IP address stored by our code.
**Decline and withdraw:** the app works the same; no sends; change the mind in Settings, Privacy.

## Edge cases

Second device or second account on one phone (separate random ids per consent period); kill switch on and off (the sink obeys the consent store, not a server flag); retry after a lost answer (a batch carries a client id; the table de-duplicates on it, to be confirmed in #677); account deleted (R8); phone offline for 15 days (R5); under-18 answer at sign-in stops collection quietly (existing).

## Offline behaviour

Events queue in memory (1 MB) and, if the founder adds the outbox, in a device store (an L2 row in DATA_CLASSIFICATION 4.5 is needed first). Without the outbox, events are lost if the app closes before the next flush (60 seconds or on background); this is a stated limit, not a bug.

## What we never do

Send before a yes. Add a vendor or an SDK. Put free text, ids, names, dates or anything derived from a letter in a property. Count missed days or build streaks from events.

## Copy needs

`analyticsConsent.*` exist or are named by `content` (the consent sheet exists in `apps/mobile/src/components/consent/`). Counsel rewrites the "no analytics" sentence in `docs/legal/subprocessors.md`; this theme does not edit `docs/legal`.

## Analytics events

No new events. Every ROI measure M1 to M7 uses events already in `packages/analytics/src/catalog.ts`; `packages/analytics/test/roi-events.test.ts` (in #677) fails if one is removed or gains free text. Nothing is sent in 1.0 until D-124 item 3 is reversed.

## Device rows

New: "analytics off: airplane-mode capture of network traffic shows 0 analytics requests"; "analytics on: yes, then Settings off, then 0 further requests".

## Dependencies

Founder decision (below). PR #677 (build). Counsel Q7 and Q54. Theme 5's privacy answers worksheet (NX-05-R6) must change in step.

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | The batch request and its refusal codes are a new contract: `{id, events[<=50]}`, version 1, additive; put the type in `packages/api/src/server/` with a case in `packages/api/test/server-contracts.test.ts`. #677 keeps the validator in `packages/analytics`; the type in `packages/api` is the one open point (UNVERIFIED which side #677 chose). |
| Budget (`06-nfr.md`) | Edge Function light: p95 600 ms, p99 1.5 s with cold start. No work before the first frame (no import of analytics SDKs in `_layout`; the sink uses `fetch`). Free plan limits (500,000 invocations a month) are in plan section 3; Pro is $25 a month. |
| Accessibility | The consent sheet and Settings switch: AX5 with 0 clipped lines; VoiceOver reads the list of what is counted before Yes; Yes and No equal weight (no dark pattern); tap targets 44 pt or more; Reduce Motion: fade only. |
| Switch, off behaviour, noticed by | Switch: build flag `EXPO_PUBLIC_ANALYTICS` plus `EXPO_PUBLIC_ANALYTICS_ENDPOINT`; per person, the consent store. Off: no consent sheet, no Settings row, nothing sent. Rollback: unset the endpoint in the EAS profile and ship; the function and table can stay. Noticed by: Supabase function logs (counts, no content) and the founder reading the table; an empty table after the build is out is the signal. |
| Data class and retention | Every property is L2 (enums, booleans, bounded integers). The random analytics id is L2, not linked to the account, retired on opt-out. Table readable by `service_role` and the k-anonymised views only. Kept 365 days, then purged. Supabase platform logs may hold IPs for their own retention; the privacy answer says so. |
| Schema and grants | New additive migration (#677: `20261108000000_analytics_first_party_events.sql`), explicit grants for the new service-only functions in `supabase/tests/grants.mjs`, db test `supabase/tests/analytics_first_party_events.test.mjs`. Needs `approve-migration`. |
| Analytics events | None new. All in catalog. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. Paths are those the plan names; they exist on the PR #677 branch only until it merges.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-15-R1 | D-095, D-124 | `apps/mobile/test/analytics-off-v1.test.ts`; `[NX-15-R1] no profile sets an endpoint; 0 requests with the switch off` | new: analytics off, 0 requests |
| NX-15-R2 | PRD-REQ-001, -016 | `packages/analytics/test/first-party.test.ts`; `[NX-15-R2] nothing before yes; off empties queue and outbox` | new: yes then off |
| NX-15-R3 | LEGAL-REQ-017 | `first-party.test.ts`, `supabase/functions/analytics-ingest/handler.test.ts`, `supabase/tests/analytics_first_party_events.test.mjs`; `[NX-15-R3] three walls refuse a bad event` | none |
| NX-15-R4 | CLAUDE.md privacy | same files; `[NX-15-R4] canaries appear nowhere` | none |
| NX-15-R5 | plan section 14 | `first-party.test.ts`; `[NX-15-R5] failed batches are kept, 4xx dropped, 14-day limit` | none |
| NX-15-R6 | plan section 4 | `handler.test.ts`; `[NX-15-R6] no auth read, no IP, 50 events, 32 KB, 5,000 a day` | none |
| NX-15-R7 | plan section 8 | `analytics_first_party_events.test.mjs`; `[NX-15-R7] only service_role reads the table; views null below 10` | none |
| NX-15-R8 | plan section 8 | db test plus a function test for the `analytics-forget` call (follow-up PR); `[NX-15-R8] forget and 365-day purge` | none |
| NX-15-R9 | plan section 9 | doc check by counsel; Test: none, review | none |

Trace: NX-15-R1..R9 -> PRD-REQ-001, -016, -018, LEGAL-REQ-014, -017, D-003, D-095, D-124.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Reverse D-124 item 3 for named builds, in his own words (an agent cannot supply them; draft text is in plan section 12) | Yes for the family TestFlight group first, not the first store build; the store build waits for counsel's label wording |
| First-party Supabase table versus a vendor | First-party (the plan's recommendation: no new subprocessor, no native module) |
| Add the durable outbox (new device key, L2) | Yes before the first family build, so offline events are not lost |

## Not verified

The plan's vendor free-tier numbers (read on 8 Nov from vendor pages; four cells are marked UNVERIFIED in the plan). Which package holds the batch type. Whether the batch client id de-duplicates retries. The PR #677 diff beyond its description.
