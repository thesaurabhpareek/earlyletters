# F08 Recordings: original, listening copy, playback, encrypted backup

| | |
|---|---|
| Release | v1.0 gate. Encrypted backup of the owner's own recordings is v1.0 by D-073; family members hearing each other's recordings is v1.1 (F31) |
| Priority and rank | P0, rank 4 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P4 Multilingual family, P6 Future reader |
| Existing IDs | C-REQ-017, C-REQ-018, PRD-REQ-020 (playback always free), LEGAL-REQ-014, LEGAL-REQ-022, LEGAL-REQ-023, LEGAL-REQ-050, DATA-REQ-010, DATA-REQ-011, DATA-REQ-046, DATA-REQ-048, DATA-REQ-050, DATA-REQ-051, DATA-REQ-055, D-032 (superseded), D-033, D-058, D-059, D-073, D-085, DR-07, DR-09, R-10, R-11, BL-134, BL-140, BL-150, BL-205, BL-232, BL-245, BL-284, BL-306 |
| Depends on | F02 (sign-in, for backup), F04 (capture writes the original), F05 (transcription reads the original; the queue makes listening copies), F09 (letter view, Recently deleted), F14 (Plus copy, if backup is ever gated), F15 (export), F16 (sync engine and the server switch), F17 (Settings > Recordings, Storage and backup rows), F19 (remote config) |
| Status | Draft V2, 3 Oct 2026. Rewritten 13 Oct 2026 for D-073 (backup in v1.0), D-085 and the code on `develop`; revised 13 Oct for M14; revised again 13 Oct after critique round 1 for M16 (recoverable keys, honest copy) and R2 AR-05 to AR-11, AR-24, AR-32 to AR-35, R4 PT-01, PT-02, PT-19, PT-22, PT-24: section 6.5 is a new key model |

## 1. Why

- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64), and QR codes to audio in printed books are the category's most emotional praise (R2 section 0 item 5; CR section 4).
- [F] Keeping and playing the original is table stakes among voice products: Remento keeps recordings downloadable at any time, and Day One keeps audio playable on every tier after a subscription ends (R1-S13, R1-S60).
- [F] Apple Voice Memos offers one-tap Enhance to reduce background noise (R1-S64). Nobody we found keeps a cleaned copy beside an untouched original (R1 F08 opportunity).
- [D] The original recording is never altered; a clearer listening copy is allowed; the person can always hear the original (D-058, B6).
- [D] **Encrypted backup of the owner's recordings ships in v1.0; family members hearing each other's recordings stays v1.1** (D-073, founder, evening of 3 Oct 2026, superseding D-032 and the "no audio upload in v1.0" part of D-059; `_AUTHORING.md` M7). Copy must not promise family listening in v1.0 (D-073 consequences).
- [D] **Server features are on for v1.0** (M14, founder, 13 Oct 2026), reversing commit c1764f9 ("v1.0 on-device only"). Sign-in, sync and the production database ship with backup, so section 13 Q1 is answered: D-073 stands. The full scope stays and the date moves (M15).
- [D] **Backup keys are recoverable, and the copy says so** (M16, founder, 13 Oct 2026). We keep server escrow. Copy says recordings are encrypted, that we hold a recovery key under strict, logged access, and that recordings are never read, sold or used to train models. No "only your family's keys" or "only you can play them" claim anywhere.
- [F] ADR 0006 (Accepted, 1 Oct) keys backup by child with one family key shared through grants. v1.0 has no grants and two parents per book (D-069), so a single per-child key breaks: the second parent cannot unwrap the first parent's key, and creating their own collides with it in the Keychain and in escrow (R2 AR-05). Section 6.5 replaces it with one key per (child, author) and needs an ADR 0006 amendment before WP-F08-B2 starts.
- [F] The code and other plans on `develop` still say the opposite on 13 Oct, and must follow M14: every `eas.json` profile still sets `EXPO_PUBLIC_SERVER_FEATURES=off` (`apps/mobile/src/lib/capabilities.ts`, commit c1764f9); ROADMAP 2.1 section 7 lists "backup and restore" under "Not in v1.0"; `packages/content` comments say "D-085 amends D-073", and every recording string claims no backup (`strings.en.ts` lines 15 and 642, `site.en.ts`, `store.en.ts`, `features/billing.en.ts`). D-085 is logged on `origin/develop` (commit feaffb3, not yet on this branch) with an "Amends D-073 for v1.0" clause that rests on v1.0 having no server; M14 removes that premise. These are listed in `reviews/STALE-OUTSIDE-PRD.md`.
- [F] No backup code exists: no upload of audio, no encryption library, no synchronizable Keychain module, no `entry-audio` bucket or `audio_blobs` table in any migration. The purge worker already lists `entry-audio` with the path `{child}/{author}/{entry}.m4a.enc`, marked `since: 'v1.1'` (`supabase/functions/purge-worker/lib/buckets.ts`).
- [F] What is built (13 Oct): originals at 48 kHz in Documents, kept in the person's own iPhone backup (`lib/capture/recorder.ts`); listening copies from Apple's AUSoundIsolation in Application Support, excluded from backup and never exported (`lib/audio-enhance`, ADR 0015 section 5); the letter view player with an "Original recording" switch (`components/player/audio-player.tsx`, `lib/player/`); delete with confirm, a 30-day Recently deleted shelf, Erase now and a launch purge that removes the recording and its listening copy before the row (`lib/capture/erase.ts`, `app/settings/recently-deleted.tsx`, D-085); a playability probe for takes cut off by a kill (`lib/capture/probe.ts`); and "Last export" in Settings > Export.

## 2. Who

| Persona | Moment | What F08 must do |
|---|---|---|
| P1 Evening parent | Listens back in Review at night, later replays old letters; one day changes or loses a phone | Play in one tap, quietly, with the original always one tap away. Never lose the file. After a new phone, sign in and get every recording back (backup) |
| P2 Co-parent | Opens a letter the other parent spoke (v1.0 per M14) | Read it, and see plainly that the voice is on the other parent's phone. No dead play button. No promise that it will arrive (family listening is v1.1) |
| P4 Multilingual family | The recording is the safety net when transcription is weak (DR-01) | Audio kept in full whatever the transcript quality; playback needs no language support |
| P6 Future reader | Years later, from an export, with no app | Byte-identical original M4A that plays in any browser (DATA-REQ-055) |

## 3. What we are solving

**Outcome.** Every recording stays exactly as it was captured, plays in one tap on the author's phone with no gate, also after a lapse (M1), survives a lost or replaced phone through an encrypted backup that we can recover under strict, logged access (M16), and the family is told honestly where it lives and who could open it.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Originals altered | Zero (gate) | SHA-256 at capture equals SHA-256 after listening copy, playback, export, backup upload and restore (WP-F08-07, WP-F08-B6) | Lab |
| Recordings lost on this phone | Zero (gate) | Kill runs (F04; DEVICE_TEST_PLAN DL-01, DL-02), durability drill DL-03 and BL-284, support tickets | Lab and support |
| Recordings restored on a new phone, backup on | 100% of backed-up recordings, hashes equal (gate for backup) | Restore drill on two phones (WP-F08-B6) | Lab |
| Local playback start | p95 300 ms tap to first audio on SE 3 [R] (TDD 06 section 2.2) | Perf build marker | Lab |
| Playback failures | Under 0.5% of play taps on local files | `playback_failed` over `playback_started` | Opt-in only |
| Backup coverage | Watched: share of owners' recordings with `backed_up` state 24 h after save | `backup_status` (new, counts only) | Opt-in only |

## 4. Scope

**In v1.0**
- The original: AAC-LC, mono, 64 kbps, 48 kHz, M4A (ADR 0005, ADR 0015 section 5), stored once, never re-encoded or edited. Built.
- The listening copy: AUSoundIsolation on a copy, 80% wet, after a recording's words are done, only while the app is open and the queue is idle (ADR 0015 section 5). Built. This replaces the RNNoise plan of DR-09 (section 13 Q3).
- Playback of a single letter in Review, the letter view and Read together: play, pause, scrub, Original recording switch. Always free. Built except speed control.
- Where files live, and honest durability copy (D-033). Built for the no-backup state.
- Delete, Recently deleted for 30 days, Erase now, launch purge, playable check, "Last export" (D-085). Built.
- **Encrypted backup of the owner's own recordings (D-073, M16)**: section 6.5. Not built. Off until the owner turns it on, with its own consent act (6.5 A). Free or Plus is founder Q2; spec default [R] free.
- **Restore on a new phone**: sign in, text syncs (F16), recordings download and decrypt. Not built.
- Keep-safe nudge (C-REQ-018) pointing to export and device backup while backup is off. Not built.

**Later**
| Item | Release | Why later |
|---|---|---|
| Family members hear each other's recordings (shared voice, F31): each author's book key for that child sealed to the other member's device key (`child_key_grants`) | v1.1 | D-073, D-059 |
| Vault mode (no escrow; Recovery Kit only) | Later (FUTURE T5-06) | ADR 0006 option; adds a printable kit and a confirm flow. M16 keeps escrow for v1.0 |
| Backup of listening copies | Never needed | They are made again from the original |
| Lossless or Opus archival export | v1.x | ADR 0005 consequences |
| QR codes to audio in a printed book | Later (F42) | Print is later |
| Speed control | v1.0.x | Not built; COMPONENTS 2.21 lists it |
| Now Playing and lock-screen controls | Later | COMPONENTS 2.21 marks them deferred |

**Never**
- Any change to the original's bytes: trimming, gain, denoise, re-encode, metadata rewrite (D-058).
- Voice processing at capture (ADR 0015 section 5: it would change the original).
- Replacing the original with the listening copy, anywhere, including export and backup.
- A server path that can open a recording without a logged, rate-limited escrow unwrap (LEGAL-REQ-023; TDD 04 3.6). The escrow master key is referenced by no function other than `escrow` (release check, F08-REQ-034).
- Speaker identification or voiceprints from recordings (LEGAL-REQ-019); using recordings to imitate a voice or train models (D-061).
- Audio in analytics, logs, crash reports or URLs (LEGAL-REQ-014).
- Copy that promises family members can hear recordings before v1.1 (D-073).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Recordings kept and downloadable at any time; QR codes in printed stories play the original [F] R1-S13 | Trustpilot 4.8 (1,738), web link, not an app [F] R1-S15 | Voice is the emotional core [S] R2 section 0 item 5 | **Match** original always available |
| Day One | Playback on every tier, including after a subscription ends; recording needs a paid tier [F] R1-S60 | 4.8 (118K) [F] R1-S6 | n/a | **Match** playback never gated, also after a lapse; capture never gated either (M1) |
| Apple Voice Memos | One-tap Enhance reduces noise and echo [F] R1-S64 | 4.8 (1.1M) [F] R1-S64 | n/a | **Innovate**: the clearer version is a separate copy; the original stays |
| Dearest | Voice memories; full ZIP export [F] R1-S3 | 5.0 (1) | n/a | **Match** ZIP with audio (F15) |
| Tiny Treasures | Exports audio files for offline keeping [F] R1-S67 | 5.0 (7) | n/a | **Match** |
| FirstChapter | Privacy label lists audio as data linked to the user, so audio leaves the phone [F] R1-S4 | n/a | n/a | Same category for us once backup ships: our label declares Audio Data too (F08-REQ-036). Our difference is ciphertext on the server and a logged, rate-limited recovery path |
| Storyworth | Voice-recorded calls on higher tiers [F] R1-S14 | 4.7 Trustpilot [F] R1-S54 | n/a | Whether audio is kept for playback: Unverified |

Durability was our weak point: Day One, Voice Memos and the iCloud apps back up audio (R1 F08). D-073 closes it for the owner's own recordings; until it ships, copy points to export and the iPhone's own backup.

## 6. Experience

### 6.1 Entry points

| Entry | Where | What plays or happens | Built |
|---|---|---|---|
| Hear it | Review, before save | The original | Yes |
| Hear {signsAs} (`book.hearShort`, `book.hearLink`) | Letter view, own letter or one recorded on this phone | Listening copy when one matches the original's hash, else the original (`listeningCopyFor`) | Yes (`components/player/audio-player.tsx`) |
| Read together | F10 | Same version rule | Yes |
| Settings > Recordings | F17 shell, this spec's rows | Where recordings live, takes without a letter, takes that may not play, the Word for word setting | Yes (`app/settings/recordings.tsx`) |
| Settings > Recently deleted | F17 shell, D-085 | Restore, Erase now | Yes (`app/settings/recently-deleted.tsx`) |
| Settings > Storage and backup | F17 shell | Packs (`storage.tsx`, S08) and Back up my recordings (`backup.tsx`, new, S05): on or off, last backed up (section 6.5) | Packs built; backup screen not built |
| New phone, signed in | F02, F16 | Restore of recordings (section 6.5 B) | No |
| Approval on an enrolled phone | In-app sheet the next time the old phone opens | Approve a new device's restore (6.5 C) | No |

### 6.2 Happy paths: playback and listening copy (built)

**A. Play a letter.**
1. Person opens a spoken letter. The player shows play, elapsed and total time and a scrub bar. Below it: `book.recordingOnPhone` ("Recording kept on this phone").
2. Taps play. Playback starts; no haptic (MOTION section 6).
3. When a listening copy is in use, the Original recording switch (`playerCopy.originalLabel`) reads `playerCopy.originalOff`; switching on reads `playerCopy.originalOn` and plays the original. The choice is remembered on this phone (setting `player.original`, L2).
4. On pause, end or leaving the screen, the audio mode returns to idle.

**B. Listening copy made after the words.**
1. The transcription queue finishes a recording's words and is idle, with the app open.
2. It calls `copyForLetter(id)`: if AUSoundIsolation is available and no matching copy exists, the native `enhance` renders the original offline at 80% wet into `Application Support/listening/<id>.m4a` and writes a sidecar `<id>.json` holding the original's SHA-256.
3. Nothing is shown. Next playback uses the copy. A launch sweep deletes copies whose letter is gone.

**C. Delete and Recently deleted (D-085).**
1. Delete asks first; "Keep it" is the large button (`components/book/confirm-sheet.tsx`).
2. The letter waits on Settings > Recently deleted with its first words and the day it will be erased; nothing counts down.
3. Restore puts it back exactly as it was. Erase now asks once, then removes the recording and listening copy, then the row (`store.eraseEntry`).
4. At launch, letters deleted 30 or more days ago are erased the same way; no purge runs while the phone clock is earlier than the last recorded launch, and none runs in a build where sync is on (the server owns the clock).

### 6.3 Co-parent view (v1.0 per M14)

The letter text shows as written. Instead of a player: `book.recordingElsewhere` ("Recording kept on {signsAs}'s phone"); in Read together `readTogether.recordingElsewhere`. Backup does not change this: in v1.0 each parent's recordings are encrypted under that parent's own key for the book, and no key is ever granted to the other parent (6.5).

### 6.4 Keep-safe nudge (C-REQ-018, while backup is off)

Settings > Recordings shows `settings.recordings.onPhoneTitle` and `onPhoneBody`. When a month chapter closes for a book with at least one recording not covered by an export since, the Book shows one soft card (`recordings.keepSafe.*`, new) with Export as the primary action. At most once per chapter, never during capture, review or export, never a push. Not built. Hidden for an owner whose backup is on and current.

### 6.5 Encrypted backup of the owner's recordings (D-073, M16; not built)

What follows is the spec agents build from. Design source: ADR 0006 (Accepted, 1 Oct 2026) and TDD 04 sections 3.6 to 3.8, changed for v1.0 in three ways that need an ADR 0006 amendment before WP-F08-B2 starts (section 11.4): keys are per (child, author), not per child; each install has its own device key pair from day one; escrow is the only recovery path besides iCloud Keychain, with the step-up rules in 6.5 C. Nothing here is built.

**Key model**

| Key or object | What it is | Where it lives | Who can use it |
|---|---|---|---|
| File key | Random 256-bit key, one per recording | Inside the object header, wrapped by the book key; a copy of the wrapped key in `audio_blobs` | Any device holding that book key |
| Book key (BK) | Random 256-bit key per (child, author, key version). In a book with two parents each parent has their own BK for that child; neither is ever given the other's | The author's Keychain as one synchronizable item: service `earlyletters.backup`, account `<profile_id>:<child_id>`, holding every version (so it reaches the author's other Apple devices through iCloud Keychain, ADR 0006 building blocks) | The author's devices |
| Device key pair | X25519, one per install, made the first time backup or restore runs | Private key in the Keychain, this device only, never synced; public key in `backup_devices` (new) with a random device id, `enrolled_at`, `revoked_at` | The `escrow` function seals a BK to it |
| Escrow wrap of each BK | The BK sealed on the phone to the escrow public key (ephemeral X25519, HKDF-SHA256, AES-256-GCM; the HPKE base mode CryptoKit offers [A: iOS 17 availability verified in WP-F08-B1]) | `child_keys` (new), primary key (`child_id`, `profile_id`, `key_version`), with `escrow_key_version` | Only the `escrow` function, which holds the escrow private key |
| Escrow key pair | X25519, versioned. Private key generated offline by the founder (6.5 G); public keys ship in `packages/api/src/escrow-keys.ts` (new), current and next version | Private: one Edge Function secret `ESCROW_PRIVATE_KEY_V<n>` plus two sealed offline copies held apart | The `escrow` function |
| Backup object | Ciphertext of the original, path `{child_id}/{author_id}/{entry_id}.m4a.enc` in the private bucket `entry-audio` (the path the purge worker already expects) | Supabase Storage | Nobody without the BK |

A phone writes the escrow wrap itself, through the RPC `backup_store_key` (new), so storing a key never sends a plaintext BK to any server. Only a restore through escrow opens one, inside the `escrow` function's memory, and the function returns it sealed to the requesting device's public key.

**Object format** (R2 AR-08, AR-33, AR-34). A self-describing header in clear: magic, format version, key version, the wrapped file key, a nonce prefix, and the AAD fields (entry id, author id, key version). Then the original in 64 KiB segments, each AES-256-GCM with nonce = prefix plus a segment counter and a final-segment flag, so a resumable upload can stream from disk. The original's SHA-256 sits inside the first encrypted segment, never in clear. The server keeps only the ciphertext's SHA-256 (`audio_blobs.cipher_sha256`) for transfer checks. The ciphertext is written to `Application Support/backup-tmp/` (excluded from backup, protection at least complete until first user authentication) and swept at launch. The child id is not in the AAD, so a move rewraps only the file key (6.5 E).

**Server objects (new)**
- Bucket `entry-audio`: private, object size limit 20 MB (a 30-minute take is about 14.4 MB, ADR 0005).
- `audio_blobs`: `entry_id` primary key, `child_id`, `author_id`, `key_version`, `wrapped_file_key`, `cipher_sha256`, `bytes`, `format_version`, `state` (`pending`, `confirmed`), timestamps. No foreign key to `entries`, so a letter held at the Keep gate or waiting for its words can be backed up (R3 DX-01); the RPC checks that the caller is the author and a parent of `child_id`.
- `backup_begin(entry_id, child_id, bytes, key_version, wrapped_file_key)` and `backup_confirm(entry_id, cipher_sha256)` (new RPCs). The Storage insert policy allows an object only where a `pending` row owned by the caller matches the path.
- `child_keys`, `backup_devices`, `escrow_unwraps` (new): RLS gives the owner read of their own rows; no client reads another person's rows.

**A. Turn backup on (owner, signed in).**
1. Offered once after sign-in as that session's one ask (F02 ask table), and always in Settings > Storage and backup > Back up my recordings (`backup.title`). Off until the owner turns it on [R].
2. One sheet (`backup.sheetTitle`, `backup.sheetBody`, `backup.sheetNotIncluded`, copy in 6.7): encrypted on this phone first; we keep a recovery key so it can come back on a new phone; using it is strictly limited and logged; never listened to, sold or used to train models; other family members cannot hear these recordings yet. One button, `backup.turnOnButton`.
3. Tapping it records a `backup` consent act through `record_policy_act` (new policy key; counsel decides whether the sensitive-data consent can cover it instead, Q6; R4 PT-22).
4. The phone makes and registers its device key pair. For each child with own recordings it asks the server for an active `child_keys` row for (child, me). If one exists, it never creates a new BK: it waits up to 2 minutes [A] for the iCloud Keychain item, then goes to restore (6.5 B step 3). If none exists, it creates BK version 1, stores it in the Keychain, seals it to the escrow public key and stores the wrap.
5. It queues one upload per own recording, oldest first. Uploads run in the foreground on Wi-Fi by default (ADR 0016 section 4.3 rule), never during recording or playback, and resume after a kill from the last finished part [A: Supabase Storage resumable uploads; WP-F08-B1].
6. A recording is marked backed up only after `backup_confirm` succeeds. The row then shows `backup.lastBackedUp`. No counter of what is left.

**B. Restore on a new phone.**
1. The person installs the app and signs in with the same account (F02). Text arrives through sync (F16) at once.
2. If iCloud Keychain brings the BK items within 2 minutes, recordings start downloading.
3. Otherwise the app asks the `escrow` function for each BK it lacks. The rules in 6.5 C apply. The app shows `backup.restoreWaiting` with the time the recordings will start to arrive.
4. Recordings download when a letter is opened, and in the background of the open app on Wi-Fi for the rest. Each is decrypted, its SHA-256 checked against the value in its header, then it replaces the "not on this phone" line.
5. Files already in Documents from an iCloud device backup are matched by entry id and their local hash, and not downloaded again.

**C. Who can open a book key, and how (account takeover containment, R2 AR-06, R4 PT-19).**
Only the `escrow` function opens a BK. It never returns plaintext key bytes. Every call:
1. Needs a user JWT whose most recent sign-in is within 10 minutes [A: the claim that carries it is checked in WP-F08-B4], and a registered, unrevoked device.
2. If the device is not yet enrolled: at request time an email goes to the account address ("A new iPhone asked for your recordings", with a "Not you? Stop this" link that cancels the request and signs out every session). The request completes 24 hours later, or at once if an enrolled device of the same account approves it in the app (`backup.approveTitle`).
3. Writes one `escrow_unwraps` row per BK opened: profile id, device id, child id, key version, reason (`restore`, `rotation`, `legal`), outcome, request id, time. No content, no key bytes.
4. Sends one email to the account address when a restore completes.
5. Is limited to 3 new-device restores per account per rolling 30 days and 20 opened keys per account per day [R]; over the limit returns `SCRAT` and pages the founder.
6. Is off when the remote kill switch `killSwitches.escrow` is set or the build flag `capabilities.backup` is off (F19).
7. Does not deploy before BL-347 (email link hijack) merges and the new-device sign-in email (F02-REQ-017) ships.
Staff have no tool that calls it. The reason `legal` exists only for a written runbook that needs a recorded legal order and the founder's sign-off, and writes `ops.audit_log` as well (LEGAL-REQ-025). Honest limit, said in the Privacy Policy: whoever holds the escrow private key and the database and Storage can open recordings; we do it only through this function, for the owner's own restore or a legal order, and every use is logged.

**D. Turning backup off, erasing, and deleting the account never destroy the only copy (R2 AR-09).**
1. Before any server object is deleted (backup off with delete, account deletion), the phone counts the person's backed-up recordings that have no local original with the same SHA-256. If there are any, it shows `backup.onlyInBackup` with `backup.bringHere` (download with progress) before anything else.
2. A server object is deleted only when a local original with the same hash exists, or after the person confirms deletion of that exact count.
3. Turning backup off shows two equal choices with nothing preselected: `backup.offKeep` (stop new uploads, keep what is backed up and restorable) and `backup.offDelete`. The withdrawal is recorded as a `backup` withdraw act.
4. Erase now and the 30-day purge of a letter remove its object and `audio_blobs` row through the purge queue (DATA-REQ-011; F08-REQ-024).
5. Account deletion: the F17 flow runs step 1 before Confirm, and its export lists recordings not on this phone. On execution the purge worker deletes every object, `audio_blobs`, `child_keys`, `backup_devices` and `escrow_unwraps` row (escrow log rows are pseudonymised, a named exception, F17 section 8). Each of the person's devices deletes its BK items and device key at next launch once the server reports the account gone. A key left on a device that is never opened again decrypts nothing once the objects are purged.

**E. Upload order and moves (R2 AR-10).** A recording uploads as soon as its letter exists on the phone, whether or not the letter is on the server. A letter moved to another child after upload (F12 Move, "Bring your letters" on join) has its file key rewrapped under the author's BK for the new child and its object moved to the new path; the old path is deleted after the new one is confirmed. Voice-only letters back up like any other (F05 Q7 affects only text sync).

**F. Limits, lapse and retention (R2 AR-11, AR-35).** Per account: 5 GB of backup objects [R: about 10,000 audio minutes], checked in `backup_begin`; 600 `backup_begin` calls per hour [R: a first-enable burst for year 1 is about 480 recordings]. Backup is kept and restorable for the life of the account; there is no inactivity deletion of content (LEGAL-REQ-033). If the founder makes backup a Plus feature (Q2), a lapse stops new uploads only: what is backed up stays restorable and playable for free, and the row says new recordings are not being backed up.

**G. Escrow key custody, rotation and disaster recovery (R2 AR-07).**
1. Ceremony: the founder generates the escrow key pair offline (a script beside `scripts/packs/keygen.mjs`, new), stores the private key in the password manager and on one sealed printed copy kept in a different place [R], sets it as the `escrow` function's secret, and commits only the public key.
2. Supabase function secrets are project-wide [A: verify in WP-F08-B4]. The control is a release check: the secret's name appears in no file under `supabase/functions/` other than `escrow/` (F08-REQ-034).
3. Rotation: a new key version ships in `escrow-keys.ts` in an app release; new wraps use it; a batch inside the `escrow` function rewraps every row from the old version (one `rotation` row in `escrow_unwraps` per key); the old secret is removed when no row uses it.
4. Disaster recovery: a Postgres restore brings neither function secrets nor Storage objects. Runbook RB-8 copies both into the new project; the restore drill (BL-247, WP-F16-08) includes one escrow restore end to end. After an epoch reset (F16 6.2 F) the backup client re-checks every recording it believes uploaded and re-uploads any missing object.

**Plus or free.** Not decided by a logged decision. D-073 is silent; D-032 (superseded) said full backup is Plus. The code lists `backup_upload` as gated and `download_backed_up_audio` and `restore_backup` as free forever (`packages/core/src/plan.ts`). Principle 6 in `03-goals-and-principles.md` says Plus gates one thing, and R1 PL-02 and R3 DX-04 both recommend free. Spec default [R]: backup is free; the founder decides (Q2). If it stays Plus, `03` principle 6, M1 and every "only the Keep step" claim change in the same pull request. Restoring and playing what was backed up is never gated (C-NFR-008).

**Cost.** Supabase Pro from $25 a month the day real recordings reach a server (cost decisions 3 Oct), plus storage at $0.0213 per GB over 100 GB included and egress at $0.09 per GB over 250 GB included (ARCHITECTURE section 7; TDD 06 4.1, 4.2). Audio is 0.48 MB per minute (ADR 0005). About $22 a month of storage at 10k families after 12 months, about $243 at 100k (TDD 06 4.1).

**Claims that must change before backup ships (R2 AR-24, R4 PT-01, PT-02, PT-24).** Each is a requirement in section 7 with an owner stream from `08-delivery.md` section 3.

| Claim today | Where | Change | Owner | Req |
|---|---|---|---|---|
| "Your recordings stay on this phone." | Microphone purpose string: `packages/content/src/permissions.en.ts` line 14, `apps/mobile/src/lib/permission-copy.ts` line 13 | Keep only the first sentence. A purpose string is shown to every user and must be true whatever their backup setting | S16, counsel approves | F08-REQ-036 |
| "We do not upload, back up or transcribe recordings on our servers"; CCPA "Audio: None" | `docs/legal/privacy-policy.md` short version, sections 3, 7, 9, 11 to 13, 15 | Describe opt-in encrypted backup, the recovery key, who can use it and the log; declare audio | S17, counsel | F08-REQ-037 |
| "Your recordings stay on your phone, so we cannot listen to them" | `docs/legal/terms-of-service.md` 6.2, 12.4 | Delete the clause; describe backup | S17, counsel | F08-REQ-037 |
| Recordings never leave the phone | `docs/legal/consumer-health-data-notice.md` section 3 | Describe backup and escrow | S17, counsel | F08-REQ-037 |
| Audio Data "No" | `docs/legal/app-store-privacy-labels.md` 1.3.0; `PrivacyInfo` (BL-349) | Label 1.4.0: Audio Data, linked, App Functionality; manifest to match | S17 drafts, S20 manifest, counsel | F08-REQ-038 |
| `permissions.microphone`, `trust.firstRecording.body` | `docs/legal/in-app-disclosures.md` | Match the new strings | S17 | F08-REQ-037 |
| `entry-audio` marked v1.1 | `docs/legal/DATA_CLASSIFICATION.md`; `purge-worker/lib/buckets.ts` (`since: 'v1.1'`) | v1.0; rows for every new table and the Keychain items | S17 (doc), S07 (worker) | F08-REQ-037, F08-REQ-024 |
| LEGAL-REQ-023 "not in v1.0"; LEGAL-REQ-047 "nothing leaves the phone" | `docs/legal/ENGINEERING_REQUIREMENTS.md` | Version 1.3.0 for M14; only counsel relaxes a legal requirement (R4 PT-06) | S17, counsel | F08-REQ-037 |
| Backup lines in `DELETION_AND_EXPORT_SPEC.md` | lines R4 PT-05 lists | Add backup objects and escrow rows to the deletion and export rules | S17 | F08-REQ-037 |

These files are outside the PRD; the coordinator adds each to `reviews/STALE-OUTSIDE-PRD.md`.

### 6.6 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F08-U01 | Original file missing at play | No crash; row unchanged | `playerCopy.notOnPhone` | Restore from backup (when on) or device backup | Unit with a removed file |
| F08-U02 | Original hash mismatch | Flag only; never delete or rewrite; export marks `integrity: "mismatch"`; backup never uploads a file whose hash differs from `audio_sha256` | Plays as normal | Backup copy, if any, is the good one | Flipped-byte fixture |
| F08-U03 | App killed while making a listening copy | Native job abandoned; the original untouched; the copy is made again later | Nothing | Next idle queue | Kill test, 50 iterations (device) |
| F08-U04 | AUSoundIsolation unavailable or fails | `listeningCopiesSupported()` false or `failed`; playback uses the original | Original plays | n/a | Unit with a throwing native fake |
| F08-U05 | Listening copy judged worse | Original recording switch; preference remembered | Original plays | Switch back any time | Component test |
| F08-U06 | Isolation softens a baby's laugh or singing | 80% wet mix by default (ADR 0015, E: tuned by ear); original one tap away | Original switch | Switch | Listening check on device (S1-19) |
| F08-U07 | Take cut off by a kill does not open | Kept, hashed, marked `unrecoverable`, listed under Settings > Recordings "Takes that may not play"; never shown on Tonight as ready (D-085) | `settings.recordings.unplayableOne` | Export keeps the file | DL-01 (device) |
| F08-U08 | Call, Siri or alarm during playback | Playback pauses; never auto-resumes | Paused player | Tap play | Manual script |
| F08-U09 | App backgrounded during playback | Pause; idle mode | Paused on return | Tap play | E2E |
| F08-U10 | Silent switch on | Letter audio plays (deliberate tap) | Audio plays | n/a | Manual; R3 DX-38 (volume ramp) is a P2 for F10 and F08 design |
| F08-U11 | Co-parent letter, audio on the other phone | No player; `book.recordingElsewhere` | Text plus line | v1.1 shared voice | E2E two fixture devices |
| F08-U12 | Lapsed, signed out, offline | Playback and export work, no Plus UI (LEGAL-REQ-050) | Normal | n/a | E2E lapsed fixture |
| F08-U13 | Phone lost, no backup, no device backup, no export | Audio cannot come back; letter text returns after sign-in if sync was on (F16) | New phone shows letters with `playerCopy.notOnPhone` | Prevention: backup (D-073), keep-safe nudge | DL-03 negative case |
| F08-U14 | Restore from iCloud device backup to a new phone | Files return in Documents; sweep rebases paths by file name; hashes checked; Recently deleted dates kept; letters past day 30 erased at first launch with no orphan reappearing | Recordings play | n/a | DL-03, DL-04 (device) |
| F08-U15 | Letter in Recently deleted, then restored | Recording and copy still present (or copy made again) | Plays | n/a | Unit (exists) |
| F08-U16 | Erase now fails to remove the file | Row stays on the shelf for a retry (`eraseAudioFile` throws) | Letter still listed | Try again | Unit (exists) |
| F08-U17 | Backup upload interrupted (kill, network, Low Power Mode) | Job resumes from the last part; nothing marked backed up until `backup_confirm` succeeds; `backup-tmp` swept at launch | "Backing up" state on the row | Automatic | Kill and airplane tests (device) |
| F08-U18 | New phone without iCloud Keychain | Escrow request; email to the account; 24 h hold unless an enrolled device approves | `backup.restoreWaiting` with the time | Approve on the old phone, or wait | Two-phone drill with iCloud Keychain off; `[F08-REQ-029]` |
| F08-U19 | Escrow unavailable (kill switch, outage, rate limit) | Restore waits; text still syncs; no partial plaintext anywhere | `backup.restoreUnavailable` | Retry later | Kill-switch test (LEGAL-REQ-040) |
| F08-U20 | Downloaded backup fails its SHA-256 | Discarded; retried once; then listed as not on this phone | `playerCopy.cannotPlay` | Retry | Tampered-object fixture |
| F08-U21 | Owner turns backup off | Only-in-backup count first (6.5 D); then Keep or Delete, nothing preselected; withdraw act recorded | Sheet | Keep or delete | `[F08-REQ-035]` |
| F08-U22 | Account deleted | Only-in-backup step before Confirm; local wipe after one export offer; every server object, key row and device row purged; Keychain items removed at next launch on each device (DATA-REQ-023) | Deletion notice | Export first | F17 E2E; `[F08-REQ-040]` |
| F08-U23 | VoiceOver | Play labelled with author and duration (`playerCopy.playA11y`); scrub adjustable; nothing announces during playback | Same | n/a | S1-23 |
| F08-U24 | AX5 and Reduce Motion | Controls stack; times wrap; no animation flourish | Same | n/a | AX5 by the device script until the render harness lands |
| F08-U25 | Both parents back up recordings for one child | Each has their own BK for that child; neither can open the other's objects | Each sees only their own recordings backed up | n/a | `[F08-REQ-021]` two-account test |
| F08-U26 | New phone on the same Apple Account, iCloud Keychain slow | The app never creates a second BK while the server has an active `child_keys` row; waits 2 minutes, then escrow | `backup.restoreWaiting` | Automatic | `[F08-REQ-028]` |
| F08-U27 | Someone else signs in on a new phone and asks for recordings | Email with "Not you? Stop this"; 24 h hold; Stop cancels and signs out every session | Nothing on the attacker's phone for 24 h | Owner taps Stop | `[F08-REQ-029]` stop-link test |
| F08-U28 | Account reaches the 5 GB quota | `backup_begin` refuses; recording, saving and playback unaffected | Row: new recordings are not being backed up (new `backup.quotaReached`) | Support | Unit on the RPC |
| F08-U29 | Backed-up letter moved to another book | File key rewrapped under the new book key; object moved; old path deleted after confirm | Nothing | n/a | `[F08-REQ-032]` |
| F08-U30 | Server restored to an earlier point | Backup client re-checks every uploaded recording against `audio_blobs`; re-uploads missing ones | Nothing | Automatic | Restore drill (WP-F16-08) |
| F08-U31 | Letter held at the Keep gate or waiting for its words | Its recording backs up like any other (`audio_blobs` needs no `entries` row) | Normal backup state | n/a | `[F08-REQ-032]` |
| F08-U32 | Escrow key rotation in progress | Old and new public keys both trusted; restores keep working | Nothing | n/a | Rotation test in WP-F08-B4 |

### 6.7 Copy

Proposed first drafts for every new key (R3 DX-25). S16 owns the final words; counsel approves every backup line before it ships (M16).

| Key | Status | Text |
|---|---|---|
| `book.hearShort`, `book.hearLink`, `book.recordingOnPhone`, `book.recordingElsewhere` | Exist | as in content |
| `playerCopy.*` (`originalLabel`, `originalOn`, `originalOff`, `notOnPhone`, `cannotPlay`, `loading`) | Exist (`packages/content/src/features/player.en.ts`) | as in content |
| `settings.recordings.onPhoneTitle`, `onPhoneBody`, `unplayable*` | Exist; `onPhoneBody` reads "Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own." | Stays for owners with backup off; owners with backup on see `backup.lastBackedUp` instead |
| `settings.export.lastExport`, `neverExported` | Exist (D-085) | as in content |
| `backup.title` | New | Back up my recordings |
| `backup.sheetTitle` | New | Back up your recordings |
| `backup.sheetBody` | New | Your recordings are encrypted on this phone before they leave it. We keep a recovery key so you can get them back on a new phone. Its use is strictly limited and every use is logged. We never listen to your recordings, sell them or use them to train models. |
| `backup.sheetNotIncluded` | New | Other family members can't hear your recordings yet. Listening copies stay on this phone. |
| `backup.turnOnButton` | New | Back up my recordings |
| `backup.lastBackedUp` | New | Backed up {date} |
| `backup.restoreWaiting` | New | Your recordings will start coming back by {time}. We emailed you to check it's you. |
| `backup.restoreUnavailable` | New | Your recordings will come back when we can reach them. |
| `backup.approveTitle`, `.approveBody`, `.approveButton`, `.notMeButton` | New | Is this your new iPhone? / A new iPhone asked for your recordings. / Yes, it's mine / Not me |
| `backup.onlyInBackup`, `backup.bringHere` | New | {count} of your recordings are only in your backup right now. / Bring them to this phone |
| `backup.offTitle`, `.offKeep`, `.offDelete` | New | Turn off backup? / Keep what's backed up / Delete the backup |
| `backup.quotaReached` | New | New recordings are not being backed up. Write to us and we'll help. |
| `recordings.keepSafe.title`, `.body`, `.exportButton` | New | Keep a copy of your voice / An export keeps every letter and recording in one file you can store anywhere. / Export a copy |

Never: "only you can play them", "only your family's keys", "end-to-end", "lost", "only copy", fear or urgency; "enhanced", "polished", "smart" for the listening copy (content rules, M16). Removed on 4 Oct and replaced by the keys above: `settings.backup.*`, `settingsMore.backupNotYet`, `book.recordingBackedUp`, `errors.backupFailed`.

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source | Built 13 Oct |
|---|---|---|---|---|---|
| F08-REQ-001 | P0 | Original format | Given a finished take, Then the file is AAC-LC, 1 channel, 64 kbps nominal, `.m4a`, 48 kHz (`VOICE_RECORDING_OPTIONS`, `recorder.ts`), confirmed by `ScribeAudio.probe` on device | ADR 0005; ADR 0015 section 5 | Yes in code; device probe owed (S1-10) |
| F08-REQ-002 | P0 | The original is never altered | Given an original with SHA-256 H at capture, When a listening copy is made, the letter is played 10 times, exported, backed up, restored and the app updated, Then its SHA-256 is still H. No code path opens an original for writing | D-058; DATA-REQ-046 | Partly: no writer exists; the cross-step test is not written |
| F08-REQ-003 | P0 | Listening copy is a second file from the original, after the words | Given a saved spoken letter with words and an idle queue in the foreground, Then `listening/<id>.m4a` and its sidecar with the original's SHA-256 exist; the original is the only input | ADR 0015 section 5 | Yes |
| F08-REQ-004 | P0 | Never during capture or playback | Given recording, Review or playback active, Then no listening copy job starts | ADR 0015 section 5 | Partly |
| F08-REQ-005 | P0 | Transcription reads the original | Given a letter with both files, When F05 transcribes, Then the input URI is the original | ADR 0015 | Yes |
| F08-REQ-006 | P0, Rev (D-068) | A copy is used only when it matches; no remote flag | Given a sidecar whose hash differs from `audio_sha256`, or a copy at the original's own path, Then the player uses the original (`usableListeningCopy`) | `lib/player/listening.ts` | Yes |
| F08-REQ-007 | P0 | Original always one tap away | Given a listening copy in use, Then the Original recording switch is visible and one tap plays the original | D-058 | Yes |
| F08-REQ-008 | P0 | Playback is free in every state | Given Free, trial, Plus, lapsed, offline, signed out, Then play works and no entitlement check runs | PRD-REQ-020; LEGAL-REQ-050; D-083 | Yes |
| F08-REQ-009 | P0 | Playback controls | Given a spoken letter on this phone, Then play, pause, elapsed and total time and scrub work; tap to first audio p95 300 ms on SE 3 over 200 runs | COMPONENTS 2.21; TDD 06 2.2 | Partly |
| F08-REQ-010 | P0 | Wire the letter view player | Given `letter/[id].tsx` and a spoken letter whose file is on this phone, Then the player renders | `letter/[id].tsx` | Yes |
| F08-REQ-011 | P0 | Audio session for playback | Given play, Then playback mode; Given pause, end, background, unmount, Then idle within 500 ms; interruptions pause and never auto-resume | `audio-mode.ts` | Yes in code; device S1-20 |
| F08-REQ-012 | P0 | Co-parent view | Given a letter by another author whose file is not on this phone, Then no play control renders and `book.recordingElsewhere` shows | D-073; DR-07 | Built, switch off in release profiles |
| F08-REQ-013 | P0 | Where files live | Given iOS, Then originals are in Documents (in device backup); listening copies, models, packs and `backup-tmp` are in Application Support with backup excluded | D-033; ADR 0015; ADR 0016 | Yes except `backup-tmp`; device check S1-25 |
| F08-REQ-014 | P0, Rev (M16) | Honest durability and recovery copy | Given a build or an owner without backup on, Then no string claims a backup of ours. Given backup on, Then the strings say encrypted on the phone, a recovery key we hold under limited, logged use, never listened to, sold or used to train; and the rules test finds none of "only you can play", "only your family", "end-to-end" in any string | D-033; D-073; M16; R-10 | Yes for no-backup copy |
| DATA-REQ-010, DATA-REQ-011 | P0, Rev (D-085) | Audio follows its letter through delete, restore, erase, purge | Given a deleted letter, Then both files remain for 30 days and Restore brings them back. Given Erase now or a tombstone 30 days old at launch, Then the recording and listening copy are removed before the row; no local purge in a sync build | DATA-REQ-010, -011; D-085 | Yes; device DL-04, DL-05 |
| F08-REQ-019 | P0 | Playable check after a kill | Given a recovered take that does not load with a duration within 4 s, Then it is kept, marked `unrecoverable`, listed in Settings > Recordings, and not offered on Tonight as ready | D-085 | Yes; device DL-01 |
| C-REQ-018 | P0, Rev (D-073) | Keep-safe nudge while backup is off | Given a book with a recording not covered by an export or a current backup, When a month chapter closes, Then one card shows with Export as primary; never twice for a chapter, never a push, never in a session that already showed an ask | C-REQ-018; PRD-REQ-001 | No |
| DATA-REQ-046 | P0 | Integrity scrub | Given the phone charging and the app in the foreground, When 30 days have passed since the last scrub, Then every original is re-hashed; a mismatch is flagged and never deleted | DATA-REQ-046 | No |
| DATA-REQ-050, DATA-REQ-051 | P0 | Export includes the original as-is | Given export (F15), Then each recording is byte-identical with its hash in the manifest; the listening copy is not exported; others' letters carry `audio_missing.reason = "not_on_this_device"` | DATA-REQ-050, -051 | Yes |
| LEGAL-REQ-014 | P0 | No audio in telemetry | Given the log canary run, Then 0 audio bytes, file names with ids, or durations beyond buckets in logs or analytics | LEGAL-REQ-014 | Partly |
| LEGAL-REQ-022 | P0 | Device protection | Given the audio directory and `backup-tmp`, Then iOS Data Protection is at least complete until first user authentication | LEGAL-REQ-022(b); BL-245 | Entitlement set; device assertion owed |
| F08-REQ-015 | P1 | Remove listening copies | Given a Remove copies action in Settings > Recordings, Then every listening copy is deleted, originals' hashes are unchanged, and space used drops by the copies' bytes | Storage budget | No |
| F08-REQ-016 | P1 | Low storage | Given free space under 500 MB [A], Then no new listening copy starts | PRD 7.7 | No |
| F08-REQ-017 | P0 | Accessible player | Given VoiceOver, Then play is labelled with the author and duration and scrub is adjustable; Given AX5, Then nothing truncates; Given a voice-only letter, Then a text line says it has no words yet | LEGAL-REQ-051 | Partly; S1-23 |
| F08-REQ-018 | P0, Rev (D-073) | No plaintext audio leaves the phone | Given a full E2E run with backup off, Then the proxy log shows 0 requests carrying audio. Given backup on, Then the only audio bytes are ciphertext uploads to `entry-audio` | D-073; B7 | Yes for backup off |
| F08-REQ-020 | P0, Rev | Backup encrypts on the phone in the 6.5 object format | Given backup on, When a recording uploads, Then the body is the 6.5 header plus 64 KiB AES-256-GCM segments under a random file key; a proxy capture contains no M4A `ftyp` atom, no plaintext file key and no plaintext SHA-256 of the original; a reordered or truncated segment fails decryption | D-073; ADR 0006; TDD 04 3.6; R2 AR-34 | No |
| F08-REQ-021 | P0, Rev (AR-05) | One book key per (child, author, version), in a synchronizable Keychain item keyed `<profile_id>:<child_id>`; escrow wrap in `child_keys` keyed (`child_id`, `profile_id`, `key_version`) | Given two parents of one book each backing up, Then two BKs exist, each parent's phone opens only its own objects, and neither Keychain item nor escrow row of one parent is touched by the other | R2 AR-05 | No |
| F08-REQ-022 | P0 | Owner-only in v1.0 | Given another member of the book, Then no `child_key_grants` row exists and no API returns the owner's wrapped keys, `audio_blobs` rows or objects to them | D-073 | No |
| F08-REQ-023 | P0 | Restore on a new phone | Given an owner with backup on and 20 recordings, When they sign in on a second iPhone with iCloud Keychain on, Then within 10 minutes on Wi-Fi all 20 play with equal hashes. Given iCloud Keychain off and an enrolled phone that approves, Then the same within 10 minutes of the approval | D-073; BL-284 | No |
| F08-REQ-024 | P0 | Durable erase reaches the backup | Given Erase now or the 30-day purge on a backed-up letter, Then the object and its `audio_blobs` row are purged within the DELETION_AND_EXPORT_SPEC window; `purge-worker/lib/buckets.ts` lists `entry-audio` as v1.0 | D-085; DATA-REQ-011; R2 AR-22 | No |
| F08-REQ-025 | P0 | Backup never blocks the phone | Given no network, no sign-in, a full quota or a kill switch, Then recording, saving, playback and export work unchanged; uploads wait | PRD 7.4; LEGAL-REQ-040 | No |
| F08-REQ-026 | P0 | Copy never promises family listening | Given every string, listing and web page, Then none says family members can hear recordings in v1.0 (rules test) | D-073 | Partly |
| F08-REQ-027 | P0, new | A device key pair per install | Given first backup or restore on an install, Then an X25519 pair exists, the private key is a this-device-only Keychain item and the public key is in `backup_devices`; given an iCloud device backup restored to another phone, Then that phone makes its own pair | R2 AR-05 | No |
| F08-REQ-028 | P0, new | Never create a BK while the server holds an active one for (child, me) | Given an active `child_keys` row and no local Keychain item, Then the phone waits up to 2 minutes for iCloud Keychain, then restores through escrow, and creates no new key version | R2 AR-05 | No |
| F08-REQ-029 | P0, new | Escrow opens a BK only under the 6.5 C rules | Given a session older than 10 minutes, Then refused. Given an unenrolled device, Then an email goes out at request time and the key is released only after 24 h or an enrolled device's approval; given the Stop link, Then the request is cancelled and every session is signed out. Given a 4th new-device restore in 30 days, Then `SCRAT` and a page. Given any opened key, Then one `escrow_unwraps` row and a completion email | R2 AR-06; R4 PT-19 | No |
| F08-REQ-030 | P0, new | Escrow key custody, versioning and rotation per 6.5 G | Given a rotation in staging, Then every `child_keys` row moves to the new version, one `rotation` log row per key exists, restores work during and after, and the old secret can be removed | R2 AR-07 | No |
| F08-REQ-031 | P0, new | Self-describing objects and re-check after a server restore | Given the restore drill, Then every object decrypts from its header alone, and after an epoch reset the client re-uploads each object missing from `audio_blobs` | R2 AR-08 | No |
| F08-REQ-032 | P0, new | Upload order and moves per 6.5 E | Given a held letter, Then its recording backs up. Given a backed-up letter moved to another book, Then the object is at the new path under the new BK and the old path is empty | R2 AR-10; R3 DX-01 | No |
| F08-REQ-033 | P0, new | Limits per 6.5 F | Given a 21 MB object, Then refused by the bucket. Given an account at 5 GB, Then `backup_begin` refuses. Given an object insert with no matching `pending` row owned by the caller, Then refused by policy | R2 AR-11 | No |
| F08-REQ-034 | P0, new | Escrow deploy and secret guards | Given a release, Then a check finds the escrow secret name only under `supabase/functions/escrow/`; the escrow function is not deployed to production until BL-347 and F02-REQ-017 have merged | R4 PT-03; R2 AR-06 | No |
| F08-REQ-035 | P0, new | Turning backup off or deleting the account never destroys the only copy without a prompt | Given 3 backed-up recordings not on this phone, When the owner turns backup off with delete or confirms account deletion, Then the only-in-backup step shows the count and Bring them here first, and no object is deleted unless a local original with the same hash exists or the owner confirmed that count | R2 AR-09 | No |
| F08-REQ-036 | P0, new | Microphone purpose string is true for every user | Given the built Info.plist, Then `NSMicrophoneUsageDescription` is the first sentence only ("{app} uses the microphone to record the letters you speak to your child."); a rules test fails on "stay on this phone" in any permission string. Owner S16; counsel approves | R2 AR-24; R4 PT-01 | No (string says recordings stay on the phone) |
| F08-REQ-037 | P0, new | Legal texts describe backup and escrow before an outside family can turn backup on | Given the M14 counsel delta, Then the Privacy Policy, Terms 6.2 and 12.4, the health data notice, in-app disclosures, DATA_CLASSIFICATION, DELETION_AND_EXPORT_SPEC and ENGINEERING_REQUIREMENTS carry the 6.5 changes, and the claims registry has a fact row for each backup sentence. Owner S17; counsel | R4 PT-01, PT-05, PT-06 | No |
| F08-REQ-038 | P0, new | Privacy label and manifest declare audio | Given the build with backup, Then label 1.4.0 lists Audio Data, linked, App Functionality, and `PrivacyInfo` matches. Owner S17 and S20; counsel | R4 PT-24 | No |
| F08-REQ-039 | P0, new | Backup has its own consent act, unless counsel says the sensitive-data consent covers it | Given Turn on, Then one `backup` accept act is recorded and listed in Your agreements (F17); given Turn off, Then a withdraw act | R4 PT-22 | No |
| F08-REQ-040 | P0, new | Keys leave every device after account deletion | Given an executed deletion, When each of the person's devices next launches, Then its BK items and device key are gone | R2 AR-22 | No |
| F08-REQ-041 | P0, new | Remote kill switches and build flag | Given `killSwitches.backupUploads` set, Then no upload starts; given `killSwitches.escrow` set, Then no unwrap runs; given `capabilities.backup` off in a build, Then no backup UI or upload | R2 AR-12; F19 | No |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Original `<file>.m4a` | L4 | App Documents (in the person's iPhone backup) | Author's app | Life of the letter; erased 30 days after delete or on Erase now | Export, the person's iPhone backup, and the encrypted backup when on |
| Listening copy `listening/<id>.m4a` and sidecar | L4 (derived) | Application Support, excluded from backup | Author's app | Deleted with its letter or by the launch sweep | Never |
| `entries.audio_sha256`, `audio_bytes`, `audio_duration_ms` | L4, L2, L2 | Local SQLite | Author | Life of the letter | Never: not in the sync wire contract (R2 AR-32); the original's hash travels only inside the encrypted object header |
| Backup ciphertext | L4 (ciphertext of L4) | Storage `entry-audio` | Nobody without the BK | Until erase, backup off with delete, or account deletion | Yes, by design (D-073) |
| `audio_blobs` (wrapped file key, ciphertext hash, size, key version) | L4 secret wrapped | Postgres (new) | Owner | As the object | Server |
| Book key (BK) | L4 secret | Keychain, synchronizable | Owner's Apple devices | Account deletion, then removed at next launch per device | iCloud Keychain |
| Device private key | L4 secret | Keychain, this device only | That install | Account deletion or app removal | Never |
| `backup_devices` (device id, public key, enrolled, revoked) | L3 | Postgres (new) | Owner | Account deletion | Server |
| `child_keys` escrow wrap | L4 secret wrapped | Postgres (new) | `escrow` function only | Account deletion | Server |
| `escrow_unwraps` log | L3 | Postgres (new) | Owner (own rows), founder | 24 months; pseudonymised at account deletion (named exception, F17 section 8) | Server |
| Escrow private key | Secret | Edge Function secret, two sealed offline copies | `escrow` function | Until rotated | n/a |
| Settings `player.original`, `lastExportedAt` | L2 | Local settings | App | Install | Never |

Every new table, the bucket and the Keychain items need rows in `docs/legal/DATA_CLASSIFICATION.md` in the same pull request (DATA-REQ-001). The claims that change are in 6.5 and F08-REQ-036 to -038.

## 9. Non-functional requirements

| Area | Budget | Gate | How measured |
|---|---|---|---|
| Local playback start | p95 300 ms [R] | Yes | Perf build, 200 samples on SE 3 |
| Storage per audio minute | Original 0.48 MB; listening copy about the same [A] | n/a | File sizes |
| Listening copy, 2-minute letter | Unmeasured; ADR 0015 lists the offline render as a device item | Measure | S1-19 |
| `backup_begin`, `backup_confirm`, `backup_store_key` | p95 500 ms, p99 1.2 s (write RPC class); limits in 6.5 F | Yes for backup | Load test |
| Object upload | Resumable in parts [A: Supabase part size confirmed in WP-F08-B1]; a 2-minute letter on Wi-Fi in 10 s or less [A] | No | Device run |
| `escrow` function | p95 600 ms, p99 1.5 s including cold start (light Edge Function class); abuse limits in 6.5 C | Yes for backup | Load test; function tests |
| First-enable burst | One year of recordings (about 480) uploads on Wi-Fi in 30 minutes or less [A]; the app stays usable throughout | No | Device run; F16 load scenario |
| Restore, 20 recordings on Wi-Fi | 10 minutes or less (F08-REQ-023) | Yes for backup | Two-phone drill |
| Encryption cost | 1 s or less per 10 MB on SE 3 [A] | No | WP-F08-B1 |
| Binary size | Speech and audio area about 1 MB (ADR 0015 section 6, E); the Keychain module plus crypto adds under 1 MB [A] | Yes for the 40 MB total | IPA size check |
| Durability | Zero originals altered; zero lost in kill runs | Yes | WP-F08-07, DL-01, DL-02 |
| Accessibility | WCAG 2.2 AA; AX5; VoiceOver | Yes | S1-23 |

## 10. Analytics

| Event | Status | Properties | Question |
|---|---|---|---|
| `playback_started` | Exists | `surface`, `author_relation`, `version` (`listening_copy`, `original`) | Do people keep the listening copy or switch to the original? |
| `settings_changed` | Exists; key `listening_copy` | `key` | Is the copy trusted? |
| `letter_deleted` | Exists; `action` includes `restored` | `action`, `destination` | How often Recently deleted saves a letter |
| `playback_failed` | New | `reason` (`missing`, `decode`, `session`) | Playback health |
| `backup_status` | New | `state` (`off`, `on_current`, `on_behind`), counts bucketed | Backup coverage, no content |
| `restore_completed` | New | `count_bucket`, `source` (`icloud_keychain`, `escrow`) | Restore health |

All opt-in, L2 only. Escrow use is counted from `escrow_unwraps` on the server (counts only), not from device events.

## 11. How we build it (with the architect)

### 11.1 Components and status (13 Oct 2026)

| Part | File | Status |
|---|---|---|
| Recorder settings, 48 kHz | `apps/mobile/src/lib/capture/recorder.ts` | Built |
| Player and version choice | `apps/mobile/src/components/player/audio-player.tsx`, `lib/player/` | Built (no speed control) |
| Listening copy | `apps/mobile/src/lib/audio-enhance/index.ts`; native `enhance` in `modules/scribe-audio` | Built; device render unverified |
| Erase and purge | `apps/mobile/src/lib/capture/erase.ts`, `store.ts`, `lib/shelf-days.ts` | Built (D-085) |
| Playability probe | `apps/mobile/src/lib/capture/probe.ts` | Built |
| Recently deleted | `apps/mobile/src/app/settings/recently-deleted.tsx` | Built |
| Settings > Recordings | `apps/mobile/src/app/settings/recordings.tsx` | Built |
| Keep-safe card | `apps/mobile/src/components/book/keep-safe-card.tsx` | Not built |
| Keychain and crypto module | `apps/mobile/modules/scribe-keys/` (new): synchronizable BK items, this-device-only device key, X25519, AES-GCM segments | Not built |
| Backup client | `apps/mobile/src/lib/backup/` (new): queue, restore, keys, only-in-backup count | Not built |
| Backup settings screen | `apps/mobile/src/app/settings/backup.tsx` (new, S05), split from `storage.tsx` (packs, S08) per R2 AR-17 | Not built |
| Server | New S05 migration: bucket, `audio_blobs`, `child_keys`, `backup_devices`, `escrow_unwraps`, RPCs, policies. Changes to shared purge functions go through S02 (R2 AR-16) | Not built |
| Escrow function | `supabase/functions/escrow/` (new), ADR 0017 envelope and logs; `supabase/config.toml` entry requested from S02 | Not built |
| Escrow public keys | `packages/api/src/escrow-keys.ts` (new, S07) | Not built |
| Purge coverage | `supabase/functions/purge-worker/lib/buckets.ts` (`since: 'v1.1'` today), steps for the new tables (S07 owns the worker) | Listed, not active |

### 11.2 Riskiest unknowns and the spikes

1. **Device behaviour of what is built** (S1-19, S1-20, S1-25, DL-01 to DL-05).
2. **Backup feasibility.** Spike WP-F08-B1: a synchronizable Keychain item from an Expo local module, created on phone A and read on phone B on the same Apple Account, then deleted from both; X25519 sealing and AES-GCM segment speed on SE 3; a resumable upload of a 15 MB file to Supabase Storage after a kill. FUTURE OPEN-02 estimated backup and restore at 3 to 4 person-weeks [E].

### 11.3 Sequencing

Order only; dates live in `08-delivery.md` section 5. (1) ADR 0006 amendment. (2) WP-F08-B1 spike and the escrow key ceremony (B8). (3) Server tables and RPCs (B3), keys on the phone (B2), escrow function (B4). (4) Upload queue (B5a), restore (B5b), settings row (B5c), off and delete (B5d). (5) Legal and copy set (B7) through the counsel delta. (6) Restore drill (B6), the release gate for backup. Escrow needs BL-347 and F02-REQ-017 merged first. Whether backup ships on by default for C1 families or behind `capabilities.backup` with opt-in is the founder decision R2 AR-19 asks for (`08-delivery.md`).

### 11.4 ADRs required before build

Numbers per `08-delivery.md` section 8.1 (next free 0020 or later). Matches R2's list item 2.

| ADR | Content | Closes | Blocks |
|---|---|---|---|
| Owner backup v1.0 (amends ADR 0006) | Key per (child, author); device key pairs; escrow sealing and the 6.5 C rules; escrow key custody, versioning, rotation and disaster recovery; the object format with the wrapped key and in-header hash; upload order and moves; quota and limits; lapse and retention; Vault mode stays later | R2 AR-05 to AR-11, AR-33 to AR-35 | WP-F08-B2 to B5d |
| Account deletion across systems | F17 section 11 owns it; F08 supplies the backup rows | R2 AR-22 | WP-F08-B5d |
| M14 capabilities and kill switches (amends ADR 0016) | F19 owns it; F08 needs `capabilities.backup`, `killSwitches.backupUploads`, `killSwitches.escrow` | R2 AR-12 | F08-REQ-041 |
| Email links: PKCE and when a link is accepted | F02 owns it; escrow does not deploy before it | R2 AR-06 | WP-F08-B4 deploy |

## 12. Work packages

Status is what `develop` holds on 13 Oct 2026. "Device" names the run in `docs/qa/DEVICE_TEST_PLAN.md`. File ownership follows `08-delivery.md` section 3.3; a path owned by another stream is a request.

| WP | Scope | Stream | Owns files or folders | Depends on | Done when (tests that must pass) | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|---|
| WP-F08-01 | Device checks of the built audio path | S19, founder | `docs/qa/evidence/` | first dev build | S1-10, S1-19, S1-20, DL-01, DL-02 rows recorded | human | Not run | S1-10, S1-19, S1-20, DL-01, DL-02 |
| WP-F08-02 | File locations and honest copy | S16 | `apps/mobile/src/app/settings/recordings.tsx`, `packages/content` | D-033 | `[F08-REQ-013]`, `[F08-REQ-014]` | agent | Built for backup off | S1-25 |
| WP-F08-03 | Shared player, letter view, Review, co-parent line, version choice | S13 | `apps/mobile/src/components/player/`, `lib/player/` | none | `[F08-REQ-006]` to `[F08-REQ-012]`, `[F08-REQ-017]` | agent | Built except speed control and the 300 ms measurement | S1-20, S1-23 |
| WP-F08-04 | Listening copy job | S10 | `lib/audio-enhance/`, `modules/scribe-audio` | BL-140 | `[F08-REQ-002]` to `[F08-REQ-005]`; kill test 50 of 50 | agent plus device | Built; device check owed | S1-19 |
| WP-F08-05 | Delete, shelf, erase, purge, playable check | S13 | `lib/capture/erase.ts`, `probe.ts`, `store.ts`, `app/settings/recently-deleted.tsx` | none | `[DATA-REQ-011]`, `[F08-REQ-019]` | agent | Built | DL-04, DL-05 |
| WP-F08-06 | Keep-safe card | S13 | `components/book/keep-safe-card.tsx` (new) | F15 entry, ask sequencer | `[C-REQ-018]` | agent | Not built | none |
| WP-F08-07 | Original-unaltered test and monthly scrub | S13 | `apps/mobile/src/lib/audio/scrub.ts` (new), `apps/mobile/test/` | WP-F08-04 | `[F08-REQ-002]`, `[DATA-REQ-046]` | agent | Not built | none |
| WP-F08-08 | Analytics | S18 | `packages/analytics/src/catalog.ts` | none | Catalogue tests for `playback_failed`, `backup_status`, `restore_completed` | agent | Partly | none |
| WP-F08-B1 | Spike: synchronizable Keychain module, X25519 sealing, AES-GCM segments, resumable upload | S05 | `apps/mobile/modules/scribe-keys/` (spike branch), `docs/qa/evidence/` | none | Item on phone A appears on phone B and deletes from both; 15 MB encrypt time on SE 3; upload resumes after a kill; HPKE availability on iOS 17 recorded | pair | Not built | Two iPhones, one Apple Account |
| WP-F08-B2 | Keys on the phone: BK per (child, author), device key pair, file keys, sealing, AAD, the never-create rule | S05 | `apps/mobile/modules/scribe-keys/`, `apps/mobile/src/lib/backup/keys.ts` (new) | WP-F08-B1, ADR | `[F08-REQ-020]`, `[F08-REQ-021]`, `[F08-REQ-027]`, `[F08-REQ-028]` | agent plus device | Not built | Two iPhones |
| WP-F08-B3 | Server: bucket, tables, RPCs, policies, quota | S05 author, S02 review | New S05 migration, `supabase/tests/backup.test.mjs` (new) | ADR, `approve-migration` | `[F08-REQ-022]`, `[F08-REQ-033]` in `npm run test:db` | agent | Not built | none |
| WP-F08-B3p | Purge steps for `entry-audio` and the new tables; `buckets.ts` to v1.0 | S07 (worker), S02 (shared purge functions) | `purge-worker/lib/buckets.ts`, `purge-worker/account.ts`; S02 migration for `prepare_account_purge` | WP-F08-B3 | `[F08-REQ-024]`, `[F08-REQ-040]` server part in `npm run test:functions` | agent | Not built | none |
| WP-F08-B4 | `escrow` Edge Function | S05 author, S07 review | `supabase/functions/escrow/` (new) | WP-F08-B3, ADR 0017, B8 | `[F08-REQ-029]`, `[F08-REQ-030]`, `[F08-REQ-034]` | agent, security review | Not built | none |
| WP-F08-B5a | Upload queue and object format | S05 | `apps/mobile/src/lib/backup/queue.ts` (new) | WP-F08-B2, B3 | `[F08-REQ-018]`, `[F08-REQ-020]`, `[F08-REQ-025]`, `[F08-REQ-031]`, `[F08-REQ-032]` | agent | Not built | Kill and airplane |
| WP-F08-B5b | Restore on a new phone, approval sheet | S05 | `apps/mobile/src/lib/backup/restore.ts` (new), approval sheet | WP-F08-B4, B5a | `[F08-REQ-023]` | agent | Not built | Two iPhones |
| WP-F08-B5c | Settings row, turn-on sheet, consent act | S05 with S16 copy | `apps/mobile/src/app/settings/backup.tsx` (new) | WP-F08-B5a | `[F08-REQ-014]`, `[F08-REQ-026]`, `[F08-REQ-039]`, `[F08-REQ-041]` | agent | Not built | none |
| WP-F08-B5d | Turn off, only-in-backup count, account-deletion hook, Keychain cleanup | S05 with S14 | `apps/mobile/src/lib/backup/off.ts` (new); hook in `lib/account-deletion/` (request to S14) | WP-F08-B5b | `[F08-REQ-035]`, `[F08-REQ-040]` | agent | Not built | none |
| WP-F08-B6 | Restore drill and release gate | S19, founder | `docs/qa/evidence/` | WP-F08-B5d | 20 of 20 recordings restored with equal hashes, with iCloud Keychain on and off; erase reaches the server; one escrow restore after a database restore | human | Not run | DL-03 extended, two iPhones |
| WP-F08-B7 | Claims set: mic string, legal texts, label, manifest | S16, S17, S20 | `packages/content/src/permissions.en.ts`, `apps/mobile/src/lib/permission-copy.ts` (S16); `docs/legal/**` (S17); `app.config.ts` privacy manifest (S20) | counsel delta | `[F08-REQ-036]`, `[F08-REQ-037]`, `[F08-REQ-038]` | agent, counsel | Not built | none |
| WP-F08-B8 | Escrow key ceremony | Founder | Password manager, sealed copy; `packages/api/src/escrow-keys.ts` (S07 adds the public key) | none | Public key committed; secret set in staging and production; check of F08-REQ-034 passes | human | Not done | none |

## 13. Open questions and assumptions

Dates are milestones in `08-delivery.md` section 2.1.

| # | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | D-073 versus the on-device v1.0 | Answered by M14 and M15 | n/a | WP-F08-B1 to B8 are v1.0 |
| Q2 | Backup free or Plus. Spec default [R]: free (R1 PL-02, R3 DX-04); `plan.ts` still lists `backup_upload` as gated | Founder; F14 for copy | Before WP-F08-B5c | 6.5 F; `plan.ts`; F14; `03` principle 6 |
| Q3 | DR-09 named RNNoise; the code uses AUSoundIsolation. Confirm and close DR-09 | Founder | Go or no-go milestone | 09 DR-09 |
| Q4 | Privacy label 1.4.0 and policy wording for backup with escrow | Counsel, S17 | Counsel delta (moved earlier per R4 PT-24) | F08-REQ-037, F08-REQ-038 |
| Q5 | Standard mode only at v1.0, Vault later (T5-06) | Decided by M16 | n/a | Section 4 |
| Q6 | Does backup need its own consent act, or can the sensitive-data consent cover it? Spec default: its own act (R4 PT-22) | Counsel | Counsel delta | F08-REQ-039 |
| Q7 | Is the 24 h hold for an unenrolled device acceptable when the person lost their only phone? Spec default: yes, text arrives at once and the copy states the time | Founder | Before WP-F08-B4 | 6.5 C |
| Q8 | Ship backup on for C1 families, or behind `capabilities.backup` with opt-in (R2 AR-19) | Founder | Per 08 | 11.3 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | iCloud device backup includes Documents | DL-03, S1-25 |
| A2 | A synchronizable Keychain item from an Expo local module syncs within 2 minutes on the same Apple Account | WP-F08-B1 |
| A3 | Supabase Storage resumable uploads work from React Native for 15 MB files | WP-F08-B1 |
| A4 | 80% wet keeps a baby's sounds audible | S1-19 by ear |
| A5 | CryptoKit offers the X25519 sealing construction on iOS 17, and Deno can open it | WP-F08-B1, WP-F08-B4 |
| A6 | Supabase function secrets are project-wide, so the release check is the control | WP-F08-B4 |

## 14. Sources

- Decisions: `docs/DECISIONS.md` D-032, D-033, D-053, D-058, D-059, D-061, D-069, D-073, D-080, D-083; `_AUTHORING.md` 3b M7, M11, M13 to M16; D-085 from commit 6482cd3.
- Reviews: `reviews/R2-architect.md` AR-05 to AR-12, AR-17 to AR-19, AR-22, AR-24, AR-32 to AR-36; `reviews/R4-privacy-trust.md` PT-01 to PT-03, PT-05, PT-06, PT-19, PT-22, PT-24, PT-34; `reviews/R1-product-leader.md` PL-02; `reviews/R3-design-research.md` DX-01, DX-04, DX-25, DX-38.
- ADRs and design: `docs/adr/0005-audio-format.md`; `docs/adr/0006-encrypted-backup.md` (decision items 1 to 5, consequences); `docs/adr/0015-per-language-speech-models.md` sections 5, 6, 9; `docs/adr/0016-lean-app-and-server-driven-content.md` section 4.3; `docs/adr/0017-api-standards.md`; `docs/tdd/04-security-identity.md` sections 2, 3.6 to 3.8, 4; `docs/tdd/06-performance-reliability.md` sections 2.2, 4.1, 4.2; `docs/ARCHITECTURE.md` section 7.
- Plans: `08-delivery.md` sections 2, 3, 5, 8.1; `docs/backlog/FUTURE.md` OPEN-02, T5-06; `docs/BACKLOG.md` BL-232, BL-247, BL-284, BL-347, BL-349; `docs/qa/DEVICE_TEST_PLAN.md`.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -019, -022, -023, -025, -033, -040, -045, -047, -050, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md`; `docs/legal/DATA_CLASSIFICATION.md`; `docs/legal/privacy-policy.md` (short version, CN-8); `docs/legal/terms-of-service.md` 6.2, 12.4; `docs/legal/app-store-privacy-labels.md` 1.3.0.
- Code read 13 Oct 2026: `apps/mobile/src/lib/capabilities.ts`, `lib/permission-copy.ts`, `lib/capture/*`, `lib/player/listening.ts`, `lib/store.ts`, `lib/supabase/secure-storage.ts`; `packages/content/src/permissions.en.ts`, `strings.en.ts`, `features/player.en.ts`, `features/billing.en.ts`; `packages/core/src/plan.ts`; `supabase/migrations/*` (no audio bucket or key tables; `20261002020000` line about `audio_blobs`); `supabase/functions/purge-worker/lib/buckets.ts`, `account.ts`.
- Research: R1 section 0 item 6, F08 table (R1-S3, R1-S4, R1-S6, R1-S13, R1-S14, R1-S15, R1-S54, R1-S60, R1-S64, R1-S67); R2 section 0 item 5; CR section 4.
