# Insights loop

Owner: analytics engineer. Status: Draft 1, 3 Oct 2026. Decision source: founder decision 12 (`docs/agents/BRIEF-2026-10-03.md`): "Opt-in PostHog plus server aggregates, feeding a self-learning loop: agents regularly read the data, write findings and propose backlog items."

Labels: **Fact**, **Decision** (made here, reviewable), **Unverified**, **Founder** (a step only the founder can do).

---

## 1. The loop in one picture

```
 phones (opted in)          Supabase (all synced families)
      | PostHog events             | insights.* views, k = 10
      v                            v
 HogQL counts (read key) --> scripts/insights/run.ts <-- insights_aggregates() (insights_reader)
                                   |
                                   v
                     docs/insights/YYYY-MM-DD.md   (findings + ranked proposals, counts only)
                                   |
                                   v   weekly scheduled agent (section 6 prompt)
                     docs/backlog/proposals/YYYY-MM-DD-<id>.md   (draft PR)
                                   |
                                   v   PM lead / coordinator triage
                     docs/BACKLOG.md task, or "declined" note
                                   |
                                   v   shipped change, measured next weeks by the same metric
```

Nothing in the loop reads, stores or prints a letter, a transcript, a name, an id or anything a person wrote. Every number is a count, a rate, a week or a catalogue enum value.

## 2. Parts and where they live

| Part | Path | Notes |
|---|---|---|
| Server aggregates | `supabase/migrations/20261004300000_insights_aggregates.sql` | Six views in schema `insights` and `public.insights_aggregates(p_weeks)`; counts only; every published count 0 or at least 10; parts suppressed when their remainder is 1 to 9 (TRACKING_PLAN 4). Tests: `supabase/tests/insights_aggregates.test.mjs` |
| Device counts | PostHog HogQL via `POST /api/projects/:id/query/` | Queries in `packages/analytics/src/insights/hogql.ts`: weekly counts, one breakdown per catalogue property, and a weekly open, start, save funnel. Every query groups, counts and has `HAVING people >= 10` |
| Engine | `packages/analytics/src/insights/` | `computeInsights` (metrics, findings, anomalies, proposals), `renderReport`, `assertContentFree`, `syntheticInput`. Pure; not exported from the package index, so it never reaches the app bundle |
| Runner | `scripts/insights/run.ts` | `npm run insights -w @scribe/analytics` (real) or `-- --dry-run` (synthetic) |
| Reports | `docs/insights/YYYY-MM-DD.md` | One file per run; committed by the coordinator or the weekly agent's PR |
| Proposals | `docs/backlog/proposals/` | Written only by the weekly agent (section 6), never merged into `BACKLOG.md` automatically |
| Tests | `packages/analytics/test/insights.test.ts` | Synthetic dry run, planted problems found, ranking, k handling, content guard, parsing, source calls with a fake fetch, runner |

## 3. What the engine computes

All on the latest **complete** week before the report date (weeks start Monday, UTC), compared with the week before and the trailing four weeks.

| Area | Metric | Source |
|---|---|---|
| North star | Weekly keeping families; share of letters spoken | server |
| Depth | Letters per active family (mean); families with two or more voices | server |
| Funnel | First letter within 1 and 7 days of account creation (matured cohorts); opened to started, started to saved (people) | server; device |
| Retention | Writers active in week 1 and week 4 of their first-letter cohort | server |
| Drop-off | Captures discarded / started; discards by stage | device |
| Quality | Transcriptions with no speech, failed; verifier refusals by reason (including `not_vetted_for_language`) and edit type | device |
| Languages | Families per language (when the server has a letter language column); language changes; pack downloads started, completed, failed, by failure reason and pack | server; device |
| Adoption | Read together starters / openers; co-parent invite acceptance; store sheet outcomes | device; server |
| Anomalies | Latest week against the mean of up to four earlier weeks: flagged at 25% or more change, and 2 standard deviations when there are 3 or more earlier points, above a minimum volume | both |

**Proposal rules (Decision).** Each rule fires at most once per report and gives a stable id, so the same problem keeps the same id from week to week: `wkf-drop`, `two-voices-low`, `first-letter-conversion`, `week4-retention`, `coparent-accept`, `start-to-save`, `no-speech`, `transcription-failures`, `pack-failures-<reason>`, `not-vetted-for-language`, `store-unavailable`, `error-spike-<code>`. Each has problem, evidence (the numbers), hypothesis, change, metric and confidence. Thresholds are the targets in TRACKING_PLAN 1.2 and 1.3 (or marked A where they are assumptions).

**Ranking.** `score = impact (1 to 5) x log10(10 + volume) x confidence weight` (high 1, medium 0.6, low 0.3). Confidence is high only with enough volume (for example 200 or more transcriptions); anomalies are always low, because one week can be noise or a release.

**Honesty rules.** Device numbers are labelled "device" and never divided by server totals (TRACKING_PLAN 1.4). A suppressed server cell is unknown, never zero. Synthetic reports say so in their first line.

## 4. Credentials and set-up (Founder)

1. **PostHog read key.** In PostHog, create a personal API key with only the **Query Read** scope, limited to the Early Letters project. Store it as `POSTHOG_PERSONAL_API_KEY` in the scheduler's secret store, with `POSTHOG_PROJECT_ID` and `POSTHOG_API_HOST=https://us.posthog.com` (the private API host, not the `us.i.posthog.com` ingestion host). Never put it in the app or the repo.
2. **Supabase reader.** The migration creates the no-login role `insights_reader`, which can run only `insights_aggregates()` and read the six views, and grants it to `authenticator`. Mint a long-lived JWT with `{"role": "insights_reader"}` signed by the project's JWT secret, and store it as `SUPABASE_INSIGHTS_TOKEN`, with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. **Unverified:** whether the project's signing-key mode (legacy secret versus the newer asymmetric keys) still allows a custom-role JWT; if not, run the job with the secret key instead (broader: say so in the scheduler notes) or connect as a login role granted `insights_reader`.
3. **First real run.** `npm run insights -w @scribe/analytics` on a machine with those variables. **Unverified** until then: the HogQL function names (`toStartOfWeek(timestamp, 1)`, `countIf`) against PostHog's current HogQL; the run fails loudly (status and query name only) if a query is rejected.
4. **Apply the migration** in the order of `supabase/APPLY.md` (the coordinator adds the line; the founder applies).

## 5. Privacy and safety rules for the loop

- Counts only; k = 10 in the database, again in every HogQL query, and again in the engine (a count under 10 becomes unknown).
- Every breakdown value is checked against the catalogue's allowed values; anything else becomes `other` (`catalogueValue`).
- The report is refused (`assertContentFree`) if it contains anything shaped like an email, URL, UUID, token, phone number, or a name from the fictional test family.
- Errors carry an HTTP status and a query name, never a response body.
- Keys are read-only and live only in the scheduler's secrets. The job writes nothing to PostHog or Supabase.
- The scheduled agent may read `docs/insights/*.md` and the repo. It must not run SQL against production, query PostHog for individual persons, or export rows.

## 6. Prompt for the weekly scheduled agent

The founder schedules this after launch (weekly, Monday morning US Pacific). Each run is a fresh session; the prompt is complete on its own.

```text
You are the Early Letters insights agent. Repository: the Early Letters repo (codename scribe), branch develop.
Read first: CLAUDE.md, docs/agents/BRIEF-2026-10-03.md, docs/agents/COORDINATION.md, docs/analytics/INSIGHTS_LOOP.md,
docs/analytics/TRACKING_PLAN.md (sections 1 and 4), docs/BACKLOG.md (the format and every existing task title),
and the newest file in docs/backlog/proposals/ if the folder exists.

Goal: turn this week's insights report into at most 3 backlog proposals a product lead can accept or decline in
two minutes each.

Steps:
1. Run `npm ci`, then `npm run insights -w @scribe/analytics` (credentials are in the environment). If it fails,
   stop and report the error line only; do not retry with other credentials and do not use --dry-run for real data.
2. Read the new docs/insights/YYYY-MM-DD.md and the two previous reports, if any.
3. For each ranked proposal in the new report, in order, decide:
   - skip it if docs/backlog/proposals/ already has a file with the same proposal id whose status is open or
     declined in the last 8 weeks, or if a BACKLOG.md task already covers it (say which);
   - skip it if its confidence is low and it did not also appear in the previous report (one week can be noise);
   - otherwise write docs/backlog/proposals/YYYY-MM-DD-<id>.md.
   Stop after 3 files.
4. Each proposal file uses this shape, in plain calm English, no em or en dashes, no emoji:
   # <title>
   - Proposal id: <id>   - Report: docs/insights/YYYY-MM-DD.md   - Status: open
   - Problem: one or two sentences, with the numbers from the report.
   - Evidence: the report's evidence lines, plus the trend across the reports you read.
   - Hypothesis: why this happens; say what would prove it wrong.
   - Change: the smallest product or engineering change that tests the hypothesis; name the files or
     screens likely touched, and the owner role from BACKLOG.md.
   - Metric: the metric and target that decides success, and when to read it (which future report).
   - Confidence: high, medium or low, with one sentence why.
   - Satisfies: requirement ids from docs/prd or docs/legal if any apply; otherwise "none yet (PM to add)".
   - Risks: privacy, the constitution (the machine may remove and repair, never add meaning), content rules
     (no fear, guilt or streaks), and any effect on the one-ask-per-session rule.
   - Suggested BACKLOG.md entry: a draft task block in the BACKLOG format with Status: needs-decision.
5. Never include user content: no letter text, transcript, name, id, email or anything a person wrote. Use only
   numbers, weeks and the catalogue values that appear in the report. If you notice anything that looks like
   user content in a report, stop and report "content guard" without quoting it.
6. Never edit docs/BACKLOG.md, code, migrations or the catalogue. Never propose dark patterns, more asks, streaks,
   pressure to pay, or collecting more data than the catalogue allows; if the best fix needs a new event, propose
   it as a TRACKING_PLAN change for the analytics engineer and privacy counsel.
7. Open a draft pull request from branch docs/insights-YYYY-MM-DD with the report and the proposal files. Title:
   "Insights YYYY-MM-DD: <n> proposals". Body: one line per proposal (id, title, confidence) and the ids you
   skipped with the reason. Do not merge.
8. Final message: the PR link, the proposals written, the ones skipped and why, in at most 10 lines.
```

## 7. Open items

1. **Language mix on the server** needs a `public.entries.language` column (L4, owner: language and sync). The view reports `available: false` until it exists, with no new migration needed.
2. **Consent bias split** (TRACKING_PLAN 1.4) is not in the views yet: it needs a reviewed query joining `policy_acceptances` to activity counts, still k-anonymised. Proposed for the next migration range.
3. **Money** stays outside the loop at v1.0: App Store Connect exports are manual. If the founder wants them in the report, add a CSV reader for the ASC subscription report (aggregate, no subscriber ids) in a later version.
