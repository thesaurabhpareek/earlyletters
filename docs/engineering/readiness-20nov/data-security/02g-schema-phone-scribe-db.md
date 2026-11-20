# 02g Schema reference: the phone database (scribe.db)

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`). The ten tables below are what `migrate()` builds at schema version 10 (`apps/mobile/src/lib/db/migrations.ts:57-470`); I ran every migration against `node:sqlite` and read `PRAGMA table_info` for the types, null and defaults [V]. Levels for v1 to v3 columns are `docs/legal/DATA_CLASSIFICATION.md` 4.5; levels for v4 to v10 are the comments in `migrations.ts`. Part of 02 (legend in 02a; roles do not apply on the phone).

## The file

- One SQLite file `scribe.db`, opened by `openNativeDb` (`lib/db/repos/open-native.ts:16-23`) with `journal_mode = WAL`, `synchronous = FULL`, `secure_delete = ON` (`lib/db/expo-adapter.ts:31`) [V]. The highest level inside is L4, so the whole file is handled as L4.
- Protection: iOS Data Protection "complete until first user authentication" is the floor (LEGAL-REQ-022(b)); SQLCipher is undecided (LEGAL-REQ-022(d)) [U: not re-read on a device]. No exclusion from the iOS device backup is set on this file (a grep for the exclusion call finds only packs, models and the listening copy: `packs/app-support.ts:39`, `model-files.ts:41`, `ScribeAudioModule.swift:94`) [V].
- Version 10 is the newest on develop. Migrations are append-only and run one transaction each with the version bump (`migrations.ts:432-470`). A newer file than the build is left untouched. `entry_media` (L11) is designed, not merged: see 02i.
- Indexes: `entries_occurred`, `entries_child`, `entries_sync`, `sync_outbox_entity`, `agreements_once` (unique on document, version, action) [V].
- Level counts at v10: 21 L4 columns, 23 L3, 76 L2 (the settings table's two columns carry mixed levels by key).
- Not a column: nothing in this file is ever sent to analytics, logs or crash reports (CLAUDE.md privacy rules; 01b lists the code that enforces it).

## Tables

### scribe.db: settings (2 columns, added in v1)

- What: Key and value strings. The level is set by the key (table below).
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Per key.
- Deletion path: removeEverything deletes every row except the keep list (wipe.ts:135-144); a book erase deletes keys containing the book id (wipe.ts:117).
- Tests: erase-all, reminders-erase, age-gate-erase, store-flags.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| key (pk) | TEXT | no |  | L2/L3/L4 | by key: see the key table |
| value | TEXT | no |  | L2/L3/L4 | by key |

### scribe.db: entries (33 columns, added in v1, v2-v8)

- What: Letters of this phone: own and, after sync, other people's book letters (no raw transcript of others).
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Until the author deletes it (tombstone, then purge on sync) or Erase everything.
- Deletion path: removeBook and removeEverything (wipe.ts:107-119, 135-144); recordings are deleted by eraseDeviceFiles (erase-everything.ts:57-80).
- Tests: migrations, migrations.v5, store.capture-v6, erase-all.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| id (pk) | TEXT | no |  | L3 | letter id, UUIDv7 |
| kind | TEXT | no |  | L2 | enum |
| occurred_on | TEXT | no |  | L3 | date of the moment |
| captured_at | TEXT | no |  | L2 |  |
| capture_mode | TEXT | no |  | L2 |  |
| edit_level | TEXT | no |  | L2 |  |
| prompt_key | TEXT | yes |  | L2 | catalogue key |
| engine_version | INTEGER | no |  | L2 |  |
| raw_transcript | TEXT | no |  | L4 | exact words, immutable |
| machine_edits | TEXT | no |  | L4 | edit list |
| final_text | TEXT | no |  | L4 | the letter |
| in_book | INTEGER | no | 0 | L2 |  |
| sounds_like_me | INTEGER | yes |  | L2 |  |
| updated_at | TEXT | no |  | L2 |  |
| deleted_at | TEXT | yes |  | L2 | tombstone |
| synced_at | TEXT | yes |  | L2 | last server confirm |
| child_id | TEXT | yes |  | L3 | book id |
| author_id | TEXT | yes |  | L3 | person id |
| author_signs_as | TEXT | yes |  | L3 | signature at save |
| audio_uri | TEXT | yes |  | L3 | sandbox path; points at L4 audio |
| audio_duration_ms | INTEGER | yes |  | L2 |  |
| audio_sha256 | TEXT | yes |  | L4 | hash of the recording (derived from L4) |
| audio_bytes | INTEGER | yes |  | L2 |  |
| transcript_status | TEXT | yes |  | L2 | waiting or null |
| server_version | TEXT | yes |  | L2 | sync_xid known |
| server_updated_at | TEXT | yes |  | L2 |  |
| server_epoch | INTEGER | yes |  | L2 |  |
| sync_state | TEXT | no | 'local' | L2 | local, pending, synced, rejected, held, gone |
| approval | TEXT | yes |  | L2 | family review state |
| occurred_precision | TEXT | no | 'day' | L2 | day or month (v6) |
| language | TEXT | yes |  | L4 | letter language (v6) |
| base_direction | TEXT | no | 'ltr' | L2 | ltr or rtl (v6) |
| held_v | TEXT | yes |  | L2 | held row version (v8) |

### scribe.db: children (16 columns, added in v1, v2, v4, v7)

- What: Books known to this phone.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: While the book is on the phone.
- Deletion path: removeBook; removeEverything.
- Tests: migrations, store.child-edit, store-family-tab, erase-all.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| id (pk) | TEXT | no |  | L3 | book id |
| name | TEXT | no |  | L4 | child name |
| birthday | TEXT | yes |  | L4 | child birthday |
| due_date | TEXT | yes |  | L4 | health data (K-25) |
| signs_as | TEXT | no |  | L3 | kept as a mirror of child_member_prefs (v7) |
| reminders_on | INTEGER | no | 1 | L2 | mirror of child_member_prefs (v7) |
| family_can_read | INTEGER | no | 0 | L2 |  |
| created_at | TEXT | no |  | L2 |  |
| updated_at | TEXT | no |  | L2 |  |
| hidden_at | TEXT | yes |  | L2 | book-level, empty on the phone since v7 |
| role | TEXT | yes |  | L3 | my relation, from the server |
| created_by_me | INTEGER | yes |  | L2 |  |
| nickname | TEXT | yes |  | L4 | child nickname |
| server_state | TEXT | no | 'local' | L2 | local, pending, synced, refused, left, deleted |
| created_by | TEXT | yes |  | L3 | account that started the book (v7) |
| first_run_batch | TEXT | yes |  | L2 | op id of the first-run batch (v7) |

### scribe.db: drafts (26 columns, added in v1, v3, v6, v8, v9)

- What: Capture in progress and held drafts.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Until Keep (row goes) or Let it go; review_* columns cleared at Let it go step 1.
- Deletion path: removeBook; removeEverything.
- Tests: migrations, migrations.v9, store.capture-v6.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| id (pk) | TEXT | no |  | L3 | future letter id |
| child_id | TEXT | no |  | L3 |  |
| capture_mode | TEXT | no |  | L2 |  |
| prompt_key | TEXT | yes |  | L2 |  |
| created_at | TEXT | no |  | L2 |  |
| audio_uri | TEXT | yes |  | L3 | path to L4 audio |
| audio_duration_ms | INTEGER | yes |  | L2 |  |
| raw_transcript | TEXT | yes |  | L4 |  |
| typed_text | TEXT | yes |  | L4 | the only copy of typed words until Keep |
| state | TEXT | no | 'ready' | L2 | recording, ready, unrecoverable, discarding |
| audio_sha256 | TEXT | yes |  | L4 |  |
| audio_bytes | INTEGER | yes |  | L2 |  |
| recovered_at | TEXT | yes |  | L2 |  |
| kind | TEXT | no | 'letter' | L2 | note or letter (v6) |
| occurred_on | TEXT | yes |  | L3 | chosen day (v6) |
| occurred_precision | TEXT | no | 'day' | L2 | (v6) |
| language | TEXT | yes |  | L4 | take language (v6) |
| base_direction | TEXT | no | 'ltr' | L2 | (v6) |
| held_kind | TEXT | yes |  | L2 | held_letter or held_words (v8) |
| in_book_choice | INTEGER | yes |  | L2 | (v8) |
| held_v | TEXT | yes |  | L2 | (v8) |
| held_typed | TEXT | yes |  | L4 | typed words as the server last had them (v8) |
| review_put_back | TEXT | yes |  | L4 | machine fixes the person put back (v9); never synced |
| review_view | TEXT | yes |  | L2 | fixes or exact (v9) |
| review_text | TEXT | yes |  | L4 | person's own words from Change words (v9) |
| review_base | TEXT | yes |  | L4 | hash of the words those choices were made on (v9) |

### scribe.db: orphan_audio (3 columns, added in v3)

- What: Recordings found with no draft or letter while no book exists. Reported, never deleted by the app.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Until a book exists and the file is attached, or Erase everything.
- Deletion path: removeEverything; the file by eraseDeviceFiles.
- Tests: migrations, erase-all.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| file_name (pk) | TEXT | no |  | L3 | recording file name (holds a letter id) |
| bytes | INTEGER | yes |  | L2 |  |
| found_at | TEXT | no |  | L2 |  |

### scribe.db: sync_outbox (11 columns, added in v4)

- What: Ordered upload queue. payload is the op as sent.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Until sent and confirmed.
- Deletion path: removeBook (wipe.ts:109); removeEverything.
- Tests: migrations, sync tests.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| seq (pk) | INTEGER | no |  | L2 | order |
| op_id | TEXT | no |  | L2 | UUIDv7 |
| lane | INTEGER | no | 1 | L2 | priority |
| type | TEXT | no |  | L2 | op enum |
| entity_id | TEXT | no |  | L3 | letter or book id |
| book_id | TEXT | yes |  | L3 |  |
| payload | TEXT | no |  | L4 | the op as sent; can hold letter text; never logged |
| created_at | TEXT | no |  | L2 |  |
| attempts | INTEGER | no | 0 | L2 |  |
| next_attempt_at | TEXT | yes |  | L2 |  |
| sent_at | TEXT | yes |  | L2 |  |

### scribe.db: rejected_writes (7 columns, added in v4)

- What: Ops the server refused for good (DATA-REQ-043), kept with their SQLSTATE.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Until the person has seen it and the book goes; no age sweep [U].
- Deletion path: removeBook (wipe.ts:110); removeEverything.
- Tests: migrations.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| op_id (pk) | TEXT | no |  | L2 |  |
| type | TEXT | no |  | L2 |  |
| entity_id | TEXT | no |  | L3 |  |
| payload | TEXT | no |  | L4 | the refused op |
| code | TEXT | no |  | L2 | SQLSTATE |
| rejected_at | TEXT | no |  | L2 |  |
| seen_at | TEXT | yes |  | L2 |  |

### scribe.db: sync_books (8 columns, added in v4)

- What: One row per book this phone pulls.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: While the book is on the phone.
- Deletion path: removeBook (wipe.ts:114); removeEverything.
- Tests: migrations.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| child_id (pk) | TEXT | no |  | L3 |  |
| cursor | TEXT | yes |  | L2 | server position |
| access | TEXT | yes |  | L3 | access signature of my membership |
| meta_hash | TEXT | yes |  | L4 | hash of book settings (name, dates) |
| members | TEXT | yes |  | L3 | person ids, roles, signatures |
| birthday_md | TEXT | yes |  | L4 | birthday month and day shown to contributors (D-039) |
| state | TEXT | no | 'live' | L2 | live or an end state |
| want_ids | INTEGER | no | 0 | L2 |  |

### scribe.db: child_member_prefs (6 columns, added in v7)

- What: My settings for each book; one account per install.
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: While the book is on the phone.
- Deletion path: removeBook (wipe.ts:113); removeEverything.
- Tests: migrations.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| child_id (pk) | TEXT | no |  | L3 |  |
| signs_as | TEXT | no | '' | L3 | what this child calls me (v7) |
| reminders_on | INTEGER | no | 1 | L2 | (v7) |
| hidden_at | TEXT | yes |  | L2 | hide for me (v7) |
| quiet_at | TEXT | yes |  | L2 | quiet for me (v7) |
| updated_at | TEXT | no |  | L2 |  |

### scribe.db: agreements (10 columns, added in v10)

- What: The Terms and Privacy accept made at Before you begin, kept until it is uploaded. No age column, ever (D-026).
- Read and write: the app process only (repositories in `apps/mobile/src/lib/db/repos` and `store.ts`). No server role touches this table. It is inside the iOS device backup and the recovery export (see 01b).
- Retention: Kept after upload as the local record [U].
- Deletion path: removeEverything.
- Tests: migrations, age-gate-erase.

| Column | Type | Null | Default | L | Note |
|---|---|---|---|---|---|
| id (pk) | TEXT | no |  | L2 | UUIDv7 |
| document | TEXT | no |  | L2 | terms or privacy |
| version | TEXT | no |  | L2 |  |
| action | TEXT | no |  | L2 | accept or acknowledge |
| surface | TEXT | no |  | L2 |  |
| recorded_at | TEXT | no |  | L2 | device time of the tap |
| app_version | TEXT | no |  | L2 |  |
| rendered_sha256 | TEXT | no |  | L2 | hash of the sentence shown |
| uploaded_at | TEXT | yes |  | L2 | null until record_policy_act returned |
| server_act_id | TEXT | yes |  | L2 | policy_acceptances.id |

## Gaps found in this file

- G-1b `DATA_CLASSIFICATION.md` 4.5 states schema version 4. It has no rows for `child_member_prefs` (v7), `agreements` (v10) or the columns added in v5 to v9 (for example `drafts.review_put_back`, `drafts.held_typed`, `entries.language`). The levels above come from the comments in `migrations.ts`, which say the doc needs a row (`migrations.ts:16`). BL-960 carries the update; the founder merges `docs/legal`.
- G-19 `children.signs_as` and `children.reminders_on` stay as mirrors until a later schema version (`migrations.ts:290-300`); both are read by the app only from `child_member_prefs`. A second copy of L3 data; removal is a future migration.
- G-20 `rejected_writes` and `agreements` have no age sweep on the phone [U: not found; the repos were not read in full].

## Questions for the council

- Q-g1 (CPO-privacy) Is the iOS device backup of `scribe.db` accepted for v1.0? Default: yes, as ADR 0028 D1 and `DATA_CLASSIFICATION.md` 4.5 assume, and the settings screen says so in plain words (words are `content`'s).
- Q-g2 (CISO) SQLCipher before launch? Default: not decided here; LEGAL-REQ-022(d) stays open for the founder.
