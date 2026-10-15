# Backup restore drill on two iPhones (WP-F08-B6)

Owner: S05 with S19. For the founder and the device operator, who run it. Version 0.1, 15 Oct 2026. An addition to `docs/qa/DEVICE_TEST_PLAN.md` (request to S19 to link it from Part 1 next to DL-03).
Inputs: PRD V2 F08 section 6.5 and F08-REQ-020 to -029, -031, -035; ADR 0023 (proposed); `apps/mobile/src/lib/backup/`; the Node suite `apps/mobile/test/backup-*.test.ts`.
When: round 1 at T25 (5 to 7 Jan 2027) on the first build with the backup client; round 2 at T33 on the candidate build. The alpha (D-106, 29 Oct 2026) may run a short version (B6-01 to B6-04) on staging if the escrow drill key exists.

The Node suite already proves the bytes, the queue's kill path and the restore rules against a fake bucket. This drill proves what only real phones can:

- Keychain sync between two iPhones;
- CryptoKit's AES-GCM and HPKE on the SE 3;
- Supabase Storage's resumable uploads over a real network;
- the system killing the app;
- the 72-hour and 24-hour holds and their emails.

Labels: **V** verified on a vendor page, **A** assumption the drill confirms, **F** fact in the repo.

## Before the drill

| ID | Check | Done when |
|---|---|---|
| B6-P1 | Two iPhones signed in to **one Apple Account**: phone A (SE 3), phone B (current iPhone). iCloud Keychain on for round A, off for round B (Settings > your name > iCloud > Passwords and Keychain) | Both phones listed under the Apple Account's devices |
| B6-P2 | A preview build with `EXPO_PUBLIC_SERVER_FEATURES=on`, `EXPO_PUBLIC_BACKUP=on`, the staging Supabase settings, `EXPO_PUBLIC_ESCROW_URL` (staging escrow project) and `EXPO_PUBLIC_ESCROW_KEY` (the **drill-only** key from the WP-F08-B8 ceremony, never the production key) | Settings shows "Back up my recordings" |
| B6-P3 | Staging has the S05 server migration (bucket `entry-audio`, `audio_blobs`, `child_keys`, `backup_devices`, `restore_requests`, `escrow_unwraps`, the RPCs) and the escrow function deployed to the staging escrow project | `npm run test:db` green against staging |
| B6-P4 | A test account for the fictional family: book "Asha", signed in as Mama. Never a real family's name, letter or voice in the drill or its evidence (CLAUDE.md) | Account exists; mailbox reachable for the emails |
| B6-P5 | 20 test recordings read from the TDD 03 corpus scripts: 10 of 30 s, 6 of 2 min, 3 of 5 min, 1 of 15 min. The SHA-256 of each is listed by Settings > Recordings (or Export's manifest) before the drill | The hashes are written into the evidence file |

## Round A: iCloud Keychain on

### B6-01 Turn on and back up 20 recordings on phone A
- **Steps:** Phone A, Wi-Fi. Record the 20 letters and keep each. Settings > Back up my recordings: read the sheet, tap "Back up my recordings". Leave the app in the foreground until the state reads "Backed up {date}". Time it.
- **Expected:** The sheet shows the four claims and nothing more: encrypted on this phone; a recovery key; our recovery service logs every use and emails you; never listened to, sold or used to train models. The state line never shows a count. 20 rows in staging `audio_blobs` with `state = confirmed`; one `child_keys` row for (Asha, Mama). F08 section 9: about 480 recordings in 30 minutes [A], so 20 should take under 2 minutes.
- **Record:** B6-01 row: build, minutes to "Backed up", row counts.

### B6-02 No plaintext leaves the phone (F08-REQ-018, F08-REQ-020)
- **Steps:** During B6-01, route phone A through a proxy on the Mac (Proxyman or Charles, with its certificate trusted on the test phone only). Save the session. Search every request body for `ftyp`, for the hex SHA-256 of three of the recordings, and for a 64-byte run copied from one recording.
- **Expected:** Zero matches. Upload bodies go only to `/storage/v1/upload/resumable` and to `entry-audio`.
- **Record:** B6-02 row: the search terms and zero counts. The capture file stays on the Mac, never in git.

### B6-03 Kill and airplane during an upload (F08-U17)
- **Steps:** Record the 15-minute letter again as a new letter. When the state reads "Backing up", swipe the app away. Reopen. Then turn on airplane mode mid-upload for 30 s and off again. Then start a recording while it uploads.
- **Expected:** After each, the upload continues from where it was. It does not start again: the proxy shows a `HEAD` and then only the missing parts. Nothing uploads while the recording runs, and it carries on after Review closes. Exactly one confirmed row for that letter; no file left in `Application Support/backup-tmp` (Xcode > Devices > the app's container) once it is backed up.
- **Record:** B6-03 row.

### B6-04 Restore on phone B with iCloud Keychain on (F08-REQ-023)
- **Steps:** Phone B: delete the app if present, install the build, sign in as Mama. Wait on Wi-Fi in the foreground. Open Settings > Recordings and play five letters.
- **Expected:** Text arrives at once. All 21 recordings play within 10 minutes. Each one's SHA-256 (Export manifest on phone B) equals phone A's. `escrow_unwraps` has **no** new row and no "key opened" email arrives: iCloud Keychain brought the key.
- **Record:** B6-04 row: minutes, 21 of 21 hashes equal (yes or no, with the ids that differ).

### B6-05 Never overwrite a file on the phone
- **Steps:** On phone B, record one new letter. Then on phone A, record another and wait for both to back up. Reopen phone B.
- **Expected:** Phone B's own recording is untouched (hash unchanged). Phone A's new letter's recording arrives.
- **Record:** B6-05 row.

## Round B: iCloud Keychain off, escrow

### B6-06 New phone without iCloud Keychain (F08-U18, F08-REQ-028, F08-REQ-029)
- **Steps:** Turn iCloud Keychain off on phone B (or use a third phone on another Apple Account signed in to the same app account). Delete and reinstall the app; sign in as Mama within 10 minutes of the request. Watch Settings > Back up my recordings.
- **Expected:** For about 2 minutes: "Bringing your recordings to this phone." No new key is made: staging `child_keys` still has one row for (Asha, Mama). Then: "Your recordings will start coming back by {date}..." with a time 72 hours away, since phone A is enrolled. An email "A new iPhone asked for your recordings" arrives with the Stop link. Phone A gets a time-sensitive push with no ids, and on its next open the approval sheet.
- **Record:** B6-06 row: hold time shown, email received (yes or no), push received (yes or no).

### B6-07 Approve on phone A
- **Needs:** the approval sheet on the enrolled phone. It is not in the first client PR: the S05 server draft seals an approval code to each enrolled device and takes it back through `backup_approve_request`. Until the sheet lands, run B6-07 as "wait out the hold" (B6-09's steps, 72 hours) and record the approval row as not run.
- **Steps:** On phone A, open the app and tap "Yes, it's mine".
- **Expected:** Phone B's recordings start arriving on its next open. One `escrow_unwraps` row (reason `restore`) and one "key opened" email. All recordings play with equal hashes.
- **Record:** B6-07 row.

### B6-08 Stop, and the scanner-safe link (F08-U27, F08-U27b)
- **Steps:** Repeat B6-06 with a fresh install. Before approving, open the email's Stop link in a browser and wait 30 s without pressing anything. Then press "Stop this and sign out everywhere".
- **Expected:** Loading the page changes nothing (the request stays `requested`). The button cancels it (`cancel_source = stop_link`) and signs out every session. Phone B shows "Bringing your recordings to this phone was stopped." and never asks again on its own; "Try again" after signing in again asks once more.
- **Record:** B6-08 row.

### B6-09 Only phone lost: the 24-hour hold
- **Steps:** Revoke phone A's device in staging (or wait the 90-day rule out by editing `backup_devices.enrolled_at` in staging only). Repeat B6-06 on phone B.
- **Expected:** The hold shown is 24 hours; after it, the recordings arrive without approval; one row and one email per opened key.
- **Record:** B6-09 row.

## Not in this client yet (rows for round 2)

These need WP-F08-B3p (purge by exact object path, S07 and S02), WP-F08-B5d (turn off with delete, only-in-backup count) and WP-F16-08 (server restore drill). Run them when those merge:

- B6-10 Erase now and the 30-day purge reach the bucket (F08-REQ-024).
- B6-11 Turn off with delete: the only-in-backup count and "Bring them to this phone" (F08-REQ-035).
- B6-12 One escrow restore after a staging database restore; the client re-uploads what the server lost (F08-REQ-031, F08-U30).

## Pass

Round 1 passes when B6-01 to B6-09 pass on the SE 3 and the current iPhone: 20 of 20 restored with equal hashes, with iCloud Keychain on and off (WP-F08-B6 "Done when"). Any recording lost or altered is S0 and stops the drill (`DEVICE_TEST_PLAN.md` failures).

## Facts and assumptions this drill rests on

| Item | Label | Checked by |
|---|---|---|
| A synchronizable Keychain item from an Expo local module syncs within 2 minutes on one Apple Account | A (F08 A2) | B6-04 |
| CryptoKit HPKE (X25519, HKDF-SHA256, AES-256-GCM) exists on iOS 17 | A (F08 A5) | B6-01 (backup turns on) |
| The Node HPKE in the tests matches RFC 9180's test vector A.1.1 | F | `test/backup-keys.test.ts` |
| Supabase Storage's resumable endpoint accepts 6 MiB parts from React Native and answers `HEAD` with the offset | A (F08 A3) | B6-03 |
| The app never uploads in the background | F (`lib/backup/runtime.ts` foreground gate) | B6-03 |
