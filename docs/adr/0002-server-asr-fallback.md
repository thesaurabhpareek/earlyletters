# ADR 0002: Server ASR fallback — hosted open Whisper via OpenAI-compatible API, consented

Status: Accepted. Date: 2026-10-01.

## Context
Some devices cannot run turbo; some users want text before the model downloads; some entries deserve a re-transcription with a better (e.g. Hinglish) model. Self-hosting GPUs is real ops work for a solo founder.

## Options (prices from pricing pages opened 2026-10-01)

| Provider | Model | Price | Word timestamps | Data terms |
|---|---|---|---|---|
| **Groq** | whisper-large-v3-turbo | $0.04 / audio hour; min billed 10 s; 25 MB free / 100 MB dev tier file limit; prompt ≤ 224 tokens [S10] | yes (`timestamp_granularities=word`) [S10] | Not retained by default; may log up to 30 days for reliability/abuse; Zero Data Retention toggle available [S26] |
| Groq | whisper-large-v3 | $0.111 / hour [S10] | yes | same |
| **DeepInfra** | whisper-large-v3-turbo | $0.0002 / min = $0.012 / hour [S12] | Unverified | "Zero retention" [S12] |
| Cloudflare Workers AI | whisper-large-v3-turbo | $0.0005 / min [S11] (model page: $0.000513 [S11]); 10k free neurons/day [S11] | not stated on model page; VTT segments [S11] | No training on customer content; not stored unless you use a storage product [S28] |
| Fireworks | Whisper v3 / turbo | per-minute price not shown on the pricing page opened [S49] | Unverified | Unverified |
| Self-host on GPU (whisper.cpp / WhisperX) | any incl. Hinglish fine-tune | GPU prices Unverified | WhisperX via wav2vec2 alignment, BSD-2 [S48] | yours |

Together and Replicate pricing pages could not be opened in this session (Unverified).

## Decision
- Fallback chain: **Groq whisper-large-v3-turbo (ZDR enabled) → DeepInfra turbo**. Both reached through the single `OpenAICompatibleProvider` in `packages/ai` behind a Supabase Edge Function that holds keys.
- Only after explicit consent (App Review 5.1.2(i) [S20]). Off by default for users who decline; app remains fully functional.
- Send the dictionary as `prompt`, request word timestamps, store results as a new `stt_meta` engine record; the raw transcript of an entry is set once (first successful ASR) and never overwritten; a re-transcription is stored as an alternative the author can choose before first save only.
- Revisit self-hosting (with the Apache 2.0 Hinglish Whisper fine-tune [S9]) when fallback spend exceeds roughly the cost of an always-available GPU, or when Hinglish quality demands a custom model.

## Consequences
Cost at 100k families ≈ $160–$530/month (ARCHITECTURE §7). Two vendors wired removes single-vendor risk. Audio leaves the device in this path; disclosed and consented.

## Alternatives rejected
Self-hosted GPU now (ops burden, idle cost). Closed APIs (OpenAI, Google) — not open models; not needed at these prices.
