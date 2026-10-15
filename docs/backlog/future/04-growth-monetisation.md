# Future backlog 04: growth, monetisation and lifecycle (after v1.0)

Owner: pm-4 (growth-monetisation). Status: draft for the coordinator to merge, 3 Oct 2026. Not committed.
Scope: how families find Early Letters, start, keep going, pay, stay and come back, inside the founder's decisions of 3 Oct 2026. Other leads: 01 capture, voice, languages (pm-1); 02 family circle (pm-2); 03 book and keepsakes (pm-3); 05 trust, platform, insights (pm-5). Overlaps are settled in `docs/agents/DEBATES.md` Q-006 and Q-008 (section 8).

Read for this file: `docs/agents/BRIEF-2026-10-03.md`, `CLAUDE.md`, `docs/agents/COORDINATION.md`, `docs/prd/PRD.md` 1.3, `docs/prd/C-habits-pricing-settings.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` 2.0, `docs/BACKLOG.md` (v1.1 table), `docs/adr/0013-apple-native-subscriptions.md`, `docs/analytics/TRACKING_PLAN.md`, `docs/analytics/INSIGHTS_LOOP.md`, `docs/store/app-store.md`, `packages/content/VOICE.md` and `BRAND.md`, `packages/content/src/features/billing.en.ts`, `packages/content/src/emails/*.en.ts`, `docs/legal/compliance-register.md`, `docs/legal/subscription-terms.md`, `docs/research/USER_RESEARCH.md`, `docs/research/competitors/us.md`, `global.md`, `adjacent-and-ux-benchmarks.md`.

**Labels on every claim**
- **F** Fact: in a repo document or code (cited), or on a page opened on 3 Oct 2026 (sources in section 10).
- **A** Assumption: ours, to be replaced by real cohorts or research.
- **I** Inference or recommendation: our reasoning from facts.
- **U** Unverified: believed true but not opened today; check before relying on it.

This file is product planning, not legal advice. Every legal line names the rule to check; counsel decides.

**Horizons used here (A; the coordinator may normalise across the five files):** **Now** = v1.1, about 6 to 8 weeks after release (ROADMAP section 6), so mid January 2027 if release is 16 Nov 2026. **Next** = v1.2 and v1.3, February to early May 2027 (v1.3 lands before Mother's Day, Sun 9 May 2027). **Later** = after v1.3.

---

## 0. Bottom line

1. **Price is not our growth problem; being found and being trusted are.** We are the cheapest paid product in the category ($3.99 a month against a $6.24 median; $29.99 a year against a $49.99 median) (F, us.md 8.2). Complaints in the category are about surprise charges and paywalls on memories, not price level (F, us.md 9). Growth comes from the store page, ratings, the co-parent invite and, from v1.1, grandparents.
2. **The name collides in App Store search.** "early letters" returns 19 apps in the US store search API, every one a phonics, alphabet or letter-writing app (F, iTunes Search API, 3 Oct 2026). Nobody should ever have to search for us by name: every link we control is a direct App Store link, and the store page earns category terms (G-02). The trademark is not cleared yet (F, compliance register CR-122); that is a pre-submission founder task, flagged here.
3. **Apple-only billing with no server is workable for growth, with three gaps.** Offer codes, win-back offers, introductory offers, custom product pages and in-app events all run without a server of ours (F, Apple pages opened today). What breaks: gifting a year of Plus to someone else's book (C-REQ-030), the dormant-payer email (C-REQ-031), and Plus for a co-parent outside the subscriber's Apple Family or on Android (G-09, DEBATES Q-008). `BACKLOG.md` BL-308 still assumes a server for the first two and should be marked needs-decision (request in section 9).
4. **A hard date inside the first 30 days (I).** If release is Mon 16 Nov 2026, the first monthly trials end about 16 Dec. The Terms promise a trial reminder in `[E-8d, E-5d]` and a final one in `[E-5d, E-4d]` (F, D-022), so roughly 8 to 12 Dec. No mechanism exists to send them (F, DEBATES Q-003 open; ADR 0013 "Gap"). G-12 must land in v1.0 or a v1.0.1 before 8 Dec, or counsel must confirm Apple's own emails suffice.
5. **The planned 3-arm trial experiment cannot finish at launch volumes (I).** It needs about 1,100 trial starts per arm (F, C section 8). At our assumed 540 trial starts a quarter (A, section 2) that is about six quarters. Decide trial length on evidence instead (G-15: 1 month on both plans), and test only where volume is high: the store page and onboarding.
6. **Measure growth without tracking anyone (G-01).** App Store campaign links, custom product pages, device-assigned experiment arms that reach the server only as a closed-list L2 value, and separate product ids for price or trial arms. No attribution SDK, no ad pixels, no IDFA. The clean privacy label stays a marketing asset (us.md 7.1 point 5).
7. **Monetise by adding Plus value, not by squeezing Free.** Keep $3.99 and $29.99 as the early-families price; once backup, word highlight and themes ship, raise the price for new subscribers only and preserve every existing subscriber's price (G-19). A written, irrevocable "Plus, paid once" option is worth deciding in v1.3 (G-18).
8. **No paid acquisition until an entity exists (F, D-004 trigger list).** The 90-day plan (section 6) is organic: store page, ratings, founder network, US multilingual communities, doulas, content, in-app events.

---

## 1. Constraints that shape every item (F unless marked)

| Constraint | Source | What it means for growth |
|---|---|---|
| Plus is sold, renewed, cancelled and refunded only by Apple; the entitlement is checked on the phone; no server of ours sees purchases | Brief 3; ADR 0013 | Money numbers come only from App Store Connect (ASC). No server-side gifts, promotional offers (they need a server signature, U) or purchase-triggered email |
| Plus reaches a co-parent only through Apple Family Sharing, which cannot be turned off once on | ADR 0013 decision 4 | Co-parents outside one Apple Family, and Android co-parents, pay twice or go without (G-09) |
| Analytics are opt-in, asked as the third ask after the first letter; first-run events are never sent | PRD K-01, PRD-REQ-001; TRACKING_PLAN 2 | Onboarding is measured through server aggregates and ASC, not device funnels |
| No ad, attribution or tracking SDKs; no ATT prompt | TRACKING_PLAN 10; C-NFR-005 | No MMP, no ad pixels on our pages; campaign links and ASC analytics only |
| No streaks, points, badges, counts of gaps; no fear, guilt or loss language | CLAUDE.md; VOICE.md | Every habit and lifecycle touch is invitational and skippable |
| Email is transactional only, no images, pixels or tracked links | VOICE.md; src/emails/*.en.ts headers; LEGAL-REQ-053 | No newsletters, drips or win-back emails in v1.x (G-13) |
| No promotions in notifications | C non-goals; CR-061 (Apple 4.5.4) | Reminders never sell; plan notices are transactional |
| US App Store only | LEGAL-REQ-058; CR-100 | International launches need counsel per market (G-20) |
| Individual publisher; form an entity before paid marketing, 1,000 families, $2,000 a month proceeds, first hire, Android | D-004 point 3 | Paid acquisition and Android wait for the entity |
| Co-parent only at v1.0; other family and the web contribution page in v1.1 | Brief 5, 9 | The grandparent loop starts in v1.1 (pm-2) |
| Plus at v1.0 = Read together after 3 free sessions per book, and books for more children | billing.en.ts; store listing | Plus is thin until v1.1 to v1.3 add backup, word highlight, themes (G-19) |

**Documents out of step (F):** `DECISIONS.md` D-001 and D-002 still describe App Store Server Notifications and family contributors at v1.0, and PRD C-REQ-024 to -031 still assume a server notice engine; the brief and ADR 0013 (both 3 Oct, later) supersede them. This file follows the brief and ADR 0013.

---

## 2. RICE method and baseline assumptions

**RICE = Reach x Impact x Confidence / Effort.** Reach: people affected per quarter. Impact: 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal. Confidence: 100%, 80%, 50%, 20%. Effort: person-weeks across engineering (agents plus coordinator), content and founder time. **Size:** S up to 1 person-week, M 1 to 3, L 3 to 6, XL over 6.

Baseline per quarter for the first two quarters after release. **Every number here is an assumption (A)**; none comes from data, because there is none yet. Replace them with the first two monthly ASC exports and insights reports.

| # | Quantity per quarter | Value | Basis |
|---|---|---|---|
| B1 | Product page views | 30,000 | A |
| B2 | Installs | 6,000 | A: 20% page-view-to-install |
| B3 | First-letter users | 3,600 | A: 60% of installs; UR R1 targets a 90 s first letter |
| B4 | Signed-in families (kept the book) | 1,800 | A: 50% (TRACKING_PLAN 1.2 stage 2 target) |
| B5 | Reminder opt-ins | 1,100 | A: about 60% of those primed (C section 9 target) |
| B6 | Plus offer viewers | 1,000 | A |
| B7 | Trial starts | 540 | A: 15% of first-letter users by day 90 (C section 9 target) |
| B8 | New paid subscribers | 215 | A: 40% trial to paid (C section 9; UR 4.2 median band F) |
| B9 | Lapsed subscribers eligible for win-back | 50 (Q1), 150 (Q2) | A |
| B10 | Co-parent pairs not in one Apple Family, or mixed platform | 30% of signed-in families | A: no data; measure it (G-09, G-21) |

---

## 3. Items

Grouped as: measurement (G-01); being found (G-02 to G-06); starting and keeping going (G-07, G-08, G-11 to G-14); paying (G-09, G-10, G-15 to G-19); new markets and platforms (G-20, G-21). IDs are stable; G-09 and G-10 are cited from DEBATES Q-008 and pm-2's file.

### G-01 Growth measurement without tracking

- **Problem and evidence.** Device analytics exist only for people who opt in after the first letter, so first run is never measured on the device (F, TRACKING_PLAN 2). Money exists only in ASC (F, ADR 0013). The pricing-arm design in C section 8 depended on RevenueCat offerings and was retired (F, TRACKING_PLAN 2). Without a plan, every growth change would be judged by feel (I).
- **Job to be done.** "When we change the store page, onboarding or price, tell us within weeks whether it helped, without tracking a single parent."
- **Solution.**
  1. **Campaign links everywhere.** Every outbound link carries an App Store campaign token per channel (`site`, `prompts`, `invite`, `share`, `doula-<n>`, `press`), read in ASC App Analytics by source (U on the exact report fields; App Analytics source data may cover only people who share analytics with developers).
  2. **Custom product pages** per audience with their own URLs (G-02).
  3. **Device-assigned experiment arms, following pm-5's T5-21 rules.** For non-paywall experiments (onboarding, prompts, reminders), remote config (`app_config`, D-035) lists experiment ids and weights and the phone draws an arm once from a local random number and keeps it. PostHog flags are not used because decliners never load PostHog (F, D-035 rationale).
  4. **Arm on the account, as L2.** At sign-in the arm may travel as a closed-list enum (for example `profiles.experiment_arms`), so the k-anonymised insights views (k = 10, F TRACKING_PLAN 4) can split first-letter conversion, keep-the-book and retention by arm. Needs a DATA_CLASSIFICATION row, counsel on the label, and a migration timestamp range from the coordinator (pm-5 holds none).
  5. **Price and trial arms are compiled into the binary**, never server-driven, because brief decision 16 and ADR 0016 keep the paywall out of remote config. Each arm is a separate product in the one subscription group; the product ids and weights live in the app build, every arm is named in the App Review notes, and remote config may only stop an experiment, never add or re-weight a price. The phone chooses which ids to pass to `SubscriptionStoreView(productIDs:)` (F, ADR 0013 module surface), and ASC then reports trials, conversions and proceeds per product with no join.
  6. **ASC exports into the loop.** A CSV reader for the ASC subscription and offer-code reports in `scripts/insights` (F, INSIGHTS_LOOP 7.3 already proposes it).
  7. **Experiment card.** One page per test: hypothesis, arm sizes, minimum detectable effect computed before starting, stop date, guardrails. With B7 = 540 trial starts a quarter, a two-arm test that detects 40% to 46% trial-to-paid takes about 4 quarters (I, from C section 8's 1,100 per arm); so price and trial tests are sequential reads, and true A/B tests run only on the store page (Product Page Optimization, U on limits) and onboarding.
- **What competitors do.** Calm, Headspace and Finch use ATT and attribution SDKs (F, benchmarks B1, B4); FamilyAlbum lists AppsFlyer and Meta (F, us.md 3.3); Remento uses Meta, Google and TikTok pixels (F, us.md 3.15).
- **Our differentiator.** Measured growth with a privacy label that has no "Data Used to Track You" section (F, TRACKING_PLAN 10).
- **RICE.** 6,000 x 1 x 80% / 3 = **1,600**.
- **Dependencies.** pm-5 (insights cadence, DATA_CLASSIFICATION, migration range, privacy label); analytics engineer (an optional `experiment_arm` global property needs a TRACKING_PLAN change and counsel); coordinator (remote config keys); founder (ASC roles and monthly export).
- **Legal.** Arm values are L2 product configuration, not content; counsel and pm-5 confirm the label is unchanged. Price or trial arms: the Subscription Terms already say the terms shown in the app before subscribing are the ones that apply (F, subscription-terms.md "Plans and prices"); Apple's sheet shows each arm's price and trial. No COPPA or CAN-SPAM effect.
- **Metric.** Share of installs with a known source in ASC; share of growth changes shipped with an experiment card; days from change to readout.
- **Size.** M. **Horizon.** Now.

### G-02 App Store optimisation and the "Early Letters" name collision

- **Problem and evidence.**
  - F: the iTunes Search API (US, 3 Oct 2026) for "early letters" returns 19 apps: Phonics Island, LipLetter Land (Early Literacy), ABC Happy Shark, ABC Letter Tracing, Kids Preschool Learn Letters, Flash Cards ABC, Letter Quiz Preschool and others; no memory or baby-book app. The Search API's order is not the App Store's ranking (U), but the neighbourhood is clear.
  - F: "letters to my baby" returns ABC games, Babylist, WeMoms and The Short Years; "baby memory book" returns The Short Years, BabyPage, BackThen, Qeepsake and TinyNest.
  - F: our listing is "Early Letters: Memory Book", subtitle "Baby journal in your own voice", 100 of 100 keyword characters used (docs/store/app-store.md). BRAND.md already says never use "Early Letters" alone on first mention.
  - F: trademark "Early Letters" is not cleared (CR-122).
  - I: three risks: word-of-mouth searches land on phonics apps; the store may associate us with children's education, which brings the wrong traffic and reads as a child-directed signal (COPPA factor and Apple 2.3.8, CR register item 7); an education app may hold a conflicting mark.
- **Job to be done.** "When a friend tells me about 'that letters app for the baby book', let me find it in one step and see at once that it is for parents."
- **Solution.**
  1. **Never send anyone to search.** Every surface we control (site, invite messages, share sheet, partner cards, press kit, social bios) uses the full "Early Letters: Memory Book" plus a direct App Store link with a campaign token (G-01). Add Apple's Smart App Banner to earlyletters.com (website thread).
  2. **Custom product pages** (F: up to 70; keywords can be assigned so a page shows in search for those terms; deep links on iOS 18 and later): "Bilingual families" (Hindi, Spanish, Arabic, Mandarin, French, Portuguese speakers; keywords such as "hindi baby book"), "Co-parents" (the invitee's landing, G-14), "Expecting" (Before You; doula and shower cards), later "Grandparents" (v1.1, pm-2).
  3. **Spanish listing on the US storefront.** Add a Spanish (Mexico) localisation that says plainly the app is in English and letters can be spoken in Spanish. U: ASO vendors report that the US storefront also indexes Spanish (Mexico) metadata, which would add a second 100-character keyword set; Apple does not document it.
  4. **One keyword change per release**, judged on ASC search impressions and conversion; keep adult, parent-facing terms only; never "kids", never competitor names.
  5. **Product Page Optimization** on screenshot order and the first caption (U on limits: about 3 treatments for up to 90 days).
  6. **Brand-query check** each month on a clean device: "early letters" and "early letters memory book".
  7. **Screenshot lines.** Once the claims registry approves pm-1's voice line (CVL-04, for example "Every voice in the book is real"), it becomes the subline of screenshot 3 ("Your voice stays with every letter"); screenshot 6 keeps the privacy promise as real controls.
  8. **Trademark clearance before submission** (founder, CR-122). If clearance fails, rename before scale; a rename after growth costs reviews, links and memory.
- **What competitors do.** Calm and Day One open with awards and social proof; Day One's second screenshot is privacy (F, benchmarks B2, B4). The Short Years leads "baby memory book" (F, search above).
- **Our differentiator.** A parent-facing listing in more than one language, privacy shown as real controls (screenshot 6), and "never rewritten" as the first promise.
- **RICE.** 30,000 x 0.5 x 80% / 1.5 = **8,000**.
- **Dependencies.** Content and brand owner (listing source in `packages/content/src/store.en.ts`); website thread (banner, links); founder (ASC, trademark); pm-5 (privacy label substance used in screenshots).
- **Legal.** Apple 2.3.7 accurate metadata and no competitor names (F, store doc rule); 2.3.8 and COPPA "directed to children" factors: no kids terms (F, CR register item 7); FTC Act s.5 for every claim (claims registry, LEGAL-REQ-044); Lanham Act exposure until clearance (U, counsel). The Spanish listing must not imply a Spanish interface.
- **Metric.** Product page conversion rate (ASC); share of installs from App Store search; rank 1 for "early letters" within 30 days of release (A); impressions for 10 target terms.
- **Size.** S to M (mostly metadata and content). **Horizon.** Now (trademark: before submission).

### G-03 Rating ask at a meaningful moment

- **Problem and evidence.** A new app starts with zero ratings; most 2026 entrants still have 0 to 10 (F, us.md 2.1). F: Apple shows the system review prompt at most three times in 365 days (Apple, "Requesting App Store reviews"). F: the benchmark recommends asking only after a completed meaningful moment, for example the fifth saved letter (adjacent-and-ux-benchmarks pattern 23, P2). A: rating count and average move store conversion.
- **Job to be done.** "Ask me when I have just felt the point of it, and never when I am busy or upset."
- **Solution.** StoreKit's request-review action (through `expo-store-review`, SDK 57 pin 57.0.3, not installed, F benchmark pattern 23) when all hold: the fifth saved letter or the end of a first Read together; not first run; not during recording, Review, export, the Plus sheet or a birthday; not in a session that already showed a consent or permission ask (counts as the one ask, PRD-REQ-001); once per app version at most (Apple's sample pattern, F); not after a session where the person reverted machine edits (a fidelity doubt). No custom "Do you love us?" pre-prompt.
- **What competitors do.** Calm asks after a session (F, benchmark B1); Qeepsake's cluster of same-day five-star reviews suggests a prompt campaign (I, us.md 3.1).
- **Our differentiator.** Rare, well-timed asks; no incentive.
- **RICE.** 3,600 x 1 x 80% / 0.5 = **5,760**.
- **Dependencies.** Coordinator (install `expo-store-review`, the ask sequencer); analytics engineer (optional `review_prompt_requested` event); content owner (none: Apple's own sheet).
- **Legal.** FTC Trade Regulation Rule on Consumer Reviews and Testimonials (16 CFR 465, finalised August 2024): no review suppression and no incentives conditioned on sentiment (F per law-firm summaries; effective date U, believed 21 Oct 2024). We offer no incentive at all. Apple requires its system prompt for in-app review requests (U on the guideline number). No COPPA or CAN-SPAM effect.
- **Metric.** Ratings count and average (ASC); target 50 or more ratings at 4.7 or higher by day 90 (A); share of 1 to 2 star reviews citing billing or fidelity.
- **Size.** S. **Horizon.** Now (v1.0.1 if the coordinator can fit it).

### G-04 App Store in-app events

- **Problem and evidence.** F (Apple, In-App Events page): events appear on the product page, in search results and in the Today and Apps tabs; up to 10 published and 15 approved at a time; up to 31 days long; promoted up to 14 days before start; name 30 characters, short description 50, long 120; badges Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event; daily repetitive tasks, price promotions and general awareness do not qualify. I: events are one of the few free surfaces where a calm product can appear in search for terms its name does not carry, which helps against the collision (G-02).
- **Job to be done.** "On the days that matter (a first holiday, Mother's Day, the day grandparents can write), show me a reason to write a letter now."
- **Solution.** One event per season, each tied to real new in-app content: a seasonal prompt set (pm-1 owns prompt text; prompts are server-delivered content, brief decision 16) with a deep link to it.
  - Now: **Major Update** for v1.1 (whatever ships: grandparents writing, hearing each other's voices, word highlight).
  - Next: **Special Event** "A letter for the first holidays" (December 2026, if the first event fits the review timeline), "A letter for Mother's Day" (promote from 25 Apr, runs to Sun 9 May 2027), "A letter for Father's Day" (to Sun 20 Jun 2027), Grandparents Day (Sun 12 Sep 2027, after the grandparent flow ships). For multilingual families: Lunar New Year, Ramadan and Eid, Diwali (dates U), using pm-1's opt-in occasion prompts (CVL-08).
  - Occasion events with a religious or cultural meaning are measured only on the store side (ASC). Opening one never stores an occasion preference and never sends a device event that names it, because a celebration can reveal religion (pm-1 CVL-08 keeps occasions opt-in and on the phone).
  - Never the Challenge or Competition badges.
- **What competitors do.** Not observed in the category (U; not checked event by event).
- **Our differentiator.** Events that invite a letter, never a streak.
- **RICE.** 6,000 x 0.5 x 50% / 1 = **1,500**.
- **Dependencies.** pm-1 (prompt sets); content owner (event copy under VOICE.md); design (event card art, U on sizes); universal-link routing to a prompt (coordinator); founder (ASC submission).
- **Legal.** Apple metadata accuracy; holiday names are fine, but the child is never gendered and no health or development language is used (5.1.1(ix) positioning, D-004); audience stays adult (COPPA, 2.3.8). No price promotion in events.
- **Metric.** Event impressions and downloads in ASC (U on the report); for non-religious events only, letters started from the event prompt (consenting sample, `capture_started.source`); WKF in event weeks against the four weeks before.
- **Size.** M for the first event (deep-link route, art), S each after. **Horizon.** Now (Major Update), Next (seasonal).

### G-05 Content marketing

- **Problem and evidence.** F: parents already keep notes files, texts and even an email account for the child (UR 1.3); F: Storyworth sells against "AI rewriting your stories" (us.md 3.16); F: no Hindi or Arabic memory book exists (global 0.4, 5.2); F: 104 prompts already live in `packages/content`. U: search demand for "what to write to my baby" and similar (no keyword data in the repo).
- **Job to be done.** "When I search for what to write to my baby, give me something I can use tonight, even if I never install anything."
- **Solution.** On earlyletters.com (website thread), built from `packages/content` (import, never copy; COORDINATION 5):
  1. A prompt library by month of age, each page ending in a direct link to the store page (campaign `prompts`).
  2. The same library in the seven spoken languages, native-speaker reviewed through pm-1's programme: unique pages in Hindi, Arabic and Portuguese.
  3. Short essays on the real problem: the blank baby book, letters for a second child, two voices in one book, why we never rewrite, keeping a grandparent's language.
  4. The baby shower kit (G-10) and a press kit with real screenshots.
  - No email capture, no pixels, cookieless site analytics only (website thread's choice, U).
- **What competitors do.** Storyworth publishes comparison pages (F, us.md source U56); category blogs not reviewed (U).
- **Our differentiator.** Useful prompts in seven languages, free, with nothing collected.
- **RICE.** 4,000 x 0.5 x 50% / 3 = **333**.
- **Dependencies.** Website thread (publishing); content owner (VOICE.md, claims); pm-1 (prompts and translations).
- **Legal.** FTC s.5 claims (claims registry); testimonials only real, consented and typical (FTC Endorsement Guides 16 CFR 255, U, not opened); never quote a real family's letters without written consent (CLAUDE.md privacy rules); parent-facing (COPPA); no gendered child copy. CAN-SPAM not engaged while there is no list.
- **Metric.** Store page views and installs from `prompts` and `site` tokens; ranking for 10 target queries (A list, set with the website thread).
- **Size.** M, ongoing. **Horizon.** Now (no app release needed).

### G-06 Partnerships: doulas and birth professionals, registries (Babylist), hospitals

- **Problem and evidence.** F: offer codes can be custom codes (up to 64 characters) with redemption limits, up to 1,000,000 redemptions per app per quarter, for new, existing or expired subscribers; Apple says "You're responsible for distributing offer codes"; codes are distributed, not sold (F, ASC offer codes page; C 4.2 [P5]). F: Babylist ranks second for "letters to my baby" in store search, with 141,426 ratings (search above). F: paid marketing triggers forming an entity first (D-004). F: health positioning raises the 5.1.1(ix) risk for an individual publisher (D-004 point 4). A: doulas and childbirth educators are trusted at exactly the right moment (late pregnancy and the first weeks).
- **Job to be done.** "When someone I trust is helping me prepare for the baby, let them hand me one good idea that is not another task."
- **Solution.**
  - **(a) Doula pilot (Next).** 10 to 20 doulas, childbirth educators, lactation consultants and newborn photographers from the founder's network. Each gets printed cards with a QR to the "Expecting" custom product page and their own custom offer code (for example 3 free months for new subscribers, capped at 50). No payment or commission in the pilot.
  - **(b) Registries (Next for editorial, Later for paid).** Pitch Babylist's editorial guides on baby books and keepsakes; offer the gift route of G-10 as a registry line (an Apple Gift Card with our printable gift letter). Babylist's paid brand studio ("The Push", 2022 press release, F that it exists; terms U) only after the entity exists.
  - **(c) Hospitals (Later).** Long sales cycles, hospital vendor and marketing policies, and health positioning that cuts against our Lifestyle listing. Never co-registration: we never receive or share patient or contact data.
- **What competitors do.** Chatbooks and Qeepsake run promo codes (F, us.md 1, 3.9); FamilyAlbum gives free prints (F); Babylist sells sponsored placements (U).
- **Our differentiator.** Partners hand over a card, not a data feed; nothing is collected from them or about their clients.
- **RICE.** (a) 300 x 1 x 50% / 2 = **75**; (b) 1,000 x 0.5 x 20% / 1 = **100**; (c) 1,000 x 1 x 20% / 8 = **25**.
- **Dependencies.** G-16 (offer codes in the app); G-02 (Expecting page); G-10 (gift letter); founder (relationships, printing).
- **Legal.** FTC Endorsement Guides: any partner who is paid, or gets free Plus for recommending us, must disclose it (U, counsel). HIPAA is not triggered while no patient data flows from a covered entity (U, counsel for hospitals). CAN-SPAM only if a partner emails on our behalf (we could become the "initiator"; counsel). Apple: codes cannot be sold. COPPA: adult audience.
- **Metric.** Redemptions per partner code (ASC offer-code reports, U on the report name); installs per partner campaign token; code cohort trial-to-paid.
- **Size.** (a) M, (b) S, (c) L. **Horizon.** (a) Next, (b) Next and Later, (c) Later.

### G-07 Onboarding experiments

- **Problem and evidence.** F: UR R1 targets a median first letter in 90 s or less, and NN/g found card-deck intros give no gain and make apps feel harder (UR 2.2). F: v1.0 opens on one welcome screen; the 4-story intro is v1.1 behind a remote variant switch (D-043, A-REQ-011). F: every subscription benchmark puts its paywall in onboarding; ours never does (benchmark finding 8). F: first run cannot be measured on the device (TRACKING_PLAN 2), and server first-letter conversion sees only signed-in people (TRACKING_PLAN 1.1 blind spot).
- **Job to be done.** "Let me say one thing to my baby before you ask me anything."
- **Solution.** Run one test at a time through G-01, outcome on the server split by arm (first letter by day 1 among new accounts, keep-the-book rate, activated writer by week 4), plus ASC installs per week.
  - **E1 (v1.1):** welcome screen (control) against the 4-story intro.
  - **E2:** first prompt shown on Tonight: a guided opener ("Tell {child} one thing about today") against the open Speak control.
  - **E3:** Keep the book sheet wording (timing stays after the first letter; delaying it risks lost letters).
  - **E4:** reminder prime that previews the actual evening reminder (Finch's pattern, minus the mascot) against today's prime.
  - Never tested: the 18+ gate, consent order, a paywall in onboarding.
- **What competitors do.** Duolingo gives a lesson before the account; Calm and Headspace run a goal quiz and a paywall (F, benchmarks B2, B3, B9).
- **Our differentiator.** Value first, no quiz about health, no paywall.
- **RICE.** 6,000 x 1 x 50% / 3 = **1,000**.
- **Dependencies.** G-01; PRD A owner and mobile (intro ships v1.1); pm-2 (the family step in first run); content owner.
- **Legal.** The 18+ gate (PRD-REQ-019) and consent order (PRD-REQ-001) are fixed and never experimented on; Apple 5.1.1(ii) consent stays. No COPPA or CAN-SPAM change.
- **Metric.** First letter by day 1 per arm (server), keep-the-book per arm, activated writer per arm; guardrail: no arm lowers week-4 retention by more than 3 points.
- **Size.** M. **Horizon.** Now (E1), Next (E2 to E4).

### G-08 First-week habit loop, with no streaks and no guilt

- **Problem and evidence.** F: baby books die in bursts: a few weeks of effort, then nothing (UR 1.2); A: drop-off waves at weeks 2 to 8 and at the end of parental leave. F: goal of 1 to 3 letters a week past month 6 (C goal 1); week-4 active target 35% against a category D30 of 3 to 7% (C section 9, UR 1.2). F: activated writer means letters in two or more weeks within four weeks (TRACKING_PLAN 1.2). F: Apple Journal shows a weeks streak and FirstChapter awards badges (us.md 3.21, 10.11); Tiny Treasures already claims "no streaks, no guilt" (us.md 3.11), so the claim alone does not differentiate.
- **Job to be done.** "In my first week, help me discover that a minute on a few evenings is enough, without ever making me feel behind."
- **Solution.** A designed first seven days, at most one gentle touch a day, every one skippable, no numbers shown:
  - Day 0: first letter, its quiet moment (C F3), Keep the book.
  - Day 1: reminder prime with the time chosen first (C-REQ-001, benchmark pattern 7).
  - Days 1 to 3: a "Hear your first letter" card: the voice is the delight (UR delight 1).
  - Days 2 to 5: one "Make it yours" card per session (exists), ordered by evidence: invite your co-parent first (two voices raise the north star), then words for the dictionary, then goals.
  - First reminder evening: an age-matched prompt (pm-1).
  - Week 2, only if letters were saved on two different days: one offer of the Home Screen widget (pm-1 builds quick-capture surfaces; pm-4 cites it as a habit lever).
  - Back-off from the first week (G-11).
  - Never: streaks, "x days", "keep it going", daily defaults, notifications without permission, any mention of a gap.
- **What competitors do.** Duolingo and Finch build streak ceremonies; Qeepsake sends daily texts that reviewers mute (F, benchmarks B7, B9; UR 3).
- **Our differentiator.** The habit is a few letters a week, carried by voice, the co-parent and the book filling by month.
- **RICE.** 3,600 x 2 x 50% / 4 = **900**.
- **Dependencies.** pm-1 (prompts, widget); pm-2 (invite card); pm-3 (month chapter rendering); content owner; G-01 for the readout.
- **Legal.** Apple 4.5.4: no promotion in reminders (CR-061); content rules test (C-REQ-005). No COPPA or CAN-SPAM effect.
- **Metric.** Activated writer rate (server `retention_cohorts`); week-4 active 35% or more; families with two voices; guardrail: reminders paused or off 10% or less a month.
- **Size.** L. **Horizon.** Next (v1.2).

### G-09 Plus follows the book (co-parents outside the subscriber's Apple Family, and Android)

- **Problem and evidence.** F: under ADR 0013, Plus reaches a co-parent only through Family Sharing; a co-parent outside the purchaser's Apple Family needs their own subscription (ADR 0013 "Consequences"). F: the founder decided "Plus per account, books inherit it from any parent" (D-012, K-28). F: Google Play Family Library cannot share in-app purchases (C 4.2 [P9]), so an Android co-parent can never inherit Plus without a server path. F: divorced parents are likelier to wish they had saved more (50% against 30%, UR 1.1). F: charging the second parent is resented (us.md 8.3 point 4). A: about 30% of co-parent pairs are not in one Apple Family or are mixed-platform (B10).
- **Job to be done.** "When one of us pays, let both of us have it in our child's book, whatever phone or Apple account the other uses."
- **Solution (DEBATES Q-008).** v1.2: the subscriber's app, seeing an active entitlement, writes one date per book it parents (`plus_covered_until`) through an RPC; every member's device, on any platform, treats that book as Plus until the date. No receipt, transaction id or price reaches the server. Later, when backup upload or Play Billing ships (whichever is first), the app sends StoreKit's signed transaction (JWS) to an Edge Function that verifies it statelessly before writing the same column (ADR 0013 "Revisit when").
  - **pm-5's conditions (Q-008):** classify the value **L3** (a purchase-derived fact joined to a book); re-check the privacy label's Purchases type (Linked, App Functionality; never a tracking section, T5-01); the RPC accepts a parent of that book only, caps the date at now plus 400 days, is rate-limited, writes one audit event per write and refuses contributors; the value is cleared when the payer's account is purged; one column serves (b) and (c); a restore never moves coverage between accounts (D-047).
  - **pm-2's conditions (Q-008, FAM-16):** only parents see that a book is covered, as a yes and a date, never who pays or which plan; when coverage ends only Plus extras pause, and the copy never names the other parent ("Plus extras for this book have paused"); coverage is per book, so neither co-parent learns about the payer's other books.
  - The same column lets an Android member use a covered book before Play Billing exists (G-21).
- **What competitors do.** Tiny Treasures and FamilyAlbum cover the whole family on one plan; Tinybeans charges for a second adult (F, us.md 8.1).
- **Our differentiator.** One payment per book, across Apple Families and, later, platforms.
- **RICE.** 540 x 1 x 80% / 2 = **216**.
- **Dependencies.** Founder (it changes the literal wording of brief decision 3); pm-5 (DATA_CLASSIFICATION row, privacy label, Android entitlement plumbing); pm-2 (copy and visibility); payments owner.
- **Legal.** A purchase-derived date on our server is personal information and arguably "commercial information" under CCPA (pm-5, counsel), and it likely changes the privacy label's Purchases answer (pm-5). Abuse risk equals today's on-device enforcement (ADR 0013). No ARL, COPPA or CAN-SPAM change.
- **Metric.** Shared books with Plus where a member is outside the payer's Apple Family (server count, k = 10); support tickets about a partner not seeing Plus; 1 to 2 star reviews about paying twice.
- **Size.** M. **Horizon.** Next (v1.2). **Founder decision.**

### G-10 Gifting Plus, and the baby shower kit

- **Problem and evidence.** F: US grandparents gave grandchildren $2,654 on average last year (UR 4.4); Storyworth and Remento are built on the gift purchase (UR 4.4, us.md 3.15). F: C-REQ-030 ("Gift a year of Plus") assumed a non-renewing purchase granted to the book on a server, which ADR 0013 removed; BL-308 still bundles it. F: Apple allows gifting of IAP items with refunds to the purchaser (C 4.2); offer codes are distributed, not sold. F: TinyNest sells "Gift Lifetime Access" at $199.99 and 23snaps a 12-month gift at $65.99 (us.md 8.1). F: the Subscription Terms say gifts are not available yet. A: a baby shower is when family looks for a meaningful gift, and a shower is a room full of future parents.
- **Job to be done (grandparent or friend).** "Let me give this new family something that lasts, without signing them up for a bill."
- **Solution, in three steps.**
  1. **Baby shower kit (Next, mostly content).** A free printable on earlyletters.com: invitation insert, "Write the first letter" table card with a QR to the "Expecting" page, and a host's guide. At the shower, guests record a short letter for the baby on the expecting parent's phone, into Before You, using pm-2's guest-author mechanic (FAM-07) with pm-2's constraints: adult guests only (no child or sibling chip; child input stays off); one confirmation line per guest letter before saving ("Priya is happy for this to be kept in {child}'s book", Terms 5.4); the parent's account is the author of record; nothing about the guest leaves the phone beyond the letter itself; a quick "next guest" path; guests never see the due date (D-039).
  2. **"Give Plus" with an Apple Gift Card (Next, content only).** A gift page and printable gift letter explaining that an Apple Gift Card can pay for Plus. U: Apple Account balance pays for subscriptions (verify on Apple's support pages before publishing). We sell nothing and issue no code.
  3. **A real gift (Later, needs the founder and an ADR).** "A year of Plus for {child}'s book" as a non-renewing purchase by the giver, granted to the book only after stateless JWS verification (G-09's later path); it never renews and refunds go to the purchaser. A "paid once" gift (G-18) follows the same path.
- **What competitors do.** Storyworth and Remento sell gift years; TinyNest and 23snaps sell gift SKUs; Tiny Treasures has a grandparent phone line (F, us.md).
- **Our differentiator.** The first gift is the guests' own voices in the book before the baby arrives; money is optional.
- **RICE.** Kit and gift card page: 600 x 1 x 50% / 2 = **150**. Gift SKU: 200 x 2 x 50% / 6 = **33**.
- **Dependencies.** pm-2 (FAM-07 guest author); website thread; content owner; pm-3 (printed gift editions and print pricing stay pm-3's, never inside IAP); G-09 (later gift path); founder and counsel.
- **Legal.** Recording consent: California Penal Code 632 requires consent of all parties to a confidential recording (F that it is in the register's list; applicability U, counsel); the confirmation line covers it. The guest's voice and name are the guest's personal data: Privacy Policy coverage (pm-5). Gift-certificate law may apply to a gift SKU (CR-053, maybe). ARL does not apply to a non-renewing gift. Showers include children: the guest flow is adults only (18+ product; COPPA). CAN-SPAM not engaged (no email).
- **Metric.** Kit downloads (site); installs from the `shower` token; Before You letters saved with a guest signature (server count, k = 10, if FAM-07 stores a guest flag); gift page visits to installs.
- **Size.** Kit S (content) plus pm-2's M; gift SKU L. **Horizon.** Kit and gift-card page Next; gift SKU Later.

### G-11 Reminder cadence and notification craft

- **Problem and evidence.** F: default is a few evenings a week (Tue and Sat, 20:30) plus the month-age note (C-REQ-002, K-03); back-off is specified (C-REQ-008, P1) and parked in BL-320; copy rotates through 8 variants (C-REQ-006). F: Duolingo's reminder bandit penalises recent repeats, and Duolingo tells people when it stops sending (benchmark B9). F: iOS provisional authorisation delivers quietly without a prompt (benchmark pattern 7). F: targets: opt-in 60% or more, muted 10% or less a month, letter within 2 h of 12% or more of opened reminders (C section 9). F: reminder events already exist in the catalogue (TRACKING_PLAN 3.1).
- **Job to be done.** "Nudge me when I am likely to have a minute, and stop before it feels like nagging."
- **Solution.**
  1. Ship back-off (C-REQ-008) with its one card, "Would fewer nudges suit you better?" (v1.1).
  2. On-device variant learning: among the 8 approved variants, favour the ones this person opens and writes from (a simple epsilon-greedy choice, no server, content-free), keeping C-REQ-006's no-repeat rule.
  3. The prime shows the real reminder it will send (G-07 E4).
  4. Experiment: provisional (quiet) authorisation only for people who never answered the prime; never after an explicit "Not now".
  5. Month-age and birthday notes stay out of analytics (timing leak rule, TRACKING_PLAN 6.4).
  6. Family-letter notifications (pm-2, FAM-17) never count toward back-off and are never suppressed by it; back-off governs only our own evening reminders.
- **What competitors do.** Qeepsake texts daily (complaints); Day One picks the time before the system alert; Duolingo stops when ignored (F, UR 3, benchmarks).
- **Our differentiator.** Few, invited, and graceful when ignored.
- **RICE.** 1,100 x 1 x 80% / 2 = **440**.
- **Dependencies.** Reminders owner (`apps/mobile/src/lib/reminders`); content owner (variants); pm-1 (prompt in the reminder).
- **Legal.** Apple 4.5.4 (no promotion; CR-061); content rules. No SMS, so no TCPA. No CAN-SPAM or COPPA effect.
- **Metric.** Opt-in after prime; reminders paused or off per month (10% or less); letters within 2 h of an opened reminder (12% or more); WKF.
- **Size.** M. **Horizon.** Now (back-off), Next (variant learning, provisional test).

### G-12 Plan reminders on the device, and the trial timeline

- **Problem and evidence.** F: the Subscription Terms promise reminders when a trial starts, before it ends, before an annual renewal and before price changes ("Reminders from us"); no server of ours sees purchases, so we cannot email them (ADR 0013 gap rows; DEBATES Q-003 open). F: windows in D-022. F: California's ARL requires notice 3 to 21 days before a free trial longer than 31 days converts, and 15 to 45 days before a term of a year or more renews (CR-050, secondary source). F: billing and surprise charges are the top complaint, 17% of recent 1 to 2 star reviews (us.md 9). F: Headspace and Day One show a trial timeline in the paywall (benchmark pattern 10). F: the Plan screen already shows "Cancel by {cancelBy}" (billing.en.ts). I: with release on 16 Nov 2026, the first monthly trial reminders fall due about 8 to 12 Dec 2026 and the first annual long-trial notice about 26 to 31 Dec 2026.
- **Job to be done.** "Tell me before you charge me, in time to decide, even if I forgot I started."
- **Solution.** pm-4 owns the experience; counsel and pm-5 own whether it satisfies the law (Q-003).
  1. A trial timeline in the store view's marketing content: "Today: Plus starts free. {date}: we remind you. {date}: Plus begins unless you cancel." Dates come from the product's introductory offer on the phone.
  2. On a trial start or purchase, the app schedules local notifications and in-app cards at the D-022 targets computed from the transaction's expiration date and the renewal info's will-auto-renew flag (F, ADR 0013 evidence list), replans on every transaction update and foreground, and cancels when auto-renew is off.
  3. The trial start is a fair moment to ask for notification permission if not yet granted ("We'll remind you before Plus begins"), counted as the session's one ask.
  4. In-app cards as the fallback when notifications are off.
  5. Email only if counsel requires it and the founder accepts a server path.
- **What competitors do.** Headspace frames its permission ask as a trial reminder; Bebememo and withyou draw complaints for silent conversions (F, benchmark B3; us.md 8.3).
- **Our differentiator.** We remind every time, inside the strictest state windows.
- **RICE.** 540 x 2 x 80% / 2 = **432**. A legal floor: it ships whatever its score if counsel picks the device route.
- **Dependencies.** Q-003 (counsel); payments owner (`scribe-store` exposes dates and the auto-renew flag); reminders owner (scheduler); content owner (no "trial" outside required disclosures, C section 7); pm-5 (legal tracking).
- **Legal.** ARL (Cal. Bus. and Prof. Code 17600 ff., as amended by AB 2863), ROSCA, and the New York, Virginia, Utah and Massachusetts windows in D-022; Apple as merchant of record (CR-050 open question). A local notification may not count as "notice" if notifications are off; counsel decides. No CAN-SPAM unless email is added (then transactional).
- **Metric.** Refund rate under 3%; billing tickets 2 or fewer per 100 payers a month; zero 1 to 2 star reviews about surprise charges; trial-to-paid not below 40% (guardrail).
- **Size.** M. **Horizon.** Now, and ideally v1.0 or v1.0.1 before 8 Dec 2026 (flag to the coordinator).

### G-13 Lifecycle email, kept to "something happened"

- **Problem and evidence.** F: email is transactional only, with no images, pixels or tracked links (VOICE.md; src/emails/*.en.ts); templates today: magic link, co-parent invite, welcome, deletion steps, export ready. F: classify every template, and prefer no commercial email in v1 (CR-060, LEGAL-REQ-053). F: Qeepsake reviewers got marketing texts "while postpartum"; Tinybeans "emails every day" (us.md 3.1, 9.10). F: the dormant-payer email (C-REQ-031) needs to know who pays, which we cannot (ADR 0013). F: Resend open and click tracking off (ROADMAP founder task). F: pm-2 owns the family digest content; pm-4 owns the sending platform and lifecycle rules (Q-006).
- **Job to be done.** "Email me only when something happened in our book, and never try to get me back."
- **Solution.**
  1. Keep the current set; add "{co-parent} joined your book" (transactional, event-driven, no child name).
  2. A once-a-year note on the anniversary of the account's first letter (never the child's birthday, which would reveal a birth date to the email processor, TRACKING_PLAN 6.4 spirit): "A year of letters. Export a copy any time." Class to be confirmed by counsel (transactional or relationship).
  3. The family digest (pm-2) on the same platform rules.
  4. Platform rules: a template registry with `class`, a plain-text twin, a hashed suppression list, sends only from events the server already has (accounts, books, members), never from purchases. Settings lets people turn off any non-required email.
  5. Retire C-REQ-031 (dormant-payer email); Apple's own subscription emails plus G-12 replace it.
- **What competitors do.** 23snaps and Moment Garden digests are praised; Tinybeans and Qeepsake volume is resented (F, us.md 3.8, 9).
- **Our differentiator.** Fewer emails than anyone, each worth opening.
- **RICE.** 1,800 x 0.25 x 50% / 2 = **113**.
- **Dependencies.** pm-2 (digest content); content owner; server owner (Resend sends from Edge Functions); counsel (classification).
- **Legal.** CAN-SPAM (classification; commercial mail needs an unsubscribe and a postal address, and the individual publisher should use a PO box or mail service, D-004 point 1); CASL in Canada and the UK's PECR when those markets open (G-20); no child name or letter content in any email (src/emails rules). COPPA not engaged.
- **Metric.** Unsubscribe and complaint rates (A target under 0.1%); exports in the week after the anniversary note; co-parent's first letter within 7 days of joining.
- **Size.** S to M. **Horizon.** Next.

### G-14 Referrals and invites as growth

- **Problem and evidence.** F: the north star (weekly keeping families) rises when a co-parent joins, and `family_invites` counts sent and accepted (TRACKING_PLAN 1.1, 4). F: no contacts access, ever (A-REQ-035). F: TinyNest's paywall after inviting family and Tinybeans' "add to my Tinybeans" nagging are recurring complaints (us.md 3.5, 9.8). F: grandparents are why families adopt memory apps everywhere (global 0.6). F: pm-2 owns invite flows; pm-4 owns invites as a channel and anything outside the family (Q-006). A: the co-parent invite rarely adds a new family; the grandparent and family circle (v1.1) adds many contributors, some of whom are or will be parents.
- **Job to be done.** "Let me bring the people who love this child into the book, and tell a friend who is expecting, without feeling I am selling something."
- **Solution.**
  1. **Invite landing.** pm-2's invite link page (FAM-04, the `/i` page on the website) sends an invitee without the app to the "Co-parents" custom product page (later "Grandparents") with the `invite` campaign token, which explains joining a book, not the generic pitch.
  2. **Measure the loop.** Invite sent, install (ASC `invite`), accepted (server), first letter by the invitee within 7 days (server).
  3. **"Tell a friend who is expecting."** One share sheet with the store link (campaign `share`, "Expecting" page), offered once at a value moment: the first completed month chapter, or a later visit to Year in letters (pm-3 BK-07), never on the birthday or Year {n} day itself. No reward, no count, no contacts.
  4. **Contributor to author.** A contributor with no book of their own (v1.1) sees a quiet "Start a book for your own child" in Settings; the first book is free.
  5. **No incentivised referral programme in v1.x.** Revisit Later only if word of mouth stalls, and then only as "give a friend 3 free months" through a custom offer code, with nothing given to the referrer.
- **What competitors do.** TinyNest unlimited invites with a late paywall; Tinybeans follower prompts (F, us.md).
- **Our differentiator.** Invites never meet a paywall, contributors are never nagged, and the person who joins can start their own book later.
- **RICE.** 1,800 x 1 x 50% / 2 = **450**.
- **Dependencies.** pm-2 (invite flows and copy, contributors in v1.1); pm-3 (the value-moment artefact); G-01, G-02.
- **Legal.** CAN-SPAM: a share sheet message is sent by the user from their own phone; with no reward we should not be the "initiator" (U, counsel); a reward would bring CAN-SPAM duties and FTC endorsement disclosure for public posts. No SMS from us (TCPA). Share copy addresses adults (COPPA).
- **Metric.** Invites sent per signed-in family; accepted within 7 days; families with two voices; installs from `invite` and `share`; contributors who start their own book (server, k = 10).
- **Size.** M. **Horizon.** Next (v1.2).

### G-15 Trial length (introductory offers)

- **Problem and evidence.** F: monthly has a 1-month free trial, annual a 2-month free trial (D-012). F: trials of 17 to 32 days have the highest median trial-to-paid, 45.7% (2025 report) and 42.5% (2026 report); no benchmark exists for long trials (UR 4.2). F: our 2-month annual trial is the longest in the category (us.md 8.2). F: under California's ARL, a free trial longer than 31 days needs a notice 3 to 21 days before conversion (CR-050), a duty we cannot meet by email today (Q-003). F: one introductory offer per person per subscription group (ADR 0013). I: the C section 8 three-arm test needs about 3,300 trial starts; at B7 that is about six quarters.
- **Job to be done.** "Give me long enough to see it work, and no longer than I can remember."
- **Solution.** Decide rather than test. Recommend to the founder: from v1.1, the annual intro offer becomes 1 month free, the same as monthly, for new subscribers (an ASC change, no build). If the founder keeps 2 months, keep it only once G-12 is live and counsel accepts device notices. Show the trial timeline (G-12). Revisit with a two-arm product-id test compiled into the binary (G-01 step 5) only if trial starts reach about 1,100 per arm within two quarters.
- **What competitors do.** 7 days (Qeepsake, BabyPage), 14 days (Tinybeans), 30 days (Sproutbook), or a free tier (F, us.md 8.1).
- **Our differentiator.** Still a generous month, a reminder before it ends, and a free core underneath.
- **RICE.** 1,000 x 1 x 50% / 0.5 = **1,000**.
- **Dependencies.** Founder (money); counsel (Q-003); legal owner (Subscription Terms price table and POLICY_VERSIONING); content owner (store description says "free trial" without a length, F).
- **Legal.** ARL and ROSCA disclosures are carried by Apple's sheet plus our marketing content; changing the trial for new subscribers only; Terms table update. A shorter trial removes the over-31-day notice duty (I, counsel to confirm).
- **Metric.** Trial starts per offer viewer (ASC trials over consenting-sample offer views, labelled); trial-to-paid (ASC); annual share 60% or more; refunds under 3%.
- **Size.** S. **Horizon.** Now (v1.1). **Founder decision.**

### G-16 Offer codes

- **Problem and evidence.** F (ASC offer codes page): one-time codes in batches of 500 to 25,000 that expire within 6 months; custom codes up to 64 characters with optional caps; up to 1,000,000 redemptions per app per quarter; eligibility for new, existing or expired subscribers; free, pay-as-you-go or pay-up-front; subscriptions only; redeemable by URL, in the App Store, or in the app; the app must be Ready for Sale. F (Apple docs): in-app redemption uses `AppStore.presentOfferCodeRedeemSheet(in:)` or SwiftUI `offerCodeRedemption`, and Apple says "don't use a custom UI". F: our store sheet shows Restore, policies and cancellation buttons but not `redeemCode` (`modules/scribe-store/ios/PlusStoreSheet.swift` lines 158 to 160), though `redeemCode` is an available store button kind (ADR 0013 evidence).
- **Job to be done (us).** "Thank the families who tested with us, make good on a bad day, and give partners something to hand over, all without a server."
- **Solution.** Add the redeem button to the store view and a "Redeem a code" row under Settings, Plan. Uses: (1) **Founding families**: the 15 to 25 C1 TestFlight families (D-045) get a free year at release through a capped custom code; never conditioned on a review; (2) support goodwill codes after a real failure (pm-5's support tooling holds the playbook); (3) partner codes (G-06); (4) press codes.
- **What competitors do.** Qeepsake promo codes on the web; Chatbooks promotions (F, us.md 1, 3.9).
- **Our differentiator.** Codes as thanks and repair, never as pressure.
- **RICE.** 500 x 1 x 80% / 1 = **400**.
- **Dependencies.** Payments owner (`scribe-store`); content owner (row label); founder (ASC codes); pm-5 (support playbook).
- **Legal.** A code that converts to auto-renewal needs the ARL disclosures; Apple's redemption sheet shows the terms (U on exactly what it shows); the acknowledgment duty is Q-003. FTC 16 CFR 465: no code in exchange for a review. If codes reach testers by email from the founder, counsel to confirm the CAN-SPAM class (prefer handing them over in TestFlight notes or in person).
- **Metric.** Redemptions per code (ASC); the code cohort's conversion to paid when the offer ends.
- **Size.** S. **Horizon.** Now (v1.0.1 or v1.1).

### G-17 Win-back offers

- **Problem and evidence.** F (ASC win-back page): configured per subscription product; eligibility by minimum paid duration (1 to 24 months, or 3 to 5 years), months since lapse (a range), and an optional wait between offers (2 to 24 months); shown on Apple's Manage Subscriptions page (iOS 14.3 and later), in an in-app sheet through StoreKit (iOS 18 and later) and in App Store promotion (iOS 18 and later); up to 350 per subscription and 5 running per storefront per subscription; free, pay-as-you-go or pay-up-front; no server mentioned. F: our Terms say "We never put an offer or extra step between you and cancelling" (subscription-terms.md); a win-back offer comes after a plan has ended, not in the cancel flow. F: our minimum is iOS 17 (D-040), so the in-app sheet reaches only iOS 18 and later.
- **Job to be done.** "If I come back to the book after a break, make it easy to pick Plus up again."
- **Solution.** At v1.2, when B9 shows a real pool, configure one offer per product: lapsed 2 to 12 months, paid at least 1 month, 1 month free (or 3 months at a reduced pay-up-front price; one at a time). Let Apple show it in Manage Subscriptions and the App Store. In the app, allow Apple's win-back message only after a saved letter, never at launch, on a birthday, or in first run (U: how StoreKit lets an app defer that message; verify before building). No email.
- **What competitors do.** Not observed in the category (U).
- **Our differentiator.** One quiet welcome back, shown by Apple, never chased.
- **RICE.** 100 x 1 x 50% / 0.5 = **100**.
- **Dependencies.** Founder (ASC); payments owner (message handling, if any); content owner.
- **Legal.** Re-subscription runs through Apple's sheet (ARL disclosures); FTC guidance on "free" offers (U, not opened). No CAN-SPAM (no email). No COPPA effect.
- **Metric.** Win-back redemptions (ASC); 3-month retention of reactivated subscribers.
- **Size.** S (configuration). **Horizon.** Next (v1.2).

### G-18 A lifetime plan, written as irrevocable: "Plus, paid once"

- **Problem and evidence.** F: lifetime at about $99.99 is planned as P2 (C-REQ-032, D-012). F: UR recommends $79 or more, or a time-boxed founding price; storage for 18 years is about $9 to $18 per family at list prices (A, UR 4.3 calculation). F: Tinybeans reportedly revoked a lifetime plan (single review, U), so terms must be irrevocable (us.md 3.2, 8.3). F: Tiny Treasures $99 once; TinyNest $199.99 gift lifetime; withyou $89.99 (us.md 8.1). F: a lifetime unlock is a non-consumable, restorable (C 4.2), returned by `Transaction.currentEntitlements` (Apple docs, opened today); Family Sharing is available for non-consumables and is irreversible once on (C 4.2). F: Tinybeans+ annual retention 96% with about six-year tenure (us.md 2). I: at 15% commission, $99.99 nets about $84.99, which equals about 3.3 years of annual net ($25.49); long-staying subscribers are worth more, so lifetime can cannibalise.
- **Job to be done.** "This book is for eighteen years. Let me pay once and never think about it again."
- **Solution.** Decide in v1.3 with 4 to 6 months of renewal data. If yes: one non-consumable at $99.99 (US), Family Sharing on, shown as a quiet secondary option beneath the plans (Apple's product view, U on the exact view for non-subscriptions on iOS 17) and in Settings, Plan. A new Subscription Terms section, written as irrevocable: it includes every Plus feature now and later; it will never become a subscription or lose features; if Early Letters ever closes, the 90-day pledge and free export apply (PRD-REQ-009). Name it "Plus, paid once" and explain "for as long as Early Letters exists" rather than "lifetime", whose meaning is unclear. Print stays a separate card purchase (pm-3; Apple 3.1.3(e)).
- **What competitors do.** See evidence; one competitor's revocation is the cautionary tale.
- **Our differentiator.** The promise is in the Terms, not in the marketing.
- **RICE.** 1,000 x 0.5 x 50% / 2 = **125**.
- **Dependencies.** Founder (money); counsel (Terms); G-09 (a paid-once buyer's co-parent outside the Apple Family); payments owner; pm-3 (keepsake features inside Plus).
- **Legal.** FTC s.5: a "lifetime" claim must say whose lifetime; Apple 3.1.2(a): do not take away paid functionality; refunds through Apple; ARL does not apply (no renewal). No COPPA or CAN-SPAM effect.
- **Metric.** Share of Plus buyers choosing paid-once; annual share; proceeds per offer viewer (ASC) against the 8 weeks before.
- **Size.** M. **Horizon.** Next (v1.3 decision). **Founder decision.**

### G-19 Price level and Plus packaging: are we priced too low?

- **Problem and evidence.**
  - F: $3.99 is the lowest monthly price in a 20-app set (median $6.24, floor $4.99); $29.99 ties the lowest annual (median $49.99, interquartile range $39.99 to $59.25) (us.md 8.2).
  - F: Tinybeans Group earns about $52 per paid subscriber a year (us.md 0.10). Our net after 15% is about $3.39 a month or $25.49 a year (C 4.2).
  - F: v1.0 Plus is Read together after 3 free sessions per book and books for more children (billing.en.ts). F: backup and restore and word highlight are planned for v1.1 (ROADMAP 6); themes and covers and an audio keepsake are pm-3's v1.1 to v1.3 items (pm-3 message, Q-006).
  - F: the Subscription Terms say "We never raise your price unless you agree". F: price rises are 10% of recent 1 to 2 star reviews (us.md 9.6).
  - I: today's price fits today's thin Plus. It is low for the Plus the roadmap describes, and the first Plus feature with a real server cost (backup) changes the economics.
- **Job to be done (us).** "Charge enough to keep the book safe for eighteen years, without ever making a family feel cornered."
- **Solution.**
  1. Keep $3.99 and $29.99 at release (founder decision) and treat them in planning as the early-families price.
  2. After backup and word highlight (pm-3 BK-01) ship (v1.2 to v1.3; themes are not a precondition, pm-3 schedules BK-19 Later), raise the price for **new** subscribers only (suggested $4.99 a month and $39.99 a year, still under the medians) and preserve every existing subscriber's price for as long as they stay (U: the exact App Store Connect option; believed available when changing a subscription price).
  3. Read the change as a sequential test: 8 weeks before against 8 weeks after, on trial starts per offer viewer, trial-to-paid and proceeds per offer viewer, with a seasonality caveat.
  4. **Packaging rules for Plus.** Plus adds more (more books, more ways to read together, safekeeping in the cloud, looks); it never gates access to what exists. The Read together free count stays 3 (remote config may only raise it, ADR 0013). Extra themes and covers are Plus (C 4.1). Print is never inside IAP (Apple 3.1.3(e); pm-3). The audio keepsake's tier is decided with pm-3 when it is specified.
     - **Keepsakes (answer to pm-3):** sealed letters (BK-03) are **Free**, because sealing is writing; the year's voices audio file (BK-08) is **Free**, because it is an export of what the family made (keep-and-leave rule; Tiny Treasures already exports audio free, us.md 3.11); Year in letters and On this day (BK-06, BK-07) are **Free** celebrations; word highlight (BK-01) is part of Read together (3 free sessions per book, then Plus); themes and covers (BK-19) are **Plus** when they ship. No share or rating ask on a birthday or a Year {n} day.
     - **One gift entry point, two paths:** a digital year of Plus (G-10, pm-4) and printed gift copies (BK-16, pm-3, $59 first copy and $39 extra copies as pm-3 proposes, always a card purchase outside IAP).
     - **Photos and video (answer to pm-1, CVL-10 and CVL-11):** one photo with a letter is **Free**, including reaching the family through pm-2's shared pipeline, because photos beside words are table stakes (us.md 6.2) and capture is never gated. Short video is **Plus** for upload and sharing (storage cost), while a video kept only on the phone stays Free. Backup of every photo and video follows the backup rule (Plus).
  5. Never personalise prices; never advertise a "was" price.
- **What competitors do.** Section 8.1 of us.md: $4.99 to $12.99 a month, $29.99 to $79.99 a year.
- **Our differentiator.** Loyalty pricing: a subscriber never pays more than the day they joined.
- **RICE.** 1,000 x 2 x 50% / 1 = **1,000**.
- **Dependencies.** Founder (money); G-15, G-18; pm-3 (feature value); pm-5 (infrastructure cost sheet, BL-319); counsel (Terms table, POLICY_VERSIONING).
- **Legal.** ARL price-change notice (7 to 30 days) applies only if existing subscribers' prices change, which this plan avoids; Subscription Terms table update; FTC s.5 on reference prices. No COPPA or CAN-SPAM effect.
- **Metric.** Proceeds per offer viewer; trial-to-paid; refund rate; share of reviews mentioning price.
- **Size.** S (decision, ASC, Terms). **Horizon.** Next (v1.3). **Founder decision.**

### G-20 Order of international launches

- **Problem and evidence.**
  - F: v1 is the US storefront only; EU or UK requires a full GDPR programme (Art. 9 explicit consent, DPIA, Art. 27 representative, transfer mechanism); India's DPDP obligations arrive about May 2027 (compliance register lines 23, 248; CR-100; LEGAL-REQ-058).
  - F: research ranks Canada, the UK and Ireland, Australia and New Zealand, the Gulf, France and Belgium, Taiwan and Singapore, then Brazil, Mexico, Spain and Portugal (Android-gated), then India (global 5.4), with iOS shares of 64.9% (Canada), 62.6% (Australia), 46.9% (UK), 51.6% (Saudi Arabia) (global 1).
  - F: the app UI is English only at v1.0 (brief 6); UI localisation and RTL are pm-5's (Q-006).
  - F: FamilyAlbum suspended print to nine EU countries in July 2026 (global 0.8).
  - U: Canada's PIPEDA, Quebec's Law 25 and Bill 96 language duties; Australia's Privacy Act and Spam Act; the UK DMCC Act subscription rules' start date.
- **Job to be done (us).** "Grow where families already speak our seven languages, without walking into a law we have not prepared for."
- **Solution.**
  - **Step 0, Now: US multilingual families.** No new storefront: the Spanish listing on the US store, the bilingual custom product page and multilingual content (G-02, G-05) reach Hindi, Spanish, Arabic, Mandarin, French and Portuguese speakers in the US, inside today's legal scope.
  - **Step 1, Next: Canada (English first) and Australia and New Zealand.** English UI is acceptable; counsel memo per country first; check CASL and the Spam Act before any email (G-13); Quebec French duties decided before listing in Canada (U).
  - **Step 2, Later: the UK** after the UK GDPR programme (pm-5); lead with letters, not voice notes (global 4: 63% of UK adults never send voice notes, S). Ireland comes with the EU programme.
  - **Step 3, Later: the Gulf** (Saudi Arabia, Kuwait, UAE) after Arabic UI and RTL (pm-5), a dialect policy (pm-1) and PDPL guardian-consent review.
  - **Step 4, Later: France and Belgium** with GDPR and a French UI.
  - **Step 5, Later: Taiwan and Singapore** once Traditional characters exist (pm-1).
  - **Step 6, Later: Brazil, Mexico, Spain, Portugal** after Android (G-21) and LGPD review.
  - **Step 7, Later: India** after Android, Hinglish (pm-1) and DPDP readiness; reach the diaspora first.
  - **Not planned:** mainland China, Japan, Korea (global 5.4).
  - **Per-market checklist:** counsel memo; storefront prices (Apple's equalised prices reviewed by hand); localised listing and screenshots; local Terms and Privacy addenda; email law; support hours; entity status (D-004).
  - **UI language order for pm-5's localisation (T5-19), following this plan:** Spanish first (US families, step 0), French next (Canada, then France), then Arabic with full RTL (Gulf), then Mandarin in the script pm-1 decides (Taiwan, Singapore), Portuguese and Hindi with their Android markets.
- **What competitors do.** FamilyAlbum leads abroad; BackThen is UK-strong; Tinybeans is AU-strong (global 1).
- **Our differentiator.** Spoken letters in the family's language, kept as said, in its own script.
- **RICE.** Canada and Australia step: 900 x 1 x 50% / 4 = **113**.
- **Dependencies.** Counsel; pm-5 (T5-28 privacy programmes per market, timed by this step order; T5-19 UI localisation; privacy labels); pm-1 (scripts, dialects); pm-3 (print opens per region only with in-region production, BK-14); founder (entity, storefronts).
- **Legal.** Per market as listed; COPPA's role is taken by local child-data rules (global 4 implication 4); CAN-SPAM is replaced by CASL, the Spam Act or PECR.
- **Metric.** Installs, first-letter conversion and WKF share per market against the US.
- **Size.** L per market. **Horizon.** Now (step 0), Next (step 1 memos and launch), Later (the rest).

### G-21 Android timing and pricing

- **Problem and evidence.** F: Android and Google Play were deferred to v1.1 (brief 9; ROADMAP 6). F: the Android store module is a stub, and Play Billing needs its own decision (ADR 0013). F: form an entity before Android (D-004 point 3); the full web deletion flow ships before Android (D-042). F: v1.0 excludes Android co-parents (us.md 10.7); Brazil, Mexico and India need Android (global 5.4). F: Play trials can run 3 days to 3 years; grace plus account hold must total 30 days or more; Family Library cannot share in-app purchases (C 4.2). U: the US Android share of smartphones (about 40%, not opened).
- **Job to be done.** "My partner has an Android phone. Let us write in the same book."
- **Solution (pm-4's part; pm-5 owns the build).**
  1. **Gate the Play launch on four things:** G-09 decided (cross-platform Plus); the entity formed (D-004); the web deletion flow live (D-042); iOS week-4 retention read from at least two monthly cohorts. The Play Billing ADR (pm-5) gates selling Plus on Android, not the launch (step 3).
  2. **Measure demand before building.** A content-free "My co-parent uses Android" choice in the invite sheet (pm-2's surface), counted on the server as a k-anonymised aggregate; no email list.
  3. **Free tier first, then Play Billing.** Android can launch with no purchase on Android: Android members use the Free core and get Plus extras in any book a parent covers (G-09). Selling Plus on Android waits for Play Billing (pm-5, T5-16: Q-008 option (c) or RevenueCat). U: whether Google Play's payments policy lets an app honour coverage bought elsewhere without offering Play Billing; pm-5 and counsel confirm before relying on it.
  4. **Pricing once Play Billing exists:** the same prices and trial lengths as iOS at that time (G-15, G-19), US first, Play grace plus account hold of 30 days.
  5. **Positioning:** Android first as "the co-parent's phone", then as the door to Android-first markets (G-20 step 6).
  6. **Timing recommendation (agrees with pm-5's T5-16: readiness in v1.1, store launch in v1.2 or v1.3):** v1.2 to v1.3, not v1.1, unless more than 20% of co-parent invites report an Android co-parent (A threshold). This moves the founder's v1.1 target, so it is a founder decision.
- **What competitors do.** Category leaders run on iOS, Android and web (us.md 6.12).
- **Our differentiator.** A shared book across platforms with Plus following the book (G-09).
- **RICE.** 2,000 x 2 x 50% / 12 = **167**.
- **Dependencies.** pm-5 (build, Play listing, Data safety, Play Billing); pm-2 (Android co-parents and grandparents, invite sheet); G-09; founder (entity, timing).
- **Legal.** Google Play subscriptions policy (trial disclosure); Play's target-audience declaration stays adult (CR-093); ARL for Play purchases with Google as merchant; CAN-SPAM only if a waitlist email exists (avoid). COPPA: adult audience.
- **Metric.** Share of invites with an Android co-parent; Android installs; two-voice families across platforms.
- **Size.** XL (mostly pm-5). **Horizon.** Next (gated). **Founder decision.**

---

## 4. Ranking (all items)

| ID | Item | RICE | Size | Horizon | Decides | Build owner |
|---|---|---|---|---|---|---|
| G-02 | ASO and the name collision | 8,000 | S-M | Now | pm-4, founder (trademark) | content, website thread |
| G-03 | Rating ask at a meaningful moment | 5,760 | S | Now | pm-4 | coordinator, mobile |
| G-01 | Growth measurement without tracking | 1,600 | M | Now | pm-4, pm-5 | analytics, data |
| G-04 | In-app events | 1,500 | M then S | Now, Next | pm-4 | content, pm-1, founder |
| G-07 | Onboarding experiments | 1,000 | M | Now, Next | pm-4 | mobile |
| G-15 | Trial length | 1,000 | S | Now | founder | founder (ASC), legal |
| G-19 | Price level and Plus packaging | 1,000 | S | Next | founder | founder, legal |
| G-08 | First-week habit loop | 900 | L | Next | pm-4 | mobile, content, pm-1 |
| G-14 | Referrals and invites as growth | 450 | M | Next | pm-4 | pm-2, mobile |
| G-11 | Reminder cadence and craft | 440 | M | Now, Next | pm-4 | reminders owner |
| G-12 | Plan reminders on the device, trial timeline | 432 (legal floor) | M | Now (before 8 Dec 2026) | counsel, founder | payments, reminders |
| G-16 | Offer codes | 400 | S | Now | pm-4 | payments, founder |
| G-05 | Content marketing | 333 | M | Now | pm-4 | website thread, content |
| G-09 | Plus follows the book | 216 | M | Next | founder | payments, pm-5 |
| G-21 | Android timing and pricing | 167 | XL | Next (gated) | founder | pm-5 |
| G-10 | Gifting and the baby shower kit | 150 (kit), 33 (SKU) | S, L | Next, Later | pm-4, founder (SKU) | website, pm-2 |
| G-18 | "Plus, paid once" | 125 | M | Next | founder | payments, legal |
| G-13 | Lifecycle email | 113 | S-M | Next | pm-4, counsel | server, content |
| G-20 | International launch order | 113 (step 1) | L each | Now, Next, Later | founder, counsel | pm-5, content |
| G-06 | Partnerships | 100, 75, 25 | S-L | Next, Later | founder | founder |
| G-17 | Win-back offers | 100 | S | Next | pm-4 | founder (ASC) |

Scores rest on the assumptions in section 2; re-score after the first two monthly ASC exports.

---

## 5. Top 10 for v1.1 to v1.3

Order is RICE adjusted for legal floors and dependencies (I).

| Rank | ID | What ships | Release | Why now |
|---|---|---|---|---|
| 1 | G-02 | Direct links everywhere, Smart App Banner, 3 custom product pages (Bilingual, Co-parents, Expecting), Spanish listing on the US store, monthly brand-query check | v1.1 window (metadata, no build); trademark before submission | Highest reach; the name collision costs us every word-of-mouth search |
| 2 | G-03 | Review request after the fifth letter or first Read together, once per version | v1.0.1 or v1.1 | Ratings are the cheapest conversion lever for a new app |
| 3 | G-12 | Trial timeline in the store view; local notifications and cards at D-022 targets | v1.0.1, before 8 Dec 2026 | The Terms promise it and the first trials end mid December |
| 4 | G-01 | Campaign tokens, device-assigned arms, arm on account (L2), per-arm aggregate view, ASC CSV reader | v1.1 | Every later item needs a readout |
| 5 | G-15 | Annual trial to 1 month for new subscribers (founder) | v1.1 (ASC) | Best-evidence trial length; removes the long-trial notice duty |
| 6 | G-16 | Redeem button and Settings row; founding-family year; support and partner codes | v1.0.1 or v1.1 | Tiny build; unlocks partners, thanks and repair |
| 7 | G-07 | E1: welcome screen against the 4-story intro | v1.1 | The intro ships in v1.1 anyway; test it rather than assume it |
| 8 | G-04 | Major Update event for v1.1; Mother's Day event for v1.3 | v1.1, v1.3 | Free search and Today-tab surface |
| 9 | G-08 | The first seven days, with back-off from G-11 | v1.2 | The biggest retention lever, after measurement exists |
| 10 | G-19 | Price review for new subscribers, with every existing price preserved (founder) | v1.3 | Plus will have backup, highlight and themes by then |

Just below the line: G-14 (invite landing and "tell a friend", v1.2), G-11 (variant learning, v1.2), G-09 (Plus follows the book, v1.2, founder), G-18 ("Plus, paid once" decision, v1.3).

---

## 6. 90-day launch growth plan

Assumes submission in the week of 2 Nov 2026 and release on **Mon 16 Nov 2026** (A; ROADMAP section 2). Day 0 is release. No paid media before an entity exists (D-004). Weekly read: the insights report (INSIGHTS_LOOP) plus, monthly, the ASC export.

### Before release (now to day 0)
- Founder: trademark clearance (CR-122); ASC roles; plan the founding-family offer code (codes can be created only once the app is Ready for Sale, F).
- Content and website thread: campaign-token scheme for every link; Smart App Banner; press kit with real screenshots; draft the three custom product pages and the Spanish (Mexico) listing.
- Coordinator: if possible, fold G-03 (review ask) and G-16 (redeem button) into v1.0; otherwise v1.0.1.
- Counsel and pm-5: answer Q-003 by about 20 Nov so G-12 can ship before 8 Dec.
- Submit the app for Apple's featuring consideration through App Store Connect (U on the current nomination form).

### Days 0 to 14 (16 to 30 Nov; Thanksgiving 26 Nov)
- Founding families receive their free year by code; ask nothing in return.
- Founder posts as the maker, openly, in communities that allow it: US bilingual-parent groups (Hindi and Indian diaspora, Spanish-speaking, Arabic-speaking, Mandarin-speaking, Brazilian), and the founder's own network. Follow each group's self-promotion rules.
- Publish the custom product pages and the Spanish listing (one review cycle).
- Watch daily: crash-free sessions (ASC), first-letter conversion (server), 1 to 2 star reviews.

### Days 15 to 45 (1 to 31 Dec)
- Ship v1.0.1 by about 7 Dec: G-12 device plan reminders, G-03 review ask, G-16 redeem button (whichever did not make v1.0). Apple's holiday review slowdown is late December (U), so do not plan a release in the last two weeks of December.
- First monthly trials end from about 16 Dec: watch refunds and billing reviews daily.
- Content: the prompt library by month of age in English (G-05); Hindi and Spanish versions follow native review.
- Optional in-app event "A letter for the first holidays" (Special Event) only if the event content and approval fit before 1 Dec; otherwise skip.
- Month 1 review (about day 30): first ASC export; re-score section 4 with real B1 to B8.

### Days 46 to 75 (1 to 30 Jan 2027)
- v1.1 ships (target mid January): annual trial change if the founder agrees (G-15), onboarding test E1 (G-07), back-off (G-11), G-01 measurement pieces; whatever family features pm-2 ships.
- "Major Update" in-app event for v1.1 (G-04), plus a "Grandparents" custom product page if contributors ship.
- First annual trials end from about 16 Jan: watch refunds and reviews.
- Doula pilot begins (G-06a): 10 partners, cards and capped codes.

### Days 76 to 90 (31 Jan to 14 Feb 2027)
- Babylist editorial pitch and the gift page with the Apple Gift Card route (G-06b, G-10 step 2), after verifying that Apple balance pays for subscriptions.
- Baby shower kit published (G-10 step 1) if pm-2's guest author is scheduled.
- Decide the Android gate (G-21) from the invite-sheet counter, if live.
- Day-90 memo to the founder: what moved, the re-scored backlog, Mother's Day event and custom product page plan (promote from 25 Apr 2027), Canada and Australia counsel scoping (G-20), price review timing (G-19).

### 90-day scorecard (targets are A until first cohorts)
| Metric | Source | Day-90 target |
|---|---|---|
| Product page conversion rate | ASC | Baseline set by day 30, then improving |
| Installs from search, web referrer, campaigns | ASC | 30% or more from sources we control |
| Rank for "early letters" | Manual check | Rank 1 by day 30 |
| Ratings | ASC | 50 or more, average 4.7 or higher |
| First letter by day 1 (signed-in accounts) | Server | Set after month 1 |
| Week-4 active writers | Server | 35% or more |
| Families with two voices | Server | Set after month 1 |
| Trial starts per offer viewer | ASC and device sample | Set after month 1 |
| Monthly trial to paid | ASC | 40% or more |
| Refunds | ASC | Under 3% |
| Reviews citing surprise charges | ASC | Zero |
| Reminders paused or off per month | Device sample | 10% or less |

### Guardrails for the whole period
- No promotional notifications or marketing email; no paywall outside C-REQ-023 triggers (TRACKING_PLAN guardrail "paywall respect": zero).
- No paid media, influencer payments or ad pixels before the entity exists (D-004) and before the external pen test (BL-313; pm-5's T5-03 is gated on pm-4's first paid-marketing date, which this plan places after day 90).
- Rollback rule: any growth change that lowers week-4 active writers by 3 points or more, or raises billing complaints, is reverted in the next release.

---

## 7. Will not build

| We will not build | Why (evidence) |
|---|---|
| Streaks, badges, points, counts of letters or days, challenges or competitions (including App Store "Challenge" and "Competition" events) | CLAUDE.md; VOICE.md no-guilt rule; C-REQ-005, -015 |
| A paywall in onboarding or first run, or a hard paywall | C-REQ-023; PRD-REQ-015; benchmark finding 8 is a deliberate departure |
| A second-chance discount after someone closes the Plus sheet, countdown timers, urgency copy | Finch anti-pattern (benchmark B7); VOICE.md |
| Any offer or extra step in the cancel flow, including Apple's retention messaging | Subscription Terms: "We never put an offer or extra step between you and cancelling" |
| Server-signed promotional offers, until a server-proof ADR exists | Brief decision 3; ADR 0013 (they need a signing key on a server, U) |
| Attribution or MMP SDKs, ad pixels on our website, IDFA, an ATT prompt | TRACKING_PLAN 10; C-NFR-005; us.md 7.1 point 5 |
| Contacts upload or "find friends" | A-REQ-035 |
| An incentivised referral programme (rewards for the referrer) in v1.x | CAN-SPAM "initiator" risk (U); FTC endorsement disclosure; brand fit |
| Marketing push notifications | Apple 4.5.4 (CR-061); C non-goals |
| Re-engagement, "we miss you", drip or newsletter email; SMS marketing | VOICE.md; CR-060 "prefer no commercial email"; category complaints (us.md 9.10) |
| A web checkout or external purchase links | Brief decision 3 |
| Selling offer codes or gift codes | Apple: codes are distributed, not sold (ASC offer codes; C 4.2) |
| Gating writing, reading, playback of a recording, export or co-parent writing; shrinking Free later | C 4.1 keep-and-leave rule; us.md 9.4 |
| Raising an existing subscriber's price | Subscription Terms; us.md 9.6 |
| Personalised or behaviour-based pricing; "was" reference prices | FTC s.5; trust |
| Asking only happy users to review, or any incentive for a review; testimonials before they are real and consented | FTC 16 CFR 465 and Endorsement Guides; BRAND.md proof discipline |
| Real families' letters or voices in marketing without written consent; child-directed marketing or "kids" keywords | CLAUDE.md privacy rules; CR register item 7 |
| Co-registration or contact-data sharing with hospitals, registries or partners | Privacy promise (brief 11) |
| Printed books inside an in-app purchase or a print credit bundled into Plus | Apple 3.1.3(e); pm-3 |
| A "lifetime" plan without written, irrevocable terms | us.md 3.2 and 8.3 |
| Mainland China, Japan or Korea launches in this horizon | global 5.4 |

---

## 8. Ownership and overlaps (DEBATES Q-006, Q-008)

- **pm-4 owns:** pricing, trials, offers, Plus packaging (including the Read together free count, whether themes are Plus, print-credit packaging), lifetime, gifting a digital year of Plus, Android pricing and market timing, international launch order and localised store listings, ASO, in-app events, the store side of invites, "tell a friend", onboarding experiments, the first-week loop and reminder cadence, lifecycle email rules and the sending platform, the marketing use of the privacy label, growth experiments that read the insights loop.
- **Cited, owned elsewhere:** prompt library and seasonal or occasion prompts (pm-1 CVL-08), the "we never make a voice" line (CVL-04), photos and video at capture (CVL-10, CVL-11; their Free or Plus answer is in G-19), quick-capture widget (CVL-13); invite links through WhatsApp, iMessage and WeChat and the `/i` landing (pm-2 FAM-04), guest author (FAM-07), readers and the family digest content (FAM-06), Plus in two homes (FAM-16, scored here as G-09), family-letter notifications (FAM-17); Year One and On this day artefacts, printed gifts, print pricing, word highlight, themes and covers (pm-3); privacy label (T5-01), pen test (T5-03), Android build and Play Billing (T5-16), UI localisation and RTL (T5-19), support tooling (T5-24), cost controls (T5-23), insights loop operation (T5-26) (pm-5).
- pm-3 (`03-book-keepsakes.md`) items cited: BK-01 word highlight, BK-03 sealed letters, BK-06 On this day, BK-07 Year in letters, BK-08 audio keepsake, BK-14 printed Year One, BK-16 gift editions, BK-19 themes. pm-3 owns print pricing ($59 and $39 proposed); pm-4 records the Free or Plus answers in G-19.
- pm-5 (`05-trust-platform-insights.md`): experiment arms follow T5-21 (price and trial arms compiled into the binary); per-market privacy programmes are T5-28, timed by G-20's step order; my counsel items (Q-003, G-01 label, G-10 Penal Code 632, G-13, G-14) are in pm-5's counsel batch.
- **Q-008 (Plus for a co-parent outside the Apple Family):** pm-4 recommends option (b) in v1.2, then (c); pm-2 supports (b) with three conditions (only parents see coverage, copy never names the payer, coverage per book); escalated to the founder.

---

## 9. Requests to other owners and decisions needed

**Founder (money, brand, irreversible):**
1. Trademark clearance for "Early Letters" before submission (CR-122); rename before scale if it fails (G-02).
2. Annual intro offer to 1 month for new subscribers from v1.1 (G-15).
3. Q-008: "Plus follows the book" in v1.2 (G-09).
4. Android target: v1.2 to v1.3 behind four gates, rather than v1.1 (G-21).
5. v1.3 decisions: price for new subscribers with preserved prices (G-19); "Plus, paid once" at $99.99 (G-18).
6. No paid acquisition before an entity; partner payments only after (G-06).

**Counsel and pm-5:** Q-003 answered by about 20 Nov 2026 so G-12 ships before 8 Dec; classification of the account-anniversary email (G-13); CAN-SPAM reading of share-sheet messages (G-14); arm value as L2 and the privacy label (G-01); recording consent for shower guests (G-10).

**Coordinator:**
1. Mark `BACKLOG.md` BL-308 "needs-decision": the gift and the dormant-payer email assume a server that ADR 0013 removed; the trial-length experiment is replaced by G-15.
2. Retire C-REQ-031 (dormant-payer email) and re-scope C-REQ-030 (gift) to G-10 in PRD C.
3. Consider G-03, G-12 and G-16 for v1.0.1 (or v1.0 if they fit).
4. DECISIONS.md D-001 and D-002 still describe App Store Server Notifications and family contributors at v1.0; update to the brief and ADR 0013.
5. Assign a migration timestamp range for the experiment-arm column (G-01) and the book coverage column (G-09, if the founder approves Q-008).

**Content and brand owner:** custom product page copy and the Spanish (Mexico) listing (G-02); in-app event copy (G-04); "Redeem a code" row (G-16); trial timeline copy (G-12).

**Payments owner:** `redeemCode` store button and the offer-code sheet (G-16); expose the expiration date, auto-renew flag and intro-offer period to the reminder scheduler (G-12).

---

## 10. Sources opened on 3 Oct 2026 for this file

- iTunes Search API, US storefront, `entity=software`: terms "early letters", "baby memory book", "baby journal", "letters to my baby", "voice baby book" (raw results kept in the session scratchpad only).
- Apple, App Store Connect Help, "Set up win-back offers": https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-win-back-offers
- Apple, App Store Connect Help, "Set up offer codes": https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-offer-codes
- Apple, In-App Events: https://developer.apple.com/app-store/in-app-events/
- Apple, Custom product pages: https://developer.apple.com/app-store/custom-product-pages/
- Apple Developer Documentation, "Requesting App Store reviews" (three prompts in 365 days): https://developer.apple.com/documentation/storekit/requesting-app-store-reviews
- Apple Developer Documentation, `AppStore.presentOfferCodeRedeemSheet(in:)`: https://developer.apple.com/documentation/storekit/appstore/presentoffercoderedeemsheet(in:)
- Apple Developer Documentation, `Transaction.currentEntitlements` (includes non-consumables): https://developer.apple.com/documentation/storekit/transaction/currententitlements
- FTC consumer reviews and testimonials rule, law-firm summaries (finalised August 2024): https://www.goodwinlaw.com/en/insights/publications/2024/09/alerts-practices-cldr-ftc-finalizes-rule-on-consumer-reviews and the FTC final rule PDF https://www.ftc.gov/system/files/ftc_gov/pdf/r311003consumerreviewstestimonialsfinalrulefrn.pdf (listed in search results; not read in full)
- Babylist, "Introduces The Push" (Business Wire, 2022): https://www.businesswire.com/news/home/20220727005929/en/ (search result only; programme terms not read)

Everything else cites repo documents by path and section.
