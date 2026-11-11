# ADR 0028: On-device data for Photo with a letter, the sealed letter and Find

- **Status:** Proposed. Docs only. No migration file is written here and nothing is applied anywhere. Every `supabase/**` change below is a proposal for a later PR that needs red-team review and the founder's `approve-migration` label (D-041, DB-R11); the founder applies hosted-project changes through CI on a tag.
- **Author:** `data-architect`. Reviewers asked: `mobile` (owner of PR #796), `sync`, `privacy`, `security-architect`, `qa`, `product`.
- **Number:** 0028 is the next free number on `develop` at `da83fb1ee` and on every remote branch I listed. The PRD for Photo with a letter (PR #795) and PR #796's code comments cite "ADR 0027" for the export bump; 0027 is the kill-safe recording container, so those citations should read 0028. The coordinator may renumber.
- **Labels:** [R] repo fact read this session, [P] a proposal of this ADR, [U] unverified: not run, not read, or depends on a device or library I did not open.
- **Inputs:** PRD NS-01 (PR #795, `docs/product/prd/01-photo-with-a-letter.md`), NS-02 Find, NS-06 Part B sealed letter (same PR); PR #796 at head `f73c518c` (`apps/mobile/src/lib/photos/*`); `apps/mobile/src/lib/db/migrations.ts` (latest version 9) [R]; `apps/mobile/src/lib/export/{schema,pack,build.logic}.ts` (`EXPORT_SCHEMA_VERSION = '1.6.0'`, `photo: null`, `photos: 0`) [R]; `supabase/migrations/20260930000000_scribe_core.sql` and `20261016000000_sync_v1_server.sql` [R]; ADR 0025 (sync); `docs/engineering/03-database-and-schema.md`, `04-data-quality-and-lifecycle.md`.
- **Not run:** no app, no device, no database test, no FTS5 build. Disk is tight, so I installed nothing. Every claim about FTS5 or `expo-file-system` behaviour is [U].

## Context

Photo with a letter keeps one stripped picture per letter on the phone only. Sync keeps `entries.photo_path` null (NS-01-R15). The mobile engineer is blocked on three decisions (the phone table, the export bump, the server write-deny test) and Find and the sealed letter need answers that touch the same tables.

Facts that shape the answer [R]:

1. The server already has an `entry-photos` bucket with author insert, update and delete policies, and an `entries.photo_path` column that a client may set to a valid path of its own entry. Nothing in the server today refuses a photo upload. "Photos never leave the phone" is therefore a promise kept only by the app. That is the gap BL-870 closes.
2. Erase everything (`wipe.removeEverything`) deletes every row of every table named in `sqlite_master`. A SQLite FTS5 virtual table has shadow tables (`<name>_data`, `_idx`, `_content`, `_docsize`, `_config`); deleting rows from shadow tables by hand corrupts the index [U: SQLite FTS5 documentation, not re-opened]. The index must be dropped, not row-deleted.
3. `PRAGMA secure_delete` is already on for the phone database (`store.ts` `SECURE_DELETE_VACUUM_SETTING`) [R].
4. The device schema changes only by versioned migrations (DB-R25).
5. The export's golden files keep one frozen folder per earlier minor (`_v1.0.0` to `_v1.5.0`) [R].

## Decisions

### D1. The phone table: `entry_media` (migration 10) [P]

One new local migration, version 10, in `apps/mobile/src/lib/db/migrations.ts`. It adds a table only; no existing row changes; nothing is queued to the sync outbox (same shape as migration 9).

```
entry_media
  id           TEXT PRIMARY KEY      media id, UUIDv7 made on the phone                    L2
  entry_id     TEXT                  the kept letter; null while only a draft owns it      L2
  draft_id     TEXT                  the draft; null once kept                             L2
  kind         TEXT NOT NULL         CHECK (kind = 'photo')   (video is not in Build 13)   L1
  ext          TEXT NOT NULL         CHECK (ext = 'jpg')                                   L1
  bytes        INTEGER NOT NULL      size of the stripped copy                             L1
  sha256       TEXT NOT NULL         of the stripped copy; a hash of a picture is L4       L4
  width        INTEGER, height INTEGER                                                     L2
  photo_text   TEXT                  the parent's own words, CHECK (length <= 140)         L4
  place        TEXT                  typed by the parent, CHECK (length <= 60)             L4
  added_at     TEXT NOT NULL                                                               L2
  CHECK ((entry_id IS NULL) <> (draft_id IS NULL))
INDEX entry_media_entry_idx ON entry_media (entry_id) WHERE entry_id IS NOT NULL
INDEX entry_media_draft_idx ON entry_media (draft_id) WHERE draft_id IS NOT NULL
UNIQUE INDEX entry_media_one_photo_idx ON entry_media (COALESCE(entry_id, draft_id))
```

Decisions inside it:

- **Class.** The picture itself is L4 (a child's image; `DATA_CLASSIFICATION.md`), the typed text and place are L4 (the parent's words), the ids and sizes are L2. `privacy` confirms; I label the columns in the migration comments in the same PR, as migration 9 does.
- **No `deleted_at` on the row.** PR #796's `StoredPhoto.deletedAt` copies a state the letter already owns. A copy can drift (letter restored, photo still hidden). The row is hidden whenever its letter's `entries.deleted_at` is set, by join; restore needs no photo write. The `PhotoStore` adapter maps `deletedAt` from that join. If the mobile engineer prefers the field, the adapter must still derive it, never store it. Default: derive.
- **File path is `Documents/photos/<media_id>.jpg`, not `<entry_id>/<media_id>.jpg`.** A draft is kept by changing the row's owner in one transaction (`draft_id` to `entry_id`); the file never moves, so a kill at Keep cannot leave a file under the wrong folder. The folder in the export is derived (D2). [U: whether a draft id equals the entry id at Keep; I did not read `drafts.ts`. If it does, either path works and the engineer may keep PR #796's.]
- **One picture per letter** is the unique index, not the table shape. Build 13 caps at one; a later multi-photo build drops that one index in its own migration (no table rebuild).
- **Backup.** The folder is not excluded from the iPhone backup (NX-39 F9 default: pictures in the backup) [U: no `expo-file-system` exclusion call is made, so the default of the platform applies]. The owner backup of ADR 0024 does not carry pictures in Build 13 (audio only); `privacy` words that plainly.

Kill-safety order, each step safe to repeat: (1) write the stripped copy to `Documents/photos/<id>.jpg.part` and rename; (2) in one transaction insert the row; (3) at launch a sweep deletes any `.part`, any file with no row older than one day, and any row whose file is missing (the letter then reads whole with no picture, no message, OQ-2 default). A cancelled pick writes nothing (NS-01-R4).

Sync: `enqueueEntryUpsert` and the pull merge never read or write `entry_media`, and the push mapper always sends `photo_path: null` (NS-01-R15). Pull must not overwrite a local row. Test below.

Migration plan: migration 10 ships with photos. If Find (D4) and the seal (D3) migrate in the same train, they take 11 and 12 in merge order; two open PRs must never both claim a number, so the later one renumbers on rebase. A phone that has a newer version than the app (downgrade) is refused by the existing migrator.

### D2. Export schema 1.7.0 and the golden plan [P]

- `EXPORT_SCHEMA_VERSION` becomes `'1.7.0'`: a minor, additive. Rule from the file's own header: each v1 minor reads every earlier v1 file; read an export with the schema it carries.
- `ExportEntry.photo` changes from `null` to `ExportPhoto | null`:
  `{ file: string; bytes: number; sha256: string; width: number; height: number; text: string | null; place: string | null }`. `file` is `photos/<entry_id>/<media_id>.jpg` inside the ZIP [U: the exact path NX-39-R32 names; I did not open NX-39. Default: this one, and `product` corrects it in one line if R32 differs].
- JSON schema (`export-v1.schema.json`): `photo` becomes `oneOf [null, object]` with `additionalProperties: false` on the object. The 1.6.0 schema stays in `_v1.6.0` untouched, so an old file still validates.
- `counts.photos` = the number of photo files written, never including letters in Recently deleted (they are not exported, NS-01-R14) and never a letter that fails to export. The manifest `files` list gains each photo with its sha256, and `verify.ts` checks them exactly as it does audio. A missing or mismatched photo file is reported like `audio_missing` and `audio_mismatch`; Build 13 adds `photo_missing` to `counts` only if `product` wants it [default: no, a missing file simply writes `photo: null`].
- Words never change: the export for a letter with and without a picture has a byte-identical `final_text` and `text_file`. Photo text and place are exported (they are the parent's words; NS-01-R21).
- A sealed letter's picture is exported with the letter (the words are on the phone; NS-06-B5). The `sealed_until` field itself is a separate additive minor, 1.8.0, shipped with the seal build and not before.
- No original bytes, no "originals" option, no metadata segment: the export test scans every photo for Exif, XMP and IPTC markers (NS-01-R6).

Golden fixture plan (fictional family "Asha" only; no real photo is ever a fixture):

1. Before the bump, copy today's top-level golden to `__golden__/export-asha/_v1.6.0/` (frozen, never edited).
2. Add `apps/mobile/test/helpers/asha-photo.ts`: a generated 8 by 8 JPEG built in code (a flat grey with a JFIF header only) plus a second fixture, a JPEG with planted Exif GPS, XMP and IPTC segments, to prove the strip. The stripped output of the second must equal a stored hash.
3. `ashaSnapshot` gets one letter with a picture (text "Asha and the rain boots", place "the back step"), one letter without, one with a picture in Recently deleted (must not appear).
4. Regenerate the top-level golden with `npx vitest run -u` in `apps/mobile`, then review the diff by hand: only `format_version`, the one letter's `photo`, `counts.photos: 1`, the manifest `files`, `_files.txt`, `README.txt` and the schema file may change.
5. Tests, all new, each titled with its id: `[NS-01-R14] export carries the stripped copy only`, `[NS-01-R6] 0 of 10 stored files carry metadata` (extended to the export bytes), `[DATA-REQ-050] 1.6.0 file still validates against the 1.7.0 reader`, `[DATA-REQ-051] 1.7.0 file validates against its own schema`, `export of a photo letter has byte-identical words`.

The export stays readable without the app (README.txt and `index.html` link the picture; `content` words the line).

### D3. The sealed letter: should a seal sync? [P]

Recommendation: **the seal date syncs; the seal is a display rule on the author's own phones; and no other person's phone receives a sealed letter's words until the day.** Build 15 at the earliest, behind the five-parent study (NS-06 OQ-B1); nothing here is built before then.

Why not the two simpler answers:

- A seal that stays on one phone fails the author on their second phone: the sealed letter appears open there, which breaks the promise the parent made (NS-06-B8 says no build if it cannot sync).
- A seal that syncs only as a date, with the words still pulled to a co-parent's phone, is a lock that is not a lock: the words sit in that phone's database. NS-06-B5 already forbids the words "locked" and "secure"; the data should match the copy.

Design:

- **Server:** one nullable column `entries.sealed_until date` (a calendar date, like `occurred_on`, no time zone), additive, L3 (the date a parent chose; `privacy` confirms). Author-only write. A trigger enforces the rules the PRD states: it can be set only to a date later than today when the letter is kept or sealed from the letter page, can be cleared by the author (Open now), and once cleared or passed it cannot be set again (needs a second column or a ledger fact; proposed `sealed_opened_at timestamptz`, set by the trigger, never by the client).
- **Visibility:** the one visibility predicate (`book_access`, D-024, DB-R23) gains a rule: a reader who is not the author sees the row only when `sealed_until is null or sealed_until <= current_date` evaluated in UTC plus one day of grace, so the server never opens a letter earlier than any time zone. Until then the sync pull returns no row for the other reader at all (the same way held drafts are author-only rows, ADR 0025). The author's phones receive the row whole and hide it by the date.
- **Cost:** a co-parent's phone learns nothing about a sealed letter, including that it exists. That is stronger than the PRD text ("the seal date travels with the letter so the other parent's phone hides it too") and it needs no honest-limits sentence for a co-parent. [U: the sync engine's pull cursor must not stall on a row it may not return; `sync` owns that proof. Open on the day: the row must enter the other reader's pull via the existing `server_seq` bump, so a nightly touch (or a bump when the date passes) is needed. This is the hard part and the reason the default is "not before Build 15".]
- **Export:** a sealed letter is exported whole with `sealed_until` (1.8.0), for its author only. Another person's export never contains words they cannot read.
- **Find:** a sealed letter is not in the index until its day (D4).
- **Photos:** a picture on a sealed letter is not shown or counted by the Photos lens until the letter opens (NS-01-R10). The file stays on the phone.
- **Erase and delete:** a sealed letter deletes and purges like any letter; the seal does not extend the 30-day window.
- **Allowance:** a sealed letter counts when kept (NS-06-B7). The seal is not a Plus feature.
- **Tests (written when built, listed so the design is checked now):** author reads own sealed row; other member reads 0 rows; other member's pull returns 0 rows and an advancing cursor; day arrives, other member gets the row; author clears; re-seal refused; a past date refused; client cannot set `sealed_opened_at`; purge works on a sealed row.

Default if nobody decides: **do not build the seal.** If the founder wants it, the default design is the one above. Founder-only parts: whether to build at all, whether an author may hide a letter from the other parent (NS-06 OQ-B2; counsel on minors and "open at 18").

### D4. Find index: storage and lifecycle [P]

- **Where:** an FTS5 virtual table `letter_search` inside `scribe.db` (one file, one lock, iOS Data Protection covers it, `secure_delete` already on). Not a second database file.
- **Shape:** its own content (not external-content), columns `body` (the `final_text` as kept) and `extra` (the parent-typed Firsts label, photo text and typed place), tokenizer `unicode61 remove_diacritics 2` [U: present on SDK 57's SQLite; `enableFTS` in the config plugin is a native change that needs an EAS build, per NS-02]. Plus a one-row-per-letter map `letter_search_rows (entry_id TEXT PRIMARY KEY, row_id INTEGER UNIQUE)`, because `entries` has a TEXT key and its implicit rowid can change on VACUUM. If the tokenizer cannot fold accents (NS-02-R7), index a folded copy in `extra`; the fallback substring scan (NS-02-R19) stays.
- **Never in the index:** `raw_transcript`, audio-derived text, a date or place read from a picture, the child's name, a query. The query is never stored.
- **One predicate.** A SQL view `searchable_letters` returns the letters that may be found right now: in the active child's book; `deleted_at is null`; the book not hidden for this person; (own letters, including own private) or (another author's letter that is in the book and not private); `sealed_until is null or sealed_until <= today` (local calendar date). `reindexLetter(entryId)` runs inside the same transaction as every letter write: delete the letter's index row, then insert from `searchable_letters` if it is there. One function, one view, so the lifecycle table below cannot drift.

| Event | Index effect | When |
|---|---|---|
| Keep, Review edit, Undo of a small fix, photo text or place edit | upsert | same transaction |
| Delete (to Recently deleted) | terms removed | same transaction |
| Restore | terms added back | same transaction |
| Purge (30 days, or Delete now) | terms removed (already gone) and map row removed | same transaction as the purge |
| Hide (a book or a letter, for me) | terms removed; unhide adds back | same transaction |
| Seal set | terms removed | same transaction |
| Open now, or the day arrives | terms added | Open now: same transaction. Day arrives: `indexOpenedSeals(today)` at launch and on foreground; also covers a time zone change |
| Another author's letter becomes private (synced) | terms removed; public again adds back | in the sync merge transaction |
| Letter synced in from another phone | upsert if visible | in the sync merge transaction |
| Erase everything, Delete account | index dropped, not row-deleted | see D5 |

- **Physical removal.** FTS5 deletes add markers; old segment bytes can remain until a merge [U: SQLite FTS5 documentation, not re-opened]. After any removal event the app runs the FTS5 `optimize` command within 24 hours, off the first frame, at idle (PROPOSED number; `privacy` may tighten). `secure_delete` zeroes freed pages. Honest limit, stated plainly in the PR: "not found" is immediate; the bytes are gone at the next merge; the file is under iOS Data Protection either way. If the FTS5 `secure-delete` option exists in the SDK 57 SQLite [U], turn it on and the 24 hour line can go.
- **Rebuild.** The index is derived and can always be rebuilt from `entries` and `entry_media` (NS-02-R19). A missing or older index never blocks Keep. Rebuild runs after migration 11 and after any integrity check failure (`INSERT INTO letter_search(letter_search) VALUES('integrity-check')` [U]).
- **Never leaves the phone:** not synced, not in the export, not in the owner backup, not in the recovery export. The owner backup and recovery export builders are allowlists today for what they carry [U: I did not read `backup/format.ts` to the end]; a test asserts no `letter_search*` table name appears in either (below). The iPhone's own device backup includes `scribe.db` and therefore the index; that is the same exposure as the words themselves and is L4 on the phone.
- **Class:** `letter_search.body` and `.extra` are L4 (parent's words), `letter_search_rows.*` L2. Added to `data-policy.md` section 4 by the build PR; `privacy` confirms.
- **Budget:** 1,200 letters, index file at most 10 MB, one search adds at most 50 MB peak memory (NS-02-R20, PROPOSED). I did not measure. `qa` owns the device run.

### D5. Delete, erase everything, delete account [P]

- **Delete a letter.** The picture file and `entry_media` row stay while the letter is in Recently deleted (hidden by join). Purge removes the file first, then the row, then the index row, in that order, so a kill leaves a row without a file (swept, harmless) and never a file without a row that anything can reach. This matches PR #796's `purgePhotoWithLetter`; Let it go on a draft does the same for `draft_id` rows.
- **Erase everything.** Order: (1) the pending mark (exists), (2) delete every file under `Documents/photos` by listing the folder, not by reading rows, so strays go too (PR #796 `wipeAllPhotos` does this), (3) **`DROP TABLE letter_search` before `removeEverything` runs**, because that function deletes rows of every table in `sqlite_master` and would delete the FTS shadow tables' rows directly, which corrupts the index [U: confirm on SDK 57]; (4) `removeEverything` (it clears `entry_media` and `letter_search_rows` as ordinary tables), (5) `compactAfterErase` (VACUUM, exists), (6) the index is recreated empty at the next launch by `ensureSearchIndex()`, which is not a migration. The mark makes every step safe to repeat after a kill. Erase works with the photos and Find switches off (NS-01-R19).
- **Delete account (signed in).** The server has no picture, so there is nothing to purge there; the existing storage purge queue for `entry-photos` stays as a safety net. The phone side is the same as Erase everything and runs when the parent erases the phone; the account flow does not claim to have removed pictures from a phone it cannot reach (`content` words that, as for audio on other phones today).
- **Server-side photo copies, if any.** If the production check in D6 finds objects in `entry-photos`, they are legacy test data; they go through the existing deletion worker, not a manual delete (DB-R09, SEC rules).
- A purged id never returns (DB-R19). A picture row for a purged letter cannot be created because the letter id is refused at insert.

### D6. BL-870: the photo-bucket write-deny, as a server change and a test [P]

Today an author can insert into `entry-photos` (`entry_photos_author_insert`) and update (`entry_photos_author_update`), and can set `photo_path` [R]. To make "photos never leave the phone" true by construction:

1. **New migration (not written here):** drop `entry_photos_author_insert` and `entry_photos_author_update`. Keep `entry_photos_author_delete` and `entry_photos_read` so the purge path and any legacy object still work. Add a trigger `entries_15_photo_closed` (named per DB-R04) that, for client roles, refuses a non-null `photo_path` on insert and update with a typed SQLSTATE (proposed `SCPHO`, to be added to the error-code list with `sync`). `service_role` and the deletion worker are unaffected. Because the column has never been written by a shipped app [U: unverified on the hosted projects; I may not read production], the migration does not touch existing values; a founder-run read-only count of non-null `photo_path` and objects in `entry-photos` is the check before the tag.
2. **Contract:** `packages/api/src/server/sync.ts` currently types `photo_path` as `v.nullish(str)`; `sync` narrows it to null on push (request to `sync`; I do not edit it).
3. **No new object** is created, so `supabase/tests/grants.mjs` does not change. No column is added, so the classification test is unaffected.
4. **Tests, new file `supabase/tests/photo_bucket_closed.test.mjs`** (deny cells first, then the allow cells that must keep working):
   - deny: author insert into `entry-photos` under their own `{child}/{author}/` folder; same under another author's folder and another family's; a non-member; `anon`; each refused.
   - deny: author update of an existing object; deny: `update entries set photo_path = '<valid own path>'` refused with `SCPHO`; deny: the sync push RPC with a non-null `photo_path`, refused.
   - allow: `photo_path = null` writes pass; author select of own legacy object; author delete of own object; the deletion worker and `service_role` purge of `entry-photos` (queue row consumed); a purged entry still queues its photo prefix.
   - The existing tests that upload as the author (`access_matrix.test.mjs` lines 56 and 395, `data_governance.test.mjs` lines 44 and 113) set up an object as the author; they must switch to the system role to create the legacy object, or they fail. That is the one place an old test changes, and it is a setup change, not a loosened assertion (AIE-R12): the same read and delete cells still run.
   - RLS rule: every changed policy has an allow and a deny cell in `access_matrix` (DB-R12); the new file is listed in `run.mjs`.
5. Review: red-team review, `approve-migration` from the founder, `npm run test:db` green. I will say so in the PR body that carries it.

The mobile engineer does not wait on this for the feature: the client-side half of the promise is testable now (the mapper sends null; no upload code exists; a grep test asserts `entry-photos` appears nowhere under `apps/mobile/src`). The server half is the defence in depth.

## Tests required (summary)

Phone (`apps/mobile/test`, node SQLite helper):
- `migrations.v10.test.ts`: version 10 is the latest; table and indexes exist; a v9 database with a letter, a draft and an outbox row is byte-identical after; nothing queued; CHECKs refuse a long text or a second photo for one letter; one of `entry_id` or `draft_id` only.
- Keep moves a draft's picture to the letter in one transaction; a kill between steps (simulated) leaves one consistent state; the sweep removes strays and `.part` files.
- Delete, restore, purge, Let it go and Erase everything for letter and picture (PR #796's lifecycle tests, against the real adapter).
- `[NS-01-R15]` sync: a letter with a picture pushes `photo_path: null`, uploads 0 bytes, and a pull never changes `entry_media`.
- Export: D2's list. Backup: no `entry_media` bytes and no `letter_search*` table in the owner backup or recovery export.
- Find: one test per row of the D4 lifecycle table; day-arrives and time-zone-change cases; erase drops the index and a relaunch recreates it empty; index and fallback agree on the fixtures (NS-02-R19); `raw_transcript` is never indexed; a purged id never returns.
- Class labels: every new column carries its L-level in the migration comment (the local equivalent of the server classification test; `qa` is asked to add a mobile check that fails on an unlabelled new column).

Server (`supabase/tests`): D6 item 4; for the seal, the list in D3 when it is built.

## Consequences

- The mobile engineer can start the device adapter against D1 now. Changes to PR #796: `photoPath` is by media id; `StoredPhoto.deletedAt` becomes derived; `draftId` joins the type.
- `lib/export` changes in one PR (schema, pack, build.logic, verify, goldens, JSON schema), under the 400 line limit only if the golden diff is counted separately; split the golden regeneration into its own commit (CODE-R01).
- One server migration (D6) and, much later, one for the seal, both founder-gated.
- Cost: the unique index and the derived deleted state mean a small join on every picture read. At one picture per letter and 1,200 letters this is not a budget risk [U: not measured].

## Alternatives considered

- Store the picture as a BLOB in `scribe.db`: rejected; it bloats the database and its VACUUM and backup cost, and the file is easier to erase and sweep.
- Put `photo_path`, `photo_text` and `place` on `entries`: rejected; it fixes one picture per letter into the synced table's shape and invites the sync mapper to carry them.
- External-content FTS5 table: rejected; the delete path needs the old values, and visibility is not a column.
- SQL triggers for the index: rejected for the seal and hide cases, because visibility changes with the date, not with a row event. One function plus a launch catch-up is simpler to test.
- Server-enforced seal only for the author's phones: that is the default above; the stronger "no row at all for others" is chosen because a display rule cannot honestly protect words that already sit on another phone.

## Open questions (each has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| Q1 | Row hidden by join, or a stored `deleted_at` on `entry_media`? | `mobile` with me | Join (derived). | Before the adapter is written |
| Q2 | File path by media id, or `<entry_id>/<media_id>`? | `mobile` | Media id (no move at Keep). | Same |
| Q3 | Export path of the picture inside the ZIP | `product` (NX-39-R32) | `photos/<entry_id>/<media_id>.jpg` | Before the export PR |
| Q4 | Does the owner backup carry pictures? | `privacy`, founder | No in Build 13; the iPhone backup does. | Build 13 freeze |
| Q5 | Is `optimize` within 24 hours enough, or must removal be immediate? | `privacy` | 24 hours, at idle. | Find build |
| Q6 | Do we build the sealed letter, and may an author hide a letter from the other parent? | Founder with counsel | Not built. | Fri 20 Nov 2026 (NS-06 OQ-B1) |
| Q7 | Does the server refuse a non-null `photo_path` for clients (D6)? | Founder (migration) | Yes, in the next migration PR. | The next migration train |
| Q8 | Production check: any `entry-photos` objects or non-null `photo_path`? | Founder (read-only) | Assume zero; the migration touches no value. | Before the tag |

## Founder-only versus mine

Founder-only: applying any migration to a hosted project (D6, later the seal); the `approve-migration` label; whether to build the sealed letter and whether an author may hide a letter from the other parent (Q6); the production read-only count (Q8); any spend; legal wording of the seal, minors and "open at 18" (counsel).
Mine, decided here unless overruled: D1 table shape, D2 export bump and golden plan, D4 index storage and lifecycle, D5 erase order, the tests list, the numbering. Not mine, requested: `sync` narrows `photo_path` (D6.2); `privacy` confirms classes and the backup line; `qa` the mobile class-label check and the device budget run; `content` the parent-facing words.

## Sources

Repo files named in Inputs, read at `da83fb1ee` and PR #796 head `f73c518c`. External documentation (SQLite FTS5, `expo-sqlite`, `expo-file-system`) was not re-opened this session and is marked [U] where it matters.
