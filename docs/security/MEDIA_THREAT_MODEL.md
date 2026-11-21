# Threat model: pictures and recordings on the phone (BL-851)

Owner: `security`. Reader: `security-architect`. Satisfies NX-39-R36, NX-39-R43, NX-39-R53, NX-39-R42. Also cited: NX-33 "Not verified" (that section was not re-read for this page), SEC-ML-7 and SEC-ML-14 (named by the backlog row; chapter 06 does not define them, so this page does not rely on them). The method and the STRIDE rows for each card live in `docs/tdd/new-scope/security.md` (sections 3.1 to 3.5); this page does not repeat them. It answers one question: where could a picture, a recording, a date or a city persist or leak on the phone, and what stops it. The native-package review process is `docs/security/NATIVE_MODULE_GATE.md` (BL-878); it is cited, not repeated.

Status: docs only. Nothing here was run on a phone. Read at `develop` `7512efe4` (21 Nov 2026).

## How to read the marks

- **Verified (repo)**: read in a file at the sha above; the path is given. This says the code or test exists, not that it behaves on a device.
- **Verified (vendor)**: read on an Apple page, linked in the sources at the end.
- **Open PR**: the control is in a pull request that is not on `develop`. Until it merges it is not a control. #835 to #840 are open as of this read.
- **UNVERIFIED**: a claim nobody has checked. Each has a device row in section 7 (P1: D-9, P5: D-10, P15: D-11; P3 residuals are covered by D-4 and the source read; P11 is not built, so its row is G-5).
- **GAP G-n**: no control exists. Section 8 lists each gap with a proposed row for `product` to file. This page does not edit `docs/BACKLOG.md`.

## 1. Assets

| Id | Asset | Where it lives today |
|---|---|---|
| M1 | A recording of a parent's voice (the original) | `Documents/ExpoAudio` and the top of Documents (`apps/mobile/src/lib/capture/recordings.ts:34-37`); ADTS on iOS (`recording-file.ts`) |
| M2 | The picture a parent picks, original with its location | `Caches/ImagePicker`, for as long as the re-encode takes (`apps/mobile/src/lib/photos/files.ts`, header comment) |
| M3 | The re-encoded temporary JPEG | `Caches/ScribePhoto`, read once, removed at once (`files.ts`) |
| M4 | The stored picture, `<media_id>.jpg` | `Library/Application Support/photos` (`files.ts` `photosDirectory`); the writer is `expoPhotoFiles` |
| M5 | A date, a city, a place name | Not stored on develop. The re-encode drops them (section 3). The library index that would hold them is not built (P2) |
| M5b | Days the parent typed (ids and dates only, no pictures) | `Library/Application Support/days` (`apps/mobile/src/lib/days/store-file.ts` `daysDirectory`), excluded from backup (`setExcluded`), erased by `eraseDaysFile` |
| M6 | A letter's text and a child's name, drawn on screen | The screens, and the iOS snapshot of them (section 4) |
| M7 | Export ZIP and print PDF (letters, later pictures) | `Caches/exports`, `Caches/Print` (`apps/mobile/src/lib/export/device.ts:71-72`; `erase-everything.ts` `CACHE_COPIES`) |
| M8 | Encrypted recording backup object (`SCRB`) and its temp | Server (flag off by default) and `backup-tmp` on the phone (`apps/mobile/src/lib/backup/restore.ts`, header comment) |
| M9 | The listening copy (enhanced audio) | `Library/Application Support/listening`, excluded from backup (`modules/scribe-audio/ios/ScribeAudioModule.swift:90-95`) |

Out of scope here: the encryption design of the recording backup (`docs/tdd/new-scope/security.md` 3.4), account and RLS (`docs/tdd/04-security-identity.md`), notifications (security.md 3.11).

## 2. Adversaries (from security.md section 1)

A3 someone holding the unlocked phone. A4 someone with the iPhone backup, or the backup's owner. A8 a dependency or build tool. A9 a malformed file from outside the app (a picked picture, a restored object, an old export). A11 the phone's own services (Writing Tools, keyboards, share extensions, Spotlight). Section 1 of security.md defines them; the ids are reused so rows join up.

## 3. Entry points and the per-surface table

Entry points that bring bytes in: the system photo picker (`modules/scribe-photo/ios/ScribePhotoModule.swift`, `PHPickerConfiguration`, `.images` filter, line 135 to 136); the microphone (`expo-audio`; no import of audio from outside the app: grep for `DocumentPicker`, `getDocumentAsync`, `public.audio` in `apps/mobile/src` and `app.config.ts` found none); the restore download (`backup/restore.ts`); sync (text only; media banned from the payload by BL-852, which is blocked on BL-846). The app asks for no photo-library or camera permission: `app.config.ts` has only the Face ID description (line 139), and the picker runs out of process.

| # | Place or path | Abuse case | Control (repo) | Mark |
|---|---|---|---|---|
| P1 | Photo location, camera model, XMP, embedded thumbnail leave in the stored copy or an export | The parent shares a letter and the picture carries a home location | The re-encode copies no source property: `ScribePhotoModule.swift:38-41` (header) and no source property is passed to `CGImageDestinationAddImage` (the module's own comment above the `write` dictionary). The `kCGImageMetadataShouldExcludeGPS` and `kCGImageMetadataShouldExcludeXMP` keys in that dictionary (lines 225 and 226) are probably inert there, because they are documented for the metadata copy calls (UNVERIFIED: not read on Apple's page; check in D-9 by removing them in a scratch build and diffing the output). They are not relied on. A second pass in TypeScript (`photos/strip.ts`) re-checks before storing: **Open PR #836** | Re-encode: Verified (repo, source read; behaviour of the Apple call UNVERIFIED on device). Strip pass: Open PR |
| P2 | The picked original (with GPS) stays in `Caches/ImagePicker` | Another app, a backup tool or a forensic read finds a located original | Read once, then removed (`expoPickedFiles.remove`); `sweep()` empties `ImagePicker` and `ScribePhoto` (`files.ts`). Caches is not in the iPhone backup (Verified (vendor), source 2). The launch call to `sweep()` is not on develop: grep of `apps/mobile/src` outside `lib/photos` finds no caller | Delete and sweep functions: Verified (repo). Launch wiring: **Open PR #835** (adds the launch call in `apps/mobile/src/lib/capture/sweep.ts`, from its file list; #836 also touches that file; contents not read). GAP G-1 until it merges and a test interrupts every step (NX-39-R53 title) |
| P3 | Path traversal from JavaScript into the native module or the file layer | A crafted uri reads or removes another file | `withinFolder` judges the decoded name against `PLAIN_NAME` (`files.ts`); the stored name must match `STORED_NAME` (`<id>.jpg`); the Swift side takes only a plain name inside its own Caches folder (`ScribePhotoModule.swift:45`, `89-95`); `apps/mobile/test/photos-device.test.ts` reads the Swift as source | Verified (repo). Residuals (a link in place of a folder, time of check against time of use) are `security.md` 3.1, N-B1r |
| P4 | Decoder attack: a decompression bomb, a type confusion, a crafted HEIC or PNG | A picked file crashes or hangs the app, or exploits ImageIO | Type allowlist (JPEG, HEIC, HEIF, PNG, line 56); pixel cap 150 million read before decode (line 53 and 204); `kCGImageSourceShouldCache: false`; thumbnail path with a bounded longest side (line 209 to 212); a serial queue of its own (line 59). The decoder itself is Apple's ImageIO; no third-party image package is in `apps/mobile/package.json` (grep of 21 Nov: no `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `expo-media-library`) | Caps and allowlist: Verified (repo). Memory use of a 150 MP decode beside audio enhance: UNVERIFIED (security.md N-Q1). Device row D-8. ImageIO bugs are outside our control: the mitigation is iOS updates. No fuzz run: GAP G-6 |
| P5 | Audio parsers: the ADTS frame reader, the whisper.rn decoder, the `SCRB` header | A truncated or hostile file, from a restore or an old export, crashes or loops | ADTS reader is pure TypeScript with a 13-bit length cap (`capture/adts.ts`, `ADTS_MAX_FRAME_BYTES`). The `SCRB` header is parsed with named refusals: `bad_magic`, `bad_version`, `bad_header`, `bad_segment`, `truncated`, `trailing`, `length` (`backup/format.ts:56`, `94-96`); the ciphertext hash is checked before decrypt and the original hash after (`restore.ts` header). Tests: `test/backup-format.test.ts`, `test/backup-restore.test.ts`. whisper.rn binary provenance is not checked (NATIVE_MODULE_GATE.md "Not yet checked") | Verified (repo) for the parsers. Decoders in `whisper.rn` and the platform audio stack: UNVERIFIED. No fuzz run: GAP G-6 |
| P6 | Switcher snapshot, screens that show a picture or a letter | Someone flips through the app switcher | App lock draws an opaque `PrivacyCover` when the app goes inactive **while the lock is on** (`components/app-lock/app-lock-layer.tsx:10`, `privacy-cover.tsx:26`; `lib/app-lock/controller.ts:55-58`; tests `test/app-lock-behaviour.test.ts`, `app-lock-machine.test.ts`). The picture-only blanking (`PhotoFrame`, `usePictureCovered`) is **Open PR #838**. With App lock off, nothing covers a letter's text on develop | Lock-on cover: Verified (repo). Picture blanking: Open PR. Lock off: GAP G-2. Timing of the snapshot: Verified (vendor, source 1) and UNVERIFIED for scenes on the current iOS |
| P7 | Thumbnails and image caches the app or the system keeps | A cached thumbnail outlives the picture | The app has no image-cache package (see P4). `kCGImageSourceCreateThumbnailFromImageAlways` is used only inside the re-encode and its output is the stored copy. System-level thumbnails (Spotlight, Quick Look, notification attachments) are blocked by the scan in `test/no-system-indexing.test.ts` for Spotlight and Handoff. The display component's caching (React Native `Image`) is UNVERIFIED | Spotlight and Handoff: Verified (repo). Display cache: UNVERIFIED, device row D-5 |
| P8 | Stored picture and database readable while the phone is locked | A locked phone is read after a first unlock | Default class `NSFileProtectionCompleteUntilFirstUserAuthentication` (`app.config.ts:93`, entitlement at line 261). The class is the right one for the background reader and for batch work, as NX-39-R43 says; `complete` would break any read while locked. `modules/scribe-keys/ios/ScribeKeysModule.swift:91` sets the same class explicitly on its own file. `expoPhotoFiles.write` and the native `copyItem` (line 171) set no class explicitly: whether they keep the entitlement default is UNVERIFIED (security.md N-B2) | Default: Verified (repo). Per-file class: UNVERIFIED, device row D-2. GAP G-3 (set `.protectionKey` and read it back) |
| P9 | Device backup (iCloud or a computer) holds pictures and recordings | A backup's owner or a stolen backup reads them | By decision, stored pictures are NOT excluded from the iPhone backup (`files.ts` header, NX-39 F9, ADR 0028 D1). Recordings in Documents are backed up by default (Verified (vendor), source 2). The listening copy, the escrow keys file and downloaded models are excluded (`ScribeAudioModule.swift:94`, `ScribeKeysModule.swift:94`, `lib/model-files.ts:43`). The user-facing wording is `packages/content/src/strings.en.ts:1041-1043` ("iPhone backup") and NS-01-R27, R32 | Verified (repo) that the decision is coded and worded. Not a control against A4: it is a stated exposure. Whether the words match the real flags is device row D-3. NX-39-R43 asks a read-back of the flag at open, rebuild, replace and restore: not built, GAP G-4 |
| P10 | Restore: a restored phone brings back files and a database we did not write | A hostile or old backup puts a located original, a stale index or a wrong-owner file into place | Restore never overwrites a local file; a differing file is kept and flagged; decrypted bytes exist only in `backup-tmp`, excluded from device backup and swept at launch (`restore.ts` header). For pictures: no index exists yet; NX-39-R42 says the index is rebuilt after restore, not trusted. A stray `ImagePicker` file in a restored Caches cannot occur (Caches is not backed up) | Recording restore: Verified (repo). Picture restore and index rebuild: no code on develop. GAP G-4. Distrust rule recorded here: after any restore, treat the photos folder as untrusted input and run the strip pass again before first display (NX-39-R43) |
| P11 | Share and export: a picture leaves with its metadata, or its temp stays | The parent shares a letter or an export and a located picture goes with it | Export writes to `Caches/exports`, shared with `Sharing.shareAsync` (`export/device.ts:351-352`), cleaned by `cleanupExports` and by Erase everything (`erase-everything.ts` `CACHE_COPIES`; `test/export-device-cleanup.test.ts`, `test/erase-all.test.ts`). Export of pictures (BL-933) and the one-letter share with a picture (NS-05) are not built; the plan is the same strip scan at send time (security.md 3.3, conditions P1 to P4) | Letters-only export: Verified (repo). Picture paths: not built. GAP G-5: a test over the export bytes and the share temp file (equality with `entry_media.sha256`, no metadata segment) lands in the same PR as each path |
| P12 | Deletion: a deleted letter, an Erase everything or an account deletion leaves media behind | A "deleted" picture remains in `photos/`, a temp folder or a backup | Erase everything removes recordings, listening copies, whole-frame copies, exports and `Print` (`erase-everything.ts` header and `eraseDeviceFiles`), then rows; a file that will not go throws so the mark stays. It does not name `Application Support/photos`, `ImagePicker` or `ScribePhoto`: the change is in **Open PR #835 and #836** (both touch `erase-everything.ts`; #839 touches `capture/erase.ts`). Account deletion is server-side only (`apps/mobile/src/lib/account-deletion/index.ts` header: request, purge-worker, analytics-forget) and does not call `eraseDeviceFiles`, so pictures, recordings and exports stay on the phone until the parent also runs Erase everything. Whether that is intended is a question for `privacy` and the founder: GAP G-9. Deletion does not reach a copy already in an iPhone backup or one the parent exported: said plainly in the copy (`strings.en.ts:950`) | Recordings: Verified (repo). Pictures: Open PR. Backup copies: accepted residual, worded. GAP G-1 covers the interrupted-step test |
| P13 | Server holds a picture | A picture is uploaded or `photo_path` is set | The bucket write is denied: `supabase/migrations/20261110000000_photo_bucket_closed.sql`, test `supabase/tests/photo_bucket_closed.test.mjs` (BL-870). The sync payload ban (BL-852) is blocked on BL-846 | Verified (repo) for the bucket. Payload ban: not built |
| P14 | Writing Tools, a third-party keyboard or a share extension reads text on a screen that carries a picture's words | The phone's own services read a letter | No switch in React Native 0.86.3 (`security.md` risk 5); a native setting is proposed there as NSC-05 | GAP G-7 (existing: NS-01-R50 stays open). Not repeated here |
| P15 | Crash report, log or analytics event carries a path, a picture name, a date or a city | A fault record names `Caches/ImagePicker/<name>` or a place | Privacy rule (CLAUDE.md, PRIV-R10): no entry text, transcript, audio or child name in analytics, logs or crash reports. Fault records hold kind, code, id and time only, last 20, and nothing else (`apps/mobile/src/lib/resilience/global-errors.ts:6-7, 26`; test `test/global-errors.test.ts`); analytics gets the code `generic`. The native modules throw named exceptions (`ScribePhotoException`), not paths. The J-N18 canary for a fake city, id and date (NX-39-R30, BL-862) is not on develop | Record shape: Verified (repo, header read; test not run here). Whether any thrown message in a photo path carries a name or uri: UNVERIFIED, device row D-11. Canary: GAP G-10 |

## 4. The scripted snapshot check for App lock (NX-39-R36, a P0 gate)

Rule to prove: with App lock on, when the app goes to the switcher or opens cold, every screen that shows a picture renders blank in the snapshot, and no moment card is built until the lock clears.

Why a script and not a unit test: the snapshot is taken by iOS, not by our code. Apple says the system captures it right after the background handler returns and that animations do not finish first (source 1, written for the app delegate, so the equivalent for scene-based apps is UNVERIFIED). The unit tests prove the cover is drawn on `inactive`; only a device or simulator proves what iOS captured.

Script design (to be built by `qa` with `mobile`; this page does not add it):

1. Fixture: Asha's book with one letter that has a picture whose pixels are a known high-contrast pattern. App lock on, grace "Immediately".
2. Open the letter page, then send the app to the background and capture the switcher card: on a simulator through the OS's screenshot of the app switcher, on a device with the founder's phone and a screen recording. Record which tool was used; a simulator screenshot is not a device proof.
3. Pass: no pixel in the card is within a tolerance of the known pattern, and the card is the cover colour over the picture's frame. Repeat for Home (photo-first capture), the Photos lens, and Review.
4. Repeat with App lock off. Expected today: the letter text is visible in the card (GAP G-2). The picture rows (NS-01-R13a) must still pass because they do not depend on App lock.
5. Cold open under lock: kill the app, open it, take a card before authenticating; pass only if no picture and no text shows.
6. Test titles to cite: `[NX-39-R36] the switcher snapshot is blank on screens that show a photo`. The unit half is NS-01-R13a and R13b, in the test catalogue `docs/engineering/readiness-20nov/quality/TEST-CASE-CATALOGUE-B-photo-with-a-letter.md`.

Gate: P0 for any build with `EXPO_PUBLIC_PHOTOS` on. #838 is the PR that must carry the picture half.

## 5. File class per file, and the background reader

The one decision (NX-39-R43): the class is `CompleteUntilFirstUserAuthentication`, not `complete`. Reason: a task that runs while the phone is locked, after the first unlock since boot, can still read the file. With `complete` it could not. The cost: from the first unlock after a restart until the next restart, a locked phone's files are readable by anything that can reach the file system with the keys in memory, including a forensic tool with the device unlocked once. This is the same exposure as the database and the recordings today (`app.config.ts:93`).

| File or folder | Intended class | Backup | Source |
|---|---|---|---|
| `Application Support/photos/<id>.jpg` | app default (CompleteUntilFirstUserAuthentication) | included, by decision | `files.ts`; UNVERIFIED that the class is kept (D-2) |
| `Caches/ImagePicker`, `Caches/ScribePhoto` | app default | not backed up (Caches) | `files.ts`; Apple (source 2) |
| `Documents/ExpoAudio` recordings | app default | included | `recordings.ts`; Apple (source 2) |
| `Application Support/listening` | app default | excluded | `ScribeAudioModule.swift:90-95` |
| `Caches/exports`, `Caches/Print` | app default | not backed up (Caches) | `export/device.ts:71-72` |
| `Application Support/days` files | app default | excluded | `days/store-file.ts` `setExcluded`; `erase-everything.ts` `eraseDaysFile` |
| `backup-tmp` | app default | excluded | `restore.ts` header; `backup/files.ts:48` |
| escrow keys file | CompleteUntilFirstUserAuthentication, explicit | excluded | `ScribeKeysModule.swift:91-94` |

Background reader: no background mode is allowed (`apps/mobile/scripts/preflight-testflight.mjs:599-600`, LEGAL-REQ-011). So today nothing reads media while the phone is locked, and the choice of class costs nothing in function. It is chosen so a later P2c switch does not force a downgrade. A notification service or a share extension is not in the build.

## 6. What a person is told

The words in `packages/content/src/strings.en.ts` (the "iPhone backup" rows at line 1041 and the Erase and Delete rows at line 950) must stay true to the table in section 5. When a row changes, the words change in the same PR. `privacy` owns the words.

## 7. Device rows, one for each open item

A person with a phone runs each row and writes the result into the PR that closes it. Use the fictional family Asha only (D13). No row needs a real account.

| Row | Open item | What to do | Pass |
|---|---|---|---|
| D-1 | P6, NX-39-R36 | The scripted check in section 4, on an iPhone, with App lock on and off | Card blank for pictures in both; text blank with lock on |
| D-2 | P8, N-B2 | After a stored picture is written and after a `copyItem` clone in the picker, read the file's `NSFileProtectionKey` (a one-line debug build or `xcrun devicectl` file listing; tool UNVERIFIED) | Both report `NSFileProtectionCompleteUntilFirstUserAuthentication` |
| D-3 | P9, NX-39-R43 | Read `isExcludedFromBackup` on `photos/`, `Documents/ExpoAudio`, `listening`, `backup-tmp`. Compare with the Settings words | Each flag matches what the words say |
| D-4 | P2, NX-39-R53 | Pick a located picture, kill the app at each step (pick, copy, re-encode, store), relaunch. List `Caches/ImagePicker` and `Caches/ScribePhoto` | Both empty after the next launch |
| D-5 | P7 | After viewing a picture, list `Library/Caches` and `Library/SplashBoard` for image files and check the switcher | No decoded copy of the picture outside the stored file and the system's own snapshot |
| D-6 | P10, NX-39-R42 | Restore a device backup onto a second phone; open Book and Photos | Index rebuilt, strip pass runs, the picture count matches, no moment card before the lock clears |
| D-7 | P12 | Erase everything, then list `Application Support/photos`, both Caches folders and `Caches/exports` | All empty or absent |
| D-8 | P4 | Pick a 100 megapixel PNG and a 150 MP HEIC while an enhance job runs | Refused or finished; no crash, no jetsam |
| D-9 | P1, NX-39-R6 | Pick a located HEIC and a located JPEG (a real location on a test phone, Asha fixtures only). Read the stored `<id>.jpg` bytes on a Mac with `exiftool` or `mdls` (offline). Then, in a scratch build, remove the two keys at `ScribePhotoModule.swift:225-226` and compare | No GPS, Exif, XMP or embedded thumbnail in either output; identical output with and without the two keys |
| D-10 | P5 | Feed the restore path a truncated and a bit-flipped `SCRB` object, and the transcription path a truncated and a malformed ADTS file, from a scratch Asha book | A named refusal (`bad_magic`, `truncated`, and the like) or a counted failure; no crash, no hang, no partial file left in Documents |
| D-11 | P15 | Force each photo failure (refused type, over 150 MP, cancelled pick, full disk), then read the fault records and the device console | Only kind, code, id and time; no path, name, date or place |
| D-7b | P12 | Delete the account (Asha test account, scratch project), then list `Application Support/photos` and `Documents/ExpoAudio` | Result recorded: files stay or go; the answer decides G-9 |

## 8. Gaps and the rows proposed for `product`

Each gap is a proposal for a backlog row; numbers are for `product` to assign. Size is a guess.

| Gap | Proposed row | Owner | Size | Needs |
|---|---|---|---|---|
| G-1 | Launch sweep wired, and a test that kills every step of an attach and finds no temp file (`[NX-39-R53]`); Erase everything lists `photos`, `ImagePicker`, `ScribePhoto` | mobile | S | #835 merged first (its `capture/sweep.ts` and `erase-everything.ts` changes); #837 for the picker path |
| G-2 | Cover the letter text in the switcher when App lock is off, or state in the copy that it is not covered (a founder decision, not yet made: there is no default until he decides; the row `product` files carries `needs:founder`) | mobile and content | S | founder call |
| G-3 | Set `.protectionKey` explicitly on both picture writes and read it back at launch; fail the check on a downgrade | mobile | S | NSC-01 review |
| G-4 | Backup-flag and class read-back at open, rebuild, replace and restore (NX-39-R43), plus the rebuild-after-restore rule (NX-39-R42) | mobile | M | the index (P2) |
| G-5 | Metadata scan over the export bytes and the share temp file in the same PR as each path (BL-933, NS-05) | mobile and qa | S | those paths |
| G-6 | Fuzz the picture and audio parsers on a Mac with a corpus of malformed files (offline; no live service) | security and qa | M | none |
| G-7 | Native Writing Tools switch on letter fields (existing: NS-01-R50, NSC-05) | mobile | S | NSC-01 |
| G-9 | Decide and document whether account deletion also erases media on the phone (D-7b); if yes, call the device erase from that flow | mobile, privacy | S | founder and privacy call |
| G-10 | Canary run over the photo paths: a fake city, id and date appear in no log, event or crash record (NX-39-R30, BL-862) | qa | S | BL-862 |
| G-8 | Preflight refuses `UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace`, any photo or camera usage string, and app groups (NSC-02; it stands alone, it is the plist half of P8 and P9 and of the Files-app exposure of Documents). Today preflight checks only `UIBackgroundModes` (`preflight-testflight.mjs:599-600`) | ops | S | BL-864 |

## 9. What this page did not check

- Nothing was run on a phone or a simulator. Every "Verified (repo)" is a read of source and tests, not a run of them on this page's branch beyond the repo checks named in the PR.
- The content of #835 to #840 was not read; only the file names each touches were listed through the REST API. Their claims are "Open PR".
- `whisper.rn` and `expo-audio` binaries and plist output are UNVERIFIED (see NATIVE_MODULE_GATE.md).
- The compiled `Info.plist` and entitlements were not generated; `app.config.ts` and the preflight script were read instead.
- Apple behaviour: only the two pages below were read. QA1838 is from 2014 and written for the app delegate, and the File System Basics guide is an archived Apple document, so a claim that rests on either is marked.

## Sources

1. Apple, "Preventing Sensitive Information From Appearing In The Task Switcher" (QA1838): https://developer.apple.com/library/ios/qa/qa1838/_index.html
2. Apple, "File System Basics" (which directories are backed up): https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
