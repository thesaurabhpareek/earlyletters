# PROPOSED: media privacy label table, data map rows and the three consent acts (BL-850)

> **PROPOSED. Not applied. Not legal text until the founder merges it (D-125).** Everything under `docs/legal/**` is legal text, so the rows below are drafts for `docs/legal/DATA_CLASSIFICATION.md` and `docs/legal/app-store-privacy-labels.md`. Nothing in `docs/legal/` is edited by the pull request that carries this page. Every applicability call is marked "exec-team counsel must confirm": the founder said counsel means the exec team, not a lawyer, and this page is an engineering reading of Apple's definition, not legal advice. The founder enters any App Store label; no label is entered by this work.

Satisfies: NX-39-R30, NX-39-R34, NX-39-R47. Also cited: LEGAL-REQ-014, LEGAL-REQ-042, PRIV-R18, PRIV-R21.
Owner: `privacy`. Reviewers: `compliance-engineer`, `legal`.
Read at `origin/develop` `1f9065188` (23 Nov 2026). Source of the phases and requirement ids: `docs/roadmap/next/03-requirements/NX-39-memory-library.md` (section 3, the phase table; section 7; section 8). Source of the question: CB-2 in `docs/roadmap/next/03-requirements/NX-39-council-record-10nov.md` section 5. The log canary design is in `docs/privacy/MEDIA_LOG_CANARY_DESIGN.md` (docs, not legal text).

Nothing here was run on a phone. Where Apple's behaviour matters, the claim is marked UNVERIFIED. The only Apple text relied on is the definition of "collect" that `docs/legal/app-store-privacy-labels.md` section 1 quotes (read there on 15 Oct 2026); this page did not re-read Apple's page.

## 1. What CB-2 asks, and how the table is built

CB-2: under Apple's definition of collect (data transmitted off the device), does reading the date and city of a photo on the phone, with nothing leaving it, leave Photos or Videos, Precise Location and Coarse Location answered No, for each route (picker, Limited, Full, Journaling Suggestions)? Does a derived list on the phone change that? Counsel has not answered. So the table gives the label for each phase under each possible answer, and the answer picks the column.

| Answer | Reading | Exec-team counsel must confirm |
|---|---|---|
| **A** | Collect means leaving the phone. Nothing leaves, so every media row stays No on every route | yes |
| **B** | The picker routes are No (the parent hands over one file, nothing is read beyond it). The library routes (Limited, Full, the derived list, the background read) are disclosed, because the app reads many items the parent did not pick one by one | yes |
| **C** | Disclose every route, picker included. The cautious reading | yes |

Facts that hold under every answer, because they come from the code and the requirements, not from counsel:
- No media byte, date, city, coordinate or asset id is uploaded. `photo_path` is null in every sync payload and the `entry-photos` bucket denies writes (NX-39-R33, R54; `supabase/migrations/20261110000000_photo_bucket_closed.sql`, `supabase/tests/photo_bucket_closed.test.mjs`, per `docs/security/MEDIA_THREAT_MODEL.md` P13). The payload ban test (BL-852) is not built on `develop`; until it is, this row of facts rests on the bucket test and on review.
- The stored picture is in the iPhone backup by decision (NX-39 F9). That is Apple's backup, not a transmission to us. Whether the label or the policy must say so is CB-1 (a). Exec-team counsel must confirm.
- Analytics is off in every `eas.json` profile and the catalogue holds no media event whose existence depends on library content (NX-39-R34). So Usage Data and Diagnostics do not change for media.

## 2. The label table, by phase and answer

Phases are NX-39 section 3. "Today" is `app-store-privacy-labels.md` 3.2 as it stands: Photos or Videos No ("No photo feature in v1.0"), Precise Location No, Coarse Location No. Cells show the answer on the data type named in the column heading.

| Phase | What the phase reads and keeps (all on the phone) | Photos or Videos | Coarse Location | Precise Location | What else on the label |
|---|---|---|---|---|---|
| P0 picture with a letter (`EXPO_PUBLIC_PHOTOS`) | The picked file only. Keeps the stripped copy | A: No. B: No. C: Yes | No under A, B and C | No under A, B and C (the re-encode copies no location: `ScribePhotoModule.swift`, per threat model P1; UNVERIFIED on a device until row D-9) | The "Why" text of the Photos or Videos row must stop saying "No photo feature in v1.0" in every column, because the sentence is false once P0 ships |
| P1 date and city from the picked file (`EXPO_PUBLIC_MEDIA_METADATA`) | The picked file's capture date; its coordinates are read into memory and reduced to a city key from a bundled table (NX-39-R6, R7). Keeps a date field and, if the parent keeps it, a city name | A: No. B: No. C: Yes | A: No. B: No. C: Yes | A: No. B: No. C: Yes, because the coordinates are read, even though they are never stored | Under C the capture date has no Apple category of its own; it rides with Photos or Videos. Exec-team counsel must confirm |
| P2a library chooser (`EXPO_PUBLIC_LIBRARY_CHOOSER`) | Dates and city keys of library items in a range the parent opens, on a tap. Limited honoured. Nothing kept beyond the attached copies | A: No. B: Yes. C: Yes | A: No. B: Yes. C: Yes | A: No. B: Yes. C: Yes (coordinates read in memory) | Adds `NSPhotoLibraryUsageDescription` (NX-39-R4, R56). The label and the purpose string must agree word for word on purpose |
| P2b suggest days (`EXPO_PUBLIC_MOMENTS`, with P4b) | The same reads, on open. Keeps a derived list: day range, city key or null, flags, a cursor (NX-39-R40) | A: No. B: Yes. C: Yes | A: No. B: Yes. C: Yes | A: No. B: Yes. C: Yes | CB-12b asks whether the stored city key is a location history even on the phone. Exec-team counsel must confirm. A derived list is the second half of CB-2; under A it changes nothing, under B and C it is already Yes |
| P2c background top-up (`EXPO_PUBLIC_MOMENTS_BACKGROUND`) | The same reads while the app is closed, best effort, a ceiling of 3 a day. Keeps a last-looked time | Same as P2b | Same as P2b | Same as P2b | No new data type. The change is disclosure of an unseen read: the purpose string, the sheet and the policy (CB-19, CB-27), and `UIBackgroundModes` in the plist. The label cannot show frequency and no copy may state one (NX-39-R44) |
| P3 video (`EXPO_PUBLIC_VIDEO`) | The picked or chosen video. Keeps a local copy with no location metadata (NX-39-R8) | Same as P0 and P2a for the route used | Same as the route | Same as the route | A video can hold other people's voices. The Audio Data row is tied to recording backup and stays as it is; a kept video is not uploaded (NX-39-R22, R23). Exec-team counsel must confirm that a local video does not touch Audio Data (CB-9) |
| P4a occasions the parent types (`EXPO_PUBLIC_OCCASIONS`) | A name and a date the parent typed. Local notifications only | No | No | No | No push token: local notifications need none (UNVERIFIED which Apple call the adapter wraps; NX-39 section 14 item 30). Sensitive Info already says Yes for a due date. A typed occasion that could point to a faith or an origin is a question for CB-21; if it ever synced or went into a server field, Sensitive Info and the policy would have to be revisited first. Exec-team counsel must confirm |
| P4b days-away card | Nothing new (a view of P2b data) | As P2b | As P2b | As P2b | No notification, ever (NX-39-R27) |
| Journaling Suggestions route | Not a phase. A spike only (F10). No row until a decision | not decided | not decided | not decided | The entitlement needs a statement to Apple (CB-14). A label row is written only if the route is built |

Reading the table by answer:
- **Answer A** changes no media answer on the label at any phase. What changes is words: every "No photo feature", "photos are not read" and "location not requested" line in the label doc, the policy and the store text must be checked for truth at each phase (NX-39-R1, R55).
- **Answer B** flips Photos or Videos, Coarse Location and Precise Location to Yes at P2a. Those rows would be Linked, App Functionality, not tracking (the same shape as the other rows in 3.2). Exec-team counsel must confirm.
- **Answer C** flips them at P0 (Photos or Videos) and at P1 (both location rows).

## 3. Rows to add to the label doc once counsel answers (drafts)

Section 3.4, build-state variants, one row per switch (names are NX-39 proposals):

| Build | Label |
|---|---|
| `EXPO_PUBLIC_PHOTOS` on | Per section 2 under the answer to CB-2. The Photos or Videos "Why" text is rewritten; the sentence "No photo feature in v1.0" is removed |
| `EXPO_PUBLIC_MEDIA_METADATA` on | Per section 2, P1 row |
| `EXPO_PUBLIC_LIBRARY_CHOOSER` or `EXPO_PUBLIC_MOMENTS` on | Per section 2, P2a and P2b rows; the plist gains the library usage string (NX-39-R4) |
| `EXPO_PUBLIC_MOMENTS_BACKGROUND` on | Same data types as P2b; the purpose string names reading while closed, and `UIBackgroundModes` is present. The flag stays off in every `production` and TestFlight profile until the gates in NX-39 section 3 pass |
| `EXPO_PUBLIC_VIDEO` on | Per section 2, P3 row |
| `EXPO_PUBLIC_OCCASIONS` on | No data type changes |

Section 4, privacy manifest: `NSPrivacyCollectedDataTypes` must equal the label for the build exactly (PRIV-R18). Under answer A no media entry is added. Under B and C the entries are the Photos or Videos and location types in the rows above. Required-reason API entries for any new native module (the picker, the library module, video conversion) are UNVERIFIED: no plugin output was read for this page (NX-39 section 14 item 18). Each new native module goes through `docs/security/NATIVE_MODULE_GATE.md` first.

Stale text found while writing this: section 3.2 says "Photos or Videos: No, No photo feature in v1.0" and "Location: Not requested; no IP-derived location is stored". Both are correct for a build without media and wrong for any build with P0 or P1 on. The guard (BL-975, `docs/ops/proposed/label-guard-activation.md`) compares build state with the label; the build-state rows above are what it needs to compare against.

## 4. Data map rows (drafts for `DATA_CLASSIFICATION.md` sections 4.5, 4.6 and 4.7)

Levels follow `DATA_CLASSIFICATION.md` section 1: L4 is content and child identity. A capture date and a city of a picture of a child are treated as L4 because they say where and when the child was, and R30 requires them absent from every log, event and crash report. Column names are proposals: columns belong to `data-architect`. Each row needs `data-architect` to confirm level, retention and the deletion path. Exec-team counsel must confirm the applicability calls in the last column.

### 4.5 Device SQLite (`scribe.db`), additions to `entry_media`

| Field (proposed) | Level | Phase | Purpose | Retention and deletion | Leaves the phone? |
|---|---|---|---|---|---|
| capture day (from the picked file; the parent can change or clear it) | L4 | P1 | Show "Taken {date}" beside a picture, and nothing else (NX-39-R5, R10) | With the media row: when the picture, letter, book or draft goes, and by Erase everything and Delete account on the phone (NX-39-R31) | Never uploaded; not in a sync payload (R33). In the device backup with the file. In the parent's own export only as the stored copy plus text the parent kept (R32). Exec-team counsel must confirm that the backup is not a disclosure to us |
| city name, only for an item the parent kept | L4 | P1 | Show a place after a tap, on a kept item (NX-39-R6, R16) | Same | Same; city text is in an export only when "Include places" is on (R32) |
| source (`picker` or `library`) | L2 | P1 to P2a | Which route added the item | Same | No |
| `kind` gains `video`; duration, pixel size | L2 | P3 | Limits and display (NX-39-R21) | Same | No |
| opaque random media key (never an asset id, never derived from one, at most 200 characters) | L2 | P2a | Keep a decision attached to a picture that is on a letter (NX-39-R41) | Goes with the row | No |

### 4.6 Device files and stores

| Element | Level | Phase | Note |
|---|---|---|---|
| Moments index: start day, end day, city key or null, flags, rule version, cursor, look log (NX-39-R40) | L4 | P2b | No per-asset row, no asset id, no time finer than a day, no coordinate, geohash, cell or "home". Outside `scribe.db`; excluded from backup, with the flag read back at open, rebuild, replace and restore (NX-39-R43; threat model P9, G-4). Not synced, not exported (R32). Deleted at once when Suggest days goes off, on Forget the list, on revoke, and on narrowing (R18, R42). Erased by Erase everything and Delete account (R31). Disposable: rebuilt, never trusted after a restore. Dropped after 90 days off (proposed, CDO-12). Exec-team counsel must confirm whether a stored city key is precise geolocation or a location history (CB-10, CB-12b) |
| Parent decisions: hidden days and stretches, card snoozes with an expiry (NX-39-R41) | L4 | P2b | Bare calendar days, no per-photo key for an unattached photo. Survive a rebuild, a rule change, a revoke and re-grant, Stop these and Forget the list. Removed by Erase everything, Delete account and the parent's own Clear hidden choices. Excluded from backup (proposed; CB-25 asks whether it must be, and whether it is sensitive). Not exported |
| Last-looked time for the top-up (NX-39-R46, R49) | L2 | P2c | One time, no count. Shown on the ledger. Cleared when the switch goes off. Never in analytics |
| Memory only, never persisted: coordinates, library thumbnails, asset ids, a counted list for the chooser | L4 | P1 to P2b | Session lifetime. No cache package is in the app (threat model P4, P7). The chooser view is its own memory cap (threat model L-13, Designed). Proof is the canary, not a comment |
| Picked originals in `Caches/ImagePicker` and re-encode copies in `Caches/ScribePhoto` | L4 | P0 on | Row already exists in 4.6. Added here only for the six-picks case (threat model PK-2): the maximum lifetime, a kill-between-steps test and the launch sweep are what make the existing row true |
| Typed occasions (NX-39-R25) | L4 | P4a | Whole record is L4 because a typed day can reveal a faith or an origin (the days store rule, NS-47-R1). If the occasions live in the existing days file, its row already covers them; where they live is `data-architect`'s |

**Gap found, not in this proposal's scope to fix:** the moments file that is on `develop` (`apps/mobile/src/lib/moments/store-file.ts` and `store.logic.ts`: day keys, the parent's typed day labels, hidden place keys, a home place per book, an opaque owner; ADR 0032) has no row in `DATA_CLASSIFICATION.md` 4.6. A search of that file for `moments.v1` and `moments/` finds nothing. Its shape also differs from NX-39 R40 (it has typed labels and a home-place value, where R40 says no "home" and no per-photo or place inference). Either the NX-39 text or the code is the later decision. This is `data-architect` and `product`'s to reconcile before the P2b row above is written; the 4.6 row for the file as built is owed regardless (DATA-REQ-001, PRIV-R01).

### 4.7 Analytics properties (the catalogue is the source; these are the NX-39-R34 allowances)

| Event and property | Level | Phase | Note |
|---|---|---|---|
| `media_added` with `source`, `kind` | L2, fixed enums | P1 on | A parent action through the picker. No count, date, city, id or size |
| `occasion_reminder_changed` | L2 | P4a | No occasion name, no date. Properties to be fixed by `analytics` |
| `moments_switch_changed` with `on` or `off` only | L2 | P2b | Ships dark until counsel answers CB-2. No event exists whose existence depends on a library item, a moment or a suggestion (`moment_card_opened` and `moment_card_hidden` stay removed). Exec-team counsel must confirm |

Each addition bumps `SCHEMA_VERSION` and is a change for `analytics`; this page owns only the levels. No new log stream, vendor, host, SDK or processor is added by P0 to P4: the place lookup is a bundled table with no network call (NX-39-R7), and no geocoder is used. If a geocoder is chosen later it is a new recipient (PRIV-R12, CB-12).

## 5. The three consent acts: Shown, Records, Never, Decline

Source: NX-39-R47 and section 8, the door lines in `docs/agents/COORDINATION.md` section 10, and PRIV-R21 in `docs/engineering/07-privacy-engineering.md`. Each act has its own id, built by the one PRIV-R21 function with the hash of the words shown. A switch is on only after its act is on record. An act is `agreed` or `withdrawn` and nothing else: "Not now", a system cancel and a system revoke record no act. The act vocabulary, the writer's location and whether an act can be recorded before sign-in (BL-579) are UNVERIFIED and counsel-adjacent (NX-39 section 14 item 30, CB-4); BL-861 builds against an adapter and guesses neither. Two further facts fall out of this and need an owner:
- Section 8 of NX-39 says the act records "the access level iOS reports". The server's allowlist for the `context` of an act names `scope` and `mode` and no access level (`docs/engineering/07-privacy-engineering.md` PRIV-R21 table). Either `scope` can carry it and its allowed values permit that, or a migration widens the allowlist, which is `data-architect`'s and ships as its own file. Not checked here which. Until then the access level stays on the phone.
- The words on each sheet are `content`'s (BL-873), by key, in the founder's voice (`docs/agents/WRITING-STYLE.md`, `packages/content/WRITING-GUIDE.md`). This page states what each sheet must say, not the final line. The promise wording is CB-1 and the founder's choice (F4); none is live.

### 5.1 `media_read` (P2a and P2b: the pre-sheet CS-S1, the Settings row, the plist string)

| Line | Content |
|---|---|
| Shown | The pre-sheet by `packages/content` key, the Settings row, and the `NSPhotoLibraryUsageDescription` string (one sentence about purpose, no promise inside it; NX-39-R56). The sheet states what is read (dates and, if the Places switch is on, a city name), what is never read (what is in a picture, faces, captions), when it looks (on open; never a frequency), and where the result lives (on this phone). Continue and Not now are the same size, weight and type at the largest Dynamic Type (NX-39-R48). The versioned links to Privacy and Terms sit on the sheet |
| Records | A PRIV-R21 record with the act id `media_read`: document, version, action (`agreed` or `withdrawn`), method, surface, phone time, app version and build, OS major, platform, language, the hash of the bundled words before any name is filled in. Server `accepted_at` when uploaded. The access level stays local until the allowlist question above is settled |
| Never | Any date, place, count, asset id or picture fact; any library content. And the PRIV-R21 never-list: IP address, user agent, device model, IDFV, IDFA, push token, birth date, age or range, name or email, free text, a hash of text with a child's name in it |
| Decline and withdraw | Not now holds: the sheet comes back only when the parent opens the control (NX-39-R3). Cancel on the system question leaves the switch off and the picker working. Off is one tap and records a `withdrawn` act. Forget the list is one tap. A revoke in iOS Settings or a narrowing of access records no act, wipes the index and shows one plain note (NX-39-R11, R42; whether that suffices is CB-28). Export and Erase everything still work in every state (PRIV-R09) |

### 5.2 `media_background` (P2c only: its own sheet, CS-S4a)

| Line | Content |
|---|---|
| Shown | A second sheet, offered only on the parent's own tap, only while `media_read` is on with access All or Limited, and only when Background App Refresh is available (NX-39-R46). It says plainly that the app may also look while closed, that it does not say how often, and that the parent can turn it off in two taps. The purpose string names reading while closed if and only if P2c is on in that build (NX-39-R56) |
| Records | A PRIV-R21 record with the act id `media_background`. Same fields as above. Its own act, never inherited from `media_read` |
| Never | The `media_read` list. And: a look reported to analytics beyond a content-free event, a notification derived from a look (NX-39-R27, R46), a frequency or freshness claim in any string (NX-39-R44) |
| Decline and withdraw | Off in two taps; requests cancelled; the cursor and look log cleared. iOS turning Background App Refresh off deletes no data and records no act. Never entered as Denied: there is no system question for this layer, the parent's No is Held. P2c stays off in every `production` and TestFlight profile until the founder's recorded ruling on S6 and every gate in NX-39 section 3 pass. Exec-team counsel must confirm (CB-19, CB-20, CB-27) |

### 5.3 `occasions` (P4a: the occasions row and what the reminder will say)

| Line | Content |
|---|---|
| Shown | The occasions row, and an example of exactly what a reminder will say, from a fixed content key. It states that the parent types every occasion, that no list is chosen for them, and that nothing is read from photos. No festival word until CB-21 is answered (NX-39-R25) |
| Records | A PRIV-R21 record with the act id `occasions`. Same fields |
| Never | A named festival, a place, a photo, a count, "waiting" or the occasion name in a reminder unless "Names in notifications" is on; nothing from the library; nothing between 21:30 and 07:00 (NX-39-R26) |
| Decline and withdraw | Per occasion off, a master stop, and Erase everything. Not now and a system Denied are ordinary states with no banner. iOS turning permission off cancels pending reminders, keeps typed days, and records no act. Export and Erase everything still work |

A fourth line exists in NX-39 section 8 and is not a switch: the first add of media the parent did not make (P1), a one-line notice from the Terms right-to-add clause (CB-6). It records version and time only, and never a media fact. Cancel adds nothing.

## 6. What this page does not do, and who owns what next

- It does not answer CB-2, CB-4, CB-10 or CB-19. Each answer is "exec-team counsel must confirm". The table gives the label under each possible answer so the answer can be applied without redesign.
- It does not edit `docs/BACKLOG.md`, `docs/legal/**`, the policy text or any store label. The founder enters any label (a physical act in App Store Connect, listed in `docs/release/FOUNDER_QUEUE.md`).
- `data-architect`: confirm column names and levels in section 4; reconcile the moments file on `develop` with NX-39 R40 (section 4 gap).
- `analytics`: the three events in section 4.7 and their properties.
- `content`: the words for each sheet (BL-873), after the comprehension bar (NX-39-R59).
- `mobile` and `qa`: build the canary from `docs/privacy/MEDIA_LOG_CANARY_DESIGN.md` (BL-862). It is a gate for P2b and P2c.
- `legal`: the policy and Terms changes the label implies (BL-865, BL-866); the claim rows (BL-867).
- Any statement here that depends on how an Apple API behaves is UNVERIFIED until a device row or Apple's page is read: library authorization states, what the picker file carries, background reads, required-reason APIs.
