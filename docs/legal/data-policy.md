---
title: Data governance and retention policy
product: "{brand.name} (codename scribe)"
version: 1.0.0
status: draft-for-counsel
effective_date: TBD
owner: founder (data governance lead role)
approver: outside counsel
companion: DELETION_AND_EXPORT_SPEC.md (flows, export, integrity controls, DATA-REQ acceptance criteria)
changelog:
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

Region: Supabase project in **us-west-1** (AWS, California). Status column: **Live** = in an applied migration; **Draft** = in `supabase/migrations/20261002020000_data_governance.sql` (promoted 2 Oct 2026, pending live apply). Levels L1 to L4 per column: `DATA_CLASSIFICATION.md`; **Planned** = described in ARCHITECTURE, ADR or PRD but not yet in SQL.

### 4.1 Postgres, `public` schema

| Element | Columns / content | Class | Owner | Retention | Reason | Status |
|---|---|---|---|---|---|---|
| `profiles` | `display_name`, `signs_as`, timestamps; planned `avatar_path` | A | Account holder | Life of account; deleted at execution of account deletion | Signature "From Papa" on letters | Live |
| `profile_settings` | languages, Hindi script, goals, entry defaults | S (languages), A | Account holder | Life of account | Transcription settings, prompt mix (PRD B F1, F3) | Planned (B) |
| `children` | `name`, `date_of_birth`, `created_by`; planned nickname, due date, photo, theme, `family_can_read`, `hidden_at`; `deleted_at`, `deletion_request_id` | S | Parents jointly | Until book purge (30 days after book deletion) | Book identity, month-of-age chapters | Live; deletion columns Draft |
| `child_members` | child, profile, role, joined | A | Parents jointly | Until leave, removal, book purge or account deletion | Access control | Live |
| `child_invites` | `token_hash` (SHA-256), role, expiry, accepted by/at, inviter | A | Parents | 90 days after expiry (proposed, Privacy Policy section 10) | Invite security and support | Live; purge Draft |
| `member_return_links` | hashed bearer token for web contributors | A | Contributor | Until revoked or rotated, then 90 days (proposed) | Return access without a password (PRD B F6) | Planned (B) |
| `entries` metadata | ids, kind, dates, capture mode, edit level, prompt key, engine version, `in_book`, `audio_kept_on_device`, `sounds_like_me`, `deleted_at`, `deleted_reason` | A/C | Author | Life of entry; tombstone 30 days; then purged | Book assembly, sync, reproducibility | Live; reason Draft |
| `entries.raw_transcript` | exact ASR or typed text, immutable | C (may contain S) | Author | Life of entry | Fidelity: the original is never lost (CLAUDE.md) | Live |
| `entries.raw_sha256` | SHA-256 of raw transcript | A | Author | Life of entry | Corruption detection (spec DATA-REQ-046) | Draft |
| `entries.stt_meta` | engine, model, version, prompt hash, per-token timestamps, avg log-prob | C | Author | Life of entry | Re-derivation, alignment | Live |
| `entries.machine_edits` | accepted and rejected typed edits with offsets and source | C | Author | Life of entry | Every edit reversible (CLAUDE.md) | Live |
| `entries.final_text`, `search` | text the book renders; generated FTS vector | C | Author | Life of entry | Book, search | Live |
| `entries.photo_path` | pointer into `entry-photos` | C | Author | Life of entry | Photo with a letter | Live; scoping check Draft |
| `entries` planned columns | approval, reviewer, occasion, `sealed_until`, group ids, source | A/C | Author (approval: parents) | Life of entry | PRD B section 6 | Planned (B) |
| `entry_versions` | previous `final_text`, `in_book`; Draft adds `machine_edits`, `superseded_by` | C | Author | Life of the entry; purged with it | Server-side version history | Live; columns Draft |
| `dictionary_terms` | names and words, `heard_as` | C (names) | Author; child-level terms shared with members (B) | Life of account or book | Name accuracy | Live |
| `safety_events` | none: dropped (PRD K-06); tiers stay on the device | n/a | n/a | n/a | n/a | Dropped in `20261002020000_data_governance.sql` |
| `audio_blobs` | entry, object path, size, `sha256`, wrapped file key | C pointer + S (key) | Author | Life of entry; key row deleted at purge (crypto-shred) | Encrypted backup (ADR 0006) | Planned |
| `child_key_grants` | CCK wrapped to member public keys | S | Parents | Until member removal rotates the key, or book purge | Family playback (ADR 0006) | Planned |
| Escrow wrap of CCK | CCK wrapped by server secret (Standard mode) | S | Parents | Until Vault mode is chosen or book purge | Recovery (ADR 0006) | Planned |
| `policy_documents`, `policy_versions`, `policy_acceptances` | versioned legal texts; acts without IP or free text | A | Company / account holder | Acceptances: life of account plus 3 years, pseudonymised at deletion | Proof of consent (ARL, POLICY_VERSIONING.md) | Draft (compliance) |
| `deletion_requests`, `deletion_request_steps` | kind, status, dates, source, counts; profile id nulled at completion | A | Company | 3 years after completion or cancellation | Proof that deletion happened | Draft |
| `legal_holds` | scope id, reason code, ticket ref, placed by, review date | A | Company | Until released plus 3 years (proposed) | Preservation duties | Draft |
| `audit_events` | actor, action enum, subject id, child id, small enum detail | A | Company | 24 months; actor id nulled at account deletion | Security and dispute evidence | Draft |
| `purge_ledger` | ids of purged entries, books, profiles, object paths | A | Company | 60 days | Re-apply deletions after a database restore | Draft |
| `storage_purge_queue` | bucket, path, attempts | A | Company | 7 days after done | Storage deletion through the API | Draft |
| `waitlist` (web) | email | A | Subscriber | Until launch invite plus 12 months, or unsubscribe (proposed) | Launch notice (ADR 0010) | Planned |
| Print orders (P2) | shipping address, order, payment reference | A | Buyer | 7 years for transaction records (proposed) | Tax and accounting; refunds | Planned |
| Purchase ledger (if kept) | product, store, transaction id, dates; no card data | A | Account holder | Life of account, then 7 years transaction fields only (proposed) | ARL proof of consent, tax | Planned (C) |

### 4.2 Postgres, `auth` schema (Supabase managed)

| Element | Content | Class | Retention | Note |
|---|---|---|---|---|
| `auth.users`, `auth.identities` | email, provider subject ids, timestamps | A | Life of account; deleted by `auth.admin.deleteUser` at execution | Supabase blocks deleting a user who still owns Storage objects [D6]; the worker deletes objects first |
| `auth.sessions`, refresh tokens | session state | A | Rolling; removed with user | |
| Auth audit log | sign-in events, may include IP address | A | **Unverified** where and how long Supabase keeps it; target 90 days | Open question OQ-5 |
| Apple refresh token (new) | needed to revoke Sign in with Apple [D2] | S | Until revoked at deletion | Stored encrypted by an Edge Function at sign-in; see spec DATA-REQ-033 |

### 4.3 Supabase Storage (private buckets)

| Bucket | Path | Content | Class | Retention | Status |
|---|---|---|---|---|---|
| `entry-photos` | `{child_id}/{author_id}/{entry_id}.jpg` | photos | C | Life of entry | Live |
| backup audio (name TBD) | per ADR 0006 | AES-256-GCM ciphertext of M4A | C | Life of entry; kept after Plus lapse (PRD C-NFR-008) | Planned |
| `inbox` | `{child_id}/{entry_id}` | web contributor audio encrypted in the browser (B-NFR-005) | C | Until moved into the entry by the parent's phone, then the entry's life | Planned (B) |
| `child-photos`, `avatars` | per B section 6 | photos | S / A | Life of book / account | Planned (B) |
| `exports` (new) | `{profile_id}/{export_id}.zip` | server-built exports (spec DATA-REQ-054) | C | 7 days, then deleted | Draft spec |
| `ops-ledger` (new) | `purges/YYYY-MM-DD.jsonl` | purged ids only | A | 60 days | Draft spec |

Storage objects are **not** in database backups, and a deleted object cannot be restored from a backup [D1]. Deleting a row in `storage.objects` with SQL orphans the file; deletion must use the Storage API [D7].

### 4.4 Devices

| Element | Where | Class | Retention | Note |
|---|---|---|---|---|
| Local database (op-sqlite, ADR 0004) | app sandbox | C, A | Mirrors what the user may see; pre-account letters live only here | Wiped when account deletion executes (spec DATA-REQ-023) |
| Audio `audio/<entry_id>.m4a` | app sandbox | C | Until the author deletes the letter (purged with it) or deletes the app | Free plan: the only copy (PRD C section 4.3) |
| Photos, cached book audio of others | app sandbox | C | Until purge sync or member removal | Copies on other members' phones are outside our reach (Terms 7.2) |
| Whisper model files | app sandbox | none | Until app deleted | Not personal data |
| Keychain / Keystore | CCK (synchronizable), X25519 private key, session, invite token | S | CCK until book purge or key rotation; tokens until sign-out or acceptance | ADR 0006; A-NFR-008 |
| Analytics id | device storage | T | Until reset at sign-out or account deletion | ADR 0008 |
| Export ZIPs | app temp, then wherever the user saves them | C | Temp copy deleted after share sheet closes | |
| iOS device backup / iCloud Backup of the sandbox | user's Apple account | C | User controlled | Whether our audio directory is included is **Unverified** (PRD C OQ5) |
| Android Auto Backup | user's Google account | C | User controlled | **Unverified**; Android build must set explicit backup rules (OQ-9) |

### 4.5 Logs, analytics, crash reports

| System | Content | Class | Retention | Control |
|---|---|---|---|---|
| Supabase API, Postgres, Edge Function logs | request metadata; never bodies with content | T | Provider rolling window (**Unverified** per plan) | No `log_statement=all`; Edge Functions log ids and token counts only (ARCH section 8) |
| PowerSync Cloud | replicated rows in bucket storage; service logs | C, T | Rows: removed by REMOVE ops after purge and daily compaction [D8]; logs **Unverified** | Sync Streams mirror RLS (ADR 0004) |
| Vercel (web) | request logs | T | Provider window (**Unverified**) | Tokens only in URL fragments (B-NFR-002) |
| PostHog | allowlisted events, random analytics id | T | 12 months (proposed; set in project settings) | `delete_events=true` on account deletion [D4] |
| Sentry | scrubbed crash events, no user identity | T | 90 days (proposed; set in project settings). Sentry deletes backups 90 days after creation [D5] | `sendDefaultPii: false`; not linkable to a person |
| Support mailbox | what the user writes to us | A (may contain C) | 2 years after last message (proposed) | Support prefill carries no content (C-NFR-005) |

### 4.6 Processors and independent parties

| Party | Data | Role | Deletion route | Source |
|---|---|---|---|---|
| Supabase | everything server-side | Processor | Our purge and `deleteUser`; backups roll off | [D1][D6] |
| PowerSync Cloud | synced rows | Processor | Follows Postgres; daily compaction | [D8] |
| RevenueCat | app user id (profile uuid), purchase history | Processor | `DELETE /subscribers/{app_user_id}`, queued asynchronously; 200 and 404 both mean done | [D3] |
| PostHog | events under analytics id | Processor | `DELETE` person with `delete_events=true`; events deleted asynchronously off-peak (weekends on Cloud) | [D4] |
| Sentry | scrubbed crash events | Processor | Retention expiry; per-event deletion via API if ever identifiable | [D5] |
| Email provider (custom SMTP, not chosen; A-REQ-026) | address, message log | Processor | Provider contact and log deletion API (**Unverified** until chosen) | |
| Groq, DeepInfra, Cloudflare | audio or text in transit, only with AI consent | Processor | Nothing stored when ZDR/no-retention settings are on (ARCH section 8) | ARCH [S26][S12][S28] |
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
| **Rolled off backups** | nobody | No | Within 7 days after purge (Supabase Pro daily backups [D1]) |
| **Held** | nobody new | n/a | Until a legal hold is released |

**Published promise (all deletions):** erased from the live database and storage within **31 days** of the request, from database backups within **38 days**, and from processors within **45 days**. These numbers bind the spec (DATA-REQ-036).

---

## 6. Retention schedule

| Record | Kept for | Then | Basis |
|---|---|---|---|
| Letters, audio, photos, versions, edits, profiles, books | Until the author (or, for a book, its sole parent) deletes them, or the account is deleted | 30-day tombstone, then purge | Service; PRD C: never deleted because a plan lapsed (C-NFR-008; Terms 13.2) |
| Backed-up audio after Plus lapses | As long as the account exists | Same as letters | PRD C section 4.3. PRD wording "forever" should read "as long as your account exists" (section 9) |
| Inactive accounts | No automatic deletion in v1 (a keepsake is opened years later) | n/a | Counsel to confirm against storage-limitation duties (OQ-11) |
| Invites and return-link hashes | 90 days after expiry, use or revocation (proposed) | Hard delete | Privacy Policy section 10 |
| `safety_events` | Not applicable: no server table (PRD K-06) | n/a | CN-10 |
| Analytics events | 12 months (proposed) | Provider deletion | |
| Crash events | 90 days (proposed) | Provider deletion | |
| Audit events | 24 months | Hard delete; actor id nulled at account deletion | Security evidence |
| Deletion requests and receipts | 3 years after completion | Hard delete | Proof of deletion |
| Policy acceptances | Life of account plus 3 years, pseudonymised at deletion | Hard delete | ARL proof-of-consent (POLICY_VERSIONING.md) |
| Purchase and print transaction records | 7 years (proposed) | Hard delete | Tax and accounting (counsel) |
| Support email | 2 years after last message (proposed) | Delete | |
| Server exports | 7 days | Delete | Convenience copy only |
| Purge ledger | 60 days | Delete | Restore replay |
| Database backups | 7 days (Pro daily backups) | Provider roll-off | [D1]. If PITR is enabled, its window (7, 14 or 28 days [D9]) replaces 7 in every promise; the policy must be updated first |

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

---

## Sources (opened 2 Oct 2026)

- [D1] Supabase, Database backups (Pro 7 days, Team 14, Enterprise up to 30; Storage objects not included; deleted objects not restored): https://supabase.com/docs/guides/platform/backups
- [D2] Apple, Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/ ; Sign in with Apple REST API, Token revocation: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- [D3] RevenueCat API v1, Customers (delete customer): https://www.revenuecat.com/docs/api-v1/customers
- [D4] PostHog, Data deletion: https://posthog.com/docs/privacy/data-deletion
- [D5] Sentry, Security (retention by plan; backups deleted after 90 days; deletion via API and UI): https://sentry.io/security/
- [D6] Supabase, Managing user data (cannot delete a user who owns Storage objects): https://supabase.com/docs/guides/auth/managing-user-data
- [D7] Supabase, Delete objects (SQL delete orphans the object): https://supabase.com/docs/guides/storage/management/delete-objects
- [D8] PowerSync, Compacting buckets (REMOVE ops; Cloud compacts daily): https://docs.powersync.com/usage/lifecycle-maintenance/compacting-buckets
- [D9] Supabase, Point-in-time recovery usage (7, 14, 28 days): https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery
- [D10] Google Play, Understanding account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- [D11] Supabase Cron (jobs can call Edge Functions; at most 8 concurrent, 10 minutes each recommended): https://supabase.com/docs/guides/cron

Repository sources: `supabase/migrations/20260930000000_scribe_core.sql`, `20261001000000_scribe_hardening.sql`, `supabase/tests/rls.test.mjs`, `docs/ARCHITECTURE.md`, `docs/adr/0004`, `0005`, `0006`, `0007`, `0008`, `0010`, `docs/prd/A`, `B`, `C`, `CLAUDE.md`, `docs/legal/*` drafts of 2 Oct 2026.
