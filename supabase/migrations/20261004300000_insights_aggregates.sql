-- Server aggregates for product insights (founder decision 12, 3 Oct 2026;
-- PRD-REQ-017; docs/analytics/TRACKING_PLAN.md section 4; INSIGHTS_LOOP.md).
--
-- Counts only. No row of any published view carries an id, a name, a date of
-- a person or child, or any text a person wrote. Every published count is 0
-- or at least 10 (k-anonymity, k = 10): smaller cells are null, and where a
-- view publishes a part and its total, the part is published only when the
-- remainder is also 0 or at least 10, so no small group can be recovered by
-- subtraction. Language rows below 10 are merged into 'other'.
--
-- Where it lives: schema `insights` (not exposed by the Data API). Readers:
-- `service_role` and `insights_reader` (no login; reached through PostgREST
-- with a JWT whose `role` claim is insights_reader, or by a login role that
-- is granted it). Both reach the data only through the published views and
-- `public.insights_aggregates(p_weeks)`. Underscore objects are internal and
-- granted to no one.
--
-- Definitions (TRACKING_PLAN 1.1 and 4):
--   week     ISO week start (Monday, UTC) of least(captured_at, created_at),
--            so a wrong phone clock can never date a letter in the future.
--   letter   an entries row that is not deleted and not "Not much today",
--            in a live book, whatever its destination (book or private).
--   family   the books that share a parent: the smallest parent profile id
--            reachable through shared parenthood (internal key, never output).

create schema if not exists insights;
revoke all on schema insights from public;
comment on schema insights is 'L2 counts for product insights; k-anonymised views only (DATA_CLASSIFICATION 4.9)';

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'insights_reader') then
    create role insights_reader nologin;
  end if;
  -- On Supabase, PostgREST's login role must be able to switch to it.
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    grant insights_reader to authenticator;
  end if;
end
$$;

grant usage on schema insights to insights_reader, service_role;
grant usage on schema public to insights_reader;

-- ─── k-anonymity helpers ────────────────────────────────────────────────
create or replace function insights.k_min() returns int
language sql immutable set search_path = pg_catalog as $$ select 10 $$;

-- A count as published: itself when 0 or at least k, else null.
create or replace function insights.k(n bigint) returns bigint
language sql immutable set search_path = pg_catalog as $$
  select case when n = 0 or n >= insights.k_min() then n end
$$;

-- A part of a published total: published only when the part, the remainder
-- and the total are all publishable, so subtraction cannot reveal 1 to 9.
create or replace function insights.k_part(part bigint, total bigint) returns bigint
language sql immutable set search_path = pg_catalog as $$
  select case when insights.k(part) is not null and insights.k(total - part) is not null and insights.k(total) is not null
              then part end
$$;

-- ─── Internal building blocks (never granted) ───────────────────────────
-- Parent-to-parent reachability through shared books, then one family key per book.
create or replace view insights._book_family as
with recursive edges as (
  select distinct a.profile_id as src, b.profile_id as dst
    from public.child_members a
    join public.child_members b on b.child_id = a.child_id
   where a.role = 'parent' and b.role = 'parent'
), reach(src, dst) as (
  select src, dst from edges
  union
  select r.src, e.dst from reach r join edges e on e.src = r.dst
), comp as (
  select src as profile_id, min(dst::text) as family_key from reach group by src
)
select m.child_id, min(c.family_key) as family_key
  from public.child_members m
  join comp c on c.profile_id = m.profile_id
 where m.role = 'parent'
 group by m.child_id;

create or replace view insights._letters as
select e.id as entry_id,
       e.author_id,
       e.child_id,
       coalesce(bf.family_key, e.child_id::text) as family_key,
       e.capture_mode,
       e.in_book,
       least(e.captured_at, e.created_at) as at,
       date_trunc('week', least(e.captured_at, e.created_at) at time zone 'UTC')::date as week
  from public.entries e
  join public.children c on c.id = e.child_id and c.deleted_at is null
  left join insights._book_family bf on bf.child_id = e.child_id
 where e.deleted_at is null and e.kind <> 'not_much';

-- ─── 1. Weekly keeping families (north star, TRACKING_PLAN 1.1) ─────────
create or replace view insights.weekly_keeping_families with (security_barrier = true) as
select week,
       week + 7 <= (now() at time zone 'UTC')::date as complete,
       insights.k(count(distinct family_key)) as families,
       insights.k_part(count(distinct family_key) filter (where in_book), count(distinct family_key)) as families_with_book_letter,
       insights.k(count(*)) as letters,
       insights.k_part(count(*) filter (where capture_mode = 'spoken'), count(*)) as spoken_letters,
       insights.k_part(count(*) filter (where capture_mode <> 'spoken'), count(*)) as typed_letters
  from insights._letters
 group by week;

-- ─── 2. Letters per active family ───────────────────────────────────────
create or replace view insights.letters_per_active_family with (security_barrier = true) as
with per as (
  select week, family_key, count(*) as n, count(distinct author_id) as voices
    from insights._letters group by week, family_key
)
select week,
       week + 7 <= (now() at time zone 'UTC')::date as complete,
       insights.k(count(*)) as active_families,
       case when count(*) >= insights.k_min() then round(sum(n)::numeric / count(*), 2) end as letters_per_family_mean,
       case when count(*) >= insights.k_min() then round((percentile_cont(0.5) within group (order by n))::numeric, 1) end as letters_per_family_p50,
       case when count(*) >= insights.k_min() then round((percentile_cont(0.9) within group (order by n))::numeric, 1) end as letters_per_family_p90,
       insights.k_part(count(*) filter (where voices >= 2), count(*)) as families_two_plus_voices
  from per
 group by week;

-- ─── 3. First-letter conversion (accounts by sign-up week) ──────────────
create or replace view insights.first_letter_conversion with (security_barrier = true) as
with firsts as (
  select author_id, min(at) as first_at from insights._letters group by author_id
), accounts as (
  select p.id, p.created_at, date_trunc('week', p.created_at at time zone 'UTC')::date as cohort_week
    from public.profiles p
)
select a.cohort_week,
       a.cohort_week + 14 <= (now() at time zone 'UTC')::date as d7_matured,
       a.cohort_week + 37 <= (now() at time zone 'UTC')::date as d30_matured,
       insights.k(count(*)) as new_accounts,
       insights.k_part(count(*) filter (where f.first_at <= a.created_at + interval '1 day'), count(*)) as first_letter_d1,
       insights.k_part(count(*) filter (where f.first_at <= a.created_at + interval '7 days'), count(*)) as first_letter_d7,
       insights.k_part(count(*) filter (where f.first_at <= a.created_at + interval '30 days'), count(*)) as first_letter_d30
  from accounts a
  left join firsts f on f.author_id = a.id
 group by a.cohort_week;

-- ─── 4. Family invites sent and accepted (co-parent = role parent) ──────
create or replace view insights.family_invites with (security_barrier = true) as
select date_trunc('week', i.created_at at time zone 'UTC')::date as week,
       case i.role when 'parent' then 'co_parent' else 'contributor' end as role,
       insights.k(count(*)) as sent,
       insights.k_part(count(*) filter (where i.accepted_at is not null), count(*)) as accepted,
       insights.k_part(count(*) filter (where i.accepted_at is not null and i.accepted_at <= i.created_at + interval '7 days'), count(*)) as accepted_within_7d
  from public.child_invites i
 group by 1, 2;

-- ─── 5. Writer retention by first-letter week ───────────────────────────
-- Offsets 0 to 12 and 26, completed weeks only.
create or replace view insights.retention_cohorts with (security_barrier = true) as
with firsts as (
  select author_id, min(week) as cohort_week from insights._letters group by author_id
), sizes as (
  select cohort_week, count(*) as n from firsts group by cohort_week
), activity as (
  select distinct author_id, week from insights._letters
), act as (
  select f.cohort_week, (a.week - f.cohort_week) / 7 as week_offset, count(*) as n
    from firsts f join activity a on a.author_id = f.author_id
   group by 1, 2
), grid as (
  select s.cohort_week, o.week_offset, s.n
    from sizes s
   cross join (select generate_series(0, 26) as week_offset) o
   where (o.week_offset <= 12 or o.week_offset = 26)
     and s.cohort_week + (o.week_offset + 1) * 7 <= (now() at time zone 'UTC')::date
)
select g.cohort_week,
       g.week_offset,
       insights.k(g.n) as cohort_writers,
       insights.k_part(coalesce(a.n, 0), g.n) as active_writers
  from grid g
  left join act a on a.cohort_week = g.cohort_week and a.week_offset = g.week_offset;

-- ─── 6. Language mix (families by spoken-letter language per week) ──────
-- No server column holds a letter's language today. When one lands it must
-- be `public.entries.language` (ISO 639-1, L4 in DATA_CLASSIFICATION) and
-- this view starts reporting without a new migration. Codes outside the
-- seven v1.0 languages are counted as 'other'.
create or replace function insights.language_mix_available() returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'entries' and column_name = 'language')
$$;

create or replace function insights._language_counts()
returns table (week date, lang text, n bigint)
language plpgsql stable security definer set search_path = insights, public, pg_catalog as $$
begin
  if not insights.language_mix_available() then
    return;
  end if;
  return query execute $q$
    select l.week,
           case when lower(e.language::text) in ('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt') then lower(e.language::text) else 'other' end,
           count(distinct l.family_key)
      from insights._letters l
      join public.entries e on e.id = l.entry_id
     where e.language is not null
     group by 1, 2
  $q$;
end
$$;

-- Ascending by size: every row below k joins 'other', and 'other' keeps
-- absorbing the next smallest row until it reaches k; a week whose whole
-- total is below k is not published. A security definer function, because
-- the raw counts it reads are granted to no one.
create or replace function insights.language_mix_rows()
returns table (week date, lang text, families bigint)
language sql stable security definer set search_path = insights, pg_catalog as $$
  with raw as (
    select c.week, c.lang, sum(c.n)::bigint as n from insights._language_counts() c group by c.week, c.lang
  ), ranked as (
    select r.week, r.lang, r.n,
           row_number() over w as rn,
           sum(r.n) over (w rows between unbounded preceding and current row) as cs,
           count(*) filter (where r.n < insights.k_min()) over (partition by r.week) as small,
           sum(r.n) over (partition by r.week) as total
      from raw r
    window w as (partition by r.week order by r.n, r.lang)
  ), cut as (
    select ranked.*,
           case when small = 0 then 0
                else min(rn) filter (where rn >= small and cs >= insights.k_min()) over (partition by ranked.week) end as m
      from ranked
  )
  select cut.week,
         case when cut.rn <= cut.m then 'other' else cut.lang end,
         sum(cut.n)::bigint
    from cut
   where cut.total >= insights.k_min() and cut.m is not null
   group by cut.week, case when cut.rn <= cut.m then 'other' else cut.lang end
$$;

create or replace view insights.language_mix with (security_barrier = true) as
select week, lang, families from insights.language_mix_rows();

-- ─── Read path ─────────────────────────────────────────────────────────
create or replace function public.insights_aggregates(p_weeks int default 26)
returns jsonb
language sql stable security definer set search_path = insights, public, pg_catalog as $$
  with since as (
    select (date_trunc('week', now() at time zone 'UTC') - make_interval(weeks => least(greatest(coalesce(p_weeks, 26), 1), 104)))::date as d
  )
  select jsonb_build_object(
    'schema', 1,
    'generated_at', date_trunc('minute', now()),
    'k_min', insights.k_min(),
    'since', (select d from since),
    'weekly_keeping_families', coalesce((select jsonb_agg(to_jsonb(v) order by v.week) from insights.weekly_keeping_families v, since where v.week >= since.d), '[]'::jsonb),
    'letters_per_active_family', coalesce((select jsonb_agg(to_jsonb(v) order by v.week) from insights.letters_per_active_family v, since where v.week >= since.d), '[]'::jsonb),
    'first_letter_conversion', coalesce((select jsonb_agg(to_jsonb(v) order by v.cohort_week) from insights.first_letter_conversion v, since where v.cohort_week >= since.d), '[]'::jsonb),
    'family_invites', coalesce((select jsonb_agg(to_jsonb(v) order by v.week, v.role) from insights.family_invites v, since where v.week >= since.d), '[]'::jsonb),
    'retention_cohorts', coalesce((select jsonb_agg(to_jsonb(v) order by v.cohort_week, v.week_offset) from insights.retention_cohorts v, since where v.cohort_week >= since.d), '[]'::jsonb),
    'language_mix', jsonb_build_object(
      'available', insights.language_mix_available(),
      'rows', coalesce((select jsonb_agg(to_jsonb(v) order by v.week, v.lang) from insights.language_mix v, since where v.week >= since.d), '[]'::jsonb)
    )
  )
$$;

-- ─── Grants ─────────────────────────────────────────────────────────────
revoke all on all tables in schema insights from public, anon, authenticated;
revoke all on all functions in schema insights from public, anon, authenticated;
revoke all on function public.insights_aggregates(int) from public, anon, authenticated;
grant execute on function public.insights_aggregates(int) to service_role, insights_reader;
grant select on insights.weekly_keeping_families, insights.letters_per_active_family, insights.first_letter_conversion,
                insights.family_invites, insights.retention_cohorts, insights.language_mix
   to service_role, insights_reader;
-- The views run with their owner's rights; readers need the helpers they call.
grant execute on function insights.k_min(), insights.k(bigint), insights.k_part(bigint, bigint), insights.language_mix_available(),
                          insights.language_mix_rows()
   to service_role, insights_reader;

-- ─── Classification (DATA_CLASSIFICATION 4.9): every output column is L2 ─
comment on column insights.weekly_keeping_families.week is 'L2 week start (UTC)';
comment on column insights.weekly_keeping_families.complete is 'L2 flag: week has ended';
comment on column insights.weekly_keeping_families.families is 'L2 count, k-anonymised';
comment on column insights.weekly_keeping_families.families_with_book_letter is 'L2 count, k-anonymised with remainder';
comment on column insights.weekly_keeping_families.letters is 'L2 count, k-anonymised';
comment on column insights.weekly_keeping_families.spoken_letters is 'L2 count, k-anonymised with remainder';
comment on column insights.weekly_keeping_families.typed_letters is 'L2 count, k-anonymised with remainder';
comment on column insights.letters_per_active_family.week is 'L2 week start (UTC)';
comment on column insights.letters_per_active_family.complete is 'L2 flag: week has ended';
comment on column insights.letters_per_active_family.active_families is 'L2 count, k-anonymised';
comment on column insights.letters_per_active_family.letters_per_family_mean is 'L2 statistic over at least k families';
comment on column insights.letters_per_active_family.letters_per_family_p50 is 'L2 statistic over at least k families';
comment on column insights.letters_per_active_family.letters_per_family_p90 is 'L2 statistic over at least k families';
comment on column insights.letters_per_active_family.families_two_plus_voices is 'L2 count, k-anonymised with remainder';
comment on column insights.first_letter_conversion.cohort_week is 'L2 sign-up week start (UTC)';
comment on column insights.first_letter_conversion.d7_matured is 'L2 flag';
comment on column insights.first_letter_conversion.d30_matured is 'L2 flag';
comment on column insights.first_letter_conversion.new_accounts is 'L2 count, k-anonymised';
comment on column insights.first_letter_conversion.first_letter_d1 is 'L2 count, k-anonymised with remainder';
comment on column insights.first_letter_conversion.first_letter_d7 is 'L2 count, k-anonymised with remainder';
comment on column insights.first_letter_conversion.first_letter_d30 is 'L2 count, k-anonymised with remainder';
comment on column insights.family_invites.week is 'L2 week start (UTC)';
comment on column insights.family_invites.role is 'L2 enum (co_parent, contributor)';
comment on column insights.family_invites.sent is 'L2 count, k-anonymised';
comment on column insights.family_invites.accepted is 'L2 count, k-anonymised with remainder';
comment on column insights.family_invites.accepted_within_7d is 'L2 count, k-anonymised with remainder';
comment on column insights.retention_cohorts.cohort_week is 'L2 first-letter week start (UTC)';
comment on column insights.retention_cohorts.week_offset is 'L2 weeks since cohort week';
comment on column insights.retention_cohorts.cohort_writers is 'L2 count, k-anonymised';
comment on column insights.retention_cohorts.active_writers is 'L2 count, k-anonymised with remainder';
comment on column insights.language_mix.week is 'L2 week start (UTC)';
comment on column insights.language_mix.lang is 'L2 one of the seven v1.0 codes or other (reviewed reduction of L4 languages, DATA_CLASSIFICATION 4.9)';
comment on column insights.language_mix.families is 'L2 count, at least k (small languages merged into other)';
