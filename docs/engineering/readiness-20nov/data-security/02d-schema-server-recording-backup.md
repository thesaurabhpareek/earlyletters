# 02d Schema reference: recording backup, key escrow and the ops schema

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); all 31 files in `supabase/migrations` loaded into the test harness (`supabase/tests/harness.mjs`, PGlite) and read back from the catalogs [V]. Nothing was applied to a hosted project. Part of the 02 schema reference: 02a books and letters, 02b governance, 02c sync, plan status and insights, 02d recording backup, escrow and ops, 02e functions, 02f triggers, buckets and storage rules, 02g phone database scribe.db, 02h other phone stores, 02i designed, not built.

## How to read a table block

- Levels are the names in `docs/legal/DATA_CLASSIFICATION.md` section 1: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. The L cell is the first token of the column comment in the migration; `-` means no comment (a gap).
- Roles: `au` is a signed-in, non-anonymous person (every table carries a restrictive policy that refuses anonymous sessions); `anon` is signed out; `svc` is `service_role`. `fn` means no direct grant: the column is reached only through the security definer functions named in Written by and Read by. `svc` holds no table grant in `public`, `ops` or `sync_private` (`supabase/tests/grants.mjs:5-11`), so it acts only through the functions in 02e; it has SELECT on the six published `insights` views (shown as `svc` in Read).
- Read `au` and Write `au:I`, `au:U`, `au:IU` are column privileges (INSERT, UPDATE) read from the catalog; the rows a person can reach are in the Row scope line. Write is the privilege only: triggers (`entries_guard_immutable`, `client_content_gate`, `entries_family_rules`, `entries_set_sync_xid`, `touch_updated_at`) decide what a client can truly set, and the Note marks columns a trigger or generation sets (server-set).
- Retention, Deletion path and Tests are per table and apply to every column unless the Note or the Deletion path names the column (for example "set null at deletion").
- Written by and Read by are found by searching the final function bodies for insert, update, delete, from and join on the table [V, automated; dynamic SQL would be missed].
- Tests are the files in `supabase/tests` that name the table. A name is not proof of an allow case and a deny case for each policy (Gap G-7 in 01a).
- Default cells are shortened; the migration is the source for the exact expression.

Tables behind the encrypted recording backup (migration `20261023000000_backup_server.sql`; the feature flag is off, the schema exists), then the operator schema `ops` (migration `20261004200000_ops_deletion_worker.sql`, service functions only).

## Tables

### public.audio_blobs (table, 13 columns)

- What: One row per encrypted recording backup (the file is in the entry-audio bucket). wrapped_file_key is L4. Created at `20261023000000:277`.
- Levels: L2 x7, L3 x5, L4 x1. RLS: on. Owner agent: sync, security-architect.
- Table grants: anon none; au SELECT; svc none. Row scope for au: owner (audio_blobs_own); authenticated holds SELECT on all 13 columns including wrapped_file_key (explicit_grants).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; audio_blobs_own select [authenticated] (author_id = auth.uid()).
- Written by: backup_forget_entry, backup_begin, ops_replay_ledger, backup_discard, backup_svc_sweep, purge_book_keep_authors, backup_confirm, backup_delete_all. Read by: ops_incident_scope, backup_object_writable, purge_due, backup_object_readable, book_kept_authors, prepare_account_purge, book_purge_held.
- Keys: (entry_id); FK (author_id) -> profiles(id) del cascade; (child_id, author_id, key_version) -> child_keys(child_id, profile_id, key_version) del cascade; (child_id) -> children(id) del cascade. Indexes: audio_blobs_author_idx, audio_blobs_child_idx, audio_blobs_key_idx, audio_blobs_object_path_key (unique).
- Retention: Until the letter is purged, the held letter discarded, the backup deleted or the account deleted; pending rows 24 hours; orphan rows 30 days (backup_svc_sweep, 20261023000000:1580-1590).
- Deletion path: backup_discard, backup_delete_all, backup_forget_entry trigger, sweep; each enqueues the object path.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_purge, former_member_purge, grants*, purge_legal_holds, sync_v1_server, v1_wire_contract.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| entry_id | uuid | no |  | L3 | au | fn | the letter (draft) id; also the object name |
| child_id | uuid | no |  | L3 | au | fn | book |
| author_id | uuid | no |  | L3 | au | fn | author and only reader |
| object_path | text | no |  | L3 | au | fn | exact object path {child}/{author}/{entry}.m4a.enc; ids only |
| key_version | integer | no |  | L2 | au | fn | book key version the file key is wrapped under |
| wrapped_file_key | bytea | no |  | L4 | au | fn | file key wrapped by the book key (useless without the book key) |
| cipher_sha256 | bytea | yes |  | L3 | au | fn | SHA-256 of the ciphertext, for transfer checks; never of the original |
| bytes | bigint | no |  | L2 | au | fn | ciphertext size |
| format_version | smallint | no | 1 | L2 | au | fn | object format version |
| state | text | no | 'pending' | L2 | au | fn | pending or confirmed |
| created_at | timestamptz | no | now() | L2 | au | fn | created |
| updated_at | timestamptz | no | now() | L2 | au | fn | [server-set: a trigger or generation decides] updated |
| confirmed_at | timestamptz | yes |  | L2 | au | fn | confirmed |

### public.backup_devices (table, 8 columns)

- What: Phones enrolled for recording backup restore; public key only. Created at `20261023000000:250`.
- Levels: L2 x5, L3 x3. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: owner, but authenticated has no grant so reads go through functions.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; backup_devices_own select [authenticated] (profile_id = auth.uid()).
- Written by: backup_register_device, backup_pending_requests, backup_revoke_device. Read by: escrow_approvers, escrow_long_hold, escrow_open_request, backup_approve_request, backup_cancel_request, escrow_load_wraps, escrow_request_context.
- Keys: (device_id); FK (profile_id) -> profiles(id) del cascade. Indexes: backup_devices_profile_idx, backup_devices_public_key_key (unique).
- Retention: Until account deletion.
- Deletion path: cascade from profile; revoked_at set by backup_revoke_device.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| device_id | uuid | no |  | L3 | fn | fn | random id the install made; not a hardware id |
| profile_id | uuid | no |  | L3 | fn | fn | owner |
| public_key | bytea | no |  | L3 | fn | fn | X25519 public key (32 bytes); the private key never leaves the device |
| platform | text | no | 'ios' | L2 | fn | fn | ios |
| enrolled_at | timestamptz | no | now() | L2 | fn | fn | when the device registered |
| last_seen_at | timestamptz | no | now() | L2 | fn | fn | last backup call from this device (the 90-day enrolled rule) |
| revoked_at | timestamptz | yes |  | L2 | fn | fn | when the device was revoked |
| revoked_reason | text | yes |  | L2 | fn | fn | owner, not_me or deletion |

### public.backup_usage (table, 6 columns)

- What: Quota and call counters for backup. Created at `20261023000000:299`.
- Levels: L2 x5, L3 x1. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: owner, inert (no grant).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; backup_usage_own select [authenticated] (profile_id = auth.uid()).
- Written by: backup_begin, audio_blobs_after_change. Read by: no function.
- Keys: (profile_id); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: Until account deletion.
- Deletion path: cascade from profile.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | account |
| quota_bytes | bigint | no | '5368709120'::bigint | L2 | fn | fn | quota (5 GiB by default; support may raise it) |
| used_bytes | bigint | no | 0 | L2 | fn | fn | bytes of pending and confirmed objects |
| begin_window_start | timestamptz | no | now() | L2 | fn | fn | start of the current hour window |
| begin_window_hits | integer | no | 0 | L2 | fn | fn | backup_begin calls that made a row in the window |
| updated_at | timestamptz | no | now() | L2 | fn | fn | [server-set: a trigger or generation decides] updated |

### public.child_keys (table, 8 columns)

- What: Per-book key material. escrow_wrap is the book key sealed to the escrow public key (L4); the phone cannot select it. Created at `20261023000000:263`.
- Levels: L2 x4, L3 x3, L4 x1. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none at table level, column SELECT on 7 of 8; svc none. Row scope for au: owner (child_keys_own); column grant leaves out escrow_wrap (grants.mjs COLUMNS).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; child_keys_own select [authenticated] (profile_id = auth.uid()).
- Written by: purge_book_keep_authors, backup_delete_all, backup_store_key, escrow_rewrap_key. Read by: backup_begin, ops_incident_scope, escrow_open_request, prepare_account_purge, book_purge_held, escrow_load_wraps, escrow_record_unwraps, escrow_request_context, escrow_rotation_batch, escrow_rotation_failed.
- Keys: (child_id, profile_id, key_version); FK (child_id) -> children(id) del cascade; (profile_id) -> profiles(id) del cascade. Indexes: child_keys_escrow_version_idx, child_keys_profile_idx.
- Retention: Until account deletion or the book's purge.
- Deletion path: cascade from profile or book; backup_delete_all.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge, former_member_purge, grants*, ops_deletion_worker, purge_legal_holds, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| child_id | uuid | no |  | L3 | au | fn | book |
| profile_id | uuid | no |  | L3 | au | fn | author whose recordings this key protects |
| key_version | integer | no |  | L2 | au | fn | book key version |
| escrow_wrap | bytea | no |  | L4 | fn | fn | book key sealed to the escrow public key (HPKE); opened only inside the escrow function |
| escrow_key_version | integer | no |  | L2 | au | fn | escrow public key version the wrap targets |
| key_check | bytea | yes |  | L3 | au | fn | 16-byte HMAC under the book key (S05 client): tells a phone whether its local key is the one ... |
| created_at | timestamptz | no | now() | L2 | au | fn | created |
| rewrapped_at | timestamptz | yes |  | L2 | au | fn | last escrow key rotation of this row |

### public.restore_requests (table, 17 columns)

- What: A request to restore recordings to a new phone; held for a waiting period. Created at `20261023000000:308`.
- Levels: L2 x12, L3 x5. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: owner, inert (no grant); functions return it.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; restore_requests_own select [authenticated] (profile_id = auth.uid()).
- Written by: deletion_requests_backup_cancel, escrow_open_request, backup_svc_sweep, backup_svc_stop, backup_approve_request, backup_cancel_request, backup_delete_all, backup_revoke_device, escrow_load_wraps, escrow_set_request_state. Read by: backup_pending_requests, escrow_record_unwraps, escrow_request_context.
- Keys: (id); FK (approved_by_device) -> backup_devices(device_id) del set null; (device_id) -> backup_devices(device_id) del cascade; (profile_id) -> profiles(id) del cascade. Indexes: restore_requests_one_open_per_device (unique), restore_requests_profile_idx, restore_requests_stop_token_hash_key (unique).
- Retention: 90 days after a final state (backup_svc_sweep).
- Deletion path: cascade from profile.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L3 | fn | fn | request |
| profile_id | uuid | no |  | L3 | fn | fn | account |
| device_id | uuid | no |  | L3 | fn | fn | the requesting device |
| state | text | no | 'requested' | L2 | fn | fn | requested, approved, released, cancelled or expired |
| requested_at | timestamptz | no | now() | L2 | fn | fn | requested |
| hold_until | timestamptz | no |  | L2 | fn | fn | earliest release without an approval |
| notified_at | timestamptz | yes |  | L2 | fn | fn | when the request email went to the account address |
| approved_by_device | uuid | yes |  | L3 | fn | fn | enrolled device that approved |
| approved_at | timestamptz | yes |  | L2 | fn | fn | approved |
| released_at | timestamptz | yes |  | L2 | fn | fn | released |
| cancelled_at | timestamptz | yes |  | L2 | fn | fn | cancelled |
| cancel_source | text | yes |  | L2 | fn | fn | stop_link, enrolled_device, owner or deletion |
| expired_at | timestamptz | yes |  | L2 | fn | fn | expired |
| request_id | text | yes |  | L2 | fn | fn | the x-request-id of the call that made the request |
| stop_token_hash | bytea | no |  | L3 | fn | fn | SHA-256 of the single-use stop link token |
| stop_token_expires_at | timestamptz | no |  | L2 | fn | fn | stop link expiry (7 days) |
| stop_used_at | timestamptz | yes |  | L2 | fn | fn | when the stop link was used |

### public.restore_approvals (table, 6 columns)

- What: A sealed one-time code for one enrolled device to approve a restore. Created at `20261023000000:334`.
- Levels: L2 x2, L3 x4. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: owner via request, inert (no grant).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; restore_approvals_own select [authenticated] (EXISTS ( SELECT 1 FROM restore_requests r WHERE ((r.id = restore_approvals.request_id) AND (r.profile_id = au.
- Written by: escrow_open_request, backup_approve_request. Read by: backup_pending_requests.
- Keys: (request_id, device_id); FK (device_id) -> backup_devices(device_id) del cascade; (request_id) -> restore_requests(id) del cascade. Indexes: restore_approvals_device_idx.
- Retention: With its request.
- Deletion path: cascade from request or device.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| request_id | uuid | no |  | L3 | fn | fn | request |
| device_id | uuid | no |  | L3 | fn | fn | enrolled device the code is sealed to |
| sealed_code | bytea | no |  | L3 | fn | fn | random code sealed to that device (HPKE); only that device can open it |
| code_hash | bytea | no |  | L3 | fn | fn | SHA-256 of the code |
| created_at | timestamptz | no | now() | L2 | fn | fn | created |
| used_at | timestamptz | yes |  | L2 | fn | fn | when the code approved the request |

### public.escrow_unwraps (table, 12 columns)

- What: Append-only log of every key unwrap; ids, reason, outcome, times; no key bytes. Created at `20261023000000:345`.
- Levels: L2 x7, L3 x5. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: owner (escrow_unwraps_own), inert (no grant).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; escrow_unwraps_own select [authenticated] (profile_id = auth.uid()).
- Written by: profiles_pseudonymise_escrow_unwraps, backup_svc_sweep, escrow_record_unwraps, escrow_rewrap_key, escrow_rotation_failed. Read by: backup_svc_unwraps_between, escrow_load_wraps, escrow_set_request_state.
- Keys: (id); FK (profile_id) -> profiles(id). Indexes: escrow_unwraps_occurred_idx, escrow_unwraps_profile_idx, escrow_unwraps_request_idx.
- Retention: 24 months (backup_svc_sweep), as built; D-021 says 12, open with counsel (default 24); daily copy in ops-ledger/escrow 60 days.
- Deletion path: profile_id set null and subject_hash set at account deletion (trigger profiles_pseudonymise_escrow_unwraps).
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | bigint | no |  | L2 | fn | fn | row |
| profile_id | uuid | yes |  | L3 | fn | fn | account; null after account deletion (pseudonymised, kept 24 months) |
| subject_hash | bytea | yes |  | L3 | fn | fn | peppered SHA-256 of the deleted account id (same pepper as policy_acceptances) |
| device_id | uuid | yes |  | L3 | fn | fn | device the key was sealed to (restore) |
| child_id | uuid | no |  | L3 | fn | fn | book |
| key_version | integer | no |  | L2 | fn | fn | book key version |
| escrow_key_version | integer | no |  | L2 | fn | fn | escrow key version used to open it |
| reason | text | no |  | L2 | fn | fn | restore, rotation or legal |
| outcome | text | no |  | L2 | fn | fn | opened or failed |
| restore_request_id | uuid | yes |  | L3 | fn | fn | restore request (restore only) |
| request_id | text | yes |  | L2 | fn | fn | x-request-id of the call |
| occurred_at | timestamptz | no | now() | L2 | fn | fn | when |

### public.escrow_rotation_notices (table, 6 columns)

- What: One email to send per account per escrow key rotation. Created at `20261023000000:367`.
- Levels: L2 x5, L3 x1. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: no role; table privileges revoked.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au.
- Written by: backup_svc_sweep, escrow_rotation_notice_sent, escrow_rewrap_key. Read by: escrow_rotation_notices_due.
- Keys: (id); FK (profile_id) -> profiles(id) del cascade. Indexes: escrow_rotation_notices_due_idx, escrow_rotation_notices_profile_id_to_version_key (unique).
- Retention: 90 days after sent_at; unsent rows stay until sent.
- Deletion path: cascade from profile.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | notice (also the email idempotency key) |
| profile_id | uuid | no |  | L3 | fn | fn | account |
| to_version | integer | no |  | L2 | fn | fn | escrow key version the account moved to |
| created_at | timestamptz | no | now() | L2 | fn | fn | created |
| attempts | integer | no | 0 | L2 | fn | fn | failed sends |
| sent_at | timestamptz | yes |  | L2 | fn | fn | when the email went |

### ops.audit_log (table, 10 columns)

- What: Operator runbook access log (who looked at what, why). Append-only (ops.audit_log_guard). Created at `20261004200000:33`.
- Levels: L2 x6, L3 x4. RLS: on. Owner agent: ops, security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: no role; service functions only (ops_audit_write).
- Written by: ops_retention, ops_audit_write. Read by: no function.
- Keys: (id). Indexes: audit_log_at_idx.
- Retention: 12 months (ops_retention), kept after the person's deletion as a security log.
- Deletion path: same sweep; never edited.
- Tests (files that name it): audit_append_only, ops_deletion_worker.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | bigint | no |  | L2 | fn | fn | row id |
| at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| operator | text | no |  | L3 | fn | fn | staff handle |
| runbook | text | no |  | L2 | fn | fn | enum |
| reason_code | text | no |  | L2 | fn | fn | enum-like code |
| ticket | text | no |  | L2 | fn | fn | ticket reference, never content |
| target_profile | uuid | yes |  | L3 | fn | fn | person id (kept 12 months, also after account deletion: security log) |
| target_child | uuid | yes |  | L3 | fn | fn | book id |
| target_entry | uuid | yes |  | L3 | fn | fn | letter id |
| detail | jsonb | no | '{}' | L2 | fn | fn | enums and counts only, 512 bytes |

### ops.alert_state (table, 3 columns)

- What: Cooldown for operator alert emails. Created at `20261004200000:62`.
- Levels: L1 x1, L2 x2. RLS: on. Owner agent: ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: ops_alert_claim, ops_alert_reset. Read by: no function.
- Keys: (kind). Indexes: primary key only.
- Retention: Few rows; no sweep.
- Deletion path: ops_alert_reset.
- Tests (files that name it): ops_deletion_worker.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| kind | text | no |  | L1 | fn | fn | alert kind |
| last_sent_at | timestamptz | yes |  | L2 | fn | fn | system timestamp |
| sends | integer | no | 0 | L2 | fn | fn | count |

### ops.apple_tokens (table, 6 columns)

- What: Encrypted Apple refresh token, kept only to revoke Sign in with Apple at deletion. AAD is the profile id. Created at `20261004200000:75`.
- Levels: L1 x1, L2 x3, L3 x1, L4 x1. RLS: on. Owner agent: security-architect.
- Table grants: anon none; au none; svc none. Row scope for au: no role; ops_apple_token_get returns it to the worker only.
- Written by: ops_apple_token_delete, ops_apple_token_put. Read by: ops_apple_token_get.
- Keys: (profile_id); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: Until the account is deleted.
- Deletion path: ops_apple_token_delete in the deletion worker; cascade from profile.
- Tests (files that name it): backup_role, ops_deletion_worker.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | person id |
| ciphertext | text | no |  | L4 | fn | fn | secret: Apple refresh token, AES-256-GCM under TOKEN_KEK_V<key_version>, AAD = profile id |
| key_version | integer | no |  | L2 | fn | fn | key version |
| client_id | text | no |  | L1 | fn | fn | Apple client id the token was issued to (bundle id or Services ID) |
| created_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| updated_at | timestamptz | no | now() | L2 | fn | fn | [server-set: a trigger or generation decides] system timestamp |

### ops.forget_quota (table, 3 columns)

- What: Daily call count per person to analytics-forget. Created at `20261004200000:68`.
- Levels: L2 x2, L3 x1. RLS: on. Owner agent: ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: ops_consume_forget_quota, ops_retention. Read by: no function.
- Keys: (profile_id, day); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: 2 days (ops_retention).
- Deletion path: same sweep; cascade from profile.
- Tests (files that name it): ops_deletion_worker.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | person id |
| day | date | no |  | L2 | fn | fn | date |
| calls | integer | no | 0 | L2 | fn | fn | count |


## Gaps found in this file

- G-22 `audio_blobs.wrapped_file_key` (L4) is SELECTable by au on all 13 columns (`explicit_grants`), where `child_keys.escrow_wrap` is left out. Flagged, not decided: the key is wrapped by the book key and the policy limits rows to the owner. `security-architect` decides whether to narrow the grant.
- The backup feature flag (`EXPO_PUBLIC_BACKUP`) is off in the shipped build, so no row of the eight backup tables exists in production use today.
- G-16 `escrow_unwraps` keeps rows 24 months; D-021 says 12 months for key-unwrap logs (open, COUNSEL_PACKET Q51, `DATA_CLASSIFICATION.md` 4.3.1). The daily copy `ops-ledger/escrow/` is made from the table before pseudonymising, so person ids stay in that file up to 60 days after an account is deleted (`backup_svc_unwraps_between` returns `profile`, `subject`, `device`, `child`: `20261023000000:1611`).
- G-8 (14 across the pack) Inert policies: `backup_devices_own`, `backup_usage_own`, `escrow_unwraps_own`, `restore_requests_own`, `restore_approvals_own` (no grant; reads go through functions).

## Questions for the council

- Q-d1 (CLO, CISO) 12 or 24 months for the unwrap log (D-021 against `DATA_CLASSIFICATION.md`). Default: 24, as built, until counsel answers.
- Q-d2 (CPO-privacy) Is the 60-day ops-ledger copy a named exception to "deleted with the account"? Default: yes, listed in 06 by `privacy`.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, branch `docs/decisions-closed-20nov`, until it merges) and the CDO and CISO return (`cdo-ciso.md`, working file, "CDO return"). Gates and numbered gaps: 01a section 8.

- Q-d1: B7 COUNSEL, periods stay "as built, not approved". CDO return: keep 24 months as built (a shortened log is evidence gone for good); the record recommends building the unwrap log at 12 months to match D-021 before apply. These two differ; Karma routes it, and I do not choose. Conflict C-7 stands.
- Q-d2: AGREE (CDO return): list the 60-day ops-ledger copy in 06 as a named exception to "deleted with the account".
- G-8: the five inert policies here are in the list at 01a 8.3.
