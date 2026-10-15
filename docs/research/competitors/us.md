# Early Letters: US competitive map (October 2026)

Research lead 1. Prepared 2026-10-03. Scope: US products a parent might use instead of Early Letters, as of October 2026. This file extends and corrects `docs/research/COMPETITIVE_RESEARCH.md` (1 Oct, cited here as **CR**) and `docs/research/USER_RESEARCH.md` (**UR**). It does not repeat them; where CR already covers something and nothing changed, this file says so in one line.

**Evidence tags**
- **V** Verified: I opened the page or data on 2026-10-03 and the claim is on it. Every V carries a source tag [U#] (list at the end).
- **I** Inferred: my reasoning from verified facts. Treat as a hypothesis.
- **U** Unverified: reported by a third party or a single user review, or I could not open the primary page.

**Method (V unless marked)**
- Product discovery: about 40 App Store keyword searches through the iTunes Search API (US storefront) [U1], the products named in the brief, CR's list, Reddit, Product Hunt and press.
- App Store data for 44 apps (rating, rating count, first release, last update, UI languages, the full in-app purchase list, and the privacy "nutrition label") was pulled from each app's US App Store page and the Lookup API on 2026-10-03 [U1]. In-app purchase (IAP) prices are what Apple shows to US buyers; the list shows at most 10 items and does not label the billing period, so periods are read from the item name (I where ambiguous).
- Review mining: 4,115 US App Store reviews across 31 apps from Apple's public review feeds (most recent and most helpful, up to 500 per app) [U83]. The 379 one- and two-star reviews dated 2024-01-01 or later were keyword-coded into complaint themes (section 9). Counts describe recent reviewers who wrote reviews, not the population.
- Reddit: r/beyondthebump, r/NewParents, r/daddit and r/Mommit via the Arctic Shift archive (title search plus full comment trees for 14 relevant threads) [U84].
- Privacy: each product's privacy policy was searched for advertising, data sale and AI training language; the App Store label was read separately. Where they disagree, both are shown.
- Design notes come from each app's first three App Store screenshots (viewed 2026-10-03) plus the listing copy. I did not install the apps, so flows and performance are not tested (gap).

**Conflict of interest.** I am Claude, made by Anthropic. One finding below (FamilyAlbum, section 3.3) concerns a privacy-policy change that names Anthropic as an AI vendor and the parent backlash that followed. I report it as found and quote the policy and reviews directly; read my framing of it with that in mind.

**Content rule note.** Quotes from reviews and policies are copied with straight quotes and without emoji to meet the repo's text rules; wording is otherwise unchanged. Long quotes are cut with "...".

---

## 0. Bottom line

1. **The category grew a crowded "voice and letters" long tail in 2026.** At least eight new US apps launched between December 2025 and July 2026 with Early Letters-like promises: Tiny Treasures (voice capsule, family phone line, "no streaks, no guilt"), Dearest (letters plus voice, on-device and iCloud only), Moments (age-sorted baby book with letters and voice notes), Dear Ones, The Days We Keep, Tiny Voices, Legacy Odyssey and DearBaby. Each has 0 to 10 App Store ratings, so none has traction yet, but they already use our positioning words: calm, sealed, by age, their voice [U37][U39][U41][U42][U43][U44][U45][U46]. (V for launches and copy; I for "no traction".)
2. **Month-of-age filing is not unique. This corrects CR section 5 point 7.** TinyNest, BackThen, FamilyAlbum, Moments and Tiny Treasures all label or sort by the child's age, and The Short Years has "one chapter devoted to the sweet moments of each month of baby's first year" [U17][U15][U11][U41][U39][U26]. (V; FamilyAlbum's age labels seen in its App Store screenshots)
3. **What is still unclaimed (I, from the capability matrix in section 4):** a spoken letter that keeps the original voice *and* a faithful, readable transcript that the machine never rewrites, transcribed on the phone, filed by month of age, written by both parents, and read aloud together. Competitors either rewrite with AI (FirstChapter, Sproutbook, Remento's narrative mode, Storyworth's guided interviews, Forevermore's voice cloning) or refuse to transcribe at all (Tiny Treasures: "Never transcribed") [U35][U33][U54][U52][U51][U40].
4. **Incumbents are squeezing free users.** Qeepsake is "mov[ing] to a paid-only system" and deactivating inactive free accounts (help centre, V) [U4]; reviewers describe years of entries locked behind a paywall [U2][U83]. Tinybeans' free tier carries ads (ad-free is a paid feature) and reviewers report a rise from about $40 to $75 a year [U7][U83]. FamilyAlbum added full-screen ads in mid-2026 (reviews, U) [U11][U83].
5. **AI near children's memories now causes visible backlash.** FamilyAlbum's privacy policy (last updated 10/02/2026) lists Anthropic "to provide customer support and to improve search functionality" next to five advertising vendors; a cluster of one-star reviews on 2026-05-26 says parents are deleting four years of photos over it [U13][U11][U83]. The Short Years' "AI option on each page" and Qeepsake's AI-generated prompts drew one-star reviews too [U25][U2]. (V for policy and reviews.)
6. **Privacy labels contradict marketing.** 17 of the 44 apps declare "Data Used to Track You", including several that say "no ads" or "no data-sharing" (BackThen, Moment Garden, TinyNest) [U15][U22][U17]. Only two story apps (LivesToTell, withyou) declare "Data Not Collected" [U60][U62]. A clean label is a cheap, real differentiator (I).
7. **Apple is a stronger default than in CR.** Shared albums created on iOS 27 or later keep originals at full resolution (counted against the owner's iCloud storage) with up to 100 participants (Apple, published 2026-09-14) [U73]. Apple Journal is free, transcribes voice, syncs iPhone, iPad and Mac, and its data is end-to-end encrypted by default [U71][U72]. Neither has child structure, co-authorship of one book, or read-aloud.
8. **Price:** Early Letters at $4.99 a month matches the category's monthly floor ($4.99, seven of 20 apps) and sits below the median ($6.24); $49.99 a year equals the annual median ($49.99, section 8), above the cheapest annual plans (Tiny Treasures, Bloom at $29.99). Both plans keep a free trial (1 month on monthly, 2 months on annual); the 2-month trial is the longest found, most competitors use 7 to 30 days or a free tier. (Updated for the 4 Oct 2026 price change, D-082.)
9. **Top complaints (section 9):** billing and cancellation, upload failures and lost content, unanswered support, paywalls on existing memories, ads and upsells, price rises, unwanted AI.
10. **Scale ceiling (V):** Tinybeans Group (Tinybeans plus Qeepsake) reported about 93,000 paid subscribers, about 0.8 million monthly active users, US$4.82M subscription revenue and 96% Tinybeans+ annual retention for FY26 [U9]. That implies roughly $52 subscription revenue per paid subscriber per year (I). The category leader is a small business; FY27 plans include "extending the experience beyond photos and video" [U9], so voice is a plausible next move for them (I).

---

## 1. Corrections and additions to CR (1 Oct 2026)

| CR said | What I found on 2026-10-03 | Tag |
|---|---|---|
| No competitor organises by month of age (CR 5.7) | Six or more do (bottom line point 2). The differentiator is the *combination*, not the filing. | V [U17][U15][U11][U41][U39][U26] |
| Qeepsake has no free tier | It has "Qeepsake Lite" (view old entries, preview book) but is moving to paid-only and deactivating inactive free accounts, holding them one year for restoration. | V [U4] |
| Qeepsake prices $47.88 / $95.88 | Web still shows $47.88 and $95.88 a year; the App Store charges $47.99 and $95.99, and lists an extra "Qeepsake Plus" SKU at $35.99 and $47.99 that is not on the web page. What "Plus" is: U. The web page still shows a promo code that "ends 6/15/25". | V [U3][U2] |
| FirstChapter $9.99 / $49.99, 5.0 (5 ratings) | US App Store: $6.99 a month, $39.99 a year; 0 US ratings (CR read the Canadian store). Free tier: 3 AI voice memories a month. | V [U35][U36] |
| Dearest: shared authorship unverified; "nothing is ever used to train AI" | Listing describes a single private vault on the device or the user's iCloud; sharing is through story cards and a legacy contact (Plus). The privacy policy is softer than the listing: no training "without clear, separate consent". | V [U37][U38] |
| Day One Silver $8.99 a month | Day One's own guide says "monthly plans are not offered"; the App Store lists a Silver monthly SKU at $8.99. Both shown; treat monthly as available on iOS only. Audio transcription is capped at 10 minutes and needs an internet connection. | V [U65][U70][U66] |
| Day One shared journal limits unverified | Up to 30 people per shared journal; individual entries stay private unless shared. | V [U67] |
| Apple Journal sharing unverified | No sharing feature in the listing; multiple journals, print or export, iCloud sync across iPhone, iPad, Mac; Journal data is end-to-end encrypted in iCloud under standard protection. It also has streaks. | V [U71][U72] |
| Storyworth app status unverified | No Storyworth app in the US App Store (searched by name). Pricing page body says $69 / $99 / $199, but its own FAQ on the same page says Basic $59 and Color $109: internal conflict. | V [U1][U52] |
| Storyworth AI stance not covered | New policy (effective 2026-10-28): data from AI features "helps us improve our AI models"; customer content is not used "to train external AI systems". Phone stories can be word-for-word or turned into narrative by "guided interviews". | V [U53][U52] |
| Lifecake closed 2020, migrated to BackThen | Consistent: BackThen calls itself "From the team behind Lifecake". | V [U15] |
| Remento | Unchanged: $99 first year with one book; renew $99 a year or $12 a month; English and Spanish; not used to train AI. Add: uses Meta, Google and TikTok ad pixels; still "No app". | V [U54][U55] |
| Tinybeans | Prices unchanged ($7.99 / $74.99). Add: free tier has ads, legacy $4.49 / $39.99 SKU still sold, policy allows "machine learning to analyze User Content", Freestar ad partner, FY26 numbers in point 10. | V [U7][U8][U9] |
| Apple Shared Albums | iOS 27 changed the model (bottom line point 7). | V [U73] |
| Not covered in CR | TinyNest (4.92, 4,233 ratings, launched April 2025), BackThen, FamilyAlbum, The Short Years, Forevermore, Tiny Treasures, Moments, Dear Ones, The Days We Keep, Rosebud, Untold, Cluster, PhotoCircle and others. Profiled below. | V |

---

## 2. Market structure (US, October 2026)

| Cluster | What parents buy | Leaders (US App Store ratings) | Business model | Relevance to Early Letters |
|---|---|---|---|---|
| A. Private photo albums | A safe place to share baby photos with grandparents | FamilyAlbum 4.88 (375,170), Tinybeans 4.86 (104,229), BackThen 4.85 (28,913), 23snaps 4.80 (11,451), TinyNest 4.92 (4,233), Moment Garden 4.84 (3,878) | Freemium, ads in free tiers, $2.99 to $12.99 a month, prints | Where most families already keep memories; the grandparent channel. Not a words product. |
| B. Prompted baby books with print | A finished baby book without scrapbooking | Qeepsake 4.89 (14,632), The Short Years 4.92 (4,832), BabyPage 4.82 (4,098), Baby Notebook 4.81 (1,955), Chatbooks 4.84 (249,267, photo books) | Subscription plus print margin, or one-time book bundle ($129) | Closest job ("fill the baby book"); text-first, no voice. |
| C. Voice and life-story services | A parent's or grandparent's stories, often a gift | Remento (web, Trustpilot "1,800+ reviews" per its site), Storyworth (web), StoryCorps 4.64 (1,585), Forevermore 4.68 (630) | One-year gift bundle with a book ($69 to $199), or subscription | Proves voice-as-keepsake and QR-to-audio; most rewrite with AI. |
| D. 2026 indie "letters, voice, capsule" apps | Letters and voice notes for a child, sometimes sealed | Tiny Treasures 5.0 (7), Dearest 5.0 (1), Moments 5.0 (1), Dear Ones 5.0 (2), The Days We Keep 5.0 (2), Tiny Voices 4.60 (10) | $29.99 to $59.99 a year; some lifetime | Same positioning words as ours; no scale yet. |
| E. AI baby journals | "Talk for 30 seconds, AI writes the entry" | Sproutbook 4.69 (13), FirstChapter (0 US ratings), Bebememo 4.79 (336, AI photo detection) | $39.99 to $59.99 a year | Opposite of our constitution; the foil for "we never rewrite". |
| F. General journals | Personal journaling, sometimes about kids | Apple Journal 4.78 (327,248), Day One 4.83 (118,382), Reflectly 4.57 (81,691), Rosebud 4.89 (3,309), Untold 4.90 (2,229) | Free (Apple) to $107.99 a year (AI journals) | Default "good enough" tools; AI journals rewrite and coach. |
| G. Platform photo sharing | Shared albums inside tools already owned | Google Photos 4.83 (1,595,015), Apple Photos Shared Albums (built in) | Storage upsell ($0.99 to $59.99 a month) | Free default for grandparent sharing (r/daddit thread below). |

All ratings V [U1], read 2026-10-03.

**Size signals (V unless marked)**
- Tinybeans Group FY26 (year to June 2026): revenue US$6.49M (+35%), subscription revenue US$4.82M (+45%), about 93,000 paid subscribers, about 0.8M MAU, 270,000 free users, 96% Tinybeans+ annual retention, about six-year average tenure, first adjusted-EBITDA-positive year (US$427k) [U9]. The Qeepsake acquisition "delivered approximately 80% subscriber growth on day one" [U9].
- Store-page claims (self-reported, U): Qeepsake "Loved by over 800,000 parents", Tinybeans "1M+ families", TinyNest "100,000+ families", BackThen "240+ million memories", Day One "+15 million users", Rosebud "150,000+ happy users", Remento "1M+ stories recorded" [U2][U7][U18][U15][U70][U75][U54].
- Regulation cited by Tinybeans as a tailwind: the US KIDS Act (including COPPA 2.0) passed the House in June 2026 [U9]. Not independently verified here (U); legal owners should check status.

### 2.1 App Store data for every app profiled (US storefront, 2026-10-03) [U1]

"Tracks you" means the developer's App Store privacy label includes "Data Used to Track You". "Third-party ads" means the label lists "Third-Party Advertising" as a purpose. Labels are self-declared and "not verified by Apple".

| App (seller) | App Store rating (count) | First release | Last update | UI languages | Tracks you (ATT label) | Third-party ads purpose |
|---|---|---|---|---|---|---|
| [Qeepsake: Family Photo Album](https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787) (Tinybeans USA Ltd) | 4.89 (14,632) | 2018-04-10 | 2026-09-08 | English | Yes | No |
| [Tinybeans Private Family Album](https://apps.apple.com/us/app/tinybeans-private-family-album/id521633042) (Tinybeans USA Ltd) | 4.86 (104,229) | 2012-05-10 | 2026-09-24 | English | Yes | Yes |
| [FamilyAlbum: Share Baby Photos](https://apps.apple.com/us/app/familyalbum-share-baby-photos/id935672069) (MIXI, Inc.) | 4.88 (375,170) | 2014-12-17 | 2026-09-18 | English and 7 more | Yes | Yes |
| [BackThen - Baby Book & Albums](https://apps.apple.com/us/app/backthen-baby-book-albums/id1505173822) (BACK THEN DIGITAL LIMITED) | 4.85 (28,913) | 2020-04-27 | 2026-09-29 | English | Yes | No |
| [TinyNest - Family Album](https://apps.apple.com/us/app/tinynest-family-album/id6743824334) (Tiny Nest AI LLC) | 4.92 (4,233) | 2025-04-10 | 2026-09-24 | English and 30 more | Yes | No |
| [23snaps: Private Family Album](https://apps.apple.com/us/app/23snaps-private-family-album/id526481189) (23 SNAPS LIMITED) | 4.80 (11,451) | 2012-05-17 | 2026-09-21 | English | Yes | No |
| [Moment Garden: Your Baby Album](https://apps.apple.com/us/app/moment-garden-your-baby-album/id499969127) (Contarini Ventures, LLC) | 4.84 (3,878) | 2012-04-04 | 2026-09-30 | English | Yes | Yes |
| [Notabli - Family Social](https://apps.apple.com/us/app/notabli-family-social/id580644870) (Super Important, Company) | 4.66 (70) | 2013-01-28 | 2024-10-16 | English | No | No |
| [The Short Years Baby Book](https://apps.apple.com/us/app/the-short-years-baby-book/id1327539226) (Unbound Applications, INC) | 4.92 (4,832) | 2018-08-01 | 2026-08-02 | English | No | No |
| [BabyPage: Baby Book & Journal](https://apps.apple.com/us/app/babypage-baby-book-journal/id1362796822) (BabyPage Inc) | 4.82 (4,098) | 2018-05-15 | 2026-09-29 | English | Yes | No |
| [Baby Notebook - Photo Book](https://apps.apple.com/us/app/baby-notebook-photo-book/id1518127990) (BABY NOTEBOOK LLC) | 4.81 (1,955) | 2020-11-18 | 2026-08-17 | English | Yes | Yes |
| [Bebememo - Smart Baby Journal](https://apps.apple.com/us/app/bebememo-smart-baby-journal/id1494276528) (Bebememo, Inc.) | 4.79 (336) | 2020-01-18 | 2026-09-29 | English and 8 more | Yes | No |
| [Chatbooks](https://apps.apple.com/us/app/chatbooks/id734887606) (Chatbooks, Inc.) | 4.84 (249,267) | 2013-11-07 | 2026-09-29 | English | Yes | No |
| [Sproutbook: Baby Journal](https://apps.apple.com/us/app/sproutbook-baby-journal/id6751468842) (Palex & Co. LLC) | 4.69 (13) | 2026-02-22 | 2026-09-15 | English | No | No |
| [FirstChapter: AI Baby Journal](https://apps.apple.com/us/app/firstchapter-ai-baby-journal/id6760676959) (Solvesoft Corp.) | none (0) | 2026-06-01 | 2026-09-17 | English | No | No |
| [Baby Book: Dujourbaby](https://apps.apple.com/us/app/baby-book-dujourbaby/id1665601226) (Dujourbaby) | 5.00 (5) | 2023-03-12 | 2026-10-02 | English | No | No |
| [Dearest: Letters & Memories](https://apps.apple.com/us/app/dearest-letters-memories/id6790823627) (Luke Cichocki) | 5.00 (1) | 2026-07-22 | 2026-08-20 | English | No | No |
| [Tiny Treasures: Voice Capsule](https://apps.apple.com/us/app/tiny-treasures-voice-capsule/id6788518267) (LocalSquare LLC) | 5.00 (7) | 2026-07-16 | 2026-09-30 | English | No | No |
| [Moments: A Digital Baby Book](https://apps.apple.com/us/app/moments-a-digital-baby-book/id6761346182) (Dustin Driese) | 5.00 (1) | 2026-04-08 | 2026-09-25 | English and Spanish | No | No |
| [Dear Ones: Family Memory Book](https://apps.apple.com/us/app/dear-ones-family-memory-book/id6774687543) (Kinzi Herron) | 5.00 (2) | 2026-06-05 | 2026-07-28 | English | No | No |
| [The Days We Keep](https://apps.apple.com/us/app/the-days-we-keep/id6755585543) (Agubit Technologies Inc) | 5.00 (2) | 2025-12-11 | 2026-08-30 | English | No | No |
| [Tiny Voices - Family Memories](https://apps.apple.com/us/app/tiny-voices-family-memories/id6759920530) (B Gilmore, LLC) | 4.60 (10) | 2026-04-01 | 2026-08-18 | English | No | No |
| [Legacy Odyssey: Baby Book](https://apps.apple.com/us/app/legacy-odyssey-baby-book/id6760883565) (DOR Industries, LLC) | 5.00 (3) | 2026-04-06 | 2026-07-15 | English | No | No |
| [DearBaby: Baby Legacy](https://apps.apple.com/us/app/dearbaby-baby-legacy/id6758726991) (Amr Ibrahim) | none (0) | 2026-02-25 | 2026-08-20 | English | No | No |
| [Bloom Baby Book](https://apps.apple.com/us/app/bloom-baby-book/id6753892387) (REAPPS L.L.C.) | none (0) | 2026-01-14 | 2026-01-14 | English and German | No | No |
| [Dear Baby - Pregnancy Journal](https://apps.apple.com/us/app/dear-baby-pregnancy-journal/id6740467933) (Namu) | none (0) | 2025-01-14 | 2025-01-15 | English | No | No |
| [Baby Book : Folio](https://apps.apple.com/us/app/baby-book-folio/id1269281693) (Green Gables Studio, LLC) | 4.39 (723) | 2017-08-15 | 2023-10-09 | English | No | No |
| [Airloom](https://apps.apple.com/us/app/airloom/id1614187533) (Montage Social LLC) | 2.60 (5) | 2022-03-31 | 2022-06-05 | English | No | No |
| [Forevermore - Save Their Voice](https://apps.apple.com/us/app/forevermore-save-their-voice/id6756802019) (FAMILY FOREVER HOLDINGS LLC) | 4.68 (630) | 2026-02-06 | 2026-09-30 | English and 6 more | Yes | Yes |
| [HereAfter AI](https://apps.apple.com/us/app/hereafter-ai/id1626176069) (HereAfter Inc.) | 1.50 (8) | 2023-01-23 | 2023-09-01 | English | No | No |
| [StoryCorps](https://apps.apple.com/us/app/storycorps/id359071069) (StoryCorps, Inc.) | 4.64 (1,585) | 2010-05-03 | 2026-03-23 | English | Yes | No |
| [Storylines: Life Stories](https://apps.apple.com/us/app/storylines-life-stories/id6469046982) (First Time Media Inc.) | 4.80 (122) | 2023-12-20 | 2026-10-02 | English | Yes | Yes |
| [LivesToTell: Voice Memoir](https://apps.apple.com/us/app/livestotell-voice-memoir/id6748242195) (LivesToTell, LLC) | 4.93 (14) | 2026-04-08 | 2026-09-17 | English | No (Data Not Collected) | No |
| [withyou - save family stories](https://apps.apple.com/us/app/withyou-save-family-stories/id6751854792) (Sanflo LLC) | 4.33 (61) | 2025-10-07 | 2026-03-26 | English | No (Data Not Collected) | No |
| [Capsle Stories: Family Legacy](https://apps.apple.com/us/app/capsle-stories-family-legacy/id1554817576) (VTC, LLC) | 5.00 (29) | 2021-09-08 | 2026-07-06 | English | Yes | No |
| [Heirloom4Life: Voice Keeper](https://apps.apple.com/us/app/heirloom4life-voice-keeper/id6757370122) (Ehud Riesenberg) | 4.67 (24) | 2026-01-07 | 2026-09-26 | English | Yes | Yes |
| [Day One: Daily Journal & Diary](https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788) (Bloom Built Inc) | 4.83 (118,382) | 2016-02-04 | 2026-09-28 | English and 25 more | No | No |
| [Journal](https://apps.apple.com/us/app/journal/id6447391597) (Apple Inc.) | 4.78 (327,248) | 2023-10-26 | 2025-12-12 | English | No | No |
| [Rosebud: AI Journal & Diary](https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127) (Just Imagine, inc.) | 4.89 (3,309) | 2024-08-06 | 2026-10-02 | English and 17 more | No | No |
| [Reflectly - Journal & AI Diary](https://apps.apple.com/us/app/reflectly-journal-ai-diary/id1241229134) (Kodeon, Inc.) | 4.57 (81,691) | 2017-07-30 | 2026-09-18 | English | No | No |
| [Untold - Voice Journal](https://apps.apple.com/us/app/untold-voice-journal/id6451427834) (Thoughts ACC, Inc.) | 4.90 (2,229) | 2023-11-02 | 2026-08-16 | English | No | No |
| [Google Photos: Backup & Edit](https://apps.apple.com/us/app/google-photos-backup-edit/id962194608) (Google LLC) | 4.83 (1,595,015) | 2015-05-28 | 2026-10-01 | English and 38 more | No | Yes |
| [Cluster](https://apps.apple.com/us/app/cluster/id596595032) (Cluster Labs, Inc.) | 4.81 (22,089) | 2013-02-27 | 2026-09-28 | English | No | No |
| [PhotoCircle](https://apps.apple.com/us/app/photocircle/id517539894) (PhotoCircle, Inc.) | 4.87 (124,810) | 2012-04-19 | 2026-09-22 | English | Yes | Yes |


---

## 3. Product profiles

Each profile uses the same fields. "Reviews" quotes are US App Store reviews pulled from Apple's public review feed for that app [U83]; each shows stars, date and title so it can be found on the app's page. Reddit quotes link to the exact comment. Prices are US App Store IAP prices on 2026-10-03 unless a web page is cited.

### 3.1 Qeepsake (Tinybeans Group): prompted baby journal plus print

- **What and platforms (V):** Daily age-informed question prompts by SMS or app; answers plus photos and video become a journal and a printed book. iOS, Android, web. Prompts cover pregnancy, adoption, IVF to school years; entries can be backdated [U2].
- **Pricing (V, 2026-10-03):** Web: Essential $4.99 a month or $47.88 a year; Premium $9.99 a month or $95.88 a year; 7-day trial, card charged at trial end; Essential limits entries and allows 2 journals and 2 questions a day; Premium unlimited, 4 questions a day, "Add Family Contributors"; book credits $19.99 and $61.99 [U3][U5]. App Store: $4.99 / $9.99 monthly, $47.99 / $95.99 annual, plus an unexplained "Qeepsake Plus" SKU at $35.99 and $47.99 [U2]. Free "Qeepsake Lite" can view old entries and preview the book but cannot order books or text in entries; inactive free accounts are being deactivated "as we move to a paid-only system" [U4].
- **Capture modes (V):** SMS reply, app text, photos, video. No voice recording found.
- **AI and rewriting:** No rewriting found. Reviewers report AI-generated prompts since spring 2026 ("seasonally inappropriate") and AI-written support replies (U, reviews) [U2][U83].
- **Privacy (V):** Policy (last updated 2025-12-15) lists "To deliver targeted advertising to you", a possible third-party "offer wall", and "We do not sell your personal information to third parties" [U6]. App Store label: tracks you (Usage Data, advertising data); data linked to you used for "Developer's Advertising or Marketing" [U2]. No AI-training statement found.
- **Family sharing (V):** Family Contributors are Premium only [U3]. Family can subscribe to a weekly email digest (Reddit, [i6pzvhl](https://www.reddit.com/r/beyondthebump/comments/ueuia2/comment/i6pzvhl/)).
- **Print and export:** Journal Books and Chapter Books (V) [U4]. Export appears to be a paid PDF; reviewers cite about $15 (U) [U83].
- **Languages (V):** English UI [U2]; prompts English (I).
- **Rating (V):** 4.89 (14,632) [U1]. Of 407 reviews pulled, 68 are one or two stars.
- **Parents love:** "Tonight the text question made me stop and document a beautiful moment putting our daughter to bed and the things that were said." (5 stars, 2026-07-21, "I can't stop now"). "When I give them their Qeepsake books every few years, they get so excited and read every word." (5 stars, 2026-01-23) [U2][U83]
- **Parents hate:** "I have almost 6 years of memories on my account and I have to either pay for an annual membership or pay to have my memories sent on a one time pdf... I can't even view what was saved." (1 star, 2026-05-18, "Used to be worth it..."). "I was getting a spam marketing text once day while postpartum" (1 star, 2026-08-19). "the $65 credit expires annually rather than rolling over" (1 star, 2025-11-13). "Do not sign up for qeepsake. They will bill you forever and not even send you notice" (Reddit, [niannir](https://www.reddit.com/r/NewParents/comments/1mzasqc/comment/niannir/)).
- **Design notes (V from screenshots, I for judgement):** Lavender and serif, warm but busy marketing frames; the core screen is a question card over a photo feed. Seven five-star reviews dated 2026-01-20 in the sample suggest an in-app rating prompt campaign (I).
- **Lesson for Early Letters (I):** The prompt-by-text habit works; the paywall-on-old-memories move is the single biggest trust failure in the category this year.

### 3.2 Tinybeans: private photo album, category incumbent

- **What and platforms (V):** Invite-only family photo and video journal sorted by date, with email updates for followers and photo books. iOS, Android, web [U7].
- **Pricing (V):** Free: 20 uploads a month, 5 GB, ads. Tinybeans+: $7.99 a month or $74.99 a year, unlimited uploads, 5-minute videos, 200 GB, ad-free, "2nd user account to share"; two-week free trial. Legacy Tinybeans+ SKU $4.49 / $39.99 still listed [U7].
- **Capture modes (V):** Photos, videos, captions; "Who is in this moment" tagging and "Hidden moment" privacy toggle (screenshots) [U7].
- **AI (V):** Policy allows "automated processes and machine learning to analyze User Content" [U8]. No generative writing found.
- **Privacy (V):** Policy last updated 2024-04-02: will not sell personal information to unrelated third parties for their marketing without consent; third-party advertisers and Freestar place ads and cookies [U8]. Label: tracks you (location, contact info, user content, identifiers, usage data) and lists Third-Party Advertising [U7].
- **Family sharing (V):** Followers by owner invite; second adult account is a paid feature [U7]. CR covers follower onboarding.
- **Print and export:** Photo books in app (V) [U7]. A 2024 reviewer: "CANNOT EXPORT MEMORIES!" (U) [U83].
- **Languages (V):** English [U7].
- **Rating (V):** 4.86 (104,229) [U1]. Recent review sample is harsh: 146 of 382 pulled reviews are one or two stars.
- **Parents love:** "Staying connected to family is the most important thing for me and this app helps that tremendously!" (4 stars, 2026-06-25, military family). "It keeps the grandparents from doomscrolling. Worth it." (Reddit, [ojvbkje](https://www.reddit.com/r/daddit/comments/1t3i9id/comment/ojvbkje/), May 2026)
- **Parents hate:** "if you are just trying follow your new grandchild, I don't think requiring a $75 subscription to avoid ads is a viable solution" (2 stars, 2026-07-26). "removed the dates from your pictures so when you're uploading you can't tell what day your picture was taken" (2 stars, 2026-08-26). "we paid for a lifetime plus membership to avoid the annoying ads. After a year or two, they got rid of the lifetime and made us pay annually" (1 star, 2025-07-25; single report, U) [U7][U83].
- **Design notes:** Modern pink and white, month photo grid, "App of the Day" badge; recent UI rework drew complaints (V reviews).
- **Lesson (I):** A revoked "lifetime" is the reputational risk of Early Letters' planned P2 lifetime plan. If lifetime ships, its terms must be unrevocable in writing.

### 3.3 FamilyAlbum (MIXI): the free default for grandparent sharing

- **What and platforms (V):** Free unlimited photo and video storage in a shared family album, auto-organised by month with the child's age shown on items (screenshot shows "James, 5 mos"), comments, "seen by" visitor list, 1-second movies, monthly free prints [U11][U12]. iOS, Android, web upload with Premium.
- **Pricing (V):** Free with ads. Premium One $2.99 a month; Premium Family $5.99 a month or $59 a year; Premium Family Pro $10.99 a month or $109 a year; sticker subscription $3.99 [U11]. "11 free prints every month" per family member, shipping paid [U12].
- **Capture modes (V):** Photos, videos, comments. No voice or journaling.
- **AI (V):** Policy (last updated 10/02/2026) lists "AI suggestions for uploading local media", search improved by "feature vectors obtained by converting images and text", and Anthropic "to provide customer support and to improve search functionality" [U13]. No rewriting.
- **Privacy (V):** Summary page: "We don't sell your data to any third parties, even in the form of anonymized statistical data" [U14]. Full policy lists AppsFlyer, Meta, X, Google Ad Manager and Auxia for advertising and analytics [U13]. Label: tracks you (identifiers), Third-Party Advertising [U11].
- **Family sharing (V):** Unlimited invited family; all can upload (Reddit, [ltctejm](https://www.reddit.com/r/NewParents/comments/1gacjcp/comment/ltctejm/)); admin controls (Reddit, [ltczp51](https://www.reddit.com/r/NewParents/comments/1gacjcp/comment/ltczp51/)).
- **Print and export:** Prints, photo books, DVDs (V) [U13]. No bulk export even on the top tier, per a 2026 reviewer (U) [U83].
- **Languages (V):** UI in English, French, German, Japanese, Korean, Simplified and Traditional Chinese, Spanish [U11].
- **Rating (V):** 4.88 (375,170), the largest family-memory app by ratings [U1].
- **Parents love:** "This is a great way to watch our great granddaughter grow since we don't live close." (5 stars, 2026-10-01). "We've never paid for it and it does what it needs to do. We have about 10 people invited" (Reddit, [ltctejm](https://www.reddit.com/r/NewParents/comments/1gacjcp/comment/ltctejm/)).
- **Parents hate:** "This was a wonderful app until about 2 months ago when they added the full screen ads as you swipe through the photos." (1 star, 2026-09-25). "there is no way to mass download/export the photos and videos you've uploaded (even with the most expensive paid subscription which advertises a 'bulk download' feature)" (2 stars, 2026-08-10). "This app quietly added Anthropic/AI to 'descriptive search' photos... I am canceling my premium account and working on removing four years of photos" (1 star, 2026-05-26, one of eight one-star reviews in the sample on 2026-05-26 that mention AI or Anthropic) [U11][U83]. (Conflict of interest noted at the top.)
- **Design notes:** Photo-first, simple, month tabs; grandparent-friendly. Ads and store promotions now dominate complaints.
- **Lesson (I):** Disclosing any AI subprocessor for children's media, even for search or support, reads to parents as "selling my baby's face to AI". Early Letters v1.0 sends nothing to AI servers (PRD 2.2); say so plainly, and treat any future server AI as a consent-gated, separately announced change.

### 3.4 BackThen: Lifecake's successor, age-first photo journal

- **What and platforms (V):** Private family journal "from the team behind Lifecake"; per-child timelines with an age counter (years, months, days) at the top, milestones, height and weight, face-change timelapse, photo books; iOS, web, email upload [U15].
- **Pricing (V):** 1 GB free; VIP $6.49 a month (no annual SKU listed) [U15]. Reviewers: price rose from about $2 (2015) to $4.99 to $6.49 (U) [U83].
- **Capture modes (V):** Photos, video, milestones, measurements. No voice found.
- **AI (V):** "Unique timelapse technology"; auto highlights and reels [U15]. No text generation.
- **Privacy:** Listing: "No ads. No data-sharing. Ever." Policy (last modified 2022-09-01) mentions "providing more relevant content and advertising on the device" [U16]. Label: tracks you (device ID) [U15]. Contradiction (V).
- **Family sharing (V):** Invite with permissions; grandparents can upload (review) [U15][U83].
- **Print and export (V):** Photo books, calendars, prints in US, UK, Canada, Europe; "all your content returned if you choose to leave" [U15].
- **Languages (V):** English [U15].
- **Rating (V):** 4.85 (28,913) [U1].
- **Love:** "Easy to find photos by date or age, loads quickly unlike some others I've used" (5 stars, 2026-09-19).
- **Hate:** "Had since 2015. Was like $2 a month then. Now it's $7. They're just banking on families not wanting to lose access" (2 stars, 2025-10-23). "I lost 200 plus photos of my son." (1 star, 2024-10-10). "I'm only using this because some family can't use Shared Albums on the iOS Photos app" (1 star, 2026-06-03) [U15][U83].
- **Design notes:** Loud teal and yellow display type in store frames; app itself is a dense social feed. Functional, not calm.

### 3.5 TinyNest: fastest-growing new photo album (age-sorted)

- **What and platforms (V):** Launched April 2025. Invite-only album; "every photo and video you upload is automatically sorted by your baby's age"; per-member screenshot blocking and logging; download and share permissions; iOS, iPad, Android [U17][U18].
- **Pricing (V):** "Family Unlimited Access" $12.99 a month or $79.99 a year; "Gift Lifetime Access" $199.99 [U17]. Site says "free to download with unlimited photo storage" and Pro unlocks "unlimited videos, unlimited memory generation" [U18]. Reviewers say the price appears only after inviting family (U) [U83].
- **Capture modes (V):** Photos, videos. No voice or text journaling found.
- **AI:** "Memory generation" and "intelligent throwback memories" (V) [U17][U18]; how it works: U. Privacy policy does not mention AI (V) [U19].
- **Privacy (V):** "never shared publicly, never used for ads" (site) [U18]; policy: "We do not sell your personal information" [U19]; label: tracks you (identifiers) [U17].
- **Family sharing (V):** Unlimited invites by link; fine-grained per-member permissions [U18].
- **Print and export:** None found (U).
- **Languages (V):** UI in English and 30 more, including Hindi [U17].
- **Rating (V):** 4.92 (4,233) after 18 months [U1]; site claims "100,000+ families" (U).
- **Love:** "My twins were born 11 weeks early... TinyNest has made it incredibly easy to keep all of our family updated in the same place" (5 stars, 2026-09-07).
- **Hate:** "after I shared links with family/friends it tells me there's a subscription" (3 stars, 2026-08-24). "the app also exposes your email address to everyone who can view the albums" (1 star, 2026-09-18). "require access to my entire photo album before I can even test out the app" (2 stars, 2026-09-12) [U17][U83].
- **Design notes:** Bubbly pink, rounded type, age labels on every tile ("Maria, 9 mo"). Fast onboarding, aggressive monetisation.
- **Lesson (I):** Age-sorting plus grandparent permissions is enough to win ratings quickly. Paywall after the invite step is resented; show price before asking parents to invite family.

### 3.6 The Short Years: app plus physical binder book

- **What and platforms (V):** Weekly reminder to answer prompts and add a photo; pages are printed and mailed every three completed chapters into a fabric ring binder; 19 chapters including "one chapter devoted to the sweet moments of each month of baby's first year"; QR codes on pages play uploaded videos [U25][U26].
- **Pricing (V):** Book "From $129" including printing and shipping of first-year pages; "The Toddler Years" add-on $89 at checkout; in-app "Digital Book Download" $7.99 [U26][U25].
- **Capture modes (V):** Text answers, photos, video (QR). No voice-to-text found.
- **AI (U):** A reviewer (2025-09-19) says "the developers have added an AI option to each page" [U83]; not confirmed on the listing.
- **Privacy (V):** "We will never sell or share your information" [U27]. Label: no tracking; data used for developer's marketing [U25].
- **Family sharing:** Not found (U).
- **Print and export (V):** Core product is print; digital download $7.99 [U25].
- **Languages (V):** English [U25].
- **Rating (V):** 4.92 (4,832), the highest-rated baby book app [U1].
- **Love:** "great features like uploading videos that are easy to access with QR codes printed on the pages" (5 stars, 2026-04-30). "It's pricey, but the app makes it so easy to fill out while baby is nursing" (Reddit, [i5n0hbw](https://www.reddit.com/r/NewParents/comments/u8rp7f/comment/i5n0hbw/)).
- **Hate:** "the developers have added an AI option to each page. Really?? We don't need AI for everything." (1 star, 2025-09-19). "The prompts are restrictive and it feels like a complete rip off. I never have the time to fill it out." (Reddit, [l5b1vby](https://www.reddit.com/r/NewParents/comments/u8rp7f/comment/l5b1vby/)).
- **Design notes:** Warm terracotta and serif; the physical book is the hero. Closest aesthetic peer for a premium printed Year One (I).

### 3.7 BabyPage and Baby Notebook: subscription baby books with print

- **BabyPage (V):** Prompts by stage ("2 weeks, 2 months, 2 years"), "automatically generated content and descriptions of your child at every stage", pregnancy journals, printed books; $7.99 a month, $13.99 for 3 months, $44.99 a year; 7-day trial [U28]. Policy uses remarketing and Facebook custom audiences [U29]; label tracks user content and diagnostics [U28]. Rating 4.82 (4,098). Love: "This app is the only reason my kids have baby books! You don't have to write a novel, you just answer the multiple choice questions" (5 stars, 2026-06-25). Hate: "I spend time putting together a page only to have it not save." (2 stars, 2024-08-26) [U83].
- **Baby Notebook (V):** Weekly prompts, hide or swap pages, hardbound first-year book; Plus $6.99 a month, Premium $49.99 a year, extra pages $1.99 to $69.99, digital PDF $9.99 [U30]. Label tracks contact info and lists Third-Party Advertising [U30]. Rating 4.81 (1,955). Love: "I generally write my monthly update while nursing them to bed at night" (5 stars, 2026-09-20). Hate: "it's a subscription on top of then buying your book" (1 star, 2025-03-02, "Cash grab") [U83].
- **Lesson (I):** "Multiple choice plus details if you want" lowers effort; charging to fill the book and again to print it is resented.

### 3.8 Older private albums: 23snaps, Moment Garden, Notabli

- **23snaps (V):** Private album with email digests; Premium $5.49 a month, Premium Plus $7.99 a month, gift 12 months $65.99 [U20]. Policy reports "aggregate information to our advertisers" [U21]; label tracks usage data [U20]. 4.80 (11,451). Love: "Email digests to friends and family stand out... No need to do tech support for older family members" (5 stars, 2026-05-12). Hate: "locking every basic feature behind a paid subscription while rolling out zero new features" (1 star, 2025-04-01) [U83].
- **Moment Garden (V):** Free album since 2010, weekly digest emails so grandparents need no app, Moment Books; "Star" tiers $4.99 a month or $49.99 a year (several multi-child SKUs) [U22]. Listing: "AD FREE - we'll never show you ads or share your data with advertisers"; policy: "We may from time to time share such data with third parties such as prospective investors, affiliates, partners and advertisers" [U23]; label tracks contact info, user content, identifiers, usage and diagnostics and lists Third-Party Advertising [U22]. Contradiction (V). 4.84 (3,878). Love: "The email digest is just what extended family wants" (5 stars, 2026-09-08). Hate: "I ordered a photo book 6 weeks ago (for $156) and it never came." (1 star, 2023-10-04) [U83].
- **Notabli (V):** "Calm and private family social network" with photos, video, audio recordings, notes and "quote moments"; Plus $4.99 / $49.99, Plus-One $6.99 / $69.99 [U24]. Last app update 2024-10-16 (about two years stale). 4.66 (70). Love: "Private, we own the content, and not an ad to be seen anywhere... lack of updates is starting to worry" (5 stars, 2026-06-11) [U83].
- **Lesson (I):** Email digests are the proven no-app channel for grandparents. Early Letters defers the web contribution page to v1.1; a read-only digest could be a cheaper interim bridge (founder decision).

### 3.9 Chatbooks: photo-book subscription

- **V:** 4.84 (249,267); no in-app purchases (books bought outside IAP) [U31]; label tracks identifiers [U31]. Pricing in CR, not re-verified. Of 296 reviews pulled, 94 are one or two stars, dominated by cancellation and support complaints (section 9). Hate: "make sure you use all your credits before you cancel a subscription because you will lose any unused credits" (2 stars, 2026-09-09). Reddit praise: "They had a crazy promo 12 mini monthly books for $12" ([ojrqzxz](https://www.reddit.com/r/beyondthebump/comments/1t23s2w/comment/ojrqzxz/)).

### 3.10 Bebememo: AI photo detection baby journal

- **V:** Detects baby photos on the phone with AI and uploads in one tap; sorts "base on the baby's age"; family sharing with visibility controls; $8.99 a month or $59.99 a year; UI in 9 languages including Arabic; "AD-FREE. We don't share your data with advertisers."; label tracks device ID [U32]. 4.79 (336). Hate: "If you want to lose your baby photos download this app." (1 star, 2026-01-21) [U83].

### 3.11 Tiny Treasures (LocalSquare LLC): the closest new competitor

- **What and platforms (V):** Launched 2026-07-16. Voice messages and photos for a child, "gently labeled by age"; share with family now or seal until the child opens the capsule; family can add their own; a "family phone line" a grandparent can call or text so "their voicemail lands straight in the capsule, no app needed"; parents can review phone-line messages before sharing; CarPlay recording (iOS 26.4+) [U39][U40].
- **Pricing (V):** Free with one child and personal backup; family participation needs "The whole family" at $4.99 a month, $29.99 a year, or $99 once ("forever"); invited relatives record free [U39][U40].
- **Capture modes (V):** Voice, photos, written notes, video; voicemail by phone.
- **AI and rewriting (V):** None, by design: "There is no transcription and no voice analysis, ever"; policy: "We do not transcribe recordings, identify speakers, create voiceprints, infer emotion, scan for keywords" [U39][U40].
- **Privacy (V):** "We do not sell family data or build advertising profiles"; without an account, recordings stay on the phone and device backups [U40]. Label: no tracking; some data used for developer's marketing [U39].
- **Family sharing (V):** Per-message choice of family or private-until-opened; in-app private messages visible only to their author until the child opens the capsule [U39].
- **Print and export (V):** "Export your saved recordings as one audio file, free, offline, with no account needed." No print [U39].
- **Languages (V):** English UI [U39]; no transcription so speech language is irrelevant.
- **Rating (V):** 5.0 (7) [U1].
- **Love:** "I love the voicemail feature. How special is it that our little one will be able to have her family members voices saved forever" (5 stars, 2026-08-07) [U83].
- **Design notes:** Cream and dark brown, serif headings, "Seal this for Drew" sheet; reads like our design language (I).
- **Threat (I): High on positioning, low on scale today.** It owns "no streaks, no guilt", sealed messages, grandparent phone line and a $29.99 annual price. Early Letters' answer is the readable letter: a faithful transcript you can read aloud, search and print, which Tiny Treasures refuses to produce.

### 3.12 Dearest (independent): letters and voice in a private vault

- **What and platforms (V):** Launched 2026-07-22. Letters with gentle prompts, voice notes, photos, videos; imported voicemails are "filed on the day it was originally recorded"; sealed letters for future dates; PIN and Face ID; edit history; widgets; ZIP export; iOS and visionOS [U37].
- **Pricing (V):** Free tier (letters, voice, import, prompts, widgets, export); Plus $4.99 a month or $49.99 a year for unlimited items, scheduled sealing, Face ID, printable books and a legacy contact [U37]. "If your subscription ends, nothing is taken from you."
- **AI (V):** None in the product. Listing: "nothing is ever used to train AI"; policy: "We do not train AI models on your private family content without clear, separate consent" [U37][U38].
- **Privacy (V):** "stays on your device and, if you choose, your own personal iCloud. Dearest never hosts, reads, or sells"; label: data not linked to you (purchases, identifiers) [U37].
- **Family sharing (V):** None in the shared-book sense; story share cards and a legacy contact [U37].
- **Rating (V):** 5.0 (1) [U1].
- **Design notes:** Dark navy and gold, editorial serif: "Secure by design. Personal by nature." Premium and calm (I).
- **Threat (I):** Strong on privacy story (no server at all). Early Letters needs a crisp answer for why it has a server: co-parent shared book, backup, and family reading.

### 3.13 Moments, Dear Ones, The Days We Keep, Tiny Voices, Legacy Odyssey, DearBaby (2026 long tail)

| App (launch) | What it does | Price (V) | Notable | Rating |
|---|---|---|---|---|
| Moments: A Digital Baby Book (2026-04) | One album per child "sorted by age, date, and location"; photos, video, voice notes, letters to a future self; "Before They Arrived" chapter; time-locked "gift key" that unlocks at 18; co-parent sharing by "handoff key"; legacy contacts; on-device image search; full VoiceOver, Dynamic Type [U41] | $4.99 a month, $39.99 a year | Strong accessibility and co-parent story; English and Spanish UI | 5.0 (1) |
| Dear Ones (2026-06) | Letters (sealed or now), voice notes, selfie videos, quotes, milestones per family member; letters render in serif, cursive or handwritten font; print hardcover, layflat or softcover (US); PDF export "with the voice and video saved alongside"; grandparents join by code [U42] | $7.99 a month, $59.99 a year | Closest print-plus-voice package | 5.0 (2) |
| The Days We Keep (2025-12) | Photos, reflections, milestones, voice memories, letters, time capsules, designed memory cards [U43] | Essentials $4.99 / $34.99; Unlimited $9.99 / $59.99 | "No ads, no data selling, ever" (site) | 5.0 (2) |
| Tiny Voices (2026-04) | One-tap recording of a child's voice, quotes, photos, milestones, timeline, surprise memories [U44] | $6.99 a month, $49.99 a year | "The baby book you'll actually use" | 4.60 (10) |
| Legacy Odyssey (2026-04) | Baby book published as a private website at the child's own .com domain; month 1 to 12 milestones; letters in "The Vault"; family views in a browser with no app [U45] | No IAP listed | Novel no-app family access | 5.0 (3) |
| DearBaby: Baby Legacy (2026-02, UK developer) | Photos, video, voice memos, letters; "The Voice Year": "Every recording finds its own month. At the end of the year, play all twelve back to back" [U46] | No IAP listed | Month-by-month voice playback, close to Read together | none |

All V from the App Store listings on 2026-10-03 [U1]. None has more than 10 ratings, so none is proven (I). Three of them (Moments, Dear Ones, Dearest) independently arrived at sealed letters, voice, per-child books and print, which suggests these are becoming table stakes for new entrants (I).

### 3.14 AI baby journals: Sproutbook, FirstChapter, Dujour

- **Sproutbook (V):** "30 seconds a day" voice or text notes plus photos; "AI-crafted recaps" turn entries into weekly and monthly stories shared automatically with family; 30-day trial, then $6.99 a month or $59 a year, with recaps and family sharing paid [U33]. Policy: journal entries, photos and metadata are shared with "our AI partners"; agreements forbid training "public AI models using individual, identifiable user data", but "we are neither responsible for or capable of managing our AI partner's data retention practices"; Meta pixel and lookalike audiences [U34]. 4.69 (13). Love: "A baby book that writes itself... the AI recaps turn the chaos into a sweet, shareable story." (5 stars, 2026-02-28) [U83].
- **FirstChapter (V):** "No typing. No writing. Just your voice... AI shapes your words into a heartfelt journal entry"; store tagline "The baby journal that writes itself"; weekly recaps "with highlights, mood patterns, and badges"; free 3 AI voice memories a month, Premium $6.99 a month or $39.99 a year with 30 a month, family sharing and export [U35][U36]. "We never sell your data, never train models on your entries" [U36]. Label shows Audio Data linked to the user [U35]. 0 US ratings.
- **Dujour Baby (V):** Print-first baby book, 5.0 (5), no IAP listed [U1]. CR notes "AI polish messy notes" (not re-checked).
- **Lesson (I):** These products sell exactly what Early Letters refuses: rewriting and gamified recaps (badges, mood patterns). Parents who want that are not our segment; parents who distrust it (section 9, theme 7) are.

### 3.15 Remento: voice-first life stories with QR book

- **What and platforms (V):** Weekly prompt by email or SMS; storyteller records by tapping a link on any device, "no app or login needed"; recordings up to 30 minutes; collaborators choose prompts; year-end hardcover with a QR code per chapter that plays the original recording [U54].
- **Pricing (V):** $99 includes a year and one hardcover book (up to 200 pages; $30 surcharge to 380 pages); renew $99 a year or $12 a month; extra copies $69 (to 200 pages) or $99 (201 to 380); 30-day money-back guarantee; inactive accounts can still view and download everything [U54].
- **AI and rewriting (V):** "Speech-To-Story": either a word-for-word transcript with "ums" removed, or a "flowing narrative" in first or third person, concise or detailed; stories remain editable [U54]. AI-personalised follow-up prompts (Remento comparison page) [U56].
- **Privacy (V):** FAQ: "Your content is not used to train any AI models"; export text, PDF and audio any time; delete account any time [U54]. Policy: Meta, Google and TikTok pixels for targeted advertising [U55].
- **Family sharing (V):** Collaborators add photos and questions; storyteller needs no account [U54].
- **Languages (V):** English and Spanish; Spanish recordings print in Spanish with QR codes [U54].
- **Rating:** No app. Site claims "1,800+ reviews" on Trustpilot and "1M+ stories recorded" (self-reported, U) [U54]. Trustpilot itself could not be opened (403 and rate limit). CR's Trustpilot quotes stand (not re-verified).
- **Lesson (I):** Remento is the proof that families pay $99 for voice plus book, and that "transcript or narrative" is a choice many want. Early Letters takes the transcript side only; that must be framed as fidelity, not as a missing feature.

### 3.16 Storyworth: weekly questions, printed memoir

- **What and platforms (V):** One storyteller gets a weekly question by email (text on upper plans), writes by email or web, or records by phone; family get stories by email; hardcover at the end. "Celebrations" collect stories from many people. No US iOS app found [U52][U1].
- **Pricing (V):** Basic $69, Color $99, Unlimited $199 (renews at $99); extra books $39 to $99. The same page's FAQ says Basic $59 and Color $109 (conflict) [U52].
- **AI and rewriting (V):** Phone stories either "a word-for-word transcription" or "guided interviews to turn a conversation into a written narrative"; "Built-in proofreader"; free e-book and audiobook downloads [U52].
- **Privacy (V):** Stories encrypted in the database; private by default [U53]. Policy effective 2026-10-28: AI inputs and outputs "help us improve our AI models"; "We do not use customer content (stories, photos, or voice recordings) to train external AI systems"; analytics and advertising cookies with opt-out [U53].
- **Rating:** Trustpilot 4.7 (65,073) per CR (not re-verified).
- **Lesson (I):** Storyworth markets against competitors with "Phone call recording preserves your authentic voice without AI rewriting your stories" [U56], so "no rewriting" is already a sales line in the gift-memoir segment.

### 3.17 StoryCorps: free archival interviews

- **V:** Free app; guided flow (prepare, questions, record, review, publish); uploads to the Library of Congress and the StoryCorps Archive; no IAP [U58]. 4.64 (1,585), last update 2026-03-23 [U1]. Policy allows targeted ads on its sites [U58]; label tracks usage data [U58].
- **Love:** "it's so easy to archive recordings to the cloud." (5 stars, 2026-04-12).
- **Hate:** "I logged in for the first time since the recording only to find that StoryCorps had not preserved the audio file properly. It's completely ruined" (1 star, 2025-04-11). "Recorded a 30 minute interview and at the end was interupted by an alarm on phone going off. It deleted the whole interview." (1 star, 2023-03-15) [U83].
- **Lesson (I):** Interrupted recordings and silent audio corruption are the worst failures in voice keepsakes. Early Letters needs interruption-safe recording (calls, alarms, Siri) and integrity checks on stored audio.

### 3.18 Forevermore: voice memoir plus voice cloning of loved ones

- **What and platforms (V):** Launched 2026-02-06. AI voice interviewer, topics, a daily question, 10-minute recording cap; private sharing to chosen people; "Echo" lets users upload audio or video of a person and "type in any message that you would like to hear in their voice"; "Essence is your personal AI in training, built from the stories you record" [U51].
- **Pricing (V):** Many concurrent prices (likely price tests, I): monthly $9.99, $14.99, $19.99; annual $24.99 to $69.99; "Special Offer" $19.99 [U51].
- **Privacy (V):** Label tracks purchases, contact info, identifiers and usage, and lists Third-Party Advertising [U51]. Privacy page could not be read (script-rendered).
- **Languages (V):** UI in English, French, German, Italian, Nepali, Portuguese, Spanish [U51].
- **Rating (V):** 4.68 (630) in eight months [U1].
- **Love:** "Hearing a personalized message from my grandma who passed away so many years ago was exactly what I needed." (5 stars, 2026-09-22).
- **Hate:** "this device could not duplicate so it put a random white women instead that my family members sound nothing like" (1 star, 2026-09-20). "this definitely can't replicate their actual voice" (2 stars, 2026-09-22) [U83].
- **Lesson (I):** Demand for hearing a loved one's voice is real and emotional. The ethical line (no cloning, no synthetic speech of the author) should be explicit in Early Letters' policy; the adjacent-benchmarks file covers this.

### 3.19 HereAfter AI, StoryKeeper, Saga and other story apps

| Product | Status and facts (2026-10-03) | Tag |
|---|---|---|
| HereAfter AI | Web service live; it offers a "Life Story Avatar" that family can talk to. iOS app last updated 2023-09-01, 1.5 stars (8). IAP: Starter $3.99, Storyteller $5.99, Unlimited $7.99 a month; one-time $99.99, $159.99, $199.99 [U57]. Treat as dormant on iOS. | V |
| StoryKeeper | No iOS app found in the US store. storykeeper.ai shows only an email sign-up page. Competitor pages describe it as prompts by email, voice or video answers polished by AI, softcover books with QR codes, up to 10 collaborators [U56]. | V (absence), U (features) |
| Saga ("Saga Voice Journal for Family") | Not found in the US App Store by name. Only third-party listings describe it (voice stories, landline call-in) [U59]. The name now belongs to an unrelated AI company (saga.xyz). Likely discontinued (I). | V (absence), I |
| LivesToTell | Launched 2026-04; "story engine transforms interviews, memory recordings, and photos into beautifully written stories"; $6.99 a month, $69.99 a year; label "Data Not Collected"; 4.93 (14) [U60]. | V |
| Storylines | Photo, video, voice note and journal "Storylines" with contributors; $9.99 a month, $69.99 a year, token packs; tracks usage data, Third-Party Advertising; 4.80 (122) [U61]. | V |
| withyou | Send questions by text; relatives answer by voice with no app; listing says $34.99 a year but IAP shows $59.99 a year and $89.99 lifetime (conflict); "Data Not Collected"; 4.33 (61) [U62]. Hate: "on the final page it's a big eff you, letting you know you have to pay $10 a week or $60 a year" (1 star, 2026-02-22). | V |
| Capsle Stories | Prompted video or text answers from elders; family pack $40 a year, individual $15; tracks identifiers and usage; 5.0 (29) [U63]. | V |
| Heirloom4Life | AI interviewer "Sam" runs 20 to 40 minute sessions; family can "ask a question and hear an answer in their own words... drawn from everything they've ever shared"; tracks identifiers, Third-Party Advertising; 4.67 (24) [U64]. | V |

### 3.20 Day One (Automattic): premium journal benchmark

- **What and platforms (V):** Journal for iPhone, iPad, Mac, Apple Watch, Android and web; photos, video, audio, PDFs, templates, prompts, "On This Day"; end-to-end encryption for new entries [U65][U69][U70].
- **Pricing (V):** Basic free (prompts, export to PDF, JSON, plain text). Silver $49.99 a year (renamed from Premium in March 2026): up to 30 media per entry, audio recording, email-in, 25% off book printing. Gold $74.99 a year: Silver plus all AI features, 35% off printing. The guide says monthly plans are not offered; the App Store lists Silver monthly at $8.99. Family Sharing does not apply [U65][U70].
- **Capture and transcription (V):** Standard audio up to 3 hours with no transcription, or transcription recording up to 10 minutes; transcription needs internet and uses the device language [U66].
- **AI (V):** Gold only: Daily Chat (with voice mode via OpenAI's Realtime API), Go Deeper prompts, entry and multi-entry summaries, highlights, image generation. "your entries are not used to train AI models unless you have explicitly given permission, and we don't keep your AI requests on our servers"; AI can be turned off in Settings [U68].
- **Privacy (V):** Does not "sell" or "share" personal data under US state law definitions; policy last revised 2024-04-22 [U69]. Label: no tracking; some data linked for developer's marketing and analytics [U70].
- **Sharing (V):** Shared Journals with up to 30 people; personal entries stay private [U67].
- **Print and export (V):** Book printing (discounted on paid tiers), PDF, JSON, text export [U65].
- **Languages (V):** UI in English and 25 more, including Hindi and Arabic [U70].
- **Rating (V):** 4.83 (118,382) [U1].
- **Love:** "the comfort of knowing that I can back up, save, and print a separate file. Day One does everything I need it to and more." (5 stars, 2026-03-04).
- **Hate:** "I'm side-eyeing the direction it's going in, starting with the needlessly clumsy interface overhaul" (5 stars but critical, 2026-04-12). "Ever since Bloom Built switched this to a subscription app it felt like all their GUX people fled." (2 stars, 2025-04-17) [U83].
- **Lesson (I):** Day One is the reference for calm privacy controls (AI off switch, per-feature privacy notice, E2E) and for honest export. Its 10-minute, online-only transcription is a gap Early Letters' on-device transcription beats.

### 3.21 Apple Journal: the free built-in

- **What and platforms (V):** Free; iPhone, iPad and Mac with iCloud sync; journaling suggestions from on-device intelligence; photos, video, "Record your voice directly into your journal and have it transcribed automatically"; handwriting and Apple Pencil; multiple named journals; Places map; Insights with streaks; Face ID lock; print or export [U71]. Journal data is end-to-end encrypted in iCloud under standard data protection [U72].
- **Pricing (V):** Free (iCloud storage applies) [U71][U74].
- **AI (V):** On-device suggestion engine; no generative writing in the listing [U71].
- **Sharing (V):** None in the listing [U71].
- **Languages:** Listing shows English; "Certain features are available only in select languages and regions" [U71]. Transcription language coverage: U.
- **Rating (V):** 4.78 (327,248) [U1].
- **Love:** "you get everything on Journal that you do for high priced journal apps." (5 stars, 2026-10-01).
- **Hate:** "only for me to highlight a word, and it got cut, so I hit the redo arrow and it cleared almost everything I wrote" (1 star, 2026-05-09). "the app completely DELETES a huge portion of my entry" (1 star, 2026-01-15) [U83].
- **Lesson (I):** For a single parent writing alone, Apple Journal is free and private. Early Letters has to win on the shared book, per-child month structure, faithful transcript review, Read together and family authorship. Avoid streaks: Apple's Insights view shows a "Weeks streak" counter (screenshot), which is the guilt pattern our content rules ban.

### 3.22 AI journals: Rosebud, Untold, Reflectly

- **Rosebud (V):** AI journal and coach with voice input; "Reflect. Heal. Grow."; claims 150,000+ users. Bloom $12.99 a month or $107.99 a year; Thrive 2x $24.99 / $199.99; Thrive 5x $59.99 / $499.99 [U75]. Policy (updated 2026-09-08): uses OpenAI, Anthropic, Google, AWS and Groq; machine-run quality evaluations on real interactions; Meta, Google and Apple ad pixels, but "your journal entries and personal reflections are never sent to these advertising providers" [U75]. UI in 18 languages including Hindi. 4.89 (3,309). Hate: weekly AI usage limits ("I reached my entire weekly AI usage limit after roughly a day or two", 2 stars, 2026-09-28) [U83].
- **Untold (V):** Voice journal: "seamless speech-to-text AI", follow-up questions, AI-written "short stories" and "personality breakdowns" about you; $12.99 a month or $107.99 a year [U77]. Policy: never sells journal data; "We will never use your journal data to train AI models, unless you explicitly opt into it"; shares with OpenAI, Anthropic and Hume, which may not train on identifiable data [U77]. 4.90 (2,229). Love: "my spoken responses are written out so I don't lose my train of thought" and "The functioning system that creates an ongoing glossary of people is a very nice addition" (5 stars, 2026-09-30 and 2026-08-10). Hate: a 2026 paywall added "without a single notification" (1 star, 2026-05-02) [U83].
- **Reflectly (V):** AI diary; premium $4.99 to $59.99 across SKUs; 4.57 (81,691); label: no tracking [U76]. Hate: "The AI is horrible with LGBTQ related entries" (1 star, 2026-03-08) [U83].
- **Lesson (I):** Untold's "glossary of people" is the same idea as Early Letters' name dictionary, and users notice it. AI journals monetise usage limits; parents writing to a child should never meet a word cap.

### 3.23 Google Photos and Apple Shared Albums: the free defaults

- **Google Photos (V):** Shared albums (invite or link), partner sharing, auto-add faces to albums (Reddit, [ltd17wq](https://www.reddit.com/r/NewParents/comments/1gacjcp/comment/ltd17wq/)); Gemini features (Ask Photos, a "Remember List" of facts); "Your personal data in Google Photos is never used for ads"; "We don't train any generative AI models outside of Google Photos with your personal data in Google Photos" [U79]. US photo books: 7-inch softcover and 9-inch hardcover, 20 to 140 pages [U80]. Storage IAP: 100 GB $1.99 a month or $19.99 a year, 200 GB $2.99, Google AI Plus 2 TB $9.99 [U78]. Label lists Third-Party Advertising as a purpose [U78]. 4.83 (1,595,015). Current hate (U, several September 2026 reviews): the iOS app requires full photo-library access to work ("Won't work unless you give google all of your photos and videos", 1 star, 2026-09-30) [U83]. Reddit: "Google Photos offers this functionality through shared albums and it's free" ([ojv9688](https://www.reddit.com/r/daddit/comments/1t3i9id/comment/ojv9688/)).
- **Apple Shared Albums (V):** Built into Photos. For albums created on iOS 27 or later: originals at full resolution, counted against the owner's iCloud storage, no album count limits beyond storage, up to 100 participants; older albums keep the 2048-pixel, 720p, 5,000-item limits [U73]. Shared Albums do not support Advanced Data Protection [U72]. iCloud+ is $0.99 (50 GB) to $59.99 (12 TB) a month [U74]. Reddit: "If you're all in the Apple ecosystem you can simply make a shared album" ([ojvlyxo](https://www.reddit.com/r/daddit/comments/1t3i9id/comment/ojvlyxo/)).
- **Lesson (I):** For photos, free platform tools are good enough for most families; that is why Early Letters should not compete on photo sharing. Words and voice are not served by either.

### 3.24 Other photo-sharing apps

- **Cluster (V):** Private group albums; Friend $4.99 / $49.99, Family $9.99 / $99.99, Pro $19.99 / $199.99; 4.81 (22,089) [U81]. Hate: "My first nephew was born in 2016 and this app is still the exact same with terrible UI" (1 star, 2025-03-15) [U83].
- **PhotoCircle (V):** Shared circles; Pro $1.29 a month or $9.99 a year; tracks contact info, identifiers and usage; Third-Party Advertising; 4.87 (124,810) [U82].

### 3.25 Closed, stale or ambiguous names from the brief

| Name in brief | Finding (2026-10-03) | Tag |
|---|---|---|
| Lifecake | Closed 30 June 2020 (CR); BackThen is run by the same team [U15]. | V |
| Airloom | iOS app last updated 2022-06-05, 2.6 stars (5); airloom.com now redirects to an unrelated Thales page [U49]. Defunct (I). | V, I |
| Bloom | "Bloom Baby Book": one release on 2026-01-14, 0 ratings, $5.99 a month or $29.99 a year, English and German UI [U48]. Many unrelated "Bloom" baby trackers exist. | V |
| BabyBook | No distinct US product found. Nearest: "Baby Book: Folio" (4.39, 723 ratings, last update 2023-10-09, sticker IAPs) and "BabyBook album" (0 ratings, 2023) [U50][U1]. | V |
| Dear Baby | Three unrelated tiny apps: "Dear Baby - Pregnancy Journal" (one 2025 release, 0 ratings) [U47], "DearBaby: Baby Legacy" (3.13), and a baby-food tracker. | V |
| Saga, StoryKeeper, HereAfter | See 3.19. | V |
| Product Hunt | producthunt.com refused automated access (403). Mirror data shows only low-traction 2026 launches in the space, for example Nestori ("The memory app built for parents, not social media"), 0 upvotes, not featured [U85]. | V |

---

## 4. Capability matrix

Legend: **Y** yes, **N** no, **P** partial or paid-only, **?** not verifiable from public pages. Cells come from the profiles above (sources there). Early Letters row is the v1.0 plan from the brief and PRD, not shipped behaviour.

| Product | Voice kept as keepsake | Speech to text | Machine writes or rewrites words | Filed by child's age | Second parent free | Family adds without installing | Sealed or future letters | Print book | Full export | Read-aloud for the child | Speech languages beyond English | Tracks you (label) | Annual price |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Early Letters v1.0 (plan)** | Y (original never altered) | Y, on the phone | **N** (spelling, script, punctuation, fillers only, with diff) | Y (month of age) | Y (co-parent role) | N (web page v1.1) | N (P1) | N (PDF book in export; print later) | Y, free forever | Y (Read together; 3 free sessions, then Plus) | Y: 7 languages | N (opt-in analytics) | $29.99 |
| Qeepsake | N | N (texts) | N (AI prompts reported) | P (age-informed prompts) | N (Premium) | Y (SMS for parent; email digest for readers) | N | Y | P (paid PDF) | N | N | Y | $47.99 / $95.99 |
| Tinybeans | N | N | N (ML analysis of content) | N (by date) | N (paid) | P (email updates, read-only) | N | Y | ? | N | n/a | Y | $74.99 |
| FamilyAlbum | N | N | N (AI search) | Y (age labels) | Y | ? | N | Y | N (no bulk, per review) | N | n/a | Y | $59 / $109 |
| BackThen | N | N | N | Y (age counter) | Y | Y (email, web) | N | Y | Y | N | n/a | Y | $77.88 (monthly only) |
| TinyNest | N | N | N | Y | Y (unlimited invites) | N | N | ? | ? | N | n/a | Y | $79.99 |
| The Short Years | N (video QR) | N | ? (AI option reported) | Y (month chapters, year one) | ? | N | N | Y (core) | P ($7.99 digital) | N | N | N | $129 once |
| Tiny Treasures | Y | **N (never)** | N | Y (age labels) | P (family needs paid plan) | Y (phone line) | Y | N | Y (audio file) | P (listen) | n/a | N | $29.99 or $99 once |
| Dearest | Y | N | N | N | N (single vault) | N | Y | P (Plus) | Y (ZIP) | N | n/a | N | $49.99 |
| Moments | Y (voice notes) | ? | N | Y | Y (handoff key) | N | Y (gift key) | ? | ? | P (Relive reels) | n/a | N | $39.99 |
| Dear Ones | Y | ? | N | P (per-person timelines) | Y (share code) | N | Y | Y | Y (PDF plus media) | N | n/a | N | $59.99 |
| Sproutbook | ? | Y | **Y (AI recaps)** | N (weekly) | P (paid) | P (recap emails) | N | N | ? | N | ? | N | $59 |
| FirstChapter | ? | Y | **Y (AI writes entries)** | ? | P (Premium) | N | N | P (Premium) | P (Premium) | N | ? | N | $39.99 |
| Forevermore | Y | P | **Y (voice cloning, AI persona)** | N | n/a | N | N | N | ? | P (listen) | ? | Y | $24.99 to $69.99 |
| Remento | Y (QR in book) | Y | Optional (narrative mode) | N | Y (collaborators) | Y (link, no app) | N | Y | Y | P (QR playback) | Y: Spanish | n/a (web) | $99 first year |
| Storyworth | P (phone) | Y | Optional (guided interviews, proofreader) | N | Y | Y (email, phone) | N | Y | Y | P (audiobook) | ? | n/a (web) | $69 to $199 |
| StoryCorps | Y | N | N | N | n/a | N | N | N | P (archive) | P (listen) | N | Y | free |
| Day One | P (Silver) | P (10 min, online) | P (Gold AI is opt-in, separate) | N | P (shared journals) | N | N | Y (discount) | Y | N | Y (device language) | N | $49.99 / $74.99 |
| Apple Journal | Y | Y | N | N | N | N | N | P (print to PDF) | P | N | P (select languages) | N | free |
| Google Photos | N | N | N (AI search) | N | Y | Y (link) | N | Y | ? | N | n/a | N (3P ads purpose listed) | storage |
| Apple Shared Albums | N | N | N | N | Y | ? | N | N | P | N | n/a | N | free / iCloud |

**Reading the matrix (I):**
- Only Early Letters (plan) combines Y in the first five columns with N in "machine writes or rewrites words". The nearest rows are Tiny Treasures (no transcript at all), Remento (rewrite optional, not baby-focused, no age filing) and Moments or Dear Ones (voice notes, no transcript).
- Early Letters' weakest columns against the field are "family adds without installing", "sealed letters" and "print book", all deferred by founder decision (PRD 2.2). Tiny Treasures, Remento, Storyworth, BackThen and Moment Garden already serve grandparents without an install.

---

## 5. Privacy and AI stance

| Product | Sells data (policy) | Ads or ad tracking (policy and label) | AI on user content | AI-training statement | Sources |
|---|---|---|---|---|---|
| Qeepsake | No | Policy: targeted advertising, possible offer wall; label tracks | AI prompts (reported) | None found | [U6][U2] |
| Tinybeans | Not to unrelated third parties for their marketing without consent | Ads in free tier; Freestar; label tracks, 3P ads | ML analysis of User Content | None found | [U8][U7] |
| FamilyAlbum | No, "even in the form of anonymized statistical data" | Ad vendors AppsFlyer, Meta, X, Google Ad Manager, Auxia; label tracks, 3P ads | AI upload suggestions, image-vector search; Anthropic for support and search | None found | [U13][U14][U11] |
| BackThen | Location not sold | Listing "No ads"; policy mentions advertising; label tracks | Timelapse tech | None found | [U15][U16] |
| TinyNest | No | "never used for ads"; label tracks | "Memory generation" | None found | [U18][U19][U17] |
| Moment Garden | Not without consent | Listing "AD FREE"; policy may share with advertisers; label tracks, 3P ads | None found | None found | [U22][U23] |
| The Short Years | "never sell or share" | Label: no tracking | AI option (reported) | None found | [U27][U25] |
| Sproutbook | Not "for monetary value" | Meta pixel, lookalike audiences | Entries sent to AI partners for recaps | Partners barred from training public models on identifiable data; retention not controlled | [U34] |
| FirstChapter | "We never sell your information" | Label: no tracking | AI writes entries | "never train models on your entries" | [U35][U36] |
| Dearest | No | No ads, no data mining | None | Listing "nothing is ever used"; policy "without clear, separate consent" | [U37][U38] |
| Tiny Treasures | No | No advertising profiles | None, no transcription, no voiceprints | n/a | [U40] |
| Remento | n/a | Meta, Google, TikTok pixels | Speech-to-Story | "not used to train any AI models" | [U54][U55] |
| Storyworth | n/a | Analytics and advertising cookies, opt-out | Guided interviews, proofreader | AI data improves "our AI models"; no external training on stories, photos or recordings | [U53] |
| Day One | Not "sell" or "share" (US state law) | Label: no tracking | Gold AI via OpenAI, opt-in, can be disabled | Not used to train unless explicit permission | [U68][U69] |
| Apple Journal | n/a | Label: data not linked to you | On-device suggestions | n/a; Journal data end-to-end encrypted | [U71][U72] |
| Rosebud | No | Ad pixels, but journal content never sent to them | Core product (OpenAI, Anthropic, Google, AWS, Groq) | Machine-run quality evaluations on real interactions | [U75] |
| Untold | No | Label: no tracking | Core product (OpenAI, Anthropic, Hume) | No training unless opt-in | [U77] |
| Google Photos | n/a | "never used for ads" (Photos data); label lists 3P ads purpose | Gemini features | No generative training outside Photos | [U79][U78] |

**Patterns (I):**
1. "Private" and "ad-free" are claimed by almost everyone; the App Store labels show 17 of 44 apps track users across other companies' apps (section 2.1). Parents cannot tell the difference today; a label of "Data Not Linked to You" plus no tracking is checkable proof.
2. The AI-training sentence has become standard among newer products (Remento, Dearest, FirstChapter, Day One, Untold, Storyworth). Its absence at Qeepsake, Tinybeans and FamilyAlbum is now noticeable.
3. Vendor disclosure matters as much as training. FamilyAlbum's backlash came from naming an AI vendor in a policy update, not from any claim of training (section 3.3).

---

## 6. Table stakes in October 2026

What a parent now expects from any paid memory app (I, from the matrix and complaints):

1. **Private by default, invite-only, no public profiles.** Every product claims it; claiming it earns nothing.
2. **Photos and short video beside words.** Every product in clusters A, B and D supports them. I could not confirm photo attachments in Early Letters v1.0 from PRD sections 1 to 3 (B-REQ-024 author and child photos is P1); the product owner should confirm the v1.0 answer, because a letters-only book will be compared with photo books.
3. **Family invites with roles and permissions,** including a free second parent (Qeepsake and Tinybeans charging for it is a complaint, not a norm).
4. **Multiple children, each with their own book or timeline** (TinyNest, BackThen, Moments, Qeepsake).
5. **Age-aware prompts or reminders,** with skip and replace (Qeepsake reviews punish prompts that cannot be skipped).
6. **Backdating** (Qeepsake) and **import with original dates** (Dearest files voicemails on the day recorded).
7. **Export of everything, readable after a lapse.** Explicit at Remento, Dearest, Tiny Treasures, Day One; its absence drives one-star reviews at FamilyAlbum and Tinybeans.
8. **A print path.** Almost every baby-book product sells a book; even Google Photos prints. Early Letters v1.0 offers a PDF only (founder decision, K-32).
9. **An app lock** (Face ID or PIN) for journal-type apps (Dearest, Day One, Apple Journal).
10. **A one-line AI-training statement.** Now standard among newer products (section 5).
11. **A free tier or a trial of at least 7 days,** with clear price disclosure before effort is invested.
12. **Cross-platform family access.** Leaders run on iOS, Android and web; grandparents on Android are routine in reviews and Reddit threads (I). Early Letters v1.0 is iOS only.

**No longer differentiators:** filing by age (six-plus apps), sealed letters (Dearest, Moments, Dear Ones, Tiny Treasures, The Days We Keep), recording a voice (most 2026 entrants), "no ads" and "private" (claimed by most, contradicted by many labels).

---

## 7. Whitespace and differentiators for Early Letters

### 7.1 What nobody else offers (I, checked against every row in section 4)

1. **The readable letter that keeps the voice and is never rewritten.** A faithful transcript next to the original recording, with every machine change visible and reversible. Competitors either rewrite (FirstChapter, Sproutbook, Remento narrative, Storyworth interviews), refuse to transcribe (Tiny Treasures, Dearest voice notes), or transcribe without review (Apple Journal, Day One up to 10 minutes online). Storyworth already sells against "AI rewriting your stories" [U56], which shows the message lands with gift buyers.
2. **On-device transcription in seven languages for a baby book.** Remento covers English and Spanish only [U54]; Day One transcribes online in the device language [U66]; baby-memory apps that localise their UI (TinyNest 31 languages including Hindi, FamilyAlbum 8, Bebememo 9) do not transcribe speech at all [U17][U11][U32]. Multilingual families, grandparents speaking their own language, and the original voice kept as proof are an open lane.
3. **Read together.** Playing a month's letters in each author's own voice to the child, with the text on screen. Nearest: DearBaby's "Voice Year" (twelve recordings back to back, no text) [U46], Remento's QR codes (one chapter at a time, in print) [U54], Moments' "Relive" reels (photo-led) [U41].
4. **One book, two authors, each keeping their own raw words private.** Day One shared journals are generic and adult-focused [U67]; Moments shares an album with a co-parent [U41]; Tiny Treasures lets family add messages [U39]. None combines co-authored letters with author-only raw transcripts.
5. **Checkable privacy:** no tracking label, no ads ever, nothing sent to AI servers in v1.0, export free forever, a written shutdown pledge. Dearest and Tiny Treasures match parts of this; the incumbents fail it (sections 3.1 to 3.5).

### 7.2 Threat ranking (I)

| Rank | Competitor | Why it threatens | Where Early Letters wins | Watch for |
|---|---|---|---|---|
| 1 | Tiny Treasures | Same calm voice-capsule pitch, family phone line, $29.99 a year, sealed messages | Readable faithful transcript, Read together, multilingual text, month chapters as a book | Adds transcription, print, or traction past 100 ratings |
| 2 | Apple Journal plus Shared Albums | Free, built in, E2E-encrypted journal with voice transcription; full-resolution shared albums from iOS 27 | Co-authored child book, month structure, faithful review, Read together, no streaks | Apple adds shared journals or child profiles at WWDC |
| 3 | Tinybeans Group (Tinybeans, Qeepsake) | 93,000 paid subscribers, grandparent networks, FY27 plan to go "beyond photos and video" [U9] | Trust: no paywall on old memories, no ads, no tracking; voice | A voice or letters feature, or another acquisition |
| 4 | Dearest | Letters plus voice with a no-server privacy story | Two-parent shared book, transcript, languages | Adds shared vaults |
| 5 | Moments, Dear Ones | Per-child books with letters, voice notes, sealed gifts, co-parent sharing; Dear Ones prints | Transcript, Read together, languages | Any of them reaching 1,000 ratings |
| 6 | Remento | Proven $99 voice-plus-book model; could turn to new parents | Baby and month structure, no rewriting, ongoing use | A "for your baby" product |
| 7 | FamilyAlbum | Largest free family network | Words and voice; no ads; no AI vendors | Adds journaling or voice |
| 8 | FirstChapter, Sproutbook | Same "talk for 30 seconds" capture | The opposite promise: we never write for you | Parent backlash against AI wording, which helps us |

---

## 8. Pricing benchmarks

### 8.1 Subscription prices (US App Store, 2026-10-03, V [U1] and profiles)

| Product | Monthly | Annual | Annual discount vs 12 months | Trial or free tier | Lifetime or one-time | Family terms |
|---|---|---|---|---|---|---|
| **Early Letters (decided)** | $3.99 | $29.99 | 37% | 1 month (monthly), 2 months (annual) | About $99.99 later (P2) | Co-parent via Apple Family Sharing; contributors never gated |
| Qeepsake Essential / Premium | $4.99 / $9.99 | $47.99 / $95.99 | 20% / 20% | 7 days; Lite view-only, ending | None | Contributors Premium only |
| Tinybeans+ | $7.99 | $74.99 | 22% | Free tier with ads; 14-day trial | Reported revoked (U) | Second adult paid |
| FamilyAlbum Premium Family / Pro | $5.99 / $10.99 | $59 / $109 | 18% / 17% | Free tier with ads | None | Premium covers the album |
| BackThen VIP | $6.49 | none | n/a | 1 GB free | None | n/a |
| TinyNest | $12.99 | $79.99 | 49% | Free download, paywall reported after invites | Gift lifetime $199.99 | Unlimited invites |
| 23snaps Premium / Plus | $5.49 / $7.99 | gift 12 months $65.99 | n/a | Free tier | None | n/a |
| Moment Garden Star | $4.99 | $49.99 | 17% | Free | "Unlock" $49.99 (type U) | n/a |
| Notabli Plus / Plus-One | $4.99 / $6.99 | $49.99 / $69.99 | 17% | Free | None | n/a |
| BabyPage | $7.99 | $44.99 | 53% | 7 days | None | n/a |
| Baby Notebook | $6.99 | $49.99 | 40% | ? | Pages and PDF sold separately | n/a |
| Bebememo | $8.99 | $59.99 | 44% | Trial (length U) | None | n/a |
| Sproutbook | $6.99 | $59 | 30% | 30 days | None | Sharing paid |
| FirstChapter | $6.99 | $39.99 | 52% | 3 AI memories a month free | None | Sharing Premium |
| Dearest Plus | $4.99 | $49.99 | 17% | Free tier | None | n/a |
| Tiny Treasures | $4.99 | $29.99 | 50% | Free with one child | $99 once | One plan covers family |
| Moments | $4.99 | $39.99 | 33% | ? | None | ? |
| Dear Ones | $7.99 | $59.99 | 37% | ? | None | "Family" plan |
| The Days We Keep Essentials / Unlimited | $4.99 / $9.99 | $34.99 / $59.99 | 42% / 50% | Guest trial | None | n/a |
| Tiny Voices | $6.99 | $49.99 | 40% | ? | None | n/a |
| Bloom Baby Book | $5.99 | $29.99 | 58% | ? | None | n/a |
| Day One Silver / Gold | $8.99 (iOS) | $49.99 / $74.99 | 54% | Free Basic | Legacy "Plus" only | Family Sharing does not apply |
| Rosebud Bloom | $12.99 | $107.99 | 31% | Trial | None | n/a |
| Untold | $12.99 | $107.99 | 31% | ? | None | n/a |
| Forevermore | $9.99 to $19.99 | $24.99 to $69.99 | varies | ? | None | n/a |

**One-time and gift models (V):** The Short Years from $129 plus $89 Toddler Years [U26]; Remento $99 first year with book, then $99 a year or $12 a month [U54]; Storyworth $69 to $199 [U52]; HereAfter $99.99 to $199.99 one-time [U57]; withyou $89.99 lifetime [U62]; Capsle $15 to $40 a year [U63].

**Platform storage (V):** iCloud+ $0.99 (50 GB), $2.99 (200 GB), $9.99 (2 TB), $29.99 (6 TB), $59.99 (12 TB) a month [U74]; Google One 100 GB $1.99 a month or $19.99 a year, 200 GB $2.99 [U78].

### 8.2 Benchmarks (computed from 8.1, I)

- **Monthly price**, 20 baby and family memory apps: median $6.24, mean $6.64, range $4.99 to $12.99; seven apps sit at the $4.99 floor. No app in this set charges less than $4.99 a month. Early Letters' $3.99 would be the lowest.
- **Annual price**, 18 apps: median $49.99, mean $50.60, interquartile range $39.99 to $59.25, range $29.99 to $79.99. Early Letters' $29.99 ties the lowest (Tiny Treasures, Bloom).
- **Annual discount:** 17% to 58%, typically 20% to 50%; Early Letters' 37% is mid-range.
- **Revenue per paid subscriber:** Tinybeans Group's FY26 subscription revenue divided by paid subscribers is about $52 a year [U9], close to the annual median above.
- **Trials:** 7 days (Qeepsake, BabyPage), 14 days (Tinybeans), 30 days (Sproutbook), or a free tier. Early Letters' 2-month annual trial is the longest found.

### 8.3 What the benchmarks mean (I)

1. Price is not where Early Letters can differentiate; it is already the cheapest. The closest calm products price at $29.99 (Tiny Treasures), $39.99 (Moments), $49.99 (Dearest) and $59.99 (Dear Ones), so there is headroom if conversion is strong. The founder has decided prices; this is a note for later, not a recommendation to change them now.
2. The complaints are about *surprise*, not level: price shown only after inviting family (TinyNest), charges after a forgotten trial (Bebememo, withyou), renewals without notice (Qeepsake on Reddit). PRD's notice schedule (K-38) and Plus-sheet disclosures address the right problem.
3. Lifetime plans exist at $89.99 to $199.99. A lifetime SKU is credible at about $99.99, but Tinybeans' reported revocation of "lifetime" shows the terms must be explicit and permanent.
4. Charging for the second parent is resented; covering the co-parent through Apple Family Sharing and never gating contributors matches the best practice in the set (Tiny Treasures, FamilyAlbum).

---

## 9. Top 15 parent complaints across the category

**Method (V for counts, I for interpretation).** 379 one- and two-star US App Store reviews dated 2024-01-01 to 2026-10-01, from the 31 apps whose feeds I pulled [U83], keyword-coded into 15 themes (a review can hit several). Shares are of those 379 reviews. Keyword coding over-counts a little (for example, some "AI" hits are AI customer-service complaints); I read the examples behind each theme and kept only themes where most examples were on topic. Reddit threads corroborate where linked.

| # | Complaint | Share (n) | Where it concentrates | Representative evidence | Early Letters stance (I) |
|---|---|---|---|---|---|
| 1 | **Billing, cancellation and surprise charges** | 17% (66) | Chatbooks, Tinybeans, Qeepsake, FamilyAlbum | "no way to cancel subscription" (Chatbooks, 1 star, 2026-10-01). "They will bill you forever and not even send you notice" ([Reddit niannir](https://www.reddit.com/r/NewParents/comments/1mzasqc/comment/niannir/)) | Apple-managed billing only, K-38 notices; keep both |
| 2 | **Uploads fail, app crashes, content lost** | 17% (65) | Tinybeans, Chatbooks, Apple Journal, BackThen, BabyPage | "I lost 200 plus photos of my son." (BackThen, 1 star, 2024-10-10). "interupted by an alarm on phone going off. It deleted the whole interview." (StoryCorps, 1 star, 2023-03-15) | Offline-first save, interruption-safe recording, audio integrity checks |
| 3 | **Support does not answer** | 14% (53) | Chatbooks, Qeepsake, Tinybeans, FamilyAlbum | "Did they respond when I asked about upgrading to premium? You bet! Do they respond to me now that I need help? NOPE." (Qeepsake, 1 star, 2025-12-08) | A real reply path at hello@ from day one; publish response time |
| 4 | **Paywall on memories already made; free features removed** | 13% (50) | Tinybeans, Qeepsake, 23snaps, Untold | "I have almost 6 years of memories... I can't even view what was saved." (Qeepsake, 1 star, 2026-05-18). "you now have to pay to see your" memories (Tinybeans, 1 star, 2026-03-28) | Reading, playback and export free forever (C-REQ-017, C-NFR-004); never downgrade an existing free feature |
| 5 | **Ads and in-app upsells** | 11% (42) | Tinybeans, FamilyAlbum, Chatbooks, BackThen | "recently was shown adds for lingerie on the app...an app for family photo sharing" (FamilyAlbum, 1 star, 2026-09-27) | No ads ever; one quiet Plus surface |
| 6 | **Price rises** | 10% (37) | Tinybeans, Qeepsake, BackThen | "Was like $2 a month then. Now it's $7." (BackThen, 2 stars, 2025-10-23); about $40 to $75 a year (Tinybeans, 1 star, 2025-12-29) | Grandfather existing subscribers; announce changes early |
| 7 | **Unwanted or poor AI** | 8% (31) | FamilyAlbum, Rosebud, Forevermore, Qeepsake, The Short Years | "This app quietly added Anthropic/AI to 'descriptive search' photos" (FamilyAlbum, 1 star, 2026-05-26). "We don't need AI for everything." (The Short Years, 1 star, 2025-09-19) | Constitution: never rewrite; nothing to AI servers in v1.0 |
| 8 | **Friction for grandparents and followers** | 7% (27) | Tinybeans | "Constant nagging to 'add to my Tinybeans' drives me insane! I DON'T HAVE A TINYBEANS OF MY OWN!" (2 stars, 2026-03-15). "very frustrating to use by grandparents" (2 stars, 2026-07-26) | Separate reader and author experiences; no author prompts to family readers |
| 9 | **Privacy betrayals** (AI vendors, full photo-library access, exposed emails, open email image links) | 6% (22) | Tinybeans, FamilyAlbum, TinyNest, Google Photos | "the app also exposes your email address to everyone who can view the albums" (TinyNest, 1 star, 2026-09-18). "emailing my family and friends every week with images of my kids referenced from their server, it ain't secure" (Tinybeans, 1 star, 2026-04-16) | Limited photo-library access; no member emails shown; content-free pushes and emails (already PRD) |
| 10 | **Notification and marketing spam** | 5% (20) | Tinybeans, Qeepsake | "No one wants emails every day!" (Tinybeans, 2 stars, 2026-08-09). Marketing texts "while postpartum" (Qeepsake, 1 star, 2026-08-19) | A few evenings a week; reminders never carry promotions (C-REQ-007) |
| 11 | **Print: quality, delays, lost orders, expiring credits** | 5% (18) | Qeepsake, Chatbooks, FamilyAlbum, Moment Garden | "prints can take upwards of 7 weeks to ship" (FamilyAlbum, 1 star, 2026-08-03). "$65 credit expires annually rather than rolling over" (Qeepsake, 1 star, 2025-11-13) | Print is future; when it ships, credits that never expire |
| 12 | **Redesigns that remove features** | 3% (11) | Tinybeans, Day One | "removed the dates from your pictures" (Tinybeans, 2 stars, 2026-08-26). "needlessly clumsy interface overhaul" (Day One, 2026-04-12) | Server-driven content only, never moving core controls (brief decision 16) |
| 13 | **Repetitive, irrelevant or rigid prompts** | 2% (9) | Qeepsake, The Short Years | "if I skipped a question there was nothing to replace it" (Qeepsake, 2 stars, 2025-10-07). "The prompts are restrictive" ([Reddit l5b1vby](https://www.reddit.com/r/NewParents/comments/u8rp7f/comment/l5b1vby/)) | Skip and replace; age-aware; no repeats within 12 months (UR R8) |
| 14 | **Locked out of the account** | 2% (9) | Tinybeans, Chatbooks, Reflectly | "I currently can't get into my account at all nor create a new account." (Qeepsake, 3 stars, 2026-09-09) | Passwordless sign-in plus offline local book (PRD A) |
| 15 | **No bulk export, lock-in** | 2% (8) | FamilyAlbum, Tinybeans | "no way to mass download/export the photos and videos you've uploaded" (FamilyAlbum, 2 stars, 2026-08-10). "CANNOT EXPORT MEMORIES! Help!" (Tinybeans, 2024-03-09) | Free full export (text, audio, PDF) forever |

**Cross-check with CR's 2025 list:** paywalls, price rises, print problems, lost entries, spam and repetitive prompts all persist. New in 2026: **unwanted AI** and **privacy betrayal by vendor disclosure** (themes 7 and 9) and **ads inside paid or family contexts** (theme 5) are rising.

**What parents praise most (for balance, V from the same feeds):** grandparents feeling close at a distance (FamilyAlbum, Tinybeans, 23snaps, BackThen), prompts that catch a moment ("the text question made me stop and document a beautiful moment", Qeepsake), a finished printed book (Qeepsake, The Short Years, Baby Notebook), hearing a voice again (Forevermore, Tiny Treasures, StoryCorps), and email digests that need no app (23snaps, Moment Garden).

---

## 10. Implications for Early Letters (new items only; CR's 22 still stand)

All I. Owners named where obvious; nothing here changes a founder decision.

1. **Lead with the readable, hearable, never-rewritten letter.** "By month", "private", "sealed" and "no ads" are now claimed by others; fidelity plus the original voice plus Read together is the combination nobody has (sections 4 and 7). Content owner.
2. **Show the price before any family invite.** TinyNest's one-star reviews come from paywalls that appear after parents invited relatives. Inviting a co-parent or contributor must never trigger a Plus sheet (consistent with PRD-REQ-022). Product owner.
3. **AI vendor discipline.** v1.0 sends nothing to AI servers (PRD 2.2). If v1.1 adds server transcription or an AI gateway, announce it as a feature with its own opt-in, never only as a policy or subprocessor update; FamilyAlbum shows the cost of the silent route. Legal and product.
4. **Aim for a clean App Store label** (no "Data Used to Track You", no third-party advertising) and use it in store copy as checkable proof; this is rarer than "private" (17 of 44 apps track). Analytics engineer and legal confirm what opt-in PostHog requires the label to say.
5. **Interruption-safe recording and stored-audio integrity checks.** StoryCorps' worst reviews are lost or corrupted interviews. Engineering.
6. **Plan the no-install grandparent path.** Tiny Treasures (phone line), Remento (link), Moment Garden and 23snaps (email digests), Legacy Odyssey (website) all serve relatives without an app. The v1.1 web page is the plan; a read-only email digest could be a cheaper bridge (founder decision).
7. **Android relatives.** Reviews and Reddit threads show mixed-platform families; v1.0's in-app co-parent role excludes an Android co-parent until Android ships (I). Flag in launch FAQ.
8. **Make any lifetime plan irrevocable in writing** before selling it (Tinybeans revocation report, U).
9. **Watch the Read together gate.** Competitors' worst backlash is about paying to reach memories already made. Single recordings stay free (PRD-REQ-020), which helps; test whether a paid sequence of one's own letters reads as a paywall on memories. Product owner, after beta.
10. **The name dictionary is a visible delight.** Untold users praise its "ongoing glossary of people"; keep B-REQ-006 prominent in onboarding.
11. **Keep streaks and badges out.** Apple Journal shows a weeks streak and FirstChapter awards badges; our no-streak rule is a differentiator worth saying once, gently.
12. **Monitor quarterly:** Tinybeans Group's FY27 "beyond photos and video" work [U9]; Tiny Treasures' rating count; Apple's WWDC 2027 Journal changes; FamilyAlbum's AI rollout.

---

## 11. Gaps and limits of this research

- **Not reachable:** Trustpilot (403, then rate-limited), producthunt.com (403), Reddit full-text comment search (archive timeouts; I used title search plus full comment trees for 14 threads). Remento and Storyworth review evidence therefore relies on CR.
- **Not tested hands-on:** I did not install any app; onboarding, paywall placement and performance claims come from listings, screenshots and reviews.
- **IAP lists are capped at 10 items** and unlabeled by period; a few SKUs are unexplained (Qeepsake "Plus", Moment Garden "Unlock").
- **Unverified items:** Apple Journal transcription languages; The Short Years' AI page feature; FamilyAlbum's data-deletion and export rules on the free tier; Tinybeans' lifetime revocation; US KIDS Act status; StoryKeeper and Saga features.
- **Sample bias:** review feeds return the most recent and most helpful reviews (up to 500 per app); complaint shares describe reviewers, not all users.
- **Conflict of interest:** I am an Anthropic model; see the note at the top regarding the FamilyAlbum finding.

---

## Sources (all opened 2026-10-03 unless marked)

App Store pages are the US storefront. Review quotes come from the app's App Store page via Apple's public review feed [U83].

- U1 iTunes Search and Lookup API (ratings, counts, dates, descriptions): https://itunes.apple.com/search , https://itunes.apple.com/lookup
- U2 Qeepsake App Store: https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787
- U3 Qeepsake pricing: https://qeepsake.com/pricing/
- U4 Qeepsake help, cancelled membership and Lite: https://help.qeepsake.com/article/125-i-cancelled-my-membership-can-i-still-access-my-account
- U5 Qeepsake help, free trial: https://help.qeepsake.com/article/123-what-can-i-expect-during-my-free-trial
- U6 Qeepsake privacy policy (last updated 2025-12-15): https://qeepsake.com/privacy-policy/
- U7 Tinybeans App Store: https://apps.apple.com/us/app/tinybeans-private-family-album/id521633042
- U8 Tinybeans privacy policy (last updated 2024-04-02): https://tinybeans.com/privacy/
- U9 Tinybeans Group FY26 results coverage (27 Aug 2026): https://stockwirex.com/asx-stock-news/communication-media/tny-tinybeans-group-fy26-results-ebitda-august-2026/
- U10 Tinybeans Q4 FY26 coverage (28 Jul 2026): https://kalkinemedia.com/au/news/announcements/tinybeans-achieves-record-e-commerce-surge-and-third-straight-quarter-of-positive-operating-cash-flow
- U11 FamilyAlbum App Store: https://apps.apple.com/us/app/familyalbum-share-baby-photos/id935672069
- U12 FamilyAlbum site: https://family-album.com/
- U13 FamilyAlbum privacy policy (last updated 10/02/2026): https://family-album.com/en/privacy_policy
- U14 FamilyAlbum privacy summary: https://family-album.com/privacy
- U15 BackThen App Store: https://apps.apple.com/us/app/backthen-baby-book-albums/id1505173822
- U16 BackThen privacy policy (last modified 2022-09-01): https://www.backthen.com/privacy/
- U17 TinyNest App Store: https://apps.apple.com/us/app/tinynest-family-album/id6743824334
- U18 TinyNest site: https://tinynestapp.com/
- U19 TinyNest privacy policy: https://tinynestapp.com/privacy
- U20 23snaps App Store: https://apps.apple.com/us/app/23snaps-private-family-album/id526481189
- U21 23snaps privacy policy: https://www.23snaps.com/privacy
- U22 Moment Garden App Store: https://apps.apple.com/us/app/moment-garden-your-baby-album/id499969127
- U23 Moment Garden privacy policy: https://momentgarden.com/privacy
- U24 Notabli App Store: https://apps.apple.com/us/app/notabli-family-social/id580644870
- U25 The Short Years App Store: https://apps.apple.com/us/app/the-short-years-baby-book/id1327539226
- U26 The Short Years shop: https://www.theshortyearsbooks.com/shop/the-short-years-baby-book , https://www.theshortyearsbooks.com/shop/toddler-years-upgrade , FAQ https://www.theshortyearsbooks.com/faq
- U27 The Short Years privacy policy: https://www.theshortyearsbooks.com/privacy-policy
- U28 BabyPage App Store: https://apps.apple.com/us/app/babypage-baby-book-journal/id1362796822 ; site https://babypage.com/
- U29 BabyPage privacy policy: https://babypage.com/privacy/
- U30 Baby Notebook App Store: https://apps.apple.com/us/app/baby-notebook-photo-book/id1518127990
- U31 Chatbooks App Store: https://apps.apple.com/us/app/chatbooks/id734887606
- U32 Bebememo App Store: https://apps.apple.com/us/app/bebememo-smart-baby-journal/id1494276528
- U33 Sproutbook App Store: https://apps.apple.com/us/app/sproutbook-baby-journal/id6751468842
- U34 Sproutbook privacy policy (updated 3/29/26): https://sproutbook.app/privacy
- U35 FirstChapter App Store: https://apps.apple.com/us/app/firstchapter-ai-baby-journal/id6760676959
- U36 FirstChapter site: https://firstchapterapp.com/
- U37 Dearest App Store: https://apps.apple.com/us/app/dearest-letters-memories/id6790823627
- U38 Dearest privacy policy (effective 2026-07-18): https://dearestapp.com/privacy
- U39 Tiny Treasures App Store: https://apps.apple.com/us/app/tiny-treasures-voice-capsule/id6788518267
- U40 Tiny Treasures site and privacy: https://tinytreasuresapp.com , https://tinytreasuresapp.com/privacy
- U41 Moments App Store: https://apps.apple.com/us/app/moments-a-digital-baby-book/id6761346182
- U42 Dear Ones App Store: https://apps.apple.com/us/app/dear-ones-family-memory-book/id6774687543
- U43 The Days We Keep App Store and site: https://apps.apple.com/us/app/the-days-we-keep/id6755585543 , https://thedayswekeep.com
- U44 Tiny Voices App Store: https://apps.apple.com/us/app/tiny-voices-family-memories/id6759920530
- U45 Legacy Odyssey App Store: https://apps.apple.com/us/app/legacy-odyssey-baby-book/id6760883565
- U46 DearBaby: Baby Legacy App Store: https://apps.apple.com/us/app/dearbaby-baby-legacy/id6758726991
- U47 Dear Baby - Pregnancy Journal App Store: https://apps.apple.com/us/app/dear-baby-pregnancy-journal/id6740467933
- U48 Bloom Baby Book App Store: https://apps.apple.com/us/app/bloom-baby-book/id6753892387
- U49 Airloom App Store: https://apps.apple.com/us/app/airloom/id1614187533 ; https://www.airloom.com/ (redirects to an unrelated Thales page)
- U50 Baby Book: Folio App Store: https://apps.apple.com/us/app/baby-book-folio/id1269281693
- U51 Forevermore App Store: https://apps.apple.com/us/app/forevermore-save-their-voice/id6756802019
- U52 Storyworth pricing and home: https://welcome.storyworth.com/storyworth-pricing , https://welcome.storyworth.com/
- U53 Storyworth privacy policy (updated 2026-09-28, effective 2026-10-28) and privacy commitment: https://welcome.storyworth.com/legal/privacy-policy , https://welcome.storyworth.com/privacy
- U54 Remento home and FAQ: https://www.remento.co/ , https://www.remento.co/faq
- U55 Remento privacy policy: https://www.remento.co/policies/privacy-policy
- U56 StoryKeeper evidence: https://storykeeper.ai/ ; https://www.remento.co/remento-vs-storykeeper-summary ; https://welcome.storyworth.com/blog/storykeeper-reviews-alternatives (December 2025)
- U57 HereAfter AI App Store: https://apps.apple.com/us/app/hereafter-ai/id1626176069 ; https://www.hereafter.ai/
- U58 StoryCorps App Store, app page, privacy: https://apps.apple.com/us/app/storycorps/id359071069 , https://storycorps.org/participate/storycorps-app/ , https://archive.storycorps.org/privacy-policy/
- U59 Saga third-party listings: https://www.topbestalternatives.com/saga-voice-journal-for-family/ , https://www.storii.com/blog/ai-tools-family-stories , https://saga.xyz/ (unrelated company)
- U60 LivesToTell App Store: https://apps.apple.com/us/app/livestotell-voice-memoir/id6748242195
- U61 Storylines App Store: https://apps.apple.com/us/app/storylines-life-stories/id6469046982
- U62 withyou App Store: https://apps.apple.com/us/app/withyou-save-family-stories/id6751854792
- U63 Capsle Stories App Store: https://apps.apple.com/us/app/capsle-stories-family-legacy/id1554817576
- U64 Heirloom4Life App Store: https://apps.apple.com/us/app/heirloom4life-voice-keeper/id6757370122
- U65 Day One pricing and features guide: https://dayoneapp.com/guides/premium-subscription/day-one-pricing-features-guide/
- U66 Day One audio recording guide: https://dayoneapp.com/guides/tips-and-tutorials/audio-recording/
- U67 Day One shared journals guide: https://dayoneapp.com/guides/shared-journals/
- U68 Day One AI features and Daily Chat privacy: https://dayoneapp.com/guides/ai-features/ai-features/ , https://dayoneapp.com/guides/ai-features/daily-chat/
- U69 Day One privacy policy (last revised 2024-04-22): https://dayoneapp.com/privacy-policy/
- U70 Day One App Store: https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788
- U71 Apple Journal App Store: https://apps.apple.com/us/app/journal/id6447391597
- U72 Apple iCloud data security overview: https://support.apple.com/en-us/102651
- U73 Apple Shared Albums how-to and limits (published 2026-09-14): https://support.apple.com/en-us/108314 , https://support.apple.com/en-us/148868
- U74 Apple iCloud+ plans: https://www.apple.com/icloud/
- U75 Rosebud App Store, site, privacy policy (updated 2026-09-08): https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127 , https://www.rosebud.app/ , https://help.rosebud.app/about-us/privacy-policy
- U76 Reflectly App Store: https://apps.apple.com/us/app/reflectly-journal-ai-diary/id1241229134
- U77 Untold App Store and privacy policy (effective 2025-03-13): https://apps.apple.com/us/app/untold-voice-journal/id6451427834 , https://untoldapp.com/privacy-policy
- U78 Google Photos App Store: https://apps.apple.com/us/app/google-photos-backup-edit/id962194608
- U79 Google Photos, Gemini features privacy hub: https://support.google.com/photos/answer/15344015
- U80 Google Photos photo books, US: https://support.google.com/photos/answer/9079710
- U81 Cluster App Store: https://apps.apple.com/us/app/cluster/id596595032
- U82 PhotoCircle App Store: https://apps.apple.com/us/app/photocircle/id517539894
- U83 Apple public review feeds, pattern: https://itunes.apple.com/us/rss/customerreviews/page=1/id={APP_ID}/sortby=mostrecent/json (and sortby=mosthelpful), pulled 2026-10-03
- U84 Reddit threads used (via Arctic Shift archive, https://arctic-shift.photon-reddit.com): r/daddit "Any experience with Tinybeans?" https://www.reddit.com/r/daddit/comments/1t3i9id/ ; r/NewParents "Tinybeans Scam" https://www.reddit.com/r/NewParents/comments/1gacjcp/ ; r/NewParents "Anyone try out one of those memory book apps?" https://www.reddit.com/r/NewParents/comments/1mzasqc/ ; r/NewParents "ISO: Baby memory book / app recommendations" https://www.reddit.com/r/NewParents/comments/u8rp7f/ ; r/beyondthebump "Does this app exist? Digital baby book with prompts." https://www.reddit.com/r/beyondthebump/comments/ueuia2/ ; r/beyondthebump "Has anyone used a digital/online baby book service?" https://www.reddit.com/r/beyondthebump/comments/1t23s2w/ ; r/NewParents "Are you doing a baby book? Or digital book?" https://www.reddit.com/r/NewParents/comments/1fj8egk/ ; r/daddit "Dads, what would you write in a letter to your child" https://www.reddit.com/r/daddit/comments/1oy4b3f/
- U85 Product Hunt mirror, Nestori: https://hunted.space/product/nestori
- U86 Prior internal research: `docs/research/COMPETITIVE_RESEARCH.md` (CR), `docs/research/USER_RESEARCH.md` (UR); `docs/prd/PRD.md` sections 1 to 3; `docs/agents/BRIEF-2026-10-03.md`
