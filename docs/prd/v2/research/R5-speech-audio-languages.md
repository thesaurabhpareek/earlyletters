# R5 Speech, audio and languages fact base

Status: desk research complete, 3 Oct 2026. Author: speech and audio research agent. Not committed.

Feeds: F05 transcription and language packs, F06 faithful edit, F07 dictionary, F08 recordings, F19 pack delivery.

**Evidence labels** (`_AUTHORING.md` section 6): **[F]** fact from a page opened today (R5-S#) or a repo check run today; **[S]** signal (forum post, vendor blog, third-party run); **[A]** assumption; **[R]** recommendation. **Unverified** = could not open or confirm. **Inferred** = my reasoning from sourced facts, not a published number. **V-prior** = verified in an earlier repo doc (ADR 0001 to 0012, TDD 03), not re-opened today.

**How to read error rates.** WER is word error rate; CER is character error rate (used for Chinese, which has no spaces between words). Test sets, text normalisers and audio differ between sources, so compare only inside one column or one source. FLEURS and Common Voice are read sentences, not a parent talking to a baby at bedtime, so every number here is a best case for us [Inferred].

## 0. Bottom line

1. **[R] Five languages are realistic at v1.0 on an SE 3 with one shared model**, Whisper large-v3-turbo q5_0 (574 MB [F, R5-S16]): English, Spanish, French, Portuguese and Mandarin. A third-party FLEURS run gives turbo 5.49 WER (en), 3.62 (es), 5.97 (fr), 5.44 (pt) and 7.97 CER (zh) [S, R5-S9]. Mandarin also needs a simplified-script step and Chinese-aware rules. Caveat: no turbo speed on an A15 is published in any runtime, so the PRD 30 s gate for a 2-minute letter is still unproven (section 2.2).
2. **[R] Hindi needs a second, Hindi-tuned model.** Base turbo scores 29.64 WER on FLEURS Hindi [S, R5-S9]. Open fine-tunes reach 11 to 13: ARTPARK large-v3 Vaani Hindi 11.20 (Apache 2.0) [F, R5-S40], Trelis 12.57 (Apache 2.0) [F, R5-S39], IndicWhisper medium 11.4 (MIT) [F, R5-S42]. All are full-decoder models; the published A15 speed for full large-v3 is 1.42 times real time [F, R5-S44], so a 2-minute letter would take about 85 s. Hindi at v1.0 is conditional on an SE 3 speed and memory test.
3. **[R] Arabic is not realistic at v1.0.** Parents speak dialect. Whisper large-v3 averages 29.87 WER over five multi-dialect sets [F, R5-S35]; a vendor benchmark shows 46.14 Gulf and 58.64 Levantine [S, R5-S36]. The best open turbo dialect fine-tune reports 34.4 WER on its own test set [F, R5-S34]. Founder decision needed (section 9).
4. **[F] Memory on 4 GB A15 phones is the hard limit.** Argmax marks uncompressed large-v3 and large-v3-turbo "Not Supported" on iPhone 13 (A15) and supports only its compressed builds (626 MB to 954 MB) [R5-S43]. The SE 3 has an A15 [R5-S47] and 4 GB by third-party analysis [R5-S48].
5. **[F] Apple SpeechTranscriber is iOS 26 and later only** [R5-S18], so it cannot serve our iOS 17 floor. It costs no app download and runs outside app memory [R5-S23]. Launch languages listed by a secondary source cover en, es, fr, pt and zh, not Hindi or Arabic [S, R5-S26]. Watch item for v1.1, not v1.0.
6. **[F] The faithful-edit engine and the experiment scorer are not ready for Hindi, Arabic or Chinese** (checked today in a scratch copy): Devanagari words split at every vowel sign; a `punctuation` edit that turns बेटी (beti, daughter) into बेटा (beta, son), or Arabic أنتِ (anti, you, feminine) into أنتَ (anta, you, masculine), passes `verifyEdits`; Chinese ？ and Arabic ؟ bypass the sentence-type guard. These would let the machine gender the child. Fix before any non-English pack (section 4.4).
7. **[R] Pure hesitation sounds are auto-removed; word fillers are only offered.** Most fillers in the six non-English languages are real words (Spanish "este" means "this", Mandarin 那个 nage means "that"), and a corpus study had to filter out the demonstrative use of "este" by hand [F, R5-S59].
8. **[R] Listening copy: record the original with no voice processing, then make the listening copy afterwards, on the phone, from the saved original.** Apple voice processing at capture alters the only signal we keep, apps cannot choose Voice Isolation (the user does) [F, R5-S76, R5-S77], and expo-audio exposes none of it [F, R5-S80].
9. **[F] Keep AAC-LC mono 64 kbps M4A** (ADR 0005): 0.48 MB per minute (arithmetic). Opus plays on iOS only inside CAF or WebM [F, R5-S89], a weak export for families. A listening copy doubles audio to 0.96 MB per minute.
10. **[R] Gate each language on its own experiment** before it appears in the picker: 10 adult speakers, 4 letters each, real bedtime noise, scored on WER or CER after cleaning, names, script, phantom words, and seconds per audio minute plus memory on an SE 3 (section 8.2).

## 1. Per-language transcription candidates

### 1.1 Cross-language reference numbers

| Language | large-v3, FLEURS (Qwen card) [R5-S7] | large-v3, Open ASR multilingual average [R5-S4] | large-v3-turbo, FLEURS, third-party [R5-S9] | Qwen3-ASR 1.7B, same run [R5-S9] | Parakeet TDT 0.6B v3, FLEURS [R5-S6] | Canary 1B v2, Open ASR average [R5-S4] |
|---|---|---|---|---|---|---|
| English | 4.08 | separate track | 5.49 | 4.49 | 4.85 | separate track |
| Hindi | not listed | not in track | 29.64 | 13.19 | not supported | not supported |
| Spanish | not listed | 3.32 | 3.62 | 3.38 | 3.45 | 3.22 |
| Mandarin | 4.09 (CER) | not in track | 7.97 (CER) | 6.49 (CER) | not supported | not supported |
| French | not listed | 6.59 | 5.97 | 4.57 | 5.15 | 4.86 |
| Arabic | not listed | not in track | 15.72 | 14.32 | not supported | not supported |
| Portuguese | not listed | 4.38 | 5.44 | 5.17 | 4.76 | 6.23 |

Notes:
- R5-S9 is a blog run by the Whisper Notes team (25 Aug 2026, M5 MacBook Air, FLEURS test split, about 150 sentences and 30 minutes per language, CER for Chinese) [F]. It is the only source found that puts turbo, Hindi and Arabic on one table, so it is a signal, not a paper.
- Open ASR multilingual figures are averages over its datasets as of 8 Oct 2025 [F, R5-S4].
- Argmax's own on-device harness (Common Voice 17, language forced) scored its compressed 626 MB large-v3-turbo build at 12.66 (en), 45.58 (hi), 33.32 (es), 25.34 (zh), 20.75 (fr), 96.64 (ar), 14.93 (pt) [S, R5-S46]. These are far above the other columns (normaliser unknown), but the ranking agrees: Hindi and Arabic are the weak pair. The "v20240930" build name is OpenAI's turbo release [Inferred].
- Per-language FLEURS tables for Whisper small and medium sit in the Whisper paper appendix [R5-S3], which the fetch tool could not read today. Small and medium per-language numbers are Unverified except Arabic (section 1.2).
- Licences: the Hugging Face card for large-v3 states Apache-2.0 [F, R5-S1]; the card for large-v3-turbo states MIT, 809M parameters, decoder cut from 32 layers to 4, and uneven quality across languages [F, R5-S38]. Both permissive.

### 1.2 Per language

#### English (en)

| Candidate | Error rate | Licence | Size on disk | iPhone runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 5.49 FLEURS [R5-S9] | MIT [R5-S38] | 574 MB [R5-S16] | whisper.rn [R5-S14] |
| small q5_1 | per-language Unverified | MIT (Inferred, same family) | 190 MB [R5-S16] | whisper.rn |
| Parakeet TDT 0.6B v3 | 4.85 FLEURS; punctuation, capitals and word timestamps built in [R5-S6] | CC-BY-4.0 [R5-S6] | GGUF size Unverified | whisper.rn 0.7.0 and later [R5-S11, R5-S14]; no initial prompt [R5-S14] |
| distil-large-v3 (English only) | A15 speed 4.97 times real time on Argmax's runtime [R5-S44] | MIT (V-prior) | 594 MB Core ML build [R5-S44] | WhisperKit (Swift) |
| Apple SpeechTranscriber | Argmax figure 14.0 vs WhisperKit small 12.8 on earnings calls (V-prior, ADR 0001) | system | 0 in app [R5-S23] | custom Expo module, iOS 26+ [R5-S18] |

Script: Latin; US versus UK spelling is a pack setting. **Realistic at v1.0 on turbo.** Parakeet is a good English-only alternative but loses name prompting.

#### Hindi (hi)

| Candidate | Error rate | Licence | Size on disk | iPhone runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 29.64 FLEURS [R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 (base) | FLEURS 27.50, Common Voice 30.82 [R5-S39] | Apache-2.0 [R5-S1] | q5_0 1.08 GB [R5-S16] | whisper.rn; too large for 4 GB A15 uncompressed [R5-S43] |
| ARTPARK-IISc whisper-large-v3-vaani-hindi | FLEURS 11.20, Common Voice 13.84, Kathbath 8.85, Kathbath noisy 11.80, Vaani 24.66, Gramvaani 25.11; about 718 h of Hindi [R5-S40] | Apache-2.0 [R5-S40] | about 1.08 GB at q5_0 (Inferred from large-v3) | whisper.rn after ggml conversion (Unverified) |
| Trelis whisper-hinglish-preview (fine-tuned from the ARTPARK model) | FLEURS-hi 12.57, Common Voice Hindi 12.86; **FLEURS-en 6.93 vs 4.81 base** [R5-S39] | Apache-2.0 [R5-S39] | about 1.08 GB at q5_0 (Inferred) | conversion script in `experiments/setup-hinglish.sh`, not yet run (repo) |
| IndicWhisper Hindi (Vistaar, Whisper **medium**) | Kathbath 10.3, Kathbath-Hard 12.0, FLEURS 11.4, Common Voice 15.0, IndicTTS 7.6, MUCS 12, Gramvaani 26.8 [R5-S42]; lowest WER on 39 of 59 Vistaar sets, Interspeech 2023 [R5-S37] | MIT, applies to all fine-tuned models [R5-S10] | about 539 MB at q5_0 (Inferred from `ggml-medium-q5_0` [R5-S16]) | whisper.rn after conversion (Unverified) |
| Qwen3-ASR 0.6B | 19.12 FLEURS [R5-S8] | Apache 2.0 [R5-S7] | 0.9B parameters [R5-S7] | no iOS runtime listed [R5-S7] |
| IndicConformer 600M | 13.2 on Vaani (V-prior) | MIT (V-prior) | 600M | sherpa-onnx (V-prior) |
| Apple SpeechTranscriber | Hindi absent from the launch list [S, R5-S26] | | | |

One reading of the rendered Vistaar page swapped the FLEURS and Common Voice columns; the raw README table above was used [F, R5-S10, R5-S42].

Script issues:
- **Urdu script for Hindi speech.** Hindi and Urdu are mutually intelligible when spoken; a user reported Whisper returning Urdu for Hindi audio [S, R5-S27]. A study found Whisper-medium wrote the wrong script for 95% of Punjabi and 100% of Sindhi utterances [F, R5-S29]; Hindi was not tested there. [R] Always pass `language: "hi"` for a Hindi letter, never `auto`, and never transliterate afterwards (B-REQ-003).
- **English loanwords in Devanagari** when `hi` is forced (TDD 03 3.5.6, unmeasured). Acceptable in v1.0 Hindi mode; code-switching is v1.1 (brief B4).
- Short Hindi phrases transcribe worse than long ones (user report) [S, R5-S28]; our name-check clips are 3 s (TDD 03 3.9).
- Danda । (U+0964) is the Devanagari phrase separator [F, R5-S69]. Which mark Whisper and the fine-tunes emit at sentence end is Unverified.

**Conditional at v1.0.** Base turbo at about 30 WER is not keepsake quality; the fine-tunes are, if the SE 3 can run one.

#### Spanish (es)

| Candidate | Error rate | Licence | Size | Runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 3.62 FLEURS [R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 | 3.32 Open ASR [R5-S4] | Apache-2.0 | 1.08 GB | whisper.rn |
| Parakeet TDT 0.6B v3 | 3.45 FLEURS [R5-S6]; 3.72 Open ASR [R5-S4] | CC-BY-4.0 | Unverified | whisper.rn |
| Canary 1B v2 | 3.22 Open ASR [R5-S4] | CC-BY-4.0 (V-prior) | 978M (V-prior) | none on iOS found |
| Qwen3-ASR 0.6B | 7.16 Common Voice [R5-S8] | Apache 2.0 | 0.9B | none on iOS |
| Apple SpeechTranscriber | listed [S, R5-S26] | system | 0 | iOS 26+ |

Script: accents and ñ; opening marks ¿ and ¡ are obligatory in Spanish and must not be dropped in imitation of other languages [F, R5-S70]. Whether Whisper emits them consistently is Unverified. **Realistic at v1.0.**

#### Mandarin Chinese (zh)

| Candidate | Error rate | Licence | Size | Runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 7.97 CER FLEURS [R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 | 4.09 CER FLEURS [R5-S7]; AISHELL-1 8.085, AISHELL-2 5.475, WenetSpeech Net 11.72, Meeting 20.15 CER [R5-S31] | Apache-2.0 | 1.08 GB | whisper.rn |
| BELLE-2 Belle-whisper-large-v3-zh | AISHELL-1 2.781, AISHELL-2 3.786, WenetSpeech Net 8.865, Meeting 11.246, HKUST 16.440 CER [R5-S31] | Apache 2.0 [R5-S31] | about 1.08 GB at q5_0 (Inferred) | whisper.rn after conversion (Unverified) |
| Qwen3-ASR 0.6B | 2.88 FLEURS zh vs 4.09 large-v3; 22 Chinese dialects [R5-S7] | Apache 2.0 | 0.9B | none on iOS |
| Apple SpeechTranscriber | "Chinese" listed [S, R5-S26] | system | 0 | iOS 26+ |

Script and punctuation:
- Whisper uses one `zh` code and may write simplified or traditional characters. The maintainer's advice is an initial prompt in the wanted script, for simplified 以下是普通话的句子 (yixia shi putonghua de juzi, "the following are Mandarin sentences"); users also convert after the fact with OpenCC [F, R5-S30]. Punctuation in the prompt changes output punctuation [F, R5-S30].
- OpenCC is Apache 2.0, dictionary-based and deterministic, with a pure JavaScript port (opencc-js) [F, R5-S32].
- Simplified Chinese punctuation is full width: ，(U+FF0C) 、(U+3001) 。(U+3002) ？(U+FF1F) ！(U+FF01) ：(U+FF1A) ；(U+FF1B), per GB/T 15834-2011 [F, R5-S66].
- BELLE is a full 32-layer-decoder model; expect several times slower decoding than turbo [Inferred, R5-S38].

**Realistic at v1.0 on turbo** with the simplified prompt, a script step and Chinese-aware rules.

#### French (fr)

| Candidate | Error rate | Licence | Size | Runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 5.97 FLEURS [R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 | 6.59 Open ASR [R5-S4] | Apache-2.0 | 1.08 GB | whisper.rn |
| Parakeet TDT 0.6B v3 | 5.15 FLEURS [R5-S6]; 5.38 Open ASR [R5-S4] | CC-BY-4.0 | Unverified | whisper.rn |
| Canary 1B v2 | 4.86 Open ASR [R5-S4] | CC-BY-4.0 | 978M | none on iOS |
| Qwen3-ASR 0.6B | 12.25 Common Voice [R5-S8] | Apache 2.0 | 0.9B | none on iOS |
| Apple SpeechTranscriber | listed [S, R5-S26] | system | 0 | iOS 26+ |

Script: accents and œ, ç. French publishing rules put a no-break space before : ; ? ! and inside « » [F, R5-S71]. **Realistic at v1.0.**

#### Arabic (ar)

| Candidate | Error rate | Licence | Size | Runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 15.72 FLEURS (read Modern Standard Arabic) [S, R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 | 29.87 WER, 13.65 CER averaged over SADA, Common Voice 18, MASC clean and noisy, MGB-2 [F, R5-S35]; Egyptian 28.25, Gulf 46.14, Levantine 58.64, Arabic-English 36.90 [S, R5-S36] | Apache-2.0 | 1.08 GB | whisper.rn |
| medium / small | 39.60 / 52.18 on the same leaderboard [F, R5-S35] | | 539 MB / 190 MB | whisper.rn |
| oddadmix whisper-large-v3-turbo-arabic-dialectal | 34.4 WER, 11.5 CER vs base turbo 59.0 WER, 27.8 CER on its own 932 clips (Levantine, Maghrebi, Egyptian, Gulf, Sudanese, Iraqi, MSA) [F, R5-S34] | Apache-2.0 [R5-S34] | about 574 MB at q5_0 (Inferred) | whisper.rn after conversion (Unverified) |
| NVIDIA Conformer-CTC-large-Arabic + 4-gram LM | 25.71 WER, 10.02 CER, leaderboard best [F, R5-S35] | Unverified | Unverified | none on iOS found |
| Cohere Transcribe Arabic | 25.87 overall; Egyptian 19.16, Gulf 24.36, Levantine 39.78 (vendor's internal sets) [S, R5-S36] | Apache 2.0, 2B parameters [R5-S36] | 2B | on-device not stated |
| Qwen3-ASR 0.6B | 45.99 Common Voice [R5-S8] | Apache 2.0 | 0.9B | none on iOS |
| Apple SpeechTranscriber | absent from launch list [S, R5-S26]; "transcription.ar asset not found" reports [S, R5-S24, R5-S25] | | | |

Dialect and script:
- Fine-tuning on MSA gave little benefit for dialects; one pooled-dialect model did nearly as well as per-dialect models [F, R5-S33].
- The dialect fine-tune calls itself a private internal model to evaluate on your own data, and outputs undiacritised text [F, R5-S34].
- Arabic comma ، (U+060C), semicolon ؛ (U+061B), question mark ؟ (U+061F) and full stop ۔ (U+06D4) [F, R5-S67]; text runs right to left while numbers run left to right, handled by the Unicode bidi algorithm [F, R5-S68]. Short-vowel marks (harakat, U+064B to U+0652) [F, R5-S67] can carry gender.

**Not realistic at v1.0** on any open on-device model found: about 30 to 60 WER on dialect speech against about 4 to 6 for the European languages.

#### Portuguese (pt)

| Candidate | Error rate | Licence | Size | Runtime |
|---|---|---|---|---|
| large-v3-turbo q5_0 | 5.44 FLEURS [R5-S9] | MIT | 574 MB | whisper.rn |
| large-v3 | 4.38 Open ASR [R5-S4] | Apache-2.0 | 1.08 GB | whisper.rn |
| Parakeet TDT 0.6B v3 | 4.76 FLEURS; trained on European Portuguese while most benchmarks are Brazilian [F, R5-S6]; 5.95 Open ASR [R5-S4] | CC-BY-4.0 | Unverified | whisper.rn |
| Canary 1B v2 | 6.23 Open ASR [R5-S4] | CC-BY-4.0 | 978M | none on iOS |
| Qwen3-ASR 0.6B | 11.30 Common Voice [R5-S8] | Apache 2.0 | 0.9B | none on iOS |
| Apple SpeechTranscriber | "Portuguese", variety not stated [S, R5-S26] | | | |

Variety: the 1990 spelling agreement kept two graphic systems, European and Brazilian [F, R5-S73]. Whisper has no variety switch [Inferred]. [R] The pack holds the author's variety for dictionary and punctuation only; the engine never converts one variety's spelling into the other (that would be rewording). **Realistic at v1.0.**

### 1.3 Summary for an SE 3

| Language | v1.0 on SE 3 | Model | Reason |
|---|---|---|---|
| English | Yes | turbo (shared) | about 5 WER |
| Spanish | Yes | turbo (shared) | about 3.5 WER |
| French | Yes | turbo (shared) | about 6 WER |
| Portuguese | Yes | turbo (shared) | about 5 WER; variety caveat |
| Mandarin | Yes, with script step | turbo + simplified prompt + OpenCC | about 8 CER |
| Hindi | Conditional | IndicWhisper medium (MIT) or ARTPARK / Trelis large-v3 (Apache 2.0), converted | base about 30 WER; fine-tunes 11 to 13; SE 3 speed and memory unknown |
| Arabic | No, founder decision | dialect turbo fine-tune at best | about 30 to 60 WER on dialects |

## 2. On-device runtime facts

### 2.1 whisper.rn and whisper.cpp

| Fact | Value | Source |
|---|---|---|
| whisper.rn latest | 0.7.4, MIT | [F, R5-S12] |
| 0.7.4 publish date | 27 Aug 2026 | Inferred from the registry timestamp returned with R5-S12 |
| Installed here | `whisper.rn ~0.7.4`, `expo ~57.0.26`, `expo-audio ~57.0.5` | [F, `apps/mobile/package.json`] |
| Recent releases | 0.7.2 (24 Jul 2026); 0.7.0 (19 Jul 2026, Parakeet); 0.6.0 (14 May 2026, full JSI) | [F, R5-S11] |
| whisper.cpp latest | v1.9.4 dated "11 Sep", year not shown; 1.9.0 added Parakeet; 1.9.2 maps token timestamps to original time with VAD on; 1.9.4 server returns language in its detect response | [F, R5-S13]; year Unverified |
| Licences | whisper.cpp MIT [R5-S15]; whisper.rn MIT [R5-S14] | [F] |
| Expo | needs prebuild (dev build) | [F, R5-S14] |
| Core ML | iOS 15+; `<model>-encoder.mlmodelc` beside the ggml file | [F, R5-S14] |
| Core ML speed | "more than x3 faster" than CPU only, on Apple Silicon | [F, R5-S15] |
| Core ML encoder downloads | turbo 1.17 GB, large-v3 1.18 GB, medium 568 MB, small 163 MB | [F, R5-S16] |
| VAD | Silero via `initWhisperVad` | [F, R5-S14] |
| Word timestamps | "experimental", via max segment length 1 | [F, R5-S15]; whisper.rn maps `tokenTimestamps`, `maxLen` (V-prior, TDD 03 3.5.1) |
| Name biasing | `initialPrompt` for Whisper, not Parakeet | [F, R5-S14] |
| Prompt scope | whisper.rn forces `no_context`; prompt biases the first 30 s of each call | V-prior, TDD 03 3.5.1 |
| Logit bias | not among the JSI-mapped options | V-prior, TDD 03 3.5.1 |
| Memory | Extended Virtual Addressing recommended for medium and large on iOS | [F, R5-S14] |
| RAM table, unquantised | small about 852 MB, medium about 2.1 GB, large about 3.9 GB | [F, R5-S15] |
| iPhone benchmark | none published for whisper.rn or whisper.cpp; whisper.cpp shows a real-time demo video on iPhone 13 | [F, R5-S14, R5-S15] |

Model files [F, R5-S16]: large-v3-turbo 1.62 GB f16, 874 MB q8_0, 574 MB q5_0; large-v3 3.1 GB f16, 1.08 GB q5_0; medium 1.53 GB f16, 539 MB q5_0; small 488 MB f16, 264 MB q8_0, 190 MB q5_1; base 148 MB f16, 59.7 MB q5_1.

### 2.2 iPhone SE 3 feasibility

| Item | Value | Source |
|---|---|---|
| SoC | A15 Bionic, 6-core CPU (2 performance, 4 efficiency), 4-core GPU, 16-core Neural Engine | [F, R5-S47] |
| RAM | 4 GB, from third-party software analysis; Apple publishes no figure | [F, R5-S48] |
| Same-SoC device support (Argmax, iPhone 13, A15) | compressed builds supported on iOS 18.5: large-v3 v20240930 626 MB, v20240930 turbo 632 MB, large-v3 947 MB, large-v3 turbo 954 MB; every uncompressed large-v3 and turbo build "Not Supported"; small supported | [F, R5-S43] |
| iPhone 12 mini (A14, 4 GB) | no large variant supported; small supported | [F, R5-S43] |
| Speed on A15 (iPhone 13 Pro, Argmax Core ML runtime) | full large-v3 947 MB: 1.42 times real time; small: 10.4; distil-large-v3 594 MB (2 decoder layers, English): 4.97; distil turbo 600 MB: 7.8 | [F, R5-S44] |
| Speed definition | audio length divided by end-to-end latency; 10-minute LibriSpeech and Earnings22 subsets | [F, R5-S45] |
| Newer reference | iPhone 16 Pro: small 18.29, large-v2 2.16 | [F, R5-S44] |

What this means for a 2-minute letter (PRD 7.7 gate: 30 s on SE 3):

| Model class | A15 speed | 2-min letter | Status |
|---|---|---|---|
| Full large-v3 decoder (ARTPARK, Trelis, BELLE) | 1.42 times [F, R5-S44] | about 85 s (arithmetic) | Fails the gate; memory risk [R5-S43] |
| Turbo (4 decoder layers) | not published; Inferred near distil-large-v3 (2 layers, 4.97 times) and well above full large-v3 | about 25 to 40 s (Inferred) | At the edge, as TDD 03 5.1 estimated |
| Medium (IndicWhisper, 24 decoder layers) | not published; Inferred between small (10.4) and full large (1.42) | unknown | Must measure |
| Small | 10.4 times [F, R5-S44] | about 12 s | Passes; quality too low for hi and ar [R5-S35] |

Naming caveat: Argmax also lists "large-v3/turbo/954MB" at 1.52 times real time on the iPhone 13 Pro [F, R5-S44]. Its size is almost the same as full large-v3 (947 MB), so it is Inferred to be Argmax's own encoder optimisation with the full 32-layer decoder, not OpenAI's 4-layer turbo; OpenAI's turbo is the "v20240930" family (626 MB, 632 MB), which has no A15 speed entry. If that inference is wrong, turbo on A15 is near 1.5 times real time and fails the 30 s gate; BL-043 settles it.

Caveats: these are Argmax's Core ML (Neural Engine) builds, not whisper.cpp on Metal; the iPhone 13 Pro has a 5-core GPU and more RAM than the SE 3 (RAM Unverified) [Inferred]. No published whisper.cpp number exists for any A15 device. TDD 03 section 5 budgets stay estimates until BL-043.

### 2.3 Alternatives

| Runtime | Licence | Fit | Source |
|---|---|---|---|
| WhisperKit (in "Argmax OSS Swift") | MIT | word and segment timestamps, VAD chunking, prompt text, language detection; recommends a 626 MB large-v3 build; custom vocabulary only in the paid Pro SDK; no React Native binding | [F, R5-S17] |
| WhisperKit compression | | turbo compressed from 1.6 GB to 0.6 GB within 1% WER; measured on M3 Max only | [F, R5-S93] |
| Apple SpeechTranscriber | free, system | iOS 26+; `supportedLocales`, `installedLocales`, `isAvailable` [R5-S18]; model in system storage, outside app size and memory, `audioTimeRange` per run [R5-S23] | [F] |
| Apple DictationTranscriber | free, system | iOS 26+, "compatible with older devices", same models as on-device SFSpeechRecognizer; supports `contextualStrings` biasing and custom language models [R5-S20, R5-S21] | [F] |
| sherpa-onnx | licence not shown on the page read (Unverified) | iOS and Swift, ASR, VAD, keyword spotting, language identification, speech enhancement [R5-S91]; thin community RN binding (V-prior) | [F] |
| Qwen3-ASR | Apache 2.0 | strong in Hindi and Chinese, but only transformers and vLLM runtimes listed [R5-S7] | [F] |
| MLX Swift | not checked | | Gap |

[R] Stay on whisper.rn for v1.0: it is installed, MIT, maintained (four releases since May 2026), and the only option with a React Native binding and name prompting. Plan a custom Expo module for SpeechTranscriber in v1.1 for iOS 26+ devices in en, es, fr, pt and zh, behind the same `Transcriber` interface.

Permission: LEGAL-REQ-007 forbids the speech-recognition permission (TDD 03 3.1). The WWDC sample asks only for microphone permission [F, R5-S23] and the SpeechAnalyzer overview does not mention authorisation [F, R5-S22]; whether it needs `NSSpeechRecognitionUsageDescription` is still Unverified (TDD 03 OQ-6 stands).

### 2.4 Choosing the model per letter (language identification)

- Whisper detects language itself (`auto`), and whisper.cpp exposes detection [F, R5-S13]. Whether whisper.rn 0.7.4 has a detect-only call is Unverified. sherpa-onnx offers spoken language identification [F, R5-S91].
- Auto-detection is risky for Hindi (Urdu script) [S, R5-S27, F, R5-S29].
- [R] The author sets one or two letter languages at first run (F03). Each letter records with the author's default; a one-tap language chip on the record screen switches it. The chip picks the model and pack. No auto-detection in v1.0. If whisper.rn exposes detection, use it only as a warning ("this sounded like Spanish") after transcription, never to switch silently.

## 3. Name phonetics and vocabulary biasing

| Method | What is known | Use in v1.0 |
|---|---|---|
| Initial prompt | Names and spellings in the prompt steer Whisper's output; only the final 224 tokens count; prompt style carries into output [F, R5-S49] | Yes: per chunk (TDD 03 3.5.5), in the letter's script |
| Prompt script | A simplified-Chinese prompt steers simplified output [F, R5-S30] | Chinese pack prompt opens with a simplified sentence; Hindi with a Devanagari one |
| Logit or shallow-fusion biasing | Not exposed by whisper.rn (V-prior). Contextual biasing for Whisper needs an extra trained component (TCPGen) [F, R5-S50]. Plain zero-shot prompting is limited; a fine-tune on 670 h of English gave 45.6% better rare-word recognition [F, R5-S51] | No (needs training or runtime changes) |
| Apple contextual strings | `AnalysisContext.contextualStrings` (iOS 26) [F, R5-S21]; DictationTranscriber documents it [F, R5-S20]; SpeechTranscriber support Unverified | v1.1 engine only |
| Post-hoc phonetic correction | Today `soundsLike` in `packages/core/src/meaning.ts` uses English letter rules only [F, repo] | Yes, per-script tables in the pack, feeding `stt_fix` with the verifier bound from BL-064 |

Per-script phonetic matching for `stt_fix` candidates (pack phonetic tables, brief B13):

| Script / language | Algorithm | Licence and source | Note |
|---|---|---|---|
| Latin, English | Double Metaphone (Philips, C/C++ Users Journal, June 2000): primary and secondary codes, handles names of Slavic, Germanic, Celtic, Greek, French, Italian, Spanish and Chinese origin [F, R5-S52] | npm `double-metaphone`, MIT [F, R5-S53] | e.g. Smith and Schmidt share a code [F, R5-S52] |
| Latin, es / fr / pt | Accent-folded comparison plus Double Metaphone secondary codes [Inferred] | as above | Validate on a names list per language |
| Devanagari and romanised Hindi | IndicSOUNDEX: 9 Indic languages plus English; 95.71% matching the same word across Indic and Latin script [F, R5-S55] | paper only; code licence Unverified | Port its rules into a pack table |
| Chinese | Compare toneless pinyin of the heard characters with the name's pinyin [Inferred] | `pinyin-pro`, MIT, tone marks, polyphonic handling, surname mode [F, R5-S54] | Homophones are common, so require a learned `heardAs` before auto-fix |
| Arabic | Soundex adapted to Arabic names exists, no accuracy figures published [F, R5-S56]; consonant-skeleton match ignoring harakat [Inferred] | paper only | Low confidence |

[R] Data model: a dictionary term needs one spelling per script it appears in (the child "Asha" and आशा, Asha). Today `DictionaryTerm.term` is one string [F, `packages/core/src/types.ts`]. Add per-script forms (new). The parent teaches each form; the machine never transliterates a name in a letter. Name-check clips (B-REQ-017) run once per language the author records in.

## 4. Punctuation, fillers and stumbles per language

### 4.1 Filler inventories (pack `fillers` table)

Classes: **auto** = removed by rule as `filler` (pure hesitation sounds, no word meaning); **offer** = shown as a tap-to-remove suggestion, never auto-applied, like the repeat suggestions in ADR 0012 (the word also has a real meaning); **keep** = never touched.

| Language | auto | offer | Evidence |
|---|---|---|---|
| English | um, umm, uh, uhh, uhm, erm, er, hmm, mm (shipped list) | none today ("like", "you know" kept on purpose) | [F, `packages/core/src/text.ts`] |
| Hindi | hmm; other pure sounds (written forms Unverified) | मतलब (matlab, "meaning"), वो ना (woh na, "that"), क्या कहते हैं (kya kehte hain, "what do you call it") | Listed but uncited [S, R5-S60]; Hindi markers mark hesitation, repair and hedging [F, R5-S63] |
| Spanish | eh, mm | este ("this"), o sea ("I mean"), pues ("well") | este and eh as hesitation markers, with demonstrative "este" filtered out by hand [F, R5-S59]; o sea, este cited [S, R5-S60] |
| Mandarin | 呃 (e), 嗯 (en) | 那个 (nage, "that"), 这个 (zhege, "this"), 就是 (jiushi) | Filled pauses uh, mm, nage, zhege; nage 4.51 and zhege 2.17 per 1,000 words, demonstratives the largest class [F, R5-S57]; na-zhe words act as discourse markers [F, R5-S58]; jiushi Unverified |
| French | euh, hum | ben, bah ("well"), quoi ("what"), genre ("like") | euh and hum as filled pauses [F, R5-S64]; filled pauses cluster with discourse markers [F, R5-S65]; euh "most common", ben, bah, quoi uncited [S, R5-S60] |
| Arabic | eh, mm (written forms Unverified) | يعني (yaani, "it means"), والله (wallah, "by God") | yaani is a frequent Cairene discourse marker with focusing functions [F, R5-S61]; yaani and wallah cited [S, R5-S60] |
| Portuguese | é (as hesitation), hum | né ("isn't it"), tipo ("like"), então ("so"), aí ("then") | né, aí, bom, assim as Rio discourse markers [F, R5-S62]; é, hum, então, tipo uncited [S, R5-S60] |

Notes:
- Offer-class words carry meaning in many sentences (aí as "then", wallah as an oath, este as "this"), so auto-removal would breach the constitution [Inferred].
- Whether Whisper writes hesitation sounds at all, or drops them, is Unverified per language; measure the share of reference fillers present in raw.
- The `filler` verifier accepts only words on `FILLERS`, an English set in code [F, repo]; the list must come from the pack per letter language.

### 4.2 Stumbles and repeats

`packages/core/src/repeats.ts` lists English function words for always-remove and suggest-only repeats [F, repo]. These lists are English grammar and must become pack data. [R] For v1.0 non-English packs: remove nothing by repeat rule automatically; offer exact immediate doubles of a word as suggestions. Reduplication is grammatical in Hindi and Mandarin (for example 慢慢 manman, "slowly") [Inferred], so a generic "remove doubles" rule would change words. Native-speaker review signs off each pack's repeat tables.

### 4.3 Punctuation profiles (pack `punctuation` table)

| Language | Marks | Spacing and direction | Source |
|---|---|---|---|
| English | . , ? ! ; : straight quotes | none | `packages/content` rules (no curly quotes) |
| Hindi | । danda (U+0964) phrase separator; ॥ (U+0965) | left to right | [F, R5-S69]; whether ? ! , are used in Hindi letters: pack decision, Unverified |
| Spanish | ¿ ? ¡ ! obligatory pairs | none | [F, R5-S70] |
| Mandarin | ，、。？！：； full width, one character cell | no spaces | GB/T 15834-2011 via W3C [F, R5-S66]; quote marks Unverified |
| French | no-break space before : ; ? ! and inside « » | narrow no-break vs regular no-break is a printer choice | [F, R5-S71] |
| Arabic | ، ؛ ؟ ۔ | right to left; digits left to right; Unicode bidi | [F, R5-S67, R5-S68] |
| Portuguese | as Spanish without opening marks | none | [Inferred] |

Conflict to raise: GB/T 15834 Chinese quotation marks are typographic double quotes [A, not confirmed today], and `packages/content` bans curly quotes. Founder or content owner decides whether letter text in Chinese is exempt (entry text is the parent's, not product copy).

### 4.4 Engine readiness for seven scripts [F, checked today]

I copied `packages/core/src/*.ts` to my scratchpad and ran `verifyEdits`, `tokens` and `normalizeChars` (Node 22). No repo file changed.

| # | Finding | Input | Result | Effect |
|---|---|---|---|---|
| E1 | `WORD_RE` in `text.ts` matches `\p{L}\p{N}` but not marks `\p{M}`; Devanagari vowel signs are marks [R5-S69] | मेरी प्यारी बेटी (meri pyari beti) | tokens म, र, प, य, र, ब, ट | Hindi fillers, repeats, `splits_word` and the change ceiling miscount |
| E2 | `lettersOnly` ignores marks | `punctuation` edit बेटी to बेटा (daughter to son), source `model` | **accepted** | Genders the child |
| E3 | Same for Arabic harakat | أنتِ to أنتَ (you, feminine to masculine) | **accepted** | Genders the child |
| E4 | `moodMarks` checks only `? ! ¿ ¡` | 。 to ？; . to ؟ | **accepted** | Statement becomes a question |
| E5 | Chinese has no spaces, so a clause is one token | 那个 inside 宝贝那个我今天很想你 | rejected `splits_word` | Chinese fillers removable only before punctuation |
| E6 | Adding ¿ counts as a mood change | Estás bien? to ¿Estás bien? | rejected `changes_sentence_type` | Spanish opening marks can never be added |
| E7 | `normalizeChars` turns no-break and narrow no-break spaces into plain spaces | Tu viens ? Oui ! | plain spaces | French line breaks before ? and ! |
| E8 | `experiments/score.ts` `normWords` uses the same regex | मेरी प्यारी बेटी; 我今天很想你，宝贝。 | split letters; clause-level "words" | Hindi WER and Chinese WER are meaningless in the harness today |
| Control | | "You did it." to "You did it?" | rejected | ASCII path works |

[R] Before any non-English pack: tokenise with `[\p{L}\p{M}\p{N}]`; segment Chinese with a word segmenter (`Intl.Segmenter` in Hermes on iOS is Unverified) or work on characters; compare letters **with** marks in `punctuation`; add ？ ！ ؟ to mood marks; allow ¿ or ¡ only where the same sentence already ends in ? or !; keep NNBSP in French final text; add a `script` edit type limited to a pack whitelist (OpenCC traditional-to-simplified pairs) for Chinese; score Chinese by CER. Each change bumps `ENGINE_VERSION` with tests named after the constitution rule (CLAUDE.md).

## 5. Noise suppression and voice processing

### 5.1 Apple voice processing

| Fact | Source |
|---|---|
| Voice processing gives echo cancellation, noise suppression and automatic gain control, tuned per device model and audio route | [F, R5-S76] |
| Enabled with `setVoiceProcessingEnabled(true)` on the `AVAudioEngine` input node; method available iOS 13+ | [F, R5-S76, R5-S74] |
| Input node controls: `isVoiceProcessingBypassed`, `isVoiceProcessingAGCEnabled`, `isVoiceProcessingInputMuted`, ducking configuration | [F, R5-S75] |
| For apps using voice processing, users control the mic mode: Standard, Voice Isolation, Wide Spectrum | [F, R5-S76] |
| `AVCaptureDevice.preferredMicrophoneMode` is read-only: the mode the user picks in Control Center (iOS 15+) | [F, R5-S77] |
| `showSystemUserInterface(.microphoneModes)` only opens the system panel for the user | [F, R5-S78] |
| No public API switches an app to Voice Isolation | [S, R5-S79] |
| expo-audio exposes `allowsRecording`, `playsInSilentMode`, `shouldPlayInBackground`, `interruptionMode`, `shouldRouteThroughEarpiece`, `allowsBackgroundRecording`, input selection, and recording options; no voice processing, echo cancellation or session mode | [F, R5-S80] |

So at record time we could only get voice processing through a new Expo module built on `AVAudioEngine`, the processed signal would be the only one captured, and Voice Isolation would stay the user's choice.

### 5.2 Open-source suppression

| | RNNoise | DeepFilterNet 3 |
|---|---|---|
| Licence | BSD [F, R5-S81] | MIT or Apache-2.0, dual [F, R5-S83] |
| Sample rate | 48 kHz, 20 ms windows, 10 ms hop [F, R5-S81] | 48 kHz only [F, R5-S83] |
| Size | 87,503 weights, 8-bit with no loss [F, R5-S81]: about 85 KB (arithmetic) | Core ML build 2.2 MB INT8, 4.2 MB FP16 [F, R5-S86]; 2.17M parameters [F, R5-S87] |
| Compute | about 40 Mflops; 1.3% of one x86 core; 14% of a Raspberry Pi 3 core [F, R5-S81] | RTF 0.19 single-thread notebook CPU [F, R5-S85]; RTF 0.12 to 0.13 on M2 Max via Core ML [F, R5-S86]; 34.9 times real time on an Apple Silicon Mac [F, R5-S87] |
| Delay | 10 ms hop (offline use makes delay irrelevant) | 30 ms algorithmic delay [F, R5-S87] |
| iOS port | C library, build ourselves [Inferred] | third-party Core ML conversions on Hugging Face, iOS 17+ [F, R5-S86] |
| Last release | 0.2, dated "April 15", year not shown [F, R5-S82] | v0.5.6, 31 Aug 2024 [F, R5-S84]: **fails the brief's 12-month release rule** |
| A15 speed | Unverified; Inferred well under 1 s per audio minute | Unverified |

### 5.3 Recommendation [R]: make the listening copy after recording

1. Record the original as today: expo-audio, AAC-LC mono 64 kbps, no voice processing. The original stays the true room sound (brief 8).
2. After save and after transcription, create the listening copy on the phone from the original file: decode, denoise, encode as a second M4A. Run in the foreground queue used for transcription (TDD 03 3.5.4); no background work.
3. Transcribe from the original. Whether denoising helps or hurts Whisper is Unverified; test both in the experiment before changing this.
4. Start with RNNoise (BSD, tiny, Xiph-maintained). Evaluate DeepFilterNet 3 against it; adopt it only if the listening test prefers it and the founder accepts the maintenance risk.
5. Playback defaults to the listening copy when one exists, with a visible "Original" switch; export includes both, named clearly.

Reasons: one capture path with no custom audio engine; the original is never processed, so a better denoiser later can regenerate the copy; the copy is deletable to save space; the result can be compared with the original. Product risk: denoisers may suppress a baby's babble or a lullaby, which parents may treasure [Inferred]; the listening test must include those sounds.

Recording sample rate: both denoisers run at 48 kHz [F, R5-S81, R5-S83]; `listen.tsx` records 44.1 kHz (V-prior, TDD 03 3.2). [R] Record at 48 kHz (expo-audio has a `sampleRate` option [F, R5-S80]) to avoid a resample; confirm AAC 48 kHz mono 64 kbps on device.

## 6. Audio format and storage

| Format | Per minute | iOS capture and playback | Export | Verdict |
|---|---|---|---|---|
| **AAC-LC M4A, mono 64 kbps** | 0.48 MB (64,000 x 60 / 8) | expo-audio `outputFormat` MPEG4AAC with `sampleRate`, `numberOfChannels`, bit rate [F, R5-S80]; `HIGH_QUALITY` preset is 44.1 kHz stereo 128 kbps, so keep the custom preset [F, R5-S80] | plays everywhere (ADR 0005) | **Keep** |
| Opus, mono 24 kbps | 0.18 MB | Xiph suggests 24 kb/s mono for audiobooks and podcasts, 10 to 24 for VoIP [F, R5-S88]; Safari and iOS play Opus only in CAF (iOS 11+, constant bit rate) or, in newer versions, WebM [F, R5-S89]; not an expo-audio recording option [F, R5-S80] | CAF is Apple-centric; Ogg not listed for Safari | No |
| ALAC (lossless) | 48 kHz 16-bit mono PCM is 5.76 MB per minute (arithmetic); ALAC is 40 to 60% of the original for music [F, R5-S90], so about 2.3 to 3.5 MB (Inferred) | plays on all current iOS devices; Apache 2.0 since 2011; libavcodec and Windows 10 support [F, R5-S90] | good | Optional archival export only |

Storage at ARCHITECTURE's assumption of 40 audio minutes per active family per month: original 19.2 MB per month; with listening copy 38.4 MB (arithmetic). A 3-minute letter is 1.44 MB, or 2.88 MB with its copy.

## 7. Model and pack delivery sizes

Packs are JSON (filler, repeat, negation and punctuation tables, phonetic rules, prompt text). Estimate: under 100 KB each, except Chinese, which also carries an OpenCC simplified table and pinyin data (sizes Unverified, estimate under 5 MB) [Inferred]. Silero VAD is bundled (TDD 03, under 1 MB, Unverified).

| Language | Plan A: shared turbo only | Plan B: turbo + Hindi fine-tune | Plan C: iOS 26+ SpeechTranscriber where it covers the language (v1.1) |
|---|---|---|---|
| English | 574 MB (model) + pack in app | same | 0 app download; system asset size Unverified |
| Spanish, French, Portuguese | 574 MB + under 100 KB | same | as above |
| Mandarin | 574 MB + under 5 MB (Inferred) | same | as above |
| Hindi | 574 MB, about 30 WER | 539 MB (IndicWhisper medium q5_0) or 1.08 GB (ARTPARK / Trelis q5_0), Inferred from base sizes [R5-S16] | not covered [S, R5-S26] |
| Arabic | 574 MB, about 30 to 60 WER | dialect turbo fine-tune about 574 MB (a separate file; weights differ) | not covered |

Two-language authors (one model in memory at a time, TDD 03 3.5.4):

| Pair | Plan A | Plan B |
|---|---|---|
| English + Spanish (any two of en, es, fr, pt, zh) | 574 MB once | 574 MB once |
| English + Hindi | 574 MB (Hindi weak) | 574 + 539 = 1.11 GB, or 574 + 1,080 = 1.65 GB |
| English + Arabic | 574 MB (Arabic weak) | 574 + 574 = 1.15 GB |

On a 64 GB SE 3 [F, R5-S47] storage is fine; the cost is download time (about 95 s per 574 MB on 50 Mbps Wi-Fi, TDD 03 5.4) and egress. The Core ML encoder (1.17 GB for turbo [F, R5-S16]) is not worth it on the SE 3.

## 8. Recommendation per language [R]

### 8.1 Per language

| Language | Model (v1.0) | Size | Expected quality (published, read speech) | Fallback | Experiment pass bar |
|---|---|---|---|---|---|
| English | turbo q5_0, `language: en` | 574 MB | about 5 WER | typed letter; audio-only save with words later (TDD 03 FM-9) | WER after cleaning 10% or less; names 95%+ |
| Spanish | turbo, `es` | shared | about 3.5 WER | same | WER 10% or less; ¿ ¡ present where ? ! end a sentence in 90%+ (Unverified baseline) |
| French | turbo, `fr` | shared | about 6 WER | same | WER 10% or less |
| Portuguese | turbo, `pt`; variety stored in pack | shared | about 5 WER | same | WER 10% or less on the author's variety (test both) |
| Mandarin | turbo, `zh`, simplified prompt, OpenCC `script` edit | shared + pack | about 8 CER | same | CER 10% or less; simplified characters 99%+ after the script edit |
| Hindi | IndicWhisper medium (MIT) first; ARTPARK large-v3 (Apache 2.0) on 6 GB+ phones if medium fails quality | 539 MB to 1.08 GB extra | 11 to 15 WER | same; on SE 3, "recording kept, words later" if the speed bar fails | WER 15% or less; Devanagari 95%+ (TDD 03 7.3); 2-min letter in 30 s on SE 3 or a founder-approved relaxed bar |
| Arabic | none at keepsake quality; see section 9 | | 30 to 60 WER on dialects | audio-first Arabic letters, typed text by the parent | WER 20% or less on the author's dialect group before it is offered |

Every language keeps the existing hard gates: zero phantom words on noise-only clips, names 95%+ after cleaning (ADR 0012).

A weak transcript is costly because `raw_transcript` is immutable once saved (CLAUDE.md). [R] For any language still below its bar, the transcript stays a draft candidate (TDD 03 C-4) and the parent chooses "save words" or "keep the recording only"; the latter leaves raw empty, to be filled once by a better model later.

### 8.2 Experiment plan (extends `experiments/`)

| Item | Plan |
|---|---|
| Harness fixes first | Fix E8 (marks in `normWords`; CER for Chinese); add a per-phrase `language` field to `config.local.json` (today one global `language`, [F, `experiments/config.example.json`]); run `setup-hinglish.sh` conversion path for IndicWhisper, ARTPARK and the Arabic dialect model |
| Speakers | 10 consenting adult native speakers per language (TDD 03 7.3 privacy rules: scripted fictional "Asha" letters, private bucket); Arabic: at least 3 dialect groups x 4 speakers; Portuguese: 5 Brazilian, 5 European |
| Clips per speaker | 3 scripted letters of about 2 minutes, each with the child's name, nicknames and two family names, plus 1 unscripted 1-minute letter; bedtime conditions (low voice, white-noise machine, baby sounds) on an iPhone |
| Noise clips | 5 per language with no speech (hallucination gate) |
| Total | about 40 clips and 80 minutes per language |
| Metrics | WER (CER for zh) on raw and after cleaning; names exact after cleaning; script compliance; sentence-final punctuation per profile; filler presence in raw; phantom words; repetition loops; seconds per audio minute and peak memory on an SE 3 (30 runs, p90); jetsam count |
| Statistics | per-speaker bootstrap 95% interval; a model wins only if its interval is better on the primary metric |
| Listening copy | 20 noisy clips (including babble and singing), original vs RNNoise vs DeepFilterNet 3, blind preference by 5 listeners, plus ASR WER on original vs denoised |
| Pass bars | section 8.1 table; zero phantom words; zero jetsam in 30 SE 3 runs |

## 9. Risks to the seven-language decision and options for the founder

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| K1 | Hindi fine-tunes too slow or too large for a 4 GB A15 (full large-v3 at 1.42 times real time [R5-S44]; uncompressed large not supported on A15 [R5-S43]) | High / High | Test medium first; device-gate Hindi; audio-first fallback |
| K2 | Arabic dialect quality far below keepsake level | High / High | Founder options below |
| K3 | Engine lets edits gender the child or flip mood in hi, ar, zh (E1 to E4) | Certain if packs ship unchanged / Critical | Fix before packs; BL-064 hardening |
| K4 | Benchmarks are read speech; whispered bedtime letters, singing and baby noise untested in every language | Medium / High | Section 8.2 corpus |
| K5 | QA load: seven packs, seven native reviewers, seven test corpora | Certain / Medium | Ship languages in waves as each passes |
| K6 | Model egress and download time for 0.5 to 1.7 GB per author | Medium / Medium | Hugging Face pinned revision or zero-egress host (TDD 03 OQ-3) |
| K7 | Chinese script mixing and quote marks vs content rules | Medium / Low | Prompt, OpenCC edit type, content-rule exemption decision |
| K8 | Portuguese variety mismatch in spelling | Medium / Low | Variety in pack; never auto-convert |
| K9 | DeepFilterNet unmaintained since Aug 2024 [R5-S84] | Medium / Low | RNNoise first |
| K11 | Turbo itself misses the SE 3 30 s gate or its memory budget (no A15 number exists; Argmax's uncompressed turbo fails on A15 [R5-S43], though that is a 1.6 GB build, not our 574 MB q5_0) | Medium / High for all languages | BL-043 first; fallbacks in TDD 03 5.1 (small on SE 3, or relax the gate) |
| K10 | Server fallback unavailable at v1.0 (AI gateway is v1.1, ARCHITECTURE status box) | Certain / Medium for hi and ar | Audio-first save; re-transcribe later |

Options:
- **Option A [R]:** v1.0 picker offers English, Spanish, French, Portuguese and Mandarin. Hindi joins when its experiment passes on the SE 3 (possibly v1.0, possibly v1.1). Arabic letters can be recorded and kept with typed text from day one; transcription arrives in v1.1.
- **Option B:** all seven at v1.0, with Hindi and Arabic labelled "early" and their transcripts kept as drafts. Risk: weak raw transcripts in keepsakes if parents save them.
- **Option C:** device-gate Hindi to 6 GB+ phones running a large-v3 fine-tune; SE 3 owners get audio-first Hindi. Splits the experience by phone.

## 10. Gaps

Could not open (not retried): `huggingface.co/CohereLabs/cohere-transcribe-03-2026`, the aibusiness.com Cohere article, `github.com/xiph/rnnoise` (also robots-blocked for tags), the W3C RNNoise talk and `gitlab.xiph.org` COPYING (HTTP 429 from the fetch proxy); `npmjs.com` and `api.github.com` (403); the HAL page for Kosmala and Crible (access denied); the Whisper paper appendix (not readable by the tool).

Unverified and owned by BL-043 or the experiment:
- Any whisper.cpp or whisper.rn speed or memory figure on an A15; turbo speed on A15 in any runtime.
- Memory of medium and large-v3 q5_0 on a 4 GB phone; ggml conversion of IndicWhisper, ARTPARK, BELLE and the Arabic dialect model.
- Whether whisper.rn 0.7.4 exposes language detection.
- Official SpeechTranscriber locale list, SE 3 support, permission requirement, and whether SpeechTranscriber honours `contextualStrings`.
- Per-language FLEURS numbers for Whisper small and medium (except Arabic).
- Whether Whisper writes fillers, ¿ ¡, danda, Arabic harakat, or Portuguese variety spelling.
- Peer-reviewed filler inventories for Hindi, French ben and bah, Portuguese tipo, Mandarin jiushi (only uncited listings found).
- Chinese quotation-mark standard; `Intl.Segmenter` in Hermes; OpenCC and pinyin-pro data sizes.
- RNNoise and DeepFilterNet speed on A15; whether denoising helps or hurts Whisper.
- whisper.cpp v1.9.4 year; RNNoise 0.2 year; sherpa-onnx licence; MLX Swift not checked; Cohere Transcribe on-device feasibility.

Repo documents now out of date:
- ARCHITECTURE section 6 "Whisper weights MIT (Unverified)": large-v3 card says Apache-2.0 [R5-S1], turbo card says MIT [R5-S38].
- ADR 0001 and 0012 "SpeechAnalyzer: no custom vocabulary": Apple now documents `AnalysisContext.contextualStrings` (iOS 26) [R5-S21] and DictationTranscriber biasing [R5-S20]; Hindi absent and Arabic failing per secondary sources [R5-S25, R5-S26].
- ADR 0005 "Opus not native": iOS plays Opus in CAF and WebM [R5-S89]; the decision stands.
- TDD 03 3.5.6 defaults a skipped language to `auto`; for seven languages use an explicit letter language (section 2.4).
- TDD 03 3.5.8 tiers: add the Argmax evidence that uncompressed large models fail on A15 4 GB phones [R5-S43].
- `packages/core` `FILLERS`, `REPEAT_*`, `WORD_RE`, `lettersOnly`, `moodMarks`, `normalizeChars` and `experiments/score.ts` are English-only (section 4.4).
- Brief B6 "and/or Apple voice processing": apps cannot choose Voice Isolation, and expo-audio has no voice processing (section 5.1).

## 11. Sources

All opened 3 Oct 2026. Ids R5-S41 and R5-S92 are unused (a page read but not relied on, BuzzASR/hindi, whose card figures were internally inconsistent).

- R5-S1 Whisper large-v3 card: https://huggingface.co/openai/whisper-large-v3
- R5-S2 large-v3 announcement (per-language numbers only in an image): https://github.com/openai/whisper/discussions/1762
- R5-S3 Whisper paper, abstract and HTML (appendix unreadable): https://arxiv.org/abs/2212.04356 ; https://arxiv.org/html/2212.04356 ; https://ar5iv.labs.arxiv.org/html/2212.04356
- R5-S4 Open ASR Leaderboard paper: https://arxiv.org/html/2510.06961v3
- R5-S5 Canary-1B-v2 and Parakeet-TDT-0.6B-v3 paper: https://arxiv.org/html/2509.14128
- R5-S6 Parakeet TDT 0.6B v3 card: https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3
- R5-S7 Qwen3-ASR-0.6B card: https://huggingface.co/Qwen/Qwen3-ASR-0.6B
- R5-S8 Qwen3-ASR technical report, Table A.2: https://arxiv.org/html/2601.21337v2
- R5-S9 Whisper Notes FLEURS run (blog, 25 Aug 2026): https://whispernotes.app/blog/qwen3-asr-vs-whisper
- R5-S10 Vistaar repository page: https://github.com/AI4Bharat/vistaar
- R5-S11 whisper.rn releases: https://github.com/mybigday/whisper.rn/releases
- R5-S12 npm registry, whisper.rn latest: https://registry.npmjs.org/whisper.rn/latest
- R5-S13 whisper.cpp releases, v1.9.4: https://github.com/ggml-org/whisper.cpp/releases ; https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.4
- R5-S14 whisper.rn README: https://github.com/mybigday/whisper.rn
- R5-S15 whisper.cpp README: https://github.com/ggml-org/whisper.cpp
- R5-S16 whisper.cpp model files: https://huggingface.co/ggerganov/whisper.cpp/tree/main
- R5-S17 WhisperKit / Argmax OSS Swift: https://github.com/argmaxinc/WhisperKit
- R5-S18 Apple SpeechTranscriber: https://developer.apple.com/documentation/speech/speechtranscriber.md
- R5-S19 Apple Speech framework: https://developer.apple.com/documentation/speech.md
- R5-S20 Apple DictationTranscriber: https://developer.apple.com/documentation/speech/dictationtranscriber.md
- R5-S21 Apple AnalysisContext: https://developer.apple.com/documentation/speech/analysiscontext.md
- R5-S22 Apple SpeechAnalyzer: https://developer.apple.com/documentation/speech/speechanalyzer.md
- R5-S23 WWDC25 session 277: https://developer.apple.com/videos/play/wwdc2025/277/
- R5-S24 Apple forums, SpeechAnalyzer sample: https://developer.apple.com/forums/thread/790108 (and ?page=2)
- R5-S25 Apple forums, asset not found: https://developer.apple.com/forums/thread/797835
- R5-S26 addpipe, SpeechAnalyzer overview (17 Aug 2026): https://blog.addpipe.com/apple-speechanalyzer-api/
- R5-S27 OpenAI community, Hindi confused with Urdu: https://community.openai.com/t/api-confuses-hindi-with-urdu/760823
- R5-S28 OpenAI community, Whisper API for Hindi: https://community.openai.com/t/whisper-api-for-hindi-speech-to-text/1046744
- R5-S29 Azeemi et al., Dissecting ASR Failures in Low-Resource South Asian Languages: https://aghaaliraza.com/publications/2026--Interspeech--Dissecting_ASR_Failures_in_Low-Resource_South_Asian_Languages.pdf
- R5-S30 Whisper discussion 277, simplified vs traditional: https://github.com/openai/whisper/discussions/277
- R5-S31 Belle-whisper-large-v3-zh: https://huggingface.co/BELLE-2/Belle-whisper-large-v3-zh
- R5-S32 OpenCC: https://github.com/BYVoid/OpenCC
- R5-S33 Arabic dialect Whisper fine-tuning study: https://arxiv.org/abs/2506.02627v1 ; https://arxiv.org/html/2506.02627v1
- R5-S34 oddadmix whisper-large-v3-turbo-arabic-dialectal: https://huggingface.co/oddadmix/whisper-large-v3-turbo-arabic-dialectal
- R5-S35 Open Universal Arabic ASR Leaderboard: https://arxiv.org/html/2412.13788v1
- R5-S36 Cohere Transcribe Arabic release (7 Jul 2026): https://huggingface.co/blog/CohereLabs/cohere-transcribe-arabic-07-2026-release
- R5-S37 Vistaar paper, Interspeech 2023: https://arxiv.org/abs/2305.15386
- R5-S38 Whisper large-v3-turbo card: https://huggingface.co/openai/whisper-large-v3-turbo
- R5-S39 Trelis whisper-hinglish-preview card: https://huggingface.co/Trelis/whisper-hinglish-preview
- R5-S40 ARTPARK-IISc whisper-large-v3-vaani-hindi: https://huggingface.co/ARTPARK-IISc/whisper-large-v3-vaani-hindi
- R5-S42 Vistaar README, raw: https://raw.githubusercontent.com/AI4Bharat/vistaar/master/README.md
- R5-S43 Argmax WhisperKit benchmarks, device support matrix: https://huggingface.co/spaces/argmaxinc/whisperkit-benchmarks/blob/a2b7a6bfea201c7999d01f13996da2a46f0fd67c/dashboard_data/support_data_8c0acbd.csv
- R5-S44 Argmax WhisperKit benchmarks, performance data: https://huggingface.co/spaces/argmaxinc/whisperkit-benchmarks/blob/a2b7a6bfea201c7999d01f13996da2a46f0fd67c/dashboard_data/performance_data.json
- R5-S45 Argmax benchmark metric definitions: https://huggingface.co/spaces/argmaxinc/whisperkit-benchmarks/blob/8eada83891f6c683ea2db3b4be5101f29641636a/constants.py
- R5-S46 Argmax multilingual results (Common Voice 17): https://huggingface.co/spaces/argmaxinc/whisperkit-benchmarks/blob/a2b7a6bfea201c7999d01f13996da2a46f0fd67c/dashboard_data/multilingual_results.csv
- R5-S47 Apple, iPhone SE (3rd generation) tech specs: https://support.apple.com/en-ie/111866
- R5-S48 EveryMac, iPhone SE 3 specs: https://everymac.com/systems/apple/iphone/specs/apple-iphone-se-3-3rd-gen-2022-united-states-canada-a2595-specs.html
- R5-S49 OpenAI Whisper prompting guide: https://developers.openai.com/cookbook/examples/whisper_prompting_guide
- R5-S50 Sun et al., contextual biasing with Whisper and GPT-2, Interspeech 2023: https://www.isca-archive.org/interspeech_2023/sun23e_interspeech.html ; https://arxiv.org/abs/2306.01942
- R5-S51 Improving rare-word recognition of Whisper in zero-shot settings: https://arxiv.org/html/2502.11572v2
- R5-S52 Metaphone and Double Metaphone: https://en.wikipedia.org/wiki/Metaphone
- R5-S53 double-metaphone (npm, MIT): https://github.com/words/double-metaphone
- R5-S54 pinyin-pro (MIT): https://github.com/zh-lx/pinyin-pro
- R5-S55 DiPersio, IndicSOUNDEX, Web Conference 2021 workshop: https://cdn.amazon.science/86/4e/ebc49f01492d89307dbb45d0faf2/indicsoundex-algorithm-for-text-matching.pdf
- R5-S56 Al Boashi and Al Deeb, Adapting Soundex for Arabic Names (2024): https://journals.asmarya.edu.ly/jbs/index.php/jbs/article/view/295
- R5-S57 Zhao and Jurafsky, A preliminary study of Mandarin filled pauses, DiSS 2005: https://www-nlp.stanford.edu/pubs/zhao2005pauses.pdf
- R5-S58 Tseng, Mandarin dialogue structure, Eurospeech 2001: https://www.isca-archive.org/eurospeech_2001/tseng01_eurospeech.pdf
- R5-S59 Graham, hesitation markers este and eh in Mexico City Spanish, Hispanic Studies Review 2023: https://hispanicstudiesreview.cofc.edu/article/57581-a-longitudinal-corpus-based-study-of-hesitation-markers-in-mexico-city-spanish-_este_-and-_eh_-then-and-now
- R5-S60 Filler (linguistics): https://en.wikipedia.org/wiki/Filler_(linguistics)
- R5-S61 Marmorstein, yaʕni in Cairene Arabic, Journal of Pragmatics 2016: https://cris.huji.ac.il/en/publications/getting-to-the-point-the-discourse-marker-ya%CA%95ni-lit-it-means-in-u/
- R5-S62 Oliveira e Silva and Macedo, discourse markers in Rio Portuguese, Language Variation and Change 1992: https://cambridge.org/core/journals/language-variation-and-change/article/discourse-markers-in-the-spoken-portuguese-of-rio-de-janeiro/54278ECE825CB43F66FEC0900DD8421D
- R5-S63 Bali, discourse functions of hã in Hindi, Interspeech 2009: https://www.isca-archive.org/interspeech_2009/bali09_interspeech.pdf
- R5-S64 Péters, hesitation in French learner speech, Bulletin VALS-ASLA 2017: https://bulletin.vals-asla.ch/article/download/10316/9618/28757
- R5-S65 Crible, Degand and Gilquin, discourse markers and filled pauses, Languages in Contrast 2017: https://research.dial.uclouvain.be/handle/2078.5/241745
- R5-S66 W3C Requirements for Chinese Text Layout: https://www.w3.org/TR/clreq/
- R5-S67 Unicode Arabic chart U+0600: http://www.unicode.org/Public/18.0.0/charts/PDF/U0600.pdf
- R5-S68 W3C Arabic and Persian Layout Requirements: https://www.w3.org/TR/alreq/
- R5-S69 Unicode Devanagari chart U+0900: http://www.unicode.org/Public/18.0.0/charts/PDF/U0900.pdf
- R5-S70 RAE, Diccionario panhispánico de dudas, interrogation and exclamation marks: https://www.rae.es/dpd/signos%20de%20interrogaci%C3%B3n
- R5-S71 Brepols, French author guidelines: https://www.brepols.net/permalink/directives-auteurs-fr
- R5-S72 OQLF Vitrine linguistique, punctuation principles: https://vitrinelinguistique.oqlf.gouv.qc.ca/23323/la-ponctuation/ponctuation-principes-generaux
- R5-S73 Practice Portuguese, the 1990 orthographic agreement: https://www.practiceportuguese.com/learning-notes/orthographic-agreement/
- R5-S74 Apple AVAudioIONode and setVoiceProcessingEnabled: https://developer.apple.com/documentation/avfaudio/avaudioionode.md ; https://developer.apple.com/documentation/avfaudio/avaudioionode/setvoiceprocessingenabled(_:).md
- R5-S75 Apple AVAudioInputNode: https://developer.apple.com/documentation/avfaudio/avaudioinputnode.md
- R5-S76 WWDC23 session 10235, What's new in voice processing: https://developer.apple.com/videos/play/wwdc2023/10235
- R5-S77 Apple preferredMicrophoneMode: https://developer.apple.com/documentation/avfoundation/avcapturedevice/preferredmicrophonemode.md
- R5-S78 Apple showSystemUserInterface: https://developer.apple.com/documentation/avfoundation/avcapturedevice/showsystemuserinterface(_:).md
- R5-S79 Apple forums, programmatic Voice Isolation: https://developer.apple.com/forums/thread/844448
- R5-S80 Expo Audio: https://docs.expo.dev/versions/latest/sdk/audio/
- R5-S81 Valin, A Hybrid DSP/Deep Learning Approach to Real-Time Full-Band Speech Enhancement (RNNoise): https://ar5iv.labs.arxiv.org/html/1709.08243
- R5-S82 RNNoise releases: https://github.com/xiph/rnnoise/releases
- R5-S83 DeepFilterNet repository: https://github.com/rikorose/deepfilternet
- R5-S84 DeepFilterNet releases: https://github.com/Rikorose/DeepFilterNet/releases
- R5-S85 Schröter et al., DeepFilterNet perceptually motivated, Interspeech 2023: https://arxiv.org/abs/2305.08227
- R5-S86 DeepFilterNet3 Core ML conversion: https://huggingface.co/aufklarer/DeepFilterNet3-CoreML
- R5-S87 DeepFilterNet3 streaming Core ML: https://huggingface.co/iky1e/DeepFilterNet3-Streaming-CoreML
- R5-S88 Xiph, Opus recommended settings: https://wiki.xiph.org/Opus_Recommended_Settings
- R5-S89 Browser support tables, Opus: https://docs.w3cub.com/browser_support_tables/opus
- R5-S90 Apple Lossless Audio Codec: https://en.wikipedia.org/wiki/Apple_Lossless_Audio_Codec
- R5-S91 sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx
- R5-S93 WhisperKit paper: https://arxiv.org/html/2507.10860v1
