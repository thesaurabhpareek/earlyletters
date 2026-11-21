# Analytics engineering requirements: two client work streams (PROPOSED)

Status: PROPOSED, 21 Nov 2026. Author: Analytics Engineer. Docs only: no code, no dependency, no `docs/legal`, `supabase` or `.github` change.
Founder instruction, 20 Nov 2026 (chat, verbatim): "Ok translate the analytics requirement into engineering ready requirement so that two client app engineers can work on it when needed. Add to backlog and implement analytics before production readiness app build."
Founder words, 20 Nov 2026 (chat, verbatim, relayed by the coordinator): "Analytics for instrucementarion of page viewed clicked is not opt in. It will be tracked for each user. That's how all apps work."
Backlog rows: `docs/BACKLOG.md`, section "Analytics engineering requirements" (BL-1235 to BL-1268). Row ids below are `ER-A##` (Stream A), `ER-B##` (Stream B), `ER-G##` (gate).

Tags: [V] read this session in the file named; [U] not read or not verifiable from here, so UNVERIFIED; [E] estimate; [Rec] my recommendation. "Counsel must confirm" marks every legal statement. Everything is ASCII.

Limits, up front. I read the instrumentation files and `packages/analytics/src` and `apps/mobile/src/lib/analytics` on `develop` (sparse clone), PR #1086 and its review comments by REST (not its code), and the split plan (#1091, merged). I ran no test and no build. The adapter, registry and crash reducer exist only on #1086 (head 07ba4a3, HELD by Karma), not on `develop`; file names for them come from the reviews and the split plan, not from my own read of that code [U]. I am the owner of the standard these rows implement, so a gap I leave in it is mine; read section 9 first.

## 1. What changed on 20 Nov and what it does to the design

Until now every file says "nothing is sent before a yes" (V15). The founder's new words say page views, clicks, impressions and funnel steps are collected for every user, with no consent ask. That reverses the opt-in rule for the content-free basics only. Three things stay true whatever is ruled: no content, no child name, no event off the closed allowlist.

Design consequence: the consent gate becomes a policy switch, not a rewrite. One config value, `analytics.basicsPolicy`, with two states:

| Policy | Before any choice | Events allowed | Sheet | Settings switch |
|---|---|---|---|---|
| `ask_first` (the default, the legal default until counsel and the founder confirm) | nothing sent, queued, written, no id minted (today's V15) | every registry event, after a yes | shown (existing sequencer, C1 and C2 of #1091) | the existing Usage reports line |
| `collect_by_default` | an install id is minted at first launch and basics are sent | only events with `tier: basics`; every other event is dropped with reason `dropped_not_basics`, so nothing beyond the basics can leave | none | required: the off switch (ER-B13) |

Precedence, highest first: the person's off switch (persisted, survives updates, never re-enabled by us) over the build flag and key over the policy. A remote value may only tighten (`collect_by_default` to `ask_first`), never loosen [Rec]. The build value comes from `EXPO_PUBLIC_ANALYTICS_BASICS_POLICY` per EAS profile; the production value stays `ask_first` until a recorded founder and counsel decision flips it in its own PR (ER-A14). Per-region override is a code path with an empty default map; it is filled only if counsel asks (FH-3). Which signal names the region (device locale, store country) is UNVERIFIED and must never be sent anywhere [U].

What the new words do not change: D-163 (#1193, open on 21 Nov [V]) lists "nothing before a yes" among the privacy rules it does not decide, and erratum E95 as drafted rewrites FR-DAT-01 as "analytics only behind consent" [V analytics.md section 1a]. The new words are not in D-163. The Chief Product Officer must record them as a decision and amend E95 before the `collect_by_default` value can be used (FH-12). I do not edit `docs/DECISIONS.md` or the errata.

Legal statements below (a persistent install id with no consent ask, region rules, labels) are counsel's: counsel must confirm each. My concern, stated plainly: an install id written to the phone with no ask may count as storage on the device under EU and UK rules, and the app holds baby memories, so the safe default is `ask_first` in the EU and UK, and `collect_by_default` elsewhere only if counsel agrees (launch geography is Q22, "Live (US only)" in `COUNSEL_PACKET.md` [V]).

## 2. Starting point (what exists)

- `develop` [V]: `client.ts` (consent gate: `store.status !== 'granted'` returns `dropped_no_consent`, line 168), `consent.ts` (`ConsentStore`: `id` is returned only when granted; `allIds()`; `revoke()`), `provider.ts` (no-op), `catalog.ts` (68 events), `posthog.ts`, `validate.ts`, `lifecycle.ts`; mobile `lib/analytics/index.ts` has `createClient = null`, so no SDK is bundled; all five `eas.json` profiles set `EXPO_PUBLIC_ANALYTICS` to `off`; `analytics-off-v1.test.ts` fails if any profile says on.
- #1086 (HELD, Karma, head 07ba4a3 [V comment]): registry, validators V1 to V10 and V16, adapter, crash reducer (off). #1091 re-cuts it as P1 to P8, B1, C1, C2, D1. Karma's blockers: a founder decision superseding D-095 and D-124 item 3 (D-163, #1193), the S17 App Privacy worksheet re-run, counsel on Q-005 and the consent wording, and dependency approval; the LEGAL-REQ-043 test is changed by its owner in the same PR, never bypassed [V].
- PRE-1 = the P1 to P8 stack as ER-A00. Every row that needs `registry.ts` depends on it. If Karma lets #1086 land as is, ER-A00 collapses to nothing and the rest stands.

## 3. Global rules: what is NOT allowed (every row)

| Id | Not allowed |
|---|---|
| N1 | Entry text, transcript, audio, child name or birthday, Find query, typed day word, picture words or place, in any event, property, log or crash report (CLAUDE.md, LEGAL-REQ-014) |
| N2 | Autocapture of any kind; `PostHogProvider` anywhere |
| N3 | Session replay, surveys, the logs API, heatmaps |
| N4 | Remote feature flags; any `$feature_flag_called` event |
| N5 | `identify` with anything but the random install id; account, email or device id; person properties |
| N6 | An event or property not in the registry; under `collect_by_default`, any event not `tier: basics` |
| N7 | A second vendor, any SDK other than `posthog-react-native` 4.87.1 (founder approval, FH-6), the native plugin `@posthog/react-native-plugin` (default no, FH-13) |
| N8 | An Apple tracking prompt, an advertising id, any tracking-domain use |
| N9 | An event at a birthday, due date or seal time; any email open or click event |
| N10 | An agent editing `docs/legal`, `supabase`, `.github`, `eas.json` or `package.json` dependencies (founder or counsel steps are named FH-n) |

Sizes: S = under 150 changed lines, about one day; M = 150 to 400 lines and 20 files or fewer (CODE-R02), about two days. A row that would pass 400 lines splits; none below is expected to [E]. Owner roles are `agents/roster.json` handles.

## 4. Two streams, no shared files

Two client engineers, Engineer A and Engineer B. Either can be staffed by the `analytics` or `mobile` role. Each file belongs to exactly one stream; the other stream imports it and never edits it.

| Path | Owner stream |
|---|---|
| `packages/analytics/src/{contracts,policy,consent,client,provider,posthog,validate,crash,pii,registry-rules,index}.ts` | A |
| `packages/analytics/test/{policy-default,consent-gate,install-id,sdk-options,one-module,before-send,validators-static,exception-canary}.test.ts` | A |
| `apps/mobile/src/lib/analytics/index.ts`, `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/test/analytics-policy.test.ts` (replaces `analytics-off-v1.test.ts`) | A |
| `apps/mobile/package.json` and lockfile (dependency: founder approves first) | A |
| `packages/analytics/src/{ids,registry,values,catalog,buckets,basics,trackers,observe,routes,plan-doc}.ts` | B |
| `packages/analytics/test/{registry,registry-canary,helpers,observe,catalog}.test.ts` | B |
| `docs/analytics/TRACKING_PLAN.md`, generated `registry.md` and `ids.md` | B |
| `apps/mobile/app/**` screens, `apps/mobile/src/lib/analytics/{track,use-screen-views,observers,ask,ask-sequencer.logic}.ts`, `apps/mobile/src/lib/privacy-manifest.ts`, `scripts/release/label-effect.mjs`, the analytics keys in `packages/content/src/strings.en.ts` | B |
| `apps/mobile/eas.json`, `docs/legal/**`, `supabase/**`, `.github/**` | founder or named owner, no stream |

Seams: `contracts.ts` (ER-A01) holds the shared types and is frozen after Wave 0; B imports it. `index.ts` (the barrel) is A's: ER-A00 and ER-A01 add every export B needs up front, so B never edits it. `registry-rules.ts` (A) reads `registry.ts` (B) one way. Each engineer edits only their own rows' status line in `docs/BACKLOG.md`.

## 5. Stream A requirements (consent gate, adapter, gates, validators, identity, region, errors, flags)

Contract (proposal, ER-A01):
```ts
type BasicsPolicy = 'collect_by_default' | 'ask_first';
type EventTier = 'basics' | 'consented';
type GateDecision = { allow: true } | { allow: false; reason:
  'dropped_no_consent' | 'dropped_not_basics' | 'dropped_user_off' | 'dropped_no_key' | 'dropped_profile' };
interface AnalyticsGate { decide(event: string, tier: EventTier): GateDecision }
```

**ER-A00 (BL-1235)** Re-cut the adapter as the P1 to P8 stack of #1091 (values, registry, crash reducer, send path, catalog shrink, validators, helpers, canary), one PR each, from the #1086 head tree, no commit that contains the old name history. Files: per `adapter-split-plan-20nov.md` section 3. Acceptance: each PR green alone (`npm test -w @scribe/analytics`, `npm run typecheck`); sizes per the plan, P2 and P5 carry its stated exceptions. Deps: Karma lifts the HELD ruling; D-163 merged. S per PR, M overall. Owner: analytics. NOT: N1 to N10; P4 touches no `catalog.ts`.

**ER-A01 (BL-1236)** Contract types and barrel. Files: `contracts.ts`, `index.ts`. Interface: the block above plus exports for ids, registry, basics, trackers. Acceptance: typecheck; a test that every registry row carries `tier`. Deps: none. S. Owner: analytics. NOT: N6.

**ER-A02 (BL-1237)** Policy resolution. A pure `resolveBasicsPolicy({ profile, buildValue, region, regionMap, remote })`. Rules: anything unrecognised, empty, missing, or a profile other than `production` resolves to `ask_first`; remote may only tighten; `regionMap` default empty. Files: `policy.ts`, `policy-default.test.ts`. Acceptance: table test over every input, including garbage and a remote loosen attempt (ignored). Deps: ER-A01. S. Owner: analytics. NOT: any network call to read it; any location sent.

**ER-A03 (BL-1238)** Policy-aware gate. `createAnalytics` asks `AnalyticsGate.decide` instead of reading `store.status` directly. `ask_first` behaves exactly as today. `collect_by_default`: basics pass without a consent act; non-basics return `dropped_not_basics`; a person's off switch returns `dropped_user_off` and wins. Files: `client.ts`, `consent.ts`, `consent-gate.test.ts`. Acceptance, a real test, not a rename: (1) the old "nothing before a yes" build test is kept as the `ask_first` case, asserting zero capture, zero id written, zero SDK constructed, nothing queued; (2) a pre-consent send happens only when `basicsPolicy` is `collect_by_default`, and a test fails if the production profile's resolved value is anything but `ask_first` before the recorded founder and counsel entry (ER-A14); (3) under `collect_by_default`, one registry event with `tier: consented` is dropped and counted by reason only; (4) off switch beats policy. Deps: ER-A01, ER-A02, ER-A04. M. Owner: analytics. Reviewer: privacy. NOT: N5, N6; deleting the old V15 test.

**ER-A04 (BL-1239)** Anonymous install id. Minted lazily the first time the gate allows an event (policy or yes), never before; lowercase uuid from `Crypto.randomUUID`; never an account, device or advertising id; handed to the SDK as the bootstrapped distinct id (no `$identify`). `ConsentStore.id` stops requiring `granted`. Switch off retires it (retired cap 20, F-5 stays known); a later on makes a new id; an old id is never reused. Files: `consent.ts`, `install-id.test.ts`. Acceptance: tests for mint-on-first-allowed-event, none under `ask_first` before a yes, retire on off, new id on on, 21st toggle behaviour recorded not hidden. Deps: ER-A01. S. Owner: analytics. NOT: N5; a fresh id per send (standard section 11).

**ER-A05 (BL-1240)** PostHog adapter, one module, options pinned. Files: `posthog.ts`, `sdk-options.test.ts`, `apps/mobile/src/lib/analytics/index.ts` (the factory: dynamic import only when the gate first allows), `apps/mobile/package.json`. Interface: `buildPostHogOptions` returns `REQUIRED_POSTHOG_OPTIONS`; values per `posthog-standard.md` section 3.4: `defaultOptIn` false (optIn called only after the gate allows), `captureAppLifecycleEvents` false, `sendFeatureFlagEvent` false, `preloadFeatureFlags` false, `disableRemoteFeatureFlags` true, `capturePushNotificationSubscriptions` false, `capturePushNotificationOpened` false, `pushIdentityProvider` unset, `disableGeoip` true, `enableSessionReplay` false, `persistence` file, `flushInterval` 0, `maxQueueSize` 100, `errorTracking.autocapture` per ER-A11. Acceptance: V17 test pins every row including the three push options; a test that a missing option fails. Deps: ER-A00, ER-A03, founder approval of `posthog-react-native` 4.87.1 (FH-6). M. Owner: analytics. NOT: N2, N3, N4, N7; the plugin; `PostHogProvider`. Unverified: the options were read from PostHog's library page, not from 4.87.1's source [U].

**ER-A06 (BL-1241)** `before_send`, the last gate. Order: gate decision (including tier), registry check (V11), property check (V12), PII-like or over 40 characters (V13), rebuild `properties` from the registry list plus the ten allowed `$` keys, so an unknown SDK field is dropped by default. Dropped events are counted by reason code only, never by value. Files: `validate.ts`, `before-send.test.ts`. Acceptance: self-tests for V11, V12, V13 each positive and negative; a non-basics event is dropped by `before_send` even if a caller bypassed the helper (belt and braces for ER-A03). Deps: ER-A03, ER-A05. M. Owner: analytics. NOT: N1, N6.

**ER-A07 (BL-1242)** Static validators V1 to V10 and V16 on the colon grammar. Reconcile the code with the standard: row fields (`when` to `trigger`, `reqs` to `source`, `level` to `class`, add `owner`, `side`, `consent_gate`, `v`, `supersedes`, `funnels`, `sampling`, `tier`), V8 exemption for `server`, `store` and `support` rows, drop or document `grandfathered` and `heldNames`. Files: `registry-rules.ts`, `validators-static.test.ts`. Acceptance: each rule has a positive and a negative self-test; V8 agrees registry, code and `TRACKING_PLAN.md` both ways. Deps: ER-A00, ER-B02. M. Owner: analytics. NOT: N6.

**ER-A08 (BL-1243)** V17 and V18. V17 pins the options of ER-A05 and ER-A11; V18 is a lint rule plus a test that only `posthog.ts` imports `posthog-react-native` and nothing else calls `.capture(`, `.captureException(`, `.identify(`, `.screen(`, a logs call or a survey call, and no `PostHogProvider` exists. Files: `one-module.test.ts`, `sdk-options.test.ts`. Acceptance: a planted violation in a fixture fails each. Deps: ER-A05. S. Owner: analytics. NOT: N2, N3.

**ER-A09 (BL-1244)** Off switch, Erase and withdrawal clear the phone. On off: `optOut()`, `reset()`, SDK queue emptied, id retired. On Erase everything the same, with nothing sent. Acceptance: a unit test of the call order, and a named device check (Device test sheet, new row J-N-ANA, to add by `qa` [U: the sheet's row ids]): after off and after Erase, no PostHog file in the app container keeps the id or a queued event; the privacy review of #1086 and the QA review both asked for this proof [V]. Deps: ER-A05. S. Owner: analytics, device check by qa. NOT: N1.

**ER-A10 (BL-1245)** Region, host and key. `EXPO_PUBLIC_POSTHOG_REGION` is `us` or `eu` and maps to one of two fixed hosts; any other value falls back to the policy-safe state (no SDK). The key must start `phc_`, never `phx_`. An optional proxy host override exists and is off by default [Rec, section 9]. Files: `posthog.ts`, `index.ts` (mobile), tests. Acceptance: tests for both hosts, an arbitrary host refused, a `phx_` key refused, yes-with-no-key sends nothing (QA note on #1086). Deps: ER-A05; region and key are FH-1 and FH-2. S. Owner: analytics. NOT: N10 for a committed key.

**ER-A11 (BL-1246)** Error tracking through PostHog only: reducer fixes. (a) `reduceExceptionEvent` runs `isPiiLike` and V12 and V13 on every kept `$` field (it skipped V11 to V13). (b) An unknown error class becomes `other`, as the standard says, or the standard is edited to `Error`: [Rec] code follows the standard. (c) Build the client cap: 5 exceptions per foreground session and one per class and top frame, counted by reason. (d) `reportFault(code)` takes a closed fault code and builds the error itself; no helper takes a string. (e) `errorTracking.autocapture`: uncaught exceptions and unhandled rejections only, `console: []`, `nativeCrashes: false`. Crash capture stays off (`CRASH_REPORTING.enabled` false) unless the founder says yes (FH-13); this row builds it dark. Files: `crash.ts`, `exception-canary.test.ts`. Acceptance: tests for each of (a) to (e) with Asha strings. Deps: ER-A00, ER-A05. M. Owner: analytics. NOT: N1, N7; message text of any exception or chained cause.

**ER-A12 (BL-1247)** `$exception` canary and a real payload. Add the canary case the review found missing: Asha strings through `posthogBeforeSend` for `$exception_list` entries with `module`, nested cause, a long function name, `context_line`, `vars`. Then capture one real `$exception` payload in a throwaway PostHog project and rebuild the fixture and allowlist from it. Files: `exception-canary.test.ts`. Acceptance: canary green; the fixture names the real field names (today UNVERIFIED). Deps: ER-A11; the real payload needs FH-1. S. Owner: analytics. NOT: N1.

**ER-A13 (BL-1248)** Flags off, plus our exposure plumbing. No flag request, no `$feature_flag_called`; the experiment arm is drawn on the phone and reported by our own `system:experiment_exposure_view`. Files: `posthog.ts`, `sdk-options.test.ts`. Acceptance: a fake network sees no flag call in a full session. Deps: ER-A05. S. Owner: analytics. NOT: N4.

**ER-A14 (BL-1249)** Build profile gating and the replaced build test. Only the `production` profile can construct the SDK; `development`, `e2e`, `preview` and `testflight` never do (D-163 supersedes D-095 for production only [V #1193]). `analytics-off-v1.test.ts` is replaced by `analytics-policy.test.ts`, not deleted: it keeps "off in every non-production profile" and adds "the production profile resolves `ask_first` until a recorded decision" and "production sets the key only with the flag". The `eas.json` flip itself is the founder's D1 PR (FH-7). The preflight checks `analytics` in `scripts/preflight-production.mjs` and `stillOff` in `scripts/preflight-testflight.mjs` need `ops` to rewrite them first, or a production release fails them [V #1091 section 4]. Files: `capabilities.ts`, the test. Acceptance: tests as stated. Deps: ER-A03, ER-A10. S. Owner: analytics, ops for the preflight scripts. NOT: N10.

**ER-A15 (BL-1250)** Globals: `build_kind` (`store, testflight, preview, dev`) and `is_internal` (true only on a phone where one local switch is on; the switch is off in a store install; FH-10). Files: `client.ts`, tests. Acceptance: both on every event; the switch is unreachable in a store build. Deps: ER-A03. S. Owner: analytics. NOT: N5.

**ER-A16 (BL-1251)** Offline, flush and caps. Our 60 s timer, background flush, SDK `flushAt` 20, client cap 60 events a minute counted by reason. Acceptance: unit tests for the cap and timer, plus the named device check from `posthog-standard.md` 6.3: airplane mode, 150 events, restore, count what arrives (SDK retry and overflow are UNVERIFIED). Deps: ER-A05. S. Owner: analytics; device check qa. NOT: N1.

**ER-A17 (BL-1252)** Deletion coverage for an install that never said yes. The install id exists without a consent act, so account deletion and Erase everything must pass the current and every retired id to `analytics-forget` whatever the consent status, and a person with no account needs a route (finding F-1). Requirement plus test: (1) a test that `allIds()` includes an id minted under `collect_by_default`; (2) a test that the forget request carries it; (3) the signed-out withdrawal route (IN-DS-02, BL-1062) covers it; (4) the staging drill (BL-1060) includes a never-consented id; (5) the policy and data-policy sentence on what withdrawal does is counsel's (counsel must confirm). Files: `consent.ts`, the mobile forget caller, the `analytics-forget` function [U: `supabase/functions/analytics-forget/handler.ts`, named by the setup pack, not read by me]. Deps: ER-A04, BL-1061, BL-1062. M. Owner: privacy and data-architect (analytics supplies the phone half). NOT: N1; any account id sent to PostHog; promising deletion before the drill passes.

**ER-A18 (BL-1253)** Stale wording. `packages/analytics/src/index.ts:20` says "Sentry, when added"; `posthog.ts` comments (about lines 166 and 188) cite 4.78.4 and "the native plugin, which we do not install"; both contradict the code or the ruling [V reviews]. Reword to "PostHog Error Tracking, one switch". Remove `@posthog/react-native-plugin` from the dependency list until FH-13 says yes (it is a native module that autolinks into every build, and nothing imports it [V Karma and analytics reviews]). Acceptance: grep test finds no `Sentry`, `GlitchTip` or the plugin in `packages/analytics/src` or `apps/mobile/package.json`. Deps: none (rides ER-A00). S. Owner: analytics. NOT: N7.

## 6. Stream B requirements (wiring, helpers, registry, canary, manifest, Settings)

**ER-B01 (BL-1254)** Id registry. `ids.ts` plus generated `ids.md`: the 29 routes of `routes.ts` plus the IA-FINAL extras; kinds screen, control, element, metric; each with an area and an IA-FINAL id; a dynamic list is one element id. Acceptance: V4 and V16 (300 per kind) self-tests; `npm run plan` renders `ids.md`. Deps: ER-A00. M. Owner: analytics (as B-stream work) or mobile. NOT: an id from text on screen or from a person, child, book or letter.

**ER-B02 (BL-1255)** Rename and tier. Rename the 68 catalogue events to wire names once (nothing has ever been sent, so allowed only before the first build with analytics on); `ok` to `is_ok` and the other bool renames; add `tier` to every row. `basics` is: every `_screen_view`, `_click` and element `_view` row, plus a closed list of domain rows flagged as funnel steps (candidates: `onboarding:first_letter_complete`, `capture:letter_save`, `capture:take_start`, `family:invite_create`, `family:invite_accept`, `plus:offer_view`, `keeping:export_complete` [Rec]; at most 12 [E]); everything else is `consented`. The `privacy` agent signs the list. Perf (`_measure`) is `consented` until FH-3 rules otherwise. Acceptance: V1, V2, V6 pass; a test lists the basics set and fails on a change without a registry bump. Deps: ER-A00, ER-B01. M. Owner: analytics. NOT: N1, N6, N9.

**ER-B03 (BL-1256)** Typed helpers. `trackScreen`, `tap`, `impress`, `perf` and the domain trackers generated from the registry; none takes a free string; a helper for a `consented` event refuses at the type level when called from a basics-only context [Rec]. Files: `basics.ts`, `trackers.ts`, `buckets.ts`. Acceptance: V3 source scan finds no template-string name; `helpers.test.ts`. Deps: ER-B02. M. Owner: analytics. NOT: N6.

**ER-B04 (BL-1257)** Screen views, 29 routes, through `useScreenViews` once in the root layout. Acceptance: a test walks the route table and asserts one view per route and none for an unregistered route; a named device check on a dev build (one screen, one event, only registry properties and the ten `$` keys). Deps: ER-B03. M. Owner: mobile. NOT: N2; a resolved path or param in an event.

**ER-B05 (BL-1258)** Click wiring, capture and book areas (Home, Listen, Write, Review, Book, letter page, Find, Read together). Each tappable control calls `tap(id)`; VoiceOver activate counts as a click. Acceptance: a test per screen that the registered controls fire once; a source test that no control calls the SDK. Deps: ER-B03, ER-B04. M. Owner: mobile. NOT: N1; Find query or result count.

**ER-B06 (BL-1259)** Click and impression wiring, family, keeping, me, plus and notifications areas. Same rules. Deps: ER-B03, ER-B04. M. Owner: mobile. NOT: N1, N9; share destination of an export; birthday or seal timed surfaces.

**ER-B07 (BL-1260)** Impression hook. One dedupe rule: at least half visible for 1 second [E, baseline to be taken], once per element per foreground session (a session starts at cold start or after 30 minutes away); the counter lives in memory only. Acceptance: hook tests with a fake clock. Deps: ER-B03. S. Owner: mobile. NOT: N1.

**ER-B08 (BL-1261)** Domain and funnel-step events. Replace literal `track('letter_deleted', ...)` style calls with registry constants; wire the funnel-step events flagged in ER-B02. Acceptance: V3 source scan finds no literal event names outside the registry; each event fires once on its trigger. Deps: ER-B02, ER-B03. M. Owner: mobile. NOT: N1, N9.

**ER-B09 (BL-1262)** Funnels. Registry rows `f_<area>_<goal>` for the five funnels (V9: 2 to 8 steps, window enum) and the saved insights and one launch dashboard in PostHog. Acceptance: V9 self-test; a throwaway project renders each funnel with colon names (UNVERIFIED today, `posthog-standard.md` 2.8). Deps: ER-B02, FH-1. S. Owner: analytics (decision-science reads). NOT: N6.

**ER-B10 (BL-1263)** Canary and registry tests. Asha strings (child name, birth date, a letter sentence, a Find query, a file name) through every helper and `before_send` (V14); a loop over every held event (not one), counted under its own reason `held_event`, apart from `unknown_event` (QA review note); yes-with-no-key sends nothing; never-lists tests for N9. Files: `registry-canary.test.ts`, `registry.test.ts` shipped-registry half. Acceptance: all green in the `unit` job. Deps: ER-B03, ER-A06. M. Owner: qa with analytics. NOT: real family details in any fixture (Asha only).

**ER-B11 (BL-1264)** Plan generation and PR tracking line. `npm run plan` renders `TRACKING_PLAN.md` and `registry.md` from the registry; V8 both ways; reword the "Crash reports (Sentry)" line to PostHog Error Tracking; the script for the PR line `Tracking: none | events added or changed | not needed` (the `.github` job that runs it is the founder's, FH-14). Acceptance: `catalog.test.ts` asserts the doc equals the render. Deps: ER-B02. M. Owner: analytics. NOT: N10.

**ER-B12 (BL-1265)** Privacy manifest and label alignment, the code half. `privacy-manifest.ts` and the `PrivacyInfo.xcprivacy` data follow the build switches: data collected Usage Data (Product Interaction, Other Usage Data), diagnostics only if crash capture is on; not used for tracking; no tracking domains; `NSPrivacyTracking` false. `label-effect.mjs` gets a founder-approved exception for `posthog-react-native` with the label change in the same PR. The LEGAL-REQ-043 test ("no analytics SDK ships") is updated by its owner through review in the same PR, never edited around, never skipped. Whether the data is "linked" is Q-005, counsel must confirm; the label click and the S17 worksheet re-run are the founder's (FH-5). Acceptance: the manifest test and `label-effect` test pass with rows that match the build. Deps: ER-A05, FH-5, FH-6. M. Owner: privacy and mobile. NOT: N8; editing `docs/legal/**`.

**ER-B13 (BL-1266)** Settings switch and the disclosure line. A switch in Settings, Privacy that turns usage counts off and on (the withdrawal path of ER-A09); under `collect_by_default` it is a gate for the policy, not an extra: that value cannot be used while the switch is absent. The founder decides the switch and its place (FH-11). The in-app disclosure line is a placeholder key `analyticsDisclosure` with value `CONTENT-NEEDED (founder wording)`; the existing consent keys stay for `ask_first`. PRIV-R21 lines for the switch: Shown = the disclosure line and the switch label with the version; Records = the choice and the random id on the phone (no server row without a yes under `collect_by_default`; counsel must confirm); Never = the content and names of the global NOT list, a location, a join to an account; Decline = switching off stops everything new, every feature works. Acceptance: tests that the switch exists whenever the resolved policy is `collect_by_default`, that off persists across relaunch, that no consent sheet mounts under that policy, and `rules.test.ts` passes on the final words. Deps: ER-A03, FH-4. M. Owner: mobile with content. NOT: N1; copy that promises deletion (F-1 to F-4).

**ER-B14 (BL-1267)** Ask sequencer and sheet under `ask_first`. The sequencer shows the consent sheet only when the resolved policy is `ask_first` (C1 and C2 of #1091: wording FH-4, key check). Acceptance: `analyticsAskDue` is false under `collect_by_default`; the two-offer cap holds under `ask_first`. Deps: ER-A03. S. Owner: mobile. NOT: counting a dismissed sheet as a yes.

## 7. Gate row

**ER-G01 (BL-1268)** Throwaway-project verification, one pass (`posthog-standard.md` 6.3): colon names in trends, funnel, retention and HogQL; retention on anonymous events; offline retry; the real `$exception` payload; a deliberate crash on a test build; withdrawal then on gives a new id and nothing in between; the IP discard setting and the GeoIP transformation are on (setup pack step 9). Acceptance: results recorded in `docs/analytics/instrumentation/` evidence note, tokens never in it. Deps: ER-A05, ER-B04, FH-1. S. Owner: qa with analytics. NOT: real family data (Asha only); a production token.

Existing rows this work depends on, not repeated: BL-1139 (the three date-bearing throws), BL-1060 (deletion drill), BL-1061, BL-1062, BL-1063 (retention), BL-1058 (data map), BL-1066 (label, policy, subprocessors, `PrivacyInfo.xcprivacy`), BL-1142 (release-gate checks). BL-1050 to BL-1057 are the design-level rows of the same work; these rows are the executable split, and Karma should mark the overlap when ready.

## 8. Sequence and definition of done

Waves (days are [E]; each wave's rows run in parallel across the two streams):

| Wave | Stream A | Stream B | Exit |
|---|---|---|---|
| 0 | ER-A00 (Karma lifts HELD), ER-A01, ER-A18 | ER-B01 starts once P2 lands | contract frozen |
| 1 | ER-A02, ER-A04, then ER-A03 | ER-B02, ER-B11 | policy and tiers in code, old V15 case kept |
| 2 | ER-A05, ER-A06, ER-A07, ER-A10 | ER-B03, ER-B04, ER-B07 | one event end to end on a dev build |
| 3 | ER-A08, ER-A09, ER-A11, ER-A13, ER-A15, ER-A16, ER-A17 | ER-B05, ER-B06, ER-B08, ER-B10, ER-B14 | all events wired, canary green |
| 4 | ER-A12, ER-A14 | ER-B09, ER-B12, ER-B13, ER-G01 | gate checklist section 10 |

Critical path: ER-A00, ER-A01, ER-A03, ER-A05, ER-A06, ER-B10, ER-G01 [E: about 10 working days with two engineers, longer if FH-1, FH-5 or FH-6 are late].

Definition of done, every row: the named test or device check passes; `npm test` and `npm run typecheck` green; content rules and the no-real-family-data guard green; fewer than 400 lines and 20 files per PR (or a stated size exception); the PR body has one `Tracking:` line; no new dependency without FH-6; privacy review on any row touching consent, identity, `before_send`, the manifest or Settings; the row status in `docs/BACKLOG.md` is the only backlog edit.

## 9. Where sources disagree, and what I could not verify

Disagreements to settle (each has a recommended default in section 11):
1. Reverse proxy: `posthog-standard.md` 3.7 says default yes; the setup pack step 11 says default no [V both]. [Rec] no for the first production build.
2. `REQUIRED_PROJECT_SETTINGS` in #1086 says "US recommended" and "retention 12 months or less"; the standard leaves region to counsel and free retention is 1 year.
3. Unknown error class: standard `other`, code `Error`; the standard also describes a cap and `reportFault` that do not exist (ER-A11).
4. Standard row fields vs `RegistryRow` fields; V8 exemptions; `grandfathered` and `heldNames` unknown to the standard (ER-A07).
5. The new founder words vs "nothing before a yes" in the standard, `analytics.md` 1a, E95 as drafted and the V15 text; the standard needs an edit in the PR that lands ER-A03 (mine, not done here).
6. The label and policy now say no analytics (PRIV-R17): the flag must not go on first (section 10).

Unverified: the real `$exception` field names; whether the SDK deletes its `file` store on reset; offline retry and queue overflow; colon names in the PostHog UI; retention on anonymous events; the billing limit without a card; the exact project setting that discards client IP; the region signal; the file names inside #1086 beyond what reviews cite; the device test sheet row ids; whether `$session_id` is accepted by privacy.

## 10. Pre-production-build gate checklist

The production readiness build does not start until each line is true or the founder signs a written exception.

1. D-163 merged and the new founder words recorded as a decision, E95 amended (FH-12).
2. ER-A00 to ER-A18 and ER-B01 to ER-B14 done or explicitly deferred with the feature off.
3. `basicsPolicy` resolves `ask_first` in `eas.json` production, and the test pins it; flipping to `collect_by_default` is its own PR after founder and counsel confirm (counsel must confirm).
4. The old "nothing before a yes" test survives as the `ask_first` case; the replaced build test is green.
5. Settings off switch exists and works (ER-B13) whenever `collect_by_default` is possible.
6. Canary green over every helper and `$exception` (V14); V1 to V18 green.
7. No entry text, transcript, audio or child name in any event, property, log or crash report: grep and canary evidence attached.
8. No autocapture, replay, surveys, flags or lifecycle events (V17).
9. `posthog-react-native` 4.87.1 approved (FH-6); the native plugin absent.
10. Crash capture off unless the founder says yes (FH-13); if on, ER-A11, ER-A12 and BL-1139 are done.
11. PostHog account, one project, no card, project key as an EAS variable (FH-1); `phc_` check passes; region chosen (FH-2).
12. IP discard and GeoIP transformation confirmed on, screenshots in the runbook.
13. Throwaway-project verification passed (ER-G01); deletion drill (BL-1060) passed or the deletion sentence removed (F-2, F-3).
14. Deletion coverage for never-consented installs tested (ER-A17).
15. Subprocessor row and data-map rows (BL-1058, BL-1066 for IN-DS-09) done; PostHog DPA signed by the founder (counsel must confirm).
16. Release-gate rewrite done (BL-1142, IN-ops-04): "analytics only behind the policy", not "no analytics SDK in a store bundle"; preflight scripts updated (ER-A14).
17. Privacy Policy, App Store privacy label and `PrivacyInfo.xcprivacy` changed to say what the build does, before the flag goes on (PRIV-R17): Usage Data, not used for tracking; linked or not is Q-005 (FH-5). The S17 worksheet re-run. Counsel must confirm.
18. LEGAL-REQ-043 test updated by its owner through review in the same PR as the manifest.
19. No Apple tracking prompt; Data Used to Track You stays empty.
20. Event budget read: at 60 percent of the 1,000,000 monthly cap, `decision-science` and `ops` decide on sampling [E].

## 11. Founder decisions, each with a recommended default

Founder hands (FH): FH-1 PostHog account and project key; FH-2 region; FH-3 basics policy and regions with counsel (Q22); FH-4 consent and disclosure wording; FH-5 App Store label, S17 worksheet, manifest approval; FH-6 dependency approval; FH-7 `eas.json` production flip (D1); FH-8 reverse proxy and DNS; FH-9 personal API key for source maps; FH-10 internal-tester switch; FH-11 Settings switch; FH-12 record the new words as a decision, amend E95 (CPO, merged under D-132); FH-13 native crash plugin and crash capture; FH-14 the `.github` job for the tracking line.

| Decision | Recommended default |
|---|---|
| PostHog account (FH-1) | Create PostHog Cloud free, no card, one project named plainly; the founder types his own password and code; never run the PostHog wizard (it rewrites code) |
| Project key (FH-1) | `phc_` key as an EAS plaintext variable for `preview` and `production`; never a `phx_` key in the app; personal API keys only in build secrets |
| Region (FH-2) | US if the first release is US-only (Q22 says "Live (US only)" [V]); EU host and `ask_first` if EU or UK storefronts open; treat as permanent [U: no documented move] |
| Basics policy (FH-3) | `ask_first` everywhere until counsel answers; then `collect_by_default` only where counsel agrees, `ask_first` for EU and UK. Counsel must confirm no-consent basics, regions and the install id on the device |
| Consent wording (FH-4) | Setup pack 1.1 for `ask_first`; the `collect_by_default` disclosure line stays `CONTENT-NEEDED` until the founder writes it |
| Reverse proxy (FH-8) | No for the first production build; revisit if sessions and events diverge; the host override stays coded but off |
| S17 label (FH-5) | Usage Data (Product Interaction, Other Usage Data), not used for tracking, "not linked" as the default pending Q-005; diagnostics only if crash capture is on |
| Settings switch (FH-11) | Yes, and required before `collect_by_default` can be used |
| Perf events in basics | No until ruled; they stay `consented` |
| Native crash plugin (FH-13) | No; Apple's crash reports are the baseline; crash capture stays off |
| Source-map key (FH-9) | Defer; not a gate while crash capture is off |

Signed: Analytics Engineer, 21 Nov 2026.
