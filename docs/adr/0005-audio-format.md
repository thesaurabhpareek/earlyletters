# ADR 0005: Audio format — AAC-LC mono 64 kbps in M4A via expo-audio; optional Opus later for archive export

Status: Accepted. Date: 2026-10-01. Container amended by ADR 0027 on 27 Oct 2026 (see Decision); the codec, rate, channels and bitrate are unchanged.

## Context
Voice keepsake for 18+ years: must play on any device in 2044, be small enough to keep on the phone and back up, and be good enough for ASR and emotional listening.

## Options
| Format | Size (arithmetic) | Durability | Capture on iOS |
|---|---|---|---|
| **AAC-LC in M4A, mono 64 kbps** | 0.48 MB/min | ISO standard, universal playback (Unverified claim of patent status; decoding universally supported) | expo-audio records `.m4a` AAC on iOS; custom `bitRate`, `audioQuality`, `outputFormat` options [S40] |
| Opus in Ogg/WebM, mono 24 kbps | 0.18 MB/min | Open, royalty-free; Xiph recommends 16 kb/s fullband mono voice, 24 kb/s for audiobooks/podcasts [S41] | Not a native iOS recording format via expo-audio (Unverified); needs transcoding |
| FLAC / WAV | ~5–10 MB/min | Lossless | WAV via LINEARPCM [S40]; too large to keep by default |

Note expo-audio `HIGH_QUALITY` preset is 44.1 kHz, **stereo, 128 kbps** [S40] — wasteful for voice; use a custom preset.

## Decision
Record AAC-LC, mono, 44.1 kHz (or 48 kHz), 64 kbps, `.m4a`, with expo-audio custom options. Whisper requires 16 kHz PCM; decode on the fly for ASR, never store the downsampled copy. Store SHA-256 of each file. Export ZIP includes M4A as-is. Consider an optional Opus or FLAC archival export in v1.x.

**Amendment, 27 Oct 2026 (ADR 0027, #293; the container only).** Every iOS build cut from develop from #293 (bbac5ec) on, build 1 included, records the same AAC-LC frames, rate, channels, bitrate and quality as an ADTS stream (`.aac`), so a take cut off by a kill still plays up to its last whole frame. Android stays `.m4a`, and iOS takes recorded before the flip stay `.m4a`. Nothing is remuxed or converted: each take is kept, hashed and exported exactly as recorded, named and labelled by its own container (`.aac` as `audio/aac`, `.m4a` as `audio/mp4`; Export schema 1.2.0). The switch is the one line `RECORDING_CONTAINERS` in `apps/mobile/src/lib/capture/recording-file.ts`. If a device or Mac check due before the build 2 freeze fails (ADR 0027, DL-06), the line goes back to `'m4a'` and this paragraph is updated.

## Consequences
~19 MB per active family per month at our usage assumptions. One format for record, playback, backup and export; no transcoding pipeline. Since ADR 0027: one codec in two containers (ADTS for iOS takes from the flip on; M4A for Android and earlier iOS takes), still with no transcoding.

## Alternatives rejected
Opus as primary (extra transcoding step on iOS). Lossless as primary (10x storage for no audible benefit on phone mics).
