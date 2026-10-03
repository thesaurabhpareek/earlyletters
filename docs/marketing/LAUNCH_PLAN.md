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

## 4. Channels a solo founder can run

Constraints that shape this list: the founder has 15 to 20 hours a week for everything (ROADMAP assumption), and marketing should take no more than about 2 of them until week 14 and about 6 in launch week (E). No money is spent on acquisition. Paid marketing and a public TestFlight link are both triggers for the penetration test (ROADMAP 6 item 9) and for forming an entity (D-004 point 3), so neither is in this plan. Agents draft; only the founder sends, posts or submits.

| Priority | Channel | What happens | Founder time (E) | When | Notes |
|---|---|---|---|---|---|
| 1 | **App Store product page and search** | Name, subtitle, keywords, six screenshots, description, promotional text | 3 h total to review and enter | Drafts weeks 1 to 9, final week 14 | Most parents will meet us here first. Brief in standing duty 2, keywords in duty 4. Section 6 |
| 2 | **Apple featuring nomination (App Launch)** | One nomination in App Store Connect describing the launch and its window | 1 h | Week 4, after the app record exists (BL-103, week 3) | Apple asks for at least two weeks' notice and recommends up to three months ahead [M7]; the help page asks for a minimum of three weeks [M8]. Week 4 is about 12 weeks before release. Update it if the date moves. Free; no promise of being featured |
| 3 | **earlyletters.com waitlist** | The website thread's "tell me when it's ready" form; at release the page swaps to the App Store badge when `NEXT_PUBLIC_APP_STORE_URL` is set (`apps/web/src/lib/launch.ts` on `feat/web-scroll-film`) | 0 h until launch | Live when the website thread ships it (date U) | Marketing writes no website copy here; that thread owns it. Ask: put an App Store campaign link on the badge (section 8) |
| 4 | **One launch email to the waitlist** | A single email on release day saying the app is out, with the App Store link | 1 h to approve and send | Launch day | Commercial email under CAN-SPAM, so it needs an unsubscribe and a postal address (LEGAL-REQ-053, CR-060); D-004 says use a mailing address that is not the family home. The waitlist's stated purpose is "launch notice" (`data-policy.md`), so one email fits it. No second email without `legal` |
| 5 | **The founder's own network** | Personal messages to friends and colleagues with babies or expecting; the source of C1 beta families and of the first launch-week installs | 2 h for beta recruitment (weeks 6 to 7), 2 h at launch | Weeks 6 to 7, launch week | Agents draft templates; the founder personalises and sends. Never ask relatives or friends for App Store reviews (section 5.4) |
| 6 | **Co-parent invite (in the product)** | Every first parent can invite the other parent to the same book | 0 h | From release | The only built-in growth loop at v1.0. Invite copy lives in `packages/content`; measure acceptance on the server (section 8) |
| 7 | **Parent communities, carefully** | Read and learn first. Where a community's own rules allow it, the founder may post once as the maker, plainly disclosed | 1 h a week, optional | After release | Each community's self-promotion rules not checked (U). Never post on someone else's behalf, never seed fake accounts, never use a beta family's words |
| 8 | **Custom product pages for language communities** | Extra product pages with a Spanish or Hindi letter in screenshot 1, reached by their own URL [M12] | 2 h once screenshots exist | Launch week plus 2 to 3 | Up to 70 pages; screenshots, promotional text and previews can vary, and keywords can be assigned [M12]. The app interface stays English, so the page must say so (A) |

**Not at launch, and why:**
- **Apple Ads or any paid placement:** spend, plus the pen-test and entity triggers above.
- **Social accounts and short video:** `docs/design/CREATIVE.md` asks for real families with image and voice releases and a commissioned crew. None are cast. Customer letters are never marketing (CREATIVE.md consent rules). Revisit for v1.1.
- **Press and newsletter pitches:** low expected return for a v1.0 with no reviews yet (A). A short press note can be drafted for v1.1, when grandparents can write, which is the bigger story.
- **Pre-orders:** brand-new apps can open pre-orders 2 to 180 days before release, and pre-ordered apps download automatically on release day [M9]. With submission on 11 Jan and release about a week later, a pre-order adds little (A); not planned.
- **Grandparent gift campaign:** gifts are not in v1.0.

---

## 5. TestFlight beta (C0 and C1)

The beta is on TestFlight and only on TestFlight. The store listing, promotional text, screenshots and keywords never say beta, early access or preview (brief decision 10; App Review 2.2: "Demos, betas, and trial versions of your app don't belong on the App Store - use TestFlight instead" [M4]). Inside the app, the quiet "early version, can make mistakes" note stays.

### 5.1 Cohorts (from ROADMAP M12, D-045, TDD 07 section 11)

| Cohort | Who | Size | Dates | How they join |
|---|---|---|---|---|
| C0 internal | The founder's own household and anyone on the team | Up to 10 | From week 6 (9 Nov) | Internal testers, no Beta App Review |
| C1 friendly families | Families from the founder's network, chosen for coverage | 15 to 25 families | Build to Beta App Review by Fri 11 Dec; runs 14 Dec to 8 Jan | TestFlight **email invitation** [M16], not a public link |
| C2 public link | Not planned | 0 | n/a | A public link triggers the pen test (ROADMAP 6 item 9) and the entity recommendation (D-004). D-045 makes C2 optional and after submission; this plan recommends skipping it |

TestFlight facts that matter here: up to 10,000 external testers; each build can be tested for up to 90 days; the first build added to an external group goes to App Review; testers install through the TestFlight app [M16]. A C1 build approved around 14 Dec stays testable until about mid-March (E from the 90-day rule).

### 5.2 Who to recruit (BL-109)

BL-109's coverage list comes from TDD 07 and still asks for "three grandparents in the app". Under brief decision 5, family members other than the co-parent cannot write in v1.0, so that slot has nothing to test. Proposed coverage for `product` and QA to confirm:

- at least 2 co-parent pairs (both parents active in one book);
- speakers of at least 3 of the 7 v1.0 languages other than English, with Hindi and Spanish first (largest US communities among the seven, [M2] and [S13 in USER_RESEARCH]), plus Arabic for right-to-left;
- 1 twins or multiples family;
- 2 VoiceOver or large-text users;
- a mix of expecting and new parents (child 0 to 2), and at least one parent who already writes or records to their child (segment B).

Everyone is 18 or older and passes the in-app 18+ gate (D-006, TDD 07 section 11).

### 5.3 How recruitment works (drafted in standing duty 5)

1. **Weeks 6 to 7:** the founder sends a short personal message to people the founder already knows. Drafts: a two-paragraph invitation, a five-question screening form (phone model, languages spoken at home, child's age band, co-parent willing to join, accessibility settings in use), and a plain consent note. The form never asks for the child's name or birth date.
2. **Week 9 (by 4 Dec, D-045):** pick 20 to 30 families to land 15 to 25 active ones (E: assumes some never install).
3. **Week 10:** welcome note (BL-280) with three things marketing cares about: do not screenshot letters (TestFlight screenshot feedback can capture letter text, TDD 07 11.2); use "Report a problem" instead; how to move to the App Store version without losing letters (QA to confirm the path; section 9 risk 11).
4. **Days 7 and 21 (21 Dec and 4 Jan):** the TDD 07 surveys. Marketing asks to add three content-free questions: "How would you describe Early Letters to a friend in one sentence?", "What almost stopped you trying it?", "What would you type into the App Store to find it?" Answers feed the listing and keyword research. No letter content is ever asked for.

### 5.4 What we never do with beta families

- **No compensation for testing**, including free Plus, gift cards or promised discounts: App Review 2.2 says TestFlight apps "cannot be distributed to testers in exchange for compensation of any kind" [M4]. Whether a thank-you offer code after launch [M13] is acceptable is a `legal` question; recruitment materials promise nothing.
- **No review requests.** Most C1 families will be the founder's friends or relatives. The FTC's rule on consumer reviews (effective 21 Oct 2024) bars soliciting reviews from immediate relatives or employees without clear disclosure of the relationship, and bars incentives conditioned on a positive review [M14] (secondary source). Apple warns that manipulating ratings can remove an app [M4]. Ratings come only from the system prompt inside the app (section 6.4).
- **No testimonials or quotes at launch** (BRAND.md proof discipline). If one is ever wanted, it needs written permission, the person's real words, and the relationship disclosed; `legal` approves.
- **No letters, voices, names or photos in any marketing.** Customer letters are never marketing (CREATIVE.md consent rules).

---

## 6. App Store product page plan

This section is the plan; the field-by-field brief and screenshot storyboard are standing duty 2. Final words belong in `packages/content/src/store.en.ts` through `content`, with claims approved by `legal` (LEGAL-REQ-044).

### 6.1 Fields

| Field | Limit [M3][M4] | Plan |
|---|---|---|
| App name | 30 characters | "Early Letters: Memory Book" (26), as BRAND.md sets it. "Memory Book" does the work the brand name cannot do alone in search [M17] |
| Subtitle | 30 characters | Keep the current direction, "Baby memory book in your voice" (30). Must not reference other apps or make unverifiable claims (2.3.7) |
| Promotional text | 170 characters; can change any time without a new version [M3] | Launch message at release; then rotate quietly. Never "beta" |
| Description | n/a | `store.en.ts` after the section 1.2 fixes; ends with the Terms, Privacy and Consumer Health Data links (`in-app-disclosures.md` section 4; CHD notice HN-6) |
| Keywords | 100 characters, commas, no spaces [M3] | Standing duty 4. No competitor names or other apps' names (2.3.7), no "kids" (2.3.8; compliance register row 8), no learning or health words (section 2.4) |
| Screenshots | First 1 to 3 show in search when there is no preview [M3] | Six, from CREATIVE.md section 4, revised for v1.0 (6.2) |
| App preview | Autoplays muted [M3] | Optional at v1.0. Needs a cast voice with a voice release (CREATIVE.md consent rules); skip rather than fake one |
| Category | n/a | Lifestyle (D-004: never Health and Fitness or Medical) |
| URLs | n/a | Marketing https://earlyletters.com, privacy https://earlyletters.com/privacy, support hello@earlyletters.com (brief decision 13) |
| Release option | n/a | **Manually release this version**, so the founder picks the launch day after approval; a released version can take up to 24 hours to appear [M10] |

### 6.2 Screenshot set, adjusted for v1.0

CREATIVE.md's six frames are the base. Changes the v1.0 scope forces (section 1.2):

| # | CREATIVE.md headline | Change for v1.0 |
|---|---|---|
| 1 | Exactly as you said it. | Use a single-language letter (English for the default page); the Hindi and English letter waits for v1.1 |
| 2 | Talk for a minute. | None |
| 3 | Read together, in their voice. | Show plain playback ("From Papa, Month 4" with the play control), no word highlight |
| 4 | From Nani, from Papa, from everyone. | Becomes the co-parent frame: two authors, one book. Grandparents return in v1.1 |
| 5 | Your words stay in the language you said them. | One letter in one of the seven languages (Devanagari or Spanish), not mixed |
| 6 | A book that grows month by month. | None ("Free PDF any time"; no print claim) |

Frames 1 to 3 carry the five-second test (section 2.2). All content uses the fictional family "Asha", never real families.

### 6.3 After launch

- **Product page optimisation:** up to three treatments of icon, screenshots or preview, for up to 90 days; treatments without new icons can go to review without a new app version [M11]. First test: screenshot 1 headline, once the page has enough traffic to read a result (threshold set with `analytics`).
- **Custom product pages** for language communities (section 4, channel 8) [M12].
- **Offer codes** exist for free or discounted subscription periods for new, existing or expired subscribers [M13]. No use planned at launch; any use goes through `legal` (section 5.4).

### 6.4 Ratings

The system review prompt appears at most three times in 365 days; Apple advises asking at the end of something the person completed, never at launch and never in response to a tap [M15]. App Review 3.2.2(x) forbids requiring a review to use the app [M4]. Proposed moment for `product` and `mobile`: after a parent plays back a letter they saved at least a week earlier, never during capture, never in the first week. If the app has no such hook at v1.0, launch without one.

---

## 11. Sources

All opened 3 Oct 2026 unless marked.

- [M1] CDC NCHS, Births: Provisional Data for 2025, Vital Statistics Rapid Release No. 43 (Apr 2026): https://www.cdc.gov/nchs/data/vsrr/vsrr043.pdf
- [M2] US Census Bureau, language spoken at home, ACS 2018 to 2022 5-year estimates (press release, Dec 2023): https://www.census.gov/newsroom/press-releases/2023/language-at-home-acs-5-year.html (opened via cdn.www.census.gov)
- [M3] Apple, Creating your product page: https://developer.apple.com/app-store/product-page/
- [M4] Apple, App Review Guidelines (2.2, 2.3.7, 2.3.8, 3.2.2(x), introduction on manipulating ratings): https://developer.apple.com/app-store/review/guidelines/
- [M7] Apple, Getting featured on the App Store (lead time: "a minimum of two weeks notice", "up to three months in advance"): https://developer.apple.com/app-store/getting-featured/
- [M8] Apple, Nominate your app for featuring (App Launch nomination type; "a minimum lead time of 3 weeks"): https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- [M9] Apple, Pre-orders (new apps: release 2 to 180 days after the pre-order is published; automatic download on release day): https://developer.apple.com/app-store/pre-orders/
- [M10] Apple, Select an App Store version release option (manual, automatic, scheduled; up to 24 hours to appear): https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option
- [M11] Apple, Product page optimization (up to three treatments, 90 days, review without a new version when no icon changes): https://developer.apple.com/app-store/product-page-optimization/
- [M12] Apple, Custom product pages (up to 70; screenshots, promotional text, previews; unique URLs; keywords can be assigned): https://developer.apple.com/app-store/custom-product-pages/
- [M13] Apple, Set up offer codes (free or discounted periods; new, existing or expired subscribers): https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-offer-codes/
- [M14] Goodwin Procter, FTC finalizes rule on consumer reviews and testimonials (Sep 2024; effective 21 Oct 2024). Secondary source; the rule text (16 CFR Part 465) was not opened: https://www.goodwinlaw.com/en/insights/publications/2024/09/alerts-practices-cldr-ftc-finalizes-rule-on-consumer-reviews
- [M15] Apple, Requesting App Store reviews (at most three prompts in 365 days; when to ask): https://developer.apple.com/documentation/storekit/requesting-app-store-reviews
- [M16] Apple, TestFlight overview (10,000 external testers, 90-day builds, first external build reviewed): https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/ and TestFlight (public links, email invitations, TestFlight app): https://developer.apple.com/testflight/
- [M17] Apple iTunes Search API, US storefront, run 3 Oct 2026. Query "early letters": the ten results were alphabet, phonics and letter-writing apps (for example Phonics Island, LipLetter Land Early Literacy, ABC Letter Tracing for Kids): https://itunes.apple.com/search?term=early+letters&entity=software&country=us . Query "baby memory book": Lifestyle apps led by The Short Years Baby Book (4,832 ratings), BabyPage (4,098), BackThen (28,915) and Qeepsake (14,632): https://itunes.apple.com/search?term=baby+memory+book&entity=software&country=us
- Internal: `docs/research/COMPETITIVE_RESEARCH.md` [S#], `docs/research/USER_RESEARCH.md` [S#], `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/agents/BRIEF-2026-10-03.md`, `docs/legal/compliance-register.md`, `docs/legal/privacy-policy.md`, `docs/analytics/TRACKING_PLAN.md`, `packages/content/VOICE.md`, `BRAND.md`, `src/store.en.ts`, `src/site.en.ts`, `docs/design/CREATIVE.md`.
