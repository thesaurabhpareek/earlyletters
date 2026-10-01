# ADR 0001: On-device ASR — whisper.rn with Whisper large-v3-turbo q5_0, first-run download

Status: Accepted (pending Phase 0 measurements). Date: 2026-10-01. Sources: see ARCHITECTURE.md [S#].

## Context
Transcription must work offline, cost nothing per minute, handle names via a family dictionary, give word timings for Read together, and cope with Indian English and Hindi-English code-switching. The app is Expo/RN, built by a non-engineer.

## Options considered

| Option | Licence | RN/Expo path | Size | Word timing | Biasing | Hindi / Hinglish |
|---|---|---|---|---|---|---|
| **whisper.cpp via whisper.rn** | MIT [S1][S2] | Maintained RN binding; Expo via prebuild/dev client; iOS 15+; Core ML encoder; Silero VAD; also runs Parakeet TDT [S1] | turbo q5_0 574 MB; small q5_1 190 MB; base q5_1 60 MB [S3] | token timestamps (word-level "experimental") [S1][S2] | initial prompt [S1] | Multilingual; base large-v3 is weak on Hinglish: 29.74% WER on CoSHE-500 [S9], 32.4% on LAHAJA Hindi [S8] |
| WhisperKit (Argmax) | MIT [S37] | Swift only, no RN binding [S37]; would need a custom Expo module | turbo compressed 0.6 GB [S37 paper] | word timestamps [S37] | prompt text [S37] | Same Whisper weights |
| Apple SpeechAnalyzer | proprietary, free | Needs a custom Expo module; iOS 26+ [S17] | system-managed, not in app size [S17] | `audioTimeRange` per run [S17] | No custom vocabulary (per Argmax, June 2025) [S37] | Locale list not confirmed on opened pages; Hindi/en-IN Unverified |
| NVIDIA Parakeet TDT 0.6B v3 / Canary 1B v2 | CC-BY-4.0 | via whisper.rn or sherpa-onnx | 0.6B / 1B params | word-level [S4][S31] | — | **No Hindi** [S4][S31] |
| Moonshine | MIT (legacy non-English: non-commercial) [S5] | no RN binding found | tiny to large | Unverified | Unverified | STT languages list has no Hindi [S5] |
| distil-large-v3.5 | MIT | via whisper.rn (ggml conversion Unverified) | 756M params | as Whisper | as Whisper | **English only** [S39] |
| sherpa-onnx | Apache 2.0 (licence page not opened; Unverified) | community RN binding with Expo plugin, 39 stars [S38] | XCFramework ~80 MB + model | model-dependent | hotwords (Unverified) | depends on model (e.g. IndicConformer, MIT, Hindi 13.2% WER on Vaani [S32]) |
| Qwen3-ASR 0.6B (Jan 2026) | Apache 2.0, Hindi among 30 languages [S7] | GGUF exists on HF; whisper.rn support Unverified | 0.6B | via separate ForcedAligner [S7] | Unverified | Code-switching not stated [S7] |

Published iPhone speed: Argmax reports SpeechAnalyzer 70x and WhisperKit base 111x real-time on earnings calls; WER 14.0% vs 15.2% (WhisperKit small 12.8%) [S37]. No published whisper.rn iPhone benchmark was opened; measure in Phase 0.

## Decision
- **Primary:** whisper.rn + `ggml-large-v3-turbo-q5_0` (574 MB) on devices with enough RAM; **fallback tier:** `ggml-small-q5_1` (190 MB). Core ML encoder off initially (1.17 GB zip for turbo [S3]); test it in Phase 0 for speed.
- Family dictionary terms (child's name, nicknames, Hindi words) rendered into the initial prompt; `packages/core` `stt_fix` edits catch the rest.
- Language: `auto` with a per-author hint (`en`, `hi`); never translate.
- **Shipping:** first-run download (not bundled) from a versioned URL (Supabase Storage or Hugging Face), Wi-Fi by default, SHA-256 verified, stored in Application Support with backup excluded. Entries recorded before the download completes queue as audio-only. Bundling 574 MB would bloat every install and every update.
- Keep the `experiments/` harness as the gate for any model change.

## Consequences
- Zero marginal ASR cost; works in airplane mode.
- Hinglish accuracy is the main known weakness; mitigated by the dictionary, review UI, and an opt-in server Hinglish model later (ADR 0002).
- whisper.rn requires a dev build (no Expo Go).
- Model swaps are config + download, not app releases.

## Alternatives rejected
WhisperKit (no RN binding; same weights). SpeechAnalyzer as primary (iOS 26 floor, no custom vocabulary, Hindi unconfirmed) — revisit as an English-only option. Parakeet/Canary/Moonshine/distil (no Hindi). sherpa-onnx (thin RN binding maintenance today), revisit if IndicConformer or Qwen3-ASR proves much better on our set.
