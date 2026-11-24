# 02a Schema reference: server tables for books, members and letters

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); all 31 files in `supabase/migrations` loaded into the test harness (`supabase/tests/harness.mjs`, PGlite) and read back from the catalogs [V]. Nothing was applied to a hosted project. Part of the 02 schema reference: 02a books and letters, 02b governance, 02c sync, plan status and insights, 02d recording backup, escrow and ops, 02e functions, 02f triggers, buckets and storage rules, 02g phone database scribe.db, 02h other phone stores, 02i designed, not built.

## How to read a table block

- Levels are the names in `docs/legal/DATA_CLASSIFICATION.md` section 1: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. The L cell is the first token of the column comment in the migration; `-` means no comment (a gap).
- Roles: `au` is a signed-in, non-anonymous person (every table carries a restrictive policy that refuses anonymous sessions); `anon` is signed out; `svc` is `service_role`. `fn` means no direct grant: the column is reached only through the security definer functions named in Written by and Read by. `svc` holds no table grant in `public`, `ops` or `sync_private` (`supabase/tests/grants.mjs:5-11`), so it acts only through the functions in 02e; it has SELECT on the six published `insights` views (shown as `svc` in Read).
- Read `au` and Write `au:I`, `au:U`, `au:IU` are column privileges (INSERT, UPDATE) read from the catalog; the rows a person can reach are in the Row scope line. Write is the privilege only: triggers (`entries_guard_immutable`, `client_content_gate`, `entries_family_rules`, `entries_set_sync_xid`, `touch_updated_at`) decide what a client can truly set, and the Note marks columns a trigger or generation sets (server-set).
- Retention, Deletion path and Tests are per table and apply to every column unless the Note or the Deletion path names the column (for example "set null at deletion").
- Written by and Read by are found by searching the final function bodies for insert, update, delete, from and join on the table [V, automated; dynamic SQL would be missed].
- Tests are the files in `supabase/tests` that name the table. A name is not proof of an allow case and a deny case for each policy (Gap G-7 in 01a).
- Default cells are shortened; the migration is the source for the exact expression.

Tables a family book is made of: people, books, who belongs, invitations, letters, held drafts, dictionary, and the view members read letters through.

## Tables

### public.profiles (table, 6 columns)

- What: One row per person; id equals the Supabase Auth user id. Made by trigger on_auth_user_created on auth.users, function handle_new_user (20260930000000:27-36). Created at `20260930000000:18`.
- Levels: L2 x3, L3 x3. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au SELECT,UPDATE; svc none. Row scope for au: own row, and the rows of people who share a book with the caller (profiles_self_or_co_guardian).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; profiles_self_or_co_guardian select [authenticated] ((id = auth.uid()) OR (EXISTS ( SELECT 1 FROM (child_members mine JOIN child_members theirs ON ((mine.child_id; profiles_update_self update [authenticated] (id = auth.uid()).
- Written by: handle_new_user, create_child_row, create_first_run_children. Read by: create_child, sync_pull, ops_incident_scope, ops_row_counts, child_members_revoke_invites, sync_books, peek_invite, accept_child_invite_by_code, entries_note_erasure, ops_replay_ledger, held_drafts_note_gone, invite_redeem_by_code, finalize_account_deletion.
- Keys: (id); FK (id) -> auth.users(id) del cascade. Indexes: primary key only.
- Retention: Life of the account.
- Deletion path: auth.users delete cascades the row (FK on delete cascade); account deletion runs prepare_account_purge then finalize_account_deletion (20261108010000:60).
- Tests (files that name it): access_matrix, audio_backup_escrow, children_entitlements, consent_record_fields, explicit_grants, export_profile_read, former_member_purge, grants*, insights_aggregates, invite_redeem_by_code, ops_deletion_worker, perf, rls, security_family, subscription_status, sync_perf, sync_v1_server, v1_gate_limits_peek_pepper.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no |  | L3 | au | au:U | person id (= auth user id) |
| display_name | text | yes |  | L3 | au | au:U | name the person chose |
| signs_as | text | yes |  | L3 | au | au:U | default signature ("Papa") |
| created_at | timestamptz | no | now() | L2 | au | au:U | system timestamp |
| updated_at | timestamptz | no | now() | L2 | au | au:U | [server-set: a trigger or generation decides] system timestamp |
| first_run_closed_at | timestamptz | yes |  | L2 | au | au:U | system timestamp (first-run free batch used) |

### public.children (table, 15 columns)

- What: A child's book. Reading the row by API is limited to 12 columns; date_of_birth, due_date and purged_at are not selectable (column grant, grants.mjs COLUMNS). Created at `20260930000000:39`.
- Levels: L2 x8, L3 x3, L4 x4. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au none at table level, column SELECT on 12 of 15; svc none. Row scope for au: members of the book (children_member_select via is_child_member).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; children_member_select select [authenticated] is_child_member(id); children_member_update update [authenticated] is_child_member(id).
- Written by: cancel_account_deletion, cancel_book_deletion, request_account_deletion, book_update, ops_set_child_photo_path, ops_replay_ledger, purge_due, purge_book_keep_authors, create_child_row, prepare_account_purge, request_book_deletion. Read by: child_members_guard, child_is_live, can_read_entry_photo, create_child_invite, accept_child_invite, create_child, sync_pull, ops_deletion_contributors, ops_incident_scope, ops_row_counts, child_members_revoke_invites, sync_books, accept_child_invite_by_code, undo_parent_join, entries_note_erasure, ops_deletion_sla, create_first_run_children, held_drafts_note_gone, leave_child, remove_child_member.
- Keys: (id); FK (created_by) -> profiles(id) del set null; (deletion_request_id) -> deletion_requests(id) del set null. Indexes: children_created_by_idx, children_deletion_request_idx, children_purged_idx.
- Retention: Until the book is deleted: tombstone 30 days, then purge_due step 1 deletes the row and cascades members, prefs, invites, letters, versions, held drafts, keys, backups (purge_due, 20261108020000:115). A book with a former member's letters keeps the row with purged_at set (20261023010000).
- Deletion path: request_book_deletion, cancel_book_deletion within grace; purge_due; account deletion tombstones sole-parent books (prepare_account_purge).
- Tests (files that name it): access_matrix, audio_backup_escrow, child_name_optional, children_entitlements, data_governance, db_followup_language, explicit_grants, former_member_purge, grants*, insights_aggregates, invite_redeem_by_code, ops_deletion_worker, perf, purge_legal_holds, rls, security_family, sync_engine, sync_perf, sync_v1_server, v1_gate_hardening, v1_gate_limits_peek_pepper, v1_gate_search_path.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L3 | au | fn | book id (identifies a child's book) |
| name | text | no |  | L4 | au | fn | child name |
| date_of_birth | date | yes |  | L4 | fn | fn | child birthday; not selectable by API roles (G-08): parents read it through sync_pull / sync_... |
| created_by | uuid | yes |  | L3 | au | fn | person id; null after creator account deletion |
| created_at | timestamptz | no | now() | L2 | au | fn | system timestamp |
| updated_at | timestamptz | no | now() | L2 | au | fn | [server-set: a trigger or generation decides] system timestamp |
| deleted_at | timestamptz | yes |  | L2 | au | fn | book tombstone time (server clock) |
| deletion_request_id | uuid | yes |  | L2 | au | fn | internal request id |
| nickname | text | yes |  | L4 | au | fn | child nickname |
| due_date | date | yes |  | L4 | fn | fn | due date (consumer health data, PRD K-25); not selectable by API roles (G-08): parents read i... |
| photo_path | text | yes |  | L3 | au | fn | object path ({child_id}/...), points at L4 photo |
| book_look | text | no | 'classic' | L2 | au | fn | theme enum |
| family_can_read | boolean | no | false | L2 | au | fn | sharing setting |
| hidden_at | timestamptz | yes |  | L2 | au | fn | hide-book time |
| purged_at | timestamptz | yes |  | L2 | fn | fn | when the book was purged for its members while a former member's letters keep the row (202610... |

### public.child_members (table, 5 columns)

- What: Who belongs to which book and as what (parent or contributor). Created at `20260930000000:48`.
- Levels: L2 x2, L3 x3. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au SELECT; svc none. Row scope for au: members of the same book (child_members_select).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; child_members_select select [authenticated] is_child_member(child_id).
- Written by: set_member_auto_add, accept_child_invite, accept_child_invite_by_code, undo_parent_join, purge_book_keep_authors, create_child_row, leave_child, remove_child_member, request_book_deletion. Read by: is_child_member, child_members_guard, can_read_entry_photo, cancel_book_deletion, request_account_deletion, my_auto_add_in, my_role_in, create_child_invite, sync_pull, ops_deletion_contributors, ops_incident_scope, ops_row_counts, sync_books, peek_invite, book_kept_authors, prepare_account_purge, is_child_parent, review_family_letter, invite_redeem_by_code.
- Keys: (child_id, profile_id); FK (child_id) -> children(id) del cascade; (profile_id) -> profiles(id) del cascade. Indexes: child_members_profile_idx.
- Retention: While the person is a member.
- Deletion path: leave_child, remove_child_member, undo_parent_join; cascade from book or profile.
- Tests (files that name it): access_matrix, audio_backup, data_governance, db_followup_family_cap, explicit_grants, former_member_purge, grants*, insights_aggregates, invite_redeem_by_code, perf, pg_temp_search_path, purge_legal_holds, rls, security_family, sync_perf, v1_gate_coparent, v1_gate_hardening, v1_gate_limits_peek_pepper, v1_gate_search_path.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| child_id | uuid | no |  | L3 | au | fn | book id |
| profile_id | uuid | no |  | L3 | au | fn | person id |
| role | text | no | 'parent' | L3 | au | fn | relation to the child (parent or contributor) |
| joined_at | timestamptz | no | now() | L2 | au | fn | system timestamp |
| auto_add_letters | boolean | no | false | L2 | au | fn | parent setting per family member |

### public.child_member_prefs (table, 8 columns)

- What: One person's settings for one book (signature, reminders, celebrations pause, letter notices). Created at `20261002020000:248`.
- Levels: L2 x4, L3 x4. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au SELECT,INSERT,UPDATE; svc none. Row scope for au: own rows, and only while a member (child_member_prefs_own).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; child_member_prefs_own all [authenticated] (profile_id = auth.uid()).
- Written by: sync_push. Read by: sync_pull, sync_books, peek_invite, invite_redeem_by_code.
- Keys: (child_id, profile_id); FK (child_id, profile_id) -> child_members(child_id, profile_id) del cascade. Indexes: child_member_prefs_profile_idx.
- Retention: While the person is a member (FK to child_members on delete cascade).
- Deletion path: cascade from child_members; the table is also a sync_push write target.
- Tests (files that name it): access_matrix, data_governance, former_member_purge, grants*, security_family, sync_engine, v1_gate_coparent, v1_gate_limits_peek_pepper, v1_wire_contract.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| child_id | uuid | no |  | L3 | au | au:IU | book id |
| profile_id | uuid | no |  | L3 | au | au:IU | person id |
| signs_as | text | yes |  | L3 | au | au:IU | signature for this child |
| include_in_reminders | boolean | no | true | L2 | au | au:IU | reminder setting |
| celebrations_paused | boolean | no | false | L3 | au | au:IU | personal setting (may reflect a hard season) |
| created_at | timestamptz | no | now() | L2 | au | au:IU | system timestamp |
| updated_at | timestamptz | no | now() | L2 | au | au:IU | [server-set: a trigger or generation decides] system timestamp |
| notify_letters | boolean | no | true | L2 | au | au:IU | preference: this person wants a push when the other parent adds a letter to this book |

### public.child_invites (table, 12 columns)

- What: Invitations to a book. The token is never stored, only its SHA-256 (token_hash) and an HMAC of the short code (code_hash). Created at `20260930000000:64`.
- Levels: L2 x5, L3 x7. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au none; svc none. Row scope for au: parents of the book (child_invites_select via is_child_parent); the phone never reads token_hash or code_hash by design, grants give authenticated no SELECT so the policy is inert.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; child_invites_select select [authenticated] is_child_parent(child_id).
- Written by: create_child_invite, accept_child_invite, child_members_revoke_invites, accept_child_invite_by_code, purge_due, purge_book_keep_authors, revoke_invite. Read by: sync_pull, sync_books, peek_invite, undo_parent_join, invite_redeem_by_code.
- Keys: (id); FK (accepted_by) -> profiles(id) del set null; (child_id) -> children(id) del cascade; (invited_by) -> profiles(id) del cascade. Indexes: child_invites_accepted_by_idx, child_invites_child_created_idx, child_invites_child_idx, child_invites_invited_by_idx, child_invites_inviter_created_idx, child_invites_live_code_idx (unique), child_invites_token_hash_key (unique).
- Retention: 90 days after the first of revoked_at, accepted_at, expires_at (purge_due step 4).
- Deletion path: purge_due; cascade from book; cascade from the inviter's profile; accepted_by set null at the accepter's deletion.
- Tests (files that name it): access_matrix, data_governance, db_followup_family_cap, db_followup_idempotency_rates, former_member_purge, insights_aggregates, invite_redeem_by_code, purge_batching, rls, security_family, v1_gate_coparent, v1_gate_limits_peek_pepper.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | internal invite id |
| child_id | uuid | no |  | L3 | fn | fn | book id |
| invited_by | uuid | no |  | L3 | fn | fn | person id |
| token_hash | bytea | no |  | L3 | fn | fn | SHA-256 of the invite token (token itself is L4, never stored) |
| role | text | no |  | L3 | fn | fn | relation offered |
| expires_at | timestamptz | no | (now() + '7 days') | L2 | fn | fn | system timestamp |
| accepted_by | uuid | yes |  | L3 | fn | fn | person id |
| accepted_at | timestamptz | yes |  | L2 | fn | fn | system timestamp |
| created_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| revoked_at | timestamptz | yes |  | L2 | fn | fn | system timestamp |
| signs_as | text | yes |  | L3 | fn | fn | signature the inviter suggested ("Nani") |
| code_hash | bytea | yes |  | L3 | fn | fn | HMAC-SHA-256 of the 8-character invite code, keyed by a pepper held outside the database; nev... |

### public.invite_redeem_failures (table, 4 columns)

- What: Brake counters for redeeming an invite by code; subject is a keyed hash, never a raw id. Created at `20261028010000:53`.
- Levels: L2 x3, L3 x1. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: no role (closed); written only by invite_redeem_by_code.
- Written by: invite_redeem_by_code. Read by: no function.
- Keys: (id). Indexes: invite_redeem_failures_at_idx, invite_redeem_failures_subject_idx.
- Retention: Rows older than 2 hours are deleted as new ones are written (20261028010000:206).
- Deletion path: same sweep.
- Tests (files that name it): access_matrix, classification, invite_redeem_by_code.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | bigint | no |  | L2 | fn | fn | row number of an operational record |
| scope | text | no |  | L2 | fn | fn | user, device, ip or global |
| subject | text | no |  | L3 | fn | fn | keyed hash (rotating key) of a person id, device id or client address; empty for global; neve... |
| at | timestamptz | no | now() | L2 | fn | fn | when the guess failed |

### public.entries (table, 41 columns)

- What: Letters. raw_transcript is immutable (trigger entries_guard_immutable). Members of a book read letters only through book_entries, never this table. Created at `20260930000000:120`.
- Levels: L2 x24, L3 x7, L4 x10. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au SELECT,INSERT,UPDATE; svc none. Row scope for au: author only (entries_select: author_id = auth.uid()).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; entries_author_insert insert [authenticated] ((author_id = auth.uid()) AND is_child_member(child_id) AND child_is_live(child_id)); entries_author_update update [authenticated] (author_id = auth.uid()); entries_select select [authenticated] (author_id = auth.uid()).
- Written by: cancel_account_deletion, delete_entry, request_account_deletion, withdraw_family_letter, sync_push, undo_parent_join, erase_entry, ops_replay_ledger, purge_due, purge_book_keep_authors, prepare_account_purge, leave_child, remove_child_member, request_book_deletion, restore_entry, review_family_letter, finalize_account_deletion. Read by: backup_entry_exists, can_read_entry_photo, backup_begin, sync_pull, ops_incident_scope, ops_raw_sha, ops_row_counts, _language_counts, letter_id_taken, held_state, held_upsert, held_drafts_guard, note_applied, dup_outcome, book_kept_authors, ops_deletion_sla, book_purge_held, entry_is_held, held_drafts_note_gone.
- Keys: (id); FK (author_id) -> profiles(id) del cascade; (child_id) -> children(id) del cascade. Indexes: entries_book_idx, entries_book_page_idx, entries_family_review_idx, entries_photo_path_idx, entries_search_idx, entries_sync_cursor_idx, entries_sync_idx, entries_tombstone_idx.
- Retention: Until the author deletes it (tombstone deleted_at, 30 days, then purge_due step 2), or the book is purged, or the author's account is deleted.
- Deletion path: delete_entry, restore_entry within 30 days; purge_due; prepare_account_purge deletes the author's letters only; cascade from book. A held letter (legal_holds) is skipped.
- Tests (files that name it): access_matrix, audio_backup, audio_backup_escrow, audio_backup_purge, auth_config, backup_role, classification, data_governance, db_followup_family_cap, db_followup_language, entries_machine_edits_check, explicit_grants, former_member_purge, grants*, held_drafts_write_checks, insights_aggregates, ops_deletion_worker, perf, pg_temp_search_path, purge_batching, purge_legal_holds, rls, security_family, sync_engine, sync_perf, sync_v1_server, v1_gate_coparent, v1_gate_hardening, v1_gate_limits_peek_pepper, v1_gate_search_path, v1_wire_contract.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no |  | L3 | au | au:IU | letter id (device-generated UUIDv7) |
| child_id | uuid | no |  | L3 | au | au:IU | book id |
| author_id | uuid | no |  | L3 | au | au:IU | person id |
| kind | text | no |  | L2 | au | au:IU | enum |
| occurred_on | date | no |  | L3 | au | au:IU | date of the family moment |
| captured_at | timestamptz | no |  | L2 | au | au:IU | capture timestamp |
| capture_mode | text | no |  | L2 | au | au:IU | enum |
| edit_level | text | no | 'clean' | L2 | au | au:IU | enum |
| prompt_key | text | yes |  | L2 | au | au:IU | prompt catalogue key |
| prompt_library_version | integer | yes |  | L2 | au | au:IU | version number |
| engine_version | integer | no |  | L2 | au | au:IU | version number |
| raw_transcript | text | no |  | L4 | au | au:IU | content: exact words, author-only (PRD K-09) |
| stt_meta | jsonb | yes |  | L4 | au | au:IU | content-derived: per-token timestamps, author-only |
| machine_edits | jsonb | no | '[]' | L4 | au | au:IU | content: edit list with offsets, author-only |
| final_text | text | no |  | L4 | au | au:IU | content: the letter as the book renders it |
| in_book | boolean | no | false | L2 | au | au:IU | flag |
| photo_path | text | yes |  | L3 | au | au:IU | object path ({child}/{author}/{entry}), points at L4 photo |
| audio_kept_on_device | boolean | no | false | L2 | au | au:IU | flag |
| sounds_like_me | boolean | yes |  | L2 | au | au:IU | flag |
| created_at | timestamptz | no | now() | L2 | au | au:IU | system timestamp |
| updated_at | timestamptz | no | now() | L2 | au | au:IU | [server-set: a trigger or generation decides] system timestamp |
| deleted_at | timestamptz | yes |  | L2 | au | au:IU | tombstone time (server clock) |
| search | tsvector | yes | generated | L4 | au | au:IU | [server-set: a trigger or generation decides] content-derived full-text index of final_text |
| deleted_reason | text | yes |  | L2 | au | au:IU | enum |
| raw_sha256 | bytea | yes |  | L4 | au | au:IU | content-derived hash of raw_transcript, author-only |
| author_signs_as | text | yes |  | L3 | au | au:IU | signature at save time |
| approval | text | no | 'not_needed' | L2 | au | au:IU | family review state (not_needed, pending, added, set_aside) |
| reviewed_by | uuid | yes |  | L3 | au | au:IU | person id of the reviewing parent; nulled at account deletion |
| reviewed_at | timestamptz | yes |  | L2 | au | au:IU | system timestamp |
| sync_xid | xid8 | no | '0'::xid8 | L2 | au | au:IU | [server-set: a trigger or generation decides] system version: id of the transaction that last wrote the row (sync cursor) |
| sync_restored_from | timestamptz | yes |  | L2 | au | au:IU | [server-set: a trigger or generation decides] system timestamp: server time a restore re-upload brought back (null after any other write) |
| language | text | yes |  | L4 | au | au:IU | spoken-letter language (one of the seven v1.0 codes), author-only: never in book_entries |
| left_parents_xid | xid8 | yes |  | L2 | au | au:IU | [server-set: a trigger or generation decides] system version: transaction that took the letter out of what parents can read (sync digest, G... |
| left_family_xid | xid8 | yes |  | L2 | au | au:IU | [server-set: a trigger or generation decides] system version: transaction that took the letter out of what family can read (sync digest, G-09) |
| occurred_precision | text | no | 'day' | L2 | au | au:IU | enum: whether occurred_on is a day or the first day of a month of age (F04-REQ-015); members ... |
| base_direction | text | no | 'ltr' | L2 | au | au:IU | layout enum (ltr or rtl), never the words; members read it |
| author_edits | jsonb | yes |  | L4 | au | au:IU | the author's own word changes against the machine-cleaned text (F06-REQ-026), author-only: ne... |
| locked_spans | jsonb | yes |  | L4 | au | au:IU | spans the author kept exactly as said (F06-REQ-031), author-only: never in book_entries |
| pack_ref | text | yes |  | L4 | au | au:IU | language pack used to clean the letter (lang@version), set once then immutable, author-only b... |
| text_xid | xid8 | yes |  | L2 | au | au:IU | [server-set: a trigger or generation decides] system version: the transaction that last wrote final_text, machine_edits or edit_level (ADR ... |
| words_reviewed_at | timestamptz | yes |  | L2 | au | au:IU | when the author kept the letter with its words on screen (M17, ADR 0025 section 11), author-o... |

### public.entry_versions (table, 7 columns)

- What: Earlier text of a letter, written by trigger entries_record_version on a change of final_text or machine_edits. Created at `20260930000000:155`.
- Levels: L2 x3, L3 x2, L4 x2. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au none; svc none. Row scope for au: the letter's author (entry_versions_author_select); authenticated has no table SELECT, so the policy is inert and the author reads versions only through functions.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; entry_versions_author_select select [authenticated] (EXISTS ( SELECT 1 FROM entries e WHERE ((e.id = entry_versions.entry_id) AND (e.author_id = auth.uid())))).
- Written by: entries_drop_held, entries_record_version, finalize_account_deletion. Read by: ops_row_counts.
- Keys: (id); FK (entry_id) -> entries(id) del cascade. Indexes: entry_versions_entry_idx.
- Retention: With its letter.
- Deletion path: cascade from entries; superseded_by set null at the editor's account deletion (finalize_account_deletion).
- Tests (files that name it): access_matrix, data_governance, rls, sync_engine, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | internal version id |
| entry_id | uuid | no |  | L3 | fn | fn | letter id |
| final_text | text | no |  | L4 | fn | fn | content: previous text |
| in_book | boolean | no |  | L2 | fn | fn | flag |
| created_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| machine_edits | jsonb | yes |  | L4 | fn | fn | content: previous edit list |
| superseded_by | uuid | yes |  | L3 | fn | fn | person id; nulled at account deletion |

### public.held_drafts (table, 25 columns)

- What: Author-only drafts held at the Keep gate or waiting for words; the server copy of a phone draft. Created at `20261016000000:300`.
- Levels: L2 x13, L3 x4, L4 x8. RLS: on. Owner agent: sync.
- Table grants: anon none; au SELECT,INSERT,UPDATE; svc none. Row scope for au: author only (held_drafts_author_read), and the author must be a parent of the book for insert and update.
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; held_drafts_author_insert insert [authenticated] ((author_id = auth.uid()) AND is_child_parent(child_id)); held_drafts_author_read select [authenticated] (author_id = auth.uid()); held_drafts_author_update update [authenticated] ((author_id = auth.uid()) AND is_child_parent(child_id)).
- Written by: held_upsert, held_discard, child_members_drop_held, entries_drop_held, erase_held, erase_entry, ops_replay_ledger, purge_book_keep_authors. Read by: sync_pull, sync_push, ops_incident_scope, letter_id_taken, held_on_hold, held_state, note_held, keep_check, purge_due, book_kept_authors, prepare_account_purge, book_purge_held.
- Keys: (id); FK (author_id) -> profiles(id) del cascade; (child_id) -> children(id) del cascade. Indexes: held_drafts_author_cursor_idx, held_drafts_child_idx.
- Retention: Until kept, discarded, or the author or book goes. No age sweep.
- Deletion path: held.discard, entries_drop_held trigger when the letter is kept, child_members_drop_held on leaving; cascade from author or book.
- Tests (files that name it): access_matrix, audio_backup, entries_machine_edits_check, former_member_purge, grants*, held_drafts_write_checks, pg_temp_search_path, purge_legal_holds, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no |  | L3 | au | au:IU | letter id (device-generated UUIDv7), which the letter takes when it is kept |
| author_id | uuid | no |  | L3 | au | au:IU | the author (only they read or write the row) |
| child_id | uuid | no |  | L3 | au | au:IU | the book |
| kind | text | no |  | L2 | au | au:IU | enum: held_letter, waiting_letter or held_words |
| capture_mode | text | no |  | L2 | au | au:IU | spoken or typed |
| created_at | timestamptz | no |  | L2 | au | au:IU | when the draft was made on the phone |
| occurred_on | date | no |  | L3 | au | au:IU | the day (or month) the letter is about |
| occurred_precision | text | no | 'day' | L2 | au | au:IU | enum: day or month |
| language | text | yes |  | L4 | au | au:IU | the letter's language (names a family language), author-only |
| base_direction | text | no | 'ltr' | L2 | au | au:IU | layout enum (ltr or rtl), never the words |
| prompt_key | text | yes |  | L2 | au | au:IU | which prompt the author answered, a key, never text |
| in_book_choice | boolean | yes |  | L2 | au | au:IU | the in-book choice the author made at the Keep gate |
| raw_transcript | text | yes |  | L4 | au | au:IU | the words as transcribed, immutable once set (author-only) |
| final_text | text | yes |  | L4 | au | au:IU | the words after the faithful edits (author-only) |
| machine_edits | jsonb | yes |  | L4 | au | au:IU | every machine edit, reversible (author-only) |
| edit_level | text | yes |  | L2 | au | au:IU | enum: how much cleaning the author chose |
| author_edits | jsonb | yes |  | L4 | au | au:IU | the author's own word changes (author-only) |
| locked_spans | jsonb | yes |  | L4 | au | au:IU | spans kept exactly as said (author-only) |
| typed_text | text | yes |  | L4 | au | au:IU | the typed words of a typed draft, the only copy of them (author-only) |
| engine_version | integer | yes |  | L2 | au | au:IU | version number of the cleaning engine |
| pack_ref | text | yes |  | L4 | au | au:IU | language pack used (lang@version), author-only because it names the language |
| audio_kept_on_device | boolean | no | false | L2 | au | au:IU | whether the phone keeps the recording |
| sync_xid | xid8 | no | '0'::xid8 | L2 | au | au:IU | [server-set: a trigger or generation decides] system version (the writing transaction), the pull cursor |
| text_xid | xid8 | no | '0'::xid8 | L2 | au | au:IU | [server-set: a trigger or generation decides] system version (words group and typed_text) for the compare and set |
| updated_at | timestamptz | no | now() | L2 | au | au:IU | [server-set: a trigger or generation decides] last server write |

### public.held_drafts_gone (table, 6 columns)

- What: Markers that tell the author's other phones a held draft left (discarded, kept, erased). Created at `20261016000000:353`.
- Levels: L2 x3, L3 x3. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: no role directly; read by sync_pull.
- Written by: erase_held, erase_entry, purge_book_keep_authors, held_drafts_note_gone. Read by: entries_not_purged, sync_pull, erasure_recorded, letter_id_taken, photo_entry_is_purged.
- Keys: (id); FK (author_id) -> profiles(id) del cascade; (child_id) -> children(id) del cascade. Indexes: held_drafts_gone_child_idx, held_drafts_gone_cursor_idx.
- Retention: No age sweep found: a marker is deleted when the same id is held again (20261016000000:547) or with the book or author (20261023010000:160). Gap G-3.
- Deletion path: cascade from author or book.
- Tests (files that name it): access_matrix, former_member_purge, pg_temp_search_path, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no |  | L3 | fn | fn | the held draft's letter id |
| author_id | uuid | no |  | L3 | fn | fn | the author whose phones read the marker |
| child_id | uuid | no |  | L3 | fn | fn | the book (the marker goes with it) |
| gone | text | no |  | L2 | fn | fn | enum: discarded, kept or erased |
| updated_at | timestamptz | no | now() | L2 | fn | fn | [server-set: a trigger or generation decides] when the draft left |
| sync_xid | xid8 | no | pg_current_xact_id() | L2 | fn | fn | [server-set: a trigger or generation decides] system version, the pull cursor |

### public.dictionary_terms (table, 9 columns)

- What: Family words and name spellings per author. No function creates a row in the migrations (only purge_book_keep_authors deletes), and no role has a grant, so the table is unreachable today. Gap G-4. Created at `20260930000000:165`.
- Levels: L2 x4, L3 x2, L4 x3. RLS: on. Owner agent: data-architect.
- Table grants: anon none; au none; svc none. Row scope for au: owner (dictionary_terms_owner policy, inert: no grant).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; dictionary_terms_owner all [authenticated] (owner_id = auth.uid()).
- Written by: purge_book_keep_authors. Read by: ops_incident_scope, ops_row_counts.
- Keys: (id); FK (child_id) -> children(id) del cascade; (owner_id) -> profiles(id) del cascade. Indexes: dictionary_terms_child_idx, dictionary_terms_owner_id_term_key (unique).
- Retention: While the owner or book exists.
- Deletion path: cascade from owner or book.
- Tests (files that name it): access_matrix, export_reads, former_member_purge, purge_legal_holds, rls, security_family, v1_wire_contract.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | internal id |
| owner_id | uuid | no |  | L3 | fn | fn | person id |
| child_id | uuid | yes |  | L3 | fn | fn | book id |
| term | text | no |  | L4 | fn | fn | names and family words |
| kind | text | no |  | L2 | fn | fn | enum |
| heard_as | text[] | no | '{}'[] | L4 | fn | fn | misheard spellings of names |
| created_at | timestamptz | no | now() | L2 | fn | fn | system timestamp |
| updated_at | timestamptz | no | now() | L2 | fn | fn | [server-set: a trigger or generation decides] system timestamp |
| forms | jsonb | yes |  | L4 | fn | fn | one form per script of a name or word, typed by a parent, each with its heard-as values (F07 ... |

### public.book_entries (view, 24 columns)

- What: View: the columns of a letter a book member may read (no raw_transcript, stt_meta, machine_edits, raw_sha256, language, author_edits, locked_spans, pack_ref). security_barrier, owner-run; no role holds a grant since 20261023060000, only sync_pull (definer) reads it.
- Levels: L2 x16, L3 x6, L4 x2. RLS: n/a (view). Owner agent: data-architect.
- Table grants: anon none; au none; svc none. Row scope for au: letters with in_book true, not deleted, in a live book, for members; carries its own where clause (20261015030000).
- Written by: no function. Read by: sync_pull.
- Retention: n/a (view).
- Deletion path: n/a.
- Tests (files that name it): access_matrix, classification, data_governance, db_followup_family_cap, db_followup_language, entries_machine_edits_check, explicit_grants, perf, rls, security_family, sync_perf, v1_gate_coparent, v1_gate_hardening, v1_gate_search_path, v1_wire_contract.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | yes |  | L3 | fn | - | letter id |
| child_id | uuid | yes |  | L3 | fn | - | book id |
| author_id | uuid | yes |  | L3 | fn | - | person id |
| author_signs_as | text | yes |  | L3 | fn | - | signature at save time |
| kind | text | yes |  | L2 | fn | - | enum |
| occurred_on | date | yes |  | L3 | fn | - | date of the family moment |
| captured_at | timestamptz | yes |  | L2 | fn | - | capture timestamp |
| capture_mode | text | yes |  | L2 | fn | - | enum |
| edit_level | text | yes |  | L2 | fn | - | enum |
| prompt_key | text | yes |  | L2 | fn | - | prompt catalogue key |
| prompt_library_version | integer | yes |  | L2 | fn | - | version number |
| engine_version | integer | yes |  | L2 | fn | - | version number |
| final_text | text | yes |  | L4 | fn | - | content |
| in_book | boolean | yes |  | L2 | fn | - | flag |
| photo_path | text | yes |  | L3 | fn | - | object path |
| audio_kept_on_device | boolean | yes |  | L2 | fn | - | flag |
| sounds_like_me | boolean | yes |  | L2 | fn | - | flag |
| created_at | timestamptz | yes |  | L2 | fn | - | system timestamp |
| updated_at | timestamptz | yes |  | L2 | fn | - | system timestamp |
| deleted_at | timestamptz | yes |  | L2 | fn | - | tombstone time (author rows only) |
| search | tsvector | yes |  | L4 | fn | - | content-derived full-text index |
| approval | text | yes |  | L2 | fn | - | family review state |
| occurred_precision | text | yes |  | L2 | fn | - | enum: day or month (entries.occurred_precision) |
| base_direction | text | yes |  | L2 | fn | - | layout enum (entries.base_direction) |


## Gaps found in this file

- G-3 `held_drafts_gone` has no age sweep (see its Retention line).
- G-4 `dictionary_terms` has a policy and L4 labels but no grant and no function that creates a row. CLOSED as by design (E80).
- G-8 Inert policies (the policy names a role that holds no grant, so it never applies): `child_invites_select`, `entry_versions_author_select`, `children_member_update`, `dictionary_terms_owner`. They are harmless defence in depth; `explicit_grants.test.mjs` pins the grants, not the policies.
- G-15 `entries` and `held_drafts` give au direct INSERT and UPDATE (`grants.mjs:7-9`), so a client can write them without `sync_push`; the triggers (`entries_guard_immutable`, `client_content_gate`, `entries_family_rules`) are the control. [V] from the catalog; the trigger list is in 02f.

## Questions for the council

- Q-a1 (CDO, CISO) Keep the four inert policies? Default: keep and list them; remove only with a test that proves the deny still holds.
- Q-a2 (CPO) Does any card need `dictionary_terms`? Default: leave it, add no writer, and carry the table as "built, unreachable" until a card names it.
- Q-a3 (CDO, `sync`) Sweep `held_drafts_gone` after how many days? Default: no sweep until `sync` states the longest offline period a phone may have, because a phone offline longer than the sweep would not learn a draft left.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, branch `docs/decisions-closed-20nov`, until it merges) and the CDO and CISO return (`cdo-ciso.md`, working file, "CDO return"). Gates and numbered gaps: 01a section 8.

- Q-a1: AGREE (CDO return). Keep the four inert policies and list them (01a 8.3: 14 across the pack). Add a test that the set of policies with no matching grant equals a written list, so a later grant cannot wake one silently. Gap G-8, gate G10 [E].
- Q-a2: RULED by E80 (`18-errata-after-lock.md`, FR-AIS-34): the dictionary is phone only and never synced; the table stays built and unreachable (no grant, writer or reader) until a card names a synced dictionary, which would need a privacy read, export and deletion rows and a label check. G-4 is closed as by design. Whether to drop it is open to data-architect and `mobile`. AGREE (CDO return). Leave `dictionary_terms` unreachable. Condition: a test that account purge and book purge cover it. Gap G-4, gate G10 [E].
- Q-a3: tied to C5. `sync` states the longest offline period a phone may have; the `held_drafts_gone` sweep and the purged-id guard (01a G-23) both take their period from that one number. Until then no sweep. Gap G-3, gate G10 [E].
