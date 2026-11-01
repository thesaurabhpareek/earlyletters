> Update, 1 Nov 2026: the Amplitude Calm page, the Irrational Labs Headspace page and Duolingo's 2020 post were re-opened afterwards. See section 6 of docs/design/NOTIFICATIONS.md for what they actually say. The Duolingo post gives no daily-active or retention figures.

# Research A: market and published evidence for reminders and photo nudges

Date: 1 Nov 2026. Lane: published and market evidence only. Nothing here was tested with parents.

Evidence tags: [1P] the vendor's or Apple's own documentation or page; [EXP] a published controlled experiment; [VC] vendor claim or case study, not independently checked; [AN] anecdote or review; [REPO] already in our docs, not re-checked by me; [UNVERIFIED] I could not confirm it.

## Recommendation first

1. Keep the F13 shape: ask after the first saved letter, parent picks the time, about 2 a week, skip when the parent already wrote, stop gracefully when ignored. Every part of this is backed by at least one competitor's documented behaviour or a user complaint. None of it is backed by a number for baby apps, because no one publishes one.
2. Treat 20:30 as a hypothesis, not a finding. I found no published evidence on the best notification time for new parents, newborn or older infant. The only sleep study I could open says only that new-mother night sleep is fragmented.
3. Drop the 60% grant target as "evidence-based". The only public iOS figure is a vendor median of about 49% across all app types (below). It is a guess for us until we measure.
4. For photo nudges, the closest first-party precedent is Apple Journal, which makes suggestions on-device and lets the user choose which data feeds them. Copy that consent model, not an auto-generated story.

## 1. Timing for new parents

| Question | What exists | Tag |
|---|---|---|
| Best push time for new parents | No study found. The Airship 2026 benchmark report does not cover time of day | [1P] absence |
| Do new parents sleep at predictable times | A 24-mother study: first-time mothers of newborns fell asleep and woke at their preferred times, but night sleep was heavily interrupted; the authors say exhaustion comes from fragmentation more than timing. Small, mostly white, married, high income sample; postpartum weeks not stated | [EXP, small] AASM summary |
| Newborn vs older infant | Nothing on notifications. The same study found mothers with older children at home woke earlier than they wanted. A Swiss study of smartphone use at 6 to 8 weeks and 3 to 4 months is still running, no results | [UNVERIFIED] |
| What apps actually do | 1 Second Everyday sends once a day at a random point inside a window (iOS: morning 6:00 to 11:59, afternoon 12:00 to 16:59, evening 17:00 to 21:59). Day One lets you set an exact time or a random time in a range. Journey defaults to daily, time and days adjustable. Apple Journal: parent sets time and days | [1P] |
| Time zones | An Apple engineer's forum reply says a calendar trigger without a time zone follows the phone's local time; another developer in the thread reported it fired an hour late after a zone change and needed a reschedule. Unresolved | [1P] plus [AN]; matches F13 spike WP-F13-08 |

Reading: "evening, after the child sleeps" is a sensible guess, and a 21:30 cutoff is safe. But a newborn parent's evening is not reliably quiet, and nothing published says 20:30 beats 07:30 or a nap window. This is open question 1.

## 2. Fatigue, opt-out, permission grants, deletion

| Finding | Tag |
|---|---|
| iOS opt-in median 48.85% across thousands of apps and 15 verticals, Jan to Dec 2025 (Android 53.3%). No lifestyle, parenting or journaling split. Airship sells push software, so this is its customer base | [VC] Airship 2026 |
| Airship's consumer survey says the top reason to opt out is messages sent "too frequently" (I could only see the summary line) | [VC] |
| Braze (2016): of 14 Braze staff, 30% opted out because not relevant, 25% too many, 25% opting out is their default response to being asked, 20% no interest in the brand. The authors say it is not statistically significant | [VC], weak. Already used in our USER_RESEARCH S21 |
| Randomised test, 17,500 users of one German retailer app, 7 weeks, generic promotional pushes, fixed Saturday 17:30 time. Each extra weekly message raised uninstall rate by about 2.5 percentage points and cut direct opens by about 12.7%. Effect on indirect opens not significant (p = .060) | [EXP] Wohllebe et al. 2021. Retail promotions, not reminders, so direction transfers, size may not |
| Permission-grant rates for baby or journaling apps | None published that I could find | [UNVERIFIED] |
| What parents complain about: 92 of 200 Qeepsake reviews mention prompts or reminders, 20 of 43 negative ones. Repeated questions, age misfit, texts after deletion, daily texts needing long answers | [REPO] USER_RESEARCH S32 |
| Marketing text "while postpartum" (Qeepsake, 1 star, Aug 2026); "No one wants emails every day!" (Tinybeans, 2 stars, Aug 2026); "Constant nagging to add to my Tinybeans" (follower, Mar 2026) | [REPO] us.md, [AN] |
| Apple's guidance: ask "in a context that helps people understand why", for example after the first task is scheduled, rather than at first launch. Provisional authorization delivers quietly to Notification Center with Keep and Turn Off buttons, so people can judge before deciding | [1P] Apple, Asking permission to use notifications |

What drives deletion: the only causal evidence is frequency (Wohllebe). Review evidence adds irrelevance (wrong age), repetition, and mixing marketing into the same channel. Nothing I found isolates notifications as a cause of baby-app deletion.

## 3. Tone: what works, what backfires

Honest summary: the evidence that guilt backfires is thin and mostly anecdotal. Duolingo uses guilt-adjacent copy and grew. We avoid guilt because of the constitution and the sensitivity of the audience, not because a test proved it fails.

| Item | Tag |
|---|---|
| Duolingo's reminder system picks wording with a bandit that penalises recently seen messages; a summary reports daily active users up 0.5% and new-user retention up over 2%. I read this on a secondary site, not Duolingo's post | [UNVERIFIED first-party]; our repo cites Duolingo's own blog (B22) as [T] |
| A copy test framed around the user's own goal rather than "come back" reportedly raised daily active users 5%. The article does not make clear Duolingo published it | [AN] secondary |
| Duolingo tells users it will stop sending reminders if they are ignored. No result reported | [VC] Taplytics, secondary |
| One writer finds Duolingo's reminders ("Keep Duo happy!", then "reminders aren't working, we'll stop") passive-aggressive and guilt-inducing. One person's opinion | [AN] |
| 3 baby-app reviews say short entries and a no-pressure tone reduce journaling guilt; tracking can add stress | [REPO] R2 T27 |
| Qeepsake reviews praise daily questions as a prompt to "slow down and think about their kids", and one says she customised when prompts arrive | [AN] Trustpilot, 2023 |
| Apple Journal ships streak tracking (Insights, widget). Its 4.8 rating on 337K ratings does not show whether people like the streaks | [1P] App Store page |

## 4. Competitor teardown

I could not open the apps. "Not found" means the vendor documentation and pages I read did not say.

| Product | Ask moment | Default cadence | Copy style | Personalisation | Photo triggers | Complaints |
|---|---|---|---|---|---|---|
| Qeepsake | Sign-up; choice of text message or app notification [REPO] | Essential 2 questions a day, Premium 4, free Lite 1 a week [REPO] | Question in the child's name [REPO] | Age-aware questions from pregnancy to school years; a reviewer says prompt timing is customisable [AN] | Parent texts a photo in; no automatic trigger found | Repeats (company reply on a review: some questions repeat on purpose to compare answers over time [1P]); misfit for pregnancy; marketing texts while postpartum |
| Tinybeans | Not found | Not found; push and email, frequency adjustable [1P] | Not found | Per-follower frequency | Not found [UNVERIFIED] | Daily emails; follower nagging; pregnancy notification felt wrong; ads in new feed [REPO] |
| Lifecake (now BackThen) | Not found | Not found | Not found | Not found | Not found | One 2018 review: a photo or two a week became eight in one day. Others cite a rename and storage cost, support. No notification complaints seen |
| 1 Second Everyday | Reminder set up by user | Once a day, random time inside an iOS window [1P] | Not found | None beyond window | Not found (video-based) | Late or missing reminders is the first troubleshooting item [1P]. Skips the day if a clip was added; stops after 14 days without opening [1P] |
| Day One | Time picker before the system alert [REPO] | Daily, exact time or random in a range; custom reminders each with own message, time, recurrence, template [1P] | Parent writes custom text | Template loads on tap | Photo-library access asked when a photo is added; an empty date shows that day's photos [REPO] | Reminders do not sync between devices; yearly recurrence unavailable [1P]. "On This Day" notice is Android only [1P] |
| Journey | In Settings | Daily by default; days and time adjustable; optional email reminder [1P] | Not found | None found | Not found | A forum request to make iOS reminders time-sensitive (title only seen) |
| Apple Journal | Suggestions explainer, then notifications [REPO, first-run from 2023] | Parent-set schedule; also notifications "when new suggestions are ready" [1P] | Not found | On-device suggestions from photos, places, workouts, music; parent chooses data types [1P] | Yes, suggestions group photos and places into a starter [1P] | One App Store reviewer: suggestions not very relevant yet. Reviewer: no widgets or search at launch [AN] |
| Duolingo | After value, with a mascot warm-up [REPO] | Daily; bandit-chosen wording | Playful, sometimes guilt-adjacent | Learner history, recency penalty | n/a | Passive-aggressive tone [AN] |
| Calm | Reminder form with time and days [REPO] | Daily by default, user-set | Soft | Time and days | n/a | A reminder shown after the first session: "40% set one, 3x retention". Amplitude's page would not open for me, so I could not check this or whether it was causal [VC] |

Note on our own docs: R1 labels the Calm figure [F] "judged causal"; F13 relabels it [S]/vendor. F13 is right; do not quote it as fact.

## 5. Five design principles with the strongest user backing

1. Ask in context, after a first success, and let the parent choose the time. Backing: Apple's own guidance [1P]; Day One and Calm choose time first [REPO]; Calm's 40% [VC]. Weakest part: the numbers.
2. Keep volume low and parent-set. Backing: the only controlled test (Wohllebe) shows frequency raises uninstalls; volume is a repeat complaint at Qeepsake, Remento and Tinybeans [AN].
3. Never repeat, always fit the child's age. Backing: the top prompt complaint, at Qeepsake [REPO]. Add one caveat from their own reply: if we ever repeat on purpose, say why.
4. One channel, no marketing, extra care postpartum and in pregnancy. Backing: marketing text while postpartum; pregnancy notification felt wrong; the same-channel complaint at Qeepsake and Tinybeans [AN].
5. Stay quiet when the parent already did it, stop when ignored, and tell them once. Backing: 1SE skips a day after a clip and stops after 14 days [1P]; Duolingo stops with a notice [VC]; our own smart-quiet and back-off match. Not backed: any evidence on the best words for the "stopping" message.

## 6. Three questions only a test with real parents can answer

1. When do real parents want it, by age band? Compare a newborn-stage parent (0 to 3 months) with a 6 to 12 month parent: after-sleep evening, late morning, nap time, or a night-feed window. Does a reminder arrive when they are asleep or mid-feed, and does it feel like a gift or a chore on a hard week? Needs a one- to two-week diary or a prototype with local notifications on real phones, because no data exists.
2. Is a photo-triggered nudge welcome, and at what permission level? Show a trip or birthday prompt with three photo-access options (none, picked photos only, on-device suggestions). Do parents feel helped or watched? Does "tell more about your trip" read as the app writing for them? This also needs the constitution and privacy check noted in the brief.
3. Does a name on the lock screen, a preview of the real notification, and a "we'll go quiet" message change grant and mute rates, or feel like pressure? Test name-free versus named copy, with and without the notification preview, and read the back-off message aloud with tired parents.

## Gaps and limits

Could not open: Amplitude Calm case study, the Irrational Labs Headspace study, Duolingo's own blog, Tinybeans/Lifecake/Journey review pages beyond a few snippets. Could not find: permission-grant rates or notification-timing studies for baby or journaling apps. App Store ratings are as shown on the pages I fetched, not independently verified.

Sources: Airship 2026 benchmarks (airship.com/mobile-app-push-notification-benchmarks-for-2026); Apple, Asking permission to use notifications (developer.apple.com, usernotifications); Apple Developer Forums thread 811265; Wohllebe et al. 2021, Innovative Marketing (businessperspectives.org); Braze, Don't Push Me (braze.com); AASM, first-time moms sleep fragmentation (aasm.org); ZHAW parental smartphone study page; 1SE help article 3614061 (help.1se.co); Day One reminders guide (dayoneapp.com/guides/reminders); Journey support, set daily reminder (support.journey.cloud); Tinybeans help article 21 (tinybeans.helpscoutdocs.com); Apple Journal App Store page; MacStories Journal review; Trustpilot Qeepsake pages 2 and 5 and Lifecake page 3; Taplytics Duolingo posts; engineered.at Duolingo bandits; Medium "Duolingo needs to chill"; repo files docs/research/USER_RESEARCH.md, docs/research/competitors/us.md, docs/research/competitors/adjacent-and-ux-benchmarks.md, docs/prd/v2/research/R1 and R2.
