-- BL-1252 follow-up: the 2-day quota-row rule (LEGAL-REQ-033) also covers ops.forget_quota_retired.
-- ops_retention (20261004200000) deleted old rows from ops.forget_quota only, so a person who called
-- retired_id once kept a (profile id, date, count) row until account deletion. This replaces the
-- function so the same 2-day rule clears both quota tables. The audit_log 12-month rule and its
-- append-only switch are unchanged.
--
-- The return shape gains one key, forget_quota_retired. The purge-worker only sums the values.
-- search_path is pinned pg_catalog, public, pg_temp. create or replace keeps the existing grants
-- (service_role only), so none are repeated here.
--
-- Must merge before the hosted apply of either this or 20261124000000_forget_quota_retired.sql.
-- Hosted apply is a founder step (CR-73); nothing here applies to any remote project.

create or replace function public.ops_retention(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_log int; v_quota int; v_retired int;
begin
  perform set_config('app.ops_retention', 'on', true);
  delete from ops.audit_log where at < p_now - interval '12 months';
  get diagnostics v_log = row_count;
  perform set_config('app.ops_retention', 'off', true);
  delete from ops.forget_quota where day < (p_now - interval '2 days')::date;
  get diagnostics v_quota = row_count;
  delete from ops.forget_quota_retired where day < (p_now - interval '2 days')::date;
  get diagnostics v_retired = row_count;
  return jsonb_build_object('audit_log', v_log, 'forget_quota', v_quota, 'forget_quota_retired', v_retired);
end;
$$;
