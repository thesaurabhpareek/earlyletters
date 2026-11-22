# X5 Moments tab: data model, classification, retention and the server boundary

Status: PROPOSED. Docs only. Nothing here is decided, built, migrated or recorded in `DECISIONS.md`.
Lead: X5 (data), for the Moments tab programme. Date: 21 Nov 2026. Voice of the data architect.
Written for the founder, `privacy`, `mobile`, `sync`, `analytics`, `legal` and counsel.
Fictional family Asha only. No real name, place, face or business from the founder's screenshots is used or described here.
No migration is written. Where one would be needed, section 11 says so and stops.

## 0. The short answer

1. Almost everything the Moments tab knows stays on the phone and goes nowhere: library signals, candidate moments, dismissals and ranking state. No server table is added for any of it. There is no server table for safety tiers either (CLAUDE.md privacy rules), and none for library signals.
2. Nothing new reaches the server because of this tab. What the server already knows is unchanged: the child's date of birth (L4), letters (L4), `child_member_prefs.include_in_reminders` (L2). The tab adds no column, no table, no RPC, no sync op and no export field.
3. The brief says typed occasions and Days "the parent already entered" may reach the server. They do not today. Typed days live in the phone `settings` table, ticked Days live in their own device file outside the backup, and both are never synced (NS-47-R6, NS-46-R3, E94). A ticked Day can reveal a tradition, so I recommend they never go to the server. Where this document says "may reach the server", the answer is: only what already does, and I recommend nothing more.
4. Email can use only what the server legitimately knows: the child's date of birth, letters made, and the account email. It cannot use typed days or Days either, because the server has never seen them. At 1.0 there is also no marketing email to app addresses at all (E75). A Moments email is therefore a reversal of E75 the founder owns, and it needs a new table and function (section 11).
5. Push stays local. A server push would need a device token store that does not exist. Everything a push could say from server facts, the phone can say itself from the date of birth it already holds. No remote push is recommended.
6. The analytics answer is "almost none". The ten V6 keys are a list of SDK `$` properties, not event names. A Moments screen view and one click on the ask button fit the content-free basics. A "moment shown", "access granted" or "limited" event does not fit, because it states a fact about the library (section 8).
7. A real conflict is in the repo and I record it, I do not settle it: ML-4 ("no asset id or derived value kept") against NS-51-R6 as amended by E37 (up to 30 moments, each with up to 6 identifiers, L4). Section 4 gives a recommended way out that stores no library identifier at all.

## 1. Purpose and scope

In scope: the data model of the Moments tab (For you and Recent), on the phone and at the server boundary; classification of every field against `docs/legal/DATA_CLASSIFICATION.md`; retention, deletion and revoke behaviour; analytics; export; sync; the data an email or push may use; migration needs.

Out of scope: the visual design, the tab position, the words (all other leads); the legal reading of Apple's rules (`legal`, counsel); the Route A picker module (X5 only classifies what comes back).

Two routes, as in the brief. Route A (Apple's picker) returns data only after a pick; Route B is our own on-device read. This document designs for both and says which fields exist in each.

## 2. Inputs read

Read this session in a plain clone of `develop` (head `fb295076`) unless noted. Pull requests were read through `gh api` contents of their branches.

| Id | Path or source | Used for |
|---|---|---|
| I1 | `/home/claude/moments-brief.md` | Scope, work rules, decisions of record |
| I2 | PR #1267, `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` (branch `docs/privacy-moments-tab-21nov`) | Apple sources A1 to A9, element table, CQ-1 to CQ-15, reversals |
| I3 | PR #1264, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` (branch `docs/product-home-engagement-wheel-21nov`) | What exists by id (NS-46, NS-50, NS-51, ML-4, ML-13, ML-14) |
| I4 | PR #1269, `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` (branch `docs/mobile-moments-tab-feasibility-21nov`) | Route A and B mechanics, index store note (its 2.4), nudge design (its 5.4) |
| I5 | `docs/engineering/PRINCIPLES.md`, `03-database-and-schema.md` (DB-R01 to DB-R25), `04-data-quality-and-lifecycle.md` (DQ-R01 to DQ-R13) | Data rules |
| I6 | `docs/legal/DATA_CLASSIFICATION.md` sections 1, 4.5, 4.7, 4.8 | Levels and the device inventory |
| I7 | `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ-001, -002, -047; lines 255 to 259 on device wipe) | Deletion and export |
| I8 | `docs/product/prd/27-photo-moments-and-media.md` (NS-51-R5, R6, R12, R15, R16, R23, R26, R30) and `18-errata-after-lock.md` (E37, E94) | The index and its rules |
| I9 | `docs/product/prd/21-days-cultural-photos-home.md` (NS-46, NS-47-R6) and `09-capture.md` (NS-18-R1 to R7) | Typed and ticked Days |
| I10 | `docs/adr/0028-photo-seal-find-on-device-data.md` (D1 `entry_media`) | Device table shape and level of each field |
| I11 | `apps/mobile/src/lib/db/migrations.ts` (versions 1 to 11) | Phone schema as it is |
| I12 | `supabase/migrations/20260930000000_scribe_core.sql`, `supabase/tests/grants.mjs`, `.github/migrations-applied.txt` | Server shape and the grants list |
| I13 | `docs/analytics/instrumentation/ENGINEERING-REQUIREMENTS-21nov.md` (ER-A06, ER-B02) and `docs/BACKLOG.md` BL-1235 | The ten `$` keys and the event tiers |
| I14 | `docs/product/prd/22-final-holistic-spec.md` (E75 marketing email) | Email position |

Not read: PR #1215 (export spec 4.2, BL-868), PR #1270 and #1271 (design and content for Moments), `docs/legal/data-policy.md`, `docs/legal/app-store-privacy-labels.md`, and `docs/design/NOTIFICATIONS.md` in full. The brief names ML-3 and ML-6; I did not find those ids as written rows either (the same finding as I2). I use NX-39 ruling 3, NX-39-R16 and ML-4 where they are the nearest text.

## 3. Where each kind of data lives

| Kind | Examples | Lives | Server |
|---|---|---|---|
| Library signals | Picture creation date, system identifier, media type, video duration, authorisation status | Phone only, never persisted unless section 4 option S is chosen | Never |
| Candidate moments | A day or a few hours that qualifies (NS-51-R7), its start and end | Phone only | Never |
| Dismissals | The parent said "not this one" | Phone only | Never |
| Ranking state | Which card family showed today, last shown day, prompt shuffle position | Phone only | Never |
| Typed days (NS-18) | A day and the parent's words | Phone `settings`, deleted the day after delivery (NS-18-R7) | Never |
| Ticked Days (NS-46) | A day the parent marked, yearly | Own device file, Application Support, excluded from backup (NS-47-R6) | Never |
| Notification preferences | `reminders.*`, `notifications.dayNames`, Moments on, paused | Phone `settings` or the Moments file | Only `include_in_reminders` per child, as today |
| Child date of birth | Month-age and birthday arithmetic | Phone `children` and server `children.date_of_birth` | Yes, as today (L4) |
| Letters made | `occurred_on`, `captured_at` | Phone `entries` and server `entries` | Yes, as today |
| Prompts | The 111 written prompts | Shipped in `packages/content` | n/a |
| Pictures chosen for a letter | The stripped copy | Phone only (`entry_media`, ADR 0028 D1) | Never; `photo_path` stays null (NS-01-R15) |

The rule behind the table: a fact about the library is a fact about a child (L4, DATA_CLASSIFICATION rule 2 "derived data inherits"), so it never leaves the phone. A fact the parent typed or chose, and a fact that is plain arithmetic on the date of birth, can drive a card. Only the second kind can drive an email.

## 4. Requirements: the on-device data

### MT-X5-R1 Nothing from the library is persisted by default (recommended option P)

Given Route B is on and the parent opened the tab,
When the tab builds For you and Recent,
Then it fetches a bounded date window (the last 90 days, newest first, with a fetch limit), reads only each picture's creation date and media type, groups on the phone, holds the result in memory for the screen, and writes no library identifier, date or count to disk.
Test layer: unit (grouping is a pure function in `packages/core`, BL-859 shape) and source scan (no write call on the library module's output outside the thumbnail view).
Why: ML-4 says "no asset id or derived value kept". Feasibility 2.4 says a lost index costs one fetch to rebuild. A cache that is never written cannot leak through backup, a restore, a widget, a sync bug or a crash dump. Cost: one date-window fetch per foreground catch-up. Budget: it must be measured by spike D3 on a 20,000 picture library on an iPhone SE 3, cold start p50 1.2 s and p90 2.0 s (feasibility R6); I have no figure and do not invent one.
Founder and `privacy` own the choice between option P and option S (R2).

### MT-X5-R2 If a stored index is wanted (option S), it is the NS-51-R6 file and nothing wider

Given the founder or `privacy` rules for a stored index,
When the app writes it,
Then it is its own SQLite file `moments.db` in `Library/Application Support`, not in `scribe.db`; the backup exclusion is set and read back and the store refuses to write if it reads false (E37, NS-47-R6 pattern); protection class no weaker than SEC-R15's; at most 30 moments, each with a start and end time and at most 6 identifiers; per account; never synced, exported, logged or sent.
Test layer: db and unit, one named test per clause (`[NS-51-R6]`), plus a restored-phone device row (NS-51-R23).
Conflict recorded: ML-4 (no asset id kept) and NS-51-R6 as amended by E37 (up to 6 identifiers kept) disagree. E37 is the later locked card, so option S follows it, but I recommend option P. Both are PROPOSED. `data-architect` reconciles BL-877 (no per-asset row) with NS-51-R6 by deleting the disagreement, which option P does.

Local schema sketch for option S (not a migration; `moments.db` has its own `PRAGMA user_version` and its own migrator, so it never claims a number in `apps/mobile/src/lib/db/migrations.ts`, which is at 11 and where ADR 0028 D3 reserves the next number for the seal):

```
moment_index
  moment_key   TEXT PRIMARY KEY   local day key plus band, built by a fixed rule        L4 (derived from a child's pictures)
  start_at     TEXT NOT NULL      first picture time                                     L4
  end_at       TEXT NOT NULL      last picture time                                      L4
  rule         TEXT NOT NULL      CHECK (rule IN ('busy_day','busy_hours','birthday','month_age','marked_day'))   L2
  built_at     TEXT NOT NULL                                                             L2
moment_asset
  moment_key   TEXT NOT NULL      FK to moment_index, ON DELETE CASCADE (same file, one author)   L4
  asset_ref    TEXT NOT NULL      the system identifier, at most 6 per moment            L4
  taken_at     TEXT NOT NULL      picture creation time                                  L4
  media        TEXT NOT NULL      CHECK (media IN ('photo','live_photo','video'))        L2
  duration_ms  INTEGER            videos only, as the phone holds it                     L2
  PRIMARY KEY (moment_key, asset_ref)
moment_dismissal
  moment_key   TEXT PRIMARY KEY   the day the parent set aside                           L4
  dismissed_at TEXT NOT NULL                                                             L2
moment_state
  key          TEXT PRIMARY KEY   'last_card_day' | 'prompt_cursor' | 'opt_in' | 'paused' | 'album_ref'
  value        TEXT NOT NULL      the opt-in, pause and chosen album are L4 (NS-51 section on fields); the cursor and day are L2
INDEX moment_asset_moment_idx ON moment_asset (moment_key)
```

Access patterns, so every index has a named query (DB-R22): the tab reads the newest moments (primary key and `start_at` order over at most 30 rows, so no index beyond the key is useful) and one moment's assets (`moment_asset_moment_idx`). At 30 rows and 180 asset rows the local read budget is far below the 200 ms local save commit p95 (DATA-REQ-048 is the save path, not this read); I state no measured number.

Under option P only `moment_dismissal` and the non-library keys of `moment_state` survive, and they can live in `scribe.db` `settings` or the days file; there is then no `moments.db` and no library identifier on disk at all.

### MT-X5-R3 One dismissal, kept as a day key and nothing else

Given the parent sets a card aside,
When the app records it,
Then it stores the local day key and the time, never a picture id, a count, a place or a reason, and a dismissed day is not offered again for that day only.
Test layer: unit (`[MT-X5-R3] a dismissal holds a day key only`); no analytics event is emitted (R14).
Why: a dismissal list is a record of what the parent chose not to keep. It is L4 because it is derived from library dates. It is wiped with the rest (R9 to R11).

### MT-X5-R4 Ranking state holds no score

Given For you chooses between a typed day, a birthday, a ticked Day, a month age day, a year-ago letter, a catalogue prompt and a library moment,
When it ranks them,
Then it uses the fixed order of NS-32 and NS-46 (a day the parent typed, birthday, ticked Day, library day, month age, evening), keeps no per-person score, no history of which card was tapped, and no "engagement" value, and "refresh" is a shuffle inside the 111 prompts that remembers only a cursor.
Test layer: unit (order table) and source scan (no stored tap history).
Why: stored tap history is a behavioural profile of a parent. The constitution says no streaks, points or badges. The reason to return each day is a fresh card the parent can act on, not a number we keep.

### MT-X5-R5 No library identifier reaches a letter

Given a parent writes a letter from a moment or from a picture,
When the letter and its picture are saved,
Then `entry_media` keeps only the stripped copy and its fields from ADR 0028 D1, no `localIdentifier`, no moment key and no source column; `entries` gains no column and `capture_mode` keeps its three values (`spoken`, `typed`, `mixed`); `prompt_key` is the catalogue key only when the parent used a catalogue prompt.
Test layer: db (schema scan of `entry_media` and `entries`) and unit.
Why: an identifier in `entry_media` would outlive a wipe of the moments file and would be a library fact inside a letter. A `capture_mode` value such as "from_moment" would be a library-derived fact in a synced, server-readable column (DB-R02 would also need `packages/core/src/domain.ts` and the analytics enum test changed).

### MT-X5-R6 The Find index and every other index skip Moments

Given the phone builds the Find search index (ADR 0028 D4) and any other cache,
When it indexes,
Then it never reads `moments.db`, a moment day or a dismissal, and no copy of moment data goes to an app group, widget, iCloud key-value store, pasteboard or donation index (E94 pattern, extended to Moments).
Test layer: source scan.

## 5. Classification of each field (against DATA_CLASSIFICATION)

`privacy` decides levels; these are proposals for review. Levels from section 1: L2 flags and enums, L3 person and book ids, L4 content and data derived from it.

| Field or store | Where | Level | Reason and rule |
|---|---|---|---|
| Picture creation time, identifier | Memory only (P) or `moment_asset` (S) | L4 | Derived from a child's pictures; rule 2, NS-51-R6 |
| `moment_key`, `start_at`, `end_at` | memory or `moment_index` | L4 | Derived from L4 pictures |
| `rule` (busy day etc.) | same | L2 | Closed enum, no content |
| `built_at` | same | L2 | System timestamp |
| `media`, `duration_ms` | same | L2 | Enum and a duration the phone already holds |
| `moment_dismissal.moment_key` | device | L4 | Derived from library dates |
| `opt_in`, `paused`, `album_ref` | device | L4 | NS-51 fields line: L4, per account, excluded from backup. A flag that a parent opted into reading a child's pictures is itself about the child |
| `last_card_day`, `prompt_cursor` | device | L2 | No content |
| Authorisation status (limited, full, denied) | In memory from the system, not stored | L4 if stored; I recommend not stored | It says whether pictures were shared. It is read at foreground, never written or sent |
| Typed day words (NS-18) | `settings` | L4 | Parent's words |
| Ticked Day ids (NS-46) | days file | L4 | A ticked day can reveal a tradition (special-category risk); NS-47-R6 already treats it so |
| `children.date_of_birth` | server and phone | L4 | DATA_CLASSIFICATION section 1: child DOB is L4, not L3 |
| `entries.occurred_on`, `captured_at` | server and phone | L3 and L2 | As inventoried (section 4.5) |
| `entry_media.*` | phone | per ADR 0028 D1, amended A4 | Unchanged |
| `include_in_reminders` | server | L2 | As inventoried |
| Moments analytics rows | PostHog | L2 | R14; enum and bounded values only |

Handling floor: `moments.db` is an L4 file, so it takes the L4 floor: iOS data protection no weaker than the device database (LEGAL-REQ-022(b)), exclusion from backup, never in logs, URLs, push payloads or analytics (L4 handling row). Because it is a new device store, DATA-REQ-001 and DQ-R02 require a row in the device inventory (section 4.5 of the classification file) and the data map in the same PR as the code. That is `privacy`'s file (`docs/legal/**`), so I draft nothing there.

A place the parent types on a letter is not a new data type: it is `entry_media.place` (L4, 60 characters), already inventoried. A machine place, a map tile or a reverse-geocoded name is not stored, per I2 section 5. I do not propose a column for one.

## 6. Retention and deletion

### MT-X5-R7 Turn off, pause and Erase empty the moments data at once

Given the parent turns Moments off or pauses it,
When the action completes,
Then in the same action the index (if option S), dismissals, album choice and pending moment-driven reminders are deleted, and one calm line says access can also be changed in Settings; the card never claims it revoked the system permission (NS-51-R15, R16).
Test layer: e2e `[NS-51-R16] off removes the index`; unit for pause.

### MT-X5-R8 Revoking photo access in Settings empties the same data

Given the parent turns photo access to None in iOS Settings,
When the app next comes to the foreground and reads the authorisation status,
Then it treats this as off: the moments data is deleted in one transaction, the tab shows its value page with the plain ask available on the parent's tap only, and no system prompt and no repeated nudge follows (NS-51-R19, Apple A8: the system will not prompt again).
Test layer: unit with a fake status; device row D2.
Edge: the revoke happens while the app is closed. Nothing runs then. The data is deleted at the next foreground; in between it is on the phone only, behind data protection. I record this window; I did not verify any iOS behaviour that would close it.

### MT-X5-R9 Limited access changes reconcile on foreground

Given the parent changes which pictures the app may see (Limited access),
When the app next comes to the foreground,
Then option P re-fetches and shows only what is visible now; option S deletes any `moment_asset` row whose identifier is no longer returned, drops a moment left with no asset, and never asks again (NS-51-R3, R18).
Test layer: unit with a fake library; device row D4 (BL-871).
Edge: a picture on a visible moment is deleted from the library. The thumbnail view shows a plain box and the row is removed at the next reconcile. Nothing in a letter changes, because a letter holds its own stripped copy.

### MT-X5-R10 Account deletion and "Erase everything" cover Moments

Given the parent deletes the account or uses Erase everything,
When the wipe runs,
Then `moments.db` (if it exists), the days file, the moment keys in `settings` and any thumbnail cache are deleted with the rest of the local database, audio, photos and Keychain items; the server side is unchanged, because it never held any of it (DELETION spec lines 255 to 259).
Test layer: unit on the wipe registry (the NS-36 registry must list `moments.db`; a test fails if a store exists that the registry does not name) and a db test that `sqlite_master` has no Moments table in `scribe.db`.
Note: ADR 0028 finding 2 says a wipe that deletes rows from FTS5 shadow tables corrupts the index. `moments.db` has no virtual table, so rows or the whole file can be deleted; I recommend deleting the file.

### MT-X5-R11 A restored or new phone starts off

Given a restore, a new phone or a transfer,
When the app opens,
Then Moments is off, the file and the keys are absent, no ask returns by itself, and Apple's permission state is not assumed (NS-51-R23, UNVERIFIED on Apple's behaviour).
Test layer: device row.

### MT-X5-R12 Retention values

| Data | Kept until | Mechanism |
|---|---|---|
| In-memory moments (P) | The screen closes or the app is backgrounded | None needed; never written |
| `moment_index` and `moment_asset` (S) | Rebuilt each foreground; deleted on off, pause, revoke, erase, delete account | Device purge in the same action (DQ-R13 pattern); no server clock |
| Dismissals | Deleted with the rest; a day key older than the 90 day window is dropped at launch (my guess, not a rule) | Launch purge. Number is a proposal for `privacy` |
| Server | Nothing to keep | n/a |

I state no retention number as fact. DQ-R11 wants each retention period mapped to one mechanism and one test; the launch purge and the wipe are those, and the 90 day window is the same number as the fetch window (R1), which feasibility marks as assumed until spike D3.

## 7. Sync boundary

### MT-X5-R13 Moments data is never in the outbox, the pull merge or the push mapper

Given the sync engine (outbox upload and cursor pull RPCs, D-023),
When a Moments row changes or a letter is written from a moment,
Then no op is enqueued for it, the pull merge neither reads nor writes `moments.db`, and the push mapper sends `photo_path: null` (NS-01-R15); `sync_push` op kinds stay as they are and a client that sends an unknown kind is refused as today.
Test layer: unit (`enqueue*` never receives Moments rows), db (access matrix: no Moments table exists in `public`; the classification test lists none), and a network fake with zero requests from the tab (NS-51-R26).
The sync owner is `sync`. If a future ask wants cross-device Moments (for example "the other phone shows the same day"), it is a separate decision with its own X2 reads and a label review (E23), not a flag.

## 8. Analytics

The brief says "closed allowlist of ten V6 keys". What I read: the ten are SDK `$` properties allowed through `before_send` (`$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type`, `$lib`, `$lib_version`, `$session_id`, `$process_person_profile`, `$geoip_disable`; ER-A06 in I13). Event names and their properties come from the registry, in tiers (`basics` and `consented`, ER-B02). So no Moments event can add a new key; it can only add a registry row, which `privacy` signs, with only enum and bounded properties. Whether this reading matches the brief's meaning is UNVERIFIED; I could not open `00-event-standard.md` section 6 on `develop`.

### MT-X5-R14 Two registry rows fit; everything else is none

Proposed names (the registry wire names are `analytics` and `privacy`'s to set; these show intent only):

| Proposed row | Tier | Properties | Fits? |
|---|---|---|---|
| `moments:screen_view` | basics | none | Yes. One view per route (ER-B04). Static: the same event whatever the state of the tab |
| `moments:permission_ask_click` | basics | none | Yes. It records that a parent tapped a plain button, not what the library holds or what Apple answered |

Given the Moments tab,
When any state shows (value page, For you, Recent, denied, limited, empty),
Then only the screen view above is sent, with no property that varies by state, and no event exists for: a moment or a card shown, a count of moments or pictures, the access answer (full, limited, denied), a dismissal, a dismissal count, a card tapped by kind, a "moment nudge shown", a date, a place, a video length, or the 90 day window.
Test layer: unit (registry has exactly these rows for Moments), source scan (V3: no template-string event names), and the NS-51-R12 check that no field carries a count or gap.
Why each is out:
- A moment impression says a moment exists, so it is a library-derived fact leaving the phone (I2 section 10 point 6; Apple A7: derived data sent off device is considered separately).
- The access answer says whether the parent shared pictures. Even a three-value enum is a fact about the library state of a child's phone. The founder may want it to measure the ask; if so it is a reversal he owns and counsel reads the label effect. I recommend not.
- A moment-driven nudge is counted as an ordinary evening reminder (I2 section 10).
- The Route A picker "cancelled" case must send nothing (NS-49-R11).

Open point for `privacy`: even `permission_ask_click` followed in time by the screen view of another surface could let someone infer the answer. Both are basics events with no state, so I judge it acceptable; `privacy` signs it.
Analytics policy (`ask_first` or `collect_by_default`, D-163) decides whether basics are sent without a prior yes; that is the founder's and counsel's and does not change this list. Crash reports carry no moment data; a crash while the tab is open must not include a library identifier, a date or a count (scrubber check, L2 after scrubbing).

## 9. Export

### MT-X5-R15 Moments data is not part of an export

Given a parent exports their book (DATA-REQ chapter on export),
When the file is built,
Then it contains the letters, each letter's attached picture and the parent's own typed photo text and place (export schema bump of ADR 0028 D2, unchanged here), and no candidate moment, dismissal, ranking state, authorisation state or library identifier.
Test layer: unit (the `ExportEntry` type has no Moments field; the export's file list has no `moments` entry), golden file with the fictional family Asha.
Why: a candidate moment is a cache derived from the library, not the parent's words. The parent's pictures are in the Photos app and Apple's own export covers them. A stored copy in our export would put a library fact into a plaintext file (DATA_CLASSIFICATION export row: export files are plaintext by design).
If the founder wants the picture dates in the export, that is a new schema minor and a privacy review. I did not read PR #1215 (export spec 4.2, BL-868); `data-architect` reconciles with it at build time.

## 10. How email and push are driven only from server-known facts

### MT-X5-R16 What the server knows, and so what email may use

Given the server holds `children.date_of_birth` (L4), `entries.occurred_on` and `captured_at` for letters made, `child_member_prefs.include_in_reminders` (L2), and the account email (L3 in `auth.users.email`),
When an email is composed,
Then it may use only: the month-age or birthday arithmetic on the date of birth, the fact that a letter was or was not made on a date (never a count or a gap), `include_in_reminders`, and the address; it may never use a library signal, a typed day, a ticked Day, a moment, a dismissal, or letter text.
Test layer: unit on the email job's input type (it cannot receive anything else), db test that the job's role reads only those columns.

Standing limits that apply, each already in the repo:
- Resend is transactional only; no content in subjects or bodies; sent-message data kept 30 days (DATA_CLASSIFICATION 4.8).
- E75 (I14): no marketing email to app addresses at 1.0; any later one needs the founder's yes and a separate opt-in, off by default. A Moments email is that email. This is a reversal the founder owns.
- Gap language is barred (NS-51-R12): a "you have not written" email is never allowed, whatever the data.

### MT-X5-R17 Push is local; the server sends none

Given a Moments-related reminder,
When it is planned,
Then the phone plans it locally, only while the app is open, as the ordinary evening reminder's exact words in the ordinary evening slot (I2 section 10 point 5), with a payload of `{ source, kind }` only (ADR 0030), no library identifier, no place, no count, no thumbnail, counted inside the one-a-day budget (NS-32), skipped in quiet hours and for a hidden book, cancelled by a letter made that day (NS-51-R13), and removed on pause, off and revoke (R7, R8).
Test layer: unit (planner source and budget), source scan (payload shape).
Why local: the phone already holds the date of birth, so month-age and birthday reminders need no server. A remote push needs a device token store, which `public` does not have today (no token table in `supabase/migrations` and none in `grants.mjs`), a push processor in the privacy label story, and a sender job. Remote push from a moment signal is refused for the same reason as email (I2 CQ-13).
Limit, from feasibility 5.4: nothing runs when the app is closed, so pictures taken after the last open do not prompt. The founder's wish for a signal-driven nudge is bounded by this. It is a platform fact I did not verify beyond what feasibility records.

### MT-X5-R18 The same signal in three places, with different sources

| Surface | Source of the signal | Library signal allowed |
|---|---|---|
| In-app cards (For you, Recent) | The phone: typed days, Days, month-age days, a year ago from our own letters, pictures the parent already picked, 111 prompts, then library moments | Yes, on the phone, Route B or A, after the parent's tap |
| Local push | The phone, fixed neutral words, evening slot | Timing only, and only in the identical-words form; counsel (CQ-11, CQ-12) and the founder own it. I would not let even timing follow the library until they rule |
| Email | The server: date of birth, letters made, address | Never |

The reason to come back each day, in data terms: a fresh card the parent can act on, built from facts the parent already gave us (a date of birth, a Day, a letter from a year ago), plus one catalogue prompt. It does not depend on library permission, so a parent who says no still has a reason to return. It uses no count, no gap and no streak. Product owns the wording and the engagement claim; I found no measured evidence for a lift from library nudges (I2 section 10) and do not rely on one.

## 11. Migration needs (stated, not written)

| Need | New server migration file? | Notes |
|---|---|---|
| Phone Moments store (options P or S) | No server file. A new device file with its own versioned migrator (option S) or none (option P). `scribe.db` migrations.ts needs no change for Moments | Next free `scribe.db` number is reserved by ADR 0028 D3 for the seal; Moments does not claim one |
| Server table, column, RPC, policy for library signals, moments, dismissals, ranking state | No. None is proposed | Keeps the "no server table" rule |
| Server table for safety tiers | No. None, as the CLAUDE.md privacy rules require | Unchanged |
| Typed or ticked Days on the server | No. None proposed | Founder would have to reverse NS-47-R6 and E94, and counsel read the special-category risk |
| New `entries.capture_mode` value or a source column | No. Refused (R5) | Would need a migration, a `domain.ts` change and an analytics enum change |
| Moments email (new opt-in, schedule, unsubscribe) | Yes, if the founder lifts E75 | A table for the opt-in and unsubscribe state, a send job and an Edge Function. See below |
| Remote push (device token store) | Yes, if the founder reverses the local-only recommendation | A token table (L3) and a sender; not recommended |
| Moments analytics rows | No migration. Registry rows in `packages/analytics` | `privacy` signs |

If the founder lifts E75, the new file must follow the repo rules, which I list so the cost is visible. I write none of it:
1. A new file in `supabase/migrations/`, sorted after the newest applied one in `.github/migrations-applied.txt`; never edit an applied file (DB-R08). No `begin` or `commit` (DB-R10).
2. RLS enabled on every new table, deny by default (DB-R12, principle 7), with an allow and a deny test in `supabase/tests/access_matrix*.test.mjs`.
3. Grants in the same file as the object (default privileges were reset in `20261023060000`; CLAUDE.md), and the same grant in `supabase/tests/grants.mjs`. Views revoke write rights and use `security_invoker` (DB-R13); functions `revoke execute on function` from public and anon and, for internal functions, `authenticated` (DB-R14); `security definer` functions set `search_path = pg_catalog, public` and carry a comment saying why (DB-R15).
4. `comment on column` with L1 to L4 on every new column, in the same PR (DQ-R01); the classification test fails on an unlabelled column. A row in the device and server inventory and the data map (DQ-R02, DATA-REQ-001).
5. Indexes for every foreign key and policy column with a named access pattern and a perf-budget row (DB-R21, DB-R22), and a stated budget: server reads must not be the bottleneck against the local save commit p95 of 200 ms (DATA-REQ-048).
6. Any email column would hold the address or a preference: person ids are at least L3, the address is L3. No cascade across authors (DB-R20).
7. The PR touches `supabase/**`, so it needs a red-team review and the founder's `approve-migration` label before merge (D-041), and migrations reach staging and production only from CI on a tag. The data architect never applies one and never adds the label.

## 12. Edge and unhappy paths

| Case | Behaviour |
|---|---|
| Access denied or restricted (managed device, Screen Time) | Value page, one calm line, plain Settings link only when looked at; the no-permission cards (prompts, typed days, Days, month age, a year ago) still show; no moments data exists to hold |
| Limited access with no pictures in the window | An honest empty state, not a promise (J5); nothing counted |
| iCloud-only picture, no network | Plain box in the thumbnail (NS-51-R21); no download; no error stored |
| Time zone changes | Day keys are local; option P recomputes; option S rebuilds on the next foreground. Device row D4 |
| App killed during an option S write | The file is written atomically (temp file then rename); an unreadable or corrupt file fails closed to an empty tab and is deleted (NS-47-R6 pattern) |
| Backup exclusion reads false | The store refuses to write and the tab shows the value page, as NS-47-R6 specifies for Days |
| Downgrade or a newer file than the app | The migrator does not touch a file with a higher `user_version`; the tab treats it as empty |
| Two accounts on one phone | Per account; signing out removes that account's moments data (like sign-out removal in the B5 token work); account A's return does not resurrect another's |
| Route A picked item types | Only photo, live photo and video are kept; Location, Contact, Song, Workout, Reflection and State of Mind are discarded at the boundary (I2 CQ-3 default); Apple's title is never stored |
| A letter was started from a moment, then the picture is deleted from the library | The letter keeps its stripped copy (ADR 0028); nothing to repair |
| Restored from backup | Option S file is excluded, so absent; option P has nothing to restore |

## 13. Constitution, privacy and accessibility checks

- Constitution: no machine title, caption, summary, place, person or scene guess is stored or shown; a label exists only if the parent typed or chose it; Apple's picker title is never stored. Ranking state holds no score and no history. No counts, gaps, streaks, points or badges are kept (R4, R14).
- Privacy: nothing leaves the phone from the library; no picture, filename, album, place or date in analytics, logs or crash reports; safety tiers stay on the device with no server table; Data Not Collected holds only while NS-51-R26 (a network fake sees zero requests) stays green. A reverse-geocoded place may send coordinates to Apple (UNVERIFIED, I2 A6); the safe default is none or parent-typed, and no coordinate is ever stored.
- Label: Route A or B with everything on the phone stays "not collected" (A7, counsel confirms). Any change in section 10 (email or remote push from a library signal) makes the data collected and changes the label in the same build (NS-51-R30, FR-PRV-30).
- Accessibility: this document stores no screen text. Two data facts matter for it: a state that is not stored (access answer) must be re-read at each foreground so VoiceOver and Dynamic Type always show the current state, and an emptied tab must announce one calm line, not an error.

## 14. Reversals and decisions the founder must own

| # | Item | Where | My recommendation |
|---|---|---|---|
| F1 | Store a library-derived index at all (option S) or none (option P); resolves ML-4 against NS-51-R6 and E37 | R1, R2 | Option P |
| F2 | Any email from Moments: lifts E75 (no marketing email to app addresses at 1.0) and needs a separate off-by-default opt-in, a new table and an Edge Function | R16 | No email at 1.0; if later, server facts only |
| F3 | Any remote push (token store, processor, label) | R17 | No; local only |
| F4 | A library-timed local reminder in the identical-words form: reverses NX-39 ruling 3 and K1 for timing; NS-51-R11 already proposes a narrow form | R17, R18 | Counsel first; default off until ruled |
| F5 | Any analytics event that states library state (shown, count, access answer) | R14 | No |
| F6 | Typed or ticked Days on the server (reverses NS-47-R6, E94) | section 3, 11 | No |
| F7 | Moments data in an export | R15 | No |
| F8 | Dismissal retention number | R12 | `privacy` proposes; the number here is a guess |
| F9 | Reversals already listed by I2 section 6 (BL-1305, NS-51-R1, R8, R9 and ML-6, Q-PM-5, three tabs, K-02) | I2 | Not repeated; their data consequence is: Route B means a usage string and a PhotoKit read, which this document assumes only after the founder owns them |

## 15. Open questions, each with a default and a deadline

| Id | Question | Default | Owner | Deadline |
|---|---|---|---|---|
| Q1 | Option P or option S? | P | Founder with `privacy` | Before any Route B build row is `ready` |
| Q2 | Does "ten V6 keys" mean the ten `$` SDK keys, as I read it? | Yes | `analytics` | Before the Moments registry rows are written |
| Q3 | Is the access state ever stored? | No, read at foreground only | `privacy` | Same |
| Q4 | Dismissal retention | Dropped when older than the 90 day window, and on any wipe | `privacy` | Before build |
| Q5 | Where do the Moments device-inventory rows go while `data-map.yaml` does not exist (DQ-R02 not yet enforced)? | DATA_CLASSIFICATION 4.5 and the data policy device table, in the same PR as the code | `privacy` | Same PR |
| Q6 | Do the picked Route A items pass through any temporary file, and for how long? | Copy to Caches, delete after the letter saves, sweep at launch | `mobile` with spike D1 | After D1 |
| Q7 | Does the new tab change the first-run guard or any stored first-run flag? | No data change; routes are `mobile`'s | `mobile` | n/a |

## 16. Dependencies

- `privacy`: levels in section 5, the dismissal number, the label read, CQ-11 to CQ-15 from I2.
- `sync`: the outbox and pull merge tests in R13.
- `analytics`: registry rows in R14 and the crash scrubber check.
- `mobile`: the wipe registry (NS-36), the moments file or none, the foreground reconcile, the local planner source.
- `qa`: the test harness for the device rows D2, D3, D4 and the network fake.
- `legal` and the founder: E75, any label and policy change, and `docs/legal/**` edits (not mine).
- Open Moments PRs I did not read: #1270 (design concept) and #1271 (content). If either assumes a stored index or an event, this document is where they reconcile.

## 17. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session):
- Repo state at `develop` head `fb295076`: `docs/engineering/PRINCIPLES.md`, chapters 03 and 04, `DATA_CLASSIFICATION.md` sections 1, 4.5, 4.7, 4.8, `apps/mobile/src/lib/db/migrations.ts` (versions 1 to 11, `entry_media` at 11), `supabase/migrations/20260930000000_scribe_core.sql` (`capture_mode` check of three values; `children.date_of_birth`), `supabase/tests/grants.mjs`, `.github/migrations-applied.txt`, ADR 0028 D1, NS-51 rows R5, R6, R12, R15, R16, R23, R26, R30, NS-47-R6, NS-18-R1 to R7, E37, E94, E75, ER-A06 and ER-B02.
- PR #1267, #1264 and #1269 as pushed, read through the GitHub contents API of their branches. Apple facts in this document (A1 to A9) are quoted from #1267, which says it read them on 21 Nov 2026. I did not fetch an Apple page myself, so each is "read through a colleague's note", and I keep them marked UNVERIFIED in the sense of this brief where I rely on them for a ruling.
- No token or device table exists in `supabase/migrations` for remote push (searched by name); no server table holds typed or ticked Days (searched by name).

UNVERIFIED:
- That the ten V6 keys are the ten `$` keys (R14 reading).
- Any iOS behaviour on revoke while the app is closed, on a restored phone, on the system thumbnail for an iCloud-only picture, on whether push or local notification needs a background mode (I2 and feasibility say so; I read no Apple page).
- App Store label effect of a local notification timed from library dates, of Route A's entitlement, and of any email or remote push (counsel).
- PR #1215 (export 4.2), #1270, #1271, `data-policy.md`, `app-store-privacy-labels.md`, `00-event-standard.md`.
- Performance of a date-window fetch on a 20,000 picture library (spike D3); I state no number.

A guess: the 90 day dismissal window (R12), flagged there as `privacy`'s to set.

## 18. What I did not do

I wrote no migration, test, column or code. I edited no file other than this one: not `CLAIMS.md`, not `BACKLOG.md`, nothing under `docs/legal/**`, `supabase/**` or `.github`. I opened no pull request. I did not read the founder's screenshots. I applied nothing to any remote project.

Content-rule check on this file: no em dashes, en dashes, curly quotes, ellipsis characters or emoji; no model names; fictional family Asha only.
