// What 20261023060000_explicit_grants.sql leaves anon, authenticated and service_role on public tables, views
// and functions, in both default-grant worlds (harness.mjs DEFAULT_GRANTS). One list for access_matrix and
// explicit_grants. A grant exists only where a code path uses it today; the migration header names each path.
// S select, I insert, U update, D delete; nothing else (no TRUNCATE, REFERENCES, TRIGGER or MAINTAIN).
export const GRANTS = {
  anon: { policy_versions: 'S' },
  authenticated: { audio_blobs: 'S', child_member_prefs: 'SIU', child_members: 'S', deletion_requests: 'S', entries: 'SIU',
    held_drafts: 'SIU', my_policy_state: 'S', policy_acceptances: 'S', policy_versions: 'S', profiles: 'SU', sync_epochs: 'S',
    sync_op_receipts: 'S' },
  service_role: {},
};
// Column SELECT for authenticated where it holds no table SELECT.
export const COLUMNS = {
  child_keys: 'child_id,created_at,escrow_key_version,key_check,key_version,profile_id,rewrapped_at',
  children: 'book_look,created_at,created_by,deleted_at,deletion_request_id,family_can_read,hidden_at,id,name,nickname,photo_path,updated_at',
};
// The only public functions service_role may execute (explicit grants in earlier files).
export const SERVICE_ROLE_FUNCTIONS = ['accept_child_invite_by_code(uuid,bytea)', 'backup_svc_stop(bytea)',
  'backup_svc_sweep(timestamp with time zone,integer)', 'backup_svc_unwraps_between(timestamp with time zone,timestamp with time zone,integer)',
  'consent_pepper_ready()', 'content_gate_state(uuid)', 'dictionary_forms_valid(jsonb)', 'finalize_account_deletion(uuid,jsonb)',
  'has_active_consent(uuid,text)', 'insights_aggregates(integer)', 'is_anonymous()', 'ops_alert_claim(text,integer)', 'ops_alert_reset(text)',
  'ops_apple_token_delete(uuid)', 'ops_apple_token_get(uuid)', 'ops_apple_token_put(uuid,text,integer,text)',
  'ops_audit_write(text,text,text,text,uuid,uuid,uuid,jsonb)', 'ops_consume_forget_quota(uuid,integer)', 'ops_deletion_contributors(uuid)',
  'ops_deletion_request_status(uuid)', 'ops_deletion_residue(uuid,text)', 'ops_deletion_sla(timestamp with time zone)',
  'ops_deletion_work(integer)', 'ops_incident_scope(jsonb)', 'ops_ledger_between(timestamp with time zone,timestamp with time zone,integer)',
  'ops_merge_deletion_receipt(uuid,jsonb)', 'ops_raw_sha(jsonb,integer,timestamp with time zone)', 'ops_replay_ledger(jsonb)',
  'ops_retention(timestamp with time zone)', 'ops_row_counts()', 'ops_schema_health()', 'ops_set_child_photo_path(uuid,text,text)',
  'ops_storage_owned_by(uuid,integer)', 'ops_storage_queue_due(integer,uuid)', 'ops_storage_residue(uuid,integer)',
  'prepare_account_purge(uuid)', 'purge_due(timestamp with time zone,integer)', 'record_deletion_step(uuid,text,text,text)',
  'record_purge_attempt(bigint,boolean,text)', 'subscription_retention_purge(timestamp with time zone)',
  'sync_begin_epoch(text,timestamp with time zone)', 'sync_housekeeping(timestamp with time zone,integer)',
  // 20261031000000 (CR-26)
  'ops_compliance_report(date,date)', 'ops_compliance_retention(timestamp with time zone)', 'ops_count_check(text,text,text)',
  'ops_regwatch_record(jsonb)', 'ops_regwatch_triage(bigint,text,text)'];
// "role relation letters" rows, sorted, for an exact comparison.
export const grantRows = () => Object.entries(GRANTS).flatMap(([role, m]) => Object.entries(m).map(([rel, l]) => `${role} ${rel} ${l}`)).sort();
