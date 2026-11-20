---
title: Data governance and retention policy
product: "{brand.name} (codename scribe)"
version: 1.3.0
status: draft-for-counsel
effective_date: TBD
owner: founder (data governance lead role)
approver: outside counsel
companion: DELETION_AND_EXPORT_SPEC.md (flows, export, integrity controls, DATA-REQ acceptance criteria)
changelog:
  - version: 1.3.0
    date: 2026-11-20
    summary: Section 4 brought to the facts on develop (BL-960, NS-36-R6). The recording backup tables and the `entry-audio` bucket are in a migration on develop, pending apply and empty while EXPO_PUBLIC_BACKUP is off; held drafts, sync bookkeeping, per-person book settings and the subscription status tables are added; the nightly encrypted dump of D-159 is named, with sections 5 and 6 on its 7 days. Rows for the new-scope cards carry a status (on develop, in an open PR, or planned with its card and BL row). Includes the picture rows of #854 and the Find row of #799, amended. Open founder and counsel items stay open. Minor.
  - version: 1.2.0
    date: 2026-10-03
    summary: Alignment with the founder decisions of 3 Oct 2026, second round (D-051 to D-070). No audio leaves the phone in v1.0 (D-059), so backup audio, key grants, escrow wraps, the inbox bucket and return links are marked later than v1.0. No purchase records on our servers (D-053, ADR 0013); the purchase-ledger rows and Apple mapping are removed. PowerSync removed (D-023; outbox and cursor sync on Supabase). Resend named as the email provider, with its 30-day message retention stated as the one exception to the 45-day processor clock. Download host (Cloudflare R2 candidate, Q-001) and Hugging Face added. Sentry not in v1.0. Device inventory updated (expo-sqlite, packs and models, analytics ids per consent period, plus.cache, D-033 device backup). Minor.
  - version: 1.1.0
    date: 2026-10-03
    summary: Alignment with PRD.md 1.3 and docs/DECISIONS.md. RevenueCat removed (ADR 0013); purchases come from Apple's App Store Server API under a random appAccountToken (never the profile uuid; fixes the 4.6 conflict in TDD 02 OQ-B1, TDD 05 X-17). Invite hashes keyed on use, revocation or expiry (D-020). Ops and security logs 12 months beside 24-month audit events (D-021). Minor.
  - version: 1.0.0
    date: 2026-10-02
    summary: First draft. Data inventory, classification, ownership model, retention schedule, backup and processor deletion windows, legal holds, roles. Aligned with privacy-policy.md section 10, terms-of-service.md sections 6 to 8 and 12, compliance-register.md, POLICY_VERSIONING.md (all drafts of 2 Oct 2026).
---

# Data governance and retention policy

> **AI-drafted for counsel review. Not legal advice.** Drafted 2 Oct 2026. Every claim about a vendor cites a page opened on 2 Oct 2026 ([D#], list at the end). Anything not backed by an opened page is marked **Unverified**. Retention periods marked **(proposed)** match the Privacy Policy draft and need counsel sign-off.

This policy says what data the product holds, where, why, who it belongs to, how long it is kept, and how it is removed. The engineering detail and testable requirements (`DATA-REQ-###`) are in `DELETION_AND_EXPORT_SPEC.md`. The Privacy Policy, Terms and compliance register are owned by other drafts in this folder; where this policy and those drafts must say the same thing, section 9 lists the alignment points.

---

## 1. Principles

1. **The keepsake comes first, then privacy, and both beat cost.** Nothing a person recorded is lost or silently changed (ARCHITECTURE section 2, attribute 1). Nothing is kept longer than its purpose needs.
2. **Words belong to the person who said them.** Only the author can change, delete or take their words elsewhere. Parents curate the book; they never edit or delete another person's words (CLAUDE.md constitution; PRD B goal 4, F8).
3. **Delete means delete, on a clock we publish.** Every deletion has a state, a timeline and a receipt, including backups and processors.
4. **Export is free, offline, and always possible** (PRD C-REQ-017; Terms 12.3, 13.2).
5. **No content outside the content stores.** No letter text, transcript, audio or child name in analytics, logs, crash reports, audit records, support prefill or push payloads (CLAUDE.md privacy rules; ADR 0008).
6. **The database enforces the rules.** Immutability, tombstones, membership and purge are enforced by Postgres triggers, RLS and service-role jobs, not by app code alone.

---

## 2. Classification

| Class | Code | Meaning | Examples | Handling floor |
|---|---|---|---|---|
| Content | **C** | Words, voice and images a person created for the book, and data derived from them | raw transcript, final text, machine edits, versions, audio, photos, alignment, search index, dictionary terms | Encrypted in transit; RLS per membership; never in telemetry; exportable by its author; deleted with its author's request |
| Sensitive | **S** | Data that identifies or infers something protected about a person, or about the child, or that unlocks content | child name and date of birth, languages spoken (proxy for ethnicity, PRD B-NFR-001), safety tiers (health inference, register CR-031), encryption keys and wrapped keys | As C, plus: minimum collection, no server-side inference (LEGAL-REQ-015), keys never leave Keychain/Keystore unwrapped |
| Account | **A** | Identity, membership, purchase and operational records needed to run the service | email, sign-in identities, profile signature, memberships, invites, entitlements, deletion requests, audit events | RLS or service-role only; deleted or pseudonymised at account deletion except listed legal retention |
| Telemetry | **T** | Usage and reliability signals without content | PostHog allowlisted events, Sentry crash events, service logs | Random analytics id only; allowlist and scrubbing (ADR 0008); short fixed retention |

Note: under Washington MHMDA a letter that mentions health is consumer health data (register CR-031). Content (C) is therefore handled at the sensitive floor for access control and processor sharing, even though not every letter is sensitive.

---

## 3. Ownership model

| Thing | Owner (who decides its life) | Who else has rights | Rule |
|---|---|---|---|
| A letter (`entries` row), its audio, photo, versions, edits | **Its author** | Book members may read it while it is in the book and they are members (PRD B F9) | Only the author edits, deletes, restores or fully exports it. Nobody else can delete it. |
| Whether a family letter is in the book | **Parents** (either, first action wins) | Author can withdraw it at any time | Parents can add or set aside, never edit or delete (PRD B F7). |
| A child's book (the `children` row, its membership, invites, settings) | **Parents jointly, as equals** | Contributors belong to the child's book, not to the inviting parent (PRD B F8.4) | Only a sole parent can delete the book. With two parents, "delete" removes only your own letters and you leave (B-REQ-016). |
| Child profile data (name, DOB, due date, nickname, photo) | **Parents** on the child's behalf | Members read name and nickname | Deleted when the book is purged. |
| Account data (email, identities, profile, settings, entitlements) | **The account holder** | None | Deleted at account deletion, except section 6 legal retention. |
| Operational records (audit, deletion requests, legal holds) | **The company** | The subject may read their own audit and request rows | Content-free by construction; retention in section 6. |

**The child as future data subject.** Letters are written to the child and are about the child. In v1 the child has no account; parents control the book on the child's behalf, and the export is designed so a parent can hand the whole book to the child at 18 (spec DATA-REQ-055). Any child-facing access is out of scope until counsel reviews it (Privacy Policy section 12).

---

## 4. Data inventory

Region: Supabase project in **us-west-1** (AWS, California). Status column: **Live** = in an applied migration; **Draft** = in `supabase/migrations/20261002020000_data_governance.sql` (promoted 2 Oct 2026, pending live apply). Levels L1 to L4 per column: `DATA_CLASSIFICATION.md`; **Planned** = described in ARCHITECTURE, ADR or PRD but not yet in SQL. Rows added on 20 Nov 2026 use: **On develop** = in a migration or app code on `develop`, applied or not (`supabase/APPLY.md` says which migrations are applied); **In PR #n** = in that open pull request only; **Planned (card, BL row)** = in a locked card, no code yet. A later code PR changes only the status word.

### 4.1 Postgres, `public` schema

| Element | Columns / content | Class | Owner | Retention | Reason | Status |
|---|---|---|---|---|---|---|
| `profiles` | `display_name`, `signs_as`, timestamps; planned `avatar_path` | A | Account holder | Life of account; deleted at execution of account deletion | Signature "From Papa" on letters | Live |
| `profile_settings` | languages, Hindi script, goals, entry defaults | S (languages), A | Account holder | Life of account | Transcription settings, prompt mix (PRD B F1, F3) | Planned; in v1.0 these settings stay on the device (DATA_CLASSIFICATION 4.5) |
| `children` | `name`, `date_of_birth`, `created_by`; planned nickname, due date, photo, theme, `family_can_read`, `hidden_at`; `deleted_at`, `deletion_request_id` | S | Parents jointly | Until book purge (30 days after book deletion) | Book identity, month-of-age chapters | Live; deletion columns Draft |
| `child_members` | child, profile, role, joined | A | Parents jointly | Until leave, removal, book purge or account deletion | Access control | Live |
| `child_member_prefs` | one person's choices for one book: what the child calls them (`signs_as`), reminders, letter notices, celebrations paused | A | That member | Until they leave or are removed (cascade from `child_members`), the book is purged or the account is deleted | Per-person book settings | On develop (`20261002020000_data_governance.sql:248`; `notify_letters` from `20261015020000_v1_gate_coparent_invites_undo.sql:81`) |
| `child_invites` | `token_hash` (SHA-256), role, expiry, accepted by/at, inviter | A | Parents | 90 days after use, revocation or expiry, keyed on `coalesce(revoked_at, accepted_at, expires_at)` (D-020; Privacy Policy section 10) | Invite security and support | Live; purge Draft |
| `invite_redeem_failures` | scope, a keyed hash (rotating key) of a person id, device id or client address, time; never a raw id or address | A | Company | Rows older than 2 hours are deleted at each failed redeem (`20261028010000_invite_redeem_by_code.sql:206-208`) | Rate limit on invite codes | On develop (`20261028010000_invite_redeem_by_code.sql:53`) |
| `member_return_links` | hashed bearer token for web contributors | A | Contributor | Until revoked or rotated, then 90 days (proposed) | Return access without a password (PRD B F6) | Planned, later than v1.0 (web page, D-055) |
| `entries` metadata | ids, kind, dates, capture mode, edit level, prompt key, engine version, `in_book`, `audio_kept_on_device`, `sounds_like_me`, `deleted_at`, `deleted_reason`, `approval`, `reviewed_by`, `author_signs_as` (the signature at save time; once NS-16 ships it may be the name of another person who spoke the letter, a non-user: Planned, NS-16, BL-980) | A/C | Author | Life of entry; tombstone 30 days; then purged | Book assembly, sync, reproducibility | Live; reason Draft |
| `entries.raw_transcript` | exact ASR or typed text, immutable | C (may contain S) | Author | Life of entry | Fidelity: the original is never lost (CLAUDE.md) | Live |
| `entries.language` | spoken-letter language, one of the seven v1.0 codes, nullable | S | Author | Life of entry | Transcription and the k-anonymised `insights.language_mix` count | Migration `20261005000000` (author-only reads; not in `book_entries`) |
| `entries.raw_sha256` | SHA-256 of raw transcript | A | Author | Life of entry | Corruption detection (spec DATA-REQ-046) | Draft |
| `entries.stt_meta` | engine, model, version, prompt hash, per-token timestamps, avg log-prob | C | Author | Life of entry | Re-derivation, alignment | Live |
| `entries.machine_edits` | accepted and rejected typed edits with offsets and source | C | Author | Life of entry | Every edit reversible (CLAUDE.md) | Live |
| `entries.final_text`, `search` | text the book renders; generated FTS vector | C | Author | Life of entry | Book, search | Live |
| `entries.photo_path` | pointer into `entry-photos`; always null: no app code sets it, and a picture stays on the phone that added it (`entry_media`, 4.4) | C | Author | Life of entry | None today | Column on develop, always null. Planned: a client write of a non-null value is refused with SQLSTATE `SCPHO` (NS-01-R61, ADR 0028 D6, BL-870) |
| `entries` planned columns | occasion, group ids, source | A/C | Author | Life of entry | PRD B section 6 | Planned (B) |
| `entries` seal columns | `seal_opens_at` (the instant; its time of day states the sealing zone's UTC offset, CR-62 item 2), `seal_opens_on` (the day the author chose), `seal_cleared_at` | C | Author | Life of the letter; deleted with it, including at account deletion | Hide a letter until a day (NS-06 Part B). Author row only, never in `book_entries` | Planned (NS-06 Part B, ADR 0028 D3a, BL-969; counsel Q6) |
| `entries` Firsts columns | `first_mark` (A), `first_label` (C: the parent's own words, which can be a health fact) | A, C | Author | Life of the letter | The parent's own Firsts mark (NS-06 Part A); nothing is suggested or detected | Planned (NS-06 Part A, BL-968) |
| `entry_versions` | previous `final_text`, `in_book`; Draft adds `machine_edits`, `superseded_by` | C | Author | Life of the entry; purged with it | Server-side version history. Written by trigger whenever the words or the in-book choice change (`20260930000000_scribe_core.sql:209-216`) and when a held draft is kept with other words (`20261016000000_sync_v1_server.sql:597-599`). No app screen reads it today; read and removed by the author once NS-12 ships (D8; Planned, BL-979) | Live; columns Draft |
| `dictionary_terms` | names and words, `heard_as` | C (names) | Author; child-level terms shared with members (B) | Life of account or book | Name accuracy | Live |
| `held_drafts` | a held letter, or a spoken letter waiting for its words, of a signed-in author: `raw_transcript`, `final_text`, `machine_edits`, `author_edits`, `locked_spans`, `typed_text` (C); `language`, `pack_ref` (S); the day, prompt key, in-book choice and enums (A) | C, S | Author (author-only; never in `book_entries` or another member's pull) | Until the draft is kept (the row goes in the transaction that writes the letter, `20261016000000_sync_v1_server.sql:601`), let go or erased (`:785`, `:854`, `:905`), its author leaves the book (`:615`, unless under a legal hold), or the book or account is purged | The author's other phones see a held letter (PRD V2 F16 6.2 I) | On develop (`20261016000000_sync_v1_server.sql:300`) |
| Sync bookkeeping: `held_drafts_gone`, `sync_private.entry_erasures`, `sync_epochs`, `sync_op_receipts`, `sync_rate_windows`, `idempotency_keys` | ids, times, enums, flags, counters and request hashes; no words (`sync_op_receipts.answer` holds flags only) | A | Company | Op receipts 30 days, rate windows 1 day, idempotency keys 24 hours (`20261015000000_v1_gate_membership_sync_hardening.sql:757-768`); gone and erasure markers while their book and author exist, so an erased id is never stored again | Sync without loss or replay (ADR 0025) | On develop (`20261004100000_sync_engine.sql:129, 161, 179`; `20261005000000_family_cap_language_idempotency.sql:119`; `20261016000000_sync_v1_server.sql:353, 379`) |
| `safety_events` | none: dropped (PRD K-06); tiers stay on the device | n/a | n/a | n/a | n/a | Dropped in `20261002020000_data_governance.sql` |
| `audio_blobs` | letter, book and author ids, exact object path, file key wrapped by the book key (S), hash of the ciphertext (never of the recording), size, state | C pointer + S (key) | Author | As its `entry-audio` object: until the letter is purged, the held letter is let go, the backup is deleted or the account is deleted; an unconfirmed upload 24 hours after its last update; a row whose letter no longer exists after 30 days (`backup_svc_sweep`) | Encrypted recording backup (D-100, PRD V2 F08 6.5) | On develop (`20261023000000_backup_server.sql:277`); see (B) below |
| `child_keys` | the book key sealed to the escrow public key (`escrow_wrap`, S), opened only inside the escrow function; key versions; a 16-byte key check | S | Author | Until account deletion or the book's purge | Recovery of the recordings on a new phone (F08-REQ-021) | On develop (`:263`); see (B) |
| `backup_devices`, `backup_usage` | a random install id (not a hardware id), the install's public key, platform, times; bytes used against the quota | A | Account holder | Until account deletion (cascade) | Seal book keys to an enrolled phone; the 5 GiB quota | On develop (`:250`, `:299`); see (B) |
| `restore_requests`, `restore_approvals` | one new-phone restore: device ids, hold, state, hashed single-use stop token, approval codes sealed to an enrolled phone and their hashes | A | Account holder | 90 days after a final state (`backup_svc_sweep`); deleted at account deletion | A held, stoppable restore (F08 6.5 C) | On develop (`:308`, `:334`); see (B) |
| `escrow_unwraps` | the recovery-key access log: account (or its peppered hash after deletion), device, book, reason, outcome, time; no content, no key bytes | A | Company | 24 months, pseudonymised at account deletion; a daily copy in `ops-ledger/escrow/` for 60 days. D-021 says 12 months for key-unwrap logs: open (COUNSEL_PACKET Q51) | Logged recovery-key use (F08-REQ-042) | On develop (`:345`); see (B) |
| `escrow_rotation_notices` | account, the escrow key version it moved to, send attempts, sent time | A | Company | 90 days after the email is sent | Tell an account its recovery key was rotated | On develop (`:367`); see (B) |
| `child_key_grants` | CCK wrapped to member public keys | S | Parents | Until member removal rotates the key, or book purge | Family playback (ADR 0006) | Planned, later than v1.0 (D-059) |
| `policy_documents`, `policy_versions`, `policy_acceptances` | versioned legal texts; acts without IP or free text | A | Company / account holder | Acceptances: life of account plus 3 years, pseudonymised at deletion | Proof of consent (ARL, POLICY_VERSIONING.md) | Draft (compliance) |
| `deletion_requests`, `deletion_request_steps` | kind, status, dates, source, counts; profile id nulled at completion | A | Company | 3 years after completion or cancellation | Proof that deletion happened | Draft |
| `legal_holds` | scope id, reason code, ticket ref, placed by, review date | A | Company | Until released plus 3 years (proposed) | Preservation duties | Draft |
| `audit_events` | actor, action enum, subject id, child id, small enum detail | A | Company | 24 months; actor id nulled at account deletion | Security and dispute evidence | Draft |
| `purge_ledger` | ids of purged entries, books, profiles, object paths | A | Company | 60 days | Re-apply deletions after a database restore | Draft |
| `storage_purge_queue` | bucket, path, attempts | A | Company | 7 days after done | Storage deletion through the API | Draft |
| `waitlist` (web) | email | A | Subscriber | Until launch invite plus 12 months, or unsubscribe (proposed) | Launch notice (ADR 0010) | Planned |
| Print orders (P2) | shipping address, order, payment reference | A | Buyer | 7 years for transaction records (proposed) | Tax and accounting; refunds | Planned |
| Purchase ledger | none: not kept. No receipt, transaction id or price reaches a server of ours (D-053, ADR 0013); `store_subscriptions`, `store_notifications` and `app_account_tokens` were dropped by `20261004000000_plus_on_device_only.sql`. Apple keeps its own records as merchant of record. The status report (next row) sends plan state, not purchases | n/a | n/a | n/a | n/a | Removed |
| `subscription_status`, `subscription_salts`, `subscription_report_rates` | plan, free-period end, renewal date, cancelled flag and StoreKit environment under a salted hash of the original transaction id (`sub_ref`); the per-account salt; request counters | A | Account holder | Until account deletion (cascade on the profile); the last report wins | Auto-renewal reminder emails (D-080) | On develop (`20261016001000_subscription_status.sql:96, 83, 168`); no rows while `EXPO_PUBLIC_STATUS_REPORT` is off in every build profile (`apps/mobile/eas.json:17, 35, 49, 63, 79`) |
| `subscription_consents` | one purchase consent record per original purchase: `sub_ref`, product, offer type, terms version shown, times | A | Company | Pseudonymised at account deletion, deleted 3 years after that (`20261016001000_subscription_status.sql:501, 512`) | Proof of purchase consent (D-081) | On develop (`:133`); empty while the status report is off |
| `ops.apple_tokens` | Sign in with Apple refresh token, AES-256-GCM under `TOKEN_KEK_V<n>`, bound to the profile id | S | Account holder | Until revoked at account deletion | Revoke Sign in with Apple at deletion (Apple 5.1.1(v)) | Live schema; capture not built (security review H3) |
| `ops.audit_log` | operator, runbook, target ids, reason, time; no content | A | Company | 12 months (D-021) | Logged staff and service-role access (LEGAL-REQ-025) | Live schema (`20261004200000`) |

(B) The recording backup tables, the `backup` policy document and the `entry-audio` bucket (4.3) are in `supabase/migrations/20261023000000_backup_server.sql` on develop, pending apply (`supabase/APPLY.md:25`). Column levels: `DATA_CLASSIFICATION.md` 4.3.1. No phone writes a row or an object while `EXPO_PUBLIC_BACKUP` is off, and it is off in every build profile (`apps/mobile/eas.json:16, 34, 48, 62, 78`); until then these tables and the bucket hold no rows and no objects. The owner backup carries no picture: it reads recordings only (ADR 0028 Q4 default, open: CR-62 item 6).

### 4.2 Postgres, `auth` schema (Supabase managed)

| Element | Content | Class | Retention | Note |
|---|---|---|---|---|
| `auth.users`, `auth.identities` | email, provider subject ids, timestamps | A | Life of account; deleted by `auth.admin.deleteUser` at execution | Supabase blocks deleting a user who still owns Storage objects [D6]; the worker deletes objects first |
| `auth.sessions`, refresh tokens | session state | A | Rolling; removed with user | |
| Auth audit log | sign-in events, may include IP address | A | **Unverified** where and how long Supabase keeps it; target 90 days | Open question OQ-5 |
| Apple refresh token | needed to revoke Sign in with Apple [D2] | S | Until revoked at deletion | Stored wrapped in `ops.apple_tokens` (4.1) by an `apple-token` Edge Function at sign-in; that function is not built yet (SECURITY.md 5; security review H3) |

### 4.3 Supabase Storage (private buckets)

| Bucket | Path | Content | Class | Retention | Status |
|---|---|---|---|---|---|
| `entry-photos` | `{child_id}/{author_id}/{entry_id}.jpg` | photos | C | Life of entry | Bucket on develop (`20260930000000_scribe_core.sql:291`), private, and empty: a picture stays on the phone that added it and the app has no upload path (NS-01-R15). The author insert and update policies still exist (`:294`, `:299`); Planned: dropped, so the bucket refuses every client write (NS-01-R61, ADR 0028 D6, BL-870) |
| `entry-audio` | `{child_id}/{author_id}/{entry_id}.m4a.enc` | AES-256-GCM ciphertext of the owner's recordings, encrypted on the phone | C | As its `audio_blobs` row (4.1); kept after Plus lapse (PRD C-NFR-008) | On develop (`20261023000000_backup_server.sql:677`): private, 20 MB objects, owner-only policies, no client delete; in the purge registry (`supabase/functions/purge-worker/lib/buckets.ts:39`). Empty while backup is off; see (B) in 4.1 |
| `inbox` | `{child_id}/{entry_id}` | web contributor audio encrypted in the browser (B-NFR-005) | C | Until moved into the entry by the parent's phone, then the entry's life | Planned, later than v1.0 (D-055, D-059) |
| `child-photos`, `avatars` | per B section 6 | photos | S / A | Life of book / account | Planned (B) |
| `exports` (new) | `{profile_id}/{export_id}.zip` | server-built exports (spec DATA-REQ-054) | C | 7 days, then deleted | Draft spec |
| `ops-ledger` (new) | `purges/YYYY-MM-DD.jsonl`; `escrow/YYYY-MM-DD.run-<time>.jsonl` (daily copy of `escrow_unwraps`, `supabase/functions/purge-worker/daily.ts:14, 31`) | purged ids only; recovery-key access rows, no key bytes | A | 60 days | Draft spec; escrow copy on develop |

Storage objects are **not** in database backups, and a deleted object cannot be restored from a backup [D1]. Deleting a row in `storage.objects` with SQL orphans the file; deletion must use the Storage API [D7].

### 4.4 Devices

| Element | Where | Class | Retention | Note |
|---|---|---|---|---|
| Local database (expo-sqlite, D-023) | app sandbox | C, A | Mirrors what the user may see; pre-account letters live only here | Wiped when account deletion executes (spec DATA-REQ-023) |
| Audio `audio/<entry_id>.m4a` and any listening copy | app sandbox, backed-up directory (D-033) | C | Until the author deletes the letter (purged with it) or deletes the app | The only copy in v1.0 for every plan (no upload, D-059), plus the user's own device backup |
| Pictures: `Library/Application Support/photos/<media_id>.jpg` (the stripped copy) and the `entry_media` rows in the local database (ADR 0028 D1) | app sandbox, Application Support, in the device backup (NX-39 F9 default) | C | Until the letter is erased (Erase now on the letter or its book, the 30 day purge, or an erase on another phone of the author), the draft is let go, Erase everything, or the app is deleted. A replaced picture's file stays for Undo, and goes at the latest at the next launch | Never uploaded (NS-01-R15). Not in the owner backup in Build 13 (ADR 0028 Q4 default; open for the founder, CR-62 item 6). The book export carries no picture yet (BL-933); the recovery export carries the rows inside the database file but no picture file. `Caches/ImagePicker` (the original, with its location) and `Caches/ScribePhoto` hold a pick in flight only and are emptied at every launch and by Erase everything |
| Smaller picture copies: `photos/<media_id>-512.jpg` and `-1280.jpg`, made from the stored copy for the Book's speed (NS-37) | app sandbox, beside the stored copy; each file excluded from the device backup | C | As the stored copy; erased by the same paths and the launch sweep, and by Erase everything | Planned (NS-37-R1, R2, BL-932). Never uploaded, never exported; can be made again from the stored copy |
| Spoken languages, script, reminder and appearance settings | device settings | S (languages), A | Until changed or the app is deleted | Never synced in v1.0 (DATA_CLASSIFICATION 4.5) |
| Other settings in the local database (`settings` table): markers for book deletion and Erase everything, sync and plan state, ids of letters shown or waiting to be read back, the co-parents last shown, the due date a card was hidden for | device settings, inside the database file | A; S for `child.bornCardHidden.<book id>` (holds the due date) | Until changed, the book goes, Erase everything, or the app is deleted | On develop; key by key with levels in DATA_CLASSIFICATION 4.5. Never synced; keys never hold words |
| Settings the new-scope cards add: a let-go retry count per draft (NS-09), the new-phone line dismissed (NS-10), the copy slip shown per book and year (NS-11), reminders on since (NS-13), past-letter choices on Home (NS-23), typed-day lock-screen switch (NS-18), names used to sign letters (NS-16), Find's two markers (NS-02) | device settings, inside the database file | A (the names list: A at L3) | Until changed, the draft or book goes, the session ends (names list), or Erase everything | Find's markers in PR #798; the rest Planned (BL-977, BL-978, BL-942, BL-943, BL-946, BL-982, BL-980). Never synced; key by key in DATA_CLASSIFICATION 4.5 |
| `plus.cache` | device settings | A | Last StoreKit snapshot, refreshed on launch | Plus state from Apple; never sent to us (ADR 0013) |
| Speech models and language packs | Application Support, excluded from backup | none (the list of installed packs reveals languages: handled as S on the device) | Until removed in Settings, Storage, or the app is deleted | Public files checked against the signed manifest (D-065) |
| Keychain | session tokens; the time this phone last asked for a sign-in email (no address); the count of letters ever kept (a number only, D-082); with backup on, the backup book keys (service `scribe.backup`) | S (tokens, keys), A | Session tokens until sign-out; the kept count survives deleting the app on that phone (Apple does not guarantee it) and is cleared by Erase everything (`apps/mobile/src/lib/billing/letter-ledger.ts:118-128`); book keys until the backup or the account is deleted | A-NFR-008. Backup keys: on develop, used only while `EXPO_PUBLIC_BACKUP` is on, see (B) in 4.1. Family playback keys are later (ADR 0006) |
| Analytics ids | device settings | T | A fresh random id per consent period; retired ids (at most 20) kept only to request deletion | TRACKING_PLAN 7 |
| Export ZIPs | app temp, then wherever the user saves them | C | Temp copy deleted after share sheet closes | The book export carries no picture yet (BL-933, after BL-868: CR-62 item 3, open) |
| Recovery export ZIP (the launch screen's "Export what is readable", when the book cannot open) | app cache (`recovery-export`), then wherever the user saves it | C | Temp copy deleted after the share sheet closes (`apps/mobile/src/lib/resilience/recovery-export.ts:3, 64-65, 88`) | On develop. Holds the recordings and the database files exactly as they sit (`recovery-export.logic.ts:1-4, 34`), so every local table: the words, drafts, settings, the picture rows with their words and place, and, once built, the Find index, Firsts, seal pairs and any withheld machine output. No picture file, no backup state file. The person's own file, plaintext like the export |
| Find index (`letter_search`, an FTS5 table, and its map `letter_search_rows`; NS-02, ADR 0028 D4, D5) | inside the local database file | C (a second copy of the words as kept, and, once those exist on the phone, of the Firsts label and the words and place the parent typed for a picture) | Follows its letter: removed in the same transaction that deletes, hides, seals or makes the letter private to someone else; the bytes leave the file at the next idle merge, within 24 hours of the app being used (PROPOSED, ADR 0028 Q5, open); dropped, not row-deleted, by Erase everything, and made again, empty, at the next launch; dropped at launch by a build with Find off | In PR #798 (`apps/mobile/src/lib/find/lifecycle.ts`), behind `EXPO_PUBLIC_BOOK_SEARCH`, off by default. Derived data, rebuilt from the letters. Holds no `raw_transcript`, nothing read from audio or a picture, no child name (`find/sources.ts:9-12`), and no query. Never synced; not in the book export or the owner backup. Inside the database file, so in the device backup and in the recovery export ZIP, like the words it copies (corrects #799) |
| Backup state file `backup-<account id>.db` (upload jobs: letter and book ids, recording path and hash, wrapped file key, upload position) | app sandbox, a separate SQLite file per account | C (hash), S (wrapped key), A | A cache, rebuilt from the letters and the server's `audio_blobs` | On develop (`apps/mobile/src/lib/backup/local-db.ts:1-7`, `account.ts:28-31`); opened only while `EXPO_PUBLIC_BACKUP` is on (`backup/gate.ts:20`), so never today. Not in the recovery export (its file pattern is `scribe.db` only) |
| Scheduled local notifications (evening reminders `el.*`, plan reminders `plan.*`) | the iOS pending-notification list | A; C when a body carries the child's name (`notifications.lockScreenNames` on, off by default) | Until re-planned, cancelled, or delivered | On develop (`apps/mobile/src/lib/reminders/planner.ts:243-270`, `scheduler.ts:153`; `billing/plan-reminders.ts:82`). A month note can reveal the birth day. Planned: typed-day words in a body only with `typedDay.showWords` on (NS-18, BL-982) |
| Typed-day words (`typedDay.<yyyy-mm-dd>`: the parent's own words for one day's reminder) | device settings and the iOS pending-notification list | C (the words; the date can be a birthday) | Deleted the day after delivery, at re-plan, at the end of the session, or by Erase everything | Planned (NS-18, BL-982; counsel Q51 on retention). Never synced; not exported (card default) |
| Withheld machine output (NS-17: a take in a language the phone cannot yet clean is kept whole, its machine words withheld) and its flag on `drafts`, `entries` and `held_drafts` | the local database; the flag also on the server row | C (output and flag) | Life of the take; the output is erased when the take is kept with typed words; the server row holds no machine output after the next acknowledged sync | Planned (NS-17; no BL row at the lock). Never shown or exported as words (D10), but inside the database file, so in the recovery export ZIP and the device backup |
| Share temp file (a letter's picture, for the parent's own share sheet) and the printable book PDF | app cache or temp, complete file protection, no backup | C | Until the share sheet ends; swept at launch and by Erase everything | Planned: the picture share waits for both X2 reads and counsel Q45 (NS-05, BL-939; Level 1 ships text only and writes no file); the PDF (NS-07, BL-973). We receive nothing from either |
| iOS device backup / iCloud Backup of the sandbox | user's Apple account | C | User controlled | Decided (D-033): recordings and the local database are included; models and packs excluded. Pictures kept with letters are included too, as built (NX-39 F9 default; the founder's to change, CR-62 item 7; no parent-facing line says so yet, CR-62 item 4). Inside the database file, and so in the backup with it: settings, drafts, the picture rows and, once built, the Find index. Excluded per file when built: the smaller picture copies (BL-932). **Unverified** this session: that iOS leaves `Caches` and temporary files (picker caches, export and recovery ZIPs) out of every backup |
| Android Auto Backup | user's Google account | C | User controlled | **Unverified**; Android build must set explicit backup rules (OQ-9) |

### 4.5 Logs, analytics, crash reports

| System | Content | Class | Retention | Control |
|---|---|---|---|---|
| Supabase API, Postgres, Edge Function logs | request metadata; never bodies with content | T | Provider rolling window (**Unverified** per plan) | No `log_statement=all`; Edge Functions log ids and token counts only (ARCH section 8) |
| Vercel (web) | request logs | T | Provider window (**Unverified**) | Invite tokens are in the URL path today (security review M2): no logging for `/i/*` until the link moves to a fragment |
| Download host (Cloudflare R2 candidate; Hugging Face for upstream models) | request logs: IP, user agent, file requested | T | Provider window (**Unverified**) | No account id or content; file names reveal the language picked |
| Resend | sent-message data (address, our email text) | A | 30 days after sending | No letter content in any email (LEGAL-REQ-014, -053) |
| PostHog | allowlisted events, random analytics id | T | 12 months (proposed; set in project settings) | `delete_events=true` on account deletion [D4] |
| Sentry | not in the v1.0 app | T | 90 days (proposed) when added | `sendDefaultPii: false`; not linkable to a person |
| Support mailbox | what the user writes to us | A (may contain C) | 2 years after last message (proposed) | Support prefill carries no content (C-NFR-005) |

### 4.6 Processors and independent parties

| Party | Data | Role | Deletion route | Source |
|---|---|---|---|---|
| Supabase | everything server-side | Processor | Our purge and `deleteUser`. Production stays on the Free plan (D-159), which has no automatic backups (`docs/ops/runbooks/free-tier-ops.md:9`, Supabase pricing read 8 Nov 2026); our own nightly copy is the next row. Storage files are in no backup | [D1][D6]; D-159 |
| GitHub (the private repository `earlyletters-backups`) | the nightly `pg_dump` of production (schemas `public`, `ops`, `insights`, `sync_private`, and the accounts' rows from `auth`; no sign-in sessions or tokens, no Storage files), encrypted with `age` to the founder's public key before upload; only the encrypted file is kept | Holds ciphertext only; role and terms for counsel | Each file is kept 7 days (artifact `retention-days: 7`). A copy decrypted for the monthly restore drill sits on the founder's computer and is deleted the same day (drill step 8); a backup of that computer can hold it longer | `docs/ops/proposed/workflows/supabase-backup.yml:1-22, 239-244`; `docs/ops/runbooks/staging-backup-free.md:31-36, 76-78`. A proposed workflow on develop, run from the private repository; whether it runs is not verified here (D-159 says so too). `subprocessors.md` does not name it yet (`staging-backup-free.md:36`) |
| Apple (App Store, independent party; not a processor) | nothing from us: Plus is sold and checked between the person's phone and Apple (ADR 0013) | Independent controller as the store | Nothing to delete on our side; Apple keeps its own records | ADR 0013 |
| PostHog | events under analytics ids | Processor | Bulk delete of the ids the phone kept, through the stateless `analytics-forget` at request time; events deleted asynchronously off-peak [D4] | [D4]; TRACKING_PLAN 7 |
| Resend | email address, sent messages | Processor | Sent-message data ages out after 30 days; no contacts kept in v1.0. The completion email is sent at execution, so it remains until about day 60 after the request (section 5) | `purge-worker/account.ts` |
| Download host (Cloudflare R2 candidate) | request logs | Processor | Log window; no account-linked data to delete | subprocessors.md |
| Groq, DeepInfra, Cloudflare Workers AI | none in v1.0 | Processor when cloud transcription or the edit pass ships | Nothing stored when ZDR or no-retention settings are on | subprocessors.md section 3 |
| Apple, Google | sign-in identity, store purchases | Independent | Revoke Sign in with Apple tokens [D2]; store subscriptions are cancelled only by the user | [D2] |
| Lulu, Stripe (P2) | shipping address, order | Processor / independent | Order records kept 7 years (proposed) | ADR 0007 |
| Vercel | web hosting logs | Processor | Provider window | |

---

## 5. Lifecycle states

Every letter, book and account moves through the same states. The spec gives the exact transitions.

| State | Visible to | Restorable | Clock |
|---|---|---|---|
| **Live** | per RLS | n/a | |
| **Tombstoned** ("Recently deleted") | author only (letters); parents see a pending-deletion banner (books) | Yes, by the author (letter) or a parent (book); account by cancelling | 30 days from the server time of deletion |
| **Purged** | nobody | No | Within 24 hours after day 30 (hourly job) |
| **Rolled off backups** | nobody | No | Within 7 days after purge (the nightly encrypted dump is kept 7 days, D-159; 4.6) |
| **Held** | nobody new | n/a | Until a legal hold is released |

**Published promise (all deletions):** erased from the live database and storage within **31 days** of the request, from database backups within **38 days**, and from processors within **45 days**. These numbers bind the spec (DATA-REQ-036). **One stated exception:** Resend keeps each sent email for 30 days. The account-deletion completion email is sent at execution (about day 30), so Resend holds that email, and the address it went to, until about day 60. The Privacy Policy section 10 and the CHD policy section 6 say so in plain words (Privacy Policy CN-12).

**Limit on the Free plan (D-159), open for the founder and counsel:** if the production project is lost with its Storage, a restore from the nightly dump does not know the deletions made after the dump's time (up to 24 hours of them), because the purge ledger files that replay deletions live in Storage, which no backup holds. The runbook deletes again every account deletion it can find, but a letter, book or recording deleted in that window comes back (`docs/ops/runbooks/free-tier-ops.md:76-86`). Public text must not promise that a deletion survives such a restore (`free-tier-ops.md:86`); the wording is the founder's, read by counsel.

---

## 6. Retention schedule

| Record | Kept for | Then | Basis |
|---|---|---|---|
| Letters, audio, photos, versions, edits, profiles, books | Until the author (or, for a book, its sole parent) deletes them, or the account is deleted | 30-day tombstone, then purge | Service; PRD C: never deleted because a plan lapsed (C-NFR-008; Terms 13.2). Earlier versions (`entry_versions`) are kept for the life of the letter and purged with it; once NS-12 ships, the author can also remove one (D8; Planned, BL-979) |
| Backed-up audio after Plus lapses | Backup is built and off in every build profile (D-100; (B) in 4.1). When it is on: as long as the account exists | Same as letters | PRD C section 4.3 |
| Inactive accounts | No automatic deletion in v1 (a keepsake is opened years later) | n/a | Counsel to confirm against storage-limitation duties (OQ-11) |
| Invites and return-link hashes | 90 days after expiry, use or revocation (proposed) | Hard delete | Privacy Policy section 10 |
| `safety_events` | Not applicable: no server table (PRD K-06) | n/a | CN-10 |
| Analytics events | 12 months (proposed) | Provider deletion | |
| Crash events | 90 days (proposed), when a crash SDK is added | Provider deletion | |
| Emails we send (Resend) | 30 days after sending | Provider roll-off | Resend retention; Privacy Policy section 10 |
| Audit events | 24 months | Hard delete; actor id nulled at account deletion | Security evidence |
| Ops audit log, security events, key-unwrap log | 12 months | Hard delete | LEGAL-REQ-033, -037; D-021 |
| Deletion requests and receipts | 3 years after completion | Hard delete | Proof of deletion |
| Policy acceptances | Life of account plus 3 years, pseudonymised at deletion | Hard delete | Proof of consent to Terms, privacy and sensitive-data (POLICY_VERSIONING.md). Plus purchase consent is `subscription_consents` (D-081; 4.1): pseudonymised at account deletion, deleted 3 years after; empty while the status report is off |
| Print transaction records (later) | 7 years (proposed) | Hard delete | Tax and accounting (counsel). No purchase records for Plus: Apple keeps them |
| Support email | 2 years after last message (proposed) | Delete | |
| Server exports | 7 days | Delete | Convenience copy only |
| Purge ledger | 60 days | Delete | Restore replay |
| Database backups | 7 days: the nightly encrypted dump (D-159; 4.6) | The file expires | Production is on the Free plan, which has no automatic backups. If the plan changes or PITR is enabled, its window (7, 14 or 28 days [D9]) replaces 7 in every promise; the policy must be updated first |

Retention is enforced by `purge_due()` and the `purge-worker` Edge Function, never by hand (DATA-REQ-006).

---

## 7. Legal holds

- A hold preserves data that would otherwise be purged: litigation, a preservation request from law enforcement, a regulator, or a safety investigation (PRD B F8.3).
- Placed only by the founder or counsel, recorded in `legal_holds` with a ticket reference and a review date, never with content. Scope: one letter, one book or one account.
- A hold pauses purge and account-deletion execution for that scope. It does not stop the user seeing the deletion as done in the app; the user is told only what the law allows.
- Holds are reviewed on their review date and released as soon as the duty ends; release lets the normal schedule resume at once.
- Data under hold is not used for anything else and is not readable by staff without a logged `support_access` audit event.

---

## 8. Roles and review

| Role | Who (v1) | Duties |
|---|---|---|
| Data governance lead | Founder | Owns this policy, the inventory, retention settings in each vendor console, quarterly restore drill |
| Engineering (Claude Code sessions and future engineers) | | Implement DATA-REQ; inventory row in the same PR as any new table, column, bucket, SDK or vendor (DATA-REQ-001) |
| Counsel | Outside | Approves retention periods marked proposed, holds, and changes to this policy |
| Support | Founder | Runs verified deletion and access requests from the runbooks; never reads content without a logged reason |

Review: this policy is versioned under `POLICY_VERSIONING.md` rules for internal documents, reviewed every 6 months and whenever a vendor, region, backup setting or data class changes.

---

## 9. Alignment with the other legal drafts (action items for their owners)

| # | Where | Issue | Proposed fix |
|---|---|---|---|
| 1 | privacy-policy.md section 12, "Parents can review, export or delete everything in their child's book at any time" | Contradicts the equals rule and author ownership: parents cannot delete a co-parent's or a family member's words | "Parents can review and export everything in the book, take family letters out of it, and delete their own letters or a book they keep alone." |
| 2 | privacy-policy.md section 10, "Database backups roll off within 7 more days" | True only while PITR is off or set to 7 days [D1][D9] | Keep, and bind PITR to 7 days (DATA-REQ-030) |
| 3 | PRD C-NFR-008 and section 4.3 "forever" | Unbounded promise | "As long as your account exists. We never delete it because a plan ended." |
| 4 | privacy-policy.md section 10 | No line for audit, deletion receipts or legal holds | Add rows from section 6 above |
| 5 | POLICY_VERSIONING.md `policy_acceptances` | This draft migration does not redefine it; uses its pseudonymisation trigger | No change |
| 6 | compliance-register.md K12 / LEGAL-REQ-029 to -031 | Deletion SLA covering backups and processors | Satisfied by section 5 and DATA-REQ-030 to -036 |
| 7 | terms-of-service.md 8.4 | Matches this policy | No change |
| 8 | privacy-policy.md section 2 ("Your letters", `:35`) | Earlier versions are kept on our server today, written by trigger (4.1 `entry_versions`), and the policy does not name them | Name them in the next policy PR (founder; counsel reads) |
| 9 | privacy-policy.md section 10; subprocessors.md | The database backup D-159 sets up is a nightly encrypted dump in a private GitHub repository, 7 days, plus the drill copy (4.6); the Free-plan restore limit in section 5 | `legal` drafts the lines; the founder merges; counsel reads. Before anyone outside the family signs in (`staging-backup-free.md:36`) |
| 10 | privacy-policy.md `:90` | The invitation message names the child (`apps/mobile/src/lib/family/share-text.ts:8`), not only the parent who sent it | Say so in the next policy PR |
| 11 | privacy-policy.md `:37` and in-app lines | Pictures sit in the iPhone backup and no line says so (CR-62 item 4) | `content` words them when photos ship; counsel reads them |

---

## Sources (opened 2 Oct 2026)

- [D1] Supabase, Database backups (Pro 7 days, Team 14, Enterprise up to 30; Storage objects not included; deleted objects not restored): https://supabase.com/docs/guides/platform/backups
- [D2] Apple, Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/ ; Sign in with Apple REST API, Token revocation: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- [D3] (no longer used, D-053) RevenueCat API v1, Customers (delete customer): https://www.revenuecat.com/docs/api-v1/customers
- [D4] PostHog, Data deletion: https://posthog.com/docs/privacy/data-deletion
- [D5] Sentry, Security (retention by plan; backups deleted after 90 days; deletion via API and UI): https://sentry.io/security/
- [D6] Supabase, Managing user data (cannot delete a user who owns Storage objects): https://supabase.com/docs/guides/auth/managing-user-data
- [D7] Supabase, Delete objects (SQL delete orphans the object): https://supabase.com/docs/guides/storage/management/delete-objects
- [D8] (no longer used, D-023) PowerSync, Compacting buckets (REMOVE ops; Cloud compacts daily): https://docs.powersync.com/usage/lifecycle-maintenance/compacting-buckets
- [D9] Supabase, Point-in-time recovery usage (7, 14, 28 days): https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery
- [D10] Google Play, Understanding account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- [D11] Supabase Cron (jobs can call Edge Functions; at most 8 concurrent, 10 minutes each recommended): https://supabase.com/docs/guides/cron

Repository sources: `supabase/migrations/20260930000000_scribe_core.sql`, `20261001000000_scribe_hardening.sql`, `supabase/tests/rls.test.mjs`, `docs/ARCHITECTURE.md`, `docs/adr/0004`, `0005`, `0006`, `0007`, `0008`, `0010`, `docs/prd/A`, `B`, `C`, `CLAUDE.md`, `docs/legal/*` drafts of 2 Oct 2026.
