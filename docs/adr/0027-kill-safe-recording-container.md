# ADR 0027: A recording container that survives a kill

- **Status:** Proposed, 17 Oct 2026. The founder decides by Wed 21 Oct, before the first nightly kill run on Thu 22 Oct (06-nfr row 188: "below 49, the founder decides on the ADTS fallback before beta C1"). If accepted, it amends ADR 0005 (audio format) for the container only.
- **Deciders:** founder. Reviewers: S10 (capture), S08 (speech; owns the recording settings), S19 (kill harness, #203), S03 (Export), S05 (backup, #150), the player owner.
- **Number:** 0027. It is free on develop and on every open branch (0023 to 0025 are reserved for #139, #150 and #146; 0026 is on develop). The coordinator may renumber it.
- **Labels:** [V] verified in vendor source or documentation; [S] secondary source; [R] repo fact; [U] unverified until a simulator or device run.

## Context

The kill harness (#203) now counts a DL-01 take as kept only if it plays: `afinfo` must open it, and 49 of 50 takes must play to within 5 s of the kill point (07 row 160; 06-nfr row 188). Reviewer H's note on #203 (comment 6231791343) is that a take recorded as `.m4a` and killed mid-recording most likely has no index, so it will not open, and DL-01 would fail at the Tue 27 gate even with the sweep fix (#207).

### Is the risk real? Likely, not yet measured

| # | Evidence | Label |
|---|---|---|
| 1 | expo-audio 57.0.5 builds the iOS recorder as `AVAudioRecorder(url:settings:)` with a file named `recording-<UUID><extension>` (`ios/AudioUtils.swift:58-62, 163-167`). The settings carry `AVFormatIDKey` from `outputFormat` (`:96-129`, `:170-176`) and no file-type key. In JS, `build/utils/options.js` lays `options.ios` over the common options. | [V] |
| 2 | Apple: `AVAudioRecorder.stop()` "Stops recording and closes the audio file." | [V] |
| 3 | The AVAudioRecorder header says the file type "is inferred from the file extension included in this parameter's value" (copy on the Lazarus wiki). Apple documents the same rule for `AVAudioFile(forWriting:settings:)`: it "infers the file type to create from the file extension of fileURL". | [S] for the recorder, [V] for AVAudioFile |
| 4 | Apple QuickTime File Format: the movie atom (`moov`) holds "the information that allows your application to interpret the sample data that is stored elsewhere". Without it, a reader cannot find the AAC frames in `mdat`. | [V] |
| 5 | Apple Developer Forums thread 720691: a developer writing AAC to `.m4a` with `AVAudioFile` (the same Core Audio writer family) reports that after a crash "those m4a files are invalid - the MOOV atom is missing". The Apple Media Engineer's reply points to `AVAssetWriter.movieFragmentInterval`. | [S] |
| 6 | Apple, `AVAssetWriter.movieFragmentInterval`: fragment writing "enables you to open and play a partially written movie in the event that an unexpected error or interruption occurs", and it is off by default. Movies written without fragments have no such guarantee. | [V] |
| 7 | Android, expo-audio `AudioRecords.kt:61-69, 81-86`: `'mpeg4'` maps to `MediaRecorder.OutputFormat.MPEG_4` and `'aac_adts'` to `OutputFormat.AAC_ADTS`. AOSP `MPEG4Writer` builds the `moov` box in `reset()` when recording stops; in streamable mode it only reserves a `free` box at the start for it. | [V] expo-audio source; [S] AOSP commit history |
| 8 | The repo already expects it: TDD 03 R-4 ("AVAudioRecorder writes it on stop, **A**, verify"), F04 section 11.6, BL-382, DEVICE_TEST_PLAN DL-01. | [R] |

**Finding: unverified, likely.**
- **Android:** confirmed from source. The MPEG-4 index is written at stop.
- **iOS:** Core Audio's MPEG-4 writer is closed source. Every source above points the same way and none refutes it, but only the first simulator run can show how often a killed `.m4a` fails to open.
- **Plan accordingly:** treat DL-01 on the current recorder as a likely failure at the Tue 27 gate.

## Options

Sizes are arithmetic. AAC at 64 kbps is 8,000 bytes/s, or 0.48 MB/min. At 48 kHz an AAC frame holds 1,024 samples, so there are 2,812.5 frames per minute. M4A adds about 4 bytes per frame of index (about 0.49 MB/min). ADTS adds a 7-byte header to every frame (about 0.50 MB/min).

| Option | Survives a kill? | iOS through expo-audio | Android through expo-audio | MB/min | Work |
|---|---|---|---|---|---|
| **A. ADTS AAC (`.aac`), kept as recorded** | Yes by design: every frame starts with a sync word and its own length, so a reader stops at the last whole frame [S: ISO/IEC 14496-3 framing as parsers implement it; Chromium `adts_stream_parser.cc` treats a cut-off last frame as incomplete]. How much audio is lost at the tail depends on the recorder's write buffer [U] | Yes: `extension: '.aac'` with `outputFormat: MPEG4AAC`. Core Audio writes the ADTS file type (`afconvert -f adts`) [S]; that the recorder picks it from `.aac` is [U] until check V1 | Yes: `outputFormat: 'aac_adts'` [V] | 0.50 | Prototype in this PR (one constant). Flip needs S03's Export change and the checks below. About 1 to 2 days across S10, S19, S03, S05 |
| A2. ADTS, remuxed to M4A on a normal stop (F04 11.6 option a) | Killed takes stay ADTS (A); finished takes become M4A | Needs native passthrough remux (AVAssetWriter or AVAssetExportSession) in ScribeAudio [U] | Needs MediaMuxer remux [U] | 0.49 to 0.50 | A plus 2 to 4 days of native work on both platforms. Adds a kill window during the remux, and changes the file after capture (same frames, new bytes and hash) |
| B. CAF | AAC in CAF: the spec requires a packet table for variable-bitrate AAC, written as recording ends, so likely not [V spec; U writer behaviour]. LPCM in CAF: yes, since the data chunk may have size -1 when last [V spec] | `.caf` [S] | No CAF writer in expo-audio Android (`AndroidOutputFormat` list) [V] | AAC 0.49; LPCM 48 kHz 16-bit 5.76 (12x) | iOS only. Android needs another path. LPCM costs 12x storage and backup |
| C. WAV (LPCM) | Probably. Core Audio's default rewrites the header sizes on every write (`kAudioFilePropertyDeferSizeUpdates` default 0) [V], but whether AVAudioRecorder keeps that default is [U] | `.wav` with `LINEARPCM` [V types] | No WAV writer in expo-audio Android [V] | 5.76 (12x); 1.92 at 16 kHz, which loses the keepsake quality ADR 0005 chose | Same objections as B |
| D. Repair a truncated M4A at launch | Sometimes. Raw AAC in `mdat` has no frame markers, so rebuilding the index means guessing frame boundaries (untrunc-style tools need a reference file) [S] | Native parser, writes a repaired copy | Same | 0.49, plus a second copy until the repair is trusted | 1 to 2 weeks, with uncertain results. A machine-made second file of the person's voice needs care under the constitution |
| E. Periodic segments (F04 11.6 option b, 60 s) | Loses at most the open segment, up to 60 s, more than the 5 s allowed. Short segments cut gaps into the voice at each restart [U] | Recorder restarts or two recorders | Same | 0.49 | 1 to 2 weeks: one letter becomes several files, which touches rows, the hash, Export, backup, the player and transcription |
| F. Fragmented MP4 via AVAssetWriter (`movieFragmentInterval`) | Yes, to the last fragment [V] | A new native recorder (AVAudioEngine tap, then AAC encode, then AVAssetWriter), replacing expo-audio's recorder, with metering and interruptions to rebuild | MediaMuxer has no fragmented MP4 [U]; a custom muxer | 0.49 | 1 to 2 weeks per platform, on the most important path, days before the alpha |

### What each choice means downstream

| Area | A (recommended) | Others |
|---|---|---|
| **Transcription input** | Unchanged in principle: the same AAC-LC frames, decoded to 16 kHz PCM by `AVAudioFile(forReading:)` in `modules/scribe-audio` (`ScribeAudioModule.swift:121-131`). Risk: decode seeks by frame (`file.framePosition`, `:220-223`); with no index, ADTS length and seeks may be estimated [U, check V3] | B and C: LPCM decodes exactly. D: input only as good as the repair. E: chunking across files. F: the same as today |
| **Export (format and hash)** | Exported as recorded, `.aac` (`audio/aac`). The hash in the export is the SHA-256 of those bytes, the same hash taken at capture, because nothing converts the file. Needs S03: `export/build.logic.ts:146` (`audioPath` hardcodes `.m4a`), `:116` (`MEDIA.m4a`), `export/schema.ts:183` (path pattern `\.m4a$`), plus a schema version step and the golden files | A2: M4A, but the hash is of the remuxed file, not of what the microphone stream wrote. B and C: `.caf` or `.wav`, 12x the export size |
| **Backup (#150)** | Encrypts and hashes the file's bytes whatever the format: no change. Restore keeps the stored name when the letter has one (`restore.ts:333`). Its fallback name `<entry id>.m4a` must take the real extension (S05) | B and C: 12x the upload and storage. E: several blobs per letter |
| **Playback** | AVFoundation plays ADTS `.aac` [S]. Duration and scrubbing come from an estimate when there is no index [U, check V4]. The listening copy reads the original through AVAudioFile, and the copy itself stays M4A | B and C: exact duration. F: as today |
| **Sweep, erase, recovery export, harness** | No change: they already treat `.aac` as a recording (`sweep.logic.ts` `AUDIO_EXT`; the harness snapshot uses the same list; `afinfo` reads ADTS [S]). Tested in this PR | |

## Decision (proposed)

**Option A: record AAC-LC as ADTS (`.aac`) and keep the file exactly as recorded.** The same codec, rate, channels, bitrate and quality as ADR 0005; only the container changes. No remux: a finished take and a killed take are the same kind of file, and the capture hash keeps describing the bytes the recorder wrote. A2's remux stays available if check V3 or V4 shows that ADTS duration or seeking is not good enough.

This PR adds the switch, `RECORDING_CONTAINER` in `apps/mobile/src/lib/capture/recording-format.ts`. **The default stays `'m4a'`.** Listen and the kill drill both record with `VOICE_RECORDING_OPTIONS`, so one constant moves both. A test fails if the constant is flipped while Export still names every recording `.m4a`.

### Checks before the flip
| # | Check | Who | Passes when |
|---|---|---|---|
| V1 | Simulator: a build with `RECORDING_CONTAINER = 'adts'` records a take | S10 | `afinfo` reports file type `adts`, data format `aac`, 48 kHz, mono, about 64 kbps |
| V2 | DL-01 through #203, on the default build and on an `'adts'` build from this branch (a one-line change on a scratch commit) | S19 | The default build shows whether the risk is real. The `'adts'` build has 49 or more of 50 takes playing to within 5 s |
| V3 | Decode parity: the same speech recorded in both containers goes through `decodePcm16` | S10 with S08 | Lengths within one AAC frame (21 ms); the words match; seeks land on the same frame |
| V4 | Playback | S10 with the player owner | Duration within 1 s of the true length; scrubbing works; a listening copy is made from an `.aac` original |
| V5 | Export carries `.aac` with `audio/aac` and its hash | S03 | An export test with an `.aac` letter passes; the schema and golden files are updated |
| V6 | The backup restore fallback name keeps the extension | S05 | A restore drill row with an `.aac` letter passes |

Then: flip the constant, amend ADR 0005 (container line), and update TDD 03 section 3.2 rule 4, F04 section 11.6 and BACKLOG BL-382.

### Timeline
- **Wed 21:** founder decision on this ADR.
- **Thu 22:** the first nightly runs DL-01 on the default build (V2, which shows whether the risk is real). S19 adds one shard on an `'adts'` build.
- **Fri 23 to Mon 26:** V1 and V3 to V6.
- **Tue 27 gate:** run on the flipped build.

If V2 shows killed M4A takes do play, keep M4A and mark this ADR rejected. If V1 fails (the recorder does not write ADTS from `.aac`), the alpha falls back to 06-nfr row 188: the founder decides whether killed takes that are kept and listed but do not play are acceptable for the alpha, and option F becomes post-alpha work.

## Consequences
- About 2% more bytes per take than M4A (0.50 against 0.49 MB/min). Negligible against ADR 0005's estimate of about 19 MB per active family per month.
- Two container types exist on phones that recorded before the flip. Every reader already handles both: the sweep, erase, recovery export, decode and playback.
- The constitution holds: nothing converts, repairs or rewrites a recording after capture; no audio or entry text goes to logs.

## Sources
- expo-audio 57.0.5 source (npm package): `ios/AudioUtils.swift`, `ios/AudioRecorder.swift`, `ios/AudioModule.swift`, `android/src/main/java/expo/modules/audio/{AudioRecorder,AudioRecords}.kt`, `build/utils/options.js`, `build/Audio.types.d.ts` (`AndroidOutputFormat`).
- Apple: [AVAudioRecorder.stop()](https://developer.apple.com/documentation/avfaudio/avaudiorecorder/stop()); [AVAudioFile init(forWriting:settings:)](https://developer.apple.com/documentation/avfaudio/avaudiofile/init(forwriting:settings:)); [AVAssetWriter.movieFragmentInterval](https://developer.apple.com/documentation/avfoundation/avassetwriter/moviefragmentinterval); [QuickTime File Format, movie atom](https://developer.apple.com/documentation/quicktime-file-format/movie_atom); [kAudioFilePropertyDeferSizeUpdates](https://developer.apple.com/documentation/audiotoolbox/kaudiofilepropertydefersizeupdates); [CAF File Format Specification](https://developer.apple.com/library/archive/documentation/MusicAudio/Reference/CAFSpec/CAF_spec/CAF_spec.html); [Developer Forums thread 720691](https://developer.apple.com/forums/thread/720691).
- AVAudioRecorder header copy: [Lazarus wiki, macOS Audio Recorder](https://wiki.lazarus.freepascal.org/macOS_Audio_Recorder).
- AOSP `MPEG4Writer` commit history: ["Output streamable MP4 file during MP4 file recording"](https://android.googlesource.com/platform/frameworks/base/+/b5e7423%5E%21/) and the frameworks/av commits on the in-memory `moov` cache.
- ADTS framing in parser source: [Chromium/Cobalt `adts_stream_parser.cc`](https://cobalt.googlesource.com/cobalt/+/HEAD/media/formats/mpeg/adts_stream_parser.cc).
- Repo: `docs/tdd/03-audio-transcription.md` (section 3.2 rule 4, R-4), `docs/prd/v2/features/F04-capture.md` (section 11.6), `docs/prd/v2/06-nfr.md` (row 188), `docs/BACKLOG.md` (BL-382), `docs/qa/DEVICE_TEST_PLAN.md` (DL-01), PR #203 review comment 6231791343.
