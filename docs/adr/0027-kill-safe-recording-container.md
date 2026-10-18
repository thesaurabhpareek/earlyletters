# ADR 0027: A recording container that survives a kill

- **Status:** Accepted pending V1, V2 and V3, 17 Oct 2026, for build 2, **iOS only**. The coordinator decided on 17 Oct under delegation, and the founder may reverse it.
  - It takes effect on iOS when three checks pass: V1 (iOS writes real ADTS), V2 (DL-01 passes on a simulator) and V3 (decode parity). Until then both platforms record M4A.
  - Android stays M4A in build 2. Android ADTS is post-alpha, with its own checks (section "Android").
  - If V1 fails, try option A3 (set the file type explicitly). If that fails too, the founder decides on 06-nfr row 188 ("below 49, the founder decides on the ADTS fallback before beta C1").
  - It amends ADR 0005 (audio format) for the container only.
- **Decider:** the coordinator (delegated). Reviewers: S10 (capture), S08 (speech; owns the recording settings and ADR 0005), S19 (kill harness, #203), S03 (Export), S05 (backup, #150), the player owner.
- **Number:** 0027. It is free on develop and on every open branch (0023 to 0025 are reserved for #139, #150 and #146; 0026 is on develop). The coordinator may renumber it.
- **Labels:** [V] verified in vendor source or documentation; [S] secondary source; [R] repo fact; [U] unverified until a simulator or device run.

## Context

The kill harness (#203) counts a DL-01 take as kept only if it plays: `afinfo` must open it, and 49 of 50 takes must play to within 5 s of the kill point (07 row 160; 06-nfr row 188). Reviewer H's note on #203 (comment 6231791343) is that a take recorded as `.m4a` and killed mid-recording most likely has no index, so it will not open. If so, DL-01 fails at the Tue 27 gate even with the sweep fix (#207).

Which kills this covers: Listen already ends and keeps a take when the app goes to the background (`listen.tsx:148`). So in the field, a live recorder is killed mostly by a foreground crash, a watchdog kill or power loss, not by iOS reclaiming a suspended app. The harness's host SIGKILL models a crash.

### Is the risk real? Likely, not yet measured

| # | Evidence | Label |
|---|---|---|
| 1 | expo-audio 57.0.5 builds the iOS recorder as `AVAudioRecorder(url:settings:)`, with a file named `recording-<UUID><extension>` (`ios/AudioUtils.swift:58-62, 163-167`). The settings carry `AVFormatIDKey` from `outputFormat` (`:96-129`, `:170-176`) and no file-type key. In JS, `build/utils/options.js` lays `options.ios` over the common options. | [V] |
| 2 | Apple: `AVAudioRecorder.stop()` "Stops recording and closes the audio file." Consistent with the index being written at stop; not proof of it. | [V] |
| 3 | The AVAudioRecorder header says the file type "is inferred from the file extension included in this parameter's value" (copy on the Lazarus wiki). Apple documents the same rule for `AVAudioFile(forWriting:settings:)`: it "infers the file type to create from the file extension of fileURL". Apple QA1534 maps `.aac` to `'adts'`. | [S] for the recorder, [V] for AVAudioFile and QA1534 |
| 4 | Apple QuickTime File Format: the movie atom (`moov`) holds "the information that allows your application to interpret the sample data that is stored elsewhere". Without it, a reader cannot find the AAC frames in `mdat`. | [V] |
| 5 | Apple Developer Forums thread 720691: a developer writing AAC to `.m4a` with `AVAudioFile` (the same Core Audio AudioFile writer the recorder uses) reports that after a crash "those m4a files are invalid - the MOOV atom is missing". The Apple Media Engineer's reply points to `AVAssetWriter.movieFragmentInterval`. | [S] |
| 6 | Apple, `AVAssetWriter.movieFragmentInterval`: fragment writing "enables you to open and play a partially written movie in the event that an unexpected error or interruption occurs", and it is off by default. This is an analogy for AVAssetWriter, not evidence about the recorder. | [V] |
| 7 | Android, expo-audio `AudioRecords.kt:61-69, 81-86`: `'mpeg4'` maps to `MediaRecorder.OutputFormat.MPEG_4`, and `'aac_adts'` to `OutputFormat.AAC_ADTS`. AOSP `MPEG4Writer` builds the `moov` box in `reset()` when recording stops. MediaRecorder's writer runs in the media server process, which may finalize the file when the app dies. | [V] expo-audio; [S] AOSP commit history that the index is written at stop; [U] that a killed app leaves no index |
| 8 | The repo already expects it: TDD 03 R-4 ("AVAudioRecorder writes it on stop, **A**, verify"), F04 section 11.6, BL-382, DEVICE_TEST_PLAN DL-01. | [R] |

**Finding: unverified, likely.**
- **iOS:** Core Audio's MPEG-4 writer is closed source. Every source above points the same way and none refutes it, but only the first simulator run (V2 on the default build) can show how often a killed `.m4a` fails to open.
- **Android:** the index is written at stop [S]. Whether a killed app leaves the file without one is [U]. Not in build 2.
- **Plan accordingly:** treat DL-01 on the current recorder as a likely failure at the Tue 27 gate.

## Options

Sizes are arithmetic:
- AAC at 64 kbps is 8,000 bytes/s, or 0.48 MB/min.
- At 48 kHz an AAC frame holds 1,024 samples, so there are 2,812.5 frames per minute.
- M4A adds about 4 bytes of index per frame (about 0.49 MB/min). ADTS adds a 7-byte header to every frame (about 0.50 MB/min).

| Option | Survives a kill? | iOS through expo-audio | Android through expo-audio | MB/min | Work |
|---|---|---|---|---|---|
| **A. ADTS AAC (`.aac`), kept as recorded** | Yes by design: every frame starts with a sync word and its own length, so a reader stops at the last whole frame [S: ISO/IEC 14496-3 framing as parsers implement it; Chromium `adts_stream_parser.cc` treats a cut-off last frame as incomplete]. How much audio is lost at the tail depends on the recorder's write buffer [U] | `extension: '.aac'` with `outputFormat: MPEG4AAC`. Core Audio writes ADTS for `.aac` (QA1534) [V]; that the recorder picks it from the extension is [U] until V1 | `outputFormat: 'aac_adts'` [V], but playback and probing need work there (section "Android") | 0.50 | In this PR: the switch, Export, the tail safeguard. The flip is one line for iOS |
| A2. ADTS, remuxed to M4A on a normal stop (F04 11.6 option a) | Killed takes stay ADTS; finished takes become M4A | Native passthrough remux (AVAssetWriter or AVAssetExportSession) in ScribeAudio [U] | MediaMuxer remux [U] | 0.49 to 0.50 | A plus 2 to 4 days of native work. Adds a kill window during the remux, and changes the file after capture (same frames, new bytes and hash) |
| A3. A, with the file type set explicitly | As A | A small expo-audio patch: `createRecordingOptions` (`AudioUtils.swift:96-129`) passes `AVAudioFileTypeKey = kAudioFileAAC_ADTSType`. The key exists from iOS 11 [V]; whether the recorder honours it is [U] | Not needed | 0.50 | A few lines (patch-package), S08 plus the iOS compile check. **The first fallback if V1 shows the extension alone does not give ADTS** |
| B. CAF | AAC in CAF: the spec requires a packet table for variable-bitrate AAC, written as recording ends, so likely not [V spec; U writer]. LPCM in CAF: yes, since the data chunk may have size -1 when last [V spec] | `.caf` [S] | No CAF writer in expo-audio Android (`AndroidOutputFormat` list) [V] | AAC 0.49; LPCM 48 kHz 16-bit 5.76 (12x) | iOS only. LPCM costs 12x storage and backup |
| C. WAV (LPCM) | Probably. Core Audio's default "always updates header" (`kAudioFilePropertyDeferSizeUpdates` default 0) [V]; whether AVAudioRecorder keeps that default is [U] | `.wav` with `LINEARPCM` [V types] | No WAV writer in expo-audio Android [V] | 5.76 (12x); 1.92 at 16 kHz, which loses the keepsake quality ADR 0005 chose | As B |
| D. Repair a truncated M4A at launch | Sometimes. Raw AAC in `mdat` has no frame markers, so rebuilding the index means guessing frame boundaries (untrunc-style tools need a reference file) [S] | Native parser, writes a repaired copy | Same | 0.49, plus a second copy until the repair is trusted | 1 to 2 weeks, with uncertain results. A machine-made second file of the person's voice needs care under the constitution |
| E. Periodic segments (F04 11.6 option b, 60 s) | Loses at most the open segment, up to 60 s, more than the 5 s allowed. Short segments cut gaps into the voice at each restart [U] | Recorder restarts or two recorders | Same | 0.49 | 1 to 2 weeks: one letter becomes several files, which touches rows, the hash, Export, backup, the player and transcription |
| F. Fragmented MP4 via AVAssetWriter (`movieFragmentInterval`) | Yes, to the last fragment [V] | A new native recorder (AVAudioEngine tap, then AAC encode, then AVAssetWriter) replacing expo-audio's, with metering and interruptions to rebuild | MediaMuxer has no fragmented MP4 [U]; a custom muxer | 0.49 | 1 to 2 weeks per platform, on the most important path |
| G. Choose the container per platform | Each platform gets what its player and decoder handle | A on iOS | M4A on Android | as chosen | **Now the plan**: `RECORDING_CONTAINERS` in `capture/recording-file.ts` holds one container per platform |

### What each choice means downstream (iOS)

| Area | A (chosen for iOS) | Others |
|---|---|---|
| **Transcription input** | The same AAC-LC frames, decoded to 16 kHz PCM by `AVAudioFile(forReading:)` (`ScribeAudioModule.swift:121-131`). The run plans over the decoder's length, and `AVAudioFile.length` on ADTS may be computed by scanning or estimated [U, V3]. TN2258: with ADTS "there is still no satisfactory and explicit signaling mechanism for either the encoding delay or remainder padding", and Apple assumes 2112 samples of priming [V]. So ADTS may decode about 44 ms later than M4A, or not, until V3 measures it. A short length would drop the last words silently and permanently (raw is immutable); the safeguard below stops that | B and C: LPCM decodes exactly. D: only as good as the repair. E: chunking across files. F: as today |
| **Export (format and hash)** | Exported as recorded, `.aac` (`audio/aac`), with the SHA-256 of those bytes, the same hash taken at capture. Done in this PR (schema 1.2.0) | A2: M4A, but the hash is of the remuxed file. B and C: 12x the export size |
| **Backup (#150)** | Encrypts and hashes the bytes whatever the container. On a new phone, restore cannot name the file from the letter (no stored path) and the backup object records no container, so it must read the bytes: V6 | B and C: 12x the upload and storage. E: several blobs per letter |
| **Playback** | expo-audio builds the `AVURLAsset` without `AVURLAssetPreferPreciseDurationAndTimingKey` (`AudioUtils.swift:87-93`). Apple says formats without summary information give approximate duration and timing [V], so ADTS duration and scrubbing are approximate by design. `seekTo` uses infinite tolerance; `scrubbedTo` clears only within 0.75 s of `currentTime` (`use-letter-player.ts:144-146`), so a late seek can freeze the shown position. The listening copy plays by default and is built from `source.length` frames (`ScribeAudioModule.swift:423`), so a short length would also shorten what a parent hears [U, V3 and V4] | B and C: exact duration. F: as today |
| **Sweep, erase, recovery export, harness** | Already treat `.aac` as a recording (`sweep.logic.ts` `RECORDING_EXTENSIONS`; the harness snapshot uses the same list; `afinfo` reads ADTS [S]). The e2e inspectors now do too (`inspect-container.sh`, `inspect-export.sh`). Tested in this PR | |

## Decision (accepted pending V1, V2 and V3)

**Option A on iOS, through option G.** Record AAC-LC as ADTS (`.aac`) and keep the file exactly as recorded.
- The codec, rate, channels, bitrate and quality are ADR 0005's; only the container changes.
- No remux: a finished take and a killed take are the same kind of file, and the capture hash keeps describing the bytes the recorder wrote.
- A2's remux stays available if V3 or V4 shows ADTS length or seeking is not good enough. A3 is the first fallback if V1 fails.

The switch is `RECORDING_CONTAINERS` in `apps/mobile/src/lib/capture/recording-file.ts`.
- **Both platforms stay `'m4a'` until V1, V2 and V3 pass.** Then the flip is the one line `ios: 'adts'`; Android stays `'m4a'`.
- Listen and the kill drill both record with `VOICE_RECORDING_OPTIONS`, so the one constant moves both.
- Export already names and labels each recording by its own container.
- The disk tests' stand-in recorder follows the constant, so a flipped run records `.aac` takes in them. The whole suite passes with iOS flipped (checked in this PR, then set back).

### The tail safeguard (in code now, for ADTS; M4A runs exactly as on develop)
`raw_transcript` is immutable and `verifyEdits` cannot see words lost before it exists. So the run must never plan over a length shorter than the file proves, and must refuse only when the file holds audio the decoder cannot reach.
- **Frame counting.** `capture/adts.ts` counts ADTS frames from their headers in plain TypeScript. That gives the length the file proves by itself, and where a frame a kill cut off begins.
- **Length check.** `transcribe-run.ts` `checkedRunDuration` does not trust a decoder length more than one frame short of the counted frames, after Apple's assumed 2112-sample priming. The plan then covers the counted frames.
- **The length stored at capture never refuses a run.** It is expo-audio's clock, not audio in the file. A killed take keeps its last 5 s progress mark (`listen.tsx:93-94`, `drafts.ts:80-82, 95`), so it can be seconds past the frames on disk, and no decoder, copy or retry could reach that audio. As on develop, it stands in only when the decoder gives no usable length. With no frame count (M4A), `checkedRunDuration` is exactly develop's `runDurationMs`, tested over a table of lengths. (Review Y's re-check, both repro cases are tests: 57.49 s of frames against a 60 s mark transcribes over the frames; an M4A 2.5 s short of the clock transcribes as on develop.)
- **Only a tail exactly as a kill leaves it is read from the copy** (`scanAdts` `tail`, from review Y's re-check 2). A kill only cuts the file short; it never changes earlier bytes. So a kill-cut tail is one of two things, and anything else is a break:
  - a header cut short, under 7 bytes, every byte of it this stream's own (sync word and layer, then the frequency index and channel configuration as far as they go); or
  - this stream's own header (same frequency index and channel configuration) whose `frame_length` is possible for the stream and runs past the end of the file, with none of the stream's frames after it.

  "Possible" is the AAC limit every bitstream must fit: at most 6,144 bits per channel in a raw data block (ISO/IEC 14496-3, 4.5.3.1), so at most 7 + 768 bytes for our mono frames (`plausibleLength`). A header claiming more is damage, never a frame an encoder wrote (review X on #219).

  Tested at every cut in the last 4,000 bytes of a real encoder's stream, with 0 misjudged: Y's 3,977 cuts on a 10.5 s ffmpeg file; this repo's test, 3,978 cuts on the framing of a 6 s one, with filler payload and again with three random payloads (compressed audio holds `0xFF` bytes); and 3,978 cuts on the real 6 s file itself, run locally (not committed). Damage inside the last 8 kB, a zeroed sync byte 20 frames from the end, is judged a break.
- **The stream's frames after damage count** (`framesAfterBreak`, review Y on #219). Within the outer bound, the bytes after the scan stops are searched for a run of at least 2 of the stream's whole frames, back to back to the end of the file (ending exactly there, or in a kill cut). A kill leaves nothing of the stream after its cut, and a trailer or zeroed blocks hold no such run, so a run found is audio past damage. Then the tail is a break, and those frames count toward the length the file proves. A decoder that stops at the damage, with or without an error, reads short and is refused; a decoder that reads past it is trusted. On the real 6 s file, damage 5, 20 and 40 frames from the end finds 4, 19 and 39 frames after it, and 2,000 random trailers of 1 to 8,000 bytes add none (the repo's test runs the same on random payload). The search also catches a damaged `frame_length` that is possible but wrong.
- **A break is refused when the decoder cannot read the file as it is.** A file whose tail is a break never gets the whole-frame copy, which would hold only the frames before the break. If the decoder fails on it, or reads it short of the counted frames, the run is refused (`RunInputError('break_inside')`, a visible `decode_failed`). A decoder that reads it well is trusted, so a trailer a writer adds after a finished take can never refuse it.
- **The outer bound is refused before anything is read.** The 13-bit `frame_length` caps a frame at 8,191 bytes (`ADTS_MAX_FRAME_BYTES`), so more bytes than that after the last whole frame is always a break. The frames after it cannot be counted, so no decoder length can be checked, and no copy is made. If a writer ever puts a trailer that long after every take, every take would be refused; V1 checks that finished takes end on a whole frame.
- **What is left** (both need real damage inside the file, not a kill):
  - **A decoder whose length is right but whose read stops at the damage.** `ScribeAudio` zero-fills a read that returns no frames before the requested range is done (`ScribeAudioModule.swift:183` and `:256-259`), with no error. If Core Audio reports a length covering the frames after the damage but its read stops at the damage, the audio after it would decode as silence. Nothing in JavaScript can see that: the length looks right and the samples are zeros. It needs Core Audio's length and its read to disagree, which V3's damaged-file case measures. If V3 shows it, S08 makes the native side report a short read (for example, `decodePcm16` throws `ERR_SCRIBE_AUDIO_DECODE` when a read returns no frames more than one frame before the counted frames end; `probe` cannot know the count, so the frame count would have to be passed in or the frames read returned), before the flip.
  - **Up to about 3 frames (65 ms) hidden in the tolerance.** The length check allows 2,112 samples of priming plus one frame (3,136 samples) everywhere. Audio after damage shorter than that, such as a single whole frame (a run needs 2), or frames a damaged but possible `frame_length` swallows, can still go unheard. It is the same tolerance every take gets, and well under the 5 s the harness allows.
- In every refused case the recording itself stays kept, listed and exported byte for byte, and the job stays retryable.
- **Opening the run.** `openRecordingForRun`:
  - If the decoder cannot open or decode a take whose tail is a kill cut, or reads it short, it switches once to a copy of the whole frames. The stored recording is only ever read.
  - If the length still cannot be trusted, the run is refused (`RunInputError('decoder_short')`, a visible `decode_failed`: Try again, or type). The take waits for its words instead of getting a raw transcript without its end, which could never be fixed. The job stays retryable, so a later decoder that reads to the end can still get the words.
- **The whole-frame copy is a second copy of the voice**, so it never outlives its use (`capture/adts-file.ts`):
  - it lives in Caches (never backed up), named by a key of the recording's file name and the time, nothing about the letter;
  - the run removes it when it ends, whatever happened;
  - Erase now and the 30 day purge remove the copies of the recording they erase, also while a run is reading one (`erase.ts`); a recording erased while its copy is being written takes the copy with it;
  - the transcription queue removes every copy when it starts, before its first job (a copy then is left from a run the app was killed in);
  - the launch sweep removes any copy an hour old, as a backstop;
  - the wipes still to be built (DATA-REQ-023, -024) must remove them too (`recordings.ts`).
- **No native change.** For S08 and the iOS compile check:
  - whether `AVAudioFile.length` on ADTS is exact (V3);
  - whether priming is trimmed (V3);
  - whether `file.read` survives a partial last frame (V3; the JS fallback covers it if not);
  - whether Core Audio's read stops silently at damage that its length reads past (V3's damaged-file case; a native short-read report if so, above);
  - comments at `modules/scribe-audio/index.ts:6` and `ScribeAudioModule.swift:150` that say "AAC M4A".

### Checks before the flip
| # | Check | Who | Passes when |
|---|---|---|---|
| V1 | A simulator take, and one on a device, from a build with `ios: 'adts'` | S10 | **Gates the flip.** The file starts `FF F1`. The header says AAC-LC, frequency index 3 (48 kHz), channel configuration 1. There is no `ftyp` at offset 4. `afinfo` reports file type `adts`, data format `aac`, about 64 kbps. **A finished take ends on a whole frame** (`scanAdts(bytes).tailBytes === 0`, `tail: 'none'`), on every take: a writer trailer after the last frame would be read as a break, and one longer than 8,191 bytes would refuse every take. **No frame is longer than 7 + 768 bytes** (the AAC limit the kill-cut rule relies on). If not, try A3 |
| V2 | DL-01 through #203, on the default build and on an `ios: 'adts'` build from this branch (a one-line change on a scratch commit) | S19 | **Gates the flip.** The default build shows whether the risk is real. The ADTS build has 49 or more of 50 takes playing to within 5 s. Request to S19: for ADTS, judge length by counting frames on the host (frames x 1024 / 48000; exact, and it flags a cut-off last frame) instead of `afinfo`'s estimated duration, and assert each take's stored path equals its listed path. Record for each killed take its tail: whole frames, the bytes after them, and the `scanAdts` `tail` value. Every killed take should be `cut` (or `none`); a `break` on a killed take would mean a kill is not the simple cut the rule assumes, and is reported before the flip. **Then run the real transcription job** (the queue's job through `transcribe-whisper.ts`, not only `decodePcm16`) on every killed take that plays, with its stored progress mark, and assert none is refused (`decode_failed`) and each plans over its counted frames |
| V3 | Decode parity, from **twins made of identical frames**: an ADTS take and an M4A remux of the same frames (for example `ffmpeg -i take.aac -c:a copy take.m4a`) | S10 with S08 | **Gates the flip.** Align the twins by cross-correlation; report the start offset (priming) separately from the length. Whether iOS trims TN2258's 2112 samples on ADTS is written down. On finished ADTS takes, `ScribeAudio.probe().durationMs` is within one frame (1024 samples, 21.3 ms) of the recorder's `durationMillis`, and the decoded length within one frame of the counted frames. Files truncated at 3 or more offsets (mid-frame, mid-header) and real DL-01 killed takes all: `probe` opens them (or the whole-frame copy), `decodePcm16` over [0, probe] returns without `ERR_SCRIBE_AUDIO_DECODE`, and the decoded length equals the whole frames within one frame. `enhance` on an ADTS original gives a listening copy whose length equals the original's within one frame. **A damaged file** (a finished take of speech or tone with the sync byte of the frame 20 from the end zeroed, so 19 whole frames follow the damage): report `probe().durationMs` against the counted frames (before and after the damage), and whether `decodePcm16` over the last 19 frames' span returns the audio or exact zeros. A short `probe` is refused already, and a full `probe` with the audio there is read past; both are fine. A full `probe` with zeros there is the first case under "What is left": S08's short-read report is then needed before the flip. Also report, for finished M4A and ADTS takes, the gap between the recorder's clock and the file (for the record: the clock never refuses a run) |
| V4 | Playback | S10 with the player owner | Before build 2 ships. A take of 10 minutes or more and a killed ADTS take. Report the measured duration error and seek landing error, the `scrubbedTo` freeze case, and that the listening copy's length equals the original's. Precise timing may need `seekTo(to, 0, 0)` (in 57.0.5) or the asset key (a patch) |
| V5 | Export carries `.aac` with `audio/aac` and its hash | S10 (cleared by the coordinator to edit Export) | **Done in this PR** (`test/export-recording-format.test.ts`; the README copy, F15 and DELETION_AND_EXPORT_SPEC name both containers) |
| V6 | Backup restore names the file by its container | S05 (#150) | Before any flipped build with backup switched on. Restore must find the container from the bytes, or the backup must record it. `scanAdts` (`capture/adts.ts`) already tells ADTS from the bytes and returns null for an M4A (whose `ftyp` is at byte 4), so restore can reuse it: name the file `.aac` when it scans, `.m4a` when not. Today's fallback name `<entry id>.m4a` would mislabel an ADTS take. Export would then name and label it `.m4a` (the schema cannot catch that, because name and label agree), and the transcription run, which picks the frame scan by extension, would skip the tail safeguard. A restore drill row with an `.aac` letter |

V1, V2 and V3 gate the flip. V4 and V6 come before build 2 ships (V6 before any flipped build with backup on).

**After the flip:**
- Amend ADR 0005 (the container line).
- Update TDD 03 section 3.2 rule 4, F04 section 11.6 and BACKLOG BL-382.
- Comments for their owners:
  - `modules/scribe-audio/index.ts:6` and `ScribeAudioModule.swift:150` (S08);
  - `kill-drill.logic.ts:59` (S19).

### Android: not in build 2
Android ADTS needs its own checks first:
- Media3 lists "ADTS (AAC) | YES | Only seekable using constant bitrate seeking", and that seeking "is not enabled by default" [V]. expo-audio uses a plain `ProgressiveMediaSource.Factory` (`AudioModule.kt:934`) and reports duration 0 when ExoPlayer has none (`Playable.kt:23`).
- So an ADTS take likely has no duration there [U], and `probePlayable` (`probe.ts:31`) would list every killed ADTS take as unrecoverable.
- ScribeAudio on Android is a stub, so transcription on Android is a separate piece of work anyway.

### Timeline
- **17 Oct:** accepted pending V1, V2 and V3 (coordinator, delegated).
- **Thu 22:** the first nightly runs DL-01 on the default build (V2, which shows whether the risk is real). S19 adds one shard on an `ios: 'adts'` build. V1 runs the same day.
- **Fri 23 to Mon 26:** V3. With V1, V2 and V3 green, flip `ios` to `'adts'` (one line). V4 and V6 follow.
- **Tue 27 gate:** run on the flipped build.

If V2 shows killed M4A takes do play, keep M4A and mark this ADR rejected. If V1 fails and A3 does not help, the alpha falls back to 06-nfr row 188: the founder decides whether killed takes that are kept and listed but do not play are acceptable for the alpha, and option F becomes post-alpha work.

## Consequences
- **Export format 1.2.0** allows an `.aac` recording. Open PR #161 also proposes a 1.2.0. Whichever lands second takes 1.3.0; it also freezes the first one's 1.2.0 data as `_v1.2.0` with a reader test (DATA-REQ-055) and moves the `toBe('1.2.0')` pin. The `_v1.1.0` fixtures do not conflict: both PRs freeze byte-identical files.
- **Size:** about 2% more bytes per take than M4A (0.50 against 0.49 MB/min). Negligible against ADR 0005's estimate of about 19 MB per active family per month.
- **Two containers on one phone.** iPhones that recorded before the flip keep their M4A takes alongside new ADTS ones. On iOS, the sweep, erase, recovery export, Export and the transcription run handle both, as tested in Node. Decode length and playback timing on ADTS are what V3 and V4 measure. Android records only M4A in build 2.
- **The constitution holds:**
  - nothing converts, repairs or rewrites a recording after capture (the whole-frame copy is a temporary read aid in Caches, never stored as the recording, and it never outlives an erase);
  - a raw transcript is never stored without its end, and a run is refused only when the file holds audio the decoder cannot reach (never on the recorder's clock);
  - an M4A take is transcribed exactly as on develop;
  - no audio or entry text goes to logs.

## Sources
- expo-audio 57.0.5 source (npm package): `ios/AudioUtils.swift`, `ios/AudioRecorder.swift`, `ios/AudioModule.swift`, `android/src/main/java/expo/modules/audio/{AudioRecorder,AudioRecords}.kt`, `build/utils/options.js`, `build/Audio.types.d.ts` (`AndroidOutputFormat`).
- Apple:
  - [AVAudioRecorder.stop()](https://developer.apple.com/documentation/avfaudio/avaudiorecorder/stop())
  - [AVAudioFile init(forWriting:settings:)](https://developer.apple.com/documentation/avfaudio/avaudiofile/init(forwriting:settings:))
  - [AVAudioFileTypeKey](https://developer.apple.com/documentation/avfaudio/avaudiofiletypekey)
  - [AVAssetWriter.movieFragmentInterval](https://developer.apple.com/documentation/avfoundation/avassetwriter/moviefragmentinterval)
  - [QuickTime File Format, movie atom](https://developer.apple.com/documentation/quicktime-file-format/movie_atom)
  - [kAudioFilePropertyDeferSizeUpdates](https://developer.apple.com/documentation/audiotoolbox/kaudiofilepropertydefersizeupdates)
  - [CAF File Format Specification](https://developer.apple.com/library/archive/documentation/MusicAudio/Reference/CAFSpec/CAF_spec/CAF_spec.html)
  - [Technical Note TN2258, AAC Audio: Encoder Delay and Synchronization](https://developer.apple.com/library/archive/technotes/tn2258/_index.html)
  - Technical Q&A QA1534 (the `afconvert` file and data format list), cited by reviewer Y
  - [Developer Forums thread 720691](https://developer.apple.com/forums/thread/720691)
- AVAudioRecorder header copy: [Lazarus wiki, macOS Audio Recorder](https://wiki.lazarus.freepascal.org/macOS_Audio_Recorder).
- Android:
  - [Media3 ExoPlayer supported formats](https://developer.android.com/media/media3/exoplayer/supported-formats)
  - AOSP `MPEG4Writer` commit history: ["Output streamable MP4 file during MP4 file recording"](https://android.googlesource.com/platform/frameworks/base/+/b5e7423%5E%21/) and the frameworks/av commits on the in-memory `moov` cache
- ADTS framing in parser source: [Chromium/Cobalt `adts_stream_parser.cc`](https://cobalt.googlesource.com/cobalt/+/HEAD/media/formats/mpeg/adts_stream_parser.cc).
- Repo:
  - `docs/tdd/03-audio-transcription.md` (section 3.2 rule 4, R-4)
  - `docs/prd/v2/features/F04-capture.md` (section 11.6)
  - `docs/prd/v2/06-nfr.md` (row 188)
  - `docs/BACKLOG.md` (BL-382)
  - `docs/qa/DEVICE_TEST_PLAN.md` (DL-01)
  - PR #203 review comment 6231791343
  - PR #213 reviews by X (6232279942) and Y (6232309143), and their re-checks (6232622118, 6232635620)
