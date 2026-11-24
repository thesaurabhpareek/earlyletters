-- BL-584 (DATA-03, CR-209 option A): ops_cron_health(p_window_minutes), the second of the two content-free
-- reads the outside purge watch needs. The first, ops_deletion_sla(), already returns purge_run_age_minutes.
-- It counts failed scribe-* pg_cron runs in the last N minutes (default 120, clamped 1 to 10080) and names
-- the jobs. No jobs.command text, no job_run_details.return_message (those can hold SQL text or errors), no
-- row, no argument echoed back. If pg_cron is not installed it answers failed_runs 1 and names nothing, so a
-- missing scheduler is a visible failure and never a quiet zero.
--
-- Called only by the ops-health Edge Function (supabase/functions/ops-health), as service_role. Own grants:
-- execute is revoked from public, anon and authenticated and given to service_role alone
-- (supabase/tests/grants.mjs SERVICE_ROLE_FUNCTIONS). security definer, search_path pg_catalog, public, pg_temp.
--
-- Adds one function; changes and drops nothing. Rollback: drop function public.ops_cron_health(integer);
-- Hosted apply is a founder step (CR-73, queue row FO-1); nothing here applies to any remote project.

create or replace function public.ops_cron_health(p_window_minutes integer default 120)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_window integer := least(greatest(coalesce(p_window_minutes, 120), 1), 10080);
  v_failed integer;
  v_jobs jsonb;
begin
  if to_regclass('cron.job_run_details') is null or to_regclass('cron.job') is null then
    return jsonb_build_object('failed_runs', 1, 'failed_jobs', '[]'::jsonb, 'window_minutes', v_window);
  end if;
  select count(*)::integer,
         coalesce(jsonb_agg(distinct j.jobname) filter (where j.jobname ~ '^scribe-[a-z0-9-]{1,60}$'), '[]'::jsonb)
    into v_failed, v_jobs
    from cron.job_run_details d
    join cron.job j on j.jobid = d.jobid
   where j.jobname like 'scribe-%'
     and d.status = 'failed'
     and d.start_time >= now() - make_interval(mins => v_window);
  return jsonb_build_object('failed_runs', v_failed, 'failed_jobs', v_jobs, 'window_minutes', v_window);
end;
$$;

revoke all on function public.ops_cron_health(integer) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ops_cron_health(integer) to service_role;
  end if;
end $$;

comment on function public.ops_cron_health(integer) is
  'Failed scribe-* pg_cron runs in the last N minutes: a count and job names, nothing else. Read by the ops-health Edge Function for the outside purge watch (BL-584).';
