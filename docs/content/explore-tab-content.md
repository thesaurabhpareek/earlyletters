# Moments tab: customer-facing content (PROPOSED)

Status: PROPOSED (docs only), revised 21 Nov 2026 for the Moments name and the council rulings | Owner: `content` | Replaces: none | Load when: writing, wiring or reviewing any word on the Moments tab, its permission door, its empty or error states, or a reminder that points at it.

Rulings applied (from the executive rulings on this tab, as summarised to me; the Project doc itself is not readable here): the tab is named Moments (founder, quoted in #1276: "Think we go with Moments" and "Change brand.md and I approve moments."); Home stays the landing tab; no photo ask before the first saved letter; job sentence "Pick a day worth a letter to {child}."; EX-31 dropped; EX-12 dropped (a trust line, if needed, is the D-133 line verbatim); no tradition or country filter on this tab; EX-94 is in-app only; plain tone, no wit; the library read, photo permission and usage-string lines are DORMANT until the founder says go; flag off by default. #1276 allows "Moments" only as the tab label and place name, in the app, and keeps it off the store name, subtitle, keywords, listing, screenshots and website until counsel clears the name.

Nothing here is built. No string is live, no key is added to code, no flag is set, no ruling is changed. Every line is PROPOSED until the founder approves it. Protected text (OS permission strings, the consent sentence, the label and policy wording) is listed as a slot only and is not written here. The lines follow `packages/content/WRITING-GUIDE.md` (the version in #1183) and the constitution in `CLAUDE.md`. Read aloud, like a friend would say it.

## 1. What the Moments tab is, as written

### 1.1 Short answer: the name is ruled, the feature is still PROPOSED

When this file was first written no document on `develop` or on an open PR branch defined the tab. The name is now ruled (below); the design is not. I read all 199 open PR titles and branch names (REST, two pages), searched for "explore" on `origin/develop` and on the branches of #1267, #1264, #1247, #1222 and #1202, and read the sections named below. The only hits for "explore" as a tab are the founder's own words, quoted in two PRs. Everything else is a PROPOSED working design.

| Item | What the docs say | Status |
|---|---|---|
| Name as written | The founder, 20 Nov (quoted in #1267 section 0 and #1264 header): "this can be one new tab like explore etc or suitable word." Then, 21 Nov (quoted in #1276): "Think we go with Moments" and "Change brand.md and I approve moments." | RULED: the fourth tab is Moments. #1276 puts it in the BRAND.md glossary as a label and place name only, in the app only |
| Job sentence | #1264 section 7.2, PROPOSED line for `content`: "Home is where you start today's letter. Moments is where your own pictures and days wait for you to say something about them. The Book is where you read the ones you kept." | PROPOSED. "wait for you" reads as a to-do, see Q-EX-3 |
| What it shows | #1264 section 7.3 states: M0 day one before permission (value props with fictional Asha examples, one button, a quiet "Pick one photo instead"); M1 asking (Apple's sheet after one plain sentence); M2 allowed (a few days of the parent's own pictures, dates only, no place, no caption, plus any marked day today); M3 nothing to show (one calm line and the picker); M4 declined or off (the picker, typed days, ticked days, one past letter, no line about access); M5 quiet book (nothing). Rows NS-53-R6 to R9: own pictures and a date only, no count, no title, no "found" or "chose" wording, one screen at most, newest first | PROPOSED. Nothing is decided |
| Where it sits and whether it is the default | Founder 20 Nov (#1267 sections 0, 10, 11): "It doesn't need to be default". Council ruling: Home stays the landing tab, and no photo ask comes before the first saved letter | RULED (as summarised to me). The bar position is design's |
| Permission flow | DORMANT until the founder says go. Ask once, on the parent's tap, after one plain sentence, then Apple's own sheet (limited or full both work); never at launch or in first run; never a second ask after a No; always a no-permission fallback (the system picker). Sources: #1264 section 7.5, NS-53-R2 to R4; #1267 section 7; `27-photo-moments-and-media.md` NS-51-R1, R3, R18, R19; Apple App Review 5.1.1 and 5.1.2(i) as read in #1267 | PROPOSED, Q-HEW-3 default |
| Lock-screen and notification rules | Standing: one budgeted reminder a day, neutral placeholder, nothing time-sensitive (NS-32). NS-51-R11 lets a moment be a ranked source of the evening reminder, planned only while the app is open, with one neutral title and body. Q-PM-9 default (accepted, CL-054): lock-screen words never mention pictures. #1267 section 10 point 5 goes further: use the ordinary reminder's exact words, no payload identifier, no analytics mark. NX-39 ruling 3 and K1 (no notification derived from the library) still stand in their own file | PROPOSED. EX-94 is in-app only, never lock screen (ruled). The rest is a reversal the founder must own (section 5) |
| Route A (Apple Journaling Suggestions picker, DORMANT) | Needs no library permission; Apple draws the sheet (we cannot restyle it); iOS 17.2 or later; needs entitlement `com.apple.developer.journal.allow` (a production build fails `g6-production-flags-off.test.ts` on it today); whether Apple gates the entitlement is UNVERIFIED. We would keep the pictures and nothing else (#1267 section 2) | PROPOSED. Not chosen |
| Route B (our own PhotoKit read, limited access honoured, DORMANT) | Needs a photo usage string and PhotoKit, which BL-1305 and NS-49-R25 forbid in any 1.x build; reads only creation date and an identifier (NS-51-R5); our own layout and words, so `content` controls every line. #1267 CQ-8 recommends Route B first because we control the words | PROPOSED. Not chosen. Q-HEW-1: default drop C, spike first |
| Tab count versus D-161 | `docs/DECISIONS.md` D-161 (founder, 11 Nov 2026): "Three tabs in every build: Home, Book, Me." IA-FINAL-20nov, IA-R1 and tests N1, N4, J12 say the same; IA-FINAL lists a Library tab under "Never a place". A Moments tab is a fourth tab. #1264 section 7.1 names the collision and asks `design-systems` to approve a changed IA-R1. Nothing is decided | CONFLICT with a locked decision, now founder-named; the D-161 amendment is the founder's and design's (section 5) |
| Design v2 (#1247, #1222) | `DESIGN-LANGUAGE-V2-21nov.md` does not define this tab | Nothing to apply. UNVERIFIED that design has drawn a screen |
| Not reachable here | The Project docs are not readable in this session. I applied the rulings from a summary, not from the doc | UNVERIFIED |

### 1.2 How this file uses the word

The tab is called Moments, as a label and a place name only (BRAND.md glossary row, #1276). Nothing on the tab is called a moment. This file never writes "your moments", "new moments", "these moments", "saved moments", a number of moments, "photo moments" or "capture a moment", and never uses Moments for a note, letter, recording, picture or marked day. The Me row for pictures says "pictures", never "Moments" (NS-51-R35). Moments stays out of the store name, subtitle, keywords, listing, screenshots and website, and out of push and email content, until counsel clears the name (X1, Q-X1-12).

## 2. How to read the tables

- Counts are characters, spaces included. Limits: button 22, push title 40, push body 110, house body target under 60, toast under 6 words (guide v1.2 sections 2 and 6).
- "Fallback" is the plain line that runs if a line is rejected or a `humour` flag is off. There is no wit anywhere on this tab (Option 2 wit scope: wit lives in three places only, and this tab is not one). Every line below is plain. The fallback is a shorter or safer wording, not a flatter one.
- DORMANT means the line only runs once the founder says go on the library read, photo permission and usage strings. Rows marked DORMANT: EX-15, EX-20 to EX-25, EX-30, EX-33, EX-35, EX-50, EX-60 to EX-63, EX-72, EX-94. No DORMANT line is wired, and none shows before the first saved letter.
- "Protected" means a registered or counsel-held text: OS strings in `permissions.en.ts`, the consent sentence, label and policy words. Listed as a slot with the intent and the constraints. Not written.
- Every line ships behind the flag, off by default.
- `{child}`, `{app}` and `{date}` are placeholders. The child is never gendered. The product name is never typed.
- "Rule" cites the check that should pass. Nothing here has been run through `rules.test.ts` as code (docs only); section 7 says what I checked by hand.

## 3. Lines the tab needs

### 3.1 Tab and heading

| Id | Surface and state | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-01 | Tab bar label | Moments | Days | 7 chars. The founder's name, allowed by #1276 as a tab label. Never a count or badge on it. Fallback applies if counsel does not clear the name |
| EX-02 | Large title, M0 and M2 | Moments | Your days | Repeats the tab label, which is normal for a large title |
| EX-03 | Subtitle under the title, M0 and M2 | Pick a day worth a letter to {child}. | Pick a day, then say something. | 36 chars. The ruled job sentence. Says what the parent does, never what the app finds or writes (FR-MKT-45) |
| EX-04 | Section label, ticked or typed day shown today | Today | Today | Plain label. The day's own name sits beside it from the days library, not written here |

### 3.2 Value page before permission (M0)

Sample content must be marked and drawn from fictional family Asha, approved by the CMO (principle 11, FR-MKT-45). No real picture, place or name from the founder's screenshots (NS-53-R16).

| Id | Surface and state | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-10 | Value line 1 | Your pictures, your words. | Pick a picture. Say what it was. | A slogan rhythm (section 7 tell). Held back: use only the fallback unless the CMO rules the slogan in. The fallback is the safe pair |
| EX-11 | Value line 1, safe form | Pick a picture of {child}. Tell the story in your own voice. | Pick a picture. Say what you remember. | Names what the parent does. The catalogue prompt "Pick one photo on your phone of {child}. Tell the story behind it." is the nearest shipped line |
| EX-12 | Value line 2 | DROPPED (council). If a trust line is needed on M0, use only the D-133 line, verbatim: It stays in your words. Every change is marked, and your original recording is kept unchanged. | none, omit the line | No new wording. Shown only once the parent is past the first saved letter |
| EX-13 | Value line 3 | Days you marked show up here too. | Days you marked show here. | Only if the parent ticked any. Hide the line if none (no gap shown) |
| EX-14 | Sample tag on an Asha demo picture | Sample from the Asha family | Sample | 27 chars. Required wherever demo content shows |
| EX-15 | DORMANT. Primary verb button, opens the pre-permission sentence, after the first saved letter only | Show my pictures | Show my photos | 16 chars. Not "Allow", not "Enable". One forward word, same in M0 and M3 |
| EX-16 | Quiet second button, level 1 picker | Pick one picture | Choose a picture | 16 chars. Uses the system picker, needs no permission, always present |

### 3.3 Pre-permission ask and consent (M1) (PROTECTED, DORMANT, slots only)

No photo ask comes before the first saved letter. Until then the tab shows EX-03 and the typed or ticked days only.

| Id | Slot | Intent and constraints (no wording written) | Owner |
|---|---|---|---|
| EX-20 | The one sentence shown after the tap on EX-15 and before Apple's sheet | Plain. Says what is read (the dates of pictures on this phone, nothing else), that nothing leaves the phone, that the parent can say no or change it in Settings. Two short sentences at most (guide section 8, priming). The word "never" and the claim "stays on this phone" need proof first (the NS-51-R26 network fake and the label check). No wit, no pressure, no sequence narration ("then Apple asks") | `content` with CLO and counsel. Final words are theirs |
| EX-21 | OS string `NSPhotoLibraryUsageDescription` | Exists only in a build where the flag is on (NS-51-R2). Registered in `permissions.en.ts`. A missing string crashes the app | CLO and counsel. Not drafted |
| EX-22 | Route A only: Apple's own once-per-device consent sheet | Apple's wording, drawn by the system. We write nothing and cannot change it | Apple |
| EX-23 | The two buttons beside EX-20 | Continue // Not now | Continue // Not now | "Not now" is a full answer and changes nothing (7.5). Both are existing words. Do not use "Allow" |
| EX-24 | Record of the parent's yes | No visible text. Stores the yes and its time on the phone only (PRIV-R21) | `privacy` |
| EX-25 | Privacy policy, label and in-app disclosure rows for this tab | Must be re-read against the build and edited by `legal` and the founder. This file does not touch `docs/legal/**` | CLO |

### 3.4 Allowed, nothing to show, declined, quiet

| Id | State | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-30 | DORMANT. M2 day tile, visible text | {date, from the locale formatter}, for example "Saturday, November 14" | the same | Only the formatted date is allowed. A fact the parent can check, built by a fixed rule from timestamps, never from content (CQ-5). No title, no place, no "outing" or "visit", no count, no "best" |
| EX-31 | M2 day tile, time range | DROPPED (council). Only the formatted date shows | none | Nothing to write |
| EX-32 | M2 section line when a ticked or typed day is today and pictures also show | none | none | Shows in one place only (7.2, NS-53-R11): the item sits on Moments, Home shows only its slip order |
| EX-33 | DORMANT. M3 nothing to show | Days with pictures will show here. | Days will show here. | 34 chars. One line of what will be here, one action (EX-16 sits under it). No "no moments yet", no count, no gap. The fallback says what will be here, never that nothing is. |
| EX-34 | M4 declined or off | none | none | By the rule in NS-53-R4 and FR-PHS-44 the tab says nothing about access. It shows EX-16, typed days, ticked days and one past letter. The only access words live in the Me row (EX-60) |
| EX-35 | M2 limited access | none | none | Behaves exactly like full. No line about what is missing (FR-PRV-38). The "Choose which pictures" control lives in the Me row (EX-61) |
| EX-36 | M5 quiet or hidden book | none | none | Nothing from that book shows (NS-23-R8). No line says it is hidden |
| EX-37 | One past letter, as a link to the Book | A letter from {month} | A past letter | A link into the Book only. Never lists kept letters on this tab (IA-R9). Names-on only for `{month}`. Fallback is neutral |

### 3.5 Picture picked, hand-off to capture

The hand-off opens the one capture start with the chosen pictures and an empty words field (NS-53-R10, NS-49-R3). Nothing is pre-filled from a picture. The prompt is an ordinary catalogue prompt and does not depend on the picture (CHECKS-AND-BALANCES F6). The machine never writes, captions, summarises or starts the entry.

| Id | Surface and state | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-40 | Day sheet title after tapping a day | {date} | {date} | The formatted date only |
| EX-41 | Day sheet primary button | Use these | Use these | 9 chars. For one or several selected pictures. Disabled (not hidden) with none selected |
| EX-42 | Day sheet close | Not now | Close | Existing words |
| EX-43 | Words field placeholder in capture, with a picture attached | Talk, or type here | Talk or type | The shipped plain instruction (guide principle 11). Never a made-up sentence about the picture |
| EX-44 | Optional label above the words field | What you'd like to say about it | Say something about it | 31 chars. Never describes the picture. Not "What is happening here" and not "Add a caption" (we do not caption) |
| EX-45 | Date confirmation, only if the picture date differs from today | Use the picture's date for this letter? | Date this letter {date}? | The picture's date is used only if the parent confirms (NS-01 OQ-1, 7.4). Two buttons: "Use {date}" // "Keep today" |
| EX-46 | Saved toast | Saved to {child}'s book | Saved | Shipped pattern. The one dry saved-letter line is a separate, founder-held item (guide section 4) and is not used here |

### 3.6 Error, slow and offline

The tab itself works offline: it reads dates on the phone (NS-53-R14, NS-51 offline row). So it has no offline banner. The one network case is a picture whose original is in iCloud and not on the phone. Errors follow the four-part anatomy (guide section 8): what happened, what is still fine, what to do, when it fixes itself. No wit, no "Oops", no "Something went wrong", no "failed".

| Id | State | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-50 | DORMANT. A picture is in iCloud and not on the phone | That picture is in iCloud, not on this phone yet. Connect to the internet and try again. | That picture isn't on this phone yet. Try again online. | 88 chars. States the cause, the fix. Do not promise a retry time (NS-52-R9 owns the behaviour). Only true where the build follows NS-52-R9 |
| EX-51 | A picture did not open | That picture didn't open. Pick another, or try again. | That didn't open. Try again. | Calm, practical. No "unable to", no "failed" |
| EX-52 | Not enough space to keep the picture with the letter | There isn't enough space on this phone to keep that picture. Free some up, then try again. | There isn't enough space on this phone. | States what happened and what to do. "Your words are still here" only if the build keeps the draft (check the code path, guide step 0) |
| EX-53 | A video is longer than the limit | That video is longer than {limit}. Pick a shorter one. | That video is too long. | The limit is ASSUMED 60 seconds (Q-PM-2); `{limit}` from config. No trim in v1 (Q-PM-11). "One calm line" as the card says |
| EX-54 | Slow day read or rebuild | none | none | The read runs off the main thread and never blocks (NS-51-R38). A failed read leaves no index and no message (NS-51 failed row). No spinner copy, no "Getting your days ready" because it is not measured |
| EX-55 | Photo access changed in Settings while the tab is open | none | none | The tab quietly shows M4. No line, no nag |

### 3.7 Me row for the permission (not on the tab)

The only place that mentions access. Listed here because the Moments states above point to it. Shown when the parent looks at it, never as a banner on Moments. The row says "pictures", never "Moments" (NS-51-R35). All of EX-60 to EX-63 are DORMANT.

| Id | Surface and state | PROPOSED line | Fallback | Rule and note |
|---|---|---|---|---|
| EX-60 | DORMANT. Me row, off in Settings | Photos are off for {app}. You can turn them on in Settings. | Photos are off. | Calm, practical, mirrors the shipped notifications-off line in the guide's coverage matrix. Button: "Open Settings" |
| EX-61 | Me row, limited access | Choose which pictures | Choose pictures | Opens Apple's limited-library picker. Never says one choice is better (NS-51-R3) |
| EX-62 | Me row, turn the feature off | Turn off days from pictures | Turn off | A parent who turns it off has the index removed (NS-53-R13). Settings text says what it does when on, not the off state (guide section 8, Settings): "Shows days from the pictures on this phone." |
| EX-63 | Me row, pause | Pause | Pause | Pause empties the index and resume rebuilds it (Q-PM-12) |

### 3.8 Accessibility names

Plain, literal. A label says what a control does or what an image is, never what the parent feels and never what a picture shows (guide section 9, accessibility; NS-53-R15, FR-PHS-70). Read at AX5 and with Bold Text on a small phone; this needs a device check (S1-23) a diff cannot prove.

| Id | Element | Accessibility label | Hint | Note |
|---|---|---|---|---|
| EX-70 | Tab | Moments | none | The OS adds "tab" and the position. Follows EX-01 |
| EX-71 | Large title | Moments, heading | none | Heading trait, not a button |
| EX-72 | DORMANT. Show my pictures | Show my pictures | Asks to read the dates of pictures on this phone | The hint says what happens next, not that it is safe |
| EX-73 | Pick one picture | Pick one picture | Opens your picture library to choose from | Level 1 system picker |
| EX-74 | A day tile | {date}. Pictures from this day | Opens the day | Date then "pictures". One element per tile, not one per picture |
| EX-75 | A picture thumbnail in the day sheet | Picture from {date}, {selected or not selected} | none | Never describes content. The position ("picture 2 of 5") is read by NS-53-R15 and is a count inside the parent's own pick; design to confirm it does not break "never a count" |
| EX-76 | A video thumbnail | Video from {date}, {duration} | none | Duration is phone metadata read as given |
| EX-77 | Use these | Use these pictures | Starts a letter with them | Says the result |
| EX-78 | Not now | Not now | none | |
| EX-79 | Sample tag | Sample from the Asha family | none | So VoiceOver users know the picture is not theirs |
| EX-80 | The decorative sample picture | none (hidden from VoiceOver) | none | Alt text would invent a memory (guide principle 11) |

### 3.9 Reminders and the lock screen

The founder asked that the library should also drive nudges (#1267 section 10). Rules that bind every line below: one budgeted reminder a day; the lock screen is a neutral frame; Q-PM-9 default neutral (CL-054): lock-screen words never mention pictures, a day, a tradition, a country, a place or the child; zero exclamation marks; push title under 40 and body under 110, house body target under 60; no "evening" word (the class name stays internal); no count, no "again", "still", "don't forget", no streak; no emoji; never time-sensitive; no payload identifier from the library; no analytics mark that a nudge was moment-driven.

I recommend the strictest form (#1267 section 10, point 5): a moment may only take the slot of the ordinary evening reminder and use that reminder's exact words, so the existence of the notification tells a lock-screen watcher nothing about pictures. That means Moments needs no new push string, and the word Moments is not used in any push or email. These are the existing neutral lines it would borrow (guide v1.2 section 8 and the PROPOSED E-series in #1202), listed so the owner can confirm they carry no picture, day or place word.

| Id | Surface | Title // body | Chars | Note |
|---|---|---|---|---|
| EX-90 | Local push, neutral, borrowed | A minute for the book? // Say whatever's on your mind. A line is plenty. | T22/B46 | The guide's "Do" example. Zero exclamation marks. A question invites a reply |
| EX-91 | Local push, neutral, borrowed | Anything from today? // Talk or type, whichever is easier. | T20/B34 | Plain. "today" is the day of the notice, not a fact from a picture |
| EX-92 | Local push, neutral, borrowed | The book is here // Say whatever's on your mind about today. | T16/B40 | From #1202 E4-r4-f. Plain frame |
| EX-93 | Tap target | Opens the app on Home as usual, never a particular day or picture | none | The payload carries no library identifier (#1267 section 10 point 3). Home stays the landing tab |
| EX-94 | DORMANT. In-app line, shown on Moments after unlock, only when a day exists | Pictures from the weekend are here. | none | 35 chars. The founder's own neutral example (Q-PM-9). In-app only, never on a lock screen, in a push or in an email (ruled). Facts only: no "memories", "best", "found" or a place |
| EX-95 | Lock-screen variant that names pictures | NOT PROPOSED. Never on the lock screen (ruled) | none | Nothing to write |
| EX-96 | Email | none | none | Email never uses the library, because the server never sees it (#1267 section 10). Nothing to write. The fixed-schedule and typed-day emails keep their current words |
| EX-97 | Remote (server) push | none | none | Parked (E79) and refused for the same reason as email |

## 4. Occasion, region and tradition: how this maps

Facts from `docs/content/engagement-loops/` in PR #1202 (README sections 3 and 4, MATRIX) and `20-founder-direction-20nov.md` section 3.4, Q-FD-5, NS-46-R20 and NS-47-R2.

- Ruled: no tradition or country filter, chip or heading on the Moments tab. The tradition and country browse filter stays in the Days sheet (Me, Days we mark), held in memory until the sheet closes, never stored. Nothing is ever inferred from a ticked day, a picture, the locale, the time zone, the language or the storefront.
- Moments shows a day only because the parent ticked or typed it, under the day's own name from the days library. It never says "because you chose" or names a belief. It shows the day once, on Moments, and Home shows only its slip order (NS-53-R11, 7.2).
- Tone for a day line: the day's own loop line from the days library (LP-D1 to LP-D7), not new words. Plain on this tab, no wit (Option 2 scope). Mother's Day and Father's Day are never pre-ticked or promoted.
- Lock screen for a day: neutral frame (NS-47-R12). Moments adds no lock-screen string.
- A day row's `publicTitleOk` flag decides whether its name may show; Moments reads it and never overrides it.

## 5. What conflicts with a locked ruling

None of these is changed by this file. Each is a reversal the founder owns, in the PR that builds it. Rows 1 to 6 are named by #1264 section 7.1 and #1267 section 6, with sources I read. I add rows 7 to 10 from the content side.

| # | Locked ruling | Where | What Moments does to it |
|---|---|---|---|
| 1 | D-161: three tabs in every build, Home, Book, Me (the founder has now named a fourth tab; the D-161 amendment is his and design's) | `docs/DECISIONS.md` D-161 (founder, 11 Nov 2026); IA-FINAL-20nov; IA-R1, N1, N4, J12 | A fourth tab reverses it. "Never a place: a Library tab" in IA-FINAL |
| 2 | BL-1305 and NS-49-R25: no photo usage string or PhotoKit in any 1.x build | `docs/BACKLOG.md`; `g6-production-flags-off.test.ts` | Route B needs both. Route A trips the g6 test on the entitlement |
| 3 | Q-PM-7 and CL-052: the picture-days work is drop C, after 1.0, spike first | `27-photo-moments-and-media.md` | A default or early tab pulls the timing forward |
| 4 | NS-51-R1, R8, R9: no other doorway for the ask; one newest moment, never a list; no title, place or count on the sheet | `27` | A tab that lists recent days and asks for access is a list and a second doorway. Handled by the same sentence-then-tap pattern, but a reversal of R8 |
| 5 | K-02: no photo card during first run | `docs/design/NOTIFICATIONS.md` | Met by the ruling: Home is the landing tab and no photo ask comes before the first saved letter |
| 6 | NX-39 ruling 3 and K1: no notification derived from the library | NX-39 | Any library-driven nudge, even a neutral one. NS-51-R11 already proposes the neutral form |
| 7 | BRAND.md glossary: "moment" banned for anything a person makes; "memory", "album", "journal" banned in copy | `packages/content/BRAND.md`, #1276 | Met once #1276 merges: Moments is allowed as the tab label and place name only. Until it merges the name has no glossary row |
| 8 | R-IA-3 and NS-50-R10: no picture strip, tile or feed | NS-50 | A tab of days can read like a feed. Mitigated by one screen, no endless scroll, no count (NS-53-R7, R9). The plain name is part of the mitigation |
| 9 | Q-PM-5 and CL-050: no place read at all | `27` | A map tile or place name would reverse it. None is proposed here. A parent-typed place on a letter is fine (#1267 section 5, option 2) |
| 10 | Wit scope (Option 2): wit in three places only | `WRITING-GUIDE.md` section 4 | The founder said the tab should be "witty, engaging". Ruled: plain tone on this tab. This file writes no wit |

## 6. Open questions

Closed by the rulings: the tab name (Moments), default tab (Home stays), the job sentence (EX-03), the time range (EX-31 dropped), the tradition filter (none), the trust line (EX-12 dropped; D-133 line only if needed).

- Q-EX-4 (design): does the sheet read "picture 2 of 5" aloud? A position is a count inside the parent's own pick, but "never a count" could forbid it.
- Q-EX-5 (design): is there a draft-in-progress state on the tab (NS-51-R8 hides the offer while a draft exists)? No line is written for it.
- Q-EX-7 (privacy, CLO): the pre-permission sentence EX-20, the usage string EX-21 and the label rows EX-25 are slots only and DORMANT. Route A or B first? CQ-8 recommends B.
- Q-EX-8 (privacy): is "Pictures from the weekend are here." (EX-94) acceptable inside the app only? It never reaches a lock screen, push or email.
- Q-EX-9 (privacy, CLO): is the identical-words nudge (EX-90 to EX-92) enough, or is any library-timed reminder a reversal to avoid? CQ-11 to CQ-15.
- Q-EX-11 (design, content): EX-16 "Pick one picture" uses the system picker and no permission. Does it show before the first saved letter, or is it also held until then?
- Q-EX-12 (counsel): clearance of the name Moments (X1, Q-X1-12). Until then it stays off the store page and website.

## 7. What I checked, and what I did not

Checked by hand, line by line, and by script against the #1276 Moments pattern (your, new, these, saved moments; a number; "moments from"; "photo moments"; capture, save or add a moment): ASCII only; no em or en dashes, curly quotes, ellipsis characters or emoji; zero exclamation marks; no he, she, her, him, his, son, daughter, boy, girl; `{child}` only where a line is names-on; no fear, guilt, loss, streak or gap words; none of the AI words (smart, magic, generate, polish, perfect, enhance) and none of tidy, cleaned up, improved, corrected; no "Oops", "Something went wrong", "Please", "just", "simply", "successfully", "failed", "unable to", "invalid"; no `{app}` typed as the product name; push lengths under 40 and 110; buttons under 22. EX-10 and EX-11 are the one place a slogan rhythm is flagged: EX-10 is held and EX-11 stands in for it. EX-75 and Q-EX-4 flag a count.

Not run on this file: the rules test reads code strings, not this doc; see the PR for what was run. Not read: the Project docs (not reachable here; I worked from a summary of the explore-tab ruling); a rendered screen of this tab (none exists in the repo); Apple's current App Review text beyond what #1267 quotes; whether the entitlement needs Apple's approval (UNVERIFIED). I am a Claude role, not counsel; every legal or store point is "counsel must confirm".

## 8. Where to go next

- The D-161 amendment and bar position are the founder's and design's. Until the founder says go on the library read, no DORMANT string is wired, and no string here is wired before he approves the words.
- Once #1276 is on `develop`, `content` moves the approved lines into `packages/content/src` in one PR with the rules test, each line keyed, each fallback in the same slot.
- Nothing here edits `docs/agents/**`, `package.json`, `packages/content/src` or `docs/legal/**`.
