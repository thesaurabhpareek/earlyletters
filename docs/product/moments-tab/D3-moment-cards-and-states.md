# Moments tab, D3: the moment card, day groups, the detail view, choosing photos, and every state

Status: PROPOSED, 21 Nov 2026 (UTC). Docs only. Author: Design lead D3 of 5 (id `d3`). Brief of record: `/home/claude/moments-brief.md` (20 Nov 2026). Everything here waits for the founder's signature. Public name is `{app}`. The family in every example is Asha. "Moments" is the working tab name only; see MT-D3-Q1.

## 1. Purpose and scope

The founder asked for a tab that learns from the journaling-suggestions picker and does it in a smarter way for this product. This file designs the part a parent touches most: the card for one day of photos, how cards group, what opens when a card is tapped, how a parent picks photos for a letter, and every state the tab can be in.

In scope: the day card (called "moment card" in the assignment), the collage rules for 1 to many photos, the video marker, date styling, the parent's own label, the compose affordance, day groups, the detail view, selecting photos for a letter, the states (loading, empty, limited, huge library, offline, error, dismissed, snoozed, hidden), and how this differs from Apple's picker.

Out of scope (other leads own them): the default landing and the permission ask (before permission, value screens), the For you ranking, Route A versus Route B feasibility, motion and transitions, legal wording and the privacy analysis. Where I need an answer from them I name it in section 12.

Two routes decide how much of this ships (brief, "Two routes"). I design for Route B (our own on-device PhotoKit read, Limited access honoured) because only Route B lets us draw our own cards. Section 10 says what survives under Route A.

## 2. Inputs read

| Input | Path or URL | Use |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | Rules, reversals, constitution |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | Paper content, glass only on controls, max three glass surfaces, solid fallback, per-screen gate |
| Memory Library flows | `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` | Access levels table (1.4), chooser ML-S4, gentle cap, iCloud states, truth rule (1.2) |
| Photo with a letter | `docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md` | One photo per letter in Build 13 (NS-01-R22), no date chip in Build 13, Home as the only start (J4) |
| Component specs | `docs/design/COMPONENTS.md` (names only: Chip, Toast, PhotoFrame 2.23, SegmentedControl 2.9, Sheet, ErrorLine, AppNote, LetterCard) | Reuse before build |
| Open PRs | `gh api repos/thesaurabhpareek/earlyletters/pulls?state=open` on 21 Nov 2026 | Found #1264 (Home wheel). Did NOT find the privacy, feasibility or concept PRs or branches. See section 12 |
| Apple, JournalingSuggestionsPicker | https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md | Read this session |
| Apple forum quoting WWDC20 session 10652 | https://developer.apple.com/forums/thread/652819 | Read this session; second hand |

Where my reading disagrees with the brief:
1. MEMORY-LIBRARY-FLOWS 1.1 says parents never read the word "moment" because BRAND.md lists it as an internal word. The brief proposes "Moments" as the tab name. I keep "Moments" as a working label in this doc only and ask content to rule (Q1). No parent string below uses it.
2. The brief says minimum iOS 17.0 (D-098). Apple's page for the suggestions picker lists availability "iOS: 17.2.0 -". Route A therefore needs iOS 17.2, not 17.0. Marked VERIFIED for the page, UNVERIFIED for any older-version fallback.
3. MEMORY-LIBRARY-FLOWS ML-S4 says a limited-access user gets "Choose more". I keep that and place it inside the tab (R19), not in the tab bar or on cards.

## 3. The idea in one paragraph

A day card is a small paper object: the day's date, up to four of the parent's own photos, and one plain button that starts a letter. It says nothing about what is in the photos. It never counts, never says how long ago, never names a place unless the parent typed one. It is the shoebox with the date written on the lid.

## 4. How it differs from Apple's picker, and why

Apple's suggestions picker is a system sheet. Its page says it displays several grids of content that lay out visual mementos, and that after a person selects one the system shares only the information associated with the chosen suggestion with the app. Apple's photo picker, by the WWDC20 session as quoted in a developer forum, does not prompt for library access in its default configuration, and the asset identifier is only filled in when the picker is made with library access (second hand, VERIFIED only that the forum says so).

| | Apple's picker (as seen in the founder's screenshots, UNVERIFIED that it is the system sheet) | Our Moments cards (Route B) | Why |
|---|---|---|---|
| Who draws it | System. We cannot restyle it | Us, on paper | Content stays paper (design language v2) |
| Titles | Machine-made: time of day, outing, place, people | None. A label shows only if the parent typed or chose it | "The machine may remove and repair. It may never add meaning." |
| Place and people | Shown by Apple | Never shown unless typed by the parent | No scene, place or person guess; place lookup may send coordinates to Apple (UNVERIFIED) |
| Collage choice | Apple's own | Content-blind: no scoring of what is in a photo | Scoring a photo is analysing it |
| Knows our letters | No | Yes: a day that already has a letter says so and opens it | Celebrate what exists |
| Compose button | Small icon | A text button with a verb, 44 pt | Colour and icon are never the only signal; AX5 |
| Selection | Picks one suggestion, we receive its parts | Per photo, with a visible ring, check and spoken state | Control; Switch Control; VoiceOver |
| Memory of "not this one" | Apple's | Ours, on the phone only: dismissed, snoozed, hidden | The parent is in charge of what appears |
| Counts, streaks, "N photos" | Not our concern | Never | Brief: no counts, gaps, streaks, points or badges |
| Reach | Whatever Apple suggests | Library with Limited access honoured | Works with a few chosen photos |

What we keep from Apple's idea: newest-first days, a collage per day, a map-free calm card, and one obvious way to start writing. What we drop: every machine-made word.

## 4a. Market benchmark (B1) and the new IA ask

Founder update, 20 Nov (later): the tab need not be default; it may be second, centre or inside Home, and it is the daily-return engine for in-app cards, local push and email. The market benchmark doc B1 (Day One, Google Photos, Apple Photos memories, Qeepsake, Tinybeans, Lifecake, Remento, Storyworth, Timehop and others) is to appear on branch `wip/moments-b1`. On 21 Nov 2026 `git ls-remote origin wip/moments-b1` returned nothing, so I have read none of it and cite none of it. I will not guess what those products do. Reconcile when it lands: for every pattern we adopt, cite B1's row; for every pattern we leave, say why in one line. Until then the card design rests on the repo specs and the constitution only (UNVERIFIED against the market).

What the card contributes to the daily-return reason, without streaks, counts, guilt or gap-counting:
- The reason to come back is a day worth a few words, shown as a card with the parent's own photos. Nothing says what was missed.
- One moment signal (a day with photos, a typed occasion, a month or age day) feeds three faces: this card, a local push, an email. The card is the only face that may use library signals (ML-3: no push is created from library data; the server never sees the library). A push or email may use only the child's date of birth, typed days and letters made, with fixed neutral text (NS-51 style, for example "Some pictures from the weekend are here" is NS-51's own example, quoted second hand from the brief) and no thumbnail. I did not re-read ML-3, NS-32 or NS-51.
- Position of the tab (default, second, centre, inside Home) is D1's or the IA lead's call. This doc works in any position: the card and detail sheet do not depend on it. If the tab is not default, the first card a parent sees is the same day card, reached from the tab or from a For you card.
- Reversals the founder owns, restated for my area: J4 (compose starts a letter from this tab), ML-6 (cards show thumbnails), BL-1305 (any library read), K-02 (the ask).

## 5. The day card

### 5.1 Anatomy (top to bottom)

1. Date line.
2. The parent's own label (only if it exists).
3. The collage (1 to 4 tiles).
4. A quiet "A letter is here" row (only if a kept letter is linked to this day).
5. The compose button.
6. The card menu (three-dot, 44 pt target) holding "Not now", "Not this one" and "Hide this day".

Wireframe, default, Asha, a day with five photos and one video:

```
+--------------------------------------------------+
| Saturday 14 June                          [ ... ] |
| Asha at the park                                  |   <- parent's label
| +---------------------+ +----------------------+ |
| |                     | |                      | |
| |      photo 1        | |      photo 2         | |
| |                     | |                      | |
| +---------------------+ +----------------------+ |
| +---------------------+ +----------------------+ |
| |      photo 3        | | (play)       photo 4 | |
| |                     | | 0:14                 | |
| +---------------------+ +----------------------+ |
|                                                  |
|  [ Tell a letter about it ]                      |   <- compose, 44 pt min
+--------------------------------------------------+
```

The `[ ... ]` in the wireframe is the menu button drawn as a three-dot icon with the accessible name "More for this day". It is not an ellipsis in any string.

The card sits on `surfaceRaised` with a 1 pt `line` edge and radius `lg`. No glass on the card. The compose button is a `Button quiet md` or `Button secondary md`, never terracotta (terracotta means recording).

### 5.2 Date styling

- Weekday and date in the serif card title style (`title3`, the missing style named in design language v2 A4). Example: "Saturday 14 June".
- Year shown only when it is not the current year: "Saturday 14 June 2025". No "last year", no "N days ago" (MEMORY-LIBRARY-FLOWS 1.1).
- "Today" and "Yesterday" are date words, not counts. Proposed; content may prefer the plain date (Q2).
- Date format follows the device locale. The date is the day in the phone's current time zone; a late night that crosses midnight is two days (limit stated in section 9, E9).
- The date is a real heading for VoiceOver, so a parent can move card to card by heading.
- Never the time of day as a word ("Morning"): that is a machine title. A time range appears only in the detail view as plain times on each tile's spoken name.

### 5.3 The parent's own label

A label appears only when the parent typed it or chose it. Sources, all parent-made: text typed on this day card ("Add a name for this day"), an occasion the parent typed on the occasions screen that falls on this date, or the label of a letter already kept for this day.

- Style: `body`, `text`, one line at default sizes, wraps whole at Dynamic Type sizes from `xxxLarge` up to AX5. Never truncated (D-027).
- Tap on the label opens a one-field sheet to edit it. Maximum 60 characters (the same bound as the place field in spec 01; proposed).
- No suggestions, no autocomplete from photo data, no "Add a title" hint filled by the machine. The empty prompt is a quiet button: "Name this day" (Q3, content words it).
- A label is stored on the phone, in the same phone-only place as the dismissals (section 8). It never goes to analytics.

### 5.4 Collage rules

Photos are chosen without looking at what they show. Order inside a day is by capture time, earliest first. The tiles chosen:
1. Any photo the parent already attached to a letter for this day comes first.
2. Then photos spread evenly through the day by capture time, so the card shows the shape of the day and not a burst of 30 shots from one minute.
3. Never ranked by sharpness, faces, smiles, scene or any content score. The only inputs are capture time and the parent's own earlier picks.

Layouts (all tiles share a 4 pt gap, `tokens.space[1]`, and radius `md`; tile crop is centre crop and the full photo is one tap away, so a crop changes presentation, not meaning):

```
1 photo        2 photos       3 photos        4 or more (shows 4)
+---------+    +----+----+    +-------+----+   +----+----+
|         |    |    |    |    |       | b  |   | a  | b  |
|    a    |    | a  | b  |    |   a   +----+   +----+----+
|  (4:3)  |    |    |    |    |       | c  |   | c  | d  |
+---------+    +----+----+    +-------+----+   +----+----+
```

- 1 photo: one tile, 4:3, full card width.
- 2 photos: two squares side by side.
- 3 photos: one tall tile on the left (two thirds width), two stacked squares on the right.
- 4 or more: a two by two grid of the four chosen. The card never says how many more exist. The detail view shows all of them.
- At accessibility text sizes the collage stays the same (its tiles are picture, not text), the card grows taller because the date, label and button wrap whole, and the compose button goes full width.
- The collage is one VoiceOver element, not four. Its spoken name: "Photos from Saturday 14 June" plus, where a video is present, ", includes a video". No count, no description. A parent opens the day to hear each item.
- Reduce Transparency and Increase Contrast: nothing on the collage uses transparency except the duration badge, which gets a solid `scrim` (R5).
- A tile whose thumbnail has not arrived shows a flat `surfaceSunken` square, no spinner, no shimmer. When it arrives it replaces the square with one `fadeMs` cross-fade (a plain swap under Reduce Motion). The grid never reorders after it first draws.

### 5.5 Video marker

- A video tile shows a duration badge bottom-left (for example "0:14") on `scrim` with `onScrim` text, and a play glyph. The duration is text, not only a glyph.
- The poster frame is the one the system provides for the thumbnail. We do not choose a "best frame".
- Spoken name for a video tile in the detail view: "Video, 14 seconds, 10:42". On the collage the group name already says it includes a video.
- Badge text size follows Dynamic Type up to the `xxxLarge` step then holds at that size (it sits on a picture, so it cannot grow without covering it); the same duration is in the spoken name, so nothing is lost at AX5.
- No autoplay on the card. Video plays only in the detail viewer, after a tap, and respects Reduce Motion by not looping.

### 5.6 The "A letter is here" row

When a kept letter is linked to this day (the parent attached photos from this day, or the letter's own date is this day), a single quiet row shows under the collage: "A letter is here" with a `Button quiet` "Read it". It opens that letter. The compose button stays, so a second letter is possible. This celebrates what exists. It never says "you wrote N".

A letter sealed to a later date (spec 04) does not show this row, and its photos do not appear in the collage until it opens.

### 5.7 The compose affordance

Apple's is a small compose icon. Ours is a text button with one verb.

- Label (placeholder, content words it, Q4): "Tell a letter about it". The verb is "tell", from the J1 to J10 vocabulary work; I have not re-read it, UNVERIFIED.
- `Button quiet md` at default; 44 pt minimum height and width; full width at AX5.
- Tap goes to the selection step for this day with nothing pre-selected (section 7). It never starts a letter by itself and never opens the microphone (listening starts only on the parent's tap, F04).
- The tap hands the chosen photos to the same Speak or Type capture that Home uses. This is the reversal of J4 that the brief lists; I do not build a second capture path (Q5).
- Disabled never. If access is limited and this day has no visible photos, the card is not shown at all, so there is no dead button.

Shown / Records / Never / Decline for the compose button (COORDINATION section 10, because it leads to a copy of a photo being kept):
- Shown: before Keep, the Review screen shows the photos that will be kept in the book, by tile.
- Records: on Keep, a copy of each chosen photo or video in the app's own storage, linked to the letter; the day it belongs to; nothing else from the library.
- Never: a place, a person, a scene guess, a filename or an album, in any log, event or crash report. The photo never leaves the phone from this tab.
- Decline: back from selection, or "Let it go" in Review, drops everything; nothing was copied before Keep (HYPOTHESIS about implementation; `mobile` confirms).

## 6. Day groups

### 6.1 The Recent list

```
Recent
+--------------------------------------------------+
| JUNE                                              |   <- month heading, label style
| [ day card: Saturday 14 June ]                    |
| [ day card: Friday 13 June   ]                    |
| [ day card: Tuesday 10 June  ]                    |
| MAY                                               |
| [ day card: Sunday 25 May    ]                    |
| ...                                               |
+--------------------------------------------------+
```
(The row of dots is the drawing's, not the screen's.)

- Newest first by day, grouped under month headings (heading trait, `label` style). Month words come from the Book's month words, not new strings.
- One card per calendar day that has at least one visible photo or video. A day with a single photo still gets a card (1-photo layout).
- No weekly or "trip" grouping and no merging of nearby days: grouping by outing is a machine reading of meaning. A parent can pick photos across days only by opening the detail view of one day at a time (Q6 asks whether a two-day pick is wanted).
- No dedupe of near-identical photos (that is image analysis). The even-spread rule (5.4) keeps the card readable.
- Screenshots and screen recordings: excluded from cards by default if the system marks them with its own media subtype flag (a file-level flag, not image analysis; availability UNVERIFIED, Q7). They are still reachable in detail under the "All" filter.
- Months load as the parent scrolls. The list never shows a total, a "load more" button, an end marker with a count, or "you are all caught up".
- A day already hidden, dismissed or snoozed (section 8) is simply absent. No gap, no placeholder, no "3 hidden".
- Pull to refresh is not offered; the list re-reads the library on foreground.

### 6.2 Section order on the tab

For you (D2's part) comes first, then Recent. A `SegmentedControl` or two `Chip` filters switch between them, text labels "For you" and "Recent" (Q1 on the words), 44 pt, becoming stacked `Chip`s at AX5 (COMPONENTS 2.9). Last-used choice is remembered. Default for a parent with library access: For you.

## 7. The detail view, and choosing photos for a letter

### 7.1 Opening a day

Tapping the card (not the compose button) opens the day. It is a full-height `Sheet` with grabber, native pull to close, and a "Close" text button top left (44 pt). It is a sheet, not a pushed screen, so the tab and its scroll position stay where they were.

```
+--------------------------------------------------+
| Close                              Choose photos  |
| Saturday 14 June                                  |
| Asha at the park                                  |
| [ All ] [ Photos ] [ Videos ]                     |
| +-------+ +-------+ +-------+                     |
| |   1   | |   2   | |   3   |   <- time order     |
| +-------+ +-------+ +-------+                     |
| +-------+ +-------+ +-------+                     |
| |   4   | | play  | |   6   |                     |
| |       | | 0:14  | |       |                     |
| +-------+ +-------+ +-------+                     |
|                                                  |
|  [ Tell a letter about it ]                       |
+--------------------------------------------------+
```

- Grid: 3 columns by default, 1 column at accessibility sizes (NX-33-R13 rule as carried in ML-S4). Tiles are the NEW `MediaTile` (square crop, 96 pt minimum edge).
- Order: capture time, earliest first, so the day reads as it happened. No section for "Highlights".
- A tap on a tile opens a full-screen viewer with swipe between items, a Close, and a "Choose" toggle. The viewer is a plain viewer: no map, no caption, no "People", no description.
- Filters: "All", "Photos", "Videos" only. Never "People", "Places", "Favorites" or anything that implies recognition (ML-S4 rule).
- The label (5.3) shows here too and is editable.
- If a letter exists for this day, the "A letter is here" row sits under the label.

### 7.2 Selecting photos for a letter

Two ways in, one selection model:
- From the card: the compose button opens the detail view already in choosing mode, nothing selected.
- From the detail view: "Choose photos" (top right, text) enters choosing mode.

Choosing mode:
- A tap on a tile toggles it. A selected tile shows a 3 pt `accent` ring, a filled check badge at top right, Nothing else dims. Colour is never the only signal, so the badge is a shape (check) plus the spoken state.
- Spoken state: "Photo, 10:42, selected" or "not selected". Each tile is a toggle button with a selected trait.
- Long press opens the viewer with a "Choose" button, so Switch Control and VoiceOver users never need a long gesture to select. No drag-to-select (pointer-only gesture with no accessible equivalent).
- Footer (pinned; inline at AX5): `Button primary lg` "Add" disabled until one is chosen, with the reason in words beside it ("Choose one or more to add."). Once chosen, the label reads "Add 3": a count of the parent's own selection, not a gap. Beside it a `Button quiet` "Clear".
- Gentle cap (proposed from ML-S4, Q8): 8 photos and videos per letter, 2 videos, each up to 60 seconds. A footnote line at 6 chosen ("A letter holds up to 8."); at 8 the other tiles stay visible and a tap announces the limit politely. No countdown, no red. These are ML-S4's proposed numbers, not verified.
- Build 13 holds one photo per letter (NS-01-R22). This tab is after Build 13, so the multi-select above is post Build 13. If it ever ships earlier, choosing mode allows exactly one tile and "Add" becomes "Use this photo".
- "Add" goes to the same Speak or Type capture, with the chosen media shown as a strip above the red circle (spec 01, 3.2). Back returns to choosing mode with the selection intact.
- Nothing is pre-selected on the parent's behalf, ever. No "Select the best".

Wireframe, choosing, Asha, three selected:

```
+--------------------------------------------------+
| Close                                   Done      |
| Saturday 14 June                                  |
| +-------+ +-------+ +-------+                     |
| | [v]   | |       | | [v]   |   [v] = check badge |
| |  1    | |   2   | |  3    |                     |
| +-------+ +-------+ +-------+                     |
| +-------+ +-------+ +-------+                     |
| |  4    | | [v]   | |  6    |                     |
| |       | | 0:14  | |       |                     |
| +-------+ +-------+ +-------+                     |
|  [ Clear ]            [ Add 3 ]                   |
+--------------------------------------------------+
```

### 7.3 Detail view, other items

- Hide one photo: in the viewer, "Hide this photo" (Q9). It removes that photo from every card and the detail view, never from the Photos app.
- Hide this day: card menu and detail menu (section 8).
- Edit the label: tap the label.
- A video's cloud state, offline and limited notes are in section 9.

## 8. Dismissed, snoozed, hidden

Three different words for three different parent acts. All are stored on the phone only, in a table that sync never reads, and none appears in analytics, logs or crash reports. None shows a count, a badge or a "restore (N)".

| State | The parent did | What the parent sees | Returns? | How to undo |
|---|---|---|---|---|
| Dismissed | "Not this one" on a card | The card slides out (a plain removal under Reduce Motion). A `Toast` "Put away" with Undo for 10 seconds (the PRD's longer toast time from spec 01; mobile confirms) | No. Not again | Undo in the toast, or Settings, "Put-away days" (a list of dates, with Bring back) |
| Snoozed | "Not now" on a card | Same removal, `Toast` "Not now. It will come back." with Undo | Yes, after a set time. Proposed 7 days; the parent may not like a number, so the toast never states it (Q10) | Undo in the toast; the card simply returns on its date |
| Hidden | "Hide this day" (or "Hide this photo") | One confirm sheet: "Hide this day from here? Your photos stay in your Photos app." with Hide and Cancel. Then the day or photo is absent | No. Not in For you, not in Recent, not in a collage, not in any suggestion | Settings, "Hidden from here", a list by date with Show again |

Rules:
- Snoozed returns once. If the parent snoozes the same day a second time, it becomes Dismissed. No third appearance (calm).
- A snooze or dismissal on a For you card does not touch the underlying day in Recent unless the parent chose the day's menu; the two cards are different objects. A For you "Not this one" about an occasion never removes photos.
- Hidden is the privacy tool. It must be quick: card menu, one confirm. It does not need a reason. It does not tell Apple.
- Hidden items are not backed up or synced in any way that would reveal a date (they live in the phone-only table). A reinstall forgets them, and the first screen after a reinstall shows the days again. That is a limit; the Settings row says "On this phone" and nothing more (Q11).
- The system's own Hidden album: assets in it are excluded from library reads by default (UNVERIFIED; I did not read Apple's PhotoKit pages this session). The device pass checks it (section 13).
- Copy for all three is placeholder and needs content: nothing here is a final word.

Shown / Records / Never / Decline for the three acts:
- Shown: the toast or the confirm sheet says what happens.
- Records: the day's date (a calendar day, no photo ids if avoidable; if ids are needed to hide one photo they stay in the phone-only table) and the kind of act.
- Never: an upload, an analytics event with a date, a photo id, or a count of hidden items.
- Decline: Undo, or Settings later. Doing nothing changes nothing.

## 9. States

Every state uses ordinary paper. No red, no apology, no "you are missing out", no counts, no "N weeks without a letter". Each state has the spoken and visual form below. Library facts about access follow MEMORY-LIBRARY-FLOWS 1.4.

### 9.1 Loading

- First open after permission: the list area shows the section structure only: the "Recent" heading and flat `surfaceSunken` card outlines with no shimmer and no spinner. Within a short time the first month fills in newest first. No skeleton animation (Reduce Motion safe by default).
- Cards appear in order and never jump: a card that has its date and tiles is final. A tile that is late fills in place (5.4).
- VoiceOver: one polite announcement "Loading your days" when the list starts, none after. Not repeated.
- If the first card takes longer than a few seconds, nothing changes on screen. No "this may take a while" text unless it takes much longer and then one footnote line: "Your photos are still being read on this phone." (Truth rule: only if the read really is on-device.) Time thresholds are proposed and not measured (Q12).

### 9.2 Empty

Two different empties, never conflated:

1. No access yet: the value screens (D1's part). Not an empty state.
2. Access, but nothing to show: the library has no visible photos or videos, or all days are hidden, dismissed or snoozed.

```
+--------------------------------------------------+
| Recent                                            |
|                                                  |
|        (line glyph, decorative, hidden)           |
|   Photos and videos from your days will show      |
|   up here.                                        |
|                                                  |
|   [ Choose a photo to start a letter ]            |
+--------------------------------------------------+
```

- The line (placeholder): "Photos and videos from your days will show up here." No "go take some", no "nothing yet", no "0".
- The one button opens Apple's system photo picker, which needs no library permission by the WWDC20 session as quoted (second hand), so the empty state is never a dead end. It hands one photo (Build 13 rule) to capture.
- If everything is hidden or put away, the same line shows; the Settings lists are the way back, not an empty-state link, to avoid revealing a count.

### 9.3 Limited (Selected photos)

The parent chose only some photos in iOS. This is a normal state.

```
+--------------------------------------------------+
| You chose to share some of your photos. These    |
| are the ones {app} can see.        [ Choose more ]|
+--------------------------------------------------+
| JUNE                                              |
| [ day card: Saturday 14 June  (1 photo) ]         |
+--------------------------------------------------+
```

- A pinned `AppNote` at the top of Recent (not on For you, not on cards) with ML-S2's words: "You chose to share some of your photos. These are the ones {app} can see." and a `Button quiet` "Choose more" that opens iOS's own selection screen. "Choose more" is only here and in Settings, never on a card.
- Cards show only what is visible. A day with one visible photo shows the 1-photo layout. We never say "there are more photos on this day".
- A card whose photos are no longer visible (the parent un-chose them in iOS) disappears at once without a message.
- A letter's already-kept copies are unaffected: they live in the book.
- The note stays quiet: `footnote`, `textMuted`, wraps whole at AX5.

### 9.4 Huge library

Assume tens of thousands of photos (a number I have not measured: UNVERIFIED, no real data).

- Read newest first in pages by day. The first screen needs only the newest days; older months are read as the parent scrolls.
- Collage choice for a day with very many photos reads only capture times, not pixels, until the four tiles are chosen; only those four thumbnails are requested.
- The detail view of a day with very many photos uses a lazy grid; the grid never loads all thumbnails at once.
- A 1-column AX5 grid is the same lazy list.
- Memory and battery: the read is on demand, never a background full scan. A background re-index of the whole library is not part of this design (it would also raise the privacy question for every photo). `mobile` and the architect confirm feasibility (Q13).
- No "You have a lot of photos" line. No count.
- Section scroll is by month heading; VoiceOver rotor by heading jumps months.
- An index that is still catching up shows what it has. Nothing reorders after it has drawn, except that a newer day may appear at the very top when the parent returns (and then only after the parent pulls nothing; it appears on foreground, above the first card, without moving what the parent is reading: if the parent has scrolled, the new card waits until they return to the top).

### 9.5 Offline

The library is local, so Recent works offline. Two parts do not:
- An original that is only in iCloud: its tile shows a small cloud glyph, and its spoken name ends with "In iCloud" (ML-S4 rule). Choosing and adding it needs a network: "These photos are in iCloud, and this phone is offline. Try again when you are connected." (ML-S4 line, placeholder). The card and detail view still draw from the thumbnail the system already has; if it has none, the flat square stays.
- Nothing else: no analytics wait, no account call is needed to see cards.
- A banner "You are offline" is not shown; a parent who never needs the network is not told about it. Only the iCloud tile explains itself, at the moment it matters.
- Download in progress: the footer shows "Getting 2 photos from iCloud" with a `Button quiet` "Stop"; after Stop, the chosen set stays chosen but not yet added.

### 9.6 Error

Errors are rare and plain.
- The library read fails (system returns an error rather than an answer): the list area shows one `ErrorLine`: "That did not work. Try again." with a `Button quiet` "Try again". No code, no log with a path, nothing about the photo. After two failures in a row, "You can try again later" and the Settings route.
- A thumbnail fails: the flat square stays, with a quiet small mark that is a glyph plus the word "Unavailable" in the spoken name (colour not the only signal). The day card still opens.
- Adding photos to a letter fails mid-way: the footer shows which tiles failed by spoken name and glyph; the others stay chosen. Retry only the failed ones. No partial copy is kept (section 5.7 Records).
- Access changed behind our back (the parent turned it off in iPhone Settings): the next foreground read shows the new state without a fuss (Denied or Limited screen), as in ML 1.4.
- Denied: the value screens (D1) with the system picker as the working path. Settings row: "Off in iPhone Settings" with "Open Settings".

### 9.7 State table

| State | List shows | Cards | Compose | Words |
|---|---|---|---|---|
| Loading | Headings and flat outlines | Fill in order | Hidden until a card has final tiles | Polite "Loading your days" once |
| Empty (with access) | One line and one button | None | One button to the system picker | Plain, no count |
| Limited | `AppNote` then cards for visible photos | Visible only | Normal | ML-S2 note |
| Huge | Newest months first, lazy | Normal | Normal | None |
| Offline | Normal | Normal; iCloud tiles flagged | Adding an iCloud original waits | Only on the iCloud tile |
| Error | `ErrorLine` and Try again | Whatever drew stays | Normal for drawn cards | "That did not work. Try again." |
| Dismissed | Card removed | n/a | n/a | Toast with Undo |
| Snoozed | Card removed | Returns once | n/a | Toast with Undo |
| Hidden | Day or photo absent | n/a | n/a | Confirm sheet, then silence |

## 10. What survives under Route A

If the feasibility work picks Route A (Apple's suggestions picker as a system sheet), we cannot draw day cards, apply collage rules or filter anything. What stays:
- One entry card in Recent: a `Button` that opens the system sheet. Its label is ours ("Choose from your days", placeholder).
- Whatever the parent picks arrives as photos and video; we show them in the same selection strip and the same Review as Route B (7.2 footer onward).
- We never store or show Apple's machine titles or place names (brief).
- Our own dismissed, snoozed, hidden states apply only to our own cards (For you), not to Apple's sheet.
- The picker's availability is iOS 17.2 and later per Apple's page (VERIFIED this session), above our floor of 17.0. On 17.0 and 17.1 the entry card does not show, with no apology (Q14).
- The parent's own label (5.3) and "A letter is here" (5.6) need a date, which the pick gives; they stay.

This means the day card is a Route B design. If Route A wins, sections 5.4 to 5.5, 6, 7.1 and 9.3 to 9.5 mostly go away, and the screen is much smaller.

## 11. Requirements

Format: id, plain sentence, Given/When/Then, test layer (unit, component, e2e on device, manual device pass).

- **MT-D3-R1 Day card has a fixed anatomy.** A parent sees a date, an optional label, the photos, an optional "A letter is here" row, and one compose button, in that order.
  Given a day with photos, When its card draws, Then the five elements appear in that order and no other text (no place, no title, no count). Test: component snapshot at default and AX5; manual.
- **MT-D3-R2 No machine words on the card.** Given any library day, When the card draws, Then the only words are the date, a parent-made label, and fixed strings. Test: unit over the card model (no field exists for a machine title) plus a content rule test that no key contains place or person words.
- **MT-D3-R3 Collage by time, not content.** Given a day with N photos, When the collage is chosen, Then the tiles are the parent's earlier picks, then even capture-time spread, and no image analysis runs. Test: unit on selection function with fixed timestamps (Asha fixtures only); a grep test for any Vision or scene API.
- **MT-D3-R4 Layouts for 1, 2, 3 and 4 or more.** Given N=1, 2, 3 and 6, When drawn, Then the layouts are 4:3, two squares, tall plus two, and two by two with no count. Test: component snapshot.
- **MT-D3-R5 Video marker is text and a glyph.** Given a day with a 14 second video, When the tile draws, Then a duration "0:14" and a play glyph show on a solid `scrim` under Reduce Transparency and Increase Contrast, and the spoken name says "Video, 14 seconds". Test: component; VoiceOver manual.
- **MT-D3-R6 Date is a heading, in locale, with no relative counts.** Given today is 21 Nov 2026 and a card for 14 Jun 2025, When drawn, Then it reads "Saturday 14 June 2025" (locale format), is a heading, and never reads "N days ago". Test: unit (date formatter, locales) and component.
- **MT-D3-R7 A label is parent-made only.** Given no typed label, When the card draws, Then no label shows and "Name this day" is offered. Given a typed label, Then it shows whole at AX5. Test: unit; component at AX5.
- **MT-D3-R8 Compose starts selection, not recording.** Given a card, When the parent taps compose, Then the choosing view opens with nothing selected and the microphone stays off. Test: e2e; assert no audio session started.
- **MT-D3-R9 Letter-here row.** Given a kept, open letter linked to the day, When the card draws, Then "A letter is here" shows with Read it; a sealed letter does not show it. Test: component; unit on the link query.
- **MT-D3-R10 Recent is grouped by day under months, newest first.** Given photos on three days across two months, When Recent draws, Then three cards under two month headings, newest first, no totals. Test: unit on grouping; component.
- **MT-D3-R11 Detail opens as a sheet.** Given a card, When tapped, Then a full-height sheet with the day's items in time order, and Close returns to the same scroll position. Test: e2e.
- **MT-D3-R12 Selection is visible three ways.** Given choosing mode, When a tile is chosen, Then a ring, a check badge and the spoken state "selected" all show. Test: component; VoiceOver manual; grayscale snapshot.
- **MT-D3-R13 Selection is reachable without a drag or long gesture.** Given Switch Control, When the parent uses it, Then every tile can be toggled by a tap, and the viewer has a Choose button. Test: manual device pass.
- **MT-D3-R14 Gentle cap with no countdown.** Given 8 chosen, When another tile is tapped, Then a polite announcement and the footnote show, nothing red. Test: component.
- **MT-D3-R15 Nothing pre-selected, nothing copied before Keep.** Given choosing mode opened, Then the selection is empty; Given the parent leaves Review without Keep, Then no file copy exists. Test: unit; e2e checking the app folder.
- **MT-D3-R16 Dismissed, snoozed, hidden differ and are undoable.** Given each act, When done, Then the toast or confirm shows as in section 8 and Undo restores. Test: unit on the phone-only table; e2e.
- **MT-D3-R17 Hidden never leaks.** Given a hidden day, When For you, Recent, a collage or a suggestion draws, Then it is absent, and no request, log or analytics payload contains it. Test: unit; network-capture e2e; analytics allowlist test.
- **MT-D3-R18 Loading is calm.** Given a first read, When it runs, Then no spinner, no shimmer, no reorder after a card is final, and one polite announcement. Test: component; VoiceOver manual.
- **MT-D3-R19 Limited access is honoured and quiet.** Given Selected photos, When Recent draws, Then only visible photos show, one `AppNote` with Choose more shows at the top of Recent, and nothing says what is hidden. Test: e2e with a limited fixture on device; unit.
- **MT-D3-R20 Huge library stays fast.** Given a library of tens of thousands of fixtures (generated, no real data), When Recent opens, Then only the newest months are read and only four thumbnails per card are requested. Test: performance test on device (numbers set by `mobile`; I give none).
- **MT-D3-R21 Offline works, iCloud tiles explain themselves.** Given airplane mode, When Recent draws, Then local days draw normally and an iCloud-only tile carries a glyph and "In iCloud" in its spoken name. Test: e2e on device.
- **MT-D3-R22 Errors are plain.** Given the library read fails, When it fails, Then an `ErrorLine` and Try again show, no photo detail in any log. Test: unit with injected failure; log capture.
- **MT-D3-R23 Empty is not a dead end.** Given access and no visible photos, When Recent draws, Then one line and one button that opens the system picker. Test: component; e2e.
- **MT-D3-R24 No counts, streaks or gaps anywhere on the tab.** Given any state, When drawn, Then no string contains a number except a date, a duration, or "Add N" of the parent's own selection. Test: content rule test over the tab's keys.
- **MT-D3-R25 Accessibility floor.** Given AX5, Bold Text, Reduce Motion, Reduce Transparency, Increase Contrast, light and dark, iPhone SE 3, When any screen here draws, Then letter text is whole, targets are 44 pt or more, order and labels are right, and contrast meets the numbers below. Test: the per-screen gate in design language v2; manual device pass queued in `docs/release/FOUNDER_QUEUE.md`, never claimed done.

## 12. Edge and unhappy paths (beyond section 9)

- E1: A day whose only photo is a video: the card shows one tile with the badge and the group name "Video from Saturday 14 June".
- E2: A photo with no date in the file (rare): it is excluded from day cards (no invented date). It stays reachable in the system picker. (UNVERIFIED how often this occurs.)
- E3: A photo edited later: grouped by its capture date as the system reports it.
- E4: Time zone change (travel): a card uses the phone's current time zone; a photo taken at 23:30 elsewhere may land on the next day. A known limit; no repair.
- E5: Same day, two letters: the "A letter is here" row opens the most recent; the detail view lists none by count; Q15 asks whether to show both.
- E6: The parent un-chooses a limited photo after attaching it: the kept copy stays in the book (see 9.3).
- E7: The parent deletes an original in Photos after keeping: the letter keeps its copy (kept copy model, ML gap 3, recommended; not decided here).
- E8: App backgrounded mid-selection: selection survives a short pause; after a cold start it is gone and the sheet closes without a message.
- E9: A late-night day boundary: one evening may split in two cards at midnight. We do not merge (merging is a machine reading of meaning).
- E10: VoiceOver user moves through 400 cards: headings per month and per card; the collage is one element so the rotor is usable.
- E11: A second child. The tab reads days, not children; no face matching. Which child a letter is for is chosen in capture, not guessed here. (Which child is shown in the label placeholder stays `{child}`; never gendered.)

## 13. Constitution, privacy and accessibility checks

Constitution
- No machine title, caption, place, person or scene (R2, R3). Pass by design: the card model has no field for them.
- No rewriting of words: this tab writes none.
- A label appears only if parent-made (R7).

Privacy
- Nothing from the library leaves the phone from this tab. No photo, id, filename, album, place or date in analytics, logs or crash reports (R17, R22). The Data Not Collected story holds only if nothing in the tab uploads; counsel and the architect confirm.
- Hidden, dismissed and snoozed live in a phone-only table (section 8).
- Place lookup: not used by this design at all (UNVERIFIED whether it sends coordinates to Apple; I avoid the question by not using it).
- Safety tiers are not touched.
- Reversals that this tab depends on and the founder owns: J4, K-02, BL-1305, ML-6, the three-tab ruling (brief).

Accessibility (WCAG 2.2 AA, Apple HIG; numbers below are from earlier files and not recomputed here)
- Dynamic Type to AX5 with letter text never truncated (D-027): date, label, buttons and notes wrap whole; picture tiles do not scale.
- VoiceOver: date is a heading; the collage is one element; tiles are toggles with a selected trait; focus returns to the card after the sheet closes.
- Contrast: text on `surfaceRaised` uses the same token pairs as ML-S1: 14.83 to 1 light and 14.29 to 1 dark (from ML-S1; not recomputed). The duration badge sits on a solid `scrim`. `textMuted` on `bg` 8.01 to 1 in dark (from ML-S2; not recomputed).
- Colour never the only signal: selection ring plus check plus spoken state; iCloud tile glyph plus text name; unavailable glyph plus text name.
- 44 pt targets: compose, menu, Close, Choose, filters, tiles (96 pt min edge).
- Reduce Motion: removals and fades become plain changes; no autoplay; no looping.
- Reduce Transparency and Increase Contrast: no glass on cards. The few glass controls (tab bar, filters row if floating) use the solid `glassFallback`; at most three glass surfaces on screen.
- Haptics: selection tap uses the system selection pattern only; optional (HIG, per design language v2 section 1).

## 14. Open questions, with a recommended default and a deadline

| # | Question | Default | Decide by |
|---|---|---|---|
| Q1 | Tab and filter words ("Moments", "For you", "Recent") against BRAND.md's "moment is internal" | Content proposes one-verb parent words; keep working names off screens | Before any screen string freezes; ask content on Mon 23 Nov 2026 |
| Q2 | "Today" and "Yesterday" or plain dates only | Plain dates only (safest against "how long ago") | Content, 25 Nov 2026 |
| Q3 | Words for "Name this day" and the label edit sheet | Content words it | Content, 25 Nov 2026 |
| Q4 | The compose verb and label | "Tell a letter about it" | Content, 25 Nov 2026 |
| Q5 | One capture path shared with Home, or a second | One shared path (no second capture) | CPO and mobile, 27 Nov 2026 |
| Q6 | Allow a pick across two days | No in v1 | Product, 27 Nov 2026 |
| Q7 | Exclude screenshots by the system's flag | Yes, if the flag exists (needs a device read) | Mobile spike, 30 Nov 2026 |
| Q8 | Cap of 8 photos, 2 videos, 60 seconds | ML-S4's numbers until a limit is measured | Product and mobile, 30 Nov 2026 |
| Q9 | "Hide this photo" in the viewer | Yes | Design and counsel, 27 Nov 2026 |
| Q10 | Snooze length | 7 days, never stated in words | Product, 27 Nov 2026 |
| Q11 | Reinstall forgets hidden days | Accept and say "On this phone" | Architect and counsel, 30 Nov 2026 |
| Q12 | Loading thresholds | Measure on device first | Mobile, with the device pass |
| Q13 | Is a background index allowed | No, on demand only | Architect, 27 Nov 2026 |
| Q14 | iOS 17.0 and 17.1 under Route A | Hide the entry; no message | Feasibility lead, 27 Nov 2026 |
| Q15 | Two letters on one day | Show the latest and a quiet "See the others" | Design, 30 Nov 2026 |

## 15. Dependencies

- Feasibility doc (Route A or B) and the privacy and constitution doc: not found in open PRs on 21 Nov 2026. I assumed Route B is available and that no place lookup is allowed. Reconcile when `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` and `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` land.
- Design concept `docs/design/MOMENTS-TAB-CONCEPT-21nov.md`: not found. Reconcile the card anatomy with it.
- PR #1264 (Home wheel, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md`): the tab replaces Home as default, so J4 and Home's photo-first mode change. Not read in full; I read only the PR title.
- New components: `MediaTile` (NEW), `DayCard` (NEW, built on `surfaceRaised` card style), `LensRow` or `SegmentedControl` preset (exists in spec 01 as NEW). Reuse: `Sheet`, `Button`, `Chip`, `Toast`, `AppNote`, `ErrorLine`, `PhotoFrame`, `LetterCard`.
- Tokens needed: a serif card title style (`title3`, design language v2 A4), `surfaceSunken` for flat tiles (not verified to exist: check `tokens.ts`), `scrim` and `onScrim` (named in ML-S4).
- Counsel for any words that say what is read or kept (rows marked R in the ML spec) and for the Data Not Collected story.
- `mobile` for the on-device read, paging, the phone-only table and Keep-time copy.

## 16. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session)
- Apple documentation page for JournalingSuggestionsPicker (https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md): availability iOS 17.2 and later; it displays grids of content; the system shares only the chosen suggestion with the app.
- Files in the repo named in section 2 (read by me on 21 Nov 2026 from a fresh clone): MEMORY-LIBRARY-FLOWS-10nov.md (first 200 lines), 01-PHOTO-WITH-A-LETTER-11nov.md (first 120 lines), DESIGN-LANGUAGE-V2-21nov.md (first 80 lines).
- Open PR list on 21 Nov 2026 shows #1264 and no Moments, feasibility or concept PR.

Second hand
- The photo picker needs no library permission in its default configuration, and the asset id is only filled with library access: from a developer forum thread quoting WWDC20 session 10652 (https://developer.apple.com/forums/thread/652819). I did not open the session itself.

UNVERIFIED
- That the founder's screenshots are Apple's system sheet.
- Whether the system exposes a screenshot flag for reads, and whether its Hidden album is excluded from reads.
- Place lookup sending coordinates to Apple.
- All thresholds, sizes, durations, time limits and counts in this file (snooze length, cap, 60 character label, 96 pt tile, 10 second toast). They are proposals, none measured.
- Contrast ratios quoted here come from earlier specs and were not recomputed.
- That the "tell" verb fits J1 to J10; I did not re-read them.
- Behaviour on a device: nothing here was run or seen on an iPhone, simulator or iPhone SE 3. The real device pass is a founder queue item and is not claimed.

Guess
- That a four-tile collage with no count is calm enough. A parent may want to know there is more. Test with parents.
- That "A letter is here" reads as celebration and not as pressure.
