# R2 Customer evidence

| | |
|---|---|
| Status | Desk research, 3 Oct 2026. No primary interviews. |
| Extends | `docs/research/USER_RESEARCH.md` (UR, 1 Oct 2026) and `docs/research/COMPETITIVE_RESEARCH.md` (CR). Does not redo them. |
| Labels | **[F]** fact with a source. **[S]** signal (reviews, posts, anecdote), sourced. **[A]** assumption, ours, with how to validate. **[R]** recommendation. **Inferred** marks a conclusion we drew from the data. **Unverified** marks anything we could not open or confirm today. |
| Source ids | `R2-S#` (this file, all opened 3 Oct 2026), `UR S#`, `CR S#`. |

## 0. Bottom line

1. **Reliability (bugs, sync and lost work) is the most common complaint, ahead of price.** In 104 negative or mixed reviews across 11 memory and journal products, 41 (39%) are about bugs, crashes, sync or lost entries; 21 (20%) are about price or paywalls. 9 reviews describe entries or work that vanished [S, section 2]. This ranks reliability above money, which UR did not (UR ranked billing first). Capture and sync specs need autosave, undo and never-lose guarantees with numbers.
2. **Privacy is the main reason people choose a family memory app.** 29 of 80 positive reviews (36%) of the six baby memory apps name privacy or keeping the child off social media [S]. Two reviews describe privacy failures: a journal passcode bypassed through system search, and family-only photos seen by the wrong people [S]. F17 must cover Spotlight, widgets and notification previews, not only an app lock.
3. **Charging for what used to be free gets an angry review every time.** All 10 reviews about a new paywall on existing features or content are negative, across 6 products [S]. Hidden fees (backdating, export, shipping) and hard cancellation add 4 more [S]. This confirms UR R15.
4. **Prompts are the top praised feature of prompted baby books; repetition is the top prompt complaint.** 27 reviews praise prompts and reminders and 4 complain they repeat or do not fit the child's age, all at Qeepsake [S]. Too many reminders across text, email and push draws 5 more complaints [S]. Confirms UR section 3.
5. **Voice is what reviewers of voice products love, and some of them like AI polish.** 11 of 64 Remento reviews name hearing the person's voice or face as the point [S]. In the same sample 2 praise AI rewrites of their stories and 1 was surprised that AI changed spoken words [S]. A share of buyers wants polish. Our never-rewrite rule (B5) is a choice with a cost, not a free win.
6. **Order by the moment, not the upload.** All 6 reviews about chronology are complaints: feeds out of order, hard to add missed days, and a fee to backdate [S]. Three Reddit comments, posted within one minute and likely by one person, say a printed memory book left blank pages where prompts were removed [S]. F09 and F15 need event-date ordering, free backdating and no blank pages.
7. **Grandparents seeing the baby is the second most common praise for photo-album apps, after privacy.** 30 positive reviews across 10 products credit sharing with distant family [S]. At v1.0 only the co-parent can read the book (B1). Parents who arrive from Tinybeans or 23snaps may expect grandparents on day one [A, validate in Study 3].
8. **Many multilingual families have one parent who does not speak the heritage language.** Among US Latino parents, 92% with a Latino partner speak Spanish to their children versus 55% with a non-Latino partner (2015) [F R2-S31]. Spanish ability drops to 34% by the third generation (2022) [F R2-S32]. Inferred: P2 often cannot read P4's letters, which F10 and F11 must handle.
9. **Parents have about 3 hours of leisure a day; the evidence that a recorded parent's voice soothes a child is about live voice.** Adults whose youngest child is under 6 average 3.2 hours of leisure per day versus 5.6 without children (2024) [F R2-S25]. The best study we opened shows a mother's live voice by phone lowered stress hormones in 61 girls aged 7 to 12 [F R2-S24]. No study we opened tests a recorded voice. Product copy must not claim a calming or developmental effect.
10. **Sample frames are weaker than UR's.** Apple's review RSS feed and Reddit search were refused today (robots.txt and rate limits). We coded 287 unique reviews from Apple's product pages, an aggregator and Trustpilot, not the most recent 200 per app. Treat counts as directional (section 1).

## 1. Method and sample frames

### 1.1 What we planned versus what we got

| Planned source | Result on 3 Oct 2026 | What we used instead |
|---|---|---|
| Apple customer reviews RSS JSON, pages 1 to 10, per app | **Refused**: WebFetch reported the URL is disallowed by robots.txt (tried with and without `/page=1/`). UR used this feed on 1 Oct. We did not work around it. | Apple's public product-page review lists (`?see-all=reviews`), which show about 10 reviews per app chosen by Apple, dated 2017 to 2026. |
| Wider app review sample | Partial | justuseapp.com review pages (20 to 34 reviews per app, no dates, stars shown for some). Page 2 for Qeepsake returned the same 20 as page 1. |
| Trustpilot, Storyworth and Remento | Partial. Storyworth page 1 opened; pages 2 and 3 returned HTTP 403. Star-filtered views refused by robots.txt. Remento pages 1, 2, 4 and 5 opened; page 3 returned 403. Pages 4 and 5 largely repeat each other; duplicates removed. | As listed. |
| Reddit via Arctic Shift | Mostly refused. Full-text post search returned HTTP 422 unless a date range was given, then HTTP 429 rate limits; the proxy then asked us to stop. 3 searches succeeded (R2-S35 to R2-S37); results were mostly off-topic because the search matches words separately. Reddit itself is blocked to WebFetch. | Section 3 reports the few relevant hits. UR's Reddit evidence (UR S24 to S30) still stands. |
| Studies | Most opened. Four pages were refused by the proxy rate limit (listed in section 9 as not opened). | Marked Unverified where used. |

### 1.2 Review sample frame

- **Unit:** one unique review. Reviews that appear on both Apple's page and the aggregator page were counted once (331 raw items; we removed 44 duplicates by matching title and content, mostly Apple-page reviews repeated on the aggregator and Remento pages 4 and 5 repeating each other).
- **Products (11):** Qeepsake, Tinybeans, Day One, Notabli, BabyPage, 23snaps, Chatbooks, Huckleberry, Sproutbook (App Store, US); Storyworth and Remento (Trustpilot). Dearest's US page shows 1 rating and no review text [F R2-S6]. FirstChapter (US id 6760676959) shows no reviews because it lacks enough ratings [F R2-S12].
- **Not most recent.** Apple's product pages show a selection that ran from 2017 to 2026. Aggregator pages are undated. Trustpilot pages are newest first (Storyworth page 1 was within 2 days of 3 Oct 2026; Remento pages ran roughly Nov 2025 to Aug 2026, with some dates inconsistent between pages, so we do not rely on them).
- **How we read them:** WebFetch passes each page through a small model that returns a star, title and a 10-word paraphrase. We coded those paraphrases, not the original text. Some paraphrases may be wrong; we could not check each one against the original.
- **Coding:** one review can carry several themes (T1 to T30, section 2.2). Sentiment is coded from the text (positive, mixed, negative) because 41 aggregator reviews show no star.
- **Total:** 287 unique reviews. Stars shown for 246: 168 five-star, 31 four-star, 16 three-star, 22 two-star, 9 one-star. Sentiment: 183 positive, 43 mixed, 61 negative.

### 1.3 Per product sample

| Product | Store rating on 3 Oct 2026 | Frame | n coded | 5/4/3/2/1/no star | Pos/Mixed/Neg | Source |
|---|---|---|---|---|---|---|
| Qeepsake | 4.9 (15K ratings) | Apple page 10, aggregator 15 | 25 | 3/4/0/1/2/15 | 10/8/7 | R2-S1, R2-S13 |
| Tinybeans | 4.9 (104K) | Apple 10, aggregator 21 | 31 | 16/1/3/1/0/10 | 16/2/13 | R2-S2, R2-S14 |
| Day One | 4.8 (118K) | Apple 10, aggregator 30 | 40 | 23/5/5/6/1/0 | 23/5/12 | R2-S3, R2-S16 |
| Notabli | 4.7 (70) | Apple 10, aggregator 12 | 22 | 15/5/0/1/0/1 | 15/5/2 | R2-S4, R2-S18 |
| BabyPage | 4.8 (4.1K) | Apple 10, aggregator 26 | 36 | 24/2/2/5/3/0 | 24/3/9 | R2-S5, R2-S15 |
| 23snaps | 4.8 (11K) | Apple 10, aggregator 16 | 26 | 3/2/2/4/0/15 | 12/6/8 | R2-S9, R2-S17 |
| Chatbooks | 4.8 (249K) | Apple 10 | 10 | 5/1/2/1/1/0 | 4/2/4 | R2-S10 |
| Huckleberry | 4.9 (74K) | Apple 10 | 10 | 7/1/0/2/0/0 | 6/2/2 | R2-S11 |
| Sproutbook | 4.7 (13) | Apple 3 (all shown) | 3 | 3/0/0/0/0/0 | 3/0/0 | R2-S8 |
| Storyworth | Trustpilot 4.7 (65,094; 80% five-star, under 1% one-star) | Trustpilot page 1 | 20 | 16/3/1/0/0/0 | 17/3/0 | R2-S19 |
| Remento | Trustpilot 4.8 (1,738; 92% five-star, 1% one-star) | Trustpilot pages 1, 2, 4, 5 | 64 | 53/7/1/1/2/0 | 53/7/4 | R2-S20 to R2-S23 |
| Dearest | 5.0 (1 rating) | No review text shown | 0 | n/a | n/a | R2-S6, R2-S7 |
| FirstChapter | Not enough ratings to show | No reviews | 0 | n/a | n/a | R2-S12 |

**Inferred:** category leaders hold 4.7 to 4.9 averages on tens of thousands of ratings. A new app will be judged against that bar on its store page (F21).

## 2. Review mining results by theme and feature

### 2.1 Headline counts

| Measure | Count | Share | Label |
|---|---|---|---|
| Negative or mixed reviews | 104 of 287 | 36% | S |
| ... that mention bugs, crashes, slowness, sync or lost work (T7, T8) | 41 of 104 | 39% | S |
| ... that mention price, subscription or a new paywall (T1, T2) | 21 of 104 | 20% | S |
| ... that mention print cost or print quality (T3) | 17 of 104 | 16% | S |
| Reviews describing lost entries or lost work (T8L) | 9 of 287 | 3% | S |
| Positive reviews of the six baby memory apps that cite privacy (T9) | 29 of 80 | 36% | S |
| Positive reviews of the six baby memory apps that cite family sharing (T10) | 25 of 80 | 31% | S |
| Remento reviews that name voice or face as the value (T11) | 11 of 64 | 17% | S |
| Remento and Storyworth reviews about legacy for future generations (T23) | 25 of 84 | 30% | S |

### 2.2 Themes, mapped to features

Sentiment counts are reviews, not mentions. Products list where the theme appears.

| Code | Theme | Feature | n | Neg | Mixed | Pos | Where | What reviewers say (paraphrased) |
|---|---|---|---|---|---|---|---|---|
| T7 | Bugs, crashes, freezes, slowness | F04, F16, NFR | 39 | 24 | 11 | 4 | All but Sproutbook and Storyworth; BabyPage 9, Tinybeans 7 | Crashes when switching apps; pages vanish after saving; scrolling and photo reordering broken; upload failures for weeks. R2-S5, R2-S9, R2-S13, R2-S15 |
| T8 | Sync problems and lost data (T8L = lost work, 9) | F16, F04, F08 | 14 | 10 | 2 | 2 | Day One 8, Huckleberry 2 | Special entries disappeared; sync overwrote work across devices; an accidental paste deleted a 30-minute entry with no undo; a new subscriber lost a book in progress because there is no autosave. R2-S10, R2-S16 |
| T1 | Price and subscription cost | F14 | 26 | 19 | 2 | 5 | Day One 8, Qeepsake 4, Tinybeans 4, 23snaps 4 | Price rises; annual fee plus book, shipping and export fees; a Day One user compares $25 a year with a rival at $4 a year. R2-S2, R2-S13, R2-S16 |
| T2 | Paywall on something that used to be free | F14 | 10 | 10 | 0 | 0 | 6 products | Four years of free video, then a fee; free iCloud sync removed and replaced with a paid plan; free tier cut back repeatedly. R2-S9, R2-S16, R2-S18 |
| T3 | Print book (T3p = praise, 26; complaints on cost or quality, 19) | F15 | 45 | 8 | 9 | 28 | Qeepsake 12, Remento 9, BabyPage 6, Chatbooks 5 | Praise for annual printed books; complaints about $94 to $200 books, grainy photos, awkward layouts, damaged delivery. R2-S1, R2-S10, R2-S13 |
| T4 | Prompts and reminders help | F13 | 27 | 0 | 4 | 23 | BabyPage 12, Qeepsake 5, Remento 6, Storyworth 4 | Easy questions; reminders keep people going; prompts surface forgotten memories. R2-S15, R2-S19, R2-S21 |
| T5 | Prompts repeat or do not fit the child's age | F13, F19 | 4 | 1 | 3 | 0 | Qeepsake 4 | Same questions every month; age-inappropriate questions; no holiday prompts; one says they may cancel over it. R2-S13 |
| T6 | Too many texts, emails or notifications | F13 | 5 | 3 | 1 | 1 | Qeepsake, Tinybeans 2, Remento 2 | Marketing texts; daily emails; reminders by email and text at once; pregnancy notifications felt wrong. R2-S1, R2-S14, R2-S20, R2-S23 |
| T9 | Privacy as a reason to choose (T9f = privacy failure, 2) | F17, F11 | 38 | 2 | 3 | 33 | Notabli 14, 23snaps 12, Tinybeans 7, Day One 5 | Safe place off social media; no ads, no facial recognition; passcode bypassed through system search; private photos seen by the wrong audience. R2-S16, R2-S17, R2-S18 |
| T10 | Sharing with family and grandparents | F11, F30 | 31 | 0 | 1 | 30 | Tinybeans 9, 23snaps 8, Notabli 5 | Distant family keeps up; grandparents stay engaged; easy for grandparents. R2-S9, R2-S14, R2-S17 |
| T11 | Voice or audio as the keepsake | F08, F10 | 13 | 0 | 1 | 12 | Remento 11, Day One 1, Notabli 1 | Capturing voice and face beats text-only; voices recorded for grandchildren; one 2018 Notabli reviewer asked for voice recording. R2-S4, R2-S20 to R2-S23 |
| T12 | Transcription and AI editing | F05, F06 | 8 | 0 | 1 | 7 | Remento 7, Sproutbook 1 | Easy to edit transcripts (3); transcription praised (2); AI polish praised (3: 2 Remento, plus a Sproutbook reviewer's baby book that writes itself); surprised AI changed spoken words (1). R2-S8, R2-S21, R2-S22 |
| T13 | Ease, speed, low effort | F04 | 31 | 0 | 1 | 30 | Remento 10, BabyPage 9, Qeepsake 6 | Quick entries while nursing; five minutes is enough; zero effort. R2-S13, R2-S15 |
| T14 | Export and PDF | F15 | 4 | 2 | 0 | 2 | Qeepsake 2, Day One, Notabli | PDF export improved; export costs extra; data export valued. R2-S1, R2-S3, R2-S18 |
| T15 | Customer support | F20 | 22 | 6 | 2 | 14 | Remento 10 | Same-day replies praised; weeks of upload failure with poor support; months without a reply. R2-S9, R2-S14, R2-S20 |
| T16 | Contributor friction | F11, F30 | 2 | 1 | 1 | 0 | Remento 2 | Easy for the buyer, confusing for collaborators; hard to get the chosen person to answer. R2-S20, R2-S21 |
| T18 | Several children | F12 | 4 | 0 | 0 | 4 | Qeepsake, BabyPage 2, Huckleberry | Separate journals per child; twins; still useful as second-time parents. R2-S1, R2-S11, R2-S15 |
| T19 | Fear the app will stall or close | F15, F21 | 4 | 2 | 2 | 0 | 23snaps 3, Notabli 1 | Few updates; seems the company will go under; a decade-long user worried by the lack of updates. R2-S4, R2-S17 |
| T20 | Ads, feed clutter, data sharing | F17, F09 | 4 | 4 | 0 | 0 | Tinybeans 4 | New interface full of ads and blog posts instead of photos; concern about data shared with third parties. R2-S14 |
| T21 | Bought as a gift | F14, F30 | 7 | 0 | 0 | 7 | Remento 4, Chatbooks 2, Storyworth 1 | Best gift; books for parents and grandparents. R2-S10, R2-S19 |
| T22 | Partner contributes | F11 | 1 | 0 | 1 | 0 | Qeepsake | Spouse contributions helpful. R2-S13 |
| T23 | Legacy for future generations | F09, F10 | 30 | 0 | 0 | 30 | Remento 17, Storyworth 8 | Stories for children and grandchildren; wishing they knew this much about their own parents. R2-S19, R2-S21 to R2-S23 |
| T24 | Older or less technical user succeeds | P5, F30 | 10 | 1 | 1 | 8 | Remento 8 | Parents in their 80s, 90s and 100 recording on their own; talking instead of typing. R2-S22, R2-S23 |
| T25 | Chronology, ordering, backdating | F09 | 6 | 3 | 3 | 0 | BabyPage 2, Qeepsake, Tinybeans, Day One, 23snaps | Feed not ordered by event date; pages do not auto-order; fee to backdate photos; hard to add missed days. R2-S2, R2-S5, R2-S9, R2-S13 |
| T26 | Hard to answer or reluctant author | F13, P5 | 4 | 0 | 2 | 2 | Storyworth 2, Remento 2 | Some questions are beyond recall; writing is hard; talking is easier than typing. R2-S19, R2-S22 |
| T27 | Pressure and guilt | F13 | 3 | 0 | 1 | 2 | Qeepsake, Huckleberry, Remento | Short entries reduced journaling guilt; no pressure; tracking can make parents stress about consistency. R2-S11, R2-S13, R2-S21 |
| T28 | Age math: pregnancy and preterm | F03, F09 | 3 | 1 | 0 | 2 | Tinybeans 2, BabyPage | Asks for adjusted dates for preterm babies; pregnancy notifications felt off; praise for pregnancy-to-infancy pages. R2-S2, R2-S14, R2-S15 |
| T29 | Translatable content | F05 | 1 | 0 | 0 | 1 | BabyPage | One reviewer values translatable content (meaning unclear). R2-S15 |
| T30 | Mobile data overuse | F05, F16, F19 | 1 | 1 | 0 | 0 | Tinybeans | App used 9 GB overnight twice, causing carrier charges. R2-S14 |

### 2.3 Where this confirms or contradicts UR

| UR claim | R2 evidence | Verdict |
|---|---|---|
| Billing after inactivity and paywalls make people angriest; 74 of 124 negative Tinybeans reviews mention price (UR S31) | Across 11 products, money is in 21 of 104 negative or mixed reviews; bugs and lost work in 41. In our Tinybeans sample, 3 of 13 negative reviews are about money, 6 about bugs, 4 about ads and feed changes. | **Partly contradicts.** Frames differ (UR: 200 most recent Tinybeans reviews; R2: Apple's selection plus aggregator). Both matter. Reliability belongs at the same rank as price. |
| Never lock already-recorded content (UR R15) | 10 of 10 reviews about new paywalls on old features are negative. | Confirms, across 6 more products. |
| Prompts work when age-fit; repetition gets them muted (UR S32) | 27 praise, 4 repetition complaints. | Confirms. |
| Fear: child's data exposed or used (UR S9) | Privacy is the most common reason given for choosing an app (36%). | Confirms and upgrades: privacy is a purchase driver, not only a fear. |
| Backdating needed (UR R10) | All 6 chronology reviews are complaints; Qeepsake charges to backdate. | Confirms. |
| Fathers write letters or videos (UR S25, S30) | 1 of 287 reviews mentions a partner contributing. | Not contradicted, but review evidence for P2 is thin. |
| Grandparents struggle with app UX (UR S31) | Remento: 8 reviews describe users in their 80s to 100 recording without help; 1 says collaborators were confused. | **Partly contradicts.** A voice-first flow built for elders can work. |
| Remento drops proper nouns (CR S27) | 1 review surprised that AI changed spoken words; 3 praise AI polish. | Extends: fidelity matters to some buyers and polish appeals to others. |

## 3. Community evidence

### 3.1 What we could collect

Reddit access failed for most planned queries (section 1.1). UR's Reddit findings (UR S24 to S30) remain the main community evidence on baby book guilt, letters and email accounts for the child, and the partner's phone. New items from the three archive searches that worked:

| Topic | Signal (paraphrased) | Label | Source |
|---|---|---|---|
| Print and the camera roll | A parent asked which company prints iPhone photos for a baby book (14 Sep 2026). The camera roll is still the raw material. | S | R2-S35, thread https://www.reddit.com/r/beyondthebump/comments/1wfvz1w |
| Printed memory books | Three comments posted within one minute on 29 Sep 2026, on three older r/NewParents threads, likely by one person, say that removing prompts in a memory book app left blank pages in the printed book; one names Short Years books and says the feature gave no warning. Count as one signal. | S | R2-S37, threads https://www.reddit.com/r/NewParents/comments/1n88jfb, https://www.reddit.com/r/NewParents/comments/1mzasqc, https://www.reddit.com/r/NewParents/comments/1fj8egk |
| New entrants | A post promoting a baby journal app for milestones, growth and memories appeared in r/beyondthebump (28 Aug 2026). New apps keep arriving in this space. | S | R2-S35, https://www.reddit.com/r/beyondthebump/comments/1w0u8u2 |
| Early words | A single parent's excitement that a 2-month-old may have said a first word (r/beyondthebump). First words are a moment parents want to keep. | S | R2-S35, https://www.reddit.com/r/beyondthebump/comments/1vze7ai |
| Grief while parenting | A commenter on losing a parent while raising young children recommends grieving openly (28 Sep 2026). Research context only; product copy never uses loss language. | S | R2-S36, https://www.reddit.com/r/beyondthebump/comments/1wscnf3 |

Thread URLs come from the archive records. Reddit blocks direct fetches, so we did not open the threads themselves.

### 3.2 Topics with no new community evidence today

Letters or emails to a child, recording a parent's voice, hearing a late parent's voicemail, co-parent splits, grandparents contributing, second child, heritage language with grandparents, transcription of names and accents, paywalls on memories and notification fatigue. For these, cite UR S24 to S30 and CR, or the review themes in section 2. Listed under Gaps in section 8.

## 4. Studies and surveys

| # | Study | Year, method, n | Key result | Label | Use in PRD | Source |
|---|---|---|---|---|---|---|
| 4.1 | Seltzer, Ziegler, Pollak, Proc. R. Soc. B, social vocalizations release oxytocin | 2010; experiment; 61 girls aged 7 to 12 after a social stress test, randomized to mother in person (19), mother by telephone (20) or no contact (22) | Phone voice and in-person contact produced similar oxytocin rises within 15 minutes, sustained for 1 hour; cortisol fell toward baseline with voice; control showed no change. Limits: girls only, live conversation not recording, peripheral oxytocin measurement debated. | F | Why a parent's voice matters (F08, F10, P6). Do not claim recorded audio has this effect. | R2-S24 |
| 4.2 | BLS, Daily time use in households with young children, ATUS 2024 | 2024 data; national time diary survey | Adults whose youngest child is under 6: 2.57 h/day caring for household members, 3.20 h leisure (versus 5.6 h without children), 9.50 h sleep and personal care. Employed: 2.97 h leisure. | F | P1 moment and constraint: short windows (F04, F13). | R2-S25 |
| 4.3 | BLS, American Time Use Survey 2025 results | Released 25 Jun 2026; 2025 data; Q4 collection hit by a federal shutdown | Households with children under 6: 2.3 h/day primary childcare; employed mothers 2.8 h, employed fathers 1.7 h; secondary childcare 4.2 h on weekdays and 7.7 h on weekend days. | F | P1 versus P2 time; capture while holding a child (F04). | R2-S26 |
| 4.4 | BLS, Employment Characteristics of Families 2025 | Released 23 Apr 2026; CPS, about 60,000 households a month; October 2025 excluded | 68.0% of mothers with children under 6 are in the labor force; 95.3% of fathers. Both spouses employed in 49.1% of married-couple families. | F | Most P1 and P2 households have at least one parent at work; evenings and weekends are the window (F13 reminder timing). | R2-S30 |
| 4.5 | BLS, National Compensation Survey, family leave fact sheet | March 2023 | 27% of civilian workers had access to paid family leave; 90% to unpaid family leave (2008: 9% paid). | F | Paid leave is the exception. UR's assumed return-to-work drop-off at 3 to 4 months remains Unverified: no source we opened gives return timing. | R2-S33 |
| 4.6 | Pew Research Center, How Americans view AI and its impact | Survey 9 to 15 Jun 2025; American Trends Panel; n=5,023 US adults | 76% say telling AI-made from human-made content apart is extremely or very important; 53% are not confident they can. 50% more concerned than excited (37% in 2021). 50% expect AI to worsen people's ability to form meaningful relationships; 5% expect better. 57% want more control over AI in their lives. | F | Never-rewrite promise and visible "what changed" (F06); privacy and no model training (F17, B9). | R2-S27 |
| 4.7 | Pew Research Center, How parents describe their kids' tech use | Published 8 Oct 2025; parents of children 12 and under; sample size not shown on the page we opened (Unverified) | About 40% of parents of children under 2 say the child uses a smartphone; 62% say the child under 2 watches YouTube, 35% daily (24% in 2020). | F | Read together sits next to heavy early screen use; design it as a parent-led activity (F10). | R2-S28 |
| 4.8 | American Academy of Pediatrics, Literacy Promotion policy statement | Online 29 Sep 2024, Pediatrics Dec 2024; policy statement | Encourage shared reading from birth through kindergarten; prefer print books over digital media; shared reading strengthens parent-child bonds. No parent reading rates given on the page. | F | Read together supports a recommended habit, but the AAP favours print. F10 and F15 (PDF book) both matter. | R2-S29 |
| 4.9 | Pew Research Center, Hispanic parents speaking Spanish to children | 2015 National Survey of Latinos, reported 2018; sample details in a PDF we did not open | 85% of Latino parents speak Spanish to their children: 97% of immigrant parents, 71% second generation, 49% third or higher. 92% with a Latino partner versus 55% with a non-Latino partner. About 70% often encourage their children to speak Spanish. | F | P4: language at home depends on generation and on the partner (F03, F10, F11). | R2-S31 |
| 4.10 | Pew Research Center, Latinos and the Spanish language | Survey 1 to 14 Aug 2022; ATP and Ipsos KnowledgePanel; 3,029 Latino adults | 85% say it is at least somewhat important that future generations speak Spanish (42% of immigrants and 25% of US-born say extremely important). 34% of third-or-higher generation Latinos can hold a conversation in Spanish. 54% of Latinos who do not speak Spanish say other Latinos have shamed them for it. | F | P4 motivation is strong and shame is real; copy must never judge a family's language (F03, F13). | R2-S32 |

Studies we wanted but could not open today (proxy rate limit) are listed in section 9 and are **Unverified** here: Seltzer 2012 on instant messages versus voice, Koenecke 2020 on speech recognition error rates by speaker race, Richter 2019 on parents' sleep after birth, Abrams 2016 on children's brain response to a mother's voice, and the 2015 Mott sharenting poll. UR S9 (Mott 2023, n=614) still covers parents' sharing concerns.

## 5. Persona evidence P1 to P6

### P1 Evening parent (primary author and buyer)

| Area | Evidence | Label | Source |
|---|---|---|---|
| Moment | Adults with a child under 6 have 3.2 hours of leisure a day, 2.4 hours less than adults without children. | F | R2-S25 |
| Moment | Secondary childcare runs 4.2 hours on weekdays and 7.7 on weekend days, so many minutes are spent with a child nearby or in arms. | F | R2-S26 |
| Moment | Reviewers praise entries made while nursing and entries that take five minutes or less. | S | R2-S13 |
| Constraint | 68.0% of mothers of children under 6 are in the labor force; 27% of workers have paid family leave. | F | R2-S30, R2-S33 |
| Constraint | Employed mothers do 2.8 hours of primary childcare a day versus 1.7 for fathers, so the default author is often the mother. | F | R2-S26 |
| Motivation | Privacy and keeping the child off social media is the most cited reason to choose a memory app. | S | Section 2, T9 |
| Motivation | A finished printed book each year is the most praised outcome in prompted journals. | S | T3p, R2-S1, R2-S13 |
| Fear | Losing entries or work: 9 reviews describe it; sync overwrites and missing autosave drive 1-star reviews. | S | T8L, R2-S10, R2-S16 |
| Fear | New charges on features that were free; hidden fees for backdating, export and shipping. | S | T2, R2-S13 |
| Fear | The app stalls or closes, taking years of entries with it. | S | T19, R2-S17 |
| Delight | Short entries reduce guilt; a no-pressure tone is praised. | S | T27, R2-S13, R2-S21 |
| Delight | Prompts that surface something they would have forgotten. | S | T4, R2-S19 |
| Assumption | P1 will speak letters aloud at night while a baby sleeps nearby. Validate in Study 1 (speak versus type share, time of day). | A | none |

### P2 Co-parent

| Area | Evidence | Label | Source |
|---|---|---|---|
| Moment | 95.3% of fathers of children under 6 are in the labor force; employed fathers average 1.7 hours of primary childcare a day. | F | R2-S30, R2-S26 |
| Motivation | Fathers write letters or record videos to the future child on their own cadence. | S | UR S25, S30 |
| Evidence gap | Only 1 of 287 reviews mentions a partner contributing (positively). Review data says little about P2. | S | R2-S13 |
| Constraint | In mixed-language couples, the heritage-language parent is far less likely to speak it to the child (55% versus 92% among Latino parents). P2 may not read P4's letters. | F | R2-S31 |
| Fear | Privacy failures in shared albums (photos seen by the wrong audience) make sharing settings a trust issue. | S | R2-S17 |
| Assumption | P2 opens the book mainly to read and listen, and writes less often than P1. Validate with Study 3 and v1.0 analytics (letters per author). | A | none |

### P3 Expecting parent

| Area | Evidence | Label | Source |
|---|---|---|---|
| Moment | Parents advise looking at the baby book during pregnancy so you know what to capture. | S | UR S27 |
| Delight | A baby book app is praised for covering pregnancy through infancy. | S | R2-S15 |
| Fear | Notifications about an unborn child felt wrong to one Tinybeans reviewer. | S | R2-S14 |
| Constraint | Preterm parents asked for dates adjusted for a preterm birth. | S | R2-S2, R2-S14 |
| Assumption | Due-date mode (UR R2) carries into the month-of-age book without awkward copy. Validate with 3 to 5 expecting parents in Study 3. | A | none |

### P4 Multilingual family

| Area | Evidence | Label | Source |
|---|---|---|---|
| Motivation | 85% of US Latinos say it is at least somewhat important that future generations speak Spanish. | F | R2-S32 |
| Motivation | 72% of Indian Americans aged 5 and older speak a language other than English at home. | F | UR S13 |
| Constraint | Spanish to children falls from 97% (immigrant parents) to 49% (third generation). | F | R2-S31 |
| Constraint | Mixed partnerships: 55% versus 92%. One parent may not understand the other's letters. | F | R2-S31 |
| Fear | 54% of Latinos who do not speak Spanish say they have been shamed for it. | F | R2-S32 |
| Fear | Off-the-shelf speech models drop words at language switches in Hindi-English speech. | F | UR S12 |
| Evidence gap | Only 1 of 287 reviews mentions translatable content; no memory app review in our sample mentions languages, accents or names being misheard. | S | R2-S15 |
| Assumption | P4 wants the letter kept in the language it was spoken, with the original audio, and would accept an author-written second version for a partner who does not read it. Validate in Study 3. | A | none |

### P5 Close family (v1.1 contributor)

| Area | Evidence | Label | Source |
|---|---|---|---|
| Moment | Family sharing is the second largest positive theme in photo-album apps, after privacy: distant relatives keep up with the baby. | S | T10, R2-S14, R2-S17 |
| Delight | Printed photo books moved a grandmother to tears. | S | R2-S10 |
| Constraint | Some elders can record on their own: reviewers describe parents in their 80s, 90s and 100 recording without help. | S | R2-S22, R2-S23 |
| Fear | Collaborators found Remento's site confusing; reminders by email and text at once annoyed others. | S | R2-S20, R2-S23 |
| Moment | A grandmother caring for a baby uses a tracking app to coordinate with the parents. | S | R2-S11 |
| Fact | 76% of US grandparents say digital tools are a primary way they stay connected. | F | UR S15 |
| Assumption | P5 will accept the v1.1 wait if the co-parent can show them letters in person or in the PDF. Validate in Study 3. | A | none |

### P6 Future reader (the child, years later)

| Area | Evidence | Label | Source |
|---|---|---|---|
| Delight | Hearing a voice is the value most named by Remento reviewers; recordings are kept for grandchildren. | S | T11, R2-S20 to R2-S23 |
| Delight | Storyworth reviewers wish they had known this much about their own parents. | S | R2-S19 |
| Fact | A mother's live voice by phone produced oxytocin and cortisol changes similar to in-person contact in girls aged 7 to 12. | F | R2-S24 |
| Fact | The AAP recommends shared reading from birth and prefers print to digital media. | F | R2-S29 |
| Fact | 62% of parents of children under 2 say the child watches YouTube. | F | R2-S28 |
| Assumption | Hearing a parent's recorded voice reading an old letter carries emotional weight for the child years later. No study we opened tests recorded voice. Do not claim it in copy; validate only with long-run qualitative work. | A | none |

## 6. Evidence per feature F01 to F21

| Feature | Customer evidence a spec writer should cite | Spec consequence | Label |
|---|---|---|---|
| F01 Entry, 18+ gate, welcome | No new review evidence. UR S10: tutorials do not raise task success. AAP prefers print for young children and many under-2s already use phones (R2-S28, R2-S29). | Keep entry parent-facing; no child-facing framing. | F, Inferred |
| F02 Account and sign-in | Day One reviewers punished the removal of free iCloud sync and the move to a paid proprietary cloud (R2-S3, R2-S16). | Local-first, with account creation offered as protection, not forced. Never take away a free storage path later. | S, R |
| F03 First run | Language at home depends on generation and partner (R2-S31). Preterm adjusted dates requested (R2-S2, R2-S14). Pregnancy pages praised (R2-S15). | Ask each author's languages separately; support due date; consider preterm adjusted age (open question). | F, S |
| F04 Capture | Ease is the top positive theme (31). Entries while nursing (R2-S13). 9 lost-work reviews; a 30-minute entry lost to a paste with no undo; no autosave lost a whole book (R2-S10, R2-S16). Secondary childcare 4.2 to 7.7 h/day (R2-S26). | Autosave typed text continuously; keep recordings through interruptions; undo. Set numbers in F04 (for example, no more than 2 seconds of typed text lost on a kill). | S, F, R |
| F05 Transcription and packs | 2 Remento reviews praise transcription; CR S27 says names were dropped. One app used 9 GB of mobile data overnight (R2-S14). Speech recognition disparity research Unverified today. | Default pack downloads to Wi-Fi; show size first; name accuracy is the trust test. | S, R |
| F06 Faithful edit | 76% want to tell AI from human content (R2-S27). One reviewer was surprised AI changed spoken words; 3 praise AI polish (R2-S8, R2-S21, R2-S22). | Show exactly what changed. Expect a minority asking for polish; the answer stays no (constitution), said kindly. | F, S |
| F07 Names dictionary | No new evidence beyond CR S27 (proper nouns dropped). | Gap; Study 1 counts misheard names. | S |
| F08 Recordings | Voice is the value for 17% of Remento reviewers (R2-S20 to R2-S23). Lost data is the top fear (T8). Dearest imports existing voicemails and voice memos with their original dates (R2-S7). | Original always kept and playable. Consider importing existing voice memos with original dates for a later release. | S, F, R |
| F09 The book | All 6 chronology reviews are complaints; fee to backdate (R2-S13). Legacy theme 30 (T23). | Order by the moment's date; backdating free; empty months invite, never count. | S |
| F10 Read together | Shared reading from birth recommended; print preferred (R2-S29). Live voice lowers stress in children (R2-S24). Voice valued for grandchildren (T11). Mixed-language couples (R2-S31). | Parent-led, audio-first session; letters stay in the spoken language; no developmental claims. | F, S |
| F11 Co-parent sharing | Family sharing is the top praise in photo apps (T10, 31). Partner contribution in 1 review. A privacy failure in shared albums (R2-S17). | Clear who can see what; co-parent views and writes; prepare messaging that grandparents arrive in v1.1. | S, A |
| F12 Multiple children | 4 positive reviews on several children or twins (R2-S1, R2-S11, R2-S15). Second children get fewer photos (UR S7). | Second child easy to add; Plus boundary applies on the device (B2). | S |
| F13 Prompts, reminders, notifications | 27 praise prompts; 4 say they repeat or misfit age; 5 complain about too many messages, including email plus text together (R2-S13, R2-S23). Pregnancy notification complaint (R2-S14). | Age-aware, non-repeating prompts; one channel by default; a quiet pregnancy mode. | S |
| F14 Plus | 26 price reviews, 10 new-paywall reviews, all negative; hidden fees and hard cancellation (R2-S15). 7 gift reviews (T21). | Never move a free feature behind Plus later; Apple's manage sheet (B2) answers cancellation complaints; gifts later. | S, D |
| F15 Export and PDF book | Print is praised 26 times and criticised 19 times for cost and quality. Export fees resented (R2-S13). Fear of shutdown (T19). Blank printed pages after removing prompts (R2-S37, one person). | Free PDF and audio export; no blank pages; say plainly that export always works. | S |
| F16 Sync, devices, restore | 14 sync or loss reviews, 8 at Day One: overwrites across devices, missing entries, typing lag (R2-S16). 9 GB overnight (R2-S14). | Never overwrite silently; keep both versions on conflict; cap background data. | S |
| F17 Settings, privacy, deletion | Privacy cited in 36% of positive baby-app reviews. Passcode bypassed through system search (R2-S16); data sharing worries (R2-S14). 57% want more control over AI (R2-S27). | App lock must also cover Spotlight indexing, widgets and notification previews; "never sold, never trained" stays visible. | S, F |
| F18 Analytics | Worry about data shared with third parties (R2-S14); 57% want control over AI (R2-S27). | Opt-in stays opt-in; say what is collected in one line. | S, F |
| F19 Server content | Repetition is the main prompt complaint (T5); stalling apps lose trust (T19). | A server-delivered prompt pool keeps prompts fresh without app updates. | S, Inferred |
| F20 Help and safety | 22 support reviews; Remento's same-day replies earn praise; weeks of silence earn 1 to 2 stars (R2-S9, R2-S20). | Publish a reply-time target; hello@earlyletters.com answered by a person. | S |
| F21 Store listing and web | Leaders sit at 4.7 to 4.9 on 11K to 249K ratings (section 1.3). Apple's product page shows old featured reviews (2017 to 2026). | Plan the rating prompt for a moment of value; expect comparison with 4.8. | F |

## 7. Jobs to be done, ranked by evidence strength

Strength: **High** = a fact source plus signals from 3 or more products; **Medium** = signals from 2 or more products or one strong fact; **Low** = one source or assumption.

| Rank | Job (in the parent's words) | Evidence | Strength | Main features |
|---|---|---|---|---|
| 1 | Keep my child's memories private and off social media. | T9 in 36% of positive baby-app reviews (Notabli, 23snaps, Tinybeans) plus 5 Day One reviews; UR S9 (63% of parents of 0 to 4s worry about location-identifying shares). | High | F17, F11, F21 |
| 2 | Never lose what I made. | T7 and T8 in 39% of negative or mixed reviews; 9 lost-work stories; T2 and T19. | High | F04, F16, F08, F15 |
| 3 | Let me capture it in the few minutes I have. | T13 in 31 reviews; leisure 3.2 h/day (R2-S25); UR S24, S29b. | High | F04, F05 |
| 4 | Tell me what to write about, without nagging. | T4 27 versus T5 4 and T6 5. | High | F13, F19 |
| 5 | Let family see the baby grow. | T10 31 positive across 10 products. | High for photo apps; Medium for letters | F11, F30 |
| 6 | Leave my words and voice for my child's future. | T23 30, T11 13 (Remento), UR S30; R2-S24 is about live voice. | Medium | F08, F09, F10 |
| 7 | Give me a finished book I can hold. | T3p 26 versus 19 cost and quality complaints; blank-page complaint. | Medium | F15 |
| 8 | Keep our languages in the family. | Pew facts (R2-S31, R2-S32); UR S13; no app-review behaviour. | Medium (motivation), Low (app use) | F03, F05, F10 |
| 9 | Let me give it as a gift. | T21 7 (Remento, Chatbooks, Storyworth); UR S15. | Medium, later release | F30 |

## 8. What we do not know and the research plan

### 8.1 Riskiest unknowns

| # | Unknown | Why it is risky | Current evidence |
|---|---|---|---|
| U1 | Will P1 speak letters aloud, and where and when? | The product is built on speaking. Night use near a sleeping baby or partner may push people to type. | None direct. Remento elders prefer talking to typing (R2-S23), a different group. |
| U2 | Do parents value the untouched original over a polished version? | Some buyers praise AI polish (R2-S21, R2-S22). If many want it, our promise narrows the market. | 2 for polish, 1 surprised by changed words, in 64 Remento reviews (plus 1 Sproutbook reviewer for polish). Pew: 76% want to know what is AI-made (R2-S27). |
| U3 | Is co-parent-only at v1.0 enough? | Grandparents viewing is the top praise in photo apps (T10). | No direct test. |
| U4 | Is transcription good enough on names and accents in 7 languages? | A misheard name is the fastest way to lose trust. | CR S27; speech recognition disparity research not opened today. |
| U5 | Will parents use Read together, and at what child age? | It defines the v1.0 Plus boundary (unlimited Read together). | AAP shared reading (R2-S29); no usage data. |
| U6 | How does a co-parent who does not read the letter's language experience the book? | Mixed couples are common in P4 (R2-S31). | No product evidence. |
| U7 | When do capture habits fade? | UR's return-to-work drop-off is assumed. | Paid leave is 27% (R2-S33); no timing source opened. |

### 8.2 Lean primary-research plan

| Study | Sample | Method | Cost | Decision it changes |
|---|---|---|---|---|
| 1. Two-week voice capture diary | 16 parents of babies 0 to 12 months in the US: 8 P1, 4 P2, 4 P4 (at least 2 non-English speakers among Hindi, Spanish, Mandarin, Arabic, Portuguese, French) | TestFlight build or Voice Memos plus a short form. Daily log of letters, speak or type, time, place, interruptions; end interview (45 min). Count misheard names and words per language. | About $3,200: $150 incentive each ($2,400) plus recruiting fees of about $50 each ($800) [A] | Default capture mode (speak-first or type-first); F05 language priority and F07 dictionary prominence; F04 autosave and interruption budgets; F13 reminder window. Answers U1, U4, U7 (early). |
| 2. Faithful versus polished preference test | 200 US parents of children under 3, unmoderated; plus 8 moderated follow-ups | Show one recorded letter with three versions: raw transcript, faithful clean-up (our rules), AI polish. Ask which to keep for the child, trust ratings, and whether they can tell which is AI-edited. | About $2,000: panel at about $6 each ($1,200) plus 8 interviews at $100 ($800) [A] | How prominently F06 shows changes; whether "never rewritten" leads store copy (F21); how F06 says no to polish requests. Answers U2. |
| 3. Family and pricing concept interviews | 10 co-parent pairs (both partners), including 4 mixed-language couples and 3 expecting couples, plus 6 grandparents | 60-minute paired interviews with a clickable prototype of co-parent sharing, Read together and the Plus screen; simple price ladder questions; grandparents react to a v1.1 contributor concept. | About $4,000: $150 per pair ($1,500), $100 per grandparent ($600), recruiting about $1,000, prototype time in house [A] | Whether v1.1 family moves earlier; F11 handling of letters in a language one parent does not read; the Plus boundary (extra child, unlimited Read together); pregnancy mode copy. Answers U3, U5, U6. |

Total about $9,200 [A]. Run Study 1 during TestFlight beta (B8). Study 2 can run in parallel. Study 3 after the first beta build has co-parent sharing.

### 8.3 Gaps (not done today, and why)

| Gap | Reason | How to close |
|---|---|---|
| Most recent 200 reviews per app (UR's frame) | Apple RSS refused by robots.txt for our fetch tool | Export reviews through App Store Connect for our own app later; for competitors, a manual pull by the founder or a licensed review tool |
| Reddit on letters, voice, co-parent split, grandparents, heritage language, second child, accents, paywalls, notification fatigue | Arctic Shift rate limits and query errors; Reddit blocks direct fetches | Retry the archive on another day with narrow date ranges; or the founder reads 10 named threads |
| Trustpilot negative-only samples | Star filters refused by robots.txt; later pages 403 | Accept; Storyworth and Remento are 80% to 92% five-star anyway |
| Dearest and FirstChapter reviews | Too few reviews exist | Re-check in 3 months |
| Speech recognition accuracy by accent (Koenecke 2020), parent sleep (Richter 2019), voice and text (Seltzer 2012), mother's voice and the brain (Abrams 2016) | Proxy rate limit | Open on a later pass; cite only after opening |
| Voice memo and recorder app reviews about names and accents | Not reached | Low priority; Study 1 gives first-party data |
| Return-to-work timing after birth | No source opened | Census or BLS tables on a later pass |

## 9. Sources

All opened 3 Oct 2026 through WebFetch, unless listed under "Not opened".

| ID | Source | URL |
|---|---|---|
| R2-S1 | Qeepsake, App Store US, reviews page | https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787?see-all=reviews |
| R2-S2 | Tinybeans, App Store US, reviews page | https://apps.apple.com/us/app/tinybeans-private-family-album/id521633042?see-all=reviews |
| R2-S3 | Day One, App Store US, reviews page | https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788?see-all=reviews |
| R2-S4 | Notabli, App Store US, reviews page | https://apps.apple.com/us/app/notabli-family-social/id580644870?see-all=reviews |
| R2-S5 | BabyPage, App Store US, reviews page | https://apps.apple.com/us/app/babypage-baby-book-journal/id1362796822?see-all=reviews |
| R2-S6 | Dearest, App Store US, reviews page (1 rating, no text) | https://apps.apple.com/us/app/dearest-letters-memories/id6790823627?see-all=reviews |
| R2-S7 | Dearest, App Store US, product page: Plus $4.99/month or $49.99/year; voice notes; imports voicemails and voice memos with original dates; sealed letters; ZIP export; states "Dearest never hosts, reads, or sells your private moments". The version date shown in the summary (Aug 2024) is Unverified. | https://apps.apple.com/us/app/dearest-letters-memories/id6790823627 |
| R2-S8 | Sproutbook, App Store US, reviews page | https://apps.apple.com/us/app/id6751468842?see-all=reviews |
| R2-S9 | 23snaps, App Store US, reviews page | https://apps.apple.com/us/app/23snaps-private-family-album/id526481189?see-all=reviews |
| R2-S10 | Chatbooks, App Store US, reviews page | https://apps.apple.com/us/app/chatbooks-family-photo-albums/id734887606?see-all=reviews |
| R2-S11 | Huckleberry, App Store US, reviews page | https://apps.apple.com/us/app/huckleberry-baby-tracker/id1169136078?see-all=reviews |
| R2-S12 | FirstChapter: AI Baby Journal, App Store US, reviews page (not enough ratings to show) | https://apps.apple.com/us/app/firstchapter-ai-baby-journal/id6760676959?see-all=reviews |
| R2-S13 | justuseapp, Qeepsake reviews (pages 1 and 2 identical) | https://justuseapp.com/en/app/1332312787/qeepsake/reviews |
| R2-S14 | justuseapp, Tinybeans reviews | https://justuseapp.com/en/app/521633042/tinybeans-private-family-album/reviews |
| R2-S15 | justuseapp, BabyPage reviews | https://justuseapp.com/en/app/1362796822/babypage-baby-book-journal/reviews |
| R2-S16 | justuseapp, Day One reviews | https://justuseapp.com/en/app/1044867788/day-one-journal-private-diary/reviews |
| R2-S17 | justuseapp, 23snaps reviews | https://justuseapp.com/en/app/526481189/23snaps-private-family-album/reviews |
| R2-S18 | justuseapp, Notabli reviews | https://justuseapp.com/en/app/580644870/notabli/reviews |
| R2-S19 | Trustpilot, Storyworth, page 1 (TrustScore 4.7, 65,094 reviews) | https://www.trustpilot.com/review/storyworth.com |
| R2-S20 | Trustpilot, Remento, page 1 (TrustScore 4.8, 1,738 reviews) | https://www.trustpilot.com/review/remento.co |
| R2-S21 | Trustpilot, Remento, page 2 | https://www.trustpilot.com/review/remento.co?page=2 |
| R2-S22 | Trustpilot, Remento, page 4 | https://www.trustpilot.com/review/remento.co?page=4 |
| R2-S23 | Trustpilot, Remento, page 5 | https://www.trustpilot.com/review/remento.co?page=5 |
| R2-S24 | Seltzer LJ, Ziegler TE, Pollak SD. Social vocalizations can release oxytocin in humans. Proc. R. Soc. B 2010;277:2661 to 2666 | https://pmc.ncbi.nlm.nih.gov/articles/PMC2982050 |
| R2-S25 | BLS, The Economics Daily, Daily time use in households with young children in 2024 | https://www.bls.gov/opub/ted/2025/daily-time-use-in-households-with-young-children-in-2024.htm |
| R2-S26 | BLS, American Time Use Survey, 2025 results (released 25 Jun 2026) | https://www.bls.gov/news.release/atus.nr0.htm |
| R2-S27 | Pew Research Center, How Americans View AI and Its Impact on People and Society (17 Sep 2025) | https://www.pewresearch.org/science/2025/09/17/how-americans-view-ai-and-its-impact-on-people-and-society/ |
| R2-S28 | Pew Research Center, How parents describe their kids' tech use (8 Oct 2025) | https://www.pewresearch.org/internet/2025/10/08/how-parents-describe-their-kids-tech-use/markdown |
| R2-S29 | American Academy of Pediatrics, news release on the Literacy Promotion policy statement (29 Sep 2024) | https://aap.org/en/news-room/news-releases/aap/2024/american-academy-of-pediatrics-promotes-shared-reading-starting-in-infancy-as-a-positive-parenting-practice-with-lifelong-benefits |
| R2-S30 | BLS, Employment Characteristics of Families, 2025 (released 23 Apr 2026) | https://www.bls.gov/news.release/famee.nr0.htm |
| R2-S31 | Pew Research Center, Most Hispanic parents speak Spanish to their children (2 Apr 2018; 2015 survey) | https://www.pewresearch.org/short-reads/2018/04/02/most-hispanic-parents-speak-spanish-to-their-children-but-this-is-less-the-case-in-later-immigrant-generations/markdown |
| R2-S32 | Pew Research Center, Latinos and the Spanish language, report PDF (20 Sep 2023; 2022 survey) | https://www.pewresearch.org/wp-content/uploads/sites/20/2023/09/RE_2023.09.20_Latinos-Speaking-Spanish_Report.pdf |
| R2-S33 | BLS, National Compensation Survey, family leave benefits fact sheet | https://www.bls.gov/ebs/factsheets/family-leave-benefits-fact-sheet.htm |
| R2-S34 | Arctic Shift API documentation (method only) | https://github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md |
| R2-S35 | Arctic Shift, r/beyondthebump posts, query "baby book", 1 Jan 2025 to 1 Oct 2026 (24 results, 3 relevant) | https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=beyondthebump&query=baby%20book&after=2025-01-01&before=2026-10-01&limit=50 |
| R2-S36 | Arctic Shift, r/beyondthebump comments, "baby book", 1 Aug to 1 Oct 2026 (30 results, 1 relevant) | https://arctic-shift.photon-reddit.com/api/comments/search?subreddit=beyondthebump&body=baby%20book&after=2026-08-01&before=2026-10-01&limit=50 |
| R2-S37 | Arctic Shift, r/NewParents comments, "baby <-> book", 1 Jan to 1 Oct 2026 (40 results, 3 relevant) | https://arctic-shift.photon-reddit.com/api/comments/search?subreddit=NewParents&body=baby%20%3C-%3E%20book&after=2026-01-01&before=2026-10-01&limit=50 |

**Not opened (refused or rate-limited on 3 Oct 2026); anything that depends on these is Unverified:**

- Apple customer reviews RSS, for example https://itunes.apple.com/us/rss/customerreviews/id=1332312787/sortby=mostrecent/json (robots.txt).
- Trustpilot Storyworth pages 2 and 3 and Remento page 3 (HTTP 403); star-filtered views (robots.txt).
- Reddit direct search (site blocked); most Arctic Shift queries (HTTP 422 and 429).
- Seltzer et al. 2012, instant messages versus speech: https://pmc.ncbi.nlm.nih.gov/articles/PMC3277914/
- Koenecke et al. 2020, racial disparities in automated speech recognition: https://pmc.ncbi.nlm.nih.gov/articles/PMC7149386
- Richter et al. 2019, parents' sleep after childbirth: https://pubmed.ncbi.nlm.nih.gov/30649536/
- Abrams et al. 2016, children's brain response to a mother's voice: https://med.stanford.edu/content/dam/sm/sasnl/documents/14_Abrams_MothersVoice.pdf
- C.S. Mott poll on sharenting, 2015: https://www.mottpoll.org/sites/default/files/documents/031615_sharenting_0.pdf
