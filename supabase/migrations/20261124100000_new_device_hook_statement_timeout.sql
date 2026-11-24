-- BL-1184 (NS-08-R21, FR-SEC-36): the new-device access token hook also fails open on a statement timeout.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73); it needs 20261121000000 first.
-- Purpose: in PL/pgSQL, `when others` does not catch QUERY_CANCELED (SQLSTATE 57014), the error a statement timeout raises.
-- The hook of 20261121000000 swallowed every other error so a failing queue insert never blocks a sign-in, but a timeout
-- on that insert (or on the failure counter) would have reached Auth and failed the sign-in. This file names 57014 in
-- each of the three handlers. Same body otherwise: claims in equal claims out, no payload logged or stored, a refresh
-- writes nothing, one `new_device_hook_failed` count per failed queue insert.
-- Rollback (forward-fix only; a later migration): put back the three `when others` handlers of 20261121000000.
-- Ordering: after 20261121000000 and 20261121010000. The grants are unchanged by `create or replace` (supabase_auth_admin
-- only); the test re-asserts them.
-- Tests: supabase/tests/new_device_sign_in.test.mjs ([BL-1184 hook], [BL-1187 hook]).

create or replace function public.hook_new_device_sign_in(event jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp set lock_timeout = '200ms' as $$
begin
  if event->>'authentication_method' is not distinct from 'token_refresh' then
    return jsonb_build_object('claims', event->'claims');
  end if;
  begin
    -- A person with no profile yet (the very first sign-in) is the first device: nothing to queue.
    insert into ops.new_device_pending (session_id, profile_id)
    select (event->'claims'->>'session_id')::uuid, p.id from public.profiles p where p.id = (event->>'user_id')::uuid
    on conflict do nothing;
  exception when query_canceled or others then
    begin
      insert into ops.security_events (kind) values ('new_device_hook_failed');
    exception when query_canceled or others then null;
    end;
  end;
  return jsonb_build_object('claims', event->'claims');
exception when query_canceled or others then
  return jsonb_build_object('claims', event->'claims');
end;
$$;
