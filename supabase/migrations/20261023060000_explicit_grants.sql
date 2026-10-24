-- Every table, view and sequence in public gets explicit grants, so a project without Supabase's automatic
-- grants works (lens A on #261, comment 6378839652, recommendation 1 and F6; the #261 round 2).
--
-- PENDING: not yet applied. Apply after 20261023050000_consent_grants_tightening.sql, following
-- supabase/APPLY.md (section "File 25"). Never edits an earlier file. Redefines no function and changes no
-- row: privileges only. Refuses a second run, and a run before 20261023050000 (55000).
--
-- The gap. Supabase stopped granting new objects in public to anon, authenticated and service_role on
-- projects created since 30 May 2026, and does the same on every project from 30 Oct 2026 (GitHub discussion
-- supabase 45329; the CLI's RevokeDefaultDataApiPrivilegesSql, which matches Studio): new tables get no
-- SELECT, INSERT, UPDATE or DELETE but keep TRUNCATE, REFERENCES, TRIGGER and MAINTAIN, new sequences get no
-- USAGE or SELECT but keep UPDATE, and new functions get no EXECUTE for the three roles (PUBLIC keeps
-- Postgres's own). Every file from 20260930000000 on relies on the old automatic grants for 27 tables, the
-- views book_entries and my_policy_state, and 2 sequences. On staging and production, which start empty,
-- all 24 files apply cleanly and then consent, sync_push, letters and family reads all answer 42501; the
-- deploy job's smoke (the anonymous policy_versions read) fails first. With the automatic grants, anon and
-- authenticated also hold TRUNCATE on 13 tables (entries, profiles, legal_holds, audit_events and
-- purge_ledger among them), and TRUNCATE skips row security; both worlds hand out MAINTAIN, REFERENCES and
-- TRIGGER on every table.
--
-- The fix: one rule for both worlds. Every table, view and sequence in public first loses every privilege
-- anon, authenticated and service_role hold (column privileges go with it), then gets back exactly what a
-- path uses, so a project ends the same whichever defaults it was created with. The grants come from the
-- row security policies, the access matrix (supabase/tests/access_matrix.test.mjs) and the code that reads
-- and writes each table:
--   - anon reads only the published policy texts (the consent sheets before sign-in; the staging smoke,
--     scripts/ops/lib/smoke.ts). Sign-in and invite redemption go through definer functions (peek_invite,
--     accept_child_invite, the auth schema), which need no table grant.
--   - authenticated gets SELECT where a policy lets it see rows, and INSERT, UPDATE or DELETE only where a
--     policy lets it write them and a path does: entries, held_drafts and child_member_prefs are written by
--     sync_push and sync_private.held_upsert, which run as the caller; dictionary_terms, child_member_prefs,
--     profiles and children by the app and the matrix's working rows. Tables written only by definer
--     functions (child_invites, child_members, audit_events, deletion_requests, policy_acceptances, the sync
--     receipts and rate windows) are SELECT only, as the earlier files left them. The column lists on
--     children, child_keys, restore_requests and restore_approvals are restated unchanged
--     (20261015000000, 20261023000000): no date of birth, due date, escrow wrap or stop token.
--   - service_role calls definer functions only (the purge worker, invite-redeem, apple-token,
--     subscription-status, analytics-forget and escrow call RPCs; supabase/functions reads no table). It
--     keeps what an operator path names: SELECT on the two consent record tables (20261023010000), SELECT on
--     subscription_status (20261016001000), and SELECT and INSERT on policy_documents and policy_versions
--     (publishing, 20261002020000). Nothing else.
--   - Sequences: none. Only definer functions insert into audit_events and storage_purge_queue.
--   - Functions: nothing. Every function the app or a worker calls is granted explicitly by its file (86 lose
--     only service_role's EXECUTE, which no path needs; lens A). Internal functions stay as they are.
-- Then the defaults: `alter default privileges for role postgres in schema public revoke all on tables,
-- sequences, functions from anon, authenticated, service_role`, so a table, sequence or function a later file
-- creates starts from nothing in both worlds and that file grants what it needs (the test harness runs in
-- that world by default, supabase/tests/harness.mjs). PUBLIC's EXECUTE on new functions stays (Postgres's
-- default, which Supabase keeps too); every file already revokes it where it matters.
--
-- Grants after this file (anon | authenticated | service_role; S select, I insert, U update, D delete; cols
-- = the column list below; blank = nothing):
--   audio_blobs, backup_devices, backup_usage, escrow_unwraps         |  S         |
--   audit_events, deletion_requests, child_invites, child_members      |  S         |
--   book_entries (view), my_policy_state (view)                        |  S         |
--   child_keys, restore_approvals, restore_requests                     |  S cols    |
--   child_member_prefs, dictionary_terms                                |  SIUD      |
--   children                                                            |  S cols, U |
--   entries, held_drafts                                                |  SIU       |
--   entry_versions                                                      |  S         |
--   policy_acceptances                                                  |  S         |  S
--   policy_documents, policy_versions                             S     |  S         |  SI
--   profiles                                                            |  SU        |
--   subscription_consents, subscription_status                          |            |  S
--   sync_epochs, sync_op_receipts, sync_rate_windows                    |  S         |
--   deletion_request_steps, escrow_rotation_notices, held_drafts_gone,
--   idempotency_keys, legal_holds, purge_ledger, storage_purge_queue,
--   subscription_report_rates, subscription_salts, and every sequence   |            |
-- No role keeps TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on any of them.
--
-- New SQLSTATEs: none. Reused: 55000 (second run, or a run before 20261023050000). Tests: every
-- supabase/tests file now runs without the automatic grants by default (SCRIBE_DEFAULT_GRANTS=legacy for the
-- old world, run nightly), access_matrix.test.mjs (every row, the grant list, the new defaults), and
-- explicit_grants.test.mjs (new: the guards, both worlds end the same). Fictional family "Asha" only.

-- --- 0. Run once, after 20261023050000 --------------------------------------
do $$
begin
  -- 20261023050000 takes TRUNCATE on policy_acceptances from anon, which holds it in both worlds before.
  if has_table_privilege('anon', 'public.policy_acceptances', 'TRUNCATE') then
    raise exception '20261023060000 needs 20261023050000 first (anon still holds TRUNCATE on policy_acceptances)' using errcode = '55000';
  end if;
  -- This file's own end state: new tables in public give the API roles nothing, and authenticated reads
  -- entries. (Before it, new tables give them at least TRUNCATE in both worlds.)
  if has_table_privilege('authenticated', 'public.entries', 'SELECT')
     and not exists (select 1 from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
                      where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole
                        and d.defaclobjtype = 'r'
                        and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)) then
    raise exception '20261023060000_explicit_grants.sql is already applied (new tables give the API roles nothing, and authenticated reads entries)'
      using errcode = '55000';
  end if;
end;
$$;

-- --- 1. Start from nothing --------------------------------------------------
revoke all on all tables in schema public from public, anon, authenticated, service_role;
revoke all on all sequences in schema public from public, anon, authenticated, service_role;

-- --- 2. anon -----------------------------------------------------------------
grant select on public.policy_documents, public.policy_versions to anon;

-- --- 3. authenticated ----------------------------------------------------------
-- Reads, where a policy shows rows.
grant select on public.audio_blobs, public.audit_events, public.backup_devices, public.backup_usage,
  public.book_entries, public.child_invites, public.child_member_prefs, public.child_members,
  public.deletion_requests, public.dictionary_terms, public.entries, public.entry_versions,
  public.escrow_unwraps, public.held_drafts, public.my_policy_state, public.policy_acceptances,
  public.policy_documents, public.policy_versions, public.profiles, public.sync_epochs,
  public.sync_op_receipts, public.sync_rate_windows to authenticated;
-- Column lists, unchanged from 20261015000000 (children) and 20261023000000 (the backup tables).
grant select (id, name, nickname, created_by, created_at, updated_at, deleted_at, deletion_request_id,
  family_can_read, photo_path, book_look, hidden_at) on public.children to authenticated;
grant select (child_id, profile_id, key_version, escrow_key_version, key_check, created_at, rewrapped_at)
  on public.child_keys to authenticated;
grant select (id, profile_id, device_id, state, requested_at, hold_until, notified_at, approved_by_device,
  approved_at, released_at, cancelled_at, cancel_source, expired_at) on public.restore_requests to authenticated;
grant select (request_id, device_id, sealed_code, created_at, used_at) on public.restore_approvals to authenticated;
-- Writes, where a policy lets the row be written and a path writes it.
grant insert, update on public.entries, public.held_drafts to authenticated;
grant insert, update, delete on public.child_member_prefs, public.dictionary_terms to authenticated;
grant update on public.children, public.profiles to authenticated;

-- --- 4. service_role -------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select on public.policy_acceptances, public.subscription_consents, public.subscription_status to service_role';
    execute 'grant select, insert on public.policy_documents, public.policy_versions to service_role';
  end if;
end;
$$;

-- --- 5. Defaults: later objects start from nothing in both worlds -----------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
