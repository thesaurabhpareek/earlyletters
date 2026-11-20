# BL-584: an outside alert when purge or retention stops running (DATA-03)

Status: proposal for the founder's 9 Nov window. Code and tests are on this branch; the workflow and the SQL are proposals.

## What the code does (`scripts/ops/purge-watch.ts`, `scripts/ops/lib/purge-watch.ts`, tests `[BL-584]`)
Reads `public.ops_deletion_sla()` (exists) and `public.ops_cron_health(p_window_minutes)` (proposed) with the service role and exits non-zero when:
- no `purge_run` audit row is newer than 120 minutes, or none exists;
- a `scribe-*` run failed in `cron.job_run_details` in the last 120 minutes;
- it could not find out: project unreachable, read refused, function not installed, answer of the wrong shape.
Output is numbers, fixed reasons and job names matching `scribe-[a-z0-9-]+`. No URL, key, row or response body.

## Founder and data-architect steps
1. data-architect: turn `docs/ops/proposed/ops_cron_health.sql` into a migration (number from `next-id.mjs`, grants line in `supabase/tests/grants.mjs`).
2. Founder: create repository secrets `SUPABASE_STAGING_URL` and `SUPABASE_STAGING_SERVICE_ROLE_KEY`; copy `docs/ops/proposed/purge-watch.yml` to `.github/workflows/purge-watch.yml`. Until step 1 is applied, set `WATCH_ARGS: --purge-only` (the run still fails, by design, because the cron half is "not checked").
3. After it runs green once, change `docs/ops/runbooks/purge-failing.md` line 4: a dead worker is now caught by the outside watch within 2 hours.

## Not done
No scheduled run has happened. The 30-minute schedule is GitHub's best effort and can be delayed. The service-role secret is a large grant for a scheduled job; a narrower alternative is a Postgres role that can execute only the two functions, which needs a migration. The watch runs against staging only.
