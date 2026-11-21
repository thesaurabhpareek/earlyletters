-- NS-08-R21 / E83, NDS-2 and NDS-5 of PR #1206: the fill for the app's optional second call (file 09 section 2.3 item 5) and the
-- re-key for DEVICE_HASH_KEY overlap rotation (file 09 section 5).
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Apply after 20261121010000 (supabase/APPLY.md,
-- "File 38"). ROLLBACK (forward-fix only): drop the two functions below; nothing else changes.
--
--   public.ops_new_device_pending_fill(uuid, uuid, text, bytea)  NDS-2: sets class and device_hash on ONE pending row, for the
--       given profile and session. Only if the row exists, only while device_hash is null (so once), only for that profile.
--       Returns true if it filled, false if it changed nothing (no row, already filled, taken by the sender, another person's session).
--   public.ops_new_device_rekey(uuid, bytea, bytea)               NDS-5: given the profile and both hashes of one device (old key,
--       next key): 'current' (the next-key hash is stored), 'rekeyed' (only the old-key hash was stored; the row now carries the
--       next-key hash, one statement under a per-profile lock), 'unknown' (neither). Never inserts a row.
-- Both: security definer, search_path pinned, execute for service_role only, no table grant. Nobody calls them from the app
-- directly: the app reaches the fill through a JWT-verified Edge Function that hashes the device id with DEVICE_HASH_KEY (the key
-- never enters Postgres) and calls this with the service role, taking profile and session from the verified JWT, never the body.
-- No new column, so no new classification.
-- Tests: supabase/tests/new_device_fill_rekey.test.mjs.

create or replace function public.ops_new_device_pending_fill(p_profile uuid, p_session uuid, p_class text, p_device_hash bytea)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if p_profile is null or p_session is null or p_device_hash is null then
    raise exception 'profile, session and device hash are required' using errcode = '22023';
  end if;
  update ops.new_device_pending
     set class = coalesce(p_class, 'other')::ops.device_class, device_hash = p_device_hash     -- 22P02 for a class that is not closed; 23514 for a hash not 16 bytes
   where session_id = p_session and profile_id = p_profile and device_hash is null;            -- another person's session matches nothing; filled once
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

create or replace function public.ops_new_device_rekey(p_profile uuid, p_old_hash bytea, p_new_hash bytea)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if p_profile is null or octet_length(p_old_hash) is distinct from 16 or octet_length(p_new_hash) is distinct from 16 then
    raise exception 'profile and two 16-byte hashes are required' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_profile::text, 0));      -- the same lock as ops_new_device_record: no race with a record
  if exists (select 1 from ops.account_sessions_seen where profile_id = p_profile and device_hash = p_new_hash) then
    return 'current';                                                       -- also when both exist: the old row rolls off in 90 days
  end if;
  update ops.account_sessions_seen set device_hash = p_new_hash
   where profile_id = p_profile and device_hash = p_old_hash;
  get diagnostics n = row_count;
  return case when n = 1 then 'rekeyed' else 'unknown' end;
end;
$$;

-- --- Grants (this file's own; default privileges are reset) ---------------------------
revoke execute on function public.ops_new_device_pending_fill(uuid, uuid, text, bytea), public.ops_new_device_rekey(uuid, bytea, bytea)
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_new_device_pending_fill(uuid, uuid, text, bytea), public.ops_new_device_rekey(uuid, bytea, bytea) to service_role';
  end if;
end;
$$;
