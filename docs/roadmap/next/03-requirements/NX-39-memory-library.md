# NX-39 v2: Memory Library: photos and videos from the phone, with the date they carry, to help a parent remember

Status: v2, 10 Nov 2026 (UTC), after a nine-lens council review and the CTO's (Karma) rulings. Amended 10 Nov after the engineer's ten points on PR #754 (council record section 8; Karma's reversible rulings). Docs only. Author: Chief Product Officer (Claude role), for `product`. Replaces v1 (commit 359f4ea, PR #747) in place. The review record, the merged counsel brief and every lens verdict are in `docs/roadmap/next/03-requirements/NX-39-council-record-10nov.md`. Backlog rows BL-841 to BL-858 are rewritten and BL-859 to BL-880 added in `docs/BACKLOG.md`.

Readiness: not scored. Nothing here is a Build 12 task. What keeps it from ready: the founder decisions in section 10, counsel's answers (record section 5), the device spikes (BL-843, BL-871, BL-872), the parent study (BL-857, BL-879), and Apple documentation that no lens fully read (section 14).

| | |
|---|---|
| Tag | EVIDENCE for what repo files say (read 10 Nov). HYPOTHESIS for every demand claim, every number marked "proposed" and every statement about how an Apple API behaves unless section 14 says a page was read |
| Refines | NX-33 (photos, branch `docs/nx-33-photos-8nov`), F09, F13, F15, LEGAL-REQ-007, -011, -013, -014 (`docs/legal/ENGINEERING_REQUIREMENTS.md`), `DATA_CLASSIFICATION.md` rules 2 and 6, `docs/BACKLOG.md` M13 rule 4, BL-542 to BL-545, `docs/design/NOTIFICATIONS.md`, `docs/design/notifications/PARENT_STUDY_PLAN.md` Q4 and Q5 |
| Companion drafts | #745 ADR (index shape and phase table superseded by sections 3 and 7 here), #746 flows, #748 privacy analysis, #749 benchmark, #751 consent and surfacing spec (CS-S1 to CS-S15) |
| Size | L in total; every phase is its own M (P3 is L; P2 is split into three) |
| Constitution | The machine may remove and repair, never add meaning (`CLAUDE.md`). Section 4 tests each choice against it |

## 0. What changed from v1, in six lines

1. One phase table replaces the three that disagreed (v1 section 10, ADR section 14, benchmark section 6). Section 3.
2. The founder's "2 to 3 reads a day" is met only as far as iOS allows. Section 1.2.
3. No notification is ever derived from the library. Reminders come from days the parent typed. Section 7, R26 and R27.
4. The stored index is moments only (a day range and a city key); no per-asset row, no place finer than a city, no "home". Parent decisions live in a separate store that survives a rebuild. R40, R41.
5. Cards show a date only. A place appears after a tap, on a kept item, never on a card or in a notification. R16.
6. Twenty-three requirements are new (R39 to R61); nine are rewritten; the rest are kept with their ids.

## 1. The founder's direction, and what is and is not met

### 1.1 Direction

On 10 Nov the founder said the NX-33 promise (picker only, no location, no library) is worth rewriting because families' memories live in the photos and videos they take every day. He wants the app to (1) attach pictures and videos to a letter and (2) remind the parent around travel, festivals, holidays and trips, from the photo and video metadata. Later on 10 Nov he added: a beautiful permission and consent experience, and the app reading library information in a batch about 2 to 3 times a day, to surface things in the app, by push and by other nudges. This is decision D1, "decided in direction". Wording and every release still need counsel and his approval.

### 1.2 What is met, and where iOS stops us (plain record)

| Ask | What v2 builds | Why not more |
|---|---|---|
| Attach pictures and videos | P0 and P1 (picker), P2a (library chooser on tap), P3 (video) | Met in full. |
| Date and place from the photo | Date always; a city name if the BL-843 spike shows the picker file carries it; city only on a kept item | Place on a card or in a notification is refused (privacy, design, CLO, CISO agree). |
| A beautiful permission and consent experience | CS-S1 to CS-S4 from #751, judged by whether a parent can say what it does and whether No is comfortable, not by the yes-rate (R48) | A persuasive sheet that raises yes without raising comprehension is a dark pattern (UR-14). |
| About 2 to 3 reads a day | Base: a read each time the app is opened, with a ceiling. Optional: a best-effort background top-up, a separate switch with its own consent, built behind a flag that is off in production, ceiling 3 a day, never a floor (R44 to R46) | iOS gives no schedule. Apple's text says the system decides when background work runs (Apple "Choosing Background Strategies", read by CAIO, CPO-privacy, CISO). A force-quit, Low Power Mode or Background App Refresh turned off can mean zero runs (partly read, partly UNVERIFIED; section 14). No number goes in any parent copy because we cannot keep it. The top-up does not ship until the gates in R46 pass. Under Limited access it may see nothing new (UNVERIFIED; BL-871 decides). |
| Surface in app | Tonight card (date only), composer shelf, in-app "days away" card (P4b) | Met. |
| Surface by push | Local push only for days the parent typed (P4a). None derived from the library. | A notification that exists because of a library read discloses a derived fact by existing, whatever its words (privacy lens; CISO; CAIO; CFO). The founder's request is not met here, on purpose. |
| Other nudges | The same in-app cards; the share-sheet route (CS-S10) stays spec only | A share extension adds a target the plist test bans (R51). It needs a separate decision. |

The founder's request is therefore met as far as iOS and the privacy rules allow: reading on open, plus a best-effort overnight top-up if every gate passes, surfacing in the app, and push only from days the parent typed.

## 2. Which earlier rules this file supersedes, keeps, or leaves for decision

Honest summary: v1 listed five reversals. v2 lists six. Each needs the founder (section 10) and, where marked, counsel.

| # | Earlier rule | What v2 does | From |
|---|---|---|---|
| S1 | System picker only, no library (NX-33 Never and R1; BL-544) | KEPT for P0 and P1. SUPERSEDED at P2a: a library read on tap, Limited honoured. Needs D9, C1, C2, C10 | P2a |
| S2 | Strip location, date and camera (NX-33 R3) | SPLIT. KEPT: the stored file carries no Exif, XMP, IPTC or location. SUPERSEDED: the date, and a city name if kept by the parent, live in separate local fields shown to the parent, never in the letter | P1 |
| S3 | "Never read a photo's location or date", "never read the library, including dates and counts" (NX-33; M13 rule 4; Tier C) | SUPERSEDED in part: dates and city keys are read on the phone, metadata only. KEPT: no faces, scenes, objects, captions, text recognition, no counts shown | P1, P2 |
| S4 | No video (NX-33 R14) | SUPERSEDED at P3 | P3 |
| S5 | One photo per letter | OPEN for D3, default in section 6 | P2a |
| S6 (NEW) | "Never read it in the background" (v1 R27 and door line; ADR section 4 "no background modes"; LEGAL-REQ-011 "none", enforced by `apps/mobile/scripts/preflight-testflight.mjs` lines 575 to 576) | NOT reversed for P0 to P2b. P2c is a separate switch that would reverse it, and only the founder with counsel can. Until a recorded ruling, the preflight rule stays and the P2c flag stays off in every shipped profile (R4, R46) | P2c |
| K1 | No photo in a notification, widget, lock screen or analytics | KEPT, no exception; extended to place, count, and any library-derived notification at all | all |
| K2 | No face detection, caption, tag, "best photo", reel | KEPT, hardened (R9) | all |
| K3 | A picture is never the letter | KEPT | all |
| K4 | No sharing from library views | KEPT | all |
| K5 | LEGAL-REQ-013 strip before upload or export | KEPT in full; export carries the stored stripped copy only (R32) | all |
| K6 | Quiet window 21:30 to 07:00, neutral lock-screen text, traditions chosen never inferred | KEPT. The v1 "one a day" is dropped: it disagreed with the weekly cadence in `planner.ts` (R61) | P4a |
| K7 | Photos local, in the export, not synced | KEPT (R33, R54) | all |
| K8 | "Trip" only if the parent typed it | KEPT; the app says "days" | P2, P4 |
| K9 | Brand line "Photos show what {child} looked like. Letters tell {child} what it felt like." | KEPT (D12) | all |

Two sentences in the old product text become false and must not ship: "the rest of your library is not read" (`COPY_INVENTORY.md`) at P2a, and every "only when you open the app" at P2c (BL-842, BL-867 own the words).

## 3. The one phase table

Replaces v1 section 10, the ADR section 14 and the benchmark section 6. Source: CAIO section 5, adopted by the CTO.

| Phase | What ships | Permission | Reads | Persisted | Gate before the switch goes on in `production` |
|---|---|---|---|---|---|
| P0 | NX-33: picker, one photo per letter, stripped copy | None | The picked file only | The stripped copy | Counsel on the NX-33 label; plist and snapshot checks (R4, R36) |
| P1 | P0 plus the date and, if BL-843 and BL-844 pass, a city name from the picked file. If either fails, date only | None | The picked file only | Date and city name in separate fields | BL-843 spike passes (does the picker return a metadata-bearing file with no prompt, also from Limited); BL-844 for the city; counsel C1, C3, C7, C10; promise words registered |
| P2a | "Add from your library": a chooser by date range, Limited first-class, several per letter | Photo library read, asked on a tap, never at launch | Foreground, user-initiated | Nothing beyond the attached copies | D9 amended; C1, C2, C10; BL-850 label design; BL-861 consent machine; the promise words pass the comprehension bar (R59) |
| P2b | "Suggest days", off by default; one card at a time; a catch-up read on open | The same permission, asked at the switch | Foreground only | Moments rows (day range, city key, flags) and a cursor; decisions in their own store | BL-871 (Limited visibility) answered; the log canary and metadata-only scanner running (R30, R9); the study pass line met (R59); counsel tier B |
| P2c | "Also look when the app is closed", an optional best-effort top-up | None new | Background, best effort, ceiling 3 a day | A last-looked time only | All of: BL-871 and BL-872 done; counsel ruling on `UIBackgroundModes` and on Apple purpose-string completeness; the founder's recorded ruling on S6; the study pass line; the log canary in the background path |
| P3 | Video | None, or P2a | Per P2a | Video copies | Measured on an SE-class phone; counsel C13 and CB-9; container scan proof (R8) |
| P4a | Occasions the parent types; local reminders on those days | Notifications | None | The parent's occasions | CB-21 asked; one shared cap number (R61); fixed content keys (R26). Can ship before P2a |
| P4b | An in-app "days away" card on open | None | From P2b | None extra | Ships with P2b, never alone. No notification, ever |

Switches (names proposed): `EXPO_PUBLIC_PHOTOS` (P0), `EXPO_PUBLIC_MEDIA_METADATA` (P1), `EXPO_PUBLIC_LIBRARY_CHOOSER` (P2a), `EXPO_PUBLIC_MOMENTS` (P2b, with P4b), `EXPO_PUBLIC_MOMENTS_BACKGROUND` (P2c), `EXPO_PUBLIC_VIDEO` (P3), `EXPO_PUBLIC_OCCASIONS` (P4a). Each is off in `production` until its gate passes, on in `testflight` and `preview` first (P2c excepted: see R46). Each phase ships alone and a later phase never makes an earlier promise false. Build all of P2 onward behind switches that are off; nothing in P2a to P3 is exposed to a parent until its row in this table is signed.

Order: P0, P1, then P4a and P2a in either order, then P2b, then P3; P2c last and optionally. The CPO's preferred order (P4a before P2) is available because P4a needs no library; the founder can take it when he names a release (F1, section 10); the default is P0, P1, P2a, P2b, P3, P4a.

## 4. Design constraints, tested as constraints

| Constraint | What proves it |
|---|---|
| Metadata only: dates, a city key, flags. No content analysis | R9 (AST allowlist with positive controls), R15 |
| All processing on the phone | R7, R33, R54: no network call carries a coordinate, a date or a file |
| No library-derived notification | R27 |
| Limited and Selected work first-class | R11 |
| No religion, ethnicity or culture inferred; the parent types occasions | R25 |
| Place: a city key only, never coordinates, never on a card or notification | R6, R16, R40 |
| Child photos are L4; other people's photos need a consent position | R30, R38 |
| Reading is not notifying | R44, R61: reads have no input into the number of notifications |
| The app never says it "found", "noticed" or "knows" | R17, R55 |

## 5. What the parent sees, and the promise (candidates for counsel)

A parent writing a letter taps "Add a photo or video", picks from Apple's own sheet, and sees quietly under each picture what the picture's own data says ("Taken 12 Dec", and, if the parent keeps it, a city name). They can change or clear either. Later, if they switch on suggestions, Tonight may show one card with a date range and two choices; the place and the pictures appear only after the tap, in the chooser. "Not now" puts it away for 14 days. "Hide this one" removes it until the parent undoes it on a page they can open. A ledger page shows what is on, when it last looked, and a one-tap off and a one-tap forget (R49).

### 5.1 Promise wording is not ruled

The promise wording is counsel's and the founder's. v1's short form "Your photos and videos stay on your phone" is withdrawn: it is an express claim that backup, an iCloud download, export, print and synced letter words contradict (CLO objection 1; CMO O3; privacy row 18). The candidates below are for counsel, none is live, and none has been run through `rules.test.ts`.

| Id | Candidate | Source | What counsel must settle |
|---|---|---|---|
| PW-A | "Put the photo beside the words you said. Early Letters shows when it was taken, and the photo stays with your letter, on your phone and in your iPhone's own backup if you use one." | CMO A | Depends on BL-843; drop "when it was taken" if the date fails |
| PW-B | "We do not receive your photos, videos, or when and where they were taken." | CLO; CMO C | Is "receive" the right verb for the label; where the backup, print and export edges sit (beside the claim, not behind a link) |
| PW-C | "Photos and videos you add stay on this phone, in your book, and in your iPhone's own backup if you use one." | Privacy 9.1 row 18 | The same |
| PW-D (P2a and later, control line) | "You choose what Early Letters can see. It reads only the dates of the photos you allow, it never looks inside them, and the words are always yours." | CMO B, "places" removed to match R16 | "Never looks inside" needs R9 proof |

The backup-aware wording is needed under every candidate (record section 4, item T7). The `NSPhotoLibraryUsageDescription` string is one sentence about purpose with no promise inside it, and says the app also reads while closed if and only if P2c is on in that build (CMO-4, privacy 3.2, R56). Draft for counsel only: "{app} uses the dates in your photos and videos to help you find pictures for a letter." The second clause ("It can do this when the app is closed.") exists only in a P2c build.

## 6. One table of numbers (owner `product`; every value proposed, founder may change)

This table is the only place these numbers live. #746 and #751 follow it.

| Item | Value | Replaces |
|---|---|---|
| Items per letter | 5, of which at most 2 may be videos (P3) | v1 D3 "up to 5" and #746 ML-S4 "8 items, 2 videos" |
| Longest video | 60 seconds, 200 MB after conversion | R21 and #746, equal |
| "Not now" on a card | 14 days, kept as a record with an expiry in the decisions store (R41, R17) | v1 R17; #746 said 7 |
| Time between two cards | at least 7 days since the last one was shown | #746 ML-S10 |
| Hide this one | until the parent undoes it on the Hidden choices page | #746 "gone for good" |
| Re-ask after "Not now" on a sheet | never automatically; only when the parent opens the control | UR-4 and CISO suggested 90 days; privacy and design (Apple 5.1.1(iv)) say it holds |
| Library reads per local day | ceiling 3, no floor, in code only, never in copy | R44 |
| Catch-up reads per foreground session | 1, none within 30 minutes of the last | CAIO |
| Moment nudges | 0 | R27 |
| Pending local notifications | at most 60 of the system's 64 (`planner.ts` lines 90, 127 to 128, 294 per CAIO) | R26 |
| Quiet window | 21:30 to 07:00, unchanged | K6 |
| Shared notification cap | one number for every class, set by the founder; default is the cadence the parent already chose (`weekly` default in `planner.ts`). No numeric cap constant exists today (two lenses and `product` grepped) | R61 |
| Unused index | dropped after 90 days off (proposed) | CDO-12 |

## 7. Requirements

Status: KEPT (id and meaning as v1), CHANGED (id kept, text changed), NEW (id from R39). Lens in brackets drove the change. Test titles are proposed; files are in section 16. Unknown means the owner and date are in section 14.

### 7.1 Promise, permission, no analysis

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R1 | CHANGED [CLO, CMO, privacy] | all | Given each promise line in the claims registry, When the build's capabilities are read, Then the line shows only when its phase is on; no string says "never read" or "not read" about the library once the build reads it; the strings "stay on your phone", "stays on this phone" and "nothing is sent to us" fail on any store, website or in-app surface unless the registry has the line with a counsel version; and the line vanishes when the switch or the remote kill is off | `[NX-39-R1] a promise line shows only when its phase is on, and none denies a read the build does` |
| NX-39-R2 | KEPT | P0, P1 | Given the P0 or P1 build, When the picker opens, Then 0 permission questions are asked and no full-library authorization API is called | `[NX-39-R2] P1 asks no library permission question and calls no authorization API` |
| NX-39-R3 | CHANGED [design, CAIO] | P2a, P2b | Given any launch path (cold, warm, notification tap, deep link, first run), When the app starts, Then no Photos authorization request is made; the only caller is the Continue button of the pre-sheet; Cancel on the sheet or the system question leaves the switch off, the picker working, and asks nothing again in the session or from a note; after "Not now", tapping a chooser entry shows no consent sheet and the picker (Apple's own sheet, R2) keeps working, and only the parent opening the control (the Settings row or the ledger) brings the sheet back | `[NX-39-R3] no launch path requests photo authorization and Not now holds` |
| NX-39-R4 | CHANGED [CISO, CPO, CLO, CAIO] | all | Given the built Info.plist, Then there is no `NSLocation*` key, no `NSPhotoLibraryAddUsageDescription`, no `UIBackgroundModes` and no `BGTaskSchedulerPermittedIdentifiers` in any build where P2c is off; the library key exists only when P2a or P2b is on and equals the content string; `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` is true whenever the library key exists; the app links no Core Location. The preflight rule at `preflight-testflight.mjs` lines 575 to 576 keeps failing on any `UIBackgroundModes` until the founder records a ruling (R46) | `[NX-39-R4] the plist adds keys only for the phases that are on` |
| NX-39-R9 | CHANGED [CISO, CAIO] | P1 on | Given any code that touches media, Then (a) a TypeScript-AST scan, not a text search, resolving aliased imports and dynamic requires, finds none of: Vision, ML Kit, face, caption, classify, scene, people, `CLGeocoder`, `createAsset`, any smart-album, moment, People or Places `PHAssetCollection`, any collection `localizedTitle`, speech on a video, `fetch` in a media path; (b) the adapter returns exactly: opaque id, capture instant, media kind, duration, pixel size, city key, and a test with 30 extra fields shows none survive; (c) each banned call in a fixture makes the scan fail (positive control); (d) the allowlist file is under CODEOWNERS for `security-architect`. Native code inside a dependency is not scanned; R52 covers that | `[NX-39-R9] media code reads only allowlisted fields, calls no analysis or network API, and the scanner fails on every banned fixture` |
| NX-39-R10 | KEPT | P1 on | Given a letter with a picked picture, When the date line shows, Then the letter's words and recording are byte-identical, the line is in a separate field labelled "From the photo", and no machine text enters the letter, transcript, search index or machine-edits log | `[NX-39-R10] date and place lines never enter the words, the transcript or the search index` |

### 7.2 Metadata

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R5 | CHANGED [CAIO] | P1 | Given a picked photo with a capture date, When it attaches, Then "Taken {date}" shows in the phone's date style; the parent can change or clear it; no date shows no line and no error; the day bucket is the phone's current time zone, in one function, with midnight, DST and flight-day fixtures. A photo near midnight on a trip may land on the neighbouring day: an accepted limit, because a card shows a range. The one function is `dayKeyAt(epochMs, utcOffsetMinutes)`, a pure helper that lives in `packages/core/src/moments.ts`; the caller supplies the zone's UTC offset in force at that instant (it reads no clock, zone or locale itself) | `[NX-39-R5] a picked photo's date shows, can be changed or cleared, and the day rule is one function with fixtures` |
| NX-39-R6 | CHANGED [CDO, CISO, privacy, CAIO] | P1 | Given a picked photo with coordinates, When it attaches, Then coordinates are read into memory only and reduced to a city key from the bundled table; the city name is stored only as a separate field of a kept item; 0 coordinates, cells, geohashes or finer names exist in any database, file, log or cache; no venue, street, hospital, worship place or business name is ever stored or shown | `[NX-39-R6] only a city key is kept and no coordinate survives` |
| NX-39-R7 | KEPT (HYPOTHESIS) | P1 | Given a coordinate, When the name is found, Then 0 network calls carry it (bundled table, size and accuracy by BL-844). If the table fails, the parent types the place. Apple's geocoder only if the founder and counsel choose it | `[NX-39-R7] the place lookup makes 0 network calls` |
| NX-39-R8 | CHANGED [CISO] | P0 on | Given 10 fixture pictures with GPS, date, device and thumbnail, When stored, exported or shared, Then 0 of 10 carry an Exif, XMP or IPTC segment (byte scan). For P3: a fixture video with an embedded location has no `udta` or `mdta` location key or metadata track after storage and after export | `[NX-39-R8] 0 of 10 stored files carry any metadata segment, after export too` |

### 7.3 Library, states, special assets

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R11 | CHANGED [CAIO, CDO] | P2a, P2b | Given each permission state, Then: Limited is first-class and never nags for Full; the app, not the system, shows the selection sheet; the ledger says looking is over the chosen photos, and no Limited copy promises new photos appear until BL-871 answers; Denied is an ordinary state with no banner; narrowing or revoking access clears the index on the next open (R42). Narrowed means All became Limited, or a Limited selection got smaller: no fresh consent act is recorded (it is the same agreement over fewer photos), the index is wiped, and the ledger shows one plain note that the list was cleared because fewer photos are shared (words by `content`); whether that needs a new act is counsel's (CB-28). The state tables for `media_background` and `occasions` are in 7.3.1 | `[NX-39-R11] limited, denied and narrowed states each behave as specified` |
| NX-39-R12 | KEPT | P1 | A Live Photo stores its still only, 1 file, label never says "video" or "live" | `[NX-39-R12] a Live Photo stores its still only` |
| NX-39-R13 | KEPT | P1 to P3 | An iCloud-only asset downloads on demand with progress and Cancel, never in bulk; on failure 0 files remain | `[NX-39-R13] an iCloud-only asset downloads on demand, cancels cleanly and never in bulk` |
| NX-39-R14 | KEPT | P1 on | A cancel, decode failure or low-space phone writes 0 files and keeps the letter | `[NX-39-R14] a failed pick writes 0 files and keeps the letter` |

#### 7.3.1 State tables for the other two consent layers (R11, R47; answers the engineer's point 10)

The seven states are Not asked, Held ("Not now"), All, Limited, Denied, Narrowed and Revoked. `media_read` uses all seven (R11). `media_background` and `occasions` use the same seven except that Limited and Narrowed apply only to `media_read`: for the other two layers they are never entered and a "limited" answer is ignored. Every row below also holds: nothing is asked at launch (R3); a switch is on only after its own act is recorded (R47); Off is one tap and records a withdrawn act.

`media_background` (P2c, own sheet CS-S4a, own act). There is no system question for this layer: its consent is its own act. It is offered only while the read layer's switch is on with access All or Limited, and Background App Refresh is available (R46).

| State | Meaning | Switch | Sheet | What happens | Leaves by |
|---|---|---|---|---|---|
| Not asked | Never offered, or not yet offered | Off | Opens only on the parent's own tap, and only when the offer conditions above hold | Nothing is requested, scheduled or read | Continue on the sheet (All), Not now (Held) |
| Held | The parent said "Not now" | Off | Only opening the control shows it again; a note, a launch or a chooser tap never does | Nothing scheduled | Opening the control, then Continue or Not now |
| All | The parent agreed and the act is recorded | On only after the act is on record | Closed | The best-effort top-up may run behind its flag; each run checks permission first (R46) | Off (withdrawn act, requests cancelled, cursor and look log cleared); the read layer going off, narrowed away or revoked (switch off, requests cancelled, no new act) |
| Limited | Not used | n/a | n/a | n/a | n/a |
| Denied | Never entered, because no system question exists for this layer; the parent's No is Held | n/a | n/a | n/a | n/a |
| Narrowed | Not used | n/a | n/a | n/a | n/a |
| Revoked | The read layer is off or revoked, or Background App Refresh is off | Off | Not offered | Requests cancelled and cursor and look log cleared; no act is recorded for a system change; iOS turning Background App Refresh off deletes no data | The read layer back on and the parent turning this switch on, which records a new agreed act |

`occasions` (P4a, own act). The system question, if one is needed, is the local-notification permission (UNVERIFIED which Apple call the adapter wraps; section 14, item 30).

| State | Meaning | Switch | Sheet | What happens | Leaves by |
|---|---|---|---|---|---|
| Not asked | Never offered | Off | Opens only on the parent's own tap | No reminder is scheduled | Continue (system question, then All or Denied), Not now (Held) |
| Held | "Not now" | Off | Only opening the control shows it again | No reminder is scheduled | Opening the control |
| All | Agreed, system allows, act recorded | On only after the act is on record | Closed | Reminders for the days the parent typed, within the shared cap (R61) | Off (withdrawn act, pending reminders cancelled); iOS turning permission off (Revoked) |
| Limited | Not used; a "limited" answer is ignored | n/a | n/a | n/a | n/a |
| Denied | The system said no | Off | None; a later tap asks nothing and shows nothing | An ordinary state with no banner and no effect | The parent allowing it in iOS Settings, which shows as All with the switch still off until the parent turns it on and an act is recorded |
| Narrowed | Not used | n/a | n/a | n/a | n/a |
| Revoked | Agreed before, then iOS permission was turned off | Off | Not offered | Pending reminders are cancelled; typed days are kept; no act is recorded for a system change | As Denied |

### 7.4 Moments (P2b)

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R15 | CHANGED [CAIO] | P2b | Given a list of `{day, cityKey}` items for the fictional family "Asha" and a `RULE_VERSION`, When clusters are built, Then one pure function in `packages/core` returns moments with a reason code from a closed enum (`DAY_RUN`, `SAME_CITY`, `NO_PLACE_JOINED`, `MIN_ITEMS_MET`), and it imports nothing that touches network, clock, locale, randomness or storage. Rule (proposed, tune only on fixtures): a moment is a maximal run of active days with a gap of at most 1 empty day; it needs at least 2 active days or at least 3 items; consecutive days join if they share a city key or either has none. The 50 km rule is dropped. Reason codes, as built and now the spec: `DAY_RUN` the moment spans at least 2 active days; `SAME_CITY` at least one join was made because two neighbouring days share a city key; `NO_PLACE_JOINED` at least one join was made because a day had no city key; `MIN_ITEMS_MET` the moment holds at least 3 items; they are listed in that fixed order and never empty. The moment's `cityKey` is set only when exactly one city key appears in it; a moment with two or more cities (for example a multi-city flight day) has `cityKey` null. Properties: determinism over 100 shuffles, order invariance, idempotence, empty, null-place and one huge day, and monotonicity in this limited form: adding an item with no city key, or with a city the day already has, never uncovers a day; adding a different city between matching days may split a moment (it can remove the join that held two days together), so monotonicity is not claimed for that case. Hide and Not now never change the rule | `[NX-39-R15] the same {day, cityKey} list always makes the same moments, with reason codes and no forbidden import`; `[NX-39-R15] adding items with no city, or a city the day already has, never uncovers a day; a different city between matching days may split a moment` |
| NX-39-R16 | CHANGED [design, privacy, CPO, CMO] | P2b | Given a moment, When Tonight shows it, Then one card shows a date range only: no place, no thumbnail, no count, no time-since; it never sits above "Tell {child} about today", never shows in first run, and never appears while Tonight is already on screen; the place and the parent's own thumbnails (time order, no "best") show only after the tap, in the chooser, and the place only if the Places switch is on; it is absent when the master, Dates or the card switch is off | `[NX-39-R16] one calm card with a date only, not above the main action, not in first run` |
| NX-39-R17 | CHANGED [design, UR, CMO] | P2b | Given the card, Then it shows 0 numerals about photos, letters or days, no "waiting", "missed", "still", "forgot", "don't", "you have not", "only"; "Not now" snoozes 14 days, kept as a record with an expiry in the decisions store (R41), so it survives an index rebuild and is gone on Erase everything, Delete account and Clear hidden choices, but not on Forget the list or Stop these; no count and no gap list exists on any surface. The single permitted list is the parent's own Hidden choices page (R49), behind App Lock, with no counts | `[NX-39-R17] no count, no gap wording, and the only list is the parent's own hides` |
| NX-39-R18 | CHANGED [CDO, design] | P2b | Given "Suggest days" is off (default), Then 0 reads happen. When it is switched off, Then the moments rows, the cursor and the look log are deleted at once; the parent's decisions and snoozes (R41) stay | `[NX-39-R18] off by default, and off clears the index but not the parent's decisions` |
| NX-39-R19 | KEPT | P2a, P2b | A moment or a chooser pick becomes a letter only with the parent's words; leaving without words drops the pictures; the capture screen opens with no seeded text, title, date or place, and the words are byte-identical before and after attaching | `[NX-39-R19] a moment becomes a letter only with the parent's words` |
| NX-39-R20 | CHANGED [CDO, design, UR] | P2b | Given a stretch the parent set with a from and until date, a hidden day, or a hidden photo, Then no card is built for them, in any state, after a rebuild, a rule-version change, a revoke and re-grant, or Recently Deleted purging (R41). The app cannot know why. A hidden day inside a moment trims the moment; if it is a middle day the moment splits in two, and a hidden day is a barrier, never an empty day that the gap rule can bridge. Each leftover piece must re-qualify under the same rule as R15 (at least 2 active days or at least 3 items, same joins), so a lone leftover day with fewer than 3 items is dropped; the pieces are judged by running the same pure function on the items inside each piece, not by copying the parent moment's reasons. A hidden photo is hidden by an opaque key (R41), never by an asset id | `[NX-39-R20] a range the parent excludes never produces a card` |

### 7.5 Video (P3)

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R21 | KEPT (HYPOTHESIS) | P3 | Limits in section 6, conversion off the main thread with progress and Cancel, free-space check, a refused video says why in one line | `[NX-39-R21] a video over the limits is refused kindly and a kept one fits the budget` |
| NX-39-R22 | KEPT | P3 | A kept video stays local, joins the export only by choice after a size line | `[NX-39-R22] video stays local, joins the export only by choice, and the size is shown first` |
| NX-39-R23 | KEPT | P3 | No speech engine ever receives a video's audio | `[NX-39-R23] no speech engine ever receives a video's audio` |
| NX-39-R24 | CHANGED [design] | P3 | A video never autoplays, shows a still and a 44 pt play control, respects Reduce Motion; every video offers an optional typed description in the parent's own words (nothing is machine-captioned); the label is the date and the letter's first words | `[NX-39-R24] a video never autoplays and offers a typed description` |

### 7.6 Occasions and notifications (P4a, P4b)

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R25 | CHANGED [privacy, CLO, CPO, CMO, UR, design] | P4a | Given the occasions screen, Then every occasion is typed by the parent with their own name and date; no list ships, no occasion is selected by default, and nothing is inferred from locale, place, language, photo or date; the word "festival" and every named religious day are absent from copy, the store listing and the screens until counsel answers CB-21; no ask card names one | `[NX-39-R25] no occasion exists without a parent entry, and no festival word ships` |
| NX-39-R26 | CHANGED [CISO, CAIO, privacy, CLO] | P4a | Given a scheduled reminder, Then it is a local notification for a day the parent typed; the body is a key in `packages/content` chosen when scheduled and carries no value from the library; `userInfo` holds only a random per-notification id mapped inside the app (no asset id, no hash of one); no attachment, `subtitle` or `threadIdentifier`; no place, photo, count, "waiting" or occasion name unless "Names in notifications" is on; nothing between 21:30 and 07:00; it counts against the one shared cap (R61); at most 60 of 64 pending; `passive` interruption level if the SDK supports it, never `timeSensitive` | `[NX-39-R26] a reminder carries a fixed key, a random id, and nothing from the library` |
| NX-39-R27 | CHANGED, reversal of v1 [privacy, CISO, CAIO, CFO, design] | P2b, P4b | Given any library signal, When the notification builder runs, Then it returns 0 notifications derived from it; its inputs are typed occasions and the generic planner only; `planner.ts` imports no media module; no silent or content-available push exists for library work. A multi-day moment may show only as the in-app card on open (R16), after P2b is on | `[NX-39-R27] no notification is derived from the library` |
| NX-39-R28 | CHANGED [CISO] | P4a | Given a tapped reminder, Then Tonight opens by a fixed route chosen from an enum; every `userInfo` field other than the random id is ignored; the library is never opened; nothing is attached | `[NX-39-R28] a reminder tap opens Tonight by enum and attaches nothing` |
| NX-39-R29 | KEPT | P2, P4 | The reminders master stop also stops occasion reminders; "Stop these" is one tap from a card | `[NX-39-R29] the reminders stop also stops occasion reminders` |

### 7.7 Data, privacy, security, sharing

| Id | Status | Phase | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R30 | CHANGED [CDO, CISO, privacy] | P1 on | Given every new local column, file and store, Then each has a row in a committed device classification table (level and class), a Node test fails on a column with no row (interim until BL-016), and each is absent from analytics, logs, crash reports and URLs. The log canary (unique fake city, id and date through scan, index, attach, export, erase and a forced error; 0 hits in logs, breadcrumbs, crash payloads, analytics) is NOT BUILT today (`DATA_CLASSIFICATION.md` line 38; LEGAL-REQ-014); it is a gate for P2b and P2c, not a follow-up | `[NX-39-R30] a fake city, id and date never appear in any log, analytics event or crash report` |
| NX-39-R31 | CHANGED [CDO, CISO] | P1 on | Given Erase everything, Delete a book, Delete account, a purged letter, or "Take it off", Then stored copies, date and city fields, thumbnails, picker temp files, the index file with its `-wal` and `-shm`, the cursor, the look log, the decisions and the card snoozes (Erase everything and Delete account only, besides the parent's own Clear hidden choices), pending occasion notifications and pending background requests are gone; an interrupted erase resumes at next launch; a file-tree diff proves it | `[NX-39-R31] erase paths remove every file and row, including sidecars, and resume after a kill` |
| NX-39-R32 | CHANGED [CDO, CLO] | P1 on | Given an export, a shared view, a co-parent view or a print, Then no coordinate is present anywhere; the export carries the stored stripped copy only (never original bytes, never an "originals" option) at `<entry_id>/<media_id>.<ext>` or `<media_id>.<ext>`, with the export schema bumped and published; a byte scan of the export matches the stored-copy scan; city text appears only for items the parent kept and only when "Include places" is on; the derived index and the decisions are not exported and the README says so in plain words; a print of media does not exist until CB-13 is answered; the export screen says the file is not encrypted | `[NX-39-R32] the export carries the stored copy only, with no coordinate and no original bytes` |
| NX-39-R33 | KEPT | all | Given sync on, When a letter with media syncs, Then `photo_path` stays null, 0 bytes of media upload, and no key matching library, local_id, asset, place, geohash, moment, occasion, taken_at or media is in any `packages/api` schema or outbox payload | `[NX-39-R33] the sync payload carries no media and no derived field` |
| NX-39-R34 | CHANGED [CDO] | all | Given opt-in analytics (off in 1.0), Then the catalog holds no event whose existence depends on library content or on a moment, a suggestion or an item: `moment_card_opened` and `moment_card_hidden` are removed; allowed first: `media_added` (props: source, kind; a parent action through the picker), `occasion_reminder_changed`, and `moments_switch_changed` (prop: on or off only) which ships dark until counsel answers C1 | `[NX-39-R34] the catalog has no event that depends on library content` |
| NX-39-R35 | KEPT | P1 on | VoiceOver, AX5 and Reduce Motion: controls 44 pt or more; the chip reads as "Taken 12 Dec"; the card is one grouped element; labels are the parent's own words; one column at AX5 | `[NX-39-R35] the chips, the card and the thumbnails are labelled by the parent's words and fit AX5` |
| NX-39-R36 | CHANGED [CISO] | P0 | Given App lock on, When the app goes to the switcher or opens cold, Then screens that show a photo render blank in the snapshot (scripted check) and no moment card is built until the lock clears. This gates P0, not P2 | scripted device check; `[NX-39-R36] the switcher snapshot is blank on screens that show a photo` |
| NX-39-R37 | CHANGED [CPO, CISO, CFO] | all | Given a phase switch off, Then its screens, reads and requests do not exist; export and erase still work; the remote kill switch can pause but never start | `[NX-39-R37] each phase switch removes its screens and reads and leaves export and erase working` |
| NX-39-R38 | KEPT (counsel) | P1 on | A picture of another person or child: the app does nothing different; the right-to-add term and the other-people position are counsel's (CB-6, CB-7) | none |

### 7.8 New in v2

| Id | Phase | Lens | Given, When, Then | Test title |
|---|---|---|---|---|
| NX-39-R39 | all | CAIO, CPO | Given section 3, Then the phase table is the only one in the repo: the ADR and flows cite it; the switches in section 3 exist in `capabilities.ts`, each off in `production` | `[NX-39-R39] every phase has a switch and each is off in production` |
| NX-39-R40 | P2b | CAIO, CDO, CISO, privacy | Given the post-scan index, Then it holds moments rows only (start day, end day, city key or null, flags), no per-asset row, no `local_id`, no timestamp finer than a day, no geohash, no cell, no latitude or longitude, no "home" or modal-place inference; a schema test lists the allowed columns | `[NX-39-R40] no per-asset row, no finer-than-day time, and no place finer than a city key is persisted` |
| NX-39-R41 | P2b | CDO, design | Given hidden days, stretches and photos, Then they live in a separate small store keyed by calendar day range (no `local_id`), outside the disposable index; a rebuild, a rule-version change, a revoke and re-grant, and "Stop these" leave them; "Forget the list" leaves them; Erase everything and Delete account and the parent's own "Clear hidden choices" remove them. The same store holds the card snoozes (R17): a "Not now" or 14-day snooze is a record with an expiry, survives a rebuild, is removed by Erase everything, Delete account and Clear hidden choices, and is NOT removed by Forget the list or Stop these. A hidden photo is stored as an opaque random key made at chooser time, only in this store; it is never an asset id, never derived from one (no hash, no truncation), and at most 200 characters; Undo, the three removal paths above and nothing else delete it | `[NX-39-R41] parent decisions survive every rebuild path and go only on Erase or Clear` |
| NX-39-R42 | P2a, P2b | CDO, CISO, privacy, design | Given authorization changes to None or Limited-narrowed while the app is closed, When any code path would read the index or the library, Then the status is checked first, 0 rows return, the index and its sidecars are deleted in the same call, and no log line holds an id, date or place; after restore the index is rebuilt, not trusted | `[NX-39-R42] permission is checked before every read and revoke wipes the index` |
| NX-39-R43 | P2b | CISO, CDO | Given the index and the media directories, When the app opens, rebuilds, vacuums, replaces or restores, Then the backup-exclusion flag (index) and the stated protection class are set again and read back, including sidecars; the Settings line about backup matches the media folder's real flag; the class is stated per file (the batch idea is why `CompleteUntilFirstUserAuthentication` and not `complete`) | `[NX-39-R43] backup flag and protection class are set again on every open and rebuild` |
| NX-39-R44 | P2b, P2c | CPO, CISO, CMO, UR, privacy | Given the scheduler on a simulated clock, Then no more than 3 library reads start in a local day (a ceiling, never a floor); reads have no input to the number of notifications; no string in app, store, website, policy, notification or test states or implies a read frequency or freshness ("a few times a day", "every day", "up to date", "2 to 3 times"); the claims test fails on these in every profile | `[NX-39-R44] reads are capped and no string promises how often the app looks` |
| NX-39-R45 | P2b | CAIO | Given P2b on and access Full or Limited, When the app opens or returns to foreground, Then it runs one catch-up from the saved cursor (or last-looked day against added date), chunked and off the first-frame path, builds at most one card, none within 30 minutes of the last catch-up, paused on background | `[NX-39-R45] one catch-up per foreground session, off the first frame` |
| NX-39-R46 | P2c | CAIO, CPO, CISO, CLO, privacy, CMO | Given the P2c switch (off by default, own consent, own Shown, Records, Never, Decline lines, withdrawn in two taps), Then: its `UIBackgroundModes` and task identifier appear in a build only where `EXPO_PUBLIC_MOMENTS_BACKGROUND` is on (prebuild diff on and off); the flag is off in every `production` and TestFlight profile until the founder records a ruling and every gate in section 3 for P2c passes; a run checks permission first and reads 0 when it is None; it ends in well under 30 seconds and persists the cursor so a killed run costs nothing; it contains no `fetch`, Supabase client, analytics import, breadcrumb call or push-token import; a locked-phone run either works or ends with no error and no partial rows; the ledger shows the last-looked time, with no count; it is not offered when Background App Refresh is off or restricted | `[NX-39-R46] the background top-up exists only behind its own flag and consent, and reads nothing without permission` |
| NX-39-R47 | P1 on | privacy, CLO | Given a layer a person agrees to, Then it has its own act id (`media_read`, `media_background`, `occasions`) built by the PRIV-R21 function with the hash of the words shown; no switch is on without its act; the act holds the version and time, never a media fact; an act is `agreed` or `withdrawn` and nothing else: "Not now", a system cancel and a system revoke record no act (the sheet's "Not now" is a state, not an act); the PRIV-R21 act vocabulary and the location of its writer are UNVERIFIED and counsel-adjacent (section 14, item 30; CB-4), so BL-861 uses an adapter and guesses neither; the Shown, Records, Never and Decline lines (section 8) exist for each | `[NX-39-R47] each consent layer records its own act and no switch is on without it` |
| NX-39-R48 | P2a, P2b | design, UR, privacy, CMO | Given the pre-sheet (CS-S1), Then it states what is read, what is never read, when it looks, and where the result lives; Continue and Not now are the same size, weight and type at AX5; the success measure in the study is comprehension and a comfortable No, not the yes-rate; if a polished design raises "I would say yes" by 3 of 10 without raising comprehension, the plain one ships | `[NX-39-R48] the pre-sheet has equal buttons and states what, when and where` |
| NX-39-R49 | P2b | design, UR, privacy | Given the ledger page (CS-S3), Then it shows the master switch (off in one tap, no dialog), the access level, a Dates switch and a Places switch each with a "lets the app read" and a "does not" line, the last-looked time, a Never block, a one-tap "Forget the list" that also turns looking off and leaves the parent's photos, letters, hidden choices and snoozes untouched (no three-button dialog), and a Hidden choices page behind App Lock that lists the parent's own hides with Undo and no counts | `[NX-39-R49] the ledger turns off in one tap, forgets in one tap, and the Hidden choices page is visible and undoable` |
| NX-39-R50 | P1 on | CISO | Given any native error from PhotoKit, the picker, a transcoder or a scheduler, When it crosses the bridge, Then only a closed enum code is passed on; a canary in the native error text yields 0 hits in logs, breadcrumbs and crash payloads | `[NX-39-R50] native errors cross the bridge as closed codes` |
| NX-39-R51 | all | CISO | Given the built plist and entitlements, Then there is no WidgetKit target, no share-extension target, no notification service extension, no `application-groups` entitlement | `[NX-39-R51] no widget, share extension, notification extension or app group exists` |
| NX-39-R52 | P1 on | CISO | Given a PR that adds or bumps a package with native code, Then `security-architect` reviews the lockfile diff, the prebuild plist and entitlement diff is attached, the licence and maintainer are recorded, no network permission is listed, and the version is pinned exactly | process; CODEOWNERS on `package-lock.json` and `apps/mobile/app.config.ts` |
| NX-39-R53 | P1 on | CISO | Given the attach flow finishes, fails or is killed, Then the temporary original (which holds GPS) is deleted at the next launch at the latest; no temp file with a media extension remains after a test that interrupts every step | `[NX-39-R53] no temporary original survives an interrupted attach` |
| NX-39-R54 | all | CLO, CDO | Given media sync is not approved, Then `entry-photos` bucket policies deny writes and `photo_path` is null in every sync payload; no server table, bucket, function or migration is added for P0 to P4 | `[NX-39-R54] the photo bucket accepts no writes and no payload carries a photo path` |
| NX-39-R55 | all | privacy, CLO, CMO | Given `claims-capabilities.test.ts`, Then `Profile` has the fields `mediaMetadata`, `mediaLibrary`, `mediaBackground`, `occasions` read from `capabilities.ts`, each with its rule; denial claims ("never read a photo's location", "we do not look at your library", "the rest of your library is not read") fail while the capability is on; the frequency and freshness patterns fail in every profile; new content paths and the occasion notification strings are in the read set, and a check fails if a `memoryLibrary` subtree exists in `packages/content` unlisted; a claim with no passing proof is removed before release (PRIV-R17) | `[NX-39-R55] a claim ships only with its capability and its proof, and no frequency claim ships at all` |
| NX-39-R56 | P2a on | CMO, CISO, privacy | Given the built `NSPhotoLibraryUsageDescription`, Then it equals the `packages/content` string word for word, is one active sentence about purpose, holds no promise about where data goes, and mentions reading while closed if and only if P2c is on in that profile | `[NX-39-R56] the plist purpose string equals the content string and names background use only when it exists` |
| NX-39-R57 | P0 on | privacy | Given Tonight and the add-media screens, Then Tonight is not a child-facing surface: no library-derived value or media appears in Read together, a widget, a Live Activity or a lock-screen notification | `[NX-39-R57] media never appears in Read together or on the lock screen` |
| NX-39-R58 | all | CBO | Given `packages/core/src/plan.ts`, Then `GatedFeature` stays `'keep_letter' \| 'theme_extra'`; attaching, viewing, exporting, erasing and "Stop these" are never gated; no Plus copy says Plus unlocks library access, moments or reminders; adding media to an already kept letter is not blocked | `[NX-39-R58] the free core stays ungated and Plus copy never mentions the library` |
| NX-39-R59 | P2a, P2b | UR, CPO | Given the study (BL-857 extends `PARENT_STUDY_PLAN.md` Q5) has not reported against the bars in section 12, Then no P2a promise copy ships and P2b is not built for parents; the bars are written in section 12 before the study runs; the read-out is a `FINDINGS.md` under `docs/research/studies/` linked in the PR | PR checklist |
| NX-39-R60 | P2b | CPO | Given the share of parents who turn "Suggest days" off within 14 days of turning it on is above a threshold the founder sets before launch, or any hard-season participant reports a card as painful, Then P2b is switched off remotely and no new nudge ships until `product` reviews; no streak, gap count or points | `[NX-39-R60] a stop rule exists, with a founder-set threshold, and the kill switch works` |
| NX-39-R61 | P4a | CPO, CFO, privacy, design | Given every notification class (evening, month, occasion), Then one exported constant names the shared cap and the quiet window; each class registers with it; adding a class cannot raise the total; the founder's number replaces the default only by a decision. Known gap: `planner.ts` has a `Cadence` of off, weekly, fewTimes, everyEvening and `DEFAULT_WEEKLY_DAY` but no numeric weekly cap, and v1 K6 said "one a day" | `[NX-39-R61] one shared cap covers every notification class` |

## 8. Door lines (COORDINATION section 10, PRIV-R21), per layer

| Layer | Shown | Records | Never | Decline and withdraw |
|---|---|---|---|---|
| `media_read` (P2a, P2b) | The pre-sheet CS-S1 by `packages/content` key; the Settings row; the plist string | Document, version, action (agreed or withdrawn only), method, surface, phone time, app version and build, OS major, platform, language, hash of the words shown, the access level iOS reports | Any date, place, count or id; the library contents | Not now holds; Off in one tap; Forget; export and erase still work |
| `media_background` (P2c) | The second sheet CS-S4a | The same fields, own act | The same; a look reported to analytics beyond a content-free event; a notification | Row off in two taps; cancels requests; clears cursor and log; no data deleted by iOS turning Background App Refresh off alone |
| `occasions` (P4a) | The occasions row and what the reminder will say | The same fields, own act | A named festival, a place, a photo, a count in a reminder | Per occasion off; master stop; Erase |
| First add of media the parent did not make (P1) | A one-line notice from the Terms right-to-add clause (CB-6) | Version and time only | Any media fact | Cancel adds nothing |

## 9. Non-goals

Reading what is in a picture or video; automatic letters or prefilled words; a reel, slideshow or year in review; any upload, sync or cloud copy of media; a camera in the app; storing coordinates, streets, venues, a cell or a "home"; counting, grading or chasing the parent; a widget, a share extension or a notification extension (R51); a library-derived notification of any kind (R27); a shipped festival list (R25); a print of media (R32); Apple Journaling Suggestions as a foundation (D14 stays a spike); a server-sent wake-up for library work; anything in Build 12.

## 10. Founder decisions: only what is founder-only, in the order that blocks

Karma and the CPO have ruled the rest (record section 6). Each line gives the recommendation and what happens if the founder says nothing. `product` drafts D-154 onward as `Proposed` once he takes them.

| # | Decision | Blocks | Recommendation | Default if silent |
|---|---|---|---|---|
| F1 | Name a release for P0 and P1 (D11) | every build row | P0 and P1 together in a 1.0.x or 1.1 after Build 12 | No phase ships |
| F2 | Take counsel tier A to counsel (BL-841; counsel hours are money) and say who pays | promise words, policy bumps, P0, P1 | Tier A now: CB-1 to CB-14, plus CB-21 | Nothing is sent |
| F3 | Approve the study (BL-857 plan, BL-879 run): recruiting route, incentive, a second runner for the permission sessions, verified support-line numbers, and sign the bars in section 12 (the N of M numbers are his) | P2a copy, P2b, the stop-rule threshold | Yes; sessions-only first (about 5 days), diary second | P2 is not started |
| F4 | Choose the promise wording after counsel (PW-A to PW-D) | all store, website, in-app promise text | PW-A for the first release; PW-D when P2a is on | Nothing new ships; NX-33's words stay |
| F5 | Privacy and Terms major bumps, the right-to-add clause, and the 30-day notice (counsel confirms; depends on whether 1.0.0 is published) | P0 and P1 ship | Major for both, one text per release | No release that adds media |
| F6 | The one shared notification cap number (R61) | P4a | Keep the existing cadence the parent chose (weekly default) | Existing weekly behaviour |
| F7 | The P2b pass line and the stop-rule threshold (R59, R60), written before the study | P2b | Use section 12 numbers | P2b not started |
| F8 | The numbers table (section 6): items per letter, card interval, snooze | P2a design freeze | As in section 6 | As in section 6 |
| F9 | Backup stance: stored photos in the iPhone backup, videos out, said in words | P0 words | Photos in, videos out | As recommended |
| F10 | Journaling Suggestions entitlement: spike only, and who applies in the Apple account | none now | Spike only | Spike only |
| F11 | Reverse "never read in the background" (S6, LEGAL-REQ-011) for P2c, after counsel and both spikes | P2c | Not before BL-871 and BL-872 show it is worth the consent cost | No background read; P2c stays off |
| F12 | Founder device and hours: BL-843 (a phone with a real library), BL-871, BL-872 (three phones, 14 days) | P1 gate, P2b gate, P2c gate | Run BL-843 first | Gates stay shut |
| F13 | Video limits (D6) and Live Photo (D7) | P3 | Free, limits as section 6, still only | As recommended |
| F14 | The parent name of the section (D10); "Photos and days" is a working label | P2b | `content` proposes, he picks | Working label |
| F15 | Place on a kept item in a shared view or print (D5) | P1 | Own export on; others and print off | As recommended |

## 11. Counsel questions

C1 to C13 are merged with the privacy analysis questions and the new questions into CB-1 to CB-28, prioritised, with a dedup map, in the council record section 5. They go to counsel in tiers: A before P0 and P1, B before P2, C before P4.

## 12. The study before P2 (BL-857 extends `PARENT_STUDY_PLAN.md` Q5; bars written before data)

Decision it changes: whether to build P2a, P2b and P2c, and the permission level. One study, 10 to 12 adults (all "x of 10" bars scale to n), sessions first, a 7-day diary second. No real library is read, no child is photographed or named, stimuli are synthetic, raw notes stay out of the repo. At most 5 of 10 from the founder's close circle; a second runner takes at least 3 of the permission sessions. Variants: picker only, Limited, Full with a plain "why" and "never", and a polished versus a plain Full sheet; the promise candidates in section 5.1 with a comprehension check ("After you say yes, what can the app see? What is sent to us?"); the Tonight card date-only versus one that names a place (the second only to learn, never to ship); where a parent would want it (shelf, card, notification); "when your phone allows" wording; hard-season stimuli shown last as labels, each with a visible skip.

Bars (proposed by the research lens, founder confirms in F3 and F7):

| Bar | Pass | Stop |
|---|---|---|
| Full read design work (P2b) | At least 8 of 10 answer both comprehension questions correctly, at least 7 of 10 score a full read 4 or 5 for comfort, no hard-season participant calls it watching or painful | Otherwise build P0 and P1 first, P2a second, and not P2b |
| Promise rewrite | At least 8 of 10 say correctly what the app can see and what is sent | 3 or more of 10 say the rewrite makes them trust us less: stop P2 and keep the NX-33 promise. Fewer than 6 of 10 on "what is sent to us": the design is not honest enough, whatever the comfort score |
| Date-only card | At least 6 of 10 rate it welcome and at most 1 pressured or odd | Any participant reports a card as painful: pause date-triggered cards for everyone, same day to `product` |
| Place on a card | Never ships from this study | n/a |
| Persuasion check | The plain sheet ships unless the polished sheet also raises comprehension | A rise of 3 or more in "would say yes" without a rise in comprehension is a dark pattern |
| Cadence | The shared cap stays unless at least 7 of 10 want more and at most 2 of 10 turn reminders off in the diary | More than 3 of 10 turn off: weekly or lower |
| Festival (Q4) | Parent-typed dates only until Q4 clears | Fewer than 4 of 10 would opt in to a festival note: demote festival work |

Measures: comprehension (correct or not), comfort 1 to 5, welcome / neutral / pressured / odd, which channel they would keep, whether a No felt easy. Never a count of what a parent has or has not written. Consent design is judged by comprehension and a comfortable No, not by the yes-rate. After launch: a 15 to 20 parent opt-in panel; no in-product signal that reveals a photo, place, count or gap.

## 13. Cost and review ledger (CFO-1, CFO-3; counts, not dollars: the files hold no runway, rate or quote)

Server storage, server compute, bandwidth and third-party geocoder: $0 for P0 to P4 (bundled table, nothing uploads). Analytics: $0 while off. Any phase that adds a dollar line (upload, geocoder, remote push) is a new founder decision and reopens the label. Counsel: tier A is 15 questions (CB-1 to CB-14 and CB-21), tier B 7, tier C 3. App Review submissions expected: P0 plus P1 one; P2a one; P2b one; P2c at least one with extra reviewer questions; P3 one; P4a one. Engineer-weeks per phase are not estimated here: no file holds a velocity. Dollar figures are the founder's to supply.

## 14. UNVERIFIED (merged and deduplicated from nine lenses; none relied on)

Apple and iOS. (1) Apple's `earliestBeginDate`, `BGAppRefreshTaskRequest`, `BGProcessingTaskRequest` pages and the exact conditions for processing tasks; the `BGTaskScheduler` class page. (2) Whether Expo's background task is an iOS app-refresh or processing request, and its SDK 57 support and plist keys. (3) Photos reads from a background launch while the phone is locked; the data protection of the Photos database and of `expo-sqlite` files in a custom directory. (4) Whether photos taken after a Limited selection become visible, and observer behaviour across a selection change. (5) Wording and timing of iOS's limited-library prompt and alert buttons. (6) `fetchPersistentChanges` iOS floor and Expo exposure. (7) Cost of a `creationDate` predicate on a very large library; whether the default fetch excludes hidden and Recently Deleted. (8) `PHAssetSourceType` and screenshot subtype member names. (9) Expo `interruptionLevel` for local notifications; whether time-sensitive needs an entitlement. (10) That a tapped local notification cold-launches into Tonight. (11) Any user-visible indicator of background Photos reads. (12) Low Power Mode and Background App Refresh readable from JS; Low Power Mode's exact effect on tasks (the `backgroundRefreshStatus` page says Background App Refresh is disabled in low-power mode). (13) Force-quit behaviour: two Apple statements disagree between forum threads. (14) That the observer fires only while the app runs: the Apple pages read do not say. (15) Whether the picker file carries date and place without a prompt, `PHPickerResult` and `assetIdentifier` (the page was blocked; BL-843). (16) Journaling Suggestions entitlement approval path. (17) Whether Background Modes need any Apple approval; App Review treatment of a background library read (guideline 2.5.4 and 5.1.1(iii)) and of dormant features (2.3). (18) Required-reason API reasons for any new native module; `expo-media-library` and `expo-image-picker` plugin plist output. (19) Whether the exclusion flag and file class survive a restore, and whether a directory flag covers `-wal` and `-shm`. (20) Whether the app-switcher snapshot is blank under App lock today. (21) How long the OS keeps notification content and who can read `userInfo`. (22) Whether a widget, share extension or app group target exists today, and Expo support for them. (23) Whether revoking Photos access ends the process. (24) The 64 pending notification limit comes from an Apple staff forum post, not a docs page. (25) All performance numbers (50,000 assets in 90 s) are estimates.

Legal. (26) Every statute and rule not opened: 15 U.S.C. 45, CPRA, Washington MHMDA, Connecticut, Illinois and Texas biometric law, Cal. Penal Code 632, COPPA 2025, the definition of provider in 18 U.S.C. 2258A, the full Apple Developer Program License Agreement. (27) Whether on-device reading is "collect" under any state law; whether a city or a cell is precise geolocation; whether a typed occasion is sensitive; whether the `Hidden choices` store of bare dates is sensitive. (28) The App Privacy label answers per route (engineering reading of Apple's definition only). (29) Whether 1.0.0 of the policies is published, which fixes the version path.

Repo and product. (30) The PRIV-R21 function's location, its act vocabulary (the `agreed` and `withdrawn` actions, the `sheet` and `switch` methods and the three layer ids used by BL-861 are `product`'s reading, not read from that function), and whether it can record an act before sign-in (BL-579); counsel-adjacent (CB-4). (31) Whether chapter 08 DSR-R rows cover a cache and cursor. (32) `docs/legal/CLAIMS.md` is absent on `develop`. (33) `docs/legal/data-map.yaml` (BL-016) is absent and `DATA_CLASSIFICATION.md` 4.5 is stale. (34) The numeric weekly cap: none found in `planner.ts`. (35) Whether `rules.test.ts` accepts every candidate string. (36) Market and demand facts (Wohllebe 2021 via the evidence note, the Mott poll, competitor behaviour) are as cited, not re-read; opt-in rates for baby apps are unknown; every user story is HYPOTHESIS until the study. (37) Any dollar figure.

Read and confirmed by `product` on 10 Nov: `preflight-testflight.mjs` lines 575 to 576 fail a TestFlight build with any `UIBackgroundModes`; `docs/research/USER_RESEARCH.md`, `NOTIFICATION_EVIDENCE_2026-11-01.md` and `PARENT_STUDY_PLAN.md` exist and say what `research.md` says they say; `docs/research/studies/` does not exist; `planner.ts` has no numeric weekly cap constant.

## 15. Engineering plan: what can start now, behind off switches, and what waits

Rules: everything below is built behind the switches in section 3, all off in `production`. Disk is tight (about 800 MB free on the shared host on 10 Nov): only one agent runs `npm install` at a time. Work packages marked "install" run vitest and need `node_modules`; the others use plain Node or are documents.

### 15.1 Start now (no dependency on a decision or a spike)

| WP | Work | Row | Install | Parallel group |
|---|---|---|---|---|
| EP-1 | Pure moment engine in `packages/core/src/moments.ts`: `{day, cityKey}` in, moments and reason codes out, `RULE_VERSION`, property tests (determinism, order, idempotence, monotonicity, midnight, DST, flight day, empty, null place, huge day) with "Asha" fixtures; an import-graph test | BL-859 | install | B (serial) |
| EP-2 | Parent decisions logic in `packages/core/src/decisions.ts`: hide a day, a stretch, a photo key (opaque, random, made at chooser time); keep the card snoozes with an expiry; survive rebuild and rule change; tests through the five paths in R41 | BL-860 | install | B |
| EP-3 | Consent state machine: Not asked, Held, All, Limited, Denied, Narrowed, Revoked; layers `media_read`, `media_background`, `occasions`; never at launch; an adapter interface for the PRIV-R21 act writer (location UNVERIFIED) | BL-861 | install | B |
| EP-4 | Metadata-only scanner (TypeScript AST) with a positive control per banned call, adapter field-allowlist type, collection and title ban; CODEOWNERS entry proposed | BL-845 | install | B |
| EP-5 | Log canary harness: fixture library with unique city, id and date; scan, index, attach, export, erase and forced error; the closed native-error code enum | BL-862 | install | B |
| EP-6 | `claims-capabilities.test.ts` rules: `Profile` fields, denials, frequency patterns, read set for notification strings, subtree check | BL-863 | install | B |
| EP-7 | Plist and preflight lint per phase; `UIBackgroundModes` stays forbidden; no widget, share, NSE, app group, `NSLocation*`; library key only with its flag; positive controls | BL-864 | probably none (node test; UNVERIFIED) | A |
| EP-8 | Name the shared cap and the quiet window as constants; a notification class registry; a 60 of 64 test; no number changes | BL-869 | install | B |
| EP-9 | Photo bucket write-deny test and `photo_path` null contract test; a migration only if the test fails, and then the founder's `approve-migration` | BL-870 | install (`test:db`) | B |
| EP-10 | Documents: device classification table (BL-846), threat model with the snapshot check (BL-851), export spec 4.2 fix (BL-868), policy and Terms drafts (BL-865, BL-866), claims registry and register rows (BL-867), native-module gate checklist (BL-878), counsel brief (BL-841), design fold-in of #751 and `mediaScrim` rename (BL-849), content keys (BL-873), study plan (BL-857) | those rows | none | A (all parallel) |

Group A items run in parallel with each other and with one Group B agent. Group B items share one install: run them serially, or in one checkout by one agent.

### 15.2 Waits

| Work | Row | Waits for |
|---|---|---|
| P0 build | BL-847 | Build 12 ships; F1; BL-846; counsel tier A on the NX-33 label |
| P1 build | BL-848 | BL-843, BL-844, BL-847, BL-842; D2, D5 |
| Library chooser | BL-874 | D9; C1, C2, C10; BL-850; BL-861; BL-848; the promise comprehension bar |
| Index store (moments rows, backup flag, rebuild, wipe) | BL-877 | BL-846, BL-859, BL-860 |
| Suggest days (card, switch, P4b card) | BL-853 | BL-871; BL-862 and BL-845 running; BL-877; the study pass line; counsel tier B |
| Ledger, Forget, Hidden choices pages | BL-876 | BL-860, BL-849 |
| Occasions and local reminders | BL-855 | BL-869; BL-542 re-scoped to typed only; CB-21 asked; F6 |
| Background top-up | BL-875 | BL-871, BL-872; counsel ruling on `UIBackgroundModes` and purpose-string completeness; F11; the study pass line; the canary in the background path |
| Video | BL-854 | BL-848; F13; CB-9 |
| Notifications from the library | none | refused (R27) |

## 16. Trace and tests

Layers: unit tests in `apps/mobile/test/` and `packages/core/test/`; device rows named when `qa` allocates S1 ids (this file takes none).

| Id | Test (layer, file) | Device or study |
|---|---|---|
| R1, R44, R55 | `packages/content/test/claims-capabilities.test.ts` (extend) | none |
| R2, R3, R4, R51, R56 | `apps/mobile/test/media-permissions.test.ts`; `apps/mobile/scripts/preflight-testflight.test.mjs` (extend) | BL-843 |
| R5, R6, R10, R12, R14, R53 | `apps/mobile/test/media-metadata.test.ts` | device: picker |
| R7 | `apps/mobile/test/media-no-network.test.ts`; `packages/core/test/place-name.test.ts` | BL-844 |
| R8 | `apps/mobile/test/media-encode.test.ts` | none |
| R9, R50, R52 | `scripts/guards/media-ast-scan.test.mjs` with fixtures; `apps/mobile/test/media-adapter.test.ts` | none |
| R11, R42 | `apps/mobile/test/media-permissions.test.ts` | device: limited, denied, revoked |
| R13 | `apps/mobile/test/media-icloud.test.ts` | device |
| R15 | `packages/core/test/moments.test.ts` | harness on the founder's phone |
| R16, R17, R19, R49 | `apps/mobile/test/moments-card.test.ts`; `apps/mobile/test/ledger.test.ts` | device |
| R18, R20, R40, R41, R43 | `apps/mobile/test/moments-index.test.ts`; `packages/core/test/decisions.test.ts` | device: flags, sidecars |
| R21 to R24 | `apps/mobile/test/video-*.test.ts` | SE-class device; study |
| R25 to R29, R61 | `apps/mobile/test/occasions.test.ts`; planner tests | study |
| R30 | `scripts/guards/log-canary.test.mjs`; device classification test | none |
| R31, R32 | `apps/mobile/test/erase-everything.test.ts`; `export-media.test.ts` | device: container |
| R33, R54 | `apps/mobile/test/sync-media.test.ts`; `supabase/tests/media-bucket.test.mjs` | none |
| R34 | `packages/analytics/test/catalog.test.ts` (extend) | none |
| R35, R36 | `apps/mobile/test/media-a11y.test.ts` | device: VoiceOver, AX5, snapshot |
| R37, R39 | `apps/mobile/test/media-switches.test.ts` | kill-switch drill |
| R45, R46 | `apps/mobile/test/moments-scheduler.test.ts`; prebuild diff | BL-872 |
| R47, R48 | `apps/mobile/test/consent-acts.test.ts` | study |
| R57, R58 | `apps/mobile/test/media-surfaces.test.ts`; `packages/core/test/plan.test.ts` (no change) | none |
| R59, R60 | PR checklist; `apps/mobile/test/media-switches.test.ts` | study |

Trace: NX-39-R1..R61 -> LEGAL-REQ-007, -011, -013, -014, DATA_CLASSIFICATION rules 2 and 6, F09, F13, F15, A-NFR-005 to -007, NX-33-R1..R16, BL-542 to BL-545, PRIV-R17, PRIV-R21, SEC-R15. Ids are not in reading order in the tables; each is used once.
