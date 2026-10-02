---
title: Data classification
product: "{brand.name} (codename scribe)"
version: 1.0.0
status: draft-for-counsel
owner: founder (data governance lead role)
companion: data-policy.md (retention, ownership), DELETION_AND_EXPORT_SPEC.md (DATA-REQ), ENGINEERING_REQUIREMENTS.md (LEGAL-REQ), PRD.md section 7.10
changelog:
  - version: 1.0.0
    date: 2026-10-02
    summary: First version. Four levels (PRD 7.10 founder decision), handling rules per level, full inventory of Postgres columns, views, Storage buckets, device stores and analytics properties. Column levels are enforced by COMMENT ON COLUMN in supabase/migrations and supabase/tests/classification.test.mjs.
---

# Data classification

> **AI-drafted for counsel review. Not legal advice.** This document is the authoritative definition of the L1 to L4 levels named in PRD section 7.10. Where data-policy.md uses the older classes (C, S, A, T), section 1 gives the mapping.

## 0. How this is enforced

| Control | Where | Status |
|---|---|---|
| Every column of every table and view in `public` carries a `COMMENT ON COLUMN` that starts with `L1`, `L2`, `L3` or `L4` | `supabase/migrations/*.sql` (from `20261002020000_data_governance.sql`) | Automated: `supabase/tests/classification.test.mjs` fails on any unlabelled column |
| Content, child identity and dictionary columns are L4; person identifiers are at least L3 | same test | Automated |
| Every `public` table has RLS on; the only views are the reviewed `book_entries` and `my_policy_state` | same test | Automated |
| Storage buckets, device stores, SDKs, log streams, analytics properties | this document, sections 4.4 to 4.7 | Manual review in the PR that adds them; machine-readable `docs/legal/data-map.yaml` (PRD 7.10 item 1) not yet built |
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

### 4.1 Postgres `public` schema (generated from the column comments)

This table is generated from the migrations; if it disagrees with a migration, the migration wins and this table must be regenerated. Status: all rows below exist after `20261002020000_data_governance.sql` (pending live apply, see `supabase/APPLY.md`).

#### `audit_events`

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

#### `child_invites`

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

#### `child_member_prefs`

| Column | Level | Note |
|---|---|---|
| `child_id` | L3 | book id |
| `profile_id` | L3 | person id |
| `signs_as` | L3 | signature for this child |
| `include_in_reminders` | L2 | reminder setting |
| `celebrations_paused` | L3 | personal setting (may reflect a hard season) |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |

#### `child_members`

| Column | Level | Note |
|---|---|---|
| `child_id` | L3 | book id |
| `profile_id` | L3 | person id |
| `role` | L3 | relation to the child (parent or contributor) |
| `joined_at` | L2 | system timestamp |
| `auto_add_letters` | L2 | parent setting per family member |

#### `children`

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

#### `deletion_request_steps`

| Column | Level | Note |
|---|---|---|
| `request_id` | L2 | request id |
| `step` | L2 | enum |
| `status` | L2 | enum |
| `attempts` | L2 | count |
| `last_error_code` | L2 | HTTP status or error class |
| `updated_at` | L2 | system timestamp |

#### `deletion_requests`

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

#### `dictionary_terms`

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

#### `entries`

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

#### `entry_versions`

| Column | Level | Note |
|---|---|---|
| `id` | L2 | internal version id |
| `entry_id` | L3 | letter id |
| `final_text` | L4 | content: previous text |
| `in_book` | L2 | flag |
| `created_at` | L2 | system timestamp |
| `machine_edits` | L4 | content: previous edit list |
| `superseded_by` | L3 | person id; nulled at account deletion |

#### `legal_holds`

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

#### `policy_acceptances`

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

#### `policy_documents`

| Column | Level | Note |
|---|---|---|
| `key` | L1 | document key |
| `title` | L1 | document title |
| `needs_affirmative_act` | L1 | flag |

#### `policy_versions`

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

#### `profiles`

| Column | Level | Note |
|---|---|---|
| `id` | L3 | person id (= auth user id) |
| `display_name` | L3 | name the person chose |
| `signs_as` | L3 | default signature ("Papa") |
| `created_at` | L2 | system timestamp |
| `updated_at` | L2 | system timestamp |

#### `purge_ledger`

| Column | Level | Note |
|---|---|---|
| `entity_type` | L2 | enum |
| `entity_id` | L3 | id of a purged letter, book, person or object path |
| `purged_at` | L2 | system timestamp |

#### `storage_purge_queue`

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

#### `book_entries` (view)

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

#### `my_policy_state` (view)

| Column | Level | Note |
|---|---|---|
| `document` | L2 | document key |
| `version` | L2 | document version |
| `action` | L2 | enum |
| `accepted_at` | L2 | server time of the act |


### 4.2 Postgres `auth` schema (Supabase managed; no comments possible)

| Element | Level | Note |
|---|---|---|
| `auth.users.id` | L3 | Same value as `profiles.id` |
| `auth.users.email`, phone, metadata | L3 | Email is the main identifier; phone never collected (LEGAL-REQ-012) |
| `auth.identities` (provider subject ids) | L3 | Apple and Google subject ids |
| `auth.sessions`, `auth.refresh_tokens` | L4 | Secrets |
| Auth audit log (may hold IP addresses) | L3 | Retention **Unverified** (DELETION spec OQ-5); target 90 days |
| Apple refresh token (planned, Edge Function store) | L4 | Needed to revoke Sign in with Apple at deletion |

### 4.3 Planned server tables (not yet in a migration)

Each must get column comments in the migration that creates it; the CI gate enforces this.

| Table | Planned level of the sensitive columns |
|---|---|
| `profile_settings` (languages, Hindi script, goals, reminder cadence) | Languages and goals L4 (PRD 7.10); cadence and reading size L2 |
| `member_return_links` (hashed bearer token) | Hash L3 |
| `entitlements` (PRD K-28), purchase ledger | Product and dates L2; profile id and RevenueCat app user id L3 |
| `audio_blobs` (path, size, sha256, wrapped file key) | Wrapped key L4; sha256 of ciphertext L3; path L3 |
| `child_key_grants`, escrow wraps | L4 |
| `waitlist` (web) | Email L3 |
| `ops_audit_log` (LEGAL-REQ-025) | Operator and target ids L3 |

### 4.4 Supabase Storage buckets

| Bucket | Path | Content | Level | Status |
|---|---|---|---|---|
| `entry-photos` | `{child_id}/{author_id}/{entry_id}.{jpg,jpeg,heic,png}` (enforced by `entries_photo_path_scoped`) | Photos with letters | L4 (path itself L3) | Live, private |
| backup audio (name TBD) | per ADR 0006 | AES-256-GCM ciphertext of M4A | L4 | Planned |
| `inbox` | `{child_id}/{entry_id}` | Web contributor audio, encrypted in the browser | L4 | Planned (B) |
| `child-photos` | `{child_id}/...` (`children_photo_path_scoped`) | Child profile photo | L4 | Planned (column exists) |
| `avatars` | `{profile_id}/...` | Member photo | L3 | Planned (B) |
| `exports` | `{profile_id}/{export_id}.zip` | Server-built exports, 7 days | L4 | Planned (DATA-REQ-054) |
| `ops-ledger` | `purges/YYYY-MM-DD.jsonl` | Purged ids only | L3 | Planned |

### 4.5 Device: local SQLite (`apps/mobile/src/lib/store.ts`, `scribe.db`)

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

**`children`**

| Column | Level | Note |
|---|---|---|
| `id` | L3 | Book id |
| `name`, `birthday`, `due_date` | L4 | Child identity; due date is health data |
| `signs_as` | L3 | What this child calls the user |
| `reminders_on`, `family_can_read` | L2 | Settings |
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

**`settings`** (key, value)

| Key | Level | Note |
|---|---|---|
| `activeChildId` | L3 | Book id |
| `appearance`, `readingSize`, `reminders.cadence`, `reminders.paused`, `review.firstNoteSeen` | L2 | Device preferences |
| `ageAttested`, `ageAttestedAt` | L3 | Age attestation (no birth date is stored, K-07) |
| `family` (legacy, migrated away on open) | L4 | Contained child name and birthday |

### 4.6 Device: files and secure storage

| Element | Level | Note |
|---|---|---|
| `audio/<entry_id>.m4a` | L4 | Free plan: the only copy |
| Photos, cached book audio of other members | L4 | Deleted on purge sync or removal |
| Export ZIPs in app temp | L4 | Deleted after the share sheet closes; plaintext by design |
| Keychain/Keystore: child content key, X25519 private key, session, invite token | L4 | ADR 0006, A-NFR-008 |
| Analytics id | L2 | Random; reset at sign-out and account deletion |
| Safety tiers (local only, PRD K-06) | L4 | Never leave the device; no server table exists |
| Whisper model files | L1 | Not personal data |

### 4.7 Analytics properties (PostHog, after opt-in only)

Every property below is L2: enums, booleans, counts, durations or buckets. No event carries an id other than the random analytics id, a name, a date, a language name or any text. Sources: PRD A section 10, B-NFR-001, C-REQ-034, PRD K-12, ADR 0008. The typed catalogue is `packages/analytics/src/catalog.ts` (being built in parallel on 2 Oct 2026; owner: analytics engineer) with its plan in `docs/analytics`. This table is the PRD-derived baseline; when the catalogue lands, every property it defines must be L2 and listed here, and any property not here must be classified first.

| Event | Properties (all L2) |
|---|---|
| (person property) | `child_count_bucket` |
| `app_cold_start` | `ttfi_bucket`, `platform`, `first_launch` |
| `screen_view` | `route` (route template only, never params) |
| `intro_story_view` | `index`, `via`, `variant` |
| `intro_paused`, `intro_skipped` | `index` |
| `intro_action` | `action`, `stories_seen` |
| `auth_sheet_shown` | `trigger` |
| `auth_method_selected` | `method` |
| `auth_succeeded` | `method`, `new_user`, `had_local_data`, `linked_existing` |
| `auth_failed` | `method`, `reason` |
| `auth_email_sent` | `attempt` |
| `auth_email_verified` | `via` |
| `auth_deferred` | `trigger` |
| `invite_opened` | `via`, `signed_in` |
| `local_merge_choice` | `choice` |
| `entry_saved` | `kind`, `capture_mode`, `duration_bucket`, `edit_count`, `engine` |
| `child_added` | `mode`, `ordinal` |
| `child_switched` | `ordinal` |
| `child_setting_changed` | `key` (setting key enum, never the value) |
| `invite_created` | `role` |
| `invite_accepted` | `role`, `surface` |
| `family_letter_reviewed` | `decision` |
| `goals_set` | `keys` (see section 6, item 1) |
| `languages_set` | `multilingual` (see section 6, item 2) |
| `reminder_prime_shown` | `source` |
| `reminder_prime_result` | `choice` |
| `os_permission_result` | `granted`, `platform` |
| `reminder_schedule_set` | `cadence`, `hour_bucket` |
| `reminder_sent` | `type`, `variant_id` |
| `reminder_suppressed` | `reason` |
| `notification_opened` | `type`, `variant_id` |
| `letter_saved` | `from_notification_2h` |
| `moment_shown` | `type` |
| `resurface_shown`, `resurface_opened` | `kind` |
| `settings_changed` | `key` |
| `export_started` | `format` |
| `export_completed` | `size_bucket` |
| `account_deletion` | `stage` |
| `plus_offer_viewed`, `plus_offer_dismissed` | `trigger` |
| `purchase_started`, `trial_started`, `trial_converted`, `trial_cancelled`, `renewal`, `refund_detected` | `product` |
| `trial_notice_sent` | `days_before`, `channel` |
| `billing_issue`, `gift_purchased` | (none) |
| `plus_lapsed` | `reason` |
| `purchase_failed` | `error_class` |
| `restore_result` | `outcome` |
| `read_together_try_used` | `n` |

Sentry crash events: L2 after scrubbing (`sendDefaultPii: false`, `beforeSend` strips bodies, query strings and fields named like `text|transcript|name|note|letter`, ADR 0008).

### 4.8 Logs and processors

| System | Level of what it may hold | Control |
|---|---|---|
| Supabase API, Postgres and Edge Function logs | L2 | No `log_statement=all`; functions log ids of operational records and counts only |
| PowerSync Cloud bucket storage | L4 (replicated rows) | Sync Streams mirror RLS; co-members' streams must select from `book_entries` columns only (no raw transcript); parity test TC-15 to build |
| PostHog | L2 | Section 4.7 |
| Sentry | L2 | Scrubbed |
| RevenueCat | L3 | Random app user id mapped server-side |
| AI providers (only with consent) | L4 in transit | Zero retention, no training (LEGAL-REQ-020) |
| Email provider | L3 | Transactional only; no content in subjects or bodies |
| Support mailbox | L4 | People may paste letters; handled as L4 |

## 5. Changes made with this document (2 Oct 2026)

- `safety_events` dropped from the server (PRD K-06). The data-policy row is superseded; DATA-REQ-061 is not applicable.
- Raw transcripts, their hash, machine edits and STT metadata are readable only by the author; book members read through `book_entries` (PRD K-09).
- Every `public` column carries its level; CI fails without one.

## 6. Open issues for owners

1. **`goals_set{keys}` sends goal keys, but PRD 7.10 classifies goals as L4.** Either goals are reclassified (counsel, with the goal list) or the property becomes `goal_count`. Owner: analytics engineer and privacy counsel. Until resolved, do not ship this property.
2. **`languages_set{multilingual}`** is a boolean reduction of L4 languages (rule 1.1.2). Acceptable as L2 only if counsel agrees a single boolean is not an ethnicity proxy; B-NFR-001 already rejects language names.
3. **Due date and birthday are visible to contributors** (children row is readable by all members). L4 handling is met (RLS, encryption at rest), but whether grandparents should see a due date is a product and counsel decision (K-25).
4. **Lock-screen child names** (C-REQ-009 toggle) put L4 in local notification text. PRD 7.10 bans L4 in push payloads; local notifications are not server push, but the toggle must default off and never apply to server-sent pushes.
5. **Supabase encryption at rest** is **Unverified** in writing (LEGAL-REQ-022(c)); record it before launch.
6. **`policy_acceptances.locale`** is classified L3 as a language proxy; counsel may decide it is L2.
7. **`data-map.yaml`** (PRD 7.10 item 1) is not built. The database part of the gate exists via column comments; device stores, SDKs and analytics need the same machine check.
