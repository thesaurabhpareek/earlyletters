Status: PROPOSED (research input; not a decision; not a requirement)
Date: 21 Nov 2026
Owner: `product` (market benchmark researcher)
Replaces: none
Load when: you design, review or price the Moments tab, the photo-access ask, the picker, or any Moments notification.

# Moments tab: market benchmark

Docs only. Nothing here is built, no string is live, nothing is recorded in `DECISIONS.md`. Nothing here is legal advice; every store or legal reading is "counsel must confirm".

Founder goal this serves: a high quality bar and the best customer experience, plus engagement and repeat use, without breaking the constitution in `CLAUDE.md` (the machine may remove and repair, never add meaning; no counts, gaps, streaks or guilt; no machine titles; no face matching).

## How to read the evidence

| Tag | Meaning |
|---|---|
| V | I read the page itself (Apple, a vendor help page, an App Store listing, an engineering post) in this session, 21 Nov 2026. The fetch tool returns a short summary of a page, not its full text, so V means "read through a summary of the primary page", not "read every word". |
| T | Reputable trade press or a third-party review, read in this session. |
| R | Already recorded in this repo (`docs/product/prd/27-photo-moments-and-media.md`, `docs/design/NOTIFICATIONS.md`). Not re-read here. |
| UNVERIFIED | I did not read a source that says this. It may be true. Do not quote it. |

Rules I kept: no usage or retention number appears unless a primary source stated it, and then it is marked as the company's own claim. App Store ratings are the figures the listing showed on 21 Nov 2026. Reviews are summarised in my words; the store listings I could read showed only a few reviews each, mostly dated, so "what parents complain about" is a thin sample (see "What I could not read").

## 1. What the market does, in one page

1. Every product that does proactive suggestions well keeps a calm in-app surface as the main door (a carousel, a timeline, a day view) and treats push as a separate, switchable thing. Google splits memory notifications by type and lets people keep the carousel with alerts off [V1]. Apple's Journaling Suggestions let people turn off, clear, reschedule or redirect notifications [V2].
2. The privacy-credible way to be proactive without a library permission is Apple's own: the Journaling Suggestions picker runs in a separate process, and the app receives only what the person picks [V3][V4]. Day One and Everlog use it [V5][V6]. Apple's own advice for "individual photos" is the picker; full library access is for a strong whole-library need [V7][V8].
3. Limited access breaks suggestion engines quietly. 1SE's own help page says that on Android with limited access, days the person did not select show as empty while the app seems fine [V9]. An Apple developer thread describes the same confusion on iOS: the limited picker looks like the ordinary picker, so people do not know they granted a permission [V10].
4. The emotional hook in nearly every product is machine-made: a title, a count, a streak, a face, a place, music, a generated narrative. Our constitution forbids most of that. The market gives us little proof that a plain date plus the parent's own pictures carries enough feeling. That is the biggest open risk (section 5, experiment 1).
5. The painful-memory problem is real and every big product answered it with hide controls: Google (show less or block a person, hide a date) [V1][T1], Facebook (block people or dates; dismissed memories not shown again) [V11], Apple (feature less) [V12]. We can only do the date half, because we cannot match faces.

## 2. Comparison table

Columns: product, suggestion pattern, permission ask and timing, limited or denied handling, picker use, nudge cadence, what is praised, what is complained about, source.

| Product | Suggestion pattern | Permission ask and timing | Limited or denied handling | Picker use | Nudge cadence | Praised | Complained about | Source |
|---|---|---|---|---|---|---|---|---|
| Apple Photos (Memories, Featured Photos, widget) | Auto-made memory movies and featured photos; a memory can be retitled, shortened, have photos added or removed; people and photos can be made less likely to appear (including in the widget) [V12] | None: it is the system library | Not applicable (first party) | Not applicable | Not read. Whether Memories send notifications is UNVERIFIED | Not read from a primary source. UNVERIFIED | Not read from a primary source. UNVERIFIED | support.apple.com/en-asia/guide/iphone/iph1a5832438/16.0/ios |
| Apple Journal and Journaling Suggestions | On-device suggestions from photos, people, places, workouts, media; Recommended tab ranks by variety, recency and likely engagement; Recent tab is chronological; each suggestion has a machine title (editable) and up to 13 assets [V3][V13] | System-level switches in Settings, Privacy and Security, per data category, one shared by all apps [V3]. Journal's own access ask: not read | The person controls categories; can clear history or turn all off [V2] | Third-party apps get a system picker drawn over the app; the app sees only what the person sends [V3] | Optional scheduled reminders; suggestion alert timing depends on location and routines, with off, app choice and custom schedule [V2][V13]. A streak widget exists [V14] | Clean design, easy start from suggestions, voice and media entries; 4.8 from about 344K ratings as listed [V14][T2] | Suggestions not yet relevant for one reviewer; basic formatting; photo cap of 13; slow iPad sync [V14][T2] | developer.apple.com/videos/play/tech-talks/111384 ; apple.com/legal/privacy/data/en/journaling-suggestions ; apps.apple.com/us/app/id6447391597 |
| Google Photos (Memories, Recap) | Time-based and themed memories in a carousel plus creations; some built from on-device content [V1]. Recap is a year-in-review video with graphics and stats, regenerable after hiding people or photos [V15] | Not read. UNVERIFIED | Not read. UNVERIFIED | Not read | Notifications can be set separately for time-based, themed and creations, or off while keeping the carousel [V1]. Recap sits in Memories and is pinned to Collections for December, with a prompt to request it if missing [V15] | Controls for hiding people and dates [V1][T1] | Painful reminders (exes, people who died) led Google to add and surface hide controls [T1][T3] | support.google.com/photos/answer/9454489 ; blog.google/products-and-platforms/products/photos/google-photos-2025-recap/ |
| Chatbooks | Auto-built books: a book is made after every 60 photos from Instagram, Facebook or camera roll favorites; about three days before print an email allows reorder, delete, caption; hashtag series [T4]. Monthbooks: parent adds photos by hand from camera roll, Google Photos or group chats [V16] | Listing says add from camera roll; the prompt itself is not described [V17] | Not read. UNVERIFIED | Not read | One reviewer on Trustpilot complained of constant daily notifications; billing emails not read [T5] | Easy to make a book, set and forget, attractive output; 4.8 from about 250K ratings as listed [V17][T4][T5] | On a sampled Trustpilot page: price rises, unexpected charges, hard-to-find cancel, credits, print colour, late or lost orders, bot-only support [T5] | apps.apple.com/us/app/chatbooks/id734887606 ; chatbooks.com/blog/turn-camera-roll-into-monthly-photo-books ; trustpilot.com/review/chatbooks.com |
| Tinybeans | No suggestion engine found. Parent uploads in batches or as it happens; entries sort by date; backdating allowed [V18] | Not read | Not read | Not read | Email and push choices; frequency levels not listed on the page I read [V19]. No prompt or reminder mention in the FAQ [V20] | Private family sharing, a place to move years out of social media; about 4.9 from about 104K ratings as listed [V18] | Hard to upload missed days (long scroll through camera roll), 20-photo free cap, cannot pick more than 20 at once, no news-feed view [V18] | apps.apple.com/us/app/-/id521633042 ; tinybeans.helpscoutdocs.com/article/21-how-can-i-change-the-way-tinybeans-notifies-me-about-updates-on-my-journal |
| Qeepsake (Tinybeans USA Ltd.) | Age-appropriate questions per child from pregnancy, answered by text or in app [V21]. A 2022 article quotes the CEO as saying every parent got the same set then [T6]; the two disagree, and the listing is newer | Not read | Not read | Photos and collages are mobile-app only [V22] | Parent picks how many prompts a day and the time; opt-in holiday prompts; Plus adds up to two a day and answering missed ones (2022 article) [T6]; daily questions and catch-up in app [V22] | Easy text-based journaling, prompts that preserve memories otherwise missed; 4.9 from about 15K ratings as listed [V21] | Print quality, cost, slow performance, frequent marketing texts, single admin [V21] | apps.apple.com/us/app/id1332312787 ; help.qeepsake.com/article/116-how-does-qeepsake-work ; techcrunch.com/2022/08/16/qeepsake-a-journaling-app-that-helps-families-capture-and-store-memories-raises-2m |
| Lifecake (and BackThen, from the same team) | Lifecake: add single or batch, auto-arranged timeline; page mentions no suggestions or notifications [V23]. BackThen listing: auto-made highlights, reels, calendars, notifications when family add memories [V24] | Not read | Not read | Not read | BackThen: notifications on new memories; no prompts mentioned [V24] | Secure sharing with close family (one 2022 review); 4.8 from about 700 ratings as listed [V24] | Migration confusion and storage limit complaints, but dated 2020 [V24] | lifecake.com ; apps.apple.com/ie/app/id1505173822 |
| Day One | Suggestions button when starting an entry; reflection prompts, media, State of Mind, walks; media suggestions are selective, not a daily sync [V5][V25] | Day One itself: iOS Photos setting All, Selected or None [V26]. Suggestions: Apple's switches [V5] | With Selected or None, the Apple Photo Library section in Today View stops appearing; to see newer photos under Selected the person must return to Settings [V26] | Entry points open the Photo Library, Camera and more; whether system picker or library access is not stated [V26] | Not stated on the pages read | Privacy handled by Apple: Day One sees nothing until the person picks a suggestion [V25] | Not read from a primary source. UNVERIFIED | dayoneapp.com/guides/day-one-for-ios/journaling-suggestions ; dayoneapp.com/guides/adding-media-to-entries-in-day-one-for-ios/ |
| 1 Second Everyday | Quick Fill reads capture dates from the library and proposes a clip per empty day; shows how many days could be filled; previews; nothing saved until confirm; it does not overwrite filled days [V27] | Needs camera, microphone and photos; help asks for Full Access [V28] | iOS help does not mention limited access [V28]. Android help: limited access leaves unselected days empty and looks like the app working, so the fix is to grant all [V9] | Not read | Daily reminder, time, style and badge are settable; no reminder if the day is already done; reminders stop after 14 days without opening the app; Pause All exists [V29] | Time-capsule archive, helpful reminders, year-end review; 4.8 from about 48K ratings as listed [V30] | Subscription cost; one long-time user reported losing years of clips after a reinstall (an account of one) [V30] | apps.apple.com/app/587823548 ; help.1se.co (articles on permission, Quick Fill, reminders) |
| Amazon Photos | Memories resurface the same date in past years; Daily Memories and This Day also show on Echo Show [V31][V32] | Enabling Daily Memories asks for camera roll access and Auto-Save then uploads the whole camera roll [V31] | Not read | Not read | Notifications not described [V31] | Frees phone space, date organisation, shows albums on Echo and Fire TV; 4.8 from about 233K ratings as listed [V32] | Lag with large libraries, upload gaps for bursts, unintuitive interface [V32] | digprjsurvey.amazon.com/csad/help/node/G6LVL6BCGZ7RY83Z ; apps.apple.com/us/app/amazon-photos-photo-video/id621574163 |
| Notion and similar note apps | I found no first-party suggestions from a photo library. Photos reach pages by hand or through automation tools [T7]. UNVERIFIED beyond a search | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | search only; no primary source |
| Timehop | A daily set from that calendar date across years, from camera roll and linked accounts; keep, hide, delete [V33] | Listing does not spell out the prompt [V33] | Not read | Not read | Alerts are settable; a streak counter with badges exists [V33] | Emotional effect of seeing family, lost pets and past events; some used it as a backup; 4.8 from about 187K ratings as listed [V33] | Too-frequent notifications, more ads, linked-account memories not loading [V33] | apps.apple.com/us/app/id569077959 |
| Remento | A weekly question by email or text; a photo can be the prompt or be added after; the speaker records with no app or login [V34] | Photos arrive from cloud drives and social accounts, not a library prompt [V34] | Not applicable | Not applicable | One new question a week; prompts can be paused (help article exists) [V34] | Easy for older speakers (company page) [V34] | Not read. Note it can write a narrative version from a recording, which we must not do [V34] | remento.co/faq |
| Everlog | Journaling Suggestions (places, songs, workouts, moods); new photos can set an entry's date and place on always, never or ask [V6] | Via Apple's suggestion switches; photo prompt not read | Not read | Photos added inline or in a side panel [V6] | Daily reminder skipped if the goal is met; On This Day and recap notifications; one-tap lock screen action [V6] | Clean design, fast, one-time purchase option; 4.6 from 308 ratings as listed [V6] | Missing recently deleted folder, limited fonts [V6] | apps.apple.com/us/app/-/id1519935634 |
| Facebook On This Day | Filters out exes and blocked people and anything dismissed; a ranking model picks among the rest; signals include past shares and dismissals and what computer vision sees (a 2016 engineering post) [V11] | Not applicable (posts, not a library) | Not applicable | Not applicable | Opt-in reminder from the On This Day page; frequent dismissal means fewer memories shown [V11] | Company says hundreds of millions of people used it [V11] (a company claim) | Led to block-person and block-date controls [V11] | engineering.fb.com/2016/03/30/ml-applications/engineering-for-nostalgia-building-a-personalized-on-this-day-experience/ |

## 3. Per-question findings

### 3.1 Turning a library into prompts

- Apple's ranking balances variety, recency and likely engagement, and mixes in photo memory highlights and multi-day suggestions such as trips [V3]. The unit of suggestion is a titled group with up to 13 assets [V3][V13]. Our unit is a date range with no title (PRD 27 R15).
- Timehop and Amazon use the calendar-day echo ("this day in past years") [V31][V33]. It is simple and is the one pattern that needs only dates. It does not fit a baby: this day last year the child was a different size, which is the point of an age label.
- Chatbooks and 1SE use the parent's own curation as the signal (favorites for Chatbooks [T4]; the parent confirms each filled day for 1SE [V27]). Neither guesses meaning.
- Remento uses a photo as a spoken-story prompt [V34]. That is the closest match to Early Letters. The difference we hold to: the words stay the parent's.

### 3.2 Asking for photo access, and Limited or Denied

- Apple's privacy guidance says to ask only for data a feature needs, wait until the person uses a feature that needs it, and avoid launch-time asks unless the app cannot work without it [V35]. The PhotoKit article says avoid PhotoKit calls at first launch and tie the ask to a direct action [V36].
- A pre-alert screen should have one button, named like Continue or Next, with no cancel and no close [V35].
- Since iOS 14 the system shows Select Photos, Allow Access to All Photos and Don't Allow [V35][V36]. Apple shows a limited-library prompt automatically once per app life cycle and tells apps to suppress it and present their own picker affordance [V36].
- iOS 17 redesigned the full-access dialog to show how many photos and a sample, and Apple periodically reminds people an app has full access [V8].
- Apple's answer to a developer who found limited access confusing: if the app can work without library access, use the picker and show a reduced-functionality state for what is out of reach [V10]. That is our hybrid.
- Day One degrades by dropping the library section under Selected or None rather than nagging [V26]. 1SE's Android failure shows what happens when degrade is silent [V9].
- Expo detail that matters for us: with current defaults, a video pick can make iOS ask for media library permission right after selection unless permission is requested first or the defaults are changed [V37]. That would be an unexpected prompt at the wrong moment. Check against our SDK 57 pin (the page I read says latest; version not confirmed).

### 3.3 Embedding or styling the Apple picker

- iOS 17 lets an app embed the picker inline; the system renders it, so the app never gets the library and needs no prompt [V7].
- Three presentations: the usual sheet, inline with optional hidden navigation bar and toolbar, and a compact single row [V38].
- Apple's guidance: replace custom pickers with the system one, use continuous selection so no Add button is needed, hide chrome and size it with a frame, and let it run to the screen edge [V38].
- The first time an embedded picker shows, the system shows onboarding that says the app sees only selected photos, and a privacy badge marks it [V38]. We cannot hide or restyle either.
- The Options menu lets the person remove metadata such as location before sharing; by default all metadata is included [V38]. So the location tag travels with a picked photo unless we strip it (Q-PM-5 says no place is read).
- Expo's image picker documents only system-presented UI, with no inline component [V37]. An inline picker therefore needs our own native module (`expo-native-module` skill). That is a read of the docs page's silence, so the claim is "not documented", not "impossible".

### 3.4 Notifications and email

- Separate switches by type, and a way to keep the surface with alerts off (Google) [V1].
- Skip the reminder when the work is done (1SE, Everlog) [V29][V6]. Stop reminding after silence (1SE: 14 days) [V29].
- Parent-set count and time (Qeepsake) [T6]; the complaint in that product is marketing texts and cost [V21].
- Streaks and badges appear in Timehop and Apple's Journal widgets [V33][V14]. Banned here.
- Chatbooks' email before print gives a three-day edit window [T4]. Billing surprise is where its complaints concentrate [T5].
- No source I read gave an effect size for any of this. Repo notes (R) already list vendor claims as direction only.

### 3.5 Places, occasions and the child's age

- Apple, Google and Facebook use places, holidays and people. Google and Facebook also give date and person hiding [V1][V11]. Qeepsake offers opt-in holiday prompts [T6].
- Child age as a first-class label: Qeepsake describes age-appropriate prompts [V21]. One reviewer quoted on Lifecake's page praises age labels on a timeline [V23] (a single review). Evidence is thin either way.
- Our current rulings: no place read (Q-PM-5), celebrations opt-in and parent-confirmed, birthdays and month ages from the birth date, and the age arithmetic lives in `packages/core`. The market does not show our choices wrong. It shows they give up the strongest emotional levers (places, names of trips, faces).

### 3.6 What parents complain about (all small samples)

- Cost and billing surprise (Chatbooks, Qeepsake, 1SE) [T5][V21][V30].
- Too many notifications or marketing texts (Timehop, Qeepsake, one Chatbooks reviewer) [V33][V21][T5].
- Hard to find the right day among many photos (Tinybeans) [V18]. This is the job our date grouping does.
- Painful memories surfaced without warning (Google, Facebook) [T1][T3][V11].
- Lost data after reinstall or inactivity (one 1SE account) [V30].
- Print quality and late books (Chatbooks, Qeepsake) [T5][V21].

## 4. The patterns

### 4.1 Ten to copy

| # | Pattern | Evidence | Constitution check |
|---|---|---|---|
| C1 | Ask for library access only on a tap the parent made for a stated benefit; never at launch | [V35][V36] | Fine. No machine words involved |
| C2 | One-button pre-alert screen (Continue), no cancel, no image of the system alert | [V35] | Fine. Our copy stays plain and gender-neutral (`{child}`) |
| C3 | Make the picker the always-present door and the library read an optional upgrade; show a reduced state, not an error | [V10][V7][V8] | Fine. Parent chooses every picture |
| C4 | Suppress the automatic limited prompt and give our own "choose pictures" row | [V36] | Fine |
| C5 | Degrade by quietly removing the proactive layer (Day One's pattern), but never leave a blank that looks broken | [V26][V9] | Fine. No count of what is missing, so the line must not say how many |
| C6 | Browse surface first; push is a separate switch, off or quiet by default | [V1][V2] | Fine. Supports "no notification" in BL-1019 |
| C7 | Skip the nudge when the parent already did the thing; stop after a stretch of silence | [V29][V6] | Fine, but the silence rule must not be phrased as a gap or a missed count to the parent |
| C8 | Hide-and-show-less on the card itself, with a visible list that undoes it | [V1][V11][V12] | Date and stretch only; no person controls (no face matching) |
| C9 | Preview, then commit: nothing is attached or saved until the parent confirms | [V27] | Fine. Matches Keep |
| C10 | Use the parent's own signals as the only ranking input: the pictures they pick, a day they mark, the birth date. Candidate to check: whether the Favorites flag is readable under a limited selection (UNVERIFIED) | [T4][V27] | A favorite is the parent's act, not machine meaning. Needs privacy review before use |

### 4.2 Ten to avoid

| # | Anti-pattern | Where seen | Constitution rule it would break |
|---|---|---|---|
| A1 | A machine title or caption on a suggestion | Apple suggestions carry editable titles [V3]; Google Recap adds graphics and effects [V15] | No machine titles; never shape a person's words. We discard any title the system hands us |
| A2 | Counts of photos, days, or days that could be filled | Google Recap stats [V15]; 1SE Quick Fill shows days that could be filled [V27]; Chatbooks 60-photo rule [T4] | No counts, no gaps |
| A3 | Streaks, badges, rewards | Timehop [V33]; Apple Journal streak widget [V14] | No streaks, points or badges |
| A4 | Person-based surfacing or blocking | Google show less and blocked by face [V1]; Facebook computer vision [V11] | No face matching. We cannot even offer "show less of this person" |
| A5 | A generated narrative from a recording | Remento narrative version [V34] | The machine never writes or shapes words |
| A6 | A silent empty state under Limited access | 1SE Android [V9] | Not a constitution rule, but it reads as the app being broken. Say one calm thing |
| A7 | Re-asking after Don't Allow or limited, or leaving the automatic limited prompt on | Apple's default once per life cycle [V36] | Our own rule: never ask again (Q-PM-1) |
| A8 | Daily push by default, or marketing mixed into prompt channels | Timehop [V33]; Qeepsake marketing texts [V21] | No guilt, no nagging; a marketing text beside a memory prompt is a sales surface |
| A9 | Auto-upload the whole camera roll as the price of a surface | Amazon Daily Memories needs Auto-Save [V31] | Nothing leaves the phone except by the parent's act (X2); phone-only index |
| A10 | Letting the suggestion surface double as a purchase surface, or billing surprises downstream | Chatbooks billing complaints [T5]; Recap's export to an editor [V15] | Celebrate what exists; no loss language; no pressure moment attached to a memory |

## 5. What this means for our hybrid design

The design under test: the app reads the library (dates only, on the phone, parent opt-in, Limited honoured) to make proactive date-range cards, and embeds Apple's picker inline in the Moments tab for browsing and as the fallback when access is limited, denied or the parent never opted in. PRD 27 and `docs/design/NOTIFICATIONS.md` hold the current rulings.

### 5.1 Where the market backs us

- Hybrid is Apple's own advice for an app that can work without library access: use the picker, show a reduced state for the rest [V10]. The inline picker means the tab is never blank, which is what 1SE's Android users lacked [V9].
- Ask on a tap, once, one sentence first, then Apple's sheet; do not re-ask; suppress the automatic limited prompt [V35][V36]. This is already PRD 27 R18 and R19.
- Date-based grouping solves a complaint the market really has: finding the right day among many photos (Tinybeans) [V18].
- Hide a day, hide a stretch, a visible list to undo: matches Google, Facebook and Apple [V1][V11][V12]. The conflict logged between NX-39 R17 and the Hidden choices page is pointed the same way by the evidence: keep the list. A hidden thing you cannot see or undo is the thing Google had to retrofit and make easier to find [T1][T3].
- Thumbnails of the parent's own pictures are what Timehop's reviewers say moves them [V33]. A date-only card with large real pictures is a fair bet.

### 5.2 Where the market says we may be wrong

1. **We carry the highest permission cost in the field for the proactive layer.** The privacy-credible peers (Day One, Everlog, Apple Journal) get suggestions with no library permission because Apple runs them in another process [V3][V5][V6]. Apple tells apps to prefer the picker unless the whole library is truly needed [V8]. The burden is on us to show date cards beat the inline picker alone. Counter-evidence for the Apple route as a replacement: I found nothing that says Journaling Suggestions can fill a tab of cards, run in the background or trigger a notification (UNVERIFIED), it returns a machine title we would have to throw away, it bundles places, music and workouts, and the entitlement review for a baby app is unknown [R]. So keep our own date index for 1.0, and keep Apple's picker of suggestions as a later spike, as `docs/design/NOTIFICATIONS.md` already says. Experiment 2 includes a picker-only arm so we find out if the library read earns its cost.
2. **We treat Limited as an edge row. The evidence says it is a main case.** Apple states most people do not want to hand over a whole library [V7], and the developer thread says the limited picker is easy to mistake for a plain picker [V10]. I found no share of people who choose Limited (UNVERIFIED), so assume many. PRD 27 section 5 says "no moment if the selection is small" and "no line says so". For the Moments tab that must change: with Limited, the cards will often be few or none, and the tab should say one calm thing near the picker (what it can use, and a "choose pictures" button), not a count. Design Limited and Denied with the same polish as Full.
3. **Plain date cards are plainer than everything on the market.** Competitors' emotion comes from machine titles, stats, music, places and faces. We have chosen none of them. There is no evidence in what I read that a date range plus thumbnails starts a letter. It may, because Timehop's reviewers praise the pictures themselves [V33], but this is a hypothesis. A date alone also invites a calendar feeling.
4. **The picker is not ours to style.** The system draws it, adds a first-run privacy explainer and a badge [V38], and its Options menu defaults to including location [V38]. Inside a tab with our design language it will look like Apple. Accept that; hide the chrome, size it, use continuous selection, and put our own header and a Keep path around it. Strip location from any picked picture ourselves, as Q-PM-5 intends.
5. **An inline picker needs a native module.** Expo documents only the modal picker [V37]. This is cost and risk to the schedule, not a reason against the design.
6. **No push may leave repeat use thin.** The market keeps the in-app carousel as the main door, so a quiet default is right [V1]. But we have no evidence in this research that anything brings a parent back to the tab. Our one neutral calendar nudge is the only recall. Treat its value as unknown and test it (experiment 3). No source I read gives an effect size (the repo's vendor-claim notes already mark direction only).
7. **Skipping places costs richness.** Apple and Day One lean on places [V3][V5]. Our no-place ruling is right for trust but should be revisited only with a parent-typed label (a stretch the parent names), never a machine place name.
8. **Child age on the card is unproven.** Age at the date is plain arithmetic, so it stays inside the constitution. The market gives little support either way [V21][V23]. Test it (experiment 1).
9. **Video picks can trigger a surprise prompt under some Expo defaults** [V37]. Verify on our SDK 57 build before the picker ships.

### 5.3 Recommendations that follow (for the founder and Karma to rule on)

- R1. Keep the hybrid. Build Limited and Denied as first-class states: one calm line, one button (choose pictures, or open Settings), no count, no repeat ask.
- R2. Put the inline picker above the fold in the tab so the tab is useful on day one with no permission at all; the cards are an upgrade shown only when there is something real.
- R3. Run the three experiments before any public claim about Moments.
- R4. Keep push off by default and neutral on the lock screen (existing rulings); treat the weekly nudge as an experiment, not a promise.
- R5. Spike Apple's Journaling Suggestions picker after 1.0 as the zero-permission proactive layer; decide with counsel after the entitlement answer.

## 6. Three experiments we can run at 1.0 with analytics off

The product frame says analytics is off through 1.0 (D-124). Sources we may use are: App Store Connect installs and sales, public review text, a support tally by fixed category, tester answers collected by hand, and the export manifest's `counts` block that a tester reads and sends as numbers only (`docs/product/prd/00-product-frame.md`, section on measures). Reporting rule there: report "x of n", never a percentage when n is under 20, and ask at most 5 fixed questions per tester round. Every experiment below uses only those sources. Real family pictures stay on the tester's phone and out of the repo; examples use the fictional family Asha. Recruiting and consent follow the `user-research` skill, and counsel reads the one-page parent consent.

**Experiment 1: does a plain card start a letter?**
- Question: does a date-range card with the parent's own pictures carry enough feeling, and does "age on that day" help?
- Method: moderated sessions on TestFlight with 8 to 12 parents on their own phones, screen shared, 20 minutes. Each parent sees their own pictures on three cards in a fixed order shuffled per parent: (A) date range and thumbnails; (B) the same plus the child's age on that day ("Asha, 7 months" style, from the birth date); (C) the inline picker with no card. For each, the facilitator asks the same fixed question: would you start a letter from this, yes, no or not sure, and one open line on why.
- Measure: x of n for each card; the open lines coded by hand. A result is directional only at this n.
- Success rule written before looking: if A or B is not at least as often "yes" as C for most testers, the cards are not earning their permission cost (feeds 5.2 item 1).
- Stop rule: any tester who finds a card upsetting ends the session; hide-a-stretch is shown to everyone.

**Experiment 2: permission order and comprehension.**
- Question: which entry gives the best first minute, and do parents understand what they granted?
- Method: same testers, two arms, assigned by alternating order. Arm 1: the Settings row sentence, then Apple's sheet, then the tab. Arm 2: the tab opens with the inline picker only; the "suggest days" row appears after the first letter is kept. A third small arm uses Limited on purpose.
- Measure: which button each tester presses in Apple's sheet (Select Photos, Allow All, Don't Allow), and one fixed comprehension question afterwards: what can this app see now? Also time to the first kept letter, read off the screen share, not logged. Report x of n.
- This directly tests the confusion the Apple developer thread describes [V10].
- Success rule: if Arm 2 reaches a first kept letter as often as Arm 1 and comprehension is better, ask for the library later, not first.

**Experiment 3: does one neutral nudge bring anyone back?**
- Question: does a single neutral weekly nudge lead to more letters started from Moments, with no pressure?
- Method: a two-week diary on TestFlight with up to 20 parents (not mostly from the founder's circle). Half get the neutral weekly nudge on; half get none (the neutral moment nudge of NS-51-R11, which PRD 27 already puts under the parent's reminder switches; confirm before the test). Allocation by sign-up order, stated openly, so this is not randomised and is biased by who signs up.
- Measure: at the end each tester reads the manifest `counts` block and sends numbers only (letters kept in each week, letters that began from a picture), plus one fixed question: did any message feel like pressure, yes or no. Report x of n; no percentages under 20.
- Success rule: the nudge arm shows more letters in week 2 without any "pressure" yes. Any "pressure" yes from a tester halts the nudge for everyone and goes to Karma.
- Caveat to state in the write-up: no effect size from this is publishable; it tells us whether to ship the nudge on by default or leave it a setting.

## 7. What I could not read, and what is UNVERIFIED

Could not read (fetch failed, blocked, or page gave no usable text):
- A Tinybeans review article (expertbeacon.com) failed to load, and the Product Hunt Tinybeans page returned no review text.
- Chatbooks help pages did not cover automatic photo adding, camera roll sync or pre-charge emails. Chatbooks' own permission prompt is not described anywhere I read.
- The Apple Support page on Memories gave a short summary; it did not mention notifications or hide-holidays, and part of one long page (past 100,000 characters) was not read.
- Qeepsake's help page did not mention reminders or email. Lifecake's page did not mention notifications.
- 1SE's iOS help does not mention limited access, and I did not read the iOS Quick Fill permission behaviour.
- Reddit, forum threads and recent individual App Store review text beyond the three or so reviews shown on each listing. Complaint evidence is therefore a small, partly dated sample. I read one page of Chatbooks' Trustpilot listing, which that summary itself says skews negative.
- Google Photos' permission ask and its limited-access handling; Amazon Photos' notification behaviour; Apple Photos' notification behaviour.
- Remento's pricing and review text; Notion has no first-party library suggestions that I found, from a search only.

UNVERIFIED, and it matters:
- Whether Journaling Suggestions can drive a tab of cards, run in the background or send a notification, and whether the entitlement would be granted to a baby-memory app.
- What share of iOS users pick Limited, and the grant rate for a photo ask in baby or journaling apps. No public figure was read.
- Any effect of any nudge on return use. Only company claims exist in what I read (Facebook: hundreds of millions of users; Qeepsake: 700,000 registered users and 50 million memories saved, both the companies' own words and neither a retention figure) [V11][T6].
- Whether the Favorites flag is readable under a limited selection (PhotoKit behaviour not read).
- Whether the video-pick permission prompt in Expo applies to our SDK 57 configuration.

## 8. Sources read (21 Nov 2026)

V1 Google Photos help, memories: https://support.google.com/photos/answer/9454489
V2 Apple, Journaling Suggestions and privacy: https://www.apple.com/uk/legal/privacy/data/en/journaling-suggestions/
V3 Apple tech talk, Journaling Suggestions API: https://developer.apple.com/videos/play/tech-talks/111384
V4 Apple Journal newsroom: https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/
V5 Day One, Journaling Suggestions guide and feature page: https://dayoneapp.com/guides/day-one-for-ios/journaling-suggestions ; https://dayoneapp.com/features/journaling-suggestions/
V6 Everlog App Store listing: https://apps.apple.com/us/app/-/id1519935634
V7 Apple WWDC20, Handle the limited Photos library: https://developer.apple.com/videos/play/wwdc2020/10641/
V8 Apple WWDC23, What's new in privacy: https://developer.apple.com/videos/play/wwdc2023/10053/
V9 1SE help, limited access on Android: http://help.1se.co/en/articles/16824654-why-are-my-days-empty-after-choosing-allow-limited-access-on-android.md
V10 Apple developer forums, limited library flows: https://developer.apple.com/forums/thread/654542
V11 Facebook Engineering, On This Day (2016): https://engineering.fb.com/2016/03/30/ml-applications/engineering-for-nostalgia-building-a-personalized-on-this-day-experience/
V12 Apple Support, Photos memories (iPhone guide): https://support.apple.com/en-asia/guide/iphone/iph1a5832438/16.0/ios
V13 TechCrunch, Journal launch: https://techcrunch.com/2023/12/11/apples-new-journal-app-is-now-available-with-the-release-of-ios-17-2
V14 Journal App Store listing: https://apps.apple.com/us/app/id6447391597
V15 Google blog, Recap 2025: https://blog.google/products-and-platforms/products/photos/google-photos-2025-recap/
V16 Chatbooks help, Monthbooks: https://help.chatbooks.com/en/articles/7862697-how-do-monthbooks-work
V17 Chatbooks App Store listing: https://apps.apple.com/us/app/chatbooks/id734887606
V18 Tinybeans App Store listing: https://apps.apple.com/us/app/-/id521633042
V19 Tinybeans help, notification preferences: https://tinybeans.helpscoutdocs.com/article/21-how-can-i-change-the-way-tinybeans-notifies-me-about-updates-on-my-journal
V20 Tinybeans FAQ: https://tinybeans.com/faqs
V21 Qeepsake App Store listing: https://apps.apple.com/us/app/id1332312787
V22 Qeepsake help: https://help.qeepsake.com/article/116-how-does-qeepsake-work
V23 Lifecake site: https://www.lifecake.com
V24 BackThen App Store listing: https://apps.apple.com/ie/app/id1505173822?l=en-gb
V25 Day One blog on suggestions privacy: https://dayoneapp.com/blog/journaling-suggestions/
V26 Day One guide, adding media on iOS: https://dayoneapp.com/guides/adding-media-to-entries-in-day-one-for-ios/
V27 1SE help, Quick Fill: http://help.1se.co/en/articles/5447754-how-to-use-quick-fill.md
V28 1SE help, permissions: http://help.1se.co/en/articles/2673915-make-sure-1se-has-permission.md
V29 1SE help, daily reminders: http://help.1se.co/en/articles/4704334-how-to-enable-daily-reminders.md
V30 1SE App Store listing: https://apps.apple.com/app/587823548
V31 Amazon Photos help, Daily Memories and This Day: https://digprjsurvey.amazon.com/csad/help/node/G6LVL6BCGZ7RY83Z
V32 Amazon Photos App Store listing: https://apps.apple.com/us/app/amazon-photos-photo-video/id621574163
V33 Timehop App Store listing: https://apps.apple.com/us/app/id569077959
V34 Remento FAQ: https://www.remento.co/faq
V35 Apple Human Interface Guidelines, Privacy: https://developer.apple.com/design/human-interface-guidelines/privacy
V36 Apple, Delivering an enhanced privacy experience in your Photos app: https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app
V37 Expo image picker docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
V38 Apple WWDC23, Embed the Photos picker in your app: https://developer.apple.com/videos/play/wwdc2023/10107/

T1 Tom's Guide, Google Photos people controls in Memories: https://www.tomsguide.com/computing/mobile-apps/google-photos-is-giving-you-better-control-over-who-shows-up-in-your-memories-heres-how-it-works
T2 MacStories, review of Apple's Journal: https://www.macstories.net/reviews/apples-journal-app-journaling-for-all/
T3 TechRadar, Google Photos and painful memories: https://techradar.com/news/google-photos-will-soon-let-you-erase-painful-memories
T4 Tom's Guide, Chatbooks review: https://www.tomsguide.com/us/chatbooks-features,review-3966.html
T5 Trustpilot, Chatbooks (one page sampled): https://www.trustpilot.com/review/chatbooks.com?page=2
T6 TechCrunch, Qeepsake (2022): https://techcrunch.com/2022/08/16/qeepsake-a-journaling-app-that-helps-families-capture-and-store-memories-raises-2m
T7 Search results for Notion photo workflows (no primary source read): https://ifttt.com/connect/ios_photos/notion_so

Repo documents used for context (R): `docs/product/prd/27-photo-moments-and-media.md`, `docs/design/NOTIFICATIONS.md`, `docs/product/prd/00-product-frame.md`, `docs/design/specs/MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md`.
