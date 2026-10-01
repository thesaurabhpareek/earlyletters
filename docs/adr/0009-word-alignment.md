# ADR 0009: Word alignment for Read together — ASR token timestamps projected through stored edits; server re-alignment only when quality is low

Status: Accepted. Date: 2026-10-01.

## Context
Read together highlights each word as the author's recorded voice plays. Text shown is `final_text`; timings come from audio of the raw speech.

## Facts
- whisper.cpp offers word-level timestamps, marked "experimental" [S2]; whisper.rn exposes token timestamps [S1]. Community reports of DTW timing being off exist and are unresolved [S34].
- Groq returns word-level timestamps with `timestamp_granularities=word` [S10].
- WhisperX produces word timing via wav2vec2 forced alignment, BSD-2, GPU recommended; Hindi alignment model not listed by default [S48].
- Qwen3-ForcedAligner-0.6B (Apache 2.0) predicts timestamps for up to 5 minutes in 11 languages [S7] (whether Hindi is one is Unverified).
- Apple SpeechTranscriber gives `audioTimeRange` per attributed-string run, iOS 26+ [S17].

## Decision
1. Store raw word timings from the ASR in `stt_meta.words`.
2. Compute `alignment` for `final_text` deterministically in `packages/core`: walk accepted edits (offsets against raw), carry timings for untouched words, merge timings for replaced spans (`stt_fix`), drop removed spans (fillers/repeats). Pure TS, unit-tested, runs on phone and web.
3. Quality gate: if timings are non-monotonic, have gaps > 2 s inside speech, or low token probability, mark `alignment.quality = 'low'` and fall back to sentence-level highlighting.
4. v1.x: optional server re-alignment (Groq word timestamps, or Qwen3-ForcedAligner self-hosted) for low-quality entries, with consent.

## Consequences
No extra on-device model for alignment. Honest degradation instead of wrong highlights.

## Alternatives rejected
On-device CTC forced alignment in v1 (another model, Hindi coverage unclear). WhisperX server for every entry (GPU ops).
