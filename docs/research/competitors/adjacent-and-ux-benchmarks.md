# Early Letters: adjacent capabilities and premium UX benchmark (October 2026)

Owner: research lead 3. Date: 2026-10-03. Scope: two studies requested in the agent brief of 2026-10-03.

- **Study A** covers adjacent capabilities: voice and AI capture, legacy and voice preservation, time capsules, multilingual transcription UX, and lean-app patterns (on-demand models and packs, server-driven UI).
- **Study B** is a premium-app UX benchmark of nine products, mapped to Expo SDK 57 libraries.
- The document ends with 25 prioritised patterns to copy and a list of requests for other doc owners.

I edited no other file. This file builds on `docs/design/BENCHMARK.md`, `DESIGN_LANGUAGE.md`, `MOTION.md` and `docs/research/COMPETITIVE_RESEARCH.md`, and does not repeat what they already establish.

## How to read the evidence tags

Every claim carries a bracketed source ID that links to a URL. The ID list is at the end. Each claim also carries one of these tags:

| Tag | Meaning |
|---|---|
| `V` | Verified on the cited primary page (the company's own site, docs, help centre, App Store page or Apple documentation), opened 2026-10-03. |
| `T` | Verified on a cited third-party page (teardown recording, press article, review). Accurate to that source, which may lag the live app. |
| `O` | Observed by me: App Store screenshots downloaded 2026-10-03 through the cited App Store lookup URL and inspected. |
| `L` | Verified in the repo's installed package source (`node_modules`) and on the cited npm registry page. |
| `I` | Inferred, or a recommendation (my judgement). |
| `U` | Unverified: I tried and could not confirm it. |

ScreensDesign (the teardown source for six of the nine Study B apps) publishes chaptered screen recordings with a written description of every screen. Its page metadata dates the recordings (Calm and Headspace 2025-04-15, Duolingo 2025-03-18, Airbnb 2025-05-26, Finch 2025-06-03, Day One 2026-07-06), so flows may have changed since. Mobbin and Page Flows were not usable: Page Flows returned a Cloudflare challenge, and Mobbin's app pages returned 404 without a login.

---

## 0. Key findings

1. **Remento now sells a voice baby book that competes with us directly.** The "Baby Book of Firsts" costs $99 for a year plus one hardcover book with QR codes to the recordings. It is built on "Speech-to-Story", whose copy says "Remento shapes your memories into a written story" and "Our Speech-to-Story technology writes the story" `V` [A29]. This product is not in `COMPETITIVE_RESEARCH.md` (Oct 1). It is the clearest contrast to our promise never to rewrite.
2. **Rewriting is the category default.** AudioPen rewrites at Low, Medium or High strength `V` [A21]. Cleft offers two restructuring styles and one "Clean Transcript" style `V` [A18]. Day One Gold generates titles, summaries and images `V` [A11]. Remento writes narratives `V` [A28]. Only Cleft's "Clean Transcript" ("stays close to what you said") resembles our constitution, and there it is one option on a dial `V` [A18].
3. **The audio library itself is a risk.** The FTC warns that a short clip of a family member's voice is enough to clone it for "family emergency" scams `V` [A34]. A store of grandparents' and parents' voices therefore needs the strictest handling we have `I`.
4. **Apple-hosted Background Assets fits our language packs, with one major caveat.** It gives 200 GB of hosting, up to 200 packs, essential, prefetch and on-demand policies, and explicitly supports "machine learning models" `V` [A56][A59]. But the managed mode needs iOS 26 `V` [A57], while Expo SDK 57 modules declare iOS 16.4 as their minimum `L` [L-expo]. iOS 27's "localized asset packs" pick a pack by the device's preferred language, not by the language the author speaks, so they do not fit our "pick Portuguese, get Portuguese" rule `V` [A58] `I`.
5. **No Expo or React Native module for Background Assets exists on npm** (searched 2026-10-03) `L` [L-npmsearch]. `@bacons/apple-targets` 5.0.0 (MIT) can generate the required "Background Download Extension" target (`bg-download`) `L` [L-targets]. A small local Expo module would still be needed to call `AssetPackManager` `I`.
6. **Every on-device speech model is larger than our whole 40 MB budget.** whisper.cpp's smallest multilingual model is 75 MiB, and large-v3-turbo-q5_0 is 547 MiB `V` [A69]. On-demand delivery is therefore mandatory, and the HIG says large downloads must not block onboarding `V` [A75]. Rule: record now, transcribe when the pack arrives `I`.
7. **Apple's HIG limits pre-permission screens to a single button.** For camera, microphone, location, contacts, calendar and tracking, a custom screen before the system alert must have exactly one button, labelled "Continue" or "Next", with no close or cancel `V` [B24]. Headspace, Finch and Day One use "Maybe later" on their notification primers `T` [B3][B4][B6]. Notifications are not in Apple's list, but our microphone primer must follow the rule `I`.
8. **Every subscription app in the set puts its paywall inside onboarding:** Calm, Headspace, Day One, Finch, and Duolingo after the first lesson `T` [B1][B3][B6][B4][B7]. Our plan to offer Plus at a value moment, never in onboarding, is a deliberate departure `I`.
9. **Day One makes privacy its second App Store screenshot** ("100% Private. You own the data, we keep it safe") `O` [lk-dayone]. Calm triggers App Tracking Transparency (ATT) in its first seconds `T` [B1]. That is the spectrum: be Day One.
10. **Day One keeps audio playback free after a subscription lapses** `V` [A10]. Remento keeps recordings readable and downloadable without renewal `V` [A28][A29]. "Your letters are never held hostage" is now a market norm, not just our promise `I`.
11. **Day One ties transcription language to the keyboard language**, falling back to the device language `V` [A10]. Wispr Flow detects one language per dictation, recommends choosing languages manually, and needs an explicit "Hinglish" choice for mixed Hindi-English `V` [A44]. A language chosen per author is the right model for multilingual families `I`.
12. **iOS Writing Tools can offer to rewrite text in any text view**, including our letter fields `V` [A53]. React Native 0.86.3's `TextInput` has no prop to limit it (searched the installed source) `L` [L-rn]. The founder should decide whether a native patch is needed (see section 6).
13. **`MOTION.md` misreads Calm's breathing pace.** Calm offers 4, 6 or 8 breaths per minute `V` [B17], so 8 per minute is the fastest, not the slowest. Our 4-second idle breath (15 per minute) is nearly twice Calm's fastest pace (see section 6).

---

# Study A: adjacent capabilities

## A1. Voice and AI capture

| Product | Capability and method | Pricing (USD) | Privacy stance | Rewrites the user's words? | Learn / avoid `I` |
|---|---|---|---|---|---|
| **Otter** | Meeting and voice transcription with AI summaries; transcribes English, Spanish, French, German, Japanese and Chinese on every plan `V` [A1]. | Basic free (300 min/mo); Pro $16.99/mo or $8.33/mo billed yearly; Business $30/mo or $19.99/mo yearly; Enterprise custom `V` [A1]. | Trains "proprietary AI technology on de-identified audio recordings and on transcriptions (which may contain Personal Information)" and shares data with "data labeling service providers" `V` [A2]. Class action filed Aug 2025 alleges it recorded non-users without consent and trained on the recordings `T` [A3]. | The transcript is verbatim; it adds machine-written summaries `V` [A1]. | **Learn:** a transcript synced to playback. **Avoid:** training on user audio, human labelling, and consent that is easy to miss. Our recordings of children and grandparents are more sensitive than meetings. |
| **Apple Journal** | Entries can hold audio recordings; iOS 18 added viewable transcripts, search, State of Mind, and an Insights screen with "Current writing streak" plus a streak widget `T` [A6]. iOS 26 added multiple journals, inline images, drawings, a map view, recovery of deleted entries, and iPad and Mac apps `T` [A7]. | Free `V` [lk-journal]. | Journaling Suggestions are created on device and "users can choose which suggested moments are shared"; Face ID lock; entries end-to-end encrypted in iCloud `V` [A5][A8]. | No. But iOS Writing Tools can proofread and rewrite text in text views system-wide `V` [A53]. | **Learn:** privacy built into the architecture and stated in one plain sentence; a lock prompt shown as an entry in the list (see B5). **Avoid:** streaks and "words written" counts. |
| **Day One (audio)** | Up to 30 recordings per entry in .m4a. A standard recording runs up to 3 hours with no transcription; a transcription recording is capped at 10 minutes. Transcription uses Apple's speech API: on device with iOS 26 and Apple Intelligence, otherwise on Apple's servers. The language follows the keyboard, then the device language `V` [A10]. | Basic $0, Silver $49.99/yr, Gold $74.99/yr; audio and transcription need Silver or Gold `V` [A11]. **Playback stays free on every tier, including after a subscription expires** `V` [A10]. | End-to-end encryption on all plans `V` [A11]. Privacy Pledge: "Even if we wanted to read what's in your journal (we don't), we couldn't" `V` [A12]. | Gold generates entry summaries, title suggestions and images `V` [A11]. | **Learn:** playback is never paywalled; recording and transcription are separate modes. **Avoid:** tying the language to the keyboard, and a 10-minute transcription cap. |
| **Rosebud** | AI journaling coach. Voice journaling "in 20 languages"; the AI reflects, asks follow-up questions, "learns about you and recognizes patterns" `V` [A15]; long-term memory and weekly reports `V` [A13]. | Bloom $12.99/mo or $107.99/yr `V` [A13][A15]; Thrive tiers from $24.99 `V` [A15]. | Entries go to "OpenAI, Anthropic, Google, Amazon Web Services, and Groq" under "Zero Data Retention (ZDR) agreements", "anonymized"; staff read entries only for support, safety or technical issues `V` [A14]. | It does not rewrite the entry; it adds an AI voice that talks back `V` [A15]. | **Learn:** naming every model vendor and the ZDR terms plainly. **Avoid:** any AI "companion" voice in a keepsake for a child. |
| **Voicenotes** | Voice notes and meetings with AI summaries; claims "Support for 100+ languages", while its own FAQ says English, Spanish, French, Portuguese, Italian "and 60+ other languages" (inconsistent) `V` [A16]. | Basic free (100 min/week, 30-day history); Pro $9/user/mo; Enterprise $24/user/mo `V` [A16]. | "We do not use your notes, recordings, transcripts, or imported content to train any AI model"; content is processed by OpenAI and Anthropic; full end-to-end encryption is described as not feasible with AI features `V` [A17]. | Produces AI summaries; the raw recording is kept `V` [A16]. | **Learn:** "Never used to train AI" repeated on the pricing page; honesty about why end-to-end encryption is not possible with cloud AI. **Avoid:** a free tier that hides history after 30 days. |
| **Cleft** | "Talk it out. Get a structured note." On-device transcription that works offline. A "camera dial" picks Structured, Structured Prose or **Clean Transcript ("A cleaner transcript that stays close to what you said")** `V` [A18]. | Basic $0 (5-minute recordings); Plus $6.99/mo or $39.99/yr `V` [A19][lk-cleft]. | "No AI training. Your content stays private" `V` [A20]. App Store label lists audio data as linked to the user `V` [lk-cleft]. | Two of its three styles restructure the speech; Clean Transcript stays close `V` [A18]. | **Learn:** a near-verbatim mode can be a named, first-class feature; "on-device" works as a headline. **Avoid:** a style dial. We have one mode only. |
| **AudioPen** | Transcribes "every word", then rewrites into "a style (and language) of your choice" at Low, Medium or High strength; claims it "does not invent content"; lets people "mix languages freely within a single recording" `V` [A21]. | Free (3-minute recordings); Prime $33 per 3 months, $99/yr, $159 per 2 years `V` [A21]. | "User data is not used to train any AI models"; audio "deleted from AudioPen's servers within 48 hours"; offline transcription option `V` [A21]. | **Yes, by design: the opposite of our promise.** It also deletes the audio, the opposite of "the voice is the treasure" `V` [A21] `I`. | **Learn:** short, specific retention promises. **Avoid:** everything about the output model. |

**Rewrite census.**

- **Rewrite or add machine prose:** AudioPen (core), Remento (narrative mode), Cleft (two of three styles), Day One Gold (titles, summaries), Otter and Voicenotes (summaries).
- **Add an AI voice beside the entry:** Rosebud.
- **Do not rewrite:** Apple Journal, Day One Silver, Cleft Clean Transcript.

All `V` per the rows above. No product found makes "we never rewrite" its headline promise `I`.

## A2. Legacy and voice preservation

| Product | What it does and how | Pricing | Privacy stance | Learn / avoid `I` |
|---|---|---|---|---|
| **HereAfter AI** | Interview app. Family members ask questions and it "replies with stories, memories, and advice... in the recorded voice of the person". It retrieves and plays real recordings; it does not synthesise speech `V` [A24][A23]. | Monthly subscription or single payment; no amounts shown on the pages opened `V` [A23]; amounts `U`. | "Only you and the people you directly authorize can access your content"; never sells data; promises recordings will be downloadable if the company shuts down `V` [A23][A24]. App Store: 1.5 stars from 8 ratings, last updated 2023-09-01 `V` [lk-hereafter]. | **Learn:** retrieval of the real voice is the ethical line; a written shutdown promise. **Avoid:** a conversational wrapper around a person. A stale app signals a thin market `I`. |
| **StoryCorps** | Free app that guides interview preparation, records the conversation and uploads it to the StoryCorps Archive and the Library of Congress `V` [A26]. You can keep an interview on the phone only, or publish it with privacy settings; publishing always archives it with the Library of Congress, as a closed collection `V` [A27]. | Free `V` [A26]. | Public or private is your choice when you publish `V` [A27]. | **Learn:** question lists and the interview ritual. **Avoid:** any archive outside the family. Our letters never leave it. |
| **Remento** | Weekly prompt by SMS or email; the storyteller records through a link with "no apps, downloads, or logins" `V` [A28]. Speech-to-Story offers a "word-for-word transcript" with fillers removed, or a narrative in first or third person, concise or detailed `V` [A28]. English and Spanish only `V` [A28]. **Baby Book of Firsts:** "talk for about a minute", and "Our Speech-to-Story technology writes the story"; edits do not change the original recording; QR codes play the recordings `V` [A29]. | Life story: $99 first year including the book, renewal $99/yr or $12/mo `V` [A28]. Baby Book of Firsts: $99 for a year plus one hardcover book with US shipping; renewal $99/yr or $12/mo; extra copies $69; 30-day money-back guarantee `V` [A29]. | "Your content is not used to train any AI models"; full export and deletion; recordings stay accessible without renewal `V` [A28][A29]. | **Learn:** the hardcover with QR codes as the end state, and its copy ("Your laugh. Your excitement. The way you say their name.") `V` [A29]. **Avoid:** "writes the story". Our positioning against it: "Every word is theirs" `I`. |
| **Eternos, now Uare.ai** | Eternos built AI replicas, voice included, for terminally ill people (one client spent 25 hours on his). It pivoted on 2025-11-11 to "Individual AI" with a $10.3M seed round, after the founder found most prospects "weren't preparing for death" `T` [A31][A31b]. eternos.life now redirects to uare.ai, which says its AI "captures how you actually speak, including your tone, emotion, and personality" `V` [A30]. | Not disclosed `T` [A31]. | "Your data is never used to train public AI models" `V` [A30]. | **Learn:** a legacy-only replica market proved thin. **Avoid:** synthetic replicas of any family member. |
| **Voice cloning in general** | Apple Personal Voice: synthesised on device, encrypted, and only for "a voice that sounds like you... for your own personal, non-commercial use" `V` [A32]. ElevenLabs bans replicating "the voice of another person without consent or legal right" `V` [A33]. The FTC says a scammer needs only "a short audio clip of your family member's voice" `V` [A34]. Cambridge researchers (Philosophy and Technology, 2024-05-09) call for consent from data donors, ways to retire a "deadbot", age limits for children, and constant transparency `V` [A35]. | n/a | n/a | See the lines below. |

### Ethical lines we will not cross (recommended for founder sign-off) `I`

1. **No synthetic voice, ever.** We never generate audio of words a person did not say: no text-to-speech in a family member's voice, and no "finish this letter in Nani's voice". Read together plays only original recordings. (Consistent with Personal Voice's own-voice-only rule [A32] and the ElevenLabs consent rule [A33].)
2. **No conversational avatar of a family member, living or dead.** HereAfter shows that retrieving real recordings already meets the emotional need [A23]. The Cambridge paper shows how replicas can haunt families [A35].
3. **No voiceprints and no speaker-identification models built from family audio**, and no training of any model on it. This extends the no-training promise from text to the biometric character of a voice.
4. **Treat the audio store as a cloning corpus.** No public URLs. Short-lived signed links only. Recordings never sit in analytics, logs or crash reports (already a `CLAUDE.md` rule). Export is the owner's choice. The FTC risk [A34] is the reason.
5. **No public sharing surface for letters**, unlike FutureMe's "Public, but anonymous" option [A36] and StoryCorps' public archive option [A27].
6. **When an author dies, their letters stay exactly as they are.** No resurfacing framed around the death, no "continue their story", and no machine-made memorial. This follows the content rule "Legacy is about love and time, never endings".

## A3. Time capsules and letters

| Product | Capability | Pricing | Privacy | Learn / avoid `I` |
|---|---|---|---|---|
| **FutureMe** | "Write. Pick a date. Send. Verify." Delivery in 6 months, or 1, 3, 5 or 10 years, or on a chosen date; "Inspire me!" prompts; "over 20 million letters in 20 years"; Premium adds images, videos and files `V` [A36]. The iOS app became a web wrapper in Dec 2025, and reviews complain of crashes and a lost letter `V` [lk-futureme][A37]. | A tangle of in-app purchases: 1-year Premium at $2.99, $4.99 or $9.99; 5-year $24.99; Lifetime $99.99 or $119; Premium $9.00 `V` [A37]. | Audience choice: "Private" or "Public, but anonymous" `V` [A36]. App Store label: contact info "may be used to track you", and data is used for "Developer's Advertising or Marketing" `V` [A37]. | **Learn:** delivery on a date is a delightful mechanic, and the "verify" step proves the address. **Avoid:** public letters, tracking, a web wrapper, letters lost while composing, and messy pricing. Rated 2.7 from 136 ratings `V` [lk-futureme]. |
| **Letters to Juniper** | letterstojuniper.com answers with a password-protected "Private Site" (HTTP 401) as of 2026-10-03 `V` [A38]. Search turns up only a printed journal of that name `U` [A39]. | `U` | `U` | No live digital product to benchmark `U`. |
| **Email account for a child** | Parents open a Gmail account for the newborn and email it notes and photos, so "every email you send has a date and time stamp" `T` [A40], "a hybrid baby book, memory capture, and special letters for the future" `T` [A41]. | Free | Google may delete an account and "all of its content" after 2 years without use `V` [A42]. Accounts for children under 13 go through Family Link `V` [A43]. | **Learn:** strong proof of demand. Parents already improvise dated letters to their child. **Avoid (it is their risk):** silent deletion of an inbox nobody signs into for 2 years `I` from [A42]. Our answer: no inactivity deletion, a dated letter per entry, export at any age. Sealed "open when" letters are already matched by Dearest (`COMPETITIVE_RESEARCH.md` S10). |

## A4. Multilingual transcription UX

### Choosing a language

| Product | Pattern | Source |
|---|---|---|
| Day One | Uses the keyboard language, then the device language; Day One asks users to set both to the spoken language. | `V` [A10] |
| Wispr Flow | One language per dictation. Auto-detect, or a manual list ("Selecting just one tells Flow to use that language"). Manual selection is recommended for accuracy. | `V` [A44][A45] |
| Otter | A fixed set of six transcription languages. | `V` [A1] |
| Voicenotes, AudioPen | Speak any language; AudioPen allows mixing within a recording. | `V` [A16][A21] |
| Apple SpeechTranscriber | `supportedLocales` lists installed and downloadable locales; it is empty on unsupported devices. | `V` [A51] |
| Apple DictationTranscriber | Takes `contextualStrings` and custom vocabulary, so it can be biased toward names. | `V` [A50] |
| Apple AssetInventory | Speech models are "downloaded from Apple's servers and managed by the system", shared between apps, and limited by per-app locale reservations. | `V` [A52] |
| Google Translate | A Download button beside each language. Advises Wi-Fi. Settings > Offline translation offers Update, Upgrade and Remove. | `V` [A66] |

### Code-switching

- **Wispr Flow** does not support switching mid-sentence. Hindi-English needs "Hinglish" selected explicitly, which outputs romanised Hindi. When Hindi and Urdu are both selected, Flow "double-checks" before transcribing `V` [A44][A45].
- **Sarvam Saaras** offers five output modes: transcribe, translate, verbatim, translit, and "Codemix" ("English words in English and Indic words in native script"). It returns a language probability when it auto-detects `V` [A46].
- **Implication for v1.1 Hindi-English mode `I`:** the hard decision is the script policy, not detection. Each author should choose "Devanagari with English words in English" (Codemix) or "all Roman letters" (Hinglish), and that choice should be stored per author.

### Accuracy feedback

- Rev and Auphonic highlight low-confidence words and keep the text synced to playback `V` [A47][A48].
- Pixel Recorder runs on device and lets users edit speaker labels `V` [A49].
- Wispr's formatting models learn "from user edits" `V` [A45]. We cannot copy that server-side, because it is training on user data. A per-family dictionary that stays on the device is the compatible form `I`.

### Recommendations `I`

1. The language belongs to the **author**, chosen at invite and onboarding. It is never inferred from the keyboard (the Day One pitfall [A10]).
2. Show a small language chip in the Listening header ("Hindi"). One tap opens a sheet to switch before speaking. We never switch silently mid-recording (Wispr: one language per dictation [A44]).
3. In Review, offer "Heard as Hindi. Wrong language?" with "Transcribe again as..." This works because we re-transcribe from the untouched original audio (founder decision 8).
4. Low-confidence words get the quiet underline already specified in `DESIGN_LANGUAGE.md`, validated by Rev and Auphonic [A47][A48]. Tapping one plays that span of audio.
5. Names the family teaches go into `contextualStrings` or the model prompt (Apple supports biasing [A50]). They never leave the device as training data.

## A5. Lean-app patterns

### A5.1 Apple-hosted Background Assets and asset packs (iOS 26: verified)

| Fact | Tag | Source |
|---|---|---|
| Apple hosts up to 200 GB of compressed assets with the Developer Program membership, for TestFlight and App Store apps, on every platform except watchOS. | `V` | [A56] |
| Supported asset types include "machine learning models". | `V` | [A56] |
| Limits: 200 GB total and 200 asset packs per app record, shared across platforms; an email warning at 80%. | `V` | [A59] |
| Download policies: essential (part of install), prefetch (starts at install, may finish later) and on-demand (requested by API). | `V` | [A60] |
| `AssetPackManager` (managed mode) is iOS 26.0+. The low-level framework exists from iOS 16. | `V` | [A57][A55] |
| Integration needs a Background Download extension target ("Apple-Hosted, Managed"), a shared App Group, and Info.plist keys. Packs are fetched with `assetPack(withID:)` then `ensureLocalAvailability(of:)`. | `V` | [A56] |
| Packs are uploaded with Transporter, the App Store Connect API or iTMSTransporter, and built with `ba-package` (macOS, Linux, Windows). | `V` | [A60] |
| Packs are versioned separately from builds, tested in TestFlight, and can go through App Review separately. | `V` | [A58] |
| Apple: use the framework "only to download additional assets... don't collect or transmit data to identify a user or device". | `V` | [A55] |
| iOS 27 adds localized asset packs: one BCP-47 language per pack version, with the system choosing by the device's preferred language and falling back to the closest match. | `V` | [A58][A61] |
| On-Demand Resources: WWDC25 called it "a legacy technology, and it will be deprecated". A third-party reading of the iOS 27 release notes reports it is now deprecated, with no removal date. | `V` / `T` | [A60] / [A62] |
| Apple's own Background Assets docs say nothing about executable code. App Review guideline 2.5.2 forbids downloading code "which introduces or changes features or functionality". | `V` | [A55][A64] |

**Feasibility in Expo SDK 57 `I` (backed by `L` checks):**

- **No module exists.** No Expo or React Native module for Background Assets is on npm `L` [L-npmsearch]. The repo already has the pattern for one: local Expo modules live in `apps/mobile/modules/` (for example `scribe-store`) `L`.
- **The extension target can be generated.** `@bacons/apple-targets` 5.0.0 (MIT, released 2026-07-17) lists `bg-download | Background Download Extension` `L` [L-targets]. So a config-plugin path exists without hand-editing Xcode.
- **Minimum OS is the real constraint.** Expo SDK 57 podspecs declare iOS 16.4, and `app.config.ts` sets no higher deployment target `L` [L-expo]. Apple hosting would therefore only serve iOS 26+ devices. A CDN path is still needed for 16.4 to 25.x, unless the founder raises the minimum to iOS 26, which would also unlock SpeechAnalyzer (`ARCHITECTURE.md` already lists this as an open question).
- **Do not use localized packs for spoken languages.** The system would download by the phone's UI language, not by the author's spoken language. Use **on-demand packs keyed by our own IDs** (`pack.pt.v3`) and request them when an author picks a language.
- **Packs as data fits App Review.** Our "packs are data, not code" design (founder decision 15) sits inside guideline 2.5.2 [A64]. List the packs in "Notes for Review" to satisfy 2.3.1 [A64].

**Fallback CDN:** Cloudflare R2 charges no egress fees, includes 10 GB-month free, and costs $0.015 per GB-month for Standard storage `V` [A70].

### A5.2 Sizes that set the budget

- whisper.cpp model sizes on disk `V` [A69]:
  - tiny: 75 MiB
  - base: 142 MiB
  - small: 466 MiB
  - large-v3-turbo-q5_0: 547 MiB
- Every one of these is larger than the whole 40 MB download budget, so speech models can never ship in the binary `I`.
- Apple's own SpeechTranscriber assets are system-managed and shared between apps `V` [A52]. They cost us no app size. Use them where they match open models on our test set `I`.
- App Store `fileSizeBytes` for reference `V`: Apple Journal 4.2 MB, FutureMe 17.8, StoryCorps 54.3, Voicenotes 88.7, Rosebud 105.0, AudioPen 113.9, Things 3 123.6, Otter 170.8, Calm 176.7, Day One 206.5, Airbnb 358.5, Headspace 422.8, Duolingo 515.2, Finch 536.5 [lk-journal][lk-futureme][lk-storycorps][lk-voicenotes][lk-rosebud][lk-audiopen][lk-things][lk-otter][lk-calm][lk-dayone][lk-airbnb][lk-headspace][lk-duolingo][lk-finch].
- This field is the size Apple reports, not necessarily the thinned download size `I`. Our 40 MB target is about a third of the leanest third-party premium app in this set. Measure on the first release build `I`.

### A5.3 How consumer apps handle on-demand downloads

| App | Pattern | Source |
|---|---|---|
| Google Translate | Per-language Download button; advises Wi-Fi; Settings lists packs with Update, Upgrade and Remove; asks to confirm before removing. | `V` [A66] |
| Spotify | Wi-Fi-only by default with a "Downloads over cellular" toggle; "Remove all downloads" in Storage; suggests 1 GB free; downloads stay valid only if the app goes online every 30 days. | `V` [A67] |
| Calm | A cloud icon on each item; "My Downloads" in Profile > Library; asks people to wait until the session has fully buffered before downloading. | `V` [A68] |
| Apple (HIG) | "Don't let large downloads hinder onboarding... include enough media... to prevent people from having to wait for downloads to complete before they can start interacting." | `V` [A75] |

Duolingo's offline behaviour could not be verified: its help article redirects to a generic page `U`.

**Our pattern `I`:**

- **Picking a language:** a row such as "Portuguese, 180 MB. Downloads on Wi-Fi." with a progress ring.
- **Settings > Languages:** each pack with "Remove". English cannot be removed.
- **While a pack downloads:** recording is never blocked. The audio saves at once, and Review says "Words will appear when Portuguese finishes downloading."
- **Cellular:** download over Wi-Fi only, unless the person allows cellular for that pack.

### A5.4 Server-driven UI (SDUI): what it looks like, and where it hurts quality

| Company | What they built | Where it hurt, or what they kept native | Source |
|---|---|---|---|
| Airbnb (Ghost Platform, 2021) | Sections, screens and actions defined in one GraphQL schema for web, iOS and Android; native renderers map section types to components. | The article lists no limitations; it calls the platform "in its infancy". | `T` [A71] |
| Lyft (bikes and scooters, 2023) | A backend-for-frontend returns view models. | Declarative components "don't support highly responsive (i.e. fully client-side) interactions"; client-owned "Semantic Components" are the escape hatch for animation and complex views. | `T` [A72] |
| DoorDash (2021) | Generic server-driven components; releases go out as backend deploys. | Versioning of client capabilities; local-state interactions needed hybrid designs; extra API calls reduced responsiveness. | `T` [A73] |
| Nativeblocks (vendor blog) | n/a | Lists performance overhead, dependence on connectivity, backend complexity and harder debugging. | `T` [A74] |
| Apple App Review | n/a | 2.3.1 forbids "hidden, dormant, or undocumented features"; 2.5.2 forbids downloading code that changes functionality. | `V` [A64] |

**Verdict `I`:** founder decision 16 (native screens, server-delivered content blocks) is the Lyft split.

- **Server-driven, safely:** prompts, tips and announcement cards. These are small typed blocks rendered by our own components, cached for offline use.
- **Keep native and versioned in the binary:** anything with gestures or motion (Listening, Review, Read together), anything that must work offline (capture), and anything Apple polices (paywall, permissions, data collection).

---

# Study B: premium-app UX benchmark

Each app has the same ten parts:

- onboarding
- motion
- type and colour
- sound and haptics
- empty states
- paywall
- permission priming
- privacy messaging
- App Store screenshots
- Expo SDK 57 mapping

Where a part says `U`, no source covered it and I chose not to guess.

## B0. Expo SDK 57 library facts used in the mappings

| Library | Version in this repo, or pinned by SDK 57 | Latest on npm (date) | Licence | What it gives us | Caveat |
|---|---|---|---|---|---|
| Reanimated | 4.5.1 installed and pinned `L` [L-reanimated] | 4.7.1 (2026-10-02) `L` | MIT | Springs by `duration` + `dampingRatio` or `stiffness` + `damping` (not mixed) `V` [B32]; layout animations (`FadeIn`, `FadeInDown`, `LinearTransition`, `CurvedTransition`, `Keyframe`); `useReducedMotion`; `useFrameCallback` `L`; CSS animations `V` [B33] | Shared-element transitions sit behind `ENABLE_SHARED_ELEMENT_TRANSITIONS` and are experimental (`MOTION.md` section 8). |
| Gesture Handler | 2.32.0 installed and pinned `L` [L-rngh] | 3.3.0 (2026-09-11); `legacy` tag 2.33.0 `L` | MIT | Pan, long-press and tap with Reanimated worklets | v3 has a new API; stay on SDK 57's pin. |
| @gorhom/bottom-sheet | Not installed; not in SDK 57's bundled list `L` [L-gorhom] | 5.2.14 (2026-05-09) `L` | MIT | In-screen sheets, persistent mini-players, scrollable sheets. Peer deps: Reanimated `>=4.0.0-`, Gesture Handler `>=2.16.1` `L` | Prefer native `formSheet` (Expo Router) for modal sheets (`MOTION.md` 5i). Use gorhom only for sheets that live inside a screen. |
| Expo UI (SwiftUI) | 57.0.21 installed `L` [L-expoui] | same `L` | MIT | `Host`, `BottomSheet`, `ContentUnavailableView` (iOS 17), `DatePicker`, `Picker`, `Gauge`, `ProgressView`, `ShareLink`, `ContextMenu`, `GlassEffectContainer`; modifiers including `animation(Animation.spring(...))`, `matchedGeometryEffect`, `glassEffect`, `contentTransition('numericText')`, `symbolEffect`, `presentationDetents` `L` | No `SubscriptionStoreView` and no `sensoryFeedback` modifier `L`. The repo's local `scribe-store` module already presents `SubscriptionStoreView` `L`. |
| expo-blur | Pinned 57.0.3; not installed `L` [L-blur] | 57.0.3 (2026-09-11) | MIT | `BlurView` | HIG: avoid animating blurs under Reduce Motion (`BENCHMARK.md` H2). No Liquid Glass in the content layer. |
| Skia | Pinned 2.6.2; not installed `L` [L-skia] | 2.14.0 (2026-10-01) `L` | MIT | Shaders, mesh and gradient effects, path drawing | Large native dependency `I`. `expo-mesh-gradient` 57.0.2 (MIT) and `expo-linear-gradient` cover Calm-style gradients more cheaply `L` [L-mesh]. |
| Lottie | Pinned ~7.3.8; not installed `L` [L-lottie] | 7.5.0 (2026-08-22) `L` | Apache-2.0 | Designer timelines (Headspace and Finch-style illustration) | `MOTION.md` recommends none in v1. |
| expo-haptics | 57.0.3 installed `L` [L-haptics] | same | MIT | `impactAsync`, `notificationAsync`, `selectionAsync`, `performAndroidHapticsAsync` `L` | Haptics are muted while recording and in Low Power Mode (`MOTION.md` M22). |
| Also relevant | `expo-glass-effect` 57.0.4 installed; `expo-store-review` pinned 57.0.3, not installed; `expo-notifications` 57.0.21 with `allowProvisional` `L` [L-glass][L-review][L-notif] | | MIT | Liquid Glass chrome; review prompt; quiet provisional notifications | |

## B1. Airbnb

- **Onboarding** (recorded around 2025-05) `T` [B5]:
  1. "Log in or sign up" modal: phone number with country picker, social logins below.
  2. Email entry: Continue disabled until valid; four social options.
  3. Personal details: legal name, birth date (date picker), email, password, legal notice.
  4. Agree to terms and verify the account with a code.
  5. "Community Commitment" consent: heart-with-hands icon, "Agree and continue" or "Decline".
  6. Notifications bottom sheet: toggle already on, "Yes, notify me".
  7. System notification alert.
  8. Product tour of Experiences and Services (app mockup, "Exit"), then feature modals ("Got it").
- **Motion:**
  - A declarative transition framework. Elements tagged with the same identifier on two screens animate as one "shared element"; it also does crossfade, edge translation, blur and snapshotting. No durations or springs are published `T` [B14].
  - The 2025 redesign has "smooth animations, subtle lighting, soft curves" on 3D icons (`BENCHMARK.md` S3).
  - Reports of a new "Lava" icon format are third-party only `U` [B16].
- **Type and colour:** Cereal, one family for everything; about 14 px card radius, 48 px buttons, Rausch accent (`BENCHMARK.md` S1, S4).
- **Sound and haptics:** `U`.
- **Empty states:** reviews search shows "no search results" for a term; a wishlist is created inline over the map `T` [B5].
- **Paywall:** none. Airbnb is a marketplace `I`.
- **Permission priming:** a bottom sheet with a toggle and "Yes, notify me", then the system alert `T` [B5]. A "Yes"-style label is what the HIG calls manipulative for the resources it lists `V` [B24].
- **Privacy messaging:** the consent screen is about community conduct; no privacy reassurance appears in the recorded flow `T` [B5].
- **App Store screenshots:** a cream top band; a small 3D icon; a two-line centred caption ("Book great homes around the world"); a device frame cropped at the bottom; real photography inside the UI; one feature per shot `O` [lk-airbnb].
- **Expo SDK 57 mapping `I`:**
  - Shared element: Reanimated 4 measured-rect transition (`MOTION.md` 5f).
  - Notification sheet: Expo Router `formSheet`, or @gorhom/bottom-sheet inside a screen.
  - Date of birth: `@expo/ui` `DatePicker` or the installed community `datetimepicker`.
  - 3D icons: Lottie (not wanted).
- **Copy:** the shared-element card-to-detail, and quiet, neutral type. **Avoid:** legal name, birth date and password before any value; 3D icons.

## B2. Calm

- **Onboarding** (recorded 2025-04-15) `T` [B1]:
  1. Opening screen: "take a deep breath" on a soft blue-to-purple gradient.
  2. System notification alert at 0:00, with no primer.
  3. App Tracking Transparency alert.
  4. Goal quiz ("Reduce Stress"), Continue.
  5. Account: email, Apple or Google, then a name and email form.
  6. "Building Your Plan".
  7. Paywall: yearly versus monthly, 7-day free trial, list of benefits, "Try Free & Subscribe"; App Store sheet "one-week free trial, annual pricing"; success alert.
  8. Welcome; "How did you hear about Calm?" survey; 30-day guest-pass offer.
- **Motion:**
  - "Scenes": full-screen nature videos (Jasper Lake, Denali, Yosemite, "Coastline at Sunset") picked from a carousel `T` [B1].
  - Breathing exercises at 4, 6 or 8 breaths per minute `V` [B17].
- **Type and colour:**
  - In the app: blue-to-purple gradients and dark blue backgrounds `T` [B1][B2].
  - On calm.com (third-party CSS extraction): Figtree in three weights, deep-blue ink #1a3e6f, one gradient (#2477aa to #6461e0) kept for the primary call to action, 20 px house radius, 100 px pill buttons `T` [B18].
- **Sound and haptics:**
  - A scene sound-volume slider and audio settings `T` [B1].
  - iOS breathing haptics have an on/off toggle in Profile settings `V` [B17].
- **Empty states:** a content-led app has no blank start; new features open with an intro (Mood Check-In explainer, "Start Check-In") `T` [B1].
- **Paywall:** inside onboarding, as above `T` [B1].
- **Permission priming:**
  - None for notifications or tracking at launch `T` [B1].
  - Later, a reminder form sets the time (7:00 PM) and days of the week before "Set reminder" `T` [B1]. Good.
- **Privacy messaging:** the ATT alert in the first seconds tells people their activity may be tracked across apps `I` from [B1]. I found no reassurance screen `T`.
- **App Store screenshots:** sky and mountain photo; screenshot 1 is pure social proof ("The #1 App for Sleep & Meditation", "3M 5-Star Reviews", "App Store Awards Winner"); screenshot 2 is press and "Editor's Choice"; features follow in tilted device frames `O` [lk-calm].
- **Expo SDK 57 mapping `I`:**
  - Gradients: `expo-mesh-gradient` or `expo-linear-gradient` (Skia if shaders are ever needed).
  - Video scenes: `expo-video` (not wanted).
  - Breathing: Reanimated `withRepeat(withTiming)`.
  - Haptics: `expo-haptics` with an app setting.
  - Reminder time: `@expo/ui` `DatePicker`.
- **Copy:** pick the reminder time and days before asking; a haptics toggle; the breathing pace range. **Avoid:** cold system alerts at launch, ATT, an awards wall in place of the product, and the paywall in onboarding.

## B3. Headspace

- **Onboarding** (recorded 2025-04-15) `T` [B3]:
  1. Splash.
  2. Breathing animation ("Breathe in" / "Breathe out", orange face graphic).
  3. Welcome with a terms checkbox, "Create account" or "Log in".
  4. Auth options, then an email form.
  5. Feature carousel ("Mindfulness for any moment", community, science-backed benefits).
  6. Goal quiz ("Manage anxiety", "Be present").
  7. Paywall: "14-day free trial", annual/monthly toggle, three-step trial timeline, "Try for $0.00".
  8. Notification warm-up tied to the trial: "smiling bell", "Remind me" or "Maybe later", then the system alert.
  9. Welcome; a guided three-breath exercise on a sky background ("2 breaths left"); a check-in ("Very relaxed"); a suggested Basics course.
- **Motion:**
  - Animation kept to "help simplify complex ideas" `T` [B19].
  - The breathing exercise uses a progress bar and remaining-breath count `T` [B3].
- **Type and colour:**
  - A custom typeface by Colophon, a "Headspace-ified version" of Aperçu that can "flex from playful to clinical" `T` [B19].
  - Signature orange plus a wider palette for "the range of human emotions" `T` [B19].
  - Store art: orange and yellow, with the key word of each headline in orange `O` [lk-headspace].
- **Sound and haptics:** the player has speed, subtitles and "Enhance Dialogue" `T` [B3]. Haptics `U`.
- **Empty states:** n/a. The first home screen uses tooltips ("share sessions") `T` [B3].
- **Paywall:** in onboarding, with the trial-timeline pattern `T` [B3].
- **Permission priming:** framed around the person's benefit ("we'll remind you before your trial ends") `T` [B3]. The second "Maybe later" button breaks the HIG rule for listed resources `V` [B24].
- **Privacy messaging:** a terms checkbox on the welcome screen `T` [B3]. Tone: "kind, warm and welcoming" `T` [B19].
- **App Store screenshots:** an "Award Winning" opener (Apple Design Award, Webby), then bold two-word headlines ("Stress less", "Sleep soundly") over device frames `O` [lk-headspace].
- **Expo SDK 57 mapping `I`:**
  - Breath pacing: Reanimated.
  - Illustration loops: Lottie (we avoid them).
  - Annual/monthly toggle and trial timeline: inside Apple's `SubscriptionStoreView` header through `scribe-store`.
- **Copy:** the trial timeline and a reminder that serves the person. **Avoid:** a terms checkbox before value; a mascot face.

## B4. Day One

- **Onboarding** (recorded 2026-07-06) `T` [B6]:
  1. Splash (bookmark icon), then an intro video.
  2. A screen with a background photo, "Sign in with Apple" and other options; the Apple sheet shows "Hide My Email" selected.
  3. Social proof: awards, ratings, "Let's go".
  4. Paywall: Gold "30-day free trial" with a timeline; a Silver variant with features and a testimonial; App Store sheet ("one-month free trial").
  5. Home: entry list with a ready-made **welcome entry**, tabs, a floating + button; an explainer of free features and tiers.
- **Just-in-time asks later** `T` [B6]:
  - Full photo-library access, asked when a photo is added.
  - Motion and Fitness access.
  - A "privacy for AI features" consent with data-processing disclosures ("Cancel" or "I Agree"), asked before any AI tool runs.
  - Reminder: "Remind me" or "Maybe later", then a **time picker**, then the system alert.
- **Motion:** `U`.
- **Type and colour:** light-blue brand on white, a sans UI, photo-led entries `O` [lk-dayone].
- **Sound and haptics:** `U`.
- **Empty states:**
  - A date with zero entries shows that day's photos and offers to "add events or places", so the blank becomes a suggestion `T` [B6].
  - A welcome entry fills the first list `T` [B6].
- **Paywall:**
  - In onboarding `T` [B6]. Basic $0, Silver $49.99, Gold $74.99 a year `V` [A11].
  - "Playing back audio that is already in your entries is not a subscription feature" `V` [A10].
- **Permission priming:** the time is chosen before the system alert; photos are asked for at the moment of use `T` [B6].
- **Privacy messaging:**
  - Screenshot 2: "100% Private. You own the data, we keep it safe", with a Face ID glyph `O` [lk-dayone].
  - Pledge: end-to-end encryption "turned on by default"; "Even if we wanted to read what's in your journal (we don't), we couldn't" `V` [A12].
  - A separate consent for AI features `T` [B6].
- **App Store screenshots:** light blue; screenshot 1 has App of the Year, press logos and "+15 million users"; screenshot 2 is privacy; then media, a streak calendar and shared journals `O` [lk-dayone].
- **Expo SDK 57 mapping `I`:**
  - Sign in with Apple: `expo-apple-authentication` (installed).
  - Time picker: `@expo/ui` `DatePicker` or the installed community picker.
  - Consent sheet: Expo Router `formSheet`.
  - Paywall: `scribe-store`.
- **Copy:** privacy as screenshot 2; respecting Hide My Email; just-in-time asks; time before permission; free playback. **Avoid:** streaks, a floating + as the only capture control (`BENCHMARK.md` 5), and the paywall in onboarding.

## B5. Apple Journal

- **Onboarding** (first-run description from Nov 2023; may have changed) `T` [B8]:
  1. An invitation to "Turn On Journaling Suggestions", with a "Customize" step for data types (workouts, media, contacts, photos, significant locations).
  2. A notification request for suggestions.
  3. If the journal is unlocked, an entry in the list offers "Set Up Now" for a lock, with a delay choice (Immediately, or after 1, 5 or 15 minutes).
- **Motion:** cards scroll behind a fixed "+" and blur as they leave (`MOTION.md` M2, M3).
- **Type and colour:** system San Francisco, large title "All Entries", "Today" and "Yesterday" section headers, photo-collage cards, a purple accent (Insights card, + button) `O` [lk-journal].
- **Sound and haptics:** `U`.
- **Empty states:** the blank page is replaced by a suggestions sheet ("Recommended" / "Recent") of photo moments and a "Reflection" prompt card ("Think about something you love to do and why it brings you joy") `O` [lk-journal].
- **Paywall:** none (free) `V` [lk-journal].
- **Permission priming:** each request follows a feature explanation `T` [B8]; suggestions are made on device and the user picks what is shared `V` [A8].
- **Privacy messaging:**
  - One-sentence architecture claims: on-device suggestions, a passcode or Face ID lock, end-to-end encryption in iCloud `V` [A5].
  - Settings > Privacy & Security lists every app using Journaling Suggestions `V` [A8].
- **App Store screenshots:** no captions at all; raw full-bleed UI (entries, Insights, suggestions, the editor) `O` [lk-journal].
- **Expo SDK 57 mapping `I`:**
  - Large-title navigation: Expo Router native stack.
  - Suggestions sheet: `formSheet` with detents.
  - Chrome: Liquid Glass through native tabs and `expo-glass-effect`.
  - The Journaling Suggestions API has no Expo module `U`, and `BENCHMARK.md` already rejects ambient suggestions.
- **Copy:** the lock offered as an in-list row (not a modal), and one-sentence privacy claims. **Avoid:** the Insights streak (iOS 18 `T` [A6]).

## B6. Apple Photos Memories

- **What it is:**
  - "Personalized collections of photos and videos that are set to music and that you can watch like a movie", built around "a significant person, place, or event"; people can change songs, title, length and photos `V` [B12].
  - "Type to Create" lets Apple Intelligence write a storyline and set it to music (Mac guide; macOS 27) `V` [B12].
  - iOS 15 gave Memories "a fresh new look, an interactive interface" and Apple Music song suggestions chosen with on-device intelligence `V` [B13].
- **Onboarding, paywall, screenshots:** none. It is a built-in feature `I`.
- **Motion:** Ken Burns pan and zoom (`MOTION.md` M4).
- **Sound:** music under the photos `V` [B12].
- **Privacy:** on-device personalisation `V` [B13].
- **Copy:** "watch it like a movie" as a month-chapter replay of real recordings in order, with a gentle cross-fade between letters (a v2 idea) `I`. **Avoid:** music over voices (`BENCHMARK.md` Readmio), Ken Burns zoom (removed under Reduce Motion), and generated storylines (constitution).
- **Expo SDK 57 mapping `I`:** Reanimated cross-fades; `expo-audio` playlist.

## B7. Finch

- **Onboarding** (recorded 2025-06-03) `T` [B4]:
  1. Welcome: "hatch a new pet", invite, or restore a backup.
  2. Choose an egg, hatch it, choose the pet's pronouns, name it, pick a trait.
  3. The pet asks the user's name; a self-care definition choice; a stat reward; an energy meter at 0/15.
  4. **Notification primer showing a mock reminder card from the pet**, "Turn on notifications" or "Maybe later"; then the system alert.
  5. Email sign-up ("Skip for now").
  6. A long quiz: age, gender, sleep, activity, stress, support network, **mental health challenges**, goals, procrastination.
  7. "Generating your self care goals"; starter plan.
  8. Paywall: 7-day trial, "See my FREE offer"; a discount offer after decline; trial timeline; purchase; thank-you screen.
  9. Attribution survey; Day 1; streak celebration and streak commitment; affirmation; widget promotion and tutorial.
- **Motion:** character-led animation `T` [B4]; specifics `U`.
- **Type and colour:** heavy rounded headlines; pastel illustrated scenes on sky blue `O` [lk-finch].
- **Sound and haptics:** a Soundscapes feature exists `T` [B4]; haptics `U`.
- **Empty states:** an empty reflections section on the dashboard `T` [B4].
- **Paywall:** in onboarding, with a second-chance discount `T` [B4].
- **Permission priming:** a preview of the actual reminder `T` [B4]. This is the best idea in the set, but it breaks the HIG one-button rule for listed resources [B24].
- **Privacy messaging:** collects mental-health conditions in onboarding `T` [B4]; privacy policy not retrieved `U`.
- **App Store screenshots:** illustrated characters, emotional headlines about togetherness ("Self-care is better together") `O` [lk-finch].
- **Expo SDK 57 mapping `I`:**
  - Reminder preview card: plain React Native view plus a Reanimated `FadeInDown`.
  - Characters: Lottie (we avoid them).
  - Widget: `@bacons/apple-targets` `widget` target.
- **Copy:** preview the exact reminder before asking. **Avoid:** health questions at sign-up, streaks, a mascot, second-chance discount pressure, and gendering anything.

## B8. Things 3

- **Onboarding:** a tutorial project, "Meet Things iOS", made of real to-dos. It can be re-created from Settings > Help > Create Tutorial Project `V` [B9].
- **Motion:**
  - "Lovely, unfolding animations" (Cultured Code quoting reviews) `V` [B11].
  - A to-do expands into a card in place (`MOTION.md` M13).
  - It "feels like it was built with haptic feedback in mind" for dragging and the Magic Plus button `T` [B10].
- **Type and colour:** system San Francisco, bold headings, blue accent, yellow star for Today, generous white space `O` [lk-things]; "bold fonts", "white space" `T` [B10].
- **Sound and haptics:** haptics as above `T` [B10]; sound `U`.
- **Empty states:** `U`.
- **Paywall:** none. A one-time purchase of $9.99 on iPhone `V` [lk-things]; two Apple Design Awards `V` [B11].
- **Permission priming:** `U`.
- **Privacy messaging:** `U`.
- **App Store screenshots:** a blue band with a bold lead phrase plus a plain continuation ("**Meet Things.** The award-winning to-do app...") over device frames `O` [lk-things].
- **Expo SDK 57 mapping `I`:**
  - In-place expansion: Reanimated `LinearTransition`.
  - Drag: Gesture Handler with Reanimated.
  - Haptics: `expo-haptics` `selectionAsync`.
- **Copy:** in-place expansion (our "Put it back" card), and a bold-lead caption style. **Avoid:** density, and a gesture-only capture control.

## B9. Duolingo (onboarding and notification craft only)

- **Onboarding** (recorded 2025-03-18) `T` [B7]:
  1. Green splash; "Get Started" or "I already have an account".
  2. Mascot intro; language choice.
  3. A course-building animation with social proof.
  4. Attribution, level, motivation; value proposition ("25 words in the first week").
  5. Daily goal ("I'M COMMITTED").
  6. **Notification warm-up: the mascot's speech bubble and an arrow pointing at the system alert's button**; then the system alert.
  7. Widget promotion and tutorial.
  8. Path choice, then **a first lesson before any account exists**.
  9. Lesson results; streak celebration; streak goal.
  10. Only then "Create profile" ("save your progress", with "Later"): age, name, email, password.
  11. Paywall (free versus Super, a trial-reminder alert, family versus individual); contacts permission.
- **Notification craft:**
  - A bandit algorithm chooses each reminder. It is penalised for repeating recently seen ones, and performance varies by language ("Time for [language]" works for Chinese learners, not English ones). It was trained on about 200 million reminders sent over 34 days `T` [B22].
  - When reminders are ignored, Duolingo tells people it will stop sending them `T` [B23].
- **Motion:** Rive state machines; mouth shapes ("visemes") driven by word and phoneme timings `T` [B21].
- **Type and colour:** Feather Bold by Johnson Banks and Fontsmith (2019) `T` [B20]; lime-green buttons `T` [B7].
- **Paywall and screenshots:** out of scope per the brief. Observed: bottom caption blocks in bright colours (store art) `O` [lk-duolingo].
- **Expo SDK 57 mapping `I`:**
  - Reminders: `expo-notifications` local schedules plus our own back-off rule.
  - Audio-timed highlight: Reanimated `useFrameCallback` (v1.1).
  - Mascot: Rive or Lottie (we avoid it).
- **Copy:** value before account; reminder rotation with a recency penalty; graceful stopping. **Avoid:** guilt, streaks, commitment ceremonies, a mascot pointing at "Allow", and uploading contacts.

## B10. Cross-app comparison

| App | First system alert | Account timing | Paywall position | Privacy in onboarding or store | Source |
|---|---|---|---|---|---|
| Airbnb | Notifications, after a "Yes, notify me" sheet | First | None | Community consent only | `T` [B5] |
| Calm | Notifications at 0:00, then ATT | After quiz | Onboarding | None found | `T` [B1] |
| Headspace | Notifications after trial warm-up | Early | Onboarding | Terms checkbox | `T` [B3] |
| Day One | None in onboarding; photos and reminders just in time | First (Sign in with Apple) | Onboarding | Screenshot 2 "100% Private"; AI consent | `T` [B6] `O` [lk-dayone] |
| Apple Journal | Notifications after the suggestions explainer | n/a (system account) | None | On-device and encryption claims | `T` [B8] `V` [A5] |
| Finch | Notifications after a reminder preview | Email after pet creation | Onboarding | Collects health data | `T` [B4] |
| Things 3 | `U` | n/a | Paid upfront | `U` | `V` [B9][lk-things] |
| Duolingo | Notifications with mascot arrow | After first lesson | After account | n/a | `T` [B7] |
| **Early Letters (proposed)** | Microphone, at first "Speak", one-button primer | After first saved letter | Value moment, never onboarding | Store screenshot 2 plus one line on capture | `I` |

---

## 5. Twenty-five patterns to copy, in priority order

P1 means v1.0. P2 means v1.0 if time allows. P3 means later. "Screen" uses the names in `DESIGN_LANGUAGE.md` section 12. Every row's recommendation is `I`; the evidence for it carries its own tag.

| # | Pri | Pattern | Evidence | Screen | Library that delivers it |
|---|---|---|---|---|---|
| 1 | P1 | **First letter before any account.** Ask for sign-in only after the first saved letter. | Duolingo's first lesson comes before profile creation `T` [B7]; `DESIGN_LANGUAGE.md` already proposes it | Onboarding, Tonight, then Account | Expo Router stack; `expo-apple-authentication` (installed) |
| 2 | P1 | **One-button microphone primer at the first tap on Speak.** "Continue" opens the system alert; no close button. | HIG pre-alert rules `V` [B24]; Calm's cold alerts are the anti-pattern `T` [B1] | Listening (first use) | `expo-audio` permission API; Expo Router `formSheet` |
| 3 | P1 | **Record now, transcribe later.** A missing language pack never blocks capture. | HIG: don't let downloads hinder onboarding `V` [A75] | Listening, Review | `expo-audio`, `expo-file-system`; pack module (A5.1) |
| 4 | P1 | **Language belongs to the author, shown as a chip.** Never inferred from the keyboard. | Day One's keyboard coupling `V` [A10]; Wispr: choose languages manually `V` [A44] | Listening header; Family invite sheet | `@expo/ui` `Picker` (menu style) in `Host`, or a Pressable chip plus `formSheet` |
| 5 | P1 | **Explicit language-pack row:** size, Wi-Fi note, progress, Remove in Settings. | Google Translate `V` [A66]; Spotify `V` [A67]; Calm `V` [A68] | Language picker; Settings > Languages | `expo-file-system` with a SHA-256 check; Background Assets module or R2; progress ring in Reanimated |
| 6 | P1 | **Quiet low-confidence underline; tap to hear that span.** | Rev `V` [A47]; Auphonic `V` [A48] | Review | React Native `Text` runs; `expo-audio` seek; Reanimated for the alternatives card |
| 7 | P1 | **Choose the reminder time first, then ask permission; or ask for provisional (quiet) permission.** | Day One: time picker before the system alert `T` [B6]; Calm's reminder form `T` [B1]; Apple provisional authorisation `V` [B26] | After the first saved letter; Settings | `@expo/ui` `DatePicker` or the installed community picker; `expo-notifications` (`allowProvisional`) |
| 8 | P1 | **Reminder back-off:** rotate wording, penalise recent repeats, and pause after several unopened reminders, saying so once. | Duolingo's recency penalty `T` [B22]; Duolingo stopping reminders `T` [B23] | Notification scheduler | `expo-notifications` local schedules |
| 9 | P1 | **Plus offered at a value moment, never inside onboarding.** | All five subscription apps put it in onboarding `T` [B1][B3][B6][B4][B7] | Plus sheet | `scribe-store` (Apple `SubscriptionStoreView`) `L` |
| 10 | P1 | **Trial timeline in the paywall header** ("Today: full access. Day 23: we remind you. Day 30: Plus begins."). | Headspace `T` [B3]; Day One `T` [B6]; Finch `T` [B4] | Plus sheet | `SubscriptionStoreView` marketing content in `scribe-store` (SwiftUI) |
| 11 | P1 | **Reading, playback and export never gated after a lapse.** | Day One `V` [A10]; Remento `V` [A28][A29] | Book, Letter reading view | Entitlement check in `scribe-store` gates only Plus extras |
| 12 | P1 | **Privacy as App Store screenshot 2**, in one calm line ("Private to your family. Never sold. Never used to train AI."). | Day One `O` [lk-dayone]; Journal's one-line claims `V` [A5] | App Store listing | Store assets made from real app screens |
| 13 | P1 | **Card-to-letter measured-rect transition.** | Airbnb shared elements `T` [B14]; `MOTION.md` 5f | Book to Letter reading view | Reanimated 4 plus Expo Router `transparentModal` |
| 14 | P1 | **In-place unfold for "Put it back".** | Things' "unfolding animations" `V` [B11]; `MOTION.md` M13 | Review | Reanimated `LinearTransition` |
| 15 | P1 | **Native sheets with detents and a grabber** for Reading Size, word alternatives and invite. | HIG sheets (`BENCHMARK.md` H3); Journal's suggestions sheet `O` [lk-journal] | Letter reading view, Review, Family | Expo Router `formSheet` (react-native-screens); @gorhom only for in-screen sheets |
| 16 | P1 | **Haptics only with a visible change, with an off switch.** | Calm's haptics toggle `V` [B17]; Things' drag haptics `T` [B10] | Listening, Review save, Settings | `expo-haptics` (installed) |
| 17 | P1 | **Empty-state anatomy: one line, one action, never a count.** | Apple `ContentUnavailableView` `V` [B27]; Day One turns empty dates into suggestions `T` [B6] | Book (empty month), Family | Our own component built on tokens. `@expo/ui` `ContentUnavailableView` only for system-styled cases such as search with no results (it uses SF Symbols and system fonts `L`) |
| 18 | P1 | **Sign in with Apple first; respect Hide My Email.** | Day One `T` [B6]; HIG privacy `V` [B24] | Account creation | `expo-apple-authentication` |
| 19 | P1 | **Just-in-time consent before any cloud processing**, if a server transcription fallback ships. | Day One's AI privacy consent `T` [B6]; Voicenotes' vendor disclosure `V` [A17] | First server transcription | Expo Router `formSheet` |
| 20 | P2 | **A settle-in moment under 1 second at cold launch, never a gate.** | Calm and Headspace open with a breath `T` [B1][B3] | Cold launch, Tonight | Reanimated `FadeIn` entering; `expo-splash-screen` |
| 21 | P2 | **Pace the idle glow within Calm's range** (4 to 8 breaths per minute, so a 7.5 to 15 second cycle). | Calm `V` [B17] | Listening idle glow; empty-state element | Reanimated `withRepeat(withTiming)` |
| 22 | P2 | **Screenshot layout:** a short caption with a bold lead on a paper band, real UI below, no awards wall. | Things `O` [lk-things]; Airbnb `O` [lk-airbnb]; Calm's awards wall is the anti-pattern `O` [lk-calm] | App Store listing | Store assets |
| 23 | P2 | **Ask for a rating only after a meaningful completed moment** (for example the fifth saved letter), never at launch. | Calm prompts after a session `T` [B1] | Review after save | `expo-store-review` (SDK 57 pin 57.0.3, not installed) |
| 24 | P2 | **Liquid Glass only in chrome.** | Journal on iOS 26 `T` [A7]; HIG materials (`BENCHMARK.md` H5) | Tab bar | Expo Router native tabs; `expo-glass-effect` (installed) |
| 25 | P3 | **Home Screen widget with tonight's prompt** (no streak). | Duolingo and Finch widget promotion `T` [B7][B4] | Widget (v1.1) | `@bacons/apple-targets` `widget` target (MIT) `L` [L-targets] |

---

## 6. Requests for other owners (I edited nothing outside this file)

1. **`docs/research/COMPETITIVE_RESEARCH.md`:** add Remento's Baby Book of Firsts ($99 a year with one hardcover book; Speech-to-Story "writes the story"; QR audio; renewal $99/yr or $12/mo) as the closest US competitor [A29].
2. **`docs/design/MOTION.md`:**
   - Section 1 and open question 1 say "Calm's slowest is 8/min". Calm offers 4, 6 and 8 breaths per minute [B17], so 8 is the fastest.
   - `breathIdleMs` 4000 equals 15 breaths per minute; 7500 to 15000 would sit inside Calm's range.
   - Section 5j's "8 s" cycle (Calm's fastest pace, not its slowest) needs the same correction.
3. **Architecture or ADR owner:**
   - Decide the minimum iOS version. iOS 26 unlocks Apple-hosted asset packs [A57] and SpeechAnalyzer [A51]. Staying at SDK 57's 16.4 default needs a CDN path for packs [L-expo].
   - If Apple hosting is chosen, add a `bg-download` target through `@bacons/apple-targets` [L-targets] and a local module calling `AssetPackManager` [A56].
   - Do not use iOS 27 localized packs for spoken languages [A58].
4. **Founder (constitution, decision 7):** iOS Writing Tools can offer to rewrite text in our letter fields [A53][A54]. React Native 0.86.3 exposes no `writingToolsBehavior` prop [L-rn]. Options:
   - (a) leave it; it is the person's own system tool, like autocorrect;
   - (b) a small native patch setting `.limited` or `.none` on letter fields.

   This needs a founder decision. I have no recommendation without user research.
5. **Design owner (`DESIGN_LANGUAGE.md` onboarding):** the microphone primer must have one "Continue" button and no "Not now" [B24]. Typing remains the alternative on Tonight, not on the primer.
6. **Legal and privacy owner:** consider adding "We never create a synthetic voice of anyone" and "No voiceprints" to the privacy page, reasoning from [A34][A32][A33].

## 7. Gaps and what I could not verify

- **Unverified:** HereAfter prices; the Letters to Juniper product; Duolingo's offline behaviour; haptics and sound for Airbnb, Headspace, Finch and Duolingo; Things 3 empty states, permission prompts and privacy wording; Finch's privacy policy (it redirected to a page whose content did not load).
- **ScreensDesign descriptions** are machine-written captions of real recordings. Screen order comes from their chapter timestamps.
- **Apple support pages** load their article body dynamically. Journal's first-run flow therefore comes from a 2023 third-party walkthrough [B8].
- **Two items were discarded:**
  - A Design Week article about "CALM" turned out to be the UK charity, not the Calm app.
  - The "Lava" icon format has only third-party sources [B16].

---

## Sources (opened 2026-10-03 unless marked)

### Study A

| ID | Source |
|---|---|
| A1 | Otter pricing: https://otter.ai/pricing |
| A2 | Otter privacy policy: https://otter.ai/privacy-policy |
| A3 | NPR, Otter class action (2025-08-15): https://www.npr.org/2025/08/15/g-s1-83087/otter-ai-transcription-class-action-lawsuit |
| A5 | Apple Newsroom, Journal launch (2023-12-11): https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/ |
| A6 | 9to5Mac, Journal in iOS 18 (2024-10-09): https://9to5mac.com/heres-everything-new-in-the-journal-app-for-ios-18/ |
| A7 | 9to5Mac, Journal on iPad and Mac (2025-06-17): https://9to5mac.com/2025/06/17/apples-journal-app-is-coming-to-ipad-and-mac-with-big-upgrades/ |
| A8 | Apple, Journaling Suggestions and privacy: https://apple.com/legal/privacy/data/en/journaling-suggestions |
| A10 | Day One, Audio Recording guide: https://dayoneapp.com/guides/audio-recording/ |
| A11 | Day One plans: https://dayoneapp.com/plans/ |
| A12 | Day One Privacy Pledge: https://dayoneapp.com/privacy-pledge/ |
| A13 | Rosebud home and pricing: https://www.rosebud.app/ |
| A14 | Rosebud privacy policy: https://help.rosebud.app/about-us/privacy-policy |
| A15 | Rosebud App Store: https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127 |
| A16 | Voicenotes pricing: https://voicenotes.com/pricing |
| A17 | Voicenotes privacy policy: https://help.voicenotes.com/en/articles/9196879-voicenotes-privacy-policy |
| A18 | Cleft home: https://www.cleftnotes.com/ |
| A19 | Cleft pricing: https://www.cleftnotes.com/pricing |
| A20 | Cleft Trust Center: https://www.cleftnotes.com/trust |
| A21 | AudioPen product facts (llms.txt): https://www.audiopen.ai/llms.txt |
| A23 | HereAfter FAQ: https://hereafter.ai/faq |
| A24 | HereAfter home: https://www.hereafter.ai/ |
| A26 | StoryCorps App: https://storycorps.org/participate/storycorps-app/ |
| A27 | StoryCorps help, who can listen: https://support.storycorps.org/help-center/if-i-record-an-interview-with-the-storycorps-app-or-storycorps-connect-does-that-mean-anyone-around-the-world-can-listen-to-it |
| A28 | Remento FAQ: https://www.remento.co/faq |
| A29 | Remento Baby Book of Firsts: https://www.remento.co/babybook |
| A30 | eternos.life (redirects to Uare.ai): https://www.eternos.life/ |
| A31 | TechBuzz, Eternos pivots to Uare.ai: https://www.techbuzz.ai/articles/eternos-pivots-to-uare-ai-raises-10-3m-for-personal-ai-clones |
| A31b | TechCrunch, Eternos pivot (2025-11-11), URL resolved, not read in full: https://techcrunch.com/2025/11/11/immortality-startup-eternos-pivots-to-a-personal-ai-that-sounds-like-you/ |
| A32 | Apple Support, Personal Voice: https://support.apple.com/en-us/104993 |
| A33 | ElevenLabs Prohibited Use Policy: https://elevenlabs.io/use-policy |
| A34 | FTC consumer alert on voice cloning (2023-03): https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes |
| A35 | University of Cambridge, deadbots safeguards (2024-05-09): https://www.cam.ac.uk/research/news/call-for-safeguards-to-prevent-unwanted-hauntings-by-ai-chatbots-of-dead-loved-ones |
| A36 | FutureMe home: https://www.futureme.org/ |
| A37 | FutureMe App Store (privacy label, purchases, reviews): https://apps.apple.com/us/app/futureme/id1607047236 |
| A38 | Letters to Juniper (401, private site): https://www.letterstojuniper.com/ |
| A39 | Search result only, not opened: https://www.amazon.com/Letters-Juniper-personalized-parents-watercolor/dp/B09VFQKM2T |
| A40 | PureWow, Gmail account for your newborn: https://purewow.com/tech/email-for-your-baby |
| A41 | Molly Beck, Inbox for the future: https://mollybeckontech.beehiiv.com/p/inbox-for-the-future |
| A42 | Google inactive account policy: https://support.google.com/accounts/answer/12418290 |
| A43 | Google Family Link, child accounts: https://support.google.com/families/answer/7101025 |
| A44 | Wispr Flow, multiple languages: https://docs.wisprflow.ai/articles/3191899797-use-flow-with-multiple-languages |
| A45 | Wispr Flow research, supporting languages (2026-01-19): https://wisprflow.ai/research/supporting-languages |
| A46 | Sarvam Saaras model docs: https://docs.sarvam.ai/api/getting-started/models/saaras |
| A47 | Rev transcript editor: https://rev.com/blog/transcript-editor-overview |
| A48 | Auphonic transcript editor (2024-03-21): https://auphonic.com/blog/2024/03/21/new-auphonic-transcript-editor/ |
| A49 | Pixel Recorder help: https://support.google.com/pixelphone/answer/16269004?hl=en |
| A50 | Apple DictationTranscriber: https://developer.apple.com/documentation/speech/dictationtranscriber |
| A51 | Apple SpeechTranscriber and supportedLocales: https://developer.apple.com/documentation/speech/speechtranscriber |
| A52 | Apple AssetInventory: https://developer.apple.com/documentation/speech/assetinventory |
| A53 | Apple UIWritingToolsBehavior: https://developer.apple.com/documentation/uikit/uiwritingtoolsbehavior |
| A54 | Apple UITextView.writingToolsBehavior: https://developer.apple.com/documentation/uikit/uitextview/writingtoolsbehavior |
| A55 | Apple Background Assets: https://developer.apple.com/documentation/backgroundassets |
| A56 | Downloading Apple-hosted asset packs: https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs |
| A57 | AssetPackManager (iOS 26.0+): https://developer.apple.com/documentation/backgroundassets/assetpackmanager |
| A58 | App Store Connect, overview of Apple-hosted asset packs: https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs |
| A59 | App Store Connect, asset pack size limits: https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits |
| A60 | WWDC25 session 325, Discover Apple-Hosted Background Assets: https://developer.apple.com/videos/play/wwdc2025/325/ |
| A61 | WWDC26 session 378, StoreKit and Background Assets: https://developer.apple.com/videos/play/wwdc2026/378 |
| A62 | Blake Crosley, ODR deprecated (2026-07-25, updated 2026-09-19): https://blakecrosley.com/blog/on-demand-resources-deprecated-background-assets |
| A63 | App Store Connect, maximum build file sizes: https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes |
| A64 | App Review Guidelines (2.3.1, 2.5.2): https://developer.apple.com/app-store/review/guidelines/ |
| A66 | Google Translate, offline languages on iOS: https://support.google.com/translate/answer/6142473?hl=en&co=GENIE.Platform%3DiOS |
| A67 | Spotify, listen offline: https://support.spotify.com/us/article/listen-offline/ |
| A68 | Calm, use offline: https://support.calm.com/hc/en-us/articles/115002474187-How-to-Use-Calm-Offline |
| A69 | whisper.cpp README and models README: https://github.com/ggml-org/whisper.cpp/blob/master/README.md and https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md |
| A70 | Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/ |
| A71 | Airbnb Engineering, Ghost Platform (2021-06-29): https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5 |
| A72 | Lyft Engineering, SDUI at bikes and scooters (2023-03-09): https://eng.lyft.com/the-journey-to-server-driven-ui-at-lyft-bikes-and-scooters-c19264a0378e |
| A73 | DoorDash Engineering, generic server-driven UI components (2021-08-24): https://careersatdoordash.com/?p=5364 |
| A74 | Nativeblocks (vendor), SDUI pros and cons: https://nativeblocks.io/blog/server-driven-ui-pros-cons/ |
| A75 | Apple HIG, Onboarding: https://developer.apple.com/design/human-interface-guidelines/onboarding |

### Study B

| ID | Source |
|---|---|
| B1 | ScreensDesign, Calm recording and screens (third-party): https://screensdesign.com/apps/calm/ |
| B2 | ScreensDesign, Calm onboarding article (third-party): https://screensdesign.com/articles/calm-onboarding-design/ |
| B3 | ScreensDesign, Headspace (third-party): https://screensdesign.com/apps/headspace-meditation-sleep/ |
| B4 | ScreensDesign, Finch (third-party): https://screensdesign.com/apps/finch-self-care-pet/ |
| B5 | ScreensDesign, Airbnb (third-party): https://screensdesign.com/apps/airbnb/ |
| B6 | ScreensDesign, Day One (third-party): https://screensdesign.com/apps/day-one-journal-private-diary/ |
| B7 | ScreensDesign, Duolingo (third-party): https://screensdesign.com/apps/duolingo-language-lessons/ |
| B8 | Tom's Guide, using the Journal app (2023-11-09): https://www.tomsguide.com/how-to/how-to-use-the-ios-journal-app |
| B9 | Cultured Code, re-create the tutorial project: https://culturedcode.com/things/support/articles/2803553/ |
| B10 | MacStories, Things 3 review (2017-05-16): https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/ |
| B11 | Cultured Code, Things: https://culturedcode.com/things/ |
| B12 | Apple Support, Memories in Photos (Mac): https://support.apple.com/guide/photos/watch-memories-pht96259d626/mac |
| B13 | Apple Newsroom, iOS 15 (2021-06): https://www.apple.com/newsroom/2021/06/ios-15-brings-powerful-new-features-to-stay-connected-focus-explore-and-more/ |
| B14 | Airbnb Engineering, Motion engineering at scale (2022-12-07): https://medium.com/airbnb-engineering/motion-engineering-at-scale-5ffabfc878 |
| B16 | Search result only, not opened (Lava icons): https://medium.com/@waldobear002/airbnbs-new-lava-icon-format-a-technical-deep-dive-b2604626c7e0 |
| B17 | Calm Support, breathing pace and haptics: https://support.calm.com/hc/en-us/articles/360000069973-Calm-Breathing-Exercises-How-to-Adjust-Speed-Timers-Haptics-Vibrations |
| B18 | shadcn.io, Calm DESIGN.md (third-party extraction of calm.com): https://www.shadcn.io/design/calm |
| B19 | It's Nice That, Headspace rebrand (2024-04-25): https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424 |
| B20 | Creative Bloq, Duolingo Feather Bold: https://creativebloq.com/news/feather-bold |
| B21 | Duolingo blog, character visemes with Rive (2022-11-10): https://blog.duolingo.com/world-character-visemes |
| B22 | Duolingo blog, the AI behind the reminders (2020-09-03): https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/ |
| B23 | Taplytics, Duolingo stops unengaged reminders: https://taplytics.com/blog/duolingo-sends-push-notifications-to-let-users-know-they-know-theyre-not-engaging-with-their-reminders |
| B24 | Apple HIG, Privacy (pre-alert screens): https://developer.apple.com/design/human-interface-guidelines/privacy |
| B26 | Apple, asking permission to use notifications (provisional): https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications |
| B27 | SwiftUI ContentUnavailableView: https://developer.apple.com/documentation/swiftui/contentunavailableview |
| B28 | StoreKit SubscriptionStoreView: https://developer.apple.com/documentation/storekit/subscriptionstoreview |
| B32 | Reanimated withSpring: https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/ |
| B33 | Reanimated CSS animations: https://docs.swmansion.com/react-native-reanimated/docs/css-animations/animation-name/ |

### App Store lookups (metadata and screenshots, 2026-10-03)

| ID | Lookup URL |
|---|---|
| lk-airbnb | https://itunes.apple.com/lookup?id=401626263&country=us |
| lk-calm | https://itunes.apple.com/lookup?id=571800810&country=us |
| lk-headspace | https://itunes.apple.com/lookup?id=493145008&country=us |
| lk-dayone | https://itunes.apple.com/lookup?id=1044867788&country=us |
| lk-journal | https://itunes.apple.com/lookup?id=6447391597&country=us |
| lk-finch | https://itunes.apple.com/lookup?id=1528595748&country=us |
| lk-things | https://itunes.apple.com/lookup?id=904237743&country=us |
| lk-duolingo | https://itunes.apple.com/lookup?id=570060128&country=us |
| lk-otter | https://itunes.apple.com/lookup?id=1276437113&country=us |
| lk-rosebud | https://itunes.apple.com/lookup?id=6451135127&country=us |
| lk-audiopen | https://itunes.apple.com/lookup?id=6502638001&country=us |
| lk-voicenotes | https://itunes.apple.com/lookup?id=6483293628&country=us |
| lk-storycorps | https://itunes.apple.com/lookup?id=359071069&country=us |
| lk-hereafter | https://itunes.apple.com/lookup?id=1626176069&country=us |
| lk-futureme | https://itunes.apple.com/lookup?id=1607047236&country=us |
| lk-cleft | https://apps.apple.com/us/app/id6479458038 |

### Packages (npm registry, checked 2026-10-03; installed versions read from the repo's `node_modules`)

| ID | Source |
|---|---|
| L-expo | expo 57.0.26 (bundledNativeModules.json; podspecs declare iOS 16.4): https://www.npmjs.com/package/expo |
| L-reanimated | https://www.npmjs.com/package/react-native-reanimated |
| L-rngh | https://www.npmjs.com/package/react-native-gesture-handler |
| L-gorhom | https://www.npmjs.com/package/@gorhom/bottom-sheet |
| L-expoui | https://www.npmjs.com/package/@expo/ui |
| L-blur | https://www.npmjs.com/package/expo-blur |
| L-skia | https://www.npmjs.com/package/@shopify/react-native-skia |
| L-lottie | https://www.npmjs.com/package/lottie-react-native |
| L-haptics | https://www.npmjs.com/package/expo-haptics |
| L-mesh | https://www.npmjs.com/package/expo-mesh-gradient |
| L-glass | https://www.npmjs.com/package/expo-glass-effect |
| L-review | https://www.npmjs.com/package/expo-store-review |
| L-notif | https://www.npmjs.com/package/expo-notifications |
| L-targets | @bacons/apple-targets 5.0.0 README target table: https://www.npmjs.com/package/@bacons/apple-targets |
| L-rn | react-native 0.86.3 TextInput (no Writing Tools prop): https://www.npmjs.com/package/react-native |
| L-npmsearch | npm search for "background-assets", "backgroundassets", "asset-pack", "SubscriptionStoreView": https://registry.npmjs.org/-/v1/search?text=background-assets |

[A1]: https://otter.ai/pricing
[A2]: https://otter.ai/privacy-policy
[A3]: https://www.npr.org/2025/08/15/g-s1-83087/otter-ai-transcription-class-action-lawsuit
[A5]: https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/
[A6]: https://9to5mac.com/heres-everything-new-in-the-journal-app-for-ios-18/
[A7]: https://9to5mac.com/2025/06/17/apples-journal-app-is-coming-to-ipad-and-mac-with-big-upgrades/
[A8]: https://apple.com/legal/privacy/data/en/journaling-suggestions
[A10]: https://dayoneapp.com/guides/audio-recording/
[A11]: https://dayoneapp.com/plans/
[A12]: https://dayoneapp.com/privacy-pledge/
[A13]: https://www.rosebud.app/
[A14]: https://help.rosebud.app/about-us/privacy-policy
[A15]: https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127
[A16]: https://voicenotes.com/pricing
[A17]: https://help.voicenotes.com/en/articles/9196879-voicenotes-privacy-policy
[A18]: https://www.cleftnotes.com/
[A19]: https://www.cleftnotes.com/pricing
[A20]: https://www.cleftnotes.com/trust
[A21]: https://www.audiopen.ai/llms.txt
[A23]: https://hereafter.ai/faq
[A24]: https://www.hereafter.ai/
[A26]: https://storycorps.org/participate/storycorps-app/
[A27]: https://support.storycorps.org/help-center/if-i-record-an-interview-with-the-storycorps-app-or-storycorps-connect-does-that-mean-anyone-around-the-world-can-listen-to-it
[A28]: https://www.remento.co/faq
[A29]: https://www.remento.co/babybook
[A30]: https://www.eternos.life/
[A31]: https://www.techbuzz.ai/articles/eternos-pivots-to-uare-ai-raises-10-3m-for-personal-ai-clones
[A31b]: https://techcrunch.com/2025/11/11/immortality-startup-eternos-pivots-to-a-personal-ai-that-sounds-like-you/
[A32]: https://support.apple.com/en-us/104993
[A33]: https://elevenlabs.io/use-policy
[A34]: https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes
[A35]: https://www.cam.ac.uk/research/news/call-for-safeguards-to-prevent-unwanted-hauntings-by-ai-chatbots-of-dead-loved-ones
[A36]: https://www.futureme.org/
[A37]: https://apps.apple.com/us/app/futureme/id1607047236
[A38]: https://www.letterstojuniper.com/
[A39]: https://www.amazon.com/Letters-Juniper-personalized-parents-watercolor/dp/B09VFQKM2T
[A40]: https://purewow.com/tech/email-for-your-baby
[A41]: https://mollybeckontech.beehiiv.com/p/inbox-for-the-future
[A42]: https://support.google.com/accounts/answer/12418290
[A43]: https://support.google.com/families/answer/7101025
[A44]: https://docs.wisprflow.ai/articles/3191899797-use-flow-with-multiple-languages
[A45]: https://wisprflow.ai/research/supporting-languages
[A46]: https://docs.sarvam.ai/api/getting-started/models/saaras
[A47]: https://rev.com/blog/transcript-editor-overview
[A48]: https://auphonic.com/blog/2024/03/21/new-auphonic-transcript-editor/
[A49]: https://support.google.com/pixelphone/answer/16269004?hl=en
[A50]: https://developer.apple.com/documentation/speech/dictationtranscriber
[A51]: https://developer.apple.com/documentation/speech/speechtranscriber
[A52]: https://developer.apple.com/documentation/speech/assetinventory
[A53]: https://developer.apple.com/documentation/uikit/uiwritingtoolsbehavior
[A54]: https://developer.apple.com/documentation/uikit/uitextview/writingtoolsbehavior
[A55]: https://developer.apple.com/documentation/backgroundassets
[A56]: https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs
[A57]: https://developer.apple.com/documentation/backgroundassets/assetpackmanager
[A58]: https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs
[A59]: https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits
[A60]: https://developer.apple.com/videos/play/wwdc2025/325/
[A61]: https://developer.apple.com/videos/play/wwdc2026/378
[A62]: https://blakecrosley.com/blog/on-demand-resources-deprecated-background-assets
[A63]: https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes
[A64]: https://developer.apple.com/app-store/review/guidelines/
[A66]: https://support.google.com/translate/answer/6142473?hl=en&co=GENIE.Platform%3DiOS
[A67]: https://support.spotify.com/us/article/listen-offline/
[A68]: https://support.calm.com/hc/en-us/articles/115002474187-How-to-Use-Calm-Offline
[A69]: https://github.com/ggml-org/whisper.cpp/blob/master/README.md
[A70]: https://developers.cloudflare.com/r2/pricing/
[A71]: https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5
[A72]: https://eng.lyft.com/the-journey-to-server-driven-ui-at-lyft-bikes-and-scooters-c19264a0378e
[A73]: https://careersatdoordash.com/?p=5364
[A74]: https://nativeblocks.io/blog/server-driven-ui-pros-cons/
[A75]: https://developer.apple.com/design/human-interface-guidelines/onboarding
[B1]: https://screensdesign.com/apps/calm/
[B2]: https://screensdesign.com/articles/calm-onboarding-design/
[B3]: https://screensdesign.com/apps/headspace-meditation-sleep/
[B4]: https://screensdesign.com/apps/finch-self-care-pet/
[B5]: https://screensdesign.com/apps/airbnb/
[B6]: https://screensdesign.com/apps/day-one-journal-private-diary/
[B7]: https://screensdesign.com/apps/duolingo-language-lessons/
[B8]: https://www.tomsguide.com/how-to/how-to-use-the-ios-journal-app
[B9]: https://culturedcode.com/things/support/articles/2803553/
[B10]: https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/
[B11]: https://culturedcode.com/things/
[B12]: https://support.apple.com/guide/photos/watch-memories-pht96259d626/mac
[B13]: https://www.apple.com/newsroom/2021/06/ios-15-brings-powerful-new-features-to-stay-connected-focus-explore-and-more/
[B14]: https://medium.com/airbnb-engineering/motion-engineering-at-scale-5ffabfc878
[B16]: https://medium.com/@waldobear002/airbnbs-new-lava-icon-format-a-technical-deep-dive-b2604626c7e0
[B17]: https://support.calm.com/hc/en-us/articles/360000069973-Calm-Breathing-Exercises-How-to-Adjust-Speed-Timers-Haptics-Vibrations
[B18]: https://www.shadcn.io/design/calm
[B19]: https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424
[B20]: https://creativebloq.com/news/feather-bold
[B21]: https://blog.duolingo.com/world-character-visemes
[B22]: https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/
[B23]: https://taplytics.com/blog/duolingo-sends-push-notifications-to-let-users-know-they-know-theyre-not-engaging-with-their-reminders
[B24]: https://developer.apple.com/design/human-interface-guidelines/privacy
[B26]: https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications
[B27]: https://developer.apple.com/documentation/swiftui/contentunavailableview
[B28]: https://developer.apple.com/documentation/storekit/subscriptionstoreview
[B32]: https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
[B33]: https://docs.swmansion.com/react-native-reanimated/docs/css-animations/animation-name/
[lk-airbnb]: https://itunes.apple.com/lookup?id=401626263&country=us
[lk-calm]: https://itunes.apple.com/lookup?id=571800810&country=us
[lk-headspace]: https://itunes.apple.com/lookup?id=493145008&country=us
[lk-dayone]: https://itunes.apple.com/lookup?id=1044867788&country=us
[lk-journal]: https://itunes.apple.com/lookup?id=6447391597&country=us
[lk-finch]: https://itunes.apple.com/lookup?id=1528595748&country=us
[lk-things]: https://itunes.apple.com/lookup?id=904237743&country=us
[lk-duolingo]: https://itunes.apple.com/lookup?id=570060128&country=us
[lk-otter]: https://itunes.apple.com/lookup?id=1276437113&country=us
[lk-rosebud]: https://itunes.apple.com/lookup?id=6451135127&country=us
[lk-audiopen]: https://itunes.apple.com/lookup?id=6502638001&country=us
[lk-voicenotes]: https://itunes.apple.com/lookup?id=6483293628&country=us
[lk-storycorps]: https://itunes.apple.com/lookup?id=359071069&country=us
[lk-hereafter]: https://itunes.apple.com/lookup?id=1626176069&country=us
[lk-futureme]: https://itunes.apple.com/lookup?id=1607047236&country=us
[lk-cleft]: https://apps.apple.com/us/app/id6479458038
[L-expo]: https://www.npmjs.com/package/expo
[L-reanimated]: https://www.npmjs.com/package/react-native-reanimated
[L-rngh]: https://www.npmjs.com/package/react-native-gesture-handler
[L-gorhom]: https://www.npmjs.com/package/@gorhom/bottom-sheet
[L-expoui]: https://www.npmjs.com/package/@expo/ui
[L-blur]: https://www.npmjs.com/package/expo-blur
[L-skia]: https://www.npmjs.com/package/@shopify/react-native-skia
[L-lottie]: https://www.npmjs.com/package/lottie-react-native
[L-haptics]: https://www.npmjs.com/package/expo-haptics
[L-mesh]: https://www.npmjs.com/package/expo-mesh-gradient
[L-glass]: https://www.npmjs.com/package/expo-glass-effect
[L-review]: https://www.npmjs.com/package/expo-store-review
[L-notif]: https://www.npmjs.com/package/expo-notifications
[L-targets]: https://www.npmjs.com/package/@bacons/apple-targets
[L-rn]: https://www.npmjs.com/package/react-native
[L-npmsearch]: https://registry.npmjs.org/-/v1/search?text=background-assets
