# ADR 0003: Edit-pass model — rules first; hosted small open-weights LLM behind a flag; on-device later

Status: Accepted. Date: 2026-10-01.

## Context
`packages/core` already removes fillers, repeats and applies dictionary fixes deterministically, and its verifier rejects any model edit that adds meaning. An LLM can propose additional typed edits (false starts, agreement, punctuation) as JSON. Future uses: safety second pass, prompt suggestions from structured data, search.

## Options

| Option | Licence | Fit | Notes |
|---|---|---|---|
| Apple Foundation Models (on-device) | proprietary, free | `@Generable` guided generation gives typed output [S21] | Apple Intelligence devices only [S21]; needs a custom Expo module; Hindi Unverified |
| Qwen3-1.7B via llama.rn | Apache 2.0 [S22]; llama.rn MIT, JSON-schema/GBNF constrained output, Metal, Expo plugin [S23] | Good for structured edits | ~1 GB+ download (Unverified size), RAM contention with Whisper |
| Gemma 4 E2B via llama.rn | Apache 2.0 since Apr 2026 [S24][S25] | 140+ languages, 128K ctx [S25] | Q4_0 GGUF is 3.35 GB [S25] — too big to ship alongside Whisper |
| Llama 3.2 1B/3B | Llama community licence (custom terms; page not opened, Unverified) | OK | Avoid: non-standard licence |
| **Hosted Qwen3.5-9B (DeepInfra)** | Qwen (Apache 2.0 for Qwen3 [S22]; 3.5 Unverified) | OpenAI-compatible JSON mode (Unverified) | $0.10 / $0.15 per M tokens [S33] |
| Hosted gpt-oss-20b / Qwen3 30B (Cloudflare) | Unverified | — | $0.20/$0.30, $0.051/$0.335 per M [S11] |
| Fireworks generic < 4B / 4–16B | — | — | $0.10 / $0.20 per M tokens [S49] |

## Decision
1. **v1 default: rules only.** Phase 0 measures how many real errors remain after dictionary prompting + rules. Only if the residual is material, turn on the LLM pass.
2. **When on: hosted Qwen3.5-9B on DeepInfra**, fallback Cloudflare gpt-oss-20b, through `AIProvider.json()` with a registered JSON Schema; output validated, then every edit through `verifyEdits()`. Consent required. Cost ≈ $0.003/family/month.
3. **Later:** on-device via llama.rn + Qwen3-1.7B (Apache 2.0) or Apple Foundation Models where available, chosen by device capability in the router. Same interface, same verifier.
4. Prefer Apache 2.0 / MIT weights; avoid custom-licence models.

## Consequences
The model is never trusted: it proposes, code decides. Swapping models is a config change. Hosted path means text (not audio) leaves the device for this feature only.

## Alternatives rejected
On-device LLM in v1 (download size and RAM on top of a 574 MB ASR model). Closed frontier APIs (not needed for a constrained JSON task; cost and vendor lock-in).
