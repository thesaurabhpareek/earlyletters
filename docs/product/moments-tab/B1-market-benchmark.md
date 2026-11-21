# B1: Market benchmark for the Moments tab (PROPOSED)

Lead: b1. Date: 21 Nov 2026 (UTC). Status: PROPOSED, docs only. Branch intended: `wip/moments-b1` (see "Delivery note" at the end: this session had no shell, so the branch was not created).

Founder ask (20 Nov, verbatim): "Do market benchmark beyond Apple journal too so you have best of all worlds learnt. But basically what I want is screenshots I shared so do all that smartly."

No competitor screenshots or text are copied here. Each product is described in my own words and linked. The founder's screenshots and every real name, place and business in them are not used.

## 1. Purpose and scope

The Moments tab must turn what a parent already has (photos, days, our own letters, our 111 written prompts) into a reason to speak or write today, and a reason to come back tomorrow, without streaks, counts, guilt or gap-counting, and without breaking the constitution or the privacy rules.

This doc answers, for 13 products:
1. What surface turns library or past content into a reason to write or speak.
2. Where it sits in the IA.
3. The daily or weekly return mechanism.
4. Push and email nudge patterns.
5. Permission ask and how No is handled.
6. The privacy claim made.
7. What parents complain about (only reviews I read; sample sizes are small and stated).
8. Adopt, adapt, leave, with the constitution and privacy rules as the filter.

Then: a "best of all worlds" table, five design principles, a tab position with the reason, and what is UNVERIFIED.

Out of scope: choosing Route A or Route B (feasibility doc), the final tab bar design (design concept doc), nudge budgets (NS-32). I only say what the market tells us.

Products skipped: Notion and Craft. Neither has a surface that turns a library into a reason to write that adds anything the others do not. Not read.

## 2. Inputs read

Brief of record: `/home/claude/moments-brief.md` (20 Nov 2026), including the UPDATE line: Moments need not be the default tab; the founder wants a position that drives daily return, and the same moment signal should shape email and push, not only the in-app feed.

Not read this session (no shell or GitHub access): PR #1264, the privacy and constitution analysis, the feasibility doc, the design concept, the repo docs (J1 to J10, ML-1 to ML-14, NS-32, NS-51, BL-1305, K-02, the scope-stack-rank doc). I use their rule names only as the brief states them. Where this doc touches them, reconcile before merge: see section 8.

Primary sources read this session (fetched pages, not only snippets):
- Apple Journaling Suggestions and Privacy: https://www.apple.com/legal/privacy/data/en/journaling-suggestions
- Apple developer, JournalingSuggestionsPicker: https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md
- Apple developer, ItemContent: https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestion/itemcontent.md
- Apple developer, Journaling Suggestions updates (June 2024, June 2025): https://developer.apple.com/documentation/updates/journalingsuggestions.md
- WWDC24 session 10209: https://developer.apple.com/videos/play/wwdc2024/10209/
- Apple newsroom, Journal launch: https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments
- Apple Journal App Store listing: https://apps.apple.com/ie/app/journal/id6447391597
- Apple Photos and privacy: https://www.apple.com/legal/privacy/data/en/photos/
- WWDC20 session 10652 (photo picker, limited library): https://developer.apple.com/videos/play/wwdc2020/10652/
- Third-party write-up of Memories and Featured Photos controls: https://www.idownloadblog.com/2024/03/19/turn-off-memories-featured-photos-iphone-mac/
- Day One, Journaling Suggestions: https://dayoneapp.com/?p=69532 ; App Store listing: https://apps.apple.com/id/app/day-one-daily-journal-diary/id1044867788 ; reminders post (body not readable): https://dayoneapp.com/blog/reminders-templates/
- Google Photos Help, Memories: https://support.google.com/photos/answer/9454489 ; Ask Photos: https://support.google.com/photos/answer/15318661 ; Help me title: https://support.google.com/photos/answer/13872269 ; Google blog on Memories and collage editor: https://blog.google/products-and-platforms/products/photos/new-look-for-memories-plus-collage-editor/
- Google PAIR write-up on reminiscing: https://medium.com/people-ai-research/a-snapshot-of-ai-powered-reminiscing-in-google-photos-5a05d2f2aa46
- Qeepsake Help: https://help.qeepsake.com/article/116-how-does-qeepsake-work ; App Store: https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787
- Tinybeans App Store: https://apps.apple.com/us/app/-/id521633042
- BackThen (from the team behind Lifecake) App Store: https://apps.apple.com/us/app/backthen-family-baby-photos/id1505173822
- Remento FAQ: https://www.remento.co/journal/remento-faqs-how-does-remento-work ; recording help: https://help.remento.co/en/articles/10292359-inside-the-recording-experience ; reviews: https://www.trustpilot.com/review/remento.co
- Storyworth blog on how it works and reviews (promotional, their own site): https://welcome.storyworth.com/blog/storyworth-reviews-good-bad ; Trustpilot page 9: https://www.trustpilot.com/review/storyworth.com?page=9
- 1 Second Everyday App Store: https://apps.apple.com/app/id587823548
- Timehop App Store: https://apps.apple.com/us/app/id569077959
- Momento App Store: https://apps.apple.com/us/app/-/id980592846
- MacStories review of Journal: https://www.macstories.net/reviews/apples-journal-app-journaling-for-all/ ; Pratt design critique: https://ixd.prattsi.org/2026/02/design-critique-journal-iphone-app/
- PopSci on hiding unwanted memories: https://www.popsci.com/diy/how-to-remove-someone-photo-memories/
- Northeastern on Wordle: https://news.northeastern.edu/2022/01/21/what-makes-wordle-so-g-r-e-a-t/

Honesty about reviews: App Store pages in my fetch showed only two to three reviews each. Those are samples, not trends. Trustpilot pages are one page each. I never quote a person by name and I paraphrase.

## 3. The benchmark, product by product

Format: Surface / IA / Return / Nudges / Permission / Privacy claim / Parent complaints / Adopt, adapt, leave.

### 3.1 Apple Journal app and the Journaling Suggestions picker (the likely source of the founder's screenshots)

- Surface: tapping plus opens a full-screen sheet of suggestions (grouped photos, places, workouts, contacts, music), reflection prompts, and a button to start an empty entry. You pick which items to keep, or save without writing (MacStories). Reflection prompts have their own on-by-default toggle (WWDC24). Source for the sheet: MacStories above.
- IA: inside the create flow, not a tab. Third-party apps get the same suggestions through `JournalingSuggestionsPicker`, a SwiftUI view the app shows; Apple says the first time it appears a modal sheet introduces the idea, and after a pick "the system shares only the information associated with the chosen suggestion with your app" (Apple developer page).
- Return: scheduled notifications meant to help build a habit (Apple newsroom). The Journal listing says reminders cover both when it is time to write and when new suggestions are ready. The listing also mentions streak insights and widgets. June 2025 update: third-party apps can register for system Journaling Suggestion notifications; when a person taps one, the system opens the picker in the app (Apple updates page).
- Nudges: set by the person in Settings on a schedule. The app can read the schedule via `JournalingSuggestionsConfiguration` (Apple updates page). The text is the system's, not the app's.
- Permission: the person turns Journaling Suggestions on and chooses categories (workouts, media, contacts, photos, significant locations, moods) in Settings, can clear history, or turn it off (Apple privacy page). Whether a third-party app needs its own library permission to show the picker: I did NOT find an explicit statement. UNVERIFIED. The WWDC20 photo-picker session does say the standard photo picker runs out of process and needs no library permission, which is a different API (WWDC20 10652).
- Privacy claim: suggestions are built on the device; "Only you can see your suggestions prior to sharing them"; entries are encrypted when the phone is locked and end to end encrypted in iCloud with default settings (Apple privacy page and newsroom). People can see which apps have access under Apps Using Private Access.
- What the app receives: the pick only, as typed assets (State of Mind, motion activity, generic media, reflection prompt text and colour; WWDC24). Location can carry a MapKit identifier and a work-location flag (June 2025 update). Titles: I did not read that a machine-made title is part of what the app receives. UNVERIFIED. The brief already forbids storing or showing it.
- Parent complaints (reviews and critics, not parents specifically): suggestions push people towards many short entries instead of one long one (MacStories); suggestions "dominate" the create flow and nudge away from free reflection (Pratt critique); one reviewer found it adds little over Notes or paper and wanted sharing (App Store). None of these is a parent of a baby. Gap: I found no parent-specific complaint about Journal.
- Adopt: the shape "pick what is worth keeping, then write". The three-step control (choose types, choose the suggestion, choose the assets). Reflection prompts as an on-by-default but switchable layer, with a refresh.
- Adapt: put our 111 written prompts in the same slot as Apple's reflection cards, and let a photo pick be a prompt for a spoken letter, not an entry body.
- Leave: machine titles, mood cards, music tiles, work-location flags (adds meaning we cannot verify; adult-journal framing; "State of Mind" is health-adjacent). Leave streak widgets (rule: no streaks). Leave the suggestion sheet as the only create path, since the critique shows it can crowd out the blank page.

### 3.2 Day One

- Surface: Journaling Suggestions appear in a new entry on iPhone and iPad: reflection prompts you can refresh, media, State of Mind, motion activity. Media suggestions are described as static references, "not a continuous sync" of listening history (Day One page). Separately, "On This Day" revisits past entries (listing).
- IA: inside the new-entry screen; On This Day and a calendar and Today summary elsewhere (listing).
- Return: daily prompts for "writer's cramp", reminders by text message or phone notification, streaks and calendar (listing).
- Nudges: scheduled reminders, user set. I could not read the reminders post body, so tone and options are UNVERIFIED.
- Permission: handled by iOS Settings, not by Day One (Day One page): "You manage Journaling Suggestions in the iPhone Settings app."
- Privacy claim: private diary; its label lists location, user content, identifiers and advertising or marketing uses as data linked to you (listing, developer-declared). So a "private" headline sits next to a long label. For us, the label story matters (Data Not Collected).
- Complaints: sample too small to say (three reviews, 2017 and 2024, none about prompts or reminders).
- Adopt: On This Day from our own letters only. The honest line that suggestions are references, not a sync.
- Leave: streaks, AI Gold features such as summaries and title suggestions (violates "never write or shape"), and permission handled somewhere the app cannot explain.

### 3.3 Google Photos: Memories, Ask Photos, collages

- Surface: a featured Memories carousel at the top of the Photos tab (Android; help page), time-based and themed memories, plus creations. A collage editor lets people pick photos, choose a design and rearrange (Google blog). Ask Photos is a conversational search that may save things to a "Remember List" (Help). "Help me title" uses generative AI to suggest Memory titles, and may use photo location (Help; Labs, 18+, certain regions).
- IA: top of the main photos tab as a carousel. Ask Photos sits in search.
- Return: "updated frequently" (help). Notification toggles are separate for time-based, themed and creations (help).
- Permission: Ask Photos only for people who opt in to Gemini features; turn off separately from all Gemini features (Help). Memories can be turned off by type; people, pets and dates can be hidden (Help).
- Privacy claim: "Your Memories in Google Photos are only visible to you"; sharing is optional (Google blog). Ask Photos: humans do not review unless feedback or abuse (Help).
- Parent and general complaints: resurfaced photos can be painful (ex-partner, a death); filtering is imperfect and funerals look like weddings (Google PAIR write-up). A photo already shown in a memory cannot be removed from it (PopSci). Parent specific: the same PAIR write-up found a face-grouped "grown up so fast" collage meaningful for her own child.
- Adopt: hide-a-day and hide-a-person-style controls (adapt: hide a day, and a "not today" per card, not face-based). Separate toggles per kind of nudge. The idea that a card can be dismissed without deleting the photo.
- Adapt: the "then and now" pairing, but only for photos the parent picked and letters they made, with their own words.
- Leave: face grouping (no face matching), generated titles, Ask Photos style questions (a model writing replies about a family), cinematic and music reels (adds meaning, music, and a look we do not own), and "memory cannot be removed once shown".

### 3.4 Apple Photos: Memories and Featured Photos

- Surface: automatic Memories and Featured Photos from the library. They appear in the For You tab, search, Home Screen widgets and Today View on iPhone (iDownloadBlog).
- IA: For You tab, widgets.
- Return: widgets and the For You tab. Notification controls: on Mac a "Show Memories Notifications" box exists; I did not read separate iPhone controls (UNVERIFIED for iPhone).
- Permission and No: one switch ("Show Featured Content") turns it off; the For You sections then show a banner with a Go to Settings button (iDownloadBlog). That is a clean model of a No that still leaves a calm, truthful page.
- Privacy claim: on-device machine learning; Apple "does not access your photos or videos" (Apple Photos privacy page).
- Complaints: people want to remove unwanted people from Memories (PopSci); Apple offers "Feature This Person Less" and "Never Feature This Person" and per-photo "Hide From Memory" (PopSci). Hiding via the share menu also removes the photo from the library (PopSci): a trap.
- Adopt: one plain switch; the off state shows a clear banner and a way back; "show me less" in the card itself.
- Leave: person-based features, scene classification, important-date inference from Contacts and Calendar (we must not read these; the server never sees them).

### 3.5 Qeepsake

- Surface: you reply to text prompts and the reply is saved to the child's journal; prompts are age appropriate from pregnancy through school years. Some channels, including SMS, need a paid plan (listing). Help says you can answer daily and missed questions in the mobile app and write spontaneous entries (Help).
- IA: prompts and journal in the app; SMS and email as channels. I could not confirm email prompts from the help page (it did not mention emails or reminders): UNVERIFIED.
- Return: a prompt on a schedule, plus weekly recap emails to friends and family (listing).
- Nudges: text prompts. One reviewer received daily marketing texts and found turning texts off also stopped the prompts they wanted (listing).
- Permission: not described. Photo upload only in the mobile app (Help).
- Privacy claim: listing label lists usage data used to track you, and linked data including photos and videos. Developer-declared.
- Complaints (one listing, small sample): marketing texts bundled with prompts; both parents cannot be admins; slow upload, editing and book creation; books and plans too expensive; grainy collage prints; hard to page through the album. Source: Qeepsake listing.
- Adopt: a prompt that is a question about the child's age, answerable in one go.
- Adapt: prompts as a reply by voice, not a text.
- Leave: marketing and prompt bundled in one channel (principle 4 below); pushing the book sale into the daily nudge.

### 3.6 Tinybeans

- Surface: upload moments as they happen or in bulk, sorted by date, shared privately with invited people; caption search; printed books (listing).
- IA: calendar and timeline of the child.
- Return: family members follow along; the "what is new" is mostly on the family side.
- Permission: private sharing by invitation. Photo import is by the photo picker with a 20-photo cap per selection (a reviewer; developer reply), which reviewers found tedious for back-filling and prone to duplicates.
- Privacy claim: "Your data isn't for sale" in the listing, while the label discloses tracking and third-party advertising uses (listing). The two do not line up. Our rule: no claim that the label cannot back.
- Complaints (listing): no audience limits (parents only); no "what is new" feed, only a calendar; hard to find old photos before caption search; tedious back-filling; duplicate uploads. High rating (4.9 from about 104K) so the core works.
- Adopt: the calm calendar rhythm.
- Adapt: back-filling is the real job for a tired parent: let them pick a day and see only photos from it (a day-first picker), and mark ones already used so nothing is added twice (marking is a local state, not a count or a gap).
- Leave: ad-supported tiers, location "used to track" labels.

### 3.7 Lifecake (now BackThen, "from the team behind Lifecake")

- Surface: photos and videos sorted by child with a timeline per child; auto-created highlights, flashback reels and montages; invite family with permissions you set (listing).
- IA: timeline per child.
- Return: family members are notified when new memories are added. Reminders for the parent: not described in the listing.
- Privacy claim: "No ads. No data-sharing", while the label lists identifiers used to track and advertising uses (listing). The mismatch is the same as Tinybeans.
- Complaints (three reviews, 2020 and 2023): family storage limit now shared across the family; downloads removed; web access lost. The wider point for parents: fear of being locked out of their own photos.
- Adopt: auto per-child timeline; "all content can be returned if you leave" (listing) is a strong promise. We already have export; say it plainly.
- Leave: auto highlights and montages (machine made), timelapse of a child's face (face analysis).

### 3.8 Remento

- Surface: weekly prompt by email; answer by voice or video from the link; transcript made automatically; "speech-to-story" turns a recording into an exact transcript or a written story; the stories can be edited; QR codes link to the audio in the printed book (Remento FAQ, recording help). Prompts come from family or a bank and are personalised from earlier stories.
- IA: email first; no sign-in; web or app.
- Return: weekly prompt; after finishing, you can catch up on missed prompts, pick a trending prompt, write your own, or "tell the story behind a photo" (recording help). That last one is the closest market match to our Moments idea.
- Permission: microphone and camera on record (recording help).
- Privacy claim: thin. "We'll never give your email away" (FAQ).
- Complaints (one Trustpilot page; one reviewer for each): a senior found emails and notifications overwhelming and never opened them; gift giver paid for a long unused period and found cancellation strict; wants to pause and re-record small sections; hard to log in to the manuscript (Trustpilot). No reviewer on that page said transcription changed their words, but the "written story" mode is exactly what our constitution forbids.
- Adopt: no-sign-in return path from a message; "tell the story behind a photo" as the shape of a card; pause and redo.
- Leave: the "written story" mode (it writes); personalised prompts built from earlier stories (reads the person's words to make new content; we pick from 111 fixed prompts by age).

### 3.9 Storyworth

- Surface: one question a week by email or text; answer by replying, on the site, or by phone; no app or login; family can add photos and suggest questions (Storyworth blog, their own promotion).
- IA: email is the home.
- Return: the fixed weekly question. They describe one a week as what makes the project feel manageable.
- Nudges: weekly email plus extra reminders. One 4 star reviewer disliked the extra reminders, accepting one weekly (Trustpilot page 9, one page of 2,840 reviews shown as the page count). Others: questions not meaningful, wants to write freely, lost a long answer and wants autosave.
- Privacy claim: not read in detail. UNVERIFIED.
- Adopt: one question, one time slot, no extras after you have answered. Autosave. "Write what I want" as always allowed.
- Leave: reminder after the parent has already written.

### 3.10 1 Second Everyday

- Surface: a daily video diary; "Smart Fill" fills days with suggested clips from the camera roll; notes per day; a project is a month, a season or years (listing).
- IA: a calendar of days.
- Return: "friendly creative reminders" so you do not miss a day; reviewers said reminders can be turned off and are helpful (listing).
- Permission: not described in the listing. UNVERIFIED.
- Privacy claim: clips are not shared unless you choose (listing).
- Complaints (three reviews): one reviewer lost years of clips after a reinstall; cost. Loss of data is the fear to design against.
- Adopt: a calendar of days as the unit, one small thing per day.
- Leave: "do not miss a day" framing (gap-counting), Smart Fill (machine chooses which moment counts).

### 3.11 Timehop

- Surface: memories from the same day in past years; can show every photo and video in the camera roll; "Then and Now" asks you to take a new photo beside an old one; connects to social and photo sources (listing).
- IA: a daily feed.
- Return: a daily streak and badges; an alert to check memories (listing). Rule: we do not copy streaks and badges.
- Nudges: a 2021 reviewer received several reminders after they had already checked that day, and said notifications were excessive; same review said ads rose (listing).
- Permission: not described in the listing. UNVERIFIED.
- Privacy claim: label lists identifiers and usage used to track (listing).
- Adopt: the same-day-last-year idea, built only from our own letters (a year ago from our letters) and from photos the parent already picked. "Then and now" as a prompt for a new spoken letter.
- Leave: social-account feeds, streaks and badges, repeat reminders after you opened.

### 3.12 Momento

- Surface: auto feeds from many services; moments can include photos and videos; calendar and On This Day views; custom reminders and streaks (listing).
- Complaints (small sample): location search unintuitive; confusing photo info inheritance; manual sync clunky; one reviewer doubted the value of feeds. Not a parent audience.
- Adopt: nothing new. Confirms people do not want a feed of other people's posts in their journal.
- Leave: feeds, streaks, place search.

### 3.13 Non-journaling daily return: Wordle

- Pattern: one puzzle a day, same for everyone, "a strategic design choice to keep it at one per day"; the daily limit "created a sense of scarcity"; a share button that does not spoil the answer; no ads or data harvesting (Northeastern). The article does not mention notifications.
- Why it matters for us: the reason to return is a small finished thing, not a debt. A day is complete when it is done and there is no backlog.
- Adopt: finite "today" (one best moment, not a feed). Sharing that gives away nothing private: a card the parent can send that shows our illustration and no photo, as an option.
- Adapt: the "same for everyone" part becomes "same for this child's age": the age-day prompt is fixed by the child's date of birth, which the server legitimately knows.
- Leave: any streak or share count I did not read; scarcity as manipulation. We use finite as a comfort, not as pressure.

## 4. What the market gets wrong for tired parents (cross-cutting)

Each line is from sources above:
1. Extra reminders after you have already acted (Storyworth reviewer, Timehop reviewer, Remento reviewer).
2. Turning off marketing turns off the useful prompts (Qeepsake reviewer).
3. Resurfacing can hurt and cannot always be hidden after it has shown (PAIR write-up, PopSci).
4. Suggestions that crowd out the blank page (Pratt critique, MacStories).
5. Fear of losing years of content (1 Second Everyday reviewer, Lifecake and BackThen reviewers).
6. "Private" claims beside labels that say tracking (Tinybeans, BackThen, Day One listings). Developer-declared; not verified by Apple.
7. Back-filling is tedious without a day-first view (Tinybeans reviewers).

## 5. Best of all worlds for Early Letters

| Need | Best seen in | What we do | Filter check |
|---|---|---|---|
| A reason to speak today, drawn from what the parent has | Apple suggestions sheet, Remento "story behind a photo" | A Moments card pairs a day with a fixed prompt or the parent's own typed day; tap to speak | Constitution: no machine title; label only if parent typed or chose |
| Finite, calm "today" | Wordle | For you shows a short, finished set; no infinite scroll, no "x waiting" | No counts or gaps |
| A year ago, from our own letters | Timehop, Day One On This Day | Built from letters made in Early Letters only | Server may know letters made; library not involved |
| Day-first picking for back-filling | Tinybeans complaints | Recent: newest-first by day, parent picks photos for that day; used ones marked on the device | Local state only; no counts |
| One plain switch and a calm off state | Apple Photos | One switch; the No state shows real content and a way back | J5: never an empty promise |
| Hide controls | Google Photos, Apple Photos | "Not today", "Hide this day", per-kind nudge switches | Never imply a gap |
| Weekly one-question message, no sign-in | Storyworth, Remento | Optional email with the age-day prompt; opens to speak | Server knows date of birth, typed days, letters made only |
| Pause and redo | Remento reviewers | Already in the capture flow; reuse | Machine may repair, not add |
| Honest privacy line | Apple privacy page (clear and specific) | One sentence on the card: what is read, where it stays | Data Not Collected must hold; counsel told otherwise |
| Safe nudge | Apple system notifications for third parties | Local push, fixed text, random id, quiet hours | ML-3, NS-32, NS-51 |
| Export and "you can leave" | BackThen listing | Say plainly that letters can be taken out | Already built |
| Sharing without exposure | Wordle | Optional card with our illustration, no photo or name | Privacy rules |

## 6. Five design principles that follow

1. One finished thing per day. Today shows a few cards and then ends. Never a feed, never "you have N", never "catch up".
2. The parent supplies the meaning. We offer a day, a photo they chose, or a fixed prompt. No machine title, caption, place or person guess. The parent's words are the only text on the letter.
3. A No is a full product. Declined, limited or denied still shows real cards (typed occasions, age days, a year ago from our letters, prompts, photos already picked). One calm line says how to change it later.
4. One nudge, one channel at a time, then silence. After the parent opens or writes, no further reminder that day. Marketing never shares a switch with the useful nudge.
5. Say what is read and where it stays, in one sentence, at the moment of the ask. Nothing in the label should contradict it.

## 7. Recommended tab position

Recommendation: Home stays the default. Moments is the second tab, immediately to the right of Home. Not a centre tab, not default, not inside Home.

Reasons:
- Evidence on placement: suggestion-led create flows can crowd out the blank page (Pratt critique, MacStories). A default Moments tab risks the same, and J4 says Home starts a letter. Keeping Home as the place that starts the letter keeps that clean.
- Evidence on reach: Apple puts its photo-based surface in a tab (For You) and widgets, and Google puts a carousel on top of the photos tab (iDownloadBlog, Google Help). So a second tab is a normal home for this. I did not verify the order of the tab bars in those apps. UNVERIFIED.
- A centre tab implies the primary action. Our primary action is to speak. If a centre button exists it should be the record button, not browsing.
- Moments inside Home would hide the permission ask and the Recent list in a scroll, and the reason to return daily needs its own address that a widget, push or email can name ("open Moments").
- Cost: a second tab means the tab bar changes from the three-tab ruling. That is a reversal the founder owns (brief list). Which tabs the three currently are: not read this session.
- Fallback if the founder wants less change: Moments as the first card group on Home with a "See all" that opens a full screen. Same content, one fewer tab. Weaker for push and email deep links.

Same signal for card, push and email: one local rule ("a day with something worth a letter") produces (a) a For you card, (b) a local push with fixed text from NS-51 style wording and random id, and (c) an optional email that uses only what the server legitimately knows (date of birth, typed days, letters made). The library never feeds email. This is consistent with ML-3 as the brief states it. Apple's June 2025 system notifications for suggestions are produced by the system, not us. They are a possible Route A route but touch the intent of ML-3 and NS-32, so the CPO and counsel should decide whether a system-made nudge counts. UNVERIFIED how the system text looks and who controls it.

## 8. Requirements (PROPOSED)

IDs are `MT-B1-R<n>`. Test layer in brackets. Strings are examples for content to replace.

**MT-B1-R1 One finished set.**
Given a parent opens Moments,
When For you loads,
Then it shows at most a short fixed set of cards and ends with a calm closing line, with no scroll feed, no number of items waiting, and no gap or streak wording.
[unit: card-set builder; copy rules test; screen snapshot]
Shown: nothing new. Records: nothing. Never: counts, gaps, streaks, badges. Decline: n/a.

**MT-B1-R2 No is a full product.**
Given photo access is not asked, declined, limited or denied,
When the parent opens Moments,
Then they see typed occasions, age days from the date of birth, a year ago from our own letters, photos they already picked and prompts, with one plain line on how to change access later.
[unit; UI test for each of the four permission states; VoiceOver pass]

**MT-B1-R3 Ask in plain words, with a comfortable Not now.**
Given a parent has seen our own illustrated examples,
When we ask for photo access,
Then the ask says what is read, that it stays on the phone, that they can choose some photos only, and offers Not now at equal weight, and Not now never repeats within the same visit.
[UI test; privacy review; content review]
Shown: what is read and where it stays. Records: only the on-device answer. Never: a photo, filename, place or date in analytics or logs. Decline: Not now, with real content as in R2.
Reversal flag: overturns K-02 and BL-1305 as the brief lists; the founder owns it.

**MT-B1-R4 The parent supplies every label.**
Given a day card is shown,
When it has a title,
Then the title is typed or chosen by the parent, else it shows only the date; a machine title from a system picker is never stored or shown.
[unit: label provenance test; content rules test; no-real-family-data test]
Reversal flag: ML-6 as the brief lists (cards show a date, never a place or thumbnail) if thumbnails are used.

**MT-B1-R5 One nudge, then silence.**
Given a parent has opened Moments or made a letter today,
When a nudge was due later that day,
Then it is cancelled and none is sent.
[unit on scheduler; integration on local notifications]
Constraints: fixed text, random id, no place, photo, count or "waiting", no thumbnail, quiet hours, within NS-32.

**MT-B1-R6 Separate switches.**
Given the parent opens settings,
When they look at nudges,
Then useful prompts and any marketing are separate switches, and turning marketing off never turns off the prompt.
[UI test; consent test for email]

**MT-B1-R7 Hide without deleting.**
Given a card appears,
When the parent chooses Not today or Hide this day,
Then it disappears on this phone and the photos stay untouched; a hidden day can be shown again from settings.
[unit; UI; local storage test]
Never: a "you hid N" count.

**MT-B1-R8 A day-first picker for back-filling.**
Given a parent wants to add pictures to an earlier day,
When they open that day in Recent,
Then they see photos from that day only, ones already used show a small mark kept on the device, and nothing counts what is missing.
[unit on grouping; performance test on a large library; Limited access test]

**MT-B1-R9 Privacy line that the label can back.**
Given the ask or the settings page shows a privacy line,
When counsel compares it with the App Store label and policy,
Then nothing in the line is broader than the label, and the Data Not Collected story holds or counsel has been told what changes.
[process check; link to privacy and constitution doc]

**MT-B1-R10 Prompts are fixed, not written.**
Given a For you prompt card shows,
When it comes from the 111 written prompts,
Then it was chosen by age from the fixed set and not generated or personalised from the parent's words.
[unit: prompt selection in packages/core; content test]

## 9. Edge and unhappy paths

- Limited access with a handful of photos: show those, say so once, offer a way to choose more. No gap wording.
- A day with a sensitive photo (illness, loss): the parent can hide that day; hidden cards never resurface unless asked. Google Photos shows this is a real need (PAIR write-up, PopSci).
- Parent loses a child, or a family has a hard year: no nudge text that assumes joy; the quiet default plus a Pause nudges switch with no explanation asked. Needs content and counsel.
- Reinstall: letters restore from the account; the on-device marks (used, hidden) may be lost. State it. The market fear is lost data (1 Second Everyday reviewer).
- Two caregivers: each phone has its own library and marks; nothing syncs from the library. UNVERIFIED how we handle a shared child.
- Quiet hours and time zones: local only.
- Screen reader, AX5, Reduce Motion, Reduce Transparency, Increase Contrast, iPhone SE 3: cards must reflow and read in a sensible order; no information carried by colour alone (Apple's prompt cards use colour backgrounds, WWDC24; ours need a text cue).
- Route A fails or the picker is not available: Route B or typed-only still works.

## 10. Constitution, privacy and accessibility checks

- Constitution: no machine title, caption, summary or story; no scene, place or person guess; no face matching; no "make it nicer". Leave list in section 3 follows from it: Google generated titles, Day One AI Gold features, Remento written stories and personalised prompts, 1SE Smart Fill, Lifecake montages.
- No fear, guilt or loss language, no counts, gaps, streaks, points or badges: Timehop streaks and badges, Momento and Day One streaks, Apple Journal streak insights, 1SE "do not miss a day" all left.
- Never imply AI writes anything: Remento "ghostwriter" framing and Ask Photos conversational replies left.
- Privacy: nothing from the library leaves the phone; nothing in analytics, logs or crash reports; reverse geocoding to name a place may send coordinates to Apple (UNVERIFIED, from the brief); default none or parent typed.
- Never gender the child; use {child}.
- Accessibility: see section 9.
- Content rules: this doc has no em dashes, en dashes, curly quotes, ellipsis characters or emoji. Re-run the content check before merge.
- No real family details, names or places are in this doc. The founder's screenshots were not opened for this doc.

## 11. Open questions (recommended default, deadline)

1. Does Apple's system notification for suggestions (June 2025) count as "a push created from library data" under ML-3? Default: do not use it in 1.x; revisit with Route A. Owner: CPO and counsel. Deadline: before the feasibility doc is signed.
2. Is a library permission needed to show the Journaling Suggestions picker in our app? Default: assume no extra prompt but test on a device. Owner: mobile and the feasibility lead. Deadline: before Route A vs B is chosen.
3. Do we offer an optional share card (Wordle pattern)? Default: no in v1; revisit after a month of use. Owner: product.
4. Second tab or card group on Home as the fallback? Default: second tab. Owner: founder (reversal of the three-tab ruling).
5. Is weekly email in scope for the same release? Default: yes, only date of birth, typed days and letters made, off until the parent turns it on. Owner: product and counsel.
6. Wording of the Pause nudges switch for hard seasons. Default: one plain line, no reason asked. Owner: content.
7. Research I recommend, cheapest first (founder runs sessions; I plan): five parents each sort the same eight Asha cards into "I would speak about this", "later", "not for us"; no child recorded, no real photos used. This tells us whether day, prompt or photo is the reason to speak.

## 12. Dependencies

- Feasibility doc: Route A or B, whether the picker needs a permission, on-device grouping performance.
- Privacy and constitution doc: R3, R4, R9, ML-3 and ML-6 reversals.
- Design concept: tab bar, glass use (max three glass surfaces), card look on paper.
- Content (VOICE.md, BRAND.md glossary): the ask, closing line, Pause line, nudge text.
- Data (`decision-science`): which signals are allowed as opt-in analytics. Only the existing allowlist; no library signals.
- PR #1264 (Home engagement wheel): reconcile the return mechanism.

## 13. What is VERIFIED, UNVERIFIED, guess

VERIFIED (page fetched this session, link in section 2):
- Apple: suggestions built on device; picker shares only the chosen suggestion; first appearance shows an intro sheet; user chooses categories and can turn off; June 2025 system notification API for third parties; reflection prompts on by default; Photos uses on-device ML and Apple says it does not access photos; standard photo picker needs no library permission; Memories and Featured Photos can be switched off and show a Go to Settings banner.
- Google Photos: Memories carousel at top of Photos tab on Android; separate notification toggles; hide people and dates; Ask Photos opt-in; Memories "only visible to you".
- Listing-level facts, developer-declared and not verified by Apple, for Qeepsake, Tinybeans, BackThen, Day One, Timehop, 1SE, Momento, Journal.
- Remento and Storyworth prompt cadence; Wordle design reasons (Northeastern).
- Review points in section 3 as read, on very small samples.

UNVERIFIED:
- That the founder's screenshots are Apple's picker (brief says so).
- Whether the picker needs its own library permission in a third-party app.
- That a machine title is or is not passed to the app.
- Day One reminders tone and options; Qeepsake email prompts; Storyworth privacy claims; Apple Photos iPhone notification controls.
- Permission ask patterns for Timehop and 1 Second Everyday (listings did not say).
- Tab order inside Apple Photos and Google Photos.
- Google Photos on iOS placement (I read Android help).
- Anything about Notion, Craft (skipped).
- All pricing figures are omitted on purpose. I have not verified any current price.

GUESS:
- That a second tab beats a card group on Home for push and email deep links. Test by a click test of both on the fictional Asha data.

## 14. Delivery note

I had no shell tool in this session. I could not clone, create `wip/moments-b1`, commit, push, or read back a head sha. The file is at `/home/claude/mt-b1/docs/product/moments-tab/B1-market-benchmark.md` and needs to be committed on `wip/moments-b1` by someone with a shell. I did not read PR #1264, the privacy, feasibility and concept docs, or the repo rule docs.
