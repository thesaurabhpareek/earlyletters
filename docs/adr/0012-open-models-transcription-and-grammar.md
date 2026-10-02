# ADR 0012: Open models for transcription and light grammar (2026 refresh)

Status: Proposed. Date: 2026-10-02. Refines ADR 0001 (on-device ASR), 0002 (server ASR fallback) and 0003 (edit-pass model). Decision is final only after the founder's 14-recording experiment (`experiments/README.md`).

Evidence key: **V** = read on the cited page on 2026-10-02. **V-prior** = verified for ADR 0001 to 0003 on 2026-10-01 (sources in `docs/ARCHITECTURE.md`). **U** = unverified (not found, page not opened, or vendor self-report we could not check). **E** = our estimate from verified prices. Benchmarks quoted from model cards are the authors' own numbers on their test sets, not ours.

## Context
- Entries are parents talking to their child for 30 s to a few minutes, in Indian English with Hindi words and whole Hindi clauses (code-switching). Child names and nicknames must come out right.
- The constitution limits cleanup to removal and repair, every edit through `verifyEdits`. So a "grammar" model can only ever propose typed edits; it cannot rewrite.
- The web preview showed restarts left in place ("today you you held the spoon", "like a like a little hiccup"). Fixed deterministically in this change (see "Repeats" below), engine version 2.

## A. Speech to text

### On-device candidates (iPhone, Expo dev build)

| Model | Licence | Size | Hindi / Hinglish | iPhone path | Evidence |
|---|---|---|---|---|---|
| **Whisper large-v3-turbo, q5_0 (whisper.cpp)** | MIT (whisper.cpp, whisper.rn) | 574 MB file (q8_0 874 MB; f16 1.62 GB) | Multilingual. Base large-v3 scores 29.74% WER on CoSHE-500 Hinglish | whisper.rn (MIT): Core ML encoder iOS 15+, Silero VAD, "Extended Virtual Addressing" recommended for medium/large | sizes, licence, whisper.rn features V; CoSHE number V (from the Trelis card) |
| Whisper small, q5_1 | MIT | 190 MB | weaker than turbo | whisper.rn | V |
| Trelis/whisper-hinglish-preview | Apache 2.0 | large-v3 size (card: 2B params); q5_0 conversion size U | CoSHE-500 Hinglish 13.67% vs 29.74% base; Hindi 12.86% vs 30.82%; **English worse: 6.93% vs 4.81%**. Hindi in Devanagari, English in Latin, `<|mixedcode|>` token | convert to ggml, then whisper.rn like any Whisper. Not done yet (U) | V (card), conversion U |
| Oriserve/Whisper-Hindi2Hinglish-Prime | Apache 2.0 | large-v3 base (card: 2B params) | **Roman-script Hinglish output**. FLEURS 28.68 vs 50.84, Common Voice 32.43 vs 61.94, Indic-Voices 60.82 vs 82.56 (self-reported); ~550 h noisy Indian-accented training audio | as above (U) | V (card and vendor blog) |
| Qwen3-ASR 0.6B / 1.7B | Apache 2.0 | card says 0.9B params in BF16 for "0.6B" | Hindi among 30 languages; code-switching not claimed | no React Native runtime found; timestamps need a separate ForcedAligner model | V (card); RN path U |
| AI4Bharat IndicConformer 600M | MIT | 600M; ONNX available | 22 Indian languages; Hindi 13.2% WER (Vaani). Code-switching and punctuation output U | sherpa-onnx (thin community RN binding, V-prior) | V (card) |
| NVIDIA Parakeet TDT 0.6B v3 / Canary 1B v2 | CC-BY-4.0 | 0.6B / 978M | **No Hindi** (25 European languages) | Parakeet runs in whisper.rn | V |
| Moonshine (streaming tiny/small/medium, 34M to 245M) | MIT; non-streaming non-English models non-commercial | small | **No Hindi** in the listed languages | iOS library exists | V |
| distil-large-v3.5 | MIT | 756M | English only | | V-prior |
| Apple SpeechAnalyzer | proprietary, free | system | Hindi / en-IN U; no custom vocabulary | custom Expo module, iOS 26+ | V-prior |

On-device RAM and speed: no published iPhone benchmark for whisper.rn or whisper.cpp turbo was found (U). Published reference points: whisper.cpp lists ~3.9 GB RAM for unquantized large and ~852 MB for small (V); Argmax's compressed turbo (WhisperKit) keeps peak memory under 2 GB, measured on an M3 Max, not an iPhone (V); whisper.cpp says the Core ML encoder is "more than x3 faster" than CPU (V). Turbo has 4 decoder layers; the two Hinglish fine-tunes are full large-v3 with 32, so expect them to decode several times slower on device (E, to be measured).

### Hosted open-model fallbacks (audio leaves the phone; consent required, ADR 0002)

| Provider / model | Price | Per 1,000 min | Notes | Evidence |
|---|---|---|---|---|
| DeepInfra whisper-large-v3-turbo | $0.0002 / min | **$0.20** | Apache 2.0 weights; "zero retention"; word-level chunks | V |
| Cloudflare Workers AI whisper-large-v3-turbo | $0.000513 / min | $0.51 | VAD and initial-prompt options; word timestamps not stated | V |
| Groq whisper-large-v3-turbo | $0.04 / h | **$0.67** | word timestamps; 10 s minimum billed; 25 MB (free) / 100 MB (dev) files; ZDR toggle (V-prior) | V |
| Groq whisper-large-v3 | $0.111 / h | $1.85 | as above, more accurate on some languages | V |
| Hinglish fine-tunes, hosted | no serverless offer found | U | needs a dedicated GPU deployment; price U | U |
| Sarvam (Saarika) | API only, not open weights | n/a | excluded: not an open model | V (secondary source) |
| On-device whisper.rn | $0 marginal | $0 | one-time 574 MB model download per install | V |

10 s minimum billing barely matters for us: entries are usually longer than 10 s (E).

## B. Light punctuation and grammar

| Option | Licence | Size | What it can do under the constitution | Evidence |
|---|---|---|---|---|
| **Deterministic rules (shipped)** | ours | 0 | dictionary spellings, fillers, repeats (now phrase restarts too), sentence case, final period. Provably adds nothing | tests in `packages/core` |
| Whisper's own punctuation | | 0 | Whisper already emits punctuation and casing, so a punctuation model is mostly redundant on Whisper output | known behaviour; measured per recording in the experiment |
| oliverguhr/fullstop-punctuation-multilang-large | MIT | 0.6B (XLM-R) | punctuation only; **no Hindi**; trained on Europarl | V |
| AI4Bharat Cadence / Cadence-Fast | package MIT; weight licence U (Gemma 3 based, Gemma terms may apply) | 1B / 270M | punctuation only, English + 22 Indic languages, 30 classes. Output maps 1:1 onto `punctuation` edits, so it is verifier-safe by construction | V (paper, PyPI); weight licence U |
| Qwen3.5 0.8B / 2B / 4B / 9B (Mar 2026) | Apache 2.0 | under 2 GB at 4-bit for the small ones | JSON edit lists through `JsonModelEditProvider` (false starts, agreement, run-on sentence breaks). Constrained JSON via llama.rn on device (V-prior) | V (secondary source; HF cards not opened) |
| Hosted Qwen3.5-9B (DeepInfra) | Apache 2.0 | | $0.10 in / $0.15 out per M tokens; JSON mode U | V |
| Hosted gpt-oss-20b (Groq) | Apache 2.0 (U) | | $0.075 in / $0.30 out per M tokens; reasoning tokens add cost (U) | V (price) |
| Gemma 4 E2B | Apache 2.0 | Q4_0 GGUF 3.35 GB | too big beside Whisper on a phone | V-prior |

Cost of a hosted JSON edit pass per 1,000 minutes (E): ~140k spoken words is ~190k tokens, plus ~450 tokens of instructions per 1-minute entry (~450k), so ~650k input and ~60k output tokens: **about $0.07** on DeepInfra Qwen3.5-9B or Groq gpt-oss-20b (before reasoning tokens). Text only leaves the phone, not audio.

## Repeats (shipped with this ADR, engine version 2)
A doubled word is often grammatical: "I told you you were brave", "what it was was magic", "I gave her her bottle", "so so happy", "I love you, I love you". So `packages/core/src/repeats.ts` sorts every immediate repeat into three outcomes, each a type `repeat` removal that passes `verifyEdits`:
- **Removed:** function-word doubles that are never grammatical side by side (the, a, and, I, she, they...); phrase restarts whose repeated phrase ends in a word that cannot end a phrase (a, the, to, of, my...) and that continue in the same sentence ("like a like a little hiccup"); "you you" only in subject position (sentence or clause start, or after and/so/then/today...) and followed by more words; "was was" unless the sentence opens a pseudo-cleft (what, all, thing...).
- **Offered, not applied** (`CleanResult.suggestions`; the parent taps to accept, then it is verified again via `acceptSuggestions`): "so so", "in in", "my my", "is is", other "you you", repeated all-function-word phrases ("she is she is").
- **Kept, not even offered:** "had had", "that that", "her her", "you you" after a verb like told/promised/love, anything with a content word ("well done, well done"), one-word reduplication ("bye bye bye bye"), across a sentence break, inside quotes or a dictionary name.
Changes from version 1: "in in" and "so so" moved from removed to offered; "they they" now removed; "what it was was" no longer collapsed (a version 1 bug).

## Decision (proposed)
1. **On-device ASR stays whisper.rn + large-v3-turbo q5_0**, small q5_1 for low-RAM phones (ADR 0001). Pass the dictionary as the initial prompt. Run with language `auto` unless the experiment shows `en` is better for this family.
2. **Server fallback stays DeepInfra turbo ($0.20 / 1,000 min) and Groq turbo ($0.67)**, consented (ADR 0002). Order: Groq first for word timestamps and ZDR, DeepInfra second, unless DeepInfra word timestamps verify in testing, in which case it goes first on price.
3. **Hinglish:** add the two Apache 2.0 fine-tunes to the experiment now (`experiments/setup-hinglish.sh`). Adopt one only as an opt-in "Hindi-English" mode, and only if the experiment says so (below). If it wins but is too slow on device, offer it as a consented server re-transcription on a dedicated GPU, which needs its own cost ADR.
4. **Grammar: rules only for v1**, now including phrase restarts and tap-to-accept repeat suggestions. The model pass stays built and off. If the experiment shows it earns its place, turn on hosted Qwen3.5-9B (DeepInfra) through `JsonModelEditProvider`, fallback Groq gpt-oss-20b; later on-device Qwen3.5-2B via llama.rn. No punctuation-restoration model while we use Whisper; revisit Cadence-Fast only if a CTC model without punctuation (IndicConformer) is adopted.
5. **Watch, not now:** Qwen3-ASR (no RN runtime, no code-switching claim), IndicConformer (thin RN binding; script and code-switching unknown), Apple SpeechAnalyzer (Hindi unknown, no custom vocabulary).

**Fallback if the experiment goes badly:** if turbo misses the names bar even with dictionary prompting and `heardAs` corrections, try full large-v3 q5_0 on device, then Groq large-v3 ($1.85 / 1,000 min) as the consented server path, before considering any fine-tune of our own.

## What the 14-recording experiment must decide
Proposed bars; the founder can change them before running.

| Question | Recordings | How to read it | Bar |
|---|---|---|---|
| Does turbo get names and family words right? | 1 to 5 | `report.md` names column | at least 95% after cleaning |
| Is a Hinglish model needed, and which? | 6 to 10, plus 1 to 5 and 11 to 13 for regressions | word error per model, `en` vs `auto` | adopt a fine-tune only if it is at least 10 points better on 6 to 10 and no more than 2 points worse elsewhere |
| Which script do you want to read? | 6 to 10 | look at the text: Devanagari (Trelis) or Roman (Oriserve, and how you wrote `expected`) | the founder's call; it decides the model, the dictionary format and the printed book |
| Does it invent words in silence? | 14 | phantom words | zero, for every model; any hallucination disqualifies |
| Does a model edit pass help? | 11 to 13 (and all, via `npm run experiment:edits`) | word error after cleaning, blind A/B in `review.md`, `change_ceiling_exceeded` count | turn it on only if word error after cleaning drops by at least 2 points AND the founder prefers it in at least 2 of 3 letters |
| Are the repeat rules right for how you talk? | all | "Repeats offered" and every removed `repeat` in `edits.md` | no removed repeat the founder disagrees with; offered ones the founder would accept become candidates for rules |
| Is it fast enough? | all | seconds per recording on the Mac (proxy only) | then one measurement on a real iPhone in the dev build (RAM, seconds per minute of audio, heat) before shipping turbo; the Mac kit cannot answer this |

## Consequences
- Zero marginal cost on device; hosted fallback under $1 per 1,000 minutes; a model edit pass about $0.07 per 1,000 minutes if ever turned on.
- Every new model, ASR or grammar, enters through the experiment harness and every edit through `verifyEdits`; nothing here weakens the constitution.
- Entries cleaned under engine 1 keep `engine_version = 1` and can be re-derived with either engine.
- The review screen should show `suggestions` as tap-to-remove underlines (app work, not in this change).

## Sources opened 2026-10-02
- whisper.rn: https://github.com/mybigday/whisper.rn ; whisper.cpp (memory table, Core ML, licence): https://github.com/ggml-org/whisper.cpp ; model files: https://huggingface.co/ggerganov/whisper.cpp/tree/main
- Trelis/whisper-hinglish-preview: https://huggingface.co/Trelis/whisper-hinglish-preview
- Oriserve/Whisper-Hindi2Hinglish-Prime: https://huggingface.co/Oriserve/Whisper-Hindi2Hinglish-Prime ; https://oriserve.com/blog/oriserve-open-sources-india-focused-ai-speech-model-fine-tuned-on-whisper
- Qwen3-ASR-0.6B: https://huggingface.co/Qwen/Qwen3-ASR-0.6B
- IndicConformer: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
- Canary-1B-v2: https://huggingface.co/nvidia/canary-1b-v2 (Parakeet v3 languages via the whisper.rn README)
- Moonshine: https://github.com/moonshine-ai/moonshine ; https://moonshine-voice.readthedocs.io/en/latest/moonshine-vs-whisper/
- WhisperKit paper (memory, M3 Max): https://arxiv.org/html/2507.10860v1
- Groq speech-to-text: https://console.groq.com/docs/speech-to-text ; Groq models and prices: https://console.groq.com/docs/models
- DeepInfra turbo: https://deepinfra.com/openai/whisper-large-v3-turbo ; DeepInfra Qwen pricing: https://deepinfra.com/blog/qwen-api-pricing-2026-guide
- Cloudflare turbo: https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/
- Indian open voice models overview (Sarvam ASR API-only): https://caller.digital/blog/open-source-voice-ai-india-sarvam-ai4bharat-bhasini-2026
- fullstop-punctuation-multilang-large: https://huggingface.co/oliverguhr/fullstop-punctuation-multilang-large
- Cadence: https://arxiv.org/abs/2506.03793 ; https://pypi.org/project/cadence-punctuation/
- Qwen3.5 small models: https://artificialanalysis.ai/articles/qwen3-5-small-models
