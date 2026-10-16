# F18 Analytics and the learning loop

| | |
|---|---|
| Release | v1.0 gate (the learning loop runs from the first beta cohort; its absence never blocks a release) |
| Priority and rank | P0, rank 19 (`05-feature-map.md` section 2) |
| Personas | P1, P2 (as people who choose to share or not); the founder and agents as readers |
| Existing IDs | PRD-REQ-001, PRD-REQ-016, PRD-REQ-017, PRD-REQ-018, C-REQ-034, C-NFR-005, C-NFR-009, B-NFR-001, A-NFR-002, A-NFR-012, LEGAL-REQ-003, LEGAL-REQ-012, LEGAL-REQ-014, LEGAL-REQ-015, LEGAL-REQ-016, LEGAL-REQ-017, LEGAL-REQ-029, LEGAL-REQ-031, LEGAL-REQ-033, LEGAL-REQ-043, DATA-REQ-004, DATA-REQ-033, DATA-REQ-062, K-01, D-003, D-070, D-080, D-081, ADR 0008, BL-020, BL-021, BL-023, BL-024, BL-235, BL-239, BL-250, BL-251, BL-252, BL-319 |
| Depends on | F17 (Privacy switch, account deletion hook), F02 (ask sequencer, queued consent acts), F14 (on-device purchase events; App Store Connect as purchase source), F16 (sync health counts), F19 (signed config; no analytics keys by design), every feature that fires events (their section 10) |
| Status | Draft V2, 13 Oct 2026. Code checked on `docs/prd-v2` rebased on `origin/develop` at 6482cd3. Revised 14 Oct 2026 after critique round 1: an App Store Connect business number that needs no consent, letters made versus kept, M17, renamed duplicate IDs (disposition in `reviews/DISPOSITION-C.md`) |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney.

> **Build state that shapes this spec.** Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9 (4 Oct, "v1.0 ships on this phone only"). On 13 Oct every build profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`, `apps/mobile/.env.development`); off means no Supabase client, no sign-in, no sync and no account deletion (`apps/mobile/src/lib/capabilities.ts`). The release profiles flip to `on` per M14 and the switch stays as the kill path. This spec marks every requirement that needs our server with **[server]**; all of them are v1.0. A build with the switch off runs only the device rows.

## 1. Why

- [D] The founder decided full opt-in PostHog analytics at launch, Sentry crash reports on the same consent, and server aggregates for business totals (D-003, B10). B10 adds a learning loop: agents read the data, write findings and propose backlog items. Insights agents never push (D-070).
- [F] App Review 5.1.1(ii) requires consent before collecting usage data "even if anonymous", forbids making paid features depend on it, and requires easy withdrawal (R4 section 5, R4-S55; CR-082 in LEGAL-REQ-003).
- [F] Most category leaders declare "Data Used to Track You" on their App Store labels; Dearest and Apple Journal declare nothing linked (R1 section 0 item 9, R1 F18). A label with no tracking section is visible proof of B9 (`03-goals-and-principles.md` PS4).
- [D] B2 removed every server purchase table. M6 (D-080, D-081) adds a status report (plan, trial end, renewal date, cancelled flag) for one purpose: California auto-renewal reminder emails. App Store Connect (ASC) stays the source for trials, conversions, renewals and refunds (`03-goals-and-principles.md` section 4; F14).
- [F] `packages/analytics` holds the typed catalogue (68 events, `SCHEMA_VERSION` 4), fail-closed validation, consent with a random id, a 1 MB in-memory queue, a 60 s flush and the insights engine, with 107 `it` or `test` blocks across 9 test files (`packages/analytics/src/catalog.ts`, `client.ts`, `test/`; counted 13 Oct). Tests were not run in this session (no `node_modules` in the checkout).
- [F] The app side is wired: `startAnalytics` and `startAnalyticsObservers` run after the first frame, `useScreenViews` and `AnalyticsConsentAsk` are mounted in `apps/mobile/src/app/_layout.tsx`, and the PostHog SDK is loaded by dynamic import only after a yes (`apps/mobile/src/lib/analytics/index.ts`, `posthog-sdk.ts`). BL-250 is done. 55 of 68 events have an emitter; 13 have none (section 10).
- [F] Since 15 Oct `develop` carries PR #118: a build switch `EXPO_PUBLIC_ANALYTICS`, off in every `eas.json` profile (`apps/mobile/src/lib/capabilities.ts` `analyticsEnabled()`), under which there is no consent sheet, no Privacy switch and no PostHog client even if a key is set. It implements D-095 of PR #122 (delegated by the founder: no analytics SDK in v1.0; it returns with consent in v1.1). This spec is written for a build with that switch on; whether v1.0 ships it on or off is Q9 (section 13). Until the founder answers, the code default (off) stands.
- [F] Sentry is not in the app: no dependency in `apps/mobile/package.json`, no initialisation anywhere (grep, 13 Oct). The privacy label draft already answers Crash Data "No" for v1.0 (`docs/legal/app-store-privacy-labels.md` 1.3.0, section 1.2).
- [A] About 40% of users will consent (PRD 7.8 assumption). Device numbers describe consenting users only and lean towards the engaged (`docs/analytics/TRACKING_PLAN.md` 1.4).

## 2. Who

| Reader or actor | Moment | What they hold | What F18 must do |
|---|---|---|---|
| P1 Evening parent | A later session after the first letter, the consent sheet | A phone, a tired evening | One calm question, two equal buttons, nothing preselected, no effect on anything else |
| P2 Co-parent | Their own install | Their own choice | Their own consent and id; never joined to the other parent |
| Founder | Monday morning, 15 to 20 hours a week for the product (ROADMAP assumption, R-04) | No time for dashboards | One weekly findings page with numbers, sources and at most 3 proposals |
| Agents (insights role) | Weekly scheduled run | Aggregates only | Read-only inputs, a fixed output in the working tree, a human gate |
| Analytics engineer | Adding an event | The catalogue and plan | One process, tests that fail on drift (TRACKING_PLAN 6.5) |

## 3. What we are solving

**Outcome:** the founder learns what helps families keep letters, every week, from content-free numbers that only consenting people send, without one feature depending on consent and without a single purchase record or letter reaching our analytics.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Requests to PostHog or Sentry before consent | 0 | Network capture E2E (BL-239, blocked by BL-275) | None |
| Events or files queued on disk before consent | 0 | Container scan after a fresh install through first letter (BL-252) | None |
| Fixture strings ("Asha", fixture letter, dictionary words) in any analytics or crash payload | 0 | Log canary (LEGAL-REQ-014) | None |
| Feature difference by consent | 0 | QA matrix: every feature with consent declined (03 section 4.3) | None |
| Analytics consent rate among signed-in accounts | Watch only; 40% assumed (PRD 7.8) | Server aggregate of `analytics` acceptances **[server]** | Signed-in only; not measurable in a server-off build |
| Weekly findings page delivered | 1 per week from beta C1 | A new `docs/insights/YYYY-MM-DD.md` committed by the coordinator | n/a |
| Proposals accepted into the backlog | Watch only | Count of proposals copied into `docs/BACKLOG.md` | n/a |
| Events per active consenting user per month | 190 or fewer (TRACKING_PLAN 5.1 estimate) | PostHog monthly total / consenting MAU | Consenting only |
| Paying families per first-time download, by install week (the business number, R1 PL-17) | 5% by week 8 [A] (03 section 4.4) | ASC only: paid subscriptions started by install-week cohort over first-time downloads that week, typed into the weekly report by the founder (F18-REQ-025) | None: Apple's own data, no consent needed |

## 4. Scope

**In v1.0**
- Opt-in PostHog analytics behind one consent (`analytics` document), asked as the third ask after the first letter (PRD-REQ-001), changeable in Settings > Privacy (F17).
- Nothing constructed, queued or written before consent: the PostHog SDK is not loaded until the person says yes, and runs with `persistence: 'memory'` after (built).
- Sentry crash reports on the same switch **if** Sentry ships in v1.0 (Q2). Until then the app has no crash channel of its own; ASC and Xcode Organizer crash data are the release gate (D-003, TDD 06 P-7).
- The typed, content-free catalogue in `packages/analytics` as built, plus the events sibling specs add (section 10), every property L2.
- Volume caps: 1 MB queue, 60 s flush, flush on background (built); a per-id daily cap (new); deterministic sampling with rates fixed in the build (built mechanism, empty rates); a PostHog project billing limit (founder setting).
- Withdrawal within the session; a new id on re-grant; deletion of the analytics ids at account deletion request time through `analytics-forget` **[server]**; a deletion path for people with no account (new, Q3).
- Server aggregates of counts with no purchase data **[server]** (PRD-REQ-017 Rev B2), cells under 10 suppressed (built).
- ASC and Xcode Organizer as the source for installs, purchases, refunds and the crash-free rate (D-003).
- Metric definitions for every metric in `03-goals-and-principles.md` section 4 (section 6.5).
- The learning loop as built: a weekly snapshot run, an insights agent with fixed inputs and outputs that writes to the working tree only, guardrails, and the founder's gate (D-070, section 6.6).

**Later**
- On-device MetricKit summaries for consenting users (TDD 06): v1.1 candidate.
- Pricing tests with arms: not at v1.0 (`plus_offer_viewed.arm` was removed from the catalogue, TRACKING_PLAN 2).
- Agents reading Sentry stack traces to propose fixes: v1.1, after a month of clean scrub evidence.
- An ASC subscription CSV reader for the weekly report (aggregate, no subscriber ids; INSIGHTS_LOOP 7 item 3).
- The consent-bias split (TRACKING_PLAN 1.4) as a reviewed, k-anonymised query **[server]**.

**Never**
- Session replay, autocapture, screen capture, touches, heatmaps, surveys (ADR 0008, LEGAL-REQ-017).
- Person properties beyond the random id; email, Supabase user id, device id, IDFA or IDFV as the id (LEGAL-REQ-016, -017).
- A server table that stores an analytics id next to a profile (`app-store-privacy-labels.md` 1.3 condition 2).
- Purchase data in any server aggregate. The M6 status table is never read by the insights loop unless counsel approves that second purpose (Q5).
- Any event timed by a child's birthday or due date (TRACKING_PLAN 6.4).
- Analytics settings, sampling rates or an analytics on or off switch in remote config (B14: nothing server-driven may change data collection; ADR 0016 5.3).
- Agents changing config, code, the catalogue or backlog order; agents committing, pushing or opening pull requests (D-070); agents reading per-person rows.
- Using analytics to target messages at a person (no person-level actions exist).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Dearest | Label: no tracking; only data not linked (purchases, identifiers) [F] R1-S3 | 5.0 (1) | n/a | **Match** a label with no tracking section [R] |
| Apple Journal | Label: no tracking; identifiers and usage not linked [F] R1-S5 | 4.8 | n/a | **Match** [R] |
| The Days We Keep | Label: no tracking; contact and content not linked [F] R1-S35 | n/a | n/a | Neutral |
| Rosebud, FirstChapter, Notabli | No tracking; usage or identifiers linked [F] R1-S33, R1-S4, R1-S7 | n/a | n/a | Neutral. Our label may also say Linked (Q-005, counsel default); linked is not tracking |
| Qeepsake | Declares Usage Data used to track [F] R1-S1 | 4.9 | n/a | **Avoid** [R] |
| Day One, Tinybeans, 23snaps, Calm and others | Declare "Data Used to Track You" [F] R1 section 0 item 9 | n/a | 29 of 80 positive reviews (36%) name privacy, coded from short paraphrases of reviews Apple chose to show, so directional only [S] R2 section 0 item 2, 1.2 (R3 DX-28) | **Avoid**; an empty tracking section is our proof [R] |
| Calm | An analytics vendor's case study reports that 40% set a reminder when asked after the first session and that those users retained 3x better; the causal reading is the vendor's [S] R1-S57 (R3 DX-32) | Vendor marketing, not a study | n/a | **Match** the practice of measuring ask timing (DR-12), with opt-in data only [R] |

## 6. Experience

### 6.1 Entry points

| Where | What | Built? |
|---|---|---|
| Consent sheet, third ask, later session after the first letter, on a tab root after 1.2 s of rest | `AnalyticsConsentSheet` through `AnalyticsConsentAsk` | Built (`apps/mobile/src/components/consent/consent-ask.tsx`, `analytics-consent-sheet.tsx`) |
| Settings > Privacy, "Share usage" switch | Same switch as the sheet | Built (`apps/mobile/src/app/settings/privacy.tsx`) |
| Settings > Delete account **[server]** | Sends retained ids to `analytics-forget` | Built (`apps/mobile/src/lib/account-deletion/use-account-deletion.ts`) |
| Settings > Privacy, "Delete shared usage data" (no account) | Asks for deletion of this phone's ids | Not built (Q3) |
| Weekly insights run (founder's scheduler) | `npm run insights -w @scribe/analytics` then the agent prompt | Engine built; schedule not created |

### 6.2 Happy path

**A. Consent.**
1. Asha's parent saves a first letter tonight. No sheet appears in this session (`analyticsConsentDue`, `packages/analytics/src/consent-timing.ts`).
2. Next evening, after resting on Tonight for 1.2 s, the sheet rises: `analyticsConsent.title` "Help us make it better?", `body`, `detail`, `changeLater`, two buttons `yesButton` "Share usage" and `noButton` "Don't share". Nothing is preselected (keys exist in `packages/content/src/strings.en.ts`).
3. Yes: `grantAnalytics('consent_sheet')` stores `granted`, makes a new random UUID (`expo-crypto`), loads `posthog-react-native` by dynamic import with that id bootstrapped and the options from `buildPostHogOptions`, sends `analytics_opted_in` with first-run buckets, and calls the registered consent recorder. No: `declineAnalytics()` stores `denied`; the SDK is never loaded.
4. From then on, screens call typed helpers (`@/lib/analytics/track`). Each event is validated, gets `schema_version` and `child_count_bucket`, and sits in memory until the 60 s flush or the app going to the background.

**B. Withdrawal.**
1. Settings > Privacy, the switch off. `withdrawAnalytics()` clears our queue, stops an in-flight batch (the epoch check in `client.ts`), calls `optOut()` and `reset()`, empties the SDK queue and retires the id (kept on the phone, at most 20, only for deletion).
2. The switch on again later creates a different id. The two periods cannot be joined.

**C. Deletion [server].**
1. Settings > Delete account > Confirm. The app sends `account_deletion {stage: confirmed}` (the last event for that id), withdraws, then POSTs current and retired ids to `analytics-forget/v1`. On 202 it calls `forgetIds()`.
2. The function calls PostHog `persons/bulk_delete` with `delete_events: true` and stores nothing (`supabase/functions/analytics-forget/handler.ts`).

**D. Weekly loop.**
1. Monday, the founder's scheduler runs the insights agent prompt (INSIGHTS_LOOP 6, amended per F18-REQ-024).
2. `scripts/insights/run.ts` reads HogQL counts with a Query Read key and `insights_aggregates()` with the `insights_reader` role **[server]**, computes metrics, findings and ranked proposals, refuses content (`assertContentFree`), and writes `docs/insights/YYYY-MM-DD.md`.
3. The agent writes at most 3 files in `docs/backlog/proposals/` in the working tree and reports. It does not commit, push or open a pull request (D-070).
4. The coordinator commits; the PM lead accepts a proposal into `docs/BACKLOG.md` or marks it declined.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F18-U01 | Offline after consent | Events stay in the memory queue; flush fails quietly; next flush retries | Nothing | Automatic | Unit: provider throws, queue kept |
| F18-U02 | App killed or crashes before a flush | Up to 60 s of events lost (memory persistence by design) | Nothing | None needed | Documented loss; no disk file after kill (BL-252) |
| F18-U03 | Withdraw while a flush is in flight | Epoch changes; the batch stops before the next capture; SDK queue cleared | Switch shows off at once | n/a | `analytics.test.ts` guarantee 4 |
| F18-U04 | Build without `EXPO_PUBLIC_POSTHOG_KEY` (ROADMAP cut, dev, CI) | Provider is a no-op | Today the sheet still appears and a yes sends nothing. Required: no sheet, and the Privacy switch hidden (F18-REQ-004) | n/a | Unit on `analyticsAskDueNow` with no key |
| F18-U05 | PostHog returns 5xx or times out | SDK errors are caught by `guard`; app unaffected | Nothing | Next flush | Fake provider |
| F18-U06 | Queue passes 1 MB (long offline session) | Oldest events dropped first; `queue_overflow` counted, no values | Nothing | n/a | `analytics.test.ts` |
| F18-U07 | A screen sends a wrong value in production | Event dropped (fail closed); violation counted by kind; dev builds throw | Nothing | Fix the call site | `validate.ts` tests |
| F18-U08 | Under-18 answer at sign-in **[server]** | `stopAnalyticsForUnder18()` revokes quietly; nothing about the answer is sent | The 18+ stop screen (F01) | n/a | Observer test |
| F18-U09 | Consent sheet dismissed without an answer | Still undecided; offered at most once more, in a later session (`MAX_ANALYTICS_CONSENT_OFFERS` 2) | Nothing more | Settings > Privacy | `ask-sequencer.logic.test.ts` |
| F18-U10 | Deletion requested offline, or `analytics-forget` fails **[server]** | Deletion proceeds; ids stay on the phone and are retried until a 202 (F18-REQ-019) | Nothing extra | Automatic retry | Fault injection |
| F18-U11 | More than 20 consent periods on one phone | Oldest retired id dropped (`MAX_RETIRED_IDS` 20); its events age out at PostHog retention (12 months, Q26 default) | Nothing | Retention | `consent.ts` test |
| F18-U12 | Person with no account wants their usage data deleted | No path today (`analytics-forget` needs a user JWT) | Today nothing. Required: a row (F18-REQ-021) | Q3 | n/a until built |
| F18-U13 | Sentry initialised before consent (regression) | Must not happen; CI fails the build (F18-REQ-008) | Nothing | Revert | Static check plus network capture |
| F18-U14 | Two phones, one person; or two co-parents | Each install has its own consent and id; never joined | Each sees their own switch | n/a | Manual |
| F18-U15 | Double tap on Share usage | Sheet buttons and the switch are disabled while busy; one grant, one id | One state change | n/a | Component test |
| F18-U16 | VoiceOver, AX5 text, Reduce Motion on the sheet | Both buttons reachable, equal weight, no truncation; no motion beyond the system sheet | Readable sheet | n/a | A11y snapshot at AX5 |
| F18-U17 | iPhone SE 3 memory pressure | Queue capped at 1 MB; SDK not loaded without consent | Nothing | n/a | Device run (C1) |
| F18-U18 | Phone clock wrong | PostHog stamps events client side; server aggregates use `least(captured_at, created_at)` | Nothing | n/a | Insights uses server weeks |
| F18-U19 | A weekly cell under 10 | Suppressed in SQL, in HogQL (`HAVING people >= 10`) and in the engine; shown as unknown, never zero | Report says unknown | n/a | `insights.test.ts` |
| F18-U20 | Insights credentials missing or a HogQL query rejected | Run fails with status and query name only | Agent reports the error line | Founder fixes keys | Runner test |
| F18-U21 | Insights agent tries to commit or open a pull request | Forbidden by the prompt and by the scheduler's token scope (no push permission) | n/a | Coordinator commits | Prompt text check (F18-REQ-024) |
| F18-U22 | A report contains something shaped like an email, UUID, URL or a fixture name | `assertContentFree` refuses the report | Agent reports "content guard" without quoting | Fix the query | `insights.test.ts` |
| F18-U23 | A co-parent's events and the other parent's in one book | Children appear only as ordinals and buckets; no book or family id exists in any event | n/a | n/a | Catalogue test |

### 6.4 Volume caps

| Cap | Value | Where | Status |
|---|---|---|---|
| Queue size | 1 MB of JSON, oldest dropped first | `DEFAULT_MAX_QUEUE_BYTES`, `packages/analytics/src/client.ts` | Built |
| Flush interval | 60 s in the foreground, plus on background | `DEFAULT_FLUSH_INTERVAL_MS`; `lifecycle.background()` | Built |
| SDK timers and disk | `flushInterval: 0`, `persistence: 'memory'` | `REQUIRED_POSTHOG_OPTIONS`, `posthog.ts` | Built |
| Per-id daily cap | 200 events per analytics id per local day; beyond it every event except `analytics_opted_in` and `account_deletion` is dropped and counted as `daily_cap` [A: about 30 times the 6 a day TRACKING_PLAN 5.1 implies] | `client.ts` (new) | Not built |
| Sampling | Deterministic per id and event; `sample_pct` on kept events; rates fixed per build in `apps/mobile/src/lib/analytics/index.ts` (empty at launch) | `client.ts` | Mechanism built; rates come from the build, not remote config (F18-REQ-016) |
| PostHog billing limit | A monthly event limit set in the PostHog project [U: setting name and behaviour at the limit not checked] | PostHog UI, founder | Not set |

### 6.5 Metric definitions (03 section 4)

Sources: **S** server aggregate **[server]**, **D** device analytics (consenting only), **ASC** App Store Connect. A server-off build feeds no S metric: every S row below stays blank until the release profiles turn the switch on (M14), and in any kill-path build.

| 03 metric | Definition | Source and view or events | Server-off build |
|---|---|---|---|
| North star WKF | Families with 1 or more letters (not a quiet-day mark, not deleted, in a live book) in the ISO week | S `insights.weekly_keeping_families` | Not measurable. Proxy: D weekly people with `letter_saved` (consenting only; never presented as WKF) |
| Activation: median time to first letter | Median bucket of `time_to_first_letter` on `analytics_opted_in` (buckets `lt_90s` to `gt_24h`) | D | Same |
| Activation: share of installs passing 18+ and saving a letter in 24 h | Lab and C1 observation only at v1.0; no field target (R1 PL-16). Field proxy, labelled as such: accounts created over ASC first-time downloads, by week | Lab; S + ASC for the proxy | Proxy only |
| Keep the book: account by day 7 | First-letter users with an account by day 7 | S `first_letter_conversion` | Not applicable (no accounts) |
| Habit: letters on 2 or more days within 14 days | Distinct days with `letter_saved` per id in 14 days from the first | S `retention_cohorts` (weeks, not days); D for days | D only |
| Two voices by day 30 | Books with a second author | S `letters_per_active_family.families_two_plus_voices` | Not applicable (no co-parent) |
| Retention week 4 and month 6 | Active writers in week offset 4 and 26 over the cohort | S `retention_cohorts` | D proxy: ids with `letter_saved` in week 4 over ids with a first `letter_saved` (ids reset on re-grant; label as device) |
| Reminders | `letter_saved{from_notification_2h: true}` / `notification_opened{type: letter_reminder}` | D | Same |
| Read together | Ids with `read_together_started` / ids with `app_opened` in the month | D | Same |
| Plus | Trial starts, trial to paid, annual share, refunds | ASC subscription reports | Same |
| Business number | Paying families per first-time download by install week (section 3) | ASC only | Same |
| Letters made versus letters kept (R1 PL-15) | Made: every saved or held letter, including those held at the Keep step and voice-only letters waiting for words. Kept: letters that went past the Keep step. Habit metrics use made; WKF stays kept. Free letters count only kept letters with words seen or typed (M17), which is F14's ledger, not an analytics number | D `letter_saved` plus F14's held event (name owned by F14, request) | D only |
| Guardrail: lost content | Support tickets tagged lost content (F20) | Support log | Same |
| Guardrail: crash-free sessions | ASC and Xcode Organizer crash rate | ASC | Same |
| Guardrail: machine edit revert rate | `machine_edit_reverted` / sum of `letter_saved.machine_edit_count` | D | Same |
| Guardrail: author correction rate per language | Computed on device, bucketed (F05) | D `letter_saved` buckets | Same |
| Guardrail: reminders muted | `reminder_schedule_set{cadence: off}` or `{paused: true}` per month | D | Same |
| Guardrail: paywall outside triggers | `plus_offer_viewed.trigger` not in the C-REQ-023 list | D | Same |
| Guardrail: feature difference by consent | QA matrix | QA | Same |

### 6.6 The learning loop as built

| Part | Path | Status |
|---|---|---|
| Server views, k = 10 | `supabase/migrations/20261004300000_insights_aggregates.sql`, `supabase/tests/insights_aggregates.test.mjs` | Built; not applied to production (APPLY.md); empty in a server-off build |
| HogQL queries with `HAVING people >= 10` | `packages/analytics/src/insights/hogql.ts` | Built; HogQL function names Unverified until the first real run (INSIGHTS_LOOP 4.3) |
| Engine, renderer, content guard, synthetic input | `packages/analytics/src/insights/` | Built, not exported to the app bundle |
| Runner | `scripts/insights/run.ts` writes `docs/insights/YYYY-MM-DD.md` | Built |
| Weekly agent prompt | INSIGHTS_LOOP section 6 | Partly built: step 7 tells the agent to open a draft pull request, which D-070 forbids |
| Schedule and credentials | Founder (`POSTHOG_PERSONAL_API_KEY` Query Read, `SUPABASE_INSIGHTS_TOKEN`) | Not built |
| Proposal folder | `docs/backlog/proposals/` | Does not exist yet; created by the first run |
| Security review L12 (nested `k_part` subtraction) | `docs/reviews/2026-10-04-security-privacy.md` | Open |

### 6.7 Screen states

| Screen | Empty | Loading | Error | Offline | AX5 (SE 3) | VoiceOver |
|---|---|---|---|---|---|---|
| Consent sheet (`analyticsConsent.*`, exists) | n/a | n/a | The consent recorder fails offline: the choice applies on the phone at once and the record uploads later (F18-REQ-004) | Identical | Buttons stack, equal weight; text scrolls | Title, body, detail, Share usage, Don't share |
| Settings > Privacy, Share usage switch | Hidden in a build with no PostHog key (F18-REQ-003) | n/a | n/a | Identical | Label and help wrap | Switch reads label, state and help |

## 7. Requirements and acceptance criteria

Renamed on 14 Oct 2026 (R5 EQ-05): F18-REQ-027 and F18-REQ-028 replace rows that restated PRD-REQ-001 (home F02) and LEGAL-REQ-014 (home F17). F18 stays the home of LEGAL-REQ-003, PRD-REQ-016, -017, -018 and C-NFR-005.

Status: **Built** (file), **Partly built**, or **Not built**, checked in code on 13 Oct. **[server]** needs our server and is v1.0 (M14); built code behind the switch is "Built, switch off in release profiles" until the profiles flip.

| ID | P | Requirement | Acceptance criteria | Status | Source |
|---|---|---|---|---|---|
| LEGAL-REQ-003 | P0 | Analytics and crash reports are opt-in; declining changes nothing; withdrawal is immediate | Given a fresh install through record, save and read of a first letter, Then a network capture shows 0 requests to PostHog or Sentry hosts. Given decline, When every feature is used for a week (QA matrix), Then 0 analytics requests and 0 feature differences | Partly built: PostHog gating built (`apps/mobile/src/lib/analytics/index.ts`); Sentry absent; the network-capture E2E is blocked (BL-239, BL-275) | CR-082 |
| F18-REQ-027 | P0 | Analytics consent follows the ask order (analytics slice of PRD-REQ-001; home F02, which defines a session and the order): analytics is the third ask, after the first letter, never stacked, never during recording, review or export | Given the sequencer facts, Then the sheet is due only in a later session than the first letter, only on a tab root, at most once per session and at most 2 offers in total | Built (`apps/mobile/src/lib/analytics/ask-sequencer.logic.ts`, `components/consent/consent-ask.tsx`, `packages/analytics/src/consent-timing.ts`) | K-01, K-02 |
| PRD-REQ-016 | P0 | One typed, content-free catalogue for the whole product | Given `catalog.ts`, Then TRACKING_PLAN 3.1 regenerates with no diff and the schema fingerprint test passes | Built (`packages/analytics/src/catalog.ts`, `test/catalog.test.ts`, `test/schema-version.test.ts`) | K-01 |
| PRD-REQ-017 Rev (B2, M6) | P0 | Server aggregates count families, books, letters, invites and retention, with no purchase data and no cell from 1 to 9 **[server]** | Given the fixture database, Then every published count is 0 or 10 or more, and no view reads any subscription or status table | Built, not applied (`supabase/migrations/20261004300000_insights_aggregates.sql`, `supabase/tests/insights_aggregates.test.mjs`); L12 open | B2, D-080 |
| PRD-REQ-018 | P0 | Off stops sending within the session; deletion asks PostHog to delete the ids' events **[server]** for the deletion half | Given consent then the switch off, When 10 events are tracked, Then 0 reach the provider and the queue length is 0. Given a deletion request, Then `analytics-forget` receives every current and retired id before `forgetIds()` | Built (`packages/analytics/src/client.ts` revoke; `apps/mobile/src/lib/account-deletion/use-account-deletion.ts`) | K-01 |
| LEGAL-REQ-017 | P0 | Allowlist enforced in our client and again in `before_send`; replay, screen capture and touches off; `defaultOptIn` false | Given an unknown property, Then it is dropped and a dev build throws. Given the options object, Then the values in `REQUIRED_POSTHOG_OPTIONS` hold and `FORBIDDEN_POSTHOG_OPTIONS` are absent | Built (`packages/analytics/src/validate.ts`, `posthog.ts`, `test/posthog.test.ts`) | ADR 0008 |
| LEGAL-REQ-012 | P0 | SDK device fields limited to app version, build, OS name, OS version and device type | Given a captured payload, Then `$device_name`, `$locale`, `$timezone`, `$set` and `$set_once` are absent | Built (`keepAllowedAppProperties`, `posthogBeforeSend`) | CR-088 |
| F18-REQ-028 | P0 | No content in analytics, crash reports or function logs (analytics slice of LEGAL-REQ-014; home F17) | Given the E2E suite at debug level, Then 0 fixture strings in payloads or logs | Partly built: function log canary (`supabase/functions/_shared/log/canary.test.ts`); app payload capture blocked (BL-239) | CR-010 |
| LEGAL-REQ-015 | P0 | No safety tier in any event | Given the catalogue, Then no event or property names a tier | Built (no such event in `catalog.ts`) | CR-031 |
| LEGAL-REQ-016 | P0 | No ad, attribution or tracking SDK; no AdSupport or ATT import | Given CI, Then a dependency denylist fails on the listed SDKs and imports | Not built (no denylist check found) | CR-014 |
| LEGAL-REQ-043 | P0 | The privacy manifest's collected data types match what the build sends | Given a build with a PostHog key, Then `NSPrivacyCollectedDataTypes` lists the label's analytics types; given a build without, Then it may stay empty | Partly built: manifest present with `NSPrivacyCollectedDataTypes: []` (`apps/mobile/app.config.ts`) | CR-088 |
| A-NFR-002 | P0 | Analytics never on the launch path | Given cold start, Then `startAnalytics` runs after the first frame, is not awaited, and makes no network call without consent | Built (`apps/mobile/src/app/_layout.tsx` `startServices`) | K-01 |
| A-NFR-012 | P0 | No email, names, tokens or free text in events; Sentry strips token URLs | Given any string over 40 characters or PII-shaped, Then the event is dropped | Partly built: PostHog side built (`validate.ts`); Sentry side not built | K-01 |
| B-NFR-001, C-NFR-005, C-REQ-034 | P0 | Children only as ordinals and buckets; a language only as one of 7 codes on `language_set` and `pack_download` | Given the catalogue test, Then no other event carries `lang` and no property holds a name | Built (`catalog.ts`, `test/domain.test.ts`) | K-01 |
| F18-REQ-001 | P0 | The PostHog SDK is never evaluated before a yes | Given consent unknown or denied, Then `posthog-sdk.ts` is not loaded (dynamic import count 0) and the app container has no PostHog file after a fresh install through first letter | Partly built: lazy adapter built (`index.ts`, `createLazyPostHogAdapter`); the container scan with the real SDK is BL-252 | LEGAL-REQ-003 |
| F18-REQ-002 | P0 | A fresh random id per consent period; retired on withdrawal; at most 20 retired ids kept, only for deletion | Given grant, withdraw, grant, Then two different UUIDs and `analyticsIds()` returns both | Built (`packages/analytics/src/consent.ts`) | PRD-REQ-018 |
| F18-REQ-003 | P0 | No consent ask and no Privacy switch in a build without a PostHog key | Given `EXPO_PUBLIC_POSTHOG_KEY` empty, Then `analyticsAskDueNow` returns not due with reason `no_provider` (new) and the switch row is hidden | Not built (the sheet shows today; `consent-ask.tsx` header says a yes sends nothing) | ROADMAP 6 cut |
| F18-REQ-004 | P0 | The legal record of each choice is written **[server]**: accept, decline and withdraw through `record_policy_act`, queued offline | Given a signed-in yes, Then one `analytics` accept row with the surface; offline, it uploads on reconnect | Partly built: `setAnalyticsConsentRecorder` exists but nothing registers a recorder (grep 13 Oct); BL-251 ready | TDD 01 3.11.4 |
| F18-REQ-005 | P0 | Consent copy says only what the build does **[Counsel]** | Given no crash reporter in the build, Then `analyticsConsent.body` and `settings.privacy.analyticsHelp` do not mention crashes; counsel approves `analyticsConsent.*` (D-003) | Partly built: `analyticsConsent.body` says "when something crashes" and `settings.privacy.analyticsLabel` says "Share usage and crash reports" (`packages/content/src/strings.en.ts` lines 737 and 774) | D-003, LEGAL-REQ-044 |
| F18-REQ-006 | P0 | If Sentry ships: initialised only while consent is granted, closed on withdrawal, `sendDefaultPii` false, scrubbers per ADR 0008, no replay | Given consent unknown, Then 0 requests to the Sentry host. Given withdrawal, Then the client closes before the next event | Not built (no Sentry dependency) | ADR 0008, K-01 |
| F18-REQ-007 | P0 | Only one file imports each analytics SDK | Given CI, Then a lint rule fails any import of `posthog-react-native` outside `apps/mobile/src/lib/analytics/posthog-sdk.ts` (and of Sentry outside one named file) | Not built (convention only, no lint rule found) | ADR 0008 |
| F18-REQ-008 | P0 | Per-id daily cap | Given 250 events tracked for one id on one local day, Then 200 reach the queue, `analytics_opted_in` and `account_deletion` are never capped, and `violationCounts().daily_cap` is 50 | Not built | PRD 7.7 |
| F18-REQ-009 | P0 | Transport caps | Given 1.1 MB of events offline, Then the oldest drop first and the queue stays at or under 1 MB; flush at most every 60 s and on background | Built (`client.ts`, `lifecycle.ts`) | PRD 7.7 |
| F18-REQ-010 | P0 | Sampling rates are fixed in the build, never from remote config | Given `packages/api/src/remote-config.ts`, Then no key matches `analytic`, `sampl`, `consent` or `track` (new test); rates live only in `apps/mobile/src/lib/analytics/index.ts` | Built in fact (contract has no such key; `sampleRates: {}`); the guard test is not built | B14, ADR 0016 5.3 |
| F18-REQ-011 | P0 | PostHog project settings checked before each submission | Given the release checklist, Then the 6 items in `REQUIRED_PROJECT_SETTINGS` (discard IP, replay off, autocapture off, retention 12 months or less, US region, read-only insights key) are ticked with a screenshot in the release evidence. Retention: 90 days recommended [R] (R4 PT-28), counsel decides with Q26 | Partly built: list in `packages/analytics/src/posthog.ts`; no checklist step | LEGAL-REQ-012, Q26 |
| F18-REQ-012 | P0 | Every catalogue event has an emitter or is removed before submission | Given a script that greps call sites, Then 0 events without an emitter, except those tagged `server_only_build` (family and merge events) | Partly built: 13 events have no emitter (section 10) | PRD-REQ-016 |
| F18-REQ-013 | P0 | Device numbers are always labelled and never divided by server totals | Given the rendered report, Then every device metric carries "device" and no ratio mixes sources | Built (engine honesty rules, INSIGHTS_LOOP 3) | TRACKING_PLAN 1.4 |
| F18-REQ-014 | P0 | The weekly report computes the 6.5 definitions it can, and states "not measurable in this build" for the rest | Given a server-off week, Then S rows read unknown, not zero | Partly built: engine treats suppressed cells as unknown; a server-off state is not modelled | 03 section 4 |
| F18-REQ-015 | P0 | Server aggregates publish no subtractable small cell **[server]** | Given `first_letter_d7 - first_letter_d1` between 1 and 9, Then neither is published (fix L12) | Not built | Review L12 |
| F18-REQ-016 | P0 | The M6 status table is never joined to analytics and never read by the insights loop without counsel approval **[server]** | Given `insights_reader`, Then it has no grant on the status table; given the engine sources, Then none reads it | Not built (the status table and its endpoint do not exist; no migration on develop) | D-080, Q5 |
| F18-REQ-017 | P0 | `analytics-forget` is stateless: up to 21 ids, 5 calls per person per day, nothing stored or logged but counts **[server]** | Given a call, Then PostHog bulk delete is called once and no id appears in Postgres or logs | Built (`supabase/functions/analytics-forget/handler.ts`, `handler.test.ts`) | TDD 05 X-02, BL-235 |
| F18-REQ-018 | P0 | The deletion request sends ids before the account call and calls `forgetIds()` only after a 202 **[server]** | Given a fake function returning 202, Then ids are forgotten; returning 500, Then ids stay | Built (`use-account-deletion.ts`, `account-deletion/api.ts`) | PRD-REQ-018 |
| F18-REQ-019 | P0 | A failed forget is retried on each launch until a 202 **[server]** | Given a 500 at request time, When the app launches 3 times with the third succeeding, Then 3 attempts and the ids are forgotten after the third. Given the account deletion executes before any 202, Then the phone keeps the retired ids through its wipe and keeps retrying, and the deletion receipt marks the PostHog step `unconfirmed` (request to F17) (R4 PT-28) | Partly built: `retryForget` runs only when the Delete account screen refreshes | F17-U27 |
| F18-REQ-020 | P0 | Under-18 at sign-in stops analytics at once and sends nothing about the answer **[server]** | Given consent then an under-18 answer, Then revoke runs and no event names the answer | Built (`observers.ts` `onUnder18`) | LEGAL-REQ-002 |
| F18-REQ-021 | P1 | A person without an account can ask for their usage data to be deleted **[Counsel]** | Given consent history on a phone with no account, When the person taps "Delete shared usage data" in Settings > Privacy, Then current and retired ids reach a forget endpoint and `forgetIds()` runs on 202 | Not built (Q3) | CCPA deletion right, Q26 |
| F18-REQ-022 | P0 | The weekly run is content-free and k-anonymised three times (SQL, HogQL, engine) | Given a synthetic run with a planted email and a planted 7-person cell, Then the report is refused or shows unknown | Built (`packages/analytics/src/insights/`, `test/insights.test.ts`) | INSIGHTS_LOOP 5 |
| F18-REQ-023 | P1 | The loop runs weekly from C1 with read-only keys held only by the scheduler | Given the schedule, Then one report per Monday and the keys are absent from the repo and the app | Not built (no schedule, no keys) | B10 |
| F18-REQ-024 | P0 | The insights agent writes the report and at most 3 proposals to the working tree only; it never commits, pushes or opens a pull request | Given INSIGHTS_LOOP 6, Then step 7 is replaced by "report the file paths; the coordinator commits"; the scheduler token has no write scope | Partly built: prompt step 7 opens a draft pull request, contrary to D-070 | D-070 |
| F18-REQ-025 | P0 | Purchase numbers come only from ASC exports, typed into the report by the founder or coordinator, labelled "ASC" | Given a report, Then every money number names ASC and the export month | Not built | B2, 03 section 4 |
| F18-REQ-026 | P0 | The crash-free release gate reads ASC and Xcode Organizer, never only consenting users | Given the C1 exit review, Then the crash-free figure cites ASC | Partly built: `docs/qa/DEVICE_TEST_PLAN.md` TF-09 says so; no evidence file yet | D-003 |

### 7.1 Test map (P0)

| ID | Test file or run | Exists? |
|---|---|---|
| LEGAL-REQ-003, F18-REQ-001 | Network capture E2E (BL-239, blocked by BL-275); container scan (BL-252); `packages/analytics/test/analytics.test.ts` | Unit exists; E2E and scan new |
| F18-REQ-027 | `apps/mobile/src/lib/analytics/ask-sequencer.logic.test.ts`; `packages/analytics/test/helpers.test.ts` | Exist |
| PRD-REQ-016, LEGAL-REQ-015, B-NFR-001, C-NFR-005, C-REQ-034 | `packages/analytics/test/catalog.test.ts`, `schema-version.test.ts`, `domain.test.ts` | Exist |
| PRD-REQ-017 Rev, F18-REQ-015, F18-REQ-016 | `supabase/tests/insights_aggregates.test.mjs` (new cases for L12 and the status-table grant) | Exists |
| PRD-REQ-018, F18-REQ-002, F18-REQ-009 | `packages/analytics/test/analytics.test.ts`; `apps/mobile/src/lib/account-deletion/account-deletion.test.ts` | Exist |
| LEGAL-REQ-017, LEGAL-REQ-012, F18-REQ-011 (options half) | `packages/analytics/test/posthog.test.ts` | Exists |
| F18-REQ-028 | `supabase/functions/_shared/log/canary.test.ts`; app payload capture (BL-239) | First exists |
| LEGAL-REQ-016, F18-REQ-007 | CI dependency denylist and import lint (new, S20) | New |
| LEGAL-REQ-043 | `apps/mobile/test/permissions-manifest.test.ts` (shared with F04; privacy manifest types) | New |
| A-NFR-002, A-NFR-012 | `apps/mobile/test/resilience.test.ts`; `packages/analytics/test/helpers.test.ts` | Exist |
| F18-REQ-003, F18-REQ-008, F18-REQ-010 | `apps/mobile/test/analytics-provider.test.ts`; `packages/analytics/test/analytics.test.ts` (cap); `packages/api/test/remote-config.test.ts` (no analytics key) | First new; others exist |
| F18-REQ-004, F18-REQ-005, F18-REQ-006, F18-REQ-020 | `packages/analytics/test/observe.test.ts`; `packages/content/test/rules.test.ts` (consent copy says only what the build does) | Exist; cases new |
| F18-REQ-012 | `scripts/` emitter check (new) | New |
| F18-REQ-013, F18-REQ-014, F18-REQ-022 | `packages/analytics/test/insights.test.ts` | Exists |
| F18-REQ-017, F18-REQ-018, F18-REQ-019 | `supabase/functions/analytics-forget/handler.test.ts`; `apps/mobile/src/lib/account-deletion/account-deletion.test.ts` | Exist; retry-through-wipe case new |
| F18-REQ-024, F18-REQ-025, F18-REQ-026 | Process checks in the release checklist with evidence (no repo test can prove them, R5 sample items 33 and 34) | Human |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| DATA-REQ-062 | P0 | Telemetry retention: PostHog 12 months, set in the console and recorded in the runbook | Given the release checklist, Then the PostHog retention setting is recorded with the date | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-062 |

## 8. Data, privacy and security

| Data | Level (PRD 7.10) | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| Consent status, random id, retired ids (at most 20), offer count | L2 | Device `settings` table (SQLite) | The app | Until forgotten or the app is deleted | Leaves the phone except ids to `analytics-forget` |
| Event queue | L2 | Memory only | The app | Until flush, at most 1 MB | Disk |
| Events at PostHog (US cloud host `us.i.posthog.com` default in `index.ts`) | L2 | PostHog project | Founder; insights job with a Query Read key | 12 months or less (Q26 default) | IP (discarded), GeoIP, person properties |
| Server aggregates **[server]** | Counts | Postgres schema `insights`, views only | `service_role`, `insights_reader` | Computed on read | Ids, timestamps of a person, text |
| Weekly report and proposals | Counts | Repo `docs/insights/`, `docs/backlog/proposals/` | Team | Repo history | Anything that passes `assertContentFree` checks as content |
| M6 status rows **[server]** | L3 purchase facts | Postgres (not built) | Reminder scheduler only | Life of the account; consent facts plus 3 years (D-081) | Analytics, insights, PostHog |

- The privacy label answer for Usage Data, Diagnostics and Purchases is "Linked" by default unless counsel accepts "Not linked" (Q-005, `app-store-privacy-labels.md` 1.3). Tracking stays No either way. **[Counsel]**
- The six conditions in `app-store-privacy-labels.md` 1.3 are engineering checks before every submission (F18-REQ-011, F21).
- `analytics-forget` accepts any 21 ids from any signed-in account (review L5). Accepted by design: the ids are random and never shown.

## 9. Non-functional requirements

| Item | Budget | Source |
|---|---|---|
| Launch | 0 ms added before first frame; no awaited call | A-NFR-002 |
| `track()` cost | Under 1 ms per call on an SE 3 [A: not measured] | 06-nfr.md |
| Memory | Queue at most 1 MB; SDK not loaded without consent | PRD 7.7 |
| Battery and wake-ups | No SDK timer; one 60 s interval while foreground and consenting | PRD 7.7 |
| Network | One batch per minute at most; no request without consent | LEGAL-REQ-003 |
| Accessibility | Consent sheet passes AX5, VoiceOver order title, body, detail, Share usage, Don't share; equal button weight | LEGAL-REQ-051 |
| Reliability | Analytics errors never surface to the person; `startAnalytics` catches everything | `index.ts` |
| Insights run | Under 10 minutes; fails loudly with status and query name only | INSIGHTS_LOOP 4 |

Shared budgets: `06-nfr.md`.

## 10. Analytics

F18 owns the catalogue; each sibling spec lists its own events. Events about consent itself:

| Event | Exists? | Properties | Question |
|---|---|---|---|
| `analytics_opted_in` | Yes | `surface`, `days_since_install`, `letters_bucket`, `signed_in`, `member_role`, `first_letter_mode`, `time_to_first_letter`, `came_from_invite` | How long from install to first letter among consenters? **[Counsel]** on the one-time summary (TRACKING_PLAN 2) |
| Decline | Never an event | n/a | Measured only as server acceptances **[server]** |

**Events with no emitter on develop (13 Oct grep of `apps/mobile/src` and `packages/analytics/src`):** `local_merge_choice`, `make_it_yours_card`, `goals_set`, `dictionary_term_added`, `family_letter_reviewed`, `member_removed`, `member_left`, `reminder_sent`, `reminder_suppressed`, `moment_shown`, `resurface_shown`, `resurface_opened`, `export_shared`. Four of them (`local_merge_choice`, `family_letter_reviewed`, `member_removed`, `member_left`) need server features. TRACKING_PLAN section 9 still lists `startAnalytics`, `useScreenViews` and the consent sheet as "to wire"; all three are wired.

## 11. How we build it (with the architect)

- **Packages.** `packages/analytics` (pure TS) for the catalogue, client, consent, sampling, caps and insights engine. `apps/mobile/src/lib/analytics` is the only app importer; `posthog-sdk.ts` the only PostHog import. `posthog-react-native` ^4.78.4 (MIT) per `apps/mobile/package.json`; options pinned by `test/posthog.test.ts`.
- **Sentry (only if Q2 says v1.0).** `@sentry/react-native` behind the same `analyticsConsent()` check, initialised in a new `apps/mobile/src/lib/analytics/sentry.ts` (new) after consent, closed on withdraw; scrubbers per ADR 0008. The licence, version and Expo config plugin must be checked against the installed package before coding (brief coordination rules). Adding it changes the privacy label (Crash Data), the manifest and the subprocessor list (F21).
- **Daily cap.** In `createAnalytics`: a counter keyed by id and local date in the injected storage; new `ViolationKind` `daily_cap`.
- **No-provider state.** `analyticsAskDueNow` returns `{ due: false, reason: 'no_provider' }` when `EXPO_PUBLIC_POSTHOG_KEY` is empty; `privacy.tsx` hides the switch.
- **Forget without an account (if Q3 is yes).** Option A [R]: a `public` route `analytics-forget/v1/anonymous` with the same 21-id limit, rate-limited by hashed IP (ADR 0017 rule 4), reached through `EXPO_PUBLIC_DOCS_BASE_URL`'s host or a new env var. Option B: no route; the Privacy Policy states that usage data without an account ages out after 12 months. Counsel picks.
- **Insights.** No new code for v1.0 beyond the prompt fix and a "build state" input so S rows render as not measurable.
- **Riskiest unknown.** Whether the PostHog SDK writes anything to disk on first construction in a release build (BL-252). Spike: install a release build, grant, kill, and list the app container; repeat after withdrawal.

## 12. Work packages

`08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream (R5 EQ-08).

Only for what is missing or partly built.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F18-01 | No-provider state: no sheet, no switch without a key | Analytics engineer | `apps/mobile/src/lib/analytics/ask.ts`, `ask-sequencer.logic.ts` and test, `apps/mobile/src/app/settings/privacy.tsx` | none | `[F18-REQ-003]` unit tests both ways; `[F18-REQ-027]`, `[LEGAL-REQ-003]` (exists in `packages/analytics/test/posthog.test.ts`), `[PRD-REQ-018]` (exists in `packages/analytics/test/posthog.test.ts`) | Agent |
| WP-F18-02 | Per-id daily cap | Analytics engineer | `packages/analytics/src/client.ts`, `validate.ts` (kind), `test/analytics.test.ts` | none | `[F18-REQ-008]` | Agent |
| WP-F18-03 | Guard tests: no analytics keys in remote config; one-file SDK imports; ad SDK denylist | Analytics engineer, QA | `packages/api/test/remote-config.test.ts`, new `scripts/ci/sdk-guards.mjs`, CI workflow line | none | `[F18-REQ-010]`, `[F18-REQ-007]`, `[LEGAL-REQ-016]` fail on a planted import; `[C-REQ-034]`, `[F18-REQ-028]`, `[LEGAL-REQ-015]`, `[PRD-REQ-016]` | Agent |
| WP-F18-04 | Consent recorder registration and offline queue **[server]** | Auth owner | `apps/mobile/src/lib/auth/consent.ts`, root registration line | BL-251 | `[F18-REQ-004]`; `[F18-REQ-002]`, `[F18-REQ-009]`, `[F18-REQ-020]` | Agent |
| WP-F18-05 | Forget retry at launch **[server]** | Analytics engineer | `apps/mobile/src/lib/account-deletion/api.ts`, a launch hook in `lib/analytics/index.ts` | none | `[F18-REQ-019]`; `[F18-REQ-018]` | Agent |
| WP-F18-06 | Wire or remove the 13 silent events; emitter check script | Analytics engineer with each owner | `packages/analytics/src/catalog.ts`, `scripts/analytics/emitters.mjs` (new), call sites named in TRACKING_PLAN 9 | Owners | `[F18-REQ-012]` script exits 0 | Agent |
| WP-F18-07 | Consent copy accuracy | Content | `packages/content/src/strings.en.ts` `analyticsConsent`, `settings.privacy.analyticsHelp` | Q2, counsel | `[F18-REQ-005]`; content rules test green | Agent then counsel |
| WP-F18-08 | Privacy manifest and label for a PostHog build | Mobile engineer, legal | `apps/mobile/app.config.ts` `PRIVACY_MANIFESTS`, `docs/legal/app-store-privacy-labels.md` | Q-005 | `[LEGAL-REQ-043]` archived `.ipa` inspected | Pair |
| WP-F18-09 | Real-SDK contract test and container scan | QA engineer | `apps/mobile/test/analytics-contract.test.ts` (new); device script in `docs/qa/` | Release build on a device | `[F18-REQ-001]`; BL-252; `[LEGAL-REQ-012]` | Pair (device) |
| WP-F18-10 | Insights prompt fix (D-070) and build-state input | Analytics engineer | `docs/analytics/INSIGHTS_LOOP.md` section 6, `scripts/insights/run.ts`, `packages/analytics/src/insights/render.ts` | none | `[F18-REQ-024]`, `[F18-REQ-014]`; `[F18-REQ-013]`, `[F18-REQ-022]` | Agent |
| WP-F18-11 | L12 nested k fix **[server]** | DB owner | New migration in the owner's range; `supabase/tests/insights_aggregates.test.mjs` | D-041 fence | `[F18-REQ-015]`; `[F18-REQ-016]`, `[PRD-REQ-017]` | Agent with review label |
| WP-F18-12 | Release checklist items: PostHog settings, ASC crash and money numbers | Founder, release owner | Release checklist doc (owner's choice of path) | none | `[F18-REQ-011]`, `[F18-REQ-025]`, `[F18-REQ-026]` evidence present; `[DATA-REQ-062]` | Human |
| WP-F18-13 | Weekly schedule and read-only keys | Founder | Scheduler (outside the repo) | C1 | `[F18-REQ-023]` first real report | Human |
| WP-F18-14 | Sentry behind consent (only if Q2 = v1.0) | Analytics engineer | `apps/mobile/src/lib/analytics/sentry.ts` (new), `app.config.ts` plugin | Q2, WP-F18-08 | `[F18-REQ-006]`, `[A-NFR-012]` | Agent |
| WP-F18-15 | Forget without an account (if Q3 = yes) | Analytics engineer, privacy engineer | `supabase/functions/analytics-forget/`, `packages/api/src/standards.ts` entry, `privacy.tsx` row | Q3, counsel | `[F18-REQ-021]` | Agent with review label |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Does the v1.0 submission ship with server features off (code, c1764f9) or on (ROADMAP 2.1, M6 to M8)? **Answered by M14 (founder, 13 Oct 2026): on.** Every **[server]** row is v1.0 | Founder (decided) | Every **[server]** row; 03 section 4 sources; the label (account data declared) |
| Q2 Sentry in v1.0? Default [R]: no. ASC and Xcode Organizer are the release gate already (D-003), the label says no Crash Data (1.3.0), and adding it reopens the label, manifest and subprocessor list two weeks before submission | Founder; 16 Oct | WP-F18-14, F18-REQ-005 copy |
| Q3 A deletion path for usage data without an account: route (option A) or retention only (option B)? **[Counsel]** | Counsel; 23 Oct | WP-F18-15 |
| Q4 Is the `analytics_opted_in` first-run summary acceptable under LEGAL-REQ-003? **[Counsel]** | Counsel; 23 Oct | Drop properties if no |
| Q5 May the M6 status table feed one k-anonymised count (plans by state per week) to the report, as a second purpose? Default: no **[Counsel]** | Counsel; 29 Oct | F18-REQ-016 |
| Q6 Linked or Not linked (Q-005) **[Counsel]** | Counsel; 29 Oct (default Linked) | Label, manifest |
| Q7 The seven-code `lang` property (Q-004) **[Counsel]** | Counsel; 16 Oct (default ship) | Two events |
| Q8 PostHog billing limit value | Founder; before C1 | Volume cap |
| Q9 Does v1.0 ship with `EXPO_PUBLIC_ANALYTICS` on (this spec, D-003, B10) or off (PR #122 D-095, built by PR #118)? Spec default until answered: off, as `develop` is built; every requirement here then binds from v1.1 or from the build that turns it on | Founder; T02 | Sections 4, 7 and 12 of this spec; F17 Privacy screen; the privacy label (F21) |

| A | Assumption | How we validate |
|---|---|---|
| A1 | 40% consent | Server acceptances **[server]**; else unknown |
| A2 | About 190 events per active consenting parent per month | First 4 weeks of PostHog totals |
| A3 | 200 events per id per day is never reached by real use | `daily_cap` counts in dev and C1 |
| A4 | HogQL function names in `hogql.ts` are current | First real run (INSIGHTS_LOOP 4.3) |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` items 10 to 12, 16, 17; `docs/prd/v2/_AUTHORING.md` 3, 3b (M6, M12, M13).
- Decisions: `docs/DECISIONS.md` on develop D-003, D-035, D-068, D-070, D-080, D-081.
- ADRs: `docs/adr/0008-analytics-and-crash-reporting.md`; `0016-lean-app-and-server-driven-content.md` 5.3; `0017-api-standards.md`.
- Plans: `docs/analytics/TRACKING_PLAN.md` sections 0 to 10; `docs/analytics/INSIGHTS_LOOP.md` sections 1 to 7; `docs/ROADMAP.md` 2.1 sections 6 and 7.
- Code: `packages/analytics/src/` (`catalog.ts`, `client.ts`, `consent.ts`, `consent-timing.ts`, `posthog.ts`, `validate.ts`, `lifecycle.ts`, `insights/`); `packages/analytics/test/`; `apps/mobile/src/lib/analytics/`; `apps/mobile/src/components/consent/`; `apps/mobile/src/app/_layout.tsx`, `settings/privacy.tsx`; `apps/mobile/src/lib/account-deletion/`; `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/eas.json`; `apps/mobile/app.config.ts`; `supabase/functions/analytics-forget/`; `supabase/migrations/20261004300000_insights_aggregates.sql`; `scripts/insights/run.ts`; `packages/api/src/remote-config.ts`; commit c1764f9.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-003, -012, -014 to -017, -043; `docs/legal/app-store-privacy-labels.md` 1.2, 1.3; `docs/legal/COUNSEL_PACKET.md` Q6, Q7, Q26.
- Reviews: `docs/reviews/2026-10-04-security-privacy.md` L5, L12.
- Backlog: `docs/BACKLOG.md` BL-020, BL-021, BL-023, BL-024, BL-235, BL-239, BL-250 to BL-252.
- Research: R1 F18 and section 0 item 9 (R1-S1, R1-S3 to R1-S7, R1-S33, R1-S35, R1-S57); R2 section 0 item 2; R4 section 5 (R4-S55).
- PRD: `docs/prd/PRD.md` K-01, PRD-REQ-001, -016 to -018, 7.7, 7.8, 7.10; Sections A, B, C for A-NFR-002, A-NFR-012, B-NFR-001, C-REQ-034, C-NFR-005, C-NFR-009.
