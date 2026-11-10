# NX-39: Memory Library: photos and videos from the phone's own library, with the date and place they carry, to help a parent remember

Status: draft for the founder and counsel, 10 Nov 2026 (UTC). Docs only. Author: `product`. Working label NX-39 (`_CONVENTIONS.md` section 1; the conventions file is on `docs/nx-33-photos-8nov` and PR #664, not yet on `develop`, so every sentence about it is UNVERIFIED against `develop`). NX-37 (usability study, branch `docs/research-build12-9nov`) and NX-38 (Build 12 gaps, PR #733) are taken. Backlog ids BL-841 to BL-858 come from `scripts/agents/next-id.mjs` run on 10 Nov (it printed BL-841, D-154); BL-757 to BL-825 and BL-830 to BL-840 are not used.

Readiness: not scored. What keeps it from ready: the founder decisions in section 11 (D2 to D14), counsel's answers in section 12, the device spike BL-843, and a read of Apple's own PhotoKit, PHPicker, CLGeocoder and notification documentation, none of which was opened for this file. Not in Build 12 (NX-36 section 0 puts backup and Photos out of the binary; read 10 Nov from the branch, UNVERIFIED on `develop`).

| | |
|---|---|
| Tag | EVIDENCE for what repo files say (each cited by path and read 10 Nov on `origin/develop` d6d250ee unless it says "branch"). HYPOTHESIS for every demand claim, every number marked "proposed" and every statement about how an Apple API behaves |
| Refines | NX-33 (photos; on branch `docs/nx-33-photos-8nov`), F09 (book), F13 (reminders), F15 (export), LEGAL-REQ-013 and LEGAL-REQ-014 (`docs/legal/ENGINEERING_REQUIREMENTS.md`), `docs/legal/DATA_CLASSIFICATION.md` rule 6 (child photo is L4), `docs/BACKLOG.md` M13 rule 4, BL-542, BL-543, BL-544, BL-545, `docs/design/NOTIFICATIONS.md` section 5 and Tier C |
| Size | L in total; every phase is its own M (P3 is L) |
| Order | After Build 12. Nothing in this file is a Build 12 task. Dates are not given: the founder's release call (D11) comes first |
| Constitution | The machine may remove and repair, never add meaning (`CLAUDE.md`). Section 3 tests each design choice against it |

## 1. The founder's direction, and what it changes

The founder said on 10 Nov (relayed by the coordinator): the NX-33 promise (picker only, no location, no library) is worth rewriting, because families' memories live in the photos and videos they take every day. The old promise is superseded in direction, not a constraint. The wording and each phase's release still need counsel and his approval. This is decision D1 below ("decided in direction"). Scope stays outside Build 12.

The idea in the founder's words, kept intact: give the app access to the person's photos and videos and their metadata (location and so on) so they can (1) attach pictures and videos to a letter, and (2) be reminded around travel, a festival, a holiday or a trip to tell a letter about what was special.

What stays exactly as briefed: the constitution, the counsel gate, the App Privacy label, the permission strings, LEGAL-REQ-013, DATA_CLASSIFICATION, and the content rules.

## 2. Which earlier rules this file supersedes, keeps, or leaves for decision

Honest summary: NX-39 reverses five written rules and keeps the rest. Nothing is silently contradicted. Each reversal below needs the founder (section 11) and, where marked, counsel (section 12).

| # | Earlier rule (where it is written) | What NX-39 does | From phase |
|---|---|---|---|
| S1 | System picker only, no library access (NX-33 "Never" and R1; file 15 G-2; BL-544 scope) | KEPT for P0 and P1 (the picker, no permission question). SUPERSEDED at P2: a library read through the system permission, honouring Limited/Selected. Needs D9, C1, C2, C10 | P2 |
| S2 | Strip location, date and camera; Records "no location, no date of capture" (NX-33 R3, "Records") | SPLIT. KEPT: the stored picture or video file carries no Exif, XMP, IPTC or location (R8; LEGAL-REQ-013 is untouched). SUPERSEDED: the capture date and a city-level place name may be read from the original on the phone and kept in separate local fields, shown to the parent, never written into the letter. Needs C3, C7, D4, D5 | P1 |
| S3 | "Never read a photo's location or date" and "never read the library, including dates and counts; no scanning for trips or faces" (NX-33 "What we never do"; `docs/BACKLOG.md` M13 rule 4; `NOTIFICATIONS.md` Tier C "NOT APPROVED") | SUPERSEDED in part. Dates and places are read, on the phone, from metadata only. KEPT: no faces, no scenes, no objects, no captions, no text recognition, no counts shown to the parent. M13 rule 4 and Tier C must be amended by the founder (D9) before BL-853 can start | P1, P2 |
| S4 | No video (NX-33 R14; `NOTIFICATIONS.md` picks photos only) | SUPERSEDED at P3 with the limits in section 7 | P3 |
| S5 | One photo per letter (NX-33 D4 recommendation; file 15) | OPEN for D3. Recommended default: P0 and P1 one; P2 on, up to 5 (the number BL-544 already scoped). Several is a layout rule, not a privacy change | P2 |
| K1 | No photo in a notification, widget, lock screen or analytics (NX-33 "Never") | KEPT, with no exception. A moment card inside the app may show the parent's own thumbnails; a notification never does | all |
| K2 | No face detection, no caption, no tag, no "best photo" ranking, no "memories" reel or slideshow (NX-33 R4, "Never") | KEPT and hardened by an allowlist test (R9). Order is by time only. A suggestion is one calm card, never a reel | all |
| K3 | Photo-only letters never; a picture is attached to words (NX-33; PRD 03 line 109 as cited there; BL-544) | KEPT. A letter needs the parent's words or recording; a picture or video is never the letter | all |
| K4 | No sharing from the library views (NX-33 R10) | KEPT | all |
| K5 | LEGAL-REQ-013 strips location and device metadata before upload or export, "the original stays only on the device" (`ENGINEERING_REQUIREMENTS.md` line 122) | KEPT in full. Reading metadata on the phone does not touch it; it binds the moment a file leaves the phone (R8, R32, R33) | all |
| K6 | Local reminders, quiet window 21:30 to 07:00, one a day, neutral lock-screen text, traditions chosen and never inferred (M13 rules 1, 2, 3, 5; BL-542) | KEPT | P4 |
| K7 | Photos local, in the export, not synced (NX-33 R16, P1 backup option) | KEPT for every phase here. Media and derived fields never enter the sync payload (R33) | all |
| K8 | "Trip" appears only if the parent typed that label (M13 rule 4; BL-543) | KEPT. The app calls a cluster of days "days", never "a trip" | P2, P4 |
| K9 | The brand line "Photos show what {child} looked like. Letters tell {child} what it felt like." (`packages/content/BRAND.md` line 50) | KEPT. The library helps the parent start a letter; the letter stays the product. Content may need to reread the line against a feature that shows photos (D12) | all |

Two sentences the old documents made that must change in the product text, not in the code: "we never read what is in your photos" stays true (nothing reads content), but "the rest of your library is not read" (`COPY_INVENTORY.md`, consent wording) becomes false at P2 and must not ship at P2 (BL-842 owns the words).

## 3. Design constraints, tested as constraints and not assumed

Each constraint was set by the founder's brief. The right column is the test that decides whether the design survives; a failing test removes the feature, not the test.

| Constraint | Why | What proves it |
|---|---|---|
| Metadata only: capture date, place, album or trip clustering by time and place. No content analysis | The constitution: the machine adds no meaning. Reading a date adds none; labelling a scene would | R9: an allowlist of the fields read, a denylist scan, no model |
| All processing on the phone | The old promise "nothing leaves the phone" stays true | R7, R33: no network call carries a coordinate, a date or a file; sync allowlist |
| Reminders are local notifications that never show a photo and never use fear, guilt or loss words | NOTIFICATIONS.md; content rules | R26, content rule test |
| No religion, ethnicity or culture inferred; the parent picks the occasions | Special-category data; M13 rule 5 | R25: no default, no locale ordering, no place input |
| Limited-access and Selected-photos permission states work as first-class | Apple's model; trust | R11 |
| Live Photos, iCloud-only assets, large videos behave and fail safely | Real libraries | R12, R13, R21, R22 |
| Place: store the name only, never coordinates; stripped on export | MHMDA and CR-022 treat precise location as sensitive (LEGAL-REQ-013 source line) | R6, R32 |
| Child photos are L4; other people's photos need a consent position | DATA_CLASSIFICATION rule 6 | R30, R14 and counsel C5, C6 |
| The book or export never leaks location by accident | Sharing | R32 |

A constraint the founder's brief did not state but the repo already holds: the app must never say it "found", "detected" or "knows" something. It says what the photo's own data says, labelled as that ("Taken 12 Dec", "Near Lisbon"), and the parent can change or remove it.

## 4. What the parent sees and does, in plain words

They are writing or about to write a letter. They tap "Add a photo or video". The phone's own picker opens. They choose one or a few. Under each picture they see, quietly, what the picture itself says: "Taken 12 Dec" and, if it has one, "Near Lisbon". They can change or remove either with a tap. They never see coordinates. The words of the letter are theirs and are not changed by these lines. Nothing leaves the phone.

Later (P2) the app, if the parent turned it on, may show one card on Tonight: "Photos from 12 to 14 Dec. Want to say what those days were like?" with a few of their own thumbnails. "Not now" puts it away for two weeks. "Hide this one" removes it for good. "Stop these" turns it all off and clears what the app kept. There is never a list of cards they missed.

Later still (P4) the parent can choose, from a short list they pick from or add their own, occasions to be reminded around. A quiet notification arrives, with no picture and no place in it: "A few words about these days are waiting." The app never decides who celebrates what.

## 5. The promise, rewritten (proposed wording; true to what the code does)

The rule: every promise line is keyed to a phase and is registered with `legal` before its switch goes on. A line is allowed on screen only when the build's capability for that phase is on (`claims-capabilities.test.ts` pattern, as BL-830 does for Build 12). The words below are proposals for BL-842; they pass the content rules (no dashes, no "AI", no "scan", no "analyse", no "we", {child} never gendered) and are UNVERIFIED against `rules.test.ts`.

| Phase | Where | Proposed words |
|---|---|---|
| P0 | Under the first picked photo | Photos stay on this phone, in your book. (the NX-33 line, still true) |
| P1 | Same place, replaces the P0 line | Photos and videos stay on this phone, in your book. When and where they were taken is read here too, to help you remember. It is never put into your words. |
| P2 | The pre-sheet before the system's own permission question | Early Letters can show you photos from this phone, so you can pick the ones that go with a letter. It reads when and where they were taken, only on this phone. It does not try to work out who or what is in them. You choose what is kept. |
| P2 | Settings row, switch "Suggest moments", off by default | Suggest days worth a few words. Uses only the dates and places on your phone. Off clears what was kept. |
| P4 | Reminders sheet, per occasion | Remind me around these days. You choose them. Nothing about a place or a photo is in the reminder. |
| any | The short form for the store page and the policy summary | Your photos and videos stay on your phone. |

Apple permission string proposal for `NSPhotoLibraryUsageDescription` (P2 only; P0 and P1 add no key, UNVERIFIED against Apple, see section 13): "To show you your photos and videos so you can choose which ones go with a letter, and to read when and where they were taken, on this phone only." Counsel words the final text (C2). No location permission string is added in any phase: the place comes from the photo's own data, and the app never links Core Location (R4).

Honest edges the words must not hide: if a parent loses the phone, kept copies are lost with it unless they exported (D13, backup stays local as in NX-33 P1). "Stays on this phone" is true only while no phase uploads media; the first phase that does reopens every line above.

## 6. User stories

| # | As a | I want | So that |
|---|---|---|---|
| U1 | parent writing a letter about a day out | to pick the photos from that day and see the date they were taken | I do not have to remember the day or type it |
| U2 | parent | the place a picture was taken to appear as a name, and to correct or remove it | the letter's page says where we were, in a way I trust |
| U3 | parent with a full library | to pick a few from many without handing the app everything (Limited/Selected) | I stay in charge of what the app can see |
| U4 | parent who just came back from a trip | one gentle card that brings those days to the front | I tell {child} about them while I still remember |
| U5 | parent with videos of the first steps | to keep a clip with a letter | the book has the moment and my voice about it |
| U6 | parent who keeps a few family occasions | to choose which days I am reminded around, and add my own | the app never assumes what my family celebrates |
| U7 | parent going through a hard season | to stop every suggestion and reminder in one place and have it all cleared | nothing arrives that I did not want |
| U8 | co-parent on another phone | to see that a photo exists on the other phone | I am not told a letter is missing something that I cannot be shown |
| U9 | parent exporting the book | to choose whether places go in the file I share | I do not publish where we live by mistake |

## 7. Flows

**F-A, attach (P0 and P1).** Review or letter page, "Add a photo or video", the system picker, the choice returns, the app re-encodes to a stripped JPEG (P3 transcodes video) in its own folder, reads the date and place from the original while it is in a temporary file, deletes the temporary file, shows the "From the photo" lines.

**F-B, suggest (P2).** The parent turns on "Suggest moments" in Settings, sees the pre-sheet, the system asks for access, the app reads the allowlisted fields (R9) of the assets the system allows, builds clusters in memory by time and place (R16), shows at most one card on Tonight.

**F-C, remind (P4).** The parent picks occasions (R25), the planner schedules one local notification per occasion within the daily budget and quiet window, and the tap opens Tonight, never the library.

**Permission states (P2).**

| State | The app does | The parent sees |
|---|---|---|
| Not asked | Nothing reads the library. The picker still works | The normal "Add a photo or video" |
| Full access | Reads allowlisted fields on demand | Cards if the switch is on |
| Limited or Selected | Treats the allowed set as the whole library. Never nags for full | Cards only from the allowed set. A quiet "Choose more" that opens the system's own limited-library sheet |
| Denied or later revoked | Clears the cluster cache and the dismissed list at next launch; the picker still works | The Settings row says how to change it. No repeat ask |
| Photo deleted from the library after attach | Our stored copy stays (we copied it) | The letter is unchanged |

**Media states.**

| Item | P1 | P3 | Notes |
|---|---|---|---|
| Still photo (HEIC, JPEG, PNG) | Stored as a stripped JPEG, longest side 2048 px, at most 5 MB (NX-33 R2 numbers, proposed) | same | |
| Live Photo | Still image only; the motion part is not stored; label says "photo" | Decision D7: offer "keep the movement" or not | Mark UNVERIFIED how the picker hands over the pair |
| iCloud-only asset | Handled by R13 | same | |
| Video | Not supported (NX-33 R14 stays) | R21 to R24 | |
| RAW, animated image, panorama over limit | RAW and animated: refused with the calm line; panorama scaled | same | |

## 8. The check

Tags: EVIDENCE means the behaviour can be tested with a fixture and the repo state is read; HYPOTHESIS means demand, a number, or a behaviour of Apple that has not been confirmed on a device (test: none, study or spike). "Fails on old code" states what the tree has today.

### 8.1 Promise, permission, no analysis

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R1 | EVIDENCE | P0 on | Given each phase's promise line in section 5, When the build's capabilities are read, Then a line is shown only when its phase switch is on, and no on-screen or store string says "never read" or "not read" about the library once P2 is on. | No phase switches or media claims exist; NX-33 R-level strings are not built (no image library in `apps/mobile/package.json`, NX-33 searched 9 Nov, branch) | `[NX-39-R1] a promise line shows only when its phase is on and none denies a read that the build does` |
| NX-39-R2 | EVIDENCE | P0, P1 | Given the P0 or P1 build, When the picker opens, Then the app asks 0 permission questions and the source calls no full-library authorization API. | Nothing to call; this keeps it true | `[NX-39-R2] P1 asks no library permission question and calls no authorization API` |
| NX-39-R3 | EVIDENCE | P2 | Given P2 on and "Suggest moments" switched on, When the app first needs the library, Then the pre-sheet (section 5) shows once, then the system asks; Cancel on either leaves the switch off and the picker working; nothing re-asks in the same session. | Not built | `[NX-39-R3] declining the pre-sheet or the system question leaves the switch off and asks nothing again` |
| NX-39-R4 | EVIDENCE | P1, P2 | Given the built Info.plist, Then it has no `NSLocation*` key, the app links no Core Location, and the library key exists only when P2 is on and holds the exact text in section 5. | Passes by absence; the test keeps it true | `[NX-39-R4] the plist has no location key and the library key appears only with P2` |
| NX-39-R9 | EVIDENCE | P1 on | Given any code that touches media, Then the fields it reads are only: capture date, location (held in memory), media type, Live Photo subtype, duration, pixel size, file size. A scan of `apps/mobile/src` finds none of: Vision, ML Kit, face, caption, classify, scene, people, PHAssetCollection smart albums of "memories", Photos "moments" or "places" collections, speech recognition on a video, `fetch` in a media path. | Passes by absence | `[NX-39-R9] media code reads only allowlisted fields and calls no analysis or network API` |
| NX-39-R10 | EVIDENCE | P1 on | Given a letter with a picked picture, When the date and place lines show, Then the letter's words and recording are byte-identical (SHA-256 unchanged), the lines are stored in separate fields labelled "From the photo", no machine text enters the letter text, the transcript, the search index or the machine-edits log. | Not built | `[NX-39-R10] date and place lines never enter the words, the transcript or the search index` |

### 8.2 Metadata: date, place, precision

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R5 | EVIDENCE | P1 | Given a picked photo with a capture date, When it attaches, Then "Taken {date}" shows under it in the phone's own date style; the parent can change it with a date picker or clear it; a photo with no date shows no line and no error; the date is the local calendar day at the place's time zone if known, else the phone's (UNVERIFIED how the picker reports time zones). | NX-33 R3 stores no date | `[NX-39-R5] a picked photo's date shows, can be changed or cleared, and a missing date is quiet` |
| NX-39-R6 | EVIDENCE | P1 | Given a picked photo with coordinates, When it attaches, Then the coordinates are read into memory only, converted to a place name at city level (or region where the city is small, threshold proposed 15,000 people), the name is stored, the coordinates and any finer name are discarded, and 0 coordinates exist in the database, a file, the log or the cache afterwards. No venue, street, hospital, worship place or business name is ever stored or shown. | Not built | `[NX-39-R6] only a city-level name is kept and no coordinate survives` |
| NX-39-R7 | HYPOTHESIS | P1 | Given a coordinate, When the place name is found, Then 0 network calls carry a coordinate: the lookup uses a table bundled in the app (proposed: about 30,000 cities, size UNVERIFIED). If a spike shows the table is too big or too wrong, the fallback is no place line and a place the parent types; Apple's reverse geocoder (UNVERIFIED: believed to call Apple's servers; not opened) is used only if the founder and counsel choose it (D4, C7), and then the policy and label change. Test: spike BL-844 for size and accuracy; automated source scan for the no-network part. | n/a | `[NX-39-R7] the place lookup makes 0 network calls` (scan); size and accuracy by BL-844 |
| NX-39-R8 | EVIDENCE | P0 on | Given 10 fixture pictures with GPS, date, device and thumbnail in their Exif, When stored, exported or shared, Then 0 of 10 files contain an Exif, XMP or IPTC segment (NX-33 R3 kept and proven by a byte scan); a video file has no location atom or metadata track (UNVERIFIED how to prove). The date and place live only in the database. | NX-33 pipeline not built | `[NX-39-R8] 0 of 10 stored files carry any metadata segment, after export too` |

### 8.3 Library, states, special assets

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R11 | EVIDENCE | P2 | Given each permission state in section 7, Then the app behaves as the table says, including: Limited/Selected is treated as full-strength, never nags for full, and a revoked permission clears the cluster cache and dismissed list at next launch. API names and the "Choose more" system sheet are UNVERIFIED. | Not built | `[NX-39-R11] limited, denied and revoked states each behave as specified` |
| NX-39-R12 | EVIDENCE | P1 | Given a Live Photo, When picked, Then the still is stored, the motion part is dropped, 1 file is written and the label never says "video" or "live". | NX-33 R14 refuses the video part | `[NX-39-R12] a Live Photo stores its still only` |
| NX-39-R13 | EVIDENCE | P1, P2, P3 | Given an asset that is only in iCloud, When the parent picks it, Then the app shows "Getting it from your iCloud" with a progress line and Cancel, no other action is blocked, the letter keeps; on no network or failure, nothing attaches, 0 files remain, and the calm line shows; in the P2 grid, a thumbnail not on the phone shows a plain placeholder and the app never downloads in bulk. Date and place read from the metadata when the system gives it without the download (UNVERIFIED). | Not built | `[NX-39-R13] an iCloud-only asset downloads on demand, cancels cleanly and never in bulk` |
| NX-39-R14 | EVIDENCE | P1 on | Given a cancel, a decode failure, a format we do not keep, or a phone under the free-space threshold, When the parent tries, Then nothing is attached, 0 files are written, the letter is safe, and the line from NX-33 R14 shows. | NX-33 R14 not built | `[NX-39-R14] a failed pick writes 0 files and keeps the letter` |

### 8.4 Moments (P2)

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R15 | EVIDENCE | P2 | Given synthetic metadata for the fictional family "Asha" (never real data), When clusters are built, Then the function is pure, deterministic, uses only time and place, has no model and no network, and runs in `packages/core`. Rule (all numbers proposed, HYPOTHESIS): items on one local calendar day form a day; consecutive days whose places are within 50 km, or either has no place, form a moment; a moment needs at least 3 items; a day gap of more than 1 day ends a moment. | Not built | `[NX-39-R15] the same metadata always makes the same moments and no model is called` |
| NX-39-R16 | EVIDENCE | P2 | Given a moment, When Tonight shows it, Then one card shows at most 4 of the parent's own thumbnails in time order (no "best" chosen), the date range, the place name if there is one, and two buttons plus "Hide this one"; it never sits above the main "Tell {child} about today" action and never shows in first run. | Not built | `[NX-39-R16] one calm card, time order, not above the main action, not in first run` |
| NX-39-R17 | EVIDENCE | P2 | Given the card, Then it shows 0 numerals about photos, letters or days left, no "waiting" total, no "you have not", no "only"; "Not now" snoozes 14 days (proposed); no list of dismissed or snoozed moments exists anywhere. | Not built | `[NX-39-R17] no count, no gap wording and no list of skipped moments` |
| NX-39-R18 | EVIDENCE | P2 | Given "Suggest moments" is off (the default), Then 0 library reads happen. When it is switched off, Then the cluster cache and the dismissed list are deleted at once and 0 items remain. | Not built | `[NX-39-R18] off by default, and off clears the cache and the dismissed list` |
| NX-39-R19 | EVIDENCE | P2 | Given the parent taps the card, When they choose up to the letter's limit (D3), Then the letter opens in Speak or Type with them attached; if they leave without words, the pictures are dropped (NX-33 tab rule); no photo-only letter is created. | Not built | `[NX-39-R19] a moment becomes a letter only with the parent's words` |
| NX-39-R20 | EVIDENCE | P2 | Given a moment built around dates the parent has marked as a hard season (M13 rule 9 loss path), a hospital stay or a removed date, Then no card is offered on those dates, and "Stop these" is visible on every card. The app cannot know why; it only honours a range the parent set. | Loss-path controls are 1.1 per M13 rule 9 | `[NX-39-R20] a range the parent excludes never produces a card` |

### 8.5 Video (P3)

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R21 | HYPOTHESIS | P3 | Given a video, When picked, Then limits apply (all proposed): at most 60 seconds and 200 MB after the app's own conversion (720p, HEVC or H.264), the conversion runs off the main thread with progress and Cancel, under the free-space check ("this would leave less than 1 GB free", threshold UNVERIFIED), and a refused video says why in one calm line. Test: none, study of real clips by `user-research`; automated for the limits once set. | NX-33 R14 refuses video | `[NX-39-R21] a video over the limits is refused kindly and a kept one fits the budget` |
| NX-39-R22 | EVIDENCE | P3 | Given a kept video, Then it stays on the phone, is not in sync or backup, is in the export only if the parent keeps "Include videos" on after a size line ("About 640 MB in total", number is computed, never a target); export with videos off still opens and verifies. | Export has `photos: 0` and `photo: null` (`apps/mobile/src/lib/export/schema.ts`, read via NX-33, branch) | `[NX-39-R22] video stays local, joins the export only by choice, and the size is shown first` |
| NX-39-R23 | EVIDENCE | P3 | Given a video with speech, Then nothing transcribes, captions or summarises its sound (speech code is never called with a video); the stored file's audio is the original sound. | Passes by absence | `[NX-39-R23] no speech engine ever receives a video's audio` |
| NX-39-R24 | EVIDENCE | P3 | Given a video on a letter, When it shows, Then it never plays on its own, shows a still frame and a play control of 44 pt, respects Reduce Motion, and its accessibility label is the date and the letter's own first words (NX-33 R11 rule). | Not built | `[NX-39-R24] a video never autoplays and is labelled by the parent's words` |

### 8.6 Occasions and reminders (P4)

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R25 | EVIDENCE | P4 | Given the occasions screen, Then no occasion is selected by default, the list is in the same order for every phone (not reordered by locale, region, name, language or any photo place), the parent adds their own with their own label, and the parent confirms each date (lunar and Eid dates shift; no table claims to know). The list is the one the founder approves for BL-542. | BL-542 is `needs-decision` | `[NX-39-R25] no default, one order for everyone, parent confirms every date` |
| NX-39-R26 | EVIDENCE | P4 | Given a scheduled reminder, Then it is local, has no attachment, no photo, no place, no count, no child name unless "Names in notifications" is on (D-025), shows neutral words on the lock screen, passes the content rules, sends nothing between 21:30 and 07:00, and shares the one-a-day budget (a new type replaces a slot, never adds one). | Planner exists (`apps/mobile/src/lib/reminders/planner.ts`, per M13 rule 1; not read in this session) | `[NX-39-R26] a reminder carries no picture, no place and no count, and obeys the quiet window and the daily budget` |
| NX-39-R27 | HYPOTHESIS | P4 | Given "Remind me after days away" is on, When the app is opened after a moment ends, Then it may schedule one local notification for the next evening, with neutral words ("A few words about these days are waiting."); no home place is stored; "away" is defined only if the parent sets a home city themselves (D8, default none), otherwise any multi-day moment qualifies and the words never say "trip". The app never reads the library in the background: if the parent does not open the app, no reminder is scheduled (Apple background refresh UNVERIFIED and not relied on). Test: study of whether parents find it timely; automated for the scheduling rule. | Not built | `[NX-39-R27] a moments reminder is scheduled only at app open and never names a place or a trip` |
| NX-39-R28 | EVIDENCE | P4 | Given a tapped reminder, Then Tonight opens (its card, if any); the library is never opened, and nothing is attached automatically. | Not built | `[NX-39-R28] a reminder tap opens Tonight and attaches nothing` |
| NX-39-R29 | EVIDENCE | P2, P4 | Given the stop for reminders (master switch, M13 rule 9), Then it stops occasion and moment reminders too, and one tap from a card or a reminder's sheet reaches "Stop these". | Master switch exists per M13 rule 9; moment types do not | `[NX-39-R29] the reminders stop also stops occasion and moment reminders` |

### 8.7 Data, privacy, security, sharing

| Id | Tag | Phase | Given, When, Then | Fails on old code because | Test title (proposed) |
|---|---|---|---|---|---|
| NX-39-R30 | EVIDENCE | P1 on | Given every new local field (stored copy path, size, hash, date, place name, dismissed ids, cache), Then each is classed L4 in `DATA_CLASSIFICATION.md` (child photo rule 6; derived data inherits rule 2), protected with the device-file class that document requires for L4, and absent from analytics, logs, crash reports and URLs (LEGAL-REQ-014). A log canary with a fake coordinate and the fixture city finds 0 matches in logs. | Canary not built (`DATA_CLASSIFICATION.md` line 38 says "log canary not built") | `[NX-39-R30] a fake coordinate and place never appear in any log, analytics event or crash report` |
| NX-39-R31 | EVIDENCE | P1 on | Given Erase everything, Delete a book, Delete account, deleting a letter after the 30-day purge, or "Take it off", Then the stored copies, the date and place fields, the dismissed list and the cluster cache are deleted with them (0 left); Put back restores them within the 30 days. | NX-33 R5 to R7 are the base | `[NX-39-R31] erase paths remove copies, fields, cache and dismissed list` |
| NX-39-R32 | EVIDENCE | P1 on | Given an export, a shared book view, a co-parent view or a printed book, Then coordinates are never present in any of them; place names are present in the parent's own export only when "Include places" is on (default on for their own file, shown on the export screen, D5); they are absent by default from anything shown to another person or printed; the export screen says plainly that the file is not encrypted and may carry places. | Export format has no place field | `[NX-39-R32] no coordinate in any output and places are absent from shared views by default` |
| NX-39-R33 | EVIDENCE | all | Given sync on (Family group), When a letter with media syncs, Then `photo_path` stays null, 0 bytes of media upload, and none of the date, place, dismissed or cache fields is in the outbox payload (serializer allowlist test). The second phone shows "The photo is on the other phone." (NX-33 R16 line). | `packages/api/src/server/sync.ts` names `photo_path` (as NX-33 cites) | `[NX-39-R33] the sync payload carries no media and no derived field` |
| NX-39-R34 | EVIDENCE | all | Given opt-in analytics (off in every 1.0 profile, D-124 item 3), Then only these events may be added to the catalog first: `media_added` (props: source, kind), `moment_card_opened`, `moment_card_hidden`, `moments_switch_changed` (prop: on or off), `occasion_reminder_changed`. No prop is a place, date, count of media or count of moments. | None in the catalog | `[NX-39-R34] media events carry no place, date or count` |
| NX-39-R35 | EVIDENCE | P1 on | Given VoiceOver, Dynamic Type AX5 and Reduce Motion, Then every control is 44 pt or more; the "From the photo" lines read as "Taken 12 Dec" and "Near Lisbon"; the card is one grouped element; a thumbnail's label is the date and the parent's own words (NX-33 R11), never generated; the grid is one column at AX5. | Not built | `[NX-39-R35] the chips, the card and the thumbnails are labelled by the parent's words and fit AX5` |
| NX-39-R36 | HYPOTHESIS | all | Given App lock on, Then the library views are behind it, and the app-switcher snapshot is blank on screens that show a photo (NX-33 flagged this UNVERIFIED). Test: device row. | UNVERIFIED today | device row only |
| NX-39-R37 | EVIDENCE | all | Given a phase's build switch off, Then its screens, reads and notifications do not exist; stored data still exports and erases; the remote kill switch `photos` (default off, `packages/api/src/remote-config.ts` per NX-33) can switch P2 and later off remotely. Rollback is a build with the switch off. | New switches | `[NX-39-R37] each phase switch removes its screens and reads and leaves export and erase working` |
| NX-39-R38 | HYPOTHESIS | P1 on | Given a picture of another person or child, Then the app does nothing different (no detection, no consent prompt) and the parent's Terms position, the other-people position and the child's-image position are as counsel answers (C5, C6). Test: none, counsel. | n/a | none |

Door lines (COORDINATION section 10 and PRIV-R21), for every sheet a person agrees to:

- Shown: the pre-sheet text in section 5; the picker is Apple's own sheet; the Settings row says what it does; each occasion row says what the reminder will say.
- Records: on the phone only, the stored copy, its size and hash, the date, the city-level place name, the dismissed list, the cluster cache, the occasion choices, the parent's home city if they set one. No coordinates. No face data. Nothing on a server.
- Never: analyse what is in a picture or video; use a face; caption; tag; rank "best"; put a picture, a place or a count in a notification; infer a religion, culture or ethnicity; read the library when the switch is off; read it in the background; upload media or the derived fields; share from the library views; count what the parent has not written.
- Decline and withdraw: the picker's Cancel adds nothing; "Not now", "Hide this one" and "Stop these" exist on every card; Settings turns each phase off and clears what it kept; Erase everything removes all of it; the iPhone's own Settings can revoke access at any time and the app clears its cache.

## 9. Non-goals

- Reading what is in a picture or video: no faces, scenes, objects, text, pets, people, "best photo" choice, captions, tags, titles, transcripts of video sound.
- Automatic letters, drafts or prefilled words from a photo, a place or a date.
- A "memories" reel, slideshow, year-in-review or auto-made montage.
- Any upload, backup, sync or cloud copy of media (this file), and any change to the privacy label in the other direction.
- A camera in the app (NX-33 R15 stays a hypothesis).
- Storing coordinates, street names, venues, or a "home" the app worked out.
- Using the library to count, grade or chase the parent (no streaks, points, badges, gaps).
- Apple Journaling Suggestions (BL-545) is a separate spike; it may replace P2's own library read (D14).
- Anything in Build 12.

## 10. Phased release plan and gating

| Phase | What ships | Promise line (section 5) | Permission asked | Gate before the switch goes on in `production` | Sizes and rows |
|---|---|---|---|---|---|
| P0 | NX-33 as designed: one picked photo per letter, no library, stripped, local, in the export. NX-33 itself is unchanged by this file except that its promise line is now one rung of section 5 | P0 line | None | Counsel on label and policy (NX-33), the library dependency review, device rows | M. BL-847 |
| P1 | The picker also returns the date and a city-level place name, shown to the parent only as "From the photo" lines, stored separately from the file and the words; Live Photo stills; iCloud-on-demand | P1 line | None (picker). No location key | D2, D4, D5; counsel C1, C3, C7, C10; BL-843 device spike passed; place lookup passes BL-844; promise words registered (BL-842) | M. BL-844, BL-846, BL-848 |
| P2 | Limited-library access; "Suggest moments" off by default; one Tonight card at a time; up to the letter limit (D3) | P2 lines | Photo library read, with Limited/Selected honoured | D9 (amend M13 rule 4 and Tier C), D3, D14; counsel C1, C2, C4, C10; BL-850 label design agreed; a parent study read-out (BL-857) with thresholds written before | M. BL-853 |
| P3 | Video, with limits, local, in the export by choice | P1 line extended to videos | None (picker) or the P2 library | D6, D7; storage and conversion measured on an iPhone SE class device (UNVERIFIED which devices the app supports); counsel C13 | L. BL-854 |
| P4 | Occasion reminders from a list the parent picks; moments reminder scheduled at app open | P4 line | Notifications (already asked by reminders) | D8, BL-542's list approved; counsel C4, C11; the `reminders owner` confirms the budget and quiet window | M. BL-855 |

Switches (names proposed; follow the ACCOUNT_DELETION pattern): `EXPO_PUBLIC_PHOTOS` (P0), `EXPO_PUBLIC_MEDIA_METADATA` (P1), `EXPO_PUBLIC_MOMENTS` (P2), `EXPO_PUBLIC_VIDEO` (P3), `EXPO_PUBLIC_OCCASIONS` (P4). Each is off in `production` until its gate is met, on in `testflight` and `preview` first. Each phase ships on its own: a phase never waits for the next, and a later phase never makes an earlier promise false.

Order: P0 then P1 then P2 then P3 or P4 in either order after P1. P2 and P3 do not depend on each other. Everything waits for Build 12 to ship. The document work (counsel brief, promise words, specs, privacy design, device spike) can run now in parallel and is docs-only or device-only.

## 11. Founder decisions (D-list; recommendation and default)

When he takes these, `product` drafts D-154 onward as `Proposed` from `next-id.mjs`; only he decides. "Default" is what happens if he says nothing.

| # | Decision | Recommendation | Default if silent |
|---|---|---|---|
| D1 | Rewrite the NX-33 promise so memories can come from the whole phone's photos and videos, with metadata read on the phone to help the parent remember; on-device by default; nothing leaves unless a later phase says so. **Decided in direction by the founder, 10 Nov.** Wording (section 5) and each phase's release still need counsel and his approval | Accepted as stated; proceed through the phases in section 10 | Direction stands; no phase ships without his word and counsel's |
| D2 | P1 mechanism: the system picker, reading the date and place from the chosen file (no permission), or PhotoKit Limited access in P1 | The picker in P1 (least change to the promise); PhotoKit only at P2. UNVERIFIED that the picker's returned file carries date and place on a current iOS (BL-843) | Picker |
| D3 | Pictures per letter | One in P0 and P1; up to 5 from P2 (the number BL-544 scoped) | As recommended |
| D4 | Where the place name comes from | A table bundled in the app (no network). Apple's geocoder only if counsel and he choose it. If the table fails BL-844, the parent types the place | Bundled table; none if it fails |
| D5 | Does the date and place go in the parent's own export, and in anything shown to others or printed | Own export: on, as text only, switch on the export screen. Others and print: off by default, per letter on request | As recommended |
| D6 | Video: in which plan and with which limits | In Free, never behind Plus, with the limits in R21 after BL-854 measures; not synced | Free; limits as R21 proposed |
| D7 | Live Photos: still only, or keep the movement in P3 | Still only in P1; decide at P3 | Still only |
| D8 | Occasions: the list (BL-542), and whether a "home" city can be set for "after days away" | List as BL-542 drafted, parent's own dates always allowed; no home setting in P4 | List waits for his approval; no home |
| D9 | Amend M13 rule 4 and mark Tier C (`NOTIFICATIONS.md`) as reopened: the library may be read for dates and places on the phone, with the switch, never for faces, scenes or counts | Amend, with the exact words of section 3 | P2 and P4 do not start |
| D10 | The parent-facing name for the area (internal "Memory Library") | A plain name from the glossary, chosen by `content`; the internal name stays internal (CR-25) | `content` proposes, he picks |
| D11 | Which release carries which phase; Build 12 carries none | P0 and P1 in a 1.0.x or 1.1 after Build 12; P2 onward after the study (BL-857) and counsel | Not before he names a release |
| D12 | Brand line "Photos show what {child} looked like. Letters tell {child} what it felt like." still stands while the app shows photos | Keep; it still says the letter is the product | Kept |
| D13 | Backup: media stays local in every phase here (NX-33 D3 option P1), with the honest line that a lost phone loses the stored copy unless exported | Keep local; revisit with the recording restore drill | Local |
| D14 | Apple Journaling Suggestions (BL-545) as a spike that could replace P2's own library read | Run the spike in parallel; do not build P2 until it answers | Spike only |

## 12. Counsel questions (`legal`, `regulatory-affairs`; the founder takes them to counsel; all UNVERIFIED legally)

- C1: Does reading photo metadata on the phone, with nothing leaving it, change the App Privacy label ("Photos or Videos", "Precise or Coarse Location") or leave "Data Not Collected"? Apple's definition of collected (data leaving the device) was not opened.
- C2: Wording for `NSPhotoLibraryUsageDescription` and the pre-sheet, and App Review's view of guideline 5.1.1 (purpose, minimisation) for a picker-sufficient use case versus a library read (C10).
- C3: Is a city-level place derived on the phone "precise geolocation" under the state laws cited by LEGAL-REQ-013's source line (CR-022, CR-031)? What is the safe granularity? Is a place near a hospital or clinic health data (MHMDA)?
- C4: Occasion lists and place can point to religion or health; is a parent-chosen list with no inference outside special-category processing? Which regions does the 1.0 audience include (UNVERIFIED)?
- C5: Pictures of children: any added consent, notice or age position, given the parent is the user and nothing leaves the phone?
- C6: Pictures and video of other people (relatives, other children, other parents' voices): is the parent's own-book position enough? We run no face analysis; confirm no biometric statute is touched.
- C7: If a geocoder (Apple's) is used, what disclosures, policy and label changes follow (D4)?
- C8: Export and sharing with places inside: a warning on the export screen, and the default for shared views and print (D5).
- C9: Claims registry: the P0, P1 and P2 lines in section 5, and removal of any line that says the library is not read.
- C10: Is a library read at P2 justified over the picker in App Review terms?
- C11: Local notification content with neutral text and parent-chosen occasions: any marketing-consent, quiet-hours or religion-adjacent concerns?
- C12: iPhone and iCloud device backups include app files; does "stays on this phone" survive that?
- C13: Video with other people's voices kept on the phone, and in an export the parent shares.

## 13. Not verified

Apple documentation (PHPicker, PhotoKit authorization levels and the Limited/Selected sheet, CLGeocoder, Live Photo handling, iCloud asset download, background refresh, Core Location linking): none was opened for this file. Expo's `expo-image-picker` behaviour: not opened; NX-33's claims about it are cited, not rechecked. Whether the picker's returned file carries date and place on current iOS and whether the person can strip location in the picker (BL-843). City table size and accuracy (BL-844). Video conversion cost on the oldest supported iPhone. The files this document cites only through NX-33 or the branch (`_CONVENTIONS.md`, NX-33, `schema.ts`, `sync.ts`, `remote-config.ts`, `planner.ts`), and NX-36's Build 12 scope. Whether #707's Build 12 rows or any open PR already add an image library. Whether the local store has a migration mechanism (NX-33 raised it). Whether `rules.test.ts` accepts the section 5 words. Supabase or any storage cost (none is needed; nothing uploads). Real demand: every user story is HYPOTHESIS until BL-857.

## 14. Success measures (none counts a gap)

Opt-in and off in 1.0 (D-124 item 3); until analytics is on, the first three come from TestFlight interviews (BL-857).

- Of the letters a parent keeps, the share that carry a picture or video they chose (celebrates what exists; never the share without).
- A one-tap "Did that help you remember?" after keeping a letter that used a "From the photo" line (shown rarely, never twice in a week; the answer stays on the phone unless analytics is on).
- Moment cards the parent opens, as a share of cards shown, read only by the team, never shown to the parent.
- Trust guardrails that must not rise: "Stop these" taps, reminder switch-offs, permission revocations after P2, privacy support contacts, store reviews that mention photos or privacy.
- Ease: time from tapping "Add" to the picture on the letter, and no lost letters from a failed attach (the number must be zero).

Not measures: photos or moments not yet written about, days since a letter, size of anyone's library, streaks, points, badges.

## 15. Cross-team delivery plan

Sequencing after Build 12. Step 0 (can start now, no app code): counsel brief BL-841, device spike BL-843, specs BL-849, privacy design BL-850, threat model BL-851, study plan BL-857. Step 1 (after Build 12 ships and D11 names a release): P0 (BL-847), data schema (BL-846), place table (BL-844), guard tests (BL-845). Step 2: P1 (BL-848) with the analytics catalog entry (BL-856) and sync allowlist test (BL-852). Step 3: P2 (BL-853) after D9, D14 and the study. Step 4: P3 (BL-854) and P4 (BL-855) in either order. Release switches and the TestFlight text come from `ops` (BL-858) each phase.

RACI by work package (R responsible, A accountable, C consulted, I informed). One A per row.

| Work package | prod | design | mob | data | sync | priv | comp | sec | legal | cont | qa | anal | ur | ops | arch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WP1 Counsel brief and answers (C1 to C13) | A | I | C | C | I | R | C | C | R | I | I | I | I | I | C |
| WP2 Promise words, permission string, glossary (BL-842) | C | C | I | I | I | C | C | I | A | R | C | I | C | I | I |
| WP3 Device spike: picker metadata, Live Photo, iCloud, limited (BL-843) | C | I | R | I | I | C | I | C | I | I | A | I | I | I | C |
| WP4 Place-name table and lookup (BL-844) | C | I | R | C | I | C | I | C | C | I | A | I | I | I | C |
| WP5 Local schema, classification rows, erase and export design (BL-846) | C | I | C | R | C | C | C | C | I | I | C | I | I | I | A |
| WP6 P0 build, NX-33 (BL-847) | A | C | R | C | I | C | C | C | C | C | C | I | I | C | I |
| WP7 Guard tests: no analysis, no network, plist, allowlist (BL-845) | C | I | C | I | C | C | C | C | I | I | R | C | I | I | A |
| WP8 P1 build: chips, separate fields, Live Photo, iCloud (BL-848) | A | C | R | C | I | C | C | C | I | C | C | I | I | C | C |
| WP9 Specs: chips, card, pre-sheet, states, AX5 (BL-849) | C | R | C | I | I | I | I | I | I | C | C | I | C | I | A |
| WP10 Privacy label, data map, log canary, counsel evidence (BL-850) | C | I | C | C | I | R | A | C | C | I | C | C | I | I | I |
| WP11 Threat model: thumbnails, snapshot, backups, temp files (BL-851) | I | I | C | C | C | C | C | R | I | I | C | I | I | C | A |
| WP12 Sync allowlist test (BL-852) | I | I | C | C | R | C | I | C | I | I | A | I | I | I | I |
| WP13 P2 library access and moment cards (BL-853) | A | C | R | C | I | C | C | C | C | C | C | C | C | C | C |
| WP14 P3 video (BL-854) | A | C | R | C | I | C | C | C | C | C | C | I | C | C | C |
| WP15 P4 occasions and reminders (BL-855) | A | C | R | I | I | C | C | I | C | C | C | C | C | C | I |
| WP16 Analytics catalog and allowlist (BL-856) | C | I | C | I | I | C | C | I | I | I | C | R | I | I | A |
| WP17 Parent study and thresholds (BL-857) | A | C | I | I | I | C | I | I | C | C | I | C | R | I | I |
| WP18 Switches, TestFlight text, kill-switch drill (BL-858) | C | I | C | I | C | I | C | C | I | C | C | I | I | R | A |

What each produces: `product` this file, rows, D-drafts; `design-systems` specs and wireframes; `mobile` the picker, reads, screens and erase and export changes; `data-architect` the local schema and classification rows; `sync` the allowlist test and the statement that nothing syncs; `privacy` the label design and canary fixtures; `compliance-engineer` the plist and claims checks wired into CI; `security` the threat model; `legal` the counsel brief and registry entries; `content` the words; `qa` the device rows, guard tests and the spike's evidence; `analytics` the catalog entries; `user-research` the study plan and read-out; `ops` the switches, notes for App Review and the release text; `principal-architect` the ADR on on-device media metadata and the review of the schema and the no-network design. Dependencies: WP2 waits on WP1; WP8 waits on WP3, WP4, WP5, WP6; WP13 waits on D9, D14, WP17 and WP10; WP14 waits on WP8; WP15 waits on D8 and BL-542; every build row waits on Build 12 shipping and D11.

## 16. Trace and tests

Id convention: `_CONVENTIONS.md`. All paths are proposed (none exist). Layers: unit tests in `apps/mobile/test/` and `packages/core/test/`; device rows named when `qa` allocates S1 ids (this file takes none; `qa` re-scans at merge).

| Id | Refines | Test (layer, file) | Device or study |
|---|---|---|---|
| NX-39-R1 | NX-33 claims; BL-830 pattern | `packages/content/test/claims-capabilities.test.ts` (extend) | none |
| NX-39-R2, R4 | NX-33-R1; plist | `apps/mobile/test/media-permissions.test.ts` | spike BL-843 |
| NX-39-R3, R11 | P2 states | same file | device: limited, denied, revoked |
| NX-39-R5, R6, R10, R12, R14 | NX-33-R1, R14; F09 | `apps/mobile/test/media-metadata.test.ts` | device: picker |
| NX-39-R7 | D4 | `apps/mobile/test/media-no-network.test.ts`; `packages/core/test/place-name.test.ts` | spike BL-844 |
| NX-39-R8 | LEGAL-REQ-013; NX-33-R3 | `apps/mobile/test/media-encode.test.ts` | none |
| NX-39-R9 | constitution; NX-33-R4 | `apps/mobile/test/media-no-machine.test.ts` | none |
| NX-39-R13 | iCloud | `apps/mobile/test/media-icloud.test.ts` | device |
| NX-39-R15 to R20 | P2 | `packages/core/test/moments.test.ts`; `apps/mobile/test/moments-card.test.ts` | device |
| NX-39-R21 to R24 | P3 | `apps/mobile/test/video-*.test.ts` | device: SE class; study |
| NX-39-R25 to R29 | P4; BL-542 | `apps/mobile/test/occasions.test.ts`; planner tests | study |
| NX-39-R30 | LEGAL-REQ-014; DATA_CLASSIFICATION | `supabase/tests/classification.test.mjs` (no change expected); log canary `scripts/` (proposed) | none |
| NX-39-R31, R32 | F15; NX-33-R5 to R8 | `apps/mobile/test/erase-everything.test.ts`, `export-media.test.ts` | device: container check |
| NX-39-R33 | NX-33-R16 | `apps/mobile/test/sync-media.test.ts` | none |
| NX-39-R34 | analytics | `packages/analytics/test/catalog.test.ts` (extend) | none |
| NX-39-R35, R36 | WCAG 1.1.1; A-NFR-005 to -007 | `apps/mobile/test/media-a11y.test.ts` | device: VoiceOver, AX5, snapshot |
| NX-39-R37 | switches | `apps/mobile/test/media-switches.test.ts` | none |
| NX-39-R38 | counsel | none | counsel |

Trace: NX-39-R1..R38 -> LEGAL-REQ-013, LEGAL-REQ-014, DATA_CLASSIFICATION rules 2 and 6, F09, F13, F15, A-NFR-005, A-NFR-006, A-NFR-007, NX-33-R1..R16, BL-542, BL-543, BL-544, BL-545. (Ids R1 to R38 are not in reading order in the tables; each id is used once.)
