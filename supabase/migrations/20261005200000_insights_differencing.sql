-- Insights: k-anonymity that survives subtraction (fix wave G-20; security
-- review L12). PENDING: not yet applied. Apply after 20261005100000.
--
-- The problem. 20261004300000 suppresses every count below k = 10 and checks
-- each part against its own total. Two counts of nested groups were still
-- published side by side, so their difference could be 1 to 9:
--   first_letter_conversion  d1 <= d7 <= d30 <= new_accounts
--                            (d7 - d1 = accounts whose first letter came on days 2 to 7)
--   family_invites           accepted_within_7d <= accepted <= sent
--                            (accepted - accepted_within_7d = late accepts)
--   language_mix             rows count families per language (a family can be in
--                            several rows), next to weekly_keeping_families.families:
--                            families - sum(rows) can bound the families with no
--                            language recorded, and sum(rows) - families the
--                            families writing in two languages.
--
-- The rule from here on (insights views only):
--   Within one population, every count that is published is 0 or at least k,
--   and so is every difference between two published counts of nested groups.
--
-- How:
--   1. insights.k_chain(parts, total): consistent suppression for a nested
--      chain. Walking the chain from the smallest group, a part is published
--      only when the step from the previous published part and the step to
--      the total are both 0 or at least k. Any difference of two published
--      values is then a sum of such steps, so it is 0 or at least k.
--      A suppressed part makes the next step larger, never smaller.
--   2. first_letter_conversion and family_invites publish their chains through it.
--   3. language_mix (complementary suppression): a week's rows are published
--      only when (a) the families with no language-tagged letter, and (b) the
--      extra memberships from families tagged in more than one language, are
--      each 0 or at least k. Neither quantity is published; with both bounded,
--      no subtraction against weekly_keeping_families isolates fewer than k
--      families. The k merge into 'other' is unchanged.
--
-- Unchanged and already safe, kept as they are: part/total pairs (book letters,
-- spoken and typed letters, two voices, retention cells), and the statistics
-- that need at least k families. weekly_keeping_families.families and
-- letters_per_active_family.active_families count the same population, so they
-- are equal.
--
-- Not covered (residual, documented in docs/analytics/INSIGHTS_LOOP.md request):
-- comparing the same cell on two different days. A family deleting its letters
-- changes a past week's count by 1. Readers are the service role and the
-- insights_reader role only; freezing completed weeks is a v1.1 item.
--
-- Same columns, names, types and grants: create or replace view keeps the
-- grants and column comments. insights_aggregates() needs no change.

-- ─── 1. Consistent suppression for nested chains ─────────────────────────
-- parts: counts of nested groups, smallest group first (each part is a subset
-- of the next). Returns the same array with unpublishable parts as null.
create or replace function insights.k_chain(parts bigint[], total bigint)
returns bigint[] language plpgsql immutable set search_path = pg_catalog as $$
declare
  k constant int := insights.k_min();
  last bigint := 0;
  out bigint[] := '{}';
  p bigint;
  ok boolean;
begin
  if total is null or insights.k(total) is null then
    return array_fill(null::bigint, array[coalesce(array_length(parts, 1), 0)]);
  end if;
  foreach p in array coalesce(parts, '{}'::bigint[]) loop
    ok := p is not null and p >= last and p <= total
          and (p - last = 0 or p - last >= k)
          and (total - p = 0 or total - p >= k);
    if ok then
      out := out || p;
      last := p;
    else
      out := out || null::bigint;
    end if;
  end loop;
  return out;
end;
$$;

-- ─── 2. First-letter conversion: d1 <= d7 <= d30 <= new accounts ─────────
create or replace view insights.first_letter_conversion with (security_barrier = true) as
with firsts as (
  select author_id, min(at) as first_at from insights._letters group by author_id
), accounts as (
  select p.id, p.created_at, date_trunc('week', p.created_at at time zone 'UTC')::date as cohort_week
    from public.profiles p
), raw as (
  select a.cohort_week,
         count(*) as n,
         count(*) filter (where f.first_at <= a.created_at + interval '1 day') as d1,
         count(*) filter (where f.first_at <= a.created_at + interval '7 days') as d7,
         count(*) filter (where f.first_at <= a.created_at + interval '30 days') as d30
    from accounts a
    left join firsts f on f.author_id = a.id
   group by a.cohort_week
), chained as (
  select raw.*, insights.k_chain(array[d1, d7, d30], n) as c from raw
)
select cohort_week,
       cohort_week + 14 <= (now() at time zone 'UTC')::date as d7_matured,
       cohort_week + 37 <= (now() at time zone 'UTC')::date as d30_matured,
       insights.k(n) as new_accounts,
       c[1] as first_letter_d1,
       c[2] as first_letter_d7,
       c[3] as first_letter_d30
  from chained;

-- ─── 3. Family invites: accepted within 7 days <= accepted <= sent ───────
create or replace view insights.family_invites with (security_barrier = true) as
with raw as (
  select date_trunc('week', i.created_at at time zone 'UTC')::date as week,
         case i.role when 'parent' then 'co_parent' else 'contributor' end as role,
         count(*) as sent,
         count(*) filter (where i.accepted_at is not null) as accepted,
         count(*) filter (where i.accepted_at is not null and i.accepted_at <= i.created_at + interval '7 days') as within_7d
    from public.child_invites i
   group by 1, 2
), chained as (
  select raw.*, insights.k_chain(array[within_7d, accepted], sent) as c from raw
)
select week,
       role,
       insights.k(sent) as sent,
       c[2] as accepted,
       c[1] as accepted_within_7d
  from chained;

-- ─── 4. Language mix: complementary suppression against the week's families ─
create or replace function insights.language_mix_rows()
returns table (week date, lang text, families bigint)
language sql stable security definer set search_path = insights, pg_catalog as $$
  with raw as (
    select c.week, c.lang, sum(c.n)::bigint as n from insights._language_counts() c group by c.week, c.lang
  ), fam as (
    -- Per week: all families (as weekly_keeping_families counts them) and the
    -- families with at least one language-tagged letter.
    select l.week,
           count(distinct l.family_key) as families,
           count(distinct l.family_key) filter (where e.language is not null) as tagged
      from insights._letters l
      join public.entries e on e.id = l.entry_id
     group by l.week
  ), safe as (
    -- Untagged families and extra memberships (sum of rows minus tagged families), each 0 or at least k.
    select f.week
      from fam f
      join (select r.week, sum(r.n) as memberships from raw r group by r.week) m on m.week = f.week
     where (f.families - f.tagged = 0 or f.families - f.tagged >= insights.k_min())
       and (m.memberships - f.tagged = 0 or m.memberships - f.tagged >= insights.k_min())
  ), ranked as (
    -- Unchanged from 20261004300000: ascending by size, rows below k join 'other'
    -- until it reaches k; a week whose whole total is below k is not published.
    select r.week, r.lang, r.n,
           row_number() over w as rn,
           sum(r.n) over (w rows between unbounded preceding and current row) as cs,
           count(*) filter (where r.n < insights.k_min()) over (partition by r.week) as small,
           sum(r.n) over (partition by r.week) as total
      from raw r
      join safe s on s.week = r.week
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

-- ─── 5. Grants ──────────────────────────────────────────────────────────
-- The views run with their owner's rights; readers need the helpers they call
-- (as in 20261004300000). language_mix_rows() keeps its grants on replace.
revoke all on function insights.k_chain(bigint[], bigint) from public, anon, authenticated;
grant execute on function insights.k_chain(bigint[], bigint) to service_role, insights_reader;
comment on function insights.k_chain(bigint[], bigint) is
  'k-anonymity for nested counts (G-20): publishes a part only when every step between published values is 0 or at least k';
