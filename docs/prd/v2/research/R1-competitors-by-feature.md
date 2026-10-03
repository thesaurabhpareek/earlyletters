# R1 Competitors by feature (F01 to F21)

Prepared 3 Oct 2026 for PRD V2. Extends `docs/research/COMPETITIVE_RESEARCH.md` (CR, 1 Oct 2026). It does not repeat CR.

**How to read this file.** Labels follow `docs/prd/v2/_AUTHORING.md` section 6. **[F]** is a fact from a page I opened today. **[S]** is a signal from reviews or forum posts. **[R]** is my recommendation. **Inferred** is my reasoning. **Unverified** means I could not open or confirm it today. Every R1-S id below was opened on 3 Oct 2026 with WebSearch or WebFetch. Where I rely on CR and could not re-open the page, I write "CR S#, not re-checked today".

**Method caveats.**
- App Store pages were read through a fetch tool that returns a summary of the page, not raw HTML. Ratings, prices, privacy labels and version notes were read from that summary.
- App Store "Languages" lists are not reliable in this pass. Several summaries returned the same ten languages (Spanish, Arabic, Russian, Chinese, French, Korean, Portuguese, Vietnamese, Traditional Chinese), which matches the language picker of the App Store web page itself. I treat those lists as **Unverified** unless the list was specific to the app (for example Day One, Rosebud, Calm, FamilyAlbum, The Days We Keep).
- App Store privacy labels are what the developer declares. They are not audited.
- Ratings marked "insufficient" mean the US page did not show an average.

## 0. Bottom line

1. **Two new direct entrants, not in CR.** Tiny Treasures: Voice Capsule ("Baby memory book you can hear", $4.99/mo, $29.99/yr, $99 lifetime, a family phone line for grandparents) and From, Mama (letters to children, "Village" family contributors, dictation with name correction, $5.99/$49.99, 4.9 from 48 ratings) [F] R1-S67, R1-S20. The phrase "voice memory book" is already in two App Store subtitles (Tiny Treasures, FirstChapter) [F] R1-S67, R1-S4.
2. **Faithful words are still unclaimed.** Remento's "cleaned transcript" removes ums and ahs, but it is one of three modes beside first and third person "story" rewrites, and changing perspective overwrites earlier edits [F] R1-S63. No product I opened shows the user what the machine changed (Inferred from pages opened).
3. **Hindi and Arabic fall outside Apple's own speech stack.** Apple Intelligence features exclude Hindi and Arabic in iOS 27 [F] R1-S26. A developer article lists ten SpeechAnalyzer launch languages without Hindi or Arabic [F] R1-S28, and Apple's forum shows Arabic listed but its assets failing to download, with an Apple engineer advising developers to leave Arabic out until a later beta [S] R1-S27. Two of our seven languages need non-Apple models (B4, B13).
4. **No competitor asks which languages a family speaks.** Day One takes the transcription language from the active keyboard, and users have asked for a separate setting [F] R1-S60, [S] R1-S61. Per-author language choice at first run stays open ground.
5. **Losing a recording is the most repeated capture complaint.** Entries lost on app switch (Qeepsake) [S] R1-S56, voice-to-text data loss (Rosebud) [S] R1-S33, upload failures (StoryCorps, older versions) [S] R1-S31, and FirstChapter's September release added retry, background upload and a confirm-before-discard prompt [F] R1-S4.
6. **Lapse behaviour is better than CR implied.** Qeepsake keeps past entries readable on its free Lite tier after cancel [F] R1-S44, and Day One keeps audio playable on every tier after a subscription ends [F] R1-S60. Tinybeans hides content above the free 5 GB [F] R1-S46. "Free forever to read, play and export" is still stronger than all three, but it is not unique on reading alone.
7. **Price sits at the floor of the category.** $29.99/yr equals Tiny Treasures and undercuts FirstChapter ($39.99), Dearest ($49.99) and From, Mama ($49.99) [F] R1-S67, R1-S4, R1-S3, R1-S20. Dearest now sends in-app renewal reminders with cancellation deadlines [F] R1-S3, a pattern that bears on the California auto-renewal question in B2.
8. **Day One Shared Journals is the best co-parent precedent.** Up to 30 members, invitees join free, editing defaults to author-only, the owner controls membership, end-to-end encrypted per journal [F] R1-S24. Day One also says its in-app purchases cannot be shared through Family Sharing [F] R1-S25, so our Family Sharing plan is a real difference.
9. **Most category leaders declare tracking on their privacy labels.** Qeepsake, Tinybeans, BabyPage, 23snaps, FamilyAlbum, From, Mama, StoryCorps, Chatbooks, Day One and Calm all list "Data Used to Track You" [F] (section F18). Dearest lists only "Data Not Linked to You" [F] R1-S3. A clean label is visible proof of B9.
10. **The strongest published habit pattern is Calm's.** A reminder prompt shown right after the first session: 40% set a reminder and those users retained 3x better [F] R1-S57. Headspace's onboarding quiz doubled course starts but did not raise meditation days [F] R1-S58.

## 1. What changed since CR (1 Oct 2026)

| # | Item | CR said | Today | Source |
|---|---|---|---|---|
| 1 | Tiny Treasures: Voice Capsule | Not covered | New direct competitor: voice for the child, age tags, sealed messages, family phone line, CarPlay, no transcription, $4.99/mo, $29.99/yr, $99 lifetime, 5.0 (7), v1.0.10 two days ago | [F] R1-S67 |
| 2 | From, Mama | Not covered | Letters to children with dictation and "automatic name correction", Village contributors, 4.9 (48), $5.99/$49.99, first released 11 Apr 2026 (third-party listing) | [F] R1-S20, R1-S17 |
| 3 | FirstChapter price | $9.99 / $49.99, 5.0 (5), from the Canada store | US store: $6.99 / $39.99, no US average shown, v1.0.6 (17 Sep) | [F] R1-S4. CR's figures were likely Canadian dollars (Inferred) |
| 4 | Sproutbook | 4.7 (13), $6.99 / $59, 30-day trial | US: 5.0 (3), $6.99 / $59.99. Its site says a 14-day trial. Trial length now conflicts | [F] R1-S8, R1-S38 |
| 5 | Qeepsake | Essential and Premium; paywall on past memories | Pricing page unchanged. App Store IAP list adds a "Qeepsake Plus" item at $35.99 to $47.99 (meaning Unverified). After cancel, users drop to Qeepsake Lite and keep reading past entries. Trustpilot 3.0 from 120 reviews. Help centre says plans, pricing and SMS prompts stay the same after the Tinybeans deal, with integration "over time" | [F] R1-S16, R1-S1, R1-S44, R1-S55, R1-S41 |
| 6 | Tinybeans | $7.99 / $74.99 | Also lists a Legacy tier ($4.49 / $39.99) and "Family Album Premium" $7.99/mo. Age rating 9+. Privacy label declares tracking on five data types | [F] R1-S2 |
| 7 | Dearest | Book "coming soon" | App Store now says users can create printable memory books; the website still says "coming soon" (conflict). v1.4.2 (20 Aug) added voice import from voicemails and files, renewal reminders with cancellation deadlines | [F] R1-S3, R1-S37 |
| 8 | Day One | Google sign-in added in 2026.20 | Confirmed in the listing ("4 days ago"). Privacy label lists purchases, email and identifiers under "Data Used to Track You" | [F] R1-S6 |
| 9 | Apple speech languages | SpeechAnalyzer Hindi support Unverified | iOS 27 page: Dictation covers Hindi and Arabic; Apple Intelligence covers neither. SpeechAnalyzer launch list (third party) has no Hindi or Arabic. Arabic assets failed in a beta (forum). Apple's class page gives no language list, only `supportedLocales`; custom vocabulary may need `DictationTranscriber` (forum) | [F] R1-S26, R1-S28, R1-S73; [S] R1-S27, R1-S74 |
| 10 | Remento | Web link only; no app | An iPhone app exists for in-person interviews, but its recordings do not reach the online account or the book. Trustpilot 4.8 (1,738) | [F] R1-S29, R1-S15 |
| 11 | Storyworth | Trustpilot 4.7 (65,073) | 4.7 (65,094); 3,850 reviews in the last 12 months | [F] R1-S54 |
| 12 | Notabli | Active, tiny team | Last update 16 Oct 2024, almost two years old | [F] R1-S7 |
| 13 | Huckleberry | Plus and Premium | New onboarding for parents of infants, AI advice for early-born babies (v0.9.309, two days ago) | [F] R1-S11 |
| 14 | Other new entrants | Not covered | Chapter One (Jul 2026, local plus iCloud), Life Lessons (Apr 2026, AI answers from recorded lessons), The Days We Keep (EN, ES, PT-BR), Then (voice time capsule, 7 languages, no account), Nostalgia (pay-per-minute voice credits) | Section 3 |
| 15 | Not re-checked today | Artifact shutdown, Lifecake closure, CocoBaby, Chatbooks prices | Rely on CR S5, S19, S34, S28 | Unverified today |

## 2. Feature areas

Column guide for every table: **Product | What it does | Does it work? (evidence) | What customers say | Our call**. "Our call" is Match, Innovate or Avoid, always [R].

### F01 Entry, 18+ gate and welcome

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Tinybeans | 2020 redesign: a swipeable value carousel before any personal data, child info optional, notification permission primed with context, separate flows for owner and followers [F] R1-S51 | +885% onboarding completion in a Fall 2020 A/B test [F] R1-S51 | 2022 iteration added privacy assurances and social proof, keeping only steps "worth the extra effort" [F] R1-S51 | **Match** [R]: show value and privacy before asking for anything |
| Qeepsake | Plan chosen at sign-up; 7-day trial with card on file [F] R1-S45 | 4.9 (15K) [F] R1-S1 | Reviews cite the move from free to paid-only and aggressive marketing texts postpartum [S] R1-S1 | **Avoid** [R]: card before value |
| Huckleberry | "Updated onboarding experience for users with infants" in the newest release [F] R1-S11 | 4.9 (74K), #19 Medical [F] R1-S11 | Praised for calming overwhelmed new parents [S] R1-S11 | **Match** [R]: branch first run by baby stage (expecting or born) |
| Headspace (quality bar) | Tested five onboarding variants: personalisation quiz, precommitment, default course [F] R1-S58 | Quiz doubled course starts from 31% to 63%; no significant rise in active meditation days [F] R1-S58 | n/a | **Match with care** [R]: one or two questions that change what the person sees, no long quiz |
| Sproutbook | Recent release fixed keyboard position in onboarding and changed onboarding copy [F] R1-S8 | 5.0 (3) [F] R1-S8 | n/a | Neutral |
| Age gates | Every baby or letters app I opened is rated 4+ (Qeepsake, Dearest, FirstChapter, From, Mama, Tiny Treasures) or 9+ (Tinybeans) [F] R1-S1, R1-S3, R1-S4, R1-S20, R1-S67, R1-S2. None describes an in-app 18+ gate. StoryCorps' listing mentions age assurance features [F] R1-S31 | n/a | n/a | **Innovate quietly** [R]: our 18+ gate is unusual in the category; keep it to one calm screen |
| Apple age ratings | Apple announced new 13+, 16+ and 18+ App Store tiers and a Declared Age Range API that gives developers a child's age range, not a birth date, with parents choosing always, per request or never; shipped fall 2025 with iOS 26 [F] R1-S71 | n/a | n/a | **Match** [R]: the F01 writer decides whether the 18+ gate reads Declared Age Range or stays a self-declared question; how the 18+ tier affects listing is Unverified (not in R1-S71) |

**Opportunity.** Tinybeans has the only published onboarding result in the category, and it says: value first, data later, child details optional [F] R1-S51. Headspace shows that onboarding questions raise first use, not habit [F] R1-S58. No competitor runs an 18+ gate, so ours should feel like a single welcome question, not a wall [R].

### F02 Account and sign-in

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Day One | Email and password, Apple, Google; Google arrived on iOS in 2026.20. An account is required to sync [F] R1-S6, R1-S52 | 4.8 (118K) [F] R1-S6 | Long-term users call it stable now after buggy early years [S] R1-S6 | **Match** methods [R]; we drop passwords (B3) |
| Airbnb (quality bar) | Sign up with email, phone number, Google or Apple [F] R1-S59 | n/a | n/a | **Match** [R]: four options, one screen. Browse-before-account detail Unverified |
| Remento | The storyteller records through a texted or emailed link: no app, download or login [F] R1-S53 | Trustpilot 4.8 (1,738); older users manage it [F][S] R1-S15 | Collaborators sometimes struggle more than the main user [S] R1-S15 | **Match for v1.1** [R]: contributor links (F30) |
| Qeepsake | Contributors are invited by email and told not to make an account first; they are not charged [F] R1-S40 | n/a | n/a | **Match** [R]: invite creates the account |
| Dearest | No account; on-device storage with optional iCloud backup; label shows only data not linked to the user [F] R1-S3 | 5.0 (1) [F] R1-S3 | Too few reviews | **Match** the local-first start [R] |
| Then, Chapter One | "On-device, no account, no servers" (Then); local storage plus encrypted iCloud (Chapter One) [F] R1-S68, R1-S34 | Too new to judge | n/a | Confirms a no-account trend among indie privacy apps (Inferred) |
| FirstChapter | v1.0.6 fixed Hide My Email compatibility and offline sign-in persistence [F] R1-S4 | n/a | n/a | **Match** [R]: test Apple relay emails and offline session restore from day one |
| Apple rules | 4.8: an app with third-party login must also offer an equivalent login limited to name and email, with private email allowed. 5.1.1(v): apps without significant account features must work without login; apps with accounts must offer in-app deletion [F] R1-S49 | n/a | n/a | Sign in with Apple satisfies 4.8 (Inferred). "Keep the book" local-first matches 5.1.1(v) |

**Opportunity.** Our local-first start plus Apple, Google and email matches the most privacy-led indies (Dearest, Then) while still allowing a co-parent to join [R]. Test Hide My Email addresses and offline restore, since FirstChapter had to ship fixes for both [F] R1-S4.

### F03 First run: child, signature, languages, names

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Journal name up to 14 characters; the name appears inside prompts; questions adjust to the journal's age, from pregnancy to school years [F] R1-S43, R1-S42, R1-S1 | 4.9 (15K) [F] R1-S1 | Age-inappropriate prompts for children outside the target range [S] R1-S56 | **Match** age-aware prompts; **Avoid** a 14-character name cap [R] |
| Qeepsake twins | Choose one journal per child or one shared journal ("The Twins") [F] R1-S43 | n/a | n/a | **Match** [R]: decide twin handling in F03/F12 |
| Tinybeans | Child details optional at sign-up [F] R1-S51 | +885% completion [F] R1-S51 | n/a | **Match** [R] |
| BabyPage | Pregnancy milestones and stages at set intervals [F] R1-S9 | 4.8 (4.1K) [F] R1-S9 | n/a | **Match** pregnancy mode (P3) [R] |
| Huckleberry | Advice tailored for early-born babies [F] R1-S11 | n/a | n/a | **Innovate** [R]: decide whether month chapters use birth date or due date for a premature baby (Inferred need) |
| Languages | No listing or help page I opened asks which languages a family speaks. Day One picks transcription language from the active keyboard [F] R1-S60 | n/a | Users asked Day One for a transcription language separate from the keyboard [S] R1-S61 | **Innovate** [R]: ask each author's languages at first run |
| Names | From, Mama advertises dictation with automatic name correction [F] R1-S20; how it works is Unverified | 4.9 (48) [F] R1-S20 | n/a | **Innovate** [R]: teach names at first run (F07) |

**Opportunity.** Nobody asks about languages at first run, and only From, Mama mentions names [F] R1-S20. Keep child details few and optional (Tinybeans), but ask for the two things that make transcription right: languages and names [R].

### F04 Capture: speak or type

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| FirstChapter | 30-second voice narratives; v1.0.6 added background upload on weak connections, retry, and confirmation before discarding a recording [F] R1-S4 | No US average yet [F] R1-S4 | n/a | **Match** confirm-before-discard and retry [R] |
| Sproutbook | 30-second daily entries by voice or text [F] R1-S8, R1-S38 | 5.0 (3) [F] R1-S8 | n/a | Neutral |
| Day One | Audio up to 3 hours; transcription limited to 10 minutes; up to 30 recordings per entry; Siri Shortcuts, reminders [F] R1-S60, R1-S6 | 4.8 (118K) [F] R1-S6 | n/a | **Match** long recordings; plan transcription in chunks [R] |
| Remento | Recordings up to 30 minutes [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | n/a | Benchmark for long letters |
| StoryCorps | Interviews stop automatically at 45 minutes [F] R1-S30 | 4.6 (1.6K) [F] R1-S31 | Earlier versions lost uploads [S] R1-S31 | **Avoid** silent hard stops [R]: warn before any cap |
| Then | 60-second limit [F] R1-S68 | Too new | n/a | **Avoid** short caps for letters [R] |
| Huckleberry | Lock-screen Live Activities, voice logging, Siri, widgets [F] R1-S11 | 4.9 (74K) [F] R1-S11 | Easy hand-offs between caregivers [S] R1-S11 | **Match** a Live Activity while recording and a widget [R] |
| Dearest | Home Screen widgets; import voice from voicemails and files with original dates [F] R1-S3 | 5.0 (1) | n/a | **Match later** [R]: import of old recordings is a v1.1 candidate |
| Tiny Treasures | Family phone line: relatives call or text, voicemails land in the capsule; CarPlay recording [F] R1-S67 | 5.0 (7) [F] R1-S67 | Reviewers love keeping relatives' voicemails [S] R1-S67 | **Innovate later** [R]: phone-line capture for P5 in v1.1 |
| Apple Voice Memos | Built-in recorder with transcription and one-tap Enhance [F] R1-S64 | 4.8 (1.1M) [F] R1-S64 | Some reviewers say recording stops when the screen locks [S] R1-S64 | **Innovate** [R]: keep recording on lock and say so |
| Qeepsake | Answers by SMS or app [F] R1-S1 | 4.9 (15K) | Entries disappear when switching apps unsaved [S] R1-S56 | **Avoid** [R]: autosave drafts continuously |
| Rosebud | Text and voice entries [F] R1-S33 | 4.9 (3.3K) [F] R1-S33 | Voice-to-text unreliable, occasional data loss in processing [S] R1-S33 | **Avoid** [R]: save audio before any processing |
| From, Mama | Typing or hands-free dictation; audio and selfie video notes [F] R1-S20 | 4.9 (48) | n/a | Video is out of scope for v1.0 (Inferred from feature map) |

**Opportunity.** Every voice product I checked has a loss story. The spec should treat "never lose a word" as the capture requirement: audio written to disk as it records, recording continues on lock and through interruptions where iOS allows, drafts autosave, and nothing is discarded without a confirm [R]. Pick a generous length cap with a visible warning before it; the category ranges from 60 seconds to 3 hours [F] R1-S68, R1-S60.

### F05 On-device transcription and language packs

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Remento | Speech-to-Story supports English and Spanish [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | Name errors reported in CR (CR S27, not re-checked today) | Our 7 languages beat it [R] |
| Rosebud | Voice transcription in 20 languages; app localised in 17 including Hindi [F] R1-S33 | 4.9 (3.3K) | Voice-to-text unreliable at times [S] R1-S33 | Engine and on-device status Unverified |
| Day One | Uses the keyboard language, then device language; on iOS 26 with Apple Intelligence transcription is on-device, older systems use Apple servers [F] R1-S60 | n/a | Dutch and English in one session produced "broken Dutch"; users asked for a per-recording language setting (2024) [S] R1-S61 | **Avoid** keyboard-driven language [R] |
| Apple Voice Memos | Transcribes recordings; "isn't available in all countries or regions" [F] R1-S65 | 4.8 (1.1M) | n/a | Benchmark for English quality only |
| Apple platform (iOS 27) | Dictation covers Arabic, Hindi, Mandarin, French, Portuguese, Spanish and more. Apple Intelligence covers neither Hindi nor Arabic. Live Captions excludes Hindi, Arabic and Portuguese [F] R1-S26 | n/a | n/a | Do not assume Apple features exist for Hindi or Arabic [R] |
| SpeechAnalyzer | On-device; the model lives in system storage and does not add to app size; apps query `supportedLocales` and `installedLocales`; built for long-form audio; powers Notes, Voice Memos, Journal [F] R1-S70. `SpeechTranscriber` needs iOS 26 or later; apps should check `isAvailable` or `supportedLocales` and fall back to `DictationTranscriber` (closer to system dictation, works on older devices) [F] R1-S73 | One developer test found it about 3x faster than Whisper Small with top-3 English accuracy [F] R1-S28 | Arabic listed but assets failed to download; Apple engineer advised excluding Arabic until fixed [S] R1-S27 | **Match** for languages it supports [R]; launch list per R1-S28 excludes Hindi and Arabic |
| Tiny Treasures | No transcription and no voice analysis, stated as a privacy feature [F] R1-S67 | 5.0 (7) | n/a | Shows "no transcription" can be a selling point; we transcribe on-device instead (Inferred) |
| Then | 7 languages, on-device [F] R1-S68 | Too new | n/a | Neutral |
| Code-switching | Only evidence found is Day One's mixed-language failure [S] R1-S61 | n/a | n/a | Supports moving Hindi-English mode to v1.1 (B4) with a clear one-language-per-letter rule at v1.0 [R] |

**Opportunity.** No memory product I found transcribes Hindi or Arabic on-device. Apple's stack does not cover them for Apple Intelligence [F] R1-S26 and the evidence for SpeechAnalyzer is weak or negative [F] R1-S28, [S] R1-S27, so the F05 spec should plan open models for Hindi and Arabic from the start and treat SpeechAnalyzer as an option per language after a spike [R]. Choose language per author and per letter, never from the keyboard [R].

### F06 Faithful edit and review

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Remento | Three styles: cleaned transcript (removes ums and ahs), first-person story, third-person story with a length slider. Changing perspective overwrites earlier edits. The original recording stays unchanged [F] R1-S63 | 4.8 (1,738) [F] R1-S15 | Users ask for richer editing and formatting [S] R1-S15. CR reported long oral histories "edited down" (CR S42, not re-checked today) | **Match** the cleaned transcript; **Avoid** story modes and overwrite on regenerate [R] |
| FirstChapter | AI turns 30-second voice notes into polished entries [F] R1-S4 | No US average | n/a | **Avoid** [R] |
| Sproutbook | AI turns notes into weekly and monthly recaps; site says originals are kept [F] R1-S38 | 5.0 (3) | n/a | **Avoid** recaps that speak for the parent [R] |
| Dujour Baby | "Let AI polish messy notes into beautiful memories" [F] R1-S22 | Site cites 4.8 (unverified source) | n/a | **Avoid** [R] |
| Day One Gold | AI summaries, title suggestions, image generation, Daily Chat [F] R1-S23 | Gold tier added Mar 2026 (CR S15) | n/a | **Avoid** [R] |
| Apple Voice Memos (Mac) | Writing Tools can summarise, proofread and change the tone of transcripts [F] R1-S65 | n/a | n/a | **Avoid** tone changes [R] |
| From, Mama | Third-party listing says it keeps an archive rather than generating AI content [F] R1-S17 | 4.9 (48) | n/a | Ally on principle |
| Life Lessons | AI answers questions using a parent's recorded lessons [F] R1-S19 | 5 (2) | n/a | **Avoid** [R]: it speaks for the parent |
| Visible diff | None of the products above shows a list of what the machine changed (Inferred from pages opened) | n/a | n/a | **Innovate** [R]: show every change and let the author undo it |

**Opportunity.** The market moved further toward rewriting since CR (Day One Gold, Apple Writing Tools, FirstChapter). Remento's cleaned transcript proves people want filler removed, but nobody makes it the only mode or shows the edits [F] R1-S63. Our edit view should list each change, one tap to undo, and never offer a "make it nicer" button [R].

### F07 Names and words dictionary

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| From, Mama | Dictation with automatic name correction [F] R1-S20 | 4.9 (48) | n/a | Closest rival claim; mechanism Unverified |
| Remento | No name or vocabulary feature on the FAQ or how-it-works pages [F] R1-S13, R1-S53 | n/a | Proper nouns dropped (CR S27, not re-checked today) | Gap to fill [R] |
| Day One | No vocabulary feature on the audio guide [F] R1-S60 | n/a | n/a | Gap |
| Apple Speech framework | The framework docs group `AnalysisContext`, `SFSpeechLanguageModel` and `SFCustomLanguageModelData` under "Custom vocabulary" [F] R1-S72. A developer forum thread reports that contextual strings work with `DictationTranscriber` but not with `SpeechTranscriber` [S] R1-S74. Not in the WWDC25 session [F] R1-S70 | Not confirmed by an Apple engineer in the thread read | n/a | Spike needed in F05/F07 [R] |

**Opportunity.** Only one app claims name handling, and the biggest voice product has a documented name problem in CR. A names list captured at first run and editable later is an **Innovate** [R]. On Apple's stack, name hints may force a choice between `SpeechTranscriber` (better long-form model) and `DictationTranscriber` (accepts contextual strings, per one forum report) [S] R1-S74. That makes our own post-transcription name correction from the dictionary (constitution-safe spelling fix) likely necessary whatever engine is chosen (Inferred). The F07 writer must confirm on a device.

### F08 Recordings: original, listening copy, playback, durability

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Remento | Recordings kept and downloadable at any time; each printed story has a QR code that plays the original [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | Hearing voices is the emotional core (CR S6) | **Match** original always available [R] |
| Day One | Playback on every tier, including after a subscription expires; audio can be shared out; recording needs Silver or Gold [F] R1-S60 | 4.8 (118K) | n/a | **Match** playback free forever [R] |
| Apple Voice Memos | One-tap Enhance Recording reduces background noise and echo [F] R1-S64 | 4.8 (1.1M) | n/a | **Match** with a twist [R]: make the clean version a separate listening copy, never replacing the original (B6) |
| Dearest | Voice memories, import with original dates, full vault export as ZIP [F] R1-S3 | 5.0 (1) | n/a | **Match** ZIP export with audio [R] |
| Tiny Treasures | Exports audio files for offline keeping, no account needed [F] R1-S67 | 5.0 (7) | n/a | **Match** [R] |
| Tell Me Your Story | Hardcover book with QR codes linking to audio [F] R1-S21 | No ratings | n/a | QR in book is v1.1 print (F30) [R] |
| Storyworth | Phone transcription and voice-recorded Family Calls on $99 and up [F] R1-S14 | Trustpilot 4.7 (65,094) [F] R1-S54 | n/a | Whether audio is kept for playback: Unverified |
| FirstChapter | Privacy label lists audio recordings as data linked to the user, so audio leaves the phone [F] R1-S4 | n/a | n/a | Contrast: v1.0 audio stays on the author's phone (B7) |
| Qeepsake | No voice in listing or pricing [F] R1-S1, R1-S16 | n/a | n/a | Voice is our gap to own (CR confirmed) |

**Opportunity.** Keeping and playing the original is table stakes among voice products (Remento, Day One) [F] R1-S13, R1-S60. The open move is a clean listening copy beside an untouched original [R]. Durability is our weak point: with no audio upload in v1.0 (B7), Day One, Voice Memos and the iCloud apps all back up audio and we do not. The F08 and F16 writers must state the risk plainly (D-033).

### F09 The book: month chapters, Before You, cards

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Entries flow into a journal; books are laid out by algorithm [F] R1-S1, R1-S56 | 4.9 (15K) | Layouts cannot be adjusted; one-line answers waste whole pages; repeated questions [S] R1-S56 | **Avoid** fixed layouts [R] |
| Tinybeans | Automatic date-based organisation [F] R1-S2 | 4.9 (104K) | Backdating via the camera roll is slow; people want selective visibility per relative [S] R1-S2 | **Match** auto-filing; make backdating easy [R] |
| 23snaps | Galleries and timeline [F] R1-S10 | 4.8 (11K) | Backdated entries sort wrongly [S] R1-S10 | **Avoid** [R]: file by the date the memory is about, not the date written |
| BabyPage | Template pages for stages at set intervals; multiple children [F] R1-S9 | 4.8 (4.1K) | Crashes; checkout surcharges [S] R1-S9 | Neutral |
| Tiny Treasures | Messages can be age-tagged [F] R1-S67 | 5.0 (7) | n/a | Closest to month-of-age; **Innovate** with true chapters [R] |
| From, Mama | Chronological timeline by child and date [F] R1-S20 | 4.9 (48) | n/a | Neutral |
| Apple Journal | Calendar and map views; streaks and statistics [F] R1-S5 | 4.8 (327K) | Users want better backdating [S] R1-S5 | **Avoid** streaks [R] |
| Tell Me Your Story | Achievements and streaks [F] R1-S21 | No ratings | n/a | **Avoid** [R] |
| Gaps | No product I opened shows empty months; several count streaks (Apple Journal, Calm, Tell Me Your Story) [F] R1-S5, R1-S48, R1-S21 | n/a | n/a | **Innovate** [R]: chapters exist for every month, quiet when empty, never counted |

**Opportunity.** Month-of-age chapters are still unclaimed in the pages I opened; only Tiny Treasures tags age [F] R1-S67. Backdating complaints at Tinybeans, 23snaps and Apple Journal mean a letter written today about month 3 must land in month 3 [S] R1-S2, R1-S10, R1-S5. Avoid every streak pattern [R].

### F10 Read together

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Babble | "Soundbook": photos with recorded voice; Baby Mode with large touch cards; Story Mode plays in order [F] R1-S18 | 5.0 (1); last update Mar 2024 [F] R1-S18 | n/a | Closest UI precedent; **Innovate** beyond it [R] |
| Tiny Treasures | "Baby memory book you can hear"; sealed messages the child opens later [F] R1-S67 | 5.0 (7) | Reviewers value giggles and changing speech [S] R1-S67 | Closest positioning threat [R] |
| Remento | QR codes in the book play the original voice [F] R1-S13 | 4.8 | n/a | Different moment (adult reader) |
| Calm (quality bar) | Narrated Sleep Stories for bedtime [F] R1-S48 | 4.8 (2M) [F] R1-S48 | n/a | **Match** bedtime cues: dim screen, simple controls (Inferred) |
| Session products | No product I opened plays a sequence of a parent's letters to a child as a session | n/a | n/a | **Innovate** [R] |

**Opportunity.** Read together has no direct rival. Babble shows the big-card and sequential-play patterns [F] R1-S18; Tiny Treasures shows that "hear the book" is a pitch someone else now uses [F] R1-S67. Define the session clearly in F10 because Plus counts sessions (B7 redefines PRD-REQ-020) [R].

### F11 Co-parent sharing

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Day One Shared Journals | Up to 30 people including the owner; invitees view, comment and add for free; Premium needed to create; editing defaults to "Author Only", owner can switch to "Anyone"; owner adds and removes members; per-journal encryption key [F] R1-S24 | 4.8 (118K) | n/a | **Match** author-only editing and owner controls [R] |
| Qeepsake | Family Contributors are Premium only; contributors are not charged; they get questions, submit text, can skip; their names show next to entries and in books [F] R1-S40 | 4.9 (15K) | Limited admin features for co-parents [S] R1-S1 | **Avoid** paywalled co-parent [R] |
| Tinybeans | Follower levels: basic view, view or add measurements, add moments, Full Access co-owner (cannot delete the journal) [F] R1-S47; Premium lists "secondary account access" [F] R1-S2 | 4.9 (104K) | People want per-relative visibility [S] R1-S2 | **Match** "co-owner cannot delete the book" [R] |
| FamilyAlbum | Only Album Admins can invite; invites by email, SMS, QR code [F] R1-S62 | 4.9 (375K) [F] R1-S12 | Praised for easy family sharing [S] R1-S12 | **Match** QR invite for the second parent in the room [R] |
| Notabli | Invite links with approval controls [F] R1-S7 | 4.7 (70) | No spam [S] R1-S7 | **Match** approval [R] |
| From, Mama | Village: partners and grandparents add their own letters [F] R1-S20 | 4.9 (48) | n/a | Tier Unverified |
| FirstChapter | Family sharing in Premium [F] R1-S4 | n/a | n/a | **Avoid** [R] |
| 23snaps | No family plan; each user subscribes separately [F] R1-S10 | 4.8 (11K) | Free tier "deliberately painful" [S] R1-S10 | **Avoid** [R] |
| Huckleberry | Several caregivers share one account [F] R1-S11 | 4.9 (74K) | Easy caregiver hand-offs [S] R1-S11 | Neutral |
| Family Sharing | Day One: in-app purchases cannot be shared in Family Share [F] R1-S25 | n/a | n/a | Our Family Sharing plan (B2) is a real difference [R] |

**Opportunity.** A free co-parent is unusual: Qeepsake, FirstChapter and 23snaps all charge for family [F] R1-S40, R1-S4, R1-S10. Copy Day One's author-only editing default and Tinybeans' "co-owner cannot delete" rule [R]. Note the B2 limit: Apple Family Sharing covers the co-parent only inside one Apple Family group.

### F12 Multiple children

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Essential: up to 2 journals. Premium: no limit. No extra cost per journal [F] R1-S42, R1-S16 | 4.9 (15K) | Families with several children like it [S] R1-S1 | Note the contrast below [R] |
| Qeepsake twins | Separate journals or one shared journal [F] R1-S43 | n/a | n/a | **Match** an answer for twins [R] |
| FamilyAlbum | Multiple child profiles [F] R1-S12 | 4.9 (375K) | n/a | Neutral |
| BabyPage | Multiple children's profiles [F] R1-S9 | 4.8 (4.1K) | n/a | Neutral |
| From, Mama | Timeline by child [F] R1-S20 | 4.9 (48) | n/a | Neutral |

**Opportunity.** Our Plus gate starts at the second child's book. Qeepsake's cheapest paid tier already includes two journals [F] R1-S42. This is a founder decision, so flag it rather than change it: the F12 writer should state that a two-child family pays sooner with us than on Qeepsake Essential, and decide whether twins count as one book or two [R].

### F13 Prompts, reminders and notifications

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | 2 questions a day (Essential) or 4 (Premium); 1 a week on free Lite [F] R1-S16, R1-S44 | 4.9 (15K) | Repeated questions within short spans; marketing texts during postpartum [S] R1-S56, R1-S1 | **Avoid** daily volume and mixed marketing [R] |
| Remento | Weekly prompt by text or email, cadence adjustable [F] R1-S53 | 4.8 (1,738) | Too many reminder emails and texts after sign-up [S] R1-S15 | **Avoid** sign-up email bursts [R] |
| Storyworth | Weekly emailed question [F] R1-S14 | 4.7 (65,094) | Prompts help reluctant, busy authors fill gaps [S] R1-S54 | **Match** weekly default [R] |
| Calm (quality bar) | Reminder prompt shown after the first session [F] R1-S57 | 40% of those shown set a reminder; 3x retention; judged causal [F] R1-S57 | n/a | **Match** [R]: ask for a reminder right after the first saved letter |
| Headspace (quality bar) | Precommitment: user picks days and triggers [F] R1-S58 | +7.5% app opens; no gain in active days [F] R1-S58 | n/a | **Match lightly** [R]: let the parent pick evenings |
| Dearest | Home Screen widgets as reminders [F] R1-S3 | n/a | n/a | **Match** [R] |
| From, Mama | "Inspire Me" prompts; daily Reflect content [F] R1-S20 | 4.9 (48) | n/a | Neutral |
| Notabli | Email notifications | 4.7 (70) | No spam [S] R1-S7 | Supports calm cadence |
| Apple rule | 4.5.4: marketing pushes need explicit opt-in and an in-app opt-out; push cannot be required [F] R1-S49 | n/a | n/a | **Match** [R]: separate reminder and marketing permissions |

**Opportunity.** The best evidence in this whole file is Calm's: ask for the reminder at the moment of first success [F] R1-S57. The worst complaints are volume and marketing in the same channel [S] R1-S56, R1-S15. One gentle default (weekly, evening), age-aware prompts, no repeats, never promotions in reminders [R].

### F14 Plus: subscription, paywall, lapse

| Product | Price (US) | Trial | What is gated | After lapse | Source |
|---|---|---|---|---|---|
| **Early Letters Plus** | $3.99/mo, $29.99/yr | 1 month / 2 months | Extra children's books; Read together beyond 3 sessions | Read, play, export stay free | [D] B2 |
| Tiny Treasures | $4.99/mo, $29.99/yr, $99 lifetime | Unverified | "Family access" | Unverified | [F] R1-S67 |
| The Days We Keep | $4.99/$34.99 Essentials; $9.99/$59.99 Unlimited | Unverified | Tiered | Unverified | [F] R1-S35 |
| FirstChapter | $6.99/mo, $39.99/yr | Unverified | 3 AI voice entries a month free; 30 on Premium; family sharing | Unverified | [F] R1-S4 |
| Life Lessons | $4.99/mo, $39.99/yr | Unverified | Premium | Unverified | [F] R1-S19 |
| Qeepsake | $4.99 / $47.88 Essential; $9.99 / $95.88 Premium | 7 days, card required | No free plan; contributors Premium only | Lite: past entries readable, 1 prompt a week, 5 photos a month, no book orders | [F] R1-S16, R1-S45, R1-S44 |
| BabyPage | $7.99/mo, $13.99/3 mo, $44.99/yr | Unverified | Subscription | Unverified | [F] R1-S9 |
| Dearest | $4.99/mo, $49.99/yr | Unverified | Plus (CR: unlimited, sealing, Face ID, books) | Unverified; app sends renewal reminders with cancellation deadlines | [F] R1-S3; CR S10 |
| From, Mama | $5.99/mo, $49.99/yr | Free trial (site) | Premium | Unverified | [F] R1-S20, R1-S39 |
| Notabli | $4.99/$49.99 Plus; $6.99/$69.99 Plus-One | Unverified | Plus | Unverified | [F] R1-S7 |
| Day One | Silver $8.99/mo or $49.99/yr; Gold $74.99/yr | 1 month; App Store controls eligibility | Audio recording, multi-device sync, AI (Gold) | Media stays viewable and playable; no Family Share | [F] R1-S6, R1-S23, R1-S25, R1-S60 |
| Sproutbook | $6.99/mo, $59.99/yr | 14 days (site); CR said 30 | Pro | Unverified | [F] R1-S8, R1-S38 |
| FamilyAlbum | Premium Family $5.99/mo, $59/yr; Pro $10.99/$109; Premium One $2.99 | Unverified | Premium covers the family | Unverified | [F] R1-S12 |
| Tinybeans | $7.99/mo, $74.99/yr; Legacy $4.49/$39.99 | Unverified | Unlimited uploads, video, no ads | Ads return; 20 uploads a month; content over 5 GB archived and hidden | [F] R1-S2, R1-S46 |
| 23snaps | $5.49 Premium; $7.99 Premium Plus; gift months | Unverified | HD, longer video | Unverified | [F] R1-S10 |
| Remento | $99 first year with book; renew $99/yr or $12/mo | 30-day money-back instead | Everything | Unverified | [F] R1-S13 |
| Storyworth | $69 / $99 / $199 (renews $99) | 30-day money-back | Voice on $99+ | n/a | [F] R1-S14 |
| Calm (quality bar) | $14.99/mo, $69.99/yr | Unverified | Most content | n/a | [F] R1-S48 |
| Nostalgia | Voice credits $1.99 to $8.99; plans $29.99 to $99.99 | Unverified | Voice minutes | n/a | [F] R1-S69 |

| Pattern | Evidence | Our call |
|---|---|---|
| Customers resent price and cancel friction | Calm reviews: cost, limited free content, hard to cancel [S] R1-S48. Qeepsake Trustpilot: charges after unsubscribing, fine print on credits [S] R1-S55 | **Avoid** [R]: Apple's manage sheet one tap from Settings (B2) |
| Renewal reminders inside the app | Dearest v1.4.2 [F] R1-S3 | **Match** [R]: an in-app, on-device reminder before trial end and renewal may answer part of B2(a); counsel decides |
| Apple trial disclosure | 3.1.2: state trial length, what ends, and charges before purchase [F] R1-S49 | **Match** [R]: Apple's own subscription view (B2) |
| Apple SubscriptionStoreView | iOS 17 or later; loads names, descriptions and prices from the App Store by group or product IDs; shows terms of service and privacy policy buttons from App Store Connect automatically; shows a Close button by default; extra buttons and an optional sign-in action through modifiers; draws no background by default [F] R1-S50 | **Match** [R]. Whether it prints trial length and post-trial price by default is not stated on the page (Unverified); the F14 writer must check a build against 3.1.2 |
| Lifetime | Only Tiny Treasures ($99) among the apps opened today [F] R1-S67 | Later (F30) [R] |
| Pay per voice minute | Nostalgia voice credits; FirstChapter 3 free AI entries [F] R1-S69, R1-S4 | **Avoid** [R]: never meter speaking |

**Opportunity.** Our price is at the floor and our trials are longer than Qeepsake's 7 days [F] R1-S45. Our lapse promise beats Tinybeans (hidden content) and matches or beats Qeepsake Lite and Day One [F] R1-S46, R1-S44, R1-S60. Copy Dearest's in-app renewal reminder for the B2 notice question [R].

### F15 Export and the PDF book

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Remento | Export text or PDF; download audio any time; ebook $49.99; extra book $69 (to 200 pages) or $99 (201 to 380); $30 surcharge over 200 pages [F] R1-S13 | 4.8 | Some spine wear [S] R1-S15 | **Match** text, PDF and audio export [R] |
| Dearest | Vault export as ZIP; printable books (App Store) vs "coming soon" (site) [F] R1-S3, R1-S37 | 5.0 (1) | n/a | **Match** ZIP [R] |
| Qeepsake | Book credit $19.99 (Essential) or $61.99 (Premium), annual only [F] R1-S16; Lite can preview but not order [F] R1-S44 | 4.9 | Books $94 to $200+; $15 shipping; fixed layouts; extra fees to export personal data [S] R1-S56. Trustpilot: print costs $100 to $300; site crashes at checkout [S] R1-S55 | **Avoid** paid export and hidden costs [R] |
| Storyworth | Hardcover included; free ebook downloads [F] R1-S14 | 4.7 (65,094) | Photo formatting and limited undo frustrate [S] R1-S54 | **Match** free digital copy [R] |
| 23snaps | Photo books | 4.8 (11K) | Text missing in printed books [S] R1-S10 | **Avoid** [R]: PDF preview equals print |
| BabyPage | Printed hardcover | 4.8 (4.1K) | Page surcharges appear only at checkout [S] R1-S9 | **Avoid** [R] |
| Chatbooks | Auto-curated Monthbooks; up to 366 pages; up to 10x10; free standard shipping [F] R1-S32 | 4.8 (249K) | Cropping limits; slow app [S] R1-S32 | Print partner benchmark for v1.1 (Inferred) |
| Day One | 25% (Silver) or 35% (Gold) off printed journals [F] R1-S23 | n/a | Printed books called priceless by a reviewer [S] R1-S6 | Later |
| Apple Journal | Export and print [F] R1-S5 | 4.8 | n/a | **Match** PDF at minimum [R] |
| Notabli | Auto-print a hardcover every 50 photos [F] R1-S7 | 4.7 | Praised [S] R1-S7 | Later |
| Tiny Treasures | Audio export without an account [F] R1-S67 | 5.0 (7) | n/a | **Match** [R] |

**Opportunity.** Free, full export with audio is rarer than it should be; Qeepsake reportedly charges for data export [S] R1-S56. The PDF must look exactly like what prints later, because missing text and blank pages are the top print complaints [S] R1-S10, R1-S56 [R].

### F16 Sync, devices and restore

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Day One | Own cloud, end-to-end encrypted; Basic 1 device, Silver and Gold unlimited [F] R1-S23 | Latest release improved sync on iOS 18 [F] R1-S6 | Stable now [S] R1-S6 | **Match** encryption claims only if true for us (Inferred) |
| Apple Journal | iCloud sync across iPhone, iPad, Mac [F] R1-S5 | 4.8 (327K) | Sync slower than rivals [S] R1-S5 | Neutral |
| Apple Voice Memos | iCloud sync of recordings and edits [F] R1-S64 | 4.8 (1.1M) | n/a | Our audio stays on one phone in v1.0 (B7) |
| Dearest | On-device; optional iCloud backup [F] R1-S3 | 5.0 (1) | n/a | Neutral |
| Then | iCloud end-to-end encrypted backups [F] R1-S68 | Too new | n/a | Neutral |
| FirstChapter | Automatic upload on weak connections, retry (v1.0.6) [F] R1-S4 | n/a | n/a | **Match** [R]: outbox with retry |
| FamilyAlbum | Cloud storage | 4.9 (375K) | Uploads stop if the app closes briefly [S] R1-S12 | **Avoid** [R]: background upload |
| StoryCorps | Cloud archive | 4.6 (1.6K) | Earlier versions lost uploads [S] R1-S31 | **Avoid** [R] |
| Qeepsake | Inactive free accounts deactivated after a year with email notice; kept one more year for restore [F] R1-S44 | n/a | n/a | **Match** notice before any cleanup [R] |
| Tinybeans | Over-limit content archived and hidden after downgrade [F] R1-S46 | n/a | n/a | **Avoid** [R] |

**Opportunity.** Upload resilience is a fix many competitors had to ship later [F] R1-S4, [S] R1-S12, R1-S31. Build the outbox and retry in v1.0 (D-023) [R]. Audio durability is our gap against every iCloud or cloud product; the F16 writer must say what happens to audio when a phone is lost (D-033).

### F17 Settings, privacy controls, consents and deletion

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Dearest | PIN and Face ID; "nothing is ever used to train AI"; never hosts or sells [F] R1-S3 | 5.0 (1) | n/a | **Match** the plain no-training line [R] |
| Remento | "Your content is not used to train any AI models"; delete account and data at any time [F] R1-S13 | 4.8 | n/a | **Match** [R] |
| Day One | End-to-end encryption on all plans; no AI-training statement on the plans page [F] R1-S23 | 4.8 | "Judge-free" private space [S] R1-S6 | **Innovate** [R]: say what Day One does not |
| Apple Journal | Passcode, Touch ID or Face ID lock [F] R1-S5 | 4.8 | n/a | **Match** an optional lock [R] |
| Rosebud | Encryption in transit and at rest; biometric lock [F] R1-S33 | 4.9 | n/a | Neutral |
| Tiny Treasures | No transcription, no voice analysis; per-memory privacy for family [F] R1-S67 | 5.0 (7) | n/a | Neutral |
| From, Mama | Site links to account deletion [F] R1-S39 | 4.9 | n/a | **Match** a web deletion page [R] |
| Apple rule | 5.1.1(v): in-app account deletion required when accounts exist; 5.1.1: consent before collection, easy withdrawal [F] R1-S49 | n/a | n/a | Required |

**Opportunity.** Only Dearest and Remento state "no AI training" in plain words among the products opened [F] R1-S3, R1-S13. Say it once, calmly, in Settings and on the store page, and back it with a working delete (B9) [R]. Privacy labels are covered in F18.

### F18 Analytics and the learning loop

App Store privacy labels as declared today. "None" means the summary showed no "Data Used to Track You" section.

| Product | Data Used to Track You | Data Linked to You (summary) | Source |
|---|---|---|---|
| Dearest | None | None; only Data Not Linked (purchases, identifiers) | [F] R1-S3 |
| Apple Journal | None | None; identifiers and usage not linked | [F] R1-S5 |
| The Days We Keep | None | None; contact and content not linked | [F] R1-S35 |
| Notabli | None | Contact, content, usage, diagnostics | [F] R1-S7 |
| Tell Me Your Story | None | Contact, content, identifiers | [F] R1-S21 |
| FirstChapter | None | Email, content including audio, identifiers, crash data | [F] R1-S4 |
| Sproutbook | Not shown | Purchases, contact, content, identifiers, diagnostics | [F] R1-S8 |
| Rosebud | None | Email, content, identifiers, usage, diagnostics | [F] R1-S33 |
| Tiny Treasures | None | Purchases, location, contact, content, identifiers, usage, sensitive info | [F] R1-S67 |
| Qeepsake | Usage data | Purchases, contact, content, identifiers, usage, diagnostics | [F] R1-S1 |
| 23snaps | Usage data | Purchases, location, contact, content, identifiers, usage including advertising data, sensitive info, diagnostics | [F] R1-S10 |
| Huckleberry | Usage data | Health and fitness, contact, identifiers, usage and advertising data, photos, diagnostics | [F] R1-S11 |
| StoryCorps | Usage data | Email, name, audio, sensitive info | [F] R1-S31 |
| BabyPage | User content, diagnostics | Contact, content, identifiers, sensitive info, diagnostics | [F] R1-S9 |
| FamilyAlbum | Identifiers | Purchases, financial, location, contact, content, identifiers, usage, diagnostics | [F] R1-S12 |
| Chatbooks | Identifiers | Contact, content, identifiers, usage, diagnostics | [F] R1-S32 |
| From, Mama | Contact info, identifiers | Contact, content, identifiers, usage, sensitive info, diagnostics | [F] R1-S20 |
| Qinbaobao | Identifiers | Contact | [F] R1-S66 |
| Day One | Purchases, email, identifiers | Health, purchases, location, contact, content, identifiers, usage, diagnostics | [F] R1-S6 |
| Calm | Purchases, identifiers, usage | Health, purchases, contact, search, identifiers, usage, diagnostics | [F] R1-S48 |
| Tinybeans | Location, contact, content, identifiers, usage | Financial, location, contact, content, identifiers, usage, sensitive info, diagnostics, other | [F] R1-S2 |

**Opportunity.** The two closest letters apps split: Dearest declares nothing linked, From, Mama declares tracking [F] R1-S3, R1-S20. Our opt-in PostHog plus server aggregates (B10) should aim for no "Data Used to Track You" section at all, and the F18 writer must check Apple's current rules on how optional, opt-in analytics are declared (Unverified today) [R].

### F19 Server-driven content, remote config, kill switches, pack delivery

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Calm | Daily content updates: music, soundscapes, daily sessions [F] R1-S48 | 4.8 (2M) | n/a | **Match** server-delivered prompts and tips (B14) [R] |
| From, Mama | Daily curated Reflect tab [F] R1-S20 | 4.9 (48) | n/a | Neutral |
| Day One | Daily prompts and templates on the free plan [F] R1-S23 | 4.8 | n/a | **Match** [R] |
| SpeechAnalyzer | Apple manages model downloads and updates in system storage; no app size cost [F] R1-S70 | Arabic asset download failures in a beta [S] R1-S27 | n/a | Packs need a retry and a visible state (B13) [R] |
| Apple rules | 2.3.1: no hidden or undocumented features; 2.5.2: no downloaded code that changes features [F] R1-S49 | n/a | n/a | Matches B14 "never server-driven" list |
| Competitor internals | How competitors deliver remote config | **Unverified** (not observable from public pages) | n/a | n/a |

**Opportunity.** Public pages show only that daily content is common [F] R1-S48, R1-S23. The useful lesson is from Apple's own asset failures: a downloaded language pack needs a download state, retry and a clear message when it fails [S] R1-S27, [R].

### F20 Help, support and safety resources

| Product | What it does | Does it work? | What customers say | Our call |
|---|---|---|---|---|
| Remento | Human support | Praised as responsive [S] R1-S15 | Communication overload after sign-up [S] R1-S15 | **Match** human replies [R] |
| Storyworth | Human support | Praised as responsive [S] R1-S54 | n/a | **Match** [R] |
| Qeepsake | Email support (support@qeepsake.com) [F] R1-S43 | Trustpilot 3.0; company not replying to recent negative reviews [F][S] R1-S55 | Hard to reach support [S] R1-S55 | **Avoid** [R] |
| Huckleberry | Berry AI guidance; paid "Expedited Service" $19.99 [F] R1-S11 | 4.9 (74K) | Reduces parental anxiety [S] R1-S11 | **Avoid** paid support [R] |
| From, Mama | Reflect tab with content honouring motherhood [F] R1-S20 | 4.9 | Users feel less anxious about time passing [S] R1-S20 | Neutral |
| Qeepsake (signal) | Marketing texts | n/a | Aggressive marketing during a vulnerable postpartum period [S] R1-S1 | **Avoid** [R]: no promotions in the first weeks |
| Safety resources | Static "If you are struggling" rows in competitors | **Unverified**: none seen in the pages I opened | n/a | Our static row (B7) has no visible precedent in the category |

**Opportunity.** Fast, human, reachable support is the praise theme for the two best-rated voice products [S] R1-S15, R1-S54. Postpartum is a sensitive window; a static safety row plus no marketing in early weeks is the right floor [R].

### F21 App Store listing, website and legal pages

| Product | Category | Subtitle (as listed) | Rating | Source |
|---|---|---|---|---|
| Qeepsake | Lifestyle | Baby Book and Milestones Journal | 4.9 (15K) | [F] R1-S1 |
| Tinybeans | Lifestyle | Photo Sharing and Milestones | 4.9 (104K) | [F] R1-S2 |
| FamilyAlbum | Lifestyle, #132 Top Free | Baby Photo Album for Families | 4.9 (375K) | [F] R1-S12 |
| BabyPage | Lifestyle | Track Milestones + Memories | 4.8 (4.1K) | [F] R1-S9 |
| FirstChapter | Lifestyle | Voice Memory Book for Newborns | Not shown | [F] R1-S4 |
| Tiny Treasures | Lifestyle | Baby memory book you can hear | 5.0 (7) | [F] R1-S67 |
| From, Mama | Lifestyle | Write letters to your children | 4.9 (48) | [F] R1-S20 |
| Sproutbook | Lifestyle | Effortless memories, AI recaps | 5.0 (3) | [F] R1-S8 |
| Tell Me Your Story | Lifestyle | Capture Your Family Legacy | Not shown | [F] R1-S21 |
| Dearest | Productivity | Keepsakes, Reimagined | 5.0 (1) | [F] R1-S3 |
| Day One | Health and Fitness | Private Gratitude Journaling | 4.8 (118K) | [F] R1-S6 |
| Apple Journal | Health and Fitness | Reflect on life's moments | 4.8 (327K) | [F] R1-S5 |
| Calm | Health and Fitness, #52 Top Free | Sleep, Meditation, Relaxation | 4.8 (2M) | [F] R1-S48 |
| Huckleberry | Medical, #19 | Baby Sleep and Nap Schedule App | 4.9 (74K) | [F] R1-S11 |
| StoryCorps | Education | Listen. Honor. Share. | 4.6 (1.6K) | [F] R1-S31 |
| Babble | Education | Create a Unique Soundbook | 5.0 (1) | [F] R1-S18 |
| Chatbooks | Photo and Video | Print photo books in minutes | 4.8 (249K) | [F] R1-S32 |

| Pattern | Evidence | Our call |
|---|---|---|
| Baby memory apps cluster in Lifestyle | 9 of the 11 baby or family memory apps above [F] | **Match** Lifestyle [R]; journals sit in Health and Fitness, which signals wellness, not family |
| "Voice memory book" is taken | FirstChapter and Tiny Treasures subtitles [F] R1-S4, R1-S67 | **Innovate** [R]: lead with "your words, unchanged" and "letters", not "voice memory book" |
| AI is a selling word for others | Sproutbook "AI recaps"; FirstChapter "AI Baby Journal" [F] R1-S8, R1-S4 | **Avoid** AI in our listing (constitution) [R] |
| Honest marketing rule | 2.3.1: do not promote features the app lacks [F] R1-S49 | Store copy must not promise v1.1 features [R] |

**Opportunity.** The category is crowded with "baby book" and now "voice memory book" titles. Our clearest store position is the promise nobody else makes: the parent's own words, never rewritten, in the parent's own voice, filed by month of age [R].

## 3. New entrants (2025 to 2026)

| Product | First seen | What it is | Price | Traction | Threat to | Source |
|---|---|---|---|---|---|---|
| Tiny Treasures: Voice Capsule | Released 16 Jul 2026 (third-party listing) | Voice and photo capsule for a child; age tags; sealed messages; family phone line; CarPlay; no transcription | $4.99/mo, $29.99/yr, $99 lifetime | 5.0 (7) | F08, F10, F14, F21 | [F] R1-S67 |
| From, Mama | 11 Apr 2026 (third-party listing) | Letters to children by typing or dictation with name correction; audio and video notes; Village contributors; prompts | $5.99/mo, $49.99/yr | 4.9 (48) | F04, F07, F11 | [F] R1-S20, R1-S17 |
| FirstChapter | Jun 2026 (CR) | 30-second voice into polished AI entries; family comments | $6.99/mo, $39.99/yr | No US average | F06, F21 | [F] R1-S4 |
| Chapter One: Baby Journal | 7 Jul 2026 (third-party listing) | Prompted memory journal; local plus encrypted iCloud | Free (IAP Unverified) | 5.0 (11) | F09, F16 | [F] R1-S34 |
| The Days We Keep | Unverified | Photos, voice, reflections, time capsules, family sharing; English, Spanish, Brazilian Portuguese | $4.99/$34.99; $9.99/$59.99 | 5.0 (2) | P4 multilingual | [F] R1-S35 |
| Life Lessons: Family Wisdom | 3 Apr 2026 (third-party listing) | Written and audio lessons for children, scheduled delivery, AI answers from lessons | $4.99/mo, $39.99/yr | 5 (2) | F06 contrast | [F] R1-S19 |
| Then: Voice Time Capsule | 14 May 2026 | 60-second sealed voice notes; 7 languages; on-device, no account | Free; Pro EUR 4.99/yr intro | Very early | F02, F05 | [F] R1-S68 |
| Nostalgia | Unverified | AI journal with voice credits and memory books | Many IAPs | 5.0 (7) | F14 contrast | [F] R1-S69 |
| Rosebud | Earlier | AI self-reflection journal, voice in 20 languages | $12.99 and up | 4.9 (3.3K) | F05 benchmark | [F] R1-S33 |
| Little Love Books (UK) | Unverified | App-to-print baby journal | GBP 70 book | Unverified | Print (later) | [F] R1-S36 |
| Qinbaobao (Chinese families) | Long-running | Chinese baby record app: cloud photos, family space, growth videos, printing, parenting courses, shop | IAP courses | 4.9 (3.8K) US | P4 Mandarin families | [F] R1-S66 |

**Apps for Hindi, Spanish, Arabic or Chinese speaking families.** Qinbaobao serves Chinese families with photo records and parenting content, not letters or voice transcription [F] R1-S66. The Days We Keep offers Spanish and Brazilian Portuguese UI [F] R1-S35. I found no memory app that transcribes Hindi or Arabic speech (Inferred from searches today; a wider Hindi search found only English apps). AudioPen and Stoic were found in search but their listings were not opened (**Unverified**).

## 4. Quality-bar patterns a spec writer should copy

| # | From | Pattern | Evidence | Apply to |
|---|---|---|---|---|
| 1 | Calm | Ask to set a daily reminder on a screen right after the first completed session | 40% of users shown it set one; 3x retention; Calm judged it causal [F] R1-S57 | F13: ask after the first saved letter, not at install |
| 2 | Headspace | Keep onboarding questions few and useful; do not expect onboarding to build the habit | Quiz doubled course starts (31% to 63%), no lift in meditation days; precommitment +7.5% opens [F] R1-S58 | F01, F03, F13 |
| 3 | Day One | Shared space with author-only editing by default, owner controls members, invitees free | Shared Journals rules [F] R1-S24 | F11 |
| 4 | Day One | Media stays playable on every tier after a subscription ends | Pricing guide and audio guide [F] R1-S25, R1-S60 | F08, F14 lapse |
| 5 | Day One (avoid) | Transcription language taken from the keyboard | Users report wrong-language transcripts and ask for a setting [S] R1-S61 | F05: per-author, per-letter language |
| 6 | Airbnb | Email, phone, Google and Apple sign-up offered together | Help topic [F] R1-S59 | F02 sign-in sheet (we use email link, no phone) |
| 7 | Apple Voice Memos | One-tap Enhance for noisy recordings | Listing [F] R1-S64 | F08 listening copy, original kept |
| 8 | Apple Journal | Optional passcode or Face ID lock on the journal | Listing [F] R1-S5 | F17 |
| 9 | Apple SpeechAnalyzer | System-managed on-device models that do not add to app size; check `isAvailable` and `supportedLocales` before offering a language, fall back to `DictationTranscriber` | WWDC25 session and class docs [F] R1-S70, R1-S73 | F05, B13 size budget |
| 13 | Apple StoreKit | Use SubscriptionStoreView: prices and policy links come from App Store Connect, so the paywall needs no server and no hand-built legal links | Class docs [F] R1-S50 | F14 (B2) |
| 10 | Apple App Review | Trial length, what ends and future charges shown before purchase; marketing pushes need opt-in; in-app deletion; no forced login without account features | Guidelines 3.1.2, 4.5.4, 5.1.1(v) [F] R1-S49 | F14, F13, F17, F02 |
| 11 | Tinybeans (category leader) | Value cards before personal data; optional child info; primed notification ask | +885% completion [F] R1-S51 | F01, F03 |
| 12 | Huckleberry | Live Activity on the lock screen and widgets for one-tap logging | Listing [F] R1-S11 | F04 |

Apple's Human Interface Guidelines pages for onboarding, in-app purchase and notifications could not be read today (they need JavaScript), so no HIG claim is made here (**Unverified**).

## 5. Gaps and what could not be verified

| Gap | Why | Who resolves |
|---|---|---|
| Official SpeechTranscriber locale list | Apple's page names the `supportedLocales` property but lists no languages (R1-S73); the launch list comes from a third-party article and the Arabic failure from a forum thread | F05 writer, on a device with `supportedLocales` |
| Whether SpeechTranscriber accepts custom vocabulary | Apple groups custom-vocabulary classes in the framework (R1-S72); one forum report says only `DictationTranscriber` uses contextual strings (R1-S74); no Apple confirmation read | F07 spike |
| How the 18+ App Store tier affects listing | Apple's announcement (R1-S71) gives tiers and the API but no detail for adult apps; the TechCrunch page was rate-limited (429) and not retried | F01 writer |
| Whether SubscriptionStoreView prints trial terms by default | Apple's page (R1-S50) covers prices, policy buttons and Close, but not trial wording | F14 writer, on a build |
| Apple Journal iOS 26 changes | TechRadar page rate-limited (429); not retried | F09 writer if needed |
| Headspace App Store listing | Returned 429 | Retry later |
| Apple HIG (onboarding, in-app purchase, notifications) | Pages need JavaScript | Spec writers read directly |
| App Store language lists for Qeepsake, Tinybeans, BabyPage, 23snaps, Huckleberry, From, Mama, Tell Me Your Story | Fetch summaries matched the App Store page's own language picker | Treat as Unverified |
| Storyworth iOS app | Search found no App Store listing | Unverified, as in CR |
| Qeepsake sign-in methods, launch carousel | Not on any page opened | Unverified |
| Qeepsake "Plus" IAP ($35.99 to $47.99) | Listed in IAPs, not on pricing page | Unverified |
| Dearest printable books | App Store says available; site says coming soon | Conflict; treat as Unverified |
| Sproutbook trial | 14 days (site) vs 30 days (CR, App Store) | Conflict |
| Tiny Treasures and From, Mama release dates | Only third-party listings | Treat as approximate |
| Trials and lapse rules for most new entrants | Not on listings | Unverified |
| Reddit and App Store review pages beyond the summaries | Not attempted; CR found the proxy blocks site-restricted search | Unverified |
| Competitor safety resources | None seen; absence not proven | Unverified |
| Artifact, Lifecake, CocoBaby, Chatbooks prices | Not re-checked today | CR S5, S19, S34, S28 |

## 6. Sources

All opened 3 Oct 2026.

- R1-S1 Qeepsake App Store (US): https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787 (opened 3 Oct 2026)
- R1-S2 Tinybeans App Store (US): https://apps.apple.com/us/app/tinybeans-private-family-album/id521633042 (opened 3 Oct 2026)
- R1-S3 Dearest App Store (US): https://apps.apple.com/us/app/dearest-letters-memories/id6790823627 (opened 3 Oct 2026)
- R1-S4 FirstChapter App Store (US): https://apps.apple.com/us/app/firstchapter-ai-baby-journal/id6760676959 (opened 3 Oct 2026)
- R1-S5 Apple Journal App Store (US): https://apps.apple.com/us/app/journal/id6447391597 (opened 3 Oct 2026)
- R1-S6 Day One App Store (US): https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788 (opened 3 Oct 2026)
- R1-S7 Notabli App Store (US): https://apps.apple.com/us/app/notabli-family-social/id580644870 (opened 3 Oct 2026)
- R1-S8 Sproutbook App Store (US): https://apps.apple.com/us/app/id6751468842 (opened 3 Oct 2026)
- R1-S9 BabyPage App Store (US): https://apps.apple.com/us/app/babypage-baby-book-journal/id1362796822 (opened 3 Oct 2026)
- R1-S10 23snaps App Store (US): https://apps.apple.com/us/app/23snaps-private-family-album/id526481189 (opened 3 Oct 2026)
- R1-S11 Huckleberry App Store (US): https://apps.apple.com/us/app/huckleberry-baby-tracker/id1169136078 (opened 3 Oct 2026)
- R1-S12 FamilyAlbum App Store (US): https://apps.apple.com/us/app/-/id935672069 (opened 3 Oct 2026)
- R1-S13 Remento FAQ: https://www.remento.co/faq (opened 3 Oct 2026)
- R1-S14 Storyworth pricing: https://welcome.storyworth.com/storyworth-pricing (opened 3 Oct 2026)
- R1-S15 Remento on Trustpilot: https://www.trustpilot.com/review/remento.co (opened 3 Oct 2026)
- R1-S16 Qeepsake pricing: https://qeepsake.com/pricing/ (opened 3 Oct 2026)
- R1-S17 From, Mama on MWM (third-party listing): https://mwm.ai/apps/from-mama/6760956480 (opened 3 Oct 2026)
- R1-S18 Babble App Store (US): https://apps.apple.com/us/app/-/id6475260578 (opened 3 Oct 2026)
- R1-S19 Life Lessons on AppsHunter (third-party listing): https://appshunter.io/ios/app/life-lessons-family-wisdom/id6761279262 (opened 3 Oct 2026)
- R1-S20 From, Mama App Store (US): https://apps.apple.com/us/app/id6760956480 (opened 3 Oct 2026)
- R1-S21 Tell Me Your Story: Connect App Store (US): https://apps.apple.com/us/app/-/id6754656872 (opened 3 Oct 2026)
- R1-S22 Dujour Baby site: https://www.dujourbaby.com/ (opened 3 Oct 2026)
- R1-S23 Day One plans: https://dayoneapp.com/plans/ (opened 3 Oct 2026)
- R1-S24 Day One Shared Journals: https://dayoneapp.com/shared-journals/ (opened 3 Oct 2026)
- R1-S25 Day One pricing and features guide: https://dayoneapp.com/guides/premium-subscription/day-one-pricing-features-guide/ (opened 3 Oct 2026)
- R1-S26 Apple iOS and iPadOS 27 feature availability: https://www.apple.com/ios/feature-availability/ (opened 3 Oct 2026)
- R1-S27 Apple Developer Forums, SpeechAnalyzer asset errors: https://developer.apple.com/forums/thread/797835 (opened 3 Oct 2026)
- R1-S28 Addpipe, A Quick Look at Apple's SpeechAnalyzer API: https://blog.addpipe.com/apple-speechanalyzer-api/ (opened 3 Oct 2026)
- R1-S29 Remento help, iPhone app: https://help.remento.co/en/articles/9052410-can-i-use-the-remento-iphone-app-to-create-my-remento-book (opened 3 Oct 2026)
- R1-S30 StoryCorps help, recording in the app: https://support.storycorps.org/help-center/how-do-i-record-an-interview-with-the-storycorps-app (opened 3 Oct 2026)
- R1-S31 StoryCorps App Store (US): https://apps.apple.com/us/app/storycorps/id359071069 (opened 3 Oct 2026)
- R1-S32 Chatbooks App Store (US): https://apps.apple.com/us/app/-/id734887606 (opened 3 Oct 2026)
- R1-S33 Rosebud App Store (US): https://apps.apple.com/us/app/id6451135127 (opened 3 Oct 2026)
- R1-S34 Chapter One on MWM (third-party listing): https://mwm.ai/apps/chapter-one-baby-journal/6761275608 (opened 3 Oct 2026)
- R1-S35 The Days We Keep App Store: https://apps.apple.com/app/id6755585543 (opened 3 Oct 2026)
- R1-S36 Little Love Books press release, The Baby Show: https://www.thebabyshow.co.uk/exhibitor-press-releases/finally-baby-book-parents-actually-finish (opened 3 Oct 2026)
- R1-S37 Dearest site: https://dearestapp.com/ (opened 3 Oct 2026)
- R1-S38 Sproutbook site: https://sproutbook.app/ (opened 3 Oct 2026)
- R1-S39 From, Mama site: http://frommama.com (opened 3 Oct 2026)
- R1-S40 Qeepsake help, add a spouse or family contributor: https://help.qeepsake.com/article/142-how-do-i-add-a-spouse-or-family-contributor (opened 3 Oct 2026)
- R1-S41 Qeepsake help, Qeepsake and Tinybeans: https://help.qeepsake.com/article/115-what-does-qeepsake-tinybeans-mean-for-me (opened 3 Oct 2026)
- R1-S42 Qeepsake help, another child's journal: https://help.qeepsake.com/article/134-how-do-i-add-a-journal-for-another-child-to-my-account (opened 3 Oct 2026)
- R1-S43 Qeepsake help, twins or multiples: https://help.qeepsake.com/article/118-how-does-qeepsake-work-with-twins-or-multiples (opened 3 Oct 2026)
- R1-S44 Qeepsake help, access after cancelling: https://qeepsake-help-center.helpscoutdocs.com/article/125-i-cancelled-my-membership-can-i-still-access-my-account (opened 3 Oct 2026)
- R1-S45 Qeepsake help, free trial: https://qeepsake-help-center.helpscoutdocs.com/article/123-what-can-i-expect-during-my-free-trial (opened 3 Oct 2026)
- R1-S46 Tinybeans help, cancelling a subscription: https://tinybeans.helpscoutdocs.com/article/86-what-happens-if-i-cancel-my-subscription (opened 3 Oct 2026)
- R1-S47 Tinybeans help, follower access levels: https://tinybeans.helpscoutdocs.com/article/105-what-are-the-different-access-levels-i-can-grant-followers (opened 3 Oct 2026)
- R1-S48 Calm App Store (US): https://apps.apple.com/us/app/calm/id571800810 (opened 3 Oct 2026)
- R1-S49 Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (opened 3 Oct 2026)
- R1-S50 Apple StoreKit SubscriptionStoreView: https://developer.apple.com/documentation/storekit/subscriptionstoreview (opened 3 Oct 2026; full text read through https://developer.apple.com/tutorials/data/documentation/StoreKit/SubscriptionStoreView.md, opened 3 Oct 2026)
- R1-S51 Tinybeans onboarding case study (Sarah Argus): https://www.sarahargus.com/tinybeans (opened 3 Oct 2026)
- R1-S52 Day One account creation guide: https://dayoneapp.com/guides/getting-started-with-day-one/creating-a-day-one-account/ (opened 3 Oct 2026)
- R1-S53 Remento how it works: https://www.remento.co/how-it-works (opened 3 Oct 2026)
- R1-S54 Storyworth on Trustpilot: https://www.trustpilot.com/review/storyworth.com (opened 3 Oct 2026)
- R1-S55 Qeepsake on Trustpilot: https://www.trustpilot.com/review/qeepsake.com (opened 3 Oct 2026)
- R1-S56 Qeepsake reviews aggregate (JustUseApp): https://justuseapp.com/en/app/1332312787/qeepsake/reviews (opened 3 Oct 2026)
- R1-S57 Calm case study (Amplitude): https://amplitude.com/case-studies/calm (opened 3 Oct 2026)
- R1-S58 Headspace case study (Irrational Labs): https://irrationallabs.com/case-studies/headspace-doubled-course-starts/ (opened 3 Oct 2026)
- R1-S59 Airbnb help, getting started: https://www.airbnb.com/help/topic/1603 (opened 3 Oct 2026)
- R1-S60 Day One guide, audio recording: https://dayoneapp.com/?p=2117 (opened 3 Oct 2026)
- R1-S61 Day One forum, transcription language: https://forums.dayoneapp.com/forums/topic/language-transcription-in-audio-recording/ (opened 3 Oct 2026)
- R1-S62 FamilyAlbum help, using the app with a partner: https://help.family-album.com/hc/en-us/articles/360038640513-How-can-I-use-this-app-with-my-partner (opened 3 Oct 2026)
- R1-S63 Remento help, changing how Remento writes a story: https://help.remento.co/en/articles/8365905-can-i-change-how-remento-writes-my-story (opened 3 Oct 2026)
- R1-S64 Apple Voice Memos App Store: https://apps.apple.com/app/voice-memos/id1069512134 (opened 3 Oct 2026)
- R1-S65 Apple Voice Memos User Guide (Mac), transcription: https://support.apple.com/guide/voice-memos/vm4a03609f0d (opened 3 Oct 2026)
- R1-S66 Qinbaobao App Store (US): https://apps.apple.com/us/app/%E4%BA%B2%E5%AE%9D%E5%AE%9D-%E8%AE%B0%E5%BD%95%E6%88%90%E9%95%BF-%E7%A7%91%E5%AD%A6%E8%82%B2%E5%84%BF/id672984826 (opened 3 Oct 2026)
- R1-S67 Tiny Treasures: Voice Capsule App Store (US): https://apps.apple.com/us/app/id6788518267 (opened 3 Oct 2026)
- R1-S68 Then: Voice Time Capsule on Product Hunt: https://www.producthunt.com/products/then-voice-time-capsule/launches/then-voice-time-capsule (opened 3 Oct 2026)
- R1-S69 Nostalgia App Store (US): https://apps.apple.com/us/app/-/id6746683642 (opened 3 Oct 2026)
- R1-S70 Apple WWDC25 session 277, SpeechAnalyzer: https://developer.apple.com/videos/play/wwdc2025/277/ (opened 3 Oct 2026)
- R1-S71 Apple Newsroom, tools to help parents protect kids and teens (Jun 2025): https://www.apple.com/newsroom/2025/06/apple-expands-tools-to-help-parents-protect-kids-and-teens-online/ (opened 3 Oct 2026)
- R1-S72 Apple Speech framework documentation: https://developer.apple.com/tutorials/data/documentation/speech.md (opened 3 Oct 2026)
- R1-S73 Apple SpeechTranscriber documentation: https://developer.apple.com/tutorials/data/documentation/Speech/SpeechTranscriber.md (opened 3 Oct 2026)
- R1-S74 Apple Developer Forums, improving SpeechAnalyzer transcription for technical terms: https://developer.apple.com/forums/thread/801877 (opened 3 Oct 2026)

Pages attempted and refused today: TechCrunch, Apple age ratings article (proxy 429); TechRadar, Apple Journal on iPad and Mac (proxy 429); Headspace App Store listing (429); AudioPen App Store listing (429); FamilyAlbum listing at id1035154866 (404, replaced by R1-S12); Apple HIG onboarding, in-app purchase and notifications pages (body needs JavaScript).
