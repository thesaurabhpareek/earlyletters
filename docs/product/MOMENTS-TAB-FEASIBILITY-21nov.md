Status: PROPOSED (docs only; nothing here is decided, built, or merged)
Date: 21 Nov 2026
Author: `mobile` (engineering feasibility, for the founder, Karma and `product`)
Source: founder direction of 20 Nov 2026 (verbatim in section 0) and its addendum the same day
Load when: you price, rule on, spec or build a Moments tab, Apple's journaling suggestions, or a photo-library read.

# A Moments tab: engineering feasibility

Everything below is PROPOSED. Labels: [V url] is a fact I read at that URL this session; [R path] is a repo fact I read this session; [A] is an assumption of mine; UNVERIFIED is anything I did not read or run. I ran no code and used no device. I read the developer pages as markdown through the fetch tool; where a page would not load, I say so. The founder's screenshots are not in the repo and are not described beyond the shape the direction gives (Recommended and Recent lists of photo moments with a collage, a map tile and place, an automatic title and a compose button; reflection prompt cards; a Photo Memories highlight; music and mood cards). Fictional family Asha only; no real family detail is used here.

## 0. The ask, and what it collides with

Founder, 20 Nov 2026: "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word."

Addendum, same day: "The default tab can be showcasing value props nicely and if not given permission for your photos then get that permission. If you gave them show relevant things like screenshots I provided."

My reading of the first addendum: one new tab, the default landing tab. A second addendum (section 5.4) says the tab need not be the default, that second or centre is fine, and that the moment signal should also drive push and email nudges; where section 5.4 and the rest differ, 5.4 is newer. Without photo access it shows value props and asks for access. With access it shows relevant moments in the shape of the screenshots.

Five collisions with rulings already in the repo. Each needs a founder word before code; none is mine to settle.

| # | What the founder asked | What the repo says now | What a ruling would have to say |
|---|---|---|---|
| C1 | A new tab | "Three tabs: Home (Say), Book (Read), Me (Look after). No Moments tab, no Family tab." [R docs/product/prd/README.md:125-126]; "tabs stay Home, Book, Me (D-161 draft)" [R docs/product/prd/12-parked-and-not-built.md:27]; NS-51 section 3: "no new tab" [R docs/product/prd/27-photo-moments-and-media.md:80] | A recorded reversal of the 11 Nov tab ruling and the D-161 draft, with the tab test it must pass |
| C2 | It is the default landing tab | Home is the root, one verb: "Only Home starts a letter" [R docs/product/prd/00-product-frame.md:62]; `TONIGHT_HREF = '/'` [R apps/mobile/src/lib/resilience/not-found.logic.ts:5] | A ruling that landing is not Tonight, and for whom (first launch, every launch, or after a first letter) |
| C3 | Ask for the photo permission on the tab | NS-51-R1: off until the parent taps "Turn on" on its own Me row; "no other screen, slip or onboarding step asks" [R 27-photo-moments-and-media.md, NS-51-R1]; NS-49-R25: no usage string, no PhotoKit authorisation call in the 1.x line [R 21-days-cultural-photos-home.md:909] | Reverse the "no other screen" clause for this tab, only on a tap, and state it in BL-1001's ruling |
| C4 | Automatic title, place and map tile on each moment | NS-51-R10: nothing describes a picture, no title, no caption; Q-PM-5 CLOSED: no place is read (`asset.location` untouched) [R 27-photo-moments-and-media.md, Q-PM-5, NS-51-R9, R10] | Either keep it to a date line (Route B) or take Apple's title and place only after the parent chooses (Route A) |
| C5 | Music and mood cards, Photo Memories highlight | NS-49-R10: v1 reads photo and live photo only [R 21-days-cultural-photos-home.md:894]; the picture-only product frame | Only Apple's own sheet can show these (section 1.4); our app cannot draw them from a library read |

The founder is also the one who can say that "smarter and relevant to my usecase" means these rulings give way. I do not assume it.

## 1. Route A: Apple's JournalingSuggestions picker

### 1.1 Verified facts

| Question | Answer | Source |
|---|---|---|
| Minimum iOS | iOS 17.2 for the framework, the picker, `JournalingSuggestion`, `Photo`, `Location` and the entitlement. So 17.2 is confirmed. The framework page also lists iPadOS 26, and says "Journaling Suggestions provides a visual picker interface for iPhone apps" | [V https://developer.apple.com/documentation/journalingsuggestions.md], [V https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md] |
| Entitlement | `com.apple.developer.journal.allow`: "can't present the picker for apps without this entitlement in their code signature. Add this entitlement to your app by enabling the Journaling Suggestions capability in Xcode" | [V https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.journal.allow.md] |
| Extra authorisation | None: "You don't need to ask for additional authorization because your app can't access the details for a suggestion until after a person chooses to share them" | [V https://developer.apple.com/documentation/journalingsuggestions.md] |
| What it is | A SwiftUI view generic over a `Label`. Initialisers take a label closure or a title, plus `onCompletion: (JournalingSuggestion) async -> Void`. I read three initialisers and no `isPresented` form | [V https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md] |
| How it appears | "When a person taps the text, the system presents the picker in a system process." The first time, a consent sheet ("Turn On Journaling Suggestions", "Customize") shows once per device, also if Journal or another app already showed it | [V https://developer.apple.com/documentation/journalingsuggestions/presenting-the-suggestions-picker-and-processing-a-selection.md] |
| What the app gets | `title: String`, `date: DateInterval?`, `items`, and `content(forType:)`. Item types: Photo (URL "to an image on disk", creation date), LivePhoto, Video (with date), Location (`city`, `place`, `location` coordinates, `date`, `isWorkLocation`, a MapKit identifier), Contact (name and contact photo), Song, Podcast, Workout, MotionActivity, GenericMedia, Reflection (a prompt the person chose), StateOfMind, EventPoster, LocationGroup, WorkoutGroup | [V https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestion.md], [V https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestion/photo.md], [V https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestion/location.md], [V the presenting article above] |
| Privacy shape | "the system shares only the details of the chosen suggestion with your app." A banner says the app "only has access to the suggestions the person chooses to write about or saves to the app." The person controls suggestion types in the consent sheet or in Settings | [V the presenting article above] |
| Mac Catalyst | "Mac apps built with Mac Catalyst ignore input if someone taps a suggestions picker button" | [V https://developer.apple.com/documentation/journalingsuggestions.md] |
| Apple's own privacy page | "You control which suggestions are shared with journaling apps"; "Only you can see your suggestions prior to sharing them" | [V https://www.apple.com/legal/privacy/data/en/journaling-suggestions] |

### 1.2 A correction to a line already in the repo

`27-photo-moments-and-media.md` source S1 summarises Apple's privacy page as "contacts' names and locations are not shared". I read that page: the sentence is about Bluetooth-based "Prioritize Moments with Contacts" ("Contacts' names and locations are not shared with you", only a count is stored on the device); it says nothing about what an app receives [V https://www.apple.com/legal/privacy/data/en/journaling-suggestions]. The API pages say the opposite for a chosen suggestion: a Contact item carries a name and a contact photo, a Location item carries a place name and coordinates [V the Location and presenting pages]. So "people" and "places" can reach the app, when the parent picks a suggestion that holds them. NS-49-R10 already refuses to read them (it calls `content(forType:)` for photo and live photo only); that rule is the protection, not Apple. `product` should correct S1.

### 1.3 Will App Review grant the entitlement to a baby-memory app

UNVERIFIED. What I read says only "enable the capability in Xcode" and names no approval step. I found no Apple page that says the capability is self-serve in the developer account, and none that says it is gated; a forum thread I opened answered neither [V https://developer.apple.com/forums/thread/744552]. NS-49-R15 records the same gap [R 21-days-cultural-photos-home.md:899]. Two things I cannot settle from reading: whether the capability appears for our App ID in the developer account without a request, and whether App Review asks what the app does with it. The repo also cites DPLA 3.3.3(H), "for journaling purposes", with the use "clearly evident" in marketing text and interface [R 27-photo-moments-and-media.md, S5; NS-49-R35]; I did not re-read the agreement. A baby-memory book where parents say a letter about a day is a journaling use on its face, but that is my reading and counsel must confirm. The cheapest honest test is a device spike with a profile that carries the capability (section 4, spike D1).

### 1.4 System sheet or a tab

A system sheet. The picker is a view that renders a button; the picker itself opens in "a system process" when tapped [V the presenting article]. I found nothing that lets an app draw the lists inline, restyle them, filter them to a child, or ask for photo suggestions only. Consequences for the screenshots:

- The Recommended and Recent lists, the Photo Memories highlight, the music and mood cards and the reflection cards are Apple's own UI inside the picker. A tab cannot embed them. A tab can hold one button that opens them.
- Apple's picker shows suggestion types the parent allowed in Apple's own settings. Whether our app can restrict it to photos is UNVERIFIED. If it cannot, a parent may see workouts and songs inside our flow. That is Apple's behaviour and a brand question for `design-systems` and the founder, found in spike D1.
- The app learns nothing when the parent cancels, which is what NS-49-R11 already requires.
- Apple's title comes back with the choice (`title`). We may show it only after the parent picks and never write it as the parent's words (NS-49-R9: "From your phone: {title}", copied into photo words only on a tap) [R 21-days-cultural-photos-home.md:893].

### 1.5 Reaching it from Expo SDK 57

A new local Swift module, not a JavaScript package. The `expo-native-module` skill governs it [R .claude/skills/expo-native-module/SKILL.md]: layout `apps/mobile/modules/<scribe-name>/` with `expo-module.config.json`, `index.ts` using `requireOptionalNativeModule`, an iOS podspec and a Swift file; logic in `apps/mobile/src/lib/**/*.logic.ts`; source-scan tests; `ios-compile.yml` as the only place Swift compiles; ask `security-architect` for the native and entitlement read in the PR body; no permission call ships without an accepted purpose string.

Shape I propose [A]: a native Expo `View` that hosts the SwiftUI picker in a `UIHostingController`, sized to our own capsule label, and an `onSuggestion` event carrying a plain object (a copied file path in our Caches, a date, a title, a kind). The `scribe-photo` module stays permission-free [R apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift header] and the new module is separate (NS-49-R31 already names the native file `journal-picker`) [R 21-days-cultural-photos-home.md:915]. Items to prove on a phone, all UNVERIFIED: that a SwiftUI picker button inside a hosted view inside a React Native view presents; the lifetime and location of the returned photo URL (NS-49 spike step 1); `#available(iOS 17.2, *)` weak linking through CocoaPods (the podspec now says `:ios => '16.4'` [R apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec]); and that the entitlement reaches the signed plist through the Expo config (the one entitlements block, `app.config.ts` lines 260-262 [R]). I did not check whether SDK 57 ships a SwiftUI hosting package; the skill says to read the installed source before choosing (AIE-R11).

Existing design for this exact route: NS-49 level 2, `BL-298` (size L; split into BL-1300 to BL-1304 [R docs/BACKLOG.md:6207-6241]), Drop C [R docs/BACKLOG.md:4058].

### 1.6 What Route A gives the founder

The screenshots' experience, nearly whole, for the price of one button, and with no photo-library permission at all. It cannot be made calmer, smarter or baby-specific than Apple made it, and it gives no Recent shelf of our own on the tab. It is the fastest route to "do what this does".

## 2. Route B: our own PhotoKit read, limited access honoured

Existing design: NS-51 [R 27-photo-moments-and-media.md], BL-1019 (spike, module, index, nudge; size L; blocked on BL-1001, counsel and BL-961) [R docs/BACKLOG.md:4209], BL-877 (index store; size M), BL-853 (suggest days on open), BL-874 (chooser) and spikes BL-843, BL-871, BL-872.

### 2.1 What a read can and cannot do, verified

- Authorisation: `authorizationStatus(for: .readWrite)` and `requestAuthorization(for:handler:)` report `limited`; the older no-argument forms "return authorized when the user authorizes your app for limited access only", so they must not be used [V https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md].
- A usage description is required: "Attempting to access the Photos library without a valid usage description causes your app to crash" (key `NSPhotoLibraryUsageDescription`) [V same page].
- Apple's timing advice: "Avoid making PhotoKit calls when your app first launches ... make these calls in response to direct user action" [V same page]. A button on the tab is a direct action. A status read at launch is a query, but I did not find Apple saying it is free of side effects, so the tab should read status only after first paint (UNVERIFIED).
- Limited library: "You can't create or fetch user albums" when limited [V same page]. Our moments need dates only, so this costs nothing.
- Fetch: assets can be filtered and sorted on `creationDate`, `mediaType`, `mediaSubtypes`, `isFavorite`, `isHidden` and more, with `fetchLimit` and `includeAssetSourceTypes` [V https://developer.apple.com/documentation/photos/phfetchoptions.md]. A date-window fetch with a sort and a limit is therefore supported. The same page lists no location key for the predicate.
- Thumbnails: `isNetworkAccessAllowed` is false by default, and an image not on the phone is reported in the result info and not downloaded [V https://developer.apple.com/documentation/photos/phimagerequestoptions/isnetworkaccessallowed.md]. So an iCloud-only picture shows a plain box, which is what NS-51-R21 specifies. UNVERIFIED: whether the system returns a small local thumbnail for such an asset.

### 2.2 Grouping on the phone

Proposed [A, consistent with NS-51-R5 to R7]: Swift fetches only a window (the last 90 days, newest first, with a fetch limit), reads each `creationDate` and `localIdentifier`, and hands JavaScript a compact array of identifier and epoch seconds. No pixel, location, name, album, caption or classification is read (NS-51-R5). The moment rule is a pure function in `packages/core` (BL-859 shape; NS-51-R7: a local day with at least 5 pictures, or 4 within 3 hours, or at least 1 on a birthday, month-age day or a marked day; numbers ASSUMED until a spike). Grouping by local day uses the phone's time zone; the zone-change case is a device row. A moment keeps at most 6 identifiers (NS-51-R6).

The tab shows the newest moment only, never a list of past ones, a count or a gap (NS-51-R8, R12). This is a real difference from the screenshots, which show Recommended and Recent lists. A Recent list of our own is a product reversal of "no list, no count" and of "no older backlog is swept, so no day is ever missed" (NS-51-R7); it needs the founder.

### 2.3 Thumbnails in memory

Do not send image bytes through the bridge. Proposed [A]: a native thumbnail `View` in the library module takes an identifier and a size, asks the system image manager for a small image with network access off, draws it, and writes nothing to disk. The unlocked-only rule, the opaque box before the app-switcher snapshot, and `accessibilityIgnoresInvertColors` are existing rows (NS-51-R25, NS-49-R30). A collage of 3 or 4 thumbnails is drawing, not analysis. A face-aware crop or "best photo" pick is not allowed (NS-51 section 3, "Not in scope").

### 2.4 The moment index store (BL-877)

BL-877 describes `memory-library.db` with no per-asset row, no finer-than-day time and no place finer than a city key [R docs/BACKLOG.md, BL-877]. NS-51-R6, the later locked card, allows up to 30 moments each with at most 6 identifiers, L4, in its own file in Application Support, excluded from backup (set and read back), per account, never synced [R 27-photo-moments-and-media.md, NS-51-R6]. The two disagree about identifiers. I recommend NS-51's shape on BL-877's mechanics (backup flag read back, protection class, rebuild, wipe, distrust of a restored index), and `data-architect` records the reconciliation. The index is a cache: if it is lost, a rebuild from the dates costs one fetch.

### 2.5 Performance on a 20,000-photo library

UNVERIFIED in full: I read no Apple figure for fetch time or memory and ran nothing. What the design does to keep it small [A]: a date-window predicate and `fetchLimit` rather than a library walk; no per-asset retention; thumbnails only for the visible moment (at most 6); all PhotoKit work off the main thread on a serial queue like `scribe-photo`'s re-encode queue; no change observer while closed. Budgets that apply: cold start p50 1.2 s and p90 2.0 s on iPhone SE 3 with "no awaited network or model load on launch" (A-NFR-001, A-NFR-002) and first-run screens interactive within 300 ms (B-NFR-008) [R the mobile charter]. So the tab paints from static content first and the library work starts after first paint. Proof is a device spike (section 4, D3): a synthetic 20,000-asset library on an SE 3, timing the fetch and the index build, with a pass bar written before the run.

### 2.6 Background limits

None are used. `UIBackgroundModes` stays forbidden without a founder decision (BL-864; skill section 4), Q-PM-8 is closed "No" (no background refresh for moment nudges), and NS-49-R25 and NS-51-R29 scan for a background mode or a background observer [R 27-photo-moments-and-media.md]. So the index is built and refreshed only when the app is in front, with one catch-up per foreground session (BL-853). A weekend's pictures cannot prompt on Monday unless the app was opened since. What iOS actually does in the background is BL-872, a 14-day three-phone study, needed only if the founder wants BL-875.

Limited access and new pictures: whether a picture taken after the parent chose a limited selection is visible to a fetch is UNVERIFIED; that is BL-871. Apple says the system adds assets an app creates to the limited selection [V the enhanced privacy page], which does not cover pictures the camera makes. If new ones are not visible, a limited parent sees only the pictures they chose, and the tab's copy must say so plainly (BL-871's own fallback) or the moments are Full access only.

### 2.7 Places and maps under Route B

A place name and a map tile need `PHAsset.location` and reverse geocoding or map tiles. Q-PM-5 closed with no place read; BL-845's scan bans `CLGeocoder`; a map tile fetch is a network call (UNVERIFIED which MapKit calls use the network). Offline option on file: a bundled city table and a city key (BL-844, needs-decision NX-39 D4, default bundled) [R docs/BACKLOG.md, BL-844], which still needs a location read the founder closed. So Route B shows a date line, and Route A is the only path to a place name, and only for a suggestion the parent chooses.

## 3. What the tab can show with no library permission

Everything here reads data the app already holds or computes, so the pre-permission view and the Denied and Restricted views are full views, not an empty wall. Existing owners are named so nothing is duplicated (R-IA-2).

| Block | Source on the phone | Exists today | Notes |
|---|---|---|---|
| Days the parent marked, typed occasions | NS-46 days store and the typed-occasion row (BL-855 P4a) | NS-46 is Drop B, BL-855 blocked [R docs/BACKLOG.md] | Typed by the parent; stored on the phone |
| Month age and birthday days | `packages/core` age math (ADR 0035), the child's date of birth | Yes (`tonightStageLabel` and the age function) [R apps/mobile/src/app/(tabs)/index.tsx] | "A day" is a date match with no claim about what happened |
| A year ago today, a month ago | Our own letters | `resurfaced(...)` already drives Home's month-ago line [R (tabs)/index.tsx lines 200-210] | One surface per fact (R-IA-3): the tab links to the letter, Home keeps its slot |
| Pictures the parent already picked | `entry_media` and the Book's Photos lens (NS-01) | Photo lane PRs #835 to #840 are open and serial [R docs/agents/CLAIMS.md; READINESS 2.14]; the photo flags ship off in Build 13 | Nothing before those merge |
| Reflection prompt cards | Our 111 prompts in `packages/content` and prompt selection in `packages/core` | Yes | These are our own prompts. They are not Apple's Reflection items |
| Value props | Static copy and drawings | No | Needs `content` words and `design-systems` art; each public claim maps to a code test or is not made (PRINCIPLES 14) |

Not available without a library read: any moment made of pictures, a collage, a count. Not allowed at all: a count of unwritten days, a streak, "best" or "memories" (NS-51 Not in scope; CLAUDE.md content rules).

## 4. The permission states and how the tab reacts

PhotoKit reports five access states: not determined, restricted, denied, authorized and limited [V https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md, the code block listing each case]. The standalone enum page would not load for me, so the per-case wording below comes from that article's comments, not the enum page.

| State | What it means (Apple's comment) | Tab reaction (PROPOSED) |
|---|---|---|
| notDetermined | "The user hasn't yet authorized" | Value props and the section 3 blocks. One plain sentence and one button, "Allow access" (words by `content`). Only the tap calls `requestAuthorization(for: .readWrite)`. Where Route A is present, a no-permission "Recent days" capsule sits beside it |
| limited | "The user authorized this app for limited Photos access" | Works on the selection. Moments from the selection; if it is small, the section 3 blocks fill the space and nothing says so. A quiet "Choose which pictures" control presents the limited picker. Never "limited is worse" (CL-046) |
| authorized | "The user authorized this app to access Photos data" (full) | Same as limited, plus the album choice (NS-51-R14) |
| denied | "The user explicitly denied" | Section 3 blocks; one calm line and an "Open Settings" control, inside the tab only. No second system ask (the system does not re-prompt, Apple: "the system remembers their choice and won't prompt them again") [V same article]. Nothing on Home |
| restricted | "The system restricted this app's access" (my gloss: parental controls or device management; the article's comment says only "restricted") | Same as denied but with no "Open Settings", because the parent cannot change it. Route A is unaffected, since it needs no PhotoKit permission (UNVERIFIED for a restricted device) |
| authorized but nothing recent | Not a status | Section 3 blocks only; no line says there is nothing |

The tab re-reads status when it comes to the front, because the parent can change it in Settings at any time [V same article, "the user can change this choice at any time using the Settings app"].

### 4.1 Offering the Limited picker

Verified: `presentLimitedLibraryPicker(from:)` exists from iOS 14; it "does nothing" if the app is not in limited mode; by default the system shows its own "update your selection" prompt once per app life cycle, which is suppressed with the Info.plist key `PHPhotoLibraryPreventAutomaticLimitedAccessAlert`; from iOS 15 a form with a callback returns the newly chosen identifiers; changes fire `PHPhotoLibraryChangeObserver` [V https://developer.apple.com/documentation/photos/phphotolibrary/presentlimitedlibrarypicker(from:).md, and the enhanced privacy article]. This settles one line in the card: NS-51-R4 says the key name is "UNVERIFIED, read from a screenshot only"; the key name is now read from Apple's page. The plan is the one NS-51-R4 already has: suppress the automatic alert, present the picker only from the tab's own control, and observe changes only while the app is open.

## 5. Making this tab the initial route in Expo Router

### 5.1 What the app does today [R]

- Root: `export const unstable_settings = { initialRouteName: '(tabs)' }` (`apps/mobile/src/app/_layout.tsx:51`). Editing the boot wiring in that file is outside this role's remit except in a task that owns it.
- Tabs: JS tabs `index` (Home, "Tonight"), `book`, `you` (Me) in `apps/mobile/src/app/(tabs)/_layout.tsx`. `test/tab-bar.test.ts` pins `SCREENS` to exactly `['index','book','you']` and the Large Content Viewer title on every tab.
- First run: the first-run guard is inside Home: `if (room.family === null) return <Redirect href="/onboarding" />;` (`(tabs)/index.tsx:215`). Onboarding finishes with `router.replace('/')` (`onboarding.tsx:298, 684`).
- Contracts: `TONIGHT_HREF = '/'` with the comment "always Tonight, the root of the app" (`lib/resilience/not-found.logic.ts`); `isCaptureRoute` matches `/listen`, `/review`, `/read-together` and nothing else; `test/resilience.test.ts` asserts `TONIGHT_HREF` is `'/'` (line 96) and that `'/'` is not a capture route (lines 91 to 94).
- Sites that use `'/'` to mean Tonight: `read-together.tsx:108` (`dismissTo('/')`), `onboarding.tsx:298, 684`, `+not-found.tsx`, `+native-intent.tsx:49` (a capture link is sent to `TONIGHT_HREF`), `invite/new.tsx:73`, `(tabs)/book.tsx:427` (`navigate('/')`, the empty Book's "write" button), `lib/auth/ui.tsx:66`, `lib/resilience/recover-to-tonight.ts`.

### 5.2 Three ways, with cost

| Option | What changes | Cost | Risk |
|---|---|---|---|
| O1: add `moments` as a fourth screen, keep `index` as Home, and make it the first tab by `initialRouteName` on the tabs | `(tabs)/_layout.tsx` and a new screen file. `'/'` still means Home, so `TONIGHT_HREF`, `isCaptureRoute` and `resilience.test.ts` are untouched | About M. Test edits: `tab-bar.test.ts` SCREENS, `you-tab-states.test.ts`, `transitions.test.ts` line 144-191 (tabs layout reads), content tab-label tests | Whether `initialRouteName` makes a cold launch with no link open that tab, when the URL `'/'` matches `index`, is UNVERIFIED (I did not read Expo Router's source; the clone has no `node_modules`). If it does not, O1 fails and the choice is O2 |
| O2: the new tab is the `index` route and Home moves to a new file (for example `tonight`) | `'/'` becomes the landing; every site above that means "Tonight" must move to a new constant, for example `HOME_HREF = '/tonight'` | About L. About 8 call sites, the constant and its comment, `resilience.test.ts` line 96, the Maestro flows E2E-03, E2E-04 and E2E-15 that assume Home [R apps/mobile/e2e/flows/], tab-bar and transitions tests | A site missed silently sends a capture link, an onboarding finish or a not-found recovery to the Moments tab. The first-run guard must move with Home or be shared |
| O3 (recommended if the founder rules for a landing tab): O1 plus a separate `LANDING_HREF` used only for cold launch and onboarding finish, with `TONIGHT_HREF` left as `'/'` | As O1, plus one new constant and its test | About M | `'/'` and "landing" differ, so the tests must say which is which |

Whichever option: the first-run guard must run on the landing tab too, or a new install that lands on Moments skips onboarding. Proposed: lift the guard into one shared hook that every tab screen calls, tested once (`test/resilience.test.ts` style source scan: "every tab root runs the first-run guard"). The `isCaptureRoute` contract is unchanged by any option, since `/listen`, `/review` and `/read-together` do not move; what changes is where a capture link is sent after being refused, and that destination should stay Home (Say), not Moments. `+native-intent.tsx` and `recover-to-tonight.ts` are the two places to keep on Home.

### 5.3 Other costs of a fourth tab

The tab bar is a single declared set today with its comment "the bar is the same three items whatever the build" [R (tabs)/_layout.tsx]. A fourth item needs: a Phosphor icon and a label from `packages/content` (`en.tabs`; `packages/content/test/tab-labels.test.ts` will need its list updated by `content`); the Large Content Viewer title; the `you` tab's `headerShown` pattern kept; `ReminderPrimeAsk` and `ask-sequencer.logic.ts` `isCalmSurface` (`segments[0] === '(tabs)'`) re-checked; screenshots, the store listing and the website's three-tab scenes (FUNCTION-TRACE NR-10) redrawn; NS-33 screen set and the IA audit updated by `design-systems` and `product`. The words: the founder offered "explore etc or suitable word". "Moments" is the name NX-42 used and the README struck; "Days" is already the NS-46 page name; "memories" and "best" are barred by NS-51. The final word is for `content` against the BRAND glossary, which I did not read for this note.

### 5.4 Second addendum: the tab need not be the default, and the moment signal should drive nudges

Founder, 20 Nov (as relayed): the tab need not be the default; second or centre is fine; and the moment signal should also drive push and email nudges. This removes most of the section 5.2 cost. If the tab is not the landing tab, `'/'`, `TONIGHT_HREF`, the first-run guard and `isCaptureRoute` do not change at all, and O1 and O3 collapse to "add one screen". The landing question (C2) falls away unless the founder re-opens it.

#### Tab position options

Expo Router's JS tabs here are declared as ordered `<Tabs.Screen name=...>` children in `(tabs)/_layout.tsx`, and `test/tab-bar.test.ts` reads that order from source [R]. I assume bar order follows declaration order, the react-navigation default; I did not read Expo Router's source (UNVERIFIED), so spike D6 below is a ten-minute check.

| Position | Bar | Cost | Notes |
|---|---|---|---|
| Second of four | Home, Moments, Book, Me | One `Tabs.Screen` line, an icon, a label from `content`; edit `tab-bar.test.ts` SCREENS to `['index','moments','book','you']` and the Large Content Viewer loop; `you-tab-states.test.ts` and `transitions.test.ts` re-read; no route or `'/'` change | Home stays the first tab and the root, so first-run and the Say verb are untouched. Moments sits beside Home, which suits a surface that leads into Say. Recommended |
| Third of four | Home, Book, Moments, Me | Same cost | Keeps Home and Book (Say and Read) adjacent; Moments is closer to Me. Equal on cost; a design call for `design-systems` |
| Centre of five | needs a fifth tab | Not feasible with what exists: there are three tabs and the Moments candidate makes four. A fifth would be a surface the founder has refused (Family: never a tab; Share: refused as C-37 in `12-parked-and-not-built.md`) | Not recommended unless the founder names the fifth |
| Raised centre button (Say) with Moments beside it | A custom centre action | Needs a custom tab button, which collides with "hand-roll a component a listed library already provides" and with "Only Home starts a letter", and a bar that is no longer a tab bar for VoiceOver, Large Content Viewer and the 44 pt checks | Not recommended |

A tab-bar badge or dot for "a moment is waiting" is a count in disguise and is barred by NS-51-R8 and R12 (no count, no gap); I recommend none.

#### Nudges from a moment: what is possible

Verified: iOS delivers a local notification the app scheduled earlier, by a calendar, time-interval or location trigger, and "If the delivery of the notification occurs when your app isn't running or in the background, the system interacts with the user for you"; a scheduled request stays "until its trigger condition is met, or you explicitly cancel it" [V https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app.md]. That page does not say whether scheduling needs a background mode, and I found no document that says what iOS lets an app do in the background for a library change. I could not find an item labelled "ML-2" in the repo (only SEC-ML-2 in BL-843's cited list [R docs/BACKLOG.md:3191]); I treat all background behaviour as UNVERIFIED, as you instructed, and design so that none is needed.

Design with no server and no background mode [A, consistent with NS-51-R11, ADR 0030 and the shipped scheduler]:

1. The scheduling happens only while the app is running. The repo's scheduler already works this way: it "re-plans ... whenever anything that matters changes: any store write, the app coming to the foreground, and the permission changing in iOS Settings", local only, with one-off calendar triggers [R apps/mobile/src/lib/reminders/scheduler.ts header]. A moment is one more candidate the planner may rank at that moment.
2. When the app is opened (foreground), the moment index catches up once (BL-853's "one catch-up per foreground session"), the moment rule runs, and, if a moment exists, one local notification is scheduled for a later time the same day (the evening slot). The `photoMoment` source sits inside the `evening` class below `monthAge`, counts inside the one note a day, and is skipped for a quiet or hidden book (NS-51-R11) [R 27-photo-moments-and-media.md:41; ADR 0030 decisions 2 to 4]. It shares the 60-pending budget (ADR 0030, `TOTAL_MAX = 60`).
3. What is allowed when the app is only opened: reading dates (permission already held), building or refreshing the index, planning one neutral note, cancelling a pending moment note if a letter was made that day (NS-51-R13) or if the parent paused or turned the feature off (NS-51-R15, R16).
4. What is not possible: noticing pictures taken after the last open. Nothing runs when the app is closed, so a weekend of pictures cannot prompt on Monday unless the app was opened since. This is the limit NS-51-R11 and Q-PM-8 already state; the founder's wish for a signal-driven nudge is bounded by it. BL-872 would measure whether iOS gives a background run at all, and BL-875 is the flagged, off, best-effort top-up that would need a background mode; both are not assumed.
5. Words: a notification must be neutral and never name pictures on a lock screen (Q-PM-9 default, RV-2); the payload stays `{ source, kind }` only (ADR 0030 decision 6). A moment note that says "pictures from the weekend" appears only in the app. The founder's own neutral example in the card is the line Q-PM-9 refuses on a lock screen unless names are on and App lock is off.
6. Permissions: notification permission is already asked from the reminders switch only (scheduler header [R]); the moment nudge adds none and uses the existing reminders switch and its one budget.

Cost: small once BL-1019's moment rule and BL-966's `budget.ts` exist: one planner source, one class entry, one test file; about M for the planner change and its tests (2 to 3 agent-days [A]), inside BL-1019's "nudge through the chooser" scope.

#### Push and email: not from a moment

A push or an email is sent by a server. For the moment signal to drive one, the phone would have to tell our server that pictures exist on some day, or a count, or a time. That is derived library data (L4 by NS-51-R6) leaving the phone, which NS-51-R26 forbids ("nothing leaves the phone"), which `26` section 1 binds, and which would change the App Store label from "Photos or Videos: not collected" (NS-51-R30) [R 27-photo-moments-and-media.md]. Notifications also may not carry what was attached (RV-2, ADR 0033). So a moment-driven push or email is a different product decision, not an engineering switch: it needs the founder to lift X2 for this signal, counsel on the label and the privacy policy, a threat model, and a new server table whose every column is classified. I recommend against it. What stays possible and is already permitted: a push or email that does not depend on any library signal (for example the existing reminder and email catalogue, `docs/emails/CATALOG.md`), and local nudges as above. If the founder wants a server nudge anyway, the least-leaking shape is a content-free "open the app" push on a fixed schedule that carries no moment, which is not a moment nudge at all.

#### Added spike

| Id | What to learn | Maps to | Size |
|---|---|---|---|
| D6 | Tab order follows declaration order in this app's JS tabs; and, if a landing is ever wanted, whether `initialRouteName` opens a non-index tab on a cold launch with no link | section 5.2 O1 | S, simulator is enough, no iPhone needed |

## 6. Effort, in rows and agent-days

Size convention [A]: no day conversion exists in the backlog, so I use S = 1, M = 2.5, L = 5 agent-days of build and test, excluding review cycles, device time, counsel and founder hours. Treat each as plus or minus 50 percent. "Rows" are existing rows unless marked NEW.

| Piece | Rows | Agent-days [A] | Needs |
|---|---|---|---|
| T. Tab shell, landing, first-run guard, tests (O3) | NEW x3 (shell and route; guard and shared hook; tab tests and e2e flows) | 6 to 8; if the tab is second and not the landing (section 5.4), NEW x1 and 2 to 3 | A ruling on C1 and C2. `design-systems` spec and art; `content` words |
| T2. No-permission blocks (section 3) | NEW x2 plus NS-46 and BL-855 where they land | 4 to 6 | Rows exist for days and typed occasions; the tab only composes them |
| V. Value-prop view and words | NEW x2 (design, content) | 3 to 4 | Claims map to code (PRINCIPLES 14); counsel reads any privacy sentence |
| A. Route A: picker module, entitlement, scans | BL-298 split BL-1300 to BL-1304 (about L) plus NEW module PR | 8 to 11 | Device spike D1, `security-architect` read, counsel (DPLA 3.3.3(H)), entitlement in the signed plist |
| B. Route B: library module, index, rule, chooser | BL-1019 (L), BL-877 (M), BL-859 (M), BL-860 (S), BL-861 (M), BL-845 (M, ready), BL-862 (M, ready), BL-864 (S, ready), BL-853 (M), BL-874 (M), BL-878 gate | 28 to 34 | BL-1001 ruling, counsel on 5.1.1 and the label, spikes D2 to D4, BL-961 |
| N. Local moment nudge (section 5.4) | one planner source inside BL-1019 and BL-966's `budget.ts` | 2 to 3 | BL-966 merged; BL-1019's moment rule |
| Spikes | BL-843 (S), BL-871 (S), BL-872 (M, 14 days elapsed, three phones, optional), D6 (S, simulator) | 2 of work; 14 days elapsed for BL-872 | A real iPhone for all of them |

Route A and Route B share nothing in Swift and little in JavaScript; both share T, T2 and V. Route A is roughly a third of Route B.

## 7. Deployment target: 17.0 or 17.2

Today: `IOS_DEPLOYMENT_TARGET = '17.0'` [R apps/mobile/app.config.ts:44], set by D-098 for Apple's subscription store view, and `scribe-photo`'s podspec platform is 16.4 [R].

- Route A needs 17.2 for the picker and the entitlement [V]. It does not need the app's floor raised: guard with `#available(iOS 17.2, *)`, hide the capsule below it (not greyed; the NS-01-R59 and NS-49-R5 pattern), and weak-link the framework. NS-49-R28 already requires a launch test on 17.0, 17.1, 17.2 and 26 [R 21-days-cultural-photos-home.md:912]. Whether weak linking works through the Expo build is UNVERIFIED (spike D1).
- Route B works from iOS 14 for limited access [V the enhanced privacy page and the limited-picker page], so it fits 17.0 as NS-51-R20 says.
- Recommendation: keep 17.0. Raising to 17.2 reverses D-098's number for the sake of one capsule that can be hidden. I have read no share of parents on 17.0 or 17.1; that is the number the founder would need to overrule me, and a reversal of D-098 is the founder's call.

## 8. Device spikes (a real iPhone is required for each)

| Id | What to learn | Maps to | Size |
|---|---|---|---|
| D1 | A signed build with the Journaling Suggestions capability: does the entitlement come through Expo's config and signing; does the picker button present from a hosted view; what the photo URL is and how long it lives; can the types be limited to photos; does `#available` weak linking launch on 17.0 and 17.1; the consent sheet on first use; behaviour on iPad and a Mac app | NS-49-R5, R15, R28, R29; BL-298 | S to M |
| D2 | Authorisation states on a real device: notDetermined to limited to full to denied, and restricted if a managed device or Screen Time restriction is available; the automatic alert suppressed; the limited picker from our control; status after Settings change | NS-51-R3, R4, R18, R19 | S |
| D3 | A synthetic 20,000-asset library on an iPhone SE 3: date-window fetch time, index build time, memory, thumbnail draw time, cold start with the tab as landing (p50, p90) | A-NFR-001, A-NFR-002, B-NFR-008, NS-51-R36 | S |
| D4 | Limited and new pictures (BL-871); iCloud-only thumbnail with network off (NS-51-R21); time zone change (a moment's day) | BL-871, NS-51-R7, R21 | S |
| D5 | Background behaviour for 14 days (BL-872), only if BL-875 is wanted | BL-875 | M |

I cannot run any of these; each is a `human` task for the founder's phone. D1 and D2 can share one session if the build carries both the entitlement and the usage string, which only a development profile may carry (see section 10).

## 9. Recommended build order

Principle: ship something real in the first public store build with no new permission string and no entitlement, then add each route behind its own ruling. "First public store build" I take to mean 1.0; Build 13 is Drop A (NS-48 phase 1 only) and carries none of this [R docs/BACKLOG.md:4058].

1. Rulings first (no code): C1 (tab), C2 (landing, and for whom), C3 (a permission ask on the tab, by tap), C4 and C5 (what the tab may show), deployment target. BL-1001 already records the level 3 reversal and can carry C3.
2. Not in Build 13. See section 10.
3. First public store build, if the founder rules C1 before freeze: the tab (second of four, Home still the landing) with section 3 content and the value-prop view; no library call, no usage string, no entitlement, so no change to the plist or the label. The "ask" button is absent in this build (it would call a permission the build does not declare, so it must not ship until the string is accepted). This is real value on day one: month-age days, birthdays, "a year ago", prompts, and the Days the parent marks. Home stays the landing; the tab is not the default (section 5.4).
4. Next: Route A behind `EXPO_PUBLIC_SUGGESTIONS` and the entitlement: it adds the screenshots' experience with no photo permission and no new usage string. It is Drop C today (after 1.0 is approved) and needs D1, counsel and the security read first.
5. Then: Route B behind its own flag and the usage string, in this order: spikes D2 to D4; BL-1019's module and moment rule; BL-877's index; the tab's ask and states (section 4); the chooser (BL-874). The background top-up (BL-875) waits for BL-872 and its own consent.

What must wait, and for what: the "Allow access" button for the usage string and counsel on App Review 5.1.1 and the label (BL-1019 blocked on BL-1001, counsel, BL-961); Route A for the entitlement, D1 and counsel; titles and places on moments for a ruling on C4; a Recent list of our own for a ruling that lifts "no list, no count"; the photo shelf for the photo lane (#835 to #840); anything that needs a background mode.

Honest note on "ask for permission": the founder's addendum says to get the permission when it is missing. Apple's own guidance is to ask on a direct action and never at launch, and the "limited" answer must work as well as "full" (Q-PM-1, CL-046) [R 27-photo-moments-and-media.md]. A button on the landing tab, tapped by the parent, meets that. A prompt that appears by itself, or a landing screen that blocks the app until access is granted, does not, and App Review 5.1.1 is the guideline the repo cites for it; I did not read it, so counsel must confirm. Every other tab and the pre-permission view must stay fully usable with access denied.

## 10. Risks to the Build 13 critical path

Build 13's critical path is reminders (BL-966 then BL-943, then a device run with a time-zone change), account (PR 879 and BL-922, then BL-978, then a two-phone device row), words (BL-925 then BL-926 then BL-977) and the founder's release steps [R docs/product/READINESS-20nov.md:595-612]. None needs this tab. The risks are about not putting it in the way.

| # | Risk | How it bites | Mitigation |
|---|---|---|---|
| R1 | The tab touches `(tabs)/_layout.tsx` and four test files that other Build 13 work reads | Merge conflicts and re-review on Reminders (BL-943 plans notifications on tabs) and the ask sequencer | Keep the tab out of Build 13; open the first tab PR after the Build 13 cut or after BL-943 merges |
| R2 | A native module PR adds a macOS compile of about 75 minutes to a queue the six serial photo PRs already use (plan 17 section 2.1) [R READINESS 2.14] | Delays #835 to #840 and the Build 13 candidate if both are queued | Route A and B module PRs open only after the photo lane merges |
| R3 | A linked module ships its permission or entitlement calls in every build; a call with no purpose string can bring ITMS-90683 at upload [R skill section 4] | A rejected upload during the Build 13 cut | No usage string or entitlement is added before the founder accepts the string; the module's scan proves the binary carries no permission call until then (the #834 pattern) |
| R4 | Plist and entitlement change in a build that the preflight lint (BL-864, ready) and the B13-CHECKS step check | A red check on the cut | Add the capability and string to a development profile only until the flag turns on in `production`; `security-architect` reads the delta |
| R5 | A landing change moves the first-run guard | A new install skips onboarding; the Build 13 first-run device rows (NS-39) fail | Section 5.2: one shared guard, one test, before any landing change |
| R6 | Cold-start budget | A landing screen with PhotoKit work on the critical path can break p50 1.2 s or p90 2.0 s on an SE 3 | Paint static content first; library work after first paint; D3 measures it |
| R7 | The founder's phone and hours are the device queue for the G4 runs | D1 to D4 compete with Build 13 device rows | Batch D1 to D4 into one session after the Build 13 cut |
| R8 | Ruling churn: C1 to C5 reverse locked cards (NS-51 rev 2 was locked 20 Nov) | Rows and tests written against the old text become wrong | One errata batch (the E-row pattern in `18-errata-after-lock.md`) before any build row is set `ready` |
| R9 | Store assets, website and Help say three tabs | A claim that no longer matches the app | A listing and website row in the same release as the tab |
| R10 | Apple's picker may show workouts, songs and contacts to a parent inside our flow, and may not be restrictable | A brand and trust issue found late | D1 answers it before any Route A copy is written |

## 11. What I recommend the founder is asked

1. One tab or none: is a fourth tab, reversing the 11 Nov and D-161 draft ruling, wanted for the first public build?
2. Position and landing: the founder said the tab need not be the default. Second of four (Home, Moments, Book, Me) with Home still the landing is my recommendation and removes the section 5.2 cost.
3. Route: is "Apple's own picker behind a button" (Route A) acceptable as the screenshots' experience, given it cannot be restyled or embedded, or is a Recent shelf of our own (Route B) the point? Route B's shelf is limited to dates, pictures and the newest moment unless the founder lifts "no list, no count", "no title" and "no place".
4. Ask: is a tap-only "Allow access" on the tab accepted in place of the Me-only row (NS-51-R1)?
5. Floor: stay at iOS 17.0 (recommended) or raise to 17.2.
6. Nudges: local only, planned when the app is opened (my recommendation), or a server push or email driven by the moment, which means a library-derived signal leaving the phone and a label change (I recommend against).

## 12. What I did not do

I changed no code, no test and no backlog row. I did not merge. I did not read the BRAND glossary, DATA_CLASSIFICATION, Expo Router's source, App Review guideline 5.1.1, the Developer Program License Agreement, or any iOS adoption figure. I could not load the `PHAuthorizationStatus` enum page; the five states and their meaning come from the enhanced-privacy article's code comments. Apple's documentation was read as markdown, which may differ from what a developer sees in the web view.
