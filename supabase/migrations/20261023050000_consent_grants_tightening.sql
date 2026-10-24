-- The consent tables' grants match their row security (review B on #248, comment 6374282549, notes G2,
-- G3 and G4; the #251 reviews). Nothing a code path uses is taken away.
--
-- PENDING: not yet applied. Apply after 20261023040000_entries_machine_edits_check.sql (#258), following
-- supabase/APPLY.md (section "File 24"). Never edits an earlier file. Redefines nothing, adds nothing:
-- privileges only. Refuses a second run, and a run before 20261023040000 (55000).
--
-- The gap.
--   - policy_acceptances (20261002020000_data_governance.sql:624) was never revoked from the API roles,
--     so anon and authenticated hold INSERT, UPDATE and DELETE where Supabase's old automatic grants
--     apply (ALL on every new table in public), and TRUNCATE, REFERENCES, TRIGGER and, from Postgres 17,
--     MAINTAIN in every project (new tables keep those four without the automatic grants too). Row security refuses the writes (no write policy; the restrictive
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
-- Default privileges (reported, not changed). A revoke changes only the objects that exist, and which
-- defaults a project has decides what this file changes:
--   - With Supabase's old automatic grants (until 30 Oct 2026, on projects created before 30 May 2026
--     with them), a table a later migration creates in public gets ALL for anon, authenticated and
--     service_role, a sequence ALL, and a function EXECUTE for all three (and for PUBLIC, Postgres's own
--     default). There this file removes everything listed above.
--   - Without them (projects created since 30 May 2026, and every project for objects made after 30 Oct
--     2026: GitHub discussion supabase 45329, and the CLI's RevokeDefaultDataApiPrivilegesSql, which
--     matches what Studio runs at project creation), new tables get no SELECT, INSERT, UPDATE or DELETE
--     for the three roles but keep TRUNCATE, REFERENCES, TRIGGER and MAINTAIN; new sequences get no USAGE
--     or SELECT and keep UPDATE; new functions get no EXECUTE for the three roles, while PUBLIC's EXECUTE
--     stays. There this file removes the TRUNCATE, REFERENCES, TRIGGER and MAINTAIN that remain, and its
--     other revokes, like the service_role function revokes of files 20 and 21, change nothing.
--   In that second world every file from 20260930000000 on, files 1 and 2 included, relies on grants it
--   never makes, so the app cannot read or write until an explicit-grants file is applied (planned as
--   20261023060000, its own PR).
-- `alter default privileges for role postgres in schema public revoke all on tables, sequences, functions
-- from anon, authenticated, service_role` would make every later object start from nothing in both
-- worlds; it changes no existing object. This file does not run it: it is a project-wide decision, not a
-- consent-table one, and it belongs with the explicit grants that make the app work without the defaults
-- and with the harness and access matrix moved to that world in the same change (its own PR, decided by
-- the data architect and the founder). APPLY.md "Hosted checks before the first apply" a) shows which
-- world a project is in.
--
-- New SQLSTATEs: none. Reused: 55000 (second run, or a run before 20261023040000). Tests: rows in
-- supabase/tests/access_matrix.test.mjs (every persona, the service role, and the privilege lists) and
-- supabase/tests/consent_grants_tightening.test.mjs (new: the guards, and every definer writer and the
-- app's reads still working). Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once, after 20261023040000 --------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape') then
    raise exception '20261023050000 needs 20261023040000 first (entries_machine_edits_shape is missing)' using errcode = '55000';
  end if;
  -- This file's own end state: authenticated reads policy_acceptances and writes nothing, and anon has
  -- no SELECT. On a project without the automatic grants authenticated has no SELECT here until the
  -- explicit-grants file, so the file runs (removing the TRUNCATE, REFERENCES, TRIGGER and MAINTAIN new
  -- tables still get), and a second run before that file is not refused; it changes nothing.
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
