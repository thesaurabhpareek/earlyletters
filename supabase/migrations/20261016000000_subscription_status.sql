-- WP-F14-15b: the subscription status report and the purchase consent record
-- (D-080, D-081; PRD V2 F14 section 6.6 "Rules for the status report", section 8;
-- F14-REQ-014, -032, -043, -044; LEGAL-REQ-049; R2 AR-13). Stream S06.
--
-- PENDING: not yet applied. Placeholder timestamp in S06's claimed range
-- 20261016000000 to 20261016009999 (docs/agents/BOARD.md), next free after
-- S05's 20261015230000; the coordinator renames it to the next free timestamp
-- at merge (08-delivery.md section 4). Apply after every earlier file, following
-- supabase/APPLY.md (section "File 20261016000000", sent to S02 in the PR).
-- Never edits an earlier file and redefines no function first defined in one.
--
-- What the phone tells us, and nothing more (D-080): which plan, when a free
-- period ends, when the plan renews or ends, whether renewal is off. Plus the
-- R2 AR-13 identity and freshness fields (`sub_ref`, `environment`,
-- `reported_at`) from the D-080 contract in packages/api/src/server/
-- subscription-status.ts, the two optional fields that contract keeps open for
-- counsel (`free_period_days`, `subscribed_since`; the app sends neither yet),
-- and, on the first report after a purchase in the app, the D-081 consent facts
-- (product, offer type, Subscription Terms version shown as `terms_shown`, time). Never here: receipts, signed transactions, a
-- transaction id in clear, `appAccountToken`, prices, card or payment data.
-- `sub_ref` is SHA-256(per-account salt || original transaction id), made on
-- the phone by the native store module; the salt never leaves this database
-- except to its own account, so a `sub_ref` cannot be turned back into an id.
--
-- The server never enforces Plus and never answers "is this person a member"
-- (D-080 rule 4): no table here is readable by any client, and the report RPC
-- answers only how the write went (`stored`, `consent`).
--
-- Objects
--   public.subscription_salts       one random 32-byte salt per account (functions only)
--   public.subscription_status      one row per (profile, sub_ref): D-080 status, the last report received wins
--   public.subscription_consents    one row per original purchase (sub_ref): D-081 consent facts;
--                                   append-only; pseudonymised at account deletion, kept 3 years after
--   public.subscription_report_rates per-person counters for the two RPCs (30 per rolling hour each)
--   public.status_salt()            RPC: the caller's salt, base64url, made on first call
--   public.status_report_store(jsonb) RPC: switch, validate, idempotency, rate limit, upsert, consent once
--   public.subscription_report_switch()             internal: the server-side switch
--   public.subscription_rate_hit(uuid, text)        internal
--   public.subscription_consents_guard()            trigger: append-only except pseudonymise and purge
--   public.subscription_consents_pseudonymise()     trigger on profiles, before delete
--   public.subscription_retention_purge(timestamptz) service role: deletes consents 3 years after pseudonymisation
--
-- Changes outside S06's objects (flagged for S02 in the PR):
--   idempotency_keys_fn_check gains 'status_report_store' (the constraint from
--   20261005000000; S02 owns the table: if a later file of theirs replaces the
--   check, it keeps this name).
--
-- Deleting an account: status rows and the salt go with the profile (on delete
-- cascade, D-080 "the status is deleted with the account"); consent rows are
-- pseudonymised in the same transaction (D-081), like policy_acceptances. The
-- billing-notice record kept after deletion while Apple still bills
-- (F14-REQ-045) is NOT built here: it waits for counsel (Q-C12).
--
-- Server-side switch (fail closed, like S05's app.backup_enabled): both RPCs run
-- only while `app.status_report_enabled` is 'on' (alter database postgres set
-- app.status_report_enabled = 'on'); otherwise SCKIL with DETAIL 'statusReport',
-- which the Edge Function answers as 503 paused. The phone keeps its report and
-- retries later; nothing is lost. The function's own KILL_SWITCHES secret and the
-- signed remote config are the other two levers (packages/api kill-switches.ts).
--
-- Ordering (contract: "the server orders reports by its own receive time", F16
-- C12): the last report received for a purchase wins; `reported_at` is kept for
-- support, clamped to the server clock, and never a reason to refuse. The
-- contract's `older` outcome is not produced by this file.
--
-- New SQLSTATEs: none (SCKIL has its rule in packages/api SQLSTATE_RULES).
-- Reused: 28000, SCANO (require_user), SCRAT (rate),
-- 22023 (bad report; with DETAIL 'idempotency' for a reused key), 40001
-- (idempotent request still in progress), 55000 (pepper missing at deletion).

-- ─── 1. Tables ───────────────────────────────────────────────────────────

create table public.subscription_salts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  salt bytea not null check (octet_length(salt) = 32),
  created_at timestamptz not null default now()
);
alter table public.subscription_salts enable row level security;   -- no policies: functions only
revoke all on public.subscription_salts from public, anon, authenticated;
comment on table public.subscription_salts is
  'Per-account salt for sub_ref (D-080, R2 AR-13). Served only to its own account by status_salt(); deleted with the account.';
comment on column public.subscription_salts.profile_id is 'L3 account';
comment on column public.subscription_salts.salt is 'L3 32 random bytes; with an original transaction id it makes sub_ref';
comment on column public.subscription_salts.created_at is 'L2 when the salt was made';

create table public.subscription_status (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sub_ref text not null check (sub_ref ~ '^[0-9a-f]{64}$'),
  environment text not null check (environment in ('production', 'sandbox', 'xcode')),
  plan text not null check (plan in ('monthly', 'annual')),
  trial_end timestamptz,
  renewal_date timestamptz,
  cancelled boolean not null,
  free_period_days smallint check (free_period_days between 1 and 366),
  subscribed_since date,
  reported_at timestamptz not null,
  fingerprint text not null check (char_length(fingerprint) <= 200),
  first_received_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  primary key (profile_id, sub_ref)
);
-- The email scheduler (WP-F14-16) reads production rows by date; nothing else does.
create index subscription_status_due_idx on public.subscription_status (renewal_date)
  where environment = 'production';
alter table public.subscription_status enable row level security;   -- no policies: functions and the scheduler only
revoke all on public.subscription_status from public, anon, authenticated;
comment on table public.subscription_status is
  'D-080 subscription status, one row per (account, sub_ref), the last report received wins. Status only: no receipt, transaction id, price or payment data. Emails go only for environment = production. Never read by the app.';
comment on column public.subscription_status.profile_id is 'L3 account';
comment on column public.subscription_status.sub_ref is 'L3 salted SHA-256 of the original transaction id, made on the phone';
comment on column public.subscription_status.environment is 'L2 StoreKit environment (production, sandbox, xcode)';
comment on column public.subscription_status.plan is 'L3 monthly or annual';
comment on column public.subscription_status.trial_end is 'L3 end of the current free period, or null';
comment on column public.subscription_status.renewal_date is 'L3 end of the current period (next renewal, or the end when cancelled); null after it ended';
comment on column public.subscription_status.cancelled is 'L3 auto-renew is off';
comment on column public.subscription_status.free_period_days is 'L3 length of the free period (optional in contract v1, open for counsel; the app does not send it yet)';
comment on column public.subscription_status.subscribed_since is 'L3 UTC date the subscription began, for the monthly anniversary reminder (optional in contract v1, open for counsel; the app does not send it yet)';
comment on column public.subscription_status.reported_at is 'L2 when the phone read these values (device clock, never later than receipt); for support only';
comment on column public.subscription_status.fingerprint is 'L3 the status fields joined, to tell a change from a repeat';
comment on column public.subscription_status.first_received_at is 'L2 first report for this purchase';
comment on column public.subscription_status.received_at is 'L2 last report received';

create table public.subscription_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  subject_hash bytea,                     -- set when the profile is deleted (pseudonymised retention)
  pseudonymised_at timestamptz,           -- retention clock: rows are deleted 3 years after this
  sub_ref text not null unique check (sub_ref ~ '^[0-9a-f]{64}$'),
  product_id text not null check (product_id ~ '^[a-z0-9][a-z0-9._-]{0,99}$'),
  offer_type text not null check (offer_type in ('none', 'introductory', 'promotional', 'offer_code', 'win_back')),
  terms_shown text not null check (terms_shown ~ '^(none_outside_app|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(\+[0-9a-f]{8})?)$'),
  shown_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (profile_id is not null or subject_hash is not null)
);
create index subscription_consents_profile_idx on public.subscription_consents (profile_id);
create index subscription_consents_pseudonymised_idx on public.subscription_consents (pseudonymised_at)
  where pseudonymised_at is not null;
alter table public.subscription_consents enable row level security;   -- no policies: functions only
revoke all on public.subscription_consents from public, anon, authenticated;
comment on table public.subscription_consents is
  'D-081 purchase consent record: one per original purchase (sub_ref), from the first status report after a purchase in the app. Append-only; pseudonymised at account deletion; deleted 3 years after that. No receipt, transaction id or price.';
comment on column public.subscription_consents.id is 'L2 row id';
comment on column public.subscription_consents.profile_id is 'L3 account; null once pseudonymised';
comment on column public.subscription_consents.subject_hash is 'L3 pseudonymised person id (peppered SHA-256), set at account deletion';
comment on column public.subscription_consents.pseudonymised_at is 'L2 retention clock';
comment on column public.subscription_consents.sub_ref is 'L3 salted SHA-256 of the original transaction id; unlinkable once the salt is deleted';
comment on column public.subscription_consents.product_id is 'L3 StoreKit product id (plus.monthly or plus.annual)';
comment on column public.subscription_consents.offer_type is 'L3 how the free period was offered';
comment on column public.subscription_consents.terms_shown is 'L2 Subscription Terms version shown in the app, or none_outside_app';
comment on column public.subscription_consents.shown_at is 'L3 when the terms were shown and the purchase confirmed (device clock)';
comment on column public.subscription_consents.recorded_at is 'L2 server time of the record';

-- Per-person counters for status_report_store and status_salt (30 per rolling
-- hour each, ENDPOINTS statusReport and statusSalt in packages/api). Written only
-- by subscription_rate_hit(). Kept apart from sync_rate_windows because rate_hit()
-- (S02) has a fixed bucket list; S02 may fold these into it later (PR request).
create table public.subscription_report_rates (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check (bucket in ('report', 'salt')),
  window_start timestamptz not null,
  hits int not null check (hits >= 0),
  primary key (profile_id, bucket)
);
alter table public.subscription_report_rates enable row level security;   -- no policies: functions only
revoke all on public.subscription_report_rates from public, anon, authenticated;
comment on table public.subscription_report_rates is
  'Per-person request counters for the subscription status RPCs (SCRAT). Written only by subscription_rate_hit().';
comment on column public.subscription_report_rates.profile_id is 'L3 account';
comment on column public.subscription_report_rates.bucket is 'L2 report or salt';
comment on column public.subscription_report_rates.window_start is 'L2 start of the rolling window';
comment on column public.subscription_report_rates.hits is 'L2 calls in the window';

-- The report RPC claims idempotency keys under its own name (ADR 0017 rule 3).
alter table public.idempotency_keys drop constraint if exists idempotency_keys_fn_check;
alter table public.idempotency_keys add constraint idempotency_keys_fn_check
  check (fn in ('create_child_invite', 'record_policy_act', 'status_report_store'));

-- ─── 2. Internal helpers ─────────────────────────────────────────────────

create or replace function public.subscription_rate_hit(p_uid uuid, p_bucket text)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_window constant interval := interval '1 hour';
  v_limit constant int := 30;      -- STATUS_REPORTS_PER_HOUR in packages/api; the same for the salt
  v_hits int;
begin
  if p_bucket not in ('report', 'salt') then
    raise exception 'unknown rate bucket' using errcode = '22023';
  end if;
  insert into subscription_report_rates as w (profile_id, bucket, window_start, hits) values (p_uid, p_bucket, now(), 1)
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - v_window then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - v_window then now() else w.window_start end
  returning hits into v_hits;
  if v_hits > v_limit then
    raise exception 'too many requests' using errcode = 'SCRAT';
  end if;
end;
$$;

-- The server-side switch for both RPCs (fail closed: only 'on' runs).
create or replace function public.subscription_report_switch()
returns void language plpgsql stable set search_path = pg_catalog, public, pg_temp as $$
begin
  if coalesce(current_setting('app.status_report_enabled', true), '') is distinct from 'on' then
    raise exception 'the subscription status report is paused on this server' using errcode = 'SCKIL', detail = 'statusReport';
  end if;
end;
$$;

-- An ISO 8601 instant from the report, or an error the caller turns into 22023.
-- Null stays null. Only the shape StoreKit's ISO8601DateFormatter writes
-- (date, 'T', time, optional fraction, 'Z' or an offset) is accepted.
create or replace function public.subscription_instant(p_value jsonb, p_nullable boolean)
returns timestamptz language plpgsql stable set search_path = pg_catalog, public, pg_temp as $$
declare v text;
begin
  if p_value is null or jsonb_typeof(p_value) = 'null' then
    if p_nullable then return null; end if;
    raise exception 'instant required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_value) <> 'string' then
    raise exception 'instant must be a string' using errcode = '22023';
  end if;
  v := p_value #>> '{}';
  if char_length(v) > 40 or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]{1,9})?)?(Z|[+-][0-9]{2}:?[0-9]{2})$' then
    raise exception 'instant must be ISO 8601' using errcode = '22023';
  end if;
  return v::timestamptz;
exception when invalid_datetime_format or datetime_field_overflow then
  raise exception 'instant out of range' using errcode = '22023';
end;
$$;

-- ─── 3. RPCs ─────────────────────────────────────────────────────────────

-- The caller's salt (32 random bytes, base64url without padding, 43 characters),
-- made on the first call and stable after it. 30 per person per rolling hour.
-- gen_random_uuid() is the one random source every Postgres here has; two of
-- them hashed give 244 random bits, ample for a salt that must only be unique
-- and unguessable.
create or replace function public.status_salt()
returns text language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_salt bytea;
begin
  perform public.subscription_report_switch();
  perform public.subscription_rate_hit(v_uid, 'salt');
  insert into subscription_salts (profile_id, salt)
  values (v_uid, sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')))
  on conflict (profile_id) do nothing;
  select s.salt into v_salt from subscription_salts s where s.profile_id = v_uid;
  return rtrim(translate(encode(v_salt, 'base64'), '+/', '-_'), '=');
end;
$$;

-- One status report (packages/api StatusReportSchema, version 1). Any signed-in
-- client can call this directly, so it repeats every check the Edge Function
-- makes and trusts none of them: the same allowlisted keys and types, at most
-- 2 KiB, and the fingerprint computed here (statusFingerprint in packages/api is
-- the reference). One transaction: idempotency claim, rate limit, upsert keeping
-- per (profile, sub_ref) in the order the server receives reports, consent once
-- per sub_ref. Returns {stored: created|updated|unchanged, consent: recorded|already_recorded|none}.
create or replace function public.status_report_store(p_report jsonb)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_replay jsonb;
  v_sub_ref text;
  v_env text;
  v_plan text;
  v_trial timestamptz;
  v_renewal timestamptz;
  v_cancelled boolean;
  v_days int;
  v_since date;
  v_reported timestamptz;
  v_fp text;
  v_consent jsonb;
  v_c_product text;
  v_c_offer text;
  v_c_terms text;
  v_c_shown timestamptz;
  v_row subscription_status%rowtype;
  v_stored text;
  v_consent_out text := 'none';
  v_result jsonb;
begin
  perform public.subscription_report_switch();
  -- Shape (strict, like StatusReportSchema).
  if p_report is null or jsonb_typeof(p_report) <> 'object' or octet_length(p_report::text) > 2048 then
    raise exception 'report must be an object of at most 2 KiB' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(p_report) k
              where k not in ('schema_version', 'sub_ref', 'environment', 'plan', 'trial_end', 'renewal_date',
                              'cancelled', 'free_period_days', 'subscribed_since', 'reported_at', 'consent')) then
    raise exception 'report has a key outside the contract' using errcode = '22023';
  end if;
  if p_report -> 'schema_version' is distinct from '1'::jsonb then
    raise exception 'unknown schema_version' using errcode = '22023';
  end if;
  if jsonb_typeof(p_report -> 'sub_ref') is distinct from 'string' or (p_report ->> 'sub_ref') !~ '^[0-9a-f]{64}$' then
    raise exception 'sub_ref must be 64 lowercase hex' using errcode = '22023';
  end if;
  v_sub_ref := p_report ->> 'sub_ref';
  if jsonb_typeof(p_report -> 'environment') is distinct from 'string' or (p_report ->> 'environment') not in ('production', 'sandbox', 'xcode') then
    raise exception 'unknown environment' using errcode = '22023';
  end if;
  v_env := p_report ->> 'environment';
  if jsonb_typeof(p_report -> 'plan') is distinct from 'string' or (p_report ->> 'plan') not in ('monthly', 'annual') then
    raise exception 'unknown plan' using errcode = '22023';
  end if;
  v_plan := p_report ->> 'plan';
  if not (p_report ? 'trial_end') or not (p_report ? 'renewal_date') or not (p_report ? 'reported_at') then
    raise exception 'trial_end, renewal_date and reported_at are required' using errcode = '22023';
  end if;
  v_trial := public.subscription_instant(p_report -> 'trial_end', true);
  v_renewal := public.subscription_instant(p_report -> 'renewal_date', true);
  v_reported := public.subscription_instant(p_report -> 'reported_at', false);
  if jsonb_typeof(p_report -> 'cancelled') is distinct from 'boolean' then
    raise exception 'cancelled must be a boolean' using errcode = '22023';
  end if;
  v_cancelled := (p_report ->> 'cancelled')::boolean;
  if p_report ? 'free_period_days' and jsonb_typeof(p_report -> 'free_period_days') <> 'null' then
    if jsonb_typeof(p_report -> 'free_period_days') <> 'number' or (p_report ->> 'free_period_days') !~ '^[0-9]{1,3}$' then
      raise exception 'free_period_days must be a whole number' using errcode = '22023';
    end if;
    v_days := (p_report ->> 'free_period_days')::int;
    if v_days < 1 or v_days > 366 then
      raise exception 'free_period_days out of range' using errcode = '22023';
    end if;
  end if;
  if p_report ? 'subscribed_since' and jsonb_typeof(p_report -> 'subscribed_since') <> 'null' then
    if jsonb_typeof(p_report -> 'subscribed_since') <> 'string' or (p_report ->> 'subscribed_since') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'subscribed_since must be a date' using errcode = '22023';
    end if;
    begin
      v_since := (p_report ->> 'subscribed_since')::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception 'subscribed_since out of range' using errcode = '22023';
    end;
  end if;
  -- A free period ends no later than the period it sits in (parseStatusReport).
  if v_trial is not null and v_renewal is not null and v_trial > v_renewal + interval '1 day' then
    raise exception 'trial_end after renewal_date' using errcode = '22023';
  end if;
  v_consent := p_report -> 'consent';
  if v_consent is not null and jsonb_typeof(v_consent) <> 'null' then
    if jsonb_typeof(v_consent) <> 'object'
       or exists (select 1 from jsonb_object_keys(v_consent) k where k not in ('product_id', 'offer_type', 'terms_shown', 'shown_at'))
       or jsonb_typeof(v_consent -> 'product_id') is distinct from 'string'
       or (v_consent ->> 'product_id') !~ '^[a-z0-9][a-z0-9._-]{0,99}$'
       or jsonb_typeof(v_consent -> 'offer_type') is distinct from 'string'
       or (v_consent ->> 'offer_type') not in ('none', 'introductory', 'promotional', 'offer_code', 'win_back')
       or jsonb_typeof(v_consent -> 'terms_shown') is distinct from 'string'
       or (v_consent ->> 'terms_shown') !~ '^(none_outside_app|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(\+[0-9a-f]{8})?)$' then
      raise exception 'consent facts outside the contract' using errcode = '22023';
    end if;
    v_c_product := v_consent ->> 'product_id';
    v_c_offer := v_consent ->> 'offer_type';
    v_c_terms := v_consent ->> 'terms_shown';
    v_c_shown := public.subscription_instant(v_consent -> 'shown_at', false);
  else
    v_consent := null;
  end if;
  -- A phone whose clock runs ahead never stores a time later than now.
  v_reported := least(v_reported, now());

  -- Idempotency (ADR 0017): a repeat of the same key and body answers the stored
  -- result; the same key with another body is 22023 with DETAIL 'idempotency'.
  perform public.request_idempotency_key();          -- a malformed key is a plain 22023
  begin
    v_replay := public.idempotency_claim(v_uid, 'status_report_store', p_report);
  exception when sqlstate '22023' then
    raise exception 'idempotency key reused for a different request' using errcode = '22023', detail = 'idempotency';
  end;
  if v_replay is not null then
    return v_replay;
  end if;

  perform public.subscription_rate_hit(v_uid, 'report');

  -- The fields the scheduler compares (statusFingerprint in packages/api).
  v_fp := concat_ws('|', v_env, v_plan,
    coalesce(to_char(v_trial at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), '-'),
    coalesce(to_char(v_renewal at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), '-'),
    case when v_cancelled then '1' else '0' end,
    coalesce(v_days::text, '-'),
    coalesce(v_since::text, '-'));

  insert into subscription_status (profile_id, sub_ref, environment, plan, trial_end, renewal_date, cancelled,
                                   free_period_days, subscribed_since, reported_at, fingerprint)
  values (v_uid, v_sub_ref, v_env, v_plan, v_trial, v_renewal, v_cancelled, v_days, v_since, v_reported, v_fp)
  on conflict (profile_id, sub_ref) do nothing;
  if found then
    v_stored := 'created';
  else
    -- The server's receive order decides (contract, F16 C12): a phone clock set
    -- ahead or behind can never freeze the status of a purchase two phones share.
    select * into v_row from subscription_status s where s.profile_id = v_uid and s.sub_ref = v_sub_ref for update;
    if v_fp = v_row.fingerprint then
      v_stored := 'unchanged';
      update subscription_status s set reported_at = v_reported, received_at = now()
       where s.profile_id = v_uid and s.sub_ref = v_sub_ref;
    else
      v_stored := 'updated';
      update subscription_status s
         set environment = v_env, plan = v_plan, trial_end = v_trial, renewal_date = v_renewal, cancelled = v_cancelled,
             free_period_days = v_days, subscribed_since = v_since, reported_at = v_reported, fingerprint = v_fp, received_at = now()
       where s.profile_id = v_uid and s.sub_ref = v_sub_ref;
    end if;
  end if;

  -- D-081: one consent record per original purchase; the first report that carries it wins.
  if v_consent is not null then
    insert into subscription_consents (profile_id, sub_ref, product_id, offer_type, terms_shown, shown_at)
    values (v_uid, v_sub_ref, v_c_product, v_c_offer, v_c_terms, least(v_c_shown, now()))
    on conflict (sub_ref) do nothing;
    v_consent_out := case when found then 'recorded' else 'already_recorded' end;
  end if;

  v_result := jsonb_build_object('stored', v_stored, 'consent', v_consent_out);
  perform public.idempotency_store(v_uid, 'status_report_store', v_result);
  return v_result;
end;
$$;

-- ─── 4. Consent records: append-only, pseudonymised, purged after 3 years ──

create or replace function public.subscription_consents_guard()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.retention_purge', true) is distinct from 'on' then
      raise exception 'subscription_consents rows are append-only';
    end if;
    return old;
  end if;
  if new.profile_id is null and old.profile_id is not null and new.subject_hash is not null and new.pseudonymised_at is not null
     and (new.id, new.sub_ref, new.product_id, new.offer_type, new.terms_shown, new.shown_at, new.recorded_at)
         is not distinct from
         (old.id, old.sub_ref, old.product_id, old.offer_type, old.terms_shown, old.shown_at, old.recorded_at) then
    return new;
  end if;
  raise exception 'subscription_consents rows are append-only';
end;
$$;
create trigger subscription_consents_guard before update or delete on public.subscription_consents
  for each row execute function public.subscription_consents_guard();

-- Pseudonymise before the profile row disappears, with the same pepper and hash
-- input as policy_acceptances (so one person's rows match across both tables).
-- Fails closed (55000) when there is something to pseudonymise and the pepper is
-- missing or short, as S02's G-12 does for policy_acceptances (PR #140): an
-- empty pepper would make the hash guessable from the account id.
create or replace function public.subscription_consents_pseudonymise()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
begin
  if not exists (select 1 from subscription_consents c where c.profile_id = old.id) then
    return old;
  end if;
  if char_length(btrim(v_pepper)) < 32 then
    raise exception 'app.consent_pepper is missing or shorter than 32 characters; set it before deleting accounts (supabase/APPLY.md step 6)'
      using errcode = '55000';
  end if;
  update subscription_consents
     set subject_hash = sha256(convert_to(old.id::text || v_pepper, 'UTF8')),
         pseudonymised_at = now(),
         profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;
create trigger profiles_pseudonymise_subscription_consents before delete on public.profiles
  for each row execute function public.subscription_consents_pseudonymise();

-- Service role (the daily purge, requested from S02 for purge_due or from S07 for
-- the purge worker): consent records 3 years after pseudonymisation (D-081,
-- Privacy Policy section 10). Returns how many were deleted.
create or replace function public.subscription_retention_purge(p_now timestamptz default now())
returns int language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_n int;
begin
  perform set_config('app.retention_purge', 'on', true);
  delete from subscription_consents where pseudonymised_at < p_now - interval '3 years';
  get diagnostics v_n = row_count;
  perform set_config('app.retention_purge', 'off', true);
  return v_n;
end;
$$;

-- ─── 5. Grants ───────────────────────────────────────────────────────────

revoke execute on function public.subscription_rate_hit(uuid, text) from public, anon, authenticated;
revoke execute on function public.subscription_instant(jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.subscription_report_switch() from public, anon, authenticated;
revoke execute on function public.subscription_consents_guard() from public, anon, authenticated;
revoke execute on function public.subscription_consents_pseudonymise() from public, anon, authenticated;
revoke execute on function public.subscription_retention_purge(timestamptz) from public, anon, authenticated;
revoke execute on function public.status_salt() from public, anon;
revoke execute on function public.status_report_store(jsonb) from public, anon;
grant execute on function public.status_salt() to authenticated;
grant execute on function public.status_report_store(jsonb) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.subscription_retention_purge(timestamptz) to service_role';
    execute 'grant select on public.subscription_status to service_role';
  end if;
end;
$$;

comment on function public.status_salt() is
  'D-080 / R2 AR-13: the caller''s per-account salt for sub_ref (base64url, 43 characters). 30 per person per hour (SCRAT). SCKIL while app.status_report_enabled is not on.';
comment on function public.status_report_store(jsonb) is
  'D-080 status report and D-081 consent facts (packages/api StatusReportSchema v1). Strict keys, at most 2 KiB, idempotency key, 30 per person per hour (SCRAT), SCKIL while app.status_report_enabled is not on. Answers only {stored, consent}; never whether the caller is a member.';
