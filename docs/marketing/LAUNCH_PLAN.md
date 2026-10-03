# Launch plan: Early Letters to the App Store and the first six weeks

Owner: `marketing` (Growth and Marketing Lead). Status: draft 1, 3 Oct 2026. Drafts only: nothing here is posted, sent or published by an agent. Final product words belong in `packages/content` through `content`; claims go to `legal`.

Aligned to: `docs/ROADMAP.md` (submission Mon 11 Jan 2027, release target week of 18 Jan), `docs/BACKLOG.md` (BL-109, BL-280, BL-286), `docs/DECISIONS.md` (D-004, D-030, D-045), and the founder brief `docs/agents/BRIEF-2026-10-03.md`. Where the brief and the roadmap differ on scope, this plan follows the brief because it is the newer founder record (section 1).

Labels: **F** fact with a source in section 11; **E** estimate; **A** assumption to validate; **U** unverified. Sources [M#] are listed at the end; [S#] refer to `docs/research/COMPETITIVE_RESEARCH.md` or `USER_RESEARCH.md` as marked.

---

## 0. The plan on one page

- **Positioning:** letters a parent speaks to their child, in their own words and voice, kept exactly as said, in a book by month of age. The memory book you fill by talking.
- **Who first:** US expecting and new parents on iPhone, especially those already writing or recording to their child, and multilingual families who will speak in one of the seven v1.0 languages. The co-parent joins free.
- **How a solo founder reaches them without paid ads:** the App Store page and search, an Apple featuring nomination, the earlyletters.com waitlist with one launch email, the founder's own network, and the co-parent invite inside the product. No paid acquisition until the pen test and the entity question are settled (ROADMAP 6 item 9, D-004).
- **Beta:** TestFlight only. C0 from 9 Nov, C1 (15 to 25 families) from 14 Dec. The store listing never says beta (brief decision 10).
- **Biggest marketing risk right now:** shipped draft copy promises features the brief moved out of v1.0 (grandparents writing, hearing family voices, word highlighting, Hindi and English in one sentence, uploaded backup). Section 1.2 lists each line for `content` and `legal`.
- **Second risk:** searching "early letters" on the US App Store today returns alphabet and phonics apps [M17]. Every first contact pairs the name with "memory book".
- **Measure with what we are allowed to see:** App Store Connect and server counts for totals; device analytics only from people who opted in, always labelled as such.

---

## 1. What v1.0 is, for marketing purposes

### 1.1 Scope this plan markets

| Area | v1.0 (what we may say) | Not v1.0 (do not promise) | Source |
|---|---|---|---|
| Capture | Speak or type a letter; crash-safe capture; on-device transcription by default that only fixes slips; every change visible and undoable | Any rewriting, summarising or "story" mode, ever | CLAUDE.md constitution; brief 7 |
| Voice | The original recording stays with the letter and plays on the phone that made it | Family hearing each other's recordings; any audio upload | Brief 9 ("no audio upload in v1.0") |
| Read together | Playback of a letter in the author's voice | Word highlighting while it plays (v1.1) | Brief 9 |
| Family | Co-parent shares the book | Grandparents and other family writing; the web contribution page (later) | Brief 5 |
| Languages | Letters spoken in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese, each in its own script | Hindi and English in one sentence (v1.1); app interface in other languages | Brief 6, 9 |
| Book | Organised by month of age; free PDF and ZIP export, offline | Printed books | ROADMAP 5; K-32 |
| Sign-in | Apple, Google, email magic link | Passwords | Brief 4 |
| Plus | $3.99/month with a 1-month free trial, $29.99/year with a 2-month free trial, through Apple only; Family Sharing on | Lifetime, gifts | Brief 3; ROADMAP 6 |
| Privacy | Private by default; no ads; never sold; not used to train models (see the CN-7 condition in 1.2) | "End-to-end encrypted"; Vault mode | Brief 11; ROADMAP 5; privacy-policy CN-7 |
| Store | US storefront only, Lifestyle category, individual publisher | Other storefronts, Android | ROADMAP 7; compliance register |

**Roadmap versus brief.** `docs/ROADMAP.md` still plans family contributors (D-002), shared voice (D-032), word highlighting and Apple-plus-email sign-in (D-044). The brief of the same day narrows family to the co-parent, defers audio upload and highlighting, and adds Google sign-in. This plan uses the brief. `product` owns reconciling the roadmap; flagged in the PR.

### 1.2 Draft copy that over-claims against v1.0 (hand-off to `content` and `legal`)

None of these are mine to edit. Each needs a decision before the listing or the site goes live.

| # | Where | Current line (short) | Conflict | Suggested direction |
|---|---|---|---|---|
| 1 | `store.en.ts` description, "A BOOK FOR THE WHOLE FAMILY"; caption 4 "Grandparents can write too"; `site.en.ts` benefits 4, `family`, FAQ "Can grandparents add letters?" | Invite grandparents and close family to add letters | Brief 5: co-parent only at v1.0 | Co-parent framing for v1.0 ("Two parents, one book"); keep the grandparent lines for the v1.1 launch |
| 2 | `store.en.ts` "READ TOGETHER"; `site.en.ts` `readTogether`; CREATIVE.md screenshot 3 and the "Tuesday" preview | Plays "while the words appear on the page"; "highlight mid-sentence" | Brief 9: word highlighting is v1.1 | "Plays in the voice of the person who wrote it." No highlight in screenshots or preview |
| 3 | Caption 5 "Read together, in their voices"; `site.en.ts` privacy point 3 "Family can hear a recording once it is backed up" | Family hear each other | Brief 9: no audio upload, family do not hear each other's recordings in v1.0 | "Your voice stays with every letter" |
| 4 | `store.en.ts` "EVERY LANGUAGE, AS SPOKEN"; `site.en.ts` FAQ "Which languages?"; CREATIVE.md screenshot 1 (a Hindi and English letter) | "Hindi, English, both in one sentence, or any mix" | Brief 6 and 9: seven languages at v1.0; code-switching is v1.1 | Name the seven languages; screenshot 1 uses a single-language letter |
| 5 | `store.en.ts` "YOUR VOICE, KEPT"; `site.en.ts` privacy point 4, FAQ "What happens to my recordings?", FAQ cost line "Plus ... adds backup for every recording" | Optional encrypted backup, recovery key, "unless you choose Vault mode" | Brief 9 (no audio upload); ROADMAP 5 (Vault mode out of v1.0); D-033 (recordings are in the iPhone's own backup) | `product` confirms what backup means at v1.0; until then say "on your phone, and in your iPhone's own backup if you use one" (D-033 wording) |
| 6 | `store.en.ts` last description paragraph and `promotionalTextBeta` | "Early Letters is in beta..." | Brief 10: the store listing never says beta; App Review 2.2 [M4] | Remove both (the D-030 change set). The in-app "early version, can make mistakes" note stays |
| 7 | `store.en.ts` `whatsNewV1` | "invite family, read together" | Brief 5 | "invite your co-parent" |
| 8 | `site.en.ts` `gift` | "Give Early Letters" | Gifts are v1.1 or later (ROADMAP 6 item 6) | Hold until gifts exist |
| 9 | Privacy policy section 6, any "never used to train" line in marketing | Not used to train models | Privacy policy CN-7: launch gate until the sync vendor confirms no-training in writing | Use the line only after `legal` marks CN-7 closed. Content rules also ban the word "AI", so say "never used to train models" |
| 10 | `store.en.ts` keywords "grandparents", "milestones" | Search terms | "grandparents" promises scope (row 1); "milestones" reads as development tracking, which D-004 keeps out of metadata for the 5.1.1(ix) risk | Revisit in keyword research (standing duty 4) |

The website thread's storyboard (`docs/web/STORYBOARD.md` on `feat/web-scroll-film`) already matches v1.0 on two of these: scene S05 has no word highlight and scene S08 shows the seven languages one at a time.

---

## 2. Positioning

### 2.1 The line

**Early Letters, the baby memory book you fill by talking.** (BRAND.md naming system; used at every first contact.)

What sits under it, in plain words: a parent talks to their child for a minute, and it becomes a letter, in their own words and their own voice, kept exactly as they said it, filed under the child's month of age, for the child to read and hear for years.

Draft positioning statement for v1.0 (direction for `content`, not final words):

> For parents of babies and young children, Early Letters is the memory book you fill by talking. You speak a letter to your child in your own words, and it is kept exactly as you said it, with your voice, month by month, so {child} can read it and hear it for years. Unlike baby books with blanks to fill or journals that tidy your words, nothing is rewritten.

### 2.2 The five-second test

A parent who sees only the name, the subtitle and the first screenshot in search (the first one to three screenshots show in search results when there is no preview [M3]) should come away with three things:

1. It is for me, a parent, about my child (not an app for my child).
2. I talk, and it becomes a letter.
3. My words are kept as I said them, with my voice.

If a frame does not serve one of those three, it moves later in the set.

### 2.3 Why this position is open

- Competitors either rewrite (FirstChapter "talk for 30 seconds, get a beautiful journal entry", Sproutbook, Dujour) or treat the transcript as a side option (Remento) [S35][S9][S36][S25 in COMPETITIVE_RESEARCH]. Faithful words plus the kept voice, for a baby book, is unclaimed in the pages that research opened.
- Baby-journal leaders do not mention voice at all (Qeepsake, Tinybeans, BabyPage) [S1][S4][S31 in COMPETITIVE_RESEARCH].
- Parents already improvise this job: an email account for the child, letters to open at 18, voice memos, monthly videos to a future self [S25][S26][S30 in USER_RESEARCH].
- The closest threats are Dearest (letters, voice, iCloud only, $49.99 a year) and Apple Journal (free, built in, audio transcription) [S10][S11][S16 in COMPETITIVE_RESEARCH]. Our answer to both is the child's book by month of age, the co-parent in the same book, and the visible "nothing rewritten" promise.

Store metadata never names a competitor: App Review 2.3.7 bars subtitles that reference other apps, and packing metadata with other app names [M4].

### 2.4 Words

| Lean on | Avoid | Why |
|---|---|---|
| letter, note, talk, say, tell {child} | alphabet, ABC, phonics, early learning, literacy, learn letters, reading skills | The name already collides with early-learning apps in search [M17]; any of these words confirms the wrong reading |
| your words, your voice, exactly as you said it | AI, smart, magic, generate, polish, perfect, enhance, "AI-written", summary, "turns it into a story" | The constitution; `packages/content/test/rules.test.ts` bans these in product copy |
| kept, keep, for years, again and again, read together | legacy, memorial, "when I'm gone", "before it's too late", "lost forever", "never get back" | VOICE.md legacy and no-guilt rules; the content test's fear list |
| a minute is plenty, whenever you like, not much today | streak, daily habit, "don't miss", "you haven't written" | No-guilt rule; USER_RESEARCH R9 |
| for parents, for families | "for kids", "for children" | App Review 2.3.8 reserves these for the Kids Category [M4]; our users are adults (D-006) |
| month by month, memory book | development tracking, milestones tracker, growth, health | D-004: no health language in metadata (5.1.1(ix) risk) |
| private by default, no ads, never sold | "military-grade", "end-to-end encrypted", fear of data breaches | Brief 11: calm, never fearful; compliance register claims audit |
| (nothing) | beta, early access, preview, in any store field | Brief 10; App Review 2.2 [M4] |
| (nothing) | best, number one, loved by thousands, reviews, ratings | BRAND.md proof discipline; we have none |

---

## 3. Audiences

### 3.1 Who we talk to at launch

| # | Segment | Evidence | What they need to hear | v1.0 fit |
|---|---|---|---|---|
| A | **Expecting and new parents in the US on iPhone, child 0 to 2** | 3,606,400 US births in 2025, provisional, down 1% from 2024 [M1] (F). That is an upper bound on new-parent households a year before iPhone share and intent (E). Baby books start in a burst and stop within weeks; the gap brings guilt [S24][S25][S26 in USER_RESEARCH] | "A minute is plenty." "Talk to {child} about today." No catching up | Core |
| B | **Parents already writing or recording to their child** | Child email accounts handed over at 18, sealed birthday letters, monthly videos to a future self, Voice Memos of babble [S25][S26][S30][S30b in USER_RESEARCH] (S) | "You already do this. Now it lives in one book, by month, in your voice" | Highest intent |
| C | **Multilingual families** speaking one of the seven v1.0 languages | 21.7% of US residents aged 5 and over speak a language other than English at home; 61.1% of those speak Spanish and 5.1% Chinese (ACS 2018 to 2022) [M2] (F). 72% of Indian Americans aged 5 and over speak a language other than English at home [S13 in USER_RESEARCH] (F) | "Say it in your language. It stays in the language you said it." | Strong, with limits: the app interface is English; one language per letter until v1.1 (A) |
| D | **Fathers** | Often write letters or record videos to the future child rather than fill baby books [S25][S30 in USER_RESEARCH] (S) | "Tell {child} about today, in your own words" | Good (no separate creative; it is the same promise) |
| E | **The co-parent** | Records split across two phones [S3x in USER_RESEARCH] (A) | "One book, both of you" | The one in-product growth loop at v1.0 |

### 3.2 Who we do not target at v1.0

- **Grandparents and other family as writers or gift buyers.** Strong research case [S15][S17 in USER_RESEARCH], but writing is not in v1.0 (brief 5) and gifts are later. They become the v1.1 launch story (section 7, post-launch).
- **Children.** The app is 18+ (D-006). No creative, keyword or placement aimed at children.
- **Anyone outside the US storefront** (compliance register launch-geography recommendation), and Android users (later).

---

## 11. Sources

All opened 3 Oct 2026 unless marked.

- [M1] CDC NCHS, Births: Provisional Data for 2025, Vital Statistics Rapid Release No. 43 (Apr 2026): https://www.cdc.gov/nchs/data/vsrr/vsrr043.pdf
- [M2] US Census Bureau, language spoken at home, ACS 2018 to 2022 5-year estimates (press release, Dec 2023): https://www.census.gov/newsroom/press-releases/2023/language-at-home-acs-5-year.html (opened via cdn.www.census.gov)
- [M3] Apple, Creating your product page: https://developer.apple.com/app-store/product-page/
- [M4] Apple, App Review Guidelines (2.2, 2.3.7, 2.3.8, 3.2.2(x), introduction on manipulating ratings): https://developer.apple.com/app-store/review/guidelines/
- [M17] Apple iTunes Search API, US storefront, run 3 Oct 2026. Query "early letters": the ten results were alphabet, phonics and letter-writing apps (for example Phonics Island, LipLetter Land Early Literacy, ABC Letter Tracing for Kids): https://itunes.apple.com/search?term=early+letters&entity=software&country=us . Query "baby memory book": Lifestyle apps led by The Short Years Baby Book (4,832 ratings), BabyPage (4,098), BackThen (28,915) and Qeepsake (14,632): https://itunes.apple.com/search?term=baby+memory+book&entity=software&country=us
- Internal: `docs/research/COMPETITIVE_RESEARCH.md` [S#], `docs/research/USER_RESEARCH.md` [S#], `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/agents/BRIEF-2026-10-03.md`, `docs/legal/compliance-register.md`, `docs/legal/privacy-policy.md`, `docs/analytics/TRACKING_PLAN.md`, `packages/content/VOICE.md`, `BRAND.md`, `src/store.en.ts`, `src/site.en.ts`, `docs/design/CREATIVE.md`.
