-- PROPOSAL for the data-architect lane (BL-584, DATA-03). Not a migration: take the file number from
-- `node scripts/agents/next-id.mjs` when you write it, sort it after 20261028010000, and add
-- 'ops_cron_health(integer)' to supabase/tests/grants.mjs with the service role as its only grantee.
--
-- Reads the cron schedule's own log and returns counts and job names only. No row, no argument, no text
-- from jobs.command or job_run_details.return_message (those can hold SQL text or errors).
-- scripts/ops/lib/purge-watch.ts calls it with the service role and prints failed_jobs after checking
-- each name against ^scribe-[a-z0-9-]{1,60}$.
create or replace function public.ops_cron_health(p_window_minutes integer default 120)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_window integer := least(greatest(coalesce(p_window_minutes, 120), 1), 10080);
  v_failed integer;
  v_jobs jsonb;
begin
  if to_regclass('cron.job_run_details') is null then
    -- pg_cron not installed: report it as a failure the watch can see, not as a quiet zero.
    return jsonb_build_object('failed_runs', 1, 'failed_jobs', '[]'::jsonb, 'window_minutes', v_window);
  end if;
  select count(*)::int, coalesce(jsonb_agg(distinct j.jobname) filter (where j.jobname like 'scribe-%'), '[]'::jsonb)
    into v_failed, v_jobs
    from cron.job_run_details d
    join cron.job j on j.jobid = d.jobid
   where j.jobname like 'scribe-%'
     and d.status = 'failed'
     and d.start_time >= now() - make_interval(mins => v_window);
  return jsonb_build_object('failed_runs', v_failed, 'failed_jobs', v_jobs, 'window_minutes', v_window);
end;
$$;

revoke execute on function public.ops_cron_health(integer) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_cron_health(integer) to service_role';
  end if;
end;
$$;

comment on function public.ops_cron_health(integer) is
  'Failed scribe-* pg_cron runs in the last N minutes: a count and job names, nothing else. Called by the outside purge watch (BL-584).';
