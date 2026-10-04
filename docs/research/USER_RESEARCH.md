# Early Letters — User Research (people, behaviour, onboarding, willingness to pay)

> **Note, 4 Oct 2026 (D-051):** Dated 1 Oct 2026; it predates D-051. Its requirement R15 (already-made letters stay playable and exportable whether or not the user pays; the paywall gates only new creation or premium features) is consistent with the 4 Oct model. Findings that recommend unlimited free writing are not the current promise.

Status: desk research, 1 Oct 2026. No primary interviews yet. Competitor coverage lives in `COMPETITIVE_RESEARCH.md`.
Labels: **F** = Fact (sourced) · **S** = Signal (anecdotal or qualitative, sourced) · **A** = Assumption (ours, to validate). [Sn] refers to the Sources list.

Method: Reddit threads read via the Arctic Shift archive, paraphrased. App Store reviews are the 200 most recent US reviews per app (Apple RSS, 1 Oct 2026), keyword-coded by us. Those counts describe recent reviewers, not populations.

---

## 0. Top findings

1. **The problem is real and comes with guilt.** Unfilled baby books feel like a quiet failure. The usual pattern is a burst of effort in the first weeks, then nothing for months [S24][S26][S27] (S). Second children get far less [S7] (F, older UK survey).
2. **The competitor isn't a book. It's the camera roll, texts and DIY tricks.** Parents rebuild dates from photo timestamps and texts, keep notes files, and set up **an email address for the child** to hand over at 18 [S24][S25][S26][S30] (S). That last one is close to exactly the Early Letters job.
3. **Prompts work, but only when they fit the child's age and the parent can answer in seconds.** Qeepsake's 5-star reviews credit its text prompts. Its 1–2-star reviews complain about repetitive questions that don't match the child's age, and about texts that feel like homework [S32] (S).
4. **Billing after inactivity and paywalls on content parents already made are what make people angry.** In the Tinybeans sample, 74 of 124 one- and two-star reviews mention price, subscription or paywall, including content that used to be free and is now locked [S31] (S). Qeepsake reviewers complain about annual auto-renewal with no reminder [S32] (S).
5. **Pricing verdict:** $1.99/month is cheap enough that conversion won't be the main problem. Whether the business can survive is. A 6-month free period is allowed on iOS [S2] (F), but no published benchmark covers trials that long, and month 6 is around when habits fade (S). A $49.99 lifetime price roughly covers 18 years of storage at today's list prices (A, §4.3), but caps revenue per family. **Recommendation:** shorten the trial, or tie its end to the book instead of a calendar date (§4). Raise lifetime to $79–99 or call it a "Founding" offer. Never lock already-recorded letters.

---

## 1. Memory-keeping behaviour

### 1.1 Why baby books go unfilled
- **S** Sleep deprivation, work and chores leave no sit-down time. Parents say a baby book "can sit in the closet, quietly making you feel like you failed" [S24].
- **S** Fixed fields don't match what happened. "Firsts" turn out to be ambiguous ("does that count as a step?"), and some fields feel trivial (for example, the price of gas) [S24].
- **S** Starting late is hard. One parent who began at 4 months had to rebuild "first outing" and "first visitors" from texts and photos and was guessing at month-by-month details. Their advice was to look at the book during pregnancy so you know what to capture [S27].
- **S** The physical steps of printing, sorting and pasting are what stall people: "never get time to get pictures printed" [S29b]. Several parents are holding a baby on a contact nap and want to do it on the phone [S29b].
- **F** 35% of parents of adult children wish they had saved more. Among divorced parents it is 50%, versus 30% of married parents [S8].

### 1.2 When parents stop
- **S** It "lasted maybe a few weeks" [S25]. One parent filled out one page by 3 months [S26]. Others report blank books at 14 months, 19 months, almost 2 years and almost 3 years [S24].
- **A** The drop-off probably comes in two waves: right after birth (weeks 2–8) and when parental leave ends (US commonly around 3–4 months). **Validate** with cohort data.
- **F** Average app day-30 retention across categories is about 3–7% [S23].

### 1.3 What parents keep instead
- **F** Photos are by far the most-saved memento (95% of parents of adult children). Cards and letters are at 55% and videos at 57% [S8].
- **S** Camera roll and timestamps, searchable texts to a partner or grandparent, Google Docs or Notes "memories" files, monthly mini photo books, and more cloud storage [S24][S25].
- **S** **A dedicated email account for the child**, written to over the years and handed over at 18. This came up independently in r/beyondthebump and r/daddit. One parent said they recently handed it over and it was fun to read [S26][S30]. Variations include sealed birthday letters to open at 18 or 25 [S30].
- **S** Spoken and video formats: a father records monthly videos talking to his son's future self [S25]. Another records his toddler's babble with Voice Memos [S30b].

### 1.4 Segment differences
| Segment | Evidence | Label |
|---|---|---|
| **Second children** | 87% of mothers said they had noticeably fewer photos of the second child, 75% of those photos included the older sibling, and 92% later regretted it (UK, n=2,000, 2013, commissioned by a photo studio, so read as directional) [S7]. A younger sibling resents having no book [S26]. | F (weak), S |
| **Fathers** | Fewer in baby-book threads, but often write *letters* or record *videos to the future child* [S25][S30]. Mothers use social media for parenting advice more (84% vs 69%) [S9]. Personal-device kin work draws in men more than older formats did [S16]. | S, F |
| **Co-parents** | Photos of mum with baby live on the partner's phone, so the record is split across devices [S3x: r/beyondthebump 1ttuln6, title only, A]. | A |
| **Grandparents** | 76% of US grandparents say digital tools are a primary way they stay connected [S15]. Some push for baby books and keep their own journals [S24]. Contributions can cross lines: an aunt edited a family-tree page, causing real distress [S28]. Grandparents struggle with app UX and ads [S31]. | F, S |
| **Multilingual / Indian diaspora** | 72% of Indian Americans aged 5+ speak a language other than English at home, and 66% are immigrants [S13]. Off-the-shelf Whisper large-v2 scored a 52% mixed error rate on Hindi-English code-mixed speech and tends to *drop* words at language switches [S12]. Grandparents are described as primary carriers of heritage language in multigenerational households (Pakistan, in-country sample) [S14]. | F, S |

**Implication (A):** The "only fix slips, never rewrite" promise is most at risk with Hinglish. Dropped Hindi words are the opposite of faithful. The original audio is the safety net, and it has to be one tap away.

---

## 2. Onboarding

### 2.1 What parents will and won't share
- **F** Among parents of 0–4-year-olds, 63% are concerned about sharing that could identify a child's location and 62% about content that could embarrass the child later. 30% avoid posting photos or videos of their child and 31% don't discuss the child on social media at all [S9].
- **S** Parents choose private family apps specifically to keep the baby off social media and stop sending photos to 18 people [S25].
- **A** A name or nickname and birth date are acceptable at sign-up because the age-by-month book clearly needs them. A meaningful minority will refuse or delay a photo, surname, partner email or contacts access. Expecting parents need a **due date** mode (pregnancy pages were a missed opportunity in [S27]).
- **F** Apple: apps that collect personal information about a minor need a privacy policy and must comply with children's privacy laws. Apps outside the Kids Category must not imply in their metadata that children are the main audience [S1 §5.1.4]. Early Letters' users are adults writing *about* a child (A: keep metadata parent-facing).

### 2.2 Story intros and carousels
- **F** In NN/g testing, deck-of-cards tutorials produced no significant gain in task success (91% vs 94% for people who skipped) and made apps seem *harder* (perceived ease 4.92 vs 5.49). NN/g recommends investing in the UI and contextual help instead [S10].
- **A** A short emotional "why" can still earn its place if it is skippable and ends with the user recording their first letter. A tour of features can't.

### 2.3 Sign-in method
- **F** Guideline 4.8 (current text): an app that uses a third-party or social login (for example Google) for the primary account must also offer an equivalent service that limits data to name and email, lets users keep their email private, and doesn't track for ads without consent [S1]. Sign in with Apple meets these, but the rule no longer names it, so Google-only is not allowed and email or magic-link-only is exempt.
- **F** NN/g on emailed one-time codes and links: switching apps, spam filtering and delays add friction. Recommends offering alternatives and adding biometrics or passkeys after sign-up [S11].
- **Gap:** We found no credible public data comparing uptake or drop-off for Sign in with Apple, Google and magic links. Treat it as a launch A/B metric (A).
- **A** Apple's private relay email will complicate family invites, so invite by link or code.

---

## 3. Habit and engagement

- **S** Prompts that arrive where the parent already is and can be answered "whenever you've got a sec" keep Qeepsake users going for years [S25][S32]. 92 of 200 Qeepsake reviews mention prompts or reminders, including 20 of 43 negative ones [S32].
- **S** What gets prompts muted: repeated questions, questions that don't fit the child's age (asking about milestones for a 5-day-old), daily texts that need long answers, and texts that continue after account deletion [S32].
- **F (weak)** Older vendor data says 60% of iOS users opted out of push, with irrelevance and frequency the main reasons. It comes from a 2016 internal survey of 14 people, so it is directional only [S21]. Explaining the value before the system prompt raised one brand's opt-in rate by 10% [S22].
- **S** Guilt is the dominant emotion around gaps ("felt like the absolute worst mother") [S24]. The app that helped one parent "doesn't make me feel behind" [S24]. Streaks would reproduce the blank-book shame.
- **S** Workable "missed days" patterns: a calendar left open, adding a note only when something happens [S24]. Writing down things in hindsight using photo timestamps [S24].
- **A** Acceptable reminders: 1–2 a week, in a window the parent picks, anchored to the **monthly birthday** ("Asha turns 7 months on Friday"). Good celebrations: a finished month's chapter, a letter played back, a grandparent's first letter. Gamified ones to avoid: streaks, badges, "you missed 12 days".
- **S** Co-parent participation is uneven. Dads write letters or make videos on their own cadence [S25][S30]. Mothers often coordinate family photo flows [S3x]. **A:** each author keeps their own voice and cadence, and the book merges them.

---

## 4. Willingness to pay

### 4.1 What parents pay today
| Product | Price | Label |
|---|---|---|
| Qeepsake | $4.99/mo or $47.88/yr (Essential). $9.99/mo or $95.88/yr (Premium). 7-day trial. No lifetime option [S18] | F |
| Storyworth | from $59/yr including one hardcover book. Voice-by-phone is an upgrade. Sold as a gift [S17] | F |
| Chatbooks Monthly Minis | $10/book/month or $100/yr [S19] | F |
| Tinybeans | reviewers cite about $75/yr and a rise from $4.99 to $7.99/mo [S31] | S |

- **S** Parents object to digital baby books that "end up costing hundreds of dollars" and want a self-printable file [S29]. Export is part of willingness to pay.
- **A** At $1.99/mo (about $24/yr), Early Letters is half of Qeepsake Essential. Trust and fear of lock-in are the barrier, not price.

### 4.2 Trial length — 6 months
- **F** Apple allows a 6-month or 1-year free intro offer on any auto-renewable subscription, limited to one intro offer per customer per subscription group [S2]. Google Play allows trials from 3 days to 3 years [S3].
- **F** Trials of 17–32 days have the highest median conversion: 45.7% (2025 report) and 42.5% versus 25.5% for trials of 4 days or less (2026 report) [S5][S6]. 82% of trial starts happen on install day [S5]. Hard paywalls convert about 5× better than freemium by day 35 (10.7% vs 2.1%) with similar 12-month retention [S6].
- **Gap:** No public benchmark exists for 6-month trials (F, absence).
- **Risks (A):** (1) The trial ends near the second drop-off wave (§1.2), so many users will be dormant when asked to pay. (2) Active users hold six months of irreplaceable voice letters, so the paywall can feel like a hostage situation, which is what angers Tinybeans and Qeepsake reviewers [S31][S32]. (3) Any pricing signal is delayed by half a year.
- **Benefits (A):** No risk to start, and the product proves its value through the book.

### 4.3 Stress-test: $49.99 lifetime
- **F** Small-business commission is 15% (developers under $1M/yr) [S4], so about $42.49 net before tax.
- **F** Supabase Storage: $0.021/GB-month beyond 100 GB on Pro [S20]. **A (ADR 0005):** about 19 MB per active family per month.
- **A, calculation:** Linear growth to about 4.1 GB over 18 years averages about 2 GB over 216 months, ≈440 GB-months ≈ **$9** at list price, or about $18 with the encrypted backup (ADR 0006), plus egress and support. Lifetime covers *storage*. The real risks: (a) an 18-year obligation, (b) heavy multi-author families costing 3–5× more, (c) support continuing after revenue stops, and (d) Apple protecting existing "full unlock" buyers if the model changes [S1 §3.1.2(a)].
- **F** Mechanics: a one-time unlock is a non-consumable IAP. A free time-limited trial before a non-subscription unlock must use a $0 non-consumable named "XX-day Trial" and disclose its duration and the charges up front [S1 §3.1.1]. You can't attach a subscription intro offer to a lifetime purchase. 35% of apps now mix subscriptions with lifetime or consumable purchases [S5].
- **Verdict (A):** Keep lifetime, because it suits an 18-year keepsake and a gift purchase, but price it at $79–99 or limit it to a time-boxed "Founding Family" offer. Make "your letters and audio are always yours to play and export" the promise that holds whether or not someone pays.

### 4.4 Grandparents as buyers
- **F** 9 in 10 US grandparents gave financial support to grandchildren last year, averaging $2,654/yr [S15]. Storyworth is built around the gift purchase [S17].
- **F** Apple allows gifting of IAP-eligible items, but refunds go only to the original purchaser [S1 §3.1.1].
- **A** "Give Early Letters" (a lifetime or 1-year gift, ideally with a printed book) is likely an easier first purchase than a parent's own subscription.

---

## 5. Jobs, fears, delights

**Jobs to be done**
1. "Help me capture this moment in under a minute, one-handed, before it's gone" [S24][S29b] (S)
2. "Let me talk to my child's future self in my own words and voice" [S25][S30] (S)
3. "Fill the baby book without guilt or catch-up homework" [S24][S27] (S)
4. "Let grandparents and my partner contribute without me curating everything", but with my control [S25][S28] (S)
5. "Keep our languages and family voices for my child" [S13][S14] (F/S)

**Fears**
1. Losing the memories through app shutdown, paywall or deletion [S31][S32] (S)
2. Being charged for something I'm not using [S32] (S)
3. My child's data being exposed or used [S9] (F)
4. Being made to feel behind [S24] (S)
5. Someone else changing my child's record. This applies to people (the aunt [S28], S) and also, by analogy, to AI that "rewrites" (A)

**Delights**
1. Reading entries aloud to the child years later. One parent's favourite childhood memory is their mother reading her journal at bedtime [S27] (S)
2. Handing over a lifetime of letters at 18 [S30] (S)
3. Being reminded of things you'd forgotten [S32] (S)
4. Grandparents getting something tangible (prints, books) [S25] (S)
5. A finished, beautiful book per year [S32] (S)

---

## 6. Implications for requirements

| # | Requirement (testable) | Evidence |
|---|---|---|
| R1 | Time from first launch to first saved letter is ≤ 90 s at median, with no tutorial screens before the first recording. Any intro is ≤ 3 screens and skippable. | S10, S24 |
| R2 | Required at sign-up: child's first name or nickname plus birth date **or** due date. Everything else (photo, surname, partner, siblings) is optional and can be added later. | S9, S27 |
| R3 | Supports multiple children per account from day one, each with their own book. Adding a second child takes ≤ 3 taps. | S7, S26 |
| R4 | Offers Sign in with Apple plus email magic link or OTP. If Google is added, Sign in with Apple must be present (4.8). Track drop-off for each method. | S1, S11 |
| R5 | Co-parent and family invites work by link or code, not email lookup, so they work with Apple private relay. | S1, A |
| R6 | Recording works one-handed and can be started from the lock screen or a widget. Recording never requires typing. | S29b, S25 |
| R7 | Default reminders are ≤ 2 per week, plus a monthly-birthday nudge. The parent picks the time window. Pausing all reminders takes 1 tap. Notification permission is requested only after the first letter is saved, with a pre-permission explanation. | S21, S22, S32 |
| R8 | Prompts are age-aware (by month of age or pregnancy week) and never repeat within 12 months. They can be skipped and replaced. | S32 |
| R9 | No streaks, missed-day counters or "you're behind" copy anywhere. Empty months show an invitation to write about them now, not a failure state. | S24 |
| R10 | Letters can be backdated to any past date or month ("write about month 3 today"), with photo-date suggestions. | S24, S27 |
| R11 | Every transcript links to its original audio in 1 tap. Editing defaults to fixing slips only, with the diff visible. Language-switch segments with low confidence are flagged instead of dropped. | S12 |
| R12 | Supports Hindi, English and mixed recordings per letter. The script used (Devanagari or romanized) is the author's choice and saved per author. | S12, S13 |
| R13 | Each letter keeps its author. Family members can add letters but cannot edit or delete anyone else's. The book owner approves what goes into the book. | S28 |
| R14 | The grandparent contribution flow needs no app install for the first letter (web link or voice) and shows no ads. | S15, S31 |
| R15 | Already-recorded letters and audio stay playable and exportable (PDF + audio ZIP) forever, whether or not the user pays. The paywall gates only *new* creation or premium features. | S29, S31, S32 |
| R16 | Users get an email or push 7 days before any trial ends or plan renews. Annual or lifetime is never auto-selected without an explicit choice. | S32 |
| R17 | The trial end is tied to engagement, not just the calendar. Test 30 days against "free through month 3's chapter" against 6 months. The paywall appears at a moment of value (finishing a chapter), not at the deadline. | S5, S6 |
| R18 | Lifetime is offered as a non-consumable at ≥ $79, or as a time-boxed founding price. Any free trial before a non-subscription unlock follows 3.1.1 "XX-day Trial" disclosure. | S1, S4, S20 |
| R19 | Gifts: a family member can buy a 1-year or lifetime plan for a child's book (an IAP gift or a web code redeemable in-app). | S1, S15, S17 |
| R20 | "Read together" plays a month's letters in each author's voice in sequence. The first playback of a completed month is celebrated once, without confetti-style gamification. | S27, S30 |
| R21 | Sealed letters: an author can lock a letter until a chosen age or date. | S30 |
| R22 | Privacy copy at sign-up states in ≤ 2 sentences what's stored, that there are no ads or data sales, and how to export or delete. No contacts access is requested. | S9, S25 |
| R23 | App Store metadata is parent-facing and doesn't present the app as "for kids". | S1 §5.1.4/2.3.8 |

### Research questions to validate
1. At which weeks do capture habits fade for new parents (birth, return to work, month 6), and does voice capture move those points?
2. Will parents pay at a moment of value (a finished month) at higher rates than at a calendar deadline? What's the cohort conversion for 30-day versus 6-month trials?
3. How faithful do Hinglish or code-switched transcripts need to be before authors trust them, and do authors prefer Devanagari, romanized text or both?
4. Who buys: the parents, grandparents as a gift, or both? What lifetime price do grandparents accept?
5. How much control do parents want over others' contributions (approve all, approve first, or open)?

### Interview guide (10 questions, 45 min, parents of 0–24-month-olds plus 2 grandparents)
1. Walk me through the last time something happened with your baby that you wanted to remember. What did you do with it?
2. Show me where your baby memories live today (camera roll, notes, texts). What's missing?
3. Did you start a baby book? Tell me how it went, week by week.
4. When you fall behind on something like this, how does it feel? What helps you get back?
5. Have you ever talked or written *to* your child for later? How, and what stopped or kept you going?
6. Who else in the family would want to add to this? What would worry you about that?
7. (Multilingual) Which languages do you and the grandparents use with the baby? How should a transcript of mixed speech look to you?
8. What would you be comfortable telling an app about your child on day one? What would you never share?
9. Think of an app you pay for monthly and one you bought once. What made each feel worth it, or not?
10. If this ran free for some months and then asked you to pay, when and how would that feel fair? What would make you leave?

---

## Sources
- [S1] Apple, App Review Guidelines (4.8, 3.1.1, 3.1.2, 5.1.4) — https://developer.apple.com/app-store/review/guidelines/ (accessed 1 Oct 2026)
- [S2] Apple, App Store Connect Help — Set up introductory offers — https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions
- [S3] Google, Play Console Help — Understanding subscriptions — https://support.google.com/googleplay/android-developer/answer/12154973
- [S4] Apple Newsroom, App Store Small Business Program (2020) — https://www.apple.com/newsroom/2020/11/apple-announces-app-store-small-business-program/
- [S5] RevenueCat, State of Subscription Apps 2025 — https://www.revenuecat.com/state-of-subscription-apps-2025
- [S6] RevenueCat, State of Subscription Apps 2026 summary (Mar 2026) — https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026
- [S7] PetaPixel on Venture Photography survey of 2,000 UK mothers (2013) — https://petapixel.com/2013/09/16/second-child-gets-less-space-family-photo-album-study-documents/
- [S8] YouGov, childhood mementos poll (May 2024) — https://yougov.com/en-us/articles/49868-nearly-all-parents-adult-children-saved-childhood-photos-art-poll
- [S9] C.S. Mott Children's Hospital National Poll, Sharenting (Nov 2023, n=614) — https://mottpoll.org/sites/default/files/documents/112023_Sharenting.pdf
- [S10] NN/g, Mobile Tutorials: Wasted Effort or Efficiency Boost? — https://www.nngroup.com/articles/mobile-tutorials/
- [S11] NN/g, Passwordless Accounts (Jun 2023) — https://www.nngroup.com/articles/passwordless-accounts/
- [S12] Biswas et al., Adapting Whisper for low-resource Hindi-English code-mix speech, Interspeech 2025 — https://www.isca-archive.org/interspeech_2025/biswas25_interspeech.pdf
- [S13] Pew Research Center, Indians in the U.S. fact sheet (2023 data) — https://www.pewresearch.org/race-and-ethnicity/fact-sheet/asian-americans-indians-in-the-u-s/
- [S14] Frontiers in Psychology (2025), Family language policy and heritage language transmission in Pakistan — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1560755/full
- [S15] AARP, The Essential Role of Grandparents (survey Nov–Dec 2025, n=3,283) — https://www.aarp.org/pri/topics/social-leisure/relationships/the-essential-role-of-grandparents/
- [S16] Eklund, Kinwork revisited, Convergence (2023) — https://journals.sagepub.com/doi/10.1177/13548565231185864
- [S17] Storyworth — https://welcome.storyworth.com/
- [S18] Qeepsake pricing — https://www.qeepsake.com/pricing
- [S19] Chatbooks Monthly Minis — https://chatbooks.com/products/monthly-minis
- [S20] Supabase Storage pricing — https://supabase.com/docs/guides/storage/management/pricing
- [S21] Braze, Why users opt out of push (2016, includes n=14 internal survey) — https://www.braze.com/resources/articles/opt-out-of-push-notifications-why-users-do-it
- [S22] Airship, Increase push opt-in rates — https://www.airship.com/blog/increase-push-notification-opt-in-rates-with-these-two-tactics/
- [S23] Sendbird, App retention benchmarks (Mar 2024; aggregates Statista, Adjust, AppsFlyer) — https://sendbird.com/blog/app-retention-benchmarks-broken-down-by-industry
- [S24] r/beyondthebump, "I owe an apology to every mom I ever gifted a baby book" — https://www.reddit.com/r/beyondthebump/comments/1nhync1
- [S25] r/beyondthebump, "How are you documenting memories?" — https://www.reddit.com/r/beyondthebump/comments/1k0hag7
- [S26] r/beyondthebump, "Did your parents do a baby book for you?" — https://www.reddit.com/r/beyondthebump/comments/1fj7467
- [S27] r/NewParents, "Baby book tip: you gotta commit early!" — https://www.reddit.com/r/NewParents/comments/1o8nplf
- [S28] r/beyondthebump, "Aunt wrote in my son's baby book without asking" — https://www.reddit.com/r/beyondthebump/comments/1n5ours
- [S29] r/NewParents, digital baby book cost thread — https://www.reddit.com/r/NewParents/comments/1lt7fap · [S29b] r/NewParents, "Baby book" (contact-napping parent) — https://www.reddit.com/r/NewParents/comments/1lldeq5
- [S30] r/daddit, "Dads, did any of you write letters to your kids before they were born?" — https://www.reddit.com/r/daddit/comments/1ka891y · [S30b] r/daddit, Voice Memo tip — https://www.reddit.com/r/daddit/comments/35rta4
- [S3x] r/beyondthebump, photo book / partner's phone thread (title only read) — https://www.reddit.com/r/beyondthebump/comments/1ttuln6
- [S31] Apple App Store US reviews, Tinybeans (id 521633042), 200 most recent, coded 1 Oct 2026 — https://itunes.apple.com/us/rss/customerreviews/id=521633042/sortby=mostrecent/json
- [S32] Apple App Store US reviews, Qeepsake (id 1332312787), 200 most recent, coded 1 Oct 2026 — https://itunes.apple.com/us/rss/customerreviews/id=1332312787/sortby=mostrecent/json
- Internal: `docs/adr/0005-audio-format.md` (19 MB/family/month assumption), `docs/adr/0006-encrypted-backup.md`.
