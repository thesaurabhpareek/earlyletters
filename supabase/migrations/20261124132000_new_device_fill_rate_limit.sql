-- BL-2192 (SEC-R13, as the Edge Function read for release PR #1979 named it): a per-person call limit on the new-device fill.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Ordering: after 20261121020000 (the fill it
-- replaces) and 20261015000000 (the rate bucket list it extends); supabase/APPLY.md "File 50".
--
-- Purpose: public.ops_new_device_pending_fill, the RPC behind the new-device-fill Edge Function, had no per-person limit, so a
-- signed-in person could call it without end (one RPC and one UPDATE each). The limit lives here, in the database, keyed by
-- p_profile: the function takes it only from the gateway-verified JWT's sub claim, never from the body, and no other caller holds
-- EXECUTE (service_role only). Same signature, same boolean answer, same grants, so the deployed function needs no change and
-- there is no deploy-order dependency between this file and any Edge Function release.
--
-- The limit: 10 calls per person in a fixed one-hour window, the same as the apple_token bucket of rate_hit() (20261015000000),
-- the other call the app makes once per sign-in. A real phone fills once per sign-in (and retries only on a 503), so 10 in an
-- hour is far above honest use; the hook queues one pending row per sign-in and the sender takes it within minutes.
-- Past the limit the answer is false, exactly the answer for "nothing to fill", so the Edge Function's uniform 200 {status:'ok'}
-- holds and the caller learns nothing (no oracle). Nothing is written then: neither the pending row nor the counter (the
-- upsert's WHERE leaves a full window as it is, as rate_hit's refusal rolls its own increment back). A device left unfilled is
-- treated by the sender as a new device of class 'other', so the cost of the limit is at most an extra email, never a lost one.
--
-- Why the existing counters: public.sync_rate_windows already holds every per-person fixed window (unlogged, no grant to any API
-- role, swept after a day by sync_housekeeping for every bucket). rate_hit() itself cannot be called here: it takes the person
-- from auth.uid() (require_user), and the fill runs as service_role. So this file adds the bucket 'new_device_fill' and writes it
-- with rate_hit's own upsert. The counter row needs a profiles row (foreign key): `insert ... select from profiles` writes
-- nothing for an id with no profile, which can have no pending row either, so that call answers false instead of 23503.
-- Order inside the function: the argument check (22023) first, then the counter, then the update. A call that then errors (22P02
-- for a class that is not closed, 23514 for a hash that is not 16 bytes) rolls its count back with it.
--
-- Rollback (forward-fix only; a later migration): re-create ops_new_device_pending_fill from 20261121020000, then
-- `delete from public.sync_rate_windows where bucket = 'new_device_fill'` and put the bucket check back to its six buckets.
-- Nothing else changes and no stored data is lost (the counters are throwaway).
-- Grants: no new function, table, view or sequence. `create or replace` keeps the fill's grants; they are stated again below so
-- this file alone leaves them right. supabase/tests/grants.mjs already lists ops_new_device_pending_fill(uuid,uuid,text,bytea).
-- No new column, so no new classification (sync_rate_windows.bucket is 'L2 enum'; profile_id 'L3 person id').
-- Tests: supabase/tests/new_device_fill_rate_limit.test.mjs; the Edge Function side in
-- supabase/functions/new-device-fill/test/handler.test.ts. Fictional family "Asha" only.

alter table public.sync_rate_windows drop constraint if exists sync_rate_windows_bucket_check;
alter table public.sync_rate_windows add constraint sync_rate_windows_bucket_check
  check (bucket in ('pull', 'push', 'policy_actions', 'membership', 'entry_state', 'apple_token', 'new_device_fill'));

comment on table public.sync_rate_windows is
  'Per-person request counters for server-side rate limits (sync pull, books and push, policy reads, membership changes and invite looks, letter delete and restore, Apple token exchange, new-device fill). Written only by rate_hit() and ops_new_device_pending_fill(); unlogged.';

create or replace function public.ops_new_device_pending_fill(p_profile uuid, p_session uuid, p_class text, p_device_hash bytea)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_limit constant int := 10;                       -- BL-2192: calls per person per window; see the header for why 10
  v_window constant interval := interval '1 hour';
  n int;
begin
  if p_profile is null or p_session is null or p_device_hash is null then
    raise exception 'profile, session and device hash are required' using errcode = '22023';
  end if;
  -- The per-person window (rate_hit's upsert, keyed by the verified profile). A full window is left untouched and the update
  -- below never runs, so past the limit no row changes and the answer is the same false as "nothing to fill".
  insert into public.sync_rate_windows as w (profile_id, bucket, window_start, hits)
  select p.id, 'new_device_fill', now(), 1 from public.profiles p where p.id = p_profile
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - v_window then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - v_window then now() else w.window_start end
   where w.window_start <= now() - v_window or w.hits < v_limit;
  get diagnostics n = row_count;
  if n = 0 then
    return false;                                   -- limited, or no such profile: indistinguishable from an unfilled call
  end if;
  update ops.new_device_pending
     set class = coalesce(p_class, 'other')::ops.device_class, device_hash = p_device_hash     -- 22P02 for a class that is not closed; 23514 for a hash not 16 bytes
   where session_id = p_session and profile_id = p_profile and device_hash is null;            -- another person's session matches nothing; filled once
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

-- --- Grants (stated again; create or replace kept them) -------------------------------
revoke execute on function public.ops_new_device_pending_fill(uuid, uuid, text, bytea) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_new_device_pending_fill(uuid, uuid, text, bytea) to service_role';
  end if;
end;
$$;
