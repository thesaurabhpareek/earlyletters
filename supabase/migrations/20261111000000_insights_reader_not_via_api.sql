-- CR-71 C9 (data-security S9, gap G-26): the Data API login role can no longer become insights_reader.
--
-- 20261004300000_insights_aggregates.sql (lines 35-37) ran `grant insights_reader to authenticator`, so a
-- JWT whose `role` claim is insights_reader could read the k-anonymised insights views through PostgREST.
-- No workflow uses that path. This file takes the
-- membership away. Revoke only: the role, its schema and function grants, and every view stay as they are.
--
-- PENDING: not yet applied. Needs the founder's `approve-migration` label and a CI tag run (D-041).
-- Apply after 20261110000000 (supabase/APPLY.md, "File 34"). Safe to run twice (a revoke of a membership
-- that is not held changes nothing). Does nothing where `authenticator` does not exist (a local database).
--
-- What changes: pg_auth_members loses the row (insights_reader, authenticator). `set role insights_reader`
-- from an authenticator session is then refused (42501). service_role still reads insights.* and calls
-- public.insights_aggregates(int); insights_reader still holds its own grants for a direct database login.
-- No table, column, class or level changes; no new grant.
--
-- ROLLBACK (forward-fix only; a later migration): grant insights_reader to authenticator;
--
-- Who is affected: anyone holding an insights_reader JWT (SUPABASE_INSIGHTS_TOKEN in scripts/insights/run.ts).
-- The weekly run moves to the planned reporting_reader login (IN-DA-03); until then it is run locally, and the
-- service key stays out of CI. Data classification: no data touched.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator')
     and exists (select 1 from pg_roles where rolname = 'insights_reader') then
    revoke insights_reader from authenticator;
  end if;
end
$$;
