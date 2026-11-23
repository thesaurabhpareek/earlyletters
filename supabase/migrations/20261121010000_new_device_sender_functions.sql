-- NS-08-R21 / E83, the SENDER half: the only way the new-device email sender (an Edge Function, service_role) reaches the
-- three closed ops tables of 20261121000000 (DEV-3: definer functions, no login role with table grants).
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Apply after 20261121000000 (supabase/APPLY.md,
-- "File 37"). ROLLBACK (forward-fix only): drop the three functions below; nothing else changes.
--
--   public.ops_new_device_record(uuid, bytea, text)         record-device: first / new / known. Never a second row for a device.
--   public.ops_new_device_pending_take(uuid, int)           take-pending: pickup DELETES the pending row, then returns it.
--   public.ops_new_device_token_mint(uuid, uuid, bytea, interval)  mint-token: stores the SHA-256 only, expiry set here;
--                                                           refuses past 20 a day and counts it as kind alert_mail_ceiling
--                                                           (08 section 9; the kind exists since 20261111010000).
-- Every function: security definer, search_path pinned, execute for service_role only. No table gets a grant. No new
-- column, so no new classification. The plain token never reaches the database: the sender hashes it (SHA-256, 32 bytes).
-- Tests: supabase/tests/new_device_sender.test.mjs.

create or replace function public.ops_new_device_record(p_profile uuid, p_device_hash bytea, p_class text)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare had boolean; n int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_profile::text, 0));      -- two first sign-ins cannot both be "first"
  select exists (select 1 from ops.account_sessions_seen where profile_id = p_profile) into had;
  insert into ops.account_sessions_seen (profile_id, device_hash, class, notified_at)
  values (p_profile, p_device_hash, coalesce(p_class, 'other')::ops.device_class,
          case when had then date_trunc('minute', now()) end)
  on conflict (profile_id, device_hash) do nothing;
  get diagnostics n = row_count;
  if n = 1 then return case when had then 'new' else 'first' end; end if;
  update ops.account_sessions_seen set last_seen_day = current_date          -- at most one write a day
   where profile_id = p_profile and device_hash = p_device_hash and last_seen_day < current_date;
  return 'known';
end;
$$;

-- Pickup deletes the row in the same statement that returns it, so two senders never take the same one. The device hash
-- leaves as hex. p_session null takes the oldest p_limit (1 to 100); a session id takes that one.
create or replace function public.ops_new_device_pending_take(p_session uuid default null, p_limit int default 20)
returns jsonb language sql security definer set search_path = pg_catalog, public, pg_temp as $$
  with d as (
    delete from ops.new_device_pending where session_id in (
      select session_id from ops.new_device_pending where p_session is null or session_id = p_session
       order by queued_at limit greatest(1, least(coalesce(p_limit, 20), 100)) for update skip locked)
    returning session_id, profile_id, class, device_hash, queued_at)
  select coalesce(jsonb_agg(jsonb_build_object('session_id', session_id, 'profile_id', profile_id, 'class', coalesce(class::text, 'other'),
    'device_hash', encode(device_hash, 'hex')) order by queued_at), '[]'::jsonb) from d
$$;

create or replace function public.ops_new_device_token_mint(p_profile uuid, p_session uuid, p_token_hash bytea,
  p_ttl interval default interval '48 hours')
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e timestamptz := now() + p_ttl;
begin
  if p_ttl is null or p_ttl < interval '1 minute' or p_ttl > interval '7 days' then
    raise exception 'token lifetime out of range' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_profile::text, 1));
  if (select count(*) from ops.new_device_tokens where profile_id = p_profile and created_at > now() - interval '24 hours') >= 20 then
    insert into ops.security_events (kind) values ('alert_mail_ceiling');   -- no subject, no detail
    return null;
  end if;
  insert into ops.new_device_tokens (token_hash, profile_id, session_id, expires_at) values (p_token_hash, p_profile, p_session, e);
  return e;
end;
$$;

-- --- Grants (this file's own; default privileges are reset) ---------------------------
revoke execute on function public.ops_new_device_record(uuid, bytea, text), public.ops_new_device_pending_take(uuid, int),
  public.ops_new_device_token_mint(uuid, uuid, bytea, interval) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_new_device_record(uuid, bytea, text), public.ops_new_device_pending_take(uuid, int), '
         || 'public.ops_new_device_token_mint(uuid, uuid, bytea, interval) to service_role';
  end if;
end;
$$;
