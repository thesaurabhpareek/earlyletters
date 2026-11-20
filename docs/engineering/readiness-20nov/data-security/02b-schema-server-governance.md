# 02b Schema reference: server tables for audit, deletion, purge, holds and consent

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); all 31 files in `supabase/migrations` loaded into the test harness (`supabase/tests/harness.mjs`, PGlite) and read back from the catalogs [V]. Nothing was applied to a hosted project. Part of the 02 schema reference: 02a books and letters, 02b governance, 02c sync, plan status and insights, 02d recording backup, escrow and ops, 02e functions, 02f triggers, buckets and storage rules, 02g phone database scribe.db, 02h other phone stores, 02i designed, not built.

## How to read a table block

- Levels are the names in `docs/legal/DATA_CLASSIFICATION.md` section 1: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. The L cell is the first token of the column comment in the migration; `-` means no comment (a gap).
- Roles: `au` is a signed-in, non-anonymous person (every table carries a restrictive policy that refuses anonymous sessions); `anon` is signed out; `svc` is `service_role`. `fn` means no direct grant: the column is reached only through the security definer functions named in Written by and Read by. `svc` holds no table grant in `public`, `ops` or `sync_private` (`supabase/tests/grants.mjs:5-11`), so it acts only through the functions in 02e; it has SELECT on the six published `insights` views (shown as `svc` in Read).
- Read `au` and Write `au:I`, `au:U`, `au:IU` are column privileges (INSERT, UPDATE) read from the catalog; the rows a person can reach are in the Row scope line. Write is the privilege only: triggers (`entries_guard_immutable`, `client_content_gate`, `entries_family_rules`, `entries_set_sync_xid`, `touch_updated_at`) decide what a client can truly set, and the Note marks columns a trigger or generation sets (server-set).
- Retention, Deletion path and Tests are per table and apply to every column unless the Note or the Deletion path names the column (for example "set null at deletion").
- Written by and Read by are found by searching the final function bodies for insert, update, delete, from and join on the table [V, automated; dynamic SQL would be missed].
- Tests are the files in `supabase/tests` that name the table. A name is not proof of an allow case and a deny case for each policy (Gap G-7 in 01a).
- Default cells are shortened; the migration is the source for the exact expression.

Tables that record what happened, delete what must go, hold what must stay, and prove what a person agreed to.

## Tables

### public.audit_events (table, 9 columns)

- What: Append-only trail of membership, deletion and system actions. detail is a jsonb object of at most 512 bytes (20261002020000:327). Created at `20261002020000:310`.
- Levels: L2 x6, L3 x3. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au none; svc none. Row scope for au: no direct read (authenticated has no grant, so audit_events_own is inert); read by ops functions.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; audit_events_own select [authenticated] (actor_id = auth.uid()).
- Written by: audit, accept_child_invite_by_code, purge_due, finalize_account_deletion. Read by: ops_incident_scope, ops_row_counts, ops_deletion_sla.
- Keys: (id). Indexes: audit_events_actor_idx, audit_events_child_idx.
- Retention: 24 months (purge_due step 4, under the app.retention_purge switch).
- Deletion path: actor_id and subject_id (person subjects) set null at finalize_account_deletion; rows never edited (guard trigger, 20261108020000).
- Tests (files that name it): access_matrix, audit_append_only, data_governance, db_followup_family_cap, ops_deletion_worker, security_family, v1_gate_coparent, v1_gate_limits_peek_pepper.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | bigint | no |  | L2 | fn | fn | internal id |
| at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| actor_id | uuid | yes |  | L3 | fn | fn | person id; nulled at account deletion |
| actor_kind | text | no |  | L2 | fn | fn | enum |
| action | text | no |  | L2 | fn | fn | enum |
| subject_type | text | yes |  | L2 | fn | fn | enum |
| subject_id | uuid | yes |  | L3 | fn | fn | subject id (may be a person id; nulled at deletion) |
| child_id | uuid | yes |  | L3 | fn | fn | book id |
| detail | jsonb | no | '{}' | L2 | fn | fn | enums and counts only (512 bytes max) |

### public.deletion_requests (table, 14 columns)

- What: One row per account or book deletion request with a 30-day grace. Created at `20261002020000:385`.
- Levels: L2 x10, L3 x4. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au SELECT; svc none. Row scope for au: own rows (deletion_requests_own).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; deletion_requests_own select [authenticated] (profile_id = auth.uid()).
- Written by: cancel_account_deletion, cancel_book_deletion, request_account_deletion, ops_merge_deletion_receipt, purge_due, prepare_account_purge, request_book_deletion, finalize_account_deletion. Read by: backup_account_deleting, ops_deletion_work, ops_deletion_contributors, ops_deletion_request_status, ops_row_counts, ops_deletion_sla, ops_deletion_consent_records.
- Keys: (id). Indexes: deletion_requests_due_idx, deletion_requests_one_active (unique), deletion_requests_profile_idx.
- Retention: 3 years after completed_at or cancelled_at (purge_due step 4); as built, not approved by counsel.
- Deletion path: profile_id set null and subject_hash set at completion (20261108010000:60); purge_due.
- Tests (files that name it): access_matrix, backup_role, data_governance, db_followup_idempotency_rates, deletion_subject_hash, entries_machine_edits_check, former_member_purge, grants*, ops_deletion_worker, purge_batching, purge_legal_holds, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | au | fn | request id (appears on receipts) |
| kind | text | no |  | L2 | au | fn | enum |
| profile_id | uuid | yes |  | L3 | au | fn | person id; nulled on completion |
| child_id | uuid | yes |  | L3 | au | fn | book id |
| status | text | no | 'scheduled' | L2 | au | fn | enum |
| source | text | no |  | L2 | au | fn | enum |
| requested_at | timestamptz | no | now() | L2 | au | fn | system timestamp |
| scheduled_for | timestamptz | no |  | L2 | au | fn | system timestamp |
| cancelled_at | timestamptz | yes |  | L2 | au | fn | system timestamp |
| executing_at | timestamptz | yes |  | L2 | au | fn | system timestamp |
| completed_at | timestamptz | yes |  | L2 | au | fn | system timestamp |
| had_active_subscription | boolean | yes |  | L3 | au | fn | purchase state of a person |
| receipt | jsonb | no | '{}' | L2 | au | fn | counts and step outcomes, never content |
| subject_hash | bytea | yes |  | L3 | au | fn | pseudonymised person id (peppered SHA-256, same as policy_acceptances), set at completion (BL... |

### public.deletion_request_steps (table, 7 columns)

- What: Worker progress per request step. Created at `20261002020000:412`.
- Levels: L2 x7. RLS: on. Owner agent: ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role directly; ops functions.
- Written by: cancel_account_deletion, request_account_deletion, record_deletion_step, request_book_deletion. Read by: ops_deletion_work, ops_deletion_request_status, ops_deletion_sla.
- Keys: (request_id, step); FK (request_id) -> deletion_requests(id) del cascade. Indexes: deletion_request_steps_due_idx.
- Retention: With its request (cascade).
- Deletion path: cascade.
- Tests (files that name it): access_matrix, purge_batching.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| request_id | uuid | no |  | L2 | fn | fn | request id |
| step | text | no |  | L2 | fn | fn | enum |
| status | text | no | 'pending' | L2 | fn | fn | enum |
| attempts | integer | no | 0 | L2 | fn | fn | count |
| last_error_code | text | yes |  | L2 | fn | fn | HTTP status or error class |
| updated_at | timestamptz | no | now() | L2 | fn | fn | [server-set: a trigger or generation decides] system timestamp |
| next_attempt_at | timestamptz | no | now() | L2 | fn | fn | system timestamp (retry backoff) |

### public.storage_purge_queue (table, 11 columns)

- What: Storage objects or prefixes to delete; the worker drains it. Created at `20261002020000:801`.
- Levels: L2 x10, L3 x1. RLS: on. Owner agent: ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role; service functions only.
- Written by: enqueue_storage_purge, record_purge_attempt, purge_due, prepare_account_purge. Read by: backup_begin, ops_storage_queue_due, ops_deletion_sla.
- Keys: (id); FK (request_id) -> deletion_requests(id) del set null. Indexes: storage_purge_queue_bucket_id_object_path_key (unique), storage_purge_queue_due_idx, storage_purge_queue_request_idx.
- Retention: Done rows 7 days after done_at (purge_due step 5).
- Deletion path: same sweep; request_id set null when the request goes.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_purge, data_governance, former_member_purge, pg_temp_search_path, purge_batching, purge_legal_holds, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | bigint | no |  | L2 | fn | fn | internal id |
| bucket_id | text | no |  | L2 | fn | fn | bucket name |
| object_path | text | no |  | L3 | fn | fn | object path (contains book and person ids) |
| is_prefix | boolean | no | false | L2 | fn | fn | flag |
| reason | text | no |  | L2 | fn | fn | enum |
| request_id | uuid | yes |  | L2 | fn | fn | request id |
| enqueued_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| attempts | integer | no | 0 | L2 | fn | fn | count |
| done_at | timestamptz | yes |  | L2 | fn | fn | system timestamp |
| next_attempt_at | timestamptz | no | now() | L2 | fn | fn | system timestamp (retry backoff) |
| last_error_code | text | yes |  | L2 | fn | fn | HTTP status or error class |

### public.purge_ledger (table, 3 columns)

- What: Ids of purged records so a restore can replay the deletions. No content. Created at `20261002020000:817`.
- Levels: L2 x2, L3 x1. RLS: on. Owner agent: ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role; service functions only.
- Written by: erase_entry, ops_replay_ledger, audio_blobs_after_change, purge_due, purge_book_keep_authors, prepare_account_purge, held_drafts_note_gone, finalize_account_deletion. Read by: backup_begin, entries_not_purged, ops_ledger_between, ops_row_counts, erasure_recorded, create_child_row, photo_entry_is_purged.
- Keys: (entity_type, entity_id). Indexes: primary key only.
- Retention: 60 days (purge_due step 5).
- Deletion path: same sweep; the daily copy in the ops-ledger bucket is kept 60 days.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_purge, backup_role, data_governance, deletion_subject_hash, former_member_purge, ops_deletion_worker, pg_temp_search_path, purge_batching, purge_legal_holds, sync_engine, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| entity_type | text | no |  | L2 | fn | fn | enum |
| entity_id | text | no |  | L3 | fn | fn | id of a purged letter, book, person or object path |
| purged_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |

### public.legal_holds (table, 10 columns)

- What: Holds that stop a purge. Placed and released by staff runbook only. Created at `20261002020000:280`.
- Levels: L2 x5, L3 x5. RLS: on. Owner agent: legal, ops.
- Table grants: anon none; au none; svc none. Row scope for au: no role; read by hold-check functions.
- Written by: no function. Read by: is_held, prepare_account_purge, ops_deletion_sla, book_purge_held.
- Keys: (id). Indexes: legal_holds_active_idx.
- Retention: No sweep: released rows stay. Gap G-5 (question for counsel).
- Deletion path: none.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_purge, data_governance, former_member_purge, ops_deletion_worker, purge_legal_holds, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | internal id |
| scope | text | no |  | L2 | fn | fn | enum |
| scope_id | uuid | no |  | L3 | fn | fn | person, book or letter id |
| reason_code | text | no |  | L3 | fn | fn | enum (reveals that a person is subject to legal process) |
| matter_ref | text | no |  | L3 | fn | fn | ticket reference, never content |
| placed_by | text | no |  | L3 | fn | fn | staff identity |
| placed_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| review_by | date | no |  | L2 | fn | fn | date |
| released_at | timestamptz | yes |  | L2 | fn | fn | system timestamp |
| released_by | text | yes |  | L3 | fn | fn | staff identity |

### public.policy_documents (table, 3 columns)

- What: Names of published legal documents. Created at `20261002020000:574`.
- Levels: L1 x3. RLS: on. Owner agent: privacy.
- Table grants: anon none; au none; svc none. Row scope for au: anyone, signed in or not (policy_documents_read), but no role holds a SELECT grant on this table, so the policy is inert; clients read policy_versions.
- Policies: policy_documents_read select [anon,authenticated] true.
- Written by: no function. Read by: policy_versions_guard, policy_actions_needed.
- Keys: (key). Indexes: primary key only.
- Retention: Forever.
- Deletion path: none.
- Tests (files that name it): access_matrix, audio_backup, classification, consent_grants_tightening, v1_gate_coparent.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| key | text | no |  | L1 | fn | fn | document key |
| title | text | no |  | L1 | fn | fn | document title |
| needs_affirmative_act | boolean | no |  | L1 | fn | fn | flag |

### public.policy_versions (table, 13 columns)

- What: Published versions of each document, with hash and URL. Created at `20261002020000:580`.
- Levels: L1 x13. RLS: on. Owner agent: privacy.
- Table grants: anon SELECT; au SELECT; svc none. Row scope for au: anyone (policy_versions_read; anon and authenticated hold SELECT).
- Policies: policy_versions_read select [anon,authenticated] true.
- Written by: no function. Read by: has_active_consent, policy_actions_needed, record_policy_act.
- Keys: (document, version); FK (document) -> policy_documents(key). Indexes: primary key only.
- Retention: Forever; guard trigger policy_versions_guard stops edits of a published row.
- Deletion path: none.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge, classification, consent_grants_tightening, explicit_grants, former_member_purge, grants*, harness*, purge_legal_holds, security_family, sync_perf, sync_v1_server, v1_gate_coparent.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| document | text | no |  | L1 | anon+au | fn | document key |
| version | text | no |  | L1 | anon+au | fn | semver |
| major | integer | yes | generated | L1 | anon+au | fn | [server-set: a trigger or generation decides] generated from version |
| minor | integer | yes | generated | L1 | anon+au | fn | [server-set: a trigger or generation decides] generated from version |
| patch | integer | yes | generated | L1 | anon+au | fn | [server-set: a trigger or generation decides] generated from version |
| change_class | text | no |  | L1 | anon+au | fn | enum |
| requires_reconsent | boolean | no |  | L1 | anon+au | fn | flag |
| published_at | timestamptz | no |  | L1 | anon+au | fn | date |
| new_users_from | timestamptz | no |  | L1 | anon+au | fn | date |
| effective_at | timestamptz | no |  | L1 | anon+au | fn | date |
| content_sha256 | bytea | no |  | L1 | anon+au | fn | hash of the published text |
| url | text | no |  | L1 | anon+au | fn | permanent URL |
| summary | text | no |  | L1 | anon+au | fn | plain-language change line |

### public.policy_acceptances (table, 18 columns)

- What: Append-only record of each consent or acknowledgement act. Created at `20261002020000:624`.
- Levels: L2 x15, L3 x3. RLS: on. Owner agent: privacy.
- Table grants: anon none; au SELECT; svc none. Row scope for au: own rows (policy_acceptances_own_read).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; policy_acceptances_own_read select [authenticated] (profile_id = auth.uid()).
- Written by: policy_acceptances_pseudonymise, purge_due, record_policy_act. Read by: has_active_consent, content_gate_state, ops_incident_scope, ops_row_counts, policy_actions_needed, ops_deletion_consent_records.
- Keys: (id); FK (document, version) -> policy_versions(document, version); (profile_id) -> profiles(id) del set null. Indexes: policy_acceptances_doc_version_idx, policy_acceptances_profile_idx, policy_acceptances_pseudonymised_idx, policy_acceptances_subject_idx.
- Retention: 3 years after pseudonymised_at (purge_due step 4); as built, not approved by counsel.
- Deletion path: profile_id set null and subject_hash set when the account goes (trigger policy_acceptances_pseudonymise).
- Tests (files that name it): access_matrix, audit_append_only, backup_role, consent_grants_tightening, consent_record_fields, consent_service_role, data_governance, db_followup_idempotency_rates, deletion_subject_hash, export_reads, grants*, subscription_status, sync_perf, v1_gate_limits_peek_pepper.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | au | fn | internal id |
| profile_id | uuid | yes |  | L3 | au | fn | person id ("user"); nulled at deletion |
| subject_hash | bytea | yes |  | L3 | au | fn | pseudonymised person id (peppered SHA-256) |
| pseudonymised_at | timestamptz | yes |  | L2 | au | fn | retention clock |
| document | text | no |  | L2 | au | fn | document key ("policy") |
| version | text | no |  | L2 | au | fn | document version |
| action | text | no |  | L2 | au | fn | enum |
| method | text | no |  | L2 | au | fn | enum |
| surface | text | no |  | L2 | au | fn | screen id |
| accepted_at | timestamptz | no | now() | L2 | au | fn | server time of the act |
| client_recorded_at | timestamptz | yes |  | L2 | au | fn | device time of the act |
| app_version | text | no |  | L2 | au | fn | app version |
| platform | text | no |  | L2 | au | fn | enum |
| locale | text | yes |  | L3 | au | fn | language of the text shown, not the phone setting (PRIV-R21, BL-577) |
| rendered_sha256 | bytea | yes |  | L2 | au | fn | hash of the consent text shown |
| context | jsonb | no | '{}' | L2 | au | fn | enums only (product, auth method) |
| app_build | text | yes |  | L2 | au | fn | EAS build number that drew the screen (PRIV-R21, BL-577) |
| os_major | smallint | yes |  | L2 | au | fn | major OS version only, for example 17 (PRIV-R21, BL-577) |

### public.my_policy_state (view, 4 columns)

- What: View: the caller's own latest act per document. security_invoker.
- Levels: L2 x4. RLS: n/a (view). Owner agent: privacy.
- Table grants: anon none; au SELECT; svc none. Row scope for au: own rows.
- Written by: no function. Read by: no function.
- Retention: n/a (view).
- Deletion path: n/a.
- Tests (files that name it): access_matrix, classification, consent_grants_tightening, data_governance, explicit_grants, export_reads, grants*, v1_gate_hardening.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| document | text | yes |  | L2 | au | - | document key |
| version | text | yes |  | L2 | au | - | document version |
| action | text | yes |  | L2 | au | - | enum |
| accepted_at | timestamptz | yes |  | L2 | au | - | server time of the act |


## Gaps found in this file

- G-5 `legal_holds`: released rows are never deleted. Counsel sets the period.
- G-8 Inert policies: `audit_events_own` (au has no grant, so a person cannot read their own audit rows, while `DATA_CLASSIFICATION.md` section 2 says users see their own) and `policy_documents_read` (clients read `policy_versions`). Conflict C-4 in 01a.
- G-13 Free-form jsonb columns (`audit_events.detail`, `deletion_requests.receipt`, `policy_acceptances.context`) are limited by size only (512, 2048 and 512 bytes: `20261002020000:327, 399, 645`), not by an allowed key list. "Enums and counts only" holds by review of each caller, not by the database.

## Questions for the council

- Q-b1 (CLO) Retention for released legal holds. Default: keep until counsel names a period; no code change.
- Q-b2 (CPO, CPO-privacy) Should a person see their own audit rows? Default: no; correct `DATA_CLASSIFICATION.md` section 2 (founder merge) rather than add a grant.
- Q-b3 (CDO) Add a key allowlist check to the three jsonb columns? Default: yes, as a new migration with a test, after `privacy` lists the keys. Not started.
