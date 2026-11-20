# Function review: photos and suggestions (PHS), levels 1 to 3

Owner lanes: `mobile`, `privacy`, `security`. Written 20 Nov 2026 under `tools/review/wave3-briefs.md` brief 5, `gap-agents-common.md` and `docs/product/prd/functions/BRIEF.md`. Direction: `20-founder-direction-20nov.md` section 6. Status: draft for Karma to rule; changes no card, no code and no legal text.

I am a Claude role, not counsel and not an Apple employee. Every legal or store reading is marked "counsel must confirm". Apple facts carry a source read on 20 Nov 2026 or the word UNVERIFIED. Nothing here was run on a phone or built.

## 1. What I read, and what I did not

### 1.1 Repo (read this session)
| Source | Used for |
|---|---|
| `tools/review/wave3-briefs.md`, `gap-agents-common.md`, `functions/BRIEF.md` | the task and format |
| `20-founder-direction-20nov.md` (all) | levels 1 to 3 (section 6), Q-FD-4, Q-FD-6, notification rules (sections 2 and 4) |
| `01-photo-with-a-letter.md` (NS-01, 365 lines, all) | what level 1 already is: R1 to R62, data inventory (section 11), door lines (12), label effect (18), claims (19) |
| `functions/privacy.md` lines 1 to 60 | format; its S1 (Apple App Privacy Details) and S2 (App Review Guidelines 5.1.1(iii), 5.1.2) which I rely on second hand |
| `functions/lifecycle-and-platforms.md` (grep) | FR-LCY-31 (native module needs a "what Android would do" line) |
| `apps/mobile/app.config.ts:44` | `IOS_DEPLOYMENT_TARGET = '17.0'` |
| `apps/mobile/app.config.ts:250-262` | `associatedDomains` (`applinks:<brand domain>`) exists only in a sign-in-capable build; entitlements are set in one block |
| `apps/mobile/src/lib/reminders/planner.ts` (head, 377 lines; exports) | kinds are `evening`, `monthAge`, `birthday` (line 106) |
| `docs/product/prd/10-reading-and-family.md:965` (grep) | Memory Library "reads the photo library and suggests days"; `occasion` class left #758 |

### 1.2 Apple sources (read 20 Nov 2026)
| # | URL | What I rely on |
|---|---|---|
| A1 | https://developer.apple.com/documentation/journalingsuggestions.md | Framework overview. Availability iOS 17.2 (iPadOS 26.0 for the framework page). "For the picker to appear, your app needs a special entitlement in your app's code signature. You don't need to ask for additional authorization because your app can't access the details for a suggestion until after a person chooses to share them." Mac Catalyst ignores the picker button. The picker is a SwiftUI view (`JournalingSuggestionsPicker`) |
| A2 | https://developer.apple.com/documentation/JournalingSuggestions/presenting-the-suggestions-picker-and-processing-a-selection.md | "the system presents the picker in a system process"; "the system shares only the details of the chosen suggestion with your app"; first-use consent sheet once per device; types a selection can hold (table in 3.2); sources are Photos, Health, Fitness, Podcasts, Music, plus third-party data through HealthKit, CallKit, SiriKit; the person controls suggestion types in Settings; "Suggestion data requires careful handling" and points to the Developer Program License Agreement |
| A3 | https://developer.apple.com/documentation/BundleResources/Entitlements/com.apple.developer.journal.allow.md | Key `com.apple.developer.journal.allow`, iOS 17.2. "Add this entitlement to your app by enabling the Journaling Suggestions capability in Xcode" |
| A4 | https://developer.apple.com/documentation/JournalingSuggestions/JournalingSuggestion.md, `.../Photo.md`, `.../JournalingSuggestionAsset.md` | `JournalingSuggestion` has `date` (range), `title`, `items`, `content(forType:)`. `Photo` has `photo: URL` ("a URL to an image on disk") and `date: Date?`. Asset types: Photo, LivePhoto, Video, Location, LocationGroup, Workout, WorkoutGroup, Contact, Song, Podcast, GenericMedia, MotionActivity, Reflection, StateOfMind, EventPoster |
| A5 | https://developer.apple.com/documentation/updates/journalingsuggestions.md | June 2025 changes: system notifications, iPadOS, Apple Invites event posters, work-location flag, workout names. June 2024: motion activity, media playback, state of mind, reflection |
| A6 | https://developer.apple.com/documentation/JournalingSuggestions/receiving-journaling-suggestions-from-system-notifications.md | The notification path (3.4) |
| A7 | https://developer.apple.com/documentation/JournalingSuggestions/JournalingSuggestionsConfiguration.md and `.../information-property-list/jsnotificationurlformat.md` | Both iOS 26.0 and later |
| A8 | https://www.apple.com/legal/privacy/data/en/journaling-suggestions | "uses on-device processing to intelligently group moments and events"; "You control which suggestions are shared with journaling apps"; "Only you can see your suggestions prior to sharing them"; person can customise categories and clear history of unshared suggestions |
| A9 | https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md | `PHPickerViewController` runs "in a separate process, it's private by default. The user doesn't need to explicitly authorize your app"; limited library since iOS 14 ("your app can only access these assets"); a missing usage description crashes the app; do not make PhotoKit calls at first launch; limited-library prompt once per app life cycle unless suppressed by an Info.plist key; changes observed through the standard change observer; `PHPhotoLibrary.authorizationStatus()` returns `authorized` for limited access unless the `for:` form is used |
| A10 | https://developer.apple.com/documentation/photokit/observing-changes-in-the-photo-library.md | The observer fires after a fetch when items in that fetch result change; "Photos tells your app whenever another app or device changes ..."; it is a fetch-and-observe model, not a feed of "new photos" |
| A11 | https://developer.apple.com/documentation/uikit/using-background-tasks-to-update-your-app.md and `.../backgroundtasks/bgapprefreshtask.md` | Two task types (refresh, processing); a refresh task needs the `fetch` background mode; the app sets `earliestBeginDate` (the sample says "no earlier than 15 minutes from now"); the system calls an expiration handler "if it needs to terminate your task" |

### 1.3 Not read, not run
- Apple's entitlement approval process in the developer portal (Certificates, Identifiers and Profiles). A3 and A2 say "enable the capability in Xcode" and do not mention an application or approval. The direction's note that it "needs a special entitlement" (A1) is true; whether that needs a request to Apple is UNVERIFIED.
- Whether `JournalingSuggestion.Photo.photo` file carries Exif location (A4 says only "an image on disk"). UNVERIFIED; the NS-01 strip (R6) is applied regardless.
- Whether the file is a still for a Live Photo suggestion; whether `LivePhoto` and `Video` are separate items (A4 lists them separately).
- The Developer Program License Agreement text on suggestion data (A2 links it, I did not read it). Counsel must confirm.
- The WWDC tech talk (https://developer.apple.com/videos/play/tech-talks/111384): it appeared in search results, not fetched.
- Apple's guarantee or non-guarantee of background task timing (A11 shows the API; the text I read does not say "not guaranteed"). I treat it as best effort, UNVERIFIED.
- Any Expo or React Native package for the picker. None is in the lockfile by NS-01-R22; I did not search npm. The picker is a SwiftUI view (A1), so level 2 needs our own Swift code in an Expo module (3.3).
- e2e design files (`docs/design/e2e/*/DESIGN.md`) were not read in this pass, so screen ids below are "new screen needed" unless NS-01 already names a state.
- No code in `apps/mobile/modules/scribe-photo` or `lib/photos` (the open stack, #834 to #840) was read; I rely on NS-01's reading of those diffs.

## 2. Verified answers to the brief's questions

| Question | Answer | Source |
|---|---|---|
| Does the Journaling Suggestions entitlement need Apple approval? | Not stated in Apple's documentation: the key is added "by enabling the Journaling Suggestions capability in Xcode". Whether the portal makes a developer apply first is UNVERIFIED. Plan as if a short wait is possible; the spike's first task is to enable the capability on our App ID and see | A1, A2, A3 |
| Minimum iOS | Picker, entitlement, `JournalingSuggestion` and `Photo`: iOS 17.2. Our deployment target is 17.0, so 17.0 and 17.1 phones exist in our supported range | A1, A3, A4; `app.config.ts:44` |
| Minimum iOS for Apple's notifications | iOS 26.0 for `JournalingSuggestionsConfiguration` and the `JSNotificationURLFormat` key | A7 |
| Can Apple's suggestion notifications open a third-party app? | Yes, on iOS 26 and later. "When someone taps a notification, the system launches the journal app indicated in the Open Notifications With setting." The app must carry `JSNotificationURLFormat` (a universal link), appears as an option only "if multiple journal apps exist", and the person must choose it in Settings. The tap opens a universal link whose id may be empty for a general reminder. The app then shows the picker prefilled with a `JournalingSuggestionPresentationToken`. The person still chooses what to share | A5, A6 |
| What the picker returns | Only what the person chose: a `JournalingSuggestion` with `title`, `date` range and `items`. Items can be photos (a file URL and a date), live photos, videos, locations (name, city, coordinates if available), location groups, workouts (calories, distance, route, heart rate, times, name), contacts (name and photo), songs, podcasts, generic media, motion activity (steps), reflection prompts, state of mind, event posters | A2, A4 |
| Photo library permission | None for the picker (we ask nothing). A separate PhotoKit read needs authorisation, and a missing usage string crashes the app | A1, A2, A9 |
| Limited access and change observation | Limited library (iOS 14 and later) restricts a PhotoKit app to chosen assets. Change observation reports changes to fetched results while the app runs; it is not an event feed for new pictures and says nothing about a closed app | A9, A10 |
| Background limits | Background work needs the `fetch` or processing mode, the registered identifier, and runs when the system decides; `earliestBeginDate` is a lower bound, and the system can terminate the task. We would need a background mode we do not use today | A11 (guarantee wording UNVERIFIED) |
| Is the picker in our process? | No. "The system presents the picker in a system process" | A2 |

## 3. Levels, as the product should treat them

### 3.1 Level 1: Pick (built in the open stack; NS-01)
Apple's `PHPickerViewController`, one still, no permission, metadata stripped, phone only. All requirements already exist as NS-01-R1 to R62. This review adds only what makes it a first-class start (section 4, FR-PHS-01 to 04) and does not restate NS-01.

### 3.2 Level 2: Journaling Suggestions (recommended for the card)
It is the same job as level 1 with a better list: instead of scrolling a whole library, the parent sees "recent moments" grouped by Apple on the device and picks one. The app gets nothing until the parent picks.

What we accept from a chosen suggestion, under the constitution and NS-01:
| Item type | Rule |
|---|---|
| Photo, Live Photo (still only) | Accept the first still as the letter's one picture, through the same stored-copy path as level 1 (strip, upright JPEG, cap, hash). `Photo.date` may fill a date label the parent can edit (NX-39 P1 / OQ-1: parent-confirmed only) |
| `title` and `date` range | Shown as a label the parent can edit; never written into the letter; never used by us to start, caption or summarise (direction 6.3) |
| Location (name, city, coordinates), Workout, Contact, Song, Podcast, media, steps, state of mind, event poster, reflection | Level 2 v1 does not accept these. If the picked suggestion holds only these, the sheet shows one calm line and starts a picture-less letter (the parent still speaks). Reason: a person's mood, contacts, heart rate and route are the most sensitive things Apple can give; Apple's own page says suggestion data "requires careful handling" (A2); and "never used for a nudge" (direction 6.3) is easier to hold if it is never read. A later card may show a place name the parent chooses to keep |
| Video | Not accepted (NS-01-R22: no video) |
| Several photos in one suggestion | Take none by default; offer a one-picture choice (one picture per letter, NS-01) |

Honest limits to say in review notes: the suggestion's grouping and the "title" are made by Apple on the device, not by us. We do not write them, and a parent can see the title is not our words only if our UI shows it as Apple's (design question, FR-PHS-14).

### 3.3 How it is built in Expo (engineering fact, mobile lane)
- The picker is a SwiftUI `View` (A1, A4). React Native cannot render it directly. The usual route is our own Expo native module with a `UIHostingController`, in `apps/mobile/modules/scribe-photo` next to `pickOne`, or a sibling module. Same supply-chain rule as NS-01 (no third-party picker package, NS-01-R22; the lockfile and plist are reviewed by `security`).
- Entitlement `com.apple.developer.journal.allow` is added through the Expo config in the one entitlements block (`app.config.ts:260`), not in `_layout.tsx` (the mobile agent never edits boot wiring outside a task that owns it).
- Deployment target is 17.0 (`app.config.ts:44`). The picker needs 17.2 (A3). The control must be absent (not dead) on 17.0 and 17.1, by a native `isAvailable()` that checks the OS version and returns false when the module or API is missing (NS-01-R59 pattern; FR-LCY-31). Raising the target to 17.2 is an alternative the founder can choose; it would drop phones still on 17.0 and 17.1 and the review should say how many (UNVERIFIED; no figure read).
- Photo bytes arrive as a file URL on disk (A4). Copy it into `Caches` under the temporary-copy rule (NS-01-R52), then run the same bake and commit as level 1 and delete the source copy, so one pipeline serves both.
- Android: absent (no Journaling Suggestions equivalent was read). FR-LCY-31 requires saying so on the card.

### 3.4 Apple's own notifications (the "nudge" Apple raises)
- It is Apple's notification, sent by the system, scheduled by Apple (smart or custom schedule in Settings) and tapped into our app only if the parent chose us in Settings, on iOS 26 and later (A6, A7).
- It is not our notification: it does not use our budget (NS-32), our planner or our lock-screen placeholder. We cannot change its text, its volume or its content. The parent controls it in Settings.
- Consequence for NS-32 and the voice rules: a parent may get our one note and Apple's notification the same day. We cannot enforce "one a day" for Apple's. The card must say this plainly, and the nudge copy must not claim "one a day" as a promise about all notifications.
- Cost to adopt: `JSNotificationURLFormat` needs a universal link on our domain (A6). `associatedDomains` exists today only in a sign-in-capable build (`app.config.ts:257`); a build without it would need the domain added, and the website must serve a path for it. Also deep-link handling in `_layout.tsx` (a route that opens Home's picker with the token), which `mobile` may not edit without an owning task.
- Recommendation (Karma to rule, default in section 7): ship level 2 as a parent-initiated button first. Register for Apple's notifications only in a second step, behind the same flag, after a spike on iOS 26 shows the tap lands on a prefilled picker and passes counsel and App Review.

### 3.5 Level 3: library read access (not for 1.x; Q-FD-4) (superseded in part by the 20 Nov addendum, FR-PHS-58 onward)
What it is: PhotoKit read access, full or limited, so the app can decide when to nudge ("photos from Saturday"). Why not now (direction 6.2): children's pictures are the most sensitive content on the phone; a permission changes the label story and the review; background work is limited (A11); a nudge built from what a machine sees adds meaning the parent did not give. Verified facts that sharpen this:
- A permission is a prompt plus a usage string; without the string the app crashes (A9). NS-01-R22 forbids the usage string today, and a scan enforces it.
- Limited access means the app only sees assets the parent selected (A9); a nudge based on it would be partial and could look wrong or random.
- Change observation is for fetched results while the app is alive (A10); a closed app learns nothing. Real "new photo" nudges would need a background task (A11), whose run time the system decides, so a nudge could arrive late or not at all. UNVERIFIED how reliably.
- Even "facts only" metadata (date counts, "photos from Saturday") counts photos by day. That is a count of the parent's pictures, close to "counts of gaps" the content rules forbid (CLAUDE.md content rules), and needs its own wording rule.

Section 6 holds the ADR outline and spike plan.

## 4. Requirements

Priority: P0 with RR-4 reason (a) promise, (b) legal or store duty, (c) core loop; else P1 or P2. Owner lane: `mobile`, `privacy`, `security`, `content`, `design-systems`, `qa`, `founder`, `legal`. "e2e" ids come from `docs/design/e2e/*/DESIGN.md`, which I did not read in this pass, so I write "new screen needed" or the NS-01 state name. Backlog: "new row needed" (no BL id above BL-999).

### 4.1 Level 1: picture-first start made first-class

| Id | Requirement | Links (card rows; e2e; backlog) | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-01 | Given Home with photos on, When it renders, Then "Start from a photo" is one of three equal-weight starts (Speak, Type, picture) in the capture cluster, no larger than Speak, and the one primary action of Home stays Say. A test fixes the count of picture starts at exactly 1 on Home and 0 elsewhere. Design must show whether "picture-first" outranks Type in order | NS-01-R1, R23a; NS-35; new screen needed (Home with photo start, A-S04 family); new row needed | P1 | `mobile`, `design-systems` | NS-01 section 3, direction 6.1 level 1 |
| FR-PHS-02 | Given the founder wants a stronger picture-first Home, When Home shows a picture suggestion strip (NS-50), Then the strip never holds a second start path: every tap lands in the same `startCapture({ source })`, and `source` is one of the closed list (`photo`, `suggestion`) so NS-35-R3 and the navigation test still pass | NS-01-R1; NS-35; NS-50 (proposed); new row needed | P1 | `mobile` | Direction 5 and 6; NS-01-R1 |
| FR-PHS-03 | Given a picture started a letter, When the parent keeps the letter, Then nothing in the letter's data names how it started (no `source` column, no "from suggestion" flag); the start source is in memory only and is dropped at Keep | NS-01-R8, R9b; new row needed | P1 | `mobile`, `privacy` | Direction 6.3; avoids a new L3/L4 field |
| FR-PHS-04 | Given the parent finishes a letter that began from a picture, When Home next shows its reminder note or suggestion strip, Then neither mentions the picture, its subject or its place (the app does not read them for this), unless the parent typed photo words, which the app still does not read | NS-01-R21b, R33; direction 4.2; NS-48 (proposed) | P0 (a) | `mobile`, `content` | Direction 4.2 "never repeats a phrase from the parent's own words" |

### 4.2 Level 2: Journaling Suggestions

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-10 | Given a phone on iOS 17.2 or later, the module present and the flag on, When Home renders, Then a "Pick from recent days" start (words by `content`) is offered inside the picture start (not a fourth start); on iOS 17.0 and 17.1, on Android, in Expo Go and with the flag off it is absent, not greyed | NS-01-R59, R19; FR-LCY-31; new screen needed; new row needed | P1 | `mobile` | A1, A3; `app.config.ts:44` |
| FR-PHS-11 | Given the parent taps the suggestions start, Then the system picker opens in Apple's process, the app asks no permission of its own, no photo or location usage string exists in the plist, and the compiled app calls no PhotoKit authorisation function (NS-01-R2 extended to this module) | NS-01-R2, R22; new row needed | P0 (a) | `mobile`, `security` | A1, A2, A9 |
| FR-PHS-12 | Given the parent picks a suggestion that holds at least one photo or Live Photo, Then the first still is copied from its file URL into `Caches`, stripped and stored by the NS-01 pipeline (R6, R34, R37), the Apple-provided file copy is deleted once read, and the letter starts at Ready with the picture, exactly as level 1 | NS-01-R3, R6, R17c, R52; new row needed | P0 (a) | `mobile` | A4 (file URL); NS-01 |
| FR-PHS-13 | Given a picked suggestion with several photos, Then the app takes none by default and shows the parent each as a choice of one; no photo is stored until the parent chooses | NS-01 section 3 (one picture per letter); new screen needed | P1 | `mobile`, `design-systems` | NS-01 |
| FR-PHS-14 | Given a picked suggestion has a `title` or a `date` range, Then they show only as a label above the picture that the parent can edit or clear, marked in the design as from the phone's suggestion, stored only if the parent keeps the letter, held in the existing editable fields (`photo_text` and the letter date), never prefilled into the letter's words, never used for a prompt, a nudge or Find ranking. Whether a date chip uses `date` is OQ-1 (parent-confirmed only) | NS-01-R8, R9b, R21a, R21b; OQ-1; new screen needed | P0 (a) | `mobile`, `design-systems`, `content` | A4; direction 6.3; constitution |
| FR-PHS-15 | Given a picked suggestion that holds a location, workout, contact, song, podcast, media, steps, state of mind, event poster, reflection, video or any item type not named, Then v1 reads none of those items: the code calls `content(forType:)` only for Photo and LivePhoto; a source scan fails the build if any other `JournalingSuggestion.*` type is referenced in app code | NS-01-R9b, R33 (extend); new row needed | P0 (a) | `mobile`, `security` | A4 (types); direction 6.3 |
| FR-PHS-16 | Given a picked suggestion with no photo item, Then the capture starts without a picture, with one calm line from `content`, and nothing about the other items is kept, shown or logged | NS-01-R17a; new screen needed | P1 | `mobile`, `content` | A4 |
| FR-PHS-17 | Given the parent cancels the picker, dismisses it, or the first-use Apple consent sheet is declined, Then Home is as before (same props, no draft, 0 files), with no message and no retry prompt. Apple's first-use sheet is Apple's; the app never explains or pre-prompts it | NS-01-R4; new screen needed | P0 (a) | `mobile` | A2 (consent sheet once per device) |
| FR-PHS-18 | Given a parent has turned Journaling Suggestions off or restricted types in Settings, Then the picker may show little or nothing; the app handles an empty or cancelled result as Cancel (FR-PHS-17) and adds a "Pick a photo instead" path to level 1 in the same sheet, never an error | NS-01-R2; new screen needed | P1 | `mobile`, `design-systems` | A2 (person controls types) |
| FR-PHS-19 | Given App lock is up or the app goes inactive during the picker, Then a result that returns while locked is discarded with 0 files (NS-01-R47) and no picture shows in the switcher snapshot (R13a) | NS-01-R13a, R47; new row needed | P0 (a) | `mobile` | NS-01 |
| FR-PHS-20 | Given the suggestions path ends in a kept letter, Then the letter holds one stored copy and no suggestion identifier, no title, no coordinates, no workout or contact detail; the export (1.7.0) is byte-identical to a level 1 letter with the same words | NS-01-R14, R15, R26; FR-PHS-03; new row needed | P0 (a) | `mobile`, `privacy` | A4; direction 6.3 |
| FR-PHS-21 | Given the flag `EXPO_PUBLIC_PHOTOS` off, or `killSwitches.photos` true, Then the suggestions start is absent and Erase everything, sweep and Export still handle every picture; one new flag `EXPO_PUBLIC_SUGGESTIONS` may gate level 2 inside level 1's flag and can only narrow it | NS-01-R19; new row needed | P1 | `mobile` | NS-01 section 10 |
| FR-PHS-22 | Given the entitlement `com.apple.developer.journal.allow` is added, Then it is added in the Expo config in the one entitlements block, appears in the signed build only when the suggestions flag is on for that profile (like the sign-in entitlements, which are left out of a build without them), and `security` reviews the plist and entitlement delta before any `production` build (same bar as NS-04 and NS-35-R7) | NS-35; new row needed | P0 (b) | `mobile`, `security` | `app.config.ts:100-114, 250-262`; App Review 2.5.19 (NS-01 section 17) |
| FR-PHS-23 | Given level 2 ships, Then the where-it-lives lines and the privacy policy say, in plain words, that the parent may choose a picture from the phone's "recent days" list, that the list is made by the phone, and that only the chosen picture reaches the app. Counsel reads them before the flag turns on in `production` | NS-01-R32; NX-33 label line; new row needed | P0 (b) | `content`, `legal` | A8; Q43 |
| FR-PHS-24 | Given a Dynamic Type of AX5 and VoiceOver, Voice Control and Switch Control, Then the suggestions start and any choice sheet are 44 pt, labelled with the visible words, and reachable; the system picker is Apple's own and follows system settings | NS-01-R20a to R20e | P1 | `mobile`, `design-systems`, `qa` | NS-01 |
| FR-PHS-25 | Given an iPad (App Review runs the iPhone app there), Then the picker either works or the start is absent; Mac Catalyst ignores the picker (A1), so the app must not render a dead button on any platform where the module reports unavailable | NS-01 section 22 device matrix; FR-PHS-10 | P1 | `mobile`, `qa` | A1 (Catalyst note), A7 (iPadOS 26) |

### 4.3 Apple's nudge (second step of level 2; behind the spike)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-30 | Given the founder wants Apple's suggestion notifications to open Early Letters, When the spike passes on a real iOS 26 phone, Then the app adds `JSNotificationURLFormat` with a universal link on the brand domain (from `packages/brand`, never typed), a route that parses the id (empty for a general reminder), and opens the picker prefilled with the token | new card row needed; NS-32 note; new row needed | P2 | `mobile`, `security` | A6, A7 |
| FR-PHS-31 | Given the app is the chosen "Open Notifications With" app or not, Then nothing in our UI claims we send these notifications, claims how many arrive, or changes our own budget; if the app reads `JournalingSuggestionsConfiguration.notificationSchedule` it shows the setting's value only on the Me "reminders" page, in the parent's terms, and never alerts on it | NS-32-R1; NS-13; new screen needed | P1 | `content`, `mobile` | A6 (read-only configuration); direction 4.1 |
| FR-PHS-32 | Given our reminder notification and an Apple suggestion notification could land the same day, Then our NS-32 budget counts only ours, the Me reminders page says in one calm line that the phone's own journal suggestions are separate and can be turned off in Settings (if the app is the chosen app), and no document states "one notification a day" as covering Apple's | NS-32-R1; NS-13; new screen needed | P1 | `content`, `product` | A6; NS-32 |
| FR-PHS-33 | Given the Apple notification tap lands in the app, Then the universal link handler never logs the suggestion id, never stores it, and drops it after the picker returns; the id counts as L3 for log purposes (it identifies a moment in a person's life) | NS-01-R51; new row needed | P0 (a) | `mobile`, `privacy` | A6; direction 6.3; NS-01-R51 pattern |
| FR-PHS-34 | Given the build has no associated domain (a build without sign-in), Then JSNotificationURLFormat is not added and the app does not appear in Apple's setting; a build never ships a key whose link the website does not serve | `app.config.ts:257`; new row needed | P1 | `mobile`, `ops` | A6; `app.config.ts` |

### 4.4 Level 3: library read access (behind a flag that ships off) (superseded in part by the 20 Nov addendum, FR-PHS-58 onward)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-40 | Given any production, preview or testflight build in the 1.x line, Then there is no photo-library usage string, no PhotoKit authorisation call, no `PHPhotoLibrary` fetch or observer, no background mode for fetch or processing, and no MediaLibrary or camera package; the existing source and lockfile scans (NS-01-R22, R33) stay green and cover new folders | NS-01-R22, R33; NX-39 R27 (stays closed); new row needed | P0 (a) | `mobile`, `security` | A9; Q-FD-4, Q-FD-6 (keep closed) Superseded in part by FR-PHS-58 on 20 Nov. |
| FR-PHS-41 | Given the founder asks for a level 3 spike, Then it runs only on a branch `exp/photos-library-nudge`, on a development build signed to test devices, against a throwaway library of fictional Asha pictures, with the flag off in every EAS profile and a test that fails any release profile that enables it; no real family picture is used in any test, run sheet or screenshot (ruling D13) | NS-01-R62; new row needed | P0 (a) | `mobile`, `qa` | Direction 6.2; D13 Superseded in part by FR-PHS-58 on 20 Nov. |
| FR-PHS-42 | Given the spike, Then its output is a decision record, not a feature: what the app can and cannot know, reliability of background delivery, battery, App Review notes and label change, and counsel's reading. No nudge text is written until the ADR is accepted | new ADR; new row needed | P1 | `mobile`, `privacy`, `security` | Direction 6.2 |
| FR-PHS-43 | Given any future nudge derived from the library, Then it carries only facts the parent can verify ("photos from Saturday" counts or dates), never faces, scenes, places or people, never a count of "missing" days, and never a comparison; the wording rule is decided by `content` and the founder before any build (see 3.5: a count of pictures by day is close to a count of gaps) | CLAUDE.md content rules; direction 4.2 | P0 (a) | `content`, `product` | Direction 6.2; CLAUDE.md Superseded in part by FR-PHS-64 on 20 Nov. |
| FR-PHS-44 | Given a parent whose library access is limited or denied, Then no screen of ours shows a prompt about it, a "grant access" nag or an error; level 1 and level 2 work identically | NS-01 section 5 last row; A9 | P0 (a) | `mobile`, `design-systems` | A9 Superseded in part by FR-PHS-59 on 20 Nov. |

### 4.5 Data, security and privacy rows

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-50 | Given the data inventory, Then it adds three transient rows and no persistent one for level 2: (1) the suggestion file copy in `Caches` (L4, deleted once read, swept at launch, deleted by Erase everything, never logged, never synced, not in export); (2) the in-memory `title` and `date` (L3 if it names a place or event; memory only until the parent keeps them as `photo_text` or letter date, which are already L4 and L2); (3) the in-memory suggestion id on the notification path (L3, FR-PHS-33). `privacy` confirms classes in the same PR | NS-01 section 11; DATA_CLASSIFICATION; new row needed | P0 (a) | `privacy` | NS-01 section 11 |
| FR-PHS-51 | Given the log canary (J-N18 pattern), Then a canary suggestion title, a canary place name and a canary workout name pass through the module and produce 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs | NS-01-R51; new row needed | P0 (a) | `mobile`, `qa` | NS-01-R51; direction 2 |
| FR-PHS-52 | Given a stored picture, Then it is not marked as "from the phone's suggestion" in any table, file name, Exif remnant or export field; a test compares a level 1 and a level 2 picture of the same input and finds no distinguishing byte except pixel content | NS-01-R6, R14; FR-PHS-20 | P0 (a) | `mobile`, `security` | A4 |
| FR-PHS-53 | Given the Apple suggestion file URL, Then the app accepts it only if it is a regular file readable by the app in the location Apple provided, with a type from the NS-01 allowlist (JPEG, HEIC, HEIF, PNG), under the canvas cap, and refuses symlinks and paths outside the returned container; it does not trust the file's name or extension | NS-01 section 13 (paths from JavaScript, crafted image) | P0 (a) | `mobile`, `security` | A4 (file URL); NS-01 threats |
| FR-PHS-54 | Given the privacy label, Then the label effect is stated for level 2 as "no change while only the chosen picture reaches the app and it never leaves the phone", re-read if the Journaling Suggestions entitlement changes the label questions in App Store Connect; counsel must confirm | NS-01 section 18; app-store-privacy-labels.md | P0 (b) | `privacy`, `legal` | privacy.md S1 (on-device is not collected); A8 Superseded in part by FR-PRV-36 (privacy.md) on 20 Nov. |
| FR-PHS-55 | Given App Review, Then the review notes name the entitlement, say the picker is Apple's own and returns only the picture the parent chooses, say no photo-library permission is requested, and give a reviewer path (Home, "Pick from recent days"); counsel must confirm 5.1.1(iii) treatment (out-of-process picker preferred, per the privacy review's reading of App Review Guidelines) | NS-01 section 17; new row needed | P0 (b) | `legal`, `mobile` | privacy.md S2 (secondhand); A2 |
| FR-PHS-56 | Given the Apple Developer Program License Agreement section that A2 points to for suggestion data, Then counsel reads it and records any duty (for example on retention or use) before the flag turns on; `mobile` adds a test for each testable duty | new counsel number needed | P0 (b) | `legal` | A2 (not read by me) |
| FR-PHS-57 | Given a child's picture and a picture showing another adult arrive through level 2, Then nothing differs from level 1 (counsel Q45, Q48); no face, scene or person detection is added (NS-01-R33 scan extended to the suggestions module) | NS-01-R33; Q45, Q48 | P0 (a) | `privacy`, `security` | NS-01 section 17 |

## 5. Proposed card NS-49: picture-first start and suggestions

Status: proposed by this review, for Karma to rule. Reopens nothing locked: it extends NS-01 and sits beside NS-35 and NS-32; level 3 stays closed (Q-FD-6). Names stay internal; `content` names what a parent reads.

**Who and when.** A parent with a picture of {child} on the phone, or who does not know what to say and would like the phone to show them recent days to choose from.
**Job.** "I start from what happened, not from a blank page, and the words stay mine."
**What.**
1. Picture-first is one of the three equal starts on Home (FR-PHS-01); level 1 stays as built.
2. "Pick from recent days" inside the picture start opens Apple's picker on iOS 17.2 and later (FR-PHS-10 to 12). The parent picks; the app receives only the chosen photo (FR-PHS-12), plus an editable label (FR-PHS-14).
3. A Home strip tile "a picture suggestion" is NOT a nudge from library reading. It is a button that opens the picker (NS-50 owns the strip); it shows only when level 2 is available and the parent has not turned it off.
4. Optional second step, behind a spike: Apple's own suggestion notification may open the app on iOS 26 and later (FR-PHS-30 to 34).
**Not in scope.** Library permission or any PhotoKit read (level 3, closed); places, workouts, contacts, music, mood from a suggestion; several pictures per letter; any caption, title or summary we write; any count of pictures; any nudge built from pictures; Android; Share of the picture.
**Happy path.** Home, "Start from a photo", "Pick from recent days", Apple's sheet (first time: Apple's consent sheet), the parent chooses one suggestion, one photo (if several, chooses one), Ready shows the picture and an editable label, the parent speaks or types, Review, Keep.
**Edge and failure.** Cancel, empty list, suggestion with no photo, several photos, iOS 17.0 or 17.1, Journaling Suggestions off, App lock during the pick, offline, full phone, Live Photo, an iCloud-only photo (whether suggestion files are local is UNVERIFIED).
**Free or Plus.** Free and ungated, as NS-01 (ruling T2).
**Acceptance rows.** FR-PHS-10 to 25 become NS-49-R1 to R16; FR-PHS-30 to 34 become NS-49-R17 to R21 (P2, behind the spike); FR-PHS-50 to 57 are the data, label and review rows.
**Door lines (PRIV-R21).** Picking is an act, not an agreement.
- **Shown:** Apple's own picker and Apple's one-time consent sheet; above the start, at most one sentence from `content` once counsel clears it: the phone chooses which recent days to list; only the one you pick comes to the app.
- **Records:** nothing about the act. The stored copy is as NS-01.
- **Never:** reading any suggestion the parent did not pick; reading places, workouts, contacts, music, mood or steps; the photo library; location; faces or scenes; background reads; upload; a donation to Spotlight, Siri or App Intents (D3); writing a caption or entry start from a suggestion.
- **Decline:** Cancel in Apple's sheet; or "Not now" on Apple's consent sheet. Level 1 stays.
**Label effect.** None while only the chosen photo reaches the app and stays on the phone (FR-PHS-54; counsel must confirm).
**Claims.** Enables: "Pick a picture from your recent days, then say what you want to say." Forbids: "we find your best moments", "we suggest", "smart", "AI", "memories", "your photos, organised", any count.
**Measures.** As NS-01 section 21: tester sheet, five parents, "x of n". New fixed question: "Did you start a letter from the recent-days list this week? (yes or no)". Pass line proposed: 3 of 5 try it without help and 0 of 5 say it felt like the app reading their photos.
**Gates.** NS-01 shipped on `preview` first; entitlement enabled on the App ID; `security` plist and entitlement review (FR-PHS-22); counsel on the label line and the DPLA (FR-PHS-54, 56); founder word approval; device runs (7).
**Dependencies.** NS-01 (stack merged), NS-35, NS-32 (for 4 above), NS-50 (strip).

## 6. Level 3: ADR outline and spike plan (behind a flag that ships off)

### 6.1 ADR outline (ADR number to be assigned by `architect`; draft title "Library-derived nudges")
1. Context: founder asks for nudges from the photo library (direction 6, Q-FD-4); NS-01 "never read a picture the parent did not pick"; NX-39 R27 closed.
2. Decision drivers: trust with a parent of a baby; the constitution (no machine adds meaning); label and review exposure; battery and reliability; no streaks or gap counts.
3. Options: A. Do nothing beyond level 2. B. Level 2 plus Apple's notification (iOS 26). C. Limited-library read access, foreground only (read when the app opens, no background). D. Full or limited read access with a background refresh task. E. A Photos library extension or a share target.
4. Facts used: sections 2 and 3.5 of this review.
5. Recommendation: B for 1.x; C only as a spike; D and E rejected for 1.x.
6. Consequences: usage string, label review, new plist keys and background modes (D), App Review notes, test plan, kill switch, counsel questions.
7. Reversal: flag off, string removed, files and rows unaffected (nothing is stored).

### 6.2 Spike plan (SP-PHS-1; branch `exp/photos-library-nudge`; no merge to `develop`)
| Step | What | Output | Stop if |
|---|---|---|---|
| 1 | Enable the Journaling Suggestions capability on a test App ID; note whether Apple asks for a request or approval | Answers 2.1 row 1 | Approval is refused or needs a business case we cannot give |
| 2 | Build the level 2 picker module on iOS 17.2 and 26; log (to the screen only, never to disk) which item types arrive for a fictional Asha library | Types and file formats; whether the photo file carries Exif location; whether Live Photo gives a still | Anything arrives that was not chosen |
| 3 | iOS 26: add `JSNotificationURLFormat` on a test domain; check the tap path with an empty and a real id | Whether our app appears in "Open Notifications With" and the token path works | The domain or associated-domain cost is too high for this build |
| 4 | Foreground-only PhotoKit read on a throwaway library with limited and full access: what "recent photos" can honestly say | A list of facts the app could state without inference | A fact needs faces, scenes or places |
| 5 | Background refresh test on a development build: delivery delay over 7 days, Low Power Mode, force quit | Reliability table | Delivery is unreliable (we would nudge late or never) |
| 6 | Counsel and `security` read | Written readings | Any "no" |
| 7 | ADR accepted or rejected by the founder | Decision | Reject: delete the branch |

All data are fictional Asha pictures; no real family picture anywhere (D13; `no-real-family-data` test).

## 7. Founder or counsel questions (with defaults)

| Id | Question | Default |
|---|---|---|
| Q-PHS-1 | Do we want level 2 in the first photo release or after NS-01 reaches `testflight`? | After NS-01 on `testflight`; the picture flow is proved first CLOSED 20 Nov, see GAP-LOG Closures CL-037 |
| Q-PHS-2 | Raise `IOS_DEPLOYMENT_TARGET` from 17.0 to 17.2, or hide the suggestions start on 17.0 and 17.1? | Hide it (keep 17.0). Raising drops phones; no figure read CLOSED 20 Nov, see GAP-LOG Closures CL-037 |
| Q-PHS-3 | Does the Journaling Suggestions entitlement need an Apple request? | `mobile` enables it on the test App ID in step 1 of the spike and reports; if it needs approval, `founder` files it FOUNDER-ANSWERED 20 Nov, default accepted (CL-042): Same as Q-FD-11. Decision made, action pending founder hands: Apple entitlement request if the portal needs one |
| Q-PHS-4 | Apple's notifications (iOS 26 and later) open our app: yes, in a second step, or never in 1.x? | Second step, after the spike; not in the first level 2 build CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Q-PHS-5 | May the suggestion's `title` appear as an editable label above the picture? | Yes, as Apple's text, editable and clearable, never prefilled into the letter's words (FR-PHS-14) CLOSED 20 Nov, see GAP-LOG Closures CL-035 |
| Q-PHS-6 | Do we ever read a place, workout or other item from a suggestion? | No in 1.x CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Q-PHS-7 | Level 3 spike: run it at all? | No now. If yes, section 6 only; Q-FD-4's default stands CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Counsel (new, needs a number from legal) | (a) The Developer Program License Agreement duties on suggestion data (A2 links to it; not read). (b) Whether using the picker changes the Apple privacy label or App Review notes (5.1.1(iii)). (c) Whether the wording above the picker counts as a notice under any law the packet lists. (d) Level 3: a library permission for a child's pictures (COPPA-style readings; the privacy review's S5 says a child's image is personal information when collected online; we collect nothing today) | Counsel must confirm; defaults as above |
| Existing numbers | Q43 (label line and where-it-lives), Q45 (child's image), Q48 (picture of another adult), Q54 (Photos or Videos become collected if pictures sync) | Unchanged |

## 8. Design needs

| Need | Key |
|---|---|
| Home: the picture start with a "Pick from recent days" choice inside it (light, dark, AX5 on SE 3), absent on 17.0 and 17.1 | new screen needed (Home, A-S04 family; NS-01 section 15 states extend) |
| One-choice sheet when a suggestion holds several photos | new screen needed |
| Ready with a suggestion label (title, date) that reads as Apple's text, editable, clearable | new screen needed; extends NS-01 Ready with a picture |
| Suggestion with no photo: one calm line, picture-less letter | new screen needed |
| Empty or cancelled picker, Journaling Suggestions off: "Pick a photo instead" | new screen needed |
| Me reminders page: one calm line about the phone's own journal suggestions being separate (FR-PHS-32) | new screen needed (D area: reminders) |
| Home strip tile for the picker (NS-50) | owned by NS-50 |
| Words: all lines by `content`, none implying the app finds, chooses, writes or understands a picture; banned: memory, moment, album, best, caption, AI, smart, suggested for you | `content` |

## 9. Engineering needs (rows to add; no id above BL-999)

1. New row: `scribe-photo` suggestions module (SwiftUI picker in a hosting controller, `isAvailable()` by OS version, `pickSuggestion()` returning one photo URL copy, label title and date; no other item type read). Owner `mobile`. Blocks FR-PHS-10 to 20.
2. New row: Expo config entitlement `com.apple.developer.journal.allow` behind `EXPO_PUBLIC_SUGGESTIONS`; `security` plist and entitlement review. Owner `mobile`, `security`.
3. New row: source scan test that bans any `JournalingSuggestion.*` type other than Photo and LivePhoto and any PhotoKit authorisation, fetch or observer call (extends NS-01-R22 and R33). Owner `mobile`.
4. New row: log canary extension (FR-PHS-51). Owner `qa`.
5. New row: `startCapture` `source` closed list gains `suggestion` (FR-PHS-02); the source is never persisted (FR-PHS-03). Owner `mobile`.
6. New row: spike SP-PHS-1 and an ADR (section 6). Owner `mobile`, `architect`.
7. New row: privacy and data rows (FR-PHS-50), claims inventory row, App Review notes (FR-PHS-55). Owner `privacy`, `legal`, `content`.
8. Planner change for NS-32: none for level 2. Apple's notification is not scheduled by our planner (`planner.ts` kinds stay `evening`, `monthAge`, `birthday`, line 106).

## 10. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-01 section 3 | Add one line: "A picture can also come from the phone's recent-days list (NS-49); the same one picture, same pipeline." | Keeps one pipeline and one stored-copy rule |
| NS-01-R22 | Extend the "only source" wording: the system picker or the Journaling Suggestions picker, both out of process, one still returned; no library access in either | R22 as written lists only the iOS system picker |
| NS-01 section 12 | Add the suggestions picker to the Shown line and keep "Never: ... location" | Door lines must name every door |
| NS-32 | Add a note: Apple's suggestion notifications (iOS 26) are the system's, outside the budget and outside our control | Direction 4.1 promise "one a day" must not be read to cover them |
| NS-35 | Add `suggestion` to the closed list of start sources if the founder rules level 2 in | Navigation test N3 |
| Direction 6.1 table | Replace "needs a special entitlement" with "needs the Journaling Suggestions capability (A3); whether Apple approves it separately is UNVERIFIED" and add "iOS 17.2 and later; our target is 17.0" | Two facts the direction left open |
| Direction 6.1 notes | "Not read: whether Apple's suggestion notifications can open our app" is now read: yes on iOS 26 and later, only if the parent chooses our app in Settings and the app carries a universal link (A6, A7) | Closes a stated gap |
| NX-39 R27 | Keep closed for level 3; open a narrow exception only for the chosen-picture picker (level 2), which reads nothing the parent did not pick | Q-FD-6 default |

## 11. What this review found, in order

1. Level 2 is possible without a permission and fits the constitution if the app reads only the chosen photo (A1, A2). It is a SwiftUI-only picker (A1), so it needs our own Swift code in an Expo module; no package does it for us (not searched on npm).
2. Our deployment target (17.0) is below the picker's minimum (17.2): the start must be hidden on 17.0 and 17.1, or the target raised.
3. Apple's suggestion notification can open our app, but only on iOS 26 and later, only if the parent chooses us in Settings, and only with a universal link (A6, A7). Those notifications are Apple's, so our "one a day" budget does not cover them; the copy must not promise it does.
4. The picker can hand us places, workouts, contacts, music, mood and steps (A2, A4). Reading any of them breaks "never used for a nudge" in spirit and enlarges the label and review story; the review recommends reading photos only, with a scan that fails the build otherwise.
5. Level 3 has no verified safe path for 1.x: a library permission, limited access that sees only parts of the library (A9), no event feed for a closed app (A10), background work the system schedules (A11), and a count of pictures per day that sits close to a gap count. Keep it closed; spike only on a branch.
6. Whether Apple's entitlement needs approval is not answered by the documentation I read; it is the spike's first step.

## 12. Totals

Requirements: 38 (FR-PHS-01 to 04, 10 to 25, 30 to 34, 40 to 44, 50 to 57). P0: 23; P1: 14; P2: 1. Proposed card: NS-49 (one). Card changes proposed: 8. Questions: 7 founder plus 4 counsel items. UNVERIFIED items: 8 (entitlement approval, Exif in the suggestion photo, Live Photo still, DPLA text, background reliability, iOS 17.0 and 17.1 share, iCloud-only suggestion photos, npm packages).

I did not commit, push or edit any other file.

## Addendum 20 Nov 2026: photo moments and pictures and videos

Status: draft for Karma. Source: `../26-founder-direction-photos-library-and-media.md`. This supersedes section 3.5 and 4.4 where they say level 3 is closed in 1.x (founder direction, RV-18 in GAP-LOG). Cards: NS-51 Photo moments (level 3) and NS-52 Pictures and videos with a letter (card file 27 not on disk; row ids pending). Privacy, label, deletion: `privacy.md` addendum; store rules: `compliance.md`; storage and media threats: `risk-security.md`. Not repeated. Claude role.

### 1. What was read this session and what was not

Read 20 Nov: Apple, Delivering an Enhanced Privacy Experience in Your Photos App (A9 above; re-read), https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md. Not obtained: Apple's pages for `PHPickerConfiguration`, `PHPickerFilter`, `PHPickerResult`, `PHAsset`, `PHImageManager`, `PHAssetResource` (fetches failed or returned a JavaScript shell). A summary the fetch tool wrote "from general knowledge" is not Apple text and is treated as UNVERIFIED below.

Verified (A9): the system picker runs in a separate process and needs no authorisation; PhotoKit features (assets, collections) need explicit authorisation and a purpose string, and accessing the library without one crashes the app; make PhotoKit calls on a direct user action, not at launch; limited library since iOS 14 lets the person share specific assets and "your app can only access these assets"; with limited access you cannot create or fetch user albums; `authorizationStatus(for:)` is needed to see `limited` (the old call returns `authorized`); the system prompts to update the limited selection once per app life cycle unless an Info.plist key suppresses it, and the app presents `presentLimitedLibraryPicker(from:)` itself (iOS 15 and later adds a callback with local identifiers); changes are observed through the standard change observer.

### 2. Level 3 in depth (NS-51)

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-58 | Given the parent taps "turn on" on our own screen, Then the first PhotoKit call is `requestAuthorization(for: .readWrite)` or the narrowest read level the SDK offers (UNVERIFIED which; the add-only level is not enough to read); never at launch, in first run or from a push; the result `limited`, `authorized`, `denied` and `restricted` each have a state; `denied` and `restricted` show no nag | NS-51; FR-PRV-37, 38; FR-PHS-44 | P0 (a) | mobile | A9 |
| FR-PHS-59 | Given limited access, Then the app works with the chosen set only; "Choose which pictures" opens `presentLimitedLibraryPicker`; the automatic prompt is suppressed by the Info.plist key; album choices are absent (limited cannot fetch user albums); the change observer updates moments only while the app is alive | NS-51; Q-PM-1 | P0 (a) | mobile | A9 |
| FR-PHS-60 | Given the moments pass, Then the only fields read are creation date and media type (image or video), per Q-PM-5 and Q-PM-6 defaults (no place, no faces, no content class, no filename, no album name unless the parent picked albums in full access); a moment is a day or a few hours with several items, or a day around a birthday, month age or a day the parent marked (NS-46); a source scan allows these fields and fails others (`location`, `mediaSubtypes`, `PHAssetResource` names, Vision) | NS-51; FR-PRV-40; FR-PHS-43 | P0 (a): no machine adds meaning | mobile | founder direction section 2 |
| FR-PHS-61 | Given the moments pass runs, Then it runs in the foreground when the app opens or the capture area is shown, in a bounded query (date window and count cap), off the main thread, and never as a background task, fetch mode or push; no background mode is added (FR-PHS-40 originally forbade it; this keeps that part). A moment is not "new photos arrived" and the app does not promise to notice them; a nudge uses the planner's existing slot and budget (NS-32) only | NS-51; NS-32; A10, A11 | P0 (a) | mobile | A10, A11 above |
| FR-PHS-62 | Given a "day" boundary, Then days use the device calendar and time zone at read time; fixtures cover a photo near midnight, a time-zone change, daylight-saving days and a picture whose stored date is wrong; a failed grouping shows nothing rather than a wrong day (how Apple stores a creation date and zone is UNVERIFIED) | NS-51; FR-PHS-20 | P1 | mobile, qa | not read |
| FR-PHS-63 | Given the moments index, Then it holds only date, count and the library item identifiers needed to show the pictures again; it holds no thumbnail, no filename and no hash; it is rebuilt from the library, never exported or synced; a library item that disappears is dropped silently; turn off or revoke deletes it (FR-PRV-39) | NS-51; FR-PRV-39 | P0 (a) | mobile | A9 (identifiers) |
| FR-PHS-64 | Given the moment card in capture, Then it shows the parent's own pictures, a plain invitation from `content`, "Not now" with equal weight, a pause; it never writes, suggests or pre-fills words; it never says what a picture shows; Home and the slip never count moments (no "you have 40 unwritten days"); Journaling Suggestions (level 2) stays a separate parent-started path | NS-51; constitution; NS-49 | P0 (a) | content, mobile | founder direction section 1 |
| FR-PHS-65 | Given the parent starts a letter from a moment, Then the chosen pictures are read through PhotoKit with the app's permission, copied into the app's own storage through the NS-01 pipeline (type allowlist, strip, canvas cap; R6, R34, R37) and the library original is never changed or deleted; the capture shows what was chosen and the parent can remove any | NS-51; NS-52; NS-01 | P0 (a) | mobile | NS-01 [F] |

### 3. Attach media in depth (NS-52)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PHS-66 | Given "Add pictures or videos" without permission, Then the system picker is used (multi-select within the card's limits; proposed default 6 pictures and 2 videos, founder confirms), a result is handled as a file the app copies at once, and no library identifier is kept. The exact picker settings for a type filter, selection limit and asset representation are UNVERIFIED (Apple pages not obtained); the spike records them | NS-52; Q-PM-2; NS-01-R22 (superseded in part: multi-select and video allowed behind NS-52's flag) | P0 (a) | mobile | A9 (picker supports "multiple selection of photos and videos") |
| FR-PHS-67 | Given a picture or video held only in iCloud, Then the app does not freeze: it shows progress and a Cancel, never downloads on a cellular connection without the parent's setting (default follows the phone's setting; UNVERIFIED how PhotoKit exposes it), and a failed download keeps the letter and says one calm line; no library original is changed. Behaviour of the picker versus PhotoKit for iCloud-only originals is not read | NS-52; reliability addendum | P0 (c) core loop must not hang | mobile | not read |
| FR-PHS-68 | Given HEIC, a Live Photo, a burst or a screenshot, Then HEIC is accepted and re-encoded by the NS-01 pipeline; a Live Photo is stored as its still (default) with the video part dropped unless the parent attaches it as a video; no other special handling; test fixtures are synthetic Asha files. How a Live Photo's still and motion are returned by the picker is UNVERIFIED | NS-52; NS-01-R6; FR-PHS-53 | P1 | mobile | A4 (Live Photo is separate from Video) |
| FR-PHS-69 | Given a video, Then duration and byte caps (proposed 60 seconds, a size cap) are checked before copy; the video is kept as the parent chose or re-encoded once on the phone (which, UNVERIFIED), its container metadata handled per `risk-security.md` FR-SEC-30; a poster frame is made on the phone; the sound is kept and not transcribed (FR-PRV-47); video is never printed | NS-52; Q-PM-2, Q-PM-4 | P0 (a) | mobile | founder direction section 2 |
| FR-PHS-70 | Given a letter with media, Then each item has no machine caption; alt text is the parent's own words or none; VoiceOver says "Picture 1 of 3" or "Video 1 of 2, 45 seconds" and never describes content | NS-52; NS-49-R30 | P0 (b) | mobile, design-systems | NS-49-R30 [F] |
| FR-PHS-71 | Given the first media letter, Then NS-01's rule "a letter holds one picture" is replaced by the card's limits, and order is the parent's; removing an item deletes its file; Export, Erase, letter delete and Find handle each (Find indexes only the parent's words) | NS-52; NS-01; NS-02 | P0 (a) | mobile | NS-01 [F] |

### 4. Existing requirements changed (pointers added in place)
FR-PHS-40 (no usage string or PhotoKit call in 1.x: now per profile and per flag), FR-PHS-41 and FR-PHS-42 (spike and ADR stay as gates for the card, not a reason to withhold it), FR-PHS-43 (wording rule decided in FR-PHS-64), FR-PHS-44 (permission now exists; the no-nag rule stays), FR-PHS-54 (label row per variant). Section 3.5 heading says "not for 1.x" and is superseded by this addendum.

### 5. Design needs
New screens: turn-on explainer, limited-library row, moment card, media tray, video limit sheet, iCloud progress, media absent on this phone. Keyed to NS-51 and NS-52; area A (capture) and C (Me). Words by `content`; Asha images only.

### 6. Engineering needs
Native module additions to `scribe-photo` (read, copy, strip, poster frame) in their own PR (FR-SEC-14); `exp/photos-library-nudge` spike extended to the questions marked UNVERIFIED; JS stand-in with Asha fixtures; plist and flag per profile; scan updates (allow date and type only).

### 7. Questions (who answers; default)
| Id | Question | Who | Default |
|---|---|---|---|
| Q-PHS-8 | Q-PM-1: limited library or full read by default | Founder | Limited-first; full only if the parent picks it; works with limited CLOSED 20 Nov, see GAP-LOG Closures CL-044 |
| Q-PHS-9 | Is a Live Photo attached as a still only | Founder | Yes CLOSED 20 Nov, see GAP-LOG Closures CL-044 |
| Q-PHS-10 | Does cellular download of iCloud originals need a setting | Karma | Follow the phone's own setting; decide after the spike CLOSED 20 Nov, see GAP-LOG Closures CL-044 |
| Q-PHS-11 | Do screenshots count toward a moment | Founder | Not filtered (no subtype read) CLOSED 20 Nov, see GAP-LOG Closures CL-044 |

### 8. Cannot assess yet
Everything marked UNVERIFIED: picker options for types and limits; the representation the picker returns for video and Live Photo; how iCloud-only originals and download progress are exposed; creation-date and time-zone semantics; whether a re-encode is needed to cap video size; the real battery and time cost of a library query; whether the limited-library callback is reliable enough for moments. Not run: no device, no Photos library, no spike.
