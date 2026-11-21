# NS-53 Moments: connected experience and motion spec (hybrid)

Status: PROPOSED (a design spec for the hybrid route; nothing here is decided; the PRD is not edited)
Date: 21 Nov 2026
Owner: `design-systems`
Spec: `docs/product/prd/28-moments-tab.md` (wip/moments-prd, 1c1e05bc), `HYBRID-PICKER-DELTA.md` (wip/moments-picker-delta, a84f448c)
Prototype: `docs/design/moments-tab/prototype/moments-prototype.html` (clickable; README beside it)
Load when: you build or review the Moments tab, the picker host sheet, or any motion between them.

Fictional family Asha only. Words in quotes are placeholders for `content`, not copy. Labels: VERIFIED (I read it in the repo this session), DECIDED-BY-REVIEW (an executive review ruled it and I applied it), PROPOSED (my design choice), UNVERIFIED (nobody has read the primary text or tested it on a device). Every statement about what Apple's picker does is UNVERIFIED unless a review marked it read; I tested nothing on a phone.

## 0. The design in one page

The tab is where a parent decides. The sheet is where a parent chooses. Capture is where a parent speaks. Each surface does one of those and hands over without a seam.

Founder rulings applied as given: the library read ships in the first release (For you suggestions, Recent, city-level place and date lines); Apple's picker, embedded inline, replaces our album chooser, all-pictures grid and most of the viewer, and is the working path when library access is declined or limited; places and occasions in; faces and naming people out (O-30); the constitution (the machine never writes or shapes words; no counts, gaps, streaks or badges; no machine titles; Not now has the same weight as Continue).

The five motion decisions:

1. Tab to sheet is a measured-rect expand: one empty paper surface grows from the tapped lead tile to the full-height sheet on the `standard` token with overshoot clamped (about 0.4 s, no bounce), the lead tile is carried to its place, the rest of the sheet fades in from 60 percent of the way. Reduce Motion is a 200 ms cross-fade. Not Reanimated `sharedTransitionTag` (MOTION 8: experimental, cannot cross tabs).
2. Apple's view is never faded, scaled or moved while it is mounted. It is mounted after the sheet stops, under a still paper cover that fades away; the body swap fades only our layer (150 ms); on dismiss, Start or inactive, the cover goes on as a hard cut first.
3. Start to capture is a sequence, not an overlap: the sheet leaves over 160 ms while the chosen tray tiles stay and fly 320 ms into capture's picture slots. It needs a founder ruling on O-27 (the PRD default is no flight). Reduce Motion: no flight, a 200 ms cross-fade.
4. Not now is calm and equal in weight. On a card it fades 160 ms and the gap closes on `standard` (no confetti, no counts, Undo stays); on the sheet the paper returns to the card tile in 280 ms and nothing is announced.
5. No pull to refresh, no bounce anywhere, and no new haptic: the existing `tap` for a tile and for Undo, and Keep's existing `success`. Nothing in this spec adds a dependency: Reanimated 4.5.1, gesture-handler, expo-haptics and core `Image` are already in `apps/mobile/package.json` (VERIFIED). `expo-image` is NOT in that file, so this spec does not use it.

Open for the founder (sections 1, 5.4 and 9): O-27 (tray flight), the door in the never-asked state (EXH-CPO-1 versus EXH-DES-15), the Not now verb on the card face, and Layout A versus B (decided by the device matrix, section 9).

## 1. Review findings: applied, amended or rejected

Applied means the finding shapes this spec and the section says where. Amended means I applied its intent and changed the mechanism, with the reason. Rejected means I did not apply it, with the reason.

| Id | Verdict | Where, or why |
|---|---|---|
| EXH-DES-1 (G1a bar matrix, Layout A or B) | Applied | 4.8, 9.2 (DM-02 and the decision rule) |
| EXH-DES-2 (one route, one tray, one Start; continuous selection; union rule) | Applied; mechanism amended | 4.1 to 4.5. Amended: the body swap is a 150 ms cross-fade of OUR layer only, never of Apple's view (EXH-SEC-6 says the view ignores touches while its opacity is below 1) |
| EXH-DES-3 (first-run copy as one set, order rules) | Applied | 7 |
| EXH-DES-4 (task completion through the picker is a pass bar) | Applied | 9.1 (T7, T8), 9.2 (DM-07) |
| EXH-DES-5 (AX1 and above frame) | Applied | 4.9 |
| EXH-DES-6 (door hierarchy, labels not one word apart) | Applied | 2.2, 7.3. The prototype's first draft of the Limited foot broke the one-word rule; fixed |
| EXH-DES-7 (cover on inactive, close on lock) | Applied | 4.7, 8 (rows 4 and 5) |
| EXH-DES-8 (design the seam) | Applied | 4.2, 4.10, 9.1 (T9) |
| EXH-DES-9 (Start never Keep; Not now same reach) | Applied | 4.5, 4.6. On cards and the ask card the pair is equal in every way; on the sheet Start is the only filled control, both are at least 44 pt, Not now is always on screen |
| EXH-DES-10 (all entries use the modal rise) | Amended | The card entry is the measured-rect expand because the founder asked for a shared-element feel; the door and capture Add use the rise; the fall-back for a card with no measurement is the rise (5.1, 5.2) |
| EXH-DES-11 (theme) | Applied | 4.10 |
| EXH-DES-12 (limit and counts) | Applied | 4.4, 8 (row 2), 9.2 (DM-03) |
| EXH-DES-13 (no explanation line about Apple's menu) | Applied | 4.2, 7.4 |
| EXH-DES-14 (L3 baseline with a flat placeholder) | Applied | 10 |
| EXH-DES-15 (first-run order) | Applied | 2.2 (ACC-0), 2.6. The door sits below the ask card |
| EXH-DES-16 (do not market the door) | Applied | 7.4, 9.1 (T11) |
| EXH-CPO-1 (door only after an answer) | Rejected as the default, kept as a switch | The door stays below the ask card in ACC-0 (EXH-DES-6, EXH-DES-15 and the founder's "works in every state"). The CPO's concern, that the door takes some yes answers and we cannot measure it, is real; the prototype has a "Door when never asked" switch and G4 task T4 compares them. The founder decides |
| EXH-CPO-2 (never present the picker in the primer flow; order test) | Applied | 7.4, 9.1 (T5) |
| EXH-CPO-3 (hold the inline host; present Apple's picker as a sheet first) | Rejected | The founder ruled the embedded inline picker. Kept as Layout C, the fall-back if the device matrix says the inline view cannot be hosted well (4.8) |
| EXH-CPO-8 (split G1a; keep what decides a layout) | Applied | 9.2 orders the matrix by what decides a layout |
| EXH-CMO-1 (lead with the act) | Applied | 2.1 (job line), 7.1 |
| EXH-CMO-8 (host heading is not the tab name; store frames) | Applied | 4.3, 7.4. Store-frame approval is the founder's and not a design matter |
| EXH-CMO-10 (a picture on a card the parent did not want) | Applied | 2.3 (Not now on the face, one tap, Undo), 9.1 (T10) |
| EXH-PRV-1, 2, 3, 4, 5, 7, 8 (label and policy gate, build exclusion, date and strip contract, video hold, no library configuration, temp copies, no stored fact) | Carried | Not experience findings. They bind the build. This spec depends on them: Apple's body filter is images only until EXH-PRV-4 is proven (4.11); no event for the sheet (4.12) |
| EXH-PRV-6 (Limited: two controls, distinct labels, no "only the chosen pictures" claim) | Applied | 2.2 (ACC-3), 7.3 |
| EXH-PRV-9 (Hide this day one tap, Undo) | Applied | 2.3 |
| EXH-PRV-10 (People inside Apple's Albums) | Applied | 4.11. Albums stay on; search is off; we receive nothing from either |
| EXH-PRV-11 (no absolute claim in our host strings) | Applied | 7.3 |
| EXH-PRV-12 (close the sheet on every inactive event) | Rejected as the default | EXH-DES-7 asked for a cover that holds the picks, because a notification pull-down or a call would otherwise throw away a parent's choices. The privacy fall-back stands: if the device row shows the cover cannot hide Apple's view in the app switcher, the sheet dismisses on background and says so (4.7) |
| EXH-PRV-13 (synthetic Asha files in the spike) | Applied | 9.2 |
| EXH-SEC-6 (opacity, lock, inactive, links) | Applied | 4.7 |

## 2. The Moments tab, top to bottom

### 2.1 What is on every state

1. The heading "Moments" (display style) and one job line that states the act, not the suggestion: "Choose a day to tell {child} about." (EXH-CMO-1, EXH-CMO-11). Suggestions are a second, conditional sentence that appears only where the library read is on.
2. The body for the access state (2.2).
3. The tab bar: paper, hairline, never glass, never a badge.

Nothing on any state is a count, a gap, a streak, a "nothing yet", a machine title, a person or a face.

### 2.2 The body by access state

| State | Top to bottom | The door and what sits with it | Absent |
|---|---|---|---|
| ACC-0 never asked | Real cards first (age day, a typed day if any, the question); the ask card; the door row; one labelled example | The door is a quiet text row below the ask card, never beside it (EXH-DES-6). EXH-DES-15 order at AX1 and above: ask card, door, then the example | No iOS alert, no primer until the parent taps the ask. At most one example (EXH-DES-15) |
| ACC-1 Not now | Real cards; the door row; then "Show days from my pictures" at the same weight | The door is first: the first thing a parent who said no sees is something that works. The re-ask row follows it and is never above it | No timer, no counter of refusals, no explanation |
| ACC-2 granted (full) | Switch (For you, Recent). For you: up to four cards in slot order (today, look back, pictures, question). Recent: month headings, day cards newest first, bounded | The door is the last row of Recent, quiet. Its real value (pictures older than the Recent window) is tested in G4 | No count, no "x days found" |
| ACC-3 limited | As ACC-2 on the chosen set, no message. Foot of Recent: two rows of different kinds | Row one opens the phone's limited-library manager, with its one-line purpose. Row two is the door, with its one-line purpose. The labels differ by more than one word (EXH-DES-6, EXH-PRV-6) | No "only the pictures you chose" claim anywhere |
| ACC-4 declined | Real cards; the door row first; then one calm line with "Open Settings" | Both are text rows; neither is a filled button; no row is red | No second system prompt, no mention on Home or in a notification |
| ACC-5 restricted | Real cards; the door row first; one plain line that it is off by a setting on this phone | No button on the plain line | No reason named |
| Library flag off | As ACC-1 without the re-ask row | The door opens the same host sheet with Apple's body. If the whole photos switch (R106) is off, the door is absent | No library ask exists |
| Quiet, hidden, hard-stretch or expecting-only book (R253) | Heading, job line, the question of the kind Home uses, the door | The door stays | No library card, no Recent, no place line, no year-ago picture, no occasion collage, no line saying why, nothing records that the rule fired |
| Granted, no days to show | For you as usual; Recent shows one calm line and one action ("Tell {child}") then the door | The door stays | "Nothing yet", an apology, a count (R14) |

One verb family for the door in every place it appears (tab, day sheet, capture Add): "Choose pictures" (EXH-CPO-10, EXH-DES-6). R253's older word "Add pictures" folds into it. `content` owns the words.

### 2.3 Card anatomy

A card, top to bottom:

1. The lead tile: one picture (or the collage rule of the PRD, up to four, where the first is the lead). It is the expand origin (5.1). Nothing is drawn over it except R208's two marks.
2. The reason line, from the closed list, below the tile and never over it ("Pictures from your phone", "A day you marked", "From {child}'s birthday").
3. The date heading: weekday and date in the parent's locale.
4. The city or occasion line: for a day of pictures, a city from the offline city table with a pin, never a venue and never from a picture the parent picked (founder ruling; NEW-1); for an occasion card, the occasion ("{child}'s birthday"). The parent's own label sits beside it when they wrote one, as a separate field.
5. The "A letter is here" row, only when a kept letter exists for the day.
6. Two actions with equal weight: Continue and Not now. Same size (48 pt tall or more, 44 pt minimum target), same width, same outline, neither filled, neither coloured as the wrong choice. At AX1 and above they stack, Continue first, full width.

Order change to flag for product: the PRD (5.3) puts the reason line first and the pictures after the date; the founder's brief puts the lead tile first, and the expand needs the tile at the top. R186's "one action" becomes two. Both are one-line row edits (11).

What Not now does on a card (PROPOSED): it is the existing set-aside verb promoted from the card menu to the face, one tap, with Undo (EXH-CMO-10, EXH-PRV-9 both need it one tap, including on Recent cards). The card menu keeps the place verb ("Not this place") and the teaching verbs. `content` decides whether the face word is "Not now" or "Not this one"; the founder's brief says "Not now". Effects are those of R28 and the decisions store, unchanged.

### 2.4 Recent

Months as headings, day cards under them, newest first, one screen of rhythm, no count, no "see all". Cards are the same anatomy. The door is the last row.

### 2.5 Empty states

A section with nothing to show gets one calm line and one action (R14). The new-account tab (no letters, no child) shows the real "no library" cards, never a blank, a wall or an uncloseable modal (R69).

### 2.6 First run, minute by minute (the tab part)

| Moment | The tab shows | Must not happen |
|---|---|---|
| First open, no permission | Heading, job line; the real cards settle in (first three, `enter`: 8 pt, 280 ms, 30 ms stagger); the ask card; the door row; one example | An alert, an empty page, a count |
| Parent taps "Show days" | The primer sheet rises (`standard`, clamped) over the tab | Apple's alert before our primer |
| Primer Continue, then the system alert | Nothing of ours moves behind it | A second ask, a message about which answer is better |
| Parent taps Not now (ask card or primer) | The same calm move as a grant: examples and ask leave 160 ms, the gap closes 280 ms, the list enters from 160 ms, 590 ms in all (A3-R10, R16); the door becomes the first row | A different animation for a refusal |
| Parent taps "Choose pictures" first | The host sheet with Apple's body. Apple's first-show panel appears inside it, in Apple's words. Our primer is never triggered by this | Any copy of ours beside or over Apple's panel |

### 2.7 Wireframes

ACC-0 (default size):

```
+------------------------------------------+
| Moments                                  |
| Choose a day to tell {child} about.      |
| +--------------------------------------+ |
| | kicker  Month day                    | |  real card: reason, heading, two actions
| | [ Continue ]        [ Not now ]      | |
| +--------------------------------------+ |
| | A question for {child}               | |
| | [ Continue ]        [ Not now ]      | |
| +--------------------------------------+ |
| | Show days from your pictures?        | |  ask card: variant C text
| | [ Show days ]       [ Not now ]      | |  equal size and weight
| +--------------------------------------+ |
|   Choose pictures                        |  quiet door row, below the ask
|   one labelled example                   |
+------------------------------------------+
```

A day card (ACC-2, For you):

```
+------------------------------------------+
| +--------------------------------------+ |
| |            lead tile                 | |  expand origin; nothing over it
| +--------------------------------------+ |
| Pictures from your phone          (menu) |  reason line (kicker), card menu
| Saturday 14 June                         |
| (pin) Pune                               |  city line, offline table
| At the park with Nani                    |  the parent's own words, if any
| [ Continue ]            [ Not now ]      |
+------------------------------------------+
```

## 3. What lives where

| Job | Tab | Sheet | Capture |
|---|---|---|---|
| Decide what to start from (reason, date, city or occasion, two actions) | Yes, the whole job | No | No |
| Ask for the library (ask card, primer) | Yes (ask card on the tab; primer is a sheet over the tab) | Never | Never |
| Explain what the app reads | The ask card and primer only | Nothing. Apple's own panel appears in Apple's view | Nothing |
| Choose pictures (our day tiles, or Apple's picker) | No | Yes, the whole job | "Add" opens the same host sheet |
| See what is chosen (tray), the limit line, Start | No | Yes | The chosen pictures at size |
| Remove a chosen picture | No | In the body where it was chosen, before Start | Capture's existing delete |
| The date chip for a picked picture (offered, never preselected) | No | No | Yes (R95) |
| Words: talk or write | No | No | Yes |
| Keep | No | No | Yes; lands on the Book (A4-R20), return-to-tab is open (O-19) |
| Set a card aside, Undo, place verbs | Yes | No | No |
| Open Settings line, limited-library manager | Yes | No | No |
| Place name | The card's city line | Not repeated | Never |
| Numbers (counts) | None | None (the limit line has no digit) | None |
| Sheet-only strings | | Heading, Not now, Start, limit line, body swap row, tray group name | |

Rule of thumb: the tab never chooses, the sheet never explains, capture never browses.

## 4. The host sheet: one route, two bodies

### 4.1 The route

One route, `moments/pick`, serves every entry: a card's lead tile or Continue, the tab's door, the day sheet's "Choose other pictures" row, and capture's Add. It is one presentation in the product (EXH-DES-2, EXH-CPO-10). It is a transparent modal with no platform animation, the same mechanism as the card-to-page transition (MOTION 5f, `lib/transitions.logic.ts`), so our own surface can grow from the card. The Sheet component (`@gorhom/bottom-sheet`, MOTION 5i) is not used for this route because it rises from the bottom and cannot grow from a tile. Mobile builds one component, `PickHostSheet`, from existing parts (Text, Button, tokens, Reanimated). No new package.

### 4.2 The frame (ours) and the seam

```
+------------------------------------------+
|  [Not now]        {day heading}          |  title row, paper. Not now: 44 pt minimum
+------------------------------------------+
|  (page margin, space 4 = 16 pt, on sides)|
|  +--------------------------------------+|
|  |  BODY: our day tiles                 ||  or Apple's picker view
|  |        or Apple's view               ||  the seam: paper surround, mediaFrame hairline
|  +--------------------------------------+|
|  quiet text row: "Choose other pictures" |  only when opened from a day; swaps the body
+------------------------------------------+
|  tray: [ ][ ][ ]   one calm limit line   |  `surface`, hairline `line` on top, no shadow
|                           [   Start   ]  |  Start filled, 56 pt minimum
+------------------------------------------+
```

- Surfaces: paper for the frame, `surface` for the foot, `mediaFrame` with `stroke.control` for the hairline round Apple's view. No glass here: glass is for navigation and controls, and this sheet needs none (0 of the 3 allowed).
- A rounded clip (radius `md`, 14) round Apple's view only if the device matrix shows it does not crop the privacy badge or the first-show panel (EXH-DES-8); never crop Apple's badge.
- We never imitate Apple's controls inside our parts: no blue, no numbered badges, no round checkmarks of our own that look like theirs. Our tiles use our language: ring, check, spoken state (R90).
- No explanation line about Apple's Options menu or badge (EXH-DES-13).

### 4.3 The heading

Not the tab name (EXH-CMO-8). With a day: the day's date (title2), with the parent's own label under it if they wrote one. With Apple's body and no day: "Choose pictures". The heading takes focus when the sheet opens and the sheet is modal for VoiceOver. At AX1 and above the heading stays on one line at title2 capped at 1.4 times (PROPOSED cap, tuned at DM-07), never body size.

### 4.4 The tray

- Small still thumbnails, 44 pt fixed (not scaled with text), radius `sm`, `mediaFrame` outline.
- Decorative to VoiceOver, grouped as one element named for what it holds ("Pictures chosen for this letter", `content`'s words), with no count text, no number and no control over a thumbnail. Not interactive in v1: a parent puts a picture back in the body where they chose it.
- One truth for both bodies: it holds what is chosen in our tiles and in Apple's picker together, in time order, within the limits of R90 across both (6 pictures, 2 videos). If the same picture is chosen in both bodies a duplicate is accepted and capture's existing delete handles it; whether a duplicate can be detected is UNVERIFIED.
- The limit line appears once, in our words, in our frame, when the tray is full; it contains no digit. In our body the seventh tile is refused and the line shows. In Apple's body we cannot see a refused tap, so the line shows whenever the tray is full. What Apple draws at the limit, and whether it shows a number in a bar we cannot hide, is UNVERIFIED (DM-03).
- If thumbnails of Apple's picks cost too much memory or iCloud time on an iPhone SE 3 (DM-11), the tray has no thumbnails: only Start and the limit line, and Start's hand-off has no flight (5.4).

### 4.5 Start

One Start for both bodies. Filled, 56 pt minimum, bottom third. Disabled (and said to be) until something is chosen. No number, no count word in the label (EXH-CMO-12). Never "Keep": Keep saves a letter (EXH-DES-9). Start plays no haptic. It takes everything chosen in both bodies.

### 4.6 Not now and dismissal

- Not now is always on screen, in the title row at default size and at the top of the sheet at AX, 44 pt minimum. It drops the picks and the temporary copies with no confirmation dialog, because nothing is saved and a dialog would be a nag (EXH-DES-9).
- Swipe-down, the scrim tap and VoiceOver's escape gesture are off while anything is chosen, so a stray gesture never throws picks away (the design review's answer to Q1; R150: a button for every gesture). When nothing is chosen they work and equal Not now.
- The grabber is hidden while anything is chosen.

### 4.7 Apple's view: what we never do to it

DECIDED-BY-REVIEW (EXH-SEC-6, EXH-DES-7, EXH-DES-10); the opacity statement is Apple's, read by the security review; the rest is UNVERIFIED until DM-10.

1. No ancestor of Apple's view has an opacity below 1 or a transform other than the identity at any time the view is mounted. It is mounted after the sheet stops moving.
2. It is never preloaded, never kept mounted behind our day body when not shown, and never started from a link or notification: the door opens only from a tap in the app (`scribe://moments` lands on the tab).
3. It starts under a still paper cover (no spinner, no shimmer). The cover fades over 200 ms; the view never does.
4. The cover goes on as a hard cut, with no fade, before anything moves, on: Not now, Start, the app going inactive, and dismissal by gesture.
5. Inactive or background (a call, a notification pull-down, the app switcher): our paper cover over the sheet, picks held in memory, restored when the app is active. App lock engaging or timing out: the sheet closes, picks and temporary copies are discarded, nothing is written. If DM-09 shows the cover cannot hide Apple's view in the app switcher snapshot, the fall-back is to dismiss on background and say so in the spec (a leaked picture is the worse failure).
6. The host sets Apple's interface style from our theme on presentation and on change; whether an out-of-process view honours it is UNVERIFIED (DM-06). If it does not, the frame is all we can do; we paint no scrim to hide a mismatch.

### 4.8 Layout A, B and C, and the rule that decides

- Layout A: Apple's bars hidden. Our title row, tray and Start are the only chrome. The wireframe in 4.2.
- Layout B: Apple's top bar kept inside the body, bottom bar hidden. Our Not now, tray and Start stay ours. If Apple's top bar carries an Add we cannot hide, Start is the primary control and Apple's Add is a second route to the same result (both end in one `AttachRequest`).
- Layout C (fall-back): the door and "Choose other pictures" present Apple's picker as its own sheet (the presented route that exists today), with Apple's Add and Cancel and a returned set. No inline host, no tray for Apple's picks. Use only if the matrix says neither A nor B works, or the memory row (DM-11) fails.

Decision rule, run on an iPhone SE 3 and the newest phone, iOS 17 and the newest OS available, under None, Limited and Full access, light and dark, with synthetic Asha files:

1. Layout A if, with both bars hidden: Albums is reachable, the Options menu is reachable, the privacy badge is still shown, the first-show panel still appears, continuous selection reaches us, and no count is drawn in a place we cannot hide. Never hide the Options menu: it is the parent's own privacy control and it is Apple's.
2. Else Layout B if the same list passes with only the bottom bar hidden.
3. Else Layout C.
4. If Layout A or B passes but task completion fails at AX5 with VoiceOver, Voice Control or Switch Control (DM-07), the public accessibility claim for starting from a picture is withheld until fixed; a letter never needs a picture (8, row 9).

### 4.9 AX1 and above (iPhone SE 3, AX5, Bold Text)

```
+------------------------------------------+
|  [Not now]                               |  its own row, 44 pt
|  Saturday 14 June        (one line)      |  title2 capped at 1.4x
+------------------------------------------+
|  BODY keeps most of the screen           |  PROPOSED bar: at least as much of the screen
|  our tiles: one column, full width       |  as our frame; tuned at DM-07
|  Apple's view: Apple's own type          |
+------------------------------------------+
|  [ ][ ][ ]     [   Start   ]             |  one row: fixed-size tray and Start
+------------------------------------------+
```

From AX1 our day tiles go to one column at full width, which is also how a grandparent judges a picture without a viewer (EX-DES-5, Q4). The body swap row, the limit line and the tray hint are capped at 1.4 times. If the picker body cannot keep at least as much screen as our frame, the tray collapses into the Start control (no thumbnails).

### 4.10 The seam, in one list

Ours: the sheet, title row, tray, Start, Not now, surround, hairline, body swap, doors, tab states. Apple's: everything inside the picker view (11). The one thing we never do is imitate Apple's controls in our own parts. The exception to "nothing over a photo" (R157, R208) is one object, Apple's view, and is not a licence for our own overlays.

### 4.11 What we ask Apple's view to do

PROPOSED, subject to the device matrix: embedded inline; continuous selection and no ordered variant (ordering is what numbers a pick; UNVERIFIED); `selectionLimit` set to our limit and checked again by us; Albums on (it replaces our album chooser); search off, staging area off, selection actions off (less Apple chrome to meet at AX5; Albums may show Apple's own people grouping, which is Apple's, which we never receive, and which the privacy review does not object to); images only until the video strip test passes (EXH-PRV-4).

### 4.12 No event

The door, the sheet and a pick produce no analytics event and no log line (EXH-DAT-2, EXH-PRV-8). The only picker code on the wire stays the existing failure code. We cannot measure door use; that is the price of keeping Apple's browsing private.

## 5. Connected transitions

All numbers are tokens in `packages/design-tokens/src/tokens.ts` unless marked PROPOSED. A tap lands on the end state at once (R144): any control is live from frame 1 and any tap during a move ends it. No move is longer than 420 ms and every sequence ends within 900 ms (R144, `sequenceMaxMs`). Motion runs on the UI thread in Reanimated 4.5.1 worklets; animate `transform` and `opacity` only, except the growing surface's frame and radius (the exception MOTION 7 already names for the card-to-page surface, which has no children whose layout moves).

### 5.1 Tab to sheet from a card (the shared-element expand)

Mechanism: the proven measured-rect pattern of MOTION 5f, not `sharedTransitionTag` (experimental, native stack only, cannot cross tabs, MOTION 8) and not `Link.AppleZoom` (alpha, iOS 18 and later only). On touch-down the tapped lead tile's rect is measured into a small store, as `CardSource` does. The sheet's content is laid out once at its final size and revealed by the growing surface, so nothing reflows mid-move.

| Time from tap | What moves | Token |
|---|---|---|
| 0 | The scrim begins to fade in over 200 ms. Not now and Start are present and hittable (they are revealed by the surface edge, never faded) | `fadeMs` 200, `easing` |
| 0 to about 400 | One empty paper surface grows from the lead tile's frame to the full-height sheet; radius `sm` (8) to `xl` (28) at the top corners; spring with overshoot clamped | `motion.standard` (response 0.4 s, damping fraction 0.92), `overshootClamping: true` |
| 0 to about 400, same curve | The lead picture is carried from its place on the card to the first tile of the sheet (the same picture; it does not re-fade) | `motion.standard` clamped |
| from 60 percent of the way | Everything else in the body fades in, clipped to the paper so it never draws past its edge | `cardToPage.contentFrom` 0.6 |
| about 400 | Done. Heading takes focus | `sequenceMaxMs` 900 ceiling |

What animates: the one paper surface (frame, radius), the lead tile, the body's opacity, the scrim. What must not: Apple's view (4.7); Not now and Start (controls never animate in); any text (nothing is scaled, so letters are never stretched); the tab behind (no scale, no parallax, no blur, no dim other than the scrim); per-tile stagger in the grid; a spring that overshoots. The `standard` spring's damping ratio is 0.93, which overshoots by about 0.03 percent unclamped; the clamp makes "no bounce" true by construction rather than by tuning.

Reduce Motion: nothing moves; one 200 ms cross-fade, each way, as a hand-off (the leaving screen fades over its first 140 ms, the arriving one over its last 120 ms from 80 ms), exactly `CARD_TO_PAGE.handOff`. No carry. If the card was not measured, the column or type size changed, or the card scrolled away: the same cross-fade, or on a normal motion setting the door's rise (5.2). Android uses the same code.

Testing: a pure timeline function stepped ms by ms on three phones, as `transitions.test.ts` does for card-to-page. The frame budget (no frame over 16.7 ms on an iPhone SE 3) is a device row (DM-12), not a claim.

### 5.2 Door to sheet (no card to grow from)

The sheet rises from the bottom on `motion.standard` clamped, scrim 200 ms. A text row has no picture to carry. Reduce Motion: 200 ms cross-fade. If Apple's body is first, its view is mounted after the sheet stops, under the paper cover, which then fades over 200 ms (4.7).

### 5.3 Body swap (our day tiles and Apple's picker)

"Choose other pictures" and "This day's pictures" swap the body. Only OUR layer cross-fades, over `swapMs` 150 ms: going to Apple's body, our day layer (opaque paper) fades out over Apple's already-mounted view; coming back, our day layer fades in over it and Apple's view is then unmounted. Apple's view never changes opacity. Picks stay in the tray. Reduce Motion: unchanged (it is already a plain fade). VoiceOver: the new body's name is announced politely.

### 5.4 Sheet to capture (Start): the tray tiles fly in

PROPOSED, and the one place a carried object is justified: the tray tiles are real, still objects the parent just placed, and their flight tells the parent "these came with you". It needs a founder ruling on O-27 (the PRD says no flight in v1 and an option that carries one thing is off by default). Everywhere else in this spec nothing flies.

| Time from tap | What moves | Token |
|---|---|---|
| 0 | Hard-cut paper cover over Apple's view, if its body is showing. The tray's thumbnails are lifted to a layer above everything. Capture is already mounted beneath the sheet, opaque paper, its controls opaque from frame 1 | none |
| 0 to 160 | The sheet and scrim leave (opacity), revealing capture. Only the lifted tiles remain | `exitMs` 160 |
| 0 to 320 | Each lifted tile moves from its tray position to its place in capture (the lead tile to the picture slot, the rest to the strip) | `carryMs` 320 PROPOSED (D7 proposal, not in `tokens.ts` yet), `easing` |
| 320 | Capture is complete. The sheet is gone. Heading focus goes to capture | total 320 ms, well under 900 |

Never both at once: capture was mounted beneath, so two screens' words are never on screen together; only the carried tiles and the leaving sheet move. Capture's own arrival (talk dissolve, write rise) is bypassed on this path because the sheet's leave is the arrival (one move, not two).

Reduce Motion, or a tray with no thumbnails: no flight; the sheet and scrim fade over 200 ms and capture is already there with the pictures in place from the first frame.

### 5.5 Keep and landing

Keep is the existing saved moment (MOTION 5e), unchanged. After Keep the Book comes forward (A4-R20); returning to the tab is open (O-19, and the prototype returns to the tab so the source card's mark can be seen; its README says so). The next time the parent views Moments, the source card shows its still "A letter is here" row. If the tab is visible when the row appears, it fades in over 200 ms in place; otherwise it is simply there. Nothing on the tab celebrates, counts or moves because a letter was kept.

### 5.6 Not now on the sheet

If the source card is still on screen, the content fades over 160 ms while the paper returns to the lead tile's frame in 280 ms (`enter.durationMs`, timed on `easing`, no settle: leaving is shorter than arriving, MOTION 2), and the lead tile is carried back. If not, or if Apple's body is showing (cover first, hard cut), the sheet leaves downward over 160 ms. Reduce Motion: 200 ms fade. Picks and temporary copies are dropped. Nothing is announced; VoiceOver focus returns to the card's lead tile or the door row that opened it (the move of focus is the feedback).

### 5.7 Card removal when the parent says Not now

The card fades over 160 ms (`exitMs`); the cards below close the gap on `motion.standard` clamped; no confetti, no checkmark, no "x set aside", no count. An Undo control stays on screen until used or dismissed (it never times out); Undo returns the card to its slot with the `enter` move (8 pt, 280 ms) and plays the existing `tap` haptic. Reduce Motion: 200 ms fade, the gap closes at once. VoiceOver: "Set aside" announced politely, focus moves to the next card's heading (or the heading of the tab if it was the last); "Back where it was" on Undo.

### 5.8 Pull to refresh: none

The tab has no pull to refresh. For you is a finished set with no feed and nothing waiting (R123); the tab re-reads once when the app returns to the foreground or comes back from Settings (R77); a gesture without a button is not allowed anyway (R156) and a stretched control invites a feed mindset (EXH-CMO-7). If product later wants a refresh, it is a 44 pt button with no spinner (A1-R12).

### 5.9 Haptics

No new haptic. A haptic marks an outcome, never a navigation (MOTION 6). Opening a card, the sheet, the body swap, Start, Not now, the door and scrolling are silent. Selecting or putting back a tile in our body plays the existing `tap` intent ("choice picked"), throttled by the 100 ms rule; Undo plays `tap`; Keep plays its existing `success`. Apple's own haptics, sounds and motion inside its view are Apple's, outside our budget (R144) and named in NEW-6. iOS mutes haptics in Low Power Mode and during dictation, so nothing depends on one.

### 5.10 Unchanged and reused

Tab switch is the platform cut. For you and Recent cross-fade in place at `swapMs`. First view settles once. Picture arrival is one 200 ms fade from the flat paper tile, once per picture (A2-R8). Grant and Not now share one calm move (A3-R10, R16). None of these changes.

## 6. The motion map

IDs match the prototype's "Motion that just played" list. RM is the Reduce Motion form. VO is the VoiceOver behaviour.

| Id | Trigger | From | To | ms | Easing | Token | RM | VO |
|---|---|---|---|---|---|---|---|---|
| EM-01 | Tap a card's lead tile or Continue (day card) | Lead tile frame | Full-height sheet | about 400 (cap 420) | `standard` spring, clamped | `motion.standard`; scrim `fadeMs` 200; body from `cardToPage.contentFrom` 0.6 | 200 ms cross-fade (leave 140, arrive from 80 over 120), no carry | Sheet is modal; heading takes focus; nothing extra announced |
| EM-02 | Tap the door row | Bottom edge | Full-height sheet | about 400 | `standard` clamped | `motion.standard`; scrim 200 | 200 ms cross-fade | Same |
| EM-03 | Sheet settled with Apple's body | Cover opaque | Cover clear | 200 | `easing` | `fadeMs` | Same (it is a fade) | None (Apple's view speaks for itself) |
| EM-04 | "Choose other pictures" or "This day's pictures" | One body | The other | 150 | `easing` | `swapMs` | Same | New body's name announced; focus to the heading |
| EM-05 | Select or put back a tile | Ring and check off or on | On or off | 150 or snappy | `snappy` | `motion.snappy`; haptic `tap` | Opacity only, no scale | "Chosen" or "not chosen" on the tile; no count |
| EM-06 | Tray changes | Tray | Tray | none (thumbnail present at once) | none | none | Same | Limit line is a polite status, once |
| EM-07 | Tap Start | Sheet and tray | Capture | 160 leave, 320 fly | `easing` | `exitMs`, `carryMs` PROPOSED | No flight; 200 ms fade | Capture heading takes focus |
| EM-08 | Tap Not now, card on screen | Sheet | Card's lead tile | 160 fade, 280 return | `easing` timed | `exitMs`, `enter.durationMs` | 200 ms fade | Focus to the card; nothing announced |
| EM-09 | Not now, no card or Apple's body showing | Sheet | Off screen | 160 | `easing` | `exitMs` | 200 ms fade | Focus to the opener |
| EM-10 | App goes inactive with the sheet open | Sheet | Sheet under paper cover | 0 (hard cut) | none | none | Same | None |
| EM-11 | App lock engages with the sheet open | Sheet | Closed | 160 | `easing` | `exitMs` | 200 ms fade | The lock screen's own |
| EM-12 | Tap Not now on a card | Card in place | Card gone, gap closed | 160 fade, then gap on `standard` | `standard` clamped | `exitMs`, `motion.standard` | 200 ms fade, gap at once | "Set aside" polite; focus to next card heading |
| EM-13 | Undo | Gap | Card back in its slot | 280 | `easing` | `enter` (8 pt, 280); haptic `tap` | 200 ms fade | "Back where it was" |
| EM-14 | An iCloud pick arrives | Flat paper box in the tray | Thumbnail | 200 | `easing` | `fadeMs` | Same | The arriving line is a status once; no announcement on arrival |
| EM-15 | For you and Recent switch | One part | The other | 150 | `easing` | `swapMs` | Same | "For you, selected" |
| EM-16 | Parent answers Not now on the ask card | Ask and examples | Real list, door first | 590 in all | `standard` | A3-R10, R16 (existing) | 200 ms cross-fade | "Pictures are off for now" style line from `content` |
| EM-17 | First open of the tab | Nothing | First three cards | 280, 30 stagger | `easing` | `enter`, `staggerMs` | 200 ms fade | Heading read first |

## 7. The trust seam: where each wording goes

### 7.1 Principle

A parent can meet three voices: ours at the ask card, ours at the primer, and Apple's in its first-show panel inside the picker. All three are true because they describe different doors. The structure is design's; the words are `content`'s and the privacy chief's, written as one set in one sitting (EXH-DES-3); any line that changes what we promise on screen is a founder matter. The headline promise is the act the parent performs (pick pictures from a day, then speak); suggestions are a conditional second sentence only where the library read is on (EXH-CMO-1).

### 7.2 The three variants (inputs, from the CMO review; PROPOSED words, `{app}` is the public name from `packages/brand`)

- A, base (R192 wording, the one counsel is asked about): "{app} reads the date, the time and the place of your pictures, on this phone and only while Moments is open, to suggest days to tell {child} about."
- B, choice first (the challenger; the only one that tells the parent the picker exists): "You can choose pictures yourself any time. If you would like suggestions, {app} can read the date, time and place of your pictures, on this phone, while Moments is open."
- C, shortest (two plain sentences, for the small space of the ask card and for AX): "To suggest days, {app} reads the date, time and place of your pictures. It happens on this phone, only while Moments is open."

None says "allow", "access", "settings" (outside the denied line and Me), "private", "secure", "safe", "never" or "stays on your phone", and none says the app does not look at what is in the pictures unless counsel clears it in writing (R192).

### 7.3 Which wording goes where

| Surface | Whose words | Wording | Reason |
|---|---|---|---|
| Ask card (tab, ACC-0 only) | Ours | Variant C, with Show days and Not now equal (R71) | Small space; the ask card sits among real cards at any size |
| Primer sheet | Ours | Variant A as base; variant B as the challenger tested at G4. Four door lines behind one disclosure ("What this means"): Shown, Records, Never, Decline (R218, 8.5) | A is what counsel reads; B is more honest about the picker but is two sentences where R218 asks one (a one-sentence merge exists in the CMO review) |
| Apple's first-show panel inside the picker | Apple's | Not ours. We add no copy over, beside or within the first 3 seconds of it, and we do not paraphrase it (it may change) | A second voice next to Apple's would bury or contradict it |
| Host sheet heading, tray name, limit line, Start | Ours | The day's date or "Choose pictures"; "Pictures chosen for this letter"; "That is as many as one letter holds" (placeholder); "Start". No privacy claim, no absolute ("only", "never see"), no digit | EXH-PRV-11, EXH-CMO-12 |
| The door label | Ours | "Choose pictures" everywhere. The limited-library manager row uses a different kind of label with its own one-line purpose (for example "Pictures used for days" with "Change which pictures this app can use"); no two adjacent labels differ by one word | EXH-DES-6, EXH-PRV-6 |
| Denied line | Ours | The existing calm line with "Open Settings", on the tab and Me only | R76 |

### 7.4 Order and boundary rules

1. Opening the picker first is allowed and never triggers our primer.
2. Our primer is never shown between the door and Apple's view, and our frame stays quiet (heading, Not now) while Apple's panel is up.
3. A later ask is never described as more access to "pictures you choose".
4. The door is not marketed in store words or onboarding; it is a safe floor, a working action in every state (EXH-DES-16). Whether our primer and Apple's panel together mislead is counsel's question through the CLO, not a design judgement.

### 7.5 Shown, Records, Never and Decline (PRIV-R21, COORDINATION section 10)

| Door | Shown | Records | Never | Decline |
|---|---|---|---|---|
| Ask card | The variant C sentence; Show days and Not now equal | Nothing until the parent answers | No alert, no library call | Not now keeps every feature working; no return, no timer |
| Primer | Variant A (or B) and the policy link; the four lines behind one disclosure | On the phone only: that the primer was answered | No picture, date, album, place or count; no permission result in analytics | Not now and Don't Allow leave Export, Delete, capture and the door working; Turn off in Me removes the on-phone data at once |
| The door and the host sheet | The verb "Choose pictures" and the sheet | Nothing: choosing is not an agreement and creates no row | No event, no count, no log line, no stored identifier; a picked picture is never grouped, ranked, given a reason or a place | Not now closes the sheet and drops the picks |

## 8. Unhappy paths of the sheet

| # | Case | What the parent sees | What happens to picks | Notes |
|---|---|---|---|---|
| 1 | A picked picture is in iCloud | A flat paper box in the tray, one calm line ("One picture is still arriving. You can start now."), no spinner, no shimmer | Start is never blocked; capture shows the same flat box and it fills in on arrival; if it is still pending at Keep, one calm line offers to keep the letter without it | Who shows the download progress, and a native cancel, are engineering rows (EXH-SEC-5); UNVERIFIED how the system behaves with eight at once (DM-11) |
| 2 | Over the limit | Our body: the seventh tile is refused, the line shows, nothing already chosen is lost. Apple's body: Apple's own limit behaviour, plus our line whenever the tray is full | Kept | No digit anywhere in ours; what Apple draws is UNVERIFIED (DM-03) |
| 3 | The picker fails to open or load | Our frame, one calm line, "Try again", and a text row "Tell {child} without a picture" | Kept | A letter never needs a picture. Talk and Write stay one tap away. A closed error code, no path or detail |
| 4 | App lock engages with the sheet open | The sheet closes | Discarded, with temporary copies; nothing written | EM-11 |
| 5 | Phone goes inactive (call, notification pull-down, app switcher) | Our paper cover over the sheet | Held in memory, restored when the app is active | EM-10. If DM-09 fails, dismiss on background (4.7) |
| 6 | Access is revoked or downgraded while the sheet is open | The sheet closes calmly; the tab redraws in its new state in under a second with no message (R77) | Library-based picks dropped; the door stays | PROPOSED; a device row is owed (G7) |
| 7 | Offline | Our day body works (local thumbnails); iCloud-only items show a flat box | As row 1 | |
| 8 | A picked file cannot be read | Dropped with one calm line in capture (R91) | The rest are kept | |
| 9 | A parent cannot use Apple's grid (VoiceOver, Voice Control, Switch Control) | The failure row 3 text row; also Home's Speak and the question card need no picture | n/a | If DM-07 fails, the accessibility claim for starting from a picture is withheld until fixed (4.8) |
| 10 | The same picture is chosen in both bodies | Two tray tiles | Accepted; capture's delete handles it | Detectability UNVERIFIED |

## 9. Tests

### 9.1 The five-parent test script (G4 additions; the parent's own phone, held by the parent, no recording, synthetic or own pictures never shown to us)

Each task is read as "x of n" with no percentage below a group of 20 (PRD section 20). Bars are PROPOSED.

| Task | What the parent does | Observed | Bar |
|---|---|---|---|
| T1 | First open of the tab, never asked: "What is this tab for?" | Their words, before and after T3 | Answer stays about days to write about; if it shifts to "choosing pictures" the door weighs too much (EXH-DES-16) |
| T2 | Tap a day card, choose two pictures, press Start | Completes without help; says what is chosen | 5 of 5 complete; none asks what Start does |
| T3 | Choose pictures with the door, with access never asked | Whether they hesitate; what they say the app can now see | None thinks the app can see everything |
| T4 | Door below the ask card versus hidden until answered (prototype switch), then "you want pictures from a day, start a letter" | Which control they tap; whether the door takes a yes | Compare the two with the founder; default stays shown |
| T5 | Order test: use the picker once, then tap the ask card, then say what the ask card will do; then the reverse order | Expectation versus the primer | A wrong expectation is a content or order fix before ship (EXH-DES-3, EXH-CPO-2) |
| T6 | Primer variant A, then B (C on the ask card), in their own words: what can the app see after each? | Understanding | A minority cannot say; else labels or primer change (EXH-CMO-2, EXH-CMO-3) |
| T7 | AX5 with Bold Text on an iPhone SE 3: choose a picture through Apple's body, see it chosen, remove it, press Start | Completion | Pass bar for our frame and for the task (EXH-DES-4) |
| T8 | The same with VoiceOver on, and Voice Control or Switch Control for one parent | Completion | Same |
| T9 | After using the picker: "Did that feel like part of this app or a different one?" | Hesitation before tapping | None says a different app or hesitates (EXH-DES-8) |
| T10 | Hand the phone over with a card open: "Say what bothered you"; a card shows a picture they did not want to see | Whether Not now on the face solves it | If one parent hits it, R56 returns for the lead tile only (EXH-CMO-10) |
| T11 | Tell apart the limited-library row and the door from a screenshot | Correct labels | None confuses them (EXH-DES-6) |
| T12 | Choose the best of four near-identical pictures from one day at default size and at AX1 | Whether tile size is enough without a viewer | If a parent cannot, a no-zoom viewer returns in 1.1 (Q4, EXH-CMO-14) |

### 9.2 Device matrix (G1a and G7 additions; synthetic Asha files with synthetic dates and coordinates, never a real library, EXH-PRV-13). Ordered by what decides a layout (EXH-CPO-8)

| Id | Task | Decides | Who |
|---|---|---|---|
| DM-01 | Does the inline picker present under None, Limited and Full on iOS 17 and the newest OS? | Whether any layout | Founder or device operator |
| DM-02 | For each of bars shown, top hidden, bottom hidden, both hidden: record whether Albums, search, Options, Cancel, Add, the privacy badge and the first-show panel are reachable | Layout A, B or C (4.8) | Same |
| DM-03 | With the selection limit set, what does the picker show at the limit; does it draw a count anywhere | The limit line; whether Apple shows a number only where we cannot hide it | Same |
| DM-04 | Selection marks and numbers: with continuous selection and no ordering, does it number picks | Whether the founder sees "Apple may show a number, ours never does" | Same |
| DM-05 | Re-shown after being hidden: does it keep prior highlights | Whether the tray alone is the truth | Same |
| DM-06 | Interface style override in light, dark and with app and system themes differing | The theme fall-back | Same |
| DM-07 | iPhone SE 3, AX5, Bold Text: our frame versus the picker area; VoiceOver, Voice Control, Switch Control: choose, see, remove, Start | The AX bar; the accessibility claim (EXH-DES-4, EXH-DES-5) | Founder, device operator |
| DM-08 | First-show panel and badge with and without our frame, in light, dark and at AX5; does a clip or inset crop either | The seam (4.2) | Same |
| DM-09 | App switcher snapshot with the picker open; App lock return | Cover or dismiss-on-background (4.7) | Same |
| DM-10 | Does the view ignore touches with an ancestor opacity below 1, or with a transform | The mount-after-settle rule (4.7) | Same |
| DM-11 | Memory and time on an iPhone SE 3 with the inline view and the tray thumbnails; eight concurrent iCloud picks | Tray thumbnails or no thumbnails; Layout C | Same |
| DM-12 | Frame time of EM-01, EM-07 and EM-12 on an iPhone SE 3 and a 120 Hz phone | The budget (no frame over 16.7 ms on the SE 3) | Same |
| DM-13 | Reduce Motion, Reduce Transparency, Increase Contrast, dark: the host sheet and tab states | Our frame only | Same |

## 10. Test layers (our frame only)

Our frame (heading, tray, Start, Not now, door, body swap, AX layouts) is baselined at L3 with Apple's body replaced by a flat placeholder at the same size, which is what the prototype draws. Maestro flows stop at the host sheet and cannot reach inside Apple's view. Apple's body is a named device row at G7 with a still photograph for the record only. Store screenshots never include the picker body (EXH-DES-14) and cover the host sheet in the frame check that R194 already applies to the tab name.

## 11. Honest limits and UNVERIFIED

What we cannot style or test inside Apple's picker (all UNVERIFIED unless a review marked it read): its fonts and sizes; its colours and selection marks; selection numbers; video duration marks drawn over thumbnails; grid columns and thumbnail size; the privacy badge; the first-show panel's words; the Options menu and its words; Apple's search, Albums and bar controls where they remain; its motion and haptics; its VoiceOver labels and Dynamic Type behaviour (the session the reviews read is silent on both); its behaviour under Increase Contrast and Reduce Transparency; and that our code cannot read or capture its content. What we can style: everything around it.

UNVERIFIED in this spec:

1. Every device behaviour in section 9.2. I tested nothing on a phone.
2. That the `standard` spring with overshoot clamped ends visually within 420 ms on a device (the token says response 0.4 s; the prototype's web sampling ends at about 392 ms and is cut within 0.6 percent of rest, which is about 5 pt on a full-screen move).
3. That Reanimated 4.5.1 animates a growing parent's frame and radius at 60 Hz on an iPhone SE 3 without a dropped frame while its content is clipped; MOTION 5f's surface has no children whose layout moves, and this spec's does (clipped, laid out once at final size).
4. That a picker view mounted after the sheet settles starts fast enough that the paper cover is seen for less than a perceptible pause.
5. That the app-switcher snapshot is covered by our paper cover.
6. Whether Apple's view honours an interface-style override, and whether a duplicate pick can be detected.
7. The prototype is a web page checked in headless Chrome with no console errors; I did not test VoiceOver, a screen reader or a phone. Its springs are sampled into CSS `linear()` easing from the token stiffness and damping.
8. `docs/design/DESIGN_LANGUAGE.md` and `tokens.ts` were read in the parts cited (motion, radius, stroke, colour), not in full. I did not read Apple's PHPicker or PhotosPicker reference, the App Review Guidelines or any WWDC transcript; every Apple fact here comes from the delta and the reviews, which say what they read.

## 12. Rows and tokens to change, and hand-offs

Proposed PRD row changes (for `product`, one line each): R186 (a day card gains the lead tile first, the reason line, a city or occasion line and two actions; "one action" goes); the NS-53 5.3 anatomy order; R144 and the O-27 ruling (the Start hand-off carries the tray tiles); R106 (the door is one verb family and opens the same host sheet); R120 (the first value line states the act); R253 (the door's word is "Choose pictures").

Proposed token additions (for me to land in `packages/design-tokens/src/tokens.ts` with tests once the founder accepts): `motion.carry` { ms: 320 } (the D7 `carryMs` proposal); a `sheetTitle` use of title2 with `maxScale` 1.4; nothing else. Until accepted, they stay in this document.

Hand-offs: `mobile` builds `PickHostSheet`, the measured-rect expand, the body swap and the hand-off, with the unit tests of 5.1; `content` writes the words of sections 2 and 7 as one set with the privacy chief; `privacy` signs the label table before any store build carries the door (EXH-PRV-1) and the CMO and founder approve any store frame; the founder or a device operator runs section 9.2; the five-parent check runs section 9.1.
