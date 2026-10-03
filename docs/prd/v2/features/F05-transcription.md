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
- [F] The engine would let a Hindi or Arabic edit change "daughter" to "son" today (R-01, R5 section 4.4 E2, E3). No non-English pack may ship until F06 fixes it.

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
