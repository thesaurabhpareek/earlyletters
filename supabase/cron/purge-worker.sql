-- Schedules the purge-worker Edge Function with pg_cron and pg_net.
--
-- NOT a migration: it holds a per-environment URL and secret, so it is run by
-- hand once per project (staging, then production) in Dashboard > SQL Editor,
-- after the worker is deployed and its secrets are set (docs/ops/SECURITY.md).
-- Steps and checks: docs/ops/runbooks/purge-failing.md ("Install or reinstall the schedule").
--
-- Pattern from Supabase "Scheduling Edge Functions" (opened 3 Oct 2026): Vault
-- holds the values, cron.schedule runs net.http_post every 15 minutes. The
-- worker answers 202 at once and keeps working in the background, so the pg_net
-- timeout below only covers the hand-off.
--
-- Least privilege: the job presents PURGE_WORKER_SECRET, a dedicated random value,
-- not the service role key. A leak of it can start a run, nothing more.
-- The worker is deployed with --no-verify-jwt because this bearer is not a JWT;
-- the apikey header carries the publishable (anon) key for the API gateway.
--
-- Prerequisites (Dashboard > Integrations): Cron (pg_cron) and pg_net enabled; Vault on.

-- 1. Secrets in Vault. Replace the three placeholders; never commit real values.
--    If a name already exists, update it with vault.update_secret(id, new_value) instead.
select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
select vault.create_secret('<PUBLISHABLE_OR_ANON_KEY>', 'publishable_key');
select vault.create_secret('<SAME VALUE AS THE PURGE_WORKER_SECRET FUNCTION SECRET>', 'purge_worker_secret');

-- 2. Every 15 minutes: purge_due batches, Storage queue, deletion emails, account steps, SLA alerts.
select cron.schedule(
  'scribe-purge-worker',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'purge_worker_secret')),
    body := '{"task": "run"}'::jsonb,
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);

-- 3. Once a day at 03:17 UTC: purge ledger copy to the ops-ledger bucket, ops retention.
select cron.schedule(
  'scribe-purge-worker-daily',
  '17 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'purge_worker_secret')),
    body := '{"task": "daily"}'::jsonb,
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);

-- 4. Keep the hourly SQL-only job from supabase/APPLY.md step 7 ('scribe-purge-due') as a backstop:
--    if Edge Functions are down, letters and books still leave Postgres on time.

-- Checks (run after 20 minutes):
--   select jobname, schedule, active from cron.job order by jobname;
--   select jobid, status, start_time from cron.job_run_details order by start_time desc limit 10;
--   select id, status_code, timed_out, created from net._http_response order by created desc limit 10;   -- expect 202
--   select action, at from public.audit_events where action = 'purge_run' order by at desc limit 3;       -- fresh rows
--
-- Rollback:
--   select cron.unschedule('scribe-purge-worker');
--   select cron.unschedule('scribe-purge-worker-daily');
