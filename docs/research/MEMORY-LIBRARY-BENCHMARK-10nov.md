# Memory Library benchmark: what Apple Journal and similar products teach us

Date: 10 Nov 2026. Lane: published and primary-source evidence only. Nothing here was tested with parents, and I did not run any of the apps. Agent: user-research.

Question from the founder: add a Memory Library that reads the photo and video library and its metadata (date, place) to attach media to letters and to suggest or remind around trips, festivals and holidays. He says Apple's Journal app already does this. Learn from it and similar products.

Evidence tags:
- [1P] the vendor's or Apple's own documentation, listing or policy, opened this session (10 Nov 2026).
- [LABEL] an App Store privacy label or listing. Apple states these are self-reported by the developer and not verified by Apple.
- [PRESS] reputable press or a named expert, secondary.
- [AN] anecdote: forum post, review or comment. One person's report, not a rate.
- [REPO] already in our docs, not re-checked here.
- [UNVERIFIED] I could not read the source, or the source does not say.

Reading note: where a page was not a verbatim Apple page, my fetch tool summarised it, so I paraphrase and never quote beyond a few words. Every URL below was opened on 10 Nov 2026 unless marked UNVERIFIED.

## 1. Headline answers

1. Apple's Journal app does not read the library the way the founder pictures it, and neither can we copy it as a feature. Journal suggestions are built on the phone by Apple's own on-device processing. A third-party app can show Apple's suggestions picker, but it never sees the library, only the items the parent selects in that picker [1P].
2. The Journaling Suggestions framework is real. It exists since iOS 17.2, needs a special entitlement but no permission prompt, and works in third-party apps (Day One, Journey and others use it) [1P] [PRESS]. It is a weak fit for us for four reasons: Apple chooses and ranks what appears, Apple writes the suggestion titles, the picker mixes in workouts, music and contacts, and there is no Expo module (details in section 3).
3. The harm in "memories" features comes from what is surfaced, when, and how it is framed, not from the reading itself. Facebook (2014, 2015), Google Photos (2021) and Apple Photos (2022 to 2024) each shipped controls after parents, mourners or ex-partners were hurt. We can avoid most of that by never choosing a person, a mood or a meaning for the parent.
4. Recommended shape: P1 limited-or-picker library with date chips, P2 a plain date-gap list on the phone with no faces and no scene labels, P3 video after a device spike, P4 occasion reminders from a neutral opt-in list and never from the library. Section 7 has the detail.

## 2. Ten key lessons

1. **The privacy ceiling is already defined by Apple.** The Journaling Suggestions picker runs in a separate process, shows over the host app, and hands the app only what the person selects [1P: WWDC tech talk, 111384]. Anything we build that reads more than that must justify itself against that bar, and against App Review 5.1.1(iii), which says to prefer the out-of-process picker over full access to Photos [1P].
2. **Limited library is a first-class state, not an error.** Since iOS 14 the system prompt offers Select Photos, Allow Access to All Photos, or Don't Allow [1P: Apple HIG Privacy]. A product that only works with "all" trains parents to be suspicious. Treat "Select Photos" as full-strength and never nag to upgrade.
3. **Controls came after harm, every time, and they converge.** The set Facebook, Google and Apple each ended up with: hide a person, hide a date or date range, hide one item, switch the whole feature off, and control its notifications separately [1P] [PRESS]. For us the equivalent is smaller because we should not use people at all (lesson 4).
4. **Never use faces or people as a trigger or a filter.** Apple's Photos uses on-device faces, scenes and "important dates", and still surfaced exes and deceased relatives [1P: Apple Photos privacy page] [AN: Apple Community, 5 Mar 2024] [PRESS]. Our metadata is date and a rough place the parent can see and edit. Nothing inferred about who, what or how it felt.
5. **Suggestion text is where "adding meaning" sneaks in.** Apple's picker returns a machine-made title that the person can edit, and reflection prompts about gratitude and purpose [1P]. Facebook's 2014 Year in Review put cheerful framing on a photo of a bereaved father's child [PRESS]. Under our constitution the app must not show or store a machine title, a mood, or a "trip" label unless the parent typed it.
6. **Lock-screen text is a privacy surface.** Apple Journal notifications name the actual place, person or activity, and reviewers complain that others can read them [PRESS: iOSHacker, undated]. Photo-linked reminders must carry no names, places, dates or counts on the lock screen.
7. **Dates and places from files are hints, not facts.** Dates can be wrong after files are copied or synced, places are missing after drag and drop in Day One, Live Photo bundles from Apple's picker lack their metadata file, and asset identifiers can be null under limited access [AN] [1P]. The parent must see and be able to change any date or place before it is saved.
8. **Streaks and badges are common and we must not copy them.** Timehop tracks a daily check-in streak with badges, Momento offers streaks, Apple Journal's Insights shows a writing streak [LABEL] [REPO]. Our constitution forbids them. A reviewer also reports Timehop sending several reminders after check-in [AN, 2021].
9. **Holidays are inferred almost everywhere.** Google lists Hanukkah, Christmas, Eid, New Year's Eve and Diwali memories [PRESS, 2021], Apple has a "Show Holiday Events" switch with no documented list [1P]. The only documented opt-in I found is Qeepsake's holiday-themed prompts [PRESS, 2022]. A neutral list the parent chooses from, with nothing pre-selected, is a clear gap we can own.
10. **Notification volume is the only thing with causal evidence.** In a randomised test of 17,500 app users over 7 weeks, more generic push messages meant more uninstalls and fewer direct opens [1P: abstract, Wohllebe et al. 2021]. Retail promotions, not reminders, so direction transfers and size may not. Parent complaints about baby-app prompts are about repetition, wrong age and marketing in the same channel [REPO] [LABEL: Qeepsake reviews].

## 3. Apple Journaling Suggestions in detail

### 3.1 What it is, in Apple's words (paraphrased)

The framework displays a picker of recent personal events such as a place visited, a person connected with, a photo in the library, or a song on repeat. The app chooses the button text that opens it. When a person picks a suggestion, the system shares high-level details about that event. Source: https://developer.apple.com/documentation/journalingsuggestions.md (Apple, page copyright 2026, opened 10 Nov 2026) [1P].

### 3.2 Findings table

| Question | Finding | Source and tag |
|---|---|---|
| Does it exist for third parties? | Yes. Apple introduced it for iOS 17.2 with the Journal app (Apple Newsroom, 11 Dec 2023). Day One shipped support on 12 Dec 2023, Journey Moments on 8 Dec 2023, Everlog by 13 Dec 2023 | Apple docs [1P]; Day One blog https://dayoneapp.com/blog/introducing-journaling-suggestions/ [1P]; Journey blog https://blog.journey.cloud/introducing-journey-moments-capture-lifes-highlights-effortlessly-on-ios [1P]; Dundee post https://devondundee.squarespace.com/blog/journaling-suggestions-come-to-everlog [AN] |
| Minimum OS | Framework and picker: iOS 17.2. iPadOS: 26.0 (suggestions made on iPhone sync to iPad over iCloud, from June 2025). Mac Catalyst apps ignore taps on the picker button | https://developer.apple.com/documentation/journalingsuggestions.md and https://developer.apple.com/documentation/updates/journalingsuggestions.md [1P] |
| Permission or entitlement | A special entitlement in the app's code signature (`com.apple.developer.journal.allow`). No extra authorization prompt, because the app cannot read a suggestion until the person selects it. In Xcode it is added as a normal capability named Journaling Suggestions | Docs page [1P]; WWDC tech talk https://developer.apple.com/videos/play/tech-talks/111384 [1P] |
| Does it need full photo library access? | No. The app needs no Photos permission and no per-category prompts (location, photos and so on). The picker is rendered by the system in a separate process | Tech talk 111384 [1P] |
| What the person sees | First use shows a modal introducing the feature. The picker has a Recommended tab (ranked by a model for variety, recency and likely engagement, including photo memories and multi-day suggestions such as trips and weekly summaries) and a Recent tab (chronological). Tapping a suggestion opens a review screen with a carousel, a list of metadata, the option to deselect assets and edit the title, then an add button | Picker docs https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md [1P]; tech talk 111384 [1P] |
| What an app receives | Only the chosen suggestion: a title and up to 13 content assets. Asset types named in the talk: Workout, Contact, Location, Song, Podcast, Photo (URL), LivePhoto (URL to video and preview), Video (URL), MotionActivity. Later additions: State of Mind, Generic Media, Reflection prompts (June 2024); event posters from Apple Invites, work-location flag, MapKit identifier, workout name (June 2025) | Tech talk 111384 [1P]; WWDC24 10209 https://developer.apple.com/videos/play/wwdc2024/10209/?time=0 [1P]; updates page [1P] |
| Photo and video metadata | Photo and video assets come back with capture dates in one developer's test (Dec 2023). Place comes as a separate Location asset (place name, pinned location), not necessarily as GPS tags in the photo file. I could not confirm whether the photo file carries GPS | https://zenn.dev/mtfum/articles/journaling_suggestions?locale=en [AN]; GPS in file [UNVERIFIED] |
| What the person controls (system-wide) | Settings, Privacy and Security, Journaling Suggestions: five category switches (Activity, Media, Contacts, Photos which covers library, memories and shared photos, Significant Locations), a Reflection Prompts toggle, a Prioritise Moments with Contacts toggle, clear history, turn all off, see which apps use it, choose which iPhone syncs. Settings apply to every journaling app | Apple privacy page https://www.apple.com/uk/legal/privacy/data/en/journaling-suggestions/ [1P]; tech talk [1P] |
| Where processing happens | On the iPhone. Contact proximity uses Bluetooth counts that stay on device. iCloud sync of suggestions between iPhone and iPad is end-to-end encrypted with default two-factor authentication and a passcode. The page does not say what Apple receives | Apple privacy page [1P] |
| Notifications | Since June 2025 an app can register to receive suggestions when the person taps a system Journaling Suggestions notification. Apple sends it, on the schedule the person picks in Settings, and the person chooses which app it opens. Without a custom schedule, timing depends on location and routines. The app does not write the notification | Updates page [1P]; Apple privacy page [1P]. Minimum OS for notifications [UNVERIFIED]. The detail articles were blocked to my fetch tool |
| Can the app filter which types appear? | The talk gives the app no way to restrict the picker to photos, and tells developers not to assume any content mix. I found no filter in the docs I could read | Tech talk 111384 [1P]; absence of a filter [UNVERIFIED] because the picker API page lists only initialisers |
| Entitlement approval for a baby-memory app | Nothing in Apple's docs says Apple vets the use. One secondary article says App Review may scrutinise inappropriate uses | iDropNews 12 Dec 2023 https://www.idropnews.com/news/day-one-gains-support-for-ios-172-journalling-suggestions/203880/ [PRESS]; approval outcome [UNVERIFIED], matches BL-545 |
| Third-party framework support in Expo | No Expo module known; would need a custom Swift module | BL-545 in docs/BACKLOG.md [REPO]; not re-checked |

### 3.3 Reported gaps and problems (all anecdotal, with dates)

- Not available in the simulator. An Apple engineer replied that it needs a physical device on iOS 17.2 (Apple Developer Forums, thread 740607, Dec 2023, exact date not shown) [AN]. https://developer.apple.com/forums/thread/740607
- Empty picker after first use. One developer saw suggestions on first presentation, then empty ones on every later launch; no reply or fix in the excerpt I could read (thread 743825, undated). https://developer.apple.com/forums/thread/743825 [AN]. A second developer wrote in Dec 2023 that Photos highlights stopped appearing once the first few were chosen, and thought the API immature for production [AN]. https://zenn.dev/mtfum/articles/journaling_suggestions?locale=en
- Live Photos arrive as a `.pvt` bundle that lacks the metadata file, so they cannot be previewed in Quick Look or saved back as Live Photos without a workaround. Music items lack a store identifier for playback in other apps (thread 748082, undated). https://developer.apple.com/forums/thread/748082 [AN]
- Blank entries in Day One. From 27 Dec 2023 users on iOS 17.2.1 reported blank entries from suggestions, narrowed to music or workouts. On 9 Jan 2024 Day One staff said Apple provides no data when such a suggestion is tapped. https://forums.dayoneapp.com/forums/topic/journaling-suggestions-broken/ [AN, vendor staff reply]
- Extra taps. A Day One user asked on 10 Jan 2024 to revert a change that put suggestions in the first three actions, because it added taps to the voice memo path [AN]. Lesson for a voice-first product: a suggestions door must not sit in front of the record button.
- Persistent "No Suggestions" pop-up. Users on iOS and iPadOS 26.2 reported between 28 Dec 2025 and 7 Jan 2026 that Journal still shows a "No Suggestions" or explainer pop-up on every new entry even with suggestions turned off. https://discussions.apple.com/thread/256218732 [AN]. Lesson: once a parent opts out, never show an explainer again.
- Reviewer verdicts. Six Colors (Dec 2023) found the suggestions much like Photos' own groupings and the reflection prompts did not make him write more; he wrote nine entries in several weeks. https://sixcolors.com/post/2023/12/ios-17-2s-journal-app-offers-introspection-surface-deep/ [PRESS]
- A "Skip Journaling Suggestions" setting exists in Journal for people who want the writing screen first (MacRumors how-to, undated). https://www.macrumors.com/how-to/disable-journaling-suggestions-iphone-journal-app/ [PRESS]

### 3.4 What Apple Journal itself is, for the record

- Announced 11 Dec 2023 with iOS 17.2. Suggestions come from on-device machine learning over photos, people, places, songs and workouts; the person chooses which types feed them; the entries are end-to-end encrypted in iCloud; scheduled notifications are optional (Apple Newsroom). https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments [1P]
- App Store: about 339K ratings, average 4.8, age rating 4+, label shows only device identifiers and product interaction for analytics, not linked to identity; the page repeats that suggestions are made on device. https://apps.apple.com/app/journal/id6447391597 [LABEL] (ratings are as displayed on the page when fetched)
- Not a baby product. Entries are the person's own and, per Six Colors, deliberately private and not shareable.

### 3.5 Fit for Early Letters

| Need | Fit | Why |
|---|---|---|
| Attach photos to a letter with no library access | Good | The parent picks in Apple's UI, we see only selected items. Same ceiling as PHPicker |
| Trigger "tell us about your trip" ourselves | Poor | We cannot see the library, cannot filter, cannot schedule. Apple owns notification text and timing |
| Keep words the parent's own | Needs care | Apple's title and reflection prompts are machine text. We must discard the title or show it only as an Apple-made label, and never use Reflection |
| Baby-specific selection | Poor | Picker also shows workouts, songs, contacts; no way found to hide them |
| Engineering | Costly | Custom Swift module, device-only testing, iPhone only for the picker, undefined empty states |
| Privacy label | Good | Data processed only on device is not "collected" under Apple's definition (https://developer.apple.com/app-store/app-privacy-details/ [1P]). Anything we derive and send off the device is considered separately |

Verdict: not the foundation. A later optional lane for parents who decline library access (the ADR draft calls it P1.5). It cannot deliver P2 or P4 for us.

## 4. Benchmark by product

### 4.1 Matrix

| Product | What it reads | Permission model | Metadata used | Where processed | Label or policy (self-reported) | Controls | Video | Kids stance |
|---|---|---|---|---|---|---|---|---|
| Apple Journal and Journaling Suggestions | Apple's own suggestions from photos, places, workouts, media, contacts | None for third parties (entitlement only); Journal itself uses Apple's system settings | Date, place, people, workout, media, mood | On device; iCloud sync end-to-end encrypted | Journal: device ID and interaction, not linked | 5 category switches, clear history, skip suggestions, app list | Video and Live Photo assets | None stated |
| Apple Photos Memories and Featured Photos | The whole library | Part of the Photos app | Date, place, faces and pets, scenes, "important dates" in Calendar and Contacts, Home and Work places | On device; Enhanced Visual Search uses a global index with homomorphic encryption and an OHTTP relay | Apple says it does not access photos or use them for R&D | Feature Less (person, place, day), Don't Feature a person, Show Holiday Events off, Show Featured Content off, reset | Videos in memories | None specific |
| Google Photos Memories | Backed-up and on-device photos | Account and backup | Date, faces, places, themes | Mixed: some on-device, creations from backed-up photos; detail UNVERIFIED | Not read (UNVERIFIED) | Hide faces (fewer or never), hide dates, hide a memory or one photo, turn off time-based and themed memories, separate notifications | Yes | None specific |
| Facebook On This Day | Posts and photos on Facebook | Account | Date, people tagged | Cloud | Not read (UNVERIFIED) | Hide dates and people, turn off notifications (Oct 2015) | Yes | None specific |
| Timehop | Camera roll plus linked accounts | Camera roll and accounts | Same-day-in-past-years date | Not stated in listing | Tracking: identifiers and usage; linked: user content and ads data | "Hide painful ones" per listing; alerts | Yes | None found |
| Day One | Only photos you add (iOS) | Photo access when adding; metadata prompt | Date, time, location from photo | Local plus its own sync; entries from suggestions are end-to-end encrypted by default | Not read (UNVERIFIED) | iOS prompts to apply photo date and location; Android has Always, Ask or Never plus time and distance thresholds | Yes (multiple needs Premium) | None |
| Journey | Photos you add, plus Journaling Suggestions "Moments" | System picker plus suggestions picker | Date, time, location, weather for the moment | Weather lookup implies a network call with date and place (my inference, not stated) | Linked: purchases, email, name, support content, user ID. Not linked: diagnostics | Not stated | Yes, up to 20 media for members | None |
| Momento | Entries you create; feeds from Facebook, Instagram and others | Per feed | Location, tags, "on this day" views | Not stated | Not linked: precise location, usage, diagnostics | Passcode and biometric lock (paid) | Yes | None |
| Tinybeans | Photos and videos you upload | Upload from library | Photos carry location and other data per its policy | Cloud | Tracking: location, contact info, user content, identifiers, usage. Policy: ads via Freestar, Facebook Pixel, machine learning on user content | Share only with invitees; per-follower email frequency | Yes (premium for longer) | Service for 18 and over; photos of children are the product |
| Qeepsake | Text or app uploads | Per upload | Dates; child age for prompts | Cloud | Tracking: usage data. Linked: purchases, contact info, user content, identifiers | Prompts per day and times; opt-in holiday-themed prompts; skip | Yes | Not stated |
| 1 Second Everyday | Library clips you import, plus its camera | Import from camera roll per reviewers; permission wording not on page | Date of clip | Not stated | Linked: purchases, contact info, user content, identifiers | Reminder window | Core feature | Not stated |
| FamilyAlbum | Uploads | Not stated | Month and child's age | Cloud | Page not fetched (UNVERIFIED) | Share with all or admins only | Yes | Not stated |
| BackThen (formerly Lifecake) | Uploads | Not stated | Chronological per child | Cloud | Tracking: identifiers. Linked: photos and videos, contact info, sensitive info | Per-child timelines, sharing | Yes | "Private" claim |
| Chatbooks | Camera roll or Google Photos for Monthbooks; connected accounts for automatic series | Library or account | Photo count; month | Cloud (printing) | Tracking: identifiers. Linked: photos and videos, contact info. Not linked: coarse location | 3-day preview to remove photos before printing; pause or cancel | Not stated | Not stated |

### 4.2 Per-product notes

**Apple Photos Memories (and "what went wrong")**
- Reads: the whole library. Uses on-device machine learning for scenes, faces, quality, audio, and personalisation signals including frequent Messages contacts, Contacts relationships, Home and Work places and important dates in Calendar and Contacts. Faces group into People and Pets; naming a person syncs the name across the person's iCloud devices. https://www.apple.com/legal/privacy/data/en/photos/ [1P]
- Controls: on iPhone, hold a memory and tap Feature Less to reduce a day, place or person; from a photo choose to feature a person less or never; "Show Holiday Events" can be cleared; suggestions can be reset under Settings, Apps, Photos, Featured Content. https://support.apple.com/guide/photos/pht165ab8150/mac and https://support.apple.com/guide/personal-safety/ipsa4c9edc62/web [1P]. The Mac page says holiday events, not named which holidays [UNVERIFIED list].
- Harm evidence: 5 Mar 2024, a user whose mother and sister had died wrote that Photos kept featuring them and prompting her to call or text them, and asked for a way to turn it all off; replies pointed to turning off Featured Content and "Feature Less", and noted birthday reminders would continue (Apple Community). https://discussions.apple.com/thread/255513159 [AN]. XDA, 18 May 2023, describes For You surfacing exes and deceased people from iOS 16 and notes face recognition misses mean someone can still appear until labelled. https://www.xda-developers.com/how-stop-photos-surfacing-exes-ios/ [PRESS]. The Next Web, 23 May 2022, explains the same controls as already existing. https://thenextweb.com/news/how-to-stop-photos-app-from-showing-a-memory-with-your-ex [PRESS]
- Lesson: reduce, not remove. Apple's own wording is "feature less", and the same replies show a grieving user still wanted an off switch. Offer "never" and "off" as plainly as "less".

**Google Photos Memories and Recap**
- Controls today: hide faces (show fewer, or block fully so the person never appears in any memory), hide dates, hide a memory or one photo from it, disable time-based and themed memory types, switch off each creation type, and set notification preferences for time-based, themed and creations separately. Google says face hiding is imperfect and changes take time to apply. https://support.google.com/photos/answer/9454489 [1P]
- Why: on 18 May 2021 Google's VP of Google Photos wrote that some resurfaced photos can be painful, such as after a breakup or loss, said it worked with GLAAD after feedback from the transgender community, said the new Memories are visible only to the account holder, and closed with "Relive the moments you want to, how you want to." https://blog.google/products/photos/new-memories-features-look-back/ [1P]. The blog does not say whether Memories are processed on device.
- Holidays: Dec 2021 added holiday-themed Memories naming Hanukkah, Christmas, Eid, New Year's Eve and Diwali; the article does not explain how a holiday is chosen or any regional logic. https://9to5google.com/2021/12/01/google-photos-adds-new-holiday-themed-memories-more/ [PRESS]
- "Best of 2021" appeared by default at the top of the app; TechRadar (9 Dec 2021) reported criticism that AI galleries can be insensitive and show unwanted reminders. https://www.techradar.com/news/google-photos-rolls-out-your-best-of-2021-highlights-but-its-no-spotify-wrapped [PRESS]
- Google Photos "Recap" specifically: I did not find a primary page for a feature by that name (UNVERIFIED). The year-end items above are the closest I could read.

**Facebook and Meta On This Day, and Timehop**
- Facebook Year in Review, Dec 2014: a designer and author, Eric Meyer, received a collage with a photo of his daughter who had died that year, set in party imagery; he called it "inadvertent algorithmic cruelty", and Facebook's product manager apologised. https://www.sbs.com.au/news/article/the-problem-with-facebooks-year-in-review/rvy556n4f [PRESS]
- On This Day, Oct 2015: Facebook added filters so a person can enter a date or a person to keep out of the feature, and notifications can be turned off. https://techcrunch.com/2015/10/13/facebook-now-helps-you-get-rid-of-memories [PRESS] and https://www.techradar.com/news/software/facebook-on-this-day-now-lets-you-block-out-those-bad-memories-1306699 [PRESS]. Meta's current help pages: [UNVERIFIED], not opened.
- Timehop: shows same-day items from camera roll and linked accounts, advertises hiding painful memories, tracks a daily check-in streak with badges, carries advertising, and declares tracking of identifiers and usage in its label; about 186,000 ratings at 4.8; one 2021 reviewer reported multiple reminders after checking in. https://apps.apple.com/app/id569077959 [LABEL] [AN]. Timehop had a data breach affecting about 21 million users on 4 Jul 2018, and was acquired in June 2023 (secondary source, not primary). https://en.wikipedia.org/wiki/Timehop [PRESS, secondary]
- Lesson: "on this day" is the best-known memory trigger and also the best-known source of unwanted reminders. A date match carries no information about whether the date was good.

**Day One**
- Photo metadata: on iOS, adding a photo usually prompts the person to apply its date, time and location to the entry. On Android there are settings for photo date and place (Always ask, Always, Never) with time and distance thresholds to skip the prompt. Web and Windows can set date from an image but not place. https://dayoneapp.com/guides/day-one-ios/setting-the-date-time-and-location-with-photos/ [1P]. Copy these: ask, never silently apply, allow thresholds.
- Gap: a Mac user wrote on 29 Jul 2023 that copying or dragging older photos from Apple Photos drops location data. https://forums.dayoneapp.com/forums/topic/importing-from-apple-photos/ [AN]
- Suggestions: a Suggestions button on the new-entry screen opens Apple's picker; Day One says it cannot see suggestion data until the person adds one, entries from suggestions are end-to-end encrypted by default, free accounts work, multiple photos or videos need Premium, iPhone only. https://dayoneapp.com/features/journaling-suggestions/ [1P]

**Journey, Momento, Diaro**
- Journey Moments (8 Dec 2023) uses Journaling Suggestions and adds weather for the moment's date, time and place; the post makes no privacy statement. https://blog.journey.cloud/introducing-journey-moments-capture-lifes-highlights-effortlessly-on-ios [1P]. Journey is a paid-membership product (US$6.99 a month or US$49.99 a year on the listing) with paywall complaints in reviews about export and location tagging [LABEL] [AN]. https://apps.apple.com/app/id1300202543
- Momento: custom reminders and streaks, social feed imports, "on this day" views; label declares precise location (not linked), usage and diagnostics; 878 ratings at 4.1; reviewers complain of clunky backup and sync and confusing photo handling. Automatic import from Photos is not stated on the page. https://apps.apple.com/us/app/-/id980592846 [LABEL] [AN]
- Diaro: not benchmarked. Searches returned no primary page I could read [UNVERIFIED].

**Baby and family apps**
- Tinybeans: free tier 20 uploads a month and 5GB; Tinybeans+ adds unlimited uploads, ad-free and more storage; about 104K ratings at 4.9. Privacy policy says it may collect data tied to photos including location, uses Google Analytics, the Facebook Pixel and an ad partner, applies machine learning to user content "to make recommendations", is for people 18 and over, and does not say whether location is stripped. https://apps.apple.com/us/app/-/id521633042 [LABEL] and https://tinybeans.com/privacy [1P]. Its help article says content is visible only to invitees; it makes no other claims. https://tinybeans.helpscoutdocs.com/article/9-how-private-is-tinybeans [1P]
- Qeepsake (owned by the same company as Tinybeans per its listing): prompts by text or push, chosen number per day and time, opt-in holiday-themed prompts (TechCrunch, 16 Aug 2022, company figure of 700,000 registered users, unverified). Listing: 4.9 from about 15,000 ratings; label declares tracking by usage data; complaints include marketing texts mixed with prompts, price and print quality. https://techcrunch.com/2022/08/16/qeepsake-a-journaling-app-that-helps-families-capture-and-store-memories-raises-2m [PRESS] and https://apps.apple.com/us/app/id1332312787 [LABEL] [AN]
- 1 Second Everyday: one-second clips from each day; reviewers say camera roll footage can be imported to a chosen day and Live Photos converted to video; reminders are customizable; 4.8 from about 48K ratings; label shows linked user content and identifiers. https://apps.apple.com/app/id587823548 [LABEL] [AN]. Reminder behaviour (random time in a window, skipping a day already filled, stopping after 14 days) is in our earlier research [REPO].
- FamilyAlbum: sorts by month and the child's age; its help page does not say how it reads the camera roll. The App Store page would not open (UNVERIFIED). https://help.family-album.com/hc/en-us/articles/360038267214-What-is-FamilyAlbum [1P]
- BackThen (the Lifecake team's newer app): per-child timelines, auto-made highlights, 700 ratings at 4.8, label shows tracking by identifiers and linked photos and videos despite a "no ads" description. https://apps.apple.com/ie/app/id1505173822?l=en-gb [LABEL]
- Chatbooks: Monthbooks pulls from Camera Roll or Google Photos; automatic series pull from connected sources and print each 60 photos with a 3-day heads-up so parents can remove photos; cancel or pause anytime. https://chatbooks.com/blog/monthly-versus-automatic-photo-books [1P]. Label: tracking by identifiers, linked photos and videos. https://apps.apple.com/us/app/chatbooks/id734887606 [LABEL]
- Lesson from the set: all of these keep user content in the cloud and most declare tracking or advertising data. None publicly offers an on-device-only library feature. A baby-memory product that reads the library only on the phone and keeps the label at Data Not Collected would be unusual, but only if no place lookup, weather call or analytics event leaves the device.

**Calendar-driven prompts and holidays**
- Apple Photos: a "Show Holiday Events" switch and use of important dates in Calendar and Contacts; which holidays, and how region is decided, are not documented on the pages I read [1P] [UNVERIFIED detail].
- Google: names five religious and cultural observances; no regional logic published [PRESS].
- Qeepsake: opt-in holiday-themed prompts [PRESS].
- No product I read documents how it avoids assuming a family's religion or culture. The Google blog frames inclusion around identity (GLAAD), not around faith or festival [1P].
- Apple Invites event posters (June 2025) are a parent-chosen signal: the suggestion appears for events the person planned or attended in Apple Invites [1P]. A parent's own calendar entry is a stronger consent signal than a guess, but it still reads the parent's calendar, which we do not do.

## 5. Synthesis

### 5.1 Patterns to copy

1. Out-of-process picker as the default door (App Review 5.1.1(iii)) [1P].
2. Show the data before using it: Day One asks before applying a photo's date and place [1P].
3. Per-source and per-type switches, and one global off switch, in one place (Apple's Journaling Suggestions settings, Google's Memories settings) [1P].
4. Controls on the item itself: Google's per-memory hide and Facebook's date and person filters [1P] [PRESS].
5. A preview-and-remove step before anything is committed: Apple's review screen (deselect assets) and Chatbooks' 3-day heads-up [1P].
6. Separate notification controls from content controls (Google) [1P].
7. A quiet trial for reminders: provisional authorization delivers quietly with Keep and Turn Off buttons, so people judge before deciding [1P: https://developer.apple.com/tutorials/data/documentation/usernotifications/asking-permission-to-use-notifications.md].
8. Plain statement of where things are processed (Apple's Journaling Suggestions privacy page) [1P].

### 5.2 Anti-patterns to avoid

1. Faces, people clusters, mood and scene labels as selectors (Apple Photos, Google Photos) [1P].
2. Machine-written titles, captions, reflections or cheerful framing (Facebook 2014, Apple suggestion titles) [PRESS] [1P].
3. Streaks, badges, check-in counters (Timehop, Momento, Journal Insights) [LABEL] [REPO].
4. Default-on resurfacing with the off switch buried (Google "Best of 2021", Facebook 2014) [PRESS].
5. Lock-screen text that names places, people or dates (Apple Journal notifications) [PRESS].
6. A nag that persists after opt-out (Journal "No Suggestions" pop-up, Dec 2025) [AN].
7. Marketing in the same channel as prompts (Qeepsake reviews) [REPO] [AN].
8. A suggestions door in front of the primary action (Day One feedback, 10 Jan 2024) [AN].
9. Declaring tracking or ad data around children's photos (label evidence for Tinybeans, Qeepsake, Chatbooks, BackThen) [LABEL].
10. Counting what a family did not do: none of the products I read counts gaps in a library, but any "you have 40 photos with no letter" mechanic would; we already forbid it [REPO].

### 5.3 Permission and prompt UX best practice

All from Apple's Human Interface Guidelines and App Review Guidelines unless marked.
- Ask only for data you need, and not before the person shows interest in the feature that needs it [1P: https://developer.apple.com/design/human-interface-guidelines/privacy.md].
- Wait until the person uses a feature that needs access; do not ask at launch unless the app cannot function without it [1P: HIG Privacy].
- Purpose string: one brief, complete, specific sentence in the active voice, ending with a period. Apple's own example of bad copy is a vague "for a better experience" [1P: HIG Privacy]. For photos the system alert shows Select Photos, Allow Access to All Photos and Don't Allow [1P: HIG Privacy].
- Pre-alert screen: one button that opens the system alert, titled "Continue" or "Next" and never "Allow", with no cancel or close [1P: HIG Privacy].
- Respect a "no": offer an alternative path (5.1.1(iv)) and never pressure for access [1P: https://developer.apple.com/app-store/review/guidelines/].
- Limited library: iOS 14 added the limited status; since iOS 15 an app can open the limited-selection manager on demand and learn which items were added. Apps that do nothing about it may see the system prompt again in a later session. A documented Info.plist key stops the automatic prompt so the app can offer its own manage button. https://developer.apple.com/wwdc21/10046 [1P] and https://wwdcnotes.com/notes/wwdc20/10641 [PRESS, third-party notes of Apple session 10641]
- Notifications: ask in context after the first value, and consider provisional authorization [1P].
- Do not rely on screenshots of the system alert or on incentives (HIG, which covers tracking prompts) [1P].

### 5.4 Privacy-preserving options compared

| Option | What the app sees | Prompt | Date and place | Minimum | Constitution and label fit | Main catch |
|---|---|---|---|---|---|---|
| A. System picker (PHPicker, via expo-image-picker) | Only items picked, one session at a time | None to open the library; Expo says picking a video with default settings can trigger a permission dialog on iOS | EXIF through the file; reliable date is EXIF, file dates can be wrong after copy or sync; place not confirmed | iOS 14 (iOS 15 for ordered selection) | Best. Matches CR-083. Nothing to disclose if kept on device | No browsing by date range, no suggestions. `assetId` can be null under limited access |
| B. Limited library (PhotoKit, `.limited`) | Only the items the parent selected in Select Photos, queryable | Standard Photos alert | PhotoKit dates and places for items in the selection | iOS 14; manage UI iOS 15 | Good, if we honour limited and never nag | The selection can be small, so date-range chooser looks empty. User albums not available in limited mode |
| C. Full library (PhotoKit read) | Everything, including hidden items if "all" is granted | Standard alert, then "Allow Access to All Photos" | Full | iOS 14 for the new model | Possible but heavy: 5.1.1(iii) says prefer picker; trust cost for baby photos | Needed only for background or automatic indexing. Background wake from a new photo is unverified [REPO] |
| D. Journaling Suggestions picker | Only the chosen Apple suggestion | None (entitlement) | Date per photo in one test; place as a separate Location asset | iOS 17.2, iPhone | Good for privacy, weak for meaning (machine titles, mixed types) | See 3.5 |
| E. No library | Nothing | None | Parent-typed date range ("Moments") | Any | Safest. Matches the zero-permission substitute in docs/design/NOTIFICATIONS.md [REPO] | No chips, no help finding photos |

Sources for the table: Apple HIG Privacy; WWDC21 10046 and WWDC20 notes above; Expo SDK 57 reference https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker.md [1P]; Apple Developer Forums thread 660696 https://developer.apple.com/forums/thread/660696 [AN with Apple engineer reply: file representation gives most metadata without library permission]; Apple App Privacy Details [1P].

Privacy label note: Apple says data processed only on the device is not collected and need not be disclosed, but anything derived and sent off the device is considered separately; photos and videos are disclosed as a specific type if a feature uploads them [1P: https://developer.apple.com/app-store/app-privacy-details/]. So a place lookup by network, a weather call, or an analytics event that includes a date range or album name would change the label. The ADR draft already rules out CLGeocoder for this reason [REPO].

### 5.5 Notification fatigue

- Causal: more generic pushes meant more uninstalls and fewer direct opens in a 7-week, 17,500-user test; no provable effect on indirect opens; retail context [1P: https://doaj.org/article/32f944560a3f4051b62e902b2300f23b].
- Opt-in context: an Airship 2026 benchmark puts iOS opt-in median near 49%, a vendor figure I did not re-read [REPO] [UNVERIFIED this session].
- Parent complaints: repetition, wrong age, marketing mixed with prompts [REPO] [LABEL]. Timehop: reminders after a check-in [AN].
- Apple Journal: Apple lets the person pick a schedule and which app opens the notification, with an off switch; the complaint is lock-screen content [1P] [PRESS].
- Gap: no published figures for baby or journaling apps on grant rate, best time of day, or the effect of a photo-triggered message [UNVERIFIED, same as our earlier research].
- Implication: occasion nudges must live inside the existing weekly budget, not add to it, stay name-free on the lock screen, stop when ignored, and be off until the parent chooses a day.

### 5.6 How a faithful "never add meaning" product differs

A suggestion in Early Letters only invites the parent to speak. It never describes, names, ranks or captions.

| Others do | We do |
|---|---|
| "Coastal Hike", "Trip to Lisbon", "Best of the year" (machine title) | Show the date range the phone already holds, in plain digits, with the parent's own label if they typed one |
| Pick the "best" photos for you | Show the parent's selection in the order they chose, or by time; never rank |
| Detect people, scenes and moods | Use none of it; no faces, no scene classes, no mood |
| Say "Happy Diwali, here is a memory" | Offer a neutral list the parent picks days from, and say only that a letter is waiting |
| Count how many photos you have not written about | Never count gaps; celebrate what exists |
| Write the caption or a prompt about the photo | Offer a blank letter that starts with the voice recorder; the photo sits beside the recording |
| Notification names the place or person | "A letter is waiting whenever you are ready." No name, place, date or count |

Example invitation lines that obey the content rules (for design to refine, not final copy): "These photos are from 12 to 20 December. Talk about them whenever you like." and "Your picked day is today. A few words are enough." They state a fact the phone holds, or the parent's own choice, and ask nothing else.

## 6. Recommendation for P1 to P4

These phases follow the draft ADR in the worktree `docs/adr/DRAFT-memory-library-architecture-10nov.md` (branch `docs/adr-memory-library-10nov`); I read only its headings and phase table, and this report adds evidence, not architecture.

**P1: library chooser with metadata chips (ship first, gated by privacy and counsel on wording)**
- Door: system picker stays the zero-permission path (option A). Add a date-range chooser through PhotoKit that honours limited access (option B). Ask only when the parent taps "Add photos", never at launch; use the system alert with a single "Continue" pre-screen only if counsel wants one; treat Select Photos as equal to All.
- Chips: show the date the file or asset holds, as plain digits; show a place chip only from text the parent typed (ADR draft), not from GPS lookup. Let the parent edit or remove a chip. Day One prompts before applying date and place; copy that.
- Do not read faces, scenes or albums named by Apple; do not store Apple's titles.
- Evidence: Apple HIG and App Review 5.1.1; Day One metadata guide; forum 660696 on EXIF reliability; Chatbooks preview step; limited-library API notes.
- Gate: on-device check that the picker needs no prompt and what GPS a picked file carries (matches BL-544); behaviour of `assetId` null under limited access.

**P2: on-device moments (build only after P1 is liked)**
- Build a plain list of date clusters: "12 to 20 December, 38 photos" with no label, no ranking, no faces, no scenes, no cloud call. The parent names a moment if they want.
- Controls from day one: hide a day range, hide one photo, "never suggest this stretch", and one switch to turn Moments off entirely. These are the converged controls from Facebook, Google and Apple, minus people.
- Do not show a Moments list as an inbox with counts or a badge; no "uncovered moments" count.
- Evidence: Apple and Google controls; Facebook 2014 and 2015; Apple Community thread of 5 Mar 2024; Journal "No Suggestions" thread (opt-out must stay opted out).
- Gate: privacy review that the index leaves no copy in backups or analytics (ADR draft already proposes this).

**P3: video (spike first)**
- Evidence is thin for baby apps. Known issues: Expo says videos on iOS can trigger a permission dialog after picking with default settings; the export preset option is deprecated; Live Photos from Apple's suggestions picker arrive as a `.pvt` bundle missing its metadata file; iCloud originals can force downloads (thread 660696) [1P] [AN].
- Recommend: pick-only, one clip at a time, a duration and size cap, stills only for Live Photos, and a progress state for iCloud downloads. A device spike must confirm each of these before promising anything.
- Do not auto-trim, auto-edit, add music or add titles.

**P4: occasion reminders (smallest data, highest care)**
- Triggers never come from the library or the parent's calendar. The parent picks days from a neutral alphabetical list with nothing pre-selected and not ordered by region, language or time zone, or types their own day (the ADR draft proposes this). A parent's own birthday, anniversary or festival is their choice, never our guess.
- Delivery: local only, name-free lock-screen text, inside the existing weekly cap, one-tap "not this one", a plain off switch, and stop after repeated ignores with a single honest line. Use provisional authorization only if design wants a quiet trial.
- Do not use Apple's system Journaling Suggestions notifications for this (Apple owns text and timing, content names places, minimum OS unverified).
- Evidence: Wohllebe frequency test; Qeepsake and Timehop complaints; Google and Apple holiday features inferring culture; Apple HIG on asking in context.
- Gate: counsel and content review of the occasion list, and a community read-through, before any default list ships (ADR draft lists the same).

Order if the founder wants only one: P1. It delivers the user-visible win (attach photos faster) at the lowest privacy cost, and the other three depend on how parents react to P1's permission step.

## 7. Questions to put to parents in research

Methods and consent follow the user-research skill; this list is for the interview guide and a prototype, not a survey.

1. When you want to add a photo to something you say aloud, what do you do now? Show me the last time.
2. Show three permission screens (no access, choose photos, all photos). Which would you pick, and what do you think each one lets us see?
3. If the app showed only the dates of photos, not what is in them, would that feel helpful, odd or intrusive? Why?
4. Is there a photo, person, date or place you would not want shown anywhere near the app, even to you? What would make it safe to open the app anyway?
5. What would a "Hide" control need to say for you to trust it? "Less", "never" and "off": which words would you choose?
6. Read this lock-screen line out loud: "A letter is waiting whenever you are ready." Would you be comfortable if someone saw it? What would you remove or add?
7. Which days would you want a nudge for? Let the parent list their own first, then show a neutral list and ask what is missing or wrong.
8. How often is too often for a gentle nudge in a normal week? In a hard week?
9. What does "the app wrote that" mean to you? Show a photo with a machine caption beside one with only a date. Which feels like your voice?
10. If we showed Apple's suggested moments (with Apple's titles), would you want them? Which part would you change or remove?
11. After a loss or a hard day, what should an app do with photos, and what should it never do?
12. For a video of your child, do you want the app to hold a copy, link to the original, or leave it in Photos? What worries you about each?
13. If you declined library access today, what would you still expect the app to do?
14. What do you expect to happen to photos when you delete a letter? Does that change what you would attach?

## 8. UNVERIFIED list and limits

Could not read or confirm:
- Apple detail pages blocked to my fetch tool: "Presenting the suggestions picker and processing a selection", "Receiving journaling suggestions from system notifications", the `com.apple.developer.journal.allow` entitlement page, and the pages for `JournalingSuggestion` and `JournalingSuggestionAsset`. The asset type list rests on the WWDC tech talk 111384 and the updates page.
- Minimum iOS for the Journaling Suggestions notification API and Apple Invites event posters: the updates page lists them under June 2025 but the pages that carry availability were blocked.
- Whether the picker can be filtered to photos only; the docs I could read list no filter.
- Whether App Review grants or scrutinises the Journaling Suggestions entitlement for a baby-memory app (also BL-545). Secondary article only.
- Whether a Journaling Suggestions photo file carries GPS in its tags.
- Whether a PHPicker-returned file carries GPS and what GPS Expo's `exif` returns for library picks on SDK 57. The Expo page says only that camera-captured images on iOS lack GPS tags. Needs a device test (BL-544).
- Google Photos: on-device versus cloud split for Memories; its privacy label; any feature named "Recap".
- Meta's current On This Day help pages and policy; Timehop's privacy policy and on-device processing.
- Day One's own privacy label; Diaro (any page); FamilyAlbum App Store page (fetch failed).
- Which holidays Apple's "Show Holiday Events" covers and how region is chosen.
- Airship and other opt-in rates (repo only), all published figures for baby apps on grant rates, best time of day, or photo-triggered nudges.
- App Store ratings and counts: as displayed on the pages when fetched.
- Reddit-level evidence: one mirrored Reddit thread about a one-time-purchase journaling app with Journaling Suggestions was fetched; the only reply names an app unclearly. No more Reddit sources were opened. Treat all forum evidence above as anecdotal and few in number.
- One of my fetches (Qeepsake help centre) was blocked after redirect; Qeepsake behaviour comes from its App Store listing, TechCrunch and our earlier research.
- All behaviour above was read from pages, not run on a device or in the apps.

## 9. Sources (all opened 10 Nov 2026 unless marked)

Apple, first party:
- Journaling Suggestions framework: https://developer.apple.com/documentation/journalingsuggestions.md
- JournalingSuggestionsPicker: https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md
- Journaling Suggestions updates (June 2024, June 2025): https://developer.apple.com/documentation/updates/journalingsuggestions.md
- Tech talk, Journaling Suggestions API: https://developer.apple.com/videos/play/tech-talks/111384
- WWDC24 10209: https://developer.apple.com/videos/play/wwdc2024/10209/?time=0
- WWDC21 10046, Improve access to Photos in your app: https://developer.apple.com/wwdc21/10046
- Journaling Suggestions and Privacy: https://www.apple.com/uk/legal/privacy/data/en/journaling-suggestions/
- Photos and Privacy: https://www.apple.com/legal/privacy/data/en/photos/
- Apple Newsroom, Journal launch, 11 Dec 2023: https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments
- Journal on the App Store: https://apps.apple.com/app/journal/id6447391597
- Photos user guide (Mac), Memories controls: https://support.apple.com/guide/photos/pht165ab8150/mac
- Personal Safety guide, Photos featuring less: https://support.apple.com/guide/personal-safety/ipsa4c9edc62/web
- Human Interface Guidelines, Privacy: https://developer.apple.com/design/human-interface-guidelines/privacy.md
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (first 100,000 characters read; later sections not read)
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- Asking permission to use notifications: https://developer.apple.com/tutorials/data/documentation/usernotifications/asking-permission-to-use-notifications.md

Apple forums and community [AN]:
- https://developer.apple.com/forums/thread/740607 (simulator, view name, Dec 2023)
- https://developer.apple.com/forums/thread/743825 (empty suggestions, undated)
- https://developer.apple.com/forums/thread/748082 (`.pvt` bundle, undated)
- https://developer.apple.com/forums/thread/660696 (PHPicker metadata, undated)
- https://developer.apple.com/forums/thread/712719 (add-only versus read-write)
- https://discussions.apple.com/thread/255513159 (5 Mar 2024, grief and Photos)
- https://discussions.apple.com/thread/256218732 (28 Dec 2025 to 7 Jan 2026, "No Suggestions")

Third-party notes of Apple sessions:
- https://wwdcnotes.com/notes/wwdc20/10641

Other vendors and products:
- Day One, Introducing Journaling Suggestions (12 Dec 2023): https://dayoneapp.com/blog/introducing-journaling-suggestions/
- Day One feature page: https://dayoneapp.com/features/journaling-suggestions/
- Day One guide, date, time and location from photos: https://dayoneapp.com/guides/day-one-ios/setting-the-date-time-and-location-with-photos/
- Day One forums: https://forums.dayoneapp.com/forums/topic/journaling-suggestions-broken/ and https://forums.dayoneapp.com/forums/topic/importing-from-apple-photos/
- Journey blog (8 Dec 2023): https://blog.journey.cloud/introducing-journey-moments-capture-lifes-highlights-effortlessly-on-ios
- Journey on the App Store: https://apps.apple.com/app/id1300202543
- Momento on the App Store: https://apps.apple.com/us/app/-/id980592846
- Timehop on the App Store: https://apps.apple.com/app/id569077959
- Tinybeans: https://apps.apple.com/us/app/-/id521633042, https://tinybeans.com/privacy, https://tinybeans.helpscoutdocs.com/article/9-how-private-is-tinybeans
- Qeepsake: https://apps.apple.com/us/app/id1332312787
- 1 Second Everyday: https://apps.apple.com/app/id587823548
- BackThen: https://apps.apple.com/ie/app/id1505173822?l=en-gb
- FamilyAlbum help: https://help.family-album.com/hc/en-us/articles/360038267214-What-is-FamilyAlbum
- Chatbooks: https://chatbooks.com/blog/monthly-versus-automatic-photo-books and https://apps.apple.com/us/app/chatbooks/id734887606
- Google Photos help, featured memories: https://support.google.com/photos/answer/9454489
- Google blog, 18 May 2021: https://blog.google/products/photos/new-memories-features-look-back/
- Expo ImagePicker SDK 57 reference: https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker.md

Press and secondary:
- TechRadar on the Journaling Suggestions API, 26 Oct 2023: https://www.techradar.com/phones/ios/apples-journal-app-moves-closer-to-capturing-all-your-musings-and-now-has-its-own-api
- iDropNews, Day One, 12 Dec 2023: https://www.idropnews.com/news/day-one-gains-support-for-ios-172-journalling-suggestions/203880/
- Six Colors, Dec 2023: https://sixcolors.com/post/2023/12/ios-17-2s-journal-app-offers-introspection-surface-deep/
- Zenn developer article, Dec 2023: https://zenn.dev/mtfum/articles/journaling_suggestions?locale=en
- Dundee, Everlog, 13 Dec 2023: https://devondundee.squarespace.com/blog/journaling-suggestions-come-to-everlog
- MacRumors, skip suggestions: https://www.macrumors.com/how-to/disable-journaling-suggestions-iphone-journal-app/
- iOSHacker, Journal notifications: https://ioshacker.com/how-to/stop-journal-app-notifications-and-journal-suggestions
- XDA, 18 May 2023: https://www.xda-developers.com/how-stop-photos-surfacing-exes-ios/
- The Next Web, 23 May 2022: https://thenextweb.com/news/how-to-stop-photos-app-from-showing-a-memory-with-your-ex
- SBS, Year in Review: https://www.sbs.com.au/news/article/the-problem-with-facebooks-year-in-review/rvy556n4f
- TechCrunch, Facebook, 13 Oct 2015: https://techcrunch.com/2015/10/13/facebook-now-helps-you-get-rid-of-memories
- TechRadar, Facebook On This Day: https://www.techradar.com/news/software/facebook-on-this-day-now-lets-you-block-out-those-bad-memories-1306699
- 9to5Google, 1 Dec 2021: https://9to5google.com/2021/12/01/google-photos-adds-new-holiday-themed-memories-more/
- TechRadar, Google Photos Best of 2021, 9 Dec 2021: https://www.techradar.com/news/google-photos-rolls-out-your-best-of-2021-highlights-but-its-no-spotify-wrapped
- Android Police, 18 May 2021: https://www.androidpolice.com/2021/05/18/google-photos-will-now-give-you-more-control-over-your-memories/
- Wikipedia, Timehop (secondary): https://en.wikipedia.org/wiki/Timehop
- TechCrunch, Qeepsake, 16 Aug 2022: https://techcrunch.com/2022/08/16/qeepsake-a-journaling-app-that-helps-families-capture-and-store-memories-raises-2m
- Wohllebe et al. 2021 abstract, DOAJ: https://doaj.org/article/32f944560a3f4051b62e902b2300f23b

Repo, not re-checked: docs/research/NOTIFICATION_EVIDENCE_2026-11-01.md, docs/design/NOTIFICATIONS.md section 5, docs/BACKLOG.md BL-544 and BL-545, docs/legal/compliance-register.md CR-083, docs/research/competitors/adjacent-and-ux-benchmarks.md, and the headings of the draft ADR on branch `docs/adr-memory-library-10nov`.
