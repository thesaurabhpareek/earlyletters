# TDD new scope 16: Photo moments and media, part 3: permission, flags, security, tests, PR breakdown, amendments

Status: Proposed, 20 Nov 2026. Author: `data-architect` (task RD-I3), for Karma, who assembles the PR. Target `docs/tdd/new-scope/16-media-flags-tests-prs.md`. Follows `14-media-library-video.md` and `15-media-ingest-lifecycle.md`. Docs only. Tags and sources as part 1. Nothing here decides a founder or counsel question; defaults are listed in section 8.

## 1. Permission handling and the limited-library path (NS-51-R1 to R4, R14, R18 to R20)

- **When PhotoKit is touched.** Never at launch and never before the parent taps "Turn on" on the Me row after one sentence (R1). Nothing in the picker path needs a permission (`ALREADY-HAVE.md:54`; NS-52 section 5 row 1), so NS-52 never asks and a denial of NS-51 never affects it.
- **States** (`27:"Data and engineering"` NS-51): `off, askedSystem, limited, full, denied, paused`. The stored part is the opt-in and pause in `moments.json` (part 1, section 3); the live part is `authorizationStatus(for: .readWrite)`, read only when the Me row opens, on foreground while opted in, and before any index refresh. Mapping: `notDetermined` shows `off`; `denied` and `restricted` show `denied` (one calm line, "Open Settings" through `Linking.openSettings()` only when the row is opened, R19); `limited` and `authorized` show `limited` and `full`.
- **Level.** The `for:` form, `requestAuthorization(for: .readWrite)`, is the one that reports "limited" (S2 in card 27, `27:"Sources"`); PhotoKit offers no read-only level that I could verify (Unverified; the spike NS-51-R36 confirms). Counsel reads whether a `readWrite` request for a read-only feature draws a 5.1.1 question (C2, section 8).
- **Limited library first (CL-046).** The app works on the selection, never asks again after "limited" or "denied", never says one is better (R3). The album choice is absent under limited access (R14; S2). "Choose which pictures" calls the limited-library picker from our own control only. The automatic alert is suppressed with the Info.plist key `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` (Unverified: the card read it from a screenshot, `27:"Sources"` S2 and R4; the spike confirms the name against Apple's page).
- **No observer.** Changes to the selection are noticed at the next foreground or when the row opens, not by `PHPhotoLibraryChangeObserver`: the R29 scan forbids a background observer, and a foreground-only one adds nothing a refresh does not give (Rec; R18 "noticed only while the app is open").
- **Per account (R24).** Account B starts `off` even when the system already holds the permission: our file's `owner` differs, so the opt-in sentence comes first and Apple's sheet then answers without a prompt.
- **iCloud-only (R21).** The index reads dates only and downloads nothing; the sheet asks for thumbnails with network access off and draws a plain box when none is local (Unverified that this yields a local thumbnail; the spike). Thumbnails go to JavaScript as in-memory `data:` URIs (about 25 KB each [E], at most 30 per sheet), never to a file, so there is nothing to sweep or erase and nothing in Caches (Rec; R25 needs them replaced by opaque boxes before the snapshot).
- **Absent, not greyed (R20):** Android, iPad, the Mac app, Expo Go and when the module is null (`requireOptionalNativeModule`, as `scribe-files`, `modules/scribe-files/index.ts:6, :14`). The floor is iOS 17.0, not the 17.2 floor of NS-49 level 2.
- **Index refresh** is foreground, off the main thread, in pages of 2,000 dates (Rec), skipped in Low Power Mode and at critical storage (R38; NFR B-05, `NFR-BUDGETS.md:113`). The rule runs in `packages/core` and returns at most 30 moments (part 1, section 3). The nudge is a ranked `photoMoment` source inside the `evening` class below `monthAge`, planned at foreground only, neutral words only, skipped for a quiet or hidden book (R11, R41, E16, Q-PM-8, Q-PM-9); it joins `budget.ts` after BL-966 (`11-foundations.md` section 11 step 2). `startCapture({ source: 'moment' })` joins the closed list in the PR of its handler and is dropped at Keep (R39; AP-2).

## 2. Flags and kill switches (NS-51-R32, NS-52-R42)

**Three name sets compete.** Card 27: `EXPO_PUBLIC_PHOTOS` (existing), `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`; `killSwitches.photos` (existing), `killSwitches.photoMoments`, `killSwitches.videos` (`27:165, :382, :411`). Handoff 24: module `scribe-library`, `killSwitches.media`, `EXPO_PUBLIC_MEDIA_SYNC` (`24:159, :278`). Function addendum FR-OPS-39: `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_MEDIA_ATTACH`, `killSwitches.photoMoments`, `killSwitches.mediaAttach` ("names PROPOSED, `mobile` decides", `functions/operations.md:241`). BACKLOG rows use `EXPO_PUBLIC_VIDEO` and older NX-39 names (`EXPO_PUBLIC_MOMENTS`).

**Which one the closures rule: none.** I read every closure on these cards: CL-046 to CL-057 answer the founder questions, CL-109 is the permission-string guard, CL-111 adds only `libraryDays` and `signIn` to the kill vocabulary (`GAP-LOG.md:557-568, :620, :622`). Pack delta 3 says the same: "Not decided by any closure: the migration number (11 or 12), the module and flag names" (`PACK-DELTA-3:5`). So the rule is CR-66: the card beats the function addendum and handoff 24 (cards beat 14 beat 13 and design beat BACKLOG). **Ruled for build: card 27's set.** `EXPO_PUBLIC_MEDIA_SYNC` and `killSwitches.media` are reserved for Variant B and are not created now; FR-OPS-39's `MEDIA_ATTACH` names are dropped; Karma corrects handoff 24 and FR-OPS-39 (Conflict C-9).

| Surface | Build flag (literal `process.env`, AP-1) | Pause key | Gate (fail-open, not `mayRun`) |
|---|---|---|---|
| Pictures, several | `EXPO_PUBLIC_PHOTOS` (exists, `lib/photos/flag.ts:8` at #840) | `photos` (exists) | `flag && !paused('photos')` as `photosPaused` does (`flag.ts:19-20`) |
| Video | `EXPO_PUBLIC_VIDEO` | `videos` | `photosOn && flag && !paused('videos')`: video needs pictures on |
| Photo moments | `EXPO_PUBLIC_PHOTO_MOMENTS` | `photoMoments` | `flag && !paused('photoMoments')`; the pause removes the index at next launch (`27:121`) |

Each only narrows, and sweep, Erase and Export read none of them (R32, R42; NS-01-R19). Steps: the three literals join the pinned list `capabilities.test.ts:243` and `feature-flags.json` (AP-1); `videos` and `photoMoments` join `KILL_SWITCH_KEYS` (`kill-switches.ts:10-36`) with ADR 0029 vocabulary rows, as CL-111 did for `libraryDays`; the doc comment of `photos` there ("Photo upload and signed photo URLs") is wrong for Variant A, where nothing uploads, and becomes "adding pictures" (Amendment A-12). A test fails a release profile that enables either new build flag before its gates close (R32, G6). `NSPhotoLibraryUsageDescription` is injected in `app.config.ts` only when the moments flag is on (R2, CL-109); `privacyManifest(capabilityFlags())` (`app.config.ts:263`) is re-read, and DiskSpace is already declared (`privacy-manifest.ts:109-117`).

## 3. Security and privacy (pointers, not copies)

Security acceptance for both cards is `SECURITY-PRIVACY-ACCEPTANCE-2-CARDS.md:101-142` (#914): STRIDE per card, scans per row, mutant per control. Open questions and the card conflicts C-1 to C-4 are `SECURITY-OPEN-QUESTIONS.md:54-57` (#914). The secure-coding checklist and abuse cases are #915. What this design adds to them:
- **Where each control lives.** Bounded parser, one handle, no link, decode timeout: `scribe-media.probe` (part 2, 1.2 c). Plain-name guard: both native modules, one shared vector file. Metadata: re-encode, header post-pass and the box parser (1.2 e). No machine words: scans for Vision, VisionKit, Core ML, Speech, captioning (R6, R29). Switcher: the inactive gate of NS-01-R13a (part 2, section 5).
- **Data classes.** New L4: video file, poster, derived copies, typed words, `moments.json`. L2: `position`, `duration_ms`. Nothing is L1 that names a person. Safety tiers untouched. X2: under Variant A nothing leaves the phone except the parent's Save a copy and the one-picture NS-05 share (both X2 paths with E23 reads); a network fake proves 0 requests for the whole of NS-51 (R26).
- **Privacy.** Label unchanged under Variant A (on-device data is not "collected", counsel confirms; R30, NS-52-R19); the usage string is a store-review item, not a label row (`27:"Label effect"`). Inventory rows for `media/`, `moments/` and the new columns go in the BL-960 pattern (`data-policy.md` 4.4 and `DATA_CLASSIFICATION.md` 4.5 at the same PR as the code; `docs/legal/**` merges by the founder).
- **Variant B stays out.** Nothing in this design touches `supabase/`, a bucket, a signed URL or a queue. Rows R20 to R25 of NS-52 are not designed here. What B would need, and its hard gates (X2 read, counsel Q54, threat model, red team, label change, founder's money decision), are `PACK-DELTA-3` section 3.3 (`:67`) and `SECURITY-PRIVACY-ACCEPTANCE-2-CARDS.md:142`. The server-side guard that A stays A is `media_bucket_absent.test.mjs` (part 1, 4.3).

## 4. Test design per P0 row (titles from the cards; 27 NS-51 rows and 22 NS-52 Variant A rows; the 4 Variant B P0 rows R21, R22, R23, R25 are out)

Layers: unit, scan, db, device, e2e, review, content as the cards use them. Files are under `apps/mobile/test/` unless `.mjs` (then `supabase/tests/`). Device rows are gate records, not CI (D-state). A mutant is a change that must turn the named test red.

| Row | Test title (from the card) | Layer | File | Mutant that must go red |
|---|---|---|---|---|
| NS-51-R1 | `[NS-51-R1] no library ask before the parent turns it on` | e2e | moments-optin.e2e.ts | call `requestAuthorization` at launch or from another screen |
| NS-51-R2 | `[NS-51-R2] usage string present exactly when the flag is on` | scan | moments-plist.test.ts | module present, string absent; string present with the flag off |
| NS-51-R3 | `[NS-51-R3] limited and full both work; no second ask` | unit | moments-access.test.ts | a second request after a denial or a limited answer; the old `authorizationStatus()` form (no `for:`) |
| NS-51-R5 | `[NS-51-R5] only dates are read` | scan+unit | moments-scan.test.ts, moments-rule.test.ts | read `asset.location`, a file name or a pixel in the index path |
| NS-51-R6 | `[NS-51-R6] the index is small, L4, local` | db+unit | moments-index.test.ts | index written into `scribe.db`; read-back skipped; 31st moment; 7th identifier; field with no level |
| NS-51-R8 | `[NS-51-R8] one moment, no list, no count` | e2e | moments-menu.e2e.ts | a list or a count of moments; offered while a draft exists |
| NS-51-R9 | `[NS-51-R9] the sheet shows pictures, not words` | e2e | moments-sheet.e2e.ts | a title, caption or count on the sheet; a 95 pt thumbnail |
| NS-51-R10 | `[NS-51-R10] no picture is described` | content | moments-content.test.ts | a string naming a subject; a pre-filled photo-words field |
| NS-51-R11 | `[NS-51-R11] the nudge is budgeted and neutral` | unit | moments-nudge.test.ts | planned from a background task; a new class; picture wording on the lock screen |
| NS-51-R12 | `[NS-51-R12] no gap language` | content | moments-content.test.ts | "still", "again" or a count in a nudge; a count in an analytics field |
| NS-51-R15 | `[NS-51-R15] pause reads nothing and keeps nothing` | unit | moments-index.test.ts | pause keeps the ids; pending moment nudges kept |
| NS-51-R16 | `[NS-51-R16] off removes the index` | e2e | moments-optin.e2e.ts | Turn off leaves the album ids; the line claims the system permission was revoked |
| NS-51-R17 | `[NS-51-R17] erase and sign-out clear the index` | db | data-follows-letter.test.ts | sign-out keeps the folder; Erase everything lists no `moments/` |
| NS-51-R18 | `[NS-51-R18] limited access never nags` | device | moments-access.device | the automatic limited-library alert not suppressed |
| NS-51-R19 | `[NS-51-R19] denied is quiet` | device | moments-access.device | a second ask after a denial; a hint on Home |
| NS-51-R23 | `[NS-51-R23] a restored phone starts off` | device | moments-restore.device | the folder written with the flag reading false; a restored phone shows "on" |
| NS-51-R24 | `[NS-51-R24] second account sees nothing of the first` | e2e | moments-account.e2e.ts | opt-in keyed by device; B reads a file whose owner is A |
| NS-51-R25 | `[NS-51-R25] locked means no thumbnails` | device | moments-lock.device | a thumbnail drawn in the switcher snapshot; the sheet opens while locked |
| NS-51-R26 | `[NS-51-R26] no request, no share` | unit | moments-network.test.ts | any `fetch` or share during turn on, index, sheet, nudge, off |
| NS-51-R28 | `[NS-51-R28] canary finds nothing` | unit | canary.test.ts | an asset identifier or album name in a log or breadcrumb |
| NS-51-R29 | `[NS-51-R29] the library module is narrow` | scan | moments-scan.test.ts | a PhotoKit call outside the module; an image-data request in the index path; a background observer |
| NS-51-R30 | `[NS-51-R30] label rechecked per build` | review | review (gate record) | label row not re-run in the build that changes behaviour |
| NS-51-R31 | `[NS-51-R31] review notes and 5.1.1 read` | review | review (gate record) | Notes for Review without the reviewer path |
| NS-51-R33 | `[NS-51-R33] no face or person matching` | scan | moments-scan.test.ts | a `PHAssetCollectionSubtype` people fetch |
| NS-51-R34 | `[NS-51-R34] assistive settings work` | device | moments-a11y.device | a 40 pt row; a label that describes a picture |
| NS-51-R37 | `[NS-51-R37] others' pictures as level 1` | review | review (counsel) | a rule for others' pictures that differs from level 1 |
| NS-51-R42 | `[NS-51-R42] where-it-lives lines are true` | content | moments-content.test.ts | a where-it-lives sentence with no claims-inventory row; "not in the backup" true while the flag read false |
| NS-52-R2 | `[NS-52-R2] the system picker is the only door` | scan | media-scan.test.ts | a camera control; an `expo-image-picker` entry in the lockfile |
| NS-52-R3 | `[NS-52-R3] words make the letter` | e2e | media-ingest.e2e.ts | media with no words can be kept |
| NS-52-R4 | `[NS-52-R4] each picture passes the NS-01 pipeline` | unit | media-ingest.test.ts | a picture added to a letter skips the NS-01 strip |
| NS-52-R5 | `[NS-52-R5] 0 of 10 stored videos carry metadata` | unit+scan | media-strip.test.ts | container copied unchanged; `mvhd` creation time left; a location atom left; 0 of 10 seeded variants |
| NS-52-R6 | `[NS-52-R6] video sound is not read` | scan | media-scan.test.ts | a Speech, Vision or audio-analysis call on media |
| NS-52-R8 | `[NS-52-R8] bad media is refused cleanly` | unit | media-refuse.test.ts | open by path twice; follow a link; accept a wrong type by extension; a leftover temp file |
| NS-52-R10 | `[NS-52-R10] no space loses nothing` | unit | media-space.test.ts | start the copy before the check; leave a partial file |
| NS-52-R11 | `[NS-52-R11] a media failure never costs words` | e2e | media-ingest.e2e.ts | roll back the draft on a media error |
| NS-52-R15 | `[NS-52-R15] remove deletes the file` | unit | media-lifecycle.test.ts | Remove keeps the file; commit before the window ends; row before file |
| NS-52-R16 | `[NS-52-R16] delete takes every file` | db+unit | media-lifecycle.test.ts, data-follows-letter.test.ts | purge row before file; the poster or a derived copy left; Let it go leaves the files; Erase everything keeps `media/` |
| NS-52-R17 | `[NS-52-R17] Save a copy includes the media` | unit | media-export.test.ts | a whole 100 MB video read into memory; no size line; a silent `no_space` |
| NS-52-R18 | `[NS-52-R18] export carries every item` | unit | media-export.test.ts | `media` array missing; metadata in an exported video; works only with a switch on |
| NS-52-R19 | `[NS-52-R19] variant A uploads no media` | unit | media-sync.test.ts, media_bucket_absent.test.mjs | a push carries a media path; a pull creates or deletes a row; a bucket or table named `entry-media` |
| NS-52-R28 | `[NS-52-R28] assistive settings work` | device | media-a11y.device | "Picture 2 of 4" read as a description; a 40 pt control |
| NS-52-R29 | `[NS-52-R29] no words come from media` | scan+content | media-scan.test.ts, media-content.test.ts | a Vision or captioning call; a string describing media |
| NS-52-R30 | `[NS-52-R30] no frame in the switcher` | device | media-lock.device | a frame in the snapshot; Picture in Picture on; AirPlay on |
| NS-52-R32 | `[NS-52-R32] locked picks are dropped` | device | media-lock.device | a pick that lands while locked is kept |
| NS-52-R36 | `[NS-52-R36] lines name videos truthfully` | content | media-content.test.ts | a line says "pictures" where videos are kept too; a line for Variant B |
| NS-52-R37 | `[NS-52-R37] share stays one picture` | review | media-share.test.ts | a share payload typed as an array; a video accepted |
| NS-52-R38 | `[NS-52-R38] no third-party media code` | scan | media-scan.test.ts | a decoder, picker, editor or ffmpeg package in the lockfile |
| NS-52-R40 | `[NS-52-R40] a missing file is calm` | device | media-missing.device | a missing file shows an error code; the row deleted by the sweep (needs Conflict C-3 ruled) |
| NS-52-R44 | `[NS-52-R44] canary finds nothing` | unit | canary.test.ts | a file name, duration or size in a log or analytics |

**4.1 Purge-order mutants the reviewers asked for on #835 (kept for media; each must go red behaviourally, never by a source scan).** From Review A and B at `447611c2` and `39cf30d3` (`#835` comments of 20 Nov 14:05 and 14:49 UTC): A1 the eraser call commented out; A5 the row deleted before the file; A24 Erase everything keeps the folder but still names it; A28 the launch sweep call commented out; M1b the same with a comment the scan regex still matches; M4 the folder delete dropped. For media add: PO-1 poster or derived copy skipped; PO-2 primary file deleted before the poster; PO-3 `media/` left out of the Erase list while `photos/` is in it; PO-4 Let it go leaves the draft's files; PO-5 the sweep deletes a file younger than 120 s; PO-6 the sweep deletes a row whose file is missing (red only once Conflict C-3 is ruled "keep"); PO-7 `finishServerErased` leaves a video. Source-scan-only tests are banned for R15, R16 and R17 (CODE-R04).

**4.2 Real-file seeds (the request on #835: tests over real bytes, not only the stand-in).** `test/helpers/media-seed.ts` writes a temporary directory tree shaped like `photos/` and `media/` with Node `fs`: generated JPEGs (flat colours and seeded shapes, no face, no photograph), tiny valid MP4 files written by a pure box writer, and ten metadata variants (a location atom in `udta`, one in `meta`, a nonzero `mvhd` creation time, a `tkhd` time, a make and model tag, a creation-date tag, a handler name, a fragmented file, a `moov` at the end, a clean file). The real sweep and the real erasers run against a `PhotoFiles` implementation backed by that directory (the `sweep.disk.test.ts` pattern). The same generator writes the 20-video `max` seed (`MEASUREMENT-PLAN.md:57`). A validator stricter than real files passes CI and fails phones (NS-52-R39), so R5 and R8 also have a device row on a real clip with location on, read with `exiftool` or `ffprobe` on a Mac (a `human` task; the founder runs it, `LIBRARY-DECISIONS-A-ui-media.md:82`). Every generated file is Asha-only and synthetic (`no-real-family-data.test.ts`).

## 5. PR breakdown (each at most 400 changed lines and 20 files; fixtures and goldens do not count, CODE-R02)

Sizes: S up to about 150 lines, M 150 to 300, L 300 to 400 [E]. Wave: drop C, wave 5 after BL-961 is green (`PACK-DELTA-3` section 2), except the spikes (E32: NS-51 spike only in Build 13 on `exp/photos` behind the flag) and the gates. Lenses as `11-foundations.md` PR tables: A / B. "Held by" names what only the founder, counsel or product unblocks.

| # | PR | Owner | Lenses A / B | Size | Depends on | Held by |
|---|---|---|---|---|---|---|
| 1 | #835 change: coupled CHECK (option A-minimal), one test row, comment | `mobile` | `data-steward` / `principal-architect` | S | Karma's ruling (Q-E12) | Karma; the founder merges #835 |
| 2 | ADR 0028 amendment [A5] for media (Amendments A-1 to A-3) | `data-architect` | `principal-architect` / `compliance-engineer` | S, 1 file | #1 ruling | none |
| 3 | `media_bucket_absent.test.mjs` | `data-architect` | `red-team` / `security-architect` | S, 1 file | none | none (no migration, so no `approve-migration`) |
| 4 | NS-52 spike: encode time, metadata strip, iCloud video, picker per-type limit, `.ordered`, silent switch | `mobile` | `security-architect` / `principal-architect` | M, record only | native batch (eval C R19) | founder: a real clip with location on, a phone on iOS 17.0 or 17.1, an SE 3 |
| 5 | NS-51 spike (R36): 20,000 items, limited behaviours, alert key, thumbnails of iCloud items, thresholds | `mobile` | `security-architect` / `privacy` | M, record only | none | founder: the phones; counsel starts the usage-string read |
| 6 | Flags, kill keys, `feature-flags.json`, G6 test, usage string only when the flag is on, ADR 0029 rows | `mobile` | `principal-architect` / `security-architect` | M | none | none |
| 7 | Media migration (L16 by today's order): DROP INDEX, two ADD COLUMNs, two triggers, `migrations.v16.test.ts` on the 1,000-letter seed | `mobile` | `data-steward` / `security-architect` | M | #1 (or the rebuild under option B, size L) | Karma's number |
| 8 | `limits.ts`, list-shaped `PhotoStore` (`list`, `add`, `remove`, `reorder`), transaction for limit and `position`, lens map type | `mobile` | `data-steward` / `principal-architect` | M | #7 | none |
| 9 | `scribe-photo` `pickMany` and per-item progress; scans and hash pin | `mobile` | `security-architect` / `principal-architect` | M | #6, BL-953 (same Swift file) | none |
| 10 | `scribe-media` (a): probe, bounded parser, refusals, name guard, shared vectors | `mobile` | `security-architect` / `principal-architect` | M | #4 | none |
| 11 | `scribe-media` (b): encode, strip, header post-pass, poster, native hash, cancel, progress | `mobile` | `security-architect` / `principal-architect` | L | #10 | none |
| 12 | `test/helpers/media-seed.ts`, box writer and parser, the 10 variants, `asha-book/media.mjs` | `qa` | `security-architect` / `data-steward` | M | none | none |
| 13 | `ingest.ts`: state machine, room checks, take concurrency, kill points, `mediaIngestBusy` | `mobile` | `principal-architect` / `security-architect` | M | #8, #9, #11 | none |
| 14 | Lifecycle: `eraseMediaOf`, Let it go and `deleteDraft` fix, Erase list, sweep with race guard, real-file tests, mutants of 4.1 | `mobile` | `data-steward` / `compliance-engineer` | L | #8, #12, #13 | Conflict C-3 (product) for PO-6 |
| 15 | Review (a): multi-item strip, per-item words, limit line, progress and failed states | `mobile` | `design-systems` / `principal-architect` | M | #13 | PROPOSED words |
| 16 | Review (b): reorder (drag and "Move earlier" and "Move later"), Remove and Undo on the one undo clock | `mobile` | `design-systems` / `principal-architect` | M | #15, `createUndo` (33-3) | none |
| 17 | `expo-video` adoption: wrapper as sole importer, `file://` scan, no PiP or background test | `mobile` | `security-architect` / `principal-architect` | S | NS-52 scheduled; first TestFlight processing email (LD-10) | founder: a new native dependency |
| 18 | Letter page with items and player behaviour, switcher gate, labels | `mobile` | `design-systems` / `security-architect` | M | #8, #17 | none |
| 19 | Lens, poster copies, `group_concat` in Find, reindex on edit | `mobile` | `design-systems` / `data-steward` | M | #8, NS-37 BL-932 | Conflict C-7 (lens card rule) |
| 20 | Export (a): `readChunks`, `sha256File`, estimate with media, low-space refusal | `mobile` | `data-steward` / `compliance-engineer` | M | #8 | none |
| 21 | Export (b): split per child-year, then half-year (spec 4.2) | `mobile` | `data-steward` / `compliance-engineer` | L | #20 | founder, OQ-M5 |
| 22 | Export (c): `media` array minor, goldens, verify | `mobile` | `data-steward` / `compliance-engineer` | M | #20, BL-933, BL-868 | the founder's BL-868 merge |
| 23 | Me, Storage size line, Remove per letter's media; Share stays one picture (type test) | `mobile` | `design-systems` / `security-architect` | S | #8 | none |
| 24 | NS-52 content keys, claims-inventory rows | `content` | `compliance-engineer` / `design-systems` | S | #8 | the founder approves words |
| 25 | `packages/core` moment rule, injected clock and zone | `mobile` | `principal-architect` / `privacy` | S | none | numbers fixed by #5 |
| 26 | Moments store: `moments.schema.ts`, `appSupportDir('moments')`, owner check, Erase and sign-out registration, classification test | `mobile` | `data-steward` / `security-architect` | M | BL-961, #6 | none |
| 27 | `scribe-photo-library` (a): status, request, limited picker, date paging, alert key | `mobile` | `security-architect` / `privacy` | M | #5 | none |
| 28 | `scribe-photo-library` (b): thumbnails as `data:` URIs, original copy to the ingest folder | `mobile` | `security-architect` / `principal-architect` | M | #27 | none |
| 29 | Me row "Photo moments", opt-in sentence, pause, off, albums, states | `mobile` | `design-systems` / `privacy` | M | #26, #27 | PROPOSED words; counsel on the sentence |
| 30 | Moment sheet A-S17, third menu item, `startCapture({ source: 'moment' })` | `mobile` | `design-systems` / `security-architect` | M | #13, #28, #29 | none |
| 31 | Moment nudge as a ranked source in the budget | `mobile` | `principal-architect` / `privacy` | M | BL-966, BL-985, #25 | founder: lock-screen words (CL-054) |
| 32 | NS-51 scans and canaries: allow-list module scan, no face or person, network fake, analytics, canary | `qa` | `security-architect` / `principal-architect` | M | #27 | none |
| 33 | Inventory, label and policy rows per variant; Notes for Review (R30, R31, R42) | `privacy` | `compliance-engineer` / `regulatory-affairs` | S | #14, #26 | the founder merges `docs/legal/**`; counsel |

**Count and size.** 33 PRs, of which 2 (#4, #5) are spikes that leave a record and no shipped code. By size: S 8 (#1, #2, #3, #17, #23, #24, #25, #33), M 22, L 3 (#11, #14, #21). Total about 7,400 changed lines [E: 8 x 100 + 22 x 250 + 3 x 380 = 7,440]. Fixtures and goldens add more and do not count. A and B before the spikes: #1 to #3 and #6 are the only PRs that can start now. Order: gates and flags, then #7 to #14 (the data and ingest spine), then #15 to #23, then NS-51 (#25 to #32), then #33 with each. `qa`'s harness PR #12 can land any time before #14.

## 6. Risks, each with a way back
1. **Export over 3.9 GB or a video read whole into memory.** Way back: the video flag stays off until #20 and #21 land.
2. **Native encode and strip are unproven.** The card marks the API UNVERIFIED; the output is checked by our own parser. Way back: flag off; stored files stay handled by sweep and Erase.
3. **The sweep race and the missing-file rule** can delete a parent's typed words or a file in flight. Way back: C-3 and the 120 s guard; the flag.
4. A second native module doubles the plain-name guard. Way back: one module (OQ-M1).
5. The backup grows by up to 224 MB a letter (OQ-M2).

## 7. Conflicts, unverified, and the cite check

**Conflicts to product (card gaps; nothing built the other way).**
- C-1 NS-51-R6 against R23: "phone database" and "excluded from backup" (part 1, section 3).
- C-2 NS-52 section 10 names `poster_path` and `order`; `order` is reserved SQL and a stored path rots after an app update (part 1, 2.4). Use `position` and a derived name.
- C-3 NS-52-R40 (a missing file shows a box, words intact) against NS-01-R36 (P0: a row whose file is missing is removed) and ADR 0028 D1 step 3.
- C-4 Card 27 says "migration 12"; L12 is Firsts (`data-and-sync.md:40`). Numbers go in merge order.
- C-5 NS-52-R10 "the copy never starts" needs the video's size, which PHPicker does not give before the copy (Unverified; part 2, 1.2 a).
- C-7 NS-52-R41 "pictures and a poster" does not say one lens card per letter or one per item (default: one per letter).
- C-8 NS-37 "Not in scope" excludes video; NS-52-R41 puts posters in the lens. And NS-01-R37a to c say 4,032 px and JPEG 0.85, while `ScribePhotoModule.swift:50-51` caps at 4,096 and 0.9 and no `4032` appears in the #840 stack (to `mobile`, BL-955).
- C-10 Card-to-card: NS-01-R15, R21a, R22 and NS-49-R6, R25, R26 still read the old way at `a3806f74`; card 27 lists the edits, no errata row records them (`PACK-DELTA-3` section 5 item 4, `:80`).

**Conflicts for Karma (engineering).** C-6 `11-foundations.md:28, :230` say JavaScript cannot set the backup flag; `ScribeFiles` can (part 1, F6). C-9 handoff 24 and FR-OPS-39 flag and module names (section 2). C-11 `PACK-DELTA-3` and handoff 24 recommend a SQLite index file; this design recommends a JSON file (part 1, section 3).

**Unverified.** `PHPickerConfiguration.selection = .ordered`; the limited-alert Info.plist key name; whether `loadFileRepresentation` yields a local thumbnail or a size for iCloud videos; `AVAssetExportSession` metadata and creation-time behaviour and the exact error on background; the silent-switch default of `expo-video`'s audio session; SQLite accepting `ADD COLUMN ... CHECK` on `expo-sqlite` 57; a flag on a folder excluding files created later; DESIGN-DELTA.md (#923) not readable; nothing ran on a phone.

**Cite check.** I checked 82 cites by script against the shas above (file, line and an expected phrase on that line): 81 held; 1 was wrong (the ADR 0028 D5 range) and is fixed. Before that run I corrected 12 more by hand: the Erase list lines in `erase-everything.ts`, three handoff and card line numbers, the pinned-list line in `capabilities.test.ts`, the ADR block range, and the claim that no view reads `entry_media` (the Find view does, part 1, section 4). Not checked: line numbers inside #923, which could not be fetched.

## 8. Questions for the founder, counsel, product and Karma (each with my default; none is decided here)

| # | Question | Who | Default |
|---|---|---|---|
| Q1 | Amend #835's two CHECKs now (A-minimal), or add a rebuild later? | Karma rules; the founder merges #835 | A-minimal |
| Q2 | Videos in the iPhone backup, with a count against iCloud space | founder, counsel on the line | in the backup like pictures, an honest line, size in Me, Storage (OQ-M2) |
| Q3 | Save a copy above 3.9 GB: split per spec 4.2 | founder | split by child-year, then half-year; video flag off until it lands (OQ-M5) |
| Q4 | A new native dependency, `expo-video` | founder | adopt, gated as LD-10 says |
| Q5 | Devices for the spikes and device rows: a phone on iOS 17.0 or 17.1, an SE 3, a clip with location on | founder (buying is his) | he says which he holds before the first sheet |
| Q6 | Confirm the caps (6, 2, 60 s, 100 MB) after the spike measures real sizes | founder | keep (CL-047, ASSUMED) |
| Q7 | The usage string, the opt-in sentence, App Review 5.1.1 for a library permission for a child's pictures, a `readWrite` request for a read-only feature, label rows, others' pictures (Q43, Q45, Q48) | counsel through the founder | flag off in `production` until read |
| Q8 | Variant B | founder | closed (CL-048) |
| Q9 | One lens card per letter or per item; the "Describe this" text is the same field as the caption | product | per letter; same field (OQ-M3, M4) |
| Q10 | One native module or two (`scribe-media`); JSON file or SQLite for the index; the media migration number | Karma | two modules; JSON file; next free at merge |

## 9. AMENDMENTS (for Karma to apply; exact file, section and edit; I edit no existing design file)

- **A-1 ADR 0028 D1** (`docs/adr/0028-photo-seal-find-on-device-data.md`, the `entry_media` block at `:32-49`). Replace the `kind` and `ext` lines with `kind TEXT NOT NULL`, `ext TEXT NOT NULL` and add after the CHECK list: `CHECK ((kind = 'photo' AND ext = 'jpg') OR (kind = 'video' AND ext IN ('mp4','mov')))  [A5]`. Replace "(video is not in Build 13)" with "(no video code in Build 13; the CHECK admits it so NS-52 needs no table rebuild) [A5]". In "One picture per letter ..." append: "NS-52's migration (L16 by merge order) drops the index, adds `position` and `duration_ms` and two triggers [A5]". Add a "Stored files" bullet for `media/`, `<id>-p.jpg` and the derived names, in the backup except derived copies.
- **A-2 ADR 0028 D2** (`:68-76`, the `ExportEntry.photo` line at `:71`). Append: "A later minor adds `ExportEntry.media: ExportMedia[]` and `counts.videos`; `photo` stays the first picture. Media paths `media/<entry_id>/<media_id>.mp4` and `-p.jpg` [A5]."
- **A-3 ADR 0028 D5** (`:188-191`). After "Purge removes the file first, then the row" add the per-row file order (derived copies, poster, primary file, row), `media/` and `moments/` to the Erase everything folder list, and "Let it go on a draft calls the same eraser at once [A5]".
- **A-4 `11-foundations.md` section 6 (NS-36)**, "Design and tests, by rule", Rules 1 and 3: add "per item: derived copies, poster, primary, row; `media/` joins the Erase list"; Rule 5: "also parses `moments.schema.ts`"; PR table: add rows 36-7 (media tests in `data-follows-letter.test.ts`, owner `mobile`, lenses `data-steward` / `compliance-engineer`).
- **A-5 `11-foundations.md` section 7 (NS-37)**: in Facts replace "expo-file-system 57.0.7 has no backup-exclusion API" with "... ; `ScribeFiles.setExcludedFromBackup` does (`modules/scribe-files/index.ts:10-11`)" and in Design say `makeCopy` may call it instead of writing in place; add `<id>-p512.jpg` for a video's poster; the lens keys on the first item by `position`. Decision 5 of section 0 changes the same way.
- **A-6 `11-foundations.md` section 8.3 (Export 1.7.0)**: append "Videos and several pictures: the next free minor adds `media` (part 2, section 3 of `15-media-ingest-lifecycle.md`); `pack.ts` needs chunked reads before it can carry a video". Section 1.4: "a video encode also waits on `captureBusy()` and restarts after the take".
- **A-7 `11-foundations.md` section 8.1 (NS-01)**: add "`PhotoStore` becomes list-shaped in NS-52 (`get` to `list`); the sweep's missing-file rule is under Conflict C-3".
- **A-8 `data-and-sync.md`** line 39 (L11 row): "ceilings 2240 and 960 as built at `39cf30d3` (1120 and 480 in eval A are superseded); the coupled `kind`/`ext` CHECK [A5]"; add a row "L16 | NS-52, wave 5 | `entry_media` DROP INDEX, `position` L2, `duration_ms` L2, two triggers | none"; section 2.5 (`:79`) export minors: add the media minor; section 3.1: "deletion per item".
- **A-9 `architecture.md`** AB-7 (`:72`): after "`entry_media`" add "; the moments index is rebuilt from the library and lives in an excluded folder, `moments/`". AP-1 (`:123`): the pinned list gains `EXPO_PUBLIC_VIDEO` and `EXPO_PUBLIC_PHOTO_MOMENTS`. AP-4 (`:126`): modules `scribe-media` and `scribe-photo-library`, each with a Swift scan and a hash pin; one shared name-vector file.
- **A-10 `security.md`** 3.5 (`:148-156`): add NS-51 and NS-52 rows (Variant A: nothing leaves except Save a copy and the one-picture share; Variant B not designed). Section 3.1: the allow-list scan for one module (R29).
- **A-11 `privacy.md`** 1.1, section 3 (label rows per variant, FR-PRV-36), section 4 (inventory rows for `media/`, `moments/`, the new columns and the usage string, FR-PRV-37).
- **A-12 `packages/api/src/kill-switches.ts`** (with PR #6): add `'videos'` and `'photoMoments'`; the comment of `photos` becomes "Adding pictures. Nothing uploads under Variant A." ADR 0029 gets the two vocabulary rows.
- **A-13 `README.md`** Files table: add rows 14 to 16. Code findings table: add "Find reads one item's words (`find/sources.ts:53`)", "the sweep deletes a row whose file is missing (#840 `housekeeping.ts:53`)", "export has no streaming or ZIP64 (`pack.ts:14, :21`)".
- **A-14 To product (cards NS-01, NS-36, NS-37, NS-02, NS-11)**: apply card 27's "Changes to locked cards" in place with an errata row (C-10); NS-01-R36 gains "unless NS-52-R40" (C-3); NS-37 Not in scope strikes "video" and gains NS-52-R41 (C-8); NS-36-R1a to R1d, R2, R5 read "per item"; NS-02-R5 reads "each item's photo words and place".
