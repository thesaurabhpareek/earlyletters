# Theme 33: A photo with a letter, kept on this phone

Readiness: 19 of 28. Author's score (`design-systems`), `qa` to confirm. Remains: the founder's decisions at the end (photos in which release, one photo or several, backup option), counsel on the privacy label, policy and permission wording, a read of the F46 spec that F09 and F15 cite (not found, see "Not verified"), a dependency review of the one image library, and a device row number confirmed by a re-scan.

| | |
|---|---|
| Working label | NX-33 (working id, see `_CONVENTIONS.md`); builds on gap G-2 in `../15-core-capability-gaps.md` (slot 23.5 there). No backlog rank assigned |
| Refines | F09 (book; "Themes and photos: F46"), F15 (export; `photos/` folder kept in the format), `docs/legal/DATA_CLASSIFICATION.md` (photos L4), LEGAL-REQ-013 (strip photo location, as cited in file 15), `docs/backlog/FUTURE.md` CVL-10 and BK-17 (cited, not new) |
| Tag | EVIDENCE for the current state (code and docs read 9 Nov on `origin/develop` e15e307b). HYPOTHESIS for demand and for every number marked proposed |
| Size | M (local only, export included); L if photos back up or sync |
| Gate | Founder decisions D1 to D4; counsel on the privacy label and policy (claims registry); a dependency review of the image library; no build before NX-30's tab slot (the Photos tab is the third tab of the four-button bar there) |
| Order | After Build 12. Not in Build 12 (no image picker in `apps/mobile/package.json`, 9 Nov). Earliest a 1.0.x or 1.1; that is a founder call (D1) |

## What file 15 says, and where this file agrees or adds

File 15 G-2: ranked 3rd of the gaps (slot 23.5); M if photos stay on the phone and in the export; rule to keep: one photo with a letter, never photo-only, no machine captions, no face detection; system picker only, no library access; strip location; the privacy-label answer is open; photos in Free; founder decision: first public release or 1.1, local first.

This file agrees with all of that. It adds three things file 15 did not have: (1) the server side already has a one-photo-per-letter column (`entries.photo_path`, migration `20260930000000_scribe_core.sql` line 137), a private `entry-photos` bucket path rule (`{child_id}/{author_id}/{entry_id}.{jpg,jpeg,heic,png}`) and a remote kill switch named `photos` (`packages/api/src/remote-config.ts`, default off), so "one photo per letter" is also the cheapest shape for a later sync; (2) the export format already has a `photos` count and a `photo: null` field (`apps/mobile/src/lib/export/schema.ts`, `pack.ts`), which must change; (3) the Photos tab is now a founder request, so a screen exists to specify. It does not contradict file 15.

## What the parent will see and do

They are in a letter's Review, or on a letter's page, or on the Photos tab. They choose "Add a photo", the phone's own picker opens, they pick one picture. It appears with the letter, next to their words. They can take it off again with an Undo. On the Photos tab they see every picture they have put with a letter, newest first, month by month, for the active child's book; tapping one opens its letter. Nothing is written about the picture. Nothing leaves the phone.

## The decisions that shape the rows

| Question | Recommendation | Why |
|---|---|---|
| One photo per letter or several | One in the first release; the file shape keeps room for more | File 15 and FUTURE 7.4 say one; the server column holds one path; a letter is words first, a photo is secondary (PRD 03 line 109: "photos are optional and secondary"). Two or three is a later bump. BENCHMARK line 53 suggests "one or two"; I do not recommend two yet because it needs a layout rule on the letter page and in Read together |
| Where the photo lives | On the phone, in the app's own folder beside the recordings, one file per letter, name = the letter's id | Same life as the recording; erase paths already walk that folder (`erase-everything.ts`) |
| Library pick or camera | Library pick only in the first release | The system picker needs no permission and no new permission string (expo docs for `launchImageLibraryAsync`, UNVERIFIED against Apple, see below). The camera needs `NSCameraUsageDescription`, a permission question and counsel's wording. A just-taken photo is in the library. Camera is a follow-up row (R15 hypothesis) |
| Photo-only entries | Never. A photo exists only attached to a letter that has words (or is a waiting letter that will) | PRD 03 line 109; FUTURE 7.4; constitution: a photo adds no words |
| Photos tab scope | The active child's book only; every letter photo, newest first, grouped by the letter's own month heading as the Book does; no albums, no search | Keeps the tab "what I have", not "what is missing" |
| Starting from the Photos tab | "Add a photo" there picks a picture and opens Speak or Type with it attached; if the person leaves without keeping words, the picture is dropped | Gives the tab a door without allowing a photo-only entry |

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-33-R1 | EVIDENCE | Given a letter in Review or on its page and the Photos switch on, When the person taps "Add a photo" and picks 1 image in the system picker, Then the letter shows that image next to its words, the letter's words and recording are byte-identical to before (SHA-256 of both unchanged), and the app asked 0 permission questions. | No picker or photo field exists: no image library in `apps/mobile/package.json`, no `photo` field in `lib/store.ts` (searched 9 Nov). | G-2; PRD 03 |
| NX-33-R2 | EVIDENCE | Given a picked image of any size, When it is saved, Then the stored file is a JPEG whose longest side is at most 2048 px (proposed) and whose size is at most 5 MB (proposed); a larger source is scaled down, never refused; the stored copy is the only copy the app keeps (the picked temporary file is deleted). | Nothing is stored. | limits |
| NX-33-R3 | EVIDENCE | Given 10 fixture photos carrying GPS latitude and longitude, device model, capture date and a thumbnail in their EXIF, When saved, Then 0 of 10 stored files contain an Exif or XMP or IPTC segment, and the orientation is applied to the pixels (a rotated source shows upright). | No pipeline. | LEGAL-REQ-013 (as cited in file 15) |
| NX-33-R4 | EVIDENCE | Given any photo, Then the app never reads the image to write, suggest or rank anything: 0 captions, 0 tags, 0 face or object or scene detection calls, 0 network calls with image bytes (a source scan of `apps/mobile/src` finds none of: Vision, ML Kit, captioning, face, classify; and the photo code path has no `fetch`). | Passes today by absence; the scan keeps it true. | constitution; FUTURE 7.3, 7.4 |
| NX-33-R5 | EVIDENCE | Given a letter with a photo, When the person taps "Take the photo off", Then the photo leaves the letter at once with a toast and Undo for 6 seconds (proposed); after the toast ends or the app closes, the file is deleted (0 photo files remain for that letter); Undo within the window brings it back unchanged. | No feature. | S36 pattern in `book.tsx` |
| NX-33-R6 | EVIDENCE | Given a letter that is deleted, When it goes to Recently deleted, Then its photo is hidden everywhere (letter page, Photos tab, Tonight row); on Put back it returns; on Erase now or the 30-day purge, the photo file is deleted with the recording (0 photo files for that letter). | The store erases recordings (`eraseAudio`) and has no photo path. | F08; Recently deleted |
| NX-33-R7 | EVIDENCE | Given Erase everything on this phone (#520, `lib/erase-everything.ts`), When it finishes, Then the photo folder is empty and absent from the export folder and the temp folder (0 files); an interrupted erase resumes and finishes it (`resumeEraseAtLaunch`). Given Delete a book, Then that book's photos are removed (0 files for its letters). Given Delete account (NX-04), Then local photos go by the same erase path and, only if photos ever synced, the server prefix is purged (`purge-worker`, `entry-photos`). | The erase step lists recordings and listening copies only. | #520; NX-04; DATA-REQ-011, -047 |
| NX-33-R8 | EVIDENCE | Given an export (F15), When the book has 3 photos, Then the ZIP holds `photos/<letter id>.jpg` for each, each entry's `photo` field names its file, its size and its SHA-256, the manifest `counts.photos` is 3, the format version is raised and the published JSON schema (`$id`, #673) is updated in the same change; with 0 photos the export is byte-identical in structure to today's apart from the version. | `schema.ts` types `photo` as null and `pack.ts` writes `photos: 0`. | F15 `photos/` row |
| NX-33-R9 | EVIDENCE | Given the Photos tab with photos in 3 months, When it opens, Then it shows a grid of the active child's photos, newest first, under the Book's month headings, with 0 numerals about how many photos or letters, no "add your first photo" nag, and a quiet empty state when none ("Photos you add to letters will show here."); with two children, the book switcher changes the grid (0 photos from the other book). | No tab exists. | NX-30-R12; F12 |
| NX-33-R10 | EVIDENCE | Given a photo in the grid, When tapped, Then its letter opens (the same page the Book opens); the tab has no share, copy or save control, and no long-press menu offering them (hidden sharing). | No tab exists. | sharing hidden |
| NX-33-R11 | EVIDENCE | Given VoiceOver, When focus lands on a photo (grid or letter), Then its label is: "A photo with the letter from {date}" followed by the letter's own first words (the person's words, ending on a whole word), or, if the person typed a description (R12), that description alone; never a generated description. Order in the grid is the visual order, month heading first (heading trait). | No photo UI. | WCAG 1.1.1; constitution |
| NX-33-R12 | EVIDENCE | Given a letter with a photo, When the person chooses "Describe it" and types up to 140 characters (proposed), Then those words, exactly as typed, are stored with the letter and used only as the photo's accessibility label; nothing edits or suggests them; they are in the export beside the photo. | No field. | WCAG 1.1.1; constitution |
| NX-33-R13 | EVIDENCE | Given Dynamic Type AX5 and the Photos tab, Then the grid is 1 column at accessibility sizes, month headings never truncate, the letter page's photo scales to the width and the words stay whole below it; every control is 44 pt or larger; Reduce Motion: a photo appears with no movement (or one fade of 200 ms at most). | No UI. | A-NFR-005 to -007; DESIGN_LANGUAGE H1 |
| NX-33-R14 | EVIDENCE | Given the picker is cancelled, the image cannot be decoded, the file is a format we do not store (video, Live Photo's video part, animated image), or the phone has under the free-space threshold, When the person tries, Then nothing is attached, 0 files are written, and one calm line says what to do ("That picture could not be added. Try another."). A failed save never loses the letter. | No path. | `free-space` rule in Review (UNVERIFIED which constant) |
| NX-33-R15 | HYPOTHESIS | Given the camera is wanted, When specified, Then "Take a photo" uses the system camera with its own permission string, counsel's wording and a label row; not built in this release. Test: none, decision. | Not built. | D2 |
| NX-33-R16 | EVIDENCE | Given sync is on (Family group, Build 12), When a letter with a photo syncs, Then `photo_path` stays null on the server and 0 bytes of any photo are uploaded in this release (the `photos` kill switch stays default off; nothing starts it); the letter on a second phone shows "The photo is on the other phone." | The sync contract names `photo_path` (`packages/api/src/server/sync.ts`); no upload exists. UNVERIFIED what the client sends for it today. | NX-07; D3 |

**Shown / Records / Never / Decline:**
- Shown: at "Add a photo", the system picker (Apple's own sheet); the app adds one line, once, under the first photo: "Photos stay on this phone, in your book." Counsel confirms the sentence is true for the chosen backup option (it is only true under option P1 below).
- Records: the photo file, its size and the letter it belongs to, on the phone. Nothing on a server in this release. No location, no date of capture, no camera model.
- Never: read the library, ask for full library access, detect a face, caption, tag, rank, show "memories", share from the app, put a photo in a notification, widget or analytics.
- Decline and withdraw: the picker's Cancel adds nothing; "Take the photo off" removes it with Undo; Erase everything removes all of them.

## Edge cases

Limited-access libraries (iOS 14+): the picker only shows what the person allowed to the picker, and no app permission state is read (UNVERIFIED against Apple, below). A picked photo is a screenshot or a document: allowed; we cannot and do not judge. A huge panorama: scaled to the longest-side limit. HEIC source: stored as JPEG. A letter on a second child's book: photos follow the letter. A private letter: its photo is private with it and never on Tonight's row or in Read together unless the letter is. A quiet-day mark: cannot hold a photo (it has no words; R4 of photo-only rule). Waiting letter (draft) with a photo: the photo waits with it; if the draft is let go, the photo goes. Low storage: R14. App lock on: the Photos tab is behind the lock like the Book. The app switcher snapshot may show a photo: UNVERIFIED whether App lock blanks the snapshot today; check before launch.

## Offline behaviour

Fully local. Adding, viewing, removing and exporting need no network. No upload exists in this release (R16).

## What we never do

Request the whole library, read a photo's location or date, caption or tag or group by face, make a slideshow or "memories" reel, make a photo-only letter, put a photo on a lock screen or in a notification, send a photo to any server or analytics or crash report, show a count of photos or a gap, offer to share a photo from the app, call a photo "private to you only" or "end to end encrypted" (claims registry; counsel).

## Backup: two options (decision D3)

The founder decided recordings back up free (relayed; the backup pipeline for recordings is `lib/backup/*` with the `entry-audio` bucket, encrypted, built but off in every profile today per `capabilities.ts`, UNVERIFIED for Build 12). Do photos ride with them?

| | P1: photos stay local in this release (recommended) | P2: photos back up with recordings |
|---|---|---|
| What the parent is told | "Photos stay on this phone, in your book, and are in your export." Honest: a lost phone loses the stored copy (the original is usually still in their Photos library, UNVERIFIED for any one parent) | "Photos are backed up with your recordings." |
| New work | none beyond R1 to R14 | A new media type in the backup queue, encryption and key escrow for it, a restore step, purge coverage, size budget, a restore drill row; the `entry-photos` bucket and path rule exist on the server |
| Data class and label | Nothing leaves the phone. Photos are L4 (DATA_CLASSIFICATION); "Photos or Videos" is probably not "collected" while nothing leaves the device (Apple's definition, UNVERIFIED, counsel decides) | Collected: Photos or Videos, linked to the person, not for tracking, for app functionality; the policy and the label change; consent and withdrawal wording needed (door lines) |
| Cost | none | Storage per family: if 1,000 photos at about 0.5 MB each (UNVERIFIED, depends on the 2048 px JPEG), about 0.5 GB per family before encryption overhead; Supabase storage pricing was not checked, so the monthly cost is UNVERIFIED |
| Risk | A lost phone loses photos; a limit on the promise "your book lasts" | The most identifying data we would hold (a child's face) on a server; a larger breach impact; restore proof is open for recordings too (NX-07-R8) |
| Size | M | L |

Recommendation: P1. Reason: the recording backup is not yet proven on a restore drill, photos double the sensitive data on the server, and the export already carries the photos out (R8). Revisit P2 once the recording restore drill passes and counsel has answered the label. This does not contradict file 15 (it said M if local, L if synced).

## Privacy label, policy and counsel (flag)

A child's photo is the most identifying data in the product (file 15; DATA_CLASSIFICATION rule 6). Counsel (`legal`, `regulatory-affairs`) answers, before the switch goes on in `production`: (a) whether on-device-only photos change the App Store privacy label at all (Apple counts data that leaves the device; UNVERIFIED); (b) the policy and Terms text (0.9.0 texts exist; a "What we never do" line that named photos was removed in M13 rule 4 because v1.0 had none, `settings/privacy.tsx` comment, and returns only if true); (c) the one-line "Photos stay on this phone" claim in the claims registry; (d) whether adding a photo of a child needs any added consent line for the other parent (it is the parent's own book; counsel confirms). P2 reopens all of these with data leaving the phone.

## Apple permission wording (UNVERIFIED against Apple documentation)

Expo's `expo-image-picker` documents that "No permissions request is necessary for launching the image library" and the iOS plugin keys are `NSPhotoLibraryUsageDescription` (photos) and `NSCameraUsageDescription` (camera) (Expo SDK 57 docs, read 9 Nov). I did not open Apple's PHPicker documentation, so these are UNVERIFIED as Apple's rule: (1) PHPicker runs outside the app and returns only the chosen items, so no library permission or limited-access prompt is needed; (2) the app must not call the full library authorisation APIs; (3) `exif: false` and a re-encode are our own step because the docs say EXIF is returned only on request and "is not fully stripped" for the camera case. First-release plan: no photo-library key is added to the plist (if the library forces one, counsel words it, and the reason is: "to choose a picture to keep with your letter"; limited access is fine). `security-architect` and `mobile` confirm on a device with limited access selected before any build.

## Storage, format and limits (all proposed)

Folder: the app's documents area beside the recordings; one file per letter named by the letter's id, never the original file name; excluded from nothing special (same iCloud device-backup behaviour as recordings, UNVERIFIED how the app treats that today). Format: JPEG, longest side 2048 px, quality about 0.85, at most 5 MB. Images only: no video, no Live Photo video, no animated images. One photo per letter. EXIF, XMP and IPTC removed by re-encoding, then proved by a byte scan (R3). The library that re-encodes is a new dependency (candidates: the Expo image picker and image manipulator, neither in `apps/mobile/package.json` today); the choice needs a dependency review and a test that the output has no metadata (UNVERIFIED that re-encode alone removes all of it).

## Copy needs (parent vocabulary only)

| Key (namespace `packages/content/src`) | Status | Words |
|---|---|---|
| `tabs.photos` | new (shared with NX-30) | Photos |
| `photos.addButton` | new | Add a photo |
| `photos.removeButton` | new | Take the photo off |
| `photos.removedToast`, `photos.undoButton` | new; Undo reuses the existing Undo word | Photo taken off. / Undo |
| `photos.describeButton`, `photos.describePlaceholder` | new | Describe it / What is in it? |
| `photos.localLine` | new; counsel-registered claim | Photos stay on this phone, in your book. |
| `photos.empty` | new | Photos you add to letters will show here. |
| `photos.failed` | new | That picture could not be added. Try another. |
| `photos.otherPhone` | new | The photo is on the other phone. |
| `photos.a11y.withLetter` | new | A photo with the letter from {date}. |

No "AI", "scan", "analyse", "entry", "draft" in a parent string. Never gender the child; use {child}. All pass `packages/content/test/rules.test.ts`. The localLine is flagged for counsel and fails the claims test until registered.

## Analytics events (counts only; none carry a photo, a name, a path or a place)

All analytics are off in every 1.0 profile (D-124 item 3).

| Event | Status | Props |
|---|---|---|
| `photo_added` | add to catalog first (`packages/analytics/src/catalog.ts` and `docs/analytics/TRACKING_PLAN.md` in the same PR) | `source: oneOf('review','letter','tab')` |
| `photo_removed` | add to catalog first | none |
| `photos_tab_opened` | add to catalog first | none; no count of photos |

## Device rows

Scan of 9 Nov: S1-110, -112, -131 to -135, -140, -144, -150 to -152 are used; #664 (open) carries S1-160 and S1-161; NX-30 takes S1-170 to S1-174 (proposed). NX-33 takes none yet; proposed S1-175 (add and remove with Undo, limited-access library selected, light and dark), S1-176 (AX5 and VoiceOver on the Photos tab and the letter page), S1-177 (Erase everything leaves 0 photo files, checked in the app container), S1-178 (export with 3 photos opens and verifies). `qa` re-scans at merge; do not take two numbers from two scans.

## Dependencies

NX-30 (the tab slot, R12 and R13 there; the From the book row thumbnail, NX-30-R14). #665 and #674 (Book is not redrawn; a photo thumbnail on Book cards is a later change for the Book lane, not specified here). #520 (erase). NX-04 (delete account). NX-07 (restore; P2 only). F15 export format. `lib/capabilities.ts` for the switch.

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None in this release. `photo_path` stays null in sync (R16). A later P2 adds an upload contract |
| Budget (`06-nfr.md`) | Adding a photo does not block the letter's save; the re-encode runs off the UI thread; no number measured (UNVERIFIED) |
| Accessibility | R11 to R13 |
| Switch, off behaviour, noticed by | New build switch `EXPO_PUBLIC_PHOTOS=on` in `lib/capabilities.ts` (name proposed; follows the ACCOUNT_DELETION pattern: written in `eas.json` only where chosen). Off: no "Add a photo", no Photos tab, no route (links land on Tonight), existing photos still exported and erased (the erase and export code run whatever the switch says). Default off in `production` until counsel answers; on in `testflight` and `preview` first. The remote `photos` kill switch exists and is unused here. Rollback: build with it off; local photos stay on the phone. Noticed by: device rows |
| Data class and retention | L4 on the phone, never leaves it (P1). Kept until the letter is erased, the photo taken off, Erase everything or Delete account |
| Schema and grants | Local: one additive migration to the phone's SQLite store (columns for the photo's file name, size, hash and the typed description; `PRAGMA user_version` mechanism UNVERIFIED) with its own test. Server: none in P1, so no migration and no `supabase/tests/grants.mjs` change. P2: a media upload design, not specified here |
| Analytics events | Above |

## Owner lanes

`design-systems`: Photos tab, grid, thumbnail and letter-page photo specs in `docs/design/COMPONENTS.md`. `mobile`: store migration, picker, re-encode, screens, erase and export changes. `content`: the keys. `security-architect`: library review, EXIF proof, no-network scan. `privacy`, `legal`, `regulatory-affairs`: label, policy, claims, permission wording. `qa`: tests and device rows. `data-architect`: only for P2. `product`: decision entry and rows. `user-research`: whether parents want one photo or several.

## Trace and tests

Id convention: `_CONVENTIONS.md`. All paths are proposed (none exist).

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-33-R1 | F09; G-2 | `apps/mobile/test/photos-add.test.ts`; `[NX-33-R1] a picked photo shows with the letter and the words and recording are unchanged` | S1-175 |
| NX-33-R2 | limits | `apps/mobile/test/photos-encode.test.ts`; `[NX-33-R2] the stored photo is a JPEG within the size limits` | none |
| NX-33-R3 | LEGAL-REQ-013 | same file; `[NX-33-R3] 0 of 10 stored photos carry location or any metadata` | none |
| NX-33-R4 | constitution | `apps/mobile/test/photos-no-machine.test.ts`; `[NX-33-R4] no caption, tag, face or network call touches a photo` | none |
| NX-33-R5 | S36 | `apps/mobile/test/photos-remove.test.ts`; `[NX-33-R5] taking a photo off deletes the file after the Undo window` | S1-175 |
| NX-33-R6 | F08 | same file; `[NX-33-R6] a deleted letter's photo is hidden, restored, then erased with it` | none |
| NX-33-R7 | #520; NX-04 | `apps/mobile/test/erase-everything.test.ts` (extend); `[NX-33-R7] Erase everything leaves 0 photo files` | S1-177 |
| NX-33-R8 | F15 | `apps/mobile/test/export-photos.test.ts`; `[NX-33-R8] the export carries the photos, hashes and the new format version` | S1-178 |
| NX-33-R9 | NX-30-R12 | `apps/mobile/test/photos-tab.test.ts`; `[NX-33-R9] the grid is newest first by month, per child, with no counts` | S1-176 |
| NX-33-R10 | sharing hidden | same file; `[NX-33-R10] no share, copy or save control on a photo` | none |
| NX-33-R11 | WCAG 1.1.1 | `apps/mobile/test/photos-a11y.test.ts`; `[NX-33-R11] a photo's label is the date and the letter's words, never generated` | S1-176 |
| NX-33-R12 | WCAG 1.1.1 | same file; `[NX-33-R12] a typed description is stored as typed and used only as the label` | S1-176 |
| NX-33-R13 | A-NFR-005 to -007 | same file; `[NX-33-R13] one column at AX5 and no truncated month heading` | S1-176 |
| NX-33-R14 | free-space rule | `apps/mobile/test/photos-add.test.ts`; `[NX-33-R14] a cancelled or failed pick writes 0 files and keeps the letter` | none |
| NX-33-R15 | D2 | none, decision | none |
| NX-33-R16 | NX-07 | `apps/mobile/test/sync-photo.test.ts`; `[NX-33-R16] a synced letter with a photo uploads 0 photo bytes and keeps photo_path null` | none |

Trace: NX-33-R1..R16 -> F09, F15, LEGAL-REQ-013, DATA-REQ-011, DATA-REQ-047, F08, A-NFR-005, A-NFR-006, A-NFR-007.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| D1: photos in which release | A 1.0.x or 1.1 after Build 12, behind the build switch, off in `production` until counsel answers |
| D2: library pick only, or the camera too | Library pick only; camera later (R15) |
| D3: backup option | P1, photos stay local this release and are in the export |
| D4: one photo or several per letter | One |
| D5: photos in Free | Yes (FUTURE: "one photo with a letter is Free"); never behind Plus |

## Not verified

Apple's own PHPicker and limited-access documentation (not opened; only Expo's docs were). Whether `photos` and F46 are specified: F09 and F15 point to F46 for photos, and I did not find an F46 file under `docs/prd/v2/features` (listing shows F01 to F21 and F30; UNVERIFIED elsewhere). Whether re-encoding removes all metadata with the chosen library. The local store's migration mechanism and where a photo column would sit. What the sync client sends for `photo_path` today. Supabase storage pricing and real photo sizes. Whether App lock blanks the app-switcher snapshot. Whether recording backup is on in Build 12. The Apple privacy-label treatment of on-device photos. Whether any open branch already adds an image picker (open PRs were scanned for device-row ids, not for this).
