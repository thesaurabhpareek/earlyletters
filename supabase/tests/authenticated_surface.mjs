// What the `authenticated` role may read, write or run beyond what grants.mjs already lists (BL-1921 item 2).
// authenticated_surface.test.mjs enumerates every table, view, sequence, column, function and schema in every
// non-system schema that `authenticated` holds a privilege on, and compares the result with:
//   grants.mjs GRANTS.authenticated   table and view privileges in public (S select, I insert, U update, D delete);
//   grants.mjs COLUMNS                column SELECT where no table SELECT is held;
//   this file                         everything grants.mjs does not hold: functions, schemas, and the harness's
//                                     stubs of the Supabase-owned auth and storage schemas.
// A new grant fails the test until it is added here (or to grants.mjs) with the code path that needs it, and an
// entry here that no longer exists fails it too, so the list cannot rot. Fictional family "Asha" only (CLAUDE.md).
//
// Signatures: schema.name(argument types), the types as Postgres prints them (oidvectortypes), with no space
// after a comma. A function listed here may still answer only for the caller or refuse with a code; what each one
// does per persona is in access_matrix.test.mjs (RPCS and HELPERS).

// Schemas `authenticated` holds USAGE on. auth and storage are Supabase's (stubbed in harness.mjs); public is the
// Data API's; sync_private holds the helpers sync_push and sync_pull call as the caller (20261016000000, review L
// on #208). ops and insights are reached only by definer code and the service role.
export const SCHEMAS = ['auth', 'public', 'storage', 'sync_private'];

// Public functions `authenticated` may execute: the client RPCs and the boolean helpers row security calls as the
// caller. Each is a row of access_matrix.test.mjs (RPCS or HELPERS), which also proves every RPC starts with
// require_user() or checks is_anonymous() (K-08).
export const PUBLIC_FUNCTIONS = [
  'accept_child_invite(text)',
  'backup_approve_request(uuid,uuid,bytea)', 'backup_begin(uuid,uuid,bigint,integer,bytea,smallint)',
  'backup_cancel_request(uuid,uuid)', 'backup_confirm(uuid,bytea)', 'backup_delete_all(integer)', 'backup_discard(uuid)',
  'backup_object_readable(text)', 'backup_object_writable(text)', 'backup_pending_requests(uuid)',
  'backup_register_device(uuid,bytea)', 'backup_revoke_device(uuid)', 'backup_store_key(uuid,integer,integer,jsonb,bytea)',
  'book_update(uuid,jsonb)',
  'can_read_entry_photo(text)', 'can_write_content()', 'cancel_account_deletion()', 'cancel_book_deletion(uuid)',
  'child_is_live(uuid)', 'create_child(uuid,text,date,date)', 'create_child_invite(uuid,text,text)',
  'create_child_invite(uuid,uuid,text,bytea,bytea,text)', 'create_first_run_children(jsonb)',
  'delete_entry(uuid)', 'dictionary_forms_valid(jsonb)',
  'is_anonymous()', 'is_child_member(uuid)', 'is_child_parent(uuid)', 'is_valid_client_uuid7(uuid)',
  'leave_child(uuid,boolean)', 'my_auto_add_in(uuid)', 'my_role_in(uuid)', 'my_sync_gate()',
  'peek_invite(text)', 'photo_entry_is_purged(text)', 'policy_actions_needed()',
  'rate_hit(text)', 'record_export_created(integer,bigint,text)',
  'record_policy_act(text,text,text,text,text,text,text,text,timestamp with time zone,bytea,jsonb,text,integer)',
  'remove_child_member(uuid,uuid,boolean)', 'request_account_deletion(text,boolean)', 'request_book_deletion(uuid,text)',
  'require_content_consent()', 'require_user()', 'restore_entry(uuid)', 'review_family_letter(uuid,text,text)',
  'revoke_invite(uuid)',
  'set_member_auto_add(uuid,uuid,boolean)', 'status_report_store(jsonb)', 'status_salt()',
  'sync_books()', 'sync_op_claim(uuid)', 'sync_pull(jsonb,integer)', 'sync_push(jsonb)',
  'undo_parent_join(uuid,uuid)', 'withdraw_family_letter(uuid)',
].map((s) => `public.${s}`);

// sync_private helpers signed-in people execute (sync_push and sync_pull run as the caller and call them).
// Unqualified, as access_matrix.test.mjs compares them; it imports this list.
export const SYNC_PRIVATE_FOR_SIGNED_IN = ['dup_answer(uuid)', 'dup_outcome(uuid,uuid)', 'erase_entry(uuid)', 'erase_held(uuid)',
  'held_discard(uuid,xid8)', 'held_dup(uuid,uuid)', 'held_id_taken(uuid)', 'held_on_hold(uuid)', 'held_state(uuid,boolean)',
  'held_upsert(uuid,uuid,jsonb)', 'keep_check(uuid,uuid,text,xid8)', 'lock_letter_id(uuid)', 'note_answer(uuid,jsonb)', 'safe_bool(text)', 'safe_date(text)',
  'note_applied(uuid,uuid,boolean,boolean)', 'note_held(uuid,uuid,boolean)'];

// The harness's stand-ins for Supabase-owned objects (harness.mjs createDb). On a hosted project Supabase owns these
// schemas and grants more; this test covers what the migrations add, so a migration that grants anything new in
// auth or storage still fails here.
export const SUPABASE_STUB_TABLES = { 'storage.objects': 'SIUDTRGM' };
export const SUPABASE_STUB_FUNCTIONS = ['auth.uid()', 'storage.foldername(text)'];
