-- Compliance gates at account creation, content-free counts, and the regulatory watch (CTO ruling CR-22).
--
-- PENDING: not yet applied. v1.1 (accounts arrive in v1.1; v1.0 is on-device only, 15 Oct 2026). Do not
-- merge before the 9 Nov go/no-go. Apply after 20261028000000. Safe to run twice.
--
-- What it adds, all in schema ops (service only, never reachable from the app):
--   ops.restricted_jurisdictions  places we refuse sign-up from (Terms 2.4, register CR-121). Data, not code.
--                                  Changing a status is a founder decision (skill regulatory-compliance,
--                                  references/sanctions.md). Seeded with the CR-22 default.
--   ops.geo_ip_ranges, ops.geo_ip_meta
--                                  IP to country, loaded monthly from DB-IP "IP to Country Lite" (CC BY 4.0,
--                                  attribution to DB-IP.com) by scripts/compliance/load-geo-ip.mjs.
--   ops.compliance_check_counts   one row per day, check, outcome and (for blocks only) jurisdiction, with a
--                                  count. No person id, no IP, no time finer than a day. Two-year retention.
--   ops.regulatory_watch          rule changes seen by scripts/compliance/regulatory-watch.mjs, with triage.
--
-- And in public (definer, pinned search_path, revoked from PUBLIC, anon and authenticated):
--   hook_before_user_created(jsonb)   Supabase Auth "before user created" hook (Postgres function). Grants
--                                     execute to supabase_auth_admin only. Refuses sign-up from a blocked
--                                     country with HTTP 403 and the machine message `signup_unavailable_region`
--                                     (the app maps it to its own copy; no product words live in SQL).
--   ops_count_check(text,text,text)   service_role: the v1.1 web contribution page records its own check.
--   ops_regwatch_record(jsonb)        service_role: the watch script stores what it found.
--   ops_regwatch_triage(bigint,text,text)  service_role: mark an item relevant, not relevant or actioned.
--   ops_compliance_report(date,date)  service_role: one JSON report for a date range.
--   ops_compliance_retention(timestamptz)  service_role: deletes counts older than two years.
--
-- Decisions inside this file (CR-22):
--   * The IP is used in memory to find a country and is never stored or logged.
--   * Fail open, and count it. No geo data, no IP, an unknown country, or an internal error lets the sign-up
--     through and counts `geo_unknown` or `error`. Refusing every sign-up because a monthly file is late would
--     be an outage, not a control; the counts make it visible, and the report flags stale data (> 45 days).
--   * Country level only. Region-level places (Crimea, Sevastopol, Donetsk, Luhansk) cannot be resolved from
--     country data; their rows are kept for the web page, which gets a region header, and the hook ignores
--     region rows. The Terms attestation covers the rest.
--   * No name screening (references/sanctions.md).
--
-- Enable on hosted (founder step, after apply; APPLY.md File 27): Dashboard > Authentication > Hooks > Before User Created >
-- Postgres function public.hook_before_user_created.
-- Then load geo data (scripts/compliance/load-geo-ip.mjs). Until geo data is loaded the hook allows all.
--
-- Rollback: disable the hook first (Dashboard), then
--   drop function public.hook_before_user_created(jsonb), public.ops_count_check(text,text,text),
--     public.ops_regwatch_record(jsonb), public.ops_regwatch_triage(bigint,text,text),
--     public.ops_compliance_report(date,date), public.ops_compliance_retention(timestamptz),
--     ops.country_of(inet), ops.bump_check(text,text,text);
--   drop table ops.regulatory_watch, ops.compliance_check_counts, ops.geo_ip_meta, ops.geo_ip_ranges,
--     ops.restricted_jurisdictions;

create schema if not exists ops;

-- 1. Restricted jurisdictions ------------------------------------------------------------------------------
create table if not exists ops.restricted_jurisdictions (
  code text primary key check (code ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  name text not null check (char_length(name) between 1 and 80),
  program text not null check (char_length(program) between 1 and 120),
  scope text not null check (scope in ('country', 'region')),
  status text not null check (status in ('block', 'allow')),
  decided_by text not null check (char_length(decided_by) between 1 and 80),
  source_url text not null check (source_url ~ '^https://'),
  checked_on date not null,
  note text check (char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  check ((scope = 'country') = (code !~ '-'))
);
comment on table ops.restricted_jurisdictions is
  'Places sign-up is refused from (Terms 2.4, register CR-121, CTO ruling CR-22). Status changes need a founder decision.';

insert into ops.restricted_jurisdictions (code, name, program, scope, status, decided_by, source_url, checked_on, note) values
  ('KP', 'North Korea', 'North Korea Sanctions Regulations, 31 CFR 510', 'country', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31', null),
  ('IR', 'Iran', 'Iranian Transactions and Sanctions Regulations, 31 CFR 560', 'country', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31',
   'General License D-2 may authorize free internet communications; open founder and counsel question'),
  ('CU', 'Cuba', 'Cuban Assets Control Regulations, 31 CFR 515', 'country', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31',
   '31 CFR 515.578 may authorize internet communications (not verified); open founder and counsel question'),
  ('UA-43', 'Crimea', 'Ukraine-/Russia-related, EO 13685', 'region', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31', 'Region level: web page only'),
  ('UA-40', 'Sevastopol', 'Ukraine-/Russia-related, EO 13685', 'region', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31', 'Region level: web page only'),
  ('UA-14', 'Donetsk (covered region)', 'Ukraine-/Russia-related, EO 14065', 'region', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31', 'Region level: web page only'),
  ('UA-09', 'Luhansk (covered region)', 'Ukraine-/Russia-related, EO 14065', 'region', 'block', 'CR-22 default',
   'https://ofac.treasury.gov/sanctions-programs-and-country-information', '2026-10-31', 'Region level: web page only')
on conflict (code) do nothing;

-- 2. IP to country -----------------------------------------------------------------------------------------
create table if not exists ops.geo_ip_ranges (
  ip_start inet primary key,
  ip_end inet not null,
  country text not null check (country ~ '^[A-Z]{2}$'),
  check (family(ip_start) = family(ip_end) and ip_start <= ip_end)
);
comment on table ops.geo_ip_ranges is
  'DB-IP IP to Country Lite (CC BY 4.0, attribution to DB-IP.com). Replaced whole by scripts/compliance/load-geo-ip.mjs.';

create table if not exists ops.geo_ip_meta (
  id boolean primary key default true check (id),
  source text not null,
  source_version text not null,
  row_count integer not null check (row_count >= 0),
  loaded_at timestamptz not null default now()
);

-- Host address of an inet (drops any mask), so comparisons with the stored range starts are exact.
create or replace function ops.country_of(p_ip inet)
returns text language sql stable security definer set search_path = pg_catalog, ops, pg_temp as $$
  select r.country
    from (select set_masklen(p_ip, case family(p_ip) when 4 then 32 else 128 end) as ip) q
    cross join lateral (
      select g.country, g.ip_end from ops.geo_ip_ranges g
       where g.ip_start <= q.ip and family(g.ip_start) = family(q.ip)
       order by g.ip_start desc limit 1) r
   where q.ip <= r.ip_end and r.country <> 'ZZ';
$$;
revoke all on function ops.country_of(inet) from public;

-- 3. Content-free counts -----------------------------------------------------------------------------------
create table if not exists ops.compliance_check_counts (
  day date not null,
  check_name text not null check (check_name in ('signup_region', 'web_contribution_region')),
  outcome text not null check (outcome in ('pass', 'block', 'geo_unknown', 'geo_stale', 'error')),
  jurisdiction text not null default '' check (
    (outcome = 'block' and jurisdiction ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$') or (outcome <> 'block' and jurisdiction = '')),
  n integer not null default 0 check (n >= 0),
  primary key (day, check_name, outcome, jurisdiction)
);
comment on table ops.compliance_check_counts is
  'Daily counts of compliance checks. No person id, no IP. Jurisdiction recorded for blocks only. Kept two years.';

create or replace function ops.bump_check(p_check text, p_outcome text, p_jurisdiction text default '')
returns void language sql security definer set search_path = pg_catalog, ops, pg_temp as $$
  insert into ops.compliance_check_counts (day, check_name, outcome, jurisdiction, n)
  values ((now() at time zone 'utc')::date, p_check, p_outcome,
          case when p_outcome = 'block' then coalesce(p_jurisdiction, '') else '' end, 1)
  on conflict (day, check_name, outcome, jurisdiction) do update set n = ops.compliance_check_counts.n + 1;
$$;
revoke all on function ops.bump_check(text, text, text) from public;

-- 4. Regulatory watch --------------------------------------------------------------------------------------
create table if not exists ops.regulatory_watch (
  id bigint generated always as identity primary key,
  source text not null check (source in ('federal_register', 'state_tracker', 'manual')),
  external_id text not null check (char_length(external_id) between 1 and 120),
  topic text not null check (topic ~ '^[a-z0-9-]{1,40}$'),
  title text not null check (char_length(title) between 1 and 500),
  url text not null check (url ~ '^https://'),
  published_on date,
  doc_type text check (char_length(doc_type) <= 40),
  seen_at timestamptz not null default now(),
  triage text not null default 'new' check (triage in ('new', 'relevant', 'not_relevant', 'actioned')),
  triage_note text check (char_length(triage_note) <= 500),
  triaged_at timestamptz,
  unique (source, external_id, topic)
);
comment on table ops.regulatory_watch is
  'Rule changes seen by the regulatory watch (owner: regulatory-affairs). Public documents only; no personal data.';

-- 4b. Access and classification for the ops tables (RLS on with no policies: reachable only through the
--     definer functions above and below; columns classified per docs/legal/DATA_CLASSIFICATION.md).
alter table ops.restricted_jurisdictions enable row level security;
alter table ops.geo_ip_ranges enable row level security;
alter table ops.geo_ip_meta enable row level security;
alter table ops.compliance_check_counts enable row level security;
alter table ops.regulatory_watch enable row level security;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on ops.restricted_jurisdictions, ops.geo_ip_ranges, ops.geo_ip_meta, '
                     'ops.compliance_check_counts, ops.regulatory_watch from %I', r);
    end if;
  end loop;
end $$;
comment on column ops.restricted_jurisdictions.code is 'L1 ISO 3166 country or subdivision code';
comment on column ops.restricted_jurisdictions.name is 'L1 place name';
comment on column ops.restricted_jurisdictions.program is 'L1 sanctions program';
comment on column ops.restricted_jurisdictions.scope is 'L1 country or region';
comment on column ops.restricted_jurisdictions.status is 'L2 block or allow';
comment on column ops.restricted_jurisdictions.decided_by is 'L2 decision or ruling id';
comment on column ops.restricted_jurisdictions.source_url is 'L1 source checked';
comment on column ops.restricted_jurisdictions.checked_on is 'L2 date the source was read';
comment on column ops.restricted_jurisdictions.note is 'L2 why, no personal data';
comment on column ops.restricted_jurisdictions.updated_at is 'L2 system timestamp';
comment on column ops.geo_ip_ranges.ip_start is 'L1 published range start (DB-IP Lite)';
comment on column ops.geo_ip_ranges.ip_end is 'L1 published range end (DB-IP Lite)';
comment on column ops.geo_ip_ranges.country is 'L1 country code (DB-IP Lite)';
comment on column ops.geo_ip_meta.id is 'L2 singleton key';
comment on column ops.geo_ip_meta.source is 'L2 data source name';
comment on column ops.geo_ip_meta.source_version is 'L2 data source version';
comment on column ops.geo_ip_meta.row_count is 'L2 count';
comment on column ops.geo_ip_meta.loaded_at is 'L2 system timestamp';
comment on column ops.compliance_check_counts.day is 'L2 UTC day';
comment on column ops.compliance_check_counts.check_name is 'L2 enum';
comment on column ops.compliance_check_counts.outcome is 'L2 enum';
comment on column ops.compliance_check_counts.jurisdiction is 'L2 code, blocks only';
comment on column ops.compliance_check_counts.n is 'L2 count';
comment on column ops.regulatory_watch.id is 'L2 row id';
comment on column ops.regulatory_watch.source is 'L2 enum';
comment on column ops.regulatory_watch.external_id is 'L1 public document number';
comment on column ops.regulatory_watch.topic is 'L2 watch topic id';
comment on column ops.regulatory_watch.title is 'L1 public document title';
comment on column ops.regulatory_watch.url is 'L1 public document link';
comment on column ops.regulatory_watch.published_on is 'L1 publication date';
comment on column ops.regulatory_watch.doc_type is 'L1 document type';
comment on column ops.regulatory_watch.seen_at is 'L2 system timestamp';
comment on column ops.regulatory_watch.triage is 'L2 enum';
comment on column ops.regulatory_watch.triage_note is 'L2 staff note, no personal data';
comment on column ops.regulatory_watch.triaged_at is 'L2 system timestamp';

-- 5. The auth hook -----------------------------------------------------------------------------------------
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_ip inet;
  v_meta ops.geo_ip_meta%rowtype;
  v_cc text;
begin
  begin
    v_ip := nullif(event -> 'metadata' ->> 'ip_address', '')::inet;
  exception when others then
    v_ip := null;
  end;
  select * into v_meta from ops.geo_ip_meta where id;
  if v_ip is null or not found then
    perform ops.bump_check('signup_region', 'geo_unknown');
    return '{}'::jsonb;
  end if;
  if v_meta.loaded_at < now() - interval '45 days' then
    perform ops.bump_check('signup_region', 'geo_stale');
  end if;
  v_cc := ops.country_of(v_ip);
  if v_cc is null then
    perform ops.bump_check('signup_region', 'geo_unknown');
    return '{}'::jsonb;
  end if;
  if exists (select 1 from ops.restricted_jurisdictions j
              where j.code = v_cc and j.scope = 'country' and j.status = 'block') then
    perform ops.bump_check('signup_region', 'block', v_cc);
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'signup_unavailable_region'));
  end if;
  perform ops.bump_check('signup_region', 'pass');
  return '{}'::jsonb;
exception when others then
  -- Fail open and count it (header). The error text is not logged: it could carry the IP.
  begin
    perform ops.bump_check('signup_region', 'error');
  exception when others then
    null;
  end;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on function public.hook_before_user_created(jsonb) from service_role;
  end if;
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema public to supabase_auth_admin;
    grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
  end if;
end $$;

-- 6. Service functions -------------------------------------------------------------------------------------
create or replace function public.ops_count_check(p_check text, p_outcome text, p_jurisdiction text default '')
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if p_check is distinct from 'web_contribution_region' then
    raise exception 'ops_count_check records web_contribution_region only' using errcode = '22023';
  end if;
  perform ops.bump_check(p_check, p_outcome, p_jurisdiction);
end;
$$;

create or replace function public.ops_regwatch_record(p_items jsonb)
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_n integer;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 500 then
    raise exception 'p_items must be an array of at most 500 items' using errcode = '22023';
  end if;
  with ins as (
    insert into ops.regulatory_watch (source, external_id, topic, title, url, published_on, doc_type)
    select i ->> 'source', i ->> 'external_id', i ->> 'topic', left(i ->> 'title', 500), i ->> 'url',
           nullif(i ->> 'published_on', '')::date, left(i ->> 'doc_type', 40)
      from jsonb_array_elements(p_items) i
    on conflict (source, external_id, topic) do nothing
    returning 1)
  select count(*) into v_n from ins;
  return v_n;
end;
$$;

create or replace function public.ops_regwatch_triage(p_id bigint, p_triage text, p_note text default null)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  update ops.regulatory_watch set triage = p_triage, triage_note = p_note, triaged_at = now() where id = p_id;
  if not found then
    raise exception 'no regulatory_watch row %', p_id using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.ops_compliance_report(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'checks', coalesce((select jsonb_agg(jsonb_build_object('check', check_name, 'outcome', outcome,
                          'jurisdiction', nullif(jurisdiction, ''), 'n', total) order by check_name, outcome, jurisdiction)
                        from (select check_name, outcome, jurisdiction, sum(n)::bigint total
                                from ops.compliance_check_counts where day between p_from and p_to
                               group by 1, 2, 3) c), '[]'::jsonb),
    'geo', (select jsonb_build_object('source', source, 'version', source_version, 'rows', row_count,
                     'loaded_at', loaded_at, 'stale', loaded_at < now() - interval '45 days')
              from ops.geo_ip_meta where id),
    'jurisdictions', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'scope', scope, 'status', status,
                                 'decided_by', decided_by, 'checked_on', checked_on) order by code)
                               from ops.restricted_jurisdictions), '[]'::jsonb),
    'regwatch', jsonb_build_object(
       'new', (select count(*) from ops.regulatory_watch where triage = 'new'),
       'relevant_open', (select count(*) from ops.regulatory_watch where triage = 'relevant'),
       'seen_in_range', (select count(*) from ops.regulatory_watch where seen_at::date between p_from and p_to)),
    'audit', coalesce((select jsonb_object_agg(action, n) from (select action, count(*) n from public.audit_events
                        where at::date between p_from and p_to group by action) a), '{}'::jsonb),
    'legal_holds_active', (select count(*) from public.legal_holds where released_at is null));
$$;

create or replace function public.ops_compliance_retention(p_now timestamptz default now())
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_n integer;
begin
  delete from ops.compliance_check_counts where day < (p_now - interval '2 years')::date;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.ops_count_check(text, text, text), public.ops_regwatch_record(jsonb),
  public.ops_regwatch_triage(bigint, text, text), public.ops_compliance_report(date, date),
  public.ops_compliance_retention(timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ops_count_check(text, text, text), public.ops_regwatch_record(jsonb),
      public.ops_regwatch_triage(bigint, text, text), public.ops_compliance_report(date, date),
      public.ops_compliance_retention(timestamptz) to service_role;
  end if;
end $$;
