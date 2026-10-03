# F08 Recordings: original, listening copy, playback, durability

| | |
|---|---|
| Release | v1.0 gate (listening copy ships behind a flag, on only if its listening test passes) |
| Priority and rank | P0, rank 4 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P4 Multilingual family, P6 Future reader |
| Existing IDs | C-REQ-017, C-REQ-018, PRD-REQ-020 (playback always free), LEGAL-REQ-014, LEGAL-REQ-022, LEGAL-REQ-050, DATA-REQ-010, DATA-REQ-011, DATA-REQ-046, DATA-REQ-048, DATA-REQ-050, DATA-REQ-051, DATA-REQ-055, D-032, D-033, DR-07, DR-09, R-10, R-11, BL-134, BL-140, BL-150, BL-205, BL-245, BL-284 |
| Depends on | F04 (capture writes the original), F05 (transcription reads the original), F09 (letter view and book), F15 (export), F16 (sync of the audio flag), F17 (Settings > Recordings, deletion), F19 (remote config flag) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64), and QR codes to audio in printed books are the category's most emotional praise (R2 section 0 item 5; CR section 4).
- [F] Keeping and playing the original is table stakes among voice products: Remento keeps recordings downloadable at any time, and Day One keeps audio playable on every tier after a subscription ends (R1-S13, R1-S60).
- [F] Apple Voice Memos offers one-tap Enhance to reduce background noise (R1-S64). Nobody we found keeps a cleaned copy beside an untouched original (R1 F08 opportunity).
- [D] The original recording is never altered; a cleaner listening copy is allowed; the person can always hear the original (B6). DR-09 default A: record unprocessed, make the listening copy after save, on the phone, with RNNoise.
- [D] No audio upload in v1.0 (B7). A co-parent cannot hear the other parent's recordings; only the author's phone holds the audio (DR-07 default A).
- [F] The free durability floor is the phone, the user's own iCloud device backup and export (D-033, recommended). Today's copy `settings.recordings.onPhoneBody` says recordings live only on this phone, which is wrong when device backup is on (TDD 10 risk 8, contradiction 10; R-10).
- [F] Playback in the letter view is not wired: the Hear button renders disabled (`apps/mobile/src/app/letter/[id].tsx`). Only Review has a mini player (`review.tsx`, `useAudioPlayer`). Deleting a letter tombstones the row and never removes its file (`store.ts` `deleteEntry`); the launch sweep treats tombstoned files as claimed (`sweep.logic.ts`).

## 2. Who

| Persona | Moment | What F08 must do |
|---|---|---|
| P1 Evening parent | Listens back in Review at night, later replays old letters | Play in one tap, quietly, with the original always one tap away. Never lose the file |
| P2 Co-parent | Opens a letter the other parent spoke | Read it, and see plainly that the voice is on the other parent's phone (DR-07). No dead play button |
| P4 Multilingual family | The recording is the safety net when transcription is weak (DR-01) | Audio kept in full whatever the transcript quality; playback needs no language support |
| P6 Future reader | Years later, from an export, with no app | Byte-identical original M4A that plays in any browser (DATA-REQ-055) |

## 3. What we are solving

**Outcome.** Every recording stays exactly as it was captured, plays in one tap on the author's phone for free forever, and the family is told honestly where it lives and how to keep a copy.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Originals altered | Zero (gate) | SHA-256 at capture equals SHA-256 after listening copy, playback and export (WP-F08-07) | Lab |
| Recordings lost on this phone | Zero (gate) | Kill runs (F04), durability drill BL-284, support tickets | Lab and support |
| Local playback start | p95 300 ms tap to first audio on SE 3 [R] (TDD 06 section 2.2) | Perf build marker | Lab |
| Listening test preference | Listening copy preferred over the original in 60% or more of blind trials with 0 trials where babble or singing is judged damaged [A] | R5 section 8.2 test, 20 clips, 5 listeners | Lab |
| Playback failures | Under 0.5% of play taps on local files | `playback_failed` over `playback_started` | Opt-in only |
| Export on hand for recordings | Watched | `export_completed{format}` after the keep-safe card | Opt-in only |

## 4. Scope

**In v1.0**
- The original: AAC-LC, mono, 64 kbps, M4A (ADR 0005), stored once, never re-encoded or edited.
- Recording sample rate moves from 44.1 kHz to 48 kHz if WP-F08-01 confirms the encoder accepts it (R5 section 5.3; ADR 0005 allows either).
- The listening copy: made on the phone after save, from the original, with RNNoise; a second M4A; behind remote config flag `listening_copy_enabled`.
- Playback of a single letter in Review and the letter view: play, pause, scrub, speed, Original switch. Always free.
- Where files live, and honest durability copy (D-033).
- Keep-safe nudge (C-REQ-018) pointing to export and device backup.
- Deletion of audio with its letter, a 30-day Recently deleted window, then removal of both files.
- Co-parent view of the other parent's letters (DR-07 A).
- Storage budget, low-storage path, removing listening copies to free space.
- Integrity: hashes, monthly scrub, export hand-off to F15.

**Later**
| Item | Release | Why later |
|---|---|---|
| Shared voice: encrypted upload so a co-parent can hear (F31) | v1.1 | B7, DR-07 |
| Encrypted cloud backup and restore (Plus) | v1.1 | B7, DR-08 |
| DeepFilterNet 3 as the denoiser | Only if it beats RNNoise in the test and the founder accepts the maintenance risk | Last release Aug 2024 fails the 12-month rule (R5 section 5.2, K9) |
| Lossless or Opus archival export | v1.x | ADR 0005 consequences |
| QR codes to audio in a printed book | Later (F42) | Print is later (K-32) |
| Now Playing and lock-screen controls | Later | COMPONENTS 2.21 marks them deferred |

**Never**
- Any change to the original's bytes: trimming, gain, denoise, re-encode, metadata rewrite (B6).
- Voice processing at capture (DR-09 A).
- Replacing the original with the listening copy, anywhere, including export.
- Speaker identification or voiceprints from recordings (LEGAL-REQ-019).
- Audio in analytics, logs, crash reports or URLs (LEGAL-REQ-014).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Recordings kept and downloadable at any time; QR codes in printed stories play the original [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | Voice is the emotional core [S] R2 section 0 item 5 | **Match** original always available |
| Day One | Playback on every tier, including after a subscription ends; recording needs a paid tier [F] R1-S60 | 4.8 (118K) [F] R1-S6 | n/a | **Match** playback free forever, and recording free too |
| Apple Voice Memos | One-tap Enhance reduces noise and echo [F] R1-S64 | 4.8 (1.1M) [F] R1-S64 | n/a | **Innovate**: the clean version is a separate copy; the original stays |
| Dearest | Voice memories; full ZIP export [F] R1-S3 | 5.0 (1) | n/a | **Match** ZIP with audio (F15) |
| Tiny Treasures | Exports audio files for offline keeping [F] R1-S67 | 5.0 (7) | n/a | **Match** |
| FirstChapter | Privacy label lists audio as data linked to the user, so audio leaves the phone [F] R1-S4 | n/a | n/a | Contrast: v1.0 audio stays on the author's phone (B7) |
| Storyworth | Voice-recorded calls on higher tiers [F] R1-S14 | 4.7 Trustpilot [F] R1-S54 | n/a | Whether audio is kept for playback: Unverified |

Durability is our weak point: Day One, Voice Memos and the iCloud apps back up audio and v1.0 does not (R1 F08). We say so plainly and point to export and device backup.

## 6. Experience

### 6.1 Entry points

| Entry | Where | What plays |
|---|---|---|
| Hear it (`review.playButton`) | Review, before save | The original (no listening copy exists yet) |
| Hear {signsAs} (`book.hearShort`) | Letter view, own letter or one recorded on this phone | Listening copy if ready and the flag is on, else the original |
| Letter card play cue | Book list (`components/book/letter-card.tsx`) | Opens the letter view; the card is one element, not a play control |
| Read together | F10 | F10 picks the version with the same rule |
| Settings > Recordings | F17 shell, this spec's rows | Where recordings live, space used, Remove listening copies, recordings without a letter |

### 6.2 Happy paths

**A. Play a letter.**
1. Person opens a spoken letter. The player shows play, elapsed and total time, a scrub bar and a speed button (COMPONENTS 2.21). Below it: `book.recordingOnPhone` (revised text, section 6.4).
2. Taps play. `setAudioMode('playback')`; playback starts within 300 ms; no haptic (MOTION section 6).
3. If a listening copy is playing, a small switch reads `recordings.originalSwitch` (new). Tapping it switches to the original at the same position. The choice is remembered per device (`playback.preferOriginal`).
4. On pause, end or leaving the screen, the mode returns to `idle`.

**B. Listening copy made after save.**
1. Letter saved (F04, F06). F05 transcribes from the original first.
2. When the transcription queue is idle, the app is in the foreground, and the phone is charging or above 30% battery (TDD 01 section 3.6), a job decodes the original, runs RNNoise at 48 kHz, encodes AAC-LC mono 64 kbps, writes `<entry_id>.listen.m4a.part`, hashes it, renames it and records it on the entry.
3. Nothing is shown during the job. Next playback uses the copy.

**C. Co-parent opens the other parent's letter (DR-07 A).**
1. The letter text shows as written.
2. Instead of a player: `book.recordingElsewhere` ("Recording kept on {signsAs}'s phone"), with no disabled button.

**D. Keep-safe nudge (C-REQ-018).**
1. Settings > Recordings shows `settings.recordings.onPhoneTitle` and the revised body, plus Export everything (F15).
2. When a month chapter closes for a book with at least one recording on this phone not covered by an export since, the Book shows one soft card `recordings.keepSafe.title`, `.body`, primary `recordings.keepSafe.exportButton`, quiet `common.notNowButton`. At most once per chapter, never during capture, review or export (PRD-REQ-001), never a push.

**E. Delete a letter with audio.**
1. Delete, confirm (`settings.delete.entryTitle`, `.entryBody`). Tombstone; letter leaves the Book; files stay.
2. Restore within 30 days brings back the letter and its audio.
3. After 30 days (server `deleted_at` when synced, local time when never synced), the launch sweep deletes the original, the listening copy and their rows' file references (DATA-REQ-011).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F08-U01 | Original file missing at play | No crash; `missing-audio` counted by the sweep; row unchanged | `recordings.missingBody` (new) | Restore from device backup (outside the app) | Unit with a removed file |
| F08-U02 | Original hash mismatch (scrub or before transcription) | Flag only; never delete or rewrite; export marks `integrity: "mismatch"` (DATA-REQ-046, -051) | Plays as normal | None at v1.0 (no cloud copy) | Flipped-byte fixture |
| F08-U03 | App killed while making a listening copy | `.part` file deleted on next launch; job requeued; original untouched | Nothing | Job reruns | Kill test, 50 iterations |
| F08-U04 | Listening copy fails (decode, encode, RNNoise error) | Job marked failed after 2 tries; playback uses the original | Original plays | Retry on next app version | Unit with a throwing fake |
| F08-U05 | Listening copy judged worse by the person | Original switch; preference remembered | Original plays | Switch back any time | Component test |
| F08-U06 | Denoiser removes babble or singing (R5 section 5.3, Inferred risk) | Listening test gates the flag; original always one tap away | Original switch | Switch | R5 section 8.2 test includes babble and singing |
| F08-U07 | Free space under 500 MB [A] | No new listening copies | Settings shows space used and Remove listening copies | Remove copies; export | Fake free-space reader |
| F08-U08 | Person taps Remove listening copies | Deletes every `.listen.m4a`, clears the column; originals untouched | Space freed line | Copies regenerate only after free space is back above 1 GB | Unit; hash of originals unchanged |
| F08-U09 | Call, Siri or alarm during playback | Playback pauses; never auto-resumes | Paused player | Tap play | Manual script |
| F08-U10 | AirPods disconnect during playback | Playback pauses [A] | Paused player | Tap play | Manual script |
| F08-U11 | App backgrounded during playback | Pause; `idle` mode (`shouldPlayInBackground: false`, `audio-mode.ts`) | Paused on return | Tap play | E2E |
| F08-U12 | Silent switch on | Letter audio plays (`playsInSilentMode: true` in playback mode) because playing is a deliberate tap | Audio plays | n/a | Manual |
| F08-U13 | Co-parent letter, audio on the other phone | No player; `book.recordingElsewhere` | Text plus line | v1.1 shared voice | E2E two fixture devices |
| F08-U14 | Lapsed, signed out, offline | Playback and export work, no Plus UI (LEGAL-REQ-050) | Normal | n/a | E2E lapsed fixture |
| F08-U15 | Phone lost, no device backup, no export | Audio cannot come back; letter text returns after sign-in on a new phone (F16) | New phone shows letters with `recordings.notOnThisPhone` (new) | Prevention only: keep-safe nudge | Durability drill BL-284 |
| F08-U16 | Restore from iCloud device backup to a new phone | Files return in Documents; sweep rebases paths by file name; hashes checked | Recordings play | n/a | BL-284 |
| F08-U17 | Letter in Recently deleted, then restored | Both files still present | Plays | n/a | Unit |
| F08-U18 | Recording without words (voice-only letter) | Plays; text alternative says so (TDD 09 A11Y-F19) | `pendingCopy.book.waitingForWords` above the player | Type the words (F06) | Component test |
| F08-U19 | VoiceOver | Play labelled "Play {signsAs}'s voice, {duration}"; scrub bar adjustable in 5 s steps (COMPONENTS 2.21); nothing announces during playback | Same | n/a | VoiceOver script |
| F08-U20 | AX5 and Reduce Motion | Controls stack; times wrap; progress fill linear with no animation flourish | Same | n/a | AX5 snapshot |
| F08-U21 | Thermal serious or Low Power Mode | Listening copy jobs wait; playback unaffected | Nothing | Job later | Unit (queue gate) |
| F08-U22 | Account deleted on another device | Local wipe after one export offer, audio included (DATA-REQ-023) | Deletion notice | Export first | F17 E2E |

### 6.4 Copy

| Key | Status | Proposed text |
|---|---|---|
| `review.playButton` | Exists | Hear it |
| `book.hearShort`, `book.hearLink` | Exist | as in content |
| `book.recordingOnPhone` | Revise (D-033) | Recording on this phone |
| `book.recordingElsewhere` | Exists | Recording kept on {signsAs}'s phone |
| `settings.recordings.onPhoneTitle` | Exists | Kept on this phone |
| `settings.recordings.onPhoneBody` | Revise (D-033, R-10) | Recordings stay on this phone and in your iPhone's own backup, if you use one. Export a copy now and then to keep one somewhere else too. |
| `settings.recordings.keepHelp` | Exists | as in content |
| `settings.recordings.storageUsed` | Exists | {count} MB used on this phone |
| `settings.backup.*`, `settingsMore.backupNotYet` | Hide at v1.0 | Backup is v1.1 (B7); no disabled button for it |
| `errors.storageLow.body` | Revise (shared with F04) | as in F04 section 6.4 |
| `recordings.originalSwitch` | New | Original |
| `recordings.listeningLabel` | New | Easier to hear |
| `recordings.removeCopiesButton` | New | Remove copies |
| `recordings.removeCopiesHelp` | New | Frees space. Your original recordings stay exactly as they are. |
| `recordings.missingBody` | New | This recording is not on this phone right now. |
| `recordings.notOnThisPhone` | New | Recording kept on the phone it was made on |
| `recordings.keepSafe.title` | New | Keep a copy of your voice |
| `recordings.keepSafe.body` | New | Your recordings are on this phone. An export keeps every letter and recording in one file you can store anywhere. |
| `recordings.keepSafe.exportButton` | New | Export a copy |

Never: "lost", "only copy", fear or urgency (content rules). `recordings.listeningLabel` must pass the AI-words rule (no "enhanced", "polished", "smart").

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source |
|---|---|---|---|---|
| F08-REQ-001 | P0 | Original format | Given a finished take, Then the file is AAC-LC, 1 channel, 64 kbps nominal, `.m4a`, sample rate 48 kHz (or 44.1 kHz if WP-F08-01 fails), probed by `scribe-audio-decode.probe` | ADR 0005; R5 sections 5.3, 6 |
| F08-REQ-002 | P0 | The original is never altered (B6) | Given an original with SHA-256 H at capture, When a listening copy is made, the letter is played 10 times, exported, and the app updated, Then its SHA-256 is still H. No code path opens an original for writing (lint: original URIs only passed to read, play, hash, copy-to-export) | B6; DATA-REQ-046 |
| F08-REQ-003 | P0 | Listening copy is a second file from the original, after save | Given a saved spoken letter and the flag on, When the queue is idle, foreground, and charging or above 30% battery, Then `<entry_id>.listen.m4a` is written via `.part` and rename, hashed, and recorded on the entry; the original is the only input | DR-09 A; R5 section 5.3 |
| F08-REQ-004 | P0 | Never during capture or playback | Given recording, Review or playback active, Then no listening copy job runs; a running job aborts at the next 1 s block | TDD 01 section 3.6; SOUND.md |
| F08-REQ-005 | P0 | Transcription reads the original | Given a letter with both files, When F05 transcribes, Then the input URI is the original | R5 section 5.3 item 3 |
| F08-REQ-006 | P0 | Listening copy gated by test and flag | Given `listening_copy_enabled = false` (default until the R5 section 8.2 test passes), Then no copy is made and playback uses originals. Flipping it off makes playback use originals within one config refresh; existing copies stay until removed | DR-09; LEGAL-REQ-040 pattern |
| F08-REQ-007 | P0 | Original always one tap away | Given a listening copy playing, Then `recordings.originalSwitch` is visible; one tap switches at the same position within 300 ms | B6; 03 principle 5 |
| F08-REQ-008 | P0 | Single-letter playback is free in every state | Given Free, trial, Plus, lapsed, offline, signed out, Then play works and no entitlement check runs (code search: player imports nothing from plans) | PRD-REQ-020; LEGAL-REQ-050 |
| F08-REQ-009 | P0 | Playback controls | Given a spoken letter on this phone, Then play and pause, elapsed and total time, scrub, speed (1, 1.25, 1.5, 0.75) work; tap to first audio p95 300 ms on SE 3 over 200 runs | COMPONENTS 2.21; TDD 06 section 2.2 |
| F08-REQ-010 | P0 | Wire the letter view player | Given `letter/[id].tsx`, Then the disabled Hear button is replaced by the player for letters whose file exists on this phone | `letter/[id].tsx` |
| F08-REQ-011 | P0 | Audio session for playback | Given play, Then mode `playback` (`doNotMix`, plays in silent mode); Given pause, end, background, unmount, Then `idle` within 500 ms; interruptions pause and never auto-resume | `audio-mode.ts` |
| F08-REQ-012 | P0 | Co-parent view (DR-07 A) | Given a letter by another author whose file is not on this phone, Then no play control renders and `book.recordingElsewhere` shows with the author's signature | DR-07; B7 |
| F08-REQ-013 | P0 | Where files live | Given iOS, Then originals and listening copies are in a directory included in device backup (Documents today), and model files are in Application Support with backup excluded (`model-files.ts`). A test reads `isExcludedFromBackup` on both | D-033; ADR 0001; TDD 10 risk 8 |
| F08-REQ-014 | P0 | Honest durability copy | Given Settings > Recordings at v1.0, Then the body is the revised `settings.recordings.onPhoneBody`; no backup toggle or "backup arrives" line renders; the claims registry lists the sentence (LEGAL-REQ-045) | D-033; R-10 |
| C-REQ-018 | P0, Rev (B7) | Keep-safe nudge points to export and device backup, not cloud backup | Given a book with at least one recording on this phone and no export since its newest recording, When a month chapter closes, Then one card shows with Export as primary; it never shows twice for the same chapter, never as a push, never in a session that already showed an ask | C-REQ-018; PRD-REQ-001 |
| DATA-REQ-010, DATA-REQ-011 | P0 | Audio follows its letter through delete, restore, purge | Given a deleted letter, Then both files remain for 30 days and restore brings them back. Given a tombstone older than 30 days, When the app launches, Then both files are deleted before any UI shows them. Given a never-synced letter, Then the 30 days run on local time | DATA-REQ-010, -011; BL-134 |
| F08-REQ-015 | P0 | Remove listening copies | Given Remove copies, Then every listening copy is deleted, originals hash unchanged, and space used drops by the copies' total bytes | B6; storage budget |
| F08-REQ-016 | P0 | Low storage | Given free space under 500 MB [A], Then no new listening copy starts; Given under 1 GB, Then Settings shows space used and Remove copies first | PRD 7.7 |
| DATA-REQ-046 | P0 | Integrity scrub | Given the phone charging and the app in the foreground, When 30 days have passed since the last scrub, Then every original and copy is re-hashed; a mismatch is flagged, counted and never deleted | DATA-REQ-046 |
| DATA-REQ-050, DATA-REQ-051 | P0, Rev (B6) | Export includes the original as-is | Given export (F15), Then `audio/<entry_id>.m4a` is byte-identical to the original with its hash in the manifest; a listening copy, if present, is `audio/<entry_id>.listening.m4a`, also hashed; README says which is which; letters by others whose audio is not here carry `audio_missing.reason = "not_on_this_device"` | DATA-REQ-050, -051; R5 section 5.3 item 5 |
| LEGAL-REQ-014 | P0 | No audio in telemetry | Given the log canary run, Then 0 audio bytes, file names with ids, or durations beyond buckets in logs or analytics | LEGAL-REQ-014 |
| LEGAL-REQ-022 | P0 | Device protection | Given the audio directory, Then iOS Data Protection is at least complete until first user authentication (BL-245 assertion) | LEGAL-REQ-022(b) |
| F08-REQ-017 | P0 | Accessible player | Given VoiceOver, Then play is labelled with the author and duration; scrub is adjustable in 5 s steps; nothing else announces while audio plays. Given AX5, Then nothing truncates. Given a voice-only letter, Then a text line says it has no words yet | LEGAL-REQ-051; TDD 09 A11Y-F19 |
| F08-REQ-018 | P0 | No audio upload | Given any v1.0 build, When a full E2E run executes, Then the proxy log shows 0 requests carrying audio | B7 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Original `<entry_id>.m4a` | L4 | App Documents (backed-up directory, D-033); TDD 03 proposes `Application Support/audio/`, also backed up, not visible in Files: architect decides in WP-F08-02 | Author's app | Life of the letter; purged 30 days after delete | Only via the person's share sheet in export, and in their own device backup |
| Listening copy `<entry_id>.listen.m4a` | L4 (derived from content) | Same directory | Author's app | As the original; removable any time | Same |
| `entries.audio_sha256`, `audio_bytes`, `audio_duration_ms` | L4, L2, L2 | Local SQLite (exist, migration 3) | Author | Life of the letter | Hash syncs as author-only working material (TDD 03 section 4.1) |
| `entries.listening_uri`, `listening_sha256`, `listening_state` (new) | L3, L4, L2 | Local SQLite | Author | As above | Never |
| `entries.audio_kept_on_device` (server, exists) | L2 | Postgres | Book members | Life of the letter | Syncs; lets the co-parent's app show F08-REQ-012 |
| Settings `playback.preferOriginal`, `recordings.lastScrubAt`, `recordings.keepSafe.shownFor` (new) | L2 | Local settings | App | Install | Never |

Rules: no audio upload (B7); no server transcription at v1.0; decoded PCM only in memory, never on disk (LEGAL-REQ-018); denoising is not speaker analysis (LEGAL-REQ-019 holds); new columns get rows in `DATA_CLASSIFICATION.md` section 4.5 and section 4.6 gets the listening copy file (DATA-REQ-001). The privacy label and Privacy Policy say audio is declared because of backup and web playback (`app-store-privacy-labels.md`), neither of which is in v1.0; counsel and F21 decide whether the label changes (Q4).

## 9. Non-functional requirements

| Area | Budget | Gate | How measured |
|---|---|---|---|
| Local playback start | p95 300 ms [R] | Yes | Perf build, 200 samples |
| Storage per audio minute | Original 0.48 MB; with listening copy 0.96 MB (R5 section 6, arithmetic) | n/a | File sizes |
| Storage per active family per month | 19.2 MB originals, 38.4 MB with copies, at 40 audio minutes [A] (R5 section 6) | n/a | Year-1 fixture: 230 MB of originals (TDD 06 section 7.1) |
| RNNoise compute | About 40 Mflops per second of audio, 1.3% of one x86 core (R5-S81). A15 speed **Unverified**; Inferred well under 1 s per audio minute (R5 section 5.2) | Measure | WP-F08-01 on SE 3: 30 runs of a 2-minute clip |
| Listening copy job, decode plus denoise plus encode, 2-minute letter | 10 s or less on SE 3 [A] | Yes once measured | WP-F08-01 |
| Battery for listening copies | 0.5% or less per 10 audio minutes [A] | No | 10-run average |
| Binary size | RNNoise weights about 85 KB (R5 section 5.2, arithmetic) plus library code, under 1 MB toward the 40 MB budget [A] | Yes for the total | IPA size check |
| Durability | Zero originals altered; zero lost in kill runs | Yes | WP-F08-07, BL-135 |
| Accessibility | WCAG 2.2 AA; AX5; VoiceOver script | Yes | TDD 09 |

## 10. Analytics

| Event | Status | Properties | Question |
|---|---|---|---|
| `playback_started` | Exists; add `version` (`original`, `listening`) | `surface`, `author_relation`, `version` | Do people keep the listening copy or switch to the original? |
| `playback_version_switched` | New | `to` (`original`, `listening`) | Is the copy trusted? A high switch rate pauses the flag |
| `playback_failed` | New (TDD 06 recommends it) | `reason` (`missing`, `decode`, `session`) | Playback health |
| `listening_copy_made` | New | `outcome` (`ok`, `failed`, `skipped_storage`), `audio_bucket`, `latency_bucket` | Field cost and failure rate |
| `keep_safe_card` | New | `action` (`shown`, `export`, `not_now`) | Does the nudge lead to exports? |
| `export_completed` | Exists | `format`, `size_bucket`, `duration_bucket` | Durability behaviour |

All opt-in, L2 only.

## 11. How we build it (with the architect)

**Components**
| Part | File | Status |
|---|---|---|
| Player component | `apps/mobile/src/components/audio/player.tsx` | New; `expo-audio` `useAudioPlayer`, Gesture Handler pan for scrub (COMPONENTS 2.21) |
| Version choice (pure) | `packages/core/src/playback.ts` | New: `pickVersion(entry, flag, preferOriginal)` |
| Letter view wiring | `apps/mobile/src/app/letter/[id].tsx` | Exists |
| Review mini player | `apps/mobile/src/app/review.tsx` | Exists; swap to the shared player |
| Listening copy native code | `apps/mobile/modules/scribe-audio-decode`: add `decodeRange48k` and `writeAac(pcm, path)` [A that AVAudioFile writes AAC from PCM; verify] | Extends BL-140 |
| RNNoise | C library compiled into the same module (BSD, R5-S81) | New; confirm licence file and maintenance at install (brief rule) |
| Job queue | `apps/mobile/src/lib/audio/listening-queue.ts` | New; shares the F05 queue gates |
| Files and sweep | `apps/mobile/src/lib/capture/sweep.logic.ts`, `sweep.ts` | Exists; add purge of tombstones over 30 days and `.part` cleanup |
| Settings > Recordings | `apps/mobile/src/app/settings/recordings.tsx` | Exists; rows per section 6.4 |
| Keep-safe card | `apps/mobile/src/components/book/keep-safe-card.tsx` | New |
| Copy | `apps/mobile/src/components/audio/copy.ts` | New (brief rule) |

**Data model.** Local migration (next number after F04's migration 4): `entries.listening_uri TEXT`, `listening_sha256 TEXT`, `listening_state TEXT` (`none`, `queued`, `ready`, `failed`). Remote config: `listening_copy_enabled` (bool, default false) in the D-035 table (F19).

**Riskiest unknowns and the spike (WP-F08-01).** (1) RNNoise plus AAC encode speed and battery on SE 3. (2) Whether expo-audio records AAC at 48 kHz mono 64 kbps on iOS. (3) Whether listeners prefer the copy, and whether babble and lullabies survive (R5 section 8.2: 20 noisy clips, 5 listeners, blind). (4) Whether denoising changes Whisper WER (Unverified; transcription stays on the original either way). DR-09 decision is due 30 Oct; the spike reports before then.

**Sequencing.** WP-F08-01 and WP-F08-03 (player) first, weeks 3 to 4; WP-F08-02 files and copy, WP-F08-05 deletion, week 4; WP-F08-04 listening copy after the spike, weeks 5 to 7; WP-F08-06 nudge and Settings, week 6; WP-F08-07 integrity tests run on every release candidate.

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|
| WP-F08-01 | Spike: 48 kHz encode, RNNoise speed and battery on SE 3, listening test with babble and singing, WER on original versus denoised | `docs/qa/evidence/F08-spike.md` (new), `experiments/` listening test scripts | BL-140 prototype, BL-147 clips | Numbers recorded; listening test result; founder answers DR-09 | pair (speech engineer, QA engineer) |
| WP-F08-02 | File location decision and assertions; revised durability copy; hide backup rows | `apps/mobile/src/lib/model-files.ts` (read only), `apps/mobile/src/app/settings/recordings.tsx`, `apps/mobile/src/components/audio/copy.ts` | D-033 answer | `[F08-REQ-013]` backup flags test; `[F08-REQ-014]` copy test; content rules pass | agent (mobile engineer, content) |
| WP-F08-03 | Shared player; wire letter view and Review; co-parent line; version choice | `apps/mobile/src/components/audio/player.tsx`, `packages/core/src/playback.ts`, `apps/mobile/src/app/letter/[id].tsx` | none | `[F08-REQ-007]`, `[F08-REQ-008]`, `[F08-REQ-009]`, `[F08-REQ-010]`, `[F08-REQ-011]`, `[F08-REQ-012]`, `[F08-REQ-017]` | agent (mobile engineer, design systems) |
| WP-F08-04 | Listening copy job: native decode, RNNoise, AAC write, `.part` and rename, hash, queue gates, flag | `apps/mobile/modules/scribe-audio-decode/`, `apps/mobile/src/lib/audio/listening-queue.ts`, local migration | WP-F08-01, BL-140, F05 queue | `[F08-REQ-002]`, `[F08-REQ-003]`, `[F08-REQ-004]`, `[F08-REQ-005]`, `[F08-REQ-006]`; F08-U03 kill test 50 of 50 | agent plus device check (speech engineer) |
| WP-F08-05 | Deletion and purge of both files; `.part` cleanup; Remove copies | `apps/mobile/src/lib/capture/sweep.logic.ts`, `sweep.ts`, `apps/mobile/test/sweep.test.ts` | WP-F04-10 | `[DATA-REQ-011]` sweep tests; `[F08-REQ-015]` | agent (mobile engineer); extends BL-134 |
| WP-F08-06 | Keep-safe card and Settings rows; low-storage rules | `apps/mobile/src/components/book/keep-safe-card.tsx`, `apps/mobile/src/app/settings/recordings.tsx` | F15 export entry, BL-023 ask sequencer | `[C-REQ-018]`, `[F08-REQ-016]` | agent (mobile engineer) |
| WP-F08-07 | Integrity: original-unaltered test across copy, play, export, update; monthly scrub | `apps/mobile/src/lib/audio/scrub.ts`, `apps/mobile/test/` | WP-F08-04 | `[F08-REQ-002]`, `[DATA-REQ-046]` | agent (QA engineer) |
| WP-F08-08 | Analytics events | `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | none | Catalogue tests | agent (analytics engineer) |
| WP-F08-09 | Export hand-off: listening copy file naming, README lines | F15 files (F15 owns; this WP is a request) | BL-150 | `[DATA-REQ-050]` fixture with both files | agent (mobile engineer) |
| WP-F08-10 | Durability drill on every release candidate | `docs/qa/evidence/` | BL-284 | Backup and restore to a second phone plays every recording with matching hashes | human (QA engineer, founder) |

## 13. Open questions and assumptions

| # | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | DR-09: confirm A (record unprocessed, RNNoise copy after save) | Founder | 30 Oct | WP-F08-04 |
| Q2 | D-033: recordings in a backed-up directory, and the revised copy | Founder | 23 Oct | WP-F08-02, `permissions.microphone`, claims registry |
| Q3 | Default playback to the listening copy when it exists, or the original with a "Easier to hear" switch? This spec defaults to the copy, per R5 section 5.3 item 5, once the test passes | Founder | 30 Oct | `pickVersion` |
| Q4 | Privacy label: audio is declared for backup and web playback, neither in v1.0. Keep or remove for v1.0? | Counsel, F21 owner | 20 Nov | `app-store-privacy-labels.md`, PrivacyInfo |
| Q5 | Move audio from Documents to `Application Support/audio/` (TDD 03 section 3.2)? Both are backed up; Application Support hides files from the Files app | Architect | 16 Oct | Paths and a one-time move migration with hash check |

| # | Assumption | How we validate |
|---|---|---|
| A1 | RNNoise runs well under 1 s per audio minute on an A15 | WP-F08-01 |
| A2 | AVAudioFile can write AAC-LC mono 64 kbps M4A from PCM in the native module | WP-F08-01 |
| A3 | iCloud device backup includes the Documents directory (D-033, C OQ5 Unverified) | BL-284 drill |
| A4 | 500 MB is a safe floor to stop making copies | Field data from `listening_copy_made{outcome}` |
| A5 | AirPods disconnect pauses playback | Manual script |

## 14. Sources

- Brief and V2: `docs/agents/BRIEF-2026-10-03.md` items 8, 9, 15; `_AUTHORING.md` B6, B7, B13; `01-problem.md` section 2.7; `02-customers.md` P2, P6; `03-goals-and-principles.md` sections 1, 3; `05-feature-map.md`; `09-decisions-and-risks.md` DR-01, DR-07, DR-08, DR-09, R-10, R-11.
- PRD 1.3: `docs/prd/PRD.md` sections 3.4 (PRD-REQ-020, -021), 6.6, 7.1, 7.7, K-33, K-42; `docs/prd/C-habits-pricing-settings.md` section 4.1, C-REQ-017, C-REQ-018, C-NFR-008.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -018, -019, -022, -045, -050, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md` sections 2.2, 4, 5 (DATA-REQ-010, -011, -023, -046, -050, -051, -055); `docs/legal/DATA_CLASSIFICATION.md` sections 4.5, 4.6; `docs/legal/data-policy.md`; `docs/legal/app-store-privacy-labels.md`.
- Decisions and plans: `docs/DECISIONS.md` D-032, D-033, D-035, D-040; `docs/BACKLOG.md` BL-134, BL-140, BL-147, BL-150, BL-205, BL-245, BL-284.
- Design: `docs/adr/0001-on-device-asr.md`; `docs/adr/0005-audio-format.md`; `docs/tdd/01-mobile-client.md` sections 3.2.4, 3.6, 4.1; `docs/tdd/03-audio-transcription.md` sections 3.2, 3.3, 4; `docs/tdd/06-performance-reliability.md` sections 2.2, 4.1, 6.1, 7.1; `docs/tdd/09-accessibility-design-system.md` A11Y-F19; `docs/tdd/10-red-team-critique.md` risks 8, 9, contradictions 9, 10; `docs/design/COMPONENTS.md` 2.21; `docs/design/MOTION.md` section 6; `docs/design/SOUND.md` section 3.
- Code read 3 Oct 2026: `apps/mobile/src/app/listen.tsx`, `review.tsx`, `letter/[id].tsx`, `settings/recordings.tsx`; `apps/mobile/src/components/book/letter-card.tsx`; `apps/mobile/src/lib/store.ts`, `audio-mode.ts`, `model-files.ts`, `capture/recorder.ts`, `capture/sweep.logic.ts`; `apps/mobile/src/lib/db/migrations.ts`; `supabase/migrations/20260930000000_scribe_core.sql` (`audio_kept_on_device`); `packages/content/src/strings.en.ts`; `packages/analytics/src/catalog.ts`.
- Research: R1 section 0 item 6, F08 table (R1-S3, R1-S4, R1-S6, R1-S13, R1-S14, R1-S15, R1-S54, R1-S60, R1-S64, R1-S67); R2 section 0 item 5, section 6 F08; R5 section 0 items 8, 9, sections 5, 6, 8.2, 9 K9 (R5-S80, R5-S81, R5-S82, R5-S83, R5-S84); CR section 4.
