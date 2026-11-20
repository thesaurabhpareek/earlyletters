# NS-01: Photo with a letter (photo-first capture on Home, a Photos lens in the Book)

Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO role). Rank 1 of 7 in the founder's order (photo, Find, pilot, spike, share, Firsts and sealed; `closed-questions-2026-11-11.md`, X1). Index: `README.md`. Design source: `docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md` (PR #794). Data source: ADR 0028 (PR #797, not yet on `develop`; cited as "ADR 0028 (PR #797)" until it merges). Rulings applied: round-2 rulings T2, T3, T4, T5, D1, D2, D3, D5, D13 (Karma, 20 Nov 2026, council round 2; each card line that applies one says so).

Terms. "Lens", "Photos lens" and "entry_media" are internal; `content` names what a parent reads (BRAND.md glossary, CR-25). One picture term everywhere (ruling T3): **stored copy** = the file this app keeps, metadata stripped, at most 4,032 px on the long side; **list copy** about 512 px and **page copy** about 1,280 px (NS-37); **the picker's temporary copy** = the file Apple's picker hands over, which still carries location and is deleted once read. The picture in the parent's photo library is never touched, copied into the book or exported. The word "original" is not used for anything this app keeps (finding F16).

Tags: [F] fact read this session in a file or PR diff (named). [A] assumption about parents. [E] estimate. PROPOSED = a number or line `product` proposes. UNVERIFIED = not read or not run this session. Nothing in this card was run on a phone. Code facts come from reading the diffs of the open stack #834, #841, #842, #835, #836, #837, #838, #839, #840 (in merge order) on 20 Nov 2026; "built" below means "present in that diff", not "passes".

## 1. Who and when

- A parent holding a phone that already has a picture of {child} they want to say something about. Often one-handed, often in the evening, sometimes with {child} on their lap or asleep nearby. [A] The picture is the reason they open the app that day.
- The same parent later, in the Book, looking for the letters that have a picture with them.
- A co-parent, when co-parent sharing is live in a store build: their letters carry their own pictures the same way, and those pictures stay on the phone that added them (section 3).
- Not a grandparent and not a child. Nothing here is a child-facing surface (`NX-39-R57`).

## 2. Why

- Job (from the founder's order, X1; PRD V2 job "let me go back to it"): "I go to Home to say something to {child} about a picture I just took or found, so the picture and what I said are kept as one letter." Second job: "I go to the Book to look at the letters that have a picture."
- What goes wrong today: a parent has the picture in Photos and the words in Early Letters, with nothing joining them. The export holds `photo: null` for every letter (`apps/mobile/src/lib/export/schema.ts:140` [F]); there is no picker code on `develop` [F].
- Evidence: picture-with-words appears in most of the 12 products the research file read (`FEATURE-GAP-AND-WEDGE-10nov.md`; store pages read by another agent, UNVERIFIED by product). No parent study yet; the five-parent study in section 21 is the first evidence. Evidence tag: [A] for demand, [F] for the gap.

## 3. What, and not in scope

**What.**
- One quiet start inside Home's capture cluster, "Start from a photo", under Speak and Type, above "Not much today", never larger than either, absent (not greyed) when off (design spec 01 section 3.1). It opens Apple's system picker; once a picture is chosen, Listen opens at Ready with the picture shown above the prompt, and the parent speaks or types as usual.
- On Review and on a kept letter's page, the author can add a picture, change it (asks first, Undo after), take it off (Undo after), and type optional words about it (at most 140 characters) and a place (at most 60). The app writes none of these.
- One picture per letter. The stored copy lives on this phone only, in `Library/Application Support/photos/<media_id>.jpg`, metadata stripped, upright, in the iPhone's own backup.
- In the Book, a Photos lens (Months or Photos) appears only once a kept, open letter has a picture. It lists those letters as the Book's own letter cards with a thumbnail, newest first, under the Book's month openers. It only reads.
- The export (schema 1.7.0, BL-933) carries each stored copy with the letter.

**Not in scope (this card).**
- Camera capture. A picture alone as a letter (a letter needs words: D-103). More than one picture per letter, video, multi-select, the "Add photos" row, the 3-photo and 8-photo layouts, swipe between items (design spec 01 section 1a, later NX-39 phases). A date read from the file (NX-39 P1, OQ-1). Any caption, title, tag, description, face, scene or "best photo" made by the machine (constitution; `NX-39-R9`). Pictures following the account to another phone (C-32, later; would change the privacy label). A picture on a quiet-day mark. Pictures in the owner backup of ADR 0024 (audio only). A Share of the picture (NS-05 decides).
- Photo-first is not a second way to start a letter: Home stays the only start (`NAV-TAB-ROLES-10nov.md` P1, P2; NS-35). The Book's lens never starts or adds.

## 4. Happy path

Photo first, from Home:
1. On Home the parent taps "Start from a photo".
2. Apple's picker opens (`PHPickerViewController`, no photo library, no permission question). The parent picks one picture.
3. The picker's temporary copy lands in `Caches/ImagePicker`; Listen opens at Ready with the thumbnail (at most 160 pt tall) above the prompt, then Speak and Type. The prompt is chosen exactly as without a picture.
4. The parent taps Speak and talks to {child}, or Type and writes. "Change" under the thumbnail picks another picture before speaking.
5. Review opens. The picture is now stored with the draft: the stored copy is written (stripped, upright), then its `entry_media` row with `draft_id`; the temporary copy is deleted. The parent may type words about the picture and a place.
6. The parent taps Keep. In the same transaction as the letter, the picture's row moves from `draft_id` to `entry_id` (same id, the file never moves). The letter counts under D-103 only because its words exist.
7. The letter page shows the words, the picture beside them, and the parent's photo words and place if typed.
8. In the Book a Months or Photos choice appears above the chapters; Photos lists the letters that have a picture.

Add later, from a kept letter:
1. On the letter page the author taps "Add a photo to this letter", picks one picture; the stored copy and row are written; the letter's words, transcript, edits and recording are untouched.

## 5. Unhappy paths and edge cases

| Case | Behaviour | Row |
|---|---|---|
| Cancel in the picker | Back on Home or the page, nothing written, no message | R4 |
| Back or Close from Ready before speaking | Nothing written; the temporary copy is deleted; Home as before | R4, R52 |
| Let it go on Listen or Review | The recording goes as today; the draft's picture goes with it, file then row | R16a, R52 |
| A picture that cannot be decoded (corrupt, unknown type, over 150 MP canvas) | The letter keeps going and is kept; the picture is not stored; the letter page says once, calmly, that the photo did not come along, with Add again | R17a, R58 |
| Phone full when the copy is written | As above; 0 files remain | R17a, R45 |
| An iCloud-only picture | Downloads through the picker with progress and Cancel; offline it fails with one calm line and the capture goes on without a picture | R17b, R46 |
| A Live Photo | Only the still is stored | R17c |
| A rotated picture (Exif orientation not 1), HEIC or PNG | Re-encoded upright as JPEG; never stored sideways | R37c |
| A very large picture (48 MP, panorama) | Stored copy at most 4,032 px on the long side; thumbnail fits uncropped | R37a, R42 |
| Picture chosen, then words never come (a picture alone) | Keep is disabled; nothing is kept as a letter | R5a |
| A second picture on a letter that has one | Asks "Use this photo instead?" with "Keep the first" as the safe choice; the first stays until confirmed; Undo after | R7, R38a |
| Take the photo off | Removed at once with Undo; the file stays until the Undo window closes | R38a |
| A pick lands while App lock is up | Discarded, 0 files | R47 |
| App killed after the pick, before Review | The temporary copy is swept at next launch; no picture is kept; the draft (if recording had started) recovers without it | R43 |
| App killed between the file write and the row | The launch sweep deletes the file with no row | R36 |
| The stored file is missing (deleted outside the app) | In that session the letter page reads "Not on this phone any more" with Remove for the author; the next launch sweep removes the row and the letter reads whole with no slot | R56 |
| A quiet-day mark | Offers no picture control; an attach is refused, 0 files | R25 |
| Picture of someone other than {child} | The app does nothing different; counsel Q48 | section 17 |
| The parent's library is "Limited" or "Denied" | Not an issue: the picker needs no permission | R2 |

## 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | "Start from a photo" shows on Home whenever the switch is on and the picker is registered, before any picture exists (OQ-3 closed as built in #838). No Photos lens until a kept, open letter has a picture (R10a). |
| Empty | Book with 0 letters: no lens, no hint, no count; the Book's empty button only moves to Home (R23a). |
| Many (1,000 letters, 300 pictures) | The lens lists only letters with a picture, using list copies (NS-37, R53); a 300-picture lens scrolls with no frame over 16.7 ms on SE 3 (NS-37-R1). On-device storage about 0.5 to 0.9 GB for 300 stored copies [E] plus derivatives (NS-37). |
| Offline | Everything works: picker (local pictures), stored copy, lens, export. An iCloud-only picture fails calmly (R46). |
| Slow | Thumbnail p95 1,000 ms from picker close; stored copy written within 1,500 ms p95 off the UI thread (section 8). The native re-encode times out at 20 s and counts as a failure, letter kept (`BAKE_TIMEOUT_MS`, #834 baker.ts [F]). |
| Failed | Every failure leaves 0 files and 0 rows and keeps the letter (R17a, R51, R58). |
| Interrupted (call, Siri, alarm, the baby) | After the pick and before speaking: the picture stays on Ready for that capture session when the app returns (R57). While the picker is open: the picker sheet going away answers Cancel (#842 [F]). During recording: recording rules as today; the picture stays pending. |
| App killed mid-flow | Before Review: no picture kept, temporary copy swept (R43). After Review opened: the draft holds the picture and returns with it (R43). Between file and row: swept (R36). |
| App updated mid-flow | A draft holding a picture is intact after the update (R44); local migration 11 runs once and never reverses (R35). |
| Low storage (under 1 GB; under 50 MB) | Under 1 GB: capture starts with the calm line (06-nfr 11.3); the stored copy is written only if free space covers it plus 50 MB (R45, PROPOSED), else the letter is kept without it (R17a). Under 50 MB: no draft is created (06-nfr 11.3), so no picture is stored. |
| Low Power Mode, low battery | No change in behaviour; decode and write stay off the UI thread; no background work. |
| Two books | The picture goes with the active book's letter (R60); the lens shows only the active book's letters. |
| Two parents | Each author's picture stays on the phone that added it; the other parent's phone shows the letter whole with no picture slot and no message (R28). Only the author can add, change or remove (R9c). |
| Expecting parent (due date only) | No difference: a picture can go with a letter written before birth (a scan, a room). |
| Multilingual (Devanagari, RTL, CJK) | Photo words and place in any script, stored as typed, capped by grapheme clusters (R54); RTL words render right to left on the letter page. |
| Largest text (AX5 plus Bold Text) on SE 3 | Thumbnail rule of R39; lens cards stack the thumbnail above the words (#840 [F]); every control 44 pt (R20a). |
| VoiceOver | Fixed label or the parent's own words (R9a, R21c); order thumbnail, prompt, Speak, Type (R20b); Undo windows follow T4 (R38). |
| Voice Control and Switch Control | Every visible label is a command; everything reachable by item scanning; with Switch Control on, Undo stays until the parent moves on (R38c, R20e). |
| Reduce Motion | No motion added; fades only (R20d). |
| Dark mode and Increase Contrast | 1 pt hairline frame so dark pictures do not merge (R41); Smart Invert leaves pictures alone (R40). |
| Plan lapsed | Attach, change, remove, view, lens and export all work; only Keep of a new letter past the allowance meets the gate (R18). |
| Signed out | Pictures stay on the phone with their letters (ruling D1); the sign-out sheet says so (R30). |
| Second account on the same phone | Sees none of the first account's pictures and no Photos lens (R29; test `[X4-R1]`). |
| New phone | Sync carries no picture (R15). Restored from an iPhone backup: pictures return with it (R27). Without one: letters read whole, no slot, no per-letter message; one Book-level line in NS-10 says pictures stay on the phone that added them (R28, NS-10). |

## 7. Acceptance criteria

Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Rows that restate an `NX-39-R#` cite it so one test proves both. Test titles are the form tests use; the trace script cannot yet find NS ids (finding F1), so no traceability is claimed until it can.

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-01-R1 | Given the Home route with `EXPO_PUBLIC_PHOTOS=on` and the picker registered, When it renders, Then exactly 1 photo start exists, inside the capture cluster, and it starts through `startCapture({ source: 'photo' })`. Given the Book and Me routes, Then 0 controls start a letter from a picture (design navigation test N3(f), (g)). | P1 | `[NS-01-R1] only Home registers a photo start` |
| NS-01-R2 | Given the photo start, When the parent taps it, Then the system picker opens, 0 permission questions are asked and no photo-library or camera authorization call exists in the compiled module (`NX-39-R2`). | P1 | `[NS-01-R2][NX-39-R2] the photo start asks no library question` |
| NS-01-R3 | Given a picked picture, When Listen opens at Ready, Then the thumbnail is at most 160 pt tall above the prompt at sizes below AX3, and the prompt is chosen by the same function as without a picture, from age and history only: with 3 different fixture pictures and one fixed state, the chosen prompt is identical. | P1 | `[NS-01-R3] the prompt does not depend on the picture` |
| NS-01-R4 | Given a picked picture and no speech or typing started, When the parent goes back or closes, Then 0 rows and 0 stored files are written, the temporary copy is deleted, and Home equals its state before the pick (same route, same elements and props, no draft row, the photos folder holds the same files) (`NX-39-R14`). | P0 (a) | `[NS-01-R4][NX-39-R14] backing out writes nothing` |
| NS-01-R5a | Given a draft with a picture and no words, When Review opens, Then Keep is disabled and the picture alone cannot be kept. | P1 | `[NS-01-R5a] a picture without words cannot be kept` |
| NS-01-R5b | Given a draft with a picture and words, When Keep is tapped, Then the letter is kept and counts under D-103 exactly as the same letter without a picture. | P1 | `[NS-01-R5b] a picture does not change what counts` |
| NS-01-R6 | Given 10 fixtures carrying Exif (with GPS), XMP, IPTC, MPF, a JFIF thumbnail, a comment and bytes after the end-of-image marker, When the stored copy is written, Then 0 of 10 carry any of them, checked by a segment walk and a whole-file signature scan, and the same holds for the export bytes (`NX-39-R8`). Changed 20 Nov: MPF, thumbnail, comment and trailer added to match `strip.ts` (#836). | P0 (a) | `[NS-01-R6][NX-39-R8] 0 of 10 stored files carry metadata` |
| NS-01-R7 | Given a letter that has a picture, When the parent picks a second one, Then the app asks to replace, the first stays until the replace is confirmed, "Keep the first" leaves everything as it was, and Undo after a confirmed replace follows R38. Changed 20 Nov: the fixed "10 seconds" now follows ruling T4 through R38. | P1 | `[NS-01-R7] a second picture replaces only after confirm` |
| NS-01-R8 | Given any add, replace, undo or remove of a picture, or an edit of its words or place, Then the letter's `final_text`, `raw_transcript`, machine edits, edit level and recording hash are byte-identical before and after (`NX-39-R10`). | P0 (a) | `[NS-01-R8] picture changes never touch words or recording` |
| NS-01-R9a | Given a kept letter with a picture and no photo words, When the letter page opens, Then the picture shows with the letter and its VoiceOver label is the fixed phrase (PROPOSED "Photo with this letter"). | P0 (a) | `[NS-01-R9a] the picture has a fixed label` |
| NS-01-R9b | Given any picture on any surface, Then no machine caption, title, tag, description, date or place derived from the picture exists in the database, the screen or the export (`NX-39-R9`). | P0 (a) | `[NS-01-R9b][NX-39-R9] no machine text about a picture` |
| NS-01-R9c | Given a letter whose author is someone else, When its page opens, Then add, change, take off and edit-words controls are absent. | P1 | `[NS-01-R9c] only the author changes the picture` |
| NS-01-R10a | Given at least 1 kept, open letter with a picture in the active book, When the Book opens, Then a Months or Photos choice is offered. | P1 | `[NS-01-R10a] the Photos lens appears with the first picture` |
| NS-01-R10b | Given a picture on a sealed letter that has not opened, Then it does not count toward R10a and does not show in the lens until the letter opens (design spec 04 FS-R10). | P1 | `[NS-01-R10b] a sealed letter's picture waits` |
| NS-01-R10c | Given 0 kept, open letters with a picture, Then no Photos control, empty state or hint appears. | P1 | `[NS-01-R10c] no lens without a picture` |
| NS-01-R11 | Given the Photos lens, Then it lists only letters that have a picture, newest first by the letter's date, each as the Book's letter card with a thumbnail; no number of pictures appears on screen or in any VoiceOver string, and there is no "add" control. | P1 | `[NS-01-R11] the lens shows no count and no add control` |
| NS-01-R12 | Given the last picture is removed or its letter deleted, When the Book renders, Then the Photos choice is gone, the Book shows Months, and no message says so. | P1 | `[NS-01-R12] the lens disappears quietly` |
| NS-01-R13a | Given any screen showing a picture, When the app becomes inactive or goes to the background, Then each picture is replaced by an opaque box before the switcher snapshot, whether or not App lock is on (Karma's ruling 11 Nov, `PHOTO_BLANK_WITHOUT_APP_LOCK = true` in #838 `surface.ts` [F]; stricter than `NX-39-R36`). Changed 20 Nov: was "App lock on" only. | P0 (a) | `[NS-01-R13a][NX-39-R36] the switcher snapshot shows no picture` |
| NS-01-R13b | Given App lock on, When the app opens cold or returns, Then no picture draws until App lock is passed. Split from R13 on 20 Nov. | P0 (a) | `[NS-01-R13b] no picture before unlock` |
| NS-01-R14 | Given an export at schema 1.7.0, Then each kept letter's stored copy is in the ZIP at `photos/<entry_id>/<media_id>.jpg` with the `photo` object of ADR 0028 D2 (file, bytes, sha256, width, height, text, place); `counts.photos` equals the files written, excluding Recently deleted; no other image file and no "originals" option exists (`NX-39-R32`). Changed 20 Nov: "stripped copy" is now "stored copy" (T3); path and counts rule from ADR 0028 D2. | P0 (a) | `[NS-01-R14][NX-39-R32] export carries the stored copy only` |
| NS-01-R15 | Given sync on, When a letter with a picture pushes and pulls, Then the push carries no `photo_path` value other than null, 0 bytes of media upload, and a pull never creates, changes or deletes an `entry_media` row (`NX-39-R33`, `R54`). | P0 (a) | `[NS-01-R15][NX-39-R33] sync carries no picture` |
| NS-01-R16a | Given a kept letter with a picture, When it is deleted, Then the picture is hidden in the same step (derived from `entries.deleted_at` by join; no picture write). Split from R16 on 20 Nov. | P0 (a) | `[NS-01-R16a] delete hides the picture with the letter` |
| NS-01-R16b | Given a deleted letter with a picture inside the Recently deleted window (F17), When it is restored, Then the letter and its picture return together. | P0 (a) | `[NS-01-R16b] restore brings the picture back` |
| NS-01-R16c | Given the window has passed or Delete now is chosen, When the purge runs, Then the picture file is deleted first, then its row, then the letter; and a let-go draft's picture is deleted file first, then row (`NX-39-R31`; ADR 0028 D5). | P0 (a) | `[NS-01-R16c] purge and let-go remove the picture file` |
| NS-01-R17a | Given an attach that is cancelled, fails to decode, times out, finds too little space or fails to write, Then 0 stored files and 0 rows remain for it and the letter is kept with its words (`NX-39-R14`). Split from R17 on 20 Nov. | P0 (c) | `[NS-01-R17a] a failed picture leaves nothing and keeps the letter` |
| NS-01-R17b | Given an iCloud-only picture, When it is picked, Then the download shows progress (the system progress trait; the scan exemption in README appendix A) and Cancel ends the wait at once (`NX-39-R13`). Not met in #837: `picker.ts` says scribe-photo reports no download progress yet [F]. | P1 | `[NS-01-R17b] iCloud pictures show progress and can be cancelled` |
| NS-01-R17c | Given a Live Photo, Then only the still is stored and the paired video is never read (`NX-39-R12`). | P0 (a) | `[NS-01-R17c] only the still of a Live Photo` |
| NS-01-R18 | Given the plan engine, Then attaching, replacing, removing, viewing, the lens and exporting a picture never call the Keep gate; with the plan lapsed or the allowance used, all of them work; the only gate on the path is Keep of a new letter after the allowance (`NX-39-R58`). | P0 (a) | `[NS-01-R18][NX-39-R58] pictures are never gated` |
| NS-01-R19 | Given `EXPO_PUBLIC_PHOTOS` off, or the remote pause `killSwitches.photos` true, Then the photo start, the lens and the add, change and remove actions do not render, while the launch sweep, Erase now, Erase everything and Export still handle every picture (`NX-39-R37`). | P1 | `[NS-01-R19][NX-39-R37] the switch removes the screens, not the data rights` |
| NS-01-R20a | Given every new control (photo start, Change, Add, Change photo, Take the photo off, Undo, the lens choice, the words and place fields), Then each is at least 44 pt. Split from R20 on 20 Nov. | P1 | `[NS-01-R20a] new controls are 44 pt` |
| NS-01-R20b | Given VoiceOver on Ready, Then the reading order is thumbnail, prompt, Speak, Type, Change, and each control announces its state. | P1 | `[NS-01-R20b] VoiceOver order on Ready` |
| NS-01-R20c | Given AX5 on an SE 3, Then the lens cards and the letter page stack to one column and no text truncates. | P1 | `[NS-01-R20c] AX5 stacks to one column` |
| NS-01-R20d | Given Reduce Motion, Then no new screen adds motion beyond 200 ms fades. | P1 | `[NS-01-R20d] Reduce Motion is honoured` |
| NS-01-R20e | Given Voice Control, Then every visible label of the new controls works as a spoken command; given Switch Control, every new control is reachable by item scanning (06-nfr section 8). Added 20 Nov. | P1 | `[NS-01-R20e] Voice Control and Switch Control reach every new control` |
| NS-01-R21a | Given a picture on Review or a kept letter, When the author types photo words or a place, Then each is optional, stored trimmed in its own field (`entry_media.photo_text`, `entry_media.place`), at most 140 and 60 grapheme clusters (PROPOSED caps). Split from R21 on 20 Nov. | P1 | `[NS-01-R21a] photo words and place are optional and capped` |
| NS-01-R21b | Given any picture, Then the app never fills in, suggests or reads from the file a photo word or a place; a place read from the file is never stored or searched. | P0 (a) | `[NS-01-R21b] the app writes no photo words or place` |
| NS-01-R21c | Given photo words exist, Then they are the picture's only VoiceOver label; else the fixed phrase of R9a. Find searches both fields (NS-02-R5). | P1 | `[NS-01-R21c] the parent's words label the picture` |
| NS-01-R22 | Given every door to a picture, Then it opens only the iOS system picker, returning one still; there is no library access, no pre-prompt (ML-S1), no `MediaChooser`, no video, no multi-select, no "Add photos" row, no camera control, no camera or photo-library usage string in the plist and no picker, camera or media-library package in the lockfile. | P0 (a) | `[NS-01-R22] the system picker is the only source and returns one photo` |
| NS-01-R23a | Given the Book with 0 letters, Then its empty-state button (`book.empty.bookCta`) switches to the Home tab and calls no capture function; the Book has 0 controls that start a letter (design spec 06, J3; `content` words it). Split from R23 on 20 Nov. | P1 | `[NS-01-R23a] the Book empty button only moves to Home` |
| NS-01-R23b | Given the Photos lens, Then it has no "Add photos" or start control. | P1 | `[NS-01-R23b] the lens cannot start a letter` |
| NS-01-R24 | Given the `photosCopy` strings, Then they pass `packages/content/test/rules.test.ts` and the README appendix A scan: no dash, curly quote, ellipsis character or emoji; no "memory", "moment", "album" or "best" for what a person makes; no line implying the machine writes; `{child}` for the child. | P1 | `[NS-01-R24] photo strings match no forbidden pattern` |
| NS-01-R25 | Given a quiet-day mark ("Not much today", D-084), Then no picture control is offered on it and an attach to it is refused with 0 files written; the lens never lists one. | P0 (a) | `[NS-01-R25] a quiet day cannot carry a picture` |
| NS-01-R26 | Given a letter with photo words and a typed place, When sync pushes, Then the payload carries neither value and no key named `photo_text`, `place` or `photo` (LEGAL-REQ-012 lists location as never collected on the server). Added 20 Nov (r2 NS-01 M2). | P0 (a)(b) | `[NS-01-R26] typed photo words and place never leave the phone` |
| NS-01-R27 | Given a stored copy, Then its file and the photos folder are not excluded from the iPhone backup (`isExcludedFromBackup` false), so a device restore returns the picture with its letter (NX-39 F9; ADR 0028 D1). Added 20 Nov (r1 NS-01 item 3). | P0 (a) | `[NS-01-R27] pictures ride in the iPhone backup` |
| NS-01-R28 | Given the same account on a second phone, When a letter with a picture syncs there, Then the letter reads whole with no picture slot, no broken image and no message, and the picture is never requested. Added 20 Nov (r2 M3). Closes OQ-2. | P1 | `[NS-01-R28] a second phone shows the letter without a slot` |
| NS-01-R29 | Given account A signed out with pictures on this phone, When account B signs in here, Then B sees none of A's pictures, no Photos lens built from A's letters, and B's sync sends none of them (ruling D1; `[X4-R1]`). Added 20 Nov (r2 M3, r3 R30). | P0 (a) | `[NS-01-R29][X4-R1] a second account sees no picture` |
| NS-01-R30 | Given a signed-in parent with pictures, When they sign out, Then the letters, recordings and pictures stay on the phone and the sign-out sheet says so in plain words, naming pictures once photos are on (ruling D1). Added 20 Nov. | P0 (a) | `[NS-01-R30] sign out keeps pictures and says so` |
| NS-01-R31 | Given photos on in any build, Then the account-deletion text (`packages/content/src/pages.en.ts:240`, today "letters, recordings and photos are removed from every book") no longer says pictures are removed from places the server cannot reach, and says pictures on a phone go when that phone is erased (ADR 0028 D5). Added 20 Nov (r2 M4). | P0 (b) | `[NS-01-R31] the deletion text is true for pictures` (content test) |
| NS-01-R32 | Given photos on in any build, Then the keys `whereLive.onPhone`, `whereLive.onPhoneSynced`, `whereLive.iphoneBackup.body`, `settings.recordings.onPhoneBody`, `settings.recordings.onPhoneBodyBackupOff`, `settings.privacy.keptOnPhone`, `settings.privacy.keptSynced`, `settings.privacy.iphoneBackup` and `docs/legal/privacy-policy.md:37` name pictures (ADR 0028 D1). Added 20 Nov (r2 M5). | P0 (b) | `[NS-01-R32] every where-it-lives line names pictures` (content test) |
| NS-01-R33 | Given `apps/mobile/src/lib/photos` and `apps/mobile/modules/scribe-photo`, Then a source scan finds no Vision, VisionKit, Core ML, OCR, face, scene or classifier import or call (the NX-39-R9 scanner extended to these folders). Added 20 Nov (r2 S2). | P0 (a) | `[NS-01-R33] no machine reads a picture` |
| NS-01-R34 | Given any stored copy, Then its path is under `Library/Application Support/photos/`, never under Documents, and a container layout the app does not know refuses the write (`photos_folder_unknown`). Added 20 Nov (r2 S1). | P1 | `[NS-01-R34] pictures live in Application Support` |
| NS-01-R35 | Given a database at local version 10 with 1,000 letters, drafts, agreements and outbox rows, When migration 11 runs, Then every existing row is byte-identical, nothing is queued to the outbox, and every recording plays. Added 20 Nov (r3 R31). | P0 (c) | `[NS-01-R35] migration 10 to 11 keeps every letter` |
| NS-01-R36 | Given a kill between writing the stored file and inserting its row, When the app next launches, Then the photo sweep deletes the file and leaves 0 orphans; a row whose letter is gone loses its file then its row; a row whose file is missing is removed. Added 20 Nov (r3 R32). | P0 (a) | `[NS-01-R36] a kill leaves no orphan after the sweep` |
| NS-01-R37a | Given a picked image whose long side is over 4,032 px, Then the stored copy's long side is exactly 4,032 px and its aspect ratio is unchanged (ruling T3; the lower bound of 2,550 px is met by construction). Not met in the stack: the native step caps at 4,096 (`longestSide = 4096`, #834) and an upright JPEG is stored at its own size with no cap (#836 `commitPhoto`) [F]. Added 20 Nov. | P0 (a) | `[NS-01-R37a] the stored copy is at most 4,032 px` |
| NS-01-R37b | Given a picked image whose long side is 4,032 px or less, Then the stored copy keeps its pixel size, never upscaled. Added 20 Nov (T3). | P1 | `[NS-01-R37b] the stored copy is never upscaled` |
| NS-01-R37c | Given any image the app re-encodes (HEIC, PNG, a JPEG whose orientation is not 1, or one over 4,032 px), Then the output is an upright JPEG at quality 0.85 (ruling T3; #834 uses 0.9 [F]). An upright JPEG within the cap may keep its own encoded pixels with only the segments of R6 removed (interpretation of T3, open item O-1). Added 20 Nov. | P1 | `[NS-01-R37c] re-encodes are upright JPEG at 0.85` |
| NS-01-R38a | Given a replace or a take-off, Then Undo works for 10 seconds, or until VoiceOver has finished reading the undo line plus 10 seconds, whichever is later (ruling T4). Added 20 Nov. | P0 (b) | `[NS-01-R38a] Undo follows the VoiceOver rule` |
| NS-01-R38b | Given the Undo window has closed, Then the Undo control is gone from the screen in the same moment; no Undo control is ever shown that no longer works. Not met in the stack: the toast with an action never times out (`toast.tsx` on `develop`) while `undoPhotoChange` refuses after `expiresAt` (#839 `attach.ts`) [F]. Added 20 Nov. | P0 (b) | `[NS-01-R38b] no Undo control outlives its window` |
| NS-01-R38c | Given Switch Control on, Then the Undo window stays open until the parent moves on from that screen (ruling T4). Added 20 Nov. | P1 | `[NS-01-R38c] Switch Control keeps Undo until the parent moves on` |
| NS-01-R39 | Given AX3 or larger on an iPhone SE 3 with a picture on Ready, Then the thumbnail is at most 88 pt tall (PROPOSED) and Speak, Type and Change are on screen without scrolling. Not met in #838: at accessibility sizes the thumbnail grows to the screen width at 4:3 (`pending-photo-thumb.tsx`) [F]. Added 20 Nov (r1 NS-01 item 5). | P1 | `[NS-01-R39] large text keeps Speak on screen` (device) |
| NS-01-R40 | Given Smart Invert on, Then every picture (thumbnail, letter page, lens) ignores invert (`accessibilityIgnoresInvertColors`). Not in #838 `PhotoFrame` [F]. Added 20 Nov. | P1 | `[NS-01-R40] pictures ignore Smart Invert` |
| NS-01-R41 | Given dark mode or Increase Contrast, Then each picture has a 1 pt hairline frame in the theme's line colour, at the contrast 06-nfr section 8 sets for non-text. Added 20 Nov. | P2 | `[NS-01-R41] pictures have a hairline frame` |
| NS-01-R42 | Given a panorama or a very tall picture on Ready, Then the whole picture fits inside the thumbnail box, uncropped. Not met in #838: `PhotoFrame` uses `resizeMode="cover"` [F]. Added 20 Nov (r1 NS-01 item 6). | P2 | `[NS-01-R42] the thumbnail never crops` |
| NS-01-R43 | Given a picture chosen and Review not yet open, When the app is killed, Then on relaunch no stored file or row exists for it and the temporary copy is swept; Given Review has opened, Then the waiting draft returns with its picture. PROPOSED improvement (owner `mobile`, open item O-3): store the picture with the draft as soon as the draft row exists, so a kill during recording keeps it. Added 20 Nov. | P1 | `[NS-01-R43] a kill before Review keeps nothing; after Review keeps the picture` |
| NS-01-R44 | Given a waiting draft holding a picture, When the app is updated, Then after the update the draft and its picture are intact and Keep works (06-nfr section 7 durability list). Added 20 Nov. | P1 | `[NS-01-R44] an update keeps a draft's picture` |
| NS-01-R45 | Given free space below the stored copy's size plus 50 MB (PROPOSED; #836 checks twice the size [F]), When the copy would be written, Then nothing is written, the letter is kept, and R58's line shows. Added 20 Nov (r1 NS-01 item 2). | P1 | `[NS-01-R45] a picture needs room plus 50 MB` |
| NS-01-R46 | Given an iCloud-only picture and no connection, Then the pick ends with one calm line and the capture continues without a picture; nothing hangs. Added 20 Nov. | P1 | `[NS-01-R46] an iCloud picture offline fails calmly` (device) |
| NS-01-R47 | Given a pick that lands while App lock is up, Then it is discarded, the temporary copy deleted, and 0 files remain (#837 `picker.ts` [F]). Added 20 Nov. | P1 | `[NS-01-R47] a pick under App lock is dropped` |
| NS-01-R48 | Given the lens choice, Then it uses radio semantics (one selected of Months and Photos) through `ChoiceGroup` or `ChipGroup`, not Buttons in a tab list (NS-33-R3; BL-931). Not met in #840: `LensRow` renders Buttons with `accessibilityRole="tablist"` [F]. Added 20 Nov. | P1 | `[NS-01-R48] the lens choice is a radio group` |
| NS-01-R49 | Given the source tree, Then no letter text, child name, picture, photo words, place or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity: no `CSSearchableIndex`, no `isEligibleForSearch`, no `AppEntity` over letters, children, pictures or prompts (ruling D3; `[X6-R1]`). Added 20 Nov. | P0 (a) | `[NS-01-R49][X6-R1] nothing about a picture is donated to the system` |
| NS-01-R50 | Given the photo words and place fields, Then iOS writing tools (rewrite, proofread) are off on both (ruling D2). If React Native exposes no switch, `mobile` records that as a finding in its PR and this row stays open; it never passes silently. Added 20 Nov. | P0 (a) | `[NS-01-R50] writing tools are off on photo words and place` |
| NS-01-R51 | Given a forced failure of each closed code (section 10), Then logs, breadcrumbs, crash payloads and analytics carry 0 file paths, file names, hashes, photo words or places (`NX-39-R50`; the J-N18 canary with a canary photo word and place). Added 20 Nov. | P0 (a) | `[NS-01-R51] no picture detail reaches a log` |
| NS-01-R52 | Given the picker's temporary copy in `Caches/ImagePicker` and the re-encode's in `Caches/ScribePhoto`, Then each is deleted once read, on Cancel, on back-out, on Let it go and on a dropped pick, the launch sweep empties both folders, and Erase everything deletes both. Added 20 Nov (security review C7; NX-39-R53). | P0 (a) | `[NS-01-R52] the picker's copy never stays` |
| NS-01-R53 | Given the Photos lens with 300 pictures, Then each card decodes the list copy (NS-37), never the stored copy. Not met in #840: `PhotoChapters` draws the stored copy in a 72 pt frame inside a non-virtualised `ScrollView` [F]. Added 20 Nov. | P1 | `[NS-01-R53] the lens reads list copies` |
| NS-01-R54 | Given photo words of 140 grapheme clusters in Devanagari (with conjuncts) or with emoji, When saved, Then the row is written whole (the database ceiling counts code points and must admit it) and the field's limit counts grapheme clusters, the same as `text.ts`. Added 20 Nov: #835's CHECK is `length(photo_text) <= 140` in code points and the fields use React Native `maxLength` (UTF-16 units, UNVERIFIED) while `text.ts` caps graphemes [F]. | P1 | `[NS-01-R54] caps count graphemes and the database agrees` |
| NS-01-R55 | Given a letter with a picture erased on another phone of the same author, When this phone pulls (`finishServerErased`), Then the picture file and row are deleted here and nothing is sent (ADR 0028 D5). Added 20 Nov. | P0 (a) | `[NS-01-R55] a letter erased elsewhere loses its picture here` |
| NS-01-R56 | Given a row whose stored file is missing, When the letter page renders in that session, Then it shows one line (PROPOSED "Not on this phone any more") and, for the author, Remove; the letter's words and recording read whole; after the next launch sweep the row is gone and no line shows. Added 20 Nov (#839 [F]). | P2 | `[NS-01-R56] a missing file reads calmly` |
| NS-01-R57 | Given a picture on Ready, When the app goes inactive (a call, Siri, an alarm) and returns in the same process, Then the picture is still on Ready and nothing was written. Added 20 Nov. | P1 | `[NS-01-R57] an interruption keeps the picture on Ready` |
| NS-01-R58 | Given a kept letter whose picture could not be stored, When its page opens in that session, Then one calm line says the photo did not come along and the words are kept, with "Add a photo" below; the mark holds only the letter id in memory and is never written, logged or sent (#837 `failures.ts` [F]). Added 20 Nov. | P1 | `[NS-01-R58] a failed picture is said once, calmly` |
| NS-01-R59 | Given a build without the native module (Expo Go, web, Android), Then no photo start, Change or Add control renders (absent, not dead). Added 20 Nov. | P1 | `[NS-01-R59] no picker, no photo controls` |
| NS-01-R60 | Given two books, When a picture is added through Home, Then it belongs to the letter of the book active at the tap, and only that book's lens lists it. Added 20 Nov. | P1 | `[NS-01-R60] the picture goes with the active book` |
| NS-01-R61 | Given the server, Then an author insert or update into the `entry-photos` bucket is refused and a client write of a non-null `entries.photo_path` is refused with SQLSTATE `SCPHO` (ADR 0028 D6; BL-870; `supabase/tests/photo_bucket_closed.test.mjs`). Required before `EXPO_PUBLIC_PHOTOS` is on in `production`. Added 20 Nov (r2 S1 threat row). | P0 (a) | `[NS-01-R61] the server refuses a picture` (test:db) |
| NS-01-R62 | Given each device row of this card, Then it runs on a separate install signed in to a test account that holds only the fictional Asha book, and no run sheet, screenshot, recording, log or trace carries a real name, letter, picture or voice (ruling D13). Added 20 Nov. | P0 (a) | `[NS-01-R62] device evidence uses Asha only` (`no-real-family-data` test on evidence PRs) |

## 8. Non-functional budgets

Inherited from `docs/prd/v2/06-nfr.md` unless stated. Device numbers are on an iPhone SE 3 under the 06-nfr section 0 protocol. All numbers below are PROPOSED until the first device run.

- **Latency.** Picker close to thumbnail shown: p95 1,000 ms for a 12 MP local photo, over 20 picks of 12 MP HEIC (CTO pass). Stored copy written (strip, re-encode when needed, hash, write, row): p95 1,500 ms, off the UI thread, no UI frame over 16.7 ms. Tap Speak to microphone live with a picture attached: p95 500 ms, unchanged (F04-REQ-023). Native re-encode hard limit 20 s, then a failure (`BAKE_TIMEOUT_MS`, #834 [F]).
- **Memory.** Peak during attach under 80 MB above the Home baseline. Book with 1,200 letters and 300 pictures under 150 MB resident (NS-37; 06-nfr's 120 MB plus 30 MB).
- **On-device storage.** Stored copy about 1.5 to 3 MB at 4,032 px and quality 0.85 [E]; 300 pictures about 0.5 to 0.9 GB [E], plus list and page copies (NS-37). Temporary copies: 0 bytes after each pick and at every launch. Counted in Storage, never as purgeable cache.
- **Battery.** Under the measurable step for 20 attaches (06-nfr section 0 method). No background work.
- **Offline.** Works fully, except an iCloud-only picture (R46).
- **Accessibility.** AX5 plus Bold Text on SE 3 (R20c, R39); VoiceOver order (R20b); 44 pt (R20a); Undo per T4 (R38); Voice Control and Switch Control (R20e); Smart Invert (R40); contrast per 06-nfr section 8.
- **Localisation.** Photo words and place in any script, stored as typed after trimming ends, right to left where the text is; caps in grapheme clusters (R54). No sentence assembled in code.
- **Privacy (log canary).** J-N18 extended: a canary photo word and place, and a canary file name, through attach, replace, failure and export: 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs (R51).

## 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Letter reads whole; no slot, no message; picture never requested | R28 |
| Second account on this phone after sign-out | Sees none of A's pictures; no lens; sends none | R29, `[X4-R1]` |
| Offline | Everything local works; iCloud-only picture fails calmly | R46 |
| Retry after a lost answer | No picture write exists in any sync call; `photo_path` null on every retry | R15 |
| Sign out | Pictures stay with the letters; sheet says so | R30 |
| Account deletion | The server holds no picture; this phone's pictures go when this phone runs the erase; other phones keep theirs until erased there; the text says so | R31, R55 |
| Kill switch `serverFeaturesEnabled()` off | No change: everything is local | R19 |
| Remote pause `killSwitches.photos` | Hides start, lens and actions; data rights unchanged; can never turn photos on | R19 |
| Plan lapse | Attach, view, lens, export all work | R18 |
| Kill during attach or replace | Sweep; no orphan | R36, R43 |
| Erase everything | Photos folder and both temporary folders deleted by listing, whatever the switch | R52, D5 test |
| New phone restored from an iPhone backup | Pictures return with that backup | R27 (device) |

## 10. Data and engineering

**Fields.**
- Existing, server: `entries.photo_path text` (`supabase/migrations/20260930000000_scribe_core.sql:137`), always null; already in the `entries` content trigger tuple (`20261003000000_security_and_family.sql:444-450`). Not in `ENTRY_DATA_KEYS` (`packages/api/src/server/sync.ts:263-267`) and not referenced in `apps/mobile/src/lib/sync` [F], so the push never sends it. The contract types it `v.nullish(str)` (`sync.ts:617-618`); `sync` narrows it to null (ADR 0028 D6 item 2). Bucket `entry-photos` with author insert, update, delete and read policies (`scribe_core.sql:291-309`, altered at `security_and_family.sql:227-236`): BL-870 closes insert and update (R61).
- Existing, export: `ExportEntry.photo: null` (`apps/mobile/src/lib/export/schema.ts:140`), `counts.photos` (`:358`), `EXPORT_SCHEMA_VERSION = '1.6.0'` (`:90`).
- New, phone only: local migration 11 (#835, `migrations.ts`), table `entry_media` (id TEXT PK; entry_id TEXT; draft_id TEXT; exactly one of the two; kind 'photo'; ext 'jpg'; bytes INTEGER; sha256 TEXT; width, height INTEGER; photo_text TEXT at most 140; place TEXT at most 60; added_at TEXT). No `deleted_at`: hidden by join on `entries.deleted_at`. Unique index on `COALESCE(entry_id, draft_id)` = one picture per letter. Files `Library/Application Support/photos/<media_id>.jpg`; no entry id in the name.
- Types and classes: picture file L4; `photo_text`, `place`, `sha256` L4; `entry_id`, `draft_id` L3 (DATA_CLASSIFICATION rule 5: every `entries.id` is L3; ADR 0028 and the #835 migration comment say L2 and must be corrected; `privacy` confirms; finding X10); `id`, `width`, `height`, `added_at` L2; `kind`, `ext`, `bytes` L1.
- Local migration: 11, append-only, never reversed; a downgrade is not migrated (`migrate()` returns `{ newer: true }`). Server migration for the feature: none. Server migration for BL-870 (ADR 0028 D6): drop `entry_photos_author_insert` and `entry_photos_author_update`; trigger `entries_15_photo_closed` with function `entries_photo_closed()` (revoked from public, anon, authenticated) refusing a non-null `photo_path` with `SCPHO`. No new synced column, so the content trigger tuple and `book_entries` do not change (finding F12 does not apply).
- Sync field group: none. `entry_media` is never read by pull or push.
- Export schema effect: 1.7.0 adds `photo` = `{ file, bytes, sha256, width, height, text, place }` at `photos/<entry_id>/<media_id>.jpg`; 1.6.0 files still read (rules in the `export/schema.ts` header). BL-933 builds it; it does not merge before the BL-868 fix to `DELETION_AND_EXPORT_SPEC.md:335` is in a PR for the founder (ADR 0028 D2). No export code for pictures is in the open stack [F].

**Modules and files (the open stack).** `modules/scribe-photo` (Swift `ScribePhotoModule`: `pickOne`, `reencodeUpright`; PHPickerViewController with `PHPickerConfiguration()` and no library; type allowlist JPEG, HEIC, HEIF, PNG; canvas cap 150 MP; serial queue); `lib/photos/{types,baker,files,entry-media,housekeeping,device,strip,session,text,adopt,failures,flag,pause,pending,picker,registry,copy,hooks,surface,use-photo-pick,use-photo-start,attach,lens}.ts`; `components/photos/{photo-start,pending-photo-thumb,photo-frame,letter-photo,review-photo,photos-lens}.tsx`; edits to `lib/capture/{start-capture,start-capture.logic,erase,sweep}.ts`, `lib/erase-everything.ts`, `lib/store.ts`, `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/write.tsx`, `app/review.tsx`, `app/letter/[id].tsx`, `app/(tabs)/book.tsx`, `components/book/letter-card.tsx`; `packages/content/src/features/photos.en.ts`. Not yet in the stack: `lib/photos/export.ts` (BL-933), list and page copies (BL-932, NS-37).

**Flags and remote pause.** Build flag `EXPO_PUBLIC_PHOTOS`, on only for the value `on` (`flag.ts`, #837). No profile in `apps/mobile/eas.json` sets it today [F]. Remote pause `killSwitches.photos`, which already exists in `packages/api/src/kill-switches.ts:15-16` described as "Photo upload and signed photo URLs"; its description changes to "hides the photo surfaces; never turns them on" (read by `photosPausedNow`, #837). The CTO pass named the pause `photosPaused`; that is the function name, not the key.

**Error codes and outcomes** (each leaves 0 stored files and 0 rows, and is never logged with a path, name or hash). Native: `photo_pick_failed`, `photo_reencode_failed`. JavaScript: `photo_bake_timeout`, `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown`. Pick outcome: `picked`, `cancelled`, `failed`. Commit outcome: `stored`, `needs_words`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `no_space`, `failed`. The CTO pass's names (`photo_pick_cancelled`, `photo_decode_failed`, `photo_disk_full`, `photo_icloud_unavailable`, `photo_write_failed`) do not match the code; the code's names stand, and the rule (0 files, 0 rows, no path) applies to each.

**What the open stack builds (diff read 20 Nov, not run).** Built: R1, R2, R3, R4, R5a, R6 (strip and check), R7 (confirm), R8 (attach functions take an id only), R9a, R10a, R10b (option exists, no seal source yet), R10c, R11, R12, R13a, R15 (no key), R16a to R16c (eraser and sweep), R17a, R17c, R19, R21a to R21c, R22 (source scan test), R25 (lens excludes `not_much`), R27 (no exclusion call), R34, R36, R47, R52, R55 (through `eraseAudioFile`), R56, R57, R58, R59. Not met: R17b (no progress), R37a, R37c, R38a to R38c, R39, R40, R42, R43 (improvement), R45 (check differs), R48, R53, R54. Not in the stack: R14 (BL-933), R31, R32 (`content`), R50 (`mobile` check), R61 (BL-870). Device rows open: R20a to R20e, R39, R46, R27.

**Rollout.** Order, not dates (ruling T5): the stack merges in order #834, #841, #842, #835, #836, #837, #838, #839, #840 (finding F6: six over the 400-line limit; #834's Debug build red at last read by the CTO pass; BL-847 overlaps BL-931 and `product` reconciles in its next backlog PR). Then BL-932 (list and page copies), BL-933 (export 1.7.0, after #797 merges and the founder's BL-868 fix), BL-870 (server write-deny). The flag goes on in `preview` and `testflight` through an `eas.json` PR, then in `production` only when: counsel has read the label line (section 17), R13a, R22 and every P0 device row passed, BL-870 and BL-933 merged, and no P0 row of this card is open (gate G6). Each native build counts against D-092's 15 iOS builds a month on EAS Free (CTO pass; UNVERIFIED by product).

**Rollback.** Flag off or `killSwitches.photos` true hides every surface; files and rows stay; Export, the sweep and Erase everything still handle them. Migration 11 is never reversed. A store build that shipped pictures cannot un-ship the stored files; rollback never deletes them.

## 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Stored copy `Library/Application Support/photos/<media_id>.jpg` | L4 (child's image), C | phone sandbox; in the iPhone backup (no exclusion call) | No; `photo_path` null; server write-deny (BL-870) | life of the letter; Recently deleted 30 days then purge; draft let go; Erase everything; app deleted | `erasePictureOf` through `eraseAudioFile` (eraseEntry, finishServerErased, eraseBook); folder deleted at Erase everything | `photos/<entry_id>/<media_id>.jpg` (1.7.0) | path, name and hash never logged (PRIV-R10) |
| Picker's temporary copy `Caches/ImagePicker/<id>.img` (carries location) | L4 | phone cache | No | until read (seconds), or the next launch | removed after read, Cancel, back-out, drop; launch sweep; Erase everything | No | never logged |
| Re-encode temporary JPEG `Caches/ScribePhoto/<id>.jpg` | L4 | phone cache | No | until read | removed at once; launch sweep; Erase everything | No | never logged |
| `entry_media.id` | L2 | `scribe.db` | No | as the picture | same step | in the path | ids only, never with a path |
| `entry_media.entry_id`, `draft_id` | L3 (rule 5) | `scribe.db` | No | as the picture | same step | in the path | never logged |
| `entry_media.sha256` | L4 | `scribe.db` | No | as the picture | same step | manifest | never logged |
| `entry_media.photo_text` (140), `place` (60) | L4 | `scribe.db`; in the Find index `extra` (NS-02) | No (R26) | as the picture | same step; Find index in the same transaction | `photo.text`, `photo.place` | J-N18 canary |
| `kind`, `ext`, `bytes`, `width`, `height`, `added_at` | L1, L2 | `scribe.db` | No | as the picture | same step | yes | allowed |
| "Photo not saved" mark | L2 (letter id only) | memory only | No | the app process | process end | No | never logged |
| server `entries.photo_path` | L3 | server | always null | n/a | n/a | n/a | n/a |

Rows land in the same PR in `docs/legal/data-policy.md` section 4.4 and `DATA_CLASSIFICATION.md` (finding X2; ADR 0028 D1 gives the data-policy row text). `privacy` confirms classes.

## 12. Door lines

Picking a picture is an act the parent does, not an agreement.
- **Shown:** Apple's own picker. Above it, at most one sentence from `packages/content` once counsel clears it (the NX-33 label, `NX-39-R1`); until then the line is absent and the control still works.
- **Records:** nothing about the act. The stored copy and its row are on this phone only. No PRIV-R21 row, because picking is not an agreement.
- **Never:** reading any picture the parent did not pick; the photo library; location (the file's GPS is stripped); faces or scenes; background reads; upload; a donation to Spotlight, Siri or App Intents (ruling D3); writing tools on the photo words or place (ruling D2).
- **Decline:** Cancel in the picker. Nothing is written. Export and erase work either way.
- **Another adult's data:** a picture may show another adult; the app does nothing different (counsel Q48).
- **Deletion:** pictures go with their letter, and with Erase everything; account deletion cannot reach a phone's pictures and says so (R31).

## 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Child's picture (L4) | A modified client or hostile contributor uploads to `entry-photos` or sets `photo_path` | Drop author insert and update policies; trigger `entries_15_photo_closed` refuses with `SCPHO` (ADR 0028 D6) | R61, `photo_bucket_closed.test.mjs` |
| Location and device data in the file | GPS leaks through the stored copy, export or a later share | Strip at write (segment walk plus signature scan); re-encode carries no source properties | R6 |
| The picker's temporary copy | Location-bearing file left in Caches | Delete after read; launch sweep; Erase everything | R52 |
| Paths from JavaScript | Path traversal into or out of the app's folders | Native accepts only a plain name directly inside its Caches folder; JS `withinFolder` judges the decoded name; stored names match `<id>.jpg` only | #834, #841 tests; R34 |
| A crafted image | Decompression bomb or unexpected codec | Type allowlist; canvas cap 150 MP read before decode; serial queue; 20 s timeout | #834 source scan |
| Native picker module | Supply chain (A8) | No picker package; `security-architect` reviews lockfile and plist (`NX-39-R52`) | R22, review record |
| Switcher snapshot | Shoulder or lost phone (A3) | Pictures blank on inactive, with or without App lock | R13a, R13b |
| Files app | User-visible folder | Application Support, never Documents | R34 |
| iPhone backup | Apple ID takeover (A4) | Same exposure as recordings; said plainly in the where-it-lives lines | R27, R32 |
| System intelligence | Picture or words donated to Spotlight, Siri, App Intents | None registered; source scan | R49 |

## 14. Never lines (rulings D2, D3)

- Never: no letter text, child name, picture, photo word, place or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (ruling D3, R49).
- Never: iOS writing tools (rewrite, proofread) on the photo words or place fields (ruling D2, R50). On the Review editor they are off too (ruling D2; owned by the capture cards).

## 15. Design inputs

- **States to draw.** Home with the photo start (light, dark, AX5 on SE 3); Ready with a picture (default, AX3 or larger per R39, panorama per R42); Ready with "That photo could not be opened" (#838); Review with picture, words and place fields; letter page with picture (own, other author's, file missing per R56, "did not come along" per R58); replace confirm; Undo toast during and after its window (R38b); Book with the Months or Photos choice; lens with 1, 30 and 300 letters; lens at AX5 (thumbnail above the words); second phone with no slot (R28); Me, Storage line that pictures stay on the phone that added them.
- **Components reused.** `Button` (quiet), `Toast` with Undo, `TextField`, `LetterCard` with the `photo` prop, `MonthOpener`, `BookRow`, `PhotoFrame` (COMPONENTS 2.23), `ChoiceGroup` or `ChipGroup` for the lens (R48). No new component.
- **Layout at AX5 on SE 3.** Thumbnail at most 88 pt tall from AX3 (R39, PROPOSED); Speak and Type stay above the fold; lens cards stack; Change, Take the photo off and Undo wrap, each 44 pt.
- **Motion.** None new beyond existing fades; Reduce Motion fades only.
- **Dark mode.** 1 pt hairline frame (R41). **Smart Invert:** pictures ignore invert (R40). **Differentiate Without Colour:** the lens choice shows selection by shape and weight, not colour.

## 16. Content inputs

- Lines as intent (`content` writes, the founder approves; every line in `photos.en.ts` is marked "PROPOSED, needs word approval" [F]): the start ("Start from a photo"); Change; the photo words label ("A few words about this picture, if you like") and place label ("Where, if you like"); replace confirm ("Use this picture instead?", safe choice "Keep the first one"); taken off with Undo; "did not come along" line (R58); missing file (R56); iCloud offline line ("This picture is in iCloud and needs a connection"); the Storage line ("Pictures stay on the phone that added them"); the fixed VoiceOver label (R9a); the sign-out sheet (ruling D1, naming pictures); the deletion text (R31); the where-it-lives keys (R32).
- Banned: memory, moment, album, best, caption, AI, "we added", "backed up" for pictures, "safe forever", any count of pictures.
- Approves: `content` drafts, founder approves the words; counsel reads R31, R32 and the label line.

## 17. Legal, privacy and compliance inputs

Counsel packet 1.5.0 numbers; every reading below is a question, and counsel must confirm.
- Q45: a child's image provided by a parent (children's data).
- Q48: a picture showing another adult.
- Q43: the NX-33 label line above the picker and the where-it-lives lines.
- Q54: "Photos or Videos" becomes collected the day C-32 (pictures follow the account) ships; not in this card.
- LEGAL-REQ-012: location never collected on the server; a typed place stays on the phone (R26).
- App Review 5.1.1(v): in-app account deletion text must be true (R31). App Review 2.5.19: no hidden features; the flag is off in `production` until its gates pass, and a build with the flag off draws nothing (R19).
- Every device row follows ruling D13 (R62).

## 18. Label effect

**Label effect.** None while pictures stay on the phone: "Photos or Videos: not collected" stays true only while R15, R26 and R61 hold. It changes the day pictures leave the phone (C-32, Q54), which this card does not do.

## 19. Claims

- Enables (once the flag is on in `production` and the claims inventory has the row): "Add a picture to a letter. It stays on your phone." "Pictures stay on this phone."
- Forbids: "backed up" (for pictures), "safe forever", "memories", "photo book", "photo album", any count of pictures, "find your photos", any line that the app describes or understands a picture, and screenshots with a real child (licensed or illustrated Asha images only; App Review 2.3.8 UNVERIFIED).

## 20. Free or Plus

Free and ungated (ruling T2, 20 Nov, council round 2): this capability ships free in the 1.0.x line and falls under principle 6, so it never moves behind Plus. Plus holds one paid act, keeping beyond the allowance (D-082); a picture raises the value of a kept letter. Public copy says nothing either way: no "free forever", and no Plus line mentions pictures. Capture is never blocked: a draft with a picture waits at the gate, nothing is lost, the picture stays on the phone. What a family kept stays theirs to read, hear and export, pictures included (R18). Server cost $0; the cost is phone storage (section 8).

## 21. Measures with analytics off

Analytics is off for the 1.0 line (D-124 item 3). If a parent later opts in, the only event is `media_added` with `source` (`photo_first`, `review`, `letter_page`) and `kind` (`photo`) (`NX-39-R34`).
- **Source:** testers send, by hand, the numbers `counts.photos` and `counts.entries` from their export manifest (meaningful only once export 1.7.0 ships; on 1.6.0 `counts.photos` is always 0), and answers to fixed questions. Numbers only, in the founder's private sheet, deleted 90 days after the round (ruling D5).
- **Fixed questions (versioned in `docs/research/`):** "Did you start a letter from a picture this week? (yes or no)" and "Did the Photos view ever feel like a second place to start a letter? (yes or no)".
- **Reporting rule:** "x of n", never a percentage when n is under 20.
- **Study:** five parents; pass line PROPOSED: 4 of 5 start a letter from a picture without help, and 0 of 5 say the Photos view felt like a second place to start a letter.

## 22. Dependencies and gates

Order and gates only (ruling T5).
- Cards: NS-35 (one start, built in #838 through `startCapture`), NS-36 (data follows the letter; export 1.7.0), NS-37 (list and page copies before the lens ships in `production`, R53), NS-33-R3 (lens control semantics), NS-10 (the Book-level new-phone line), NS-02 (searches photo words and place).
- ADRs: ADR 0028 (PR #797) merged on `develop` (finding X11, F5); ADR 0024 (owner backup carries no pictures).
- Backlog: BL-931 (the stack), BL-932, BL-933 (needs BL-868 founder merge), BL-870, BL-847 (overlap to reconcile).
- Counsel: Q43 label line before `production`; Q45, Q48 noted.
- Founder: word approval for `photosCopy`, the sign-out sheet, the deletion text.
- Device runs (ruling D13): picker, HEIC, rotated, panorama, 48 MP, Live Photo, iCloud offline, AX5 plus Bold Text on SE 3, VoiceOver, Voice Control, Switch Control, Smart Invert, dark mode, a second phone, a restore from an iPhone backup, the budgets of section 8; on an SE 3, a current iPhone, an iPhone on iOS 17 and an iPad (App Review runs the iPhone app there; r3 device matrix).
- Gates: G1 (#797, BL-868, BL-933), G2 (counsel read), G3 (words), G4 (P0 device rows), G5 (label and claims diff), G6 (no `production` flag with an open P0 row).

## 23. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | Does the first photo release take NX-39 P1 (a date chip read from the file)? | Founder | No. The date chip waits for spike BL-843 and a parent-confirmed pick. |
| OQ-2 | What a second phone shows where a picture was. | closed 20 Nov | Nothing; R28. |
| OQ-3 | Does the photo start show before any picture exists? | closed 20 Nov | Yes, as built in #838. |
| OQ-4 | Where the lens choice sits. | closed 20 Nov | Above the chapters, under the cover band, as built in #840. |
| O-1 | Ruling T3 says "JPEG quality 0.85". May an upright JPEG within 4,032 px keep its own encoded pixels with segments stripped (no re-encode, no generation loss), or must every stored copy be re-encoded at 0.85? | Karma with `data-architect` | Keep its own pixels (R37c as written); every re-encode uses 0.85. |
| O-2 | Does React Native expose a switch for iOS writing tools on a text field? | `mobile` | If not, R50 stays open as a finding and the fields ship with the finding named in the PR. |
| O-3 | Store a picture with the draft as soon as a draft row exists (during recording), so a kill before Review keeps it? | `mobile`, `design-systems` | Yes, as an improvement after the stack lands; until then R43 as written. |
| O-4 | Thumbnail at accessibility sizes: 88 pt from AX3 (r1) or the screen width (#838)? | `design-systems` | 88 pt from AX3 (R39). |
| O-5 | Crop or fit the Ready thumbnail? | `design-systems` | Fit, uncropped (R42). |
