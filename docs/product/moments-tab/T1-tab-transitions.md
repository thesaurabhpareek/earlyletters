# T1: Moving between tabs, and how the tab bar behaves, with Moments as the fourth tab

Status: PROPOSED. Written 21 Nov 2026 by transition lead T1 for the Moments tab programme. Docs only. Nothing here is a ruling until the founder signs, and every place it overturns an earlier ruling is marked REVERSAL and is the founder's to decide. Branch `wip/moments-t1`. No PR.

Public name: `{app}`. Family in examples: Asha. Words a parent reads are PROPOSED and go to `content`; this file never ships a word.

## 1. Purpose and scope

The founder wants a new tab, working name Moments, that brings a parent back every day. This file answers one slice: how a person moves between Home, Moments, Book and Me, and how the bar that holds them behaves.

In scope:
- Transitions between the four tabs, and between a tab and the pages that open over it.
- The tab bar with a fourth tab: paper bar now, system bar later, glass only on controls, at most three glass surfaces.
- The position question: Moments second, centre of five, default, or inside Home. Each with its transition and state consequences.
- Badge and dot rules.
- Scroll position and state restore.
- Deep links from a local push and from an email that land on Moments.
- Cold start when photo access has not been given.
- Reduce Motion, Reduce Transparency, Increase Contrast, Dynamic Type and VoiceOver variants.

Out of scope (other leads own them): what Moments shows, its cards, the permission words, the route A or B decision, the nudge copy and budget numbers, the engagement loop. I cite them only where a transition depends on them.

The one-line answer: keep the tab swap as the platform's own cut with no motion of ours, put Moments second (Home, Moments, Book, Me), show no badge and no dot by default, and let every link open the tab and nothing else.

## 2. Inputs read

Read this session, in the repo at `develop` (clone made 21 Nov 2026):
- `/home/claude/moments-brief.md` (brief of record, founder direction, decisions of record).
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md`: rules R1 to R5, the build order, the spike list (5.1), rulings 28, 30, 32, 34, 35 in section 8.
- `docs/design/MOTION.md`: 5i tabs and sheets, 5l moving between rooms (rules 1 to 6, the `routeTransitions` table, rows 1 to 12, first run opens directly R1), the haptic policy.
- `docs/design/IA-FINAL-20nov.md`: section 3 map, section 4 "The three tabs", the "never a place" line.
- `apps/mobile/src/app/(tabs)/_layout.tsx` (JS tabs, paper bar, BAR 58 pt, 25 pt Phosphor icons, 13 pt labels, Large Content Viewer, no haptic, no transition).
- `apps/mobile/src/app/+native-intent.tsx` (deep link redirect, links never open the microphone or a draft).
- `apps/mobile/src/app/_layout.tsx` (`unstable_settings = { initialRouteName: '(tabs)' }`, `Stack.Protected guard={tabs}`, `AppLockLayer`).
- `apps/mobile/src/lib/transitions.logic.ts` (`ROUTES`, `Move`, `tabsInStack`).
- `apps/mobile/src/lib/reminders/scheduler.ts` (local notification tap handler at lines 267 to 275).
- `docs/product/prd/27-photo-moments-and-media.md` (NS-51 rows R16, R19, R23, R24; the permission and label notes).
- `docs/product/prd/21-days-cultural-photos-home.md` (NS-46-R15: no count, no warning style, no badge).
- `docs/product/prd/10-reading-and-family.md` lines 894 to 899 (E79: no server push in 1.0; one a day cap).
- `docs/design/NOTIFICATIONS.md`.
- Apple HIG, Tab bars, fetched as Markdown on 21 Nov 2026 from `https://developer.apple.com/design/human-interface-guidelines/tab-bars.md` (change log newest entry 8 Jun 2026).

Sibling leads: branches `wip/moments-a1` to `a3`, `d1` to `d5`, `p1` to `p5` and `x2` exist on the remote. I did not read them (the brief says link, not duplicate, and they were being written in parallel). Where I assume something about them it is stated in section 9. The privacy, feasibility and concept docs named in the brief were not on `develop` when I looked.

Blocked: React Navigation's bottom tab page (`reactnavigation.org/docs/bottom-tab-navigator`) was refused by the fetch tool, so nothing about lazy mounting, `freezeOnBlur`, `popToTopOnBlur` or tab-press scroll-to-top is verified (section 10).

## 3. What is true today (from code)

1. Three tabs, always: Home (`index`), Book (`book`), Me (`you`). Same three whatever the build. Test `test/tab-bar.test.ts` is named in the layout comment.
2. The bar is `expo-router/js-tabs`, a paper bar with a hairline, height `BAR + bottom inset`, 13 pt labels that do not scale with Dynamic Type; on iOS a long press shows the Large Content Viewer. No haptic.
3. A tab switch has no animation of ours (MOTION 5i, row 6). The lamps share `persistKey="tabs"`, so the arriving tab starts at the light the last one left and settles over `lamp.returnMs`.
4. Content never re-enters on a tab switch. Tonight's stagger plays on a cold launch only. The first Book view per session settles (opacity 0.6 to 1, y 6 to 0).
5. First run mounts no tabs behind it (`tabsInStack`, R1). Tabs join the stack once a book exists and stay for the session.
6. Pushed reading pages (a letter) hide the tab bar (ruling 32). Review and Listen are full-screen modals.
7. A local notification tap calls `router.navigate('/')` or `router.navigate('/book')` inside `try`. On a cold start the router may not be mounted, the call is swallowed, and "the app opens on Tonight anyway" (scheduler.ts comment). There is no cold-start read of the tap in the lines I read (UNVERIFIED that none exists elsewhere).
8. Links go through `redirectSystemPath`. Capture routes (`/listen`, `/review`, `/read-together`) are redirected to Home. Any error returns `/`. There is no link kind for a tab.
9. No tab shows a badge today. MOTION 5e says "No tab badge" for the arrival of a filed letter.

## 4. Requirements and design

Test layers: `unit` (pure logic in `lib/`), `e2e` (simulator, Maestro style), `device` (a real iPhone, including SE 3), `review` (design review with evidence file). The design language says simulator is not device evidence; I mark which rows need the device.

### 4.1 The four-tab bar

**MT-T1-R1. The bar is four items in a fixed order and never changes shape.**
Given the app has a book, When any tab screen is on show, Then the bar shows Home, Moments, Book, Me in that order, each a single-word label, in every build and under every permission state. A tab is never disabled or hidden, even when it has nothing to show (HIG: "Don't disable or hide tab bar buttons, even when their content is unavailable... If a section is empty, explain why").
Layer: unit (`test/tab-bar.test.ts` extended to four names and the order) and e2e.
Note: this is a REVERSAL of the three-tab ruling in `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` and the "always these three" line in `IA-FINAL-20nov.md` section 4. The founder owns it.

**MT-T1-R2. The bar stays paper in 1.x; glass is not added to it.**
Given the build order in DESIGN-LANGUAGE-V2 section 5, When Moments ships before the SDK 58 upgrade and the tab bar spike, Then the bar is the existing paper bar with a hairline, `c.bg`, 25 pt icons and 13 pt labels, with a fourth item; no blur, no glass, no custom fill. The system bar replaces it later through the M3 spike, and then the system draws it (never painted by us).
Layer: review.

**MT-T1-R3. The four items fit the smallest phone.**
Given an iPhone SE 3 (375 pt wide), When the bar draws four items, Then each item has about 93 pt of width (375 divided by four, before any safe-area side inset), every target is at least 44 pt tall and wide, and the label is one word at 13 pt that is never truncated. Five items would have 75 pt each (same arithmetic). The label "Moments" at 13 pt must be measured on device; I have not measured it (UNVERIFIED, guess: it fits).
Layer: device (SE 3), unit for the target size.

**MT-T1-R4. Large Content Viewer and VoiceOver cover the fourth tab.**
Given text size is AX5 or VoiceOver is on, When the person long presses a tab, Then the Large Content Viewer shows that tab's icon and label (`LARGE_CONTENT(title)`, as for the three today). VoiceOver reads "Moments, tab, 2 of 4" in bar order and never skips a tab (the standard tab trait). Labels are not scaled by Dynamic Type (HIG, as built).
Layer: device, review.

**MT-T1-R5. Glass budget.**
Given the design language allows at most three glass surfaces on one screen and none on content, When the screens are drawn, Then the count per screen is as in this table, and any new glass on a Moments screen needs this table changed first.

| Screen | Glass today (paper bar) | Glass after the system bar spike |
|---|---|---|
| Home | 0 | 1 (the bar) |
| Moments | 0 | the bar, plus at most two controls: the For you and Recent switch if it is a system glass control (UNVERIFIED that the system switch is glass), plus at most one floating control |
| Book, Me | 0 | 1 (the bar) |

Cards, collages, map tiles and any picture are content and never glass. A control floating over a picture uses the clear glass with the 35 percent dim (ruling 28) and the solid `glassFallback` under Reduce Transparency, Increase Contrast and iOS before 26.
Layer: review (count on every Moments screen).

**MT-T1-R6. The tab bar hides only where a reading page covers it, and never on Moments itself.**
Given the person is on Moments, When they scroll, Then the bar stays put (no minimise on scroll in 1.x; the spike decides it later, ruling 32; Expo says it does not work with `FlatList` lists, and Moments is a list). Given the person opens a day's page from Moments, When it pushes, Then it follows ruling 32 as a letter page does: the bar hides, Back returns, the bar returns with it. HIG says to keep the bar visible except under a modal; our ruling 32 departs from that on reading pages and I record the departure, I do not widen it.
Layer: e2e.

### 4.2 Transitions between tabs

**MT-T1-R7. A tab switch is the platform's cut. Nothing of ours moves.**
Given the person taps another tab, When the switch happens, Then no slide, no fade of content, no haptic (policy: "a haptic marks an outcome, never a navigation") and no sound play; controls are hittable from frame one. This is MOTION 5i and row 6, unchanged, and it covers Moments.
Layer: e2e (no animation set on the tab navigator), review.

**MT-T1-R8. The light carries across; Moments gets its own light.**
Given the lamps share `persistKey="tabs"`, When the person goes from any tab to Moments, Then Moments starts at the tone and level the last tab left and settles to its own over `lamp.returnMs`. Moments needs one row in the lamp table (`lamp.logic.ts`, the table at MOTION 5k): a still, calm tone and a level at or below the Book's 0.6, so it never out-shines the Book. The exact tone and level are a token for `design-systems` to set from device measurement; I give an order, not a number (the Family tab's 0.4 and the Book's 0.6 are the only values I read).
Layer: unit (the table has a `moments` row and it is not above Book), device.

**MT-T1-R9. Content does not re-enter on a return, and Moments has one first-view settle.**
Given Moments is opened for the first time in a session, When it first shows, Then its content settles as the Book's does (opacity 0.6 to 1, y 6 to 0, the existing `G` spring or token, no new number), once. Given a later switch back to Moments, Then no content moves. Reduce Motion: the settle becomes a `fadeMs` cross-fade, no travel.
Layer: unit (settle once per session flag), e2e.

**MT-T1-R10. Mounting Moments never blocks the swap.**
Given the first visit to Moments (the tab is mounted lazily, UNVERIFIED), When the tab is tapped, Then the title and paper frame are on screen at once, the bar already shows Moments selected, and content fills under a `fadeMs` fade. No spinner, no skeleton shimmer, no "loading your pictures" line. If a library read is slow, the tab shows the value state or the For you items it already has (see R22) and adds the rest without moving what is there.
Layer: device (SE 3, a large library), e2e.

**MT-T1-R11. Re-tapping the current tab.**
Given the person taps the tab they are already on, When the tab is Moments and the list is scrolled, Then it scrolls to the top without animation of our own beyond the platform's scroll; when already at the top, nothing happens. For Home, Book and Me the same rule applies. The platform's tab-press behaviour for JS tabs is UNVERIFIED (the React Navigation page was blocked); the row says what must be true and the test settles who provides it.
Layer: e2e, device.

**MT-T1-R12. Inside a tab, the pushed pages are the platform's.**
Given the person opens a day's page from Moments, When it opens, Then it is a platform push in `routeTransitions` (a new `ROUTES` row, move `push`, or `cardToPage` if design chooses the card-grows-into-page move for pictures; that choice is design lead D's, I give the default `push`), and the swipe from the left edge goes back. A letter opened from Moments (a year ago, from our own letters) uses row 7 as from the Book.
Layer: unit (`transitions.test.ts` row exists), e2e.

**MT-T1-R13. Moments to Home to start a letter (J4 kept).**
Given a Moments card offers to write about something, When the person taps it, Then the app switches to the Home tab (the platform's cut), Home shows the chosen starting question or picture in its normal slot, and the question card carries the `accentSoft` wash that fades over 1.6 s (the existing arrival wash, MOTION 5e) so a content change after a silent swap is not disorienting. Speak and Type stay on Home only. Nothing starts recording.
Reduce Motion: the wash shows as a still tint that fades out over `fadeMs`.
Layer: e2e.
Note: this keeps J4 (only Home starts a letter). Route Y below reverses J4.

**MT-T1-R14. Moments to a capture (J4 reversed, option only).**
Given the founder reverses J4 so capture can start from Moments, When the person taps Speak on a Moments card, Then Listen opens as a full-screen dissolve exactly as row 1 (fullScreenModal, `animation: 'fade'`, `route.dissolveMs`; Reduce Motion `fadeMs`); cancel returns to Moments, with its scroll position and switch choice unchanged; Review then fades out and the Book comes forward on the new letter (row 5, `arrived=<id>`). Moments stays mounted and unchanged under all of it.
Layer: e2e.
Note: REVERSAL of J4. The founder owns it. My recommendation is R13 (keep J4) until the founder says otherwise; see section 7.

**MT-T1-R15. After Keep, the Book still comes forward.**
Given a letter is kept from a Review that was opened over any tab, When the hand-off finishes, Then the tab selected is the Book, whatever tab was under Review (row 5 and 5a are unchanged; `fileIntoMonthPlan()`). The tab the person left (Moments or Home) keeps its state.
Layer: e2e.

### 4.3 Position options and what each does

The brief's open question: second tab, centre of five, default, or inside Home. Each row says what changes in transitions and state. Arithmetic is nominal; real width is minus safe-area side insets.

| Option | Bar | Cold start lands on | Transition and state consequences | My view |
|---|---|---|---|---|
| A. Second: Home, Moments, Book, Me | 4 items, about 93 pt each on SE 3 | Home (unchanged) | Home is the only tab mounted at start (lazy, UNVERIFIED); Moments mounts on first visit (R10). Book moves from slot 2 to slot 3, so a returning parent's thumb habit changes once. First run (R1) and "Tonight's stagger on cold launch only" are untouched. `initialRouteName` stays `(tabs)` and the index route stays Home. Home to Moments is an adjacent swap, which suits "I have found a thing to write" going to Home. | Recommended |
| B. Third: Home, Book, Moments, Me | 4 items | Home | Book keeps slot 2, so no habit change for the Book. Moments sits next to Me, away from Home, so the "pick a moment, then go write" move crosses the Book. | Fallback if a habit test shows Book matters more |
| C. Centre of five | needs a fifth item; there is none: Family is never a tab (IA-FINAL "never a place") and a centre capture button is an action, which HIG says does not belong in a tab bar | n/a | Would need a new fifth place, 75 pt per item on SE 3, and breaks "one place to start a letter" unless the centre is Speak, which HIG rules out | Not recommended |
| D. Moments as the default tab | 4 items | Moments | REVERSAL of Home as the start. Cold launch mounts Moments first and Home lazily, so Speak and Type are not ready on the first frame; the first-run hand-off ("The book is open." to Tonight, lamp memory) must change to land on Moments; every launch, including a 2 a.m. one, opens on a list of pictures. With permission not given, a returning parent would meet the value state on every launch, which reads as a sales page, not a room | Not recommended |
| E. Inside Home (a section, no tab) | 3 items | Home | No new transitions at all and no bar change. At AX sizes Speak and Type go inline under the prompt (index.tsx), pushing a Moments section far down; the daily-return surface is the least visible. Needs no reversal of the three-tab ruling | Fallback if the founder will not take the tab ruling reversal |

Recommendation: A, with E as the named fallback if the SE 3 device check on label width (R3) fails, and B if a first-week test shows the Book moved too far. The founder said it need not be the default, which relaxes item 2 of the brief; D is therefore not needed.

**MT-T1-R16. Position is one constant.**
Given the order may change after testing, When the order of tabs is decided, Then it lives in one place (an ordered list in `(tabs)/_layout.tsx` fed by one constant) and in `test/tab-bar.test.ts`, so moving Moments is a one-line change with no other file touched. Deep link routes use names, not indexes.
Layer: unit.

### 4.4 Badges and dots

HIG (read): "Use a badge to indicate that critical information is available... a red oval containing white text and either a number or an exclamation point... Reserve badges for critical information so you don't dilute their impact."

Our rules are stricter than HIG: no counts, no gaps, no scorekeeping, no guilt, and NS-46-R15 already says "no badge" for Days. A new-since-you-looked dot is a gap counter in disguise.

**MT-T1-R17. No badge on any tab and no badge on the app icon.**
Given any state of any tab, When the bar draws, Then no tab carries a number, an exclamation point, a dot or a red oval, and no local notification sets the app icon badge. Moments is not an exception.
Layer: unit (the tab options never set a badge; the notification content never sets `badge`), review.

**MT-T1-R18. Arrival is shown inside the tab, once, and quietly.**
Given the person opens Moments from a push or an email, When it lands, Then the first card gets the same `accentSoft` wash as an arrived letter (fades over 1.6 s; MOTION 5e) and nothing on the bar changes. No "new" tag, no "3 waiting", no ordering by unseen. Reduce Motion: a still tint fading over `fadeMs`.
Layer: e2e.

**MT-T1-R19. If the founder wants a dot anyway (option, not recommended).**
Given the founder overrules R17, When the dot is built, Then all of these hold: it is a dot with no number; it shows only on Moments; it shows only if the parent turned on moment nudges (NS-51) and only for the current day; it clears the moment the tab is opened and does not return until the next day's signal; it never accumulates; there is no app icon badge; the VoiceOver value is a short word from `content` that does not say "waiting", "new pictures", a count or a place (ML-3); the dot is a shape plus the label, so colour is never the only signal; and the dot is never drawn on Home, Book or Me.
Layer: unit, review, device (VoiceOver).
Note: the dot is a custom drawing on the paper bar; whether the system bar can show a value-less badge is UNVERIFIED.

### 4.5 Scroll position and state restore

Constraint: the server never sees the library, and no photo, filename, album, place or date goes to logs or analytics. A scroll offset is a number, but an offset into a day list can imply a date. So nothing about Moments position is written to disk or sent.

**MT-T1-R20. State lives in memory for the session and is dropped on cold start.**
Given the person leaves Moments for another tab or for a pushed page, When they come back in the same session, Then Moments shows the same scroll position, the same For you or Recent choice and any open card exactly as left. Given the app was ended and starts again, Then Moments opens at the top on the default part, with no stored position. The scroll offset, the part choice and any open day are held in memory only; none is written to `store`, Keychain, backup, logs or crash reports. Memory pressure may drop it, and then the tab opens at the top with no message.
Layer: unit (a state holder with no persistence call), e2e, device (a memory warning).

**MT-T1-R21. Back from a pushed page restores the exact offset.**
Given the person opens a day's page and presses Back, When Moments returns, Then the list is at the same offset with no jump and no re-entry animation; the row they opened is not highlighted. The tab bar returns with Back (R6).
Layer: e2e (the Book already scrolls to an arrival row only on `arrived`; Moments must not).

**MT-T1-R22. Home, Book and Me keep their state through a Moments visit.**
Given the person went Home to Moments and back, When Home returns, Then Home is as left (draft cards in place, Speak and Type ready); the Book keeps its scroll; Me keeps its place in Settings (its pushed pages sit on the root stack, so Back goes to the Me tab). Adding a fourth tab must not unmount another. The mount behaviour of JS tabs is UNVERIFIED (blocked page), so a test proves it instead of assuming it.
Layer: e2e.

**MT-T1-R23. A changed library while away.**
Given the person left Moments and the photo library changed (a new picture), When they return in the same session, Then the list the person sees does not reshuffle under their thumb: the held list stays until they pull to refresh or leave and come back after the app was in the background. New days appear at the top without moving the visible row. No toast.
Layer: e2e.

### 4.6 Cold start when permission has not been given

The value state (our own illustrated examples with Asha, then a plain ask) is another lead's design. T1 owns how the person gets there and how it changes.

**MT-T1-R24. Opening on Moments before any permission is a screen, never a system alert.**
Given the person has never answered the photo question, When they open Moments (tap, push or email), Then the system permission alert is not shown by arrival. It shows only after the person taps the ask on the Moments screen. Opening a link, a notification or the tab can never trigger it. (Brief: "a plain ask"; K-02 is reversed by the founder's item 2, see R28; this row keeps the ask a tap.)
Layer: e2e (a launch on a Moments link shows no system alert), device.

**MT-T1-R25. Not now, then real things.**
Given the person taps Not now, When the screen changes, Then the ask card leaves with a `fadeMs` cross-fade (no slide), the For you items we can show without the library (typed days, month and age days, a year ago from our own letters, the 111 written prompts) are on screen in the same frame or next, and no line says what was declined or what is missing. The ask does not return in the session. Whether it returns in a later session is the product lead's rule; transitions need only that it never comes back inside the same visit.
Layer: e2e.

**MT-T1-R26. Granting, limiting or denying changes the screen in place.**
Given the person answers the system alert, When the app is active again, Then the screen changes by a `fadeMs` cross-fade, no travel, no confetti, no "all set"; Full access, Limited access and Denied each show real things (Limited shows only what the person chose, as the system defines it). The scroll position is at the top and the tab bar did not move.
Layer: device (the system alert is only on device; the simulator can differ).

**MT-T1-R27. Denied is not mentioned on Moments.**
Given photo access is denied, When Moments shows, Then it shows real things and does not ask again or say it is off. NS-51-R19 says the Me row is the only screen of ours that mentions it and "no re-ask, no nag". If design wants a line on Moments, that overturns R19 and is a REVERSAL for the founder.
Layer: review.

**MT-T1-R28. Reversals this file depends on (listed so the founder can see them).**
- Three-tab ruling and the "always these three" line (R1).
- J4, only Home starts a letter (R14 only, not R13).
- K-02, no permission ask during first run: not touched here. R24 keeps the ask out of first run; Moments is reached after the tabs mount (R1 of MOTION holds), so first run still has no tabs and no ask. If the founder means the ask during first run, that is a different, larger reversal.
- BL-1305 and ML-6 sit with the privacy and feasibility leads; no transition row needs them.
- R19 of NS-51 (R27, only if Moments mentions denial).

**MT-T1-R29. First run to Moments.**
Given first run finishes and the first tab lights, When the tabs join the stack, Then the first tab is Home ("The book is open." to Tonight, lamp memory at first run's last light, `lampMemory.atMount`), as today. Moments is never the first lit room after first run in option A. Given a link or notification pointed at Moments before a book exists, Then it is dropped (R33).
Layer: e2e.

### 4.7 Deep links from a push and from an email

Facts that shape this: 1.0 has no server push (E79). The only pushes are local notifications; their tap handler calls `router.navigate` and swallows errors on a cold start (scheduler.ts 267 to 275). ML-3 (from the brief): no push is created from library data, fixed text, random id, no place, photo, count or "waiting". Email can only use what the server knows (date of birth, typed days, letters made), never library signals. So a link carries no signal at all.

**MT-T1-R30. One link shape, no parameters.**
Given a local notification or an email wants to open Moments, When the link or payload is built, Then it names the tab only: a route (`/moments`, name PROPOSED, the final route belongs to mobile) in the app's scheme, and a universal link on the app's own web origin for email. No photo id, day, place, count, album, child name or letter id is ever in the link, the payload or its analytics event. The notification payload `data` is `{ kind: 'moments' }` and nothing else.
Layer: unit (link classifier accepts the tab and drops any query or fragment; payload builder test), review.

**MT-T1-R31. Landing on Moments from a cold start by notification tap.**
Given the app was not running and the person taps a Moments reminder, When the app opens, Then it lands on Moments, the tab bar shows Moments selected, and Back does nothing (Moments is a tab root). Today a cold-start tap is swallowed and lands Home (finding in section 6). The handler must read the response that launched the app (the API is UNVERIFIED in SDK 57; mobile confirms) and navigate after the router is mounted and the age gate has passed.
Layer: device (cold start from a notification), unit for the plan function.

**MT-T1-R32. Landing on Moments from a warm tap or a link.**
Given the app is open on any tab, When a Moments link is followed, Then the app switches to the Moments tab as a tab swap (R7); other tabs keep their state (R22); a pushed reading page under the tabs is left on top only if the person is in it; otherwise nothing is popped. If a day's page of Moments is open, Back from it returns to the held Moments list.
Layer: e2e.

**MT-T1-R33. A link never interrupts what a person is doing.**
Given the person is recording, in Review with unkept words, in a Write sheet, in sign-in, in a purchase confirmation or in App lock, When a Moments link or tap arrives, Then:
- recording, Review and Write: the link is dropped with no effect and no message; nothing is lost (the person's words come first);
- sign-in and purchase: the sheet stays; the link is dropped;
- App lock: the lock stays; after unlock the app opens where it was, not on Moments (a held link would be a library-adjacent intent kept on disk; it is not kept).
Given no book exists yet (first run or not started), Then the link is dropped and the app opens as it would (first run or Home). Given the age gate is not passed, Then the gate shows (the gate still comes first).
Layer: unit (a pure `planMomentsLink(state)` returning route or null), e2e.

**MT-T1-R34. A link never opens the microphone, a draft, the library prompt or Settings.**
Given any link kind, When it opens Moments, Then it opens the tab and no more. It does not start Speak, does not open Review or Write, does not show the system photo alert (R24) and does not open iOS Settings. This extends the existing rule for `/listen`, `/review` and `/read-together`.
Layer: unit (`isCaptureRoute` family test extended), e2e.

**MT-T1-R35. If the app is not installed, an email link is a web page, not a dead end.**
Given the email link is a universal link and the app is absent, When it opens in a browser, Then it shows a page on the website that says nothing about pictures, a place or a count, and offers the store link. It needs a path in the website's association file (`apple-app-site-association`), owned by the website agent; whether `/moments` is already covered is UNVERIFIED (I read `app.config.ts` lines naming `associatedDomains` and `/auth/callback`, `/j` as the served paths; I did not read the website's file).
Layer: review, device.

**MT-T1-R36. Email and push share one "same signal" without sharing data.**
Given the brief wants the same moment signal to drive card, local push and email, When T1's rule is applied, Then what is shared is a name only (a kind, here `moments`) and the landing; the signal itself differs by channel: in app and local push may use the library on the phone (ML-3 limits the push text), email uses only what the server knows. A person never lands on Moments expecting the thing the email said, because the email says nothing about pictures. Counts and budgets are the notification lead's (NS-32 budget, at most one a day).
Layer: review.

### 4.8 Accessibility and setting variants

**MT-T1-R37. Reduce Motion variants, one table.**

| Moment | Normal | Reduce Motion |
|---|---|---|
| Tab swap | platform cut | same (nothing of ours moves) |
| Lamp on arrival | settles over `lamp.returnMs` | jumps to its level |
| Moments first-view settle | opacity and a 6 pt rise | `fadeMs` cross-fade, no travel |
| Arrival wash (push, email, Moments to Home) | `accentSoft` fades over 1.6 s | still tint fades over `fadeMs` |
| Ask card leaves (Not now) | `fadeMs` cross-fade | `fadeMs` cross-fade (already no travel) |
| Granted, Limited, Denied change | `fadeMs` cross-fade | `fadeMs` cross-fade |
| Pushed day page | platform push (and `cardToPage` if chosen) | platform's reduced transition; `cardToPage` becomes one `fadeMs` fade |
| Listen from Moments (R14 only) | dissolve `route.dissolveMs` | `fadeMs` |
Layer: unit (each row reads the reduced flag), review.

**MT-T1-R38. Reduce Transparency and Increase Contrast.**
Given either is on, When the bar draws, Then the paper bar is unchanged (it has no transparency) and its hairline moves to `controlBorder` strength under Increase Contrast (the `highContrast` token set). After the system bar spike the system adapts it and we do not paint it; our own floating glass uses `glassFallback`.
Layer: device.

**MT-T1-R39. The bar passes the type and colour gate.**
Given Bold Text, AX5, light and dark, When the bar draws, Then labels stay readable at 13 pt, the active tab differs by more than colour (filled icon against regular, as built: `weight: focused ? 'fill' : 'regular'`), and the active tint meets contrast on `c.bg` in both themes (existing token tests; a fourth item adds none).
Layer: unit (contrast pair tests exist for `accent` on `bg`), device.

**MT-T1-R40. VoiceOver order across a switch.**
Given the person switches tab with VoiceOver on, When the new tab appears, Then focus lands on the tab's screen title, not on the bar, and the first thing read is the title; the previous tab's content is not reachable. A push and Back restore focus to the row that opened it.
Layer: device.

## 5. Edge and unhappy paths

1. Two quick taps on different tabs: the last tap wins, nothing queues, no half-state. Interruptible (MOTION rule 5).
2. Link arrives during the 1.1 s file-into-month hand-off: dropped; the Book arrival finishes first.
3. Notification tap while the app is open on Moments: no scroll jump; if the list is scrolled, it stays (R32 says "switch tab", not "scroll to top").
4. Library revoked while the app is in the background: on return the tab changes in place to the Denied state (R26), position at the top, no message on Moments (R27).
5. Limited access, and the chosen set is empty: the For you items show; no line says "none chosen".
6. Two books (second parent, two children): the tab list is for the active book; changing book in Me while Moments holds state drops Moments state (it is per account and per book, NS-51-R24) and the next visit is at the top.
7. A second account on one phone: no Moments state from account A is visible to B (held state is cleared at sign-out).
8. Locale right to left: the bar keeps order by the platform's layout; Moments second in reading order. UNVERIFIED on device; no RTL language is in 1.0.
9. Dark mode switch while on Moments: no transition of ours; colours switch as everywhere.
10. Tab bar and the keyboard: Moments has no text field in the plan; if one is added, the paper bar is behind the keyboard as on Home today.
11. iPad: out of scope (iPhone first). HIG says the tab bar sits near the top on iPad; not designed here.

## 6. Findings that matter

1. A cold-start tap on a local notification is swallowed today (`scheduler.ts` 267 to 275: the router may not be mounted, the call is caught, the app opens on Tonight). Any Moments reminder would land on Home on a cold start, which is the case that matters most. Needs a read of the launching response and a navigate after mount (R31).
2. `redirectSystemPath` has no tab link kind, and its catch-all returns `/`. A Moments link must be a new kind that carries nothing, and the capture-route guard needs a Moments sibling test (R30, R34).
3. A badge or dot is the likeliest way the new tab breaks "no gaps, no guilt". HIG allows badges only for critical information, so the default of none is also the platform's own advice. A dot is specified as a constrained option only (R17, R19).
4. "Centre of five" has no fifth tab to be the centre of. Family is never a tab and a centre action button is an action, which HIG excludes from a tab bar. The real choices are second, third, inside Home. Second keeps Home as the start and means Book moves once (R3, section 4.3).
5. Moments' position state is a number that can imply a date. Holding it in memory only costs nothing on a warm session and removes any storage question for the privacy lead (R20).

## 7. Open questions (recommended default, deadline)

Deadlines are proposed; the founder sets real dates. "Build 13 freeze" is not a date I know, so I give an order instead.

1. Position: A (second), fallback E (inside Home). Needs the founder to sign the three-tab reversal. Decide before any tab-bar code is written.
2. J4: keep (R13) or reverse (R14). Default keep. Decide with the product leads before the Moments card design is final.
3. Dot: none (R17). Revisit only after a first-week measure the analytics allowlist can legitimately hold (a tab was opened, no library data); the analytics lead decides what that is. No date.
4. Cold-start notification read (R31): mobile to confirm the API in SDK 57 and where the read goes. Before the first Moments reminder ships.
5. Does a returning ask come back in a later session after Not now (R25)? Product lead's; default: not in the same visit, and at most the cap the permission card already uses (NS-46 uses two unanswered showings for Days; I do not decide Moments').
6. Moments lamp tone and level (R8): design-systems, on device.
7. SF Symbols glyph for Moments (R4 and the symbol mapping table in ruling 34): design lead, with the first-run find test.
8. Does the system bar later minimise on scroll on Moments? Decided by the M3 spike, not here (R6).
9. Tab label word: content. One word. I use "Moments"; a better parent word with one verb is for content (J1 to J10). The test is the 13 pt width on SE 3 (R3).

## 8. Constitution, privacy and accessibility checks

- Constitution: no row writes, rewrites, titles, summarises or labels anything. Transitions carry no meaning. No machine-made name appears in a tab, link or payload.
- No streaks, points, badges, counts or gaps: R17 to R19 (badge), R25 (no line about what is missing), R23 (no new-count toast).
- Privacy: links and payloads carry the tab name only (R30); position state is memory only (R20); email uses nothing from the library (R36); no photo, filename, album, place or date in any event, log or crash report from a tab switch. The only analytics a switch could carry is "tab opened" and the tab name, which is the analytics lead's allowlist to confirm.
- Permission: arrival never triggers the system alert (R24). Shown, Records, Never, Decline lines for the ask belong to the permission lead (PRIV-R21); T1 adds only that the ask is a tap, and that Not now needs no explanation.
- Accessibility: 44 pt targets and a one-word label on four items (R3); Large Content Viewer and VoiceOver order (R4, R40); colour never the only signal (R39); Reduce Motion table (R37); Reduce Transparency and Increase Contrast (R38); letter text and the bar never truncated at AX5 (the bar's label is not scaled; the Large Content Viewer carries large sizes).
- Content rules: this file contains no em dash, en dash, curly quote, ellipsis character or emoji, and no model name. Words in quotes are existing built words or marked PROPOSED.

## 9. Dependencies and assumptions

- Product leads P1 to P5: the daily-return reason, the For you rules, the cap on returning asks. I assume Moments is a list with a For you and a Recent part and a value state before permission, as the brief says.
- Design leads D1 to D5: the Moments screens, the card-to-page choice, the value state. I assume no floating control by default.
- Animation leads A1 to A3: the first-view settle, the wash and the lamp use existing tokens only. I ask for no new motion token.
- Transition lead T2 to T5 (siblings, branches `wip/moments-t2` to `t5` were being written; I did not read them): I assume T2 to T5 own transitions inside Moments and to the pickers, so T1 stops at the page boundary. If a sibling specifies a different tab behaviour, the integrator reconciles with R7 and R22 as the baseline.
- Cross-functional: privacy (R20, R30), notifications (R17, R30, R36, NS-32, NS-51), analytics allowlist, website (association file, R35), `mobile` for the code in R16, R31, R33.
- Code touched later, not now: `(tabs)/_layout.tsx`, `+native-intent.tsx`, `lib/reminders/scheduler.ts`, `lib/transitions.logic.ts` (a `moments` day page row), `lamp.logic.ts`, `test/tab-bar.test.ts`.

## 10. VERIFIED, UNVERIFIED, guess

VERIFIED (read this session):
- HIG Tab bars, Markdown fetched from `https://developer.apple.com/design/human-interface-guidelines/tab-bars.md`: navigation not actions; keep the bar visible except under a modal; use the appropriate number of tabs and fewer is easier; avoid overflow tabs (a More tab appears when width limits it); do not disable or hide tab buttons, explain an empty section; single-word labels; filled symbols preferred; badge is a red oval with a number or an exclamation point, reserved for critical information; on iOS the bar floats on Liquid Glass; the bar can minimise when a tab bar accessory is present and exits by tapping a tab or scrolling to the top; the bar preserves navigation state within each section; change log newest entry 8 Jun 2026.
- The repo facts in section 3, from the files listed in section 2 (paths and line ranges given where they matter).
- That sibling branches `wip/moments-a1`, `a2`, `a3`, `d1` to `d5`, `p1` to `p5`, `x2` exist on the remote (`git ls-remote`, 21 Nov 2026).

UNVERIFIED (not read, or a source was blocked):
- That JS tabs keep visited tabs mounted, mount lazily, and what the tab press does on a second tap (React Navigation page blocked by the fetch tool; a test must settle it).
- That `getLastNotificationResponse` or an equivalent is available and reliable in SDK 57 for a cold start.
- That the system tab bar can show a value-less badge, and that a system segmented control is glass.
- That `/moments` is covered by the website's association file.
- The 13 pt width of "Moments" in a 93 pt item on SE 3.
- Anything about the sibling docs' content.
- Whether `docs/product/moments-tab` siblings and the privacy, feasibility and concept docs exist yet.
- Device behaviour of every row marked device. No simulator or device was run for this file.

Guess (judgement, flagged):
- Position A over B on habit grounds; the habit effect is untested.
- That a returning parent finds Moments faster second than third.
- That a Moments lamp level at or below the Book's 0.6 reads right.

I read the repo at `develop` HEAD of the clone only; I did not run any test, install, or build.
