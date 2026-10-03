-- Ops schema and service-only functions for the purge worker, analytics-forget
-- and the ops runbook scripts (docs/ops). Additive only.
--
-- PENDING: not yet applied. Apply after every earlier file (supabase/APPLY.md).
-- Owner: server and privacy-operations engineer (agent brief 3 Oct 2026).
--
-- What this adds
--  0. Schema `ops`, NOT exposed through the Data API (never add it to "Exposed
--     schemas"). No grants to anon or authenticated; RLS on every table anyway.
--     Only security-definer functions below, executable by service_role, touch it.
--       ops.audit_log     runbook access log (LEGAL-REQ-025, TDD 05 X-07 / 7.7), append-only, 12 months
--       ops.alert_state   last time each alert kind was emailed (daily cooldown), L2
--       ops.forget_quota  analytics-forget calls per person per day (rate limit, brief decision 17)
--       ops.apple_tokens  Sign in with Apple refresh token, AES-256-GCM ciphertext under TOKEN_KEK_V<n>
--                         (TDD 04 3.1.1 and 3.9), deleted after revocation; cascades with the profile
--  1. Worker functions: deletion work list, receipt merge, queue rows, ownership
--     and residue scans, contributor list, child photo re-homing, SLA report,
--     alert cooldown, ledger export, retention.
--  2. Runbook functions: audit row, incident scope (LEGAL-REQ-039), ledger
--     replay after a restore (DATA-REQ-030), row counts, raw hash sample and
--     schema health for the restore drill (DATA-REQ-031).
--  3. The private `ops-ledger` Storage bucket (no policies: service role only).
--
-- Every function is SECURITY DEFINER with a pinned search_path, revoked from
-- public, anon and authenticated, and granted to service_role. Ids travel in
-- RPC bodies (TDD 06 conflict C-1). Nothing here returns letter text.
-- Tests: supabase/tests/ops_deletion_worker.test.mjs (npm run test:db).

-- ─── 0. Schema and tables ────────────────────────────────────────────────
create schema if not exists ops;
revoke all on schema ops from public, anon, authenticated;

create table ops.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  operator text not null check (char_length(operator) between 1 and 80),
  runbook text not null check (runbook in ('deletion', 'dsar', 'legal_process', 'preservation', 'safety_removal',
    'under_13', 'third_party_health', 'restore_replay', 'restore_drill', 'incident_scope', 'verify_deletion', 'break_glass')),
  reason_code text not null check (reason_code ~ '^[a-z][a-z0-9_]{0,39}$'),
  ticket text not null check (char_length(ticket) between 1 and 80),
  target_profile uuid,
  target_child uuid,
  target_entry uuid,
  detail jsonb not null default '{}'::jsonb
    check (jsonb_typeof(detail) = 'object' and octet_length(detail::text) <= 512)
);
create index audit_log_at_idx on ops.audit_log (at);

-- Append-only: rows change only through the 12-month retention in ops_retention().
create or replace function ops.audit_log_guard()
returns trigger language plpgsql set search_path = ops, pg_catalog as $$
begin
  if tg_op = 'DELETE' and current_setting('app.ops_retention', true) = 'on' then
    return old;
  end if;
  raise exception 'ops.audit_log is append-only' using errcode = 'SCIMM';
end;
$$;
create trigger audit_log_guard before update or delete on ops.audit_log
  for each row execute function ops.audit_log_guard();

create table ops.alert_state (
  kind text primary key check (kind ~ '^[a-z][a-z_]{0,39}$'),
  last_sent_at timestamptz,
  sends int not null default 0
);

create table ops.forget_quota (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  calls int not null default 0,
  primary key (profile_id, day)
);

create table ops.apple_tokens (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  ciphertext text not null check (char_length(ciphertext) <= 4096 and ciphertext ~ '^v1\.[A-Za-z0-9+/=]{8,64}\.[A-Za-z0-9+/=]{16,}$'),
  key_version int not null check (key_version between 1 and 9),
  client_id text not null check (client_id ~ '^[A-Za-z0-9.-]{1,155}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ops.audit_log enable row level security;
alter table ops.alert_state enable row level security;
alter table ops.forget_quota enable row level security;
alter table ops.apple_tokens enable row level security;
revoke all on all tables in schema ops from public, anon, authenticated;
revoke execute on function ops.audit_log_guard() from public, anon, authenticated;

comment on schema ops is 'Operations data. Not exposed through the Data API; service-role functions only.';
comment on column ops.audit_log.id is 'L2 row id';
comment on column ops.audit_log.at is 'L2 system timestamp';
comment on column ops.audit_log.operator is 'L3 staff handle';
comment on column ops.audit_log.runbook is 'L2 enum';
comment on column ops.audit_log.reason_code is 'L2 enum-like code';
comment on column ops.audit_log.ticket is 'L2 ticket reference, never content';
comment on column ops.audit_log.target_profile is 'L3 person id (kept 12 months, also after account deletion: security log)';
comment on column ops.audit_log.target_child is 'L3 book id';
comment on column ops.audit_log.target_entry is 'L3 letter id';
comment on column ops.audit_log.detail is 'L2 enums and counts only, 512 bytes';
comment on column ops.alert_state.kind is 'L1 alert kind';
comment on column ops.alert_state.last_sent_at is 'L2 system timestamp';
comment on column ops.alert_state.sends is 'L2 count';
comment on column ops.forget_quota.profile_id is 'L3 person id';
comment on column ops.forget_quota.day is 'L2 date';
comment on column ops.forget_quota.calls is 'L2 count';
comment on column ops.apple_tokens.profile_id is 'L3 person id';
comment on column ops.apple_tokens.ciphertext is 'L4 secret: Apple refresh token, AES-256-GCM under TOKEN_KEK_V<key_version>, AAD = profile id';
comment on column ops.apple_tokens.key_version is 'L2 key version';
comment on column ops.apple_tokens.client_id is 'L1 Apple client id the token was issued to (bundle id or Services ID)';
comment on column ops.apple_tokens.created_at is 'L2 system timestamp';
comment on column ops.apple_tokens.updated_at is 'L2 system timestamp';

-- ─── 1. Worker functions ─────────────────────────────────────────────────

-- Work for one run: executing account requests with their steps, pending
-- "save a copy" notices, and request and cancellation emails not yet sent
-- (only within 2 days of the event, so a first deploy never mails old requests).
create or replace function public.ops_deletion_work(p_limit int default 10)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select jsonb_build_object(
    'executing', coalesce((select jsonb_agg(x order by x.executing_at) from (
        select d.id, d.profile_id, d.requested_at, d.executing_at, d.had_active_subscription, d.receipt,
               coalesce((select jsonb_agg(jsonb_build_object('step', s.step, 'status', s.status, 'attempts', s.attempts,
                          'next_attempt_at', s.next_attempt_at, 'last_error_code', s.last_error_code) order by s.step)
                         from deletion_request_steps s where s.request_id = d.id), '[]'::jsonb) as steps
          from deletion_requests d
         where d.kind = 'account' and d.status = 'executing' and d.profile_id is not null
         order by d.executing_at limit greatest(coalesce(p_limit, 10), 1)) x), '[]'::jsonb),
    'notices', coalesce((select jsonb_agg(x) from (
        select s.request_id, d.kind, d.scheduled_for, s.attempts
          from deletion_request_steps s join deletion_requests d on d.id = s.request_id
         where s.step = 'contributor_export_notice' and s.status = 'pending' and s.next_attempt_at <= now()
           and d.status in ('scheduled', 'held')
         order by d.requested_at limit greatest(coalesce(p_limit, 10), 1)) x), '[]'::jsonb),
    'request_emails', coalesce((select jsonb_agg(x) from (
        select d.id, d.profile_id, d.scheduled_for, d.requested_at, d.cancelled_at
          from deletion_requests d
         where d.kind = 'account' and d.status in ('scheduled', 'held') and d.profile_id is not null
           and not (d.receipt ? 'request_email') and d.requested_at > now() - interval '2 days'
         order by d.requested_at limit greatest(coalesce(p_limit, 10), 1)) x), '[]'::jsonb),
    'cancel_emails', coalesce((select jsonb_agg(x) from (
        select d.id, d.profile_id, d.scheduled_for, d.requested_at, d.cancelled_at
          from deletion_requests d
         where d.kind = 'account' and d.status = 'cancelled' and d.profile_id is not null
           and not (d.receipt ? 'cancel_email') and d.cancelled_at > now() - interval '2 days'
         order by d.cancelled_at limit greatest(coalesce(p_limit, 10), 1)) x), '[]'::jsonb));
$$;

-- Adds keys to a request's receipt (counts and step outcomes only; the column caps it at 2 KB).
create or replace function public.ops_merge_deletion_receipt(p_request uuid, p_part jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v jsonb;
begin
  if p_part is null or jsonb_typeof(p_part) <> 'object' then
    raise exception 'receipt part must be an object' using errcode = '22023';
  end if;
  update deletion_requests set receipt = receipt || p_part where id = p_request returning receipt into v;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  return v;
end;
$$;

-- Queue rows due now. With a request id: every undone row of that request,
-- whatever its backoff (the account step has its own backoff).
create or replace function public.ops_storage_queue_due(p_limit int default 200, p_request uuid default null)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'bucket_id', q.bucket_id, 'object_path', q.object_path,
           'is_prefix', q.is_prefix, 'request_id', q.request_id, 'attempts', q.attempts) order by q.id), '[]'::jsonb)
    from (select * from storage_purge_queue q
           where q.done_at is null
             and (case when p_request is null then q.next_attempt_at <= now() else q.request_id = p_request end)
           order by q.id limit greatest(least(coalesce(p_limit, 200), 1000), 1)) q;
$$;

-- Objects Supabase records as owned by a person (Supabase refuses to delete an
-- Auth user who owns objects). storage.objects has `owner` (uuid, deprecated)
-- and `owner_id` (text) on current projects; either may be absent.
create or replace function public.ops_storage_owned_by(p_uid uuid, p_limit int default 1000)
returns jsonb language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare
  v_owner boolean;
  v_owner_id boolean;
  v_cond text;
  v jsonb;
begin
  select exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner'),
         exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner_id')
    into v_owner, v_owner_id;
  if not v_owner and not v_owner_id then return '[]'::jsonb; end if;
  v_cond := case when v_owner and v_owner_id then '(owner = $1 or owner_id = $1::text)'
                 when v_owner then 'owner = $1' else 'owner_id = $1::text' end;
  execute format('select coalesce(jsonb_agg(jsonb_build_object(''bucket_id'', o.bucket_id, ''name'', o.name) order by o.bucket_id, o.name), ''[]''::jsonb)
                    from (select bucket_id, name from storage.objects where %s and bucket_id <> ''ops-ledger''
                          order by bucket_id, name limit $2) o', v_cond)
    into v using p_uid, greatest(least(coalesce(p_limit, 1000), 5000), 1);
  return v;
end;
$$;

-- Objects whose path has the person's id as a folder ({child}/{uid}/... or {uid}/...).
create or replace function public.ops_storage_residue(p_uid uuid, p_limit int default 100)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', o.bucket_id, 'name', o.name)), '[]'::jsonb)
    from (select bucket_id, name from storage.objects
           where bucket_id <> 'ops-ledger' and ('/' || name) like ('%/' || p_uid::text || '/%')
           order by bucket_id, name limit greatest(least(coalesce(p_limit, 100), 1000), 1)) o;
$$;

-- Every uuid column in public and ops that still holds the person's id
-- (DATA-REQ-034). 'before_finalize' skips the columns finalize_account_deletion
-- nulls itself; 'after_finalize' skips only the 12-month security log.
create or replace function public.ops_deletion_residue(p_uid uuid, p_phase text default 'before_finalize')
returns jsonb language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare
  r record;
  v_hit boolean;
  v_out jsonb := '[]'::jsonb;
  v_skip text[] := array['ops.audit_log.target_profile'];
begin
  if p_phase not in ('before_finalize', 'after_finalize') then
    raise exception 'phase must be before_finalize or after_finalize' using errcode = '22023';
  end if;
  if p_phase = 'before_finalize' then
    v_skip := v_skip || array['public.audit_events.actor_id', 'public.audit_events.subject_id',
      'public.deletion_requests.profile_id', 'public.entry_versions.superseded_by', 'public.entries.reviewed_by'];
  end if;
  for r in
    select c.table_schema, c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema in ('public', 'ops') and c.data_type = 'uuid' and t.table_type = 'BASE TABLE'
     order by 1, 2, 3
  loop
    continue when (r.table_schema || '.' || r.table_name || '.' || r.column_name) = any (v_skip);
    execute format('select exists (select 1 from %I.%I where %I = $1)', r.table_schema, r.table_name, r.column_name)
      into v_hit using p_uid;
    if v_hit then
      v_out := v_out || jsonb_build_array(jsonb_build_object('table_schema', r.table_schema, 'table_name', r.table_name, 'column_name', r.column_name));
    end if;
  end loop;
  return v_out;
end;
$$;

-- Family members (contributors) of the books a request deletes, to send "save a copy".
create or replace function public.ops_deletion_contributors(p_request uuid)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(distinct m.profile_id), '[]'::jsonb)
    from deletion_requests d
    join children c on c.deletion_request_id = d.id or (d.kind = 'book' and c.id = d.child_id)
    join child_members m on m.child_id = c.id and m.role = 'contributor'
   where d.id = p_request and m.profile_id is distinct from d.profile_id;
$$;

-- Points a surviving book at its re-homed photo, only if it still uses the old one.
create or replace function public.ops_set_child_photo_path(p_child uuid, p_old text, p_new text)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  update children set photo_path = p_new where id = p_child and photo_path = p_old;
  return found;
end;
$$;

-- Deletion SLA counts (DATA-REQ-036, TDD 05 5.4). Counts only.
create or replace function public.ops_deletion_sla(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select jsonb_build_object(
    'tombstones_overdue',
      (select count(*) from entries e where e.deleted_at < p_now - interval '31 days' and not public.entry_is_held(e.id))
      + (select count(*) from children c where c.deleted_at < p_now - interval '31 days' and not public.is_held('child', c.id)),
    'requests_executing_over_24h',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '24 hours'),
    'requests_executing_over_7d',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '7 days'),
    'steps_failed',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'failed' and d.status in ('scheduled', 'held', 'executing')),
    'steps_retrying',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'pending' and s.attempts >= 5 and d.status in ('scheduled', 'held', 'executing')),
    'queue_stuck',
      (select count(*) from storage_purge_queue where done_at is null and enqueued_at < p_now - interval '24 hours'),
    'queue_attempts_high',
      (select count(*) from storage_purge_queue where done_at is null and attempts >= 10),
    'scheduled_overdue',
      (select count(*) from deletion_requests where status = 'scheduled' and scheduled_for < p_now - interval '1 day'),
    'holds_past_review',
      (select count(*) from legal_holds where released_at is null and review_by < p_now::date),
    'purge_run_age_minutes',
      (select floor(extract(epoch from p_now - max(at)) / 60)::int from audit_events where action = 'purge_run'));
$$;

-- Claims an alert kind for one email if the cooldown has passed. Atomic.
create or replace function public.ops_alert_claim(p_kind text, p_cooldown_minutes int default 1440)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into ops.alert_state (kind) values (p_kind) on conflict (kind) do nothing;
  update ops.alert_state set last_sent_at = now(), sends = sends + 1
   where kind = p_kind
     and (last_sent_at is null or last_sent_at < now() - make_interval(mins => greatest(coalesce(p_cooldown_minutes, 1440), 1)));
  return found;
end;
$$;

-- Releases a claim when the alert email could not be sent.
create or replace function public.ops_alert_reset(p_kind text)
returns void language sql security definer set search_path = public, pg_catalog as $$
  update ops.alert_state set last_sent_at = null where kind = p_kind;
$$;

-- analytics-forget rate limit: true while the person is within p_limit calls today.
create or replace function public.ops_consume_forget_quota(p_profile uuid, p_limit int default 5)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v int;
begin
  delete from ops.forget_quota where profile_id = p_profile and day < current_date - 1;
  insert into ops.forget_quota as q (profile_id, day, calls) values (p_profile, current_date, 1)
    on conflict (profile_id, day) do update set calls = q.calls + 1
    returning calls into v;
  return v <= greatest(coalesce(p_limit, 5), 1);
end;
$$;

-- Apple refresh tokens. put: the sign-in exchange (apple-token function, not built yet).
-- get and delete: the purge worker's apple_token_revoke step.
create or replace function public.ops_apple_token_put(p_profile uuid, p_ciphertext text, p_key_version int, p_client_id text)
returns void language sql security definer set search_path = public, pg_catalog as $$
  insert into ops.apple_tokens (profile_id, ciphertext, key_version, client_id)
  values (p_profile, p_ciphertext, p_key_version, p_client_id)
  on conflict (profile_id) do update
    set ciphertext = excluded.ciphertext, key_version = excluded.key_version,
        client_id = excluded.client_id, updated_at = now();
$$;

create or replace function public.ops_apple_token_get(p_profile uuid)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('ciphertext', t.ciphertext, 'key_version', t.key_version, 'client_id', t.client_id)), '[]'::jsonb)
    from ops.apple_tokens t where t.profile_id = p_profile;
$$;

create or replace function public.ops_apple_token_delete(p_profile uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  delete from ops.apple_tokens where profile_id = p_profile;
  return found;
end;
$$;

-- Purge ledger rows in a time window, for the daily copy to the ops-ledger bucket.
create or replace function public.ops_ledger_between(p_from timestamptz, p_until timestamptz, p_limit int default 50000)
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('t', l.entity_type, 'id', l.entity_id, 'at', l.purged_at) order by l.purged_at, l.entity_type, l.entity_id), '[]'::jsonb)
    from (select * from purge_ledger where purged_at >= p_from and purged_at < p_until
           order by purged_at, entity_type, entity_id limit greatest(least(coalesce(p_limit, 50000), 100000), 1)) l;
$$;

-- Ops retention (LEGAL-REQ-033): runbook log 12 months, quota rows 2 days.
create or replace function public.ops_retention(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_log int; v_quota int;
begin
  perform set_config('app.ops_retention', 'on', true);
  delete from ops.audit_log where at < p_now - interval '12 months';
  get diagnostics v_log = row_count;
  perform set_config('app.ops_retention', 'off', true);
  delete from ops.forget_quota where day < (p_now - interval '2 days')::date;
  get diagnostics v_quota = row_count;
  return jsonb_build_object('audit_log', v_log, 'forget_quota', v_quota);
end;
$$;

-- ─── 2. Runbook functions (scripts/ops) ──────────────────────────────────

-- One row per runbook run that touches people's data (LEGAL-REQ-025).
create or replace function public.ops_audit_write(p_operator text, p_runbook text, p_reason_code text, p_ticket text,
  p_target_profile uuid default null, p_target_child uuid default null, p_target_entry uuid default null,
  p_detail jsonb default '{}'::jsonb)
returns bigint language sql security definer set search_path = public, pg_catalog as $$
  insert into ops.audit_log (operator, runbook, reason_code, ticket, target_profile, target_child, target_entry, detail)
  values (p_operator, p_runbook, p_reason_code, p_ticket, p_target_profile, p_target_child, p_target_entry, coalesce(p_detail, '{}'::jsonb))
  returning id;
$$;

-- Affected-user enumeration for an incident (LEGAL-REQ-039). Scope (all keys optional):
--   {"all": true}                         whole database exposed
--   {"profile_ids": [...], "child_ids": [...]}
--   {"tables": ["entries", ...], "buckets": ["entry-photos"], "from": iso, "until": iso}
-- Tables: entries, entry_versions, children, profiles, child_members, dictionary_terms,
-- policy_acceptances, audit_events, auth.users. A row is in scope when it existed during the
-- window, that is, it was created before `until` (rows purged since are gone and cannot be
-- listed; the purge ledger and backups cover them). Without `until`, every row.
-- Over-inclusive on purpose: members of a book whose letters or photos were exposed are
-- listed with 'book_content' (the letters are about their child).
-- Returns per person: categories and counts; never content. Emails come from Auth (script).
create or replace function public.ops_incident_scope(p_scope jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_from timestamptz := coalesce((p_scope ->> 'from')::timestamptz, '-infinity'::timestamptz);
  v_until timestamptz := coalesce((p_scope ->> 'until')::timestamptz, 'infinity'::timestamptz);
  v_all boolean := coalesce((p_scope ->> 'all')::boolean, false);
  v_tables text[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'tables')), '{}');
  v_buckets text[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'buckets')), '{}');
  v_profiles uuid[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'profile_ids')::uuid), '{}');
  v_children uuid[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'child_ids')::uuid), '{}');
  v_has_created boolean;
  v_out jsonb;
begin
  if p_scope is null or jsonb_typeof(p_scope) <> 'object' then
    raise exception 'scope must be an object' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(v_tables) t where t not in ('entries', 'entry_versions', 'children', 'profiles',
      'child_members', 'dictionary_terms', 'policy_acceptances', 'audit_events', 'auth.users')) then
    raise exception 'unknown table in scope' using errcode = '22023';
  end if;
  if v_all then
    v_tables := array['entries', 'children', 'profiles', 'child_members', 'dictionary_terms', 'policy_acceptances', 'audit_events', 'auth.users'];
    v_buckets := array['entry-photos', 'entry-audio', 'inbox', 'child-photos', 'avatars', 'exports'];
  end if;

  create temp table if not exists incident_hits (profile_id uuid not null, category text not null, letters int not null default 0,
    photos int not null default 0, child_id uuid) on commit drop;
  truncate pg_temp.incident_hits;

  -- Named people and books.
  insert into pg_temp.incident_hits (profile_id, category)
    select p.id, c.cat from profiles p cross join unnest(array['profile', 'email', 'membership', 'consent_records']) c(cat)
     where p.id = any (v_profiles);
  insert into pg_temp.incident_hits (profile_id, category, letters)
    select e.author_id, 'letter_text', count(*) from entries e where e.author_id = any (v_profiles) group by e.author_id;
  insert into pg_temp.incident_hits (profile_id, category, child_id)
    select m.profile_id, 'child_identity', m.child_id from child_members m where m.child_id = any (v_children);
  insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
    select e.author_id, 'letter_text', count(*), e.child_id from entries e where e.child_id = any (v_children) group by e.author_id, e.child_id;

  -- Tables (with the window when given).
  if 'entries' = any (v_tables) or 'entry_versions' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
      select e.author_id, 'letter_text', count(*), e.child_id from entries e
       where e.created_at < v_until
       group by e.author_id, e.child_id;
  end if;
  if 'children' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, child_id)
      select m.profile_id, 'child_identity', c.id from children c join child_members m on m.child_id = c.id
       where c.created_at < v_until;
  end if;
  if 'profiles' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select p.id, 'profile' from profiles p where p.created_at < v_until;
  end if;
  if 'child_members' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, child_id)
      select m.profile_id, 'membership', m.child_id from child_members m where m.joined_at < v_until;
  end if;
  if 'dictionary_terms' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct d.owner_id, 'dictionary' from dictionary_terms d where d.created_at < v_until;
  end if;
  if 'policy_acceptances' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct a.profile_id, 'consent_records' from policy_acceptances a
       where a.profile_id is not null and a.accepted_at < v_until;
  end if;
  if 'audit_events' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct a.actor_id, 'activity_log' from audit_events a
       where a.actor_id is not null and a.at < v_until;
  end if;
  if 'auth.users' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category) select p.id, 'email' from profiles p;
  end if;

  -- Storage: {child}/{author}/... objects, by creation time when the column exists.
  if array_length(v_buckets, 1) > 0 then
    select exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'objects' and column_name = 'created_at')
      into v_has_created;
    execute format($q$
      insert into pg_temp.incident_hits (profile_id, category, photos, child_id)
      select x.author, 'photos', count(*), x.child from (
        select (split_part(o.name, '/', 1))::uuid child, (split_part(o.name, '/', 2))::uuid author
          from storage.objects o
         where o.bucket_id = any ($1)
           and split_part(o.name, '/', 1) ~ '^[0-9a-f-]{36}$' and split_part(o.name, '/', 2) ~ '^[0-9a-f-]{36}$'
           %s) x
       where exists (select 1 from profiles p where p.id = x.author)
       group by x.author, x.child$q$,
      case when v_has_created then 'and o.created_at < $3' else '' end)
      using v_buckets, v_from, v_until;
  end if;

  -- Book members of every book whose letters or photos are in scope.
  insert into pg_temp.incident_hits (profile_id, category, child_id)
    select distinct m.profile_id, 'book_content', h.child_id from pg_temp.incident_hits h
      join child_members m on m.child_id = h.child_id
     where h.category in ('letter_text', 'photos') and h.child_id is not null;

  select jsonb_build_object(
      'profiles', coalesce(jsonb_agg(x order by x.profile_id), '[]'::jsonb),
      'totals', jsonb_build_object('profiles', count(*), 'letters', coalesce(sum(x.letters), 0), 'photos', coalesce(sum(x.photos), 0)),
      'audio_on_server', exists (select 1 from storage.objects where bucket_id in ('entry-audio', 'inbox')),
      'escrow_present', to_regclass('public.child_keys') is not null)
    into v_out
    from (select h.profile_id, array_agg(distinct h.category order by h.category) categories,
                 (select coalesce(sum(letters), 0) from pg_temp.incident_hits i where i.profile_id = h.profile_id and i.category = 'letter_text')::int letters,
                 (select coalesce(sum(photos), 0) from pg_temp.incident_hits i where i.profile_id = h.profile_id and i.category = 'photos')::int photos,
                 count(distinct h.child_id)::int books,
                 (select array_agg(distinct m.role order by m.role) from child_members m where m.profile_id = h.profile_id) roles
            from pg_temp.incident_hits h join profiles p on p.id = h.profile_id
           group by h.profile_id) x;
  return v_out;
end;
$$;

-- Re-applies purges after a database restore (DATA-REQ-030, restore runbook).
-- Rows: [{"t": "entry" | "child" | "profile", "id": "<uuid>"}]. Profiles are only
-- reported: their Auth user is deleted by the script through the Admin API.
create or replace function public.ops_replay_ledger(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_entries uuid[];
  v_children uuid[];
  v_profiles uuid[];
  v_e int := 0;
  v_c int := 0;
  v_left jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be an array' using errcode = '22023';
  end if;
  select coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'entry'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'child'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'profile'), '{}')
    into v_entries, v_children, v_profiles
    from jsonb_array_elements(p_rows) r;
  -- Books first (their letters cascade), tombstoned so the last-parent guard allows the cascade.
  update children set deleted_at = coalesce(deleted_at, now()) where id = any (v_children);
  delete from children where id = any (v_children);
  get diagnostics v_c = row_count;
  delete from entries where id = any (v_entries);
  get diagnostics v_e = row_count;
  insert into purge_ledger (entity_type, entity_id)
    select r ->> 't', r ->> 'id' from jsonb_array_elements(p_rows) r
     where r ->> 't' in ('entry', 'child', 'profile') on conflict do nothing;
  select coalesce(jsonb_agg(p.id), '[]'::jsonb) into v_left from profiles p where p.id = any (v_profiles);
  perform public.audit('restore_replayed', 'system', null, null,
    jsonb_build_object('entries', v_e, 'books', v_c, 'profiles_left', jsonb_array_length(v_left)));
  return jsonb_build_object('entries', v_e, 'books', v_c, 'profiles_to_delete', v_left);
end;
$$;

-- Row counts for the restore drill comparison. Counts only.
create or replace function public.ops_row_counts()
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select jsonb_build_object(
    'profiles', (select count(*) from profiles),
    'children', (select count(*) from children),
    'child_members', (select count(*) from child_members),
    'entries', (select count(*) from entries),
    'entry_versions', (select count(*) from entry_versions),
    'dictionary_terms', (select count(*) from dictionary_terms),
    'deletion_requests', (select count(*) from deletion_requests),
    'policy_acceptances', (select count(*) from policy_acceptances),
    'audit_events', (select count(*) from audit_events),
    'purge_ledger', (select count(*) from purge_ledger),
    'newest_entry_at', (select max(created_at) from entries));
$$;

-- raw_sha256 for given letter ids, or a sample of letters created before a time.
-- The drill compares two databases; the script prints match counts only.
create or replace function public.ops_raw_sha(p_ids jsonb default null, p_limit int default 200, p_before timestamptz default now())
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'sha', encode(e.raw_sha256, 'hex')) order by e.id), '[]'::jsonb)
    from (select id, raw_sha256 from entries
           where case when p_ids is null then created_at < p_before
                      else id in (select (x)::uuid from jsonb_array_elements_text(p_ids) x) end
           order by id limit greatest(least(coalesce(p_limit, 200), 5000), 1)) e;
$$;

-- Structural checks for a restored copy (the drill runs these instead of PGlite tests).
create or replace function public.ops_schema_health()
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select jsonb_build_object(
    'tables_without_rls', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                             where n.nspname in ('public', 'ops') and c.relkind in ('r', 'p') and not c.relrowsecurity),
    'unclassified_columns', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                               join pg_attribute a on a.attrelid = c.oid
                              where n.nspname = 'public' and c.relkind in ('r', 'v') and a.attnum > 0 and not a.attisdropped
                                and coalesce(col_description(c.oid, a.attnum), '') !~ '^L[1-4]'),
    'functions_callable_by_anon', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
    'ops_visible_to_clients', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                                where n.nspname = 'ops' and c.relkind = 'r'
                                  and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('authenticated', c.oid, 'select'))));
$$;

-- ─── 3. Ledger bucket (service role only: no Storage policies) ───────────
insert into storage.buckets (id, name, public) values ('ops-ledger', 'ops-ledger', false) on conflict (id) do nothing;

-- ─── Grants ──────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.ops_deletion_work(int)', 'public.ops_merge_deletion_receipt(uuid, jsonb)',
    'public.ops_storage_queue_due(int, uuid)', 'public.ops_storage_owned_by(uuid, int)', 'public.ops_storage_residue(uuid, int)',
    'public.ops_deletion_residue(uuid, text)', 'public.ops_deletion_contributors(uuid)', 'public.ops_set_child_photo_path(uuid, text, text)',
    'public.ops_deletion_sla(timestamptz)', 'public.ops_alert_claim(text, int)', 'public.ops_alert_reset(text)',
    'public.ops_consume_forget_quota(uuid, int)', 'public.ops_apple_token_put(uuid, text, int, text)',
    'public.ops_apple_token_get(uuid)', 'public.ops_apple_token_delete(uuid)', 'public.ops_ledger_between(timestamptz, timestamptz, int)',
    'public.ops_retention(timestamptz)', 'public.ops_audit_write(text, text, text, text, uuid, uuid, uuid, jsonb)',
    'public.ops_incident_scope(jsonb)', 'public.ops_replay_ledger(jsonb)', 'public.ops_row_counts()',
    'public.ops_raw_sha(jsonb, int, timestamptz)', 'public.ops_schema_health()']
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', f);
    end if;
  end loop;
end;
$$;
