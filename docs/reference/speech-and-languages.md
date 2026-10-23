---
title: Speech and languages
owner: reference-docs
covers: [apps/mobile/src/lib/transcribe*.ts, apps/mobile/src/lib/transcription-queue/**, apps/mobile/src/lib/models/**, apps/mobile/src/lib/packs/**, apps/mobile/src/lib/language/**, apps/mobile/modules/scribe-audio/**, packages/core/src/**, packs/**, scripts/packs/**]
verified_at: 2cbea6d
verified_on: 2026-10-23
---

# Speech and languages

How spoken words become a letter on the phone, how language packs and speech models arrive, and how the faithful-edit engine cleans text without adding meaning. Reasons: ADR 0001 (on-device ASR), ADR 0014 (languages), ADR 0015 (per-language models), ADR 0016 (packs and signed documents), all in `docs/adr/`.

## The path of one recording

| Step | What happens | Code |
|---|---|---|
| Record | AAC-LC, mono, 64 kbps, 48 kHz, into `Documents/ExpoAudio`, as M4A on both platforms today (ADR 0027 moves iOS to ADTS once its checks pass). No voice processing on the original | `apps/mobile/src/lib/capture/recorder.ts`, `lib/capture/recording-file.ts` |
| Queue | A job per recording; a draft open in Review goes first, then letters waiting for words, oldest first | `lib/transcription-queue/machine.ts` |
| Open the recording | Checks the length the decoder reports. For an ADTS take, the length may not be more than one frame short of the frames counted in the file; if the file ends exactly as a kill leaves it (`tail: 'cut'`), the run switches once to a temporary copy of the whole frames. A kill-cut header must claim a possible frame length (at most 779 bytes, `plausibleLength`), and a run of 2 or more of the stream's whole frames found after damage near the end makes the tail a break and counts toward the length (#226). Any other ending (`tail: 'break'`: damage or a trailer) gets no copy: the run goes ahead if the decoder reads the file to its counted frames, and is refused otherwise; more than one frame of bytes after the last whole frame is refused before anything is read. A refused take shows `decode_failed` (Try again, or type) rather than being transcribed without its end. M4A runs as before | `lib/transcribe-run.ts` (`openRecordingForRun`, `checkedRunDuration`), `lib/capture/adts.ts`, `lib/capture/adts-file.ts` |
| Decode | 5-minute windows decoded to 16 kHz PCM in memory, no file written | `modules/scribe-audio` (`decodePcm16`) |
| Loudness check | A window whose loudest 30 ms frame is under -60 dBFS skips VAD and Whisper | `lib/transcribe-energy.ts` |
| Voice activity | Silero VAD inside whisper.rn finds speech; no speech means an empty transcript and Whisper never runs | `lib/transcribe-whisper.ts` |
| Plan chunks | Speech packed into chunks of at most 28 s, cut in pauses, overlap only inside continuous speech | `lib/transcribe-plan.ts` |
| Transcribe | One whisper.rn call per chunk, with the author's language and the family dictionary prompt; never translates, never diarizes | `lib/transcribe-whisper.ts`, `lib/transcribe-prompt.ts` |
| Keep only speech | Non-speech tags, an echo of the prompt and an echo of the name list are dropped; a looping chunk is retried once at a higher temperature and kept flagged if it still loops | `lib/transcribe-post.ts` |
| Clean | `faithfulClean` and `verifyEdits` from `@scribe/core` | `lib/transcription-queue/clean.ts` |
| Review | The person sees each fix, can put it back, or keep "Exactly as said" | `apps/mobile/src/app/review.tsx` |

Queue rules (`machine.ts`): one job at a time; nothing runs in the background (a job stopped by backgrounding goes back without counting as a failure); a job waits (`waiting_for_pack`) until its language's speech packs are installed; a failure retries after 30 s and 5 min, then waits for the next launch or "Try again". A recording whose words were set is never transcribed again. Failures are classified by error code only, never by message text (`machine.ts` `jobFailureOf`).

**Speech downloads that fail** retry by themselves (`lib/transcription-queue/download-retry.ts`): after 1 minute, 5 minutes, 30 minutes, 2 hours, then every 6 hours, only in the foreground, and only on Wi-Fi even when "Use mobile data" is on (`wifiOnly` in `models/speech-packs.ts` and `packs/engine.ts`). A download that failed its hash check retries at most 3 times in 24 hours. No space, an app too old for the pack, and a download the person stopped never retry by themselves. The last failure is shown through `useSpeechDownload` (`use-words.ts`).

**Words that arrive after the letter was saved** (a voice-only letter kept while waiting) are stored exactly as heard, with no machine edits, and the letter asks the parent to read them back (`clean.ts` `lateArrivingWords`, `lib/read-it-back.ts`, D-086).

**Transcribers.** `lib/transcribe.ts` defines the `Transcriber` interface. `transcribe-whisper.ts` is the real one (needs a development or store build and installed packs). `transcribe-sample.ts` returns fixed fictional words for Expo Go, is selected only when `devShortcutsAllowed`, and its words are never saved.

## Speech models

`apps/mobile/src/lib/models/catalog.ts` lists every model as a pack of kind `speech-model` with a pinned URL, size and SHA-256.

| Language | Model on full tier | Model on compact tier |
|---|---|---|
| English, Spanish, French, Portuguese, Arabic, Mandarin | Whisper large-v3-turbo q5_0 (one shared download) | Whisper small q5_1 |
| Hindi | whisper-hindi-small q5_1 when hosted; until then the shared model | same |
| Every language | Silero VAD v6.2.0, downloaded with the first model | same |

- **Tiers** (`models/tiers.ts`): full needs at least 3.4e9 bytes of RAM; under that, unknown RAM, or two memory failures gives compact.
- **Hosting**: upstream files point at Hugging Face at a pinned revision. Files the team builds (Hindi small, a Mandarin candidate) point at the self host `https://packs.earlyletters.app/speech` (`PACKS_ORIGIN`, `SELF_HOST_BASE` in `catalog.ts`; D-097, since #126) and are `hosted: false`, so they are never chosen yet. Candidates (`status: 'candidate'`) are never chosen until the golden corpus says so.
- **Consent** (`models/speech-consent.ts`): the model downloads only after an explicit yes, stored as a device setting.
- **Dev only**: a model copied by hand into `Application Support/models` is used by a development build after its SHA-256 matches (`models/speech-packs.ts`, `lib/model-files.ts`).

## Language packs

A pack id is `<kind>.<name>`; kinds are `speech-model`, `text-rules` and `prompts` (`packages/api/src/pack-manifest.ts` `PACK_KINDS`).

**Text-rules packs** are JSON in `packs/text-rules/` for `en`, `hi`, `es`, `zh`, `fr`, `ar`, `pt`. Each holds `normalization`, `punctuation`, `fillers`, `meaning`, `repeats` and `phonetic` tables plus script facts and attribution; `zh.json` adds `scriptVariants` and `asr`, regenerated by `packs/text-rules/tools/zh-data.mjs`. English is bundled in the app (`packages/core/src/lang/english.ts`); the others download when a language is chosen in Settings, Spoken language (`lib/language/packs.ts`). Until a pack arrives, that language runs in punctuation-safe mode.

**The pack engine** (`apps/mobile/src/lib/packs/engine.ts`, public API in `packs/index.ts`):

| Property | How |
|---|---|
| Signed | A pack installs only if it is in the signed pack manifest from `lib/remote`; with no manifest, `ensurePack` fails with `no_manifest` |
| Verified | The finished file's SHA-256 must equal the manifest entry; a mismatch deletes it and tries a mirror. The hash is streamed natively (`ScribeAudio.sha256File`, CryptoKit) when the module is present, so a large model is not hashed in JavaScript; Expo Go and web fall back to JavaScript (`packs/expo-adapter.ts`) |
| Resumable | HTTP Range chunks (16 MB) appended to a `.part` file |
| Atomic | A verified file is moved into `installed/<id>/<version>/` by one rename, with `pack.json` written first |
| Polite | One download at a time; over 5 MB waits for Wi-Fi unless the person allows mobile data; a remote kill switch (`packDownloads`); a free-space reserve of 1 GB for large packs |
| Not backed up | Root is `Application Support/packs`, excluded from backup |

**Signed manifest.** The manifest, remote config and content bundle are Ed25519-signed documents checked against `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts`. That list is **empty on `develop`** (a founder step, comment in `keys.ts`). Every `eas.json` profile now reads signed documents from `https://packs.earlyletters.app` (`EXPO_PUBLIC_DOCS_BASE_URL`, #126), but with no trusted key nothing verifies, so a build made today installs no downloaded pack: no text rules beyond English and no speech model. Recordings are kept and wait for their words. The founder steps are in `docs/release/TESTFLIGHT.md`.

**Publishing** is manual: `scripts/packs/publish.ts` builds every non-English text-rules pack, adds the hosted speech models from `catalog.ts`, signs the manifest, writes signed documents into `supabase/functions/<fn>/published.ts`, and writes the same documents under `dist/packs/` at the object keys the app requests (`documentObjects` in `scripts/packs/lib.ts`). It uploads nothing and deploys nothing: it prints the `wrangler r2 object put` commands for bucket `early-letters-packs` (documents with `Cache-Control: no-cache`), and marks the Supabase function deploys optional, only for a build with no documents host. Keys come from `scripts/packs/keygen.ts`. Where the documents are served from: [backend.md](backend.md#edge-functions).

## The faithful-edit engine (`packages/core`)

The constitution in `CLAUDE.md`: the machine may remove and repair, never add meaning. The engine is pure TypeScript; the app calls it, nothing calls a model.

**Edit types** (`packages/core/src/types.ts`, `EditType`):

| Type | What it does |
|---|---|
| `filler` | Removes "um", "uh" |
| `false_start` | "she was, she was so" to "she was so" |
| `repeat` | "the the" to "the" |
| `stt_fix` | A mis-hearing replaced by a dictionary term only |
| `punctuation` | Adds or removes punctuation and sentence case; letters unchanged |
| `agreement` | One word, same stem ("she have" to "she has") |
| `paragraph` | Whitespace only |

Each `Edit` is expressed against the raw transcript (offsets, the exact `original`, a `replacement`, a `source` of `rule` or `model`).

**`faithfulClean(raw, opts)`** (`packages/core/src/pipeline.ts`): dictionary corrections, then fillers and repeats (only at level `clean`), script edits, any rule edits, then everything through `verifyEdits`, then `applyEdits` and the language's final normalization. It returns the text, the applied and rejected edits, and suggestions (repeats and fillers that might carry meaning are offered, not applied). `withoutEdit` puts one fix back; `acceptSuggestions` re-verifies tapped suggestions.

**`verifyEdits`** (`packages/core/src/verify.ts`) refuses any edit that would change negation, tense or a modal, a word through a contraction, a name or pronoun (except a dictionary-backed `stt_fix`), sentence type, quotation marks, any number, any letter or combining mark, or that cuts a letter from its marks. It also caps how much text may change (`CEILING_RATIO` 0.15). At level `verbatim` only `stt_fix` and `punctuation` are allowed. The rejection reasons are the `RejectReason` union in `types.ts`.

**`ENGINE_VERSION`** is `5` (`pipeline.ts`); the comment there lists what each version changed. It is stamped on every letter (`entries.engine_version`) so any letter can be re-derived with the engine that made it. Text-rules packs carry their own `engine` number, checked against `LANG_ENGINE_VERSION` (`1`) in `packages/core/src/lang/types.ts`.

**Model edits.** `packages/core` contains a model-edit contract (`model-edits.ts`, `edit-provider.ts`), but the app passes no model edits: no `modelEdits` or `cleanWithProviders` call exists in `apps/mobile/src`. Fixes in the app are rules only.

## What is per language

| Thing | Per language? | Where |
|---|---|---|
| Speech model | Yes, by catalog and tier | `models/catalog.ts` |
| Whisper language code | Yes; unknown codes become `auto` | `lib/transcribe-language.ts` |
| Prompt style seed | Yes (script and punctuation hints); a pack's prompt overrides it | `lib/transcribe-prompt.ts` |
| Filler and repeat removal (level `clean`) | English only today | `transcription-queue/clean.ts` `LANGUAGES_WITH_TIDY_RULES` |
| Punctuation, script, normalization, meaning guards | Yes, from the text-rules pack | `packs/text-rules/*.json`, `packages/core/src/lang/` |
| Chinese script and Portuguese spelling choice | Asked in Settings; never respells words | `app/settings/language.tsx` |
| Interface language | English only (decision 6, per `lib/remote/index.ts`) | `lib/remote/index.ts` (content bundle locale `en`) |

Spoken languages for letters: `SPEECH_LANGUAGES` in `models/catalog.ts`. A person picks a primary plus up to two more (`lib/language/`).

## Tests

`packages/core/test` holds the verifier tests, a fuzz test (`verify.fuzz.test.ts`, fixed seed in CI, random nightly) and golden tests that pin engine output. App-side speech logic is tested in `apps/mobile/test` (`transcribe-plan`, `transcribe-text`, `transcription-queue`, `models-catalog`, `speech-consent`). Real recordings are tested with the Mac kit in `experiments/`.
