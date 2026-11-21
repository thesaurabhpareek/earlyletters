-- NS-08-R21 / E83 / FR-SEC-36, the DATABASE half of the new-device sign-in email (data-security files 08 and 09).
--
-- PENDING: not yet applied. Applying it, and switching the access token hook on in the dashboard, are the founder's
-- steps (D-041, CR-73). Apply after 20261111010000 (supabase/APPLY.md, "File 36"). Refuses a second run (55000).
-- ROLLBACK (forward-fix only; a later migration): switch the hook off first, then drop the four functions and the three
-- tables below, the two enum types, and put the security_events kind check back to its six kinds.
--
-- What it adds (schema ops, so no API role holds any privilege and RLS is on with no policy):
--   ops.account_sessions_seen  one row per account and device: keyed hash of the app-made device id (16 bytes), a class
--                              word, first seen, last-seen day, notified-at. No IP, user agent, device name or session id.
--   ops.new_device_pending     what the hook queues: one row per sign-in (the session id passes through it). The sender
--                              deletes it on pickup; ops_new_device_retention() sweeps rows older than 24 hours.
--   ops.new_device_tokens      the "Not you?" token: SHA-256 only, single use, bound to one session, expires_at, used_at and a
--                              closed outcome.
--   public.hook_new_device_sign_in(jsonb)  the custom access token hook. Tiny and FAIL OPEN: a failure is counted and the
--                              sign-in goes on. A token_refresh returns at once and writes nothing.
--   public.ops_end_session(uuid, uuid)     deletes the one auth.sessions row of that person. service_role only.
--   public.ops_new_device_sign_out(bytea, text)  the page's press: claims the token and ends its one session in one transaction.
--   public.ops_new_device_retention(timestamptz) 24 h pending, token expiry + 7 days, device row 90 days not seen.
--   ops.security_events kind new_device_signed_out (the press) and new_device_hook_failed (the counted fail-open).
-- Deletion: all three tables cascade from profiles (account deletion).
-- Not here (the sender PR): the functions that record a device row, take pending rows and mint a token. [U] Hosted
-- facts (hook switch, whether the owner role may delete from auth.sessions, whether refresh tokens die with the session)
-- are proved by the founder: file 09 sections 2.4 and 3.3 (P1 to P7, A1 to A8, H1).
-- Tests: supabase/tests/new_device_sign_in.test.mjs.

do $$
begin
  if to_regclass('ops.account_sessions_seen') is not null then
    raise exception '20261121000000 is already applied (ops.account_sessions_seen exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

create type ops.device_class as enum ('apple', 'other');                  -- "an iPhone or iPad", "a new device"
create type ops.not_you_outcome as enum ('ended', 'already', 'noted');    -- closed; 'noted' is the fail-safe of file 09 3.4

-- --- 1. The device record --------------------------------------------------------------
create table ops.account_sessions_seen (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  device_hash bytea not null check (octet_length(device_hash) = 16),
  class ops.device_class not null,
  first_seen_at timestamptz not null default date_trunc('minute', now()),
  last_seen_day date not null default current_date,
  notified_at timestamptz,
  primary key (profile_id, device_hash)
);
create index account_sessions_seen_last_seen_idx on ops.account_sessions_seen (last_seen_day);   -- the 90-day sweep
alter table ops.account_sessions_seen enable row level security;       -- no policy: nobody through the API
comment on table ops.account_sessions_seen is 'L3 row: a coded record of the devices that signed in, for the new-device email. Service only; deleted with the account and 90 days after last seen';
comment on column ops.account_sessions_seen.profile_id is 'L3 person id';
comment on column ops.account_sessions_seen.device_hash is 'L3 keyed hash (16 bytes) of an app-made random device id, computed by the sender; never the raw id, IDFV or a hardware id';
comment on column ops.account_sessions_seen.class is 'L2 enum: apple or other';
comment on column ops.account_sessions_seen.first_seen_at is 'L2 system timestamp, to the minute';
comment on column ops.account_sessions_seen.last_seen_day is 'L2 date, written at most once a day; drives the 90-day roll-off';
comment on column ops.account_sessions_seen.notified_at is 'L2 system timestamp: when the email was queued; null for the first device';

-- --- 2. What the hook queues -----------------------------------------------------------
create table ops.new_device_pending (
  session_id uuid primary key,                      -- no foreign key to auth.sessions: the row may be written before it is visible
  profile_id uuid not null references public.profiles(id) on delete cascade,
  queued_at timestamptz not null default now(),
  class ops.device_class,                           -- filled by the app's optional second call; null means 'other'
  device_hash bytea check (octet_length(device_hash) = 16)
);
create index new_device_pending_queued_idx on ops.new_device_pending (queued_at);
alter table ops.new_device_pending enable row level security;
comment on table ops.new_device_pending is 'L3 row: one per sign-in, minutes long; the session id passes through it. Deleted on pickup, swept at 24 hours';
comment on column ops.new_device_pending.session_id is 'L4 session identifier (an Auth credential-adjacent id); lives here and in the token row only';
comment on column ops.new_device_pending.profile_id is 'L3 person id';
comment on column ops.new_device_pending.queued_at is 'L2 system timestamp';
comment on column ops.new_device_pending.class is 'L2 enum: apple or other, from the app, never the network';
comment on column ops.new_device_pending.device_hash is 'L3 keyed hash (16 bytes), filled by the sender';

-- --- 3. The "Not you?" token -----------------------------------------------------------
create table ops.new_device_tokens (
  token_hash bytea primary key check (octet_length(token_hash) = 32),   -- SHA-256; the plain token is never stored
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null,                         -- the one session this token can end
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  outcome ops.not_you_outcome,
  check (expires_at > created_at),
  check ((used_at is null) = (outcome is null))
);
create index new_device_tokens_expires_idx on ops.new_device_tokens (expires_at);
alter table ops.new_device_tokens enable row level security;
comment on table ops.new_device_tokens is 'L3 row: the Not-you token, hashed, single use, one session. Service only; expires_at plus 7 days, then deleted';
comment on column ops.new_device_tokens.token_hash is 'L4 credential hash: SHA-256 of a 32-byte random token; the token can only end the one session it names';
comment on column ops.new_device_tokens.profile_id is 'L3 person id';
comment on column ops.new_device_tokens.session_id is 'L4 session identifier; dies with the token';
comment on column ops.new_device_tokens.created_at is 'L2 system timestamp';
comment on column ops.new_device_tokens.expires_at is 'L2 system timestamp: 48 hours by default, checked on the press';
comment on column ops.new_device_tokens.used_at is 'L2 system timestamp: set in the statement that claims the token';
comment on column ops.new_device_tokens.outcome is 'L2 enum: ended, already or noted';

-- --- 4. The closed kind list gains the press and the counted failure -------------------
alter table ops.security_events drop constraint security_events_kind_check;
alter table ops.security_events add constraint security_events_kind_check check (kind in ('wrong_code_burst', 'invite_pause_tripped',
  'step_up_failed', 'restore_requested', 'deletion_refused', 'alert_mail_ceiling', 'new_device_signed_out', 'new_device_hook_failed'));

-- --- 5. The access token hook: tiny, fail open -----------------------------------------
-- Reads user_id, claims.session_id and authentication_method only; returns the claims unchanged; never logs or stores the
-- payload (it holds the email). A refresh is excluded by name (never an allowlist of sign-in methods: Apple and Google
-- id-token sign-ins have no named method [U]). Any error is counted and swallowed: a raising hook breaks the sign-in.
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
  exception when others then
    begin
      insert into ops.security_events (kind) values ('new_device_hook_failed');
    exception when others then null;
    end;
  end;
  return jsonb_build_object('claims', event->'claims');
exception when others then
  return jsonb_build_object('claims', event->'claims');
end;
$$;

-- --- 6. The one lever: end one session -------------------------------------------------
create or replace function public.ops_end_session(p_profile uuid, p_session uuid)
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v int;
begin
  -- The profile check means a token can never end another account's session.
  delete from auth.sessions where id = p_session and user_id = p_profile;
  get diagnostics v = row_count;
  return v;
end;
$$;

-- The press. Flat answer for unknown and expired; 'already' for a used, unexpired token. Claim and delete are one
-- transaction, so a failed delete leaves the token usable. Written on the press only, never on load.
create or replace function public.ops_new_device_sign_out(p_token_hash bytea, p_request_id text default null)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare t ops.new_device_tokens; v int;
begin
  select * into t from ops.new_device_tokens where token_hash = p_token_hash for update;
  if not found or t.expires_at <= now() then return 'unknown'; end if;
  if t.used_at is not null then return 'already'; end if;
  v := public.ops_end_session(t.profile_id, t.session_id);
  update ops.new_device_tokens set used_at = now(), outcome = case when v > 0 then 'ended' else 'already' end::ops.not_you_outcome
   where token_hash = p_token_hash;
  insert into ops.security_events (kind, request_id, detail)
  values ('new_device_signed_out', case when p_request_id ~ '^[0-9a-f]{12}$' then p_request_id end, jsonb_build_object('ended', v > 0));
  return case when v > 0 then 'ended' else 'already' end;
end;
$$;

-- --- 7. Retention ----------------------------------------------------------------------
-- Not callable by a person; `ops` runs it on its schedule. The caller's clock is not trusted (never later than now()).
create or replace function public.ops_new_device_retention(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n timestamptz := least(coalesce(p_now, now()), now()); a int; b int; c int;
begin
  delete from ops.new_device_pending where queued_at < n - interval '24 hours';
  get diagnostics a = row_count;
  delete from ops.new_device_tokens where expires_at < n - interval '7 days';
  get diagnostics b = row_count;
  delete from ops.account_sessions_seen where last_seen_day < n::date - 90;
  get diagnostics c = row_count;
  return jsonb_build_object('pending', a, 'tokens', b, 'devices', c);
end;
$$;

-- --- 8. Grants (this file's own; default privileges are reset) -------------------------
revoke all on ops.account_sessions_seen, ops.new_device_pending, ops.new_device_tokens from public, anon, authenticated;
revoke execute on function public.hook_new_device_sign_in(jsonb), public.ops_end_session(uuid, uuid),
  public.ops_new_device_sign_out(bytea, text), public.ops_new_device_retention(timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke all on ops.account_sessions_seen, ops.new_device_pending, ops.new_device_tokens from service_role';
    execute 'revoke execute on function public.hook_new_device_sign_in(jsonb) from service_role';
    execute 'grant execute on function public.ops_end_session(uuid, uuid), public.ops_new_device_sign_out(bytea, text), '
         || 'public.ops_new_device_retention(timestamptz) to service_role';
  end if;
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.hook_new_device_sign_in(jsonb) to supabase_auth_admin';
  end if;
end;
$$;
