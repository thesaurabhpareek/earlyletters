# Backup restore drill on two iPhones (WP-F08-B6)

Owner: S05 with S19. For the founder and the device operator, who run it. Version 0.3, 16 Oct 2026. An addition to `docs/qa/DEVICE_TEST_PLAN.md` (request to S19 to link it from Part 1 next to DL-03).
Inputs: PRD V2 F08 section 6.5 and F08-REQ-020 to -029, -031, -035; ADR 0024 (proposed); `apps/mobile/src/lib/backup/`; the Node suite `apps/mobile/test/backup-*.test.ts`.
When: round 1 at T25 (5 to 7 Jan 2027) on the first build with the backup client; round 2 at T33 on the candidate build. The alpha (D-106, 29 Oct 2026) may run a short version (B6-01 to B6-04) on staging once B6-P0 is done.
Evidence: one file per device session, `docs/qa/evidence/<date>-<build>-<device>.md` (template in `docs/qa/evidence/README.md`, `DEVICE_TEST_PLAN.md` "How to use this plan"). One row per item ID below.

The Node suite already proves the bytes, the queue's kill path and the restore rules against a fake bucket. This drill proves what only real phones can:

- the `scribe-keys` Swift module compiling and running at all;
- Keychain sync between two iPhones;
- CryptoKit's AES-GCM and HPKE on the SE 3;
- Supabase Storage's resumable uploads over a real network;
- the system killing the app;
- the 72-hour and 24-hour holds and their emails.

Labels: **V** verified on a vendor page, **A** assumption the drill confirms, **F** fact in the repo.

## Before the drill

| ID | Check | Done when |
|---|---|---|
| B6-P0 | **The native module builds.** `modules/scribe-keys` has never been compiled, so it is excluded from autolinking (`apps/mobile/package.json` `expo.autolinking.exclude`). On a Mac, on a branch: remove that one line (and its test in `test/backup-gate.test.ts`), `npx expo prebuild --platform ios`, `pod install` in `ios/`, then build for an iOS 17 device. Fix any compile error in that branch's PR | The build installs, and `npx expo-modules-autolinking resolve --platform apple` lists `scribe-keys` |
| B6-P1 | Two iPhones signed in to **one Apple Account**: phone A (SE 3), phone B (current iPhone). iCloud Keychain on for round A (Settings > your name > iCloud > Passwords and Keychain). A third phone on **another Apple Account** for round B is the cleanest choice (B6-06) | Both phones listed under the Apple Account's devices |
| B6-P2 | A **development-profile** build from the B6-P0 branch on each phone (`eas build --profile development`, or Xcode), running the drill settings from the Mac's dev server: see "Running the drill build" below. Only a development-profile build trusts the drill key: a preview or TestFlight build ignores it, and backup then reads "not ready on this phone yet" | On each phone, Settings shows "Back up my recordings" |
| B6-P3 | Staging has the S05 server migration and the escrow function. In the staging SQL editor, paste: `select id, public, file_size_limit from storage.buckets where id = 'entry-audio';` (one row, `false`, `20971520`); `select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('audio_blobs','child_keys','backup_devices','restore_requests','escrow_unwraps');` (5); `select count(*) from pg_proc where proname in ('backup_register_device','backup_store_key','backup_begin','backup_confirm');` (4); `show app.escrow_key_versions;` (lists the drill key's version) | All four answers as shown |
| B6-P4 | A test account for the fictional family: book "Asha", signed in as Mama. Never a real family's name, letter or voice in the drill or its evidence (CLAUDE.md) | Account exists; mailbox reachable for the emails |
| B6-P5 | 20 test recordings read from the TDD 03 corpus scripts: 10 of 30 s, 6 of 2 min, 3 of 5 min, 1 of 15 min. Their SHA-256: on phone A, Settings > Export, AirDrop the file to the Mac, unzip it and read each letter's `audio.sha256` in `data/entries.json` | The hashes are written into the evidence file |

### Running the drill build

The development profile is a development client (`developmentClient: true` in `apps/mobile/eas.json`). The app on the phone is only the native shell; its JavaScript, and every `EXPO_PUBLIC_*` value in it, comes from the dev server on the Mac each time the app opens. The profile's own `EXPO_PUBLIC_SERVER_FEATURES=off` in `eas.json` therefore does not apply, and the values below must be on the Mac.

1. On the Mac, in `apps/mobile`, create `.env.local` (git ignores it; it wins over the committed `.env.development`) with exactly these seven lines, filled in:
   ```
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_SERVER_FEATURES=on
   EXPO_PUBLIC_BACKUP=on
   EXPO_PUBLIC_SUPABASE_URL=<staging project URL>
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>
   EXPO_PUBLIC_ESCROW_URL=<staging escrow project URL>
   EXPO_PUBLIC_ESCROW_KEYS='[{"version": <n>, "publicKey": "<base64 of the drill public key>", "environment": "drill", "current": true}]'
   ```
   (`EXPO_PUBLIC_SUPABASE_ANON_KEY` also works in place of the publishable key.) The escrow key is the **drill-only** public key from the WP-F08-B8 ceremony, never the production key: the JSON line keygen prints for it, in single quotes. Delete `.env.local` after the drill.
2. Start the dev server: `cd apps/mobile && npx expo start --dev-client --clear`. `--clear` drops Metro's cache, so the values in step 1 are inlined, not old ones. (Not `npm run mobile -- ...` from the root: npm does not pass those flags through to Expo.)
3. Put the Mac and every drill phone on the **same Wi-Fi network**, and keep the Mac awake (System Settings > Battery or Energy: prevent sleep while the display is off) and the dev server running for the whole drill.
4. Open the app on each phone and pick the Mac's server in the development menu (or scan the QR code the dev server prints). Check Settings shows "Back up my recordings".
5. **Every reopen needs the Mac.** After a swipe away (B6-03), a reinstall (B6-04, B6-06) or an erase, the app loads its JavaScript from the Mac again. If it shows the development launcher instead of the app, the Mac was not reachable: that is not a backup result. Reconnect the phone to the Mac's Wi-Fi, reopen, and carry on.
6. In B6-03, airplane mode and "Wi-Fi off" cut the phone off from the Mac too. The running app keeps working (its code is already loaded), so do not reopen it until it is back on the Mac's Wi-Fi.

Staging queries for the steps below (run as the dashboard's SQL editor; Mama's id from `select id from auth.users where email = '<the test address>';`):

- Recordings backed up: `select count(*) from audio_blobs where author_id = '<mama>' and state = 'confirmed';`
- Book keys: `select child_id, key_version, escrow_key_version from child_keys where profile_id = '<mama>';`
- Devices: `select device_id, enrolled_at, last_seen_at, revoked_at from backup_devices where profile_id = '<mama>' order by enrolled_at;`
- Requests: `select id, device_id, state, hold_until, cancel_source from restore_requests where profile_id = '<mama>' order by requested_at;`
- Keys opened: `select count(*), max(occurred_at) from escrow_unwraps where profile_id = '<mama>';`

## Round A: iCloud Keychain on

### B6-01 Turn on and back up 20 recordings on phone A
- **Steps:** Phone A, Wi-Fi. Record the 20 letters and keep each. Settings > Back up my recordings: read the sheet, tap "Back up my recordings". Leave the app in the foreground until the state reads "Backed up {date}". Time it.
- **Expected:** The sheet says these things and nothing more: the recordings are encrypted on this phone before they leave it; we keep a recovery key; we use it only through our recovery service, which logs every use and emails you; we never listen to, sell or train models on them (`sheetBody`); and other family members can't hear them yet (`sheetNotIncluded`). The state line never shows a count, and reads "Backed up" only once all 20 are. 20 confirmed recordings and one book key row (queries above). F08 section 9: about 480 recordings in 30 minutes [A], so 20 should take under 2 minutes.
- **Record:** B6-01 row: build, minutes to "Backed up", row counts.

### B6-02 No plaintext leaves the phone (F08-REQ-018, F08-REQ-020)
- **Steps:** During B6-01, route phone A through a proxy on the Mac (Proxyman or Charles, with its certificate trusted on the test phone only). Save the session. Search every request body for `ftyp`, for the hex SHA-256 of three of the recordings, and for a 64-byte run copied from one recording.
- **Expected:** Zero matches. Upload bodies go only to `/storage/v1/upload/resumable` and to `entry-audio`.
- **Record:** B6-02 row: the search terms and zero counts. The capture file stays on the Mac, never in git.

### B6-03 Kill, airplane and leaving Wi-Fi during an upload (F08-U17)
- **Steps:** Record the 15-minute letter again as a new letter. When the state reads "Backing up", swipe the app away. Reopen. Then turn on airplane mode mid-upload for 30 s and off again. Then, with Use cellular data off, turn Wi-Fi off mid-upload (mobile data on) for a minute, then on again. Then start a recording while it uploads.
- **Expected:** After each, the upload continues from where it was. It does not start again: the proxy shows a `HEAD` and then only the missing parts. With Wi-Fi off, at most one more part goes and the state reads "Backs up on Wi-Fi". Nothing uploads while the recording runs, and it carries on after Review closes. Exactly one confirmed row for that letter; no file left in `Application Support/backup-tmp` (Xcode > Devices > the app's container) once it is backed up.
- **Note:** iOS reports a Personal Hotspot as Wi-Fi, so on a hotspot backup uploads as on Wi-Fi [A]. Record which network was used.
- **Record:** B6-03 row.

### B6-04 Restore on phone B with iCloud Keychain on (F08-REQ-023)
- **Steps:** Phone B: delete the app if present, install the build, sign in as Mama. Wait on Wi-Fi in the foreground. Open Settings > Back up my recordings, then play five letters.
- **Expected:** Text arrives at once. While recordings download, the screen reads "Bringing your recordings to this phone." and letters start to play one by one (with iCloud Keychain on, the 2-minute wait in B6-06 does not happen). Backup is Off on this phone, and the sheet starts "Your backed-up recordings come back to this phone on their own." All 21 recordings play within 10 minutes. Each one's SHA-256 (phone B's Export, as B6-P5) equals phone A's. No new `escrow_unwraps` row and no "key opened" email: iCloud Keychain brought the key.
- **Record:** B6-04 row: minutes, 21 of 21 hashes equal (yes or no, with the ids that differ), what the screen said.

### B6-05 Never overwrite a file on the phone
- **Steps:** On phone B, turn backup on and record one new letter. Then on phone A, record another and wait for both to back up. Reopen phone B.
- **Expected:** Phone B's own recording is untouched (hash unchanged). Phone A's new letter's recording arrives.
- **Record:** B6-05 row.

## Round B: iCloud Keychain off, escrow

iOS keeps Keychain items when an app is deleted, and phone B already holds Mama's key from round A. So "delete and reinstall" does **not** reset phone B. Use one of:

- **A third phone on another Apple Account** (recommended), signed in to the same app account (Mama). It has never had the key.
- **Or erase phone B:** Settings > General > Transfer or Reset iPhone > Erase All Content and Settings, then set it up with iCloud Keychain **off**. When iOS asks what to do with iCloud Keychain data while turning it off, choose **Delete from My iPhone** (never "Keep on My iPhone").

### B6-06 New phone without iCloud Keychain (F08-U18, F08-REQ-028, F08-REQ-029)
- **Steps:** On the round B phone (see above), install the build and sign in as Mama. Watch Settings > Back up my recordings.
- **Check first:** "Bringing your recordings to this phone." shows both while the phone waits for iCloud Keychain and while recordings download, so the line alone does not say which. What tells them apart:
  - **Waiting for iCloud Keychain** (expected here): no letter plays its recording yet (open two or three: they have no recording on this phone), the proxy shows no download from `entry-audio`, and **after about 2 minutes the line changes** to "Your recordings will start coming back by {date}. We emailed you to check it's you."
  - **Downloading**: letters start to play one by one within the first 2 minutes, and the proxy shows downloads from `entry-audio`. Here that means the phone still holds the key: erase it as above and start B6-06 again.
- **Expected:** No new key is made: still one book key row (queries above). After about 2 minutes: "Your recordings will start coming back by {date}. We emailed you to check it's you." with a time 72 hours away, since phone A is enrolled. An email "A new iPhone asked for your recordings" arrives with the Stop link. (The push to phone A is in the F08 design but not in this build: neither #151 nor this client sends one.)
- **Record:** B6-06 row: hold time shown, email received (yes or no).

### B6-07 Approve on phone A (not in this build)
- **Needs:** the approval sheet on the enrolled phone. It is not in the first client PR: the S05 server (#151) seals an approval code to each enrolled device, and only a device enrolled 7 days before the request may approve (D-108). Until the sheet lands, record B6-07 as **not run**. That does not block round 1: B6-09 and the end of B6-06's hold cover the release.
- **Steps (when the sheet exists):** On phone A, enrolled at least 7 days earlier, open the app and tap "Yes, it's mine".
- **Expected:** The round B phone's recordings start arriving on its next open. One new `escrow_unwraps` row (reason `restore`) and one "key opened" email. All recordings play with equal hashes.
- **Record:** B6-07 row.

### B6-08 Stop, and the scanner-safe link (F08-U27, F08-U27b)
- **Steps:** Erase the round B phone again (as above) and repeat B6-06. Before the hold ends, open the email's Stop link in a browser and wait 30 s without pressing anything. Then press "Stop this and sign out everywhere".
- **Expected:** Loading the page changes nothing (the request stays `requested`, queries above). The button cancels it (`cancel_source = stop_link`) and signs out every session. The phone shows "Bringing your recordings to this phone was stopped." and never asks again on its own; after signing in again, "Try again" asks once more (one new request row).
- **Record:** B6-08 row.

### B6-09 Only phone lost: the 24-hour hold
- **Steps:** In staging only, revoke phone A's device with a date more than 7 days back (a device revoked in the last 7 days still counts for the 72-hour hold, #151 `escrow_long_hold`): `update backup_devices set revoked_at = now() - interval '8 days', revoked_reason = 'owner' where device_id = '<phone A device id>';` (from the devices query). Erase the round B phone (as above) and repeat B6-06.
- **Expected:** The hold shown is 24 hours; after it, the recordings arrive without approval; one `escrow_unwraps` row and one email per opened key.
- **Record:** B6-09 row.

## Not in this client yet (rows for round 2)

These need WP-F08-B3p (purge by exact object path, S07 and S02), WP-F08-B5d (turn off with delete, only-in-backup count) and WP-F16-08 (server restore drill). Run them when those merge:

- B6-10 Erase now and the 30-day purge reach the bucket (F08-REQ-024).
- B6-11 Turn off with delete: the only-in-backup count and "Bring them to this phone" (F08-REQ-035).
- B6-12 One escrow restore after a staging database restore; the client re-uploads what the server lost (F08-REQ-031, F08-U30).

## Pass

Round 1 passes when B6-P0 and B6-01 to B6-09 pass on the SE 3 and the current iPhone, with B6-07 allowed as "not run" until the approval sheet exists: 20 of 20 restored with equal hashes, with iCloud Keychain on and off (WP-F08-B6 "Done when"). Any recording lost or altered is S0 and stops the drill (`DEVICE_TEST_PLAN.md` failures).

## Facts and assumptions this drill rests on

| Item | Label | Checked by |
|---|---|---|
| The `scribe-keys` module compiles against ExpoModulesCore 57 and runs on iOS 17 | A (read against the sources, never built) | B6-P0 |
| A synchronizable Keychain item from an Expo local module syncs within 2 minutes on one Apple Account | A (F08 A2) | B6-04 |
| CryptoKit HPKE (X25519, HKDF-SHA256, AES-256-GCM) exists on iOS 17 | A (F08 A5) | B6-01 (backup turns on) |
| The Node HPKE in the tests matches RFC 9180's test vector A.1.1 | F | `test/backup-keys.test.ts` |
| Supabase Storage's resumable endpoint accepts 6 MiB parts from React Native and answers `HEAD` with the offset | A (F08 A3) | B6-03 |
| The app never uploads in the background, and stops at the next part when Wi-Fi goes with Use cellular data off | F (`lib/backup/queue.ts`, `test/backup-queue.test.ts`) | B6-03 |
| Keychain items survive deleting the app; turning iCloud Keychain off can keep them on the phone | A (observed iOS behaviour, not a documented promise) | Round B, B6-06 check |
