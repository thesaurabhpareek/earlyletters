# F05 On-device transcription and language packs

| | |
|---|---|
| Release | v1.0 gate (re-transcription UI is P1 inside v1.0; Hindi-English code-switching is v1.1, F33) |
| Priority and rank | P0, rank 3 (05-feature-map.md) |
| Personas | P1, P2, P3, P4, P6 |
| Existing IDs | B-REQ-003, B-REQ-006, A-REQ-002, A-REQ-030, K-14, K-24, PRD 7.4, PRD 7.7, PRD-REQ-004, LEGAL-REQ-007, LEGAL-REQ-014, LEGAL-REQ-018, LEGAL-REQ-019, LEGAL-REQ-022, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-046, D-031, D-040, D-046, DR-01, DR-14, R-01, R-02, R-08, R-12, R-14, BL-043, BL-140, BL-141, BL-142, BL-143, BL-144, BL-145, BL-147, BL-258, BL-265 |
| Depends on | F03 (author languages and script), F04 (recording, drafts, voice-only save), F06 (generic engine reads pack tables; verifier fix for marks and non-Latin punctuation, R-01), F07 (dictionary terms and phonetic tables), F16 (sync of new columns), F17 (Settings shell), F19 (manifest and pack delivery) |
| Status | Draft V2, 3 Oct 2026. Reconciled on 13 Oct 2026 with ADR 0014 (languages as data), ADR 0015 (speech models per language, Hindi on its own model), ADR 0016 (packs and signed manifest), ADR 0017 (API standards) and the code on `develop`; ADRs decide, this spec cites them (`_AUTHORING.md` M12). Revised 14 Oct 2026 after critique round 1 (M15 to M17; disposition in `reviews/DISPOSITION-C.md`) |

## 1. Why

- [F] On 3 Oct no spoken letter could be transcribed in a release build (`availability()` returned `'decoder-missing'`). On `develop` on 13 Oct the pipeline exists in code: M4A decode in memory (`modules/scribe-audio` `decodePcm16`, BL-140), Silero VAD and per-chunk Whisper with the family's names and a language seed in each prompt (`lib/transcribe-whisper.ts`, `transcribe-plan.ts`, `transcribe-prompt.ts`, BL-141), a transcription queue with voice-only save (`lib/transcription-queue/`, BL-142), and speech models fetched through the pack system and checked by SHA-256 against the signed manifest (`lib/models/speech-packs.ts`, `lib/packs/engine.ts`, BL-143). None of it has run on a real iPhone (ROADMAP 2.1 section 0); speed, memory and heat per language are unmeasured (BL-043, FT-22). TDD 10 ranks this the top launch risk (risk 1).
- [D] The founder set seven spoken-letter languages at v1.0, each with language-specific transcription, script and punctuation (B4), and a lean app under 40 MB with models and non-English packs downloaded on demand as data (B13).
- [S] Quality differs widely by language. Whisper large-v3-turbo scores 3.62 to 5.97 WER on Spanish, English, Portuguese and French and 7.97 CER on Mandarin in a third-party FLEURS run, but 29.64 WER on Hindi and 15.72 on read Modern Standard Arabic [S] R5 section 1.1 (R5-S9). Arabic dialect speech sits at about 30 to 60 WER on open models [F, S] R5 section 1.2 (R5-S35, R5-S36).
- [F] A misheard word in a keepsake is permanent: `raw_transcript` is immutable by database trigger (DATA-REQ-040, `supabase/migrations/20261002020000_data_governance.sql`). A weak transcript saved once stays weak forever.
- [F] 24.5% of 2024 US births were to mothers born outside the 50 states and DC, and the six non-English launch languages have 53.5 million US speakers [F] R3 section 2.1, 2.3. No competitor we found asks which languages a family speaks; Day One takes the language from the keyboard and users report broken mixed-language output [F, S] R1 section 0 item 4 (R1-S60, R1-S61).
- [S] One Tinybeans user reported 9 GB of mobile data used overnight [S] R2-S14. A 574 MB model on cellular without consent would repeat that.
- [F] On 3 Oct the engine let a Hindi edit change "daughter" to "son" and an Arabic edit change "you" from feminine to masculine (R-01, R5 section 4.4 E2, E3). Engine versions 4 and 5 refuse both; a 13 Oct re-run confirms it, and lists the R-01 items still open, none of them specific to Hindi, Arabic or Chinese script (F06 section 7.1).
- [D] Languages are data (ADR 0014): one generic engine in `packages/core/src/lang/`, one text-rules pack per language in `packs/text-rules/`, English bundled. The six downloadable packs ship with word tables in `draft`, so they run in punctuation-safe mode until a native speaker signs each off; the app cleans every non-English letter at `verbatim` (`LANGUAGES_WITH_TIDY_RULES`, `transcription-queue/clean.ts`).
- [D] Speech models (ADR 0015, Proposed until each language's golden-corpus check): one shared Whisper large-v3-turbo q5_0 (574 MB, MIT) for English, Spanish, French, Portuguese, Arabic and Mandarin; Hindi gets its own model, vasista22/whisper-hindi-small q5_1 (190 MB, Apache-2.0), because turbo's Hindi is the weakest result measured (6 FLEURS clips: 30.2% word error for turbo, 10.1% for Hindi small). Phones under 4 GB RAM use whisper-small q5_1 (190 MB). The Hindi file is built by us and is not uploaded yet (`hosted: false` in `lib/models/catalog.ts`), so today Hindi falls back to turbo.

## 2. Who

| Persona | Moment | Holding | Short of | What F05 must do for them |
|---|---|---|---|---|
| P1 Evening parent | After the baby is down, often in the dark, a 1 to 3 minute letter | A phone, one hand, low voice | Time, patience for set-up | Text ready within 30 s of Finish on an SE 3 for a 2-minute letter; never block saving on the model |
| P4 Multilingual family | Speaking Hindi, Spanish, Mandarin, French, Arabic or Portuguese to the child | Two languages, names spelled their way | Trust that the app will not translate or "correct" their language | Letter kept in the language and script spoken; honest "record and type" where we are not good enough yet |
| P2 Co-parent | Writes less often, maybe in a different language from P1 | Their own phone, their own model download | Storage and patience for a second large download | Their own language set and model; no assumption they share P1's language |
| P3 Expecting parent | Third trimester, longer letters, more time | A charged phone on Wi-Fi | Nothing much; this is the moment to download | First-run download offered while they have time and Wi-Fi |
| P6 Future reader | Years later | The book and the original audio | The app itself, possibly | A transcript that says only what was said, in the script it was said, with the recording one tap away |

## 3. What we are solving

**Outcome.** A parent speaks a letter in any of the seven launch languages and, on their own phone with no audio leaving it, gets a transcript in the right script that is good enough to keep, or, where we are not good enough yet, keeps the recording and types the words, and never gets a broken transcript in the keepsake.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Languages passing the gate at release, on the SE 3 tier | en, es, fr, pt, zh [R]; hi if BL-043 and its gate pass; ar not expected (DR-01) | Gate report per language (section 7, F05-REQ-001 to -006) | None: lab corpus, consenting speakers |
| 2-minute letter, Finish to text, SE 3, passed languages | p90 30 s or less | Device run, 30 runs per language (BL-043, BL-044) | None |
| Transcription success | 99% of spoken letters in passed languages reach `outcome: ok` within 24 h of model availability (TDD 06 2.2) | `transcription_completed` | Opt-in only (about 40% [A] TDD 06) |
| Author correction rate per language | Under the gate's WER bar; a rise of 50% over the launch baseline pauses the pack (03 section 4.3) | Computed on device; how it leaves the device is open (Q8) | Opt-in; language is L4 (B-NFR-001) |
| Model download completion | 95% of started downloads complete within 24 h [A] | `model_download` started vs completed | Opt-in |
| Lost or silently changed letters from this feature | Zero (gate) | Kill tests, hash checks, support tickets | None |
| App download size | Under 40 MB on every release build (B13) | App Store Connect size report for iPhone SE 3; CI IPA proxy | None |

## 4. Scope

**In v1.0**
- On-device transcription with whisper.rn 0.7.4 for English, Spanish, French, Portuguese, Arabic and Mandarin on one shared model, Whisper large-v3-turbo q5_0 (574 MB), and Hindi on whisper-hindi-small q5_1 (190 MB) once hosted; compact tier whisper-small q5_1 (190 MB) on phones under 4 GB RAM [D] ADR 0015 sections 1, 2.
- Each language ships only if it passes its device check and the founder's per-language go or no-go (FT-34; the date is in `08-delivery.md` section 2.1). A language that fails is held back to a later pack update and the listing names only shipping languages. The in-app per-language gate below (7.1, 7.2) is not built: today every one of the seven can be chosen and transcribed. Arabic remains the most likely to be held (DR-01; ADR 0015: dialect error rates).
- A per-language quality gate that decides, per language and device tier, whether the language transcribes or offers record and type.
- Language packs as data (B13): versioned JSON plus model reference, SHA-256 against a signed manifest, interpreted by a generic engine in `packages/core`. English pack in the app; the rest downloaded when an author picks the language.
- Model download manager: Application Support, excluded from backup, resumable, verified, removable.
- Transcription queue: one job at a time, foreground only, survives kill, waits for a model, thermal and battery rules.
- Per-author languages from first run (F03) and a per-letter language chip on the record and Review screens.
- Script rules: Devanagari for Hindi (D-031 default), simplified Chinese by default with a traditional option, Arabic right to left inside an English UI, accents and opening marks kept.
- A transcript versions model so a better model later can add a new transcript without touching the first raw transcript. Data contract P0; compare and adopt UI P1.
- Settings > Languages and speech: status, sizes, cellular choice, delete.

**Later**
- Hindi-English code-switching mode (v1.1, F33, B4).
- Hindi and Arabic transcription where v1.0 missed the gate (v1.1, F33).
- Server transcription with consent (v1.1, F35; ADR 0002; LEGAL-REQ-004).
- Apple SpeechTranscriber engine for iOS 26 and later in en, es, fr, pt, zh behind the same interface (v1.1 spike) [R] R5 section 2.3.
- Apple-hosted asset packs for iOS 26 and later (later, F49, DR-14).
- Cantonese, Tagalog, Vietnamese, Korean (later, F45).
- Word highlighting in Read together (v1.1, F34); v1.0 still stores word timings (BL-145).

**Never**
- Translation or transliteration of anyone's words (constitution, B-REQ-003). `translate: false` always.
- Automatic language detection that switches language silently.
- Audio sent anywhere for transcription in v1.0 (03 section 5). The owner's encrypted backup (D-073, M14, M16; F08) stores ciphertext and is not a transcription path.
- Speaker identification, diarization or voiceprints (LEGAL-REQ-019). `tdrzEnable` is never true.
- Converting one Portuguese or English spelling variety into the other (rewording) [R] R5 section 1.2.
- Executable code inside a pack (App Review 2.5.2, R4 section 5).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Speech-to-Story in English and Spanish, through a web link with no app [F] R1-S13 | Trustpilot 4.8 (1,738), not an App Store rating [F] R1-S15 | Transcription praised in 2 reviews [S] R2 T12; proper nouns dropped (CR S27, not re-checked) | **Innovate**: seven languages and names taught at first run |
| Rosebud | Voice transcription in 20 languages [F] R1-S33 | 4.9 (3.3K) | Voice-to-text unreliable at times [S] R1-S33 | Engine and on-device status Unverified; no call |
| Day One | Transcription language from the keyboard, then device language; on-device on iOS 26 with Apple Intelligence, Apple servers otherwise [F] R1-S60 | n/a | Dutch and English in one session gave broken Dutch; users asked for a per-recording setting [S] R1-S61 | **Avoid** keyboard-driven language; **Innovate** per-author default plus per-letter chip |
| Apple SpeechAnalyzer / SpeechTranscriber | On-device, model in system storage, iOS 26 and later, `supportedLocales` [F] R1-S70, R1-S73, R5-S18 | One developer found it about 3x faster than Whisper Small [F] R1-S28; Arabic assets failed to download in a beta [S] R1-S27 | n/a | **Match later** for languages it covers (v1.1 spike); cannot serve our iOS 17 floor (D-040) |
| Apple platform, iOS 27 | Apple Intelligence covers neither Hindi nor Arabic [F] R1-S26 | n/a | n/a | Plan open models for Hindi and Arabic from day one |
| Tiny Treasures | No transcription, sold as a privacy feature [F] R1-S67 | 5.0 (7) | n/a | **Innovate**: transcribe, but on the phone; say so calmly |
| Then | 7 languages, on-device [F] R1-S68 | Too new | n/a | Neutral; watch |

No memory product we found transcribes Hindi or Arabic on-device (R1 F05 opportunity). No product we opened shows a record-and-type state for a language it cannot yet transcribe (Inferred from pages opened).

## 6. Experience

### 6.1 Entry points

| Entry | What starts | Owner of the screen |
|---|---|---|
| Finish on Listen (F04 step 5) | A transcription job for the draft, in the draft's `language` | F04 hands off; Review (F06) subscribes to the job |
| Keep the recording only on Review (`pendingCopy.review.voiceOnlyButton`) | A voice-only entry with `transcript_status = 'waiting'` (`saveVoiceOnlyFromDraft`, exists) and a queued job that fills the words once (`setWordsForWaitingEntry`, exists) | F04, F05 |
| Speech card right after the languages step of first run (F03 step 4; `speechConsentCopy`, built) | On Download on Wi-Fi, model and chosen packs start downloading at once, so they have the rest of first run and the first letter to arrive (F05-REQ-042; F03-REQ-005, -006) | F03 hands off |
| Settings > Languages and speech (new screen, F17 shell) | Status, sizes, download, mobile data choice, delete | F05 |
| A language passes its gate later (manifest update) | Language chip changes from Record and type to transcribed; waiting entries in that language get one job each | F05, F03 labels |
| Review, before first save: change the letter language (new) | A new job for the same draft in the new language; the earlier result is discarded | F06 screen, F05 job |
| P1: a newer passed model or pack is installed | Per-letter offer to make a second transcript (new version); never automatic adoption | F06 screen, F05 data |

### 6.2 Happy path (P1 Evening parent, English, model already on the phone, SE 3)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Finish after a 2-minute letter | Listen moves to processing (F04 step 5) | F04 writes the draft `ready` with `audio_sha256` and `language = en`. F05 inserts one `transcription_jobs` row (new table, section 11.3) with `state = queued`, priority `open_review` |
| 2 | Lands on Review | Review (`review.title`) with an `InlineState` (COMPONENTS 2.15a): the line `wordsCopy.preparing` ("Writing down what you said.", exists) over a determinate bar that fills by finished chunks, and the recording player. `wordsCopy.listening` ("Writing down what you said. Part {n} of {count}.", exists) is retired: no chunk numbers in front of a parent (R3 DX-23) | Queue picks the job. Checks: model file verified (section 7, F05-REQ-020), pack for `en` loaded, thermal state below `serious`, app in foreground. Verifies the audio hash, then decodes M4A to 16 kHz mono PCM in memory (BL-140) whatever the source rate (44.1 kHz today, `listen.tsx`; 48 kHz if F08 moves it) |
| 3 | Waits, listens, or leaves the screen | Same progress line; nothing else moves | Silero VAD plans speech chunks of 28 s or less (TDD 03 3.5.3). Each chunk runs `transcribeData` with `language: 'en'` (forced, never `auto`), `translate: false`, `tdrzEnable: false`, `tokenTimestamps: true`, `maxLen: 1`, temperature 0 and the dictionary prompt rendered by the English pack (F07). Completed chunks are held in memory for the job (no `partial` is stored, section 7.6) |
| 4 | Reads the transcript | Text appears only when every chunk is done (TDD 03 5.1); machine edits underlined (F06); first-time note `review.firstNote` (K-14) | Post-processing in `packages/core`: non-speech tags dropped, loop guard, words with exact offsets, `stt_meta` with model id and SHA-256, pack id and version, binding version, language. Result stored on the job. `faithfulClean` runs with the English pack tables (F06) |
| 5 | Saves (Add to the book or Keep private) | F06 destination buttons | In one local transaction the entry is inserted with `raw_transcript` and `stt_meta` from the chosen job result; from that insert the raw is immutable (DATA-REQ-040). Job row marked `done` and its `partial` cleared. Whisper context released after 45 s idle (TDD 03 3.5.4) |

**Variant: second language.** An author with English and Spanish taps the language chip on Listen (F04-REQ-017) and picks Spanish. Step 1 stores `language = es`; the same shared model runs with `language: 'es'` and the Spanish pack. No model swap is needed for en, es, fr, pt and zh (one shared model, section 7.3).

**Variant: Hindi with a passed Hindi model.** Same flow with the Hindi model file. The queue releases the turbo context first; one context is in memory at a time (TDD 03 3.5.4). Output stays in the script the author chose (section 7.7).

**Variant: language not passed (Arabic at v1.0).** No job is created. Review opens with the recording and Type the words (F04-U47). The author types with the Arabic keyboard; the typed text is never machine-edited (B5).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F05-U01 | No model on the phone at Finish (the usual first letter, R3 DX-02) | Job `state = waiting_model`; capture and save never wait (F04-REQ-018). This is a designed path, not an error: F04 6.2 G | `wordsCopy.pack.*` (exists, F04 6.2 G) | Keep the recording; words arrive once the model verifies and the letter counts only after its words are seen (M17); or type | `apps/mobile/test/first-letter-waiting.test.ts` (new); E2E with the model directory empty |
| F05-U02 | Model download interrupted by kill, reboot, network change or Airplane Mode | Download resumes with HTTP Range from the byte in the sidecar; parts already verified are not fetched again | Settings row shows the same percentage on return | Automatic | Device test with kill at 5 random byte offsets |
| F05-U03 | Downloaded file fails SHA-256 against the signed manifest | `.part` deleted; one automatic retry; then `failed`. The file is never loaded | Settings: "Speech did not download. Try again." (new `speech.download.failed`) | Try again button | Unit with a corrupted fixture; device run |
| F05-U04 | A model file exists with no verified install record (hand-copied dev file in `Documents/models`, or an old partial) | Not loaded. Today `modelFile()` loads any existing file; this changes (F05-REQ-020) | Model shown as not downloaded | Download through the manager | Unit: file present, no record, `availability()` returns `model-missing` |
| F05-U05 | Free space below model size plus 100 MB | Download not started (TDD 03 3.5.8) | "Typing works now. Speaking needs about {size} free." (F03-U13 string, size filled per model) | Free space; manager retries on next foreground | Unit with storage mock |
| F05-U06 | Cellular only, mobile data not allowed | Download waits for Wi-Fi | Settings row "Waiting for Wi-Fi" (new) and the choice "Use mobile data for speech" (new) | Turn the choice on, or join Wi-Fi | Unit with network mock |
| F05-U07 | Offline for days with the model present | Transcription works; manifest from the last good copy (B14); downloads wait | Nothing different | n/a | Airplane test: record, transcribe, save, 0 network requests |
| F05-U08 | App backgrounded mid-job | Current chunk aborted; completed chunks kept in `partial`; no background task API (TDD 03 3.5.4) | On return, progress resumes from the next chunk | Automatic | E2E: background at chunk 3 of 5, resume, raw equals a straight run |
| F05-U09 | App killed or jetsam mid-job | Job found `running` at launch, set back to `queued` with `partial` kept; after 2 memory kills on this phone for the same model, the queue stops using that model here and the language falls back per section 7.3 | Waiting row on Tonight; if a fallback applies, a Settings note "This phone uses the smaller speech model." (new) | Automatic | Device run on a 4 GB phone (TDD 03 FM-7) |
| F05-U10 | Thermal state `serious` or `critical` | No job starts at `critical`; pause between chunks at `serious` (TDD 03 5.3; F04-U28) | Progress line stays; no alarm | Resumes when the state drops | Manual with a thermal simulation build |
| F05-U11 | Low Power Mode on | Job continues with `maxThreads: 2` (TDD 03 3.5.4) | Slower progress | n/a | Unit on the parameter builder |
| F05-U12 | Phone call or Siri while a job runs (recording already finished) | Audio session interruption does not affect CPU work; job continues unless the app backgrounds (then U08) | Nothing | n/a | Manual on device |
| F05-U13 | Silence, noise only (white-noise machine, fan), or a whisper the voice detector drops | VAD finds no speech; Whisper is not run; `outcome = no_speech`; raw stays empty | Recording kept with `wordsCopy.noSpeech.*` (exists; title "No talking in this one"). Revise the title so it also fits a whisper (R3 DX-14): "We could not make out words this time"; the body stays ("The recording is kept just as it is. You can add words by typing them.") | Type, or keep the recording | Corpus noise clips: zero phantom words (gate); whisper clips reported (F05-REQ-003) |
| F05-U14 | Repetition loop in a chunk | Re-decoded once at temperature 0.4; if it still loops, text kept and a `repetition_loop` flag added (TDD 03 3.5.7) | F06 marks the span "listen to this part" | Author listens and edits | Unit on `asr-post` |
| F05-U15 | Draft language not passed (Arabic at v1.0, Hindi until its gate) | No job created | Review with Type the words (F04-U47); waiting card if the author keeps the recording only | Type; when the language passes, one job per waiting entry | E2E with a gate-status fixture |
| F05-U16 | A language is paused by the manifest after letters exist (correction-rate guardrail, 03 section 4.3, or a defect) | New letters in that language record and type; queued jobs move to `waiting_pack`; saved transcripts untouched | Chip label changes to Record and type on next launch | Resumes when the pause lifts | Unit: manifest fixture with `paused` |
| F05-U17 | Manifest with a bad signature, an unknown schema, or a lower `manifestVersion` than the cached one | Rejected; last good copy kept; a content-free count goes to diagnostics | Nothing | Next fetch | Unit with tampered and rolled-back fixtures |
| F05-U18 | Fresh install, never online | Bundled manifest snapshot (built at release) supplies gate status; English pack is bundled; no model | Languages show their bundled status; speaking waits for the model (U01) | First online launch fetches the manifest | Airplane test from install |
| F05-U19 | Hindi letter comes back partly in Urdu (Arabic) script (R5-S27) | Never converted. If 10% or more of letters in the transcript are outside the chosen script [A], the result gets a `script_mismatch` flag | Review: "Some words came out in another script. Listen and type them if you want." (new `review.scriptMismatch`) | Author edits or types | Unit with a mixed-script fixture; corpus script metric |
| F05-U20 | Mandarin output in traditional characters with simplified chosen | Proposed `script` edits from the pack's traditional-to-simplified table (OpenCC data, R5-S32), each verified (F06) and undoable | Underlined like any machine edit | Undo per edit | Unit; corpus: simplified 99%+ after the script edit |
| F05-U21 | Wrong chip: the parent spoke Spanish with English selected | Output may be poor or not in Spanish (behaviour unmeasured [A]) | Review offers "Write it down as another language" (new `review.changeLanguage`) before save | New job in the chosen language; first result discarded, never stored as raw | E2E with a Spanish fixture under `en` |
| F05-U22 | The parent switches languages mid-letter (code-switching) | One language per letter at v1.0 (B4); the other language's words are written as the model hears them under the forced language | Normal Review with the recording one tap away | Edit or type; Hindi-English mode is v1.1 (F33) | Corpus: one code-switched clip per language, measured, not gating |
| F05-U23 | Review opened twice, or reopened during a job | One job per draft; Review subscribes (TDD 03 FM-18) | Same progress | n/a | Unit on the queue |
| F05-U24 | Audio file hash differs from `audio_sha256` before decode | Job stops; file kept and never altered; `outcome = failed` (TDD 03 FM-15, DATA-REQ-046) | "We could not read this recording. It is still kept." (new) | F08 restore path if any | Unit with a flipped byte |
| F05-U25 | Draft `state = unrecoverable` (F04-U14) | Job skipped (F04 section 11.4) | Type the words | Type | Unit |
| F05-U26 | A 30-minute letter (F04 cap) | Runs chunk by chunk in the foreground; the parent may leave Review; the job keeps going while the app is open and resumes after a background | Tonight waiting row; progress when Review reopens | n/a | Device run with a 30-minute fixture; time recorded |
| F05-U27 | Model deleted in Settings while a job runs | Job cancelled and set to `waiting_model`; saved letters untouched | Settings confirms the size freed | Download again | Unit |
| F05-U28 | App update needs a newer pack schema than the installed pack | Old pack used while compatible (`engineMin` check); otherwise jobs wait as `waiting_pack` until the new pack verifies | Settings row "Updating" | Automatic on Wi-Fi | Unit with pack fixtures at two schema versions |
| F05-U29 | CDN returns 404 or 5xx | Retry with backoff from 1 minute to 6 hours [R] | Settings row "Could not download. Try again." | Try again | Unit with a local Range server fixture |
| F05-U30 | Double tap on Download, or two screens ask for the same model | One download per model id; second request joins the first | One progress bar | n/a | Unit |
| F05-U31 | Phone has under 4 GB of memory | Only languages whose gate passed on the small model for this class are transcribed; others record and type (section 7.3) | Chips labelled from the gate-status API | n/a | Unit on `gateFor` with a 3 GB fixture |
| F05-U32 | Co-parent on their own phone | Their own languages, model and packs; no audio of the other parent's letters exists on their phone at v1.0 (B7), so nothing of the other parent's is transcribed there | Their own Settings status | n/a | Two-phone test (BL-177) |
| F05-U33 | Several children with waiting letters | Queue serves all children in `captured_at` order, the open Review first (today `listWaitingForWords` is per child) | Each book shows its own waiting rows (`pendingCopy.book.waitingForWords`) | n/a | Unit |
| F05-U34 | Signed out, lapsed Plus, or account never created | Transcription is local and free for everyone; no account or Plus check anywhere in F05 | Same | n/a | Unit: no entitlement read in `transcription-queue.ts` |
| F05-U35 | VoiceOver | Progress announced once at start and once when words are ready (new `review.transcribing.a11yStart` "Writing down what you said.", `.a11yDone` "Your words are ready."), through `announce()` so nothing is spoken over the recording player (`lib/a11y.ts`); Settings rows read name, status and size | Spoken state, no per-chunk chatter | n/a | VoiceOver script V1 (07 section 2.11) |
| F05-U38 | A letter in a language that has not passed (Hindi or Arabic record and type) kept as a recording with no typing | Saved voice-only with `transcript_status = waiting`; it waits for words for as long as it takes; when the language passes, one job fills the words and the author reviews them (F05-REQ-044) | `book.waitingForWords` on its card | n/a | `apps/mobile/test/transcription-queue.test.ts` (new case) |
| F05-U36 | AX5 text on an SE 3 | Settings rows wrap; sizes on their own line; nothing truncates | Full text | n/a | Component test at AX5 |
| F05-U37 | Reduce Motion | Progress shown as text and a static bar, no animation | Static | n/a | Component test |

### 6.4 Screen states

Review's own states are in F06 6.5; the first-letter waiting card is F04 6.2 G. F05 owns Settings > Languages and speech and the transcribing card. Components are from `docs/design/COMPONENTS.md`.

| Screen | Empty | Loading | Error | Offline | AX5 (SE 3) | VoiceOver |
|---|---|---|---|---|---|---|
| Review, words on their way | n/a | `InlineState`: `wordsCopy.preparing` over a determinate bar; the recording player stays live above | `errors.transcriptionFailed.*` (exists) with Try again and Type instead | Same as online: the model is local | Bar and line stack; player controls 44 pt | Announced once at start and once at done (F05-U35) |
| Settings > Languages and speech | One row per chosen language, each with its state from `speechSettingsCopy` (exists in `packages/content/src/features/speech.en.ts`): `ready`, `absent`, `noSpace` | `speechSettingsCopy.downloading` ("Getting ready, {n}%") | Row `speech.download.failed` (new) "Speech did not download. Try again." with Try again | `speechSettingsCopy.waitingForWifi` and the mobile-data choice (`wordsCopy.pack.mobileDataButton`, exists) | Name, status and size on separate lines; no truncation | Each row reads name, status and size as one element; Delete is a custom action |
| Delete a pack or model (sheet) | n/a | n/a | n/a | Works offline | Buttons stack | Sheet title focused first |

## 7. Requirements and acceptance criteria

Renamed on 14 Oct 2026 (R5 EQ-05): rows that restated a legacy ID owned by another spec now carry a new F05 ID and name the home spec.

Sections 7.1 to 7.9 set the rules each requirement in 7.10 tests. Everything marked new does not exist in the repo on 3 Oct 2026.

### 7.1 Per-language quality gate

A language is transcribed on a device tier only after it passes its own gate. Until then it is Record and type (DR-01 A). The gate runs per language and per tier (section 7.3), on the shipped model, pack and engine version, and again on every change to any of the three.

**Proposed pass bars [R]** (R5 section 8.1; TDD 03 7.3; ADR 0012):

| Language | Primary metric, after cleaning | Bar | Script and punctuation bar | Names after cleaning | Phantom words on noise clips | Speed on the tier device | Memory |
|---|---|---|---|---|---|---|---|
| English | WER | 10% or less | n/a | 95% or more | 0 | 2-minute letter p90 30 s or less | 0 jetsam in 30 runs |
| Spanish | WER | 10% or less | Opening ¿ or ¡ present where a sentence ends in ? or !, 90% or more (baseline Unverified, R5 8.1) | 95% or more | 0 | same | same |
| French | WER | 10% or less | No-break spaces kept before : ; ? ! in final text (after the E7 fix) | 95% or more | 0 | same | same |
| Portuguese | WER on the speaker's own variety | 10% or less for both Brazilian and European speakers | No spelling converted between varieties | 95% or more | 0 | same | same |
| Mandarin | CER | 10% or less | Simplified characters 99% or more after the `script` edit; full-width punctuation | 95% or more | 0 | same | same |
| Hindi | WER | 15% or less | Devanagari 95% or more of Hindi words; English words left in Latin 95% or more (TDD 03 7.3) | 95% or more | 0 | 30 s, or a founder-approved relaxed bar (R5 8.1) | same |
| Arabic | WER on the speaker's dialect group | 20% or less per dialect group | Arabic punctuation; no harakat added or removed by the engine | 95% or more | 0 | same | same |

Also required for every non-English language before its gate can pass: (a) the F06 verifier fix for marks, harakat and non-Latin punctuation with that language's adversarial test set green (R-01; R5 section 4.4 E1 to E8; on 13 Oct the script-specific items D1, D2, D3, D5, D8 and D11 are fixed and the open items are listed in F06 section 7.1); (b) a native speaker has signed off the pack's filler, repeat and punctuation tables (R-08; R5 section 4.2); (c) the dictionary fix rules for that script pass F07's defect tests (F07 section 7).

**Sample design** (R5 section 8.2, extended in `experiments/`):

| Item | Plan |
|---|---|
| Harness fixes first | Fix E8 in `experiments/score.ts` (marks in `normWords`, CER for Chinese); add a per-phrase `language` field (today one global `language` in `experiments/config.example.json`); run the conversion path in `experiments/setup-hinglish.sh` for the Hindi candidates and the Arabic dialect model |
| Speakers | 10 consenting adult native speakers per language, recruited with written consent naming the use (TDD 03 7.3). Arabic: at least 3 dialect groups with 4 speakers each. Portuguese: 5 Brazilian, 5 European |
| Clips per speaker | 3 scripted fictional "Asha" letters of about 2 minutes, each with the child's name, nicknames and two family names, plus 1 unscripted 1-minute letter; recorded on an iPhone in bedtime conditions (low voice, white-noise machine, baby sounds). Plus, per speaker, 1 whispered clip and 1 clip of normal speech over a white-noise machine, reported as separate rows and not gating at v1.0 [R] (R3 DX-14; study 1 in R3 supplies real bedtime recordings) |
| Noise clips | 5 per language with no speech |
| Size | About 40 clips and 80 minutes per language |
| Metrics | WER (CER for zh) on raw and after cleaning; names exact after cleaning; script compliance; sentence-final punctuation per profile; filler presence in raw; phantom words; repetition loops; seconds per audio minute and peak memory on the tier device (30 runs, p90); jetsam count |
| Statistics | Per-speaker bootstrap 95% interval. A language passes when the point estimate meets every bar [R]; if the interval's upper end crosses a bar, the founder sees the interval before the language ships [R] |
| Storage | Private bucket, never git; checksum manifest in git (TDD 03 7.3) |
| Re-run | Any change to model file, pack version, prompt rendering, VAD settings, chunk planner or `ENGINE_VERSION` re-runs the gate for every language it touches |

The gate output is one JSON report per language and tier (new, `experiments/reports/gate-<lang>-<tier>.json`, git-ignored data, summary committed as `docs/qa/evidence/F05-gate-<lang>.md`, new). The founder signs the result; the release owner copies `passed` into the manifest (section 7.4).

### 7.2 Gate-status API (read by F03, F04, F06, F17)

One function answers "can this phone transcribe this language now". F03's languages step, F04's language chip, F06's Review and the Settings screen read it; none reads the manifest directly.

```ts
// apps/mobile/src/lib/speech/languages.ts (new)
export type LetterLanguage = 'en' | 'hi' | 'es' | 'zh' | 'fr' | 'ar' | 'pt';
export type GateState = 'transcribe' | 'record_and_type';
export type NotTranscribedReason =
  | 'not_passed'          // no passed gate for this language on any tier
  | 'not_on_this_phone'   // passed on another tier only
  | 'paused';             // manifest pause (guardrail or defect)
export type AssetState = 'bundled' | 'absent' | 'waiting_wifi' | 'downloading' | 'verifying' | 'ready' | 'failed';

export interface LanguageStatus {
  language: LetterLanguage;
  gate: GateState;
  reason: NotTranscribedReason | null;     // null when gate is 'transcribe'
  scripts: Array<'devanagari' | 'roman' | 'simplified' | 'traditional' | 'arabic' | 'latin'>; // offered choices
  varieties: Array<'pt-BR' | 'pt-PT'> ;     // empty except Portuguese
  pack: { id: string; version: string | null; state: AssetState; bytes: number };
  model: { id: string; state: AssetState; bytes: number } | null; // null when gate is 'record_and_type'
  sharedModel: boolean;                    // true for en, es, fr, pt, zh on turbo
}

export function languageStatuses(): LanguageStatus[];               // all seven, stable order
export function languageStatus(lang: LetterLanguage): LanguageStatus;
export function subscribeLanguageStatuses(cb: (s: LanguageStatus[]) => void): () => void;
export function requestLanguageAssets(lang: LetterLanguage, opts: { allowCellular: boolean }): void; // idempotent
```

Rules: synchronous reads from the cached manifest and the local asset table (no network, under 5 ms [A]); works offline from the last good manifest or the bundled snapshot; `gate` is `transcribe` only when the manifest marks the language passed for this phone's tier, the language is not paused, and the verifier fix flag for that script is present in the running engine (section 11.2). An asset not yet downloaded does not change `gate`: the chip still says transcribed and the letter waits for words (F05-U01).

### 7.3 Model per language and device tier

Decided in ADR 0015 (status Proposed; final per language only after its golden-corpus check, TDD 03 7.3). The mapping lives in the app, `LANGUAGE_MODELS` in `apps/mobile/src/lib/models/catalog.ts`; `speechPlan` computes what a family downloads and is tested. The first hosted entry in each list wins, and every list ends in a shared upstream model, so a language always has a model.

| Language | Full tier (4 GB RAM and up) | Compact tier (under 4 GB, or after 2 memory kills) | Hosted today |
|---|---|---|---|
| en, es, fr, pt, ar, zh | Whisper large-v3-turbo q5_0, 574,041,195 bytes, MIT | whisper-small q5_1, 190,085,487 bytes | Yes, pinned Hugging Face revisions (`hosted: true`) |
| hi | whisper-hindi-small q5_1 (190,085,487 bytes, Apache-2.0), then turbo | whisper-hindi-small q5_1, then small | No: the Hindi file is our build and `hosted: false`, so Hindi uses turbo (full) or small (compact) until the founder uploads it (ADR 0015 section 9 item 2) |
| zh candidate | Belle-whisper-large-v3-turbo-zh q5_0, built and hashed, not chosen | n/a | No (candidate only, ADR 0015 M-1) |

Silero VAD v6.2.0 (885,098 bytes, MIT) downloads with the first speech model; it is not in the app (ADR 0015 section 4). Prompts carry the family's names and a per-language seed in the language's own script (ADR 0015 section 3, `lib/transcribe-prompt.ts`). Every chunk is decoded with the language set explicitly; nothing auto-detects. Download sizes per family (ADR 0015 section 2): any one non-Hindi language 575 MB; Hindi only 191 MB once hosted; Hindi with English 765 MB.

Open from ADR 0015 section 9: golden corpus per language (founder recordings); uploading the Hindi file; counsel on the training-data terms of the two models we built; device speed and memory per tier (BL-043).

### 7.4 Language packs as data

Decided in ADR 0014 (text-rules packs) and ADR 0016 (pack system, signing, hosting). This spec does not re-specify them. Facts an agent needs:

| Topic | What is decided and built | Where |
|---|---|---|
| Pack type and engine | `TextRulesPack` compiled into `LanguageRules` by one generic engine; packs hold only lists, maps, enums, numbers and literal strings; nothing is evaluated | `packages/core/src/lang/types.ts`, `engine.ts`, `validate.ts` (ADR 0014 section 1) |
| Packs that exist | `packs/text-rules/en.json` (reference, bundled in code), `hi`, `es`, `zh`, `fr`, `ar`, `pt`; published sizes 5 to 7 KB each except zh at 62 KB (ADR 0014 section 8 table) | `packs/text-rules/` |
| Trust per table | `draft`, `cited` or `native-reviewed`; enabling tables need sign-off, protective tables load as drafts; all six downloadable packs are `draft` for word tables today (punctuation-safe mode) | ADR 0014 section 3 |
| Script conversion | A `punctuation` edit labelled `script` by `describeEdit`; per author, never inside quotes or on a dictionary term, only for one-to-one characters | ADR 0014 section 4 |
| Manifest | One signed `PackManifest` (`schemaVersion: 1`) for every downloadable file, kinds `speech-model`, `text-rules`, `prompts`; Ed25519 over canonical JSON with `@noble/ed25519`; rollback refused | `packages/api/src/pack-manifest.ts`, `integrity.ts`, `keys.ts` (ADR 0016 sections 4.1, 4.2) |
| Signing keys | `TRUSTED_SIGNING_KEYS` is empty until the founder runs the key ceremony; until then the app trusts nothing, installs no downloaded pack or model, and keeps bundled defaults (fail closed) | `packages/api/src/keys.ts`; BL-335, FT-16 |
| Hosting | Recommended Cloudflare R2 with Hugging Face mirrors for upstream weights; founder decides (Q-001, BL-337) | ADR 0016 section 3 |
| On the phone | Range download in 16 MiB parts, SHA-256 against the manifest, atomic install into Application Support excluded from backup, Wi-Fi only above 5 MB unless allowed, one download at a time, `packDownloads` kill switch, Settings > Storage lists and removes packs | `apps/mobile/src/lib/packs/engine.ts`, `expo-adapter.ts`, `app/settings/storage.tsx` (ADR 0016 section 4.3) |
| App budget | Under 40 MB (D-065); speech area adds about 1 MB (E, ADR 0015 section 6) | `docs/ops/APP_SIZE.md` |

Gaps between this spec and the ADRs, for the platform and language owners (not decided here):
- The manifest has no per-language gate or pause field (`PackEntry` in `pack-manifest.ts` has id, kind, language, version, url, mirrors, bytes, sha256, fileName, minAppVersion, required). F05-REQ-001 and F05-U16 need one, or the gate stays a release decision as ROADMAP 2.1 does it today (section 13 Q10).
- A per-entry `packId` and `packVersion` record (this spec's `stt_meta` fields; F06 `pack_ref`) is not built.
- No bundled manifest snapshot exists for a first launch offline (F05-U18): with no network the app has bundled config defaults and no model.

### 7.5 Model download manager

Built as the general pack engine (ADR 0016 section 4.3; BL-143 "done in code"): speech models are `speech-model.*` packs asked for by id through `ensurePack` from `lib/models/speech-packs.ts`. It replaced the load-any-file `modelFile()` of 3 Oct. Facts:
- Files live under `Library/Application Support/packs/installed/<id>/<version>/`, excluded from backup through `ScribeFiles.setExcludedFromBackup`.
- Resume after kill, cancel or network change from the `.part` size; a host that ignores Range is accepted when the size matches.
- SHA-256: native `Crypto.digest` up to 32 MB, else native `sha256File` when present, else JS slices; how long Hermes takes on a 574 MB file is Unverified (ADR 0016 section 4.3; DEVICE_TEST_PLAN S1-15).
- Free space must cover the file plus 1 GB for large packs, 20 MB for small ones.
- Development builds only: a model copied by hand into Application Support/models is used after its SHA-256 matches the catalog, while no signed manifest is published (`speech-packs.ts` header).
- Device checks owed: Range across Hugging Face redirects through URLSession, hash time, resume at 40% (S1-15).

### 7.6 Transcription queue

Built on `develop` (13 Oct) as `apps/mobile/src/lib/transcription-queue/` (BL-142): the rules are a pure reducer in `machine.ts` (phases `queued`, `waiting_for_pack`, `running`, `done`, `failed`; kinds `draft` and `entry`; automatic retry with a cap), `index.ts` feeds it from the store, app state and pack system and runs one job at a time, and Review calls `requestWords(draftId)`. Each job carries its language (`languageFor`, `models/author-language.ts`). Jobs are held in memory; at start the queue re-adds every letter waiting for words (`listWaitingForWords`), and a draft gets a job when Review asks. There is no `transcription_jobs` table and no stored partial result, so a job cut off by a kill starts again from the first chunk. A marker setting written while Whisper runs lets the next launch count a memory kill toward the compact tier. The rules below are the target; rows the code does not meet are listed in section 12.

| Rule | Detail |
|---|---|
| One job at a time | FIFO with one priority bump: the draft open in Review goes first; then other drafts; then voice-only entries waiting for words, oldest `captured_at` first, across all children (F05-U33) |
| Targets | A draft (`target_kind = 'draft'`) or a saved voice-only entry (`target_kind = 'entry'`, `transcript_status = 'waiting'`) |
| States | `queued`, `running`, `waiting_model`, `waiting_pack`, `done`, `failed`, `cancelled` |
| Foreground only | No background task API (PRD 7.7). On background: abort the current chunk, keep completed chunks in `partial`, resume on foreground (TDD 03 3.5.4) |
| Kill and jetsam | A `running` job at launch returns to `queued` with its `partial`; 2 memory kills for one model on this phone mark that model unusable here and apply the tier fallback (F05-U09) |
| Thermal and battery | No start at `critical`; pause between chunks at `serious`; `maxThreads: 2` in Low Power Mode (TDD 03 3.5.4) |
| Context | Created lazily, never on launch (A-REQ-002); released after 45 s idle, on background and on memory warning (TDD 03 3.5.4; today the context promise is module-level and never released, TDD 03 H-5) |
| Result | Raw text, words with exact offsets, `stt_meta`, outcome. For a draft, the result is held on the job; the entry's `raw_transcript` is written once at save from the chosen result (TDD 03 C-4). For a waiting entry, the result is written once with `setWordsForWaitingEntry` (exists; it refuses if raw is not empty) |
| Idle work | F08's listening-copy job runs only when this queue is idle (F08 section 6) |
| Errors | Codes only, never text (LEGAL-REQ-014) |

### 7.7 Script, punctuation and direction rules

| Language | Rule | Source |
|---|---|---|
| Hindi | Devanagari by default for Hindi words, English words in Latin (D-031 default if unanswered); Roman offered only if the experiment shows it works (D-031). Always `language: 'hi'`, never `auto` (Urdu script risk, R5-S27, R5-S29). Never transliterate after the fact (B-REQ-003). Danda kept as the model writes it | D-031; R5 1.2 |
| Mandarin | Simplified by default [R]; prompt opens with a simplified sentence (R5-S30); traditional characters become simplified only through verified, undoable `script` edits from the pack table; full-width punctuation (GB/T 15834, R5-S66). Traditional as a choice is open (F03 Q3). Chinese quotation marks versus the curly-quote content rule is open (R5 4.3; Q9) | R5 1.2, 4.3 |
| Arabic | Letter text renders right to left inside the English UI: each paragraph's direction follows its first strong character (Unicode bidi, R5-S68), digits stay left to right, no hardcoded LTR (B-NFR-007). Arabic punctuation ، ؛ ؟ kept. The engine never adds or removes harakat (they can carry gender, R5 1.2). At v1.0 this applies to typed Arabic and to any later transcript | R5 1.2, 4.3 |
| Spanish | ¿ and ¡ kept; added only where the sentence already ends in ? or ! (needs the E6 fix) | R5-S70; R5 4.4 |
| French | No-break spaces before : ; ? ! and inside « » kept in final text (built with the French pack: 13 Oct scratch run, F06 section 7.1 D14) | R5-S71; R5 4.4 |
| Portuguese | Author's variety stored for dictionary and punctuation; no conversion between varieties | R5-S73 |
| All | `translate: false` always; no automatic language switch; output stays in the language and script spoken | Section 4 Never |

### 7.8 Code-switching at v1.0

Hindi-English mode is v1.1 (B4; F33). At v1.0 each letter has one language, chosen on the chip or from the author's default, and the model runs with that language forced. Words from another language are written however the model hears them under the forced language: in Hindi mode English words may come out in Devanagari, and in English mode Hindi words get English spellings (TDD 03 3.5.6, unmeasured). Names stay right through the dictionary (F07). Nothing detects or switches language automatically. The Review screen keeps the recording one tap away, and the author can edit or type.

Shipped copy must not promise more. On 3 Oct `onboarding.dictionary.languagesBody` promised mid-sentence switching; on `develop` on 14 Oct it reads "Your words stay in the language you speak. We never translate them.", which holds at v1.0. F05-REQ-031 keeps a content test so the promise cannot return.

### 7.9 Transcript versions and re-transcription

The first raw transcript of an entry is immutable (DATA-REQ-040; guard function `entries_guard_immutable`, last replaced in `supabase/migrations/20261002020000_data_governance.sql`). A voice-only entry gets its first raw once, when words first exist (`setWordsForWaitingEntry`, exists). A better model later adds a version; it never edits the first.

Data contract (P0 at v1.0; compare and adopt UI is P1):

- New table `transcript_versions` (local and server, new): `id`, `entry_id`, `author_id`, `seq` (2, 3, and so on; seq 1 is `entries.raw_transcript` itself and is never copied), `raw_text`, `stt_meta`, `machine_edits`, `created_at`. Rows are insert-only; a trigger rejects update of `raw_text`, `stt_meta`, `seq`, `entry_id` (same SQLSTATE family as `SCIMM`).
- New column `entries.active_transcript_seq` (default 1). `final_text` replays from the active version's raw plus that version's machine edits plus author edits (DATA-REQ-041, BL-148).
- Adopting a version is an author action only. It writes the previous `final_text`, `machine_edits` and `active_transcript_seq` to `entry_versions` (DATA-REQ-041) and is reversible. Author edits made on the old version are kept in that history and are not carried across [R]; the compare screen says so before adopting.
- A re-transcription job is created only by the author tapping "Write it down again with the newer model" (new, P1) on a letter whose model or pack is older than the passed one. Never automatic, never in bulk without the author's tap.
- Server: author-only RLS, same as `stt_meta` (PRD-REQ-004); never exposed through `book_entries`. Sync mapping is F16. DATA-REQ-042 says edit offsets point into `raw_transcript`; with versions they point into the active version's raw. This needs the data architect and counsel to amend the wording (Q6).

### 7.10 Requirements

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| F05-REQ-001 | P0 | A language is transcribed only after its gate passes on this phone's tier | Given the manifest marks `es` not passed for T4, When an SE 3 author records in Spanish, Then no job is created and Review offers Type the words. Given `es` passed for T4, Then a job runs with `language: 'es'` | DR-01 A; R5 8.1 |
| F05-REQ-002 | P0 | Gate bars per language as in 7.1, run on the shipped model, pack and engine | Given a gate report for a language, When any bar in 7.1 fails (including one phantom word on a noise clip or one jetsam in 30 runs), Then `passed` is false and the release owner cannot set it true in the manifest without a founder-signed exception recorded in `docs/qa/evidence/` | R5 8.1, 8.2; ADR 0012 |
| F05-REQ-003 | P0 | Gate sample per R5 8.2 | Given a gate report, Then it lists at least 10 speakers and 40 clips (Arabic: 3 dialect groups of 4; Portuguese: 5 pt-BR and 5 pt-PT), 5 noise clips, per-speaker bootstrap intervals, the model, pack and engine versions, and separate word error rows for whispered clips and speech over white noise | R5 8.2; R3 DX-14 |
| F05-REQ-004 | P0 | No non-English gate can pass before the F06 verifier fix for its script | Given `ENGINE_VERSION` without the marks, harakat and full-width punctuation fixes (R-01), When the gate runs for hi, ar or zh, Then the report fails with `verifier_not_ready`; Given the fix, Then the language's adversarial set (R5 4.4 E1 to E8) has zero accepted meaning changes | R-01; R5 4.4 |
| F05-REQ-005 | P0 | Native-speaker sign-off per pack | Given a non-English pack version, Then its manifest entry is accepted by CI only with a sign-off file `docs/qa/evidence/F05-pack-<lang>-<version>.md` (new) naming the reviewer role and date | R-08; R5 4.2 |
| F05-REQ-006 | P0 | Gate re-run on change | Given a change to model file, pack, prompt rendering, VAD settings, chunk planner or `ENGINE_VERSION`, Then CI marks every affected language's gate stale and the manifest build fails until new reports exist | R5 8.2 |
| F05-REQ-007 | P0 | Gate-status API as in 7.2 | Given the cached manifest and asset table, When `languageStatuses()` is called offline, Then it returns 7 entries in under 5 ms on SE 3 [A] with `gate`, `reason`, `pack`, `model`; Given a manifest update marking `hi` passed, Then subscribers are called once and F03's chip label changes without a release (F03-REQ-004) | F03-REQ-003, -004; B14 |
| F05-REQ-008 | P0 | Language is never auto-detected and never `auto` | Given any job, Then the whisper.rn call has `language` equal to the draft language code and never `'auto'`; a config lint fails the build on a literal `'auto'` in `apps/mobile/src/lib/speech/` | R5 2.4; B-REQ-003 Rev (B4) |
| F05-REQ-009 | P0 | Never translate, never diarize | Given any decode parameters, Then `translate` is false and `tdrzEnable` is absent or false; a config lint enforces both | LEGAL-REQ-019; constitution |
| F05-REQ-010 | P0 | Capture and save never wait for transcription | Given no model, a running download, a paused language, or a failed job, When Finish is tapped, Then the draft saves with the same latency as with a model (F04-REQ-018) and Keep the recording only is offered | F04-REQ-018; PRD 7.4 |
| F05-REQ-011 | P0 | Waiting letters get words once | Given a voice-only entry with `transcript_status = 'waiting'` in a passed language, When the model verifies, Then one job fills `raw_transcript` once via `setWordsForWaitingEntry`; Given the entry already has words, Then the call returns false and nothing changes | TDD 03 FM-9; `store.ts` |
| F05-REQ-012 | P0 | Typed text is never transcribed or replaced | Given a voice-only entry where the author typed words (capture mode `mixed`), When its language later passes, Then no job overwrites the typed text; the author may ask for a transcript as a version (P1, 7.9) | B5; F03 section 6.3 |
| F05-REQ-013 | P0 | One job at a time, persisted, foreground only | Given 3 drafts and 2 waiting entries, Then jobs run one at a time in the 7.6 order; Given a background at chunk 3 of 5, When the app returns, Then the job resumes at chunk 4 and the final raw equals an uninterrupted run on the same audio | TDD 03 3.5.4, FM-6, FM-18 |
| F05-REQ-014 | P0 | Kill and jetsam safe | Given a kill during a job, When the app relaunches, Then the job is `queued` with its `partial` and no audio or draft is lost; Given 2 jetsams for one model on one phone, Then that phone moves to the tier fallback and Settings says so | TDD 03 FM-7 |
| F05-REQ-015 | P0 | Thermal and battery rules | Given thermal `critical`, Then no job starts; Given `serious`, Then the queue pauses between chunks; Given Low Power Mode, Then `maxThreads` is 2 | TDD 03 3.5.4, 5.3 |
| F05-REQ-016 | P0 | Lean app: no model or non-English pack in the build | Given a release build, Then the IPA contains no file over 5 MB matching `*.bin` and no pack other than `en`; App Store Connect download size for iPhone SE 3 is under 40 MB (CI proxy check on the IPA every build) | B13 |
| F05-REQ-017 | P0 | Packs are data | Given any pack, Then it validates with `validatePackJson` (`TextRulesPack`, ADR 0014) or as a `PackEntry` in the signed manifest (ADR 0016), contains no field the engine evaluates as code, and adding or removing a pack changes no screen or feature; a test loads each pack through the generic engine only | B13; App Review 2.5.2 (R4 section 5) |
| F05-REQ-018 | P0 | Pack and model integrity against a signed manifest | Given a manifest with a bad signature, an unknown schema, or a lower `manifestVersion`, Then it is rejected and the last good copy stays; Given an asset whose SHA-256 differs from the manifest, Then it is deleted, retried once, then `failed`, and never loaded | B13; TDD 03 FM-10 |
| F05-REQ-019 | P0 | Packs only for chosen languages | Given an author who picked Portuguese, Then only the Portuguese pack is requested and no other non-English pack is fetched | B13; F03-REQ-006 |
| F05-REQ-020 | P0 | Only verified model files load | Given a model file on disk with no verified `speech_assets` row (including a hand-copied file in `Documents/models`), When `availability()` runs in a release build, Then it returns `model-missing` and whisper.rn is not initialised with that file | TDD 03 H-4; ADR 0001 |
| F05-REQ-021 | P0 | Resumable download | Given a kill at a random byte, When the app relaunches on Wi-Fi, Then the download resumes from the sidecar offset and no completed 8 MB part is fetched twice; tested at 5 offsets | TDD 03 5.4 (T-MDL-03) |
| F05-REQ-022 | P0 | Wi-Fi by default, sizes shown first | Given cellular only and mobile data off, Then no asset byte is downloaded; Given the Settings row, Then it shows the size before Download is tapped | TDD 03 3.5.8; R2-S14 |
| F05-REQ-023 | P0 | Disk check | Given free space under asset size plus 100 MB, Then the download does not start and the row shows the needed size | TDD 03 3.5.8 |
| F05-REQ-024 | P0 | Delete in Settings frees space and keeps letters | Given a downloaded pack or model, When Delete is confirmed, Then the file and its `speech_assets` row are removed, the freed size is shown, every letter, recording and transcript is unchanged, and new letters in that language wait for words | B13; PRD 7.7 |
| F05-REQ-025 | P0 | Models excluded from backup, in Application Support | Given a verified model, Then it lives under `modelsDirectory()` with the backup-excluded flag set (`excludeFromBackup`) | ADR 0001; TDD 03 C-9 |
| F05-REQ-026 | P0 | M4A decoded in memory at any source rate | Given a 44.1 kHz or 48 kHz AAC M4A, When a job runs, Then 16 kHz mono PCM is produced in memory, no PCM file is written to tmp, caches or documents, and `availability()` no longer returns `decoder-missing` | BL-140; LEGAL-REQ-018; `listen.tsx` 44.1 kHz |
| F05-REQ-027 | P0 | Per-chunk dictionary prompt | Given a 5-minute letter with the child's name said at 4 minutes, Then the chunk containing it was decoded with the dictionary prompt (each chunk 28 s or less), and the prompt is rendered by the letter's pack in the letter's script (F07) | TDD 03 3.5.3, 3.5.5, H-7 |
| F05-REQ-028 | P0 | No speech, no words | Given a noise-only clip, Then Whisper is not called, raw stays empty and Review shows `wordsCopy.noSpeech.*`; corpus noise clips produce zero phantom words | TDD 03 3.5.7; ADR 0012 |
| F05-REQ-029 | P0 | Script rules per 7.7 | Given Hindi with Devanagari, Then output is never transliterated; Given Mandarin with traditional output, Then only verified `script` edits change characters and each is undoable; Given Arabic text, Then paragraph direction follows the first strong character and digits stay left to right | D-031; R5 1.2, 4.3; B-NFR-007 |
| F05-REQ-030 | P0 | Script mismatch flagged, never converted | Given a Hindi transcript with 10% or more of letters outside Devanagari and Latin [A], Then a `script_mismatch` flag is stored and Review shows `review.scriptMismatch` (new); no character is converted | R5-S27; TDD 03 FM-14 |
| F05-REQ-031 | P0 | v1.0 promises one language per letter | Given the v1.0 build, Then no shipped string says words in two languages are kept as spoken (a content rules case; `onboarding.dictionary.languagesBody` was fixed on `develop` by 14 Oct); Given a code-switched corpus clip per language, Then its WER is reported and does not gate | B4; TDD 03 3.5.6 |
| F05-REQ-032 | P0 | Change language before first save | Given a draft transcribed as `en`, When the author picks Spanish in Review before saving, Then a new job runs as `es`, the `en` result is discarded and never written as raw | ADR 0002 (choose before first save); TDD 03 C-4 |
| F05-REQ-033 | P0 | Every result records how it was made | Given a saved entry, Then `stt_meta` holds model id and SHA-256, pack id and version, binding version, language, prompt SHA-256, chunk times, dropped spans, flags and timing quality | TDD 03 3.5.2; BL-144 |
| F05-REQ-034 | P0 | Word timings stored | Given a saved spoken entry, Then word timings with exact offsets into raw are stored (for F34 in v1.1) and the quality gate value is recorded | BL-145; ADR 0009 |
| F05-REQ-035 | P0 | Transcript versions data contract | Given an entry, Then `raw_transcript` never changes; Given a second transcript, Then it is inserted as `transcript_versions.seq = 2` and an update to its `raw_text` fails with an immutability error in `npm run test:db` | DATA-REQ-040, -041; ADR 0002 |
| F05-REQ-036 | P1 | Compare and adopt a newer transcript | Given a letter made with an older model or pack and a newer passed one, When the author taps "Write it down again with the newer model", Then a job creates version n+1, Review shows both side by side with the recording, and Adopt writes the old state to `entry_versions` and can be undone | ADR 0002; DATA-REQ-041 |
| F05-REQ-037 | P0 | Transcription is free and local for every account state | Given signed out, lapsed Plus, or a joined co-parent, Then transcription behaves identically; no code under `apps/mobile/src/lib/speech/` reads entitlements | B2; B7 |
| F05-REQ-038 | P0 | Transcription sends no audio anywhere | Given a full transcription run with a proxy, Then 0 requests from F05 code carry audio, transcript text or dictionary terms; the only F05 requests are manifest, pack and model GETs with no user identifier. The owner's encrypted backup (F08) is a separate path and is tested there | 03 section 5; LEGAL-REQ-014; M14 |
| F05-REQ-039 | P0 | Content-free logs | Given the log canary over a transcription run with Asha fixtures, Then zero fixture strings appear in logs or crash reports; whisper.rn native logging is off in release (`toggleNativeLog(false)`) | LEGAL-REQ-014; TDD 03 4.5 |
| F05-REQ-040 | P0 | Speed on the budget device for passed languages | Given 30 runs of a 2-minute letter per passed language on SE 3, Then Finish to text is p90 30 s or less and battery use is 2% or less per letter, or the founder records a changed budget (TDD 03 C-7) | PRD 7.7; BL-043, BL-044 |
| F05-REQ-041 | P0 | Accessibility of transcription states | Given VoiceOver, Then the start and the end of a job are each announced once; Given AX5 on SE 3, Then Settings > Languages and speech rows wrap without truncation; Given Reduce Motion, Then progress is static | LEGAL-REQ-051; F05-U35 to U37 |
| F05-REQ-046 | P0 | Per-author languages drive transcription; Hindi script from D-031 (transcription slice of B-REQ-003; home F03) | As in F03's revision; plus: Given the step was skipped, Then English is the letter language, not automatic detection (the 1.3 criterion "automatic detection is used" is withdrawn, R5 2.4) | B-REQ-003; R5 2.4 |
| F05-REQ-047 | P0 | Dictionary terms feed the prompt (prompt slice of B-REQ-006; home F07) | Given terms from F07, Then the per-chunk prompt contains the terms' forms for the letter's script, capped at 200 tokens with lower-priority kinds dropped first | B-REQ-006; TDD 03 3.5.5 |
| F05-REQ-048 | P0 | Splash never waits on the model (model slice of A-REQ-002; home F01) | Given a cold start with a model on disk, Then no whisper context is created before the first job | A-REQ-002 |
| F05-REQ-049 | P0 | Transcription works offline (slice of A-REQ-030; home F01) | Given Airplane Mode with a verified model, Then record, transcribe and save succeed with 0 network requests | A-REQ-030 |
| F05-REQ-050 | P0 | Author-only working material, transcription fields (slice of PRD-REQ-004; home F06) | Given a co-parent, Then `raw_transcript`, `stt_meta`, `machine_edits` and `transcript_versions` of the other parent's letters are not readable (access test) | PRD-REQ-004; K-09 |
| F05-REQ-051 | P0 | It can make mistakes (slice of K-14; home F06, F06-REQ-034) | Given the first transcribed letter on this install, Then `review.firstNote` shows once before save | K-14 |
| F05-REQ-042 | P0 | Speech starts downloading at the languages step | Given first run on Wi-Fi with enough free space, When the author taps Download on Wi-Fi on the speech card shown right after the languages step (`speechConsentCopy`, built), Then the model and the chosen packs start downloading before the Ready screen shows; Given Not now, Then nothing downloads and the first letter takes path G (F04); Given cellular only, Then they wait for Wi-Fi unless the author allowed mobile data; first run never waits on them. The card counts in F02's ask table (R3 DX-15) | R3 DX-02; R1 PL-05; B13 |
| F05-REQ-043 | P0 | Words that arrive later stay unreviewed until the author saves them | Given a voice-only letter, When F05 fills its words, Then the entry's `transcript_status` becomes `unreviewed` (new value) and stays so until the author saves Review with those words on screen, when it becomes `ready`; F14 counts the letter at that Save and never before (M17; F14 6.2 B2, F14-REQ-037). Given a letter whose words were never saved by the author, Then it never counts | M17; R3 DX-02, DX-26 |
| F05-REQ-044 | P0 | A record-and-type language never forces typing | Given a language that has not passed, When the author keeps the recording without typing, Then it saves voice-only, waits for words with no time limit, and gets one job when the language passes; it uses no free letter while it waits (M17) | DR-01 A; M17; R3 DX-26 |

### 7.11 Test map (P0)

Test titles start with the ID in brackets (07 section 1.1). "New" means not on `develop` on 14 Oct 2026.

| ID | Test file or run | Exists? |
|---|---|---|
| F05-REQ-001, F05-REQ-007 | `apps/mobile/test/language-gate.test.ts`; only if Q11 builds the in-app gate, else the FT-34 release record in `docs/qa/evidence/` | New |
| F05-REQ-002 to F05-REQ-006 | `experiments/gate.test.ts` (report schema, stale marking); `experiments/score.test.ts`; `docs/qa/evidence/F05-gate-<lang>.md` and `F05-pack-<lang>-<version>.md` | `score.test.ts` exists; the rest new |
| F05-REQ-008, F05-REQ-009 | `apps/mobile/test/speech-config-lint.test.ts` (no `'auto'`, `translate` false, `tdrzEnable` off) | New |
| F05-REQ-010 to F05-REQ-015, F05-REQ-032, F05-REQ-037, F05-REQ-044 | `apps/mobile/test/transcription-queue.test.ts` (new cases for resume and record-and-type waits) | Exists |
| F05-REQ-016 | `scripts/size/lib.test.ts`; IPA check in the release workflow | Test exists; workflow step new |
| F05-REQ-017, F05-REQ-018 | `packages/core/test/lang.pack.test.ts`; `packages/api/test/pack-manifest.test.ts`; `packages/api/test/integrity.test.ts` | Exist |
| F05-REQ-019 | `apps/mobile/test/models-catalog.test.ts` | Exists |
| F05-REQ-020 to F05-REQ-025 | `apps/mobile/src/lib/packs/__tests__/engine.test.ts`; device S1-15 | Test exists; run not done |
| F05-REQ-026 | Device S1-01, S1-02 (decode contract) | Not run |
| F05-REQ-027, F05-REQ-028, F05-REQ-033, F05-REQ-034, F05-REQ-047 | `apps/mobile/test/transcribe-plan.test.ts`; `apps/mobile/test/transcribe-text.test.ts` | Exist |
| F05-REQ-029, F05-REQ-030 | `packages/core/test/lang.languages.test.ts`; `apps/mobile/test/transcribe-text.test.ts` (new script-mismatch case) | Exist |
| F05-REQ-031 | `packages/content/test/rules.test.ts` (new case) | File exists |
| F05-REQ-035 | `supabase/tests/transcript_versions.test.mjs`; only if WP-F05-09 is in v1.0 (BL-144 deferred) | New |
| F05-REQ-038 | E2E proxy capture of a transcription run (needs mitmproxy, 07 section 2.6) | New |
| F05-REQ-039 | `supabase/functions/_shared/log/canary.test.ts` (functions); app log canary (BL-239) | First exists |
| F05-REQ-040 | Device S1-17 per passed language, protocol in section 9 | Not run |
| F05-REQ-041 | VoiceOver script V1; AX5 by device script until WP-F00-01 | Not run |
| F05-REQ-042 | `apps/mobile/test/first-run-download.test.ts` | New |
| F05-REQ-043 | `apps/mobile/test/transcription-queue.test.ts` (new `unreviewed` cases); F14-REQ-037 test (F14 owns it) | File exists; cases new |
| F05-REQ-046 | `apps/mobile/src/lib/language/spoken-language.logic.test.ts` | Exists |
| F05-REQ-048 | `apps/mobile/test/launch-no-model.test.ts` | New |
| F05-REQ-049 | `apps/mobile/e2e/flows/E2E-03-speak-save-offline.yaml` with a model present | Flow exists |
| F05-REQ-050 | `supabase/tests/access_matrix.test.mjs` | Exists |
| F05-REQ-051 | `apps/mobile/src/components/capture/review-view.logic.test.ts` (new case) | File exists |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Recording (input only; F08 owns it) | L4 | Device | Author | F08 | No (B7) |
| 16 kHz PCM buffers | L4 | Process memory, per chunk | Nobody | Seconds | Never (LEGAL-REQ-018) |
| `transcription_jobs` rows with `partial` text (new) | L4 | Local SQLite only | Author's device | Deleted when the job is `done` or `cancelled` | Never (like drafts, F04) |
| `raw_transcript`, `stt_meta`, `machine_edits` | L4 | Device; Postgres after sync and consent (F02, F16) | Author only (PRD-REQ-004) | Raw immutable; deleted with the letter or account | Syncs, author-only |
| `transcript_versions` (new) | L4 | Device; Postgres | Author only | Insert-only; deleted with the letter | Syncs, author-only (F16 maps it) |
| Word timings (`stt_meta`) and final-text alignment | L4 | Device; Postgres | Raw-offset timings author-only; final-text `alignment` readable by members (TDD 03 4.1, BL-144) | With the entry | Syncs |
| Letter language, script, variety | L4 (PRD 7.10) | Device; `profile_settings` and `entries.language` on the server (F03, F04) | Author | Until deletion | Syncs, author-only |
| Dictionary prompt text | L4 | Memory per call | Nobody | Per call | Never at v1.0 |
| `speech_assets` rows, model and pack files (new table) | L1 | Device, Application Support, excluded from backup | App | Until deleted in Settings | Downloaded only |
| Manifest | L1 | Device cache; CDN | Anyone | Last good copy | Downloaded only |
| Model host access logs | L3 (IP address) | Host provider | Host | Host's terms | n/a; needs a data-map row (D-046) |
| Gate corpus audio and references | L4 of consenting adult speakers, scripted fictional text | Private bucket (not git) | Speech engineer | Until the consent's stated end | Never in the repo (TDD 03 7.3) |

Rules:
1. No audio, transcript, dictionary term, child name or language name in analytics, logs, crash reports or request URLs (LEGAL-REQ-014; B-NFR-001). Requests to the model host carry no user id, child id or device id.
2. No speaker identification, diarization or voiceprint at any point (LEGAL-REQ-019). The gate corpus is never used to build a voice model of any speaker.
3. No speech-recognition permission is requested (LEGAL-REQ-007).
4. New local tables (`transcription_jobs`, `speech_assets`, `transcript_versions`) and new server columns (`transcript_versions`, `entries.active_transcript_seq`) get rows in `docs/legal/DATA_CLASSIFICATION.md` and classification comments in the same pull request (DATA-REQ-001).
5. B9 copy for Settings > Languages and speech: "Your words are written down on this phone. Recordings are not sent to us for this." (new; avoids an "only on this phone" claim while iCloud device backup may hold audio, D-033; claims registry review, LEGAL-REQ-044, R-10).

## 9. Non-functional requirements

| Budget | Target | Gate? | Source |
|---|---|---|---|
| 2-minute letter, Finish to text, SE 3, each passed language | p90 30 s or less | Yes, or a founder-recorded change | PRD 7.7; R-02 |
| Battery per 2-minute letter, SE 3 | 2% or less | Yes | PRD 7.7 |
| Peak app memory during a turbo job | 1.4 GB or less (E) | Yes (zero jetsam in 30 SE 3 runs) | TDD 03 5.2 |
| Context release | 45 s after the last job; immediately on background | Yes | TDD 03 3.5.4 |
| Gate-status read | Under 5 ms, synchronous, offline [A] | No | 7.2 |
| Manifest fetch | ETag, long cache (B15); app works from the last good copy | Yes | B14, B15 |
| Model download on 50 Mbps Wi-Fi | About 95 s for 574 MB (arithmetic, TDD 03 5.4) | No | TDD 03 5.4 |
| Download completion | 95% of started downloads complete within 24 h [A] | No (watch) | Section 3 |
| App binary growth from F05 | 15 MB or less (E) inside the 40 MB budget | Yes (the 40 MB total) | B13; TDD 03 5.4 |
| Pack size | Under 100 KB, Mandarin under 5 MB excluding fonts (Inferred) | No | R5 section 7 |
| Idle energy | Zero background work from F05 | Yes | PRD 7.7 |
| Lost or silently changed letters | Zero | Yes | 03 section 4.3 |
| Accessibility | VoiceOver, AX5, Reduce Motion on every F05 state | Yes | LEGAL-REQ-051 |
| Measurement protocol for speed and battery | Unplugged, fixed brightness, room temperature, nominal thermal state at start, 2-minute cool-down between runs; report p90 cold and p90 on the fifth back-to-back run; battery from Instruments Energy Log or MetricKit, not `batteryLevel` steps (R2 AR-30) | Applies to every Gate row above | R2 AR-30 |

Shared budgets live in `06-nfr.md` (not yet written).

## 10. Analytics

All events are opt-in (LEGAL-REQ-003), L2 only, from `packages/analytics/src/catalog.ts`. Never a language name, script, transcript, term or duration beyond buckets (B-NFR-001; the catalogue drops `languages_set` for that reason).

| Event | Status | Properties | Question it answers |
|---|---|---|---|
| `transcription_completed` | Exists | `engine`, `model`, `audio_bucket`, `latency_bucket`, `outcome`; proposed additions: `outcome` values `no_speech`, `interrupted`, `waiting_pack`; `model` values for the Hindi and Arabic models as opaque ids (`model_b`, `model_c`) so the value does not name a language; `timing_quality` (TDD 03 4.5) | Does transcription finish and how fast |
| `model_download` | Exists | `stage`, `model`, `network`; proposed `stage` values `resumed`, `verify_failed`; `model` gains the opaque ids | Does the model arrive |
| `pack_download` | New | `stage`, `network`, `bytes_bucket`; no pack id (a pack id names a language) | Do packs arrive |
| `settings_changed` | Exists | `key: 'languages'` and `key: 'model_download_network'` exist; proposed `speech_asset_deleted` | Do people delete speech files to save space |
| `review_action` | Exists | proposed `change_language`, `adopt_transcript_version` | How often the chip was wrong; whether newer versions are adopted |
| `machine_edit_reverted` | Exists | `edit_type` gains `script` when F06 adds it | Do Chinese script edits get undone |

The author correction rate per language (03 section 4.3) cannot be sent without naming the language. Spec default [R]: compute it on device, compare it with the threshold in the manifest, and send only `correction_guard{state: 'within' | 'over'}` (new, no language) plus a server-side pause decided by the speech engineer from the count of `over`. Whether that is enough to pause the right pack is open (Q8).

## 11. How we build it (with the architect)

### 11.1 What exists (verified on `develop`, 13 Oct 2026)

| Part | File | State |
|---|---|---|
| Decode, hash, listening copy (native) | `apps/mobile/modules/scribe-audio/ios/ScribeAudioModule.swift` (`probe`, `decodePcm16`, `sha256File`, `enhance`) | Built (BL-140). Security review L9: `samples()` traps on NaN or huge input; clamp owed |
| Whisper engine | `apps/mobile/src/lib/transcribe-whisper.ts`, `transcribe-plan.ts`, `transcribe-post.ts`, `transcribe-prompt.ts`, `transcribe-language.ts`, `models/whisper-runtime.ts` | Built (BL-141): Silero VAD, chunk planner, per-chunk prompt with names and seed, `stripPromptEcho`, contexts released |
| Model catalog and plan | `apps/mobile/src/lib/models/catalog.ts` (`SPEECH_MODELS`, `LANGUAGE_MODELS`, `speechPlan`), `tiers.ts`, `speech-packs.ts` | Built (ADR 0015) |
| Pack system | `apps/mobile/src/lib/packs/` | Built (ADR 0016); installs nothing until `packages/api/src/keys.ts` has a key |
| Language settings and text packs | `apps/mobile/src/lib/language/` (`packs.ts`, `rules.ts`, `spoken-language.ts`), `app/settings/language.tsx`, `app/settings/storage.tsx` | Built |
| Transcription queue | `apps/mobile/src/lib/transcription-queue/` (`machine.ts`, `index.ts`, `clean.ts`, `use-words.ts`, `copy.ts`) | Built (BL-142); in memory, no job table |
| Engine and packs | `packages/core/src/lang/*`, `packs/text-rules/*.json`, `ENGINE_VERSION = 5` | Built (ADR 0014); R-01 status in F06 section 7.1 |
| Contracts | `packages/api/src/pack-manifest.ts`, `integrity.ts`, `canonical.ts`, `keys.ts`, `standards.ts` | Built (ADR 0016, ADR 0017) |
| Publishing | `scripts/packs/` (`keygen`, `publish`) | Built; never run (no key) |
| Experiment harness | `experiments/score.ts`, `config.example.json`, `setup-hinglish.sh` | Exists; E8 open (F06 D15) |
| Per-language in-app gate | none | Not built (Q11) |
| Transcript versions | none (`transcript_versions` table absent) | Not built (BL-144 deferred to v1.1, CVL-20) |

### 11.2 Components still to build (new unless marked)

| Component | Package or path | Notes |
|---|---|---|
| Gate status (if Q11 says build) | `apps/mobile/src/lib/language/gate.ts` (new); additive `PackEntry` field in `packages/api/src/pack-manifest.ts` | ADR 0016 amendment by the platform owner |
| Gate tooling | `experiments/gate.ts` (new), `experiments/reports/` (git-ignored) | After the E8 fix |
| Script mismatch flag for Hindi | `apps/mobile/src/lib/transcribe-post.ts` (exists) | F05-U19 |
| Transcript versions data contract | local migration (number assigned by the coordinator, R2 AR-37), server migration | P1 UI; data contract only if time allows (BL-144 deferred) |
| Download at the languages step; the `unreviewed` transcript state | `apps/mobile/src/lib/models/speech-packs.ts` (request call), `apps/mobile/src/app/review.tsx` (seen signal), local migration | F05-REQ-042, F05-REQ-043 |

Libraries in use (installed): whisper.rn 0.7.4 (bundles whisper.cpp 1.9.3), `@noble/ed25519` 3.2.0, `@noble/hashes` 2.4.0, `valibot` 1.5.0 (ADR 0015 Context, ADR 0016 section 4.2). Chinese data from OpenCC (Apache-2.0), pinyin-data (MIT) and Unihan travel inside the zh pack (ADR 0014 section 8).

### 11.3 Local tables

No `transcription_jobs`, `speech_assets` or `transcript_versions` table exists or is needed for v1.0: the pack engine records installs in `pack.json` files beside each install, and the queue rebuilds from the store. If transcript versions ship (P1), their table is specified then.

### 11.4 Sequencing

Order only; dates live in `08-delivery.md` section 2.1 (R1 PL-03, R2 AR-36).
1. The founder runs the key ceremony and picks the host (FT-16, BL-335, BL-337), then publishes the first signed manifest. Without it no model or non-English pack can install on a TestFlight phone.
2. Device spikes per language on SE 3, 12 and 15 (FT-22, BL-043; DEVICE_TEST_PLAN S1-15 to S1-18).
3. Per-language go or no-go (FT-34); counsel on training-data terms (Q12); upload Hindi small if cleared.
4. Before feature freeze: WP-F05-02 scorer fix, WP-F05-10 Hindi script flag, WP-F05-14 first-letter path; WP-F05-05 only if Q11 says build.
5. After v1.0: transcript versions (WP-F05-09, -13), native-speaker sign-off per pack as data updates (ADR 0014 section 3).

### 11.5 Riskiest unknown and the spike

**Unknown:** turbo q5_0 speed, memory and heat under whisper.cpp on an A15 with 4 GB; Hindi small on the same phone. No published A15 figure exists (R5 section 2.2). ADR 0015 estimates resident memory at about 1 GB for turbo and 0.4 GB for the small models (E).
**Spike:** DEVICE_TEST_PLAN S1-17 (BL-043): each language x 30 s, 2 min, 5 min on SE 3, 12 and 15; seconds to words, peak memory, thermal state, battery over 10 runs; confirm `Device.totalMemory` sits above the 3.4e9-byte full-tier line. If turbo misses on SE 3: that phone tier uses small q5_1, or the language is held back (ROADMAP 2.1 section 6 cut table).

## 12. Work packages

`08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream (R5 EQ-08).

Status is what `develop` holds on 13 Oct 2026. "Device" names the DEVICE_TEST_PLAN item that must pass on a real iPhone; none has run.

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|
| WP-F05-01 | M4A decode module (BL-140) | `apps/mobile/modules/scribe-audio/` | none | Device contract test: 44.1 and 48 kHz fixtures give 16 kHz mono PCM16 within 1 frame of duration; no file created in tmp or caches; `[F05-REQ-026]` | agent plus device check (speech engineer) | Built (`decodePcm16`, in memory). Clamp for review L9 owed | S1-01, S1-02 |
| WP-F05-02 | Harness fixes and gate tooling (E8, per-phrase language, CER, bootstrap, report JSON) | `experiments/score.ts`, `experiments/gate.ts` (new), `experiments/config.example.json` | none (the core tokenizer is fixed) | `score.test.ts` cases for Devanagari tokens and Chinese CER; `[F05-REQ-003]` report schema test | agent (speech engineer) | Not built (`normWords` has no `\p{M}`) | none |
| WP-F05-03 | Signed manifest and pack schema | `packages/api/src/pack-manifest.ts`, `packages/core/src/lang/types.ts`, `scripts/packs/` | none | `[F05-REQ-017]`, `[F05-REQ-018]` with tampered, unsigned, rolled-back fixtures | agent (platform engineer) | Built (ADR 0014, 0016; `packages/api/test`). Not done: key ceremony and first publish (founder) | S1-16 after the first publish |
| WP-F05-04 | Model and pack download: Range, SHA-256, atomic install, backup flag, disk check, delete (BL-143) | `apps/mobile/src/lib/packs/`, `apps/mobile/src/lib/models/speech-packs.ts` | WP-F05-03 | `[F05-REQ-018]`, `[F05-REQ-020]` to `[F05-REQ-025]` | agent plus device check (mobile engineer) | Built; kill-at-every-file-operation test exists per ADR 0016 section 4.3 | S1-15 (resume at 40%, hash time, Wi-Fi rule) |
| WP-F05-05 | Per-language gate status and tier detection | `apps/mobile/src/lib/language/gate.ts` (new), `apps/mobile/src/lib/models/tiers.ts` | Q11 | `[F05-REQ-001]`, `[F05-REQ-007]` with manifest fixtures | agent (mobile engineer) | Partly built: tiers built (`pickTier`, memory-kill fallback); gate not built | S1-17 (`Device.totalMemory`) |
| WP-F05-06 | Engine v2: VAD, chunk planner, per-chunk prompt, words, context lifecycle (BL-141) | `apps/mobile/src/lib/transcribe-whisper.ts`, `transcribe-*.ts`, `models/whisper-runtime.ts` | WP-F05-01, WP-F05-04 | `[F05-REQ-008]`, `[F05-REQ-009]`, `[F05-REQ-027]`, `[F05-REQ-028]`, `[F05-REQ-033]`, `[F05-REQ-034]` | agent (speech engineer) | Built | S1-17, S1-18 |
| WP-F05-07 | Transcription queue, waiting entries, Review hook (BL-142) | `apps/mobile/src/lib/transcription-queue/` | WP-F05-06 | `[F05-REQ-010]` to `[F05-REQ-015]`, `[F05-REQ-032]`, `[F05-REQ-037]` | agent (mobile engineer, speech engineer) | Built, in memory; partial results not kept across a kill | S1-10, S1-13 |
| WP-F05-08 | Settings > Spoken language and Storage | `apps/mobile/src/app/settings/language.tsx`, `storage.tsx` | WP-F05-04 | `[F05-REQ-022]`, `[F05-REQ-024]`, `[F05-REQ-041]` component tests at AX5 and with VoiceOver labels | agent (mobile engineer, design systems) | Built (screens exist; AX5 and VoiceOver checks owed) | S1-16, S1-23 |
| WP-F05-09 | Transcript versions data contract (BL-144 part) | local and server migrations | data architect | `[F05-REQ-035]` | agent, `approve-migration` | Not built; BL-144 deferred to v1.1 (CVL-20) | none |
| WP-F05-10 | Script rules: zh script table, Hindi mismatch flag, Arabic direction in transcript views | `packs/text-rules/zh.json`, `apps/mobile/src/lib/transcribe-post.ts` | none | `[F05-REQ-029]`, `[F05-REQ-030]` | agent (speech engineer) | Partly built: zh script conversion built (ADR 0014 section 4); Hindi mismatch flag not built; Arabic direction unverified on device | Arabic RTL check (S1-18) |
| WP-F05-11 | Per-language go or no-go and pack sign-off | `docs/qa/evidence/`, pack JSON review status | WP-F05-02, F06 open R-01 items, recordings | `[F05-REQ-002]` to `[F05-REQ-006]`, or the founder's FT-34 record | pair (speech engineer with a native reviewer; founder signs) | Not run; all six non-English packs `draft` | S1-17, S1-18 |
| WP-F05-12 | Device budget run for shipping languages | `docs/qa/evidence/` | WP-F05-06, WP-F05-07 | `[F05-REQ-040]` numbers recorded (BL-044) | human (QA engineer) | Not run | S1-17 on SE 3, 12, 15 |
| WP-F05-14 | Speech download at the languages step; the `unreviewed` transcript state; record-and-type letters wait without typing | `apps/mobile/src/lib/models/speech-packs.ts`, `apps/mobile/src/app/onboarding.tsx` (languages step hook, with S08 and the F03 owner), `apps/mobile/src/lib/transcription-queue/`, local migration (coordinator numbers it) | F03 WP-F03-03, F14 ledger change (M17) | `[F05-REQ-042]`, `[F05-REQ-043]`, `[F05-REQ-044]` | agent (mobile engineer, speech engineer) | Not built | First-run timing run on SE 3 (F03-REQ-008) |
| WP-F05-13 | P1: compare and adopt a newer transcript | `apps/mobile/src/components/speech/compare.tsx` | WP-F05-09, F06 Review | `[F05-REQ-036]` | agent (mobile engineer) | Not built; v1.1 | none |

## 13. Open questions and assumptions

| Q | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | DR-01: which languages ship at v1.0, and is Arabic Record and type | Founder | 30 Oct | Manifest gate states; F03 labels |
| Q2 | Accept the 7.1 pass bars, including Hindi 15% WER and Arabic 20% per dialect group | Founder, speech engineer | 23 Oct (before the gate runs) | F05-REQ-002 |
| Q3 | If turbo misses 30 s on SE 3: small model on T4 with re-gating, or a relaxed budget | Founder | 30 Oct (after BL-043) | Section 7.3; F05-REQ-040 |
| Q4 | Model and pack host (Hugging Face pinned revision, R2, or both) and its data-map row. ADR 0016 recommends R2 plus Hugging Face mirrors; FOUNDER_TASKS Q-001, BL-337 | Founder, counsel for the row | 16 Oct (D-046) | Manifest URLs; data map |
| Q5 | Answered by ADR 0016 section 4.2 and 7: the founder holds the Ed25519 secret in a password manager and signs offline with `scripts/packs/publish.ts`; CI never signs. Still owed: running the key ceremony (`keys.ts` is empty; BL-335, FT-16) | Founder | Fri 9 Oct (ROADMAP critical path), late | WP-F05-03 |
| Q6 | DATA-REQ-042 says edit offsets point into `raw_transcript`; with versions they point into the active version's raw. Amend the wording | Data architect, counsel | 30 Oct | 7.9; DATA-REQ-042 text |
| Q7 | Is a voice-only letter allowed into the book before it has words (TDD 03 OQ-4) | Founder with F06 | 16 Oct | Waiting entry destination |
| Q8 | How to pause a pack on correction rate without sending the language name (section 10) | Founder, analytics engineer | 30 Oct | `correction_guard` event |
| Q9 | Chinese quotation marks in letter text versus the curly-quote content rule (R5 4.3) | Founder, content owner | 30 Oct | zh punctuation profile |
| Q10 | Recruiting and paying 70 native speakers and 7 reviewers (R-08) | Founder | 16 Oct | Gate timeline per wave |
| Q11 | The in-app per-language gate (7.1, 7.2) needs a gate or pause field in the signed manifest, which ADR 0016's `PackEntry` does not have. Build it before v1.0, or keep the gate as a release decision (ROADMAP 2.1: a language that fails is held back and the listing names only shipping languages)? Spec default [R]: release decision for v1.0; the field is an additive manifest change for v1.0.x | Founder, platform owner | 16 Oct | F05-REQ-001, F05-U15, F05-U16, F03 labels |
| Q12 | Training-data terms for the two models we built (Hindi small, Belle) before upload (ADR 0015 section 7) | Counsel, founder | Before FT-34 | Whether Hindi ships on its own model |
| Q13 | A smaller "starter" model (whisper-small, 190 MB, about a third of turbo) for the first letters while turbo downloads? Spec default [R]: no. Raw transcripts are permanent (DATA-REQ-040), so a weaker first transcript stays weak; with M17 a waiting letter costs the parent nothing | Founder, speech engineer | Before WP-F05-14 | F05-REQ-042 |

Answer dates above are when the answer is needed; if `08-delivery.md` section 2.1 moves a milestone, the answer date moves with it.

| A | Assumption | How we validate |
|---|---|---|
| A1 | Gate-status reads take under 5 ms | WP-F05-05 timing test on SE 3 |
| A2 | 10% of letters outside the chosen script is a useful mismatch threshold for Hindi | Gate corpus: compare flag rate with hand labels |
| A3 | 95% of started downloads finish within 24 h | `model_download` after consent, first 4 weeks of TestFlight |
| A4 | Hugging Face and R2 support Range requests | WP-F05-04 against the chosen host |
| A5 | A wrong-language chip gives visibly poor output rather than a fluent translation | Gate corpus: 2 clips per language decoded under the wrong code |

## 14. Sources

- Founder brief: `docs/agents/BRIEF-2026-10-03.md` items 6, 7, 9, 15, 16, 17 (B4, B5, B7, B13, B14, B15 in `_AUTHORING.md` section 3).
- V2: `docs/prd/v2/_AUTHORING.md`; `01-problem.md`; `02-customers.md` sections 3, 7 (U4); `03-goals-and-principles.md` sections 2, 4.3; `05-feature-map.md` sections 2 to 5; `09-decisions-and-risks.md` DR-01, DR-14, R-01, R-02, R-08, R-10, R-12, R-14; `features/F03-first-run.md` (F03-REQ-003 to -006, 6.3, Q3); `features/F04-capture.md` (F04-REQ-017, -018, F04-U27, U28, U47, section 11.4); `features/F08-recordings.md` sections 4, 6; `features/F15-export.md` (font sizes).
- PRD 1.3: `docs/prd/PRD.md` sections 7.4, 7.7, 7.10, PRD-REQ-004, K-14; `docs/prd/B-first-run-and-family.md` B-REQ-003, B-REQ-006, B-NFR-001, B-NFR-007.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-003, -007, -014, -018, -019, -044, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-001, -040, -041, -042, -046; `docs/legal/DATA_CLASSIFICATION.md`.
- Decisions and backlog: `docs/DECISIONS.md` D-031, D-040, D-046; `docs/BACKLOG.md` BL-043, BL-044, BL-111, BL-120, BL-130, BL-140 to BL-148, BL-177, BL-258.
- Design: `docs/adr/0001-on-device-asr.md`; `docs/adr/0002-server-asr-fallback.md`; `docs/adr/0012-open-models-transcription-and-grammar.md`; `docs/tdd/03-audio-transcription.md` sections 3.4 to 3.9, 4, 5, 6, 7, 8, 10, 12; `docs/tdd/06-performance-reliability.md` section 2.2; `docs/tdd/10-red-team-critique.md` risk 1.
- Code read 3 Oct 2026: `apps/mobile/src/lib/transcribe.ts`, `transcribe-whisper.ts`, `transcribe-sample.ts`, `model-files.ts`, `store.ts`, `copy.ts`, `db/migrations.ts`; `apps/mobile/src/app/listen.tsx`, `review.tsx`; `apps/mobile/modules/scribe-files`; `apps/mobile/package.json`; `packages/core/src/types.ts`, `text.ts`, `rules.ts`, `protect.ts`, `meaning.ts`, `verify.ts`, `pipeline.ts`; `packages/analytics/src/catalog.ts`; `packages/content/src/strings.en.ts`; `supabase/migrations/20260930000000_scribe_core.sql`, `20261002020000_data_governance.sql`; `experiments/`.
- Research: R5 sections 0, 1, 2, 3, 4, 7, 8, 9, 10 (R5-S9, R5-S16, R5-S27, R5-S29, R5-S30, R5-S32, R5-S34, R5-S35, R5-S36, R5-S38, R5-S43, R5-S44, R5-S48, R5-S53, R5-S54, R5-S55, R5-S56, R5-S66, R5-S68, R5-S70, R5-S71, R5-S73); R1 section 0 item 4 and F05 (R1-S13, R1-S15, R1-S26, R1-S27, R1-S28, R1-S33, R1-S60, R1-S61, R1-S67, R1-S68, R1-S70, R1-S73); R2 T12, T30 (R2-S14); R3 sections 2.1, 2.3; R4 sections 5, 6; CR S27.
