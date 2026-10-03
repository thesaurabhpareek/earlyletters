---
title: Data classification
product: "{brand.name} (codename scribe)"
version: 1.3.0
status: draft-for-counsel
owner: founder (data governance lead role)
companion: data-policy.md (retention, ownership), DELETION_AND_EXPORT_SPEC.md (DATA-REQ), ENGINEERING_REQUIREMENTS.md (LEGAL-REQ), PRD.md section 7.10
changelog:
  - version: 1.3.0
    date: 2026-10-03
    summary: Alignment with PRD.md 1.3 and docs/DECISIONS.md. RevenueCat removed (ADR 0013); the App Store account token (`app_account_tokens`) and original transaction id are L3, storefront L2. Device settings use `ageGate.passed` and `ageGate.stoppedAt` only; `ageAttested` and `ageAttestedAt` retired (D-026). Open issue 3 has a recommended answer (D-039: contributors never see the due date or birth year) and issue 4 a recommended default (D-025: lock-screen names off, and server pushes never carry the child's name). Minor.
  - version: 1.1.0
    date: 2026-10-02
    summary: Adds the device-only 18+ entry gate state (PRD.md 1.2, PRD-REQ-019). Minor.
  - version: 1.0.0
    date: 2026-10-02
    summary: First version. Four levels (PRD 7.10 founder decision), handling rules per level, full inventory of Postgres columns, views, Storage buckets, device stores and analytics properties. Column levels are enforced by COMMENT ON COLUMN in supabase/migrations and supabase/tests/classification.test.mjs.
---

# Data classification

> **AI-drafted for counsel review. Not legal advice.** This document is the authoritative definition of the L1 to L4 levels named in PRD section 7.10. Where data-policy.md uses the older classes (C, S, A, T), section 1 gives the mapping.

## 0. How this is enforced

| Control | Where | Status |
|---|---|---|
| Every column of every table and view in `public` carries a `COMMENT ON COLUMN` that starts with `L1`, `L2`, `L3` or `L4` | `supabase/migrations/*.sql` (from `20261002020000_data_governance.sql`) | Automated: `supabase/tests/classification.test.mjs` fails on any unlabelled column in `public`. The `ops` and `insights` schemas carry the same comments; `insights_aggregates.test.mjs` checks every insights column is L2 |
| Content, child identity and dictionary columns are L4; person identifiers are at least L3 | same test | Automated |
| Every `public` table has RLS on; the only views are the reviewed `book_entries` and `my_policy_state` | same test | Automated |
| Storage buckets, device stores, SDKs, log streams, analytics properties | this document, sections 4.4 to 4.9; the analytics catalogue is enforced in code (`packages/analytics`, TRACKING_PLAN 6.3) | Manual review in the PR that adds them; machine-readable `docs/legal/data-map.yaml` (PRD 7.10 item 1) not yet built |
| L4 never in analytics, logs, URLs, push payloads | `packages/analytics` allowlist, log canary (LEGAL-REQ-014, -017) | Allowlist in `packages/analytics` (in progress); log canary not built |

Rule for every PR: a new table, column, bucket, device column, SDK or analytics property ships with its level in the same PR. The database part is a CI gate today; the rest is a review checklist item until `data-map.yaml` exists.

## 1. Levels

| Level | Name | Meaning | Examples | Maps from data-policy class | Maps from ARCHITECTURE section 8 |
|---|---|---|---|---|---|
| **L1** | Public | Meant for anyone; publishing it harms no one | Published legal texts and their versions, store listing, website, prompt library, book layouts | (new) | n/a |
| **L2** | Internal | Operational data with no personal content: enums, flags, counts, buckets, system timestamps, internal ids of non-person records | `entries.kind`, `in_book`, `deleted_at`, `audit_events.action`, deletion receipts (counts), allowlisted analytics properties, scrubbed crash reports | T, parts of A | C4 Telemetry |
| **L3** | Confidential (PII) | Identifies a person or a child's book, or says something about a person that is not content | Person ids, display name, signature ("Papa"), relation (parent or contributor), invite hashes, purchase state, staff identities on holds, object paths containing ids, device locale | A | C3 Identity (except child DOB, which is L4) |
| **L4** | Restricted (encryption required) | Content people created, data derived from it, sensitive data about a person or the child, and secrets | Letter text, raw transcript, machine edits, STT metadata, versions, search index, raw-transcript hash, audio, photos, dictionary terms, child name, nickname, birthday, due date, languages, goals, sealed dates, tokens, keys | C, S | C1 Voice, C2 Words |

### 1.1 Rules for choosing a level

1. **Highest wins.** A column, file or event property takes the highest level of anything it can contain. A row or object takes the highest level of its columns for storage and access purposes.
2. **Derived data inherits.** Indexes, hashes, embeddings, alignments and caches derived from L4 content are L4 (`entries.search`, `entries.raw_sha256`, `stt_meta`). A coarse reduction may drop a level only when it cannot be reversed and is reviewed (for example, a boolean "multilingual" from L4 languages; see section 6, item 2).
3. **Free text defaults to L4.** Any field where a person can type or say anything is L4 unless the field is length-capped and its purpose is a name or signature (L3).
4. **Person identifiers are L3.** Profile ids in any column (`author_id`, `profile_id`, `actor_id`, `created_by`, `invited_by`, `accepted_by`, `owner_id`, `superseded_by`) and anything containing them (object paths, purge ledger ids, pseudonymised hashes).
5. **Book and letter ids are L3** (`children.id`, `entries.id` and every `child_id`): they key a child's book and its letters. Internal ids of operational records (`audit_events.id`, `deletion_requests.id`, invite ids, version ids) are L2.
6. **Child data.** Anything that names, dates or describes the child (name, nickname, birthday, due date, photo) is L4. The child is referenced in analytics only by ordinal (`first`, `second`, `third_plus`) and `child_count_bucket`.
7. **Health-adjacent data is L4** even when it looks like metadata: due date (PRD K-25), safety tiers (device only, PRD K-06), anything that could imply a person's mental state. `child_member_prefs.celebrations_paused` is L3 for this reason, not L2.
8. **Secrets are L4**: session tokens, invite and return-link tokens (only their hashes are stored, at L3), encryption keys and wrapped keys, the escrow key, the Apple refresh token.
9. **L2 is necessary, not sufficient, for analytics.** An analytics property must be L2 and in the typed catalogue. Internal ids (even L2 ones) are never analytics properties; the only identifier is the random analytics id.

## 2. Handling rules per level

| Handling | L1 Public | L2 Internal | L3 Confidential (PII) | L4 Restricted |
|---|---|---|---|---|
| **Storage** | Repo (`packages/content`), website, public tables (`policy_documents`, `policy_versions`) | Postgres, service logs, PostHog, Sentry | Postgres and Supabase Auth only, behind RLS or service role; device app sandbox | Postgres behind RLS (author-only where PRD K-09 applies); private Storage buckets; device app sandbox and Keychain/Keystore. Never in a new store without an inventory update |
| **Encryption** | TLS in transit | TLS in transit; provider encryption at rest | TLS 1.2+ in transit; provider encryption at rest (Supabase at rest **Unverified**, LEGAL-REQ-022(c)) | All of L3, plus: audio and web-contributor audio client-encrypted (AES-256-GCM, ADR 0006) before upload; device files with iOS Data Protection at least "complete until first user authentication"; keys never leave Keychain/Keystore unwrapped. Release blocks if any L4 store lacks a recorded encryption control |
| **Logging** | Allowed | Allowed (ids of operational records, enums, counts, durations) | Not in log streams (Supabase API, Edge Function, Vercel, Sentry). Person ids appear only in database audit tables (`audit_events`, planned `ops_audit_log`) | Never in any log, crash report, breadcrumb, error message, email subject, push payload or support prefill (LEGAL-REQ-014). Log canary scans for the fixture family "Asha" |
| **Analytics** | n/a | Allowed only if in the typed catalogue (section 4.7) | Never | Never |
| **URLs** | Allowed | Allowed | Never in paths or query strings; invite tokens only in URL fragments | Never; search queries go in request bodies |
| **Retention** | While published; versions kept forever | 90 days to 24 months, per data-policy section 6 | Life of account; deleted or pseudonymised at account deletion except listed legal retention (consent 3 years, transactions 7 years) | Until its author deletes it (30-day tombstone, then purge), or the book's sole parent deletes the book, or the account is deleted |
| **Access** | Anyone | Staff with a need; users see their own (for example their audit and deletion rows) | RLS: the person themselves and co-members of the same child where the product needs it; service role only through named runbooks that write an audit row (LEGAL-REQ-025) | RLS: author for working material (`raw_transcript`, `raw_sha256`, `machine_edits`, `stt_meta`, versions, dictionary); book members read letters only through `book_entries` while the letter is in the book and the book is live; no staff tool shows L4; service-role access only through deletion, legal-process and safety runbooks with an audit row |
| **Export** | n/a | Included where useful (dates, flags) | The person's own L3 (profile, signature, memberships) | Author exports all of their own L4; a book export contains other people's letters only as the book shows them, never their raw transcripts, edits or STT metadata (DATA-REQ-050, PRD K-09). Export files are plaintext by design and the export screen says so (DATA-REQ-056); server-built exports expire in 7 days |
| **Deletion** | Unpublish by new version | Fixed retention by `purge_due()` | Deleted with the account, or pseudonymised (audit actor ids nulled, policy acceptances hashed with a pepper) | Tombstone 30 days, purge, Storage API deletion, off backups within 7 more days, processors within 45 days of request (data-policy section 5) |
| **Test data** | Real | Synthetic | Synthetic, fictional family "Asha" only | Synthetic, fictional family "Asha" only (CLAUDE.md) |
| **Processors** | Any | Under DPA | Under DPA, listed in subprocessors.md | Under DPA with no-training and zero/no-retention terms (LEGAL-REQ-020); only with the user's AI-processing consent when content leaves the device |

## 3. Child scope

Every L3 and L4 row tied to a child is readable only by that child's members (PRD 7.10 item 8). `data_governance.test.mjs` includes a cross-child leak test: members of one book see nothing of another book across `book_entries`, `entries`, `children`, `child_members`, `child_member_prefs` and photos in Storage.

## 4. Inventory

### 4.1 Postgres (generated from the column comments)

Generated on 3 Oct 2026 by loading every migration through `20261004300000_insights_aggregates.sql` into the test database and reading `col_description` for schemas `public`, `ops` and `insights` (internal underscore views omitted). If this table disagrees with a migration, the migration wins and this table must be regenerated. Status: pending live apply (see `supabase/APPLY.md`).

Removed on 3 Oct 2026 (migration `20261004000000_plus_on_device_only.sql`, founder decision 3): `store_subscriptions`, `store_notifications` and `app_account_tokens`. No server table holds purchases; Plus is checked on the device with StoreKit (ADR 0013).

#### 4.1.1 Schema `public`

##### `audit_events`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal id |
| `at` | L2 | system timestamp |
| `actor_id` | L3 | person id; nulled at account deletion |
| `actor_kind` | L2 | enum |
| `action` | L2 | enum |
| `subject_type` | L2 | enum |
| `subject_id` | L3 | subject id (may be a person id; nulled at deletion) |
| `child_id` | L3 | book id |
| `detail` | L2 | enums and counts only (512 bytes max) |

##### `book_entries` (view)

| Column | Level | Note |
|---|---|---|
| `id` | L3 | letter id |
| `child_id` | L3 | book id |
| `author_id` | L3 | person id |
| `author_signs_as` | L3 | signature at save time |
| `kind` | L2 | enum |
| `occurred_on` | L3 | date of the family moment |
| `captured_at` | L2 | capture timestamp |
| `capture_mode` | L2 | enum |
| `edit_level` | L2 | enum |
| `prompt_key` | L2 | prompt catalogue key |
| `prompt_library_version` | L2 | version number |
| `engine_version` | L2 | version number |
| `final_text` | L4 | content |
| `in_book` | L2 | flag |
| `photo_path` | L3 | object path |
| `audio_kept_on_device` | L2 | flag |
| `sounds_like_me` | L2 | flag |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |
| `deleted_at` | L2 | tombstone time (author rows only) |
| `search` | L4 | content-derived full-text index |
| `approval` | L2 | family review state |

##### `child_invites`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal invite id |
| `child_id` | L3 | book id |
| `invited_by` | L3 | person id |
| `token_hash` | L3 | SHA-256 of the invite token (token itself is L4, never stored) |
| `role` | L3 | relation offered |
| `expires_at` | L2 | system timestamp |
| `accepted_by` | L3 | person id |
| `accepted_at` | L2 | system timestamp |
| `created_at` | L2 | system timestamp |
| `revoked_at` | L2 | system timestamp |
| `signs_as` | L3 | signature the inviter suggested ("Nani") |

##### `child_member_prefs`

| Column | Level | Note |
|---|---|---|
| `child_id` | L3 | book id |
| `profile_id` | L3 | person id |
| `signs_as` | L3 | signature for this child |
| `include_in_reminders` | L2 | reminder setting |
| `celebrations_paused` | L3 | personal setting (may reflect a hard season) |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |

##### `child_members`

| Column | Level | Note |
|---|---|---|
| `child_id` | L3 | book id |
| `profile_id` | L3 | person id |
| `role` | L3 | relation to the child (parent or contributor) |
| `joined_at` | L2 | system timestamp |
| `auto_add_letters` | L2 | parent setting per family member |

##### `children`

| Column | Level | Note |
|---|---|---|
| `id` | L3 | book id (identifies a child's book) |
| `name` | L4 | child name |
| `date_of_birth` | L4 | child birthday |
| `created_by` | L3 | person id; null after creator account deletion |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |
| `deleted_at` | L2 | book tombstone time (server clock) |
| `deletion_request_id` | L2 | internal request id |
| `nickname` | L4 | child nickname |
| `due_date` | L4 | due date (consumer health data, PRD K-25) |
| `photo_path` | L3 | object path ({child_id}/...), points at L4 photo |
| `book_look` | L2 | theme enum |
| `family_can_read` | L2 | sharing setting |
| `hidden_at` | L2 | hide-book time |

##### `deletion_request_steps`

| Column | Level | Note |
|---|---|---|
| `request_id` | L2 | request id |
| `step` | L2 | enum |
| `status` | L2 | enum |
| `attempts` | L2 | count |
| `last_error_code` | L2 | HTTP status or error class |
| `updated_at` | L2 | system timestamp |
| `next_attempt_at` | L2 | system timestamp (retry backoff) |

##### `deletion_requests`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | request id (appears on receipts) |
| `kind` | L2 | enum |
| `profile_id` | L3 | person id; nulled on completion |
| `child_id` | L3 | book id |
| `status` | L2 | enum |
| `source` | L2 | enum |
| `requested_at` | L2 | system timestamp |
| `scheduled_for` | L2 | system timestamp |
| `cancelled_at` | L2 | system timestamp |
| `executing_at` | L2 | system timestamp |
| `completed_at` | L2 | system timestamp |
| `had_active_subscription` | L3 | purchase state of a person |
| `receipt` | L2 | counts and step outcomes, never content |

##### `dictionary_terms`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal id |
| `owner_id` | L3 | person id |
| `child_id` | L3 | book id |
| `term` | L4 | names and family words |
| `kind` | L2 | enum |
| `heard_as` | L4 | misheard spellings of names |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |

##### `entries`

| Column | Level | Note |
|---|---|---|
| `id` | L3 | letter id (device-generated UUIDv7) |
| `child_id` | L3 | book id |
| `author_id` | L3 | person id |
| `kind` | L2 | enum |
| `occurred_on` | L3 | date of the family moment |
| `captured_at` | L2 | capture timestamp |
| `capture_mode` | L2 | enum |
| `edit_level` | L2 | enum |
| `prompt_key` | L2 | prompt catalogue key |
| `prompt_library_version` | L2 | version number |
| `engine_version` | L2 | version number |
| `raw_transcript` | L4 | content: exact words, author-only (PRD K-09) |
| `stt_meta` | L4 | content-derived: per-token timestamps, author-only |
| `machine_edits` | L4 | content: edit list with offsets, author-only |
| `final_text` | L4 | content: the letter as the book renders it |
| `in_book` | L2 | flag |
| `photo_path` | L3 | object path ({child}/{author}/{entry}), points at L4 photo |
| `audio_kept_on_device` | L2 | flag |
| `sounds_like_me` | L2 | flag |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |
| `deleted_at` | L2 | tombstone time (server clock) |
| `search` | L4 | content-derived full-text index of final_text |
| `deleted_reason` | L2 | enum |
| `raw_sha256` | L4 | content-derived hash of raw_transcript, author-only |
| `author_signs_as` | L3 | signature at save time |
| `approval` | L2 | family review state (not_needed, pending, added, set_aside) |
| `reviewed_by` | L3 | person id of the reviewing parent; nulled at account deletion |
| `reviewed_at` | L2 | system timestamp |
| `sync_xid` | L2 | system version: id of the transaction that last wrote the row (sync cursor) |
| `sync_restored_from` | L2 | system timestamp: server time a restore re-upload brought back (null after any other write) |

##### `entry_versions`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal version id |
| `entry_id` | L3 | letter id |
| `final_text` | L4 | content: previous text |
| `in_book` | L2 | flag |
| `created_at` | L2 | system timestamp |
| `machine_edits` | L4 | content: previous edit list |
| `superseded_by` | L3 | person id; nulled at account deletion |

##### `legal_holds`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal id |
| `scope` | L2 | enum |
| `scope_id` | L3 | person, book or letter id |
| `reason_code` | L3 | enum (reveals that a person is subject to legal process) |
| `matter_ref` | L3 | ticket reference, never content |
| `placed_by` | L3 | staff identity |
| `placed_at` | L2 | system timestamp |
| `review_by` | L2 | date |
| `released_at` | L2 | system timestamp |
| `released_by` | L3 | staff identity |

##### `my_policy_state` (view)

| Column | Level | Note |
|---|---|---|
| `document` | L2 | document key |
| `version` | L2 | document version |
| `action` | L2 | enum |
| `accepted_at` | L2 | server time of the act |

##### `policy_acceptances`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal id |
| `profile_id` | L3 | person id ("user"); nulled at deletion |
| `subject_hash` | L3 | pseudonymised person id (peppered SHA-256) |
| `pseudonymised_at` | L2 | retention clock |
| `document` | L2 | document key ("policy") |
| `version` | L2 | document version |
| `action` | L2 | enum |
| `method` | L2 | enum |
| `surface` | L2 | screen id |
| `accepted_at` | L2 | server time of the act |
| `client_recorded_at` | L2 | device time of the act |
| `app_version` | L2 | app version |
| `platform` | L2 | enum |
| `locale` | L3 | device locale (language proxy) |
| `rendered_sha256` | L2 | hash of the consent text shown |
| `context` | L2 | enums only (product, auth method) |

##### `policy_documents`

| Column | Level | Note |
|---|---|---|
| `key` | L1 | document key |
| `title` | L1 | document title |
| `needs_affirmative_act` | L1 | flag |

##### `policy_versions`

| Column | Level | Note |
|---|---|---|
| `document` | L1 | document key |
| `version` | L1 | semver |
| `major` | L1 | generated from version |
| `minor` | L1 | generated from version |
| `patch` | L1 | generated from version |
| `change_class` | L1 | enum |
| `requires_reconsent` | L1 | flag |
| `published_at` | L1 | date |
| `new_users_from` | L1 | date |
| `effective_at` | L1 | date |
| `content_sha256` | L1 | hash of the published text |
| `url` | L1 | permanent URL |
| `summary` | L1 | plain-language change line |

##### `profiles`

| Column | Level | Note |
|---|---|---|
| `id` | L3 | person id (= auth user id) |
| `display_name` | L3 | name the person chose |
| `signs_as` | L3 | default signature ("Papa") |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |
| `first_run_closed_at` | L2 | system timestamp (first-run free batch used) |

##### `purge_ledger`

| Column | Level | Note |
|---|---|---|
| `entity_type` | L2 | enum |
| `entity_id` | L3 | id of a purged letter, book, person or object path |
| `purged_at` | L2 | system timestamp |

##### `storage_purge_queue`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal id |
| `bucket_id` | L2 | bucket name |
| `object_path` | L3 | object path (contains book and person ids) |
| `is_prefix` | L2 | flag |
| `reason` | L2 | enum |
| `request_id` | L2 | request id |
| `enqueued_at` | L2 | system timestamp |
| `attempts` | L2 | count |
| `done_at` | L2 | system timestamp |
| `next_attempt_at` | L2 | system timestamp (retry backoff) |
| `last_error_code` | L2 | HTTP status or error class |

##### `sync_epochs`

| Column | Level | Note |
|---|---|---|
| `epoch` | L2 | counter |
| `started_at` | L2 | system timestamp |
| `restore_point` | L2 | system timestamp: the backup point the database was restored to |
| `reason` | L2 | enum |

##### `sync_op_receipts`

| Column | Level | Note |
|---|---|---|
| `op_id` | L2 | device-made op id (UUIDv7) |
| `profile_id` | L3 | person id |
| `applied_at` | L2 | system timestamp |

##### `sync_rate_windows`

| Column | Level | Note |
|---|---|---|
| `profile_id` | L3 | person id |
| `bucket` | L2 | enum |
| `window_start` | L2 | system timestamp |
| `hits` | L2 | count |

#### 4.1.2 Schema `ops` (service role only; migration 20261004200000)

Runbook access log (12 months, kept after account deletion as a security log), alert cooldowns, the per-person `analytics-forget` quota, and the encrypted Apple refresh token needed to revoke Sign in with Apple at deletion.

##### `ops.alert_state`

| Column | Level | Note |
|---|---|---|
| `kind` | L1 | alert kind |
| `last_sent_at` | L2 | system timestamp |
| `sends` | L2 | count |

##### `ops.apple_tokens`

| Column | Level | Note |
|---|---|---|
| `profile_id` | L3 | person id |
| `ciphertext` | L4 | secret: Apple refresh token, AES-256-GCM under TOKEN_KEK_V<key_version>, AAD = profile id |
| `key_version` | L2 | key version |
| `client_id` | L1 | Apple client id the token was issued to (bundle id or Services ID) |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |

##### `ops.audit_log`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | row id |
| `at` | L2 | system timestamp |
| `operator` | L3 | staff handle |
| `runbook` | L2 | enum |
| `reason_code` | L2 | enum-like code |
| `ticket` | L2 | ticket reference, never content |
| `target_profile` | L3 | person id (kept 12 months, also after account deletion: security log) |
| `target_child` | L3 | book id |
| `target_entry` | L3 | letter id |
| `detail` | L2 | enums and counts only, 512 bytes |

##### `ops.forget_quota`

| Column | Level | Note |
|---|---|---|
| `profile_id` | L3 | person id |
| `day` | L2 | date |
| `calls` | L2 | count |

#### 4.1.3 Schema `insights` (views; service role and `insights_reader` only)

See 4.9.

##### `insights.family_invites` (view)

| Column | Level | Note |
|---|---|---|
| `week` | L2 | week start (UTC) |
| `role` | L2 | enum (co_parent, contributor) |
| `sent` | L2 | count, k-anonymised |
| `accepted` | L2 | count, k-anonymised with remainder |
| `accepted_within_7d` | L2 | count, k-anonymised with remainder |

##### `insights.first_letter_conversion` (view)

| Column | Level | Note |
|---|---|---|
| `cohort_week` | L2 | sign-up week start (UTC) |
| `d7_matured` | L2 | flag |
| `d30_matured` | L2 | flag |
| `new_accounts` | L2 | count, k-anonymised |
| `first_letter_d1` | L2 | count, k-anonymised with remainder |
| `first_letter_d7` | L2 | count, k-anonymised with remainder |
| `first_letter_d30` | L2 | count, k-anonymised with remainder |

##### `insights.language_mix` (view)

| Column | Level | Note |
|---|---|---|
| `week` | L2 | week start (UTC) |
| `lang` | L2 | one of the seven v1.0 codes or other (reviewed reduction of L4 languages, DATA_CLASSIFICATION 4.9) |
| `families` | L2 | count, at least k (small languages merged into other) |

##### `insights.letters_per_active_family` (view)

| Column | Level | Note |
|---|---|---|
| `week` | L2 | week start (UTC) |
| `complete` | L2 | flag: week has ended |
| `active_families` | L2 | count, k-anonymised |
| `letters_per_family_mean` | L2 | statistic over at least k families |
| `letters_per_family_p50` | L2 | statistic over at least k families |
| `letters_per_family_p90` | L2 | statistic over at least k families |
| `families_two_plus_voices` | L2 | count, k-anonymised with remainder |

##### `insights.retention_cohorts` (view)

| Column | Level | Note |
|---|---|---|
| `cohort_week` | L2 | first-letter week start (UTC) |
| `week_offset` | L2 | weeks since cohort week |
| `cohort_writers` | L2 | count, k-anonymised |
| `active_writers` | L2 | count, k-anonymised with remainder |

##### `insights.weekly_keeping_families` (view)

| Column | Level | Note |
|---|---|---|
| `week` | L2 | week start (UTC) |
| `complete` | L2 | flag: week has ended |
| `families` | L2 | count, k-anonymised |
| `families_with_book_letter` | L2 | count, k-anonymised with remainder |
| `letters` | L2 | count, k-anonymised |
| `spoken_letters` | L2 | count, k-anonymised with remainder |
| `typed_letters` | L2 | count, k-anonymised with remainder |

### 4.2 Postgres `auth` schema (Supabase managed; no comments possible)

| Element | Level | Note |
|---|---|---|
| `auth.users.id` | L3 | Same value as `profiles.id` |
| `auth.users.email`, phone, metadata | L3 | Email is the main identifier; phone never collected (LEGAL-REQ-012) |
| `auth.identities` (provider subject ids) | L3 | Apple and Google subject ids |
| `auth.sessions`, `auth.refresh_tokens` | L4 | Secrets |
| Auth audit log (may hold IP addresses) | L3 | Retention **Unverified** (DELETION spec OQ-5); target 90 days |
| Passkey credentials (when the flag is on) | L3 | Public keys and credential ids; the private key never leaves the phone |

The Apple refresh token is now stored, encrypted, in `ops.apple_tokens.ciphertext` (L4, 4.1.2).

### 4.3 Planned server tables (not yet in a migration)

Each must get column comments in the migration that creates it; the CI gate enforces this.

| Table or column | Planned level of the sensitive columns |
|---|---|
| `profile_settings` (languages, Hindi script, goals, reminder cadence) | Languages and goals L4 (PRD 7.10); cadence and reading size L2 |
| `public.entries.language` (spoken-letter language of a letter; feeds `insights.language_mix`) | L4 (a person's language) |
| `member_return_links` (hashed bearer token) | Hash L3 |
| `audio_blobs` (path, size, sha256, wrapped file key; v1.1 shared voice) | Wrapped key L4; sha256 of ciphertext L3; path L3 |
| `child_key_grants`, escrow wraps | L4 |
| `waitlist` (web) | Email L3 |

`ops_audit_log` (LEGAL-REQ-025) is built as `ops.audit_log` (4.1.2).

### 4.4 Supabase Storage buckets

Registry in code: `supabase/functions/purge-worker/lib/buckets.ts` (every bucket the purge enqueues; TDD 05 X-04).

| Bucket | Path | Content | Level | Status |
|---|---|---|---|---|
| `entry-photos` | `{child_id}/{author_id}/{entry_id}.{jpg,jpeg,heic,png}` (enforced by `entries_photo_path_scoped`) | Photos with letters | L4 (path itself L3) | Live, private |
| `child-photos` | `{child_id}/{uuid}.{ext}` (`children_photo_path_scoped`) | Child profile photo | L4 | v1.0, private |
| `ops-ledger` | `purges/YYYY-MM-DD.jsonl` | Ids of purged letters, books, people and objects, so a restore can replay deletions (DATA-REQ-030). No content | L3 | Created by migration 20261004200000; service role only (no policies); 60 days; excluded from the purge's own residue scans |
| `entry-audio` | `{child}/{author}/{entry}.m4a.enc` | AES-256-GCM ciphertext of recordings (ADR 0006) | L4 | v1.1 (no audio upload in v1.0, decision 9) |
| `inbox` | `{child_id}/{contributor}/{entry_id}.enc` | Web contributor audio, encrypted in the browser | L4 | v1.1 |
| `avatars` | `{profile_id}/{uuid}.{ext}` | Member photo | L3 | P1 |
| `exports` | `{profile_id}/{export_id}.zip` | Server-built exports, 7 days | L4 | P1 (v1.0 exports are made on the phone) |

### 4.5 Device: local SQLite (`apps/mobile/src/lib/store.ts`, `scribe.db`, schema `src/lib/db/migrations.ts` version 4)

Protection floor for the whole file: iOS Data Protection at least "complete until first user authentication" (LEGAL-REQ-022(b)); SQLCipher decision pending (LEGAL-REQ-022(d)). The highest level in the file is L4, so the file is handled as L4.

**`entries`**

| Column | Level | Note |
|---|---|---|
| `id` | L3 | Letter id (UUIDv7) |
| `kind`, `capture_mode`, `edit_level`, `prompt_key`, `engine_version`, `in_book`, `sounds_like_me` | L2 | Enums, flags |
| `occurred_on` | L3 | Date of the moment |
| `captured_at`, `updated_at`, `deleted_at`, `synced_at` | L2 | Timestamps |
| `raw_transcript`, `machine_edits`, `final_text` | L4 | Content |
| `child_id` | L3 | Book id |
| `author_id` | L3 | Person id |
| `author_signs_as` | L3 | Signature at save time |
| `audio_uri` | L3 | Sandbox path containing the letter id; points at L4 audio |
| `audio_duration_ms` | L2 | Duration |
| `audio_sha256` | L4 | SHA-256 of the recording file (DATA-REQ-046): derived from L4 audio, so L4 (rule 1.1.2), like `raw_sha256`. Never in analytics or logs |
| `audio_bytes` | L2 | File size |
| `transcript_status` | L2 | `waiting` while a spoken letter waits for its words; null when it has them |
| `server_version`, `server_updated_at`, `server_epoch` | L2 | Sync state of the server copy (version, time, restore epoch) |
| `sync_state` | L2 | Enum: local, pending, synced, rejected, held, gone |
| `approval` | L2 | Family review state from the server |

**`children`**

| Column | Level | Note |
|---|---|---|
| `id` | L3 | Book id |
| `name`, `birthday`, `due_date`, `nickname` | L4 | Child identity; due date is health data |
| `signs_as` | L3 | What this child calls the user |
| `role` | L3 | The user's relation to this book (from the server) |
| `created_by_me` | L2 | Flag |
| `reminders_on`, `family_can_read` | L2 | Settings |
| `server_state` | L2 | Enum: local, pending, synced, refused, left, deleted |
| `created_at`, `updated_at`, `hidden_at` | L2 | Timestamps |

**`drafts`** (capture in progress)

| Column | Level | Note |
|---|---|---|
| `id` | L3 | Future letter id |
| `child_id` | L3 | Book id |
| `capture_mode`, `prompt_key` | L2 | Enums |
| `created_at`, `audio_duration_ms` | L2 | |
| `audio_uri` | L3 | Path to L4 audio |
| `raw_transcript`, `typed_text` | L4 | Content |
| `state` | L2 | Enum: recording, ready, unrecoverable (crash-safe capture, TDD 01 3.4) |
| `audio_sha256` | L4 | As on `entries` |
| `audio_bytes` | L2 | File size |
| `recovered_at` | L2 | Time the launch sweep rescued the take |

**`orphan_audio`** (recordings found with no draft or letter while no book exists; reported in Settings, never deleted)

| Column | Level | Note |
|---|---|---|
| `file_name` | L3 | Recording file name (contains a letter id); points at L4 audio |
| `bytes` | L2 | File size |
| `found_at` | L2 | Timestamp |

**`sync_outbox`** (ordered upload queue)

| Column | Level | Note |
|---|---|---|
| `seq`, `lane`, `attempts` | L2 | Order, priority lane, retry count |
| `op_id` | L2 | Device-made op id (UUIDv7) |
| `type` | L2 | Op enum |
| `entity_id`, `book_id` | L3 | Letter or book id |
| `payload` | L4 | The op exactly as sent; can hold letter text. Never logged |
| `created_at`, `next_attempt_at`, `sent_at` | L2 | Timestamps |

**`rejected_writes`** (ops the server refused for good, DATA-REQ-043)

| Column | Level | Note |
|---|---|---|
| `op_id`, `type` | L2 | Op id and enum |
| `entity_id` | L3 | Letter or book id |
| `payload` | L4 | The refused op; content stays on the phone and in export |
| `code` | L2 | SQLSTATE |
| `rejected_at`, `seen_at` | L2 | Timestamps |

**`sync_books`** (one row per book this phone pulls)

| Column | Level | Note |
|---|---|---|
| `child_id` | L3 | Book id |
| `cursor` | L2 | Server sync position |
| `access` | L3 | Access signature of this person's membership |
| `meta_hash` | L4 | Hash of the book's settings, which include the child's name and dates (derived from L4, rule 1.1.2) |
| `members` | L3 | Members list from the server: person ids, roles and signatures |
| `birthday_md` | L4 | Birthday month and day shown to contributors (D-039) |
| `state` | L2 | Enum: live and the end states |
| `want_ids` | L2 | Flag: ask the server for the full id list on the next pull |

**`settings`** (key, value). Values are short strings; keys never hold content.

| Key | Level | Note |
|---|---|---|
| `activeChildId` | L3 | Book id |
| `appearance`, `readingSize`, `review.firstNoteSeen`, `content.dismissed` | L2 | Device preferences and dismissed content-block ids (server content keys) |
| `reminders.enabled`, `.paused`, `.cadence`, `.days`, `.weeklyDay`, `.time`, `.monthNotes` | L2 | Reminder preferences (C-REQ-001 to -011). The time is a local clock time, not linked to a child's dates |
| `notifications.lockScreenNames` | L2 | The setting only. When on, local notification text carries the child's name (L4) on the lock screen (section 6, item 4) |
| `player.original` | L2 | Play the original recording instead of the listening copy |
| `auth.lastMethod` | L2 | Last sign-in method (apple, google, email, passkey) |
| `language.spoken` | L4 | The author's spoken-letter languages, script and region (PRD 7.10: languages are L4) |
| `speech.language` | L4 | The author's primary speech language |
| `speech.letterLanguage.<letter id>` | L4 | Language a letter was spoken in; the key holds a letter id (L3) |
| `speech.memoryFailures`, `speech.jobRunning` | L2 | Model tier fallback count; transcription job marker |
| `packs.allowCellular` | L2 | Download packs on mobile data |
| `plus.cache` | L3 | Last StoreKit plan snapshot (state, product, period, dates, environment) for offline launch; purchase state of a person |
| `readTogether.sessions.<book id>` | L2 | Count of free Read together sessions used; the key holds a book id (L3), so the row is handled as L3 |
| `sync.ownerId` | L3 | Person id that owns the local rows |
| `sync.epoch`, `sync.epochStartedAt`, `sync.restoreAt`, `sync.pausedFor`, `sync.lastSyncedAt`, `sync.lastVerifyAt` | L2 | Sync state |
| `accountDeletion.forgetPending` | L2 | Flag: analytics ids still to send to `analytics-forget` |
| `scribe.analytics.consent` | L2 | Analytics choice: unknown, granted, denied |
| `scribe.analytics.id`, `scribe.analytics.retired_ids` | L2 | Random analytics id and up to 20 retired ids, kept only for deletion (TRACKING_PLAN 7). Never sent anywhere except PostHog (after a yes) and `analytics-forget` |
| `scribe.analytics.first_launch_at`, `scribe.analytics.last_active_at` | L2 | Device times used only to compute buckets (`days_since_install`, `days_since_last_open`); never sent raw |
| `scribe.analytics.consent_offers` | L2 | Count of unanswered consent sheet showings (at most 2) |
| `ageGate.passed` (after Yes), `ageGate.stoppedAt` (after No only) | L2 | 18+ entry gate state (PRD-REQ-019, D-026). `ageAttested` and `ageAttestedAt` are retired; the server records `age_attested: true` in the `terms` acceptance context |
| `preview.draftId` | L3 | Development builds only (web preview harness) |
| `family` (legacy, migrated away on open) | L4 | Contained child name and birthday |

### 4.6 Device: files and secure storage

| Element | Level | Note |
|---|---|---|
| `audio/<entry_id>.m4a` | L4 | Free plan: the only copy |
| Listening copies (cleaner playback copy, decision 8) | L4 | Derived from the recording; the original is never altered |
| Photos, cached book audio of other members | L4 | Deleted on purge sync or removal |
| Export ZIPs in app temp | L4 | Deleted after the share sheet closes; plaintext by design |
| Installed packs: `Application Support/packs/installed/<pack id>/<version>/` with `pack.json` and the pack file; `staging/` for partial downloads | L1 | Text-rule packs (rules, filler and negation tables, punctuation, phonetic tables, prompt text) and speech models: public data checked against the signed manifest (SHA-256). Excluded from backup. Which packs are installed reveals which languages the author picked, so the **list** of installed packs is handled as L4 on the device and never leaves it except as the `pack_download` analytics event after a yes (TRACKING_PLAN 6.2) |
| Remote document cache (`Application Support/remote`: signed remote config, pack manifest, content blocks) | L1 | Public server documents |
| Secure storage (Keychain/Keystore): `scribe.auth` (Supabase session) | L4 | Secret |
| Secure storage: `scribe.auth.appleUser` | L3 | Apple user identifier for credential-state checks |
| Secure storage: `scribe.auth.pendingName` | L3 | Name Apple returned at first sign-in, until it is saved to the profile |
| Secure storage: `scribe.family.pendingInvite` | L4 | Invite token waiting for sign-in (secret) |
| Keychain/Keystore: child content key, X25519 private key | L4 | ADR 0006, A-NFR-008 (v1.1 shared voice) |
| PostHog SDK state (after a yes only) | L2 | In memory only (`persistence: 'memory'`): queue, ids and flags never touch disk |
| Safety tiers (local only, PRD K-06) | L4 | Never leave the device; no server table exists |
| 18+ entry gate state (PRD-REQ-019) | L2 | Device only: `passed` boolean, or the time of a No answer for the 24-hour stop screen. Never an age, birth date or age range; never in analytics or logs |
| Whisper and VAD model files | L1 | Not personal data |

### 4.7 Analytics properties (PostHog, after opt-in only)

The authoritative list is the typed catalogue `packages/analytics/src/catalog.ts`, rendered as `docs/analytics/TRACKING_PLAN.md` section 3.1 (a test fails if they differ). Every event and property is L2: enums, booleans and bounded integers. No event carries an id other than the random analytics id, a name, a date, a file name, a URL or any text. Children appear only as `child_ordinal` and `child_count_bucket` (an event property, never a person property).

Changes on 3 Oct 2026 (catalogue `SCHEMA_VERSION` 2):
- Server billing events (`trial_converted`, `renewal`, `refund_detected` and the rest) are retired: billing is Apple's alone and no server of ours sees purchases. Device Plus events are `plus_offer_viewed`, `plus_offer_closed`, `plan_changed` and `restore_result`.
- `goals_set` sends a count only (resolves 6.1).
- **Language (reviewed reduction, pending counsel):** `lang`, one of the seven v1.0 codes, on `language_set` and `pack_download` only, one language per event, never on letter, capture, book, family or Plus events, never a list or a multilingual flag (rule 1.1.2; TRACKING_PLAN 6.2; DEBATES Q-004). This replaces the earlier `languages_set{multilingual}` (6.2).
- `pack` is a short analytics id derived from the manifest pack id; the manifest id, file name and URL are never sent.
- `machine_edit_rejected` carries the verifier reason (including `not_vetted_for_language`), edit type, source and a count; never text or offsets.
- SDK fields kept: `$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type`, `$lib`, `$lib_version`, `$session_id`; dropped at the source and again in `before_send`: device name and model, locale, timezone, screen size, person properties.

Sentry crash events: L2 after scrubbing (`sendDefaultPii: false`, `beforeSend` strips bodies, query strings and fields named like `text|transcript|name|note|letter`, ADR 0008); same consent switch as analytics.

### 4.8 Logs and processors

| System | Level of what it may hold | Control |
|---|---|---|
| Supabase API, Postgres and Edge Function logs | L2 | No `log_statement=all`; functions log ids of operational records and counts only (typed logger, `supabase/functions/_shared/log`) |
| Sync (Supabase RPCs; PowerSync only if used, D-023) | L4 (replicated rows) | Pulls mirror RLS; co-members read letters through `book_entries` columns only (no raw transcript) |
| PostHog | L2 | Section 4.7; opt-in; no tracking in Apple's sense (TRACKING_PLAN 10) |
| Sentry | L2 | Scrubbed; same consent |
| Insights job (`scripts/insights/run.ts`) | L2 | Reads `insights_aggregates()` (k-anonymised counts) and PostHog counts with read-only keys; writes `docs/insights/*.md`, refused if it contains anything shaped like an email, URL, UUID or token (4.9) |
| Apple (StoreKit on the device; App Store Connect reports) | n/a on our servers | Purchases stay between the person and Apple; no App Store Server Notifications endpoint, no purchase ledger (ADR 0013) |
| AI providers (only with consent; v1.1) | L4 in transit | Zero retention, no training (LEGAL-REQ-020) |
| Pack and model host (D-046) | L1 | Sees an IP address and a file request, nothing else |
| Email provider | L3 | Transactional only; no content in subjects or bodies |
| Support mailbox | L4 | People may paste letters; handled as L4 |

### 4.9 Insights aggregates (schema `insights`, migration 20261004300000)

Six views and `public.insights_aggregates(p_weeks)`: weekly keeping families, letters per active family, first-letter conversion, family invites, writer retention cohorts, language mix (TRACKING_PLAN 4; INSIGHTS_LOOP.md). They read L3 and L4 tables (`entries`, `children`, `child_members`, `child_invites`, `profiles`) inside the database and publish only L2 counts:
- No output column is an id, a person's timestamp, or text; week starts are system dates.
- k = 10: every published count is 0 or at least 10; a part of a total is published only when its remainder is also 0 or at least 10; statistics only over 10 or more families; languages below 10 families merge into `other`, and a week below 10 families is not published.
- Readers: `service_role` and the no-login role `insights_reader` only; `anon` and `authenticated` cannot read them (tested).
- `language_mix.lang` is a reduction of L4 languages to seven codes plus `other`, counted per family and k-anonymised: reviewed as L2 under rule 1.1.2 (counsel to confirm with 4.7).

## 5. Changes made with this document (2 Oct 2026)

- `safety_events` dropped from the server (PRD K-06). The data-policy row is superseded; DATA-REQ-061 is not applicable.
- Raw transcripts, their hash, machine edits and STT metadata are readable only by the author; book members read through `book_entries` (PRD K-09).
- Every `public` column carries its level; CI fails without one.

## 6. Open issues for owners

1. **Resolved 3 Oct 2026:** `goals_set` sends a count only.
2. **Superseded 3 Oct 2026:** `languages_set{multilingual}` is gone. In its place, a single `lang` code from the seven v1.0 languages on two events (4.7) and the k-anonymised `insights.language_mix` (4.9). Counsel to confirm both are acceptable as L2, and that a language code is not treated as an ethnicity proxy (DEBATES Q-004).
3. **Due date and birthday are visible to contributors** (children row is readable by all members). L4 handling is met (RLS, encryption at rest), but whether grandparents should see a due date is a product and counsel decision (K-25). **Recommended 3 Oct 2026 (D-039, counsel to confirm):** contributors see name, nickname and birthday month and day only; never the due date or birth year (BL-175).
4. **Lock-screen child names** (C-REQ-009 toggle) put L4 in local notification text. PRD 7.10 bans L4 in push payloads; local notifications are not server push, but the toggle must default off and never apply to server-sent pushes. **Recommended 3 Oct 2026 (D-025):** default off through remote config; family-letter pushes from the server never carry the child's name (BL-196).
5. **Supabase encryption at rest** is **Unverified** in writing (LEGAL-REQ-022(c)); record it before launch.
6. **`policy_acceptances.locale`** is classified L3 as a language proxy; counsel may decide it is L2.
7. **`data-map.yaml`** (PRD 7.10 item 1) is not built. The database part of the gate exists via column comments; device stores, SDKs and analytics need the same machine check.
8. **Installed packs reveal languages.** The pack files are public (L1), but the set installed on a phone shows which languages the author picked. Handled as L4 on the device (4.6); a backup or diagnostics feature must not include the list.
9. **`plus.cache`** holds the person's plan state on the device (L3). It is not purchase history on our servers, so the privacy label's Purchases entry needs a fresh look now that the server ledger is gone (owner: legal, `app-store-privacy-labels.md`).
