---
title: Data and storage
owner: reference-docs
covers: [apps/mobile/src/lib/store.ts, apps/mobile/src/lib/db/**, apps/mobile/src/lib/export/**, apps/mobile/src/lib/capture/**, apps/mobile/src/lib/model-files.ts, apps/mobile/src/lib/packs/app-support.ts, apps/mobile/src/lib/supabase/secure-storage.ts, apps/mobile/src/lib/shelf-days.ts, supabase/migrations/**, .github/migrations-applied.txt]
verified_at: 2cbea6d
verified_on: 2026-10-23
---

# Data and storage

Where every piece of data lives on the phone, how deletion and export work, and the server schema that exists on `develop` (only two migrations applied live; D-100 ships server features in v1.0, but every build profile on `develop` still has them off ([register](../decisions/INDEX.md))). Classification levels for every column and file: [`docs/legal/DATA_CLASSIFICATION.md`](../legal/DATA_CLASSIFICATION.md). Rules for deletion and export: [`docs/legal/DELETION_AND_EXPORT_SPEC.md`](../legal/DELETION_AND_EXPORT_SPEC.md).

## On the phone

| What | Where | Backup | Code |
|---|---|---|---|
| Database `scribe.db` | expo-sqlite, opened with `openDatabaseSync` | No exclusion set by the app | `lib/store.ts`, `lib/db/repos/open-native.ts` |
| Recordings (`.m4a` today; `.aac` on iOS once ADR 0027 flips) | The recorder's folder, `Documents/ExpoAudio` on iOS (`<files>/Audio` on Android), plus older takes at the top of Documents | Included in the person's iPhone or iCloud backup, on purpose (D-033, D-085) | `lib/capture/recorder.ts`, `lib/capture/recordings.ts`, `lib/capture/sweep.logic.ts` `recorderFolder` |
| Whole-frame copies of an ADTS take | Caches, named by a key of the file name and time; removed when the transcription run ends, and by Erase now and the purge | Never backed up | `lib/capture/adts-file.ts` |
| Listening copies | `Application Support/listening/<letter id>.m4a` plus a `.json` sidecar | Excluded | `lib/audio-enhance/index.ts`, `modules/scribe-audio` |
| Installed packs and speech models | `Application Support/packs/installed/<id>/<version>/` (partials in `staging/`) | Excluded | `lib/packs/engine.ts`, `lib/packs/app-support.ts` |
| Signed document cache | `Application Support/remote` | Excluded | `lib/remote/expo-adapter.ts` |
| Hand-copied dev model | `Application Support/models` (falls back to `Documents/models` without the native module) | Excluded when the module exists | `lib/model-files.ts` |
| Export ZIPs | App cache, deleted after the share sheet closes and by `cleanupExports()` | Not backed up | `lib/export/device.ts` |
| Free-letter count | Keychain item `earlyletters.letters.keptEver`, mirrored in `settings` as `letters.keptEver` | Keychain item is this-device-only | `lib/billing/letter-ledger.ts`, `letter-ledger.logic.ts` |
| Server features (off in every profile): sign-in session, Apple user id, pending invite | Keychain through `expo-secure-store` | This-device-only | `lib/supabase/secure-storage.ts` |

Data protection: `app.config.ts` sets the iOS default class to `NSFileProtectionCompleteUntilFirstUserAuthentication`, so files are encrypted until the first unlock after a restart. The database file itself is not encrypted by the app (DATA_CLASSIFICATION 4.5 records the SQLCipher decision as pending).

Secure storage uses `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so Keychain items are never restored onto another phone from a backup (`lib/supabase/secure-storage.ts`).

## The device database

Opened once at launch by `openStore()` in `lib/store.ts`; `PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL` on every open (`lib/db/expo-adapter.ts`). The schema version is `PRAGMA user_version`; `lib/db/migrations.ts` runs each step in one transaction with its version bump and throws `local_db_migration_failed:<n>` (no SQLite text) on failure. A file written by a newer build is left untouched.

| Version | Name in `migrations.ts` |
|---|---|
| 1 | baseline tables: `settings`, `entries`, `children`, `drafts` |
| 2 | multi-child and audio columns; the legacy single `family` setting becomes the first child |
| 3 | crash-safe capture (draft `state`, audio hash and size), voice-only letters (`transcript_status`), `orphan_audio`, age gate as a boolean |
| 4 | sync: `sync_outbox`, `rejected_writes`, `sync_books`, server version columns (empty while `SERVER_FEATURES=off`) |
| 5 | quiet-day marks carry no sentence (D-084): blanks `final_text` of `not_much` rows |
| 6 | draft kind, occurred date and precision, letter language and base direction (WP-F04-03, G-26; PR #146): columns only, with defaults, so no row changes and nothing is queued |

Per-table detail is in [mobile-app.md](mobile-app.md#device-database). Rules the store enforces (`apps/mobile/src/lib/README.md`, `lib/db/repos/*`):

- `raw_transcript`, `captured_at` and the audio never change after insert.
- Review's save is one transaction: insert the letter, delete the draft, count the letter in the ledger (`saveLetterFromDraft`). Since #146 the ledger counts a letter only when it is this phone's account's own (or made before any sign-in), its words exist, and it was kept from Review with the words on screen (D-103; `COUNTED_LETTERS_SQL` in `db/repos/ledger.ts`).
- A draft row exists before the microphone goes live; the launch sweep finishes cut-off takes, rebases paths after an iOS container move, and never deletes audio (`lib/capture/sweep.ts`). It looks in both recording folders (`recordingFolders()` in `lib/capture/recordings.ts`): the top of Documents, then the recorder's own folder. A row keeps the file at its exact stored path; only when that path is missing is a file matched by name. The sweep, erase and the recovery export all use this one listing.

### The recording container

Every take is AAC-LC (ADR 0005). The container is set per platform in `RECORDING_CONTAINERS` (`lib/capture/recording-file.ts`): both iOS and Android are `'m4a'` on `develop`. ADR 0027 moves iOS to ADTS (`.aac`), which still plays to the last whole frame after the app is killed, once its three checks pass; Android stays M4A. Code already handles both: the file extension names the container, the sweep and erase count `.aac` as a recording (`RECORDING_EXTENSIONS` in `sweep.logic.ts`), Export names each file by its container, and `lib/capture/adts.ts` counts ADTS frames so a transcription run never plans over less audio than the file holds (`lib/transcribe-run.ts`; see [speech-and-languages.md](speech-and-languages.md)). Why: [ADR-0027](../decisions/INDEX.md).
- New columns need a row in DATA_CLASSIFICATION 4.5 (comment in `migrations.ts`). That section still says version 4; the code is at version 6, whose columns (`drafts.kind`, `occurred_on`, `occurred_precision`, `language`, `base_direction`, and the same three on `entries`) are not yet in it. The levels are in the comment in `migrations.ts` (L2, L3 or L4 per column).

## Deleting on the phone

| Action | What happens | Code |
|---|---|---|
| Delete a letter | Asks first, then sets `deleted_at` (a tombstone). The letter moves to Recently deleted | `app/letter/[id].tsx`, `store.deleteEntry` |
| Restore | Clears the tombstone; the letter returns exactly as it was | `app/settings/recently-deleted.tsx`, `store.undeleteEntry` |
| Erase now | Removes the recording (at its stored path and any same-name file in either recording folder that no other row may own), its listening copy and any whole-frame copy first, then the row; idempotent | `store.eraseEntry`, `lib/capture/erase.ts`, `recordings.ts` `erasableFiles` |
| 30-day purge | At launch, after the sweep and never during a recording: letters deleted `SHELF_DAYS` (30) days ago or more are erased the same way. Skipped when sync is on, or when the clock is earlier than the last recorded launch | `erase.ts` `purgeShelfAtLaunch`, `store.purgeExpired`, `lib/shelf-days.ts` |
| Let it go (a draft) | Three steps so a kill can never re-attach a deleted take: mark the draft `discarding`, delete the file, then remove the row (F04-REQ-009). Built in the store; no screen calls it on `develop` yet | `store.beginDiscard`, `store.finishDiscard`, `db/repos/drafts.ts` |
| Hide a book | Hides the child from lists; nothing is deleted | `store.hideChild` |
| Remove speech files | Settings, Recordings or Storage; letters and recordings stay, new recordings wait for words | `app/settings/recordings.tsx`, `app/settings/storage.tsx` |

Deleted letters still count toward the free letters (D-083). The ledger exports `eraseLetterLedger()` for "Erase everything"; no screen calls it on `develop`. Account deletion (`app/settings/delete-account.tsx`, `lib/account-deletion`) is a server feature, off in every build profile on `develop`; D-100 (founder; logged 16 Oct) ships server features in v1.0 after the R-17 security gate; the build profiles that turn them on are not on `develop` yet (open PR #145) ([register](../decisions/INDEX.md)). Reasons: D-085 in [../DECISIONS.md](../DECISIONS.md).

## Export

Settings, Export (`app/settings/export.tsx`, `lib/export/`) makes one ZIP on the phone, offline, free in every plan state. It snapshots the store, writes the ZIP to the cache, re-reads it to check every hash, then hands it to the share sheet.

| Path in the ZIP | Holds |
|---|---|
| `README.txt`, `index.html` | How to read it without the app |
| `schema/export-v1.schema.json` | The JSON Schema for the data files. Schema version 1.2.0 (`lib/export/schema.ts` `EXPORT_SCHEMA_VERSION`): 1.1.0 added `consent_on_this_phone` to `account.json`, 1.2.0 allows `.aac` recordings and adds the optional `data/other-versions.json` (#146). Older exports still validate against it |
| `data/entries.json`, `data/children.json`, `data/account.json` | Every letter on the phone (in book or private, every book including hidden ones); own letters carry raw transcript, its SHA-256, machine edits and engine version. `account.json` also carries the consent choices this phone holds: the 18+ answer and the usage-sharing choice (`not_answered` when never asked); not a server record |
| `data/other-versions.json` | Only when this phone keeps another version of a letter's words that the letter does not show: a conflict copy from a second phone's edit, kept until the author picks (F16-REQ-023, `ExportOtherVersion` in `schema.ts`). Conflict copies come only from sync, which is off in every build profile on `develop` |
| `letters/<book>/<yyyy-mm>/<date>_<id>.txt` | One text file per letter |
| `audio/<letter id>.m4a` or `.aac` | Original recordings, byte for byte, each named and labelled by its own container (`audio/mp4` or `audio/aac`); a missing one is listed as `audio_missing` |
| `book/<book>.pdf` | The printable book: letters in the book that have words; quiet-day marks never print |

Recently deleted letters are left out by design (`build.logic.ts`). The ZIP is stored without compression and must stay under 4 GiB (`pack.ts` `MAX_EXPORT_BYTES`). The launch recovery screen has its own "Export what is readable" (`lib/resilience/recovery-export.ts`).

## The server schema

Postgres migrations live in `supabase/migrations`. **Only the files listed in `.github/migrations-applied.txt` are applied to the live project**; the rest are pending, and an app built from any current profile talks to none of it. Generated:

<!-- facts:migrations -->
| File | Live | Creates tables | Views | Functions | `security definer` mentions |
|---|---|---|---|---|---|
| `20260930000000_scribe_core.sql` | applied | `profiles`, `children`, `child_members`, `child_invites`, `entries`, `entry_versions`, `dictionary_terms`, `safety_events` |  | 8 | 6 |
| `20261001000000_scribe_hardening.sql` | applied |  |  | 0 | 0 |
| `20261002010000_entries_select_policy.sql` | pending |  |  | 0 | 0 |
| `20261002020000_data_governance.sql` | pending | `child_member_prefs`, `legal_holds`, `audit_events`, `deletion_requests`, `deletion_request_steps`, `policy_documents`, `policy_versions`, `policy_acceptances`, `storage_purge_queue`, `purge_ledger` | `book_entries`, `my_policy_state` | 29 | 24 |
| `20261003000000_security_and_family.sql` | pending |  | `book_entries` | 25 | 21 |
| `20261003010000_children_and_entitlements.sql` | pending | `app_account_tokens`, `store_subscriptions`, `store_notifications` |  | 11 | 8 |
| `20261003020000_purge_batching.sql` | pending |  |  | 6 | 5 |
| `20261004000000_plus_on_device_only.sql` | pending |  |  | 4 | 4 |
| `20261004100000_sync_engine.sql` | pending | `sync_epochs`, `sync_op_receipts`, `sync_rate_windows` |  | 7 | 5 |
| `20261004200000_ops_deletion_worker.sql` | pending | `ops.audit_log`, `ops.alert_state`, `ops.forget_quota`, `ops.apple_tokens` |  | 25 | 24 |
| `20261004300000_insights_aggregates.sql` | pending |  | `insights._book_family`, `insights._letters`, `insights.weekly_keeping_families`, `insights.letters_per_active_family`, `insights.first_letter_conversion`, `insights.family_invites`, `insights.retention_cohorts`, `insights.language_mix` | 7 | 4 |
| `20261005000000_family_cap_language_idempotency.sql` | pending | `idempotency_keys` |  | 19 | 13 |
<!-- /facts:migrations -->

`Live` is applied or pending per `migrations-applied.txt`.

### Main tables and views

| Area | Tables and views | First created in |
|---|---|---|
| People and books | `profiles`, `children`, `child_members`, `child_invites`, `child_member_prefs` | `scribe_core`, `data_governance` |
| Letters | `entries` (immutable `raw_transcript` enforced by a trigger), `entry_versions`, `dictionary_terms`, view `book_entries` (what co-members may read; raw transcripts author-only) | `scribe_core`, `data_governance` |
| Consent and policy | `policy_documents`, `policy_versions`, `policy_acceptances`, view `my_policy_state` | `data_governance` |
| Deletion and retention | `deletion_requests`, `deletion_request_steps`, `legal_holds`, `storage_purge_queue`, `purge_ledger`, `audit_events` | `data_governance` |
| Sync | `sync_epochs`, `sync_op_receipts`, `sync_rate_windows` | `sync_engine` |
| Requests | `idempotency_keys` | `family_cap_language_idempotency` |
| Operations | schema `ops` (service role only) | `ops_deletion_worker` |
| Insights | schema `insights`, k-anonymised weekly views | `insights_aggregates` |

Removed on purpose: `safety_events` is dropped by `data_governance` (safety tiers stay on the device), and the server Plus tables (`app_account_tokens`, `store_subscriptions`, `store_notifications`) are created by `children_and_entitlements` and dropped by `plus_on_device_only` (Plus is checked on the device only).

How migrations are applied and the RPCs on top: [backend.md](backend.md).

## Classification in one line each

From `docs/legal/DATA_CLASSIFICATION.md` section 1: **L1** public, **L2** internal (enums, flags, counts), **L3** confidential personal data (ids, signatures, roles), **L4** restricted (letter text, transcripts, edits, audio, child name and dates, tokens). The device database is handled as L4 as a whole. The highest level of anything a field can hold wins.
