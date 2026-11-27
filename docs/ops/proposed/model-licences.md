# Model licence record (FR-AIS-09, FR-AIS-10), proposed

One record for every model file in `apps/mobile/src/lib/models/catalog.ts` whose status is `default` or `candidate`. BL-1357.

Where this file lives: here, under `docs/ops/proposed/`, until the exec review (D-172) reads it. Then Karma moves it to `docs/legal/model-licences.md` (the path FR-AIS-09 names) and changes the one constant `MODEL_LICENCE_RECORD_PATH` in `apps/mobile/test/model-licence-record.test.ts`. This is an engineering record, not legal advice; counsel reads the training-data question (COUNSEL_PACKET Q9, "Speech model training-data terms") before a store build ships a model.

How it is checked: `apps/mobile/test/model-licence-record.test.ts` reads this file and fails when a `default` or `candidate` catalog entry has no record here, when a record's bytes or SHA-256 differs from the catalog, when a field below is missing or empty, or when a licence is not MIT, Apache-2.0, BSD or ISC.

How to read the facts:
- Bytes, SHA-256, revision and hosting origin are copied from `catalog.ts` (hashes verified there on 3 Oct 2026, ADR 0015 "Integrity"). Nothing here was re-downloaded or re-hashed.
- "Card read" says which upstream pages were opened in the session that wrote this record, on 25 Nov 2026. Each page was read as it stands today on its main branch, not at the pinned revision, so what the card said at the pinned revision is [UNVERIFIED] for every model.
- A page that was not opened is marked [UNVERIFIED].

## Field format

Each record is one heading with the catalog id and one two-column table. The test reads these field names exactly.

| Field | What goes in it |
|---|---|
| Status | `default` or `candidate`, as in the catalog |
| Licence | SPDX id of the weights: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause or ISC |
| Licence URL | The page where that licence is stated |
| Date read | The day that page was read, or [UNVERIFIED] |
| Card read | Which upstream pages were opened, and what is still [UNVERIFIED] |
| Training-data terms (counsel Q9) | The answer, or `open` and what counsel must read |
| Size in bytes | Exact byte count of the file the phone downloads |
| SHA-256 | Hash of the file the phone downloads |
| Pinned upstream revision | Source repo, commit, file and the source file's SHA-256 |
| Build licence | Licence of the quantised or converted file we serve, and how it was made |
| Hosting origin | Where the phone downloads it from |

## speech-model.whisper-large-v3-turbo-q5_0

| Field | Value |
|---|---|
| Status | default |
| Licence | MIT |
| Licence URL | https://github.com/openai/whisper |
| Date read | 2026-11-25 |
| Card read | Read: https://github.com/openai/whisper ("Whisper's code and model weights are released under the MIT License.") and https://huggingface.co/ggerganov/whisper.cpp (licence tag mit, no other licence text on the card). Not opened: the openai/whisper-large-v3-turbo card on Hugging Face [UNVERIFIED]. |
| Training-data terms (counsel Q9) | open. The pages read state the weights licence only; neither states terms for the audio Whisper was trained on. |
| Size in bytes | 574041195 |
| SHA-256 | 394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2 |
| Pinned upstream revision | ggerganov/whisper.cpp at 5359861c739e955e79d9a303bcbc70fb988958b1, file ggml-large-v3-turbo-q5_0.bin, source SHA-256 394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2 |
| Build licence | MIT: served as published (catalog `build: 'upstream'`); the ggerganov/whisper.cpp card tags the GGML files mit |
| Hosting origin | huggingface.co, pinned revision URL in `catalog.ts`; no mirror |

## speech-model.whisper-small-q5_1

| Field | Value |
|---|---|
| Status | default |
| Licence | MIT |
| Licence URL | https://github.com/openai/whisper |
| Date read | 2026-11-25 |
| Card read | Read: https://github.com/openai/whisper and https://huggingface.co/ggerganov/whisper.cpp (licence tag mit). Not opened: the openai/whisper-small card on Hugging Face [UNVERIFIED]. |
| Training-data terms (counsel Q9) | open. Same weights family and same pages as large-v3-turbo; no training-data terms stated. |
| Size in bytes | 190085487 |
| SHA-256 | ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb |
| Pinned upstream revision | ggerganov/whisper.cpp at 5359861c739e955e79d9a303bcbc70fb988958b1, file ggml-small-q5_1.bin, source SHA-256 ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb |
| Build licence | MIT: served as published (catalog `build: 'upstream'`); the ggerganov/whisper.cpp card tags the GGML files mit |
| Hosting origin | huggingface.co, pinned revision URL in `catalog.ts`; no mirror |

## speech-model.silero-vad-v6.2.0

| Field | Value |
|---|---|
| Status | default |
| Licence | MIT |
| Licence URL | https://github.com/snakers4/silero-vad/blob/v6.2/LICENSE |
| Date read | 2026-11-27 |
| Card read | Read on 27 Nov 2026 (CAIO-17): the LICENSE file of snakers4/silero-vad at tag v6.2, which is the MIT License, "Copyright (c) 2020-present Silero Team", the same text as `scripts/licences/third-party/silero-vad.txt` and as on the default branch, `master`; its pyproject.toml at v6.2 ("License :: OSI Approved :: MIT License"); its README at v6.2 ("Published under permissive license (MIT)"). The model files sit in that repository (`src/silero_vad/data`). The README badge whose alt text says "License: CC BY-NC 4.0" shows an MIT image and links to the MIT LICENSE, at v6.2 and on `master`; the sister repository snakers4/silero-models carries the same alt text on a CC BY-NC 4.0 badge, so the alt text reads as a leftover, not a licence term. The open point of 25 Nov is closed for the facts; whether the LICENSE file governs the weights is a legal reading sent to counsel with MIT as the default (CLO-47, proposed packet Q142). Read on 25 Nov and not re-read on 27 Nov: https://huggingface.co/ggml-org/whisper-vad (licence tag mit; the card does not name Silero), because the 27 Nov session could not reach huggingface.co [UNVERIFIED today]. |
| Training-data terms (counsel Q9) | open. The GitHub page says only that Silero VAD "was trained on huge corpora that include over 6000 languages"; it names no corpus and no terms. |
| Size in bytes | 885098 |
| SHA-256 | 2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987 |
| Pinned upstream revision | ggml-org/whisper-vad at 9ffd54a1e1ee413ddf265af9913beaf518d1639b, file ggml-silero-v6.2.0.bin, source SHA-256 2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987 |
| Build licence | MIT: served as published (catalog `build: 'upstream'`); ggml-org/whisper-vad tags its converted files mit |
| Hosting origin | huggingface.co, pinned revision URL in `catalog.ts`; no mirror |

## speech-model.whisper-hindi-small-q5_1

| Field | Value |
|---|---|
| Status | default |
| Licence | Apache-2.0 |
| Licence URL | https://huggingface.co/vasista22/whisper-hindi-small |
| Date read | 2026-11-25 |
| Card read | Read: https://huggingface.co/vasista22/whisper-hindi-small (licence tag apache-2.0; "fine-tuned version of openai/whisper-small"). This matches S2 in `docs/product/prd/functions/ai-and-speech.md`. |
| Training-data terms (counsel Q9) | open. Built from vasista22/whisper-hindi-small, trained on GramVaani, ULCA, Shrutilipi and Google FLEURS train and dev (per its card). The card states no terms for those corpora; it links to each corpus's own page. Counsel must read those terms before this model ships (Q9). |
| Size in bytes | 190085487 |
| SHA-256 | 6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f |
| Pinned upstream revision | vasista22/whisper-hindi-small at fb4a24afc20c42906deed31c3689e4be31da41fe, file pytorch_model.bin, source SHA-256 a19127581a96928c53cc8322249610df2cd59c59e6d06a707d9b1a1b9b25e2d9 |
| Build licence | Apache-2.0, as a converted and quantised copy of Apache-2.0 weights: built by us with whisper.cpp v1.9.3 (commit 371b5a7561823ab2bb32142d2751e35e7534727b) models/convert-h5-to-ggml.py, then whisper-quantize q5_1 (ADR 0015 recipe). What Apache-2.0 asks of our redistribution (a copy of the licence, a notice that we changed the files) is for the exec review. |
| Hosting origin | https://packs.earlyletters.app (self host, `PACKS_ORIGIN`); `hosted: false` until uploaded, so the phone falls back to the shared model |

## speech-model.belle-whisper-turbo-zh-q5_0

| Field | Value |
|---|---|
| Status | candidate |
| Licence | Apache-2.0 |
| Licence URL | https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml |
| Date read | 2026-11-25 |
| Card read | Read: https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml (licence tag apache-2.0, "The GGML version of Belle-whisper-large-v3-turbo-zh") and https://huggingface.co/BELLE-2/Belle-whisper-large-v3-turbo-zh (licence tag apache-2.0; fine-tuned from openai/whisper-large-v3-turbo). FR-AIS-10 had this card as not opened; it was opened for this record. |
| Training-data terms (counsel Q9) | open. The non-GGML card names AISHELL-1, AISHELL-2, WenetSpeech and HKUST as fine-tuning data and states no terms for them. Counsel must read those terms before this candidate could ever become a default. |
| Size in bytes | 574041195 |
| SHA-256 | bab0d61935b3f75e5435217eadfb1fceb6bcb09751b025a232e76ed33107747f |
| Pinned upstream revision | BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml at 0a7f57392b773254eb60da8e49c7c683af369625, file ggml-model.bin, source SHA-256 2a3bba5bfdb4d4da3d9949a83b405711727ca1941d4d5810895e077eb3cb4d99 |
| Build licence | Apache-2.0, as a quantised copy of Apache-2.0 weights: built by us with whisper.cpp v1.9.3 (commit 371b5a7561823ab2bb32142d2751e35e7534727b) whisper-quantize q5_0 (ADR 0015 recipe). |
| Hosting origin | https://packs.earlyletters.app (self host, `PACKS_ORIGIN`); `hosted: false` and candidate only, so it is never chosen |
