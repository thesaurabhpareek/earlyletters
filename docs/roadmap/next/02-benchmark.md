# Next set of requirements, Lane B: benchmark of existing products

| | |
|---|---|
| Status | Desk research, 8 Nov 2026. Lane B of the founder's "next set of requirements" programme. Docs only. No primary interviews, no app was installed or timed. |
| Reads first | `CLAUDE.md`, `docs/research/COMPETITIVE_RESEARCH.md` (CR), `docs/research/competitors/` (us.md, global.md, adjacent-and-ux-benchmarks.md), `docs/prd/v2/04-market.md`, `docs/prd/v2/research/` R1 to R7 (R6 is the 28 Oct delta; R7 the sentiment refresh). This file adds delta and does not repeat their per-product detail. |
| Evidence tags | EVIDENCE means a source I opened on 8 Nov 2026, with its URL. HYPOTHESIS means my reasoning, not yet shown by a source. NOT VERIFIED means I tried and could not read or confirm it. |
| Date read | Every "read 8 Nov" below means 8 Nov 2026 unless another date is given. |

## 0. Conflicts to settle before anyone uses this file

1. **Our own price.** The brief for this lane says Plus is about $3.99 a month or $29.99 a year, and that the core is free forever. The repo's current source says otherwise: `packages/content/src/pricing.ts` carries $4.99 a month (1-month trial) and $49.99 a year (2-month trial) from D-082 (4 Oct 2026), and `docs/prd/v2/04-market.md` says the free tier is the first 2 letters (M1, M17). The $3.99 and $29.99 figures are the earlier D-012 and D-053 prices, which D-082 supersedes. I compared against both pairs where it matters and labelled each. EVIDENCE: `packages/content/src/pricing.ts` and `docs/DECISIONS.md` (D-012, D-053, D-082), read 8 Nov. The founder should confirm which is current.
2. **Dearest printing.** Its App Store notes and its own site still disagree (section 3.5).
3. **Qeepsake "Plus" tier.** Still only visible in the App Store purchase list (section 3.1).

## 1. Bottom line

1. **The "your words stay yours" claim is no longer empty ground.** Five tiny apps launched in 2026 say some version of it: Memory Jar (says its book text is entirely the parent's own words), Toddl (no training on a child's voice), Dearest (nothing used for training), Baby Diary: Voice Journal (words transcribed on the phone, never uploaded) and Little Things (no data collected, sharing through the user's iCloud). None shows what a machine changed. The claim is cheap to copy; the visible change list and the immutable original are not. EVIDENCE: section 3 App Store pages, read 8 Nov.
2. **The leaders that have users are moving the other way.** From, Mama 1.8.0 (1 Nov) added a composer that turns speech into a letter and made family writing free while the membership is active. FirstChapter and Remento rewrite by design. Day One's Daily Chat can now search and open past entries (Labs, 2026.22, 23 Oct). EVIDENCE: App Store version notes, read 8 Nov.
3. **The closest voice-first baby product with real trust signals is Remento's Baby Book of Firsts**, not an app: $99 for a year plus one hardcover book with a QR code to the original voice, no app for the person recording, and a stated 1,800+ Trustpilot reviews on its own page. EVIDENCE: https://www.remento.co/babybook and https://www.remento.co/, read 8 Nov. Its Trustpilot rating (4.8) is carried from R6 (28 Oct), not re-read.
4. **The closest on-device clone of our idea is Baby Diary: Voice Journal** (first released 13 May 2026, v1.1 on 22 Oct): tap, talk, words typed live on the phone, edit before saving, original recording kept, age tag, printable PDF book, Siri phrase, no account, "Data Not Collected", and a one-time Premium instead of a subscription. It has no ratings yet. EVIDENCE: https://apps.apple.com/us/app/id6762714102, read 8 Nov.
5. **Price anger is the loudest review theme in the products with real review volume**, and it is about paywalls arriving after people had memories inside (Qeepsake, Tinybeans, 23snaps, BackThen, TinyNest). It is not about the monthly figure. EVIDENCE: Apple customer-review feeds, sample sizes in section 4.
6. **One-time and lifetime pricing is spreading among new entrants** (Tiny Treasures $99, Forthword $99.99, Chapter One $119, Early Chapters $249.99, Pagewren $39.99 or $49.99, Baby Diary one-time). Every subscription competitor with volume is a subscription. EVIDENCE: App Store purchase lists, read 8 Nov.
7. **Apple Journal did not gain voice or family features in iOS 27 per the one article I could open**: streaks, sync indicator, more attachments, timestamps, dynamic writing prompts. That is a single secondary source. EVIDENCE: https://9to5mac.com/2026/06/11/heres-everything-new-for-journal-in-ios-27/ (11 Jun 2026, read 8 Nov). NOT VERIFIED against Apple's own page.
8. **Almost every voice-first baby listing is English only** (Tiny Treasures, FirstChapter, From, Mama, Dearest and Baby Diary each list one language). EVIDENCE: App Store lookup data, read 8 Nov.

## 2. How I gathered it (and its limits)

- **App Store data** came from Apple's public lookup interface (rating, rating count, version dates, first release date, languages, description) and from the product page's embedded data (version notes, purchase list, privacy label). Pages: `https://apps.apple.com/us/app/id<ID>`; lookup: `https://itunes.apple.com/lookup?id=<ID>&country=us`. US storefront only. Rating averages are rounded to one decimal.
- **Reviews** came from Apple's public customer-review feed for the US store, sorted most recent, 50 per product at most (`https://itunes.apple.com/us/rss/customerreviews/id=<ID>/sortby=mostrecent/json`). That is a small, non-random slice and can skew negative or old. I report star mix and themes in my own words. No text is copied beyond a short phrase.
- **Own sites** read with a plain fetch: remento.co (home and /babybook), welcome.storyworth.com pricing, dayoneapp.com/plans, chatbooks.com/pricing, frommama.com, dearestapp.com.
- **Could not read:** qeepsake.com/pricing (blocked, 403), tinybeans.com/pricing (404), the FirstChapter website (the host is not reachable from this session), Trustpilot (403 for Remento, Qeepsake and Storyworth), Google Play, Reddit. Those facts are carried from R6 and marked "carried".
- **Capture clicks and time** are what each product says about itself. I did not install or time any app, so tap counts are NOT VERIFIED. For us, the PRD targets a median of 90 seconds from first launch to first saved letter and tap-to-microphone p95 of 500 ms (`docs/prd/v2/03-goals-and-principles.md`, PS1).

## 3. What changed since R6 (28 Oct) and in the last six months

### 3.1 Changes in the last eleven days (EVIDENCE: App Store pages and lookup, read 8 Nov)

| Product | Change | Why it matters to us |
|---|---|---|
| From, Mama | v1.8.0 on 1 Nov: "a whole new From, Mama". Short story to write the first letter in minutes; a composer that turns voice into a letter; family and friends write to the child free while the membership is active; reworked Timeline, Memories, Reflect and Village. 4.9 from 51 ratings (R6: 51). | The most active funded-looking competitor now both rewrites speech and makes relatives free. Avoid the first; match the second. |
| Tiny Treasures | v1.0.11 on 1 Nov: notification controls split between family updates and app news. The privacy label now lists purchases, location, contact info, user content, identifiers, usage data, sensitive info and other data as linked to the user (R6 on 28 Oct listed fewer categories and said device ID was used for advertising). Prices unchanged ($4.99, $29.99, $99 "forever"). 5.0 from 7. | Its "private by design" copy sits beside a wide label. Our label will be honest and narrower. |
| FirstChapter | v1.0.7 on 26 Oct: offline handling, session restore fixes. US ratings now show none (CR on 1 Oct recorded 5.0 from 5). Prices unchanged ($6.99 / $39.99). Free: 3 voice memories a month; Premium 30. | Reliability work on a newly launched product; no rating signal. |
| Dearest | Unchanged since 20 Aug (v1.4.2). Rating shows 3.0 from 2 (R6: 5.0 from 1). Its own site still says print books are coming soon. | Two ratings mean nothing; the print conflict persists. |
| Day One | 2026.22 on 23 Oct: text and highlight colour; in Labs, Daily Chat can search, read and open past entries. 4.8 from 118,905. Silver $49.99 a year or $8.99 a month; Gold $74.99. | General journal moving toward conversational recall; not child-centred. |
| Tinybeans | v5.93.0 on 2 Nov, "performance improvements and bug fixes". Purchase list unchanged ($7.99 monthly, $74.99 yearly; Legacy $4.49 and $39.99). 4.9 from 104,226. | Review slice is the most negative of any product I sampled (section 4). |
| Baby Diary: Voice Journal | v1.1 on 22 Oct: a note before the first recording that words are transcribed on the phone and never uploaded; optional evening nudge; cleaner book cover. | Treats on-device transcription as a headline trust line. |
| Toddl: Family Memories | v1.4.9 on 23 Oct (first release 7 May): WhatsApp video share, pet profiles, time-of-day widgets. Toddl Plus $6.99 monthly or $59.99 yearly. | A shared family timeline with widgets; no ratings yet. |
| Aurloom, Vellum, Little Echo, Forthword, Early Chapters, Tiny Voices, Sproutbook, Qeepsake, BabyPage | No price change since R6, with one reading difference: Sproutbook's annual shows $59.00 today (R6 recorded $59.99; CR said $59). Little Echo v1.3 (27 Oct) added a Memories timeline with search; BabyPage v3.1.4 (29 Sep); Qeepsake v4.9.21 (8 Sep). | No action. |

### 3.2 New or newly found in the last six months (not in R6 section 3 unless noted)

| Product | What it is | Price on its page (read 8 Nov) | First released | Read |
|---|---|---|---|---|
| Baby Diary: Voice Journal (Sahil Pabby) | Voice baby diary, live on-device transcription, original audio kept on device, text and photo sync through the user's iCloud, 50 milestones, printable PDF book | Free with 5 voice entries a month; one purchase "Baby Days Pro" $29.99 (the listing says one-time, no subscription). Whether that purchase is truly non-recurring: NOT VERIFIED (the purchase list does not say) | 13 May 2026 | No ratings. Label: Data Not Collected |
| Toddl: Family Memories (Noam Stolero) | Toddler words and what they meant, photos, short voice clips, shared family timeline, widgets | Toddl Plus $6.99 or $59.99 | 7 May 2026 | No ratings. Says no ads, no feed, no training on voice; 8 listed languages |
| Memory Jar: Family | Book that grows from pregnancy to 18, chapters by month and season, sealed letters, yearbook, "On This Day" | Premium $4.99 monthly, $39.99 yearly | 12 May 2026 | 5.0 from 3. Needs iOS 26.4. Says its book text is only the parent's own words |
| Little Things: Big Memories | Photo plus one-line note, voice notes, letters, share with partner or grandparent through iCloud | Little Things Plus $3.99 (period NOT VERIFIED) | 11 Mar 2026 | 5.0 from 4. Data Not Collected. v1.2 on 21 Apr added sharing because "can my partner see this" was the top request |
| Tiny Echoes | Toddler voice memo diary | $4.99 monthly, $39.99 yearly | 15 May 2026 | 5.0 from 1 |
| BabbleLog | Child speech log with iCloud backup and PDF export | $9.99 Premium (period NOT VERIFIED) | 11 Jun 2026 | No ratings. Data Not Collected |
| Chapter One: Baby Journal (Heirloom Journal) | Journal and memory book "not a tracker" | $5.99 monthly, $49 yearly, $119 lifetime | 7 Jul 2026 | 5.0 from 1 |
| Plapperbuch | German-market child speech audio diary | NOT VERIFIED (no purchase list) | 8 May 2026 | Outside US focus |
| Pagewren: Baby Memory Book, Primori | Photo baby books with age reading and PDF export | Pagewren Pro $3.99 or $4.99 monthly, $23.99 or $29.99 yearly, $39.99 or $49.99 lifetime (two price sets listed); Primori $3.99 / $34.99 | 19 Oct and 10 Aug 2026 | No ratings |
| LumiDays, MamaSaysSo | AI-led baby companion; AI journal for mothers | LumiDays $12.99 to $199.99 tiers; MamaSaysSo $8.99 / $49.99 | Not read | Not our shape |
| Forevermore: Save Their Voice | Guided voice interviewer plus a feature that makes typed words sound like a recorded person | $9.99 to $14.99 monthly; annual $24.99 to $69.99 across several listed prices | 6 Feb 2026 | 4.6 from 725. Adjacent, and an ethical line we do not cross (section 3.8) |

EVIDENCE for every row: `https://apps.apple.com/us/app/id<ID>` and the lookup interface, read 8 Nov. IDs: Baby Diary 6762714102, Toddl 6765772923, Memory Jar 6764339791, Little Things 6759470468, Tiny Echoes 6760604734, BabbleLog 6771748086, Chapter One 6761275608, Plapperbuch 6760838182, Pagewren 6823661619, Primori 6764563616, LumiDays 6781443170, MamaSaysSo 6748836950, Forevermore 6756802019.

Already in R6 and unchanged: Early Chapters (name close to ours), Forthword, Vellum, Aurloom, Little Echo, Tiny Voices, The Days We Keep, Then, Sommos, Kindred Tales. Not re-opened: Then, Sommos, Kindred Tales.

## 4. Product profiles

Format per product: what it is, who it serves, how a memory is captured (stated flow and stated time; tap counts NOT VERIFIED), price as shown on its page, what reviewers say, recent changes, what it means for us. "Review slice" means the most recent reviews in Apple's US feed on 8 Nov (sizes and date spans given), not the whole rating.

### 4.1 Prompted baby journals and books

**Qeepsake (Tinybeans Group)**
- *What / who:* Prompt-led baby journal with photos and print, for parents who want a nudge. 4.9 from 14,632 ratings; v4.9.21 (8 Sep).
- *Capture:* Daily or weekly prompt by text message or in the app, answer, add a photo. Time not stated. Voice is not a headline feature (carried from CR; not re-read in this session).
- *Pricing (App Store purchase list, 8 Nov):* Essential $4.99 monthly or $47.99 yearly; Premium $9.99 monthly or $95.99 yearly; a "Plus" at $35.99 and $47.99 whose contents are NOT VERIFIED. The pricing page was blocked; R6 read $47.88 and $95.88 there on 28 Oct (carried).
- *Reviewers:* Slice of 50 (29 Oct 2025 to 22 Oct 2026): 32 five-star, 12 one or two star. Praise: easy to keep up in real time, a gift people buy at baby showers. Complaints: the move to paid-only, accounts deactivated with entries locked until payment, repetitive or seasonally wrong questions, cannot upgrade a plan mid-term through Apple, cannot file an entry into a book chapter easily.
- *Recent changes:* None in the app since 8 Sep. Tinybeans owns it (Nov 2025).
- *For us: OWN "never held hostage".* The sharpest complaints are about memories becoming unreachable after a business-model change. Avoid prompt lists that read as machine-made and out of season.

**BabyPage**
- *What / who:* Template baby book with milestone pages and print, for parents who want a finished book with little writing. 4.8 from 4,100; v3.1.4 (29 Sep).
- *Capture:* Multiple-choice questions plus optional detail (reviewers say you do not need to write much). Time not stated.
- *Pricing:* $7.99 monthly, $13.99 for three months, $44.99 yearly (App Store, 8 Nov).
- *Reviewers:* Slice of 50 spans Jan 2024 to 25 Jun 2026 (older than most): 40 five-star, 4 one or two star. Praise: the multiple-choice format is why a book gets finished. Complaints: crashes that lose work, a renewal not reminded and refused refund.
- *Label:* Tracks User Content and Diagnostics.
- *For us: COPY* the low-effort frame ("you do not have to write a novel"), *AVOID* crash-prone editing of long text.

**The Short Years Baby Book**
- *What / who:* App plus a physical ring binder; weekly prompts with a few questions; three finished chapters trigger printed pages mailed to the buyer. 4.9 from 4,833; v9.26 (4 Nov).
- *Capture:* Weekly reminder, a photo and a couple of answers; the listing says first chapter in about five minutes.
- *Pricing:* App is free; digital book download $7.99 (App Store); binder prices are on its site (NOT VERIFIED).
- *Reviewers:* Slice of 50 (Jan to Aug 2026): 45 five-star. Praise: easy, printed pages arrive on a schedule. Complaints (2): a sticker printing error, uploads crashing.
- *For us: COPY* the idea that print arrives as a reward for effort, not as an upsell at the end. Print is later for us; the pattern informs the digital book.

**Baby Notebook, BackThen, Dujourbaby, Sproutbook** (one line each, EVIDENCE as above)
- Baby Notebook: Premium $49.99 yearly, Plus $6.99 monthly, extra pages $1.99 to $69.99, PDF $9.99. Slice: 31 of 50 five-star; complaints centre on paying a subscription and then paying for the book, typing long text on a phone, no desktop. *For us:* print pricing that stacks on a subscription is a repeated sore point.
- BackThen: photo-first, VIP $6.49 monthly, 4.8 from 29,187, now offers photo books. Slice: 44 of 50 five-star; complaints are about a price that rose from about $2 to about $7 a month and updates that broke the app.
- Dujourbaby: 5.0 from 5; no purchase list found. Sproutbook: $6.99 monthly or $59.00 yearly, v2.0.2, 4.7 from 13.

### 4.2 Voice-first baby products

**Tiny Treasures: Voice Capsule (LocalSquare LLC)**
- *What / who:* Voice capsule for a child, kept at every age; the whole family adds voices; sealed messages for later. First release 16 Jul 2026. 5.0 from 7; v1.0.11.
- *Capture:* Record a voice message or photo; a family phone line lets a relative call or text and the voicemail lands in the capsule with no app; CarPlay recording. Time not stated.
- *Pricing:* $4.99 monthly, $29.99 yearly, $99.00 "forever" (App Store, 8 Nov). The description says family participation needs a paid plan or a one-time Family purchase by a parent, while invited relatives record at no charge.
- *Reviewers:* Four reviews, all five-star (25 Jul to 7 Aug), about the voicemail feature and giving the recordings to the child later. Too few to read.
- *Recent changes:* Notification controls (1 Nov); wider privacy label.
- *For us:* The nearest voice-first rival on family contribution and price floor. *OWN* what it does not claim: unchanged words with a visible change list, and a plain label. *COPY* free recording for relatives; *AVOID* competing on the $29.99 headline.

**FirstChapter: AI Baby Journal (Solvesoft Corp.)**
- *What / who:* Talk for about 30 seconds and the listing says it composes a polished entry; family sharing, weekly recaps with mood patterns and badges, share cards, memory books. First release 1 Jun 2026; v1.0.7 (26 Oct). No US ratings shown.
- *Capture:* Hit record, talk (stated 30 seconds), entry appears. Taps NOT VERIFIED.
- *Pricing:* Free 3 voice memories a month; Premium $6.99 monthly or $39.99 yearly (listing, 8 Nov). Family sharing and smart prompts are Premium.
- *Label:* Linked data includes Contacts and Sensitive Info; no tracking group.
- *For us: AVOID* the rewrite, the badges and mood patterns (our content rules forbid badges and gap counting). The story to tell against it is the one-line contrast, shown not asserted.

**From, Mama (From Mama LLC)**
- *What / who:* Letters from a mother to her children; timeline, Reflect prompts, Village of family and friends. First release 11 Apr 2026; v1.8.0 (1 Nov). 4.9 from 51.
- *Capture:* Type, or dictate with built-in clean-up; add audio notes, selfie video, photos. The 1.8.0 notes describe a composer that turns the voice into a letter. Time not stated.
- *Pricing:* Premium $5.99 monthly, $49.99 yearly (App Store). Its site shows a free trial, length not stated, and links to both stores.
- *Reviewers:* 11 reviews in the feed (19 Apr to 20 Aug), all five-star; they praise the feeling of writing to a child; several read as early-community reviews. Too few to generalise.
- *For us:* Same annual price as ours ($49.99). It targets mothers; we are two parents. *AVOID* the "we will write it" step. *COPY* "family writes free" as a framing for relatives.

**Dearest (independent)**
- *What / who:* Private letters, voice notes, photos, sealed letters for later; iCloud-first; no AI training claim. First release 22 Jul 2026; v1.4.2 (20 Aug); 3.0 from 2.
- *Capture:* Write or speak; import a voicemail or any audio file with its original date (1.4.2).
- *Pricing:* Plus $4.99 monthly, $49.99 yearly. The App Store text lists printable memory books under Plus; the website (read 8 Nov) still says print books are coming soon.
- *Label:* Only purchases and identifiers, not linked to the user (the narrowest of any product with accounts or iCloud).
- *For us:* The closest on price and tone. *COPY* import with original date. *OWN* two authors and the change list; its edit history covers the user's own edits, not machine edits (listing wording; not seen as a machine-edit view).

**Baby Diary: Voice Journal** (see section 3.2): *COPY* the first-recording note that words stay on the phone; *AVOID* ignoring a one-time price in the market; *OWN* two authors and visible change list (it has one phone, one owner).

**Tiny Voices, Toddl, Memory Jar, Little Things, Little Echo, Aurloom, Vellum, Forthword, Early Chapters:** tiny audiences (nine or fewer ratings each; see R6 section 3 and section 3.2 above). Patterns worth noting: sealed or scheduled letters (Memory Jar, Vellum, Forthword, Dearest, Tiny Treasures); iCloud-based sharing so the maker holds nothing (Little Things, Baby Diary, Dearest); child-speech capture (Toddl, Tiny Echoes, BabbleLog, Little Echo). Tiny Voices' only written reviews in the feed (2 of 3) say the partner share link failed or was unavailable, the blocker being named as the reason not to pay.

### 4.3 Photo-sharing family albums

**Tinybeans** (4.9 from 104,226; v5.93.0)
- *Capture:* Pick photos, add caption, upload; a feed for invited family. Time not stated.
- *Pricing:* $7.99 monthly, $74.99 yearly; Legacy $4.49 and $39.99 (App Store). Own pricing page returned 404; free plan details are carried from R6 (20 uploads and 5 GB a month).
- *Reviewers:* Slice of 50 (17 Jul 2025 to 23 Oct 2026): 31 one or two star, 9 five-star, the most negative slice I sampled. Complaints: offer pop-ups and upsell banners even for members, daily nudges to upload, an August redesign that removed dates and captions from the upload step, upload limits when a grandparent visits, followers repeatedly pushed to start their own, price rising from free. Praise: long-term use, helpful support, organised space.
- *Label:* Tracks location, contact info, user content, identifiers and usage data.
- *For us:* Photos, not words; its angry reviews are our content rules (no streaks, calm cadence). *AVOID* upsell inside the viewing experience.

**FamilyAlbum (MIXI)**: 4.9 from 381,058; free with Premium Family $5.99 monthly or $59 yearly, Pro $10.99 or $109. Slice: 33 of 50 five-star; complaints are about full-screen ads between photos (one reviewer reports unsuitable ads), slow uploads, reactions behind a paywall. Tracks identifiers.
**23snaps**: 4.8 from 11,559; Premium $5.49, Plus $7.99. Slice (spans 2022 to Sep 2026): 30 of 50 one-star, about features moved behind a paywall, crashes, login sharing. Tracks usage data.
**TinyNest** (first release Apr 2025): 4.9 from 5,994; Family Unlimited $12.99 monthly or $79.99 yearly, gift lifetime $199.99; 31 languages. Slice of 43: 23 five-star. Complaints: paywall appears only after setup and invites, "private" app asks for the whole photo library, rating pop-ups. Praise: works for relatives without iPhones.
**Moment Garden, Notabli:** Moment Garden Star $4.99 and $49.99; Notabli Plus $4.99 and $49.99 (last updated Oct 2024; effectively dormant). Not sampled in detail.
- *For us (all four):* these hold the "grandparents see the baby" job; we should not fight them for photos. *AVOID* surprise paywalls after relatives were invited (TinyNest). *OWN* words and voice with a family circle.

### 4.4 Voice life-story and print

**Remento (and the Baby Book of Firsts)**
- *What / who:* Weekly questions to a storyteller who records by voice, turned into a hardcover book with a QR code per chapter; in 2026 also a baby version: 100+ guided "firsts", talk for about a minute, add a photo, no weekly deadline.
- *Capture:* The storyteller opens a link by email or text, no app or login, two clicks, "60 seconds" to try (own page). For the baby book, pick a first, add a photo, talk about a minute.
- *Pricing (own pages, read 8 Nov):* $99 for a year including one colour hardcover and US shipping; renewal $99 a year or $12 a month; extra book $69. Recordings stay viewable and downloadable after the year if you do not renew. 30-day money-back guarantee.
- *Words:* Each story can be a cleaned transcript of exact words or a polished first- or third-person story; the original recording is always kept (own FAQ).
- *Reviewers:* The site shows 1,800+ Trustpilot reviews and a Trustpilot rating of 4.8 (R6, carried; Trustpilot blocked today). Praise: finished book, hearing the voice via QR. Complaints (R6 Sept slice, carried): dropped proper nouns, collaborators finding the site hard, print defects.
- *For us:* The reference for printed book plus audio. *COPY* "stories stay yours if you stop paying", QR to the original voice, no app for the contributor. *AVOID* the polish default. *OWN* the cleaned-transcript-only stance, the change list, and two parents recording their own letters daily rather than a year of weekly prompts.

**Storyworth**
- Plans on its pricing page (read 8 Nov): Basic $69, Color $99, Unlimited $199 (the page marks the last with an asterisk), each with a year of weekly questions by email or text and at least one hardcover book. Phone answers with automatic transcription work on any phone, even a landline. Built-in proofreader on Color. Trustpilot 4.7 from about 65,000 (R6, carried). Not baby-specific; **COPY** the landline and phone-call path as the model for a grandparent who will never install an app.

**Forevermore** (adjacent, 4.6 from 725): slice of 50 shows 41 five-star; every low review is about the "Echo" voice not sounding like the real person, plus a claim that negative reviews are deleted (a reviewer's claim, NOT VERIFIED). *For us: AVOID.* Typing words in a recorded person's voice is the line `adjacent-and-ux-benchmarks.md` already says we do not cross.

### 4.5 Platform and general journals

**Apple Journal**
- 4.8 from 340,714 (App Store lookup, read 8 Nov); free; label "not linked to you". Audio recordings with transcription, prompts from on-device suggestions, streaks, iCloud sync, lock. iOS 27 changes per the one article opened: streaks setting, sync indicator, more attachments, timestamps, dynamic prompts; nothing on voice, family or children (9to5Mac, 11 Jun 2026). Apple's own page for iOS 27 Journal: NOT VERIFIED.
- *Reviewers:* Slice of 50 (2 to 7 Nov): 36 five-star, 11 one or two star. Complaints: iPhone only (a reviewer moved to Android), nagging prompts, dictation punctuation, a report of entries disappearing, no obvious microphone control. The slice looks noisy (a few reviews read as off-topic).
- *For us:* The default we sit beside. Not built around a child's age; no change list; no second author. Watch item, not a threat this quarter.

**Day One (Automattic)**
- 4.8 from 118,905; v2026.22. Plans page (read 8 Nov): free Basic with unlimited text entries, daily prompts, search, end-to-end encryption; Silver $49.99 a year adds audio recording and transcription; Gold $74.99 adds Daily Chat and reflective summaries; a shared-journals row appears in the plan table (which tiers get it: NOT VERIFIED); one-month trial.
- *Reviewers:* Slice of 50 (3 Sep to 5 Nov): 35 five-star. Complaints: sync stopping with no fix, a separate purchase for Mac, support behind a subscription, a reviewer objecting to AI features appearing in a journal. Praise: ten-year use, searchability.
- *For us:* Same annual price as ours; proof that people pay $49.99 for a quality journal. *AVOID* making the child's book feel like a general diary. *COPY* export and encryption seriousness.

### 4.6 Printed-book services

**Chatbooks** (4.8 from 249,741; v5.17.10, 6 Nov): own pricing page lists subscription Monthbooks at $15 a book and Monthly Minis at $10 a book, plus classic books from $26. App Store purchase list shows no subscription. Slice of 50: 29 five-star, 13 one-star; complaints are about managing or cancelling a subscription in the app, refund inflexibility and shipping. Praise: it turns camera-roll photos into books people actually read. Tracks identifiers.
*For us:* The print benchmark is a photo book; none of the audio-linked books come from print specialists. Remento is the only one with QR audio. Cancel in a few taps and say what shipping costs at checkout.

## 5. Feature matrix

Legend: Y stated by the product on its own page or App Store listing; No stated absent or the opposite; NS not stated in the sources I read (not the same as absent); NV not verified. Early Letters column is the v1.0 and v1.1 plan from the PRD, not shipped features. All cells EVIDENCE as in section 4 unless marked.

| Criterion | Early Letters (plan) | Tiny Treasures | FirstChapter | From, Mama | Dearest | Baby Diary | Remento | Qeepsake | BabyPage | Tinybeans | Day One | Apple Journal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Voice capture | Y | Y | Y | Y (dictation, audio notes) | Y | Y | Y | NS | NS | NS (photo and video led) | Y (Silver) | Y |
| Original audio kept | Y | Y | NS | Y (audio notes) | Y | Y | Y | NS | NS | NS | Y | Y |
| Transcription stated as on the phone | Y | NS | NS | NS | NS | Y | NS | NS | NS | NS | NS | NS |
| Rewrites speech into prose | No, by rule | NS | Y | Y (1.8.0) | NS | No (types every word) | Optional, cleaned transcript or polished | NS | NS | No | Optional on Gold | No |
| Machine edits listed with undo | Y | NS | NS | NS | NS (user edit history only) | NS (edit before save) | Partial (switch versions; original kept) | NS | NS | NS | NS | NS |
| Second parent writes into the same book | Y (v1.0) | Y (paid family) | Y (Premium) | Y | Partial (shared "Together" chapter) | NS | Y (collaborators) | Premium only (R6 carried) | NS | Invite-only family (adding by others NS) | Listed (tiers NV) | NS |
| Relative adds without installing an app | Planned web page (v1.1) | Y (phone line, free for relatives) | NS | NS | NS | NS | Y (link) | NS | NS | NS | NS | NS |
| Organised by the child's age | Y | Y | NS | By child and date | NS | Y (age tag) | Prompts by "firsts" | NS | Milestone pages | NS | No | No |
| Import audio with original date | Not planned | NS | NS | NS | Y | NS | NS | NS | NS | NS | NS | NS |
| Sealed or scheduled letters | Later (F41) | Y | NS | NS | Y | NS | NS | NS | NS | NS | NS | NS |
| Printed book | Later | NS | Memory books (listing; print NV) | NS | Listing yes, website "coming soon" | PDF only | Y (hardcover included year one) | Y (credits) | Y | Photo books (R6 carried) | Print discount (CR carried) | NS |
| Audio reachable from the book | Planned | NS | NS | NS | NS | NS | Y (QR) | NS | NS | NS | NS | NS |
| Free tier | Y (first 2 letters per D-082; brief says core free) | Personal backup free; family needs paid | 3 voice memories a month | NS | Y (R6) | 5 voice entries a month | No | No (R6) | NS | Y (R6: 20 uploads a month) | Y | Y |
| Headline US price | $4.99 / $49.99 (D-082); brief $3.99 / $29.99 | $4.99 / $29.99 / $99 | $6.99 / $39.99 | $5.99 / $49.99 | $4.99 / $49.99 | One purchase $29.99 (NV) | $99 year one incl. book; renews $99 or $12 a month | $4.99 / $47.99 (Essential) | $7.99 / $44.99 | $7.99 / $74.99 | $8.99 / $49.99 (Silver) | Free |
| App Store privacy label | Planned: linked for function, no tracking (A) | Linked, wide; no tracking group | Linked, includes Contacts; no tracking group | Linked; no tracking group | Not linked | Data Not Collected | NA (not an app listing) | Tracks usage data | Tracks user content, diagnostics | Tracks many | Linked; no tracking group | Not linked |
| Listed languages (App Store) | Gated per language | 1 | 1 | 1 | 1 | 1 | EN and ES (R6 carried) | NV | NV | NV | NV | 1 |

Reading the matrix: only Baby Diary matches us on stated on-device transcription and unaltered typing; only Remento matches us on audio inside a printed book; only Tiny Treasures matches us on relatives who need no app; only Dearest matches on importing old audio; **no product shows a list of what a machine changed**. The last statement means "not seen in the pages and listings read", which is the strongest honest statement available, not a proof of absence.

## 6. Positioning map, in words

Two axes. Horizontal: whose words end up on the page, from "the product composes the text" on the left to "the text is what was said, plus visible repairs" on the right. Vertical: what a memory is made of, from "photos and a feed" at the bottom to "words and voice" at the top.

- **Bottom left (photos, composed text):** none of note; Tinybeans, FamilyAlbum, 23snaps, TinyNest, BackThen and Chatbooks sit bottom centre because they hold photos and captions and make no claim about words.
- **Top left (voice, composed text):** FirstChapter, From, Mama (1.8.0), Remento's polished mode, Day One Gold, Kindred Tales. This is where funding and press are.
- **Top right (voice, words kept):** Baby Diary, Dearest, Memory Jar, Toddl, Tiny Treasures (no rewriting claimed) and Apple Journal. Crowded with tiny apps, each making the claim and none showing the proof.
- **Centre-left, prompts and print:** Qeepsake, BabyPage, The Short Years, Baby Notebook, Storyworth. Typing-led, print-led, composed or templated.
- **Empty spot:** top right, with two parents, a change list, the original audio, and a book organised by age. That is where Early Letters sits; the nearest neighbours are Dearest (one author, no change view) and Tiny Treasures (voice capsule, wider data label).
- **A second, quiet axis is commerce:** one-time or lifetime on one side (Baby Diary, Tiny Treasures, Forthword), annual subscription on the other (almost everyone with volume), and "buy a year with a book" in the middle (Remento, Storyworth). Our plan sits with the subscribers at the median annual price.

## 7. The ten most important gaps and openings

| # | Opening | Tag | Evidence or reasoning | Action word |
|---|---|---|---|---|
| 1 | **Make "unchanged words" provable, not claimed.** At least five 2026 launches say some form of it; none shows a machine-edit list. The proof (change list with undo, original kept, engine version on each letter) is the defence. | EVIDENCE | Memory Jar, Toddl, Dearest, Baby Diary, Little Things listings (https://apps.apple.com/us/app/id6764339791, id6765772923, id6790823627, id6762714102, id6759470468, read 8 Nov); no change list seen in section 5 | OWN |
| 2 | **Never held hostage.** The biggest, most repeated pain in volume products is memories becoming unreachable or newly paywalled. Say what stays free, and prove it with export. Remento's "stories stay yours if you do not renew" shows the reassurance sells. | EVIDENCE | Qeepsake, Tinybeans, 23snaps, BackThen review slices (itunes.apple.com customer-review feeds for ids 1332312787, 521633042, 526481189, 1505173822, read 8 Nov); https://www.remento.co/ read 8 Nov | OWN |
| 3 | **Let a relative add a voice with no app and no payment, and let the payer be one parent.** Tiny Treasures does it by phone; From, Mama 1.8.0 now says family writes free while the membership is active; Remento needs only a link. Our v1.1 web page is later than two rivals' answers. | EVIDENCE | https://apps.apple.com/us/app/id6788518267 and id6760956480 (read 8 Nov); https://www.remento.co/ (read 8 Nov). Whether pulling it into v1.0 is worth the cost is HYPOTHESIS | COPY, then OWN with the change list |
| 4 | **Both parents in one book from day one, and say so plainly.** Partner sharing is the thing reviewers say blocks them: Little Things added it because it was the top request; two of three written Tiny Voices reviews name a failed share as the reason not to subscribe; Qeepsake gates contributors. | EVIDENCE | https://apps.apple.com/us/app/id6759470468 notes (21 Apr 2026); itunes feed id=6759920530; R6 for Qeepsake (carried). All three are very small apps, so demand at scale is HYPOTHESIS | OWN |
| 5 | **A book with the original voice inside it, digital first.** Remento is the only one with audio in a printed book and charges $99 for the year. Baby Diary and The Short Years show a PDF or ring-binder path costs far less. Print complaints elsewhere are about stacked costs and defects. | EVIDENCE for rivals; HYPOTHESIS for our sequencing | https://www.remento.co/babybook (read 8 Nov); App Store pages id6762714102, id1327539226; id1518127990 review slice | COPY (QR audio), AVOID (stacked fees) |
| 6 | **Decide our stance on lifetime or one-time pricing before launch day.** New entrants cluster at $99 to $119 lifetime and one voice-diary offers one purchase at $29.99; every product with volume is a subscription. Our F43 lifetime is "later, price not set". | EVIDENCE for the market; HYPOTHESIS on willingness to pay | App Store purchase lists for Tiny Treasures, Forthword, Chapter One, Early Chapters, Pagewren, Baby Diary (read 8 Nov); `docs/prd/v2/04-market.md` section 2 | Decide |
| 7 | **Import voice notes and voicemails with their original dates.** Dearest ships it free; Aurloom imports voicemails (R6). It lets a new parent bring a year of recordings into the child's timeline on day one, which is the Before You chapter's sibling. Not in the v2 feature map. | EVIDENCE for competitors; HYPOTHESIS for demand | https://apps.apple.com/us/app/id6790823627 version 1.4.2 notes (read 8 Nov) | COPY |
| 8 | **Cheap capture surfaces: a Siri or Shortcuts phrase, and later CarPlay or widgets.** Baby Diary offers a spoken phrase to start a recording; Tiny Treasures offers CarPlay; widgets are cut from our v1.0. The PRD target is a 90-second median to the first saved letter. | EVIDENCE for rivals; HYPOTHESIS for value | App Store pages id6762714102 and id6788518267 (read 8 Nov); `docs/prd/v2/03-goals-and-principles.md` PS1; R6 section 5 rank 5 | COPY (shortcut) |
| 9 | **Families who speak more than one language.** Five voice-first baby listings are English only; Toddl lists 8 and TinyNest 31, but those are interface languages for a note and photo product. No voice product asks which languages a family speaks. Our gate per language means we can only lead with languages that pass. | EVIDENCE for competitors; HYPOTHESIS that a gated two or three languages is enough to matter | App Store lookup data for ids 6788518267, 6760676959, 6760956480, 6790823627, 6762714102 (language count 1 each), 6765772923 (8), 6743824334 (31), read 8 Nov | OWN once languages pass |
| 10 | **A calm commercial layer: price shown before relatives are invited, no upsell pop-ups for paying members, a narrow honest privacy label.** TinyNest and Tinybeans reviews describe paywalls discovered after inviting family and pop-ups for members; Tiny Treasures pairs "private by design" with a wide label. Our label cannot say "Data Not Collected" while accounts exist; Dearest's label is narrower than ours will be. | EVIDENCE | TinyNest id6743824334 and Tinybeans id521633042 review slices; Tiny Treasures label (read 8 Nov); `docs/prd/v2/04-market.md` section 4 | OWN, with a plain label |

### Threats, in order (HYPOTHESIS ranking from the evidence above)

1. Remento extends the Baby Book of Firsts with a no-polish option or a phone-first capture, and brings its trust base to our exact buyer.
2. From, Mama's momentum: same price, a Village that writes free, and a founder-led audience; it chose composing text.
3. Baby Diary or a similar app becomes the "free, private, one-time" default that makes a subscription harder to justify.
4. Apple adds family sharing or child-age features to Journal; no sign of it in the article I could open.

## 8. What I could not verify

- Capture taps and seconds for every product: not timed (no installs). Stated flows only.
- Qeepsake pricing page (403), Tinybeans pricing page (404), FirstChapter's website (host unreachable), Trustpilot for Remento, Qeepsake and Storyworth (403), Google Play, Reddit. Trustpilot figures in this file are R6's from 28 Oct.
- Whether Baby Diary's $29.99 purchase is one-time (the listing says so; the purchase list does not state a period). Little Things Plus $3.99 and BabbleLog $9.99 periods likewise.
- What the Qeepsake "Plus" tier contains.
- Whether Dearest's printable books exist in the app (store text says yes; site says coming soon).
- Apple's own page for iOS 27 Journal; the iOS 27 public release date (not needed here).
- Review slices are the latest 50 or fewer per product from one feed, so percentages describe the slice. FirstChapter and Dearest had no usable written reviews in the feed.
- FirstChapter's drop from 5 ratings (CR, 1 Oct) to none (8 Nov): cause not known.
- Sommos, Kindred Tales and Then were not re-opened.
- Our own price and free-tier conflict (section 0).
- Trademark exposure of "Early Chapters" (a separate app; not assessed here).

## 9. Sources (all read 8 Nov 2026 unless stated)

App Store product pages and lookup, US storefront: ids 521633042 (Tinybeans), 1332312787 (Qeepsake), 1044867788 (Day One), 526481189 (23snaps), 734887606 (Chatbooks), 1362796822 (BabyPage), 6447391597 (Apple Journal), 6760676959 (FirstChapter), 6788518267 (Tiny Treasures), 6760956480 (From, Mama), 6790823627 (Dearest), 6751468842 (Sproutbook), 6759982031 (Early Chapters), 6760955024 (Forthword), 6762100529 (Aurloom), 6768291137 (Vellum), 6753202417 (Little Echo), 6755585543 (The Days We Keep), 6759920530 (Tiny Voices), 935672069 (FamilyAlbum), 1505173822 (BackThen), 6743824334 (TinyNest), 1327539226 (The Short Years), 1518127990 (Baby Notebook), 499969127 (Moment Garden), 580644870 (Notabli), 6756802019 (Forevermore), plus the ids in section 3.2. Pattern: `https://apps.apple.com/us/app/id<ID>`, `https://itunes.apple.com/lookup?id=<ID>&country=us`, `https://itunes.apple.com/us/rss/customerreviews/id=<ID>/sortby=mostrecent/json`.

Own sites: https://www.remento.co/ ; https://www.remento.co/babybook ; https://welcome.storyworth.com/storyworth-pricing ; https://dayoneapp.com/plans/ ; https://www.chatbooks.com/pricing ; https://frommama.com ; https://dearestapp.com/ .

Press: https://9to5mac.com/2026/06/11/heres-everything-new-for-journal-in-ios-27/ (published 11 Jun 2026).

Repo files read: `CLAUDE.md`, `docs/research/COMPETITIVE_RESEARCH.md`, `docs/research/competitors/*`, `docs/prd/v2/04-market.md`, `docs/prd/v2/research/R6-benchmark-delta-2026-10-28.md` (R1 to R5 and R7 skimmed by heading and reused by reference), `packages/content/src/pricing.ts`, `docs/DECISIONS.md` (price entries).
