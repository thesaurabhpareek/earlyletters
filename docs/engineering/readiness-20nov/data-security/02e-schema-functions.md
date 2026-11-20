# 02e Schema reference: functions

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`), 31 migrations loaded in the test harness and read from `pg_proc` [V]. `sync_private` (17 functions, 1 table) is a schema the API does not expose; `20261016000000:227-234` grants USAGE to authenticated. Part of 02 (see 02a for the legend and the file list).

## What the catalog shows

- 206 functions in `public`, `ops`, `insights` and `sync_private`: 55 callable by a signed-in person (client RPCs), 17 in `sync_private` (granted to au but not reachable through the API), 42 callable by `service_role` only, 47 internal helpers no role may call, 39 trigger functions (02f), 6 in `insights`. [V]
- No function is executable by `PUBLIC` or by `anon`: 0 of 206 [V in the harness; the hosted project's grants were not read, U]. This is the default-privilege reset of `20261023060000_explicit_grants.sql` plus a revoke in each migration; `supabase/tests/grants.mjs:18-27` lists the `service_role` functions and `explicit_grants.test.mjs` pins them.
- All 206 set `search_path` with `pg_temp` last [V] (`20261028000000_pg_temp_last_and_purged_photos.sql`; `pg_temp_search_path.test.mjs`, `v1_gate_search_path.test.mjs`). 154 run as definer (owner rights, so they are the only way past RLS) and 52 as invoker. Of the invokers, `sync_push` is the main one that writes letters with the caller's own table grants.
- Authenticated RPCs have no list in `grants.mjs` today (`SERVICE_ROLE_FUNCTIONS` only); a new RPC has no failing test for a wrong grant (Gap G-17; `data-and-sync.md` R9 says `qa` adds `AUTHENTICATED_FUNCTIONS`).
- "Tests naming it" lists test files in `supabase/tests` whose text contains the function name; it is a pointer, not a proof of an allow and a deny case.
- Latest definition is the last migration file that creates the function (an older file may define it first; never edit those).

## Client RPCs (callable by au; rows limited by the function)

| Function | Runs as | Latest definition | Purpose | Tests naming it |
|---|---|---|---|---|
| accept_child_invite(text) | definer | 20261015020000:176 | join a book with an invite token (consent and caps checked) | access_matrix, db_followup_family_cap, db_followup_idempotency_rates +6 |
| backup_approve_request(uuid,uuid,bytea) | definer | 20261023000000:1088 | enrolled phone approves a restore; returns a code sealed to it | access_matrix, audio_backup_escrow |
| backup_begin(uuid,uuid,bigint,int,bytea,smallint) | definer | 20261023000000:851 | reserve one encrypted recording upload; returns the one writable path | access_matrix, audio_backup, audio_backup_purge +1 |
| backup_cancel_request(uuid,uuid) | definer | 20261023000000:1124 | owner or enrolled phone cancels a restore request | access_matrix, audio_backup_escrow |
| backup_confirm(uuid,bytea) | definer | 20261023000000:947 | mark an upload done after checking size and hash | access_matrix, audio_backup, audio_backup_purge +1 |
| backup_delete_all(int) | definer | 20261023000000:1014 | turn backup off and delete every recording backup | access_matrix, audio_backup |
| backup_discard(uuid) | definer | 20261023000000:995 | drop one reservation or orphan backup | access_matrix, audio_backup, audio_backup_purge |
| backup_object_readable(text) | definer | 20261023000000:697 | storage policy helper: own backup objects only | access_matrix, audio_backup, former_member_purge |
| backup_object_writable(text) | definer | 20261023000000:685 | storage policy helper: the exact pending path only | access_matrix, audio_backup |
| backup_pending_requests(uuid) | definer | 20261023000000:1054 | what restore requests wait for this phone | access_matrix, audio_backup_escrow |
| backup_register_device(uuid,bytea) | definer | 20261023000000:716 | enrol a phone by public key | access_matrix, audio_backup, audio_backup_escrow +1 |
| backup_revoke_device(uuid) | definer | 20261023000000:752 | revoke an enrolled phone | access_matrix, audio_backup, audio_backup_escrow |
| backup_store_key(uuid,int,int,jsonb,bytea) | definer | 20261023000000:784 | store the escrow wrap of a book key | access_matrix, audio_backup, audio_backup_escrow +3 |
| book_update(uuid,jsonb) | definer | 20261109000000:98 | change a book's settings (name, nickname, dates, look) | access_matrix, child_name_optional, children_entitlements +3 |
| can_read_entry_photo(text) | definer | 20261003000000:586 | storage policy helper: may this person read a letter photo | access_matrix, pg_temp_search_path |
| can_write_content() | definer | 20261003000000:182 | consent gate predicate for content writes | access_matrix |
| cancel_account_deletion() | definer | 20261005000000:460 | cancel an open account deletion (5 per day) | access_matrix, audio_backup, audio_backup_escrow +5 |
| cancel_book_deletion(uuid) | definer | 20261003000000:691 | cancel a book deletion inside the grace period | access_matrix, data_governance |
| child_is_live(uuid) | definer | 20261002020000:84 | is the book not tombstoned or purged | access_matrix, pg_temp_search_path |
| create_child(uuid,text,date,date) | definer | 20261015000000:778 | make a book (rate limited to 20 per day) | access_matrix, child_name_optional, children_entitlements +6 |
| create_child_invite(uuid,text,text) | definer | 20261015020000:118 | make an invite; 7-argument form takes phone-made hashes | access_matrix, db_followup_family_cap, db_followup_idempotency_rates +6 |
| create_child_invite(uuid,uuid,text,bytea,bytea,text) | definer | 20261015020000:231 | make an invite; 7-argument form takes phone-made hashes | access_matrix, db_followup_family_cap, db_followup_idempotency_rates +6 |
| create_first_run_children(jsonb) | definer | 20261015000000:798 | make the first-run books as one batch | access_matrix, child_name_optional, children_entitlements +1 |
| delete_entry(uuid) | definer | 20261015000000:829 | tombstone the author's own letter | access_matrix, data_governance, db_followup_family_cap +6 |
| dictionary_forms_valid(jsonb) | invoker | 20261015030000:70 | shape check for dictionary forms | access_matrix, grants* |
| is_anonymous() | invoker | 20261003000000:55 | reads the anonymous claim of the JWT | access_matrix, audio_backup, consent_grants_tightening +3 |
| is_child_member(uuid) | definer | 20260930000000:57 | RLS predicate: caller is in the book | access_matrix, pg_temp_search_path, rls +1 |
| is_child_parent(uuid) | definer | 20261002020000:57 | RLS predicate: caller is a parent of the book | access_matrix, pg_temp_search_path, v1_gate_search_path |
| is_valid_client_uuid7(uuid) | invoker | 20261003010000:57 | accepts only well-formed UUIDv7 client ids | access_matrix |
| leave_child(uuid,boolean) | definer | 20261005000000:337 | leave a book, keep or take out own letters | access_matrix, data_governance, db_followup_family_cap +9 |
| my_auto_add_in(uuid) | definer | 20261003000000:115 | caller's auto-add setting for a book | access_matrix |
| my_role_in(uuid) | definer | 20261003000000:110 | caller's role in a book | access_matrix |
| my_sync_gate() | definer | 20261003000000:171 | caller's consent gate state for the app | access_matrix, consent_grants_tightening, security_family |
| peek_invite(text) | definer | 20261015010000:141 | show inviter signature and role before joining | access_matrix, v1_gate_coparent, v1_gate_limits_peek_pepper +1 |
| photo_entry_is_purged(text) | definer | 20261028000000:62 | storage policy helper: is the letter purged | access_matrix, pg_temp_search_path |
| policy_actions_needed() | definer | 20261005000000:558 | documents the caller must act on | access_matrix, consent_grants_tightening, data_governance +2 |
| rate_hit(text) | definer | 20261015000000:88 | count a call against a rate bucket | access_matrix, db_followup_idempotency_rates, v1_gate_limits_peek_pepper |
| record_policy_act(text,text,text,text,text,text,text,text,tim...) | definer | 20261108000000:118 | record a consent or acknowledgement act | access_matrix, audio_backup, audio_backup_escrow +16 |
| remove_child_member(uuid,uuid,boolean) | definer | 20261005000000:362 | a parent removes a family member | access_matrix, db_followup_family_cap, v1_gate_coparent +1 |
| request_account_deletion(text,boolean) | definer | 20261005000000:408 | start an account deletion with 30-day grace | access_matrix, audio_backup, audio_backup_escrow +12 |
| request_book_deletion(uuid,text) | definer | 20261003000000:661 | start a book deletion with 30-day grace | access_matrix, audio_backup_purge, data_governance +8 |
| require_content_consent() | definer | 20261003000000:190 | raise SCCON when content may not be written | access_matrix |
| require_user() | invoker | 20261003000000:62 | every RPC starts here; returns the caller id | access_matrix |
| restore_entry(uuid) | definer | 20261015000000:842 | restore a tombstoned letter within 30 days | access_matrix, data_governance, db_followup_language +1 |
| review_family_letter(uuid,text,text) | definer | 20261003000000:502 | a parent adds or sets aside a family letter | access_matrix, db_followup_family_cap, security_family |
| revoke_invite(uuid) | definer | 20261003000000:349 | revoke an open invite | access_matrix, security_family, v1_gate_limits_peek_pepper |
| set_member_auto_add(uuid,uuid,boolean) | definer | 20261003000000:546 | parent sets auto-add for a family member | access_matrix, data_governance, security_family |
| status_report_store(jsonb) | definer | 20261016001000:278 | store a plan status report from the phone | access_matrix, consent_grants_tightening, subscription_status |
| status_salt() | definer | 20261016001000:255 | return the account's sub_ref salt | access_matrix, subscription_status |
| sync_books() | definer | 20261015000000:866 | books, members and access for the pull | access_matrix, children_entitlements, former_member_purge +3 |
| sync_op_claim(uuid) | definer | 20261015000000:496 | claim an op id so a retry is safe | access_matrix, sync_v1_server, v1_gate_hardening |
| sync_pull(jsonb,int) | definer | 20261016000000:1302 | pull rows for the caller by cursor (reads book_entries) | access_matrix, data_governance, db_followup_family_cap +16 |
| sync_push(jsonb) | invoker | 20261016000000:931 | apply ordered device ops (invoker, 256 KB cap) | access_matrix, db_followup_idempotency_rates, db_followup_language +10 |
| undo_parent_join(uuid,uuid) | definer | 20261015020000:403 | undo a parent join within 72 hours | access_matrix, former_member_purge, v1_gate_coparent +1 |
| withdraw_family_letter(uuid) | definer | 20261003000000:532 | a family member takes back a letter | access_matrix, security_family, v1_gate_hardening |

## sync_private helpers (granted to au; the API does not expose the schema, `sync_push` calls them)

| Function | Runs as | Latest definition | Purpose | Tests naming it |
|---|---|---|---|---|
| sync_private.dup_answer(uuid) | definer | 20261016000000:280 | answer stored for a repeated op | access_matrix, sync_v1_server |
| sync_private.dup_outcome(uuid,uuid) | definer | 20261016000000:254 | was the op applied before | access_matrix, sync_v1_server |
| sync_private.erase_entry(uuid) | definer | 20261016000000:881 | hard-delete a letter now and record it | access_matrix, former_member_purge, purge_legal_holds +1 |
| sync_private.erase_held(uuid) | definer | 20261016000000:830 | hard-delete a held draft | access_matrix, sync_v1_server |
| sync_private.erasure_recorded(uuid,uuid) | definer | 20261016000000:398 | was this letter id erased | sync_v1_server |
| sync_private.held_discard(uuid,xid8) | definer | 20261016000000:771 | delete a held draft and its words | access_matrix, sync_v1_server |
| sync_private.held_dup(uuid,uuid) | invoker | 20261016000000:752 | repeat check for a held op | access_matrix, sync_v1_server |
| sync_private.held_id_taken(uuid) | definer | 20261016000000:627 | is the held draft id in use | access_matrix, sync_v1_server |
| sync_private.held_on_hold(uuid) | definer | 20261016000000:633 | does a legal hold cover a held draft | access_matrix, sync_v1_server |
| sync_private.held_state(uuid,boolean) | invoker | 20261016000000:645 | stamp the state of a held draft | access_matrix, entries_machine_edits_check, sync_v1_server |
| sync_private.held_upsert(uuid,uuid,o jsonb) | invoker | 20261016000000:680 | write a held draft | access_matrix, sync_v1_server |
| sync_private.keep_check(uuid,uuid,text,xid8) | definer | 20261016000000:797 | checks before a Keep | access_matrix |
| sync_private.letter_id_taken(uuid,uuid) | definer | 20261016000000:407 | is the letter id used by another author | sync_v1_server |
| sync_private.lock_letter_id(uuid) | invoker | 20261016000000:291 | advisory lock for an id | access_matrix, sync_v1_server |
| sync_private.note_answer(uuid,jsonb) | definer | 20261016000000:276 | store the first answer of an op | access_matrix |
| sync_private.note_applied(uuid,uuid,boolean,boolean) | definer | 20261016000000:239 | record that an entry op applied | access_matrix, sync_v1_server |
| sync_private.note_held(uuid,uuid,boolean) | definer | 20261016000000:664 | record that a held op applied | access_matrix, sync_v1_server |

## Service-only functions (callable by service_role: Edge Functions, the purge worker, ops scripts)

| Function | Runs as | Latest definition | Purpose | Tests naming it |
|---|---|---|---|---|
| accept_child_invite_by_code(uuid,bytea) | definer | 20261015020000:315 | join by code, called only by invite_redeem_by_code | access_matrix, grants*, invite_redeem_by_code +1 |
| backup_svc_stop(bytea) | definer | 20261023000000:1626 | stop link: cancel restores for a token | access_matrix, audio_backup_escrow, grants* |
| backup_svc_sweep(timestamptz,int) | definer | 20261023000000:1567 | daily backup retention sweep | access_matrix, audio_backup_escrow, audio_backup_purge +2 |
| backup_svc_unwraps_between(timestamptz,timestamptz,int) | definer | 20261023000000:1611 | unwrap log rows for the daily ops-ledger copy | access_matrix, audio_backup_escrow, grants* |
| consent_pepper_ready() | definer | 20261015010000:73 | is the consent pepper set | access_matrix, grants*, v1_gate_limits_peek_pepper |
| content_gate_state(uuid) | definer | 20261003000000:160 | consent gate state for a person (worker) | access_matrix, grants* |
| finalize_account_deletion(uuid,jsonb) | definer | 20261108010000:60 | close an account deletion and pseudonymise records | access_matrix, audio_backup_purge, audit_append_only +6 |
| has_active_consent(uuid,text) | definer | 20261002020000:766 | does a person hold an active consent | access_matrix, audio_backup, grants* |
| insights_aggregates(int) | definer | 20261004300000:247 | k-anonymised weekly aggregates as jsonb | db_followup_language, grants*, insights_aggregates |
| invite_redeem_by_code(uuid,text,bytea,text[],text[],text[]) | definer | 20261028010000:72 | redeem or peek an invite code with brakes | access_matrix, function_rpc_contract, grants* +1 |
| ops_alert_claim(text,int) | definer | 20261004200000:299 | claim an alert cooldown slot | grants*, ops_deletion_worker |
| ops_alert_reset(text) | definer | 20261004200000:311 | reset an alert cooldown | grants*, ops_deletion_worker |
| ops_apple_token_delete(uuid) | definer | 20261004200000:346 | delete a stored Apple token | grants*, ops_deletion_worker |
| ops_apple_token_get(uuid) | definer | 20261004200000:340 | read a stored Apple token (worker) | grants*, ops_deletion_worker |
| ops_apple_token_put(uuid,text,int,text) | definer | 20261004200000:331 | store an encrypted Apple token | grants*, ops_deletion_worker |
| ops_audit_write(text,text,text,text,uuid,uuid,uuid,jsonb) | definer | 20261004200000:380 | write a runbook access row | audit_append_only, grants*, ops_deletion_worker |
| ops_consume_forget_quota(uuid,int) | definer | 20261004200000:317 | count an analytics-forget call | grants*, ops_deletion_worker |
| ops_deletion_consent_records(uuid) | definer | 20261108010000:96 | consent rows for a deletion request | deletion_subject_hash, grants*, ops_deletion_worker |
| ops_deletion_contributors(uuid) | definer | 20261004200000:251 | contributors to tell about a deletion | grants*, ops_deletion_worker |
| ops_deletion_request_status(uuid) | definer | 20261004200000:557 | status of a request | grants*, ops_deletion_worker |
| ops_deletion_residue(uuid,text) | definer | 20261016000000:2007 | residue scan after a deletion phase | audio_backup_purge, former_member_purge, grants* +3 |
| ops_deletion_sla(timestamptz) | definer | 20261023020000:345 | deletion SLA report | former_member_purge, grants*, ops_deletion_worker +2 |
| ops_deletion_work(int) | definer | 20261004200000:120 | requests due for the worker | grants*, ops_deletion_worker |
| ops_incident_scope(jsonb) | definer | 20261016000000:1726 | counts for an incident scope | grants*, ops_deletion_worker, sync_v1_server |
| ops_ledger_between(timestamptz,timestamptz,int) | definer | 20261004200000:355 | purge ledger rows for the daily copy | grants*, ops_deletion_worker |
| ops_merge_deletion_receipt(uuid,jsonb) | definer | 20261004200000:152 | merge a worker receipt part | grants*, ops_deletion_worker |
| ops_raw_sha(jsonb,int,timestamptz) | definer | 20261004200000:584 | raw_sha256 checks for a restore | grants*, ops_deletion_worker |
| ops_replay_ledger(jsonb) | definer | 20261016000000:1669 | replay purges after a restore | audio_backup_purge, former_member_purge, grants* +2 |
| ops_retention(timestamptz) | definer | 20261004200000:363 | ops log and quota retention | audit_append_only, grants*, ops_deletion_worker |
| ops_row_counts() | definer | 20261004200000:566 | row counts per table | grants*, ops_deletion_worker |
| ops_schema_health() | definer | 20261004200000:594 | schema health summary | grants*, ops_deletion_worker |
| ops_set_child_photo_path(uuid,text,text) | definer | 20261004200000:261 | set a book photo path | data_governance, grants*, ops_deletion_worker |
| ops_storage_owned_by(uuid,int) | definer | 20261004200000:183 | storage objects owned by a person | grants*, ops_deletion_worker |
| ops_storage_queue_due(int,uuid) | definer | 20261004200000:169 | purge queue rows due | grants*, ops_deletion_worker |
| ops_storage_residue(uuid,int) | definer | 20261004200000:206 | storage residue for a person | grants*, ops_deletion_worker |
| prepare_account_purge(uuid) | definer | 20261023020000:248 | delete the account's own rows, queue storage | access_matrix, audio_backup_escrow, audio_backup_purge +8 |
| purge_due(timestamptz,int) | definer | 20261108020000:115 | hourly purge: books, letters, retention | access_matrix, audio_backup_purge, audit_append_only +13 |
| record_deletion_step(uuid,text,text,text) | definer | 20261003020000:57 | record a deletion step outcome | access_matrix, grants*, purge_batching |
| record_purge_attempt(bigint,boolean,text) | definer | 20261003020000:46 | record a storage purge attempt | access_matrix, grants*, ops_deletion_worker +1 |
| subscription_retention_purge(timestamptz) | definer | 20261016001000:507 | delete consent rows after 3 years | access_matrix, consent_grants_tightening, consent_service_role +2 |
| sync_begin_epoch(text,timestamptz) | definer | 20261004100000:143 | start a restore epoch | access_matrix, grants*, sync_engine |
| sync_housekeeping(timestamptz,int) | definer | 20261015000000:749 | trim receipts, windows, idempotency keys | access_matrix, db_followup_idempotency_rates, grants* +2 |

## Internal helpers (no role may call; reached from other definer functions or policies)

| Function | Runs as | Latest definition | Purpose | Tests naming it |
|---|---|---|---|---|
| ops.audit_log_guard() | invoker | 20261004200000:50 | trigger: append-only guard | none |
| ops.audit_log_no_truncate() | invoker | 20261108020000:94 | trigger: block truncate | audit_append_only |
| audit(text,text,uuid,uuid,jsonb) | definer | 20261002020000:332 | write an audit_events row (definer, no role may call) | access_matrix, audit_append_only, data_governance +4 |
| backup_account_deleting(uuid) | definer | 20261023000000:171 | is an account deletion open | access_matrix |
| backup_entry_exists(uuid,uuid,uuid) | definer | 20261023000000:188 | does the letter still exist | access_matrix, audio_backup |
| backup_escrow_key_trusted(int) | invoker | 20261023000000:165 | is the escrow key version trusted | access_matrix |
| backup_forget_entry(uuid) | definer | 20261023000000:641 | drop backups of a letter | access_matrix |
| backup_recent_sign_in() | definer | 20261023000000:221 | recent sign-in check for restores | access_matrix |
| backup_row_held(uuid,uuid,uuid) | definer | 20261023000000:197 | legal hold check for a backup row | access_matrix, purge_legal_holds |
| backup_session_live(uuid,uuid) | definer | 20261023000000:206 | is the session still live | access_matrix |
| backup_switch_on(text) | invoker | 20261023000000:157 | is a backup switch on | access_matrix |
| book_kept_authors(uuid) | definer | 20261023010000:101 | former members whose rows stay | access_matrix, former_member_purge |
| book_purge_held(uuid) | definer | 20261023020000:80 | does a hold stop a book purge | access_matrix, perf |
| contributors_enabled() | invoker | 20261015010000:121 | is the family switch on | access_matrix, harness*, v1_gate_coparent |
| create_child_row(uuid,uuid,text,date,date) | definer | 20261109000000:58 | insert a book row with its parent | access_matrix, child_name_optional, children_entitlements |
| enqueue_storage_purge(text,text,boolean,text,uuid) | definer | 20261003020000:30 | queue a storage object or prefix | access_matrix, ops_deletion_worker, purge_batching |
| entry_is_held(uuid) | definer | 20261002020000:300 | does a hold cover a letter | access_matrix |
| escrow_approvers(uuid,uuid) | definer | 20261023000000:1169 | devices that may approve | access_matrix |
| escrow_load_wraps(uuid,uuid,uuid,uuid) | definer | 20261023000000:1322 | load book wraps for an unwrap (escrow only) | access_matrix, audio_backup_escrow |
| escrow_long_hold(uuid,uuid) | definer | 20261023000000:1179 | does the long hold apply | access_matrix |
| escrow_open_request(uuid,uuid,uuid,text,bytea,jsonb) | definer | 20261023000000:1224 | open a restore request (escrow only) | access_matrix, audio_backup_escrow, audio_backup_purge |
| escrow_record_unwraps(uuid,uuid,uuid,jsonb,text) | definer | 20261023000000:1374 | log unwraps (escrow only) | access_matrix, audio_backup_escrow |
| escrow_request_context(uuid,uuid) | definer | 20261023000000:1196 | context for a restore request | access_matrix, audio_backup_escrow |
| escrow_request_ready(restore_requests) | invoker | 20261023000000:1299 | is a request ready | none |
| escrow_require_on() | invoker | 20261023000000:1156 | raise unless escrow is on | access_matrix |
| escrow_require_session(uuid,uuid) | definer | 20261023000000:1187 | raise unless the session is live | access_matrix |
| escrow_rewrap_key(uuid,uuid,int,int,int,bytea,text) | definer | 20261023000000:1469 | rewrap a book key to a new escrow key | access_matrix, audio_backup_escrow |
| escrow_rotation_batch(int,int,uuid,uuid,int,int) | definer | 20261023000000:1446 | batch for a rotation | access_matrix, audio_backup_escrow |
| escrow_rotation_failed(uuid,uuid,int,int,int,text) | definer | 20261023000000:1500 | log a failed rewrap | access_matrix, audio_backup_escrow |
| escrow_rotation_notice_sent(uuid,boolean) | definer | 20261023000000:1546 | mark a rotation email sent | access_matrix, audio_backup_escrow |
| escrow_rotation_notices_due(int,int) | definer | 20261023000000:1528 | rotation emails due | access_matrix, audio_backup_escrow |
| escrow_rotation_on(int,int) | invoker | 20261023000000:243 | is a rotation on | access_matrix |
| escrow_set_request_state(uuid,uuid,text) | definer | 20261023000000:1412 | move a restore request state | access_matrix, audio_backup_escrow |
| family_share_consent_required() | invoker | 20261015020000:96 | is family-share consent required | access_matrix, v1_gate_coparent |
| handle_new_user() | definer | 20260930000000:27 | trigger on auth.users: create the profile | rls |
| idempotency_claim(uuid,text,jsonb) | invoker | 20261005000000:165 | claim a request key (invoker) | access_matrix |
| idempotency_store(uuid,text,jsonb) | invoker | 20261005000000:198 | store the first result (invoker) | access_matrix |
| invite_policy_checks(uuid,text) | definer | 20261015020000:103 | invite role and consent checks | access_matrix |
| invite_token_well_formed(text) | invoker | 20261015010000:131 | token shape check | access_matrix |
| is_held(text,uuid) | definer | 20261002020000:295 | does a hold cover a scope id | access_matrix, perf |
| max_parents_per_book() | invoker | 20261005000000:75 | parent cap constant | access_matrix, db_followup_family_cap, security_family +3 |
| purge_backoff(int) | invoker | 20261003020000:41 | retry delay by attempts | access_matrix |
| purge_book_keep_authors(uuid,uuid[],text,uuid) | definer | 20261023010000:113 | purge a book but keep former members' rows | access_matrix, purge_legal_holds |
| request_idempotency_key() | invoker | 20261005000000:136 | read the request key header | access_matrix, db_followup_idempotency_rates |
| subscription_instant(jsonb,boolean) | invoker | 20261016001000:227 | validate a status timestamp | access_matrix |
| subscription_rate_hit(uuid,text) | invoker | 20261016001000:193 | count a status call | access_matrix |
| subscription_report_switch() | invoker | 20261016001000:215 | raise unless reporting is on | access_matrix |

## insights schema helpers (service_role executes the k helpers and language_mix_available; _language_counts has no grant)

| Function | Runs as | Latest definition | Purpose | Tests naming it |
|---|---|---|---|---|
| insights._language_counts() | definer | 20261005000000:1176 |  | db_followup_language, insights_aggregates |
| insights.k(n bigint) | invoker | 20261004300000:50 |  | audio_backup_escrow, audio_backup_purge, auth_config +13 |
| insights.k_min() | invoker | 20261004300000:46 |  | insights_aggregates |
| insights.k_part(part bigint,total bigint) | invoker | 20261004300000:57 |  | none |
| insights.language_mix_available() | definer | 20261004300000:187 |  | db_followup_language |
| insights.language_mix_rows() | definer | 20261004300000:216 |  | none |

## Untested by name

`k_part`, `language_mix_rows`, `audit_log_guard` and `escrow_request_ready` are named in no test file [V grep]. They are exercised through `insights_aggregates`, the audit append-only test and the restore tests respectively; no test pins them directly. Gap G-18, low risk.

## Questions for the council

- Q-e1 (CISO) Add `AUTHENTICATED_FUNCTIONS` to `grants.mjs`. Default: yes, owner `qa`, listing the 55 above; `data-architect` supplies the list.
- Q-e2 (CDO) `sync_push` is an invoker function and relies on direct table grants for `entries`, `held_drafts` and `child_member_prefs`. Default: keep as is; moving it to definer would widen what a bug can reach.
