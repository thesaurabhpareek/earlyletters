-- BL-523 (#306 review B follow-up 4 and fix-list item 4; LEGAL-REQ-033, DQ-R11): a time limit on the
-- wrong-invite-code rows in public.invite_redeem_failures.
--
-- Before this file a row older than 2 hours was deleted only when a later wrong code was written
-- (invite_redeem_by_code, at most 200 rows per call). After a burst with no later wrong code the rows
-- stayed with no end date, so "rows older than 2 hours are deleted" was true only while traffic went on.
-- ops_retention, which the purge worker runs once a day (task 'daily'), now also deletes every row older
-- than 2 hours. The in-call delete in invite_redeem_by_code is unchanged.
--
-- Retention, in the words of the schedule (Kept for / Then): kept 2 hours; then hard deleted at the next
-- wrong code or by the next daily ops_retention run, whichever comes first. So a row lives at most about
-- 26 hours while the daily run is healthy.
--
-- The new delete picks its rows with `for update skip locked`, the same as the in-call delete, so it never
-- waits on a redeem that holds some of them; a skipped row is old and is taken by that redeem or the next run.
--
-- Replaces one function body (public.ops_retention, same signature) from 20261124010000; the audit_log
-- 12-month rule, its append-only switch and the two 2-day quota rules are unchanged. The answer gains one
-- key, invite_redeem_failures; the purge worker only sums the values. Restates the table comment so it
-- says the same. No table, column or index is added. Grants are restated below (service_role only).
--
-- Apply after 20261124010000_ops_retention_forget_quota_retired.sql and after
-- 20261028010000_invite_redeem_by_code.sql (it reads that table).
-- ROLLBACK: a later file that re-creates public.ops_retention from 20261124010000 and the table comment
-- from 20261028010000. Hosted apply is a founder step (CR-73); nothing here applies to any remote project.

create or replace function public.ops_retention(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_log int; v_quota int; v_retired int; v_redeem int;
begin
  perform set_config('app.ops_retention', 'on', true);
  delete from ops.audit_log where at < p_now - interval '12 months';
  get diagnostics v_log = row_count;
  perform set_config('app.ops_retention', 'off', true);
  delete from ops.forget_quota where day < (p_now - interval '2 days')::date;
  get diagnostics v_quota = row_count;
  delete from ops.forget_quota_retired where day < (p_now - interval '2 days')::date;
  get diagnostics v_retired = row_count;
  -- BL-523: wrong-invite-code rows, kept 2 hours (invite_redeem_by_code deletes them too, as it writes).
  delete from public.invite_redeem_failures
   where id in (select f.id from public.invite_redeem_failures f
                 where f.at < p_now - interval '2 hours'
                 for update skip locked);
  get diagnostics v_redeem = row_count;
  return jsonb_build_object('audit_log', v_log, 'forget_quota', v_quota, 'forget_quota_retired', v_retired,
                            'invite_redeem_failures', v_redeem);
end;
$$;

revoke all on function public.ops_retention(timestamptz) from public, anon, authenticated;
grant execute on function public.ops_retention(timestamptz) to service_role;

comment on table public.invite_redeem_failures is
  'One row per counted wrong guess at an invite code (hashed subjects only). Written only by invite_redeem_by_code(). Kept 2 hours; then hard deleted at the next wrong code or by the daily ops_retention() run, whichever comes first.';
