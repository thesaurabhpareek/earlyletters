# 01a Data inventory and classification

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Pack: data, security and lifecycle foundation (document 01, part a). Part b is 01b (where personal data could leak). The column-level detail is document 02 (02a to 02i). Where this pack and a locked card disagree the card wins (CR-66); I write a Conflict line and do not choose.

Evidence tags: [V] verified by running or reading at the cited file and line, [E] estimate with its basis, [U] unverified. Source of truth for the server: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`), all 31 files in `supabase/migrations` loaded in the test harness and read from the catalogs. For the phone: `apps/mobile/src/lib/db/migrations.ts` at schema version 10, run against `node:sqlite`. Nothing was applied to any hosted project, no production data was read, no migration or code was written.

## 1. The rule this document serves

Customer data is never exposed. Default deny: a person reads only what is theirs or what the book's rules give them; a function or job reads only through a named function; a vendor receives only what 06 lists. The levels are the four in `docs/legal/DATA_CLASSIFICATION.md` section 1 and no others: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. Where that document has no answer I write a gap, not a new level. Handling rules per level are in the same file, section 2; the "where can it be used" matrix is `privacy`'s document 06.

## 2. What exists, counted

| Place | Objects | Columns by level | Source |
|---|---|---|---|
| Postgres `public` | 36 tables, 2 views, 4 sequences | L1 16, L2 223, L3 111, L4 31, unlabelled 0 | 02a, 02b, 02c, 02d [V] |
| Postgres `ops` | 4 tables, 1 sequence (service functions only) | L1 2, L2 13, L3 6, L4 1 | 02d [V] |
| Postgres `sync_private` | 1 table (not exposed by the API) | L2 4, L3 3 | 02c [V] |
| Postgres `insights` | 8 views (6 published, 2 internal) | L2 33, unlabelled 10 | 02c [V] |
| Functions | 206 (154 definer, 52 invoker), 39 of them trigger functions, 49 triggers | n/a | 02e, 02f [V] |
| Policies | 64 on tables (all 41 tables have RLS on), 9 on `storage.objects` | n/a | 02a to 02d, 02f [V] |
| Storage | 3 buckets created (entry-photos, entry-audio, ops-ledger); 4 more named in code and not created | L4, L4, L3 | 02f [V] |
| Phone `scribe.db` | 10 tables at v10, plus the Find index and view | L4 21, L3 23, L2 76 (columns, settings aside) | 02g, 02h [V] |
| Phone other | `backup-<profile id>.db` (3 tables), about 45 settings keys, 8 Keychain items, the files in 02h section 5 | mixed | 02h |
| Designed, not built | 6 phone migrations (L11 to L15 and the NS-52 rebuild), 8 server items, 2 files, 10 key groups | PROPOSED | 02i |
| Vendors | Supabase (database, auth, storage, functions), Resend (email), PostHog (opt-in analytics, off in v1.0), Apple (StoreKit, Sign in with Apple, iCloud Keychain, device backup), Cloudflare R2 or Hugging Face (public model files) | see 06 | `DATA_CLASSIFICATION.md` 4.8 |

All 453 server columns: L1 18, L2 273, L3 120, L4 32, no label 10 (the 10 are in 2 internal `insights` views no role can read; Gap G-2). The classification test checks schema `public` only (`supabase/tests/classification.test.mjs:14` reads `n.nspname = 'public'`) [V].

How to reproduce the server numbers: load `supabase/migrations/*.sql` in name order with `createDb(files)` from `supabase/tests/harness.mjs`, then read `pg_attribute`, `col_description`, `pg_policies`, `pg_proc`, `has_table_privilege`, `has_function_privilege`. The script is not committed (docs only).

## 3. Data classes: where each lives, who may read it, what is forbidden

"Path" is the only way to reach it. Every row is default deny: anything not listed is forbidden. Sources: the column comments, `grants.mjs`, the policies in 02a to 02d, `DATA_CLASSIFICATION.md`, CLAUDE.md privacy rules.

| Class (L) | Examples | Lives | Who or what may read, and path | Forbidden |
|---|---|---|---|---|
| Child identity (L4) | `children.name`, `nickname`, `date_of_birth`, `due_date`; phone `children.*` | phone; server `children` | members of the book: name and nickname by column grant on `children`; birthday and due date only through `sync_pull`/`sync_books` (columns are not selectable by API roles). Contributors get birthday month and day only (D-039) [V grants.mjs:15-17; birthday_md in 02g] | analytics, logs, crash reports, push and email subjects, URLs; purge worker output; ops scripts |
| Words (L4) | `entries.final_text`, `held_drafts.typed_text`, `search`, phone `letter_search` | phone; server `entries`, `held_drafts` | the author directly (`entries_select`); other members only through `book_entries` while `in_book` and the book is live, read by `sync_pull` | any log line, analytics event, email, push, support prefill, export of someone else's words beyond what the book shows |
| Raw words and edits (L4) | `raw_transcript`, `machine_edits`, `stt_meta`, `raw_sha256`, `author_edits`, `locked_spans`, `pack_ref`, `language` | phone; server `entries`, `entry_versions`, `held_drafts` | author only; `book_entries` leaves these columns out [V view definition] | other members, staff tools, ops functions (`ops_raw_sha` returns hash checks only) |
| Recordings (L4) | phone `audio/*.m4a`; server `entry-audio` ciphertext | phone; Storage (encrypted on the phone before upload) | owner only (`backup_object_readable`); the server holds ciphertext, the key opens only on the phone or inside the escrow function | any server-side decryption outside `escrow`; any vendor |
| Pictures (L4) | phone `photos/`; server `entry-photos` (legacy path) | phone; Storage still accepts uploads (Gap G-9) | author; members through `can_read_entry_photo` | leaving the phone without the X2 note (CR-69 A5 variant B is the founder's) |
| Person identity (L3) | `profiles.display_name`, `signs_as`, `auth.users.email`, Apple subject ids | server; Supabase Auth | the person; co-members see `display_name` and `signs_as` (`profiles_self_or_co_guardian`); Edge Functions read the email to send mail | analytics, logs, URLs; email subject lines |
| Ids (L3) | person, book, letter ids; object paths | everywhere | holders of the row; ids appear in audit tables and in Storage paths | log lines and analytics (the typed logger has no id field: `_shared/log/log.ts:5-12`) |
| Membership (L3) | `child_members.role`, `child_member_prefs`, `child_invites` | server, phone | members of the same book; parents see invites (policy inert today, Gap G-8) | outsiders; `peek_invite` shows the inviter's signature and role only (`20261015010000:193`) |
| Consent records (L2 and L3) | `policy_acceptances`, `subscription_consents` | server (append-only) | own rows (`policy_acceptances_own_read`); ops functions for a deletion request | edit or delete before retention (guard triggers) |
| Deletion and purge records (L2, L3) | `deletion_requests`, `purge_ledger`, `audit_events` | server, `ops-ledger` bucket | own deletion rows; `service_role` only through the `ops_*` and `purge_*` functions | content in `receipt` and `detail` (size-limited only, Gap G-13) |
| Plan state (L3) | `subscription_status`, phone `plus.cache` | server and phone | phone: the app; server: `status_report_store` writes, nothing reads by API | receipts, transaction ids in clear, prices (`20261016001000:19`) |
| Secrets (L4) | session (`scribe.auth`), invite token, `escrow_wrap`, `wrapped_file_key`, `ops.apple_tokens.ciphertext`, backup `upload_token` | Keychain; server | session: the app; tokens: only hashes are stored (`token_hash`, `code_hash`); `escrow_wrap` is not selectable by the phone | logs, analytics, backups of the phone beyond Keychain rules (Gap G-11 for `backup-<id>.db`) |
| Safety tiers (L4) | phone only | phone | the app | any server table (none exists, K-06) |
| Analytics events (L2) | `packages/analytics/src/catalog.ts` (SCHEMA_VERSION 8) | PostHog, after a yes; off in v1.0 (`lib/capabilities.ts:65`) | the founder through the dashboard and the insights job | any id other than the random analytics id; any text, name, date or path |
| Operator log (L2, L3) | `ops.audit_log`, Edge Function logs | server, Supabase | `service_role` functions; the typed logger writes L2 only | person ids in log streams; they appear in `ops.audit_log` only |
| Aggregates (L2) | `insights.*` views | server | `service_role` and `insights_reader`; every count 0 or at least k = 10 | `anon`, `authenticated`; any per-person row |
| Public (L1) | `policy_versions`, bundled content, models | server, repo | anyone | n/a |

## 4. Where to find every object

| File | Objects |
|---|---|
| 02a | profiles, children, child_members, child_member_prefs, child_invites, invite_redeem_failures, entries, entry_versions, held_drafts, held_drafts_gone, dictionary_terms, book_entries |
| 02b | audit_events, deletion_requests, deletion_request_steps, storage_purge_queue, purge_ledger, legal_holds, policy_documents, policy_versions, policy_acceptances, my_policy_state |
| 02c | idempotency_keys, sync_epochs, sync_op_receipts, sync_rate_windows, subscription_status, subscription_consents, subscription_salts, subscription_report_rates, sync_private.entry_erasures, the 8 insights views |
| 02d | audio_blobs, backup_devices, backup_usage, child_keys, restore_requests, restore_approvals, escrow_unwraps, escrow_rotation_notices, ops.audit_log, ops.alert_state, ops.apple_tokens, ops.forget_quota |
| 02e | all 206 functions |
| 02f | 49 triggers, 3 buckets, 9 storage policies |
| 02g | scribe.db, 10 tables |
| 02h | Find index, backup file, settings keys, Keychain, files |
| 02i | designed, not built; the two files of CR-69 A4 |

## 5. The five findings that matter most

1. **The hosted schema is two files, not 31.** `.github/migrations-applied.txt` records `20260930000000_scribe_core.sql` and `20261001000000_scribe_hardening.sql` only [V]. Twenty-nine merged migrations (sync, consent, deletion worker, backup, grants, purge, hold, audit) are not recorded as applied; DS section 0 item 7 says CI has never migrated staging or production. Everything in 02a to 02f is what the code and tests expect, not what any hosted database holds [U for the hosted state]. Founder item (D-041); not mine to apply.
2. **The inventory document is a year behind the schema.** `DATA_CLASSIFICATION.md` 4.1 was generated through `20261004300000` and 4.5 describes phone schema version 4 (Gap G-1, Conflict C-1). It has no row for `held_drafts`, `held_drafts_gone`, `idempotency_keys`, `subscription_status`, `subscription_consents`, `subscription_salts`, `subscription_report_rates` or `sync_private.entry_erasures` [V grep: 0 matches], nor for 15 phone settings keys, the `child_member_prefs` and `agreements` tables, or `backup-<id>.db`. BL-960 is the fix; the founder merges `docs/legal`.
3. **A picture can still be uploaded to the server.** `entry_photos_author_insert` and `_update` are live (`20261028000000:88-96`) while the cards say pictures stay on the phone (NS-01-R61). Design S1 closes it (02i). Gap G-9.
4. **The recording backup file on the phone is unclassified and travels.** `backup-<profile id>.db` holds `upload_url`, `upload_token`, `wrapped_file_key` (`backup/local-db.ts:60-85`), is not excluded from the iPhone backup, is copied whole by the recovery export (`resilience/recovery-export.ts:30-43`), and no deletion on Erase was found (`erase-everything.ts:57-80`). The feature flag is off, so no row exists yet. Gap G-11.
5. **A server copy of plan state exists against the inventory's own statement.** `subscription_status` and `subscription_consents` (`20261016001000`) hold plan, trial end and renewal per account; `DATA_CLASSIFICATION.md` 4.1 says no server table holds purchases (ADR 0013). They are labelled L3 and cascade at account deletion; the conflict is a document one. Conflict C-2.

Also worth a reader's time: no function is executable by `PUBLIC` or `anon` (0 of 206) and every function pins `search_path` with `pg_temp` last [V]; `service_role` holds no table grant at all, so it reaches data only through 44 named functions (`grants.mjs:5-27`) [V]; `raw_transcript` immutability and append-only evidence tables are trigger-enforced (02f) [V].

## 6. Conflicts (routed, not chosen)

| Id | Conflict | Route |
|---|---|---|
| C-1 | `DATA_CLASSIFICATION.md` 4.1 and 4.5 against migrations at `4d33978f` and `migrations.ts` v10 (findings 2) | `privacy` via BL-960; founder merge |
| C-2 | Same document 4.1 "No server table holds purchases" against `subscription_status` (finding 5) | `privacy`, `payments`; counsel |
| C-3 | `DATA_CLASSIFICATION.md` 4.4 lists `child-photos` as "v1.0, private"; no migration creates it (Gap G-10) | `data-architect` with the child-photo card (product) |
| C-4 | Same document section 2 "users see their own audit and deletion rows": `audit_events_own` is inert, au has no grant; `deletion_requests_own` works | `privacy` (correct the sentence, default) |
| C-5 | `DATA_CLASSIFICATION.md` 4.3.1 says `audio_blobs` and escrow tables are "not yet applied" while they are merged on develop; they are still not applied to a hosted project | `privacy` |
| C-6 | `DATA_CLASSIFICATION.md` 4.6 says PostHog state is in memory; the code says so at `packages/analytics/src/posthog.ts:172` [V]; no conflict, recorded so nobody reopens it | none |
| C-7 | D-021 (12 months for key-unwrap logs) against 24 months built (`20261023000000:1602`) | counsel Q51 (already open) |
| C-8 | Media text ceilings: 1120 and 480 code points (`data-and-sync.md` L11) against 2240 and 960 (`14-media-library-video.md` F1) | `data-architect` once #835's head is read; the card decides |
| C-9 | NS-51-R6 "in the phone database" against R23 "excluded from backup" | resolved by CR-69 A4 (a file); product to confirm on #934 |

## 7. Gaps (each has a default; none needs a decision today)

G-1 inventory stale (C-1). G-2 `insights._letters`, `_book_family` 10 columns without a label, test reads `public` only. G-3 `held_drafts_gone` no age sweep. G-4 `dictionary_terms` unreachable. G-5 `legal_holds` released rows never deleted. G-6 `subscription_report_rates` windows and `subscription_status` rows have no age sweep. G-7 no script proves every policy has an allow and a deny test; the access matrix and 43 other test files exist but a name match is not proof (standing duty 1: I did not close it in this pass). G-8 13 inert policies (grant missing). G-9 photo bucket still writable. G-10 `child-photos` bucket absent. G-11 `backup-<id>.db`. G-13 jsonb columns bounded by size only. G-15 direct INSERT and UPDATE on `entries` and `held_drafts`. G-16 unwrap log 24 against 12 months and the 60-day ops-ledger copy. G-17 no `AUTHENTICATED_FUNCTIONS` list. G-18 four functions named in no test. G-19 mirror columns on phone `children`. G-20 no age sweep on phone `rejected_writes`. G-21 15 settings keys unlisted.

## Questions for the council

- Q-1 (CDO, CPO-privacy) Make `docs/legal/data-map.yaml` (BL-016) generated from the catalog query used here, so the inventory cannot go stale again. Default: yes; `data-architect` writes the generator, `privacy` owns the levels.
- Q-2 (CISO) Extend `classification.test.mjs` to `ops`, `insights` and `sync_private` and to the phone's `migrations.ts` comments (DS T3). Default: yes, owner `qa`; a new migration adds the 10 missing comments.
- Q-3 (founder) Applying the 29 unapplied migrations (finding 1) is the founder's step. Default: no action by agents; this pack only states the gap.
- Q-4 (CPO, counsel) Is the iPhone device backup of `scribe.db`, recordings and pictures acceptable for v1.0? Default: yes, as ADR 0028 D1 and `DATA_CLASSIFICATION.md` 4.5 assume; the Settings words say so (words are `content`'s).
- Q-5 (CLO) Is a server-side plan state (finding 5) in scope of the privacy policy section on purchases? Default: yes as labelled L3; counsel confirms.
