-- BL-1252 server half, PR 1 (design: security-architect, section 3).
-- A separate daily quota bucket for analytics-forget reason `retired_id`, so cleanup of retired
-- analytics ids can never use up the shared bucket (5 a day) that account_deletion and
-- device_after_deletion draw from. The shared table and function are untouched.
--
-- Why a new counter and not a smaller limit on the old one: ops_consume_forget_quota increments
-- even when it refuses, so a smaller limit on the shared row would still starve it.
--
-- search_path is pinned pg_catalog first and pg_temp last (the repo gate). Same shape as ops.forget_quota: counts only, never an analytics id. Rows go with the person
-- (cascade on profile delete) and the function clears that person's rows older than a day.
-- Residual: a failed provider call still counts as a call; the bucket is isolated, so it only
-- costs retired_id calls.
--
-- Hosted apply is a founder step (CR-73) and needs the approve-migration label; nothing here
-- applies to any remote project.

create table ops.forget_quota_retired (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  calls int not null default 0,
  primary key (profile_id, day)
);

alter table ops.forget_quota_retired enable row level security;
revoke all on ops.forget_quota_retired from public, anon, authenticated;

comment on table ops.forget_quota_retired is 'analytics-forget retired_id calls per person per day; separate from ops.forget_quota (BL-1252)';
comment on column ops.forget_quota_retired.profile_id is 'L3 person id';
comment on column ops.forget_quota_retired.day is 'L2 date';
comment on column ops.forget_quota_retired.calls is 'L2 count';

-- true while the person is within p_limit retired_id calls today (default 10). Refusals still count.
create or replace function public.ops_consume_forget_quota_retired(p_profile uuid, p_limit int default 10)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v int;
begin
  delete from ops.forget_quota_retired where profile_id = p_profile and day < current_date - 1;
  insert into ops.forget_quota_retired as q (profile_id, day, calls) values (p_profile, current_date, 1)
    on conflict (profile_id, day) do update set calls = q.calls + 1
    returning calls into v;
  return v <= greatest(coalesce(p_limit, 10), 1);
end;
$$;

revoke execute on function public.ops_consume_forget_quota_retired(uuid, int) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ops_consume_forget_quota_retired(uuid, int) to service_role;
  end if;
end;
$$;
