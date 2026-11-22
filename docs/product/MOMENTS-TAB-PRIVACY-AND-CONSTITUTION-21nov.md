# Moments tab: privacy and constitution read (21 Nov 2026)

Status: PROPOSED. Docs only. Nothing here is built, decided or recorded in `DECISIONS.md`.
Owner: `privacy`. Written for the founder, `product`, `mobile`, `design` and counsel.
Nothing here is legal advice; every legal or store reading is "counsel must confirm".
Fictional family Asha only. The founder's reference screenshots are not in the repo and are described only in general terms: no names, places, faces or venues appear here.

## Reconciliation at 22 Nov 2026 (read this first)

Status of this file: PROPOSED, and partly superseded. This section was added on 22 Nov against `develop` (head `86eccfa0` for the original read; reconciled with `origin/develop` on 22 Nov). I decided nothing and invented no privacy position. Each row below only points at a ruling already on `develop`. Where the ruling and the body of this file differ, the ruling wins and the body text is history. Counsel has not read any of it, and nothing here is legal advice.

| Part of this file | Now | Ruling and where it is |
|---|---|---|
| Section 0 line 6, section 11 and the tab-position talk (default, second, centre; "a fourth tab reverses IA-FINAL") | SUPERSEDED. Tab order is Home, Moments, Book, Me, and Home is the landing tab. The tab name is Moments (D-164, #1281). Council ruling, not the founder's words | D-165 item 3 (`docs/DECISIONS.md`); PRD 28 |
| Section 6 rows on "the tab ships after 1.0" and "default tab asks on first screen" | SUPERSEDED on timing. The first release of Moments includes the library read (Route B). The K-02 point still holds: no ask before the first saved letter, and Home is the landing tab, so no library doorway is on the first screen | PRD 28 RV-17 and the founder's ruling quoted there; D-165 item 3 |
| Sections 2 and 4, Route A as the way to learn from the screenshots | SUPERSEDED as the lead route. Route B ships first. Route A stays a later optional door, with only picture and video items kept and every other item type dropped at the boundary. My "Route B first" default for CQ-8 matches | PRD 28 RV-17, NS-53-R82, H-3 |
| Sections 4 and 5, "no machine place, no map tile" and Never "a venue or street name from a lookup" | SUPERSEDED as a recommendation. Places and special occasions are in, through the place pipeline in PRD 28 section 7a.1, with release gate G8 on the data flow and no map tile unless the gated adapter ships. What I could not verify about Apple's geocoder (section 5) is still unverified and is exactly what G8 and counsel must settle. My coordinates-leave-the-phone concern is not withdrawn | PRD 28 RV-18, NS-53-R16, NS-53-R37, NS-53-R43 (the founder: "Places. Special occasions etc all are part of it.") |
| Section 4, "no title from us" and "never a name" | STANDS. PRD 28 keeps no machine title, caption, person or scene on a card; a date label is a pure function of one timestamp | NS-53-R16, section 2.2 of PRD 28 |
| Section 10, analytics ("opt-in analytics included") | Corrected in place. Analytics is for every user under D-163 and is off in production until its gates close. The point stands: no event or property may mark a nudge as moment-driven | D-163; CPrivO-15 (consent and id are per person) |
| Section 3, label stays "Data Not Collected" for Photos or Videos | NARROWED. No whole-app "Data Not Collected" claim while Moments exists. A per-type "Photos or Videos: not collected" line is held until APPLY file 33 is applied and counsel reads it. While `EXPO_PUBLIC_PHOTOS` is off, every 1.0 surface says nothing about pictures | CPrivO-10, CPrivO-12 (`docs/agents/exec/RULINGS.md`) |
| Sections 7 and 10, ask and notification permission placement | CONSISTENT. Ask on the parent's tap, after the first saved letter, with a no-permission fallback | D-165 item 5 ("Not now" on the card), PRD 28 permission rows; CPrivO-9 |
| Section 10, the neutral local nudge wording | The lock-screen body for day, month-note and birthday reminders is the neutral "Whenever you have a minute." (PROPOSED wording, with names off by default). Nothing in a notification names a kind of day, a child, an age or a picture. My points 2 and 3 (no place, count or library identifier in a payload) fit this. My point 5 (identical-words form) is not ruled on | CPrivO-9 |
| Section 6 and CQ-1, "reversal of BL-1305" | Pointed at conditions. Before `EXPO_PUBLIC_PHOTOS` is on in any store build, the twelve-row table must be green, including the closed bucket migration, deletion and export of pictures, and two lens reviews. Whether and when photos ship is the founder's | CR-146 |
| Pending picture on an account switch (not in this file) | Add to the Never list: a chosen but unkept picture is discarded on every change of the signed-in person | CPrivO-11 |

Still open and not decided by any ruling I read: CQ-2 to CQ-5 and CQ-8 to CQ-15 (counsel); whether showing a nudge whose timing comes from library metadata is acceptable (CQ-11, CQ-12; PRD 28 and NS-51-R11 carry the neutral form); the engagement claim (not measured). The value-prop pair in D-165 item 1 is unpublished until counsel answers packet Q130; this file does not use it.

Proposed edit for the founder to own, not made here: if a reader needs one list of what is superseded, `product` can fold this table into PRD 28 section 6 (reversals). I did not edit PRD 28 (not my file).

## 0. What was asked, and the short answer

The founder (20 Nov, verbatim): "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word." And later: "The default tab can be showcasing value props nicely and if not given permission for your photos then get that permission. If you gave them show relevant things like screenshots I provided."

Reading of the direction: a new tab, which is also the default landing tab. It lists recent days built from the parent's pictures (a collage, a place on a map tile, a machine-made title with names, a small compose button), with a Recommended view of prompt cards, a "year ago" highlights card, video clusters, a music tile and a mood card. Without photo permission, it explains the value and asks for the permission.

Short answer, in five lines:
1. Route A (Apple's own suggestions picker) needs no library permission and is the lowest-risk way to learn from the screenshots, but Apple draws the sheet, so we cannot restyle it, and it needs an entitlement plus counsel and store checks that no 1.x build has today.
2. Route B (our own on-device read with PhotoKit, limited access honoured) can show days, time ranges, thumbnails in time order and video lengths without breaking the constitution. It cannot show a machine title, a place, people names, music or mood.
3. The place name on a map tile is the one element that almost certainly sends coordinates to Apple. Safer: no place, or a place the parent types.
4. The new direction reverses several standing rulings (section 6). Each is a reversal the founder must own; this document does not treat any as decided.
5. "Ask for permission if not given" can only mean: explain, then one ask on the parent's tap, with a working path for a parent who says no. Apple's rules forbid forcing it.
6. Founder addendum (20 Nov): the tab need not be the default and may be second or centre (section 11); and the library should also drive email and push nudges (section 10). Short answer: email cannot, because the server never sees the library; a local push can only be a fixed neutral one that is indistinguishable from an ordinary evening reminder, and even that reverses the standing no-library-notification ruling, which the founder must own.

## 1. Sources

Read this session (VERIFIED, Apple developer pages fetched on 21 Nov 2026):

| Id | Source | What it says that matters here |
|---|---|---|
| A1 | developer.apple.com/documentation/journalingsuggestions (framework overview) | Picker for iPhone apps, iOS 17.2 and later (iPadOS 26 and later). "For the picker to appear, your app needs a special entitlement in your app's code signature. You don't need to ask for additional authorization because your app can't access the details for a suggestion until after a person chooses to share them by making a selection in the picker." Mac Catalyst ignores the picker button |
| A2 |  [cut] /journalingsuggestionspicker | "After a person selects a suggestion in the picker, the system shares only the information associated with the chosen suggestion with your app." A system sheet introduces the concept the first time the picker appears |
| A3 |  [cut] /presenting-the-suggestions-picker-and-processing-a-selection | The picker is presented "in a system process". Consent sheet (Turn On Journaling Suggestions) shows once per device. Entitlement `com.apple.developer.journal.allow` is required, added by enabling the Journaling Suggestions capability in Xcode. Item types returned for a chosen suggestion: Photo, Workout, Contact (name and contact photo), Location (name, surrounding city, coordinates if available), Song, Podcast, Video, LivePhoto, MotionActivity, GenericMedia, Reflection, StateOfMind, EventPoster. The sample reads `suggestion.title` and photos. Apple points to the Developer Program License Agreement for careful handling of suggestion data |
| A4 |  [cut] /com.apple.developer.journal.allow | The picker cannot be presented without the entitlement. It does not say how, or whether, Apple approves the entitlement |
| A5 | apple.com/legal/privacy/data/en/journaling-suggestions | On-device processing groups moments; apps receive only the suggestions the person chooses; the person controls categories, can clear history, turn all suggestions off (applies to every journaling app), and notification timing. Page does not say whether the feature is on by default |
| A6 | developer.apple.com/documentation/corelocation/clgeocoder | A geocoder "works with a network-based service to look up placemark information"; reverse geocoding takes a latitude and longitude and returns an address or place name; requests are rate-limited per app; a device needs network for detailed results; only country or region may be available locally |
| A7 | developer.apple.com/app-store/app-privacy-details | "Collect" means transmitting data off the device so that you or partners can access it for longer than needed to serve the request in real time. "Data that is processed only on device is not 'collected' [cut]  If you derive anything from that data and send it off device, the resulting data should be considered separately." Photos or Videos (User Content) and Precise Location (three or more decimal places) are label types |
| A8 | developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app | `PHPickerViewController` runs in a separate process and needs no authorisation. Full access needs a usage description; "Attempting to access the Photos library without a valid usage description causes your app to crash". "Avoid making PhotoKit calls when your app first launches [cut]  make these calls in response to direct user action." The system remembers the answer and will not prompt again; the person can change it in Settings. Limited library exists since iOS 14; with it, user albums cannot be fetched; the automatic limited-library alert can be suppressed with an Info.plist key (key name is in a screenshot there, so UNVERIFIED) |
| A9 | developer.apple.com/app-store/review/guidelines (read to character 100000 of 121052) | 5.1.1(ii) consent and clear purpose strings; 5.1.1(iii) "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts"; 5.1.1(iv) "Apps must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access [cut]  Where possible, provide alternative solutions for users who don't grant consent"; 5.1.2(i) may not require users to enable system functionality to access functionality |

Read in the repo this session (develop at `86eccfa0`): `docs/product/prd/27-photo-moments-and-media.md` (NS-51 rows R1 to R26, Q-PM-1 to Q-PM-8), `docs/product/prd/21-days-cultural-photos-home.md` (NS-49-R7, R9, R25), `docs/roadmap/next/03-requirements/NX-39-memory-library.md` (R8, R16), `docs/BACKLOG.md` (BL-1305, BL-881), `docs/design/IA-FINAL-20nov.md`, `docs/design/NOTIFICATIONS.md` (K-02), `docs/legal/app-store-privacy-labels.md`, `apps/mobile/test/g6-production-flags-off.test.ts`, `apps/mobile/test/preflight-forbidden-native.test.ts`.

UNVERIFIED (not read, or only described to me):
- That the founder's screenshots show Apple's picker. The element types described (reflection, photo-memories highlight, workout-like clusters, song, state of mind with a Settings prompt) match the types in A3, but a Recommended and Recent switch is not in any page I read, and an app can draw its own sheet that copies Apple's look. If the sheet is Apple's, it is drawn by the system and we cannot change it.
- The ids "ML-1 to ML-14" as a list. I found ML-13 and ML-14 cited in BL-881 and the memory-library rulings in NX-39; I did not find a text of "ML-6". The nearest written rule is NX-39-R16 (a card shows a date range only: no place, no thumbnail, no count). Section 6 cites R16, and `product` should confirm the ML numbering.
- Whether Journaling Suggestions needs an Info.plist photo usage string in addition to the entitlement (A1 says no additional authorisation; it does not discuss plist keys).
- Whether Apple reviews the entitlement before a build is accepted (A4 is silent).
- Whether a map tile image (MapKit snapshot or view) sends the region to Apple's servers, and what Apple keeps. Not read.
- Whether Apple's own picker contacts any server while building suggestions. A5 says on-device processing and that names and locations are not shared via Bluetooth counting; it does not describe every network path.
- The Developer Program License Agreement section A3 links to, and App Review 5.1.3 (health data), which would govern a mood element. Not read.
- Whether PhotoKit exposes person or face groupings to third-party apps. Not read, and not needed: we would not use them (section 4).

## 2. Route A: Apple's journaling suggestions picker

What it is: a system sheet (A3) opened from a button we provide. The parent chooses one suggestion; only then does our app receive it (A1, A2, A5).

What our app receives, only after the pick (A3): the chosen suggestion's `title` and date range, and its items: Photo, Live Photo and Video from the library (with date captured), and, if the suggestion contains them, Location (a name, a city, coordinates if available), Contact (a name and contact photo), Song, Podcast, Workout, Reflection, State of Mind and the rest.

Do titles and people names come back? Per A3, a suggestion has a title (the sample code reads `suggestion.title`), and Contact items carry a name and contact photo; Location items carry a place name. So yes, they can come back inside the one suggestion the parent picked. Whether a given suggestion has them depends on what Apple built it from. The existing card NS-49-R9 already handles the title: it shows only as "From your phone: {title}" next to "Use this", the photo-words field starts empty, and the title is copied only on the parent's tap, after which it is the parent's text.

Permission prompt: no photo-library permission prompt (A1). There is Apple's own once-per-device consent sheet (A3) that the parent sees the first time the picker opens, and it is Apple's wording, not ours.

Entitlement: yes, `com.apple.developer.journal.allow` (A3, A4). Today the build forbids it: `g6-production-flags-off.test.ts` fails on the entitlement in a production build, and NS-49 level 2 keeps it behind a flag. Whether Apple gates the entitlement in review is UNVERIFIED.

What we cannot control: the sheet's look, the Recommended and Recent layout, what categories appear, any "Go to Settings" card, and the music and mood cards. The parent controls categories in Apple's Settings (A5). We cannot hide the Location, Contact or Song categories from the sheet itself; we can only decide what we keep after the pick.

Effect on the App Privacy label (A7): if the chosen items stay on the phone and become the parent's own picture and words inside the phone database, they are not "collected", the same as the existing picture-start path. Photos or Videos stays "Data Not Collected" only while nothing from a suggestion leaves the phone (NS-49-R33 and NS-51-R26 already require a network fake to see zero requests). If we kept a Location (precise coordinates) or Contact name and it later synced to our server, Precise Location and Contacts would become collected types. So the rule: take the pictures and nothing else by default; take a title only on "Use this"; never read Location, Contact, Song, Workout, StateOfMind or Reflection items.

What Route A gives the founder: the look and spread of suggestions without any of our code reading the library. What it costs: no styling control, an entitlement, Apple's consent sheet, iOS 17.2 and later, and an App Review conversation. It also means "Recommended" in our app is Apple's, not our value-prop story.

## 3. Route B: our own on-device read (PhotoKit, limited access honoured)

What it is: NS-51 (the pictures feature) and the memory-library rulings. Our code, after the parent taps "Turn on" and answers Apple's own sheet (limited or full), reads only each picture's creation date and a system identifier (NS-51-R5), builds at most 30 day-groups on the phone (R6, R7), shows the parent's own pictures as thumbnails with multi-select (R9), and nothing leaves the phone (R26). Limited access works the same way and is never nagged (R3, R18, R19). Thumbnails come from the system with network off (R21, UNVERIFIED that this yields a local thumbnail).

Permission and strings: needs `NSPhotoLibraryUsageDescription` (A8), which BL-1305 and NS-49-R25 forbid in any 1.x build. The picker-only path (`PHPickerViewController`) needs neither (A8) and is what the app uses today.

What Route B gives: days, time ranges, our own layout, thumbnails in time order, video lengths, our own prompts. What it cannot give without breaking a rule: titles, places, people, music, mood (section 4).

Effect on the label (A7): library data read and kept only on the phone is not "collected". The usage string is a permission text, not a label answer. The label stays "Data Not Collected" for Photos or Videos as long as the network fake in NS-51-R26 stays green and no thumbnail, date or identifier goes into a request, log, crash report or analytics event. A new label review is still required in the same build (FR-PRV-30; `docs/legal/app-store-privacy-labels.md` row for User Content currently says "No photo feature in v1.0").

## 4. Element by element

Tests used: C = the constitution ("the machine may remove and repair; it may never add meaning": no caption or title written for a parent, no scene or place guess, no face matching); P = privacy rules (nothing leaves the phone; label stays Data Not Collected); B = BL-1305 (no photo-library usage string or PhotoKit symbol in any 1.x build).

| Element in the reference | Route A | Route B | Recommendation (PROPOSED) |
|---|---|---|---|
| Collage of the day's pictures | Inside Apple's sheet, not ours. After a pick we get the parent's chosen pictures | C pass if time order, no "best", no crop that picks a face or subject. P pass. B fails in 1.x (needs the usage string) | Yes, in Route B behind NS-51's flag: up to 4 thumbnails in time order, one fixed layout, no ranking |
| Place name on a map tile | Apple supplies a Location name inside the sheet; our app would receive it only if we read the Location item | C: a reverse-geocoded name is a label the machine adds to the parent's picture. It is a lookup of recorded coordinates, not a scene guess, so it is the softest of the C cases, but it is still words we add. P: needs coordinates to leave the phone (section 5). Closed Off by Q-PM-5 and CL-050 | No machine place. Offer a parent-typed place, optional, on the letter. No map tile |
| Machine-made title (time of day, "visit" or "outing", place, names) | Apple's `title` comes back; allowed only as NS-49-R9: shown as Apple's, copied only on "Use this" | C fails: "visit", "outing" and a place name are words written for the parent, and names are people. This is the exact thing the constitution forbids | No title from us. Show the phone's formatted date and time range only (a fact the parent can check), for example "Saturday 14 Nov, morning to afternoon" built from timestamps by a fixed rule, never from content |
| People names | Contact items carry a name and contact photo from the parent's own interaction history. Do not read them | No names are available to us without face or person matching, which is forbidden. C fails | Never. No name, no face, no contact link |
| Reflection prompt cards with a refresh button | Apple's Reflection item is Apple's wording; do not take it | Our own catalogue (111 prompts, chosen by `packages/core` prompt selection, no model) can fill cards; refresh is a shuffle inside the catalogue. C pass (prompts are fixed words we ship, the parent writes the answer). No streak, no count | Yes. Use catalogue prompts only; no coloured badge that scores; refresh is a plain shuffle. No library permission needed, so this part works for a parent who says no |
| "Remember when" highlights (a date a year earlier) | Apple's Photo Memories highlight is inside its sheet | The date rule is plain arithmetic: pictures whose local date matches. C pass if it only shows the parent's pictures in time order with no "best" and no caption. Wording must stay about love and time, never "again", "still" or counts | Yes, as "pictures from this day last year" (words for `content` to set), Route B only, P1 |
| Clusters with video lengths | Videos come back after a pick | Duration is metadata the phone already holds; shown as given. C pass, P pass | Yes, for NS-52 (videos with a letter), no analysis of what is in the video |
| Music track tile | Song items give name, artist, artwork | Needs another permission (a media library) and is not about the child. Also third-party artwork | No. Not a child memory; adds a permission and a label review |
| State of Mind card with Go to Settings | StateOfMind is the parent's health-app data; a Sensitive-class category. A card pushing the parent to Settings is a nag | Not available in Route B | No. Sensitive data, no clear use, and it breaks the no-nagging rule (NS-51-R19) |

Items I could not settle without a counsel or store read: whether even showing Apple's own Location name after a pick (Route A) counts as us "adding" a place. My default is that we receive nothing but pictures, so the question does not arise.

## 5. Reverse geocoding and the place name

What I can verify (A6): a geocoder works with a network-based service; reverse geocoding takes a latitude and longitude and returns a place name or address; requests are rate-limited per app, and Apple tells developers to send at most one request per user action and not to start one when the person will not see the result. Only country or region may be available locally. So a street or venue name needs the network.

What I cannot verify: what Apple's service logs or keeps, whether it can link a request to a device or to our app, and whether Apple would treat our sending coordinates to its own geocoder as "collection" under the label definition (A7: the definition turns on access by us or partners beyond the real-time request; Apple is the processor here, but I did not find a sentence that settles it). I also could not verify whether a map tile or snapshot sends the displayed region to Apple's servers.

Safer alternatives, in order:
1. No place at all (recommended default; matches Q-PM-5).
2. A place the parent types on the letter. It is the parent's own words, stays on the phone, and fits the constitution.
3. A country or region only, from the on-device portion A6 describes as possibly local. Still a machine-added label; a counsel and `product` decision, and not recommended.
Never: a venue or street name from a lookup, a map tile, or coordinates stored, logged or synced. Coordinates are Precise Location on the label (A7) the moment they leave the phone for our use.

## 6. What the founder's direction overtakes (each is a reversal the founder must own)

This list is my reading of the repo. None of these is changed by this PR. Each needs the founder's explicit decision, and a cited row to change, in the PR that builds it.

| Earlier ruling | Where | What the new direction does to it |
|---|---|---|
| BL-1305: no photo-library usage string and no PhotoKit call in any 1.x build, and a build-config test that fails on either | `docs/BACKLOG.md` BL-1305; NS-49-R25; `g6-production-flags-off.test.ts`; `preflight-forbidden-native.test.ts` | A tab that asks for the library and shows days needs Route B in 1.x. Reversal. Route A also trips the g6 test (entitlement) |
| The pictures feature (NS-51) is drop C, after 1.0 is approved, spike first | Q-PM-7, CL-052 | A default tab means it ships with the landing experience. Reversal of timing |
| NS-51-R1: no other screen, slip or onboarding step asks for library access; the ask is only on the Pictures row after one sentence | `27-photo-moments-and-media.md` | A landing tab that asks puts a second doorway on the first screen a parent sees. Reversal unless the ask is the same sentence-then-tap pattern on this tab |
| NS-51-R8: the capture menu offers only the newest moment, never a list, a count or an older one | same | A "Recent, newest first" list of days is a list and shows older days. Reversal |
| NS-51-R9 and "ML-6" (as the founder's brief states it): a moment card shows a date, never a place or a thumbnail; the sheet has no title, place or count. Written rule found: NX-39-R16 | `27` R9; `NX-39` R16 | Thumbnails on the tab and any place reverse it. My recommendation keeps "no place, no title" and reverses only "no thumbnail", and only inside the parent-opened tab |
| Q-PM-5 and CL-050: place names off | `27` | Only reversed if the founder wants a place. Recommended: not reversed |
| IA-FINAL: three tabs (Home, Book, Me) in every build; Never a place: a Library tab | `docs/design/IA-FINAL-20nov.md` | A fourth tab that is the default landing is a change to the information architecture. Reversal (`design` and `product` own the layout; the founder owns the call) |
| K-02: no photo card during first run; the permission ask belongs after the first saved letter | `docs/design/NOTIFICATIONS.md`; `COPY_INVENTORY.md` photo cards | If this tab is the default landing for a brand-new parent, the first screen asks about photos before any letter exists. Reversal unless the tab stays hidden or non-default until the first letter is saved (my recommendation in section 7) |
| Public claims: label row "No photo feature in v1.0"; privacy policy and in-app disclosures | `docs/legal/app-store-privacy-labels.md`; `docs/legal/privacy-policy.md` | Must be re-read against the build. They are in `docs/legal/**`, so I do not edit them; `legal` and the founder do |

## 7. The permission ask, designed against Apple's rules

Founder's words: "if not given permission for your photos then get that permission." Apple's constraints:
- Ask on a direct action, not at launch (A8: "Avoid making PhotoKit calls when your app first launches [cut]  make these calls in response to direct user action").
- Do not force it (A9, 5.1.1(iv) and 5.1.2(i)): not manipulate, trick or force consent; provide an alternative for someone who declines; do not require system functions to reach functionality.
- Use the out-of-process picker where possible (A9, 5.1.1(iii)).
- The purpose string must describe the use clearly and completely (5.1.1(ii)); a missing one crashes the app (A8).
- The system remembers the answer and does not prompt again (A8). The repeat is therefore not ours to make: our own repeated nudges would be the nagging that NS-51-R3, R18 and R19 already forbid.

Proposed behaviour (all PROPOSED):
1. The tab is the value-proposition page by default. It shows what the tab does, using generated Asha demo pictures (never the founder's screenshots, never real pictures). Prompt cards from the catalogue work with no permission.
2. One button, in the parent's words, such as "Show days from my pictures". Tapping it shows one sentence about what is read and that it stays on the phone, then Apple's sheet. This is the NS-51-R1 pattern, moved onto the tab.
3. Limited access works exactly like full (NS-51-R3, R18). Denied or restricted shows one calm line, "Open Settings" only when the parent looks at it, no second system ask (R19).
4. The fallback is always there: "Choose a picture" through the system picker, which needs no permission (A8), and the existing start-from-a-picture flow. So the parent who declines loses nothing they had.
5. Before the first saved letter the tab does not ask. Either it is not the default landing yet, or it shows the value page with no ask. That keeps K-02 for a new parent. After the first letter it can be the default. The founder decides whether to lift K-02; this keeps it.
6. Route A needs no library permission, so none of steps 2 to 4 applies to it; the parent sees Apple's own once-per-device sheet (A3) only after the parent taps, and only after the first saved letter. If both routes ship, the tab should offer one clear button per route or choose one, so the parent is not shown two different consent moments back to back (counsel question CQ-8).

What the App Privacy label says:
- Route A only: Photos or Videos and Location not collected, if only the picked pictures are stored on the phone. No usage string.
- Route B only: Photos or Videos not collected while everything stays on the phone (A7). Usage string present; the label does not change because of the string.
- Either route, if any picture, thumbnail, date, coordinate or title ever leaves the phone for us (sync, analytics, crash, a geocode request we log): that data type is collected and the "Data Not Collected" claim is false. The code must prove this with a network fake and a leak scan, per LEGAL-REQ-014 and NS-51-R26.

## 8. Counsel questions, each with a recommended default

| Id | Question | Recommended default |
|---|---|---|
| CQ-1 | May we ship Route B (usage string, PhotoKit) in a 1.x build, reversing BL-1305, if the label stays Data Not Collected? | Yes only with the NS-51 rows and tests, flag-gated; counsel to confirm the label wording and the usage string |
| CQ-2 | Does Apple review or approve `com.apple.developer.journal.allow`, and does Route A need any extra privacy text or plist key? | Treat as unknown. Do not ship Route A until the capability is enabled in a test build and App Review's reply is on record |
| CQ-3 | DPLA: what does the sensitive-content handling section require of an app that receives suggestion data (A3 links to it; not read)? | Receive pictures only; discard every other item type at the boundary; counsel reads the section |
| CQ-4 | Is sending coordinates to Apple's geocoder "collection" under the App Privacy definition, and is a map tile a transfer to Apple? | Avoid the question: no geocode, no map tile, parent-typed place only |
| CQ-5 | Is a machine-supplied date-and-time line ("Saturday, morning to afternoon") acceptable under the constitution and the content rules? | Yes if built by a fixed rule from timestamps and never from content; `product` confirms |
| CQ-6 | Does showing a parent's own pictures in a "year ago" card, with no caption, stay inside "no loss language, never count gaps"? | Yes; `content` sets words; no counts, no "still", no "again" |
| CQ-7 | Does a default tab that asks for the library on a direct tap meet App Review 5.1.1(iv) and 5.1.2(i)? | Yes if the tap, the explanation and a no-permission fallback are all present and nothing is gated; counsel and the store reviewer confirm |
| CQ-8 | If both routes ship, is showing Apple's consent sheet and then the iOS permission alert in one session a consent-clarity problem under the privacy policy? | Ship one route first; Route B first because we control the words |
| CQ-9 | Must the privacy policy, label and in-app disclosures change before either route ships (and who edits `docs/legal/**`)? | Yes, same build as behaviour; `legal` and the founder edit; I supply the facts |
| CQ-10 | Is a parent-typed place on a letter, kept on the phone and in the synced entry like other letter text, a new data type? | No: it is letter content (L4) like any word the parent writes; confirm in the classification table |

## 9. Hand-offs

- `legal`: CQ-1 to CQ-10; label and policy re-read per route.
- `product` and `design`: the tab's place in IA-FINAL, K-02 timing, wording for the value page, and the founder's call on each reversal in section 6.
- `mobile`: nothing to build from this document. Any build starts only after the founder owns the reversals and each card row is amended in its own PR.
- `analytics`: any event for the tab carries no date, count, place or picture property; I will review events when they exist.
- `data-architect`: if a parent-typed place needs a column, it is theirs to place and class.
- `security`: threat model for thumbnails in the app switcher and screenshots (NS-51-R25) applies to a default tab as it does to the pictures sheet.

Content-rule check on this file: no em or en dashes, curly quotes, ellipsis characters or emoji; no model names.

## 10. Nudges driven by library moments: push and email

Founder, 20 Nov (verbatim): "It doesn't need to be default but think if it can be second tab or centre tab [cut] this is what would bring engagement [cut] And this would influence email nudges and push notifications nudges not just this app feed."

Standing rulings this meets. The coordinator cites "ML-3: no push from library data". I did not find a row with that id; the text matches NX-39 ruling 3, "No notification is ever derived from the library", with its reason in the NX-39 decision table: "A notification that exists because of a library read discloses a derived fact by existing, whatever its words", and K1 ("No photo in a notification, widget, lock screen or analytics", extended to place, count and any library-derived notification at all). `product` should confirm the ML numbering. One newer row already cuts into this: NS-51-R11 (20 Nov, CL-053 closed Q-PM-8) lets a moment be a ranked source of the evening reminder with one neutral title and body, planned only while the app is open. So the position today is: a neutral local nudge is written into NS-51; NX-39's flat ban still stands in its own file. I treat the NX-39 ban as the standing ruling and NS-51-R11 as a narrow, already-proposed exception that the founder has not been shown as a reversal.

Email. Not possible without a reversal that I recommend against. The server never sees the library (NS-51-R26: a network fake sees zero requests; nothing derived leaves the phone). An email that says anything about pictures would need the phone to tell the server that pictures exist, which is data derived from the library sent off the phone, so by the App Privacy definition it is collected (A7: "If you derive anything from that data and send it off device, the resulting data should be considered separately"). That would change the label from Data Not Collected for Photos or Videos, break K1 and NS-51-R26, and need a new disclosure. Recommended: email never uses the library. It may keep using what it uses today (a fixed schedule and the parent's own typed days), with no sentence, count or timing derived from pictures. A server-sent (remote) push is the same case and is refused for the same reason.

What a compliant on-device local notification would be (PROPOSED; all of it already points the same way as NS-51-R11 and NS-48, with the last two lines stricter):
1. Scheduled by the phone itself, never by the server, and only while the app is open (no background mode; Q-PM-8). A weekend's pictures taken after the last open do not prompt.
2. Fixed neutral title and body, the same words used for hidden previews. No thumbnail or attachment, no place, no count, no date range, no "your pictures". Words are `content`'s and `legal`'s; nothing here is final copy.
3. Nothing about the moment in the notification payload: a tap opens the tab, never a particular day or picture id. The payload carries no identifier from the library (a library identifier in a payload is a leak into the notification system and any log of it).
4. Counts inside the one-a-day budget with the other evening reminders (NS-32-R1), is skipped for a quiet or hidden book, silenced by a letter already made that day (NS-51-R13), off when pictures are off or paused (R15, R16).
5. Stricter than NS-51-R11, proposed: the moment nudge may only take the slot of the ordinary evening reminder and use the ordinary reminder's exact words, so that its existence tells a lock-screen watcher nothing about pictures. This answers the NX-39 point that a notification discloses a fact by existing. It is not a guarantee: the parent could still infer from a pattern. Counsel and the founder decide whether the neutral-words version is enough or whether the identical-words version is the only acceptable one.
6. No analytics event, property, bucket or insight may mark a nudge as moment-driven. A "moment nudge shown" event is a library-derived fact leaving the phone (the D-163 analytics path included). Count it as an ordinary evening nudge. This extends NS-51-R12.
7. The notification permission is the existing reminder ask, after the first saved letter (K-02). The library tab does not ask for it.

App Review and label implications:
- A local notification is not "collection": nothing is sent to us or to Apple's push service (UNVERIFIED this session; I read no Apple page on local notifications, and I read App Review only to character 100000, so any promotional-notification rule beyond 5.1.2(i) is UNVERIFIED and counsel and `mobile` should read guideline 4.5.4 before any wording ships). The label stays Data Not Collected if nothing leaves the phone.
- 5.1.2(i): the notification and library permissions may not be required to use the app; both remain optional with the app working without them.
- The privacy policy and in-app disclosures must say plainly that reminders may be timed from pictures on the phone, and that this never leaves the phone. That sentence needs a code test (the claims-inventory pattern) before it is published. Those files are in `docs/legal/**`; I do not edit them.
- Engagement claim: the founder says this would bring engagement. I found no measured evidence in the repo for a lift from library nudges and read none outside it, so I treat that as the founder's belief, not a fact, and I do not rely on it. The existing parent study plan Q4 and Q5 is where a test would live.

Reversals the founder must own in this section (each is his decision, none is made here):

| Earlier ruling | What the ask overturns |
|---|---|
| NX-39 ruling 3 and K1 (no notification derived from the library) | Any library-driven nudge, even a neutral one, reverses it. NS-51-R11 already proposes the neutral form; the founder should own it explicitly, with the existence-disclosure reasoning in front of him |
| NX-39 R26 and R27 (fixed content keys; no library-derived notification) | Same |
| NS-51-R26 and K1 on server and analytics (nothing derived leaves the phone) | Overturned only if email or remote push uses the library or analytics marks a nudge. Recommended: do not reverse |
| NX-39 card rule: a notification never carries a place or thumbnail | Overturned only if the nudge shows a picture or place. Recommended: do not reverse |

Counsel questions added:

| Id | Question | Recommended default |
|---|---|---|
| CQ-11 | Is a local notification whose timing is derived from library metadata, with fixed neutral words and no payload identifier, acceptable under the privacy policy, the label and App Review? | Yes only in the identical-words form (point 5), with the disclosure sentence and a test; else no |
| CQ-12 | Does the fact that a notification exists (and when) count as a derived disclosure to anyone who can see the lock screen? | Treat as yes; that is why the identical-words form is proposed |
| CQ-13 | May any email or remote push use a library-derived signal if the parent opts in separately? | No. Even with consent it makes Photos or Videos metadata collected and changes the label; a separate founder and counsel decision, not a default |
| CQ-14 | Do the promotional-notification rules in App Review (guideline 4.5.4, not read) apply to a nudge about pictures? | Counsel reads it before any wording; default is opt-in only and never required |
| CQ-15 | Must analytics be barred from distinguishing a moment-driven nudge from an ordinary one? | Yes |

## 11. Where the tab sits: second or centre

Founder, 20 Nov: it need not be the default; second or centre tab is fine. This is a layout call for `design` and `product`; I give only the privacy and rules read.
- Today there are three tabs in this order: Home, Book, Me (IA-FINAL). Any fourth tab reverses that and its "Never a place: a Library tab" line; a second position gives Home, the new tab, Book, Me. A true centre needs an odd count (five tabs), which adds a second new tab; I do not recommend inventing one for symmetry.
- Not being the default is better for privacy and for the rules: K-02 stays intact for a new parent if the tab shows the value page with no ask before the first saved letter, and no library doorway is on the first screen. That removes one reversal from section 6 (the K-02 row) and softens NS-51-R1 (the ask stays on the parent's tap).
- Engagement placement is not a privacy fact; I did not evaluate it.
- Wherever it sits, the privacy requirements in sections 4, 7 and 10 apply unchanged: no place, no title, no names; ask only on a tap; always a fallback; the switcher and screenshot protections of NS-51-R25 apply to the tab as a whole.
