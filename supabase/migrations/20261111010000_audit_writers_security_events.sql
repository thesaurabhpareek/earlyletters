-- CR-71 C3 (data-security S6 and S7, gap G-24): the audit actions nothing wrote, and a separate store for
-- security events.
--
-- PENDING: not yet applied. Needs the founder's `approve-migration` label and a CI tag run (D-041).
-- Apply after 20261111000000 (supabase/APPLY.md, "File 35"). Refuses a second run (55000).
-- ROLLBACK (forward-fix only; a later migration): drop trigger legal_holds_audit on public.legal_holds;
-- drop the five functions below; drop table ops.security_events. Audit rows already written stay (append-only).
--
-- 1. Audit writers (audit_events allows the four actions since 20261002020000; no code wrote them):
--    legal_hold_placed, legal_hold_released (also a delete of a still-active hold): an AFTER trigger on public.legal_holds, so the row is written
--      by whatever places or releases a hold (the printed SQL statement, a later function), never forgotten.
--      actor_kind 'support', no actor id; detail is scope and reason_code only (closed enums, no matter_ref).
--    support_access: ops_support_access(), service role only. Writes ops.audit_log first (runbook break_glass,
--      "no row, no act"), then the audit_events row. detail is the reason code only.
--    export_created: record_export_created(files, bytes, manifest_sha256), a signed-in person's own row.
--      detail is exactly files, bytes, manifest_sha256 (a 64-hex hash) and source 'device'.
--      The row is SELF-ATTESTED: the phone says it saved a file; the server cannot check it (CR-71 C3-1). At most 5 rows per person per day;
--      the sixth call writes nothing and returns false (a client must never fail an export over it).
-- 2. ops.security_events: its own store, never part of audit_events and never exported. No API role holds
--    any privilege (schema ops is closed; RLS on with no policy; the service role reaches it only through the
--    three definer functions below). Columns: kind (closed list), n (a count), subject_hash (16-byte keyed
--    hash computed by the caller, L3; the database never sees the id), request_id (12 hex), detail (keys
--    a-z and underscore; values numbers or booleans only, so no email, uuid, token or free text fits). Append-only; rows leave only through ops_security_events_retention() at 12 months (D-021).
--    Reader: `ops`, through ops_security_events_check(). Threshold: 20 or more events of one kind inside one
--    hour. The scheduled read claims ops_alert_claim('security_events_spike', 1440) so the founder gets one
--    email a day at most. The sender and the writers' call sites are ops and Edge Function work, not here.
-- Tests: supabase/tests/audit_writers_security_events.test.mjs.

do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'legal_holds_audit' and tgrelid = 'public.legal_holds'::regclass) then
    raise exception '20261111010000 is already applied (legal_holds_audit exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1a. Legal holds ----------------------------------------------------------
create or replace function public.legal_holds_audit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
    values (null, 'support', 'legal_hold_placed', 'legal_hold', new.id, case when new.scope = 'child' then new.scope_id end,
            jsonb_build_object('scope', new.scope, 'reason_code', new.reason_code));
  elsif tg_op = 'DELETE' then
    -- A hold removed while still active is a release too (row gone: the audit row is the only trace).
    if old.released_at is null then
      insert into public.audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
      values (null, 'support', 'legal_hold_released', 'legal_hold', old.id, case when old.scope = 'child' then old.scope_id end,
              jsonb_build_object('scope', old.scope, 'reason_code', old.reason_code, 'deleted', true));
    end if;
  elsif old.released_at is null and new.released_at is not null then
    insert into public.audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
    values (null, 'support', 'legal_hold_released', 'legal_hold', new.id, case when new.scope = 'child' then new.scope_id end,
            jsonb_build_object('scope', new.scope, 'reason_code', new.reason_code));
  end if;
  return null;
end;
$$;
create trigger legal_holds_audit after insert or update or delete on public.legal_holds
  for each row execute function public.legal_holds_audit();

-- --- 1b. Support access ---------------------------------------------------------
create or replace function public.ops_support_access(p_operator text, p_ticket text, p_reason_code text,
  p_subject_type text, p_subject uuid, p_child uuid default null)
returns bigint language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_id bigint;
begin
  if p_reason_code is null or p_reason_code !~ '^[a-z][a-z0-9_]{0,39}$'
     or p_ticket is null or p_ticket !~ '^[A-Za-z0-9][A-Za-z0-9_.:#-]{0,79}$'
     or p_operator is null or p_operator !~ '^[A-Za-z0-9][A-Za-z0-9_.@-]{0,79}$'
     or p_subject_type is null or p_subject_type not in ('profile', 'child', 'entry', 'membership', 'deletion_request') then
    raise exception 'support access record out of range' using errcode = '22023';
  end if;
  perform public.ops_audit_write(p_operator, 'break_glass', p_reason_code, p_ticket,
    case when p_subject_type = 'profile' then p_subject end, p_child, case when p_subject_type = 'entry' then p_subject end);
  insert into public.audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
  values (null, 'support', 'support_access', p_subject_type, p_subject, p_child, jsonb_build_object('reason_code', p_reason_code))
  returning id into v_id;
  return v_id;
end;
$$;

-- --- 1c. Export -------------------------------------------------------------------
create or replace function public.record_export_created(p_files int, p_bytes bigint, p_manifest_sha256 text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_me uuid := public.require_user();
begin
  if p_files is null or p_files not between 0 and 100000 or p_bytes is null or p_bytes not between 0 and 1000000000000
     or p_manifest_sha256 is null or p_manifest_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'export record out of range' using errcode = '22023';
  end if;
  -- One lock per person, so two concurrent calls cannot both pass the cap.
  perform pg_advisory_xact_lock(hashtextextended('export_created:' || v_me::text, 0));
  if (select count(*) from public.audit_events where actor_id = v_me and action = 'export_created' and at > now() - interval '1 day') >= 5 then
    return false;
  end if;
  insert into public.audit_events (actor_id, actor_kind, action, subject_type, subject_id, detail)
  values (v_me, 'user', 'export_created', 'export', null,
          jsonb_build_object('files', p_files, 'bytes', p_bytes, 'manifest_sha256', p_manifest_sha256, 'source', 'device'));
  return true;
end;
$$;

-- --- 2. ops.security_events -----------------------------------------------------------
create or replace function ops.security_detail_ok(d jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select jsonb_typeof(d) = 'object' and octet_length(d::text) <= 256 and not exists (
    select 1 from jsonb_each(d) e
     where e.key !~ '^[a-z][a-z_]{0,23}$'
        or jsonb_typeof(e.value) not in ('number', 'boolean'))
$$;

create table ops.security_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('wrong_code_burst', 'invite_pause_tripped', 'step_up_failed', 'restore_requested',
    'deletion_refused', 'alert_mail_ceiling')),
  n int not null default 1 check (n between 1 and 1000000),
  subject_hash bytea check (octet_length(subject_hash) = 16),
  request_id text check (request_id ~ '^[0-9a-f]{12}$'),
  detail jsonb not null default '{}'::jsonb check (ops.security_detail_ok(detail))
);
create index security_events_kind_at_idx on ops.security_events (kind, at);
create index security_events_at_idx on ops.security_events (at);
alter table ops.security_events enable row level security;       -- no policy: nobody through the API
revoke all on ops.security_events from public, anon, authenticated;
comment on table ops.security_events is 'L2 kind, count and time; the only L3 column is subject_hash. Service only, 12 months, never exported (CR-71 C3)';
comment on column ops.security_events.id is 'L2 internal id';
comment on column ops.security_events.at is 'L2 system timestamp';
comment on column ops.security_events.kind is 'L2 enum';
comment on column ops.security_events.n is 'L2 count';
comment on column ops.security_events.subject_hash is 'L3 keyed hash (16 bytes) of a person, computed by the caller; never the id';
comment on column ops.security_events.request_id is 'L2 request id, 12 hex';
comment on column ops.security_events.detail is 'L2 numbers and booleans only (ops.security_detail_ok)';

-- The retention setting is not an authority: any definer function (or the owner) can set it. The guard stops
-- statements, not a database owner; ops_security_events_retention() is the only code that sets it.
create or replace function ops.security_events_guard()
returns trigger language plpgsql set search_path = pg_catalog, ops, pg_temp as $$
begin
  if tg_op = 'DELETE' and current_setting('app.security_events_retention', true) is not distinct from 'on' then
    return old;
  end if;
  raise exception 'ops.security_events is append-only' using errcode = 'SCIMM';
end;
$$;
create trigger security_events_guard before update or delete on ops.security_events
  for each row execute function ops.security_events_guard();
create trigger security_events_no_truncate before truncate on ops.security_events
  for each statement execute function ops.security_events_guard();

create or replace function public.ops_security_event_write(p_kind text, p_n int default 1, p_subject_hash bytea default null,
  p_request_id text default null, p_detail jsonb default '{}'::jsonb)
returns bigint language sql security definer set search_path = pg_catalog, public, pg_temp as $$
  insert into ops.security_events (kind, n, subject_hash, request_id, detail)
  values (p_kind, coalesce(p_n, 1), p_subject_hash, p_request_id, coalesce(p_detail, '{}'::jsonb)) returning id;
$$;

-- The reader (ops, on the founder's schedule). Counts per kind in the last hour; `over` lists kinds at or above 20.
create or replace function public.ops_security_events_check(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  with c as (select kind, sum(n)::bigint total from ops.security_events
              where at > p_now - interval '1 hour' and at <= p_now group by kind)
  select jsonb_build_object('window_minutes', 60, 'threshold', 20,
    'counts', coalesce((select jsonb_object_agg(kind, total) from c), '{}'::jsonb),
    'over', coalesce((select jsonb_agg(kind order by kind) from c where total >= 20), '[]'::jsonb))
$$;

create or replace function public.ops_security_events_retention(p_now timestamptz default now())
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v int;
begin
  perform set_config('app.security_events_retention', 'on', true);
  -- The caller's clock is not trusted: a future p_now would delete every row. Never later than the server's now.
  delete from ops.security_events where at < least(coalesce(p_now, now()), now()) - interval '12 months';
  get diagnostics v = row_count;
  perform set_config('app.security_events_retention', 'off', true);
  return v;
end;
$$;

-- --- 3. Grants (this file's own; default privileges are reset) --------------------------
revoke execute on function public.legal_holds_audit(), ops.security_events_guard(), ops.security_detail_ok(jsonb) from public;
revoke execute on function public.ops_support_access(text, text, text, text, uuid, uuid), public.ops_security_event_write(text, int, bytea, text, jsonb),
  public.ops_security_events_check(timestamptz), public.ops_security_events_retention(timestamptz), public.record_export_created(int, bigint, text)
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.legal_holds_audit(), ops.security_events_guard(), ops.security_detail_ok(jsonb) from anon, authenticated, service_role';
    execute 'revoke execute on function public.record_export_created(int, bigint, text) from service_role';
    execute 'grant execute on function public.ops_support_access(text, text, text, text, uuid, uuid), public.ops_security_event_write(text, int, bytea, text, jsonb), '
         || 'public.ops_security_events_check(timestamptz), public.ops_security_events_retention(timestamptz) to service_role';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function public.record_export_created(int, bigint, text) to authenticated';
  end if;
end;
$$;
