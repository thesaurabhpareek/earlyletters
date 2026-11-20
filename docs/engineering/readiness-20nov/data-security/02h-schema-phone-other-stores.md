# 02h Schema reference: other phone stores (Find index, recording backup file, settings keys, secure storage, files)

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); code read at the cited lines. Levels marked PROPOSED are mine and `privacy` rules them (the classification is `privacy`'s). Part of 02 (legend in 02a).

## 1. Find index (inside scribe.db, built at runtime, not by a migration)

Created by `ensureSearchIndex` (`apps/mobile/src/lib/find/lifecycle.ts:179-181`), not by `migrations.ts` (ADR 0028 D4). Derived data, rebuilt from letters; never synced; erased with the letters. Retention: with the letters; `find.dirtyAt` marks a rebuild. Deletion path: `removeEverything` deletes every table (`db/repos/wipe.ts:135-144`); the FTS5 secure-delete option is set where this SQLite has it (`lifecycle.ts:185-192`, setting `find.secureDelete`). Tests: `find-index`, `find-rebuild`, `find-scan`, `find-search`.

| Object | Type | Columns | L | Note |
|---|---|---|---|---|
| letter_search | FTS5 virtual table | body, extra | L4 | words of the letter and picture words; tokenizer unicode61 remove_diacritics 2; shadow tables hold the same text |
| letter_search_rows | table | entry_id TEXT pk not null; row_id INTEGER not null unique | L3, L2 | map from letter id to FTS row |
| searchable_letters | view | id, body, extra and the letter filters (`find/sources.ts:75-87`) | L4 | drops first in any rebuild of a table it reads |

## 2. Recording backup file (backup-<profile id>.db, a second SQLite file)

`apps/mobile/src/lib/backup/local-db.ts:17-18` names it `backup.db`; `backupDbFileFor` makes the real name `backup-<profile id>.db` (`backup/account.ts:28-31`) and `runtime.ts:423` opens it [V]. It is a cache of upload jobs and restore items; the header says it can be rebuilt from the letters and the server's `audio_blobs` rows (`local-db.ts:3-6`). It is in no row of `DATA_CLASSIFICATION.md` 4.5 or 4.6 (Gap G-11). The file name holds a person id (L3). Flag: backup is off in the shipped build (`EXPO_PUBLIC_BACKUP`, NS-08-R5), so no row exists until it is on. All levels below are PROPOSED.

Retention: jobs until confirmed and the letter is gone, restore items until done. Deletion path: no deletion of the file was found in `erase-everything.ts` or `backup/*.ts` [V grep; U whether `runtime.ts` clears it elsewhere]. Tests: `backup-restore`, backup queue tests.

| Table | Column | Type | Null | L | Note |
|---|---|---|---|---|---|
| backup_meta | key, value | TEXT, TEXT | no | L3 | keys: profileId, enabled, paused, cellular, keyState, lastBackedUpAt, device and request markers; per-book keys hold a book id |
| backup_jobs | entry_id (pk), child_id | TEXT | no | L3 | |
| backup_jobs | source | TEXT check letter or held | no | L2 | |
| backup_jobs | audio_uri, tmp_uri | TEXT | no, yes | L3 | sandbox paths to L4 audio and to the encrypted temp copy |
| backup_jobs | audio_sha256 | TEXT | no | L4 | derived from audio |
| backup_jobs | audio_bytes, cipher_bytes, upload_offset, attempts | INTEGER | no, yes, no, no | L2 | upload_offset and attempts default 0 |
| backup_jobs | captured_at, confirmed_at, updated_at, next_attempt_at | TEXT, TEXT, TEXT, INTEGER | mixed | L2 | |
| backup_jobs | state | TEXT check queued, sealed, begun, uploading, uploaded, confirmed, blocked | no | L2 | |
| backup_jobs | key_version | INTEGER | yes | L2 | |
| backup_jobs | wrapped_file_key | TEXT | yes | L4 | the 60-byte wrapped file key; server copy is audio_blobs.wrapped_file_key |
| backup_jobs | nonce_prefix | TEXT | yes | L4 | with the key it rebuilds the same ciphertext after a kill |
| backup_jobs | cipher_sha256 | TEXT | yes | L3 | of the ciphertext |
| backup_jobs | object_path | TEXT | yes | L3 | server path, ids only |
| backup_jobs | upload_url, upload_token | TEXT | yes | L4 | a resumable-upload capability and its token: a secret until the upload ends |
| backup_jobs | last_error | TEXT | yes | L2 | a code, never content (`local-db.ts:40-41`) |
| backup_restores | entry_id (pk) | TEXT | no | L3 | |
| backup_restores | state, attempts, updated_at | TEXT check pending, done, kept_local, failed; INTEGER; TEXT | no | L2 | |

## 3. Settings keys (the key decides the level)

"Doc" says whether `DATA_CLASSIFICATION.md` 4.5 lists the key. Keys marked new are in code and not in the doc [V grep of the setting names]; their levels are PROPOSED.

| Key | L | Doc | What it holds |
|---|---|---|---|
| activeChildId | L3 | yes | book id |
| appearance, readingSize, review.firstNoteSeen, review.defaultView, content.dismissed | L2 | yes, except review.defaultView new | display choices, dismissed content ids |
| reminders.enabled, .paused, .cadence, .days, .weeklyDay, .time, .monthNotes | L2 | yes | reminder preferences, local clock time |
| notifications.lockScreenNames | L2 | yes | the switch only; when on, local notice text names the child (01b L-1) |
| player.original, packs.allowCellular | L2 | yes | playback and download choices |
| auth.lastMethod, auth.reauth_epoch_seen | L2 | yes, new | last sign-in method; re-authentication epoch seen |
| family.coParentNotify | L2 | yes | a day, never sent |
| language.spoken, speech.language, speech.letterLanguage.<letter id> | L4 | yes | the author's languages (the last key also holds a letter id, L3) |
| speech.memoryFailures, speech.jobRunning, speech.download, speech.download.migrated | L2 | yes | model tier and download state |
| plus.cache | L3 | yes | last plan snapshot for offline launch |
| plus.statusReport | L2 | new | what this phone has reported (code comment: L2, no ids; `billing/status-report.logic.ts:50-51`) |
| plus.notesSeen | L2 | new | which plan notices were shown |
| letters.keptEver, earlyletters.letters.keptEver | L2 | new | kept-letter count for the free limit (settings mirror and Keychain item) |
| readTogether.sessions.<book id> | L3 | yes | count; key holds a book id |
| sync.ownerId | L3 | yes | person id owning the local rows |
| sync.epoch, .epochStartedAt, .restoreAt, .pausedFor, .lastSyncedAt, .lastVerifyAt | L2 | yes | sync state |
| accountDeletion.forgetPending | L2 | yes | analytics ids still to forget |
| accountDeletion.openRequest | L3 | yes | request state and the account id it was made for |
| scribe.analytics.consent, .id, .retired_ids, .first_launch_at, .last_active_at, .consent_offers | L2 | yes | analytics choice and random id; never an account id |
| ageGate.passed, ageGate.stoppedAt | L2 | yes | the 18+ gate; never an age or date of birth |
| book.deletedAt.<book id>, book.erasing.<book id> | L3 | new | tombstone time and erase marker for a book (`db/repos/wipe.ts:21-22`) |
| book.seenFromOthers | L3 | new | letter ids of others' letters already shown (ids only; `app/(tabs)/book.tsx:84`) |
| erase.everything.pending | L2 | new | resumes an interrupted Erase (`wipe.ts:23`) |
| find.dirtyAt, find.secureDelete | L2 | new | Find rebuild marker |
| db.secureDeleteVacuumAt | L2 | new | last vacuum after secure delete (`store.ts:192`) |
| lastExportedAt | L2 | new | time of the last export (`settings/where-live.logic.ts:19`) |
| lastLaunchAt | L2 | new | launch time (`store.ts:789`) |
| newPhone.arrival | L2 | new | an arrival line between two screens; holds no name, date or text (`first-run/new-phone.logic.ts:85-86`) |
| e2eKillDrill.owned | L2 | new | development builds only (`dev/kill-drill.logic.ts:66`) |
| preview.draftId | L3 | yes | web preview only |

## 4. Secure storage (Keychain)

| Item | L | Accessible | What |
|---|---|---|---|
| scribe.auth | L4 | after first unlock, this device only (`supabase/secure-storage.ts:22-25`) | the sign-in session |
| scribe.auth.appleUser | L3 | same | Apple user identifier for credential-state checks |
| scribe.auth.pendingName | L3 | same | name Apple returned at first sign-in, until saved (the design drops it by default: `docs/tdd/new-scope/12-first-run-2.md:42`) |
| scribe.auth.pendingEmailRequest | L2 | same | time only |
| scribe.family.pendingInvite | L4 | same | invite token waiting for sign-in |
| earlyletters.letters.keptEver | L2 | after first unlock, this device only (`billing/letter-ledger.keychain.ts`) | free-limit ledger |
| book keys (one per child, author, version) | L4 | synchronizable Keychain, so Apple's iCloud Keychain carries them to the person's other Apple devices (`backup/keys.ts:4-6`) | the key that opens recording backups; Apple is a processor for this item |
| X25519 private key | L4 | this device | restore enrolment key; a grep of `backup/*.ts` finds no item name [U]. `modules/scribe-keys/ios/ScribeKeysModule.swift:94` excludes its keys folder from the device backup (the only exclusion that touches key material) |

## 5. Files outside the database

| Path (iOS) | L | Excluded from device backup | Cleared by |
|---|---|---|---|
| `audio/<entry id>.m4a` and the other recording folder | L4 | no | `eraseDeviceFiles` (`erase-everything.ts:57`); book erase |
| `Application Support/listening/` | L4 | yes (`ScribeAudioModule.swift:94`) | `sweepListeningCopies` |
| `Application Support/packs/`, models | L1 | yes (`packs/app-support.ts:39`, `model-files.ts:41`) | kept on Erase by design (`erase-everything.ts:24`); the set installed is L4 |
| `Application Support/remote` | L1 | n/a | |
| export ZIPs and recovery export in app temp | L4, plaintext by design | temp | after the share sheet; Erase |
| `backup-<profile id>.db` and `-wal`, `-shm` | PROPOSED L4 | no | see section 2 |

## Gaps found in this file

- G-11 `backup-<profile id>.db` is in no inventory row, is not excluded from the device backup, is not copied by the recovery export (`resilience/recovery-export.logic.ts:33-42` keeps only `scribe.db` and its `-wal`, `-shm`, `-journal` files), and no code path was found that deletes it on Erase.
- G-21 Seventeen setting keys or key families in code are absent from `DATA_CLASSIFICATION.md` 4.5 (section 3, marked new).

## Questions for the council

- Q-h1 (CISO, CPO-privacy) Keep `upload_url` and `upload_token` in a file inside the iPhone backup? Default: move them to the Keychain item class of `scribe.auth` or stop persisting them, decided by `security-architect` and `sync`; until then the flag is off today and stays the founder's call.
- Q-h2 (CPO-privacy) Exclude `backup-<id>.db` from the iPhone backup and delete it on Erase. Default: yes, a `mobile` change; not done here.
