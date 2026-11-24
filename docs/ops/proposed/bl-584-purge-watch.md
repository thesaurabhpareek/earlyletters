# BL-584: an outside alert when purge or retention stops running (DATA-03, CR-209)

Status: code and tests are on `develop` (stack of three PRs, below). The migration apply, the function deploy, the Environment and the workflow push are the founder's (CR-73, queue row FO-1). Nothing in the PRs applies, deploys or pushes any of them.

## What it is (CR-209 option A)
- `public.ops_cron_health(p_window_minutes)` (migration `20261124120000_ops_cron_health.sql`, service_role only, own grant row): failed `scribe-*` pg_cron runs in the last N minutes, a count and job names.
- `supabase/functions/ops-health` (`handler.ts`; entry point and deploy rules: `docs/ops/proposed/ops-health-deploy.md`): `GET` with its own bearer token `OPS_HEALTH_TOKEN`, constant-time compare, checked first. Answers `{purge_run_age_minutes, failed_cron_runs}` and nothing else. It reads `ops_deletion_sla()` and `ops_cron_health(120)` with the service key, which never leaves Supabase.
- `scripts/ops/purge-watch.ts` reads `OPS_HEALTH_URL` and `OPS_HEALTH_TOKEN` and exits non-zero when no `purge_run` audit row is newer than 120 minutes (or none exists), a `scribe-*` run failed in the last 120 minutes, or it could not find out. Output: numbers and fixed reasons. No URL, token, row or response body.
- `docs/ops/proposed/purge-watch.yml`: the scheduled workflow, Environment `ops-watch`, no repository-level secret.

The repository-level service-role secret of closed #656 is refused (CR-209; `docs/security/SECRETS_REVIEW.md` section 9, SEC-R04).

## Founder steps (FO-1, about 25 minutes, in this order)
1. Apply `20261124120000_ops_cron_health.sql` to production by the tagged route in FOUNDER_QUEUE row 5. It adds one function and changes nothing else. Rollback: `drop function public.ops_cron_health(integer);`.
2. In the Supabase console set the function secret `OPS_HEALTH_TOKEN` (`openssl rand -hex 32`). Never paste it anywhere else.
3. Apply `docs/ops/proposed/ops-health-deploy.md` as one commit (entry point and the two `.github/scripts` edits), then deploy: `npx supabase functions deploy ops-health --no-verify-jwt --use-api`.
4. In GitHub create Environment `ops-watch` with no required reviewer and the secrets `OPS_HEALTH_URL` and `OPS_HEALTH_TOKEN` (the same token). Deployment branches: main only (recommended; set it to "Selected branches" and allow `main` only), so a workflow on another branch cannot name the Environment and read the two secrets.
5. Copy `docs/ops/proposed/purge-watch.yml` to `.github/workflows/purge-watch.yml`. Run it once by hand (`workflow_dispatch`); it should be green.
6. After it ran green once, change `docs/ops/runbooks/purge-failing.md` line 4: a dead worker is now caught by the outside watch within 2 hours.

Default if not done: the weekly check (D-159) and the runbook; a stuck purge may go unseen for up to a week. Way back: remove the Environment, the workflow and the function; drop the function in SQL.

## Not done
No scheduled run has happened. The 30-minute schedule is GitHub's best effort and can be delayed. Whether the hosted production project has the `purge_run` audit rows and the `scribe-*` cron jobs applied is UNVERIFIED (that is what FO-1 and FO-4 are for). The token can be guessed only by brute force against a public URL; the function has no rate limit of its own beyond the platform's. A leaked token tells an attacker whether purge is stale; revoke it by setting a new function secret and the GitHub secret.
