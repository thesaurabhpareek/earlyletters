-- First-letter increments through k (BL-326, security review L12, analytics).
--
-- Why: first_letter_d1, d7 and d30 are each published through k_part against
-- the sign-up total, but they are nested counts. d7 - d1 (and d30 - d7, and
-- d30 - d1) can be 1 to 9 while every published number is 0 or at least 10,
-- so a reader could recover a small group by subtraction. Counts of accounts
-- only, no identities; this closes the gap.
--
-- Rule (every pair of published nested counts differs by 0 or at least k):
--   d1   unchanged: k_part against new_accounts.
--   d7   null when d1 is published and d7 - d1 is 1 to 9.
--   d30  null when d1 is published and d30 - d1 is 1 to 9, or when d7 is
--        published and d30 - d7 is 1 to 9.
--   first_letter_d2_7   (new) d7 - d1, only when both d7 and d1 are published.
--   first_letter_d8_30  (new) d30 - d7, only when both d30 and d7 are published.
-- A suppressed count stays suppressed in the increments too, so the increment
-- columns never add a number that subtraction could not already reach.
--
-- Known residual, not closed here: successive daily snapshots of an unmatured
-- cohort can still reveal a 1 to 9 change, and a null d7 beside a published d1
-- signals that their gap is 1 to 9.
--
-- Only the view body changes (create or replace, two columns appended, same
-- security_barrier option). No new table, view, sequence or function, so no
-- new grant is needed: the existing select on the view and execute on the
-- insights helpers cover it. insights_aggregates() reads the view through
-- to_jsonb, so the new columns flow into the JSON with no function change.
create or replace view insights.first_letter_conversion with (security_barrier = true) as
with firsts as (
  select author_id, min(at) as first_at from insights._letters group by author_id
), accounts as (
  select p.id, p.created_at, date_trunc('week', p.created_at at time zone 'UTC')::date as cohort_week
    from public.profiles p
), raw as (
  select a.cohort_week,
         a.cohort_week + 14 <= (now() at time zone 'UTC')::date as d7_matured,
         a.cohort_week + 37 <= (now() at time zone 'UTC')::date as d30_matured,
         count(*) as n,
         count(*) filter (where f.first_at <= a.created_at + interval '1 day') as c1,
         count(*) filter (where f.first_at <= a.created_at + interval '7 days') as c7,
         count(*) filter (where f.first_at <= a.created_at + interval '30 days') as c30
    from accounts a
    left join firsts f on f.author_id = a.id
   group by a.cohort_week
), p1 as (
  select raw.*, insights.k_part(c1, n) as v1 from raw
), p7 as (
  select p1.*,
         case when insights.k_part(c7, n) is not null
                and (v1 is null or insights.k(c7 - c1) is not null)
              then c7 end as v7
    from p1
), p30 as (
  select p7.*,
         case when insights.k_part(c30, n) is not null
                and (v1 is null or insights.k(c30 - c1) is not null)
                and (v7 is null or insights.k(c30 - c7) is not null)
              then c30 end as v30
    from p7
)
select cohort_week,
       d7_matured,
       d30_matured,
       insights.k(n) as new_accounts,
       v1 as first_letter_d1,
       v7 as first_letter_d7,
       v30 as first_letter_d30,
       case when v1 is not null and v7 is not null then v7 - v1 end as first_letter_d2_7,
       case when v7 is not null and v30 is not null then v30 - v7 end as first_letter_d8_30
  from p30;

comment on column insights.first_letter_conversion.first_letter_d1 is 'L2 count, k-anonymised with remainder';
comment on column insights.first_letter_conversion.first_letter_d7 is 'L2 count, k-anonymised with remainder; null when its difference from d1 is 1 to 9';
comment on column insights.first_letter_conversion.first_letter_d30 is 'L2 count, k-anonymised with remainder; null when its difference from d1 or d7 is 1 to 9';
comment on column insights.first_letter_conversion.first_letter_d2_7 is 'L2 count, increment d7 minus d1, published only when both are and the difference is 0 or at least k';
comment on column insights.first_letter_conversion.first_letter_d8_30 is 'L2 count, increment d30 minus d7, published only when both are and the difference is 0 or at least k';
