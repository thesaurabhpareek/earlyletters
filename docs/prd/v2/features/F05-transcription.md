# F05 On-device transcription and language packs

| | |
|---|---|
| Release | v1.0 gate (re-transcription UI is P1 inside v1.0; Hindi-English code-switching is v1.1, F33) |
| Priority and rank | P0, rank 3 (05-feature-map.md) |
| Personas | P1, P2, P3, P4, P6 |
| Existing IDs | B-REQ-003, B-REQ-006, A-REQ-002, A-REQ-030, K-14, K-24, PRD 7.4, PRD 7.7, PRD-REQ-004, LEGAL-REQ-007, LEGAL-REQ-014, LEGAL-REQ-018, LEGAL-REQ-019, LEGAL-REQ-022, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-046, D-031, D-040, D-046, DR-01, DR-14, R-01, R-02, R-08, R-12, R-14, BL-043, BL-140, BL-141, BL-142, BL-143, BL-144, BL-145, BL-147, BL-258, BL-265 |
| Depends on | F03 (author languages and script), F04 (recording, drafts, voice-only save), F06 (generic engine reads pack tables; verifier fix for marks and non-Latin punctuation, R-01), F07 (dictionary terms and phonetic tables), F16 (sync of new columns), F17 (Settings shell), F19 (manifest and pack delivery) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] Today no spoken letter can be transcribed in a release build: `availability()` in `apps/mobile/src/lib/transcribe-whisper.ts` always returns `'decoder-missing'`, and `modelFile()` loads any file that exists, verified or not (read 3 Oct). TDD 10 ranks this the top launch risk (risk 1).
- [D] The founder set seven spoken-letter languages at v1.0, each with language-specific transcription, script and punctuation (B4), and a lean app under 40 MB with models and non-English packs downloaded on demand as data (B13).
- [S] Quality differs widely by language. Whisper large-v3-turbo scores 3.62 to 5.97 WER on Spanish, English, Portuguese and French and 7.97 CER on Mandarin in a third-party FLEURS run, but 29.64 WER on Hindi and 15.72 on read Modern Standard Arabic [S] R5 section 1.1 (R5-S9). Arabic dialect speech sits at about 30 to 60 WER on open models [F, S] R5 section 1.2 (R5-S35, R5-S36).
- [F] A misheard word in a keepsake is permanent: `raw_transcript` is immutable by database trigger (DATA-REQ-040, `supabase/migrations/20261002020000_data_governance.sql`). A weak transcript saved once stays weak forever.
- [F] 24.5% of 2024 US births were to mothers born outside the 50 states and DC, and the six non-English launch languages have 53.5 million US speakers [F] R3 section 2.1, 2.3. No competitor we found asks which languages a family speaks; Day One takes the language from the keyboard and users report broken mixed-language output [F, S] R1 section 0 item 4 (R1-S60, R1-S61).
- [S] One Tinybeans user reported 9 GB of mobile data used overnight [S] R2-S14. A 574 MB model on cellular without consent would repeat that.
- [F] The engine would let a Hindi edit change "daughter" to "son", and an Arabic edit change "you" from feminine to masculine, today (R-01, R5 section 4.4 E2, E3). No non-English pack may ship until F06 fixes it.

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
- On-device transcription with whisper.rn for English, Spanish, French, Portuguese and Mandarin on one shared model, Whisper large-v3-turbo q5_0 (574 MB) [R] R5 section 8.1.
- Hindi with a Hindi-tuned model, only if it passes its gate on the SE 3 tier (DR-01 A); otherwise Hindi is "record and type".
- Arabic as "record and type" at v1.0 unless a model passes its gate (DR-01 A, R5 section 9 option A).
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
- Audio leaving the phone in v1.0 (B7, 03 section 5).
- Speaker identification, diarization or voiceprints (LEGAL-REQ-019). `tdrzEnable` is never true.
- Converting one Portuguese or English spelling variety into the other (rewording) [R] R5 section 1.2.
- Executable code inside a pack (App Review 2.5.2, R4 section 5).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Speech-to-Story in English and Spanish [F] R1-S13 | 4.8 (1,738 ratings) [F] R1-S15 | Transcription praised in 2 reviews [S] R2 T12; proper nouns dropped (CR S27, not re-checked) | **Innovate**: seven languages and names taught at first run |
| Rosebud | Voice transcription in 20 languages [F] R1-S33 | 4.9 (3.3K) | Voice-to-text unreliable at times [S] R1-S33 | Engine and on-device status Unverified; no call |
| Day One | Transcription language from the keyboard, then device language; on-device on iOS 26 with Apple Intelligence, Apple servers otherwise [F] R1-S60 | n/a | Dutch and English in one session gave broken Dutch; users asked for a per-recording setting [S] R1-S61 | **Avoid** keyboard-driven language; **Innovate** per-author default plus per-letter chip |
| Apple SpeechAnalyzer / SpeechTranscriber | On-device, model in system storage, iOS 26 and later, `supportedLocales` [F] R1-S70, R1-S73, R5-S18 | One developer found it about 3x faster than Whisper Small [F] R1-S28; Arabic assets failed to download in a beta [S] R1-S27 | n/a | **Match later** for languages it covers (v1.1 spike); cannot serve our iOS 17 floor (D-040) |
| Apple platform, iOS 27 | Apple Intelligence covers neither Hindi nor Arabic [F] R1-S26 | n/a | n/a | Plan open models for Hindi and Arabic from day one |
| Tiny Treasures | No transcription, sold as a privacy feature [F] R1-S67 | 5.0 (7) | n/a | **Innovate**: transcribe, but on the phone; say so calmly |
| Then | 7 languages, on-device [F] R1-S68 | Too new | n/a | Neutral; watch |

No memory product we found transcribes Hindi or Arabic on-device (R1 F05 opportunity). Our honest record-and-type state for a language that fails its gate is also something no competitor shows (Inferred from pages opened).

## 6. Experience

### 6.1 Entry points

| Entry | What starts | Owner of the screen |
|---|---|---|
| Finish on Listen (F04 step 5) | A transcription job for the draft, in the draft's `language` | F04 hands off; Review (F06) subscribes to the job |
| Keep the recording only on Review (`pendingCopy.review.voiceOnlyButton`) | A voice-only entry with `transcript_status = 'waiting'` (`saveVoiceOnlyFromDraft`, exists) and a queued job that fills the words once (`setWordsForWaitingEntry`, exists) | F04, F05 |
| Ready screen at the end of first run (F03 step 5) | Model and chosen packs queued for Wi-Fi (F03-REQ-005, -006) | F03 hands off |
| Settings > Languages and speech (new screen, F17 shell) | Status, sizes, download, mobile data choice, delete | F05 |
| A language passes its gate later (manifest update) | Language chip changes from Record and type to transcribed; waiting entries in that language get one job each | F05, F03 labels |
| Review, before first save: change the letter language (new) | A new job for the same draft in the new language; the earlier result is discarded | F06 screen, F05 job |
| P1: a newer passed model or pack is installed | Per-letter offer to make a second transcript (new version); never automatic adoption | F06 screen, F05 data |

### 6.2 Happy path (P1 Evening parent, English, model already on the phone, SE 3)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Finish after a 2-minute letter | Listen moves to processing (F04 step 5) | F04 writes the draft `ready` with `audio_sha256` and `language = en`. F05 inserts one `transcription_jobs` row (new table, section 11.3) with `state = queued`, priority `open_review` |
| 2 | Lands on Review | Review (`review.title`) with an honest progress line, "chunk i of n" (new `review.transcribing.progress`), and the recording player | Queue picks the job. Checks: model file verified (section 7, F05-REQ-020), pack for `en` loaded, thermal state below `serious`, app in foreground. Verifies the audio hash, then decodes M4A to 16 kHz mono PCM in memory (BL-140) whatever the source rate (44.1 kHz today, `listen.tsx`; 48 kHz if F08 moves it) |
| 3 | Waits, listens, or leaves the screen | Same progress line; nothing else moves | Silero VAD plans speech chunks of 28 s or less (TDD 03 3.5.3). Each chunk runs `transcribeData` with `language: 'en'` (forced, never `auto`), `translate: false`, `tdrzEnable: false`, `tokenTimestamps: true`, `maxLen: 1`, temperature 0 and the dictionary prompt rendered by the English pack (F07). Completed chunks are written to the job's `partial` after each chunk |
| 4 | Reads the transcript | Text appears only when every chunk is done (TDD 03 5.1); machine edits underlined (F06); first-time note `review.firstNote` (K-14) | Post-processing in `packages/core`: non-speech tags dropped, loop guard, words with exact offsets, `stt_meta` with model id and SHA-256, pack id and version, binding version, language. Result stored on the job. `faithfulClean` runs with the English pack tables (F06) |
| 5 | Saves (Add to the book or Keep private) | F06 destination buttons | In one local transaction the entry is inserted with `raw_transcript` and `stt_meta` from the chosen job result; from that insert the raw is immutable (DATA-REQ-040). Job row marked `done` and its `partial` cleared. Whisper context released after 45 s idle (TDD 03 3.5.4) |

**Variant: second language.** An author with English and Spanish taps the language chip on Listen (F04-REQ-017) and picks Spanish. Step 1 stores `language = es`; the same shared model runs with `language: 'es'` and the Spanish pack. No model swap is needed for en, es, fr, pt and zh (one shared model, section 7.3).

**Variant: Hindi with a passed Hindi model.** Same flow with the Hindi model file. The queue releases the turbo context first; one context is in memory at a time (TDD 03 3.5.4). Output stays in the script the author chose (section 7.7).

**Variant: language not passed (Arabic at v1.0).** No job is created. Review opens with the recording and Type the words (F04-U47). The author types with the Arabic keyboard; the typed text is never machine-edited (B5).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F05-U01 | No model on the phone at Finish | Job `state = waiting_model`; capture and save never wait (F04-REQ-018) | `pendingCopy.review.waitingTitle`, `.waitingBody`, `.voiceOnlyButton` | Keep the recording only; words arrive once the model verifies; or type | E2E with the model directory empty |
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
| F05-U13 | Silence or noise only (white-noise machine, fan) | VAD finds no speech; Whisper is not run; `outcome = no_speech`; raw stays empty | Recording kept with "Nothing to write down here. You can type it." (new `review.noSpeech`) | Type, or keep the recording | Corpus noise clips: zero phantom words (gate) |
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
| F05-U35 | VoiceOver | Progress announced once at start and once when words are ready (new `review.transcribing.a11yStart`, `.a11yDone`); Settings rows read name, status and size | Spoken state, no per-chunk chatter | n/a | Script V-F05 |
| F05-U36 | AX5 text on an SE 3 | Settings rows wrap; sizes on their own line; nothing truncates | Full text | n/a | Component test at AX5 |
| F05-U37 | Reduce Motion | Progress shown as text and a static bar, no animation | Static | n/a | Component test |

## 7. Requirements and acceptance criteria

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

Also required for every non-English language before its gate can pass: (a) the F06 verifier fix for marks, harakat and non-Latin punctuation with that language's adversarial test set green (R-01; R5 section 4.4 E1 to E8); (b) a native speaker has signed off the pack's filler, repeat and punctuation tables (R-08; R5 section 4.2); (c) the dictionary fix rules for that script pass F07's defect tests (F07 section 7).

**Sample design** (R5 section 8.2, extended in `experiments/`):

| Item | Plan |
|---|---|
| Harness fixes first | Fix E8 in `experiments/score.ts` (marks in `normWords`, CER for Chinese); add a per-phrase `language` field (today one global `language` in `experiments/config.example.json`); run the conversion path in `experiments/setup-hinglish.sh` for the Hindi candidates and the Arabic dialect model |
| Speakers | 10 consenting adult native speakers per language, recruited with written consent naming the use (TDD 03 7.3). Arabic: at least 3 dialect groups with 4 speakers each. Portuguese: 5 Brazilian, 5 European |
| Clips per speaker | 3 scripted fictional "Asha" letters of about 2 minutes, each with the child's name, nicknames and two family names, plus 1 unscripted 1-minute letter; recorded on an iPhone in bedtime conditions (low voice, white-noise machine, baby sounds) |
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

Tiers come from physical memory read on device (`expo-device` is installed at ~57.0.2; whether its `totalMemory` reports physical RAM on iOS is Unverified and WP-F05-05 checks it): **T6** 6 GB or more; **T4** 4 GB (iPhone SE 3, 12, 13 class; SE 3 RAM is a third-party figure, R5-S48); **T3** under 4 GB, if the iOS 17 floor (D-040) allows any such phone (TDD 03 OQ-1).

| Language | T6 | T4 (SE 3, the budget device) | T3 | Fallback when the gate fails |
|---|---|---|---|---|
| en, es, fr, pt, zh | Whisper large-v3-turbo q5_0, 574 MB, MIT (R5-S16, R5-S38), one shared file | Same file, if BL-043 shows the 30 s bar and no jetsam; else small q5_1, 190 MB (TDD 03 3.5.8), and each language must pass its gate again on small | small q5_1, gated per language (small per-language quality is Unverified, R5 1.1) | Record and type for that language on that tier |
| hi | IndicWhisper Hindi (Whisper medium, MIT, about 539 MB at q5_0, Inferred) first; ARTPARK whisper-large-v3-vaani-hindi (Apache-2.0, about 1.08 GB, Inferred) only if medium fails quality (R5 8.1) | IndicWhisper medium, only if it passes speed and memory on SE 3; large-v3 class is not attempted (1.42 times real time on A15, about 85 s per 2-minute letter, R5-S44; uncompressed large unsupported on A15 per Argmax, R5-S43) | Record and type | Record and type (DR-01 A) |
| ar | None at v1.0 unless a candidate passes: oddadmix whisper-large-v3-turbo-arabic-dialectal (Apache-2.0, about 574 MB, a separate file, R5-S34), which describes itself as a model to evaluate on your own data | Same | Record and type | Record and type (DR-01 A; R5 section 9 option A) |

Conversion of the Hindi and Arabic fine-tunes to ggml for whisper.rn is Unverified (R5 section 10). Every model file is pinned by SHA-256 and source revision in the manifest. Silero VAD is bundled in the app (TDD 03 3.5.8; size under 1 MB, Unverified). Core ML encoders are not downloaded at v1.0 (1.17 GB for turbo, R5-S16; TDD 03 9.1).

One model context is in memory at a time. An author with English and Hindi downloads two files (574 MB plus about 539 MB, R5 section 7); the queue releases one context before loading the other.

### 7.4 Language packs as data

A pack is data a generic engine in `packages/core` interprets (B13; App Review 2.5.2, R4 section 5). A pack holds no code, no expressions that are evaluated, and no flags that switch on a feature that was not reviewed (R4 section 5, 2.3.1).

**Contents** (one JSON document per language, schema `speech-pack/1`, new; validated on load):

| Field | What | Who uses it |
|---|---|---|
| `packId`, `language`, `packVersion` (semver), `schemaVersion`, `engineMin` (lowest `ENGINE_VERSION` that can read it) | Identity and compatibility | Loader |
| `whisper` | `language` code passed to whisper.rn; `promptPreamble` in the target script (simplified-Chinese sentence for zh; a Devanagari sentence for hi, R5 section 3); prompt term order | `asr-prompt` (new) |
| `fillers` | `auto` list (pure hesitation sounds) and `offer` list (words with meaning, offered only), R5 section 4.1 | F06 rules |
| `repeats` | Always-remove and suggest-only words; empty `auto` for non-English packs at v1.0 (R5 section 4.2) | F06 rules |
| `negation`, `modals`, `pronouns`, `kinship` | Closed word lists the verifier protects | F06 verifier, F07 |
| `punctuation` | Sentence-final marks, mood marks (? ! ？ ！ ؟), opening marks rule (¿ ¡), spacing (French no-break spaces), danda for hi, full-width set for zh (R5 section 4.3) | F06 |
| `script` | Expected script ranges for the mismatch flag (F05-U19); for zh a traditional-to-simplified pair table derived from OpenCC data (Apache 2.0, R5-S32) for the `script` edit (F06, new edit type) | F05, F06 |
| `phonetic` | Per-script tables for dictionary matching: Double Metaphone codes for Latin (npm `double-metaphone`, MIT, R5-S53), IndicSOUNDEX rules for Devanagari (paper only, code licence Unverified, R5-S55), toneless pinyin for zh (`pinyin-pro`, MIT, R5-S54), consonant skeleton for Arabic (low confidence, R5-S56) | F07 |
| `variety` | Portuguese pt-BR or pt-PT dictionary and punctuation choices only; never a spelling conversion (R5 section 1.2) | F06, F07 |
| `fonts` | Optional font files for reading: Noto Naskh Arabic (308 KB) and Noto Serif SC (25.1 MB) per F15's figures; Devanagari and Latin fonts ship in the app (BL-258) | F09, F15 |

Size: under 100 KB per pack except Mandarin (OpenCC and pinyin data, under 5 MB estimated, R5 section 7) plus any font file. The English pack ships inside the app; the other six are downloaded only when an author picks that language (B13; F03-REQ-006).

**Versioning.** `packVersion` follows semver: patch for table corrections, minor for additive fields, major for a schema change that needs a newer engine. A pack whose `engineMin` exceeds the running `ENGINE_VERSION` is not loaded; the previous compatible pack stays in use (F05-U28). Every entry records the pack id and version that cleaned it in `stt_meta` (new fields `packId`, `packVersion`), so a letter can be re-derived.

**Signed manifest.** The speech section of the F19 manifest (new schema `speech-manifest/1` in `packages/api`, new) lists, per language: gate state per tier, paused flag, pack id, version, URL, bytes, SHA-256; and per model: id, URL with a pinned revision, bytes, SHA-256, licence, minimum tier. The manifest carries a monotonic `manifestVersion` and an Ed25519 detached signature [R]; the public key is compiled into the app; the private key never sits in the repo (who holds it: Q5). The app rejects an unsigned manifest, a bad signature, an unknown schema or a lower `manifestVersion` than the cached one (F05-U17). Signature library: a permissive, maintained library chosen in WP-F05-03 under the brief's licence and 12-month release rule (B16; brief coordination rules); none is installed today. A manifest snapshot is bundled at build time for first launch offline (F05-U18).

**Hosting.** v1.0 uses the CDN path (DR-14 A, D-046): model files we did not change come from a pinned Hugging Face revision of the whisper.cpp model repository (R5-S16) or a zero-egress mirror; converted models and packs live on a zero-egress object store such as Cloudflare R2 (B13; founder picks the host, D-046). Never Supabase egress (D-046; about $11k to $12k at 220k installs, TDD 03 C-8). URLs are versioned and identical for every user; requests carry no user id, cookie or query string. Range requests must work on the chosen host (assumed for Hugging Face and R2, TDD 03 3.5.8, [A]); WP-F05-04 confirms. Apple-hosted asset packs are later (F49; iOS 26 only, no Expo module, R4 section 6).

**Download UX.** Sizes are shown before anything downloads ("Spanish words, 0.1 MB. Speech model, 574 MB, shared with English." new copy). Wi-Fi by default; mobile data only by the explicit choice (F05-U06; R2-S14 mobile data complaint). Never during launch and never blocking capture or first run (A-REQ-002; F03-REQ-005). Progress lives in Settings > Languages and speech and in a quiet line on the F03 Ready screen; no modal, no notification.

**Deletion in Settings.** Each downloaded language row and each model row has Delete with the size freed. Deleting a pack or model never touches letters, recordings or transcripts. After deletion, new letters in that language save audio and wait (F05-U01) until the files come back; the chip label does not change. The English pack cannot be deleted (it is in the app); the shared model can. Deleting the shared model while a non-English language still needs it asks once: "English, Spanish and French use this model. Delete it?" (new).

**App size budget.** F05 adds to the binary: whisper.rn native code, the decode module (BL-140), Silero VAD, the English pack and the manifest snapshot. TDD 03 estimates whisper.rn, VAD and decoder at 15 MB or less (E, TDD 03 5.4) against the 40 MB budget (B13). No model file and no non-English pack may be in the build (F05-REQ-016).

### 7.5 Model download manager

Replaces the load-any-file behaviour of `modelFile()` in `transcribe-whisper.ts` (verified 3 Oct: it returns the first existing file among the turbo and small names in Application Support and `Documents/models`, with no hash check; TDD 03 H-4).

- One manager for models and packs (`apps/mobile/src/lib/speech/assets.ts`, new), one download per asset id at a time (F05-U30).
- Download to `<modelsDirectory>/<id>.bin.part` with a sidecar `<id>.json` holding bytes done and the incremental SHA-256 state; HTTP Range requests in 8 MB parts; resume after kill, reboot and network change (TDD 03 3.5.8). Whether expo-file-system 57 offers a background `URLSession` download is Unverified (TDD 03 OQ-8); if it does, prefer it and keep Range as the fallback.
- Verify SHA-256 over the whole file against the signed manifest, then rename atomically to `<id>.bin`, mark it excluded from backup (`excludeFromBackup` in `model-files.ts`, exists), and write a row in the local `speech_assets` table (new: id, kind, version, sha256, bytes, path, verified_at, state).
- Loading a model reads the `speech_assets` row and checks size; a file without a verified row is never loaded (F05-U04). The full hash is checked again on the first load after an app update [R]; its cost on SE 3 is measured in WP-F05-04 [A].
- Disk check before start: asset size plus 100 MB free (TDD 03 3.5.8).
- Upgrades download beside the old file; the old file is deleted only after the new one verifies and no job is running on it.
- `Documents/models` is no longer read in release builds (ADR 0001 wants Application Support, TDD 03 C-9); dev builds may keep reading it behind `devShortcutsAllowed`.

### 7.6 Transcription queue

`apps/mobile/src/lib/speech/transcription-queue.ts` (new), persisted in a local `transcription_jobs` table (new). It replaces `review.tsx` calling `getTranscriber()` and `transcribe()` directly (verified 3 Oct; it passes no `language`, TDD 03 M-1).

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
| French | No-break spaces before : ; ? ! and inside « » kept in final text (needs the E7 fix) | R5-S71; R5 4.4 |
| Portuguese | Author's variety stored for dictionary and punctuation; no conversion between varieties | R5-S73 |
| All | `translate: false` always; no automatic language switch; output stays in the language and script spoken | Section 4 Never |

### 7.8 Code-switching at v1.0

Hindi-English mode is v1.1 (B4; F33). At v1.0 each letter has one language, chosen on the chip or from the author's default, and the model runs with that language forced. Words from another language are written however the model hears them under the forced language: in Hindi mode English words may come out in Devanagari, and in English mode Hindi words get English spellings (TDD 03 3.5.6, unmeasured). Names stay right through the dictionary (F07). Nothing detects or switches language automatically. The Review screen keeps the recording one tap away, and the author can edit or type.

Shipped copy must not promise more: `onboarding.dictionary.languagesBody` in `packages/content/src/strings.en.ts` says the parent can switch languages mid-sentence and every word stays in the language spoken. That is the v1.1 mode and must not ship at v1.0 (F05-REQ-031; change requested from the content owner).

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
| F05-REQ-003 | P0 | Gate sample per R5 8.2 | Given a gate report, Then it lists at least 10 speakers and 40 clips (Arabic: 3 dialect groups of 4; Portuguese: 5 pt-BR and 5 pt-PT), 5 noise clips, per-speaker bootstrap intervals, and the model, pack and engine versions | R5 8.2 |
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
| F05-REQ-017 | P0 | Packs are data | Given any pack, Then it validates against `speech-pack/1`, contains no field the engine evaluates as code, and adding or removing a pack changes no screen or feature; a test loads each pack through the generic engine only | B13; App Review 2.5.2 (R4 section 5) |
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
| F05-REQ-028 | P0 | No speech, no words | Given a noise-only clip, Then Whisper is not called, raw stays empty and Review shows `review.noSpeech` (new); corpus noise clips produce zero phantom words | TDD 03 3.5.7; ADR 0012 |
| F05-REQ-029 | P0 | Script rules per 7.7 | Given Hindi with Devanagari, Then output is never transliterated; Given Mandarin with traditional output, Then only verified `script` edits change characters and each is undoable; Given Arabic text, Then paragraph direction follows the first strong character and digits stay left to right | D-031; R5 1.2, 4.3; B-NFR-007 |
| F05-REQ-030 | P0 | Script mismatch flagged, never converted | Given a Hindi transcript with 10% or more of letters outside Devanagari and Latin [A], Then a `script_mismatch` flag is stored and Review shows `review.scriptMismatch` (new); no character is converted | R5-S27; TDD 03 FM-14 |
| F05-REQ-031 | P0 | v1.0 promises one language per letter | Given the v1.0 build, Then no shipped string says words in two languages are kept as spoken (today `onboarding.dictionary.languagesBody` does); Given a code-switched corpus clip per language, Then its WER is reported and does not gate | B4; TDD 03 3.5.6 |
| F05-REQ-032 | P0 | Change language before first save | Given a draft transcribed as `en`, When the author picks Spanish in Review before saving, Then a new job runs as `es`, the `en` result is discarded and never written as raw | ADR 0002 (choose before first save); TDD 03 C-4 |
| F05-REQ-033 | P0 | Every result records how it was made | Given a saved entry, Then `stt_meta` holds model id and SHA-256, pack id and version, binding version, language, prompt SHA-256, chunk times, dropped spans, flags and timing quality | TDD 03 3.5.2; BL-144 |
| F05-REQ-034 | P0 | Word timings stored | Given a saved spoken entry, Then word timings with exact offsets into raw are stored (for F34 in v1.1) and the quality gate value is recorded | BL-145; ADR 0009 |
| F05-REQ-035 | P0 | Transcript versions data contract | Given an entry, Then `raw_transcript` never changes; Given a second transcript, Then it is inserted as `transcript_versions.seq = 2` and an update to its `raw_text` fails with an immutability error in `npm run test:db` | DATA-REQ-040, -041; ADR 0002 |
| F05-REQ-036 | P1 | Compare and adopt a newer transcript | Given a letter made with an older model or pack and a newer passed one, When the author taps "Write it down again with the newer model", Then a job creates version n+1, Review shows both side by side with the recording, and Adopt writes the old state to `entry_versions` and can be undone | ADR 0002; DATA-REQ-041 |
| F05-REQ-037 | P0 | Transcription is free and local for every account state | Given signed out, lapsed Plus, or a joined co-parent, Then transcription behaves identically; no code under `apps/mobile/src/lib/speech/` reads entitlements | B2; B7 |
| F05-REQ-038 | P0 | Audio never leaves the phone in v1.0 | Given a full transcription run with a proxy, Then 0 requests carry audio, transcript text or dictionary terms; the only F05 requests are manifest, pack and model GETs with no user identifier | B7; 03 section 5; LEGAL-REQ-014 |
| F05-REQ-039 | P0 | Content-free logs | Given the log canary over a transcription run with Asha fixtures, Then zero fixture strings appear in logs or crash reports; whisper.rn native logging is off in release (`toggleNativeLog(false)`) | LEGAL-REQ-014; TDD 03 4.5 |
| F05-REQ-040 | P0 | Speed on the budget device for passed languages | Given 30 runs of a 2-minute letter per passed language on SE 3, Then Finish to text is p90 30 s or less and battery use is 2% or less per letter, or the founder records a changed budget (TDD 03 C-7) | PRD 7.7; BL-043, BL-044 |
| F05-REQ-041 | P0 | Accessibility of transcription states | Given VoiceOver, Then the start and the end of a job are each announced once; Given AX5 on SE 3, Then Settings > Languages and speech rows wrap without truncation; Given Reduce Motion, Then progress is static | LEGAL-REQ-051; F05-U35 to U37 |
| B-REQ-003 Rev (B4, DR-01) | P0 | Per-author languages drive transcription; Hindi script from D-031 | As in F03's revision; plus: Given the step was skipped, Then English is the letter language, not automatic detection (the 1.3 criterion "automatic detection is used" is withdrawn, R5 2.4) | B-REQ-003; R5 2.4 |
| B-REQ-006 Rev (B4) | P0 | Dictionary terms feed the prompt | Given terms from F07, Then the per-chunk prompt contains the terms' forms for the letter's script, capped at 200 tokens with lower-priority kinds dropped first | B-REQ-006; TDD 03 3.5.5 |
| A-REQ-002 | P0 | Splash never waits on model or network | Given a cold start with a model on disk, Then no whisper context is created before the first job | A-REQ-002 |
| A-REQ-030 | P0 | Offline | Given Airplane Mode with a verified model, Then record, transcribe and save succeed with 0 network requests | A-REQ-030 |
| PRD-REQ-004 | P0 | Author-only working material | Given a co-parent, Then `raw_transcript`, `stt_meta`, `machine_edits` and `transcript_versions` of the other parent's letters are not readable (access test) | PRD-REQ-004; K-09 |
| K-14 | P0 | It can make mistakes | Given the first transcribed letter on this install, Then `review.firstNote` shows once before save | K-14 |

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

### 11.1 What exists (verified 3 Oct 2026)

| Part | File | State |
|---|---|---|
| `Transcriber` interface, `getTranscriber()`, `dictionaryPrompt()` | `apps/mobile/src/lib/transcribe.ts` | Exists; `language` typed as `'auto' \| 'en' \| 'hi'` only |
| whisper.rn adapter | `apps/mobile/src/lib/transcribe-whisper.ts` | `availability()` always returns `'decoder-missing'` once the module and a file exist; `pcmFor()` throws for M4A; `modelFile()` loads any existing turbo or small file from Application Support or `Documents/models` with no hash; module-level context never released; one call per letter, so the prompt biases only the first 30 s (TDD 03 H-4, H-5, H-7, X-1) |
| Dev sample transcriber | `apps/mobile/src/lib/transcribe-sample.ts` | Dev only |
| Models directory, backup exclusion | `apps/mobile/src/lib/model-files.ts`, `apps/mobile/modules/scribe-files` | Exists |
| Voice-only save and set-once words | `apps/mobile/src/lib/store.ts`: `saveVoiceOnlyFromDraft`, `listWaitingForWords` (per child), `setWordsForWaitingEntry`, `setDraftTranscript` | Exists |
| Review calling the transcriber directly, no language | `apps/mobile/src/app/review.tsx` | Exists; replaced by queue subscription |
| Recording at 44.1 kHz AAC M4A | `apps/mobile/src/app/listen.tsx` | Exists (F08 may move to 48 kHz) |
| Engine, verifier, English-only tables | `packages/core/src/text.ts` (`WORD_RE`, `FILLERS`), `rules.ts`, `repeats.ts`, `meaning.ts`, `verify.ts`, `pipeline.ts` (`ENGINE_VERSION = 3`) | English-only (R5 section 4.4) |
| Experiment harness | `experiments/score.ts`, `config.example.json`, `setup-hinglish.sh` | Exists; E8 defect |

### 11.2 Components (new unless marked)

| Component | Package or path | Notes |
|---|---|---|
| Decode module `scribe-audio-decode` | `apps/mobile/modules/scribe-audio-decode/` | BL-140: `probe`, `decodeRange`, `sha256File`, `fsyncFile`; AVAudioFile and AVAudioConverter; no PCM on disk |
| Engine v2 | `apps/mobile/src/lib/transcribe-whisper.ts` (rewrite) | BL-141: bundled VAD, per-chunk `transcribeData`, tokens to words, `SttMeta`, `useCoreMLIos: false`, context lifecycle |
| Pure helpers | `packages/core/src/asr-plan.ts`, `asr-words.ts`, `asr-post.ts`, `asr-prompt.ts` | TDD 03 3.5.3 to 3.5.7; vitest |
| Pack schema and loader | `packages/core/src/packs/` (schema, loader, generic tables) | Engine reads tables from the pack per letter instead of the English constants; each change bumps `ENGINE_VERSION` |
| Manifest contract | `packages/api/src/speech-manifest.ts` | `packages/api` does not exist yet (B15; L0 work in 05 section 4) |
| Asset manager | `apps/mobile/src/lib/speech/assets.ts` | 7.5 |
| Gate-status API | `apps/mobile/src/lib/speech/languages.ts` | 7.2 |
| Queue | `apps/mobile/src/lib/speech/transcription-queue.ts` | 7.6 |
| Settings screen | `apps/mobile/src/app/settings/languages.tsx`, copy in `apps/mobile/src/components/speech/copy.ts` | F17 owns the Settings list entry |
| Local migration | `apps/mobile/src/lib/db/migrations.ts` next version | `transcription_jobs`, `speech_assets`, `transcript_versions`, `entries.active_transcript_seq`, `entries.language` (F04) |
| Server migration | `supabase/migrations/<timestamp in range>_transcript_versions.sql` | Data architect, `approve-migration` |
| Gate tooling | `experiments/gate.ts`, `experiments/reports/` (git-ignored) | Extends `score.ts` after the E8 fix |
| Manifest build and signing | `scripts/speech-manifest/` | Signing key handling: Q5 |

Libraries: whisper.rn ~0.7.4 (MIT, installed); `double-metaphone` (MIT), `pinyin-pro` (MIT) for pack generation (build time, not in the app bundle unless F07 needs them at run time); OpenCC data (Apache 2.0) converted into the zh pack at build time; an Ed25519 verifier chosen in WP-F05-03. Each new dependency goes through the brief's licence and 12-month release check.

### 11.3 Local tables (new)

```sql
CREATE TABLE transcription_jobs (
  id TEXT PRIMARY KEY,               -- UUIDv7
  target_kind TEXT NOT NULL,         -- 'draft' | 'entry'
  target_id TEXT NOT NULL,
  language TEXT NOT NULL,            -- 'en' | 'hi' | 'es' | 'zh' | 'fr' | 'ar' | 'pt'
  state TEXT NOT NULL,               -- queued | running | waiting_model | waiting_pack | done | failed | cancelled
  priority INTEGER NOT NULL,
  model_id TEXT, pack_id TEXT, pack_version TEXT,
  chunks_total INTEGER, chunks_done INTEGER NOT NULL DEFAULT 0,
  partial TEXT,                      -- JSON of completed chunk results (L4)
  result TEXT,                       -- JSON {raw, words, meta, outcome} (L4)
  fail_code TEXT, attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- At most one live job (queued, running, waiting_model, waiting_pack) per target:
CREATE UNIQUE INDEX transcription_jobs_live ON transcription_jobs (target_kind, target_id)
  WHERE state IN ('queued', 'running', 'waiting_model', 'waiting_pack');
CREATE TABLE speech_assets (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, version TEXT NOT NULL,
  sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, path TEXT NOT NULL,
  state TEXT NOT NULL, verified_at TEXT
);
CREATE TABLE transcript_versions (
  id TEXT PRIMARY KEY, entry_id TEXT NOT NULL, seq INTEGER NOT NULL,
  raw_text TEXT NOT NULL, stt_meta TEXT NOT NULL, machine_edits TEXT NOT NULL,
  created_at TEXT NOT NULL, UNIQUE (entry_id, seq)
);
```

### 11.4 Sequencing

1. WP-F05-01 decode module and WP-F05-02 harness fixes start now (no dependencies). BL-043 device spike runs on the decoder prototype in weeks 2 to 4 (R-02).
2. WP-F05-03 manifest and pack schema, WP-F05-04 asset manager, in parallel with WP-F05-06 engine v2.
3. WP-F05-07 queue after engine v2 and BL-130.
4. WP-F05-05 gate-status API, then F03 WP-F03-03 and F04 WP-F04-06 consume it.
5. WP-F05-08 Settings screen, WP-F05-09 transcript versions data contract.
6. Language waves: en first; es, fr, pt, zh as each passes; hi when its gate passes on T4; ar only if a candidate passes (DR-01, R-08). Each wave is WP-F05-11 for that language.

### 11.5 Riskiest unknown and the spike

**Unknown:** turbo q5_0 speed and memory under whisper.cpp on an A15 with 4 GB. No published figure exists in any runtime (R5 section 2.2); Argmax's uncompressed turbo is not supported on A15 and its compressed builds have no A15 speed entry (R5-S43, R5-S44).
**Spike:** BL-043 with the WP-F05-01 prototype: 30 runs of a 2-minute letter on SE 3, a 12 and a current iPhone; seconds per audio minute, peak memory, jetsam count, battery and thermal; repeated for IndicWhisper medium after conversion. If turbo misses on SE 3: small q5_1 on T4 with per-language re-gating, or a founder-recorded relaxed budget (TDD 03 5.1; 05 section 5 item 3).

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F05-01 | M4A decode module (BL-140) | `apps/mobile/modules/scribe-audio-decode/` | none | Device contract test: 44.1 and 48 kHz fixtures give 16 kHz mono PCM16 within 1 frame of duration; no file created in tmp or caches; `[F05-REQ-026]` | agent plus device check (speech engineer) |
| WP-F05-02 | Harness fixes and gate tooling (E8, per-phrase language, CER, bootstrap, report JSON) | `experiments/score.ts`, `experiments/gate.ts` (new), `experiments/config.example.json` | F06 tokenizer fix for marks (shared regex) | `score.test.ts` cases for Devanagari tokens and Chinese CER; `[F05-REQ-003]` report schema test | agent (speech engineer) |
| WP-F05-03 | Speech manifest and pack schema, signature verify, bundled snapshot | `packages/api/src/speech-manifest.ts`, `packages/core/src/packs/schema.ts`, `scripts/speech-manifest/` | `packages/api` scaffold (L0) | `[F05-REQ-017]`, `[F05-REQ-018]` with tampered, unsigned, rolled-back fixtures | agent (speech engineer, platform engineer) |
| WP-F05-04 | Asset manager: Range download, sidecar, SHA-256, rename, backup flag, disk check, delete, upgrades (BL-143) | `apps/mobile/src/lib/speech/assets.ts`, local migration part for `speech_assets` | WP-F05-03, BL-111 | `[F05-REQ-018]`, `[F05-REQ-020]` to `[F05-REQ-025]` against a local Range server fixture; kill at 5 offsets on device | agent plus device check (mobile engineer) |
| WP-F05-05 | Gate-status API and tier detection | `apps/mobile/src/lib/speech/languages.ts` | WP-F05-03, WP-F05-04 | `[F05-REQ-001]`, `[F05-REQ-007]` with manifest fixtures; tier read checked on SE 3 | agent (mobile engineer) |
| WP-F05-06 | Engine v2: VAD, chunk planner, per-chunk prompt, words, `SttMeta`, context lifecycle, verified-model load (BL-141) | `apps/mobile/src/lib/transcribe-whisper.ts`, `transcribe.ts`, `packages/core/src/asr-*.ts` | WP-F05-01, WP-F05-04 | `[F05-REQ-008]`, `[F05-REQ-009]`, `[F05-REQ-027]`, `[F05-REQ-028]`, `[F05-REQ-033]`, `[F05-REQ-034]`; config lint | agent (speech engineer) |
| WP-F05-07 | Transcription queue, waiting entries, Review subscription (BL-142) | `apps/mobile/src/lib/speech/transcription-queue.ts`, local migration part for `transcription_jobs`, `review.tsx` transcription call only | WP-F05-06, BL-130 | `[F05-REQ-010]` to `[F05-REQ-015]`, `[F05-REQ-032]`, `[F05-REQ-037]` | agent (mobile engineer, speech engineer) |
| WP-F05-08 | Settings > Languages and speech | `apps/mobile/src/app/settings/languages.tsx`, `apps/mobile/src/components/speech/` | WP-F05-05 | `[F05-REQ-022]`, `[F05-REQ-024]`, `[F05-REQ-041]` component tests at AX5 and with VoiceOver labels | agent (mobile engineer, design systems) |
| WP-F05-09 | Transcript versions data contract (local and server) (BL-144 part) | local migration part, `supabase/migrations/<range>_transcript_versions.sql`, `supabase/tests/` | BL-111, data architect | `[F05-REQ-035]`, `[PRD-REQ-004]` access tests in `npm run test:db` | agent, `approve-migration` (data architect) |
| WP-F05-10 | Script rules: zh `script` edit table generation, Hindi mismatch flag, Arabic direction in transcript views | `packages/core/src/packs/zh/`, `packages/core/src/asr-post.ts` | F06 `script` edit type, WP-F05-03 | `[F05-REQ-029]`, `[F05-REQ-030]` | agent (speech engineer) |
| WP-F05-11 | Per-language gate run and pack sign-off (one WP per language, in waves) | `docs/qa/evidence/F05-gate-<lang>.md`, `docs/qa/evidence/F05-pack-<lang>-<version>.md`, pack JSON | WP-F05-02, F06 verifier fix (BL-120 widened), corpus (BL-147) | `[F05-REQ-002]` to `[F05-REQ-006]` report and sign-off present | pair (speech engineer with a native reviewer; founder signs) |
| WP-F05-12 | Device budget run for passed languages | `docs/qa/evidence/F05-device.md` | WP-F05-06, WP-F05-07 | `[F05-REQ-040]` numbers recorded (BL-044) | human (QA engineer) |
| WP-F05-13 | P1: compare and adopt a newer transcript | `apps/mobile/src/components/speech/compare.tsx` | WP-F05-09, F06 Review | `[F05-REQ-036]` | agent (mobile engineer) |

## 13. Open questions and assumptions

| Q | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | DR-01: which languages ship at v1.0, and is Arabic Record and type | Founder | 30 Oct | Manifest gate states; F03 labels |
| Q2 | Accept the 7.1 pass bars, including Hindi 15% WER and Arabic 20% per dialect group | Founder, speech engineer | 23 Oct (before the gate runs) | F05-REQ-002 |
| Q3 | If turbo misses 30 s on SE 3: small model on T4 with re-gating, or a relaxed budget | Founder | 30 Oct (after BL-043) | Section 7.3; F05-REQ-040 |
| Q4 | Model and pack host (Hugging Face pinned revision, R2, or both) and its data-map row | Founder, counsel for the row | 16 Oct (D-046) | Manifest URLs; data map |
| Q5 | Who holds the manifest signing key and how CI signs without it in the repo | Founder, platform engineer | 23 Oct | WP-F05-03 |
| Q6 | DATA-REQ-042 says edit offsets point into `raw_transcript`; with versions they point into the active version's raw. Amend the wording | Data architect, counsel | 30 Oct | 7.9; DATA-REQ-042 text |
| Q7 | Is a voice-only letter allowed into the book before it has words (TDD 03 OQ-4) | Founder with F06 | 16 Oct | Waiting entry destination |
| Q8 | How to pause a pack on correction rate without sending the language name (section 10) | Founder, analytics engineer | 30 Oct | `correction_guard` event |
| Q9 | Chinese quotation marks in letter text versus the curly-quote content rule (R5 4.3) | Founder, content owner | 30 Oct | zh punctuation profile |
| Q10 | Recruiting and paying 70 native speakers and 7 reviewers (R-08) | Founder | 16 Oct | Gate timeline per wave |

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
