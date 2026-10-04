# ADR 0015: Per-language speech models, prompts, voice detection and listening copies

Status: Proposed (speech engineer, 3 Oct 2026). Refines ADR 0001 and ADR 0012 for the seven v1.0 languages (founder decision 6), the lean app (decision 15) and audio quality (decision 8). Final for each language only after its golden-corpus check (TDD 03 7.3); the experiment harness stays the gate for any model change.

**Evidence key** (as ADR 0012). **V** = read on the cited page or file on 3 Oct 2026. **M** = measured by me on 3 Oct 2026 (method stated). **E** = estimate. **U** = unverified. Model-card numbers are the authors' own, on their own test sets, with their own text normalisation: they are not comparable across cards.

## Context

- Spoken letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese, each with correct script and punctuation (decision 6). Names must come out right (ADR 0012 bar: 95% after cleaning).
- On-device only through whisper.rn 0.7.4, which bundles whisper.cpp v1.9.3 (V: `node_modules/whisper.rn/src/version.json`). So a candidate must be a Whisper-architecture model convertible to ggml. Its `ParakeetContext` runs NVIDIA Parakeet only (no Hindi, ADR 0012).
- The app stays under 40 MB. Models download only when an author picks a language (decision 15), as packs of kind `speech-model` in the platform pack system (ADR 0016, `PackManifest` in `packages/api`).
- The original recording is never altered; a cleaner listening copy may be made (decision 8).

## 1. Findings per language

| Language | Shared turbo (large-v3-turbo q5_0, 574 MB, MIT) | Best whisper.rn-runnable alternative found | Verdict |
|---|---|---|---|
| English | Open ASR Leaderboard: large-v3 English average WER 7.44 (V, [S1]); turbo is near large-v2 overall ("performs similarly to large-v2", OpenAI [S2], V) | distil-large-v3.5 (English only, MIT): same 32-layer encoder, so no size saving (V-prior, ADR 0012); small.en q5_1 190 MB is weaker | **turbo** |
| Spanish | FLEURS 2.73, Common Voice 4.98, MLS 3.85 WER (large-v3: 2.30, 4.29, 3.47) (V, leaderboard data [S3]) | none clearly better | **turbo** |
| French | FLEURS 4.90, CV 11.06, MLS 4.22 (large-v3: 4.84, 9.97, 3.90) (V [S3]) | bofenghuang/whisper-large-v3-french (MIT, ggml provided): CV13 7.28, MLS 3.98, FLEURS 4.84, but 1.08 GB and 32 decoder layers; its turbo-sized `distil-dec4` (574 MB, MIT) is worse on FLEURS: 6.28 (V, model cards [S4]) | **turbo** (fine-tune not clearly better at the same size) |
| Portuguese | FLEURS 3.77, MLS 5.48 (large-v3: 3.50, 6.37) (V [S3]) | none clearly better | **turbo** |
| Arabic | Average over SADA, CV, MASC, MGB-2: WER 33.30 / CER 15.68 (large-v3 29.87 / 13.65) (V, Open Universal Arabic ASR Leaderboard [S5]) | oddadmix/whisper-large-v3-turbo-arabic-dialectal-v2 (Apache-2.0): 33.2% WER on its own dialect test split, one author, no independent number, undiacritized and unpunctuated training text (V, card [S6]); MohamedRashad code-switching model is GPL-3.0 (excluded) | **turbo**; the dialectal fine-tune is a corpus candidate only |
| Mandarin | AISHELL-1 CER 8.64, WenetSpeech meeting 20.31, HKUST 37.32 (V, Belle card [S7]) | BELLE-2/Belle-whisper-large-v3-turbo-zh (Apache-2.0 weights, official ggml f16): AISHELL-1 3.07, meeting 13.36, HKUST 18.94 on its in-domain sets (V [S7]) | **turbo with the Simplified prompt seed**; Belle is a built and hashed **candidate** (see M-1) |
| Hindi | Voice Arena Monsoon WER 40.79 (large-v3 28.17; IndicConformer 8.47; ARTPARK SraVaani 11.21) (V [S3]) | vasista22/whisper-hindi-small (Apache-2.0, 244M params, 190 MB q5_1): FLEURS 9.02, CV11 14.12 (card [S8]; FLEURS train was in its training data, so optimistic). Medium (FLEURS 6.82, 539 MB) and ARTPARK whisper-large-v3-vaani-hindi (Apache-2.0, FLEURS 11.20, 1.08 GB) are the larger options [S8][S9] | **whisper-hindi-small** once hosted (M-2); turbo until then |

Not runnable in whisper.rn, watch list: NVIDIA Nemotron 3.5 ASR streaming 0.6B (all seven languages, FLEURS Hindi 6.81 WER with language input, OpenMDW-1.1 licence, needs NeMo-Speech.cpp; V [S10]), AI4Bharat IndicConformer (MIT, NeMo), ARTPARK SraVaani-1.0 (MIT, gated, TDT). Each would need a second runtime in the app (binary size, maintenance), so not for v1.0.

### M-1. Mandarin check (M)

7 FLEURS `cmn_hans_cn` test clips (CC BY 4.0, read speech), whisper.cpp v1.9.3 CLI on CPU, greedy decoding, character error after removing punctuation and spaces. Script: `run_eval.py` (speech engineer's scratchpad; not committed: it reads public test audio only).

| Configuration | Character error | Clips with punctuation |
|---|---|---|
| turbo, no prompt | 15.1% | 1 of 7 |
| turbo, seed `以下是普通话的句子。` | **14.8%** | **7 of 7** (ASCII commas, full-width `。` and `、`) |
| Belle turbo-zh q5_0 (our build) | 19.7% | 7 of 7 (full-width) |

Without the one clip containing an English name, turbo with the seed and Belle tie at 11.4%. On that clip Belle wrote "Pamela Ferguson" as 帕梅拉弗格森 (33 errors against turbo's 18). A child named Asha in a Mandarin letter is exactly this case. Seven clips is a sanity check, not a benchmark, but it is enough to say Belle is not "clearly better" for this product: its published gains are on the corpora it was trained on. It stays built, hashed and listed as a candidate for the golden corpus.

### M-2. Hindi check (M)

6 FLEURS `hi_in` test clips, same harness, word error after removing punctuation (Unicode NFC, Devanagari marks kept).

| Configuration | Word error | CPU time, 6 clips | Sentence ends |
|---|---|---|---|
| turbo, no prompt | 30.2% | 308 s | 5 danda |
| turbo, seed `यह हिंदी में बातचीत है।` | 28.9% | 275 s | 15 danda |
| **whisper-hindi-small q5_1 (our build)** | **10.1%** | **115 s** | 0 danda, 8 ASCII full stops |
| whisper-hindi-small, seed | 10.7% | 130 s | 10 danda, 5 full stops |

Turbo misspells common Hindi words (आदर for आधार, कट्रोती for कटौती, भविश्य for भविष्य); the small fine-tune does not, at a third of the size and less than half the compute. Caveats: its training data includes FLEURS train and dev, so FLEURS test favours it; six clips of read speech say nothing yet about parents talking at a crib or about English names inside Hindi. It writes sentence ends as ASCII full stops; the seed brings back the danda in about two of three cases, and the Hindi language pack's punctuation profile should turn a full stop after Devanagari into `।` (a punctuation edit, allowed by the constitution). The decision holds only if the golden corpus agrees (bars: at least 10 points better than turbo on our Hindi clips, names 95%, no phantom words).

## 2. One shared model or one per language

The question: download one 574 MB multilingual model that serves all seven, or a model per language?

| Family speaks | Shared model only | This decision | Old plan (turbo for all) |
|---|---|---|---|
| English | 575 MB | **575 MB** | 575 MB |
| Spanish, French, Portuguese, Arabic or Mandarin (any mix, with or without English) | 575 MB | **575 MB** | 575 MB |
| Hindi only | 575 MB | **191 MB** | 575 MB |
| Hindi and English | 575 MB | **765 MB** | 575 MB |
| Any language, phone under 4 GB RAM | 191 MB (small) | **191 MB** | 191 MB |

(Exact bytes: turbo 574,041,195; Hindi small and Whisper small 190,085,487 each; Silero VAD 885,098, downloaded once with the first model. `speechPlan` in `src/lib/models/catalog.ts` computes this and is tested.)

**Decision:** one shared multilingual model for every language it serves well, and a language's own model only where it is clearly better. Today that is Hindi alone. This gives the smallest download for every one-language family, and the only two-language case that grows is Hindi with English, where turbo's Hindi is the weakest result in the table (Monsoon WER 40.8). A Hindi-English family can choose to stay on turbo (a Settings choice, v1.1) if 190 MB matters more than Hindi accuracy. Hindi-English code-switching mode is v1.1 (decision 6).

The mapping lives in the app (`LANGUAGE_MODELS`) with a fallback for every language to the shared model, so a language always works. **Request to the platform agent:** speech packs are entered with `required: false`, because `requiredPacksForLanguage` would otherwise pull every required `mul` pack (the shared model) for a Hindi-only family. The speech code asks for exactly the packs `speechPlan` names through `ensurePack`. If the mapping should become server-driven (to adopt a corpus winner without an app release, ADR 0001 "model swaps are config"), add an optional `serves: LanguageTag[]` to `PackEntry` for speech models; `catalog.ts` would then read it.

## 3. Prompts: script, punctuation and names (`src/lib/transcribe-prompt.ts`)

Every chunk gets its own prompt, because whisper.rn sets `no_context` and does not carry the prompt past the first 30 s of a call (TDD 03 3.5.1, V in source). The prompt is the family's spellings (child first), then a short **seed** in the language's own script and punctuation; Whisper continues the style of the text before it.

| Language | Seed | Why |
|---|---|---|
| English | none | already punctuated |
| Mandarin | `以下是普通话的句子。` | Simplified characters and punctuation (openai/whisper discussion 277 [S11]; M-1: 1 of 7 punctuated without it, 7 of 7 with it) |
| Traditional Chinese families | `以下是普通話的句子。` from the language pack | same, Traditional |
| Hindi | `यह हिंदी में बातचीत है।` | Devanagari and the danda (M-2) |
| Arabic | `هذه محادثة باللغة العربية، أليس كذلك؟` | Arabic comma and question mark |
| Spanish | `Esta es una conversación en español, ¿verdad?` | accents and inverted marks |
| French | `Voici une conversation en français, n'est-ce pas ?` | accents, French spacing |
| Portuguese | `Esta é uma conversa em português, não é?` | accents |

Rules: the seed is a neutral sentence about the language, never something a parent might say, so an echo is recognisable: `stripPromptEcho` drops a chunk that is (nearly) the whole seed or strips a seed at its start, and keeps any short fragment (a person may have said "español"). A chunk that is exactly the name list (two or more names) is dropped as an echo; a single name is always kept. These are the only removals besides non-speech tags, and they remove our words, never the person's. The language pack's prompt text (language agent) overrides the defaults. The cap (200 estimated tokens, under whisper.cpp's 224) always keeps the seed and drops the lowest-priority names first.

Script is never converted by the recogniser path: `translate: false`; Hindi in Devanagari comes from the language code `hi` plus the seed. Turning Mandarin's ASCII commas into full-width ones is a punctuation edit for the Mandarin language pack (allowed by the constitution), not a recogniser change.

## 4. Voice activity detection

Silero VAD v6.2.0 in ggml (885 KB, MIT), run through `initWhisperVad` / `detectSpeechData` over 5-minute windows of in-memory PCM. Settings (E, tuned on the corpus): threshold 0.5, 250 ms minimum speech, 300 ms minimum silence, 200 ms padding (Silero's 30 ms default clips word onsets). No speech anywhere means an empty transcript and Whisper never runs. It downloads with the first speech model rather than shipping in the app: it is useless without a recogniser, and decision 15 keeps models out of the binary.

## 5. Audio quality: the original and the listening copy

| Option | Licence and cost | What it does to the original | Verdict |
|---|---|---|---|
| Apple voice processing at record time (`AVAudioSession` mode `.voiceChat`, or `setVoiceProcessingEnabled` on an engine input) | system, 0 MB | **changes the original**: call processing (echo cancel, AGC, noise suppression) narrows the sound and removes what is not speech, a baby's laugh included. expo-audio 57 records in mode `.default` and does not expose the mode (V, expo-audio source) | **No.** The original stays as the microphone heard it |
| **AUSoundIsolation** audio unit, offline on a copy | system, public since iOS 16 (V, Apple docs [S12]); `HighQualityVoice` sound type on iOS 18 and later; 0 MB | none (reads only) | **Yes**: listening copy |
| RNNoise v0.2 | BSD-3-Clause (V [S13]); weights compile to about 3.5 MB (default model) or 1.6 MB (little) without debug floats (M: counted from `rnnoise_data.c`), or load as a data file | none, if run on a copy | fallback only if AUSoundIsolation fails on device |
| DeepFilterNet 3 | MIT or Apache-2.0 (V [S14]); Rust plus an ONNX runtime, no maintained iOS package, last tag v0.5.6 (U: date) | none, if run on a copy | no: build and maintenance cost (decision 1) |

**Decision:** record the original unprocessed; make the clearer listening copy with AUSoundIsolation (`src/lib/audio-enhance`, native `enhance` in `modules/scribe-audio`) after a recording's words are done, only while the app is open and no words are waiting. The player (`src/lib/player`) plays the copy when one matches and keeps the switch to the original. A launch sweep deletes any copy whose letter is gone. Wet/dry mix 80% by default so the room is softened, not erased (E, tune by ear). The copy lives in Application Support/listening, is excluded from backup, never exported or uploaded, and is matched to its original by SHA-256 (sidecar), as the player's contract requires.

Recording settings change (`VOICE_RECORDING_OPTIONS`, `src/lib/capture/recorder.ts`): **48 kHz** instead of 44.1 kHz, still AAC-LC mono 64 kbps (same size). The iPhone microphone runs at 48 kHz (no resample on the way in), 48 to 16 kHz is an exact 3:1 step for Whisper, and the isolation unit works on the native rate. ADR 0005 allows 44.1 or 48 kHz.

## 6. Decode, memory and binary size

- AAC M4A to 16 kHz mono PCM16 in memory (`decodePcm16`, AVAudioFile plus AVAudioConverter, a fresh converter per piece). Returned as an ArrayBuffer wrapping native memory (Expo `NativeArrayBuffer`, V in expo-modules-core 57 source): no copy and no file, which keeps LEGAL-REQ-018. whisper.rn reads 16-bit little-endian samples (V: `decodePcm16` in `RNWhisperJSI.cpp`). 28 s chunk = 0.9 MB; 5-minute VAD window = 9.6 MB.
- Resident memory while transcribing (E, measure in BL-043): turbo about 1 GB, small models about 0.4 GB. A phone under 4 GB RAM, or one where a large model was killed twice (a marker left by a job running at a kill), uses the compact tier.
- **Binary size** (M from the installed package, compressed with gzip -9 as a stand-in for App Store compression): whisper.rn arm64 framework 2.27 MB plus 0.62 MB of Metal kernel sources, about 0.97 MB compressed. ScribeAudio: Swift only, system frameworks (AVFoundation, AudioToolbox, CryptoKit), about 0.05 to 0.15 MB (E). AUSoundIsolation and VAD add nothing to the app. Total for this area: **about 1 MB of the 40 MB download** (E until the first thinning report, `docs/ops/APP_SIZE.md`).

## 7. Integrity and hosting

| Pack | Bytes | SHA-256 | Source, pinned | Built | Host |
|---|---|---|---|---|---|
| `speech-model.whisper-large-v3-turbo-q5_0` | 574,041,195 | `394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2` | ggerganov/whisper.cpp @ `5359861c` | upstream | Hugging Face |
| `speech-model.whisper-small-q5_1` | 190,085,487 | `ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb` | same | upstream | Hugging Face |
| `speech-model.silero-vad-v6.2.0` | 885,098 | `2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987` | ggml-org/whisper-vad @ `9ffd54a1` | upstream | Hugging Face |
| `speech-model.whisper-hindi-small-q5_1` | 190,085,487 | `6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f` | vasista22/whisper-hindi-small @ `fb4a24af` (`pytorch_model.bin` `a1912758...`) | ours | **ours, not uploaded** |
| `speech-model.belle-whisper-turbo-zh-q5_0` (candidate) | 574,041,195 | `bab0d61935b3f75e5435217eadfb1fceb6bcb09751b025a232e76ed33107747f` | BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml @ `0a7f5739` (`ggml-model.bin` `2a3bba5b...`) | ours | not uploaded |

How verified (M): upstream hashes from the Hugging Face API for the pinned revision (LFS object id) and again by downloading each file from the exact URL and hashing it; both agree. Built files: whisper.cpp **v1.9.3** (commit `371b5a75`, the version whisper.rn bundles) `whisper-quantize`. Re-quantizing upstream turbo f16 (`1fc70f77...`) with this tool reproduced upstream's q5_0 byte for byte (`394221709c...`), so the step is deterministic.

Recipe (anyone can reproduce the two hashes):

```bash
git clone --depth 1 --branch v1.9.3 https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=OFF && cmake --build build -j --target whisper-quantize
# Mandarin candidate: quantize the official f16
curl -L -o belle-f16.bin https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml/resolve/0a7f57392b773254eb60da8e49c7c683af369625/ggml-model.bin
build/bin/whisper-quantize belle-f16.bin ggml-belle-whisper-large-v3-turbo-zh-q5_0.bin q5_0
# Hindi: convert the Hugging Face checkpoint, then quantize
#   (python venv: torch 2.5.1 cpu, transformers 4.46.3, numpy; openai/whisper @ 86098128 for mel filters)
git clone https://github.com/openai/whisper openai-whisper
#   download config.json, pytorch_model.bin, vocab.json, merges.txt, added_tokens.json, normalizer.json,
#   special_tokens_map.json, tokenizer_config.json, preprocessor_config.json, generation_config.json
#   from https://huggingface.co/vasista22/whisper-hindi-small/resolve/fb4a24afc20c42906deed31c3689e4be31da41fe/ into hf-hindi-small/
python models/convert-h5-to-ggml.py hf-hindi-small openai-whisper out-hindi-small
build/bin/whisper-quantize out-hindi-small/ggml-model.bin ggml-whisper-hindi-small-q5_1.bin q5_1
sha256sum ggml-*.bin
```

Host (D-046, founder picks): upstream files can stay on their pinned Hugging Face revisions (free, Range requests work, V-prior). Files we build need our own zero-egress bucket; the catalog points them at `https://models.earlyletters.com/speech/<name>/<source revision>/<file>` and marks them `hosted: false` until uploaded, so nothing ever points at a missing file. Licences travel with the files: MIT (whisper.cpp models, Silero VAD) and Apache-2.0 (Hindi small, Belle) notices go in the app's acknowledgements screen.

**Training-data caution (U, counsel):** an Apache-2.0 licence on weights does not settle the terms of the data they were trained on. Belle lists AISHELL-2 and HKUST (LDC) among its sets; the Hindi small model lists GramVaani, ULCA, Shrutilipi and FLEURS. Counsel should confirm commercial use before either is uploaded.

## 8. Consequences

- A Hindi-only family downloads 191 MB instead of 575 MB, and gets a model trained for Hindi. Every other one-language family is unchanged (575 MB, or 191 MB on a small phone).
- Mandarin, Arabic and French accuracy rests on turbo plus prompts. The candidates stay one pack upload and one catalog line away, decided by the golden corpus, not by model cards.
- Every chunk of every language is decoded with the language set explicitly (no auto-detect flips between chunks) and with the family's names.
- The app gains about 1 MB; nothing else from this area ships in the binary.

## 9. What remains

| # | Item | Who |
|---|---|---|
| 1 | Run the golden corpus (TDD 03 7.3) per language; gates: names 95%, zero phantom words, script compliance 95%. Hindi small vs turbo vs medium; Belle and the Arabic dialectal model as candidates | speech + founder (recordings) |
| 2 | Upload the Hindi small file to the D-046 host, set `hosted: true` | founder |
| 3 | Counsel on training-data terms for the two built models | founder, counsel |
| 4 | Device measurements (BL-043): speed and memory per tier on iPhone SE 3, 12, 15; AUSoundIsolation offline render works and its latency compensation lines up; decode contract test | speech, on device |
| 5 | Golden-corpus seeds for Hindi and Arabic, and the Mandarin full-width comma rule, in the language packs | language agent |

## Sources (opened 3 Oct 2026)

- [S1] Open ASR Leaderboard paper, tables 3 and 4: https://arxiv.org/html/2510.06961v3
- [S2] OpenAI, large-v3-turbo announcement: https://github.com/openai/whisper/discussions/2363
- [S3] Open ASR Leaderboard multilingual results, `hf-audio/multilingual_evals` at revision `d2341ed252c0bc3f692b4dd02839f41d96673c3b`, files `multilingual_{es,fr,pt,hi}.csv`, referenced by https://huggingface.co/spaces/hf-audio/open_asr_leaderboard (`init.py`)
- [S4] https://huggingface.co/bofenghuang/whisper-large-v3-french ; https://huggingface.co/bofenghuang/whisper-large-v3-french-distil-dec4
- [S5] Open Universal Arabic ASR Leaderboard: https://arxiv.org/pdf/2412.13788
- [S6] https://huggingface.co/oddadmix/whisper-large-v3-turbo-arabic-dialectal-v2 ; https://huggingface.co/MohamedRashad/Arabic-Whisper-CodeSwitching-Edition
- [S7] https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh ; https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml
- [S8] https://huggingface.co/vasista22/whisper-hindi-small ; https://huggingface.co/vasista22/whisper-hindi-medium ; https://huggingface.co/collabora/whisper-large-v2-hindi (CC-BY-4.0, excluded)
- [S9] https://huggingface.co/ARTPARK-IISc/whisper-large-v3-vaani-hindi ; https://huggingface.co/ARTPARK-IISc/whisper-medium-vaani-hindi ; https://huggingface.co/ARTPARK-IISc/SraVaani-1.0
- [S10] https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b
- [S11] https://github.com/openai/whisper/discussions/277
- [S12] Apple: `kAudioUnitSubType_AUSoundIsolation`, `kAUSoundIsolationParam_WetDryMixPercent`, `kAUSoundIsolationParam_SoundToIsolate`, `kAUSoundIsolationSoundType_HighQualityVoice` (developer.apple.com/documentation/audiotoolbox); `AVAudioEngine.enableManualRenderingMode`; Apple Developer Forums thread 829792 (an Apple engineer: "AUSoundIsolation, a public Audio Unit that performs on-device voice isolation")
- [S13] https://github.com/xiph/rnnoise (COPYING; model `rnnoise_data-0a8755f8...tar.gz` from media.xiph.org)
- [S14] https://github.com/Rikorose/DeepFilterNet (README licence section)
- Model files: https://huggingface.co/ggerganov/whisper.cpp ; https://huggingface.co/ggml-org/whisper-vad ; FLEURS: https://huggingface.co/datasets/google/fleurs
