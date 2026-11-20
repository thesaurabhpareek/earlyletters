# 01a Data inventory and classification

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Pack: data, security and lifecycle foundation (document 01, part a). Rows that cite 02e to 02i (function, trigger, bucket and phone counts) are checked in PRs #1009 to #1011, and the vendor matrix is `privacy`'s 06 in an open PR (#1000); merge them together, or read those rows as [U] until then. Part b is 01b (where personal data could leak). The column-level detail is document 02 (02a to 02i). Where this pack and a locked card disagree the card wins (CR-66); I write a Conflict line and do not choose.

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
| Functions | 206 (154 definer, 52 invoker), 42 of them trigger functions; 49 triggers on 15 tables | n/a | 02e, 02f [V] |
| Policies | 64 in total: 55 on public tables (all 41 tables have RLS on) and 9 on `storage.objects` | n/a | 02a to 02d, 02f [V] |
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
3. **A picture can still be uploaded to the server.** `entry_photos_author_insert` and `_update` are live (`20261028000000:88-99`) while the cards say pictures stay on the phone (NS-01-R61). Design S1 closes it (02i). Gap G-9.
4. **The recording backup file on the phone is unclassified, backed up and never erased.** `backup-<profile id>.db` holds `upload_url`, `upload_token`, `wrapped_file_key` (`backup/local-db.ts:60-85`), is not excluded from the iPhone backup, and no deletion on Erase was found (`erase-everything.ts:57-80`). The recovery export does not take it: it keeps only `scribe.db` and its `-wal`, `-shm`, `-journal` files (`resilience/recovery-export.logic.ts:33-42`). The feature flag is off, so no row exists yet. Gap G-11.
5. **A server copy of plan state exists against the inventory's own statement.** `subscription_status` and `subscription_consents` (`20261016001000`) hold plan, trial end and renewal per account; `DATA_CLASSIFICATION.md` 4.1 says no server table holds purchases (ADR 0013). They are labelled L3 and cascade at account deletion; the conflict is a document one. Conflict C-2.

Also worth a reader's time: no function is executable by `PUBLIC` or `anon` (0 of 206) and every function pins `search_path` with `pg_temp` last [V]; `service_role` holds no table grant in `public`, `ops` or `sync_private` (it has SELECT on the six published `insights` views), so it reaches personal data only through 44 named functions (`grants.mjs:5-27`) [V]; `raw_transcript` immutability and append-only evidence tables are trigger-enforced (02f) [V].

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
| C-8 | CLOSED. Media text ceilings: `data-and-sync.md` L11 was amended on develop to 2240 and 960 (as built; 1120 and 480 superseded), which matches `14-media-library-video.md` F1. Only [U] remains: #835's head was not read | none |
| C-9 | NS-51-R6 "in the phone database" against R23 "excluded from backup" | resolved by CR-69 A4 (a file); product to confirm on #934 |

## 7. Gaps (each has a default; none needs a decision today)

G-1 inventory stale (C-1). G-2 `insights._letters`, `_book_family` 10 columns without a label, test reads `public` only. G-3 `held_drafts_gone` no age sweep. G-4 `dictionary_terms` unreachable. G-5 `legal_holds` released rows never deleted. G-6 `subscription_report_rates` windows and `subscription_status` rows have no age sweep. G-7 no script proves every policy has an allow and a deny test; the access matrix and 43 other test files exist but a name match is not proof (standing duty 1: I did not close it in this pass). G-8 14 inert policies (grant missing; my first count of 13 missed one). G-9 photo bucket still writable. G-10 `child-photos` bucket absent. G-11 `backup-<id>.db` (unclassified, in the iPhone backup, not deleted by Erase; not in the recovery export). G-13 jsonb columns bounded by size only. G-15 direct INSERT and UPDATE on `entries` and `held_drafts`. G-16 unwrap log 24 against 12 months and the 60-day ops-ledger copy. G-17 no `AUTHENTICATED_FUNCTIONS` list. G-18 four functions named in no test. G-19 mirror columns on phone `children`. G-20 no age sweep on phone `rejected_writes`. G-21 15 settings keys unlisted.

## 8. Council amendments (20 Nov 2026)

Source of every change below: the executive alignment record `DECISIONS-20nov.md` (PR #1013, branch `docs/decisions-closed-20nov`, until it merges; ids A1 to F3; re-pin the cite at merge) and the CDO and CISO return (`cdo-ciso.md`, a working file of the run, not in the repo; cited as "CDO return" with its item id). Where a change comes from the CDO return only, the line says so. Gates are the record's: G13 before the Build 13 cut, GF before the first family outside the founder's signs in, G10 before 1.0. A gate marked [E] is mine, because the record names none for that item; Karma or the founder may move it. Nothing here is applied to any hosted project.

### 8.1 Numbered gaps with owner and gate

Existing ids keep their numbers (G-1 to G-21 above; G-12 and G-14 are not used in 01a to 02i). G-22 is taken by 02d (`audio_blobs.wrapped_file_key` is selectable by the app role). New ids here start at G-23.

| Gap | What | Owner | Gate | Decision cite |
|---|---|---|---|---|
| G-2 | 10 columns in `insights._letters` and `_book_family` have no label; `classification.test.mjs:14` reads schema `public` only. Fix: a new migration with the 10 comments (data-architect) and a test over `ops`, `insights`, `sync_private` and the phone's `migrations.ts` comments (`qa`). Detail in 8.4 | data-architect (migration), `qa` (test) | G10 [E] | CDO return, 01a Q-2 (AGREE) |
| G-3 | `held_drafts_gone` has no age sweep. Period comes from the same number as G-23: the longest offline period a phone may have, stated by `sync` | data-architect with `sync` | G10 [E]; no sweep until `sync` answers | CDO return, 02a Q-a3 |
| G-4 | `dictionary_terms` is unreachable (no grant, no writer). Leave it. Condition: a test shows account purge and book purge cover it | data-architect | G10 [E] | CDO return, 02a Q-a2 |
| G-5 | `legal_holds` released rows are never deleted. Default stands (keep) until counsel names a period | `privacy`, counsel | COUNSEL, no gate | B7; CDO return, 02b Q-b1 |
| G-6 | `subscription_report_rates` windows have no age sweep (`subscription_status` rows go with the account) | data-architect | G10 [E] | CDO return, 02c Q-c1, Q-c2 |
| G-7 | No script proves every policy has an allow and a deny test. Stays as in section 7; owner `qa`, standing duty 1 of data-architect; gate G10 [E] | `qa`, data-architect | G10 [E] | none in the record |
| G-8 | 14 inert policies (see 8.3) | data-architect | G10 [E] | CDO return, 02a Q-a1 |
| G-9 | `entry_photos_author_insert and `_update` live; closed by S1 (02i). Applying S1 is the founder's step | data-architect (migration), founder (apply) | GF, and merged together with photo slices #835 to #840 | C4, B3 |
| G-10 | `child-photos` bucket absent. Stays as in section 7: keep references, add a test that the worker skips a missing bucket; correct `DATA_CLASSIFICATION.md` 4.4 (founder merge) | data-architect, `privacy` | G10 [E] | CDO return, 02f Q-f2 |
| G-11 | `backup-<profile id>.db`: classify (L4, PROPOSED, `privacy` rules), exclude from device backup, delete on Erase and on sign-out of that account, `upload_token` to the Keychain, test red without each, preflight gate (8.5) | `mobile` (code), `sync` (token), data-architect (class) | before `EXPO_PUBLIC_BACKUP` goes on, and GF at the latest [E for GF] | B5, C7 |
| G-13 | `audit_events.detail`, `deletion_requests.receipt`, `policy_acceptances.context` bounded by size only. Key allowlist first (`privacy` lists the keys), then the migration | `privacy` (keys), data-architect (migration) | before audit rows enter any export; GF [E] | B8 |
| G-23 | No permanent purged-id guard after day 60 (the error-code name `SCPRG` is unused: `grep` of `supabase/` finds none; no table of hashed ids exists). From day 61 a stale phone can re-insert a deleted letter, because `entries_not_purged` (`20261004100000:116-126`, restated at `20261016000000:417`) checks `purge_ledger`, `entry_erasures` and `held_drafts_gone`, never a permanent list and housekeeping deletes ledger rows older than 60 days (`20261108020000:217`). Design in 8.2 | data-architect | design only; written after the founder says start; not applied until counsel and the privacy chief approve the retention wording; GF [E] | C5 |
| G-24 | `security_events` store absent; four audit actions are allowed by the check at `20261002020000:315-320` but no function writes them. Both are in 02i (S6, S7) | data-architect | GF | C3 |
| G-25 | The data map is hand-kept; `docs/legal/DATA_CLASSIFICATION.md` is a year behind (G-1). Generate, do not revive PR #37 (8.6) | data-architect (generator), `privacy` (levels) | G10 [E] | CDO return, 01a Q-1 |
| G-26 | `insights_reader` is granted to `authenticator` (`20261004300000:35-37`); only `service_role` runs the weekly report. Drop it in the next migration pack (02i S9) | data-architect | GF [E] | C9 |

The two sweeps (G-3, G-5) are not built; each has its default in the table.

### 8.2 G-23: the purged-id guard (C5)

Direction is ruled (C5): a keyed hash of the id, never a raw list. Counsel and the privacy chief read the retention wording before any apply; this is design only: the migration is written after the founder says start, and applied only by the founder.

- Why a hash: a permanent table of deleted letter ids outlives the account. It is a retention promise that D-111 (erasure records kept until the book or account is deleted) does not cover, and device ids are UUIDv7, so a raw id carries a creation time [CDO return, C5; the UUIDv7 point is [E], not re-read in code here].
- Shape (PROPOSED, [E] design, in 02i S8): one table (name PROPOSED; `SCPRG` stays the error code, as `SCDEL` is), one column of 16 bytes (HMAC of the id), no person id, no book id, never joined to another table, no role holds a grant.
- Where the key lives: `entries_not_purged` is a SQL trigger that runs inside `sync_push` and must hash the incoming id inside Postgres, so an Edge Function secret cannot serve it. The key is a database secret the founder sets (never in the repo, a migration, a test or a client; CR-71 C5): a Supabase Vault secret if the hosted plan has it [U], or else a one-row config table in `sync_private` with no grant to any API role, read only by the definer functions that write and check the guard. Who can read it: the database owner role and those definer functions, nobody else. Residual risk: key and hashes sit in the same database, so a full dump holds both; that is weaker than a key held outside the database (the invite pepper is outside: `20261015020000:25`). A key outside means moving the check into an Edge Function, which then sits on the push path. `security-architect` chooses; both are design only.
- `entries_not_purged` and the book purge check consult the guard as well as the tables they read today.
- Promise the policy may say after counsel reads it: "we keep an unreadable fingerprint of a deleted letter's id so it cannot come back". Words are PROPOSED; `content` and counsel own them.
- Test (to write): a stale phone replays a deleted letter at day 61 and is refused. It fails on develop today.
- Open for counsel: the retention period of the guard itself. Default: until the book or account is deleted, which is D-111's own clock.

### 8.3 The 14 inert policies (G-8)

A policy is inert when the role it names holds no grant on the table. The count is 14 across the pack (02a 4, 02b 2, 02c 3, 02d 5). They are defence in depth and harmless today. Risk: a later grant wakes one silently. Control (CDO return, 02a Q-a1; test owner `qa`, list owner data-architect): a test that the set of policies with no matching grant equals the written list, so a new grant fails until the list is changed on purpose. Gate G10 [E].

| File | Inert policies |
|---|---|
| 02a | `child_invites_select`, `entry_versions_author_select`, `children_member_update`, `dictionary_terms_owner` |
| 02b | `audit_events_own`, `policy_documents_read` |
| 02c | `sync_op_receipts_own_insert`, `sync_op_receipts_own_delete`, `sync_rate_windows_own` |
| 02d | `backup_devices_own`, `backup_usage_own`, `escrow_unwraps_own`, `restore_requests_own`, `restore_approvals_own` |

### 8.4 The classification test gap (G-2)

`supabase/tests/classification.test.mjs:8-14` selects `n.nspname = 'public'` only [V, read this session]. Extend it to `ops`, `insights`, `sync_private` and to the comments in `apps/mobile/src/lib/db/migrations.ts`. Order: add the 10 comments in a new migration first (02i S9), then widen the test, or it fails on the 10. A test change belongs to `qa`; the migration needs the founder's `approve-migration`. Each new column keeps carrying its level in the same PR (DATA-REQ-001, DATA-REQ-002).

### 8.5 Gate for the backup flag (B5, C7)

`EXPO_PUBLIC_BACKUP` is "off" in all four `eas.json` profiles and `BUNDLED_ESCROW_KEYS` is empty (`apps/mobile/src/lib/backup/escrow-keys.ts:12-14`) [V, CDO return]. B5 asks for a preflight check that fails any build with the flag on unless: B5 is done, the escrow key lists are non-empty, and the stop page answers 200. 01a records it as the exit condition of G-11; the check itself is `mobile` and `qa` work.

### 8.6 The data-map generator replaces PR #37 (G-25)

PR #37 is open (`docs(legal): privacy data map, claims register and checker`, +2349 -7 on the read of 20 Nov; the CDO skill's 1,568 lines is the map file alone [U]). It predates D-100. Do not revive it whole (CDO return, 01a Q-1). Plan: a generator reads the Postgres catalog through the test harness and the phone's `migrations.ts`, writes the map, and a checker fails on any column without a map row; `privacy` owns the levels and the founder merges anything under `docs/legal`. `BACKLOG.md` lists BL-016 under "Superseded or deferred" (line 51) and as an open card (line 193); that disagreement is Karma's to settle [V grep]. Until the generator exists, this pack is the schema column of the map.

### 8.7 Map from `DATA_CLASSIFICATION.md` section numbers to this pack

This closes the reviewer note that the pack's ids did not line up with the legal document. Level names L1 to L4 are the same in both. Read left to right.

| `DATA_CLASSIFICATION.md` | Subject | Where it is in this pack |
|---|---|---|
| 0 | How it is enforced | 01a section 2 (reproduce), 8.4, G-2, G-7, G-25 |
| 1, 1.1 | Levels, rules for choosing | 01a section 1; 02 legend (a gap is a Conflict line, never a new level) |
| 2 | Handling rules per level | 01a section 3 (Forbidden column), C-4 |
| 3 | Child scope | 01a section 3 row "Child identity"; 01b R-1 |
| 4.1.1 | Schema `public` | 02a, 02b, 02c, 02d; C-1, C-2, G-1 |
| 4.1.2 | Schema `ops` | 02d |
| 4.1.3, 4.9 | `insights` views and aggregates | 02c; 01b A-5, A-6; G-2 |
| 4.2 | `auth` schema | 01a section 3 row "Person identity"; 01b L-5 |
| 4.3 | Planned server tables | 02i section 2 |
| 4.3.1 | Recording backup tables | 02d; C-5 |
| 4.4 | Storage buckets | 02f; 02i X1; C-3, G-9, G-10 |
| 4.5 | Device SQLite | 02g; 02h sections 1 and 3; C-1, G-19, G-21 |
| 4.6 | Device files and secure storage | 02h sections 2, 4, 5; G-11 |
| 4.7 | Analytics properties | 01a section 3 row "Analytics events"; 01b A-1, A-2 |
| 4.8 | Logs and processors | 01a section 2 (Vendors); 01b sections 1 and 7 (L-1 to L-6, M-4); `privacy` 06 |
| 5 | Changes made 2 Oct | history; no row |
| 6 | Open issues for owners | 01a Q-4; 01b A-2, P-2, R-1 (issues 2, 3, 4) |

### 8.8 Corrections

- Migration count. The CDO skill (`.claude/skills/early-letters-cdo/SKILL.md:115, 175`) says `develop` has 26 migration files. Counted on `origin/develop` this session: 31 under `supabase/migrations`; `.github/migrations-applied.txt` records 2; so 29 are not recorded as applied [V]. This pack already says 31. The skill is not mine to edit; Karma routes the fix.
- B4 (device backup of `scribe.db`, recordings, pictures): COUNSEL and FOUNDER. Recommendation: accept for 1.0. One part is open and is `mobile`'s to answer: whether the safety tiers sit inside `scribe.db`, and so inside the backup, before any screen says they "stay on this phone" (CDO return, B4).
- Q-5 below: plan state is labelled L3 as built; the conflict with ADR 0013 and the legal document goes to `privacy` and counsel (C-2).

## Questions for the council

- Q-1 (CDO, CPO-privacy) Make `docs/legal/data-map.yaml` (BL-016) generated from the catalog query used here, so the inventory cannot go stale again. Default: yes; `data-architect` writes the generator, `privacy` owns the levels.
- Q-2 (CISO) Extend `classification.test.mjs` to `ops`, `insights` and `sync_private` and to the phone's `migrations.ts` comments (DS T3). Default: yes, owner `qa`; a new migration adds the 10 missing comments.
- Q-3 (founder) Applying the 29 unapplied migrations (finding 1) is the founder's step. Default: no action by agents; this pack only states the gap.
- Q-4 (counsel and product) Is the iPhone device backup of `scribe.db`, recordings and pictures acceptable for v1.0? This is theirs to answer; I set no default. The build today follows ADR 0028 D1 and `DATA_CLASSIFICATION.md` 4.5, which assume it. Any Settings words about it are `content`'s and PROPOSED.
- Q-5 (CLO) Is a server-side plan state (finding 5) in scope of the privacy policy section on purchases? Default: yes as labelled L3; counsel confirms.

### Council answers (20 Nov 2026)

- Q-1: AGREE, generated; replaces PR #37 (8.6, G-25).
- Q-2: AGREE (8.4, G-2).
- Q-3: A2 is RULED with conditions: name the target project, staging first, dump before applying, record the apply in the same PR as the `migrations-applied.txt` change (D-041). The act is the founder's.
- Q-4: B4, COUNSEL and FOUNDER (8.8).
- Q-5: AGREE L3 as built; conflict C-2 to `privacy` and counsel.
