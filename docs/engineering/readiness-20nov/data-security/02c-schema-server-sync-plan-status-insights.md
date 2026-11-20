# 02c Schema reference: sync, plan status and insights

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); all 31 files in `supabase/migrations` loaded into the test harness (`supabase/tests/harness.mjs`, PGlite) and read back from the catalogs [V]. Nothing was applied to a hosted project. Part of the 02 schema reference: 02a books and letters, 02b governance, 02c sync, plan status and insights, 02d recording backup, escrow and ops, 02e functions, 02f triggers, buckets and storage rules, 02g phone database scribe.db, 02h other phone stores, 02i designed, not built.

## How to read a table block

- Levels are the names in `docs/legal/DATA_CLASSIFICATION.md` section 1: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. The L cell is the first token of the column comment in the migration; `-` means no comment (a gap).
- Roles: `au` is a signed-in, non-anonymous person (every table carries a restrictive policy that refuses anonymous sessions); `anon` is signed out; `svc` is `service_role`. `fn` means no direct grant: the column is reached only through the security definer functions named in Written by and Read by. `svc` holds no table grant in `public`, `ops` or `sync_private` (`supabase/tests/grants.mjs:5-11`), so it acts only through the functions in 02e; it has SELECT on the six published `insights` views (shown as `svc` in Read).
- Read `au` and Write `au:I`, `au:U`, `au:IU` are column privileges (INSERT, UPDATE) read from the catalog; the rows a person can reach are in the Row scope line. Write is the privilege only: triggers (`entries_guard_immutable`, `client_content_gate`, `entries_family_rules`, `entries_set_sync_xid`, `touch_updated_at`) decide what a client can truly set, and the Note marks columns a trigger or generation sets (server-set).
- Retention, Deletion path and Tests are per table and apply to every column unless the Note or the Deletion path names the column (for example "set null at deletion").
- Written by and Read by are found by searching the final function bodies for insert, update, delete, from and join on the table [V, automated; dynamic SQL would be missed].
- Tests are the files in `supabase/tests` that name the table. A name is not proof of an allow case and a deny case for each policy (Gap G-7 in 01a).
- Default cells are shortened; the migration is the source for the exact expression.

Sync bookkeeping, the plan status the phone reports, and the aggregate schema `insights`.

## Tables

### public.idempotency_keys (table, 6 columns)

- What: Repeat protection for invite and consent calls; result holds ids only (at most 256 bytes). Created at `20261005000000:119`.
- Levels: L2 x4, L3 x2. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: no direct role; functions idempotency_claim and idempotency_store (invoker).
- Written by: sync_housekeeping, idempotency_claim, idempotency_store. Read by: no function.
- Keys: (profile_id, idem_key); FK (profile_id) -> profiles(id) del cascade. Indexes: idempotency_keys_created_idx.
- Retention: 24 hours (sync_housekeeping).
- Deletion path: same sweep; cascade from profile.
- Tests (files that name it): access_matrix, db_followup_idempotency_rates, subscription_status.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | person id |
| idem_key | uuid | no |  | L2 | fn | fn | client-made request key (UUID) |
| fn | text | no |  | L2 | fn | fn | enum (function name) |
| request_sha256 | bytea | no |  | L2 | fn | fn | hash of the request arguments |
| result | jsonb | yes |  | L3 | fn | fn | ids of what the first call made (invite id or act id), never tokens or text |
| created_at | timestamptz | no | now() | L2 | fn | fn | system timestamp (rows live 24 hours) |

### public.sync_epochs (table, 4 columns)

- What: Restore epochs: one row each time the database was restored (system, not personal). Created at `20261004100000:129`.
- Levels: L2 x4. RLS: on. Owner agent: sync.
- Table grants: anon none; au SELECT; svc none. Row scope for au: any signed-in person (sync_epochs_read, true).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; sync_epochs_read select [authenticated] true.
- Written by: sync_begin_epoch. Read by: sync_pull, sync_push, sync_books.
- Keys: (epoch). Indexes: primary key only.
- Retention: Forever.
- Deletion path: none.
- Tests (files that name it): access_matrix, grants*, sync_engine.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| epoch | integer | no |  | L2 | au | fn | counter |
| started_at | timestamptz | no | now() | L2 | au | fn | system timestamp |
| restore_point | timestamptz | yes |  | L2 | au | fn | system timestamp: the backup point the database was restored to |
| reason | text | no |  | L2 | au | fn | enum |

### public.sync_op_receipts (table, 7 columns)

- What: Which device ops the server already applied, so a retry is safe. answer is flags only. Created at `20261004100000:161`.
- Levels: L2 x6, L3 x1. RLS: on. Owner agent: sync.
- Table grants: anon none; au SELECT; svc none. Row scope for au: own rows (sync_op_receipts_own_select; the insert and delete policies are inert, au holds SELECT only).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; sync_op_receipts_own_delete delete [authenticated] (profile_id = auth.uid()); sync_op_receipts_own_insert insert [authenticated] (profile_id = auth.uid()); sync_op_receipts_own_select select [authenticated] (profile_id = auth.uid()).
- Written by: sync_housekeeping, sync_op_claim, note_held, note_applied, note_answer, keep_check. Read by: held_dup, dup_outcome, dup_answer.
- Keys: (profile_id, op_id); FK (profile_id) -> profiles(id) del cascade. Indexes: sync_op_receipts_profile_idx.
- Retention: 30 days (sync_housekeeping).
- Deletion path: same sweep; cascade from profile.
- Tests (files that name it): access_matrix, grants*, sync_engine, sync_v1_server, v1_gate_hardening.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| op_id | uuid | no |  | L2 | au | fn | device-made op id (UUIDv7) |
| profile_id | uuid | no |  | L3 | au | fn | person id |
| applied_at | timestamptz | no | now() | L2 | au | fn | system timestamp |
| applied_v | xid8 | yes |  | L2 | au | fn | system version: the version the op wrote when its own words applied (ADR 0025 section 2); nul... |
| words_conflict | boolean | no | false | L2 | au | fn | flag: the op met words newer than its base: its answer carried current |
| words_refused | boolean | no | false | L2 | au | fn | flag: the op's words were not applied (conflict_groups text) |
| answer | jsonb | yes |  | L2 | au | fn | the first answer of held.discard, entry.erase or a refused Keep, for its repeat: flags only, ... |

### public.sync_rate_windows (table, 4 columns)

- What: Per person per bucket call counts for rate limits.
- Levels: L2 x3, L3 x1. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: own rows (sync_rate_windows_own), no table grant so inert; written by rate_hit (definer).
- Policies: restrictive no_anonymous (NOT is_anonymous()) for au; sync_rate_windows_own all [authenticated] (profile_id = auth.uid()).
- Written by: sync_housekeeping, rate_hit. Read by: no function.
- Keys: (profile_id, bucket); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: 1 day (sync_housekeeping).
- Deletion path: same sweep; cascade from profile.
- Tests (files that name it): access_matrix, db_followup_family_cap, db_followup_idempotency_rates, db_followup_language, entries_machine_edits_check, explicit_grants, former_member_purge, held_drafts_write_checks, pg_temp_search_path, sync_engine, sync_perf, sync_v1_server, v1_gate_coparent, v1_gate_hardening, v1_gate_limits_peek_pepper.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | person id |
| bucket | text | no |  | L2 | fn | fn | enum |
| window_start | timestamptz | no |  | L2 | fn | fn | system timestamp |
| hits | integer | no |  | L2 | fn | fn | count |

### public.subscription_status (table, 13 columns)

- What: The plan state the phone reports (monthly or annual, trial end, renewal, cancelled). A server copy of purchase state; DATA_CLASSIFICATION 4.1 still says no server table holds purchases (Conflict C-2). Created at `20261016001000:96`.
- Levels: L2 x4, L3 x9. RLS: on. Owner agent: payments.
- Table grants: anon none; au none; svc none. Row scope for au: no role; written by status_report_store.
- Written by: status_report_store. Read by: no function.
- Keys: (profile_id, sub_ref); FK (profile_id) -> profiles(id) del cascade. Indexes: subscription_status_due_idx.
- Retention: While the account exists; no age sweep.
- Deletion path: cascade from profile (also deletes subscription_salts).
- Tests (files that name it): access_matrix, consent_grants_tightening, subscription_status.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | account |
| sub_ref | text | no |  | L3 | fn | fn | salted SHA-256 of the original transaction id, made on the phone |
| environment | text | no |  | L2 | fn | fn | StoreKit environment (production, sandbox, xcode) |
| plan | text | no |  | L3 | fn | fn | monthly or annual |
| trial_end | timestamptz | yes |  | L3 | fn | fn | end of the current free period, or null |
| renewal_date | timestamptz | yes |  | L3 | fn | fn | end of the current period (next renewal, or the end when cancelled); null after it ended |
| cancelled | boolean | no |  | L3 | fn | fn | auto-renew is off |
| free_period_days | smallint | yes |  | L3 | fn | fn | length of the free period (optional in contract v1, open for counsel; the app does not send i... |
| subscribed_since | date | yes |  | L3 | fn | fn | UTC date the subscription began, for the monthly anniversary reminder (optional in contract v... |
| reported_at | timestamptz | no |  | L2 | fn | fn | when the phone read these values (device clock, never later than receipt); for support only |
| fingerprint | text | no |  | L3 | fn | fn | the status fields joined, to tell a change from a repeat |
| first_received_at | timestamptz | no | now() | L2 | fn | fn | first report for this purchase |
| received_at | timestamptz | no | now() | L2 | fn | fn | last report received |

### public.subscription_consents (table, 10 columns)

- What: Record of the purchase terms the person was shown (append-only). Created at `20261016001000:133`.
- Levels: L2 x4, L3 x6. RLS: on. Owner agent: payments, privacy.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: subscription_retention_purge, status_report_store, subscription_consents_pseudonymise. Read by: ops_deletion_consent_records.
- Keys: (id); FK (profile_id) -> profiles(id) del set null. Indexes: subscription_consents_profile_idx, subscription_consents_pseudonymised_idx, subscription_consents_sub_ref_key (unique).
- Retention: 3 years after pseudonymised_at (subscription_retention_purge); as built, not approved by counsel.
- Deletion path: profile_id set null and subject_hash set at account deletion (trigger subscription_consents_pseudonymise).
- Tests (files that name it): access_matrix, audit_append_only, consent_grants_tightening, consent_service_role, deletion_subject_hash, subscription_status.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| id | uuid | no | gen_random_uuid | L2 | fn | fn | row id |
| profile_id | uuid | yes |  | L3 | fn | fn | account; null once pseudonymised |
| subject_hash | bytea | yes |  | L3 | fn | fn | pseudonymised person id (peppered SHA-256), set at account deletion |
| pseudonymised_at | timestamptz | yes |  | L2 | fn | fn | retention clock |
| sub_ref | text | no |  | L3 | fn | fn | salted SHA-256 of the original transaction id; unlinkable once the salt is deleted |
| product_id | text | no |  | L3 | fn | fn | StoreKit product id (plus.monthly or plus.annual) |
| offer_type | text | no |  | L3 | fn | fn | how the free period was offered |
| terms_shown | text | no |  | L2 | fn | fn | Subscription Terms version shown in the app, or none_outside_app |
| shown_at | timestamptz | no |  | L3 | fn | fn | when the terms were shown and the purchase confirmed (device clock) |
| recorded_at | timestamptz | no | now() | L2 | fn | fn | server time of the record |

### public.subscription_salts (table, 3 columns)

- What: Per-account salt for sub_ref; deleting it makes old sub_ref values unlinkable. Created at `20261016001000:83`.
- Levels: L2 x1, L3 x2. RLS: on. Owner agent: payments.
- Table grants: anon none; au none; svc none. Row scope for au: no role; status_salt (definer) returns it to its own account.
- Written by: status_salt. Read by: no function.
- Keys: (profile_id); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: While the account exists.
- Deletion path: cascade from profile.
- Tests (files that name it): access_matrix, subscription_status.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | account |
| salt | bytea | no |  | L3 | fn | fn | 32 random bytes; with an original transaction id it makes sub_ref |
| created_at | timestamptz | no | now() | L2 | fn | fn | when the salt was made |

### public.subscription_report_rates (table, 4 columns)

- What: Rate counters for the status report and salt calls. Created at `20261016001000:168`.
- Levels: L2 x3, L3 x1. RLS: on. Owner agent: payments.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: subscription_rate_hit. Read by: no function.
- Keys: (profile_id, bucket); FK (profile_id) -> profiles(id) del cascade. Indexes: primary key only.
- Retention: No sweep of old windows. Gap G-6.
- Deletion path: cascade from profile.
- Tests (files that name it): access_matrix, subscription_status.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| profile_id | uuid | no |  | L3 | fn | fn | account |
| bucket | text | no |  | L2 | fn | fn | report or salt |
| window_start | timestamptz | no |  | L2 | fn | fn | start of the rolling window |
| hits | integer | no |  | L2 | fn | fn | calls in the window |

### sync_private.entry_erasures (table, 7 columns)

- What: Record of letters hard-deleted while their book and author exist, so a phone away longer than the 60-day ledger still cannot bring an erased letter back. Schema sync_private is not exposed by the API; schema USAGE is granted to authenticated so definer helpers can run. Created at `20261016000000:379`.
- Levels: L2 x4, L3 x3. RLS: on. Owner agent: sync.
- Table grants: anon none; au none; svc none. Row scope for au: no role (no table grant).
- Written by: entries_note_erasure, erase_held, purge_book_keep_authors. Read by: entries_not_purged, sync_pull, erasure_recorded, letter_id_taken, photo_entry_is_purged.
- Keys: (entry_id); FK (author_id) -> profiles(id) del cascade; (child_id) -> children(id) del cascade. Indexes: entry_erasures_author_idx, entry_erasures_book_idx.
- Retention: With the book or the author (foreign keys cascade); no age sweep (20261016000000:64-70).
- Deletion path: cascade; rows of a kept book's other authors go in purge_book_keep_authors (20261023010000:161).
- Tests (files that name it): access_matrix, former_member_purge, pg_temp_search_path, sync_v1_server.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| entry_id | uuid | no |  | L3 | fn | fn | the erased letter's id |
| child_id | uuid | no |  | L3 | fn | fn | its book |
| author_id | uuid | no |  | L3 | fn | fn | its author |
| left_parents_xid | xid8 | yes |  | L2 | fn | fn | [server-set: a trigger or generation decides] system version: when the letter left the parents' view (null: never in it) |
| left_family_xid | xid8 | yes |  | L2 | fn | fn | [server-set: a trigger or generation decides] system version: when the letter left the family's view (null: never in it) |
| erased_at | timestamptz | no | now() | L2 | fn | fn | when it was purged |
| sync_xid | xid8 | no | pg_current_xact_id() | L2 | fn | fn | [server-set: a trigger or generation decides] system version: the purging transaction, compared with pull cursors |

### insights.weekly_keeping_families (view, 7 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x7. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| week | date | yes |  | L2 | svc | - | week start (UTC) |
| complete | boolean | yes |  | L2 | svc | - | flag: week has ended |
| families | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| families_with_book_letter | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |
| letters | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| spoken_letters | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |
| typed_letters | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |

### insights.letters_per_active_family (view, 7 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x7. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| week | date | yes |  | L2 | svc | - | week start (UTC) |
| complete | boolean | yes |  | L2 | svc | - | flag: week has ended |
| active_families | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| letters_per_family_mean | numeric | yes |  | L2 | svc | - | statistic over at least k families |
| letters_per_family_p50 | numeric | yes |  | L2 | svc | - | statistic over at least k families |
| letters_per_family_p90 | numeric | yes |  | L2 | svc | - | statistic over at least k families |
| families_two_plus_voices | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |

### insights.first_letter_conversion (view, 7 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x7. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| cohort_week | date | yes |  | L2 | svc | - | sign-up week start (UTC) |
| d7_matured | boolean | yes |  | L2 | svc | - | flag |
| d30_matured | boolean | yes |  | L2 | svc | - | flag |
| new_accounts | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| first_letter_d1 | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |
| first_letter_d7 | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |
| first_letter_d30 | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |

### insights.family_invites (view, 5 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x5. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| week | date | yes |  | L2 | svc | - | week start (UTC) |
| role | text | yes |  | L2 | svc | - | enum (co_parent, contributor) |
| sent | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| accepted | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |
| accepted_within_7d | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |

### insights.retention_cohorts (view, 4 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x4. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| cohort_week | date | yes |  | L2 | svc | - | first-letter week start (UTC) |
| week_offset | integer | yes |  | L2 | svc | - | weeks since cohort week |
| cohort_writers | bigint | yes |  | L2 | svc | - | count, k-anonymised |
| active_writers | bigint | yes |  | L2 | svc | - | count, k-anonymised with remainder |

### insights.language_mix (view, 3 columns)

- What: Aggregate view over letters and books. Every count is 0 or at least k = 10 (insights.k_min).
- Levels: L2 x3. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc SELECT. Row scope for au: service_role and the no-login role insights_reader only (service_role holds SELECT).
- Written by: no function. Read by: insights_aggregates.
- Retention: Computed on read; nothing stored.
- Deletion path: n/a.
- Tests (files that name it): db_followup_language, insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| week | date | yes |  | L2 | svc | - | week start (UTC) |
| lang | text | yes |  | L2 | svc | - | one of the seven v1.0 codes or other (reviewed reduction of L4 languages, DATA_CLASSIFICATION... |
| families | bigint | yes |  | L2 | svc | - | count, at least k (small languages merged into other) |

### insights._letters (view, 8 columns)

- What: Internal helper view with letter, author and book ids per week. Not granted to any role; columns carry no classification comment (Gap G-2).
- Levels: unlabelled x8. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: no function. Read by: _language_counts.
- Retention: n/a.
- Deletion path: n/a.
- Tests (files that name it): insights_aggregates.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| entry_id | uuid | yes |  | - | fn | - |  |
| author_id | uuid | yes |  | - | fn | - |  |
| child_id | uuid | yes |  | - | fn | - |  |
| family_key | text | yes |  | - | fn | - |  |
| capture_mode | text | yes |  | - | fn | - |  |
| in_book | boolean | yes |  | - | fn | - |  |
| at | timestamptz | yes |  | - | fn | - |  |
| week | date | yes |  | - | fn | - |  |

### insights._book_family (view, 2 columns)

- What: Internal helper view mapping a book to a family key. No grants; no comments (Gap G-2).
- Levels: unlabelled x2. RLS: n/a (view). Owner agent: analytics.
- Table grants: anon none; au none; svc none. Row scope for au: no role.
- Written by: no function. Read by: no function.
- Retention: n/a.
- Deletion path: n/a.
- Tests (files that name it): none.

| Column | Type | Null | Default | L | Read | Write | Note |
|---|---|---|---|---|---|---|---|
| child_id | uuid | yes |  | - | fn | - |  |
| family_key | text | yes |  | - | fn | - |  |


## Gaps found in this file

- G-8 Inert policies here: `sync_op_receipts_own_insert` and `sync_op_receipts_own_delete` (au holds SELECT only) and `sync_rate_windows_own` (no grant; `rate_hit` is the writer).
- G-2 `insights._letters` and `insights._book_family` have 10 columns with no L comment, and `insights._letters` holds `entry_id`, `author_id`, `child_id` (L3). `classification.test.mjs:14` reads schema `public` only. No role has a grant on them, and no test names `insights._book_family`.
- G-6 `subscription_status` and `subscription_report_rates` have no age sweep; they go with the account.
- C-2 `subscription_status` and `subscription_consents` are server-side purchase state (`20261016001000`, D-080, D-081). `DATA_CLASSIFICATION.md` 4.1 says no server table holds purchases (ADR 0013) and lists none of the four `subscription_*` tables. The migration header says what it does not hold: receipts, transaction ids in clear, prices, payment data (`20261016001000:19`).

## Questions for the council

- Q-c1 (CPO-privacy, CLO) Is a server copy of plan state still wanted given ADR 0013? Default: yes, as built and labelled L3; add the four tables to the inventory in BL-960.
- Q-c2 (CCO) Retention of `subscription_status` rows. Default: with the account only.
- Q-c3 (CISO) Extend `classification.test.mjs` to `ops` and `insights`. Default: yes, as a test-only change by `qa` with `data-architect` adding the 10 missing comments in a new migration.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, head `e7d9bf15`) and the CDO and CISO return (`cdo-ciso.md`, working file, "CDO return"). Gates and numbered gaps: 01a section 8.

- Q-c1: AGREE, as built and labelled L3; conflict C-2 goes to `privacy` and counsel.
- Q-c2: AGREE, rows live with the account; give `subscription_report_rates` windows an age sweep (G-6, G10 [E]).
- Q-c3: AGREE (CDO return). Add the 10 missing comments in a new migration (02i S9), then widen `classification.test.mjs` (01a 8.4). Two internal views no role reads; unlabelled is still unlabelled.
- C9 (RULED): drop the grant of `insights_reader` to `authenticator` (`20261004300000:35-37` [V]); only `service_role` runs the weekly report (02i S9).
