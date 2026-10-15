---
title: Data and storage
owner: reference-docs
covers: [apps/mobile/src/lib/store.ts, apps/mobile/src/lib/db/**, apps/mobile/src/lib/export/**, apps/mobile/src/lib/capture/**, apps/mobile/src/lib/model-files.ts, apps/mobile/src/lib/packs/app-support.ts, apps/mobile/src/lib/supabase/secure-storage.ts, apps/mobile/src/lib/shelf-days.ts, supabase/migrations/**, .github/migrations-applied.txt]
verified_at: 56ec5b5
verified_on: 2026-10-15
---

# Data and storage

Where every piece of data lives on the phone, how deletion and export work, and the server schema that exists but is parked. Classification levels for every column and file: [`docs/legal/DATA_CLASSIFICATION.md`](../legal/DATA_CLASSIFICATION.md). Rules for deletion and export: [`docs/legal/DELETION_AND_EXPORT_SPEC.md`](../legal/DELETION_AND_EXPORT_SPEC.md).

## On the phone

| What | Where | Backup | Code |
|---|---|---|---|
| Database `scribe.db` | expo-sqlite, opened with `openDatabaseSync` | No exclusion set by the app | `lib/store.ts`, `lib/db/repos/open-native.ts` |
| Recordings (`.m4a`) | Documents directory | Included in the person's iPhone or iCloud backup, on purpose (D-033, D-085) | `lib/capture/recorder.ts`, `lib/model-files.ts` |
| Listening copies | `Application Support/listening/<letter id>.m4a` plus a `.json` sidecar | Excluded | `lib/audio-enhance/index.ts`, `modules/scribe-audio` |
| Installed packs and speech models | `Application Support/packs/installed/<id>/<version>/` (partials in `staging/`) | Excluded | `lib/packs/engine.ts`, `lib/packs/app-support.ts` |
| Signed document cache | `Application Support/remote` | Excluded | `lib/remote/expo-adapter.ts` |
| Hand-copied dev model | `Application Support/models` (falls back to `Documents/models` without the native module) | Excluded when the module exists | `lib/model-files.ts` |
| Export ZIPs | App cache, deleted after the share sheet closes and by `cleanupExports()` | Not backed up | `lib/export/device.ts` |
| Free-letter count | Keychain item `earlyletters.letters.keptEver`, mirrored in `settings` as `letters.keptEver` | Keychain item is this-device-only | `lib/billing/letter-ledger.ts`, `letter-ledger.logic.ts` |
| Parked: sign-in session, Apple user id, pending invite | Keychain through `expo-secure-store` | This-device-only | `lib/supabase/secure-storage.ts` |

Data protection: `app.config.ts` sets the iOS default class to `NSFileProtectionCompleteUntilFirstUserAuthentication`, so files are encrypted until the first unlock after a restart. The database file itself is not encrypted by the app (DATA_CLASSIFICATION 4.5 records the SQLCipher decision as pending).

Secure storage uses `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so Keychain items are never restored onto another phone from a backup (`lib/supabase/secure-storage.ts`).

## The device database

Opened once at launch by `openStore()` in `lib/store.ts`; `PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL` on every open (`lib/db/expo-adapter.ts`). The schema version is `PRAGMA user_version`; `lib/db/migrations.ts` runs each step in one transaction with its version bump and throws `local_db_migration_failed:<n>` (no SQLite text) on failure. A file written by a newer build is left untouched.

| Version | Name in `migrations.ts` |
|---|---|
| 1 | baseline tables: `settings`, `entries`, `children`, `drafts` |
| 2 | multi-child and audio columns; the legacy single `family` setting becomes the first child |
| 3 | crash-safe capture (draft `state`, audio hash and size), voice-only letters (`transcript_status`), `orphan_audio`, age gate as a boolean |
| 4 | sync: `sync_outbox`, `rejected_writes`, `sync_books`, server version columns (parked; empty in v1.0) |
| 5 | quiet-day marks carry no sentence (D-084): blanks `final_text` of `not_much` rows |

Per-table detail is in [mobile-app.md](mobile-app.md#device-database). Rules the store enforces (`apps/mobile/src/lib/README.md`, `lib/db/repos/*`):

- `raw_transcript`, `captured_at` and the audio never change after insert.
- Review's save is one transaction: insert the letter, delete the draft, count the letter in the ledger (`saveLetterFromDraft`).
- A draft row exists before the microphone goes live; the launch sweep finishes cut-off takes, rebases paths after an iOS container move, and never deletes audio (`lib/capture/sweep.ts`).
- New columns need a row in DATA_CLASSIFICATION 4.5 (comment in `migrations.ts`). That section still says version 4; the code is at version 5, which adds no column.

## Deleting on the phone

| Action | What happens | Code |
|---|---|---|
| Delete a letter | Asks first, then sets `deleted_at` (a tombstone). The letter moves to Recently deleted | `app/letter/[id].tsx`, `store.deleteEntry` |
| Restore | Clears the tombstone; the letter returns exactly as it was | `app/settings/recently-deleted.tsx`, `store.undeleteEntry` |
| Erase now | Removes the recording and its listening copy first, then the row; idempotent | `store.eraseEntry`, `lib/capture/erase.ts` |
| 30-day purge | At launch, after the sweep and never during a recording: letters deleted `SHELF_DAYS` (30) days ago or more are erased the same way. Skipped when sync is on, or when the clock is earlier than the last recorded launch | `erase.ts` `purgeShelfAtLaunch`, `store.purgeExpired`, `lib/shelf-days.ts` |
| Hide a book | Hides the child from lists; nothing is deleted | `store.hideChild` |
| Remove speech files | Settings, Recordings or Storage; letters and recordings stay, new recordings wait for words | `app/settings/recordings.tsx`, `app/settings/storage.tsx` |

Deleted letters still count toward the free letters (D-083). The ledger exports `eraseLetterLedger()` for "Erase everything"; no screen calls it on `develop`. Account deletion (`app/settings/delete-account.tsx`, `lib/account-deletion`) is **parked** with sign-in. Reasons: D-085 in [../DECISIONS.md](../DECISIONS.md).

## Export

Settings, Export (`app/settings/export.tsx`, `lib/export/`) makes one ZIP on the phone, offline, free in every plan state. It snapshots the store, writes the ZIP to the cache, re-reads it to check every hash, then hands it to the share sheet.

| Path in the ZIP | Holds |
|---|---|
| `README.txt`, `index.html` | How to read it without the app |
| `schema/export-v1.schema.json` | The JSON Schema for the data files |
| `data/entries.json`, `data/children.json`, `data/account.json` | Every letter on the phone (in book or private, every book including hidden ones); own letters carry raw transcript, its SHA-256, machine edits and engine version |
| `letters/<book>/<yyyy-mm>/<date>_<id>.txt` | One text file per letter |
| `audio/<letter id>.m4a` | Original recordings, byte for byte; a missing one is listed as `audio_missing` |
| `book/<book>.pdf` | The printable book: letters in the book that have words; quiet-day marks never print |

Recently deleted letters are left out by design (`build.logic.ts`). The ZIP is stored without compression and must stay under 4 GiB (`pack.ts` `MAX_EXPORT_BYTES`). The launch recovery screen has its own "Export what is readable" (`lib/resilience/recovery-export.ts`).

## The server schema (parked)

Postgres migrations live in `supabase/migrations`. **Only the files listed in `.github/migrations-applied.txt` are applied to the live project**; the rest are pending, and the v1.0 app talks to none of it. Generated:

<!-- facts:migrations -->
| File | Live | Creates tables | Views | Functions | Definer |
|---|---|---|---|---|---|
| `20260930000000_scribe_core.sql` | applied | `profiles`, `children`, `child_members`, `child_invites`, `entries`, `entry_versions`, `dictionary_terms`, `safety_events` |  | 8 | 6 |
| `20261001000000_scribe_hardening.sql` | applied |  |  | 0 | 0 |
| `20261002010000_entries_select_policy.sql` | pending |  |  | 0 | 0 |
| `20261002020000_data_governance.sql` | pending | `child_member_prefs`, `legal_holds`, `audit_events`, `deletion_requests`, `deletion_request_steps`, `policy_documents`, `policy_versions`, `policy_acceptances`, `storage_purge_queue`, `purge_ledger` | `book_entries`, `my_policy_state` | 29 | 24 |
| `20261003000000_security_and_family.sql` | pending |  | `book_entries` | 25 | 21 |
| `20261003010000_children_and_entitlements.sql` | pending | `app_account_tokens`, `store_subscriptions`, `store_notifications` |  | 11 | 8 |
| `20261003020000_purge_batching.sql` | pending |  |  | 6 | 5 |
| `20261004000000_plus_on_device_only.sql` | pending |  |  | 4 | 4 |
| `20261004100000_sync_engine.sql` | pending | `sync_epochs`, `sync_op_receipts` |  | 7 | 5 |
| `20261004200000_ops_deletion_worker.sql` | pending |  |  | 24 | 24 |
| `20261004300000_insights_aggregates.sql` | pending |  | `insights` | 1 | 4 |
| `20261005000000_family_cap_language_idempotency.sql` | pending | `idempotency_keys` |  | 18 | 13 |
<!-- /facts:migrations -->

Columns: `Live` is applied or pending per `migrations-applied.txt`. `Functions` and `Definer` count `create function` and `security definer` in each file. The generator reads only unqualified or `public.` names, so tables, views and functions in the `ops` and `insights` schemas show up incompletely (for example `insights` appears as a view name); see the per-file headers or DATA_CLASSIFICATION 4.1.2 and 4.1.3 for those.

### Main tables and views

| Area | Tables and views | First created in |
|---|---|---|
| People and books | `profiles`, `children`, `child_members`, `child_invites`, `child_member_prefs` | `scribe_core`, `data_governance` |
| Letters | `entries` (immutable `raw_transcript` enforced by a trigger), `entry_versions`, `dictionary_terms`, view `book_entries` (what co-members may read; raw transcripts author-only) | `scribe_core`, `data_governance` |
| Consent and policy | `policy_documents`, `policy_versions`, `policy_acceptances`, view `my_policy_state` | `data_governance` |
| Deletion and retention | `deletion_requests`, `deletion_request_steps`, `legal_holds`, `storage_purge_queue`, `purge_ledger`, `audit_events` | `data_governance` |
| Sync | `sync_epochs`, `sync_op_receipts`, `sync_rate_windows` (an unlogged table, so the generated table above misses it) | `sync_engine` |
| Requests | `idempotency_keys` | `family_cap_language_idempotency` |
| Operations | schema `ops` (service role only) | `ops_deletion_worker` |
| Insights | schema `insights`, k-anonymised weekly views | `insights_aggregates` |

Removed on purpose: `safety_events` is dropped by `data_governance` (safety tiers stay on the device), and the server Plus tables (`app_account_tokens`, `store_subscriptions`, `store_notifications`) are created by `children_and_entitlements` and dropped by `plus_on_device_only` (Plus is checked on the device only).

How migrations are applied and the RPCs on top: [backend.md](backend.md).

## Classification in one line each

From `docs/legal/DATA_CLASSIFICATION.md` section 1: **L1** public, **L2** internal (enums, flags, counts), **L3** confidential personal data (ids, signatures, roles), **L4** restricted (letter text, transcripts, edits, audio, child name and dates, tokens). The device database is handled as L4 as a whole. The highest level of anything a field can hold wins.
