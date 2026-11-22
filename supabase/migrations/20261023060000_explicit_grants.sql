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
-- The fix: one rule for both worlds, and one rule for every grant: a grant exists only where a code path
-- uses it today (#265 round 2). Every table, view and sequence in public first loses every privilege anon,
-- authenticated, service_role and PUBLIC hold (column privileges go with it), then gets back exactly the
-- grants below, each with the path that uses it. A later feature that needs more adds its own grant in its
-- own migration. A project ends the same whichever defaults it was created with.
--   anon
--     policy_versions S        the deploy smoke's anonymous read (scripts/ops/lib/smoke.ts:296). The app
--                              reads the versions only after sign-in.
--   authenticated
--     entries S, I, U          sync_push and sync_private.held_upsert, held_state and keep_check run as the
--     held_drafts S, I, U      caller (20261016000000: security invoker); they insert, update and select
--                              for update. No DELETE: Erase now, let go and the purges are definer code.
--     child_member_prefs S,I,U sync_push's prefs.upsert (insert ... on conflict do update), as the caller.
--     profiles S, U            the app saves the sign-off name (apps/mobile/src/lib/auth/consent.ts:128).
--     children S (12 columns)  the app reads a book's name (apps/mobile/src/lib/family/invites.ts:214); the
--                              column list of 20261015000000 is restated unchanged (no date of birth or due
--                              date). Book edits go through the definer book_update() (G-08), so no UPDATE.
--     child_members S          the app counts its books (apps/mobile/src/lib/auth/consent.ts:134).
--     deletion_requests S      the app reads its own open request (apps/mobile/src/lib/account-deletion/api.ts:50).
--     my_policy_state S        the app reads its consent state (apps/mobile/src/lib/auth/consent.ts:46); the
--     policy_acceptances S     view is security_invoker, so it reads policy_acceptances as the caller.
--     policy_versions S        the consent and backup sheets (consent.ts:61, backup/runtime.ts:291).
--     audio_blobs S            the backup runtime lists its recordings (apps/mobile/src/lib/backup/runtime.ts:285).
--     child_keys S (7 columns) and its book keys (runtime.ts:271); the column list of 20261023000000, unchanged.
--     sync_epochs S            read by sync_push as the caller.
--     sync_op_receipts S       read by sync_private.held_dup as the caller.
--   service_role               nothing on any table: supabase/functions and scripts/ops call RPCs only, and
--                              publishing and support-assisted acts run in the SQL Editor as the owner.
--   nobody                     every other table and view (audit_events, backup_devices, backup_usage,
--                              book_entries, child_invites, deletion_request_steps, dictionary_terms,
--                              entry_versions, escrow_rotation_notices, escrow_unwraps, held_drafts_gone,
--                              idempotency_keys, legal_holds, policy_documents, purge_ledger, restore_approvals,
--                              restore_requests, storage_purge_queue, subscription_consents,
--                              subscription_report_rates, subscription_salts, subscription_status,
--                              sync_rate_windows), and every sequence (only definer code inserts into the
--                              identity columns behind them). Definer functions read and write them as the owner.
-- No role keeps TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on any table or view.
--
-- Functions: the same end state in both worlds too. service_role keeps EXECUTE only on the 42 functions an
-- earlier file granted it (the RPCs the workers, ops scripts and runbooks call, and the helpers a check or
-- policy runs as the caller); the old automatic grants also gave it EXECUTE on 86 others, which no path calls
-- with the service key (lens A on #261 and #265), and this file revokes that. Nothing changes for anon and
-- authenticated, whose function grants are explicit in every file.
--
-- Then the defaults: `alter default privileges for role postgres in schema public revoke all on tables,
-- sequences, functions from anon, authenticated, service_role`, so a table, sequence or function a later file
-- creates starts from nothing in both worlds, and that file grants what it needs (supabase/APPLY.md; the test
-- harness runs in that world by default, supabase/tests/harness.mjs). PUBLIC's EXECUTE on new functions stays
-- (Postgres's default, which Supabase keeps too); every file already revokes it where it matters.
--
-- New SQLSTATEs: none. Reused: 55000 (second run, or a run before 20261023050000). Tests: every
-- supabase/tests file runs without the automatic grants by default, and db-cli.yml runs them again with the old
-- ones (SCRIBE_DEFAULT_GRANTS=legacy); supabase/tests/grants.mjs holds the grant list above for
-- access_matrix.test.mjs and explicit_grants.test.mjs (new: both worlds end the same on tables, views, columns,
-- sequences and functions; the guards; the paths that broke on a new project). Fictional family "Asha" only.

-- --- 0. Run once, after 20261023050000 --------------------------------------
do $$
begin
  -- 20261023050000 takes TRUNCATE on policy_acceptances from anon, which holds it in both worlds before.
  if has_table_privilege('anon', 'public.policy_acceptances', 'TRUNCATE') then
    raise exception '20261023060000 needs 20261023050000 first (anon still holds TRUNCATE on policy_acceptances)' using errcode = '55000';
  end if;
  -- This file's own end state: new tables in public give the API roles nothing, authenticated reads entries
  -- and anon cannot truncate it. (Before it, anon holds TRUNCATE on entries in both worlds.)
  if has_table_privilege('authenticated', 'public.entries', 'SELECT')
     and not has_table_privilege('anon', 'public.entries', 'TRUNCATE')
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
grant select on public.policy_versions to anon;

-- --- 3. authenticated ----------------------------------------------------------
grant select, insert, update on public.entries, public.held_drafts, public.child_member_prefs to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.audio_blobs, public.child_members, public.deletion_requests, public.my_policy_state,
  public.policy_acceptances, public.policy_versions, public.sync_epochs, public.sync_op_receipts to authenticated;
-- Column lists, unchanged from 20261015000000 (children) and 20261023000000 (child_keys).
grant select (id, name, nickname, created_by, created_at, updated_at, deleted_at, deletion_request_id,
  family_can_read, photo_path, book_look, hidden_at) on public.children to authenticated;
grant select (child_id, profile_id, key_version, escrow_key_version, key_check, created_at, rewrapped_at)
  on public.child_keys to authenticated;

-- --- 4. Functions: service_role keeps only what a file granted it ----------
do $$
declare
  f regprocedure;
  keep regprocedure[] := array[
    'public.accept_child_invite_by_code(uuid,bytea)', 'public.backup_svc_stop(bytea)',
    'public.backup_svc_sweep(timestamptz,integer)', 'public.backup_svc_unwraps_between(timestamptz,timestamptz,integer)',
    'public.consent_pepper_ready()', 'public.content_gate_state(uuid)', 'public.dictionary_forms_valid(jsonb)',
    'public.finalize_account_deletion(uuid,jsonb)', 'public.has_active_consent(uuid,text)', 'public.insights_aggregates(integer)',
    'public.is_anonymous()', 'public.ops_alert_claim(text,integer)', 'public.ops_alert_reset(text)',
    'public.ops_apple_token_delete(uuid)', 'public.ops_apple_token_get(uuid)', 'public.ops_apple_token_put(uuid,text,integer,text)',
    'public.ops_audit_write(text,text,text,text,uuid,uuid,uuid,jsonb)', 'public.ops_consume_forget_quota(uuid,integer)',
    'public.ops_deletion_contributors(uuid)', 'public.ops_deletion_request_status(uuid)', 'public.ops_deletion_residue(uuid,text)',
    'public.ops_deletion_sla(timestamptz)', 'public.ops_deletion_work(integer)', 'public.ops_incident_scope(jsonb)',
    'public.ops_ledger_between(timestamptz,timestamptz,integer)', 'public.ops_merge_deletion_receipt(uuid,jsonb)',
    'public.ops_raw_sha(jsonb,integer,timestamptz)', 'public.ops_replay_ledger(jsonb)', 'public.ops_retention(timestamptz)',
    'public.ops_row_counts()', 'public.ops_schema_health()', 'public.ops_set_child_photo_path(uuid,text,text)',
    'public.ops_storage_owned_by(uuid,integer)', 'public.ops_storage_queue_due(integer,uuid)', 'public.ops_storage_residue(uuid,integer)',
    'public.prepare_account_purge(uuid)', 'public.purge_due(timestamptz,integer)', 'public.record_deletion_step(uuid,text,text,text)',
    'public.record_purge_attempt(bigint,boolean,text)', 'public.subscription_retention_purge(timestamptz)',
    'public.sync_begin_epoch(text,timestamptz)', 'public.sync_housekeeping(timestamptz,integer)']::regprocedure[];
begin
  for f in select p.oid::regprocedure from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') and p.oid <> all (keep::oid[]) loop
    execute format('revoke execute on routine %s from service_role', f);
  end loop;
end;
$$;

-- --- 5. Defaults: later objects start from nothing in both worlds -----------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
