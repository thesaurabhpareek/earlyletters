-- The consent tables' grants match their row security (review B on #248, comment 6374282549, notes G2,
-- G3 and G4; the #251 reviews). Nothing a code path uses is taken away.
--
-- PENDING: not yet applied. Apply after 20261023030000_held_drafts_write_checks.sql, and after
-- 20261023040000 (#258) if that is merged first (filename order), following supabase/APPLY.md (section
-- "File 24"). Never edits an earlier file. Redefines nothing, adds nothing: privileges only. Refuses a
-- second run, and a run before 20261023030000 (55000).
--
-- The gap.
--   - policy_acceptances (20261002020000_data_governance.sql:624) was never revoked from the API roles,
--     so anon and authenticated hold INSERT, UPDATE and DELETE, and on hosted Supabase (whose default
--     privileges grant ALL on every new table in public) also TRUNCATE, REFERENCES, TRIGGER and, from
--     Postgres 17, MAINTAIN. Row security refuses the writes (no write policy; the restrictive
--     anonymous-session policy), but TRUNCATE skips row security and the table has no truncate guard,
--     and MAINTAIN allows LOCK TABLE ... IN ACCESS EXCLUSIVE MODE (which stalls record_policy_act),
--     VACUUM, REINDEX and CLUSTER. None of it is reachable through PostgREST, which runs no raw SQL, so
--     the risk is low. anon also holds SELECT, and row security gives it no row (the read policy is for
--     authenticated only).
--   - policy_documents and policy_versions: anon and authenticated hold every write the default ALL
--     gives; row security allows them SELECT only.
--   - service_role still holds MAINTAIN on policy_acceptances and subscription_consents after
--     20261023010000, which revoked every other write privilege. information_schema.role_table_grants
--     does not list MAINTAIN, so APPLY.md File 20's check could not see it.
--
-- Who writes and reads these tables (read for this file):
--   - Writers are SECURITY DEFINER functions owned by the migration role, which no revoke here touches:
--     record_policy_act, policy_acceptances_pseudonymise and purge_due (policy_acceptances);
--     status_report_store, subscription_consents_pseudonymise and subscription_retention_purge
--     (subscription_consents). Policy documents and versions are published by the owner (SQL Editor,
--     APPLY.md step 8.2) or the service role; support-assisted acts are recorded by the owner.
--   - The app (apps/mobile src/lib/auth/consent.ts, src/lib/backup/runtime.ts) reads my_policy_state
--     (security_invoker, so authenticated keeps SELECT on policy_acceptances) and policy_versions, and
--     writes only through the record_policy_act RPC. packages/api lists RPCs only. supabase/functions
--     touch no consent table directly (subscription-status calls status_report_store with the person's
--     token). scripts/ops reads policy_versions as anon (the staging smoke) and the rest through the
--     definer ops functions.
--
-- What this file revokes:
--   policy_acceptances   from PUBLIC, anon, authenticated: INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
--                        TRIGGER, MAINTAIN; and SELECT from PUBLIC and anon. authenticated keeps SELECT.
--   policy_documents,    from PUBLIC, anon, authenticated: the same write set. Both keep SELECT (the
--   policy_versions      consent sheets before sign-in, and the staging smoke).
--   policy_acceptances,  from service_role: MAINTAIN. SELECT stays; the rest went in 20261023010000.
--   subscription_consents
-- MAINTAIN exists from Postgres 17 (supabase/config.toml says 17; an older project has no such
-- privilege), so those revokes run only on 17 and later. Unchanged: service_role's rights on
-- policy_documents and policy_versions (publishing), and subscription_consents for the API roles (no
-- privilege since 20261016001000). A truncate guard on policy_acceptances, like
-- subscription_consents_no_truncate, is not added here: after this file only the owner may truncate it.
--
-- Default privileges (reported, not changed). A revoke changes only the tables that exist. On a project
-- with Supabase's automatic grants, a table a later migration creates in public gets ALL for anon,
-- authenticated and service_role again, and a new function gets EXECUTE for all three (and for PUBLIC,
-- which is Postgres's own default). `alter default privileges for role postgres in schema public revoke
-- all on tables from anon, authenticated, service_role` (and the same on functions and sequences) would
-- stop that for every object the migration role creates from then on; it changes no existing object.
-- This file does not do it, because:
--   - it is a project-wide decision, not a consent-table one: every later migration would then have to
--     grant each new table and function to the roles that use it, while the pending files before this
--     one, applied in the same push, rely on the automatic grants (for example authenticated's SELECT on
--     policy_acceptances behind my_policy_state, and its writes on held_drafts);
--   - Supabase is making the table and sequence half of that change itself: the default for new projects
--     since 30 May 2026, and applied to all existing projects on 30 Oct 2026 (changelog, GitHub
--     discussion supabase 45329; for objects the postgres role creates). PUBLIC's EXECUTE on functions
--     stays (Postgres's default);
--   - the test harness (supabase/tests/harness.mjs) models the automatic grants; changing them needs the
--     harness, the access matrix and every pending file's grants reviewed in the same change.
-- It belongs in its own PR, decided by the data architect and the founder. APPLY.md "Hosted checks before
-- the first apply" query a) shows which defaults the hosted project has.
--
-- New SQLSTATEs: none. Reused: 55000 (second run, or a run before 20261023030000). Tests: rows in
-- supabase/tests/access_matrix.test.mjs (every persona, the service role, and the privilege lists) and
-- supabase/tests/consent_grants_tightening.test.mjs (new: the guards, and every definer writer and the
-- app's reads still working). Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once, after 20261023030000 --------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = to_regclass('public.held_drafts') and conname = 'held_drafts_capture_mode_check') then
    raise exception '20261023050000 needs 20261023030000 first (held_drafts_capture_mode_check is missing)' using errcode = '55000';
  end if;
  -- This file's own end state: authenticated reads policy_acceptances and writes nothing, and anon has
  -- no SELECT. (On a project whose tables got no automatic grants, authenticated has no SELECT either,
  -- so the file runs and its revokes change nothing.)
  if has_table_privilege('authenticated', 'public.policy_acceptances', 'SELECT')
     and not has_table_privilege('authenticated', 'public.policy_acceptances', 'INSERT')
     and not has_table_privilege('anon', 'public.policy_acceptances', 'SELECT') then
    raise exception '20261023050000_consent_grants_tightening.sql is already applied (authenticated holds no INSERT and anon no SELECT on policy_acceptances)'
      using errcode = '55000';
  end if;
end;
$$;

-- --- 1. The API roles: what row security already refuses --------------------
revoke insert, update, delete, truncate, references, trigger on public.policy_acceptances from public, anon, authenticated;
revoke select on public.policy_acceptances from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.policy_documents, public.policy_versions
  from public, anon, authenticated;

-- --- 2. MAINTAIN (Postgres 17 and later) -----------------------------------
do $$
begin
  if current_setting('server_version_num')::int >= 170000 then
    execute 'revoke maintain on public.policy_acceptances, public.policy_documents, public.policy_versions from public, anon, authenticated';
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute 'revoke maintain on public.policy_acceptances, public.subscription_consents from service_role';
    end if;
  end if;
end;
$$;
