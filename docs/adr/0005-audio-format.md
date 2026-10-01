# ADR 0005: Audio format — AAC-LC mono 64 kbps in M4A via expo-audio; optional Opus later for archive export

Status: Accepted. Date: 2026-10-01.

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

## Consequences
~19 MB per active family per month at our usage assumptions. One format for record, playback, backup and export; no transcoding pipeline.

## Alternatives rejected
Opus as primary (extra transcoding step on iOS). Lossless as primary (10x storage for no audible benefit on phone mics).
