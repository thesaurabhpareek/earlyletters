# Mobile platform

The iOS app: speech models, languages, audio, design system, accessibility, sign-in, packs and the minimum iOS version.

### ADR-0001 On-device ASR: whisper.rn with Whisper large-v3-turbo q5_0, first-run download
- **Source:** `docs/adr/0001-on-device-asr.md` (Accepted pending Phase 0 measurements, 2026-10-01)
- **Decided:** whisper.rn with `ggml-large-v3-turbo-q5_0` (574 MB) on devices with enough RAM and `ggml-small-q5_1` (190 MB) as the fallback tier; the family dictionary goes into the initial prompt; never translate; the model downloads on first use, SHA-256 verified, stored in Application Support excluded from backup; the `experiments/` harness gates any model change.
- **Why:** offline, zero cost per minute, word timings, names through a dictionary; bundling 574 MB would bloat every install and update.
- **Alternatives:** WhisperKit (no RN binding); Apple SpeechAnalyzer (iOS 26 floor, no custom vocabulary, Hindi unconfirmed; revisit as English-only); Parakeet, Canary, Moonshine, distil (no Hindi); sherpa-onnx (thin RN binding).
- **Door:** two-way: model swaps are config plus a download, not app releases (the ADR's consequences)
- **Reversal cost:** low: a pack and catalog change
- **Revisit when:** technology: an on-device model beats turbo on the golden corpus; platform: Apple SpeechAnalyzer gains custom vocabulary and Hindi
- **Review by:** 2027-01-15
- **Status:** in force
- **As built:** `apps/mobile/src/lib/models/catalog.ts`, `apps/mobile/src/lib/models/whisper-runtime.ts`, `apps/mobile/src/lib/transcribe-whisper.ts`
- **Also:** ADR 0012 and ADR 0015 (both Proposed) refine it; D-046 moves hosting off Supabase

### ADR-0002 Server ASR fallback: hosted open Whisper through an OpenAI-compatible API, consented
- **Source:** `docs/adr/0002-server-asr-fallback.md` (Accepted, 2026-10-01)
- **Decided:** fallback chain Groq whisper-large-v3-turbo (zero data retention) then DeepInfra turbo, behind a Supabase Edge Function holding the keys, only after explicit consent; results stored as a new engine record; the raw transcript is set once and never overwritten.
- **Why:** some devices cannot run turbo; self-hosting GPUs is real ops work for a solo founder.
- **Alternatives:** self-hosted GPU now (ops burden, idle cost); closed APIs (not open models, not needed at these prices).
- **Door:** two-way: consent-gated and off by default
- **Reversal cost:** low: nothing built
- **Revisit when:** cost: fallback spend exceeds roughly the cost of an always-available GPU; customer: Hinglish quality demands a custom model (both from the ADR)
- **Review by:** on trigger
- **Status:** parked: v1.0 is on-device only with no server (D-085, PR #54); ADR 0017 says the AI gateway returns with v1.1
- **As built:** not built

### ADR-0003 Edit-pass model: rules first; hosted small open-weights LLM behind a flag; on-device later
- **Source:** `docs/adr/0003-edit-pass-model-strategy.md` (Accepted, 2026-10-01)
- **Decided:** v1 default is rules only; if Phase 0 shows material residual errors, a hosted Qwen3.5-9B on DeepInfra proposes typed edits as JSON, every one through `verifyEdits()`, with consent; later an on-device model. Prefer Apache 2.0 or MIT weights.
- **Why:** the model is never trusted: it proposes, code decides.
- **Alternatives:** on-device LLM in v1 (download size and RAM); closed frontier APIs (cost and lock-in).
- **Door:** two-way: the pass is built and off; swapping models is config
- **Reversal cost:** low
- **Revisit when:** customer: the 14-recording experiment shows word error after cleaning drops by 2 points or more with a model pass (ADR 0012 bar)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/core/src/model-edits.ts`, `packages/core/src/verify.ts`

### ADR-0005 Audio format: AAC-LC mono 64 kbps in M4A via expo-audio
- **Source:** `docs/adr/0005-audio-format.md` (Accepted, 2026-10-01)
- **Decided:** record AAC-LC, mono, 44.1 or 48 kHz, 64 kbps, `.m4a`, with custom expo-audio options; decode to 16 kHz for ASR on the fly and never store the downsampled copy; store a SHA-256 of each file; export includes M4A as is.
- **Why:** must play on any device in 2044, be small enough to keep, and be good enough for ASR and listening; one format for record, playback, backup and export.
- **Alternatives:** Opus as primary (extra transcoding on iOS); lossless as primary (10x storage for no audible benefit on phone mics).
- **Door:** one-way after launch: every family's recordings are stored in this format; a change later means supporting two formats or transcoding originals, which the constitution forbids altering
- **Reversal cost:** medium: new recordings can change format, old ones stay as they are
- **Revisit when:** technology: an archival export format (Opus or FLAC) is requested; customer: families report poor playback quality
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/capture/recorder.ts` (ADR 0015 moves the rate to 48 kHz, same bitrate)

### ADR-0009 Word alignment for Read together
- **Source:** `docs/adr/0009-word-alignment.md` (Accepted, 2026-10-01)
- **Decided:** store raw ASR word timings; project them through stored edits deterministically in `packages/core`; mark low-quality alignment and fall back to sentence-level highlighting; optional consented server re-alignment in v1.x.
- **Why:** no extra on-device model; honest degradation instead of wrong highlights.
- **Alternatives:** on-device CTC forced alignment in v1 (another model, unclear Hindi); WhisperX server for every entry (GPU ops).
- **Door:** two-way: derived data computed from stored timings
- **Reversal cost:** low
- **Revisit when:** platform: v1.1 word highlighting work starts
- **Review by:** on trigger
- **Status:** parked: word highlighting in Read together is v1.1 (D-059)
- **As built:** not built (no alignment module in `packages/core/src`)

### ADR-0012 Open models for transcription and light grammar (2026 refresh)
- **Source:** `docs/adr/0012-open-models-transcription-and-grammar.md` (Proposed, 2026-10-02; final only after the founder's 14-recording experiment)
- **Decided:** on-device ASR stays whisper.rn turbo with small for low-RAM phones; server fallback Groq then DeepInfra, consented; two Apache 2.0 Hinglish fine-tunes enter the experiment, adopted only as an opt-in mode if they win; grammar is rules only for v1, including phrase restarts; watch Qwen3-ASR, IndicConformer and SpeechAnalyzer.
- **Why:** the constitution limits cleanup to typed edits through `verifyEdits`; restarts were left in place in the web preview.
- **Door:** two-way: models are config and every change goes through the experiment harness
- **Reversal cost:** low
- **Revisit when:** customer: the 14-recording experiment results (names at least 95% after cleaning; zero phantom words; Hinglish model at least 10 points better); technology: Qwen3-ASR or IndicConformer gains an RN runtime
- **Review by:** 2026-10-30
- **Status:** proposed: the ADR header says Proposed until the experiment runs
- **As built:** `experiments/run.ts`, `experiments/setup-hinglish.sh`, `packages/core/src/repeats.ts`

### ADR-0014 Languages as data: text-rules packs, one engine, phonetic keys
- **Source:** `docs/adr/0014-languages-and-phonetics.md` (Accepted for the engine and packs, 2026-10-03; word tables per language Proposed until a native speaker signs each off)
- **Decided:** one generic engine compiles a `TextRulesPack`; English is a pack like the others; enabling tables need native review or a cited standard, protective tables load as drafts; unreviewed languages run in punctuation-safe mode; script conversion is a `punctuation` edit, not a new edit type; Chinese is tokenised per character; phonetic keys only suggest; regional variation is labelled, never normalised.
- **Why:** probing the English-only engine found six meaning-changing non-English edits it accepted; Hermes has no `Intl.Segmenter`; `EditType` is a closed set shared with stored edits and analytics.
- **Alternatives:** a new `script` edit type; JS rule modules per language (executable download against guideline 2.5.2); a dictionary segmenter for Chinese; AGPL and GPL transliteration tools.
- **Door:** two-way: packs are signed data that can be republished without a release
- **Reversal cost:** low: a pack republish; the engine is code
- **Revisit when:** customer: a native speaker signs off a language's word tables (that enables more edits); technology: Hermes gains `Intl.Segmenter`
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/core/src/lang/engine.ts`, `packages/core/src/lang/languages.ts`, `packs/text-rules/hi.json`

### ADR-0015 Per-language speech models, prompts, voice detection and listening copies
- **Source:** `docs/adr/0015-per-language-speech-models.md` (Proposed, speech engineer, 2026-10-03; final per language only after its golden-corpus check)
- **Decided:** one shared multilingual model for every language it serves well and a language's own model only where clearly better (today Hindi small); the original recording is never processed; a listening copy is made with AUSoundIsolation, excluded from backup and never exported; recording moves to 48 kHz, still AAC-LC mono 64 kbps.
- **Why:** smallest download for every one-language family; Apple's voice processing at record time would change the original (remove a baby's laugh).
- **Alternatives:** Apple voice processing at record time (alters the original); RNNoise (fallback only); DeepFilterNet 3 (build and maintenance cost).
- **Door:** two-way: model mapping is app data; the listening copy is derived and deletable
- **Reversal cost:** low
- **Revisit when:** customer: golden-corpus results per language (names 95%, zero phantom words, script compliance 95%); law: counsel on training-data terms for the two built models
- **Review by:** 2026-12-01
- **Status:** proposed: the ADR header says Proposed
- **As built:** `apps/mobile/src/lib/models/catalog.ts`, `apps/mobile/src/lib/audio-enhance/index.ts`, `apps/mobile/modules/scribe-audio/ios/ScribeAudioModule.swift`

### ADR-0101 UI component library and styling model
- **Source:** `docs/adr/0101-ui-component-library.md` (Accepted, 2026-10-01; revised 1 Oct; amended 3 Oct for sheets)
- **Decided:** React Native Reusables components copied into the repo and owned by us; Uniwind (Tailwind v4) for styling with NativeWind as fallback; `@expo/ui` for Toggle, SegmentedControl and the long-press menu behind our own names with per-platform files; Reanimated and Gesture Handler for motion; Phosphor icons; no SF Symbols, Lottie or Rive in v1; one token source for iOS and web. Amended 3 Oct: in-app sheets use `@gorhom/bottom-sheet` behind `ui/sheet.tsx`.
- **Why:** component code must be readable and in our repo so an AI assistant can edit it; one styling model on mobile and web; iOS polish matters more than component count.
- **Alternatives:** MUI, Mantine, Ant Design (web only); `@ant-design/react-native`; HeroUI Native; gluestack-ui v5; Tamagui; React Native Paper; Expo UI only; Unistyles; NativeWind 4.
- **Door:** two-way: owned component files and a styling library that can be swapped with a regression pass
- **Reversal cost:** medium: about 22 components to restyle
- **Revisit when:** technology: Uniwind stops being maintained (it is 1.x and mainly one vendor); platform: Android work starts (each `.ios.tsx` needs an `.android.tsx`)
- **Review by:** on trigger
- **Status:** amended by D-052
- **As built:** `apps/mobile/src/components/ui/sheet.tsx`, `apps/mobile/src/components/platform`, `packages/design-tokens/src/tokens.ts`

### D-027 Letter text is never capped for Dynamic Type
- **Source:** `docs/DECISIONS.md` D-027 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** letter body, transcript, Write and Review fields and signature use no `maxFontSizeMultiplier`; titles use token caps; capped chrome shows the Large Content Viewer.
- **Why:** A-NFR-005 and PRD 7.6 require AX5; grandparents are first-class readers; capping fails the gate as written (TDD 09 Q2, TDD 07 OQ-10).
- **Door:** two-way: code
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/app/letter/[id].tsx`, `apps/mobile/src/app/review.tsx`

### D-028 Dates follow the device locale
- **Source:** `docs/DECISIONS.md` D-028 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** `Intl.DateTimeFormat` with the device locale; the US dateline reads "Tuesday, September 29, 2026"; plurals through `Intl.PluralRules`.
- **Why:** B-NFR-007 "locale dates"; US-first launch; TDD 09 Q3 and L1.
- **Door:** two-way: code
- **Reversal cost:** low
- **Revisit when:** technology: Hermes lacks `Intl.PluralRules` (ADR 0014 found it missing), so plural handling needs another path
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/dates.ts`

### D-029 Separate `destructive` colour token
- **Source:** `docs/DECISIONS.md` D-029 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** add a `destructive` token equal to the terracotta `recording` colour, separate from amber `caution`; destructive actions keep icon plus words, never colour alone.
- **Why:** TDD 09 Q1 default; warnings and destructive actions must not look alike.
- **Door:** two-way: a token
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/design-tokens/src/tokens.ts`

### D-031 Hindi script default (Devanagari, Roman or automatic)
- **Source:** `docs/DECISIONS.md` D-031 (Open, 2026-10-03; decides: the founder, from the 14-recording experiment and the device spike; due 30 Oct)
- **Decided:** not decided. Default if unanswered: Devanagari for Hindi with English in Latin; Roman offered only if the experiment shows it works.
- **Why:** base turbo does not produce Roman Hindi reliably (TDD 03 C-6); fine-tunes change English accuracy (ADR 0012).
- **Door:** one-way after launch: the script of stored letters and the printed book follow it; letters are never rewritten afterwards
- **Reversal cost:** medium: new letters can change script, old ones stay as written
- **Revisit when:** customer: the 14-recording experiment results
- **Review by:** 2026-10-30
- **Status:** open
- **As built:** `packs/text-rules/hi.json`; `apps/mobile/src/lib/transcribe-prompt.ts`

### D-032 Shared voice in v1.0: recordings in a shared book upload so family hear each other
- **Source:** `docs/DECISIONS.md` D-032 (Recommended, needs founder OK, 2026-10-03)
- **Decided:** recommended one audio upload pipeline with a per-file key wrapped by a server-held key; Free uploads recordings in shared books, Plus every recording.
- **Why:** with family in the app, a grandparent's recording would otherwise never reach the parents in a Free family.
- **Alternatives:** text-only family letters in v1.0; free backup for everyone; full ADR 0006 in v1.0.
- **Door:** two-way: never built
- **Reversal cost:** low
- **Revisit when:** none expected: answered
- **Review by:** on trigger
- **Status:** superseded by D-073
- **As built:** not built

### D-033 Free audio durability: the phone plus the user's own iCloud device backup plus export
- **Source:** `docs/DECISIONS.md` D-033 (Recommended, needs founder OK, proceed: yes for the storage path, 2026-10-03)
- **Decided:** keep recordings in a backed-up app directory so the user's own iCloud device backup includes them; keep the speech model excluded from backup; rewrite "only on this phone" to "on this phone and in your iPhone's own backup, if you use one"; add a restore drill to QA.
- **Why:** iOS includes app documents in device backups by default, so the old claim was inaccurate; excluding audio would make a lost phone lose the child's voice for Free users.
- **Alternatives:** exclude audio from device backup and keep the claim.
- **Door:** two-way: a storage location and copy
- **Reversal cost:** low: excluding audio later would be a code change, but it would cost families their only backup
- **Revisit when:** platform: Apple changes what device backups include
- **Review by:** on trigger
- **Status:** amended by D-073
- **As built:** `apps/mobile/src/lib/model-files.ts`; `docs/ops/runbooks/restore-drill.md`
- **Also:** D-073 superseded the copy consequence; D-085 then restored reliance on the iPhone backup plus Export for v1.0, so the storage path stands

### D-034 Safety classifier only with a clinician's written sign-off, otherwise a static resources row
- **Source:** `docs/DECISIONS.md` D-034 (Recommended, needs founder OK, 2026-10-03)
- **Decided:** the on-device classifier ships only with a perinatal clinician's written sign-off by 20 Nov; otherwise a static "If you are struggling" row. Tiers never leave the device.
- **Why:** `packages/core/src/safety.ts` says do not ship outside the founding family until reviewed; false negatives look negligent, false positives feel surveillant.
- **Door:** two-way: the classifier stays behind a switch
- **Reversal cost:** low
- **Revisit when:** none expected: answered
- **Review by:** on trigger
- **Status:** superseded by D-059
- **As built:** `packages/core/src/safety.ts` (not enabled); `apps/mobile/src/app/settings/index.tsx` (static row)

### D-040 Minimum iOS 17
- **Source:** `docs/DECISIONS.md` D-040 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** iOS 17 minimum.
- **Why:** StoreKit 2 needs iOS 15; XCUITest accessibility audits need 17; Declared Age Range is called only where it exists (TDD 07 OQ-1, TDD 09 Q6, TDD 01 OQ-6).
- **Door:** two-way: raising or lowering the floor is a build setting (raising it later drops users on older phones)
- **Reversal cost:** low
- **Revisit when:** platform: the minimum iOS can become 26 (ADR 0016 revisits Apple-hosted packs then)
- **Review by:** on trigger
- **Status:** in force
- **As built:** not built: no deployment target is set in `apps/mobile/app.config.ts`; open PR #126 sets 17.0 under D-098 (proposed in open PR #122)

### D-044 Sign-in methods at v1.0: Apple and email link plus code; Google in v1.1
- **Source:** `docs/DECISIONS.md` D-044 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** Sign in with Apple and email link plus 6-digit code at v1.0; Google in v1.1.
- **Why:** Guideline 4.8 requires an equivalent option only when a third-party login is offered; saves a provider, a client id and a test matrix.
- **Door:** two-way: replaced before launch
- **Reversal cost:** low
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-054
- **As built:** see D-054

### D-046 Speech model files on a zero-egress host, never on Supabase egress
- **Source:** `docs/DECISIONS.md` D-046 (Recommended, the founder picks the host, proceed: yes, 2026-10-03)
- **Decided:** host model files on a zero-egress or free-egress object store, with versioned URLs and SHA-256 in the manifest; never Supabase egress; add the host to the data map.
- **Why:** about $11k to $12k of egress at 220k installs on Supabase (TDD 03 C-8, TDD 06 P-9).
- **Door:** two-way: the host sits behind a signed manifest
- **Reversal cost:** low: a manifest and catalog change
- **Revisit when:** cost: the pack host leaves its free tier (R2: 10 GB-month storage, 10M Class B requests a month, per ADR 0016); platform: Apple-hosted Background Assets become usable (minimum iOS 26)
- **Review by:** on trigger
- **Status:** in force: the host itself is not yet chosen (D-097 proposes `packs.earlyletters.app` on Cloudflare R2 in open PR #122)
- **As built:** `apps/mobile/src/lib/models/catalog.ts`

### D-051 Standard over custom
- **Source:** `docs/DECISIONS.md` D-051 (Decided, founder, 2026-10-03)
- **Decided:** use what Apple and well-known, stress-tested open-source libraries provide out of the box; add our finishing touches on top.
- **Why:** not recorded in the source beyond the founder brief (decision 1: do not build what we would have to maintain when a solid standard exists)
- **Door:** two-way: a principle applied choice by choice
- **Reversal cost:** low
- **Revisit when:** team: a second engineer joins
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/modules/scribe-store/ios/PlusStoreSheet.swift` (Apple's store view instead of our own paywall)
- **Also:** BRIEF-20261003-1

### D-052 Quality bar: premium and calm; motion and components from proven libraries
- **Source:** `docs/DECISIONS.md` D-052 (Decided, founder, 2026-10-03)
- **Decided:** premium and calm, benchmarked on Airbnb, Calm, Headspace, Day One and Apple; motion and components from high-quality libraries (Reanimated, Gesture Handler, `@gorhom/bottom-sheet`, Apple-native views through Expo).
- **Why:** not recorded in the source beyond the founder brief (decision 2)
- **Door:** two-way: a design principle
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `docs/design/BENCHMARK.md`, `apps/mobile/src/lib/motion.ts`, `apps/mobile/src/components/ui/sheet.tsx`
- **Also:** BRIEF-20261003-2

### D-054 Sign-in: Apple, Google and email magic link; passkeys after sign-in; no passwords
- **Source:** `docs/DECISIONS.md` D-054 (Decided, founder, 2026-10-03; supersedes D-044)
- **Decided:** Sign in with Apple, Sign in with Google and email magic link; passkeys can be added after sign-in; no passwords, so no forgot-password flow.
- **Why:** not recorded in the source beyond the founder brief (decision 4: "simple")
- **Door:** one-way after launch: accounts created with a provider depend on it; removing a provider strands those accounts
- **Reversal cost:** medium: account linking and user communication once accounts exist
- **Revisit when:** platform: Apple or Google changes sign-in rules; customer: sign-in support requests
- **Review by:** on trigger
- **Status:** parked: sign-in is behind the server switch, off in every v1.0 build profile (PR #54, D-085)
- **As built:** `apps/mobile/src/lib/auth/apple.ts`, `apps/mobile/src/lib/auth/google.ts`, `apps/mobile/src/lib/auth/passkey.ts`
- **Also:** BRIEF-20261003-4

### D-056 Spoken languages at v1.0: seven, with correct script and punctuation each
- **Source:** `docs/DECISIONS.md` D-056 (Decided, founder, 2026-10-03)
- **Decided:** English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese; correct script and punctuation per language; phonetics for taught names; UI in English, ready for localisation. The store description names all seven; a language that slips is removed before submission.
- **Why:** not recorded in the source beyond the founder brief (decision 6)
- **Door:** one-way after launch: once families keep letters in a language, withdrawing it leaves their letters without support
- **Reversal cost:** medium: before launch, drop a language from the listing; after, keep supporting it
- **Revisit when:** customer: a language fails its golden-corpus gate before submission; market: demand for another language
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/core/src/lang/languages.ts`, `packs/text-rules/zh.json`, `packages/content/src/store.en.ts`
- **Also:** BRIEF-20261003-6

### D-058 Audio: the original recording is never altered; a separate listening copy
- **Source:** `docs/DECISIONS.md` D-058 (Decided, founder, 2026-10-03)
- **Decided:** the original recording is never altered; Apple voice processing at record time and/or open-source noise suppression make a separate listening copy; the original is always playable.
- **Why:** not recorded in the source beyond the founder brief (decision 8)
- **Door:** one-way after launch: a promise about every family's recordings
- **Reversal cost:** high: an altered original cannot be restored
- **Revisit when:** none expected: follows the constitution
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/audio-enhance/index.ts`, `apps/mobile/src/lib/player/listening.ts` (ADR 0015 rejects record-time voice processing because it alters the original)
- **Also:** BRIEF-20261003-8

### D-065 Lean app: download under 40 MB; speech models and language packs on demand
- **Source:** `docs/DECISIONS.md` D-065 (Decided, founder, 2026-10-03)
- **Decided:** download under 40 MB, measured every release; the English pack and font subsets ship; speech models and other language packs download on demand as signed data (guideline 2.5.2); packs deletable in Settings.
- **Why:** not recorded in the source beyond the founder brief (decision 15)
- **Door:** two-way: a budget and a delivery mechanism
- **Reversal cost:** low
- **Revisit when:** platform: Apple-hosted asset packs become usable (minimum iOS 26)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `scripts/size/measure.ts`, `docs/ops/APP_SIZE.md`, `apps/mobile/src/app/settings/storage.tsx`
- **Also:** BRIEF-20261003-15

### D-066 Server-driven content inside native screens
- **Source:** `docs/DECISIONS.md` D-066 (Recommended, the founder may override, proceed: yes, 2026-10-03)
- **Decided:** prompts, tips, story cards, announcements, remote config, flags and pack manifests as signed, schema-validated blocks with an offline last-good copy; never anything that changes data collection or the paywall.
- **Why:** not recorded in the source beyond the founder brief (decision 16: native screens for quality, accessibility, offline capture and App Review 2.3.1)
- **Door:** two-way: content can be withdrawn and the packaged fallback stays
- **Reversal cost:** low
- **Revisit when:** platform: App Review objects to a server-delivered block
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/api/src/content.ts`, `packages/content/src/stories.en.ts`, `apps/mobile/src/components/content-blocks`
- **Also:** BRIEF-20261003-16
