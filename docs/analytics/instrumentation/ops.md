# Instrumentation: observability end to end (ops)

Status: PROPOSED, 20 Nov 2026. Author: `ops`. Data partner of PM5 (Plus, growth and foundations); PM5's file is `docs/product/instrumentation/05-*.md` (not on develop when I wrote this, [U]). Docs only. Nothing here changes code, a workflow, `package.json`, `eas.json` or a store label, and nothing is turned on.

Tags: [V] read this session (file or page), [U] unverified, Rec = my proposal. Names follow the founder's event standard (`/home/claude/event-standard-brief.md`; the final rules land in `docs/analytics/instrumentation/00-event-standard.md`, which I have not read, [U]; where it differs, it wins).

## 0. The frame, in five lines

1. Analytics and diagnostics are OFF through 1.0.x: FR-DAT-01 ("no event, counter, survey answer or measurement payload is sent, queued or written for us; ... no PostHog or Sentry client is constructed") [V `docs/product/prd/functions/data-and-measurement.md` FR-DAT-01]; D-095, D-124 [V via `OBSERVABILITY-WITHOUT-CONTENT.md` section 1]. So for 1.0 observability means: Apple's own crash and size numbers, the on-device fault log and perf markers shared by hand, server logs, and CI/ops jobs.
2. Everything below that sends data off a phone is built DARK for the release after 1.0: compiled, tested, inert, behind `EXPO_PUBLIC_ANALYTICS` and a consent gate.
3. Founder rule (20 Nov, binding): only completely free, open-source tools; no paid product, no paid tier. Where the open-source tool's hosted version costs money: self-host or the free tier only, with the free limits stated.
4. Open source first: adopt, build only the thin layer (closed allowlist, consent gate, content-free validators, tests that prove it).
5. The rule that outranks all of it: no entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`).

## 1. Stack decision (what I checked, licence, free limits, data held, verdict)

Prices and limits were read from the pages named on 20 Nov 2026. Anything I did not read is [U].

| Need | Option checked | Licence | Self-host? | Free limit or cost | Data it would hold | Verdict |
|---|---|---|---|---|---|---|
| Crashes, 1.0 | Apple Organizer, TestFlight and App Store Connect crash and size data; Xcode MetricKit | Not ours; no SDK | n/a | $0 | Apple's data, shared by users who opted into Apple's sharing [U on exact terms] | ADOPT for 1.0. It is the gate source already (`MEASUREMENT-PLAN.md` section 4 [V]) and adds no SDK, so the label stays "no usage or diagnostics" |
| Crashes, after 1.0 | **GlitchTip** (Sentry-API compatible) | Page says "open source"; exact licence not on the page, [U] (believed MIT, check the repo) | Yes ("Self-hosted version ... Run on your own server") [V glitchtip.com/pricing] | Hosted Free: "Up to 1,000 events/mo", "30 days of event retention"; next tier $15/mo, so NOT used [V] | Error class, stack frames, app version, iOS major, device model. Never message text, never user, never breadcrumbs (section 3) | ADOPT dark, hosted free tier first |
| Crashes, alternative | Sentry server | Functional Source License 1.1, converts to Apache 2.0 after two years; forbids "Competing Use" [V github.com/getsentry/sentry LICENSE.md] | Yes, but it is not an OSI licence and `SEC-R07` allows only MIT, Apache-2.0, BSD, ISC for what we ship [V `ADOPTION-RULES.md` section 1] | Hosted free plan: not read, [U] | Same | REJECT the server (licence, and its hosted tiers are paid). The Sentry client SDK is what GlitchTip accepts; its licence I did not read, [U], and the SDK needs the founder's dependency approval |
| Crashes, no network | Our own typed fault log (`global-errors.logic.ts`: kind, code, id, time, last 20) | Ours | on the phone | $0 | Four fields on the phone | KEEP as the floor; shown to a person only if they choose to share, never uploaded in 1.0 [V `OBSERVABILITY-WITHOUT-CONTENT.md` section 3] |
| Server traces and metrics | OpenTelemetry (OTLP export) | Apache 2.0 [U, not read this session] | n/a (it is a format and SDKs) | $0 | Spans and numbers we choose | ADOPT the format only. Supabase log drains, which can send OTLP, are "only available for customers on Pro, Team and Enterprise" [V supabase.com/docs/guides/telemetry/log-drains]: paid, so REJECTED. Free path in section 4 |
| Dashboards | **Grafana** | AGPL-3.0 [U, not read this session] | Yes, needs a host we do not have | Cloud Free: 10k active series, 14 days; logs 50 GB a month, 14 days; traces 50 GB a month, 14 days; 3 active users; "No credit card required" on metrics, logs, traces and profiles [V grafana.com/pricing] | Numbers and closed-enum labels only | OPTIONAL, dark, free cloud tier only; default is no dashboard until v1.1 (section 5) |
| Reporting on Postgres | Metabase OSS | AGPL for the open-source edition; commercial editions under another licence [V github.com/metabase/metabase] | Yes, needs a host | Self-host cost not stated on the page, [U] | Aggregates from reporting views | Owned by `data-architect`; I only require the read-only role and no content columns (section 5) |
| Reporting alternative | Apache Superset | Apache 2.0 [U] | Yes, heavier | [U] | Same | Not evaluated further; same host problem |
| Uptime and incident log | **Upptime** | MIT [V github.com/upptime/upptime] | It runs on GitHub Actions, Issues, Pages; "completely free if you're already using GitHub"; checks "as often as every 5 minutes" [V] | GitHub's own Actions and Pages quotas, not stated on that page, [U] | Up or down and response time of public URLs | ADOPT only the check-and-issue half in the private repo. Do not use its Pages status page: the repo that holds incidents must stay private (`free-tier-ops.md` "Why the private repository" [V]) and Pages on a private repo may be a paid feature [U] |
| Free-tier limits and keep-alive | Our `scripts/ops/free-limits.ts`, `keepalive.ts` in `earlyletters-backups` | Ours | GitHub Actions | $0 | Counts only | KEEP; already built, proposal workflows in `docs/ops/proposed/workflows/` [V] |
| Product analytics | PostHog, already in `packages/analytics` | MIT open-source product (page says "It is MIT licensed") [V posthog.com/pricing]. Free plan: 1M events, 5K recordings, 1M flag requests a month; events kept 1 year; 1 project [V] | Self-host details not on that page, [U] | $0 within the free plan | Owned by `analytics` | Out of my scope except: session replay stays OFF always, so the 5K recordings allowance is never used |
| Website analytics | Vercel Web Analytics | Not open source | n/a | n/a | n/a | REJECT (founder rule). Website reach is `data-architect` and PM5's call; I list Umami (MIT, [U]) as the candidate to check |

**What we build (thin layer only):** `lib/diagnostics/log.ts` (typed device log), the crash-report scrubber (section 3), the perf marker ring (`MEASUREMENT-PLAN.md` section 4), the canary tests. Everything else is adopted.

**Honest limit of "free":** self-hosting GlitchTip, Grafana or Metabase needs a machine that stays on. We have none: the founder's Mac is not a server and I read no free host this session. So the plan is free tiers only, plus GitHub Actions. If a free tier's cap is hit, the rule is: stop sending (drop), never upgrade. Whether GlitchTip and Grafana drop or bill at the cap is [U]; the founder must not add a card (decision F3).

## 2. Naming (event standard applied)

The brief: `<area>.<object>.<action>` (past tense), areas closed, perf as `perf.<metric>.measured`, one registry row per event, every row carries trigger, properties with type, classification, owner, consent gate, status, requirement id.

Ops owns only `system` and `perf` events. Proposed registry rows (status: proposed; all consent gate = analytics consent, off in 1.0.x; classification label L2, counts and enums only, label names per `DATA_CLASSIFICATION` [U, not read]; owner `ops`; requirement id: FR-DAT-01 for the gate, NFR ids below for the budget):

| Event | Trigger | Properties (closed, typed) | Budget id |
|---|---|---|---|
| `perf.cold_start.measured` | first interactive frame after process start | `value_ms_bucket` enum, `warm` bool, `os_major` int bucket, `app_version` enum | L-01 |
| `perf.warm_start.measured` | same, foreground from background | same | L-05 |
| `perf.save_commit.measured` | local save transaction done | `value_ms_bucket`, `kind` enum (spoken, typed) | C-02 |
| `perf.speak_to_mic.measured` | tap Speak to microphone live | `value_ms_bucket`, `warm` bool | C-01 |
| `perf.find_first_row.measured` | last keystroke to first result row | `value_ms_bucket` (no query, no result count) | S-07 |
| `perf.book_first_render.measured` | Book first render | `value_ms_bucket`, `size_bucket` enum (small, medium, large) | S-03 |
| `perf.migration.measured` | local migration done | `value_ms_bucket`, `to_schema` int | Q-02 |
| `perf.index_rebuild.measured` | Find index catch-up done | `value_ms_bucket`, `size_bucket` | S-08 |
| `system.crash.reported` | fatal error, on the next launch | `error_class` enum from the closed fault-code union, `app_version`, `os_major` | crash-free gate (`06-nfr.md` 6) |
| `system.fault.recorded` | a non-fatal code from the closed fault list | `error_class` enum, `module` enum | none (diagnostic) |
| `system.sync.failed` | a sync pass ends with an error code | `error_class` enum | N-02 |

Rules I add: `value_ms_bucket` is an enum (for example `lt_100`, `100_300`, `300_1000`, `1000_2000`, `gte_2000`), never a raw number, so a single value cannot single out a take or a person. `size_bucket` never derives from one child's counts shown to a parent. The names above map one to one to the closed `PerfEvent` union in `MEASUREMENT-PLAN.md` section 4 (`launch_interactive` is `perf.cold_start.measured`, and so on); the PR that adds a marker adds its registry row. A rename is a new event with the old one deprecated by date.

**Server log lines are not analytics events.** `supabase/functions/_shared/log/log.ts` uses a closed `EVENTS` list (`request.done`, `purge_due.batch`) with no area prefix [V]. Proposal: they stay as log names (a rename would break the canary and runbooks); the registry notes them as a separate "server log" kind and the validator does not apply to them. Question for `analytics`: does the standard accept this? If not, the change is one registry alias table, not a rename.

**SLO names** are `slo_<area>_<goal>`: `slo_perf_cold_start`, `slo_perf_save`, `slo_system_crash_free`, `slo_system_backup`, `slo_system_api_read`. They label reports, not events.

## 3. Crash reports and logs without content

**Why this needs care.** A fatal JS error becomes a native `RCTFatalException` whose text is the JS error message, so a message can reach an Apple crash report we cannot scrub [V `OBSERVABILITY-WITHOUT-CONTENT.md` section 3]. Three throws put a date into the message (`packages/core/src/age.ts:15`, `child.ts:28, 33`) [V, same file]. That is the first fix, before any SDK.

Pre-conditions for any crash SDK (all must hold; each has a test):
1. `beforeSend` and `beforeBreadcrumb` drop everything except: `error_class` (closed code), exception type name, stack frames (file and function only, no variable values), `app_version`, `os_major`, device model.
2. No exception `value` (message). Throws carry only a code (the R3 rule, `OBSERVABILITY-WITHOUT-CONTENT.md` section 5).
3. No user, no IP (server side strip), no breadcrumbs, no request URL or route params, no screenshots, no session replay, no view hierarchy, no local variables, `sendDefaultPii` off.
4. Initialised only after consent, on `EXPO_PUBLIC_ANALYTICS=on`; never constructed otherwise (FR-DAT-01). A 1.0.x profile test asserts the SDK is absent from the bundle (extends the seam guard, `seam-guard.mjs` [V]).
5. Canary proof (R4, R5 in `OBSERVABILITY-WITHOUT-CONTENT.md`): throw an error carrying the Asha canary through the real handler with the SDK mocked at its transport; assert the payload has none of it.
6. The label guard will flag the SDK: `TRACKING_SDK` matches `sentry` (`scripts/release/label-effect.mjs:38` [V]) and `ADOPTION-RULES.md` section 1 makes any off-phone data a founder and counsel matter. That is correct behaviour; the PR that adds it is a founder PR.

**Device logs:** keep one typed sink (R1, R2). **Server logs:** keep `log.ts`; it already drops free text and counts `dropped` [V log.ts header].

## 4. Traces, metrics and where they go for free

Supabase Free keeps logs 1 day and has no log drains (paid) [V `free-tier-ops.md`, log-drains page]. So a self-service free chain, no paid product:

1. Edge Functions and ops scripts already emit content-free JSON lines (`log.ts`). Add a duration and a `req_id` only (both exist).
2. SLIs that matter are read from where the data already is, not from traces: Postgres plan and latency budgets in the nightly `test:db:perf` (Q-04 [V NFR-BUDGETS]); backup, keep-alive and limits jobs (success or failure); CI time (`gh run list`, T-01, T-02).
3. A weekly ops report script (new, S) writes one issue in `earlyletters-backups` with numbers only. No dashboard needed to start.
4. OpenTelemetry spans from Edge Functions to Grafana Cloud Free are the dark option for later: only after the founder opens that account, with a span-attribute allowlist (names `system.*`, no ids, no SQL text; PRIV-R10 and OBS-R02 [V]). Deno's built-in OTel and Supabase's runtime support for it: [U, not read]; first step is a 1-hour spike, no commitment.

**Sampling.** The free caps are tiny (GlitchTip 1,000 events a month [V]). Rule: send one event per `error_class` per app version per day at most, plus a per-device cap of 5 a day. The tester base is small, so this fits; if a class floods, the cap hides it, so the weekly report also prints "capped" counts.

## 5. SLOs, budgets and alerts

Budgets come from `NFR-BUDGETS.md` (read in full, [V]); I do not invent new numbers. "Baseline first": none has an SE 3 measurement yet, so each SLO below is a PROPOSED target equal to the existing budget, and the first device run sets the baseline.

| SLO | SLI (event or source) | Target (from) | Window | Read by | Miss does |
|---|---|---|---|---|---|
| `slo_perf_cold_start` | `perf.cold_start.measured`, device run | p50 1.2 s, p90 2.0 s (L-01) | each release candidate | `qa`, `mobile` | HOLD the store build |
| `slo_perf_save` | `perf.save_commit.measured` | p95 200 ms (C-02) | each candidate | `mobile` | HOLD |
| `slo_perf_find` | `perf.find_first_row.measured` | p95 300 ms (S-07) | each candidate | `mobile` | HOLD the Find flag |
| `slo_system_crash_free` | Apple Organizer in 1.0; `system.crash.reported` after | the crash-free figure in `06-nfr.md` section 6 (not read, [U]) | per release | `ops` | HOLD |
| `slo_system_api_read` | nightly `test:db:perf` | `book_page` 15 ms, `book_full` 25 ms, `search_common` 12 ms (Q-04) | nightly | `data-architect` | WATCH, opens a `nightly` issue |
| `slo_system_backup` | backup workflow result | 7 of 7 nights succeed (`free-tier-ops.md`) | weekly | founder | `ops-alert` issue |
| `slo_system_limits` | `free-limits.ts` | alert at 80% of DB 500 MB and MAU 50,000 [V free-tier-ops] | weekly | founder | `ops-alert` issue |
| `slo_ci_speed` | `gh run list` timings | `ci.yml` under 10 min (T-01); launch run 15 min or less (T-02) | weekly | `ops` | WATCH |
| size | `scripts/size/measure.ts` | download under 40 MB; bytecode 12 MB (Z-01, Z-02) | each PR / candidate | `ops` | BLOCK / HOLD |

**Alert routing (free, nothing paged to a person's phone).** Severity A (data at risk: backup failed, purge failing, limits at 95%, keep-alive failed twice): GitHub issue labelled `ops-alert` in the private repo, GitHub emails the owner [V `free-tier-ops.md`], plus the runbook link in the issue. Severity B (budget miss, CI slow, nightly perf red): issue labelled `nightly`, weekly report. Severity C (WATCH numbers): the weekly report only. Remote push is not used (E79) and no marketing email (E75), so an alert never goes to a parent. No paging service is adopted: all that I know of are paid; the honest cost is that an overnight failure is read the next morning.

**Reporting on Postgres (open-source BI).** Not mine to build. Requirements I hand `data-architect`: a read-only role with no grant on any text column, entry, child or media table; reporting views that return counts, buckets and enums; Metabase OSS or Superset only if a free host exists (F2).

## 6. Runbooks and evidence

Existing [V `docs/ops/runbooks/`]: `free-tier-ops.md`, `purge-failing.md`, `stuck-deletion.md`, `restore-drill.md`, `incident-notification.md`. Proposed new (docs, `ops`, S each): `crash-triage.md` (open the GlitchTip or Organizer report, classify by `error_class`, hand to the owner agent, never copy a report body into an issue), `perf-regression.md` (a missed SLO: re-run, bisect by marker, owner table), `observability-leak.md` (a content leak found in a log or report: delete at the source, rotate, who tells whom; links `incident-notification.md`).

Evidence files: `docs/ops/evidence/<date>-<build>-observability-gate.md`, one per release candidate, listing each gate check below with pass or fail and the commit. Header carries model, iOS, app version, build, EAS fingerprint (NS-34-R3 [V]). `no-real-family-data` runs over the folder (same rule as `docs/qa/evidence/`).

## 7. Release gate checks (observability)

| Gate | Check | Where | Applies |
|---|---|---|---|
| OG-1 | No 1.0.x profile sets `EXPO_PUBLIC_ANALYTICS` or `EXPO_PUBLIC_STATUS_REPORT` on | test on `eas.json` (FR-DAT-01) | every 1.0.x |
| OG-2 | No `@sentry/*`, `posthog*` or `glitchtip` in the iOS bundle of a store profile | seam-guard extension | every 1.0.x |
| OG-3 | Label guard shows no new tracking SDK, usage string or entitlement | `label-effect.mjs` (G11-3) | every PR |
| OG-4 | Canary tests green: server `canary.test.ts`, device R4, crash-path R5, markers `[NS-34-R6]` | `unit` job | every PR |
| OG-5 | No throw interpolates a value (R3 baseline); the 3 date throws fixed | test | before first TestFlight of 1.0 |
| OG-6 | Event registry validator green; no name outside the registry; no property off the allowlist | `packages/analytics` test | every PR |
| OG-7 | Perf markers absent from store bundle | seam-guard | every 1.0.x |
| OG-8 | SLO rows measured on the candidate or recorded "not measured" (a HOLD row with no measurement holds) | evidence file | each candidate |
| OG-9 | Download under 40 MB thinned | App Store Connect (Z-01) | each candidate |
| OG-10 | Dark-build proof for the post-1.0 release: with the flag off no network call is made by the crash or analytics client | unit with a network fake (N-01) | before turning anything on |

## 8. Cost

Everything above is $0 inside the free limits stated in section 1. Items with a cap: GlitchTip 1,000 events a month; Grafana Cloud 10k series and 50 GB logs, 14 day retention; GitHub Actions minutes (the private repo's allowance, US $12 a month of compute on GitHub Free per `free-tier-ops.md` [V]; the weekly report adds under 1 minute a week [E]). Engineering cost is in the backlog rows. Founder time: opening two free accounts (about 30 minutes [E]).

## 9. Founder and counsel decisions

| # | Decision | Default |
|---|---|---|
| F1 | Approve adding a crash client dependency (Sentry-compatible SDK, native module) for the release after 1.0. `package.json` is founder-only; the label guard will flag it | Not before 1.0 ships; do the scrubber and tests first |
| F2 | Host for self-hosted tools (GlitchTip, Metabase): none exists | Use only hosted free tiers; no Metabase until a free host is named |
| F3 | Open a free GlitchTip account and a free Grafana Cloud account, no card on file | Open GlitchTip only when F1 is approved; skip Grafana until v1.1 |
| F4 | Counsel: wording of the consent sheet and the store label change for crash diagnostics (what is sent, retention 30 days, who processes it, add to `docs/legal/subprocessors.md` and the data map) | No change before 1.0; counsel reviews before any turn-on |
| F5 | Whether an uptime status page may be public | No; Upptime checks and issues in the private repo only |

## 10. Risks

1. A fatal error message can carry a date of birth into an Apple crash report today (3 throws). Mitigation: OG-5 first.
2. Free caps hide a flood of crashes (1,000 events a month). Mitigation: per-class caps and the "capped" count in the weekly report.
3. A free tier may change or end (limits read 20 Nov; no guarantee). Mitigation: nothing depends on the hosted tool for a gate; Apple's data stays the 1.0 gate.
4. No free host for self-hosting, so "self-host" is not available today.
5. The bucketed perf values still travel with a device model and OS version; with a small tester base that can single out a person. Mitigation: data-steward to rule on a minimum cohort size before turn-on; I propose no per-device breakdown below 20 devices [Rec, no basis yet].
6. Event-standard drift: I wrote names against the brief only; `00-event-standard.md` may differ.
7. Not read: `DATA_CLASSIFICATION`, `06-nfr.md` section 6, OpenTelemetry, Grafana and Superset licences, Sentry SDK licence, Deno OTel support. All [U].

## 11. Proposed implementation backlog (working ids IN-ops-nn; real BL ids from `product`)

| Id | Wave | Row | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-ops-01 | 1 | Replace the three date-bearing throws with code-only errors; test | `mobile`, `core` | S | none | no |
| IN-ops-02 | 1 | R1 to R3 lint or scan tests, typed device log `lib/diagnostics/log.ts` | `mobile` | S | none | no |
| IN-ops-03 | 1 | Canary tests R4 and R5 | `qa` | M | IN-ops-02 | no |
| IN-ops-04 | 1 | Gate tests OG-1, OG-2, OG-7 (seam-guard extension, proposed as a patch under `docs/ops/proposed/`) | `ops` | S | none | applies the patch |
| IN-ops-05 | 1 | Perf marker module and registry rows for `perf.*.measured` (with H1 of `MEASUREMENT-PLAN.md`) | `mobile`, `analytics` | M | event standard lands | no |
| IN-ops-06 | 2 | Weekly ops report script (numbers only, one issue) and SLO table | `ops` | S | free-limits workflow applied | applies workflow |
| IN-ops-07 | 2 | Runbooks: crash-triage, perf-regression, observability-leak | `ops` | S | none | no |
| IN-ops-08 | 2 | Evidence file template and no-real-family-data scan for `docs/ops/evidence/` | `ops`, `qa` | S | none | no |
| IN-ops-09 | 3 | Crash client wrapper, dark: scrubber, consent gate, per-class caps, tests at a mocked transport | `mobile` | M | F1, F4, IN-ops-01 to 03 | approves dependency |
| IN-ops-10 | 3 | OTel spike on one Edge Function (1 hour, no commit) | `ops` | S | F3 | opens account |
| IN-ops-11 | 3 | Upptime-style check job in the private repo (checks and issues, no Pages) | `ops` | S | none | founder adds secrets and copies workflow |

Waves: 1 now and inside 1.0 (no data leaves the phone); 2 around 1.0; 3 dark build for the release after 1.0.

## 12. For the CPO: decisions and risks

1. Crash diagnostics need a store label and consent decision (F4); default: nothing before 1.0.
2. Free means capped (1,000 crash events a month); default: sampled, and Apple's data remains the gate.
3. No dashboards until v1.1; default: a weekly numbers-only issue.
4. Risk: a date of birth can reach an Apple crash report through error text today; default: fix first (IN-ops-01).

Contradictions with the locked pack: none found. One open item for the standard: server log names do not follow `<area>.<object>.<action>` (section 2); proposed as a separate kind.
