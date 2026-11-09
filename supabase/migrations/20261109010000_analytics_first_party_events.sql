-- First-party analytics events (docs/analytics/FREE-ANALYTICS-PLAN-2026-11-08.md). DRAFT.
--
-- PENDING: not applied. Needs the founder's approve-migration (D-041). Additive only: one table, three
-- views, three service-only functions, one role grant. It changes no existing object and no row.
-- Nothing writes here until a build with EXPO_PUBLIC_ANALYTICS=on and a person's yes exists; D-095 and
-- D-124 keep that switch off for the 1.0 line, so applying this file collects nothing.
--
-- What a row is: one allowlisted event from a phone whose owner said yes. The row carries the event name,
-- the catalogue's content-free properties (enums, booleans, bounded integers, strings of at most 40
-- characters), a random analytics id, and two times. It never carries an account id, a child, a name, any
-- text a person wrote, an IP address or a device id. The analytics id is not the Supabase user id and the
-- ingest function never reads the Authorization header, so nothing here joins to a person (L2,
-- DATA_CLASSIFICATION 4.7).
--
-- Where: schema `insights_events` (not exposed by the Data API). Who can read it: service_role (the founder's SQL editor and the insights job) can read the table.
-- insights_reader reads only the three k-anonymised views (k = 10, insights.k). Nobody else has a grant.
--
-- The checks below are the second wall. The ingest function re-runs the catalogue allowlist
-- (packages/analytics sanitizeEvent) before it calls the function; the table refuses anything shaped
-- wrongly even if that wall were removed.

-- Its own schema, so the six published views of schema `insights` keep their own test (insights_aggregates).
create schema if not exists insights_events;
revoke all on schema insights_events from public;
comment on schema insights_events is 'L2 allowlisted analytics events from opted-in phones; k-anonymised views only';
grant usage on schema insights_events to insights_reader, service_role;
-- The k-anonymity helper lives in schema insights.
grant usage on schema insights to insights_reader, service_role;

-- A properties object is acceptable when it is small, flat and holds only numbers, booleans and short strings.
create or replace function insights_events.props_ok(p jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select jsonb_typeof(p) = 'object'
     and pg_column_size(p) <= 1024
     and not exists (
       select 1 from jsonb_each(p) e
        where jsonb_typeof(e.value) not in ('number', 'boolean', 'string')
           or (jsonb_typeof(e.value) = 'string' and char_length(e.value #>> '{}') > 40)
           or char_length(e.key) > 40
     )
$$;

create table if not exists insights_events.app_events (
  id           bigint generated always as identity primary key,
  received_at  timestamptz not null default now(),
  occurred_at  timestamptz not null,
  analytics_id uuid not null,
  event        text not null check (event ~ '^[a-z][a-z0-9_]{0,47}$'),
  props        jsonb not null default '{}'::jsonb check (insights_events.props_ok(props)),
  check (occurred_at <= received_at + interval '1 minute' and occurred_at >= received_at - interval '14 days')
);
alter table insights_events.app_events enable row level security;
create index if not exists app_events_received_idx on insights_events.app_events (received_at);
create index if not exists app_events_id_idx on insights_events.app_events (analytics_id, received_at);

comment on table insights_events.app_events is 'L2 allowlisted analytics events from opted-in phones; random analytics id; no content, no account id';
comment on column insights_events.app_events.id is 'L2 internal row number';
comment on column insights_events.app_events.received_at is 'L2 system timestamp, set by the server';
comment on column insights_events.app_events.occurred_at is 'L2 received_at minus the age the phone reported; at most 14 days old';
comment on column insights_events.app_events.analytics_id is 'L2 random per-consent-period id; not the account id; deleted with analytics-forget or after 365 days';
comment on column insights_events.app_events.event is 'L2 event name from the typed catalogue (packages/analytics)';
comment on column insights_events.app_events.props is 'L2 catalogue properties only: enums, booleans, bounded integers, strings up to 40 characters';

-- ─── Ingest: called only by the analytics-ingest Edge Function ───────────
-- p_events: [{"event": text, "props": object, "ago_s": int}], at most 50. Returns the rows kept, or -1 when
-- this id is over its daily cap (5000 events), so a leaked endpoint cannot be used to fill the table.
create or replace function public.ingest_app_events(p_id uuid, p_events jsonb)
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if p_id is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) not between 1 and 50 then
    return 0;
  end if;
  if (select count(*) from insights_events.app_events where analytics_id = p_id and received_at > now() - interval '1 day') >= 5000 then
    return -1;
  end if;
  insert into insights_events.app_events (analytics_id, occurred_at, event, props)
  select p_id,
         now() - make_interval(secs => least(greatest(coalesce((e ->> 'ago_s')::int, 0), 0), 1209600)),
         e ->> 'event',
         coalesce(e -> 'props', '{}'::jsonb)
    from jsonb_array_elements(p_events) e
   where jsonb_typeof(e) = 'object';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Erasure for analytics-forget and for a person who turns analytics off and asks for deletion.
create or replace function public.forget_app_events(p_ids uuid[])
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  delete from insights_events.app_events where analytics_id = any (p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Retention: 365 days. Called by a scheduled job (not wired here; the plan names the owner).
create or replace function public.purge_app_events(p_now timestamptz default now())
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  delete from insights_events.app_events where received_at < p_now - interval '365 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ─── Read-only views, k-anonymised (k = 10, the same rule as 20261004300000) ──
-- installs = distinct analytics ids. A cell is published only when it is 0 or at least 10.
create or replace view insights_events.app_event_daily as
  select (occurred_at at time zone 'UTC')::date as day,
         event,
         insights.k(count(*))                    as events,
         insights.k(count(distinct analytics_id)) as installs
    from insights_events.app_events
   group by 1, 2;

-- One row per event, property and value (enums and small integers). Strings are at most 40 characters.
create or replace view insights_events.app_event_breakdown as
  select (a.occurred_at at time zone 'UTC')::date as day,
         a.event,
         p.key  as prop,
         p.value #>> '{}' as value,
         insights.k(count(*))                     as events,
         insights.k(count(distinct a.analytics_id)) as installs
    from insights_events.app_events a
   cross join lateral jsonb_each(a.props) p
   where p.key not in ('schema_version', 'sample_pct')
   group by 1, 2, 3, 4;

-- Weekly active installs, from app_opened.
create or replace view insights_events.app_active_weekly as
  select date_trunc('week', occurred_at at time zone 'UTC')::date as week,
         insights.k(count(distinct analytics_id)) as installs
    from insights_events.app_events
   where event = 'app_opened'
   group by 1;

-- ─── Grants (all explicit; default privileges are reset, 20261023060000) ──
revoke all on insights_events.app_events from public, anon, authenticated;
revoke all on function insights_events.props_ok(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_app_events(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.forget_app_events(uuid[]) from public, anon, authenticated;
revoke all on function public.purge_app_events(timestamptz) from public, anon, authenticated;
grant select, insert, delete on insights_events.app_events to service_role;
grant usage on all sequences in schema insights_events to service_role;
grant execute on function public.ingest_app_events(uuid, jsonb), public.forget_app_events(uuid[]),
  public.purge_app_events(timestamptz) to service_role;
revoke all on insights_events.app_event_daily, insights_events.app_event_breakdown, insights_events.app_active_weekly from public, anon, authenticated;
grant select on insights_events.app_event_daily, insights_events.app_event_breakdown, insights_events.app_active_weekly to insights_reader, service_role;

comment on column insights_events.app_event_daily.day is 'L2 day (UTC)';
comment on column insights_events.app_event_daily.event is 'L2 event name';
comment on column insights_events.app_event_daily.events is 'L2 count, k-anonymised';
comment on column insights_events.app_event_daily.installs is 'L2 count, k-anonymised';
comment on column insights_events.app_event_breakdown.day is 'L2 day (UTC)';
comment on column insights_events.app_event_breakdown.event is 'L2 event name';
comment on column insights_events.app_event_breakdown.prop is 'L2 catalogue property name';
comment on column insights_events.app_event_breakdown.value is 'L2 catalogue value: enum, boolean or bounded integer';
comment on column insights_events.app_event_breakdown.events is 'L2 count, k-anonymised';
comment on column insights_events.app_event_breakdown.installs is 'L2 count, k-anonymised';
comment on column insights_events.app_active_weekly.week is 'L2 week start (UTC)';
comment on column insights_events.app_active_weekly.installs is 'L2 count, k-anonymised';
