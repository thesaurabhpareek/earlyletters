# Instrumentation: where measurement data lives and the reporting layer (data-architect)

Status: PROPOSED, 20 Nov 2026. Author: `data-architect`. Partner PM: PM4 family, reminders, days and lifecycle (`docs/product/instrumentation/04-family-reminders-days-lifecycle.md`, PR #1043). Read beside: `00-event-standard.md` (PR #1042), `data-steward.md` (PR #1037), `ops.md` (PR #1044). Docs only. `supabase/**` is founder-only, so every migration below is text for review, not a file, and no `approve-migration` label is claimed.

Revision 2 (20 Nov, later): founder direction in chat, "We are going to build for production now so analytics is needed. I am done with beta now." Analytics ships in the production release behind the opt-in consent gate; it is no longer dark through 1.0.x. This file now designs the data layer for a live product: retention, deletion on withdrawal (data-steward findings F-1 to F-5, `data-steward.md` section 7, merged), classification, the reporting role and cost. The locked statements FR-DAT-01, D-095 and D-124 item 3 say the opposite; they are not edited here. The change needs an erratum (number from the errata owner, next free after E83; CL-158) and the store label, privacy policy line 24 and 45 and the consent wording are the founder's and counsel's (steward section 10).

Founder rule (20 Nov, binding): only completely free, open-source tools that fit Expo/React Native, Supabase and Vercel; no paid product or tier. The coordinator adds: the Supabase and Vercel free tiers already in the stack stay.

Tags: [V] read this session, [U] unverified. Outside facts were read on 20 Nov 2026 from: posthog.com/pricing, posthog.com/docs/self-host, supabase.com/pricing, github.com/metabase/metabase, metabase.com/docs/latest/installation-and-operation/running-metabase-on-docker, github.com/apache/superset, github.com/grafana/grafana. Repo facts: `docs/analytics/TRACKING_PLAN.md` sections 4, 5, 7; `supabase/migrations/20261004300000_insights_aggregates.sql` (head only); the migration list (newest file in the tree is `20261109000000_child_name_optional.sql`; I did not confirm which migrations are recorded as applied in `.github/migrations-applied.txt`, so new files must sort after the newest applied one, [U]). Not read: the full bodies of the `insights.*` views, `analytics-forget/handler.ts`, `grants.mjs`, `supabase/APPLY.md`, `docs/tdd/02-sync-backend.md`; so every query-plan claim is [U] until `EXPLAIN` is run (section 7).

## 1. Decisions in one table

| Id | Decision (all PROPOSED) | Default |
|---|---|---|
| DA-1 | Phone events (screen, ui, perf and domain events with side `phone`) live in PostHog Cloud on its free plan, nowhere in our Postgres | Yes; needs founder and counsel (section 3) |
| DA-2 | Server counts live in Postgres schema `insights`, as k = 10 views over rows we already keep, plus at most two new gated counters | Yes (section 5) |
| DA-3 | Reporting layer: Metabase OSS, run on demand from the founder's laptop in Docker, reading through one read-only role; before that, Supabase SQL editor plus `insights_aggregates()` | Yes (section 4) |
| DA-4 | One new login role `reporting_reader`, member of `insights_reader` only, read-only by default, 5 s statement timeout, 2 connections | Yes (section 6) |
| DA-5 | No measurement data in object storage. Reports are files in the private ops repo | Yes |
| DA-6 | New server counters keep an operator kill switch, on at release (section 5.3) | Yes |
| DA-7 | Withdrawal deletes what we hold: a signed-out `withdrawal` route on `analytics-forget`, with a counts-only global quota (section 6) | Yes, needs the erratum and counsel |
| DA-8 | Production volume is watched against the free cap, and we never upgrade (section 3, 8) | Yes |

## 2. Where every kind of measurement data lives

| Data | Side (standard section 7) | Lives in | Why | Retention (steward section 5) |
|---|---|---|---|---|
| Screen, tap, impression, perf and domain events from the phone | phone | PostHog Cloud free plan, one project | Funnels, retention and dashboards exist; the SDK is already in `packages/analytics`; no new table or endpoint of ours | 12 months proposed; the free plan keeps events 1 year [V posthog.com/pricing] |
| Counts of what the server already knows (letters, families, invites accepted, second voice) | server | `insights.*` views over existing tables, k = 10 | Already built for the first four views (TRACKING_PLAN 4); no new write | Derived, nothing stored |
| Counts of server calls with no row today (invite peek, email sent) | server | `insights.server_counter_daily`, new, gated | Nothing else records them; Supabase logs keep "1 day" on the free plan [V supabase.com/pricing], so logs cannot answer a weekly question | Raw rows 13 months, published weekly with k = 10 |
| Crash and fault data | system | Apple Organizer in 1.0; ops picks the tool after (`ops.md` section 1) | Not mine | Ops |
| Store numbers (installs, trials, conversions) | store | App Store Connect, read by hand | Free, Apple's collection, no join | Apple |
| Support tally | support | Four counts in the read-out | FR-DAT-17 | Read-out |
| Weekly read-outs and evidence | all | Private ops repo as markdown | Free; already used by ops | Life of the repo |
| Files, audio, pictures | none | Not used for measurement | A file is content | n/a |

Never held anywhere: an event with a person, book, letter or media id; a join between the analytics id and an account id (standard section 11, TRACKING_PLAN 7).

## 3. The open question: PostHog cloud free plan, own Supabase table, or a self-hosted tool

Facts read this session:

- PostHog free plan: "The first 1M events are free, every month"; "Events are retained for 1 year on free plans"; "1 project"; "No credit card, not a trial"; over the limit "any additional events are permanently dropped", so nothing can be billed [V posthog.com/pricing]. The page says the open-source product "is MIT licensed"; it does not tie that to the cloud plan, and gives no region for the free plan [V]. Region choice (EU or US) is [U].
- PostHog self-host: "Hetzner VM with 4 vCPU, 16GB RAM, and more than 30GB storage"; "officially unsupported"; "All paid-plan features are Cloud-only"; the Docker Compose deploy is "under an MIT license" [V posthog.com/docs/self-host].
- Supabase free: "500 MB database size per project", "Limit of 2 active projects", "Free projects are paused after 1 week of inactivity", backups "Not included in free", logs "1 day", read-only dashboard roles only on Team and above [V supabase.com/pricing].
- Our volume: TRACKING_PLAN 5.1 estimates about 190 events per consenting parent per month, covering the old catalogue only. The basics (views, taps, impressions) add more. Assumption, to be replaced by a baseline: about 400 a month per consenting parent; 40 percent consent (TRACKING_PLAN 5.2); 2 parents a family. 1k families is about 320k events a month, about a third of the cap. The cap is reached near 3k families. TRACKING_PLAN 5.3 already has the sampling trigger (80 percent of budget).

| Option | Licence and cost | Fits the founder rule | What it costs us in design | Verdict |
|---|---|---|---|---|
| A. PostHog Cloud, free plan | MIT product [V]; plan $0, no card, hard cap, over-cap events dropped, never billed [V] | Yes if "free tier of an open-source product, like the Supabase and Vercel free tiers" is accepted; PM4 and `data-steward.md` read the rule more strictly. The founder rules (decision F-1) | One more processor: subprocessor row (PRIV-R12), DPA, label rows change, counsel on "Linked" (steward section 7). Keeps TRACKING_PLAN promise 4 (nothing on our servers stores the id). Deletion is asynchronous (steward F-2) | RECOMMENDED default |
| B. Own table in Supabase | Postgres is open source; Supabase free plan | Yes, no new vendor | We build the ingest endpoint (public, so abuse and rate limits), the funnels, retention and dashboards (the founder said adopt, not build). The id would sit in the same database as accounts, so promise 4 breaks. 500 MB is shared with letters and there are no backups [V]. Size: Assumption of 250 bytes a row with its index, 320k rows a month is about 80 MB a month, so raw events need a 30 day limit and a daily roll-up | FALLBACK only if counsel refuses a third party. Must be a separate Supabase project, not a schema, so no join is possible. Whether the 2 active project limit leaves room next to staging and production is [U] |
| C. Self-hosted PostHog | MIT [V] | Software yes; the host is not free | Needs 4 vCPU, 16 GB, 30 GB [V]; neither Supabase nor Vercel runs Docker Compose; unsupported [V]; we would become the processor and own security and deletion | REJECT: no free host in the stack |
| D. Nothing beyond Apple's numbers | Free | Yes | No funnels, no taps, no impressions | Superseded by the founder's direction; kept as the answer if counsel blocks both A and B |

Why A over B: the founder's own clarification asks for taps, impressions and funnels, which is what a product-analytics tool provides and B would make us write. A costs no database space and adds no write path or public endpoint to our Supabase project. B's one real advantage is that no outside party holds a pseudonymous behaviour log; that is a counsel and founder call, so B is kept ready as the fallback and A is a default, not a decision.

What carries over to A and B alike: consent gate before any send (V15), closed allowlist (V1 to V16), no replay, no autocapture, no flags (V16), retired ids sent to `analytics-forget`. A's free plan can change; the fail-safe is that the client sends nothing when the key is absent, and a plan change is a founder decision, never an upgrade by us.

## 4. Reporting layer (open-source BI on Postgres)

All three options need a machine that stays on to serve other people. We have none and no free host is in the stack. The honest cost of "free" is that the dashboard runs only when the founder starts it.

| Tool | Licence | Self-host | Real running cost | Data it would hold | Verdict |
|---|---|---|---|---|---|
| Metabase OSS | "released under the AGPL" for the open-source edition; commercial editions are under another licence [V github.com/metabase/metabase] | `docker run -d -p 3000:3000 --name metabase metabase/metabase` for local use; default app database is H2 on the file system, "if you remove the container, you'll lose your Metabase application data" [V Metabase docker docs]; memory need [U] | $0 software; $0 host if run on the founder's laptop on demand. A 24 hour dashboard needs a host we do not have: not proposed | Saved questions and dashboards (its own H2 file; mount a volume); no event data, it queries live | ADOPT as the default, laptop only |
| Apache Superset | Apache-2.0 [V github.com/apache/superset] | Docker Compose files in the repo; multi-service, heavier [V names only] | $0 software; same host problem, more to run | Same | Fallback if the founder wants a permissive licence |
| Grafana OSS | AGPL-3.0-only [V github.com/grafana/grafana] | Single binary or Docker | $0 software; same host problem. `ops.md` proposes its Cloud Free tier for numbers only | Time series | Not for product reporting; `ops` owns it for service health |

AGPL note: we run Metabase unmodified, for ourselves, and never offer it to users, so I expect no source obligation; `SEC-R07` limits licences "for what we ship" (`ADOPTION-RULES.md`, as quoted in `ops.md`) and this is not shipped. This is not legal advice; counsel confirms [U].

Reporting path, in order of cost:

1. Tier 0 (no tool): Supabase SQL editor with saved snippets calling `public.insights_aggregates(p_weeks)` (exists) and the new views of section 5. A weekly job in the private ops repo may call the same function through PostgREST with an `insights_reader` JWT and commit a markdown read-out (decision-science owns the format). No database password leaves Supabase.
2. Tier 1 (a dashboard): Metabase in Docker on the founder's laptop, connecting as `reporting_reader` (section 6), only while preparing a read-out. The password lives in the founder's keychain, never in the repo.
3. PostHog dashboards cover everything from the phone. No second tool joins them to Postgres numbers; the read-out puts the two side by side and says they are not joined.

## 5. Server-side events, views and tables (migration proposals)

Files would be new, sorted after the newest applied migration, one concern each. Each carries grants in its own migration and a row in `supabase/tests/grants.mjs` (CLAUDE.md), and each new column carries class and level in the same PR (DATA-REQ-001, 002; the classification test fails on an unlabelled column). All columns below are L2, aggregate, no person.

### 5.1 Views over rows we already keep (no new write, nothing gated)

| Registry name (standard section 2) | Source | View |
|---|---|---|
| `family.invite.accepted` | the `child_members` row created by accept, plus the invite row's created time [U: column names not read] | `insights.weekly_invites_accepted` (exists in part as `family_invites`, TRACKING_PLAN 4: sent, accepted, accepted_within_7d) |
| `family.second_voice.kept` | first non-deleted letter by a joined parent within 14 days, a per-book boolean rolled to a weekly count | `insights.weekly_second_voice`, k = 10, using `insights.k` and `insights.k_part` |

Both reuse the internal-key rule of the existing views (a key is never an output column) and publish only 0 or at least 10.

### 5.2 Two counters for calls that leave no row

| Registry name | Trigger | Closed values |
|---|---|---|
| `family.invite.opened` (server, side `server`) | a `peek_invite` call | `outcome`: ok, expired, revoked, used, not_found |
| `system.email.sent` (server) | the sender function hands a message to the mail provider or fails | `template` (list owned by `content`), `class`: transactional, `outcome`: accepted, failed |

Proposed migration `YYYYMMDD000000_insights_server_counters.sql` (text only):

```sql
create table insights.counter_registry (
  name text primary key,                 -- standard section 2 name
  v int not null check (v >= 1),
  allowed_outcomes text[] not null
);
create table insights.server_counter_daily (
  day date not null,
  counter text not null references insights.counter_registry(name),
  outcome text not null,                 -- checked against the registry in _bump
  n bigint not null default 0 check (n >= 0),
  primary key (day, counter, outcome)
);
create table insights._switch (on_ boolean not null default false);   -- one row, off
create function insights._bump(p_counter text, p_outcome text) returns void
language plpgsql security definer set search_path = pg_catalog, insights as $$
begin
  if not (select on_ from insights._switch) then return; end if;
  -- reject unknown counter or outcome; no free-text parameter exists
  ...
  insert into insights.server_counter_daily values (current_date, p_counter, p_outcome, 1)
  on conflict (day, counter, outcome) do update set n = insights.server_counter_daily.n + 1;
end $$;
revoke all on function insights._bump(text, text) from public;   -- granted to the two callers only
create view insights.weekly_server_counters as
  select date_trunc('week', day)::date as week, counter, outcome, insights.k(sum(n)) as n
  from insights.server_counter_daily group by 1, 2, 3;
```

Properties that make it safe: no person column and no foreign key to any account table; the only inputs are two values checked against a registry the migration seeds, so a call site cannot write a string we did not list; counts are calls, not people, and the read-out says so. Registry rows are generated from the catalogue (standard section 7) so a drift test (V8) compares `counter_registry` to the doc.

### 5.3 Production gate and kill switch

With analytics shipping, FR-DAT-01 ("no counter ... written for us") no longer describes the product, so the counters are not hidden behind it. `insights._switch.on_` stays as an operator kill switch: the founder sets it on at release and can set it off in one statement if a counter misbehaves (a runaway write path, an abuse of `peek_invite`). The counters hold no person, so they need no consent gate (standard section 7: `none_server_aggregate`, k = 10); whether counsel wants them named in the policy is F-9.

> Proposed change (needs an erratum, next free after E83, CL-158): replace FR-DAT-01 and FR-DAT-28 for the production release with "analytics is on only after a parent says yes; server counts of calls, with no person, are always on and published only at k = 10". Founder direction of 20 Nov is the reason; legal text and label follow it.

### 5.4 What is NOT stored on the server

Phone events, the analytics id, per-person anything, undo and removal signals (PM4 CPO-3 default: server counts only, k = 10, unread in 1.0), purchases (App Store Connect), email opens (E75, tracking off).

## 6. Access rules for the reporting role

Proposed migration `YYYYMMDD010000_reporting_role.sql` (text only):

```sql
create role reporting_reader login connection limit 2 password null;   -- password set out of band, never in a migration
grant insights_reader to reporting_reader;
alter role reporting_reader set default_transaction_read_only = on;
alter role reporting_reader set statement_timeout = '5s';
alter role reporting_reader set search_path = insights, pg_catalog;
```

Rule set, each with a test in `supabase/tests/reporting_role.test.mjs` (LEGAL-REQ-024, B-NFR-003). Allow means the role can; deny means it gets a permission error.

| Rule | Allow test | Deny test |
|---|---|---|
| Reads the published `insights` views and `public.insights_aggregates(n)` | select from each view returns rows or none, never an error | none |
| Sees only k = 10 cells | a seeded cell of 9 reads as null; a cell of 10 reads as 10 | a part whose remainder is under 10 reads as null |
| No content or person table | none | select on `public.entries`, `profiles`, `children`, `child_members`, `audit_log`, `policy_acceptances`, `auth.users` each fails |
| No internals | none | select on `insights.server_counter_daily`, `insights._switch`, any underscore object fails; `_bump` cannot be executed |
| Read-only | `show default_transaction_read_only` is on | insert, update, delete, DDL, `create temp table` and `set transaction read write` all fail |
| No privilege escalation | none | `set role service_role`, `set role authenticated` and `grant` fail |
| Bounded | a 1 s query runs | `select pg_sleep(6)` is cancelled at 5 s; a third connection is refused |
| Not reachable by the app | none | `anon` and `authenticated` cannot select `insights.*` or execute `_bump` (extends `insights_aggregates.test.mjs`) |
| Counter safety | `_bump` with a registered pair adds 1 when the switch is on | with the kill switch off nothing is written; an unknown counter or outcome raises; no function takes free text |
| Unlabelled columns | none | the classification test fails a new column without class and level |

Residual risk, said plainly: a database password on a laptop is a credential outside Supabase. Mitigation: Tier 0 needs none; the role can read only k = 10 counts, so a leak shows no person; rotate after each use (founder-hands). Network restrictions on the free plan are [U].

## 6a. Retention, withdrawal and deletion (production)

Retention (data-steward section 5; numbers are counsel's, Q51):

| Data | Retention | Enforced by |
|---|---|---|
| PostHog events | 12 months; the free plan itself keeps events 1 year [V posthog.com/pricing], so no job of ours is needed under A | the plan; a release gate compares the policy number to it (steward IN-DS-04) |
| Deleted PostHog data in backups | stays until backups expire, about two weeks for events and about 12 months for app data; clean-up runs monthly (steward section 5, from PostHog's deletion page, not re-read by me) | say "within about a month" (F-4), counsel reconciles with the 14 days in the deletion spec |
| `insights.server_counter_daily` | raw rows 13 months, then deleted by a monthly job (proposed, in `ops` cron or `pg_cron` [U on free plan]) | a test seeds a 14 month row and runs the job |
| Weekly views | derived, nothing stored | n/a |
| Consent act row | account life, then pseudonymised and kept 3 years (PRIV-R21, counsel Q41 e) | existing |
| Fallback B events | raw 30 days, daily roll-up kept 13 months | job plus test |

Withdrawal (steward F-1 to F-5). Design, data side only:

1. Phone: on withdraw it retires the current id and now also calls `analytics-forget` with all retained ids at once (F-5: when the cap of 20 would drop an id, forget it first).
2. Server: `analytics-forget` accepts a new reason `withdrawal` for a caller with no account. The ids are random UUIDs we never issued to a person, so possession of them is the credential: an attacker cannot delete another family's events without knowing their random id. The abuse left is flooding the PostHog delete API, so the route has a global, counts-only quota instead of a per-person one. Proposed migration `YYYYMMDD020000_forget_withdrawal_quota.sql`: `ops.forget_quota_anon(day date primary key, n int not null check (n >= 0))`, bumped by a definer function `ops.forget_anon_take(p_limit int) returns boolean` that returns false when the day's `n` reached `p_limit` (proposed 500 a day). No id, no IP, no person column; class L2 aggregate; granted to `service_role` only; allow and deny tests: take succeeds under the limit, fails at the limit, `anon` and `authenticated` cannot execute or select, the table holds no column that could hold an id (a shape test).
3. Receipts: the deletion spec receipt for this path says `posthog: accepted`, not `deleted` (F-3). The function reads `persons_queued_for_deletion` and `deletion_errors`, logs counts only and retries (steward IN-DS-03). A silent miss must not read as success.
4. Proof: the staging drill (steward F-2, IN-DS-06) is a release gate. If PostHog does not delete events that have no person profile, option A cannot promise deletion, and the answer is fallback B, where deletion is `delete from ... where analytics_id = any(ids)` in a definer function with a pinned `search_path`, no logging of ids, and a receipt `store: verified` (steward F-6).
5. Account deletion keeps its existing path (signed-in, per-person quota 5 a day, `ops.forget_quota`).
6. What stays after withdrawal: server counters (no person), the consent act rows (a record that a choice was made, never the analytics id), and Apple's own numbers.

## 6b. Classification of what this file adds

Every column carries class and level in the same PR (DATA-REQ-001, 002); the classification test fails on an unlabelled one. Per steward section 2, anything recorded here is L2; L3 and L4 are not representable.

| Object.column | Class | Level | Note |
|---|---|---|---|
| `insights.counter_registry.name, v, allowed_outcomes` | product analytics definition | L1 | our own names, no data about a person |
| `insights.server_counter_daily.day` | product analytics | L2 | aggregate day, not a person's date |
| `insights.server_counter_daily.counter, outcome` | product analytics | L2 | closed values |
| `insights.server_counter_daily.n` | product analytics | L2 | calls, not people; published only at k = 10 |
| `insights._switch.on_` | operational | L1 | |
| `ops.forget_quota_anon.day, n` | operational counts | L2 | counts only, no id |
| role `reporting_reader` | n/a | n/a | grants listed in `grants.mjs` |
| PostHog event properties | product analytics | L2 | owned by `analytics` and the steward's table; none is stored by us under A |

The privacy label impact (Usage Data, Diagnostics, Linked or not) is `data-steward.md` section 10; for the server counters it is "no identifier collected".

## 7. Indexes and query budget

- Reads for reporting are weekly group-bys over `entries`, `child_members` and invites by week. Budget (Assumption, mine): each published view under 2 s at 10k letters and under the 5 s role timeout at 1M; this is a founder-side report, not the client save path (DATA-REQ-048 p95 200 ms is the phone's).
- Checked: nothing. I have not run `EXPLAIN` and did not read the view bodies [U]. Step IN-DA-04 runs `EXPLAIN (ANALYZE, BUFFERS)` for every `insights` view on seeded data in `supabase/tests/perf.test.mjs` and proposes an index only where a seq scan exceeds budget (candidates: an expression index on `least(captured_at, created_at)` for non-deleted entries, if absent).
- `server_counter_daily` has a 3 column primary key; at most (days x counters x outcomes) rows, under 10k a year. No further index.
- Size: Postgres holds no phone events in the default (A). Counters are under 1 MB a year, so the 500 MB free limit [V] is untouched.

## 8. Cost

| Item | Cost | Source |
|---|---|---|
| PostHog Cloud free plan, up to 1M events a month | $0; over the cap events are dropped, not billed | [V posthog.com/pricing] |
| Supabase free plan (existing) | $0; no new project in A | [V supabase.com/pricing] |
| Metabase OSS on the founder's laptop | $0 software, $0 host | [V github.com/metabase/metabase] |
| Superset, Grafana OSS | $0 software; need a host | [V] |
| Always-on dashboard host | Not free; not proposed | self-host page minimums [V] |
| Engineering time | 2 migrations, one test file, catalogue rows | the backlog below |

Total running cost proposed: $0, at production volume up to the PostHog cap. What "free" does not buy: a dashboard that is up when the founder is away, backups of the free Supabase project [V "Not included in free"], and a guarantee the free PostHog plan stays as read today (it is a hosted plan that could change, [U]).

## 9. Where this meets the standard, PM4 and the pack

1. PM4 rows use `family.invite.peeked` and `family.second_voice.reached`. The standard's action list is closed and has neither `peeked` nor `reached` (standard section 2). Proposed mapping: `family.invite.opened` and `family.second_voice.kept`, both in the list. If PM4 and `analytics` prefer the original names, the list needs a PR to the standard. Decision for `analytics` and PM4; no erratum needed.
2. PM4 section 4.2 marks `family.invite.accepted` a "server counter". Under 5.1 it is a view over a row that already exists, so it needs no new write.
3. The standard's server consent gate is `none_server_aggregate` with k = 10 (section 7). PM4 section 5 quotes FR-DAT-08 "no cell under 5". The two differ; I follow k = 10 (stricter, already built).
4. FR-DAT-01, D-095 and D-124 item 3 (no analytics in 1.0.x) versus the founder's production direction: section 5.3 and the header. Locked text is not changed here; an erratum is proposed.
5. `data-steward.md` section 1 rates PostHog Cloud "No, by the founder's wording" and PM4 declines it. This file recommends it as a default and says so; the founder settles (F-1). I do not override either file's finding that the rule can be read strictly.
6. TRACKING_PLAN promise 4 stays true under A and breaks under B (steward section 1). Under A the plan's ADR 0008 choice of PostHog (cited in TRACKING_PLAN 5.2) is preserved.
7. Retention: A's free plan keeps 1 year [V], matching the steward's 12 months, so no retention job of ours is needed under A.

## Founder and counsel decisions

| Id | Decision | Default |
|---|---|---|
| F-1 | Is PostHog Cloud's free plan (an open-source product, $0, no card, hard cap) inside "completely free, open-source"? | Yes, as the Supabase and Vercel free tiers are. If no: fallback B (separate Supabase project) |
| F-2 | Region of the PostHog project (EU or US) | EU if offered [U]; decide before the first event |
| F-3 | Counsel: is a pseudonymous id at PostHog "Linked" for the Apple label, and does it need a DPA and a subprocessor row | Treat as Linked until counsel says otherwise (steward section 7) |
| F-4 | Approve the two migrations (counters, reporting role) with `approve-migration` | Requested for the production release train; red-team review first (D-041) |
| F-5 | Allow a database login (`reporting_reader`) on the founder's laptop, or Tier 0 only | Tier 0 only until a dashboard is wanted |
| F-9 | Do server counters of calls (no person) need a line in the privacy policy and a label row | Yes, one plain line, counsel confirms |
| F-10 | The production project is on the Supabase free plan: no backups, paused after 1 week of inactivity [V]. Keep it, or add a paid plan | Keep, per the founder rule, with the keepalive and the backups repo job (`ops`); the founder accepts the risk in writing |
| F-6 | Erratum text for production analytics (5.3) and for withdrawal deletion (section 6), one erratum or two | Two: the first is a product rule, the second adds to the locked analytics promise |
| F-7 | Metabase (AGPL, internal use) or Superset (Apache-2.0) | Metabase; counsel confirms the AGPL reading |
| F-8 | Any always-on host for dashboards | None; stay on demand |

## Risks

1. Event volume is an assumption (400 a month a parent) and in production the cap is real. Mitigation: the 80 percent sampling trigger (TRACKING_PLAN 5.3, remote config); a weekly look at PostHog's usage page by hand or the read-out job (an API for usage is [U]); over-cap events are dropped, so the last days of a month could be missing and a read-out says so. Never sampled: consent, letter saved, capture, family, errors. We never upgrade; when the cap bites we sample harder.
1a. Production on free tiers: Supabase free has no backups and pauses after a week of inactivity [V]. This is outside measurement but it is now a live-product risk (F-10).
2. The free PostHog plan or the Supabase free plan can change terms or pause (Supabase pauses after 1 week of inactivity [V]); the keepalive in ops covers the second.
3. A reporting credential on a laptop. Mitigated by k = 10 only and Tier 0.
4. Counters count calls, not people; a retried or abused `peek_invite` inflates them. Rate limits already exist on invites [U]; the read-out labels it "calls".
5. Small tester base: most cells are under 10 and read as null. That is the privacy rule working; decision-science owns how to present it.
6. The `insights_reader` JWT used by a weekly job must live in a repo secret; that file is founder-only (`.github`).
7. Without backups on free Supabase, a restore loses counters. They are derived and low value, so accepted.
8. [U] View bodies, column names and indexes were not read; migrations are drafts until written against the real schema.

## Proposed implementation backlog (working ids; real BL ids from product)

| Id | Wave | Row | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-DA-01 | 1 | Founder rules F-1, F-2, F-3 and F-10; the production erratum; subprocessor and label notes drafted | privacy, data-architect | S | none | yes |
| IN-DA-02 | 1 | `EXPLAIN` every `insights` view on seeded data; index only where over budget; state budget in the PR | data-architect | S | none | no |
| IN-DA-03 | 1 | Write `reporting_reader` migration and `reporting_role.test.mjs` with the rows in section 6, plus grants.mjs row | data-architect | M | IN-DA-02 | yes (approve-migration, supabase) |
| IN-DA-04 | 2 | Views `weekly_second_voice` and `weekly_invites_accepted` (5.1) with tests and column labels | data-architect | M | 00-event-standard merged, PM4 mapping | yes |
| IN-DA-05 | 2 | Counters migration (5.2), kill switch, `_bump` call sites in `peek_invite` and the email sender, retention job, tests | data-architect, sync | M | IN-DA-03, the production erratum | yes |
| IN-DA-10 | 1 | Withdrawal route: `ops.forget_quota_anon` migration (6a), `withdrawal` reason in `analytics-forget`, read `deletion_errors`, retired-id cap fix, tests | data-architect, sync | M | F-1, F-3, the withdrawal erratum | yes (legal text, supabase) |
| IN-DA-11 | 1 | Release gate: the staging deletion drill passes and the policy retention number equals the PostHog setting | qa, ops | S | IN-DA-10, steward IN-DS-06 | yes |
| IN-DA-06 | 2 | Tier 0 snippets and the weekly read-out job in the ops repo | decision-science, ops | S | IN-DA-04 | yes (secret) |
| IN-DA-07 | 3 | Metabase on demand: saved questions as text in the ops repo, runbook, credential rotation step | ops | S | IN-DA-03, F-5 | yes |
| IN-DA-08 | 2 | Staging drill: events under a test id reach PostHog, forget (account and withdrawal paths) removes them; counters with the kill switch off write nothing | qa | S | F-1, IN-DA-05, IN-DA-10 | yes |
| IN-DA-09 | 3 | Fallback B design (separate project, 30 day raw, daily roll-up) only if F-1 or F-3 say no | data-architect | M | F-1 | yes |

New dependencies: none. The PostHog SDK already exists in `packages/analytics`; Metabase runs outside the repo as a container.

Signed: data-architect.
