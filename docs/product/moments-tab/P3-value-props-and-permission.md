# Moments tab, P3: value before permission, the permission journey, and coming back

Status: PROPOSED. Docs only. Date: 21 Nov 2026 (UTC). Author: product lead P3 of 5. Nothing here is built, decided or live. Every id, key and word is a proposal. The founder decides; the reversals the founder owns are in section 3.

Working name: Moments (content may propose better parent words with one verb, per J1 to J10). Family in every example: the fictional Asha. The founder's screenshots are not copied or described by name, place or face anywhere in this file.

## 1. Purpose and scope

This file answers six questions for the Moments tab:

1. Where does the tab sit, and does it start the app (section 5)?
2. What does a parent see before any permission, and is it real (section 6)?
3. How does the permission journey run: primer, Apple's prompt, Limited, Denied, Restricted, a change later in Settings (section 7)?
4. What does the tab show in every permission state (section 8)?
5. How does a parent get value with no library access at all (section 9)?
6. What brings a parent back, how do the app cards, local push and email share one signal, how do we read success without content, and what is the App Review risk (sections 10 to 13)?

Not here: the visual design (design leads), motion (animation and transition leads), the route choice A or B (feasibility doc), legal text (founder-only paths, `docs/legal/**`). P1, P2, P4 and P5 own the other product areas of the tab; where I need one of their answers I name it as a dependency in section 16 and do not decide it.

## 2. Inputs read

Read this session, in the clone:

| Id | Path | Used for |
|---|---|---|
| I1 | `/home/claude/moments-brief.md` (with the UPDATE line, later in the session) | Brief of record |
| I2 | `docs/product/prd/27-photo-moments-and-media.md` (NS-51, NS-52, Q-PM-1 to Q-PM-12, sources S1 to S6) | The locked photo-moments card that this work overtakes in part |
| I3 | `docs/product/prd/26-founder-direction-photos-library-and-media.md` | Founder direction PRD 26 |
| I4 | `docs/BACKLOG.md` BL-1305 | The hold on any photo-library string or PhotoKit call in 1.x |
| I5 | `docs/prd/B-first-run-and-family.md` line 52 (K-02) | No permission ask in first run |
| I6 | `docs/agents/COORDINATION.md` section 10 | How requirements are written, the door lines |
| I7 | `docs/analytics/TRACKING_PLAN.md` | Consent order (K-01), content-free rules, route enum, device versus server numbers |
| I8 | `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` and `docs/design/IA-FINAL-20nov.md` | Three tabs: Home, Book, Me |
| I9 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | Paper content, glass only on controls, three glass surfaces at most |
| I10 | `docs/roadmap/next/03-requirements/NX-39-memory-library.md` section 5 and 6 | Earlier library design, "Moment nudges: 0" (R27), 7-day gap between cards, never re-ask automatically |
| I11 | `docs/product/prd/21-days-cultural-photos-home.md` (NS-32 budget lines as quoted in 27 and 21) | The one-a-day notification budget |
| I12 | `packages/emails/src` (directory listing only) | Email templates exist; what they send today is UNVERIFIED |

Read from the web this session (VERIFIED, dated 21 Nov 2026):

| Id | Source | What it says |
|---|---|---|
| W1 | https://developer.apple.com/app-store/review/guidelines/ | 5.1.1(iii): "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts." 5.1.1(iv): apps "must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access" and "Where possible, provide alternative solutions for users who don't grant consent." 5.1.1(ii): purpose strings "clearly and completely describe your use of the data." 5.1.2(i): an app "may not require users to enable system functionalities (such as push notifications, location services, tracking) in order to access functionality, content, use the app". 5.1.2(iv): do not use information from Photos to build a contact database. 5.1.2(vi): data from "Photo APIs" may not be used for marketing, advertising or use-based data mining |
| W2 | https://developer.apple.com/documentation/photos/phauthorizationstatus.md | Five states: notDetermined, restricted ("the app isn't authorized to access the photo library, and the user can't grant such permission"), denied ("the user explicitly denied"), authorized, limited |
| W3 | https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md | The out-of-process picker "supports search and multiple selection of photos and videos"; "The user doesn't need to explicitly authorize your app to select photos". A missing usage description crashes the app. "Avoid making PhotoKit calls when your app first launches"; make them "in response to direct user action". "After the user sets the app's authorization status, the system remembers their choice and won't prompt them again. However, the user can change this choice at any time using the Settings app. Prepare your app to respond appropriately." Use `authorizationStatus(for: .readWrite)` and `requestAuthorization(for:handler:)` to see "limited". With limited access "You can't create or fetch user albums." The system prompts to update the limited selection once per app life cycle unless suppressed by an Info.plist entry, then present `presentLimitedLibraryPicker(from:)` from our own control. Change observer exists for the limited selection |

Not found this session, so I do not rely on them: a branch `wip/moments-b1` (the market benchmark B1 does not exist yet; the fetch failed), the privacy and constitution doc, the feasibility doc and the design concept (no open PR or branch seen). Brief ids ML-3 and ML-6 did not appear under those names in any file I searched (`docs/prd`, `docs/product`, `docs/security`, `docs/roadmap`, `docs/BACKLOG.md`); I use the brief's own wording of them and mark that in section 17. Reconcile after P1, P2, P4, P5, B1 and the feasibility doc land.

## 3. Reversals the founder owns

The new ask overtakes these earlier rulings. Each is a reversal only the founder can sign. Until signed, the safe default is in the last column and the work stays docs and test devices.

| Id | Earlier ruling | What the Moments tab needs | Safe default until signed |
|---|---|---|---|
| RV-M1 | Three tabs: Home, Book, Me (`scope-stack-rank-and-ia-redesign-2026-11-19.md`, I8) | A fourth tab, Moments | Keep three; build Moments behind a flag |
| RV-M2 | J4: only Home starts a letter | A letter can start from Moments | Moments opens Home's capture with the pictures chosen; the letter still starts in the one capture flow Home owns |
| RV-M3 | K-02: no permission ask during first run (I5) | None needed under my position answer: Moments is not shown in first run, the ask comes later | Hold K-02 as written. My recommendation never reverses it |
| RV-M4 | BL-1305: no photo-library usage string or PhotoKit call in any 1.x build (I4) | A usage string and PhotoKit reads, if Route B | Route A (system picker) needs neither; ship Route A first; Route B waits for this signature |
| RV-M5 | ML-6 as the brief words it: cards show a date, never a place or thumbnail | Thumbnails of the parent's own pictures in Recent | Show thumbnails of the parent's own pictures only on the tab, never a place, never in a notification |
| RV-M6 | NS-51-R1: no other screen asks for library access; the ask lives on a Settings row in Me (I2) | The ask is made from the Moments tab, once, after a primer | Ask only from the primer button; keep the Me row as the place to change it |
| RV-M7 | NS-51-R8: offer only the newest moment, never a list or an older one (I2) | A Recent list, newest first by day | List shows the last few days only, no count, no "older" link, no gaps (MT-P3-R19) |
| RV-M8 | NS-51-R11 and NX-39 R27: moment nudges are 0, and a library moment may nudge only when planned while the app is open (I2, I10) | A push that follows the moment signal | Push only from signals that need no library read (section 11); a library moment may feed a push only when planned at foreground, as NS-51-R11 says |
| RV-M9 | NS-51-R7 "no older backlog is swept" | A Recent view of past days | Same safe default as RV-M7: a short window, not a sweep |
| RV-M10 | NS-51-R27: no library signal in analytics, not even an opt-in state | One optional permission-choice reading | Default none (MT-P3-R26); a founder yes unlocks one enum |

## 4. What I did not change

Constitution: the machine may remove and repair; it never adds meaning. Every requirement below keeps it. No title, caption, summary, place guess, person guess or face match. A label shows only if the parent typed or chose it. No counts, gaps, streaks, points or badges. Nothing implies that AI writes. The child is `{child}`.

## 5. Where the tab sits (my answer to the IA question)

### 5.1 Options and my reading

| Option | For | Against |
|---|---|---|
| A. Home stays default; Moments is the second tab (Home, Moments, Book, Me) | Keeps K-02 and J4 whole. First launch is the product's core (say something to {child}). Moments can be a place a parent goes on purpose. Smallest reversal list (RV-M1 only, plus RV-M6 to M10 inside the tab) | The second tab is not the first thing a parent sees; discovery depends on a Home hint |
| B. Moments as a centre tab in a five-tab bar | Centre prominence | A fifth tab, with the paper tab bar, a 13 pt label floor and iPhone SE 3 width (I8, I9); a centre slot is read as the main action, which is capture, not browsing. Needs a second reversal of the three-tab ruling by two tabs |
| C. Moments is the default tab | Matches the founder's first message; shows value props to every new parent | Forces the first-run flow to land on a tab that asks for photo access, against K-02 and 5.1.1(iv) risk (section 12); starts the app with browsing rather than saying |
| D. Moments inside Home | No new tab; no reversal of the three-tab ruling | Home already holds today's prompt, the capture cluster, what waits and one slip (I8). A second feed there crowds it, and a long scroll hides the capture button |

### 5.2 Recommendation

Option A. Home stays the default. Moments is the second tab: Home, Moments, Book, Me. Reasons, in order: (1) the product's job is to start a letter, and Home does that in one tap; (2) it holds K-02 and J4, so only RV-M1 is needed; (3) Moments earns its place by what it shows, not by being forced first; (4) the founder's UPDATE relaxed "default".

What I give up: a new parent may not open Moments on day one. I answer that with one quiet line on Home, once (MT-P3-R3), and with the daily signal in section 10. If the founder still wants Moments first, section 5.3 says how to do it without breaking App Review.

### 5.3 If the founder signs Option C

Then: the tab is default only after the first letter is kept (so first run still holds K-02); before that, Home is default. The primer never blocks the tab content (MT-P3-R6). The reversal list grows by RV-M3.

### 5.4 Requirements for position

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R1 | Given the founder signs RV-M1 and a build has the flag on, When the app opens, Then Home is the selected tab and the bar reads Home, Moments, Book, Me in that order, each label one word and at least 13 pt | e2e, device (SE 3, AX5) |
| MT-P3-R2 | Given the flag is off, When the app opens, Then there are three tabs and no route, deep link or notification opens Moments (it falls back to Home) | e2e |
| MT-P3-R3 | Given a parent has kept a first letter and has never opened Moments, When Home shows, Then one line near the bottom points to Moments once, with one verb, and never returns after a tap or a dismiss | e2e, content |

## 6. The first experience, before any permission

### 6.1 Principle

The first screen of Moments must be true on the day it ships. It shows what the tab does for this parent now, using the parent's own facts the app already has (the child's name and date of birth, the letters already kept), and our own illustrated examples with Asha content for the rest. It never says "we will" about anything not in the build. This answers J5 (never an empty promise).

### 6.2 The value props that are real

Each prop is a card. A card exists in a build only if the feature behind it exists in that build (MT-P3-R5). Candidate props, with where each one's truth comes from:

| Prop (intent, not final words) | Real because | Needs library access? | Source of truth |
|---|---|---|---|
| "Something to say about today" | One of the 111 written prompts, chosen by the prompt selector from {child}'s age | No | `packages/core` prompt selection |
| "A day worth marking" | A month-age day or birthday worked out from the date of birth | No | Age math in `packages/core` |
| "A year ago" | Shown only when a kept letter from about a year ago exists | No | The parent's own letters |
| "Days you marked" | Days the parent typed (NS-46); a tap opens an ordinary prompt | No | The phone-only days store |
| "Pictures beside your words" | The parent chooses pictures in Apple's own sheet and they sit with the letter | No (system picker, W3) | NS-52 |
| "Your recent pictures, by day" | Reads picture dates on the phone | Yes (Route B), or none (Route A, the system suggestions sheet) | Feasibility doc decides |

Not a prop, ever: "we find your best moments", "smart", "magic", "AI", "never miss a day", "we noticed", any count of days or pictures, any claim that the app understands a picture.

### 6.3 What the first open of Moments shows

Top to bottom, on paper (no glass on content, I9):

1. A short plain line saying what the tab is for, one verb.
2. Two or three real cards from the "No" rows in 6.2 for this parent, with a card marked "An example, with Asha" only when no real one exists yet (a new baby has no "a year ago").
3. One ask card for picture access, quiet, below the real cards, not first, not sticky, with "Not now" as large and as calm as the yes (MT-P3-R7).

Example cards are labelled so a parent never mistakes them for their own data (MT-P3-R4). Examples use only Asha, are made by script from `packages/content`, and carry no real family detail.

### 6.4 Requirements

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R4 | Given no real card exists for a prop, When the tab shows an example, Then it is labelled as an example with Asha, uses no real name, place or face, and disappears the day a real card exists | e2e, content |
| MT-P3-R5 | Given a build, When the tab renders, Then each prop card is drawn from a registry keyed to a feature flag, and a card whose feature is off is absent (not greyed, not "coming soon") | unit |
| MT-P3-R6 | Given any permission state, When the tab opens, Then at least the "No library" cards render and the tab is never a wall, a modal that cannot be closed or a blank | e2e |
| MT-P3-R7 | Given the ask card, When it shows, Then it sits below the real cards, "Not now" and the yes have the same size and weight, and neither is styled as the wrong choice | e2e, device (AX5), design review |
| MT-P3-R8 | Given the content test, When any Moments string is checked, Then it fails on a count, a gap word ("still", "again", "don't forget", "missed"), a streak, "AI", "smart", "best", a gendered child word, or an internal term (take, entry, draft, pack, `raw_transcript`) | content |

## 7. The permission journey

### 7.1 Two routes decide how much of this applies

Route A (Apple's journaling suggestions picker, a system sheet): the app sees only what the parent picks, so there may be no library permission at all, and 7.2 to 7.6 collapse to "open the sheet". Whether that API exists for third-party apps on iOS 17.0 and exactly what it hands back is UNVERIFIED here (my S1 reading, via doc 27, says Apple lets the person control which suggestions are shared with journaling apps; that is a privacy page, not an API page). The feasibility doc owns that. Route B (our own PhotoKit read, Limited honoured): the whole journey below applies. I write for Route B because it is the harder path, and note where Route A is simpler.

### 7.2 Step by step (Route B)

| Step | Who | What the parent sees | Our act |
|---|---|---|---|
| 1. Primer | Us | The ask card in 6.3, in plain words: what is read (dates and a small preview, on the phone), what is never read, what changes if no. One button to go on, one "Not now" | Nothing is called yet. No PhotoKit call at launch (W3) |
| 2. Apple's prompt | Apple | Apple's sheet with our usage string, and the choices Allow Full Access, Select Photos, Don't Allow (W3 describes the dialog with a Select Photos option) | The call is made only from the tap in step 1, with `requestAuthorization(for: .readWrite)` so Limited can be told from full (W3) |
| 3a. Full | Apple | Recent fills in | Read dates only (NS-51-R5 rule kept) |
| 3b. Limited | Apple | Recent fills in from the chosen set; a quiet control "Choose which photos" | The automatic limited-library alert is suppressed with the Info.plist entry W3 names (key name UNVERIFIED, W3 shows it only in a picture), and our control calls `presentLimitedLibraryPicker` (W3) |
| 3c. Denied | Apple | Back to the tab with the non-library cards | No second ask. One calm line and a settings route (7.4) |
| 3d. Not now at the primer | Us | The tab as before, without the ask card taking space | The ask card moves to a small row on the tab and in Me. It never comes back as a card on its own (MT-P3-R11) |

### 7.3 The primer card and the usage string

The primer is ours and may say more than Apple's one-line string. The usage string is Apple's text and must "clearly and completely describe your use of the data" (W1, 5.1.1(ii)). A missing string crashes the app (W3), so a build test checks it (MT-P3-R12). Both are plain, true, and say that the pictures stay on the phone only while that is true (the privacy doc and counsel settle the exact claim; NX-39 section 5.1 already warns that a short "stay on your phone" claim is contradicted by backup and export, so I propose none here).

Door lines for the primer (I6). The primer is a thing a person agrees to, so it carries them:

- Shown: the primer words, by `packages/content` key (keys PROPOSED, content writes the words), plus the link to the Privacy page, versioned.
- Records: this is an operating-system permission, not Terms acceptance. Proposed: a phone-only record of the answer (full, limited, denied, not now) and the primer version, never sent to a server. Whether PRIV-R21's full record applies to an OS permission is UNVERIFIED (I did not read `docs/engineering/07-privacy-engineering.md` this session); privacy engineering answers.
- Never: no photo, filename, album, place, date, asset id or count in any record, log, crash report or analytics event; no child name.
- Decline and withdraw: "Not now" and "Don't Allow" leave every other part of the app, and Export and Delete, working. The parent can change the answer in Settings and from the tab (7.6). Withdrawing later deletes any index we built (NS-51-R16 pattern).

### 7.4 Denied

Apple remembers the answer and will not prompt again; the parent can change it in Settings (W3). So after Denied we never call the prompt again (it would do nothing, and trying would read as pressure, 5.1.1(iv), W1). The tab shows the "No library" cards, then one calm line with a button to the app's page in Settings. The line appears on the tab and in Me only, never on Home, never as a notification, never as a badge. It does not say "you are missing" anything.

### 7.5 Restricted

Restricted means the app "isn't authorized to access the photo library, and the user can't grant such permission" (W2): a parent control or a device profile. So there is no point in an Open Settings button (the parent may not be able to change it), and telling them to change a setting they cannot change is a dead end. The tab shows the same "No library" cards and one plain line that it is off by a setting on this phone, with nothing to tap. It never names who set it and never guesses (a child account, a work profile); we cannot know why (W2 gives no reason).

### 7.6 Changed later in Settings

The parent can change the answer at any time in Settings (W3). On each return to the foreground, the tab reads the status again and redraws. Cases: Denied to Full or Limited (Recent fills in on its own, with no message); Full to Limited or Denied (the index built from the old range is emptied, section 8, and nothing is said); Limited selection edited in Settings (rebuilt on the next foreground, as NS-51's row says, W3 also gives a change observer, but a background observer is forbidden by NS-51-R29, so foreground only).

### 7.7 Requirements

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R9 | Given any launch, cold or warm, and any screen other than the primer button, When the app runs, Then no PhotoKit call that can show Apple's prompt is made (W3: not at launch, only on direct action) | scan, e2e |
| MT-P3-R10 | Given the primer, When the parent taps the yes, Then Apple's prompt shows once, with `requestAuthorization(for: .readWrite)`, and the result is read with `authorizationStatus(for:)` so Limited is told from full (W3) | unit, device |
| MT-P3-R11 | Given "Not now" on the primer, When the parent returns on any later day, Then the ask card does not return by itself, and the only door is the small row on the tab and the row in Me. No timer, no counter of refusals | unit, e2e |
| MT-P3-R12 | Given each build profile, When a library module ships, Then the usage string is present, plain and true, and a build test fails if the module ships without it or if a 1.x profile has the string while RV-M4 is unsigned (W3: a missing string crashes the app) | scan |
| MT-P3-R13 | Given Limited, When Recent shows, Then only the chosen set appears, a "Choose which photos" control calls the limited-library picker, the automatic limited alert is suppressed, no album choice is offered (W3: no user albums), and nothing says Limited is worse | device, e2e |
| MT-P3-R14 | Given Denied, When the tab shows, Then the ask is not repeated, no second system prompt is attempted, one calm line with a button to Settings shows on the tab and in Me only, and Home, notifications and badges never mention it | e2e, device |
| MT-P3-R15 | Given Restricted, When the tab shows, Then there is no button to Settings, one plain line says it is off by a setting on this phone, and no reason is named or guessed | e2e, device |
| MT-P3-R16 | Given the parent changes access in Settings, When the app returns to the foreground, Then the tab redraws to the new state in under 1 s on a test device, with no message, and a downgrade empties the index at once | device, unit |
| MT-P3-R17 | Given the primer, When the parent chooses "Not now" or "Don't Allow", Then Export, Delete, the whole capture flow and Moments' "No library" cards all work (door line: decline and withdraw) | e2e |

## 8. What the tab shows in every state

"For you" and "Recent" are the two parts (brief). The "For you" rows with a No in 6.2 never depend on access. The table says what each state shows.

| State | For you | Recent | Ask or control shown | Copy tone |
|---|---|---|---|---|
| First open, not determined | Real "No library" cards, labelled examples where none exists | Absent (not greyed) | The ask card, below the content | One plain line of purpose; no promise |
| Not now (declined at the primer) | Same | Absent | Small row "Show my pictures" on the tab; the row in Me | Nothing about what was missed |
| Full access | Same, plus library moments ranked in | Newest-first by day, each day a collage of the parent's own pictures and a date. No place, no title, no count | "Choose which photos" absent; Pause and Turn off in Me | Neutral |
| Limited | Same, plus moments from the chosen set | Only the chosen pictures, grouped by day | "Choose which photos" control | Never "only", never "some are missing" |
| Denied | Same | Absent | One calm line and a Settings button (tab and Me only) | Calm, once |
| Restricted | Same | Absent | One plain line, no button | Plain |
| Route A, system sheet | Same | None of ours; the sheet is Apple's, the parent picks, we keep only the pictures they choose | A "Choose pictures" entry | The sheet's own titles are Apple's; we never store or show them (brief) |
| Offline | Same; all of it is on the phone | Pictures in iCloud only show a plain box until they are on the phone (NS-51-R21) | None | None |
| App lock on | Cards need unlock | Thumbnails replaced by an opaque box before the app switcher (NS-51-R25) | None | None |
| Second account on the phone | Per account; B starts off even if the system answer is Full (NS-51-R24) | Per account | The primer for B | None |
| Restored or new phone | Off; no ask returns by itself (NS-51-R23) | Absent | The primer, once | None |

Labels: a label appears only if the parent typed or chose it. A day's heading is the date in the phone's format, never a machine title, never a place. A Recent day with one picture and a Recent day with twenty look equal in weight; no "busy day" language.

Requirements:

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R18 | Given each of the eleven states above, When the tab is opened, Then the content in the table renders, and a screenshot test per state passes on iPhone SE 3 and at AX5 with Bold Text on | e2e, device, visual |
| MT-P3-R19 | Given Recent, When it shows, Then it lists at most the last 14 days that have pictures (number PROPOSED; the spike fixes it), no count, no "older" control, no empty-day rows, no "no pictures on these days" line, and a day never shows a gap | e2e |
| MT-P3-R20 | Given Recent, When a day shows, Then its heading is a date only, with no title, place, person name, weather, scene word or machine-made label from any source, and a content and unit test fails otherwise | unit, content |
| MT-P3-R21 | Given the parent chooses one or more pictures in Recent, When capture opens, Then it opens through the one capture flow Home owns (RV-M2), with the pictures attached and an empty photo-words field, and no date is used as the letter's date without the parent's confirmation (NS-01 OQ-1 as cited in doc 27) | e2e |
| MT-P3-R22 | Given Reduce Transparency, Increase Contrast, Bold Text, Reduce Motion and VoiceOver, When the tab opens in each state, Then content stays on paper, glass appears only on the bar and controls (at most three surfaces, I9), every card is one VoiceOver element with a date, and no state depends on colour alone | device, a11y audit |

## 9. Value with no library access

A parent who never grants access (or whose phone is Restricted) still gets all of this from Moments:

1. Today's prompt, a month-age day, a birthday, and days they typed, each opening an ordinary prompt (the NS-46 route; a tapped day is an ordinary prompt with nothing recorded about it).
2. "A year ago", from their own kept letters, when one exists.
3. Pictures: "Choose pictures" opens Apple's own picker, which needs no authorisation, supports several photos and videos, and runs in a separate process (W3). The parent picks, the letter holds the pictures (NS-52). This is the complete picture-with-letter path with zero library access.
4. A short list of recently kept letters as a calm way back into the book (links, no counts).

The point for the founder: the "find which letter to write from my library" idea (PRD 26) needs access, but "attach pictures to a letter" does not. So the tab's core value never rests on the permission. That is also the best answer to Apple (section 12).

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R23 | Given Denied, Restricted, Not now or no library module in the build, When the parent opens Moments, Then they can start a letter from a prompt, a month-age day, a typed day, or pictures chosen in the system picker, with 0 library permission calls in the session (a network and API fake counts them) | e2e, unit |
| MT-P3-R24 | Given a parent with no kept letters yet, When Moments opens, Then no card says "a year ago", no empty section header shows, and the tab is not shorter or sadder than needed: it shows the prompt, the month-age day and the picture entry | e2e |

## 10. What brings a parent back (without streaks, counts or guilt)

### 10.1 The honest answer

I cannot promise a reason to return every day, and I will not invent one. What I can offer is a tab that has something true and new most days, for the cost of one glance: a new prompt, a day with a name (a month-age day, a birthday, a day the parent typed), a year-ago letter when one exists, and, with access, recent pictures worth one sentence. The pull is "today there is something to say about {child}", not "you have not". The returning is in the parent's hands.

What does not pull, and is never used: streaks, counts of days or pictures, "x days since", a "you missed" header, red dots, badges, "don't forget", a leaderboard of any kind, loss language (CLAUDE.md content rules, NS-51-R12).

### 10.2 One moment signal, three surfaces

I define one idea, the moment signal: "a thing that is true today that a parent might want to say something about". It has kinds. Which kinds each surface may use depends on where the fact lives, because the server never sees the library (I1).

| Kind | Where the fact lives | In-app card | Local push | Email |
|---|---|---|---|---|
| Month-age day, birthday | Date of birth (server and phone) | Yes | Yes (planned on the phone) | Yes (server knows the date of birth) |
| Typed day (NS-46) | Phone only, never synced | Yes | Yes, planned on the phone | No: the server never holds it. NS-47 forbids sending it |
| A year ago, from a kept letter | Kept letters (synced) | Yes | Yes, planned on the phone | Possible, from the letter date only, never its words. UNVERIFIED: I did not read what the email templates (I12) or the server may use. Needs privacy and counsel |
| Today's prompt | Our 111 prompts | Yes | Yes (existing reminder) | Yes |
| Library moment (a day of pictures) | The phone's library only | Yes | Only per RV-M8 and only at foreground planning, neutral words | Never |

Rules on the shared signal:

- One definition of the kinds lives in `packages/core` (pure TS, no React Native), so the app, the planner and the email job agree on the words "a month-age day" and cannot drift. The server's computation uses only the kinds with a No-library source. The phone computes the rest. The two never exchange the result of the library kind.
- The one-a-day budget lives in `budget.ts` (NS-48-R26 as quoted in doc 21). A moment push counts inside it (NS-51-R11, NS-32-R1). It never adds a second push on a day. Quiet hours stay 21:30 to 07:00 (NX-39 section 6, K6). A letter already made that day silences it (NS-51-R13).
- A library moment feeds no push text. Under ML-3 as the brief words it, no push is created from library data; fixed text, random id, no place, picture, count or "waiting". The only way a library moment can ever reach a push is that the parent's own phone plans the existing neutral reminder after a foreground read; the text, title and id are fixed and carry no trace of the pictures (MT-P3-R28). Anything more is RV-M8.
- No thumbnail in any notification. No notification says "pictures" on a locked screen without the founder's Q-PM-9 answer (default in doc 27: the lock-screen words never mention pictures).
- Email never carries a library signal, a thumbnail, or a count.
- The founder's example "Some pictures from the weekend are here" names pictures on a lock screen. Under Q-PM-9 default it stays in the app. Flagged for the founder (Q-P3-3).

### 10.3 Requirements

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R25 | Given the moment kinds, When the app, the planner and the email job choose a kind, Then they call one shared definition in `packages/core`, and a test fails if a server code path can return the library kind | unit, scan |
| MT-P3-R27 | Given any day with a pushed moment, When the planner runs, Then at most one budgeted note exists for that local date across all sources, quiet hours hold, and a letter already kept that day removes it | unit (property test) |
| MT-P3-R28 | Given a library moment, When a push is planned, Then the title and body are one fixed neutral pair, the identifier is random, and the payload carries no picture, date from the library, place, count or word like "waiting"; a canary asset id through every path leaves 0 hits | unit, canary |
| MT-P3-R29 | Given the email job, When it picks content, Then it reads only date of birth, kept letters' dates and the 111 prompts, and a test fails if any library or typed-day source is imported | scan, unit |
| MT-P3-R30 | Given Moments content in any surface, When strings are checked, Then no streak, gap, "missed", "still", "again", or unprompted count appears, and no red dot or badge shows on the tab icon | content, e2e |

## 11. Success reading, content-free

### 11.1 What we are able to read, honestly

The consent order (K-01, I7) means device analytics start only after the consent sheet, which is the third ask and comes after the first letter. So the first-run and first-open of Moments cannot be measured on the device, and we do not queue it. Device rates are among consenting users, who are likely more engaged (I7). Server numbers are k-anonymised aggregates and never divide into device rates. There is no way to learn from a server that a letter began from a moment, because the start source `moment` is kept in memory and never stored (doc 27 conventions, NS-35-R5 row).

So the reading has three layers, the third is the strongest.

1. Business totals that do not depend on consent (I7): letters kept per family per week, by build version, from server aggregates with no cell between 1 and 9. Compare families on the build with Moments to the same measure on the previous build.
2. Consent-gated device events, allowlisted and content-free, using enum values only, and only through the registry (the registry PR is #1234; the route enum in I7 does not list `moments` yet, so a change is needed). Candidate events: `screen_view` with `route=moments`; one event for which part of the tab was opened (`part` enum: for_you, recent); one for the ask card (`ask_surface`: primer, row, settings), and one for the result (`access_result`: full, limited, denied, not_now, restricted) which is only allowed if the founder signs RV-M10. Never any picture, album, filename, date, count, place, asset id or child name.
3. Moderated sessions with parents, plus TestFlight notes, under `docs/research/` (USER_RESEARCH.md). Ask what they did and why, not what they would do.

### 11.2 What would count as working (proposed, the founder changes the bars)

| Reading | Source | Pass bar (PROPOSED, no number from data; fixed after the first cohort) |
|---|---|---|
| Letters kept per active family per week rises on the build with Moments | Server aggregate | Up, with the previous build as the control, read for four weeks |
| Of consenting parents who open Moments, a share go on to keep a letter in the same session | Device (enum events) | The founder names a bar after the first cohort; I do not invent one |
| Access given among those who see the primer | Device, only if RV-M10 | Not a goal. Read as information; never optimise to push it up |
| Parents who say "Not now" are not worse off | Server aggregate: their letters per week against the rest | No drop |
| Complaints or reviews naming pressure or nagging | App Store reviews, support | Zero is the bar |

Rule: never run an experiment whose arm shows a parent a harder ask, more asks, or guilt wording. An optimisation that raises permission grants and nothing else is not a success.

### 11.3 Requirements

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R26 | Given analytics on, When any Moments event is built, Then the allowlist carries only enums from section 11.1 (route, part, ask surface, and, only with RV-M10 signed, access result), no free text, no id, and the `before_send` allowlist (PR #1260) drops anything else; with RV-M10 unsigned, no access result exists in the build | unit, scan |
| MT-P3-R31 | Given analytics off or consent not yet given, When the parent uses Moments, Then 0 events are sent and none are queued (K-01), and the screen works the same | unit, e2e |
| MT-P3-R32 | Given a canary asset id, album name, date and filename through every path (primer, Recent, picker, push, email), When logs, breadcrumbs, crash payloads, analytics and URLs are scanned, Then 0 hits (NS-51-R28 pattern) | unit, canary |

## 12. App Review risk on forcing access

Rules read this session (W1):

- 5.1.1(iv): do not "manipulate, trick, or force people to consent to unnecessary data access" and "where possible, provide alternative solutions for users who don't grant consent."
- 5.1.1(iii): ask only for data relevant to core functionality and "where possible, use the out-of-process picker ... rather than requesting full access to protected resources like Photos."
- 5.1.2(i): an app "may not require users to enable system functionalities" to access functionality or content (the examples are push, location and tracking, not Photos, but the same reasoning applies; whether a reviewer reads it for Photos is UNVERIFIED).
- 5.1.1(ii): the purpose string must "clearly and completely describe your use of the data."

Risk table:

| Design | Risk | Why |
|---|---|---|
| The tab is blank or locked until access is granted | High | It forces consent, with no alternative (5.1.1(iv)) |
| A permission wall before any content, or a primer with no Not now | High | Same |
| Repeating the ask after Don't Allow, or a nag card | Medium to high | Pressure; also useless, the system will not show again (W3) |
| Our primer then Apple's prompt, with a Not now and a complete tab without access | Low | Matches 5.1.1(iv) alternatives; the system picker path exists |
| Reading the whole library for dates when the system picker would do | Medium | 5.1.1(iii) data minimisation: a reviewer may ask why. The answer: the app finds which day deserves a letter, which a picker alone cannot do. A weaker answer if Route A reaches the same goal |
| Usage string vague or missing | Medium (and a crash, W3) | 5.1.1(ii) |
| A push built from library data, or a pictures wording on the lock screen | Medium | Privacy, plus our own rules (ML-3, Q-PM-9) |
| Using library data for anything beyond the stated purpose (profile, analytics, marketing) | High | 5.1.2(ii), (iii), (vi) |

My recommendation: the design in this file is the low-risk row. Do not make Moments the first screen with the ask on it (Option C) unless the content comes first and the ask is skippable at the same prominence; the safer way to give the founder "default and ask" is 5.3. Notes for Review must give the reviewer a path: open the Moments tab, tap Not now, see it all work; then grant, deny and Limited in turn. The founder-owned counsel check covers every legal reading ("counsel must confirm").

No guideline text promises approval for any of this. I read the rules, not any past rejection of a similar app. The UNVERIFIED part is how a given reviewer reads data minimisation for a Route B read.

| Id | Given, When, Then | Layer |
|---|---|---|
| MT-P3-R33 | Given the Notes for Review, When a build with Moments is submitted, Then they say what is read (Route B: dates and previews, on the phone), that nothing leaves the phone, that the tab works with access refused, and the path for a reviewer to see each state; counsel has read them | review |
| MT-P3-R34 | Given the App Privacy label, When Moments ships, Then "Photos or Videos: not collected" holds only while the library work is on the phone and no file or date reaches a server, and the label is rechecked in the same build as any behaviour change (NS-51-R30) | review |

## 13. Edge and unhappy paths

| Case | What happens |
|---|---|
| The parent taps the primer yes, then closes Apple's sheet by switching app | No answer is recorded; status stays notDetermined; the tab keeps the ask card until an answer or Not now |
| The prompt returns after the app was killed | The result is discarded if the app is locked or the build is not on the account that asked (NS-01-R47 pattern in doc 27) |
| Limited with zero or very few pictures chosen | Recent is empty and absent, with no line saying so (NS-51 limited row) |
| A parent picks one picture of many in Recent and then backs out | Nothing is kept; no draft is created by the pick alone |
| The status read fails | Treated as Denied for display, no error, no prompt |
| iPad, Mac app, Expo Go, Android | The library parts are absent, not greyed; "No library" cards still show |
| iOS version below 17.0 | Not supported (D-098); no change |
| Two children | Pictures are never tied to a child (no face matching); the parent picks which book the letter goes to |
| Offline | Everything in this file works; nothing needs a network |
| The founder signs Option C or a default Moments later | The primer rules (MT-P3-R6, R7, R9, R11) still bind |
| A parent revokes access mid-session | The next foreground read redraws; an open picker is dismissed without message |
| The child's date of birth is in the future (expecting) | Month-age cards are absent; no moment push before birth (doc 27 default) |

## 14. Constitution, privacy and accessibility checks

- Constitution: nothing here writes, titles, summarises or labels. The two machine acts are "group by day" (a date) and "show a collage of the parent's own pictures". No machine label appears, so verifyEdits is not touched. Route A's titles are Apple's and are never stored or shown by us.
- Privacy: nothing leaves the phone from the library (MT-P3-R26, R28, R29, R32); no picture, filename, album, place or date in analytics, logs or crash reports; safety tiers stay on the device; the Data Not Collected label story is MT-P3-R34. A place name from reverse geocoding may send coordinates to Apple (UNVERIFIED); the default here is none (Q-PM-5 closed: no location is read).
- Accessibility: iPhone SE 3, AX5, Bold Text, VoiceOver, Reduce Motion, Reduce Transparency and Increase Contrast, covered in MT-P3-R18 and R22. Paper content, glass only on controls (I9).
- Content rules: no em or en dashes, curly quotes, ellipsis characters or emoji in any string; the child is `{child}`; no AI wording; parent words only (MT-P3-R8, R30).
- Words: every string is by `packages/content` key and PROPOSED until content and the founder pass them. No PROPOSED word ships.

## 15. Open questions

| Id | Question | My default | Who answers | By |
|---|---|---|---|---|
| Q-P3-1 | Which tab position (section 5)? | Option A: Home default, Moments second | Founder | Before IA is drawn for the design leads, Mon 24 Nov 2026 |
| Q-P3-2 | Route A or B, and does Route A need any permission? | Route A first if the feasibility work shows it hands back real pictures; Route B only with RV-M4 signed | Feasibility doc, then the founder | Before any build; no later than the feasibility doc |
| Q-P3-3 | May a library moment be the reason for any push at all (RV-M8)? | No library-derived push. The in-app card only. Pushes use date-of-birth and typed-day facts | Founder, with privacy and counsel | Before notification design is final |
| Q-P3-4 | May one permission-result enum go to analytics (RV-M10)? | No | Founder, analytics, counsel | Before the registry change |
| Q-P3-5 | May email use "a year ago" from a kept letter's date? | No until counsel reads it | Privacy, counsel | Before any email template change |
| Q-P3-6 | Recent window of 14 days: right size? | 14 days, no count; fixed by the spike | Product, design | After the spike |
| Q-P3-7 | One line on Home pointing to Moments: does the founder want it (MT-P3-R3)? | Yes, once | Founder | With Q-P3-1 |
| Q-P3-8 | Does a Restricted parent need any words at all? | One plain line, no button | Content | With the copy round |
| Q-P3-9 | Does PRIV-R21's full record apply to the OS-permission answer? | Phone-only record, no server row | Privacy engineer | Before the primer is built |

Default rule: a default holds for design and build, never for public text, a counsel answer or a submission.

## 16. Dependencies

- P1, P2, P4, P5: the content of For you and Recent, the capture handoff and anything else the tab holds. I depend on their ranking and on one shared signal list in `packages/core`.
- Feasibility doc (Route A or B), privacy and constitution doc, design concept: reconcile after they land.
- B1 market benchmark (`wip/moments-b1`): not yet on the remote. I make no claim about any other product's permission flow. Where B1 has one, MT-P3-R7 and R13 should be checked against it.
- BL-1305 and the three-tab ruling: RV-M1, RV-M4, RV-M6 to M10.
- Registry PR #1234 and `before_send` allowlist PR #1260 (open): the route enum and event allowlist.
- NS-32 budget and `budget.ts`; NS-47 days store; NS-46 and NS-52 (pictures with a letter).

## 17. VERIFIED, UNVERIFIED, guess

VERIFIED (read this session): W1 App Review rules 5.1.1(ii) to (iv), 5.1.2(i), (ii), (iv), (vi), 4.5.4; W2 the five authorisation states and the meaning of restricted and denied; W3 the system picker needs no authorisation and supports multiple photos and videos, avoid PhotoKit calls at launch, the system will not prompt again and the person can change the answer in Settings, `authorizationStatus(for:)` is needed to see Limited, no user albums in Limited, automatic limited alert suppressed by an Info.plist entry and replaced by `presentLimitedLibraryPicker`, a missing usage description crashes. The repo facts in section 2 (I2 to I11) were read in the clone at the head of `develop` as cloned today.

UNVERIFIED: that Apple's journaling suggestions picker is available to third-party apps below iOS 17.2, what it returns and whether it needs permission; the Info.plist key name for suppressing the limited alert (W3 shows it as a picture only); whether a reviewer applies 5.1.2(i) to Photos; what the email templates and server may use (I12 listing only); PRIV-R21's reach over OS permissions; whether the status read after a Settings change is instant; whether a change to the app's permission in Settings relaunches the app; any past App Review outcome for a similar app. Brief ids ML-3 and ML-6: not found by those names in the repo; NX-39 uses its own "R" ids (I10), so I quote the brief's wording and cite doc 27 and NX-39 for the nearest rows. The nine "ML-1 to ML-14" in the brief may refer to a document not in this clone.

Guess: the 14-day Recent window and every pass bar (marked PROPOSED, no data behind them); the claim that a new parent will find Moments through a Home line.

Not done: I did not read the other four product leads' files, the privacy, feasibility or design docs (not present), the founder's screenshots (not needed and not copied), or any code. I wrote no legal text, no string for shipping, and no PR.
