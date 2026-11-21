# R6 Benchmark delta since R1 (28 Oct 2026)

| | |
|---|---|
| Status | Desk research, 28 Oct 2026. Extends R1 and R3. No primary interviews. |
| Method limit | Every page was read through a fetch tool that returns a summary, not raw HTML. Treat each figure as a lead to confirm, not a final number. |
| Checked by the coordinator | One item: Apple moved the hidden-features rule from 2.3.1 to 2.5.19 (Apple guidelines page, opened 28 Oct 2026). Corrections applied in R1, R4, F11, F13, F19, F21, 06, 09 and `_AUTHORING.md`. |
| Source ids | `D#` in this file. |

## 1. Bottom line

1. **No price moved among the named competitors since 3 Oct.** FirstChapter $6.99 / $39.99, Dearest Plus $4.99 / $49.99, Qeepsake Essential $4.99 / $47.88 and Premium $9.99 / $95.88, BabyPage $7.99 / $44.99, 23snaps $5.49 / $7.99, Remento $99 year one then $99/yr or $12/mo, Day One Silver $49.99 and Gold $74.99, Storyworth $69 / $99 / $199 all match R1 or CR [F] D1 to D12, D17, D18. Our $49.99 equals Dearest, From, Mama and Day One Silver, sits above FirstChapter ($39.99) and Tiny Treasures ($29.99), and above BabyPage ($44.99).
2. **Dearest is the competitor that moved most, and it is the closest one.** Its App Store page now lists printable memory books, scheduled sealing, a legacy contact and Face ID lock under Plus, with letters, voice import and ZIP export free, and a no-AI-training statement [F] D4. Its own website still says print books are coming soon [F] D13. R1 flagged this conflict; it persists.
3. **Platform correction on Arabic.** An Apple staff reply (Jan 2026) says SpeechTranscriber wrongly listed Arabic as supported and it was not. A later poster (Apr 2026) says `supportedLocale` has been unreliable for several languages across betas and advises a test transcription per locale before shipping [S] D30. R1 described this as a beta download bug with a fix expected. The better reading today is that Arabic was never supported. I found no Apple source showing new SpeechAnalyzer languages for iOS 27 (see section 4).
4. **Apple's Oct 16 guideline update does not touch subscriptions or voice apps.** It touches 1.2 (AI-generated intimate imagery), adds 2.5.19 (hidden or undocumented features, moved out of 2.3.1) and adds a child-exploitation line to Section 5 [F] D26, D27. B14 and the PRD cite 2.3.1 for server-driven content; the citation should read 2.5.19 now.
5. **Two Apple rules from Nov 2025 matter if F35 (server transcription fallback) ships.** 5.1.2(i) requires disclosure and explicit permission before sharing personal data with third parties including third-party AI [F] D26.
6. **New entrants are many and tiny.** None of the new ones I opened has more than 51 ratings. The ones to watch by name are Early Chapters (name close to ours; family album, video messages, lifetime plan), Forthword (scheduled letters to a child, voice on paid plan), Vellum and Then (sealed voice or video capsules), and Aurloom (searchable, speaker-labelled voice archive). Remento has raised $4.3M in total [S] D41.
7. **Privacy labels remain a differentiator, with one new contrast.** Tiny Treasures' listing says "private by design" while its label lists audio, name, email, phone number and device ID, with device ID used for developer advertising or marketing [F] D1. Vellum and Little Echo declare "Data Not Collected" [F] D36, D37. Dearest declares only purchases and identifiers, not linked to the user [F] D4.
8. **Evidence of what works is thin for every new feature.** Where I rank gaps below, only print books (Remento, Qeepsake) and family sharing (Tinybeans, Day One) have review volume behind them. Everything else rests on apps with fewer than 60 ratings.

## 2. What changed (table)

Dates in the last column are the date I opened the page (28 Oct 2026 for all rows).

| Item | Before per R1 | Now | Source |
|---|---|---|---|
| Tiny Treasures: Voice Capsule | 5.0 (7), v1.0.10, $4.99 / $29.99 / $99 lifetime, phone line, CarPlay | No change: 5.0 (7), v1.0.10 dated Sep 30, same three IAP prices, English only, 34 MB. CarPlay recording needs iOS 26.4 or later. Seller shown as LocalSquare LLC. Label lists audio, name, email, phone, coarse location linked to the user; device ID used for developer advertising or marketing [F] | D1 |
| From, Mama | 4.9 (48), $5.99 / $49.99 | 4.9 (51), v1.7 (Jul 22), same prices. Earlier notes add "Inspire Me" prompts, keyword memory search, sign-up for contributors without children (1.2). Label: Contact Info and Identifiers used to track; English only. Website now shows iOS and Google Play links, free trial length not stated [F] | D2, D14 |
| FirstChapter | US $6.99 / $39.99, v1.0.6 (17 Sep) | Same price and version. Free tier 3 AI voice memories a month; Premium 30, with smart daily prompts, family sharing, export. The 1.0.6 notes in today's summary describe family features (alerts when a relative adds a memory, hearts, comments, weekly family email recap) and photo/video fixes. R1 summarised the same version as retry, background upload and confirm-before-discard. The two summaries differ; both came through summarising tools, so I cannot say which is complete. Still no US average rating [F] | D3 |
| Dearest | App Store says printable books; website says coming soon; v1.4.2 (20 Aug); monthly renewals reminders | App Store page lists Plus Monthly $4.99, Plus Yearly $49.99, 5.0 (1), v1.4.2 (Aug 20). 1.4.2 notes: redesigned printable memory book, "Together" chapter for shared memories, lower monthly price, partner anniversaries, reminders. Free: letters, record and import voice, widgets, ZIP export. Plus: unlimited, scheduled sealing, Face ID, printable books, legacy contact. Website still says print is coming soon and mentions no price [F] | D4, D13 |
| Qeepsake | Essential/Premium; "Plus" IAP at $35.99 to $47.99 meaning Unverified; Trustpilot 3.0 (120) | App version unchanged (4.9.21, Sep 8), 4.9 (15K). IAP list still shows "Plus" at $35.99 and $47.99 beside Premium $95.99 and monthly Essential $4.99 / Premium $9.99. Pricing page shows only Essential ($47.88/yr) and Premium ($95.88/yr), 7-day trial; family contributors are Premium only. Trustpilot still 3.0 (120), newest review 22 Aug 2026. Help centre: plans and pricing unchanged after the Tinybeans deal; no integration dates. "Plus" meaning remains Unverified [F][S] | D5, D6, D19, D20 |
| Tinybeans | $7.99 / $74.99; Legacy $4.49 / $39.99; 9+ | Same IAP list; 4.9 (104K); v5.92.1 (Oct 15); free plan 20 uploads a month and 5 GB; paid adds 200 GB and a two-week trial. 9+ unchanged. Label: Location, Contact Info, User Content, Identifiers, Usage Data used to track [F] | D7 |
| Sproutbook | App Store says 30-day trial vs site 14 days | App Store now lists a 2-week trial and the website says 14 days. They agree; the 30-day figure in CR looks stale. $6.99 / $59.99, 5.0 (3) [F] | D8, D15 |
| Day One | v2026.20 added Google sign-in; 4.8 (118K) | v2026.22 (4 days before fetch) lets users unlink Google; Apple Watch now warns if it cannot record audio rather than saving an empty file. 2026.21 (Oct 12) lists Google sign-in and better iOS 27 support. 4.8 (119K). Silver $49.99, Gold $74.99. Plans page: Silver adds audio recording and transcription; Gold adds AI; shared journals on all plans; 1-month trial. Today's label summary shows data linked to you but no "used to track" group; R1 recorded tracking. Possible summary omission; Unverified [F] | D9, D21 |
| Remento | $99 year one; Trustpilot 4.8 (1,738); English and Spanish | Pricing and renewal unchanged ($99 or $12/mo; extra book $69 or $99; e-book $49.99). Speech-to-Story still English and Spanish, "more planned". Trustpilot 4.8 (1,748; 758 in last 12 months). Sep 2026 reviews: AI text dropped proper nouns; collaborators find the site hard. iPhone app still separate from the book account [F][S] | D10, D22, D23, D24 |
| Storyworth | 4.7 (65,094) | 4.7 (65,271; 4,031 in last 12 months). Plans $69 / $99 / $199. Phone recording with automatic transcription, any phone including landline. No app mentioned [F] | D25, D11 |
| BabyPage | Last update Jun 2025 (CR) | v3.1.4 (Sep 29), prior 3.1.3 (Jun 23). Active again. $7.99 / $13.99 / $44.99, 4.8 (4.1K). Label: User Content and Diagnostics used to track [F] | D12 |
| 23snaps | 4.8 (11K), $5.49 / $7.99 | 4.8 (12K), v9.4.3; same prices; gift options $9.19 to $65.99 [F] | D17 |
| Chatbooks | Prices not re-checked in R1 | App Store: free app, Monthbooks subscription, 4.8 (250K), v5.17.8 (Oct 16). Price not on the page; Unverified. Label: Identifiers used to track [F] | D18 |
| StoryCorps | 4.6 (1.6K), v6.x | Same: 4.6 (1.6K), v6.2.11 (Mar 23), English only [F] | D16 |
| Nostalgia | Pay-per-minute voice credits | v1.1.10 (Oct 15). Voice credits $1.99 (5 min) and $8.99 (30 min); plans $2.99/mo or $29.99/yr per description. Notes for 1.0.57 mention six added languages while the listing shows English only (conflict) [F] | D17b |
| The Days We Keep | EN, ES, PT-BR | v3.1.0 (Oct 18). Essentials $4.99 / $34.99, Unlimited $9.99 / $59.99, 7-day trial. Seven memory types including voice, printable yearbooks, Time Capsules on Unlimited only. Age rating 13+ (R1 said family apps are 4+ or 9+) [F] | D38 |
| Apple Journal | Optional lock; audio with transcription | Listing still says voice is transcribed automatically; app language English; label "not linked to you" (device ID, product interaction). No version or date visible [F] | D39 |

Not re-checked: Huckleberry, Notabli, Dujour Baby, Babble, Tell Me Your Story, Life Lessons (page failed), Chapter One, Artifact, Lifecake, CocoBaby, Rosebud, Calm.

## 3. New entrants (not in R1; Tiny Voices, Heirloom4Life and Airloom are already in `research/competitors/us.md`)

| Name | What it is | Price and traction | Voice, privacy, languages | Source |
|---|---|---|---|---|
| Early Chapters (Hidden Link Studios) | "Private Baby & Family Album": photos and videos auto-sorted into monthly chapters, milestones, video messages for the baby, family invites, comments, Face ID. Name is close to ours | Premium $5.99/mo, $55.99/yr, lifetime $249.99 in IAP vs $199 in description (conflict). 5.0 (4). v1.2.0 (May 9). Free tier 1 baby, 20 memories a month [F] | Video and photo, audio data in label (linked). English only [F] | D35 |
| Forthword (KI CHOI; listing also uses "Airloom") | Journal for parents to write a child's life story, scheduled letters for future milestones, family contributions, printed book export | Pro $4.99/mo, $34.99/yr, $99.99 lifetime; 10 free entries. 5.0 (1). v1.1.0 (Apr 7) [F] | Voice recordings are a paid feature. English only [F] | D32 |
| Vellum: Time Capsule | Audio and video capsules with an opening date from one month to 25 years; sent via link; stored in the user's iCloud | Written capsules $0.99; video packs $12.99 to $149.99. No rating yet. v1.1.1 (Jul 1); first release May 29 [F] | "Data Not Collected"; English plus 23 other languages listed, including Arabic [F] | D36 |
| Little Echo: Kids Voice Diary (JudeWorks) | Child voice diary, daily prompts, hands-free auto-recording, no account, parental gate | $0.99 and $2.99 IAP (description says $1.99/mo; conflict). No rating yet. v1.3; 1.0 dated 2025-12-16 [F] | "Data Not Collected"; English [F] | D37 |
| Aurloom - Audio Archive | Voice archive paired with same-day photos; speaker labels; searchable transcripts that jump to the audio; imports voicemails; local-first .m4a | $2.99/mo or $19.99/yr, 1-month trial. 5.0 (7). v1.7 (Sep 12), v1.0 May 15. Needs iOS 26 [F] | Label: purchases and usage only; English [F] | D34 |
| Little Moments Parenting Journey | Pregnancy to school age tracker with "Letters to My Child" exported as PDF and voice input in every field | From GBP 3.99/mo. Web and Android per maker. Product Hunt page; launch date not stated, roughly five months before capture [F] | Languages not stated [F] | D33 |
| Sommos (Baltimore startup) | AI voice app for family archives: reflection after each entry, flags when a relative is mentioned | Raised $370,000; beta with about 50 people planned June 2026 [S] | Languages and privacy not stated [S] | D42 |
| Kindred Tales | Weekly-prompt family story service with an AI version that adds transcription, light editing, an optional first draft and a follow-up chatbot | Share choosing AI rose from just over half to 80% after 2025, per founder [S]. I could not open its own site or pricing | Not verified | D41 |
| Voice Memo Diary - 60 Sec | 60-second voice diary with mood tags, calendar, transcripts on Pro | $8.99 (Pro). 5.0 (1). v2026.5.1 (Oct 18). 38 languages listed. Not child-focused, so low relevance [F] | Label claims diagnostics only; description says no data collection [F] | D40 |

Also seen in search results but not opened, so not counted: Quiet Bloom, EverVoiceAI, Eternem Time Capsule, cribro journal, jojo days (Product Hunt and App Store search hits only).

**Read of the entrant wave.** Four of nine use sealed or scheduled delivery as the hook (Vellum, Forthword, Then, Tiny Treasures). Two ship free tiers with no tracking declared (Vellum, Little Echo). None claims faithful words. Early Chapters is the naming conflict to take to counsel or the founder; I did not assess trademark.

## 4. Platform and policy changes

| Area | Finding | Label | Source |
|---|---|---|---|
| SpeechTranscriber languages | Apple's class page still gives no locale list; apps must query `supportedLocales`. Apple's "Speech updates" page lists only June 2026 changes, about file and capture audio input providers and a buffer converter. I found no entry adding languages | [F] | D28, D29 |
| Arabic | Apple staff, Jan 2026: Arabic was listed in error and not supported. Apr 2026 poster: `supportedLocale` unreliable across betas for more than Arabic; test each locale | [S] (Apple staff post) | D30 |
| Custom vocabulary | Apple staff reply in the technical-terms thread: contextual strings work with DictationTranscriber, not SpeechTranscriber. Still no sign of change | [S] | D31 |
| iOS 27 dictation vs speech | Feature page: Dictation lists Hindi (India) and Arabic (Saudi Arabia, UAE). On-device dictation lists Arabic but not Hindi, and lists Mandarin (China mainland) and Portuguese (Brazil) only. Voice Memos transcription has no section on the page; page has no date or changelog. This is keyboard dictation, not the SpeechAnalyzer API | [F] | D43 |
| Independent accuracy test | A developer comparison (14 Jul 2026, English LibriSpeech only) found SpeechAnalyzer at 2.12% word error on clear clips vs 3.74% for Whisper Small. English only; says nothing about Hindi or Arabic | [F] | D44 |
| WWDC26 | The featured sessions page lists Foundation Models sessions; I found none on Speech. A forum post (Jun 2026) asked about native diarization in "27" and had no replies. Our NFR already forbids diarization | [F]/[S] | D45, D46 |
| App Review, 16 Oct 2026 | Changes to 1.2 (AI-generated intimate imagery), new 2.3.14 (creative assets), new 2.5.19 (hidden or dormant features), 3.1.1(a) edit, Section 5 child-exploitation line. No subscription or voice changes | [F] | D26, D27 |
| App Review, 13 Nov 2025 | 5.1.2(i): disclose and get explicit permission before sharing personal data with third parties including third-party AI. 1.2.1(a) and 4.7.5: age-restriction mechanisms for creator and non-embedded software apps | [F] | D26 |
| Age rating | Questionnaire asks about "social media capabilities" (July 9 item); answers required for new apps and updates from Sep 2026. Time Allowances let parents limit Entertainment, Games and Social Media apps. Age-rating changes for Australia, Vietnam (Jun 18) and South Korea (Oct 2026) | [F] | D47, D26 |
| Declared Age Range | Feb 2026 update: signals on whether age assurance applies, a "Significant Update Action", Brazil method signal. Utah applies to new accounts from May 6, Louisiana from Jul 1 (secondary report). Developer news cites Texas SB 2420 effective Jun 4, 2026 | [F] | D48, D26 |
| Subscriptions | 22 Oct: multiseat purchasing for businesses and schools on by default; Group Purchases expected this winter. 16 Sep: Bundles and Suites for iOS 27, StoreKit 2. 27 Apr: 12-month-commitment monthly plans outside US and Singapore. Nothing on Family Sharing | [F] | D27 |
| iOS 27 SDK | Apps must be built with the iOS 27 SDK from April 2027; submissions for iOS 27 opened 9 Sep 2026 | [F] | D47 |
| Google and others | Not covered: no Android or Play policy source was opened. From, Mama and Sproutbook already list Google Play. Our Android is v1.1 (F36) | Unverified | n/a |

**What this means for the PRD (recommendations, [R]):** keep Hindi and Arabic on non-Apple models and gate each language by a test transcription; fix the 2.3.1 citation to 2.5.19; answer the new age-rating questionnaire item deliberately (co-parent sharing is not a feed, but the answer is ours to record); if F35 ships, build the 5.1.2(i) consent screen first.

## 5. Feature gaps, ranked

Ranking weighs how many competitors ship it and how much evidence there is that it works. "Ours" is from `05-feature-map.md`.

| Rank | Feature competitors ship | Who | Evidence it works | Ours |
|---|---|---|---|---|
| 1 | **Printed memory books**, with audio links where offered | Remento (QR to audio), Qeepsake (credits), Chatbooks, Dearest Plus, Forthword, The Days We Keep yearbooks | Strongest. Remento 4.8 across 1,748 Trustpilot reviews, with praise for the finished book and complaints about spine, shipping damage, widow lines [S] D22. Qeepsake Trustpilot 3.0 with Aug 2026 complaint about a $61.99 credit forcing a second book [S] D19. Print cost is the recurring pain | F42, later; PRD forbids promising print |
| 2 | **Family engagement loop**: alerts when someone adds, hearts, comments, weekly email recap | FirstChapter 1.0.6, Early Chapters 1.1.0, From, Mama Village, Tinybeans, Qeepsake contributors | Mixed. Tinybeans 4.9 (104K) shows the model works for photos [F] D7. For voice products only ratings of 7 or fewer. A Tiny Voices share-link error was reported in reviews and the developer said it was fixed [F] D49 | F32 and F37, v1.1 |
| 3 | **Capture by relatives without the app**: phone line, voicemail landing, texted link, landline recording | Tiny Treasures phone line; Storyworth phone with transcription; Remento link | Moderate. A Storyworth reviewer (19 Oct 2026) praised speech-to-text for an elderly parent [S] D25. Remento collaborators still struggle with the site [S] D22. Tiny Treasures is 5.0 from 7 | F37 web page, v1.1 |
| 4 | **Sealed or scheduled letters** | Dearest Plus, Tiny Treasures, Forthword, Vellum (1 month to 25 years), Then | Weak. Every product is new and under 10 ratings | F41, later |
| 5 | **Capture surfaces**: CarPlay, Apple Watch, widgets | Tiny Treasures CarPlay (iOS 26.4+), Day One Watch, Dearest and Huckleberry widgets | Day One 4.8 (119K) is a proof of Watch demand, though its 2026.22 fix shows empty recordings happened [F] D9. CarPlay is unproven (5.0 from 7) | Widget cut from v1.0; no Watch or CarPlay |
| 6 | **Import existing audio** (voicemails, files, original dates) | Dearest (free tier), Aurloom | None beyond listings; no reviews mention it | Not in the feature map |
| 7 | **Search that jumps to the audio moment; speaker labels** | Aurloom, From, Mama keyword search, Sproutbook search | None beyond listings. Speaker labels conflict with our no-diarization rule | F09 search cut from v1.0 |
| 8 | **Legacy contact and app lock** | Dearest Plus (legacy contact, Face ID), Early Chapters (Face ID), Apple Journal lock | None beyond listings | App lock cut from v1.0 (WP-F17-08); no legacy contact |

**Shipped by competitors but deliberately not ranked:** AI interviewer or conversational follow-up (Kindred Tales' chatbot, Day One Daily Chat on Gold, Heirloom4Life per `research/competitors/us.md`). A founder says AI use grew to 80% of Kindred Tales customers [S] D41, which is a company claim. It conflicts with the faithful-words rule unless it only asks questions and never writes.

## 6. What I could not verify

- **Remento pricing page** (remento.co/pricing) failed at the site. Pricing came from the home page and FAQ instead.
- **Tinybeans pricing page** (tinybeans.com/pricing) failed at the site. Tinybeans plans come from the App Store summary only.
- **Apple iOS 27 landing page**, a third-party iOS 27 release-date article (letsdatascience) and a second (propakistani) failed at the site. I therefore have no opened source for the public iOS 27 release date. Apple's developer news only says iOS 27 submissions opened 9 Sep 2026.
- **Apple Newsroom index** returned an empty shell.
- **Life Lessons** listing (appshunter) failed; no update on it.
- **Official SpeechAnalyzer locale list** for iOS 27. None exists on the pages I opened. Device test still needed.
- **Hindi in SpeechTranscriber**: no source found either way for iOS 27. On-device dictation does not list Hindi on Apple's feature page [F] D43.
- **Apple Journal and Voice Memos in iOS 27**: no opened source on changes.
- **Qeepsake "Plus"**: still only in the IAP list; plan contents unknown.
- **Day One tracking label**: summary showed none today; R1 recorded tracking. Cannot tell if it changed.
- **Dearest printing**: App Store vs website still conflict.
- **FirstChapter 1.0.6 notes**: two summaries disagree.
- **Chatbooks prices**, **Artifact**, **Lifecake**, **CocoBaby**, **Huckleberry**, **Notabli**: not re-checked.
- **Reviews on Reddit and App Store review pages**: not attempted. Trustpilot is the only review data I opened (Remento, Qeepsake, Storyworth).
- **Kindred Tales' own site and prices**: not opened (search results were only directory listings).
- **Google Play and Android policy**: not covered.
- **Dates without a year**: many App Store entries. Years are inferred only where a copyright line or paired date supports them.
- **Early Chapters trademark risk**: not assessed.

## 7. Sources (all opened 28 Oct 2026, through summarising fetch unless noted)

Apps and company pages
- D1 Tiny Treasures: Voice Capsule, App Store: https://apps.apple.com/us/app/id6788518267
- D2 From, Mama, App Store: https://apps.apple.com/us/app/id6760956480
- D3 FirstChapter, App Store: https://apps.apple.com/us/app/firstchapter-ai-baby-journal/id6760676959
- D4 Dearest, App Store: https://apps.apple.com/us/app/dearest-letters-memories/id6790823627
- D5 Qeepsake, App Store: https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787
- D6 Qeepsake pricing: https://qeepsake.com/pricing/
- D7 Tinybeans, App Store: https://apps.apple.com/us/app/tinybeans-private-family-album/id521633042
- D8 Sproutbook, App Store: https://apps.apple.com/us/app/id6751468842
- D9 Day One, App Store: https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788
- D10 Remento home page: https://www.remento.co/
- D11 Storyworth pricing: https://welcome.storyworth.com/storyworth-pricing
- D12 BabyPage, App Store: https://apps.apple.com/us/app/babypage-baby-book-journal/id1362796822
- D13 Dearest website: https://dearestapp.com/
- D14 From, Mama website: http://frommama.com
- D15 Sproutbook website: https://sproutbook.app/
- D16 StoryCorps, App Store: https://apps.apple.com/us/app/storycorps/id359071069
- D17 23snaps, App Store: https://apps.apple.com/us/app/23snaps-private-family-album/id526481189
- D17b Nostalgia, App Store: https://apps.apple.com/us/app/-/id6746683642
- D18 Chatbooks, App Store: https://apps.apple.com/us/app/-/id734887606
- D19 Qeepsake on Trustpilot: https://www.trustpilot.com/review/qeepsake.com
- D20 Qeepsake help, Qeepsake and Tinybeans: https://help.qeepsake.com/article/115-what-does-qeepsake-tinybeans-mean-for-me
- D21 Day One plans: https://dayoneapp.com/plans/
- D22 Remento on Trustpilot: https://www.trustpilot.com/review/remento.co
- D23 Remento FAQ: https://www.remento.co/faq
- D24 Remento help, iPhone app: https://help.remento.co/en/articles/9052410-can-i-use-the-remento-iphone-app-to-create-my-remento-book
- D25 Storyworth on Trustpilot: https://www.trustpilot.com/review/storyworth.com

Apple platform and policy
- D26 Apple Developer News, App Review Guidelines items: https://developer.apple.com/news/?id=guidelines
- D27 Apple Developer News index (Sep and Oct 2026 items, including Oct 16 and Oct 22 posts): https://developer.apple.com/news/ and https://developer.apple.com/news/?id=oct16-guidelines
- D28 Apple, Speech framework docs: https://developer.apple.com/tutorials/data/documentation/speech.md
- D29 Apple, Speech updates and SpeechTranscriber docs: https://developer.apple.com/tutorials/data/documentation/Updates/Speech.md and https://developer.apple.com/tutorials/data/documentation/Speech/SpeechTranscriber.md
- D30 Apple Developer Forums, SpeechAnalyzer asset errors: https://developer.apple.com/forums/thread/797835
- D31 Apple Developer Forums, technical terms: https://developer.apple.com/forums/thread/801877
- D43 Apple, iOS and iPadOS 27 feature availability: https://www.apple.com/ios/feature-availability/
- D44 Gigazine, SpeechAnalyzer benchmark (14 Jul 2026): https://www.gigazine.net/gsc_news/en/20260714-apple-speech-analyzer-benchmark/
- D45 Apple, WWDC26 videos index: https://developer.apple.com/videos/play/wwdc2026/
- D46 Apple Developer Forums, native diarization: https://developer.apple.com/forums/thread/829621
- D47 Apple Developer News, age ratings and iOS 27 submissions: https://developer.apple.com/news/?id=sep9-appsubmissions
- D48 Biometric Update, Declared Age Range update (25 Feb 2026, secondary report): https://www.biometricupdate.com/202602/apple-updates-declared-age-range-api-for-national-state-level-age-assurance-laws
- D39 Apple Journal, App Store: https://apps.apple.com/us/app/journal/id6447391597

New entrants
- D32 Forthword, App Store: https://apps.apple.com/app/forthword/id6760955024
- D33 Little Moments Parenting Journey, Product Hunt: https://www.producthunt.com/products/little-moments-parenting-journey
- D34 Aurloom - Audio Archive, App Store: https://apps.apple.com/app/id6762100529
- D35 Early Chapters, App Store: https://apps.apple.com/us/app/id6759982031
- D36 Vellum: Time Capsule, App Store: https://apps.apple.com/app/id6768291137
- D37 Little Echo: Kids Voice Diary, App Store: https://apps.apple.com/ca/app/little-echo/id6753202417
- D38 The Days We Keep, App Store: https://apps.apple.com/app/id6755585543
- D40 Voice Memo Diary - 60 Sec, App Store: https://apps.apple.com/us/app/id6759174302
- D41 Fortune, Remento and Kindred Tales (25 Apr 2026): https://fortune.com/2026/04/25/mark-cuban-shark-tank-remento-saving-memories-elderly-relatives-ai-startups-kindred-tales/
- D42 Technical.ly, Sommos (10 Jun 2026): https://technical.ly/entrepreneurship/sommos-ai-family-archive/
- D49 Tiny Voices, App Store: https://apps.apple.com/us/app/-/id6759920530
- D50 Then: Voice Time Capsule, Product Hunt (launch 14 May 2026): https://www.producthunt.com/products/then-voice-time-capsule/launches/then-voice-time-capsule

Fetch attempts that failed (no content retrieved): https://www.remento.co/pricing ; https://tinybeans.com/pricing ; https://www.apple.com/ios/ios-27/ ; https://letsdatascience.com/news/apple-releases-ios-27-with-siri-ai-8b44349e ; https://propakistani.pk/2026/09/10/apple-confirms-ios-27-release-date-for-eligible-iphones/ ; https://appshunter.io/ios/app/life-lessons-family-wisdom/id6761279262 ; https://developer.apple.com/documentation/speech/speechtranscriber (JavaScript wall; used the .md route instead). Apple Newsroom index returned only an empty shell.
