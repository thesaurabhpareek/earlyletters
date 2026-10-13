# F08 Recordings: original, listening copy, playback, encrypted backup

| | |
|---|---|
| Release | v1.0 gate. Encrypted backup of the owner's own recordings is v1.0 by D-073; family members hearing each other's recordings is v1.1 (F31) |
| Priority and rank | P0, rank 4 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P4 Multilingual family, P6 Future reader |
| Existing IDs | C-REQ-017, C-REQ-018, PRD-REQ-020 (playback always free), LEGAL-REQ-014, LEGAL-REQ-022, LEGAL-REQ-023, LEGAL-REQ-050, DATA-REQ-010, DATA-REQ-011, DATA-REQ-046, DATA-REQ-048, DATA-REQ-050, DATA-REQ-051, DATA-REQ-055, D-032 (superseded), D-033, D-058, D-059, D-073, D-085, DR-07, DR-09, R-10, R-11, BL-134, BL-140, BL-150, BL-205, BL-232, BL-245, BL-284, BL-306 |
| Depends on | F02 (sign-in, for backup), F04 (capture writes the original), F05 (transcription reads the original; the queue makes listening copies), F09 (letter view, Recently deleted), F14 (Plus copy, if backup is ever gated), F15 (export), F16 (sync engine and the server switch), F17 (Settings > Recordings, Storage and backup rows), F19 (remote config) |
| Status | Draft V2, 3 Oct 2026. Rewritten 13 Oct 2026 for D-073 (backup in v1.0), D-085 (Recently deleted, durable erase, playable check) and the code on `develop`; revised 13 Oct for M14 (server features on for v1.0, Q1 answered) |

## 1. Why

- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64), and QR codes to audio in printed books are the category's most emotional praise (R2 section 0 item 5; CR section 4).
- [F] Keeping and playing the original is table stakes among voice products: Remento keeps recordings downloadable at any time, and Day One keeps audio playable on every tier after a subscription ends (R1-S13, R1-S60).
- [F] Apple Voice Memos offers one-tap Enhance to reduce background noise (R1-S64). Nobody we found keeps a cleaned copy beside an untouched original (R1 F08 opportunity).
- [D] The original recording is never altered; a clearer listening copy is allowed; the person can always hear the original (D-058, B6).
- [D] **Encrypted backup of the owner's recordings ships in v1.0; family members hearing each other's recordings stays v1.1** (D-073, founder, evening of 3 Oct 2026, superseding D-032 and the "no audio upload in v1.0" part of D-059; `_AUTHORING.md` M7). Copy must not promise family listening in v1.0 (D-073 consequences).
- [D] **Server features are on for v1.0** (M14, founder, 13 Oct 2026), reversing commit c1764f9 ("v1.0 on-device only"). Sign-in, sync and the production database ship with backup, so section 13 Q1 is answered: D-073 stands.
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

**Outcome.** Every recording stays exactly as it was captured, plays in one tap on the author's phone with no gate, also after a lapse (M1), survives a lost or replaced phone through an encrypted backup only the family's keys can open, and the family is told honestly where it lives.

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
- **Encrypted backup of the owner's own recordings (D-073)**: section 6.5 and 11.3. Not built.
- **Restore on a new phone**: sign in, text syncs (F16), recordings download and decrypt. Not built.
- Keep-safe nudge (C-REQ-018) pointing to export and device backup while backup is off. Not built.

**Later**
| Item | Release | Why later |
|---|---|---|
| Family members hear each other's recordings (shared voice, F31): the CCK wrapped to each member's key (`child_key_grants`) | v1.1 | D-073, D-059 |
| Vault mode (no escrow; Recovery Kit only) | Later (FUTURE T5-06) | ADR 0006 option; adds a printable kit and a confirm flow |
| Backup of listening copies | Never needed | They are made again from the original |
| Lossless or Opus archival export | v1.x | ADR 0005 consequences |
| QR codes to audio in a printed book | Later (F42) | Print is later |
| Speed control | v1.0.x | Not built; COMPONENTS 2.21 lists it |
| Now Playing and lock-screen controls | Later | COMPONENTS 2.21 marks them deferred |

**Never**
- Any change to the original's bytes: trimming, gain, denoise, re-encode, metadata rewrite (D-058).
- Voice processing at capture (ADR 0015 section 5: it would change the original).
- Replacing the original with the listening copy, anywhere, including export and backup.
- A server that can read a recording without a logged escrow unwrap (LEGAL-REQ-023; TDD 04 3.6).
- Speaker identification or voiceprints from recordings (LEGAL-REQ-019); using recordings to imitate a voice or train models (D-061).
- Audio in analytics, logs, crash reports or URLs (LEGAL-REQ-014).
- Copy that promises family members can hear recordings before v1.1 (D-073).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Recordings kept and downloadable at any time; QR codes in printed stories play the original [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | Voice is the emotional core [S] R2 section 0 item 5 | **Match** original always available |
| Day One | Playback on every tier, including after a subscription ends; recording needs a paid tier [F] R1-S60 | 4.8 (118K) [F] R1-S6 | n/a | **Match** playback never gated, also after a lapse; capture never gated either (M1) |
| Apple Voice Memos | One-tap Enhance reduces noise and echo [F] R1-S64 | 4.8 (1.1M) [F] R1-S64 | n/a | **Innovate**: the clearer version is a separate copy; the original stays |
| Dearest | Voice memories; full ZIP export [F] R1-S3 | 5.0 (1) | n/a | **Match** ZIP with audio (F15) |
| Tiny Treasures | Exports audio files for offline keeping [F] R1-S67 | 5.0 (7) | n/a | **Match** |
| FirstChapter | Privacy label lists audio as data linked to the user, so audio leaves the phone [F] R1-S4 | n/a | n/a | Contrast: our backup is ciphertext only; the server cannot play it without a logged unwrap |
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
| Settings > Storage and backup | F17 shell | Backup on or off, last backed up, space used (section 6.5) | Storage built (`storage.tsx`, packs only); backup row not built |
| New phone, signed in | F02, F16 | Restore of recordings (section 6.5 B) | No |

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

The letter text shows as written. Instead of a player: `book.recordingElsewhere` ("Recording kept on {signsAs}'s phone"); in Read together `readTogether.recordingElsewhere`. Backup does not change this: an owner's backup is readable only by that owner's own devices in v1.0 (no member grants).

### 6.4 Keep-safe nudge (C-REQ-018, while backup is off)

Settings > Recordings shows `settings.recordings.onPhoneTitle` and `onPhoneBody`. When a month chapter closes for a book with at least one recording not covered by an export since, the Book shows one soft card (`recordings.keepSafe.*`, new) with Export as the primary action. At most once per chapter, never during capture, review or export, never a push. Not built. Hidden for an owner whose backup is on and current.

### 6.5 Encrypted backup of the owner's recordings (D-073; not built)

What follows is the spec agents build from (section 13 Q1 answered by M14). Design source: ADR 0006 (Accepted, 1 Oct 2026) and TDD 04 sections 3.6 to 3.8, narrowed to the owner's own recordings (no member grants until v1.1).

**What is encrypted where**

| Thing | Where it lives | Encrypted how | Who can read it |
|---|---|---|---|
| Original recording | The author's phone, Documents (unchanged) | iOS Data Protection (LEGAL-REQ-022(b)) | The author's app |
| Backup copy of the original | Supabase Storage, private bucket `entry-audio`, path `{child_id}/{author_id}/{entry_id}.m4a.enc` (the path the purge worker already expects) | AES-256-GCM on the phone before upload, with a random 256-bit file key per recording; the AAD binds the entry id, child id and key version (TDD 04 3.6.3) | Only a device that can unwrap the file key |
| File key | Row in `audio_blobs` (TDD 02 name; new table) | Wrapped with the Child Content Key (CCK) | As above |
| CCK, one per child | The author's Keychain as a synchronizable item, so it reaches the author's other Apple devices through iCloud Keychain (ADR 0006 item 2) | Apple's iCloud Keychain protection [A: Apple's E2E claim, TDD 04 section 4] | The author's devices on the same Apple Account |
| Escrow copy of the CCK (Standard mode, the default) | Row in `child_keys` (TDD 02 name; new) | Wrapped by a server key held only as an Edge Function secret (LEGAL-REQ-023) | The `escrow` Edge Function, which re-wraps to the caller's key and never returns plaintext key bytes (TDD 04 3.6.4, D-3); every unwrap is logged (`escrow_unwraps`) and rate limited |
| Listening copy | The phone only | n/a | Never uploaded (ADR 0015 section 5) |
| Letter text | Synced by F16 | Not end-to-end encrypted (ADR 0006 item 5); RLS and Supabase at-rest encryption | Author and book members per F16 |

Honest limit (ADR 0006 consequences; TDD 04 section 2): in Standard mode whoever controls both the escrow secret and the database can decrypt recordings. The Privacy Policy says so plainly.

**Key custody: what the code has today.** Nothing. The only Keychain use is `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` through expo-secure-store (`lib/supabase/secure-storage.ts`, used by the sign-in session and the letter ledger), which cannot sync to iCloud Keychain (ADR 0006 building blocks: expo-secure-store does not expose synchronizable items). ADR 0006 requires one small custom native module for a synchronizable Keychain item; `modules/` holds `scribe-audio`, `scribe-files` and `scribe-store`, none with Keychain code. No AES-GCM library is installed; ADR 0006 names react-native-quick-crypto (MIT), and CryptoKit is already linked by `scribe-audio` [A: AES-GCM through CryptoKit in a native module is the smaller path; WP-F08-B1 decides].

**A. Turn backup on (owner, signed in).**
1. Settings > Storage and backup, row `backup.title` (new): off by default until the person turns it on [R]; turning it on checks `backup_upload` in the plan engine (Plus, section 13 Q2).
2. Turning it on shows one sheet: what is backed up (your recordings, encrypted on this phone first), what is not (listening copies; other family members cannot hear them yet), and the Standard-mode sentence about escrow. One button, `backup.turnOnButton` (new).
3. The app creates or loads the CCK per child, uploads the escrow wrap, then queues one upload job per owned recording, oldest first.
4. Uploads run in the foreground on Wi-Fi by default (the pack engine's mobile-data rule, ADR 0016 section 4.3), never during recording or playback, and resume after a kill from the last finished part [A: Supabase Storage resumable uploads; WP-F08-B1 confirms].
5. The row shows `backup.lastBackedUp` ("Backed up {date}", new) once the queue is empty. No counter of what is left.

**B. Restore on a new phone.**
1. The person installs the app and signs in with the same account (F02). Text and the list of letters arrive through sync (F16).
2. The CCK arrives through iCloud Keychain if the new phone uses the same Apple Account with iCloud Keychain on. If not, the app asks the escrow function after sign-in, which re-wraps the CCK to this device (logged).
3. Recordings download on demand when a letter is opened, and in the background of the open app on Wi-Fi for the rest, each checked against its stored SHA-256 before it replaces the "not on this phone" line.
4. If the phone was also restored from an iCloud device backup, files already in Documents are matched by hash and not downloaded again.

**C. Erase and account deletion.** Erase now and the 30-day purge remove the server object and its `audio_blobs` row through the purge queue (DATA-REQ-011; BL-232 bucket registry, today deferred). Turning backup off asks whether to delete what is already backed up; Yes queues the same deletes; No keeps it until account deletion. Account deletion removes every object, wrap and escrow row (DELETION_AND_EXPORT_SPEC; purge worker).

**Plus or free.** Not decided by a logged decision. D-073 is silent; D-032 (superseded) said full backup is Plus; FUTURE OPEN-02 and G-19 assumed Plus. The code already answers it one way: the plan engine lists `backup_upload` as a gated (Plus) feature and `download_backed_up_audio` and `restore_backup` as free forever (`packages/core/src/plan.ts`, `GATED_FEATURES`, `FREE_FOREVER`). The shipped billing copy lists only "keeping more letters" as Plus and says backup is not listed (`features/billing.en.ts`, D-083), written when backup was not planned for v1.0; it changes with Q2. The server never enforces Plus (D-053, D-080), so the gate is checked on the phone only. Spec default [R]: follow the plan engine, so turning backup on and uploading needs Plus, while restoring and playing what was backed up is never gated, also after a lapse (C-NFR-008). Running cost per family is small either way (TDD 06 4.1: about $22 a month of storage at 10k families after 12 months, about $243 at 100k, plus about $9 a month of restore egress at 100k). F14 owns the Plus copy; the founder confirms (section 13 Q2).

**Cost.** Supabase Pro from $25 a month the day real recordings reach a server (cost decisions 3 Oct; `docs/backlog/future/06-coparent-sharing-v1-1.md`), plus storage at $0.0213 per GB over 100 GB included and egress at $0.09 per GB over 250 GB included (ARCHITECTURE section 7; TDD 06 4.1, 4.2). Audio is 0.48 MB per minute (ADR 0005). The $25 is the decision; storage is noise below 10k families.

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
| F08-U10 | Silent switch on | Letter audio plays (deliberate tap) | Audio plays | n/a | Manual |
| F08-U11 | Co-parent letter, audio on the other phone | No player; `book.recordingElsewhere` | Text plus line | v1.1 shared voice | E2E two fixture devices |
| F08-U12 | Lapsed, signed out, offline | Playback and export work, no Plus UI (LEGAL-REQ-050) | Normal | n/a | E2E lapsed fixture |
| F08-U13 | Phone lost, no backup, no device backup, no export | Audio cannot come back; letter text returns after sign-in if sync was on (F16) | New phone shows letters with `playerCopy.notOnPhone` | Prevention: backup (D-073), keep-safe nudge | DL-03 negative case |
| F08-U14 | Restore from iCloud device backup to a new phone | Files return in Documents; sweep rebases paths by file name; hashes checked; Recently deleted dates kept; letters past day 30 erased at first launch with no orphan reappearing | Recordings play | n/a | DL-03, DL-04 (device) |
| F08-U15 | Letter in Recently deleted, then restored | Recording and copy still present (or copy made again) | Plays | n/a | Unit (exists) |
| F08-U16 | Erase now fails to remove the file | Row stays on the shelf for a retry (`eraseAudioFile` throws) | Letter still listed | Try again | Unit (exists) |
| F08-U17 | Backup upload interrupted (kill, network, Low Power Mode) | Job resumes from the last part; nothing marked backed up until the server confirms the object and its hash | "Backing up" state on the row | Automatic | Kill and airplane tests (device) |
| F08-U18 | New phone without iCloud Keychain, Standard mode | Escrow re-wraps the CCK after sign-in; logged | Recordings arrive | n/a | Two-phone drill with iCloud Keychain off |
| F08-U19 | Escrow unavailable (kill switch, outage) | Restore waits; text still syncs; no partial plaintext anywhere | "Recordings will come back when we can reach them" (new, content to write) | Retry later | Kill-switch test (LEGAL-REQ-040) |
| F08-U20 | Downloaded backup fails its SHA-256 | Discarded; retried once; then listed as not on this phone | `playerCopy.cannotPlay` | Retry | Tampered-object fixture |
| F08-U21 | Owner turns backup off | Asks whether to delete backed-up copies | Sheet | Keep or delete | Unit plus server purge test |
| F08-U22 | Account deleted | Local wipe after one export offer; every server object, wrap and escrow row purged (DATA-REQ-023) | Deletion notice | Export first | F17 E2E |
| F08-U23 | VoiceOver | Play labelled with author and duration (`playerCopy.playA11y`); scrub adjustable; nothing announces during playback | Same | n/a | S1-23 |
| F08-U24 | AX5 and Reduce Motion | Controls stack; times wrap; no animation flourish | Same | n/a | AX5 snapshot |

### 6.7 Copy

| Key | Status | Text |
|---|---|---|
| `book.hearShort`, `book.hearLink`, `book.recordingOnPhone`, `book.recordingElsewhere` | Exist | as in content |
| `playerCopy.*` (`originalLabel`, `originalOn`, `originalOff`, `notOnPhone`, `cannotPlay`, `loading`) | Exist (`packages/content/src/features/player.en.ts`) | as in content |
| `settings.recordings.onPhoneTitle`, `onPhoneBody`, `unplayable*` | Exist; `onPhoneBody` reads "Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own." | Changes only when backup ships, and then only for owners with backup on |
| `settings.export.lastExport`, `neverExported` | Exist (D-085) | as in content |
| `backup.title`, `.turnOnButton`, `.sheetBody`, `.lastBackedUp`, `.offConfirm` | New, content lane writes them | Must say: encrypted on this phone first; only you can play them back in v1.0; the escrow sentence; never that family can listen |
| `recordings.keepSafe.title`, `.body`, `.exportButton` | New | Keep a copy of your voice; "An export keeps every letter and recording in one file you can store anywhere."; Export a copy |

Removed on 4 Oct and not to return until backup ships: `settings.backup.*`, `settingsMore.backupNotYet`, `book.recordingBackedUp`, `errors.backupFailed` (`strings.en.ts` line 1120 note). Never: "lost", "only copy", fear or urgency; "enhanced", "polished", "smart" for the listening copy (content rules).

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source | Built 13 Oct |
|---|---|---|---|---|---|
| F08-REQ-001 | P0 | Original format | Given a finished take, Then the file is AAC-LC, 1 channel, 64 kbps nominal, `.m4a`, 48 kHz (`VOICE_RECORDING_OPTIONS`, `recorder.ts`), confirmed by `ScribeAudio.probe` on device | ADR 0005; ADR 0015 section 5 | Yes in code; device probe owed (S1-10) |
| F08-REQ-002 | P0 | The original is never altered | Given an original with SHA-256 H at capture, When a listening copy is made, the letter is played 10 times, exported, backed up, restored and the app updated, Then its SHA-256 is still H. No code path opens an original for writing | D-058; DATA-REQ-046 | Partly: no writer exists; the cross-step test is not written |
| F08-REQ-003 | P0 | Listening copy is a second file from the original, after the words | Given a saved spoken letter with words and an idle queue in the foreground, Then `listening/<id>.m4a` and its sidecar with the original's SHA-256 exist; the original is the only input | ADR 0015 section 5 | Yes (`audio-enhance`, `transcription-queue`) |
| F08-REQ-004 | P0 | Never during capture or playback | Given recording, Review or playback active, Then no listening copy job starts | ADR 0015 section 5 | Partly: the queue runs it only when idle; a guard against playback is not verified |
| F08-REQ-005 | P0 | Transcription reads the original | Given a letter with both files, When F05 transcribes, Then the input URI is the original | ADR 0015 | Yes |
| F08-REQ-006 | P0, Rev (D-068) | A copy is used only when it matches; no remote flag | Given a sidecar whose hash differs from `audio_sha256`, or a copy at the original's own path, Then the player uses the original (`usableListeningCopy`). Remote config has no listening-copy key (D-068: one config source, `packages/api/src/remote-config.ts`); the copy is made wherever AUSoundIsolation is available | `lib/player/listening.ts` contract | Yes |
| F08-REQ-007 | P0 | Original always one tap away | Given a listening copy in use, Then the Original recording switch is visible and one tap plays the original | D-058 | Yes |
| F08-REQ-008 | P0 | Playback is free in every state | Given Free, trial, Plus, lapsed, offline, signed out, Then play works and no entitlement check runs | PRD-REQ-020; LEGAL-REQ-050; D-083 | Yes (player imports nothing from billing) |
| F08-REQ-009 | P0 | Playback controls | Given a spoken letter on this phone, Then play, pause, elapsed and total time and scrub work; tap to first audio p95 300 ms on SE 3 over 200 runs | COMPONENTS 2.21; TDD 06 2.2 | Partly: no speed control; timing not measured |
| F08-REQ-010 | P0 | Wire the letter view player | Given `letter/[id].tsx` and a spoken letter whose file is on this phone, Then the player renders (no disabled Hear button) | `letter/[id].tsx` | Yes (`AudioPlayer`) |
| F08-REQ-011 | P0 | Audio session for playback | Given play, Then playback mode; Given pause, end, background, unmount, Then idle within 500 ms; interruptions pause and never auto-resume | `audio-mode.ts` | Yes in code; device S1-20 |
| F08-REQ-012 | P0 | Co-parent view | Given a letter by another author whose file is not on this phone, Then no play control renders and `book.recordingElsewhere` shows | D-073; DR-07 | Built, switch off in release profiles |
| F08-REQ-013 | P0 | Where files live | Given iOS, Then originals are in Documents (in device backup); listening copies, models and packs are in Application Support with backup excluded | D-033; ADR 0015; ADR 0016 | Yes; device check S1-25 |
| F08-REQ-014 | P0 | Honest durability copy | Given a build or an owner without backup on, Then no string claims a backup of ours; Given backup on and current, Then the row says when it last finished and nothing promises family listening | D-033; D-073; R-10 | Yes for no-backup copy |
| DATA-REQ-010, DATA-REQ-011 | P0, Rev (D-085) | Audio follows its letter through delete, restore, erase, purge | Given a deleted letter, Then both files remain for 30 days and Restore brings them back. Given Erase now or a tombstone 30 days old at launch, Then the recording and listening copy are removed before the row; a file that will not go keeps the row for a retry; no purge while the clock is earlier than the last launch; no local purge in a sync build | DATA-REQ-010, -011; D-085 | Yes (`store.ts` `eraseEntry`, `purgeExpired`; `capture/erase.ts`); device DL-04, DL-05 |
| F08-REQ-019 | P0 | Playable check after a kill | Given a recovered take that does not load with a duration within 4 s, Then it is kept, marked `unrecoverable`, listed in Settings > Recordings, and not offered on Tonight as ready | D-085 | Yes (`capture/probe.ts`, `sweep.ts`); device DL-01 |
| C-REQ-018 | P0, Rev (D-073) | Keep-safe nudge while backup is off | Given a book with a recording not covered by an export or a current backup, When a month chapter closes, Then one card shows with Export as primary; never twice for a chapter, never a push, never in a session that already showed an ask | C-REQ-018; PRD-REQ-001 | No |
| DATA-REQ-046 | P0 | Integrity scrub | Given the phone charging and the app in the foreground, When 30 days have passed since the last scrub, Then every original is re-hashed; a mismatch is flagged and never deleted | DATA-REQ-046 | No |
| DATA-REQ-050, DATA-REQ-051 | P0 | Export includes the original as-is | Given export (F15), Then each recording is byte-identical with its hash in the manifest; the listening copy is not exported; others' letters carry `audio_missing.reason = "not_on_this_device"` | DATA-REQ-050, -051; `player/listening.ts` | Yes (`export/build.logic.ts` `audioMissingReason`) |
| LEGAL-REQ-014 | P0 | No audio in telemetry | Given the log canary run, Then 0 audio bytes, file names with ids, or durations beyond buckets in logs or analytics | LEGAL-REQ-014 | Partly (canary not built for the app) |
| LEGAL-REQ-022 | P0 | Device protection | Given the audio directory, Then iOS Data Protection is at least complete until first user authentication | LEGAL-REQ-022(b); BL-245 | Entitlement set (commit cf5a4c4); device assertion owed |
| F08-REQ-015 | P1 | Remove listening copies | Given a Remove copies action in Settings > Recordings, Then every listening copy is deleted, originals' hashes are unchanged, and space used drops by the copies' bytes | Storage budget | No |
| F08-REQ-016 | P1 | Low storage | Given free space under 500 MB [A], Then no new listening copy starts | PRD 7.7 | No |
| F08-REQ-017 | P0 | Accessible player | Given VoiceOver, Then play is labelled with the author and duration and scrub is adjustable; Given AX5, Then nothing truncates; Given a voice-only letter, Then a text line says it has no words yet | LEGAL-REQ-051 | Partly; S1-23 |
| F08-REQ-018 | P0, Rev (D-073) | No plaintext audio leaves the phone | Given a full E2E run with backup off, Then the proxy log shows 0 requests carrying audio. Given backup on, Then the only audio bytes are ciphertext uploads to the `entry-audio` bucket (F08-REQ-020) | D-073; B7 | Yes for backup off (no upload code exists) |
| F08-REQ-020 | P0 | Backup encrypts on the phone | Given backup on, When a recording uploads, Then the request body is AES-256-GCM ciphertext under a random per-file key, the AAD binds entry, child and key version, and a proxy capture of the run contains no M4A header (`ftyp`) and no plaintext file key | D-073; ADR 0006; TDD 04 3.6 | No |
| F08-REQ-021 | P0 | Key custody | Given a new child, Then a 256-bit CCK is created on the phone and stored as a synchronizable Keychain item; its escrow wrap is stored server side; Given the escrow function, Then it returns only a re-wrapped key, logs every unwrap, and refuses more than the per-child limit (TDD 04 3.6.4) | ADR 0006; LEGAL-REQ-023 | No |
| F08-REQ-022 | P0 | Owner-only in v1.0 | Given another member of the book, Then no `child_key_grants` row exists and no API returns the owner's wrapped keys or objects to them | D-073 | No |
| F08-REQ-023 | P0 | Restore on a new phone | Given an owner with backup on and 20 recordings, When they sign in on a second iPhone (with and without iCloud Keychain), Then within 10 minutes on Wi-Fi all 20 play and each SHA-256 equals the original's | D-073; BL-284 | No |
| F08-REQ-024 | P0 | Durable erase reaches the backup | Given Erase now or the 30-day purge on a backed-up letter, Then the server object and its wrap are queued for purge and gone within the DELETION_AND_EXPORT_SPEC window | D-085; DATA-REQ-011 | No |
| F08-REQ-025 | P0 | Backup never blocks the phone | Given no network, no sign-in, a full server or a kill switch, Then recording, saving, playback and export work unchanged; uploads wait | PRD 7.4; LEGAL-REQ-040 | No |
| F08-REQ-026 | P0 | Copy never promises family listening | Given every string, listing and web page, Then none says family members can hear recordings in v1.0 (rules test) | D-073 consequences | Yes for today's copy (no backup claims); a rules test for the backup strings is owed |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Original `<file>.m4a` | L4 | App Documents (in the person's iPhone backup) | Author's app | Life of the letter; erased 30 days after delete or on Erase now | Export (share sheet), the person's iPhone backup, and the encrypted backup when on |
| Listening copy `listening/<id>.m4a` and sidecar | L4 (derived from the voice) | Application Support, excluded from backup | Author's app | Deleted with its letter or by the launch sweep | Never |
| `entries.audio_sha256`, `audio_bytes`, `audio_duration_ms` | L4, L2, L2 | Local SQLite | Author | Life of the letter | Hash syncs as author-only working material (TDD 03 4.1) |
| Backup ciphertext | L4 (ciphertext of L4) | Supabase Storage `entry-audio` (new bucket) | Nobody without the CCK | Until erase, backup off with delete, or account deletion | Yes, by design (D-073) |
| `audio_blobs` (wrapped file key, hash, size, key version) | L4 secret wrapped | Postgres (new) | Owner | As the object | Server |
| CCK | L4 secret | Keychain, synchronizable | Owner's Apple devices | Account deletion | iCloud Keychain |
| `child_keys` escrow wrap | L4 secret wrapped | Postgres (new) | Escrow function only | Account deletion | Server |
| `escrow_unwraps` log | L3 | Postgres (new) | Ops | 12 months (TDD 04 X-8) | Server |
| Settings `player.original`, `lastExportedAt` | L2 | Local settings | App | Install | Never |

New tables, bucket and the Keychain item need rows in `docs/legal/DATA_CLASSIFICATION.md` in the same pull request (DATA-REQ-001). The Privacy Policy, privacy labels and subprocessor page today say recordings are not uploaded (`pages.en.ts` line 71); they change in the same release as backup, with counsel (LEGAL-REQ-045 claims registry).

## 9. Non-functional requirements

| Area | Budget | Gate | How measured |
|---|---|---|---|
| Local playback start | p95 300 ms [R] | Yes | Perf build, 200 samples on SE 3 |
| Storage per audio minute | Original 0.48 MB; listening copy about the same (AAC at the original's settings) [A] | n/a | File sizes |
| Listening copy, 2-minute letter | Unmeasured; ADR 0015 lists the offline render as a device item | Measure | S1-19 |
| Backup upload, 2-minute letter on Wi-Fi | 10 s or less [A] | No | Device run |
| Restore, 20 recordings on Wi-Fi | 10 minutes or less (F08-REQ-023) | Yes for backup | Two-phone drill |
| Encryption cost | 1 s or less per 10 MB on SE 3 [A] | No | Device run |
| Binary size | Speech and audio area about 1 MB (ADR 0015 section 6, E); a Keychain module plus crypto adds under 1 MB [A] | Yes for the 40 MB total | IPA size check (TF-01) |
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

All opt-in, L2 only.

## 11. How we build it (with the architect)

### 11.1 Components and status (13 Oct 2026)

| Part | File | Status |
|---|---|---|
| Recorder settings, 48 kHz | `apps/mobile/src/lib/capture/recorder.ts` | Built |
| Player and version choice | `apps/mobile/src/components/player/audio-player.tsx`, `lib/player/` (`listening.ts`, `player.logic.ts`, `use-letter-player.ts`) | Built (no speed control) |
| Listening copy | `apps/mobile/src/lib/audio-enhance/index.ts`; native `enhance` in `modules/scribe-audio` | Built; AUSoundIsolation offline render unverified on device (ADR 0015 section 9 item 4) |
| Erase and purge | `apps/mobile/src/lib/capture/erase.ts`, `store.ts` (`eraseEntry`, `purgeExpired`, `recordLaunch`), `lib/shelf-days.ts` | Built (D-085) |
| Playability probe | `apps/mobile/src/lib/capture/probe.ts` | Built (D-085) |
| Recently deleted | `apps/mobile/src/app/settings/recently-deleted.tsx`, `components/book/shelf.logic.ts`, `confirm-sheet.tsx` | Built (D-085) |
| Settings > Recordings | `apps/mobile/src/app/settings/recordings.tsx` | Built |
| Keep-safe card | `apps/mobile/src/components/book/keep-safe-card.tsx` | Not built |
| Synchronizable Keychain module | `apps/mobile/modules/scribe-keys/` (new) | Not built (ADR 0006) |
| File encryption | the same module (CryptoKit AES-GCM) or react-native-quick-crypto | Not built; WP-F08-B1 chooses |
| Backup queue | `apps/mobile/src/lib/backup/` (new), reusing the sync outbox ordering rules | Not built |
| Server: bucket, `audio_blobs`, `child_keys`, `escrow_unwraps`, policies | `supabase/migrations/<new>_audio_backup.sql`, `supabase/tests/` | Not built |
| Escrow function | `supabase/functions/escrow/` (new), ADR 0017 envelope and logs | Not built |
| Purge coverage for `entry-audio` | `supabase/functions/purge-worker/lib/buckets.ts` (`since: 'v1.1'` today), BL-232 | Listed, not active |

### 11.2 Riskiest unknowns and the spikes

1. **Device behaviour of what is built** (S1-19, S1-20, S1-25, DL-01 to DL-05): AUSoundIsolation output, playback interruptions, Documents in iCloud backup, kill-during-record playability.
2. **Backup feasibility in the time left.** Spike WP-F08-B1: a synchronizable Keychain item from an Expo local module on SE 3 and a current iPhone, create, read on a second device on the same Apple Account, delete; AES-GCM throughput; a resumable upload of a 15 MB file to Supabase Storage. FUTURE OPEN-02 estimated backup and restore at 3 to 4 person-weeks [E]; feature freeze is Mon 26 Oct (ROADMAP 2.1).

### 11.3 Sequencing

Section 13 Q1 is answered (D-073, M14): backup is v1.0. It needs everything server features need first: sign-in, the production Supabase project on Pro, the security fixes before anyone signs in (BL-330, BL-347, BL-322, BL-331), deletion with Apple token revocation, and counsel on the changed privacy statements. WP-F08-B1 spike this week, then B2 to B6 in parallel lanes, with B6 the release gate. The 26 Oct freeze is at risk (09 R-16); `08-delivery.md` re-plans the date.

## 12. Work packages

Status is what `develop` holds on 13 Oct 2026. "Device" names the run in `docs/qa/DEVICE_TEST_PLAN.md`.

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|
| WP-F08-01 | Device checks of the built audio path: 48 kHz probe, listening copy by ear, playback interruptions, kill runs | `docs/qa/evidence/` | first dev build (FT-17) | S1-10, S1-19, S1-20, DL-01, DL-02 rows recorded | human (QA engineer, founder) | Not run | S1-10, S1-19, S1-20, DL-01, DL-02 |
| WP-F08-02 | File locations and honest copy | `apps/mobile/src/app/settings/recordings.tsx`, `packages/content` | D-033 | `[F08-REQ-013]`, `[F08-REQ-014]` | agent | Built | S1-25 |
| WP-F08-03 | Shared player, letter view, Review, co-parent line, version choice | `apps/mobile/src/components/player/`, `apps/mobile/src/lib/player/` | none | `[F08-REQ-006]` to `[F08-REQ-012]`, `[F08-REQ-017]` | agent | Built except speed control and the 300 ms measurement | S1-20, S1-23 |
| WP-F08-04 | Listening copy job | `apps/mobile/src/lib/audio-enhance/`, `modules/scribe-audio` | BL-140 | `[F08-REQ-002]` to `[F08-REQ-005]`; kill test 50 of 50 | agent plus device check | Built; device check owed | S1-19 |
| WP-F08-05 | Delete, shelf, erase, purge, playable check (D-085) | `apps/mobile/src/lib/capture/erase.ts`, `probe.ts`, `store.ts`, `app/settings/recently-deleted.tsx` | none | `[DATA-REQ-011]`, `[F08-REQ-019]`; `apps/mobile/test/store.shelf.test.ts` | agent | Built | DL-04, DL-05 |
| WP-F08-06 | Keep-safe card | `apps/mobile/src/components/book/keep-safe-card.tsx` (new) | F15 entry, ask sequencer | `[C-REQ-018]` | agent | Not built | none |
| WP-F08-07 | Integrity: original-unaltered test across copy, play, export, update; monthly scrub | `apps/mobile/src/lib/audio/scrub.ts` (new), `apps/mobile/test/` | WP-F08-04 | `[F08-REQ-002]`, `[DATA-REQ-046]` | agent | Not built | none |
| WP-F08-08 | Analytics | `packages/analytics/src/catalog.ts` | none | Catalogue tests | agent | Partly: `playback_started.version` exists; `playback_failed`, backup events not | none |
| WP-F08-B1 | Spike: synchronizable Keychain module, AES-GCM choice and speed, resumable upload | `apps/mobile/modules/scribe-keys/` (new, spike branch), `docs/qa/evidence/` | none (Q1 answered by M14) | Keychain item created on phone A appears on phone B (same Apple Account) and deletes from both; 15 MB encrypt time on SE 3; upload resumes after a kill | pair (mobile engineer, security) | Not built | Two iPhones, one Apple Account |
| WP-F08-B2 | Key hierarchy on the phone: CCK per child, file keys, wrap and unwrap, AAD | `apps/mobile/modules/scribe-keys/`, `apps/mobile/src/lib/backup/keys.ts` (new) | WP-F08-B1 | `[F08-REQ-020]`, `[F08-REQ-021]` device part; unit tests for AAD binding and wrong-key refusal | agent plus device check | Not built | Two iPhones |
| WP-F08-B3 | Server: bucket, `audio_blobs`, `child_keys`, `escrow_unwraps`, RLS, purge registry | `supabase/migrations/<new>_audio_backup.sql`, `supabase/tests/`, `supabase/functions/purge-worker/lib/buckets.ts` | data architect, `approve-migration` | `[F08-REQ-022]`, `[F08-REQ-024]` in `npm run test:db` and `npm run test:functions` | agent, `approve-migration` | Not built | none |
| WP-F08-B4 | Escrow Edge Function | `supabase/functions/escrow/` (new) | WP-F08-B3, ADR 0017 | `[F08-REQ-021]` server part: re-wrap only, log row per unwrap, rate limit, kill switch | agent, security review | Not built | none |
| WP-F08-B5 | Backup queue, Settings row, turn on and off, restore on a new phone | `apps/mobile/src/lib/backup/` (new), `apps/mobile/src/app/settings/storage.tsx` (backup row), content strings | WP-F08-B2, B3, B4; F02 sign-in on | `[F08-REQ-023]`, `[F08-REQ-025]`, `[F08-REQ-026]` | agent | Not built | Restore drill |
| WP-F08-B6 | Restore drill and release gate | `docs/qa/evidence/` | WP-F08-B5 | 20 of 20 recordings restored with equal hashes, with and without iCloud Keychain; erase reaches the server | human (QA engineer, founder) | Not run | DL-03 extended, two iPhones |

## 13. Open questions and assumptions

| # | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | **D-073 versus the on-device v1.0.** Answered by M14 (founder, 13 Oct 2026): server features are on for v1.0, so D-073 stands and backup ships in v1.0 with sign-in, sync, the production database on Supabase Pro ($25 a month), the four security fixes and counsel on the privacy pages. The 26 Oct freeze is at risk (OPEN-02: 3 to 4 person-weeks [E]; 09 R-16). Still owed: mark D-085's "Amends D-073 for v1.0" clause (logged on `origin/develop`, feaffb3) as reversed by M14, and update ROADMAP 2.1 and `packages/content` (`reviews/STALE-OUTSIDE-PRD.md`) | Founder (decided) | n/a | WP-F08-B1 to B6 are v1.0; F02, F16, F17; ROADMAP |
| Q2 | Backup upload Plus (as `plan.ts` gates it) or free, and on or off by default. Spec default [R]: upload is Plus, restore and playback never gated, off until the owner turns it on | Founder; F14 for copy | 16 Oct | F14 copy; section 6.5 |
| Q3 | DR-09 named RNNoise; the code uses AUSoundIsolation (ADR 0015 section 5). Confirm and close DR-09 | Founder | 30 Oct | 09 DR-09 |
| Q4 | Privacy label and Privacy Policy: audio is declared for v1.0 (Q1 answered: backup uploads encrypted audio) | Counsel, F21 owner | 20 Nov | `app-store-privacy-labels.md`, PrivacyInfo |
| Q5 | Standard mode only at v1.0, Vault mode later (T5-06)? Spec default: yes | Founder | 16 Oct | Section 4 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | iCloud device backup includes Documents | DL-03, S1-25 |
| A2 | A synchronizable Keychain item from an Expo local module syncs within minutes on the same Apple Account | WP-F08-B1 |
| A3 | Supabase Storage resumable uploads work from React Native for 15 MB files | WP-F08-B1 |
| A4 | 80% wet keeps a baby's sounds audible | S1-19 by ear |

## 14. Sources

- Decisions: `docs/DECISIONS.md` D-032, D-033, D-053, D-058, D-059, D-061, D-073, D-080, D-083 (via `features/billing.en.ts`); `_AUTHORING.md` 3b M7, M11, M13; D-085 from commit 6482cd3 and `packages/content/src/strings.en.ts` comments.
- ADRs and design: `docs/adr/0005-audio-format.md`; `docs/adr/0006-encrypted-backup.md`; `docs/adr/0015-per-language-speech-models.md` sections 5, 6, 9; `docs/adr/0016-lean-app-and-server-driven-content.md` section 4.3; `docs/adr/0017-api-standards.md`; `docs/tdd/04-security-identity.md` sections 1.3, 2, 3.6 to 3.8, 4; `docs/tdd/06-performance-reliability.md` sections 2.2, 4.1, 4.2; `docs/ARCHITECTURE.md` section 7; `docs/design/COMPONENTS.md` 2.21.
- Plans: `docs/ROADMAP.md` 2.1 sections 0, 6, 7; `docs/backlog/FUTURE.md` OPEN-02, T5-06; `docs/backlog/future/06-coparent-sharing-v1-1.md`; `docs/agents/DEBATES.md` Q-010; `docs/BACKLOG.md` BL-232, BL-284, BL-306; `docs/qa/DEVICE_TEST_PLAN.md` S1-10, S1-19, S1-20, S1-23, S1-25, DL-01 to DL-05; claude.ai Project doc `infra/cost-decisions-2026-10-03.md`.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -019, -022, -023, -040, -045, -050, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ-010, -011, -023, -046, -050, -051, -055; keys row); `docs/legal/DATA_CLASSIFICATION.md`.
- Code read 13 Oct 2026 on `develop`: `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/eas.json`, `lib/capture/recorder.ts`, `erase.ts`, `probe.ts`, `lib/audio-enhance/index.ts`, `lib/player/listening.ts`, `components/player/audio-player.tsx`, `lib/store.ts`, `lib/supabase/secure-storage.ts`, `lib/billing/letter-ledger.native.ts`, `app/settings/recordings.tsx`, `recently-deleted.tsx`, `export.tsx`, `modules/scribe-audio/ios/ScribeAudioModule.swift`, `lib/export/build.logic.ts`; `packages/content/src/strings.en.ts`, `features/player.en.ts`, `features/billing.en.ts`, `pages.en.ts`, `site.en.ts`; `packages/analytics/src/catalog.ts`; `supabase/migrations/*` (no audio bucket); `supabase/functions/purge-worker/lib/buckets.ts`.
- Research: R1 section 0 item 6, F08 table (R1-S3, R1-S4, R1-S6, R1-S13, R1-S14, R1-S15, R1-S54, R1-S60, R1-S64, R1-S67); R2 section 0 item 5; CR section 4.
